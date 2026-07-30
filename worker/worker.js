// AirLog flight-lookup proxy — Cloudflare Worker
// -------------------------------------------------
// Sits between the AirLog browser app and AeroDataBox (via RapidAPI).
// - Hides the API key (stored as an encrypted secret: RAPIDAPI_KEY)
// - Adds CORS so the static site can read the response
// - Caches by (flightNo, date) to protect the limited monthly quota
// - Validates input and returns only the fields the trip form needs
//
// Deploy: see README.md in this folder.

// Origins allowed to use this proxy.
// Production is pinned; any localhost/127.0.0.1 port is allowed for local dev.
const ALLOWED_ORIGINS = new Set([
  "https://tsfu.github.io", // GitHub Pages (production)
]);
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN_RE.test(origin);
}

const FLIGHT_RE = /^[A-Z0-9]{2,3}\d{1,4}$/; // e.g. UA123, DLH400
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;      // YYYY-MM-DD
const CACHE_TTL = 86400;                    // 24h

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405, cors);
    }

    const url = new URL(request.url);
    const flightNo = (url.searchParams.get("no") || "").toUpperCase().replace(/\s+/g, "");
    const date = url.searchParams.get("date") || "";

    if (!FLIGHT_RE.test(flightNo)) return json({ error: "bad_flight_number" }, 400, cors);
    if (!DATE_RE.test(date))       return json({ error: "bad_date" }, 400, cors);

    // --- cache lookup (keyed by flight+date, independent of Origin) ---
    const cacheKey = new Request(`${url.origin}/c/${flightNo}/${date}`);
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) {
      const body = await hit.text();
      return json(JSON.parse(body), 200, cors, "HIT");
    }

    // --- call AeroDataBox via RapidAPI ---
    if (!env.RAPIDAPI_KEY) return json({ error: "server_misconfigured" }, 500, cors);
    const api =
      `https://aerodatabox.p.rapidapi.com/flights/number/${flightNo}/${date}` +
      `?withAircraftImage=false&withLocation=false`;

    let upstream;
    try {
      upstream = await fetch(api, {
        headers: {
          "X-RapidAPI-Key": env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
        },
      });
    } catch {
      return json({ error: "upstream_unreachable" }, 502, cors);
    }

    if (upstream.status === 404) return json({ flightNo, date, legs: [] }, 200, cors);
    if (!upstream.ok) {
      return json({ error: "upstream_error", status: upstream.status }, 502, cors);
    }

    const raw = await upstream.json();
    const legs = (Array.isArray(raw) ? raw : []).map(normalizeLeg);
    const payload = { flightNo, date, legs };

    // --- store in cache (origin-independent copy) ---
    ctx.waitUntil(
      cache.put(
        cacheKey,
        new Response(JSON.stringify(payload), {
          headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${CACHE_TTL}` },
        })
      )
    );

    return json(payload, 200, cors, "MISS");
  },
};

// Map AeroDataBox fields -> exactly what the AirLog trip form needs.
function normalizeLeg(f) {
  const dep = f.departure || {}, arr = f.arrival || {}, ac = f.aircraft || {};
  const city = (a) => a?.municipalityName || a?.shortName || a?.name || "";
  return {
    departureIATA: dep.airport?.iata || "",
    departureCity: city(dep.airport),
    arrivalIATA:   arr.airport?.iata || "",
    arrivalCity:   city(arr.airport),
    takeOffTime:   toLocalInput(dep.scheduledTime?.local),
    landingTime:   toLocalInput(arr.scheduledTime?.local),
    airlineIATA:   f.airline?.iata || "",
    airlineICAO:   f.airline?.icao || "", // form stores airlines by ICAO
    airlineName:   f.airline?.name || "",
    aircraft:      ac.model || "",        // model name; frontend maps to its code
    tailNumber:    ac.reg || "",
    isCargo:       !!f.isCargo,
  };
}

// "2026-07-25 07:45+01:00" -> "2026-07-25T07:45" (value for <input type=datetime-local>)
function toLocalInput(s) {
  if (!s) return "";
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

function corsHeaders(origin) {
  const h = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (isAllowedOrigin(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(obj, status, cors, cacheState) {
  const headers = { "Content-Type": "application/json", ...cors };
  if (cacheState) headers["X-Cache"] = cacheState;
  return new Response(JSON.stringify(obj), { status, headers });
}

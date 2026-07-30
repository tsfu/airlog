# AirLog flight-lookup proxy (Cloudflare Worker)

A tiny serverless proxy between the AirLog browser app and AeroDataBox (via RapidAPI).
It hides the API key, adds CORS, caches responses, and returns only the fields the trip
form needs. See `worker.js` for the logic.

**You need a free Cloudflare account** (no credit card). Free plan = 100k requests/day.

---

## Option A — Dashboard (no tooling, ~10 min)

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it `airlog-flight` → **Deploy** (creates a placeholder).
3. Click **Edit code**, delete the sample, paste the contents of `worker.js`, **Deploy**.
4. Add the API key as a secret: **Settings** → **Variables and Secrets** →
   **Add** → type **Secret** → name `RAPIDAPI_KEY`, value = your RapidAPI key → **Save/Deploy**.
5. Copy your Worker URL, e.g. `https://airlog-flight.<your-subdomain>.workers.dev`.

## Option B — Wrangler CLI (versioned, nicer for repeat deploys)

```bash
npm install -g wrangler
wrangler login                       # opens browser to authorize
cd worker
wrangler secret put RAPIDAPI_KEY     # paste key when prompted (never stored in repo)
wrangler deploy
```

---

## Configure allowed origins

Edit `ALLOWED_ORIGINS` at the top of `worker.js` so it lists exactly the sites that may
call the proxy. Defaults:

```js
const ALLOWED_ORIGINS = new Set([
  "https://tsfu.github.io",   // production (GitHub Pages)
  "http://localhost:8080",    // local dev
  "http://127.0.0.1:8080",
]);
```

Redeploy after changing.

---

## Test it

```bash
# Should return JSON with a "legs" array:
curl "https://airlog-flight.<your-subdomain>.workers.dev/?no=UA123&date=2026-07-25"

# Second identical call should come from cache (response header: X-Cache: HIT)
curl -i "https://airlog-flight.<your-subdomain>.workers.dev/?no=UA123&date=2026-07-25" | grep -i x-cache
```

Response shape:

```json
{
  "flightNo": "UA123",
  "date": "2026-07-25",
  "legs": [
    {
      "departureIATA": "LHR", "departureCity": "London",
      "arrivalIATA": "EWR",   "arrivalCity": "Newark",
      "takeOffTime": "2026-07-25T07:45", "landingTime": "2026-07-25T10:30",
      "airlineIATA": "UA", "airlineICAO": "UAL", "airlineName": "United Airlines",
      "aircraft": "Boeing 787-9", "tailNumber": "N26960",
      "isCargo": false
    }
  ]
}
```

---

## Quota notes

- AeroDataBox free tier: ~2400 requests/month, 1 req/sec.
- The Worker caches each `(flightNo, date)` for 24h, so re-opening/editing a trip does not
  spend extra quota (look for `X-Cache: HIT`).

## Security

- The key is stored only as a Cloudflare **secret** — never in this repo or the browser.
- **Rotate the RapidAPI key** if it was ever echoed to a terminal / committed by accident.

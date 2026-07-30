const csvFilePath = "./data/airports.csv";
const airlineJsonPath = "./data/airlines.json";
const aircraftJsonPath = "./data/aircrafts.json";

const airportDataMap = new Map();
const airlineDataMap = new Map();
const aircraftDataMap = new Map();
const airportTimezoneCache = new Map();

const DateTime = luxon.DateTime;

function normalizeIATACode(value) {
  return (value || "").toString().trim().substring(0, 3).toUpperCase();
}

function normalizeFlightNumber(value) {
  return (value || "").toString().trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeDateTimeInput(value) {
  const text = (value || "").toString().trim().replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    return text + ":00";
  }
  return text;
}

function isValidDateTimeInput(value) {
  const normalized = normalizeDateTimeInput(value);
  if (!normalized) {
    return false;
  }
  return DateTime.fromISO(normalized).isValid;
}

function isValidDurationText(value) {
  const text = (value || "").toString().trim();
  const match = text.match(/^(\d+)\s*h\s*(\d+)\s*min$/i);
  if (!match) {
    return false;
  }
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  return Number.isFinite(hours) && Number.isFinite(mins) && mins >= 0 && mins < 60;
}

function isValidDistanceText(value) {
  const text = (value || "").toString().trim();
  return /^\d+(\.\d+)?\s*km$/i.test(text);
}

function getTripDuplicateKeyFromValues(
  departureIATA,
  arrivalIATA,
  takeOffTime,
  flightNumber,
  landingTime = ""
) {
  const dep = normalizeIATACode(departureIATA);
  const arr = normalizeIATACode(arrivalIATA);
  const takeoff = (takeOffTime || "").toString().trim().substring(0, 16);
  const landing = (landingTime || "").toString().trim().substring(0, 16);
  const flight = normalizeFlightNumber(flightNumber);
  // If flight number is missing, include landing time to reduce collisions.
  return (
    takeoff + "|" + landing + "|" + dep + "|" + arr + "|" + (flight || "--")
  );
}

function getTripDuplicateKey(trip) {
  if (!trip) {
    return "";
  }
  return getTripDuplicateKeyFromValues(
    trip.departureIATA,
    trip.arrivalIATA,
    trip.takeOffTime,
    trip.flightNumber,
    trip.landingTime
  );
}

function buildExistingTripDuplicateKeySet() {
  const keys = new Set();
  trips.forEach((trip) => {
    const key = getTripDuplicateKey(trip);
    if (key) {
      keys.add(key);
    }
  });
  return keys;
}

function pushImportIssueSample(samples, text, maxSamples = 8) {
  if (samples.length < maxSamples) {
    samples.push(text);
  }
}

function buildImportSummaryMessage(
  sourceLabel,
  totalRows,
  validRows,
  invalidRows,
  duplicateRows,
  issueSamples
) {
  let message =
    sourceLabel +
    " import preview\n\n" +
    "Total rows: " +
    totalRows +
    "\n" +
    "Ready to import: " +
    validRows +
    "\n" +
    "Invalid rows: " +
    invalidRows +
    "\n" +
    "Duplicate rows: " +
    duplicateRows;

  if (issueSamples.length > 0) {
    message += "\n\nExamples:\n" + issueSamples.map((x) => "- " + x).join("\n");
  }
  return message;
}

async function getAirportTimezone(iata) {
  const normalizedIata = normalizeIATACode(iata);
  if (airportTimezoneCache.has(normalizedIata)) {
    return airportTimezoneCache.get(normalizedIata);
  }
  const coords = IATAtoCoordinates(normalizedIata);
  if (!coords) {
    throw new Error("Airport coordinates not found for " + normalizedIata);
  }
  const result = await GeoTZ.find(coords.latitude, coords.longitude);
  if (!Array.isArray(result) || result.length < 1) {
    throw new Error("Timezone not found for " + normalizedIata);
  }
  airportTimezoneCache.set(normalizedIata, result[0]);
  return result[0];
}

function minutesToDurationText(totalMinutes) {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return sign + hours + "h " + minutes + "min";
}

// when there is no trip at all, show "demo" button, otherwise hide it
function toggleDemoButton() {
  const demo = $("#demoButton").parent();
  if (trips.length < 1) {
    console.log("INFO: No trip loaded, showing demo option.");
    demo.show();
  } else {
    console.log("INFO: Trips loaded, hidding demo option.");
    demo.hide();
  }
}

// import demo trips for diaply
async function demo() {
  console.log("INFO: importing demo trips...");
  try {
    const response = await fetch("./data/sample_trips.json");
    if (!response.ok) {
      throw new Error(`Fetch error, status: ${response.status}`);
    }
    // Parse the JSON data
    const importedTrips = await response.json();
    for (const importedTrip of importedTrips) {
      await addTrip(
        importedTrip.id,
        importedTrip.departureCity,
        importedTrip.departureIATA,
        importedTrip.arrivalCity,
        importedTrip.arrivalIATA,
        importedTrip.takeOffTime,
        importedTrip.landingTime,
        importedTrip.duration,
        importedTrip.distance,
        importedTrip.flightNumber,
        importedTrip.airline,
        importedTrip.aircraft,
        importedTrip.tailNumber,
        importedTrip.seatClass,
        importedTrip.seatNumber,
        { skipPersist: true, skipRender: true }
      );
    }
    await saveTripsToStorage(trips);
    refreshGlobeRoutes(viewer);
    // remove demo button and show table
    loadStats();
    toggleTableDisplay();
    toggleDemoButton();
  } catch (error) {
    console.error("Error loading or parsing JSON File:", error);
  }
  console.log("INFO: Successfully loaded demo trips.");
}

async function importFR24(event) {
  const fr24Data = event.target.result;
  try {
    // parse CSV data using PapaParse
    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(fr24Data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });

    const existingKeys = buildExistingTripDuplicateKeySet();
    const batchKeys = new Set();
    const issueSamples = [];
    const candidates = [];
    let invalidRows = 0;
    let duplicateRows = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const rowNumber = i + 2; // row 1 is CSV header
      const candidateResult = buildFR24ImportCandidate(parsedData[i], rowNumber);
      if (!candidateResult.ok) {
        invalidRows += 1;
        pushImportIssueSample(issueSamples, candidateResult.reason);
        continue;
      }
      if (
        existingKeys.has(candidateResult.key) ||
        batchKeys.has(candidateResult.key)
      ) {
        duplicateRows += 1;
        pushImportIssueSample(
          issueSamples,
          "Row " +
            rowNumber +
            ": duplicate flight (" +
            candidateResult.data.departureIATA +
            "-" +
            candidateResult.data.arrivalIATA +
            " " +
            candidateResult.data.takeOffTime.substring(0, 10) +
            ")."
        );
        continue;
      }
      batchKeys.add(candidateResult.key);
      candidates.push(candidateResult.data);
    }

    const previewMessage = buildImportSummaryMessage(
      "myFlightRadar24 CSV",
      parsedData.length,
      candidates.length,
      invalidRows,
      duplicateRows,
      issueSamples
    );
    if (candidates.length < 1) {
      alert(previewMessage);
      return;
    }
    const shouldImport = window.confirm(
      previewMessage + "\n\nContinue importing these trips?"
    );
    if (!shouldImport) {
      return;
    }

    const commitErrors = [];
    for (const candidate of candidates) {
      try {
        await commitFR24ImportCandidate(candidate, {
          skipPersist: true,
          skipRender: true,
        });
      } catch (error) {
        pushImportIssueSample(
          commitErrors,
          "Row " + candidate.rowNumber + ": " + error.message
        );
      }
    }
    if (commitErrors.length > 0) {
      alert(
        "Some rows failed while importing:\n" + commitErrors.map((x) => "- " + x).join("\n")
      );
    }

    await saveTripsToStorage(trips);
    refreshGlobeRoutes(viewer);
    toggleDemoButton();
    loadStats();
    console.log("INFO: Trips imported from myFR24 formatted csv file.");
  } catch (error) {
    console.error("Error occurred while importing trips from csv file:", error);
  }
}

// helper to parse a trip item from myFR24 csv file to our trip json object
async function parseFRTrip(item, options = {}) {
  const candidate = buildFR24ImportCandidate(item, 0);
  if (!candidate.ok) {
    throw new Error(candidate.reason);
  }
  await commitFR24ImportCandidate(candidate.data, options);
}

function parseDateForFR24(value) {
  const text = (value || "").toString().trim();
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return isoMatch[0];
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().substring(0, 10);
}

function parseFR24Duration(value) {
  const text = (value || "").toString().trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }
  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    raw: text,
  };
}

function buildFR24ImportCandidate(item, rowNumber) {
  const fromText = (item.From || "").toString();
  const toText = (item.To || "").toString();
  const departureIATA = normalizeIATACode(fromText.slice(-9).substring(0, 3));
  const arrivalIATA = normalizeIATACode(toText.slice(-9).substring(0, 3));
  if (!isValidAirport(departureIATA)) {
    return {
      ok: false,
      reason:
        "Row " + rowNumber + ": airport IATA not found for departure (" + departureIATA + ").",
    };
  }
  if (!isValidAirport(arrivalIATA)) {
    return {
      ok: false,
      reason:
        "Row " + rowNumber + ": airport IATA not found for arrival (" + arrivalIATA + ").",
    };
  }

  const datePart = parseDateForFR24(item.Date);
  const depTimePart = (item["Dep time"] || "").toString().trim().substring(0, 5);
  if (!datePart || depTimePart.length !== 5) {
    return {
      ok: false,
      reason: "Row " + rowNumber + ": invalid departure date/time.",
    };
  }

  const durationParts = parseFR24Duration(item.Duration);
  if (!durationParts) {
    return {
      ok: false,
      reason: "Row " + rowNumber + ": invalid duration format.",
    };
  }

  const takeOffTime = datePart + "T" + depTimePart;
  const departureCity =
    fromText.split("/")[0].trim() || airportDataMap.get(departureIATA).city || "";
  const arrivalCity =
    toText.split("/")[0].trim() || airportDataMap.get(arrivalIATA).city || "";
  const flightNumber = normalizeFlightNumber(item["Flight number"]);

  const airlineCandidate = (item.Airline || "")
    .toString()
    .slice(-4)
    .substring(0, 3)
    .toUpperCase();
  const airline = airlineDataMap.has(airlineCandidate) ? airlineCandidate : "";
  const aircraft = aircraftICAO2IATA(
    (item.Aircraft || "").toString().slice(-5).substring(0, 4).toUpperCase()
  );

  return {
    ok: true,
    key: getTripDuplicateKeyFromValues(
      departureIATA,
      arrivalIATA,
      takeOffTime,
      flightNumber
    ),
    data: {
      rowNumber: rowNumber,
      departureCity: departureCity,
      departureIATA: departureIATA,
      arrivalCity: arrivalCity,
      arrivalIATA: arrivalIATA,
      takeOffTime: takeOffTime,
      durationRaw: durationParts.raw,
      durationParts: durationParts,
      distance: getDistance(departureIATA, arrivalIATA),
      flightNumber: flightNumber,
      airline: airline,
      aircraft: aircraft,
      tailNumber: (item.Registration || "").toString().trim(),
      seatClass: seatClassFR24(item["Flight class"]),
      seatNumber: (item["Seat number"] || "").toString().trim(),
    },
  };
}

async function commitFR24ImportCandidate(candidate, options = {}) {
  const landingTime = await getArrivalDateTime(
    candidate.departureIATA,
    candidate.arrivalIATA,
    candidate.takeOffTime,
    candidate.durationParts || candidate.durationRaw
  );
  const parsedDuration =
    candidate.durationParts || parseFR24Duration(candidate.durationRaw);
  if (!parsedDuration) {
    throw new Error("Invalid duration format.");
  }
  const totalMinutes = Math.round(
    (parsedDuration.hours * 3600 +
      parsedDuration.minutes * 60 +
      parsedDuration.seconds) /
      60
  );
  const durationText = minutesToDurationText(totalMinutes);

  await addTrip(
    "",
    candidate.departureCity,
    candidate.departureIATA,
    candidate.arrivalCity,
    candidate.arrivalIATA,
    candidate.takeOffTime,
    landingTime,
    durationText,
    candidate.distance,
    candidate.flightNumber,
    candidate.airline,
    candidate.aircraft,
    candidate.tailNumber,
    candidate.seatClass,
    candidate.seatNumber,
    options
  );
}

// calculate arrival DateTime based on trip info (for myFR24 import)
// since duration is calculated in addTrip(), must use correct departure/arrival date and time
async function getArrivalDateTime(
  departureIATA,
  arrivalIATA,
  takeoff,
  duration
) {
  const parsedDuration =
    typeof duration === "string" ? parseFR24Duration(duration) : duration;
  if (!parsedDuration) {
    throw new Error("Invalid duration format for arrival time calculation.");
  }
  const departureTZ = await getAirportTimezone(departureIATA);
  const arrivalTZ = await getAirportTimezone(arrivalIATA);
  const depDate = DateTime.fromISO(normalizeDateTimeInput(takeoff), {
    zone: departureTZ,
  });
  let arrDate = depDate.plus({
    hours: parsedDuration.hours,
    minutes: parsedDuration.minutes,
    seconds: parsedDuration.seconds,
  });
  // convert to our string format
  arrDate = arrDate
    .setZone(arrivalTZ)
    .toISO({ includeOffset: false })
    .substring(0, 16);
  return arrDate;
}

function aircraftICAO2IATA(icao) {
  // this is not perfect since one ICAO may be linked to multiple IATAs.
  for (let [k, v] of aircraftDataMap) {
    if (v.icao_code == icao) {
      return k;
    }
  }
  return "";
}

function seatClassFR24(key) {
  if (key == 1) {
    return "Economy";
  } else if (key == 2) {
    return "Business";
  } else if (key == 3) {
    return "First";
  } else if (key == 4) {
    return "Economy+";
  } else if (key == 5) {
    return "Private";
  } else {
    return "";
  }
}

// generate a unique ID for trip
function constructID(trip) {
  if (trip.id == null || trip.id == "") {
    let ID =
      trip.departureIATA +
      trip.arrivalIATA +
      trip.takeOffTime.replace(/\D/g, "");
    while (trips.find((obj) => obj.id == ID)) {
      ID = ID + "1";
    }
    return ID;
  }
  while (trips.find((obj) => obj.id == trip.id)) {
    trip.id = trip.id + "1";
  }
  return trip.id;
}

// construct ID code indexed map for airports/airlines/aircrafts
async function getAirportDataAsync() {
  try {
    // Step 1: Fetch CSV data using $.ajax wrapped in a promise
    const csvData = await new Promise((resolve, reject) => {
      $.ajax({
        url: csvFilePath,
        success: (data) => resolve(data),
        error: (err) => reject(err),
      });
    });

    // Step 2: Parse CSV data using PapaParse wrapped in a promise
    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });

    // Step 3: Store parsed data in the map
    parsedData.forEach((airport) => {
      airportDataMap.set(airport.iata, airport);
    });

    console.log("INFO: Airport data map is now completed. Index:IATA");
  } catch (error) {
    console.error("Error occurred while building airport data map:", error);
  }
}

async function getAirlineDataAsync() {
  try {
    // fetch airlines json data
    const airlineData = await new Promise((resolve, reject) => {
      $.ajax({
        url: airlineJsonPath,
        success: (data) => resolve(data),
        error: (err) => reject(err),
      });
    });
    // k-v map based on airline ICAO (unique)
    airlineData.forEach((airline) => {
      // drop entries missing ICAO key
      if (airline.icao) {
        airlineDataMap.set(airline.icao, airline);
      }
    });

    console.log("INFO: Airline data map is now completed. Index:ICAO");
  } catch (error) {
    console.error("Error occurred while building airline data map:", error);
  }
}

async function getAircraftDataAsync() {
  try {
    // fetch aircraft json data
    const aircraftData = await new Promise((resolve, reject) => {
      $.ajax({
        url: aircraftJsonPath,
        success: (data) => resolve(data),
        error: (err) => reject(err),
      });
    });
    // k-v map based on aircraft ICAO
    aircraftData.forEach((aircraft) => {
      // drop those without ICAO
      if (aircraft.icao_code) {
        // note that one ICAO code can have several aircraft models, so it's a k - [v,v,v] map.
        // we still use ICAO because the unique IATA code is not well-known
        aircraftDataMap.set(aircraft.iata_code, aircraft);
      }
    });

    console.log("INFO: Aircraft data map is now completed. Index:ICAO");
  } catch (error) {
    console.error("Error occurred while building aircraft data map:", error);
  }
}

function isValidAirport(iata) {
  return airportDataMap.has(iata);
}

function optionToCode(option) {
  // when user select the option it would be "FullName (XXX/ABC)" where we need ABC.
  if (option.length > 3) {
    return option.slice(-4).substring(0, 3).toUpperCase();
  }
  return option.toUpperCase();
}

// populate autocomplete options for datalist (for trip Form input)
function populateInputOptions() {
  const airportDataList = $("#airportIATA");
  const airlineDataList = $("#airlineIATA");
  const aircraftDataList = $("#aircraftICAO");

  airportDataMap.forEach((v, k) => {
    const option = document.createElement("option");
    const item = v.iata + " (" + v.airport + ")"; // option value = "BOS (Logan Airport)"
    option.value = item;
    airportDataList.append(option);
  });

  airlineDataMap.forEach((v, k) => {
    const option = document.createElement("option");
    const item =
      v.name + " (" + (v.iata || "--") + "/" + v.icao + ")"; // option value = "Delta Airlines (DL/DAL)"
    option.value = item;
    airlineDataList.append(option);
  });

  aircraftDataMap.forEach((v, k) => {
    const option = document.createElement("option");
    const item = v.name + " (" + v.icao_code + "/" + v.iata_code + ")"; // option value = "Airbus A380-800 (A388/388)"
    option.value = item;
    aircraftDataList.append(option);
  });
  console.log("INFO: Airports/airlines/aircrafts input options ready.");
}

// Helper: map IATA code to GPS coordinates
function IATAtoCoordinates(iataCode) {
  const airport = airportDataMap.get(iataCode.trim().toUpperCase());
  if (airport) {
    return {
      latitude: parseFloat(airport.latitude),
      longitude: parseFloat(airport.longitude),
    };
  } else {
    console.log("error: IATA code not found.");
    return null;
  }
}

// Helper: calculate p2p distance on earth
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // Convert degrees to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180; // Convert degrees to radians
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Calculate flight distance between 2 airports
function getDistance(departureIATA, arrivalIATA) {
  const departureCoords = IATAtoCoordinates(departureIATA);
  const arrivalCoords = IATAtoCoordinates(arrivalIATA);
  const distance = haversineDistance(
    departureCoords.latitude,
    departureCoords.longitude,
    arrivalCoords.latitude,
    arrivalCoords.longitude
  );
  return distance.toFixed(2) + "km";
}

// Calculate flight duration
async function getDuration(takeoff, landing, departureIATA, arrivalIATA) {
  // consider timezone offset given IATA code
  const departureTZ = await getAirportTimezone(departureIATA);
  const arrivalTZ = await getAirportTimezone(arrivalIATA);

  const departureDate = DateTime.fromISO(normalizeDateTimeInput(takeoff), {
    zone: departureTZ,
  });
  const arrivalDate = DateTime.fromISO(normalizeDateTimeInput(landing), {
    zone: arrivalTZ,
  });
  if (!departureDate.isValid || !arrivalDate.isValid) {
    throw new Error("Invalid takeoff/landing datetime.");
  }

  const totalMinutes = Math.round(
    arrivalDate.diff(departureDate, "minutes").minutes
  );
  if (!Number.isFinite(totalMinutes)) {
    throw new Error("Cannot calculate duration from given datetime values.");
  }
  return minutesToDurationText(totalMinutes);
}

// Function to draw flight route on the globe using CesiumJS
function drawFlightRoute(viewer, trip, routeCountMap, pointCountMap) {
  const departureCoords = IATAtoCoordinates(trip.departureIATA);
  const arrivalCoords = IATAtoCoordinates(trip.arrivalIATA);

  const departureCartesian = Cesium.Cartesian3.fromDegrees(
    departureCoords.longitude,
    departureCoords.latitude
  );
  const arrivalCartesian = Cesium.Cartesian3.fromDegrees(
    arrivalCoords.longitude,
    arrivalCoords.latitude
  );

  const routeId = normalizeRouteKey(trip.departureIATA, trip.arrivalIATA);
  const routeCount = (routeCountMap
    ? routeCountMap.get(routeId)
    : getRouteCount(trip.departureIATA, trip.arrivalIATA)) || 0;
  const departureCount = (pointCountMap
    ? pointCountMap.get(trip.departureIATA)
    : getPointCount(trip.departureIATA)) || 0;
  const arrivalCount = (pointCountMap
    ? pointCountMap.get(trip.arrivalIATA)
    : getPointCount(trip.arrivalIATA)) || 0;

  // remove current entity to draw new ones
  removeFlightRoute(viewer, trip);

  viewer.entities.add({
    id: "route-" + routeId,
    polyline: {
      positions: [departureCartesian, arrivalCartesian],
      width: getRouteWeight(routeCount),
      material: getRouteColor(routeCount),
      clampToGround: false, // Keep it floating
    },
  });

  // Add a dot at the departure city
  viewer.entities.add({
    id: "point-" + trip.departureIATA,
    position: departureCartesian,
    point: {
      pixelSize: getPointSize(departureCount),
      color: getPointColor(departureCount),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: trip.departureIATA,
      font: "16px sans-serif",
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        0.0,
        5500000.0
      ), // only show IATA label when zoom in
    },
  });

  // Add a dot at the arrival city
  viewer.entities.add({
    id: "point-" + trip.arrivalIATA,
    position: arrivalCartesian,
    point: {
      pixelSize: getPointSize(arrivalCount),
      color: getPointColor(arrivalCount),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: trip.arrivalIATA,
      font: "16px sans-serif",
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        0.0,
        5500000.0
      ), // only show IATA label when zoom in
    },
  });
}

function removeFlightRoute(viewer, trip) {
  const routeId = normalizeRouteKey(trip.departureIATA, trip.arrivalIATA);
  viewer.entities.removeById("route-" + routeId); // Remove the flight route
  viewer.entities.removeById("point-" + trip.departureIATA); // Remove the departure dot
  viewer.entities.removeById("point-" + trip.arrivalIATA); // Remove the arrival dot
}

function normalizeRouteKey(iata1, iata2) {
  return iata1 < iata2 ? iata1 + "-" + iata2 : iata2 + "-" + iata1;
}

// Rebuild route/airport count maps once and reuse for globe redraw.
function getRouteAndPointCounts() {
  const routeCountMap = new Map();
  const pointCountMap = new Map();
  trips.forEach((trip) => {
    const routeKey = normalizeRouteKey(trip.departureIATA, trip.arrivalIATA);
    routeCountMap.set(routeKey, (routeCountMap.get(routeKey) || 0) + 1);
    pointCountMap.set(
      trip.departureIATA,
      (pointCountMap.get(trip.departureIATA) || 0) + 1
    );
    pointCountMap.set(
      trip.arrivalIATA,
      (pointCountMap.get(trip.arrivalIATA) || 0) + 1
    );
  });
  return { routeCountMap, pointCountMap };
}

function refreshGlobeRoutes(viewer) {
  viewer.entities.removeAll();
  const { routeCountMap, pointCountMap } = getRouteAndPointCounts();
  trips.forEach((trip) => {
    drawFlightRoute(viewer, trip, routeCountMap, pointCountMap);
  });
}

// Functions to draw different color or weight based on route/airport frequency
function getRouteCount(iata1, iata2) {
  let routeCountMap = new Map();
  trips.forEach((trip) => {
    const key1 = trip.departureIATA + "-" + trip.arrivalIATA;
    const key2 = trip.arrivalIATA + "-" + trip.departureIATA;
    // switched departure/arrival counts as same route
    if (routeCountMap.has(key1)) {
      routeCountMap.set(key1, routeCountMap.get(key1) + 1);
    } else if (routeCountMap.has(key2)) {
      routeCountMap.set(key2, routeCountMap.get(key2) + 1);
    } else {
      routeCountMap.set(key1, 1);
    }
  });
  const r1 = iata1 + "-" + iata2;
  const r2 = iata2 + "-" + iata1;
  let count = 0;
  if (routeCountMap.has(r1)) {
    count = routeCountMap.get(r1);
  } else {
    count = routeCountMap.get(r2);
  }
  return count;
}

function getRouteColor(count) {
  if (count <= 1) {
    return Object.freeze(Cesium.Color.fromCssColorString("#FFFDF6"));
  } else if (count === 2) {
    return Object.freeze(Cesium.Color.fromCssColorString("#FFF8E8"));
  } else if (count <= 4) {
    return Object.freeze(Cesium.Color.fromCssColorString("#FFF2D3"));
  } else {
    return Object.freeze(Cesium.Color.fromCssColorString("#FFE9BB"));
  }
}

function getRouteWeight(count) {
  if (count <= 1) {
    return 1;
  } else if (count === 2) {
    return 2;
  } else if (count <= 4) {
    return 3;
  } else {
    return 4;
  }
}

function getPointCount(iata) {
  let airportCountMap = new Map();
  trips.forEach((trip) => {
    const key1 = trip.departureIATA;
    const key2 = trip.arrivalIATA;
    // add count for both departure and arrival airports
    if (airportCountMap.has(key1)) {
      airportCountMap.set(key1, airportCountMap.get(key1) + 1);
    } else {
      airportCountMap.set(key1, 1);
    }
    if (airportCountMap.has(key2)) {
      airportCountMap.set(key2, airportCountMap.get(key2) + 1);
    } else {
      airportCountMap.set(key2, 1);
    }
  });
  return airportCountMap.get(iata);
}

function getPointColor(count) {
  if (count <= 1) {
    return Cesium.Color.fromCssColorString("#E7F0FF");
  } else if (count <= 4) {
    return Cesium.Color.fromCssColorString("#D3E4FF");
  } else if (count <= 10) {
    return Cesium.Color.fromCssColorString("#BCD7FF");
  } else {
    return Cesium.Color.fromCssColorString("#A2C8FA");
  }
}

function getPointSize(count) {
  if (count <= 1) {
    return 6;
  } else if (count <= 4) {
    return 7;
  } else if (count <= 10) {
    return 8;
  } else {
    return 9;
  }
}

// ---- Flight lookup / autofill helpers (pure, data-map based) ----

// Whole-day difference between a YYYY-MM-DD string and today (can be negative).
function daysFromToday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

// Best-effort: map an API aircraft model name to a form datalist option string.
function findAircraftOptionByModel(modelName) {
  const norm = (s) => (s || "").toString().toLowerCase().replace(/[\s-]/g, "");
  const target = norm(modelName);
  if (!target) return "";
  for (const [, v] of aircraftDataMap) {
    if (norm(v.name) === target) {
      return v.name + " (" + v.icao_code + "/" + v.iata_code + ")";
    }
  }
  return "";
}

// Build the datalist-style option string the airline field expects.
function airlineOptionString(a) {
  return a.name + " (" + (a.iata || "--") + "/" + a.icao + ")";
}

// Find an airline entry by IATA code (airlineDataMap is keyed by ICAO).
function findAirlineByIata(iata) {
  if (!iata) return null;
  const up = iata.toString().toUpperCase();
  for (const [, v] of airlineDataMap) {
    if ((v.iata || "").toUpperCase() === up) return v;
  }
  return null;
}

// Resolve the best airline value from the leg + flight number, in priority order:
// 1) API ICAO (direct map key), 2) API IATA, 3) code parsed from the flight number.
function resolveAirlineValue(leg, flightNo) {
  if (leg.airlineICAO && airlineDataMap.has(leg.airlineICAO)) {
    return airlineOptionString(airlineDataMap.get(leg.airlineICAO));
  }
  let a = findAirlineByIata(leg.airlineIATA);
  if (a) return airlineOptionString(a);

  // Fall back to the airline designator in the flight number (e.g. "UA123" -> "UA").
  const prefix = (normalizeFlightNumber(flightNo).match(/^[A-Z0-9]{2,3}/) || [""])[0];
  if (prefix.length === 3 && airlineDataMap.has(prefix)) {
    return airlineOptionString(airlineDataMap.get(prefix)); // ICAO designator
  }
  a = findAirlineByIata(prefix.substring(0, 2));
  if (a) return airlineOptionString(a);

  return leg.airlineName || "";
}

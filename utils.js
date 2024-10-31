const csvFilePath = "./data/airports.csv";
const airlineJsonPath = "./data/airlines.json";
const aircraftJsonPath = "./data/aircrafts.json";

const airportDataMap = new Map();
const airlineDataMap = new Map();
const aircraftDataMap = new Map();

const DateTime = luxon.DateTime;

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
        importedTrip.seatNumber
      );
    }
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
  alert(
    "NOTE: This import needs some time depending on number of your trips. It could be few seconds or several mintues. Please wait :)"
  );
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
    // store parsed data to trips
    for (const record of parsedData) {
      await parseFRTrip(record);
    }
    toggleDemoButton();
    loadStats();
    console.log("INFO: Trips imported from myFR24 formatted csv file.");
  } catch (error) {
    console.error("Error occurred while importing trips from csv file:", error);
  }
}

// helper to parse a trip item from myFR24 csv file to our trip json object
async function parseFRTrip(item) {
  const tDepartureCity = item.From.split("/")[0].trim();
  const tArrivalCity = item.To.split("/")[0].trim();
  const tDepartureIATA = item.From.slice(-9).substring(0, 3);
  const tArrivalIATA = item.To.slice(-9).substring(0, 3);
  if (!isValidAirport(tDepartureIATA)) {
    alert(
      "Airport IATA code not found: " + tDepartureIATA + ", skipping the trip."
    );
    return;
  }
  if (!isValidAirport(tArrivalIATA)) {
    alert(
      "Airport IATA code not found: " + tArrivalIATA + ", skipping the trip."
    );
    return;
  }

  const tFlightNumber = item["Flight number"];
  const tDistance = getDistance(tDepartureIATA, tArrivalIATA);

  const date = new Date(item.Date).toISOString().substring(0, 11);
  const tTakeOff = date + item["Dep time"].slice(0, 5);
  const tDurationCalc = item.Duration;
  // re-calculate this since FR24 does not have arrival date and there is timezone and +1 day issue.
  const tLanding = await getArrivalDateTime(
    tDepartureIATA,
    tArrivalIATA,
    tTakeOff,
    tDurationCalc
  );
  // now that arrival is calculated, can set duration to display string
  const tDuration =
    tDurationCalc.split(":")[0] + "h " + tDurationCalc.split(":")[1] + "min";

  const targetAirline = item.Airline.slice(-4).substring(0, 3);
  const tAirline = airlineDataMap.has(targetAirline) ? targetAirline : "";
  const tAircraft = aircraftICAO2IATA(item.Aircraft.slice(-5).substring(0, 4));
  const tTailNumber = item.Registration;
  const tSeatClass = seatClassFR24(item["Flight class"]);
  const tSeatNumber = item["Seat number"];

  // call addTrip()
  addTrip(
    "",
    tDepartureCity,
    tDepartureIATA,
    tArrivalCity,
    tArrivalIATA,
    tTakeOff,
    tLanding,
    tDuration,
    tDistance,
    tFlightNumber,
    tAirline,
    tAircraft,
    tTailNumber,
    tSeatClass,
    tSeatNumber
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
  const departureCoords = IATAtoCoordinates(departureIATA);
  const arrivalCoords = IATAtoCoordinates(arrivalIATA);
  const departureTZ = await GeoTZ.find(
    departureCoords.latitude,
    departureCoords.longitude
  );
  const arrivalTZ = await GeoTZ.find(
    arrivalCoords.latitude,
    arrivalCoords.longitude
  );
  const depDate = DateTime.fromISO(takeoff, { zone: departureTZ[0] });
  const add = duration.split(":");
  let arrDate = depDate.plus({ hours: add[0], minutes: add[1] });
  // convert to our string format
  arrDate = arrDate
    .setZone(arrivalTZ[0])
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
    // k-v map based on airline IATA
    let count = 0;
    airlineData.forEach((airline) => {
      // drop those without IATA, but use ICAO (unique) as key
      if (airline.iata) {
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
    const item = v.name + " (" + v.iata + "/" + v.icao + ")"; // option value = "Delta Airlines (DL/DAL)"
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
  const departureCoords = IATAtoCoordinates(departureIATA);
  const arrivalCoords = IATAtoCoordinates(arrivalIATA);

  const departureTZ = await GeoTZ.find(
    departureCoords.latitude,
    departureCoords.longitude
  );
  const arrivalTZ = await GeoTZ.find(
    arrivalCoords.latitude,
    arrivalCoords.longitude
  );

  const departureDate = DateTime.fromISO(takeoff, { zone: departureTZ[0] });
  const arrivalDate = DateTime.fromISO(landing, { zone: arrivalTZ[0] });

  const duration = arrivalDate.diff(departureDate, ["hours", "minutes"]);
  return duration.hours + "h " + duration.minutes + "min";
}

// Function to draw flight route on the globe using CesiumJS
function drawFlightRoute(viewer, trip) {
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

  viewer.entities.add({
    id: "route-" + trip.id,
    polyline: {
      positions: [departureCartesian, arrivalCartesian],
      width: 2,
      material: Object.freeze(Cesium.Color.fromCssColorString("#e7fd7d")),
      clampToGround: false, // Keep it floating
    },
  });

  // Add a dot at the departure city
  viewer.entities.add({
    id: "departure-" + trip.id,
    position: departureCartesian,
    point: {
      pixelSize: 8,
      color: Cesium.Color.CORNFLOWERBLUE,
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
    id: "arrival-" + trip.id,
    position: arrivalCartesian,
    point: {
      pixelSize: 8,
      color: Cesium.Color.CORNFLOWERBLUE,
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

function removeFlightRoute(viewer, tripID) {
  viewer.entities.removeById("route-" + tripID); // Remove the flight route
  viewer.entities.removeById("departure-" + tripID); // Remove the departure dot
  viewer.entities.removeById("arrival-" + tripID); // Remove the arrival dot
}

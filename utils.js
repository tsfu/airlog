const csvFilePath = "./data/airports.csv";
const airlineJsonPath = "./data/airlines.json";
const aircraftJsonPath = "./data/aircrafts.json";

const airportDataMap = new Map();
const airlineDataMap = new Map();
const aircraftDataMap = new Map();

const DateTime = luxon.DateTime;

// generate a unique ID for trip
function constructID(trip) {
  let ID =
    trip.departureIATA +
    trip.arrivalIATA +
    trip.takeOffTime.replace(/\D/g, "");
    if (trips.find((obj) => obj.id == ID)) {
      ID = ID + "1";
    }
  return ID;
}

// use airport.csv to construct info map
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
    console.log("INFO: Airport data map is now completed. Index:IATA")
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
    airlineData.forEach((airline) => {
      if (airline.iata) {
        airlineDataMap.set(airline.iata, airline); // drop those without IATA
      }
    });
    console.log("INFO: Airline data map is now completed. Index:IATA")
    console.log(airlineDataMap)
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
      if (aircraft.icao_code) {
        aircraftDataMap.set(aircraft.icao_code, aircraft); // drop those without IATA
      }
    });
    console.log("INFO: Aircraft data map is now completed. Index:ICAO")
    console.log(aircraftDataMap)
  } catch (error) {
    console.error("Error occurred while building aircraft data map:", error);
  }

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
    },
  });
}

function removeFlightRoute(viewer, tripID) {
  viewer.entities.removeById("route-" + tripID);       // Remove the flight route
  viewer.entities.removeById("departure-" + tripID); // Remove the departure dot
  viewer.entities.removeById("arrival-" + tripID);   // Remove the arrival dot
}

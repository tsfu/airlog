// Path to CSV file
const csvFilePath = "./data/airports.csv";
const airportDataMap = new Map();

async function getAirportDataAsync() {
  try {
    // Step 1: Fetch CSV data using $.ajax wrapped in a promise
    const csvData = await new Promise((resolve, reject) => {
      $.ajax({
        url: csvFilePath,  
        success: (data) => resolve(data),
        error: (err) => reject(err)
      });
    });

    // Step 2: Parse CSV data using PapaParse wrapped in a promise
    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => resolve(results.data), 
        error: (err) => reject(err)
      });
    });

    // Step 3: Store parsed data in the map
    parsedData.forEach(airport => {
      airportDataMap.set(airport.iata, airport);
    });
    console.log('Building airport data map completed:\n', airportDataMap);
    return airportDataMap
  } catch (error) {
    console.error("Error occurred while building airport data map:", error);
  }
}

// Helper: map IATA code to GPS coordinates
function CodetoCoordinates(iataCode) {
  const airport = airportDataMap.get(iataCode.trim().toUpperCase())
  if (airport) { 
    return {
      latitude: parseFloat(airport.latitude),
      longitude: parseFloat(airport.longitude)
    }
  } else {
    console.log("error: IATA code not found.")
    return null
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
  const departureCoords = CodetoCoordinates(departureIATA)
  const arrivalCoords = CodetoCoordinates(arrivalIATA)
  const distance = haversineDistance(
    departureCoords.latitude,
    departureCoords.longitude,
    arrivalCoords.latitude,
    arrivalCoords.longitude
  )
  return distance.toFixed(2) + "km"
}

// Calculate flight duration
function getDuration(takeoff, landing) {
  const takeOffDate = new Date(takeoff);
  const landingDate = new Date(landing);
  const totalMins = (landingDate - takeOffDate) / 1000 / 60;
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return hours + "h " + minutes + "min";
}

// Path to CSV file
const csvFilePath = "./data/airports.csv";
const airportDataMap = new Map();
var DateTime = luxon.DateTime;

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
    return airportDataMap
    
  } catch (error) {
    console.error("Error occurred while building airport data map:", error);
  }
}

// Helper: map IATA code to GPS coordinates
function IATAtoCoordinates(iataCode) {
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
  const departureCoords = IATAtoCoordinates(departureIATA)
  const arrivalCoords = IATAtoCoordinates(arrivalIATA)
  const distance = haversineDistance(
    departureCoords.latitude,
    departureCoords.longitude,
    arrivalCoords.latitude,
    arrivalCoords.longitude
  )
  return distance.toFixed(2) + "km"
}

// Calculate flight duration
async function getDuration(takeoff, landing, departureIATA, arrivalIATA) {
  // consider timezone offset given IATA code
  const departureCoords = IATAtoCoordinates(departureIATA)
  const arrivalCoords = IATAtoCoordinates(arrivalIATA)
  
  const departureTZ = await GeoTZ.find(departureCoords.latitude, departureCoords.longitude)
  const arrivalTZ = await GeoTZ.find(arrivalCoords.latitude, arrivalCoords.longitude)

  const departureDate = DateTime.fromISO(takeoff, { zone: departureTZ[0] });
  const arrivalDate = DateTime.fromISO(landing, { zone: arrivalTZ[0] });
  
  const duration = arrivalDate.diff(departureDate, ['hours', 'minutes']);
  return duration.hours + "h " + duration.minutes + "min";
}

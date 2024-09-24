// Include the necessary libraries
const fs = require('fs');
const Papa = require('papaparse');

// Path to your CSV file
const csvFilePath = "./data/airports.csv";

// Read CSV to map IATA code to GPS coordinates
function CodetoCoordinates(iataCode, callback) {
  // Read the CSV file
  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the csv file:", err);
      return callback(null);
    }
    // Parse CSV data
    Papa.parse(data, {
      header: true,
      complete: (results) => {
        // Find the airport by IATA code
        const airport = results.data.find((row) => row.iata === iataCode);
        if (airport) {
          const coordinates = {
            latitude: parseFloat(airport.latitude),
            longitude: parseFloat(airport.longitude),
          };
          // console.log('Coordinates:', coordinates);
          callback(coordinates); // Use callback to return coordinates
        } else {
          console.log("Error: IATA code not found");
          callback(null); // IATA code not found
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        callback(null); // Handle parsing errors
      },
    });
  });
}

// Helper: Calculate p2p distance on earth
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
  

// Function to fetch coordinates and log them
function getDistance(departureIATA, arrivalIATA) {
    CodetoCoordinates(departureIATA, (departureCoords) => {
        // try to get departure coords first
        if (departureCoords) {
        console.log("Depature Coordinates retrieved:", departureCoords);
        // then try get arrival coords and calculate distance
        CodetoCoordinates(arrivalIATA, (arrivalCoords) => {
            if (arrivalCoords) {
                const distance = haversineDistance(
                    departureCoords.latitude,
                    departureCoords.longitude,
                    arrivalCoords.latitude,
                    arrivalCoords.longitude
                )
                console.log("Distance travled: " + distance + " km");
            }else {
                console.log("Failed to retrieve coordinates for Airport:", arrivalIATA);
            }
        });
        } else {
        console.log("Failed to retrieve coordinates for Airport:", departureIATA);
        }
    });
}

// Calculate flight duration
function getDuration(takeoff, landing) {
  const takeOffDate = new Date(takeoff);
  const landingDate = new Date(landing);
  const totalMins = (landingDate - takeOffDate) / 1000 / 60;
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return hours + "h " + minutes + "min"
}

// tets cases
getDistance("BOS", "HKG");
getDistance("JFK", "LHR");

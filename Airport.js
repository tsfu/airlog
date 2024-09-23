// Include the necessary libraries
const fs = require('fs');
const Papa = require('papaparse');

// Path to your CSV file
const csvFilePath = './data/airports.csv';

// Function to load CSV and find coordinates by IATA code
function getCoordinatesByIATA(iataCode, callback) {
    // Read the CSV file
    fs.readFile(csvFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading CSV file:', err);
            return;
        }

        // Parse the CSV file
        Papa.parse(data, {
            header: true, // Use first row as header
            complete: function(results) {
                // Search for the row with the matching IATA code
                const airport = results.data.find(row => row.iata === iataCode);
                
                if (airport) {
                    const latitude = airport.latitude;
                    const longitude = airport.longitude;
                    callback(null, { latitude, longitude });
                } else {
                    callback(`IATA code ${iataCode} not found`, null);
                }
            },
            error: function(error) {
                callback(error, null);
            }
        });
    });
}

// Example usage
getCoordinatesByIATA('JFK', (error, coordinates) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Coordinates:', coordinates);
    }
});
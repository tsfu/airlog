// Import the sqlite3 module
const sqlite3 = require('sqlite3').verbose();

// Open the SQLite database
const db = new sqlite3.Database('path/to/your/airport_database.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

// Function to convert airport code to latitude and longitude
function getAirportCoordinates(airportCode) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT latitude, longitude FROM airports WHERE code = ?';

        db.get(sql, [airportCode], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve({ latitude: row.latitude, longitude: row.longitude });
            } else {
                resolve(null); // Airport code not found
            }
        });
    });
}

// Example usage
const airportCode = 'JFK'; // Replace with the desired airport code

getAirportCoordinates(airportCode)
    .then(coordinates => {
        if (coordinates) {
            console.log(`Coordinates for ${airportCode}:`, coordinates);
        } else {
            console.log(`Airport code ${airportCode} not found.`);
        }
    })
    .catch(err => {
        console.error('Error fetching coordinates:', err.message);
    });

// Close the database connection after use
db.close((err) => {
    if (err) {
        console.error('Error closing the database:', err.message);
    }
    console.log('Database connection closed.');
});

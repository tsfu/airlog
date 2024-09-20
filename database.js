// Import the sqlite3 module
const sqlite3 = require('sqlite3').verbose();

// Open the SQLite database
const db = new sqlite3.Database('GADB/GADB.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

// Function to convert airport code to latitude and longitude
function getAirportInfo(airportCode) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM airports WHERE iata_code = ?';

        db.get(sql, [airportCode], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve({ 
                    icao: row.icao_code,
                    country: row.country,
                    city: row.city, 
                    name: row.name, 
                    latitude: row.lat_decimal, 
                    longitude: row.lon_decimal 
                });
            } else {
                resolve(null); // Airport code not found
            }
        });
    });
}

// Example usage
const airportCode = 'CTU'; // TODO: Replace with the desired airport code from UI

getAirportInfo(airportCode)
    .then(info => {
        if (info) {
            console.log("Airport Info for " + airportCode + ": ", info);
        } else {
            console.log("Airport info for IATA code " + airportCode + " not found.");
        }
    })
    .catch(err => {
        console.error('Error fetching airport info:', err.message);
    });

// Close the database connection after use
db.close((err) => {
    if (err) {
        console.error('Error closing the database:', err.message);
    }
    console.log('Database connection closed.');
});

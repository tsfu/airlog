// Totals
function getFlightsTotal() {
    return trips.length;
}

function getDistanceTotal() {
    let total = 0;
    trips.forEach((trip) => {
        let distance = trip.distance;
        total = total + parseFloat(distance.substring(0, distance.length - 2));
    });
    return total;   
}

function getAlternativeDistance(distance) {
    const toMoon = 370000;
    const toMars = 225000000;
    const earthC = 40075;
    return {
        "earth": distance/earthC,
        "moon": distance/toMoon,
        "mars": distance/toMars
    }
}

function getAirTimeTotal() {

}

function getAirportsTotal() {
    const airportSet = new Set();
    trips.forEach((trip) => {
        airportSet.add(trip.departureIATA);
        airportSet.add(trip.arrivalIATA);
    });
    return airportSet.size;   
}

function getAirlinesTotal() {

}

function getAircraftsTotal() {

}

function getCountriesTotal() {

}

// Rankings
function getRoutesRanking() {
    
}

function getAirportsRanking() {

}

function getAirlinesRanking() {
    
}

function getAircraftsRanking() {
    
}

// load stats page data
function loadStats() {
    
}


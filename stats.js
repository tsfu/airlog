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
    earth: (distance / earthC).toFixed(2),
    moon: (distance / toMoon).toFixed(3),
    mars: (distance / toMars).toFixed(6),
  };
}

function getAirTimeTotal() {
  let totalMinutes = 0;
  trips.forEach((trip) => {
    let duration = trip.duration;
    let tokens = duration.split(" ");
    let hour = parseInt(tokens[0].replace("h", ""));
    let min = parseInt(tokens[1].replace("min", ""));
    totalMinutes = totalMinutes + hour * 60 + min;
  });

  // calculate total time in different scales
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const addtionalHours = hours % 24;
  const weeks = Math.floor(days / 7);
  const additionalDays = days % 7;

  const hoursText = hours + getTimeText(hours, "hour") + minutes + " min";
  let daysText = "";
  let weeksText = "";
  if (days > 1) {
    daysText =
      days +
      getTimeText(days, "day") +
      addtionalHours +
      getTimeText(addtionalHours, "hour") +
      minutes +
      " min";
    if (weeks > 1) {
      weeksText =
        weeks +
        getTimeText(weeks, "week") +
        additionalDays +
        getTimeText(additionalDays, "day") +
        addtionalHours +
        getTimeText(addtionalHours, "hour") +
        minutes +
        " min";
    }
  }

  return {
    hours: hoursText,
    days: daysText,
    weeks: weeksText,
  };
}

function getTimeText(number, word) {
  if (number > 1) {
    return " " + word + "s ";
  } else return " " + word + " ";
}

function getAirportsSet() {
  const airportSet = new Set();
  trips.forEach((trip) => {
    airportSet.add(trip.departureIATA);
    airportSet.add(trip.arrivalIATA);
  });
  return airportSet;
}

function getCountriesSet() {
  // get country codes from airport map
  const countrySet = new Set();
  trips.forEach((trip) => {
    const airport1 = trip.departureIATA;
    const airport2 = trip.arrivalIATA;
    const countryCode1 = airportDataMap.get(airport1).country_code;
    const countryCode2 = airportDataMap.get(airport2).country_code;
    countrySet.add(countryCode1);
    countrySet.add(countryCode2);
  });
  return countrySet;
}

function getAirlinesSet() {
  const airlineSet = new Set();
  trips.forEach((trip) => {
    airlineSet.add(trip.airline);
  });
  return airlineSet;
}

function getAircraftsSet() {
  const aircraftSet = new Set();
  trips.forEach((trip) => {
    aircraftSet.add(trip.aircraft);
  });
  return aircraftSet;
}

// Rankings

function getRoutesRanking() {
  // unqiue route -> count map
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
  // sort map by count (values) then put results in array
  routeCountMap = new Map(
    [...routeCountMap.entries()].sort((a, b) => b[1] - a[1])
  );
  // put result in array so can use index as ranking
  let res = [];
  routeCountMap.forEach((v, k) => {
    res.push({ route: k, count: v });
  });
  return res;
}

function getAirportsRanking() {
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
  // sort map by count (values) then put results in array
  airportCountMap = new Map(
    [...airportCountMap.entries()].sort((a, b) => b[1] - a[1])
  );
  // put result in array so can use index as ranking
  let res = [];
  airportCountMap.forEach((v, k) => {
    res.push({ airport: k, count: v });
  });
  return res;
}

function getAirlinesRanking() {
  let airlineCountMap = new Map();
  trips.forEach((trip) => {
    const key = trip.airline;
    if (airlineCountMap.has(key)) {
      airlineCountMap.set(key, airlineCountMap.get(key) + 1);
    } else {
      airlineCountMap.set(key, 1);
    }
  });
  // sort map by count (values) then put results in array
  airlineCountMap = new Map(
    [...airlineCountMap.entries()].sort((a, b) => b[1] - a[1])
  );
  // put result in array so can use index as ranking
  let res = [];
  airlineCountMap.forEach((v, k) => {
    res.push({ airline: k, count: v });
  });
  return res;
}

function getAircraftsRanking() {
  let aircraftCountMap = new Map();
  trips.forEach((trip) => {
    const key = trip.aircraft;
    if (aircraftCountMap.has(key)) {
      aircraftCountMap.set(key, aircraftCountMap.get(key) + 1);
    } else {
      aircraftCountMap.set(key, 1);
    }
  });
  // sort map by count (values) then put results in array
  aircraftCountMap = new Map(
    [...aircraftCountMap.entries()].sort((a, b) => b[1] - a[1])
  );
  // put result in array so can use index as ranking
  let res = [];
  aircraftCountMap.forEach((v, k) => {
    res.push({ airline: k, count: v });
  });
  return res;
}

// sort() trips with a comparator func to get Top N longest flight (duration/distance)
function getDurationRanking() {
  let tripsByDuration = structuredClone(trips);
  tripsByDuration.sort(
    (a, b) => durationTextToMins(b.duration) - durationTextToMins(a.duration)
  );
  return tripsByDuration;
}

function durationTextToMins(duration) {
  const durationNum = duration.replace("min", "").replace("h", "");
  const list = durationNum.split(" ");
  const mins = parseInt(list[0]) * 60 + parseInt(list[1]);
  return mins;
}

function getDistanceRanking() {
  let tripsByDistance = structuredClone(trips);
  tripsByDistance.sort(
    (a, b) =>
      parseFloat(b.distance.replace("km", "")) -
      parseFloat(a.distance.replace("km", ""))
  );
  return tripsByDistance;
}

// calculate all stats data from trips
function loadStats() {
  
}

// load stats page UI
function showStats() {

}

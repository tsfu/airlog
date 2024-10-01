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

function getAirportsTotal() {
  const airportSet = new Set();
  trips.forEach((trip) => {
    airportSet.add(trip.departureIATA);
    airportSet.add(trip.arrivalIATA);
  });
  return airportSet.size;
}

function getCountries() {
    // get country codes from airport map
    const countrySet = new Set();
    trips.forEach((trip) => {
        const airport1 = trip.departureIATA
        const airport2 = trip.arrivalIATA
        const countryCode1 = airportDataMap.get(airport1).country_code;
        const countryCode2 = airportDataMap.get(airport2).country_code;
        countrySet.add(countryCode1);
        countrySet.add(countryCode2)
    });
    return countrySet
}

function getAirlinesTotal() {
    // TODO: implement this when airline can use code as ID
}

function getAircraftsTotal() {
    // TODO: implement this when aircraft can use code as ID
}


// Rankings
function getRoutesRanking() {}

function getAirportsRanking() {}

function getAirlinesRanking() {
    // TODO: implement this when airline can use code as ID
}

function getAircraftsRanking() {
    // TODO: implement this when aircraft can use code as ID
}

// load stats page data
function loadStats() {}

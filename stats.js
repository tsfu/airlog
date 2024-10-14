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
  return total.toFixed(2);
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
    hours: "" + hours,
    mins: "" + minutes,
    daysText: daysText,
    weeksText: weeksText,
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
      if (!key) return; // empty key counts only once
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
  if(res[0].count == 1) {
    res = res.reverse(); // so that empty key (count=1) will not be on top if tied at 1.
  }
  return res;
}

function getAircraftsRanking() {
  let aircraftCountMap = new Map();
  trips.forEach((trip) => {
    const key = trip.aircraft;
    if (aircraftCountMap.has(key)) {
      if (!key) return; // empty key counts only once
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
    res.push({ aircraft: k, count: v });
  });
  if(res[0].count == 1) {
    res = res.reverse(); // so that empty key (count=1) will not be on top if tied at 1.
  }
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
  // return if no trip logged.
  if (trips.length < 1) {
    $(".no-stats").show();
    $(".stats-card").hide();
    return;
  }else{
    $(".no-stats").hide();
    $(".stats-card").show();
  }

  // Prepare some calculation results
  const airportsRanked = getAirportsRanking();
  const airlinesRanked = getAirlinesRanking();
  const aircraftsRanked = getAircraftsRanking();
  const routesRanked = getRoutesRanking();

  const airportsTotal = getAirportsSet().size;
  const airlinesTotal = getAirlinesSet().size;
  const aircraftsTotal = getAircraftsSet().size;
  
  // card 1: flights + airport + country
  $("#totalFlight").text(getFlightsTotal());
  let noun = (getFlightsTotal() == 1) ? "flight" : "flights";
  $("#totalFlightText").text(noun);
  
  const topAirport = airportsRanked[0].airport;
  let topAirportCount = airportsRanked[0].count;
  topAirportCount =
  topAirportCount + (topAirportCount > 1 ? " times" : " time");
  const topAirportName = airportDataMap.get(topAirport).airport;
  $("#totalAirport").text(airportsTotal);
  $("#topAirport").text(topAirport);
  $("#topAirportCount").text(topAirportCount);
  $("#top-airport-fullname").text(topAirportName);
  
  const countries = getCountriesSet();
  $("#totalCountries").text(countries.size);
  noun = (countries.size == 1) ? "country" : "countries";
  $("#totalCountriesText").text(noun)
  // national flag icons
  populateFlagIcons(countries);

  // card 2: distance and time
  const totalDistance = getDistanceTotal();
  $("#totalDistance").text(totalDistance);
  const alternativeDistance = getAlternativeDistance(totalDistance);
  $("#xEarth").text(alternativeDistance.earth);
  $("#xMoon").text(alternativeDistance.moon);
  $("#xMars").text(alternativeDistance.mars);

  const totalTime = getAirTimeTotal();
  $("#totalTimeH").text("" + totalTime.hours);
  $("#totalTimeM").text("" + totalTime.mins);

  $("#totalTimeText").show();
  if (totalTime.weeksText) {
    $("#totalTimeText").text(totalTime.weeksText);
  } else if (totalTime.daysText) {
    $("#totalTimeText").text(totalTime.daysText);
  } else {
    $("#totalTimeText").hide();
  }
  const CO2 = (parseFloat(totalDistance) * 0.158) / 1000;
  $("#CO2").text(CO2.toFixed(2));

  // card 3: top aircraft+airline
  $("#totalAircraft").text(aircraftsTotal);
  $("#totalAirline").text(airlinesTotal);
  noun = (aircraftsTotal == 1) ? "aircraft" : "aircrafts";
  $("#totalAircraftText").text(noun);
  noun = (airlinesTotal == 1) ? "airline" : "airlines";
  $("#totalAirlineText").text(noun);

  let topAircraft = {};
  if (!aircraftsRanked[0].aircraft) {
    // worst case but possible: only 1 entry and is empty key, so it will the top one.
    // in this case, simply mock an obj for display
    topAircraft = {name:"Unknown Aircraft", icao_code: "Are you serious?"};
  } else {
    topAircraft = aircraftDataMap.get(aircraftsRanked[0].aircraft);
  }
  const topAircraftText = topAircraft.name + " - " + topAircraft.icao_code;
  $("#topAircraft").text(topAircraftText);
  $("#topAircraftLogo").show();
  if (topAircraftText.includes("Boeing")) {
    $("#topAircraftLogo").attr("src", "./assets/boeing-logo.png");
  } else if (topAircraftText.includes("Airbus")) {
    $("#topAircraftLogo").attr("src", "./assets/airbus-logo.png");
  } else {
    $("#topAircraftLogo").hide();
  }
  
  let topAirlineText = "";
  const validAirline = airlinesRanked[0].airline;
  // do not use airline obj if key is empty here.
  if (validAirline) {
    const topAirline = airlineDataMap.get(airlinesRanked[0].airline);
    topAirlineText =
      topAirline.name + " - " + topAirline.iata + "/" + topAirline.icao;
    $("#topAirlineLogo").attr(
      "src",
      "./assets/airline_banners/" + topAirline.icao + ".png"
    );
    $("#topAirlineLogo").show();
  } else {
    topAirlineText = "Unknown Carrier - This is sad."
    $("#topAirlineLogo").hide();
  } 
  $("#topAirline").text(topAirlineText);

  // card 4: rankings
  // aircraft ranking
  $("#aircraft-ranking").empty();
  let num = aircraftsRanked.length > 3 ? 3 : aircraftsRanked.length;
  let title = document.createElement("h3");
  title.textContent = "Aircrafts Ranking";
  $("#aircraft-ranking").append(title);
  for (let i = 0; i < num; i++) {
    const item = document.createElement("p");
    item.classList.add("ranking-text");
    const validAircraft = aircraftsRanked[i].aircraft;
    const rankText = validAircraft ? aircraftsRanked[i].count : "This doesn't count :(";
    if (validAircraft) {    
      aircraft = aircraftDataMap.get(aircraftsRanked[i].aircraft);
      item.innerHTML =
      "<b>" +
      aircraft.name +
      "</b>&nbsp;(" +
      aircraft.icao_code +
      ") - " +
      rankText;
    } else {
      item.innerHTML = "<b>Unknown Aircraft</b> &nbsp;- " + rankText;
    }
    $("#aircraft-ranking").append(item);
  }
  
  // airline ranking
  $("#airline-ranking").empty();
  num = airlinesRanked.length > 3 ? 3 : airlinesRanked.length;
  title = document.createElement("h3");
  title.textContent = "Airlines Ranking";
  $("#airline-ranking").append(title);
  for (let i = 0; i < num; i++) {
    const item = document.createElement("p");
    item.classList.add("ranking-text");
    const validAirline = airlinesRanked[i].airline;
    const rankText = validAirline ? airlinesRanked[i].count : "This doesn't count :(";
    if (validAirline) {
      const airline = airlineDataMap.get(airlinesRanked[i].airline);
      item.innerHTML =
      airlineToBannerHTML(airline.icao) +
      "&nbsp;&nbsp;<b>" +
      airline.iata +
      "/" +
      airline.icao +
      "</b> &nbsp;- " +
      rankText;
    } else {
      item.innerHTML = "<b>Unknown Carrier</b> &nbsp;- " + rankText;
    }  
    $("#airline-ranking").append(item);
  }
  
  // airport ranking
  $("#airport-ranking").empty();
  num = airportsRanked.length > 3 ? 3 : airportsRanked.length;
  title = document.createElement("h3");
  title.textContent = "Airports Ranking";
  $("#airport-ranking").append(title);
  for (let i = 0; i < num; i++) {
    const airportText = airportDataMap.get(airportsRanked[i].airport).airport;
    const rankText = airportsRanked[i].count;
    const item = document.createElement("p");
    item.classList.add("ranking-text");
    item.innerHTML =
      airportToCountryIconHTML(airportsRanked[i].airport) +
      "&nbsp;" +
      airportText +
      " - " +
      rankText;
    $("#airport-ranking").append(item);
  }

  // card 5: routes
  let routeCount = routesRanked[0].count;
  routeCount = routeCount + (routeCount > 1 ? " times" : " time");
  $("#topRoute").text(routesRanked[0].route);
  $("#topRouteCount").text(routeCount);

  const byDuration = getDurationRanking();
  const byDistance = getDistanceRanking();
  const durA = byDuration[0];
  const durZ = byDuration[byDuration.length-1]; 
  const disA = byDistance[0];
  const disZ = byDistance[byDistance.length-1];

  $("#slowRoute").text(durA.departureIATA + "-" + durA.arrivalIATA);
  $("#slowRouteVal").text(durA.duration);
  $("#quickRoute").text(durZ.departureIATA + "-" + durZ.arrivalIATA);
  $("#quickRouteVal").text(durZ.duration);
  $("#longRoute").text(disA.departureIATA + "-" + disA.arrivalIATA);
  $("#longRouteVal").text(disA.distance);
  $("#shortRoute").text(disZ.departureIATA + "-" + disZ.arrivalIATA);
  $("#shortRouteVal").text(disZ.distance);

  console.log("INFO: Stats calculation complete.");
}

// helpers
function populateFlagIcons(countries) {
  // always clear first and re-render
  $("#fi-container").empty();
  // add rows for icons (8 icons a row)
  const rows = Math.ceil(countries.size / 8);
  for (let i = 0; i < rows; i++) {
    const row = document.createElement("div");
    row.id = "flags-row-" + i;
    $("#fi-container").append(row);
  }
  // get the icon to correct row.
  let iconCounter = 0;
  countries.forEach((country) => {
    const iconSpan = document.createElement("span");
    iconSpan.classList.add("fi");
    iconSpan.classList.add("fi-" + country.toLowerCase());
    iconSpan.style.padding = "3px";
    iconSpan.style.margin = "3px";
    const rowID = "flags-row-" + Math.floor(iconCounter / 8);
    $("#" + rowID).append(iconSpan);
    iconCounter++;
  });
}

function airlineToBannerHTML(airlineICAO) {
  const imgPath = "./assets/airline_banners/" + airlineICAO + ".png";
  const html = '<img src="' + imgPath + '" height="30px" width="115px"/>';
  return html;
}

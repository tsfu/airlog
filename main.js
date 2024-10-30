// configure Cesium ion
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NmYzOGI3YS1hNTJmLTQxMDgtODk2OC1jNDAzZWJkZTA2NTYiLCJpZCI6MjQyOTgwLCJpYXQiOjE3MjY4NDU5MDd9.P4ba4zMM5yLj4ppDe-YrpX0IOcR8AkwvKV5tjCrbY5s";

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false, // Removes the animation widget
  timeline: false, // Removes the timeline widget
});
// remove invalid imagery/terrain providers from base-layer picker
viewer.baseLayerPicker.viewModel.terrainProviderViewModels.shift();
let providers = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
let newProviders = [];
for (let i = 0; i < providers.length; i++) {
  const provider = providers[i];
  if (!(provider.name == "Blue Marble" || provider._category != "Cesium ion")) {
    newProviders.push(provider);
  }
}
viewer.baseLayerPicker.viewModel.imageryProviderViewModels = newProviders;

const tripStorageKey = "tripsStorage";

// hold user's trips
let trips = [];

// switch between tabs
function openTab(event, tabName) {
  // Get all elements with class="tab-content" and hide them
  const tabContents = $(".tab-content");
  tabContents.removeClass("active");

  // Show the current tab and add "active" class to the clicked tab
  $("#" + tabName).addClass("active");

  // Remove active state from all links
  const tabLinks = $(".tab-link");
  tabLinks.removeClass("active");

  // Add active state to the clicked tab link
  event.currentTarget.classList.add("active");
}

// load airport info into map
async function init() {
  // load data & build index
  await getAirportDataAsync();
  await getAirlineDataAsync();
  await getAircraftDataAsync();

  // get localStorage stored trips
  await populateLogFromStorage();
  // Set display for demo button and table header
  toggleTableDisplay();
  toggleDemoButton();

  // for stats calc
  loadStats();
  // for input autocomplete
  populateInputOptions();

  // enable test in console for helper functions
  // Test();
}

// populate table in "Log View" with trips in local storage
async function populateLogFromStorage() {
  let tripsStorage = JSON.parse(localStorage.getItem(tripStorageKey));
  if (tripsStorage == null || tripsStorage.length == 0) return;

  for (const trip of tripsStorage) {
    await addTrip(
      trip.id,
      trip.departureCity,
      trip.departureIATA,
      trip.arrivalCity,
      trip.arrivalIATA,
      trip.takeOffTime,
      trip.landingTime,
      trip.duration,
      trip.distance,
      trip.flightNumber,
      trip.airline,
      trip.aircraft,
      trip.tailNumber,
      trip.seatClass,
      trip.seatNumber
    );
  }
  console.log("INFO: Trips data successfully retrieved.");
}

// console log testing basic functions
async function Test() {
  // test distance
  const test = getDistance("BOS", "HKG");
  console.log("TEST BOS-HKG distance: " + test);
  const test2 = getDistance("MIG", "XIY");
  console.log("TEST MIG-XIY distance: " + test2);
  // test duration
  const dur1 = await getDuration(
    "2024-09-24T19:40:00",
    "2024-09-25T06:50:00",
    "BOS",
    "LHR"
  );
  console.log("Test duration BOS-LHR: " + dur1);
  const dur2 = await getDuration(
    "2024-07-21T11:34:00",
    "2024-07-21T15:17:00",
    "JFK",
    "LAX"
  );
  console.log("Test duration JFK-LAX: " + dur2);
}

// trip input modal
const modal = $("#addTripModal");

// close modal
$(".modal-close").on("click", function () {
  $("#submitTripButton").removeAttr("hidden");
  $("#updateTripButton").attr("hidden", "hidden");
  modal.hide(); 
});

// When the user clicks anywhere outside of the modal close it
window.onclick = function (event) {
  if (event.target == modal[0]) {
    $("#submitTripButton").removeAttr("hidden");
    $("#updateTripButton").attr("hidden", "hidden");
    modal.hide();
  }
};

// demo button
$("#demoButton").on("click", demo);

// "add trip" button
$("#addTripButton").on("click", function () {
  // clear form which may have values left from closed edits
  $("#tripForm")[0].reset();
  modal.show();
});

// "import from file" button
$("#importButton").on("click", function () {
  $("#json-input").trigger("click");
});

// "import from myFR24" button
$("#importFRButton").on("click", function () {
  $("#csv-input").trigger("click");
});

// "export trips" button
$("#exportButton").on("click", exportToJSON);

// handle form submission when editing a trip
$("#updateTripButton").on("click", updateTrip);

// auto-populate city based on IATA input
$("#departureIATA").keyup(function () {
  const iata = $("#departureIATA").val().substring(0,3);
  if(iata.length > 2 && isValidAirport(iata)) {
    $("#departureCity").val(airportDataMap.get(iata).city);
  }
});
$("#arrivalIATA").keyup(function () {
  const iata = $("#arrivalIATA").val().substring(0,3);
  if(iata.length > 2 && isValidAirport(iata)) {
    $("#arrivalCity").val(airportDataMap.get(iata).city);
  }
});

// handle form submission when adding a trip
$("#tripForm").on("submit", async function (event) {
  event.preventDefault(); // Prevent the form from submitting the traditional way
  // Add one trip/row from HTML Form
  try {
    await addTrip(
      "", // no ID from input, will auto-generate
      $("#departureCity").val(),
      $("#departureIATA").val().substring(0, 3),
      $("#arrivalCity").val(),
      $("#arrivalIATA").val().substring(0, 3),
      $("#takeOffTime").val(),
      $("#landingTime").val(),
      "", // no duration from input, will calc
      "", // no distance from input, will calc
      $("#flightNumber").val(),
      $("#airline").val(), // will process later
      $("#aircraft").val(), // will process later
      $("#tailNumber").val(),
      $("#seatClass").val(),
      $("#seatNumber").val()
    );
  } catch (err) {
    alert("ERROR: Cannot add trip: " + err.message);
    return;
  }
  // Reset the form and hide it after submission
  this.reset();
  loadStats();
  toggleDemoButton();
  modal.hide();
});

// handle csv import for myFR24
$("#csv-input").on("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {    
      await importFR24(e);
    }
    reader.readAsText(file);
  }
});

// handle json import
$("#json-input").on("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      const jsonContent = e.target.result;
      try {
        const trips = JSON.parse(jsonContent);
        if (Array.isArray(trips)) {
          for (const trip of trips) {
            const valid =
              trip.departureIATA ||
              trip.arrivalIATA ||
              trip.takeOffTime ||
              trip.landingTime;
            if (!valid) {
              alert(
                "Invalid JSON format. Missing required information in trip.\n Please check with README file."
              );
              return;
            }
            await addTrip(
              trip.id,
              trip.departureCity,
              trip.departureIATA,
              trip.arrivalCity,
              trip.arrivalIATA,
              trip.takeOffTime,
              trip.landingTime,
              trip.duration,
              trip.distance,
              trip.flightNumber,
              trip.airline,
              trip.aircraft,
              trip.tailNumber,
              trip.seatClass,
              trip.seatNumber
            );
          }
          loadStats();
          toggleDemoButton();
        } else {
          alert(
            "Invalid JSON format. Please upload an Array of valid trips.\nSee README for more info."
          );
        }
      } catch (err) {
        alert("Error parsing JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }
});

// Add a single row in table UI, also save a trip data object
async function addTrip(
  id,
  departureCity,
  departureIATA,
  arrivalCity,
  arrivalIATA,
  takeOffTime,
  landingTime,
  duration,
  distance,
  flightNumber,
  airline,
  aircraft,
  tailNumber,
  seatClass,
  seatNumber
) {
  // Get the input values from the form
  let trip = {};
  trip.departureIATA = departureIATA.toUpperCase();
  trip.arrivalIATA = arrivalIATA.toUpperCase();

  // Input has to be correct IATAs to cintune
  const validIATA =
    isValidAirport(trip.departureIATA) && isValidAirport(trip.arrivalIATA);
  if (!validIATA) {
    throw new Error(
      "airport not found. \nPlease check your airport IATA codes or use suggested values."
    );
  }

  trip.departureCity = departureCity;
  trip.arrivalCity = arrivalCity;
  trip.takeOffTime = takeOffTime;
  trip.landingTime = landingTime;
  trip.duration = duration;
  trip.distance = distance;
  trip.flightNumber = flightNumber.toUpperCase();

  airline = optionToCode(airline); // trim to ICAO
  aircraft = optionToCode(aircraft); // trim to IATA
  // If airline or aircraft not valid, just drop and use empty values.
  trip.airline = airlineDataMap.has(airline) ? airline : "";
  trip.aircraft = aircraftDataMap.has(aircraft) ? aircraft : "";

  trip.tailNumber = tailNumber;
  trip.seatClass = seatClass;
  trip.seatNumber = seatNumber;

  // Calculate duration and distance using airport.js methods
  if (duration == null || duration == "") {
    trip.duration = await getDuration(
      trip.takeOffTime + ":00",
      trip.landingTime + ":00",
      trip.departureIATA,
      trip.arrivalIATA
    );
  }
  if (distance == null || distance == "") {
    trip.distance = getDistance(trip.departureIATA, trip.arrivalIATA);
  }
  trip.id = constructID(trip);

  // Draw route on earth
  drawFlightRoute(viewer, trip);

  // Create a new row in the travel log table
  const tbody = $("#travelTbody")[0];
  const newRow = tbody.insertRow(-1); // Insert a new row at the end of the table
  for (let i = 0; i < 16; i++) { // Insert cells
    newRow.insertCell(i);
  }
  populateRow(trip, newRow);

  // update global var of user's trips
  trips.push(trip);
  // if trips count went from 0 to 1 then display table
  toggleTableDisplay();
  // update storage
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));
}

// update trip for both UI and storage from input
async function updateTrip() {
  // if form not valid yet, alert and return doing nothing
  // since we are not using same submit as adding here, need to do this explicitly.
  if ($("#tripForm")[0].checkValidity() == false) {
    alert(
      "Please fill in all required fields (marked bold).\n Check airport IATA codes and takeoff/landing time."
    );
    return;
  }
  // re-fetch the IDs for editing
  const editTripID = sessionStorage.getItem("editTripID");
  const editRowIndex = sessionStorage.getItem("editRowIndex");

  // record the updated text values in form input
  let trip = trips.find((obj) => obj.id == editTripID);
  let newDIATA = $("#departureIATA").val().toUpperCase();
  let newAIATA = $("#arrivalIATA").val().toUpperCase();
  let newAirline = $("#airline").val();
  let newAircraft = $("#aircraft").val();

  // if they change these values by choosing from options, need to truncate again
  if (newDIATA.length > 3) {
    newDIATA = newDIATA.substring(0, 3);
  }
  if (newAIATA.length > 3) {
    newAIATA = newAIATA.substring(0, 3);
  }
  // Updated IATA has to be correct before continue
  const validIATA = isValidAirport(newDIATA) && isValidAirport(newAIATA);
  if (!validIATA) {
    alert(
      "ERROR: Airport not found. \nPlease check your airport IATA codes or use suggested values."
    );
    return;
  }
  trip.departureIATA = newDIATA;
  trip.arrivalIATA = newAIATA;

  newAirline = optionToCode(newAirline); // trim to ICAO again
  newAircraft = optionToCode(newAircraft); // trim to IATA again
  // validate airline and aircraft, if not just make them empty
  trip.airline = airlineDataMap.has(newAirline) ? newAirline : "";
  trip.aircraft = aircraftDataMap.has(newAircraft) ? newAircraft : "";

  // update text values at last in case something went wrong before but these get updated.
  trip.departureCity = $("#departureCity").val();
  trip.arrivalCity = $("#arrivalCity").val();
  trip.takeOffTime = $("#takeOffTime").val();
  trip.landingTime = $("#landingTime").val();
  trip.flightNumber = $("#flightNumber").val().toUpperCase();
  trip.tailNumber = $("#tailNumber").val();
  trip.seatClass = $("#seatClass").val();
  trip.seatNumber = $("#seatNumber").val();

  // always re-calculate these upon update
  trip.distance = getDistance(trip.departureIATA, trip.arrivalIATA);
  trip.duration = await getDuration(
    trip.takeOffTime + ":00",
    trip.landingTime + ":00",
    trip.departureIATA,
    trip.arrivalIATA
  );

  // the trip object has already been updated in place at this point
  // now update table row UI in place
  const row = $("#travelLogTable")[0].rows[editRowIndex];
  populateRow(trip, row);

  // re-draw route on earth
  removeFlightRoute(viewer, editTripID);
  drawFlightRoute(viewer, trip);

  // update trips storage
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));
  // clear sessionSotrage for editing id
  sessionStorage.removeItem("editTripID");
  sessionStorage.removeItem("editRowIndex");
  loadStats();

  // reset add/update button status in modal
  $("#tripForm")[0].reset();
  $("#submitTripButton").removeAttr("hidden");
  $("#updateTripButton").attr("hidden", "hidden");
  modal.hide();
}

// export trips to file
function exportToJSON() {
  const trips = JSON.parse(localStorage.getItem(tripStorageKey)) || [];
  if (trips.length < 1) {
    alert("Warning: you don't have trips currently stored.");
    return;
  }
  const jsonData = JSON.stringify(trips, null, 2); // Pretty print with 2 spaces
  const blob = new Blob([jsonData], { type: "application/json" });

  // Create a download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "travel-log.json"; // The file name for the download
  link.click(); // Programmatically click the download link

  // Clean up and revoke the object URL
  URL.revokeObjectURL(link.href);
}

// Main Entry
init();

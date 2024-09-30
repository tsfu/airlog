Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NmYzOGI3YS1hNTJmLTQxMDgtODk2OC1jNDAzZWJkZTA2NTYiLCJpZCI6MjQyOTgwLCJpYXQiOjE3MjY4NDU5MDd9.P4ba4zMM5yLj4ppDe-YrpX0IOcR8AkwvKV5tjCrbY5s";

const viewer = new Cesium.Viewer("cesiumContainer",{
  animation: false,           // Removes the animation widget
  timeline: false,            // Removes the timeline widget
});
const tripStorageKey = "tripsStorage";

// hold user's trips
let trips = [];

// switch between tabs
function openTab(event, tabName) {
  // Get all elements with class="tab-content" and hide them
  var tabContents = document.getElementsByClassName("tab-content");
  for (var i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove("active");
  }

  // Show the current tab and add "active" class to the clicked tab
  document.getElementById(tabName).classList.add("active");

  // Remove active state from all links
  var tabLinks = document.getElementsByClassName("tab-link");
  for (var i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  // Add active state to the clicked tab link
  event.currentTarget.classList.add("active");
}

// load airport info into map
async function init() {
  await getAirportDataAsync();
  await populateLogFromStorage();
  // Test();   // enable test for helper functions
}

// populate table in "Log View" with trips in local storage
async function populateLogFromStorage() {
  let tripsStorage = JSON.parse(localStorage.getItem(tripStorageKey));
  if (tripsStorage == null || tripsStorage.length == 0) return;

  for (const trip of tripsStorage) {
    await addTripRow(
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

// "add trip" button
document.getElementById("addTripButton").addEventListener("click", function () {
  modal.style.display = "block";
});

// "import from file" button
document.getElementById("importButton").addEventListener("click", function () {
  document.getElementById("json-input").click();
});

// "export trips" button
document.getElementById("exportButton").onclick = exportToJSON;

// trip input modal
const modal = document.getElementById("addTripModal");
const closeSpan = document.getElementsByClassName("modal-close")[0];
closeSpan.onclick = function () {
  modal.style.display = "none"; // close modal
};
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// handle form submission when adding a trip
document
  .getElementById("tripForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Add one row from HTML Form
    await addTripRow(
      "", // no ID from input, will auto-generate
      document.getElementById("departureCity").value,
      document.getElementById("departureIATA").value,
      document.getElementById("arrivalCity").value,
      document.getElementById("arrivalIATA").value,
      document.getElementById("takeOffTime").value,
      document.getElementById("landingTime").value,
      "", // no duration from input, will calc
      "", // no distance from input, will calc
      document.getElementById("flightNumber").value,
      document.getElementById("airline").value,
      document.getElementById("aircraft").value,
      document.getElementById("tailNumber").value,
      document.getElementById("seatClass").value,
      document.getElementById("seatNumber").value
    );

    // Reset the form and hide it after submission
    this.reset();
    modal.style.display = "none";
  });

// handle form submission when editing a trip
document.getElementById("updateTripButton").onclick = updateEditTrip;

// handle json import
document
  .getElementById("json-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const jsonContent = e.target.result;
        try {
          const trips = JSON.parse(jsonContent);
          if (Array.isArray(trips)) {
            for (const trip of trips) {
              await addTripRow(
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
          } else {
            alert(
              "Invalid JSON format. Please upload an Array of trips. See README for more info."
            );
          }
        } catch (err) {
          alert("Error parsing JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  });

// Add a single row
async function addTripRow(
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
  trip.departureCity = departureCity;
  trip.departureIATA = departureIATA.toUpperCase();
  trip.arrivalCity = arrivalCity;
  trip.arrivalIATA = arrivalIATA.toUpperCase();
  trip.takeOffTime = takeOffTime;
  trip.landingTime = landingTime;
  trip.duration = duration;
  trip.distance = distance;
  trip.flightNumber = flightNumber;
  trip.airline = airline;
  trip.aircraft = aircraft;
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
  if (trip.id == null || trip.id == "") {
    trip.id = constructID(trip);
  } else {
    trip.id = id;
  }

  // Draw route on earth
  drawFlightRoute(viewer, trip);

  // TODO: get airline code
  // TODO: get aircraft code/name from dropdown suggestion

  // Create a new row in the travel log table
  const table = document.getElementById("travelLogTable");
  const newRow = table.insertRow(-1); // Insert a new row at the end of the table

  const editButtonHTML =
    '<button id="' +
    trip.id +
    "e" +
    '" class="rowEditButton" onclick="editRow(this)">&plus;</button>';
  const deleteButtonHTML =
    '<button id="' +
    trip.id +
    '" class="rowDeleteButton" onclick="removeRow(this)">&times;</button>';

  // Insert new cells and populate them with the input values
  newRow.insertCell(0).textContent = trip.departureCity;

  const cell1 = newRow.insertCell(1);
  cell1.textContent = trip.departureIATA;
  cell1.classList.add("bold-text");

  newRow.insertCell(2).textContent = trip.arrivalCity;

  const cell3 = newRow.insertCell(3);
  cell3.textContent = trip.arrivalIATA;
  cell3.classList.add("bold-text");

  newRow.insertCell(4).textContent = trip.takeOffTime.replace("T", " ");
  newRow.insertCell(5).textContent = trip.landingTime.replace("T", " ");
  newRow.insertCell(6).textContent = trip.duration;
  newRow.insertCell(7).textContent = trip.distance;
  newRow.insertCell(8).textContent = trip.airline;

  const cell9 = newRow.insertCell(9);
  cell9.textContent = trip.flightNumber;
  cell9.classList.add("bold-text");

  newRow.insertCell(10).textContent = trip.aircraft;
  newRow.insertCell(11).textContent = trip.tailNumber;
  newRow.insertCell(12).textContent = trip.seatClass;
  newRow.insertCell(13).textContent = trip.seatNumber;
  // edit/delete buttons within row
  const cell14 = newRow.insertCell(14);
  cell14.innerHTML = editButtonHTML;
  cell14.classList.add("actionCol");
  const cell15 = newRow.insertCell(15);
  cell15.innerHTML = deleteButtonHTML;
  cell15.classList.add("actionCol");

  // update global var of user's trips
  trips.push(trip);
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));
}

// delete a row
function removeRow(evt) {
  const deleteRowIndex = evt.parentElement.parentElement.rowIndex;
  const deleteTripID = evt.id;
  // delete row in table
  document.getElementById("travelLogTable").deleteRow(deleteRowIndex);
  // delete route on earth
  removeFlightRoute(viewer, deleteTripID);
  // delete trip from storage
  const deleteIdx = trips.findIndex((obj) => obj.id == deleteTripID);
  trips.splice(deleteIdx, 1);
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));
}

// prepare to edit a row
function editRow(evt) {
  const editRowIndex = evt.parentElement.parentElement.rowIndex;
  const editTripID = evt.id.slice(0, -1);
  let trip = trips.find((obj) => obj.id == editTripID);

  // pre-fill the current values in form
  document.getElementById("departureCity").value = trip.departureCity;
  document.getElementById("departureIATA").value = trip.departureIATA;
  document.getElementById("arrivalCity").value = trip.arrivalCity;
  document.getElementById("arrivalIATA").value = trip.arrivalIATA;
  document.getElementById("takeOffTime").value = trip.takeOffTime;
  document.getElementById("landingTime").value = trip.landingTime;
  document.getElementById("flightNumber").value = trip.flightNumber;
  document.getElementById("airline").value = trip.airline;
  document.getElementById("aircraft").value = trip.aircraft;
  document.getElementById("tailNumber").value = trip.tailNumber;
  document.getElementById("seatClass").value = trip.seatClass;
  document.getElementById("seatNumber").value = trip.seatNumber;

  // temporarily save trip and row id that is being edited until update clicked.
  sessionStorage.setItem("editTripID", editTripID);
  sessionStorage.setItem("editRowIndex", editRowIndex);
  // show edit modal, will do updateEditTrip() when submit
  document.getElementById("submitTripButton").setAttribute("hidden", "hidden");
  document.getElementById("updateTripButton").removeAttribute("hidden");
  modal.style.display = "block";
}

// update trip for both UI and storage from input
async function updateEditTrip() {
  // re-fetch the IDs for editing
  const editTripID = sessionStorage.getItem("editTripID");
  const editRowIndex = sessionStorage.getItem("editRowIndex");
  sessionStorage.removeItem("editTripID");
  sessionStorage.removeItem("editRowIndex");

  // record the updated values in form input
  let trip = trips.find((obj) => obj.id == editTripID);
  trip.departureCity = document.getElementById("departureCity").value;
  trip.departureIATA = document.getElementById("departureIATA").value;
  trip.arrivalCity = document.getElementById("arrivalCity").value;
  trip.arrivalIATA = document.getElementById("arrivalIATA").value;
  trip.takeOffTime = document.getElementById("takeOffTime").value;
  trip.landingTime = document.getElementById("landingTime").value;
  trip.flightNumber = document.getElementById("flightNumber").value;
  trip.airline = document.getElementById("airline").value;
  trip.aircraft = document.getElementById("aircraft").value;
  trip.tailNumber = document.getElementById("tailNumber").value;
  trip.seatClass = document.getElementById("seatClass").value;
  trip.seatNumber = document.getElementById("seatNumber").value;
  // always re-calculate these upon update
  trip.distance = getDistance(trip.departureIATA, trip.arrivalIATA);
  trip.duration = await getDuration(
    trip.takeOffTime + ":00",
    trip.landingTime + ":00",
    trip.departureIATA,
    trip.arrivalIATA
  );

  // update table row in place
  const row = document.getElementById("travelLogTable").rows[editRowIndex];
  row.cells[0].textContent = trip.departureCity;
  row.cells[1].textContent = trip.departureIATA;
  row.cells[2].textContent = trip.arrivalCity;
  row.cells[3].textContent = trip.arrivalIATA;
  row.cells[4].textContent = trip.takeOffTime.replace("T", " ");
  row.cells[5].textContent = trip.landingTime.replace("T", " ");
  row.cells[6].textContent = trip.duration;
  row.cells[7].textContent = trip.distance;
  row.cells[8].textContent = trip.airline;
  row.cells[9].textContent = trip.flightNumber;
  row.cells[10].textContent = trip.aircraft;
  row.cells[11].textContent = trip.tailNumber;
  row.cells[12].textContent = trip.seatClass;
  row.cells[13].textContent = trip.seatNumber;

  // re-draw route on earth
  removeFlightRoute(viewer, editTripID);
  drawFlightRoute(viewer, trip);

  // update trip object
  const tripsIndex = trips.findIndex((obj) => obj.id == editTripID);
  trips[tripsIndex] = trip;
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));

  // reset add/update button status in modal
  document.getElementById("tripForm").reset();
  document.getElementById("submitTripButton").removeAttribute("hidden");
  document.getElementById("updateTripButton").setAttribute("hidden", "hidden");
  modal.style.display = "none";
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

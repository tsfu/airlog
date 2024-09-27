const viewer = new Cesium.Viewer("cesiumContainer");

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

// delete a row
function removeRow(evt) {
  const deleteIndex = evt.parentElement.parentElement.rowIndex;
  document.getElementById("travelLogTable").deleteRow(deleteIndex);
}

// load airport info into map
async function init() {
  await getAirportDataAsync();
  Test();
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
  const form = document.getElementById("tripForm");
  form.classList.toggle("hidden");
});

// handle form submission
document
  .getElementById("tripForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get the input values from the form
    let trip = {};
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
    trip.travelClass = document.getElementById("class").value;
    trip.seatNumber = document.getElementById("seatNumber").value;
    const deleteButtonHTML =
      '<button onclick="removeRow(this)">Delete</button>'; // TODO: add edit row (trip) button

    // Calculate duration and distance using airport.js methods
    trip.distance = getDistance(trip.departureIATA, trip.arrivalIATA);
    trip.duration = await getDuration(
      trip.takeOffTime + ":00",
      trip.landingTime + ":00",
      trip.departureIATA,
      trip.arrivalIATA
    );

    // Draw route on earth
    drawFlightRoute(
      viewer,
      trip.departureIATA,
      IATAtoCoordinates(trip.departureIATA),
      trip.arrivalIATA,
      IATAtoCoordinates(trip.arrivalIATA)
    );

    // TODO: get airline code
    // TODO: get aircraft code/name from dropdown suggestion

    // Create a new row in the travel log table
    const table = document.getElementById("travelLogTable");
    const newRow = table.insertRow(-1); // Insert a new row at the end of the table

    // Insert new cells and populate them with the input values
    newRow.insertCell(0).textContent = trip.departureIATA;
    newRow.insertCell(1).textContent = trip.arrivalIATA;
    newRow.insertCell(2).textContent = trip.departureCity;
    newRow.insertCell(3).textContent = trip.arrivalCity;
    newRow.insertCell(4).textContent = trip.takeOffTime.replace("T", " ");
    newRow.insertCell(5).textContent = trip.landingTime.replace("T", " ");
    newRow.insertCell(6).textContent = trip.duration;
    newRow.insertCell(7).textContent = trip.distance;
    newRow.insertCell(8).textContent = trip.airline;
    newRow.insertCell(9).textContent = trip.flightNumber;
    newRow.insertCell(10).textContent = trip.aircraft;
    newRow.insertCell(11).textContent = trip.tailNumber;
    newRow.insertCell(12).textContent = trip.travelClass;
    newRow.insertCell(13).textContent = trip.seatNumber;
    newRow.insertCell(14).innerHTML = deleteButtonHTML;

    // Reset the form and hide it after submission
    trips.push(trip);
    this.reset();
    this.classList.add("hidden");
  });

// Main entry JS
init();

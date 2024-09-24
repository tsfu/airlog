const viewer = new Cesium.Viewer("cesiumContainer");

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
    // test case
    const test = getDistance("BOS", "HKG");
    console.log("TEST BOS-HKG distance:" + test)
}

document.getElementById("addTripButton").addEventListener("click", function () {
  const form = document.getElementById("tripForm");
  form.classList.toggle("hidden");
});

// Handle form submission
document
  .getElementById("tripForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    // Get the input values from the form
    const departureCity = document.getElementById("departureCity").value;
    const departureIATA = document.getElementById("departureIATA").value;
    const arrivalCity = document.getElementById("arrivalCity").value;
    const arrivalIATA = document.getElementById("arrivalIATA").value;
    const takeOffTime = document.getElementById("takeOffTime").value;
    const landingTime = document.getElementById("landingTime").value;
    const flightNumber = document.getElementById("flightNumber").value;
    const airline = document.getElementById("airline").value;
    const aircraft = document.getElementById("aircraft").value;
    const tailNumber = document.getElementById("tailNumber").value;
    const travelClass = document.getElementById("class").value;
    const seatNumber = document.getElementById("seatNumber").value;
    const deleteButtonHTML =
      '<button onclick="removeRow(this)">Delete</button>';

    // Calculate duration and distance use airport.js methods
    let duration = getDuration(takeOffTime, landingTime); // TODO: Use GMT
    let distance = getDistance(departureIATA, arrivalIATA);

    // TODO: get airline code

    // TODO: get aircraft code/name from dropdown suggestion

    // Create a new row in the travel log table
    const table = document.getElementById("travelLogTable");
    const newRow = table.insertRow(-1); // Insert a new row at the end of the table

    // Insert new cells and populate them with the input values
    newRow.insertCell(0).textContent = departureIATA;
    newRow.insertCell(1).textContent = arrivalIATA;
    newRow.insertCell(2).textContent = departureCity;
    newRow.insertCell(3).textContent = arrivalCity;
    newRow.insertCell(4).textContent = takeOffTime;
    newRow.insertCell(5).textContent = landingTime;
    newRow.insertCell(6).textContent = duration;
    newRow.insertCell(7).textContent = distance;
    newRow.insertCell(8).textContent = airline;
    newRow.insertCell(9).textContent = flightNumber;
    newRow.insertCell(10).textContent = aircraft;
    newRow.insertCell(11).textContent = tailNumber;
    newRow.insertCell(12).textContent = travelClass;
    newRow.insertCell(13).textContent = seatNumber;
    newRow.insertCell(14).innerHTML = deleteButtonHTML;

    // Reset the form and hide it after submission
    this.reset();
    this.classList.add("hidden");
  });

// Main entry JS
init();

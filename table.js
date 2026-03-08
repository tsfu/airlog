// change table display while resizing
const mobileView = window.matchMedia("(max-width: 768px)");
mobileView.addEventListener("change", function () {
  if (trips.length == 0) return; // always hide when no trip
  const table = $("#travelLogTable")[0];
  if (mobileView.matches) {
    table.style.display = "block";
  } else {
    table.style.display = "table";
  }
});

// with no trips hide table
function toggleTableDisplay() {
  const table = $("#travelLogTable")[0];
  const search = $(".search-container");
  if (trips.length == 0) {
    table.style.display = "none";
    search.hide();
    return;
  }
  search.show();
  // if toggle table display on mobile
  if (mobileView.matches) {
    table.style.display = "block";
    return;
  }
  table.style.display = "table";
}

// table header sorting UI
const sortCols = $(".sortCol");
sortCols.addClass("tooltip-cell");
for (let i = 0; i < sortCols.length; i++) {
  const cell = sortCols[i];
  cell.setAttribute(
    "data-tooltip",
    "Click to sort trips by " + getColSortName(i) + ", click again to reverse."
  );
  cell.innerHTML = cell.textContent + '&nbsp;&nbsp;<i class="fa fa-sort"></i>';
}

// Get a sort key name for column tooltip
function getColSortName(index) {
  switch (index) {
    case 0:
      return "flight number";
    case 1:
      return "take-off time";
    case 2:
      return "departure";
    case 3:
      return "arrival";
    case 6:
      return "aircraft model";
    default:
      return $(".sortCol")[index].textContent.toLowerCase();
  }
}

function debounce(callback, delayMs) {
  let timeoutId = null;
  return function (...args) {
    const ctx = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      callback.apply(ctx, args);
    }, delayMs);
  };
}

function runTableSearch() {
  const value = $("#searchInput").val().toLowerCase().trim();
  if (value === "") {
    // Show all rows
    $("#travelLogTable tbody tr").show();
    return;
  }
  $("#travelLogTable tbody tr").each(function () {
    const rowStr = getRowFilterString($(this)[0]);
    $(this).toggle(rowStr.includes(value));
  });
}

// Search/filter table
$("#searchInput").on("input", debounce(runTableSearch, 120));

// reset button
$("#resetButton").on("click", function () {
  $("#searchInput").val("");
  runTableSearch();
});

// keyup quick filter: IATA/city/flighNO
function getRowFilterString(row) {
  const trip = window.getTripById
    ? window.getTripById(row.id)
    : trips.find((obj) => obj.id == row.id);
  if (!trip) {
    return "";
  }
  const lower = (value) => (value || "").toString().toLowerCase();
  const compact = (value) => lower(value).replace(/ /g, "");
  const airline = airlineDataMap.get(trip.airline || "");
  const aircraft = aircraftDataMap.get(trip.aircraft || "");

  const tokens = [
    lower(trip.departureIATA),
    lower(trip.arrivalIATA),
    lower(trip.takeOffTime).substring(0, 4),
    lower(trip.departureCity),
    compact(trip.departureCity),
    lower(trip.arrivalCity),
    compact(trip.arrivalCity),
    lower(trip.flightNumber),
    compact(trip.flightNumber),
    lower(trip.airline),
    lower(trip.aircraft),
    lower(airline ? airline.iata : ""),
    lower(aircraft ? aircraft.icao_code : ""),
    lower(airline ? airline.name : ""),
    lower(aircraft ? aircraft.name : ""),
  ];
  return tokens.join(" ");
}

// TODO: Pagination + rows per page

// ==================================== TABLE HELPERS ===================================== //

function escapeHTML(value) {
  return (value || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function flightToHTML(airlineICAO, flightNumber) {
  let img = "";
  if (!airlineICAO) {
    img = '<img src="./assets/unknown.png" height="30px" width="30px"/>';
  } else {
    const imgPath = "./assets/airline_logos/" + airlineICAO + ".png";
    img = '<img src="' + imgPath + '" height="30px" width="30px"/>';
  }
  const html =
    '<p class="flightCell">' +
    img +
    "&nbsp;&nbsp; <b>" +
    escapeHTML(flightNumber) +
    "</b></p>";
  return html;
}

function airportToCountryIconHTML(airportIATA) {
  // Note that airport IATA should already got validated here.
  const countryCode = airportDataMap
    .get(airportIATA)
    .country_code.toLowerCase();
  const html = '<span class="fi fi-' + countryCode + '"></span> ';
  return html;
}

function timeToHTML(takeoff, landing) {
  takeoff = takeoff.split("T");
  landing = landing.split("T");
  let takeoffDate = takeoff[0];
  let landingDate = landing[0];
  let takeoffTime = takeoff[1];
  let landingTime = landing[1];
  const tt = luxon.DateTime.fromISO(takeoffDate + "T12:00:00");
  const tl = luxon.DateTime.fromISO(landingDate + "T12:00:00");

  const datePlus = tl.diff(tt, ["days"]).days;
  if (datePlus > 0) {
    landingTime = landingTime + " (+" + datePlus + ")";
  }
  const html =
    "<p><b>" +
    escapeHTML(takeoffDate) +
    "</b></p><p>" +
    escapeHTML(takeoffTime) +
    ' -<i class="fa fa-plane"></i>- ' +
    escapeHTML(landingTime) +
    "</p>";
  return html;
}

// ==================================== TABLE BASICS ===================================== //

// fill a row in trips table UI using the trip object
function populateRow(trip, row) {
  row.id = trip.id;
  const cells = row.cells;
  // Insert new cells and populate them with the values in trip object
  cells[0].innerHTML = flightToHTML(trip.airline, trip.flightNumber);
  cells[0].setAttribute("data-sort", trip.flightNumber);
  cells[0].classList.add("tooltip-cell");
  if (trip.airline) {
    cells[0].setAttribute(
      "data-tooltip",
      airlineDataMap.get(trip.airline).name
    );
  } else {
    cells[0].setAttribute("data-tooltip", "Unknown Airline");
  }

  cells[1].innerHTML = timeToHTML(trip.takeOffTime, trip.landingTime);

  cells[2].innerHTML =
    "<p><b>" +
    airportToCountryIconHTML(trip.departureIATA) +
    escapeHTML(trip.departureIATA) +
    "</b></p><p>" +
    escapeHTML(trip.departureCity) +
    "</p>";
  cells[2].classList.add("tooltip-cell");
  cells[2].setAttribute(
    "data-tooltip",
    airportDataMap.get(trip.departureIATA).airport
  );

  cells[3].innerHTML =
    "<p><b>" +
    airportToCountryIconHTML(trip.arrivalIATA) +
    escapeHTML(trip.arrivalIATA) +
    "</b></p><p>" +
    escapeHTML(trip.arrivalCity) +
    "</p>";
  cells[3].classList.add("tooltip-cell");
  cells[3].setAttribute(
    "data-tooltip",
    airportDataMap.get(trip.arrivalIATA).airport
  );

  cells[4].textContent = trip.duration;
  cells[4].setAttribute(
    "data-sort",
    trip.duration.replace("h ", ".").slice(0, -3)
  );

  cells[5].textContent = trip.distance;
  cells[5].setAttribute("data-sort", trip.distance.slice(0, -2));

  if (trip.aircraft) {
    cells[6].innerHTML =
      "<p><b>" +
      escapeHTML(aircraftDataMap.get(trip.aircraft).icao_code) +
      "</b></p>";
    cells[6].classList.add("tooltip-cell");
    cells[6].setAttribute(
      "data-tooltip",
      aircraftDataMap.get(trip.aircraft).name
    );
  } else {
    cells[6].innerHTML = "<p><b>unknown</b></p>";
    cells[6].classList.remove("tooltip-cell");
    cells[6].removeAttribute("data-tooltip");
  }
  cells[6].innerHTML += "<p>" + escapeHTML(trip.tailNumber) + "</p>";

  cells[7].innerHTML =
    "<p>" +
    escapeHTML(trip.seatClass) +
    "</p><p>" +
    escapeHTML(trip.seatNumber) +
    "</p>";

  // edit and delete buttons within row
  cells[8].innerHTML = "";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.classList.add("rowEditButton", "tooltip-cell");
  editButton.innerHTML = "&plus;";
  editButton.dataset.tripId = trip.id;
  editButton.setAttribute("data-tooltip", "edit trip");
  editButton.onclick = function () {
    editRow(this);
  };

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add("rowDeleteButton", "tooltip-cell");
  deleteButton.innerHTML = "&times;";
  deleteButton.dataset.tripId = trip.id;
  deleteButton.setAttribute("data-tooltip", "delete trip");
  deleteButton.onclick = async function () {
    await removeRow(this);
  };

  cells[8].appendChild(editButton);
  cells[8].appendChild(deleteButton);
}

// prepare to edit a row
function editRow(evt) {
  const editRowIndex = evt.parentElement.parentElement.rowIndex;
  const editTripID = evt.dataset.tripId;
  let trip = window.getTripById
    ? window.getTripById(editTripID)
    : trips.find((obj) => obj.id == editTripID);
  if (!trip) {
    return;
  }

  // pre-fill the current values in form
  $("#departureCity").val(trip.departureCity);
  $("#departureIATA").val(trip.departureIATA);
  $("#arrivalCity").val(trip.arrivalCity);
  $("#arrivalIATA").val(trip.arrivalIATA);
  $("#takeOffTime").val(trip.takeOffTime);
  $("#landingTime").val(trip.landingTime);
  $("#flightNumber").val(trip.flightNumber);
  $("#airline").val(trip.airline);
  $("#aircraft").val(trip.aircraft);
  $("#tailNumber").val(trip.tailNumber);
  $("#seatClass").val(trip.seatClass);
  $("#seatNumber").val(trip.seatNumber);

  // temporarily save trip and row id that is being edited until update clicked.
  sessionStorage.setItem("editTripID", editTripID);
  sessionStorage.setItem("editRowIndex", editRowIndex);
  // show edit modal, will do updateTrip() when submit
  $("#submitTripButton").attr("hidden", "hidden");
  $("#updateTripButton").removeAttr("hidden");
  modal.show();
}

// delete a row
async function removeRow(evt) {
  const deleteRowIndex = evt.parentElement.parentElement.rowIndex;
  const deleteTripID = evt.dataset.tripId;
  // delete trip from storage
  const deleteIdx = trips.findIndex((obj) => obj.id == deleteTripID);
  if (deleteIdx < 0) {
    return;
  }
  // delete row in table
  $("#travelLogTable")[0].deleteRow(deleteRowIndex);
  trips.splice(deleteIdx, 1);
  if (window.removeTripFromIndex) {
    window.removeTripFromIndex(deleteTripID);
  }
  await deleteTripFromStorage(deleteTripID);
  // re-draw all routes to keep shared route/airport entities consistent
  refreshGlobeRoutes(viewer);
  // reload stats
  loadStats();
  // if trips count dropped to 0 then hide table
  toggleTableDisplay();
}

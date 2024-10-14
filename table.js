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
      return "departure";
    case 1:
      return "arrival";
    case 2:
      return "take-off time";
    case 6:
      return "flight number";
    case 7:
      return "aircraft model";
    case 8:
      return "airplane tail number";
    default:
      return $(".sortCol")[index].textContent.toLowerCase();
  }
}

// Search/filter table
$("#searchInput").on("keyup", function () {
  let value = $(this).val().toLowerCase();
  $("#travelLogTable tbody tr").each(function () {
    let rowStr = getRowFilterString($(this)[0]);
    $(this).toggle(rowStr.includes(value));
  });
});

// Handle when input is cleared or loses focus
$("#searchInput").on("input", function () {
  const value = $(this).val();
  if (value === "") {
    // Show all rows
    $("#travelLogTable tbody tr").show();
  }
});

// reset button
$("#resetButton").on("click", function () {
  $("#searchInput").val("");
  $("#travelLogTable tbody tr").show();
});

// keyup quick filter: IATA/city/flighNO
function getRowFilterString(row) {
  let str = "";
  for (let i = 0; i < 4; i++) {
    const cell = row.cells[i];
    str += cell.textContent;
  }
  str += row.cells[4].textContent.substring(0, 4);
  str += row.cells[9].textContent;
  return str.toLowerCase().replace(/ /g, "");
}

// TODO: Pagination + rows per page


// ==================================== TABLE BASICS ===================================== //

// fill a row in trips table UI using the trip object
function populateRow(trip, row) {
  const cells= row.cells;
  // Insert new cells and populate them with the values in trip object
  cells[0].innerHTML =
    airportToCountryIconHTML(trip.departureIATA) + trip.departureIATA;
  cells[0].classList.add("thinCol");
  cells[0].classList.add("tooltip-cell");
  cells[0].setAttribute(
    "data-tooltip",
    airportDataMap.get(trip.departureIATA).airport
  );

  cells[2].innerHTML =
  airportToCountryIconHTML(trip.arrivalIATA) + trip.arrivalIATA;
  cells[2].classList.add("thinCol");
  cells[2].classList.add("tooltip-cell");
  cells[2].setAttribute(
    "data-tooltip",
    airportDataMap.get(trip.arrivalIATA).airport
  );

  cells[1].textContent = trip.departureCity;
  cells[3].textContent = trip.arrivalCity;
  cells[4].textContent = trip.takeOffTime.replace("T", " ");
  cells[5].textContent = trip.landingTime.replace("T", " ");
  
  cells[6].textContent = trip.duration;
  cells[6].setAttribute("data-sort", trip.duration.replace("h ",".").slice(0,-3));
  
  cells[7].textContent = trip.distance;
  cells[7].setAttribute("data-sort", trip.distance.slice(0,-2));
  
  cells[8].innerHTML = airlineToLogoHTML(trip.airline);
  cells[8].setAttribute("data-sort", trip.airline);
  cells[8].classList.add("thinCol");
  cells[8].classList.add("tooltip-cell");
  if (trip.airline) {
    cells[8].setAttribute(
      "data-tooltip",
      airlineDataMap.get(trip.airline).name
    );
  } else {
    cells[8].setAttribute("data-tooltip", "Unknown Airline");
  }

  cells[9].classList.add("thinCol");
  cells[9].textContent = trip.flightNumber;

  cells[10].classList.add("thinCol");
  if (trip.aircraft) {
    cells[10].textContent = aircraftDataMap.get(trip.aircraft).icao_code;
    cells[10].classList.add("tooltip-cell");
    cells[10].setAttribute(
      "data-tooltip",
      aircraftDataMap.get(trip.aircraft).name
    );
  } else {
    cells[10].textContent = "unknown";
    cells[10].classList.remove("tooltip-cell");
    cells[10].removeAttribute("data-tooltip");
  }

  cells[11].textContent = trip.tailNumber;
  cells[12].textContent = trip.seatClass;
  cells[13].textContent = trip.seatNumber;  
  // edit and delete buttons within row
  const editButtonHTML =
    '<button id="' +
    trip.id +
    "e" +
    '" class="rowEditButton" onclick="editRow(this)">&plus;</button>';
  const deleteButtonHTML =
    '<button id="' +
    trip.id +
    '" class="rowDeleteButton" onclick="removeRow(this)">&times;</button>';   
  cells[14].innerHTML = editButtonHTML;
  cells[14].classList.add("thinCol");
  cells[15].innerHTML = deleteButtonHTML;
  cells[15].classList.add("thinCol");
}

// prepare to edit a row
function editRow(evt) {
  const editRowIndex = evt.parentElement.parentElement.rowIndex;
  const editTripID = evt.id.slice(0, -1);
  let trip = trips.find((obj) => obj.id == editTripID);

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
function removeRow(evt) {
  const deleteRowIndex = evt.parentElement.parentElement.rowIndex;
  const deleteTripID = evt.id;
  // delete row in table
  $("#travelLogTable")[0].deleteRow(deleteRowIndex);
  // delete route on earth
  removeFlightRoute(viewer, deleteTripID);
  // delete trip from storage
  const deleteIdx = trips.findIndex((obj) => obj.id == deleteTripID);
  trips.splice(deleteIdx, 1);
  localStorage.setItem(tripStorageKey, JSON.stringify(trips));
  // reload stats
  loadStats();
  // if trips count dropped to 0 then hide table
  toggleTableDisplay();
}

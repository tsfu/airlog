// change table display while resizing
const mobileView = window.matchMedia("(max-width: 768px)");
mobileView.addEventListener("change", function(){
  if(trips.length == 0) return; // always hide when no trip
  const table = $("#travelLogTable")[0];
  if (mobileView.matches) {
    table.style.display= "block";
  }
  else {
    table.style.display= "table";
  }
});

// with no trips hide table
function toggleTableDisplay() {
  const table = $("#travelLogTable")[0];
  const search = $(".search-container");
  if (trips.length == 0) {
    table.style.display= "none";
    search.hide();
    return;
  } 
  search.show();
  // if toggle table display on mobile
  if (mobileView.matches) {
    table.style.display= "block";
    return;
  }
  table.style.display= "table";
}


// Sort table


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
  str += row.cells[4].textContent.substring(0,4);
  str += row.cells[9].textContent;
  return str.toLowerCase().replace(/ /g, '');
}

// TODO: Pagination + rows per page

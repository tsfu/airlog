const viewer = new Cesium.Viewer('cesiumContainer');

// Function to switch between tabs
function openTab(event, tabName) {
// Get all elements with class="tab-content" and hide them
var tabContents = document.getElementsByClassName('tab-content');
for (var i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
}

// Show the current tab and add "active" class to the clicked tab
document.getElementById(tabName).classList.add('active');

// Remove active state from all links
var tabLinks = document.getElementsByClassName('tab-link');
for (var i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove('active');
}

// Add active state to the clicked tab link
event.currentTarget.classList.add('active');
}
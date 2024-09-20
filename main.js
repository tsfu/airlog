const viewer = new Cesium.Viewer('cesiumContainer');

document.getElementById('globeLink').addEventListener('click', function() {
    document.getElementById('cesiumContainer').style.display = 'block';
    document.getElementById('travelLog').style.display = 'none';
});

document.getElementById('logLink').addEventListener('click', function() {
    document.getElementById('cesiumContainer').style.display = 'none';
    document.getElementById('travelLog').style.display = 'block';
});
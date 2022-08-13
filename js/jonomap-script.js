const mapsKey = config.MAPS_API_KEY;

window.addEventListener('load', () => {
    document.getElementById('request').src = `https://maps.googleapis.com/maps/api/js?key=' + mapsKey + '&callback=initMap&v=weekly`;
});

function initMap() {
    var location = {lat: -25.363, lng: 131.044};
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4, 
        center: location
    });

    var marker =  new maps.google.Marker({
        position: location,
        map: map
    });
}
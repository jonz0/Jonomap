const maps_api = process.env.MAPS_API_KEY;
const mapsUrl = 'https://maps.googleapis.com/maps/api/js?key=' + process.env.MAPS_API_KEY + '&callback=initMap&v=weekly';


// Initialize and add the map
function initMap() {
  const uluru = { lat: -25.344, lng: 131.031 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: uluru,
  });
  const marker = new google.maps.Marker({
    position: uluru,
    map: map,
  });
}
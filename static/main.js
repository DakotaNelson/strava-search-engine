window.onload = function() {
  initMap();
  initSearchListener();
};

var popup_template = document.getElementById("popup-template").innerHTML;

var map = null;
var marker_layers = L.layerGroup();

function initSearchListener() {
  var e = document.getElementById('search-box');
  e.oninput = _.debounce(performSearch, 500);
}

function initMap() {
  map = L.map('map').setView([20, 0], 3);
  marker_layers.addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function performSearch() {
  var query = document.getElementById("search-box").value;
  // clear the map no matter what
  marker_layers.clearLayers();
  if(query === "") {
    return;
  }
  console.log("searching for " + query);
  fetch("http://localhost:5000/api/namesearch/" + query)
    .then(function(response) {
      return response.json();
    })
    .then(function(resp_json) {
      _.each(resp_json, function(activity) {
        // clean the lat and lon pairs
        if(activity['latlng'] === null) {
          return;
        }
        var latlngs = _.filter(activity['latlng'], function(latlng) { return latlng != null; });
        addLine(latlngs);

        // build the popup for this user
        var view = {
          "avatar": activity['user']['avatar'],
          "user_url": activity['user']['user_url'],
          "full_name": activity['full_name']
        };
        var popup_html = Mustache.render(popup_template, view);

        // add start and end markers
        addMarker(latlngs[0], 'start', activity['full_name'], popup_html);
        addMarker(latlngs[latlngs.length - 1], 'end', activity['full_name'], popup_html);
      });
    });
}

function addLine(latlngs) {
  marker_layers.addLayer(L.polyline(latlngs, {color: 'red'}));
}

function addMarker(latlng, start_or_end, title, popup_html) {
  var greenIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  var redIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if(start_or_end === 'start') {
    var marker = L.marker(latlng, {"icon": greenIcon, "title": title});
  }
  else {
    // should probably put error handling here but meh
    var marker = L.marker(latlng, {"icon": redIcon, "title": title});
  }
  marker.bindPopup(popup_html);
  marker_layers.addLayer(marker);
}

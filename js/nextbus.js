// "use strict";
const UPDATE_INTERVAL = 2000;

let map;
let markers = [];
let lastTime = 0;

function initRoute() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=seattle-sc&r=FHS` }).done(function(data) {

    let routeCoords = [];

    for (const path of data.route.path) {
      for (const points of path.point) {
        routeCoords.push({lat: Number(points.lat), lng: Number(points.lon)});
      }

      let routeLines = new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.5,
        strokeWeight: 5
      });

      routeLines.setMap(map);
      routeCoords = [];
    }

    initStops(data.route.stop);
  });
}

function initStops(stops) {
  console.log(stops);
}

function getStreetCarDataInitial() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=seattle-sc&r=FHS&t=0` }).done(function(data) {
    lastTime = data.lastTime.time;
    let iterator = 0;
    for (const vehicle of data.vehicle) {
      markers[iterator] = new google.maps.Marker(
        {
          map: map,
          label: "",
          duration: 2000,
          easing: "jswing",
          speedMph: convertKmHrToMph(vehicle.speedKmHr),
          markerLastTime: vehicle.secsSinceReport,
          icon: {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 4,
            rotation: 0
          }
        });

      markers[iterator].set("id", vehicle.id);

      const fillColor = getIconColor(iterator);

      markers[iterator].icon.strokeColor = fillColor;

      markers[iterator].set("infoWindow", new google.maps.InfoWindow({
        content: ""
      }));

      markers[iterator].addListener('click', function() {
        this.infoWindow.open(map, this);
      });

      setStreetCarRotation(markers[iterator], vehicle.heading);
      setStreetCarPosition(markers[iterator], {lat: Number(vehicle.lat), lng: Number(vehicle.lon)});

      updateInfoWindow(markers[iterator]);

      iterator++;
    }

    setInterval(getStreetCarData, UPDATE_INTERVAL);
    setInterval(updateIntervals, 1000);
  });
}

function getStreetCarData() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=seattle-sc&r=FHS&t=${lastTime}` }).done(function(data) {

    if (!data.vehicle) {
      console.log("No updates", data);
      return;
    }

    // If the AJAX call returns one element, convert it into an array for data consistency.
    if (!Array.isArray(data.vehicle)) {
      data.vehicle = [data.vehicle];
    }

    lastTime = data.lastTime.time;

    for (const vehicle of data.vehicle) {
      const coords = {lat: Number(vehicle.lat), lng: Number(vehicle.lon)};
      const marker = findMarkerById(vehicle.id);

      if (!marker) {
        console.error("Couldn't find marker!", vehicle.id);
      }
      else {
        marker.set("markerLastTime", vehicle.secsSinceReport);
        marker.set("speedMph", convertKmHrToMph(vehicle.speedKmHr));
        // updateInfoWindow(marker, vehicle);
        setStreetCarRotation(marker, vehicle.heading);
        setStreetCarPosition(marker, coords);

        console.log(marker.icon.strokeColor, vehicle.heading, marker.icon.rotation);
      }
    }
  });
}

function convertKmHrToMph(speed) {
  return speed === undefined ? "N/A" : Math.round(speed * 0.62137119223733) + " Mph";
}

function updateIntervals() {
  for (const marker of markers) {
    const markerLastTime = Number(marker.get("markerLastTime"));
    marker.set("markerLastTime", markerLastTime + 1);
    updateAllInfoWindows();
  }
}

function updateInfoWindow(marker) {
  const lat = marker.getPosition().lat().toFixed(6);
  const lng = marker.getPosition().lng().toFixed(6);

  const contentString = `<ul>
    <li>Last Updated: ${marker.markerLastTime} seconds ago</li>
    <li>Last Speed: ${marker.speedMph}</li>
    <li>Location: ${lat}, ${lng}</li>
    </ul>`;

  marker.infoWindow.setContent(contentString);
}

function updateAllInfoWindows() {
  for (const marker of markers) {
    updateInfoWindow(marker);
  }
}

function setStreetCarPosition(marker, coords) {
  marker.setPosition(coords);
}

function setStreetCarRotation(marker, degrees) {
  marker.icon.rotation = Number(degrees);
  marker.setIcon(marker.icon);
}

function findMarkerById(id) {
  for (const marker of markers) {
    if (marker.id === id) {
      return marker;
    }
  }

  return null;
}

function initMap() {
  const centerRoute = {lat: 47.609809, lng: -122.320826};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: centerRoute
  });
}

function getIconColor(color) {
  let fillColor = "purple";

  switch(color) {
    case 0:
      fillColor = 'orange';
      break;
    case 1:
      fillColor = "blue";
      break;
    case 2:
      fillColor = "red";
      break;
    case 3:
      fillColor = "green";
      break;
  }

  return fillColor;
}

$(".button-collapse").sideNav();
initMap();
initRoute();
getStreetCarDataInitial();

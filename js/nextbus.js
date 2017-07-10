// "use strict";
const UPDATE_INTERVAL = 2000;

let map;
let markers = [];
let stops = [];
let favorites = [];
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
        strokeColor: "black",
        strokeOpacity: 0.7,
        strokeWeight: 3
      });

      routeLines.setMap(map);
      routeCoords = [];
    }

    initStops(data.route.stop);
  }).fail(function(data) {
    console.error("There was an error retrieving data from the API.");
  });
}

function initStops(stopData) {
  let iterator = 0;

  for (const stop of stopData) {
    stops[iterator] = new google.maps.Marker(
      {
        map: map,
        label: "",
        optimized: false,
        zIndex: 1,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          // url: "img/stop_marker_scaled.png",
          // scaledSize: new google.maps.Size(20, 20),
          // origin: new google.maps.Point(0,0),
          // anchor: new google.maps.Point(10, 16),
          scale: 4,
          // rotation: 0,
          // fillColor: "red"
          strokeColor: "blue",
          fillColor: "blue",
          fillOpacity: 1
        }
      });

    const coords = {lat: Number(stop.lat), lng: Number(stop.lon)};

    stops[iterator].setPosition(coords);

    stops[iterator].set("stopId", stop.stopId);
    stops[iterator].set("title", stop.title);
    stops[iterator].set("infoWindow", new google.maps.InfoWindow({
      content: stop.title
    }));

    stops[iterator].addListener('click', function() {
      getArrivalTime(this);
      closeAllInfoWindows();
      this.infoWindow.open(map, this);
    });

    iterator++;
  }
}

function getArrivalTime(stop) {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=predictions&a=seattle-sc&r=FHS&s=${stop.stopId}` }).done(function(data) {

    let contentString = "<ul>";

    contentString += `<li>${stop.title}</li>`;

    for (const arrivalTime of data.predictions.direction.prediction) {
      contentString += `<li>${arrivalTime.minutes}</li>`;
    }

    contentString += "</ul>";
    stop.infoWindow.setContent(contentString);
  }).fail(function(data) {
    console.error("There was an error retrieving data from the API.");
  });
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
          zIndex: 10,
          optimized: false,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            rotation: 0,
            fillOpacity: 1
          }
        });

      markers[iterator].set("id", vehicle.id);

      const fillColor = getIconColor(iterator);

      markers[iterator].icon.strokeColor = fillColor;
      markers[iterator].icon.fillColor = fillColor;

      markers[iterator].set("infoWindow", new google.maps.InfoWindow({
        content: ""
      }));

      markers[iterator].addListener('click', function() {
        closeAllInfoWindows();
        this.infoWindow.open(map, this);
      });

      setStreetCarRotation(markers[iterator], vehicle.heading);
      setStreetCarPosition(markers[iterator], {lat: Number(vehicle.lat), lng: Number(vehicle.lon)});

      updateInfoWindow(markers[iterator]);

      iterator++;
    }

    setInterval(getStreetCarData, UPDATE_INTERVAL);
    setInterval(updateIntervals, 1000);
  }).fail(function(data) {
    console.error("There was an error retrieving data from the API.");
  });
}

function getStreetCarData() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=seattle-sc&r=FHS&t=${lastTime}` }).done(function(data) {

    if (!data.vehicle) {
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
  }).fail(function(data) {
    console.error("There was an error retrieving data from the API.");
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
    center: centerRoute,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    clickableIcons: false
  });

  map.addListener("click", function() {
    closeAllInfoWindows();
  });
}

function getIconColor(color) {
  let fillColor = "black";

  switch(color) {
    case 0:
      fillColor = 'orange';
      break;
    case 1:
      fillColor = "purple";
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

function closeAllInfoWindows() {
  for (const stop of stops) {
    stop.infoWindow.close();
  }

  for (const marker of markers) {
    marker.infoWindow.close();
  }
}

function addFavorite(stopId) {
  favorites.push(stopId);

  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getFavorites() {
  favorites = JSON.parse(localStorage.getItem("favorites"));

  const $collapsible = $(".collapsible");

  for (const favorite of favorites) {
    const $collapseLi = $("<li>");
    const $stopDiv = $("<div>").addClass("collapsible-header").text(favorite);
    const $stopInfo = $("<div>").addClass("collapsible-body").text("Arriving in 0 minutes");
    const $stopIcon = $("<i>").addClass("material-icons").text("favorite");

    $stopDiv.append($stopIcon);
    $collapseLi.append($stopDiv, $stopInfo);
    $collapsible.append($collapseLi);
  }

  $('.collapsible').collapsible();
}

$(".button-collapse").sideNav();
initMap();
initRoute();
getStreetCarDataInitial();

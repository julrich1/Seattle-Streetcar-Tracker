// "use strict";
let map;
let markers = [];

function getStreetCarDataInitial() {
  $.ajax({ url: `http://api.pugetsound.onebusaway.org/api/where/trips-for-route/23_102638.json?key=${API_KEY_ONE_BUS_AWAY}&includeStatus=true`, dataType: "jsonp" }).done(function(data) {
    data = data.data.list;

    let iterator = 0;
    for (const trip of data) {
      markers[iterator].activeTripId = trip.status.activeTripId;

      let fillColor = "purple";
      switch(iterator) {
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
      markers[iterator].icon.strokeColor = fillColor;

      setStreetCarRotation(markers[iterator], trip.status.orientation);
      setStreetCarPosition(markers[iterator], {lat: trip.status.position.lat, lng: trip.status.position.lon});
      iterator++;
    }

    let timer = setInterval(getStreetCarData, 2000);
  });
}

function getStreetCarData() {
  $.ajax({ url: `http://api.pugetsound.onebusaway.org/api/where/trips-for-route/23_102638.json?key=${API_KEY_ONE_BUS_AWAY}&includeStatus=true`, dataType: "jsonp" }).done(function(data) {
    data = data.data.list;

    for (const trip of data) {
      const coords = {lat: trip.status.position.lat, lng: trip.status.position.lon};

      const marker = findMarkerById(trip.status.activeTripId);

      if (!marker) {
        console.log("couldn't find marker!", trip.status.activeTripId);
      }
      else {
        setStreetCarRotation(marker, trip.status.orientation);
        setStreetCarPosition(marker, coords);

        console.log(marker.icon.strokeColor, trip.status.orientation, marker.icon.rotation);
      }
    }
  });
}

function setStreetCarPosition(marker, coords) {
  marker.setPosition(coords);
}

function setStreetCarRotation(marker, degrees) {
  marker.icon.rotation = -(degrees - 90);
  marker.setIcon(marker.icon);
}

function findMarkerById(id) {
  for (const marker of markers) {
    if (marker.activeTripId === id) {
      return marker;
    }
  }

  return null;
}

function initMap() {
  const uluru = {lat: 47.609809, lng: -122.320826};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: uluru
  });

  for (let i = 0; i < 4; i++) {
    const marker = new google.maps.Marker(
      {
        map: map,
        label: "",
        icon: {
          path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
          scale: 4,
          rotation: 0
        }
      }
    );
    markers.push(marker);
  }
}

// let timer = setInterval(getStreetCarData, 5000);
getStreetCarDataInitial();

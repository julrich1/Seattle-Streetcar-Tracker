// "use strict";
let map;
let markers = [];
let lastTime = 0;

function getStreetCarDataInitial() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=seattle-sc&r=FHS&t=0` }).done(function(data) {
    lastTime = data.lastTime.time;
    let iterator = 0;
    for (const vehicle of data.vehicle) {
      markers[iterator].id = vehicle.id;

      const fillColor = getIconColor(iterator);

      markers[iterator].icon.strokeColor = fillColor;

      setStreetCarRotation(markers[iterator], vehicle.heading);
      setStreetCarPosition(markers[iterator], {lat: Number(vehicle.lat), lng: Number(vehicle.lon)});
      iterator++;
    }

    setInterval(getStreetCarData, 2000);
  });
}

function getStreetCarData() {
  $.ajax({ url: `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=seattle-sc&r=FHS&t=${lastTime}` }).done(function(data) {

    if (!data.vehicle) {
      console.log("No updates", data);
      return;
    }
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
        setStreetCarRotation(marker, vehicle.heading);
        setStreetCarPosition(marker, coords);

        console.log(marker.icon.strokeColor, vehicle.heading, marker.icon.rotation);
      }
    }
  });
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
        duration: 2000,
        easing: "jswing",
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

// let timer = setInterval(getStreetCarData, 5000);
initMap();
getStreetCarDataInitial();

// "use strict";

function getStreetCarData() {
  $.ajax({ url: `http://api.pugetsound.onebusaway.org/api/where/trips-for-route/23_102638.json?key=${API_KEY_ONE_BUS_AWAY}&includeStatus=true`, dataType: "jsonp" }).done(function(data) {
    data = data.data.list;
// console.log(data);
    for (const trip of data) {
      console.log(trip.status.position);
    }
  });
}

getStreetCarData();

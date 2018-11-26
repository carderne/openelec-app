//import css from 'https://api.tiles.mapbox.com/mapbox-gl-js/v0.51.0/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import $ from 'jquery';
import 'mapbox-gl/dist/mapbox-gl.css';
import './style.css';

// dangerous?
// @import url('https://fonts.googleapis.com/css?family=Roboto');

$(document).ready(init);

function init() {
  createMap();
}

var map;
function createMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puZnE3YXkxMDBrZTNrczI3cXN2OXQzNiJ9.2BDgu40zHwh3CAfHs6reAQ';
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [28.2, -29.65],
      zoom: 8
  });
}
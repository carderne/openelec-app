import $ from 'jquery';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import geojsonExtent from '@mapbox/geojson-extent';
import osmtogeojson from 'osmtogeojson';

import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-slider'
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css'

import './style.css';

// dangerous?
// @import url('https://fonts.googleapis.com/css?family=Roboto');

// can be one of ['plan-nat', 'plan-loc', 'find-nat', 'find-loc'] 
var activeModel;

$(document).ready(init);
$('#go-home').click(home);
$('#go-about').click(about);
$('#run-model').click(run);
$('#go-plan').click(plan);
$('#go-plan-big').click(plan);
$('#go-find').click(find);
$('#go-find-big').click(find);

function init() {
  createMap();
  $("#slider-grid-dist").slider();
  $("#slider-grid-dist").on("slide", function(slideEvt) {
    $("#slider-grid-dist-val").text(slideEvt.value);
  });
}

var map;
function createMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puZnE3YXkxMDBrZTNrczI3cXN2OXQzNiJ9.2BDgu40zHwh3CAfHs6reAQ';
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [0, 0],
      zoom: 4
  });

  $.ajax({
    url: "/get_country",
    success: function(data) {
      map.flyTo({
        center: [data.lng, data.lat],
        zoom: data.zoom
      });

      map.addSource('clusters', { type: 'geojson', data: data.clusters });
      map.addLayer({
        'id': 'clusters',
        'type': 'fill',
        'source': 'clusters',
        'paint': {
          'fill-color': [
              'match',
              ['get', 'type'],
              'orig', '#fbb03b',
              'new', '#223b53',
              'og', '#e55e5e',
              /* other */ '#b2e2e2'
            ],
          'fill-opacity': 0.5
        }
      });

      map.addSource('grid', { type: 'geojson', data: data.grid });
      map.addLayer({
        'id': 'grid',
        'type': 'line',
        'source': 'grid',
        "layout": {
          "line-join": "round",
          "line-cap": "round"
        },
        "paint": {
          "line-color": "black",
          "line-width": 3
        }
      });
    }
  });
}

$('.js-loading-bar').modal({
  backdrop: 'static',
  show: false
});

function run() {
  $('#loading-bar').modal('show');
  if (activeModel == 'plan-nat') {
    runElectrify();
  } else if (activeModel == 'plan-loc') {
    runMgo();
  }
  
}


/**
 * Run the model with the user-provided input parameters.
 */
function runElectrify() {
    $.ajax({
        url: "/run_electrify",
        success: function(data) {
          map.addSource('network', { type: 'geojson', data: data.network });
          map.addLayer({
            'id': 'network',
            'type': 'line',
            'source': 'network',
            "layout": {
              "line-join": "round",
              "line-cap": "round"
            },
            "paint": {
              "line-color": "black",
              "line-width": 3
            }
          });

          map.getSource('clusters').setData(data.clusters);
          map.on('click', 'clusters', function (e) {
            var features = map.queryRenderedFeatures(e.point);
            console.log(features[0].geometry);
            var bbox = geojsonExtent(features[0].geometry);
            map.fitBounds(bbox, {padding: 20});
            getOsmData(bbox)
          });

          // Change the cursor to a pointer when the mouse is over the states layer.
          map.on('mouseenter', 'clusters', function () {
            map.getCanvas().style.cursor = 'pointer';
          });

          // Change it back to a pointer when it leaves.
          map.on('mouseleave', 'clusters', function () {
            map.getCanvas().style.cursor = '';
          });

          $('#loading-bar').modal('hide');
        }
    });
}

var villageData;
function getOsmData(bounds) {
    console.log(bounds)
    var overpassApiUrl = buildOverpassApiUrl('building', bounds);

    $.get(overpassApiUrl, function (osmDataAsJson) {
        villageData = JSON.stringify(osmtogeojson(osmDataAsJson));

        console.log(villageData)
        prepForMgoRun();
    });
}

function buildOverpassApiUrl(overpassQuery, bounds) {
    var west = bounds[0];
    var south = bounds[1];
    var east = bounds[2];
    var north = bounds[3];

    var bounds = south + ', ' + west + ', ' + north + ', ' + east;
    var nodeQuery = 'node[' + overpassQuery + '](' + bounds + ');';
    var wayQuery = 'way[' + overpassQuery + '](' + bounds + ');';
    var relationQuery = 'relation[' + overpassQuery + '](' + bounds + ');';
    var query = '?data=[out:json][timeout:15];(' + nodeQuery + wayQuery + relationQuery + ');out body geom;';
    var baseUrl = 'http://overpass-api.de/api/interpreter';
    var resultUrl = baseUrl + query;
    return resultUrl;
}

function prepForMgoRun() {
    activeModel = 'plan-loc';
}

/**
 * Run the model with the user-provided input parameters.
 */
function runMgo() {
    $.ajax({
        url: "/run_mgo",
        data: {
            village: villageData,
            min_area: 20,
            demand: 6,
            tariff: 0.2,
            gen_cost: 1000,
            cost_wire: 10,
            cost_connection: 100,
            opex_ratio: 1 / 100,
            years: 10,
            discount_rate: 6 / 100
        },
        success: updateWithResults
    });
}


/**
 * After model run, display summary results and
 * update map with network and connected buildings.
 */
function updateWithResults(data) {
    map.addSource('buildings', { type: 'geojson', data: data.buildings });
    map.addLayer({
      'id': 'buildings',
      'type': 'fill',
      'source': 'buildings',
      'paint': {
        'fill-color': '#223b53',
        'fill-opacity': 0.5
      }
    });

    map.addSource('lv', { type: 'geojson', data: data.network });
    map.addLayer({
      'id': 'lv',
      'type': 'line',
      'source': 'lv',
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": "black",
        "line-width": 3
      }
    });

    $('#loading-bar').modal('hide');
}


function explore() {
  hide("landing");
  show("explore");
  hide("about");
  map.resize();
}

function plan() {
  // pushState doesn't work from static file, test with Flask
  //window.history.pushState({}, 'OpenElec | Plan', 'openelec.com/plan');
  activeModel = 'plan-nat'
  activeMode("go-plan");
  explore();
}

function find() {
  activeMode("go-find");
  explore();
}

function home() {
  activeMode();
  show("landing");
  hide("explore");
  hide("about");
}

function about() {
  activeMode();
  hide("landing");
  hide("explore");
  show("about");
}

function activeMode(mode) {
  disableClass("go-plan", "btn-primary");
  disableClass("go-find", "btn-primary");
  if (mode) {
    enableClass(mode, "btn-primary");
  }
}

function hide(elementId) {
  enableClass(elementId, "hidden");
}

function show(elementId) {
  disableClass(elementId, "hidden");
}

function enableClass(elementId, className) {
  var element = document.getElementById(elementId)
  if (!element.classList.contains(className)) {
    element.classList.add(className)
  }
}

function disableClass(elementId, className) {
  var element = document.getElementById(elementId);
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}
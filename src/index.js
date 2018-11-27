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
}

var zoomOut = {'lat': 0, 'lng': 0, 'zoom': 4};

var map;
function createMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puZnE3YXkxMDBrZTNrczI3cXN2OXQzNiJ9.2BDgu40zHwh3CAfHs6reAQ';
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [zoomOut.lng, zoomOut.lat],
      zoom: zoomOut.zoom
  });
  map.addControl(new mapboxgl.NavigationControl());

  $.ajax({
    url: "/get_country",
    success: function(data) {
      zoomOut.lng = data.lng;
      zoomOut.lat = data.lat;
      zoomOut.zoom = data.zoom;
      map.flyTo({
        center: [zoomOut.lng, zoomOut.lat],
        zoom: zoomOut.zoom
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

      // Change the cursor to a pointer when the mouse is over the states layer.
      map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
      });
    }
  });
}

$('.js-loading-bar').modal({
  backdrop: 'static',
  show: false
});

var clickMsg = 'Click on a cluster to optimise local network';

function run() {
  $('#loading-bar').modal('show');
  if (activeModel == 'plan-nat') {
    runElectrify();
    $('#map-announce').html(clickMsg)
    show('map-announce-outer')
  } else if (activeModel == 'plan-loc') {
    runMgo();
  } else if (activeModel == 'find-nat') {
    runFindNat();
    $('#map-announce').html(clickMsg)
    show('map-announce-outer')
  }
  
}

function runFindNat() {
  $.ajax({
    url: "/find_clusters",
    data: findNatParams,
    success: showFindNatResults
});
}

var findNatSummary = ''
function showFindNatResults(data) {
  map.getSource('clusters').setData(data.clusters);
  map.setPaintProperty('clusters', 'fill-color', {
    property: 'score',
    stops: [[1, '#b2e2e2'], [5, '#006d2c']]
  });
  map.on('click', 'clusters', function (e) {
    var features = map.queryRenderedFeatures(e.point);
    var bbox = geojsonExtent(features[0].geometry);
    map.fitBounds(bbox, {padding: 20});
    getOsmData(bbox)
  });

  let val = data.summary;
  let summary = $("#summary");

  summary.html('');
  summary.append('<p>Clusters found: ' + val.num_clusters + '</p>');
  planNatSummary = summary.html();

  $('#loading-bar').modal('hide');
}

/**
 * Run the model with the user-provided input parameters.
 */
function runElectrify() {
  $.ajax({
      url: "/run_electrify",
      data: planNatParams,
      success: showElectrifyResults
  });
}

var planNatSummary = '';
function showElectrifyResults(data) {
  if (map.getSource("network")) {
    map.getSource('network').setData(data.network);
  } else {
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
  }

  map.getSource('clusters').setData(data.clusters);
  map.setPaintProperty('clusters', 'fill-color', [
    'match',
    ['get', 'type'],
    'orig', '#fbb03b',
    'new', '#223b53',
    'og', '#e55e5e',
    '#b2e2e2'
  ]);

  map.on('click', 'clusters', function (e) {
    var features = map.queryRenderedFeatures(e.point);
    var bbox = geojsonExtent(features[0].geometry);
    map.fitBounds(bbox, {padding: 20});
    getOsmData(bbox)
  });

  let val = data.summary;
  let summary = $("#summary");

  summary.html('');
  summary.append('<p>Total cost: $' + val.cost.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
  summary.append('<p>New grid villages: ' + val.new_conn.toFixed(0) + '</p>');
  summary.append('<p>New off-grid villages: ' + val.new_og.toFixed(0) + '</p>');
  summary.append('<br>');
  summary.append('<p>Modelled pop: ' + val.model_pop.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
  summary.append('<p>Already connected pop: ' + val.orig_pop.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
  summary.append('<p>New grid pop: ' + val.new_conn_pop.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
  summary.append('<p>Off-grid pop: ' + val.og_pop.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
  planNatSummary = summary.html();

  $('#loading-bar').modal('hide');
}

var villageData;
function getOsmData(bounds) {
    var overpassApiUrl = buildOverpassApiUrl('building', bounds);

    $.get(overpassApiUrl, function (osmDataAsJson) {
        villageData = JSON.stringify(osmtogeojson(osmDataAsJson));
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
  $('#map-announce').html('<button type="button" class="btn btn-warning btn-block" id="btn-zoom-out">Click to zoom out</button>')
  $('#btn-zoom-out').click(flyToZoomOut);
  activeModel = 'plan-loc';

  $.ajax({
    url: "/get_slider_config",
    data: { config_file: 'sliders_plan_loc.csv' },
    success: planLocSliders
  });
  $("#summary").html(planLocSummary);
  $('#run-model').html('Run model')
}


function flyToZoomOut() {
  map.flyTo({
    center: [zoomOut.lng, zoomOut.lat],
    zoom: zoomOut.zoom
  });
  $('#map-announce').html(clickMsg)
  $.ajax({
    url: "/get_slider_config",
    data: { config_file: 'sliders_plan_nat.csv' },
    success: planNatSliders
  });
  $("#summary").html(planNatSummary);
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
        success: showMgoResults
    });
}

var planLocSummary = '';
/**
 * After model run, display summary results and
 * update map with network and connected buildings.
 */
function showMgoResults(data) {
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

    let val = data.summary;
    let summary = $("#summary");
    
    summary.html('');
    summary.append('<p>NPV: $' + val.npv.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
    summary.append('<p>CAPEX: $' + val.capex.toFixed(0) + '</p>');
    summary.append('<p>OPEX: $' + val.opex.toFixed(0) + '</p>');
    summary.append('<p>Income: ' + val.income.toFixed(0) + '</p>');
    summary.append('<br>');
    summary.append('<p>Connections: ' + val.connected.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '</p>');
    summary.append('<p>Generator size: ' + val.gen_size.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' kW</p>');
    summary.append('<p>Total line length: ' + val.length.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' m</p>');
    planLocSummary = summary.html();
    
    $('#loading-bar').modal('hide');
}


function explore() {
  hide("landing");
  show("explore");
  hide("about");
  map.resize();
}

var findNatParams = {};
function findNatSliders(data) {
  let slider_vals = data.config;
  let sliders = $("#sliders");

  sliders.html('');
  for (var row in slider_vals) {
    let vals = slider_vals[row];
    let name = vals.name;
    let label = vals.label;
    let unit = vals.unit;
    let min = parseFloat(vals.min);
    let max = parseFloat(vals.max);
    let step = parseFloat(vals.step);
    let def = parseFloat(vals.default);

    let sliderId = 'sl-' + name;
    let sliderValId = 'sl-' + name + '-val';
    if (!findNatParams[name]) {
      findNatParams[name] = def;
    }

    sliders.append('<br><span>' + label + ': <span id="' + sliderValId + '">' + findNatParams[name] + '</span> ' + unit + '</span');
    sliders.append('<input id="' + sliderId + '" type="text" data-slider-min="' + min + '" data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + findNatParams[name] + '"/>');

    $('#' + sliderId).slider();
    $('#' + sliderId).on("slide", function(slideEvt) {
      $('#' + sliderValId).text(slideEvt.value);
      findNatParams[name] = parseFloat($('#' + sliderId).val());
    });
  }
}

var planLocParams = {};
function planLocSliders(data) {
  let slider_vals = data.config;
  let sliders = $("#sliders");

  sliders.html('');
  for (var row in slider_vals) {
    let vals = slider_vals[row];
    let name = vals.name;
    let label = vals.label;
    let unit = vals.unit;
    let min = parseFloat(vals.min);
    let max = parseFloat(vals.max);
    let step = parseFloat(vals.step);
    let def = parseFloat(vals.default);

    let sliderId = 'sl-' + name;
    let sliderValId = 'sl-' + name + '-val';
    if (!planLocParams[name]) {
      planLocParams[name] = def;
    }

    sliders.append('<br><span>' + label + ': <span id="' + sliderValId + '">' + planLocParams[name] + '</span> ' + unit + '</span');
    sliders.append('<input id="' + sliderId + '" type="text" data-slider-min="' + min + '" data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + planLocParams[name] + '"/>');

    $('#' + sliderId).slider();
    $('#' + sliderId).on("slide", function(slideEvt) {
      $('#' + sliderValId).text(slideEvt.value);
      planLocParams[name] = parseFloat($('#' + sliderId).val());
    });
  }
}

var planNatParams = {};
function planNatSliders(data) {
  let slider_vals = data.config;
  let sliders = $("#sliders");

  sliders.html('');
  for (var row in slider_vals) {
    let vals = slider_vals[row];
    let name = vals.name;
    let label = vals.label;
    let unit = vals.unit;
    let min = parseInt(vals.min);
    let max = parseInt(vals.max);
    let step = parseInt(vals.step);
    let def = parseInt(vals.default);

    let sliderId = 'sl-' + name;
    let sliderValId = 'sl-' + name + '-val';
    if (!planNatParams[name]) {
      planNatParams[name] = def;
    }

    sliders.append('<br><span>' + label + ': <span id="' + sliderValId + '">' + planNatParams[name] + '</span> ' + unit + '</span');
    sliders.append('<input id="' + sliderId + '" type="text" data-slider-min="' + min + '" data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + planNatParams[name] + '"/>');

    $('#' + sliderId).slider();
    $('#' + sliderId).on("slide", function(slideEvt) {
      $('#' + sliderValId).text(slideEvt.value);
      planNatParams[name] = parseInt($('#' + sliderId).val());
    });
  }
}

function plan() {
  // pushState doesn't work from static file, test with Flask
  //window.history.pushState({}, 'OpenElec | Plan', 'openelec.com/plan');
  activeModel = 'plan-nat';
  activeMode("go-plan");
  $('#run-model').html('Run model')

  $.ajax({
    url: "/get_slider_config",
    data: { config_file: 'sliders_plan_nat.csv' },
    success: planNatSliders
  });

  explore();
}

function find() {
  activeModel = 'find-nat';
  activeMode("go-find");
  $('#run-model').html('Filter')

  $.ajax({
    url: "/get_slider_config",
    data: { config_file: 'sliders_find_nat.csv' },
    success: findNatSliders
  });

  explore();
}

function home() {
  activeMode();
  show("landing");
  hide("explore");
  hide("about");
  hide('map-announce-outer')
}

function about() {
  activeMode();
  hide("landing");
  hide("explore");
  show("about");
  hide('map-announce-outer')
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
/**
 * SPA for openelec
 * Compiled with webpack
 */

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

// object for Mapbox GL map
var map;

// can be one of ['plan', 'find'] 
var activeModel;

// can be one of ['nat', 'loc']
var activeLevel;

// keep track of the country we're looking at
// currently only one option
var country = 'Lesotho';

// current values of input parametres
// adjdusted by sliders in left sidebar
var findNatParams = {};
var planLocParams = {};
var planNatParams = {};

// variables for right sidebar summary results
var summaryHtml = {'plan-nat': '', 'plan-loc': '', 'find-nat': ''};

// message displayed at national-level display
var clickMsg = 'Click on a cluster to optimise local network';

// keep track of preferred national level zoom
var zoomOut = {'lat': 0, 'lng': 0, 'zoom': 4};

// keep track of local bounding box
var bbox;

// Call init() function on DOM load
$(document).ready(init);


/**
 * Called on DOM load.
 * Create map and assign button click calls.
 */
function init() {
  createMap();
  addNationalLayers();

  $('#go-home').click(home);
  $('#go-about').click(about);
  $('#run-model').click(runModel);
  $('#go-plan').click(plan);
  $('#go-plan-big').click(plan);
  $('#go-find').click(find);
  $('#go-find-big').click(find);

  $('.js-loading-bar').modal({
    backdrop: 'static',
    show: false
  });
}


/**
 * Create the Mapbox GL map.
 */
function createMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puZnE3YXkxMDBrZTNrczI3cXN2OXQzNiJ9.2BDgu40zHwh3CAfHs6reAQ';
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [zoomOut.lng, zoomOut.lat],
      zoom: zoomOut.zoom
  });
  map.addControl(new mapboxgl.NavigationControl());
}


/**
 * Add national layers (grid and clusters) for the country.
 */activeModel
function addNationalLayers() {
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
              'orig', '#377eb8', // blue
              'new', '#4daf4a', // green
              'og', '#e41a1c', // red
              '#1d0b1c' // default: grey
            ],
          'fill-opacity': 0.5,
        }
      });

      map.addLayer({
        'id': 'clusters-outline',
        'type': 'line',
        'source': 'clusters',
        'paint': {
          'line-color': [
              'match',
              ['get', 'type'],
              'orig', '#377eb8', // blue
              'new', '#4daf4a', // green
              'og', '#e41a1c', // red
              '#1d0b1c' // default: grey
            ],
          'line-width': 2,
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
          "line-width": 2
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

      map.on('click', 'clusters', clusterClick);
    }
  });
}


/**
 * Called by the id=run-model button.
 * Calls a function depending on which model is currently active.
 */
function runModel() {
  $('#loading-bar').modal('show');
  if (activeModel == 'plan' && activeLevel == 'nat') {
    runPlanNat();
  } else if (activeModel == 'plan' && activeLevel == 'loc') {
    runPlanLoc();
  } else if (activeModel == 'find') {
    runFindNat();
  }
}


/**
 * Run API call for planNat.
 */
function runPlanNat() {
  $.ajax({
      url: "/run_electrify",
      data: planNatParams,
      success: showPlanNat
  });
}


/**
 * Run API call for planLoc.
 */
function runPlanLoc() {
  var overpassApiUrl = buildOverpassApiUrl('building', bbox);
  //map.setLayoutProperty('clusters', 'visibility', 'none');

  $.get(overpassApiUrl, function (osmDataAsJson) {
    let villageData = JSON.stringify(osmtogeojson(osmDataAsJson));

    planLocParams['village'] = villageData;

    $.ajax({
      url: "/run_mgo",
      data: planLocParams,
      success: showPlanLoc
    });
  });
}


/**
 * Run API call for findNat.
 */
function runFindNat() {
  $.ajax({
    url: "/find_clusters",
    data: findNatParams,
    success: showFindNat
  });
}


/**
 * Update map and summary pane with results from model.
 * 
 * @param {*} data 
 */
function showPlanNat(data) {
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
        "line-color": "#339900",
        "line-width": 3
      }
    });
  }

  map.getSource('clusters').setData(data.clusters);

  $.ajax({
    url: "/get_config",
    data: { config_file: 'summary_plan_nat.csv' },
    success: updateSummary(data.summary, 'plan-nat')
  });

  $('#loading-bar').modal('hide');
}


/**
 * After model run, display summary results and
 * update map with network and connected buildings.
 * 
 * @param {*} data 
 */
function showPlanLoc(data) {
  if (map.getSource("buildings")) {
    map.getSource('buildings').setData(data.buildings);
  } else {
    map.addSource('buildings', { type: 'geojson', data: data.buildings });
    map.addLayer({
      'id': 'buildings',
      'type': 'fill',
      'source': 'buildings',
      'paint': {
        'fill-color': {
          property: 'area',
          stops: [[1, '#ccece6'], [5, '#005824']]
        },
        'fill-opacity': 0.5
      }
    });
  }

  if (map.getSource("lv")) {
    map.getSource('lv').setData(data.network);
  } else {
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
        "line-color": "#4f5283",
        "line-width": 3
      }
    });
  }

  $.ajax({
    url: "/get_config",
    data: { config_file: 'summary_plan_loc.csv' },
    success: updateSummary(data.summary, 'plan-loc')
  });
  
  $('#loading-bar').modal('hide');
}


/**
 * Update map and summary pane with model results.
 * 
 * @param {*} data 
 */
function showFindNat(data) {
  map.getSource('clusters').setData(data.clusters);
  map.setPaintProperty('clusters', 'fill-color', {
    property: 'score',
    stops: [[1, '#9ebcda'], [5, '#6e016b']]
  });

  $.ajax({
    url: "/get_config",
    data: { config_file: 'summary_find_nat.csv' },
    success: updateSummary(data.summary, 'find-nat')
  });

  $('#loading-bar').modal('hide');
}


/**
 * Get the bounding box from the clicked cluster,
 * and call prepLanLoc().
 * 
 * @param {*} e 
 */
function clusterClick(e) {
  var features = map.queryRenderedFeatures(e.point);
  bbox = geojsonExtent(features[0].geometry);
  prepPlanLoc();
}


/**
 * Zoom to clicked cluster and prepare for planLoc.
 */
function prepPlanLoc() {
  map.fitBounds(bbox, {padding: 20});
  map.setPaintProperty('clusters', 'fill-opacity', 0.1);

  $('#map-announce').html('<button type="button" class="btn btn-warning btn-block" id="btn-zoom-out">Click to zoom out</button>')
  $('#btn-zoom-out').click(zoomToNat);
  activeModel = 'plan';
  activeLevel = 'loc'

  $.ajax({
    url: "/get_config",
    data: { config_file: 'sliders_plan_loc.csv' },
    success: updateSliders(planLocParams)
  });

  $("#summary").html(summary['plan-loc']);
  $('#run-model').html('Run model')
}


/**
 * Build on OSM overpass query based on the bounds and query.
 * 
 * @param {*} overpassQuery 
 * @param {*} bounds 
 */
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


/**
 * Zoom out from local to national level,
 * and show appropriate sidebar content.
 */
function zoomToNat() {
  map.flyTo({
    center: [zoomOut.lng, zoomOut.lat],
    zoom: zoomOut.zoom
  });

  //map.setLayoutProperty('clusters', 'visibility', 'visible');
  map.setPaintProperty('clusters', 'fill-opacity', 0.5);

  $('#map-announce').html(clickMsg)

  let config = activeModel == 'plan' ? 'sliders_plan_nat.csv' : 'sliders_find_nat.csv';
  let params = activeModel == 'plan' ? planNatParams : findNatParams;
  let summary = activeModel == 'plan' ? 'plan-nat' : 'find-nat';

  $.ajax({
    url: "/get_config",
    data: { config_file: config },
    success: updateSliders(params)
  });

  updateSliders(params);
  $("#summary").html(summaryHtml[summary]);
}


/**
 * Update the left sidebar parametre sliders depnding on the passed params.
 * 
 * @param {*} params 
 */
function updateSliders(params) {
  return function(data) {
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
      if (!params[name]) {
        params[name] = def;
      }

      sliders.append('<br><span>' + label + ': <span id="' + sliderValId + '">' + params[name] + '</span> ' + unit + '</span');
      sliders.append('<input id="' + sliderId + '" type="text" data-slider-min="' + min + '" data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + params[name] + '"/>');

      $('#' + sliderId).slider();
      $('#' + sliderId).on("slide", function(slideEvt) {
        $('#' + sliderValId).text(slideEvt.value);
        params[name] = parseFloat($('#' + sliderId).val());
      });
    }
  }
}




/**
 * Update summary results in right sidebar.
 * 
 * @param {*} summaryData 
 * @param {*} summaryHtml 
 */
function updateSummary(summaryData, activeSummary) {
  return function(data) {
    let config = data.config;
    let summary = $("#summary");

    summary.html('');
    for (var row in config) {
      let vals = config[row];
      let name = vals.name;
      let label = vals.label;
      let unit = vals.unit;
      summary.append('<p>' + label + ': ' + summaryData[name].toFixed(0) + ' ' + unit + '</p>');
    }
    summaryHtml[activeSummary] = summary.html();
  }
}


/**
 * Display the main explore screen with map centered.
 */
function explore() {
  hide("landing");
  show("explore");
  hide("about");

  $('#map-announce').html(clickMsg);
  show('map-announce-outer')

  map.resize();
}


/**
 * Called by clicking the 'plan' button.
 */
function plan() {
  // pushState doesn't work from static file, test with Flask
  //window.history.pushState({}, 'OpenElec | Plan', 'openelec.com/plan');
  activeModel = 'plan';
  activeLevel = 'nat'
  activeMode("go-plan");
  $('#run-model').html('Run model')

  $.ajax({
    url: "/get_config",
    data: { config_file: 'sliders_plan_nat.csv' },
    success: updateSliders(planNatParams)
  });

  explore();
}


/**
 * Called by the find opportunities button.
 */
function find() {
  activeModel = 'find';
  activeLevel = 'nat';
  activeMode("go-find");
  $('#run-model').html('Filter');

  $.ajax({
    url: "/get_config",
    data: { config_file: 'sliders_find_nat.csv' },
    success: updateSliders(findNatParams)
  });

  explore();
}


/**
 * Display the home page.
 */
function home() {
  activeMode();
  show("landing");
  hide("explore");
  hide("about");
  hide('map-announce-outer')
}


/**
 * Display the about page.
 */
function about() {
  activeMode();
  hide("landing");
  hide("explore");
  show("about");
  hide('map-announce-outer')
}


/**
 * Enable/disable buttons depending on mode.
 * 
 * @param {*} mode 
 */
function activeMode(mode) {
  disableClass("go-plan", "btn-primary");
  disableClass("go-find", "btn-primary");
  if (mode) {
    enableClass(mode, "btn-primary");
  }
}


/**
 * Hide an element by enabling the 'hidden' class.
 * 
 * @param {*} elementId 
 */
function hide(elementId) {
  enableClass(elementId, "hidden");
}


/**
 * Show a class by removing the 'hidden' class.
 * 
 * @param {*} elementId 
 */
function show(elementId) {
  disableClass(elementId, "hidden");
}


/**
 * Enable the given class on the given element.
 * 
 * @param {*} elementId 
 * @param {*} className 
 */
function enableClass(elementId, className) {
  var element = document.getElementById(elementId)
  if (!element.classList.contains(className)) {
    element.classList.add(className)
  }
}


/**
 * Disable the given class on the given element.
 * 
 * @param {*} elementId 
 * @param {*} className 
 */
function disableClass(elementId, className) {
  var element = document.getElementById(elementId);
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

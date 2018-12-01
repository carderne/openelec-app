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

import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';

import './style.css';

// object for Mapbox GL map
var map;

// can be one of ['plan', 'find'] 
var activeModel;

// can be one of ['nat', 'loc']
var activeLevel;

// keep track of the country we're looking at
// currently only one option
var currentCountry = 'Lesotho';

// current values of input parametres
// adjdusted by sliders in left sidebar
var sliderConfigs = {}; // = {'plan-nat': {}, 'plan-loc': {}, 'find-nat': {}};
var sliderParams = {}; //{'plan-nat': {}, 'plan-loc': {}, 'find-nat': {}};

// variables for right sidebar legend and summary results
var summaryConfigs = {};
var summaryHtml = {'plan-nat': '', 'plan-loc': '', 'find-nat': ''};
var legendHtml = {'plan-nat': '', 'plan-loc': '', 'find-nat': ''};

// message displayed at national-level display
var clickMsg = 'Click on a cluster to optimise local network';
var clickBtn = '<button type="button" class="btn btn-warning btn-block" id="btn-zoom-out">Click to zoom out</button>';

// keep track of preferred national level zoom
var zoomOut = {'lat': 0, 'lng': 0, 'zoom': 9};

// keep track of local bounding box
var bbox;

// to intialise buildings layer before we have the GeoJSON
var emptyGeoJSON = { 'type': 'FeatureCollection', 'features': [] };

// 
var layerColors = {
  'grid': '#474747', // grey
  'clustersPlan': {
    'default': '#1d0b1c', //grey
    'orig': '#377eb8', // blue
    'new': '#4daf4a', // green
    'og': '#e41a1c' // red
  },
  'clustersFind': {
    'default': '#1d0b1c', //grey
    'top': '#9ebcda', // light blue
    'bottom': '#6e016b' // purple
  },
  'network': '#339900', // green
  'buildings': {
    'default': '#005824', // dark green
    'bottom': '#ccece6', // light
    'top': '#005824' // dark green
  },
  'lv': '#4f5283' // grey
};

// Call init() function on DOM load
$(document).ready(init);

/**
 * Called on DOM load.
 * Create map and assign button click calls.
 */
function init() {
  createMap();
  addMapLayers();

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
 */
function addMapLayers() {
  $.ajax({
    url: '/get_country',
    data: { 'country': currentCountry },
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
            'orig', layerColors.clustersPlan.orig,
            'new', layerColors.clustersPlan.new,
            'og', layerColors.clustersPlan.og,
            layerColors.clustersPlan.default
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
            'orig', layerColors.clustersPlan.orig,
            'new', layerColors.clustersPlan.new,
            'og', layerColors.clustersPlan.og,
            layerColors.clustersPlan.default
          ],
          'line-width': 2,
        }
      });

      map.addSource('grid', { type: 'geojson', data: data.grid });
      map.addLayer({
        'id': 'grid',
        'type': 'line',
        'source': 'grid',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': layerColors.grid,
          'line-width': 2
        }
      });

      map.addSource('buildings', { type: 'geojson', data: emptyGeoJSON });
      map.addLayer({
        'id': 'buildings',
        'type': 'fill',
        'source': 'buildings',
        'paint': {
          'fill-color': layerColors.buildings.default,
          'fill-opacity': 0.8
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
  sliderParams['plan-nat']['country'] = currentCountry;
  $.ajax({
    url: '/run_electrify',
    data: sliderParams['plan-nat'],
    success: showPlanNat
  });
}

/**
 * Run API call for planLoc.
 */
function runPlanLoc() {
  $.ajax({
    url: '/run_mgo',
    data: sliderParams['plan-loc'],
    success: showPlanLoc
  });
}

/**
 * Run API call for findNat.
 */
function runFindNat() {
  sliderParams['find-nat']['country'] = currentCountry;
  $.ajax({
    url: '/find_clusters',
    data: sliderParams['find-nat'],
    success: showFindNat
  });
}

/**
 * Update map and summary pane with results from model.
 * 
 * @param {*} data 
 */
function showPlanNat(data) {
  if (map.getSource('network')) {
    map.getSource('network').setData(data.network);
  } else {
    map.addSource('network', { type: 'geojson', data: data.network });
    map.addLayer({
      'id': 'network',
      'type': 'line',
      'source': 'network',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': layerColors.network,
        'line-width': 3
      }
    });
  }

  map.getSource('clusters').setData(data.clusters);

  loadSummaryConfig('plan-nat', data.summary);
  $('#loading-bar').modal('hide');
}

/**
 * After model run, display summary results and
 * update map with network and connected buildings.
 * 
 * @param {*} data 
 */
function showPlanLoc(data) {
  map.getSource('buildings').setData(data.buildings);
  map.setPaintProperty('buildings', 'fill-color', {
    property: 'area',
    stops: [[1, layerColors.buildings.bottom], [100, layerColors.buildings.top]]
  });

  if (map.getSource('lv')) {
    map.getSource('lv').setData(data.network);
  } else {
    map.addSource('lv', { type: 'geojson', data: data.network });
    map.addLayer({
      'id': 'lv',
      'type': 'line',
      'source': 'lv',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': layerColors.lv,
        'line-width': 3
      }
    });
  }

  loadSummaryConfig('plan-loc', data.summary); 
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
    stops: [[1, layerColors.clustersFind.bottom], [5, layerColors.clustersFind.top]]
  });

  loadSummaryConfig('find-nat', data.summary);

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

  $('#map-announce').html(clickBtn);
  $('#btn-zoom-out').click(zoomToNat);
  activeModel = 'plan';
  activeLevel = 'loc';

  let overpassApiUrl = buildOverpassApiUrl('building', bbox);
  $.get(overpassApiUrl, function (osmDataAsJson) {
    let numBuildings = osmDataAsJson.elements.length;

    if (numBuildings > 2000) {
      // will cause slow behaviour or too-long model run
      $('#map-announce').html('Choose a smaller village!');
      setTimeout(resetAnnounce, 2000);
    } else if (numBuildings < 5) {
      // not enough data to work with
      $('#map-announce').html('Choose a village with more buildings!');
      setTimeout(resetAnnounce, 2000);
    } else {
      let villageData = osmtogeojson(osmDataAsJson);
      map.getSource('buildings').setData(villageData);
      sliderParams['plan-loc']['village'] = JSON.stringify(villageData);
    }
  });

  loadSliderConfig('plan-loc');

  let colors = layerColors.buildings;
  let labels = {'default': 'Un-modelled', 'bottom': 'Small', 'top': 'Large'};
  legendHtml['plan-loc'] = createLegend(colors, labels);

  $('#summary').html(summaryHtml['plan-loc']);
  $('#run-model').html('Run model');
}

/**
 * Build on OSM overpass query based on the bounds and query.
 * 
 * @param {*} overpassQuery 
 * @param {*} bounds 
 */
function buildOverpassApiUrl(overpassQuery, bbox) {
  var west = bbox[0];
  var south = bbox[1];
  var east = bbox[2];
  var north = bbox[3];

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

  map.setPaintProperty('clusters', 'fill-opacity', 0.5);

  $('#map-announce').html(clickMsg);

  let state = activeModel == 'plan' ? 'plan-nat' : 'find-nat';

  updateSliders(state);
  $('#legend').html(legendHtml[state]);
  $('#summary').html(summaryHtml[state]);
}

/**
 * Get appropriate slider config file for given state.
 * @param {*} state 
 */
function sliderConfigName(state) {
  switch (state) {
    case 'plan-nat': return 'sliders_plan_nat.csv';
    case 'plan-loc': return 'sliders_plan_loc.csv';
    case 'find-nat': return 'sliders_find_nat.csv';
  }
}

/**
 * Get slider config from file if not loaded before.
 * @param {*} state 
 */
function loadSliderConfig(state) {
  if (!sliderConfigs[state]) {
    sliderConfigs[state] = {};
    sliderParams[state] = {};
    $.ajax({
      url: '/get_config',
      data: { config_file: sliderConfigName(state) },
      success: updateSlidersClosure(state)
    });
  } else {
    updateSliders(state);
  }
}

/**
 * Wrap updateSliders for AJAX callback.
 * @param {*} state 
 */
function updateSlidersClosure(state) {
  return function(data) {
    updateSliders(state, data.config);
  };
}



/**
 * Update the left sidebar parametre sliders depnding on the passed params.
 * 
 * @param {*} params 
 */
function updateSliders(state, config) {
  if (config) {
    sliderConfigs[state] = config;
  }
  
  let slider_vals = sliderConfigs[state];
  let sliders = $('#sliders');

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
    if (!sliderParams[state][name]) {
      sliderParams[state][name] = def;
    }

    sliders.append('<br><span>' + label + ': <span id="' + sliderValId + '">' + sliderParams[state][name] + '</span> ' + unit + '</span');
    sliders.append('<input id="' + sliderId + '" type="text" data-slider-min="' + min + '" data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + sliderParams[state][name] + '"/>');

    $('#' + sliderId).slider();
    $('#' + sliderId).on('slide', function(slideEvt) {
      $('#' + sliderValId).text(slideEvt.value);
      sliderParams[state][name] = parseFloat($('#' + sliderId).val());
    });
  }
}

/**
 * Get the conrrect summary config file given a state.
 * @param {*} state 
 */
function summaryConfigName(state) {
  switch (state) {
    case 'plan-nat': return 'summary_plan_nat.csv';
    case 'plan-loc': return 'summary_plan_loc.csv';
    case 'find-nat': return 'summary_find_nat.csv';
  }
}

/**
 * Loads summary config from file if it hasn't been loaded before.
 * @param {*} state 
 * @param {*} summary 
 */
function loadSummaryConfig(state, summary) {
  if (!summaryConfigs[state]) {
    summaryConfigs[state] = {};
    $.ajax({
      url: '/get_config',
      data: { config_file: summaryConfigName(state) },
      success: updateSummary(state, summary)
    });
  } else {
    updateSummary(state, summary);
  }
}

/**
 * Update summary results in right sidebar.
 * 
 * @param {*} summaryData 
 * @param {*} summaryHtml 
 */
function updateSummary(state, summaryData) {
  return function(data) {
    let config = data.config;
    let summary = $('#summary');

    summary.html('');
    for (var row in config) {
      let vals = config[row];
      let name = vals.name;
      let label = vals.label;
      let unit = vals.unit;
      summary.append('<p>' + label + ': ' + summaryData[name].toFixed(0) + ' ' + unit + '</p>');
    }
    summaryHtml[state] = summary.html();
  };
}

/**
 * 
 * @param {*} colors 
 * @param {*} labels 
 */
function createLegend(colors, labels) {
  let legend = $('#legend');
  legend.html('');
  for (var row in colors) {
    let label = labels[row];
    let color = colors[row];
    legend.append('<div><span class="legend-square" style="background-color: ' + color + '"></span><span>' + label + '</span></div>');
  }
  return legend.html();
}

/**
 * Display the main explore screen with map centered.
 */
function explore() {
  hide('landing');
  show('explore');
  hide('about');

  $('#map-announce').html(clickMsg);
  show('map-announce-outer');

  map.resize();
}

/**
 * Called by clicking the 'plan' button.
 */
function plan() {
  // pushState doesn't work from static file, test with Flask
  //window.history.pushState({}, 'OpenElec | Plan', 'openelec.com/plan');
  activeModel = 'plan';
  activeLevel = 'nat';
  activeMode('go-plan');
  $('#run-model').html('Run model');

  loadSliderConfig('plan-nat');

  $('#summary').html(summaryHtml['plan-nat']);
  if (map.getLayer('network')) {
    map.setLayoutProperty('network', 'visibility', 'visible');
  }

  let colors = layerColors.clustersPlan;
  let labels = {'default': 'Un-modelled', 'orig': 'Currently connected', 'new': 'New connections', 'og': 'Off-grid'};
  legendHtml['plan-nat'] = createLegend(colors, labels);

  explore();
}

/**
 * Called by the find opportunities button.
 */
function find() {
  activeModel = 'find';
  activeLevel = 'nat';
  activeMode('go-find');
  $('#run-model').html('Filter');

  loadSliderConfig('find-nat');

  $('#summary').html(summaryHtml['find-nat']);
  if (map.getLayer('network')) {
    map.setLayoutProperty('network', 'visibility', 'none');
  }

  let colors = layerColors.clustersFind;
  let labels = {'default': 'Un-modelled', 'bottom': 'Low priority', 'top': 'High priority'};
  legendHtml['find-nat'] = createLegend(colors, labels);

  explore();
}

/**
 * Display the home page.
 */
function home() {
  activeMode();
  show('landing');
  hide('explore');
  hide('about');
  hide('map-announce-outer');
}

/**
 * Display the about page.
 */
function about() {
  activeMode();
  hide('landing');
  hide('explore');
  show('about');
  hide('map-announce-outer');
}

/**
 * Reset announce box after a warning message.
 */
function resetAnnounce() {
  $('#map-announce').html(clickBtn);
  $('#btn-zoom-out').click(zoomToNat);
}

/**
 * Enable/disable buttons depending on mode.
 * 
 * @param {*} mode 
 */
function activeMode(mode) {
  disableClass('go-plan', 'btn-primary');
  disableClass('go-find', 'btn-primary');
  if (mode) {
    enableClass(mode, 'btn-primary');
  }
}

/**
 * Hide an element by enabling the 'hidden' class.
 * 
 * @param {*} elementId 
 */
function hide(elementId) {
  enableClass(elementId, 'hidden');
}


/**
 * Show a class by removing the 'hidden' class.
 * 
 * @param {*} elementId 
 */
function show(elementId) {
  disableClass(elementId, 'hidden');
}

/**
 * Enable the given class on the given element.
 * 
 * @param {*} elementId 
 * @param {*} className 
 */
function enableClass(elementId, className) {
  var element = document.getElementById(elementId);
  if (!element.classList.contains(className)) {
    element.classList.add(className);
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

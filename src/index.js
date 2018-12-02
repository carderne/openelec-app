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
import { sliderConfigs, summaryConfigs, countries, layerColors } from './config.js';

import * as d3 from 'd3';

const images = importImages(require.context('./images', false, /\.(png|jpe?g|svg)$/));

// Use local API URL for dev, and server for prod
let API;
if (process.env.NODE_ENV === 'prod') {
  API = 'https://openelec.rdrn.me/api/v1/';
} else {
  API = 'http://127.0.0.1:5000/api/v1/';
}

// object for Mapbox GL map
let map;

// can be one of ['plan', 'find'] 
let activeModel;

// can be one of ['nat', 'loc']
let activeLevel;

// keep track of the country we're looking at
let country;

// current values of input parametres
const sliderParams = {};

// objects for right sidebar legend and summary results
const summaryHtml = {'plan-nat': '', 'plan-loc': '', 'find-nat': ''};
const legendHtml = {'plan-nat': '', 'plan-loc': '', 'find-nat': ''};

// message displayed at national-level display
const clickMsg = 'Click on a cluster to optimise local network';
const clickBtn = '<button type="button" class="btn btn-warning btn-block" id="btn-zoom-out">Click to zoom out</button>';

// keep track of local bounding box
let clusterBounds;
let countryBounds;
const africaBounds = [[-38.751075367, -8.898059419], [9.352373130, 70.375560861]];
let layersAdded = false;

// to intialise buildings layer before we have the GeoJSON
const emptyGeoJSON = { 'type': 'FeatureCollection', 'features': [] };

// Call init() function on DOM load
$(document).ready(init);
//$(window).on('load', init);

/**
 * Called on DOM load.
 * Create map and assign button click calls.
 */
function init() {
  createMap();

  //$('.favicon').attr('href', images['favicon.ico']);
  $('#go-home').click(home);
  $('#go-about').click(about);
  $('#run-model').click(runModel);
  $('#go-plan').click(plan);
  $('#go-plan-big').click(plan);
  $('#go-find').click(find);
  $('#go-find-big').click(find);
  $('#change-country').click(chooseCountry);

  let countryList = $('#country-list');
  for (let country in countries) {
    let countryCap = capFirst(country);
    countryList.append('<a href="#" class="choose-country" id="' + country + '"><div class="card" style="width: 10rem;"><img class="card-img-top" src="' + images['flag-' + country + '.png'] + '" alt="flag"><div class="card-body"><h5 class="card-title">' + countryCap + '</h5></div></div></a>');
  }

  $('.choose-country').click(explore);

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
  });
  map.fitBounds(africaBounds);
  map.addControl(new mapboxgl.NavigationControl());
}

/**
 * Add national layers (grid and clusters) for the country.
 */
function addMapLayers() {
  map.addSource('clusters', { type: 'geojson', data: emptyGeoJSON });
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

  map.addSource('grid', { type: 'geojson', data: emptyGeoJSON });
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
  sliderParams['plan-nat']['country'] = country;
  sliderParams['plan-nat']['urban_elec'] = countries[country]['urban_elec'];
  $.ajax({
    url: API + 'run_electrify',
    data: sliderParams['plan-nat'],
    success: showPlanNat
  });
}

/**
 * Run API call for planLoc.
 */
function runPlanLoc() {
  if (sliderParams['plan-loc']['village']) {

    $.ajax({
      url: API + 'run_mgo',
      data: sliderParams['plan-loc'],
      success: showPlanLoc
    });
    
  } else {
    $('#map-announce').html('No building data found');
    setTimeout(resetAnnounce, 2000);
    $('#loading-bar').modal('hide');
  }
}

/**
 * Run API call for findNat.
 */
function runFindNat() {
  sliderParams['find-nat']['country'] = country;
  $.ajax({
    url: API + 'find_clusters',
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
  map.setPaintProperty('clusters', 'fill-color', [
    'match',
    ['get', 'type'],
    'orig', layerColors.clustersPlan.orig,
    'new', layerColors.clustersPlan.new,
    'og', layerColors.clustersPlan.og,
    layerColors.clustersPlan.default
  ]);

  updateSummary('plan-nat', data.summary);

  let chartData = [
    { 'type': 'Existing', 'pop': data.summary['orig-conn-pop'] },
    { 'type': 'New', 'pop': data.summary['new-conn-pop'] },
    { 'type': 'Off-grid', 'pop': data.summary['new-og-pop'] }
  ];

  createChart(chartData);
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

  updateSummary('plan-loc', data.summary); 
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

  updateSummary('find-nat', data.summary);

  $('#loading-bar').modal('hide');
}

/**
 * Get the bounding box from the clicked cluster,
 * and call prepLanLoc().
 * 
 * @param {*} e 
 */
function clusterClick(e) {
  let features = map.queryRenderedFeatures(e.point);
  clusterBounds = geojsonExtent(features[0].geometry);
  prepPlanLoc();
}

/**
 * Zoom to clicked cluster and prepare for planLoc.
 */
function prepPlanLoc() {
  map.fitBounds(clusterBounds, {padding: 20});
  map.setPaintProperty('clusters', 'fill-opacity', 0.1);

  $('#map-announce').html(clickBtn);
  $('#btn-zoom-out').click(zoomToNat);
  activeModel = 'plan';
  activeLevel = 'loc';

  let overpassApiUrl = buildOverpassApiUrl('building', clusterBounds);
  $.get(overpassApiUrl, function (osmDataAsJson) {
    let numBuildings = osmDataAsJson.elements.length;

    if (numBuildings > 2000) {
      // will cause slow behaviour or too-long model run
      $('#map-announce').html('Choose a smaller village!');
      enableClass('run-model', 'disabled');
      setTimeout(resetAnnounce, 2000);
    } else if (numBuildings < 5) {
      // not enough data to work with
      $('#map-announce').html('Choose a village with more buildings!');
      enableClass('run-model', 'disabled');
      setTimeout(resetAnnounce, 2000);
    } else {
      let villageData = osmtogeojson(osmDataAsJson);
      map.getSource('buildings').setData(villageData);
      disableClass('run-model', 'disabled');
      sliderParams['plan-loc']['village'] = JSON.stringify(villageData);
    }
  });

  updateSliders('plan-loc');

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
  let west = bbox[0];
  let south = bbox[1];
  let east = bbox[2];
  let north = bbox[3];

  let bounds = south + ', ' + west + ', ' + north + ', ' + east;
  let nodeQuery = 'node[' + overpassQuery + '](' + bounds + ');';
  let wayQuery = 'way[' + overpassQuery + '](' + bounds + ');';
  let relationQuery = 'relation[' + overpassQuery + '](' + bounds + ');';
  let query = '?data=[out:json][timeout:15];(' + nodeQuery + wayQuery + relationQuery + ');out body geom;';
  let baseUrl = 'https://overpass-api.de/api/interpreter';
  let resultUrl = baseUrl + query;
  return resultUrl;
}

/**
 * Zoom out from local to national level,
 * and show appropriate sidebar content.
 */
function zoomToNat() {
  countryBounds = countries[country].bounds;
  let camera = map.cameraForBounds(countryBounds, {padding: -200});
  map.flyTo(camera);

  map.setPaintProperty('clusters', 'fill-opacity', 0.5);

  disableClass('run-model', 'disabled');
  $('#map-announce').html(clickMsg);

  let state = activeModel == 'plan' ? 'plan-nat' : 'find-nat';

  updateSliders(state);
  $('#legend').html(legendHtml[state]);
  $('#summary').html(summaryHtml[state]);
}

/**
 * Update the left sidebar parametre sliders depnding on the passed params.
 * 
 * @param {*} params 
 */
function updateSliders(state) {
  if (!sliderParams[state]) {
    sliderParams[state] = {};
  }
  let slider_vals = sliderConfigs[state];
  let sliders = $('#sliders');

  sliders.html('');
  for (let name in slider_vals) {
    let vals = slider_vals[name];
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
 * Update summary results in right sidebar.
 * 
 * @param {*} summaryData 
 * @param {*} summaryHtml 
 */
function updateSummary(state, summaryData) {
  let config = summaryConfigs[state];
  let summary = $('#summary');

  summary.html('');
  for (let name in config) {
    let vals = config[name];
    let label = vals.label;
    let unit = vals.unit;
    summary.append('<p>' + label + ': ' + summaryData[name].toFixed(0) + ' ' + unit + '</p>');
  }
  summaryHtml[state] = summary.html();
}

/**
 * 
 * @param {*} colors 
 * @param {*} labels 
 */
function createLegend(colors, labels) {
  let legend = $('#legend');
  legend.html('');
  for (let row in colors) {
    let label = labels[row];
    let color = colors[row];
    legend.append('<div><span class="legend-square" style="background-color: ' + color + '"></span><span>' + label + '</span></div>');
  }
  return legend.html();
}

/**
 * Display the main explore screen with map centered.
 */
function chooseCountry() {
  if (!layersAdded) {
    addMapLayers();
    layersAdded = true;
  }
  hide('landing');
  hide('explore');
  hide('about');
  show('countries');
}

/**
 * Called by clicking the 'plan' button.
 */
function plan() {
  activeModel = 'plan';
  activeLevel = 'nat';
  activeMode('go-plan');
  $('#run-model').html('Run model');
  disableClass('run-model', 'disabled');
  updateSliders('plan-nat');

  $('#summary').html(summaryHtml['plan-nat']);
  if (map.getLayer('network')) {
    map.setLayoutProperty('network', 'visibility', 'visible');
  }

  let colors = layerColors.clustersPlan;
  let labels = {'default': 'Un-modelled', 'orig': 'Currently connected', 'new': 'New connections', 'og': 'Off-grid'};
  legendHtml['plan-nat'] = createLegend(colors, labels);

  if (!country) {
    chooseCountry();
  } else {
    hide('landing');
    show('explore');
    hide('about');
    hide('countries');
  }
}

/**
 * Called by the find opportunities button.
 */
function find() {
  activeModel = 'find';
  activeLevel = 'nat';
  activeMode('go-find');
  $('#run-model').html('Filter');
  disableClass('run-model', 'disabled');
  updateSliders('find-nat');

  $('#summary').html(summaryHtml['find-nat']);
  if (map.getLayer('network')) {
    map.setLayoutProperty('network', 'visibility', 'none');
  }

  let colors = layerColors.clustersFind;
  let labels = {'default': 'Un-modelled', 'bottom': 'Low priority', 'top': 'High priority'};
  legendHtml['find-nat'] = createLegend(colors, labels);

  if (!country) {
    chooseCountry();
  } else {
    hide('landing');
    show('explore');
    hide('about');
    hide('countries');
  }
}

/**
 * 
 */
function explore() {
  country = this.id;
  $.ajax({
    url: API + 'get_country',
    data: { 'country': country },
    success: function(data) {
      map.getSource('grid').setData(data.grid);
      map.getSource('clusters').setData(data.clusters);
    }
  });

  $('#map-announce').html(clickMsg);
  show('map-announce-outer');

  countryBounds = countries[country].bounds;
  let camera = map.cameraForBounds(countryBounds, {padding: -200});
  map.jumpTo(camera);

  hide('landing');
  show('explore');
  hide('about');
  hide('countries');

  map.resize();
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
  let element = document.getElementById(elementId);
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
  let element = document.getElementById(elementId);
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

/**
 * 
 * @param {*} r 
 */
function importImages(r) {
  let images = {};
  r.keys().map((item) => { images[item.replace('./', '')] = r(item); });
  return images;
}

/**
 * 
 * @param {*} string 
 */
function capFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * 
 * @param {*} dataset 
 */
function createChart(dataset) {
  var outerWidth = 300;
  var outerHeight = 200;
  var margin = { left: 50, top: 30, right: 30, bottom: 50 };
  var barPadding = 0.2;

  var xColumn = 'type';
  var yColumn = 'pop';
  var colorColumn = 'type';

  function colorPicker(type) {
    if (type == 'Existing') {
      return layerColors.clustersPlan.orig;
    } else if (type == 'New') {
      return layerColors.clustersPlan.new;
    } else {
      return layerColors.clustersPlan.og;
    }
  }

  var innerWidth  = outerWidth  - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top  - margin.bottom;

  $('#chart').html('<h3 class="text">Newly connected population</h3>');
  var svg = d3.select('#chart').append('svg')
    .attr('width',  outerWidth)
    .attr('height', outerHeight);
  var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var xAxisG = g.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + innerHeight + ')');
  var yAxisG = g.append('g')
    .attr('class', 'y axis');

  var xScale = d3.scale.ordinal().rangeBands([0, innerWidth], barPadding);
  var yScale = d3.scale.linear().range([innerHeight, 0]);

  var xAxis = d3.svg.axis().scale(xScale).orient('bottom')
    .outerTickSize(0);
  var yAxis = d3.svg.axis().scale(yScale).orient('left')
    .ticks(3)
    .tickFormat(d3.format('s'))
    .outerTickSize(0);

  xScale.domain(dataset.map( function (d){ return d[xColumn]; }));
  yScale.domain([0, d3.max(dataset, function (d){ return d[yColumn]; })]);

  xAxisG
    .call(xAxis)
    .selectAll('text')  
    .attr('dx', '-0.4em')
    .attr('dy', '1.24em')
    .attr('transform', 'rotate(-16)' );

  yAxisG.call(yAxis);

  var bars = g.selectAll('rect').data(dataset);
  bars.enter().append('rect')
    .attr('width', xScale.rangeBand());
  bars
    .attr('x', function (d){ return xScale(d[xColumn]); })
    .attr('y', function (d){ return yScale(d[yColumn]); })
    .attr('height', function (d){ return innerHeight - yScale(d[yColumn]); })
    .attr('fill', function (d){ return colorPicker(d[colorColumn]); });
  bars.exit().remove();
}

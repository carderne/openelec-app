import $ from 'jquery';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-slider'
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css'

import './style.css';

// dangerous?
// @import url('https://fonts.googleapis.com/css?family=Roboto');

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
      center: [28.2, -29.65],
      zoom: 8
  });
}

$('.js-loading-bar').modal({
  backdrop: 'static',
  show: false
});

function run() {
  // check if we're in plan/find and nat/loc

  $('#loading-bar').modal('show');

  setTimeout(function() {
    $('#loading-bar').modal('hide');
  }, 1500);

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
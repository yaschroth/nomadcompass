/**
 * Fills the live "Right now" bar at the top of a city page's weather section with the current
 * temperature, relative humidity and a colour-coded US AQI chip. Data from the keyless Open-Meteo
 * forecast + air-quality APIs. Progressive enhancement: the bar starts hidden and only appears once
 * real data loads, so a failed fetch leaves no empty shell. Injected by apply_city_weather.cjs.
 */
(function () {
  'use strict';
  var el = document.querySelector('.cw-live[data-lat]');
  if (!el) return;
  var lat = el.getAttribute('data-lat'), lng = el.getAttribute('data-lng');
  if (!lat || !lng) return;
  var row = el.querySelector('.cw-live-row');
  if (!row) return;

  var ICONS = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
  function aqiBand(v) {
    if (v <= 50) return ['Good', 'aqi-good'];
    if (v <= 100) return ['Moderate', 'aqi-mod'];
    if (v <= 150) return ['Unhealthy for sensitive groups', 'aqi-usg'];
    if (v <= 200) return ['Unhealthy', 'aqi-bad'];
    if (v <= 300) return ['Very unhealthy', 'aqi-vbad'];
    return ['Hazardous', 'aqi-haz'];
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var wUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng + '&current=temperature_2m,relative_humidity_2m,weather_code';
  var aUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lng + '&current=us_aqi';

  Promise.allSettled([
    fetch(wUrl).then(function (r) { return r.json(); }),
    fetch(aUrl).then(function (r) { return r.json(); }),
  ]).then(function (res) {
    var parts = [];
    var w = res[0].status === 'fulfilled' ? res[0].value : null;
    if (w && w.current && w.current.temperature_2m != null) {
      var t = Math.round(w.current.temperature_2m);
      var icon = ICONS[w.current.weather_code] || '🌡️';
      parts.push('<span class="cw-live-temp">' + icon + ' ' + t + '°C</span>');
      if (w.current.relative_humidity_2m != null) {
        parts.push('<span class="cw-live-hum">' + Math.round(w.current.relative_humidity_2m) + '% humidity</span>');
      }
    }
    var a = res[1].status === 'fulfilled' ? res[1].value : null;
    if (a && a.current && a.current.us_aqi != null) {
      var v = Math.round(a.current.us_aqi);
      var band = aqiBand(v);
      parts.push('<span class="cw-live-aqi aqi-chip ' + band[1] + '">AQI ' + v + ' · ' + esc(band[0]) + '</span>');
    }
    if (!parts.length) return;
    row.innerHTML = parts.join('<span class="cw-live-sep" aria-hidden="true">·</span>');
    el.hidden = false;
  });
})();

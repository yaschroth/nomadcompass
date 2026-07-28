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

  var ICONS = { 0: 'sun', 1: 'cloud-sun', 2: 'cloud-sun', 3: 'cloud', 45: 'cloud-fog', 48: 'cloud-fog', 51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle', 61: 'cloud-drizzle', 63: 'cloud-rain', 65: 'cloud-rain', 71: 'cloud-snow', 73: 'cloud-snow', 75: 'cloud-snow', 80: 'cloud-drizzle', 81: 'cloud-rain', 82: 'cloud-lightning', 95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning' };
  function nhIcon(name) { return '<svg class="nh-icon nh-icon-' + name + '" aria-hidden="true"><use href="/assets/icons.svg#' + name + '"></use></svg>'; }
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
      var wIcon = nhIcon(ICONS[w.current.weather_code] || 'thermometer');
      parts.push('<span class="cw-live-temp">' + wIcon + ' ' + t + '°C</span>');
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

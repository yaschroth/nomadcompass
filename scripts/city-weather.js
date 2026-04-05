/**
 * City Weather Script
 * Fetches and displays current weather for individual city pages
 * Uses Open-Meteo API (free, no key required)
 */

(function() {
  'use strict';

  // Weather code to emoji mapping
  const WEATHER_ICONS = {
    0: '☀️',   // Clear sky
    1: '🌤️',  // Mainly clear
    2: '⛅',   // Partly cloudy
    3: '☁️',   // Overcast
    45: '🌫️', // Fog
    48: '🌫️', // Depositing rime fog
    51: '🌧️', // Light drizzle
    53: '🌧️', // Moderate drizzle
    55: '🌧️', // Dense drizzle
    61: '🌧️', // Slight rain
    63: '🌧️', // Moderate rain
    65: '🌧️', // Heavy rain
    71: '🌨️', // Slight snow
    73: '🌨️', // Moderate snow
    75: '🌨️', // Heavy snow
    80: '🌦️', // Slight rain showers
    81: '🌦️', // Moderate rain showers
    82: '🌦️', // Violent rain showers
    95: '⛈️', // Thunderstorm
    96: '⛈️', // Thunderstorm with hail
    99: '⛈️', // Thunderstorm with heavy hail
  };

  function getWeatherIcon(code) {
    return WEATHER_ICONS[code] || '🌡️';
  }

  async function fetchWeather(lat, lng) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather fetch failed');
      return await response.json();
    } catch (error) {
      console.warn('Weather fetch failed:', error);
      return null;
    }
  }

  function updateWeatherDisplay(data) {
    const weatherEl = document.getElementById('currentWeather');
    if (!weatherEl || !data || !data.current) return;

    const temp = Math.round(data.current.temperature_2m);
    const icon = getWeatherIcon(data.current.weather_code);

    weatherEl.innerHTML = `${icon} ${temp}°C`;
  }

  // Initialize when DOM is ready
  function init() {
    const weatherEl = document.getElementById('currentWeather');
    if (!weatherEl) return;

    const lat = weatherEl.dataset.lat;
    const lng = weatherEl.dataset.lng;

    if (lat && lng) {
      fetchWeather(lat, lng).then(updateWeatherDisplay);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * City Weather Script
 * Fetches and displays current weather for individual city pages
 * Uses Open-Meteo API (free, no key required)
 */

(function() {
  'use strict';

  // Weather code to line-icon name (self-hosted sprite /assets/icons.svg).
  const WEATHER_ICONS = {
    0: 'sun',            // Clear sky
    1: 'cloud-sun',      // Mainly clear
    2: 'cloud-sun',      // Partly cloudy
    3: 'cloud',          // Overcast
    45: 'cloud-fog',     // Fog
    48: 'cloud-fog',     // Depositing rime fog
    51: 'cloud-drizzle', // Light drizzle
    53: 'cloud-drizzle', // Moderate drizzle
    55: 'cloud-drizzle', // Dense drizzle
    61: 'cloud-drizzle', // Slight rain
    63: 'cloud-rain',    // Moderate rain
    65: 'cloud-rain',    // Heavy rain
    71: 'cloud-snow',    // Slight snow
    73: 'cloud-snow',    // Moderate snow
    75: 'cloud-snow',    // Heavy snow
    80: 'cloud-drizzle', // Slight rain showers
    81: 'cloud-rain',    // Moderate rain showers
    82: 'cloud-lightning', // Violent rain showers
    95: 'cloud-lightning', // Thunderstorm
    96: 'cloud-lightning', // Thunderstorm with hail
    99: 'cloud-lightning', // Thunderstorm with heavy hail
  };

  function nhIcon(name) {
    return '<svg class="nh-icon nh-icon-' + name + '" aria-hidden="true"><use href="/assets/icons.svg#' + name + '"></use></svg>';
  }

  function getWeatherIcon(code) {
    return nhIcon(WEATHER_ICONS[code] || 'thermometer');
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

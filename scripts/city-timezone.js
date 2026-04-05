/**
 * City Timezone Display
 * Shows the time difference between user's home timezone and city timezone
 */
(function() {
  'use strict';

  function getUserTimezone() {
    try {
      const auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
      if (auth && auth.timezone !== undefined) {
        return auth.timezone;
      }
    } catch (e) {
      // Not logged in or no timezone set
    }
    return null;
  }

  function getCityTimezone() {
    const el = document.getElementById('timeDifference');
    if (!el) return null;
    const tz = el.getAttribute('data-timezone');
    return tz !== null ? parseFloat(tz) : null;
  }

  function formatTimeDifference(userTz, cityTz) {
    const diff = cityTz - userTz;

    if (diff === 0) {
      return 'Same time';
    }

    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff);
    const minutes = (absDiff - hours) * 60;

    let result = '';
    if (diff > 0) {
      result = '+';
    } else {
      result = '-';
    }

    if (minutes > 0) {
      result += `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      result += hours;
    }

    result += ' hr' + (absDiff !== 1 ? 's' : '');

    return result;
  }

  function updateTimezoneDisplay() {
    const el = document.getElementById('timeDifference');
    if (!el) return;

    const userTz = getUserTimezone();
    const cityTz = getCityTimezone();

    if (userTz === null) {
      el.textContent = 'Sign up to see';
      el.title = 'Create an account to see the time difference from your home timezone';
      return;
    }

    if (cityTz === null) {
      el.textContent = '--';
      return;
    }

    el.textContent = formatTimeDifference(userTz, cityTz);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateTimezoneDisplay);
  } else {
    updateTimezoneDisplay();
  }
})();

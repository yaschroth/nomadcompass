/**
 * Move Nomad Score into the hero as a compact floating badge.
 * Runs before the score animation JS so element references still resolve.
 */
(function() {
  'use strict';

  var scoreSection = document.querySelector('.score-section');
  var hero = document.querySelector('.city-hero');
  var heroContent = document.querySelector('.city-hero-content');
  if (!scoreSection || !hero || !heroContent) return;

  var scoreContainer = scoreSection.querySelector('.score-container');
  if (!scoreContainer) return;

  // Build a compact floating score badge (gauge only)
  var badge = document.createElement('div');
  badge.className = 'hero-score-badge';
  badge.innerHTML =
    '<div class="hero-score-badge-gauge">' +
      scoreContainer.querySelector('.score-gauge').outerHTML +
    '</div>';

  // Insert badge into hero content — absolute on desktop, inline on mobile
  heroContent.appendChild(badge);

  // Remove the original score section entirely
  scoreSection.remove();
})();

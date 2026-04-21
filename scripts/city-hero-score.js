/**
 * Move the Nomad Score gauge into the top of the hero content.
 * Runs before the score animation JS — element IDs (#scoreGaugeFill,
 * #nomadScoreValue) still resolve via getElementById after reparenting.
 */
(function() {
  'use strict';

  var scoreSection = document.querySelector('.score-section');
  var statsGrid = document.querySelector('.city-hero .quick-stats-grid');
  if (!scoreSection || !statsGrid) return;

  var gauge = scoreSection.querySelector('.score-gauge');
  if (!gauge) return;

  var badge = document.createElement('div');
  badge.className = 'hero-score-badge';
  badge.appendChild(gauge);

  // Insert as the first item in the stats line
  statsGrid.insertBefore(badge, statsGrid.firstChild);
  scoreSection.remove();
})();

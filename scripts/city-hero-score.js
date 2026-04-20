/**
 * Move the Nomad Score gauge into the top of the hero content.
 * Runs before the score animation JS — element IDs (#scoreGaugeFill,
 * #nomadScoreValue) still resolve via getElementById after reparenting.
 */
(function() {
  'use strict';

  var scoreSection = document.querySelector('.score-section');
  var hero = document.querySelector('.city-hero');
  if (!scoreSection || !hero) return;

  var gauge = scoreSection.querySelector('.score-gauge');
  if (!gauge) return;

  var badge = document.createElement('div');
  badge.className = 'hero-score-badge';
  badge.appendChild(gauge);

  hero.appendChild(badge);
  scoreSection.remove();
})();

/**
 * Move Nomad Score into the hero section so it's visible without scrolling.
 * Runs before the score-gauge animation JS so the element is in its new
 * location when animation fires.
 */
(function() {
  'use strict';

  var scoreSection = document.querySelector('.score-section');
  var heroContent = document.querySelector('.city-hero-content');
  if (!scoreSection || !heroContent) return;

  var scoreContainer = scoreSection.querySelector('.score-container');
  if (!scoreContainer) return;

  // Wrap the hero content's existing children in a left column
  var leftCol = document.createElement('div');
  leftCol.className = 'city-hero-left';
  while (heroContent.firstChild) {
    leftCol.appendChild(heroContent.firstChild);
  }
  heroContent.appendChild(leftCol);

  // Move score container into hero content as right column
  scoreContainer.classList.add('city-hero-score');
  heroContent.appendChild(scoreContainer);

  // Make the hero content a flex row on desktop
  heroContent.classList.add('has-score');

  // Remove the now-empty score section
  scoreSection.remove();
})();

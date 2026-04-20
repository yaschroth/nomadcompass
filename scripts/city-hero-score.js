/**
 * Restructure the city hero for a magazine-style split layout:
 * - Wrap flag + country + title in a .city-hero-headline (left column)
 * - Append the Nomad Score gauge as sibling (right column)
 * - Score section below hero is removed.
 *
 * Runs before the score animation JS — element IDs (#scoreGaugeFill,
 * #nomadScoreValue) still resolve via getElementById after DOM reparenting.
 */
(function() {
  'use strict';

  var scoreSection = document.querySelector('.score-section');
  var heroContent = document.querySelector('.city-hero-content');
  if (!scoreSection || !heroContent) return;

  var scoreContainer = scoreSection.querySelector('.score-container');
  var gauge = scoreContainer && scoreContainer.querySelector('.score-gauge');
  if (!gauge) return;

  var flag = heroContent.querySelector('.city-hero-flag');
  var country = heroContent.querySelector('.city-hero-country');
  var title = heroContent.querySelector('.city-hero-title');
  if (!title) return;

  // Build the headline row: [ flag+country overline + title ] [ gauge ]
  var headline = document.createElement('div');
  headline.className = 'city-hero-headline';

  var textCol = document.createElement('div');
  textCol.className = 'city-hero-headline-text';

  // Order inside text column: country overline (with flag inline), then title
  if (country) textCol.appendChild(country);
  if (flag) {
    // Move flag to sit inside the country overline
    country.insertBefore(flag, country.firstChild);
  }
  textCol.appendChild(title);

  var gaugeWrap = document.createElement('div');
  gaugeWrap.className = 'hero-score-badge';
  gaugeWrap.appendChild(gauge);

  headline.appendChild(textCol);
  headline.appendChild(gaugeWrap);

  // Insert the new headline row where the title used to be
  heroContent.insertBefore(headline, heroContent.firstChild);

  // Remove the now-empty score section
  scoreSection.remove();
})();

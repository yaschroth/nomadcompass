/**
 * Update all city pages with weather display
 * Adds weather stat to quick-stats section and includes weather script
 */

const fs = require('fs');
const path = require('path');

// Load cities data to get coordinates
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
const citiesDataContent = fs.readFileSync(citiesDataPath, 'utf-8');

// Extract city data with coordinates
function extractCityData() {
  const cityData = {};

  // Match each city object
  const cityRegex = /\{\s*id:\s*"([^"]+)"[\s\S]*?lat:\s*([-\d.]+)[\s\S]*?lng:\s*([-\d.]+)/g;
  let match;

  while ((match = cityRegex.exec(citiesDataContent)) !== null) {
    cityData[match[1]] = {
      lat: parseFloat(match[2]),
      lng: parseFloat(match[3])
    };
  }

  return cityData;
}

const cityCoords = extractCityData();
console.log(`Found coordinates for ${Object.keys(cityCoords).length} cities`);

// Get all city HTML files
const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let skippedCount = 0;

cityFiles.forEach(filename => {
  const cityId = filename.replace('.html', '');
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Skip if already has weather
  if (content.includes('id="currentWeather"')) {
    skippedCount++;
    return;
  }

  const coords = cityCoords[cityId];
  if (!coords) {
    console.log(`No coordinates for: ${cityId}`);
    skippedCount++;
    return;
  }

  // Add weather stat after Monthly Budget in quick-stats
  const quickStatsPattern = /(<div class="quick-stat">\s*<div class="quick-stat-value">[^<]*<\/div>\s*<div class="quick-stat-label">Monthly Budget<\/div>\s*<\/div>)/;

  const weatherStat = `$1
          <div class="quick-stat">
            <div class="quick-stat-value" id="currentWeather" data-lat="${coords.lat}" data-lng="${coords.lng}">--</div>
            <div class="quick-stat-label">Current Weather</div>
          </div>`;

  if (quickStatsPattern.test(content)) {
    content = content.replace(quickStatsPattern, weatherStat);
  } else {
    console.log(`Could not find quick-stats pattern in: ${cityId}`);
    skippedCount++;
    return;
  }

  // Add weather script before closing body tag
  if (!content.includes('city-weather.js')) {
    content = content.replace(
      '</body>',
      '  <script src="../scripts/city-weather.js"></script>\n</body>'
    );
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages`);
console.log(`Skipped ${skippedCount} city pages`);

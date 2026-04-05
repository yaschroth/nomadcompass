/**
 * Add climate type display to individual city pages
 */

const fs = require('fs');
const path = require('path');

// Load cities data to get climate types
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
const citiesDataContent = fs.readFileSync(citiesDataPath, 'utf-8');

// Extract climate types from cities data
function extractClimateTypes() {
  const climateData = {};
  const cityRegex = /id: "([^"]+)"[\s\S]*?climateType: "([^"]+)"/g;
  let match;

  while ((match = cityRegex.exec(citiesDataContent)) !== null) {
    climateData[match[1]] = match[2];
  }

  return climateData;
}

const climateTypes = extractClimateTypes();
console.log(`Found climate types for ${Object.keys(climateTypes).length} cities`);

// Get all city HTML files
const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let skippedCount = 0;

cityFiles.forEach(filename => {
  const cityId = filename.replace('.html', '');
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Skip if already has climate type
  if (content.includes('Climate Type')) {
    skippedCount++;
    return;
  }

  const climateType = climateTypes[cityId];
  if (!climateType) {
    console.log(`No climate type for: ${cityId}`);
    skippedCount++;
    return;
  }

  // Add climate type stat after Current Weather (or after Monthly Budget if no weather)
  const weatherPattern = /(<div class="quick-stat">\s*<div class="quick-stat-value"[^>]*>--<\/div>\s*<div class="quick-stat-label">Current Weather<\/div>\s*<\/div>)/;
  const budgetPattern = /(<div class="quick-stat">\s*<div class="quick-stat-value">[^<]*<\/div>\s*<div class="quick-stat-label">Monthly Budget<\/div>\s*<\/div>)/;

  const climateStat = `
          <div class="quick-stat">
            <div class="quick-stat-value">${climateType}</div>
            <div class="quick-stat-label">Climate Type</div>
          </div>`;

  if (weatherPattern.test(content)) {
    content = content.replace(weatherPattern, `$1${climateStat}`);
  } else if (budgetPattern.test(content)) {
    content = content.replace(budgetPattern, `$1${climateStat}`);
  } else {
    console.log(`Could not find insertion point in: ${cityId}`);
    skippedCount++;
    return;
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages with climate type`);
console.log(`Skipped ${skippedCount} city pages`);

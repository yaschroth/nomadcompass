/**
 * Add timezone display to all city pages
 * - Adds a quick-stat for time difference
 * - Adds the city-timezone.js script
 */

const fs = require('fs');
const path = require('path');

// Load cities data to get timezone for each city
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
const citiesDataContent = fs.readFileSync(citiesDataPath, 'utf-8');

// Parse timezone for each city
function getCityTimezone(cityId) {
  const pattern = new RegExp(`id:\\s*"${cityId}"[\\s\\S]*?timezone:\\s*(-?[\\d.]+)`, 'i');
  const match = citiesDataContent.match(pattern);
  return match ? parseFloat(match[1]) : 0;
}

const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let skippedCount = 0;

cityFiles.forEach(filename => {
  const cityId = filename.replace('.html', '');
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Skip if already has timezone display
  if (content.includes('id="timeDifference"')) {
    skippedCount++;
    return;
  }

  const cityTimezone = getCityTimezone(cityId);

  // 1. Add timezone quick-stat after "Active Nomads" stat
  const nomadsStatPattern = /<div class="quick-stat">\s*<div class="quick-stat-value">[^<]*<\/div>\s*<div class="quick-stat-label">Active Nomads<\/div>\s*<\/div>/;
  const nomadsMatch = content.match(nomadsStatPattern);

  if (nomadsMatch) {
    const timezoneStatHtml = `
          <div class="quick-stat">
            <div class="quick-stat-value" id="timeDifference" data-timezone="${cityTimezone}">--</div>
            <div class="quick-stat-label">Time Difference</div>
          </div>`;

    content = content.replace(
      nomadsMatch[0],
      nomadsMatch[0] + timezoneStatHtml
    );
  }

  // 2. Add city-timezone.js script before closing body tag
  if (!content.includes('city-timezone.js')) {
    content = content.replace(
      '</body>',
      '  <script src="../scripts/city-timezone.js"></script>\n</body>'
    );
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages with timezone display`);
console.log(`Skipped ${skippedCount} pages (already had timezone display)`);

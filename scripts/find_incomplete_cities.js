/**
 * Find cities missing lat, lng, or costPerMonth
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'cities-data.js');
const content = fs.readFileSync(dataPath, 'utf-8');

// Find all city blocks
const cityPattern = /\{\s*id:\s*"([^"]+)"[\s\S]*?timezone:\s*(-?\d+)\s*\}/g;

let match;
const missingData = [];

while ((match = cityPattern.exec(content)) !== null) {
  const cityBlock = match[0];
  const cityId = match[1];

  const hasLat = /lat:\s*-?[\d.]+/.test(cityBlock);
  const hasLng = /lng:\s*-?[\d.]+/.test(cityBlock);
  const hasCostPerMonth = /costPerMonth:\s*\d+/.test(cityBlock);

  if (!hasLat || !hasLng || !hasCostPerMonth) {
    missingData.push({
      id: cityId,
      hasLat,
      hasLng,
      hasCostPerMonth
    });
  }
}

console.log(`Found ${missingData.length} cities with missing data:`);
missingData.forEach(c => {
  const missing = [];
  if (!c.hasLat) missing.push('lat');
  if (!c.hasLng) missing.push('lng');
  if (!c.hasCostPerMonth) missing.push('costPerMonth');
  console.log(`  ${c.id}: missing ${missing.join(', ')}`);
});

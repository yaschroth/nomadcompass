/**
 * Check which cities have/don't have timezone
 */
const fs = require('fs');
const path = require('path');

const citiesFile = path.join(__dirname, '..', 'cities-data.js');
const content = fs.readFileSync(citiesFile, 'utf-8');

// Split into city blocks
const cityPattern = /\{\s*id:\s*"([^"]+)"[\s\S]*?(?=\{\s*id:|$)/g;
let match;
const withTimezone = [];
const withoutTimezone = [];

let lastIndex = 0;
while ((match = cityPattern.exec(content)) !== null) {
  const cityId = match[1];
  const block = match[0];

  if (block.includes('timezone:')) {
    withTimezone.push(cityId);
  } else {
    withoutTimezone.push(cityId);
  }
}

console.log(`Cities WITH timezone: ${withTimezone.length}`);
console.log(`Cities WITHOUT timezone: ${withoutTimezone.length}`);

if (withoutTimezone.length > 0) {
  console.log('\nCities missing timezone:');
  withoutTimezone.forEach(city => console.log(`  - ${city}`));
}

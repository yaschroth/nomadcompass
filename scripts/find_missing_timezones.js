/**
 * Find cities without timezone data
 */
const fs = require('fs');
const path = require('path');

const citiesFile = path.join(__dirname, '..', 'cities-data.js');
const content = fs.readFileSync(citiesFile, 'utf-8');

// Find all city blocks
const cityBlocks = content.split(/\{[\s]*id:/);
const missing = [];

cityBlocks.forEach((block, i) => {
  if (i === 0) return; // First part is header

  const idMatch = block.match(/^\s*"([^"]+)"/);
  if (idMatch) {
    const cityId = idMatch[1];
    // Check if this block has timezone
    const blockEnd = block.indexOf('},');
    const cityBlock = block.substring(0, blockEnd);
    if (!cityBlock.includes('timezone:')) {
      missing.push(cityId);
    }
  }
});

console.log(`Missing timezone data for ${missing.length} cities:`);
missing.forEach(city => console.log(`  '${city}': 0,`));

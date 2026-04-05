/**
 * Fix the cities-data.js file by moving incorrectly placed cities to the right location
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(dataPath, 'utf-8');

// The cities were incorrectly inserted inside getCategoryKeys function
// We need to:
// 1. Extract the incorrectly placed cities
// 2. Remove them from the wrong location
// 3. Insert them at the correct location (before the end of CITIES array)

// Find the broken function line
const brokenLine = "return ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa'  {";
const brokenLineIndex = content.indexOf(brokenLine);

if (brokenLineIndex === -1) {
  console.log("Broken line not found - file may already be fixed or have different error");
  process.exit(1);
}

// Find where the incorrectly placed cities start (after the broken line)
const citiesStartMarker = "  {\n    id: \"bordeaux\"";
const citiesStartIndex = content.indexOf(citiesStartMarker, brokenLineIndex);

// Find where they end - look for the closing ];\n} pattern
const incorrectEndPattern = /\],?\n\}/;
const searchArea = content.slice(citiesStartIndex);
const endMatch = searchArea.match(incorrectEndPattern);
const citiesEndIndex = citiesStartIndex + endMatch.index + endMatch[0].length;

// Extract the new cities (everything between citiesStartIndex and before the ];)
const endBracketInCities = content.lastIndexOf('],', citiesEndIndex);
const newCitiesContent = content.slice(citiesStartIndex, endBracketInCities + 1);

// Fix the broken function - restore it properly
const fixedFunction = "return ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa'];\n}";

// Remove the broken part and incorrectly placed cities
const beforeBroken = content.slice(0, brokenLineIndex);
const afterCities = content.slice(citiesEndIndex);

// Reconstruct the content with fixed function
let fixedContent = beforeBroken + fixedFunction + afterCities;

// Now insert the cities at the correct location - before the CITIES array closing ];
// Find the last city entry before the ];
const citiesArrayEnd = fixedContent.indexOf('\n];\n\n/**\n * Category metadata');

if (citiesArrayEnd === -1) {
  console.log("Could not find CITIES array end");
  process.exit(1);
}

// Insert new cities before the ];
fixedContent = fixedContent.slice(0, citiesArrayEnd) + ',\n' + newCitiesContent.slice(0, -1) + fixedContent.slice(citiesArrayEnd);

// Write the fixed file
fs.writeFileSync(dataPath, fixedContent, 'utf-8');
console.log("Fixed cities-data.js!");

// Verify by checking syntax
const { execSync } = require('child_process');
try {
  execSync(`node -c "${dataPath}"`, { encoding: 'utf-8' });
  console.log("Syntax check passed!");
} catch (e) {
  console.log("Syntax error remains:", e.message);
}

/**
 * Fix cities-data.js by relocating incorrectly placed cities
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'cities-data.js');
const content = fs.readFileSync(dataPath, 'utf-8');

// Split into lines for easier manipulation
const lines = content.split('\n');

// Find key line numbers
let citiesArrayEndLine = -1;  // Line with just "];"
let brokenFunctionLine = -1;  // Line with broken return statement
let lastCityEndLine = -1;     // Line before the "];" that ends CITIES array

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Find the CITIES array end (];) followed by Category metadata comment
  if (line === '];' && i + 1 < lines.length && lines[i + 1] === '') {
    if (i + 3 < lines.length && lines[i + 3].includes('Category metadata')) {
      citiesArrayEndLine = i;
      lastCityEndLine = i - 1;  // Line with "  }" (closing the last city)
    }
  }

  // Find the broken function line
  if (line.includes("return ['climate', 'cost'") && line.includes('{')) {
    brokenFunctionLine = i;
  }
}

console.log('Cities array ends at line:', citiesArrayEndLine + 1);
console.log('Broken function at line:', brokenFunctionLine + 1);
console.log('Last city ends at line:', lastCityEndLine + 1);

if (citiesArrayEndLine === -1 || brokenFunctionLine === -1) {
  console.log('Could not find required markers');
  process.exit(1);
}

// Extract the new cities (from after the broken line to the end of inserted content)
// The new cities start at brokenFunctionLine + 1 and end at the line before "];\n}"
let newCitiesEndLine = -1;
for (let i = brokenFunctionLine + 1; i < lines.length; i++) {
  if (lines[i] === '];' && i + 1 < lines.length && lines[i + 1] === '}') {
    newCitiesEndLine = i - 1;  // The line before ];\n}
    break;
  }
}

console.log('New cities end at line:', newCitiesEndLine + 1);

if (newCitiesEndLine === -1) {
  console.log('Could not find end of new cities');
  process.exit(1);
}

// Extract new cities content (lines brokenFunctionLine+1 to newCitiesEndLine)
const newCitiesLines = lines.slice(brokenFunctionLine + 1, newCitiesEndLine + 1);
console.log('Extracted', newCitiesLines.length, 'lines of new cities');

// Build the fixed file:
// 1. Everything up to and including the last city (before ];)
// 2. A comma after the last city
// 3. The new cities
// 4. The ]; and everything after (but skip the broken function part)

// Find where the getCategoryKeys function should end
let functionEndLine = -1;
for (let i = newCitiesEndLine + 1; i < lines.length; i++) {
  if (lines[i] === '}' || lines[i].trim() === '}') {
    functionEndLine = i;
    break;
  }
}

console.log('Function ends at line:', functionEndLine + 1);

// Build new content
const newLines = [];

// Part 1: Everything up to the last city entry (including it)
for (let i = 0; i <= lastCityEndLine; i++) {
  newLines.push(lines[i]);
}

// Part 2: Add comma and new cities
newLines[newLines.length - 1] = '  },';  // Ensure last city has comma
newCitiesLines.forEach(line => newLines.push(line));

// Part 3: Close the CITIES array and add rest of file
newLines.push('];');
newLines.push('');

// Part 4: Category metadata and functions (skip the broken part)
// Find line after the broken section
let afterBrokenStart = functionEndLine + 1;

// We need to restore the getCategoryKeys function properly
newLines.push('/**');
newLines.push(' * Category metadata');
newLines.push(' * Each category has a display name and an icon (emoji)');
newLines.push(' */');

// Find and add CATEGORIES object
let inCategories = false;
let categoriesEnd = -1;
for (let i = citiesArrayEndLine; i < brokenFunctionLine; i++) {
  if (lines[i].includes('const CATEGORIES')) {
    inCategories = true;
  }
  if (inCategories) {
    newLines.push(lines[i]);
    if (lines[i] === '};') {
      categoriesEnd = i;
      break;
    }
  }
}

// Add the getCategoryKeys function (fixed)
newLines.push('');
newLines.push('/**');
newLines.push(' * Get list of all category keys in consistent order');
newLines.push(' * @returns {string[]} Array of category keys');
newLines.push(' */');
newLines.push('function getCategoryKeys() {');
newLines.push("  return ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa'];");
newLines.push('}');

// Add the rest of the file (after the broken function)
for (let i = functionEndLine + 1; i < lines.length; i++) {
  newLines.push(lines[i]);
}

// Write the fixed file
const fixedContent = newLines.join('\n');
fs.writeFileSync(dataPath, fixedContent, 'utf-8');
console.log('File fixed!');

// Verify syntax
const { execSync } = require('child_process');
try {
  execSync(`node -c "${dataPath}"`, { encoding: 'utf-8' });
  console.log('Syntax check PASSED!');
} catch (e) {
  console.log('Syntax check FAILED');
  console.log(e.stderr || e.message);
}

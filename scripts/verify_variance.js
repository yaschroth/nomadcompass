/**
 * Verify score variance after recalibration
 */

const fs = require('fs');
const path = require('path');

const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
const content = fs.readFileSync(citiesDataPath, 'utf-8');

// Extract all cities and their scores
const cityRegex = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?scores:\s*\{([^}]+)\}/g;
let match;
const cities = [];

while ((match = cityRegex.exec(content)) !== null) {
  const id = match[1];
  const name = match[2];
  const scoresStr = match[3];

  // Parse individual scores
  const scores = {};
  const scoreMatches = scoresStr.matchAll(/(\w+):\s*(\d+)/g);
  for (const sm of scoreMatches) {
    scores[sm[1]] = parseInt(sm[2]);
  }

  // Calculate Nomad Score with 13 categories
  const categories = ['climate', 'cost', 'wifi', 'nightlife', 'nature',
                      'safety', 'food', 'community', 'english', 'visa',
                      'culture', 'cleanliness', 'airquality'];

  let total = 0;
  let count = 0;
  categories.forEach(cat => {
    if (scores[cat] !== undefined) {
      total += scores[cat];
      count++;
    }
  });

  const nomadScore = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  cities.push({ id, name, nomadScore, scores });
}

// Sort by Nomad Score
cities.sort((a, b) => b.nomadScore - a.nomadScore);

// Calculate stats
const nomadScores = cities.map(c => c.nomadScore);
const min = Math.min(...nomadScores);
const max = Math.max(...nomadScores);
const avg = nomadScores.reduce((a, b) => a + b, 0) / nomadScores.length;
const variance = max - min;

console.log('=== NOMAD SCORE VARIANCE ANALYSIS (13 categories) ===');
console.log('');
console.log('Statistics:');
console.log('  Minimum: ' + min.toFixed(1));
console.log('  Maximum: ' + max.toFixed(1));
console.log('  Average: ' + avg.toFixed(1));
console.log('  Variance (max - min): ' + variance.toFixed(1) + ' points');
console.log('');
console.log('TOP 10 Cities:');
cities.slice(0, 10).forEach((c, i) => {
  console.log('  ' + (i+1) + '. ' + c.name + ': ' + c.nomadScore);
});
console.log('');
console.log('BOTTOM 10 Cities:');
cities.slice(-10).reverse().forEach((c, i) => {
  console.log('  ' + (cities.length - i) + '. ' + c.name + ': ' + c.nomadScore);
});

// Distribution
console.log('');
console.log('Score Distribution:');
const buckets = {};
nomadScores.forEach(s => {
  const bucket = Math.floor(s);
  buckets[bucket] = (buckets[bucket] || 0) + 1;
});
Object.keys(buckets).sort((a, b) => b - a).forEach(bucket => {
  const bar = '#'.repeat(Math.round(buckets[bucket] / 5));
  console.log('  ' + bucket + '-' + (parseInt(bucket) + 1) + ': ' + buckets[bucket] + ' cities ' + bar);
});

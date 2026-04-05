/**
 * Script to add culture, cleanliness, and airquality scores to all cities
 */

const fs = require('fs');
const path = require('path');

// Read the cities-data.js file
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(citiesDataPath, 'utf-8');

// Country-based estimates for cleanliness and air quality
const countryEstimates = {
  // Excellent cleanliness & air quality
  'Japan': { cleanliness: 9, airquality: 7 },
  'Singapore': { cleanliness: 10, airquality: 6 },
  'Switzerland': { cleanliness: 9, airquality: 9 },
  'Austria': { cleanliness: 8, airquality: 8 },
  'Germany': { cleanliness: 8, airquality: 7 },
  'Netherlands': { cleanliness: 8, airquality: 7 },
  'Denmark': { cleanliness: 9, airquality: 8 },
  'Sweden': { cleanliness: 9, airquality: 9 },
  'Norway': { cleanliness: 9, airquality: 9 },
  'Finland': { cleanliness: 9, airquality: 9 },
  'Iceland': { cleanliness: 8, airquality: 10 },
  'New Zealand': { cleanliness: 8, airquality: 9 },
  'Australia': { cleanliness: 8, airquality: 8 },
  'Canada': { cleanliness: 8, airquality: 8 },

  // Good cleanliness & air quality
  'South Korea': { cleanliness: 8, airquality: 5 },
  'Taiwan': { cleanliness: 7, airquality: 6 },
  'United Kingdom': { cleanliness: 7, airquality: 7 },
  'Ireland': { cleanliness: 7, airquality: 8 },
  'France': { cleanliness: 7, airquality: 7 },
  'Belgium': { cleanliness: 7, airquality: 7 },
  'Spain': { cleanliness: 7, airquality: 7 },
  'Portugal': { cleanliness: 7, airquality: 8 },
  'Italy': { cleanliness: 6, airquality: 6 },
  'Greece': { cleanliness: 6, airquality: 7 },
  'Croatia': { cleanliness: 7, airquality: 8 },
  'Slovenia': { cleanliness: 8, airquality: 8 },
  'Czech Republic': { cleanliness: 7, airquality: 6 },
  'Estonia': { cleanliness: 8, airquality: 8 },
  'Latvia': { cleanliness: 7, airquality: 8 },
  'Lithuania': { cleanliness: 7, airquality: 7 },
  'Poland': { cleanliness: 7, airquality: 5 },
  'Hungary': { cleanliness: 7, airquality: 6 },
  'United States': { cleanliness: 7, airquality: 7 },
  'United Arab Emirates': { cleanliness: 9, airquality: 5 },
  'Qatar': { cleanliness: 9, airquality: 5 },
  'Bahrain': { cleanliness: 7, airquality: 5 },
  'Israel': { cleanliness: 7, airquality: 7 },
  'Malta': { cleanliness: 7, airquality: 7 },
  'Cyprus': { cleanliness: 7, airquality: 8 },
  'Luxembourg': { cleanliness: 9, airquality: 8 },

  // Moderate
  'Malaysia': { cleanliness: 6, airquality: 5 },
  'Thailand': { cleanliness: 6, airquality: 5 },
  'Vietnam': { cleanliness: 5, airquality: 4 },
  'Indonesia': { cleanliness: 5, airquality: 4 },
  'Philippines': { cleanliness: 5, airquality: 5 },
  'Cambodia': { cleanliness: 4, airquality: 5 },
  'Laos': { cleanliness: 4, airquality: 6 },
  'Mexico': { cleanliness: 5, airquality: 5 },
  'Colombia': { cleanliness: 5, airquality: 6 },
  'Brazil': { cleanliness: 5, airquality: 6 },
  'Argentina': { cleanliness: 6, airquality: 7 },
  'Chile': { cleanliness: 7, airquality: 6 },
  'Peru': { cleanliness: 5, airquality: 5 },
  'Ecuador': { cleanliness: 5, airquality: 6 },
  'Costa Rica': { cleanliness: 6, airquality: 8 },
  'Panama': { cleanliness: 6, airquality: 6 },
  'Guatemala': { cleanliness: 4, airquality: 5 },
  'Turkey': { cleanliness: 6, airquality: 6 },
  'Georgia': { cleanliness: 6, airquality: 7 },
  'Armenia': { cleanliness: 5, airquality: 6 },
  'Azerbaijan': { cleanliness: 6, airquality: 5 },
  'Romania': { cleanliness: 6, airquality: 6 },
  'Bulgaria': { cleanliness: 6, airquality: 6 },
  'Serbia': { cleanliness: 6, airquality: 6 },
  'Montenegro': { cleanliness: 6, airquality: 8 },
  'Albania': { cleanliness: 5, airquality: 7 },
  'North Macedonia': { cleanliness: 5, airquality: 5 },
  'Bosnia and Herzegovina': { cleanliness: 5, airquality: 5 },
  'Kosovo': { cleanliness: 5, airquality: 5 },
  'Slovakia': { cleanliness: 7, airquality: 6 },
  'Ukraine': { cleanliness: 5, airquality: 6 },
  'Russia': { cleanliness: 5, airquality: 5 },
  'China': { cleanliness: 6, airquality: 3 },
  'Hong Kong': { cleanliness: 8, airquality: 5 },
  'South Africa': { cleanliness: 5, airquality: 7 },
  'Morocco': { cleanliness: 5, airquality: 6 },
  'Tunisia': { cleanliness: 5, airquality: 6 },
  'Egypt': { cleanliness: 4, airquality: 4 },
  'Kenya': { cleanliness: 4, airquality: 6 },
  'Tanzania': { cleanliness: 4, airquality: 7 },
  'Rwanda': { cleanliness: 7, airquality: 8 },
  'Ghana': { cleanliness: 4, airquality: 5 },
  'Senegal': { cleanliness: 4, airquality: 5 },
  'Nigeria': { cleanliness: 3, airquality: 4 },
  'Ethiopia': { cleanliness: 4, airquality: 5 },
  'Mauritius': { cleanliness: 7, airquality: 8 },
  'India': { cleanliness: 4, airquality: 3 },
  'Sri Lanka': { cleanliness: 5, airquality: 6 },
  'Nepal': { cleanliness: 4, airquality: 4 },
  'Jordan': { cleanliness: 6, airquality: 6 },
  'Lebanon': { cleanliness: 5, airquality: 5 },
  'Oman': { cleanliness: 8, airquality: 6 },
  'Uruguay': { cleanliness: 6, airquality: 8 },
  'Paraguay': { cleanliness: 5, airquality: 6 },
  'Bolivia': { cleanliness: 4, airquality: 5 },
  'Puerto Rico': { cleanliness: 6, airquality: 7 },
  'Dominican Republic': { cleanliness: 5, airquality: 6 }
};

// Default values for countries not in the list
const defaultEstimates = { cleanliness: 5, airquality: 6 };

// Function to estimate culture score based on existing scores
function estimateCulture(scores) {
  // Culture correlates with food, nightlife, and nature
  const foodWeight = 0.4;
  const nightlifeWeight = 0.3;
  const natureWeight = 0.3;

  let culture = Math.round(
    scores.food * foodWeight +
    scores.nightlife * nightlifeWeight +
    scores.nature * natureWeight
  );

  // Add some variation based on other factors
  if (scores.community >= 8) culture = Math.min(10, culture + 1);

  return Math.max(1, Math.min(10, culture));
}

// Parse the CITIES array
const citiesMatch = content.match(/const CITIES = \[([\s\S]*?)\];/);
if (!citiesMatch) {
  console.error('Could not find CITIES array');
  process.exit(1);
}

// Process each city - find scores objects and add new fields
let updatedContent = content;

// Match each city's scores block and add new scores
const scoresRegex = /scores:\s*\{([^}]+)\}/g;
let match;
let replacements = [];

while ((match = scoresRegex.exec(content)) !== null) {
  const originalScores = match[0];
  const scoresContent = match[1];

  // Parse existing scores
  const scoreValues = {};
  const scoreMatches = scoresContent.matchAll(/(\w+):\s*(\d+)/g);
  for (const sm of scoreMatches) {
    scoreValues[sm[1]] = parseInt(sm[2]);
  }

  // Find the country for this city (look backwards from match position)
  const beforeMatch = content.substring(0, match.index);
  const countryMatch = beforeMatch.match(/country:\s*"([^"]+)"[^}]*$/);
  const country = countryMatch ? countryMatch[1] : 'Unknown';

  // Get estimates for this country
  const estimates = countryEstimates[country] || defaultEstimates;

  // Calculate culture score
  const cultureScore = estimateCulture(scoreValues);

  // Create new scores string
  const newScoresContent = scoresContent.trimEnd() + `,
      culture: ${cultureScore},
      cleanliness: ${estimates.cleanliness},
      airquality: ${estimates.airquality}`;

  const newScores = `scores: {${newScoresContent}}`;

  replacements.push({
    original: originalScores,
    replacement: newScores
  });
}

// Apply replacements
for (const r of replacements) {
  updatedContent = updatedContent.replace(r.original, r.replacement);
}

// Update the file header comments
updatedContent = updatedContent.replace(
  /\*   visa      - Ease of getting\/extending a visa\n \*\//,
  `*   visa      - Ease of getting/extending a visa
 *   culture   - Museums, arts, history, cultural experiences
 *   cleanliness - Street cleanliness and general tidiness
 *   airquality - Average air quality throughout the year
 */`
);

// Write the updated content
fs.writeFileSync(citiesDataPath, updatedContent, 'utf-8');

console.log(`Updated ${replacements.length} cities with new category scores!`);

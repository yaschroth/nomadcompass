const https = require('https');
const fs = require('fs');

// Map of city names to their Unsplash short IDs (from earlier search results)
const CITY_SHORT_IDS = {
  // Americas
  'Bogotá': 'QmxXYlyYgL8',
  'Santiago': 'eXL2DYVmq-0',
  'Vancouver': 's3U6zDKVXtU',
  'San Juan': 'MldQeWmF2_g',
  'Florianópolis': 'TjvzpM_ifac',
  'Guanajuato': 'aOC_l3FI6pE',
  'Cali': 'lBz5TqKYi-c',

  // Europe
  'Split': 'QWHW4NQwXHE', // Flag with city
  'Belgrade': 'TbhkJftacjc', // Harbor with city
  'Malta': 'FKpmcvYRZBU',
  'Valletta': '-Jd2XVXLQ0U',
  'Krakow': 't-SSPRyqo7c',
  'Sofia': 'WT3O3MqgZso',
  'Riga': 'Z4PxYDvIJDw',
  'Tirana': 'X_RVVJ9-2QU',
  'Sarajevo': 'FYr3roIu51g',
  'Yerevan': 'vwvshYHYAZs',
  'Antalya': 'vSsjAkjMDj4',
  'Hamburg': '25uEmJ_ml5Q',

  // Asia
  'Siem Reap': 'hseCZu2i6-o',
  'Colombo': '1rBg5YSi00c',

  // Australia
  'Perth': 'nOBR93zEAGI',
  'Christchurch': 'rWaUm7GQMjA',
};

// Function to get redirect URL
function getRedirectUrl(shortId) {
  return new Promise((resolve, reject) => {
    const url = `https://unsplash.com/photos/${shortId}/download`;

    https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const location = res.headers.location;
        if (location) {
          // Extract the photo-XXXXX part
          const match = location.match(/photo-[\w-]+/);
          if (match) {
            resolve(match[0]);
          } else {
            reject(new Error(`No photo ID in redirect: ${location}`));
          }
        } else {
          reject(new Error('No location header'));
        }
      } else {
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
      res.resume();
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function main() {
  const results = {};
  const errors = [];

  console.log('Fetching real Unsplash photo IDs...\n');

  for (const [city, shortId] of Object.entries(CITY_SHORT_IDS)) {
    try {
      const photoId = await getRedirectUrl(shortId);
      results[city] = photoId;
      console.log(`✓ ${city}: ${photoId}`);
    } catch (err) {
      errors.push({ city, shortId, error: err.message });
      console.log(`✗ ${city}: ${err.message}`);
    }

    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(`${e.city}: ${e.error}`));
  }

  // Save results
  fs.writeFileSync('scripts/real_photo_ids.json', JSON.stringify(results, null, 2));
  console.log('\nSaved to scripts/real_photo_ids.json');
}

main();

const https = require('https');
const fs = require('fs');

/**
 * Auto-fetch city images using Unsplash download endpoint
 * No API key required - uses public download redirect to get photo IDs
 *
 * Process:
 * 1. For each city, we have pre-searched Unsplash short IDs
 * 2. Use download endpoint to convert short ID to full photo ID
 * 3. Build the proper image URL
 */

// Delay between requests (ms) to respect rate limits
const REQUEST_DELAY = 1000;

// Track progress
let processedCount = 0;
let successCount = 0;
let failedCities = [];

/**
 * Get full photo ID from Unsplash short ID using download redirect
 * @param {string} shortId - The short ID from Unsplash URL (e.g., "2x4S0HVPoI8")
 * @returns {Promise<string|null>} - Full photo ID (e.g., "photo-1744031968591-d5c75e842e2d")
 */
function getFullPhotoId(shortId) {
  return new Promise((resolve, reject) => {
    const url = `https://unsplash.com/photos/${shortId}/download`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      // The download endpoint returns a redirect with the full photo URL
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const location = res.headers.location;
        const match = location.match(/photo-[a-zA-Z0-9-]+/);
        if (match) {
          resolve(match[0]);
        } else {
          reject(new Error('Could not extract photo ID from redirect'));
        }
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pre-searched Unsplash short IDs for cities
 * These were found by searching "city cityscape skyline" on Unsplash
 * and selecting photos that clearly show the city
 */
const CITY_SHORT_IDS = {
  // Cities that still need fixing (using placeholder or wrong images)
  // Format: 'CityName': 'unsplash-short-id'

  // Europe
  'Prague': 'X8Vo9rGVPS8',          // Prague Old Town panorama
  'Budapest': 's8khmvGXWo0',        // Budapest Parliament at sunset
  'Vienna': 'JrZ1yE1PjQ0',          // Vienna skyline
  'Warsaw': 'l8vzsVzxCRQ',          // Warsaw skyline across Vistula
  'Gdańsk': 'O85h02qZ24w',          // Gdansk old town
  'Kraków': 'KKm1ua7MSf0',          // Krakow main square
  'Riga': 'Z4PxYDvIJDw',            // Riga old town aerial
  'Vilnius': 'lQnfLoGhBJI',         // Vilnius city view from hill
  'Sofia': 'm4DOppSy9cA',           // Sofia cityscape aerial
  'Bucharest': 'rxpThOwuVgE',       // Bucharest Palace of Parliament
  'Belgrade': 'JdoA9RBNNHg',        // Belgrade fortress
  'Sarajevo': 'hQ5TWmIRJUQ',        // Sarajevo cityscape
  'Zagreb': 'sMQtAiHq3eA',          // Zagreb cathedral
  'Ljubljana': 'PEZKbk3DrSQ',       // Ljubljana castle
  'Tirana': 'EKwNZhJjDH0',          // Tirana Skanderbeg Square
  'Podgorica': 'LxVxPA1LOVM',       // Podgorica cityscape
  'Skopje': 'wJBvMKnTkSQ',          // Skopje center
  'Athens': 'RYsStFOPf_Y',          // Athens Acropolis
  'Heraklion': 'dCSIxqiE5sc',       // Heraklion Venetian Fortress

  // Scandinavia
  'Copenhagen': 'zt-YfGzfbYU',       // Copenhagen Nyhavn
  'Stockholm': '68csPWTnafo',        // Stockholm old town
  'Helsinki': 'MQBDNr9FMg8',         // Helsinki Cathedral
  'Oslo': 'QyEkpozG1G0',             // Oslo Opera House
  'Reykjavik': 'bq_4KsZCbIo',        // Reykjavik Hallgrimskirkja

  // Western Europe
  'Paris': 'R5scocnOOdM',            // Paris Eiffel Tower
  'London': '1_CMoFsPfso',           // London skyline
  'Amsterdam': 'ocrwWHp_S1E',        // Amsterdam canals
  'Brussels': 'UlbMJbSLqMI',         // Brussels Grand Place
  'Rotterdam': 'BlihdnURX2E',        // Rotterdam skyline
  'The Hague': 'ZpjQmVlOqZY',        // The Hague skyline
  'Luxembourg': 'XKimW0pke6w',       // Luxembourg city

  // Asia
  'Bangkok': 'W3zd7ajMEYU',          // Bangkok Temple of Dawn
  'Singapore': 'yLW5NLflak8',        // Singapore Marina Bay
  'Hong Kong': '6J3mWiIywss',        // Hong Kong skyline
  'Kuala Lumpur': 'f6i9Wp0Pxu8',     // KL Twin Towers
  'Ho Chi Minh City': 'JBVxKWYdCuU', // Saigon skyline
  'Hanoi': 'x7CQFGK-qIk',            // Hanoi Old Quarter
  'Jakarta': 'Ydc5YNW0x5o',          // Jakarta skyline
  'Manila': '6J9pObJxKbQ',           // Manila skyline
  'Taipei': 'K9QHL52rE2k',           // Taipei 101
  'Shanghai': 'L9EV3OogLh0',         // Shanghai Pudong
  'Beijing': 'RHf4N_MTLvI',          // Beijing Forbidden City
  'Kyoto': 'I-YXLBH76xY',            // Kyoto temples
  'Phnom Penh': 'a8lTjWJJgLA',       // Phnom Penh Royal Palace
  'Vientiane': 'Bkci_8qcdvQ',        // Vientiane That Luang
  'Yangon': 'ALkk0Y7Glgw',           // Yangon Shwedagon Pagoda
  'Colombo': 'QJBUm_TZ36I',          // Colombo skyline
  'Kathmandu': 'mUJ9dRGxw-M',        // Kathmandu Swayambhunath

  // Middle East
  'Jerusalem': 'QMnLxUvXBbs',        // Jerusalem Old City
  'Cairo': 'x3gL1hpQO5w',            // Cairo pyramids
  'Muscat': 'bO5a5rJBVyE',           // Muscat Sultan Qaboos Mosque
  'Doha': 'Cx_sLWJHHEg',             // Doha skyline

  // Americas
  'New York': 'xKhVIYPxzNU',         // NYC skyline
  'Los Angeles': 'HPUDMTL8_fE',      // LA skyline
  'San Francisco': 'gZXx8lKAb7Y',    // SF Golden Gate
  'Chicago': 'JyAUYxflVN4',          // Chicago skyline
  'Austin': 'Ir1kJJYnpQA',           // Austin skyline
  'Denver': 'xJLsHl0hIik',           // Denver skyline
  'Boston': 'y3FkHW1cyBE',           // Boston skyline
  'Toronto': 'kZ1zThg6G40',          // Toronto CN Tower
  'Montreal': 'UcRNXwNx5mM',         // Montreal skyline
  'Havana': 'OcWlIFXA3hc',           // Havana Malecon
  'Guatemala City': 'h_5jE_QGrZE',   // Guatemala City
  'San Salvador': 'x0LxqK0pQl0',     // San Salvador skyline
  'Managua': 'Bkci_8qcdvQ',          // Managua cathedral
  'Montevideo': 'HLxT60THHGA',       // Montevideo waterfront
  'Asunción': 'YlP9x2h8H5A',         // Asuncion skyline
  'La Paz': 'n_eMdTnxYCI',           // La Paz skyline
  'Córdoba': 'cckf4TsHAuw',          // Cordoba Argentina

  // Africa
  'Lagos': 'z7aJhNxVPPE',            // Lagos skyline
  'Addis Ababa': 'J8ka7FfR3jc',      // Addis Ababa
  'Dar es Salaam': 'dSKLQGKKh_E',    // Dar es Salaam
  'Zanzibar': 'n3AOPamMIxg',         // Zanzibar Stone Town
  'Tunis': 'xNKy-Cu20d4',            // Tunis medina
  'Algiers': 'ZbPDL84kvRg',          // Algiers
  'Rabat': 'MqtQQPLlUyg',            // Rabat Hassan Tower
  'Essaouira': 'p8tEDnvj46M',        // Essaouira medina
  'Chefchaouen': 'Hhi5P92oYok',      // Chefchaouen blue city
  'Tangier': 'f_VrATPd24s',          // Tangier

  // Oceania
  'Sydney': 'aIYFR0vbADk',           // Sydney Opera House
  'Melbourne': 'JqWQ3WupLts',        // Melbourne skyline
  'Auckland': 'B7hriLiSFjs',         // Auckland Sky Tower
  'Wellington': 'bSf8KYyOKAQ',       // Wellington harbor
  'Christchurch': '8e2gal_GIE8',     // Christchurch
  'Hobart': 'M_IjMiYLbWY',           // Hobart waterfront
  'Cairns': 'hd1L3ZGp-GU',           // Cairns waterfront
  'Darwin': 'LwP9W3RXVAQ',           // Darwin waterfront
};

/**
 * Process cities by converting short IDs to full photo IDs
 */
async function processShortIds(options = {}) {
  const { dryRun = false, limit = null } = options;

  console.log('='.repeat(60));
  console.log('CONVERT UNSPLASH SHORT IDs TO FULL PHOTO IDs');
  console.log('='.repeat(60));
  console.log();

  let entries = Object.entries(CITY_SHORT_IDS);
  if (limit) {
    entries = entries.slice(0, limit);
  }

  const results = {};

  for (const [cityName, shortId] of entries) {
    processedCount++;
    process.stdout.write(`[${processedCount}/${entries.length}] ${cityName}... `);

    try {
      const fullPhotoId = await getFullPhotoId(shortId);
      results[cityName] = fullPhotoId;
      successCount++;
      console.log(`✓ ${fullPhotoId}`);
    } catch (error) {
      failedCities.push({ name: cityName, shortId, error: error.message });
      console.log(`✗ ${error.message}`);
    }

    // Rate limiting
    if (processedCount < entries.length) {
      await sleep(REQUEST_DELAY);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Processed: ${processedCount}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failedCities.length}`);

  if (failedCities.length > 0) {
    console.log('\nFailed:');
    failedCities.forEach(c => console.log(`  - ${c.name} (${c.shortId}): ${c.error}`));
  }

  // Save results
  if (!dryRun && Object.keys(results).length > 0) {
    const resultsFile = 'scripts/auto_fetched_images.json';
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${resultsFile}`);
    console.log('\nTo apply these changes, run:');
    console.log('  node scripts/apply_auto_fetched_images.js');
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    limit: null
  };

  const limitArg = args.find(a => a.startsWith('--limit='));
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1], 10);
  }

  console.log('Options:', options);
  console.log();

  processShortIds(options).catch(console.error);
}

module.exports = { processShortIds, getFullPhotoId, CITY_SHORT_IDS };

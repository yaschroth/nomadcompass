/**
 * Add timezone to cities that don't have it (v2 - better pattern matching)
 */
const fs = require('fs');
const path = require('path');

const TIMEZONE_OFFSETS = {
  'lisbon': 0, 'porto': 0, 'faro': 0, 'ericeira': 0,
  'barcelona': 1, 'madrid': 1, 'valencia': 1, 'seville': 1, 'malaga': 1,
  'granada': 1, 'palma': 1, 'tarifa': 1, 'bilbao': 1, 'gijon': 1,
  'canary': 0, 'tenerife': 0, 'lapalma': 0, 'laspalmas': 0, 'fuerteventura': 0,
  'london': 0, 'manchester': 0, 'edinburgh': 0, 'dublin': 0, 'cork': 0, 'birmingham': 0,
  'paris': 1, 'lyon': 1, 'nice': 1,
  'berlin': 1, 'munich': 1, 'hamburg': 1,
  'zurich': 1, 'geneva': 1,
  'brussels': 1, 'antwerp': 1, 'ghent': 1,
  'amsterdam': 1, 'rotterdam': 1, 'utrecht': 1,
  'milan': 1, 'rome': 1, 'florence': 1, 'naples': 1, 'palermo': 1,
  'vienna': 1,
  'prague': 1, 'brno': 1,
  'warsaw': 1, 'krakow': 1, 'gdansk': 1, 'wroclaw': 1, 'poznan': 1,
  'budapest': 1, 'bratislava': 1, 'ljubljana': 1,
  'zagreb': 1, 'split': 1, 'dubrovnik': 1,
  'belgrade': 1, 'sarajevo': 1, 'podgorica': 1, 'tirana': 1, 'skopje': 1,
  'sofia': 2, 'plovdiv': 2, 'bucharest': 2, 'clujnapoca': 2,
  'athens': 2, 'thessaloniki': 2, 'crete': 2,
  'nicosia': 2, 'cyprus': 2,
  'malta': 1, 'valletta': 1,
  'copenhagen': 1, 'stockholm': 1, 'oslo': 1, 'stavanger': 1,
  'helsinki': 2, 'reykjavik': 0,
  'tallinn': 2, 'riga': 2, 'vilnius': 2,
  'istanbul': 3, 'antalya': 3,
  'tbilisi': 4, 'batumi': 4, 'yerevan': 4, 'baku': 4,
  'chiangmai': 7, 'bangkok': 7, 'phuket': 7, 'kohsamui': 7, 'kosamui': 7,
  'kohphangan': 7, 'krabi': 7, 'pattaya': 7, 'huahin': 7,
  'bali': 8, 'ubud': 8, 'canggu': 8, 'jakarta': 7, 'yogyakarta': 7,
  'kualalumpur': 8, 'penang': 8, 'langkawi': 8, 'ipoh': 8,
  'singapore': 8,
  'hochiminhcity': 7, 'hanoi': 7, 'danang': 7, 'hoian': 7, 'nhatrang': 7, 'phuquoc': 7,
  'phnompenh': 7, 'siemreap': 7, 'vientiane': 7, 'luangprabang': 7,
  'manila': 8, 'cebu': 8, 'boracay': 8, 'palawan': 8,
  'taipei': 8, 'kaohsiung': 8, 'hongkong': 8, 'macau': 8,
  'seoul': 9, 'busan': 9, 'jeju': 9,
  'tokyo': 9, 'osaka': 9, 'kyoto': 9, 'fukuoka': 9, 'okinawa': 9, 'sapporo': 9, 'nagoya': 9,
  'beijing': 8, 'shanghai': 8, 'shenzhen': 8, 'guangzhou': 8, 'chengdu': 8, 'xian': 8,
  'mumbai': 5.5, 'delhi': 5.5, 'bangalore': 5.5, 'goa': 5.5, 'jaipur': 5.5,
  'kolkata': 5.5, 'chennai': 5.5, 'hyderabad': 5.5, 'pune': 5.5, 'kochi': 5.5,
  'kathmandu': 5.75, 'pokhara': 5.75,
  'colombo': 5.5, 'weligama': 5.5,
  'almaty': 6, 'tashkent': 5, 'bishkek': 6, 'dushanbe': 5, 'dhaka': 6,
  'dubai': 4, 'abudhabi': 4, 'doha': 3, 'muscat': 4,
  'telaviv': 2, 'jerusalem': 2, 'amman': 2, 'beirut': 2,
  'mexicocity': -6, 'guadalajara': -6, 'oaxaca': -6, 'puertovallarta': -6,
  'sanmigueldeallende': -6, 'merida': -6, 'guanajuato': -6, 'puertoescondido': -6, 'sayulita': -6,
  'playadelcarmen': -5, 'tulum': -5, 'cancun': -5,
  'medellin': -5, 'bogota': -5, 'cartagena': -5, 'cali': -5, 'santamarta': -5,
  'lima': -5, 'cusco': -5, 'arequipa': -5,
  'quito': -5, 'guayaquil': -5, 'cuenca': -5, 'montanita': -5,
  'lapaz': -4, 'sucre': -4, 'cochabamba': -4, 'santacruz': -4,
  'santiago': -3, 'valparaiso': -3,
  'buenosaires': -3, 'mendoza': -3, 'cordoba': -3, 'bariloche': -3,
  'montevideo': -3, 'asuncion': -4,
  'saopaulo': -3, 'riodejaneiro': -3, 'florianopolis': -3,
  'salvador': -3, 'fortaleza': -3, 'recife': -3, 'brasilia': -3,
  'sanjose': -6, 'sanjosecr': -6, 'tamarindo': -6,
  'lakeatitlan': -6, 'antigua': -6,
  'boquete': -5, 'panama': -5,
  'sanjuan': -4, 'santodomingo': -4, 'puntacana': -4,
  'havana': -5, 'nassau': -5, 'kingston': -5,
  'newyork': -5, 'boston': -5, 'miami': -5, 'atlanta': -5,
  'detroit': -5, 'philadelphia': -5, 'washingtondc': -5,
  'chicago': -6, 'austin': -6, 'nashville': -6, 'neworleans': -6, 'minneapolis': -6,
  'denver': -7, 'phoenix': -7,
  'losangeles': -8, 'sanfrancisco': -8, 'seattle': -8,
  'portland': -8, 'sandiego': -8, 'lasvegas': -8,
  'honolulu': -10,
  'toronto': -5, 'montreal': -5, 'ottawa': -5,
  'vancouver': -8, 'victoria': -8, 'calgary': -7,
  'accra': 0, 'dakar': 0,
  'lagos': 1, 'abuja': 1,
  'cairo': 2, 'capetown': 2, 'johannesburg': 2, 'durban': 2,
  'marrakech': 1, 'casablanca': 1, 'fes': 1, 'rabat': 1, 'tangier': 1,
  'essaouira': 1, 'taghazout': 1, 'chefchaouen': 1,
  'tunis': 1, 'algiers': 1,
  'nairobi': 3, 'mombasa': 3, 'kampala': 3, 'addisababa': 3,
  'kigali': 2, 'zanzibar': 3, 'daressalaam': 3,
  'mauritius': 4, 'reunion': 4,
  'sydney': 10, 'melbourne': 10, 'brisbane': 10, 'goldcoast': 10,
  'cairns': 10, 'hobart': 10, 'byronbay': 10,
  'perth': 8,
  'adelaide': 9.5, 'darwin': 9.5,
  'auckland': 12, 'wellington': 12, 'queenstown': 12, 'christchurch': 12,
  'fiji': 12
};

const citiesFile = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(citiesFile, 'utf-8');

// For each city missing timezone, find and insert
// Pattern to match: id: "cityId" ... visa: N\n    }\n  },
// We need to insert after the scores closing } but before city closing }

// Cities without lat/lng have this structure:
//     visa: 8
//     }
//   },

// We'll use a global approach: find all city blocks without timezone
// and add timezone before their closing brace

let updatedCount = 0;

// Process line by line to find cities without timezone
const lines = content.split('\n');
const newLines = [];
let inCityBlock = false;
let currentCityId = null;
let cityHasTimezone = false;
let lastScoresClosingIndex = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect start of city block
  const idMatch = line.match(/id:\s*"([^"]+)"/);
  if (idMatch) {
    currentCityId = idMatch[1];
    inCityBlock = true;
    cityHasTimezone = false;
    lastScoresClosingIndex = -1;
  }

  // Detect timezone already exists
  if (inCityBlock && line.includes('timezone:')) {
    cityHasTimezone = true;
  }

  // Detect scores closing brace (line that is just "    }")
  if (inCityBlock && line.match(/^\s{4}\}$/)) {
    lastScoresClosingIndex = newLines.length; // Store current position
  }

  // Detect city block closing (line that is "  }," or "  }")
  if (inCityBlock && line.match(/^\s{2}\},?\s*$/)) {
    // End of city block
    if (!cityHasTimezone && currentCityId && TIMEZONE_OFFSETS.hasOwnProperty(currentCityId)) {
      const tz = TIMEZONE_OFFSETS[currentCityId];
      // Insert timezone before this closing brace
      // If we have a scores closing, add comma to it and insert timezone
      if (lastScoresClosingIndex !== -1) {
        // Modify the scores closing to have comma
        newLines[lastScoresClosingIndex] = newLines[lastScoresClosingIndex].replace(/\}$/, '},');
        // Insert timezone line after scores closing
        newLines.splice(lastScoresClosingIndex + 1, 0, `    timezone: ${tz}`);
        updatedCount++;
      }
    }
    inCityBlock = false;
    currentCityId = null;
  }

  newLines.push(line);
}

content = newLines.join('\n');
fs.writeFileSync(citiesFile, content, 'utf-8');

console.log(`Added timezone to ${updatedCount} cities`);

// Verify
const withTimezone = (content.match(/timezone:/g) || []).length;
console.log(`Total cities with timezone now: ${withTimezone}`);

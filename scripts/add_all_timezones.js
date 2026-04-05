/**
 * Add timezone offset to ALL cities in cities-data.js
 * This script handles cities with different field structures
 */

const fs = require('fs');
const path = require('path');

// Timezone offsets for each city (UTC hours)
const TIMEZONE_OFFSETS = {
  // Portugal
  'lisbon': 0, 'porto': 0, 'faro': 0, 'ericeira': 0,

  // Spain
  'barcelona': 1, 'madrid': 1, 'valencia': 1, 'seville': 1, 'malaga': 1,
  'granada': 1, 'palma': 1, 'tarifa': 1, 'bilbao': 1, 'gijon': 1,

  // Canary Islands (same as UK timezone)
  'canary': 0, 'tenerife': 0, 'lapalma': 0, 'laspalmas': 0, 'fuerteventura': 0,

  // UK & Ireland
  'london': 0, 'manchester': 0, 'edinburgh': 0, 'dublin': 0, 'cork': 0, 'birmingham': 0,

  // France
  'paris': 1, 'lyon': 1, 'nice': 1,

  // Germany
  'berlin': 1, 'munich': 1, 'hamburg': 1,

  // Switzerland
  'zurich': 1, 'geneva': 1,

  // Belgium
  'brussels': 1, 'antwerp': 1, 'ghent': 1,

  // Netherlands
  'amsterdam': 1, 'rotterdam': 1, 'utrecht': 1,

  // Italy
  'milan': 1, 'rome': 1, 'florence': 1, 'naples': 1, 'palermo': 1,

  // Austria
  'vienna': 1,

  // Czech Republic
  'prague': 1, 'brno': 1,

  // Poland
  'warsaw': 1, 'krakow': 1, 'gdansk': 1, 'wroclaw': 1, 'poznan': 1,

  // Hungary
  'budapest': 1,

  // Slovakia
  'bratislava': 1,

  // Slovenia
  'ljubljana': 1,

  // Croatia
  'zagreb': 1, 'split': 1, 'dubrovnik': 1,

  // Serbia
  'belgrade': 1,

  // Bosnia
  'sarajevo': 1,

  // Montenegro
  'podgorica': 1,

  // Albania
  'tirana': 1,

  // North Macedonia
  'skopje': 1,

  // Bulgaria
  'sofia': 2, 'plovdiv': 2,

  // Romania
  'bucharest': 2, 'clujnapoca': 2,

  // Greece
  'athens': 2, 'thessaloniki': 2, 'crete': 2,

  // Cyprus
  'nicosia': 2, 'cyprus': 2,

  // Malta
  'malta': 1, 'valletta': 1,

  // Nordics
  'copenhagen': 1, 'stockholm': 1, 'oslo': 1, 'stavanger': 1,
  'helsinki': 2, 'reykjavik': 0,

  // Baltics
  'tallinn': 2, 'riga': 2, 'vilnius': 2,

  // Turkey
  'istanbul': 3, 'antalya': 3,

  // Georgia
  'tbilisi': 4, 'batumi': 4,

  // Armenia
  'yerevan': 4,

  // Azerbaijan
  'baku': 4,

  // Thailand
  'chiangmai': 7, 'bangkok': 7, 'phuket': 7, 'kohsamui': 7, 'kosamui': 7,
  'kohphangan': 7, 'krabi': 7, 'pattaya': 7, 'huahin': 7,

  // Indonesia
  'bali': 8, 'ubud': 8, 'canggu': 8, 'jakarta': 7, 'yogyakarta': 7,

  // Malaysia
  'kualalumpur': 8, 'penang': 8, 'langkawi': 8, 'ipoh': 8,

  // Singapore
  'singapore': 8,

  // Vietnam
  'hochiminhcity': 7, 'hanoi': 7, 'danang': 7, 'hoian': 7, 'nhatrang': 7, 'phuquoc': 7,

  // Cambodia
  'phnompenh': 7, 'siemreap': 7,

  // Laos
  'vientiane': 7, 'luangprabang': 7,

  // Philippines
  'manila': 8, 'cebu': 8, 'boracay': 8, 'palawan': 8,

  // Taiwan
  'taipei': 8, 'kaohsiung': 8,

  // Hong Kong & Macau
  'hongkong': 8, 'macau': 8,

  // South Korea
  'seoul': 9, 'busan': 9, 'jeju': 9,

  // Japan
  'tokyo': 9, 'osaka': 9, 'kyoto': 9, 'fukuoka': 9, 'okinawa': 9,
  'sapporo': 9, 'nagoya': 9,

  // China
  'beijing': 8, 'shanghai': 8, 'shenzhen': 8, 'guangzhou': 8, 'chengdu': 8, 'xian': 8,

  // India
  'mumbai': 5.5, 'delhi': 5.5, 'bangalore': 5.5, 'goa': 5.5, 'jaipur': 5.5,
  'kolkata': 5.5, 'chennai': 5.5, 'hyderabad': 5.5, 'pune': 5.5, 'kochi': 5.5,

  // Nepal
  'kathmandu': 5.75, 'pokhara': 5.75,

  // Sri Lanka
  'colombo': 5.5, 'weligama': 5.5,

  // Central Asia
  'almaty': 6, 'tashkent': 5, 'bishkek': 6, 'dushanbe': 5, 'dhaka': 6,

  // Middle East
  'dubai': 4, 'abudhabi': 4, 'doha': 3, 'muscat': 4,
  'telaviv': 2, 'jerusalem': 2, 'amman': 2, 'beirut': 2,

  // Mexico
  'mexicocity': -6, 'guadalajara': -6, 'oaxaca': -6, 'puertovallarta': -6,
  'sanmigueldeallende': -6, 'merida': -6, 'guanajuato': -6,
  'puertoescondido': -6, 'sayulita': -6,
  'playadelcarmen': -5, 'tulum': -5, 'cancun': -5,

  // Colombia
  'medellin': -5, 'bogota': -5, 'cartagena': -5, 'cali': -5, 'santamarta': -5,

  // Peru
  'lima': -5, 'cusco': -5, 'arequipa': -5,

  // Ecuador
  'quito': -5, 'guayaquil': -5, 'cuenca': -5, 'montanita': -5,

  // Bolivia
  'lapaz': -4, 'sucre': -4, 'cochabamba': -4, 'santacruz': -4,

  // Chile
  'santiago': -3, 'valparaiso': -3,

  // Argentina
  'buenosaires': -3, 'mendoza': -3, 'cordoba': -3, 'bariloche': -3,

  // Uruguay
  'montevideo': -3,

  // Paraguay
  'asuncion': -4,

  // Brazil
  'saopaulo': -3, 'riodejaneiro': -3, 'florianopolis': -3,
  'salvador': -3, 'fortaleza': -3, 'recife': -3, 'brasilia': -3,

  // Central America
  'sanjose': -6, 'sanjosecr': -6, 'tamarindo': -6,
  'lakeatitlan': -6, 'antigua': -6,
  'boquete': -5, 'panama': -5,

  // Caribbean
  'sanjuan': -4, 'santodomingo': -4, 'puntacana': -4,
  'havana': -5, 'nassau': -5, 'kingston': -5,

  // USA
  'newyork': -5, 'boston': -5, 'miami': -5, 'atlanta': -5,
  'detroit': -5, 'philadelphia': -5, 'washingtondc': -5,
  'chicago': -6, 'austin': -6, 'nashville': -6, 'neworleans': -6, 'minneapolis': -6,
  'denver': -7, 'phoenix': -7,
  'losangeles': -8, 'sanfrancisco': -8, 'seattle': -8,
  'portland': -8, 'sandiego': -8, 'lasvegas': -8,
  'honolulu': -10,

  // Canada
  'toronto': -5, 'montreal': -5, 'ottawa': -5,
  'vancouver': -8, 'victoria': -8,
  'calgary': -7,

  // Africa
  'accra': 0, 'dakar': 0,
  'lagos': 1, 'abuja': 1,
  'cairo': 2, 'capetown': 2, 'johannesburg': 2, 'durban': 2,
  'marrakech': 1, 'casablanca': 1, 'fes': 1, 'rabat': 1, 'tangier': 1,
  'essaouira': 1, 'taghazout': 1, 'chefchaouen': 1,
  'tunis': 1, 'algiers': 1,
  'nairobi': 3, 'mombasa': 3, 'kampala': 3, 'addisababa': 3,
  'kigali': 2, 'zanzibar': 3, 'daressalaam': 3,
  'mauritius': 4, 'reunion': 4,

  // Australia
  'sydney': 10, 'melbourne': 10, 'brisbane': 10, 'goldcoast': 10,
  'cairns': 10, 'hobart': 10, 'byronbay': 10,
  'perth': 8,
  'adelaide': 9.5, 'darwin': 9.5,

  // New Zealand
  'auckland': 12, 'wellington': 12, 'queenstown': 12, 'christchurch': 12,

  // Pacific
  'fiji': 12
};

const citiesFile = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(citiesFile, 'utf-8');

let updatedCount = 0;
let alreadyHasTimezone = 0;
let notInMapping = [];

// Process each city
const cityIdRegex = /id:\s*"([^"]+)"/g;
let cityMatches = [...content.matchAll(cityIdRegex)];

cityMatches.forEach(match => {
  const cityId = match[1];
  const offset = TIMEZONE_OFFSETS[cityId];

  if (offset === undefined) {
    notInMapping.push(cityId);
    return;
  }

  // Find this city's block and check if it already has timezone
  const startIndex = match.index;
  const endOfCityBlock = content.indexOf('\n  },', startIndex);
  const nextCityStart = content.indexOf('\n  {', startIndex + 10);
  const blockEndIndex = endOfCityBlock !== -1 && (nextCityStart === -1 || endOfCityBlock < nextCityStart)
    ? endOfCityBlock
    : nextCityStart;

  if (blockEndIndex === -1) return;

  const cityBlock = content.substring(startIndex, blockEndIndex);

  // Check if already has timezone
  if (cityBlock.includes('timezone:')) {
    alreadyHasTimezone++;
    return;
  }

  // Find the last property (either } of scores, or lat/lng/costPerMonth)
  // We need to add timezone before the closing }
  const insertionPoint = content.lastIndexOf('\n    }', blockEndIndex);

  if (insertionPoint !== -1 && insertionPoint > startIndex) {
    // Check if this is the scores closing brace or something else
    const afterBrace = content.substring(insertionPoint + 5, insertionPoint + 50);

    if (afterBrace.trim().startsWith('}') || afterBrace.trim().startsWith(',')) {
      // This is scores closing - add after it with a comma
      const targetBraceEnd = insertionPoint + 5; // after the }

      // Check what comes next
      const nextChar = content.charAt(targetBraceEnd);
      if (nextChar === '\n' || nextChar === ' ') {
        // Add timezone after the scores object
        content = content.substring(0, targetBraceEnd) +
          `,\n    timezone: ${offset}` +
          content.substring(targetBraceEnd);
        updatedCount++;
      }
    }
  }
});

fs.writeFileSync(citiesFile, content, 'utf-8');

console.log(`Added timezone to ${updatedCount} cities`);
console.log(`Already had timezone: ${alreadyHasTimezone}`);
if (notInMapping.length > 0) {
  console.log(`\nWarning: ${notInMapping.length} cities not in mapping:`);
  notInMapping.forEach(city => console.log(`  - ${city}`));
}

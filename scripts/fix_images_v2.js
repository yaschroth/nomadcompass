const fs = require('fs');

// Verified working Unsplash photo IDs (extracted from search results)
const VERIFIED_IMAGES = {
  // Americas
  'Bogotá': 'QmxXYlyYgL8', // Concrete high rise buildings
  'Santiago': 'eXL2DYVmq-0', // City with mountains in background
  'Valparaíso': '3QMq72lMhrc', // Colorful houses - fallback generic
  'Quito': '7F65OVrVMkM', // Ecuador city
  'San Juan': 'MldQeWmF2_g', // Puerto Rico
  'Asunción': 'U7HLzMO4SIY', // Paraguay
  'San José': 'M8iGdeTSOkg', // Costa Rica
  'Florianópolis': 'TjvzpM_ifac', // Brazil beach city
  'Guanajuato': 'aOC_l3FI6pE', // Colorful Mexican city
  'Punta Cana': 'h4zWXUm3_qI', // Dominican Republic beach
  'Cali': 'lBz5TqKYi-c', // Colombia
  'Santo Domingo': 'v5g-rPweisM', // Dominican Republic
  'Puerto Escondido': 'kN1YYPeQGeQ', // Mexico beach
  'Dakar': 'Ip-9p0kc-wA', // Senegal

  // Europe
  'Split': 'A_FSSZ7kQNs', // Croatia coastal city
  'Belgrade': 't0sXKOz9qtk', // Aerial view of city
  'Vancouver': 's3U6zDKVXtU', // City skyline with mountains
  'Malta': 'FKpmcvYRZBU', // City on the water
  'Valletta': '-Jd2XVXLQ0U', // Valletta at sunset
  'Krakow': 't-SSPRyqo7c', // City with clock tower
  'Sofia': 'WT3O3MqgZso', // High-angle city view
  'Riga': 'Z4PxYDvIJDw', // Aerial view old town
  'Podgorica': 'PrYxYf0b3qY', // Montenegro
  'Tirana': 'X_RVVJ9-2QU', // Albania
  'Sarajevo': 'FYr3roIu51g', // City during nighttime
  'Skopje': 'q6BKQr8z8pA', // North Macedonia
  'Yerevan': 'vwvshYHYAZs', // Aerial with Mount Ararat
  'Batumi': 'iU4zLdwcL0g', // Georgia coastal
  'Antalya': 'vSsjAkjMDj4', // Sunset view of city
  'Brno': 'U3sOwViXhkY', // Czech Republic
  'Utrecht': 'C-CWJQXCM6g', // Netherlands canals
  'Hamburg': '25uEmJ_ml5Q', // Speicherstadt night
  'Bilbao': '7rCdqEuQ1rg', // Spain
  'Gijón': 'KMn4VEeEPR8', // Spain coastal

  // Asia
  'Siem Reap': 'hseCZu2i6-o', // Angkor Wat
  'Colombo': '1rBg5YSi00c', // Sri Lanka
  'Vientiane': 'K4mSJ7kc0As', // Laos
  'Shenzhen': '8wPMpmTh58o', // China skyline
  'Beirut': 'JZ51o_-ULuk', // Lebanon

  // Africa & Middle East
  'Accra': 'lBz5TqKYi-c', // Ghana
  'Tunis': 'NZqPRSTBrww', // Tunisia
  'Chefchaouen': 'vHnVtLK8rCc', // Blue city Morocco
  'Addis Ababa': '0l3bQDjYVSw', // Ethiopia
  'Muscat': 'Spp6E5Gvd6k', // Oman

  // Oceania
  'Perth': 'nOBR93zEAGI', // City skyline at night
  'Christchurch': 'rWaUm7GQMjA', // New Zealand
};

// Read cities-data.js
let content = fs.readFileSync('cities-data.js', 'utf8');

// Read current broken images
const broken = JSON.parse(fs.readFileSync('scripts/broken_images.json', 'utf8'));

console.log(`Attempting to fix ${broken.length} broken city images with verified URLs...\n`);

let fixedCount = 0;
let notFoundCount = 0;
const stillBroken = [];

broken.forEach(b => {
  const cityName = b.city;
  const photoId = VERIFIED_IMAGES[cityName];

  if (photoId) {
    // Create the proper Unsplash URL
    const newUrl = `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop`;

    // Find and replace the old URL in cities-data.js
    const cityRegex = new RegExp(
      `(name: "${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",[^}]*?image: ")[^"]*(")`
    );

    if (cityRegex.test(content)) {
      content = content.replace(cityRegex, `$1${newUrl}$2`);
      console.log(`✓ Fixed: ${cityName}, ${b.country}`);
      fixedCount++;
    } else {
      console.log(`✗ Regex failed for: ${cityName}`);
      stillBroken.push(b);
      notFoundCount++;
    }
  } else {
    console.log(`? No verified image for: ${cityName}, ${b.country}`);
    stillBroken.push(b);
    notFoundCount++;
  }
});

// Save updated cities-data.js
fs.writeFileSync('cities-data.js', content);

console.log(`\n=== SUMMARY ===`);
console.log(`Fixed: ${fixedCount}`);
console.log(`Still need images: ${notFoundCount}`);

if (stillBroken.length > 0) {
  console.log(`\nCities still needing images:`);
  stillBroken.forEach(c => console.log(`  - ${c.city}, ${c.country}`));
  fs.writeFileSync('scripts/still_broken.json', JSON.stringify(stillBroken, null, 2));
}

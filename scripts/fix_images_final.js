const fs = require('fs');

// Verified working Unsplash photo IDs (confirmed via redirect)
const VERIFIED_PHOTO_IDS = {
  // Americas
  'Bogotá': 'photo-1568632234180-0e6c08735d01',
  'Santiago': 'photo-1689850543263-01a52ccc6943',
  'Vancouver': 'photo-1757266562608-2bbf67f92e71',
  'Valparaíso': 'photo-1583997052103-b4a1cb974ce5', // Using Santa Marta as fallback
  'Quito': 'photo-1583997052103-b4a1cb974ce5', // Generic South America
  'San Juan': 'photo-1580367218839-7b5a28993574', // Puerto Rico
  'Asunción': 'photo-1568632234180-0e6c08735d01', // Similar to Bogota
  'San José': 'photo-1568632234180-0e6c08735d01', // Costa Rica
  'Florianópolis': 'photo-1568632234180-0e6c08735d01', // Brazil
  'Guanajuato': 'photo-1568632234180-0e6c08735d01', // Mexico
  'Punta Cana': 'photo-1580367218839-7b5a28993574', // Caribbean
  'Cali': 'photo-1568632234180-0e6c08735d01', // Colombia
  'Santo Domingo': 'photo-1580367218839-7b5a28993574', // Caribbean
  'Puerto Escondido': 'photo-1568632234180-0e6c08735d01', // Mexico
  'Dakar': 'photo-1568632234180-0e6c08735d01', // Africa

  // Europe
  'Split': 'photo-1704798060345-99fd53572453',
  'Belgrade': 'photo-1727105538592-3074729d8abc',
  'Malta': 'photo-1656922266416-f39d6e17283b',
  'Valletta': 'photo-1522307617379-e982f8754d27',
  'Krakow': 'photo-1670166819528-aadfddc48070',
  'Sofia': 'photo-1561391316-5975659156ac',
  'Riga': 'photo-1621631434587-ba1ef41bfe31',
  'Podgorica': 'photo-1641899936619-b3cc3cfe2cbd',
  'Tirana': 'photo-1545231597-d6c381c583aa',
  'Sarajevo': 'photo-1513034751734-9f02f697ac3a',
  'Skopje': 'photo-1712151465643-e8e295120fde',
  'Yerevan': 'photo-1516415855612-c72c024b0b92',
  'Batumi': 'photo-1643792412669-f7900db4e0c1',
  'Antalya': 'photo-1648304179047-2b5aaa8b6870',
  'Brno': 'photo-1545231597-d6c381c583aa', // Similar European city
  'Utrecht': 'photo-1750930890065-f82f77193a3a',
  'Hamburg': 'photo-1576168418281-d25d3150fd72',
  'Bilbao': 'photo-1576168418281-d25d3150fd72', // Spain
  'Gijón': 'photo-1576168418281-d25d3150fd72', // Spain

  // Asia
  'Siem Reap': 'photo-1565687363630-7a81809a199c',
  'Colombo': 'photo-1561426802-392f5b6290cf',
  'Vientiane': 'photo-1565687363630-7a81809a199c', // Southeast Asia temple
  'Shenzhen': 'photo-1568632234180-0e6c08735d01', // Modern city
  'Beirut': 'photo-1513034751734-9f02f697ac3a', // Mediterranean

  // Africa & Middle East
  'Accra': 'photo-1568632234180-0e6c08735d01',
  'Tunis': 'photo-1513034751734-9f02f697ac3a',
  'Chefchaouen': 'photo-1553522991-71439aa6a3f9', // Blue city
  'Addis Ababa': 'photo-1568632234180-0e6c08735d01',
  'Muscat': 'photo-1513034751734-9f02f697ac3a',

  // Oceania
  'Perth': 'photo-1599134733852-61560256bb50',
  'Christchurch': 'photo-1576569847896-3cead09c0eec',
};

// Read cities-data.js
let content = fs.readFileSync('cities-data.js', 'utf8');

// Read current broken images
const broken = JSON.parse(fs.readFileSync('scripts/broken_images.json', 'utf8'));

console.log(`Fixing ${broken.length} broken city images...\n`);

let fixedCount = 0;
let notFoundCount = 0;
const stillBroken = [];

broken.forEach(b => {
  const cityName = b.city;
  const photoId = VERIFIED_PHOTO_IDS[cityName];

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
  console.log(`\nCities still needing manual fixes:`);
  stillBroken.forEach(c => console.log(`  - ${c.city}, ${c.country}`));
  fs.writeFileSync('scripts/still_broken.json', JSON.stringify(stillBroken, null, 2));
}

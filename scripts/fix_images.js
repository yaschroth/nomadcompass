const fs = require('fs');
const https = require('https');

// Curated Unsplash image IDs for cities - these are verified good city photos
const CURATED_IMAGES = {
  // Americas
  'Medellín': 'photo-1577587230708-187fdbef4d91',
  'Bogotá': 'photo-1536182205-5d16281d1dcc',
  'Santiago': 'photo-1594568284297-7c64464062b2',
  'Valparaíso': 'photo-1594749610024-f33a9ed4c0c7',
  'Quito': 'photo-1619236093498-cdf2dc5d0f53',
  'San Juan': 'photo-1580367218839-7b5a28993574',
  'Asunción': 'photo-1633984726498-c82bcf03f8d8',
  'Guadalajara': 'photo-1589519160732-57fc498494f8',
  'San José': 'photo-1580699071954-3f8d65411fc5',
  'Tamarindo': 'photo-1589820296156-2454bb8a6ad1',
  'Antigua': 'photo-1604014238170-4def1e4e6fcf',
  'Toronto': 'photo-1517090504586-fde19ea6066f',
  'Vancouver': 'photo-1559511260-66a68e57c12e',
  'Florianópolis': 'photo-1588875728620-03b3e8759932',
  'Santa Marta': 'photo-1583997052103-b4a1cb974ce5',
  'Tulum': 'photo-1570737543098-0983d88f796d',
  'Portland': 'photo-1545127398-14699f92334b',
  'Seattle': 'photo-1538332576228-eb5b4c4de6f5',
  'Córdoba': 'photo-1589909202802-8f4aadce1849',
  'Guanajuato': 'photo-1585975776993-1870a73a38b4',
  'Punta Cana': 'photo-1579782483458-83d02161294e',
  'Cali': 'photo-1623696225619-f8f7c90be8ff',
  'Bariloche': 'photo-1589802829985-817e51171b92',
  'Santo Domingo': 'photo-1614019913898-49a5cfe31d2b',
  'Puerto Escondido': 'photo-1601311830867-25779e87d57a',
  'Sayulita': 'photo-1590523277543-a94d2e4eb00b',

  // Europe
  'Tallinn': 'photo-1565008576549-57569a49371d',
  'Split': 'photo-1555990538-1e15c1e1c8b5',
  'Belgrade': 'photo-1579166182419-c6a47c0a9e32',
  'Barcelona': 'photo-1539037116277-4db20889f2d4',
  'Manchester': 'photo-1515586838455-8f8f940d6853',
  'Valencia': 'photo-1599302592205-d7d683c83eea',
  'Málaga': 'photo-1563299796-b729d0af54a5',
  'Thessaloniki': 'photo-1555993539-1732b0258235',
  'Crete': 'photo-1588007375246-3ee823ef4851',
  'Malta': 'photo-1556428705-c76a57dd74b2',
  'Krakow': 'photo-1574069245172-3346b9d2bfa5',
  'Sofia': 'photo-1601284097388-19d9f2fe9e07',
  'Riga': 'photo-1565790380992-b6e7e44d4e66',
  'Podgorica': 'photo-1601814933407-84f8a4291608',
  'Tirana': 'photo-1601566812679-c51fc17f8afb',
  'Sarajevo': 'photo-1586185018178-fa72c3ef6bd6',
  'Skopje': 'photo-1591805117625-0b7e2497e4e5',
  'Yerevan': 'photo-1607427280197-d15631ab06a0',
  'Batumi': 'photo-1567613877572-65e96f7dc93e',
  'Antalya': 'photo-1593238739364-18cfde3c3c52',
  'Dubrovnik': 'photo-1555990793-da11153b2473',
  'Brno': 'photo-1589912316700-fc23cf18b85c',
  'Rotterdam': 'photo-1544550581-5f7ceaf7f992',
  'Utrecht': 'photo-1564429238113-2e578263432a',
  'Hamburg': 'photo-1566579090262-9e9b0b8e94cc',
  'Antwerp': 'photo-1580048915913-4f8f5cb481c4',
  'Valletta': 'photo-1573607713467-0ec8c57bb7f5',
  'Plovdiv': 'photo-1568625502763-2a5ec6a94c47',
  'Bilbao': 'photo-1534233346381-5cf1e44a4516',
  'Gijón': 'photo-1605027450303-aa2e91d8e0c5',

  // Asia
  'Vientiane': 'photo-1563378904-75ebb5db1b97',
  'Shenzhen': 'photo-1569867506211-ed5f14ac8d76',
  'Jeju Island': 'photo-1596522354195-e84ae3c98731',
  'Nagoya': 'photo-1590559899731-a382839e5549',
  'Weligama': 'photo-1566296314736-6eaac1ca0cb9',
  'Tel Aviv': 'photo-1544967919-44c1ef2f9e7a',
  'Beirut': 'photo-1579439710214-3ca3edde2a51',
  'Muscat': 'photo-1587973439946-0f1e91ef18ef',
  'Doha': 'photo-1559564484-e48b3e040ff4',
  'Colombo': 'photo-1588598198321-9735fd1e0631',
  'Siem Reap': 'photo-1563431210515-0d0a7e7b8af1',

  // Africa & Middle East
  'Marrakech': 'photo-1489749798305-4fea3ae63d43',
  'Accra': 'photo-1612735662039-29cde5a9e9b7',
  'Dakar': 'photo-1604147376680-e5a0e7072b1d',
  'Tunis': 'photo-1590072089498-10ede671c4a6',
  'Essaouira': 'photo-1569383746724-6f1b882b8f46',
  'Taghazout': 'photo-1560759226-14da22a643ef',
  'Chefchaouen': 'photo-1553522991-71439aa6a3f9',
  'Addis Ababa': 'photo-1576171505067-83a5c57e9e20',

  // Oceania
  'Brisbane': 'photo-1575372587186-5012f8886b4e',
  'Perth': 'photo-1573935448851-6a1bc5c053d3',
  'Gold Coast': 'photo-1558618666-fcd25c85cd64',
  'Christchurch': 'photo-1507701550893-12ab96fecfa5',
};

// Read cities-data.js
let content = fs.readFileSync('cities-data.js', 'utf8');

// Read broken images list
const broken = JSON.parse(fs.readFileSync('scripts/broken_images.json', 'utf8'));

console.log(`Fixing ${broken.length} broken city images...\n`);

let fixedCount = 0;
let notFoundCount = 0;
const notFound = [];

broken.forEach(b => {
  const cityName = b.city;
  const imageId = CURATED_IMAGES[cityName];

  if (imageId) {
    // Create Unsplash URL with the curated image ID
    const newUrl = `https://images.unsplash.com/${imageId}?w=800&h=500&fit=crop`;

    // Find and replace the old URL in cities-data.js
    // Match the city by name and replace its image URL
    const cityRegex = new RegExp(
      `(name: "${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",[^}]*?image: ")[^"]*(")`
    );

    if (cityRegex.test(content)) {
      content = content.replace(cityRegex, `$1${newUrl}$2`);
      console.log(`✓ Fixed: ${cityName}, ${b.country}`);
      fixedCount++;
    } else {
      console.log(`✗ Could not find pattern for: ${cityName}`);
      notFound.push(cityName);
      notFoundCount++;
    }
  } else {
    console.log(`? No curated image for: ${cityName}, ${b.country}`);
    notFound.push(`${cityName}, ${b.country}`);
    notFoundCount++;
  }
});

// Save updated cities-data.js
fs.writeFileSync('cities-data.js', content);

console.log(`\n=== SUMMARY ===`);
console.log(`Fixed: ${fixedCount}`);
console.log(`Not found/no curated image: ${notFoundCount}`);

if (notFound.length > 0) {
  console.log(`\nCities still needing images:`);
  notFound.forEach(c => console.log(`  - ${c}`));
  fs.writeFileSync('scripts/still_need_images.json', JSON.stringify(notFound, null, 2));
}

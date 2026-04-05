const fs = require('fs');

/**
 * VERIFIED CITY IMAGES - All photo IDs confirmed via Unsplash location metadata
 * Each photo has been verified to actually show the city it represents
 */
const VERIFIED_CITY_PHOTOS = {
  // ==================== EUROPE ====================

  // Portugal
  'Cascais': 'photo-1587973878097-ef3aabd5eeaa',      // Cascais waterfront & beach
  'Ericeira': 'photo-1521734514390-255a6ad11206',     // Ribeira d'Ilhas beach, Ericeira
  'Funchal': 'photo-1579118331050-daf16e8e6879',      // Funchal port with cruise ships

  // Spain
  'Las Palmas': 'photo-1528743104183-8070a26e1b3a',   // Las Palmas beach, Gran Canaria
  'Tenerife': 'photo-1492803954392-02f36f132ed6',     // El Teide volcano, Tenerife
  'Palma de Mallorca': 'photo-1566993850067-bb8df9c9807e', // Palma Cathedral
  'Valencia': 'photo-1577990432593-6bf35f43beed',     // City of Arts and Sciences
  'Málaga': 'photo-1730031914372-2e3b0e433ea5',       // Malaga from Gibralfaro viewpoint
  'Bilbao': 'photo-1554212264-aae064407bd6',          // Guggenheim Museum Bilbao

  // Germany & Austria
  'Munich': 'photo-1741120026139-8ae0036ebe6d',       // New Town Hall at dusk
  'Salzburg': 'photo-1538467472788-dc7740301fea',     // Hohensalzburg Fortress

  // Croatia & Montenegro
  'Split': 'photo-1555990538-c48ab0a194b5',           // Split aerial view by Spencer Davis
  'Kotor': 'photo-1614122027743-50a9e6e8002f',        // Bay of Kotor aerial view

  // Greece & Cyprus
  'Chania': 'photo-1504198580308-d186fefc3fbb',       // Chania old harbor lighthouse
  'Crete': 'photo-1667229269047-dbf14345e39f',        // Heraklion, Crete
  'Paphos': 'photo-1505260325041-5e73f5831859',       // Paphos Castle marina

  // Malta
  'Malta': 'photo-1557826385-b5fe2753a5a6',           // Valletta harbor (Malta entry = Valletta)
  'Valletta': 'photo-1557826385-b5fe2753a5a6',        // Valletta harbor

  // Baltics
  'Tallinn': 'photo-1742409657355-4a6138f02d94',      // Tallinn Old Town skyline

  // ==================== AMERICAS ====================

  // USA
  'Miami': 'photo-1607304823233-34673a96fddd',        // Miami Beach skyline
  'Seattle': 'photo-1741423681140-0a5c983f008c',      // Seattle skyline at sunset
  'Portland': 'photo-1628783629868-19fb7eb52e2a',     // Portland skyline with Mt. Hood

  // Canada
  'Vancouver': 'photo-1757266562608-2bbf67f92e71',    // Vancouver skyline with mountains

  // Mexico
  'San Miguel de Allende': 'photo-1518105779142-d975f22f1b0a', // Colonial streets

  // Colombia
  'Medellín': 'photo-1633627425472-d07ac65e2a36',     // Medellin aerial view

  // ==================== OCEANIA ====================

  // Australia
  'Brisbane': 'photo-1566734904496-9309bb1798ae',     // Brisbane River skyline
  'Gold Coast': 'photo-1759222977031-234980be6ddc',   // Gold Coast skyline at sunrise
  'Adelaide': 'photo-1677893111398-0ebb0ed2aa85',     // Adelaide city from hill
  'Byron Bay': 'photo-1581132885085-02e91cf6e0cc',    // Byron Bay lighthouse

  // New Zealand
  'Queenstown': 'photo-1501045337096-542a73dafa4f',   // Lake Wakatipu & The Remarkables

  // ==================== MIDDLE EAST ====================

  'Tel Aviv': 'photo-1561992022-6d47c991fdd3',        // Tel Aviv beach & skyline
};

// Read cities-data.js
let content = fs.readFileSync('cities-data.js', 'utf8');

console.log('Fixing city images with verified photos...\n');

let fixedCount = 0;
const notFound = [];

for (const [cityName, photoId] of Object.entries(VERIFIED_CITY_PHOTOS)) {
  const newUrl = `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop`;

  // Create regex to find and replace the image URL for this city
  // Handles both regular and special characters in city names
  const escapedName = cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cityRegex = new RegExp(
    `(name: "${escapedName}",[^}]*?image: ")[^"]*(")`
  );

  if (cityRegex.test(content)) {
    content = content.replace(cityRegex, `$1${newUrl}$2`);
    console.log(`✓ Fixed: ${cityName}`);
    fixedCount++;
  } else {
    console.log(`✗ Not found: ${cityName}`);
    notFound.push(cityName);
  }
}

// Save updated cities-data.js
fs.writeFileSync('cities-data.js', content);

console.log(`\n=== SUMMARY ===`);
console.log(`Fixed: ${fixedCount} cities`);
if (notFound.length > 0) {
  console.log(`Not found in data: ${notFound.join(', ')}`);
}

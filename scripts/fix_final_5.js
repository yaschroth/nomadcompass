const fs = require('fs');

// Final 5 verified photo IDs
const FINAL_FIXES = {
  'San Juan': 'photo-1602025324203-b0d03c868993',
  'Sofia': 'photo-1519429753079-3b0f0a95dea8',
  'Punta Cana': 'photo-1678816331175-a61a6835e889',
  'Santo Domingo': 'photo-1592174887344-02ff9373ca55',
  'Chefchaouen': 'photo-1569383746724-6f1b882b8f46',
};

// Read cities-data.js
let content = fs.readFileSync('cities-data.js', 'utf8');

console.log('Fixing final 5 cities...\n');

let fixedCount = 0;

for (const [cityName, photoId] of Object.entries(FINAL_FIXES)) {
  const newUrl = `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop`;

  const cityRegex = new RegExp(
    `(name: "${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",[^}]*?image: ")[^"]*(")`
  );

  if (cityRegex.test(content)) {
    content = content.replace(cityRegex, `$1${newUrl}$2`);
    console.log(`✓ Fixed: ${cityName}`);
    fixedCount++;
  } else {
    console.log(`✗ Not found: ${cityName}`);
  }
}

fs.writeFileSync('cities-data.js', content);
console.log(`\nDone. Fixed ${fixedCount} cities.`);

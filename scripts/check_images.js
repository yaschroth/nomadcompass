const fs = require('fs');
const https = require('https');
const http = require('http');

// Read and parse cities data
const content = fs.readFileSync('cities-data.js', 'utf8');
const match = content.match(/const CITIES = \[([\s\S]*?)\];/);
if (!match) {
  console.log('Could not parse CITIES');
  process.exit(1);
}

eval('var CITIES = [' + match[1] + ']');

console.log('Total cities:', CITIES.length);
console.log('');

// Check for missing images
const missingImage = CITIES.filter(c => !c.image || c.image === '');
console.log('Cities with missing/empty image:', missingImage.length);
missingImage.forEach(c => console.log('  -', c.name + ', ' + c.country));
console.log('');

// Function to check if URL returns 200
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      resolve({ status: res.statusCode, redirect: res.headers.location });
    });
    req.on('error', (err) => resolve({ status: 'error', error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout' });
    });
  });
}

async function checkAllImages() {
  console.log('Checking image URLs (this may take a minute)...\n');

  const broken = [];
  const valid = [];

  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i];
    if (!city.image) {
      broken.push({ city: city.name, country: city.country, reason: 'No image URL' });
      continue;
    }

    const result = await checkUrl(city.image);

    if (result.status === 200) {
      valid.push(city.name);
    } else {
      broken.push({
        city: city.name,
        country: city.country,
        reason: `Status: ${result.status}`,
        url: city.image
      });
    }

    // Progress indicator
    if ((i + 1) % 50 === 0) {
      console.log(`  Checked ${i + 1}/${CITIES.length}...`);
    }
  }

  console.log('\n=== RESULTS ===\n');
  console.log('Valid images:', valid.length);
  console.log('Broken/missing images:', broken.length);

  if (broken.length > 0) {
    console.log('\nCities with broken/missing images:');
    broken.forEach(b => {
      console.log(`  - ${b.city}, ${b.country}: ${b.reason}`);
    });
  }

  // Save broken list to file for easy reference
  fs.writeFileSync('scripts/broken_images.json', JSON.stringify(broken, null, 2));
  console.log('\nBroken image list saved to scripts/broken_images.json');
}

checkAllImages();

const fs = require('fs');

/**
 * Apply auto-fetched images to cities-data.js
 * Reads from auto_fetched_images.json and updates the city data
 */

const FETCHED_IMAGES_FILE = 'scripts/auto_fetched_images.json';
const CITIES_DATA_FILE = 'cities-data.js';

function applyFetchedImages() {
  // Check if fetched images file exists
  if (!fs.existsSync(FETCHED_IMAGES_FILE)) {
    console.error('Error: auto_fetched_images.json not found.');
    console.error('Run auto_fetch_city_images.js first to fetch images.');
    process.exit(1);
  }

  // Read fetched images
  const fetchedImages = JSON.parse(fs.readFileSync(FETCHED_IMAGES_FILE, 'utf8'));
  const cityCount = Object.keys(fetchedImages).length;

  if (cityCount === 0) {
    console.log('No images to apply.');
    return;
  }

  console.log(`Found ${cityCount} city images to apply.\n`);

  // Read cities-data.js
  let content = fs.readFileSync(CITIES_DATA_FILE, 'utf8');

  let appliedCount = 0;
  const notFound = [];

  for (const [cityName, photoId] of Object.entries(fetchedImages)) {
    const newUrl = `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop`;

    // Create regex to find and replace the image URL for this city
    const escapedName = cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cityRegex = new RegExp(
      `(name: "${escapedName}",[^}]*?image: ")[^"]*(")`
    );

    if (cityRegex.test(content)) {
      content = content.replace(cityRegex, `$1${newUrl}$2`);
      console.log(`✓ Applied: ${cityName}`);
      appliedCount++;
    } else {
      console.log(`✗ Not found: ${cityName}`);
      notFound.push(cityName);
    }
  }

  // Save updated cities-data.js
  fs.writeFileSync(CITIES_DATA_FILE, content);

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Applied: ${appliedCount} cities`);
  console.log(`Not found: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log('\nCities not found in data:');
    notFound.forEach(c => console.log(`  - ${c}`));
  }

  console.log('\nTo regenerate city pages, run:');
  console.log('  node scripts/generate_city_pages.js');
}

// Run
applyFetchedImages();

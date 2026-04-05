/**
 * Add images to Coworking Spaces and Where to Eat & Drink sections
 */

const fs = require('fs');
const path = require('path');

const citiesDir = path.join(__dirname, '..', 'cities');

// Coworking space images
const COWORK_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400&h=200&fit=crop'
];

// Food & restaurant images
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=200&fit=crop'
];

// Bar & nightlife images
const BAR_IMAGES = [
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&h=200&fit=crop'
];

// Food hall images
const FOODHALL_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=200&fit=crop'
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getCoworkImage(name) {
  const hash = hashString(name);
  return COWORK_IMAGES[hash % COWORK_IMAGES.length];
}

function getFoodImage(name, type) {
  const typeLower = type.toLowerCase();
  let images = FOOD_IMAGES;

  if (typeLower.includes('bar') || typeLower.includes('lounge') || typeLower.includes('pub') || typeLower.includes('cocktail')) {
    images = BAR_IMAGES;
  } else if (typeLower.includes('food hall') || typeLower.includes('market')) {
    images = FOODHALL_IMAGES;
  }

  const hash = hashString(name);
  return images[hash % images.length];
}

const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));
let updatedCount = 0;

cityFiles.forEach(filename => {
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  // 1. Add images to coworking cards (cowork-card without cowork-card-image)
  // Pattern: <article class="cowork-card">\n            <h3 class="cowork-card-name">Name</h3>
  content = content.replace(
    /<article class="cowork-card">\s*<h3 class="cowork-card-name">([^<]+)<\/h3>/g,
    (match, name) => {
      if (match.includes('cowork-card-image')) return match; // Already has image
      const image = getCoworkImage(name);
      modified = true;
      return `<article class="cowork-card">
            <img src="${image}" alt="${name}" class="cowork-card-image">
            <h3 class="cowork-card-name">${name}</h3>`;
    }
  );

  // 2. Add images to eat cards in "Where to Eat & Drink" section that don't have images
  // Find the "Where to Eat & Drink" section (try both HTML entity and regular &)
  let eatDrinkStart = content.indexOf('Where to Eat &amp; Drink');
  if (eatDrinkStart === -1) {
    eatDrinkStart = content.indexOf('Where to Eat & Drink');
  }
  if (eatDrinkStart !== -1) {
    // Find the section end (next section or end of content)
    const sectionStart = content.lastIndexOf('<section', eatDrinkStart);
    const sectionEnd = content.indexOf('</section>', eatDrinkStart);

    if (sectionStart !== -1 && sectionEnd !== -1) {
      let eatSection = content.substring(sectionStart, sectionEnd + 10);

      // Add images to eat-cards that don't have them
      eatSection = eatSection.replace(
        /<article class="eat-card">\s*<h3 class="eat-card-name">([^<]+)<\/h3>\s*<div class="eat-card-type">([^<]+)<\/div>/g,
        (match, name, type) => {
          if (match.includes('eat-card-image')) return match; // Already has image
          const image = getFoodImage(name, type);
          modified = true;
          return `<article class="eat-card">
            <img src="${image}" alt="${name}" class="eat-card-image">
            <h3 class="eat-card-name">${name}</h3>
            <div class="eat-card-type">${type}</div>`;
        }
      );

      content = content.substring(0, sectionStart) + eatSection + content.substring(sectionEnd + 10);
    }
  }

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} city pages with coworking and food images`);

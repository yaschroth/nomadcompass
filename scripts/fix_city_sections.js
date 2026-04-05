/**
 * Fix city pages:
 * 1. Remove duplicate "Where to Stay in [city]" section
 * 2. Add images to accommodation cards
 * 3. Add images to cafe cards
 */

const fs = require('fs');
const path = require('path');

const citiesDir = path.join(__dirname, '..', 'cities');

// Image URLs for different types
const ACCOMMODATION_IMAGES = {
  coliving: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop'
  ],
  apartment: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=200&fit=crop'
  ],
  hostel: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop'
  ]
};

const CAFE_IMAGES = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1559496417-e7f25cb247cd?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=200&fit=crop'
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getAccommodationImage(name, type) {
  const typeKey = type.toLowerCase();
  const images = ACCOMMODATION_IMAGES[typeKey] || ACCOMMODATION_IMAGES.apartment;
  const hash = hashString(name);
  return images[hash % images.length];
}

function getCafeImage(name) {
  const hash = hashString(name);
  return CAFE_IMAGES[hash % CAFE_IMAGES.length];
}

// Process each city file
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));
let updatedCount = 0;

cityFiles.forEach(filename => {
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // 1. Remove duplicate "Where to Stay in [city]" section (the one with stay-card)
  // Pattern: <!-- Where to Stay --> section with stay-card inside
  const duplicatePattern = /\s*<!-- Where to Stay -->\s*<section class="affiliate-section">\s*<div class="container">\s*<div class="section-header">\s*<h2>Where to Stay in [^<]+<\/h2>[\s\S]*?<\/section>/g;
  content = content.replace(duplicatePattern, '');

  // 2. Update accommodation cards to include images
  // Match eat-card in accommodation-section and add image
  const accCardPattern = /<article class="eat-card">\s*<h3 class="eat-card-name">([^<]+)<\/h3>\s*<div class="eat-card-type">([^•<]+)/g;

  // Find accommodation section
  const accSectionStart = content.indexOf('<!-- Accommodation -->');
  const accSectionEnd = content.indexOf('<!-- Laptop-Friendly Cafes -->');

  if (accSectionStart !== -1 && accSectionEnd !== -1) {
    let accSection = content.substring(accSectionStart, accSectionEnd);

    // Update each accommodation card
    accSection = accSection.replace(
      /<article class="eat-card">\s*<h3 class="eat-card-name">([^<]+)<\/h3>\s*<div class="eat-card-type">([^<]+)<\/div>/g,
      (match, name, typePrice) => {
        const type = typePrice.split('•')[0].trim();
        const image = getAccommodationImage(name, type);
        return `<article class="eat-card">
            <img src="${image}" alt="${name}" class="eat-card-image">
            <h3 class="eat-card-name">${name}</h3>
            <div class="eat-card-type">${typePrice}</div>`;
      }
    );

    content = content.substring(0, accSectionStart) + accSection + content.substring(accSectionEnd);
  }

  // 3. Update cafe cards to include images
  const cafeSectionStart = content.indexOf('<!-- Laptop-Friendly Cafes -->');
  const cafeSectionEnd = content.indexOf('</section>', cafeSectionStart + 100);

  if (cafeSectionStart !== -1 && cafeSectionEnd !== -1) {
    // Find the actual end of the cafe section
    let nextSectionStart = content.indexOf('<!-- ', cafeSectionStart + 30);
    if (nextSectionStart === -1) nextSectionStart = content.length;

    let cafeSection = content.substring(cafeSectionStart, nextSectionStart);

    // Update each cafe card
    cafeSection = cafeSection.replace(
      /<article class="eat-card">\s*<h3 class="eat-card-name">([^<]+)<\/h3>\s*<div class="eat-card-type">([^<]+)<\/div>/g,
      (match, name, type) => {
        const image = getCafeImage(name);
        return `<article class="eat-card">
            <img src="${image}" alt="${name}" class="eat-card-image">
            <h3 class="eat-card-name">${name}</h3>
            <div class="eat-card-type">${type}</div>`;
      }
    );

    content = content.substring(0, cafeSectionStart) + cafeSection + content.substring(nextSectionStart);
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages`);
console.log('- Removed duplicate "Where to Stay" sections');
console.log('- Added images to accommodation cards');
console.log('- Added images to cafe cards');

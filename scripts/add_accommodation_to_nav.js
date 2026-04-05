/**
 * Add Accommodation link to navigation in all city pages
 */

const fs = require('fs');
const path = require('path');

const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let skippedCount = 0;

cityFiles.forEach(filename => {
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Skip if already has accommodation link in nav
  if (content.includes('accommodation.html" class="nav-link"') || content.includes('accommodation.html" class="nav-mobile-link"')) {
    skippedCount++;
    return;
  }

  // Add accommodation link to desktop nav (after rentals, before blog)
  content = content.replace(
    /(<li><a href="\.\.\/rentals\.html" class="nav-link">Rentals<\/a><\/li>\s*)(<li><a href="\.\.\/blog\.html" class="nav-link">Blog<\/a><\/li>)/,
    '$1<li><a href="../accommodation.html" class="nav-link">Accommodation</a></li>\n        $2'
  );

  // Add accommodation link to mobile nav (after rentals, before blog)
  content = content.replace(
    /(<li><a href="\.\.\/rentals\.html" class="nav-mobile-link">Rentals<\/a><\/li>\s*)(<li><a href="\.\.\/blog\.html" class="nav-mobile-link">Blog<\/a><\/li>)/,
    '$1<li><a href="../accommodation.html" class="nav-mobile-link">Accommodation</a></li>\n      $2'
  );

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages with Accommodation link`);
console.log(`Skipped ${skippedCount} city pages (already have link)`);

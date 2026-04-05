/**
 * Remove Accommodation link from navigation in all files
 */

const fs = require('fs');
const path = require('path');

// Files to update
const mainFiles = [
  'index.html',
  'cities.html',
  'wheel.html',
  'rentals.html',
  'blog.html',
  'components/nav.html',
  'blog/digital-nomad-guide-lisbon.html'
];

const rootDir = path.join(__dirname, '..');

// Update main files
mainFiles.forEach(file => {
  const filepath = path.join(rootDir, file);
  if (!fs.existsSync(filepath)) return;

  let content = fs.readFileSync(filepath, 'utf-8');

  // Remove accommodation link patterns
  content = content.replace(/\s*<li><a href="accommodation\.html" class="nav-link">Accommodation<\/a><\/li>/g, '');
  content = content.replace(/\s*<li><a href="accommodation\.html" class="nav-mobile-link">Accommodation<\/a><\/li>/g, '');
  content = content.replace(/\s*<a href="accommodation\.html" class="nav-link">Accommodation<\/a>/g, '');
  content = content.replace(/\s*<a href="\.\.\/accommodation\.html" class="nav-link">Accommodation<\/a>/g, '');

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`Updated: ${file}`);
});

// Update city files
const citiesDir = path.join(rootDir, 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

cityFiles.forEach(filename => {
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  content = content.replace(/\s*<li><a href="\.\.\/accommodation\.html" class="nav-link">Accommodation<\/a><\/li>/g, '');
  content = content.replace(/\s*<li><a href="\.\.\/accommodation\.html" class="nav-mobile-link">Accommodation<\/a><\/li>/g, '');

  fs.writeFileSync(filepath, content, 'utf-8');
});

console.log(`Updated ${cityFiles.length} city pages`);
console.log('Done removing Accommodation from navigation');

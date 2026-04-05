/**
 * Add Blog link to navigation in all city pages
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

  // Skip if already has blog link in nav (not footer)
  if (content.includes('blog.html" class="nav-link"') || content.includes('blog.html" class="nav-mobile-link"')) {
    skippedCount++;
    return;
  }

  // Add blog link to desktop nav (after rentals)
  const desktopPattern = /(<li><a href="\.\.\/rentals\.html" class="nav-link">Rentals<\/a><\/li>\s*)<\/ul>/;
  if (desktopPattern.test(content)) {
    content = content.replace(desktopPattern, '$1<li><a href="../blog.html" class="nav-link">Blog</a></li>\n      </ul>');
  }

  // Add blog link to mobile nav (after rentals)
  const mobilePattern = /(<li><a href="\.\.\/rentals\.html" class="nav-mobile-link">Rentals<\/a><\/li>\s*)<\/ul>/;
  if (mobilePattern.test(content)) {
    content = content.replace(mobilePattern, '$1<li><a href="../blog.html" class="nav-mobile-link">Blog</a></li>\n      </ul>');
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} city pages with Blog link`);
console.log(`Skipped ${skippedCount} city pages (already have Blog link)`);

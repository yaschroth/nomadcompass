/**
 * Syncs the /cities hub (cities.html) preview-tile images to the same
 * vision-verified photo used on each city's hero. For every city that has a
 * self-hosted images/cities/<slug>-card.webp (i.e. it's been enhanced), this
 * repoints that city's static card <img src> to /images/cities/<slug>-card.webp.
 * Idempotent. Run after image batches (or at bundle time) so the tiles match.
 * Usage: node scripts/apply_card_images.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'cities');
const HUB = path.join(ROOT, 'cities.html');

let s = fs.readFileSync(HUB, 'utf8');
const slugs = fs.readdirSync(OUT).filter((f) => /-card\.webp$/.test(f)).map((f) => f.replace(/-card\.webp$/, ''));
let updated = 0, notfound = 0;
for (const slug of slugs) {
  // within a card article: data-slug="<slug>" ... <img src="OLD" ... class="city-card-image"
  const re = new RegExp('(data-slug="' + slug + '"[\\s\\S]{0,800}?<img src=")[^"]*("[^>]*class="city-card-image")');
  if (re.test(s)) {
    s = s.replace(re, (m, a, b) => a + '/images/cities/' + slug + '-card.webp' + b);
    updated++;
  } else {
    notfound++;
  }
}
fs.writeFileSync(HUB, s);
console.log('cities.html tiles synced to verified card images: ' + updated + ' | card present but tile not found: ' + notfound);

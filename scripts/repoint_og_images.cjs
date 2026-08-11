require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Repoints each city page's social image (og:image + twitter:image) from the raw hero
 * webp to the branded 1200x630 JPG share card, and adds og:image dimensions/type/alt.
 * Leaves the JSON-LD "image" (hero, better for Google Images) and the on-page hero <img>
 * untouched. Idempotent. Usage: node scripts/repoint_og_images.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');
const BASE = 'https://thenomadhq.com/images';

let changed = 0, skipped = 0, nocard = 0;
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  const slug = file.replace(/\.html$/, '');
  if (!fs.existsSync(path.join(ROOT, 'images', 'og', slug + '.jpg'))) { nocard++; continue; }
  let s = fs.readFileSync(path.join(DIR, file), 'utf8');
  const orig = s;
  const webp = `${BASE}/cities/${slug}.webp`;
  const jpg = `${BASE}/og/${slug}.jpg`;

  // og:image -> jpg (only the og:image meta, not JSON-LD or hero)
  s = s.replace(
    new RegExp('(<meta property="og:image" content=")' + webp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(">)'),
    `$1${jpg}$2`
  );
  // twitter:image -> jpg
  s = s.replace(
    new RegExp('(<meta name="twitter:image" content=")' + webp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(">)'),
    `$1${jpg}$2`
  );
  // add og:image:width/height/type/alt right after og:image (once)
  if (!/og:image:width/.test(s)) {
    s = s.replace(
      new RegExp('(<meta property="og:image" content="' + jpg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">)'),
      `$1\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:type" content="image/jpeg">`
    );
  }

  if (s !== orig) { fs.writeFileSync(path.join(DIR, file), s); changed++; }
  else skipped++;
}
console.log(`OG repoint: ${changed} updated, ${skipped} unchanged, ${nocard} missing card`);

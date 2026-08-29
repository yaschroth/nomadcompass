require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Removes the generator's invented accommodation and coworking cards from any city page whose
 * venue grid has never been filled with researched data.
 *
 * generate_city_pages.js scaffolds both sections with placeholders, and they are not vague
 * placeholders. They are fabrications: an invented property name built from the city name
 * ("Sokcho Central Flat"), a stock photograph from Unsplash of somewhere else entirely, a price
 * that is not a price, and href="#" as the booking link. All 710 established pages had these
 * replaced by apply_city_venues.cjs with real, named, verified venues, and carry a data-venues="v1"
 * stamp to prove it. A batch of 30 new cities arrived carrying 180 fabricated cards, 270 stock
 * photographs and 270 dead links between them.
 *
 * The site's own standing rule is that nothing is synthesised, and a fabricated venue is a worse
 * breach of it than a synthesised rating: it names a business that does not exist. So the cards go.
 * A section that says we have nothing yet is honest; a section filled with inventions is not.
 * What replaces them is a short note and a link to the neighbourhoods section above, which is real.
 *
 * A page is only touched when its grid lacks the researched-data stamp, so this can never remove a
 * real venue. Run it after generate_city_pages.js and before apply_city_venues.cjs, which will
 * overwrite the note with real cards for any city that later gets researched.
 *
 * Usage: node scripts/strip_placeholder_venues.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const DIR = path.join(ROOT, 'cities');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const NAME = Object.fromEntries(CITIES.map((c) => [c.id, c.name]));

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The honest stand-in, one per section. */
const note = (city, kind) => {
  const what = kind === 'stay' ? 'specific places to stay'
    : kind === 'eat' ? 'specific places to eat'
      : 'specific coworking spaces';
  const where = kind === 'stay'
    ? 'The neighbourhood guide above says which parts of the city to look in, which is the more useful half of the answer anyway.'
    : kind === 'eat'
      ? 'The guide sections above cover what eating in ' + esc(city) + ' costs and what the city is known for.'
      : 'The guide sections above cover what working from ' + esc(city) + ' is actually like, including connection speeds and cafe culture.';
  return `<div class="venue-none">
          <p>We have not yet verified ${what} in ${esc(city)}. When we list one it will name the source we checked it against, the same as every other figure on this page, and until then we would rather show nothing than a name we have not confirmed. ${where}</p>
        </div>`;
};

const CSS = `<style>
      .venue-none { max-width: 68ch; margin: 0; padding: 1rem 1.15rem; border-radius: 10px;
        background: var(--color-sand, #f4efe4); border: 1px solid var(--color-sand-dark, #e3d9c6); }
      .venue-none p { margin: 0; font-size: var(--text-sm, .9rem); line-height: 1.65; color: var(--color-charcoal, #3d3833); }
    </style>`;

let touched = 0;
let cardsRemoved = 0;
let skippedReal = 0;
const failed = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  const slug = file.replace(/\.html$/, '');
  const abs = path.join(DIR, file);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const city = NAME[slug] || slug;

  // Every affiliate grid on the page. A grid carrying the researched stamp is left alone.
  const grids = [...html.matchAll(/<div class="affiliate-grid"([^>]*)>([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/g)];
  if (!grids.length) continue;

  let n = 0;
  for (const g of grids) {
    const attrs = g[1];
    const inner = g[2];
    if (/data-venues="v1"/.test(attrs)) { skippedReal++; continue; }
    const stay = (inner.match(/class="stay-card"/g) || []).length;
    const cw = (inner.match(/class="cowork-card"/g) || []).length;
    // The eat section is scaffolded the same way, with names as generic as "Local Market" and
    // "Traditional Restaurant" over a stock photograph of somewhere else entirely.
    const eat = (inner.match(/class="eat-card"/g) || []).length;
    if (!stay && !cw && !eat) continue;
    const kind = (eat > stay && eat > cw) ? 'eat' : (cw > stay ? 'cowork' : 'stay');
    n += stay + cw + eat;
    html = html.replace(g[0], '<div class="affiliate-grid" data-venues="none">\n        '
      + note(city, kind) + '\n        </div>\n      </div>\n    </section>');
  }
  if (!n) continue;

  if (!html.includes('.venue-none {')) html = html.replace(/<\/head>/i, '  ' + CSS + '\n</head>');

  if (html === before) { failed.push(slug); continue; }
  if (!DRY) fs.writeFileSync(abs, html);
  touched++;
  cardsRemoved += n;
}

console.log('Placeholder venues: ' + cardsRemoved + ' fabricated card(s) removed from ' + touched
  + ' page(s); ' + skippedReal + ' researched grid(s) left untouched'
  + (DRY ? '  [dry run]' : ''));
if (failed.length) console.log('  could not rewrite: ' + failed.join(', '));

/**
 * PILOT: appends researched long-form guide content to 3 city pages, AFTER the
 * original neighborhoods section (which has the interactive map + unique cards,
 * kept intact). Drops the redundant "Best Neighborhoods" text from the guide.
 * Content staged as guide-<slug>.html in the dir passed as argv[2].
 * Replacement FUNCTION (content has $ prices). Usage:
 *   node scripts/apply_city_guide_pilot.cjs "<scratchpad-dir>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const MAP = { lisbon: 'guide-lisbon.html', medellin: 'guide-medellin.html', tbilisi: 'guide-tbilisi.html' };
// keep the neighborhoods section (map + cards); capture it so we can append after it
const NEIGH = /<section class="neighborhoods-section"[^>]*>[\s\S]*?<\/section>/;

let done = 0;
for (const [slug, file] of Object.entries(MAP)) {
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('MISSING page:', slug); continue; }
  let content = fs.readFileSync(path.join(DIR, file), 'utf8').trim();
  // drop the redundant text "Best Neighborhoods" section (map + cards cover it)
  content = content.replace(/<h2>Best Neighborhoods for Remote Workers<\/h2>[\s\S]*?(?=<h2>Where to Work)/, '').trim();
  const wrapped = `\n\n    <section class="city-guide" id="guide">\n      <div class="container">\n${content}\n      </div>\n    </section>`;
  let s = fs.readFileSync(page, 'utf8');
  if (/class="city-guide"/.test(s)) { console.log('already has guide:', slug); continue; }
  if (!NEIGH.test(s)) { console.error('NO neighborhoods-section:', slug); continue; }
  s = s.replace(NEIGH, (m) => m + wrapped); // keep the map section, append guide after it
  fs.writeFileSync(page, s);
  done++;
}
console.log('Guides appended (map kept):', done);

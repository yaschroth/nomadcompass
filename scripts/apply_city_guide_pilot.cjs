/**
 * PILOT: inserts researched, long-form guide content into 3 city pages, replacing
 * the thin templated "neighborhoods-section". Content staged as guide-<slug>.html
 * in the dir passed as argv[2]. Uses a replacement FUNCTION (content has $ prices).
 * Usage: node scripts/apply_city_guide_pilot.cjs "<scratchpad-dir>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const MAP = { lisbon: 'guide-lisbon.html', medellin: 'guide-medellin.html', tbilisi: 'guide-tbilisi.html' };
const RE = /<section class="neighborhoods-section"[^>]*>[\s\S]*?<\/section>/;

let done = 0;
for (const [slug, file] of Object.entries(MAP)) {
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('MISSING page:', slug); continue; }
  const content = fs.readFileSync(path.join(DIR, file), 'utf8').trim();
  const wrapped = `    <section class="city-guide" id="guide">\n      <div class="container">\n${content}\n      </div>\n    </section>`;
  let s = fs.readFileSync(page, 'utf8');
  if (/class="city-guide"/.test(s)) { console.log('already has guide:', slug); continue; }
  if (!RE.test(s)) { console.error('NO neighborhoods-section:', slug); continue; }
  s = s.replace(RE, () => wrapped);
  fs.writeFileSync(page, s);
  done++;
}
console.log('Guides inserted:', done);

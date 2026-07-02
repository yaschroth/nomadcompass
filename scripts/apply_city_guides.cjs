/**
 * Inserts researched deep-dive guides into city pages. Reads guide-<slug>.html
 * files from the dir passed as argv[2], and for each appends the content as a
 * .city-guide section AFTER the neighborhoods map section (kept intact).
 * Safety: strips code fences, drops any "Best Neighborhoods" (map covers it),
 * strips em-dashes. Idempotent (skips pages that already have a guide).
 * Usage: node scripts/apply_city_guides.cjs "<guides-dir>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const NEIGH = /<section class="neighborhoods-section"[^>]*>[\s\S]*?<\/section>/;
const stripDash = (s) => s.replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ').replace(/,[ \t]*,/g, ', ');

let ins = 0, skip = 0, fail = 0;
for (const file of fs.readdirSync(DIR).filter((f) => /^guide-.+\.html$/.test(f))) {
  const slug = file.replace(/^guide-/, '').replace(/\.html$/, '');
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); fail++; continue; }
  let s = fs.readFileSync(page, 'utf8');
  if (/class="city-guide"/.test(s)) { skip++; continue; }
  if (!NEIGH.test(s)) { console.error('NO NEIGHBORHOODS SECTION:', slug); fail++; continue; }
  let content = fs.readFileSync(path.join(DIR, file), 'utf8').trim();
  content = content.replace(/```html?\s*/gi, '').replace(/```/g, '').trim(); // strip accidental fences
  content = content.replace(/<h2>\s*Best Neighborhoods[\s\S]*?(?=<h2>|$)/i, '').trim(); // map covers neighborhoods
  content = stripDash(content);
  if (!/^<h2[ >]/.test(content)) { console.error('BAD CONTENT (no leading <h2>):', slug); fail++; continue; }
  const wrapped = `\n\n    <section class="city-guide" id="guide">\n      <div class="container">\n${content}\n      </div>\n    </section>`;
  s = s.replace(NEIGH, (m) => m + wrapped);
  fs.writeFileSync(page, s);
  ins++;
}
console.log(`inserted: ${ins} | skipped (already had guide): ${skip} | failed: ${fail}`);

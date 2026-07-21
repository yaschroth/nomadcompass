/**
 * One-off/idempotent cleanup: replaces the auto-generated score blurb on new-city base pages
 * ("<City> excels in X. Areas for consideration include Y. Overall, it offers a ... environment
 * for remote workers.") with the same tagline-based description the enhanced cities use:
 * "Setting Up as a Nomad in <City>" + the city tagline. Only touches pages that still contain
 * the boilerplate phrase, so it is safe to re-run. Usage: node scripts/fix_score_description.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const s = {};
vm.createContext(s);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + '\n;globalThis.__c=CITIES;', s);
const BY = {};
s.__c.forEach((c) => { if (c && c.id) BY[c.id] = c; });

const esc = (t) => String(t == null ? '' : t).replace(/&(?!amp;|#039;|quot;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BLOCK = /<div class="score-description">[\s\S]*?<\/div>/;

let fixed = 0, skip = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html') && x !== 'index.html')) {
  const fp = path.join(ROOT, 'cities', f);
  let html = fs.readFileSync(fp, 'utf8');
  if (!/environment for remote workers/.test(html)) { skip++; continue; }
  const city = BY[f.replace(/\.html$/, '')];
  if (!city) { console.error('NO CITY DATA:', f); continue; }
  const block = `<div class="score-description">
            <h2>Setting Up as a Nomad in ${esc(city.name)}</h2>
            <p>${esc(city.tagline)}</p>
          </div>`;
  if (!BLOCK.test(html)) { console.error('NO SCORE-DESCRIPTION BLOCK:', f); continue; }
  html = html.replace(BLOCK, block);
  fs.writeFileSync(fp, html);
  fixed++;
}
console.log(`Score description: fixed ${fixed} | untouched ${skip}`);

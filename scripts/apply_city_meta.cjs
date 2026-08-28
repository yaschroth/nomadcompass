require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * The meta description (and twitter:description) on every city page.
 *
 * This used to build one sentence: "Is X good for digital nomads? Nomad Score N/10 - cost of
 * living in USD, WiFi, safety, visas, neighborhoods and coworking, all in one guide." It was
 * written for CTR and it did not work. All 710 descriptions collapsed to two real strings, and
 * Search Console for the 30 days to 2026-08-27 put 412 pages at position 5-10 on a 1.6% CTR
 * against a 3-6% norm: the pages rank and the snippet gives nobody a reason to pick them.
 *
 * The sentence now comes from scripts/lib/city_snippet.cjs, which composes it out of the cost, the
 * two scores this city is unusual for, an honest weakness and its real monthly temperatures. The
 * Nomad Score is gone from it: it is tier editorial in data/provenance.json, it is the one figure
 * a reader cannot check, and it was the only thing the old sentence offered.
 *
 * Re-runnable (replaces the tag content each time).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname.includes('scripts') ? path.join(__dirname, '..') : 'c:/Users/yasch/Coding Projects/Website Projects/nomadcompass');
const m = {}; eval(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8').replace(/const CITIES/, 'm.CITIES'));
const byId = {}; for (const c of m.CITIES) if (c && c.id) byId[c.id] = c;
const APPLY = process.env.APPLY === '1';
const S = require(path.join(__dirname, 'lib', 'city_snippet.cjs'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dir = path.join(ROOT, 'cities');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let done = 0, skip = 0; const samples = [];
for (const f of files) {
  const city = byId[f.replace('.html', '')];
  if (!city || !city.scores) { skip++; continue; }
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8'); const before = s;
  const desc = S.description(city);
  const e = esc(desc);
  s = s.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e}">`);
  s = s.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${e}">`);
  if (s !== before) { if (APPLY) fs.writeFileSync(p, s); done++; if (samples.length < 4) samples.push(desc.length + ' chars | ' + desc); }
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | updated: ' + done + ' | skipped(no scores): ' + skip + ' | total: ' + files.length);
samples.forEach(x => console.log('  ' + x));

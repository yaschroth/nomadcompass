require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Keeps every place a city page prints one of its category scores in step with cities-data.js.
 *
 * The score bars and the Nomad Score render from cities-data.js at runtime, but four things were
 * baked into the HTML when each page was generated and nothing refreshed them:
 *   - the hero quick-stats "Safety Score n/10" and "WiFi Score n/10";
 *   - the FAQ answers "<City> scores n out of 10 for safety in our ratings, which is <word>" and
 *     "<City> rates n out of 10 for WiFi in our scoring, so ... <word>", visible and in FAQ JSON-LD.
 * On 2026-09-29 24 safety scores were corrected against official crime data and the pages would
 * have gone on printing the old number (St John's "9 out of 10 ... excellent") beside a bar showing 8.
 *
 * The describing word uses the same thresholds as the generators (apply_city_seo.cjs,
 * de_templatize_cities.cjs), so a rebuilt page and a swept page read the same. Idempotent.
 * Usage: node scripts/apply_score_mentions.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sb = {};
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + '\n;globalThis.__c=CITIES;', sb);
const byId = new Map(sb.__c.map((c) => [c.id, c]));

const qual = (s) => (s >= 8 ? 'excellent' : s >= 6.5 ? 'good' : s >= 5 ? 'average' : 'on the limited side');
const WORD = '(excellent|good|average|on the limited side)';

let pages = 0, edits = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const c = byId.get(f.replace(/\.html$/, ''));
  if (!c || !c.scores) continue;
  const p = path.join(ROOT, 'cities', f);
  const s = fs.readFileSync(p, 'utf8');
  const { safety, wifi } = c.scores;
  let out = s;
  const swap = (re, fn) => { out = out.replace(re, (...m) => { const r = fn(...m); if (r !== m[0]) edits++; return r; }); };
  swap(/(<div class="quick-stat-value">)[^<]*(<\/div>\s*<div class="quick-stat-label">Safety Score<\/div>)/g,
    (m, a, b) => a + safety + '/10' + b);
  swap(/(<div class="quick-stat-value">)[^<]*(<\/div>\s*<div class="quick-stat-label">WiFi Score<\/div>)/g,
    (m, a, b) => a + wifi + '/10' + b);
  swap(new RegExp('(\\b(?:scores|rates) )\\d+(?:\\.\\d)?( out of 10 for safety in our ratings, which is )' + WORD, 'g'),
    (m, a, b) => a + safety + b + qual(safety));
  swap(new RegExp('(\\brates )\\d+(?:\\.\\d)?( out of 10 for WiFi in our scoring, so connectivity is )' + WORD, 'g'),
    (m, a, b) => a + wifi + b + qual(wifi));
  swap(new RegExp('(\\brates )\\d+(?:\\.\\d)?( out of 10 for WiFi in our scoring, so it handles video calls and daily remote work )' + WORD, 'g'),
    (m, a, b) => a + wifi + b + qual(wifi));
  if (out !== s) { pages++; if (APPLY) fs.writeFileSync(p, out); }
}
console.log(`score mentions: ${edits} updated on ${pages} pages${APPLY ? '' : ' (dry run, --apply to write)'}`);

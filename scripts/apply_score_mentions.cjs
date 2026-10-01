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

// Two generators wrote these sentences with two different word scales, and each sentence shape must
// keep its own: apply_city_seo.cjs says average / on the limited side, de_templatize_cities.cjs says
// workable / patchy. Using one scale for both printed "handles daily remote work average".
const qualSeo = (s) => (s >= 8 ? 'excellent' : s >= 6.5 ? 'good' : s >= 5 ? 'average' : 'on the limited side');
const qualDt = (s) => (s >= 8 ? 'excellent' : s >= 6.5 ? 'good' : s >= 5 ? 'workable' : 'patchy');
const WORD = '(excellent|good|average|on the limited side|workable|patchy)';
const N = '\\d+(?:\\.\\d)?';

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
  // apply_city_seo.cjs shapes
  swap(new RegExp('(\\b(?:scores|rates) )' + N + '( out of 10 for safety in our ratings, which is )' + WORD + '( for solo travelers)', 'g'),
    (m, a, b, w, t) => a + safety + b + qualSeo(safety) + t);
  swap(new RegExp('(\\brates )' + N + '( out of 10 for WiFi in our scoring, so connectivity is )' + WORD, 'g'),
    (m, a, b) => a + wifi + b + qualSeo(wifi));
  // de_templatize_cities.cjs shapes
  swap(new RegExp('(\\b(?:scores|rates) )' + N + '( out of 10 for safety in our ratings, which is )' + WORD + '( for solo travel and)', 'g'),
    (m, a, b, w, t) => a + safety + b + qualDt(safety) + t);
  swap(new RegExp('(\\brates )' + N + '( out of 10 for WiFi in our scoring, so it handles video calls and daily remote work )' + WORD, 'g'),
    (m, a, b) => a + wifi + b + qualDt(wifi));
  swap(new RegExp('(With a WiFi score of )' + N + '(/10, connectivity in [^<"]{1,60}? is )' + WORD + '( for calls)', 'g'),
    (m, a, b, w, t) => a + wifi + b + qualDt(wifi) + t);
  swap(new RegExp('(Our safety score for [^<"]{1,60}? is )' + N + '(/10, )' + WORD + '( for nomads)', 'g'),
    (m, a, b, w, t) => a + safety + b + qualDt(safety) + t);
  if (out !== s) { pages++; if (APPLY) fs.writeFileSync(p, out); }
}
console.log(`score mentions: ${edits} updated on ${pages} pages${APPLY ? '' : ' (dry run, --apply to write)'}`);

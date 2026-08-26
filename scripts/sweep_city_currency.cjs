require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts the city score notes into USD, which is the house rule for every price on the site.
 *
 * scripts/check_prose_style.cjs was written to enforce that rule and had a hole in it. It matched
 * currency SYMBOLS and currency WORDS ("euros", "baht") but not ISO codes, so "800-1,200 EUR" and
 * "80,000 THB" sailed through a gate that reported the site clean. 1,108 amounts on 276 city pages.
 * Fixing the sweep without also closing the gate would just let it grow back, so the gate learns
 * these codes in the same pass.
 *
 * Two shapes, handled differently:
 *
 *   with a gloss     "800-1,200 EUR (about 870-1,300 USD)"  -> the parenthetical is dropped
 *   without a gloss  "NOK 12,000-15,000 per month"          -> converted outright
 *
 * In both cases the number that survives is a fresh conversion, not the gloss the author typed.
 * The glosses are stale: most were written when EUR/USD sat at 1.09 and it is 1.167 today, so
 * keeping them would bake an 8% error into the figure a reader budgets against. That is also why
 * the rate is read from a fetched file rather than a constant in this script, and why the rate and
 * its date get printed on every run: a hardcoded rate is exactly how the glosses went stale.
 *
 * Rounding follows the rest of the site: nearest 10 above 1,000, nearest 5 above 100, nearest whole
 * unit above 10, nearest half below that. The original connector is kept, so a range written "1,100
 * to 1,600" stays "$795 to $1,160" and one written with a dash stays dashed.
 *
 * Usage:
 *   node scripts/sweep_city_currency.cjs <rates.json> [--apply]
 *
 * rates.json is an open.er-api.com response: { "result": "success", "rates": { "EUR": 0.8569, ... } }
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
// assets/fx-usd.json is the site's own rate file. The Cost Index converts with it and the
// provenance line under each cost table names the rate and the date it was taken. Converting prose
// with anything else would put a page at odds with the rate it prints on itself.
const ratesPath = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : path.join(ROOT, 'assets', 'fx-usd.json');
const feed = JSON.parse(fs.readFileSync(ratesPath, 'utf8'));
if (feed.result !== 'success' || !feed.rates) {
  console.error('rates file is not a successful er-api response'); process.exit(1);
}
const RATES = feed.rates;

const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];

const { makeConverter } = require(require('path').join(__dirname, 'lib', 'to_usd.cjs'));
const { convert, dropped, kept, unresolved } = makeConverter(RATES);

// The yen sign is written for both the Japanese yen and the Chinese yuan, and at 159 to the dollar
// against 7 the difference is not a rounding matter. Resolve it from the city's own country.
const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const arr = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
let depth = 0;
let end = -1;
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === '[') depth += 1;
  else if (arr[i] === ']') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const COUNTRY = new Map(eval(arr.slice(0, end)).map((c) => [c.id, c.country]));
const yenFor = (id) => {
  const c = COUNTRY.get(id);
  if (c === 'Japan') return 'JPY';
  if (c === 'China') return 'CNY';
  return null;
};

let pagesTouched = 0;
let amounts = 0;
const samples = [];
// --only lisbon,mostar prints those pages in full instead of the usual truncated sample
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > -1 && process.argv[onlyArg + 1] ? process.argv[onlyArg + 1].split(',') : [];

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  const i = html.lastIndexOf('{"climate"');
  if (i < 0) continue;
  const j = html.indexOf('};', i);
  let notes;
  try { notes = JSON.parse(html.slice(i, j + 1)); } catch (e) { continue; }

  // Copy first: rebuilding from KEYS alone would silently drop any other key on the object.
  const next = Object.assign({}, notes);
  let touched = 0;
  for (const k of KEYS) {
    if (typeof notes[k] !== 'string') continue;
    const r = convert(notes[k], yenFor(f.replace('.html', '')));
    if (!r.hits) continue;
    touched += r.hits;
    next[k] = r.text;
    const full = ONLY.includes(f.replace('.html', ''));
    if (full || samples.length < 10) {
      const cut = full ? 4000 : 132;
      samples.push('  ' + f.replace('.html', '') + '.' + k
        + '\n    was  ' + notes[k].slice(0, cut) + '\n    now  ' + r.text.slice(0, cut));
    }
  }
  if (!touched) continue;
  pagesTouched += 1;
  amounts += touched;

  if (!APPLY) continue;
  const out = html.slice(0, i) + JSON.stringify(next) + html.slice(j + 1);
  const bad = [...out.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .some((s) => { try { new Function(s[1]); return false; } catch (e) { return true; } });
  if (bad) { console.error('  SKIP ' + f + ': result would not parse as JavaScript'); continue; }
  fs.writeFileSync(p, out);
}

// The pages are what a reader sees, but data/category-descriptions.json is what generate_city_pages
// READS to write them. Sweeping only the pages would leave the local currencies loaded in the
// generator, ready to come back the next time any city is rebuilt.
const dataPath = path.join(ROOT, 'data', 'category-descriptions.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let dataEntries = 0;
let dataAmounts = 0;
for (const id of Object.keys(data)) {
  const entry = data[id];
  if (!entry || typeof entry !== 'object') continue;
  let touched = 0;
  for (const k of KEYS) {
    if (typeof entry[k] !== 'string') continue;
    const r = convert(entry[k], yenFor(id));
    if (!r.hits) continue;
    if (ONLY.includes(id)) {
      samples.push('  data ' + id + '.' + k + '\n    was  ' + entry[k] + '\n    now  ' + r.text);
    }
    touched += r.hits;
    entry[k] = r.text;
  }
  if (!touched) continue;
  dataEntries += 1;
  dataAmounts += touched;
}
if (APPLY && dataAmounts) fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');

console.log('rates ' + (feed.time_last_update_utc || 'unknown') + '    1 EUR = $' + (1 / RATES.EUR).toFixed(3));
console.log(amounts + ' amounts converted to USD across ' + pagesTouched + ' city pages');
console.log(dataAmounts + ' amounts across ' + dataEntries + ' entries in data/category-descriptions.json');
if (unresolved.size) console.log('  no rate for ' + [...unresolved].join(', ') + ', left alone');
console.log('');
samples.forEach((s) => console.log(s));
// --glosses lists every parenthetical the sweep would delete, and every one it decided to leave
// alone. Worth eyeballing before an --apply: deleting a parenthetical is the one edit here that
// can lose information rather than just restate it.
if (process.argv.includes('--glosses')) {
  console.log('\nDROPPED as duplicate (' + dropped.size + ' distinct):');
  [...dropped].sort().forEach((x) => console.log('   (' + x + ')'));
  console.log('\nKEPT, not pure money (' + kept.size + ' distinct):');
  [...kept].sort().forEach((x) => console.log('   (' + x + ')'));
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

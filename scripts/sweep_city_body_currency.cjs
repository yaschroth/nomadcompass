require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts the guide-section prose on the city pages into USD.
 *
 * sweep_city_currency.cjs did the score-notes object and the generator's data file. That was not the
 * whole of it: the seven prose sections, the coworking venue blurbs and the restaurant cards carry
 * roughly 4,900 more local-currency prices across 398 pages. The prose gate never saw them because
 * it reads the notes object and the data file and nothing else, so "clean" meant clean in the two
 * places it happened to look.
 *
 * Deliberately NOT touched:
 *
 *   span.cost-line-val   the Numbeo table renders "$1,960" with a small "AED 7,201" beside it. That
 *                        is a designed two-currency row, not prose that drifted, so it is a decision
 *                        for the site owner rather than something a sweep should quietly delete.
 *   p.cost-src           "converted to USD at $1 = AED3.67 (01 Aug 2026)" is the provenance line. The
 *                        rate is the method, not a price, and removing it would break the source rule.
 *   script, style        the notes blob lives in a script and is already converted; nothing else in
 *                        there is prose.
 *   tag attributes       nothing matched inside one, and a text-level rewrite must not start.
 *
 * Usage:
 *   node scripts/sweep_city_body_currency.cjs <rates.json> [--apply] [--names]
 *
 * --names lists sentences that still mention a currency by name after conversion ("all in euros"),
 * which the arithmetic cannot fix and a person has to read.
 */
const fs = require('fs');
const path = require('path');
const { makeConverter, mapTextNodes } = require(path.join(__dirname, 'lib', 'to_usd.cjs'));

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
const { convert, rateTalk } = makeConverter(feed.rates, { html: true });

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
const yenFor = (id) => (COUNTRY.get(id) === 'Japan' ? 'JPY' : COUNTRY.get(id) === 'China' ? 'CNY' : null);

// A currency written as a word, which arithmetic cannot repair: converting the number in "around
// EUR 900, all in euros" leaves the second half saying something the first half no longer does.
const NAME = /\b(euros?|pounds sterling|yuan|renminbi|reais|rupees|rupiah|dong|pesos|yen|won|dinars?|dirhams?|tugrik|baht|taka|shillings|kyat|zloty|forint|koruna|lira|rand|ringgit|kwanza|krona|kroner|kuna|leva|lei|forints|francs?)\b/i;

let pages = 0;
let amounts = 0;
const samples = [];
const nameLines = [];
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > -1 && process.argv[onlyArg + 1] ? process.argv[onlyArg + 1].split(',') : [];

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const id = f.replace('.html', '');
  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  const yen = yenFor(id);

  let hits = 0;
  const out = mapTextNodes(html, (text) => {
    if (!/\d/.test(text)) return text;
    const r = convert(text, yen);
    if (!r.hits) return text;
    hits += r.hits;
    if (ONLY.includes(id) || samples.length < 8) {
      samples.push('  ' + id + '\n    was  ' + text.trim().slice(0, 150)
        + '\n    now  ' + r.text.trim().slice(0, 150));
    }
    return r.text;
  });

  // currency words surviving anywhere a reader sees them
  mapTextNodes(out, (text) => {
    if (NAME.test(text)) {
      text.split(/(?<=[.!?])\s+/).forEach((s) => {
        if (NAME.test(s) && /\$|\d/.test(s)) nameLines.push('  ' + id + ': ' + s.trim().slice(0, 150));
      });
    }
    return text;
  });

  if (!hits) continue;
  pages += 1;
  amounts += hits;
  if (APPLY) fs.writeFileSync(p, out);
}

console.log('rates ' + (feed.time_last_update_utc || 'unknown') + '    1 EUR = $' + (1 / feed.rates.EUR).toFixed(3));
console.log(amounts + ' amounts converted in page prose across ' + pages + ' city pages');
console.log(nameLines.length + ' sentences still name a currency in words and need reading by a person');
console.log('');
samples.slice(0, 40).forEach((s) => console.log(s));
console.log([...new Set(rateTalk)].length + ' sentences explain an exchange rate and were left alone');
if (process.argv.includes('--names')) {
  console.log('\nSENTENCES NAMING A CURRENCY (arithmetic cannot fix these):');
  nameLines.forEach((l) => console.log(l));
  console.log('\nSENTENCES EXPLAINING A RATE (skipped, most are now-pointless preambles):');
  [...new Set(rateTalk)].forEach((l) => console.log('  ' + l.slice(0, 160)));
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

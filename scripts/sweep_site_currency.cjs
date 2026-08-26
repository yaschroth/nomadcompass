require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The same USD conversion, for every page that is not a city page.
 *
 * The gate and the two city sweeps covered cities/ and the generator's data file. The rest of the
 * site was never looked at, and it holds 393 more local-currency prices: 657 accommodation detail
 * pages carrying one price each, six blog guides quoting rents in HUF, THB, MXN and EUR, and the
 * /nomad-visas row that describes Croatia's threshold as "About EUR 2,540 a month".
 *
 * The accommodation pages are a special case worth knowing about: create_accommodation_pages.js
 * builds them by lifting the price out of the city page's accommodation section. Those city pages
 * are already converted, so these detail pages are simply stale copies, and converting them here
 * puts them back in agreement with the source they came from.
 *
 * Usage: node scripts/sweep_site_currency.cjs [--apply] [--list]
 */
const fs = require('fs');
const path = require('path');
const { makeConverter, mapTextNodes } = require(path.join(__dirname, 'lib', 'to_usd.cjs'));

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const feed = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'fx-usd.json'), 'utf8'));
const { convert } = makeConverter(feed.rates, { html: true });

// cities/ is done by the two city sweeps; the rest of these hold no reader-facing prose.
const SKIP_TOP = new Set(['cities', 'node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill']);

// The yen sign means JPY or CNY depending on the country, and outside cities/ there is no city
// record to ask. Resolve from the filename, and leave it alone rather than guess.
const yenFor = (rel) => {
  if (/tokyo|osaka|kyoto|fukuoka|japan|hiroshima|sapporo/i.test(rel)) return 'JPY';
  if (/china|shanghai|beijing|shenzhen|chengdu|dali|kunming/i.test(rel)) return 'CNY';
  return null;
};

let files = 0;
let amounts = 0;
const changed = [];

const walk = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if (!rel && SKIP_TOP.has(e.name)) continue;
      walk(p, r);
      continue;
    }
    if (!e.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    let hits = 0;
    const out = mapTextNodes(html, (text) => {
      if (!/\d/.test(text)) return text;
      const res = convert(text, yenFor(r));
      if (!res.hits) return text;
      hits += res.hits;
      if (changed.length < 400) {
        changed.push('  ' + r + '\n    was  ' + text.trim().slice(0, 120)
          + '\n    now  ' + res.text.trim().slice(0, 120));
      }
      return res.text;
    });
    if (!hits) continue;
    files += 1;
    amounts += hits;
    if (APPLY) fs.writeFileSync(p, out);
  }
};
walk(ROOT, '');

console.log('rates ' + feed.time_last_update_utc + '    1 EUR = $' + (1 / feed.rates.EUR).toFixed(3));
console.log(amounts + ' amounts converted across ' + files + ' non-city pages\n');
(process.argv.includes('--list') ? changed : changed.slice(0, 8)).forEach((c) => console.log(c));
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

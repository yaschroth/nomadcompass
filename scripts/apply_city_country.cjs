require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Makes every country LABEL on a city page agree with cities-data.js.
 *
 * The country string is baked into a city page in five places by four different writers, and three
 * of them write once and then skip, so a change to the data never reaches them. Renaming "UK" to
 * "United Kingdom" is what exposed it: after the rename London's title and its Place JSON-LD said
 * United Kingdom while the line under its h1, its flag alt text and its containedInPlace Country
 * still said UK. Nothing looked broken, which is the problem.
 *
 * The five spots, all anchored so this cannot touch prose. "London is the UK's largest city" is
 * correct English and must survive; only a label is rewritten:
 *
 *   <p class="city-hero-country">X</p>          generate_city_pages.js, never re-run over a
 *                                               swept page, so effectively unowned
 *   alt="X flag"                                apply_flag_svgs.cjs, write-once
 *   "@type": "Country", "name": "X"             apply_city_seo.cjs, skipped once BreadcrumbList
 *                                               exists, so write-once in practice
 *   "@type":"Place","name":"<City>, X"          apply_city_scores.cjs (now refreshes)
 *   The practical basics for <City>, X          apply_city_facts.cjs (already refreshes)
 *
 * The last two are covered by their own sweeps and are included anyway: writing the same value
 * twice is free, and a page that has drifted for any other reason gets corrected here too.
 *
 * Pair with the country-names check in check_data_sanity.cjs, which refuses two names for one flag
 * in the data. That gate stops the data drifting; this sweep stops the pages drifting from it.
 *
 * Usage:
 *   node scripts/apply_city_country.cjs           report
 *   node scripts/apply_city_country.cjs --apply   write
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DIR = path.join(ROOT, 'cities');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = new Map(CITIES.map((c) => [c.id, c]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let changed = 0, clean = 0, orphan = 0;
const detail = [];

for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  const c = byId.get(slug);
  if (!c || !c.country) { orphan++; continue; }

  const p = path.join(DIR, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  const country = esc(c.country);
  const name = esc(c.name);
  const hits = [];

  const swap = (label, re, to) => {
    const out = s.replace(re, to);
    if (out !== s) { hits.push(label); s = out; }
  };

  swap('hero', /(<p class="city-hero-country">)[^<]*(<\/p>)/g, `$1${country}$2`);
  swap('flag-alt', /(<img class="flag-img"[^>]*\salt=")[^"]*( flag"[^>]*>)/g, `$1${country}$2`);
  swap('containedInPlace', /("@type":\s*"Country",\s*\n?\s*"name":\s*")[^"]*(")/g, `$1${country}$2`);
  swap('place-ld', new RegExp('("@type":"Place","name":"' + rx(name) + ', )[^"]*(")', 'g'), `$1${country}$2`);
  swap('facts-sub', new RegExp('(The practical basics for ' + rx(name) + ', )[^<]*', 'g'), `$1${country}`);

  if (s === before) { clean++; continue; }
  changed++;
  detail.push(slug + ': ' + hits.join(', '));
  if (APPLY) fs.writeFileSync(p, s);
}

console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | country labels rewritten on ' + changed
  + ' page(s), ' + clean + ' already agreed, ' + orphan + ' page(s) with no city record');
for (const d of detail.slice(0, 20)) console.log('  ' + d);
if (detail.length > 20) console.log('  ... and ' + (detail.length - 20) + ' more');

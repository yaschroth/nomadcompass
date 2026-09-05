require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds an author byline + "Updated" date to every city-page hero (E-E-A-T +
 * freshness + a sitewide link to the author entity). Inserted after the tagline,
 * before the quick-stats grid. Usage: node scripts/apply_city_byline.cjs
 *
 * The date is read from data/city-dates.json, not written in here. It used to be a constant,
 * `<time datetime="2026-07-01">July 2026</time>`, and because this sweep skipped any page that
 * already had a byline the constant could never be corrected once written: it went stale in place
 * on 1000 pages and apply_entity_schema.cjs published it as datePublished and dateModified in the
 * Article JSON-LD. So this now REFRESHES an existing byline rather than leaving it alone, which is
 * the only way a date sweep is any use on the second run. See build_city_dates.cjs for what the
 * two dates mean and where they come from.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const DATES = path.join(ROOT, 'data', 'city-dates.json');
if (!fs.existsSync(DATES)) {
  console.error('data/city-dates.json is missing. Run: node scripts/build_city_dates.cjs');
  process.exit(1);
}
const dates = JSON.parse(fs.readFileSync(DATES, 'utf8')).dates;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const label = (iso) => MONTHS[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4);

// The visible date is the one a reader cares about, so the <time> carries `modified`.
// apply_entity_schema.cjs reads this element, and reads data-published for datePublished.
const byline = (d) =>
  `        <p class="city-hero-byline">By <a href="/about/yannick-schroth">Yannick Schroth</a>`
  + ` &middot; Updated <time datetime="${d.modified}" data-published="${d.published}">`
  + `${label(d.modified)}</time></p>\n`;

const RE = /^[ \t]*<p class="city-hero-byline">[\s\S]*?<\/p>\r?\n/m;

let added = 0, refreshed = 0, unchanged = 0, noDate = 0, noAnchor = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  const d = dates[slug];
  if (!d) { noDate++; continue; }
  const abs = path.join(ROOT, 'cities', f);
  const b = fs.readFileSync(abs, 'utf8');
  const want = byline(d);
  let s;
  if (RE.test(b)) {
    s = b.replace(RE, want);
    if (s === b) { unchanged++; continue; }
    refreshed++;
  } else {
    s = b.replace(/(        <div class="quick-stats-grid">)/, (m) => want + m);
    if (s === b) { noAnchor++; continue; }
    added++;
  }
  fs.writeFileSync(abs, s);
}
console.log(`City bylines: added ${added} | refreshed ${refreshed} | unchanged ${unchanged}`
  + (noDate ? ` | no date entry ${noDate}` : '') + (noAnchor ? ` | no anchor ${noAnchor}` : ''));

require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts a source line under the city-page sections that quote a venue rating.
 *
 * 101 sentences across the city pages state a rating with nothing beside it to say where it came
 * from: "free Wi-Fi rated 9.9", "rated 4.6 stars", "rated 9.5 for location". Some sibling sentences
 * do name a source ("rated 8.5 on Booking", "a 9.2 Booking.com score"), which makes the silent ones
 * read like invention by comparison.
 *
 * They are not invented. data/provenance.json records the venues dataset as triangulated: published
 * Google Maps ratings, geo-checked against OpenStreetMap, retrieved 6 August 2026, gated at 4.0.
 * The sourcing was done and then never shown to the reader, which on a site whose whole claim is
 * that its numbers can be checked is a strange place to stop.
 *
 * So this states it once per section rather than editing 101 sentences. That is the pattern the Cost
 * Index already uses: a <p class="cost-src"> under the table naming Numbeo, the rate and the date.
 *
 * The line repeats the record's own limits rather than rounding them off. Most ratings were read
 * from aggregators mirroring Google rather than from Google, and a handful in two city sets were
 * estimates. A provenance note that overstates its provenance is worse than none.
 *
 * Only sections that actually quote a rating get the line: on most pages that is Where to Stay and
 * Coworking, and not Where to Eat.
 *
 * Idempotent. Usage: node scripts/apply_venue_provenance.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'provenance.json'), 'utf8')).venues;

const NOTE = '<p class="venue-src">Ratings are published Google Maps scores, most read through '
  + 'aggregators that republish them rather than from Google directly, and checked against '
  + 'OpenStreetMap. Retrieved 6 August 2026, so they will have drifted. Venues are listed only at '
  + '4.0 and above; coworking spaces may be listed on confirmed current operation instead. See our '
  + '<a href="/methodology">methodology</a>.</p>';

const RATING = /rate[sd]?\s+\d\.\d|\d\.\d\s*\/\s*5|\b\d[\d,]*\s+reviews?\b/i;
const SECTIONS = ['where-to-stay', 'coworking', 'where-to-eat'];

if (prov.tier !== 'triangulated') {
  console.error('provenance.json no longer calls the venues dataset triangulated; check the note text');
  process.exit(1);
}

let pages = 0;
let notes = 0;
let already = 0;
const bySection = {};

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  let out = html;
  let added = 0;

  for (const id of SECTIONS) {
    const at = out.indexOf('id="' + id + '"');
    if (at < 0) continue;
    const end = out.indexOf('</section>', at);
    if (end < 0) continue;
    const body = out.slice(at, end);
    if (!RATING.test(body)) continue;             // nothing to source in this section
    if (body.includes('venue-src')) { already += 1; continue; }
    out = out.slice(0, end) + '        ' + NOTE + '\n      ' + out.slice(end);
    added += 1;
    bySection[id] = (bySection[id] || 0) + 1;
  }

  if (!added) continue;
  pages += 1;
  notes += added;
  if (APPLY) fs.writeFileSync(p, out);
}

console.log(notes + ' source lines added across ' + pages + ' city pages');
if (already) console.log('  ' + already + ' sections already had one');
console.log('  by section: ' + Object.entries(bySection).map(([k, v]) => k + ' ' + v).join(', '));
console.log('\n  the line says:\n    ' + NOTE.replace(/<[^>]+>/g, '').trim());
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

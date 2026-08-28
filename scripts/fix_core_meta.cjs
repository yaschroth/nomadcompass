require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The titles and descriptions on the twenty hand-written pages, brought into the band check_meta
 * enforces.
 *
 * The city pages, rankings and tier lists compose their snippets from data. These twenty do not:
 * they are the legal pages, the tool pages and the hub pages, each written once by hand. Half were
 * too short for Google to use as written (terms at 45 characters, privacy at 63) and half ran past
 * the point where it truncates them (cost-of-living-index at 201).
 *
 * Each replacement below is grounded in what the page actually says, read from its own headings,
 * not written from the title. The privacy description names the six sections that page really has.
 *
 * A fix is applied to the generator that writes the page where there is one, so it survives the
 * next build, and to the HTML where the page is hand-maintained. The script says which it did.
 *
 * Idempotent: an exact-match replacement that has already been applied simply does not match.
 * Usage: node scripts/fix_core_meta.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// [page, kind, old, new]
const FIXES = [
  ['about.html', 'desc',
    'The Nomad HQ rates 710 cities on the 13 things that matter most to digital nomads, so remote workers can find their ideal base with real data instead of guesswork.',
    'The Nomad HQ rates 710 cities on the 13 things that matter most to remote workers, so you can choose a base from real data rather than guesswork.'],

  ['contact.html', 'desc',
    'Get in touch with The Nomad HQ: corrections, city suggestions, partnerships, or press.',
    'Questions, corrections, city suggestions or partnership ideas. Reader corrections are what keep the city guides accurate, and we read every message.'],

  ['privacy.html', 'desc',
    'How The Nomad HQ collects, uses, and protects your information.',
    'What The Nomad HQ collects and why, the cookies the banner controls, the third parties involved, your rights over the data and how long it is kept.'],

  ['terms.html', 'desc',
    'The terms governing your use of The Nomad HQ.',
    'The terms for using The Nomad HQ: the site is informational, what we do not warrant, how affiliate links work, and the limits of our liability.'],

  ['disclosure.html', 'desc',
    'How The Nomad HQ uses affiliate links and how that does (and does not) affect our content.',
    'Some links on The Nomad HQ earn a commission. What that does and does not change about what we recommend, and how to spot one on the page.'],

  ['wheel.html', 'desc',
    'Use the Nomad Taste Wheel to find your perfect digital nomad destination based on your priorities.',
    'The Nomad Taste Wheel matches you to a city from what you actually care about: cost, climate, wifi, safety, nightlife and nine more, weighted by you.'],

  ['route.html', 'desc',
    'Plan a dated multi-city nomad trip: set your dates and get a month-by-month budget, per-stop weather, a packing list, a Schengen 90/180 tracker, jet-lag and flight info. Free.',
    'Plan a dated multi-city nomad trip: a month-by-month budget, per-stop weather, a packing list, a Schengen 90/180 tracker and flight costs. Free.'],

  ['nomad-visas.html', 'desc',
    'Enter your monthly income and see which digital nomad visas you qualify for. Compare 40+ nomad and remote-work visas by their minimum income requirement. Free tool.',
    'Enter your monthly income and see which nomad visas you qualify for. Over 40 remote-work visas compared by the income each one requires. Free.'],

  ['cost-of-living-index.html', 'title',
    'Digital Nomad Cost of Living Index 2026: Real Monthly Costs, 330 Cities',
    'Cost of Living Index for Digital Nomads: 330 Cities'],
  ['cost-of-living-index.html', 'desc',
    'A transparent, sourced cost-of-living index for digital nomads: the real monthly budget for 330 cities, ranked, from central rent plus a one-person basket priced from Numbeo. Sort and filter by region.',
    'The real monthly budget for 330 cities, ranked: central rent plus a one-person basket, every figure priced from Numbeo. Sort and filter by region.'],

  ['best.html', 'title',
    'Best Cities for Digital Nomads: Rankings by Cost, WiFi, Safety and More',
    'Best Cities for Digital Nomads: Cost, WiFi and Safety'],

  ['blog.html', 'desc',
    "Expert guides for digital nomads: in-depth city reviews, remote work tips, visa requirements, and cost of living breakdowns for the world's best nomad destinations.",
    'In-depth city reviews, remote work guides, visa requirements and cost breakdowns, written from the same data the rest of the site is built on.'],

  ['tier-lists.html', 'title',
    'Digital Nomad City Tier Lists: Overall, by Region and Category',
    'Digital Nomad City Tier Lists: Region and Category'],

  ['blog/category/city-guides.html', 'desc',
    'In-depth, field-tested guides to living and working remotely in specific cities, cost of living, neighborhoods, coworking, and the day-to-day reality of each base.',
    'Field-tested guides to living and working remotely in specific cities: cost of living, neighborhoods, coworking and the day-to-day reality.'],

  ['blog/category/remote-work.html', 'desc',
    'Coworking, productivity, and the practical craft of working well from anywhere, from building a routine that survives time zones to picking the right desk abroad.',
    'Coworking, productivity and the craft of working well from anywhere, from a routine that survives time zones to picking the right desk abroad.'],
];

// Where a page is generated, the string lives in the generator too and has to change there or the
// next build undoes this.
const GENERATORS = fs.readdirSync(path.join(ROOT, 'scripts'))
  .filter((f) => f.endsWith('.cjs') || f.endsWith('.js'))
  .map((f) => path.join(ROOT, 'scripts', f))
  // Not this file. The first run scanned itself, matched its own FIXES table and rewrote every
  // "from" string to equal its "to", which left a record of what changed that no longer said what
  // it changed from.
  .filter((f) => path.resolve(f) !== path.resolve(__filename));

let inHtml = 0;
let inGen = 0;
const missing = [];
const touched = new Set();

for (const [page, kind, from, to] of FIXES) {
  let found = false;

  for (const g of GENERATORS) {
    const src = fs.readFileSync(g, 'utf8');
    if (!src.includes(from)) continue;
    if (APPLY) fs.writeFileSync(g, src.split(from).join(to));
    touched.add(path.relative(ROOT, g));
    inGen++;
    found = true;
  }

  const abs = path.join(ROOT, page);
  if (fs.existsSync(abs)) {
    const html = fs.readFileSync(abs, 'utf8');
    // The tags carry HTML-escaped text, so match both forms.
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let out = html;
    for (const [f, t] of [[from, to], [esc(from), esc(to)]]) {
      if (out.includes(f)) out = out.split(f).join(t);
    }
    if (out !== html) {
      if (APPLY) fs.writeFileSync(abs, out);
      touched.add(page);
      inHtml++;
      found = true;
    }
  }

  if (!found) missing.push(page + ' (' + kind + '): "' + from.slice(0, 55) + '..."');
}

console.log((APPLY ? 'APPLIED' : 'DRY RUN') + ': ' + FIXES.length + ' fixes, '
  + inGen + ' landed in a generator, ' + inHtml + ' in the page itself, '
  + touched.size + ' files touched');
if (missing.length) {
  console.log('\n  ' + missing.length + ' no longer match, so they were already applied or the text moved:');
  missing.forEach((m) => console.log('    ' + m));
}
if (!APPLY) console.log('\nRe-run with --apply to write.');

require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Rewrites the numbers the site states about itself so they match reality.
 *
 * The site used to contradict itself in public: 650+ cities on the homepage, 410 on /best and
 * /about, 710 on /cities, with 710 being the truth. 234 stale figures across 193 files.
 *
 * Counts come from scripts/lib/site-stats.cjs, which computes them from the data. Run this
 * after anything that changes the city list, then run check_site_numbers.cjs to confirm.
 * Idempotent: a second run reports zero changes.
 *
 * Usage:
 *   node scripts/apply_site_numbers.cjs           apply
 *   node scripts/apply_site_numbers.cjs --dry     report without writing
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const { stats } = require(path.join(__dirname, 'lib', 'site-stats.cjs'));
const s = stats();

// Each rule is deliberately anchored to the noun it counts. A bare /410/ would eat prices,
// addresses and IDs; every pattern below has to see "cities" or "destinations" (or a labelled
// stat tile) before it will fire.
const RULES = [
  // Hero stat tiles carry explicit markers, so they are updated exactly rather than by guessing.
  [/(<span data-stat="cities">)[\d,+]*(<\/span>)/g, `$1${s.cities}$2`],
  [/(<span data-stat="countries">)[\d,+]*(<\/span>)/g, `$1${s.countries}$2`],
  [/(<span data-stat="categories">)[\d,+]*(<\/span>)/g, `$1${s.categories}$2`],
  [/(<span data-stat="rankings">)[\d,+]*(<\/span>)/g, `$1${s.rankings}$2`],

  // Prose. The hyphenated "410-city index" form is separate: it has no space, so the
  // lookahead rules below never saw it and it survived the first sweep.
  [/\b650\+(?=\s+(?:cities|rated cities))/g, String(s.cities)],
  // "N cities" is NOT a site-wide claim. /services/lawyers says "255 cities" and means it, and a
  // rule matching any three or four digits before the word rewrote 4,855 figures across 1,117
  // pages, most of them correct before it ran. So these stay pinned to the values this site has
  // actually claimed about ITSELF, and a new one gets appended here when the count moves.
  // The list is the safety mechanism, not an oversight.
  ...[410, 650, 710, 740, 771].flatMap((old) => [
    [new RegExp('\\b' + old + '\\b(?=\\s+(?:cities|destinations|rated cities))', 'g'), String(s.cities)],
    [new RegExp('\\b' + old + '-city\\b', 'g'), `${s.cities}-city`],
  ]),

  // about.html stat tiles, scoped by their own label, so any count here is safe to rewrite.
  [/(<div class="num">)\d{2,4}(<\/div>\s*<div class="lbl">cities rated<\/div>)/g, `$1${s.cities}$2`],
  [/(<div class="num">)\d{1,3}(<\/div>\s*<div class="lbl">rankings<\/div>)/g, `$1${s.rankings}$2`],
  [/\b11 rankings\b/g, `${s.rankings} rankings`],
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
}

const files = [];
walk(ROOT, files);

let changedFiles = 0, changedHits = 0;
const perFile = [];
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  let after = before, hits = 0;
  for (const [re, to] of RULES) {
    const found = after.match(re);
    if (!found) continue;
    hits += found.length;
    after = after.replace(re, to);
  }
  if (after !== before) {
    changedFiles++;
    changedHits += hits;
    perFile.push([path.relative(ROOT, f), hits]);
    if (!DRY) fs.writeFileSync(f, after);
  }
}

perFile.sort((a, b) => b[1] - a[1]);
console.log(`Site numbers: cities ${s.cities}, countries ${s.countries}, categories ${s.categories}, rankings ${s.rankings}`);
for (const [rel, n] of perFile.slice(0, 15)) console.log(`  ${String(n).padStart(3)}  ${rel}`);
if (perFile.length > 15) console.log(`  ... and ${perFile.length - 15} more files`);
console.log(`${DRY ? 'Would update' : 'Updated'} ${changedHits} figures in ${changedFiles} of ${files.length} files.`);

/**
 * GATE: fails if the site states a figure about itself that is no longer true.
 *
 * The site once claimed 650+ cities on the homepage, 410 on /best and /about and 710 on
 * /cities, while the real number was 710. That drifted silently for months because nothing
 * checked it. This is the thing that checks it.
 *
 * Two passes:
 *   1. Published HTML: any stale figure at all.
 *   2. scripts/: a hardcoded count reintroduced in a generator, which would undo the sweep
 *      on its next run. Reported as a warning with the offending line.
 *
 * Exit 0 clean, 1 if anything is stale.
 *
 * Usage: node scripts/check_site_numbers.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { stats } = require(path.join(__dirname, 'lib', 'site-stats.cjs'));
const S = stats();

// Deliberately narrow: only the figures the site has actually claimed about its own index
// (410 and 650+). A blanket "any number before the word cities" rule was tried and produced
// false failures on legitimate subset counts, which are not this gate's business: the Numbeo
// coverage on /cost-of-living-index, the size of each tier list, and, best of all,
// "sub-$900 cities", which is a price. A gate nobody trusts gets ignored.
const STALE_HTML = [
  [/\b(?:410|650\+?)\s+(?:cities|destinations|rated cities)/g, 'a stale index size (was 410 / 650+)'],
  [/\b(?:410|650)-city\b/g, 'a stale "N-city" phrase (was 410 / 650)'],
  [/<div class="num">(\d+)<\/div>\s*<div class="lbl">cities rated<\/div>/g, 'an about-page tile for cities rated'],
  [/<div class="num">(\d+)<\/div>\s*<div class="lbl">rankings<\/div>/g, 'an about-page tile for rankings'],
];

// Marker-tagged figures must match exactly.
const MARKERS = { cities: S.cities, countries: S.countries, categories: S.categories, rankings: S.rankings };

function walk(dir, out, ext) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out, ext);
    else if (e.name.endsWith(ext)) out.push(fp);
  }
}

const html = [];
walk(ROOT, html, '.html');
const problems = [];

for (const f of html) {
  const t = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  for (const [re, what] of STALE_HTML) {
    const m = t.match(re);
    if (!m) continue;
    // Tile rules capture the number, so only complain when it actually disagrees.
    if (what.includes('tile')) {
      const want = what.includes('rankings') ? S.rankings : S.cities;
      const bad = m.filter((hit) => Number((hit.match(/>(\d+)</) || [])[1]) !== want);
      if (!bad.length) continue;
    }
    problems.push(`${rel}: ${m.length} x ${what}  e.g. "${m[0].trim()}"`);
  }
  for (const [key, want] of Object.entries(MARKERS)) {
    const re = new RegExp(`<span data-stat="${key}">([^<]*)</span>`, 'g');
    let m;
    while ((m = re.exec(t))) {
      if (m[1].trim() !== String(want)) problems.push(`${rel}: marker ${key} says "${m[1]}", should be ${want}`);
    }
  }
}

// Generators reintroducing a literal would silently undo the sweep on their next run.
const scripts = [];
walk(path.join(ROOT, 'scripts'), scripts, '.cjs');
const warnings = [];
const LITERAL = /\b(?:410|650\+?)\s+(?:cities|destinations)|\b(?:410|650)-city\b/g;
for (const f of scripts) {
  const rel = path.relative(ROOT, f);
  // These three describe the old figures in prose; they do not emit them.
  if (rel.endsWith('check_site_numbers.cjs') || rel.endsWith('apply_site_numbers.cjs') || rel.endsWith('site-stats.cjs')) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (LITERAL.test(line)) warnings.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
    LITERAL.lastIndex = 0;
  });
}

console.log(`SITE NUMBERS GATE  (cities ${S.cities}, countries ${S.countries}, categories ${S.categories}, rankings ${S.rankings})\n`);
if (warnings.length) {
  console.log(`  ${warnings.length} generator line(s) still hardcode a count. Fix at source or the next run undoes the sweep:`);
  warnings.slice(0, 12).forEach((w) => console.log('    ' + w));
  if (warnings.length > 12) console.log(`    ... and ${warnings.length - 12} more`);
  console.log('');
}
if (problems.length) {
  console.log(`  FAILING: ${problems.length} stale figure(s) in published HTML:`);
  problems.slice(0, 25).forEach((p) => console.log('    ' + p));
  if (problems.length > 25) console.log(`    ... and ${problems.length - 25} more`);
  process.exit(1);
}
console.log(`  clean: ${html.length} pages carry no stale figure.`);
process.exit(0);

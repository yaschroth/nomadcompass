/**
 * Measures how formulaic the guide prose is, by counting repeated sentence openers.
 *
 * Written after the phrasing gate caught the same construction of mine three times in one day.
 * The census that followed found the habit was not mine alone and not new: 1,981 of 16,207
 * sentences across the 350 JSON-backed guides, about 12%, begin with one of 62 five-word openers
 * used a dozen times or more. The heaviest are the whoFor verdicts, where 187 cities say "It is a
 * poor fit for ..." and another 88 say "It does not suit anyone ...", so 275 of 350 cities make the
 * same rhetorical move with one of two sentence skeletons.
 *
 * Why this matters beyond taste. A reader comparing two city pages sees the same scaffolding twice
 * and correctly concludes the pages were produced rather than written, which is the opposite of
 * this site's whole position against Nomad List. Search engines make the same inference: scaled
 * content produced to a template is explicitly named in Google's spam policies, and a thousand
 * pages sharing a sentence skeleton is exactly the pattern those policies describe.
 *
 * This is a REPORT rather than a blocking gate, deliberately. The offending sentences carry real
 * information, unlike the empty phrases removed earlier, so the fix is rewriting rather than
 * deletion and it is a body of work somebody has to choose to take on. Exits 0 unless --strict.
 *
 * --prose separates the two kinds of repetition, which are not the same defect. "Budget around
 * $940 a month" and "A one bedroom runs roughly $520 to $700" repeat because they are the same
 * measurement quoted for a different city, and a reader comparing two pages WANTS those to line
 * up: changing the frame every time would make the numbers harder to read, not the prose better.
 * The habit worth fixing is the one in the judgements around them. Without --prose the census
 * mixes both and the headline percentage cannot fall below about nine, because that much of it is
 * price data doing its job.
 *
 * WHAT THIS TOOL MISSED FOR ITS WHOLE LIFE, until 2026-09-10. The header above always said place
 * names were stripped, and the code never stripped them, so any template carrying the city's own
 * name inside its first five words counted as one unique opener per city and was never reported.
 * That hid the two commonest constructions in the corpus: 310 of 350 whoFor sections open
 * "<City> suits ...", and 112 prosCons sections open "The case for <City> is ...". A whole
 * campaign of rewriting ran against this census and declared whoFor clean of five-word repeats
 * while nine in ten of its verdicts opened the same way. Masking lives in lib/guide-openers.cjs
 * now, shared with guide_dump_sections.cjs, and the prose figure it reports is 7.1% rather than
 * the 3.8% that was believed.
 *
 * Usage: node scripts/check_guide_openers.cjs [--top N] [--field whoFor] [--min N] [--prose] [--strict]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const TOP = Number(arg('top', 25));
const FIELD = arg('field', null);
const STRICT = process.argv.includes('--strict');
const MIN = Number(arg('min', 12));
const PROSE = process.argv.includes('--prose');

// One definition of an opener, shared with guide_dump_sections.cjs so the census and the
// warning a writer sees can never disagree about what counts as the same sentence.
const { skeleton, isDataFrame } = require('./lib/guide-openers.cjs');

const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));

// Same sentence splitter the other guide checks use, so "a sentence" means one thing everywhere.
const sentences = (s) => String(s)
  .replace(/(\d)\.(\d)/g, '$1․$2')
  .split(/(?<=[.!?])\s+/)
  .map((x) => x.replace(/․/g, '.').trim())
  .filter((x) => x.split(/\s+/).length >= 5);

const counts = new Map();
const cities = new Map();
let total = 0;

for (const [id, city] of Object.entries(g)) {
  if (id.startsWith('_') || typeof city !== 'object') continue;
  for (const [field, text] of Object.entries(city)) {
    if (typeof text !== 'string') continue;
    if (FIELD && field !== FIELD) continue;
    for (const s of sentences(text)) {
      const k = skeleton(s);
      if (!k) continue;
      if (PROSE && isDataFrame(k)) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
      if (!cities.has(k)) cities.set(k, new Set());
      cities.get(k).add(id);
      total++;
    }
  }
}

const rows = [...counts].filter(([, n]) => n >= MIN).sort((a, b) => b[1] - a[1]);
const covered = rows.reduce((a, [, n]) => a + n, 0);
const share = total ? ((covered / total) * 100).toFixed(1) : '0';

console.log('GUIDE OPENER CENSUS' + (FIELD ? '  (' + FIELD + ' only)' : '')
  + (PROSE ? '  (prose only, price and visa frames excluded)' : '') + '\n');
console.log('  ' + total.toLocaleString() + ' sentences'
  + (FIELD ? ' in ' + FIELD : ' across 350 guides'));
console.log('  ' + rows.length + ' five-word openers used ' + MIN + ' times or more, covering '
  + covered.toLocaleString() + ' sentences (' + share + '%)\n');

for (const [k, n] of rows.slice(0, TOP)) {
  console.log('  ' + String(n).padStart(4) + '  in ' + String(cities.get(k).size).padStart(3)
    + ' cities   "' + k + ' ..."');
}
if (rows.length > TOP) console.log('\n  ... and ' + (rows.length - TOP) + ' more (--top N)');

if (STRICT && rows.length) {
  console.log('\n  --strict: failing because the corpus still reads to a template.');
  process.exit(1);
}

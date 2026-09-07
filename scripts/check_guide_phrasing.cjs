/**
 * Does a proposed extension reuse a phrase already written into ANOTHER city's guide?
 *
 * The two existing checks both look inside one city. check_guide_overlap compares an extension
 * against the section it extends; check_guide_cross_overlap compares it against that city's other
 * six sections. Neither can see the failure that actually shows up when a batch of guides is
 * written in one sitting by one writer: the same construction landing in city after city.
 *
 * It is a real defect and it shipped before this existed. "Come in February, the summer sells
 * itself" was written into Aland, and then nearly into Cagliari and Douglas. "Worth understanding
 * rather than simply avoiding" opened two sections in one batch. check_repetition.cjs does not
 * fire until a sentence appears in three articles, so a pair ships silently, and by the time a
 * third appears the first two are long committed.
 *
 * Shingles of six words, which is long enough that ordinary English collocations do not trip it
 * and short enough to catch a reused turn of phrase. Place names are stopped out: two coastal
 * cities legitimately share "on the northwest coast of the island".
 *
 * A shingle also has to carry at least three content words to count. Without that the check
 * drowns in its own noise: the first run over already-shipped batches flagged "which is part of
 * why the" and "in a way it does not" beside the genuine finds, and a gate that reports eight
 * things of which four matter is a gate that gets ignored. Function-word runs are how English
 * joins clauses together, not how a writer repeats themselves.
 *
 * Usage: node scripts/check_guide_phrasing.cjs <extensions.json> [--n 6]
 * Exit 1 if any extension reuses a phrase from another city.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXT = process.argv[2];
const N = (() => { const i = process.argv.indexOf('--n'); return i > 0 ? Number(process.argv[i + 1]) : 6; })();
const KEYS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];

if (!EXT) { console.error('usage: node scripts/check_guide_phrasing.cjs <extensions.json>'); process.exit(2); }

const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));
const ext = JSON.parse(fs.readFileSync(EXT, 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();

// Every place name on the site, so that a shared geography does not read as a shared phrase.
const stop = new Set();
for (const c of CITIES) {
  for (const w of (c.name + ' ' + c.country).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)) {
    if (w) stop.add(w);
  }
}

// The joins of ordinary English. A run made only of these is grammar, not phrasing.
const FUNCTION = new Set(('a an and are as at be been but by can do does for from had has have here how '
  + 'in into is it its of on one or out over so than that the their them then there these they this '
  + 'those to up was way were what when where which while who why will with within without you your '
  + 'not no more most much very just also only same other another does did doing get got make makes '
  + 'made take takes taken come comes rather far less least about after before between during through '
  + 'under above all any both each few many some such own said say says').split(' '));
const isContent = (w) => !FUNCTION.has(w) && w.length > 2;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const shingles = (s) => {
  const w = norm(s).split(' ');
  const out = new Map();
  for (let i = 0; i + N <= w.length; i++) {
    const run = w.slice(i, i + N);
    if (run.every((x) => stop.has(x))) continue;
    if (run.filter(isContent).length < 3) continue;
    out.set(run.join(' '), true);
  }
  return out;
};

// Index every phrase already in the corpus, by the city it belongs to.
const corpus = new Map();
for (const [slug, c] of Object.entries(g)) {
  if (slug.startsWith('_')) continue;
  for (const k of KEYS) {
    for (const sh of shingles(String(c[k] || '')).keys()) {
      if (!corpus.has(sh)) corpus.set(sh, slug + '.' + k);
    }
  }
}

let flagged = 0;
for (const [key, text] of Object.entries(ext)) {
  const [slug] = key.split('.');
  const hits = [];
  for (const sh of shingles(text).keys()) {
    const owner = corpus.get(sh);
    if (owner && owner.split('.')[0] !== slug) hits.push({ sh, owner });
  }
  if (hits.length) {
    console.log('  ' + key + ' reuses ' + hits[0].owner + ': "' + hits[0].sh + '"');
    if (hits.length > 1) console.log('    (and ' + (hits.length - 1) + ' more)');
    flagged++;
  }
}

// The enumerator tic, checked here so it cannot slide through on a regex retyped from memory.
// Sections opening "Two things worth knowing" or "One further consideration" ran at 1.90 per city
// across the 42 guides written on 2026-09-07 against 0.03 across the other 308, and 74 of them
// were removed in 03e4a4cc9. The pattern must allow leading whitespace: these extensions begin
// with a space, so an anchor of ^ or ". " alone misses the first sentence of every one of them,
// which is exactly how " Two federal facts sit underneath the prices" reached the applied data.
const ENUM = /(?:^\s*|[.:]\s+)(?:Two|Three|One|Four)\s+[a-z]/g;
let tics = 0;
for (const [key, text] of Object.entries(ext)) {
  const hits = String(text).match(ENUM);
  if (hits) {
    console.log('  ' + key + ' opens a sentence with an enumerator: "' + hits[0].trim() + '..."');
    tics += hits.length;
  }
}
if (tics) console.log('  ' + tics + ' enumerator opener(s): lead with the fact instead of counting it out');

console.log(Object.keys(ext).length + ' extension(s) checked against '
  + corpus.size.toLocaleString() + ' phrases from ' + (Object.keys(g).length - 1) + ' cities, '
  + flagged + ' reusing another city\'s phrasing');
process.exit(flagged || tics ? 1 : 0);

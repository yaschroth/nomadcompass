require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Removes prose that points at a category score and asserts the number is correct.
 *
 * The owner's instruction, after finding these on the live site: "das sind leere worthuellen,
 * die nichts aussagen. sowas niemals schreiben." The 13 category tiles on every city page were
 * full of them. "The 7 is fair." "The 6 is honest." "Oceanic and cool, which the 3 records."
 * The reader is looking at the number while reading a sentence that tells them it is right.
 *
 * Getting the "The 6 records ..." form right took two wrong turns. Stripping only the frame left
 * fragments ("A scene that exists on one street.") that read worse than the original. Deleting
 * the whole sentence instead looked right against eight samples, where the clause was a summary
 * of what the tile had already said, and was wrong for a couple of dozen others where it carried
 * the only new thing in the tile: "the proximity to Bucharest changes the picture for anyone
 * willing to commute" is not a restatement of anything.
 *
 * So the tile's own length decides. Tiles run 40 to 110 words with a median of 63, and none is
 * under 40. If dropping the sentence leaves the tile at 45 words or more, it was padding and it
 * goes. If dropping it would take the tile below that, the sentence was carrying the substance,
 * so only the number goes and a real subject replaces it. Either way no assertion about a score
 * survives, which is the instruction, and no tile falls below what the rest of the file does.
 *
 * The clause form is simpler: "Very cheap, and the 7 is fair" keeps "Very cheap." Only the
 * hanger is cut.
 *
 * Usage: node scripts/strip_score_assertions.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const FILE = path.join(ROOT, 'data', 'category-descriptions.json');

const HOLLOW = 'fair|honest|earned|deserved|straightforward|accurate|right|correct|justified'
  + '|a fair reading|an honest reading|a fair one|an honest one|about right|honest enough|fair enough';
const CARRIES = 'reflects|records|captures|shows|describes|signals|sums up|backs up';
// The category word is optional: the tiles use both "the community score of 3" and the bare
// "the score of 3", and a first pass that required it left thirty-two of the second form live.
const NUM = '(?:the|its|our)\\s+\\d+|(?:the|its|our)(?:\\s+\\w+)?\\s+scores?\\s+of\\s+\\d+';

const RULES = [
  // A whole sentence that exists to rate the number. Both the hollow form and the
  // summary-of-the-summary form go: neither tells a reader anything.
  // The bare form and every qualified variant of it. A first pass matched only
  // "The 7 is fair." with the full stop hard against the adjective, and left sixty-eight
  // sentences standing that say the same thing with a tail on it: "fair rather than generous",
  // "an honest reading rather than a harsh one", "a fair middle", "genuinely earned". Each is
  // still nothing but a verdict on a number the reader is looking at.
  { id: 'sentence: The N is fair.',
    re: new RegExp('\\s*(?:The|Its|Our)\\s+(?:\\d+|(?:\\s*\\w+)?\\s*scores?\\s+of\\s+\\d+)\\s+(?:is|are)\\s+'
      + '(?:(?:a|an|genuinely|straightforwardly|entirely|not)\\s+)*'
      + '(?:' + HOLLOW + '|reading|middle|average|verdict|assessment)'
      + '[^.!?:]*[.!?]', 'g'),
    to: '' },

  // The colon form keeps what follows, because that is an explanation rather than a verdict:
  // "The 2 is accurate: this is a city almost nobody works from remotely" says something.
  { id: 'sentence: The N is accurate: X.',
    re: new RegExp('(?:The|Its|Our)\\s+(?:\\d+|(?:\\s*\\w+)?\\s*scores?\\s+of\\s+\\d+)\\s+(?:is|are)\\s+[^.!?:]*:\\s*', 'g'),
    to: '' },
  // Handled after the others, because whether it is deleted or rewritten depends on what the
  // tile weighs once the rest of the cuts have been made.
  { id: 'sentence: The N reflects X.', deferred: true,
    re: new RegExp('\\s*(?:The|Its|Our)\\s+(?:\\d+|(?:\\s*\\w+)?\\s*scores?\\s+of\\s+\\d+)\\s+(?:' + CARRIES + ')\\s+([^.!?]*[.!?])', 'g') },

  // The assertion hung off a sentence that is doing real work. Only the hanger goes.
  { id: 'clause: ..., and the N is fair.',
    re: new RegExp(',?\\s*and\\s+(?:' + NUM + ')\\s+is\\s+(?:' + HOLLOW + ')\\s*([.!?])', 'g'),
    to: '$1' },
  { id: 'clause: ..., and the N reflects X.',
    re: new RegExp(',?\\s*and\\s+(?:' + NUM + ')\\s+(?:' + CARRIES + ')\\s+[^.!?]*([.!?])', 'g'),
    to: '$1' },
  { id: 'clause: ..., which the N records.',
    re: new RegExp(',?\\s*which\\s+(?:' + NUM + ')\\s+(?:' + CARRIES + '|is\\s+(?:' + HOLLOW + '))\\s*([.!?])', 'g'),
    to: '$1' },
  { id: 'clause: ..., which the N reflects X.',
    re: new RegExp(',?\\s*which\\s+(?:' + NUM + ')\\s+(?:' + CARRIES + ')\\s+[^.!?]*([.!?])', 'g'),
    to: '$1' },
];

function tidy(s) {
  return s
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/([.,])\1+/g, '$1')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase())
    .trim();
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const counts = {};
const samples = {};
let tilesChanged = 0, wordsRemoved = 0, emptied = [];

for (const city of Object.keys(data)) {
  for (const [cat, raw] of Object.entries(data[city])) {
    if (typeof raw !== 'string') continue;
    let v = raw;
    for (const r of RULES) {
      if (r.deferred) continue;
      const before = v;
      v = v.replace(r.re, r.to);
      if (v !== before) {
        counts[r.id] = (counts[r.id] || 0) + 1;
        if (!samples[r.id]) samples[r.id] = { key: city + '.' + cat, before };
      }
    }
    for (const r of RULES.filter((x) => x.deferred)) {
      const before = v;
      const dropped = tidy(v.replace(r.re, ''));
      if (dropped === tidy(v)) continue;
      const KEEP_FLOOR = 45;
      if (dropped.trim().split(/\s+/).length >= KEEP_FLOOR) {
        v = dropped;
        counts[r.id + '  -> dropped'] = (counts[r.id + '  -> dropped'] || 0) + 1;
      } else {
        v = v.replace(r.re, ' This is $1');   // leading space: the pattern consumed the one before it
        counts[r.id + '  -> rewritten'] = (counts[r.id + '  -> rewritten'] || 0) + 1;
      }
      if (v !== before && !samples[r.id]) samples[r.id] = { key: city + '.' + cat, before };
    }
    v = tidy(v);
    if (v !== raw) {
      tilesChanged++;
      wordsRemoved += raw.trim().split(/\s+/).length - v.trim().split(/\s+/).length;
      for (const id of Object.keys(samples)) {
        if (samples[id].key === city + '.' + cat && !samples[id].after) samples[id].after = v;
      }
      // A tile reduced to nothing would be a worse defect than the one being fixed.
      if (v.trim().split(/\s+/).length < 25) emptied.push(city + '.' + cat + ' (' + v.trim().split(/\s+/).length + 'w)');
      if (APPLY) data[city][cat] = v;
    }
  }
}

console.log('Score assertions in the 13 category tiles\n');
for (const [id, n] of Object.entries(counts)) console.log('  ' + String(n).padStart(5) + '  ' + id);
console.log('\n  tiles changed: ' + tilesChanged + '   words removed: ' + wordsRemoved
  + (APPLY ? '' : '   [dry run]'));
console.log('  tiles left under 25 words: ' + (emptied.length ? emptied.length + '  ' + emptied.slice(0, 5).join(', ') : 'none') + '\n');

for (const [id, s] of Object.entries(samples)) {
  if (!s.after) continue;
  console.log('  ' + id + '   [' + s.key + ']');
  console.log('    BEFORE ...' + s.before.slice(-140));
  console.log('    AFTER  ...' + s.after.slice(-140) + '\n');
}

if (APPLY) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log('  data/category-descriptions.json written');
}

// The pages are the second half of this, and the half that matters. apply_category_notes.cjs
// says it plainly in its own header: the data file is NOT what the pages are built from. Each
// city page carries its own inline CATEGORY_DESCRIPTIONS object and the tiles render from that,
// so fixing the JSON alone would have changed nothing a reader sees. The two have drifted, and
// 179 pages carry assertions the data file no longer does.
const CITY_DIR = path.join(ROOT, 'cities');
const OBJ_RE = /(const CATEGORY_DESCRIPTIONS = )(\{[\s\S]*?\})(;)/;
let pagesChanged = 0, pageTiles = 0;

for (const f of fs.readdirSync(CITY_DIR).filter((x) => x.endsWith('.html'))) {
  const fp = path.join(CITY_DIR, f);
  const html = fs.readFileSync(fp, 'utf8');
  const m = html.match(OBJ_RE);
  if (!m) continue;

  let obj;
  try { obj = JSON.parse(m[2]); } catch (e) { console.log('  unparseable tiles: ' + f); continue; }

  let touched = false;
  for (const [cat, raw] of Object.entries(obj)) {
    if (typeof raw !== 'string') continue;
    let v = raw;
    for (const r of RULES) { if (!r.deferred) v = v.replace(r.re, r.to); }
    for (const r of RULES.filter((x) => x.deferred)) {
      const dropped = tidy(v.replace(r.re, ''));
      if (dropped === tidy(v)) continue;
      v = dropped.trim().split(/\s+/).length >= 45 ? dropped : v.replace(r.re, ' This is $1');
    }
    v = tidy(v);
    if (v !== raw) { obj[cat] = v; touched = true; pageTiles++; }
  }
  if (!touched) continue;
  pagesChanged++;
  if (APPLY) fs.writeFileSync(fp, html.replace(OBJ_RE, (all, a, b, c) => a + JSON.stringify(obj) + c));
}

console.log('  city pages: ' + pagesChanged + ' changed, ' + pageTiles + ' tiles'
  + (APPLY ? '' : '   [dry run]'));

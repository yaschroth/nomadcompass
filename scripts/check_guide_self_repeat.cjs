/**
 * Gate: a section must not say the same thing twice.
 *
 * The three existing guide checks all compare an extension against something ELSE: the section it
 * extends, the other sections of the same city, the other 349 cities. None of them looks at a
 * finished section on its own, so a paragraph that states a fact in sentence three and restates it
 * in sentence six passes everything and ships.
 *
 * It ships often. Rostock's bestTime says "Hanse Sail in August fills the harbour with tall ships
 * and is among the largest maritime festivals in Europe, drawing over a million visitors across
 * four days" and then, one sentence later, "Anyone here in August should plan around Hanse Sail,
 * which fills the harbour with square-riggers and the city with more than a million visitors over
 * four days". Zilina's whereToWork states that Slovakia produces more cars per head than any other
 * country, twice, forty words apart.
 *
 * The shape is always the same: an appended closing sentence, usually opening "Anyone ...", that
 * re-tells the paragraph it was added to. That is what an append pass does when it writes from the
 * city rather than from the section.
 *
 * I claimed once, on finding two of these in Tuzla, that it was systemic across the 669 "Anyone"
 * openers, then sampled twelve and found none. So this counts rather than estimates.
 *
 * THE SIGNAL IS SHARED CONTENT WORDS, not proper nouns. A first version counted "fact tokens" and
 * treated two or more shared ones as a repeat, which flagged 131 sections that were mostly fine:
 * a multi-word place name splits into two capitalised tokens, so Hangzhou naming West Lake once as
 * a pro and once as a con scored the same as Rostock telling the Hanse Sail story twice. Counting
 * content words instead separates them cleanly, because a genuine restatement reuses the verbs and
 * the objects, not just the name: Rostock shares nine content words between its two Hanse Sail
 * sentences, Hangzhou shares two.
 *
 * Six shared content words between the closing sentence and any earlier one, or a shared six-word
 * shingle. Both are deliberately blunt; the point is to catch the paragraph that says a thing and
 * then says it again.
 *
 * Usage: node scripts/check_guide_self_repeat.cjs [--all] [--fix-list]
 * Exit 1 if any section repeats itself.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');
const FIX_LIST = process.argv.includes('--fix-list');
// Six is where the false positives stop. At five, a pro and a con about the same landmark start
// appearing; at seven, Zilina's twice-told cars-per-head line drops out. Tunable here on purpose.
const MIN_SHARED = Number((process.argv.find((a) => a.startsWith('--min=')) || '--min=6').split('=')[1]);
const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));

const COMMON = new Set(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'european', 'union', 'schengen', 'eea', 'western',
  'eastern', 'northern', 'southern', 'american', 'africa', 'asia', 'europe', 'british', 'french',
  'spanish', 'portuguese', 'german', 'italian', 'dutch', 'anyone', 'the', 'a', 'an', 'it', 'there',
  'this', 'that', 'most', 'both', 'monday', 'friday', 'saturday', 'sunday', 'english']);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$. ]/g, ' ').replace(/\s+/g, ' ').trim();
const shingles = (s, n) => {
  const w = norm(s).split(' ').filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
};

// Split on sentence ends, but not on a decimal point or an abbreviation's full stop.
const sentences = (s) => String(s)
  .replace(/(\d)\.(\d)/g, '$1․$2')
  .split(/(?<=[.!?])\s+/)
  .map((x) => x.replace(/․/g, '.').trim())
  .filter((x) => x.split(/\s+/).length >= 4);

// Function words carry no content, so sharing them proves nothing. Everything else does count,
// including the verbs, which is what distinguishes "West Lake is beautiful / West Lake is crowded"
// from a sentence retelling the one above it.
const FUNCTION_WORDS = new Set(('a an the and or but if then than that this these those of in on at to from by with '
  + 'for as is are was were be been being it its it.s he she they them their there here you your we our i '
  + 'not no nor so such very more most much many few some any all both each other others another same '
  + 'can could will would shall should may might must do does did done have has had having '
  + 'about above across after against along among around before behind below beneath beside between beyond '
  + 'during into onto out over through under up down off out.of within without while when where which who whom whose '
  + 'what why how also just only even still yet ever never always often usually rather quite well '
  + 'one two three four five six seven eight nine ten').split(' '));

function contentWords(sentence, stop) {
  return new Set(norm(sentence).split(' ')
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter((w) => w.length > 2 && !FUNCTION_WORDS.has(w) && !stop.has(w)));
}

const hits = [];
for (const [id, city] of Object.entries(g)) {
  if (id.startsWith('_') || typeof city !== 'object') continue;
  const c = byId[id] || {};
  const stop = new Set(String(c.name || '').toLowerCase().split(/\s+/)
    .concat(String(c.country || '').toLowerCase().split(/\s+/)).filter(Boolean));

  for (const [field, text] of Object.entries(city)) {
    if (typeof text !== 'string') continue;
    const sents = sentences(text);
    if (sents.length < 3) continue;
    const last = sents[sents.length - 1];
    const lastSh = shingles(last, 6);
    const lastWords = contentWords(last, stop);

    for (let i = 0; i < sents.length - 1; i++) {
      const prev = sents[i];
      const sharedSh = [...shingles(prev, 6)].filter((x) => lastSh.has(x));
      const shared = [...contentWords(prev, stop)].filter((x) => lastWords.has(x));
      if (sharedSh.length || shared.length >= MIN_SHARED) {
        hits.push({ id, field,
          why: sharedSh.length ? 'phrase "' + sharedSh[0] + '"' : shared.length + ' shared: ' + shared.slice(0, 8).join(', '),
          prev, last });
        break;
      }
    }
  }
}

console.log('GUIDE SELF-REPEAT GATE  (a section must not say the same thing twice)\n');
const cities = new Set(hits.map((h) => h.id));
console.log('  ' + Object.keys(g).filter((k) => !k.startsWith('_')).length + ' cities scanned\n');

if (!hits.length) {
  console.log('  clean: no section restates itself in its closing sentence.');
  process.exit(0);
}

if (FIX_LIST) {
  console.log(hits.map((h) => h.id + '.' + h.field).join('\n'));
  process.exit(1);
}

console.log('  FAILING: ' + hits.length + ' section(s) across ' + cities.size + ' cities\n');
for (const h of (SHOW_ALL ? hits : hits.slice(0, 12))) {
  console.log('  ' + h.id + '.' + h.field + '   (' + h.why + ')');
  console.log('    EARLIER: ' + h.prev.slice(0, 150));
  console.log('    CLOSING: ' + h.last.slice(0, 150) + '\n');
}
if (!SHOW_ALL && hits.length > 12) console.log('  ... and ' + (hits.length - 12) + ' more (--all)');
process.exit(1);

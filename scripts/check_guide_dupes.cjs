/**
 * Gate: the same SENTENCE must not stand in two different cities.
 *
 * check_guide_phrasing.cjs was built for this and structurally cannot do it. It indexes the corpus
 * first-writer-wins:
 *
 *     if (!corpus.has(sh)) corpus.set(sh, slug + '.' + field);
 *
 * and then, when checking a city, skips any hit whose owner is that same city. So a sentence
 * written into Vigo and later copied into Evora is recorded as belonging to Vigo, and checking
 * Evora reports it, but checking VIGO does not, because Vigo owns it. Worse, the check only ever
 * runs against a proposed EXTENSION. Nothing has ever read the finished corpus and asked which
 * sentences already appear twice. The answer, on 2026-09-11, was 77 groups covering 179 sentences.
 *
 * Four of those groups are deliberate and stay: the cost-basis disclosure required by the standing
 * rule that every city page says whether its figure is measured or an estimate, and the legal note
 * on visas. Those are policy, not repetition, and they are matched by POLICY below rather than
 * listed, so a new city inheriting them does not trip the gate.
 *
 * The other 73 are real. Eight cities share one Schengen sentence word for word, five share a
 * sentence about the French overseas departments, five British cities share another. They are
 * mostly national facts, which is exactly the shape check_guide_phrasing keeps catching in
 * extensions and never caught in what already shipped.
 *
 * WHY A BASELINE RATHER THAN A CLEAN BILL. Failing on all 73 today would block every unrelated
 * batch until about a hundred sentences are rewritten, which is not where the effort belongs while
 * 625 city guides are still under the word floor. So the 73 are written down in
 * data/guide-dupes-baseline.json and the gate fails only on a group that is not in it. The debt is
 * visible, it cannot grow, and it can be paid down by deleting entries and rewriting the sentences.
 * Run with --list to print what is still owed.
 *
 * A sentence needs eight words to count. Below that, "The bus is the practical choice" is a
 * coincidence rather than a copy, and a shorter threshold buries the real hits in them.
 *
 * Usage: node scripts/check_guide_dupes.cjs [--list] [--write-baseline]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GUIDE = path.join(ROOT, 'data', 'guide-content.json');
const BASELINE = path.join(ROOT, 'data', 'guide-dupes-baseline.json');
const KEYS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];
const MIN_WORDS = 8;

// Sentences every city is SUPPOSED to carry, per the cost-basis and no-fabrication standing rules.
const POLICY = /own estimate rather than|reconciliation against measured|not legal advice|editorial estimates/i;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => s.split(' ').filter(Boolean).length;

const guide = JSON.parse(fs.readFileSync(GUIDE, 'utf8'));
const baseline = fs.existsSync(BASELINE) ? new Set(JSON.parse(fs.readFileSync(BASELINE, 'utf8')).sentences) : new Set();

const seen = new Map();
for (const [slug, o] of Object.entries(guide)) {
  if (slug.startsWith('_')) continue;
  for (const k of KEYS) {
    for (const raw of String(o[k] || '').split(/(?<=[.!?])\s+/)) {
      const s = raw.trim();
      if (!s) continue;
      const n = norm(s);
      if (words(n) < MIN_WORDS) continue;
      if (POLICY.test(s)) continue;
      if (!seen.has(n)) seen.set(n, []);
      seen.get(n).push(slug + '.' + k);
    }
  }
}

const groups = [...seen.entries()]
  .filter(([, where]) => new Set(where.map((w) => w.split('.')[0])).size > 1)
  .sort((a, b) => b[1].length - a[1].length);

if (process.argv.includes('--write-baseline')) {
  fs.writeFileSync(BASELINE, JSON.stringify({
    note: 'Sentences already shared across cities when check_guide_dupes.cjs was written. The gate fails on anything NOT listed here. Pay this down by rewriting the sentences and deleting the entry.',
    written: new Date().toISOString().slice(0, 10),
    sentences: groups.map(([n]) => n),
  }, null, 2) + '\n');
  console.log('baseline written:', groups.length, 'groups');
  process.exit(0);
}

const fresh = groups.filter(([n]) => !baseline.has(n));
const known = groups.filter(([n]) => baseline.has(n));

console.log('\nGUIDE DUPLICATE-SENTENCE GATE  (the same sentence in two cities)\n');
console.log('  ' + Object.keys(guide).filter((k) => !k.startsWith('_')).length + ' cities scanned');
console.log('  ' + known.length + ' known repeat(s) carried in the baseline, ' + fresh.length + ' new\n');

if (process.argv.includes('--list')) {
  for (const [n, where] of known) {
    console.log('  x' + where.length + '  ' + where.join(', '));
    console.log('        ' + n.slice(0, 110));
  }
  console.log('');
}

if (!fresh.length) {
  console.log('  clean: no sentence appears in two cities that was not already owed.\n');
  process.exit(0);
}

console.log('  FAILING: ' + fresh.length + ' sentence(s) newly shared across cities\n');
for (const [n, where] of fresh) {
  console.log('  x' + where.length + '  ' + where.join(', '));
  console.log('        ' + n.slice(0, 110) + '\n');
}
process.exit(1);

/**
 * A note on a provider card must be about that provider.
 *
 * WHY THIS EXISTS
 *
 * 85% of all note text in the directory was sentences that appeared on more than one card. One of
 * them appeared 1,374 times. Two mechanisms produced it: `notePrefix`/`noteSuffix` on the source,
 * concatenated into every row of that source, and the same text written by hand into rows that
 * shared a source. Both are gone, and this stops them coming back.
 *
 * It had already been cleaned out once. The code comment in lib/service_prose.cjs records six
 * sentences repeated between 446 and 1,384 times being removed as "half of all the note text in
 * the dataset". The mechanism that produced them was left in place, so it refilled, worse. A rule
 * with no gate is a rule that holds until the next person is in a hurry, and the next person was me.
 *
 * THE RULE
 *
 * A sentence carried by more than MAX_SHARED rows is not about any of them. It is about the list
 * they came from, and the card already renders that: an evidence badge, a date where there is one,
 * and a link to the source. Such a sentence belongs on the source as `pageNote`, which the page
 * prints once.
 *
 * A second rule with no tolerance at all: a note may not restate what the card renders beside it.
 * No tier label, no confirmation date, no narration of our own correspondence. "We wrote to ask
 * whether this entry was right and he answered on 15 September 2026" is the badge written out in
 * words, and it is about us rather than about the provider.
 *
 * THE BASELINE
 *
 * 802 sentences are still shared, 5,092 occurrences, almost all of them near-variants that differ
 * by a language name or sentences that point at the card ("this one is listed as..."). Those need
 * rewording, not deleting, so they are carried in BASELINE and the number may only go down. A new
 * shared sentence fails immediately.
 *
 * Usage: node scripts/check_service_notes.cjs [--update-baseline]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const { EV_LABEL } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const BASELINE_FILE = path.join(ROOT, 'data', 'service-note-baseline.json');
// Two, not one. Two branches of one clinic can honestly carry the same true sentence about the
// business they share. Three cannot: at three it is a template, and templates are what put
// one sentence on 1,374 cards.
const MAX_SHARED = 2;

const SPLIT = /(?<=[.!?])\s+/;
const sentences = (n) => String(n || '').split(SPLIT).map((s) => s.trim()).filter((s) => s.length >= 12);

// Phrases that narrate the pipeline rather than describe the provider. Every one of these is either
// rendered structurally beside the note or is a sentence about us.
const NARRATION = [
  [/\bwe wrote to\b/i, 'narrates our own correspondence'],
  [/\bwrote to us\b/i, 'narrates our own correspondence'],
  [/\basked to be listed\b/i, 'narrates our own correspondence'],
  [/\bhe answered on\b|\bshe answered on\b|\bthey answered on\b/i, 'narrates our own correspondence'],
  [/\bsent us (its|their|his|her) (own )?(details|contact)/i, 'narrates our own correspondence'],
  [/\b(last )?checked on \d/i, 'the card renders the date'],
  [/\bconfirmed on \d/i, 'the card renders the date'],
];
Object.values(EV_LABEL).forEach((label) => {
  NARRATION.push([new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    'repeats the tier badge "' + label + '"']);
});

const rows = DB.providers;
const counts = new Map();
const example = new Map();
for (const r of rows) {
  for (const s of new Set(sentences(r.note))) {
    counts.set(s, (counts.get(s) || 0) + 1);
    if (!example.has(s)) example.set(s, r);
  }
}

const shared = [...counts.entries()].filter(([, n]) => n > MAX_SHARED).sort((a, b) => b[1] - a[1]);

let baseline = { sentences: [], occurrences: 0 };
if (fs.existsSync(BASELINE_FILE)) baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
const known = new Set(baseline.sentences || []);

const fresh = shared.filter(([s]) => !known.has(s));
const occurrences = shared.reduce((a, [, n]) => a + n, 0);

// The no-tolerance rule, checked against every note whether shared or not.
const narrated = [];
for (const r of rows) {
  for (const s of sentences(r.note)) {
    for (const [re, why] of NARRATION) {
      if (re.test(s)) {
        narrated.push({ name: r.name, city: r.city, why, s });
        break;
      }
    }
  }
}

let failed = false;

if (narrated.length) {
  failed = true;
  console.error(`check_service_notes: ${narrated.length} note sentence(s) say what the card already shows`);
  narrated.slice(0, 10).forEach((n) => {
    console.error(`  ${n.name} [${n.city}]: ${n.why}`);
    console.error(`    "${n.s.slice(0, 120)}"`);
  });
  if (narrated.length > 10) console.error(`  ... and ${narrated.length - 10} more`);
}

if (fresh.length) {
  failed = true;
  console.error(`check_service_notes: ${fresh.length} sentence(s) newly shared by more than one card`);
  fresh.slice(0, 10).forEach(([s, n]) => {
    const r = example.get(s);
    console.error(`  ${n} cards, e.g. ${r.name} [${r.city}]: "${s.slice(0, 110)}"`);
  });
  console.error('  A sentence on more than one card is about the list, not the provider.');
  console.error('  Put it on the source as pageNote, where the page prints it once.');
}

if (occurrences > (baseline.occurrences || 0) && !fresh.length) {
  failed = true;
  console.error(`check_service_notes: known shared sentences grew from ${baseline.occurrences} to ${occurrences} occurrences`);
}

if (process.argv.includes('--update-baseline')) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({
    _readme: 'Note sentences still carried by more than one card, with the occurrence count. These '
      + 'are near-variants and card-deictic sentences that need rewording rather than deleting. The '
      + 'count may only go down: check_service_notes.cjs fails on any sentence not listed here, and '
      + 'on any growth in the total. Refresh with --update-baseline only after a deliberate '
      + 'reduction.',
    updated: new Date().toISOString().slice(0, 10),
    occurrences,
    sentences: shared.map(([s]) => s),
  }, null, 1) + '\n');
  console.log(`baseline written: ${shared.length} shared sentences, ${occurrences} occurrences`);
  process.exit(0);
}

if (failed) process.exit(1);

console.log(`check_service_notes: clean. ${rows.length} rows, `
  + `${[...counts.values()].reduce((a, b) => a + b, 0)} note sentences, `
  + `${shared.length} still shared (${occurrences} occurrences, all known), `
  + 'and none repeats the badge beside it.');

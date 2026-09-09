/**
 * Lists, and then replaces, the sentences that share a worn-out opener.
 *
 * 593 sentences across the 350 guides use one of five constructions, the worst being "It is a poor
 * fit for ..." on 187 cities. The census that found them is check_guide_openers.cjs.
 *
 * The temptation is to rotate them through six new frames with a script, which would take the
 * count from one template to six and change nothing that matters. A reader comparing two pages
 * would still see scaffolding, and the honest description of the result would be "now formulaic in
 * six ways". So this tool does not rewrite anything. It lists the sentences with enough of the
 * surrounding section to rewrite them against, and applies replacements written one at a time.
 *
 *   --list "It is a poor fit for" [--from 0] [--n 20]   print sentences needing a rewrite
 *   --apply FILE                                        apply {"city.field": "new sentence"}
 *
 * Replacements are matched on the exact old sentence, so a stale file fails loudly rather than
 * writing to the wrong place. The 90-220 word band and the per-city floor are enforced exactly as
 * guide_extend.cjs enforces them, and a replacement shorter than what it removes is refused,
 * because several of these cities were topped up to clear the 1155-word floor.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'guide-content.json');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };

const guide = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const words = (s) => String(s).trim().split(/\s+/).length;
const sentences = (s) => String(s)
  .replace(/(\d)\.(\d)/g, '$1․$2')
  .split(/(?<=[.!?])\s+/)
  .map((x) => x.replace(/․/g, '.').trim())
  .filter(Boolean);

const LIST = arg('list');
const APPLY = arg('apply');

if (LIST) {
  const from = Number(arg('from', 0));
  const n = Number(arg('n', 20));
  const hits = [];
  for (const [id, city] of Object.entries(guide)) {
    if (id.startsWith('_') || typeof city !== 'object') continue;
    for (const [field, text] of Object.entries(city)) {
      if (typeof text !== 'string') continue;
      for (const s of sentences(text)) {
        if (s.startsWith(LIST)) hits.push({ id, field, sentence: s });
      }
    }
  }
  console.log(hits.length + ' sentences start with "' + LIST + '"; showing ' + from + '-' + (from + n) + '\n');
  for (const h of hits.slice(from, from + n)) {
    // The rest of the section matters: a rewrite that repeats a neighbouring sentence is not an
    // improvement, and the closing sentence is usually the one being replaced.
    const rest = sentences(guide[h.id][h.field]).filter((x) => x !== h.sentence);
    console.log('=== ' + h.id + '.' + h.field + ' ===');
    console.log('REPLACE: ' + h.sentence);
    console.log('CONTEXT: ' + rest.join(' ').slice(-190));
    console.log('');
  }
  process.exit(0);
}

if (!APPLY) { console.error('need --list "<opener>" or --apply <file>'); process.exit(1); }

const repl = JSON.parse(fs.readFileSync(APPLY, 'utf8'));
const before = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const problems = [];
const changes = [];

for (const [key, spec] of Object.entries(repl)) {
  const [id, field] = key.split('.');
  if (!guide[id] || typeof guide[id][field] !== 'string') { problems.push(key + ': no such section'); continue; }
  const { old, now } = spec;
  if (!old || !now) { problems.push(key + ': needs {old, now}'); continue; }
  if (!guide[id][field].includes(old)) { problems.push(key + ': the old sentence is not there any more'); continue; }
  if (words(now) < words(old)) {
    problems.push(key + ': replacement is shorter (' + words(now) + ' vs ' + words(old) + ')');
    continue;
  }
  guide[id][field] = guide[id][field].replace(old, now);
  changes.push({ key, old, now });
}

for (const [id, c] of Object.entries(guide)) {
  if (id.startsWith('_') || typeof c !== 'object') continue;
  for (const [k, v] of Object.entries(c)) {
    const w = words(v);
    if (w < 90 || w > 220) problems.push('OUT OF BAND ' + id + '.' + k + ': ' + w);
  }
}
const FLOOR = 1155;
for (const id of new Set(Object.keys(repl).map((k) => k.split('.')[0]))) {
  const was = Object.values(before[id] || {}).reduce((a, v) => a + words(v), 0);
  const now = Object.values(guide[id] || {}).reduce((a, v) => a + words(v), 0);
  if (was >= FLOOR && now < FLOOR) problems.push('WOULD DROP ' + id + ' BELOW THE FLOOR: ' + was + ' -> ' + now);
}

if (problems.length) {
  console.log('REFUSING, nothing written:\n');
  problems.slice(0, 20).forEach((p) => console.log('  ' + p));
  if (problems.length > 20) console.log('  ... and ' + (problems.length - 20) + ' more');
  process.exit(1);
}

fs.writeFileSync(FILE, JSON.stringify(guide, null, 2));
console.log('Reframed ' + changes.length + ' sentence(s)\n');
for (const c of changes.slice(0, 4)) {
  console.log('  ' + c.key);
  console.log('    was: ' + c.old.slice(0, 100));
  console.log('    now: ' + c.now.slice(0, 100) + '\n');
}
if (changes.length > 4) console.log('  ... and ' + (changes.length - 4) + ' more');

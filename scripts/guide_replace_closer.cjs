/**
 * Swaps the closing sentence of a guide section for a different one.
 *
 * guide_extend.cjs only appends, which is the wrong tool for the sections check_guide_self_repeat
 * finds: their problem is the sentence already there. Deleting it is also wrong, because several
 * of these cities were topped up to clear the 1155-word floor and would fall back under it, so the
 * replacement has to carry its own weight in words as well as in facts.
 *
 * Splits the section, drops the final sentence, appends the replacement, and enforces the same
 * 90 to 220 word band and 1155-word city floor that guide_extend does. Refuses the whole batch on
 * any violation rather than writing a partial one.
 *
 * Input: {"city.field": "The new closing sentence."} with no leading space, since this joins
 * sentences rather than continuing one.
 *
 * Usage: node scripts/guide_replace_closer.cjs <replacements.json> [--floor=1155]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'guide-content.json');
const REPL = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const FLOOR = Number((process.argv.find((a) => a.startsWith('--floor=')) || '--floor=1155').split('=')[1]);

const guide = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// Same splitter as the gate, so "the last sentence" means the same thing in both.
const sentences = (s) => String(s)
  .replace(/(\d)\.(\d)/g, '$1․$2')
  .split(/(?<=[.!?])\s+/)
  .map((x) => x.replace(/․/g, '.').trim())
  .filter(Boolean);

const words = (s) => String(s).trim().split(/\s+/).length;

const changes = [];
const problems = [];

for (const [key, replacement] of Object.entries(REPL)) {
  const [id, field] = key.split('.');
  if (!guide[id] || typeof guide[id][field] !== 'string') { problems.push(key + ': no such section'); continue; }
  const before = guide[id][field];
  const sents = sentences(before);
  if (sents.length < 2) { problems.push(key + ': only one sentence, nothing to replace'); continue; }
  const dropped = sents[sents.length - 1];
  const after = sents.slice(0, -1).join(' ') + ' ' + replacement.trim();
  guide[id][field] = after;
  changes.push({ key, dropped, replacement: replacement.trim(), from: words(before), to: words(after) });
}

// Band and floor, checked across the WHOLE file, because a batch that fixes one section while
// pushing another out of band is not a fix.
for (const [id, c] of Object.entries(guide)) {
  if (id.startsWith('_') || typeof c !== 'object') continue;
  for (const [k, v] of Object.entries(c)) {
    const w = words(v);
    if (w < 90 || w > 220) problems.push('OUT OF BAND ' + id + '.' + k + ': ' + w);
  }
}
// The floor test has to be RELATIVE, not absolute. Most of the sections that repeat themselves are
// on cities still waiting to be deepened, so they sit under 1155 before this script touches them.
// An absolute test refuses to repair exactly the pages that most need repairing. What matters is
// that a replacement never makes a city worse: it must not drop a city from above the floor to
// below it, and it must not shrink a city that is already short.
const before = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const totalOf = (obj, id) => Object.values(obj[id] || {}).reduce((a, v) => a + words(v), 0);
const stillShort = [];
for (const id of new Set(Object.keys(REPL).map((k) => k.split('.')[0]))) {
  const was = totalOf(before, id);
  const now = totalOf(guide, id);
  if (was >= FLOOR && now < FLOOR) {
    problems.push('WOULD DROP ' + id + ' BELOW THE FLOOR: ' + was + ' -> ' + now);
  } else if (now < was) {
    problems.push('SHRINKS ' + id + ': ' + was + ' -> ' + now
      + '. Write a replacement at least as long as the sentence it removes.');
  } else if (now < FLOOR) {
    stillShort.push(id + ' ' + now + ' (+' + (now - was) + ')');
  }
}

if (problems.length) {
  console.log('REFUSING, nothing written:\n');
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}

fs.writeFileSync(FILE, JSON.stringify(guide, null, 2));
console.log('Replaced the closing sentence in ' + changes.length + ' section(s)\n');
if (stillShort.length) {
  console.log('  still under the ' + FLOOR + '-word floor, and still on the deepening worklist:');
  console.log('    ' + stillShort.join(', ') + '\n');
}
for (const c of changes) {
  console.log('  ' + c.key + '   ' + c.from + 'w -> ' + c.to + 'w');
  console.log('    OUT: ' + c.dropped.slice(0, 110));
  console.log('    IN : ' + c.replacement.slice(0, 110) + '\n');
}

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
 *   --apply FILE [--allow-shorter]                      apply {"city.field": {old, now}}
 *                                                       or {"city.field": [{old, now}, ...]}
 *
 * Replacements are matched on the exact old sentence, so a stale file fails loudly rather than
 * writing to the wrong place. The 90-220 word band and the per-city floor are enforced exactly as
 * guide_extend.cjs enforces them, and a replacement shorter than what it removes is refused,
 * because several of these cities were topped up to clear the 1155-word floor.
 *
 * --allow-shorter lifts only that last rule, and exists for one job: removing a sentence that
 * restates one already in the section. There the shortening IS the fix, and refusing it would
 * force padding back in to replace words that were never carrying anything. The band and the
 * floor still apply, so a section cannot be cut below 90 words or a city below 1155 either way.
 * Do not reach for it to make an ordinary rewrite easier to write.
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
const ALLOW_SHORTER = process.argv.includes('--allow-shorter');

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

// A key may carry one {old, now} or an ARRAY of them. The array exists because prosCons states a
// case for and a case against in the same paragraph, and rewriting only one of them leaves the
// other half of the template standing next to its replacement, which reads worse than leaving
// both. Length is then checked across the whole key rather than sentence by sentence: what must
// not shrink is the section, and a pair often trades words between its two halves.
for (const [key, spec] of Object.entries(repl)) {
  const [id, field] = key.split('.');
  if (!guide[id] || typeof guide[id][field] !== 'string') { problems.push(key + ': no such section'); continue; }
  const pairs = Array.isArray(spec) ? spec : [spec];
  if (pairs.some((p) => !p || !p.old || !p.now)) { problems.push(key + ': needs {old, now}'); continue; }
  const missing = pairs.find((p) => !guide[id][field].includes(p.old));
  if (missing) { problems.push(key + ': the old sentence is not there any more: "' + missing.old.slice(0, 60) + '"'); continue; }
  const wasW = pairs.reduce((a, p) => a + words(p.old), 0);
  const nowW = pairs.reduce((a, p) => a + words(p.now), 0);
  if (!ALLOW_SHORTER && nowW < wasW) {
    problems.push(key + ': replacement is shorter (' + nowW + ' vs ' + wasW + ')');
    continue;
  }
  for (const p of pairs) {
    guide[id][field] = guide[id][field].replace(p.old, p.now);
    changes.push({ key, old: p.old, now: p.now });
  }
}

// The band is checked on the cities this run TOUCHES, not on the whole file.
//
// It used to scan everything, which was harmless while guide-content.json held only the 350 cities
// that had already been brought inside the band. Migrating the 277 HTML-only cities in broke it:
// those arrive with sections of 13, 16, 35 words, so every reframe of an unrelated city was refused
// for a problem somewhere else in the file. A tool must not decline to fix Tropea because Arusha is
// thin. The floor check below was already scoped this way and stays as it is.
// Narrower still: the SECTIONS this run rewrites, not every section of the cities it touches.
// Scoping to the city was already an improvement but still refused a Tropea fix because Kruje's
// cost section, which no reframe goes near, arrived from the migration at 226 words. What this
// check is for is stopping a rewrite from pushing its own section out of the band.
for (const key of Object.keys(repl)) {
  const [id, field] = key.split('.');
  const v = guide[id] && guide[id][field];
  if (v == null) continue;
  const w = words(v);
  if (w < 90 || w > 220) problems.push('OUT OF BAND ' + key + ': ' + w);
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

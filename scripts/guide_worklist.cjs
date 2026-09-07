/**
 * The deepening worklist: every city whose guide prose lives in data/guide-content.json, ordered
 * thinnest first, with its current per-section word counts and how far each section is from target.
 *
 * Target is parity with the 650 pages whose sections were written straight into the HTML: their
 * median is 1331 words across the seven sections on the page. The page carries about 170 words
 * beyond the JSON prose (headings, the cost-basis sentence, the YMYL note, the transport aside), so
 * the JSON needs roughly 1160 across seven, about 165 per section. merge_guide_content's band tops
 * out at 220, so there is room.
 *
 * Usage: node worklist.cjs <repoRoot> [--next N] [--done <file of finished slugs>]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEXT = (() => { const i = process.argv.indexOf('--next'); return i > 0 ? Number(process.argv[i + 1]) : 0; })();
const DONEF = (() => { const i = process.argv.indexOf('--done'); return i > 0 ? process.argv[i + 1] : null; })();
const FLOOR = 1155;   // what the owner asked for: parity-ish with the HTML-native pages
const TARGET = 185;   // 185 x 7 = 1295, the goal; the floor is not the goal, the band caps a section at 220

const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));
const KEYS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];

let done = new Set();
if (DONEF && fs.existsSync(DONEF)) done = new Set(JSON.parse(fs.readFileSync(DONEF, 'utf8')));

const rows = [];
for (const [slug, c] of Object.entries(g)) {
  if (slug.startsWith('_') || !byId[slug]) continue;
  const w = KEYS.map((k) => String(c[k] || '').trim().split(/\s+/).length);
  const total = w.reduce((a, b) => a + b, 0);
  rows.push({ slug, w, total, short: total < 1250 ? 1 : 0, done: done.has(slug) });
}
rows.sort((a, b) => a.total - b.total);

const todo = rows.filter((r) => !r.done && r.short > 0);
// Report the floor and the target as two numbers, never as one. Collapsing "clears 1155" and
// "raised but still short" into a single count was done once and misstated the progress by 32
// cities, so the three bands are printed separately and named.
const clears = rows.filter((r) => r.total >= FLOOR).length;
const raised = rows.filter((r) => r.total < FLOOR && r.total >= 800).length;
const untouched = rows.filter((r) => r.total < 800).length;
console.log(`${rows.length} JSON-backed cities`);
console.log(`  clear the ${FLOOR}-word floor : ${clears}`);
console.log(`  raised but still short  : ${raised}`);
console.log(`  untouched               : ${untouched}`);
console.log(`  at the ${TARGET * 7}-word target  : ${rows.length - todo.length}`);
const t = rows.map((r) => r.total).sort((a, b) => a - b);
console.log(`JSON words across seven sections: min ${t[0]} median ${t[Math.floor(t.length / 2)]} max ${t[t.length - 1]}  (target ~${TARGET * 7})`);
console.log(`words to the floor: ~${rows.reduce((a, r) => a + Math.max(0, FLOOR - r.total), 0).toLocaleString()}`
  + `  |  to the target: ~${todo.reduce((a, r) => a + Math.max(0, TARGET * 7 - r.total), 0).toLocaleString()}`);

if (NEXT) {
  const batch = todo.slice(0, NEXT);
  console.log('\nnext ' + batch.length + ':');
  console.log(batch.map((r) => r.slug).join(' '));
  console.log('\nper-section counts:');
  for (const r of batch) console.log('  ' + r.slug.padEnd(18) + r.w.join(' ').padEnd(30) + ' total ' + r.total);
}

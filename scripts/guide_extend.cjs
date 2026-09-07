// Append a sentence to guide sections that fall under merge_guide_content's 90-word floor.
// Written as a file rather than a heredoc because the sentences contain apostrophes, which a
// single-quoted shell heredoc turns into a syntax error mid-script and a silent no-write.
// Usage: node extend_guide.cjs <guide.json> <extensions.json>
const fs = require('fs');

const path = require('path');
const guideFile = path.join(__dirname, '..', 'data', 'guide-content.json');
const extFile = process.argv[2];
const guide = JSON.parse(fs.readFileSync(guideFile, 'utf8'));
const ext = JSON.parse(fs.readFileSync(extFile, 'utf8'));

let applied = 0;
const unknown = [];
for (const [key, text] of Object.entries(ext)) {
  const [city, field] = key.split('.');
  if (!guide[city] || !guide[city][field]) { unknown.push(key); continue; }
  guide[city][field] = guide[city][field].trimEnd() + text;
  applied++;
}
if (unknown.length) console.log('no such section: ' + unknown.join(', '));

let bad = 0;
for (const [id, c] of Object.entries(guide)) {
  // _meta carries provenance notes, not prose, and is not subject to the word band.
  if (id.startsWith('_') || typeof c !== 'object') continue;
  for (const [k, v] of Object.entries(c)) {
    const w = v.trim().split(/\s+/).length;
    if (w < 90 || w > 220) { console.log('  OUT OF BAND ' + id + '.' + k + ': ' + w); bad++; }
  }
}
if (bad) { console.log(bad + ' section(s) still out of band, nothing written'); process.exit(1); }
// Refuse a city that would still sit under the per-city floor after the extension. Writing to a
// budget by eye consistently landed about 62 words per section against a target of 85, which meant
// every batch needed a second pass. Better to be told before the write than after the measurement.
const FLOOR = Number((process.argv.find((a) => a.startsWith('--floor=')) || '--floor=1155').split('=')[1]);
const touched = [...new Set(Object.keys(ext).map((k) => k.split('.')[0]))];
const under = touched
  .map((id) => [id, Object.entries(guide[id] || {}).reduce((a, [, v]) => a + String(v).trim().split(/\s+/).length, 0)])
  .filter(([, total]) => total < FLOOR);
if (under.length) {
  console.log('REFUSING, ' + under.length + ' city/cities would still be under the ' + FLOOR + '-word floor:');
  for (const [id, total] of under) console.log('  ' + id.padEnd(18) + total + '  (needs ' + (FLOOR - total) + ' more)');
  process.exit(1);
}
fs.writeFileSync(guideFile, JSON.stringify(guide, null, 2));
console.log('extended ' + applied + ' section(s); every section now inside 90-220 words');

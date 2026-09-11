/**
 * One consistent depth measure across all 1000 city pages.
 *
 * WHY THIS EXISTS, AND WHY TWO EARLIER NUMBERS WERE WRONG.
 *
 * The 1,155-word floor has been tracked by guide_worklist.cjs, which reads data/guide-content.json.
 * That file held 350 of 1000 cities, so the figure was never a site measure. Two attempts to size
 * the rest both missed:
 *
 *   1,331 median  a naive HTML strip of the guide block. It swallows the seven headings, the cost
 *                 box and the visa and transport notes: about 190 words a page of things no reader
 *                 counts as guide prose. Too high.
 *     877 median  only the plain <p> paragraphs. On 410 pages a large share of the content sits in
 *                 <ul> lists of coworking spaces and pro/con bullets, and in <h3> subheadings. Too
 *                 low, and by more than the first was high.
 *
 * What a reader actually reads is paragraphs, list items and subheadings, with the regions other
 * sweeps own masked off so the cost table is not counted as writing. That is what this counts, and
 * it agrees with guide_worklist to the word on a city whose guide is nothing but paragraphs.
 *
 * Usage: node scripts/guide_depth_census.cjs [--under] [--csv]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');
const GUIDE = path.join(ROOT, 'data', 'guide-content.json');
const FLOOR = 1155;
const TARGET = 1295;

const G = JSON.parse(fs.readFileSync(GUIDE, 'utf8'));
const inJson = new Set(Object.keys(G).filter((k) => !k.startsWith('_')));

const OWNED = [
  ['<!-- cost-basis -->', '<!-- /cost-basis -->'],
  ['<!-- cost-start -->', '<!-- cost-end -->'],
];
function mask(str) {
  let out = str;
  for (const [open, close] of OWNED) {
    for (let i = 0; ; ) {
      const a = out.indexOf(open, i);
      if (a === -1) break;
      const b = out.indexOf(close, a + open.length);
      if (b === -1) break;
      const end = b + close.length;
      out = out.slice(0, a) + ' '.repeat(end - a) + out.slice(end);
      i = end;
    }
  }
  return out;
}
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

const rows = [];
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.html')) continue;
  const slug = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const i = html.indexOf('id="guide"');
  if (i < 0) { rows.push([slug, 0, inJson.has(slug)]); continue; }
  const j = html.indexOf('<!-- Where to Stay -->', i);
  const block = mask(html.slice(i, j > 0 ? j : i + 80000));
  let n = 0;
  for (const re of [/<p>([\s\S]*?)<\/p>/g, /<li>([\s\S]*?)<\/li>/g, /<h3[^>]*>([\s\S]*?)<\/h3>/g]) {
    for (const m of block.matchAll(re)) n += words(m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' '));
  }
  rows.push([slug, n, inJson.has(slug)]);
}
rows.sort((a, b) => a[1] - b[1]);

if (process.argv.includes('--csv')) {
  console.log('slug,words,managed');
  rows.forEach(([s, n, m]) => console.log(s + ',' + n + ',' + (m ? 'json' : 'html')));
  process.exit(0);
}

const stat = (list, label) => {
  if (!list.length) return;
  const under = list.filter((r) => r[1] < FLOOR);
  const owed = under.reduce((a, r) => a + (FLOOR - r[1]), 0);
  console.log('  ' + label.padEnd(34) + String(list.length).padStart(5));
  console.log('    median                         ' + String(list[Math.floor(list.length / 2)][1]).padStart(5));
  console.log('    under the ' + FLOOR + '-word floor      ' + String(under.length).padStart(5));
  console.log('    at the ' + TARGET + '-word target        ' + String(list.filter((r) => r[1] >= TARGET).length).padStart(5));
  console.log('    words owed to the floor        ' + ('~' + owed.toLocaleString()).padStart(6));
};

console.log('\nGUIDE DEPTH CENSUS  (paragraphs + list items + subheadings, sweep-owned blocks masked)\n');
stat(rows, 'all city pages');
console.log('');
stat(rows.filter((r) => r[2]), 'managed in guide-content.json');
console.log('');
stat(rows.filter((r) => !r[2]), 'HTML only, loop cannot reach');

if (process.argv.includes('--under')) {
  console.log('\n  thinnest pages under the floor:');
  rows.filter((r) => r[1] < FLOOR).slice(0, 40)
    .forEach(([s, n, m]) => console.log('    ' + s.padEnd(20) + String(n).padStart(5) + '  ' + (m ? 'json' : 'html')));
}
console.log('');

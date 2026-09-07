/**
 * Does a proposed extension repeat something ANOTHER section of the same city already says?
 *
 * check_overlap.cjs compares an extension only against the section it extends, which is the
 * common case but not the only one. The Kelowna batch wrote "the single bridge across Okanagan
 * Lake is its bottleneck" into gettingAround while that city's prosCons already said "traffic on
 * the single bridge across the lake is a daily constraint". Same fact, different section, and
 * nothing flagged it: on the page the two sit four paragraphs apart and read as padding.
 *
 * Shared five-word shingles, with the city and country names stopped out because they repeat
 * legitimately. Run it alongside check_overlap.cjs, not instead of it.
 *
 * Usage: node check_cross.cjs <repoRoot> <extensions.json>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXT = process.argv[2];
const KEYS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];

const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));
const ext = JSON.parse(fs.readFileSync(EXT, 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const shingles = (s, n) => {
  const w = norm(s).split(' ');
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
};

let flagged = 0;
for (const [key, text] of Object.entries(ext)) {
  const [slug, field] = key.split('.');
  if (!g[slug] || !byId[slug]) { console.log('  ' + key + ': no such city'); flagged++; continue; }
  const stop = new Set([byId[slug].name, byId[slug].country].flatMap((x) => norm(x).split(' ')));
  const mine = shingles(text, 5);
  for (const other of KEYS) {
    if (other === field) continue;                 // check_overlap.cjs owns the same-section case
    const theirs = shingles(String(g[slug][other] || ''), 5);
    const hits = [...mine].filter((s) => theirs.has(s) && !s.split(' ').every((w) => stop.has(w)));
    if (hits.length) { console.log('  ' + key + ' repeats ' + other + ': "' + hits[0] + '"'); flagged++; }
  }
}
console.log(Object.keys(ext).length + ' extension(s) checked, ' + flagged + ' cross-section overlap(s)');
process.exit(flagged ? 1 : 0);

/**
 * Does a proposed extension repeat what the section already says?
 *
 * Reading every existing section before writing its extension is the slow part of this job and
 * costs more than the writing does. The actual risk it guards against is narrow: restating a fact
 * the paragraph already contains. That is checkable mechanically, so the extension can be written
 * from knowledge of the city and the repetition caught here instead.
 *
 * Two signals, because they catch different mistakes:
 *   - a shared shingle of N consecutive words, which catches copied phrasing
 *   - a shared "fact token" (a number, a price, a proper noun) that already appears in the
 *     section, which catches the same fact stated in different words. This is the one that
 *     matters: writing "fibre runs $30 a month" under a section that already says it.
 *
 * Proper nouns will legitimately repeat (the city's own name, the country), so a stoplist of the
 * city and country names is applied before flagging.
 *
 * Usage: node check_overlap.cjs <repoRoot> <extensions.json> [--shingle N]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXT = process.argv[2];
const N = (() => { const i = process.argv.indexOf('--shingle'); return i > 0 ? Number(process.argv[i + 1]) : 5; })();

const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guide-content.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));
const ext = JSON.parse(fs.readFileSync(EXT, 'utf8'));

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9$., ]/g, ' ').replace(/\s+/g, ' ').trim();
const shingles = (s, n) => { const w = norm(s).split(' '); const out = new Set(); for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' ')); return out; };
// A fact token: a money figure, a bare number of two digits or more, or a capitalised word.
// Months, demonyms, continents and the handful of capitalised words that appear in almost every
// section are not facts. Flagging them buried the four real duplicates under forty lines of noise,
// which is how a check stops being read.
const COMMON = new Set(['january', 'february', 'march', 'april', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'european', 'union', 'schengen', 'western', 'american', 'africa',
  'asia', 'europe', 'british', 'french', 'spanish', 'portuguese', 'german', 'italian', 'dutch',
  'japanese', 'chinese', 'indian', 'tamil', 'finnish', 'samoan', 'malaysian', 'moroccan', 'south',
  'north', 'east', 'west', 'national', 'international', 'airport', 'island', 'river', 'street',
  'route', 'garden', 'caves', 'lake', 'mount', 'saint', 'university', 'starlink', 'helsinki']);
const facts = (s, stop) => {
  const out = new Set();
  for (const m of String(s).matchAll(/\$[\d,.]+|\b\d{2,}(?:[.,]\d+)?\b|\b[A-Z][a-zA-Z']{4,}\b/g)) {
    const t = m[0];
    const l = t.toLowerCase();
    if (stop.has(l) || COMMON.has(l)) continue;
    out.add(t);
  }
  return out;
};

let problems = 0, checked = 0;
for (const [key, addition] of Object.entries(ext)) {
  const [slug, field] = key.split('.');
  const cur = g[slug] && g[slug][field];
  if (!cur) { console.log('  ' + key + ': NO SUCH SECTION'); problems++; continue; }
  checked++;
  const city = byId[slug] || {};
  const stop = new Set([String(city.name || '').toLowerCase(), String(city.country || '').toLowerCase(),
    ...String(city.name || '').toLowerCase().split(/\s+/), ...String(city.country || '').toLowerCase().split(/\s+/),
    'the', 'this', 'that', 'they', 'anyone', 'against', 'which', 'there', 'most', 'both', 'from', 'with', 'than', 'what', 'when', 'while', 'about']);

  const a = shingles(cur, N), b = shingles(addition, N);
  const shared = [...b].filter((s) => a.has(s));
  if (shared.length) { console.log('  ' + key + ': REPEATS PHRASING -> "' + shared[0] + '"'); problems++; }

  const fa = facts(cur, stop), fb = facts(addition, stop);
  const dupFacts = [...fb].filter((f) => fa.has(f));
  if (dupFacts.length) { console.log('  ' + key + ': fact already in the section -> ' + dupFacts.slice(0, 4).join(', ')); problems++; }

  const w = String(cur).trim().split(/\s+/).length + String(addition).trim().split(/\s+/).length;
  if (w > 220) { console.log('  ' + key + ': would reach ' + w + ' words, over the 220 band'); problems++; }
}
console.log(`\n${checked} extension(s) checked, ${problems} flagged`);
process.exit(problems ? 1 : 0);

/**
 * Moves what every row of a source repeats into one record for that source.
 *
 * Measured before writing this: data/service-languages.json is 3.7MB for 5,398 rows, 1.4MB of it
 * note text, and 21 sentences that appear more than fifty times each account for 779KB of that. The
 * commonest is stored 1,384 times, word for word. There are only 357 distinct sources. At thirty
 * thousand rows the same shape would be roughly 20MB, 8MB of it two dozen repeated sentences, read
 * in full by every generator on every run.
 *
 * So each source gets a record holding the sentence its rows share, and the rows keep only what is
 * true of that entry. Nothing is rewritten and nothing is summarised: the note of a row is split
 * into the longest prefix and the longest suffix its source's rows have in common, and what is left
 * in the middle stays on the row. lib/service_data.cjs puts the three back together when it loads,
 * so every page renders exactly as before. This script refuses to write unless that is true for
 * every row, character for character.
 *
 * Usage: node scripts/normalize_service_sources.cjs [--preview]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const F = path.join(ROOT, 'data', 'service-languages.json');
const OUT = path.join(ROOT, 'data', 'service-sources.json');
const PREVIEW = process.argv.includes('--preview');
const db = JSON.parse(fs.readFileSync(F, 'utf8'));

if (db.providers.some((p) => p.source && !p.sourceUrl)) {
  console.log('already normalised: rows carry a source id, not a URL.');
  process.exit(0);
}

const P = require(path.join(ROOT, 'scripts', 'lib', 'service_prose.cjs'));

// A stable id: the host, plus enough of a hash of the URL to keep two lists from the same mission
// apart. Stable across runs because it depends only on the URL.
const idOf = (url) => {
  let host = 'source';
  try { host = new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'); } catch (e) { /* keep the fallback */ }
  return host.slice(0, 32) + '-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 6);
};

// The longest common prefix and suffix of a set of strings, cut back to a sentence boundary so the
// stored record reads as prose rather than as a fragment.
const commonPrefix = (list) => {
  let n = 0;
  const first = list[0];
  while (n < first.length && list.every((s) => s[n] === first[n])) n += 1;
  const cut = first.slice(0, n);
  const at = cut.lastIndexOf('. ');
  return at > 0 ? cut.slice(0, at + 2) : '';
};
const commonSuffix = (list) => {
  let n = 0;
  const first = list[0];
  while (n < first.length && list.every((s) => s.length > n && s[s.length - 1 - n] === first[first.length - 1 - n])) n += 1;
  const cut = first.slice(first.length - n);
  // Start the suffix at a sentence start, so it does not begin mid-word.
  const at = cut.indexOf('. ');
  const from = at >= 0 ? at + 2 : (/^[A-Z]/.test(cut) ? 0 : -1);
  return from >= 0 ? cut.slice(from) : '';
};

const byUrl = {};
db.providers.forEach((p) => { (byUrl[p.sourceUrl] = byUrl[p.sourceUrl] || []).push(p); });

const sources = {};
let savedChars = 0;
const problems = [];

Object.entries(byUrl).forEach(([url, rows]) => {
  const id = idOf(url);
  const notes = rows.map((r) => r.note || '');
  const prefix = notes.length > 1 ? commonPrefix(notes) : '';
  let suffix = notes.length > 1 ? commonSuffix(notes) : '';
  // A suffix that overlaps the prefix on the shortest note would double a sentence.
  const shortest = notes.reduce((a, b) => (a.length <= b.length ? a : b));
  if (prefix.length + suffix.length > shortest.length) suffix = '';

  const host = (() => { try { return new URL(url).hostname; } catch (e) { return url; } })();
  const pub = P.publisherOf(host);
  const checked = rows.map((r) => r.checked).filter(Boolean).sort();
  const evidence = [...new Set(rows.map((r) => r.evidence))];

  sources[id] = {
    url,
    host,
    publisher: pub.publisher || host,
    short: pub.short || host,
    kind: pub.kind || 'other',
    evidence: evidence.length === 1 ? evidence[0] : evidence,
    rows: rows.length,
    firstChecked: checked[0] || '',
    lastChecked: checked[checked.length - 1] || '',
    // What every row of this source says, stored once. The row keeps what is its own.
    notePrefix: prefix,
    noteSuffix: suffix,
  };

  rows.forEach((r) => {
    const note = r.note || '';
    const middle = note.slice(prefix.length, note.length - suffix.length);
    if (prefix + middle + suffix !== note) problems.push(r.city + '/' + r.name);
    r._middle = middle;
    savedChars += prefix.length + suffix.length;
  });
});

if (problems.length) {
  console.error('REFUSED: ' + problems.length + ' notes would not come back together unchanged, e.g. ' + problems[0]);
  process.exit(1);
}

const before = fs.statSync(F).size;
console.log(Object.keys(sources).length + ' sources for ' + db.providers.length + ' rows');
console.log('  repeated text moved into the source records: ' + Math.round(savedChars / 1024) + 'KB');
const withPrefix = Object.values(sources).filter((s) => s.notePrefix).length;
const withSuffix = Object.values(sources).filter((s) => s.noteSuffix).length;
console.log('  sources with a shared opening: ' + withPrefix + ', with a shared closing: ' + withSuffix);
const biggest = Object.entries(sources).sort((a, b) => (b[1].notePrefix.length + b[1].noteSuffix.length) * b[1].rows
  - (a[1].notePrefix.length + a[1].noteSuffix.length) * a[1].rows).slice(0, 4);
biggest.forEach(([id, s]) => console.log('    ' + String(s.rows).padStart(4) + ' rows x '
  + (s.notePrefix.length + s.noteSuffix.length) + ' chars  ' + id));

if (PREVIEW) {
  const [id, s] = biggest[0];
  console.log('\n  ' + id);
  console.log('    prefix: ' + JSON.stringify(s.notePrefix.slice(0, 150)));
  console.log('    suffix: ' + JSON.stringify(s.noteSuffix.slice(0, 150)));
  const sample = byUrl[s.url][0];
  console.log('    a row keeps: ' + JSON.stringify(sample._middle.slice(0, 150)));
  process.exit(0);
}

// Rewrite the rows: the source id replaces the URL, the middle replaces the note.
db.providers = db.providers.map((p) => {
  const out = {
    city: p.city,
    name: p.name,
    category: p.category,
    languages: p.languages,
  };
  if (p.url) out.url = p.url;
  out.source = idOf(p.sourceUrl);
  out.evidence = p.evidence;
  out.checked = p.checked;
  if (p.area) out.area = p.area;
  if (p._middle) out.note = p._middle;
  return out;
});

fs.writeFileSync(OUT, JSON.stringify(sources, null, 1) + '\n');
fs.writeFileSync(F, JSON.stringify(db, null, 2) + '\n');
const after = fs.statSync(F).size + fs.statSync(OUT).size;
console.log('  data/service-languages.json + data/service-sources.json: '
  + Math.round(before / 1024) + 'KB -> ' + Math.round(after / 1024) + 'KB');

/**
 * Reads every source again and reports the published rows whose language claim is now read better.
 *
 * The ingest only ever ADDS. A row keeps the languages it was read with on the day it was taken, so
 * every repair to the lexicon or to a reader helps the next batch and leaves the rows already
 * published exactly as wrong as they were. That is invisible: nothing fails, no gate complains, and
 * the row sits on the site understating what its provider speaks.
 *
 * The Tokyo list is the case that prompted this. It writes "Dr Hiroshi Yamakawa (francais, anglais,
 * japonais)" and the lexicon could not read japonais, so those rows went out claiming French and
 * English. Adding the word fixes what is read tomorrow and not what was read last week.
 *
 * This script re-runs each source's recorded reader, matches what comes back to what is published by
 * name within the city, and prints the difference. It writes nothing without --apply, and with
 * --apply it only ever ADDS a language to a row: never removes one, because a language already
 * published may have come from a second source that this one knows nothing about.
 *
 * Usage:
 *   node scripts/recheck_languages.cjs            # report
 *   node scripts/recheck_languages.cjs --apply    # add the languages found
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const F = path.join(ROOT, 'data', 'service-languages.json');
const db = JSON.parse(fs.readFileSync(F, 'utf8'));
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'verified-consular-sources.json'), 'utf8'));

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const TITLE_WORD = /^(dr|dre|prof|med|dent|phil|phd|llm|mba|ma|dipl|mme|mr|m|maitre|mtre|herr|frau|monsieur|madame|judr|mgr|avv|dott|dottssa)$/;
const key = (s) => fold(s).replace(/ae/g, 'a').replace(/ue/g, 'u').replace(/oe/g, 'o')
  .split(/[^a-z0-9]+/).filter(Boolean).filter((w) => !TITLE_WORD.test(w)).sort().join(' ');

// Published rows by the source they cite, then by name, which is how a re-read is matched back.
const published = new Map();
db.providers.forEach((p) => {
  if (!p.sourceUrl) return;
  if (!published.has(p.sourceUrl)) published.set(p.sourceUrl, new Map());
  published.get(p.sourceUrl).set(key(p.name), p);
});

const seen = new Set();
const sources = reg.filter((s) => {
  if (s.hold || !s.parser || !published.has(s.url)) return false;
  if (seen.has(s.url)) return false;
  seen.add(s.url);
  return true;
});

const gains = [];
let read = 0;
sources.forEach((s, i) => {
  if (!fs.existsSync(s.file)) return;
  let rows = [];
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', s.parser), s.file, ...(s.parserArgs || []), '--json'],
      { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
    const j = JSON.parse(out);
    rows = Array.isArray(j) ? j : (j.rows || []);
  } catch (e) { return; }
  read += 1;
  const here = published.get(s.url);
  rows.forEach((r) => {
    const p = here.get(key(r.name || ''));
    if (!p) return;
    const add = (r.languages || []).filter((l) => !p.languages.includes(l) && db._languages[l]);
    if (add.length) gains.push({ p, add, source: s.url });
  });
  if ((i + 1) % 40 === 0) console.error('  ...' + (i + 1) + '/' + sources.length);
});

const byLang = {};
gains.forEach((g) => g.add.forEach((l) => { byLang[l] = (byLang[l] || 0) + 1; }));
console.log(read + ' of ' + sources.length + ' sources re-read; ' + gains.length
  + ' published rows would gain a language they already claim on their own source.\n');
Object.entries(byLang).sort((a, b) => b[1] - a[1]).forEach(([l, n]) =>
  console.log('  ' + String(n).padStart(4) + '  ' + (db._languages[l] || l)));
console.log('');
gains.slice(0, 25).forEach((g) => console.log('   ' + g.p.city.padEnd(13)
  + g.p.name.slice(0, 34).padEnd(36) + g.p.languages.join(',').padEnd(16) + '+ ' + g.add.join(',')));

if (!APPLY) { console.log('\nReport only. Re-run with --apply to add these.'); process.exit(0); }
gains.forEach((g) => {
  g.p.languages = [...new Set([...g.p.languages, ...g.add])].sort();
  g.p.note = (g.p.note || '').trim()
    + ' Re-read against the same source on ' + new Date().toISOString().slice(0, 10)
    + ', which states ' + g.add.map((l) => db._languages[l] || l).join(', ') + ' as well.';
});
fs.writeFileSync(F, JSON.stringify(db, null, 2) + '\n');
console.log('\nadded a language to ' + gains.length + ' rows.');

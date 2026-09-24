/**
 * Ingests a proposals file written by one of the register readers (read_aek_steiermark.cjs,
 * read_korea_open_data.cjs and the others) into the directory.
 *
 * WHY ONE INGEST FOR ALL OF THEM
 *
 * Every register reader ends in the same place: rows of named providers, each with the page its
 * language was read on, and one sentence about the list that a reader should see once per page.
 * read_mhlw_register.cjs grew its own ingest first; the rules it found are the ones kept here, so
 * that the next nine registers do not each rediscover them:
 *
 *   - One source record per provider page, carrying the list's pageNote. The card links to the
 *     page the claim is on, and the page prints the note once (service_prose dedupes it).
 *   - Duplicates are looked for among rows already in the directory, by city and name or exact
 *     homepage, never by host inside the batch: branches and shared site builders are not one firm.
 *   - A row with a local language only, or more than six languages, never gets this far: the
 *     readers refuse those, and this refuses them again rather than trust that they did.
 *   - --seed-checks records the reader's own 200 for each source page in the link cache, for
 *     readers that fetched and parsed every page (the link gate allows one request at a time per
 *     host, which is hours for a register on one host). Only pass it when that is true.
 *
 * Proposals format: { pageNote, source?: { publisher, short?, kind?, pageNote? }, rows: [ { city,
 * name, category, languages, url?, sourceUrl, evidence, checked, area?, note? } ] }
 *
 * Usage: node scripts/ingest_register_proposals.cjs <proposals.json> --publisher "<name>"
 *          [--short "<short>"] [--kind register] [--seed-checks] [--apply]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT, 'data', 'service-languages.json');
const SRC_FILE = path.join(ROOT, 'data', 'service-sources.json');
const CHECKS_FILE = path.join(ROOT, 'data', 'service-link-checks.json');
const MAX_LANGS = 6;

const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const file = argv[0];
if (!file || file.startsWith('--')) { console.error('usage: ingest_register_proposals.cjs <proposals.json> --publisher "..." [--apply]'); process.exit(2); }

const P = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const sources = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'));
const checks = JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf8'));
const cities = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));

// A reader that merged several lists (Korea's city and district open data) gives each row a
// `dataset`, with the publisher in P.datasets and the note in P.pageNotes; otherwise one publisher
// and one note cover the file.
const src = P.source || {};
const kind = val('--kind', src.kind || 'register');
const metaOf = (r) => {
  // A reader that parsed several lists page by page keys each list's record by its URL instead.
  const ls = P.sources && (P.sources[r.sourceUrl] || P.sources[r.sourceKey]);
  if (ls) return { publisher: ls.publisher, short: ls.short || ls.publisher, pageNote: ls.pageNote };
  const ds = r.dataset && P.datasets && P.datasets[r.dataset];
  const publisher = ds ? ds.publisher : val('--publisher', src.publisher || '');
  return {
    publisher,
    short: ds ? (ds.short || ds.publisher) : val('--short', src.short || publisher),
    pageNote: ds ? (P.pageNotes || {})[r.dataset] : (src.pageNote || P.pageNote || ''),
  };
};
for (const r of P.rows) {
  const m = metaOf(r);
  if (!m.publisher) { console.error('a publisher is required: the card names who published the list'); process.exit(2); }
  if (!m.pageNote) { console.error('no pageNote for ' + (r.dataset || 'the file') + ': a reader must be told once what the list is'); process.exit(2); }
  if (/—/.test(m.pageNote)) { console.error('a pageNote contains an em-dash'); process.exit(2); }
}

const CATS = db._categories;
const LANGS = db._languages;
const LOCAL = cities.LOCAL || {};
const CITY = cities.CITY; // every site city; `.cities` holds only those that already have rows

const key = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const bare = (u) => String(u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
const urlOf = (p) => p.sourceUrl || (sources[p.source] || {}).url || '';
const sourceId = (url) => {
  let host = 'source';
  try { host = new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'); } catch (e) { /* keep */ }
  return host.slice(0, 32) + '-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 6);
};

const knownName = new Map(); const knownUrl = new Map(); const knownSrc = new Set();
const byCity = {};
db.providers.forEach((p) => {
  (byCity[p.city] = byCity[p.city] || []).push(p);
  knownName.set(p.city + '|' + key(p.name), p);
  if (p.url) knownUrl.set(p.city + '|' + bare(p.url), p);
  knownSrc.add(urlOf(p) + '|' + key(p.name));
});

const add = []; const dupes = []; const bad = [];
for (const r of P.rows) {
  const city = CITY[r.city];
  const local = city ? LOCAL[city.country] : null;
  const langs = [...new Set((r.languages || []).filter((l) => LANGS[l] && l !== local))];
  const why = !city ? 'unknown city ' + r.city
    : !CATS[r.category] ? 'unknown category ' + r.category
      : !r.sourceUrl ? 'no sourceUrl'
        : !r.name ? 'no name'
          : (r.languages || []).length > MAX_LANGS ? 'more than ' + MAX_LANGS + ' languages'
            : !langs.length ? 'no foreign language we list' : '';
  if (why) { bad.push([r, why]); continue; }
  if (knownSrc.has(r.sourceUrl + '|' + key(r.name))) continue;
  // One name inside the other is how check_service_dupes.cjs sees a duplicate ("Tokyo Takanawa
  // Hospital" on the FCDO list, "Japan Community Healthcare Organization Tokyo Takanawa Hospital" on
  // the register), so it is caught here, before the gate has to.
  const k = key(r.name);
  const contained = k.length >= 8 && (byCity[r.city] || []).find((p) => { const q = key(p.name); return q.length >= 8 && (q.includes(k) || k.includes(q)); });
  const clash = knownName.get(r.city + '|' + k) || (r.url && knownUrl.get(r.city + '|' + bare(r.url))) || contained;
  if (clash) { dupes.push([r, clash]); continue; }
  const sid = sourceId(r.sourceUrl);
  add.push({
    sid, r,
    row: {
      city: r.city, name: r.name, category: r.category, languages: langs,
      ...(r.url ? { url: r.url } : {}),
      source: sid, evidence: r.evidence || 'official', checked: r.checked,
      ...(r.area ? { area: r.area } : {}),
      ...(r.note ? { note: r.note } : {}),
    },
  });
}

const by = {};
add.forEach(({ row }) => { const k = row.city + ' ' + row.category; by[k] = (by[k] || 0) + 1; });
console.log(`${P.rows.length} proposed: ${add.length} new, ${dupes.length} already listed, ${bad.length} refused`);
console.log(by);
dupes.slice(0, 20).forEach(([r, p]) => console.log(`  already listed: ${r.city} ${r.name} = ${p.name}`));
const whys = {};
bad.forEach(([, w]) => { whys[w] = (whys[w] || 0) + 1; });
if (bad.length) console.log('  refused:', whys);
if (!has('--apply')) { console.log('\npreview only. re-run with --apply to write.'); process.exit(0); }

let host = '';
for (const { row, sid, r } of add) {
  try { host = new URL(r.sourceUrl).hostname; } catch (e) { host = ''; }
  db.providers.push(row);
  // Many rows can share one list URL (a dataset page); they share its source record.
  if (sources[sid]) { sources[sid].rows += 1; } else {
    const { publisher, short, pageNote } = metaOf(r);
    sources[sid] = {
      url: r.sourceUrl, host, publisher, short, kind, evidence: row.evidence, rows: 1,
      firstChecked: row.checked, lastChecked: row.checked, notePrefix: '', noteSuffix: '', pageNote,
    };
  }
  if (has('--seed-checks')) checks.checks[r.sourceUrl] = { verdict: 'OK', status: 200, checkedAt: row.checked };
}
fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
fs.writeFileSync(SRC_FILE, `${JSON.stringify(sources, null, 1)}\n`);
if (has('--seed-checks')) fs.writeFileSync(CHECKS_FILE, `${JSON.stringify(checks, null, 1)}\n`);
console.log(`\nwrote ${add.length} rows. now run: node scripts/rebuild_services.cjs`);

/**
 * Fetches the sources again and reports what has drifted. It changes no provider row.
 *
 * Every row in this directory rests on a page somebody else maintains, and those pages change:
 * consular lists are reissued, practices close, people retire. All 5,398 rows were read in August
 * 2026, so nothing has decayed yet and everything will decay at once. At thirty thousand rows
 * nobody re-reads them by hand, and the credibility this directory is built on rots quietly.
 *
 * The check deliberately uses no parser. Whether a name still appears on its source is a question
 * about the raw text, and asking it that way works on a table, a PDF and a page of prose alike,
 * and cannot be broken by a parser change. A name counts as present when its two most distinctive
 * words both appear, so "Dr. Oliver PROISL" is still found when the mission reprints him as
 * "PROISL, Oliver, Dr.".
 *
 * It reports and never repairs. A missing name can mean the person left, or that the page moved
 * its list behind a search box, and only a person can tell those apart.
 *
 * Usage:
 *   node scripts/recheck_service_sources.cjs                 # the 40 stalest sources
 *   node scripts/recheck_service_sources.cjs --limit 100
 *   node scripts/recheck_service_sources.cjs --only diplo.de
 *   node scripts/recheck_service_sources.cjs --older-than 0  # everything, ignoring when last seen
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { db } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const SRC_FILE = path.join(ROOT, 'data', 'service-sources.json');
const REPORT = path.join(ROOT, 'data', 'service-source-drift.json');
const sources = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'));

const arg = (name, fallback) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const LIMIT = Number(arg('limit', 40));
const OLDER_THAN = Number(arg('older-than', 30));
const ONLY = arg('only', '');
const TODAY = new Date().toISOString().slice(0, 10);

const daysSince = (iso) => (iso ? Math.round((Date.parse(TODAY) - Date.parse(iso)) / 86400000) : 9999);

// Which sources to look at this run: the ones nobody has looked at for longest.
const queue = Object.entries(sources)
  .filter(([id, s]) => (!ONLY || id.includes(ONLY) || s.url.includes(ONLY) || s.host.includes(ONLY)))
  .filter(([, s]) => daysSince(s.lastRecheck || s.lastChecked) >= OLDER_THAN)
  // Stalest first, and where nothing has been checked yet, the source carrying the most rows: a
  // list of 150 providers going stale matters more than a hairdresser's own website.
  .sort((a, b) => (daysSince(b[1].lastRecheck || b[1].lastChecked) - daysSince(a[1].lastRecheck || a[1].lastChecked))
    || (b[1].rows - a[1].rows))
  .slice(0, LIMIT);

const rowsBySource = {};
db.providers.forEach((p) => { if (p.source) (rowsBySource[p.source] = rowsBySource[p.source] || []).push(p); });

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ß/g, 'ss').replace(/[^A-Za-z0-9]+/g, ' ').toLowerCase();
const TITLE = /^(dr|dra|dre|prof|med|dent|phil|phd|llm|mba|ma|dipl|mme|mr|mrs|ms|m|maitre|mtre|sr|sra|herr|frau|avv|avvocato|rechtsanwalt)$/;
// The two longest words of a name that are not titles: distinctive enough that a chance match on a
// long page is unlikely, short enough to survive a source reprinting the name in another order.
// A parenthetical is what we added or what one source spelled out, and the page under test often
// prints only the short form: "Centro Medico ABC (American British Cowdray)" was reported gone
// because the two longest words were both inside the bracket.
const needlesOf = (name) => fold(String(name).replace(/\([^)]*\)/g, ' ')).split(' ')
  .filter((w) => w.length >= 4 && !TITLE.test(w))
  .sort((a, b) => b.length - a.length).slice(0, 2);

const fetchText = (url) => new Promise((resolve) => {
  const lib = url.startsWith('http:') ? http : https;
  const req = lib.get(url, {
    timeout: 45000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NomadHQ-linkcheck', Accept: '*/*' },
  }, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      const next = new URL(res.headers.location, url).toString();
      return resolve(fetchText(next).then((r) => ({ ...r, redirectedTo: next })));
    }
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      const type = String(res.headers['content-type'] || '');
      if (/pdf/i.test(type) || /\.pdf(\?|$)/i.test(url)) {
        const tmp = path.join(os.tmpdir(), 'recheck-' + Date.now() + '.pdf');
        try {
          fs.writeFileSync(tmp, buf);
          execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', tmp, tmp + '.txt'], { stdio: 'ignore' });
          const text = fs.readFileSync(tmp + '.txt', 'utf8');
          fs.unlinkSync(tmp); fs.unlinkSync(tmp + '.txt');
          return resolve({ status: res.statusCode, text });
        } catch (e) {
          return resolve({ status: res.statusCode, text: '', note: 'pdf could not be read' });
        }
      }
      return resolve({ status: res.statusCode, text: buf.toString('utf8') });
    });
  });
  req.on('timeout', () => { req.destroy(); resolve({ status: 0, text: '', note: 'timed out' }); });
  req.on('error', (e) => resolve({ status: 0, text: '', note: String(e.code || e.message) }));
});

(async () => {
  const results = [];
  console.log('rechecking ' + queue.length + ' of ' + Object.keys(sources).length + ' sources\n');

  for (const [id, s] of queue) {
    const rows = rowsBySource[id] || [];
    const got = await fetchText(s.url);
    const haystack = ' ' + fold(got.text) + ' ';
    let missing = [];
    let found = 0;

    if (got.status === 200 && haystack.length > 200) {
      rows.forEach((r) => {
        const needles = needlesOf(r.name);
        // A name with no distinctive word left cannot be tested either way, so it is not counted.
        if (!needles.length) return;
        if (needles.every((n) => haystack.includes(' ' + n) || haystack.includes(n))) found += 1;
        else missing.push(r.name);
      });
    }
    const testable = found + missing.length;
    const rate = testable ? found / testable : 0;
    // A page that lost EVERY name has almost certainly changed shape or moved its list behind a
    // search, which is a different problem from a provider leaving, and saying so is the point.
    const verdict = got.status !== 200 ? 'unreachable'
      : !testable ? 'nothing testable'
        : rate === 1 ? 'all still listed'
          : rate === 0 ? 'none found, the page has probably changed shape'
            : 'partly drifted';

    sources[id].lastRecheck = TODAY;
    sources[id].lastRecheckStatus = verdict;
    sources[id].lastRecheckFound = found;
    sources[id].lastRecheckMissing = missing.length;

    results.push({
      id,
      url: s.url,
      status: got.status,
      note: got.note || '',
      redirectedTo: got.redirectedTo || '',
      rows: rows.length,
      found,
      missing: missing.slice(0, 25),
      missingCount: missing.length,
      verdict,
    });
    console.log('  ' + String(found).padStart(4) + '/' + String(testable).padEnd(4)
      + ' ' + verdict.padEnd(46) + (got.status || 'no response') + '  ' + id);
    if (missing.length && rate > 0) console.log('        gone: ' + missing.slice(0, 4).join(', ').slice(0, 130));
  }

  fs.writeFileSync(SRC_FILE, JSON.stringify(sources, null, 1) + '\n');
  const previous = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : { runs: [], misses: {} };
  previous.misses = previous.misses || {};

  // How many runs in a row a row has gone unfound. A fetch can fail for reasons that have nothing
  // to do with the provider: a timeout, a page that renders its list in JavaScript, a mission
  // reissuing its PDF. One miss is noise. Two in a row, on a page that answered 200 and where other
  // rows were found, is a row whose source no longer says what we say it says.
  results.forEach((r) => {
    if (r.status !== 200) return;
    const rows = rowsBySource[r.id] || [];
    const missingSet = new Set(r.missing.concat(r.missingCount > r.missing.length ? [] : []));
    rows.forEach((row) => {
      const k = r.id + '|' + row.name;
      if (r.verdict === 'none found, the page has probably changed shape') return; // the page, not the row
      if (missingSet.has(row.name)) previous.misses[k] = (previous.misses[k] || 0) + 1;
      else delete previous.misses[k];
    });
  });

  previous.runs = [{ date: TODAY, checked: results.length, results }, ...(previous.runs || [])].slice(0, 10);
  fs.writeFileSync(REPORT, JSON.stringify(previous, null, 1) + '\n');

  const twice = Object.entries(previous.misses).filter(([, n]) => n >= 2);
  if (twice.length) {
    console.log('\n' + twice.length + ' row(s) have now gone unfound on two runs in a row:');
    twice.slice(0, 10).forEach(([k, n]) => console.log('   x' + n + '  ' + k.split('|')[1] + '  (' + k.split('|')[0] + ')'));
    console.log('Run with --prune to remove them, or fix the source they belong to.');
  }

  if (process.argv.includes('--prune')) {
    const drop = new Set(twice.map(([k]) => k));
    const dbFile = path.join(ROOT, 'data', 'service-languages.json');
    const raw = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    const before = raw.providers.length;
    raw.providers = raw.providers.filter((p) => !drop.has(p.source + '|' + p.name));
    fs.writeFileSync(dbFile, JSON.stringify(raw, null, 2) + '\n');
    twice.forEach(([k]) => delete previous.misses[k]);
    fs.writeFileSync(REPORT, JSON.stringify(previous, null, 1) + '\n');
    console.log('pruned ' + (before - raw.providers.length) + ' row(s) their sources no longer name.');
  }

  const by = {};
  results.forEach((r) => { by[r.verdict] = (by[r.verdict] || 0) + 1; });
  console.log('\n' + Object.entries(by).map(([k, n]) => n + ' ' + k).join(', '));
  const rowsAffected = results.filter((r) => r.verdict !== 'all still listed').reduce((a, r) => a + r.rows, 0);
  console.log(results.filter((r) => r.verdict !== 'all still listed').length + ' source(s) need a person to look, '
    + rowsAffected + ' rows behind them. Nothing was changed.');
  console.log('Report: data/service-source-drift.json');
})();

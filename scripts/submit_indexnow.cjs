/**
 * Tells IndexNow which URLs have changed, so Bing, Yandex, Seznam and Naver see them without
 * waiting for a crawl.
 *
 * The important design decision here is WHAT to submit. Pushing all 2,196 URLs on every deploy is
 * the standard way to get a site's submissions deprioritised: the protocol is explicitly for pages
 * that changed, and engines treat a firehose as noise. So this submits a delta.
 *
 * The delta comes from git: every file changed between the last submitted commit, recorded in
 * data/indexnow.json, and HEAD, mapped to the URL it serves under cleanUrls, then intersected with
 * sitemap.xml so nothing noindexed or unlisted is ever sent. The first run has no baseline and
 * submits the whole sitemap once, which is the correct way to initialise and is what the protocol
 * expects for a site that has never used it.
 *
 * Dry run by default. --apply is required to make the request, because this publishes to four
 * external services and is not undoable.
 *
 * Usage:
 *   node scripts/submit_indexnow.cjs                 what would be sent, and why
 *   node scripts/submit_indexnow.cjs --apply         send it
 *   node scripts/submit_indexnow.cjs --all --apply   ignore the delta and send the whole sitemap
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'data', 'indexnow.json');
const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000;   // protocol maximum per request

let state;
try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {
  console.error('data/indexnow.json is missing. Run: node scripts/build_indexnow_key.cjs');
  process.exit(1);
}
if (!state.key) { console.error('no key in data/indexnow.json. Run build_indexnow_key.cjs'); process.exit(1); }

// Every URL the site actually publishes. Anything not here is never submitted, which is what keeps
// a noindexed or orphaned page out of the request.
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const published = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

// A repo path maps to the URL it serves: cleanUrls strips .html, and index.html is the directory.
const toUrl = (rel) => {
  if (!rel.endsWith('.html')) return null;
  let p = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  if (p === 'index') return 'https://' + state.host + '/';
  if (p.endsWith('/index')) p = p.slice(0, -6);
  return 'https://' + state.host + '/' + p;
};

let urls, reason;
if (ALL || !state.lastCommit) {
  urls = [...published];
  reason = ALL ? 'the --all flag was passed'
    : 'no previous submission is recorded, so this is the one-off initialisation';
} else {
  let changed = [];
  try {
    const out = execFileSync('git', ['diff', '--name-only', state.lastCommit, 'HEAD'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    changed = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.error('git diff against ' + state.lastCommit + ' failed: ' + e.message);
    console.error('If that commit is gone, run once with --all to re-baseline.');
    process.exit(1);
  }
  const mapped = changed.map(toUrl).filter(Boolean);
  urls = [...new Set(mapped)].filter((u) => published.has(u));
  reason = changed.length + ' file(s) changed since ' + state.lastCommit.slice(0, 9)
    + '; ' + mapped.length + ' are pages, ' + urls.length + ' of those are in the sitemap';
}

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

console.log('IndexNow submission');
console.log('  host:        ' + state.host);
console.log('  key file:    ' + state.keyLocation);
console.log('  reason:      ' + reason);
console.log('  URLs:        ' + urls.length + (urls.length > BATCH ? '  (will be sent in batches of ' + BATCH + ')' : ''));
if (urls.length) console.log('  sample:      ' + urls.slice(0, 5).join('\n               '));

if (!urls.length) { console.log('\nnothing changed since the last submission. Not sending.'); process.exit(0); }
if (!APPLY) { console.log('\ndry run. Pass --apply to send.'); process.exit(0); }

const post = (list) => new Promise((res, rej) => {
  const body = JSON.stringify({ host: state.host, key: state.key, keyLocation: state.keyLocation, urlList: list });
  const req = https.request(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
  }, (r) => {
    let b = ''; r.on('data', (d) => { b += d; });
    r.on('end', () => res({ status: r.statusCode, body: b.slice(0, 400) }));
  });
  req.on('error', rej);
  req.write(body); req.end();
});

(async () => {
  let sent = 0, failed = 0;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const r = await post(batch);
    // 200 accepted, 202 accepted but key still being validated. Anything else is a real failure.
    if (r.status === 200 || r.status === 202) { sent += batch.length; console.log('  sent ' + batch.length + ' -> HTTP ' + r.status); }
    else { failed += batch.length; console.error('  FAILED ' + batch.length + ' -> HTTP ' + r.status + ' ' + r.body); }
  }
  if (failed) {
    console.error('\n' + failed + ' URL(s) were not accepted. State not advanced, so a re-run retries them.');
    console.error('HTTP 403 usually means the key file is not live at ' + state.keyLocation + ' yet.');
    process.exit(1);
  }
  state.lastCommit = head;
  state.lastSubmitted = new Date().toISOString();
  state.lastCount = sent;
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  console.log('\n' + sent + ' URL(s) submitted. Baseline advanced to ' + head.slice(0, 9) + '.');
})();

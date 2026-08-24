/**
 * Checks every link in data/service-languages.json actually resolves, and reports what it
 * resolved TO, so a human can confirm it is the right business rather than a parked domain,
 * a redirect to some aggregator, or a 404.
 *
 * For each unique url and sourceUrl: follows redirects, records the final URL, HTTP status and
 * the page <title>. It deliberately does not judge; a title is the evidence, the call is yours.
 *
 * A 403 is not a dead link. Cloudflare and Facebook block non-browser clients, so those are
 * reported as BLOCKED and must be checked by hand rather than silently dropped.
 *
 * Nor is a transport failure. The verdicts are deliberately separate, because only one of them
 * is evidence that a link is wrong:
 *   DEAD         404 or 410: the server says this does not exist. The only verdict that fails.
 *   SERVER       5xx: that site is broken today, which is not the same as our link being wrong.
 *   BLOCKED      403, 406, 429, 999 and the rest: the server refused this client, not the link.
 *   TLS          a certificate chain browsers accept and Node does not.
 *   UNREACHABLE  refused, timed out or DNS. Often this network rather than that server.
 *
 * It ran one link at a time, waited 400ms between them, and gave up to three attempts of twenty
 * seconds each to a link that does not answer. That is a minute per bad link and 2,089 links, and
 * a run started at half past five was still going the next morning with nothing printed, because
 * every line was held back until the end. A gate the standing rule says to run after every data
 * change, and which cannot be run, is not a gate. So:
 *
 *   Sixteen at a time, and never two at once against the same host. The old 400ms sleep was
 *   politeness towards a server, and one host at a time is the same politeness without making
 *   every other host on the list wait for it.
 *
 *   Progress goes to stderr as it happens, so a long run can be watched instead of guessed at.
 *
 *   What answered is remembered in data/service-link-checks.json. A link that answered OK is not
 *   asked again for thirty days; everything else, and every link the file has not seen, is checked
 *   every run. That is what makes this runnable after a data change: a batch adds forty links, so
 *   the run checks forty rather than two thousand. --all ignores the file and checks everything,
 *   which is what a monthly sweep should do.
 *
 * The point of the cache is not speed for its own sake. The failure this tool exists to catch is a
 * URL that was never real, and those arrive with new rows, which are exactly the links no cache
 * can skip.
 *
 * Usage:
 *   node scripts/verify_service_links.cjs             the links not checked recently
 *   node scripts/verify_service_links.cjs --new-only  only links never seen before; the build gate
 *   node scripts/verify_service_links.cjs --all       every link, ignoring what was remembered
 *   node scripts/verify_service_links.cjs --json      machine readable, for a follow-up pass
 *   node scripts/verify_service_links.cjs --concurrency 8
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const JSON_OUT = process.argv.includes('--json');
const ALL = process.argv.includes('--all');
const NEW_ONLY = process.argv.includes('--new-only');
const conc = process.argv.indexOf('--concurrency');
const CONCURRENCY = conc > 0 ? Math.max(1, parseInt(process.argv[conc + 1], 10) || 16) : 16;
const CACHE_FILE = path.join(ROOT, 'data', 'service-link-checks.json');
const FRESH_DAYS = 30;

// Through the shared loader: the rows name their source by id and the shared sentence lives on
// the source record, so reading the JSON directly would give a row with no URL and half a note.
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const UA = 'Mozilla/5.0 (compatible; TheNomadHQ/1.0; +https://thenomadhq.com) link-verification';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Which providers reference each URL, so a failure names the rows it affects.
const refs = new Map();
for (const p of DB.providers) {
  for (const [field, u] of [['url', p.url], ['sourceUrl', p.sourceUrl]]) {
    if (!u) continue;
    if (!refs.has(u)) refs.set(u, []);
    refs.get(u).push(`${p.name} [${p.city}/${field}]`);
  }
}

function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').trim().slice(0, 120);
}

// Three attempts with backoff. A single transient failure used to mark a live link DEAD, and
// acting on that would delete perfectly good rows: on 2026-08-12 one run reported six healthy
// URLs as dead and all six answered on the retry. Only a repeated failure counts.
async function check(url) {
  const out = { url, status: 0, finalUrl: '', title: '', verdict: '', note: '' };
  const ATTEMPTS = 3;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*', 'Accept-Language': 'en' } });
      clearTimeout(timer);
      out.status = res.status;
      out.finalUrl = res.url || url;
      const ct = res.headers.get('content-type') || '';
      if (res.ok && /html/i.test(ct)) {
        const body = await res.text();
        out.title = titleOf(body);
      }
      /**
       * Only "this does not exist" is evidence that a link is wrong.
       *
       * This used to call every 4xx and 5xx DEAD, and a full sweep returned 70 of them: 27 real
       * 404s, 20 status 999, which is what LinkedIn and a couple of Italian hosts answer to a
       * client they do not like, 17 server errors, and a handful of 406, 421 and 447. A 500 means
       * that site is broken this afternoon, not that we cited it wrongly, and deleting a row over
       * one would be the mistake this whole file warns about three paragraphs further down. The
       * gate that runs in the build chain fails on DEAD, so the difference decides whether a
       * rebuild stops for somebody else's outage.
       */
      if (res.ok) out.verdict = 'OK';
      else if (res.status === 404 || res.status === 410) out.verdict = 'DEAD';
      else if (res.status >= 500) out.verdict = 'SERVER';
      else out.verdict = 'BLOCKED';
      out.note = attempt > 1 ? `answered on attempt ${attempt}` : '';
      break;
    } catch (e) {
      // Node's fetch collapses every transport failure into the message "fetch failed"; the
      // useful part is in e.cause.code. Reporting them all as DEAD is what made this tool call a
      // clinic chain that is plainly online dead: its server just omits an intermediate
      // certificate, which a browser tolerates and Node does not.
      const code = (e && e.cause && e.cause.code) || (e && e.name === 'AbortError' ? 'ETIMEDOUT' : '') || '';
      const msg = (e && e.cause && e.cause.message) || (e && e.message) || 'request failed';
      out.verdict = /CERT|SIGNATURE|SSL|TLS/i.test(code) ? 'TLS' : 'UNREACHABLE';
      out.note = (code ? code + ': ' : '') + String(msg).slice(0, 60) + ` (${attempt}/${ATTEMPTS} attempts)`;
      if (attempt < ATTEMPTS) await sleep(1500 * attempt);
    }
  }
  // A redirect that lands on a different host is worth a human look: parked domains and
  // aggregator takeovers both look like a 200.
  try {
    if (out.finalUrl && new URL(out.finalUrl).hostname.replace(/^www\./, '') !== new URL(url).hostname.replace(/^www\./, '')) {
      out.note = (out.note ? out.note + '; ' : '') + 'HOST CHANGED';
    }
  } catch (e) { /* malformed URL already reported above */ }
  return out;
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

/**
 * Runs the checks with a cap on how many are in flight, and never two against one host.
 *
 * Both halves matter. Without the cap this opens two thousand sockets at once and the results are
 * a report about our own network. Without the per-host lock, a list where forty rows cite the same
 * embassy would hit that embassy forty times in a second, which is the thing the old sleep was
 * there to prevent.
 */
async function runAll(urls, onDone) {
  const results = [];
  const queue = urls.slice();
  const busyHosts = new Set();
  const deferred = [];
  let active = 0;
  return new Promise((resolve) => {
    const pump = () => {
      if (!queue.length && !deferred.length && !active) return resolve(results);
      while (active < CONCURRENCY && (queue.length || deferred.length)) {
        const pool = queue.length ? queue : deferred;
        const i = pool.findIndex((u) => !busyHosts.has(hostOf(u)));
        if (i < 0) {
          // Everything left is waiting on a host already in flight. Park it and let the
          // finishing request restart the pump, rather than spinning here.
          if (pool === queue) { deferred.push(...queue.splice(0)); continue; }
          break;
        }
        const url = pool.splice(i, 1)[0];
        const host = hostOf(url);
        busyHosts.add(host);
        active += 1;
        check(url).then((r) => {
          results.push(r);
          onDone(r, results.length);
        }).catch((e) => {
          results.push({ url, status: 0, finalUrl: '', title: '', verdict: 'UNREACHABLE', note: String((e && e.message) || e).slice(0, 60) });
          onDone(results[results.length - 1], results.length);
        }).finally(() => {
          busyHosts.delete(host);
          active -= 1;
          pump();
        });
      }
    };
    pump();
  });
}

const readCache = () => {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { return { _readme: '', checks: {} }; }
};

(async () => {
  const urls = [...refs.keys()];
  const cache = readCache();
  const cutoff = Date.now() - FRESH_DAYS * 86400000;
  // Only an OK answer is worth remembering. Anything else is a thing to look at again, and a link
  // the file has never seen is the one this tool is really for.
  const fresh = (u) => {
    const c = cache.checks[u];
    return !!c && c.verdict === 'OK' && Date.parse(c.checkedAt || '') > cutoff;
  };
  /**
   * Which links this run asks about.
   *
   * --new-only is for the build chain. Roughly one link in nine does not answer OK, most of them
   * blocked by a bot filter or slow rather than wrong, and re-checking those costs a minute each in
   * retries. Making every rebuild wait for them would put the gate straight back where it was.
   * A link the file has never seen is the one that matters anyway: the failure this tool exists to
   * catch is a URL that was never real, and those arrive with new rows.
   */
  const todo = ALL ? urls
    : NEW_ONLY ? urls.filter((u) => !cache.checks[u])
      : urls.filter((u) => !fresh(u));
  const skipped = urls.length - todo.length;
  if (!JSON_OUT) {
    process.stderr.write(todo.length + ' of ' + urls.length + ' links to check'
      + (skipped ? ', ' + skipped + (NEW_ONLY ? ' seen before' : ' answered OK within ' + FRESH_DAYS + ' days') + ' and taken as read' : '')
      + ', ' + CONCURRENCY + ' at a time\n');
  }
  let bad = 0;
  const results = await runAll(todo, (r, n) => {
    if (r.verdict !== 'OK') bad += 1;
    if (!JSON_OUT && (n % 25 === 0 || n === todo.length)) {
      process.stderr.write('  ' + n + '/' + todo.length + ' checked, ' + bad + ' not OK\n');
    }
  });
  // Remember this run, and carry forward what was taken as read so the file stays complete.
  const now = new Date().toISOString().slice(0, 10);
  results.forEach((r) => { cache.checks[r.url] = { verdict: r.verdict, status: r.status, checkedAt: now }; });
  Object.keys(cache.checks).forEach((u) => { if (!refs.has(u)) delete cache.checks[u]; });
  cache._readme = 'What verify_service_links.cjs found, so a routine run can check the links a data '
    + 'change actually added rather than all two thousand. Only an OK is remembered; anything else is '
    + 'checked again every run, as is any link not in here. Delete this file, or pass --all, to force '
    + 'a full sweep.';
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1) + '\n');
  if (JSON_OUT) { console.log(JSON.stringify(results, null, 2)); return; }

  const order = { DEAD: 0, SERVER: 1, UNREACHABLE: 2, TLS: 3, BLOCKED: 4, OK: 5 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict] || a.url.localeCompare(b.url));
  for (const r of results) {
    console.log(`${r.verdict.padEnd(8)}${String(r.status).padEnd(5)}${r.url}`);
    if (r.title) console.log(`             title: ${r.title}`);
    if (r.note) console.log(`             note:  ${r.note}`);
    if (r.finalUrl && r.finalUrl !== r.url) console.log(`             final: ${r.finalUrl}`);
    if (r.verdict !== 'OK') console.log(`             rows:  ${refs.get(r.url).join(' | ')}`);
  }
  const n = (v) => results.filter((r) => r.verdict === v).length;
  console.log('\nOnly DEAD means the server answered with an error. BLOCKED, TLS and UNREACHABLE');
  console.log('all need a human on a different network before any row is touched: acting on');
  console.log('them has already threatened perfectly good rows twice.');
  // The count goes last because the build chain prints a step's final line as its summary, and
  // "them has already threatened perfectly good rows twice" is not a summary of anything.
  console.log(`\n${results.length} links checked${skipped ? ' (' + skipped + ' taken as read from an earlier run)' : ''}: `
    + `${n('OK')} ok, ${n('BLOCKED')} blocked, ${n('SERVER')} server error, ${n('TLS')} tls, ${n('UNREACHABLE')} unreachable, ${n('DEAD')} dead`);
  process.exit(n('DEAD') ? 1 : 0);
})();

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
 * Usage:
 *   node scripts/verify_service_links.cjs           human readable
 *   node scripts/verify_service_links.cjs --json    machine readable, for a follow-up pass
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const JSON_OUT = process.argv.includes('--json');

const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
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
      if (res.status === 403 || res.status === 429) out.verdict = 'BLOCKED';
      else if (res.ok) out.verdict = 'OK';
      else out.verdict = 'DEAD';
      out.note = attempt > 1 ? `answered on attempt ${attempt}` : '';
      break;
    } catch (e) {
      out.verdict = 'DEAD';
      out.note = ((e && e.message) ? e.message.slice(0, 60) : 'request failed') + ` (${attempt}/${ATTEMPTS} attempts)`;
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

(async () => {
  const urls = [...refs.keys()];
  const results = [];
  for (const u of urls) {
    results.push(await check(u));
    await sleep(400);
  }
  if (JSON_OUT) { console.log(JSON.stringify(results, null, 2)); return; }

  const order = { DEAD: 0, BLOCKED: 1, OK: 2 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict] || a.url.localeCompare(b.url));
  for (const r of results) {
    console.log(`${r.verdict.padEnd(8)}${String(r.status).padEnd(5)}${r.url}`);
    if (r.title) console.log(`             title: ${r.title}`);
    if (r.note) console.log(`             note:  ${r.note}`);
    if (r.finalUrl && r.finalUrl !== r.url) console.log(`             final: ${r.finalUrl}`);
    if (r.verdict !== 'OK') console.log(`             rows:  ${refs.get(r.url).join(' | ')}`);
  }
  const n = (v) => results.filter((r) => r.verdict === v).length;
  console.log(`\n${results.length} unique links: ${n('OK')} ok, ${n('BLOCKED')} blocked (check by hand), ${n('DEAD')} dead`);
  process.exit(n('DEAD') ? 1 : 0);
})();

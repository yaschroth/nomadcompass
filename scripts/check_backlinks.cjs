/**
 * Does the firm we wrote to actually link back?
 *
 * Outreach without this is a count of letters posted. The tracker says 44 firms were contacted; it
 * cannot say whether any of it worked, and the only honest answer is on their websites. This
 * fetches them and looks for a link to thenomadhq.com.
 *
 * WHAT IT LOOKS AT
 *
 * The home page first, then up to four internal pages whose href or link text suggests the place a
 * site keeps outbound links: links, partners, resources, press, media, about, useful, empfehlungen,
 * enlaces, liens, collegamenti. Checking only the home page would miss most real placements, and
 * crawling a whole site to find one anchor is rude for what it buys.
 *
 * A FOLLOWED LINK AND A NOFOLLOW LINK ARE NOT THE SAME RESULT
 *
 * rel="nofollow", "sponsored" or "ugc" tells search engines to pass no authority. A directory that
 * counts those as wins is measuring politeness, not SEO, so they are reported in their own column.
 * The distinction is the difference between an outreach channel that works and one that feels like
 * it does.
 *
 * VERDICTS, kept separate for the reason verify_service_links.cjs keeps its own separate: only one
 * of them means "no link".
 *   FOUND        a link to the site, on one of the pages read
 *   NONE         the pages were read and hold no link. The only verdict that means no.
 *   BLOCKED      403, 406, 429, 999: the server refused this client, so nothing was read
 *   DEAD         404 or 410 on the home page: that site is gone
 *   SERVER       5xx: broken today, which says nothing about a link
 *   TLS          a certificate chain a browser accepts and Node does not
 *   UNREACHABLE  refused, timed out, or DNS
 *
 * Results are cached in data/backlink-checks.json. A firm that already has a followed link is not
 * re-read for thirty days; everything else is checked every run, because the whole point is to
 * catch the day a link appears.
 *
 * Usage:
 *   node scripts/check_backlinks.cjs                 every firm in the outreach catalogue
 *   node scripts/check_backlinks.cjs domains.txt     only these domains, one per line
 *   node scripts/check_backlinks.cjs --all           ignore the cache
 *   node scripts/check_backlinks.cjs --json          machine readable
 *   node scripts/check_backlinks.cjs --concurrency 8
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const ALL = ARGS.includes('--all');
const JSON_OUT = ARGS.includes('--json');
const ci = ARGS.indexOf('--concurrency');
const CONCURRENCY = ci > -1 ? Math.max(1, parseInt(ARGS[ci + 1], 10) || 8) : 8;
const LIST = ARGS.find((a) => !a.startsWith('--') && a !== String(CONCURRENCY));

const SITE = /(^|\/\/|\.)thenomadhq\.com/i;
const UA = 'TheNomadHQ-BacklinkCheck/1.0 (+https://thenomadhq.com/contact)';
const MAX_PAGES = 5;             // home page plus four
const FRESH_DAYS = 30;
const CACHE = path.join(ROOT, 'data', 'backlink-checks.json');

const LIKELY = /(links|partner|resource|press|media|about|useful|empfehlung|referenz|enlace|liens|collegamenti|parceiros|kooperation)/i;

const catalogue = path.join(ROOT, 'data', 'outreach-targets.json');
if (!fs.existsSync(catalogue)) {
  console.error('data/outreach-targets.json is missing (it is gitignored).');
  console.error('Rebuild it first:  node scripts/build_outreach_dataset.cjs');
  process.exit(1);
}
const { targets } = JSON.parse(fs.readFileSync(catalogue, 'utf8'));

let firms = targets.filter((t) => t.website && !t.aggregator);
if (LIST) {
  const want = new Set(fs.readFileSync(LIST, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
  firms = firms.filter((t) => want.has(t.id));
}

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const fresh = (id) => {
  const c = cache[id];
  if (ALL || !c || c.verdict !== 'FOUND' || c.nofollow) return false;
  return (Date.now() - Date.parse(c.at)) < FRESH_DAYS * 864e5;
};

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'en' },
    });
    clearTimeout(timer);
    const ct = res.headers.get('content-type') || '';
    const body = res.ok && /html/i.test(ct) ? await res.text() : '';
    return { status: res.status, url: res.url || url, body };
  } catch (e) {
    clearTimeout(timer);
    const code = (e && e.cause && e.cause.code) || (e && e.name === 'AbortError' ? 'ETIMEDOUT' : '') || '';
    return { status: 0, url, body: '', code };
  }
}

/** Every anchor on the page that points at us, with the rel and the visible text. */
function linksToUs(html, pageUrl) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const href = (attrs.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (!SITE.test(href)) continue;
    const rel = ((attrs.match(/rel\s*=\s*["']([^"']*)["']/i) || [])[1] || '').toLowerCase();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    out.push({ href, rel, text, on: pageUrl, nofollow: /nofollow|sponsored|ugc/.test(rel) });
  }
  return out;
}

/** Same-host pages worth a look, ranked by how likely they are to hold an outbound link. */
function candidates(html, baseUrl) {
  let base;
  try { base = new URL(baseUrl); } catch (e) { return []; }
  const seen = new Set();
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    let u;
    try { u = new URL(m[1], base); } catch (e) { continue; }
    if (u.hostname !== base.hostname) continue;
    if (!/^https?:$/.test(u.protocol)) continue;
    u.hash = '';
    const key = u.href;
    if (seen.has(key) || key === baseUrl) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ');
    if (!LIKELY.test(u.pathname) && !LIKELY.test(text)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= 40) break;
  }
  return out;
}

async function checkFirm(t) {
  const home = t.website.startsWith('http') ? t.website : 'https://' + t.website;
  const first = await get(home);

  if (!first.body) {
    let verdict = 'UNREACHABLE';
    if (first.status === 404 || first.status === 410) verdict = 'DEAD';
    else if (first.status >= 500) verdict = 'SERVER';
    else if (first.status > 0) verdict = 'BLOCKED';
    else if (/CERT|SIGNATURE|SSL|TLS/i.test(first.code || '')) verdict = 'TLS';
    return { id: t.id, name: t.name, verdict, status: first.status, pages: 1, hits: [] };
  }

  const hits = linksToUs(first.body, first.url);
  const pages = [first.url];
  if (!hits.length) {
    for (const u of candidates(first.body, first.url).slice(0, MAX_PAGES - 1)) {
      const r = await get(u);
      pages.push(u);
      if (!r.body) continue;
      const h = linksToUs(r.body, r.url);
      if (h.length) { hits.push(...h); break; }
    }
  }
  return {
    id: t.id,
    name: t.name,
    verdict: hits.length ? 'FOUND' : 'NONE',
    status: first.status,
    pages: pages.length,
    nofollow: hits.length ? hits.every((h) => h.nofollow) : false,
    hits: hits.slice(0, 3),
  };
}

(async () => {
  const todo = firms.filter((t) => !fresh(t.id));
  const skipped = firms.length - todo.length;
  if (!JSON_OUT) {
    process.stderr.write(`${firms.length} firms with a website; checking ${todo.length}`
      + (skipped ? `, ${skipped} already had a followed link inside ${FRESH_DAYS} days` : '')
      + `, ${CONCURRENCY} at a time\n`);
  }

  const results = [];
  // Never two requests at once against the same host: politeness that does not make every other
  // host on the list wait, which is the lesson already written into verify_service_links.cjs.
  const busy = new Set();
  const queue = todo.slice();
  const deferred = [];
  let active = 0;
  let done = 0;

  await new Promise((resolve) => {
    const pump = () => {
      if (!queue.length && !deferred.length && !active) return resolve();
      while (active < CONCURRENCY && (queue.length || deferred.length)) {
        const t = queue.shift() || deferred.shift();
        if (!t) break;
        let host = '';
        try { host = new URL(t.website.startsWith('http') ? t.website : 'https://' + t.website).hostname; } catch (e) { host = t.id; }
        if (busy.has(host)) { deferred.push(t); if (!queue.length && active) break; continue; }
        busy.add(host);
        active += 1;
        checkFirm(t).then((r) => {
          results.push(r);
          cache[r.id] = { verdict: r.verdict, nofollow: !!r.nofollow, at: new Date().toISOString() };
          done += 1;
          if (!JSON_OUT && done % 25 === 0) process.stderr.write(`  ${done}/${todo.length}\n`);
        }).catch(() => { done += 1; }).finally(() => {
          busy.delete(host);
          active -= 1;
          pump();
        });
      }
    };
    pump();
  });

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  if (JSON_OUT) { console.log(JSON.stringify(results, null, 2)); return; }

  const by = (v) => results.filter((r) => r.verdict === v);
  const found = by('FOUND');
  const followed = found.filter((r) => !r.nofollow);
  console.log('');
  console.log(`  checked        ${results.length}`);
  console.log(`  LINK FOUND     ${found.length}   of which followed: ${followed.length}, nofollow only: ${found.length - followed.length}`);
  console.log(`  no link        ${by('NONE').length}`);
  console.log(`  blocked        ${by('BLOCKED').length}   (server refused us, not an answer)`);
  console.log(`  dead           ${by('DEAD').length}`);
  console.log(`  server error   ${by('SERVER').length}`);
  console.log(`  tls            ${by('TLS').length}`);
  console.log(`  unreachable    ${by('UNREACHABLE').length}`);
  if (found.length) {
    console.log('\n  links found:');
    for (const r of found) {
      const h = r.hits[0];
      console.log(`    ${r.nofollow ? 'nofollow' : 'FOLLOWED'}  ${r.name}`);
      console.log(`              on ${h.on}`);
      console.log(`              -> ${h.href}${h.text ? `   "${h.text}"` : ''}`);
    }
  }
  console.log(`\n  remembered in data/backlink-checks.json`);
  process.exit(0);
})();

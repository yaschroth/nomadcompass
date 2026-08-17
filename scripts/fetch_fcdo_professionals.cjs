/**
 * Pulls lawyers and translators out of the FCDO's "Find a professional service abroad" service.
 *
 * This is a different and better source from the medical lists: every provider on it "has confirmed
 * they can provide services in English", and it covers categories the directory had almost nothing
 * in, legal and translation, rather than yet more clinics.
 *
 * It is a multi-step form rather than a page, so this walks it: GET the region step for a CSRF
 * token and a session cookie, POST an empty region for the whole country, POST every practice area,
 * accept the disclaimer, then read the result list. Nothing is guessed; the flow is the one the
 * site's own buttons follow.
 *
 * Usage: node scripts/fetch_fcdo_professionals.cjs <serviceType> <Country> <out.json>
 *   serviceType: lawyers | translators-interpreters
 */
const fs = require('fs');
const path = require('path');
const BASE = 'https://find-a-professional-service-abroad.service.csd.fcdo.gov.uk';

const [, , SERVICE, COUNTRY, OUT, LANG] = process.argv;
if (!SERVICE || !COUNTRY || !OUT) {
  console.error('usage: node scripts/fetch_fcdo_professionals.cjs <lawyers|translators-interpreters> "<Country>" <out.json> [languageCode]');
  process.exit(1);
}

let cookie = '';
const rememberCookies = (res) => {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const jar = {};
  cookie.split(';').filter(Boolean).forEach((c) => { const [k, ...v] = c.trim().split('='); jar[k] = v.join('='); });
  set.forEach((c) => { const [k, ...v] = c.split(';')[0].split('='); jar[k] = v.join('='); });
  cookie = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
};
const csrfOf = (html) => (html.match(/name="_csrf" value="([^"]+)"/) || [])[1];

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', cookie }, redirect: 'follow' });
  rememberCookies(res);
  return { html: await res.text(), url: res.url };
}
async function post(url, fields) {
  const body = new URLSearchParams();
  fields.forEach(([k, v]) => body.append(k, v));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'user-agent': 'Mozilla/5.0', cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'follow',
  });
  rememberCookies(res);
  return { html: await res.text(), url: res.url };
}

const strip = (s) => s.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

// Each provider is one <li> holding an <h2> with its name.
function parse(html) {
  const items = html.split(/<li>/).slice(1);
  const out = [];
  for (const raw of items) {
    const h2 = raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!h2) continue;
    const name = strip(h2[1].replace(/<span[\s\S]*?<\/span>/g, ''));
    if (!name || name.length < 3) continue;
    const field = (label) => {
      const m = raw.match(new RegExp('<strong>' + label + '</strong>\\s*:?([\\s\\S]*?)</p>'));
      return m ? strip(m[1]) : '';
    };
    const size = strip((h2[1].match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || '');
    // The address block runs from "Address:" to the next labelled field.
    const addrBlock = raw.match(/<strong>Address<\/strong>\s*:?([\s\S]*?)(?:<strong>(?:Email|Telephone|Website|Out of hours)|<\/li>)/);
    const address = addrBlock
      ? strip(addrBlock[1]).replace(/\s*-\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',')
      : '';
    const website = (raw.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"/) || [])[1] || '';
    out.push({
      name,
      size,
      regions: field('Regions served'),
      expertise: field('Legal expertise') || field('Languages') || field('Language'),
      extra: field('Additional details'),
      address,
      website,
    });
  }
  return out;
}

(async () => {
  // Where the flow starts differs by service: lawyers begin at a region step, translators at a
  // language one. Read the first step off the country page's own Start button instead of assuming.
  const landing = await get(`${BASE}/find/${SERVICE}?country=${encodeURIComponent(COUNTRY)}`);
  const href = (landing.html.match(/<a href="([^"]+)"[^>]*class="govuk-button"/) || [])[1];
  if (!href) { console.error('no Start button for ' + SERVICE + ' in ' + COUNTRY + ' (is the country spelled as the service spells it?)'); process.exit(1); }
  const start = new URL(href, landing.url).href;
  let step = await get(start);
  if (!csrfOf(step.html)) { console.error('no form at ' + start); process.exit(1); }

  // Only the lawyer flow has a region step to skip past.
  if (/\/region$/.test(step.url)) step = await post(step.url, [['_csrf', csrfOf(step.html)], ['region', '']]);

  // The middle step differs by service: areas of law for lawyers, languages for translators.
  let guard = 0;
  while (!/\/result/.test(step.url) && guard++ < 6) {
    const csrf = csrfOf(step.html);
    if (!csrf) { console.error('lost the form at ' + step.url); process.exit(1); }
    const fields = [['_csrf', csrf]];
    const boxes = [...step.html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map((m) => m[0]);
    const named = boxes.map((b) => [(b.match(/name="([^"]+)"/) || [])[1], (b.match(/value="([^"]+)"/) || [])[1]])
      .filter(([n]) => n && n !== '_csrf');
    if (!named.length) {
      // The translators branch asks for a language from a <select> rather than checkboxes. An
      // empty value means "any", which is what a whole-country sweep wants.
      // The translators branch asks for one language from a <select>, and will not accept an empty
      // answer, so a whole-country sweep needs one pass per language. That is the point rather than
      // a nuisance: it is how you find someone who works in German or Russian rather than English.
      const sel = (step.html.match(/<select[^>]*name="([^"]+)"/) || [])[1];
      if (sel) {
        if (!LANG) {
          console.error('this step needs a language; pass one as the fourth argument (an ISO 639-1 code such as de)');
          process.exit(1);
        }
        // The language step is an "add to your list" pattern: choosing a language and pressing Add
        // returns the same page with the language recorded, and only then does Continue move on.
        const added = await post(step.url, [['_csrf', csrf], [sel, LANG], ['action', 'add']]);
        step = await post(added.url, [['_csrf', csrfOf(added.html) || csrf]]);
        continue;
      }
      // After a language is added the flow asks, on radio buttons, whether you want another. No.
      const radios = [...step.html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map((x) => x[0])
        .map((b) => [(b.match(/name="([^"]+)"/) || [])[1], (b.match(/value="([^"]+)"/) || [])[1]])
        .filter(([n]) => n && n !== '_csrf');
      if (radios.length) {
        const no = radios.find(([, v]) => /^(no|false)$/i.test(v || '')) || radios[radios.length - 1];
        step = await post(step.url, [['_csrf', csrf], no]);
        continue;
      }
      console.error('no choices at ' + step.url);
      process.exit(1);
    }
    // Prefer an "All" option; otherwise take every option, which is the same thing said longhand.
    const all = named.find(([, v]) => v === 'All');
    if (all) fields.push(all);
    else if (named[0][1] === undefined) fields.push([named[0][0], 'on']);
    else named.forEach((nv) => fields.push(nv));
    step = await post(step.url, fields);
  }
  if (!/\/result/.test(step.url)) { console.error('never reached the results (last: ' + step.url + ')'); process.exit(1); }

  // The results are paginated ten at a time; ?page=N walks the rest.
  const rows = parse(step.html);
  // The page links only ever show the next couple of numbers, so following them stops at 30
  // providers and looks like a complete answer. Walk until a page comes back empty instead.
  const seen = new Set(rows.map((r) => r.name));
  for (let n = 2; n <= 40; n++) {
    const next = await get(step.url.split('?')[0] + '?&page=' + n);
    const more = parse(next.html).filter((r) => !seen.has(r.name));
    if (!more.length) break;
    more.forEach((r) => seen.add(r.name));
    rows.push(...more);
  }
  fs.writeFileSync(OUT, JSON.stringify({ service: SERVICE, country: COUNTRY, url: step.url, rows }, null, 1) + '\n');
  console.log(SERVICE + ' / ' + COUNTRY + (LANG ? ' / ' + LANG : '') + ': ' + rows.length + ' providers');
})();

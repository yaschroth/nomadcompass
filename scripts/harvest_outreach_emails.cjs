/**
 * Finds the mailbox to write to, for every firm in the outreach catalogue.
 *
 * WHY THIS EXISTS
 *
 * The outreach tool can already pick a firm, write the letter in the language that firm works in,
 * and remember that it went. What it cannot do is address it. data/outreach-targets.json holds
 * 1,910 contactable firms and almost no e-mail addresses, so every send ends with a human opening
 * the firm's website in another tab and hunting for a contact page. That hunt, not the writing, is
 * why 44 firms have been contacted out of 1,910.
 *
 * This fills that gap: Apify's Contact Details Scraper reads each firm's own site and reports the
 * addresses published on it. Nothing here is guessed, bought, or pattern-matched from a name. An
 * address is published by the firm on the firm's own pages or it is not recorded.
 *
 * WHERE THE RESULT LIVES, AND WHY NOT ON THE TARGET
 *
 * data/outreach-targets.json is generated wholesale from data/service-languages.json every time
 * build_outreach_dataset.cjs runs. Writing an address onto a target would survive exactly until
 * the next rebuild. So addresses live here, in data/outreach-emails.json, keyed by domain, and the
 * dataset builder merges them back in. The same reason the outreach STATUS lives in the artifact's
 * own database rather than in the catalogue it displays.
 *
 * WHICH ADDRESS GETS PICKED
 *
 * A site can publish several. They are ranked, and the ranking is not cosmetic:
 *
 *   1. a role address on the firm's own domain   info@navii.vn
 *   2. any address on the firm's own domain      lan.nguyen@navii.vn
 *   3. a role address anywhere                   naviidental@gmail.com
 *   4. anything else that survived the filter
 *
 * Role addresses first is a GDPR position, not a preference. info@ is a company mailbox; a named
 * partner's address is personal data, and processing it needs a basis that "we found it" is not.
 * Own-domain first because a free-mail address in a footer is as often the web designer's as the
 * firm's. Every address found is kept in `emails` so a human can overrule the pick.
 *
 * WHAT IS THROWN AWAY
 *
 * Contact scrapers return the CMS along with the client. Sentry DSNs, wixpress.com, image files
 * that happen to contain an @, placeholder addresses out of a theme demo. REJECT_HOST and the
 * shape checks below drop those, and every drop is counted so a scrape that returns nothing but
 * junk is visible as junk rather than as a firm without an address.
 *
 * A LOOK THAT FOUND NOTHING IS STILL A LOOK
 *
 * A firm whose site publishes no address is recorded with status "none" and the date. Without that
 * the next run re-crawls it, and the run after that, for ever. It expires: after --max-age days
 * (default 180) it is looked at again, because sites do add contact pages. Sweeps that skip a row
 * merely because a value is present are how this repo has frozen stale data onto a thousand pages
 * before.
 *
 * RUNNING IT
 *
 * The scrape happens on Apify, not here. Two ways in, because this repo has no APIFY_TOKEN on disk
 * but does have an authenticated Apify MCP connection:
 *
 *   node scripts/harvest_outreach_emails.cjs --plan --limit 25 --non-eu
 *       writes the actor input to data/outreach-scrape-input.json. Feed it to
 *       vdrmota/contact-info-scraper, then ingest the dataset it produces.
 *
 *   node scripts/harvest_outreach_emails.cjs --ingest <file.json>
 *       merges a saved dataset (an array of the actor's result rows) into
 *       data/outreach-emails.json.
 *
 *   node scripts/harvest_outreach_emails.cjs --run --limit 25   [needs APIFY_TOKEN]
 *       does both in one go against the Apify API.
 *
 * Selection flags: --limit N, --non-eu, --eu, --dach, --country "Thailand", --force, --max-age N.
 * --dach is opt-in and never part of --eu, because unsolicited business mail in Germany, Austria
 * and Switzerland carries a real Abmahnung risk and those 287 firms should be a deliberate choice.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = path.join(ROOT, 'data', 'outreach-targets.json');
const STORE = path.join(ROOT, 'data', 'outreach-emails.json');
const PLAN_OUT = path.join(ROOT, 'data', 'outreach-scrape-input.json');

const ACTOR = 'vdrmota/contact-info-scraper';

// Pages per firm. The homepage plus a hop reaches /contact, /kontakt, /impressum, /about, which is
// where a business address lives. Depth 2 doubles the bill to read staff blogs.
const PAGES_PER_FIRM = 4;

const DACH = new Set(['Germany', 'Austria', 'Switzerland']);
const EU = new Set([
  'Germany', 'Austria', 'Switzerland', 'France', 'Italy', 'Spain', 'Portugal', 'Netherlands',
  'Belgium', 'Poland', 'Czechia', 'Czech Republic', 'Sweden', 'Denmark', 'Finland', 'Norway',
  'Ireland', 'Greece', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovakia', 'Slovenia',
  'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus', 'Iceland', 'Liechtenstein',
]);

// Mailbox names that belong to a company rather than to a person.
const ROLE = /^(info|kontakt|contact|office|mail|email|hello|hallo|hi|praxis|kanzlei|clinic|clinica|klinik|reception|empfang|termin|appointments?|booking|buchung|anfrage|enquiries|enquiry|inquiries|admin|administration|sekretariat|secretariat|service|support|welcome|post|team|studio|shop|sales|vertrieb|verwaltung|zentrale|general|main|help|ask|care|patients?|kunden|customer|rezeption)([._-]?[a-z0-9]{0,12})?$/i;

// Hosts that belong to the plumbing, not to the firm. A contact scraper reports all of them.
const REJECT_HOST = /(^|\.)(sentry\.(io|wixpress\.com)|wixpress\.com|wix\.com|squarespace\.com|shopify\.com|godaddy\.com|wordpress\.(com|org)|jimdo\.com|weebly\.com|webflow\.com|1and1\.|ionos\.|strato\.|hostinger\.|bluehost\.com|cloudflare\.com|google(mail)?\.com\.br|sentry-next\.wixpress\.com|example\.(com|org|net)|domain\.com|yourdomain\.|yoursite\.|email\.com|test\.com|mysite\.com|company\.com|business\.com|website\.com|acme\.com|lorem\.|placeholder\.)/i;

// Local parts that are a theme demo or a tracking id rather than a mailbox.
const REJECT_LOCAL = /^(your|youremail|yourname|name|email|e?mail|user|username|someone|somebody|example|sample|test|testing|demo|placeholder|firstname|lastname|john\.?doe|jane\.?doe|max\.?mustermann|nobody|noreply|no-reply|donotreply|do-not-reply|abuse|postmaster|mailer-daemon|bounce|unsubscribe|[0-9a-f]{16,})$/i;

const FREEMAIL = /^(gmail|googlemail|outlook|hotmail|live|msn|yahoo|ymail|aol|gmx|web|t-online|freenet|icloud|me|mac|protonmail|proton|pm|zoho|mail|yandex|naver|qq|163|126|seznam|wp|o2|orange|free|libero|virgilio|alice|bol|uol|terra|abv|mynet|hanmail|daum|rediffmail|sina|foxmail)\./i;

// ---- argv -------------------------------------------------------------------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const opt = {
  plan: has('--plan'),
  run: has('--run'),
  ingest: val('--ingest', ''),
  ingestDataset: val('--ingest-dataset', ''),
  limit: parseInt(val('--limit', '0'), 10) || 0,
  maxAge: parseInt(val('--max-age', '180'), 10),
  force: has('--force'),
  nonEu: has('--non-eu'),
  eu: has('--eu'),
  dach: has('--dach'),
  country: val('--country', ''),
};

const today = new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// ---- store ------------------------------------------------------------------
function loadStore() {
  if (!fs.existsSync(STORE)) {
    return {
      _meta: {
        description: 'Contact addresses published on each firm\'s own website. Input to the outreach tool.',
        actor: ACTOR,
        note: 'Merged onto data/outreach-targets.json by build_outreach_dataset.cjs. Never edited by hand in the targets file, which is regenerated.',
        updated: today,
        domains: 0,
      },
      domains: {},
    };
  }
  return JSON.parse(fs.readFileSync(STORE, 'utf8'));
}

function saveStore(store) {
  const d = store.domains;
  const keys = Object.keys(d).sort();
  const sorted = {};
  keys.forEach((k) => { sorted[k] = d[k]; });
  store.domains = sorted;
  store._meta.updated = today;
  store._meta.domains = keys.length;
  store._meta.withAddress = keys.filter((k) => d[k].picked).length;
  fs.writeFileSync(STORE, `${JSON.stringify(store, null, 2)}\n`);
}

// ---- address handling -------------------------------------------------------
function cleanEmail(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let e = raw.trim().toLowerCase();
  e = e.replace(/^mailto:/, '').replace(/[?#].*$/, '');
  e = e.replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');
  // An image or asset filename that happens to hold an @, e.g. logo@2x.png
  if (/\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|pdf)$/i.test(e)) return '';
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e)) return '';
  return e;
}

function usable(email) {
  const [local, host] = email.split('@');
  if (!local || !host) return false;
  if (REJECT_HOST.test(host)) return false;
  if (REJECT_LOCAL.test(local)) return false;
  if (local.length > 64 || email.length > 120) return false;
  // A long hex or base64ish local part is a tracking id that got an @ glued to it.
  if (/^[0-9a-f]{12,}/i.test(local) && !/[._-]/.test(local)) return false;
  return true;
}

/** Registrable-ish domain: good enough to tell "their own domain" from "gmail". */
function baseDomain(host) {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  const p = h.split('.');
  if (p.length <= 2) return h;
  // co.uk, com.au, com.br, co.jp and friends
  if (/^(co|com|net|org|gov|edu|ac|or|ne|go)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2) {
    return p.slice(-3).join('.');
  }
  return p.slice(-2).join('.');
}

function rank(email, firmDomain) {
  const [local, host] = email.split('@');
  const own = baseDomain(host) === baseDomain(firmDomain);
  const role = ROLE.test(local);
  if (own && role) return { score: 0, kind: 'role-same-domain' };
  if (own) return { score: 1, kind: 'same-domain' };
  if (role && FREEMAIL.test(`${host}.`)) return { score: 2, kind: 'role-freemail' };
  if (role) return { score: 3, kind: 'role-other-domain' };
  if (FREEMAIL.test(`${host}.`)) return { score: 4, kind: 'freemail' };
  return { score: 5, kind: 'other-domain' };
}

/**
 * A firm with offices in four countries publishes a mailbox per office: toronto@ and montreal@,
 * office.srb@ and office.mne@. Ranking alone cannot separate those, and picking the shortest sends
 * a Belgrade listing to the Bosnian office. We know which cities we list the firm in, so where a
 * mailbox names one of them, that is the one to write to.
 *
 * Names only, no country-code table: "srb" for Serbia stays unresolved on purpose rather than
 * carrying a guess. Those land as `ambiguous` instead, which is a flag a human can act on.
 */
function localeHints(target) {
  const out = [];
  if (!target) return out;
  [].concat(target.cities || [], target.countries || []).forEach((n) => {
    const s = String(n || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    if (s.length >= 4) out.push(s);
  });
  return [...new Set(out)];
}

function hitsHint(email, hints) {
  const local = email.split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
  return hints.some((h) => local.includes(h));
}

/** Turn one actor result row into a store entry. */
function entryFrom(row, firmDomain, target) {
  const raw = []
    .concat(row.emails || [])
    .concat(row.email ? [row.email] : [])
    .concat(row.contactEmails || []);

  const seen = new Set();
  let dropped = 0;
  const kept = [];
  raw.forEach((r) => {
    const e = cleanEmail(r);
    if (!e) { dropped += 1; return; }
    if (seen.has(e)) return;
    seen.add(e);
    if (!usable(e)) { dropped += 1; return; }
    kept.push(e);
  });

  const hints = localeHints(target);
  kept.sort((a, b) => {
    const d = rank(a, firmDomain).score - rank(b, firmDomain).score;
    if (d) return d;
    const h = (hitsHint(b, hints) ? 1 : 0) - (hitsHint(a, hints) ? 1 : 0);
    return h || a.length - b.length || a.localeCompare(b);
  });

  const picked = kept[0] || '';
  // Several equally good mailboxes and nothing to choose between them: say so rather than let the
  // tie-break look like a decision.
  const topScore = picked ? rank(picked, firmDomain).score : -1;
  const tied = kept.filter((e) => rank(e, firmDomain).score === topScore);
  const ambiguous = tied.length > 1 && !hitsHint(picked, hints);

  return {
    emails: kept.slice(0, 5),
    picked,
    kind: picked ? rank(picked, firmDomain).kind : '',
    ambiguous: ambiguous || undefined,
    dropped,
    pagesRead: (row.scrapedUrls || row.crawledUrls || row.visitedUrls || []).length || undefined,
    foundOn: row.url || row.originalStartUrl || '',
    checkedOn: today,
    status: picked ? 'ok' : 'none',
  };
}

// ---- target selection -------------------------------------------------------
function candidates(store) {
  const { targets } = JSON.parse(fs.readFileSync(TARGETS, 'utf8'));
  let list = targets.filter((t) => !t.aggregator && t.website);

  const region = (t) => {
    const c = t.countries.filter(Boolean);
    if (c.some((x) => DACH.has(x))) return 'dach';
    if (c.some((x) => EU.has(x))) return 'eu';
    return 'non-eu';
  };

  if (opt.country) {
    const want = opt.country.toLowerCase();
    list = list.filter((t) => t.countries.some((c) => String(c).toLowerCase() === want));
  } else if (opt.nonEu) list = list.filter((t) => region(t) === 'non-eu');
  else if (opt.eu) list = list.filter((t) => region(t) === 'eu');
  else if (opt.dach) list = list.filter((t) => region(t) === 'dach');
  else list = list.filter((t) => region(t) !== 'dach'); // DACH is opt-in, never a default

  if (!opt.force) {
    list = list.filter((t) => {
      const e = store.domains[t.domain];
      if (!e) return true;
      return daysBetween(e.checkedOn, today) >= opt.maxAge;
    });
  }

  // Best-sourced and most-listed first: those are the firms whose listing is worth most to them,
  // and the ones whose reply is worth most to us.
  list.sort((a, b) => {
    const r = { official: 0, visited: 1, 'self-declared': 2, directory: 3 };
    const d = (r[a.evidence] ?? 9) - (r[b.evidence] ?? 9);
    if (d) return d;
    if (b.listedCount !== a.listedCount) return b.listedCount - a.listedCount;
    return a.name.localeCompare(b.name);
  });

  return opt.limit ? list.slice(0, opt.limit) : list;
}

function actorInput(list) {
  return {
    startUrls: list.map((t) => ({ url: t.website })),
    maxRequestsPerStartUrl: PAGES_PER_FIRM,
    maxDepth: 1,
    sameDomain: true,
    mergeContacts: true,
    considerChildFrames: false, // ad iframes carry other people's addresses
    useBrowser: false,
    maximumLeadsEnrichmentRecords: 0, // personal data, paid, and not what we are asking for
    proxyConfig: { useApifyProxy: true },
  };
}

// ---- ingest -----------------------------------------------------------------
function domainOfUrl(u) {
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
}

function ingest(rows, store) {
  const { targets } = JSON.parse(fs.readFileSync(TARGETS, 'utf8'));
  const byDomain = new Map(targets.map((t) => [t.domain, t]));

  // The actor reports the page it read. Match it back to a firm by domain, and where the row
  // carries the start URL it came from, prefer that: a firm whose contact page sits on a different
  // host still belongs to the firm we asked about.
  let matched = 0; let unmatched = 0; let found = 0; let none = 0;
  const merged = new Map();

  rows.forEach((row) => {
    const start = row.originalStartUrl || row.startUrl || row.url || '';
    let d = domainOfUrl(start);
    if (!byDomain.has(d)) d = baseDomain(d);
    if (!byDomain.has(d)) {
      const alt = [...byDomain.keys()].find((k) => baseDomain(k) === baseDomain(d));
      if (alt) d = alt;
    }
    if (!byDomain.has(d)) { unmatched += 1; return; }

    const target = byDomain.get(d);
    const e = entryFrom(row, d, target);
    const prev = merged.get(d);
    if (prev) {
      // mergeContacts should make this rare, but a redirect can split a firm across two rows.
      const hints = localeHints(target);
      const all = [...new Set(prev.emails.concat(e.emails))];
      all.sort((a, b) => rank(a, d).score - rank(b, d).score
        || (hitsHint(b, hints) ? 1 : 0) - (hitsHint(a, hints) ? 1 : 0)
        || a.length - b.length);
      e.emails = all.slice(0, 5);
      e.picked = all[0] || '';
      e.kind = e.picked ? rank(e.picked, d).kind : '';
      e.dropped += prev.dropped;
      e.status = e.picked ? 'ok' : 'none';
    }
    merged.set(d, e);
  });

  merged.forEach((e, d) => {
    store.domains[d] = e;
    matched += 1;
    if (e.picked) found += 1; else none += 1;
  });

  return { matched, unmatched, found, none };
}

function report(store, res) {
  const d = store.domains;
  const keys = Object.keys(d);
  const withAddr = keys.filter((k) => d[k].picked);
  const byKind = {};
  withAddr.forEach((k) => { byKind[d[k].kind] = (byKind[d[k].kind] || 0) + 1; });

  if (res) {
    console.log(`ingested ${res.matched} firms: ${res.found} with an address, ${res.none} without`);
    if (res.unmatched) console.log(`  ${res.unmatched} result row(s) matched no firm and were skipped`);
  }
  console.log(`store: ${keys.length} firms looked at, ${withAddr.length} with an address `
    + `(${keys.length ? Math.round((withAddr.length / keys.length) * 100) : 0}%)`);
  Object.entries(byKind).sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  ${k}`));
  const dropped = keys.reduce((s, k) => s + (d[k].dropped || 0), 0);
  if (dropped) console.log(`  ${dropped} address(es) rejected as CMS, placeholder or asset noise`);
  const amb = withAddr.filter((k) => d[k].ambiguous);
  if (amb.length) console.log(`  ${amb.length} firm(s) had several equally good mailboxes: see "ambiguous"`);
  const personal = withAddr.filter((k) => !/^role-/.test(d[k].kind));
  if (personal.length) {
    console.log(`  ${personal.length} pick(s) are not a role mailbox. Those are personal data:`);
    console.log('    prefer a role address before sending into the EU, or leave them out.');
  }
}

// ---- api (only when a token is on hand) -------------------------------------
async function runOnApify(input) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error('APIFY_TOKEN is not set. Use --plan and run the actor through the Apify console');
    console.error('or an MCP connection, then --ingest the dataset.');
    process.exit(1);
  }
  const base = 'https://api.apify.com/v2';
  const start = await fetch(`${base}/acts/${ACTOR.replace('/', '~')}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => r.json());

  const id = start.data && start.data.id;
  if (!id) throw new Error(`could not start the actor: ${JSON.stringify(start).slice(0, 300)}`);
  console.log(`run ${id} started, waiting`);

  let run = start.data;
  /* eslint-disable no-await-in-loop */
  while (run.status === 'RUNNING' || run.status === 'READY') {
    await new Promise((r) => setTimeout(r, 10000));
    run = await fetch(`${base}/actor-runs/${id}?token=${token}`).then((r) => r.json()).then((j) => j.data);
    process.stdout.write('.');
  }
  /* eslint-enable no-await-in-loop */
  console.log(`\nrun ${run.status}`);
  if (run.status !== 'SUCCEEDED') throw new Error(`run ended ${run.status}`);

  return fetch(`${base}/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`)
    .then((r) => r.json());
}

// ---- main -------------------------------------------------------------------
(async () => {
  const store = loadStore();

  if (opt.ingest || opt.ingestDataset) {
    let rows;
    if (opt.ingest) {
      rows = JSON.parse(fs.readFileSync(path.resolve(opt.ingest), 'utf8'));
    } else {
      const token = process.env.APIFY_TOKEN;
      if (!token) { console.error('APIFY_TOKEN is not set, so --ingest-dataset cannot fetch.'); process.exit(1); }
      rows = await fetch(`https://api.apify.com/v2/datasets/${opt.ingestDataset}/items?token=${token}&clean=true`)
        .then((r) => r.json());
    }
    if (!Array.isArray(rows)) { console.error('expected an array of actor result rows'); process.exit(1); }
    const res = ingest(rows, store);
    saveStore(store);
    report(store, res);
    console.log(`wrote ${path.relative(ROOT, STORE)}`);
    return;
  }

  const list = candidates(store);
  if (!list.length) {
    console.log('nothing to look up: every selected firm has been checked inside --max-age days.');
    return;
  }
  const input = actorInput(list);
  const pages = list.length * PAGES_PER_FIRM;

  console.log(`${list.length} firm(s) selected, up to ${pages} pages`);
  console.log(`  at $0.002 a page that is about $${(pages * 0.002).toFixed(2)} on the free tier`);
  const cc = {};
  list.forEach((t) => t.countries.filter(Boolean).forEach((c) => { cc[c] = (cc[c] || 0) + 1; }));
  console.log(`  ${Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `${c} ${n}`).join(', ')}`);

  if (opt.run) {
    const rows = await runOnApify(input);
    const res = ingest(rows, store);
    saveStore(store);
    report(store, res);
    return;
  }

  fs.writeFileSync(PLAN_OUT, `${JSON.stringify(input, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, PLAN_OUT)} for ${ACTOR}`);
  console.log('then: node scripts/harvest_outreach_emails.cjs --ingest <saved-dataset.json>');
})().catch((e) => { console.error(e); process.exit(1); });

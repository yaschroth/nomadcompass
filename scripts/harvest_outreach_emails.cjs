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

// The token lives in .env.local, which is gitignored, the same place BING_WEBMASTER_API_KEY sits.
// Read it here rather than making the caller export it, because a harvest that needs a shell
// incantation to run is a harvest that gets run by hand instead.
(() => {
  const f = path.join(ROOT, '.env.local');
  if (!fs.existsSync(f)) return;
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) return;
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (v && !process.env[m[1]]) process.env[m[1]] = v;
  });
})();

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

/**
 * How likely a country is to answer on WhatsApp, for ordering the queue.
 *
 * Seeded from what this harvest actually measured over its first 319 firms, not from assumption:
 * Brazil 60%, Turkey 27%, Thailand 20%, Kenya 20%, Israel 17%, Spain 14%, Italy 11%, against
 * Norway 0 of 22, France 0 of 36 and the Netherlands and Sweden at zero. Countries not yet sampled
 * sit where their neighbours landed. The numbers are small, so this orders the work; it never
 * decides anything about a firm.
 *
 * 3 = WhatsApp is how business is done, 0 = it is barely used.
 */
const WA_TIER = {
  // Latin America
  Brazil: 3, Mexico: 3, Argentina: 3, Colombia: 3, Chile: 3, Peru: 3, Ecuador: 3, Bolivia: 3,
  Uruguay: 3, Paraguay: 3, Venezuela: 3, 'Costa Rica': 3, Panama: 3, Guatemala: 3, Honduras: 3,
  Nicaragua: 3, 'El Salvador': 3, 'Dominican Republic': 3, Cuba: 3,
  // Middle East, Africa, South Asia
  Turkey: 3, Israel: 3, UAE: 3, Jordan: 3, Oman: 3, 'Saudi Arabia': 3, Qatar: 3, Kuwait: 3,
  Bahrain: 3, Lebanon: 3, Egypt: 3, Morocco: 3, Tunisia: 3, Nigeria: 3, Kenya: 3, Tanzania: 3,
  Ethiopia: 3, 'South Africa': 3, Ghana: 3, India: 3, Pakistan: 3, 'Sri Lanka': 3, Nepal: 3,
  Indonesia: 3, Malaysia: 3, Philippines: 3,
  // Southern and eastern Europe, the Caucasus, mainland southeast Asia
  Spain: 2, Italy: 2, Portugal: 2, Greece: 2, Cyprus: 2, Malta: 2, Poland: 2, Bulgaria: 2,
  Romania: 2, Croatia: 2, Serbia: 2, Albania: 2, 'North Macedonia': 2, Montenegro: 2, Slovenia: 2,
  Georgia: 2, Armenia: 2, Kazakhstan: 2, Uzbekistan: 2, Thailand: 2, Vietnam: 2, Cambodia: 2,
  Laos: 2, Myanmar: 2, Singapore: 2,
  // Northern and western Europe
  Germany: 1, Austria: 1, Switzerland: 1, Belgium: 1, Ireland: 1, 'United Kingdom': 1,
  'Czech Republic': 1, Hungary: 1, Slovakia: 1, Estonia: 1, Latvia: 1, Lithuania: 1,
  // Measured at zero here, or a market where another messenger owns the ground
  France: 0, Netherlands: 0, Norway: 0, Sweden: 0, Denmark: 0, Finland: 0, Iceland: 0,
  Japan: 0, 'South Korea': 0, China: 0, Taiwan: 0, 'United States': 0, Canada: 0,
  Australia: 0, 'New Zealand': 0,
};
const waTier = (t) => {
  let best = -1;
  (t.countries || []).filter(Boolean).forEach((c) => {
    const v = WA_TIER[c];
    if (v !== undefined && v > best) best = v;
  });
  return best < 0 ? 1 : best; // an unlisted country is treated as ordinary, never as hopeless
};

// Mailbox names that belong to a company rather than to a person.
const ROLE = /^(info|kontakt|contact|office|mail|email|hello|hallo|hi|praxis|kanzlei|clinic|clinica|klinik|reception|empfang|termin|appointments?|booking|buchung|anfrage|enquiries|enquiry|inquiries|admin|administration|sekretariat|secretariat|service|support|welcome|post|team|studio|shop|sales|vertrieb|verwaltung|zentrale|general|main|help|ask|care|patients?|kunden|customer|rezeption)([._-]?[a-z0-9]{0,12})?$/i;

// Hosts that belong to the plumbing, not to the firm. A contact scraper reports all of them.
const REJECT_HOST = /(^|\.)(sentry\.(io|wixpress\.com)|wixpress\.com|wix\.com|squarespace\.com|shopify\.com|godaddy\.com|wordpress\.(com|org)|jimdo\.com|weebly\.com|webflow\.com|1and1\.|ionos\.|strato\.|hostinger\.|bluehost\.com|cloudflare\.com|google(mail)?\.com\.br|sentry-next\.wixpress\.com|example\.(com|org|net)|domain\.com|yourdomain\.|yoursite\.|email\.com|test\.com|mysite\.com|company\.com|business\.com|website\.com|acme\.com|lorem\.|placeholder\.)/i;

// Local parts that are a theme demo or a tracking id rather than a mailbox.
const REJECT_LOCAL = /^(your|youremail|yourname|name|email|e?mail|user|username|someone|somebody|example|sample|test|testing|demo|placeholder|firstname|lastname|john\.?doe|jane\.?doe|max\.?mustermann|nobody|noreply|no-reply|donotreply|do-not-reply|abuse|postmaster|mailer-daemon|bounce|unsubscribe|[0-9a-f]{16,})$/i;

const FREEMAIL = /^(gmail|googlemail|outlook|hotmail|live|msn|yahoo|ymail|aol|gmx|web|t-online|freenet|icloud|me|mac|protonmail|proton|pm|zoho|mail|yandex|naver|qq|163|126|seznam|wp|o2|orange|free|libero|virgilio|alice|bol|uol|terra|abv|mynet|hanmail|daum|rediffmail|sina|foxmail)\./i;

// Which channel to reach a firm on, best first. WhatsApp beats everything because it is the channel
// these businesses actually answer in Bangkok, Sao Paulo and Nairobi, and because it sidesteps the
// domain warm-up and deliverability problem entirely. See the note on sending in the header.
const CHANNELS = ['whatsapp', 'social', 'email'];

// Share widgets and intent links. A page that offers "share this on LinkedIn" is not giving you its
// own profile, and following one writes a post rather than opening a conversation.
const SOCIAL_JUNK = /\/(sharer|share|shareArticle|share_channel|intent|dialog|plugins|login|signup|help|policies|legal|about\/cookies)/i;

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
  waFirst: has('--wa-first'),
  local: has('--local'),
  // Specific firms by domain. The default ordering puts official-evidence firms first, which is
  // right for working through the backlog and wrong when a handful of rows were just added and
  // those are the ones wanted.
  domains: val('--domains', '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean),
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

/**
 * The number out of a WhatsApp link, in the only form wa.me accepts: digits, full international,
 * no plus and no spaces.
 *
 * The trap is the national format. mmtklaw.com publishes both wa.me/+254700720011 and
 * wa.me/0700720011 for the same phone; the second is what a Kenyan dials at home and reaches nobody
 * from abroad. A leading zero is a national trunk prefix, never part of an international number, so
 * those are dropped rather than guessed at: we do not hold a country dialling table and a wrong
 * country code opens a chat with a stranger.
 */
function whatsappNumber(urls) {
  const out = [];
  [].concat(urls || []).forEach((u) => {
    const s = String(u);
    const m = /(?:phone=|wa\.me\/|whatsapp\.com\/send\/?\?phone=)\+?([\d\s()-]{6,})/i.exec(s);
    if (!m) return;
    const d = m[1].replace(/\D/g, '');
    if (!d || d.startsWith('0')) return;   // national format, not dialable from outside
    if (d.length < 8 || d.length > 15) return; // E.164 allows 15 digits at most
    out.push(d);
  });
  // Longest first: where a site gives both a short local form and the full one, the full one wins.
  out.sort((a, b) => b.length - a.length);
  return [...new Set(out)][0] || '';
}

/** One usable profile URL per network, or nothing. */
function socialProfiles(row) {
  const pick = (list) => {
    const ok = [].concat(list || []).map(String).filter((u) => {
      if (!/^https?:\/\//i.test(u)) return false;
      if (SOCIAL_JUNK.test(u)) return false;
      const bare = u.replace(/[?#].*$/, '').replace(/\/+$/, '');
      // A slug cut off mid-word: "linkedin.com/company/hall-" is a 404, not a profile. The scraper
      // truncates these where the page held the link inside a shortened label.
      if (/[-_]$/.test(bare)) return false;
      // The network's own index page rather than anybody's profile.
      if (/\/(company|in|pages|profile\.php)$/i.test(bare)) return false;
      return true;
    });
    return ok[0] || '';
  };
  const s = {};
  const li = pick(row.linkedIns);
  const fb = pick(row.facebooks);
  const ig = pick(row.instagrams);
  if (li) s.linkedin = li;
  if (fb) s.facebook = fb;
  if (ig) s.instagram = ig;
  return s;
}

/**
 * Can anyone actually start a conversation here?
 *
 * A LinkedIn *company* page cannot be messaged by someone who does not administer it; only a
 * personal /in/ profile can. So a firm whose only profile is linkedin.com/company/x has a page we
 * can look at and no way to write to it, and routing it to "social" would park it on a channel that
 * does not exist while its perfectly good info@ address went unused. Facebook pages and Instagram
 * both accept a message from a stranger, so those count.
 */
function canDm(social) {
  if (!social) return false;
  if (social.facebook || social.instagram) return true;
  return !!(social.linkedin && /linkedin\.com\/in\//i.test(social.linkedin));
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

  const whatsapp = whatsappNumber(row.whatsapps);
  const social = socialProfiles(row);
  const hasSocial = Object.keys(social).length > 0;
  const dmable = canDm(social);

  // The ladder. WhatsApp, then a social profile we can actually write to, then e-mail, and "none"
  // is a real answer: a firm whose site publishes no way to reach it is a firm to leave alone
  // rather than to guess at. A profile that cannot take a message is kept for context but never
  // chosen, so it cannot displace an address that works.
  let channel = '';
  if (whatsapp) channel = 'whatsapp';
  else if (dmable) channel = 'social';
  else if (picked) channel = 'email';

  return {
    channel,
    whatsapp: whatsapp || undefined,
    social: hasSocial ? social : undefined,
    socialDm: hasSocial ? dmable : undefined,
    emails: kept.slice(0, 5),
    picked,
    kind: picked ? rank(picked, firmDomain).kind : '',
    ambiguous: ambiguous || undefined,
    dropped,
    pagesRead: (row.scrapedUrls || row.crawledUrls || row.visitedUrls || []).length || undefined,
    foundOn: row.url || row.originalStartUrl || '',
    checkedOn: today,
    status: channel ? 'ok' : 'none',
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

  if (opt.domains.length) {
    const want = new Set(opt.domains);
    list = list.filter((t) => want.has(t.domain));
  } else if (opt.country) {
    const want = opt.country.toLowerCase();
    list = list.filter((t) => t.countries.some((c) => String(c).toLowerCase() === want));
  } else if (opt.nonEu) list = list.filter((t) => region(t) === 'non-eu');
  else if (opt.eu) list = list.filter((t) => region(t) === 'eu');
  else if (opt.dach) list = list.filter((t) => region(t) === 'dach');
  else list = list.filter((t) => region(t) !== 'dach'); // DACH is opt-in, never a default

  if (!opt.force && !opt.domains.length) {
    list = list.filter((t) => {
      const e = store.domains[t.domain];
      if (!e) return true;
      return daysBetween(e.checkedOn, today) >= opt.maxAge;
    });
  }

  // Best-sourced and most-listed first: those are the firms whose listing is worth most to them,
  // and the ones whose reply is worth most to us. With --wa-first, the country's WhatsApp habit
  // leads instead, because the default order is by evidence tier and the best-evidenced firms are
  // European law firms off embassy rosters, which is the segment least likely to answer a chat.
  list.sort((a, b) => {
    if (opt.waFirst) {
      const w = waTier(b) - waTier(a);
      if (w) return w;
    }
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
      e.whatsapp = e.whatsapp || prev.whatsapp;
      if (prev.social || e.social) e.social = Object.assign({}, prev.social, e.social);
      e.socialDm = canDm(e.social);
      e.channel = e.whatsapp ? 'whatsapp'
        : e.socialDm ? 'social'
          : (e.picked ? 'email' : '');
      e.status = e.channel ? 'ok' : 'none';
    }
    merged.set(d, e);
  });

  merged.forEach((e, d) => {
    store.domains[d] = e;
    matched += 1;
    if (e.channel) found += 1; else none += 1;
  });

  return { matched, unmatched, found, none };
}

function report(store, res) {
  const d = store.domains;
  const keys = Object.keys(d);
  const reachable = keys.filter((k) => d[k].channel);
  const withAddr = keys.filter((k) => d[k].picked);
  const byKind = {};
  withAddr.forEach((k) => { byKind[d[k].kind] = (byKind[d[k].kind] || 0) + 1; });

  if (res) {
    console.log(`ingested ${res.matched} firms: ${res.found} reachable, ${res.none} with no channel at all`);
    if (res.unmatched) console.log(`  ${res.unmatched} result row(s) matched no firm and were skipped`);
  }
  const pct = (n) => (keys.length ? `${Math.round((n / keys.length) * 100)}%` : '0%');
  console.log(`store: ${keys.length} firms looked at, ${reachable.length} reachable (${pct(reachable.length)})`);
  console.log('  by channel, best first:');
  CHANNELS.forEach((c) => {
    const n = keys.filter((k) => d[k].channel === c).length;
    console.log(`    ${String(n).padStart(5)}  ${c.padEnd(9)} ${pct(n)}`);
  });
  const unread = keys.filter((k) => d[k].status === 'unread').length;
  if (unread) console.log(`  ${unread} firm(s) could not be read at all: retry those through a proxy`);
  const anyWa = keys.filter((k) => d[k].whatsapp).length;
  const anySocial = keys.filter((k) => d[k].socialDm).length;
  const anyMail = keys.filter((k) => d[k].picked).length;
  console.log(`  held regardless of the pick: whatsapp ${anyWa}, social ${anySocial}, e-mail ${anyMail}`);
  console.log('  e-mail picks by kind:');
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
/**
 * The same job, done here, for nothing.
 *
 * Apify's contact scraper fetches a handful of pages per site and reads addresses and profile links
 * out of them. Node can do that. The reason to have it is not elegance: the account's Apify credit
 * ran out mid-harvest with 909 firms still to look at, and a pipeline that stops dead when a
 * third-party balance hits zero is a pipeline with a hole in it.
 *
 * What is genuinely lost without Apify is proxying. Some sites answer 403 to a plain client and
 * would have answered a residential IP, so expect a lower hit rate here, not an equal one. Nothing
 * else differs: the browser was off in the Apify runs too, so neither sees JavaScript-rendered
 * contacts, and the rows produced here have exactly the shape the ingest already reads, so ranking,
 * the channel ladder and the bookkeeping are the tested ones and not a second implementation.
 */
const UA = 'Mozilla/5.0 (compatible; thenomadhq-contacts/1.0; +https://thenomadhq.com)';

/** Run tasks with a ceiling on how many are in flight: polite to each host, quick over the list. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    for (;;) {
      const i = next; next += 1;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

async function getHtml(url, ms = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': UA } });
    if (!r.ok) return '';
    if (!/html|text/i.test(r.headers.get('content-type') || '')) return '';
    const body = await r.text();
    return body.length > 800000 ? body.slice(0, 800000) : body;
  } catch (e) { return ''; } finally { clearTimeout(t); }
}

/** Links on a page that look like the place a site keeps its contact details. */
const CONTACTISH = /(kontakt|contact|impressum|imprint|about|ueber-uns|über|acerca|contacto|contato|quem-somos|chi-siamo|nous|equipe|team|iletisim|legal|privacy)/i;

function contactLinks(html, base) {
  const out = [];
  const seen = new Set();
  for (const m of String(html).matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, ' ');
    if (!CONTACTISH.test(href) && !CONTACTISH.test(label)) continue;
    let abs = '';
    try { abs = new URL(href, base).toString(); } catch (e) { continue; }
    if (!/^https?:/i.test(abs)) continue;
    let same = false;
    try { same = new URL(abs).hostname.replace(/^www\./, '') === new URL(base).hostname.replace(/^www\./, ''); } catch (e) { /* ignore */ }
    if (!same) continue;
    abs = abs.replace(/#.*$/, '');
    if (seen.has(abs) || abs === base) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= 6) break;
  }
  return out;
}

const SOCIAL_HOSTS = {
  facebooks: /(?:^|\/\/)(?:[a-z-]+\.)?facebook\.com\//i,
  instagrams: /(?:^|\/\/)(?:[a-z-]+\.)?instagram\.com\//i,
  linkedIns: /(?:^|\/\/)(?:[a-z-]+\.)?linkedin\.com\//i,
};

/** Pull the same fields out of a page that the Apify actor reports. */
function harvestFrom(html, acc) {
  // mailto first: an address the page linked is an address the page meant.
  for (const m of String(html).matchAll(/mailto:([^"'?>\s]+)/gi)) {
    // A stray % in a mailto makes decodeURIComponent throw, and an unguarded throw in here took out
    // a run of 869 sites at number 370 and saved none of it. The raw value is fine when it will not
    // decode: cleanEmail has to validate it either way.
    let v = m[1];
    try { v = decodeURIComponent(v); } catch (e) { /* keep it as it came */ }
    acc.emails.push(v);
  }
  // then anything that looks like one in the text, which catches the ones written out.
  const text = String(html).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) acc.emails.push(m[0]);

  for (const m of String(html).matchAll(/https?:\/\/[^"'<>\s]+/gi)) {
    const u = m[0].replace(/&amp;/g, '&');
    if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(u)) acc.whatsapps.push(u);
    for (const [k, re] of Object.entries(SOCIAL_HOSTS)) if (re.test(u)) acc[k].push(u);
  }
}

async function scrapeOne(t) {
  const acc = { originalStartUrl: t.website, emails: [], whatsapps: [], facebooks: [], instagrams: [], linkedIns: [] };
  const home = await getHtml(t.website);
  // "The site published nothing" and "we could not read the site" are different answers and need
  // different follow-ups: the first is final, the second is a candidate for a retry through a
  // proxy. Without the distinction a 403 looks exactly like an honest empty page for ever.
  if (!home) { acc._unread = true; return acc; }
  harvestFrom(home, acc);
  const links = contactLinks(home, t.website).slice(0, PAGES_PER_FIRM - 1);
  for (const u of links) {
    // eslint-disable-next-line no-await-in-loop
    const h = await getHtml(u);
    if (h) harvestFrom(h, acc);
  }
  ['emails', 'whatsapps', 'facebooks', 'instagrams', 'linkedIns'].forEach((k) => {
    acc[k] = [...new Set(acc[k])].slice(0, 40);
  });
  return acc;
}

async function runLocally(list) {
  const total = list.length;
  let done = 0;
  const rows = await pool(list, 12, async (t) => {
    // One site must never be able to end the run. Whatever a page does, this firm is simply one
    // that could not be read, and the other 868 still get their answer.
    let r;
    try {
      r = await scrapeOne(t);
    } catch (e) {
      r = { originalStartUrl: t.website, emails: [], whatsapps: [], facebooks: [],
            instagrams: [], linkedIns: [], _unread: true };
    }
    done += 1;
    if (done % 10 === 0 || done === total) process.stdout.write(`\r  ${done}/${total} sites read`);
    return r;
  });
  process.stdout.write('\n');
  return rows;
}

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
      // A dataset is readable by its id alone. No token needed, which matters more than it looks:
      // without this the only way to get an MCP-driven run's results back here was to read them into
      // the conversation and type them out again, which truncates long address lists by hand and puts
      // a transcription step in front of the data that outreach is later sent to. The id is enough.
      const token = process.env.APIFY_TOKEN;
      const q = ['clean=true', 'format=json'];
      if (token) q.push(`token=${token}`);
      const url = `https://api.apify.com/v2/datasets/${opt.ingestDataset}/items?${q.join('&')}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`dataset ${opt.ingestDataset} could not be read: HTTP ${res.status}`);
        console.error('a private dataset needs APIFY_TOKEN in .env.local');
        process.exit(1);
      }
      rows = await res.json();
    }
    if (!Array.isArray(rows)) { console.error('expected an array of actor result rows'); process.exit(1); }
    const res = ingest(rows, store);
    // Close out everything the plan asked about that the scraper never answered for.
    const plannedFile = path.join(ROOT, 'data', 'outreach-planned.json');
    let closed = 0;
    if (fs.existsSync(plannedFile)) {
      JSON.parse(fs.readFileSync(plannedFile, 'utf8')).forEach((d) => {
        if (store.domains[d]) return;
        store.domains[d] = { emails: [], picked: '', kind: '', dropped: 0, channel: '',
          checkedOn: today, status: 'none', note: 'the scraper returned nothing for this site' };
        closed += 1;
      });
    }
    saveStore(store);
    report(store, res);
    if (closed) console.log(`  ${closed} firm(s) the scraper never answered for, recorded as looked-at`);
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

  if (opt.local) {
    const rows = await runLocally(list);
    const res = ingest(rows, store);
    const unread = new Set(rows.filter((r) => r && r._unread).map((r) => {
      try { return new URL(r.originalStartUrl).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    }));
    let blocked = 0;
    list.forEach((t) => {
      if (store.domains[t.domain] && store.domains[t.domain].channel) return;
      const couldNotRead = unread.has(t.domain) || unread.has(baseDomain(t.domain));
      if (couldNotRead) blocked += 1;
      store.domains[t.domain] = {
        emails: [], picked: '', kind: '', dropped: 0, channel: '',
        checkedOn: today,
        status: couldNotRead ? 'unread' : 'none',
        note: couldNotRead
          ? 'the site did not answer this client, worth retrying through a proxy'
          : 'read here, nothing published on the site',
      };
    });
    if (blocked) console.log(`  ${blocked} site(s) would not answer us and are marked "unread", not empty`);
    saveStore(store);
    report(store, res);
    return;
  }

  if (opt.run) {
    const rows = await runOnApify(input);
    const res = ingest(rows, store);
    saveStore(store);
    report(store, res);
    return;
  }

  fs.writeFileSync(PLAN_OUT, `${JSON.stringify(input, null, 2)}\n`);
  // Which firms this plan covers. A firm whose website is malformed ("http://www.m-") comes back
  // from the scraper as no row at all, so it never gets a checkedOn, so it is selected again in
  // every future batch for ever. Recording the plan lets the ingest close them out as looked-at.
  fs.writeFileSync(path.join(ROOT, 'data', 'outreach-planned.json'),
    `${JSON.stringify(list.map((t) => t.domain), null, 1)}
`);
  console.log(`wrote ${path.relative(ROOT, PLAN_OUT)} for ${ACTOR}`);
  console.log('then: node scripts/harvest_outreach_emails.cjs --ingest <saved-dataset.json>');
})().catch((e) => { console.error(e); process.exit(1); });

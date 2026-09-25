/**
 * Chooses which provider websites are worth reading by asking OpenStreetMap which businesses a
 * mapper tagged with a language, then lets only the provider's own site create a row.
 *
 * WHY THIS EXISTS
 *
 * osm_candidates.cjs read 354 unfiltered OSM businesses in Lisbon and Istanbul and found 0 claims:
 * an ordinary pharmacy or salon serves its own city and has no reason to say what it speaks. Maps
 * gets 12% only because "English speaking ..." queries select for businesses that court
 * foreigners. The idea tested here is the OSM equivalent of that query: a mapper who added
 * `language:en=yes`, `languages=*`, `spoken_languages=*`, `service:language:*`, or wrote "English"
 * into `description` / `note`, has marked a business that serves foreigners, so its own site should
 * state a language far more often than the population at large does.
 *
 * WHAT OSM IS TRUSTED FOR, AND WHAT IT IS NOT (same rule as osm_candidates.cjs)
 *
 * The OSM tag is NEVER the evidence. It only decides whose website is fetched. A row exists only
 * where discover_providers.cjs's findClaim finds a sentence on the provider's own site, and that
 * sentence is quoted in the note. No OSM field reaches a proposed row except the business name and
 * its website address, both of which the business publishes itself and which are re-read from the
 * site we quote; no street, no opening hours, no OSM language tag.
 *
 * STAGES
 *
 *   fetch    node scripts/osm_language_candidates.cjs fetch --cache <dir>
 *              One GLOBAL Overpass query per OSM tag, cached. A global query filtered on the
 *              language keys answered in 2 to 3 seconds (2026-09-25); 1,000 per-city queries would
 *              be 1,000 times the load on a volunteer-run server for the same answer.
 *   measure  node scripts/osm_language_candidates.cjs measure --cache <dir> [--radius 10]
 *              places each object at its nearest site city within the radius and counts, per
 *              category and city, how many carry a language tag and how many a website.
 *   verify   node scripts/osm_language_candidates.cjs verify --cache <dir> [--conc 8] [--out <file>]
 *              fetches each candidate's own site (same four paths as discover verify, 8 s each),
 *              runs findClaim, drops the country's local language, and writes proposals.json in
 *              the discover pipeline's shape plus refused.json with a reason per candidate.
 *
 * TRAPS HIT
 *
 *   - overpass-api.de answers 406 to a User-Agent that starts "Mozilla/5.0 (compatible; ...)".
 *     A plain "nomadhq-research/1.0 (+url)" string is accepted, so Overpass gets that one and
 *     provider sites get the brief's Mozilla-compatible research string.
 *   - `language:xx=no` exists (a mapper recording that English is NOT spoken). The key filter
 *     matches it, so the tag value is checked here and such objects are counted but not read first.
 *   - shop=beauty is mostly nails, lashes and waxing, which is not the hair category. It is fetched
 *     and measured, but only read as `hair` when its own tags or name say hair.
 *   - No browser-UA retry on 403, unlike discover verify: this run identifies itself, and a site
 *     that refuses the research UA is reported as refused, not re-asked in disguise.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const { findClaim, textOf } = require(path.join(ROOT, 'scripts', 'discover_providers.cjs'));

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', '.'));
const today = new Date().toISOString().slice(0, 10);

const UA_OVERPASS = 'nomadhq-research/1.0 (+https://thenomadhq.com/methodology)';
const UA_SITE = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

// [file id, OSM key, OSM value, our category]
const TAGS = [
  ['pharmacy', 'amenity', 'pharmacy', 'pharmacy'],
  ['healthcare-pharmacy', 'healthcare', 'pharmacy', 'pharmacy'],
  ['veterinary', 'amenity', 'veterinary', 'vet'],
  ['hairdresser', 'shop', 'hairdresser', 'hair'],
  ['barber', 'shop', 'barber', 'hair'],
  ['beauty', 'shop', 'beauty', 'beauty'],
  ['optician', 'shop', 'optician', 'optician'],
  ['physiotherapist', 'healthcare', 'physiotherapist', 'physio'],
  ['estate_agent', 'office', 'estate_agent', 'realestate'],
  ['car_repair', 'shop', 'car_repair', 'mechanic'],
  ['fitness_centre', 'leisure', 'fitness_centre', 'fitness'],
  ['school', 'amenity', 'school', 'school'],
];

// Any of the language keys, or a description / note that names a foreign-facing language.
const LANG_KEY = '^(language(:.*)?|languages|spoken_languages|service:language(:.*)?)$';
const NOTE_KEY = '^(description|note)(:[a-z]{2})?$';
const NOTE_VAL = 'english|ingl[eé]s|anglais|englisch|inglese';

/**
 * --signal name: the second test, run because the language tags turned out to be rare (466 objects
 * worldwide across all nine tags). It is the literal OSM analogue of the Maps query "English speaking
 * ...": the business's own name says English, International, Expat or Foreign. Still candidate
 * selection only.
 */
const SIGNAL = val('--signal', 'lang');
const NAME_VAL = 'english|international|expat|foreigner';

function query(k, v) {
  if (SIGNAL === 'name') return `[out:json][timeout:120];nwr["${k}"="${v}"]["name"~"${NAME_VAL}",i];out tags center;`;
  return `[out:json][timeout:120];(nwr["${k}"="${v}"][~"${LANG_KEY}"~"."];`
    + `nwr["${k}"="${v}"][~"${NOTE_KEY}"~"${NOTE_VAL}",i];);out tags center;`;
}

async function overpass(q) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ep = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      // eslint-disable-next-line no-await-in-loop
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA_OVERPASS },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(150000),
      });
      if (r.ok) return (await r.json()).elements || [];
      console.error(`  overpass ${r.status} from ${new URL(ep).host}, waiting`);
    } catch (e) { console.error(`  overpass ${e.name} from ${new URL(ep).host}, waiting`); }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 20000 * (attempt + 1)));
  }
  throw new Error('Overpass did not answer');
}

async function fetchAll() {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const [id, k, v] of TAGS) {
    const f = path.join(CACHE, `osm-${SIGNAL === 'name' ? 'name-' : ''}${id}.json`);
    if (fs.existsSync(f)) { console.log(`${id}: cached`); continue; }
    // eslint-disable-next-line no-await-in-loop
    const els = await overpass(query(k, v));
    fs.writeFileSync(f, JSON.stringify(els));
    console.log(`${id}: ${els.length} objects worldwide`);
    // One query at a time, with a pause: Overpass is volunteer-run.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 5000));
  }
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Copied from discover_providers.cjs (not exported there): a social profile or link-in-bio is not a
// site that can carry a claim, and cannot be the url of a row.
const NOT_A_SITE = /(^|\.)(facebook\.com|fb\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com|wa\.me|api\.whatsapp\.com|t\.me|linktr\.ee|bit\.ly|goo\.gl|sites\.google\.com|vk\.com|ok\.ru|business\.site|g\.page|maps\.app\.goo\.gl)$/i;

/** Which languages the OSM tags claim. Used only to rank and to report, never to publish. */
function osmLangs(t) {
  const yes = []; const no = [];
  for (const [k, v] of Object.entries(t)) {
    let m = /^(?:language|service:language):([a-z]{2,3})$/.exec(k);
    if (m) { (/^(yes|only|main)$/i.test(v) ? yes : no).push(m[1]); continue; }
    if (/^(languages|spoken_languages|language)$/.test(k)) {
      v.split(/[;,\s]+/).filter(Boolean).forEach((x) => yes.push(x.toLowerCase().slice(0, 3)));
    }
  }
  const note = Object.entries(t).filter(([k]) => new RegExp(NOTE_KEY).test(k)).map(([, v]) => v).join(' ');
  return { yes, no, note: new RegExp(NOTE_VAL, 'i').test(note) ? note : '' };
}

const CITIES = Object.values(M.CITY).filter((c) => typeof c.lat === 'number');
function place(lat, lng, radiusKm) {
  let best = null; let bd = Infinity;
  for (const c of CITIES) {
    if (Math.abs(c.lat - lat) > 1 || Math.abs(c.lng - lng) > 2) continue;
    const d = M.km({ lat, lng }, c);
    if (d < bd) { bd = d; best = c; }
  }
  return best && bd <= radiusKm ? { city: best, km: bd } : null;
}

function load(radiusKm) {
  const out = [];
  for (const [id, , , cat0] of TAGS) {
    const f = path.join(CACHE, `osm-${SIGNAL === 'name' ? 'name-' : ''}${id}.json`);
    if (!fs.existsSync(f)) { console.error(`missing ${f}, run fetch first`); process.exit(2); }
    for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) {
      const t = e.tags || {};
      const lat = e.lat != null ? e.lat : e.center && e.center.lat;
      const lng = e.lon != null ? e.lon : e.center && e.center.lon;
      if (typeof lat !== 'number') continue;
      let cat = cat0;
      if (cat0 === 'beauty') {
        cat = /hair|coiff|friseur|peluq|parruc|cabel|barber/i.test(`${t.beauty || ''} ${t.name || ''}`) ? 'hair' : 'beauty';
      }
      const site = (t.website || t['contact:website'] || t.url || '').split(';')[0].trim();
      const pl = place(lat, lng, radiusKm);
      out.push({ osm: `${e.type}/${e.id}`, tag: id, category: cat, name: clean(t.name || t['name:en'] || ''),
        site: /^https?:\/\//i.test(site) ? site : (site && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(site) ? `https://${site}` : ''),
        city: pl ? pl.city.id : '', country: pl ? pl.city.country : '', km: pl ? pl.km : null, langs: osmLangs(t) });
    }
  }
  return out;
}

function measure() {
  const radius = parseFloat(val('--radius', '10'));
  const all = load(radius);
  const res = { radiusKm: radius, worldwide: {}, inCities: {}, withSite: {}, withRealSite: {}, positiveOnly: {}, cities: {}, citySite: {} };
  const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const seen = new Set();
  for (const x of all) {
    if (seen.has(x.osm)) continue; seen.add(x.osm);
    inc(res.worldwide, x.category);
    if (!x.city) continue;
    inc(res.inCities, x.category);
    inc(res.cities, x.city);
    if (x.langs.yes.length || x.langs.note) inc(res.positiveOnly, x.category);
    if (x.site) { inc(res.withSite, x.category); inc(res.citySite, x.city); }
    if (x.site && !NOT_A_SITE.test(hostOf(x.site))) inc(res.withRealSite, x.category);
  }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
  res.cities = Object.fromEntries(top(res.cities));
  res.citySite = Object.fromEntries(top(res.citySite));
  fs.writeFileSync(path.join(CACHE, `measure-${SIGNAL}.json`), `${JSON.stringify(res, null, 1)}\n`);
  for (const k of ['worldwide', 'inCities', 'positiveOnly', 'withSite', 'withRealSite']) {
    const tot = Object.values(res[k]).reduce((a, b) => a + b, 0);
    console.log(`${k.padEnd(13)} ${tot}: ${top(res[k]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
  }
  console.log(`cities with any: ${Object.keys(res.cities).length}; top: ${top(res.cities).slice(0, 20).map(([c, n]) => `${c} ${n}`).join(', ')}`);
  console.log(`top with a site: ${top(res.citySite).slice(0, 20).map(([c, n]) => `${c} ${n}`).join(', ')}`);
}

// ---- verify ---------------------------------------------------------------------------------
const CONTACT_PATHS = ['', '/about', '/en', '/contact'];

async function fetchText(url, ms = 8000) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA_SITE }, signal: AbortSignal.timeout(ms) });
    if (!r.ok) return { status: r.status, text: '' };
    if (!/html|text/i.test(r.headers.get('content-type') || '')) return { status: 'not-html', text: '' };
    const buf = await r.text();
    return { status: 200, text: textOf(buf.slice(0, 1500000)) };
  } catch (e) { return { status: e.name === 'TimeoutError' ? 'timeout' : 'error', text: '' }; }
}

async function pool(items, limit, fn) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    for (;;) { const i = next; next += 1; if (i >= items.length) return; out[i] = await fn(items[i], i); }
  }));
  return out;
}

async function verify() {
  const radius = parseFloat(val('--radius', '10'));
  const SUPPORTED = new Set(Object.keys(M.LANGS)); // an object keyed by ISO code, not an array
  const db = M.DB.providers;
  const known = new Set(db.map((p) => `${p.city}|${clean(p.name).toLowerCase()}`));
  const knownHost = new Set(db.map((p) => `${p.city}|${hostOf(p.url || '')}`));
  const refused = [];
  const refuse = (x, reason, extra) => refused.push({ osm: x.osm, city: x.city, category: x.category, name: x.name, site: x.site, reason, ...(extra || {}) });

  const todo = []; const batch = new Set(); const seen = new Set();
  for (const x of load(radius)) {
    if (seen.has(x.osm)) continue; seen.add(x.osm);
    if (!x.city) continue; // outside every site city: not counted as a refusal
    if (x.category === 'beauty') { refuse(x, 'beauty salon, not a hair category'); continue; }
    if (!x.name) { refuse(x, 'no name'); continue; }
    if (!x.site) { refuse(x, 'no website tagged'); continue; }
    const h = hostOf(x.site);
    if (!h || NOT_A_SITE.test(h)) { refuse(x, 'social profile, not a site'); continue; }
    if (known.has(`${x.city}|${x.name.toLowerCase()}`) || knownHost.has(`${x.city}|${h}`)) { refuse(x, 'already listed'); continue; }
    if (batch.has(`${x.city}|${h}`)) { refuse(x, 'same site twice in batch'); continue; }
    batch.add(`${x.city}|${h}`);
    todo.push(x);
  }
  console.log(`${todo.length} sites to read`);
  let done = 0;
  const rows = await pool(todo, parseInt(val('--conc', '8'), 10), async (x) => {
    let claim = null; let claimUrl = ''; let anyText = false; const st = [];
    for (const p of CONTACT_PATHS) {
      const u = x.site.replace(/[?#].*$/, '').replace(/\/+$/, '') + p;
      // eslint-disable-next-line no-await-in-loop
      const r = await fetchText(u);
      st.push(r.status);
      if (!r.text) { if (p === '' && r.status !== 200 && r.status !== 404) break; continue; }
      anyText = true;
      claim = findClaim(r.text);
      if (claim) { claimUrl = u; break; }
    }
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${todo.length}`);
    // A page that answers 200 and still yields no text is rendered by script (sothebysrealty.com):
    // it is reachable, but there is nothing a plain fetch can quote, which is a different refusal.
    if (!anyText) { refuse(x, st.every((c) => c === 200) ? 'no readable text (script-rendered)' : 'unreachable', { status: st.join(',') }); return null; }
    if (!claim) { refuse(x, 'no language sentence on own site'); return null; }
    const local = M.LOCAL[x.country];
    const langs = claim.languages.filter((l) => l !== local && SUPPORTED.has(l));
    if (!langs.length) { refuse(x, 'claim names only the local language', { quote: claim.quote, languages: claim.languages }); return null; }
    if (/—/.test(claim.quote)) { refuse(x, 'quote carries an em-dash', { quote: claim.quote }); return null; }
    return {
      city: x.city, name: x.name, category: x.category, languages: langs, url: x.site, sourceUrl: claimUrl,
      evidence: 'self-declared', checked: today,
      note: `Its own site says: "${clean(claim.quote)}"`, claimQuote: clean(claim.quote), quote: clean(claim.quote),
      _foundVia: `openstreetmap ${x.osm}`, _osmLangs: x.langs.yes, _droppedLocal: claim.languages.filter((l) => !langs.includes(l)),
    };
  });
  const got = rows.filter(Boolean);
  const out = path.resolve(val('--out', path.join(CACHE, `proposals-${SIGNAL}.json`)));
  fs.writeFileSync(out, `${JSON.stringify({
    written: today,
    from: 'openstreetmap language-tagged candidates (candidate selection only)',
    source: {
      publisher: 'Each provider, on its own website',
      url: 'https://www.openstreetmap.org',
      licenceOrTermsQuote: 'OpenStreetMap data is used only to choose which provider websites to read; no OSM field is published. Each claim is the provider\'s own sentence.',
      pageNote: 'Each of these providers states on its own website which languages it works in; the quote on the card is that sentence.',
    },
    rows: got,
  }, null, 1)}\n`);
  fs.writeFileSync(path.join(CACHE, `refused-${SIGNAL}.json`), `${JSON.stringify(refused, null, 1)}\n`);
  const by = (arr, f) => arr.reduce((o, r) => { [].concat(f(r)).forEach((k) => { o[k] = (o[k] || 0) + 1; }); return o; }, {});
  const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
  console.log(`${todo.length} read -> ${got.length} claims`);
  console.log(`  by category: ${fmt(by(got, (r) => r.category))}`);
  console.log(`  by language: ${fmt(by(got, (r) => r.languages))}`);
  console.log(`  by city: ${fmt(by(got, (r) => r.city))}`);
  console.log(`  refused: ${fmt(by(refused, (r) => r.reason))}`);
  console.log(`wrote ${out}`);
}

(async () => {
  if (cmd === 'fetch') return fetchAll();
  if (cmd === 'measure') return measure();
  if (cmd === 'verify') return verify();
  console.error('usage: node scripts/osm_language_candidates.cjs <fetch|measure|verify> --cache <dir>');
  process.exit(2);
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Finds providers in the categories the consular lists never covered, and proves the language.
 *
 * WHY THIS EXISTS
 *
 * Every provider in this directory arrived through an embassy roster, and embassies publish lawyers
 * and doctors. The result is a directory that is 80% lawyers among the firms that have a website:
 * 1,522 lawyers against 19 vets, 15 hairdressers, 9 opticians, 3 mechanics and 2 gyms. A nomad
 * looking for a vet in Bangkok is not served by any of it, and no amount of further consular reading
 * fixes it, because those lists do not contain vets.
 *
 * So this sources the other way round: find the businesses, then prove the language claim from the
 * business's own words.
 *
 * THE RULE THIS OBEYS, AND WHY IT IS THE WHOLE SCRIPT
 *
 * The standing rule is a primary source or two that agree, else the row is labelled editorial. A
 * listing here rests on a sentence the provider published about the languages it works in, on its
 * own site, quoted in the row. Nothing is inferred:
 *
 *   - An English version of a website is NOT a claim. It is a fact about the website. MexTax has a
 *     French site and no French was published for it, for exactly this reason.
 *   - A clientele is not a language. Australian Dental Clinic said most of its sister clinic's
 *     patients are Japanese and no Japanese was published.
 *   - Google's own "speaks English" tags, review text and editorial summaries are other people's
 *     words about the business. They find candidates. They never justify a row.
 *
 * What counts is a sentence naming a language next to a word about speaking or serving in it:
 * "our vets speak fluent English", "English-speaking stylists", "wir sprechen Deutsch". The matched
 * sentence is stored on the row and printed in the note, so anybody can check the claim against the
 * page without trusting this script's judgement.
 *
 * THE NOTE IS THE QUOTE, ON PURPOSE
 *
 * check_service_notes.cjs fails a sentence carried by more than two rows, and rightly: a generated
 * "States it works in English." on two hundred cards is a sentence about the generator, not about
 * any provider. The provider's own sentence is unique to it, is the evidence, and is the most
 * useful thing the card can say.
 *
 * THREE STAGES, BECAUSE ONLY THE FIRST COSTS MONEY
 *
 *   plan     node scripts/discover_providers.cjs plan --city bangkok --cats vet,hair,fitness
 *              writes the Google Maps actor input. Maps is the only paid step, and it is only
 *              being asked "what businesses of this kind exist here, and what are their websites".
 *
 *   verify   node scripts/discover_providers.cjs verify <places.json>
 *              fetches each candidate's own site with plain node fetch, which costs nothing, and
 *              keeps only those that state a language. Writes data/proposals/discovered-<date>.json.
 *
 *   ingest   node scripts/discover_providers.cjs ingest <proposals.json> [--apply]
 *              previews, then on --apply writes the rows into data/service-languages.json and
 *              registers each site in data/service-sources.json.
 *
 * After ingest: node scripts/rebuild_services.cjs, then the contact harvest picks the new firms up
 * on its next run because it reads the catalogue, which is rebuilt from the directory.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT, 'data', 'service-languages.json');
const SRC_FILE = path.join(ROOT, 'data', 'service-sources.json');
const PROPOSALS = path.join(ROOT, 'data', 'proposals');
const today = new Date().toISOString().slice(0, 10);

const ACTOR = 'lukaskrivka/google-maps-with-contact-details';

/**
 * What to search Maps for, per category.
 *
 * The first pass asked for plain trade words, "hair salon in Bangkok", and 36 of 43 candidates
 * turned out to publish nothing about language: a 12% yield, because most hairdressers in Bangkok
 * serve Bangkok and have no reason to say anything about English.
 *
 * Asking for "English speaking hair salon" instead biases the candidate list towards businesses
 * that court foreigners, which is exactly the population that publishes a claim. That does NOT
 * weaken the evidence, and this is the distinction that matters: Google's match is only used to
 * decide whose website is worth reading. The claim still has to come from a sentence on the
 * provider's own site, checked by findClaim, which never sees the search query. A business that
 * games its Google description and says nothing on its own pages still gets nothing here.
 *
 * Both forms are kept: the expat-facing query finds the likely ones, the plain query keeps the net
 * wide enough to catch a clinic that happens to say so without advertising it.
 */
const QUERIES = {
  vet: ['English speaking veterinary clinic', 'veterinary clinic', 'animal hospital'],
  hair: ['English speaking hair salon', 'hair salon for expats', 'barber shop'],
  fitness: ['English speaking gym', 'personal trainer for expats'],
  mechanic: ['English speaking car repair', 'motorcycle repair for foreigners'],
  optician: ['English speaking optician', 'optician'],
  realestate: ['English speaking real estate agency', 'real estate agency for expats'],
  tax: ['English speaking tax advisor', 'accountant for expats'],
  physio: ['English speaking physiotherapy clinic', 'physiotherapy clinic'],
  dentist: ['English speaking dental clinic', 'dental clinic for expats'],
  therapy: ['English speaking psychologist', 'therapist for expats'],
};

// A language named beside a word about speaking it. The language name is captured so only what the
// sentence actually names gets recorded.
const LANGS = {
  // ingl[eêé]s covers Spanish "inglés" and Portuguese "inglês". Without the circumflex,
  // "Atendimento em inglês e português" published Portuguese and silently dropped English.
  en: '(english|englisch|ingl[eêé]s|anglais|inglese|engels|angielski|İngilizce|ingilizce)',
  de: '(german|deutsch|alem[aã]n|allemand|tedesco|almanca)',
  es: '(spanish|spanisch|espa[nñ]ol|espagnol|spagnolo)',
  fr: '(french|franz[oö]sisch|franc[eé]s|fran[cç]ais|francese|frans[iı]zca)',
  it: '(italian|italienisch|italiano|italien)',
  pt: '(portuguese|portugiesisch|portugu[eê]s|portugais)',
  ru: '(russian|russisch|ruso|russe|russo|русск|rus[cç]a)',
  nl: '(dutch|niederl[aä]ndisch|holand[eé]s|n[ée]erlandais|nederlands)',
  th: '(thai|thail[aä]ndisch)',
  vi: '(vietnamese|vietnamesisch|vietnamita|ti[eế]ng vi[eệ]t)',
  ja: '(japanese|japanisch|japon[eé]s|giapponese)',
  ko: '(korean|koreanisch|coreano)',
  zh: '(chinese|mandarin|chinesisch|chino|cinese)',
  ka: '(georgian|georgisch|ქართულ)',
  tr: '(turkish|t[uü]rkisch|turco|t[uü]rk[cç]e)',
  id: '(indonesian|bahasa indonesia|indonesisch)',
  ar: '(arabic|arabisch|[aá]rabe|عرب)',
  he: '(hebrew|hebr[aä]isch|hebreo|עברית)',
  el: '(greek|griechisch|griego|ελλην)',
  hu: '(hungarian|ungarisch|h[uú]ngaro|magyar)',
};

/**
 * What turns a language name into a claim.
 *
 * "Same sentence" is not enough, and the sentence that proved it was "We serve a full English
 * breakfast every morning": it names a language, it contains a service word, and it says nothing
 * whatsoever about what anybody speaks. So the language has to sit next to the claim, not merely
 * near it, and each rule below places it.
 *
 * ANY is every language pattern as one alternation, so a rule can say "a language, right here".
 */
/**
 * A language name must be a whole word.
 *
 * Without this, 'thai' matched inside Thailand, and a Bangkok clinic whose page said "Dental
 * Treatment Center in Bangkok, Thailand" was published as working in Thai. The same trap holds
 * 'german' inside Germany and 'deutsch' inside Deutschland: a postal address turned into a
 * working language.
 *
 * Letter lookarounds rather than \b, because \b in JavaScript is ASCII-only and would misfire on
 * the Cyrillic, Georgian, Hebrew and Arabic patterns, which are exactly the ones nobody checks.
 */
const LETTER = 'a-zA-Z\u00C0-\u024F';
const whole = (pat) => new RegExp(`(?<![${LETTER}])(?:${pat})(?![${LETTER}])`, 'i');

/**
 * A hedged claim is not a working language.
 *
 * "He speaks a bit of French too" is honest of the practice and useless to a reader who needs to
 * be understood. This directory exists to say who can work in a language, so "a bit of", "basic"
 * and "some" disqualify the sentence rather than colouring it.
 */
const HEDGED = /\b(a (little|bit)( of)?|basic|some|limited|rudimentary|ein (wenig|bisschen)|un poco( de)?|um pouco( de)?|un peu( de)?)\b/i;
const ANY_RAW = () => `(?:${Object.values(LANGS).join('|')})`;
const ANY = () => `(?<![${LETTER}])${ANY_RAW()}(?![${LETTER}])`;

const RULES = () => [
  // speaks / is fluent in / conversant in  ... English
  `(?:speaks?|speaking|spoken|fluent|fluency|conversant|bilingual)\\b[^.!?]{0,40}${ANY()}`,
  // English-speaking, English speakers, English spoken
  `${ANY()}[\\s-]{0,2}(?:speaking|speakers?|spoken)`,
  // deutschsprachig, englischsprachige
  `${ANY_RAW()}\\w{0,3}sprachig`,
  // available / offered / consultations / assistance ... IN ... English
  `(?:available|offered|conducted|provided|held|assist(?:ance)?|communicate|consultations?|support|treatment|service)\\b[^.!?]{0,25}\\bin\\b[^.!?]{0,25}${ANY()}`,
  // wir sprechen / spricht ... Deutsch
  `(?:sprechen|spricht|beraten|betreuung|beratung)\\b[^.!?]{0,40}${ANY()}`,
  // hablamos / falamos / parlons / parliamo ... inglés
  `(?:hablamos|habla|falamos|fala|parlons|parle|parliamo|parlant|konu[sş]\\w*)\\b[^.!?]{0,40}${ANY()}`,
  // atendimento em / atención en / service en ... inglês
  `(?:atendimento em|atenci[oó]n en|servicio en|service en|servizio in)\\b[^.!?]{0,30}${ANY()}`,
];

/**
 * A customer's words, on the business's own page.
 *
 * "Also, Jess speaks English which was super easy to tell her exactly what I wanted" is a review in
 * a testimonials block. It names a language, it sits next to a speaking verb, and it is not the
 * business saying anything: it is a customer saying it, which is precisely the kind of evidence this
 * script's own rules refuse from Google. Being quoted on the provider's own site does not make it
 * the provider's claim.
 *
 * The test is voice. A business says "we", "our", "unsere", "nuestro", "nossa", or says nothing
 * personal at all ("English spoken"). A customer says "I", "my", "me". Where a sentence carries the
 * customer's voice and none of the business's, it is a review and it is dropped.
 *
 * Kept deliberately English-only: "i" is the word "and" in Croatian and an article in Italian, and
 * "me" is ordinary in Spanish and Portuguese, so a looser test would silently delete real claims in
 * the languages this directory cares most about.
 */
const REVIEW_VOICE = /(\b[I]\b|\bI'(m|ve|d)\b|\bmy\b|\bme\b|\brecommend(ed|s)?\b|\bthank you\b)/;
const BUSINESS_VOICE = /\b(we|our|us|wir|unser\w*|nuestr\w+|noss\w+|notre|nos|nosotros|equipe|team|clinic|cl[ií]nica|praxis|kanzlei|studio|salon|hospital|praktijk)\b/i;

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * A "website" that is somebody else's platform.
 *
 * Google lists whatever the business put in the website field, and for small businesses that is
 * often a Facebook page, an Instagram profile, a link-in-bio or a site builder's preview URL.
 * None of them can carry a language claim we would accept, and none of them belongs in the url
 * field of a directory row either: build_outreach_dataset flags these hosts as profile pages
 * precisely because they cannot give a followed link back.
 */
const NOT_A_SITE = /(^|\.)(facebook\.com|fb\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com|wa\.me|api\.whatsapp\.com|t\.me|linktr\.ee|dif\.link|bit\.ly|goo\.gl|sites\.google\.com|.*\.my\.canva\.site|.*\.localo\.site|.*\.preview\.emergentagent\.com|seeuapp\.io|waddat\.com|inventore\.net|.*\.appbarber\.com\.br|m\.facebook\.com)$/i;

function isRealSite(url) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (NOT_A_SITE.test(h)) return false;
    // A site-builder preview or booking widget subdomain, e.g. foo.my.canva.site
    if (/\.(canva\.site|localo\.site|emergentagent\.com|appbarber\.com\.br|waddat\.com)$/i.test(h)) return false;
    return true;
  } catch (e) { return false; }
}

/** Cities, slug to name and country, straight out of the file that knows. */
function cities() {
  const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
  const a = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
  let d = 0; let e = -1;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '[') d += 1;
    else if (a[i] === ']') { d -= 1; if (!d) { e = i + 1; break; } }
  }
  // eslint-disable-next-line no-eval
  return new Map(eval(a.slice(0, e)).map((c) => [c.id, c]));
}

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

// ---- plan -------------------------------------------------------------------
function plan() {
  const CITY = cities();
  const slugs = val('--city', '').split(',').filter(Boolean);
  const cats = val('--cats', 'vet,hair,fitness').split(',').filter(Boolean);
  const per = parseInt(val('--per', '20'), 10);
  if (!slugs.length) { console.error('need --city <slug[,slug]>'); process.exit(2); }

  // The actor echoes the query it found each place through, as searchString. That string is the
  // only thing tying a result back to the city and category we asked about, so the mapping is
  // written down here rather than re-derived by guessing at place addresses later.
  const queries = [];
  const map = {};
  slugs.forEach((s) => {
    const c = CITY.get(s);
    if (!c) { console.error(`unknown city slug: ${s}`); process.exit(2); }
    cats.forEach((cat) => {
      (QUERIES[cat] || []).forEach((q) => {
        const full = `${q} in ${c.name}, ${c.country}`;
        queries.push(full);
        map[full] = { city: s, category: cat };
      });
    });
  });
  fs.writeFileSync(path.join(ROOT, 'data', 'discover-map.json'), `${JSON.stringify(map, null, 1)}\n`);

  const input = {
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: per,
    language: 'en',
    skipClosedPlaces: true,
    scrapePlaceDetailPage: false,
    website: 'withWebsite', // no site, no claim to read, so no row is possible
  };
  const out = path.join(ROOT, 'data', 'discover-input.json');
  fs.writeFileSync(out, `${JSON.stringify(input, null, 2)}\n`);
  console.log(`${queries.length} queries, up to ${per} places each, ${queries.length * per} places max`);
  console.log(`  at roughly $0.005 a place that is about $${(queries.length * per * 0.005).toFixed(2)}`);
  console.log(`wrote ${path.relative(ROOT, out)} for ${ACTOR}`);
  console.log('then: node scripts/discover_providers.cjs verify <places.json>');
}

// ---- verify -----------------------------------------------------------------
/** Split page text into sentences, cheaply and tolerantly. */
function sentences(text) {
  return clean(text)
    .split(/(?<=[.!?。])\s+|(?:\s\|\s)|(?:\s•\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 400);
}

/** Strip a page to readable text. */
function textOf(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&[a-z]+;/gi, ' ');
}


/**
 * Is this prose, or a navigation bar with the punctuation stripped out?
 *
 * A menu reads as one enormous sentence once the tags are gone: "Desenvolvido por PetDoctors
 * Veterinarios Facebook Flickr Instagram Tumblr Twitter Rss Email Toggle Sliding Bar Area Protocolo
 * com Servicos Analises Banhos Cirurgia Consultas Contacto Dermatologia Ecografia English-Speaking".
 * Every word of that is a link label, "English-Speaking" included, and quoting it on a card as
 * something the site says would be absurd. Menus capitalise nearly every word; prose does not.
 */
function looksLikeMenu(sentence) {
  const words = sentence.split(/\s+/).filter((w) => /[a-zA-ZÀ-ÿ]/.test(w));
  if (words.length < 8) return false;
  const capped = words.filter((w) => /^[A-ZÀ-Þ]/.test(w)).length;
  return capped / words.length > 0.4;
}

/**
 * The claim, cut down to the clause that carries it.
 *
 * A real claim can sit inside a long paragraph: "...bridged the gap for international patients by
 * offering: Fluent English communication for clear treatment plans." Rejecting the sentence for its
 * length would throw away a good provider; quoting all 277 characters on a card is unreadable. So
 * the quote is a window around the match, cut back to a delimiter.
 */
function tighten(sentence, at, len) {
  if (sentence.length <= 200) return sentence;
  let a = Math.max(0, at - 70);
  let b = Math.min(sentence.length, at + len + 110);
  const left = sentence.slice(0, a).search(/[.:;|•][^.:;|•]*$/);
  if (left >= 0 && at - left < 200) a = left + 1;
  const right = sentence.slice(b).search(/[.:;|•]/);
  if (right >= 0 && right < 80) b += right + 1;
  let out = sentence.slice(a, b).trim();
  if (a > 0) out = '... ' + out;
  if (b < sentence.length) out = out + ' ...';
  return out;
}

/**
 * The claim, or nothing.
 *
 * A sentence must name a language AND carry a word about speaking or serving in it. Both, on the
 * same sentence: "We are in the English Quarter" names a language and claims nothing, and "our team
 * is fluent" claims something and names nothing.
 */
function findClaim(text) {
  const out = [];
  const rules = RULES().map((r) => new RegExp(r, 'i'));
  for (const s of sentences(text)) {
    // One of the rules must place a language beside the claim. Only then is it worth asking which
    // languages the sentence names, because a list ("English, French and Arabic") is normal once
    // the sentence has been established as a claim at all.
    const hit = rules.map((r) => r.exec(s)).find(Boolean);
    if (!hit) continue;
    // A navigation bar is not a sentence and cannot be quoted as one.
    if (looksLikeMenu(s)) continue;
    // A review quoted on the page is not the page's claim.
    if (REVIEW_VOICE.test(s) && !BUSINESS_VOICE.test(s)) continue;
    // "a bit of French" is not a language this directory can send somebody to.
    if (HEDGED.test(s)) continue;
    const found = [];
    for (const [code, pat] of Object.entries(LANGS)) {
      // Whole word, with one exception: German glues the language to its suffix, so
      // "deutschsprachig" is the language Deutsch and must not be lost to the boundary that keeps
      // Deutschland out.
      if (whole(pat).test(s) || new RegExp(pat + '\\w{0,3}sprachig', 'i').test(s)) found.push(code);
    }
    if (!found.length) continue;
    // A sentence naming half the languages on earth is a language-selector menu, not a claim.
    if (found.length > 6) continue;
    out.push({ quote: tighten(s, hit.index, hit[0].length), languages: found });
  }
  if (!out.length) return null;
  // The most specific claim: fewest languages beats a long list, then the shortest sentence.
  out.sort((a, b) => a.languages.length - b.languages.length || a.quote.length - b.quote.length);
  return out[0];
}

// Four, not eight. A language claim lives on the front page or one click from it, and each extra
// path costs a full request timeout on every site that does not have it. Eight paths at twelve
// seconds meant a worst case of over a minute per candidate, serially, which is how a 43-site
// batch ran past seven minutes.
const CONTACT_PATHS = ['', '/about', '/en', '/contact'];

/** Run tasks with a ceiling on how many are in flight. Politeness and speed at once. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    for (;;) {
      const i = next; next += 1;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// An honest bot string first. A site that refuses it gets one more try as a browser, because a
// WAF answering 403 to a crawler is not the same as a site with nothing to say, and four of the
// candidate sites in one batch were exactly that: live, public, and invisible to a polite client.
const UA_BOT = 'Mozilla/5.0 (compatible; thenomadhq/1.0; +https://thenomadhq.com)';
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

async function fetchText(url, ms = 8000, ua = UA_BOT) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'user-agent': ua },
    });
    if (!r.ok) {
      clearTimeout(t);
      if (ua === UA_BOT && (r.status === 403 || r.status === 406 || r.status === 429)) {
        return fetchText(url, ms, UA_BROWSER);
      }
      return '';
    }
    const ct = r.headers.get('content-type') || '';
    if (!/html|text/i.test(ct)) return '';
    return textOf(await r.text());
  } catch (e) { return ''; } finally { clearTimeout(t); }
}

async function verify(file) {
  const CITY = cities();
  const mapFile = path.join(ROOT, 'data', 'discover-map.json');
  const MAP = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, 'utf8')) : {};
  const places = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).providers;
  const known = new Set(db.map((p) => `${p.city}|${clean(p.name).toLowerCase()}`));
  // city+host, not host alone. Thonglor Pet is listed in Chiang Mai and has a Bangkok branch;
  // keyed on the host the branch would be thrown away as a duplicate of a different city's clinic.
  const knownHost = new Set(db.map((p) => {
    try { return `${p.city}|${new URL(p.url).hostname.replace(/^www\./, '')}`; } catch (e) { return ''; }
  }));

  const rows = []; const skipped = { noSite: 0, notASite: 0, dupe: 0, noClaim: 0, unreachable: 0, noCity: 0 };
  let i = 0;
  for (const pl of places) {
    i += 1;
    const name = clean(pl.title || pl.name);
    const site = pl.website || pl.url || pl.site || '';
    if (!name || !site || !/^https?:/i.test(site)) { skipped.noSite += 1; continue; }
    if (!isRealSite(site)) { skipped.notASite += 1; continue; }

    // Two shapes arrive here. Google Maps rows carry the query they were found through, and the
    // plan wrote down what each query meant. A hand-assembled candidate list says city and category
    // outright. Neither is trusted for the language claim, which only the provider's own site can
    // settle, so accepting both costs nothing.
    const tag = MAP[pl.searchString] || MAP[pl.searchQuery] || {};
    const city = pl.city || pl._city || tag.city || '';
    const category = pl.category || pl._category || tag.category || '';
    const meta = CITY.get(city);
    if (!meta || !category) { skipped.noCity += 1; continue; }

    if (known.has(`${city}|${name.toLowerCase()}`)) { skipped.dupe += 1; continue; }
    let host = '';
    try { host = new URL(site).hostname.replace(/^www\./, ''); } catch (e) { /* ignore */ }
    if (host && knownHost.has(`${city}|${host}`)) { skipped.dupe += 1; continue; }

    process.stdout.write(`\r  ${i}/${places.length} ${name.slice(0, 40).padEnd(40)}`);

    let claim = null; let claimUrl = '';
    for (const p of CONTACT_PATHS) {
      const u = site.replace(/\/+$/, '') + p;
      // eslint-disable-next-line no-await-in-loop
      const text = await fetchText(u);
      if (!text) continue;
      claim = findClaim(text);
      if (claim) { claimUrl = u; break; }
    }
    if (!claim) { skipped.noClaim += 1; continue; }

    rows.push({
      city,
      name,
      category,
      languages: claim.languages,
      url: site,
      sourceUrl: claimUrl,
      evidence: 'self-declared',
      checked: today,
      area: clean(pl.street || pl.address || '') || undefined,
      note: `Its own site says: "${clean(claim.quote)}"`,
      claimQuote: clean(claim.quote),
    });
  }
  process.stdout.write('\r'.padEnd(60) + '\r');

  if (!fs.existsSync(PROPOSALS)) fs.mkdirSync(PROPOSALS, { recursive: true });
  const out = path.join(PROPOSALS, `discovered-${today}.json`);
  fs.writeFileSync(out, `${JSON.stringify({ written: today, from: ACTOR, rows }, null, 1)}\n`);

  console.log(`${places.length} candidates -> ${rows.length} with a language claim on their own site`);
  console.log(`  skipped: ${skipped.noClaim} state no language, ${skipped.dupe} already listed, `
    + `${skipped.notASite} have a Facebook page or link-in-bio instead of a site, `
    + `${skipped.noSite} have no website, ${skipped.noCity} could not be placed`);
  const byCat = {}; const byLang = {};
  rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + 1; r.languages.forEach((l) => { byLang[l] = (byLang[l] || 0) + 1; }); });
  console.log(`  categories: ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
  console.log(`  languages:  ${Object.entries(byLang).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
  console.log(`wrote ${path.relative(ROOT, out)}`);
}

// ---- ingest -----------------------------------------------------------------
function sourceId(url) {
  let host = 'unknown';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* ignore */ }
  let h = 0;
  for (let i = 0; i < url.length; i += 1) { h = ((h << 5) - h + url.charCodeAt(i)) | 0; }
  return `${host.replace(/[^a-z0-9]+/gi, '-')}-${(h >>> 0).toString(16).slice(0, 6)}`;
}

function ingest(file) {
  const apply = has('--apply');
  const { rows } = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'));

  const known = new Set(db.providers.map((p) => `${p.city}|${clean(p.name).toLowerCase()}`));
  const add = []; let dupe = 0; let bad = 0;

  rows.forEach((r) => {
    if (!r.city || !r.name || !r.category || !r.languages.length || !r.url || !r.claimQuote) { bad += 1; return; }
    if (known.has(`${r.city}|${clean(r.name).toLowerCase()}`)) { dupe += 1; return; }
    known.add(`${r.city}|${clean(r.name).toLowerCase()}`);
    const sid = sourceId(r.url);
    add.push({ row: {
      city: r.city,
      name: r.name,
      category: r.category,
      languages: r.languages,
      url: r.url,
      source: sid,
      evidence: 'self-declared',
      checked: r.checked || today,
      ...(r.area ? { area: r.area } : {}),
      note: r.note,
    },
    src: {
      url: r.sourceUrl || r.url,
      host: (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(),
      publisher: (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(),
      short: (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(),
      kind: 'other',
      evidence: 'self-declared',
      rows: 1,
      firstChecked: r.checked || today,
      lastChecked: r.checked || today,
      notePrefix: '',
      noteSuffix: '',
      pageNote: '',
    },
    sid });
  });

  console.log(`${rows.length} proposed: ${add.length} new, ${dupe} already listed, ${bad} incomplete`);
  add.slice(0, 12).forEach(({ row }) => {
    console.log(`  ${row.city.padEnd(12)} ${row.category.padEnd(10)} ${row.name.slice(0, 34).padEnd(34)} [${row.languages.join(',')}]`);
    console.log(`     ${row.note.slice(0, 120)}`);
  });
  if (add.length > 12) console.log(`  ... and ${add.length - 12} more`);

  if (!apply) { console.log('\npreview only. re-run with --apply to write.'); return; }

  add.forEach(({ row, src, sid }) => {
    db.providers.push(row);
    if (!sources[sid]) sources[sid] = src;
    else sources[sid].rows += 1;
  });
  fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
  fs.writeFileSync(SRC_FILE, `${JSON.stringify(sources, null, 1)}\n`);
  console.log(`\nwrote ${add.length} rows into data/service-languages.json`);
  console.log('now run: node scripts/rebuild_services.cjs');
}

// The claim detector is the only thing here that decides whether a row may exist, so it is
// exported and tested against sentences it must catch and sentences it must refuse.
module.exports = { findClaim, textOf, sentences, LANGS, RULES };

// ---- main -------------------------------------------------------------------
if (require.main !== module) return;

(async () => {
  if (cmd === 'plan') return plan();
  if (cmd === 'verify') {
    const f = argv[1];
    if (!f) { console.error('usage: verify <places.json>'); process.exit(2); }
    return verify(f);
  }
  if (cmd === 'ingest') {
    const f = argv[1];
    if (!f) { console.error('usage: ingest <proposals.json> [--apply]'); process.exit(2); }
    return ingest(f);
  }
  console.error('usage: node scripts/discover_providers.cjs <plan|verify|ingest> ...');
  process.exit(2);
})().catch((e) => { console.error(e); process.exit(1); });

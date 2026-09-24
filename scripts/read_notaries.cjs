/**
 * Reads the notaries in our cities who work in a foreign language, from the four national notary
 * chambers whose own public lists carry a per-notary language field and whose sites carry no clause
 * against reuse. Proposals only: the category "notary" does not exist in the directory yet, so
 * there is no ingest step here.
 *
 * WHY THESE FOUR, AND WHY NOT THE OBVIOUS ONE
 *
 * The obvious source is the European Directory of Notaries (notaries-directory.eu, run by CNUE,
 * about 50,000 notaries with "Languages spoken"). It is not used, for two reasons:
 *   - Its terms (read from Common Crawl captures of /en/disclaimer and /en/privacy-policy, November
 *     2024, because the live URLs now serve the "Change a notary's contact details" page) say:
 *     "You are not permitted to use this website other than for the following, private,
 *     non-commercial purposes ..." and "The use of automated systems or software to extract data
 *     from this website for commercial purposes, ('screen scraping') is prohibited." ASK CNUE
 *     (info@cnue.be) before touching it.
 *   - It runs Drupal's Ban module, and an IP that sends a handful of requests to paths that return
 *     403 lands in the ban table for good: every HTML page then answers "<ip> has been banned".
 *     Static files still answer 200, which makes the ban look lifted when it is not.
 * National chambers checked and left out for their terms: Spain (notariado.org, has "Idiomas";
 * aviso legal forbids "explotación, reproducción, distribución o comunicación pública, con fines
 * comerciales" without the CGN's consent), Austria (ihr-notariat.at, has the statutory
 * "Befähigung zur Errichtung von Notariatsakten in Englisch"; Impressum forbids storing content
 * "unter Verwendung elektronischer Systeme" without written consent), Belgium (notaris.be, has "Met
 * kennis van"; gebruiksvoorwaarden require Fednot's written consent to reproduce or use
 * commercially). Italy and Poland publish no language field at all.
 *
 * THE FOUR SOURCES
 *
 *   pt  Ordem dos Notários, Registo Público de Notários (ordem.notarios.pt/notarios). One list page
 *       of every notary; each detail page on notarios.pt has "Línguas: Inglês, Francês, Português".
 *       Footer: "Copyright © Ordem dos Notários", no terms of use. robots.txt disallows only
 *       /nova, /nova-api, /telescope, /pesquisa.
 *   cz  Notářská komora ČR, seznam notářů (www.nkcr.cz/seznam-notaru). A POST filtered by language
 *       returns every matching office nationwide in one page (no pagination; 206 for English):
 *       "Znalost cizího jazyka angličtina - Odborná znalost, němčina - Komunikační znalost".
 *       Footer: "© Copyright Notářská komora České republiky", no terms of use.
 *   hu  Magyar Országos Közjegyzői Kamara, Közjegyzőkereső (start.mokk.hu). A GWT app; its
 *       NSearchService.findOffices RPC answers a plain POST. The field is "Nyelvi jogosítvány", the
 *       statutory licence to draw up deeds in that language. Footer: "Minden jog fenntartva" (all
 *       rights reserved), no terms of use.
 *   nl  KNB, notaris.nl "Zoek een notaris". The page loads /api/vestigingen, every office as JSON;
 *       languages are among the office's "diensten", in the filter group "Talenkennis". notaris.nl
 *       states "notaris.nl is een website van de KNB"; it has a privacy page and no terms of use.
 * None of the four has a clause against extraction, reuse or commercial use. That is "no terms
 * found", not a licence; the report says so and the owner may prefer to ask first.
 *
 * THE RULE
 *
 *   - A language is published only as the chamber lists it for that notary or office. Nothing is
 *     inferred from a name, a website or a neighbouring office.
 *   - The country's own language is dropped (pt in Portugal, cs in Czechia, hu in Hungary, nl in the
 *     Netherlands). Slovak in Czechia is foreign and kept.
 *   - Czechia grades each language "Odborná znalost" (professional) or "Komunikační znalost"
 *     (conversational). Only professional is published by default; conversational is written to
 *     refused.json with its reason (pass --conversational to include it).
 *   - Czech "srbochorvatština" (Serbo-Croatian) is not one language code; it is refused, never
 *     guessed as hr or sr.
 *   - More than 6 languages for one notary refuses the notary whole (brief rule).
 *   - The city is the chamber's own town field (PT Concelho, CZ the town after the postcode, HU
 *     telepules, NL plaats), matched to a city in scripts/lib/service_data.cjs CITY of the same
 *     country after folding accents. No distance matching: Amstelveen is not Amsterdam and
 *     Vila Nova de Gaia is not Porto.
 *
 * TRAPS HIT
 *   - PT: cache file names built from the URL slug passed Windows' 260-character path limit inside
 *     the scratch folder and failed with ENOENT; files are named by the numeric id instead.
 *   - PT: 127 of the list's 598 detail links answered 404 on 2026-09-24 (listed, but no page); they
 *     are skipped and marked .404 in the cache so a re-run does not ask again.
 *   - PT: one "Línguas" value runs on into a sentence about an archive ("Português O acervo deste
 *     CN ..."); the value is cut at the first word that is not a language.
 *   - NL: "Duits" must be matched as a whole service name; a substring test also hits services such
 *     as "Grond of bezittingen in Duitsland".
 *   - HU: the RPC response is a GWT payload read backwards from the end; decodeGwt() handles the
 *     three types it uses (ArrayList, HashMap, String). Names of long-term deputies carry
 *     "<br/>(tartós helyettes)", which is cut.
 *
 * USAGE
 *   node scripts/read_notaries.cjs fetch   --cache <dir> [--src pt,cz,hu,nl]
 *   node scripts/read_notaries.cjs propose --cache <dir> [--conversational]
 * fetch is resumable and polite (one request at a time, 1.5 s apart). propose writes
 * <dir>/proposals.json and <dir>/refused.json.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const { CITY } = require('./lib/service_data.cjs');

const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const args = process.argv.slice(2);
const cmd = args[0];
const val = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'notaries')));
const SRCS = String(val('--src', 'pt,cz,hu,nl')).split(',');
const MAX_LANGS = 6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const mkdir = (d) => fs.mkdirSync(d, { recursive: true });
const gzWrite = (f, s) => { mkdir(path.dirname(f)); fs.writeFileSync(f, zlib.gzipSync(s)); };
const gzRead = (f) => zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
const decode = (s) => String(s)
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d)).replace(/&[a-z]+;/g, ' ');
const text = (html) => decode(String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/^'s-/, 's-').replace(/[^a-z0-9]+/g, ' ').trim();

async function get(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
  const body = await r.text();
  if (r.status === 403 || r.status === 429) throw new Error(`${r.status} from ${url}: stopping`);
  return { status: r.status, body };
}

// ---- cities -----------------------------------------------------------------------------------
const COUNTRY = { pt: 'Portugal', cz: 'Czech Republic', hu: 'Hungary', nl: 'Netherlands' };
const LOCAL = { pt: 'pt', cz: 'cs', hu: 'hu', nl: 'nl' };
// The chamber's town name where it differs from ours after folding.
const ALIAS = {
  pt: { lisboa: 'lisbon' },
  cz: { praha: 'prague' },
  hu: {},
  nl: { 's gravenhage': 'thehague', 'den haag': 'thehague' },
};
function cityOf(src, town) {
  const f = fold(town);
  if (ALIAS[src][f]) return ALIAS[src][f];
  for (const [id, c] of Object.entries(CITY)) {
    if (c.country === COUNTRY[src] && fold(c.name) === f) return id;
  }
  return null;
}

// ---- languages --------------------------------------------------------------------------------
const LANG = {
  pt: { 'inglês': 'en', 'espanhol': 'es', 'francês': 'fr', 'italiano': 'it', 'alemão': 'de', 'português': 'pt' },
  cz: {
    'angličtina': 'en', 'francouzština': 'fr', 'italština': 'it', 'němčina': 'de', 'nizozemština': 'nl',
    'polština': 'pl', 'ruština': 'ru', 'slovenština': 'sk', 'španělština': 'es',
  },
  hu: { angol: 'en', 'német': 'de', francia: 'fr', orosz: 'ru', olasz: 'it', spanyol: 'es' },
  nl: { Duits: 'de', Engels: 'en', Frans: 'fr', Italiaans: 'it', Spaans: 'es', Turks: 'tr' },
};
const CZ_LANG_IDS = { 1: 'angličtina', 56: 'francouzština', 22: 'italština', 2: 'němčina', 217: 'nizozemština',
  33: 'polština', 6: 'ruština', 204: 'slovenština', 43: 'španělština', 350: 'srbochorvatština' };

// ---- fetch ------------------------------------------------------------------------------------
async function fetchPt() {
  const dir = path.join(CACHE, 'pt');
  const listF = path.join(dir, 'list.html.gz');
  if (!fs.existsSync(listF)) gzWrite(listF, (await get('https://ordem.notarios.pt/notarios')).body);
  const urls = [...new Set([...gzRead(listF).matchAll(/href="(https:\/\/notarios\.pt\/notarios\/(\d+)-[^"]+)"/g)].map((m) => m[1]))];
  let n = 0; let gone = 0;
  for (const u of urls) {
    const f = path.join(dir, 'd', u.split('/').pop().split('-')[0] + '.gz');
    if (fs.existsSync(f) || fs.existsSync(f + '.404')) continue;
    const r = await get(u);
    if (r.status === 404) { fs.writeFileSync(f + '.404', u); gone += 1; } else if (r.status === 200) gzWrite(f, JSON.stringify({ url: u, html: r.body }));
    n += 1; await sleep(1500);
  }
  console.log(`pt: ${urls.length} notaries listed, ${n} fetched now, ${gone} gone (404)`);
}

async function fetchCz() {
  const dir = path.join(CACHE, 'cz');
  for (const [id, name] of Object.entries(CZ_LANG_IDS)) {
    const f = path.join(dir, `lang-${id}.html.gz`);
    if (fs.existsSync(f)) continue;
    const body = `f_first_name=&f_last_name=&f_address=&f_chamber_id=&f_language_id=${id}`;
    const r = await get('https://www.nkcr.cz/seznam-notaru', { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    gzWrite(f, r.body); console.log(`cz: ${name} ${(r.body.match(/class="search__result"/g) || []).length}`);
    await sleep(1500);
  }
}

// GWT-RPC for findOffices(name, seat, ..., language, county, ...). The request is the one the page
// sends, with every string blank except the language; the county left blank returns the country.
function huRequest(lang) {
  return `7|0|10|https://start.mokk.hu/mohikan/|85415268535CF51B02C8937DD7BD70FF|hu.mokk.mohikan.client.NSearchService|findOffices|java.lang.String/2004016611||${lang}|0;|hun|light|1|2|3|4|10|5|5|5|5|5|5|5|5|5|5|6|6|6|7|6|6|6|8|9|10|`;
}
async function fetchHu() {
  const dir = path.join(CACHE, 'hu');
  for (const lang of Object.keys(LANG.hu)) {
    const f = path.join(dir, `lang-${fold(lang)}.txt.gz`);
    if (fs.existsSync(f)) continue;
    const r = await get('https://start.mokk.hu/mohikan/NSearchService', {
      method: 'POST', body: huRequest(lang),
      headers: { 'Content-Type': 'text/x-gwt-rpc; charset=utf-8', 'X-GWT-Module-Base': 'https://start.mokk.hu/mohikan/', 'X-GWT-Permutation': '0' },
    });
    if (!r.body.startsWith('//OK')) throw new Error('hu: unexpected answer ' + r.body.slice(0, 80));
    gzWrite(f, r.body); console.log(`hu: ${lang} ${decodeGwt(r.body).length}`);
    await sleep(1500);
  }
}

async function fetchNl() {
  const f = path.join(CACHE, 'nl', 'vestigingen.json.gz');
  if (fs.existsSync(f)) return;
  const r = await get('https://www.notaris.nl/api/vestigingen');
  gzWrite(f, r.body); console.log(`nl: ${JSON.parse(r.body).length} offices`);
}

// ---- parse ------------------------------------------------------------------------------------
function decodeGwt(txt) {
  const j = eval(txt.slice(4)); // eslint-disable-line no-eval -- the payload is a JS array literal
  const tbl = j[j.length - 3]; let p = j.length - 4; const seen = []; const rd = () => j[p--];
  function obj() {
    const t = rd();
    if (t < 0) return seen[-t - 1];
    if (t === 0) return null;
    const ty = tbl[t - 1];
    if (ty.startsWith('java.lang.String/')) { const s = tbl[rd() - 1]; seen.push(s); return s; }
    if (ty.startsWith('java.util.ArrayList/')) { const a = []; seen.push(a); const n = rd(); for (let i = 0; i < n; i++) a.push(obj()); return a; }
    if (ty.startsWith('java.util.HashMap/')) { const m = {}; seen.push(m); const n = rd(); for (let i = 0; i < n; i++) { const k = obj(); m[k] = obj(); } return m; }
    throw new Error('gwt: unhandled type ' + ty);
  }
  return obj();
}

// Each yields { key, src, name, town, langs: [{word, code, level?}], url, sourceUrl, quote, area }
function* readPt() {
  const dir = path.join(CACHE, 'pt', 'd');
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.gz'))) {
    const { url: rawUrl, html } = JSON.parse(gzRead(path.join(dir, f)));
    const url = String(rawUrl).trim();
    const s = text(html);
    // The breadcrumb also says "Notário <name>", so the name is the last "Notário" before "Morada".
    const m = s.match(/Notário ((?:(?!Notário ).)+?) Morada: (.*?) Telefone:.*?Concelho: (.*?) Línguas: (.*?) Partilhar/);
    if (!m) continue;
    const words = [];
    for (const w of m[4].split(/,\s*|\s+/)) { if (!LANG.pt[w.toLowerCase()]) break; words.push(w); }
    yield {
      key: 'pt:' + f.replace('.gz', ''), src: 'pt', name: m[1].trim(), town: m[3].trim(), area: m[2].replace(/\s*Portugal$/, '').trim(),
      langs: words.map((w) => ({ word: w, code: LANG.pt[w.toLowerCase()] })),
      // The detail page has phone, fax and an @notarios.pt address but no website field.
      sourceUrl: url, quote: 'Línguas: ' + words.join(', '),
    };
  }
}

function* readCz() {
  const dir = path.join(CACHE, 'cz');
  const byId = new Map();
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('lang-'))) {
    const html = gzRead(path.join(dir, f));
    for (const li of html.split('<li class="search__result"').slice(1)) {
      const id = (li.match(/^\s*data-notary-id="(\d+)"/) || [])[1];
      const name = text((li.match(/<p class="search__name">([\s\S]*?)<\/p>/) || [])[1] || '');
      const addr = text((li.match(/icon-home"><\/i>([^<]+)</) || [])[1] || '');
      const langLine = text((li.match(/Znalost cizího jazyka([\s\S]*?)<\/p>\s*<\/div>/) || [])[1] || '');
      const kind = text((li.match(/<span class="notary-info__item">\s*<strong>([\s\S]*?)<\/strong>/) || [])[1] || '');
      const site = (li.match(/icon-globe"><\/i>\s*<a href="([^"]+)"/) || [])[1];
      if (!id || !name || !langLine) continue;
      // Offices outside the notary's seat ("Úřední dny mimo kancelář") are extra sitting days, not
      // a second practice; the seat ("Kancelář") is the row.
      if (!/Kancelář/.test(kind)) continue;
      const town = (addr.match(/\b\d{3}\s?\d{2}\s+(.+)$/) || [])[1] || '';
      byId.set(id, {
        key: 'cz:' + id, src: 'cz', name, town: town.replace(/\s+\d+$/, '').split(/\s*-\s*/)[0].trim(), area: addr,
        langs: langLine.split(/,\s*/).map((x) => { const [w, lvl] = x.split(/\s+-\s+/); return { word: w.trim(), code: LANG.cz[w.trim()], level: (lvl || '').trim() }; }),
        url: site, sourceUrl: 'https://www.nkcr.cz/seznam-notaru', quote: 'Znalost cizího jazyka ' + langLine,
      });
    }
  }
  yield* byId.values();
}

function* readHu() {
  const dir = path.join(CACHE, 'hu');
  const byCode = new Map();
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('lang-'))) {
    for (const o of decodeGwt(gzRead(path.join(dir, f)))) {
      if (byCode.has(o.szhkod)) continue;
      const words = String(o.nyelvijogositvany || '').split(/,\s*/).filter(Boolean);
      byCode.set(o.szhkod, {
        key: 'hu:' + o.szhkod, src: 'hu', name: String(o.nev).replace(/<br\/?>.*$/i, '').trim(), town: o.telepules,
        area: `${o.irszam} ${o.telepules}, ${o.cim}`,
        // One office writes "Angol" with a capital; the chamber's filter treats it as "angol".
        langs: words.map((w) => ({ word: w, code: LANG.hu[w.toLowerCase()] })),
        url: o.web || undefined, sourceUrl: 'https://start.mokk.hu/kozjegyzokereso.html', quote: 'Nyelvi jogosítvány: ' + words.join(', '),
      });
    }
  }
  yield* byCode.values();
}

function* readNl() {
  const f = path.join(CACHE, 'nl', 'vestigingen.json.gz');
  if (!fs.existsSync(f)) return;
  for (const v of JSON.parse(gzRead(f))) {
    const words = (v.diensten || []).filter((d) => Object.prototype.hasOwnProperty.call(LANG.nl, d));
    if (!words.length) continue;
    yield {
      key: 'nl:' + v.link, src: 'nl', name: v.title, town: v.plaats, area: `${v.adres}, ${v.postcode} ${v.plaats}`,
      langs: words.map((w) => ({ word: w, code: LANG.nl[w] })),
      url: v.website || undefined, sourceUrl: 'https://www.notaris.nl' + v.link, quote: 'Talenkennis: ' + words.join(', '),
    };
  }
}

// ---- propose ----------------------------------------------------------------------------------
const SOURCES = {
  pt: {
    publisher: 'Ordem dos Notários (Portugal)', url: 'https://ordem.notarios.pt/notarios',
    licenceOrTermsQuote: 'No terms of use found. Footer: "Copyright © Ordem dos Notários". robots.txt disallows only /nova, /nova-api, /telescope, /pesquisa.',
    pageNote: 'Some of these are on the public register of notaries kept by the Ordem dos Notários, Portugal\'s notarial chamber, which lists the languages each notary works in.',
  },
  cz: {
    publisher: 'Notářská komora České republiky', url: 'https://www.nkcr.cz/seznam-notaru',
    licenceOrTermsQuote: 'No terms of use found. Footer: "© Copyright Notářská komora České republiky."',
    pageNote: 'Some of these are on the list of notaries kept by the Czech Chamber of Notaries, which records each notary\'s foreign languages and whether the knowledge is professional or conversational. Only professional-level languages are listed here.',
  },
  hu: {
    publisher: 'Magyar Országos Közjegyzői Kamara', url: 'https://start.mokk.hu/kozjegyzokereso.html',
    licenceOrTermsQuote: 'No terms of use found. Footer of mokk.hu: "© 2023 Magyar Országos Közjegyzői Kamara MOKK.HU Minden jog fenntartva." (all rights reserved).',
    pageNote: 'Some of these are on the notary finder of the Hungarian National Chamber of Civil Law Notaries, which lists the languages each notary holds a licence to draw up deeds in.',
  },
  nl: {
    publisher: 'Koninklijke Notariële Beroepsorganisatie (KNB), notaris.nl', url: 'https://www.notaris.nl/algemeen/zoek-een-notaris',
    licenceOrTermsQuote: 'No terms of use found; notaris.nl has only a privacy page and states "notaris.nl is een website van de KNB". robots.txt is a 404.',
    pageNote: 'Some of these are on notaris.nl, the Royal Dutch Association of Civil-law Notaries\' office finder, where each office lists the languages it works in.',
  },
};

function propose() {
  const conversational = has('--conversational');
  const rows = []; const refused = []; const tally = {};
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  const checkedOf = (src) => {
    const d = path.join(CACHE, src);
    return fs.existsSync(d) ? fs.statSync(d).mtime.toISOString().slice(0, 10) : today();
  };
  for (const gen of [readPt, readCz, readHu, readNl]) {
    for (const n of gen()) {
      const city = cityOf(n.src, n.town);
      const foreign = n.langs.filter((l) => l.code !== LOCAL[n.src]);
      if (!foreign.length) { count(n.src + ': local language only'); continue; }
      if (!city) { count(n.src + ': not one of our cities'); continue; }
      const unknown = foreign.filter((l) => !l.code);
      unknown.forEach((l) => refused.push({ city, name: n.name, why: `language "${l.word}" has no single code` }));
      let ok = foreign.filter((l) => l.code);
      if (n.src === 'cz' && !conversational) {
        const low = ok.filter((l) => !/Odborná/.test(l.level));
        low.forEach((l) => refused.push({ city, name: n.name, why: `${l.word}: ${l.level} (conversational, held)` }));
        ok = ok.filter((l) => /Odborná/.test(l.level));
      }
      const codes = [...new Set(ok.map((l) => l.code))];
      if (!codes.length) { count(n.src + ': nothing publishable left'); continue; }
      if (codes.length > MAX_LANGS) { count(n.src + ': more than 6 languages'); refused.push({ city, name: n.name, why: codes.length + ' languages' }); continue; }
      rows.push({
        city, name: n.name, category: 'notary', languages: codes,
        ...(n.url ? { url: n.url } : {}),
        sourceUrl: n.sourceUrl, evidence: 'official', checked: checkedOf(n.src),
        ...(n.area ? { area: n.area } : {}),
        quote: n.quote, source: n.src,
      });
      count(n.src + ': proposed');
    }
  }
  const out = { written: today(), sources: SOURCES, rows };
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(tally);
  const by = {};
  rows.forEach((r) => { by[r.city] = (by[r.city] || 0) + 1; });
  console.log(by);
}

module.exports = { decodeGwt, cityOf, LANG };

if (require.main === module) {
  (async () => {
    mkdir(CACHE);
    if (cmd === 'fetch') {
      if (SRCS.includes('pt')) await fetchPt();
      if (SRCS.includes('cz')) await fetchCz();
      if (SRCS.includes('hu')) await fetchHu();
      if (SRCS.includes('nl')) await fetchNl();
      return;
    }
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_notaries.cjs <fetch|propose> --cache <dir> [--src pt,cz,hu,nl] [--conversational]');
    process.exit(2);
  })().catch((e) => { console.error(e.message); process.exit(1); });
}

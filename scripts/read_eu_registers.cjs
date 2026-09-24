/**
 * Reads the statutory registers of lawyers and tax advisers in Czechia, Slovakia, Slovenia,
 * Hungary, Lithuania, Portugal and Georgia that record, per named professional, the foreign languages they work in, and proposes a
 * row for each one whose office is in one of our cities.
 *
 * WHY THESE SOURCES
 *
 * Each is kept by the chamber the law makes responsible for the profession, and each prints a
 * language field on the entry of a named, licensed person. That is the official tier: a claim made
 * by the professional, published by the statutory body. Checked 2026-09-24 with their terms:
 *
 *   cz-cak  Česká advokátní komora (Czech Bar Association), vyhledavac.cak.cz. Every lawyer entry
 *           has a "Jazyk" field. The search page says of it: "Informace o jazykových znalostech a
 *           odborném zaměření uváděné u jednotlivých advokátů jsou publikovány na stránkách ČAK
 *           pouze podle sdělení příslušného advokáta. Tyto informace nejsou ČAK ověřovány či
 *           garantovány." (the lawyer's own statement, not checked by the Bar), which the page note
 *           says. Terms: none published; the footer says only "© 2024 - Česká advokátní komora -
 *           všechna práva vyhrazena". No reuse or extraction clause. vyhledavac.cak.cz has no
 *           robots.txt (404). www.cak.cz/robots.txt disallows only /admin/.
 *   cz-kdp  Komora daňových poradců ČR (Chamber of Tax Advisers, Act 523/1992), kdpcr.cz. The
 *           "Znalost jazyků" facet. Its "Informace k seznamu" page: "Specializace, Obory činnosti,
 *           Jazyky ... zadávají si je přímo jednotlivé osoby. KDP ČR obsah těchto údajů neověřuje".
 *           The same register is published as open data in the national catalogue (data.gov.cz,
 *           dataset 44995059/1353873921) with the terms "není autorskoprávně chráněnou databází"
 *           and "není chráněna zvláštním právem pořizovatele databáze", but that CSV has no
 *           language column, so the languages are read from the chamber's own list pages.
 *   sk-sak  Slovenská advokátska komora (Slovak Bar Association), sak.sk. The list page calls a
 *           public JSON API (/wp-json/sak/v1/lawyers, and /lawyers/{id} per lawyer) whose entry
 *           carries "languages". robots.txt: "Disallow:" (nothing). Footer: "© 2026 Slovenská
 *           Advokátska Komora. Všetky práva vyhradené". No terms page, no reuse clause.
 *   si-ozs  Odvetniška zbornica Slovenije (Bar Association of Slovenia), odv-zb.si, Imenik
 *           odvetnikov. The page embeds the whole directory as one JSON array with a "Jezik" field.
 *           Footer: "© Odvetniška zbornica Slovenije 2026. Vse pravice pridržane." No terms page,
 *           no reuse clause. robots.txt returns nothing restrictive.
 *   cz-nk   Notářská komora ČR (Notarial Chamber), nkcr.cz Seznam notářů: "Znalost cizího jazyka"
 *           with a level. No terms page; footer "© Copyright Notářská komora České republiky".
 *   hu-muk  Magyar Ügyvédi Kamara (Hungarian Bar Association), Országos Ügyvédkereső. Each lawyer
 *           record has "NYELVTUDÁS" (language skills). Impresszum names the editors only; no
 *           reuse clause found. BUT: the query host ouny.magyarugyvedikamara.hu serves a
 *           robots.txt of "User-agent: * / Disallow: /". The brief says terms decide, not
 *           robots.txt, so it is read here, and REPORT.md flags it for the owner.
 *   lt-la   Lietuvos advokatūra (Lithuanian Bar), advokatura.lt Advokatų paieška, "Kalba:" line.
 *           Footer "© 2026 Lietuvos advokatūra. Visos teisės saugomos." only; no reuse clause.
 *   pt-on   Ordem dos Notários (Portugal), notarios.pt: each notary page prints "Línguas:". Footer
 *           "Copyright © Ordem dos Notários" only; no terms page, no reuse clause.
 *   ge-gba  Georgian Bar Association (gba.ge), lawyer profiles with a languages line. Footer:
 *           '©2018 წელი, ყველა უფლება დაცულია' (all rights reserved); the only policy page is a
 *           privacy policy about visitors' data. robots.txt disallows /pdf/ and /files/ only.
 *
 * Checked and NOT read, because a clause forbids it (quotes in agents/eu-south-east/REPORT.md):
 * the Barcelona bar (ICAB: "está prohibida la reproducción, ... extracción, reutilización"), the
 * Bizkaia bar ("queda prohibida su reproducción ... ni aun citando las fuentes"), the Croatian bar
 * (HOK: "isključivo za osobnu uporabu"). Those are ASK PERMISSION.
 *
 * THE RULE
 *
 * The languages are the ones the register prints for the person, mapped to our ISO codes by name.
 * Nothing is added or inferred:
 *   - The local language is dropped (Czech in Czechia and so on). A foreign one is kept even where
 *     it is a neighbour's: Slovak in Czechia is a claim a Slovak reader can use.
 *   - A name the directory has no code for is dropped from the row and counted (Latin, Armenian,
 *     Bosnian, Macedonian, sign language), and so is "Serbo-Croatian": turning it into sr + hr
 *     would be us deciding what the lawyer meant.
 *   - A Hungarian entry qualified "alapfok" (basic level) is a hedge and is dropped; the language
 *     alone, or "középfok"/"felsőfok", is a claim.
 *   - More than six languages refuses the whole row, as everywhere else on the site.
 *   - Only active entries: suspended, struck-off or "not practising" ones are refused and counted.
 *   - Trainees (koncipienti) are not read: they cannot act for a client on their own.
 *
 * CITIES
 *
 * The city comes from the office town the register prints, matched against a table per source
 * (TOWNS below), never from the query. Portorož and Lucija are part of the Municipality of Piran
 * and are filed as Piran with the settlement as the area. A town not in the table is not ours.
 *
 * STAGES
 *
 *   fetch    node scripts/read_eu_registers.cjs fetch --cache <dir> [--source cz-cak,sk-sak,...]
 *              [--details]   every request is cached gzipped under <dir>/<source>/; resumable.
 *              --details also fetches each matched person's own page (ČAK, KDP, SAK), which is
 *              where the office address, website and full language list are; without it the
 *              languages are the union of the per-language searches.
 *   propose  node scripts/read_eu_registers.cjs propose --cache <dir> [--out <dir>]
 *              writes proposals.json (all sources, rows tagged with `dataset`), one
 *              proposals-<source>.json each, and refused.json.
 *
 * Then: node scripts/ingest_register_proposals.cjs <out>/proposals-<source>.json --apply
 *
 * TRAPS HIT
 *
 *   - ČAK's search is a POST whose criteria live in the session; the result pages are then GETs
 *     (/Home/SearchResult?page=N&pageSize=1000) on the same cookie. Without the cookie the POST
 *     redirects to a 500.
 *   - KDP's list search is a POST whose free-text box (f[ft]) filters on the text; posting the
 *     button label "Hledat" into it returned zero rows. The language facet is also a plain GET path
 *     (/seznam-danovych-poradcu/dp/<language>/), which is what this uses. The facet list includes
 *     struck-off and suspended advisers with a status line, which are refused here.
 *   - SAK's list cityName is free text ("BRATISLAVA 1", "Bratislava - Staré Mesto", "Košice -
 *     Západ"), so the town is matched on its first word, diacritics folded.
 *   - The Slovenian Kraj field is "1000 Ljubljana" but also "1231 Ljubljana - Črnuče".
 *   - MÜK returns every match for a chamber in one page (English in Budapest is thousands of
 *     records), and its language field is free text typed by the lawyer: split on commas.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'eu-registers')));
const OUT = path.resolve(val('--out', CACHE));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;
const TODAY = new Date().toISOString().slice(0, 10);

let LANGS = {};
try { LANGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'))._languages; } catch (e) { /* propose checks codes only when present */ }

const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase().trim();
const decode = (s) => String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'");
const text = (html) => decode(String(html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---- cache + polite fetch ----------------------------------------------------------------
const cfile = (src, key) => path.join(CACHE, src, key.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 180) + '.gz');
const cget = (src, key) => { const f = cfile(src, key); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString() : null; };
const cput = (src, key, body) => { const f = cfile(src, key); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(body)); };

class Jar {
  constructor() { this.c = {}; }
  take(res) {
    const all = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const sc of all) { const [kv] = sc.split(';'); const i = kv.indexOf('='); this.c[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); }
  }
  header() { return Object.entries(this.c).map(([k, v]) => k + '=' + v).join('; '); }
}

async function http(url, { method = 'GET', body, headers = {}, jar, tries = 3 } = {}) {
  for (let t = 1; ; t++) {
    try {
      const h = { 'User-Agent': UA, ...headers };
      if (jar && jar.header()) h.Cookie = jar.header();
      let u = url; let res;
      for (let hop = 0; hop < 5; hop++) { // follow redirects by hand so the jar sees every Set-Cookie
        res = await fetch(u, { method, body, headers: h, redirect: 'manual', signal: AbortSignal.timeout(90000) });
        if (jar) { jar.take(res); if (jar.header()) h.Cookie = jar.header(); }
        if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
          u = new URL(res.headers.get('location'), u).href; method = 'GET'; body = undefined; delete h['Content-Type']; continue;
        }
        break;
      }
      const txt = await res.text();
      if (res.status >= 500 && t < tries) { await sleep(2000 * t); continue; }
      return { status: res.status, text: txt, url: u };
    } catch (e) {
      if (t >= tries) throw e;
      await sleep(2000 * t);
    }
  }
}

// Runs jobs with at most `conc` in flight and a pause between starts: the brief's three per host.
async function pool(items, conc, fn, gap = 250) {
  let i = 0; let done = 0;
  const worker = async () => {
    while (i < items.length) {
      const it = items[i++];
      try { await fn(it); } catch (e) { console.error('  failed', JSON.stringify(it).slice(0, 120), e.message); }
      done += 1;
      if (done % 100 === 0) console.log('  ', done, '/', items.length);
      await sleep(gap);
    }
  };
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, worker));
}

// ---- language names -> codes ---------------------------------------------------------------
// Each table maps a folded stem to a code, or to null for a name the directory has no code for
// (counted and dropped, never guessed). The first matching stem wins, so longer stems go first.
const CS = [
  ['srbochorv', null], ['slovinsk', 'sl'], ['slovinst', 'sl'], ['slovensk', 'sk'], ['slovenst', 'sk'],
  ['albans', 'sq'], ['anglic', 'en'], ['arabs', 'ar'], ['armen', null], ['belorus', null], ['bosen', null],
  ['bulhar', 'bg'], ['cernohor', null], ['chaldaj', null], ['chorvat', 'hr'], ['cinst', 'zh'], ['cinsk', 'zh'],
  ['dans', 'da'], ['estons', 'et'], ['fins', 'fi'], ['francouz', 'fr'], ['gruzin', 'ka'], ['hebrej', 'he'],
  ['holand', 'nl'], ['nizozem', 'nl'], ['italsk', 'it'], ['italst', 'it'], ['japons', 'ja'], ['korej', 'ko'],
  ['latin', null], ['litev', 'lt'], ['lotys', 'lv'], ['madar', 'hu'], ['makedon', null], ['nemec', 'de'], ['nemc', 'de'],
  ['nors', 'no'], ['pasts', null], ['persk', 'fa'], ['polsk', 'pl'], ['polst', 'pl'], ['portugal', 'pt'],
  ['reck', 'el'], ['rectin', 'el'], ['rumun', 'ro'], ['rusk', 'ru'], ['rust', 'ru'], ['srbsk', 'sr'],
  ['svedsk', 'sv'], ['svedst', 'sv'], ['spanel', 'es'], ['tureck', 'tr'], ['turect', 'tr'], ['ukrajin', 'uk'],
  ['vietnam', 'vi'], ['znakov', null], ['cesk', 'cs'], ['cestin', 'cs'], ['hindi', 'hi'], ['indones', 'id'], ['thaj', 'th'],
];
const SK = [
  ['srbochorv', null], ['romsk', null], ['slovinsk', 'sl'], ['slovensk', 'sk'], ['anglick', 'en'], ['nemeck', 'de'],
  ['francuz', 'fr'], ['madar', 'hu'], ['cesk', 'cs'], ['polsk', 'pl'], ['rusk', 'ru'], ['russk', 'ru'], ['spaniel', 'es'],
  ['talian', 'it'], ['japon', 'ja'], ['arab', 'ar'], ['ukrajin', 'uk'], ['bulhar', 'bg'], ['rumun', 'ro'],
  ['portugal', 'pt'], ['chorvat', 'hr'], ['srbsk', 'sr'], ['cinsk', 'zh'], ['grec', 'el'], ['holand', 'nl'],
  ['svedsk', 'sv'], ['turec', 'tr'], ['latin', null], ['hebrej', 'he'], ['korej', 'ko'], ['vietnam', 'vi'],
];
const SL = [
  ['srbohrv', null], ['bosan', null], ['makedon', null], ['latin', null], ['anglesk', 'en'], ['angles', 'en'],
  ['nemsk', 'de'], ['nemsc', 'de'], ['hrvas', 'hr'], ['srbsk', 'sr'], ['srbsc', 'sr'], ['italij', 'it'], ['francos', 'fr'],
  ['spansk', 'es'], ['rusk', 'ru'], ['madzar', 'hu'], ['slovensk', 'sl'], ['cesk', 'cs'], ['slovask', 'sk'],
  ['polj', 'pl'], ['portugal', 'pt'], ['kitajs', 'zh'], ['japons', 'ja'], ['arabs', 'ar'], ['ukrajin', 'uk'], ['grs', 'el'],
];
const HU = [
  ['magyar', 'hu'], ['angol', 'en'], ['nemet', 'de'], ['francia', 'fr'], ['olasz', 'it'], ['spanyol', 'es'], ['orosz', 'ru'],
  ['kinai', 'zh'], ['japan', 'ja'], ['arab', 'ar'], ['heber', 'he'], ['lengyel', 'pl'], ['cseh', 'cs'], ['szlovak', 'sk'],
  ['szloven', 'sl'], ['roman', 'ro'], ['horvat', 'hr'], ['szerb', 'sr'], ['ukran', 'uk'], ['portugal', 'pt'], ['holland', 'nl'],
  ['sved', 'sv'], ['dan', 'da'], ['finn', 'fi'], ['gorog', 'el'], ['torok', 'tr'], ['bolgar', 'bg'], ['koreai', 'ko'],
  ['vietnam', 'vi'], ['perzsa', 'fa'], ['hindi', 'hi'], ['norveg', 'no'], ['eszt', 'et'], ['lett', 'lv'], ['litvan', 'lt'],
  ['alban', 'sq'], ['gruz', 'ka'], ['latin', null], ['eszperanto', null], ['jel', null], ['lovari', null], ['cigany', null], ['roma', null],
  ['szerbhorvat', null], ['bosnyak', null], ['maced', null], ['orman', null],
];
function mapLang(table, raw) {
  const f = fold(raw).replace(/[^\p{L}]/gu, ''); // letters of any script: the Georgian register writes its own
  if (!f) return { skip: true };
  // A Hungarian lawyer who types "angol (szerbhorvát)" or "szerbhorvát" means one language we have no code for.
  if (f.startsWith('szerbhorvat') || f.startsWith('srbochorv') || f.startsWith('srbohrv')) return { code: null, raw };
  for (const [stem, code] of table) if (f.startsWith(fold(stem))) return { code, raw };
  return { code: undefined, raw };
}

// ---- towns -> our city ids -----------------------------------------------------------------
// Keys are folded town names as the registers print them; values are city ids in
// scripts/lib/service_data.cjs CITY. Only these count.
const TOWNS = {
  cz: { praha: 'prague', brno: 'brno', olomouc: 'olomouc', plzen: 'plzen', 'karlovy vary': 'karlovyvary', liberec: 'liberec', 'cesky krumlov': 'ceskykrumlov', telc: 'telc' },
  sk: { bratislava: 'bratislava', kosice: 'kosice', zilina: 'zilina', nitra: 'nitra' },
  si: { ljubljana: 'ljubljana', maribor: 'maribor', bled: 'bled', piran: 'piran', portoroz: 'piran', lucija: 'piran' },
  hu: { budapest: 'budapest', debrecen: 'debrecen', pecs: 'pecs', miskolc: 'miskolc' },
};
function townCity(country, town) {
  const f = fold(town).replace(/\s*[-,].*$/, '').replace(/\s+\d+$/, '').trim();
  const T = TOWNS[country];
  if (T[f]) return T[f];
  const first2 = f.split(/\s+/).slice(0, 2).join(' ');
  if (T[first2]) return T[first2];
  const first = f.split(/\s+/)[0];
  return T[first] || null;
}
const LOCAL = { cz: 'cs', sk: 'sk', si: 'sl', hu: 'hu', ge: 'ka', lt: 'lt', pt: 'pt' };

// Casing only: registers print surnames or whole names in capitals. The words are theirs.
const TITLES = /^(et|judr|mgr|ing|phdr|rndr|mudr|doc|prof|bc|mba|llm|ll\.m|phd|ph\.d|csc|drsc|dr|jur|paeddr|mvdr|thdr|dipl)\.?$/i;
function nameCase(s) {
  return String(s || '').split(/(\s+|-)/).map((w) => {
    if (/^\s+$|^-$/.test(w) || !w) return w;
    if (TITLES.test(w.replace(/[.,]/g, ''))) {
      // JUDr. and Ph.D. stay as printed; a title the register prints in capitals (DR., PHD) is recased.
      if (/^PHD\.?,?$/.test(w)) return w.replace('PHD', 'PhD');
      // LL.M., LL.B. and MBA are written in capitals by convention and stay so; "Ll.m." was the bug.
      if (/^(DR|JUDR|MGR|ING|PROF|DOC)\.?,?$/.test(w)) return w.charAt(0) + w.slice(1).toLowerCase();
      return w;
    }
    if (w === w.toUpperCase() && /\p{L}/u.test(w)) return w.charAt(0) + w.slice(1).toLowerCase();
    return w;
  }).join('');
}

// =============================================================================================
// SOURCES
// =============================================================================================
const SOURCES = {};

// ---- Slovenia: one page, one JSON array ------------------------------------------------------
SOURCES['si-ozs'] = {
  country: 'si', category: 'legal',
  publisher: 'Odvetniška zbornica Slovenije (Bar Association of Slovenia)', short: 'the Slovenian Bar',
  url: 'https://www.odv-zb.si/odvetniska-zbornica/imenik/imenik-odvetnikov/',
  pageNote: 'Some of these are in the directory of lawyers kept by the Bar Association of Slovenia ' +
    '(Odvetniška zbornica Slovenije), which records languages for each lawyer.',
  async fetch() {
    if (cget('si-ozs', 'imenik') && !has('--refresh')) return;
    const r = await http(this.url);
    if (r.status !== 200 || !/var dataSet = \[/.test(r.text)) throw new Error('si-ozs: no dataSet on the page (' + r.status + ')');
    cput('si-ozs', 'imenik', r.text);
  },
  parse(ctx) {
    const html = cget('si-ozs', 'imenik');
    const data = JSON.parse(html.match(/var dataSet = (\[[\s\S]*?\]);\s/)[1]);
    const updated = (html.match(/Nazadnje posodobljeno ob: ([\d.]+)/) || [])[1];
    for (const d of data) {
      const kraj = String(d.Kraj || '').replace(/^\d{4}\s*/, '');
      const city = townCity('si', kraj);
      if (!city) continue;
      const langs = String(d.Jezik || '').split(',').filter(Boolean);
      const www = (String(d.Splet || '').match(/www:\s*(\S+)/) || [])[1];
      ctx.add({
        id: 'si-' + fold(d.Ime + ' ' + d.Priimek + ' ' + d.Naslov), city,
        name: nameCase((d.Ime + ' ' + d.Priimek).replace(/\s+/g, ' ').trim()),
        firm: d.Zaposlitev || undefined, rawLangs: langs, table: SL,
        url: www ? (/^https?:/.test(www) ? www : 'https://' + www) : undefined,
        sourceUrl: this.url, area: [d.Naslov, /^(portoroz|lucija)/.test(fold(kraj)) ? kraj : ''].filter(Boolean).join(', '),
        checked: ctx.mtime('si-ozs', 'imenik'), registerDate: updated,
      });
    }
  },
};

// ---- Slovakia: public JSON API ----------------------------------------------------------------
const SAK_LANGS = ['anglicky', 'nemecky', 'francuzsky', 'madarsky', 'cesky', 'polsky', 'russky', 'spanielsky', 'taliansky',
  'japonsky', 'arabsky', 'ukrajinsky', 'srbochorvatsky', 'romsky', 'bulharsky', 'rumunsky', 'portugalsky', 'chorvatsky'];
SOURCES['sk-sak'] = {
  country: 'sk', category: 'legal',
  publisher: 'Slovenská advokátska komora (Slovak Bar Association)', short: 'the Slovak Bar',
  api: 'https://www.sak.sk/wp-json/sak/v1/lawyers',
  pageNote: 'Some of these are on the list of lawyers kept by the Slovak Bar Association ' +
    '(Slovenská advokátska komora), which records the languages each lawyer works in.',
  async fetch() {
    for (const lang of SAK_LANGS) {
      for (let page = 0; ; page++) {
        const key = `list-${lang}-${page}`;
        let body = cget('sk-sak', key);
        if (!body) {
          const r = await http(`${this.api}?languageFilter=${lang}&pageSize=1000&page=${page}`);
          if (r.status !== 200) throw new Error('sk-sak ' + key + ' ' + r.status);
          body = r.text; cput('sk-sak', key, body); await sleep(300);
        }
        const d = JSON.parse(body);
        if (page + 1 >= d.totalPages) break;
      }
    }
    if (!has('--details')) return;
    const ids = [...new Set(this.listed().filter((x) => townCity('sk', x.cityName)).map((x) => x.registrationNumber))];
    const todo = ids.filter((id) => !cget('sk-sak', 'lawyer-' + id));
    console.log('sk-sak details:', ids.length, 'matched,', todo.length, 'to fetch');
    await pool(todo, 3, async (id) => {
      const r = await http(`${this.api}/${id}`);
      if (r.status === 200) cput('sk-sak', 'lawyer-' + id, r.text);
    });
  },
  listed() {
    const out = [];
    for (const lang of SAK_LANGS) {
      for (let page = 0; ; page++) {
        const body = cget('sk-sak', `list-${lang}-${page}`);
        if (!body) break;
        const d = JSON.parse(body);
        d.lawyers.forEach((x) => out.push({ ...x, lang }));
        if (page + 1 >= d.totalPages) break;
      }
    }
    return out;
  },
  parse(ctx) {
    const by = new Map();
    for (const x of this.listed()) {
      const city = townCity('sk', x.cityName);
      if (!city) continue;
      const o = by.get(x.registrationNumber) || { x, city, langs: new Set() };
      o.langs.add(x.lang); by.set(x.registrationNumber, o);
    }
    for (const [id, o] of by) {
      const det = cget('sk-sak', 'lawyer-' + id);
      const L = det ? JSON.parse(det).lawyer : null;
      let langs = [...o.langs]; let area; let url; let city = o.city;
      if (L) {
        const now = new Date().toISOString();
        const live = (a) => (a || []).some((s) => (!s.validFrom || s.validFrom <= now) && (!s.validTill || s.validTill >= now));
        if (live(L.suspensions) || live(L.removals)) { ctx.refuse({ source: 'sk-sak', name: L.name, why: 'suspended or removed' }); continue; }
        langs = L.languages || langs;
        const a = L.workplaceAddress || L.officeAddress || {};
        const c2 = townCity('sk', a.cityName || '');
        if (c2) city = c2;
        area = [a.street, a.buildingNumber, a.postalCode, a.cityName].filter(Boolean).join(' ').replace(/\s+/g, ' ');
        const w = L.contact && L.contact.website;
        url = w ? (/^https?:/.test(w) ? w : 'https://' + w) : undefined;
      }
      // "DETVAI Štefan JUDr." is surname in capitals, given name, then titles.
      const m = String(o.x.name).match(/^(\S+(?:-\S+)?(?:\s+[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]{2,}(?=\s))*)\s+(.*)$/u);
      let name = o.x.name;
      if (m) {
        const rest = m[2].split(/\s+/);
        const titles = rest.filter((w) => TITLES.test(w.replace(/[.,]/g, '')));
        const given = rest.filter((w) => !TITLES.test(w.replace(/[.,]/g, '')));
        name = [titles.join(' '), given.join(' '), nameCase(m[1])].filter(Boolean).join(' ');
      }
      ctx.add({
        id: 'sk-' + id, city, name, rawLangs: langs, table: SK, url, area,
        // The chamber's own share link for one lawyer (its "copy link" button builds it); the page renders
        // the same JSON the API returns, which is kept as apiUrl for whoever re-checks it.
        sourceUrl: `https://www.sak.sk/zoznam-advokatov/?sak_type=lawyers&sak_id=${id}`, apiUrl: `${this.api}/${id}`, checked: ctx.mtime('sk-sak', det ? 'lawyer-' + id : `list-${o.langs.values().next().value}-0`),
      });
    }
  },
};

// ---- Czechia: ČAK lawyers --------------------------------------------------------------------
const CAK = 'https://vyhledavac.cak.cz';
const CAK_TOWNS = ['Praha', 'Brno', 'Olomouc', 'Plzeň', 'Karlovy Vary', 'Liberec', 'Český Krumlov', 'Telč'];
SOURCES['cz-cak'] = {
  country: 'cz', category: 'legal',
  publisher: 'Česká advokátní komora (Czech Bar Association)', short: 'the Czech Bar',
  pageNote: 'Some of these are on the register of lawyers kept by the Czech Bar Association ' +
    '(Česká advokátní komora). The languages are the ones each lawyer reported to the Bar, which ' +
    'publishes them without checking them.',
  async languages() {
    let home = cget('cz-cak', 'home');
    if (!home) { home = (await http(CAK + '/')).text; cput('cz-cak', 'home', home); }
    const sel = home.match(/id="SelectedLanguage"[\s\S]*?<\/select>/)[0];
    return [...sel.matchAll(/<option value="([0-9a-f-]{36})">([^<]*)/g)].map((m) => ({ id: m[1], name: decode(m[2]) }));
  },
  async fetch() {
    const langs = (await this.languages()).filter((l) => mapLang(CS, l.name).code !== 'cs');
    for (const town of CAK_TOWNS) {
      for (const l of langs) {
        const key = `list-${fold(town)}-${fold(l.name)}`;
        if (cget('cz-cak', key + '-p1')) continue;
        const jar = new Jar();
        await http(CAK + '/', { jar });
        const form = new URLSearchParams({ SelectedSpecialisation: '', Surname: '', FirstName: '', Town: town, SelectedLanguage: l.id, CompanyName: '', RegistrationCode: '', SelectedCourtAppoinment: '99' });
        const r = await http(CAK + '/', { method: 'POST', body: form.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, jar });
        const total = +(text(r.text).match(/Zobrazeno advokátů: (\d+)/) || [])[1] || 0;
        const pages = Math.max(1, Math.ceil(total / 1000));
        for (let p = 1; p <= pages; p++) {
          const pr = total > 0 ? await http(`${CAK}/Home/SearchResult?page=${p}&pageSize=1000`, { jar }) : r;
          cput('cz-cak', `${key}-p${p}`, pr.text); await sleep(400);
        }
        console.log('  cz-cak', town, l.name, total);
      }
    }
    if (!has('--details')) return;
    const ids = [...new Set(this.listed().map((x) => x.id))];
    const todo = ids.filter((id) => !cget('cz-cak', 'contact-' + id));
    console.log('cz-cak details:', ids.length, 'listed,', todo.length, 'to fetch');
    await pool(todo, 3, async (id) => {
      const r = await http(`${CAK}/Contact/Details/${id}`);
      if (r.status === 200) cput('cz-cak', 'contact-' + id, r.text);
    });
  },
  listed() {
    const out = [];
    const dir = path.join(CACHE, 'cz-cak');
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('list-'))) {
      const m = f.match(/^list-(.+?)-(.+)-p\d+\.gz$/);
      const html = zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString();
      for (const row of html.split('<tr>').slice(2)) {
        const tds = row.split(/<td[^>]*>/).slice(1);
        const a = (tds[0] || '').match(/Contact\/Details\/([0-9a-f-]{36})">([^<]*)/);
        if (!a) continue; // a koncipient's row: the lawyer column is empty
        out.push({ id: a[1], label: decode(a[2]).trim(), status: text(tds[2]), firm: text(tds[4]), town: m[1], langFile: m[2] });
      }
    }
    return out;
  },
  parse(ctx) {
    const langNames = {};
    const by = new Map();
    for (const x of this.listed()) {
      const o = by.get(x.id) || { x, langs: new Set(), towns: new Set() };
      o.langs.add(x.langFile); o.towns.add(x.town); by.set(x.id, o);
    }
    for (const [id, o] of by) {
      if (!/^Aktivn/.test(o.x.status)) { ctx.refuse({ source: 'cz-cak', name: o.x.label, why: 'status ' + o.x.status }); continue; }
      const det = cget('cz-cak', 'contact-' + id);
      let city = townCity('cz', [...o.towns][0].replace(/_/g, ' '));
      let langs = [...o.langs].map((f) => f.replace(/_/g, ' '));
      let area; let url;
      if (det) {
        const t = text(det);
        // "Jazyk anglický francouzský Kontakty"; an empty field prints "Jazyk Kontakty", and a
        // pattern that insists on a space-bounded value then runs on to the firm's own Kontakty.
        const jm = t.match(/ Jazyk ((?:(?!Kontakty ).)*)Kontakty /);
        if (jm) langs = jm[1].split(/\s+/).filter(Boolean);
        const stav = (t.match(/ Stav (\S+)/) || [])[1];
        if (stav && !/^Aktivn/.test(stav)) { ctx.refuse({ source: 'cz-cak', name: o.x.label, why: 'status ' + stav }); continue; }
        const adr = (t.match(/ Adresa (.*?\d{3} ?\d{2} .+?)(?= Kontakty)/) || [])[1];
        if (adr) {
          const town = (adr.match(/\d{3} ?\d{2} (.+)$/) || [])[1];
          const c2 = town ? townCity('cz', town) : null;
          if (!c2) { ctx.refuse({ source: 'cz-cak', name: o.x.label, why: 'office town not ours: ' + town }); continue; }
          city = c2; area = adr.trim();
        }
        const w = (t.match(/ www (\S+\.\S+)/) || [])[1];
        if (w && !/^email$/i.test(w)) url = /^https?:/.test(w) ? w : 'https://' + w;
      }
      if (!city) continue;
      const label = o.x.label.replace(/^\d+\s*-\s*/, '');
      ctx.add({
        id: 'cz-' + id, city, name: nameCase(label), firm: o.x.firm || undefined, rawLangs: langs, table: CS,
        url, area, sourceUrl: `${CAK}/Contact/Details/${id}`, checked: ctx.mtime('cz-cak', det ? 'contact-' + id : null),
      });
    }
  },
};

// ---- Czechia: KDP tax advisers -------------------------------------------------------------------
const KDP = 'https://www.kdpcr.cz';
const KDP_LANGS = ['anglictina', 'bulharstina', 'finstina', 'francouzstina', 'italstina', 'japonstina', 'litevstina', 'madarstina',
  'nemcina', 'nizozemstina', 'polstina', 'rustina', 'rectina', 'slovenstina', 'slovinstina', 'srbochorvatstina', 'spanelstina',
  'svedstina', 'ukrajinstina', 'vietnamstina'];
SOURCES['cz-kdp'] = {
  country: 'cz', category: 'tax',
  publisher: 'Komora daňových poradců ČR (Chamber of Tax Advisers of the Czech Republic)', short: 'the Czech Chamber of Tax Advisers',
  pageNote: 'Some of these are on the list of tax advisers kept by the Chamber of Tax Advisers of the Czech ' +
    'Republic (Komora daňových poradců ČR). Each adviser enters their own languages, and the Chamber publishes ' +
    'them without checking them.',
  async fetch() {
    for (const lang of KDP_LANGS) {
      for (let from = 0; ; from += 20) {
        const key = `list-${lang}-${from}`;
        let body = cget('cz-kdp', key);
        if (!body) {
          const r = await http(`${KDP}/seznam-danovych-poradcu/dp/${lang}/${from ? '?from=' + from : ''}`);
          if (r.status !== 200) throw new Error('cz-kdp ' + key + ' ' + r.status);
          body = r.text; cput('cz-kdp', key, body); await sleep(400);
        }
        const total = +(text(body).match(/Celkem nalezeno (\d+)/) || [])[1] || 0;
        if (from + 20 >= total) { console.log('  cz-kdp', lang, total); break; }
      }
    }
    if (!has('--details')) return;
    const slugs = [...new Set(this.listed().filter((x) => townCity('cz', x.place)).map((x) => x.slug))];
    const todo = slugs.filter((s) => !cget('cz-kdp', 'dp-' + s));
    console.log('cz-kdp details:', slugs.length, 'matched,', todo.length, 'to fetch');
    await pool(todo, 2, async (s) => {
      const r = await http(`${KDP}/danovy-poradce/${s}`);
      if (r.status === 200) cput('cz-kdp', 'dp-' + s, r.text);
    }, 500);
  },
  listed() {
    const out = [];
    for (const lang of KDP_LANGS) {
      for (let from = 0; ; from += 20) {
        const body = cget('cz-kdp', `list-${lang}-${from}`);
        if (!body) break;
        for (const it of body.split('<div class="item">').slice(1)) {
          const slug = (it.match(/href="\/danovy-poradce\/([^"]+)"/) || [])[1];
          if (!slug) continue;
          out.push({
            slug, lang, name: text((it.match(/<h2>([\s\S]*?)<\/h2>/) || [])[1]),
            place: text((it.match(/<div class="place">([\s\S]*?)<\/div>/) || [])[1]),
            status: /Vyškrtnut|Pozastaven|Přerušen/.test(text(it)) ? text(it).match(/(Vyškrtnut\S*|Pozastaven\S*|Přerušen\S*)/)[1] : '',
            url: (it.match(/<div class="web">[\s\S]*?href="([^"]+)"/) || [])[1],
          });
        }
        const total = +(text(body).match(/Celkem nalezeno (\d+)/) || [])[1] || 0;
        if (from + 20 >= total) break;
      }
    }
    return out;
  },
  parse(ctx) {
    const by = new Map();
    for (const x of this.listed()) {
      const o = by.get(x.slug) || { x, langs: new Set() };
      o.langs.add(x.lang); by.set(x.slug, o);
    }
    for (const [slug, o] of by) {
      if (o.x.status) { ctx.refuse({ source: 'cz-kdp', name: o.x.name, why: 'status ' + o.x.status }); continue; }
      let city = townCity('cz', o.x.place);
      const det = cget('cz-kdp', 'dp-' + slug);
      let langs = [...o.langs]; let area; let url;
      if (det) {
        const t = text(det);
        // The profile runs "Jazyky Angličtina Slovenština Aktivity Účetní Certifikace ...": the
        // language list ends at whichever section heading follows it.
        const j = (t.match(/ Jazyky (.*?) (?:Aktivity|Certifikace|Kontaktní informace) /) || [])[1];
        if (j) langs = j.split(/\s+/);
        const sidlo = (t.match(/ Sídlo (.*?) (?:Kancelář|Pobočky|Telefon|E-mail|Datová)/) || [])[1];
        if (sidlo) {
          const town = (sidlo.match(/\d{3} ?\d{2} ([^,\d]+?)(?:\s+\d+)?$/) || [])[1];
          const c2 = town ? townCity('cz', town) : null;
          if (c2) city = c2;
          area = sidlo;
        }
        // The link text is shortened ("https://www.l...skipRedirect=true"); the href is the address.
        // A LinkedIn or Facebook profile is not the adviser's website and is not used as one.
        const w = decode((det.match(/Více na webu <a[^>]*href="([^"]+)"/) || [])[1] || '');
        if (w && !/linkedin\.com|facebook\.com|instagram\.com/i.test(w)) url = w;
      }
      if (!city) continue;
      ctx.add({
        id: 'kdp-' + slug, city, name: nameCase(o.x.name), rawLangs: langs, table: CS, url, area,
        sourceUrl: `${KDP}/danovy-poradce/${slug}`, checked: ctx.mtime('cz-kdp', det ? 'dp-' + slug : `list-${o.x.lang}-0`),
      });
    }
  },
};

// ---- Hungary: MÜK national register -------------------------------------------------------------
const MUK = 'https://ouny.magyarugyvedikamara.hu/licoms/common/service/requestparser';
const MUK_KAMARA = { 1867: 'budapest', 1869: 'debrecen', 1877: 'pecs', 1874: 'miskolc' };
const MUK_LANGS = ['angol', 'német', 'francia', 'olasz', 'spanyol', 'orosz', 'kínai', 'japán', 'arab', 'héber', 'lengyel', 'cseh',
  'szlovák', 'szlovén', 'román', 'horvát', 'szerb', 'ukrán', 'portugál', 'holland', 'svéd', 'dán', 'finn', 'görög', 'török',
  'bolgár', 'koreai', 'vietnámi', 'perzsa', 'norvég', 'észt', 'lett', 'litván', 'albán', 'grúz', 'hindi'];
const MUK_TYPES = ['ugyved', 'eur_kozjogasz'];
const mukUrl = (q) => MUK + '?' + new URLSearchParams({ name: 'pubsearcher', type: q.type, action: 'search', lname: '', status: 'aktiv', kasz: q.kasz || '', kamara: q.kamara || '', email: '', lang: q.lang || '', igazolvanyszam: '' });
SOURCES['hu-muk'] = {
  country: 'hu', category: 'legal',
  publisher: 'Magyar Ügyvédi Kamara (Hungarian Bar Association)', short: 'the Hungarian Bar',
  pageNote: 'Some of these are on the national register of lawyers kept by the Hungarian Bar Association ' +
    '(Magyar Ügyvédi Kamara), which lists each lawyer\'s language skills.',
  async fetch() {
    const jobs = [];
    for (const kamara of Object.keys(MUK_KAMARA)) for (const type of MUK_TYPES) for (const lang of MUK_LANGS) jobs.push({ kamara, type, lang });
    const todo = jobs.filter((q) => !cget('hu-muk', `q-${q.kamara}-${q.type}-${fold(q.lang)}`));
    console.log('hu-muk:', jobs.length, 'queries,', todo.length, 'to fetch');
    await pool(todo, 2, async (q) => {
      const r = await http(mukUrl(q), { headers: { Referer: 'https://magyarugyvedikamara.hu/html/nyilvanos-kereso/' } });
      if (r.status !== 200) throw new Error('hu-muk ' + r.status);
      cput('hu-muk', `q-${q.kamara}-${q.type}-${fold(q.lang)}`, r.text);
    }, 800);
    // The register prints 25 records a page ("Találatok: 5223" for English in Budapest) and pages
    // with &p=N. The first run of this reader missed that and read 25 of 5,223.
    const pages = [];
    for (const q of jobs) {
      const first = cget('hu-muk', `q-${q.kamara}-${q.type}-${fold(q.lang)}`);
      const total = +((first || '').match(/Találatok: (\d+)/) || [])[1] || 0;
      for (let p = 2; p <= Math.ceil(total / 25); p++) {
        const key = `q-${q.kamara}-${q.type}-${fold(q.lang)}-p${p}`;
        if (!cget('hu-muk', key)) pages.push({ ...q, p, key });
      }
    }
    console.log('hu-muk:', pages.length, 'further pages to fetch');
    await pool(pages, 2, async (q) => {
      const r = await http(mukUrl(q) + '&p=' + q.p, { headers: { Referer: 'https://magyarugyvedikamara.hu/html/nyilvanos-kereso/' } });
      if (r.status !== 200) throw new Error('hu-muk ' + r.status);
      cput('hu-muk', q.key, r.text);
    }, 800);
  },
  parse(ctx) {
    const dir = path.join(CACHE, 'hu-muk');
    const seen = new Set();
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('q-'))) {
      const [, kamara, type] = f.match(/^q-(\d+)-([a-z_]+)-/);
      const html = zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString();
      for (const rec of html.split('<div class="media-body">').slice(1)) {
        const field = (label) => {
          const m = rec.match(new RegExp('control-label">' + label + '[^<]*</label>\\s*<div[^>]*>\\s*<p class="form-control-static">([^<]*)</p>'));
          return m ? decode(m[1]).trim() : '';
        };
        const kasz = field('KAMARAI AZONOSÍTÓ SZÁM \\(KASZ\\)');
        if (!kasz || seen.has(kasz)) continue;
        seen.add(kasz);
        const name = field('KAMARAI NÉV');
        if (field('STÁTUSZ') !== 'AKTÍV') { ctx.refuse({ source: 'hu-muk', name, why: 'status ' + field('STÁTUSZ') }); continue; }
        const addr = field('CÍME');
        const town = (addr.match(/^\d{4}\s+(\S+)/) || [])[1] || '';
        const city = townCity('hu', town);
        if (!city) { ctx.refuse({ source: 'hu-muk', name, why: 'office not in our city: ' + addr }); continue; }
        if (city !== MUK_KAMARA[kamara]) { /* a Pest county lawyer with a Budapest office, or the reverse: the address decides */ }
        const langRaw = field('NYELVTUDÁS');
        const parts = langRaw.split(/[,;/]+|\s+ÉS\s+/).map((s) => s.trim()).filter((s) => s && s !== 'NINCS ADAT');
        const hedged = parts.filter((p) => /alapfok/i.test(fold(p)));
        if (hedged.length) ctx.count('hu-muk: language dropped as basic level (alapfok)', hedged.length);
        ctx.add({
          id: 'hu-' + kasz, city, name: nameCase(name), rawLangs: parts.filter((p) => !/alapfok/i.test(fold(p))).map((p) => p.replace(/\(.*?\)|\b(felsofok|kozepfok|felsőfok|középfok|szint)\b.*$/gi, '').trim()),
          table: HU, area: nameCase(addr), sourceUrl: mukUrl({ type, kasz }),
          checked: ctx.mtime('hu-muk', f.replace(/\.gz$/, '')), kind: type,
        });
      }
    }
  },
};

// ---- Georgia: GBA lawyer profiles -------------------------------------------------------------
// The Georgian Bar Association (a legal entity of public law under the Law on Advocates) publishes
// "ადვოკატის პროფილი", a profile per member who registered one, with a "ენები" (languages) line.
// The Georgian pages have the office address, the English pages often the Latin spelling of the
// name, so both are read and joined on the lawyer id. The language line is free text, in Georgian
// or English, split on commas, spaces and full stops.
const GBA_KA = 'https://gba.ge/ka/%E1%83%90%E1%83%93%E1%83%95%E1%83%9D%E1%83%99%E1%83%90%E1%83%A2%E1%83%94%E1%83%91%E1%83%98-%E1%83%A0%E1%83%94%E1%83%94%E1%83%A1%E1%83%A2%E1%83%A0%E1%83%98/%E1%83%90%E1%83%93%E1%83%95%E1%83%9D%E1%83%99%E1%83%90%E1%83%A2%E1%83%98%E1%83%A1-%E1%83%9E%E1%83%A0%E1%83%9D%E1%83%A4%E1%83%98%E1%83%9A%E1%83%98';
const GBA_EN = 'https://gba.ge/en/Lawyers/Lawyer%27s%20Profile';
const KA = [
  // Latin transliterations some lawyers type (qartuli, rusuli), and მშობლიური "native", which is a
  // level word, not a language, listed so it is not reported as an unknown name.
  ['qartul', 'ka'], ['rusul', 'ru'], ['inglisur', 'en'], ['germanul', 'de'], ['espanur', 'es'], ['frangul', 'fr'],
  ['italiur', 'it'], ['turkul', 'tr'], ['ივრით', 'he'], ['მშობლიურ', null],
  ['ქართულ', 'ka'], ['georgian', 'ka'], ['ინგლის', 'en'], ['english', 'en'], ['რუს', 'ru'], ['russian', 'ru'],
  ['გერმან', 'de'], ['german', 'de'], ['ფრანგ', 'fr'], ['french', 'fr'], ['ესპან', 'es'], ['spanish', 'es'],
  ['იტალ', 'it'], ['italian', 'it'], ['თურქ', 'tr'], ['turkish', 'tr'], ['უკრაინ', 'uk'], ['ukrainian', 'uk'],
  ['ებრა', 'he'], ['hebrew', 'he'], ['არაბ', 'ar'], ['arabic', 'ar'], ['ჩინ', 'zh'], ['chinese', 'zh'],
  ['ბერძ', 'el'], ['greek', 'el'], ['პოლონ', 'pl'], ['polish', 'pl'], ['იაპონ', 'ja'], ['japanese', 'ja'],
  ['სპარს', 'fa'], ['persian', 'fa'], ['ჰოლანდ', 'nl'], ['dutch', 'nl'], ['პორტუგ', 'pt'], ['portuguese', 'pt'],
  ['კორე', 'ko'], ['korean', 'ko'], ['ჩეხ', 'cs'], ['czech', 'cs'], ['ბულგარ', 'bg'], ['bulgarian', 'bg'],
  ['ლიტვ', 'lt'], ['ლატვ', 'lv'], ['ესტონ', 'et'], ['შვედ', 'sv'], ['swedish', 'sv'], ['ფინ', 'fi'],
  ['სომხ', null], ['armenian', null], ['აზერბ', null], ['azerbaijani', null], ['ოსურ', null], ['აფხაზ', null],
  ['ლათინ', null], ['latin', null], ['ბელორ', null], ['ყაზახ', null],
];
const GEO_TOWNS = { 'თბილის': 'tbilisi', tbilisi: 'tbilisi', 'ბათუმ': 'batumi', batumi: 'batumi', 'ქუთაის': 'kutaisi', kutaisi: 'kutaisi', 'სიღნაღ': 'sighnaghi', 'მესტია': 'mestia', 'სტეფანწმინდ': 'stepantsminda' };
function gbaCards(html) {
  return html.split('<div class="col-lg-7 col-md-7">').slice(1).map((c) => {
    const id = (c.match(/lawyer=(\d+)/) || [])[1];
    const name = decode((c.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '').trim();
    const f = {};
    for (const m of c.matchAll(/<h4[^>]*>([^<]*):<\/h4>\s*<h4>([\s\S]*?)<\/h4>/g)) f[decode(m[1]).trim()] = decode(m[2]).replace(/\s+/g, ' ').trim();
    return { id, name, f };
  }).filter((x) => x.id);
}
// The line is typed by the lawyer: "ქართული, ინგლისური (B2), რუსული (basic)". It is split into
// comma-separated parts first, and a part that carries a basic-level word is dropped whole, because
// "Russian (basic)" is a hedge, not a claim. Level words that are not hedges (B2, fluent, native,
// საშუალო "intermediate") are not language names and fall out as unknown tokens. Misspellings
// ("Inglish", "ნგლისური") are left unknown rather than corrected.
const GE_HEDGE = /basic|elementary|beginner|\bA1\b|\bA2\b|საბაზისო|დამწყებ|ელემენტარ|ცოტა|სუსტ|ლექსიკონ/i;
function gbaLangs(line, ctx) {
  const out = [];
  for (const part of String(line).split(/[,;/\n]+/)) {
    if (GE_HEDGE.test(part)) { ctx.count('ge-gba: a language dropped as basic level'); continue; }
    out.push(...part.split(/[\s.()\-_]+/).filter(Boolean));
  }
  return out;
}
SOURCES['ge-gba'] = {
  country: 'ge', category: 'legal',
  publisher: 'საქართველოს ადვოკატთა ასოციაცია (Georgian Bar Association)', short: 'the Georgian Bar Association',
  url: GBA_EN,
  pageNote: 'Some of these have a profile in the register of lawyers kept by the Georgian Bar Association, ' +
    'where each lawyer lists the languages they work in.',
  async fetch() {
    for (const [lang, base] of [['ka', GBA_KA], ['en', GBA_EN]]) {
      for (let p = 1; p < 200; p++) {
        const key = `${lang}-${p}`;
        let body = cget('ge-gba', key);
        if (!body) {
          const r = await http(`${base}?page=${p}`);
          if (r.status !== 200) throw new Error('ge-gba ' + key + ' ' + r.status);
          body = r.text; cput('ge-gba', key, body); await sleep(600);
        }
        if (!gbaCards(body).length) break;
      }
    }
  },
  parse(ctx) {
    const dir = path.join(CACHE, 'ge-gba');
    const by = {};
    for (const f of fs.readdirSync(dir)) {
      const lang = f.slice(0, 2);
      for (const c of gbaCards(zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString())) {
        by[c.id] = by[c.id] || {};
        by[c.id][lang] = c;
      }
    }
    for (const [id, o] of Object.entries(by)) {
      const ka = o.ka || { f: {} }; const en = o.en || { f: {} };
      const addr = ka.f['მისამართი'] || en.f.Address || '';
      const af = fold(addr);
      const city = Object.entries(GEO_TOWNS).find(([k]) => af.includes(fold(k)));
      if (!city) { if (addr) ctx.refuse({ source: 'ge-gba', name: ka.name || en.name, why: 'office not in our city: ' + addr }); continue; }
      const langLine = en.f.Languages || ka.f['ენები'] || '';
      const name = en.name && /[A-Za-z]/.test(en.name) ? en.name : (ka.name || en.name);
      ctx.add({
        id: 'ge-' + id, city: city[1], name, rawLangs: gbaLangs(langLine, ctx), quote: langLine, table: KA,
        area: addr, sourceUrl: `${GBA_EN}?lawyer=${id}`, checked: ctx.mtime('ge-gba', 'en-1'),
      });
    }
  },
};

// ---- Czechia: Notářská komora notaries -------------------------------------------------------
// The Notarial Chamber's "Seznam notářů" prints, per notary, "Znalost cizího jazyka" with a level:
// "Odborná znalost" (professional) or "Komunikační znalost" (conversational). Both are claims to work
// in the language; neither is a hedge like "basic", so both are kept, and the level is carried in the
// quote. One GET per regional chamber returns every notary of that chamber on one page.
// Terms: none published; footer "© Copyright Notářská komora České republiky". robots.txt disallows
// /admin/, /chranena-zona/ and the translated trees only.
const NK = 'https://www.nkcr.cz/seznam-notaru';
const NK_CHAMBERS = [3, 9, 8, 1, 2, 6, 12, 7];
SOURCES['cz-nk'] = {
  country: 'cz', category: 'legal',
  publisher: 'Notářská komora České republiky (Notarial Chamber of the Czech Republic)', short: 'the Czech Notarial Chamber',
  url: NK,
  pageNote: 'Some of these are notaries on the list kept by the Notarial Chamber of the Czech Republic, ' +
    'which records the foreign languages each notary works in.',
  async fetch() {
    for (const c of NK_CHAMBERS) {
      if (cget('cz-nk', 'chamber-' + c)) continue;
      const r = await http(`${NK}?f_chamber_id=${c}`);
      if (r.status !== 200) throw new Error('cz-nk ' + c + ' ' + r.status);
      cput('cz-nk', 'chamber-' + c, r.text); await sleep(1500);
    }
  },
  parse(ctx) {
    for (const c of NK_CHAMBERS) {
      const html = cget('cz-nk', 'chamber-' + c);
      if (!html) continue;
      for (const item of html.split('<div class="pb-item">').slice(1)) {
        const name = text((item.match(/<p class="title search__name">([\s\S]*?)<\/p>/) || [])[1]);
        const home = (item.match(/icon-home"><\/i>([\s\S]*?)<\/p>/) || [])[1] || '';
        const addr = text(home.replace(/<br\s*\/?>/g, ', '));
        const town = (addr.match(/\d{3} ?\d{2} ([^\d,]+?)(?:\s+\d+)?$/) || [])[1] || '';
        const city = townCity('cz', town);
        if (!city) continue;
        const langBlock = (item.match(/Znalost cizího jazyka<\/strong><\/p>\s*<p>([\s\S]*?)<\/p>/) || [])[1];
        if (!langBlock) { ctx.count('cz-nk: no language on the entry'); continue; }
        const pairs = text(langBlock).split(',').map((s) => s.trim()).filter(Boolean);
        const www = (item.match(/icon-globe"><\/i>\s*<a href="([^"]+)"/) || [])[1];
        ctx.add({
          id: 'nk-' + fold(name + addr), city, name, rawLangs: pairs.map((p) => p.split(' - ')[0]),
          quote: pairs.join(', '), table: CS, url: www, area: addr,
          sourceUrl: `${NK}?f_chamber_id=${c}`, checked: ctx.mtime('cz-nk', 'chamber-' + c),
        });
      }
    }
  },
};

// ---- Lithuania: Lietuvos advokatūra -----------------------------------------------------------
// The Lithuanian Bar's "Advokatų paieška" prints "Kalba: anglų, lietuvių, rusų" under a lawyer where
// one is recorded (55 of the first 150 Vilnius results). The city filter (mf3c01title_search2) is a
// text match, so the office town is still read from the printed address. 100 per page,
// cntnt01page=N. Terms: none published beyond "© 2026 Lietuvos advokatūra. Visos teisės saugomos."
// and a data-protection page; robots.txt disallows /admin/ and /uploads/apsaugoti/ only.
const LA = 'https://www.advokatura.lt/irasai/advokatu-paieska/';
const LT = [
  ['anglu', 'en'], ['rusu', 'ru'], ['vokieciu', 'de'], ['prancuzu', 'fr'], ['lenku', 'pl'], ['ispanu', 'es'], ['italu', 'it'],
  ['lietuviu', 'lt'], ['latviu', 'lv'], ['estu', 'et'], ['svedu', 'sv'], ['norvegu', 'no'], ['danu', 'da'], ['suomiu', 'fi'],
  ['ukrainieciu', 'uk'], ['kinu', 'zh'], ['japonu', 'ja'], ['hebraju', 'he'], ['arabu', 'ar'], ['turku', 'tr'], ['portugalu', 'pt'],
  ['olandu', 'nl'], ['nyderlandu', 'nl'], ['ceku', 'cs'], ['slovaku', 'sk'], ['graiku', 'el'], ['gruzinu', 'ka'], ['vengru', 'hu'],
  ['rumunu', 'ro'], ['bulgaru', 'bg'], ['serbu', 'sr'], ['kroatu', 'hr'], ['baltarusiu', null], ['armenu', null], ['lotynu', null],
  ['azerbaidzanieciu', null], ['kazachu', null], ['gestu', null],
];
const LT_TOWNS = { vilnius: 'vilnius', kaunas: 'kaunas', klaipeda: 'klaipeda', trakai: 'trakai', panevezys: 'panevezys' };
SOURCES['lt-la'] = {
  country: 'lt', category: 'legal',
  publisher: 'Lietuvos advokatūra (Lithuanian Bar Association)', short: 'the Lithuanian Bar',
  url: LA,
  pageNote: 'Some of these are on the list of practising lawyers kept by the Lithuanian Bar Association ' +
    '(Lietuvos advokatūra), which shows the languages a lawyer works in where one is recorded.',
  async fetch() {
    for (const town of ['Vilnius', 'Kaunas', 'Klaipėda', 'Trakai', 'Panevėžys']) {
      for (let p = 1; p < 60; p++) {
        const key = `${fold(town)}-${p}`;
        let body = cget('lt-la', key);
        if (!body) {
          const r = await http(`${LA}?cntnt01page=${p}&mf3c01title_search2=${encodeURIComponent(town)}&mf3c01product_limit=100`);
          if (r.status !== 200) throw new Error('lt-la ' + key + ' ' + r.status);
          body = r.text; cput('lt-la', key, body); await sleep(1000);
        }
        const total = +(text(body).match(/Paieškos rezultatai \((\d+)\)/) || [])[1] || 0;
        if (p * 100 >= total) { console.log('  lt-la', town, total); break; }
      }
    }
  },
  parse(ctx) {
    const dir = path.join(CACHE, 'lt-la');
    for (const f of fs.readdirSync(dir)) {
      const html = zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString();
      for (const item of html.split('<div class="search-people-item">').slice(1)) {
        const links = [...item.matchAll(/<a href="(https:\/\/www\.advokatura\.lt\/iraso-informacija\/advokatu-paieska\/[^"]+)">([\s\S]*?)<\/a>/g)];
        if (!links.length) continue;
        const name = text(links[0][2]);
        const firm = links[1] ? text(links[1][2]) : undefined;
        const addr = text((item.match(/<\/div>\s*<div>\s*<i class="fa">[\s\S]*?<\/i>([\s\S]*?)<\/div>/) || [])[1]);
        const town = fold((addr.match(/LT-?\s?\d{5}\s+(.+)$/) || addr.match(/,\s*([^,]+)$/) || [])[1] || '');
        const city = LT_TOWNS[town.split(/\s+/)[0]];
        if (!city) continue;
        const kalba = (item.match(/Kalba:\s*([\s\S]*?)<\/div>/) || [])[1];
        if (!kalba) { ctx.count('lt-la: no language on the entry'); continue; }
        ctx.add({
          id: 'lt-' + links[0][1], city, name, firm, rawLangs: text(kalba).split(',').map((s) => s.trim()), table: LT,
          area: addr, sourceUrl: links[0][1].replace(/\?.*$/, ''), checked: ctx.mtime('lt-la', f.replace(/\.gz$/, '')),
        });
      }
    }
  },
};

// ---- Portugal: Ordem dos Notários ------------------------------------------------------------
// The Ordem dos Notários' "Pesquise o seu Notário" lists notaries by concelho (municipality) with a
// plain GET (/notarios?search=&concelho=Lisboa&page=N), and each notary's page prints
// "Línguas: Inglês, Espanhol, Francês, Português". The language filter on the home page is a
// Livewire widget, so it is not used: every notary in our concelhos is read and the page decides.
// Ericeira is a parish of Mafra; a Mafra notary counts as Ericeira only if the address says so.
// Terms: none published; the footer says "Copyright © Ordem dos Notários", and the privacy policy
// is about visitors' data. robots.txt disallows /nova, /nova-api, /nova-vendor, /telescope and
// /pesquisa, none of which this uses.
const ON = 'https://notarios.pt/notarios';
const PT_CONCELHOS = {
  Lisboa: 'lisbon', Porto: 'porto', Faro: 'faro', Mafra: 'ericeira', Cascais: 'cascais', Coimbra: 'coimbra', Funchal: 'funchal',
  'Ponta Delgada': 'pontadelgada', Aveiro: 'aveiro', Sintra: 'sintra', Braga: 'braga', 'Guimarães': 'guimaraes', 'Nazaré': 'nazare',
  'Óbidos': 'obidos', 'Reguengos de Monsaraz': 'monsaraz', 'Marvão': 'marvao', 'Setúbal': 'setubal', 'Évora': 'evora',
};
const PT = [
  ['ingles', 'en'], ['espanhol', 'es'], ['castelhano', 'es'], ['frances', 'fr'], ['alemao', 'de'], ['italiano', 'it'],
  ['portugues', 'pt'], ['russo', 'ru'], ['chines', 'zh'], ['mandarim', 'zh'], ['arabe', 'ar'], ['ucraniano', 'uk'],
  ['romeno', 'ro'], ['holandes', 'nl'], ['neerlandes', 'nl'], ['polaco', 'pl'], ['japones', 'ja'], ['hebraico', 'he'],
  ['grego', 'el'], ['sueco', 'sv'], ['dinamarques', 'da'], ['turco', 'tr'], ['hindi', 'hi'], ['crioulo', null], ['latim', null],
];
SOURCES['pt-on'] = {
  country: 'pt', category: 'legal',
  publisher: 'Ordem dos Notários (Portuguese Chamber of Notaries)', short: 'the Portuguese Chamber of Notaries',
  url: ON,
  pageNote: 'Some of these are notaries on the public register kept by the Ordem dos Notários, ' +
    'Portugal\'s chamber of notaries, which lists the languages each notary works in.',
  async fetch() {
    const slugs = new Set();
    for (const c of Object.keys(PT_CONCELHOS)) {
      for (let p = 1; p < 30; p++) {
        const key = `list-${fold(c)}-${p}`;
        let body = cget('pt-on', key);
        if (!body) {
          const r = await http(`${ON}?search=&concelho=${encodeURIComponent(c)}&page=${p}`);
          if (r.status !== 200) throw new Error('pt-on ' + key + ' ' + r.status);
          body = r.text; cput('pt-on', key, body); await sleep(800);
        }
        const found = [...body.matchAll(/handleNotario\('([^']+)'\)/g)].map((m) => m[1]);
        found.forEach((s) => slugs.add(s));
        if (!new RegExp(`page=${p + 1}\\b`).test(body)) break;
      }
    }
    const todo = [...slugs].filter((s) => !cget('pt-on', 'n-' + s));
    console.log('pt-on:', slugs.size, 'notaries,', todo.length, 'to fetch');
    await pool(todo, 2, async (s) => {
      const r = await http(`${ON}/${s}`);
      if (r.status === 200) cput('pt-on', 'n-' + s, r.text);
    }, 700);
  },
  parse(ctx) {
    const dir = path.join(CACHE, 'pt-on');
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('n-'))) {
      const slug = f.replace(/^n-|\.gz$/g, '');
      const t = text(zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString());
      // The name is printed twice ("Preferências Notário X Home Notários Notário X Morada:"): take
      // the one next to the address.
      const name = (t.match(/.* Notári[oa] (.+?) Morada:/) || [])[1];
      const addr = ((t.match(/ Morada: (.*?) Portugal Telefone:/) || t.match(/ Morada: (.*?) (?:Telefone|Email|Distrito):/) || [])[1] || '').trim();
      const conc = ((t.match(/ Concelho: (.*?) (?:Línguas|Partilhar):/) || [])[1] || '').trim();
      const key = Object.keys(PT_CONCELHOS).find((k) => fold(k) === fold(conc));
      if (!name || !key) continue;
      if (key === 'Mafra' && !/ericeira/i.test(addr)) continue;
      const langs = (t.match(/ Línguas: (.*?) Partilhar:/) || [])[1];
      if (!langs) { ctx.count('pt-on: no language on the entry'); continue; }
      ctx.add({
        id: 'pt-' + slug, city: PT_CONCELHOS[key], name: 'Notário ' + name, rawLangs: langs.split(',').map((s) => s.trim()),
        table: PT, area: addr, sourceUrl: `${ON}/${slug}`, checked: ctx.mtime('pt-on', 'n-' + slug),
      });
    }
  },
};

// =============================================================================================
// propose
// =============================================================================================
function propose() {
  const only = val('--source', Object.keys(SOURCES).join(',')).split(',');
  const rows = []; const refused = []; const tally = {};
  const count = (k, n = 1) => { tally[k] = (tally[k] || 0) + n; };
  const unknown = {};
  for (const sid of only) {
    const S = SOURCES[sid];
    if (!fs.existsSync(path.join(CACHE, sid))) { console.log('no cache for', sid); continue; }
    const seen = new Set();
    const ctx = {
      count,
      refuse: (r) => { refused.push(r); count(sid + ': refused, ' + r.why.replace(/:.*$/, '')); },
      mtime: (src, key) => { const f = key ? cfile(src, key) : null; return f && fs.existsSync(f) ? fs.statSync(f).mtime.toISOString().slice(0, 10) : TODAY; },
      add: (r) => {
        if (seen.has(r.id)) return;
        seen.add(r.id);
        const codes = new Set(); const dropped = [];
        for (const raw of r.rawLangs) {
          const m = mapLang(r.table, raw);
          if (m.skip) continue;
          if (m.code === undefined) { unknown[sid + ':' + raw] = (unknown[sid + ':' + raw] || 0) + 1; dropped.push(raw); continue; }
          if (m.code === null) { dropped.push(raw); continue; }
          if (m.code === LOCAL[S.country]) continue;
          if (Object.keys(LANGS).length && !LANGS[m.code]) { dropped.push(raw); continue; }
          codes.add(m.code);
        }
        const languages = [...codes];
        if (!languages.length) { count(sid + ': no foreign language we can publish'); return; }
        if (languages.length > MAX_LANGS) { refused.push({ source: sid, name: r.name, why: languages.length + ' languages' }); count(sid + ': refused, more than 6 languages'); return; }
        if (dropped.length) count(sid + ': a language name dropped (no code, or Serbo-Croatian)');
        rows.push({
          dataset: sid, city: r.city, name: r.name, category: S.category, languages,
          ...(r.url ? { url: r.url } : {}), sourceUrl: r.sourceUrl, evidence: 'official', checked: r.checked,
          ...(r.area ? { area: r.area } : {}),
          quote: r.quote || r.rawLangs.join(', '),
          ...(r.firm ? { firm: r.firm } : {}),
          ...(r.apiUrl ? { apiUrl: r.apiUrl } : {}),
        });
        count(sid + ': proposed');
      },
    };
    S.parse(ctx);
  }
  const datasets = {}; const pageNotes = {};
  for (const sid of only) {
    const S = SOURCES[sid];
    datasets[sid] = { publisher: S.publisher, short: S.short, kind: 'register' };
    pageNotes[sid] = S.pageNote;
    const mine = rows.filter((r) => r.dataset === sid);
    if (!mine.length) continue;
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `proposals-${sid}.json`), JSON.stringify({
      written: TODAY,
      source: { publisher: S.publisher, short: S.short, kind: 'register', url: S.url || S.api || mine[0].sourceUrl, pageNote: S.pageNote },
      rows: mine.map(({ dataset, ...r }) => r),
    }, null, 1));
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify({ written: TODAY, datasets, pageNotes, rows }, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify({ refused, unknownLanguageNames: unknown }, null, 1));
  console.log(tally);
  const by = {};
  rows.forEach((r) => { const k = r.city + ' ' + r.category; by[k] = (by[k] || 0) + 1; });
  console.log(by);
  if (Object.keys(unknown).length) console.log('unmapped language names:', unknown);
}

async function fetchAll() {
  const only = val('--source', Object.keys(SOURCES).join(',')).split(',');
  for (const sid of only) {
    console.log('fetch', sid);
    try { await SOURCES[sid].fetch(); } catch (e) { console.error(sid, 'FAILED', e.message); }
  }
}

module.exports = { SOURCES, mapLang, townCity, nameCase, CS, SK, SL, HU };

if (require.main === module) {
  (async () => {
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_eu_registers.cjs <fetch|propose> --cache <dir> [--source a,b] [--details] [--out <dir>]');
    process.exit(2);
  })();
}

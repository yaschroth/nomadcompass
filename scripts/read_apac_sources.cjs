/**
 * Reads the Asia-Pacific official lists that name a provider and the foreign languages it works in,
 * and whose terms allow the reuse. Four sources survived a search of eighteen countries (the full
 * table of what was checked and refused, with the terms quoted, is in the research report):
 *
 *   vic       Victorian Legal Services Board + Commissioner, Register of Lawyers (Melbourne, Geelong).
 *             The statutory regulator's register prints "Languages:" for every lawyer who gave one.
 *             Terms: "You may download, print and otherwise reproduce information on the website
 *             subject to the condition that you include the copyright notice © Victorian Legal
 *             Services Board and Commissioner." (lsbc.vic.gov.au/terms-use)
 *   nzls      New Zealand Law Society, Find a lawyer (Auckland, Wellington, Christchurch, Dunedin,
 *             Queenstown, Wanaka, Rotorua, Nelson, Napier, New Plymouth, Whangarei).
 *             The statutory regulator collects "a lawyer's practice areas and languages spoken" so that
 *             "a member of the public [can] contact a suitable lawyer" (its Information Handling
 *             Policy, May 2026). The website terms are a disclaimer only; nothing bans reuse.
 *   tw-re     Taiwan, "具外語服務之租賃住宅業者清單", rental housing businesses and estate agents with
 *             foreign-language service, provided by "the government department responsible for the
 *             rental property market" and published by the National Development Council's Gold Card
 *             Office (Taipei, Taichung). Terms: the Office's Open Government Declaration lets anyone
 *             "reproduce, adapt, edit, publicly transmit ... develop various products or services"
 *             free of charge, provided "the user should state the source".
 *   tw-hosp   Taiwan, "雙語醫院友善名單", the Bilingual Friendly Hospital List the same page credits to the
 *             Ministry of Health and Welfare (Taipei, Taichung, Tainan, Kaohsiung). Same declaration.
 *
 * Which cities count comes from scripts/lib/service_data.cjs CITY (all 1,000); data/city_list.json
 * holds only 410 of them, and every proposed row is checked against CITY before anything is written.
 *
 * THE RULES THIS READER APPLIES
 *
 * - A language is published only where the source itself names it for that provider. The NZ
 *   register never prints a lawyer's languages on the lawyer's page: the only evidence is that its
 *   own search returns the lawyer for "Speaks: French". That is the regulator's field, filtered by the
 *   regulator, so it is used, and the sourceUrl is that filtered search.
 * - The local language is never published: English in Australia and New Zealand, Chinese (with
 *   Cantonese, which the Taiwanese list names as 粵語 or 廣東話) in Taiwan.
 * - More than six languages for one provider is refused whole, counting every language the source
 *   lists except the local one, mapped or not.
 * - Dialect and umbrella names are not guessed into a language: Hokkien, Teo Chew, Shanghainese,
 *   "Malaysian", "Bahasa (unspecified)", "Indian", "Lebanese", "Serbo-Croatian", Dari and Flemish are
 *   counted toward the cap but mapped to nothing. Mandarin, Cantonese, Yue and "Chinese
 *   (unspecified)" are Chinese.
 * - Lawyers who cannot take a private client are left out: Victoria's "Corporate" (in-house),
 *   "Government" and "Volunteer" practising certificates and "No current practising certificate".
 *   Barristers stay: in Victoria and New Zealand a barrister can be instructed directly.
 * - The Taiwanese hospital list is a list of hospitals with a bilingual (Chinese and English)
 *   service environment. Its only claim is English, and that is the only language proposed.
 *
 * TRAPS HIT
 *
 * - VLSB+C: the search form POSTs a Drupal form, and the obvious GET names (register_search_*)
 *   are silently ignored and return the whole register (41,413 rows). The working GET is
 *   ?type=lawyer&language=French&start_rank=11, ten per page, no page-size parameter works.
 *   An unknown language returns a page with no results block, not zero.
 * - VLSB+C's language autocomplete caps at ten answers, so the list is built by prefix expansion.
 * - NZLS: /search/ is disallowed in robots.txt, the find-a-lawyer page is not; page=N paginates.
 *   Tongan and other filter values return nothing: the filter lists languages nobody has claimed.
 * - Taiwan PDFs: this machine's pdftotext is xpdf 4.00 (no -bbox). -table and -layout put cells
 *   at fixed character offsets, but the headers are centred over their columns and the cells are
 *   vertically centred, so neither header offsets nor whitespace gutters cut the columns reliably
 *   (a long English name runs into the next column, a column of "無" is one character wide). -raw
 *   reads an Excel-printed PDF cell by cell in row order, and that is what the real-estate list is
 *   read from. The hospital list comes out of -raw with its names in pairs but its numbers
 *   elsewhere, so it is zipped with -table's one line per row, and refused if the counts differ.
 *
 *   node scripts/read_apac_sources.cjs fetch   <vic|nzls|tw> --cache <dir>
 *   node scripts/read_apac_sources.cjs propose --cache <dir> --out <dir>
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'apac')));
const OUT = path.resolve(val('--out', CACHE));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;
const SUPPORTED = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'))._languages));
const today = () => new Date().toISOString().slice(0, 10);

const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
const flat = (h) => decode(String(h).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      if (r.status === 404) return null;
    } catch (e) { /* retried */ }
    await sleep(2000 * (i + 1));
  }
  throw new Error('failed ' + url);
}
const cacheFile = (...p) => { const f = path.join(CACHE, ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };
async function cached(file, url) {
  const f = cacheFile(file);
  if (fs.existsSync(f)) return zlib.gunzipSync(fs.readFileSync(f)).toString();
  const b = await get(url);
  if (b == null) return null;
  fs.writeFileSync(f, zlib.gzipSync(b));
  await sleep(600);
  return b.toString();
}
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- language names, per source ----------------------------------------------------------------
// null = a real language we do not map (dialect, umbrella name, or not in our set); it still counts
// toward the six-language cap. 'LOCAL' = the country's own language, dropped.
const VIC_LANG = {
  English: 'LOCAL', Afrikaans: 'af', Albanian: 'sq', Shqip: 'sq', Arabic: 'ar', 'Bahasa Indonesia': 'id', Indonesian: 'id',
  Bengali: 'bn', Bulgarian: 'bg', Burmese: 'my', Cambodian: 'km', Khmer: 'km', Cantonese: 'zh', Mandarin: 'zh',
  'Chinese (unspecified)': 'zh', Chinese: 'zh', Croatian: 'hr', Czech: 'cs', Danish: 'da', Dutch: 'nl', Estonian: 'et',
  'Farsi (Persian)': 'fa', Persian: 'fa', 'Filipino - Tagalog': 'tl', 'Filipino-Tagalog': 'tl', Pilipino: 'tl', Tagalog: 'tl', Filipino: 'tl',
  Finnish: 'fi', French: 'fr', Georgian: 'ka', German: 'de', Greek: 'el', Hebrew: 'he', Hindi: 'hi', Hungarian: 'hu',
  Italian: 'it', Japanese: 'ja', Kanada: 'kn', Kannada: 'kn', Kiswahili: 'sw', Swahili: 'sw', Korean: 'ko', Latvian: 'lv',
  Lithuanian: 'lt', 'Malay (Bahasa Malaysia)': 'ms', Malay: 'ms', Malayalam: 'ml', Nepali: 'ne', Norwegian: 'no',
  Polish: 'pl', Portuguese: 'pt', Punjabi: 'pa', Romanian: 'ro', Russian: 'ru', Serbian: 'sr', Sinhalese: 'si',
  Shinhalees: 'si', Sinhala: 'si', Slovak: 'sk', Slovenian: 'sl', Slovene: 'sl', Spanish: 'es', Swedish: 'sv', Tamil: 'ta',
  Telugu: 'te', Thai: 'th', Turkish: 'tr', Ukrainian: 'uk', Urdu: 'ur', Vietnamese: 'vi', Catalan: 'ca', Tajik: 'tg',
};
const NZ_LANG = {
  English: 'LOCAL', 'Māori': 'LOCAL', 'New Zealand Sign Language': 'LOCAL', Afrikaans: 'af', Arabic: 'ar',
  'Bahasa Indonesia': 'id', 'Chinese – Cantonese': 'zh', 'Chinese – Mandarin': 'zh', Yue: 'zh', Dutch: 'nl',
  French: 'fr', German: 'de', Greek: 'el', Hindi: 'hi', Italian: 'it', Japanese: 'ja', Korean: 'ko', Panjabi: 'pa',
  Persian: 'fa', Portuguese: 'pt', Russian: 'ru', Sinhala: 'si', Spanish: 'es', Tagalog: 'tl', Tamil: 'ta', Thai: 'th',
  Ukrainian: 'uk', Urdu: 'ur', Vietnamese: 'vi',
};
const TW_LANG = {
  英語: 'en', 日語: 'ja', 日文: 'ja', 韓語: 'ko', 西班牙語: 'es', 法語: 'fr', 德語: 'de', 越語: 'vi', 越南語: 'vi', 泰語: 'th',
  印尼語: 'id', 菲律賓語: 'tl', 俄語: 'ru', 義大利語: 'it', 葡萄牙語: 'pt', 馬來語: 'ms', 阿拉伯語: 'ar',
  粵語: 'LOCAL', 廣東話: 'LOCAL', 中文: 'LOCAL', 華語: 'LOCAL', 台語: 'LOCAL', 臺語: 'LOCAL', 客語: 'LOCAL',
};
function mapLangs(names, table) {
  const codes = new Set(); const unmapped = []; let counted = 0;
  for (const n of names) {
    const c = table[n];
    if (c === 'LOCAL') continue;
    counted += 1;
    if (c && SUPPORTED.has(c)) codes.add(c); else unmapped.push(n);
  }
  return { codes: [...codes], unmapped, counted };
}

// ---- vic ---------------------------------------------------------------------------------------
const VIC = 'https://lsbc.vic.gov.au/register-of-lawyers';
const vicUrl = (lang, start) => `${VIC}?type=lawyer&language=${encodeURIComponent(lang)}${start > 1 ? '&start_rank=' + start : ''}`;
async function vicLanguages() {
  const found = new Set(); const queue = 'abcdefghijklmnopqrstuvwxyz'.split('');
  while (queue.length) {
    const q = queue.shift();
    const b = await get(`${VIC}/search-language?q=${encodeURIComponent(q)}`);
    const arr = JSON.parse(b.toString());
    arr.forEach((x) => found.add(x.value));
    if (arr.length >= 10) 'abcdefghijklmnopqrstuvwxyz ('.split('').forEach((c) => queue.push(q + c));
    await sleep(250);
  }
  return [...found].sort();
}
function parseVic(html) {
  const out = [];
  const parts = html.split('class="search-content card').slice(1);
  for (const p of parts) {
    const name = flat((p.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '');
    const t = flat(p);
    const type = (t.match(/Type: (.*?)(?: tooltip)? (?:Practising at:|Address:)/) || [])[1] || '';
    const at = (t.match(/Practising at: (.*?) Address:/) || [])[1] || '';
    const addr = (t.match(/Address: (.*?) (?:Areas of practice:|Accredited|Languages:|$)/) || [])[1] || '';
    const areas = (t.match(/Areas of practice: (.*?) Accredited/) || [])[1] || '';
    // Read from the list item itself: the text of the last card on a page runs on into the pager
    // and the footer, and a split mid-tag leaves "<div" behind.
    const langs = flat((p.match(/<strong>Languages:<\/strong>([^<]*)</) || [])[1] || '').split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
    if (name) out.push({ name, type: type.trim(), at: at.trim(), addr: addr.trim(), areas, langs });
  }
  const total = +((flat(html).match(/Showing \d+ - \d+ of (\d+) results/) || [])[1] || 0);
  return { total, rows: out };
}
async function fetchVic() {
  const lf = cacheFile('vic', 'languages.json');
  let langs = fs.existsSync(lf) ? JSON.parse(fs.readFileSync(lf, 'utf8')) : null;
  if (!langs) { langs = await vicLanguages(); fs.writeFileSync(lf, JSON.stringify(langs, null, 1)); }
  // Every lawyer's full list is printed on every row, so only languages we would publish are walked.
  // --shard k/n walks every n-th language, so up to three processes can share the walk (the cache
  // is per page, so shards that meet only skip each other's pages).
  const [sk, sn] = String(val('--shard', '0/1')).split('/').map(Number);
  const walk = langs.filter((l) => VIC_LANG[l] && VIC_LANG[l] !== 'LOCAL' && SUPPORTED.has(VIC_LANG[l]))
    .filter((l, i) => i % sn === sk);
  const unknown = langs.filter((l) => !(l in VIC_LANG));
  console.log(`${langs.length} languages on the register, walking ${walk.length}; not in the table: ${unknown.join(', ')}`);
  // The search does not take every name its own autocomplete offers: "Malay (Bahasa Malaysia)",
  // "Filipino - Tagalog", "Bahasa Indonesia" and "Chinese (unspecified)" return no results page at
  // all, while "Malay" (258), "Filipino" (105) and "Indonesia" (103) work. So a name that finds
  // nothing is retried word by word. The query only decides which lawyers are found; what is
  // published is read from each lawyer's own "Languages:" line, so a broad word cannot add a claim.
  const tf = cacheFile('vic', 'terms.json');
  const terms = fs.existsSync(tf) ? JSON.parse(fs.readFileSync(tf, 'utf8')) : {};
  const walkTerm = async (term) => {
    terms[slug(term)] = term;
    const first = await cached(`vic/pages/${slug(term)}-1.html.gz`, vicUrl(term, 1));
    const { total } = parseVic(first || '');
    for (let s = 11; s <= total; s += 10) await cached(`vic/pages/${slug(term)}-${s}.html.gz`, vicUrl(term, s));
    return total;
  };
  for (const lang of walk) {
    let total = await walkTerm(lang);
    if (!total) {
      for (const w of lang.split(/[^A-Za-z]+/).filter((x) => x.length >= 4 && !/^(unspecified|Bahasa)$/i.test(x))) total += await walkTerm(w);
    }
    console.log(`  ${lang}: ${total}`);
  }
  fs.writeFileSync(tf, JSON.stringify(terms, null, 1));
}
// Greater Melbourne postcodes: the city, the suburbs to the outer ring, and the Mornington Peninsula.
// Geelong, the other Victorian city in the directory, is 3212 (Lara) to 3228 (Torquay). Everything
// else in the state (Ballarat, Bendigo, the country) is left out: those are not our cities.
const MELB = (pc) => (pc >= 3000 && pc <= 3211) || (pc >= 3335 && pc <= 3338) || (pc >= 3427 && pc <= 3429) ||
  (pc >= 3750 && pc <= 3810) || (pc >= 3910 && pc <= 3944) || (pc >= 3975 && pc <= 3978);
const vicCity = (pc) => (MELB(pc) ? 'melbourne' : pc >= 3212 && pc <= 3228 ? 'geelong' : null);
const VIC_NO_CLIENTS = /^(Corporate|Government|Volunteer|No current)/i;

// ---- nzls --------------------------------------------------------------------------------------
const NZ = 'https://www.lawsociety.org.nz/for-the-public/find-a-lawyer/';
const nzUrl = (lang, page) => `${NZ}?Languages=${encodeURIComponent(lang)}${page > 1 ? '&page=' + page : ''}`;
function parseNz(html) {
  const total = +((html.match(/data-total="(\d+)"/) || [])[1] || 0);
  const rows = html.split('class="c-lawyer-list-glh__item"').slice(1).map((p) => ({
    slug: (p.match(/href="\/register\/([^/"]+)\//) || [])[1],
    name: flat((p.match(/class="c-lawyer-list-glh__link"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || ''),
    practice: flat((p.match(/class="c-lawyer-list-glh__practice-name"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || ''),
    location: flat((p.match(/class="c-lawyer-list-glh__location"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || ''),
    website: (p.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*Website/) || [])[1] || '',
  })).filter((r) => r.slug);
  return { total, rows };
}
async function fetchNz() {
  const home = await cached('nzls/find-a-lawyer.html.gz', NZ);
  const langs = [...new Set((home.match(/data-value="([^"]+)"/g) || []).map((s) => decode(s.slice(12, -1))))]
    .filter((v) => /^[A-Z]/.test(v) && !/^(A[CDPR]|BF|C[CLPRS]|D[BV]|E[LM]|F[LMPT]|GD|H[CE]|I[HMNP]|LA|M[DH]|P[ALR]|R[MP]|S[MRU]|T[EMX])$/.test(v) && !/Barrister|Solicitor/.test(v));
  fs.writeFileSync(cacheFile('nzls', 'languages.json'), JSON.stringify(langs, null, 1));
  // Every language is walked, supported or not, because the page never prints a lawyer's list and
  // the six-language cap needs the whole of it.
  for (const lang of langs) {
    const first = await cached(`nzls/pages/${slug(lang)}-1.html.gz`, nzUrl(lang, 1));
    const { total } = parseNz(first || '');
    for (let p = 2; (p - 1) * 10 < total; p++) await cached(`nzls/pages/${slug(lang)}-${p}.html.gz`, nzUrl(lang, p));
    console.log(`  ${lang}: ${total}`);
  }
  for (const s of nzNeedsDetail()) await cached(`nzls/register/${s}.html.gz`, 'https://www.lawsociety.org.nz/register/' + s + '/');
}
function nzNeedsDetail() {
  const d = path.join(CACHE, 'nzls', 'pages');
  const out = new Set();
  for (const f of fs.readdirSync(d)) {
    for (const r of parseNz(zlib.gunzipSync(fs.readFileSync(path.join(d, f))).toString()).rows) if (/Queenstown-Lakes/.test(r.location)) out.add(r.slug);
  }
  return [...out];
}
function nzDetail(s) {
  const f = path.join(CACHE, 'nzls', 'register', s + '.html.gz');
  return fs.existsSync(f) ? flat(zlib.gunzipSync(fs.readFileSync(f)).toString()) : '';
}
// The register prints "Region, District". Auckland is one council, so the whole region is Auckland;
// elsewhere only the district that is the city counts (Lower Hutt is not Wellington).
// Queenstown-Lakes is a district holding two of our cities, Queenstown and Wanaka, so a lawyer there
// is placed by the town in the postal address on the lawyer's own register page, or not at all.
const NZ_DISTRICT = {
  Christchurch: 'christchurch', Dunedin: 'dunedin', Rotorua: 'rotorua', Nelson: 'nelson', Napier: 'napier',
  'New Plymouth': 'newplymouth', Whangarei: 'whangarei', Wellington: 'wellington',
};
function nzCity(loc, detailText) {
  const [region, district] = loc.split(/\s*,\s*/);
  if (region === 'Auckland') return 'auckland';
  if (district === 'Queenstown-Lakes') {
    const t = detailText || '';
    return /\bWanaka\b/i.test(t) ? 'wanaka' : /\bQueenstown\b(?!-Lakes)/i.test(t) ? 'queenstown' : null;
  }
  return NZ_DISTRICT[district] || null;
}

// ---- tw ----------------------------------------------------------------------------------------
const TW_PAGE = 'https://goldcard.nat.gov.tw/en/service-providers/';
const TW_RE = 'https://goldcard.nat.gov.tw/cms-uploads/list-of-real-estate-agents-with-foreign-language-service.pdf';
const TW_HOSP = 'https://goldcard.nat.gov.tw/cms-uploads/bilingual-friendly-hospital-list.pdf';
async function fetchTw() {
  await cached('tw/service-providers.html.gz', TW_PAGE);
  for (const [f, u] of [['tw/real-estate.pdf', TW_RE], ['tw/hospitals.pdf', TW_HOSP]]) {
    const out = cacheFile(f);
    if (!fs.existsSync(out)) { fs.writeFileSync(out, await get(u)); await sleep(600); }
  }
  console.log('tw: cached the page and both PDFs');
}
function pdfText(file, mode) {
  const out = file + '.' + mode + '.txt';
  execFileSync('pdftotext', ['-' + mode, '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  return fs.readFileSync(out, 'utf8');
}
// Counties are not cities: 花蓮縣 and 臺東縣 hold far more than Hualien and Taitung, so only the special
// municipalities that are our cities are read. New Taipei (新北市) is not Taipei.
const TW_CITY = { 臺北市: 'taipei', 台北市: 'taipei', 高雄市: 'kaohsiung', 臺南市: 'tainan', 台南市: 'tainan', 臺中市: 'taichung', 台中市: 'taichung' };
const TW_BIZ = /租賃住宅包租業|租賃住宅代管業|不動產租賃業|不動產仲介經紀業|不動產經紀業|不動產買賣業/g;
const TW_LANG_RE = new RegExp(Object.keys(TW_LANG).sort((a, b) => b.length - a.length).join('|'), 'g');
// The real-estate list is an Excel sheet printed to PDF, and -raw reads it cell by cell in row
// order: number and county, the Chinese name (sometimes wrapped), an English name, the business
// types, the website or 無, the address in Chinese then English, phone, email or 無, languages.
// A short row can arrive on one line ("33 臺北市 仲量聯行股份有限公司 不動產仲介經紀業 無"). Language
// names wrap mid-word ("英語、日" / "語"), so they are matched on the record with line breaks removed.
function parseTwRealEstate(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\f/g, '').trim()).filter(Boolean)
    .filter((l) => !/^第\s*\d+\s*頁$/.test(l) && !/^(序|號|電話|營業處所聯絡|具外語服務之租賃住宅業者清單)$/.test(l) && !/^縣市別 所屬公司/.test(l) && !/^電子郵件 服務語言$/.test(l));
  const recs = [];
  for (const l of lines) {
    const m = l.match(/^(\d{1,3}) (\S{2}[市縣])(?: (.*))?$/);
    if (m && (!recs.length || +m[1] === recs[recs.length - 1].no + 1)) recs.push({ no: +m[1], county: m[2], lines: m[3] ? [m[3]] : [] });
    else if (recs.length) recs[recs.length - 1].lines.push(l);
  }
  return recs.map((r) => {
    const all = r.lines.join('\n');
    const bizAt = all.search(TW_BIZ);
    const head = bizAt >= 0 ? all.slice(0, bizAt) : '';
    const headLines = head.split('\n').map((s) => s.trim()).filter(Boolean);
    const nameZh = headLines.filter((s) => /[一-鿿]/.test(s)).join('');
    const nameEn = headLines.filter((s) => !/[一-鿿]/.test(s)).join(' ').replace(/\s+/g, ' ').trim();
    const afterBiz = bizAt >= 0 ? all.slice(bizAt).replace(TW_BIZ, ' ') : all;
    const addrAt = afterBiz.search(/[一-鿿]{2}[市縣]/);
    const web = (addrAt >= 0 ? afterBiz.slice(0, addrAt) : '').replace(/\s+/g, ' ').replace(/無/g, '').trim().replace(/ /g, '');
    const flatRec = all.replace(/\n/g, '');
    const tail = flatRec.slice(Math.max(flatRec.lastIndexOf('@'), flatRec.lastIndexOf('無'), 0));
    const langs = (tail.match(TW_LANG_RE) || []);
    const district = (all.replace(/\n/g, ' ').match(/([A-Z][a-z']+(?:-[a-z]+)?)\s+(?:Dist\.|District|Dist)/) || [])[1] || '';
    return { no: r.no, county: r.county, nameZh, nameEn, web, district, langs, raw: all };
  });
}
// The hospital list's -raw text gives the Chinese and English names in pairs but puts the numbers
// and counties elsewhere; -table gives one line per row with number, county, level and website. The
// two are zipped by order, and the count must match or nothing is read.
function parseTwHospitals(tableText, rawText) {
  const date = (tableText.match(/製表日期：(\d{4}\/\d{1,2}\/\d{1,2})/) || [])[1] || '';
  const rows = tableText.split('\n').map((l) => l.match(/^(\d{1,3})\s+(\S{2}[市縣])\s+(醫學中心|區域醫院|地區醫院)\s+.*?(https?:\/\/\S+)?\s*$/)).filter(Boolean);
  const raw = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pairs = [];
  for (let i = 0; i < raw.length - 1; i++) {
    if (/[一-鿿]/.test(raw[i]) && /(院|處|中心)(\([^)]*\))?$/.test(raw[i]) && /^[A-Za-z]/.test(raw[i + 1])) { pairs.push([raw[i], raw[i + 1]]); i += 1; }
  }
  if (pairs.length !== rows.length) throw new Error(`hospital list: ${rows.length} rows but ${pairs.length} name pairs`);
  const LEVEL = { 醫學中心: 'Medical centre', 區域醫院: 'Regional hospital', 地區醫院: 'District hospital' };
  return rows.map((m, i) => ({ no: +m[1], county: m[2], level: LEVEL[m[3]], web: m[4] || '', nameZh: pairs[i][0], nameEn: pairs[i][1], date }));
}
// The list's own spelling mistakes, corrected because a searcher types the hospital's real name;
// nothing else in a name is changed.
const TYPO = [[/\bGenreal\b/g, 'General'], [/\bHosptial\b/g, 'Hospital'], [/\bmemorial hospital\b/g, 'Memorial Hospital']];
const fixName = (s) => TYPO.reduce((a, [r, w]) => a.replace(r, w), s);

// ---- propose -----------------------------------------------------------------------------------
function readPages(dir) {
  const d = path.join(CACHE, dir, 'pages');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).map((f) => ({ f, html: zlib.gunzipSync(fs.readFileSync(path.join(d, f))).toString(), mtime: fs.statSync(path.join(d, f)).mtime }));
}
function propose() {
  fs.mkdirSync(OUT, { recursive: true });
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8')).providers;
  const key = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9぀-鿿]+/g, '');
  const known = new Set(db.map((p) => p.city + '|' + key(p.name)));
  // The site's full city table (1,000 cities); data/city_list.json holds only 410 of them.
  const { CITY } = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
  const all = []; const refused = [];

  // vic
  {
    const vicLangs = JSON.parse(fs.readFileSync(path.join(CACHE, 'vic', 'languages.json'), 'utf8'));
    const vtf = path.join(CACHE, 'vic', 'terms.json');
    const vicTerms = fs.existsSync(vtf) ? JSON.parse(fs.readFileSync(vtf, 'utf8')) : {};
    const byKey = new Map();
    for (const { f, html, mtime } of readPages('vic')) {
      const [, lslug, start] = f.match(/^(.*)-(\d+)\.html\.gz$/);
      const lang = vicTerms[lslug] || vicLangs.find((l) => slug(l) === lslug);
      for (const r of parseVic(html).rows) {
        const k = r.name + '|' + r.at + '|' + r.addr;
        if (!byKey.has(k)) byKey.set(k, { ...r, sourceUrl: vicUrl(lang, +start), checked: mtime.toISOString().slice(0, 10) });
      }
    }
    const rows = [];
    for (const r of byKey.values()) {
      const pc = +((r.addr.match(/(\d{4})\s*$/) || [])[1] || 0);
      const suburb = (r.addr.match(/^(.*?)\s+VIC\s+\d{4}$/) || [])[1] || '';
      const { codes, unmapped, counted } = mapLangs(r.langs, VIC_LANG);
      const city = vicCity(pc);
      const why = !city ? 'outside Melbourne and Geelong' : VIC_NO_CLIENTS.test(r.type) ? 'no private clients: ' + r.type
        : counted > MAX_LANGS ? counted + ' languages' : !codes.length ? 'no mappable language' : null;
      if (why) { refused.push({ source: 'vic', name: r.name, why, langs: r.langs.join(', ') }); continue; }
      const titleCase = (s) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
      rows.push({
        city, name: r.name, category: 'legal', languages: codes, sourceUrl: r.sourceUrl, evidence: 'official',
        checked: r.checked, area: [r.at && r.at !== r.name ? r.at : '', titleCase(suburb)].filter(Boolean).join(', '),
        quote: 'Languages: ' + r.langs.join(', '), lawyerType: r.type, practiceAreas: r.areas,
        ...(unmapped.length ? { unmapped } : {}), ...(known.has(city + '|' + key(r.name)) ? { alreadyListed: true } : {}),
      });
    }
    all.push({
      key: 'vic',
      source: {
        publisher: 'Victorian Legal Services Board + Commissioner', url: VIC,
        licenceOrTermsQuote: 'You may download, print and otherwise reproduce information on the website subject to the condition that you include the copyright notice © Victorian Legal Services Board and Commissioner. (https://lsbc.vic.gov.au/terms-use)',
        pageNote: 'Some of these lawyers are on the Register of Lawyers kept by the Victorian Legal Services Board + Commissioner, the state regulator, which prints the languages each lawyer gave it. © Victorian Legal Services Board and Commissioner.',
      },
      rows,
    });
  }

  // nzls
  {
    const langsFile = path.join(CACHE, 'nzls', 'languages.json');
    const nzLangs = fs.existsSync(langsFile) ? JSON.parse(fs.readFileSync(langsFile, 'utf8')) : [];
    const people = new Map();
    for (const { f, html, mtime } of readPages('nzls')) {
      const [, lslug] = f.match(/^(.*)-(\d+)\.html\.gz$/);
      const lang = nzLangs.find((l) => slug(l) === lslug);
      for (const r of parseNz(html).rows) {
        const p = people.get(r.slug) || { ...r, langs: new Set(), checked: mtime.toISOString().slice(0, 10) };
        p.langs.add(lang);
        people.set(r.slug, p);
      }
    }
    const rows = [];
    for (const p of people.values()) {
      const city = nzCity(p.location, /Queenstown-Lakes/.test(p.location) ? nzDetail(p.slug) : '');
      const langs = [...p.langs];
      const { codes, unmapped, counted } = mapLangs(langs, NZ_LANG);
      const why = !city ? 'outside our NZ cities: ' + p.location : counted > MAX_LANGS ? counted + ' languages' : !codes.length ? 'no mappable language' : null;
      if (why) { refused.push({ source: 'nzls', name: p.name, why, langs: langs.join(', ') }); continue; }
      // The filtered search is the evidence, one per language; the first mapped one is cited.
      const citeLang = langs.find((l) => NZ_LANG[l] && NZ_LANG[l] !== 'LOCAL');
      rows.push({
        city, name: p.name, category: 'legal', languages: codes, ...(p.website ? { url: p.website } : {}),
        registerUrl: 'https://www.lawsociety.org.nz/register/' + p.slug + '/',
        sourceUrl: nzUrl(citeLang, 1), evidence: 'official', checked: p.checked,
        area: [p.practice, (p.location.split(/\s*,\s*/)[1] || '')].filter(Boolean).join(', '),
        quote: 'Returned by the register\'s "Speaks" filter for: ' + langs.join(', '),
        ...(unmapped.length ? { unmapped } : {}),
        ...(known.has(city + '|' + key(p.name)) ? { alreadyListed: true } : {}),
      });
    }
    all.push({
      key: 'nzls',
      source: {
        publisher: 'New Zealand Law Society', url: NZ,
        licenceOrTermsQuote: 'Website terms are a disclaimer only ("The information available here is intended to provide general information to the public"); no reuse or extraction clause. The Information Handling Policy (May 2026) says the Society collects "Information to enable a member of the public to contact a suitable lawyer to carry out legal work, including a lawyer\'s practice areas and languages spoken."',
        pageNote: 'Some of these lawyers are on the New Zealand Law Society\'s register, whose Find a lawyer search lists the languages each lawyer told the Society they speak.',
      },
      rows,
    });
  }

  // tw
  const twChecked = fs.existsSync(path.join(CACHE, 'tw', 'real-estate.pdf')) ? fs.statSync(path.join(CACHE, 'tw', 'real-estate.pdf')).mtime.toISOString().slice(0, 10) : today();
  const twTerms = 'Open Government Declaration (https://goldcard.nat.gov.tw/en/legal/open-government-declaration/): "all of Taiwan Employment Gold Card Office\'s publicly posted information and materials that are protected under copyright provisions may be reauthorized for public use without cost in a non-exclusive manner. The users are not limited to time and by region to reproduce, adapt, edit, publicly transmit or utilize with other methods, and as well as to develop various products or services ... However, when using it, the user should state the source."';
  if (fs.existsSync(path.join(CACHE, 'tw', 'real-estate.pdf'))) {
    const rows = [];
    for (const r of parseTwRealEstate(pdfText(path.join(CACHE, 'tw', 'real-estate.pdf'), 'raw'))) {
      const city = TW_CITY[r.county];
      const { codes, unmapped, counted } = mapLangs(r.langs, TW_LANG);
      const why = !city ? 'outside our Taiwanese cities: ' + r.county : counted > MAX_LANGS ? counted + ' languages' : !codes.length ? 'no mappable language' : null;
      if (why) { refused.push({ source: 'tw-re', name: r.nameZh || r.nameEn, why, langs: r.langs.join(' ') }); continue; }
      // The agency's own English name where it gave one; the list gives many only in Chinese.
      const name = r.nameEn && /[A-Za-z]{3}/.test(r.nameEn) ? r.nameEn.replace(/^\((.*)\)$/, '$1') : r.nameZh;
      rows.push({
        city, name, nameZh: r.nameZh, category: 'realestate', languages: codes,
        ...(/^(https?:\/\/)?[\w-]+\.[\w.-]+/.test(r.web) ? { url: /^https?:/.test(r.web) ? r.web : 'http://' + r.web } : {}),
        sourceUrl: TW_RE, evidence: 'official', checked: twChecked,
        area: r.district ? r.district + ' District' : undefined, quote: '服務語言: ' + r.langs.join('、'),
        ...(unmapped.length ? { unmapped } : {}),
        ...(known.has(city + '|' + key(name)) || known.has(city + '|' + key(r.nameZh)) ? { alreadyListed: true } : {}),
      });
    }
    // One company can be listed twice, once as a rental manager and once as a broker (駐易國際 is rows
    // 3 and 42). One business, one row: the second entry's languages join the first.
    for (let i = rows.length - 1; i > 0; i--) {
      const j = rows.findIndex((x, k) => k < i && x.city === rows[i].city && key(x.nameZh) === key(rows[i].nameZh));
      if (j < 0) continue;
      rows[j].languages = [...new Set([...rows[j].languages, ...rows[i].languages])];
      rows[j].url = rows[j].url || rows[i].url;
      rows.splice(i, 1);
    }
    all.push({
      key: 'tw-re',
      source: {
        publisher: 'Taiwan Employment Gold Card Office, National Development Council', url: TW_RE, licenceOrTermsQuote: twTerms,
        pageNote: 'Some of these agencies are on a list of rental and estate agents whose staff serve customers in a foreign language, provided by the government department responsible for Taiwan\'s rental market and published by the National Development Council\'s Gold Card Office.',
      },
      rows,
    });
  }
  if (fs.existsSync(path.join(CACHE, 'tw', 'hospitals.pdf'))) {
    const rows = [];
    const hf = path.join(CACHE, 'tw', 'hospitals.pdf');
    for (const r of parseTwHospitals(pdfText(hf, 'table'), pdfText(hf, 'raw'))) {
      const city = TW_CITY[r.county];
      if (!city) { refused.push({ source: 'tw-hosp', name: r.nameEn || r.nameZh, why: 'outside our Taiwanese cities: ' + r.county }); continue; }
      const name = fixName(r.nameEn || r.nameZh);
      rows.push({
        city, name, nameZh: r.nameZh, category: 'doctor', languages: ['en'], url: r.web || undefined,
        sourceUrl: TW_HOSP, evidence: 'official', checked: twChecked, area: r.level || undefined,
        quote: '雙語醫院友善名單 (Bilingual friendly hospital list), 製表日期 ' + r.date,
        ...(known.has(city + '|' + key(name)) ? { alreadyListed: true } : {}),
      });
    }
    all.push({
      key: 'tw-hosp',
      source: {
        publisher: 'Ministry of Health and Welfare, via the Taiwan Employment Gold Card Office', url: TW_HOSP, licenceOrTermsQuote: twTerms,
        pageNote: 'Some of these hospitals are on Taiwan\'s Bilingual Friendly Hospital List, which the Gold Card Office publishes from the Ministry of Health and Welfare: hospitals whose services are set up for patients in English as well as Chinese.',
      },
      rows,
    });
  }

  for (const s of all) for (const r of s.rows) if (!CITY[r.city]) throw new Error('not a city of ours: ' + r.city);
  for (const s of all) fs.writeFileSync(path.join(OUT, `proposals-${s.key}.json`), JSON.stringify({ source: s.source, rows: s.rows }, null, 1));
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify(all.map((s) => ({ source: s.source, rows: s.rows })), null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify(refused, null, 1));
  for (const s of all) {
    const by = {}; const lang = {};
    s.rows.forEach((r) => { by[r.city] = (by[r.city] || 0) + 1; r.languages.forEach((l) => { lang[l] = (lang[l] || 0) + 1; }); });
    console.log(s.key, s.rows.length, 'rows', JSON.stringify(by), JSON.stringify(lang), 'already listed:', s.rows.filter((r) => r.alreadyListed).length);
  }
  const why = {}; refused.forEach((r) => { const k = r.source + ' ' + r.why.replace(/:.*/, ''); why[k] = (why[k] || 0) + 1; });
  console.log('refused', why);
}

(async () => {
  if (cmd === 'fetch') {
    const which = argv[1];
    if (which === 'vic') await fetchVic();
    else if (which === 'nzls') await fetchNz();
    else if (which === 'tw') await fetchTw();
    else throw new Error('fetch vic|nzls|tw');
  } else if (cmd === 'propose') propose();
  else console.log('usage: fetch <vic|nzls|tw> --cache <dir> | propose --cache <dir> --out <dir>');
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Reads official lists of international and foreign-language schools that STATE the language a
 * school teaches in, and proposes them for the new "school" category.
 *
 * WHAT A SCHOOL ROW CLAIMS
 *
 * For a school, the languages are its language(s) of instruction, as written by an official list.
 * A curriculum is not a language: "IB", "British curriculum" or "American" never becomes English
 * here unless the list itself says so in a language field. The local language of the city's country
 * is never published (M.LOCAL in lib/service_data.cjs), so an English/Korean school in Seoul gives
 * en, and a German/Spanish Europa-Schule in Berlin gives es.
 *
 * THE SOURCES, AND WHY EACH ONE IS ALLOWED
 *
 *   korea     외국교육기관 및 외국인학교 종합안내 (www.isi.go.kr), run by the National Research
 *             Foundation of Korea for the Ministry of Education. Its English school lists have a
 *             column "Language for class" per school. The same system is published as open data
 *             on data.go.kr (dataset 15085254) with "이용허락범위 제한 없음" (no restriction on use).
 *             Three lists: foreign schools (ST, 4 pages), foreign educational institutions (ST02)
 *             and the Jeju international schools (ST05). Homepages come from the site's own
 *             "Homepages of each school" tables.
 *   hongkong  Primary School Profiles 2025 by the Committee on Home-School Co-operation, published
 *             on DATA.GOV.HK, whose terms allow reproduction "for both commercial and
 *             non-commercial purposes" with attribution. Its field medium_of_instruction is a
 *             school-wide statement. Only "English" alone is proposed; the mixed values
 *             ("Chinese & English", "Chinese(incl.: Putonghua) and English") describe ordinary local
 *             schools with some subjects in English and go to the held file.
 *   berlin    Staatliche Europa-Schule Berlin, the Senate's table of sites by language combination
 *             (a Datawrapper table embedded on berlin.de). Every SESB class is taught in German and
 *             the partner language by native-speaker teachers ("zwei gleichberechtigte
 *             Unterrichtssprachen"), so the partner language is the claim. The Impressum protects the
 *             collection and allows use "im Rahmen der gesetzlichen Bestimmungen"; it has no clause
 *             against extraction or reuse. Precedent: registers-health.md treated the same wording
 *             (Aerztekammer Steiermark) as USE with credit.
 *   france    Sections internationales, data.education.gouv.fr dataset fr-en-sections-internationales
 *             (Licence Ouverte v2.0), the annex of the ministerial arrêté listing every section. The
 *             dataset defines its field "section" as "Détail de la section internationale : langue,
 *             région": BRITANNIQUE, AMÉRICAINE and AUSTRALIENNE are the English section in three
 *             national variants, BRÉSILIENNE the Portuguese one. That field definition is the language
 *             statement; without it the nationality words would not be read as languages. Schools
 *             abroad (French lycées) go to the held file: the list states only their section
 *             language, not French, so a row would bill a French school as an English one.
 *   andalucia HELD, not proposed. Junta de Andalucía, "Centros educativos bilingües en Andalucía"
 *             (CC BY 4.0), per stage: BIL ING, BIL FRA, BIL ALE, PLURIL ING/FRA ... These are ordinary
 *             Spanish public and concertado schools running a bilingual programme; they would make
 *             "English-speaking schools in Seville" a list of 120 local schools. Written to the held
 *             file for the owner to decide.
 *
 * TRAPS HIT
 *
 *   - isi.go.kr's English list pages are POST forms, but GET with pageIndex=N returns the same page.
 *     The ST list has 4 pages; page 1 alone looks complete (10 rows, no error).
 *   - The ISI list writes "Franch" for French. Mongolian (International Mongolian School) is not a
 *     language this directory has; that school keeps nothing and is refused.
 *   - The ISI region is a province, not a city. Only the metropolitan cities that ARE our cities are
 *     placed (Seoul, Busan, Daegu, Gwangju, Daejeon) plus Jeju province, whose four international
 *     schools are in Seogwipo; the row carries the province as its area. Incheon, Gyeonggi, Ulsan,
 *     Gangwon and Gyeongnam schools have no city here and are refused.
 *   - The French dataset repeats a school once per section and level: rows are merged by UAI.
 *   - The Andalusian CSV has semicolons inside quoted addresses; a naive split shifts the columns so
 *     that coordinates land in the programme fields. A real CSV parser is used.
 *   - The CHSC English CSV already contains U+FFFD in a few names (Camões); the name is kept as the
 *     source writes it and the row is flagged.
 *   - The EDB "International Schools in Hong Kong" site (internationalschools.edb.gov.hk) has the best
 *     field of all (primary_medium_instruction for 106 campuses) but its notice says "any
 *     reproduction ... of such copyright works to the public is strictly prohibited". Not read.
 *
 * Usage:
 *   node scripts/read_school_lists.cjs fetch   --cache <dir>     downloads every list once
 *   node scripts/read_school_lists.cjs propose --cache <dir> --out <dir>
 *     writes <out>/proposals.json (an array of {source, rows}), <out>/proposals-held.json and
 *     <out>/refused.json. Nothing under data/ is touched.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'schools')));
const OUT = path.resolve(val('--out', CACHE));
const CHECKED = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;

const ISI = 'https://www.isi.go.kr';
const ISI_LISTS = [
  ['ST', 1], ['ST', 2], ['ST', 3], ['ST', 4], ['ST02', 1], ['ST05', 1],
];
const ISI_HOMEPAGES = ['sc_Data_k_03_03', 'sc_Data_k_03_05', 'sc_Data_k_03_06'];
const isiListUrl = (t, p) => `${ISI}/schoolInfo/getListSchInfoVO.do?schoolType=${t}&pageIndex=${p}`;
const CHSC_PSP = 'https://www.chsc.hk/datagovhk/psp_2025_en.csv';
const CHSC_PAGE = 'https://data.gov.hk/en-data/dataset/chsc-chsc-primary-school-profiles';
const SESB_PAGE = 'https://www.berlin.de/sen/bildung/schule/besondere-schulangebote/staatliche-europaschule/';
const FR_DATA = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-sections-internationales/exports/json';
const FR_PAGE = 'https://data.education.gouv.fr/explore/dataset/fr-en-sections-internationales/';
const AND_CSV = 'https://www.juntadeandalucia.es/datosabiertos/portal/dataset/69772a4c-29fa-41d4-9ac9-07c1bed1c524/resource/d80a2cf3-09f1-4e32-9c31-7ed73dc304ce/download/da_centros_bilingues.csv';
const AND_PAGE = 'https://www.juntadeandalucia.es/datosabiertos/portal/dataset/centros-educativos-bilingues-en-andalucia';

async function get(url) {
  for (let a = 0; a < 3; a += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 200) return Buffer.from(await r.arrayBuffer());
      console.log(`  ${r.status} ${url}`);
    } catch (e) { console.log(`  ${e.message} ${url}`); }
    await sleep(3000 * (a + 1));
  }
  return null;
}
const cacheFile = (name) => path.join(CACHE, name);
async function save(name, url) {
  if (fs.existsSync(cacheFile(name))) return true;
  const b = await get(url);
  if (!b) { console.log(`FAILED ${name}`); return false; }
  fs.writeFileSync(cacheFile(name), b);
  console.log(`saved ${name} (${b.length} bytes)`);
  await sleep(800);
  return true;
}

async function fetchAll() {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const [t, p] of ISI_LISTS) await save(`isi_${t}_${p}.html`, isiListUrl(t, p));
  for (const h of ISI_HOMEPAGES) await save(`isi_home_${h}.html`, `${ISI}/isi/en/isitBbs/${h}.do`);
  await save('chsc_psp_2025_en.csv', CHSC_PSP);
  await save('sesb_page.html', SESB_PAGE);
  // The table is a Datawrapper chart; its id and version are read off the page, so a new version of
  // the chart is picked up rather than a stale one.
  const page = fs.readFileSync(cacheFile('sesb_page.html'), 'utf8');
  const m = page.match(/title="Tabellarische[^"]*"[^>]*src="https:\/\/datawrapper\.dwcdn\.net\/(\w+)\/(\d+)\/"/);
  if (m) await save('sesb_table.csv', `https://datawrapper.dwcdn.net/${m[1]}/${m[2]}/dataset.csv`);
  else console.log('SESB: table iframe not found on the page');
  await save('fr_sections.json', FR_DATA);
  await save('andalucia_2024_25.csv', AND_CSV);
}

// ---- helpers ----------------------------------------------------------------
const decode = (s) => String(s || '').replace(/&#(\d+);/g, (x, n) => String.fromCharCode(Number(n)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (h) => decode(String(h).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();
function csvParse(str, sep) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < str.length; i += 1) {
    const c = str[i];
    if (q) {
      if (c === '"' && str[i + 1] === '"') { f += '"'; i += 1; } else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(f); f = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && str[i + 1] === '\n') i += 1;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift().map((h) => h.replace(/^﻿/, '').trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const km = (a, b, c, d) => {
  const R = 6371; const r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const CITIES = Object.values(M.CITY);
// A town is placed in one of our cities when its name is the city's name, or when the school is
// within 15 km of that city's centre in the same country. The country check stops Annemasse from
// becoming Geneva and Kehl from becoming Strasbourg.
function place(town, lat, lng, country) {
  const f = fold(town);
  const byName = CITIES.filter((c) => fold(c.name) === f && (!country || c.country === country));
  if (byName.length === 1) return { city: byName[0].id, how: 'name' };
  if (lat == null || lng == null || !country) return null;
  let best = null;
  for (const c of CITIES) {
    if (c.country !== country) continue;
    const d = km(lat, lng, c.lat, c.lng);
    if (d <= 15 && (!best || d < best.d)) best = { city: c.id, d };
  }
  return best ? { city: best.city, how: `${best.d.toFixed(1)} km` } : null;
}
// Drop the local language; refuse more than six; refuse languages the directory has not got.
function finish(city, codes) {
  const local = M.LOCAL[M.CITY[city].country];
  const langs = [...new Set(codes)].filter((l) => l !== local);
  const unknown = langs.filter((l) => !M.LANGS[l]);
  return { langs: langs.filter((l) => M.LANGS[l]), unknown, local };
}

// ---- korea ------------------------------------------------------------------
const KR_LANG = { english: 'en', german: 'de', franch: 'fr', french: 'fr', chinese: 'zh', japanese: 'ja',
  korean: 'ko', spanish: 'es', mongolian: 'mn' };
const KR_REGION = {
  'Seoul Special Metropolitan City': 'seoul', 'Busan Metropolitan City': 'busan',
  'Daegu Metropolitan City': 'daegu', 'Jeonnam-Gwangju Special Metropolitan City': 'gwangju',
  'Daejeon Metropolitan City': 'daejeon', 'Jeju Special Self-Governing Province': 'jeju',
};
function korea(out, refused) {
  const home = {};
  for (const h of ISI_HOMEPAGES) {
    const f = cacheFile(`isi_home_${h}.html`);
    if (!fs.existsSync(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/<th scope="row">([^<]+)<\/th>\s*<td><a[^>]*href="([^"]+)"/g)) home[fold(m[1])] = m[2].trim();
  }
  // The homepage tables name some schools differently from the lists ("Gwangju Foreign school" for
  // Gwangju International School). Matched only on an exact folded name or when one name contains
  // the other; otherwise the row goes without a url rather than with a guessed one.
  // Where the site's own homepage table uses a short or older name for a school in its own list,
  // written out by hand (checked against the homepage domain each one points to).
  const ALIAS = {
    'international school of busan': 'busan international foreign school', // bifskorea.org
    'gwangju international school': 'gwangju foreign school', // gwangjuinternationalschool.org
    'branksome hall asia': 'bha', // branksome.asia
    'korea international school jeju': 'kis jeju', // kis.ac
    'north london collegiate school jeju': 'nlcs jeju', // nlcsjeju.co.kr
    'st johnsbury academy jeju': 'sja jeju', // sjajeju.kr
  };
  const urlOf = (name) => {
    let f = fold(name);
    if (ALIAS[f]) f = ALIAS[f];
    if (home[f]) return home[f];
    const hits = Object.keys(home).filter((k) => k.length > 8 && (k.includes(f) || f.includes(k)));
    return hits.length === 1 ? home[hits[0]] : undefined;
  };
  for (const [t, p] of ISI_LISTS) {
    const f = cacheFile(`isi_${t}_${p}.html`);
    if (!fs.existsSync(f)) { refused.push({ source: 'korea', why: `missing page ${t} ${p}` }); continue; }
    const s = fs.readFileSync(f, 'utf8');
    for (const tr of s.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]));
      if (tds.length < 4) continue;
      const [, name, region, language] = tds;
      const city = KR_REGION[region];
      if (!city) { refused.push({ source: 'korea', name, why: `region not one of our cities: ${region}` }); continue; }
      const codes = language.split(',').map((x) => KR_LANG[x.trim().toLowerCase()] || `?${x.trim()}`);
      const { langs, unknown } = finish(city, codes);
      if (!langs.length) { refused.push({ source: 'korea', name, city, why: `no publishable language (${language})` }); continue; }
      if (langs.length > MAX_LANGS) { refused.push({ source: 'korea', name, why: 'more than six languages' }); continue; }
      out.push({ city, name, category: 'school', languages: langs, url: urlOf(name),
        sourceUrl: isiListUrl(t, p), evidence: 'official', checked: CHECKED,
        area: city === 'jeju' ? 'Jeju Special Self-Governing Province' : undefined,
        quote: `Language for class: ${language}`, ...(unknown.length ? { note: `not published: ${unknown.join(', ')}` } : {}) });
    }
  }
}

// ---- hong kong --------------------------------------------------------------
function hongkong(out, held, refused) {
  const f = cacheFile('chsc_psp_2025_en.csv');
  if (!fs.existsSync(f)) return;
  const rows = csvParse(fs.readFileSync(f, 'utf8'), ',');
  const seen = new Set();
  for (const r of rows) {
    const moi = (r.medium_of_instruction || '').trim();
    if (!/english/i.test(moi) || seen.has(r.school_name)) continue;
    seen.add(r.school_name);
    const row = { city: 'hongkong', name: r.school_name, category: 'school', languages: ['en'],
      url: /^https?:/.test(r.school_website || '') ? r.school_website.trim() : undefined,
      sourceUrl: CHSC_PSP, evidence: 'official', checked: CHECKED, area: r.district,
      quote: `Medium of instruction: ${moi}`, ...(r.school_name.includes('�') ? { flag: 'U+FFFD in source name' } : {}) };
    if (moi === 'English') out.push(row);
    else held.push({ ...row, heldWhy: 'local school teaching partly in English; mixed medium of instruction' });
  }
  refused.push({ source: 'hongkong', why: `${rows.length - seen.size} primary schools teach in Chinese only (local language)` });
}

// ---- berlin -----------------------------------------------------------------
const DE_LANG = { Englisch: 'en', 'Französisch': 'fr', Griechisch: 'el', Italienisch: 'it', Polnisch: 'pl',
  Portugiesisch: 'pt', Russisch: 'ru', Spanisch: 'es', 'Türkisch': 'tr' };
function berlin(out, refused) {
  const f = cacheFile('sesb_table.csv');
  if (!fs.existsSync(f)) return;
  for (const r of csvParse(fs.readFileSync(f, 'utf8'), ',')) {
    const combo = (r.Sprachkombinationen || '').trim();
    const partner = combo.replace(/^Deutsch-/, '').trim();
    const code = DE_LANG[partner];
    if (!code) { refused.push({ source: 'berlin', why: `unknown combination ${combo}` }); continue; }
    for (const line of (r.Schulen || '').split('\n')) {
      const type = (line.match(/\*\*([^*]+)\*\*/) || [])[1];
      for (const a of line.matchAll(/<a\s+href="([^"]+)"\s*>([^<]+)<\/a>/g)) {
        out.push({ city: 'berlin', name: a[2].trim(), category: 'school', languages: [code],
          url: a[1].replace(/\/\/+$/, '/').replace(/([^:])\/\//g, '$1/'), sourceUrl: SESB_PAGE,
          evidence: 'official', checked: CHECKED, area: type ? type.trim() : undefined,
          quote: `Staatliche Europa-Schule Berlin, Sprachkombination ${combo}` });
      }
    }
  }
}

// ---- france -----------------------------------------------------------------
// The section value is "langue, région" per the dataset's own field definition.
const FR_SECTION = { ARABE: 'ar', CHINOISE: 'zh', ESPAGNOLE: 'es', ITALIENNE: 'it', ALLEMANDE: 'de',
  'AMÉRICAINE': 'en', BRITANNIQUE: 'en', AUSTRALIENNE: 'en', PORTUGAISE: 'pt', 'BRÉSILIENNE': 'pt',
  'NÉERLANDAISE': 'nl', RUSSE: 'ru', DANOISE: 'da', 'NORVÉGIENNE': 'no', 'SUÉDOISE': 'sv',
  JAPONAISE: 'ja', POLONAISE: 'pl', 'CORÉENNE': 'ko' };
// Académie (or, abroad, country) in the dataset -> the country name our cities use. Metropolitan
// académies are France; overseas ones are their own countries here.
const FR_OVERSEAS = { GUADELOUPE: 'Guadeloupe', GUYANE: 'French Guiana', 'LA RÉUNION': 'Reunion',
  MAYOTTE: 'Mayotte', MARTINIQUE: 'Martinique', 'NOUVELLE-CALEDONIE': 'New Caledonia',
  'POLYNESIE FRANÇAISE': 'French Polynesia', 'WALLIS-ET-FUTUNA': null };
const FR_METRO = new Set(['AIX-MARSEILLE', 'AMIENS', 'BESANÇON', 'BORDEAUX', 'CLERMONT-FERRAND', 'CRÉTEIL',
  'CRETEIL', 'DIJON', 'GRENOBLE', 'LILLE', 'LIMOGES', 'LYON', 'MONTPELLIER', 'NANCY-METZ', 'NANTES', 'NICE',
  'NORMANDIE', 'ORLÉANS-TOURS', 'ORLEANS-TOURS', 'PARIS', 'POITIERS', 'REIMS', 'RENNES', 'STRASBOURG',
  'TOULOUSE', 'VERSAILLES', 'CORSE']);
const FR_ABROAD = { 'AFRIQUE DU SUD': 'South Africa', 'ALGÉRIE': 'Algeria', ALLEMAGNE: 'Germany',
  AUSTRALIE: 'Australia', AUTRICHE: 'Austria', BANGLADESH: 'Bangladesh', BELGIQUE: 'Belgium', 'BRÉSIL': 'Brazil',
  CHINE: 'China', 'COSTA RICA': 'Costa Rica', "CÔTE D'IVOIRE": 'Ivory Coast', 'ÉMIRATS ARABES UNIS': 'UAE',
  'EMIRATS ARABES UNIS': 'UAE', ESPAGNE: 'Spain', 'ÉTATS-UNIS': 'United States', GHANA: 'Ghana',
  IRLANDE: 'Ireland', ITALIE: 'Italy', JAPON: 'Japan', LIBAN: 'Lebanon', LUXEMBOURG: 'Luxembourg',
  MADAGASCAR: 'Madagascar', MALAISIE: 'Malaysia', MAROC: 'Morocco', MOZAMBIQUE: 'Mozambique', OMAN: 'Oman',
  PEROU: 'Peru', PHILIPPINES: 'Philippines', POLOGNE: 'Poland', QATAR: 'Qatar', 'RÉPUBLIQUE DE CORÉE': 'South Korea',
  'RÉPUBLIQUE DE MAURICE': 'Mauritius', 'ROYAUME-UNI': 'United Kingdom', RUSSIE: 'Russia', SALVADOR: 'El Salvador',
  SINGAPOUR: 'Singapore', SUISSE: 'Switzerland', 'TAÏWAN': 'Taiwan', TUNISIE: 'Tunisia', URUGUAY: 'Uruguay',
  TOGO: 'Togo', ZAMBIE: 'Zambia', 'ARABIE SAOUDITE': 'Saudi Arabia', ARGENTINE: 'Argentina',
  'INDONÉSIE': 'Indonesia', CANADA: 'Canada', HONDURAS: 'Honduras', INDE: 'India', KENYA: 'Kenya',
  'PAYS-BAS': 'Netherlands', 'RÉPUBLIQUE TCHÈQUE': 'Czech Republic', ROUMANIE: 'Romania', 'SÉNÉGAL': 'Senegal',
  SERBIE: 'Serbia', CAMBODGE: 'Cambodia', COLOMBIE: 'Colombia', DJIBOUTI: 'Djibouti', 'ÉGYPTE': 'Egypt',
  'ÉQUATEUR': 'Ecuador', 'GUINÉE': null, MONACO: 'Monaco', 'RÉPUBLIQUE DU CONGO': null, 'REPUBLIQUE DU CONGO': null,
  'SUÈDE': 'Sweden', 'THAÏLANDE': 'Thailand', VIETNAM: 'Vietnam', CAMEROUN: 'Cameroon', CROATIE: 'Croatia',
  'GRÈCE': 'Greece', KOWEIT: 'Kuwait', PANAMA: 'Panama', 'SRI LANKA': 'Sri Lanka', TURQUIE: 'Turkey',
  TANZANIE: 'Tanzania', VANUATU: 'Vanuatu', ZIMBABWE: 'Zimbabwe', 'BURKINA FASO': null, CHILI: 'Chile',
  CUBA: 'Cuba', PORTUGAL: 'Portugal' };
function frCountry(acad) {
  const a = String(acad || '').trim();
  if (FR_METRO.has(a)) return 'France';
  if (a in FR_OVERSEAS) return FR_OVERSEAS[a];
  if (/^ANDORRE/.test(a)) return 'Andorra';
  return FR_ABROAD[a];
}
function france(out, held, refused) {
  const f = cacheFile('fr_sections.json');
  if (!fs.existsSync(f)) return;
  const by = new Map();
  for (const r of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    const k = r.uai || `${r.nom_etab}|${r.ville}`;
    if (!by.has(k)) by.set(k, { ...r, sections: new Set(), niveaux: new Set() });
    by.get(k).sections.add(r.section); by.get(k).niveaux.add(r.niveau);
  }
  for (const s of by.values()) {
    const country = frCountry(s.academie);
    const lat = s.position ? s.position.lat : s.latitude; const lng = s.position ? s.position.lon : s.longitude;
    const p = country ? place(s.ville, lat, lng, country) : null;
    if (!p) { refused.push({ source: 'france', name: s.nom_etab, why: `not in one of our cities: ${s.ville} (${s.academie})` }); continue; }
    const secs = [...s.sections];
    const codes = secs.map((x) => FR_SECTION[x] || `?${x}`);
    const { langs, unknown } = finish(p.city, codes);
    if (!langs.length) { refused.push({ source: 'france', name: s.nom_etab, city: p.city, why: `only the local language (${secs.join(', ')})` }); continue; }
    // The standing rule refuses more than six languages whole, even here where each one is its own
    // line in the arrêté. It costs Lyon's Cité scolaire internationale (three rows) and Strasbourg's
    // Pontonniers; reported, not bent.
    if (langs.length > MAX_LANGS) { refused.push({ source: 'france', name: s.nom_etab, city: p.city, why: `more than six languages (${langs.join(', ')})` }); continue; }
    // A French lycée abroad teaches mainly in French, which the list does not state; publishing its
    // section language alone would bill it as an English school. Held, not proposed.
    // Overseas académies (Guyane, La Réunion ...) are French public schools like the mainland ones,
    // even though our cities file them under their own country names.
    const home = country === 'France' || String(s.academie).trim() in FR_OVERSEAS;
    const dest = home ? out : held;
    dest.push({ city: p.city, name: s.nom_etab, category: 'school', languages: langs, sourceUrl: FR_PAGE,
      evidence: 'official', checked: CHECKED, area: p.how === 'name' ? undefined : s.ville,
      quote: `Section internationale ${secs.map((x) => x.toLowerCase()).join(', ')} (${[...s.niveaux].join(', ')})`,
      placed: p.how, ...(unknown.length ? { note: `unmapped: ${unknown.join(', ')}` } : {}),
      ...(home ? {} : { heldWhy: 'French school abroad: the list states only its section language, not French' }) });
  }
}

// ---- andalucia (held) -------------------------------------------------------
const AND_CITY = { Sevilla: 'seville', 'Málaga': 'malaga', Granada: 'granadaspain', 'Cádiz': 'cadiz',
  'Almería': 'almeria', Marbella: 'marbella', Ronda: 'ronda', Tarifa: 'tarifa' };
const AND_LANG = { ING: 'en', FRA: 'fr', ALE: 'de' };
function andalucia(held) {
  const f = cacheFile('andalucia_2024_25.csv');
  if (!fs.existsSync(f)) return;
  const stages = ['Infantil_2_ciclo', 'Primaria', 'ESO', 'Bachillerato'];
  for (const r of csvParse(fs.readFileSync(f, 'utf8'), ';')) {
    const city = AND_CITY[(r.D_MUNICIPIO || '').trim()];
    if (!city) continue;
    const progs = stages.map((s) => r[s]).filter((v) => /BIL|PLURIL/.test(v || ''));
    const codes = progs.flatMap((v) => [...v.matchAll(/\b(ING|FRA|ALE)\b/g)].map((m) => AND_LANG[m[1]]));
    const { langs } = finish(city, codes);
    if (!langs.length) continue;
    held.push({ city, name: `${r.D_DENOMINA} ${r.D_ESPECIFICA}`.trim(), category: 'school', languages: langs,
      sourceUrl: AND_PAGE, evidence: 'official', checked: CHECKED, area: r.D_LOCALIDAD,
      quote: `Programa: ${[...new Set(progs)].join('; ')} (${r.D_TIPO})`,
      heldWhy: 'Spanish school with a bilingual programme, not an international or foreign-language school' });
  }
}

// ---- propose ----------------------------------------------------------------
const SOURCES = {
  korea: { publisher: 'National Research Foundation of Korea for the Ministry of Education (외국교육기관 및 외국인학교 종합안내, isi.go.kr)',
    url: `${ISI}/schoolInfo/getListSchInfoVO.do?schoolType=ST`,
    licenceOrTermsQuote: 'data.go.kr dataset 15085254 (한국연구재단_외국교육기관 및 외국인학교 종합안내): "이용허락범위 제한 없음" (no restriction on permitted use). Site footer: "COPYRIGHT © 2021 NRF. ALL RIGHTS RESERVED."; no clause on extraction or reuse found.',
    pageNote: "Korea's Ministry of Education publishes, through the National Research Foundation, every licensed foreign school with the language its classes are taught in. The languages shown are that list's own \"Language for class\"." },
  hongkong: { publisher: 'Committee on Home-School Co-operation (CHSC), Primary School Profiles 2025, via DATA.GOV.HK',
    url: CHSC_PAGE,
    licenceOrTermsQuote: 'DATA.GOV.HK terms: "You are allowed to browse, download, distribute, reproduce, hyperlink to, and print the Data for both commercial and non-commercial purposes on a free-of-charge basis", with attribution to the Government, the Relevant Organisations and DATA.GOV.HK.',
    pageNote: "Hong Kong's school profiles, published by the Committee on Home-School Co-operation on DATA.GOV.HK, state each primary school's medium of instruction. Listed here are the schools that teach in English." },
  berlin: { publisher: 'Senatsverwaltung für Bildung, Jugend und Familie Berlin, Staatliche Europa-Schule Berlin',
    url: SESB_PAGE,
    licenceOrTermsQuote: 'Impressum: "Das Layout der Seiten ..., die verwendeten Grafiken, Fotos, Bewegtbilder, Texte sowie die Sammlung der Beiträge sind urheberrechtlich geschützt. Die Nutzung der Inhalte ist nur im Rahmen der gesetzlichen Bestimmungen zulässig." No clause against extraction or reuse.',
    pageNote: "Berlin's Senate lists the State European Schools, public schools where every class is taught in German and a partner language by native-speaker teachers. The language shown is that partner language." },
  france: { publisher: "Ministère de l'Éducation nationale (DREIC), sections internationales, data.education.gouv.fr",
    url: FR_PAGE,
    licenceOrTermsQuote: 'Licence Ouverte v2.0 (Etalab): free reuse, including commercial, with attribution.',
    pageNote: "France's education ministry lists every school with an international section, where part of the teaching is in the section's language. The language shown is that section language, as the ministry's list names it." },
  andalucia: { publisher: 'Junta de Andalucía, Consejería de Desarrollo Educativo, Centros educativos bilingües en Andalucía 2024/2025',
    url: AND_PAGE, licenceOrTermsQuote: 'CC BY 4.0 (Reconocimiento 4.0 Internacional).',
    pageNote: "Andalusia's regional government lists the schools authorised to teach part of the curriculum in English, French or German." },
};
function propose() {
  const parts = { korea: [], hongkong: [], berlin: [], france: [] };
  const held = { hongkong: [], andalucia: [], france: [] };
  const refused = [];
  korea(parts.korea, refused);
  hongkong(parts.hongkong, held.hongkong, refused);
  berlin(parts.berlin, refused);
  france(parts.france, held.france, refused);
  andalucia(held.andalucia);
  const clean = (r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));
  const proposals = Object.entries(parts).map(([k, rows]) => ({ source: SOURCES[k], rows: rows.map(clean) }));
  const heldOut = Object.entries(held).map(([k, rows]) => ({ source: SOURCES[k], rows: rows.map(clean) }));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'proposals.json'), `${JSON.stringify(proposals, null, 1)}\n`);
  fs.writeFileSync(path.join(OUT, 'proposals-held.json'), `${JSON.stringify(heldOut, null, 1)}\n`);
  fs.writeFileSync(path.join(OUT, 'refused.json'), `${JSON.stringify(refused, null, 1)}\n`);
  for (const [name, set] of [['PROPOSED', proposals], ['HELD', heldOut]]) {
    const by = {};
    for (const p of set) for (const r of p.rows) {
      const k = `${r.city}`; by[k] = by[k] || { n: 0, langs: {} }; by[k].n += 1;
      for (const l of r.languages) by[k].langs[l] = (by[k].langs[l] || 0) + 1;
    }
    console.log(`\n${name}: ${set.reduce((a, p) => a + p.rows.length, 0)} rows`);
    Object.entries(by).sort((a, b) => b[1].n - a[1].n)
      .forEach(([c, v]) => console.log(`  ${c.padEnd(16)} ${String(v.n).padStart(4)}  ${Object.entries(v.langs).map(([l, n]) => `${l} ${n}`).join(', ')}`));
  }
  console.log(`\nrefused: ${refused.length}`);
}

(async () => {
  if (cmd === 'fetch') return fetchAll();
  if (cmd === 'propose') return propose();
  console.error('usage: node scripts/read_school_lists.cjs <fetch|propose> --cache <dir> [--out <dir>]');
  process.exit(1);
})();

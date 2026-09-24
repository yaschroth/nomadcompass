/**
 * Extends scripts/read_korea_open_data.cjs to the five Korean cities that reader leaves out:
 * daejeon, jeonju, andong, gyeongju and sokcho (the site's ten Korean cities, from
 * scripts/lib/service_data.cjs CITY, are these five plus seoul, busan, jeju, gwangju and daegu).
 *
 * WHAT THERE IS
 *
 * One source. The Korea Health Industry Development Institute's list of "hospitals foreigners
 * often visit" (data.go.kr 15152195 for the languages, 15152186 for the hospitals) is national.
 * The first reader kept only the five cities it covered and counted the rest as "not in our
 * cities"; ten of those rows, in use (사용여부 Y) and with a language, are in daejeon, jeonju and
 * andong. Same source, same licence (이용허락범위 제한 없음), same page note, so the rows carry the
 * same dataset key, 'khidi', and the same DATASETS entry, read from the first reader.
 *
 * WHAT WAS SEARCHED AND FOUND WANTING (2026-09-24)
 *
 * data.go.kr's own catalogue search (FILE and API) for 외국어 가능, 외국어가능, 외국어 약국/의료/진료/
 * 병원/치과/동물병원, 외국인 진료/환자/의료/약국/병원/친화, 다국어, 영어 진료, 글로벌 약국, 진료가능,
 * and the city and province names of all five cities; and data.seoul.go.kr's catalogue search.
 * No city or province in the five publishes a foreign-language list of clinics, pharmacies or vets.
 * Of Seoul's 25 districts only Gangdong, Yongsan, Seocho (all read by the first reader), Gangnam
 * and Gangseo (both refused there) publish one as open data. The other 20 do not.
 *
 * Refused, because the field is not a language:
 *   - Daejeon Tourism Organization 의료관광 의료기관 현황 (data.go.kr 15020837, 50 rows, 2025-08-21):
 *     the column is 유치대상국가, target countries ("미국/일본/중국").
 *   - Gyeongju-si 외국인 환자 유치 등록 의료기관 현황 (15159876, one row) and Gyeongsangbuk-do
 *     외국인환자유치의료기관현황 (15160009, 20 rows): name and address only, no language column.
 *   - Gangnam-gu 의료관광DB 기관정보, one file per site language (15071686 Korean, 15072591 English,
 *     and the Russian, Arabic, Japanese and Chinese ones): name and specialty only. The language in
 *     the title is the language the file is written in.
 * Refused, because there is no open licence:
 *   - Mapo-gu health centre's 외국어 가능 의료기관 (mapo.go.kr/site/health/hangdong/list2): 146 clinics
 *     and dentists, each with its languages (English 139, Japanese 26, Chinese 23). It is a web page,
 *     not open data, and carries no 공공누리 mark; Mapo's copyright policy (mapo0603) grants free use
 *     only to works that bear one. ASK PERMISSION, or ask Mapo to publish it on data.go.kr.
 *   - Living in Daejeon (livingindaejeon.or.kr, Daejeon's foreign residents' centre): "2021 © DICC
 *     ALL RIGHTS RESERVED", and its three hospitals' languages are interpreting services (통역,
 *     유선통역), which the rule refuses anyway.
 *   - Yeongdo-gu, Busan 외국인진료의료기관 (yeongdo.go.kr/health/01621/01637.web): seven clinics, no
 *     licence mark, and every row's remark, by ditto, is "영어통역은 근무 시간에만 가능 (English
 *     Interpreter is on duty)", interpreting again.
 * Not reachable without a key:
 *   - Korea Tourism Organization 의료관광정보 (data.go.kr 15143913, OpenAPI, 이용허락범위 제한 없음,
 *     updated 2026-03-11): detailMdclTursm returns svcLangInfo per institution ("English,Kazakh,
 *     Mongolian" in the manual) and cpyrhtDivCd per item (Type1, or Type3 no-derivatives). It is
 *     national, so it may reach cities no list here does. It needs a free data.go.kr service key,
 *     which this script does not have; and whether svcLangInfo means staff who speak it or an
 *     interpreter or coordinator (coorResidYn sits beside it) must be read on real rows first.
 *
 * THE RULE is the first reader's, applied through its own langsOf: Mongolian is dropped (not a
 * directory language), ETC names nothing, Korean is never added, more than six languages refuses the
 * row. KHIDI rows marked 사용여부 N (the portal no longer shows them) are refused, as there.
 *
 * TRAPS
 *   - The region field is a province (JEOLLABUK_DO, GYEONGSANGBUK_DO, GANGWON_DO), so the city is
 *     read from the English address: Gunsan, Iksan, Gumi, Gangneung, Chuncheon and Wonju share those
 *     provinces and are not our cities. Sungji Hospital (GANGWON_DO) has no address; its 033-760
 *     number is Wonju, not Sokcho.
 *   - Daejeon Sun Medical Center, Yuseong Sun Medical Center and Sun Dental Hospital give one
 *     international-office phone number, so a phone number cannot be a duplicate key between these
 *     rows; it is used only against rows already in the directory.
 *   - Konyang University Hospital is on the file twice: "Konayng University Hospital" (N) and
 *     "Konyang University Hospital" (Y). Only Y is read, so it is one row.
 *   - Dongguk University Gyeongju Hospital, the only Gyeongju entry, is N, so gyeongju gets none.
 *
 * STAGES
 *   fetch    node scripts/read_korea_open_data_more.cjs fetch --cache <dir> [--force]
 *   propose  node scripts/read_korea_open_data_more.cjs propose --cache <dir>
 *              writes <dir>/proposals.json ({ written, source, datasets, pageNotes, rows }) and
 *              <dir>/refused.json. Rows already in data/service-languages.json (same city and
 *              name, or same city and phone) are refused as duplicates.
 */
const fs = require('fs');
const path = require('path');
const K = require('./read_korea_open_data.cjs');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'korea-more')));
const FILES = path.join(CACHE, 'files');
const MAX_LANGS = 6;

const DATASETS = { khidi: K.DATASETS.khidi };
const CITIES = ['daejeon', 'jeonju', 'andong', 'gyeongju', 'sokcho'];
// Checked against the English address; the region code is only the province.
const CITY_EN = [[/\bDaejeon\b/i, 'daejeon'], [/\bJeonju\b|Jeonju-si/i, 'jeonju'], [/\bAndong\b|Andong-si/i, 'andong'],
  [/\bGyeongju\b|Gyeongju-si/i, 'gyeongju'], [/\bSokcho\b|Sokcho-si/i, 'sokcho']];
const REGIONS = new Set(['DAEJEON', 'JEOLLABUK_DO', 'GYEONGSANGBUK_DO', 'GANGWON_DO']);

// ---- download (the file id changes with each re-upload, so it is read from the dataset page) ----
async function req(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(55000) });
  if (r.status !== 200) throw new Error(`${r.status} ${url}`);
  return r;
}
async function datagokr(id) {
  const page = await (await req(`https://www.data.go.kr/data/${id}/fileData.do`)).text();
  const m = page.match(/fileDownload\.do\?atchFileId=(FILE_\d+)&(?:amp;)?fileDetailSn=(\d+)/);
  if (!m) throw new Error(`no file link on data.go.kr ${id}`);
  return Buffer.from(await (await req(`https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=${m[2]}&insertDataPrcus=N`)).arrayBuffer());
}
async function fetchAll() {
  fs.mkdirSync(FILES, { recursive: true });
  const d = DATASETS.khidi;
  for (const [file, g] of [[d.file, d.get], [d.file2, d.get2]]) {
    const f = path.join(FILES, file);
    if (fs.existsSync(f) && !has('--force')) { console.log(`khidi: ${file} cached`); continue; }
    try {
      const b = await datagokr(g.id);
      if (b.length < 200) throw new Error('file too small: ' + b.length + ' bytes');
      fs.writeFileSync(f, b); console.log(`khidi: ${file} ${b.length} bytes`);
    } catch (e) { console.log(`khidi: ${file} FAILED ${e.message}`); }
    await new Promise((r) => setTimeout(r, 800));
  }
}

// ---- read ---------------------------------------------------------------------------------
function decode(b) {
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.slice(3);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('euc-kr').decode(b); }
}
const readCsv = (file) => K.parseCsv(decode(fs.readFileSync(path.join(FILES, file))));

function candidates(refused, tally) {
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  const d = DATASETS.khidi;
  const L = readCsv(d.file); const LH = L[0];
  const byId = {};
  L.slice(1).filter((r) => r[LH.indexOf('사이트언어')] === 'EN').forEach((r) => {
    const id = r[LH.indexOf('자주찾는병원번호')];
    (byId[id] = byId[id] || []).push(r[LH.indexOf('언어')]);
  });
  const P = readCsv(d.file2); const PH = P[0]; const ix = (w) => PH.indexOf(w);
  const checked = fs.statSync(path.join(FILES, d.file)).mtime.toISOString().slice(0, 10);
  const rows = [];
  for (const r of P.slice(1)) {
    if (r[ix('콘텐츠타입')] !== 'MOST_VISITED_MEDICAL_INSTITUTE' || !REGIONS.has(r[ix('지역')])) continue;
    const name = r[ix('병원명')].replace(/\s+/g, ' ').trim();
    const addr = r[ix('주소1')].replace(/^\?/, '').trim();
    const city = (CITY_EN.find(([re]) => re.test(addr)) || [])[1];
    if (!city) { count('same province, not one of our cities'); continue; }
    const base = { dataset: 'khidi', name, city, address: addr };
    if (r[ix('사용여부')] !== 'Y') { refused.push({ ...base, why: 'entry not in use on the portal (사용여부 N)' }); count('not in use (N)'); continue; }
    const id = r[ix('자주찾는병원번호')];
    if (!byId[id]) { refused.push({ ...base, why: 'no language listed' }); count('no language listed'); continue; }
    const quote = byId[id].join(',');
    const Lg = K.langsOf(quote);
    if (Lg.unknown.length) { refused.push({ ...base, why: 'unmapped language ' + Lg.unknown.join(',') }); count('unmapped language'); continue; }
    if (Lg.dropped.length) count('language not in the directory dropped (' + Lg.dropped.join(',') + ')');
    if (!Lg.codes.length) { refused.push({ ...base, why: 'no publishable language' }); count('no publishable language'); continue; }
    if (Lg.codes.length > MAX_LANGS) { refused.push({ ...base, why: Lg.codes.length + ' languages' }); count('more than six languages'); continue; }
    const kind = r[ix('병원구분')]; const web = r[ix('웹사이트url')].trim();
    rows.push({
      id: 'khidi:' + id,
      city,
      name,
      category: kind === 'DENTAL_HOSPITAL' ? 'dentist' : 'doctor',
      languages: Lg.codes,
      url: /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(web) ? (/^https?:/i.test(web) ? web : 'http://' + web) : undefined,
      sourceUrl: d.sourceUrl,
      evidence: 'official',
      checked,
      area: K.placeEn(addr),
      address: addr,
      phone: r[ix('전화번호')] || undefined,
      hospital: /GENERAL_HOSPITAL|DENTAL_HOSPITAL/.test(kind) || /Hospital|Medical Center/.test(name) || undefined,
      koreanMedicine: kind === 'KOREAN_MEDICINE_HOSPITAL' || undefined,
      quote,
      asOf: d.asOf,
      dataset: 'khidi',
    });
  }
  return rows;
}

// ---- propose -------------------------------------------------------------------------------
const key = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/\([^)]*\)/g, '')
  .replace(/\b(the|of|and)\b/g, '').replace(/[^a-z0-9가-힣]+/g, '');
const digits = (p) => String(p || '').replace(/\D/g, '').slice(-7);

function propose() {
  const refused = []; const tally = {};
  const all = candidates(refused, tally);
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8')).providers
    .filter((p) => CITIES.includes(p.city));
  const have = new Set();
  db.forEach((p) => { have.add(p.city + '|n|' + key(p.name)); if (p.phone && digits(p.phone).length >= 7) have.add(p.city + '|p|' + digits(p.phone)); });
  const seen = new Set(); const rows = [];
  for (const r of all) {
    const nk = r.city + '|n|' + key(r.name);
    if (have.has(nk) || (digits(r.phone).length >= 7 && have.has(r.city + '|p|' + digits(r.phone)))) {
      refused.push({ dataset: r.dataset, name: r.name, city: r.city, why: 'already in data/service-languages.json' }); tally['already in the directory'] = (tally['already in the directory'] || 0) + 1; continue;
    }
    if (seen.has(nk)) { tally['same name twice'] = (tally['same name twice'] || 0) + 1; continue; }
    seen.add(nk); rows.push(r);
  }
  const d = DATASETS.khidi;
  const datasets = { khidi: { sourceUrl: d.sourceUrl, publisher: d.publisher, title: d.title, licence: d.licence, asOf: d.asOf } };
  const pageNotes = { khidi: d.pageNote };
  const source = { publisher: d.publisher, url: d.sourceUrl, licenceOrTermsQuote: d.licence, pageNote: d.pageNote };
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), source, datasets, pageNotes, rows }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify({ refused }, null, 1));
  tally.proposed = rows.length;
  console.log(tally);
  const by = {}; const byLang = {};
  rows.forEach((r) => { by[r.city + ' ' + r.category] = (by[r.city + ' ' + r.category] || 0) + 1; r.languages.forEach((l) => { byLang[l] = (byLang[l] || 0) + 1; }); });
  console.log(by); console.log(byLang);
}

if (require.main === module) {
  (async () => {
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_korea_open_data_more.cjs <fetch|propose> --cache <dir> [--force]');
    process.exit(2);
  })();
}

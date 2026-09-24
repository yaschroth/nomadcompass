/**
 * Reads the Korean public registers that name non-medical providers in our Korean cities together
 * with a foreign language each one is officially tied to.
 *
 * Our Korean cities (scripts/lib/service_data.cjs CITY): seoul, busan, jeju, gwangju, daegu,
 * gyeongju, jeonju, andong, sokcho, daejeon.
 *
 * WHY THESE SOURCES
 *
 * 1. 행정사 registers (translators). Under the Certified Administrative Agents Act (행정사법) every
 *    행정사 who opens an office reports it to the city, county or district (업무신고), and many
 *    districts publish that register on data.go.kr. The licence has three kinds: 일반행정사, 해사행정사
 *    and 외국어번역행정사, the foreign-language translation agent, who translates documents for
 *    submission to government offices and certifies the translation (번역확인증명). The foreign-
 *    language licence is issued for one language, and the registers that carry a kind column write
 *    it that way: "외국어번역행정사(영어)", "외국어번역행정사(중국어)". That is a government register,
 *    naming the business and the language it is licensed in, which is the official tier. Category:
 *    translator. Every dataset below says "이용허락범위 제한 없음" (no restriction) on data.go.kr.
 *
 * 2. Daejeon's 글로벌 부동산 중개사무소 (global real estate agencies): the city designates agencies
 *    that can deal with foreign clients and publishes each one with its 지정언어, designated
 *    language, on data.go.kr ("이용허락범위 제한 없음"). Category: realestate. The list is dated
 *    22 March 2023 and its announced next update (2024-03-23) never came, which the page note says.
 *
 * THE RULE
 *
 * A translator row is published only where the register's kind column names the language in
 * brackets ("외국어번역행정사(영어)") or, in Gangwon's register, after a plus ("일반+영어": a general
 * agent also licensed to translate English). A bare "외국어번역행정사" would name nothing and is
 * refused; none is on today's files. A language that appears only in an office's NAME is refused
 * too: a name is not the register's field. That includes names like "중화행정번역사" (Yangcheon-gu)
 * or "송파제일번역·일반행정사사무소" whose own row says 일반행정사, and, in the registers with no kind
 * column at all, "일본어번역행정사 김치영 사무소" (Mapo-gu) or "한중공인 외국어번역 행정사사무소"
 * (Yeongdeungpo-gu). Name-only rows in the registers read here are written to refused.json as
 * candidates for a self-declared check, unless the same office has a typed row.
 *
 * An office listed once per agent (a 행정사법인 with several agents, or one agent listed once as
 * 일반행정사 and once as 외국어번역행정사) is one row; its languages are the union of the languages its
 * translation agents are licensed in. Rows marked closed or suspended (폐업, 휴업) are dropped.
 * Korean is never added. More than six languages is refused, as in the other readers.
 *
 * Personal names of agents (대표자명, 성명, 행정사명) are not carried; the office name is.
 * Phone cells that say "개인정보포함" (withheld as personal data) are not phone numbers.
 *
 * CHECKED AND REFUSED (2026-09-24), so nobody repeats them:
 *   - 행정사 registers with no kind column, so no language (names only): Seoul 광진 15028806,
 *     중랑 15028837, 강남 15029441 (2022), 동작 15037267, 마포 3080507 (links out to mapo.go.kr),
 *     영등포 15028829 (links out to ydp.go.kr), 강북 15049611 (link blocked by a JS cookie wall);
 *     Busan 영도 15028771, 금정 15028822; Daegu 서구 15028761, 동구 15028795, 북구 15028816, 수성
 *     15028852; Gwangju 동구 15028760, 북구 15029715 (2021, and half its rows are not in Gwangju),
 *     남구 15160574; Daejeon 서구 15028773, 대덕 15028797, 동구 15030062, 중구 15119523; Gyeongju
 *     15029891. Seoul 은평 (ep.go.kr, has a kind column) lists no translation agents.
 *     No 행정사 dataset exists on data.go.kr for Jeju, Jeonju or Andong, nor for 12 Seoul districts.
 *   - Busan's city-wide 행정사 API (data.go.kr 15034027, "이용허락범위 제한 없음") holds 22 translation
 *     agents (its own description: 영어 14, 일본어 5, 중국어 2, 독일어 1, as of 2025-05-21) but needs a
 *     data.go.kr service key (free, auto-approved). Pass --key or set DATA_GO_KR_SERVICE_KEY and the
 *     busan-api dataset below is read; without a key it is skipped and the three Busan district
 *     files carry six of the 22.
 *   - 대한행정사회 행정사검색 (daaa.or.kr, has a language filter): its terms forbid it. "회원은 서비스를
 *     이용하여 얻은 정보를 본회의 사전 동의없이 복사,복제,변경, 번역,출판,방송 기타의 방법으로 사용하거나
 *     이를 타인에게 제공할 수 없습니다." ASK PERMISSION.
 *   - Korean Bar Association and the Seoul, Daegu bar searches: no language field (name, office,
 *     field, region only). Seoul Bar profiles need a login and are capped at 20 views a day.
 *   - 한국세무사회 세무사 찾기 and Seoul's 마을세무사 (OA-22865, KOGL type 4 anyway): no language field.
 *   - Daegu 글로벌 부동산중개사무소 (daegu.go.kr menu 00936180, 13 designations with language): no
 *     KOGL mark, and Daegu's copyright policy says unmarked material needs "공공저작물 관리책임관 및
 *     실무담당자와 사전에 협의". Busan's 글로벌중개사무소 page (busan.go.kr/depart/ahestateprice04):
 *     same, no KOGL mark, and no copy on data.go.kr. ASK PERMISSION for both.
 *   - Ministry of Justice 출입국민원 대행기관 현황: KOGL type 4 and no language column.
 *   - No data.go.kr or data.seoul.go.kr dataset of foreign-language vets, tax accountants, law firms
 *     or real estate agencies exists for our cities beyond the above (Seoul's global agencies are
 *     read elsewhere).
 *
 * STAGES
 *
 *   fetch    node scripts/read_korea_nonmed.cjs fetch --cache <dir> [--force] [--key <service key>]
 *   propose  node scripts/read_korea_nonmed.cjs propose --cache <dir>
 *              writes <dir>/proposals.json and <dir>/refused.json.
 *
 * There is no ingest stage; the proposals carry sourceUrl and a pageNote per source.
 */
const fs = require('fs');
const path = require('path');
const K = require('./read_korea_open_data.cjs'); // parseCsv, langsOf, placeKo

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'korea-nonmed')));
const FILES = path.join(CACHE, 'files');
const KEY = val('--key', process.env.DATA_GO_KR_SERVICE_KEY || '');
const MAX_LANGS = 6;
const NO_LIMIT = '이용허락범위 제한 없음';

// ---- the datasets -----------------------------------------------------------------
// asOf is the date in the file's own title (the _YYYYMMDD suffix data.go.kr shows).
const hj = (id, city, area, en, ko, asOf) => ({
  id, kind: 'haengjeongsa', city, area, file: `${id}.csv`, sourceUrl: `https://www.data.go.kr/data/${id}/fileData.do`,
  publisher: en, publisherKo: ko, licence: NO_LIMIT, asOf,
  pageNote: `Some of these are on the register of administrative agents (행정사) that ${en} keeps under ` +
    'Korea\'s Certified Administrative Agents Act and publishes as open data. A foreign-language translation ' +
    'agent is licensed for one language, and the register names it.',
});
const DATASETS = {
  'seoul-jongno': hj('15075938', 'seoul', 'Jongno-gu', 'Jongno-gu, Seoul', '서울특별시 종로구', '2026-07-22'),
  'seoul-seongdong': hj('15028790', 'seoul', 'Seongdong-gu', 'Seongdong-gu, Seoul', '서울특별시 성동구', '2026-07-24'),
  'seoul-songpa': hj('15028825', 'seoul', 'Songpa-gu', 'Songpa-gu, Seoul', '서울특별시 송파구', '2025-05-08'),
  'seoul-yangcheon': hj('15039328', 'seoul', 'Yangcheon-gu', 'Yangcheon-gu, Seoul', '서울특별시 양천구', '2026-03-09'),
  'seoul-seodaemun': hj('15083916', 'seoul', 'Seodaemun-gu', 'Seodaemun-gu, Seoul', '서울특별시 서대문구', '2026-09-02'),
  'busan-jung': hj('15003529', 'busan', 'Jung-gu', 'Jung-gu, Busan', '부산광역시 중구', '2026-01-13'),
  'busan-saha': hj('15028851', 'busan', 'Saha-gu', 'Saha-gu, Busan', '부산광역시 사하구', '2026-04-09'),
  'busan-nam': hj('3080517', 'busan', 'Nam-gu', 'Nam-gu, Busan', '부산광역시 남구', '2026-01-31'),
  'busan-gangseo': hj('3045864', 'busan', 'Gangseo-gu', 'Gangseo-gu, Busan', '부산광역시 강서구', '2025-12-09'),
  'busan-suyeong': hj('3046165', 'busan', 'Suyeong-gu', 'Suyeong-gu, Busan', '부산광역시 수영구', '2026-01-01'),
  // Province-wide; only the Sokcho rows count. It lists no translation agent at all today.
  'gangwon': { ...hj('15033702', 'sokcho', undefined, 'Gangwon State', '강원특별자치도', '2026-07-31'), onlySigungu: '속초시' },
  'busan-api': {
    id: '15034027', kind: 'haengjeongsa', api: true, city: 'busan', file: 'busan-15034027.json',
    sourceUrl: 'https://www.data.go.kr/data/15034027/openapi.do', publisher: 'Busan Metropolitan City', publisherKo: '부산광역시',
    licence: NO_LIMIT, asOf: '2025-05-21',
    pageNote: 'Some of these are on the register of administrative agents (행정사) in Busan\'s districts, which ' +
      'Busan Metropolitan City publishes as open data under Korea\'s Certified Administrative Agents Act. A ' +
      'foreign-language translation agent is licensed for one language, and the register names it.',
  },
  'daejeon-global-realestate': {
    id: '15073580', kind: 'global-realestate', city: 'daejeon', file: '15073580.csv',
    sourceUrl: 'https://www.data.go.kr/data/15073580/fileData.do', publisher: 'Daejeon Metropolitan City', publisherKo: '대전광역시',
    licence: NO_LIMIT, asOf: '2023-03-22',
    pageNote: 'Some of these are on the list of global real estate agencies that Daejeon Metropolitan City ' +
      'designates for foreign clients, with the language each is designated for, published as open data and ' +
      'dated 22 March 2023. The city has not published an update since.',
  },
};

// ---- download ---------------------------------------------------------------------
async function req(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(55000) });
  if (r.status !== 200) throw new Error(`${r.status} ${url}`);
  return r;
}
// data.go.kr: most pages carry the file link; some only carry fn_fileDataDown(pk, uddi), and the
// file id then comes from selectFileDataDownload.do, which is what the page's own button calls.
async function dataGoKrFile(id) {
  const page = await (await req(`https://www.data.go.kr/data/${id}/fileData.do`)).text();
  const lic = (page.match(/이용허락범위<\/strong>[\s\S]*?<div class="value">([\s\S]*?)<\/div>/) || [])[1];
  if (!lic || !lic.replace(/<[^>]+>/g, '').includes(NO_LIMIT)) throw new Error(`licence changed on ${id}: ${String(lic).replace(/<[^>]+>|\s+/g, ' ').trim()}`);
  let m = page.match(/fileDownload\.do\?atchFileId=(FILE_\d+)&(?:amp;)?fileDetailSn=(\d+)/);
  const dd = page.match(/fn_fileDataDown\('(\d+)',\s*'(uddi:[^']+)'/);
  if (!m && dd) {
    const j = await (await req('https://www.data.go.kr/tcs/dss/selectFileDataDownload.do', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ publicDataPk: dd[1], publicDataDetailPk: dd[2], atchFileId: '', fileDetailSn: '1', publicDataTyCode: 'PR0051' }).toString(),
    })).json();
    if (j.status) m = [null, j.atchFileId, j.fileDetailSn];
  }
  if (!m) throw new Error(`no file link on data.go.kr ${id}`);
  return Buffer.from(await (await req(`https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=${m[2]}&insertDataPrcus=N`)).arrayBuffer());
}
// Busan's API: 10,000 calls a day on a development key; the whole register is a few pages.
async function busanApi() {
  const items = []; let total = Infinity;
  for (let page = 1; items.length < total && page <= 20; page += 1) {
    const u = `https://apis.data.go.kr/6260000/BusanTblAdmStusService/getTblAdmStusInfo?serviceKey=${encodeURIComponent(KEY)}&pageNo=${page}&numOfRows=100&resultType=json`;
    const j = await (await req(u)).json();
    const body = (j.getTblAdmStusInfo || j.response || {}).body || {};
    const got = [].concat((body.items && (body.items.item || body.items)) || []);
    total = Number(body.totalCount || (j.getTblAdmStusInfo || {}).totalCount || got.length);
    if (!got.length) { if (page === 1) throw new Error('empty response: ' + JSON.stringify(j).slice(0, 300)); break; }
    items.push(...got);
    await new Promise((r) => setTimeout(r, 500));
  }
  return Buffer.from(JSON.stringify(items));
}
async function fetchAll() {
  fs.mkdirSync(FILES, { recursive: true });
  for (const [key, d] of Object.entries(DATASETS)) {
    const f = path.join(FILES, d.file);
    if (fs.existsSync(f) && !has('--force')) { console.log(`${key}: cached`); continue; }
    if (d.api && !KEY) { console.log(`${key}: skipped, needs --key or DATA_GO_KR_SERVICE_KEY`); continue; }
    try {
      const b = d.api ? await busanApi() : await dataGoKrFile(d.id);
      if (b.length < 100) throw new Error('file too small: ' + b.length + ' bytes');
      fs.writeFileSync(f, b);
      console.log(`${key}: ${b.length} bytes`);
    } catch (e) { console.log(`${key}: FAILED ${e.message}`); }
    await new Promise((r) => setTimeout(r, 700));
  }
}

// ---- reading ----------------------------------------------------------------------
function decodeText(b) {
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.slice(3);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('euc-kr').decode(b); }
}
// Each district designs its own header. These are every header seen (2026-09-24); a dataset whose
// header matches none of a required column throws, so a redesign is read by a person.
const COLS = {
  kind: /^(행정사\s*종류|민원종류명)$/,
  name: /^(사무소\s*명칭|사무소명|명\s*칭|사업장명|업체명|상호명)$/,
  road: /^(도로명주소|사무소 주소|소재지|주소|사무소 도로명전체주소|사무소 소재지\(법정동\))$/,
  jibun: /^지번주소$/,
  phone: /^(전화번호|대표전화|사무소 전화번호)$/,
  status: /^(운영상태|영업여부|영업상태|비고)$/,
  sigungu: /^시군구명$/,
};
const CLOSED = /폐업|휴업|취소|말소/;
// placeKo (read_korea_open_data) knows the districts of its five cities; Daejeon's two that are not
// shared with them are added here, or the card has no area.
const AREA_EXTRA = { 대덕구: 'Daedeok-gu', 유성구: 'Yuseong-gu' };
const areaOf = (addr) => K.placeKo(addr).area || AREA_EXTRA[(String(addr || '').match(/(?:^|\s)([가-힣]{1,4}구)(?=\s|$)/) || [])[1]];
const WITHHELD = /개인정보/;
// "외국어번역행정사(영어)", "외국어번역행정사 (영어)"; also a bare "외국어번역행정사".
const TRANSLATION = /^외국어번역행정사\s*(?:\(([^)]*)\))?$/;
// Returns null for a kind that is not a translation licence, '' for one that names no language,
// else the language words.
function translationLanguages(kind) {
  const m = kind.replace(/\s+(?=\()/, '').match(TRANSLATION);
  if (m) return m[1] || '';
  if (/\+/.test(kind)) { // Gangwon: "일반+영어", "일반+해사"
    const langs = kind.split('+').map((x) => x.trim()).filter((x) => !/^(일반|해사|기술)(행정사)?$/.test(x));
    return langs.length ? langs.join(',') : null;
  }
  if (/외국어번역/.test(kind)) return kind; // unrecognised shape: langsOf refuses it as unmapped
  return null;
}

function readHaengjeongsa(key, d, rows, refused, tally) {
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  let recs;
  if (d.api) {
    recs = JSON.parse(fs.readFileSync(path.join(FILES, d.file), 'utf8')).map((o) => ({
      kind: o.kind, name: o.cmpNm, address: o.addrRoad || o.addrJibun, phone: o.tel, status: o.state, area: o.gugun,
    }));
  } else {
    const R = K.parseCsv(decodeText(fs.readFileSync(path.join(FILES, d.file))));
    const H = R[0].map((h) => h.replace(/\s+/g, ' ').trim());
    const ix = (re) => H.findIndex((h) => re.test(h));
    const c = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, ix(re)]));
    if (c.kind < 0 || c.name < 0) throw new Error(`${key}: header not recognised: ${H.join('/')}`);
    recs = R.slice(1).filter((r) => r[c.name]).map((r) => ({
      kind: r[c.kind], name: r[c.name], address: (c.road >= 0 && r[c.road].trim()) || (c.jibun >= 0 ? r[c.jibun] : ''),
      phone: c.phone >= 0 ? r[c.phone] : '', status: c.status >= 0 ? r[c.status] : '', sigungu: c.sigungu >= 0 ? r[c.sigungu] : '',
    }));
  }
  const offices = new Map(); const nameOnly = [];
  for (const r of recs) {
    if (d.onlySigungu && r.sigungu !== d.onlySigungu) continue;
    const kind = String(r.kind || '').replace(/\s+/g, ' ').trim();
    const name = String(r.name).replace(/\s+/g, ' ').trim();
    const words = translationLanguages(kind);
    if (words === null) {
      if (/번역/.test(name)) nameOnly.push({ dataset: key, name, kind, address: r.address, why: 'language only in the office name; the register says ' + kind });
      count('not a translation agent'); continue;
    }
    if (CLOSED.test(r.status || '')) { refused.push({ dataset: key, name, why: 'closed or suspended: ' + r.status }); count('closed or suspended'); continue; }
    if (!words) { refused.push({ dataset: key, name, why: 'translation agent with no language named' }); count('no language named'); continue; }
    const L = K.langsOf(words);
    if (L.unknown.length || L.hedged.length) { refused.push({ dataset: key, name, why: 'unmapped language ' + words }); count('unmapped language'); continue; }
    const codes = L.codes.filter((x) => x !== 'ko');
    if (!codes.length) { refused.push({ dataset: key, name, why: 'no publishable language: ' + words }); count('no publishable language'); continue; }
    // One office, one row, however many agents it lists.
    const addrKey = String(r.address || '').replace(/\s+|，|,/g, '');
    const k = name.replace(/\s+/g, '') + '|' + addrKey;
    const place = K.placeKo(r.address);
    if (place.city && place.city !== d.city) { refused.push({ dataset: key, name, why: 'address outside ' + d.city + ': ' + r.address }); count('address outside the city'); continue; }
    const o = offices.get(k) || {
      city: d.city, name, category: 'translator', languages: [], sourceUrl: d.sourceUrl, evidence: 'official',
      checked: fs.statSync(path.join(FILES, d.file)).mtime.toISOString().slice(0, 10),
      area: d.area || place.area, // the API's gugun is Korean; the address gives the same district
      address: String(r.address || '').replace(/\s+/g, ' ').trim() || undefined,
      phone: r.phone && !WITHHELD.test(r.phone) && /\d{3,}/.test(r.phone) ? r.phone.trim() : undefined,
      quote: [], asOf: d.asOf, dataset: key,
    };
    o.languages = [...new Set([...o.languages, ...codes])];
    o.quote = [...new Set([...o.quote, kind])];
    offices.set(k, o);
  }
  const typed = new Set([...offices.values()].map((o) => o.name.replace(/\s+/g, '')));
  nameOnly.filter((x) => !typed.has(x.name.replace(/\s+/g, ''))).forEach((x) => refused.push(x));
  for (const o of offices.values()) {
    if (o.languages.length > MAX_LANGS) { refused.push({ dataset: key, name: o.name, why: o.languages.length + ' languages' }); continue; }
    o.quote = o.quote.join('; ');
    rows.push(o);
  }
}

function readGlobalRealEstate(key, d, rows, refused) {
  const R = K.parseCsv(decodeText(fs.readFileSync(path.join(FILES, d.file))));
  const H = R[0]; const ix = (w) => H.indexOf(w);
  for (const r of R.slice(1)) {
    if (!r[ix('사무소명')]) continue;
    const L = K.langsOf(r[ix('지정언어')]);
    const nameKo = r[ix('사무소명')].trim(); const name = (r[ix('사무소명(영문)')] || nameKo).trim();
    if (L.unknown.length || L.hedged.length || !L.codes.length) { refused.push({ dataset: key, name, why: 'language: ' + r[ix('지정언어')] }); continue; }
    const place = K.placeKo(r[ix('소재지')]);
    rows.push({
      city: d.city, name, nameKo, category: 'realestate', languages: L.codes.filter((x) => x !== 'ko'),
      sourceUrl: d.sourceUrl, evidence: 'official', checked: fs.statSync(path.join(FILES, d.file)).mtime.toISOString().slice(0, 10),
      area: areaOf(r[ix('소재지')]), address: r[ix('소재지')], addressEn: r[ix('소재지(영문)')] || undefined, phone: r[ix('전화번호')] || undefined,
      quote: '지정언어: ' + r[ix('지정언어')], asOf: d.asOf, dataset: key,
    });
  }
}

function propose() {
  const rows = []; const refused = []; const tally = {}; const skipped = [];
  for (const [key, d] of Object.entries(DATASETS)) {
    if (!fs.existsSync(path.join(FILES, d.file))) { skipped.push(key); continue; }
    if (d.kind === 'haengjeongsa') readHaengjeongsa(key, d, rows, refused, tally);
    else readGlobalRealEstate(key, d, rows, refused);
  }
  // With the Busan API present, the district files duplicate it; the API is kept (it is city-wide).
  const out = []; const seen = new Set();
  const norm = (s) => String(s || '').replace(/[\s,，()（）]/g, '');
  for (const r of rows.sort((a, b) => (a.dataset === 'busan-api' ? -1 : 0) - (b.dataset === 'busan-api' ? -1 : 0))) {
    const k = r.city + '|' + norm(r.name);
    if (seen.has(k)) { tally['same office in two datasets'] = (tally['same office in two datasets'] || 0) + 1; continue; }
    seen.add(k); out.push(r);
  }
  const sources = Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, {
    publisher: d.publisher, publisherKo: d.publisherKo, url: d.sourceUrl, licenceOrTermsQuote: d.licence, asOf: d.asOf, pageNote: d.pageNote,
  }]));
  const source = {
    publisher: 'Korean city and district governments (data.go.kr)', url: 'https://www.data.go.kr/',
    licenceOrTermsQuote: `Every dataset: "${NO_LIMIT}" (data.go.kr licence field)`,
    pageNote: 'See sources: one note per publishing government.',
  };
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), source, sources, rows: out }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify({ refused, skipped }, null, 1));
  const by = {}; out.forEach((r) => { const k = `${r.city} ${r.category} ${r.languages.join('+')}`; by[k] = (by[k] || 0) + 1; });
  console.log({ proposed: out.length, refused: refused.length, skipped, ...tally });
  console.log(by);
}

module.exports = { translationLanguages, DATASETS };

if (require.main === module) {
  (async () => {
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_korea_nonmed.cjs <fetch|propose> --cache <dir> [--force] [--key <data.go.kr service key>]');
    process.exit(2);
  })();
}

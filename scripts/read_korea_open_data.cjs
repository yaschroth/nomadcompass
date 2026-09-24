/**
 * Reads the Korean public datasets that name medical institutions and pharmacies in our five
 * Korean cities (seoul, busan, jeju, gwangju, daegu) together with the foreign languages each one
 * can serve patients in.
 *
 * WHY THESE SOURCES
 *
 * Korea has no register like Japan's 医療情報ネット, where every clinic reports its languages under
 * law. What it has is lists: a city, a district health centre or a government agency asks around,
 * writes down which institutions can handle patients in which languages, and publishes the table as
 * open data. Each list below is published by a public body, names the business, and gives its
 * languages one row at a time, which is the official tier. Every one of them is under a licence
 * that allows commercial reuse with the source named (KOGL type 1, or data.go.kr's "이용허락범위 제한
 * 없음", no restriction), and the page note names the source.
 *
 * They are lists compiled by a public body, not reports each business is obliged to make about
 * itself, and several are years old. The page notes say so, with each list's date.
 *
 * Checked and refused (2026-09-24), because their field is not a language:
 *   - Gangnam-gu 외국어가능의료기관 (data.go.kr 15142089, 1,016 rows) and Gwangju 외국인환자 유치의료기관
 *     (15043949): the column is 유치대상국가, the countries a clinic is registered to recruit patients
 *     from ("미국/일본/중국"). A target market is not a language anyone at the clinic speaks.
 *   - Gangseo-gu 미라클메디의료기관 (15131292): its language columns are the URLs of the clinic's
 *     foreign-language homepages. A translated website is not a claim to speak the language.
 *   - KHIDI 외국인환자 유치기관 (3050000), Jeju 외국인환자유치의료기관현황 (15056001), Suseong-gu
 *     (15159881), Daegu 의료관광 선도의료기관 (15046169), Busanjin-gu 의료관광 정보 (15008336): no
 *     language column at all.
 *   - Seoul 의료관광허가 의료기관 정보 (OA-12973, 2015): target countries again.
 *   - Dongdaemun-gu health centre's "외국어 가능 병의원" is a web page, not an open dataset, and has no
 *     stated licence.
 *
 * THE RULE
 *
 * A language is published where the list marks it. A language the list qualifies is not:
 * "스웨덴어(수요일 오후)", Swedish on Wednesday afternoons, "일본어는 간단회화만 가능", Japanese for
 * simple conversation only, and "일본어는 파트타임 약사님만 가능", Japanese only when the part-time
 * pharmacist is in, are the same hedge as the Japanese register's 要相談. A row whose only language
 * is spoken by the billing clerk ("전산원 상담만 가능") is refused. A remark this script does not know
 * refuses the whole row, so a new remark is read by a person before it is published.
 *
 * Korean is never added: these are Korean lists. Mongolian, Uzbek and Esperanto are named by some
 * rows and are not languages the directory has; they are dropped and counted. "기타"/"ETC" names
 * nothing. More than six languages is refused, as in the other readers.
 *
 * One institution on two lists is one row. The list with the later reference date wins, whole: its
 * languages are not merged with the older list's, and the other list is recorded in alsoListedBy.
 *
 * STAGES
 *
 *   fetch    node scripts/read_korea_open_data.cjs fetch --cache <dir>
 *              downloads each dataset once into <dir>/files. --force downloads again.
 *   propose  node scripts/read_korea_open_data.cjs propose --cache <dir>
 *              reads the files under the rule above and writes <dir>/proposals.json and
 *              <dir>/refused.json.
 *
 * There is no ingest stage yet; the proposals carry sourceUrl and pageNote for one to use.
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
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'korea')));
const FILES = path.join(CACHE, 'files');
const MAX_LANGS = 6;

// ---- the datasets -------------------------------------------------------------
// asOf is the date the list itself states (a 기준 date in the file, or the date in its title).
const DATASETS = {
  'seoul-pharmacies': {
    file: 'seoul-OA-12967.xlsx',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-12967/F/1/datasetView.do',
    publisher: 'Seoul Metropolitan Government', title: '외국어 가능 약국 현황 (foreign-language pharmacies)',
    licence: '공공누리 1유형 : 출처표시 (상업적 이용 및 변경 가능)', asOf: '2023-01-01',
    get: { kind: 'seoul-file', infId: 'OA-12967', seq: '5', infSeq: '3' },
    pageNote: 'Some of these are on the list of pharmacies that can serve customers in a foreign language, ' +
      'published by the Seoul Metropolitan Government as open data and dated 1 January 2023. The city compiled ' +
      'the list; it is not a report each pharmacy is required to make.',
  },
  'gangdong-clinics': {
    file: 'gangdong-OA-12646.csv',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-12646/S/1/datasetView.do',
    publisher: 'Gangdong-gu health centre, Seoul', title: '관내 외국어 지원 의료기관 현황 (medical institutions with foreign-language support)',
    licence: '공공누리 1유형 : 출처표시 (상업적 이용 및 변경 가능)', asOf: '2025-05-22',
    get: { kind: 'seoul-sheet', infId: 'OA-12646' },
    pageNote: 'Some of these are on the list of clinics and hospitals with foreign-language support that the ' +
      'Gangdong-gu health centre publishes through Seoul\'s open data portal, last updated 22 May 2025. The ' +
      'district compiled the list; it is not a report each clinic is required to make.',
  },
  'gangdong-pharmacies': {
    file: 'gangdong-OA-12645.csv',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-12645/S/1/datasetView.do',
    publisher: 'Gangdong-gu health centre, Seoul', title: '관내 외국어 지원 약국 현황 (pharmacies with foreign-language support)',
    licence: '공공누리 1유형 : 출처표시 (상업적 이용 및 변경 가능)', asOf: '2025-05-22',
    get: { kind: 'seoul-sheet', infId: 'OA-12645' },
    pageNote: 'Some of these are on the list of pharmacies with foreign-language support that the Gangdong-gu ' +
      'health centre publishes through Seoul\'s open data portal, last updated 22 May 2025. The district ' +
      'compiled the list; it is not a report each pharmacy is required to make.',
  },
  'yongsan': {
    file: 'yongsan-3077892.csv',
    sourceUrl: 'https://www.data.go.kr/data/3077892/fileData.do',
    publisher: 'Yongsan-gu, Seoul', title: '외국어가능의료기관및약국명단 (clinics and pharmacies that can use a foreign language)',
    licence: '이용허락범위 제한 없음', asOf: '2026-03-11',
    get: { kind: 'datagokr', id: '3077892' },
    pageNote: 'Some of these are on the list of clinics and pharmacies that can serve patients in a foreign ' +
      'language, published by Yongsan-gu in Seoul on Korea\'s public data portal and dated 11 March 2026. The ' +
      'district compiled the list; it is not a report each clinic is required to make.',
  },
  'seocho-pharmacies': {
    file: 'seocho-15141931.csv',
    sourceUrl: 'https://www.data.go.kr/data/15141931/fileData.do',
    publisher: 'Seocho-gu, Seoul', title: '외국어가능약국 (pharmacies that can use a foreign language)',
    licence: '공공저작물 : 출처표시 (제 1유형)', asOf: '2026-02-09',
    get: { kind: 'datagokr', id: '15141931' },
    pageNote: 'Some of these are on the list of pharmacies that can serve customers in a foreign language, ' +
      'published by Seocho-gu in Seoul on Korea\'s public data portal and dated 9 February 2026. The district ' +
      'compiled the list; it is not a report each pharmacy is required to make.',
  },
  'daegu': {
    file: 'daegu-3044301.hwp',
    sourceUrl: 'https://www.data.go.kr/data/3044301/fileData.do',
    publisher: 'Daegu Metropolitan City', title: '외국인 환자와 언어소통 가능한 의료기관 (medical institutions with foreign-language speaking staff)',
    licence: '이용허락범위 제한 없음', asOf: '2025-06-12',
    // The data.go.kr entry links to a daegu.go.kr board post that has since been deleted; the
    // attachment itself (외국인진료병원(25.6.12.).hwp) is still served at this address.
    get: { kind: 'url', url: 'https://www.daegu.go.kr/icms/cmm/fms/FileDown.do?atchFileId=FILE_000000000612915&fileSn=0' },
    pageNote: 'Some of these are on the list of medical institutions with foreign-language speaking staff that ' +
      'Daegu Metropolitan City publishes as open data, dated 12 June 2025. The city compiled the list; it is ' +
      'not a report each clinic is required to make.',
  },
  'khidi': {
    file: 'khidi-15152195.csv', file2: 'khidi-15152186.csv',
    sourceUrl: 'https://www.data.go.kr/data/15152195/fileData.do',
    publisher: 'Korea Health Industry Development Institute (Medical Korea)', title: '외국인 자주 찾는 병원 언어종류 (languages of hospitals foreigners often visit)',
    licence: '이용허락범위 제한 없음', asOf: '2025-09-24',
    get: { kind: 'datagokr', id: '15152195' }, get2: { kind: 'datagokr', id: '15152186' },
    pageNote: 'Some of these are on Medical Korea, the portal of the Korea Health Industry Development Institute, ' +
      'a government agency, which publishes the languages each hospital on its list of those foreign patients ' +
      'often visit offers, as open data dated 24 September 2025. It is the agency\'s list, not a report each ' +
      'hospital is required to make.',
  },
};

// ---- download -----------------------------------------------------------------
async function req(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(55000) });
  if (r.status !== 200) throw new Error(`${r.status} ${url}`);
  return r;
}
const form = (o) => ({ method: 'POST', body: new URLSearchParams(o).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
async function download(g) {
  if (g.kind === 'url') return Buffer.from(await (await req(g.url)).arrayBuffer());
  if (g.kind === 'datagokr') {
    // The file id changes with each re-upload, so it is read from the dataset page every time.
    const page = await (await req(`https://www.data.go.kr/data/${g.id}/fileData.do`)).text();
    const m = page.match(/fileDownload\.do\?atchFileId=(FILE_\d+)&(?:amp;)?fileDetailSn=(\d+)/);
    if (!m) throw new Error(`no file link on data.go.kr ${g.id}`);
    return Buffer.from(await (await req(`https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=${m[2]}&insertDataPrcus=N`)).arrayBuffer());
  }
  const referer = `https://data.seoul.go.kr/dataList/${g.infId}/${g.kind === 'seoul-file' ? 'F' : 'S'}/1/datasetView.do`;
  if (g.kind === 'seoul-file') {
    const page = await (await req(referer)).text();
    const seq = (page.match(/downloadFile\('(\d+)'\)/) || [])[1] || g.seq;
    return Buffer.from(await (await req('https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?&useCache=false',
      { ...form({ infId: g.infId, seqNo: '', seq, infSeq: g.infSeq, urlNm: '' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: referer } })).arrayBuffer());
  }
  if (g.kind === 'seoul-sheet') {
    return Buffer.from(await (await req('https://datafile.seoul.go.kr/bigfile/iot/sheet/csv/download.do',
      { ...form({ srvType: 'S', infId: g.infId, serviceKind: '1', pageNo: '1', ssUserId: 'SAMPLE_VIEW', strWhere: '', strOrderby: '' }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: referer } })).arrayBuffer());
  }
  throw new Error('unknown source kind ' + g.kind);
}
async function fetchAll() {
  fs.mkdirSync(FILES, { recursive: true });
  for (const [key, d] of Object.entries(DATASETS)) {
    for (const [file, g] of [[d.file, d.get], [d.file2, d.get2]]) {
      if (!file) continue;
      const f = path.join(FILES, file);
      if (fs.existsSync(f) && !has('--force')) { console.log(`${key}: ${file} cached`); continue; }
      try {
        const b = await download(g);
        if (b.length < 200) throw new Error('file too small: ' + b.length + ' bytes');
        fs.writeFileSync(f, b);
        console.log(`${key}: ${file} ${b.length} bytes`);
      } catch (e) { console.log(`${key}: ${file} FAILED ${e.message}`); }
    }
  }
}

// ---- file readers ---------------------------------------------------------------
// CSV with quoted fields that may hold commas and newlines; UTF-8 or EUC-KR (data.go.kr serves both).
function decodeText(b) {
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.slice(3);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('euc-kr').decode(b); }
}
function parseCsv(t) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 1; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.map((r) => r.map((x) => x.trim()));
}
const readCsv = (file) => parseCsv(decodeText(fs.readFileSync(path.join(FILES, file))));

// xlsx: a zip of XML. No package in node_modules reads it, and one sheet of strings needs very little.
function unzip(buf) {
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e -= 1;
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = {};
  for (let i = 0; i < n; i += 1) {
    const method = buf.readUInt16LE(p + 10); const csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28); const xl = buf.readUInt16LE(p + 30); const cl = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42); const name = buf.slice(p + 46, p + 46 + nl).toString();
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const data = buf.slice(start, start + csize);
    out[name] = method === 8 ? zlib.inflateRawSync(data) : data;
    p += 46 + nl + xl + cl;
  }
  return out;
}
const xmlText = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d))).replace(/&amp;/g, '&');
function readXlsx(file) {
  const z = unzip(fs.readFileSync(path.join(FILES, file)));
  const ts = (x) => xmlText([...x.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));
  const ss = z['xl/sharedStrings.xml'] ? [...z['xl/sharedStrings.xml'].toString().matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => ts(m[1])) : [];
  const rows = [];
  for (const r of z['xl/worksheets/sheet1.xml'].toString().matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = [...c[1]].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const t = (c[2].match(/t="(\w+)"/) || [])[1]; const body = c[3] || '';
      let v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      if (t === 's') v = ss[Number(v)]; else if (t === 'inlineStr') v = ts(body); else if (v != null) v = xmlText(v);
      row[col] = v == null ? '' : String(v).trim();
    }
    rows.push(Array.from(row, (x) => (x == null ? '' : x)));
  }
  return rows;
}

// HWP 5.0 (Hancom): an OLE compound file whose BodyText/Section streams are deflated records. Only
// what a table of text needs is read: TABLE (77) gives the grid, each cell is a LIST_HEADER (72)
// carrying its column and row, and PARA_TEXT (67) is UTF-16 with inline controls to skip.
function readCfb(buf) {
  const ss = 1 << buf.readUInt16LE(30); const mss = 1 << buf.readUInt16LE(32);
  const nFat = buf.readUInt32LE(44); const miniCut = buf.readUInt32LE(56); const miniFatStart = buf.readUInt32LE(60);
  let dif = buf.readUInt32LE(68);
  const sec = (i) => buf.slice(512 + i * ss, 512 + (i + 1) * ss);
  const fatSecs = [];
  for (let i = 0; i < 109 && fatSecs.length < nFat; i += 1) fatSecs.push(buf.readUInt32LE(76 + i * 4));
  while (fatSecs.length < nFat && dif < 0xfffffffa) {
    const d = sec(dif);
    for (let i = 0; i < ss / 4 - 1 && fatSecs.length < nFat; i += 1) fatSecs.push(d.readUInt32LE(i * 4));
    dif = d.readUInt32LE(ss - 4);
  }
  const fat = [];
  fatSecs.forEach((s) => { const d = sec(s); for (let i = 0; i < ss / 4; i += 1) fat.push(d.readUInt32LE(i * 4)); });
  const chain = (s) => { const out = []; while (s < 0xfffffffa && out.length < 1e6) { out.push(sec(s)); s = fat[s]; } return Buffer.concat(out); };
  const dir = chain(buf.readUInt32LE(48)); const ents = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nl = dir.readUInt16LE(o + 64);
    ents.push(nl ? { name: dir.slice(o, o + nl - 2).toString('utf16le'), type: dir[o + 66], left: dir.readUInt32LE(o + 68),
      right: dir.readUInt32LE(o + 72), child: dir.readUInt32LE(o + 76), start: dir.readUInt32LE(o + 116), size: dir.readUInt32LE(o + 120) } : null);
  }
  const mini = chain(ents[0].start); const minifat = [];
  if (miniFatStart < 0xfffffffa) { const m = chain(miniFatStart); for (let i = 0; i < m.length / 4; i += 1) minifat.push(m.readUInt32LE(i * 4)); }
  const read = (e) => {
    if (e.size >= miniCut) return chain(e.start).slice(0, e.size);
    const out = []; let s = e.start;
    while (s < 0xfffffffa && out.length * mss < e.size) { out.push(mini.slice(s * mss, (s + 1) * mss)); s = minifat[s]; }
    return Buffer.concat(out).slice(0, e.size);
  };
  const files = {};
  const walk = (i, pre) => {
    if (i >= 0xfffffffa || !ents[i]) return;
    const e = ents[i]; walk(e.left, pre); walk(e.right, pre);
    if (e.type === 2) files[pre + e.name] = read(e); else if (e.type === 1) walk(e.child, pre + e.name + '/');
  };
  walk(ents[0].child, '');
  return files;
}
function readHwpTables(file) {
  const f = readCfb(fs.readFileSync(path.join(FILES, file)));
  const deflated = f.FileHeader.readUInt32LE(36) & 1;
  const secs = Object.keys(f).filter((k) => /^BodyText\/Section\d+$/.test(k)).sort((a, b) => Number(a.match(/\d+$/)) - Number(b.match(/\d+$/)));
  const tables = []; let tb = null; let cell = null; let cellLevel = -1;
  for (const s of secs) {
    const b = deflated ? zlib.inflateRawSync(f[s]) : f[s];
    let o = 0;
    while (o + 4 <= b.length) {
      const h = b.readUInt32LE(o); o += 4;
      const tag = h & 0x3ff; const level = (h >>> 10) & 0x3ff; let size = h >>> 20;
      if (size === 0xfff) { size = b.readUInt32LE(o); o += 4; }
      const d = b.slice(o, o + size); o += size;
      // A cell's paragraphs sit at the list header's own level, so only a shallower record ends it.
      if (cell && level < cellLevel) cell = null;
      if (tag === 77) { tb = { rows: d.readUInt16LE(4), cols: d.readUInt16LE(6), cells: [], level }; tables.push(tb); }
      else if (tag === 72 && tb && level === tb.level) { cell = { col: d.readUInt16LE(8), row: d.readUInt16LE(10), text: [] }; cellLevel = level; tb.cells.push(cell); }
      else if (tag === 67 && cell) {
        let t = '';
        for (let i = 0; i + 1 < d.length;) {
          const c = d.readUInt16LE(i);
          if (c >= 32) { t += String.fromCharCode(c); i += 2; }
          else if (c === 0 || c === 10 || c === 13 || c >= 24) { if (c === 10 || c === 13) t += ' '; i += 2; }
          else i += 16; // extended and inline controls take eight code units
        }
        cell.text.push(t.trim());
      }
    }
  }
  return tables.map((t) => {
    const grid = Array.from({ length: t.rows }, () => Array(t.cols).fill(''));
    t.cells.forEach((c) => { if (grid[c.row]) grid[c.row][c.col] = c.text.filter(Boolean).join(' ').replace(/\s+/g, ' '); });
    return grid;
  });
}

// ---- mapping --------------------------------------------------------------------
const LANG = {
  영어: 'en', 중국어: 'zh', 일본어: 'ja', 일어: 'ja', 러시아어: 'ru', 스페인어: 'es', 불어: 'fr', 프랑스어: 'fr',
  독일어: 'de', 스웨덴어: 'sv', 베트남어: 'vi', 아랍어: 'ar', 태국어: 'th', 인도네시아어: 'id', 포르투갈어: 'pt',
  이탈리아어: 'it', 타갈로그어: 'tl', 필리핀어: 'tl', 네팔어: 'ne', 힌디어: 'hi', 터키어: 'tr', 우크라이나어: 'uk', 말레이어: 'ms',
  english: 'en', chinese: 'zh', japanese: 'ja', russian: 'ru', vietnamese: 'vi', arabic: 'ar', spanish: 'es',
  french: 'fr', german: 'de', turkish: 'tr', thai: 'th', indonesian: 'id',
};
// Named by a row, but not a language the directory lists, or not a language at all.
const NOT_LISTED = new Set(['몽골어', '우즈베키스탄어', '우즈벡어', 'mongolian', 'esperanto', '한국어', 'korean']);
const NOTHING = new Set(['기타', 'etc', '']);

// Returns { codes, dropped, hedged, unknown } for a free-text language cell.
function langsOf(value) {
  const out = { codes: [], dropped: [], hedged: [], unknown: [] };
  const v = String(value || '').replace(/\s+/g, ' ').trim();
  const hedged = [...v.matchAll(/([가-힣A-Za-z]+)\s*\(([^)]*)\)/g)];
  hedged.forEach((m) => out.hedged.push(m[1] + '(' + m[2] + ')'));
  const rest = v.replace(/([가-힣A-Za-z]+)\s*\(([^)]*)\)/g, ' ');
  for (const raw of rest.split(/[,/·、\s]+/)) {
    const w = raw.trim(); const k = /^[A-Za-z]+$/.test(w) ? w.toLowerCase() : w;
    if (NOTHING.has(k)) continue;
    if (LANG[k]) out.codes.push(LANG[k]);
    else if (NOT_LISTED.has(k)) out.dropped.push(w);
    else out.unknown.push(w);
  }
  out.codes = [...new Set(out.codes)];
  return out;
}

// Districts, so the card can say where. 중구, 동구, 서구, 남구 and 북구 exist in several cities and mean
// the same words in each.
const GU = {
  종로구: 'Jongno-gu', 중구: 'Jung-gu', 용산구: 'Yongsan-gu', 성동구: 'Seongdong-gu', 광진구: 'Gwangjin-gu', 동대문구: 'Dongdaemun-gu',
  중랑구: 'Jungnang-gu', 성북구: 'Seongbuk-gu', 강북구: 'Gangbuk-gu', 도봉구: 'Dobong-gu', 노원구: 'Nowon-gu', 은평구: 'Eunpyeong-gu',
  서대문구: 'Seodaemun-gu', 마포구: 'Mapo-gu', 양천구: 'Yangcheon-gu', 강서구: 'Gangseo-gu', 구로구: 'Guro-gu', 금천구: 'Geumcheon-gu',
  영등포구: 'Yeongdeungpo-gu', 동작구: 'Dongjak-gu', 관악구: 'Gwanak-gu', 서초구: 'Seocho-gu', 강남구: 'Gangnam-gu', 송파구: 'Songpa-gu',
  강동구: 'Gangdong-gu', 서구: 'Seo-gu', 동구: 'Dong-gu', 남구: 'Nam-gu', 북구: 'Buk-gu', 영도구: 'Yeongdo-gu', 부산진구: 'Busanjin-gu',
  동래구: 'Dongnae-gu', 해운대구: 'Haeundae-gu', 사하구: 'Saha-gu', 금정구: 'Geumjeong-gu', 연제구: 'Yeonje-gu', 수영구: 'Suyeong-gu',
  사상구: 'Sasang-gu', 기장군: 'Gijang-gun', 수성구: 'Suseong-gu', 달서구: 'Dalseo-gu', 달성군: 'Dalseong-gun', 군위군: 'Gunwi-gun',
  광산구: 'Gwangsan-gu', 제주시: 'Jeju-si', 서귀포시: 'Seogwipo-si',
};
const CITY_KO = [[/^(서울특별시|서울시|서울)\s/, 'seoul'], [/^(부산광역시|부산시|부산)\s/, 'busan'], [/^(대구광역시|대구시|대구)\s/, 'daegu'],
  [/^(광주광역시|광주시|광주)\s?(동구|서구|남구|북구|광산구)/, 'gwangju'], [/^(제주특별자치도|제주도|제주)\s/, 'jeju']];
function placeKo(addr) {
  const a = String(addr || '').trim();
  const city = (CITY_KO.find(([re]) => re.test(a)) || [])[1] || null;
  const gu = (a.match(/(?:^|\s)([가-힣]{1,4}(?:구|군)|제주시|서귀포시)(?=\s|$)/) || [])[1];
  return { city, area: gu && GU[gu] ? GU[gu] : undefined };
}
// KHIDI's addresses are English, and its region field is a code.
const KHIDI_REGION = { SEOUL: 'seoul', BUSAN: 'busan', DAEGU: 'daegu', GWANGJU: 'gwangju', JEJU_DO: 'jeju' };
function placeEn(addr) {
  const m = String(addr || '').match(/\b([A-Za-z]+)[- ](gu|gun|si)\b/i); // "Mangu-ro" is a road, not Man-gu
  if (!m) return undefined;
  const w = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  return /^(jeju|seogwipo)$/i.test(m[1]) ? w + '-si' : w + '-' + m[2].toLowerCase();
}

// The lists name the institution's type or its departments; a dental clinic is a dentist, a
// pharmacy a pharmacy, and everything else (hospitals, clinics, Korean-medicine clinics) a doctor,
// which is what the Japanese reader does with ophthalmologists and psychiatrists too.
function categoryOf(nameKo, kind, depts) {
  if (/약국/.test(kind || '') || /약국$/.test(nameKo || '')) return 'pharmacy';
  if (/치과/.test(kind || '') || /치과(의원|병원)?/.test(nameKo || '') || /^치과$|^dental/i.test(String(depts || '').trim())) return 'dentist';
  return 'doctor';
}
const isHospital = (nameKo, kind) => /종합병원|^병원$|HOSPITAL/.test(kind || '') || (/병원/.test(nameKo || '') && !/의원$/.test(nameKo || ''));
const koreanMedicine = (nameKo, kind, depts) => /한의원|한방병원|KOREAN_MEDICINE/.test((nameKo || '') + (kind || '')) || /한방/.test(depts || '');

// Seoul's pharmacy list carries a remark column (비고). Each remark it has is read here; any other
// remark refuses the row until someone reads it.
const REMARKS = [
  [/^해당약국 '?\d+년 \d+월 추가$/, () => ({})], // "added in <month>": a date, not a hedge
  [/^오전시간 한정$/, () => ({ note: 'Foreign languages in the morning only.' })],
  [/^전산원 상담만 가능$/, () => ({ refuse: 'only the billing clerk speaks it' })],
  [/^(\S+?)는 (간단회화만|파트타임 약사님만) 가능$/, (m) => ({ drop: m[1] })],
];

// ---- read each dataset into candidate rows ---------------------------------------
function candidates(refused, tally) {
  const rows = [];
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  const push = (ds, o) => {
    const d = DATASETS[ds];
    const L = langsOf(o.langText);
    L.codes = L.codes.filter((c) => !(o.dropLangs || []).includes(c));
    const base = { dataset: ds, nameKo: o.nameKo, name: o.name || o.nameKo };
    if (L.unknown.length) { refused.push({ ...base, why: 'unmapped language ' + L.unknown.join(',') }); count('unmapped language'); return; }
    if (!o.city) { refused.push({ ...base, address: o.address, why: 'address not in our five cities' }); count('not in our cities'); return; }
    if (o.refuse) { refused.push({ ...base, why: o.refuse }); count('refused by remark'); return; }
    if (L.hedged.length) refused.push({ ...base, why: 'qualified language not published: ' + L.hedged.join(', '), kept: L.codes });
    if (L.dropped.length) count('language not in the directory dropped (' + L.dropped.join(',') + ')');
    if (!L.codes.length) { refused.push({ ...base, why: 'no publishable language' + (L.dropped.length ? ' (only ' + L.dropped.join(',') + ')' : '') }); count('no publishable language'); return; }
    if (L.codes.length > MAX_LANGS) { refused.push({ ...base, why: L.codes.length + ' languages' }); count('more than ' + MAX_LANGS + ' languages'); return; }
    const f = path.join(FILES, d.file);
    rows.push({
      id: ds + ':' + o.rowId,
      city: o.city,
      name: o.name || o.nameKo,
      nameKo: o.nameKo,
      category: o.category,
      languages: L.codes,
      url: o.url || undefined,
      sourceUrl: d.sourceUrl,
      evidence: 'official',
      checked: fs.statSync(f).mtime.toISOString().slice(0, 10),
      area: o.area,
      address: o.address,
      phone: o.phone || undefined,
      hospital: o.hospital || undefined,
      koreanMedicine: o.koreanMedicine || undefined,
      note: o.note || undefined,
      asOf: o.asOf || d.asOf,
      dataset: ds,
    });
  };

  // Seoul pharmacies: a title block, a two-row header, then 연번 자치구 약국이름 주소 전화번호 영어 중국어 일본어 기타 비고.
  {
    const R = readXlsx(DATASETS['seoul-pharmacies'].file);
    const h = R.findIndex((r) => r[0] === '연번');
    const sub = R[h + 1];
    const col = (w) => sub.indexOf(w);
    for (const r of R.slice(h + 2)) {
      if (!/^\d+$/.test(r[0] || '')) continue;
      const langs = ['영어', '중국어', '일본어'].filter((w) => /[○O◯●]/.test(r[col(w)] || ''));
      if (r[col('기타')]) langs.push(r[col('기타')]);
      const remark = [r[9], r[10]].filter(Boolean).join(' ').trim();
      let extra = {};
      if (remark) {
        const hit = REMARKS.map(([re, fn]) => { const m = remark.match(re); return m ? fn(m) : null; }).find(Boolean);
        extra = hit || { refuse: 'unknown remark: ' + remark };
      }
      const place = placeKo(r[3]);
      const added = remark.match(/'?(\d+)년 (\d+)월 추가/);
      push('seoul-pharmacies', {
        rowId: r[0], nameKo: r[2], address: r[3], phone: r[4], city: place.city, area: GU[r[1]] || place.area,
        category: 'pharmacy', langText: langs.join(','), note: extra.note, refuse: extra.refuse,
        dropLangs: extra.drop ? langsOf(extra.drop).codes : [],
        asOf: added ? `20${added[1].slice(-2)}-${added[2].padStart(2, '0')}` : undefined,
      });
    }
  }

  // Gangdong: 시설명 소재지 전화번호 비고(departments) 외국어 / 시설명 전화번호 비고(languages) 소재지.
  for (const [ds, cat] of [['gangdong-clinics', null], ['gangdong-pharmacies', 'pharmacy']]) {
    const R = readCsv(DATASETS[ds].file); const H = R[0]; const ix = (w) => H.indexOf(w);
    R.slice(1).forEach((r, i) => {
      if (!r[ix('시설명')]) return;
      // The district's own list: most addresses start at the dong, with no city or district named.
      const nameKo = r[ix('시설명')]; const addr = r[ix('소재지')]; const p = placeKo(addr);
      const place = p.city ? p : { city: 'seoul', area: 'Gangdong-gu' };
      const depts = cat ? '' : r[ix('비고')];
      push(ds, {
        rowId: i + 1, nameKo, address: addr, phone: r[ix('전화번호')], city: place.city, area: place.area,
        category: cat || categoryOf(nameKo, '', depts), langText: cat ? r[ix('비고')] : r[ix('외국어')],
        hospital: !cat && isHospital(nameKo), koreanMedicine: !cat && koreanMedicine(nameKo, '', depts),
      });
    });
  }

  // Yongsan: 연번 종별 명칭 주소 전화번호 진료과목 외국어. The addresses carry directions in brackets.
  {
    const R = readCsv(DATASETS.yongsan.file); const H = R[0]; const ix = (w) => H.indexOf(w);
    R.slice(1).forEach((r) => {
      if (!r[ix('명칭')]) return;
      const kind = r[ix('종별')]; const nameKo = r[ix('명칭')]; const addr = r[ix('주소')].replace(/\s+/g, ' ');
      const place = placeKo(addr);
      push('yongsan', {
        rowId: r[ix('연번')], nameKo, address: addr, phone: r[ix('전화번호')], city: place.city, area: place.area,
        category: categoryOf(nameKo, kind, r[ix('진료과목')]), langText: r[ix('외국어')],
        hospital: /병원/.test(kind) && kind !== '치과병원' ? true : isHospital(nameKo, kind), koreanMedicine: koreanMedicine(nameKo, kind),
      });
    });
  }

  // Seocho pharmacies: 연번 명칭 도로명주소 지번주소 위도 경도 전화번호 외국어 데이터기준일자.
  {
    const R = readCsv(DATASETS['seocho-pharmacies'].file); const H = R[0]; const ix = (w) => H.indexOf(w);
    R.slice(1).forEach((r) => {
      if (!r[ix('명칭')]) return;
      const addr = r[ix('도로명주소')]; const place = placeKo(addr);
      push('seocho-pharmacies', {
        rowId: r[ix('연번')], nameKo: r[ix('명칭')], address: addr, phone: r[ix('전화번호')], city: place.city, area: place.area,
        category: 'pharmacy', langText: r[ix('외국어')], asOf: r[ix('데이터기준일자')] || undefined,
      });
    });
  }

  // Daegu (HWP): a title row, a header row, then Korean name, English name, Korean address, English
  // address, Korean departments, English departments, phone, languages.
  {
    const T = readHwpTables(DATASETS.daegu.file).find((t) => t.some((r) => /LANGUAGE/.test(r.join(' '))));
    const h = T.findIndex((r) => /LANGUAGE/.test(r.join(' ')));
    T.slice(h + 1).forEach((r, i) => {
      if (!r[0]) return;
      const [nameKo, nameEn, addrKo, , deptKo, , phone, langs] = r;
      const place = placeKo(addrKo);
      push('daegu', {
        rowId: i + 1, nameKo, name: (nameEn || nameKo).replace(/\s+/g, ' '), address: addrKo, phone: phone ? '053-' + phone : undefined,
        city: place.city, area: place.area, category: categoryOf(nameKo, '', deptKo), langText: langs,
        hospital: isHospital(nameKo, deptKo === '종합병원' ? '종합병원' : ''), koreanMedicine: koreanMedicine(nameKo, '', deptKo),
      });
    });
  }

  // KHIDI (Medical Korea): the language file keys on the hospital number; the hospital file gives
  // the name, region, address and website. Only the English site's entries (사이트언어 EN) are read;
  // the JP/CN/RU rows are the same facts translated. 사용여부 N marks an entry the portal no longer
  // shows (several are older duplicates of a Y entry), so only Y is read.
  {
    const L = readCsv(DATASETS.khidi.file); const LH = L[0];
    const byId = {};
    L.slice(1).filter((r) => r[LH.indexOf('사이트언어')] === 'EN').forEach((r) => {
      const id = r[LH.indexOf('자주찾는병원번호')];
      (byId[id] = byId[id] || []).push(r[LH.indexOf('언어')]);
    });
    const P = readCsv(DATASETS.khidi.file2); const PH = P[0]; const ix = (w) => PH.indexOf(w);
    P.slice(1).forEach((r) => {
      if (r[ix('콘텐츠타입')] !== 'MOST_VISITED_MEDICAL_INSTITUTE') return;
      if (r[ix('사용여부')] !== 'Y') { count('KHIDI entry not in use (사용여부 N)'); return; }
      const id = r[ix('자주찾는병원번호')];
      const city = KHIDI_REGION[r[ix('지역')]] || null;
      if (!byId[id]) { if (city) refused.push({ dataset: 'khidi', name: r[ix('병원명')], why: 'no language listed' }); count('KHIDI hospital without languages'); return; }
      const kind = r[ix('병원구분')]; const addr = r[ix('주소1')].replace(/^\?/, '').trim();
      const web = r[ix('웹사이트url')].trim();
      push('khidi', {
        rowId: id, nameKo: undefined, name: r[ix('병원명')].replace(/\s+/g, ' ').trim(), address: addr, phone: r[ix('전화번호')],
        city, area: placeEn(addr), category: kind === 'DENTAL_HOSPITAL' ? 'dentist' : 'doctor', langText: byId[id].join(','),
        // Most websites are given without a scheme ("www.andonghospital.co.kr/english_new/main.asp").
        url: /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(web) ? (/^https?:/i.test(web) ? web : 'http://' + web) : undefined,
        hospital: /GENERAL_HOSPITAL|DENTAL_HOSPITAL/.test(kind) || /Hospital/.test(r[ix('병원명')]), koreanMedicine: kind === 'KOREAN_MEDICINE_HOSPITAL',
      });
    });
  }
  return rows;
}

// ---- propose ------------------------------------------------------------------------
const key = (s) => String(s || '').normalize('NFKC').toLowerCase()
  .replace(/\([^)]*\)|（[^）]*）/g, '').replace(/^(재단법인|의료법인|학교법인|\(재\)|\(의\))\s*/, '')
  .replace(/\b(the|of|and)\b/g, '').replace(/[^a-z0-9가-힣]+/g, '');
const digits = (p) => String(p || '').replace(/\D/g, '').slice(-7);
// A Korean-only list and KHIDI's English-only one name the same hospital in two scripts, with
// different phone numbers, so neither key above can see it. Found by comparing each KHIDI hospital
// with the Korean-named hospitals in its own district (2026-09-24).
const SAME_AS = {
  '순천향대학교 부속 서울병원': 'SoonChunHyang University Hospital Seoul',
  강동경희대학교의대병원: 'KUIMS Kyung Hee University Hospital at Gangdong',
};

function propose() {
  const refused = []; const tally = {};
  const all = candidates(refused, tally);
  // Newest list first, so the first row seen for an institution is the one kept.
  const order = (r) => r.asOf || DATASETS[r.dataset].asOf;
  all.sort((a, b) => order(b).localeCompare(order(a)));
  // The same name in two districts is two businesses (Seoul has an 열린약국 in several), so a name
  // matches only within one district, or where a list gives no district; a phone number matches
  // within a city and category.
  const kept = []; const byKey = new Map(); const conflicts = [];
  for (const r of all) {
    const names = [...new Set([r.nameKo, r.name, SAME_AS[r.nameKo]].filter(Boolean).map(key))];
    const keys = names.flatMap((n) => [r.city + '|' + n + '|' + (r.area || '*'), r.city + '|' + n + '|*']);
    if (r.phone && digits(r.phone).length >= 7) keys.push(r.city + '|' + r.category + '|' + digits(r.phone));
    const hit = keys.map((k) => byKey.get(k)).find(Boolean);
    if (hit) {
      (hit.alsoListedBy = hit.alsoListedBy || []).push({ dataset: r.dataset, languages: r.languages });
      if (hit.languages.join() !== r.languages.join()) conflicts.push(`${hit.name} [${hit.dataset} ${hit.languages}] vs [${r.dataset} ${r.languages}]`);
      tally['same institution on an older list'] = (tally['same institution on an older list'] || 0) + 1;
      continue;
    }
    kept.push(r);
    names.forEach((n) => { byKey.set(r.city + '|' + n + '|' + (r.area || '*'), r); if (!r.area) byKey.set(r.city + '|' + n + '|*', r); });
    if (r.phone && digits(r.phone).length >= 7) byKey.set(r.city + '|' + r.category + '|' + digits(r.phone), r);
  }
  const pageNotes = Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, d.pageNote]));
  const datasets = Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, { sourceUrl: d.sourceUrl, publisher: d.publisher, title: d.title, licence: d.licence, asOf: d.asOf }]));
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), datasets, pageNotes, rows: kept }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify({ refused, conflicts }, null, 1));
  tally.proposed = kept.length;
  console.log(tally);
  const by = {}; const byLang = {}; const byDs = {};
  kept.forEach((r) => {
    by[r.city + ' ' + r.category] = (by[r.city + ' ' + r.category] || 0) + 1;
    byDs[r.dataset] = (byDs[r.dataset] || 0) + 1;
    r.languages.forEach((l) => { byLang[r.city + ' ' + l] = (byLang[r.city + ' ' + l] || 0) + 1; });
  });
  console.log(by); console.log(byDs); console.log(byLang);
  if (conflicts.length) { console.log(`${conflicts.length} institutions whose languages differ between lists (newest kept):`); conflicts.forEach((c) => console.log('  ' + c)); }
}

module.exports = { langsOf, placeKo, placeEn, categoryOf, readHwpTables, readXlsx, parseCsv, DATASETS };

if (require.main === module) {
  (async () => {
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_korea_open_data.cjs <fetch|propose> --cache <dir> [--force]');
    process.exit(2);
  })();
}

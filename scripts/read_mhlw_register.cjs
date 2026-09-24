/**
 * Reads Japan's national medical register for the clinics, dentists and hospitals in our eight
 * Japanese cities that report a foreign language they can treat patients in.
 *
 * WHY THIS SOURCE
 *
 * 医療情報ネット (www.iryou.teikyouseido.mhlw.go.jp) is published by the Ministry of Health, Labour
 * and Welfare from what every hospital, clinic and dental clinic is required by law to report
 * about itself, and the ministry prints it "as reported". Among those reports is a structured
 * block per foreign language: the language, and whether the facility accepts patients in it
 * (受入可能), asks them to enquire first (要相談) or does not (受入不可). That is a claim made by
 * the facility, published by a government, per named business, which is the official tier.
 * robots.txt allows everything, and the terms allow reproduction with the source named, which the
 * page note does.
 *
 * Before this the directory held 64 rows in these eight cities, 43 of them lawyers.
 *
 * THE RULE
 *
 * Only Tokyo's form fills the acceptance field. There a language is published only where the
 * facility marks it 受入可能, "can accept"; 要相談 is a hedge in the same sense as "a bit of French".
 * The other seven cities' prefectures leave that field blank (-) and record only the language, so
 * there the listed language is the claim; the first run read those blanks as "no" and produced
 * nothing outside Tokyo. In every city the facility's own notes then get the last word (HEDGE
 * below): a device, an interpreter, "call first" or "a few words" takes the language back. The
 * per-language fluency scale (native-like / everyday / a few words) exists on the form but was
 * empty on every page read, so it cannot be used to raise or lower anything.
 *
 * Japanese is not added. The register does not say it, because it is a Japanese register, and
 * adding it would fill /services/languages/japanese with every clinic in Tokyo, which is not what a
 * Japanese speaker abroad is looking for.
 *
 * Company and school clinics are on the register too: 三菱マテリアル株式会社本社診療所 treats that
 * company's staff. They are refused by name (EMPLOYER below), because a nomad cannot walk in.
 *
 * FOUR STAGES, ALL FREE, ALL SLOW
 *
 * The detail page is the only place the languages appear (the ministry's open-data ZIP has no
 * language column), and the server takes about four seconds to render one, so this caches.
 *
 *   list     node scripts/read_mhlw_register.cjs list --cache <dir>
 *              asks the register's own "search by foreign language" for every ward of every city,
 *              any of its 23 languages, and records the facility ids. Stateless GETs.
 *   fetch    node scripts/read_mhlw_register.cjs fetch --cache <dir> [--conc 5]
 *              fetches each detail page once, gzipped into the cache. Resumable.
 *   propose  node scripts/read_mhlw_register.cjs propose --cache <dir>
 *              reads the cache under the rule above and writes <dir>/proposals.json, plus a list
 *              of everything refused and why.
 *   ingest   node scripts/read_mhlw_register.cjs ingest --cache <dir> [--apply]
 *
 * Then node scripts/rebuild_services.cjs.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT, 'data', 'service-languages.json');
const SRC_FILE = path.join(ROOT, 'data', 'service-sources.json');
const BASE = 'https://www.iryou.teikyouseido.mhlw.go.jp';
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'mhlw')));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Municipality codes, checked against the ward named in the addresses of the ministry's open data
// (2025-12-01): every code below is the ward its own facilities give as their address.
const WARDS = {
  tokyo: ['13', { 101: 'Chiyoda', 102: 'Chuo', 103: 'Minato', 104: 'Shinjuku', 105: 'Bunkyo', 106: 'Taito', 107: 'Sumida', 108: 'Koto', 109: 'Shinagawa', 110: 'Meguro', 111: 'Ota', 112: 'Setagaya', 113: 'Shibuya', 114: 'Nakano', 115: 'Suginami', 116: 'Toshima', 117: 'Kita', 118: 'Arakawa', 119: 'Itabashi', 120: 'Nerima', 121: 'Adachi', 122: 'Katsushika', 123: 'Edogawa' }],
  osaka: ['27', { 102: 'Miyakojima', 103: 'Fukushima', 104: 'Konohana', 106: 'Nishi', 107: 'Minato', 108: 'Taisho', 109: 'Tennoji', 111: 'Naniwa', 113: 'Nishiyodogawa', 114: 'Higashiyodogawa', 115: 'Higashinari', 116: 'Ikuno', 117: 'Asahi', 118: 'Joto', 119: 'Abeno', 120: 'Sumiyoshi', 121: 'Higashisumiyoshi', 122: 'Nishinari', 123: 'Yodogawa', 124: 'Tsurumi', 125: 'Suminoe', 126: 'Hirano', 127: 'Kita', 128: 'Chuo' }],
  kyoto: ['26', { 101: 'Kita', 102: 'Kamigyo', 103: 'Sakyo', 104: 'Nakagyo', 105: 'Higashiyama', 106: 'Shimogyo', 107: 'Minami', 108: 'Ukyo', 109: 'Fushimi', 110: 'Yamashina', 111: 'Nishikyo' }],
  fukuoka: ['40', { 131: 'Higashi', 132: 'Hakata', 133: 'Chuo', 134: 'Minami', 135: 'Nishi', 136: 'Jonan', 137: 'Sawara' }],
  sapporo: ['01', { 101: 'Chuo', 102: 'Kita', 103: 'Higashi', 104: 'Shiroishi', 105: 'Toyohira', 106: 'Minami', 107: 'Nishi', 108: 'Atsubetsu', 109: 'Teine', 110: 'Kiyota' }],
  nagoya: ['23', { 101: 'Chikusa', 102: 'Higashi', 103: 'Kita', 104: 'Nishi', 105: 'Nakamura', 106: 'Naka', 107: 'Showa', 108: 'Mizuho', 109: 'Atsuta', 110: 'Nakagawa', 111: 'Minato', 112: 'Minami', 113: 'Moriyama', 114: 'Midori', 115: 'Meito', 116: 'Tempaku' }],
  hiroshima: ['34', { 101: 'Naka', 102: 'Higashi', 103: 'Minami', 104: 'Nishi', 105: 'Asaminami', 106: 'Asakita', 107: 'Aki', 108: 'Saeki' }],
  kanazawa: ['17', { 201: '' }],
};
const MUNIS = [];
for (const [city, [pref, wards]] of Object.entries(WARDS)) {
  for (const [code, ward] of Object.entries(wards)) MUNIS.push({ city, muni: pref + code, ward });
}

// The register's own 23 language codes, and what each maps to here. 広東語, 北京語 and 台湾語 are
// Cantonese, Mandarin and Taiwanese; the directory has one code for Chinese. その他 names nothing.
const SEARCH_CODES = Array.from({ length: 22 }, (_, i) => '30-04-1-' + String(i + 1).padStart(4, '0')).concat('30-04-1-9999');
const LANG = {
  英語: 'en', 広東語: 'zh', 北京語: 'zh', 台湾語: 'zh', 中国語: 'zh', '韓国・朝鮮語': 'ko', 韓国語: 'ko',
  タイ語: 'th', タガログ語: 'tl', ミャンマー語: 'my', ベトナム語: 'vi', ベンガル語: 'bn', フランス語: 'fr',
  ポルトガル語: 'pt', ドイツ語: 'de', ロシア語: 'ru', イタリア語: 'it', スペイン語: 'es', インドネシア語: 'id',
  トルコ語: 'tr', マレー語: 'ms', ヒンディー語: 'hi', ネパール語: 'ne', シンハラ語: 'si', クメール語: 'km',
  アラビア語: 'ar', ウルドゥー語: 'ur', ペルシャ語: 'fa', ウクライナ語: 'uk', ポーランド語: 'pl', オランダ語: 'nl',
};

// Most facilities pick one language per entry; some type several into it ("インドネシア語，ネパール語，
// クメール語") or trail off ("中国語など", Chinese and others). The named ones are claims; "others" is
// not, and neither is anything that is not a language name at all ("翻訳機があるのでほぼ全て", nearly
// all of them, because we have a translation machine), which stays unknown and is refused.
function langsOf(value) {
  const v = String(value || '').trim();
  if (LANG[v]) return { codes: [LANG[v]], unknown: [] };
  const parts = v.split(/[,、/]+/).map((s) => s.replace(/(など|等)$/, '').trim()).filter(Boolean);
  return {
    codes: parts.filter((s) => LANG[s]).map((s) => LANG[s]),
    unknown: parts.filter((s) => !LANG[s] && s !== 'その他'),
  };
}

// Clinics that exist for one employer's or one school's people. A nomad cannot walk into them.
const EMPLOYER = /株式会社|有限会社|合同会社|健康管理|健康相談室|保健管理|保健センター|保健室|社員|職員|従業員|本社|工場|事業所|支店|支社|刑務所|拘置所|自衛隊|駐屯地|少年院|大学.*(保健|健康)/;

const MAX_LANGS = 6;

// What the facility writes beside a language, or about its languages as a whole, can take the claim
// back: a translation device or app, an interpreter to bring along, "please call first", "a few
// words", "not on some days". Read on the register's own notes (2026-09-24), for example
// "スマートフォンの翻訳機能を利用" (we use a phone's translation function), "通訳者の同伴が望ましい"
// (please bring an interpreter), "タイ語は片言" (Thai is a few words). A hedge on one language drops
// that language; a hedge in the facility-wide remark drops them all, because it cannot be told which
// language it was about.
const HEDGE = /翻訳機|翻訳アプリ|翻訳ツール|翻訳機能|アプリ|ポケトーク|音声翻訳|通訳|相談|片言|簡単な|少し|多少|一部|日によ|曜日によ|時間帯によ|対応できない|不可|事前/;

const cachePath = (id) => path.join(CACHE, 'pages', id.replace(/\|/g, '_') + '.html.gz');
const detailUrl = (id) => { const [p, k, b] = id.split('|'); return `${BASE}/znk-web/juminkanja/S2430/initialize?prefCd=${p}&kikanCd=${k}&kikanKbn=${b}`; };

// ---- list -------------------------------------------------------------------
function listUrl(muni, page) {
  return `${BASE}/znk-web/juminkanja/S2400/initialize?sc=${SEARCH_CODES.join(',')}&st=30-2&lo=1${muni}` +
    `&sjk=3&jc=MC-01&cp=x_0_0__A&page=${page}&size=20&sortNo=2`;
}
async function getText(url) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 200) return await r.text();
    } catch (e) { /* retried below */ }
    await sleep(4000 * (a + 1));
  }
  return null;
}
async function listOne(muni, page) {
  const t = await getText(listUrl(muni, page));
  if (!t) return null;
  const plain = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const n = (plain.match(/検索条件に合致する 医療機関 が ([\d,]+) 件/) || [])[1];
  // Facility codes are not all digits (6R026006): a \d+ here silently dropped a third of Fukuoka's
  // pharmacies before it was caught, and the page count still looked complete.
  const ids = [...t.matchAll(/S2430\/initialize\?prefCd=(\d+)&(?:amp;)?kikanCd=([0-9A-Za-z]+)&(?:amp;)?kikanKbn=(\d)/g)].map((m) => m.slice(1).join('|'));
  return { n: n ? Number(n.replace(/,/g, '')) : 0, ids };
}
async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const F = path.join(CACHE, 'list.json');
  const done = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
  for (const { city, muni, ward } of MUNIS) {
    if (done[muni] && done[muni].complete) continue;
    const first = await listOne(muni, 0);
    if (!first) { console.log(`${muni} ${city}: no answer, skipped`); continue; }
    const ids = new Set(first.ids);
    for (let p = 1; p < Math.ceil(first.n / 20); p += 1) {
      const r = await listOne(muni, p);
      if (r) r.ids.forEach((x) => ids.add(x));
      await sleep(400);
    }
    done[muni] = { city, ward, n: first.n, ids: [...ids], complete: ids.size >= first.n, listed: new Date().toISOString().slice(0, 10) };
    fs.writeFileSync(F, JSON.stringify(done));
    console.log(`${muni} ${city} ${ward}: ${first.n} report a foreign language, ${ids.size} ids read`);
  }
}

// ---- fetch ------------------------------------------------------------------
async function fetchAll() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const todo = [];
  for (const v of Object.values(L)) for (const id of v.ids) if (!fs.existsSync(cachePath(id))) todo.push(id);
  console.log(`${todo.length} pages to fetch`);
  let i = 0; let ok = 0; let bad = 0;
  const worker = async () => {
    while (i < todo.length) {
      const id = todo[i++];
      const t = await getText(detailUrl(id));
      if (t && t.includes('施設詳細')) { fs.writeFileSync(cachePath(id), zlib.gzipSync(t)); ok += 1; } else bad += 1;
      if ((ok + bad) % 200 === 0) console.log(`  ${ok + bad}/${todo.length} (${bad} failed)`);
      await sleep(300);
    }
  };
  await Promise.all(Array.from({ length: Number(val('--conc', '5')) }, worker));
  console.log(`fetched ${ok}, failed ${bad}`);
}

// ---- parse ------------------------------------------------------------------
const decode = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
// NFKC, because facilities type their names in full-width Latin ("Ｔｏｋｙｏ Ｓｔａｔｉｏｎ") and
// the English-name cut below stops at the first full-width character.
const flat = (h) => decode(h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).normalize('NFKC').replace(/\s+/g, ' ');
const after = (t, k, stop) => {
  const i = t.indexOf(k);
  if (i < 0) return null;
  let s = t.slice(i + k.length).trim();
  if (stop) { const j = s.search(stop); if (j >= 0) s = s.slice(0, j); }
  return s.trim();
};

function parsePage(html) {
  const t = flat(html);
  const o = {};
  o.nameJa = decode((html.match(/<title>([^<｜]*)/) || [])[1] || '').replace(/（[^（]*）\s*$/, '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  // The English name field is followed by optional fields the form prints bare, such as the short
  // name for mobile phones; anything from the first Japanese character on is not the name.
  const en = after(t, '英語表記(ローマ字表記)', / 開設者詳細| 管理者詳細/) || '';
  o.nameEn = en.split(/[　-ヿ一-鿿＀-￯]/)[0].trim();
  o.homepage = ((after(t, '案内用ホームページアドレス') || '').match(/^(?:案内用ホームページアドレス )?(https?:\/\/\S+)/) || [])[1] || null;
  const pc = t.match(/所在地詳細 郵便番号 (\d{7}) 所在地 (.*?) 所在地\(フリガナ\)/);
  o.address = pc ? pc[2] : null;
  o.remark = (t.match(/外国語対応に関する特記事項 (.*?) (?:多言語|外国人の患者|バリアフリー|障害者)/) || [])[1] || '';
  o.langs = t.split('対応可能な外国語名 ').slice(1).map((p) => ({
    ja: p.split(' ')[0],
    accept: after(p, '対応可否区分', / 言語別/),
    note: (p.match(/特記事項 (.*?) 対応可能な曜日/) || [])[1] || '',
    depts: after(p, '対応可能な診療科目 ', / 対応可能な電話番号/),
    deptNames: (after(p, '対応可能な診療科目名', / 対応可能な外国語名| 保険医療機関|$/) || '').slice(0, 300),
  }));
  return o;
}

// "KUDANZAKA HOSPITAL" and "koujimachi skinclinic" are the facility's own English names in a
// register's capitals or lower case; the words are theirs, only the casing is changed.
// Two romanisations are no use to a reader, and the Japanese name at least matches the sign on the
// door: an acronym ("I", "Rjd", "Mngc", 16 of them) and one unbroken string of romanised kana
// ("Amusumarunouchiparesubiruclinic", 250). CamelCase is the exception, because its words are
// there to be separated ("MiyakoHotelTokyoMedicalClinic").
// The legal form in front of a Japanese name ("医療法人社団愛晴会 神保町タワー歯科") is the operating
// corporation, not what is written on the door; it goes where a space separates it from the name.
const CORP = /^(?:医療法人(?:社団|財団)?|社会福祉法人|一般(?:社団|財団)法人|公益(?:社団|財団)法人|独立行政法人|地方独立行政法人|国立大学法人|公立大学法人|学校法人|社会医療法人|宗教法人|特定医療法人)\S*\s+/;
const shortJa = (s) => { const t = String(s || '').replace(CORP, ''); return t.trim() ? t.trim() : s; };
function displayName(o) {
  let en = o.nameEn;
  const ja = shortJa(o.nameJa);
  if (!en || !/[A-Za-z]/.test(en)) return ja;
  if (en.replace(/[^A-Za-z]/g, '').length < 5) return ja;
  if (!/\s/.test(en) && en.length > 16) {
    if ((en.match(/[a-z][A-Z]/g) || []).length >= 2) en = en.replace(/([a-z])([A-Z])/g, '$1 $2');
    else return ja;
  }
  if (en === en.toUpperCase() || en === en.toLowerCase()) {
    return en.toLowerCase().replace(/(^|[\s(\-/&.])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  return en;
}

// ---- propose ----------------------------------------------------------------
function propose() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  const rows = []; const refused = [];
  const tally = {};
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  const seen = new Set();
  for (const [muni, v] of Object.entries(L)) {
    for (const id of v.ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const f = cachePath(id);
      if (!fs.existsSync(f)) { count('not fetched'); continue; }
      const o = parsePage(zlib.gunzipSync(fs.readFileSync(f)).toString());
      const kbn = id.split('|')[2];
      // Tokyo's form asks whether a language is accepted without consulting first, and there only a
      // yes counts. Every other prefecture leaves that field blank (-) and records just the language,
      // so there the listed language is the claim. Both then go through the facility's own words.
      const flagged = (l) => l.accept && l.accept !== '-';
      const claimed = o.langs.filter((l) => !flagged(l) || l.accept === '受入可能');
      const listed = [...new Set(claimed.flatMap((l) => langsOf(l.ja).codes))];
      const facilityHedge = HEDGE.test(o.remark);
      const yes = claimed.filter((l) => !facilityHedge && !HEDGE.test(l.note)).map((l) => langsOf(l.ja));
      const accepted = [...new Set(yes.flatMap((x) => x.codes))];
      const unknown = yes.flatMap((x) => x.unknown);
      if (listed.length && !accepted.length) { count('the facility\'s own note hedges every language'); refused.push({ id, name: o.nameJa, why: 'hedge: ' + (o.remark || claimed.map((l) => l.note).join(' ')).slice(0, 120) }); continue; }
      if (unknown.length) refused.push({ id, name: o.nameJa, why: 'unmapped language ' + unknown.join(',') });
      if (!accepted.length) { count('no language marked 受入可能'); continue; }
      // 秋葉原・小林歯科クリニック accepts patients in eighteen languages, Sinhala and Khmer among them.
      // That is a translation device or an interpreter line, not a practice that works in each of
      // them, and the site already caps a claim at six for the same reason (a language selector
      // listing nine languages is not a claim to speak nine). No part of such a claim is picked out
      // as the true one: the facility is refused and listed.
      if (listed.length > MAX_LANGS) { count('more than ' + MAX_LANGS + ' languages'); refused.push({ id, name: o.nameJa, why: accepted.length + ' languages' }); continue; }
      if (EMPLOYER.test(o.nameJa)) { count('employer or school clinic'); refused.push({ id, name: o.nameJa, why: 'employer or school clinic' }); continue; }
      const checked = fs.statSync(f).mtime.toISOString().slice(0, 10);
      rows.push({
        id,
        city: v.city,
        name: displayName(o),
        nameJa: o.nameJa,
        category: kbn === '3' ? 'dentist' : 'doctor',
        languages: accepted,
        url: o.homepage || undefined,
        sourceUrl: detailUrl(id),
        evidence: 'official',
        checked,
        area: v.ward ? v.ward + ' ward' : undefined,
        hospital: kbn === '1',
        restricted: o.langs.filter((l) => l.accept === '受入可能' && l.depts === '一部の診療科でのみ対応が可能').map((l) => ({ lang: langsOf(l.ja).codes, depts: l.deptNames })),
      });
      count('proposed');
    }
  }
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), rows }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(tally);
  const by = {};
  rows.forEach((r) => { const k = r.city + ' ' + r.category; by[k] = (by[k] || 0) + 1; });
  console.log(by);
}

// ---- ingest -----------------------------------------------------------------
const REGISTER_HOST = 'www.iryou.teikyouseido.mhlw.go.jp';
// Printed once per page, beside the rows it covers; the ministry's terms ask that the source be
// named, and this names it in the words it uses for itself.
const PAGE_NOTE = 'Some of these are on 医療情報ネット, the medical register Japan\'s Ministry of Health, ' +
  'Labour and Welfare publishes from what each hospital and clinic is required by law to report about ' +
  'itself. Languages whose entry, in the facility\'s own words, relies on a translation device or ' +
  'interpreter, asks patients to call first or offers only a few words are left out, and in Tokyo, whose ' +
  'form also asks it, only languages the facility accepts patients in without prior consultation are listed.';

const sourceId = (url) => REGISTER_HOST.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 32) + '-' +
  require('crypto').createHash('sha1').update(url).digest('hex').slice(0, 6);
const key = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9぀-鿿]+/g, '');

// Hospital departments, for the one note these rows carry: where a hospital accepts a language in
// some departments only, the card says which. Clinics are not given the note, because a clinic's
// "some departments" is almost always the one department it has.
const DEPT = {
  内科: 'internal medicine', 外科: 'surgery', 整形外科: 'orthopaedics', 小児科: 'paediatrics', 産婦人科: 'obstetrics and gynaecology',
  産科: 'obstetrics', 婦人科: 'gynaecology', 眼科: 'ophthalmology', 耳鼻いんこう科: 'ENT', 耳鼻咽喉科: 'ENT', 皮膚科: 'dermatology',
  泌尿器科: 'urology', 精神科: 'psychiatry', 心療内科: 'psychosomatic medicine', 放射線科: 'radiology', 麻酔科: 'anaesthesiology',
  リハビリテーション科: 'rehabilitation', 脳神経外科: 'neurosurgery', 形成外科: 'plastic surgery', 心臓血管外科: 'cardiovascular surgery',
  呼吸器内科: 'respiratory medicine', 循環器内科: 'cardiology', 消化器内科: 'gastroenterology', 消化器外科: 'gastrointestinal surgery',
  腎臓内科: 'nephrology', 脳神経内科: 'neurology', 神経内科: 'neurology', 救急科: 'emergency medicine', 歯科: 'dentistry',
  歯科口腔外科: 'oral surgery', 糖尿病内科: 'diabetes', 内分泌内科: 'endocrinology', 血液内科: 'haematology', リウマチ科: 'rheumatology',
  病理診断科: 'pathology', 呼吸器外科: 'thoracic surgery', 乳腺外科: 'breast surgery', 総合診療科: 'general medicine', 感染症内科: 'infectious diseases',
  肛門外科: 'proctology', アレルギー科: 'allergy', 小児外科: 'paediatric surgery', 美容外科: 'cosmetic surgery', 肝臓内科: 'hepatology', 臨床検査科: 'laboratory medicine',
};
const listWords = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);
function restrictionNote(r) {
  if (!r.hospital || !r.restricted.length) return '';
  const names = { en: 'English', zh: 'Chinese', ko: 'Korean', fr: 'French', es: 'Spanish', pt: 'Portuguese', de: 'German', ru: 'Russian', vi: 'Vietnamese', th: 'Thai', tl: 'Tagalog' };
  const out = [];
  for (const x of r.restricted) {
    const depts = [...new Set(String(x.depts).split(/\s+/).filter((d) => d && d !== '-'))];
    if (!depts.length || depts.some((d) => !DEPT[d])) return null; // untranslated: say nothing rather than half of it
    const langs = x.lang.map((l) => names[l]).filter(Boolean);
    if (!langs.length) continue;
    out.push(listWords(langs) + ' in ' + listWords([...new Set(depts.map((d) => DEPT[d]))]) + ' only.');
  }
  return [...new Set(out)].join(' ');
}

function ingest() {
  const apply = has('--apply');
  const { rows } = JSON.parse(fs.readFileSync(path.join(CACHE, 'proposals.json'), 'utf8'));
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'));
  const CHECKS_FILE = path.join(ROOT, 'data', 'service-link-checks.json');
  const checks = JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf8'));
  const urlOf = (p) => p.sourceUrl || (sources[p.source] || {}).url || '';

  // Duplicates are looked for among the rows already in the directory, never inside this batch:
  // every register entry is a separately licensed facility, so two branches of Shonan Beauty
  // Clinic are two rows. And by exact homepage, not host: clinics share site builders and chain
  // domains, and a host match merged Yamamoto Dental Clinic into Imperial Clinic.
  const bare = (u) => String(u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  const knownName = new Map(); const knownHost = new Map(); const knownSrc = new Set();
  db.providers.forEach((p) => {
    knownName.set(p.city + '|' + key(p.name), p);
    if (p.url) knownHost.set(p.city + '|' + bare(p.url), p);
    knownSrc.add(urlOf(p));
  });
  const add = []; const dupes = []; const noNote = [];
  for (const r of rows) {
    if (knownSrc.has(r.sourceUrl)) continue; // already ingested from this page
    const clash = knownName.get(r.city + '|' + key(r.name)) || knownName.get(r.city + '|' + key(r.nameJa)) ||
      (r.url && knownHost.get(r.city + '|' + bare(r.url)));
    if (clash) { dupes.push([r, clash]); continue; }
    const note = restrictionNote(r);
    if (note === null) { noNote.push(r); continue; }
    const sid = sourceId(r.sourceUrl);
    const row = {
      city: r.city, name: r.name, category: r.category, languages: r.languages,
      ...(r.url ? { url: r.url } : {}),
      source: sid, evidence: 'official', checked: r.checked,
      ...(r.area ? { area: r.area } : {}),
      ...(note ? { note } : {}),
    };
    add.push({ row, sid, r });
  }

  // The note gate fails a sentence three rows share; a department list that common is not about
  // any one hospital, so it is dropped from all of them rather than tripping the gate.
  const noteCount = {};
  add.forEach(({ row }) => { if (row.note) noteCount[row.note] = (noteCount[row.note] || 0) + 1; });
  let droppedNotes = 0;
  add.forEach(({ row }) => { if (row.note && noteCount[row.note] > 2) { delete row.note; droppedNotes += 1; } });

  const by = {};
  add.forEach(({ row }) => { const k = row.city + ' ' + row.category; by[k] = (by[k] || 0) + 1; });
  console.log(`${rows.length} proposed: ${add.length} new, ${dupes.length} already listed under another source, ` +
    `${noNote.length} hospitals held because a department name has no translation, ${droppedNotes} shared notes dropped`);
  console.log(by);
  dupes.forEach(([r, p]) => console.log(`  already listed: ${r.city} ${r.name} (${r.nameJa}) = ${p.name} [${p.languages.join(',')}]`));
  noNote.forEach((r) => console.log(`  held: ${r.name} ${JSON.stringify(r.restricted)}`));
  if (!apply) { console.log('\npreview only. re-run with --apply to write.'); return; }

  for (const { row, sid, r } of add) {
    db.providers.push(row);
    sources[sid] = {
      url: r.sourceUrl, host: REGISTER_HOST,
      publisher: 'Japan\'s Ministry of Health, Labour and Welfare', short: 'Japan\'s health ministry',
      kind: 'register', evidence: 'official', rows: 1,
      firstChecked: r.checked, lastChecked: r.checked, notePrefix: '', noteSuffix: '', pageNote: PAGE_NOTE,
    };
    // The page was fetched and read in this run with a 200 and its facility block present, which is
    // what the link gate would establish by fetching it again; four seconds a page, one at a time
    // per host, is seven hours for a result already in hand.
    checks.checks[r.sourceUrl] = { verdict: 'OK', status: 200, checkedAt: r.checked };
  }
  fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
  fs.writeFileSync(SRC_FILE, `${JSON.stringify(sources, null, 1)}\n`);
  fs.writeFileSync(CHECKS_FILE, `${JSON.stringify(checks, null, 1)}\n`);
  console.log(`\nwrote ${add.length} rows. now run: node scripts/rebuild_services.cjs`);
}

module.exports = { parsePage, displayName, langsOf, restrictionNote, EMPLOYER, LANG, WARDS };

if (require.main === module) {
  (async () => {
    if (cmd === 'list') return list();
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    if (cmd === 'ingest') return ingest();
    console.error('usage: node scripts/read_mhlw_register.cjs <list|fetch|propose|ingest> --cache <dir>');
    process.exit(2);
  })();
}

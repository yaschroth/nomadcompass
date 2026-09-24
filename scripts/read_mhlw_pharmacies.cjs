/**
 * Reads Japan's national medical register for the pharmacies (薬局) in our eight Japanese cities that
 * report a foreign language they can serve customers in.
 *
 * WHY THIS SOURCE
 *
 * The same register read by read_mhlw_register.cjs (医療情報ネット, published by the Ministry of
 * Health, Labour and Welfare) also carries every pharmacy's statutory report about itself, under the
 * Pharmaceutical and Medical Device Act rather than the Medical Care Act, and it has a block of its
 * own for languages. That is a claim made by the pharmacy, published by a government, per named
 * business: the official tier, as for the clinics.
 *
 * THE FORM IS NOT THE CLINICS' FORM
 *
 * The clinic form has one entry per language, with 受入可能 / 要相談 / 受入不可. The pharmacy form
 * (section 対応可能外国語の種類) has a fixed set of four languages, English, Chinese (simplified),
 * Chinese (traditional) and Korean, and for each one up to three fields:
 *
 *   英語による対応      可能 / 不可            whether it serves customers in the language at all
 *   英語の対応レベル    片言 / 日常会話 / ...  how well: "a few words", "everyday conversation", ...
 *   事前連絡の必要性    事前連絡必要 / ...     whether the customer has to contact them beforehand
 *
 * The last field carries no language name; it follows the language it belongs to, so it is read in
 * order and attached to the language above it. The levels used are 片言, 日常会話 and 母国語並
 * (native-like). After the four come up to three free-text languages and one free-text remark,
 * described in parsePage.
 *
 * THE RULE
 *
 * A language is published only where the pharmacy marks it 可能 outright:
 *   - 事前連絡必要 (contact us first) is the pharmacy's "consult first", the same hedge as the clinics'
 *     要相談, and the language is not published.
 *   - 片言 (a few words) is a hedge in the sense of "a bit of French", and is not published either.
 *     Unlike the clinics, pharmacies do fill in the level, so it can be used.
 *   - A level left blank is not a hedge and does not stop an outright 可能; the pharmacy said it can.
 *   - The remark can take a language back (contact first in words, or a translation app); see verdict.
 * The counts under each part of this are printed by propose, so the rule can be argued with numbers.
 *
 * Japanese is not added, for the reason given in read_mhlw_register.cjs. The cap of six is kept so
 * the two readers apply one rule; four fixed languages and three free-text ones could pass it.
 *
 * Pharmacies inside an employer's premises are refused by name with the clinics' EMPLOYER pattern,
 * except that a company-form word (株式会社, 有限会社, 合同会社) alone does not refuse a pharmacy:
 * pharmacies are companies and some put that in their registered name ("株式会社中川薬局"),
 * while a company clinic is the company's.
 *
 * THE SEARCH
 *
 * The site's "外国語で探す（薬局）" (header link P-02) is the general pharmacy search screen S2350 with
 * its four language boxes. Submitting it runs three session-bound XHRs (S2350/initsearch, presearch,
 * search) whose only output is a redirect to a result list, and that list is a stateless GET on the
 * same S2400 screen the clinics use, with pharmacy parameters:
 *
 *   S2400/initialize?sc=30-01-048-engtio,30-01-048-chinetio_simp,30-01-048-chine_trad,30-01-048-kor
 *     &st=30-2        any of the ticked boxes (30-1 is "all of them")
 *     &lo=1<pref+muni> restricted to that municipality (0<code> would be "near it")
 *     &sjk=4&jc=P-01  pharmacy search
 *     &cp=x_0_0__A&page=N&size=20
 *
 * size is capped at 20 by the server whatever is asked. A pharmacy that serves only in a free-text
 * language (Vietnamese, French, Thai are typed in by some) cannot be found, because the search has
 * a box for the four fixed languages only; the free-text ones are read from pharmacies found by those.
 *
 * Detail pages are the clinics' S2430 with kikanKbn=5, and render in about 1.5 seconds rather than 4.
 *
 *   list     node scripts/read_mhlw_pharmacies.cjs list --cache <dir> [--conc 3]
 *   fetch    node scripts/read_mhlw_pharmacies.cjs fetch --cache <dir> [--conc 5]
 *   propose  node scripts/read_mhlw_pharmacies.cjs propose --cache <dir>
 *              writes <dir>/proposals.json and <dir>/refused.json. There is no ingest yet.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { WARDS, LANG, langsOf, EMPLOYER, displayName } = require('./read_mhlw_register.cjs');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://www.iryou.teikyouseido.mhlw.go.jp';
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'mhlw-pharmacy')));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MUNIS = [];
for (const [city, [pref, wards]] of Object.entries(WARDS)) {
  for (const [code, ward] of Object.entries(wards)) MUNIS.push({ city, muni: pref + code, ward });
}

// The four boxes on the pharmacy form. Both Chinese scripts are one code here.
const SEARCH_CODES = ['30-01-048-engtio', '30-01-048-chinetio_simp', '30-01-048-chine_trad', '30-01-048-kor'];
const PH_LANG = { 英語: 'en', '中国語(簡体字)': 'zh', '中国語(繁体字)': 'zh', '韓国語・朝鮮語': 'ko', ...LANG };
const phLangs = (ja) => (PH_LANG[ja] ? { codes: [PH_LANG[ja]], unknown: [] } : langsOf(ja));

// Company-form words say how a pharmacy is owned, not whose staff it serves (see the header).
const EMPLOYER_PH = new RegExp(EMPLOYER.source.replace(/株式会社\||有限会社\||合同会社\|/g, ''));

const MAX_LANGS = 6;
const RANK = ['', '片言', '日常会話', '母国語並'];

const cachePath = (id) => path.join(CACHE, 'pages', id.replace(/\|/g, '_') + '.html.gz');
const detailUrl = (id) => { const [p, k, b] = id.split('|'); return `${BASE}/znk-web/juminkanja/S2430/initialize?prefCd=${p}&kikanCd=${k}&kikanKbn=${b}`; };

// ---- list -------------------------------------------------------------------
function listUrl(muni, page) {
  return `${BASE}/znk-web/juminkanja/S2400/initialize?sc=${SEARCH_CODES.join(',')}&st=30-2&lo=1${muni}` +
    `&sjk=4&jc=P-01&cp=x_0_0__A&page=${page}&size=20&sortNo=2`;
}
// One probe during the first list run (Node's fetch, no User-Agent, the clinic crawl running from
// the same machine) got a bare "403 Forbidden" from the host's front end, and the same URL answered
// 200 a moment later. Whether that was the missing User-Agent or a rate limit is not known, so a
// 403 is waited out for longer than an ordinary failure, and every failed answer is counted and
// printed at exit, so a throttled run says so.
const statusSeen = {};
async function getText(url) {
  for (let a = 0; a < 5; a += 1) {
    let st = 'error';
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      st = r.status;
      if (r.status === 200) return await r.text();
    } catch (e) { /* retried below */ }
    statusSeen[st] = (statusSeen[st] || 0) + 1;
    await sleep((st === 403 || st === 429 ? 20000 : 4000) * (a + 1));
  }
  return null;
}
process.on('exit', () => { if (Object.keys(statusSeen).length) console.log('failed answers, retried:', statusSeen); });
async function listOne(muni, page) {
  const t = await getText(listUrl(muni, page));
  if (!t) return null;
  const plain = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const n = (plain.match(/検索条件に合致する 薬局 が ([\d,]+) 件/) || [])[1];
  // A municipality with none says so in words rather than with a zero; no count and no ids is that.
  // kikanCd is not always digits: some Fukuoka and Sapporo pharmacies are "6R026006", with a letter
  // in it, and a digits-only pattern dropped a third of Fukuoka without a sound (the ward's count
  // said 63, 43 ids were read).
  const ids = [...t.matchAll(/S2430\/initialize\?prefCd=(\d+)&(?:amp;)?kikanCd=([0-9A-Za-z]+)&(?:amp;)?kikanKbn=(\d)/g)].map((m) => m.slice(1).join('|'));
  return { n: n ? Number(n.replace(/,/g, '')) : 0, ids };
}
async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const F = path.join(CACHE, 'list.json');
  const done = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
  const todo = MUNIS.filter(({ muni }) => !(done[muni] && done[muni].complete));
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const { city, muni, ward } = todo[i++];
      const first = await listOne(muni, 0);
      if (!first) { console.log(`${muni} ${city}: no answer, skipped`); continue; }
      const ids = new Set(first.ids);
      for (let p = 1; p < Math.ceil(first.n / 20); p += 1) {
        const r = await listOne(muni, p);
        if (r) r.ids.forEach((x) => ids.add(x));
        await sleep(300);
      }
      done[muni] = { city, ward, n: first.n, ids: [...ids], complete: ids.size >= first.n, listed: new Date().toISOString().slice(0, 10) };
      fs.writeFileSync(F, JSON.stringify(done));
      console.log(`${muni} ${city} ${ward}: ${first.n} pharmacies report a foreign language, ${ids.size} ids read`);
    }
  };
  await Promise.all(Array.from({ length: Number(val('--conc', '3')) }, worker));
}

// ---- fetch ------------------------------------------------------------------
async function fetchAll() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const todo = [...new Set(Object.values(L).flatMap((v) => v.ids))].filter((id) => !fs.existsSync(cachePath(id)));
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
  await Promise.all(Array.from({ length: Math.min(6, Number(val('--conc', '5'))) }, worker));
  console.log(`fetched ${ok}, failed ${bad}`);
}

// ---- parse ------------------------------------------------------------------
const decode = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ')).normalize('NFKC').replace(/\s+/g, ' ').trim();

// Every field on the pharmacy page is a <label class="ptn1ItemName"> and the <td> after it, under
// an accordion heading (acTitle). Read as [section, field, value] in page order.
function fields(html) {
  const secs = [...html.matchAll(/<span class="acTitle">([^<]*)<\/span>/g)].map((m) => [m.index, text(m[1])]);
  const out = [];
  const re = /<label class="ptn1ItemName">([\s\S]*?)<\/label>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/g;
  let m; let s = 0;
  while ((m = re.exec(html))) {
    while (s + 1 < secs.length && secs[s + 1][0] < m.index) s += 1;
    out.push([secs.length && secs[s][0] < m.index ? secs[s][1] : '', text(m[1]), text(m[2])]);
  }
  return out;
}

function parsePage(html) {
  const f = fields(html);
  const get = (sec, name) => (f.find(([a, b]) => a === sec && b === name) || [])[2] || '';
  const o = {};
  o.nameJa = get('施設詳細', '名称') ||
    decode((html.match(/<title>([^<｜]*)/) || [])[1] || '').replace(/（[^（]*）\s*$/, '').normalize('NFKC').trim();
  // ローマ字 is the pharmacy's own romanisation ("Hitotugi Yakkyoku"), the field the clinics call
  // 英語表記(ローマ字表記); anything from the first Japanese character on is not the name.
  o.nameEn = get('施設詳細', 'ローマ字').split(/[　-ヿ一-鿿＀-￯]/)[0].trim();
  o.address = get('所在地詳細', '所在地').replace(/ ?Googleマップで見る$/, '') || null;
  const hp = f.find(([, b, c]) => /ホームページ|URL/i.test(b) && /https?:\/\//.test(c));
  o.homepage = hp ? (hp[2].match(/https?:\/\/\S+/) || [])[0] : null;
  // Besides the four fixed languages the form has up to three free-text ones, "その他の外国語による
  // 対応(外国語1)" = "タイ語", each followed by "上記言語の対応レベル" (level of the language above) and
  // its own 事前連絡の必要性. The free text is not always a language: "翻訳機により対応" (by a
  // translation machine) and "アプリによる対応" (by an app) are typed into the same box, and stay
  // unknown. Last, one free-text remark, 外国語対応に関する特記事項, kept whole for the rule below.
  o.langs = []; o.oddFields = []; o.remark = '';
  const last = () => o.langs[o.langs.length - 1];
  for (const [sec, name, value] of f) {
    if (sec !== '対応可能外国語の種類') continue;
    let m;
    if ((m = name.match(/^(.+)による対応$/))) o.langs.push({ ja: m[1], accept: value, level: '', advance: '', other: false });
    else if (/^その他の外国語による対応/.test(name)) { if (!/^-?$/.test(value)) o.langs.push({ ja: value, accept: '可能', level: '', advance: '', other: true }); else o.langs.push({ ja: '', accept: '', level: '', advance: '', other: true }); }
    else if ((m = name.match(/^(.+)の対応レベル$/)) && o.langs.length && (last().ja === m[1] || (m[1] === '上記言語' && last().other))) last().level = value;
    else if (name === '事前連絡の必要性' && o.langs.length) last().advance = value;
    else if (name === '外国語対応に関する特記事項') o.remark = value === '-' ? '' : value;
    else o.oddFields.push(name + '=' + value);
  }
  o.langs = o.langs.filter((l) => l.ja);
  return o;
}

// Which languages a remark names. The fixed four are named in remarks as 英語, 中国語 and 韓国語.
const REMARK_NAMES = { 英語: 'en', 中国語: 'zh', 韓国語: 'ko', 朝鮮語: 'ko', ...LANG };
const namedIn = (s) => Object.keys(REMARK_NAMES).filter((k) => s.includes(k)).map((k) => REMARK_NAMES[k]);
// "翻訳ソフトでの対応" (by translation software), "スマートフォン言語翻訳アプリ", "多言語音声翻訳機器".
const MACHINE = /翻訳|アプリ|ポケトーク|通訳機|タブレット|iPad|ボイステラ/i;
const MACHINE_SCOPED = /その他|多言語|各言語|他の言語|他言語|言語であれば/;

// The rule, in one place: a language counts only if every field the pharmacy filled says yes.
// The remark can take a yes back: "英語での対応可、ただし事前に連絡が必要です" (English, but contact
// us first) is 事前連絡必要 in words, whatever the field above it says. A remark that asks for
// contact first without naming a language takes back all of them.
function verdict(l, remark = '') {
  if (l.accept !== '可能') return 'not 可能';
  if (l.advance === '事前連絡必要') return 'contact first (事前連絡必要)';
  if (l.level === '片言') return 'a few words (片言)';
  if (/事前/.test(remark) && /連絡|予約|相談/.test(remark)) {
    const named = namedIn(remark);
    if (!named.length || phLangs(l.ja).codes.some((c) => named.includes(c))) return 'contact first (in the remark)';
  }
  // A remark that says the languages are served through a translation app or device makes them the
  // app's languages, not the staff's: "翻訳アプリにて対応" (handled with a translation app),
  // "全ての従業員が対応可能だが翻訳機を介して説明を行う" (every employee can, through a translation
  // machine). Where the remark scopes the machine to the other languages ("翻訳ツール使用により多言語
  // 対応が可能", many languages by a translation tool; "GOOGLE翻訳で使用可能な言語であれば"), the four
  // fixed languages keep their own answer and only the free-text ones fall.
  if (MACHINE.test(remark) && (l.other || !MACHINE_SCOPED.test(remark))) return 'by translation app or device (in the remark)';
  // And a free-text "language" that is the device itself: "翻訳機(ポケトーク)による対応".
  if (l.other && MACHINE.test(l.ja)) return 'by translation app or device (as the language)';
  return 'ok';
}

// ---- propose ----------------------------------------------------------------
function propose() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  const rows = []; const refused = [];
  const tally = {}; const perLang = {}; const values = { accept: {}, level: {}, advance: {} }; const odd = {};
  const count = (t, k) => { t[k] = (t[k] || 0) + 1; };
  const seen = new Set();
  for (const [, v] of Object.entries(L)) {
    for (const id of v.ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const f = cachePath(id);
      if (!fs.existsSync(f)) { count(tally, 'not fetched'); continue; }
      const o = parsePage(zlib.gunzipSync(fs.readFileSync(f)).toString());
      o.oddFields.forEach((x) => count(odd, x));
      for (const l of o.langs) {
        count(values.accept, l.accept); if (l.accept === '可能') { count(values.level, l.level || '(blank)'); count(values.advance, l.advance || '(blank)'); }
        if (l.accept === '可能') count(perLang, (l.other ? 'other: ' : '') + (PH_LANG[l.ja] || l.ja) + ': ' + verdict(l, o.remark));
      }
      const ok = (l) => verdict(l, o.remark) === 'ok';
      const yes = o.langs.filter(ok).map((l) => phLangs(l.ja));
      const accepted = [...new Set(yes.flatMap((x) => x.codes))];
      const unknown = yes.flatMap((x) => x.unknown);
      if (unknown.length) refused.push({ id, name: o.nameJa, why: 'unmapped language ' + unknown.join(',') });
      if (!accepted.length) {
        const why = o.langs.some((l) => l.accept === '可能')
          ? 'every 可能 language hedged: ' + o.langs.filter((l) => l.accept === '可能').map((l) => l.ja + ' ' + verdict(l, o.remark)).join('; ')
          : 'no language marked 可能';
        count(tally, why.startsWith('every') ? 'every 可能 language hedged' : why);
        refused.push({ id, name: o.nameJa, city: v.city, why });
        continue;
      }
      if (accepted.length > MAX_LANGS) { count(tally, 'more than ' + MAX_LANGS + ' languages'); refused.push({ id, name: o.nameJa, why: accepted.length + ' languages' }); continue; }
      if (EMPLOYER_PH.test(o.nameJa)) { count(tally, 'employer or in-house pharmacy'); refused.push({ id, name: o.nameJa, city: v.city, why: 'employer or in-house pharmacy' }); continue; }
      const checked = fs.statSync(f).mtime.toISOString().slice(0, 10);
      rows.push({
        id,
        city: v.city,
        name: displayName(o),
        nameJa: o.nameJa,
        category: 'pharmacy',
        languages: accepted,
        url: o.homepage || undefined,
        sourceUrl: detailUrl(id),
        evidence: 'official',
        checked,
        area: v.ward ? v.ward + ' ward' : undefined,
        address: o.address || undefined,
        // Simplified and traditional Chinese are one code, so one entry each, at the better level.
        levels: accepted.map((c) => ({ lang: c, level: o.langs.filter((l) => ok(l) && phLangs(l.ja).codes.includes(c)).map((l) => l.level).sort((a, b) => RANK.indexOf(b) - RANK.indexOf(a))[0] || null })),
        remark: o.remark || undefined,
      });
      count(tally, 'proposed');
    }
  }
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), rows }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log('pharmacies:', tally);
  console.log('values seen:', values);
  console.log('per 可能 language, verdict:', perLang);
  if (Object.keys(odd).length) console.log('fields not understood:', odd);
  const by = {};
  rows.forEach((r) => count(by, r.city));
  console.log('proposed by city:', by);
  const langs = {};
  rows.forEach((r) => r.languages.forEach((l) => count(langs, l)));
  console.log('proposed by language:', langs);
  const remarks = {};
  rows.forEach((r) => { if (r.remark) count(remarks, r.remark); });
  console.log('remarks on proposed rows (read them):', remarks);
}

module.exports = { parsePage, verdict, listUrl, detailUrl };

if (require.main === module) {
  (async () => {
    if (cmd === 'list') return list();
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_mhlw_pharmacies.cjs <list|fetch|propose> --cache <dir>');
    process.exit(2);
  })();
}

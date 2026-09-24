/**
 * Reads Japan's Ministry of Foreign Affairs pages "世界の医療事情" (medical situation worldwide)
 * for the hospitals, clinics and dentists abroad that the ministry says can see a patient in
 * Japanese, and in any other foreign language it names for that provider.
 *
 * WHY THIS SOURCE
 *
 * www.mofa.go.jp/mofaj/toko/medi/ has one page per country (and some per consular city), written
 * by the ministry's own medical attaches (医務官) for Japanese people living abroad. Section 8 of
 * every page, "病気になった場合（医療機関）", lists named providers city by city, and for many of them
 * says in the ministry's own words whether Japanese is available: "日本語が通じます", "日本語通訳が
 * 勤務", "日本語ホットライン", "日本語不可". A government body making a per-provider language claim is
 * the official tier.
 *
 * Terms: the ministry's 法的事項 page (www.mofa.go.jp/mofaj/annai/legalmatters/index.html) puts
 * the site's content under 公共データ利用規約（第1.0版）(PDL1.0, the Digital Agency's Public Data
 * License, which allows reuse including commercial reuse) on condition that the source is named
 * and that edited content says it was edited and is not passed off as the ministry's own. The page
 * note does both. The embassy and consulate sites (*.emb-japan.go.jp) link to that same page, but
 * some of them add their own footer, e.g. in Portugal "無断による引用、転載、複製は禁止します"
 * (unauthorised quotation, reproduction and copying prohibited). This reader reads mofa.go.jp only.
 *
 * THE RULE
 *
 * A language is published for a provider only where a sentence about THAT provider (its dt/dd
 * block), or a list heading or intro that scopes the list it sits in ("以下は、日本語（通訳）サービス
 * を提供する医療機関です", "日本語の通じる医療機関"), says it is available. Read clause by clause
 * (split on 。 、 and "が、"), because the pages often say two things in one sentence:
 * "英語は可、日本語は不可".
 *
 *   - Negation in the clause (不可, 通じない, おらず, いない, ありません, なし ...) refuses that language.
 *   - A hedge in the clause (場合がある, 一部, 少し, 少々, 片言, 簡単な, 基本的な, 日常会話程度, 要確認,
 *     電話通訳, 翻訳アプリ, オンライン通訳 ...) refuses it too. A phone or video interpreting service
 *     is not a language spoken at the provider. "On request" is a hedge in the brief, so an
 *     interpreter who must be booked or arranged (要予約, 事前予約, 予約すれば, 依頼, アレンジ, 手配,
 *     契約, 有料) is refused as well; "日本語での予約受付" (a Japanese booking desk) is not a hedge,
 *     because the pattern is 予約すれば/要予約, not 予約. "基本的に" (as a rule) is not "基本的な" (basic).
 *   - An interpreter of any kind does NOT count, on-site included (日本語通訳が勤務/常駐, 通訳部).
 *     It did at first, and the audit of 2026-09-24 removed Japanese from 57 ingested rows: 16 rested
 *     on interpreters, 10 on staff, 6 on help desks and 5 on nurses. Every other reader in the
 *     directory refuses interpretation, because the patient is not being seen in their language.
 *     Help desks, "日本語スタッフ" and nurses are refused the same way (STAFF_ONLY below).
 *   - "日本人医師" or "日本人スタッフ" alone does NOT count: it says who works there, not which
 *     language a patient can use. Most such entries also say 日本語 somewhere; the ones that do not
 *     are listed in refused.json as "nationality-not-language".
 *   - The website-language notes after links, "ホームページ：X（英語）", say which language the WEBSITE
 *     is in, not the provider's staff. ホームページ/HP/URL/所在地 fields are never read for languages.
 *   - A phone line labelled "（日本語）" or "日本語ダイヤル" is a Japanese-speaking line at that provider
 *     and counts.
 *   - The country's local language is never published (LOCAL below, plus English where English is
 *     an official language of the country).
 *   - More than 6 languages for one provider is refused whole.
 *
 * TRAPS HIT
 *
 *   - www.mofa.go.jp sits behind Akamai, which answers 403 to curl and node fetch whatever the
 *     User-Agent, and also to WebFetch. A real headless Chrome is let through. So "fetch" drives a
 *     Chrome you start yourself with --remote-debugging-port (see below). Robots.txt is also 403
 *     to non-browsers; the terms page is what decides anyway.
 *   - "日英語とも使用可能" means Japanese and English; "日英" is not caught by a search for 日本語.
 *   - The medical section is numbered 8 on most pages but 5 or 9 on some, and its element id is not
 *     its number (Guangzhou's is id="section15"): it is found by its h2 text. Inside it, entries are
 *     h3/h4 city headings + dl/dt/dd provider blocks. Shanghai's says "see the consulate's site",
 *     and a dozen African pages use bare paragraphs; parse logs "no dt blocks" there instead of
 *     guessing. None of those paragraph pages mentions Japanese except to say it is not available.
 *   - A heading like "（歯科）" or "【医院・クリニック】" is a category label inside the city above it,
 *     not a new city, and it is an h4 SIBLING of the city heading, so the city is found by walking
 *     back through every heading so far (history), not the heading stack. An airport heading
 *     "（スワンナプーム空港）" ends a Japanese-service intro, because the intro did not name airports.
 *   - "日本語での診療アシスタンス" in Vientiane sits in the same block as "有料で日本語通訳サービス...":
 *     the Japanese is a paid outside company's desk. So a hedge or negation ANYWHERE in a block
 *     refuses that language for the block; the one block where that is wrong (Hanoi's Japan
 *     International Eye Hospital: "日本人医師常駐無し" but "日本語通訳者常駐") is a manual decision.
 *   - The Jakarta heading covers the factory estates an hour out (Karawang, KIIC, Cikarang), the
 *     Los Angeles page's dentist list covers Orange County and San Diego, and a Düsseldorf list
 *     holds a Meerbusch clinic on "Düsseldorfer Straße". EXCLUDE_ADDR, PAGE_ADDR and the German
 *     postcode rule in cityOf handle those.
 *   - Buenos Aires and Vienna put a list label in a dt and the first provider in the dd below it.
 *   - Names are written for Japanese readers; cleanName keeps the Latin name the ministry gives
 *     whole, and nameAsListed keeps the original.
 *   - Pages carry dentists (about 150 blocks) and a handful of pharmacies, no vets; the only pharmacy
 *     with a Japanese claim is a clinic-and-pharmacy in Bangkok, filed as a doctor.
 *   - Singapore, Korea, Australia's cities other than Canberra, New Zealand, Spain, the
 *     Netherlands, Belgium, Switzerland and most US consular districts have no Japanese-speaking
 *     list here; their consulates publish their own, on the embassy sites this reader does not read.
 *
 * STAGES
 *
 *   fetch    node scripts/read_mofa_medical.cjs fetch --cache <dir> [--port 9341]
 *              needs: chrome --headless=new --remote-debugging-port=9341 --user-data-dir=<tmp>
 *              reads the index, then each country page once into <dir>/pages. One tab at a time.
 *   parse    node scripts/read_mofa_medical.cjs parse --cache <dir>
 *              writes <dir>/entries.json: every provider block with its city heading, fields,
 *              scope intro, and the language clauses found, each marked yes/no/hedge.
 *   propose  node scripts/read_mofa_medical.cjs propose --cache <dir> [--decisions <file>]
 *              applies the rule and the city map, writes <dir>/proposals.json and refused.json.
 *              --decisions is a JSON file keyed "<page name>#<name as listed>" of manual reviews:
 *              { "ja": true|false, "refuse": true, "name": "...", "category": "...", "reason": "..." };
 *              every override must say why. Rows keep japaneseVia (entry | list-heading) and
 *              interpreter (true where the claim is interpretation) so the card can say so.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'mofa')));
const PORT = +val('--port', 9341);
const BASE = 'https://www.mofa.go.jp';
const INDEX = BASE + '/mofaj/toko/medi/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

// ---- fetch (Chrome over CDP) -------------------------------------------------
function session(wsUrl) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl); let id = 0; const pend = new Map();
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
    ws.onopen = () => res({ send: (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }), close: () => ws.close() });
    ws.onerror = rej;
  });
}
async function getHTML(url) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const s = await session(t.webSocketDebuggerUrl);
  try {
    await s.send('Page.enable');
    await s.send('Page.navigate', { url });
    let html = '';
    for (let k = 0; k < 8; k++) { // wait until the page's footer is there, not a fixed time
      await sleep(1500);
      const r = await s.send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true });
      html = (r.result && r.result.result && r.result.result.value) || '';
      if (/Copyright/.test(html.slice(-20000))) break;
    }
    return html;
  } finally { s.close(); try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch (e) { /* tab gone */ } }
}
const pageFile = (url) => path.join(CACHE, 'pages', url.replace(BASE + '/', '').replace(/\//g, '_'));

function pageList(indexHtml) {
  const out = []; const re = /<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g; let m;
  while ((m = re.exec(indexHtml))) {
    const h = m[1]; const name = m[2].replace(/<[^>]+>|\s+/g, ' ').trim();
    if (/^(asia|n_ame|cs_ame|europe|oceania|nm_east|africa)\//.test(h)) out.push({ url: BASE + '/mofaj/toko/medi/' + h, name });
    else if (/^\/mofaj\/ms\/h_w\//.test(h)) out.push({ url: BASE + h, name });
  }
  return out;
}

async function fetchAll() {
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const idx = path.join(CACHE, 'index.html');
  if (!fs.existsSync(idx)) fs.writeFileSync(idx, await getHTML(INDEX));
  const list = pageList(fs.readFileSync(idx, 'utf8'));
  fs.writeFileSync(path.join(CACHE, 'page_list.json'), JSON.stringify(list, null, 1));
  for (const p of list) {
    const f = pageFile(p.url);
    if (fs.existsSync(f) && fs.statSync(f).size > 20000) continue;
    const html = await getHTML(p.url);
    fs.writeFileSync(f, html);
    console.log(p.name, html.length);
    await sleep(1500);
  }
}

// ---- parse -------------------------------------------------------------------
const ent = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = (s) => ent(s.replace(/<br[^>]*>/g, ' ').replace(/<[^>]+>/g, '')).replace(/[ \t\r\n　]+/g, ' ').trim();

// The Japanese names of languages, and the code each is published under.
const LANG = [
  // 日本人通訳 is the usual Japanese word for a Japanese-language interpreter, not a claim about the
  // interpreter's passport; 日本人医師 (a Japanese doctor) on its own is not listed and does not count.
  ['日本語', 'ja'], ['日本人通訳', 'ja'], ['英語', 'en'], ['フランス語', 'fr'], ['仏語', 'fr'], ['スペイン語', 'es'], ['ドイツ語', 'de'], ['独語', 'de'],
  ['中国語', 'zh'], ['北京語', 'zh'], ['普通話', 'zh'], ['広東語', 'zh'], ['韓国語', 'ko'], ['朝鮮語', 'ko'], ['ポルトガル語', 'pt'],
  ['ロシア語', 'ru'], ['イタリア語', 'it'], ['タイ語', 'th'], ['ベトナム語', 'vi'], ['インドネシア語', 'id'], ['マレー語', 'ms'],
  ['アラビア語', 'ar'], ['ヒンディー語', 'hi'], ['タガログ語', 'tl'], ['オランダ語', 'nl'], ['トルコ語', 'tr'], ['ヘブライ語', 'he'],
  ['ギリシャ語', 'el'], ['ポーランド語', 'pl'], ['ウクライナ語', 'uk'], ['ペルシャ語', 'fa'], ['ウルドゥー語', 'ur'], ['ネパール語', 'ne'],
];
const NEG = /(不可|通じない|通じません|通じず|話せない|話せません|話さない|できない|できません|出来ない|出来ません|おらず|おりません|いない|いません|ありません|ない[。）)]?$|なし|無し|不能|困難|難しい|限らない|期待できない)/;
// Interpreters, help desks, staff and nurses: the patient is not seen in Japanese by the clinician.
const STAFF_ONLY = /(通訳|ヘルプデスク|日本語スタッフ|日本語を話すスタッフ|日本語ができる職員|日本語職員|看護師|看護士|サポート)/;
const HEDGE = /(場合があ|場合もあ|こともあ|事もあ|一部|少し|片言|簡単な|日常会話|程度|ある程度|限られ|要確認|確認して|確認が必要|事前に確認|次第|可能性|かもしれ|ことがある|比較的|電話通訳|オンライン通訳|ビデオ通訳|遠隔通訳|通訳アプリ|翻訳アプリ|翻訳機|翻訳ソフト|電話で[^。]*通訳|電話での通訳|アレンジ|依頼|契約|少々|基本的な|要予約|事前予約|予約すれば|必要な場合は|有料|別料金|手配|派遣|医療通訳会社|予定)/;
const POS = /(堪能|解する|解す|サポート|受けられ|通じ|可|対応|話|診療|診察|受診|サービス|窓口|デスク|ヘルプ|ホットライン|ダイヤル|専用|通訳|スタッフ|医師|看護|職員|話者|できる|できます|可能|常駐|勤務|在籍|相談|予約|ライン|受付|使用|使え|OK)/;
const SKIP_FIELD = /^(ホームページ|HP|URL|Website|ウェブサイト|所在地|住所|アクセス|地図)\s*[：:]/;
const PHONE_FIELD = /^(電話|電話番号|TEL|Tel|代表電話|連絡先|Email|E-mail|メール)\s*[：:]/;
// A field that is itself a list of languages ("対応言語：英語、日本語（核医学Dr.X）") needs no verb.
const LANG_FIELD = /^(対応言語|対応可能言語|使用言語|診療言語|言語|通訳|日本語対応|対応)\s*[：:]/;

// Split on 。 、 ， ； and "が、", but never inside brackets: "（英語、日本語）があり" is one clause.
function clausesOf(s) {
  const out = []; let depth = 0; let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('（(「【'.includes(ch)) depth++;
    if ('）)」】'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && ('。、，；;'.includes(ch))) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim()).filter(Boolean);
}
// Which languages a piece of text claims, clause by clause.
function langClaims(str, { phoneField = false } = {}) {
  const out = [];
  for (const c of clausesOf(str)) {
    const found = new Set();
    for (const [w, code] of LANG) if (c.includes(w)) found.add(code);
    if (/日英|英日|日・英|日本・英/.test(c)) { found.add('ja'); found.add('en'); }
    if (!found.size) continue;
    let verdict = 'yes';
    // "日本語対応には問題ありません" is "no problem with Japanese", the opposite of a negation
    if (NEG.test(c.replace(/問題(は|が|も)?(ありません|ない|なし)/g, ''))) verdict = 'no';
    else if (HEDGE.test(c) || STAFF_ONLY.test(c)) verdict = 'hedge';
    else if (!phoneField && !POS.test(c)) verdict = 'nomarker';
    const interp = /通訳/.test(c);
    for (const code of found) out.push({ code, verdict, interp, clause: c });
  }
  return out;
}

function parsePage(html, pageUrl, pageName) {
  // The section is numbered 8 on most pages but 5 or 9 on some, and its id is not its number
  // (Guangzhou's is id="section15"), so find it by its heading and stop at the next section.
  const h = html.search(/<h2[^>]*>(?:(?!<\/h2>)[\s\S])*病気になった場合/);
  if (h < 0) return { entries: [], note: 'no 病気になった場合 section' };
  const i = html.lastIndexOf('class="main-section', h);
  let j = html.indexOf('class="main-section', h); if (j < 0) j = h + 200000;
  const s = html.slice(i, j);
  const toks = []; const re = /<(h[2-6])[^>]*>([\s\S]*?)<\/\1>|<p[^>]*>([\s\S]*?)<\/p>|<dt[^>]*>([\s\S]*?)<\/dt>|<dd[^>]*>([\s\S]*?)<\/dd>/g; let m;
  while ((m = re.exec(s))) {
    if (m[1]) toks.push({ t: 'h', lvl: +m[1][1], x: text(m[2]) });
    else if (m[3] !== undefined) toks.push({ t: 'p', x: text(m[3]) });
    else if (m[4] !== undefined) toks.push({ t: 'dt', x: text(m[4]) });
    else toks.push({ t: 'dd', x: text(m[5]), raw: m[5] });
  }
  const entries = []; const heads = []; const history = []; let intro = []; let cur = null;
  for (const k of toks) {
    if (k.t === 'h') {
      if (k.lvl === 2) continue;
      while (heads.length && heads[heads.length - 1].lvl >= k.lvl) heads.pop();
      heads.push({ lvl: k.lvl, x: k.x }); history.push(k.x);
      // a category label (歯科, 【医院・クリニック】) keeps the intro above it; any other heading ends it
      if (!/^[（(【]?(歯科|歯科医院|医院|クリニック|病院|総合病院|診療所|薬局|【)/.test(k.x) && !/^【/.test(k.x)) intro = [];
      cur = null; continue;
    }
    if (k.t === 'p') { if (k.x) intro.push(k.x); cur = null; continue; }
    if (k.t === 'dt') {
      // history: every heading so far, because "（歯科）" is an h4 sibling of "（首都）バンコク", not a
      // child, so the stack alone loses the city for the dentists listed under it
      cur = { page: pageUrl, pageName, heads: heads.map((h) => h.x), history: history.slice(), intro: intro.slice(), name: k.x.replace(/^[（(]\s*\d+\s*[）)]\s*/, ''), fields: [], url: '' };
      entries.push(cur); continue;
    }
    if (k.t === 'dd' && cur) {
      // Buenos Aires and Vienna put a list label in the dt ("日本語での受診が可能な医師") and the first
      // provider in the dd under it ("ア Dra. Kyoko Nakamura（…） 所在地：…"). The label becomes a
      // heading for what follows, and the dd becomes the provider.
      if (!cur.fields.length && /日本語/.test(cur.name) && /(医師|医療機関|施設)$/.test(cur.name) && /^[アイウエオ]\s/.test(k.x)) {
        history.push(cur.name); heads.push({ lvl: 9, x: cur.name });
        cur.heads = heads.map((h) => h.x); cur.history = history.slice();
        cur.name = k.x.replace(/\s*(所在地|住所)\s*[：:].*$/, '');
        const rest = /(所在地|住所)\s*[：:].*$/.exec(k.x); if (rest) cur.fields.push(rest[0]);
        continue;
      }
      cur.fields.push(k.x);
      // a dd that is nothing but a link is a second website link, and its "（日本語）" names the site's language
      if (/^\s*<a [^>]*>[\s\S]*?<\/a>\s*(<img[^>]*>)?\s*$/.test(k.raw || '')) (cur.linkOnly = cur.linkOnly || []).push(k.x);
      const a = /<a [^>]*href="(https?:[^"]+)"/.exec(k.raw || '');
      if (a && /^(ホームページ|HP|URL|Website|ウェブサイト)/.test(k.x) && !cur.url) cur.url = ent(a[1]);
    }
  }
  return { entries, note: entries.length ? '' : 'no dt blocks in section 8' };
}

function claimsOf(e) {
  const own = [];
  own.push(...langClaims(e.name));
  for (const f of e.fields) {
    if (SKIP_FIELD.test(f)) continue;
    if (e.linkOnly && e.linkOnly.includes(f)) continue; // "X病院（日本語）" = the Japanese version of its website
    const listy = PHONE_FIELD.test(f) || LANG_FIELD.test(f);
    own.push(...langClaims(f.replace(/^[^：:]{1,12}[：:]/, (x) => (PHONE_FIELD.test(f) ? '' : x)), { phoneField: listy }));
  }
  // An intro or heading that says the list below is of Japanese-speaking providers.
  const scope = [];
  for (const x of e.heads.slice().reverse().concat(e.intro)) { // nearest heading first, it is the better quote
    for (const c of langClaims(x)) if (c.code === 'ja' && /(以下|下記|次の|医療機関|医師|病院|クリニック|施設|診療所|医院|歯科)/.test(c.clause)) scope.push(c);
  }
  return { own, scope };
}

function parseAll() {
  const list = JSON.parse(fs.readFileSync(path.join(CACHE, 'page_list.json'), 'utf8'));
  const all = []; const log = [];
  for (const p of list) {
    const f = pageFile(p.url); if (!fs.existsSync(f)) { log.push(p.url + ' not fetched'); continue; }
    const html = fs.readFileSync(f, 'utf8');
    const dateM = /(令和\d+年\d+月\d+日)/.exec(html.slice(html.indexOf('<h1'), html.indexOf('id="section1"')));
    const { entries, note } = parsePage(html, p.url, p.name);
    if (note) log.push(p.name + ': ' + note);
    for (const e of entries) { e.pageDate = dateM ? dateM[1] : ''; const c = claimsOf(e); e.own = c.own; e.scope = c.scope; all.push(e); }
  }
  fs.writeFileSync(path.join(CACHE, 'entries.json'), JSON.stringify(all, null, 1));
  fs.writeFileSync(path.join(CACHE, 'parse_log.txt'), log.join('\n'));
  console.log(all.length, 'entries;', log.length, 'log lines');
}

// ---- propose -----------------------------------------------------------------
// The country each page is about, and our local-language rule for it. English is also local in
// these countries, so it is never published there even though LOCAL (scripts/lib) says otherwise.
const EN_OFFICIAL = new Set(['United States', 'United Kingdom', 'Australia', 'New Zealand', 'Ireland', 'Canada', 'Singapore', 'India', 'Philippines', 'Malta', 'South Africa', 'Kenya', 'Tanzania', 'Uganda', 'Nigeria', 'Ghana', 'Rwanda', 'Namibia', 'Fiji', 'Guam', 'Northern Mariana Islands', 'Puerto Rico', 'Jamaica', 'Barbados', 'Trinidad and Tobago', 'Mauritius', 'Pakistan', 'Sri Lanka', 'Zambia', 'Zimbabwe', 'Botswana', 'Malawi', 'Samoa', 'Tonga', 'Vanuatu', 'Palau', 'Marshall Islands', 'Micronesia', 'Solomon Islands', 'Papua New Guinea', 'Belize', 'Bahamas', 'Seychelles', 'Sierra Leone', 'Liberia', 'Gambia', 'Cameroon', 'Sudan', 'South Sudan', 'Eswatini', 'Lesotho', 'Brunei']);
// Hong Kong is listed under China in our city data; English and Chinese are both official there.
const EXTRA_LOCAL = { Switzerland: ['de', 'fr', 'it'], Belgium: ['nl', 'fr', 'de'], Canada: ['en', 'fr'], Singapore: ['en', 'zh', 'ms', 'ta'], India: ['en', 'hi'], Malaysia: ['ms'], Luxembourg: ['fr', 'de'], Cyprus: ['el', 'tr'], Israel: ['he', 'ar'], 'Sri Lanka': ['si', 'ta', 'en'], Paraguay: ['es'], Peru: ['es'], Bolivia: ['es'], Philippines: ['tl', 'en'], Kenya: ['sw', 'en'], Tanzania: ['sw', 'en'], Rwanda: ['en', 'fr'], Madagascar: ['fr'], Morocco: ['ar', 'fr'], Tunisia: ['ar', 'fr'], Algeria: ['ar', 'fr'], Senegal: ['fr'], 'Ivory Coast': ['fr'], Laos: ['lo'], Mongolia: ['mn'], Nepal: ['ne'], Myanmar: ['my'], Bangladesh: ['bn'], Pakistan: ['ur', 'en'], Uzbekistan: ['uz', 'ru'], Kazakhstan: ['kk', 'ru'], Kyrgyzstan: ['ky', 'ru'], Belarus: ['be', 'ru'], Tajikistan: ['tg', 'ru'] };
function localLangs(country, iso) {
  const { LOCAL } = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
  const s = new Set(EXTRA_LOCAL[country] || []);
  // Hong Kong and Macau are filed under China in our city data, but English is official in Hong
  // Kong and Portuguese in Macau
  if (iso === 'hk') s.add('en');
  if (iso === 'mo') s.add('pt');
  if (LOCAL[country]) s.add(LOCAL[country]);
  if (EN_OFFICIAL.has(country)) s.add('en');
  if (country === 'Japan') s.add('ja');
  return s;
}

// Japanese place names in section 8 headings -> our city id. null = a place that is not one of
// our cities, which STOPS the walk back through the headings (else a Tianjin clinic listed under
// "天津市" would inherit Beijing from the heading above it). '@addr' = a state or province, where
// the city is read from the provider's own address instead (ADDR below).
// One distance rule for every city: a provider in the city, or in a place that adjoins it within
// about 15 km of its centre, is filed under it with its address in `area` (Neuilly for Paris,
// Makati for Manila, Lalitpur/Patan for Kathmandu, Meerbusch for Düsseldorf, Edgewater NJ for
// New York). Anything further out is refused as city-not-ours, even where the ministry lists it
// under the city: Torrance (25 km from Los Angeles), Subang Jaya and Petaling Jaya (about 20 km
// from Kuala Lumpur), Richmond Hill (25 km from Toronto), Cikarang and Karawang (Jakarta).
const JA_PLACE = {
  デリー: 'newdelhi', グルガオン: null, ムンバイ: 'mumbai', コルカタ: 'kolkata', チェンナイ: 'chennai', ベンガルール: 'bangalore', ジャイプール: 'jaipur',
  ジャカルタ: 'jakarta', バンドン: 'bandung', スラバヤ: 'surabaya', デンパサール: 'bali', マカッサル: 'makassar', メダン: 'medan',
  プノンペン: 'phnompenh', シェムリアップ: 'siemreap',
  バンコク: 'bangkok', スワンナプーム空港: 'bangkok', ドンムアン空港: 'bangkok', パタヤ: 'pattaya', シラチャ: null, ホアヒン: 'huahin', チェンマイ: 'chiangmai',
  チェンライ: 'chiangrai', ピサヌローク: null, スコタイ: null, ノンカイ: null, ウドンタニ: 'udonthani', コンケン: null, ナコンラチャシマ: null, ウボンラチャタニ: null,
  プーケット: 'phuket', サムイ: 'kohsamui', ハジャイ: null, スラタニ: null,
  北京市: 'beijing', 天津市: null, 湖北省: null, 広東省: '@addr', 広州市: 'guangzhou', 佛山市: null, 深セン市: 'shenzhen', 珠海市: null, 中山市: null, 福建省: '@addr',
  福州市: null, 厦門市: 'xiamen', 広西チワン族自治区: '@addr', 南寧市: null, 瀋陽市: null, 長春市: null, ハルビン市: null, 大連市: null,
  カトマンズ: 'kathmandu', ラリトプル: 'kathmandu', ポカラ: 'pokhara', クンブ: null, ダッカ: 'dhaka', チッタゴン: null, コックスバザール: null, ディリ: 'dili',
  マニラ: 'manila', セブ: 'cebu', ラプラプ: 'cebu', ダバオ: 'davao',
  ハノイ: 'hanoi', ホーチミン: 'hochiminhcity', 'フエ市・ダナン市': '@addr', ダナン: 'danang',
  クアラルンプール: 'kualalumpur', マラッカ: 'malacca', パハン: null, 'ヌグリ・スンビラン': null, ペラ: '@addr', ペルリス: null, ペナン: 'penang', コタキナバル: 'kotakinabalu',
  ヤンゴン: 'yangon', ネーピードー: null, マンダレー: 'mandalay', マレ: 'male', ウランバートル: 'ulaanbaatar', ビエンチャン: 'vientiane', ルアンパバーン: 'luangprabang',
  コロンボ: 'colombo', キャンディ: 'kandy', トリンコマリー: 'trincomalee', ゴール: 'galle', イスラマバード: 'islamabad', ラワルピンディー: null, ラホール: null, ティンプー: 'thimphu', パロ: null,
  ロサンゼルス: 'losangeles', トーランス: null, パロスバーデス: null, ガーデナ: null, マンハッタンビーチ: null, パサデナ: null, バーバンク: null,
  オックスナード: null, ファウンテンバレー: null, アーバイン: null, チュラビスタ: 'sandiego', サンディエゴ: 'sandiego', フェニックス: 'phoenix', スコッツデール: null, メサ: null, ツーソン: null,
  マイアミ: 'miami', ワシントンDC: 'washingtondc', メリーランド州: null, バージニア州: null,
  オタワ: 'ottawa', トロント: 'toronto', モントリオール: 'montreal', カルガリー: 'calgary', バンクーバー: '@addr', 看護師による相談受付ホットライン: null,
  ブエノスアイレス: 'buenosaires', モンテビデオ: 'montevideo', キト: 'quito', グアヤキル: 'guayaquil', クエンカ: 'cuenca', ボゴタ: 'bogota', メデジン: 'medellin', カリ: 'cali', カルタヘナ: 'cartagena', バランキージャ: 'barranquilla',
  サントドミンゴ: 'santodomingo', プンタカナ: 'puntacana', アスンシオン: 'asuncion', ルケ: null, エンカルナシオン: null, ピラポ: null, オエナウ: null,
  ブラジリア: 'brasilia', ベレン: 'belem', レシフェ: 'recife', サルバドール: 'salvador', マナウス: 'manaus', リオデジャネイロ: 'rio', サンパウロ: 'saopaulo', クリチバ: 'curitiba', ポルトアレグレ: 'portoalegre',
  リマ: 'lima', クスコ: 'cusco', サンタクルス: 'santacruz', ラパス: 'lapaz', メキシコシティ: 'mexicocity', メキシコ州: null, 'キンタナ・ロー州': '@addr', カンクン: 'cancun', ロスカボス: null,
  ハリスコ州: '@addr', グアダラハラ: 'guadalajara', プエルトバジャルタ: 'puertovallarta', グアナファト州: '@addr', レオン市: 'leon', グアナファト市: 'guanajuato', セラヤ: null,
  アグアスカリエンテス: null, ケレタロ: 'queretaro', サンホセ: 'sanjosecr', グアテマラ市: null, マナグア: null, パナマ: 'panama', ハバナ: 'havana',
  バクー: 'baku', ティラナ: 'tirana', エレバン: 'yerevan', ローマ: 'rome', ミラノ: 'milan', タシケント: 'tashkent', タリン: 'tallinn', ウィーン: 'vienna', アルマティ: 'almaty', アスタナ: null, ビシュケク: 'bishkek',
  ザグレブ: 'zagreb', トビリシ: 'tbilisi', ブラチスラバ: 'bratislava', ベオグラード: 'belgrade', ドゥシャンベ: 'dushanbe', ブダペスト: 'budapest', パリ: 'paris', ソフィア: 'sofia', ミンスク: 'minsk',
  ワルシャワ: 'warsaw', ブロツワフ: 'wroclaw', サラエボ: 'sarajevo', リスボン: 'lisbon', ポルト: 'porto', コインブラ: 'coimbra', ファロ: 'faro', アルブフェイラ: null, スコピエ: 'skopje', リーガ: 'riga',
  ブカレスト: 'bucharest', モスクワ: null, ウラジオストク: null, ユジノサハリンスク: null, ロンドン: 'london', ヌクアロファ: 'nukualofa',
  アブダビ: 'abudhabi', ドバイ: 'dubai', テルアビブ: 'telaviv', エルサレム: 'jerusalem', テヘラン: null, イスファハン: 'isfahan', ドーハ: 'doha', クウェート: 'kuwait', アンカラ: 'ankara', イスタンブール: 'istanbul',
  マナーマ: 'manama', アンマン: 'amman', エルビル: 'erbil', カイロ: 'cairo', アレキサンドリア: 'alexandria', ルクソール: 'luxor', アスワン: 'aswan', アディスアベバ: 'addisababa', ナイロビ: 'nairobi', モンバサ: 'mombasa',
  ミンデロ: 'mindelo', アビジャン: 'abidjan', アクラ: 'accra', ラゴス: 'lagos', ダカール: 'dakar', カンパラ: 'kampala', キガリ: 'kigali', ルサカ: 'lusaka', マプト: 'maputo', ウィントフック: 'windhoek',
  ヨハネスブルグ: 'johannesburg', ケープタウン: 'capetown', チュニス: 'tunis', カサブランカ: 'casablanca', ラバト: 'rabat',
  // longer names that contain a shorter key above and must not fall through to it
  ポルトープランス: null, カリフォルニア: '@addr', コスタメサ: null, マレーシア: null, サンサルバドル: null,
  // German states: the city comes from the address
  ベルリン: 'berlin', ハンブルク: 'hamburg', 'ノルトライン・ヴェストファーレン州': '@addr', ヘッセン州: '@addr', バイエルン州: '@addr', 'バーデン・ヴュルテンベルク州': '@addr',
  ザクセン州: '@addr', ニーダーザクセン州: '@addr', ブレーメン州: null, ブランデンブルク州: null, 'ラインラント・プファルツ州': null, ザールラント州: null, テューリンゲン州: '@addr',
  'メクレンブルク・フォアポンメルン州': '@addr', 'シュレスヴィッヒ・ホルシュタイン州': '@addr', 'ザクセン・アンハルト州': null,
};
// Pages about one city, whose section 8 may have no city heading at all.
const PAGE_DEFAULT = {
  'asia/hongkong.html': 'hongkong', 'asia/brunei.html': 'bandarseribegawan', 'asia/kotakinabalu.html': 'kotakinabalu', 'asia/davao.html': 'davao', 'asia/cebu.html': 'cebu',
  'n_ame/ny.html': 'newyork', 'n_ame/miami.html': 'miami', 'n_ame/guam.html': 'hagatna', 'n_ame/saipan.html': 'saipan', 'n_ame/usa.html': '@addr',
  'europe/romania.html': 'bucharest', 'europe/greece.html': 'athens', 'europe/uk.html': 'london', 'cs_ame/panama.html': 'panama', 'cs_ame/chile.html': 'santiago',
};
// Pages about places that are none of ours, whose headings would otherwise match one of our
// cities by name: the Encarnacion page has a heading "ラパス", the Paraguayan colony La Paz.
const PAGE_NONE = new Set(['cs_ame/encarnacion.html', 'asia/chongqing.html', 'asia/shenyang.html', 'asia/dalian.html', 'asia/qingdao.html', 'asia/karachi.html', 'europe/russia.html', 'europe/vladio.html', 'europe/y_sakhalinsk.html']);
// Where the heading is a state, the city is the one the provider's address names.
const ADDR = [
  [/D[üu]sseldorf/i, 'dusseldorf'], [/K[öo]ln\b|Cologne/i, 'cologne'], [/M[üu]nchen|Munich/i, 'munich'], [/Frankfurt/i, 'frankfurt'], [/Stuttgart/i, 'stuttgart'],
  [/Hamburg/i, 'hamburg'], [/Berlin/i, 'berlin'], [/Dresden/i, 'dresden'], [/Leipzig/i, 'leipzig'], [/N[üu]rnberg|Nuremberg/i, 'nuremberg'], [/Heidelberg/i, 'heidelberg'],
  [/Freiburg/i, 'freiburg'], [/M[üu]nster\b/i, 'munster'], [/Erfurt/i, 'erfurt'], [/Rostock/i, 'rostock'], [/L[üu]beck/i, 'lubeck'], [/W[üu]rzburg/i, 'wurzburg'], [/Regensburg/i, 'regensburg'],
  [/Da ?Nang|ダナン/i, 'danang'], [/Hu[eế]\b|フエ/i, 'hue'], [/Ipoh/i, 'ipoh'],
  [/Guadalajara|Zapopan/i, 'guadalajara'], [/Puerto Vallarta/i, 'puertovallarta'], [/Canc[úu]n/i, 'cancun'], [/Playa del Carmen/i, 'playadelcarmen'], [/Tulum/i, 'tulum'],
  [/San Miguel de Allende/i, 'sanmigueldeallende'], [/Quer[ée]taro/i, 'queretaro'], [/Guanajuato,? Gto|Guanajuato Capital/i, 'guanajuato'], [/\bLe[óo]n\b/i, 'leon'],
  [/Vancouver/i, 'vancouver'], [/Burnaby|Richmond,? B\.?C/i, 'vancouver'], [/Victoria,? B\.?C/i, 'victoria'],
  [/Washington,? D\.?C|\bDC\s*200/i, 'washingtondc'], [/Los Angeles/i, 'losangeles'], [/San Diego|Chula Vista/i, 'sandiego'], [/Phoenix/i, 'phoenix'], [/Meerbusch/i, 'dusseldorf'],
  [/広州|Guangzhou/i, 'guangzhou'], [/深セン|深圳|Shenzhen/i, 'shenzhen'], [/厦門|Xiamen/i, 'xiamen'], [/桂林|Guilin/i, 'guilin'],
];
const CATEGORY_LABEL = /^[（(【◎]?\s*(歯科|病院|医院|クリニック|総合病院|私立病院|公立病院|診療所|薬局|小児科|救急|入院|外来|主な|日本|邦人|外国人|医療|大規模|耳鼻|眼科|その他|[アイウエオカキクケコ]\s)/;
// The ministry writes names for a Japanese reader: "サクラクロスクリニック（Sakura Cross Clinic）",
// "Canossa Hospital カノッサ病院（嘉諾撤醫院）", "近藤毅医師 Dr. Takeshi KONDO". The directory wants the
// name the provider uses on its door, which is the Latin one where the ministry gives it. Where it
// gives none ("ノイゲバウア馬場内科クリニック") the name stays as listed. nameAsListed keeps the original.
const CJK = /[぀-ヿ㐀-鿿]/;
function cleanName(n) {
  let s = n.replace(/^[（(]\s*\d+\s*[）)]\s*/, '').replace(/^[アイウエオカキクケコサシスセソタチツテト]\s+/, '').trim();
  const dr = /(?:歯科)?医師[：:]\s*(.+)$/.exec(s); if (dr) s = dr[1]; // "大里 一雅（…）医師：Osato Medical Clinic"
  // Latin-first only if the Latin runs five letters before any Japanese: "DYMインターナショナル
  // クリニック（33/1院：プロンポン）" is a Japanese name, and its bracket is the branch, which stays.
  if (((s.split(CJK)[0] || '').match(/[A-Za-zÀ-ž]/g) || []).length >= 5) {
    let prev; do { prev = s; s = s.replace(/\s*[（(][^（）()]*[）)]/g, (m) => (CJK.test(m) ? '' : m)); } while (s !== prev);
    const cut = s.replace(/\s*[぀-ヿ㐀-鿿].*$/, '');
    if ((cut.match(/[A-Za-zÀ-ž]/g) || []).length >= 5) s = cut;
  } else {
    // only a Latin name the ministry gives WHOLE counts: a bracket with no Japanese in it, the part
    // after "／", or a trailing "Dr. ..."; "康辰医療（EurAmメディカルセンター）" is not "EurAm"
    const letters = (x) => (x.match(/[A-Za-zÀ-ž]/g) || []).length;
    const parts = [...s.matchAll(/[（(]([^（）()]*)[）)]/g)].map((m) => m[1])
      .concat(s.split(/[／/]/).slice(1), [(/\s((?:Dr|Dra|Prof)\.?\s.*)$/.exec(s) || [])[1] || ''])
      .map((x) => x.trim()).filter((x) => x && !CJK.test(x) && letters(x) >= 5);
    if (parts.length) s = parts.sort((a, b) => b.length - a.length)[0];
    else s = s.replace(/\s*[（(][^（）()]*[）)]\s*$/, (m) => (/^[\s（(]*(内科|歯科|小児科|産婦人科|神経内科|眼科|外科|皮膚科|耳鼻|整形)/.test(m) ? '' : m));
  }
  return s.replace(/[／/、,]\s*$/, '').trim();
}
// The address field; on some pages it is prefixed by a branch label ("ロサンゼルス 所在地：...").
function addrOf(e) {
  const f = e.fields.find((x) => /(^|\s)(所在地|住所)\s*[：:]/.test(x)) || '';
  return f.replace(/^.*?(所在地|住所)\s*[：:]\s*/, '');
}
// Places further than the distance rule above that the ministry lists under one of our cities:
// the factory estates an hour out of Jakarta, Torrance, Kuala Lumpur's satellite cities.
const EXCLUDE_ADDR = /Karawang|KIIC|Cikarang|Bekasi|Costa Mesa|Irvine|Torrance|Subang Jaya|Bandar Sunway|Petaling Jaya|Ara Damansara|Richmond Hill/i;
// Pages whose section 8 files providers of several cities under one list heading, so the address
// decides: the Los Angeles page's dentist list covers Los Angeles, Orange County and San Diego.
const PAGE_ADDR = new Set(['n_ame/losangeles.html']);
function cityOf(e) {
  const key = e.page.replace(/^.*\/medi\//, '');
  if (PAGE_NONE.has(key)) return null;
  const addr = addrOf(e) + ' ' + e.name;
  // In a German or French address the town is the word after the five-digit postcode, and a street
  // can carry another town's name ("Düsseldorfer Straße 10, 40667 Meerbusch"), so only that is read.
  const byAddr = () => {
    let where = addr;
    if (/^europe\/(germany|france)\.html$/.test(key)) {
      const pc = [...addrOf(e).matchAll(/\b\d{5}\s+([A-Za-zÀ-žß][A-Za-zÀ-žß .\-]*)/g)].pop();
      if (pc) where = pc[1];
    }
    for (const [re, id] of ADDR) if (re.test(where)) return id;
    return null;
  };
  if (PAGE_ADDR.has(key)) return byAddr();
  for (const h of e.history.slice().reverse()) {
    const hits = Object.keys(JA_PLACE).filter((k) => h.includes(k)).sort((a, b) => b.length - a.length);
    if (hits.length) { const v = JA_PLACE[hits[0]]; return v === '@addr' ? byAddr() : v; }
    if (CATEGORY_LABEL.test(h) || /^[（(]\d+[）)]/.test(h)) continue; // a list label: keep walking
    if (/(市|州|省|島|地区|地方)(（.*）)?$/.test(h)) return null; // an unmapped place: not ours
  }
  if (key in PAGE_DEFAULT) return PAGE_DEFAULT[key] === '@addr' ? byAddr() : PAGE_DEFAULT[key];
  return null;
}

const CATEGORY = [
  [/動物|獣医|ペット|[Vv]eterinar|[Aa]nimal|[Vv]et\b/, 'vet'],
  [/薬局|[Pp]harmac|[Ff]armac|[Dd]rug ?[Ss]tore|[Aa]potheke/, 'pharmacy'],
  [/歯科|デンタル|矯正|[Dd]ental|[Dd]entist|[Oo]dont|[Oo]rthodont|[Bb]races/, 'dentist'],
  [/カウンセ|心療|精神|[Pp]sycholog|[Pp]sychiat|[Cc]ounsel|[Mm]ental/, 'therapy'],
  [/理学療法|リハビリ|[Pp]hysio|カイロ|[Cc]hiropract|[Oo]steopa/, 'physio'],
  [/眼鏡|[Oo]ptic|[Oo]ptom/, 'optician'],
];
function categoryOf(e) {
  const name = e.name;
  for (const [re, c] of CATEGORY) if (re.test(name)) return c === 'pharmacy' && /クリニック|[Cc]linic|病院|[Hh]ospital/.test(name) ? 'doctor' : c;
  const h = e.heads.slice(-1)[0] || '';
  // "日本語が通じる総合診療・歯科" heads a list of GPs AND dentists: only a heading that is about
  // dentists alone makes its entries dentists
  if (/歯科|[Dd]ental/.test(h) && !/総合|診療・|医療機関|病院/.test(h)) return 'dentist';
  if (/薬局/.test(h)) return 'pharmacy';
  if (/動物|獣医/.test(h)) return 'vet';
  return 'doctor';
}

const SOURCE = {
  publisher: 'Ministry of Foreign Affairs of Japan (外務省)',
  url: INDEX,
  licenceOrTermsQuote: '本ウェブサイトに掲載している情報（以下、「本コンテンツ」といいます。）の著作権は、特記されていない限り当省に帰属し、権利表記の記載がない限り「公共データ利用規約（第1.0版）（デジタル庁ウェブサイト）」（PDL1.0）が適用されます。 ... 本コンテンツを利用する際は、出典を記載してください。 ... 本コンテンツを編集・加工等して利用する場合は、上記出典とは別に、編集・加工等を行ったことを記載してください。 ... 編集・加工した情報を、あたかも外務省が作成したかのような態様で公表・利用してはいけません。 (www.mofa.go.jp/mofaj/annai/legalmatters/index.html, dated 令和8年2月19日)',
  attribution: 'Source: Ministry of Foreign Affairs of Japan, 世界の医療事情 (www.mofa.go.jp/mofaj/toko/medi/), translated and edited by thenomadhq',
  pageNote: "Japan's Ministry of Foreign Affairs publishes a medical guide for each country, written by its medical attaches for Japanese people living abroad. It names the hospitals and clinics where a patient can be seen in Japanese, by Japanese-speaking staff or an on-site interpreter.",
};

function propose() {
  const entries = JSON.parse(fs.readFileSync(path.join(CACHE, 'entries.json'), 'utf8'));
  const decisions = val('--decisions') ? JSON.parse(fs.readFileSync(val('--decisions'), 'utf8')) : {};
  const cities = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs')).CITY;
  const rows = []; const refused = [];
  for (const e of entries) {
    const key = e.pageName + '#' + e.name;
    const refuse = (why, extra) => refused.push({ key, page: e.page, heads: e.heads, name: e.name, why, ...extra });
    const city = cityOf(e);
    const langs = new Map(); // code -> {interp, clause}
    const no = new Set();
    // A negation or a hedge anywhere in the block beats a plain claim elsewhere in it: "日本語での
    // 診療アシスタンス" next to "有料で日本語通訳サービスの利用が可能" is a paid outside service.
    // The few blocks where that is wrong are overridden by hand in --decisions, with the reason.
    for (const c of e.own) {
      if (c.verdict === 'no' || c.verdict === 'hedge') no.add(c.code);
      else if (c.verdict === 'yes') { const prev = langs.get(c.code); if (!prev || (prev.interp && !c.interp)) langs.set(c.code, c); }
    }
    for (const c of e.scope) if (c.verdict === 'yes' && !langs.has('ja') && !no.has('ja')) langs.set('ja', { ...c, scope: true });
    const d = decisions[key] || {};
    for (const [code, v] of Object.entries(d)) if (v === true) no.delete(code);
    for (const n of no) langs.delete(n);
    // The clause splitter can part a hedge from its language ("一部の医師、スタッフは英語、仏語…"
    // loses its 一部), so Japanese is also judged on the whole block: any hedge, interpreter, help
    // desk, staff or nurse wording anywhere in it takes Japanese back, as the audit did by hand.
    const whole = [e.name, ...(e.fields || [])].join(' ');
    if (!d.ja && (STAFF_ONLY.test(whole) || HEDGE.test(whole))) langs.delete('ja');
    for (const [code, v] of Object.entries(d)) if (v === false) langs.delete(code);
    if (d.refuse) { refuse('manual: ' + d.reason, {}); continue; }
    if (city && EXCLUDE_ADDR.test(addrOf(e))) { refuse('outside-city: ' + addrOf(e).slice(0, 80), {}); continue; }
    if (!langs.has('ja')) {
      const nat = /日本人(医師|スタッフ|看護師|常駐|職員|通訳|医|歯科医|コーディネ)/.test(e.name + e.fields.join(' '));
      refuse(nat ? 'nationality-not-language' : (e.own.some((c) => c.code === 'ja' && c.verdict === 'hedge') ? 'japanese-hedged' : (no.has('ja') ? 'japanese-negated' : 'no-japanese-claim')),
        { clauses: e.own.filter((c) => c.code === 'ja').map((c) => c.verdict + ': ' + c.clause) });
      continue;
    }
    if (!city) { refuse('city-not-ours', {}); continue; }
    if (!cities[city]) { refuse('city-id-unknown ' + city, {}); continue; }
    const local = localLangs(cities[city].country, cities[city].iso);
    const codes = [...langs.keys()].filter((c) => !local.has(c));
    if (codes.length > 6) { refuse('more-than-6-languages', {}); continue; }
    const ja = langs.get('ja');
    // the list heading, where there is one, comes first: it is the ministry's own claim for the whole
    // list, and the block's own words (often just a phone line) follow it
    const scopeYes = e.scope.find((c) => c.verdict === 'yes');
    const withScope = !ja.scope && scopeYes && !no.has('ja');
    const quote = (withScope ? scopeYes.clause + ' / ' : '') + [...langs.entries()].filter(([c]) => codes.includes(c)).map(([, v]) => v.clause).filter((x, i, a) => a.indexOf(x) === i).join(' / ');
    const addr = addrOf(e);
    rows.push({
      city, name: d.name || cleanName(e.name), nameAsListed: e.name, category: d.category || categoryOf(e),
      languages: codes.sort((a, b) => (a === 'ja' ? -1 : b === 'ja' ? 1 : a.localeCompare(b))),
      url: e.url || undefined, sourceUrl: e.page, evidence: 'official', checked: TODAY,
      area: addr || undefined,
      quote,
      // how the Japanese claim is made: in the provider's own block, or by the heading of the list it
      // is on; and whether it is interpretation rather than Japanese-speaking clinicians
      japaneseVia: ja.scope ? 'list-heading' : withScope ? 'entry+list-heading' : 'entry', interpreter: !!ja.interp,
      pageDate: e.pageDate,
    });
  }
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ source: SOURCE, written: TODAY, rows }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(rows.length, 'rows,', refused.length, 'refused');
}

// Exported for per-page readers of the embassy and consulate lists, which say the same things in
// the same words but are laid out differently on every site.
module.exports = { langClaims, cleanName, localLangs, SOURCE };

if (require.main === module) (async () => {
  if (cmd === 'fetch') await fetchAll();
  else if (cmd === 'parse') parseAll();
  else if (cmd === 'propose') propose();
  else console.log('usage: fetch | parse | propose  --cache <dir>');
})();

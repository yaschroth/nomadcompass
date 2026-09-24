/**
 * Reads the bar associations' own lawyer register, ひまわりサーチ, for the lawyers in our Japanese
 * cities who report a foreign language they can work in.
 *
 * WHY THIS SOURCE
 *
 * ひまわりサーチ (www.bengoshikai.jp/search) is the lawyer information service the Japan Federation
 * of Bar Associations runs together with each local bar association. Every Japanese lawyer must
 * belong to a bar association (Attorney Act, art. 8 and 9), so the publisher is a statutory body,
 * and the per-lawyer field 外国語能力 ("foreign language ability") is filled in by the lawyer
 * himself: the consent screen says the information is "各弁護士の自己申告に基づくもの". A claim by
 * a named provider, published by a statutory chamber, is the official tier.
 *
 * TERMS
 *
 * The consent screen of every bar we read (Tokyo, Osaka, Kyoto, Aichi, Kanazawa, Hiroshima, Fukuoka,
 * Sapporo; read 2026-09-24) disclaims accuracy and recommendation and says nothing about reuse.
 * The JFBA's site terms (nichibenren.or.jp/copyright/guide/about.html) allow "引用・転載複製" with
 * the source named, which the page note does. robots.txt disallows only /kyujin/.
 * One exception is held back, not read around: the Kyoto Bar's OWN search (kyotoben.or.jp/search)
 * forbids "一切の無断転載・利用", and Kyoto's lawyers are the same people. Their rows are written to
 * held.json, not proposals.json, until the Kyoto Bar is asked.
 *
 * THE RULE
 *
 * 外国語能力 is free text ("英語", "英語（ビジネスレベル）", "英語・中国語（日常会話程度）"). A language
 * the lawyer names is the claim. A hedge in the bracket right after a language, or glued to it
 * ("中国語少々"), drops that language, and reaches back over a bare "・" to the one before it
 * ("英・西(日常会話程度)"); a hedge anywhere else in the field drops them all, because it cannot be
 * told which one it was about (HEDGE below: 日常会話程度 "conversation level", 簡単な "simple", 読み書きのみ "reading and
 * writing only", 勉強中 "studying", 通訳 "via an interpreter"). Japanese is never published. More
 * than 6 languages is refused whole. Anything not a language name we know is reported, never guessed.
 *
 * TRAPS
 *
 * - The search is a substring match on the free text, and case-sensitive: "English" found 10 Tokyo
 *   lawyers and "english" none. The one query that catches almost everything is "語" (the character
 *   ending every language name in Japanese), plus Latin and single-kanji spellings (英, 中, 韓).
 * - More than 200 hits shows no list at all ("検索結果が200件を越えました"), silently. A capped query
 *   is split by office address and re-run; a split that is still capped is logged as incomplete.
 * - The office-address filter is a substring match too: "大阪市" matches 東大阪市 and "広島市" matches
 *   東広島市. The city is therefore decided from the detail page's address, anchored at the start
 *   (CITIES below), never from the query that found the lawyer.
 * - The list page needs the whole search form posted again (the conditions are not kept in the
 *   session), and a session cookie from the consent and form pages first. Detail pages are plain GETs.
 * - The form field is posted as UTF-8; curl from Git Bash on Windows sent the kanji mangled and the
 *   search quietly answered 0.
 *
 *   list     node scripts/read_japan_nonmed.cjs list --cache <dir>
 *   fetch    node scripts/read_japan_nonmed.cjs fetch --cache <dir>
 *   propose  node scripts/read_japan_nonmed.cjs propose --cache <dir> [--out <dir>]
 *              writes proposals.json (brief format), held.json and refused.json.
 * There is no ingest step here; the proposals go through review first.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://www.bengoshikai.jp/search/';
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'himawari')));
const OUT = path.resolve(val('--out', CACHE));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

const TOKYO_WARDS = { 千代田: 'Chiyoda', 中央: 'Chuo', 港: 'Minato', 新宿: 'Shinjuku', 文京: 'Bunkyo', 台東: 'Taito', 墨田: 'Sumida', 江東: 'Koto', 品川: 'Shinagawa', 目黒: 'Meguro', 大田: 'Ota', 世田谷: 'Setagaya', 渋谷: 'Shibuya', 中野: 'Nakano', 杉並: 'Suginami', 豊島: 'Toshima', 北: 'Kita', 荒川: 'Arakawa', 板橋: 'Itabashi', 練馬: 'Nerima', 足立: 'Adachi', 葛飾: 'Katsushika', 江戸川: 'Edogawa' };
// Wards of the designated cities, for the card's area line. A ward not here leaves the area empty.
const WARDS = {
  osaka: { 都島: 'Miyakojima', 福島: 'Fukushima', 此花: 'Konohana', 西: 'Nishi', 港: 'Minato', 大正: 'Taisho', 天王寺: 'Tennoji', 浪速: 'Naniwa', 西淀川: 'Nishiyodogawa', 東淀川: 'Higashiyodogawa', 東成: 'Higashinari', 生野: 'Ikuno', 旭: 'Asahi', 城東: 'Joto', 阿倍野: 'Abeno', 住吉: 'Sumiyoshi', 東住吉: 'Higashisumiyoshi', 西成: 'Nishinari', 淀川: 'Yodogawa', 鶴見: 'Tsurumi', 住之江: 'Suminoe', 平野: 'Hirano', 北: 'Kita', 中央: 'Chuo' },
  kyoto: { 北: 'Kita', 上京: 'Kamigyo', 左京: 'Sakyo', 中京: 'Nakagyo', 東山: 'Higashiyama', 下京: 'Shimogyo', 南: 'Minami', 右京: 'Ukyo', 伏見: 'Fushimi', 山科: 'Yamashina', 西京: 'Nishikyo' },
  fukuoka: { 東: 'Higashi', 博多: 'Hakata', 中央: 'Chuo', 南: 'Minami', 西: 'Nishi', 城南: 'Jonan', 早良: 'Sawara' },
  sapporo: { 中央: 'Chuo', 北: 'Kita', 東: 'Higashi', 白石: 'Shiroishi', 豊平: 'Toyohira', 南: 'Minami', 西: 'Nishi', 厚別: 'Atsubetsu', 手稲: 'Teine', 清田: 'Kiyota' },
  nagoya: { 千種: 'Chikusa', 東: 'Higashi', 北: 'Kita', 西: 'Nishi', 中村: 'Nakamura', 中: 'Naka', 昭和: 'Showa', 瑞穂: 'Mizuho', 熱田: 'Atsuta', 中川: 'Nakagawa', 港: 'Minato', 南: 'Minami', 守山: 'Moriyama', 緑: 'Midori', 名東: 'Meito', 天白: 'Tempaku' },
  hiroshima: { 中: 'Naka', 東: 'Higashi', 南: 'Minami', 西: 'Nishi', 安佐南: 'Asaminami', 安佐北: 'Asakita', 安芸: 'Aki', 佐伯: 'Saeki' },
  kobe: { 東灘: 'Higashinada', 灘: 'Nada', 兵庫: 'Hyogo', 長田: 'Nagata', 須磨: 'Suma', 垂水: 'Tarumi', 北: 'Kita', 中央: 'Chuo', 西: 'Nishi' },
  sendai: { 青葉: 'Aoba', 宮城野: 'Miyagino', 若林: 'Wakabayashi', 太白: 'Taihaku', 泉: 'Izumi' },
};

// Our Japanese cities (scripts/lib/service_data.cjs CITY), the bar association that covers each, and
// the address a lawyer's office must START with to be in it. The prefecture is optional because a
// few lawyers leave it off; the anchor is what keeps 東大阪市 out of Osaka and 東広島市 out of Hiroshima.
const CITIES = [
  ['tokyo', 1, '東京都', '(?:' + Object.keys(TOKYO_WARDS).join('|') + ')区'],
  ['osaka', 14, '大阪府', '大阪市'], ['kyoto', 15, '京都府', '京都市'], ['kobe', 16, '兵庫県', '神戸市'],
  ['nara', 17, '奈良県', '奈良市'], ['koyasan', 19, '和歌山県', '伊都郡高野町'], ['nagoya', 20, '愛知県', '名古屋市'],
  ['takayama', 22, '岐阜県', '高山市'], ['shirakawago', 22, '岐阜県', '大野郡白川村'], ['kanazawa', 24, '石川県', '金沢市'],
  ['hiroshima', 26, '広島県', '広島市'], ['okayama', 28, '岡山県', '岡山市'], ['kurashiki', 28, '岡山県', '倉敷市'],
  ['matsue', 30, '島根県', '松江市'], ['fukuoka', 31, '福岡県', '福岡市'], ['nagasaki', 33, '長崎県', '長崎市'],
  ['kumamoto', 35, '熊本県', '熊本市'], ['kagoshima', 36, '鹿児島県', '鹿児島市'], ['naha', 38, '沖縄県', '那覇市'],
  ['sendai', 39, '宮城県', '仙台市'], ['aomori', 44, '青森県', '青森市'], ['sapporo', 45, '北海道', '札幌市'],
  ['hakodate', 46, '北海道', '函館市'], ['takamatsu', 49, '香川県', '高松市'], ['matsuyama', 52, '愛媛県', '松山市'],
  ['matsumoto', 12, '長野県', '松本市'], ['kamakura', 4, '神奈川県', '鎌倉市'], ['hakone', 4, '神奈川県', '足柄下郡箱根町'],
  ['nikko', 8, '栃木県', '日光市'],
].map(([city, kai, pref, local]) => ({ city, kai, pref, local, re: new RegExp('^(?:' + pref + ')?' + local) }));
const HELD_CITIES = new Set(['kyoto']);

// Search terms. "語" alone finds nearly everyone; the rest catch what is written without it.
const TERMS = ['語', '英', '中', '韓', '仏', '独', '西', '露', 'English', 'ENGLISH', 'english', 'Chinese', 'Korean',
  'French', 'German', 'Spanish', 'Portuguese', 'Russian', 'Italian', 'Vietnamese', 'Thai', '中文', '한국어', 'Español', 'Français', 'Deutsch'];

// ---- http with a session ------------------------------------------------------
let cookie = '';
async function req(url, body) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'User-Agent': UA, Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body ? new URLSearchParams(body).toString() : undefined,
        signal: AbortSignal.timeout(30000),
      });
      for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) {
        const kv = c.split(';')[0]; const k = kv.split('=')[0];
        cookie = cookie.split('; ').filter((x) => x && !x.startsWith(k + '=')).concat(kv).join('; ');
      }
      if (r.status === 200) return await r.text();
    } catch (e) { /* retried */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}
const flat = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).normalize('NFKC').replace(/\s+/g, ' ').trim();

async function openKai(kai) {
  cookie = '';
  await req(BASE + '?kai_code=' + kai);
  await req(BASE + 'form.php', { action_search_form: 'true', kai_code: String(kai) });
}
async function search(kai, addr, term) {
  const f = { office_addr: addr, foreign_language: term, kai_code: String(kai), cond_if: 'AND', member_section: '', hometown_pref_id: '' };
  const t = await req(BASE + 'result.php', { ...f, action_search_result: 'true' });
  if (!t) return { error: true };
  const x = flat(t);
  if (/200件を越え/.test(x)) return { capped: true };
  const n = Number((x.match(/(\d+)人が該当/) || [])[1] || 0);
  if (!n) return { n: 0, ids: [] };
  await sleep(500);
  const l = await req(BASE + 'list.php', { ...f, action_search_list: 'true', mode: '', 'submit[list]': '氏名の一覧を表示する' });
  const ids = [...new Set([...(l || '').matchAll(/detail\.php\?kai_code=(\d+)&(?:amp;)?id=(\d+)/g)].map((m) => m[1] + '|' + m[2]))];
  return { n, ids };
}

// ---- list -----------------------------------------------------------------------
async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const F = path.join(CACHE, 'list.json');
  const S = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { done: {}, ids: {}, incomplete: [] };
  const kais = [...new Set(CITIES.map((c) => c.kai))];
  for (const kai of kais) {
    await openKai(kai);
    const splits = kai === 1 ? Object.keys(TOKYO_WARDS).map((w) => w + '区') : CITIES.filter((c) => c.kai === kai).map((c) => c.local.replace(/^.*郡/, ''));
    for (const term of TERMS) {
      const key = kai + '|' + term;
      if (S.done[key]) continue;
      let r = await search(kai, '', term);
      await sleep(600);
      const got = [];
      if (r.capped) {
        for (const addr of splits) {
          const s = await search(kai, addr, term);
          await sleep(600);
          if (s.capped || s.error) S.incomplete.push({ kai, term, addr, why: s.capped ? 'still over 200' : 'no answer' });
          else got.push(...s.ids);
        }
      } else if (r.error) { S.incomplete.push({ kai, term, why: 'no answer' }); continue; } else got.push(...r.ids);
      for (const id of got) (S.ids[id] = S.ids[id] || []).push(term);
      S.done[key] = { n: r.capped ? 'capped, split' : r.n, ids: got.length };
      fs.writeFileSync(F, JSON.stringify(S));
      console.log(`kai ${kai} ${term}: ${r.capped ? 'capped, split' : r.n} -> ${got.length} ids (total ${Object.keys(S.ids).length})`);
    }
  }
  console.log(`${Object.keys(S.ids).length} lawyers, ${S.incomplete.length} incomplete queries`);
}

// ---- fetch ------------------------------------------------------------------------
const cachePath = (id) => path.join(CACHE, 'pages', id.replace('|', '_') + '.html.gz');
const detailUrl = (id) => { const [k, i] = id.split('|'); return `${BASE}detail.php?kai_code=${k}&id=${i}`; };
async function fetchAll() {
  const S = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const todo = Object.keys(S.ids).filter((id) => !fs.existsSync(cachePath(id)));
  console.log(`${todo.length} pages to fetch`);
  let ok = 0; let bad = 0;
  for (const id of todo) {
    const t = await req(detailUrl(id));
    if (t && t.includes('詳細情報')) { fs.writeFileSync(cachePath(id), zlib.gzipSync(t)); ok += 1; } else bad += 1;
    if ((ok + bad) % 50 === 0) console.log(`  ${ok + bad}/${todo.length}`);
    await sleep(500);
  }
  console.log(`fetched ${ok}, failed ${bad}`);
}

// ---- parse --------------------------------------------------------------------------
function cell(html, label) {
  const m = html.match(new RegExp('<th[^>]*>\\s*' + label + '\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>'));
  return m ? m[1] : null;
}
function parsePage(html) {
  const h4 = flat((html.match(/<h4>([\s\S]*?)<\/h4>/) || [])[1]);
  const m = h4.match(/^(.*?)\((.*?)\)\s*登録番号\s*(\d+)\s*(.*)$/) || [];
  const addrRaw = flat(cell(html, '事務所所在地') || '').replace(/\s*地図\s*$/, '');
  const hp = (cell(html, 'HPアドレス') || '').match(/href="(https?:\/\/[^"]+)"/);
  return {
    name: (m[1] || h4).trim(), kana: (m[2] || '').trim(), reg: m[3] || '', kind: (m[4] || '').trim(),
    zip: (addrRaw.match(/〒?\s*(\d{7})/) || [])[1] || '',
    address: addrRaw.replace(/^〒?\s*\d{7}\s*/, '').replace(/地図(画像)?\s*$/, '').replace(/\s+/g, ''),
    office: flat(cell(html, '事務所名') || ''),
    langText: flat(cell(html, '外国語能力') || ''),
    homepage: hp ? hp[1] : null,
    updated: (flat(cell(html, '最終更新日') || '').match(/\d{4}\.\d{2}\.\d{2}/) || [''])[0].replace(/\./g, '-'),
  };
}

// Longest spellings first, so 韓国・朝鮮語 is read before 朝鮮語 and 中国語 before 中.
const LANG = [
  ['韓国・朝鮮語', 'ko'], ['韓国(朝鮮)語', 'ko'], ['朝鮮(韓国)語', 'ko'], ['韓国朝鮮語', 'ko'], ['韓国語', 'ko'], ['朝鮮語', 'ko'], ['ハングル', 'ko'], ['한국어', 'ko'], ['Korean', 'ko'],
  ['中国語', 'zh'], ['北京語', 'zh'], ['広東語', 'zh'], ['台湾語', 'zh'], ['普通話', 'zh'], ['中文', 'zh'], ['Chinese', 'zh'], ['Mandarin', 'zh'], ['Cantonese', 'zh'],
  ['英会話', 'en'], ['英語', 'en'], ['英検', 'en'], ['TOEIC', 'en'], ['TOEFL', 'en'], ['IELTS', 'en'], ['English', 'en'], ['ENGLISH', 'en'], ['english', 'en'],
  ['フランス語', 'fr'], ['仏語', 'fr'], ['French', 'fr'], ['Français', 'fr'], ['ドイツ語', 'de'], ['独語', 'de'], ['German', 'de'], ['Deutsch', 'de'],
  ['スペイン語', 'es'], ['西語', 'es'], ['Spanish', 'es'], ['Español', 'es'], ['ポルトガル語', 'pt'], ['Portuguese', 'pt'],
  ['ロシア語', 'ru'], ['露語', 'ru'], ['Russian', 'ru'], ['イタリア語', 'it'], ['伊語', 'it'], ['Italian', 'it'],
  ['ベトナム語', 'vi'], ['Vietnamese', 'vi'], ['タイ語', 'th'], ['Thai', 'th'], ['タガログ語', 'tl'], ['フィリピン語', 'tl'], ['フィリピノ語', 'tl'],
  ['インドネシア語', 'id'], ['マレー語', 'ms'], ['マレーシア語', 'ms'], ['ネパール語', 'ne'], ['ヒンディー語', 'hi'], ['ヒンディ語', 'hi'],
  ['アラビア語', 'ar'], ['ペルシャ語', 'fa'], ['ペルシア語', 'fa'], ['トルコ語', 'tr'], ['ウクライナ語', 'uk'], ['ポーランド語', 'pl'],
  ['オランダ語', 'nl'], ['ミャンマー語', 'my'], ['ビルマ語', 'my'], ['ヘブライ語', 'he'], ['スウェーデン語', 'sv'], ['デンマーク語', 'da'],
  ['ノルウェー語', 'no'], ['フィンランド語', 'fi'], ['ギリシャ語', 'el'], ['チェコ語', 'cs'], ['ハンガリー語', 'hu'], ['ルーマニア語', 'ro'],
  ['ウルドゥー語', 'ur'], ['ベンガル語', 'bn'], ['クメール語', 'km'], ['カンボジア語', 'km'], ['シンハラ語', 'si'], ['タミル語', 'ta'], ['スワヒリ語', 'sw'], ['セルビア語', 'sr'],
  ['クロアチア語', 'hr'], ['ブルガリア語', 'bg'], ['パンジャブ語', 'pa'], ['カタルーニャ語', 'ca'], ['ジョージア語', 'ka'], ['グルジア語', 'ka'],
  // Single kanji abbreviations ("英・中"), read only when they stand alone between separators, so
  // that 中級 (intermediate) is not Chinese and 西日本 is not Spanish.
  ['英', 'en', true], ['中', 'zh', true], ['韓', 'ko', true], ['仏', 'fr', true], ['独', 'de', true], ['西', 'es', true], ['露', 'ru', true], ['伊', 'it', true],
];
const NOT_A_LANGUAGE = /日本語|ラテン語|漢文|古典|言語$|外国語$/; // named but not a claim we publish, or a label ("対応言語:")
// Hedges, read on the register's own entries (2026-09-24): "英語(日常会話程度)", "英語を少々",
// "英語がカタコト程度", "英語(一般的な読み書き程度)", "英語対応(初歩レベル)可", "中国語(基本)",
// "English(not fluently)", "English/enough to communicate with", and "出来るだけ英語に触れるよう
// 努力しております" (I try to be exposed to English as much as I can), which is not a claim at all.
const HEDGE = /日常会話|会話程度|程度|簡単|少し|多少|片言|カタコト|初級|初歩|基礎|基本|読み書き|読解|読むこと|書面のみ|文書のみ|翻訳のみ|のみ可|通訳(?:を介|を通|同伴|が必要|必要|利用)|翻訳機|アプリ|要相談|ご相談|事前に|勉強中|学習中|少々|若干|やや|不自由|挨拶|できる範囲|可能な範囲|努力|not fluent|basic|a little|a bit|limited|conversational|enough to/i;
// A bracket that is one of these is a hedge too: "ドイツ語(読)" is German, reading only.
const BRACKET_HEDGE = /^(読|書|読み|書き|読み書き|読解)$/;
const SEP = '[\\s、,，・/／;；()（）「」\\[\\]:：。]';
const SEP_RE = new RegExp(SEP);
function readLangs(text) {
  const src = String(text || '').normalize('NFKC');
  let rest = src;
  const found = []; // { code, name, start, end }
  for (const [name, code, single] of LANG) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = single ? new RegExp('(^|' + SEP + ')' + esc + '(?=$|' + SEP + ')', 'g') : new RegExp(esc, 'g');
    let m;
    while ((m = re.exec(rest))) {
      const start = m.index + (single ? m[1].length : 0);
      found.push({ code, name, start, end: start + name.length });
      rest = rest.slice(0, start) + '\u0000'.repeat(name.length) + rest.slice(start + name.length);
      re.lastIndex = 0;
    }
  }
  found.sort((a, b) => a.start - b.start);
  // What qualifies one language: a bracket right after it that names no other language
  // ("英語(ビジネスレベル)"), or the words glued to it up to the next separator ("中国語少々").
  // "英語 (中国語少々)" is not a bracket about English: it holds another language, so it is left to
  // that language, and the first run had published it as Chinese only.
  const blank = rest.split('');
  for (const f of found) {
    const after = rest.slice(f.end);
    const b = after.match(/^\s*[(（]([^)）]*)[)）]/);
    if (b && !b[1].includes('\u0000')) {
      f.qual = b[1];
      for (let i = f.end; i < f.end + b[0].length; i += 1) blank[i] = ' ';
    } else {
      let j = 0;
      while (j < after.length && !SEP_RE.test(after[j]) && after[j] !== '\u0000') j += 1;
      f.qual = after.slice(0, j);
      for (let i = f.end; i < f.end + j; i += 1) blank[i] = ' ';
    }
    f.hedged = HEDGE.test(f.qual) || BRACKET_HEDGE.test(f.qual.trim());
  }
  // "英・西(日常会話程度)" and "英語・韓国語日常会話程度" most naturally put both languages at that
  // level, so a hedge on a language reaches back over a bare "・" or "/" to the one before it.
  for (let i = found.length - 1; i > 0; i -= 1) {
    const between = src.slice(found[i - 1].end, found[i].start);
    if (found[i].hedged && !found[i - 1].qual && /^\s*[・/／]\s*$/.test(between)) found[i - 1].hedged = true;
  }
  // Whatever is left once language names and their own qualifiers are blanked out is about all of
  // them ("ある程度の英語案件には対応致します").
  const leftover = blank.join('').replace(/\u0000/g, ' ').replace(/[\s、,，・/／;；()（）「」\[\]:：。]+/g, ' ').trim();
  const globalHedge = HEDGE.test(leftover);
  // One hedged mention takes the language back even if it is also named plainly: in
  // "英検2級、TOEIC605点程度の英語能力" the TOEIC score is the level he claims for his English.
  const hedgedCodes = new Set(found.filter((f) => f.hedged).map((f) => f.code));
  const kept = found.filter((f) => !globalHedge && !hedgedCodes.has(f.code));
  const unknownWords = leftover.split(' ').filter((w) => /語$/.test(w) && !NOT_A_LANGUAGE.test(w));
  return {
    codes: [...new Set(kept.map((f) => f.code))],
    listed: [...new Set(found.map((f) => f.code))],
    hedged: globalHedge ? 'all' : found.filter((f) => f.hedged).map((f) => f.name + (f.qual ? '(' + f.qual + ')' : '')),
    unknown: unknownWords,
  };
}
const MAX_LANGS = 6;

function cityOf(address) {
  const a = String(address || '').normalize('NFKC');
  return CITIES.find((c) => c.re.test(a)) || null;
}
function areaOf(city, address) {
  const a = String(address || '').normalize('NFKC');
  if (city === 'tokyo') { const w = (a.match(/^(?:東京都)?(.+?)区/) || [])[1]; return TOKYO_WARDS[w] ? TOKYO_WARDS[w] + ' ward' : undefined; }
  const map = WARDS[city];
  if (!map) return undefined;
  const w = (a.match(/市(.+?)区/) || [])[1];
  return map[w] ? map[w] + ' ward' : undefined;
}

// ---- propose ---------------------------------------------------------------------------
const PAGE_NOTE = 'Some of these lawyers are on ひまわりサーチ, the lawyer information service run by the Japan ' +
  'Federation of Bar Associations and each local bar association, where the lawyer states the foreign ' +
  'languages they work in. Languages the lawyer qualifies as conversational, basic or through an interpreter are left out.';
const INHOUSE = /株式会社|有限会社|合同会社|法務部|法務室|Inc\.?|Ltd|Corporation|銀行|省|庁|機構|大学/i;
const PRACTICE = /法律事務所|弁護士法人|法律|Law|Legal|特許|外国法共同事業/i;
const bare = (u) => String(u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
function propose() {
  // Rows already in the directory, by office website, so a lawyer whose firm the FCDO already lists
  // under its English name is flagged for the ingest to merge rather than listed twice.
  const existing = new Map();
  try {
    for (const p of JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8')).providers) {
      if (p.url) existing.set(p.city + '|' + p.category + '|' + bare(p.url), p.name);
    }
  } catch (e) { /* nothing to compare with */ }
  const S = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  const rows = []; const held = []; const refused = []; const tally = {};
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  for (const id of Object.keys(S.ids)) {
    const f = cachePath(id);
    if (!fs.existsSync(f)) { count('not fetched'); continue; }
    const o = parsePage(zlib.gunzipSync(fs.readFileSync(f)).toString());
    const c = cityOf(o.address);
    if (!c) { count('office outside our cities'); continue; }
    // In-house counsel: the register lists them with a company address and either no office name or
    // an office that is a company or its legal department (セブン-イレブン・ジャパン法務部, an insurance
    // broker in Marunouchi). They act for their employer only, so a reader cannot hire them.
    if (!o.office || (INHOUSE.test(o.office) && !PRACTICE.test(o.office))) {
      count('in-house counsel'); refused.push({ id, name: o.name, city: c.city, text: o.office || o.address, why: 'in-house counsel' }); continue;
    }
    const L = readLangs(o.langText);
    if (L.unknown.length) refused.push({ id, name: o.name, city: c.city, text: o.langText, why: 'unmapped: ' + L.unknown.join(',') });
    const langs = L.codes.filter((x) => x !== 'ja');
    if (!L.listed.length) { count('no language named'); if (o.langText) refused.push({ id, name: o.name, city: c.city, text: o.langText, why: 'no language we can name' }); continue; }
    if (!langs.length) { count('every language hedged'); refused.push({ id, name: o.name, city: c.city, text: o.langText, why: 'hedge' }); continue; }
    if (L.listed.length > MAX_LANGS) { count('more than 6 languages'); refused.push({ id, name: o.name, city: c.city, text: o.langText, why: L.listed.length + ' languages' }); continue; }
    const row = {
      city: c.city,
      name: o.name,
      category: 'legal',
      languages: langs,
      ...(o.homepage ? { url: o.homepage } : {}),
      sourceUrl: detailUrl(id).replace('detail.php?', 'detail.php?'),
      evidence: 'official',
      checked: fs.statSync(f).mtime.toISOString().slice(0, 10),
      ...(areaOf(c.city, o.address) ? { area: areaOf(c.city, o.address) } : {}),
      quote: '外国語能力: ' + o.langText,
      office: o.office, nameKana: o.kana, registration: o.reg, memberKind: o.kind, address: o.address, sourceUpdated: o.updated,
      ...(Array.isArray(L.hedged) && L.hedged.length ? { droppedAsHedged: L.hedged } : {}),
    };
    const dup = o.homepage && existing.get(c.city + '|legal|' + bare(o.homepage));
    if (dup) row.possibleDuplicateOf = dup;
    if (HELD_CITIES.has(c.city)) { held.push(row); count('held (Kyoto Bar terms)'); continue; }
    rows.push(row); count('proposed');
  }
  const source = {
    publisher: 'Japan Federation of Bar Associations and local bar associations (ひまわりサーチ)',
    url: 'https://www.bengoshikai.jp/search_area.html',
    licenceOrTermsQuote: '当サイトの内容の全部又は一部については、私的使用又は引用等著作権法上認められた行為として、適宜の方法により出所を明示することにより、引用・転載複製を行うことが出来ます。 (JFBA, nichibenren.or.jp/copyright/guide/about.html). Each bar\'s consent screen: 本サービスによって提供される情報は、各弁護士の自己申告に基づくもの (no reuse clause).',
    pageNote: PAGE_NOTE,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify({ source, written: TODAY, rows }, null, 1));
  fs.writeFileSync(path.join(OUT, 'held.json'), JSON.stringify({ why: 'Kyoto Bar own search forbids 一切の無断転載・利用 (kyotoben.or.jp/search/attention.cfm); ask first', source, rows: held }, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(tally);
  const by = {}; const bl = {};
  rows.forEach((r) => { by[r.city] = (by[r.city] || 0) + 1; r.languages.forEach((l) => { bl[l] = (bl[l] || 0) + 1; }); });
  console.log(by); console.log(bl);
  if (S.incomplete && S.incomplete.length) console.log('incomplete queries:', S.incomplete);
}

if (require.main === module) {
  const run = { list, fetch: fetchAll, propose }[cmd];
  if (!run) { console.error('usage: node scripts/read_japan_nonmed.cjs list|fetch|propose --cache <dir> [--out <dir>]'); process.exit(2); }
  Promise.resolve(run()).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { readLangs, cityOf, parsePage };

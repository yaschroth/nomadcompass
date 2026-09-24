/**
 * Reads the official rolls of sworn, court and authorised translators that governments in Asia, the
 * Middle East and Africa publish, and proposes a translator row for each person (or office) the roll
 * places in one of our cities. The European, Latin American, Quebec and Korean rolls are read by
 * scripts/read_translator_registers.cjs; this is the second half, one reader per roll shape:
 *
 *   tr-bbk  Turkey, Ministry of Justice, the regional expert-witness lists ("Bolge Bilirkisi
 *           Listesi") of the Bilirkisilik Bolge Kurullari. Translation is expertise field 37
 *           (MUTERCIM-TERCUMANLIK), and every translator carries one sub-field per language
 *           ("37.01.05 INGILIZCE"). Each line gives il/ilce (province/district). Seven regions:
 *           Istanbul, Izmir, Ankara, Antalya, Gaziantep, Samsun, Trabzon.
 *   tr-cmk  Turkey, the provincial Justice Commissions' yearly interpreter lists under the Criminal
 *           Procedure Code (art. 202, CMK tercuman listesi), published as a notice by each
 *           courthouse. Izmir, Gaziantep, Mardin, Sanliurfa, Trabzon, Mugla.
 *   vn-hcm  Viet Nam, Ho Chi Minh City Department of Justice, the approved list of translation
 *           collaborators at notary offices, by office, with the languages approved (24/3/2026).
 *   tw      Taiwan, Judicial Yuan, roster of contracted court interpreters (tezhe tongyi mingce),
 *           with language and the high court district. Open Government Data License v1.
 *   tn      Tunisia, Ministry of Justice, lists of sworn interpreters (tableau des interpretes
 *           assermentes), one PDF per language, with the first-instance court district and an
 *           office address.
 *
 * WHY THESE SOURCES
 *
 * Each person on these rolls was admitted by a court body or a ministry for named languages, after
 * a diploma, exam or oath check, and the body publishes the roll so that courts and the public can
 * use it. The language claim is therefore the state's, per named person: the official tier.
 *
 * Refused or not usable (reasons and quotes in the translators-asia agent report): the UAE
 * Ministry of Justice (its public translator search is broken; the only readable route is an
 * unauthenticated back-office API that also returns Emirates ID numbers, private e-mails and AML
 * screening flags, so it was not used and no copy was kept), Morocco (the 2025 roll is in Bulletin
 * officiel 7429 bis, pages 6278 ff., but as scanned images only), Indonesia (ahu.go.id refused every
 * connection), Algeria (the Algiers court list gives no languages), Istanbul, Ankara and Amasya
 * courthouse CMK lists (a per-person query behind an ID number and a CAPTCHA, not a list).
 *
 * THE RULE
 *
 * The languages are the ones the roll writes for the person, mapped to our ISO codes by name, one
 * table per roll language. Nothing is added. The local language of the country is never written:
 * Turkish in Turkey, Vietnamese in Viet Nam, Chinese (and Hokkien, Hakka, the indigenous languages)
 * in Taiwan, Arabic in Tunisia. French in Tunisia is a foreign language here (LOCAL in
 * scripts/lib/service_data.cjs has Tunisia: 'ar'). A language the directory has no code for (Kurdish,
 * Azerbaijani, Kazakh, Uzbek, Ottoman Turkish, sign languages, Cantonese as distinct from zh) is
 * dropped from the row, never mapped to a neighbour. A person left with no language is not proposed.
 * More than six languages refuses the person whole, the site-wide cap.
 *
 * PLACEMENT, AND THE precision FIELD
 *
 * Every row carries `precision`, because these rolls place people with very different accuracy:
 *   address       an office address in the city (vn-hcm)
 *   court-district Tunisia: the first-instance court district (Tunis, Sousse, Sfax, Kairouan), or
 *                 Sidi Bou Said and Djerba when the office address names them; the address itself
 *                 is not carried (see TRAPS)
 *   district      the roll gives the district (ilce) and it is one of the city's own districts
 *                 (tr-bbk, and the tr-cmk lists that print a district: Gaziantep, Sanliurfa,
 *                 Trabzon, Mugla)
 *   court-list    the roll gives no address; the person is on the interpreter list of that city's
 *                 courthouse (tr-cmk Izmir and Mardin). The caller may drop these.
 *   court-region  Taiwan: the roster gives only the high court district, which is wider than the
 *                 city (the Taiwan High Court covers all of the north). The caller may drop these.
 * Only a city's own districts count, written out in TR_PLACE: Izmir's Torbali or Cesme is not Izmir,
 * Yomra is not Trabzon. Denizli and Nevsehir lists give no district, and Pamukkale and Goreme are
 * small towns away from the courthouse city, so neither list is placed at all.
 * A home address is never carried whole: for tr rows `area` is only the district.
 *
 * TRAPS HIT
 *
 * - The Istanbul expert list has no ruled table, and each cell is vertically centred, so a person's
 *   languages sit above and below the line with the name. Records are cut by the vertical gap
 *   between text lines (4.6pt inside a record, 11pt between records), never by nearest line, and a
 *   record cut by a page break is joined to its other half.
 * - pdftotext -layout misaligns these tables: it printed Huseyin Delil as a French translator, where
 *   the PDF has Ottoman Turkish. Every Turkish PDF is read by position through PyMuPDF instead.
 * - Tunisia's PDFs set the lam-alef ligatures in fonts with no Unicode mapping, so the letters come
 *   out as "8", "=", "&", "@", ";", "U", "F" or a control character, and differently in each file.
 *   A name with any such character is refused whole rather than repaired by guess.
 *   The table's own cell text is unusable for Arabic: it comes in visual order and with the spaces
 *   between words lost ("كمالفرفر" for "كمال فرفر"), so the cells are rebuilt from the positioned
 *   words ('tablewords'), right to left, after undoing the page's 90 degree rotation. A word that
 *   ends in an initial or medial presentation form is joined to the next ("ﻣ" + "حمد" = "محمد").
 * - Ho Chi Minh City absorbed Binh Duong and Ba Ria-Vung Tau on 1 July 2025, so its notary list now
 *   includes offices 30 to 90 km away. The wards of the two former provinces are listed in HCM_OUT and
 *   HCM_VUNGTAU: Vung Tau wards go to our Vung Tau city, the rest are not placed.
 * - Taiwan lists one person once per court and per language group; rows are merged by name and city.
 *
 * STAGES
 *
 *   fetch    node scripts/read_translator_registers2.cjs fetch --cache <dir> [--only tr-bbk,tr-cmk,vn-hcm,tw,tn]
 *   propose  node scripts/read_translator_registers2.cjs propose --cache <dir> [--out <dir>] [--only ...]
 *              writes <out>/proposals-<roll>.json ({ source, rows }), a combined <out>/proposals.json
 *              and <out>/refused.json.
 * Needs python with PyMuPDF (fitz) and openpyxl on PATH, for the PDF tables and the Mugla xlsx.
 * There is no ingest stage: data/ is not touched by this script.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'translators2')));
const OUT = path.resolve(val('--out', CACHE));
const ONLY = val('--only', 'tr-bbk,tr-cmk,vn-hcm,tw,tn').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;

const STROKED = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ø: 'O', ø: 'o', ß: 'ss', Æ: 'AE', æ: 'ae', Œ: 'OE', œ: 'oe', ı: 'i', Ħ: 'H', ħ: 'h' };
const fold = (s) => String(s || '').replace(/[ŁłĐđØøßÆæŒœıĦħ]/g, (c) => STROKED[c]).normalize('NFD').replace(/[̀-ͯ]/g, '');
const key = (s) => fold(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const decode = (s) => String(s || '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)));
const text = (html) => clean(decode(String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')));
// Turkish capitals: "İ" lowers to "i" and "I" to "ı" only under the tr locale.
const trTitle = (s) => clean(s).toLocaleLowerCase('tr').replace(/(^|[\s.'-])(\p{L})/gu, (a, b, c) => b + c.toLocaleUpperCase('tr'));
const TRK = (s) => fold(String(s || '').toLocaleUpperCase('tr')).toUpperCase().replace(/[^A-Z]/g, '');

async function get(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
      if (r.status === 200) return Buffer.from(await r.arrayBuffer());
      if (r.status === 404) return null;
    } catch (e) { /* retried below */ }
    await sleep(3000 * (a + 1));
  }
  throw new Error('no answer from ' + url);
}
const dir = (cc) => { const d = path.join(CACHE, cc); fs.mkdirSync(d, { recursive: true }); return d; };
const fileOf = (cc, f) => path.join(CACHE, cc, f);
const exists = (cc, f) => fs.existsSync(fileOf(cc, f));
const loadText = (cc, f) => fs.readFileSync(fileOf(cc, f), 'utf8');
async function download(cc, f, url) {
  if (exists(cc, f)) return;
  dir(cc);
  const b = await get(url);
  if (!b) throw new Error('404 ' + url);
  fs.writeFileSync(fileOf(cc, f), b);
  console.log(`${cc}: ${f} ${b.length} bytes`);
  await sleep(1200);
}

// ---- PDF and xlsx through PyMuPDF ------------------------------------------------------
// Written to a file, not stdout: PyMuPDF prints an advice line on stdout during find_tables.
const PY = `
import sys, json, re
mode, f, out = sys.argv[1], sys.argv[2], sys.argv[3]
only = re.compile(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else None
res = []
if mode == 'xlsx':
    import openpyxl
    wb = openpyxl.load_workbook(f, data_only=True)
    for ws in wb:
        res.append({'sheet': ws.title, 'rows': [[None if v is None else str(v) for v in r] for r in ws.iter_rows(values_only=True)]})
else:
    import fitz
    d = fitz.open(f)
    for i, p in enumerate(d):
        if only and i > 0 and not only.search(p.get_text()):
            continue
        if mode == 'tables':
            for t in p.find_tables().tables:
                res.append({'page': i, 'rows': t.extract()})
        elif mode == 'tablewords':
            # Arabic cells: words (logical order inside each word) placed by position, right to
            # left, lines top to bottom. The page may be rotated; words are brought into the table's
            # coordinates first. A word ending in an initial or medial presentation form is joined
            # to the next one with no space: the glyph itself says the letters connect.
            import unicodedata
            W = [(fitz.Rect(w[:4]) * p.rotation_matrix, w[4]) for w in p.get_text('words')]
            def joins(s):
                return bool(s) and ('INITIAL FORM' in unicodedata.name(s[-1], '') or 'MEDIAL FORM' in unicodedata.name(s[-1], ''))
            for t in p.find_tables().tables:
                rows = []
                for r in t.rows:
                    cols = []
                    for c in r.cells:
                        if c is None:
                            cols.append(None)
                            continue
                        R = fitz.Rect(c)
                        ws = [(b, s) for b, s in W if R.contains(fitz.Point((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2))]
                        ws.sort(key=lambda w: w[0].y0)
                        lines = []
                        for b, s in ws:
                            if lines and abs(lines[-1][0] - b.y0) < 3:
                                lines[-1][1].append((b, s))
                            else:
                                lines.append([b.y0, [(b, s)]])
                        txt = ''
                        for y, lw in lines:
                            lw.sort(key=lambda w: -w[0].x0)
                            for b, s in lw:
                                txt += ('' if (not txt or joins(txt)) else ' ') + s
                        cols.append(txt)
                    rows.append(cols)
                res.append({'page': i, 'rows': rows})
        else:
            L = []
            for b in p.get_text('dict')['blocks']:
                for l in b.get('lines', []):
                    x0, y0, x1, y1 = l['bbox']
                    L.append([round(y0, 1), round(x0, 1), ''.join(s['text'] for s in l['spans'])])
            L.sort()
            res.append({'page': i, 'lines': L})
open(out, 'w', encoding='utf-8').write(json.dumps(res, ensure_ascii=False))
`;
function py(mode, file, only) {
  const out = file + '.' + mode + '.json';
  if (!fs.existsSync(out)) {
    execFileSync('python', ['-c', PY, mode, file, out, only || ''], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  }
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

// ---- cities -----------------------------------------------------------------------------
// Read from cities-data.js directly, as the first reader does: requiring scripts/lib/service_data.cjs
// runs its consistency checks, which exit on any other category's unfinished country.
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITY = new Map(m.exports.filter(Boolean).map((c) => [c.id, c]));

// ---- languages ----------------------------------------------------------------------------
// Keyed by the folded, upper-cased (tr) or lower-cased name. null = a language we have no code for,
// dropped from the row and counted, never mapped to a neighbour.
const LANG = {
  tr: {
    ALMANCA: 'de', ARAPCA: 'ar', INGILIZCE: 'en', FRANSIZCA: 'fr', FARSCA: 'fa', RUSCA: 'ru', ISPANYOLCA: 'es',
    ITALYANCA: 'it', CINCE: 'zh', JAPONCA: 'ja', KORECE: 'ko', YUNANCA: 'el', BULGARCA: 'bg', ROMENCE: 'ro',
    GURCUCE: 'ka', UKRAYNACA: 'uk', LEHCE: 'pl', HOLLANDACA: 'nl', FLEMENKCE: 'nl', FLEMENKCEHOLLANDACA: 'nl',
    PORTEKIZCE: 'pt', IBRANICE: 'he', URDUCA: 'ur', URDU: 'ur', HINTCE: 'hi', HINDUCA: 'hi', SIRPCA: 'sr', HIRVATCA: 'hr',
    ARNAVUTCA: 'sq', MACARCA: 'hu', CEKCE: 'cs', SLOVAKCA: 'sk', SLOVENCE: 'sl', FINCE: 'fi', FINLANDIYACA: 'fi',
    ISVECCE: 'sv', DANCA: 'da', DANIMARKACA: 'da', NORVECCE: 'no', TAYCA: 'th', VIETNAMCA: 'vi', ENDONEZYACA: 'id',
    MALAYCA: 'ms', BENGALCE: 'bn', PENCAPCA: 'pa', TACIKCE: 'tg', AFRIKAANS: 'af', SVAHILICE: 'sw', SVAHILI: 'sw',
    TAGALOGCA: 'tl', FILIPINCE: 'tl', ESTONCA: 'et', LETONCA: 'lv', LITVANCA: 'lt', TAMILCE: 'ta', NEPALCE: 'ne',
    SINHALACA: 'si', BIRMANCA: 'my', KMERCE: 'km', KATALANCA: 'ca', TURKCE: 'tr', FELEMENKCE: 'nl',
    AZERICE: null, AZERBAYCANDILI: null, AZERBAYCANCA: null, AZERBEYCANDILI: null, KAZAKCA: null, KIRGIZCA: null,
    OZBEKCE: null, TURKMENCE: null, KURTCE: null, KURTCEKURMANCI: null, KURTCEZAZACA: null, ZAZACA: null,
    KURMANCI: null, SORANI: null, OSMANLICA: null, OSMANLITURKCESI: null, ISARETDILI: null, TURKISARETDILI: null,
    ULUSLARARASIISARETDILI: null, LATINCE: null, ERMENICE: null, MAKEDONCA: null, BOSNAKCA: null, SURYANICE: null,
    PESTUCA: null, PESTUNCA: null, DARI: null, AFGANCA: null, UYGURCA: null, MOGOLCA: null, AMHARCA: null,
    SOMALICE: null, TATARCA: null, CERKEZCE: null, ABAZACA: null, LAZCA: null, GAGAVUZCA: null, KIRIMTATARCA: null,
    BELARUSCA: null, BEYAZRUSCA: null, HAUSACA: null, ESPERANTO: null, MOLDOVACA: null, ARAMICE: null,
    TIGRINYA: null, TIGRINCE: null, BELUCCE: null, SUAHILICE: 'sw', LINGALA: null, YORUBA: null, OROMOCA: null,
    RUMENCE: 'ro', ENDONEZYADILI: 'id', AZERBAYCANTURKCESI: null, DARICE: null, KARADAGCA: null, ISARETDILITERCUMANI: null,
    TURKCEISARETDILI: null, KUTCE: null,
    // Written as the country, used as the language label on the Trabzon and Sanliurfa lists.
    UKRAYNA: 'uk', RUSYA: 'ru',
    // A plain misspelling of ALMANCA on one line of the Izmir list.
    ALMACA: 'de',
    // "Şam lehçesi ve fesih": Damascene Arabic and standard (fasih) Arabic.
    SAMLEHCESIVEFESIH: 'ar',
  },
  vi: {
    anh: 'en', tienganh: 'en', phap: 'fr', duc: 'de', nhat: 'ja', nhatban: 'ja', han: 'ko', hanquoc: 'ko', trung: 'zh',
    trungquoc: 'zh', hoa: 'zh', nga: 'ru', taybannha: 'es', y: 'it', italia: 'it', bodaonha: 'pt', thai: 'th', thailan: 'th',
    lao: null, campuchia: 'km', khmer: 'km', halan: 'nl', balan: 'pl', sec: 'cs', hungary: 'hu', arap: 'ar', indonesia: 'id',
    malaysia: 'ms', thuydien: 'sv', danmach: 'da', nauy: 'no', phanlan: 'fi', ukraina: 'uk', bungari: 'bg', rumani: 'ro',
    hylap: 'el', thonhiky: 'tr', myanmar: 'my', mongco: null, ando: 'hi', philippines: 'tl', slovakia: 'sk',
  },
  tw: {
    '日語': 'ja', '韓語': 'ko', '德語': 'de', '英語': 'en', '法語': 'fr', '西班牙語': 'es', '義大利語': 'it', '俄語': 'ru',
    '印尼語': 'id', '馬來西亞語': 'ms', '馬來語': 'ms', '菲律賓語': 'tl', '他加祿語': 'tl', '泰語': 'th', '越南語': 'vi',
    '緬甸語': 'my', '印地語': 'hi', '烏爾都語': 'ur', '葡萄牙語': 'pt', '阿拉伯語': 'ar', '土耳其語': 'tr', '荷蘭語': 'nl',
    '波蘭語': 'pl', '尼泊爾語': 'ne', '孟加拉語': 'bn', '柬埔寨語': 'km', '高棉語': 'km', '僧伽羅語': 'si', '波斯語': 'fa',
    '烏克蘭語': 'uk', '希伯來語': 'he', '瑞典語': 'sv', '捷克語': 'cs', '匈牙利語': 'hu', '希臘語': 'el', '泰米爾語': 'ta',
    '旁遮普語': 'pa', '羅馬尼亞語': 'ro', '芬蘭語': 'fi', '丹麥語': 'da', '挪威語': 'no', '斯瓦希里語': 'sw',
    '廣東語': null, '粵語': null, '雲南語': null, '爪哇語': null, '寮語': null, '寮國語': null, '蒙古語': null, '手語': null, '其他': null,
  },
  // Tunisia: one file per language, named by the ministry; the row's own column confirms it.
  tn: {
    'inter_english.pdf': 'en', 'inter_francais20526.pdf': 'fr', 'inter_deutsch.pdf': 'de', 'inter_italien.pdf': 'it',
    'inter_espagnol.pdf': 'es', 'inter_russe5526.pdf': 'ru', 'inter_chinois27-02.pdf': 'zh', 'inter_turque.pdf': 'tr',
    'inter_suedoise.pdf': 'sv', 'inter_hebreu27123.pdf': 'he', 'inter_mimique27-02.pdf': null,
  },
};
// Local, indigenous and dialect languages of Taiwan: never published there, not counted as unmapped.
const TW_LOCAL = /^(客語|閩南語|臺語|台語|華語|國語|手語|同步聽打|其他原住民語別)$|族|阿美|排灣|布農|泰雅|賽夏|賽德克|太魯閣|鄒|邵語|卑南|魯凱|雅美|達悟|噶瑪蘭|撒奇萊雅|拉阿魯哇|卡那卡那富/;
const unmapped = {};
function codeOf(cc, name) {
  const k = cc === 'tr' ? TRK(String(name).replace(/\([^)]*\)/g, ' ').replace(/\bDILI\b/i, 'DILI'))
    : cc === 'vi' ? fold(name).toLowerCase().replace(/^tieng\s*/, '').replace(/[^a-z]/g, '')
      : clean(name);
  const t = LANG[cc];
  if (t[k] !== undefined) { if (t[k] === null) unmapped[cc + ':' + k] = (unmapped[cc + ':' + k] || 0) + 1; return t[k]; }
  unmapped[cc + ':' + k] = (unmapped[cc + ':' + k] || 0) + 1;
  return null;
}
const refused = [];
const refuse = (cc, name, why, extra) => refused.push({ register: cc, name, why, ...(extra || {}) });
function finish(cc, r, codes, dropped, local) {
  // A cell too narrow for the name cuts it in the PDF itself ("LİUDMİLA KADAGANLI O" in Antalya).
  if (/^tr-/.test(cc) && /\s\p{L}\.?$/u.test(r.name)) { refuse(cc, r.name, 'name cut off in the source', { city: r.city }); return null; }
  const langs = [...new Set(codes.filter((c) => c && c !== local))];
  if (!langs.length) { refuse(cc, r.name, dropped.length ? 'no language the directory has a code for: ' + dropped.join(', ') : 'only the local language', { city: r.city }); return null; }
  if (langs.length > MAX_LANGS) { refuse(cc, r.name, langs.length + ' languages, over the cap of ' + MAX_LANGS, { city: r.city }); return null; }
  return { ...r, category: 'translator', languages: langs, evidence: 'official', checked: TODAY, ...(dropped.length ? { droppedLanguages: [...new Set(dropped)] } : {}) };
}

// ---- Turkey --------------------------------------------------------------------------------
// Province -> { district -> city }. Only a city's own central districts. '*' = the whole province is
// the city (Istanbul province is the metropolitan municipality).
const TR_PLACE = {
  ISTANBUL: { '*': 'istanbul' },
  IZMIR: { KONAK: 'izmir', KARSIYAKA: 'izmir', BORNOVA: 'izmir', BUCA: 'izmir', BAYRAKLI: 'izmir', CIGLI: 'izmir', GAZIEMIR: 'izmir', BALCOVA: 'izmir', NARLIDERE: 'izmir', KARABAGLAR: 'izmir', GUZELBAHCE: 'izmir', MERKEZ: 'izmir' },
  ANKARA: { CANKAYA: 'ankara', KECIOREN: 'ankara', YENIMAHALLE: 'ankara', MAMAK: 'ankara', ETIMESGUT: 'ankara', SINCAN: 'ankara', ALTINDAG: 'ankara', PURSAKLAR: 'ankara', GOLBASI: 'ankara', MERKEZ: 'ankara' },
  ANTALYA: { MURATPASA: 'antalya', KEPEZ: 'antalya', KONYAALTI: 'antalya', DOSEMEALTI: 'antalya', AKSU: 'antalya', MERKEZ: 'antalya', ALANYA: 'alanya', KAS: 'kas' },
  GAZIANTEP: { SAHINBEY: 'gaziantep', SEHITKAMIL: 'gaziantep', MERKEZ: 'gaziantep' },
  SANLIURFA: { HALILIYE: 'sanliurfa', EYYUBIYE: 'sanliurfa', KARAKOPRU: 'sanliurfa', MERKEZ: 'sanliurfa' },
  MARDIN: { ARTUKLU: 'mardin', MERKEZ: 'mardin' },
  TRABZON: { ORTAHISAR: 'trabzon', MERKEZ: 'trabzon' },
  AMASYA: { MERKEZ: 'amasya' },
  KARABUK: { SAFRANBOLU: 'safranbolu' },
  BARTIN: { AMASRA: 'amasra' },
  MUGLA: { BODRUM: 'bodrum', FETHIYE: 'fethiye', MARMARIS: 'marmaris' },
};
function trCity(il, ilce) {
  const p = TR_PLACE[TRK(il)];
  if (!p) return null;
  return p['*'] || p[TRK(ilce)] || null;
}
// "İSTANBUL/KADIKÖY", "ANKARA - ÇANKAYA", "Ortahisar/TRABZON", "MERKEZ / ŞANLIURFA"
function trSplitPlace(s) {
  const parts = clean(s).split(/\s*[/-]\s*/).filter(Boolean);
  if (parts.length !== 2) return null;
  if (TR_PLACE[TRK(parts[0])]) return { il: parts[0], ilce: parts[1] };
  if (TR_PLACE[TRK(parts[1])]) return { il: parts[1], ilce: parts[0] };
  return { il: parts[0], ilce: parts[1] };
}
// A language line: "37.01.05 İNGİLİZCE", or a bare name ("ALMANCA") in a row whose field is 37.
const TR_CODE_LINE = /^37\.0[12]\.\d\d\s+(.+)$/;
function trLanguagesOfRow(cells, isTranslatorRow) {
  const names = [];
  for (const c of cells) {
    for (const line of String(c || '').split('\n').map(clean).filter(Boolean)) {
      const mm = line.match(TR_CODE_LINE);
      if (mm) { names.push(mm[1]); continue; }
      if (isTranslatorRow && TRK(line) in LANG.tr) names.push(line);
    }
  }
  return names;
}
// "ARAPÇA-KÜRTÇE", "İNGİLİZCE ALMANCA", "ARAPÇA KÜRTÇE OSMANLICA": split on separators, then read
// the words greedily, longest known name first (three words covers "TÜRK İŞARET DİLİ").
function trSplitNames(s) {
  const out = [];
  for (const piece of String(s || '').split(/\s*[,;\n/]\s*|\s*-\s*/).map(clean).filter(Boolean)) {
    if (TRK(piece) in LANG.tr) { out.push(piece); continue; }
    const w = piece.split(' ');
    let i = 0; const got = [];
    while (i < w.length) {
      let n = Math.min(3, w.length - i);
      while (n > 0 && !(TRK(w.slice(i, i + n).join(' ')) in LANG.tr)) n -= 1;
      if (!n) { got.length = 0; break; }
      got.push(w.slice(i, i + n).join(' ')); i += n;
    }
    if (got.length) out.push(...got); else out.push(piece);
  }
  return out;
}
function trCodes(names) {
  const codes = []; const dropped = [];
  for (const n of names) { const c = codeOf('tr', n); if (c) codes.push(c); else dropped.push(clean(n)); }
  return { codes, dropped };
}

const TR_BBK = {
  // region: [file, url, list page]
  istanbul: ['https://rayp.adalet.gov.tr/resimler/494/dosya/bilirkisilistesi-0710202507-10-202512-26-pm.pdf', 'https://istanbulbbk.adalet.gov.tr/bolge-bilirkisi-listesi'],
  izmir: ['https://rayp.adalet.gov.tr/resimler/495/dosya/izmir-bbk-guncel-liste-2209202622-09-20263-40-pm.pdf', 'https://izmirbbk.adalet.gov.tr/izmir-bolge-bilirkisi-listesi'],
  ankara: ['https://rayp.adalet.gov.tr/resimler/489/dosya/20251226-bilirkisilistesi26-12-20259-54-am.pdf', 'https://ankarabbk.adalet.gov.tr/bilirkisi-listesi'],
  antalya: ['https://rayp.adalet.gov.tr/resimler/490/dosya/2109202621-09-20263-50-pm.pdf', 'https://antalyabbk.adalet.gov.tr/bolge-bilirkisi-listesi'],
  gaziantep: ['https://rayp.adalet.gov.tr/resimler/493/dosya/2022-gaziantep-tum-bilirkisi-listesi20-01-202611-11-am.pdf', 'https://gaziantepbbk.adalet.gov.tr/Bolge_Bilirkisi_Listesi'],
  samsun: ['https://rayp.adalet.gov.tr/resimler/496/dosya/bilirkisi-listesi-0804202608-04-20264-32-pm.pdf', 'https://samsunbbk.adalet.gov.tr/bilirkisi-listesi'],
  trabzon: ['https://rayp.adalet.gov.tr/resimler/500/dosya/bilirkisi-bolge-listesi-10-10-202510-10-202510-01-am.pdf', 'https://trabzonbbk.adalet.gov.tr/bolge-bilirkisi-listesi'],
};
// Found through each courthouse's own archive search (/Arsiv/Ara_tercüman), December 2025 notices.
const TR_CMK = {
  izmir: ['f_izmir.pdf', 'https://rayp.adalet.gov.tr/resimler/161/dosya/ek-2026-yili-kesinlesen-tercuman-listesi-kopya25-12-20254-36-pm.pdf', 'https://izmir.adalet.gov.tr/2026-yili-kesinlesen-tercuman-listesine-iliskin-duyuru'],
  gaziantep: ['f_gaziantep.pdf', 'https://rayp.adalet.gov.tr/resimler/134/dosya/2026-yili-kesin-liste31-12-202510-40-am.pdf', 'https://gaziantep.adalet.gov.tr/2026-yili-kesinlesmis-tercuman-listesi-ve-baskanligimizin-karari'],
  mardin: ['f_mardin.pdf', 'https://rayp.adalet.gov.tr/resimler/204/dosya/2026-tercumanlik-kesin-listesi31-12-202510-35-am.pdf', 'https://mardin.adalet.gov.tr/2026-tercumanlik-kesin-listesi'],
  sanliurfa: ['f_sanliurfa.pdf', 'http://rayp.adalet.gov.tr/resimler/284/dosya/tercuman-bilirkisi-listesi-2026son02-01-20263-38-pm.pdf', 'https://sanliurfa.adalet.gov.tr/tercuman-bilirkisi-2026-kesin-liste'],
  trabzon: ['f_trabzon.pdf', 'https://rayp.adalet.gov.tr/resimler/6/dosya/2026tercumankesin25-11-20251-37-pm.pdf', 'https://trabzon.adalet.gov.tr/2026-yili-tercuman-bilirkisiligine-muracaati-kabul-edilip-yeminleri-yaptirilacaklara-iliskin-liste'],
  mugla: ['f_mugla.xlsx', 'https://rayp.adalet.gov.tr/resimler/208/dosya/evrak584173078559136947128-11-20254-29-pm.xlsx', 'https://mugla.adalet.gov.tr/mugla-adalet-komisyonu-baskanliginca-2026-yili-tercuman-bilirkisi-listesine-basvurusu-kabul-edilenle'],
};

// Table-shaped expert lists: the column of each field, found from the header row of the file.
function bbkColumns(header) {
  const h = header.map((c) => TRK(c));
  const find = (re) => h.findIndex((x) => re.test(x));
  return {
    name: find(/^(ADSOYAD|ADISOYADI|ADIVESOYADI)$/),
    place: find(/^(ILILCE)$/),
    il: find(/^IL$/),
    ilce: find(/^ILCE$/),
    temel: find(/^TEMELUZMANLIK/),
  };
}
function bbkTables(region, file) {
  const pages = py('tables', file, '37\\.0[12]\\.|MÜTERCİM');
  const out = [];
  let cols = null;
  for (const t of pages) {
    for (const row of t.rows) {
      const cells = row.map((c) => (c == null ? '' : String(c)));
      // The header row names the columns; the tables on later pages repeat it or not.
      if (cells.some((c) => /^(ADSOYAD|ADISOYADI|ADIVESOYADI)$/.test(TRK(c)))) {
        const cc = bbkColumns(cells);
        if (cc.name >= 0) cols = cc;
        continue;
      }
      if (!cols) continue;
      const translator = cells.some((c) => /\b37 MÜTERCİM/.test(c));
      const langs = trLanguagesOfRow(cells, translator);
      if (!langs.length) continue;
      const name = clean(cells[cols.name]);
      let place = null;
      if (cols.place >= 0) place = trSplitPlace(cells[cols.place]);
      else if (cols.il >= 0 && cols.ilce >= 0) place = { il: clean(cells[cols.il]), ilce: clean(cells[cols.ilce]) };
      if (!name || !place) { refuse('tr-bbk', name || '(no name)', 'row not read: ' + JSON.stringify(cells).slice(0, 200), { region }); continue; }
      out.push({ region, name, place, langs, quote: langs.join(', ') });
    }
  }
  return out;
}
// Istanbul: no table. Lines are clustered by vertical gap; see TRAPS in the header.
function bbkIstanbul(file) {
  const pages = py('lines', file);
  const COL = (x) => (x < 58 ? 'sicil' : x < 175 ? 'name' : x < 328 ? 'temel' : x < 630 ? 'alt' : x < 735 ? 'place' : 'job');
  const clusters = [];
  for (const pg of pages) {
    const pageClusters = [];
    let cur = null; let lastY = -99;
    for (const [y, x, t] of pg.lines) {
      if (y < 30 && /BİLİRKİŞİ|Sicil No|T\.C\.|Güncelleme/.test(t)) continue;
      if (!cur || y - lastY > 8) { cur = { page: pg.page, lines: [] }; pageClusters.push(cur); }
      cur.lines.push({ y, col: COL(x), t: clean(t) });
      lastY = y;
    }
    pageClusters.forEach((c, i) => { c.first = i === 0; c.last = i === pageClusters.length - 1; });
    clusters.push(...pageClusters);
  }
  // A cluster with no register number is half of a record cut by a page break.
  const recs = [];
  for (let i = 0; i < clusters.length; i += 1) {
    const c = clusters[i];
    const hasId = c.lines.some((l) => l.col === 'sicil' && /^\d+$/.test(l.t));
    if (hasId) { recs.push(c); continue; }
    if (c.first && recs.length) recs[recs.length - 1].lines.push(...c.lines);
    else if (c.last && clusters[i + 1]) clusters[i + 1].lines.unshift(...c.lines);
  }
  const out = [];
  for (const r of recs) {
    const by = (col) => r.lines.filter((l) => l.col === col).map((l) => l.t);
    const translator = by('temel').some((t) => /^37 MÜTERCİM/.test(t));
    const langs = trLanguagesOfRow(by('alt'), translator);
    if (!langs.length) continue;
    const name = by('name').join(' ');
    const place = trSplitPlace(by('place').join(' '));
    if (!name || !place || by('sicil').length !== 1) { refuse('tr-bbk', name || '(no name)', 'record not read cleanly', { region: 'istanbul', lines: r.lines.map((l) => l.t).join(' | ') }); continue; }
    out.push({ region: 'istanbul', name, place, langs, quote: langs.join(', ') });
  }
  return out;
}

// ---- Viet Nam: Ho Chi Minh City ------------------------------------------------------------------
// Wards and communes that were Binh Duong or Ba Ria-Vung Tau before the 1 July 2025 merger (folded,
// no spaces). An address naming one is not placed in Ho Chi Minh City; the Vung Tau ones go to vungtau.
const HCM_VUNGTAU = ['vungtau', 'tamthang', 'rachdua', 'phuocthang'];
const HCM_OUT = ['thudaumot', 'phuloi', 'chanhhiep', 'binhduong', 'phuan', 'bencat', 'chanhphuhoa', 'longnguyen', 'taynam',
  'thoihoa', 'hoaloi', 'tanuyen', 'tanhiep', 'vinhtan', 'tankhanh', 'binhco', 'dian', 'donghoa', 'tandonghiep', 'thuanan',
  'thuangiao', 'binhhoa', 'laithieu', 'anphu', 'baria', 'longhuong', 'tamlong', 'phumy', 'tanthanh', 'tanphuoc', 'tanhai',
  'longdien', 'datdo', 'xuyenmoc', 'chauduc', 'condao', 'hotram', 'ngaigiao', 'kimlong', 'phuocthang_', 'dauTieng', 'bauBang',
  'phugiao', 'bactanuyen', 'daitieng', 'baubang', 'dautieng', 'dongxoai'].map((s) => s.toLowerCase());
function hcmCity(address) {
  const wards = [...fold(address).toLowerCase().matchAll(/(phuong|xa|dac khu)\s+([a-z0-9 ]+?)(,|$)/g)].map((x) => [x[1], x[2].replace(/\s+/g, '')]);
  if (!wards.length) return { city: null, why: 'no ward in the address' };
  const [kind, w] = wards[wards.length - 1];
  if (HCM_VUNGTAU.includes(w)) return { city: 'vungtau', ward: w };
  if (HCM_OUT.includes(w)) return { city: null, why: 'ward of former Binh Duong or Ba Ria-Vung Tau: ' + w };
  if (kind !== 'phuong') return { city: null, why: 'a commune, outside the urban wards: ' + w };
  return { city: 'hochiminhcity', ward: w };
}

// ---- Taiwan -----------------------------------------------------------------------------------
const TW_COURT = {
  '臺灣高等法院': 'taipei', '臺北高等行政法院': 'taipei', '臺灣高等法院臺中分院': 'taichung', '臺中高等行政法院': 'taichung',
  '臺灣高等法院臺南分院': 'tainan', '臺灣高等法院高雄分院': 'kaohsiung', '高雄高等行政法院': 'kaohsiung', '臺灣高等法院花蓮分院': 'hualien',
};
const rocEnd = (s) => { const mm = String(s).match(/～\s*(\d{2,3})-(\d\d)-(\d\d)/); return mm ? `${Number(mm[1]) + 1911}-${mm[2]}-${mm[3]}` : null; };

// ---- Tunisia -----------------------------------------------------------------------------------
const arNorm = (s) => clean(String(s).normalize('NFKC').replace(/ھ/g, 'ه').replace(/ی/g, 'ي'));
const TN_DISTRICT = { 'تونس': 'tunis', 'سوسة': 'sousse', 'صفاقس': 'sfax', 'القيروان': 'kairouan', 'توزر': 'tozeur' };
// Any of these in a name is a ligature the font did not map (see TRAPS). The name is refused.
const TN_BAD = /[^ء-ي٠-٩\s]/;

// ---- fetch -------------------------------------------------------------------------------------
const FETCH = {
  async 'tr-bbk'() {
    for (const [r, [url, page]] of Object.entries(TR_BBK)) {
      await download('tr-bbk', r + '.html', page);
      await download('tr-bbk', r + '.pdf', url);
    }
  },
  async 'tr-cmk'() {
    for (const [, [f, url, page]] of Object.entries(TR_CMK)) {
      await download('tr-cmk', f.replace(/\.\w+$/, '.html'), page);
      await download('tr-cmk', f, url);
    }
  },
  async 'vn-hcm'() {
    await download('vn-hcm', 'list.html', 'https://sotuphap.hochiminhcity.gov.vn/thong-bao?_101_INSTANCE_emZ19pfF3Yyq_assetEntryId=4674025&_101_INSTANCE_emZ19pfF3Yyq_struts_action=%2Fasset_publisher%2Fview_content&_101_INSTANCE_emZ19pfF3Yyq_type=content&_101_INSTANCE_emZ19pfF3Yyq_urlTitle=&enableXemTheoNgay=true&p_p_col_count=1&p_p_col_id=column-4&p_p_id=101_INSTANCE_emZ19pfF3Yyq&p_p_lifecycle=0');
  },
  async tw() {
    // 60 per page is the largest page size the roster offers; stop at the first page with no people.
    for (let p = 1; p < 40; p += 1) {
      await download('tw', `p${p}.html`, `https://www.judicial.gov.tw/tw/lp-151-1-${p}-60.html`);
      if (!/聘任期間/.test(loadText('tw', `p${p}.html`))) break;
      // A page number past the end is answered with the last page again, so stop on the count
      // ("共 489 筆資料", read from the text: the number sits in its own tag).
      const total = Number((text(loadText('tw', 'p1.html')).match(/共\s*(\d+)\s*筆/) || [])[1] || 0);
      if (!total) throw new Error('tw: no record count on page 1');
      if (p * 60 >= total) break;
    }
  },
  async tn() {
    await download('tn', 'index.html', 'https://www.justice.gov.tn/index.php?id=368');
    const files = [...new Set([...loadText('tn', 'index.html').matchAll(/href="(fileadmin\/[^"]+\/interpretes_assermentes\/[^"]+\.pdf)"/g)].map((x) => x[1]))];
    for (const f of files) await download('tn', path.basename(f), 'https://www.justice.gov.tn/' + f);
  },
};

// ---- propose -----------------------------------------------------------------------------------
const SOURCES = {
  'tr-bbk': {
    publisher: 'Turkish Ministry of Justice, regional expert-witness boards (Bilirkişilik Bölge Kurulları)',
    url: 'https://bilirkisilik.adalet.gov.tr/Home/SayfaDetay/bolge-bilirkisi-listeleri02072020030208',
    licenceOrTermsQuote: 'No terms of use on adalet.gov.tr or the regional board sites. Each list is published by the board as the list courts assign experts from; the Istanbul list says: "Bilirkişilerin ayrıntılı bilgileri Mahkeme ve Cumhuriyet Savcılıklarının erişimine açıktır."',
    pageNote: 'Some of these are on a Turkish Ministry of Justice regional list of court experts, in the field of translation. The languages shown are the ones each person is listed for.',
  },
  'tr-cmk': {
    publisher: 'Turkish provincial justice commissions (Adli Yargı İlk Derece Mahkemesi Adalet Komisyonları)',
    url: 'https://izmir.adalet.gov.tr/2026-yili-kesinlesen-tercuman-listesine-iliskin-duyuru',
    licenceOrTermsQuote: 'No terms of use on the courthouse sites. The lists are public notices under the regulation of 5 March 2013 on interpreter lists (Resmi Gazete 28578); the Istanbul notice says the list "ilanen duyurulur" (is announced publicly).',
    pageNote: 'Some of these are on the 2026 list of court interpreters drawn up by a Turkish provincial justice commission. The languages shown are the ones each person is listed for.',
  },
  'vn-hcm': {
    publisher: 'Ho Chi Minh City Department of Justice (Sở Tư pháp TP. Hồ Chí Minh)',
    url: 'https://sotuphap.hochiminhcity.gov.vn/thong-bao',
    licenceOrTermsQuote: 'No terms of use found on sotuphap.hochiminhcity.gov.vn. The page is a public notice: "Danh sách phê duyệt cộng tác viên dịch thuật tại các tổ chức hành nghề công chứng trên địa bàn Thành phố Hồ Chí Minh (tính đến ngày 24/3/2026)".',
    pageNote: 'Some of these are notary offices on the Ho Chi Minh City Department of Justice list of approved translation collaborators. The languages shown are the ones the Department approved each office to certify translations in.',
  },
  tw: {
    publisher: 'Judicial Yuan of Taiwan (司法院)',
    url: 'https://www.judicial.gov.tw/tw/lp-151-1.html',
    licenceOrTermsQuote: 'Open Government Data License, version 1.0: "司法院網站上刊載之所有資料與素材...採政府資料開放授權條款-第1版發布，以無償、非專屬、得由使用者再授權之方式提供公眾使用...然使用時應註明出處。" (https://www.judicial.gov.tw/tw/cp-1327-84674-d8e05-1.html)',
    pageNote: 'Some of these are on the Judicial Yuan roster of contracted court interpreters, which gives a court district rather than an address. The languages shown are the ones each person is contracted for.',
  },
  tn: {
    publisher: 'Tunisian Ministry of Justice (وزارة العدل)',
    url: 'https://www.justice.gov.tn/index.php?id=368',
    licenceOrTermsQuote: 'No terms of use found on justice.gov.tn. The page is the ministry\'s "جدول المترجمين المحلفين حسب الاختصاص" (table of sworn translators by language).',
    pageNote: 'Some of these are on the Tunisian Ministry of Justice list of sworn translators. The language shown is the one each person is sworn for.',
  },
};

const PROPOSE = {
  'tr-bbk'() {
    const all = [];
    for (const region of Object.keys(TR_BBK)) {
      const file = fileOf('tr-bbk', region + '.pdf');
      const people = region === 'istanbul' ? bbkIstanbul(file) : bbkTables(region, file);
      for (const p of people) {
        const city = trCity(p.place.il, p.place.ilce);
        if (!city) continue;
        const { codes, dropped } = trCodes(p.langs);
        const r = finish('tr-bbk', {
          city, name: trTitle(p.name), area: trTitle(p.place.ilce) + ', ' + trTitle(p.place.il), precision: 'district',
          sourceUrl: TR_BBK[region][0], quote: 'Alt uzmanlık alanı: ' + p.quote,
        }, codes, dropped, 'tr');
        if (r) all.push(r);
      }
    }
    return all;
  },
  'tr-cmk'() {
    const all = [];
    const add = (list, city, name, langNames, extra) => {
      const { codes, dropped } = trCodes(langNames);
      const r = finish('tr-cmk', { city, name: trTitle(name), sourceUrl: TR_CMK[list][1], quote: 'Uzmanlık: ' + langNames.join(', '), ...extra }, codes, dropped, 'tr');
      if (r) all.push(r);
    };
    const splitLangs = trSplitNames;
    const rowsOf = (list) => py('tables', fileOf('tr-cmk', TR_CMK[list][0])).flatMap((t) => t.rows.map((r) => r.map((c) => (c == null ? '' : String(c)))));
    // Izmir: one line per person and language, no address; the list is the Izmir courthouse's.
    {
      const people = new Map();
      for (const r of rowsOf('izmir')) {
        if (!/^\d+$/.test(clean(r[0])) || r.length < 5) continue;
        const nm = clean(r[4]); const lg = clean(r[3]);
        if (!nm || !lg) continue;
        if (!people.has(nm)) people.set(nm, []);
        people.get(nm).push(lg);
      }
      for (const [nm, l] of people) add('izmir', 'izmir', nm, [...new Set(l)], { area: 'İzmir courthouse list', precision: 'court-list' });
    }
    // Gaziantep: the address is a home or work address; only its district is carried.
    for (const r of rowsOf('gaziantep')) {
      if (!/^\d+$/.test(clean(r[0])) || r.length < 7) continue;
      const addr = TRK(r[6]);
      const district = /SEHITKAMIL/.test(addr) ? 'Şehitkamil' : /SAHINBEY/.test(addr) ? 'Şahinbey' : /GAZIANTEP$/.test(addr) && !/(NIZIP|ISLAHIYE|NURDAGI|OGUZELI|ARABAN|YAVUZELI|KARKAMIS)/.test(addr) ? 'Merkez' : null;
      if (!district) { refuse('tr-cmk', trTitle(r[1]), 'address outside central Gaziantep', { list: 'gaziantep' }); continue; }
      add('gaziantep', 'gaziantep', r[1], splitLangs(r[5]), { area: district + ', Gaziantep', precision: 'district' });
    }
    // Mardin: no address; the institution column is where the person works.
    for (const r of rowsOf('mardin')) {
      if (!/^\d+$/.test(clean(r[0])) || r.length < 3) continue;
      add('mardin', 'mardin', r[1], splitLangs(r[2]), { area: 'Mardin courthouse list', precision: 'court-list' });
    }
    // Sanliurfa: "ILCE / IL" and a status column; only KABUL (accepted).
    for (const r of rowsOf('sanliurfa')) {
      if (!/^\d+$/.test(clean(r[0])) || r.length < 6) continue;
      if (TRK(r[5]) !== 'KABUL') { refuse('tr-cmk', trTitle(r[2]), 'status ' + clean(r[5]), { list: 'sanliurfa' }); continue; }
      const pl = trSplitPlace(r[4]);
      const city = pl && trCity(pl.il, pl.ilce);
      if (city !== 'sanliurfa') { refuse('tr-cmk', trTitle(r[2]), 'district outside central Sanliurfa: ' + clean(r[4]), { list: 'sanliurfa' }); continue; }
      add('sanliurfa', city, r[2], splitLangs(r[3]), { area: trTitle(pl.ilce) + ', Şanlıurfa', precision: 'district' });
    }
    // Trabzon: accepted and called to the oath (25/11/2025); "Ortahisar/TRABZON".
    for (const r of rowsOf('trabzon')) {
      if (!/^\d+$/.test(clean(r[0])) || r.length < 4) continue;
      const pl = trSplitPlace(r[3]);
      const city = pl && trCity(pl.il, pl.ilce);
      if (city !== 'trabzon') { refuse('tr-cmk', trTitle(r[1]), 'district outside central Trabzon: ' + clean(r[3]), { list: 'trabzon' }); continue; }
      add('trabzon', city, r[1], splitLangs(r[2]), { area: trTitle(pl.ilce) + ', Trabzon', precision: 'district', status: 'accepted for 2026, oath scheduled at publication' });
    }
    // Mugla: accepted applicants with the district of residence; those with missing documents are out.
    for (const sh of py('xlsx', fileOf('tr-cmk', TR_CMK.mugla[0]))) {
      for (const r of sh.rows) {
        if (!r[0] || !/^\d+$/.test(String(r[0]).trim())) continue;
        if (r[5] && clean(r[5])) { refuse('tr-cmk', trTitle(r[1]), 'documents missing: ' + clean(r[5]), { list: 'mugla' }); continue; }
        const city = trCity('MUGLA', r[3]);
        if (!city) continue;
        add('mugla', city, r[1], splitLangs(r[2]), { area: trTitle(r[3]) + ', Muğla', precision: 'district', status: 'accepted for 2026, oath 19/12/2025' });
      }
    }
    return all;
  },
  'vn-hcm'() {
    const s = loadText('vn-hcm', 'list.html');
    const tb = s.slice(s.indexOf('<table'), s.indexOf('</table>', s.indexOf('<table')));
    const out = [];
    for (const tr of tb.match(/<tr[\s\S]*?<\/tr>/g) || []) {
      const cs = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((x) => text(x[1]));
      if (cs.length < 4 || /TỔ CHỨC HÀNH NGHỀ/i.test(cs[1])) continue;
      const full = cs[1];
      // "Văn phòng công chứng Gia Định (tên cũ: Trần Quốc Phòng)": the former name is kept as a note.
      const name = clean(full.replace(/\((tên cũ|trước đây)[^)]*\)/gi, ''));
      const former = (full.match(/\((?:tên cũ|trước đây):?\s*([^)]*)\)/i) || [])[1];
      const addr = cs[2];
      const where = hcmCity(addr);
      if (!where.city) { refuse('vn-hcm', name, where.why, { address: addr }); continue; }
      const names = cs[3].split(/\s*[,;]\s*/).map(clean).filter(Boolean);
      const codes = []; const dropped = [];
      names.forEach((n) => { const c = codeOf('vi', n); if (c) codes.push(c); else dropped.push(n); });
      const r = finish('vn-hcm', {
        city: where.city, name, area: addr, precision: 'address', sourceUrl: 'https://sotuphap.hochiminhcity.gov.vn/thong-bao?_101_INSTANCE_emZ19pfF3Yyq_assetEntryId=4674025&_101_INSTANCE_emZ19pfF3Yyq_struts_action=%2Fasset_publisher%2Fview_content&_101_INSTANCE_emZ19pfF3Yyq_type=content&p_p_id=101_INSTANCE_emZ19pfF3Yyq&p_p_lifecycle=0',
        quote: 'Ngôn ngữ dịch được phê duyệt: ' + cs[3], ...(former ? { formerName: clean(former) } : {}),
      }, codes, dropped, 'vi');
      if (r) out.push(r);
    }
    return out;
  },
  tw() {
    const people = new Map();
    for (let p = 1; exists('tw', `p${p}.html`); p += 1) {
      const s = loadText('tw', `p${p}.html`);
      for (const t of s.match(/<table>[\s\S]*?<\/table>/g) || []) {
        const th = [...t.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => text(x[1]));
        const td = [...t.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => text(x[1]));
        const fieldOf = (label) => { const i = td.indexOf(label); return i >= 0 ? td[i + 1] : ''; };
        const court = fieldOf('法院轄區'); const period = fieldOf('聘任期間');
        if (!th[0] || !court) continue;
        const end = rocEnd(period);
        if (end && end < TODAY) { refuse('tw', th[0], 'appointment ended ' + end); continue; }
        // "臺灣高等法院、臺北高等行政法院、智慧財產及商業法院": a person may serve several courts; the
        // first court with one of our cities places the row.
        const city = court.split(/[、,，]/).map(clean).map((c) => TW_COURT[c]).find(Boolean);
        if (!city) { refuse('tw', th[0], 'court district not one of our cities: ' + court); continue; }
        const k = city + '|' + th[0];
        if (!people.has(k)) people.set(k, { city, name: th[0], courts: new Set(), langs: new Set(), no: fieldOf('編號') });
        const e = people.get(k);
        e.courts.add(court);
        th[1].split(/[,，、]/).map(clean).filter(Boolean).forEach((l) => e.langs.add(l));
      }
    }
    const out = [];
    for (const e of people.values()) {
      const codes = []; const dropped = [];
      for (const l of e.langs) {
        if (TW_LOCAL.test(l)) continue;
        const c = codeOf('tw', l);
        if (c) codes.push(c); else dropped.push(l);
      }
      const r = finish('tw', {
        city: e.city, name: e.name, area: [...e.courts].join(', '), precision: 'court-region',
        sourceUrl: 'https://www.judicial.gov.tw/tw/lp-151-1.html', quote: '語言: ' + [...e.langs].join(', '),
      }, codes, dropped, 'zh');
      if (r) out.push(r);
    }
    return out;
  },
  tn() {
    const people = new Map();
    for (const f of Object.keys(LANG.tn)) {
      if (!exists('tn', f)) continue;
      const code = LANG.tn[f];
      for (const t of py('tablewords', fileOf('tn', f))) {
        for (const row of t.rows) {
          const cs = row.map((c) => (c == null ? '' : String(c)));
          if (cs.length !== 6 || !/\d/.test(cs[5])) continue;
          // The first letter of a name in an initial-form glyph is sometimes set outside the name
          // cell and lands beside the row number ("2ﺻ" + "الح بن حليمة" for "صالح بن حليمة"). The
          // name cell alone would publish a wrong name, so any letter in the number cell refuses it.
          if (!/^\d+$/.test(clean(cs[5]))) { refuse('tn', arNorm(cs[4]), 'a letter of the name fell outside its cell: ' + clean(cs[5]), { file: f }); continue; }
          const rawName = cs[4];
          const langWord = arNorm(cs[3]);
          if (TN_BAD.test(arNorm(rawName))) { refuse('tn', clean(rawName), 'name has an unmapped ligature glyph; not repaired by guess', { file: f }); continue; }
          // A one-letter word, or a bare article, is a glyph the PDF set apart ("آ مال" for "آمال"):
          // no Arabic name has a one-letter word, so it is joined to the word after it.
          const name = arNorm(rawName).replace(/(^|\s)([ء-ي]|ال)\s+(?=[ء-ي])/g, '$1$2');
          // Some fonts also set a word gap after a letter that does not join forward ("سا مية" for
          // "سامية", "شح ةي"). A two-letter word other than بن or بو, or a ta marbuta inside a word,
          // shows it; such a name is refused, not rejoined by guess.
          if (name.split(' ').some((w) => (w.length <= 2 && !/^(بن|بو)$/.test(w)) || /ة./.test(w) || /^[ةى]/.test(w))) { refuse('tn', name, 'name split by the PDF inside a word; not rejoined by guess', { file: f }); continue; }
          const district = arNorm(cs[2]);
          const addr = arNorm(cs[1]);
          let city = TN_DISTRICT[district] || null;
          if (/سيدي بو ?سعيد/.test(addr)) city = 'sidibousaid';
          if (/جربة|حومة السوق|ميدون|أجيم/.test(addr)) city = 'djerba';
          if (!city) { refuse('tn', name, 'court district not one of our cities: ' + (district || '(blank)'), { file: f }); continue; }
          const k = city + '|' + name;
          if (!people.has(k)) people.set(k, { city, name, district, addr, codes: [], quotes: [], files: [] });
          const e = people.get(k);
          if (code) e.codes.push(code);
          e.quotes.push(langWord); e.files.push(f);
        }
      }
    }
    const out = [];
    for (const e of people.values()) {
      const r = finish('tn', {
        // The office address is used to place Sidi Bou Said and Djerba but not carried: the same
        // broken ligatures drop letters from street names silently ("يوغس فيا" for "يوغسلافيا").
        city: e.city, name: e.name, area: 'الدائرة الابتدائية: ' + e.district, precision: 'court-district',
        sourceUrl: 'https://www.justice.gov.tn/fileadmin/medias/les_intervenants/auxilieres_de_justice/interpretes_assermentes/tableau_interpretes_assermentes/' + e.files[0],
        quote: 'الاختصاص: ' + [...new Set(e.quotes)].join('، '),
      }, e.codes, e.codes.length ? [] : e.quotes, 'ar');
      if (r) out.push(r);
    }
    return out;
  },
};

function propose() {
  const db = require(path.join(ROOT, 'data', 'service-languages.json'));
  const TITLES = /^(dr|prof|doc|av|uzm|op)$/;
  const words = (s) => fold(s).toLowerCase().split(/[^\p{L}]+/u).filter((w) => w && !TITLES.test(w)).sort().join(' ');
  const have = new Map();
  db.providers.forEach((p) => { have.set(p.city + '|' + key(p.name), p); have.set(p.city + '|w|' + words(p.name), p); });
  const all = []; const perSource = []; const dupes = [];
  fs.mkdirSync(OUT, { recursive: true });
  const seen = new Map();
  for (const cc of ONLY) {
    if (!PROPOSE[cc]) continue;
    let rows;
    try { rows = PROPOSE[cc](); } catch (e) { console.log(cc + ': not read (' + e.message.split('\n')[0] + ')'); continue; }
    rows = rows.filter((r) => {
      const hit = have.get(r.city + '|' + key(r.name)) || have.get(r.city + '|w|' + words(r.name));
      if (hit) { dupes.push({ register: cc, name: r.name, city: r.city, existing: hit.name, source: hit.source }); return false; }
      // The same person on two Turkish lists (expert list and courthouse list): one row, languages
      // joined, the second list kept in alsoOn so each language still has its source.
      const k = r.city + '|w|' + words(r.name);
      const prev = seen.get(k);
      if (prev) {
        const add = r.languages.filter((l) => !prev.languages.includes(l));
        (prev.alsoOn = prev.alsoOn || []).push({ sourceUrl: r.sourceUrl, quote: r.quote, languages: r.languages });
        if (add.length && prev.languages.length + add.length <= MAX_LANGS) prev.languages.push(...add);
        return false;
      }
      seen.set(k, r);
      return true;
    });
    rows.forEach((r) => { Object.keys(r).forEach((k) => r[k] === undefined && delete r[k]); });
    const source = SOURCES[cc];
    fs.writeFileSync(path.join(OUT, `proposals-${cc}.json`), JSON.stringify({ source, rows }, null, 1));
    perSource.push({ register: cc, ...source, rows: rows.length });
    all.push(...rows.map((r) => ({ register: cc, ...r })));
  }
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify({ written: TODAY, perSource, rows: all }, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify({ refused, alreadyListed: dupes, unmappedLanguages: unmapped }, null, 1));
  const by = {};
  all.forEach((r) => { by[r.register] = by[r.register] || {}; by[r.register][r.city] = (by[r.register][r.city] || 0) + 1; });
  console.log(JSON.stringify(by, null, 1));
  console.log(`${all.length} rows; ${refused.length} refused; ${dupes.length} already listed`);
}

(async () => {
  if (cmd === 'fetch') { for (const cc of ONLY) if (FETCH[cc]) await FETCH[cc](); }
  else if (cmd === 'propose') propose();
  else { console.error('usage: node scripts/read_translator_registers2.cjs fetch|propose --cache <dir> [--out <dir>] [--only tr-bbk,tr-cmk,vn-hcm,tw,tn]'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Reads the official registers of sworn and court translators and interpreters that seven
 * governments publish, and proposes a translator row for each person whose address is in one of
 * our cities.
 *
 * WHY THESE SOURCES
 *
 * A sworn (court, authorised) translator is appointed by a ministry or a court for named languages,
 * after an exam or a qualification check, and the ministry publishes the list because courts,
 * registries and the public are meant to use it. So the language claim is the state's, per named
 * person, which is the official tier: nobody is guessing what a translator "speaks", the register
 * says which languages the person is entitled to certify. Each register is read as its publisher
 * lays it out, one reader per shape:
 *
 *   cz  Czech Ministry of Justice, Seznamy znalcu, tlumocniku a prekladatelu (seznat.justice.cz).
 *       Published as open data, one JSON file, with the statement that it is not a protected
 *       database and "je tak mozne bez omezeni vytezovat, zuzitkovat a opetovne uzivat".
 *   sk  Slovak Ministry of Justice, registers of interpreters and translators (justice.gov.sk),
 *       read through the JSON API its own register page calls.
 *   pl  Polish Ministry of Justice, Lista tlumaczy przysieglych (arch-bip.ms.gov.pl), the list the
 *       ministry's gov.pl page links as the official one. HTML, ten per page.
 *   hr  Croatian Ministry of Justice, Stalni sudski tumaci, on e-Oglasna ploca sudova (current;
 *       the data.gov.hr CSV under the Open Licence stopped in September 2023, so it is not used).
 *   si  Slovenian Ministry of Justice, Imenik sodnih tolmacev, on gov.si.
 *   ee  Estonian Ministry of Justice and Digital Affairs, Vandetolgid, one page on justdigi.ee.
 *   ro  Romanian Ministry of Justice, interpreti si traducatori autorizati, the JSON service behind
 *       just.ro's search. It gives a county, not an address: see THE ROMANIAN CAVEAT.
 *
 * Refused or unreachable, with the reason, in agents/translators/REPORT.md: Germany's
 * justiz-dolmetscher.de (its Rechtliche Hinweise forbid reuse without prior permission), Bulgaria's
 * MFA list (behind a bot wall), Italy's national CTU roll (a CAPTCHA on every search), Hungary's new
 * register of certified translators (host refused the connection).
 *
 * THE RULE
 *
 * The languages are the ones the person is appointed for, as the register writes them, mapped to
 * our ISO codes by name. Nothing is added: a Polish register entry "angielski" is en, and the
 * Polish that every Polish sworn translator works from is not written in, because it is the local
 * language and the site never publishes that. Same for Czech in Czechia, Slovak in Slovakia and so
 * on. A language the directory has no code for (Latin, Macedonian, Bosnian, Dari, sign language)
 * is dropped from the row, never mapped to a neighbour: Dari is not written as Persian, Moldovan is
 * not written as Romanian. A person left with no language is not proposed. More than six languages
 * refuses the person whole, the site-wide cap.
 *
 * Only people the register shows as currently entitled are read: the Polish list leaves out the
 * suspended ones itself, the Slovak API defaults to "zapis" (entered), and in the Czech open data
 * anyone with a zanik (end of entitlement) that was not followed by a new entry, or with a running
 * pozastaveni (suspension), is left out here. Croatia, Slovenia and Estonia publish only
 * current appointments. Romania's service does not say; that is noted in the report.
 *
 * PLACEMENT
 *
 * By the address the register prints, never by the court, the voivodeship or the county the search
 * was filtered on. A register's city field is not enough: "Krakow-Rzaska", "Wroclaw-Kielczow" and
 * "Poznan-Plewiska" are villages outside those cities that the Polish list files under the city's
 * name. So a row needs the locality after the postcode to start with the city name AND the postcode
 * to sit in the city's own range. Estonia prints no postcode on some entries, and "Narva mnt" is a
 * street in both Tallinn and Tartu, so a city word followed by a street word is not a locality.
 *
 * Only the locality and district are carried into `area` for people whose only address is a home
 * address (the Czech "trvaly pobyt"). A business seat or a contact address is carried whole.
 *
 * THE ROMANIAN CAVEAT
 *
 * just.ro gives a name, a court of appeal, a county, the languages and a phone number, and no
 * address. Bucharest is a county of its own, so a Bucharest row is placed as precisely as anything
 * else here. Cluj, Brasov, Sibiu, Timis, Constanta and Iasi counties are wider than their seat, and
 * those rows carry precision "county" so the caller can decide; they are proposed for the seat city
 * with the county named in `area`. Mures county (Sighisoara) is not mapped, because its seat is
 * Targu Mures, not Sighisoara.
 *
 * FOREIGN CITIES ON THE POLISH LIST
 *
 * Polish sworn translators may live abroad ("Berlin, Niemcy", "Barcelona, Hiszpania"). Those rows
 * are proposed with abroad: true, and there the languages are the ones on the register plus Polish,
 * minus the local language of the city's country. Polish is added on the statute, not by
 * inference: art. 1 of the Act of 25 November 2004 defines the profession as translating from
 * Polish into a foreign language and back, so a person on the list works in Polish by definition.
 * If the caller prefers the strict reading, drop the abroad rows; they are marked for that.
 *
 * STAGES
 *
 *   fetch    node scripts/read_translator_registers.cjs fetch --cache <dir> [--only cz,sk,...]
 *              downloads each register into <dir>/<cc>/. Resumable; the Polish crawl is the long
 *              one (about a thousand pages at one request in flight with a pause).
 *   propose  node scripts/read_translator_registers.cjs propose --cache <dir> [--out <dir>]
 *              writes <out>/proposals-<cc>.json per register ({ source, rows }), a combined
 *              <out>/proposals.json, and <out>/refused.json with every refusal and why.
 *
 * There is no ingest stage: data/ is not touched by this script.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'translators')));
const OUT = path.resolve(val('--out', CACHE));
const ONLY = (val('--only', 'cz,sk,pl,hr,si,ee,ro')).split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;

// Stroked and ligature letters do not decompose under NFD, so a plain NFD fold leaves "Ł" in
// "Łódź" and "Đ" in "Đakovo" and the name fails an ASCII gate one step later. Map them first.
const STROKED = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ø: 'O', ø: 'o', ß: 'ss', Æ: 'AE', æ: 'ae', Œ: 'OE', œ: 'oe', ı: 'i', Ħ: 'H', ħ: 'h' };
const fold = (s) => String(s || '').replace(/[ŁłĐđØøßÆæŒœıĦħ]/g, (c) => STROKED[c]).normalize('NFD').replace(/[̀-ͯ]/g, '');
const key = (s) => fold(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const decode = (s) => String(s || '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n));
const text = (html) => clean(decode(String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')));

async function get(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
      if (r.status === 200) return await r.text();
      if (r.status === 404) return null;
    } catch (e) { /* retried below */ }
    await sleep(3000 * (a + 1));
  }
  throw new Error('no answer from ' + url);
}
const dir = (cc) => { const d = path.join(CACHE, cc); fs.mkdirSync(d, { recursive: true }); return d; };
const save = (cc, f, s) => fs.writeFileSync(path.join(dir(cc), f), s);
const load = (cc, f) => fs.readFileSync(path.join(CACHE, cc, f), 'utf8');
const exists = (cc, f) => fs.existsSync(path.join(CACHE, cc, f));

// ---- languages ---------------------------------------------------------------
// One table per register language, keyed by the folded, lower-cased name with the word for
// "language" taken off. Anything not here is reported as unmapped and dropped from the row.
const LANG = {
  pl: {
    angielski: 'en', niemiecki: 'de', francuski: 'fr', hiszpanski: 'es', rosyjski: 'ru', ukrainski: 'uk', wloski: 'it',
    portugalski: 'pt', niderlandzki: 'nl', szwedzki: 'sv', dunski: 'da', norweski: 'no', finski: 'fi', czeski: 'cs',
    slowacki: 'sk', wegierski: 'hu', rumunski: 'ro', bulgarski: 'bg', chorwacki: 'hr', serbski: 'sr', slowenski: 'sl',
    litewski: 'lt', lotewski: 'lv', estonski: 'et', grecki: 'el', turecki: 'tr', arabski: 'ar', hebrajski: 'he', chinski: 'zh',
    japonski: 'ja', koreanski: 'ko', wietnamski: 'vi', hindi: 'hi', perski: 'fa', urdu: 'ur', indonezyjski: 'id',
    tajski: 'th', katalonski: 'ca', albanski: 'sq', gruzinski: 'ka', pendzabi: 'pa', polski: 'pl',
  },
  cz: {}, // built from the register's own English names, see langCz
  sk: {
    anglicky: 'en', nemecky: 'de', rusky: 'ru', madarsky: 'hu', francuzsky: 'fr', taliansky: 'it', spanielsky: 'es',
    polsky: 'pl', ukrajinsky: 'uk', srbsky: 'sr', arabsky: 'ar', chorvatsky: 'hr', cesky: 'cs', rumunsky: 'ro',
    vietnamsky: 'vi', holandsky: 'nl', cinsky: 'zh', bulharsky: 'bg', grecky: 'el', svedsky: 'sv', dansky: 'da',
    perzsky: 'fa', turecky: 'tr', norsky: 'no', bengalsky: 'bn', japonsky: 'ja', portugalsky: 'pt', slovinsky: 'sl',
    urdsky: 'ur', albansky: 'sq', finsky: 'fi', hebrejsky: 'he', slovensky: 'sk', kazasky: null, gruzinsky: 'ka',
    korejsky: 'ko', litovsky: 'lt', lotyssky: 'lv', estonsky: 'et', hindsky: 'hi', indonezsky: 'id', katalansky: 'ca',
  },
  hr: {
    engleski: 'en', njemacki: 'de', talijanski: 'it', francuski: 'fr', spanjolski: 'es', ruski: 'ru', ukrajinski: 'uk',
    madarski: 'hu', slovenski: 'sl', srpski: 'sr', albanski: 'sq', arapski: 'ar', bengalski: 'bn', bugarski: 'bg',
    ceski: 'cs', danski: 'da', 'farsi(perzijski)': 'fa', perzijski: 'fa', grcki: 'el', gruzijski: 'ka', hebrejski: 'he',
    hindski: 'hi', indonezijski: 'id', japanski: 'ja', katalonski: 'ca', kineski: 'zh', korejski: 'ko', latvijski: 'lv',
    litvanski: 'lt', nizozemski: 'nl', 'nizozemski/flamanski': 'nl', norveski: 'no', poljski: 'pl', portugalski: 'pt',
    rumunjski: 'ro', slovacki: 'sk', svedski: 'sv', turski: 'tr', finski: 'fi', estonski: 'et', vijetnamski: 'vi',
    tajlandski: 'th', urdu: 'ur', hrvatski: 'hr',
  },
  si: {
    angleski: 'en', nemski: 'de', italijanski: 'it', francoski: 'fr', spanski: 'es', ruski: 'ru', hrvaski: 'hr',
    srbski: 'sr', madzarski: 'hu', arabski: 'ar', bolgarski: 'bg', estonski: 'et', farsi: 'fa', finski: 'fi',
    grski: 'el', hebrejski: 'he', japonski: 'ja', kitajski: 'zh', nizozemski: 'nl', poljski: 'pl', portugalski: 'pt',
    romunski: 'ro', slovaski: 'sk', svedski: 'sv', turski: 'tr', ukrajinski: 'uk', ceski: 'cs', danski: 'da',
    norveski: 'no', albanski: 'sq', korejski: 'ko', litovski: 'lt', latvijski: 'lv', katalonski: 'ca', hindijski: 'hi',
    perzijski: 'fa', vietnamski: 'vi', slovenski: 'sl', 'pakistanski-urdu': 'ur', pandzabi: 'pa',
  },
  ee: {
    inglise: 'en', vene: 'ru', soome: 'fi', saksa: 'de', rootsi: 'sv', prantsuse: 'fr', hispaania: 'es', itaalia: 'it',
    portugali: 'pt', taani: 'da', norra: 'no', hollandi: 'nl', lati: 'lv', leedu: 'lt', ukraina: 'uk', poola: 'pl',
    sloveeni: 'sl', eesti: 'et', jaapani: 'ja', hiina: 'zh', ungari: 'hu', tsehhi: 'cs', kreeka: 'el', turgi: 'tr',
    araabia: 'ar', heebrea: 'he', norra_: 'no',
  },
  ro: {
    engleza: 'en', germana: 'de', franceza: 'fr', italiana: 'it', spaniola: 'es', rusa: 'ru', maghiara: 'hu',
    ucraineana: 'uk', portugheza: 'pt', olandeza: 'nl', neerlandeza: 'nl', suedeza: 'sv', daneza: 'da', norvegiana: 'no',
    finlandeza: 'fi', ceha: 'cs', slovaca: 'sk', poloneza: 'pl', bulgara: 'bg', croata: 'hr', sarba: 'sr', slovena: 'sl',
    greaca: 'el', 'greaca moderna': 'el', turca: 'tr', araba: 'ar', ebraica: 'he', chineza: 'zh', japoneza: 'ja',
    coreeana: 'ko', vietnameza: 'vi', hindi: 'hi', persana: 'fa', urdu: 'ur', indoneziana: 'id', thailandeza: 'th',
    catalana: 'ca', albaneza: 'sq', georgiana: 'ka', lituaniana: 'lt', letona: 'lv', estoniana: 'et', romana: 'ro',
    malaeziana: 'ms', bengaleza: 'bn', 'limba semnelor': null, neogreaca: 'el', polona: 'pl', 'ebraica(ivrit)': 'he',
    panjabi: 'pa', nepaleza: 'ne',
  },
};
const WORD_LANGUAGE = /\b(jazyk|jezik|keel|limba|language)\b/g;
const unmapped = {};
function codeOf(cc, name) {
  const k = fold(name).toLowerCase().replace(WORD_LANGUAGE, '').replace(/\(\d{4}-\d\d-\d\d\)/g, '').replace(/\s+/g, ' ').trim();
  const t = LANG[cc];
  const c = t[k] !== undefined ? t[k] : t[k.replace(/\s+/g, '')];
  if (c) return c;
  unmapped[cc + ':' + k] = (unmapped[cc + ':' + k] || 0) + 1;
  return null;
}

// ---- cities --------------------------------------------------------------------
// All 1,000 cities (data/city_list.json holds only 410). Read from cities-data.js, the same source
// scripts/lib/service_data.cjs builds CITY from: requiring that library instead runs its
// consistency checks, which exit the process whenever a country is missing from its LOCAL table,
// and a translator proposal should not fail on another category's unfinished country.
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITIES = m.exports;
const CITY = new Map(CITIES.map((c) => [c.id, c]));

// Postcode ranges, by prefix, for the cities in the countries with a register. The locality must
// also start with the city's name; the two together are the placement rule.
const PLACES = {
  pl: {
    // Wesola (05-075, 05-077) has been a district of Warsaw since 2002 and keeps its old postcodes.
    warsaw: ['Warszawa', /^(0[0-4]-|05-07[57]$)/], krakow: ['Krakow', /^3[01]-/], gdansk: ['Gdansk', /^80-/],
    wroclaw: ['Wroclaw', /^5[0-4]-/], poznan: ['Poznan', /^6[01]-/], torun: ['Torun', /^87-1[01]/],
    lublin: ['Lublin', /^20-/], katowice: ['Katowice', /^40-/], zakopane: ['Zakopane', /^34-50/],
    bydgoszcz: ['Bydgoszcz', /^85-/], bialystok: ['Bialystok', /^15-/], rzeszow: ['Rzeszow', /^35-/],
  },
  cz: {
    prague: ['Praha', /^1\d\d ?\d\d$/], brno: ['Brno', /^6[0-4]\d ?\d\d$/], ceskykrumlov: ['Cesky Krumlov', /^381 ?\d\d$/],
    telc: ['Telc', /^588 ?56$/], olomouc: ['Olomouc', /^77\d ?\d\d$/], plzen: ['Plzen', /^3[0-2]\d ?\d\d$/],
    karlovyvary: ['Karlovy Vary', /^36\d ?\d\d$/], liberec: ['Liberec', /^46\d ?\d\d$/],
  },
  sk: {
    bratislava: ['Bratislava', /^8[1-5]\d ?\d\d$/], kosice: ['Kosice', /^04\d ?\d\d$/],
    zilina: ['Zilina', /^010 ?\d\d$/], nitra: ['Nitra', /^949 ?\d\d$/],
  },
  hr: {
    zagreb: 'Zagreb', split: 'Split', dubrovnik: 'Dubrovnik', pula: 'Pula', zadar: 'Zadar', rovinj: 'Rovinj',
    trogir: 'Trogir', hvar: 'Hvar', sibenik: 'Sibenik', rijeka: 'Rijeka', osijek: 'Osijek',
  },
  si: { ljubljana: 'Ljubljana', bled: 'Bled', piran: 'Piran', maribor: 'Maribor' },
  ee: { tallinn: 'Tallinn', tartu: 'Tartu', narva: 'Narva' },
  // Romanian county id on just.ro -> [city, county name, precision]
  ro: {
    10: ['bucharest', 'Bucharest', 'city'], 14: ['clujnapoca', 'Cluj County', 'county'], 9: ['brasov', 'Brasov County', 'county'],
    35: ['sibiu', 'Sibiu County', 'county'], 38: ['timisoara', 'Timis County', 'county'],
    15: ['constanta', 'Constanta County', 'county'], 25: ['iasi', 'Iasi County', 'county'],
  },
};
const LOCAL = { pl: ['pl'], cz: ['cs'], sk: ['sk'], hr: ['hr'], si: ['sl'], ee: ['et'], ro: ['ro'] };

// The local language of each country a Polish translator abroad may live in (see FOREIGN CITIES).
const COUNTRY_LOCAL = {
  Germany: ['de'], Austria: ['de'], Switzerland: ['de', 'fr', 'it'], 'United Kingdom': ['en'], Ireland: ['en'],
  'United States': ['en'], Canada: ['en', 'fr'], Australia: ['en'], Spain: ['es', 'ca'], Portugal: ['pt'], France: ['fr'],
  Belgium: ['nl', 'fr', 'de'], Netherlands: ['nl'], Italy: ['it'], 'Czech Republic': ['cs'], Slovakia: ['sk'],
  Norway: ['no'], Sweden: ['sv'], Denmark: ['da'], Finland: ['fi', 'sv'], Greece: ['el'], Lithuania: ['lt'],
  Latvia: ['lv'], Estonia: ['et'], Croatia: ['hr'], Slovenia: ['sl'], Hungary: ['hu'], Romania: ['ro'], Bulgaria: ['bg'],
  Ukraine: ['uk'], Israel: ['he'], Luxembourg: ['fr', 'de'], Malta: ['en'], Cyprus: ['el'], Iceland: [],
  Chile: ['es'], Mexico: ['es'], Malaysia: ['ms'], 'North Macedonia': [], Belarus: ['ru'],
};
// The Polish names of those countries, folded, as the list writes them in a place or an address.
const PL_COUNTRY = {
  Germany: ['niemcy', 'republika federalna niemiec', 'deutschland', 'germany'], Austria: ['austria', 'osterreich'],
  Switzerland: ['szwajcaria', 'schweiz', 'suisse'], 'United Kingdom': ['wielka brytania', 'anglia', 'szkocja', 'walia', 'irlandia polnocna', 'united kingdom'],
  Ireland: ['irlandia', 'irlania', 'ireland'], 'United States': ['usa', 'stany zjednoczone'], Canada: ['kanada', 'canada'],
  Australia: ['australia'], Spain: ['hiszpania', 'hiszpani', 'espana', 'spain'], Portugal: ['portugalia', 'portugal'],
  France: ['francja', 'france'], Belgium: ['belgia', 'belgique', 'belgie'], Netherlands: ['holandia', 'niderlandy', 'nederland'],
  Italy: ['wlochy', 'italia'], 'Czech Republic': ['czechy', 'republika czeska'], Slovakia: ['slowacja'], Norway: ['norwegia', 'norge'],
  Sweden: ['szwecja', 'sverige'], Denmark: ['dania', 'danmark'], Finland: ['finlandia'], Greece: ['grecja'], Lithuania: ['litwa', 'lietuva'],
  Latvia: ['lotwa', 'latvija'], Estonia: ['estonia', 'eesti'], Croatia: ['chorwacja'], Slovenia: ['slowenia'], Hungary: ['wegry'], Romania: ['rumunia'],
  Bulgaria: ['bulgaria'], Ukraine: ['ukraina'], Israel: ['izrael'], Luxembourg: ['luksemburg'], Malta: ['malta'], Cyprus: ['cypr'],
  Chile: ['chile'], Mexico: ['meksyk'], Malaysia: ['malezja'], 'North Macedonia': ['macedonia'], Belarus: ['bialorus'],
};
// Polish exonyms of the foreign cities we index, where the Polish name is not the city's own.
const PL_EXONYM = {
  wieden: 'vienna', praga: 'prague', madryt: 'madrid', lizbona: 'lisbon', rzym: 'rome', mediolan: 'milan',
  florencja: 'florence', neapol: 'naples', wenecja: 'venice', ateny: 'athens', bruksela: 'brussels',
  kopenhaga: 'copenhagen', sztokholm: 'stockholm', londyn: 'london', paryz: 'paris', monachium: 'munich',
  kolonia: 'cologne', drezno: 'dresden', lipsk: 'leipzig', norymberga: 'nuremberg', wilno: 'vilnius', kowno: 'kaunas',
  ryga: 'riga', budapeszt: 'budapest', bratyslawa: 'bratislava', lublana: 'ljubljana', zagrzeb: 'zagreb',
  bukareszt: 'bucharest', edynburg: 'edinburgh', genewa: 'geneva', zurych: 'zurich', walencja: 'valencia',
  sewilla: 'seville', tallin: 'tallinn', kolonia_: 'cologne', frankfurtnadmenem: 'frankfurt', 'frankfurtammain': 'frankfurt',
};

// ---- fetch -------------------------------------------------------------------------
const FETCH = {
  async cz() {
    if (!exists('cz', 'tlumocnici.json')) {
      save('cz', 'tlumocnici.json', await get('https://seznat.justice.cz/GW/api/Tlumocnici/OpenData/?tlumocnici=true&format=4'));
      save('cz', 'ciselniky.json', await get('https://seznat.justice.cz/GW/api/Tlumocnici/OpenData/?tlumocnici=false&format=4'));
    }
    console.log('cz: open data saved');
  },
  async sk() {
    for (const ep of ['tlmocnik', 'prekladatel']) {
      if (exists('sk', ep + '.json')) continue;
      const all = [];
      // The API numbers pages from 1 and answers page=0 with a 500. It defaults to entries with the
      // state "zapis" (entered), which is the register's own list of people entitled today.
      for (let page = 1; page < 20; page += 1) {
        const j = JSON.parse(await get(`https://obcan.justice.sk/pilot/api/ress-isu-service/v1/${ep}?page=${page}&size=500`));
        all.push(...j[ep + 'List']);
        if (all.length >= j.numFound || !j[ep + 'List'].length) { console.log(`sk ${ep}: ${all.length} of ${j.numFound}, updated ${j.updateDate}`); break; }
        await sleep(800);
      }
      save('sk', ep + '.json', JSON.stringify(all));
    }
  },
  async pl() {
    const BASE = 'https://arch-bip.ms.gov.pl/pl/rejestry-i-ewidencje/tlumacze-przysiegli/lista-tlumaczy-przysieglych/';
    if (!exists('pl', 'index.html')) save('pl', 'index.html', await get(BASE + 'index.html'));
    const cities = [...load('pl', 'index.html').matchAll(/languages\.html\?City=([^"]*)">([^<]*)<\/a>/g)].map((x) => ({ q: x[1], name: decode(x[2]) }));
    const targets = cities.filter((c) => plPlace(c.name));
    console.log(`pl: ${cities.length} place names on the list, ${targets.length} to read`);
    const F = path.join(dir('pl'), 'rows.json');
    const done = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
    for (const c of targets) {
      if (done[c.name] && done[c.name].complete) continue;
      const langPage = await get(BASE + 'languages.html?City=' + c.q);
      const langs = [...String(langPage).matchAll(/list\.html\?City=[^&]*&(?:amp;)?Language=(\d+)/g)].map((x) => x[1]);
      const rows = {};
      for (const l of [...new Set(langs)]) {
        for (let p = 1; p < 200; p += 1) {
          const url = BASE + (p === 1 ? 'list.html' : `list,${p}.html`) + '?City=' + c.q + '&Language=' + l;
          const html = await get(url);
          await sleep(400);
          const found = parsePlList(html);
          found.forEach((r) => { rows[r.id] = r; });
          const last = Math.max(1, ...[...String(html).matchAll(/list,(\d+)\.html/g)].map((x) => Number(x[1])));
          if (p >= last || !found.length) break;
        }
      }
      done[c.name] = { complete: true, rows: Object.values(rows) };
      fs.writeFileSync(F, JSON.stringify(done));
      console.log(`pl ${c.name}: ${Object.keys(rows).length} translators over ${langs.length} languages`);
    }
  },
  async hr() {
    const F = path.join(dir('hr'), 'rows.json');
    const done = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { pages: {} };
    let last = 1;
    for (let p = 1; p <= last; p += 1) {
      if (!done.pages[p]) {
        const html = await get('https://e-oglasna.pravosudje.hr/sudski-tumaci?page=' + p);
        done.pages[p] = parseHr(html);
        done.last = Number((html.match(/stranica <span>\d+<\/span> od <span>(\d+)<\/span>/) || [])[1] || 1);
        fs.writeFileSync(F, JSON.stringify(done));
        await sleep(600);
      }
      last = done.last;
    }
    console.log(`hr: ${Object.values(done.pages).flat().length} entries over ${last} pages`);
  },
  async si() {
    const F = path.join(dir('si'), 'rows.json');
    const done = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { pages: {} };
    const BASE = 'https://www.gov.si/podrocja/pravna-drzava-in-pravosodje/pravosodni-sistem/imenik-sodnih-tolmacev/';
    for (let start = 0; start < 5000; start += 10) {
      if (!done.pages[start]) {
        const html = await get(BASE + '?start=' + start);
        done.pages[start] = parseSi(html);
        fs.writeFileSync(F, JSON.stringify(done));
        await sleep(600);
      }
      if (!done.pages[start].length) break;
    }
    console.log(`si: ${Object.values(done.pages).flat().length} entries`);
  },
  async ee() {
    save('ee', 'vandetolgid.html', await get('https://www.justdigi.ee/kohtud-ja-oigusteenused/elukutsed/vandetolk'));
    console.log('ee: page saved');
  },
  async ro() {
    const B = 'https://www.just.ro/mj-dmsws/int-mj/';
    const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (!exists('ro', 'limbi.json')) save('ro', 'limbi.json', await get(B + 'limbi-autorizate', { headers: J }));
    for (const id of Object.keys(PLACES.ro)) {
      if (exists('ro', `judet-${id}.json`)) continue;
      const body = JSON.stringify({ nume: '', idCurteApel: '-1', idLimba: '-1', idJudet: String(id), numar_autorizatie: '', telefon: '' });
      const n = Number(JSON.parse(await get(B + 'traducatori-count', { method: 'POST', headers: J, body })).info);
      const all = [];
      for (let s = 1; s <= n; s += 500) {
        const j = JSON.parse(await get(B + `traducatori-search?&indexStart=${s}&indexEnd=${s + 500}`, { method: 'POST', headers: J, body }));
        all.push(...(j.tertList || []).map((r) => ({ id: r.id, nume: r.nume, curteApel: r.curteApel, judet: r.judet, limbi: r.limbiAutorizate, nr: r.numar_autorizatie, telefon: r.telefon })));
        await sleep(800);
      }
      // indexEnd is exclusive in the page's own arithmetic, but overlapping windows are harmless:
      // entries are kept by id.
      const byId = {}; all.forEach((r) => { byId[r.id] = r; });
      save('ro', `judet-${id}.json`, JSON.stringify(Object.values(byId)));
      console.log(`ro county ${id}: ${Object.keys(byId).length} of ${n}`);
    }
  },
};

// ---- parsers -------------------------------------------------------------------------
function parsePlList(html) {
  const out = [];
  const t = String(html || '');
  for (const tr of t.split(/<tr[^>]*>/).slice(1)) {
    const id = (tr.match(/translator,(\d+)\.html/) || [])[1];
    if (!id) continue;
    const td = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    if (td.length < 7) continue;
    out.push({
      id, name: text(td[1]), langs: text(td[2]), citizenship: text(td[3]), voivodeship: text(td[4]), number: text(td[5]),
      address: decode(td[6]).split(/<br\s*\/?>/i).map((s) => clean(s.replace(/<[^>]+>/g, ' '))).filter(Boolean),
    });
  }
  return out;
}
function parseHr(html) {
  const out = [];
  for (const li of String(html).split('<li class="item').slice(1)) {
    const field = (label) => {
      const i = li.indexOf('>' + label + '</small>');
      if (i < 0) return '';
      const rest = li.slice(i);
      const end = rest.indexOf('<div class="pt-2">') > 0 ? rest.indexOf('<div class="pt-2">') : rest.length;
      return rest.slice(label.length + 9, end);
    };
    const nameBlock = field('Prezime i ime ili naziv, titula');
    out.push({
      name: text((nameBlock.match(/<strong[^>]*>([\s\S]*?)<\/strong>/) || [])[1]),
      address: text((field('Adresa').match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1]),
      county: text((field('Županija').match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1]),
      langs: [...(li.slice(li.indexOf('>Jezici</small>')).matchAll(/<span class="d-block">([^<]*)<\/span>/g))].map((x) => clean(decode(x[1]))).filter(Boolean),
    });
  }
  return out;
}
function parseSi(html) {
  const out = [];
  const body = String(html).split('js-registry-table')[1] || '';
  for (const tr of body.split('<tr>').slice(2)) {
    const href = (tr.match(/href="(\/podrocja\/[^"]+imenik-sodnih-tolmacev\/[^"]+\/)"/) || [])[1];
    if (!href) continue;
    // The split leaves the tag's closing ">" at the front of the cell; without the slice every
    // city read "> Ljubljana" and every language list began with ">".
    const cell = (k) => { const x = tr.split('data-key="' + k + '"')[1]; return x ? x.slice(x.indexOf('>') + 1).split('</td>')[0] : ''; };
    out.push({
      href: 'https://www.gov.si' + href,
      name: text((tr.match(/<a href="\/podrocja[^>]*>([\s\S]*?)<\/a>/) || [])[1]),
      city: text(cell('Mesto')),
      langs: decode(cell('Jezik')).replace(/<[^>]+>/g, '|').split('|').map(clean).filter(Boolean),
    });
  }
  return out;
}
function parseEe(html) {
  const out = [];
  let section = '';
  // Language sections open with <h2><a id="inglise">Inglise keel</a></h2>; each translator is one
  // text block whose first <strong> holds the name and the language pairs in brackets.
  const parts = String(html).split(/(<h2><a id="[^"]*"[^>]*>[^<]*<\/a><\/h2>|<div class="mb-3 field field--name-field-text-section-content[^"]*">)/);
  for (let i = 0; i < parts.length; i += 1) {
    const h = parts[i].match(/<h2><a id="[^"]*"[^>]*>([^<]*)<\/a><\/h2>/);
    if (h) { section = clean(decode(h[1])); continue; }
    if (!/^<div class="mb-3 field/.test(parts[i])) continue;
    const block = (parts[i + 1] || '').split('</div>')[0];
    const strong = [...block.matchAll(/<strong>([\s\S]*?)<\/strong>/g)].map((x) => text(x[1])).join(' ');
    const mm = strong.match(/^(.+?)\s*\(([^)]*)\)\s*$/);
    if (!mm) continue;
    const lines = decode(block.replace(/<strong>[\s\S]*?<\/strong>/g, '')).split(/<br\s*\/?>|<\/p>/i).map((s) => clean(s.replace(/<[^>]+>/g, ' '))).filter(Boolean);
    out.push({ section, name: clean(mm[1]), pairs: mm[2], lines });
  }
  return out;
}

// ---- placement ---------------------------------------------------------------------------
function plPlace(name) {
  const k = key(name.split(/[,(;]/)[0]);
  for (const [id, [n]] of Object.entries(PLACES.pl)) if (k.startsWith(key(n))) return { id, abroad: false };
  const country = fold(name).toLowerCase();
  if (!/,|\(|;|niemcy|hiszpan|holand|belgi|francj|anglia|brytan|irlandi|portugal|czechy|litwa|lotwa|grecja|wlochy|norweg|szwecj|dani|austri|szwajcar/.test(country)) return null;
  // Frankfurt (Oder) is on the Polish border and is not the Frankfurt we index (am Main).
  if (/\boder\b/i.test(name)) return null;
  const head = key(name.split(/[,(;]/)[0].replace(/\d+/g, ''));
  const hit = PL_EXONYM[head] || (CITY.has(head) && !PLACES.pl[head] ? head : null) ||
    CITIES.find((c) => key(c.name) === head && c.country !== 'Poland')?.id;
  return hit ? { id: hit, abroad: true } : null;
}
// A Polish address is one to three lines; the postcode line is "80-811 Gdansk" or "80-811 Gdansk 18".
function plAddress(lines) {
  const pc = lines.map((l) => l.match(/\b(\d\d-\d{3})\s+(.+)$/)).find(Boolean);
  return pc ? { postcode: pc[1], locality: pc[2] } : null;
}
// The address cell also carries phones, e-mail and a website, one per line or run together with
// commas. The address is everything before the first contact item; a website becomes the url.
const CONTACT = /@|adres dor|https?:|www\.|^\/?(tel|fax|kom|dom|mob)\b|^[+(]?[\d][\d\s()+\-.\/;:]{5,}$/i;
function plArea(lines) {
  const parts = lines.flatMap((l) => l.split(/,\s*/)).map(clean).filter(Boolean);
  // A phone item can carry words ("(052) 327-03-15 tel/fax"); seven digits or more at the start of
  // an item is a number, where a postcode item ("80-754 Gdansk") has five.
  const cut = parts.findIndex((x) => CONTACT.test(x) || (/^[+(\d]/.test(x) && (x.match(/\d/g) || []).length >= 7));
  return (cut < 0 ? parts : parts.slice(0, cut)).join(', ');
}
function plWebsite(lines) {
  const w = lines.join(' ').match(/(https?:\/\/[^\s,;]+|www\.[^\s,;]+)/i);
  return w ? (/^https?:/i.test(w[1]) ? w[1] : 'http://' + w[1]) : undefined;
}
function startsWithCity(locality, city) {
  const a = key(locality); const b = key(city);
  if (!a.startsWith(b)) return false;
  const rest = fold(locality).slice(fold(city).length);
  return !/^[a-z]/i.test(rest); // "Lubliniec" is not Lublin
}

// ---- propose -------------------------------------------------------------------------------
const refused = [];
const refuse = (cc, name, why, extra) => refused.push({ register: cc, name, why, ...(extra || {}) });
function langsFor(cc, names, cityCountryLocal) {
  const codes = []; const dropped = [];
  for (const n of names) {
    const c = codeOf(cc, n);
    if (!c) { dropped.push(n); continue; }
    if ((cityCountryLocal || LOCAL[cc]).includes(c)) continue;
    if (!codes.includes(c)) codes.push(c);
  }
  return { codes, dropped };
}
function finish(cc, name, r, codes, dropped) {
  // Two register lines in Romania are not names at all ("n/1999", "HaroMonica").
  if (!/\p{L}{2,}\.?\s+\p{L}/u.test(name) || /\//.test(name)) { refuse(cc, name, 'not a name'); return null; }
  if (!codes.length) { refuse(cc, name, dropped.length ? 'no language the directory has a code for: ' + dropped.join(', ') : 'only the local language'); return null; }
  if (codes.length > MAX_LANGS) { refuse(cc, name, codes.length + ' languages, over the cap of ' + MAX_LANGS); return null; }
  return { ...r, languages: codes, ...(dropped.length ? { droppedLanguages: dropped } : {}) };
}

const PROPOSE = {
  cz() {
    const data = JSON.parse(load('cz', 'tlumocnici.json').replace(/^﻿/, ''));
    const cis = JSON.parse(load('cz', 'ciselniky.json').replace(/^﻿/, ''));
    const langName = new Map(cis.Jazyky.map((j) => [j.Id, j.NazevAnglicky.trim()]));
    // The Czech list names its languages in English too, so the table is our own language names.
    const names = require(path.join(ROOT, 'data', 'service-languages.json'))._languages;
    Object.entries(names).forEach(([c, n]) => { LANG.cz[fold(n).toLowerCase()] = c; });
    Object.assign(LANG.cz, { sinhalese: 'si', 'chinese': 'zh', persian: 'fa', czech: 'cs', greek: 'el', malay: 'ms' });
    const now = new Date();
    const people = new Map();
    for (const p of data) {
      const nm = clean([p.Titul, p.Jmeno, p.Prijmeni].filter(Boolean).join(' ') + (p.TitulZa ? ', ' + p.TitulZa : ''));
      // A zanik has no end date in this data (DatumDo is empty on all 4,396 of them), but 449 of
      // those people were entered again later (DatumOpakovanyZapis after every zanik): mostly the
      // old-law interpreters whose entitlement lapsed under s. 44(3) of Act 354/2019 and who then
      // re-registered. They are entitled today; the rest are not.
      const reentered = p.DatumOpakovanyZapis && (p.Zaniky || []).every((z) => new Date(p.DatumOpakovanyZapis) > new Date(z.DatumOd));
      if ((p.Zaniky || []).length && !reentered) { refuse('cz', nm, 'entitlement ended (zanik)'); continue; }
      const paused = (p.Pozastaveni || []).some((z) => new Date(z.DatumOd) <= now && (!z.DatumDo || new Date(z.DatumDo) >= now));
      if (paused) { refuse('cz', nm, 'suspended (pozastaveni) today'); continue; }
      // Seat first, then a contact address, then residence; only the first two are carried whole.
      const order = [3, 8, 6, 7, 1, 2];
      const addr = order.map((t) => (p.Adresy || []).find((a) => a.IdTypAdresy === t)).find(Boolean);
      if (!addr) { refuse('cz', nm, 'no address'); continue; }
      const mm = addr.AdresaText.match(/(\d{3} ?\d{2})\s+([^,]+)$/);
      const hit = mm && Object.entries(PLACES.cz).find(([, [n, pc]]) => startsWithCity(mm[2], n) && pc.test(mm[1]));
      if (!hit) continue;
      const home = addr.IdTypAdresy === 1 || addr.IdTypAdresy === 2;
      const parts = addr.AdresaText.split(',').map(clean);
      const area = home ? parts.slice(1).join(', ').replace(/\d{3} ?\d{2}\s+/, '') : addr.AdresaText;
      const web = (p.Kontakty || []).find((k) => k.IdTypKontaktu === 2);
      const langs = (p.JazykySpecializace || []).map((j) => langName.get(j.IdJazyk)).filter(Boolean);
      const k = key(nm) + '|' + key(addr.AdresaText);
      const prev = people.get(k);
      if (prev) { prev.langNames = [...new Set([...prev.langNames, ...langs])]; prev.ids.push(p.Id); continue; }
      people.set(k, { city: hit[0], nm, area, url: web ? (/^https?:/.test(web.Hodnota) ? web.Hodnota : 'https://' + web.Hodnota) : undefined, langNames: langs, ids: [p.Id], kind: p.IdDruhOsoby });
    }
    const rows = [];
    for (const x of people.values()) {
      const { codes, dropped } = langsFor('cz', x.langNames);
      const r = finish('cz', x.nm, {
        city: x.city, name: x.nm, category: 'translator', url: x.url, area: x.area,
        sourceUrl: 'https://seznat.justice.cz/tlumocnik/detail/' + x.ids[0], evidence: 'official', checked: TODAY,
        quote: 'Jazyky: ' + x.langNames.join(', '),
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  sk() {
    const people = new Map();
    for (const ep of ['tlmocnik', 'prekladatel']) {
      for (const p of JSON.parse(load('sk', ep + '.json'))) {
        const mm = String(p.miestoVykonu || '').match(/(\d{3} ?\d{2})\s+([^,]+)$/);
        const hit = mm && Object.entries(PLACES.sk).find(([, [n, pc]]) => startsWithCity(mm[2], n) && pc.test(mm[1]));
        if (!hit) continue;
        const k = key(p.meno) + '|' + key(p.miestoVykonu);
        const prev = people.get(k);
        if (prev) { prev.langNames = [...new Set([...prev.langNames, ...p.jazyk])]; continue; }
        people.set(k, { city: hit[0], nm: clean(p.meno), area: clean(p.miestoVykonu), langNames: [...p.jazyk], guid: p.registreGuid, ep });
      }
    }
    const rows = [];
    for (const x of people.values()) {
      const { codes, dropped } = langsFor('sk', x.langNames);
      const r = finish('sk', x.nm, {
        city: x.city, name: x.nm, category: 'translator', area: x.area,
        sourceUrl: `https://www.justice.gov.sk/registre/${x.ep === 'tlmocnik' ? 'tlmocnici' : 'prekladatelia'}/${x.guid}`,
        evidence: 'official', checked: TODAY, quote: x.langNames.join(', '),
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  pl() {
    const done = JSON.parse(load('pl', 'rows.json'));
    const people = new Map();
    for (const [placeName, v] of Object.entries(done)) {
      const place = plPlace(placeName);
      if (!place) continue;
      for (const p of v.rows) {
        if (people.has(p.id)) continue;
        let city = place.id;
        if (place.abroad) {
          // The fetch matched on the place name alone ("BOSTON, Enterprise Way" is Boston in
          // Lincolnshire). Here the country must be written, in Polish, in the place name or the
          // address, and be the country of the city we would file the person under.
          // Two of our cities can share a name (Granada in Spain and in Nicaragua), so every city
          // with the matched name is tried and the one whose country is written wins.
          const where = fold(placeName + ' ' + p.address.join(' ')).toLowerCase();
          const said = (c) => { const w = PL_COUNTRY[c.country]; return w && [...w, fold(c.country).toLowerCase()].some((x) => where.includes(x)); };
          const twins = CITIES.filter((c) => c.id === city || key(c.name) === key(CITY.get(city).name));
          const found = twins.find(said);
          if (!found) { refuse('pl', p.name, 'abroad, country not confirmed for ' + city + ': ' + placeName + ' / ' + p.address.join(', ')); continue; }
          city = found.id;
        }
        if (!place.abroad) {
          const a = plAddress(p.address);
          const [n, pc] = PLACES.pl[city];
          if (!a || !startsWithCity(a.locality, n) || !pc.test(a.postcode)) { refuse('pl', p.name, 'address outside ' + n + ': ' + p.address.join(', ')); continue; }
        }
        people.set(p.id, { ...p, city, abroad: place.abroad });
      }
    }
    const rows = [];
    for (const p of people.values()) {
      const names = p.langs.split(',').map((s) => clean(s.replace(/\([^)]*\)/g, ''))).filter(Boolean);
      const local = p.abroad ? COUNTRY_LOCAL[CITY.get(p.city).country] : null;
      if (p.abroad && !local) { refuse('pl', p.name, 'abroad in a country with no local-language entry: ' + CITY.get(p.city).country); continue; }
      const { codes, dropped } = langsFor('pl', p.abroad ? [...names, 'polski'] : names, local || undefined);
      const r = finish('pl', p.name, {
        city: p.city, name: p.name, category: 'translator', area: plArea(p.address), url: plWebsite(p.address),
        sourceUrl: 'https://arch-bip.ms.gov.pl/pl/rejestry-i-ewidencje/tlumacze-przysiegli/lista-tlumaczy-przysieglych/translator,' + p.id + '.html',
        evidence: 'official', checked: TODAY, quote: 'Języki: ' + p.langs, registerNumber: p.number,
        ...(p.abroad ? { abroad: true } : {}),
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  hr() {
    const done = JSON.parse(load('hr', 'rows.json'));
    const seen = new Set();
    const rows = [];
    for (const p of Object.values(done.pages).flat()) {
      // The address is "street, town"; a postcode sometimes sits in front of the town.
      const locality = clean(String(p.address).split(',').pop().replace(/\d+/g, ''));
      const hit = Object.entries(PLACES.hr).find(([, n]) => key(locality) === key(n));
      if (!hit) continue;
      const k = key(p.name) + '|' + key(p.address);
      if (seen.has(k)) continue;
      seen.add(k);
      // The register writes names SURNAME GIVEN in capitals; shown in title case, order kept.
      const nm = p.name.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (a, b, c) => b + c.toUpperCase());
      const { codes, dropped } = langsFor('hr', p.langs);
      const r = finish('hr', nm, {
        city: hit[0], name: nm, category: 'translator', area: p.address,
        sourceUrl: 'https://e-oglasna.pravosudje.hr/sudski-tumaci?text=' + encodeURIComponent(p.name),
        evidence: 'official', checked: TODAY, quote: 'Jezici: ' + p.langs.join(', '),
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  si() {
    const done = JSON.parse(load('si', 'rows.json'));
    const seen = new Set();
    const rows = [];
    for (const p of Object.values(done.pages).flat()) {
      const hit = Object.entries(PLACES.si).find(([, n]) => startsWithCity(p.city, n));
      if (!hit || seen.has(p.href)) continue;
      seen.add(p.href);
      // One entry writes two languages in one cell: "PAKISTANSKI-URDU,PANDŽABI".
      const { codes, dropped } = langsFor('si', p.langs.flatMap((l) => l.split(',')).map(clean).filter(Boolean));
      const r = finish('si', p.name, {
        city: hit[0], name: p.name, category: 'translator', area: p.city,
        sourceUrl: p.href, evidence: 'official', checked: TODAY, quote: 'Jezik: ' + p.langs.join(', '),
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  ee() {
    const people = new Map();
    for (const p of parseEe(load('ee', 'vandetolgid.html'))) {
      const addr = p.lines.filter((l) => !/^(telefon|mobiil|e-post|üldtelefon|dokument|palun|kutsetunnistus|tel\b)/i.test(l));
      let city = null;
      for (const l of addr) {
        for (const [id, n] of Object.entries(PLACES.ee)) {
          // "Tartu maakond" and "Tartu vald" are the county and a rural parish, not the city. A
          // translator with offices in two cities is filed under the first one the entry names.
          const re = new RegExp('\\b' + n + '\\b(?!\\s*(mnt|maantee|tn|tänav|pst|puiestee|maakond|vald)\\b)', 'i');
          if (!city && re.test(l)) city = id;
        }
      }
      if (!city) continue;
      const langNames = p.pairs.split(/[,;]/).flatMap((pair) => pair.split('-')).map((s) => clean(s)).filter(Boolean);
      const k = key(p.name);
      const prev = people.get(k);
      if (prev) { prev.langNames.push(...langNames); prev.pairs.push(p.pairs); continue; }
      people.set(k, { city, nm: p.name, langNames, pairs: [p.pairs], area: addr.filter((l) => !/:/.test(l) && (/\d/.test(l) || new RegExp(PLACES.ee[city], 'i').test(l))).slice(0, 2).join(', ') });
    }
    const rows = [];
    for (const x of people.values()) {
      const nm = x.nm.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (a, b, c) => b + c.toUpperCase());
      const { codes, dropped } = langsFor('ee', [...new Set(x.langNames)]);
      const r = finish('ee', nm, {
        city: x.city, name: nm, category: 'translator', area: x.area,
        sourceUrl: 'https://www.justdigi.ee/kohtud-ja-oigusteenused/elukutsed/vandetolk', evidence: 'official', checked: TODAY,
        quote: x.nm + ' (' + [...new Set(x.pairs)].join('; ') + ')',
      }, codes, dropped);
      if (r) rows.push(r);
    }
    return rows;
  },
  ro() {
    const rows = [];
    for (const [id, [city, county, precision]] of Object.entries(PLACES.ro)) {
      if (!exists('ro', `judet-${id}.json`)) continue;
      const seen = new Set();
      for (const p of JSON.parse(load('ro', `judet-${id}.json`))) {
        // Some names come as "Abălaşei Laura Monica|Abalasei Laura Monica": the register's own
        // spelling, then an ASCII copy. The first is the name.
        const nm = clean(String(p.nume).split('|')[0]);
        const k = key(nm) + '|' + (p.nr || '');
        if (seen.has(k)) continue;
        seen.add(k);
        const names = String(p.limbi || '').split(',').map(clean).filter(Boolean);
        const { codes, dropped } = langsFor('ro', names);
        const r = finish('ro', nm, {
          city, name: nm, category: 'translator', area: county, precision,
          sourceUrl: 'https://www.just.ro/beta-interpreti-traducatori-rezultate/', evidence: 'official', checked: TODAY,
          quote: 'Limba: ' + p.limbi, registerNumber: p.nr,
        }, codes, dropped);
        if (r) rows.push(r);
      }
    }
    return rows;
  },
};

// What a reader sees once per page, and the terms each register was read under.
const SOURCES = {
  cz: {
    publisher: 'Czech Ministry of Justice', url: 'https://seznat.justice.cz/opendata',
    licenceOrTermsQuote: 'Poskytovana distribuce datove sady neni chranena zvlastnim pravem porizovatele databaze ... Data poskytovane distribuce datove sady je tak mozne bez omezeni vytezovat, zuzitkovat a opetovne uzivat.',
    pageNote: 'Some of these are on the Czech Ministry of Justice\'s list of court interpreters and court translators. The languages shown are the ones each person is appointed for.',
  },
  sk: {
    publisher: 'Slovak Ministry of Justice', url: 'https://www.justice.gov.sk/registre/tlmocnici/',
    licenceOrTermsQuote: 'No terms of use are published on justice.gov.sk; the site footer carries only a cookie notice, a privacy page and an accessibility statement. The lists are public by law (Act 382/2004).',
    pageNote: 'Some of these are on the Slovak Ministry of Justice\'s registers of interpreters and translators. The languages shown are the ones each person is registered for.',
  },
  pl: {
    publisher: 'Polish Ministry of Justice', url: 'https://arch-bip.ms.gov.pl/pl/rejestry-i-ewidencje/tlumacze-przysiegli/lista-tlumaczy-przysieglych/search.html',
    licenceOrTermsQuote: 'The list page carries no terms. The ministry\'s gov.pl page that links it says: "Tresci tekstowe publikowane w serwisie (z wylaczeniem tresci audiowizualnych), sa udostepniane na licencji typu Creative Commons: uznanie autorstwa - na tych samych warunkach 4.0 (CC BY-SA 4.0)."',
    pageNote: 'Some of these are on the Polish Ministry of Justice\'s list of sworn translators, which leaves out anyone suspended. The languages shown are the ones each person is sworn for.',
  },
  hr: {
    publisher: 'Croatian Ministry of Justice, Administration and Digital Transformation', url: 'https://e-oglasna.pravosudje.hr/sudski-tumaci',
    licenceOrTermsQuote: 'No terms of use on e-Oglasna. The ministry publishes the same list on data.gov.hr (dataset "Stalni sudski tumaci") under the Otvorena dozvola (Open Licence).',
    pageNote: 'Some of these are on the list of permanent court interpreters that Croatia\'s Ministry of Justice publishes. The languages shown are the ones each person is appointed for.',
  },
  si: {
    publisher: 'Slovenian Ministry of Justice', url: 'https://www.gov.si/podrocja/pravna-drzava-in-pravosodje/pravosodni-sistem/imenik-sodnih-tolmacev/',
    licenceOrTermsQuote: 'No terms of use on gov.si ("O spletnem mestu" has none). The register is listed on the national open data portal podatki.gov.si as "Imenik sodnih tolmacev".',
    pageNote: 'Some of these are on the Slovenian Ministry of Justice\'s register of court interpreters. The languages shown are the ones each person is appointed for.',
  },
  ee: {
    publisher: 'Estonian Ministry of Justice and Digital Affairs', url: 'https://www.justdigi.ee/kohtud-ja-oigusteenused/elukutsed/vandetolk',
    licenceOrTermsQuote: 'No terms of use on justdigi.ee. The page says: "Vandetolk on vaba elukutse esindaja, kellel on ainsana riigis padevus teha ametlikke tolkeid."',
    pageNote: 'Some of these are on the Estonian Ministry of Justice and Digital Affairs\' list of sworn translators. The languages shown are the ones each person is sworn for.',
  },
  ro: {
    publisher: 'Romanian Ministry of Justice', url: 'https://www.just.ro/beta-interpreti-traducatori-rezultate/',
    licenceOrTermsQuote: 'No terms of use found on just.ro.',
    pageNote: 'Some of these are on the Romanian Ministry of Justice\'s list of authorised interpreters and translators, which gives a county rather than an address. The languages shown are the ones each person is authorised for.',
  },
};

function propose() {
  const db = require(path.join(ROOT, 'data', 'service-languages.json'));
  const have = new Map();
  // Existing rows often write "SURNAME, Given, Dr." (the German consular lists), so names are also
  // compared as a sorted set of words with academic titles taken out.
  const TITLES = /^(mgr|ing|bc|dr|drs|phdr|judr|mudr|rndr|paeddr|thdr|phd|csc|drsc|prof|doc|dipl|mba|msc|ma|ba|mag|univ|arch|lic)$/;
  const words = (s) => fold(s).toLowerCase().split(/[^a-z]+/).filter((w) => w && !TITLES.test(w)).sort().join(' ');
  db.providers.forEach((p) => { have.set(p.city + '|' + key(p.name), p); have.set(p.city + '|w|' + words(p.name), p); });
  const all = []; const perSource = []; const dupes = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const cc of ONLY) {
    if (!PROPOSE[cc]) continue;
    let rows;
    try { rows = PROPOSE[cc](); } catch (e) { console.log(cc + ': not fetched (' + e.message.split('\n')[0] + ')'); continue; }
    // Duplicates are looked for against the directory, by city and folded name. Existing rows fold
    // names to ASCII and sometimes write SURNAME, Given; the key ignores order-free punctuation only,
    // so "SEBESTA, Daniel" and "Daniel Sebesta" are NOT caught here and are listed for a human.
    rows = rows.filter((r) => {
      const hit = have.get(r.city + '|' + key(r.name)) || have.get(r.city + '|w|' + words(r.name));
      if (hit) { dupes.push({ register: cc, name: r.name, city: r.city, existing: hit.name, source: hit.source }); return false; }
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
  console.log(JSON.stringify(by));
  console.log(`${all.length} rows; ${refused.length} refused; ${dupes.length} already listed; unmapped:`, unmapped);
}

(async () => {
  if (cmd === 'fetch') { for (const cc of ONLY) if (FETCH[cc]) await FETCH[cc](); }
  else if (cmd === 'propose') propose();
  else { console.error('usage: node scripts/read_translator_registers.cjs fetch|propose --cache <dir> [--out <dir>] [--only cz,sk,pl,hr,si,ee,ro]'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });

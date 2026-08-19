/**
 * Turns the sweep of Spain's sworn-translator register into rows.
 *
 * Placement is by postcode, not by the province the search was filtered on and not by the town name
 * in the address. The filter returns a whole province, so Barcelona's English search includes people
 * in Rubi, Terrassa and Sitges; and the address ends "RUBI BARCELONA", so reading the last word puts
 * them in the wrong city. A postcode is unambiguous: 08191 is Rubi, 08001 is Barcelona.
 *
 * Only active entries are taken. The register marks people who are no longer entitled to work, and
 * a directory that lists them would be worse than one that lists nobody.
 *
 * Usage: node scripts/add_maec_translators.cjs <sweepDir> [--preview]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
if (!DIR || !fs.existsSync(DIR)) {
  console.error('usage: node scripts/add_maec_translators.cjs <sweepDir> [--preview]');
  process.exit(2);
}
const PREVIEW = process.argv.includes('--preview');
const F = path.join(ROOT, 'data', 'service-languages.json');
const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const CHECKED = new Date().toISOString().slice(0, 10);
const SRC = 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Buscador-STIJ.aspx';

// The core postcode range of each Spanish city we index. Same discipline as the consular parser:
// the range decides, so a neighbouring town in the same province is not filed under the city.
const CORE = {
  barcelona: [8001, 8042], madrid: [28001, 28055], valencia: [46001, 46026],
  seville: [41001, 41020], malaga: [29001, 29018], marbella: [29600, 29604],
  granadaspain: [18001, 18016], alicante: [3001, 3016], cadiz: [11001, 11012],
  bilbao: [48001, 48015], palma: [7001, 7015], ibiza: [7800, 7819],
  zaragoza: [50001, 50018], laspalmas: [35001, 35019], tenerife: [38001, 38010],
  girona: [17001, 17007], sansebastian: [20001, 20018], toledo: [45001, 45009],
  salamanca: [37001, 37008], segovia: [40001, 40006], caceres: [10001, 10005],
  santiagodecompostela: [15701, 15707], gijon: [33201, 33213], albarracin: [44100, 44100],
  tarifa: [11380, 11380], ronda: [29400, 29400], fuerteventura: [35600, 35660],
  cudillero: [33150, 33150], besalu: [17850, 17850],
};

const LANG = {
  'INGLÉS': 'en', 'ALEMÁN': 'de', 'FRANCÉS': 'fr', 'ITALIANO': 'it', 'PORTUGUÉS': 'pt',
  'RUSO': 'ru', 'CHINO': 'zh', 'ÁRABE': 'ar', 'NEERLANDÉS': 'nl', 'POLACO': 'pl',
  'JAPONÉS': 'ja', 'RUMANO': 'ro', 'CATALÁN': 'ca', 'GRIEGO': 'el', 'TURCO': 'tr',
  'SUECO': 'sv', 'DANÉS': 'da', 'NORUEGO': 'no', 'CHECO': 'cs', 'HÚNGARO': 'hu',
  'BÚLGARO': 'bg', 'CROATA': 'hr', 'UCRANIANO': 'uk', 'HEBREO': 'he', 'PERSA': 'fa',
};

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
if (!files.length) { console.error('no pages in ' + DIR); process.exit(1); }

// One person holds one title per language, so the same name appears once per language sweep. Merge
// on name and address, and collect the languages: that is the row this directory wants.
const people = new Map();
let read = 0;
let skippedInactive = 0;
for (const f of files) {
  let rows;
  try {
    rows = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts', 'parse_maec_translators.cjs'), path.join(DIR, f), '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  } catch (e) { console.error('unreadable: ' + f); continue; }
  read += rows.length;
  for (const r of rows) {
    if (!r.active) { skippedInactive++; continue; }
    const code = LANG[r.language];
    if (!code) continue;
    const key = r.name.toLowerCase() + '|' + (r.address.match(/\b(\d{5})\b/) || [])[1];
    const e = people.get(key);
    if (e) { if (!e.langs.includes(code)) e.langs.push(code); continue; }
    people.set(key, { name: r.name, address: r.address, title: r.title, langs: [code] });
  }
}

const placed = [];
const outsideCities = [];
for (const p of people.values()) {
  const pc = Number((p.address.match(/\b(\d{5})\b/) || [])[1]);
  if (!pc) { outsideCities.push(p.name); continue; }
  const city = Object.keys(CORE).find((id) => pc >= CORE[id][0] && pc <= CORE[id][1]);
  if (!city) { outsideCities.push(p.name); continue; }
  // Spanish is the working language of the register itself; what a reader searches for is the other
  // one. Both are recorded, because a sworn translator does work in both directions.
  const languages = [...new Set(['es', ...p.langs])].filter((l) => d._languages[l]);
  placed.push({
    city,
    name: p.name,
    category: 'translator',
    languages,
    sourceUrl: SRC,
    evidence: 'official',
    checked: CHECKED,
    area: p.address.replace(/\s+/g, ' ').trim().slice(0, 120),
    note:
      "On Spain's official register of sworn translators and interpreters, kept by the Ministry of " +
      'Foreign Affairs, as a ' + p.title.toLowerCase() + ' for ' +
      p.langs.map((l) => d._languages[l]).join(' and ') + '. ' +
      'Only people the register currently marks as active are listed here. A sworn translation in ' +
      'Spain may only be produced by someone on this register, so the entry is a statement about ' +
      'a qualification, not a recommendation: the ministry makes no judgement about the service.',
  });
}

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const known = new Set(m.exports.map((c) => c.id));
const bad = placed.filter((p) => !known.has(p.city) || !p.languages.length || p.name.length < 4);
if (bad.length) { console.error('invalid: ' + bad.slice(0, 4).map((p) => p.name).join(', ')); process.exit(1); }

// Fold before deduplicating, not after. Done the other way round, 'Alicia GARCIA GARCIA' with
// accents and 'Alicia Garcia Garcia' without them normalise to different strings, both survive,
// and the folding at the end makes them identical: two rows for one person, which the dupe gate
// then catches one step too late.
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^ -~]/g, '');
placed.forEach((p) => { p.name = fold(p.name); p.area = fold(p.area); p.note = fold(p.note); });

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const have = {};
d.providers.forEach((p) => { (have[p.city] = have[p.city] || []).push(norm(p.name)); });
const fresh = placed.filter((p) => {
  const n = norm(p.name);
  const ex = have[p.city] || (have[p.city] = []);
  if (ex.includes(n)) return false;
  ex.push(n);
  return true;
});

const stillBad = fresh.filter((p) => /[^\x20-\x7E]/.test(JSON.stringify(p)));
if (stillBad.length) { console.error('non-ASCII survives: ' + stillBad.length); process.exit(1); }

const per = {};
fresh.forEach((p) => { per[p.city] = (per[p.city] || 0) + 1; });
console.log('read ' + read + ' register lines from ' + files.length + ' pages');
console.log('  inactive, left out: ' + skippedInactive);
console.log('  outside the cities we index: ' + outsideCities.length);
console.log('  placed: ' + fresh.length + ' in ' + Object.keys(per).length + ' cities');
console.log('  ' + Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));

if (PREVIEW) {
  fresh.slice(0, 8).forEach((p) => console.log('   ' + p.city.padEnd(12) + p.name.slice(0, 34).padEnd(36) + p.languages.join(',')));
  process.exit(0);
}

d.providers = d.providers.concat(fresh);
fs.writeFileSync(F, JSON.stringify(d, null, 2) + '\n');
console.log('total ' + d.providers.length);

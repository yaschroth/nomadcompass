/**
 * Turns the FCDO translator sweep into rows, for any country.
 *
 * The service names the languages each provider works in and the places it covers, per person. The
 * places are free text ("Offices in Paris and Lyon", "Firenze, Milano, Bari", "entire country"), so
 * a provider is placed only where the text names a city this site indexes, matched on the city's own
 * name or a local spelling. "Entire country" and "all regions" are honest answers to a different
 * question: putting those people in the capital would invent a location the source does not give,
 * and they are reported as unplaced rather than quietly dropped.
 *
 * Usage: node scripts/add_fcdo_translators.cjs <sweepDir> [--preview]
 *   sweepDir holds <Country>_<lang>.html pages saved by fetch_fcdo_professionals.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
if (!DIR || !fs.existsSync(DIR)) {
  console.error('usage: node scripts/add_fcdo_translators.cjs <sweepDir> [--preview]');
  process.exit(2);
}
const PREVIEW = process.argv.includes('--preview');
const F = path.join(ROOT, 'data', 'service-languages.json');
const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const CHECKED = new Date().toISOString().slice(0, 10);

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// A city is matched on its own name, plus the spellings these listings actually use. Every alias
// here was seen on the pages: the service prints whatever the provider typed.
const ALIAS = {
  milan: ['milano'], rome: ['roma'], florence: ['firenze'], naples: ['napoli'], turin: ['torino'],
  venice: ['venezia'], genoa: ['genova'], lisbon: ['lisboa'], seville: ['sevilla'],
  munich: ['munchen', 'muenchen'], cologne: ['koln', 'koeln'], vienna: ['wien'],
  prague: ['praha'], warsaw: ['warszawa'], krakow: ['cracow'], athens: ['athina'],
  copenhagen: ['kobenhavn'], gothenburg: ['goteborg'], mexicocity: ['ciudad de mexico', 'cdmx'],
  bangkok: ['krung thep'], danang: ['da nang'], hoian: ['hoi an'], hochiminh: ['saigon', 'ho chi minh'],
  buenosaires: ['buenos aires'], saopaulo: ['sao paulo'], riodejaneiro: ['rio de janeiro'],
  kualalumpur: ['kuala lumpur'], laspalmas: ['las palmas'], sansebastian: ['san sebastian', 'donostia'],
  aixenprovence: ['aix-en-provence', 'aix en provence'],
};

const CITY_MATCHERS = m.exports
  .filter((c) => c && c.id)
  .map((c) => ({
    id: c.id,
    country: c.country,
    words: [fold(c.name), ...(ALIAS[c.id] || []).map(fold)].filter((w) => w.length >= 4),
  }))
  .filter((c) => c.words.length);

const LANG_NAME_TO_CODE = {};
Object.entries(d._languages).forEach(([code, name]) => { LANG_NAME_TO_CODE[fold(name)] = code; });
// The service writes several languages in ISO's long form.
Object.assign(LANG_NAME_TO_CODE, {
  'spanish; castilian': 'es', 'dutch; flemish': 'nl', 'romanian; moldavian; moldovan': 'ro',
  'greek, modern (1453-)': 'el', 'chinese': 'zh', 'norwegian': 'no', 'panjabi; punjabi': 'pa',
  'persian': 'fa', 'malay': 'ms', 'sinhala; sinhalese': 'si', 'catalan; valencian': 'ca',
});

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
if (!files.length) { console.error('no pages in ' + DIR); process.exit(1); }

// One provider can appear under several language sweeps of the same country; merge them.
const byCountry = {};
for (const f of files) {
  const country = f.replace(/_[a-z]{2}\.html$/, '').replace(/_/g, ' ');
  let parsed;
  try {
    parsed = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts', 'parse_fcdo_translators.cjs'), path.join(DIR, f), country, '--json'], { encoding: 'utf8', maxBuffer: 1 << 24 }));
  } catch (e) { console.error('could not read ' + f); continue; }
  const bag = byCountry[country] = byCountry[country] || new Map();
  parsed.forEach((r) => {
    const e = bag.get(r.name);
    if (!e) { bag.set(r.name, r); return; }
    r.languages.forEach((x) => { if (!e.languages.includes(x)) e.languages.push(x); });
    r.regions.forEach((x) => { if (!e.regions.includes(x)) e.regions.push(x); });
  });
}

// The source's own data is damaged for at least one entry: a dropped umlaut turned "Sülke Thyssen"
// into "S Lke Thyssen" on the page itself. Publishing that would put a name in the directory that
// belongs to nobody. The test is narrow on purpose, a lone capital as the FIRST token followed by a
// short broken fragment, because a lone capital elsewhere is ordinary: "Catherine M Marquette" is a
// middle initial, and "Diglossia D O O" and "Luer Traductores Asociados S C" are company forms.
const looksDamaged = (name) => /^[A-Z]\s[A-Z][a-z]{1,3}(\s|$)/.test(name);

const rows = [];
const unplaced = [];
const damaged = [];
for (const [country, bag] of Object.entries(byCountry)) {
  const inCountry = CITY_MATCHERS.filter((c) => fold(c.country) === fold(country));
  for (const r of bag.values()) {
    if (looksDamaged(r.name)) { damaged.push(country + ': ' + r.name); continue; }
    const text = ' ' + fold(r.regions.join(' ; ')) + ' ';
    const hits = inCountry.filter((c) => c.words.some((w) => text.includes(' ' + w + ' ') || text.includes(' ' + w + ',') || text.includes(' ' + w + ';')));
    if (!hits.length) { unplaced.push(country + ': ' + r.name); continue; }
    const codes = ['en', ...r.languages.map((x) => LANG_NAME_TO_CODE[fold(x)]).filter(Boolean)];
    const languages = [...new Set(codes)].filter((l) => d._languages[l]);
    if (!languages.length) continue;
    const others = r.languages.filter((x) => LANG_NAME_TO_CODE[fold(x)] && LANG_NAME_TO_CODE[fold(x)] !== 'en');
    hits.forEach((c) => {
      rows.push({
        city: c.id,
        name: r.name,
        category: 'translator',
        languages,
        sourceUrl: 'https://find-a-professional-service-abroad.service.csd.fcdo.gov.uk/find/translators-interpreters/' +
          country.replace(/ /g, '%20') + '/result',
        evidence: 'official',
        checked: CHECKED,
        area: r.regions.join('; ').slice(0, 120) || c.id,
        url: r.url || undefined,
        note:
          "On the UK Foreign Office's Find a professional service abroad, under translators and " +
          'interpreters in ' + country + '. Every provider on that service has confirmed it can ' +
          'work in English' + (others.length ? ', and this entry additionally lists ' + others.join(', ') : '') + '. ' +
          (r.official ? 'It is listed as providing official, sworn or certified work. ' : '') +
          'The Foreign Office says it cannot accept liability for the services provided and that ' +
          'inclusion is not a recommendation.',
      });
    });
  }
}

const known = new Set(m.exports.map((c) => c.id));
const bad = rows.filter((p) => !known.has(p.city) || !d._categories[p.category] || !p.languages.length || !p.name || p.name.length < 3);
if (bad.length) { console.error('invalid: ' + bad.slice(0, 5).map((p) => p.name).join(', ')); process.exit(1); }

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const have = {};
d.providers.forEach((p) => { (have[p.city] = have[p.city] || []).push(norm(p.name)); });
const fresh = rows.filter((p) => {
  const n = norm(p.name);
  const ex = have[p.city] || (have[p.city] = []);
  if (ex.some((e) => e === n || (e.length >= 8 && n.length >= 8 && (e.includes(n) || n.includes(e))))) return false;
  ex.push(n);
  return true;
});
const nonAscii = fresh.filter((p) => /[^\x20-\x7E]/.test(JSON.stringify(p)));
nonAscii.forEach((p) => {
  p.name = p.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');
  p.area = String(p.area).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');
  p.note = String(p.note).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');
});
const stillBad = fresh.filter((p) => /[^\x20-\x7E]/.test(JSON.stringify(p)));
if (stillBad.length) { console.error('non-ASCII survives: ' + stillBad.map((p) => p.name).join(', ')); process.exit(1); }

const per = {};
fresh.forEach((p) => { per[p.city] = (per[p.city] || 0) + 1; });
console.log('placed ' + fresh.length + ' translators in ' + Object.keys(per).length + ' cities');
console.log('  ' + Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));
console.log('  not placed, no city named: ' + unplaced.length);
if (damaged.length) console.log('  skipped, the source prints a damaged name: ' + damaged.join(', '));

if (PREVIEW) {
  fresh.slice(0, 12).forEach((p) => console.log('   ' + p.city.padEnd(14) + p.name.slice(0, 34).padEnd(36) + p.languages.slice(0, 8).join(',')));
  process.exit(0);
}

d.providers = d.providers.concat(fresh);
fs.writeFileSync(F, JSON.stringify(d, null, 2) + '\n');
console.log('total ' + d.providers.length);

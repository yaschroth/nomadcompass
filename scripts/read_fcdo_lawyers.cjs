/**
 * Turns a sweep of the FCDO's lawyer lists into a proposals file for ingest_register_proposals.cjs.
 *
 * The August sweep's converter lived in a session scratchpad and was lost, so the lists could not be
 * re-read when they grew: by 2026-10-13 Turkey's list held 42 firms we did not have, Croatia's 10.
 * This is that converter, kept.
 *
 * Every firm on the service "has confirmed they can provide services in English", so the claim is
 * English and nothing else. A firm is placed in a city we cover only where its ADDRESS names that
 * city: the service's "regions" field is where a firm will take work ("Split-Dalmatia County, Zadar,
 * islands"), not where it is, and placing on it would put one Split office on five city pages.
 * Where an address names two of our cities, the later one wins, because an address ends with its
 * town and a street is often named after another ("Ankara Caddesi" in Izmir). Within one country
 * only, so "Calle Montevideo" in Buenos Aires cannot reach Uruguay.
 *
 * Usage: node scripts/read_fcdo_lawyers.cjs <sweepDir> <out.json>
 *   sweepDir holds the <Country>.json files written by fetch_fcdo_professionals.cjs lawyers.
 */
const fs = require('fs');
const path = require('path');
const { ALIASES, fold } = require('./lib/city_aliases.cjs');
const { CITY } = require('./lib/service_data.cjs');

const [, , DIR, OUT] = process.argv;
if (!DIR || !OUT || !fs.existsSync(DIR)) {
  console.error('usage: node scripts/read_fcdo_lawyers.cjs <sweepDir> <out.json>');
  process.exit(2);
}
const CHECKED = new Date().toISOString().slice(0, 10);

// The service's spelling of a country, where it differs from ours.
const OURS = { Czechia: 'Czech Republic', 'United Arab Emirates': 'UAE', "Cote d'Ivoire": 'Ivory Coast' };

const needlesOf = (c) => [...new Set([c.name, ...(ALIASES[c.id] || [])].map(fold))].filter((n) => n.length >= 4);
// A name is a word of the text, never letters inside a longer one ("Wiener Neustadt" is not Wien).
const lastIndexOfWord = (text, w) => {
  const re = new RegExp('(^|[^\\p{L}])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[^\\p{L}]|$)', 'gu');
  let at = -1; let m;
  while ((m = re.exec(text))) at = m.index;
  return at;
};

// Same rule as add_fcdo_translators.cjs: the source itself prints a few names with a letter torn out
// ("S Lke Thyssen"), and publishing one puts a name in the directory that belongs to nobody.
const looksDamaged = (name) => /^[A-Z]\s[A-Z][a-z]{1,3}(\s|$)/.test(name);

// Entries whose "name" is a job title, an office suite or a professional body, not a firm or a person.
const NOT_A_NAME = /^(lawyer|advocaat|advocate|attorney|independent|at law office)$|bar association|^suite \d/i;

// Spain and Italy name a province after its capital, and an address ends with the province: "Jávea
// (Xàbia), Alicante" is 90 km from Alicante. Their postcodes tell them apart: a provincial capital's
// is PP0NN in Spain and PP1NN in Italy. An address holding no postcode of that form is not in the city.
const CAPITAL_POSTCODE = { Spain: /(^|\D)\d{2}0\d{2}(\D|$)/, Italy: /(^|\D)\d{2}1\d{2}(\D|$)/ };
// Our Spanish and Italian cities that are not provincial capitals, so the test above says nothing about them.
const NOT_CAPITAL = new Set(['tenerife', 'tarifa', 'fuerteventura', 'gijon', 'ibiza', 'marbella', 'ronda',
  'santiagodecompostela', 'albarracin', 'cudillero', 'besalu', 'vigo', 'vernazza', 'positano', 'alberobello',
  'assisi', 'taormina', 'civitadibagnoregio', 'tropea', 'manarola', 'pitigliano']);

// Placed in one of our cities by its province or neighbour, read by hand on 2026-10-13.
const OUTSIDE = {
  'Avukat Kader Gunes': 'Kas, 190 km from Antalya',
  'Amaz Hassan Law Firm': 'Rawalpindi only, not Islamabad',
  'Odvjetnik Marin Novakovic': 'Tenja, a village outside Osijek',
};

const key = (s) => fold(s).replace(/[^\p{L}\p{N}]+/gu, '');
// For telling one firm's two entries apart from two firms: the legal form and the joining words go,
// because the service lists "Macesic Partners Llc" and "Macesic Partners Ltd" at one address.
const FORM = new Set(['llc', 'ltd', 'llp', 'pllc', 'inc', 'co', 'and', 'sl', 'slp', 'sa', 'srl', 'doo', 'd', 'o', 'gmbh', 'mbb', 'cjsc', 'law', 'firm', 'office', 'advocates', 'legal', 'consultants', 'associates']);
const firmKey = (s) => fold(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w && !FORM.has(w)).join('');

const note = (r) => {
  const areas = String(r.expertise || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const parts = [];
  if (areas.length) parts.push('Its legal expertise is given as "' + areas.join(', ') + '"');
  if (/represented British nationals/i.test(r.extra || '')) parts.push((parts.length ? 'it is ' : 'It is ') + 'marked as having represented British nationals');
  return parts.length ? parts.join(', and ') + '.' : '';
};

const rows = []; const unplaced = {}; const damaged = []; const refused = []; const perCountry = {}; const seenIn = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (!d.rows || !d.rows.length) continue;
  const country = OURS[d.country] || d.country;
  const inCountry = Object.values(CITY).filter((c) => c.country === country).map((c) => ({ c, needles: needlesOf(c) }));
  const sourceUrl = 'https://find-a-professional-service-abroad.service.csd.fcdo.gov.uk/find/lawyers/' + encodeURIComponent(d.country) + '/result';
  perCountry[country] = 0;
  for (const r of d.rows) {
    if (looksDamaged(r.name)) { damaged.push(country + ': ' + r.name); continue; }
    if (NOT_A_NAME.test(r.name.trim())) { refused.push(country + ': "' + r.name + '" is not a firm'); continue; }
    if (OUTSIDE[r.name]) { refused.push(country + ': ' + r.name + ' (' + OUTSIDE[r.name] + ')'); continue; }
    const text = fold(r.address || '');
    let best = null; let bestAt = -1;
    for (const { c, needles } of inCountry) {
      for (const n of needles) {
        const at = lastIndexOfWord(text, n);
        if (at > bestAt) { bestAt = at; best = c; }
      }
    }
    if (!best) { unplaced[country] = (unplaced[country] || 0) + 1; continue; }
    if (CAPITAL_POSTCODE[country] && !NOT_CAPITAL.has(best.id) && /\d{5}/.test(r.address) && !CAPITAL_POSTCODE[country].test(r.address)) {
      refused.push(country + ': ' + r.name + ' (postcode outside ' + best.name + ')'); continue;
    }
    // The service lists one firm several times (per office, per spelling: "Macesic Partners Llc" and
    // "... Ltd"). One card per firm and city; one name inside the other is how the dupes gate sees it.
    const k = firmKey(r.name) || key(r.name);
    const seen = (seenIn[best.id] = seenIn[best.id] || []);
    if (seen.some((q) => q === k || (q.length >= 6 && k.length >= 6 && (q.includes(k) || k.includes(q))))) continue;
    seen.push(k);
    perCountry[country] += 1;
    rows.push({
      city: best.id,
      name: r.name,
      category: 'legal',
      languages: ['en'],
      ...(r.website ? { url: r.website } : {}),
      sourceUrl,
      evidence: 'official',
      checked: CHECKED,
      ...(r.address ? { area: r.address } : {}),
      ...(note(r) ? { note: note(r) } : {}),
    });
  }
}

// Three firms giving the same practice areas share one sentence, and a sentence on several cards tells
// a reader nothing about any of them (check_service_notes.cjs fails it). Such notes are left off.
const DB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'service-languages.json'), 'utf8'));
// Counted in firms, not cards: a firm already listed carries its own note, and that is not a second firm.
const firmsWith = {};
[...DB.providers, ...rows].forEach((p) => {
  if (!p.note) return;
  (firmsWith[p.note] = firmsWith[p.note] || new Set()).add(p.city + '|' + (firmKey(p.name) || key(p.name)));
});
let dropped = 0;
rows.forEach((r) => { if (r.note && firmsWith[r.note].size > 1) { delete r.note; dropped += 1; } });

fs.writeFileSync(OUT, JSON.stringify({
  source: {
    publisher: "the UK Foreign Office's Find a professional service abroad",
    short: 'the UK Foreign Office',
    kind: 'consular',
    pageNote: "Some of these are listed on the UK FCDO's Find a professional service abroad, which lists lawyers abroad and says every one of them has confirmed it can provide services in English.",
  },
  rows,
}, null, 1) + '\n');

console.log(dropped + ' notes left off because another card carries the same sentence');
console.log(rows.length + ' placed, ' + Object.values(unplaced).reduce((a, b) => a + b, 0) + ' with no city of ours in the address');
console.log('  placed per country: ' + Object.entries(perCountry).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(', '));
if (damaged.length) console.log('  skipped, damaged name on the source: ' + damaged.join('; '));
if (refused.length) console.log('  refused (' + refused.length + '):\n    ' + refused.join('\n    '));

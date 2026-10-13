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

const note = (r) => {
  const areas = String(r.expertise || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const parts = [];
  if (areas.length) parts.push('Its legal expertise is given as "' + areas.join(', ') + '"');
  if (/represented British nationals/i.test(r.extra || '')) parts.push((parts.length ? 'it is ' : 'It is ') + 'marked as having represented British nationals');
  return parts.length ? parts.join(', and ') + '.' : '';
};

const rows = []; const unplaced = {}; const damaged = []; const perCountry = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (!d.rows || !d.rows.length) continue;
  const country = OURS[d.country] || d.country;
  const inCountry = Object.values(CITY).filter((c) => c.country === country).map((c) => ({ c, needles: needlesOf(c) }));
  const sourceUrl = 'https://find-a-professional-service-abroad.service.csd.fcdo.gov.uk/find/lawyers/' + encodeURIComponent(d.country) + '/result';
  perCountry[country] = 0;
  for (const r of d.rows) {
    if (looksDamaged(r.name)) { damaged.push(country + ': ' + r.name); continue; }
    const text = fold(r.address || '');
    let best = null; let bestAt = -1;
    for (const { c, needles } of inCountry) {
      for (const n of needles) {
        const at = lastIndexOfWord(text, n);
        if (at > bestAt) { bestAt = at; best = c; }
      }
    }
    if (!best) { unplaced[country] = (unplaced[country] || 0) + 1; continue; }
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

fs.writeFileSync(OUT, JSON.stringify({
  source: {
    publisher: "the UK Foreign Office's Find a professional service abroad",
    short: 'the UK Foreign Office',
    kind: 'consular',
    pageNote: "Some of these are listed on the UK FCDO's Find a professional service abroad, which lists lawyers abroad and says every one of them has confirmed it can provide services in English.",
  },
  rows,
}, null, 1) + '\n');

console.log(rows.length + ' placed, ' + Object.values(unplaced).reduce((a, b) => a + b, 0) + ' with no city of ours in the address');
console.log('  placed per country: ' + Object.entries(perCountry).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(', '));
if (damaged.length) console.log('  skipped, damaged name on the source: ' + damaged.join('; '));

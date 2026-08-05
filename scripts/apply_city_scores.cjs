// apply_city_scores.cjs - expose each city's Nomad Score + 13 category scores in STATIC HTML so
// AI crawlers (which don't run JS) and search engines can read them. The visible tiles/radar are
// JS-rendered into an empty grid, so without this the scores are invisible to non-JS agents.
// Adds (a) an sr-only crawlable text summary and (b) a JSON-LD Place with additionalProperty scores,
// inserted just before the radar chart. Idempotent (guards on <!-- city-scores -->). Reads scores from
// cities-data.js; Nomad Score uses the exact site formula. Cities not in CITIES (orphans) are skipped.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const m = {}; eval(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8').replace(/const CITIES/, 'm.CITIES'));
const byId = {}; for (const c of m.CITIES) if (c && c.id) byId[c.id] = c;
const APPLY = process.env.APPLY === '1';

const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const LABEL = { climate: 'Climate', cost: 'Cost of Living', wifi: 'WiFi', nightlife: 'Nightlife', nature: 'Nature', safety: 'Safety', food: 'Food', community: 'Nomad Community', english: 'English', visa: 'Visa Ease', culture: 'Culture', cleanliness: 'Cleanliness', airquality: 'Air Quality' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nomadScore = sc => {
  const raw = KEYS.reduce((s, k) => s + (sc[k] || 0), 0) / KEYS.length;
  return Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
};

const ANCHOR = '<div class="radar-chart-container">';
const dir = path.join(ROOT, 'cities');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let done = 0, skip = 0, orphan = 0, noanchor = 0;
for (const f of files) {
  const slug = f.replace('.html', '');
  const city = byId[slug];
  if (!city || !city.scores) { orphan++; continue; }
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  // Guard on the closing marker: the opening one carries a trailing description, so matching
  // '<!-- city-scores -->' never fired and a re-run would have duplicated the block everywhere.
  if (s.includes('<!-- /city-scores -->')) { skip++; continue; }
  if (!s.includes(ANCHOR)) { noanchor++; console.error('no anchor: ' + slug); continue; }

  const sc = city.scores, nom = nomadScore(sc);
  const catText = KEYS.map(k => LABEL[k] + ' ' + sc[k]).join(', ');
  const srText = esc(city.name) + "'s Nomad Score is " + nom + ' out of 10, from 13 category ratings (each out of 10): ' + esc(catText) + '.';
  const ld = {
    '@context': 'https://schema.org', '@type': 'Place',
    name: city.name + (city.country ? ', ' + city.country : ''),
    url: 'https://thenomadhq.com/cities/' + slug,
    additionalProperty: [{ '@type': 'PropertyValue', name: 'Nomad Score', value: Number(nom), maxValue: 10 }]
      .concat(KEYS.map(k => ({ '@type': 'PropertyValue', name: LABEL[k], value: sc[k], maxValue: 10 })))
  };
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const block =
    '<!-- city-scores: static Nomad Score + category scores for AI crawlers / search engines -->' + nl +
    '          <p class="sr-only">' + srText + '</p>' + nl +
    '          <script type="application/ld+json">' + JSON.stringify(ld) + '</script>' + nl +
    '          <!-- /city-scores -->' + nl +
    '          ';

  s = s.replace(ANCHOR, block + ANCHOR);
  if (APPLY) fs.writeFileSync(p, s);
  done++;
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | injected: ' + done + ' | already: ' + skip + ' | orphan(skipped): ' + orphan + ' | no-anchor: ' + noanchor + ' | total: ' + files.length);

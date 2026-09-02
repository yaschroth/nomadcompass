require(require('path').join(__dirname,'_safe_write.cjs'));
// apply_city_scores.cjs - expose each city's Nomad Score + 13 category scores in STATIC HTML so
// AI crawlers (which don't run JS) and search engines can read them. The visible tiles/radar are
// JS-rendered into an empty grid, so without this the scores are invisible to non-JS agents.
// Adds (a) an sr-only crawlable text summary and (b) a JSON-LD Place with additionalProperty scores,
// inserted just before the radar chart. Rewrites the block in place when the data has moved. Reads scores from
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
let done = 0, refreshed = 0, skip = 0, orphan = 0, noanchor = 0;
for (const f of files) {
  const slug = f.replace('.html', '');
  const city = byId[slug];
  if (!city || !city.scores) { orphan++; continue; }
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  const had = s.includes('<!-- /city-scores -->');
  if (!had && !s.includes(ANCHOR)) { noanchor++; console.error('no anchor: ' + slug); continue; }

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

  // Replace rather than skip. This used to bail on any page that already carried the block, which
  // made it write-once: a score change or a country rename never reached the crawlable copy, and
  // the only thing a non-JS agent can read went stale against the tiles beside it. Renaming "UK"
  // to "United Kingdom" is what surfaced it, on three pages whose JSON-LD still said "London, UK".
  const OPEN = '<!-- city-scores:';
  const CLOSE = '<!-- /city-scores -->';
  const before = s;
  if (had) {
    const a = s.indexOf(OPEN);
    let b = s.indexOf(CLOSE, a) + CLOSE.length;
    while (b < s.length && (s[b] === '\r' || s[b] === '\n' || s[b] === ' ')) b++;
    s = s.slice(0, a) + block + s.slice(b);
  } else {
    s = s.replace(ANCHOR, block + ANCHOR);
  }
  if (s === before) { skip++; continue; }
  if (APPLY) fs.writeFileSync(p, s);
  if (had) refreshed++; else done++;
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | injected: ' + done + ' | refreshed: ' + refreshed
  + ' | unchanged: ' + skip + ' | orphan(skipped): ' + orphan + ' | no-anchor: ' + noanchor
  + ' | total: ' + files.length);

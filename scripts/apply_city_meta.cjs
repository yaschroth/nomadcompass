// Upgrade the city-page meta description (+ twitter:description) for CTR: add the distinctive Nomad
// Score and a question framing that matches search intent, while staying accurate (every page shows
// USD costs, so "cost of living in USD" is true even for cities without the real Numbeo table).
// Re-runnable (replaces the tag content each time). Nomad Score uses the exact site formula.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname.includes('scripts') ? path.join(__dirname, '..') : 'c:/Users/yasch/Coding Projects/Website Projects/nomadcompass');
const m = {}; eval(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8').replace(/const CITIES/, 'm.CITIES'));
const byId = {}; for (const c of m.CITIES) if (c && c.id) byId[c.id] = c;
const APPLY = process.env.APPLY === '1';
const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nomadScore = sc => { const raw = KEYS.reduce((s, k) => s + (sc[k] || 0), 0) / KEYS.length; return Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };

const dir = path.join(ROOT, 'cities');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let done = 0, skip = 0; const samples = [];
for (const f of files) {
  const city = byId[f.replace('.html', '')];
  if (!city || !city.scores) { skip++; continue; }
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8'); const before = s;
  const nom = nomadScore(city.scores);
  const desc = `Is ${city.name} good for digital nomads? Nomad Score ${nom}/10 - cost of living in USD, WiFi, safety, visas, neighborhoods and coworking, all in one guide.`;
  const e = esc(desc);
  s = s.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e}">`);
  s = s.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${e}">`);
  if (s !== before) { if (APPLY) fs.writeFileSync(p, s); done++; if (samples.length < 4) samples.push(desc.length + ' chars | ' + desc); }
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | updated: ' + done + ' | skipped(no scores): ' + skip + ' | total: ' + files.length);
samples.forEach(x => console.log('  ' + x));

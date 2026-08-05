// Merges the 6 per-group guide-content JSON files into data/guide-content.json.
// Decodes HTML entities the writers may have left in (&amp; -> &) so the injector re-escapes cleanly.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SP = process.env.SP;
const F = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];
const dec = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const out = { _meta: { note: 'Long-form guide sections for expansion cities, injected by apply_city_guide_sections.cjs' } };
let n = 0; const bad = [];
for (let g = 1; g <= 6; g++) {
  const f = path.join(SP, `gc-g${g}.json`);
  if (!fs.existsSync(f)) { bad.push(`g${g} missing`); continue; }
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [slug, o] of Object.entries(d)) {
    const miss = F.filter((k) => !o[k] || /^\s*\.\.\.\s*$/.test(o[k]));
    if (miss.length) { bad.push(`${slug}:${miss.join(',')}`); continue; }
    const clean = {}; for (const k of F) clean[k] = dec(o[k]).trim();
    out[slug] = clean; n++;
  }
}
fs.writeFileSync(path.join(ROOT, 'data', 'guide-content.json'), JSON.stringify(out, null, 0));
console.log('merged cities:', n, bad.length ? '| issues: ' + bad.join(' ') : '| clean');

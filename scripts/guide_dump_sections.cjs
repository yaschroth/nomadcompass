// Print the seven guide sections for a list of slugs, with word counts, so extensions can be
// written against what is already there rather than repeating it.
// Usage: node dump_sections.cjs <repoRoot> <slug> [slug...]
const fs = require('fs');
const ROOT = require('path').resolve(__dirname, '..');
const g = JSON.parse(fs.readFileSync(ROOT + '/data/guide-content.json', 'utf8'));
const CITIES = (new Function(fs.readFileSync(ROOT + '/cities-data.js', 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));
const KEYS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];
for (const slug of process.argv.slice(2)) {
  const c = g[slug], m = byId[slug];
  if (!c) { console.log('### ' + slug + ' NOT IN guide-content.json\n'); continue; }
  console.log(`### ${slug} — ${m.name}, ${m.country} — $${m.costPerMonth}/mo`);
  // Print the addition each section needs, so a single pass lands on target rather than three.
  // The band caps a section at 220, so anything already near that gets nothing and the weight
  // moves to the short sections instead.
  const TARGET = 185, CAP = 214;
  for (const k of KEYS) {
    const w = String(c[k]).trim().split(/\s+/).length;
    const need = Math.max(0, Math.min(TARGET, CAP) - w);
    console.log(`[${k} ${w}w -> ADD ~${need}w] ${c[k]}`);
  }
  console.log('');
}

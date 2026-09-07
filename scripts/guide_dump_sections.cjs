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
  // Which cities in the same country have already been deepened, and are therefore holding the
  // national facts. Two Italian cities share the partita IVA; writing it twice in the same words
  // makes both pages read as boilerplate. Read the siblings before writing, and spend different
  // facts. Ancona collided with Cagliari across four sections before this line existed.
  const sibs = CITIES.filter((x) => x.country === m.country && x.id !== slug && g[x.id])
    .map((x) => ({ id: x.id, w: KEYS.reduce((a, k) => a + String(g[x.id][k] || '').trim().split(/\s+/).length, 0) }))
    .filter((x) => x.w >= 1155)
    .sort((a, b) => b.w - a.w);
  // Same country is not the only place phrasing collides. Six Caribbean island guides share
  // imported diesel, hurricane exposure, medical evacuation and the which-neighbour-to-compare
  // paragraph, and none of them share a country, so the sibling line above stays silent while the
  // phrasing gate rejects draft after draft. So also surface the deepened cities whose EXISTING
  // text most resembles this one: shared vocabulary is a good proxy for shared facts, and those
  // are the pages whose sentences the new extension will reach for.
  const vocab = (t) => new Set(String(t).toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 6));
  const mine = vocab(KEYS.map((k) => c[k]).join(' '));
  const near = Object.keys(g).filter((x) => !x.startsWith('_') && x !== slug && byId[x])
    .map((x) => {
      const w = KEYS.reduce((a, k) => a + String(g[x][k] || '').trim().split(/\s+/).length, 0);
      if (w < 1155) return null;
      const theirs = vocab(KEYS.map((k) => g[x][k]).join(' '));
      let shared = 0;
      for (const t of mine) if (theirs.has(t)) shared++;
      return { id: x, score: shared / Math.max(1, Math.min(mine.size, theirs.size)) };
    })
    .filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 3)
    .filter((x) => x.score > 0.18);
  if (near.length) {
    console.log('  ^ MOST SIMILAR deepened guides: '
      + near.map((x) => x.id + ' (' + Math.round(x.score * 100) + '%)').join(', ')
      + ' -- likeliest phrasing collisions, skim these too');
  }
  console.log(sibs.length
    ? '  ^ DEEPENED SIBLINGS in ' + m.country + ': ' + sibs.map((x) => x.id + ' (' + x.w + 'w)').join(', ')
      + ' -- read their visas/costOfLiving/whereToWork first and choose different facts'
    : '  ^ no deepened siblings in ' + m.country + ', national facts are unspent');
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

/**
 * Adds a "Head-to-head" internal-links line to each city page that appears in a /vs/ comparison,
 * inside the existing .city-explore block (reuses .city-explore-links styling). Improves discovery
 * of the vs pages + internal linking + gives users a natural "compare X with..." path. Idempotent.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const nameById = new Map((new Function(code + ';return CITIES;'))().map((c) => [c.id, c.name]));

// city id -> [{ slug, other }]
const map = new Map();
for (const f of fs.readdirSync(path.join(ROOT, 'vs')).filter((x) => x.endsWith('.html'))) {
  const m = f.replace(/\.html$/, '').match(/^(.+)-vs-(.+)$/);
  if (!m) continue;
  const [, a, b] = m;
  (map.get(a) || map.set(a, []).get(a)).push({ slug: f.replace(/\.html$/, ''), other: b });
  (map.get(b) || map.set(b, []).get(b)).push({ slug: f.replace(/\.html$/, ''), other: a });
}

const ANCHOR = '<p class="city-explore-links"><a href="/cities">Browse all city guides</a>';
let done = 0, skipped = 0, noAnchor = [];
for (const [id, list] of map) {
  const abs = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(abs)) continue;
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('<strong>Head-to-head:</strong>')) { skipped++; continue; }
  if (!s.includes(ANCHOR)) { noAnchor.push(id); continue; }
  const links = list
    .sort((x, y) => (nameById.get(x.other) || '').localeCompare(nameById.get(y.other) || ''))
    .map((e) => `<a href="/vs/${e.slug}">${nameById.get(id)} vs ${nameById.get(e.other)}</a>`)
    .join(' &middot; ');
  const line = `<p class="city-explore-links"><strong>Head-to-head:</strong> ${links}</p>\n          ${ANCHOR}`;
  s = s.replace(ANCHOR, line);
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`city pages linked to vs: ${done}, already-done: ${skipped}, no-anchor: ${noAnchor.length}`);
if (noAnchor.length) console.log('  no-anchor:', noAnchor.slice(0, 8).join(', '));

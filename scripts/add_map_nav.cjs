/**
 * Adds a "Map" item (-> /map) to the main + mobile nav, right after "Cities", across
 * every live page. Derives the href prefix from the adjacent Cities link so it matches
 * each page's convention. Idempotent (guards on a nav Map link). map.html is skipped
 * (its generator adds it, marked active).
 * Usage: node scripts/add_map_nav.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'images', 'assets', 'styles', 'scripts', 'data', 'js', 'accommodations'].includes(e.name)) continue;
      walk(p, out);
    } else if (e.name.endsWith('.html') && e.name !== 'rentals.html' && e.name !== 'map.html') out.push(p);
  }
  return out;
}

let changed = 0, already = 0, noanchor = 0;
for (const file of walk(ROOT, [])) {
  let s = fs.readFileSync(file, 'utf8');
  if (/class="nav-link[^"]*">Map<|class="nav-mobile-link[^"]*">Map</.test(s)) { already++; continue; }
  const orig = s;
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix.replace(/cities$/, '')}map" class="nav-link">Map</a></li>`
  );
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-mobile-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix.replace(/cities$/, '')}map" class="nav-mobile-link">Map</a></li>`
  );
  if (s !== orig) { fs.writeFileSync(file, s); changed++; }
  else noanchor++;
}
console.log(`Map nav: ${changed} pages updated, ${already} already had it, ${noanchor} no Cities nav anchor.`);

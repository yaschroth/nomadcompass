/**
 * Adds a "Tier List" item (-> /tier-list) to the main + mobile nav, right after
 * "Rankings", across every live page. Derives the href prefix from the adjacent Rankings
 * link so it matches each page's convention. Idempotent (guards on a nav Tier List link).
 * tier-list.html is skipped (its generator adds it, marked active). Hidden noindex
 * surfaces (accommodations, rentals) excluded.
 * Usage: node scripts/add_tierlist_nav.cjs
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
    } else if (e.name.endsWith('.html') && e.name !== 'rentals.html' && e.name !== 'tier-list.html') out.push(p);
  }
  return out;
}

let changed = 0, already = 0, noanchor = 0;
for (const file of walk(ROOT, [])) {
  let s = fs.readFileSync(file, 'utf8');
  if (/class="nav-link[^"]*">Tier List<|class="nav-mobile-link[^"]*">Tier List</.test(s)) { already++; continue; }
  const orig = s;
  s = s.replace(
    /(<li><a href="([^"]*)best"\s+class="nav-link([^"]*)">Rankings<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}tier-list" class="nav-link">Tier List</a></li>`
  );
  s = s.replace(
    /(<li><a href="([^"]*)best"\s+class="nav-mobile-link([^"]*)">Rankings<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}tier-list" class="nav-mobile-link">Tier List</a></li>`
  );
  if (s !== orig) { fs.writeFileSync(file, s); changed++; }
  else noanchor++;
}
console.log(`Tier List nav: ${changed} pages updated, ${already} already had it, ${noanchor} no Rankings nav anchor.`);

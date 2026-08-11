require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds a "Rankings" item (-> /best) to the main + mobile nav, right after "Cities",
 * across every live page. Derives the href prefix from the adjacent Cities link so it
 * matches each page's convention. Idempotent (guards on a nav Rankings link, not the
 * footer one). The /best hub + best/ pages are skipped (their generator adds it, marked
 * active). Hidden noindex surfaces (accommodations, rentals) excluded.
 * Usage: node scripts/add_rankings_nav.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'images', 'assets', 'styles', 'scripts', 'data', 'js', 'accommodations', 'best'].includes(e.name)) continue;
      walk(p, out);
    } else if (e.name.endsWith('.html') && e.name !== 'rentals.html' && e.name !== 'best.html') out.push(p);
  }
  return out;
}

let changed = 0, already = 0, noanchor = 0;
for (const file of walk(ROOT, [])) {
  let s = fs.readFileSync(file, 'utf8');
  // already has a NAV rankings link? (the footer "Rankings" link must not count)
  if (/class="nav-link[^"]*">Rankings<|class="nav-mobile-link[^"]*">Rankings</.test(s)) { already++; continue; }
  const orig = s;
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}best" class="nav-link">Rankings</a></li>`
  );
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-mobile-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}best" class="nav-mobile-link">Rankings</a></li>`
  );
  if (s !== orig) { fs.writeFileSync(file, s); changed++; }
  else noanchor++;
}
console.log(`Rankings nav: ${changed} pages updated, ${already} already had it, ${noanchor} no Cities nav anchor.`);

/**
 * Adds a "Compare" item to the main + mobile nav, right after "Cities", across every
 * HTML page. Derives the href prefix from the adjacent Cities link so it matches each
 * page's convention (root pages use /cities, city pages use ../cities). Idempotent.
 * Usage: node scripts/add_compare_nav.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'images', 'assets', 'styles', 'scripts', 'data', 'js'].includes(e.name)) continue;
      walk(p, out);
    } else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0, already = 0, nonav = 0;
for (const file of walk(ROOT, [])) {
  let s = fs.readFileSync(file, 'utf8');
  if (/nav-link[^>]*href="[^"]*\/compare"|>Compare<\/a>/.test(s)) { already++; continue; }
  const orig = s;

  // desktop: <li><a href="{p}cities" class="nav-link...">Cities</a></li>  -> add Compare after
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}compare" class="nav-link">Compare</a></li>`
  );
  // mobile
  s = s.replace(
    /(<li><a href="([^"]*)cities"\s+class="nav-mobile-link([^"]*)">Cities<\/a><\/li>)/,
    (m, whole, prefix) => `${whole}\n        <li><a href="${prefix}compare" class="nav-mobile-link">Compare</a></li>`
  );

  if (s !== orig) { fs.writeFileSync(file, s); changed++; }
  else nonav++;
}
console.log(`Compare nav: ${changed} pages updated, ${already} already had it, ${nonav} had no matching Cities nav item.`);

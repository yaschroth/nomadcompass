require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds a "Rankings" link (-> /best) to the footer Explore column on every live page,
 * right after the "All Cities" link. Idempotent (skips pages whose footer already links
 * /best). Hidden noindex surfaces (accommodations, rentals) are excluded.
 * Usage: node scripts/add_best_footer.cjs
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
    } else if (e.name.endsWith('.html') && e.name !== 'rentals.html') out.push(p);
  }
  return out;
}

let changed = 0, already = 0, noanchor = 0;
for (const file of walk(ROOT, [])) {
  let s = fs.readFileSync(file, 'utf8');
  if (/href="[^"]*\/best"\s+class="footer-link"/.test(s)) { already++; continue; }
  // insert a Rankings <li> right after the footer "All Cities" link
  const re = /(<li><a href="[^"]*" class="footer-link">All Cities<\/a><\/li>)/;
  if (!re.test(s)) { noanchor++; continue; }
  s = s.replace(re, `$1\n            <li><a href="/best" class="footer-link">Rankings</a></li>`);
  fs.writeFileSync(file, s);
  changed++;
}
console.log(`Footer Rankings link: ${changed} updated, ${already} already had it, ${noanchor} no footer Explore anchor.`);

require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Hides the Rentals section by removing its nav item (desktop + mobile) from
 * every page. Reversible: `git revert` the commit, or re-add via the nav order
 * Home / Wheel / Cities / Blog. Idempotent. See TODO.md item 2.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const files = [];
for (const d of ['blog', 'cities', 'accommodations', 'about']) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) files.push(path.join(dir, f));
}
for (const f of ['index.html', 'blog.html', 'cities.html', 'wheel.html', 'rentals.html', 'login.html', 'signup.html', 'profile.html']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) files.push(p);
}

// whole-line match: leading indent + the Rentals <li> (desktop or mobile) + trailing newline
const re = /[ \t]*<li><a href="[^"]*rentals" class="nav-(?:link|mobile-link)[^"]*">Rentals<\/a><\/li>\n/g;

let changed = 0, removed = 0;
for (const abs of files) {
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  html = html.replace(re, () => { removed++; return ''; });
  if (html !== before) { fs.writeFileSync(abs, html); changed++; }
}
console.log(`Files changed: ${changed} | Rentals nav items removed: ${removed}`);

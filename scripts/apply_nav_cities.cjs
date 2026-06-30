/**
 * Adds the "Cities" nav item (after "Rentals", before "Blog") to every page's
 * header so the tab is consistent site-wide. It was only on index/cities/about,
 * so it appeared to "disappear" when navigating to other pages.
 * Inserts into both desktop (.nav-link) and mobile (.nav-mobile-link) menus,
 * reusing the same href prefix as the sibling Rentals link. Idempotent.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const targets = [];
const add = (p) => { if (fs.existsSync(p)) targets.push(p); };
for (const d of ['blog', 'cities', 'accommodations']) {
  const dir = path.join(ROOT, d);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) add(path.join(dir, f));
}
for (const f of ['blog.html', 'wheel.html', 'rentals.html', 'login.html', 'signup.html', 'profile.html']) add(path.join(ROOT, f));

let changed = 0, alreadyHad = 0, noMatch = [];
for (const abs of targets) {
  let html = fs.readFileSync(abs, 'utf8');
  // skip if a Cities nav item already exists
  if (/class="nav-(?:link|mobile-link)[^"]*">Cities<\/a>/.test(html)) { alreadyHad++; continue; }
  const before = html;

  // desktop
  html = html.replace(
    /<li><a href="([^"]*)rentals" class="nav-link[^"]*">Rentals<\/a><\/li>/,
    (m, pre) => `${m}\n        <li><a href="${pre}cities" class="nav-link">Cities</a></li>`
  );
  // mobile
  html = html.replace(
    /<li><a href="([^"]*)rentals" class="nav-mobile-link[^"]*">Rentals<\/a><\/li>/,
    (m, pre) => `${m}\n        <li><a href="${pre}cities" class="nav-mobile-link">Cities</a></li>`
  );

  if (html !== before) { fs.writeFileSync(abs, html); changed++; }
  else noMatch.push(path.relative(ROOT, abs));
}

console.log(`Nav "Cities" inserted: ${changed} | already had it: ${alreadyHad} | no Rentals nav match: ${noMatch.length}`);
if (noMatch.length) console.log('  no-match files:', noMatch.slice(0, 10).join(', ') + (noMatch.length > 10 ? ` (+${noMatch.length - 10})` : ''));

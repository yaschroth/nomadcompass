/**
 * Removes the accounts and voting feature from the whole site.
 *
 * Why: the Supabase project the feature depended on no longer exists. Its hostname does
 * not resolve at all, so every page was loading the Supabase SDK and then firing requests
 * into the void, while the navigation advertised Login and Sign Up on 925 pages and every
 * city page offered an "Is this accurate?" vote that could never be cast.
 *
 * Removing beats hiding: a site should not advertise an account nobody can create.
 *
 * Idempotent. Usage: node scripts/remove_accounts_feature.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const HTML = [];
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', 'components', 'ui-ux-pro-max-skill'].includes(e.name) || e.name.startsWith('.')) continue;
    const p = dir === '.' ? e.name : dir + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) HTML.push(p);
  }
})('.');

const AUTH_PAGES = new Set(['login.html', 'signup.html', 'profile.html']);
const counters = { navActions: 0, authScript: 0, voting: 0, scriptTags: 0, links: 0, votesInit: 0 };

for (const rel of HTML) {
  if (AUTH_PAGES.has(rel)) continue;
  const p = path.join(ROOT, rel);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  // 1. the Login / Sign Up pair in the desktop nav
  s = s.replace(/[ \t]*<div class="nav-actions">[\s\S]*?<\/div>\r?\n?/g, (m) => {
    if (!/nav-login|nav-signup/.test(m)) return m;
    counters.navActions++;
    return '';
  });

  // 2. any remaining direct links to the removed pages, including mobile nav entries
  s = s.replace(/[ \t]*<a[^>]*href="[^"]*\/?(login|signup|profile)(\.html)?"[^>]*>[\s\S]{0,200}?<\/a>\r?\n?/g, (m) => {
    counters.links++;
    return '';
  });

  // 3. the inline script that swaps the nav between logged-out and logged-in states
  s = s.replace(/[ \t]*<script(?![^>]*src)[^>]*>[\s\S]*?<\/script>\r?\n?/g, (m) => {
    if (!/nav-user-btn|nav-logout-btn|NomadAuth/.test(m)) return m;
    counters.authScript++;
    return '';
  });

  // 4. the per-category voting widget inside the score template
  s = s.replace(/<div class="category-voting">[\s\S]*?<\/div>\s*<\/div>/g, (m) => {
    // the widget is two nested divs: actions inside the wrapper
    counters.voting++;
    return '';
  });
  // leftover helpers that only existed to drive it
  s = s.replace(/\$\{loggedIn\?'':'disabled'\}/g, '');

  // 5. the scripts behind all of it
  s = s.replace(/[ \t]*<script[^>]*(?:jsdelivr[^>]*supabase|supabase-config\.js|\/auth\.js|\/votes\.js)[^>]*><\/script>\r?\n?/g, () => {
    counters.scriptTags++;
    return '';
  });

  if (!DRY && s !== before) fs.writeFileSync(p, s);
}

console.log(`${DRY ? 'DRY RUN' : 'APPLIED'}`);
for (const [k, v] of Object.entries(counters)) console.log('  ' + k.padEnd(14) + v);
console.log('  Seiten geprueft: ' + HTML.length);

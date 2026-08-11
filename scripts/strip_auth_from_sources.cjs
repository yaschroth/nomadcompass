/**
 * Removes the accounts feature from the *sources* that produce pages, which the HTML sweep
 * in remove_accounts_feature.cjs deliberately did not touch.
 *
 * This is the part that actually mattered. The HTML sweep cleaned the 925 shipped pages, but
 * 17 generator scripts still carried the Login / Sign Up markup in both the desktop and the
 * mobile navigation. Re-running any one of them (build_best_hub, build_route, build_tier_maker,
 * generate_core_pages, ...) would have quietly put the anmeldung back on the pages it owns,
 * pointing at URLs that now 404. generate_city_pages.js was already fixed; these were not.
 *
 * Also covers components/nav.html, which is the reference template new pages get copied from,
 * and the dead CSS rules for elements that no longer exist.
 *
 * Idempotent. Usage: node scripts/strip_auth_from_sources.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

// This script necessarily contains the strings it removes; skip itself and its sibling.
const SELF = new Set(['strip_auth_from_sources.cjs', 'remove_accounts_feature.cjs']);

const counts = { desktop: 0, mobile: 0, links: 0, scripts: 0, files: 0 };

function scrub(s) {
  // the Login / Sign Up pair, in whichever nav container it sits
  s = s.replace(/<div class="nav-actions">[\s\S]{0,400}?<\/div>/g, (m) => {
    if (!/nav-login|nav-signup|\/login|\/signup/.test(m)) return m;
    counts.desktop++;
    return '';
  });
  s = s.replace(/<div class="nav-mobile-actions">[\s\S]{0,400}?<\/div>/g, (m) => {
    if (!/\/login|\/signup/.test(m)) return m;
    counts.mobile++;
    return '';
  });
  // any straggling anchor to a page that no longer exists
  s = s.replace(/<a[^>]*href="[^"]*\/(login|signup|profile)(\.html)?"[^>]*>[\s\S]{0,120}?<\/a>/g, () => {
    counts.links++;
    return '';
  });
  // the scripts behind the feature
  s = s.replace(/[ \t]*<script[^>]*(?:jsdelivr[^>]*supabase|supabase-config\.js|\/auth\.js|\/votes\.js)[^>]*><\/script>\r?\n?/g, () => {
    counts.scripts++;
    return '';
  });
  return s;
}

const TARGETS = [];
for (const f of fs.readdirSync(path.join(ROOT, 'scripts'))) {
  if (/\.(cjs|js)$/.test(f) && !SELF.has(f)) TARGETS.push('scripts/' + f);
}
TARGETS.push('components/nav.html');

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const after = scrub(before);
  if (after !== before) {
    if (!DRY) fs.writeFileSync(p, after);
    counts.files++;
    console.log('  ' + rel);
  }
}

// --- dead CSS: rules for elements that no longer exist anywhere ---
const CSS = [
  ['styles/nav.css', /^[ \t]*\.nav-(login|signup)\b[^{]*\{[^}]*\}\r?\n?/gm],
  ['styles/city-page.css', /^[ \t]*\.(category-voting|vote-btn|voting-login-prompt)[^{]*\{[^}]*\}\r?\n?/gm],
];
let cssRules = 0;
for (const [rel, re] of CSS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(re, () => { cssRules++; return ''; });
  if (after !== before) {
    if (!DRY) fs.writeFileSync(p, after);
    console.log('  ' + rel + ' (' + cssRules + ' Regeln)');
  }
}

console.log(`\n${DRY ? 'DRY RUN' : 'APPLIED'}`);
console.log(`  Dateien geaendert: ${counts.files} | Desktop-Nav: ${counts.desktop} | Mobile-Nav: ${counts.mobile}`);
console.log(`  Einzellinks: ${counts.links} | Script-Tags: ${counts.scripts} | CSS-Regeln: ${cssRules}`);

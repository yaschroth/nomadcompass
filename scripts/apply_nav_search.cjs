/**
 * Injects a slim search box into the desktop nav of every page. It GET-submits to
 * /cities?q=, which is a real search endpoint (generate_cities_hub.cjs prefills the
 * search box and filters on load) and also backs the WebSite SearchAction. No JS
 * needed: a plain <form> GET. Desktop only (styles/nav.css hides it on mobile, where
 * the /cities page carries the search itself).
 *
 * Idempotent (keyed on class="nav-search"). Anchored before the first
 * <div class="nav-actions"> (present on every standard nav). Pages with a minimal nav
 * and no nav-actions (e.g. the author bio) are skipped.
 *
 * Run after any generator that rewrites the nav. Chained into rebuild_rankings.cjs.
 * Usage: node scripts/apply_nav_search.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const FORM = '<form class="nav-search" action="/cities" method="get" role="search"><input type="search" name="q" placeholder="Search cities&hellip;" aria-label="Search cities" autocomplete="off"></form>';

function htmlIn(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => (dir === '.' ? f : path.join(dir, f)));
}
const all = ['.', 'cities', 'best', 'tier-list', 'activities', 'about', 'blog'].flatMap(htmlIn);

let added = 0, updated = 0, skipped = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  if (/class="nav-search"/.test(html)) {
    // refresh in place so markup changes propagate
    html = html.replace(/<form class="nav-search"[\s\S]*?<\/form>/, FORM);
    if (html !== before) updated++;
  } else if (/<div class="nav-actions">/.test(html)) {
    html = html.replace('<div class="nav-actions">', FORM + '\n      <div class="nav-actions">');
    added++;
  } else { skipped++; continue; }
  if (html !== before) fs.writeFileSync(abs, html);
}
console.log(`Nav search: added ${added}, refreshed ${updated}, skipped (no nav-actions) ${skipped} of ${all.length}`);

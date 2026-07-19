/**
 * Sitewide footer sweep: adds the three trip tools (Time Zone Finder, Route Planner,
 * Tier List Maker) to the "Explore" column of every page's footer. Root-relative hrefs so
 * they work from any depth. Idempotent per link (skips any already present). Run after
 * building new tool pages.
 * Usage: node scripts/add_tools_footer.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const LINKS = [
  ['/timezones', 'Time Zone Finder'],
  ['/route', 'Route Planner'],
  ['/best-weather', 'Best Weather by Month'],
  ['/visa', 'Visa Finder'],
  ['/geoarbitrage', 'Geoarbitrage Calculator'],
  ['/tier-list/maker', 'Tier List Maker'],
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
}

const files = [];
walk(ROOT, files);
let changed = 0;

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const i = html.indexOf('>Explore<');
  if (i < 0) continue;
  const ulStart = html.indexOf('<ul class="footer-links">', i);
  if (ulStart < 0) continue;
  const ulEnd = html.indexOf('</ul>', ulStart);
  if (ulEnd < 0) continue;
  const col = html.slice(ulStart, ulEnd); // the column's <ul> inner (up to </ul>)
  const missing = LINKS.filter(([href]) => !col.includes(`href="${href}"`));
  if (!missing.length) continue;
  const inject = missing.map(([href, label]) => `\n            <li><a href="${href}" class="footer-link">${label}</a></li>`).join('');
  html = html.slice(0, ulEnd) + inject + '\n          ' + html.slice(ulEnd);
  fs.writeFileSync(f, html);
  changed++;
}
console.log(`Added tool links to Explore footer on ${changed} pages.`);

require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds an author byline + "Updated" date to every city-page hero (E-E-A-T +
 * freshness + a sitewide link to the author entity). Inserted after the tagline,
 * before the quick-stats grid. Idempotent. Usage: node scripts/apply_city_byline.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const BYLINE = `        <p class="city-hero-byline">By <a href="/about/yannick-schroth">Yannick Schroth</a> &middot; Updated <time datetime="2026-07-01">July 2026</time></p>\n`;

let changed = 0, already = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(ROOT, 'cities', f);
  const b = fs.readFileSync(abs, 'utf8');
  if (/city-hero-byline/.test(b)) { already++; continue; }
  const s = b.replace(/(        <div class="quick-stats-grid">)/, (m) => BYLINE + m);
  if (s !== b) { fs.writeFileSync(abs, s); changed++; }
}
console.log(`City bylines added: ${changed} | already had: ${already}`);

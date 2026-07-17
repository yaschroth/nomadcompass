/**
 * Installs the Google Analytics 4 (gtag.js) snippet on every page, idempotently.
 * Injected right after the opening <head> (Google's recommended position) between
 * <!-- ga4 --> ... <!-- /ga4 --> markers, so it can be updated or removed in one place.
 *
 * Run after any generator that rewrites <head>. Chained into rebuild_rankings.cjs.
 * Usage: node scripts/apply_analytics.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GA_ID = 'G-JV1BMRJF89';

const BLOCK = `  <!-- ga4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <!-- /ga4 -->`;

function htmlIn(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => (dir === '.' ? f : path.join(dir, f)));
}
const all = ['.', 'cities', 'best', 'tier-list', 'activities', 'blog', 'about'].flatMap(htmlIn);

const re = /  <!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/;
let added = 0, refreshed = 0, noHead = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  if (re.test(html)) {
    html = html.replace(re, BLOCK);
    if (html !== before) refreshed++;
  } else {
    const m = html.match(/<head[^>]*>/i);
    if (!m) { noHead++; continue; }
    html = html.replace(m[0], m[0] + '\n' + BLOCK);
    added++;
  }
  if (html !== before) fs.writeFileSync(abs, html);
}
console.log(`GA4 (${GA_ID}): added ${added}, refreshed ${refreshed}, no <head> ${noHead} of ${all.length}`);

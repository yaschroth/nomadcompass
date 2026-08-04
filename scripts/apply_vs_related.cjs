/**
 * Cross-links the /vs comparison pages: adds a "More head-to-heads" section to each vs page linking
 * to related comparisons that share one of its two cities. The vs pages are indexed but only had ~2
 * inbound links each (from the two city pages) and zero vs-to-vs links; this builds a mesh so they
 * get crawled/ranked better. Idempotent (skips pages with data-related-vs), CRLF-safe, inserted
 * before </main>. Usage: node scripts/apply_vs_related.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const NAME = new Map(CITIES.map((c) => [c.id, c.name]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const dir = path.join(ROOT, 'vs');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
// slug -> {a,b}; index city -> [slug]
const pairs = new Map();
const byCity = new Map();
for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const m = slug.match(/^(.+)-vs-(.+)$/); if (!m) continue;
  const [, a, b] = m;
  pairs.set(slug, { a, b });
  (byCity.get(a) || byCity.set(a, []).get(a)).push(slug);
  (byCity.get(b) || byCity.set(b, []).get(b)).push(slug);
}
function label(slug) { const p = pairs.get(slug); return `${NAME.get(p.a) || p.a} vs ${NAME.get(p.b) || p.b}`; }

let done = 0, skipped = 0, noAnchor = 0;
for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const p = pairs.get(slug); if (!p) continue;
  const abs = path.join(dir, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('data-related-vs')) { skipped++; continue; }
  if (!s.includes('</main>')) { noAnchor++; continue; }

  // related: alternate between the two cities' sibling comparisons for variety
  const fromA = (byCity.get(p.a) || []).filter((x) => x !== slug);
  const fromB = (byCity.get(p.b) || []).filter((x) => x !== slug);
  const rel = []; const seen = new Set();
  for (let i = 0; i < Math.max(fromA.length, fromB.length) && rel.length < 8; i++) {
    for (const arr of [fromA, fromB]) {
      const x = arr[i];
      if (x && !seen.has(x)) { seen.add(x); rel.push(x); if (rel.length >= 8) break; }
    }
  }
  if (!rel.length) { continue; }
  const links = rel.map((x) => `<a href="/vs/${x}" style="color:var(--color-terracotta,#c0392b);text-decoration:none;font-weight:500;">${esc(label(x))}</a>`).join(' &middot; ');
  const block =
    `      <section class="vs-section" data-related-vs><div class="container" style="max-width:860px;">\n` +
    `        <h2 style="font-family:'DM Serif Display',serif;font-size:1.5rem;color:var(--color-ink,#0f172a);margin:0 0 .7rem;">More head-to-heads</h2>\n` +
    `        <p style="line-height:1.95;font-size:.95rem;color:var(--color-charcoal,#334155);">${links}</p>\n` +
    `      </div></section>\n`;
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace('</main>', block.replace(/\n/g, eol) + '</main>');
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`vs related-links added: ${done} | already: ${skipped} | no </main>: ${noAnchor}`);

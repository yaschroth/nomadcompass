/**
 * Internal-linking sweep: adds a "Best of" line to each city page's explore block linking to the
 * relevant /best country page (if one exists) and the /best region page. Helps those hub pages
 * (several sit on page 2 of Google with real impressions) climb, and strengthens site structure.
 * Idempotent (skips pages already carrying data-bestlinks), CRLF-safe, inserted before the
 * "Browse all city guides" row. Usage: node scripts/apply_best_links.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = new Map(CITIES.map((c) => [c.id, c]));
const REG = (() => { try { return require(path.join(ROOT, 'city-regions.js')); } catch (e) { return {}; } })();

// countries that have a /best/best-digital-nomad-cities-in-<slug> page
const COUNTRY = { Colombia: 'colombia', Indonesia: 'indonesia', Italy: 'italy', Mexico: 'mexico',
  Portugal: 'portugal', Spain: 'spain', Thailand: 'thailand', Vietnam: 'vietnam' };
// region key -> { slug, name }
const REGION = {
  europe: { slug: 'europe', name: 'Europe' }, asia: { slug: 'asia', name: 'Asia' },
  latam: { slug: 'latin-america', name: 'Latin America' }, africa: { slug: 'africa', name: 'Africa' },
  middleeast: { slug: 'the-middle-east', name: 'the Middle East' },
  northamerica: { slug: 'north-america', name: 'North America' }, oceania: { slug: 'oceania', name: 'Oceania' },
};
const BEST = (slug, text) => `<a href="/best/best-digital-nomad-cities-in-${slug}">${text}</a>`;
const ANCHOR = '<p class="city-explore-links"><a href="/cities">Browse all city guides</a>';

const dir = path.join(ROOT, 'cities');
let done = 0, skipped = 0, noAnchor = 0, noLink = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const id = f.replace(/\.html$/, '');
  const c = byId.get(id);
  if (!c) continue;
  const abs = path.join(dir, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('data-bestlinks')) { skipped++; continue; }
  if (!s.includes(ANCHOR)) { noAnchor++; continue; }

  const links = [];
  if (COUNTRY[c.country]) links.push(BEST(COUNTRY[c.country], `Best nomad cities in ${c.country}`));
  const r = REGION[REG[id]];
  if (r) links.push(BEST(r.slug, `Best in ${r.name}`));
  if (!links.length) { noLink++; continue; }

  const line = `<p class="city-explore-links" data-bestlinks><strong>Best of:</strong> ${links.join(' &middot; ')}</p>\n          ${ANCHOR}`;
  s = s.replace(ANCHOR, line);
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`best-links added: ${done} | already: ${skipped} | no-anchor: ${noAnchor} | no-region/country: ${noLink}`);

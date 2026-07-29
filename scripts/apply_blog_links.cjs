/**
 * Injects a curated "Explore the data behind this guide" block into each blog post,
 * linking to the relevant city guides, rankings and tier lists. Closes the blog ->
 * rankings/tier-list internal-link gap (blog posts had almost no contextual links into
 * the data clusters). Idempotent. Usage: node scripts/apply_blog_links.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Per-post curated links: [href, label]. City guide first, then rankings + tier lists + a tool.
const MAP = {
  'bangkok-budget-guide': [['/cities/bangkok', 'Bangkok city guide'], ['/best/best-digital-nomad-cities-in-thailand', 'Best nomad cities in Thailand'], ['/tier-list/thailand', 'Thailand tier list'], ['/best/cheapest-cities-for-digital-nomads', 'Cheapest cities ranking'], ['/tier-list/affordability', 'Affordability tier list']],
  'budapest-nomad-guide': [['/cities/budapest', 'Budapest city guide'], ['/best/best-digital-nomad-cities-in-europe', 'Best nomad cities in Europe'], ['/tier-list/europe', 'Europe tier list'], ['/best/best-value-cities-for-digital-nomads', 'Best value ranking'], ['/tier-list', 'The full tier list']],
  'cape-town-nomad-guide': [['/cities/capetown', 'Cape Town city guide'], ['/best/best-digital-nomad-cities-in-africa', 'Best nomad cities in Africa'], ['/tier-list/africa', 'Africa tier list'], ['/best/best-cities-for-nature-and-outdoors', 'Best for nature ranking'], ['/tier-list/nature', 'Nature tier list']],
  'digital-nomad-guide-lisbon': [['/cities/lisbon', 'Lisbon city guide'], ['/best/best-digital-nomad-cities-in-portugal', 'Best nomad cities in Portugal'], ['/tier-list/portugal', 'Portugal tier list'], ['/best/best-digital-nomad-cities-in-europe', 'Best nomad cities in Europe'], ['/tier-list', 'The full tier list']],
  'digital-nomads-tbilisi-georgia': [['/cities/tbilisi', 'Tbilisi city guide'], ['/best/best-cities-for-digital-nomad-visas', 'Best for nomad visas ranking'], ['/best/cheapest-cities-for-digital-nomads', 'Cheapest cities ranking'], ['/tier-list/visa', 'Visa access tier list'], ['/tier-list', 'The full tier list']],
  'dubai-digital-nomad-guide': [['/cities/dubai', 'Dubai city guide'], ['/best/best-digital-nomad-cities-in-the-middle-east', 'Best nomad cities in the Middle East'], ['/tier-list/middle-east', 'Middle East tier list'], ['/best/best-cities-for-fast-wifi', 'Best for WiFi ranking'], ['/tier-list/wifi', 'WiFi tier list']],
  'mexico-city-nomad-guide': [['/cities/mexicocity', 'Mexico City city guide'], ['/best/best-digital-nomad-cities-in-mexico', 'Best nomad cities in Mexico'], ['/tier-list/mexico', 'Mexico tier list'], ['/best/best-digital-nomad-cities-in-north-america', 'Best in North America & the Caribbean'], ['/tier-list', 'The full tier list']],
  'medellin-vs-chiang-mai': [['/compare?a=medellin&b=chiangmai', 'Compare Medellin vs Chiang Mai'], ['/cities/medellin', 'Medellin city guide'], ['/cities/chiangmai', 'Chiang Mai city guide'], ['/best/best-digital-nomad-cities-in-latin-america', 'Best nomad cities in Latin America'], ['/tier-list', 'The full tier list']],
  'best-european-cities-nomads': [['/best/best-digital-nomad-cities-in-europe', 'Best nomad cities in Europe'], ['/tier-list/europe', 'Europe tier list'], ['/best/best-all-round-cities-for-digital-nomads', 'Best all-round cities ranking'], ['/cities', 'Browse all 410 cities'], ['/tier-list', 'The full tier list']],
  'best-coworking-spaces-bali': [['/cities/bali', 'Bali (Canggu) city guide'], ['/best/best-digital-nomad-cities-in-indonesia', 'Best nomad cities in Indonesia'], ['/tier-list/indonesia', 'Indonesia tier list'], ['/best/best-cities-for-nomad-community', 'Best for nomad community ranking'], ['/tier-list/nomad-community', 'Nomad community tier list']],
  'portugal-digital-nomad-visa': [['/best/best-digital-nomad-cities-in-portugal', 'Best nomad cities in Portugal'], ['/tier-list/portugal', 'Portugal tier list'], ['/best/best-cities-for-digital-nomad-visas', 'Best for nomad visas ranking'], ['/tier-list/visa', 'Visa access tier list'], ['/cities/lisbon', 'Lisbon city guide']],
  'digital-nomad-tax-guide': [['/best/best-cities-for-digital-nomad-visas', 'Best for nomad visas ranking'], ['/tier-list/visa', 'Visa access tier list'], ['/best/best-value-cities-for-digital-nomads', 'Best value ranking'], ['/best', 'All city rankings'], ['/wheel', 'Match a city on the Nomad Wheel']],
  'remote-work-routine-guide': [['/best/best-cities-for-fast-wifi', 'Best for WiFi ranking'], ['/tier-list/wifi', 'WiFi tier list'], ['/best/best-cities-for-nomad-community', 'Best for nomad community ranking'], ['/best', 'All city rankings'], ['/wheel', 'Match a city on the Nomad Wheel']],
  'rise-of-coliving-spaces': [['/best/best-cities-for-nomad-community', 'Best for nomad community ranking'], ['/tier-list/nomad-community', 'Nomad community tier list'], ['/best/best-cities-for-first-time-digital-nomads', 'Best for first-timers ranking'], ['/tier-list/first-timers', 'First-timers tier list'], ['/cities', 'Browse all 410 cities']],
  'stay-productive-working-abroad': [['/best/best-cities-for-fast-wifi', 'Best for WiFi ranking'], ['/tier-list/wifi', 'WiFi tier list'], ['/best/best-all-round-cities-for-digital-nomads', 'Best all-round cities ranking'], ['/best', 'All city rankings'], ['/wheel', 'Match a city on the Nomad Wheel']],
};

const CSS = '<style>.blog-explore{max-width:820px;margin:2.5rem auto 0;padding:1.4rem 1.5rem;background:#F6F1E7;border:1px solid #E3D9C6;border-radius:14px}.blog-explore h3{font-family:\'DM Serif Display\',serif;font-size:1.35rem;color:#0F172A;margin:0 0 .9rem}.blog-explore-chips{display:flex;flex-wrap:wrap;gap:.5rem}.blog-explore-chips a{display:inline-flex;align-items:center;padding:.45rem .9rem;background:#fff;border:1px solid #E3D9C6;border-radius:999px;color:#0F172A;text-decoration:none;font-weight:600;font-size:.9rem;transition:border-color .15s,transform .15s}.blog-explore-chips a:hover{border-color:#c0392b;color:#c0392b;transform:translateY(-1px)}</style>';

const files = fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html') && f !== 'index.html');
let done = 0, nomap = 0, noanchor = 0;
for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const links = MAP[slug];
  if (!links) { nomap++; continue; }
  const abs = path.join(ROOT, 'blog', file);
  let html = fs.readFileSync(abs, 'utf8');
  html = html.replace(/\n?\s*<!-- blog-explore-start -->[\s\S]*?<!-- blog-explore-end -->/g, ''); // idempotent strip
  const chips = links.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('');
  const TOOLCHIPS = [['/route', 'Plan a multi-city route'], ['/best-weather', 'Best weather by month'], ['/visa', 'Visa finder by passport'], ['/geoarbitrage', 'Geoarbitrage calculator'], ['/timezones', 'Time-zone overlap']];
  const toolChips = TOOLCHIPS.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('');
  const block = `\n    <!-- blog-explore-start -->${CSS}\n    <section class="blog-explore container">\n      <h3>Explore the data behind this guide</h3>\n      <div class="blog-explore-chips">${chips}</div>\n      <h3 style="margin-top:1.3rem">Plan your trip with our tools</h3>\n      <div class="blog-explore-chips">${toolChips}</div>\n    </section>\n    <!-- blog-explore-end -->`;
  // insert before the Related Articles section, else before </main>
  if (/<section class="related-articles/.test(html)) {
    html = html.replace(/(\n\s*<!-- Related Articles -->\s*)?(\n\s*<section class="related-articles)/, `${block}$1$2`);
    done++;
  } else if (/<\/main>/.test(html)) {
    html = html.replace(/(\n\s*<\/main>)/, `${block}$1`);
    done++;
  } else { noanchor++; continue; }
  fs.writeFileSync(abs, html);
}
console.log(`blog-explore blocks: ${done} injected | ${nomap} no map | ${noanchor} no anchor`);

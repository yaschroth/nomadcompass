require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts a "services in this city" block on every city page that has one.
 *
 * Why it matters more than it looks: /services was linked from 1,592 pages before this, and every
 * one of those links was the nav or the footer. Not one page linked to it with anchor text saying
 * what was on the other end, and no city page led to its own providers at all. Search Console gave
 * /services one impression in three months. These are the links that tell a search engine what
 * services/<city> is about, and they sit on the pages that already earn the site's clicks.
 *
 * Idempotent: the block sits between markers and is replaced on a re-run. Cities with no providers
 * get nothing, and nothing is written to their pages.
 *
 * Run after scripts/build_service_city_pages.cjs.
 * Usage: node scripts/apply_city_services_link.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Through the shared loader: rows name their source by id, so a direct read gives no URL and a
// note missing the sentence its source carries.
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const LANGS = DB._languages;
const CATS = DB._categories;

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const NAME = {};
m.exports.forEach((c) => { if (c && c.id) NAME[c.id] = c.name; });

const byCity = {};
DB.providers.forEach((p) => { (byCity[p.city] = byCity[p.city] || []).push(p); });

const START = '<!-- city-services-start -->';
const END = '<!-- city-services-end -->';
// Sits directly above the "similar cities" block, which is the start of the page's own link
// section, so the new links keep company with the existing ones.
const ANCHOR = '<!-- city-seo-start -->';

const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');

// One link per service instead of one link for the lot. These city pages earn most of the site's
// clicks, so the anchor text they carry is the directory's best route in, and "See all 190
// providers in Barcelona" was the only one on offer. Links go to the service's own page where it
// was written, and to the city page otherwise: never to something that does not exist.
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const CHILDREN = new Set();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => CHILDREN.add(x.city + '|' + x.service));
}
const serviceLink = (slug, cat) => (CHILDREN.has(slug + '|' + cat)
  ? '/services/' + slug + '/' + M.SERVICE_SLUGS[cat]
  : '/services/' + slug + '#svc-' + cat);

let written = 0; let skippedNoAnchor = 0; let skippedNoData = 0;

for (const slug of Object.keys(NAME)) {
  const file = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(file)) continue;
  const rows = byCity[slug];
  if (!rows || !rows.length) { skippedNoData++; continue; }

  let html = fs.readFileSync(file, 'utf8');
  const name = NAME[slug];
  const langs = [...new Set(rows.flatMap((p) => p.languages))];
  const cats = [...new Set(rows.map((p) => p.category))];
  const langNames = langs.map((l) => LANGS[l]).sort();
  const catNames = cats.map((c) => CATS[c].toLowerCase().replace(/ & /g, ' and ')).sort();

  const block = `${START}
      <section class="container city-services" aria-label="Services in ${esc(name)} by language">
        <div class="sim-head">
          <h2>Services in ${esc(name)} in a Language You Speak</h2>
          <p>${rows.length === 1 ? 'One provider' : rows.length + ' providers'} in ${esc(name)}, listed by the language they work in. Every language claim names the source it came from.</p>
        </div>
        <p class="city-services-cats">${cats
    .slice()
    .sort((a, b) => rows.filter((p) => p.category === b).length - rows.filter((p) => p.category === a).length)
    .map((c) => {
      const n = rows.filter((p) => p.category === c).length;
      return `<a class="city-services-cat" href="${serviceLink(slug, c)}">${esc(CATS[c])}<span>${n}</span></a>`;
    }).join('')}</p>
        <p class="city-services-langs">${langNames.slice(0, 8).map((l) => `<span class="sv-lang">${esc(l)}</span>`).join('')}${langNames.length > 8 ? `<span class="sv-lang">+${langNames.length - 8}</span>` : ''}</p>
        <p class="city-services-cta"><a class="btn btn-primary" href="/services/${slug}">See ${rows.length === 1 ? 'the provider' : 'all ' + rows.length + ' providers'} in ${esc(name)} &rarr;</a></p>
      </section>
      ${END}`;

  const re = new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (re.test(html)) {
    html = html.replace(re, block);
  } else if (html.includes(ANCHOR)) {
    html = html.replace(ANCHOR, block + '\n      ' + ANCHOR);
  } else {
    skippedNoAnchor++;
    continue;
  }

  // The block borrows .sim-head and .btn, which every city page already styles. Only the rules it
  // adds of its own need injecting. The guard tests for the newest rule, not the oldest: keyed on
  // an older one, 287 pages that already carried the block would have kept their old stylesheet and
  // rendered the new service chips unstyled.
  if (html.includes('.city-services-langs {') && !html.includes('.city-services-cats {')) {
    html = html.replace(/<style>\s*\.city-services \{[\s\S]*?<\/style>/, '');
  }
  if (!html.includes('.city-services-cats {')) {
    const css = `<style>
    .city-services { margin-top: var(--space-10, 4rem); }
    .city-services-cats { display:flex; flex-wrap:wrap; gap:.5rem; justify-content:center; margin:0 0 .9rem; }
    a.city-services-cat:not(.btn):not(.nav-link) { display:inline-flex; align-items:center; gap:.45rem; padding:.45rem .75rem;
      background:#fff; color:var(--color-ink); border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:var(--radius-md,8px);
      text-decoration:none; font-weight:700; font-size:var(--text-sm); }
    a.city-services-cat:hover { border-color:var(--color-terracotta,#c65d3b); }
    .city-services-cat span { font-size:var(--text-xs); font-weight:600; color:var(--color-stone); }
    .city-services-langs { display:flex; flex-wrap:wrap; gap:.35rem; justify-content:center; margin:0 0 1.25rem; }
    .city-services-langs .sv-lang { font-size:.78rem; font-weight:600; letter-spacing:.02em; padding:.25rem .55rem; border-radius:var(--radius-md,8px); background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); color:var(--color-charcoal,#3f3a34); }
    .city-services-cta { text-align:center; margin:0 0 .9rem; }
    .city-services-note { text-align:center; font-size:var(--text-sm); color:var(--color-stone); margin:0; }
  </style>`;
    html = html.replace('</head>', '  ' + css + '\n</head>');
  }

  fs.writeFileSync(file, html);
  written++;
}

console.log(`Services block on ${written} city pages | no providers yet: ${skippedNoData} | no anchor found: ${skippedNoAnchor}`);

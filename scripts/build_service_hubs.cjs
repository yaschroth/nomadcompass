require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes services/<service>.html: one page per service across every city that has it.
 *
 * The third axis. The directory could be entered by city and, since today, by city and service, but
 * not by service alone, so "English-speaking dentists abroad" had nowhere to land and the 356
 * city-and-service pages had no parent other than their city. These hubs give every one of them a
 * second route in, grouped by country, which is how someone with a destination in mind actually
 * scans a list.
 *
 * Nothing here is thin by construction: the smallest of the thirteen still lists several cities and
 * every row on it is a count that had to be sourced.
 *
 * Usage: node scripts/build_service_hubs.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const P = require(path.join(ROOT, 'scripts', 'lib', 'service_prose.cjs'));
const B = require(path.join(ROOT, 'scripts', 'lib', 'service_bento.cjs'));
const H = require(path.join(ROOT, 'scripts', 'lib', 'service_hero.cjs'));
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const { CAT_ICON } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const esc = P.esc;
const CHILDREN = new Set();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => CHILDREN.add(x.city + '|' + x.service));
}

// A hub over two cities is an index of nothing. Gyms, estate agents, mechanics and tax advisers
// are held back until the data behind them can carry a page; their providers stay reachable from
// their city pages, which is where they already live.
const MIN_CITIES = 5;

const written = [];
const thin = [];

for (const page of M.pageList().filter((p) => p.kind === 'service')) {
  const cat = page.category;
  const svc = M.services[cat];
  if (svc.cities.length < MIN_CITIES) { thin.push(P.catName(cat) + ' (' + svc.cities.length + ')'); continue; }
  const label = P.catName(cat);
  const Label = label.replace(/^./, (c) => c.toUpperCase());

  // Where a city has its own page for this service, link to it; otherwise link to the city page,
  // which is where those providers live. Never a link to something that was not written.
  const rowsFor = (slug) => M.pairOf(slug, cat);
  const linkFor = (slug) => (CHILDREN.has(slug + '|' + cat)
    ? '/services/' + slug + '/' + M.SERVICE_SLUGS[cat]
    : '/services/' + slug);

  const byCountry = {};
  svc.cities.forEach((slug) => {
    const c = M.cities[slug];
    (byCountry[c.country] = byCountry[c.country] || []).push(slug);
  });
  const countries = Object.keys(byCountry).sort((a, b) =>
    byCountry[b].reduce((s, x) => s + rowsFor(x).n, 0) - byCountry[a].reduce((s, x) => s + rowsFor(x).n, 0) ||
    a.localeCompare(b));

  // Which languages this service is actually recorded in, across every city. Local languages are
  // left out: nobody searches for a Spanish-speaking dentist in Spain.
  const langTotals = {};
  svc.rows.forEach((r) => {
    const local = M.LOCAL[M.cities[r.city].country];
    r.languages.forEach((l) => { if (l !== local) langTotals[l] = (langTotals[l] || 0) + 1; });
  });
  const topLangs = Object.entries(langTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const h1 = `${Label} who work in a language you speak, city by city`;
  const title = `${Label} abroad by working language: ${svc.cities.length} cities, ${svc.n} listed`;
  const desc = `${svc.n} ${label} across ${svc.cities.length} cities, indexed by the language they ` +
    `work in. ${topLangs.slice(0, 3).map(([l, n]) => P.langName(l) + ' ' + n).join(', ')}. Every claim names its source.`;

  const standfirst = `${svc.n} ${label} in ${svc.cities.length} cities, listed by the language they ` +
    `work in rather than by rating. Most of them are recorded in ` +
    P.list(topLangs.slice(0, 3).map(([l, n]) => P.langName(l) + ' (' + n + ')')) +
    `, and every language claim on every page links to the source it was read on.`;

  // The language pages are this hub's most specific children, and without a link from here they
  // would be reachable only from the directory index.
  const LANGS_FOR = (() => {
    const f = path.join(ROOT, 'data', 'service-lang-pages.json');
    if (!fs.existsSync(f)) return [];
    return JSON.parse(fs.readFileSync(f, 'utf8')).filter((x) => x.service === cat).sort((a, b) => b.n - a.n);
  })();
  const langChips = LANGS_FOR.map((x) => B.chip({ href: x.url, label: P.langName(x.language), n: x.n })).join('');

  const countryBlocks = countries.map((country) => {
    const slugs = byCountry[country].slice().sort((a, b) => rowsFor(b).n - rowsFor(a).n || M.cities[a].name.localeCompare(M.cities[b].name));
    const total = slugs.reduce((s, x) => s + rowsFor(x).n, 0);
    return `<section class="svh-country">
          <h2>${esc(country)}<span class="svh-n">${total} in ${slugs.length} ${slugs.length === 1 ? 'city' : 'cities'}</span></h2>
          <div class="sb-grid">
        ${slugs.map((slug) => {
    const p = rowsFor(slug);
    // A language and its count are two cells of a chip now, so the numbers line up down the column
    // instead of being buried mid-sentence in "English 519, French 146, German 62".
    const pairs = p.nonLocal.filter(([, n]) => n >= 1).map(([l, n]) => [P.langName(l), n]);
    const tray = pairs.length
      ? B.tray('Works in', B.langChips(pairs))
      : B.tray('Works in', '<span class="sb-tray-text">Language recorded on the page</span>');
    return `<a class="sb-card" href="${linkFor(slug)}">
              ${B.cardHead({ name: M.cities[slug].name, n: p.n, unit: 'listed' })}
              ${tray}
            </a>`;
  }).join('\n        ')}
          </div>
        </section>`;
  }).join('\n      ');

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', BASE + '/'], ['Services by language', BASE + '/services'], [Label, BASE + page.url]]
        .map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      url: BASE + page.url,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: svc.cities.length,
        itemListElement: svc.cities.map((slug, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: label + ' in ' + M.cities[slug].name,
          url: BASE + linkFor(slug),
        })),
      },
    },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | The Nomad HQ</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}${page.url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(title)} | The Nomad HQ">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}${page.url}">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
${ld.map((x) => '  <script type="application/ld+json">' + JSON.stringify(x).replace(/</g, '\\u003c') + '</script>').join('\n')}
  ${shell.style}
  <style>
${H.css}
    .svh-page { padding-top: var(--space-8); padding-bottom: var(--space-10); }
    .svh-langs { margin: 0 0 var(--space-8); }
    .svh-langs h2 { font-family: 'DM Serif Display', serif; font-size: 1.25rem; margin: 0 0 var(--space-5); }
    .svh-country { margin: 0 0 var(--space-12); }
    .svh-country h2 { display: flex; align-items: baseline; gap: .6rem; font-family: 'DM Serif Display', serif; font-size: 1.3rem;
      margin: 0 0 var(--space-6); padding-bottom: .5rem; border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svh-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-xs); font-weight: 700;
      letter-spacing: .04em; text-transform: uppercase; color: var(--color-stone); }
${B.css}
    .svh-foot { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svh-foot p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main id="main-content">
    ${H.hero({
    crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; ${esc(Label)}`,
    eyebrow: `${inlineIcon(CAT_ICON[cat])}${esc(Label)} worldwide`,
    h1,
    sub: standfirst,
    stats: [
      [svc.n.toLocaleString('en-US'), label],
      [svc.cities.length, svc.cities.length === 1 ? 'city' : 'cities'],
      [countries.length, countries.length === 1 ? 'country' : 'countries'],
      [topLangs.length ? Object.keys(langTotals).length : 0, 'languages'],
    ],
    image: H.sectionImage(),
    size: 'full',
  })}
    <div class="svh-page container">

      ${langChips ? `<nav class="svh-langs" aria-label="By language">
        <h2>Pick a language</h2>
        <div class="sb-chips">${langChips}</div>
      </nav>` : ''}

      ${countryBlocks}

      <section class="svh-foot">
        <p>Every city above links to the ${esc(label)} we hold for it, and every entry there names the source its language claim came from. We have not called or visited any of them, so treat each one as a claim someone else made.</p>
        <p><a href="/services">Browse by city instead</a>, or read the <a href="/services#how">tiers we grade a source by</a>.</p>
      </section>
    </div>
  </main>
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;

  shell.assertComplete(html, page.url);
  fs.writeFileSync(path.join(ROOT, page.file), html);
  written.push({ url: page.url, file: page.file, kind: 'service', service: cat, n: svc.n, cities: svc.cities.length, indexable: true, title, h1 });
}

fs.writeFileSync(path.join(ROOT, 'data', 'service-hub-pages.json'), JSON.stringify(written, null, 1) + '\n');
if (thin.length) console.log('  held back, under ' + MIN_CITIES + ' cities: ' + thin.join(', '));
console.log(`Wrote ${written.length} service hubs: ` + written.map((w) => w.url.replace('/services/', '') + ' (' + w.cities + ' cities)').join(', '));

require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes services/<service>/<language>.html, for example /services/doctors/german.
 *
 * This is the page a search for "German-speaking doctors" should land on, and it is the one axis the
 * directory still lacked. It is deliberately NOT city-and-service-and-language: 484 of the 540 pairs
 * are covered nine rows in ten by a single non-local language, so a page per city per language would
 * mostly be its own parent with a different title. A page per service per language is a different
 * question with a different answer, and there are only fifteen of them.
 *
 * The page is an index, not a second copy of the listings. It names cities and counts and links to
 * the page that holds the providers, so its text overlap with anything else in the family stays near
 * zero. Reproducing 148 provider notes here would have been the duplicate content this whole
 * restructure exists to avoid.
 *
 * A page is written only where the language has at least 8 providers in at least 5 cities, covers no
 * more than 60% of the cities that hold the service at all (or it is simply the service hub again),
 * and its parent hub exists.
 *
 * Usage: node scripts/build_service_lang_pages.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const P = require(path.join(ROOT, 'scripts', 'lib', 'service_prose.cjs'));
const B = require(path.join(ROOT, 'scripts', 'lib', 'service_bento.cjs'));
const F = require(path.join(ROOT, 'scripts', 'lib', 'service_filter.cjs'));
const H = require(path.join(ROOT, 'scripts', 'lib', 'service_hero.cjs'));
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));
const META = require(path.join(ROOT, 'scripts', 'lib', 'meta_text.cjs'));
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const { CAT_ICON } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const esc = P.esc;
const MIN_ROWS = 8;
const MIN_CITIES = 5;
const MAX_CITY_SHARE = 0.60;

const langSlug = (code) => M.LANGS[code].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const HUBS = new Set();
{
  const f = path.join(ROOT, 'data', 'service-hub-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => HUBS.add(x.service));
}
const CHILDREN = new Set();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => CHILDREN.add(x.city + '|' + x.service));
}
const linkTo = (slug, cat) => (CHILDREN.has(slug + '|' + cat)
  ? '/services/' + slug + '/' + M.SERVICE_SLUGS[cat]
  : '/services/' + slug);

// A slug collision would make /services/doctors/german ambiguous with a city called German.
{
  const slugs = Object.keys(M.LANGS).map(langSlug);
  const clash = slugs.filter((s) => M.cities[s] || Object.values(M.SERVICE_SLUGS).includes(s));
  if (clash.length) { console.error('language slug collides with a city or service: ' + clash.join(', ')); process.exit(1); }
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) { console.error('two languages share a slug: ' + dupes.join(', ')); process.exit(1); }
}

const written = [];
const skipped = [];

for (const [cat, svc] of Object.entries(M.services)) {
  if (!HUBS.has(cat)) continue;
  const label = P.catName(cat);
  const Label = label.replace(/^./, (c) => c.toUpperCase());

  // Rows per non-local language, with the cities they sit in.
  const byLang = {};
  svc.rows.forEach((r) => {
    const local = M.LOCAL[M.cities[r.city].country];
    r.languages.forEach((l) => {
      if (l === local) return;
      byLang[l] = byLang[l] || { rows: [], cities: new Set() };
      byLang[l].rows.push(r);
      byLang[l].cities.add(r.city);
    });
  });

  for (const [lang, v] of Object.entries(byLang)) {
    const share = v.cities.size / svc.cities.length;
    if (v.rows.length < MIN_ROWS || v.cities.size < MIN_CITIES || share > MAX_CITY_SHARE) {
      if (v.rows.length >= MIN_ROWS) skipped.push(label + '/' + langSlug(lang) + ' (' + v.cities.size + ' cities, share ' + share.toFixed(2) + ')');
      continue;
    }

    const langName = P.langName(lang);
    const url = '/services/' + M.SERVICE_SLUGS[cat] + '/' + langSlug(lang);
    const file = 'services/' + M.SERVICE_SLUGS[cat] + '/' + langSlug(lang) + '.html';

    // Cities, grouped by country, biggest first.
    const cityRows = [...v.cities].map((slug) => ({
      slug,
      name: M.cities[slug].name,
      country: M.cities[slug].country,
      n: v.rows.filter((r) => r.city === slug).length,
      total: M.pairOf(slug, cat).n,
    })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

    const byCountry = {};
    cityRows.forEach((c) => { (byCountry[c.country] = byCountry[c.country] || []).push(c); });
    const countries = Object.keys(byCountry).sort((a, b) =>
      byCountry[b].reduce((s, x) => s + x.n, 0) - byCountry[a].reduce((s, x) => s + x.n, 0) || a.localeCompare(b));

    // --- prose, all of it computed from these rows and none of it repeated from the listings ----
    const top = cityRows.slice(0, 3);
    const topShare = Math.round((top.reduce((s, c) => s + c.n, 0) / v.rows.length) * 100);
    const standfirst = `${v.rows.length} ${label} who work in ${langName}, in ${v.cities.size} cities across ` +
      `${countries.length} ${countries.length === 1 ? 'country' : 'countries'}. ` +
      `${P.list(top.map((c) => c.name + ' (' + c.n + ')'))} hold ${topShare}% of them between them.`;

    const srcCounts = {};
    v.rows.forEach((r) => { const h = M.hostOf(r.sourceUrl); srcCounts[h] = (srcCounts[h] || 0) + 1; });
    const srcTop = Object.entries(srcCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([h, n]) => ({ n, ...P.publisherOf(h) }));
    const provenance = `These come from ${Object.keys(srcCounts).length} different ` +
      `${Object.keys(srcCounts).length === 1 ? 'source' : 'sources'}, led by ` +
      P.list(srcTop.map((s) => s.publisher + ' (' + s.n + ')')) + '. ' +
      `A consular list records the language because the mission publishes it for its own citizens, ` +
      `which is why ${langName} turns up in ${countries.length} ${countries.length === 1 ? 'country' : 'countries'} ` +
      `rather than only where ${langName} is spoken.`;

    const evCounts = {};
    v.rows.forEach((r) => { evCounts[r.evidence] = (evCounts[r.evidence] || 0) + 1; });
    const official = evCounts.official || 0;
    const claim = official === v.rows.length
      ? `Every one of these sits on an official list, the strongest tier this directory carries.`
      : `${official} of the ${v.rows.length} sit on an official list; the rest rest on the provider ` +
        `saying so or on a directory listing, which is a weaker claim and is labelled as such on each card.`;

    // Where this language is not recorded at all, which is a real limit of the sourcing.
    const without = svc.cities.filter((slug) => !v.cities.has(slug));
    const biggestWithout = without
      .map((slug) => ({ slug, name: M.cities[slug].name, n: M.pairOf(slug, cat).n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 4);
    const gaps = biggestWithout.length
      ? `We list ${label} in ${without.length} further cities with no ${langName} speaker recorded, ` +
        `among them ${P.list(biggestWithout.map((c) => c.name + ' (' + c.n + ')'))}. ` +
        `That is a gap in what has been published, not proof that nobody there works in ${langName}.`
      : '';

    const faq = [
      {
        q: `How many ${langName}-speaking ${label} does this page list?`,
        a: `${v.rows.length}, in ${v.cities.size} cities. That is the number whose working language we can trace to a published source.`,
      },
      {
        q: `Where are most of them?`,
        a: `${P.list(top.map((c) => c.name + ' with ' + c.n))}. Together that is ${topShare}% of the page.`,
      },
      {
        q: `Does a listing mean the ${P.singular(cat)} speaks ${langName} personally?`,
        a: `Not always. Some sources name a practice whose staff include ${P.an(langName)} speaker rather than the named person, and each card quotes the wording its source used.`,
      },
    ];

    const h1 = `${langName}-speaking ${label}, city by city`;
    const title = `${langName}-speaking ${label} in ${v.cities.size} cities: ${v.rows.length} listed`;
    const descCore = `${v.rows.length} ${label} who work in ${langName}, across ${v.cities.size} cities in ` +
      `${countries.length} countries, led by ${top.map((c) => c.name).join(', ')}.`;
    const desc = META.band(descCore, [
      'Every language claim names the source it was read on, and links straight to it.',
      'Every language claim names the source it was read on.',
      'Every language claim names its source.',
    ]);

    // One counter for the page, so the photographs that ship in the HTML are the tiles a reader
    // reaches first rather than the first few of every country block.
    let tileIndex = 0;
    const countryBlocks = countries.map((country) => `<section class="svl-country sf-group">
          <h2>${esc(country)}<span class="svl-n">${byCountry[country].reduce((s, x) => s + x.n, 0)} in ${byCountry[country].length} ${byCountry[country].length === 1 ? 'city' : 'cities'}</span></h2>
          <div class="sb-grid">
        ${byCountry[country].map((c) => B.cityTile({
    href: linkTo(c.slug, cat),
    slug: c.slug,
    name: c.name,
    country: M.cities[c.slug].country,
    iso: M.cities[c.slug].iso,
    n: c.n,
    unit: langName,
    index: tileIndex++,
    eyebrow: `Of all ${label} here`,
    trayInner: B.shareBar(c.n, c.total),
  })).join('\n        ')}
          </div>
        </section>`).join('\n      ');

    const ld = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          ['Home', BASE + '/'],
          ['Services by language', BASE + '/services'],
          [Label, BASE + '/services/' + M.SERVICE_SLUGS[cat]],
          [langName, BASE + url],
        ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: h1,
        url: BASE + url,
        inLanguage: 'en',
        about: { '@type': 'Language', name: langName },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: cityRows.length,
          itemListElement: cityRows.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: langName + '-speaking ' + label + ' in ' + c.name,
            url: BASE + linkTo(c.slug, cat),
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
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
  <link rel="canonical" href="${BASE}${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(title)} | The Nomad HQ">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}${url}">
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
    .svl-page { padding-top: var(--space-8); padding-bottom: var(--space-10); }
    .svl-country { margin: 0 0 var(--space-12); }
    .svl-country h2 { display: flex; align-items: baseline; gap: .6rem; font-family: 'DM Serif Display', serif; font-size: 1.3rem;
      margin: 0 0 var(--space-6); padding-bottom: .5rem; border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svl-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-xs); font-weight: 700;
      letter-spacing: .04em; text-transform: uppercase; color: var(--color-stone); }
${B.css}
${F.css}
    .svl-prose { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svl-prose h2 { font-family: 'DM Serif Display', serif; font-size: 1.35rem; margin: var(--space-8) 0 var(--space-5); }
    .svl-prose p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
    .svl-faq { margin: 0 0 var(--space-5); }
    .svl-faq dt { font-weight: 700; color: var(--color-ink); margin: var(--space-4) 0 .3rem; }
    .svl-faq dd { margin: 0; color: var(--color-charcoal); line-height: 1.7; }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main id="main-content">
    ${H.hero({
    crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; <a href="/services/${M.SERVICE_SLUGS[cat]}">${esc(Label)}</a> &rsaquo; ${esc(langName)}`,
    eyebrow: `${inlineIcon(CAT_ICON[cat])}${esc(langName)}-speaking ${esc(label)}`,
    h1,
    sub: standfirst,
    stats: [
      [v.rows.length.toLocaleString('en-US'), label],
      [v.cities.size, v.cities.size === 1 ? 'city' : 'cities'],
      [countries.length, countries.length === 1 ? 'country' : 'countries'],
    ],
    image: H.sectionImage(),
    size: 'full',
  })}
    <div class="svl-page container">

      ${F.bar({
    id: 'svl',
    items: cityRows.length,
    fields: [
      { key: 'q', search: true, label: 'City or country', placeholder: 'Type a city or country…' },
      { key: 'country', label: 'Country', any: 'Any country', options: countries.map((c) => [B.slugify(c), c]) },
    ],
  })}
      ${F.count({ id: 'svl', total: cityRows.length, noun: 'city', nounPlural: 'cities' })}

      ${countryBlocks}

      ${F.empty({ id: 'svl', what: `This page lists every city where we can point at a source saying a ${label.replace(/s$/, '')} works in ${langName}.` })}

      <div class="svl-prose">
        <h2>Where these came from</h2>
        <p>${esc(provenance)}</p>
        <p>${esc(claim)}</p>
        ${gaps ? `<h2>Where we have nothing</h2>\n        <p>${esc(gaps)}</p>` : ''}
        <h2>Questions</h2>
        <dl class="svl-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
        <p><a href="/services/${M.SERVICE_SLUGS[cat]}">All ${svc.cities.length} cities where we list ${esc(label)}</a>, whatever the language.</p>
      </div>
    </div>
  </main>
  ${B.revealJs}
  ${F.js({ id: 'svl', noun: 'city', nounPlural: 'cities' })}
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;

    shell.assertComplete(html, url);
    const dir = path.join(ROOT, 'services', M.SERVICE_SLUGS[cat]);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(ROOT, file), html);
    written.push({
      url, file, kind: 'lang', service: cat, language: lang, n: v.rows.length,
      cities: v.cities.size, indexable: true, title, h1,
    });
  }
}

// A page that no longer qualifies has to be removed, not left lying. The thresholds move as the data
// grows, and a file on disk that no manifest claims is an orphan: nothing links to it, nothing
// updates it, and the gate reports it on every run.
{
  const keep = new Set(written.map((w) => w.file));
  const removed = [];
  Object.values(M.SERVICE_SLUGS).forEach((slug) => {
    const dir = path.join(ROOT, 'services', slug);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).filter((f) => f.endsWith('.html')).forEach((f) => {
      const rel = 'services/' + slug + '/' + f;
      if (!keep.has(rel)) { fs.unlinkSync(path.join(dir, f)); removed.push(rel); }
    });
  });
  if (removed.length) console.log('  removed ' + removed.length + ' page(s) that no longer qualify: ' + removed.join(', '));
}

fs.writeFileSync(path.join(ROOT, 'data', 'service-lang-pages.json'), JSON.stringify(written, null, 1) + '\n');
console.log(`Wrote ${written.length} service-and-language pages: ` +
  written.sort((a, b) => b.n - a.n).map((w) => w.url.replace('/services/', '') + ' (' + w.n + ')').join(', '));
if (skipped.length) console.log('  not built, too few cities or too close to the hub: ' + skipped.slice(0, 8).join(', '));

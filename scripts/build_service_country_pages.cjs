require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The country axis of the services directory: three levels, all of them indexes.
 *
 *   /services/greece                    every service we hold in the country
 *   /services/greece/lawyers            the cities that hold one
 *   /services/greece/lawyers/english    the cities that hold an English-speaking one
 *
 * Why this exists. Search Console for the 30 days to 2026-08-27 returned every query that reached
 * the directory, and each one of them is <service> in <place>. The single biggest was "english
 * speaking lawyers in greece", 15 impressions at position 33, and the page Google had to show for
 * it was /services/athens/lawyers: a city page answering a country question. Country was a
 * dimension the data had and the URLs did not, so it lived in a dropdown on the language pages
 * where nobody can search it. That is the findability rule this directory is built on, broken in
 * the one place it was most expensive.
 *
 * These pages are indexes, not second copies of the listings. They name cities and counts and link
 * to the page holding the providers, the same shape build_service_lang_pages.cjs uses and for the
 * same reason: reproducing 1,887 provider notes on /services/spain/translators would be the
 * duplicate content the rest of this directory is arranged to avoid.
 *
 * Thresholds, and what each is for:
 *
 *   MIN_CITIES = 3   A country whose providers sit in one or two cities is those city pages again
 *                    with a different heading. Hungary holds 326 lawyers and 3 of them sit outside
 *                    Budapest, so /services/hungary/lawyers would be /services/budapest/lawyers.
 *                    This is the threshold that does the real work.
 *   MIN_ROWS         Below it a page is a stub competing with its own children.
 *
 * Usage: node scripts/build_service_country_pages.cjs
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

/**
 * The hero photograph for a country page: the biggest city in it, not the directory's own image.
 *
 * H.sectionImage() is one fixed photograph of Shavteli Street in Tbilisi, which is right for a page
 * about a language and wrong for a page headed "in Greece". All 713 cities carry a full hero set
 * with attribution, so a country page shows the city holding the most of what it lists, and falls
 * back to the section image only if that city somehow has no photograph.
 */
const PHOTOS = (() => {
  const dir = path.join(ROOT, 'images', 'cities');
  const af = path.join(dir, 'attribution.json');
  let attrib = {};
  if (fs.existsSync(af)) {
    const raw = JSON.parse(fs.readFileSync(af, 'utf8'));
    attrib = Array.isArray(raw) ? Object.fromEntries(raw.map((r) => [r.slug, r])) : raw;
  }
  const has = (slug) => ['.webp', '-m.webp', '-t.webp'].every((x) => fs.existsSync(path.join(dir, slug + x)));
  return { attrib, has };
})();
const heroFor = (slug, name) => (PHOTOS.has(slug)
  ? H.cityImage(slug, name, PHOTOS.attrib[slug] || {})
  : H.sectionImage());

const HUB_MIN_ROWS = 15;
const CAT_MIN_ROWS = 10;
const LANG_MIN_ROWS = 15;
const MIN_CITIES = 3;

const slugify = B.slugify;
const cap = (s) => String(s).replace(/^./, (c) => c.toUpperCase());

// --- what already exists, so every link points at the most specific page there is ---------------
const readManifest = (name) => {
  const f = path.join(ROOT, 'data', name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
};
const PAIRS = new Set(readManifest('service-pair-pages.json').map((x) => x.city + '|' + x.service));
const CITY_LANG = new Set(readManifest('service-city-lang-pages.json')
  .filter((x) => x.page === 1 || x.page == null)
  .map((x) => x.city + '|' + x.service + '|' + x.language));
const HUBS = new Set(readManifest('service-hub-pages.json').map((x) => x.service));

const cityCatUrl = (city, cat) => (PAIRS.has(city + '|' + cat)
  ? '/services/' + city + '/' + M.SERVICE_SLUGS[cat]
  : '/services/' + city);
const cityCatLangUrl = (city, cat, lang) => (CITY_LANG.has(city + '|' + cat + '|' + lang)
  ? '/services/' + city + '/' + M.SERVICE_SLUGS[cat] + '/' + langSlug(lang)
  : cityCatUrl(city, cat));

function langSlug(code) {
  return M.LANGS[code].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// --- the data, grouped once ---------------------------------------------------------------------
const COUNTRIES = {};
for (const r of M.DB.providers) {
  const c = M.CITY[r.city];
  if (!c || !c.country) continue;
  const co = (COUNTRIES[c.country] = COUNTRIES[c.country] || {
    name: c.country, rows: [], cities: new Set(), byCat: {},
  });
  co.rows.push(r);
  co.cities.add(r.city);
  const cat = (co.byCat[r.category] = co.byCat[r.category] || { rows: [], cities: new Set(), byLang: {} });
  cat.rows.push(r);
  cat.cities.add(r.city);
  const local = M.LOCAL[c.country];
  for (const l of (r.languages || [])) {
    // The country's own language sits on nearly every row, so a page for it would be the parent
    // again. Same reason it stays out of the filter menus and the headlines.
    if (l === local || !M.LANGS[l]) continue;
    const lv = (cat.byLang[l] = cat.byLang[l] || { rows: [], cities: new Set() });
    lv.rows.push(r);
    lv.cities.add(r.city);
  }
}

/**
 * A country whose slug is already a page under /services.
 *
 * Singapore is the only one and it is a city-state: /services/singapore is its city page and
 * already answers the country question completely, so there is nothing to add and nowhere to put
 * it. Anything else appearing here is a real collision and stops the build rather than silently
 * overwriting a city.
 */
const EXPECTED_COLLISIONS = new Set(['singapore']);
{
  const reserved = new Set([...Object.keys(M.cities), ...Object.values(M.SERVICE_SLUGS), 'languages']);
  const clash = Object.keys(COUNTRIES).map(slugify).filter((s) => reserved.has(s));
  const surprise = clash.filter((s) => !EXPECTED_COLLISIONS.has(s));
  if (surprise.length) {
    console.error('country slug collides with an existing /services page: ' + surprise.join(', '));
    process.exit(1);
  }
  const slugs = Object.keys(COUNTRIES).map(slugify);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) { console.error('two countries share a slug: ' + dupes.join(', ')); process.exit(1); }
}

// --- shared page furniture ----------------------------------------------------------------------
const STYLE = `
    .svn-page { padding-top: var(--space-8); padding-bottom: var(--space-10); }
    .svn-block { margin: 0 0 var(--space-12); }
    .svn-block h2 { display: flex; align-items: baseline; gap: .6rem; font-family: 'DM Serif Display', serif;
      font-size: 1.3rem; margin: 0 0 var(--space-6); padding-bottom: .5rem;
      border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svn-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-xs);
      font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--color-stone); }
    .svn-prose { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svn-prose h2 { font-family: 'DM Serif Display', serif; font-size: 1.35rem; margin: var(--space-8) 0 var(--space-5); }
    .svn-prose p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
    .svn-faq { margin: 0 0 var(--space-5); }
    .svn-faq dt { font-weight: 700; color: var(--color-ink); margin: var(--space-4) 0 .3rem; }
    .svn-faq dd { margin: 0; color: var(--color-charcoal); line-height: 1.7; }
    .svn-onward { display: flex; flex-wrap: wrap; gap: .5rem; margin: var(--space-6) 0 0; padding: 0; list-style: none; }
    .svn-onward a { display: inline-block; padding: .4rem .8rem; border-radius: 999px; font-size: var(--text-sm);
      background: var(--color-sand, #f4efe4); color: var(--color-ink); text-decoration: none;
      border: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svn-onward a:hover { background: var(--color-sand-dark, #e3d9c6); }`;

/** Every page in this family is the same document with a different middle. */
function page({ url, title, desc, crumbs, eyebrow, h1, standfirst, stats, ld, filter, blocks, prose, hero }) {
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
  <meta name="twitter:description" content="${esc(desc)}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
${ld.map((x) => '  <script type="application/ld+json">' + JSON.stringify(x).replace(/</g, '\\u003c') + '</script>').join('\n')}
  ${shell.style}
  <style>
${H.css}
${B.css}
${F.css}
${STYLE}
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main id="main-content">
    ${H.hero({
    crumbs, eyebrow, h1, sub: standfirst, stats, image: hero, size: 'full',
  })}
    <div class="svn-page container">

      ${filter}

      ${blocks}

      ${prose}
    </div>
  </main>
  ${B.revealJs}
  ${F.js({ id: 'svn', noun: 'city', nounPlural: 'cities' })}
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;
  shell.assertComplete(html, url);
  return html;
}

/** Where the rows came from, said the same way on all three levels. */
function sourcing(rows, subject) {
  const src = {};
  rows.forEach((r) => { const h = M.hostOf(r.sourceUrl); src[h] = (src[h] || 0) + 1; });
  const n = Object.keys(src).length;
  const top = Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([h, c]) => ({ c, ...P.publisherOf(h) }));
  const ev = {};
  rows.forEach((r) => { ev[r.evidence] = (ev[r.evidence] || 0) + 1; });
  const official = ev.official || 0;
  return {
    provenance: `${cap(subject)} come from ${n} ${n === 1 ? 'source' : 'sources'}, led by `
      + P.list(top.map((s) => s.publisher + ' (' + s.c + ')')) + '.',
    claim: official === rows.length
      ? 'Every one of these sits on an official list, the strongest tier this directory carries.'
      : `${official} of the ${rows.length} sit on an official list; the rest rest on the provider `
        + 'saying so or on a directory listing, which is a weaker claim and is labelled on each card.',
  };
}

const written = [];
const skipped = [];

// --- level 2 and 3 are written inside level 1's loop so the hub can link what actually got built --
for (const [countryName, co] of Object.entries(COUNTRIES)) {
  const cslug = slugify(countryName);
  if (EXPECTED_COLLISIONS.has(cslug)) { skipped.push(cslug + ' (a city page of the same name already answers it)'); continue; }

  const cityList = [...co.cities];
  const builtCats = [];

  // ---------- level 2: /services/<country>/<service> ----------------------------------------
  for (const [cat, v] of Object.entries(co.byCat)) {
    if (v.rows.length < CAT_MIN_ROWS || v.cities.size < MIN_CITIES) {
      if (v.rows.length >= CAT_MIN_ROWS) {
        skipped.push(cslug + '/' + M.SERVICE_SLUGS[cat] + ' (' + v.rows.length + ' in only ' + v.cities.size + (v.cities.size === 1 ? ' city)' : ' cities)'));
      }
      continue;
    }
    const label = P.catName(cat);
    const url = '/services/' + cslug + '/' + M.SERVICE_SLUGS[cat];

    const cities = [...v.cities].map((slug) => ({
      slug, name: M.cities[slug].name, n: v.rows.filter((r) => r.city === slug).length,
    })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

    const top = cities.slice(0, 3);
    const topShare = Math.round((top.reduce((s, c) => s + c.n, 0) / v.rows.length) * 100);

    // Languages worth naming, and the level-3 pages built under this one.
    const langs = Object.entries(v.byLang)
      .filter(([, lv]) => lv.rows.length >= LANG_MIN_ROWS && lv.cities.size >= MIN_CITIES)
      .sort((a, b) => b[1].rows.length - a[1].rows.length);

    // ---------- level 3: /services/<country>/<service>/<language> ---------------------------
    const builtLangs = [];
    for (const [lang, lv] of langs) {
      const langName = P.langName(lang);
      const lurl = url + '/' + langSlug(lang);
      const lcities = [...lv.cities].map((slug) => ({
        slug, name: M.cities[slug].name,
        n: lv.rows.filter((r) => r.city === slug).length,
        total: v.rows.filter((r) => r.city === slug).length,
      })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
      const ltop = lcities.slice(0, 3);
      const lshare = Math.round((lv.rows.length / v.rows.length) * 100);
      const s = sourcing(lv.rows, `these ${langName}-speaking ${label}`);

      const lstand = `${lv.rows.length} ${label} in ${countryName} who work in ${langName}, `
        + `in ${lv.cities.size} cities. `
        + `${P.list(ltop.map((c) => c.name + ' (' + c.n + ')'))} hold ${Math.round((ltop.reduce((a, c) => a + c.n, 0) / lv.rows.length) * 100)}% of them.`;

      const lfaq = [
        {
          q: `How many ${langName}-speaking ${label} are there in ${countryName}?`,
          a: `We list ${lv.rows.length}, in ${lv.cities.size} cities. That is the number whose working `
            + `language we can trace to a published source, not the number that exists.`,
        },
        {
          q: `Which city has the most?`,
          a: `${ltop[0].name}, with ${ltop[0].n} of the ${lv.rows.length}.`,
        },
        {
          q: `Is ${langName} unusual for ${label} in ${countryName}?`,
          a: `${lshare}% of the ${v.rows.length} ${label} we hold in ${countryName} are recorded as working in `
            + `${langName}. A consular list records the language because the mission publishes it for its `
            + `own citizens, so the figure reflects who publishes lists, not only who speaks what.`,
        },
      ];

      const lh1 = `${langName}-speaking ${label} in ${countryName}`;
      const ltitleOpts = [
        `${langName}-speaking ${label} in ${countryName}: ${lv.rows.length} listed`,
        `${langName}-speaking ${label} in ${countryName}`,
        `${langName} ${label} in ${countryName}`,
      ];
      const ltitle = ltitleOpts.find((t) => t.length <= 60) || ltitleOpts[ltitleOpts.length - 1];
      const ldesc = META.band(
        `${lv.rows.length} ${label} in ${countryName} who work in ${langName}, across ${lv.cities.size} cities, `
        + `led by ${ltop.map((c) => c.name).join(', ')}.`,
        [
          'Every language claim names the source it was read on, and links straight to it.',
          'Every language claim names the source it was read on.',
          'Each one links to the source that states it.',
        ],
      );

      let li = 0;
      const lblocks = `<section class="svn-block sf-group">
          <h2>${esc(countryName)}<span class="svn-n">${lv.rows.length} in ${lv.cities.size} cities</span></h2>
          <div class="sb-grid">
        ${lcities.map((c) => B.cityTile({
    href: cityCatLangUrl(c.slug, cat, lang),
    slug: c.slug,
    name: c.name,
    country: countryName,
    iso: M.cities[c.slug].iso,
    n: c.n,
    unit: langName,
    index: li++,
    eyebrow: `Of all ${label} here`,
    trayInner: B.shareBar(c.n, c.total),
  })).join('\n        ')}
          </div>
        </section>`;

      const lld = [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            ['Home', BASE + '/'],
            ['Services by language', BASE + '/services'],
            [countryName, BASE + '/services/' + cslug],
            [cap(label), BASE + url],
            [langName, BASE + lurl],
          ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: lh1,
          url: BASE + lurl,
          inLanguage: 'en',
          about: { '@type': 'Language', name: langName },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: lcities.length,
            itemListElement: lcities.map((c, i) => ({
              '@type': 'ListItem', position: i + 1,
              name: langName + '-speaking ' + label + ' in ' + c.name,
              url: BASE + cityCatLangUrl(c.slug, cat, lang),
            })),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: lfaq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
        },
      ];

      const lhtml = page({
        hero: heroFor(ltop[0].slug, ltop[0].name),
        url: lurl,
        title: ltitle,
        desc: ldesc,
        crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; <a href="/services/${cslug}">${esc(countryName)}</a> &rsaquo; <a href="${url}">${esc(cap(label))}</a> &rsaquo; ${esc(langName)}`,
        eyebrow: `${inlineIcon(CAT_ICON[cat])}${esc(langName)} in ${esc(countryName)}`,
        h1: lh1,
        standfirst: lstand,
        stats: [
          [lv.rows.length.toLocaleString('en-US'), label],
          [lv.cities.size, lv.cities.size === 1 ? 'city' : 'cities'],
          [lshare + '%', 'of all ' + label + ' here'],
        ],
        ld: lld,
        filter: F.bar({
          id: 'svn',
          items: lcities.length,
          fields: [{ key: 'q', search: true, label: 'City', placeholder: `Search ${lcities.length} cities…` }],
        }) + '\n      ' + F.count({ id: 'svn', total: lcities.length, noun: 'city', nounPlural: 'cities' }),
        blocks: lblocks + '\n\n      ' + F.empty({
          id: 'svn',
          what: `This page lists every city in ${countryName} where a source says ${P.an(langName)}-speaking ${P.singular(cat)} works.`,
        }),
        prose: `<div class="svn-prose">
        <h2>Where these came from</h2>
        <p>${esc(s.provenance)}</p>
        <p>${esc(s.claim)}</p>
        <h2>Questions</h2>
        <dl class="svn-faq">
${lfaq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
        <ul class="svn-onward">
          <li><a href="${url}">All ${v.rows.length} ${esc(label)} in ${esc(countryName)}</a></li>
          <li><a href="/services/${cslug}">Every service in ${esc(countryName)}</a></li>
${HUBS.has(cat) ? `          <li><a href="/services/${M.SERVICE_SLUGS[cat]}">${esc(cap(label))} in every country</a></li>` : ''}
        </ul>
      </div>`,
      });

      const ldir = path.join(ROOT, 'services', cslug, M.SERVICE_SLUGS[cat]);
      if (!fs.existsSync(ldir)) fs.mkdirSync(ldir, { recursive: true });
      shell.writePage('services/' + cslug + '/' + M.SERVICE_SLUGS[cat] + '/' + langSlug(lang) + '.html', lhtml);
      written.push({
        url: lurl, file: 'services/' + cslug + '/' + M.SERVICE_SLUGS[cat] + '/' + langSlug(lang) + '.html',
        kind: 'country-lang', country: cslug, service: cat, language: lang,
        n: lv.rows.length, cities: lv.cities.size, indexable: true, title: ltitle, h1: lh1,
      });
      builtLangs.push({ lang, langName, n: lv.rows.length, url: lurl });
    }

    // ---------- back to level 2 --------------------------------------------------------------
    const s = sourcing(v.rows, `these ${label}`);
    const standfirst = `${v.rows.length} ${label} in ${countryName}, in ${v.cities.size} cities. `
      + `${P.list(top.map((c) => c.name + ' (' + c.n + ')'))} hold ${topShare}% of them between them.`;

    const langLine = builtLangs.length
      ? `<ul class="svn-onward">
${builtLangs.map((l) => `          <li><a href="${l.url}">${esc(l.langName)}-speaking (${l.n})</a></li>`).join('\n')}
        </ul>`
      : '';

    const faq = [
      {
        q: `How many ${label} does this page cover in ${countryName}?`,
        a: `${v.rows.length}, across ${v.cities.size} cities. Each one is on a published list we link to.`,
      },
      {
        q: `Which city in ${countryName} has the most?`,
        a: `${top[0].name}, with ${top[0].n}. ${P.list(top.map((c) => c.name + ' (' + c.n + ')'))} together `
          + `hold ${topShare}% of what we list in the country.`,
      },
      {
        q: `Are these the only ${label} in ${countryName}?`,
        a: `No. These are the ones whose working language a published source states, which is a much `
          + `smaller set than the ones that exist. A city missing here is a gap in what has been `
          + `published, not evidence that nobody practises there.`,
      },
    ];

    let ti = 0;
    const blocks = `<section class="svn-block sf-group">
          <h2>Cities<span class="svn-n">${v.rows.length} in ${v.cities.size} cities</span></h2>
          <div class="sb-grid">
        ${cities.map((c) => B.cityTile({
    href: cityCatUrl(c.slug, cat),
    slug: c.slug,
    name: c.name,
    country: countryName,
    iso: M.cities[c.slug].iso,
    n: c.n,
    unit: c.n === 1 ? P.singular(cat) : label,
    index: ti++,
    eyebrow: 'Of all ' + label + ' in ' + countryName,
    trayInner: B.shareBar(c.n, v.rows.length),
  })).join('\n        ')}
          </div>
        </section>`;

    const h1 = `${cap(label)} in ${countryName}, city by city`;
    const titleOpts = [
      `${cap(label)} in ${countryName}: ${v.rows.length} in ${v.cities.size} cities`,
      `${cap(label)} in ${countryName}: ${v.rows.length} listed`,
      `${cap(label)} in ${countryName}`,
    ];
    const title = titleOpts.find((t) => t.length <= 60) || titleOpts[titleOpts.length - 1];
    const desc = META.band(
      `${v.rows.length} ${label} in ${countryName} across ${v.cities.size} cities, led by `
      + `${top.map((c) => c.name + ' (' + c.n + ')').join(', ')}.`,
      [
        'Every listing names the source it was read on, and the language it works in.',
        'Every listing names the source it was read on.',
        'Each one links to its source.',
      ],
    );

    const ld = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          ['Home', BASE + '/'],
          ['Services by language', BASE + '/services'],
          [countryName, BASE + '/services/' + cslug],
          [cap(label), BASE + url],
        ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: h1,
        url: BASE + url,
        inLanguage: 'en',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: cities.length,
          itemListElement: cities.map((c, i) => ({
            '@type': 'ListItem', position: i + 1,
            name: cap(label) + ' in ' + c.name,
            url: BASE + cityCatUrl(c.slug, cat),
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
      },
    ];

    const html = page({
      hero: heroFor(top[0].slug, top[0].name),
      url,
      title,
      desc,
      crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; <a href="/services/${cslug}">${esc(countryName)}</a> &rsaquo; ${esc(cap(label))}`,
      eyebrow: `${inlineIcon(CAT_ICON[cat])}${esc(cap(label))} in ${esc(countryName)}`,
      h1,
      standfirst,
      stats: [
        [v.rows.length.toLocaleString('en-US'), label],
        [v.cities.size, v.cities.size === 1 ? 'city' : 'cities'],
        [Object.keys(v.byLang).length, 'languages'],
      ],
      ld,
      filter: F.bar({
        id: 'svn',
        items: cities.length,
        fields: [{ key: 'q', search: true, label: 'City', placeholder: `Search ${cities.length} cities…` }],
      }) + '\n      ' + F.count({ id: 'svn', total: cities.length, noun: 'city', nounPlural: 'cities' }),
      blocks: blocks + '\n\n      ' + F.empty({
        id: 'svn',
        what: `This page lists every city in ${countryName} where we can point at a source for ${P.an(P.singular(cat))}.`,
      }),
      prose: `<div class="svn-prose">
        ${builtLangs.length ? `<h2>By language</h2>
        <p>${esc(`${builtLangs.length === 1 ? 'One language is' : builtLangs.length + ' languages are'} recorded often enough in ${countryName} to have a page of its own.`)}</p>
        ${langLine}` : ''}
        <h2>Where these came from</h2>
        <p>${esc(s.provenance)}</p>
        <p>${esc(s.claim)}</p>
        <h2>Questions</h2>
        <dl class="svn-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
        <ul class="svn-onward">
          <li><a href="/services/${cslug}">Every service in ${esc(countryName)}</a></li>
${HUBS.has(cat) ? `          <li><a href="/services/${M.SERVICE_SLUGS[cat]}">${esc(cap(label))} in every country</a></li>` : ''}
        </ul>
      </div>`,
    });

    const dir = path.join(ROOT, 'services', cslug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    shell.writePage('services/' + cslug + '/' + M.SERVICE_SLUGS[cat] + '.html', html);
    written.push({
      url, file: 'services/' + cslug + '/' + M.SERVICE_SLUGS[cat] + '.html',
      kind: 'country-service', country: cslug, service: cat,
      n: v.rows.length, cities: v.cities.size, indexable: true, title, h1,
    });
    builtCats.push({ cat, label, n: v.rows.length, cities: v.cities.size, url, langs: builtLangs });
  }

  // ---------- level 1: /services/<country> ---------------------------------------------------
  // Built last, and only where a child page exists: a hub whose every link points back out to city
  // pages is the /services index again filtered to one country, which is a page with nothing of
  // its own to say.
  // The only condition is that a child got built. It cannot have its own floor: Belgium holds 13
  // providers over 4 cities, its doctors page cleared the child floor of 10, and a hub floor of 15
  // then skipped the hub the breadcrumb on that page points at. A country with a qualifying child
  // always has enough, by arithmetic, so the child is the test.
  if (!builtCats.length) {
    if (co.rows.length >= HUB_MIN_ROWS) {
      skipped.push(cslug + ' (no service in it clears the floor, so the hub would link nothing)');
    }
    continue;
  }

  const url = '/services/' + cslug;
  const cats = builtCats.slice().sort((a, b) => b.n - a.n);
  const cityRows = [...co.cities].map((slug) => ({
    slug, name: M.cities[slug].name, n: co.rows.filter((r) => r.city === slug).length,
  })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const topCities = cityRows.slice(0, 3);
  const s = sourcing(co.rows, 'these listings');

  const standfirst = `${co.rows.length.toLocaleString('en-US')} providers in ${countryName}, across `
    + `${co.cities.size} cities and ${Object.keys(co.byCat).length} services. `
    + `${P.list(topCities.map((c) => c.name + ' (' + c.n + ')'))} hold the most.`;

  const faq = [
    {
      q: `What does this page cover?`,
      a: `Every provider we hold in ${countryName} whose working language a published source states: `
        + `${co.rows.length} of them, in ${co.cities.size} cities across ${Object.keys(co.byCat).length} services.`,
    },
    {
      q: `Which services have a page of their own?`,
      a: `${P.list(cats.map((c) => c.label + ' (' + c.n + ')'))}. A service gets its own page once it `
        + `reaches ${CAT_MIN_ROWS} providers in at least ${MIN_CITIES} cities, below which the city pages say it better.`,
    },
    {
      q: `Is this every provider in ${countryName}?`,
      a: `No, and it is not close. It is the set whose language is stated somewhere we can link to, `
        + `mostly consular and professional-body lists. Those lists are published for their own reasons `
        + `and cover the country unevenly.`,
    },
  ];

  let hi = 0;
  const blocks = `<section class="svn-block">
          <h2>Services<span class="svn-n">${cats.length}${cats.length === 1 ? ' with a page of its own' : ' with a page of their own'}</span></h2>
          <div class="sb-hubs">
        ${cats.map((c) => B.hub({
    href: c.url,
    icon: inlineIcon(CAT_ICON[c.cat]),
    name: cap(c.label),
    n: c.n,
    sub: 'in ' + c.cities + (c.cities === 1 ? ' city' : ' cities'),
  })).join('\n        ')}
          </div>
        </section>

        <section class="svn-block sf-group">
          <h2>Cities<span class="svn-n">${co.rows.length} in ${co.cities.size} cities</span></h2>
          <div class="sb-grid">
        ${cityRows.map((c) => B.cityTile({
    href: '/services/' + c.slug,
    slug: c.slug,
    name: c.name,
    country: countryName,
    iso: M.cities[c.slug].iso,
    n: c.n,
    unit: c.n === 1 ? 'provider' : 'providers',
    index: hi++,
    eyebrow: 'Of all providers in ' + countryName,
    trayInner: B.shareBar(c.n, co.rows.length),
  })).join('\n        ')}
          </div>
        </section>`;

  const h1 = `Services in ${countryName}, city by city`;
  const titleOpts = [
    `Services in ${countryName}: ${co.rows.length} in ${co.cities.size} cities`,
    `Services in ${countryName}: ${co.rows.length} listed`,
    `Services in ${countryName}`,
  ];
  const title = titleOpts.find((t) => t.length <= 60) || titleOpts[titleOpts.length - 1];
  const desc = META.band(
    `${co.rows.length} providers in ${countryName} across ${co.cities.size} cities and `
    + `${cats.length} services, led by ${topCities.map((c) => c.name).join(', ')}.`,
    [
      'Every listing names the language it works in and the source that states it.',
      'Every listing names the source it was read on.',
      'Each one links to its source.',
    ],
  );

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        ['Home', BASE + '/'],
        ['Services by language', BASE + '/services'],
        [countryName, BASE + url],
      ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      url: BASE + url,
      inLanguage: 'en',
      about: { '@type': 'Country', name: countryName },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: cats.length,
        itemListElement: cats.map((c, i) => ({
          '@type': 'ListItem', position: i + 1,
          name: cap(c.label) + ' in ' + countryName,
          url: BASE + c.url,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
    },
  ];

  const html = page({
    hero: heroFor(topCities[0].slug, topCities[0].name),
    url,
    title,
    desc,
    crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; ${esc(countryName)}`,
    eyebrow: `Services in ${esc(countryName)}`,
    h1,
    standfirst,
    stats: [
      [co.rows.length.toLocaleString('en-US'), 'providers'],
      [co.cities.size, co.cities.size === 1 ? 'city' : 'cities'],
      [cats.length, cats.length === 1 ? 'service page' : 'service pages'],
    ],
    ld,
    filter: F.bar({
      id: 'svn',
      items: cityRows.length,
      fields: [{ key: 'q', search: true, label: 'City', placeholder: `Search ${cityRows.length} cities…` }],
    }) + '\n      ' + F.count({ id: 'svn', total: cityRows.length, noun: 'city', nounPlural: 'cities' }),
    blocks: blocks + '\n\n      ' + F.empty({
      id: 'svn',
      what: `This page lists every city in ${countryName} where we hold a provider with a stated working language.`,
    }),
    prose: `<div class="svn-prose">
        <h2>Where these came from</h2>
        <p>${esc(s.provenance)}</p>
        <p>${esc(s.claim)}</p>
        <h2>Questions</h2>
        <dl class="svn-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
        <ul class="svn-onward">
          <li><a href="/services">The whole directory</a></li>
        </ul>
      </div>`,
  });

  shell.writePage('services/' + cslug + '.html', html);
  written.push({
    url, file: 'services/' + cslug + '.html', kind: 'country', country: cslug,
    n: co.rows.length, cities: co.cities.size, services: cats.length,
    indexable: true, title, h1,
  });
}

/**
 * A page that no longer qualifies has to go.
 *
 * Scoped to this manifest's own files: /services holds city pages, service hubs and language pages
 * written by five other generators, and a sweep that deleted anything it did not recognise would
 * take all of them.
 */
{
  const keep = new Set(written.map((w) => w.file));
  const prev = readManifest('service-country-pages.json');
  const removed = [];
  for (const p of prev) {
    if (keep.has(p.file)) continue;
    const abs = path.join(ROOT, p.file);
    if (fs.existsSync(abs)) { fs.unlinkSync(abs); removed.push(p.url); }
  }
  if (removed.length) console.log('  removed ' + removed.length + ' page(s) that no longer qualify: ' + removed.join(', '));
}

fs.writeFileSync(path.join(ROOT, 'data', 'service-country-pages.json'), JSON.stringify(written, null, 1) + '\n');

const byKind = (k) => written.filter((w) => w.kind === k);
console.log(`Wrote ${written.length} country pages: `
  + `${byKind('country').length} country, ${byKind('country-service').length} country+service, `
  + `${byKind('country-lang').length} country+service+language.`);
console.log('  biggest: ' + written.slice().sort((a, b) => b.n - a.n).slice(0, 6)
  .map((w) => w.url.replace('/services/', '') + ' (' + w.n + ')').join(', '));
if (skipped.length) console.log('  not built (' + skipped.length + '): ' + skipped.slice(0, 6).join('; '));

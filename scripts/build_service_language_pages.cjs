require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes services/languages/<language>.html, for example /services/languages/german.
 *
 * Language is the entire premise of this directory and it was the one axis with no landing page.
 * /services linked to cities and to service hubs; the service-and-language pages existed
 * (/services/doctors/german) but nothing pointed at them from the index, and a reader who arrives
 * knowing only "I need someone who speaks Portuguese" had nowhere to go. This is that page.
 *
 * It is a sibling of build_service_lang_pages.cjs, not a replacement. That one answers "German
 * doctors", this one answers "German, whatever I need". Different question, different answer, and
 * they cross-link: this page's job is to hand the reader to the service-and-language page if the
 * pair exists, and to the city otherwise.
 *
 * An index, not a third copy of the listings. It names cities, counts and services, and links to
 * the page that actually holds the providers. Reproducing the rows here is the duplicate content
 * the whole family split exists to avoid.
 *
 * A page is written only where the language reaches at least 20 providers in at least 10 cities
 * and covers no more than 60% of the directory's cities. That last gate is what keeps English out:
 * it sits in 318 of 329 cities, so its page would be /services with a different headline.
 *
 * Usage: node scripts/build_service_language_pages.cjs
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
// inlineIcon rather than icon(): same reason as /services, the shared sprite is a second request
// and these are the first thing on the page.
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const { CAT_ICON } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));


const esc = P.esc;
const MIN_ROWS = 20;
const MIN_CITIES = 10;
const MAX_CITY_SHARE = 0.60;

const langSlug = (code) => M.LANGS[code].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every provider row, indexed by the language it works in.
const rowsByLang = {};
const allCities = new Set();
M.DB.providers.forEach((r) => {
  if (!M.cities[r.city]) return;
  allCities.add(r.city);
  r.languages.forEach((l) => {
    if (!M.LANGS[l]) return;
    rowsByLang[l] = rowsByLang[l] || { rows: [], cities: new Set(), cats: new Set() };
    rowsByLang[l].rows.push(r);
    rowsByLang[l].cities.add(r.city);
    rowsByLang[l].cats.add(r.category);
  });
});
const TOTAL_CITIES = allCities.size;

// "languages" must not collide with a city or a service, or /services/languages/x becomes
// ambiguous with /services/<city>/<service>. Same guard the sibling builder runs on its own slugs.
if (M.cities.languages || Object.values(M.SERVICE_SLUGS).includes('languages')) {
  console.error('a city or service is slugged "languages"; pick another path for this family');
  process.exit(1);
}
{
  const slugs = Object.keys(rowsByLang).map(langSlug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) { console.error('two languages share a slug: ' + dupes.join(', ')); process.exit(1); }
}

// Which service-and-language pages exist, so this page links to the sharper answer where there is
// one rather than dropping everyone on a city page.
const PAIR_LANG = new Set();
{
  const f = path.join(ROOT, 'data', 'service-lang-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => PAIR_LANG.add(x.service + '|' + x.language));
}
const CITY_PAIRS = new Set();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => CITY_PAIRS.add(x.city + '|' + x.service));
}
// Three of the thirteen services have no hub page written, so linking a service card to
// /services/<slug> unconditionally pointed estate agents, mechanics and gyms at a 404. Where the
// hub does not exist the card goes to the index with the filter already applied, which is a real
// page showing the same set.
const HUBS = new Set();
{
  const f = path.join(ROOT, 'data', 'service-hub-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => HUBS.add(x.service));
}
const cityLink = (slug, cat) => (CITY_PAIRS.has(slug + '|' + cat)
  ? '/services/' + slug + '/' + M.SERVICE_SLUGS[cat]
  : '/services/' + slug);

const written = [];
const skipped = [];

for (const [lang, v] of Object.entries(rowsByLang)) {
  const share = v.cities.size / TOTAL_CITIES;
  if (v.rows.length < MIN_ROWS || v.cities.size < MIN_CITIES || share > MAX_CITY_SHARE) {
    if (v.rows.length >= MIN_ROWS) {
      skipped.push(langSlug(lang) + ' (' + v.cities.size + ' cities, share ' + share.toFixed(2) + ')');
    }
    continue;
  }

  const langName = P.langName(lang);
  const slug = langSlug(lang);
  const url = '/services/languages/' + slug;
  const file = 'services/languages/' + slug + '.html';

  // --- what this language covers -------------------------------------------------------------
  const cityRows = [...v.cities].map((s) => ({
    slug: s,
    name: M.cities[s].name,
    country: M.cities[s].country,
    n: v.rows.filter((r) => r.city === s).length,
    cats: [...new Set(v.rows.filter((r) => r.city === s).map((r) => r.category))],
  })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  const byCountry = {};
  cityRows.forEach((c) => { (byCountry[c.country] = byCountry[c.country] || []).push(c); });
  const countries = Object.keys(byCountry).sort((a, b) =>
    byCountry[b].reduce((s, x) => s + x.n, 0) - byCountry[a].reduce((s, x) => s + x.n, 0) || a.localeCompare(b));

  const catRows = [...v.cats].map((cat) => ({
    cat,
    label: P.catName(cat),
    n: v.rows.filter((r) => r.category === cat).length,
    cities: new Set(v.rows.filter((r) => r.category === cat).map((r) => r.city)).size,
    href: PAIR_LANG.has(cat + '|' + lang)
      ? '/services/' + M.SERVICE_SLUGS[cat] + '/' + slug
      : HUBS.has(cat)
        ? '/services/' + M.SERVICE_SLUGS[cat]
        : '/services?cat=' + encodeURIComponent(cat) + '&amp;lang=' + encodeURIComponent(lang),
  })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));

  // --- prose, computed from these rows --------------------------------------------------------
  const top = cityRows.slice(0, 3);
  const topShare = Math.round((top.reduce((s, c) => s + c.n, 0) / v.rows.length) * 100);
  const standfirst = `${v.rows.length} providers who work in ${langName}, across ${v.cities.size} cities in `
    + `${countries.length} ${countries.length === 1 ? 'country' : 'countries'} and `
    + `${catRows.length} ${catRows.length === 1 ? 'kind of service' : 'kinds of service'}. `
    + `${P.list(top.map((c) => c.name + ' (' + c.n + ')'))} hold ${topShare}% of them between them.`;

  const srcCounts = {};
  v.rows.forEach((r) => { const h = M.hostOf(r.sourceUrl); srcCounts[h] = (srcCounts[h] || 0) + 1; });
  const srcTop = Object.entries(srcCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([h, n]) => ({ n, ...P.publisherOf(h) }));
  const provenance = `These come from ${Object.keys(srcCounts).length} different `
    + `${Object.keys(srcCounts).length === 1 ? 'source' : 'sources'}, led by `
    + P.list(srcTop.map((s) => s.publisher + ' (' + s.n + ')')) + '. '
    + `Consular lists are the reason a language turns up far from where it is spoken: a mission `
    + `publishes the doctors and lawyers its own citizens can talk to, which is a language claim `
    + `someone else made in public and we can point at.`;

  const evCounts = {};
  v.rows.forEach((r) => { evCounts[r.evidence] = (evCounts[r.evidence] || 0) + 1; });
  const official = evCounts.official || 0;
  const claim = official === v.rows.length
    ? 'Every one of these sits on an official list, the strongest tier this directory carries.'
    : `${official} of the ${v.rows.length} sit on an official list. The rest rest on the provider `
      + `saying so, or on a directory that says it of its whole roster, which is a weaker claim and `
      + `is labelled as such on every card.`;

  const strongest = catRows[0];
  const thinnest = catRows[catRows.length - 1];
  const shape = catRows.length > 1
    ? `The coverage is not even across services: ${strongest.label} account for ${strongest.n} of the `
      + `${v.rows.length}, while ${thinnest.label} account for ${thinnest.n}. That reflects which `
      + `professions get published in language-tagged lists, not which ones exist.`
    : '';

  const faq = [
    {
      q: `How many ${langName}-speaking providers are listed?`,
      a: `${v.rows.length}, in ${v.cities.size} cities. That is the number whose working language we can trace to a published source, not an estimate of how many exist.`,
    },
    {
      q: `Where is ${langName} easiest to find?`,
      a: `${P.list(top.map((c) => c.name + ' with ' + c.n))}. Together that is ${topShare}% of this page.`,
    },
    {
      q: `Does a listing mean the provider speaks ${langName} personally?`,
      a: `Not always. Some sources name a practice whose staff include ${P.an(langName)} speaker rather than the named person, and each card quotes the wording its source used so you can judge it.`,
    },
  ];

  const h1 = `Find services in ${langName}`;
  const title = `${langName}-speaking services in ${v.cities.size} cities: ${v.rows.length} listed`;
  const desc = `${v.rows.length} doctors, dentists, lawyers and other providers who work in ${langName}, `
    + `across ${v.cities.size} cities, led by ${top.map((c) => c.name).join(', ')}. Every language claim names its source.`;

  // The same two shapes /services uses, so the page a reader clicks through from does not change
  // component vocabulary underneath them: the compact icon row for services, the photographed tile
  // for cities.
  const serviceBlock = `<div class="sb-hubs">
        ${catRows.map((c) => B.hub({
    href: c.href,
    icon: inlineIcon(CAT_ICON[c.cat]),
    name: P.catName(c.cat).replace(/^./, (x) => x.toUpperCase()),
    n: c.n.toLocaleString('en-US'),
    sub: c.cities.toLocaleString('en-US') + ' ' + (c.cities === 1 ? 'city' : 'cities'),
  })).join('\n        ')}
      </div>`;

  // Tile order across the whole page, not within a country, so the eager photographs are the ones
  // a reader actually reaches first.
  let tileIndex = 0;
  const countryBlocks = countries.map((country) => `<section class="svg-country sf-group">
          <h3>${esc(country)}<span class="svg-n">${byCountry[country].reduce((s, x) => s + x.n, 0)} in ${byCountry[country].length} ${byCountry[country].length === 1 ? 'city' : 'cities'}</span></h3>
          <div class="sb-grid">
        ${byCountry[country].map((c) => B.cityTile({
    href: cityLink(c.slug, c.cats[0]),
    slug: c.slug,
    name: c.name,
    country: c.country,
    iso: M.cities[c.slug].iso,
    n: c.n,
    unit: langName,
    index: tileIndex++,
    eyebrow: 'Services here',
    trayInner: B.tagChips(c.cats.map((x) => P.catName(x).replace(/^./, (y) => y.toUpperCase())), 3),
    data: { cats: c.cats },
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
          name: langName + '-speaking services in ' + c.name,
          url: BASE + cityLink(c.slug, c.cats[0]),
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
    .svg-page { padding-top: var(--space-8); padding-bottom: var(--space-10); }
    .svg-sec { margin: 0 0 var(--space-12); }
    .svg-sec > h2 { font-family: 'DM Serif Display', serif; font-size: 1.45rem; margin: 0 0 .35rem; }
    .svg-lede { max-width: 68ch; color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-6); }
    .svg-country { margin: 0 0 var(--space-10); }
    .svg-country h3 { display: flex; align-items: baseline; gap: .6rem; font-family: 'DM Serif Display', serif; font-size: 1.2rem;
      margin: 0 0 var(--space-5); padding-bottom: .5rem; border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svg-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-xs); font-weight: 700;
      letter-spacing: .04em; text-transform: uppercase; color: var(--color-stone); }
${B.css}
${F.css}
    .sb-note { font-size: .82rem; color: var(--color-charcoal, #334155); line-height: 1.5; }
    .svg-prose { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svg-prose h2 { font-family: 'DM Serif Display', serif; font-size: 1.35rem; margin: var(--space-8) 0 var(--space-5); }
    .svg-prose p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
    .svg-faq { margin: 0 0 var(--space-5); }
    .svg-faq dt { font-weight: 700; color: var(--color-ink); margin: var(--space-4) 0 .3rem; }
    .svg-faq dd { margin: 0; color: var(--color-charcoal); line-height: 1.7; }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main id="main-content">
    ${H.hero({
    crumbs: `<a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; ${esc(langName)}`,
    eyebrow: `${esc(langName)}`,
    h1,
    sub: standfirst,
    stats: [
      [v.rows.length.toLocaleString('en-US'), 'providers'],
      [v.cities.size, v.cities.size === 1 ? 'city' : 'cities'],
      [catRows.length, catRows.length === 1 ? 'service' : 'services'],
    ],
    image: H.sectionImage(),
    size: 'full',
  })}
    <div class="svg-page container">

      <section class="svg-sec">
        <h2>By service</h2>
        <p class="svg-lede">What you can actually get in ${esc(langName)}, biggest first. Where a service has enough ${esc(langName)} speakers to be worth its own page, the card goes there.</p>
        ${serviceBlock}
      </section>

      <section class="svg-sec">
        <h2>By city</h2>
        <p class="svg-lede">Every city with at least one provider who works in ${esc(langName)}, grouped by country.</p>
        ${F.bar({
    id: 'svg',
    items: cityRows.length,
    fields: [
      { key: 'q', search: true, label: 'City or country', placeholder: 'Type a city or country…' },
      { key: 'cats', label: 'Service', any: 'Any service', options: catRows.map((c) => [c.cat, P.catName(c.cat).replace(/^./, (x) => x.toUpperCase())]) },
      { key: 'country', label: 'Country', any: 'Any country', options: countries.map((c) => [B.slugify(c), c]) },
    ],
  })}
        ${F.count({ id: 'svg', total: cityRows.length, noun: 'city', nounPlural: 'cities' })}
        ${countryBlocks}
        ${F.empty({ id: 'svg', what: `This page lists every city where a published source says a provider works in ${langName}.` })}
      </section>

      <div class="svg-prose">
        <h2>Where these came from</h2>
        <p>${esc(provenance)}</p>
        <p>${esc(claim)}</p>
        ${shape ? `<h2>What this page is not</h2>\n        <p>${esc(shape)}</p>` : ''}
        <h2>Questions</h2>
        <dl class="svg-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
        <p><a href="/services">All ${TOTAL_CITIES} cities in the directory</a>, in every language we cover.</p>
      </div>
    </div>
  </main>
  ${B.revealJs}
  ${F.js({ id: 'svg', noun: 'city', nounPlural: 'cities' })}
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;

  shell.assertComplete(html, url);
  const dir = path.join(ROOT, 'services', 'languages');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), html);
  written.push({
    url, file, kind: 'language', language: lang, label: langName,
    n: v.rows.length, cities: v.cities.size, services: catRows.length, indexable: true, title, h1,
  });
}

// A language that drops below the bar has to lose its page, not keep a stale one nothing links to.
{
  const keep = new Set(written.map((w) => w.file));
  const dir = path.join(ROOT, 'services', 'languages');
  const removed = [];
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).filter((f) => f.endsWith('.html')).forEach((f) => {
      const rel = 'services/languages/' + f;
      if (!keep.has(rel)) { fs.unlinkSync(path.join(dir, f)); removed.push(rel); }
    });
  }
  if (removed.length) console.log('  removed ' + removed.length + ' page(s) that no longer qualify: ' + removed.join(', '));
}

written.sort((a, b) => b.cities - a.cities || b.n - a.n);
fs.writeFileSync(path.join(ROOT, 'data', 'service-language-pages.json'), JSON.stringify(written, null, 1) + '\n');
console.log(`Wrote ${written.length} language pages: `
  + written.map((w) => w.label + ' (' + w.n + ' in ' + w.cities + ')').join(', '));
if (skipped.length) console.log('  not built, too few cities or too close to the whole directory: ' + skipped.join(', '));

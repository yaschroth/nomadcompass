require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes services/<city>/<service>.html: one page per city and service.
 *
 * Why this family exists: the service and language choice used to live in a query string, and Google
 * does not index query-parameter variants. Every one of the 540 combinations we hold was invisible
 * to search, on a directory whose whole premise is "an English-speaking dentist in Lisbon". A URL
 * per question is the only thing that ranks, and it also removes the JavaScript state that made the
 * heading, the counts and the filter disagree with each other.
 *
 * Not every combination gets a URL. A child page is written only where the city holds more than one
 * service: in the 157 cities that hold exactly one, the child would list the same providers as its
 * parent, which is the duplicate problem we are leaving, arriving through a different door. And a
 * page that cannot reach the word floor is not written at all: its providers stay on the city page.
 * That is deliberate, and it is not a noindex tier. Nothing thin exists, and nothing that exists is
 * hidden.
 *
 * Run scripts/build_services.cjs first (this lifts its shell), then the sweeps, then the sitemap.
 * Usage: node scripts/build_service_pair_pages.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const P = require(path.join(ROOT, 'scripts', 'lib', 'service_prose.cjs'));
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const { CAT_ICON } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const esc = P.esc;
const WORD_FLOOR = 220;

// schema.org has a type for most of these. Where it does not, the ListItem carries a name and no
// type rather than a wrong one.
const SCHEMA_TYPE = {
  doctor: 'Physician', dentist: 'Dentist', vet: 'VeterinaryCare', therapy: 'MedicalBusiness',
  physio: 'Physiotherapy', optician: 'Optician', hair: 'HairSalon', legal: 'Attorney',
  tax: 'AccountingService', realestate: 'RealEstateAgent', mechanic: 'AutoRepair',
  fitness: 'ExerciseGym', translator: 'ProfessionalService',
};
const HEALTH = new Set(['doctor', 'dentist', 'vet', 'therapy', 'physio', 'optician']);
const MONEY = new Set(['legal', 'tax']);

// Meta titles come from a pool, not a template, and every skeleton must carry at least two
// page-specific tokens. The old family had 41 title patterns across 287 pages with the title equal
// to the h1, which is what a near-duplicate looks like to a search engine.
// Two pools, because a title that claims one language for a page serving five is the same failure
// as a heading that does. Google showed "English-speaking doctors in Barcelona" for the page that
// holds eleven German-speaking ones, so a reader looking for German had no reason to click.
const SKELETONS_ONE_LANGUAGE = [
  (t) => `${t.n} ${t.lang1}-speaking ${t.service} in ${t.city}`,
  (t) => `${t.n} ${t.lang1}-speaking ${t.service} in ${t.city}, each with its source`,
  (t) => `${t.lang1}-speaking ${t.service} in ${t.city}, ${t.n} listed and checked ${t.month}`,
  (t) => `Where to find a ${t.lang1}-speaking ${t.singular} in ${t.city}: ${t.n} listed`,
  (t) => `${t.n} ${t.service} in ${t.city} who work in ${t.lang1}, with a source for each`,
  (t) => `${t.lang1}-speaking ${t.service} in ${t.city}: ${t.n} names and where they came from`,
  (t) => `${t.Service} in ${t.city} for ${t.lang1} speakers, ${t.n} with a cited source`,
];
// Every one of these names at least two languages, and three where the page has them. A title that
// says only "34 doctors in Barcelona, sorted by the language they work in" is what a searcher for
// German-speaking doctors sees in the result list, and it gives them no reason to click on the page
// that holds eleven of them. The title is the door; the door has to say what is behind it.
const SKELETONS_MANY_LANGUAGES = [
  (t) => `${t.n} ${t.langList}-speaking ${t.service} in ${t.city}`,
  (t) => `${t.langList}-speaking ${t.service} in ${t.city}: ${t.n} listed`,
  (t) => `${t.Service} in ${t.city} who work in ${t.langList}: ${t.n} listed`,
  (t) => `${t.n} ${t.service} in ${t.city}: ${t.langList}, each with its source`,
  (t) => `${t.langList}-speaking ${t.service} in ${t.city}, ${t.n} listed`,
  (t) => `${t.Service} in ${t.city} for ${t.langList} speakers, ${t.n} with sources`,
  (t) => `${t.n} ${t.service} in ${t.city} working in ${t.langList}, checked ${t.month}`,
  (t) => `${t.Service} in ${t.city}: ${t.langList}, ${t.n} names and their sources`,
];

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const crumbs = (city, cat) => [
  ['Home', BASE + '/'],
  ['Services by language', BASE + '/services'],
  [M.cities[city].name, BASE + '/services/' + city],
  [P.catName(cat).replace(/^./, (c) => c.toUpperCase()), BASE + '/services/' + city + '/' + M.SERVICE_SLUGS[cat]],
];

function langSections(pair) {
  // Sections per language only where there is a real second language. Everywhere else a single list
  // reads better, and in 484 of 540 pairs one language covers nine rows in ten.
  const langs = pair.nonLocal.filter(([, n]) => n >= 2);
  if (langs.length < 2) return null;
  const sections = langs.map(([l, n]) => ({
    lang: l,
    n,
    rows: pair.rows.filter((r) => r.languages.includes(l)),
  }));
  // Anyone whose only recorded language is the local one belongs to no section and used to vanish
  // from the page: five pages were rendering fewer cards than they held providers, which the gate
  // caught. A listing that silently drops a row is worse than an ugly one.
  const shown = new Set(sections.flatMap((s) => s.rows));
  const rest = pair.rows.filter((r) => !shown.has(r));
  if (rest.length) sections.push({ lang: null, n: rest.length, rows: rest });
  return sections;
}

// Which pairs will actually be written. Worked out before anything is rendered, because a page
// links to its siblings and to the same service nearby, and both were pointing at pages that were
// never written: 172 dead links, to single-service cities that get no child at all and to pairs the
// word floor held back. A link to a page we chose not to create is our mistake, not the reader's.
function proseWordsOf(pair) {
  const blocks = [P.standfirst(pair), P.provenance(pair), P.claimScope(pair), P.geography(pair), P.alternatives(pair)];
  const faq = P.faq(pair);
  const boiler = P.BOILERPLATE.reduce((a, b) => a + (blocks.join(' ').includes(b) ? P.words(b) : 0), 0);
  return blocks.reduce((a, t) => a + P.words(t), 0)
    + faq.reduce((a, q) => a + P.words(q.q) + P.words(q.a), 0)
    - boiler
    + pair.rows.reduce((a, r) => a + P.words(r.note), 0);
}
const WILL_EXIST = new Set(
  M.pageList()
    .filter((p) => p.kind === 'pair' && proseWordsOf(M.pairOf(p.city, p.category)) >= WORD_FLOOR)
    .map((p) => p.city + '|' + p.category),
);
// The service hubs below five cities were held back too, so the "all cities" link has to know.
const HUBS = new Set();
{
  const f = path.join(ROOT, 'data', 'service-hub-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => HUBS.add(x.service));
}
const linkTo = (slug, category) => (WILL_EXIST.has(slug + '|' + category)
  ? '/services/' + slug + '/' + M.SERVICE_SLUGS[category]
  : '/services/' + slug);

// The service-and-language pages, so a language section can point at the same language elsewhere.
const LANG_PAGES = new Map();
{
  const f = path.join(ROOT, 'data', 'service-lang-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => LANG_PAGES.set(x.service + '|' + x.language, x));
}

const written = [];
const held = [];
const usedTitles = new Set();

for (const page of M.pageList().filter((p) => p.kind === 'pair')) {
  const pair = M.pairOf(page.city, page.category);
  const city = M.cities[page.city];
  const cat = page.category;
  const langCodes = M.headlineLanguages(pair.rows, pair.country, 2);
  const langs = langCodes.map(P.langName);

  // --- the prose ------------------------------------------------------------------------------
  const blocks = {
    standfirst: P.standfirst(pair),
    provenance: P.provenance(pair),
    claim: P.claimScope(pair),
    geography: P.geography(pair),
    alternatives: P.alternatives(pair),
  };
  const faq = P.faq(pair);
  // Declared boilerplate does not count towards the floor: a page must earn its own words.
  const uniqueWords = proseWordsOf(pair);
  if (uniqueWords < WORD_FLOOR) {
    held.push({ url: page.url, n: pair.n, words: uniqueWords });
    continue;
  }

  // --- titles ---------------------------------------------------------------------------------
  // The heading names every language the page can actually serve, not the top two. Naming a subset
  // is what turned a reader searching for German-speaking doctors in Barcelona away from the page
  // that holds eleven of them, because the heading said "English and French-speaking doctors".
  const servable = pair.nonLocal.filter(([, n]) => n >= 2);
  // Five, not four. No page in the family serves more than five languages and only three serve
  // five, so at this cap "and 1 more language" never has to be written and no language is left
  // unnamed in a heading. The fallback stays for the day the data grows past it.
  const named = servable.slice(0, 5).map(([l]) => P.langName(l));
  const spare = servable.length - named.length;
  const h1 = servable.length <= 1
    ? `${P.list(langs)}-speaking ${P.catName(cat)} in ${city.name}`
    : `${P.catName(cat).replace(/^./, (x) => x.toUpperCase())} in ${city.name} who work in ` +
      (spare > 0
        ? `${named.join(', ')} and ${spare} more ${spare === 1 ? 'language' : 'languages'}`
        : P.list(named));
  const topArea = Object.entries(pair.areas).sort((a, b) => b[1] - a[1])[0];
  const tokens = {
    n: pair.n,
    city: city.name,
    service: P.catName(cat),
    Service: P.catName(cat).replace(/^./, (c) => c.toUpperCase()),
    singular: P.singular(cat),
    lang1: langs[0],
    lang2: langs[1] || '',
    month: P.niceDate(pair.checked[pair.checked.length - 1]).replace(/^\d+ /, ''),
    publisher: P.publisherOf(pair.sources[0].host).short,
    postcode: topArea ? topArea[0] : '',
    lang3: servable[2] ? P.langName(servable[2][0]) : '',
    // The three biggest, which is as many as a title can carry. Everything else the page serves
    // goes into the description, so no language is invisible in a search result.
    langList: P.list(servable.slice(0, 3).map(([l]) => P.langName(l))),
    langCount: servable.length,
  };
  const pool = servable.length <= 1 ? SKELETONS_ONE_LANGUAGE : SKELETONS_MANY_LANGUAGES;
  // A title Google truncates at 60 characters is a title whose last words never appear in a result,
  // and 288 of these ran past 75. Candidates are generated, then the shortest one that still fits is
  // preferred, with the hash only choosing between those that fit so the family keeps its variety.
  const candidates = pool
    .map((fn, k) => ({ text: fn(tokens), k }))
    .filter((c) => c.text !== h1 && !usedTitles.has(c.text));
  const BUDGET = 60;
  const fits = candidates.filter((c) => c.text.length <= BUDGET);
  let title;
  if (fits.length) title = fits[hash(page.url) % fits.length].text;
  else if (candidates.length) title = candidates.slice().sort((a, b) => a.text.length - b.text.length)[0].text;
  else title = `${h1}, ${pair.n} listed`;
  usedTitles.add(title);

  // The other half of the search result, and it was still naming the headline two languages. Every
  // language the page can serve is named here, with its count, even where the title had no room.
  const descLangs = servable.length
    ? P.list(servable.slice(0, 6).map(([l, n]) => P.langName(l) + ' (' + n + ')'))
    : P.list(langs);
  const desc = `${pair.n} ${P.catName(cat)} in ${city.name} who work in ${descLangs}` +
    (topArea && Object.keys(pair.areas).length > 1 ? `, across ${Object.keys(pair.areas).length} postcodes` : '') +
    `. Every language claim names the source it came from.`;

  // --- listing --------------------------------------------------------------------------------
  const icon = inlineIcon(CAT_ICON[cat]);
  const sections = langSections(pair);
  const listing = sections
    ? sections.map((s) => `<section class="svp-lang" id="lang-${s.lang || 'other'}">
          <h2>${s.lang
            ? esc(P.langName(s.lang)) + '-speaking ' + esc(P.catName(cat)) + ' in ' + esc(city.name)
            : 'Listed only in ' + esc(P.langName(M.LOCAL[pair.country]) || 'the local language')}<span class="svp-lang-n">${s.n}</span></h2>
          <div class="sv-grid">
        ${s.rows.map((r) => P.card(r, { icon, showCategory: false })).join('\n        ')}
          </div>
          ${(() => {
    // The same language elsewhere. Without this the fifteen service-and-language pages have one
    // inbound link each, from their hub, and a page nothing points at is a page we do not publish.
    const lp = s.lang ? LANG_PAGES.get(cat + '|' + s.lang) : null;
    if (!lp || lp.cities < 2) return '';
    const others = lp.cities - 1;
    return `<p class="svp-more-lang"><a href="${lp.url}">${esc(P.langName(s.lang))}-speaking ${esc(P.catName(cat))} in ${others} other ${others === 1 ? 'city' : 'cities'} &rarr;</a></p>`;
  })()}
        </section>`).join('\n        ')
    : `<div class="sv-grid">
        ${pair.rows.map((r) => P.card(r, { icon, showCategory: false })).join('\n        ')}
        </div>`;

  // --- linking --------------------------------------------------------------------------------
  const siblings = city.services.filter((c) => c !== cat).slice(0, 9);
  const siblingChips = siblings.map((c) => `<a class="svp-chip" href="${linkTo(city.id, c)}">${esc(P.catName(c).replace(/^./, (x) => x.toUpperCase()))}<span>${M.pairOf(city.id, c).n}</span></a>`).join('');
  const near = M.nearest(city.id, cat, 6);
  const nearChips = near.map((x) => `<a class="svp-chip" href="${linkTo(x.city, cat)}">${esc(x.name)}<span>${x.n}</span></a>`).join('');

  // --- structured data ------------------------------------------------------------------------
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs(city.id, cat).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      url: BASE + page.url,
      dateModified: pair.checked[pair.checked.length - 1] || undefined,
      spatialCoverage: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'Country', name: city.country } },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: pair.n,
        itemListElement: pair.rows.map((r, i) => {
          const item = { '@type': 'ListItem', position: i + 1, name: r.name };
          // A typed node only where the provider has a site of its own. Without one there is no
          // entity to point at, and inventing an address or a phone number is not on.
          if (r.url && SCHEMA_TYPE[cat]) {
            item.item = {
              '@type': SCHEMA_TYPE[cat],
              name: r.name,
              url: r.url,
              knowsLanguage: r.languages,
              address: r.area ? { '@type': 'PostalAddress', addressLocality: city.name, addressCountry: city.country } : undefined,
            };
          }
          return item;
        }),
      },
    },
  ];
  if (faq.length >= 2) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
    });
  }

  const ymyl = HEALTH.has(cat)
    ? '<p class="ymyl-note">This is a directory, not medical advice. A language claim says nothing about clinical quality, and in an emergency use the local emergency number rather than this page.</p>'
    : MONEY.has(cat)
      ? '<p class="ymyl-note">This is a directory, not legal or financial advice. Being listed here says nothing about the quality or the price of the work, and we take no fee from anyone on this page.</p>'
      : '';

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
    .svp-page { padding: calc(var(--nav-height,64px) + var(--space-6)) 0 var(--space-10); }
    .svp-crumbs { font-size: var(--text-sm); color: var(--color-stone); margin: 0 0 var(--space-4); }
    .svp-crumbs a { color: var(--color-stone); }
    .svp-head { max-width: 64ch; margin: 0 0 var(--space-6); }
    .svp-head h1 { font-family: 'DM Serif Display', serif; font-size: clamp(1.9rem, 4vw, 2.9rem); line-height: 1.12; margin: 0 0 var(--space-3); text-wrap: balance; }
    .svp-stand { font-size: var(--text-lg); color: var(--color-charcoal); line-height: 1.6; margin: 0; }
    .svp-more-lang { margin: var(--space-3) 0 0; font-size: var(--text-sm); font-weight: 600; }
    .svp-langbar { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0 0 var(--space-6); }
    .svp-lang { margin: 0 0 var(--space-8); scroll-margin-top: calc(var(--nav-height,64px) + 1rem); }
    .svp-lang h2 { display: flex; align-items: center; gap: .6rem; font-family: 'DM Serif Display', serif; font-size: 1.45rem;
      margin: 0 0 var(--space-4); padding-bottom: .6rem; border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svp-lang-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-sm); font-weight: 700; color: var(--color-stone); }
    .svp-prose { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svp-prose h2 { font-family: 'DM Serif Display', serif; font-size: 1.35rem; margin: var(--space-6) 0 var(--space-3); }
    .svp-prose p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
    .svp-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin: var(--space-4) 0 var(--space-6); }
    a.svp-chip:not(.btn):not(.nav-link) { display: inline-flex; align-items: center; gap: .45rem; font-size: var(--text-sm); font-weight: 600;
      color: var(--color-ink); background: #fff; border: 1px solid var(--color-sand-dark, #e3d9c6);
      border-radius: var(--radius-md, 8px); padding: .4rem .7rem; text-decoration: none; }
    .svp-chip:hover { border-color: var(--color-terracotta, #c65d3b); }
    .svp-chip span { font-size: var(--text-xs); color: var(--color-stone); }
    .svp-faq dt { font-weight: 700; color: var(--color-ink); margin: var(--space-4) 0 .3rem; }
    .svp-faq dd { margin: 0; color: var(--color-charcoal); line-height: 1.7; }
    .ymyl-note { font-size: var(--text-sm); color: var(--color-stone); border-left: 3px solid var(--color-sand-dark, #e3d9c6); padding-left: .9rem; margin: var(--space-5) 0; }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main class="svp-page" id="main-content">
    <div class="container">
      <p class="svp-crumbs"><a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; <a href="/services/${city.id}">${esc(city.name)}</a> &rsaquo; ${esc(P.catName(cat))}</p>
      <header class="svp-head">
        <h1>${esc(h1)}</h1>
        <p class="svp-stand">${esc(blocks.standfirst)}${sections ? ' Each language has its own list below, so anyone who works in two appears in both.' : ''}</p>
      </header>
      ${sections ? `<nav class="svp-langbar" aria-label="Languages on this page">` +
        sections.map((sec) => `<a class="svp-chip" href="#lang-${sec.lang || 'other'}">${esc(sec.lang ? P.langName(sec.lang) : 'Local language only')}<span>${sec.n}</span></a>`).join('') +
        `</nav>` : ''}
      ${ymyl}

      ${listing}

      <div class="svp-prose">
        <h2>Where these came from</h2>
        <p>${esc(blocks.provenance)}</p>
        <p>${esc(blocks.claim)}</p>
        ${blocks.geography ? `<h2>Where in ${esc(city.name)}</h2>\n        <p>${esc(blocks.geography)}</p>` : ''}
        <h2>If none of these fits</h2>
        <p>${esc(blocks.alternatives)}</p>
        ${siblingChips ? `<h2>Other services in ${esc(city.name)}</h2>\n        <div class="svp-chips">${siblingChips}</div>` : ''}
        ${nearChips ? `<h2>${esc(P.catName(cat).replace(/^./, (x) => x.toUpperCase()))} in nearby cities</h2>\n        <div class="svp-chips">${nearChips}</div>\n        <p>${HUBS.has(cat) ? `<a href="/services/${M.SERVICE_SLUGS[cat]}">All ${M.services[cat].cities.length} cities where we list ${esc(P.catName(cat))}</a> or ` : ''}<a href="/services/${city.id}">everything we list in ${esc(city.name)}</a>.</p>` : ''}
        <h2>Questions</h2>
        <dl class="svp-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
      </div>
    </div>
  </main>
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;

  shell.assertComplete(html, page.url);
  const dir = path.join(ROOT, 'services', city.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(ROOT, page.file), html);
  written.push({ url: page.url, file: page.file, kind: 'pair', city: city.id, service: cat, n: pair.n, words: uniqueWords, title, h1, indexable: true });
}

fs.writeFileSync(path.join(ROOT, 'data', 'service-pair-pages.json'), JSON.stringify(written, null, 1) + '\n');
console.log(`Wrote ${written.length} city-and-service pages into services/<city>/.`);
if (held.length) {
  console.log(`  held on the parent, under the ${WORD_FLOOR}-word floor: ${held.length} (${held.slice(0, 4).map((h) => h.url + ' ' + h.words + 'w').join(', ')})`);
}
const w = written.map((x) => x.words).sort((a, b) => a - b);
if (w.length) console.log(`  words per page: min ${w[0]}, median ${w[Math.floor(w.length / 2)]}, max ${w[w.length - 1]}`);

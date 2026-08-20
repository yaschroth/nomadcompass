require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes services/<city>/<service>/<language>.html, for example
 * /services/paris/lawyers/german.
 *
 * This family exists because of a measurement, not a hunch. The city-and-service page lists its
 * providers in one section per language and shows twenty of each, which was honest but thin: 42
 * language sections held more than twenty, 2,395 providers in all, and the only way to see the rest
 * was to go to the source. Paris holds 97 German-speaking lawyers and showed 20. Raising the cap is
 * not the answer either, because a card costs about 2KB and 208 of them is half a megabyte on a
 * phone.
 *
 * So the overflow gets a URL of its own, which is also the URL somebody types: "German-speaking
 * lawyers in Paris" is a question, and a question deserves a page rather than a fragment of one.
 *
 * A page is written only where all four hold:
 *   - the language is not the local one, and at least MIN_ROWS providers work in it
 *   - it covers no more than MAX_SHARE of the pair, or the page would be its parent with a
 *     different title. Athens is the case that matters: 91 of its 95 doctors speak English, and a
 *     page for those 91 would be the doctors page again. Its parent handles that by dropping the
 *     sections instead.
 *   - the parent city-and-service page exists, so this page has somewhere to sit
 *   - the language is one this directory names
 *
 * Usage: node scripts/build_service_city_lang_pages.cjs
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
const MIN_ROWS = 21;
const MAX_SHARE = 0.70;
// A card costs about 2KB. 120 of them plus the shell is roughly 300KB, which is as much as a page
// on a phone should ever weigh. Only two of these pages reach it, and both say so on the page.
const CARD_BUDGET = 120;

const SCHEMA_TYPE = {
  doctor: 'Physician', dentist: 'Dentist', vet: 'VeterinaryCare', physio: 'MedicalBusiness',
  therapy: 'MedicalBusiness', legal: 'Attorney', tax: 'AccountingService', realestate: 'RealEstateAgent',
  hair: 'HairSalon', gym: 'ExerciseGym', mechanic: 'AutoRepair', optician: 'Optician',
};
const HEALTH = new Set(['doctor', 'dentist', 'vet', 'physio', 'therapy', 'optician']);
const MONEY = new Set(['legal', 'tax', 'realestate']);

const langSlug = (code) => M.LANGS[code].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The parents. Without one, this page would be three levels deep under nothing.
const PAIRS = new Map();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => PAIRS.set(x.city + '|' + x.service, x));
}
// The service-and-language pages, for the sideways link: the same language, the same service,
// everywhere else.
const LANG_PAGES = new Map();
{
  const f = path.join(ROOT, 'data', 'service-lang-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => LANG_PAGES.set(x.service + '|' + x.language, x));
}

/**
 * Which pages this run will write, decided before anything is rendered.
 *
 * A page links to the same language in nearby cities, and it was working that out from the rules
 * rather than from the outcome. When a pair page is held back on one pass and written on the next,
 * the child that depends on it is never built, while another city's page has already linked to it:
 * /services/vienna/lawyers/german was linked once and did not exist. Deciding first is how the pair
 * generator avoids the same thing.
 */
const WILL_EXIST = (() => {
  const out = new Set();
  Object.values(M.pairs).forEach((pair) => {
    if (!PAIRS.get(pair.city + '|' + pair.category)) return;
    const local = M.LOCAL[M.cities[pair.city].country];
    pair.nonLocal.forEach(([lang, count]) => {
      if (lang === local || !M.LANGS[lang]) return;
      if (count < MIN_ROWS || count / pair.n > MAX_SHARE) return;
      out.add(pair.city + '|' + pair.category + '|' + lang);
    });
  });
  return out;
})();

const written = [];
const skipped = [];
const usedTitles = new Set();

for (const pair of Object.values(M.pairs)) {
  const parent = PAIRS.get(pair.city + '|' + pair.category);
  if (!parent) continue;
  const city = M.cities[pair.city];
  const cat = pair.category;
  const local = M.LOCAL[city.country];

  for (const [lang, count] of pair.nonLocal) {
    if (lang === local || !M.LANGS[lang]) continue;
    if (count < MIN_ROWS) continue;
    const share = count / pair.n;
    if (share > MAX_SHARE) { skipped.push(`${pair.city}/${cat}/${langSlug(lang)} covers ${Math.round(share * 100)}% of the parent`); continue; }

    const rows = pair.rows.filter((r) => r.languages.includes(lang));
    const langName = P.langName(lang);
    const url = `/services/${city.id}/${M.SERVICE_SLUGS[cat]}/${langSlug(lang)}`;
    const file = `services/${city.id}/${M.SERVICE_SLUGS[cat]}/${langSlug(lang)}.html`;

    // --- what this page can say that its parent cannot ------------------------------------------
    const srcCounts = {};
    rows.forEach((r) => { const h = M.hostOf(r.sourceUrl); srcCounts[h] = (srcCounts[h] || 0) + 1; });
    const srcTop = Object.entries(srcCounts).sort((a, b) => b[1] - a[1])
      // publisherOf returns { publisher, short, kind }: there is no .name on it, and reading one
      // put the word undefined in the description of every page.
      .map(([h, n]) => ({ n, ...P.publisherOf(h) }));
    const areas = {};
    rows.forEach((r) => { const d = M.districtOf(r.area); if (d) areas[d] = (areas[d] || 0) + 1; });
    const areaList = Object.entries(areas).sort((a, b) => b[1] - a[1]);
    const withSite = rows.filter((r) => r.url).length;
    const checked = rows.map((r) => r.checked).filter(Boolean).sort();
    const alsoLangs = pair.nonLocal.filter(([l]) => l !== lang && l !== local);
    // Who on this page speaks something else as well, which is the question a reader has next.
    const alsoCount = {};
    rows.forEach((r) => r.languages.forEach((l) => { if (l !== lang && l !== local) alsoCount[l] = (alsoCount[l] || 0) + 1; }));
    const alsoTop = Object.entries(alsoCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const standfirst = `${rows.length} ${P.catName(cat)} in ${city.name} whose ${langName} is stated by the source that lists them, ` +
      `out of ${pair.n} we hold for ${city.name} in all. ` +
      (alsoTop.length
        ? `${alsoTop[0][1]} of them also work in ${P.langName(alsoTop[0][0])}${alsoTop[1] ? ' and ' + alsoTop[1][1] + ' in ' + P.langName(alsoTop[1][0]) : ''}.`
        : `None of them is recorded as working in a second non-local language.`);

    const provenance = srcTop.length === 1
      ? `All ${rows.length} come from one source, ${srcTop[0].publisher}, and every card links to it.`
      : `These come from ${srcTop.length} sources. ${P.list(srcTop.slice(0, 3).map((s) => s.publisher + ' (' + s.n + ')'))}` +
        `${srcTop.length > 3 ? ` and ${srcTop.length - 3} more` : ''} between them, and every card links to the one it came from.`;

    const claim = `Every row here carries a ${langName} claim from its source: ` +
      `${rows.filter((r) => r.evidence === 'official').length} of ${rows.length} from an official list, ` +
      `${rows.filter((r) => r.evidence === 'self-declared').length} self-declared and ` +
      `${rows.filter((r) => r.evidence === 'directory').length} from a directory. ` +
      `A language claim is not a claim about quality, and none of it is a recommendation.`;

    const geography = areaList.length > 1
      ? `They sit across ${areaList.length} postcodes, ${P.list(areaList.slice(0, 3).map(([d, n]) => d + ' (' + n + ')'))} the densest.`
      : (areaList.length === 1 ? `Every address we hold for them is in ${areaList[0][0]}.` : '');

    const near = M.nearest(city.id, cat, 8)
      .map((x) => ({ ...x, n: M.pairOf(x.city, cat).rows.filter((r) => r.languages.includes(lang)).length }))
      .filter((x) => x.n > 0).slice(0, 6);
    const hub = LANG_PAGES.get(cat + '|' + lang);
    const alternatives = near.length
      ? `The nearest ${langName}-speaking ${P.catName(cat)} outside ${city.name} are in ${P.list(near.slice(0, 3).map((x) => x.name + ' (' + x.n + ', ' + x.km + ' km)'))}.`
      : `We hold no ${langName}-speaking ${P.catName(cat)} in any city near ${city.name}, so this page is the whole of what we have for that combination.`;

    const capped = rows.length > CARD_BUDGET;
    const shown = capped ? rows.slice(0, CARD_BUDGET) : rows;

    const faq = [
      {
        q: `How many ${P.catName(cat)} in ${city.name} work in ${langName}?`,
        a: `${rows.length}, on the sources we have read. That is what is published and checked, not what exists: ` +
          `a ${P.singular(cat)} who speaks ${langName} and appears on no list is not here.`,
      },
      alsoLangs.length ? {
        q: `What if I need another language?`,
        a: `${city.name} also has ${P.list(alsoLangs.slice(0, 3).map(([l, n]) => n + ' in ' + P.langName(l)))}` +
          `, listed on the ${P.catName(cat)} page for the city.`,
      } : null,
      {
        q: `When was this checked?`,
        a: checked.length
          ? `The oldest entry here was checked in ${P.niceDate(checked[0])} and the newest in ${P.niceDate(checked[checked.length - 1])}. ` +
            `${withSite} of ${rows.length} have a website of their own, which is the fastest way to confirm before you book.`
          : `Each card carries the date its source was read.`,
      },
    ].filter(Boolean);

    // --- title and description, from a different pool than the parent's ------------------------
    const h1 = `${langName}-speaking ${P.catName(cat)} in ${city.name}`;
    const month = checked.length ? P.niceDate(checked[checked.length - 1]).replace(/^\d+ /, '') : '';
    const candidates = [
      `${rows.length} ${langName}-speaking ${P.catName(cat)}, ${city.name}`,
      `${langName} ${P.catName(cat)} in ${city.name}: ${rows.length} with sources`,
      `${city.name}: ${rows.length} ${P.catName(cat)} who work in ${langName}`,
      `${langName}-speaking ${P.catName(cat)} in ${city.name} (${month})`,
      `${rows.length} ${P.catName(cat)} in ${city.name} speaking ${langName}`,
    ].filter((t) => t !== h1 && !usedTitles.has(t));
    const fits = candidates.filter((t) => t.length <= 60);
    const title = (fits[0] || candidates.sort((a, b) => a.length - b.length)[0] || `${h1}, ${rows.length} listed`);
    usedTitles.add(title);

    // Every other language two or more of these providers work in is named here. The page is about
    // one language, but a reader searching for a second one that half this list also speaks should
    // find it from the search result rather than after opening the page: that is the same failure
    // the pair pages had, arriving from a different direction, and the gate checks for it.
    const alsoNamed = Object.entries(alsoCount).filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1]).map(([l, n]) => P.langName(l) + ' (' + n + ')');
    const desc = `${rows.length} ${P.catName(cat)} in ${city.name} whose ${langName} is stated by the list that names them` +
      (srcTop.length > 1 ? `, from ${srcTop.length} sources` : `, from ${srcTop[0].publisher}`) +
      `.${alsoNamed.length ? ` Some also work in ${P.list(alsoNamed.slice(0, 5))}.` : ''} Every claim links to where it came from.`;

    // --- listing --------------------------------------------------------------------------------
    const icon = inlineIcon(CAT_ICON[cat]);
    const cards = shown.map((r) => P.card(r, { icon, showCategory: false })).join('\n        ');

    const crumbs = [
      ['Home', '/'],
      ['Services by language', '/services'],
      [city.name, '/services/' + city.id],
      [P.catName(cat).replace(/^./, (c) => c.toUpperCase()), parent.url],
    ];

    const ld = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: BASE + c[1] }))
          .concat([{ '@type': 'ListItem', position: crumbs.length + 1, name: langName, item: BASE + url }]),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: h1,
        url: BASE + url,
        inLanguage: 'en',
        dateModified: checked[checked.length - 1] || undefined,
        spatialCoverage: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'Country', name: city.country } },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: shown.length,
          itemListElement: shown.map((r, i) => {
            const item = { '@type': 'ListItem', position: i + 1, name: r.name };
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

    const otherLangChips = alsoLangs.slice(0, 6).map(([l, n]) => {
      const kid = `/services/${city.id}/${M.SERVICE_SLUGS[cat]}/${langSlug(l)}`;
      const target = WILL_EXIST.has(city.id + '|' + cat + '|' + l) ? kid : parent.url + '#lang-' + l;
      return `<a class="svp-chip" href="${target}">${esc(P.langName(l))}<span>${n}</span></a>`;
    }).join('');
    const nearChips = near.map((x) => {
      const kid = `/services/${x.city}/${M.SERVICE_SLUGS[cat]}/${langSlug(lang)}`;
      const kidPair = M.pairOf(x.city, cat);
      const hasKid = WILL_EXIST.has(x.city + '|' + cat + '|' + lang);
      const href = hasKid ? kid : (PAIRS.has(x.city + '|' + cat) ? '/services/' + x.city + '/' + M.SERVICE_SLUGS[cat] : '/services/' + x.city);
      return `<a class="svp-chip" href="${href}">${esc(x.name)}<span>${x.n}</span></a>`;
    }).join('');

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
    .svp-page { padding: calc(var(--nav-height,64px) + var(--space-6)) 0 var(--space-10); }
    .svp-crumbs { font-size: var(--text-sm); color: var(--color-stone); margin: 0 0 var(--space-4); }
    .svp-crumbs a { color: var(--color-stone); }
    .svp-head { max-width: 64ch; margin: 0 0 var(--space-6); }
    .svp-head h1 { font-family: 'DM Serif Display', serif; font-size: clamp(1.9rem, 4vw, 2.9rem); line-height: 1.12; margin: 0 0 var(--space-3); text-wrap: balance; }
    .svp-stand { font-size: var(--text-lg); color: var(--color-charcoal); line-height: 1.6; margin: 0; }
    .svp-capped { margin: var(--space-3) 0 0; font-size: var(--text-sm); color: var(--color-stone); }
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
    .svp-up { margin: var(--space-4) 0 0; font-size: var(--text-sm); font-weight: 600; }
    .ymyl-note { font-size: var(--text-sm); color: var(--color-stone); border-left: 3px solid var(--color-sand-dark, #e3d9c6); padding-left: .9rem; margin: var(--space-5) 0; }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main class="svp-page" id="main-content">
    <div class="container">
      <p class="svp-crumbs">${crumbs.map((c) => `<a href="${c[1]}">${esc(c[0])}</a>`).join(' &rsaquo; ')} &rsaquo; ${esc(langName)}</p>
      <header class="svp-head">
        <h1>${esc(h1)}</h1>
        <p class="svp-stand">${esc(standfirst)}</p>
      </header>
      ${ymyl}

      <div class="sv-grid">
        ${cards}
      </div>
      ${capped ? `<p class="svp-capped">Showing ${CARD_BUDGET} of ${rows.length}. The rest are on the source this page draws from, which is searchable in full and linked on every card.</p>` : ''}

      <div class="svp-prose">
        <h2>Where these came from</h2>
        <p>${esc(provenance)}</p>
        <p>${esc(claim)}</p>
        ${geography ? `<h2>Where in ${esc(city.name)}</h2>\n        <p>${esc(geography)}</p>` : ''}
        <h2>If none of these fits</h2>
        <p>${esc(alternatives)}</p>
        ${otherLangChips ? `<h2>Other languages for ${esc(P.catName(cat))} in ${esc(city.name)}</h2>\n        <div class="svp-chips">${otherLangChips}</div>` : ''}
        ${nearChips ? `<h2>${esc(langName)}-speaking ${esc(P.catName(cat))} nearby</h2>\n        <div class="svp-chips">${nearChips}</div>` : ''}
        <p class="svp-up"><a href="${parent.url}">All ${pair.n} ${esc(P.catName(cat))} in ${esc(city.name)}</a>${hub ? ` &middot; <a href="${hub.url}">${esc(langName)}-speaking ${esc(P.catName(cat))} in every city we cover</a>` : ''}</p>
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

    shell.assertComplete(html, url);
    const dir = path.join(ROOT, 'services', city.id, M.SERVICE_SLUGS[cat]);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(ROOT, file), html);
    written.push({
      url, file, kind: 'city-lang', city: city.id, service: cat, language: lang,
      n: rows.length, shown: shown.length, parent: parent.url, title, h1, indexable: true,
    });
  }
}

// A page that no longer qualifies is deleted rather than left for a crawler to find.
{
  const keep = new Set(written.map((w) => w.file));
  let removed = 0;
  Object.keys(M.cities).forEach((slug) => {
    const cityDir = path.join(ROOT, 'services', slug);
    if (!fs.existsSync(cityDir)) return;
    fs.readdirSync(cityDir, { withFileTypes: true }).filter((e) => e.isDirectory()).forEach((e) => {
      const sub = path.join(cityDir, e.name);
      fs.readdirSync(sub).filter((f) => f.endsWith('.html')).forEach((f) => {
        if (!keep.has('services/' + slug + '/' + e.name + '/' + f)) { fs.unlinkSync(path.join(sub, f)); removed++; }
      });
      if (!fs.readdirSync(sub).length) fs.rmdirSync(sub);
    });
  });
  if (removed) console.log('  removed ' + removed + ' page(s) that no longer qualify');
}

fs.writeFileSync(path.join(ROOT, 'data', 'service-city-lang-pages.json'), JSON.stringify(written, null, 1) + '\n');
const totalRows = written.reduce((a, w) => a + w.n, 0);
const totalShown = written.reduce((a, w) => a + w.shown, 0);
console.log(`Wrote ${written.length} city-service-language pages holding ${totalRows} providers, ${totalShown} of them on the page.`);
if (skipped.length) {
  console.log('  not written, the language covers too much of its parent to be a different page: ' + skipped.length);
  skipped.slice(0, 4).forEach((s) => console.log('    ' + s));
}

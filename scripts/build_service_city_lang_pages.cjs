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
 *   - its parent does not already show them all, or the page would be its parent with a different
 *     title. Athens is the case that matters: 91 of its 95 doctors speak English and its parent
 *     renders every one of them in a single grid, so no page is written for those 91.
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
const B = require(path.join(ROOT, 'scripts', 'lib', 'service_bento.cjs'));
const F = require(path.join(ROOT, 'scripts', 'lib', 'service_filter.cjs'));
const H = require(path.join(ROOT, 'scripts', 'lib', 'service_hero.cjs'));
const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const { CAT_ICON } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const esc = P.esc;
const MIN_ROWS = 21;

/**
 * Whether the parent shows this language in full, which is the only reason not to give it a page.
 *
 * The first rule here was a share: no page where a language covers more than 70% of its pair,
 * because "a page for those 91 would be the doctors page again". That is true of Athens, whose
 * parent renders all 95 doctors in one grid, and false of Budapest, whose parent renders twenty of
 * 286 Italian-speaking lawyers and links to nothing. 266 providers sat behind a rule that was
 * measuring the wrong thing.
 *
 * So the question is not what share a language holds, it is whether its parent already shows them
 * all. A pair page renders one grid, and therefore everything, when it has fewer than two languages
 * with two providers each, or when its top two languages hold almost the same people. Otherwise it
 * renders sections and caps each one, and anything past that cap is invisible without a page.
 */
const SECTION_CAP = 20;
const parentShowsAll = (pair) => {
  const langs = pair.nonLocal.filter(([, n]) => n >= 2);
  if (langs.length < 2) return true;
  const [a, b] = langs;
  const setA = new Set(pair.rows.filter((r) => r.languages.includes(a[0])).map((r) => r.name));
  const setB = new Set(pair.rows.filter((r) => r.languages.includes(b[0])).map((r) => r.name));
  const inter = [...setA].filter((x) => setB.has(x)).length;
  return inter / Math.min(setA.size, setB.size) >= 0.8;
};
// A card costs about 2KB. 120 of them plus the shell is roughly 300KB, which is as much as a page
// on a phone should ever weigh. Three lists run past it, and each carries the rest over a series
// rather than stopping at the budget and pointing at the source.
const CARD_BUDGET = 120;

/**
 * The page numbers a pager shows: both ends, a window around where the reader stands, and a 0 for
 * every gap between them. Madrid's five fit whole; the shape only matters if a list grows past seven,
 * and a pager that grew a row per page would be the same phone book the cap was avoiding.
 */
function pageWindow(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (unused, i) => i + 1);
  const want = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 4) [2, 3, 4, 5].forEach((n) => want.add(n));
  if (cur > total - 4) [total - 4, total - 3, total - 2, total - 1].forEach((n) => want.add(n));
  const ns = [...want].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  ns.forEach((n, i) => { if (i && n - ns[i - 1] > 1) out.push(0); out.push(n); });
  return out;
}

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
      if (count < MIN_ROWS || count <= SECTION_CAP || parentShowsAll(pair)) return;
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
    if (count < MIN_ROWS || count <= SECTION_CAP) continue;
    if (parentShowsAll(pair)) { skipped.push(`${pair.city}/${cat}/${langSlug(lang)}: the parent already shows every one of them`); continue; }

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

    const claim = `Every row here carries ${P.an(langName)} claim from its source: ` +
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

    /**
     * A list longer than one page gets the rest of its pages rather than a cap.
     *
     * Measured: 5,639 of 6,195 providers appear on some page, and 555 of the 556 that do not sit
     * behind the cap on exactly two lists, Madrid's English translators and Budapest's Italian
     * lawyers. Telling a reader that the rest are "on the source" is honest but it is not the job.
     * A card costs about 2KB, so the page count follows from the budget rather than from taste.
     *
     * Everything that names the list rather than the slice is settled before the loop opens. The
     * title comes from a pool that remembers what it has handed out, so drawing it inside the loop
     * gave every page a different one: Madrid's five went out as five unrelated titles for one list,
     * the last of them having exhausted the pool and fallen through to the last resort.
     */
    const pageCount = Math.max(1, Math.ceil(rows.length / CARD_BUDGET));

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
    // Every language two or more of these providers work in, and not the first five of them.
    //
    // The gate on this family exists because a reader searching for German-speaking doctors in
    // Barcelona was shown a title about English and French and never opened the page holding
    // eleven of them. Capping the list at five did the same thing further down: Madrid's English
    // page serves two Dutch speakers and two Arabic, and said neither. A long description is a
    // smaller cost than a page that hides what it holds.
    const alsoNamed = Object.entries(alsoCount).filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1]).map(([l, n]) => P.langName(l) + ' (' + n + ')');
    const desc = `${rows.length} ${P.catName(cat)} in ${city.name} whose ${langName} is stated by the list that names them` +
      (srcTop.length > 1 ? `, from ${srcTop.length} sources` : `, from ${srcTop[0].publisher}`) +
      `.${alsoNamed.length ? ` Some also work in ${P.list(alsoNamed)}.` : ''} Every claim links to where it came from.`;

    // --- one page per slice of the list ---------------------------------------------------------
    // The body below stays at this indent on purpose. It is one page's worth of template and the
    // markup lives inside a literal, so shifting the code would shift the HTML it writes.
    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
    const shown = rows.slice((pageNo - 1) * CARD_BUDGET, pageNo * CARD_BUDGET);
    const first = (pageNo - 1) * CARD_BUDGET + 1;
    const last = first + shown.length - 1;
    const pageUrl = pageNo === 1 ? url : url + '/' + pageNo;
    const pageFile = pageNo === 1 ? file : file.replace(/\.html$/, '/' + pageNo + '.html');
    const ofN = ', page ' + pageNo + ' of ' + pageCount;
    // The title is drawn from a pool so that it is not the h1 over again, and a page of a series
    // keeps that draw and adds its number to it.
    const pageTitle = pageNo === 1 ? title : title + ofN;
    const pageH1 = pageNo === 1 ? h1 : h1 + ofN;
    // A language two or more of these providers also work in has to be in the description of every
    // page of the series. Leaving it to the first hid French from four of Madrid's five.
    const pageDesc = pageNo === 1 ? desc
      : `Entries ${first} to ${last} of the ${rows.length} ${P.catName(cat)} in ${city.name} whose ` +
        `${langName} is stated by the list that names them.` +
        `${alsoNamed.length ? ` Some also work in ${P.list(alsoNamed)}.` : ''}` +
        ` Page ${pageNo} of ${pageCount}, and every claim links to where it came from.`;
    // The standfirst opens with the count, so a page of the series opens with its range and reads
    // straight on into it rather than saying 519 twice in one sentence.
    const pageStand = pageNo === 1 ? standfirst : `Entries ${first} to ${last} of the ` + standfirst;

    // --- listing --------------------------------------------------------------------------------
    const icon = inlineIcon(CAT_ICON[cat]);
    const cards = shown.map((r) => P.card(r, { icon, showCategory: false })).join('\n        ');
    // Everyone on this page speaks the page's language by definition; what varies is what ELSE they
    // speak, so that is the only language axis left worth filtering on.
    const ALSO_SPEAKS = (() => {
      const n = {};
      // Not the page's own language, and not the local one either: Paris's German-speaking lawyers
      // are 99 of 99 French, so offering French is offering nothing.
      shown.forEach((r) => r.languages.forEach((l) => { if (l !== lang && l !== local) n[l] = (n[l] || 0) + 1; }));
      return Object.entries(n)
        .sort((a, b) => b[1] - a[1] || P.langName(a[0]).localeCompare(P.langName(b[0])))
        .map(([l, c]) => [l, P.langName(l) + ' (' + c + ')']);
    })();

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
          .concat([{ '@type': 'ListItem', position: crumbs.length + 1, name: langName, item: BASE + url }])
          .concat(pageNo > 1 ? [{ '@type': 'ListItem', position: crumbs.length + 2, name: 'Page ' + pageNo, item: BASE + pageUrl }] : []),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pageH1,
        url: BASE + pageUrl,
        isPartOf: pageCount > 1 ? { '@type': 'CollectionPage', name: h1, url: BASE + url } : undefined,
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
    // The same three answers on five URLs are not five FAQs, so only the first page carries the
    // markup. A reader still gets to read them on every page.
    if (faq.length >= 2 && pageNo === 1) {
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
      return B.chip({ href: target, label: P.langName(l), n });
    }).join('');
    const nearChips = near.map((x) => {
      const kid = `/services/${x.city}/${M.SERVICE_SLUGS[cat]}/${langSlug(lang)}`;
      const kidPair = M.pairOf(x.city, cat);
      const hasKid = WILL_EXIST.has(x.city + '|' + cat + '|' + lang);
      const href = hasKid ? kid : (PAIRS.has(x.city + '|' + cat) ? '/services/' + x.city + '/' + M.SERVICE_SLUGS[cat] : '/services/' + x.city);
      return B.chip({ href, label: x.name, n: x.n });
    }).join('');

    // A list too long for one page gets a pager, not a grey line of underlined numbers. It is built
    // from the same bordered chip the language and city links use, so it belongs to the page.
    const pgHref = (n) => (n === 1 ? url : url + '/' + n);
    const pager = pageCount < 2 ? '' : `<nav class="svp-pager" aria-label="Pages of this list">
        <p class="svp-pager-count">Page ${pageNo} of ${pageCount} &middot; showing ${first} to ${last} of ${rows.length}</p>
        <ul>
          ${pageNo > 1 ? `<li><a class="svp-pg svp-pg-step" rel="prev" href="${pgHref(pageNo - 1)}">&lsaquo; Previous</a></li>` : ''}
          ${pageWindow(pageNo, pageCount).map((n) => n === 0
            ? '<li><span class="svp-pg-gap">&hellip;</span></li>'
            : n === pageNo
              ? `<li><span class="svp-pg svp-pg-now" aria-current="page">${n}</span></li>`
              : `<li><a class="svp-pg" href="${pgHref(n)}">${n}</a></li>`).join('\n          ')}
          ${pageNo < pageCount ? `<li><a class="svp-pg svp-pg-step" rel="next" href="${pgHref(pageNo + 1)}">Next &rsaquo;</a></li>` : ''}
        </ul>
      </nav>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)} | The Nomad HQ</title>
  <meta name="description" content="${esc(pageDesc)}">
  <link rel="canonical" href="${BASE}${pageUrl}">
${pageNo > 1 ? `  <link rel="prev" href="${BASE}${pgHref(pageNo - 1)}">\n` : ''}${pageNo < pageCount ? `  <link rel="next" href="${BASE}${pgHref(pageNo + 1)}">\n` : ''}  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(pageTitle)} | The Nomad HQ">
  <meta property="og:description" content="${esc(pageDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}${pageUrl}">
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
    .svp-page { padding-top: var(--space-8); padding-bottom: var(--space-10); }
    .svp-pager { margin: var(--space-6) 0 0; }
    .svp-pager-count { margin: 0 0 var(--space-3); font-size: var(--text-sm); color: var(--color-stone); }
    .svp-pager ul { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; list-style: none; margin: 0; padding: 0; }
    .svp-pg { display: inline-flex; align-items: center; justify-content: center; min-width: 2.4rem; height: 2.4rem;
      padding: 0 .7rem; font-size: var(--text-sm); font-weight: 600; font-variant-numeric: tabular-nums;
      border: 1px solid var(--color-sand-dark, #e3d9c6); border-radius: var(--radius-md, 8px); background: #fff; }
    a.svp-pg:not(.btn):not(.nav-link) { color: var(--color-ink); text-decoration: none; }
    a.svp-pg:hover { border-color: var(--color-terracotta, #c65d3b); color: var(--color-terracotta, #c65d3b); }
    .svp-pg-now { background: var(--color-ink); border-color: var(--color-ink); color: #fff; }
    .svp-pg-gap { display: inline-flex; justify-content: center; min-width: 1.4rem; color: var(--color-stone); }
    .svp-prose { max-width: 68ch; margin: var(--space-8) 0 0; }
    .svp-prose h2 { font-family: 'DM Serif Display', serif; font-size: 1.35rem; margin: var(--space-8) 0 var(--space-5); }
    .svp-prose p { color: var(--color-charcoal); line-height: 1.7; margin: 0 0 var(--space-3); }
    .svp-chips { margin: var(--space-4) 0 var(--space-6); }
${B.css}
${F.css}
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
  <main id="main-content">
    ${H.hero({
    crumbs: `${crumbs.map((c) => `<a href="${c[1]}">${esc(c[0])}</a>`).join(' &rsaquo; ')} &rsaquo; ${pageNo === 1 ? esc(langName) : `<a href="${url}">${esc(langName)}</a> &rsaquo; Page ${pageNo}`}`,
    eyebrow: `${city.iso ? `<img src="/assets/flags/${city.iso}.svg" alt="" width="20" height="15">` : ''}${esc(langName)}-speaking in ${esc(city.name)}`,
    h1: pageH1,
    sub: pageStand,
    stats: [
      [rows.length.toLocaleString('en-US'), rows.length === 1 ? P.singular(cat) : P.catName(cat)],
      ...(pageCount > 1 ? [[pageCount, pageCount === 1 ? 'page' : 'pages']] : []),
    ],
    image: fs.existsSync(path.join(ROOT, 'images', 'cities', city.id + '.webp'))
      ? H.cityImage(city.id, city.name, ATTR[city.id] || {})
      : H.sectionImage(),
  })}
    <div class="svp-page container">
      ${ymyl}

      ${F.bar({
    id: 'svp',
    // One page of a paginated list is a preview like any other, so the filter waits until the
    // whole list is on screen. Where it is not, the pager is the honest control.
    complete: pageCount < 2,
    items: shown.length,
    fields: [
      { key: 'q', search: true, label: 'Name', placeholder: `Search ${shown.length} listings…` },
      { key: 'lang', label: 'Also speaks', any: 'Any language', options: ALSO_SPEAKS },
    ],
  })}
      ${pageCount < 2 ? F.count({ id: 'svp', total: shown.length, noun: 'listing', nounPlural: 'listings' }) : ''}

      <div class="sv-grid">
        ${cards}
      </div>
      ${pageCount < 2 ? F.empty({ id: 'svp', what: `This page holds every ${esc(langName)}-speaking ${esc(P.catName(cat).replace(/s$/, ''))} we can source in ${esc(city.name)}.` }) : ''}
      ${pager}

      <div class="svp-prose">
        <h2>Where these came from</h2>
        <p>${esc(provenance)}</p>
        <p>${esc(claim)}</p>
        ${geography ? `<h2>Where in ${esc(city.name)}</h2>\n        <p>${esc(geography)}</p>` : ''}
        <h2>If none of these fits</h2>
        <p>${esc(alternatives)}</p>
        ${otherLangChips ? `<h2>Other languages for ${esc(P.catName(cat))} in ${esc(city.name)}</h2>\n        <div class="svp-chips sb-chips">${otherLangChips}</div>` : ''}
        ${nearChips ? `<h2>${esc(langName)}-speaking ${esc(P.catName(cat))} nearby</h2>\n        <div class="svp-chips sb-chips">${nearChips}</div>` : ''}
        <p class="svp-up"><a href="${parent.url}">All ${pair.n} ${esc(P.catName(cat))} in ${esc(city.name)}</a>${hub ? ` &middot; <a href="${hub.url}">${esc(langName)}-speaking ${esc(P.catName(cat))} in every city we cover</a>` : ''}</p>
        <h2>Questions</h2>
        <dl class="svp-faq">
${faq.map((q) => '          <dt>' + esc(q.q) + '</dt>\n          <dd>' + esc(q.a) + '</dd>').join('\n')}
        </dl>
      </div>
    </div>
  </main>
  ${pageCount < 2 ? F.js({ id: 'svp', noun: 'listing', nounPlural: 'listings' }) : ''}
  ${shell.footer}
${shell.bodyEnd}
</body>
</html>`;

    shell.assertComplete(html, pageUrl);
    const dir = path.dirname(path.join(ROOT, pageFile));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(ROOT, pageFile), html);
    written.push({
      url: pageUrl, file: pageFile, kind: 'city-lang', city: city.id, service: cat, language: lang,
      page: pageNo, pages: pageCount,
      n: rows.length, shown: shown.length, parent: parent.url, title, h1, indexable: true,
    });
    }
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
// n is the length of the whole list, so it counts once per list rather than once per page of one:
// summed over every row it reported 5,163 providers across the three series where there are 2,407.
const lists = written.filter((w) => w.page === 1);
const totalRows = lists.reduce((a, w) => a + w.n, 0);
const totalShown = written.reduce((a, w) => a + w.shown, 0);
const series = lists.filter((w) => w.pages > 1);
console.log(`Wrote ${written.length} pages over ${lists.length} city-service-language lists, holding ${totalRows} providers, ${totalShown} of them on the page.`);
if (series.length) {
  console.log('  too long for one page, so carried over a series: ' +
    series.map((w) => w.url.replace('/services/', '') + ' (' + w.n + ' over ' + w.pages + ')').join(', '));
}
if (skipped.length) {
  console.log('  not written, the language covers too much of its parent to be a different page: ' + skipped.length);
  skipped.slice(0, 4).forEach((s) => console.log('    ' + s));
}

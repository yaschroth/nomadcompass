require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes one page per city into services/<city>.html.
 *
 * Why: the whole directory used to live on a single URL. Search Console for the three months to
 * 2026-08-16 gave /services one impression and no clicks, while /best and /cities, which are many
 * narrow pages, took nearly all of the site's traffic. A page about everything ranks for nothing:
 * people search "english speaking dentist lisbon", and that needs a page about Lisbon.
 *
 * Titles say what the rows support and no more. The language named is worked out from the rows
 * themselves: a language on nearly every provider in a city is that city's own and is not what
 * anyone searches for, so Rome is billed as German-speaking (43 of its 50) rather than Italian.
 *
 * Cities with fewer than three providers get a page too, so nothing on the site is unreachable,
 * but those pages carry noindex and stay out of the sitemap. They exist for readers and for
 * internal linking, not as something to offer a search engine.
 *
 * The shell (styles, nav, footer) is lifted from services.html rather than duplicated, so the two
 * cannot drift apart. Run scripts/build_services.cjs first.
 *
 * Usage: node scripts/build_service_city_pages.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const OUTDIR = path.join(ROOT, 'services');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => {
  const p = [...(flag || '')];
  return p.length === 2 ? p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join('') : '';
};

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITY = {};
m.exports.forEach((c) => { if (c && c.id) CITY[c.id] = { name: c.name, country: c.country, iso: iso(c.flag) }; });

const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));
const CATS = DB._categories;
const LANGS = DB._languages;
const EVIDENCE = DB._evidence;
const { CAT_ICON, CAT_PLURAL, EV_RANK, EV_LABEL } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const MIN_INDEXABLE = 3;

// Which child pages exist. Only the manifest knows: a pair under the word floor was never written,
// and linking to a page that does not exist is worse than not linking.
const { SERVICE_SLUGS } = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const CHILDREN = new Set();
{
  const f = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => CHILDREN.add(x.city + '|' + x.service));
}

// --- the shell ---------------------------------------------------------------------------------
// Everything a page needs, including the blocks the sweeps inject. Lifting only the style, nav and
// footer left every generated page short of five tracked features, so _safe_write refused the
// second run and the family was being built with --force, guard off. See scripts/lib/page_shell.cjs.
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));
const { style: STYLE, nav: NAV, footer: FOOTER } = shell;

const mapsUrl = (p) => 'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent([p.name, p.area, CITY[p.city] && CITY[p.city].name, CITY[p.city] && CITY[p.city].country].filter(Boolean).join(', '));

function card(p) {
  const chips = p.languages.map((l) => `<span class="sv-lang">${esc(LANGS[l])}</span>`).join('');
  const host = (() => { try { return new URL(p.sourceUrl).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } })();
  const title = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="nofollow noopener">${esc(p.name)}</a>`
    : esc(p.name);
  const meta = [esc(CATS[p.category]), p.area ? esc(p.area) : null].filter(Boolean).join('&nbsp;&middot; ');
  return `<article class="sv-card sv-c-${p.category}" data-cat="${p.category}" data-lang="${p.languages.join(' ')}" data-name="${esc(p.name.toLowerCase())}">
        <div class="sv-head">
          <span class="sv-ico">${inlineIcon(CAT_ICON[p.category])}</span>
          <div>
            <h3 class="sv-name">${title}</h3>
            <p class="sv-meta">${meta}</p>
          </div>
        </div>
        <p class="sv-langs"><span class="sv-lang-label">Speaks</span>${chips}</p>
        ${p.note ? `<p class="sv-note">${esc(p.note)}</p>` : ''}
        <div class="sv-foot">
          <p class="sv-src"><span class="sv-ev sv-ev-${p.evidence}">${EV_LABEL[p.evidence]}</span><a href="${esc(p.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(host)}</a></p>
          <p class="sv-links">${p.url ? `<a class="sv-go" href="${esc(p.url)}" target="_blank" rel="nofollow noopener">Website</a>` : '<span class="sv-nogo">No site</span>'}<a class="sv-go" href="${esc(mapsUrl(p))}" target="_blank" rel="nofollow noopener">Maps</a></p>
        </div>
      </article>`;
}

// Which country speaks what, worked out from the rows themselves: the language carried by most of
// a country's providers is that country's own. Deriving it per city does not work, and getting it
// wrong is not cosmetic. A first attempt excluded any language on 90% of a city's rows, which
// billed Bangkok as "English and Thai-speaking" (Thai being the one thing nobody searches for
// there) and Phnom Penh as "French and Chinese-speaking" on the strength of two entries, while
// dropping the English that sixteen of its seventeen rows actually carry.
// Written out rather than inferred. Two attempts to derive it from the data failed, and the second
// failure is the instructive one: taking each country's most common language picks English, because
// English is the thing these lists set out to record. Thailand's rows carry English 84 times and
// Thai 50, so Bangkok came out billed as "Thai and German-speaking". A country's own language is a
// plain fact and belongs in a table.
const LOCAL = {
  Thailand: 'th', Spain: 'es', India: null, Italy: 'it', Vietnam: 'vi', Georgia: 'ka',
  Lithuania: 'lt', Indonesia: 'id', France: 'fr', UAE: 'ar', Portugal: 'pt', Mexico: 'es',
  Poland: 'pl', Colombia: 'es', Egypt: 'ar', 'South Africa': 'af', Serbia: 'sr',
  Philippines: 'tl', Argentina: 'es', Cambodia: 'km', Slovenia: 'sl', 'Czech Republic': 'cs',
  Morocco: 'ar', Latvia: 'lv', Estonia: 'et', Croatia: 'hr', Kenya: 'sw', Hungary: 'hu',
  Japan: 'ja', Taiwan: 'zh', Singapore: null, Brazil: 'pt', Chile: 'es', Netherlands: 'nl',
  Malaysia: 'ms', Germany: 'de', Greece: 'el', Belgium: 'nl', 'Sri Lanka': 'si', Bulgaria: 'bg',
  Turkey: 'tr', Romania: 'ro', 'South Korea': 'ko', Peru: 'es', Austria: 'de',
  // English is the local language here, so the pages lead on the foreign one the lists record.
  'United States': 'en', China: 'zh',
  Albania: 'sq', Bolivia: 'es', Ecuador: 'es', Jordan: 'ar', Norway: 'no', Switzerland: 'de',
  'Costa Rica': 'es', Ethiopia: null, Guatemala: 'es', Israel: 'he', Laos: null,
  Montenegro: null, Myanmar: 'my', Nepal: 'ne', 'North Macedonia': null, Oman: 'ar',
  Sweden: 'sv', Tanzania: 'sw', Tunisia: 'ar', Uruguay: 'es', Uzbekistan: null,
};
// A country in the data with no entry here would silently keep its own language in every title, so
// say so loudly instead.
{
  const missing = [...new Set(DB.providers
    .map((p) => CITY[p.city] && CITY[p.city].country)
    .filter((c) => c && !(c in LOCAL)))];
  if (missing.length) {
    console.error('add these countries to LOCAL in ' + path.basename(__filename) + ': ' + missing.join(', '));
    process.exit(1);
  }
}

function headlineLanguages(rows, country) {
  const count = {};
  rows.forEach((p) => p.languages.forEach((l) => { count[l] = (count[l] || 0) + 1; }));
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  // Drop the local language, and anything carried by fewer than a fifth of the rows: a single
  // provider's Japanese does not belong in the title of a page about seventeen.
  let pick = ranked.filter(([l, n]) => l !== LOCAL[country] && n / rows.length >= 0.2);
  if (!pick.length) pick = ranked.slice(0, 1);
  return pick.slice(0, 2).map(([l]) => LANGS[l]);
}

function headlineCategories(rows) {
  const count = {};
  rows.forEach((p) => { count[p.category] = (count[p.category] || 0) + 1; });
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => CAT_PLURAL[c] || CATS[c].toLowerCase());
}

const list = (arr) => (arr.length > 1 ? arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1] : arr[0] || '');

const bySlug = {};
DB.providers.forEach((p) => { (bySlug[p.city] = bySlug[p.city] || []).push(p); });
const slugs = Object.keys(bySlug).filter((s) => CITY[s]).sort((a, b) => CITY[a].name.localeCompare(CITY[b].name));

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR);

let indexable = 0;
const written = [];

for (const slug of slugs) {
  const rows = bySlug[slug].slice().sort((a, b) =>
    (EV_RANK[a.evidence] - EV_RANK[b.evidence]) || a.name.localeCompare(b.name));
  const c = CITY[slug];
  const langs = headlineLanguages(rows, c.country);
  const cats = headlineCategories(rows);
  const isIndexable = rows.length >= MIN_INDEXABLE;
  if (isIndexable) indexable++;

  const title = `${list(langs)}-speaking ${list(cats)} in ${c.name}`;
  const allLangs = [...new Set(rows.flatMap((p) => p.languages))].sort((a, b) => LANGS[a].localeCompare(LANGS[b]));
  const allCats = [...new Set(rows.map((p) => p.category))].sort((a, b) => CATS[a].localeCompare(CATS[b]));
  const desc = `${rows.length} ${rows.length === 1 ? 'provider' : 'providers'} in ${c.name} listed by the language they work in, ` +
    `across ${allLangs.length} ${allLangs.length === 1 ? 'language' : 'languages'}. Every language claim names its source.`;

  // Grouped by service, biggest group first. The page used to be one undifferentiated grid sorted
  // by evidence tier, so a dentist sat between two lawyers and the only way to find the thing you
  // came for was to read all of it. Inside a group the best-sourced row still leads.
  const groups = allCats
    .map((cat) => ({ cat, rows: rows.filter((p) => p.category === cat) }))
    .sort((x, y) => y.rows.length - x.rows.length || CATS[x.cat].localeCompare(CATS[y.cat]));
  // A city holding more than one service is a hub: each service shows its best-sourced few and
  // links to its own page, which is where the whole list lives. A city holding one service is that
  // service's page already, so it shows everything and links nowhere.
  const single = groups.length === 1;
  const PREVIEW = 3;
  const childOf = (cat) => '/services/' + slug + '/' + SERVICE_SLUGS[cat];
  const hasChild = (cat) => CHILDREN.has(slug + '|' + cat);
  const groupsHtml = groups.map((g) => {
    const shown = single ? g.rows : g.rows.slice(0, PREVIEW);
    const more = g.rows.length - shown.length;
    const head = hasChild(g.cat)
      ? `<a href="${childOf(g.cat)}">${esc(CATS[g.cat])}</a>`
      : esc(CATS[g.cat]);
    return `<section class="svc-group" data-cat="${g.cat}" id="svc-${g.cat}">
          <h2 class="svc-group-head"><span class="svc-group-ico">${inlineIcon(CAT_ICON[g.cat])}</span>${head}<span class="svc-group-n">${g.rows.length}</span></h2>
          <div class="sv-grid">
        ${shown.map(card).join('\n        ')}
          </div>
          ${more > 0 ? `<p class="svc-more-link">${hasChild(g.cat)
            ? `<a href="${childOf(g.cat)}">See all ${g.rows.length} ${esc(CAT_PLURAL[g.cat] || CATS[g.cat].toLowerCase())} in ${esc(c.name)} &rarr;</a>`
            : `${more} more not shown here.`}</p>` : ''}
        </section>`;
  }).join('\n      ');

  // The chips are the navigation now, and they are links rather than a filter that rewrites the
  // page under you. Every symptom reported on the old page came out of that one closure.
  const chipsHtml = groups.map((g) => (hasChild(g.cat)
    ? `<a class="svc-chip" data-cat="${g.cat}" href="${childOf(g.cat)}">${esc(CATS[g.cat])}<span>${g.rows.length}</span></a>`
    : `<a class="svc-chip" data-cat="${g.cat}" href="#svc-${g.cat}">${esc(CATS[g.cat])}<span>${g.rows.length}</span></a>`)).join('');

  // Every option says how many rows it holds, so the menu answers "is there anything here for me"
  // before you pick it and the page cannot promise something it does not have.
  const catCount = {};
  rows.forEach((p) => { catCount[p.category] = (catCount[p.category] || 0) + 1; });
  const langCount = {};
  rows.forEach((p) => p.languages.forEach((l) => { langCount[l] = (langCount[l] || 0) + 1; }));
  const catOptions = `<option value="all">All services (${rows.length})</option>` +
    groups.map((g) => `<option value="${g.cat}">${esc(CATS[g.cat])} (${g.rows.length})</option>`).join('');
  const langOptions = `<option value="all">Any language</option>` +
    allLangs.slice().sort((x, y) => langCount[y] - langCount[x] || LANGS[x].localeCompare(LANGS[y]))
      .map((l) => `<option value="${l}">${esc(LANGS[l])} (${langCount[l]})</option>`).join('');

  const a = ATTR[slug] || {};
  const img = fs.existsSync(path.join(ROOT, 'images', 'cities', slug + '-card.webp'))
    ? `<img class="sv-city-img" src="/images/cities/${slug}-card.webp" alt="${esc(a.alt || c.name)}" loading="eager" decoding="async" width="800" height="532">`
    : '';
  const credit = a.author
    ? `<a class="sv-city-credit" href="${esc(a.sourcePageUrl || '#')}" target="_blank" rel="nofollow noopener">Photo: ${esc(a.author)} (${esc(a.license || '')})</a>`
    : '';
  const flag = c.iso ? `<img class="sv-city-flag" src="/assets/flags/${c.iso}.svg" alt="" width="26" height="20">` : '';

  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', BASE + '/'], ['Services by Language', BASE + '/services'], [c.name, BASE + '/services/' + slug]]
      .map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })),
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | The Nomad HQ</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}/services/${slug}">
  <meta name="robots" content="${isIndexable ? 'max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, follow'}">
  <meta property="og:title" content="${esc(title)} | The Nomad HQ">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/services/${slug}">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  ${STYLE}
${shell.headEnd}
  <style>
    /* This page is one city, so it opens on the listing rather than on a full-height photo. */
    .svc-page { padding: calc(var(--nav-height,64px) + var(--space-6)) 0 var(--space-10); }
    .svc-crumbs { font-size: var(--text-sm); color: var(--color-stone); margin: 0 0 var(--space-4); }
    .svc-crumbs a { color: var(--color-stone); }
    .svc-head { max-width: 62ch; margin: 0 0 var(--space-6); }
    .svc-head h1 { font-family: 'DM Serif Display', serif; font-size: clamp(1.9rem, 4vw, 2.9rem); line-height: 1.12; margin: 0 0 var(--space-3); text-wrap: balance; }
    .svc-head p { font-size: var(--text-lg); color: var(--color-charcoal); line-height: 1.6; margin: 0; }
    .svc-facets { display: flex; flex-wrap: wrap; gap: .5rem; margin: var(--space-5) 0 0; padding: 0; list-style: none; }
    .svc-facets li { font-size: var(--text-xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--color-charcoal); background: #fff; border: 1px solid var(--color-sand-dark); border-radius: var(--radius-md, 8px); padding: .4rem .7rem; }
    .svc-more { margin: var(--space-8) 0 0; padding: var(--space-6); background: #fff; border: 1px solid var(--color-sand-dark); border-radius: var(--radius-md, 8px); }
    .svc-more h2 { margin: 0 0 var(--space-3); font-size: var(--text-xl); }
    .svc-more p { margin: 0 0 var(--space-3); color: var(--color-charcoal); }
    .svc-more p:last-child { margin-bottom: 0; }
    /* The filter sits with the listing, not in the header: it acts on what is below it. */
    .svc-controls { justify-content: flex-start; margin: 0 0 var(--space-2); }
    .svc-group { margin: 0 0 var(--space-8); scroll-margin-top: calc(var(--nav-height,64px) + 1rem); }
    .svc-group.is-hidden { display: none; }
    .svc-group-head { display: flex; align-items: center; gap: .6rem; margin: 0 0 var(--space-4);
      font-family: 'DM Serif Display', serif; font-size: 1.45rem; color: var(--color-ink);
      padding-bottom: .6rem; border-bottom: 1px solid var(--color-sand-dark, #e3d9c6); }
    .svc-group-ico { display: inline-flex; width: 30px; height: 30px; align-items: center; justify-content: center;
      border-radius: 8px; background: #fff; border: 1px solid var(--color-sand-dark, #e3d9c6); color: var(--color-terracotta-dark, #a8492c); flex: 0 0 auto; }
    .svc-group-ico svg { width: 17px; height: 17px; }
    .svc-group-n { margin-left: auto; font-family: var(--font-sans, system-ui); font-size: var(--text-sm);
      font-weight: 700; color: var(--color-stone); }
    .svc-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0 0 var(--space-5); }
    a.svc-chip:not(.btn):not(.nav-link) { display: inline-flex; align-items: center; gap: .45rem; font-size: var(--text-sm); font-weight: 600;
      color: var(--color-ink); background: #fff; border: 1px solid var(--color-sand-dark, #e3d9c6);
      border-radius: var(--radius-md, 8px); padding: .45rem .75rem; text-decoration: none; }
    .svc-chip:hover { border-color: var(--color-terracotta, #c65d3b); }
    .svc-chip span { font-size: var(--text-xs); color: var(--color-stone); }
    .svc-group-head a:not(.btn):not(.nav-link) { color: inherit; text-decoration: none; }
    .svc-group-head a:hover { text-decoration: underline; }
    .svc-more-link { margin: var(--space-3) 0 0; font-size: var(--text-sm); font-weight: 600; }
  </style>
</head>
<body>
  ${shell.bodyStart}
  ${NAV}
  <main class="svc-page">
    <div class="container">
      <p class="svc-crumbs"><a href="/">Home</a> &rsaquo; <a href="/services">Services by language</a> &rsaquo; ${esc(c.name)}</p>
      <header class="svc-head">
        <h1 id="svcTitle">${esc(title)}</h1>
        <p>${esc(rows.length === 1 ? 'One provider' : rows.length + ' providers')} in ${esc(c.name)}, ${esc(c.country)}, listed by the language they work in. Every language claim on this page names the source it came from.</p>
        <ul class="svc-facets">
          <li>${allLangs.length} ${allLangs.length === 1 ? 'language' : 'languages'}</li>
          ${allLangs.map((l) => `<li>${esc(LANGS[l])}</li>`).join('\n          ')}
        </ul>
      </header>

      <section class="sv-city">
        <header class="sv-city-band">${img}
          <div class="sv-city-band-in">${flag}<h2>${esc(c.name)}<span>${esc(c.country)}</span></h2>
            <p class="sv-city-count">${rows.length} provider${rows.length === 1 ? '' : 's'}</p>
          </div>${credit}
        </header>

        ${single ? '' : `<nav class="svc-chips" aria-label="Services in ${esc(c.name)}">${chipsHtml}</nav>`}
        <p class="sv-count">${single
          ? `All <b>${rows.length}</b> ${rows.length === 1 ? 'provider' : 'providers'} we hold for ${esc(c.name)}.`
          : `<b>${rows.length}</b> providers across <b>${groups.length}</b> services. Each service has its own page with the full list.`}</p>

      ${groupsHtml}
      </section>

      <section class="svc-more">
        <h2>How to read this</h2>
        <p>Nothing on this page goes in without a source, and the source is named on every card. The tier on each card says <em>how</em> we know, which matters more than the claim itself: ${allCats.length} service ${allCats.length === 1 ? 'type' : 'types'} are covered here, and a provider that states its own languages is a stronger signal than one that appears on a list somebody else curates.</p>
        <p><strong>We have not visited or called any of these providers.</strong> Treat every entry as a claim someone else made, not a recommendation from us.</p>
        <p>No provider has paid to appear here, and there are no affiliate links in these listings.</p>
        <p><a href="/cities/${slug}">Read the full ${esc(c.name)} city guide</a> or <a href="/services">browse every city in the directory</a>.</p>
      </section>
    </div>
  </main>
  ${FOOTER}
${shell.bodyEnd}
  <script>
    // The filter that used to live here rewrote the heading, the title and the URL on every
    // change, and every symptom reported against this page came out of it: the heading contradicted
    // the list, the counts followed the wrong number, the choice was lost on the click. It is gone.
    // Each service is a page now, so the URL carries the question and the HTML carries the answer.
    // This is only a bridge for links already out there with the old query string on them.
    (function () {
      var p = new URLSearchParams(window.location.search);
      var cat = p.get('cat');
      if (!cat) return;
      var chip = document.querySelector('.svc-chip[href^="/services/"][href*="/"][data-cat="' + cat + '"]');
      if (chip) { window.location.replace(chip.getAttribute('href')); return; }
      var el = document.getElementById('svc-' + cat);
      if (el) el.scrollIntoView();
      history.replaceState(null, '', window.location.pathname);
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTDIR, slug + '.html'), html);
  written.push({ slug, n: rows.length, indexable: isIndexable, title });
}

console.log(`Wrote ${written.length} city pages into services/: ${indexable} indexable, ${written.length - indexable} noindex (under ${MIN_INDEXABLE} providers).`);
console.log('  e.g. ' + written.filter((w) => w.indexable).slice(0, 4).map((w) => w.title).join(' | '));
fs.writeFileSync(path.join(ROOT, 'data', 'service-city-pages.json'), JSON.stringify(written, null, 1) + '\n');

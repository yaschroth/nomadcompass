require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds /services: a directory of local service providers indexed by the language they work in.
 *
 * The premise: finding a dentist is easy, finding a dentist who can understand what hurts is not.
 * You pick a city, a service and a language, and get providers whose language claim we can point
 * at a source for.
 *
 * Every card is rendered into the static HTML rather than injected by JS, so crawlers and answer
 * engines see the listings; the filters only show and hide what is already on the page. Every row
 * carries an evidence tier (official / self-declared / directory / visited) and a link to where the
 * language claim was read, because "they speak English" is exactly the kind of claim that rots.
 *
 * Data: data/service-languages.json. Declared in data/provenance.json as "service-languages".
 * Run the head/body sweeps (finish with apply_tools_nav.cjs) + sitemap after.
 * Usage: node scripts/build_services.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITY = {};
m.exports.forEach((c) => { if (c && c.id) CITY[c.id] = { name: c.name, country: c.country, iso: iso(c.flag) }; });

// inlineIcon, not icon(): the shared sprite /assets/icons.svg is served with
// Cache-Control max-age=604800, so every visitor who loaded the site in the past week still
// has the 39-symbol version cached, and a <use href="...#stethoscope"> into it renders
// nothing. Inlining costs about 12KB across the page and cannot go stale.
const { inlineIcon } = require(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'));
// Through the shared loader: the rows name their source by id and the shared sentence lives on
// the source record, so reading the JSON directly would give a row with no URL and half a note.
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
// City photos are reused from the city pages, so their credits come from the same manifest.
const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));

// A Maps *search*, not a claimed pin: we have not verified any listing's coordinates, and a
// search always resolves to something sensible even when the business has moved.
const mapsUrl = (p) => 'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent([p.name, p.area, CITY[p.city].name, CITY[p.city].country].filter(Boolean).join(', '));
const CATS = DB._categories;
const LANGS = DB._languages;
const EVIDENCE = DB._evidence;

const { CAT_ICON, CAT_PLURAL, EV_RANK, EV_LABEL } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

// The blocks the sweeps inject. Without them this generator loses six tracked features on every
// rebuild and only runs with --force, which is the guard switched off. See lib/page_shell.cjs.
const shell = require(path.join(ROOT, 'scripts', 'lib', 'page_shell.cjs'));

const providers = DB.providers.slice();
const bad = providers.filter((p) => !CITY[p.city] || !CATS[p.category] || !CAT_ICON[p.category] || !p.sourceUrl || !EVIDENCE[p.evidence] || !p.languages || !p.languages.length || p.languages.some((l) => !LANGS[l]));
if (bad.length) {
  console.error('REFUSED: ' + bad.length + ' row(s) in data/service-languages.json are unusable:');
  bad.forEach((p) => console.error('  - ' + (p.name || '(unnamed)') + ' [' + p.city + '/' + p.category + '] missing a known city, category, language or sourceUrl/evidence'));
  process.exit(1);
}

providers.sort((a, b) =>
  CITY[a.city].name.localeCompare(CITY[b.city].name) ||
  CATS[a.category].localeCompare(CATS[b.category]) ||
  (EV_RANK[a.evidence] - EV_RANK[b.evidence]) ||
  a.name.localeCompare(b.name));

// Only offer filter options that actually return something.
const usedCities = [...new Set(providers.map((p) => p.city))].sort((a, b) => CITY[a].name.localeCompare(CITY[b].name));
const usedCats = [...new Set(providers.map((p) => p.category))].sort((a, b) => CATS[a].localeCompare(CATS[b]));
const usedLangs = [...new Set(providers.flatMap((p) => p.languages))].sort((a, b) => LANGS[a].localeCompare(LANGS[b]));

// A typed field with suggestions, not a menu: 287 cities in a dropdown is a scroll, and everyone
// arrives already knowing which city they mean. The value is what a person would type, "Lisbon,
// Portugal", and the slug is carried alongside so the field can send you straight there.
const cityOptions = usedCities
  .map((c) => `<option data-slug="${c}" value="${esc(CITY[c].name)}, ${esc(CITY[c].country)}"></option>`).join('');
const cityLookup = Object.fromEntries(
  usedCities.map((c) => [(CITY[c].name + ', ' + CITY[c].country).toLowerCase(), c]));
const catOptions = usedCats.map((c) => `<option value="${c}">${esc(CATS[c])}</option>`).join('');
const langOptions = usedLangs.map((l) => `<option value="${l}">${esc(LANGS[l])}</option>`).join('');

function card(p) {
  const chips = p.languages.map((l) => `<span class="sv-lang">${esc(LANGS[l])}</span>`).join('');
  const host = (() => { try { return new URL(p.sourceUrl).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } })();
  const title = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="nofollow noopener">${esc(p.name)}</a>`
    : esc(p.name);
  // The city and its flag live on the section band above, so repeating them on every card
  // is noise. What the card owes you is: who, what kind, which languages, and on whose word.
  const meta = [esc(CATS[p.category]), p.area ? esc(p.area) : null].filter(Boolean).join('&nbsp;&middot; ');
  return `<article class="sv-card sv-c-${p.category}" data-city="${p.city}" data-cat="${p.category}" data-lang="${p.languages.join(' ')}" data-name="${esc(p.name.toLowerCase())}">
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

// Grouped by city: one photo band per city rather than a photo per card, which keeps the
// listing calm and means each city photo is credited once instead of 27 times.
function citySection(slug) {
  const rows = providers.filter((p) => p.city === slug);
  const c = CITY[slug];
  const a = ATTR[slug] || {};
  const img = fs.existsSync(path.join(ROOT, 'images', 'cities', slug + '-card.webp'))
    ? `<img class="sv-city-img" src="/images/cities/${slug}-card.webp" alt="${esc(a.alt || c.name)}" loading="lazy" decoding="async" width="800" height="532">`
    : '';
  const credit = a.author
    ? `<a class="sv-city-credit" href="${esc(a.sourcePageUrl || '#')}" target="_blank" rel="nofollow noopener">Photo: ${esc(a.author)} (${esc(a.license || '')})</a>`
    : '';
  const flag = c.iso ? `<img class="sv-city-flag" src="/assets/flags/${c.iso}.svg" alt="" width="26" height="20" loading="lazy">` : '';
  return `<section class="sv-city" data-city="${slug}" id="city-${slug}">
        <header class="sv-city-band">${img}
          <div class="sv-city-band-in">${flag}<h2>${esc(c.name)}<span>${esc(c.country)}</span></h2>
            <p class="sv-city-count" data-total="${rows.length}">${rows.length} provider${rows.length === 1 ? '' : 's'}</p>
          </div>${credit}
        </header>
        <div class="sv-grid">
      ${rows.map(card).join('\n      ')}
        </div>
      </section>`;
}
// The hub used to print all 1,002 providers, which made it a 1.9 MB page that Search Console
// recorded one impression for in three months. It is an index now: one card per city, linking to
// services/<city>, which is the page shaped like what people actually search for. citySection is
// kept because build_service_city_pages.cjs renders the same band on each city page.
function cityIndexCard(slug) {
  const rows = providers.filter((p) => p.city === slug);
  const c = CITY[slug];
  const langs = [...new Set(rows.flatMap((p) => p.languages))].sort((a, b) => LANGS[a].localeCompare(LANGS[b]));
  const cats = [...new Set(rows.map((p) => p.category))];
  const flag = c.iso ? `<img class="sv-ix-flag" src="/assets/flags/${c.iso}.svg" alt="" width="26" height="20" loading="lazy">` : '';
  // Five, not six. The binding constraint is not the phone, where the card is nearly full width and
  // everything fits on one row; it is the three-column desktop layout just above the grid's second
  // breakpoint, where the chip box narrows to 231px. Six languages plus the "+N" chip is seven
  // chips, which needs three rows there, and Kuala Lumpur, New Delhi, Singapore and Zagreb each
  // stood a row taller than every other card because of it.
  const shown = langs.slice(0, 5);
  const rest = langs.length - shown.length;
  /**
   * Two trays: who and where on top, what they work in underneath.
   *
   * The languages are the only reason this directory exists and they were the quietest thing on the
   * card, a row of unlabelled grey pills under a floating count. A reader saw "Danish English
   * German" and had to work out what the words were doing there. They have a tray of their own now,
   * with a line that says what they are, and the count has become a tile in the corner of the
   * identity row rather than a third line between the two.
   */
  const unit = rows.length === 1 ? 'provider' : 'providers';
  // A photograph on every card, not only the featured eight. Lazy, so the browser fetches the dozen
  // on screen rather than all 329, which is how /cities already carries 710 of these.
  const a = ATTR[slug] || {};
  const pic = fs.existsSync(path.join(ROOT, 'images', 'cities', slug + '-card.webp'))
    ? `<span class="sv-ix-pic"><img src="/images/cities/${slug}-card.webp" alt="${esc(a.alt || c.name)}" width="600" height="400" loading="lazy" decoding="async"></span>`
    : '<span class="sv-ix-pic sv-ix-pic-none"></span>';
  return `<a class="sv-ix" href="/services/${slug}" data-city="${slug}" data-n="${rows.length}" data-cats="${cats.join(' ')}" data-langs="${langs.join(' ')}" data-name="${esc((c.name + ' ' + c.country).toLowerCase())}">
        ${pic}
        <span class="sv-ix-head">${flag}<span class="sv-ix-name">${esc(c.name)}<span class="sv-ix-country">${esc(c.country)}</span></span><span class="sv-ix-count" data-total-n="${rows.length}" data-total-u="${unit}"><b class="sv-ix-n">${rows.length}</b><small class="sv-ix-unit">${unit}</small></span></span>
        <span class="sv-ix-tray"><span class="sv-ix-eyebrow">Works in</span><span class="sv-ix-langs">${shown.map((l) => `<span class="sv-lang">${esc(LANGS[l])}</span>`).join('')}${rest > 0 ? `<span class="sv-lang sv-lang-more">+${rest}</span>` : ''}</span></span>
      </a>`;
}
const cityIndex = usedCities.map(cityIndexCard).join('\n      ');

// The service hubs were reachable from almost nowhere: /services/hairdressers had one inbound link
// in the whole site, and neither this page nor any city page pointed at one. A page in the sitemap
// that nothing links to is a page we do not really publish. Only hubs that were written are listed.
const SERVICE_HUBS = (() => {
  const f = path.join(ROOT, 'data', 'service-hub-pages.json');
  if (!fs.existsSync(f)) return '';
  return JSON.parse(fs.readFileSync(f, 'utf8'))
    .sort((a, b) => b.n - a.n)
    // Three compartments, because the card holds three facts of different kinds: what it is, how
    // many providers, across how many cities. They used to share one undivided line with the count
    // written as a sentence and floated right, "2049 in 71 cities", which wrapped on the longer
    // labels and left every row of cards at a different height.
    .map((h) => `<a class="sv-hub" href="${h.url}"><span class="sv-hub-ico">${inlineIcon(CAT_ICON[h.service])}</span><span class="sv-hub-name">${esc(CATS[h.service])}</span><span class="sv-hub-stat"><b>${h.n.toLocaleString('en-US')}</b><small>${h.cities.toLocaleString('en-US')} ${h.cities === 1 ? 'city' : 'cities'}</small></span></a>`)
    .join('');
})();

// What each city holds, per service, per language, and per pair of the two. Without this the index
// answered a narrow question with a broad number: ask for therapists who work in German and every
// card still announced its total, so Barcelona claimed 147 providers when it holds four that match.
// The pairs are needed separately because a provider can carry two languages and must not be
// counted twice when only the service is chosen.
const COUNTS = {};
usedCities.forEach((slug) => {
  const rows = providers.filter((p) => p.city === slug);
  const c = {}; const l = {}; const pair = {};
  rows.forEach((p) => {
    c[p.category] = (c[p.category] || 0) + 1;
    p.languages.forEach((lang) => {
      l[lang] = (l[lang] || 0) + 1;
      pair[p.category + '|' + lang] = (pair[p.category + '|' + lang] || 0) + 1;
    });
  });
  COUNTS[slug] = { t: rows.length, c, l, p: pair };
});

/**
 * The eight cities the directory actually knows well, with their photographs.
 *
 * Coverage here is wildly uneven and the A-Z grid hides that completely: Madrid holds 952
 * providers, the median city holds five, and 67 hold exactly one. Every tile looking identical
 * made the page read as a spreadsheet of equals, which is both duller and less true than what
 * the data says. This band says it out loud before the grid begins.
 *
 * Ranked honestly by provider count, which makes the band all-European. That is the shape of the
 * dataset today rather than a curatorial choice, and picking cities for geographic spread would
 * be inventing a balance the directory does not have.
 */
const FEATURED = usedCities
  .map((slug) => {
    const rows = providers.filter((p) => p.city === slug);
    return {
      slug,
      n: rows.length,
      langs: new Set(rows.flatMap((p) => p.languages)).size,
      cats: new Set(rows.map((p) => p.category)).size,
    };
  })
  .sort((a, b) => b.n - a.n)
  .slice(0, 8);

const FEATURED_CARDS = FEATURED.map((f) => {
  const c = CITY[f.slug];
  const a = ATTR[f.slug] || {};
  const flag = c.iso ? `<img class="sv-ft-flag" src="/assets/flags/${c.iso}.svg" alt="" width="22" height="16" loading="lazy">` : '';
  return `<a class="sv-ft" href="/services/${f.slug}">
          <span class="sv-ft-pic"><img src="/images/cities/${f.slug}-card.webp" alt="${esc(a.alt || c.name)}" width="600" height="400" loading="lazy" decoding="async"></span>
          <span class="sv-ft-body">
            <span class="sv-ft-name">${flag}${esc(c.name)}<small>${esc(c.country)}</small></span>
            <span class="sv-ft-n"><b>${f.n.toLocaleString('en-US')}</b><small>providers</small></span>
            <span class="sv-ft-meta">${f.langs} languages &middot; ${f.cats} ${f.cats === 1 ? 'service' : 'services'}</span>
          </span>
        </a>`;
}).join('\n        ');

// CC BY and CC BY-SA both require naming the photographer wherever the photograph is shown. Eight
// cards is few enough to credit them all in one line rather than crowd each card with a byline.
const FEATURED_CREDIT = (() => {
  const seen = new Map();
  FEATURED.forEach((f) => {
    const a = ATTR[f.slug];
    if (!a || !a.author) return;
    const label = a.author + (a.license ? ' (' + a.license + ')' : '');
    if (!seen.has(label)) seen.set(label, a.sourcePageUrl || '');
  });
  if (!seen.size) return '';
  const parts = [...seen].map(([label, url]) => url
    ? `<a href="${esc(url)}" target="_blank" rel="nofollow noopener">${esc(label)}</a>`
    : esc(label));
  return `<p class="sv-ft-credit">Photos: ${parts.join(', ')}.</p>`;
})();

/**
 * Browse by language, which the page has never offered despite language being the whole premise.
 * Until now it linked only to cities and to service hubs, so the one axis a reader arrives with
 * ("I need someone who speaks Portuguese") was the one axis with no entry point.
 *
 * Tiles are written only for languages that have a landing page, so this cannot link into a 404.
 */
/**
 * A flag per language, where one country obviously owns it.
 *
 * Deliberately incomplete. Arabic is spoken across two dozen countries and picking one of their
 * flags to stand for the language would be a political statement rather than a label, so it gets
 * none. Russian has no flag in assets/flags because no Russian city is in the dataset. Both simply
 * render as the language name, and the tile is built to look right without one.
 */
const LANG_FLAG = {
  de: 'de', fr: 'fr', es: 'es', it: 'it', pt: 'pt', sv: 'se', zh: 'cn', pl: 'pl', nl: 'nl',
  ja: 'jp', vi: 'vn', el: 'gr', da: 'dk', th: 'th', hr: 'hr', id: 'id', ko: 'kr', cs: 'cz',
  hu: 'hu', ro: 'ro',
};

const LANGUAGE_TILES = (() => {
  const f = path.join(ROOT, 'data', 'service-language-pages.json');
  if (!fs.existsSync(f)) return '';
  return JSON.parse(fs.readFileSync(f, 'utf8'))
    // By providers, the number the tile shows large, so the big numerals actually descend down the
    // grid. Sorting by cities while displaying providers put 2,813 third and looked like an error.
    // Same order as the service tiles above, which rank by their own headline number too.
    .sort((a, b) => b.n - a.n || b.cities - a.cities)
    .map((l) => {
      const fl = LANG_FLAG[l.language];
      const flag = fl && fs.existsSync(path.join(ROOT, 'assets', 'flags', fl + '.svg'))
        ? `<img class="sv-lg-flag" src="/assets/flags/${fl}.svg" alt="" width="20" height="15" loading="lazy">`
        : '';
      return `<a class="sv-lg" href="${l.url}"><span class="sv-lg-name">${flag}${esc(l.label)}</span><span class="sv-lg-stat"><b>${l.n.toLocaleString('en-US')}</b><small>${l.cities.toLocaleString('en-US')} ${l.cities === 1 ? 'city' : 'cities'}</small></span></a>`;
    })
    .join('');
})();

// The nav is not built here. apply_tools_nav.cjs owns it, and a locally templated copy lost the
// Tools dropdown on every rebuild, which is one of the features _safe_write.cjs guards: the write
// was refused until --force was passed. Lifting it means this generator emits whatever the sweep
// last wrote and the guard stays on.
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/services" class="footer-link">Services by Language</a></li><li><a href="/timezones" class="footer-link">Time Zone Finder</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Find Local Services by Language', url: BASE + '/services', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Find dentists, doctors, hairdressers, lawyers and mechanics abroad who work in a language you speak, with the source for every language claim.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Services by Language', BASE + '/services']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const nCities = usedCities.length, nCats = usedCats.length, nLangs = usedLangs.length;
const evCounts = Object.keys(EV_RANK).map((k) => [k, providers.filter((p) => p.evidence === k).length]).filter(([, n]) => n);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Find Local Services in Your Language | The Nomad HQ</title>
  <meta name="description" content="Dentists, doctors, hairdressers, lawyers and mechanics abroad who work in a language you actually speak. Every language claim links to its source.">
  <link rel="canonical" href="${BASE}/services">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Find Local Services in Your Language | The Nomad HQ">
  <meta property="og:description" content="Find a dentist, doctor or hairdresser abroad who speaks your language, with a source for every claim.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/services">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/services-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    /* Same photo-hero pattern as the other tool pages (see build_timezones.cjs). */
    .hub-hero { position:relative; width:100%; min-height:100vh; display:flex; align-items:flex-end; overflow:hidden; }
    .hub-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .hub-hero-overlay { position:relative; z-index:1; width:100%; padding:calc(var(--nav-height,64px) + 3rem) 0 3rem; background:linear-gradient(to top, rgba(15,23,42,.94), rgba(15,23,42,.66) 55%, rgba(15,23,42,.15) 88%, transparent); color:#fff; }
    /* The nav is transparent with dark text until it scrolls, so a dark hero swallows the logo.
       Same light band every photo hero on the site uses, so the nav stays readable at scroll 0. */
    .hub-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:calc(var(--nav-height,64px) + 44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
    .hub-hero .container { max-width:1040px; }
    .sv-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
    .hub-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.5rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
    .hub-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0; max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
    /* Credits sit on photographs, so a faint white takes on the colour of whatever is behind
       it. They need near-opaque text on their own scrim to stay readable on any image. */
    .hub-hero a.hero-credit { position:absolute; right:.7rem; bottom:.5rem; z-index:2; font-size:.66rem; color:rgba(255,255,255,.92); text-decoration:none; background:rgba(15,23,42,.45); border-radius:6px; padding:.15rem .45rem; }
    .hub-hero a.hero-credit:hover { color:#fff; background:rgba(15,23,42,.72); text-decoration:underline; }
    /* --color-cream is pure #fff, so white cards on the page background did not read as
       separate objects. The listing sits on sand (the token is literally documented as
       "Cards, sections") and the cards stay white, which is what gives them an edge. */
    /* White. The sand ground was tried and the owner preferred white; with a photograph on every
       card the tiles no longer need a coloured ground to read as objects. */
    .sv-canvas { background:#fff; border-top:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-wrap { max-width:1080px; margin:0 auto; padding:2.5rem var(--space-4,1rem) 4rem; }
    .sv-controls { margin:0 0 2rem; display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; justify-content:center; background:#fff; border:1px solid #E0D5C2; border-radius:16px; padding:1.25rem 1.4rem; box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18); }
    .sv-field { display:flex; flex-direction:column; gap:.35rem; }
    .sv-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); }
    .sv-field select, .sv-field input { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff; color:var(--color-ink); min-width:180px; }
    .sv-field-city input { min-width:240px; }
    .sv-reset { font-family:inherit; font-size:.85rem; font-weight:600; color:var(--color-terracotta); background:none; border:none; cursor:pointer; text-decoration:underline; padding:.5rem 0; }
    .sv-count { text-align:center; font-size:.92rem; color:var(--color-stone); margin:1.5rem 0 1.5rem; } .sv-count b { color:var(--color-ink); }

    /* The featured band. Photographs only here, not on all 329 tiles: eight images a reader can
       take in, against a long index that stays fast and scannable. */
    .sv-ft-sec { margin:0 0 3rem; }
    .sv-ft-sec h2 { font-family:'DM Serif Display',serif; font-size:1.35rem; color:var(--color-ink); margin:0 0 .3rem; }
    .sv-ft-sec .sv-ft-lede { font-size:.92rem; line-height:1.6; color:var(--color-charcoal,#334155); margin:0 0 1.35rem; max-width:62ch; }
    .sv-ft-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(232px,1fr)); gap:1rem; }
    a.sv-ft:not(.btn):not(.nav-link) { display:flex; flex-direction:column; overflow:hidden; text-decoration:none;
      background:#fff; color:var(--color-ink); border:1px solid #E0D5C2; border-radius:var(--radius-md,8px);
      box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18);
      transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sv-ft:hover { border-color:var(--color-terracotta,#c0392b); transform:translateY(-2px);
      box-shadow:0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22); }
    .sv-ft-pic { display:block; height:124px; overflow:hidden; background:var(--color-sand,#f6f1e7); }
    .sv-ft-pic img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }
    a.sv-ft:hover .sv-ft-pic img { transform:scale(1.045); }
    .sv-ft-body { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:.2rem .7rem;
      align-items:center; padding:.75rem .9rem .85rem; }
    .sv-ft-name { grid-column:1; font-family:'DM Serif Display',serif; font-size:1.08rem; line-height:1.2;
      display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; min-width:0; }
    .sv-ft-name small { flex:0 0 100%; font-family:var(--font-sans,system-ui); font-size:var(--text-xs);
      font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--color-stone); }
    .sv-ft-flag { border-radius:2px; box-shadow:0 0 0 1px rgba(15,23,42,.12); flex:0 0 auto; }
    .sv-ft-n { grid-column:2; grid-row:1; display:flex; flex-direction:column; align-items:flex-end; }
    .sv-ft-n b { font-size:1.15rem; font-weight:800; line-height:1; color:var(--color-terracotta-dark,#a03325);
      font-variant-numeric:tabular-nums; }
    .sv-ft-n small { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--color-stone); }
    .sv-ft-meta { grid-column:1/-1; font-size:.75rem; color:var(--color-stone); padding-top:.35rem;
      border-top:1px solid var(--color-sand,#f0e9dc); margin-top:.35rem; }
    .sv-ft-credit { font-size:.72rem; line-height:1.6; color:var(--color-stone); margin:.9rem 0 0; }
    /* 329 thumbnails cannot each carry a byline, but CC BY still requires the photographer to be
       named somewhere the image is used, so this points at the page that does it per city. */
    .sv-grid-credit { font-size:.72rem; line-height:1.6; color:var(--color-stone); margin:1.4rem 0 0; text-align:center; }
    /* The credit is a citation, not a call to action. base.css paints links terracotta and beats a
       single class, so this needs the element in the selector to stay quiet. */
    .sv-ft-credit a, .sv-ft-credit a:visited { color:var(--color-stone); text-decoration:underline; text-decoration-color:var(--color-sand-dark,#E3D9C6); }
    .sv-ft-credit a:hover { color:var(--color-terracotta,#c0392b); }

    /* Browse by language, styled as a sibling of the service hubs rather than a new idea.
       NOT .sv-langs: that class already belongs to the chip bar on a provider card, is declared
       further down this stylesheet, and turned this whole section into a flex row of one column. */
    .sv-lgs { margin:0 0 3rem; }
    .sv-lgs h2 { font-family:'DM Serif Display',serif; font-size:1.35rem; color:var(--color-ink); margin:0 0 .3rem; }
    .sv-lgs .sv-lg-lede { font-size:.92rem; line-height:1.6; color:var(--color-charcoal,#334155); margin:0 0 1.35rem; max-width:62ch; }
    .sv-lgs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:.75rem; }
    a.sv-lg:not(.btn):not(.nav-link) { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:stretch;
      gap:0; padding:0; min-height:3.4rem; overflow:hidden; text-decoration:none;
      background:#fff; color:var(--color-ink); border:1px solid #E0D5C2; border-radius:var(--radius-md,8px);
      box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18);
      transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sv-lg:hover { border-color:var(--color-terracotta,#c0392b); transform:translateY(-2px);
      box-shadow:0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22); }
    /* The flag sits with the name and the row keeps its height whether or not there is one, so
       Arabic and Russian line up with the twenty that have flags. */
    .sv-lg-name { align-self:center; display:flex; align-items:center; gap:.45rem; padding:.6rem .8rem;
      font-weight:700; font-size:var(--text-sm); line-height:1.25; }
    .sv-lg-flag { flex:0 0 auto; border-radius:2px; box-shadow:0 0 0 1px rgba(15,23,42,.12); }
    .sv-lg-stat { display:flex; flex-direction:column; align-items:flex-end; justify-content:center;
      width:5.1rem; padding:.45rem .7rem; border-left:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-lg-stat b { font-size:.98rem; font-weight:800; line-height:1.15; color:var(--color-ink); font-variant-numeric:tabular-nums; }
    .sv-lg-stat small { font-size:.64rem; font-weight:600; color:var(--color-stone); white-space:nowrap; font-variant-numeric:tabular-nums; }
    @media (prefers-reduced-motion:reduce) { a.sv-ft, a.sv-lg { transition:none; } a.sv-ft:hover, a.sv-lg:hover { transform:none; } a.sv-ft:hover .sv-ft-pic img { transform:none; } }
    .sv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1.15rem; }
    .sv-city { margin:0 0 3.5rem; }
    .sv-city.is-hidden { display:none; }
    .sv-city-band { position:relative; display:flex; align-items:flex-end; min-height:148px; border-radius:16px; overflow:hidden; margin:0 0 1.1rem; background:var(--color-ink,#0f172a); }
    .sv-city-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .sv-city-band::after { content:''; position:absolute; inset:0; background:linear-gradient(100deg, rgba(15,23,42,.9) 0%, rgba(15,23,42,.7) 42%, rgba(15,23,42,.25) 100%); }
    .sv-city-band-in { position:relative; z-index:1; display:flex; align-items:center; gap:.7rem; padding:1.1rem 1.3rem; width:100%; flex-wrap:wrap; }
    .sv-city-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(255,255,255,.25); flex:0 0 auto; }
    .sv-city-band-in h2 { font-family:'DM Serif Display',serif; font-size:1.7rem; color:#fff; margin:0; line-height:1.1; }
    .sv-city-band-in h2 span { display:block; font-family:inherit; font-size:.78rem; font-weight:600; letter-spacing:.09em; text-transform:uppercase; color:rgba(255,255,255,.7); margin-top:.15rem; }
    .sv-city-count { margin-left:auto; font-size:.82rem; font-weight:600; color:#fff; background:rgba(255,255,255,.16); border-radius:999px; padding:.28rem .75rem; white-space:nowrap; }
    .sv-city-band a.sv-city-credit { position:absolute; right:.6rem; bottom:.45rem; z-index:2; font-size:.6rem; color:rgba(255,255,255,.9); text-decoration:none; background:rgba(15,23,42,.45); border-radius:5px; padding:.12rem .4rem; }
    .sv-city-band a.sv-city-credit:hover { color:#fff; background:rgba(15,23,42,.72); text-decoration:underline; }
    .sv-card { display:flex; flex-direction:column; background:#fff; border:1px solid #e7ded0; border-radius:14px; padding:1.2rem 1.3rem 1.05rem; box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18); transition:border-color .15s, box-shadow .15s, transform .15s; }
    .sv-card:hover { border-color:var(--color-terracotta); box-shadow:0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22); transform:translateY(-2px); }
    .sv-card.is-hidden { display:none; }
    /* base.css has a:not(.btn):not(.nav-link){color:terracotta} at specificity (0,2,1), which
       beats a plain class. Anything here that sets a link colour has to outrank that. */
    .sv-card .sv-name { font-family:'DM Serif Display',serif; font-size:1.15rem; font-weight:400; line-height:1.25; margin:0 0 .25rem; }
    .sv-card .sv-name, .sv-card .sv-name a { color:var(--color-ink); text-decoration:none; }
    .sv-card .sv-name a:hover { color:var(--color-terracotta); text-decoration:underline; }
    .sv-meta { font-size:.74rem; font-weight:600; letter-spacing:.02em; color:var(--color-stone); margin:0; }
    /* A hospital and a barber were indistinguishable at a glance. Each category gets a glyph
       and a hue, which is also what stops a column of cards reading as one grey block. */
    .sv-head { display:flex; align-items:flex-start; gap:.75rem; margin:0 0 .95rem; }
    .sv-head > div { min-width:0; }
    .sv-ico { flex:0 0 auto; width:38px; height:38px; border-radius:11px; display:grid; place-items:center; font-size:19px; }
    .sv-c-doctor .sv-ico { color:#0369a1; background:#e7f0f8; }
    .sv-c-dentist .sv-ico { color:#0e7490; background:#e3f1f4; }
    .sv-c-vet .sv-ico { color:#a16207; background:#f7f0df; }
    .sv-c-therapy .sv-ico { color:#7c3aed; background:#f0eafc; }
    .sv-c-physio .sv-ico { color:#4f46e5; background:#eceafc; }
    .sv-c-optician .sv-ico { color:#0f766e; background:#e4f2f0; }
    .sv-c-hair .sv-ico { color:#be185d; background:#fbe8f0; }
    .sv-c-legal .sv-ico { color:#475569; background:#eef1f5; }
    .sv-c-tax .sv-ico { color:#b45309; background:#f8efe2; }
    .sv-c-realestate .sv-ico { color:#7e22ce; background:#f4ecfd; }
    .sv-c-mechanic .sv-ico { color:#c2410c; background:#fbe9dd; }
    .sv-c-fitness .sv-ico { color:#15803d; background:#e6f3e9; }
    /* The languages are the entire point of this page, so they get the strongest block on the
       card, above the prose and well clear of the provenance footer. */
    .sv-langs { display:flex; flex-wrap:wrap; align-items:center; gap:.32rem; margin:0 0 .85rem; }
    .sv-lang-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.11em; color:var(--color-stone); margin-right:.15rem; }
    .sv-lang { background:#eef1f6; color:var(--color-ink); border-radius:6px; padding:.2rem .5rem; font-size:.79rem; font-weight:700; }
    .sv-note { font-size:.85rem; line-height:1.6; color:var(--color-charcoal); margin:0 0 1rem; }
    /* Never wrap: a long source host must ellipsize instead of pushing the actions onto a
       second line, which left some cards with a stranded, separator-less row of links. */
    .sv-foot { margin-top:auto; padding-top:.7rem; border-top:1px solid var(--color-sand,#f6f1e7); display:flex; align-items:center; justify-content:space-between; gap:.6rem; flex-wrap:nowrap; }
    .sv-src { display:flex; align-items:center; gap:.4rem; flex:1 1 auto; min-width:0; font-size:.7rem; color:var(--color-stone); margin:0; }
    .sv-card .sv-src a { color:var(--color-stone); text-decoration:underline; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sv-card .sv-src a:hover { color:var(--color-terracotta); }
    .sv-ev { flex:0 0 auto; font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; border-radius:5px; padding:.16rem .36rem; white-space:nowrap; }
    .sv-ev-official { color:#1c5c3c; background:#dff2e5; }
    .sv-ev-visited { color:#1c5c3c; background:#bfe8cf; }
    .sv-ev-self-declared { color:#8a5a00; background:#fbeecb; }
    .sv-ev-directory { color:#5c6672; background:#eceff3; }
    .sv-links { display:flex; align-items:center; gap:.75rem; margin:0; flex:0 0 auto; }
    .sv-card a.sv-go { font-size:.76rem; font-weight:700; color:var(--color-terracotta); text-decoration:none; white-space:nowrap; }
    .sv-card a.sv-go:hover { text-decoration:underline; }
    .sv-nogo { font-size:.76rem; color:var(--color-stone); }
    .sv-empty { text-align:center; padding:2.5rem 1rem; color:var(--color-stone); }
    .sv-empty.is-hidden { display:none; }
    /* The city index. Each card is a link to services/<city>, which is where the providers live. */
    .sv-hubs { margin:0 0 3rem; }
    .sv-hubs h2 { font-family:'DM Serif Display',serif; font-size:1.35rem; color:var(--color-ink); margin:0 0 1.5rem; }
    /* Both card families are compartmented: a hairline between facts of different kinds, and a
       fixed width on the cell that holds a number, so a long label can never push a count onto a
       second line and leave one card taller than the rest of its row. Numbers are tabular so that
       they line up down a column, which is what this page is really a table of. */
    .sv-hubs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:.75rem; }
    /* Same reason as the city cards below: at one width "Translators & interpreters" wraps to a
       second line and stands 6px taller than the other nine. The row is reserved so it cannot. */
    a.sv-hub:not(.btn):not(.nav-link) { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:stretch;
      gap:0; padding:0; min-height:3.75rem; overflow:hidden; background:#fff; color:var(--color-ink);
      border:1px solid #E0D5C2; border-radius:var(--radius-md,8px); text-decoration:none;
      box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18); transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sv-hub:hover { border-color:var(--color-terracotta,#c0392b); box-shadow:0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22); transform:translateY(-2px); }
    .sv-hub-ico { display:grid; place-items:center; width:2.9rem; background:#fff;
      border-right:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-hub svg { width:19px; height:19px; color:var(--color-terracotta-dark,#a03325); flex:0 0 auto; }
    .sv-hub-name { align-self:center; padding:.72rem .8rem; font-weight:700; font-size:var(--text-sm); line-height:1.25; }
    /* Sand on both flanks and white in the middle, so the card reads as the thing itself between two
       cells of chrome. The stat cell was a third, near-white tint and looked grubby rather than
       deliberate. */
    .sv-hub-stat { display:flex; flex-direction:column; align-items:flex-end; justify-content:center;
      width:5.8rem; padding:.5rem .7rem; background:#fff;
      border-left:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-hub-stat b { font-size:1.02rem; font-weight:800; line-height:1.15; color:var(--color-ink);
      font-variant-numeric:tabular-nums; }
    .sv-hub-stat small { font-size:.68rem; font-weight:600; color:var(--color-stone); white-space:nowrap;
      font-variant-numeric:tabular-nums; }
    /* stretch, not start. With align-items:start every card sized to its own content, so a city
       whose languages wrapped to a second chip row stood 33px taller than its neighbours and the
       grid came out ragged. Stretch makes each card fill its row; the tray below takes the slack. */
    .sv-ix-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(258px,1fr)); gap:1rem; align-items:stretch; }
    /* Two rows: the identity keeps its own height and the tray takes whatever is left, so a card
       standing next to a taller one grows its tray rather than opening a hole in the middle. */
    .sv-ix { display:grid; grid-template-rows:auto auto 1fr; gap:0; padding:0; overflow:hidden; background:#fff;
      border:1px solid #E0D5C2; border-radius:var(--radius-md,8px);
      box-shadow:0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18); text-decoration:none; transition:border-color .15s, box-shadow .15s, transform .15s; }
    .sv-ix:hover { border-color:var(--color-terracotta,#c0392b); box-shadow:0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22); transform:translateY(-2px); }
    .sv-ix.is-hidden { display:none; }
    /* The photo band. A fixed height, so a card with a photograph is exactly as tall as one whose
       image is missing, and the grid stays on one height the way it has to. */
    .sv-ix-pic { display:block; height:96px; overflow:hidden; background:var(--color-sand,#f6f1e7);
      border-bottom:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-ix-pic img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }
    .sv-ix:hover .sv-ix-pic img { transform:scale(1.045); }
    @media (prefers-reduced-motion:reduce) { .sv-ix:hover .sv-ix-pic img { transform:none; } }

    /* A minimum height on the identity row so a one-line city and a two-line one sit their count
       tiles at the same place across a row of cards: "Aix-en-Provence" used to push its own down. */
    .sv-ix-head { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center;
      gap:.62rem; padding:.9rem 1rem .95rem; min-height:5.7rem; }
    .sv-ix-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(15,23,42,.12); flex:0 0 auto; align-self:start; margin-top:.2rem; }
    .sv-ix-name { font-family:'DM Serif Display',serif; font-size:1.15rem; color:var(--color-ink); line-height:1.2;
      min-width:0; overflow-wrap:anywhere; }
    /* Nothing here shrinks a name to keep it on one line. Sizing by character count was tried and
       is not sound: the column width moves with the viewport, so the same name fits at 1280px and
       wraps at 874px, where three columns are at their narrowest. At that width "Belo Horizonte"
       wraps, and no character threshold catches that without shrinking names that never needed it.
       The head reserves two lines instead, so a name may wrap without changing the card's height. */
    .sv-ix-country { display:block; font-family:var(--font-sans,system-ui); font-size:var(--text-xs); font-weight:600;
      letter-spacing:.06em; text-transform:uppercase; color:var(--color-stone); margin-top:.15rem; }
    /* The count is a tile in the corner of the identity row, not a line of its own between the name
       and the languages, where it used to float with nothing to hold it. */
    .sv-ix-count { display:flex; flex-direction:column; align-items:center; justify-content:center;
      min-width:3.15rem; padding:.3rem .42rem; background:#fff;
      border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:var(--radius-sm,4px); }
    .sv-ix-n { font-size:1.05rem; font-weight:800; line-height:1; color:var(--color-terracotta-dark,#a03325);
      font-variant-numeric:tabular-nums; }
    .sv-ix-unit { margin-top:.12rem; font-size:.6rem; font-weight:700; text-transform:uppercase;
      letter-spacing:.05em; color:var(--color-stone); }
    /* The languages get a tray of their own, and a line saying what they are. */
    .sv-ix-tray { display:block; padding:.7rem 1rem .85rem; background:#fff;
      border-top:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-ix-eyebrow { display:block; margin:0 0 .42rem; font-size:.6rem; font-weight:700; text-transform:uppercase;
      letter-spacing:.11em; color:var(--color-stone); }
    /* Two chip rows' worth of height, always. Stretching alone only levels a card against others
       in ITS row, so a row where nothing wrapped still came out shorter than the row below it.
       Reserving the second row makes every card the same height across the whole grid, and a city
       with one row of languages simply has space under them. 62px is measured, not guessed: it is
       the tallest chip block on the page, two 29px chips with the .3rem gap between them. 73 of the
       329 cities need it. An earlier 3.05rem was short of that and left the grid in two heights. */
    .sv-ix-langs { display:flex; flex-wrap:wrap; align-content:flex-start; gap:.3rem; min-height:62px; }
    .sv-ix .sv-lang { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); }
    /* "+2" is a count of the languages that did not fit, not a language, so it does not wear their
       chip: no border, no white ground, just the number. */
    .sv-ix .sv-lang-more { background:transparent; border:0; color:var(--color-stone); font-weight:600;
      padding-left:.15rem; }
    @media (prefers-reduced-motion:reduce) { .sv-ix, a.sv-hub { transition:none; } .sv-ix:hover { transform:none; } }
    .sv-method { max-width:760px; margin:3rem auto 0; padding-top:1.75rem; border-top:1px solid var(--color-sand-dark,#E3D9C6); }
    .sv-method h2 { font-family:'DM Serif Display',serif; font-size:1.5rem; color:var(--color-ink); margin:0 0 1.25rem; }
    .sv-method p { font-size:.92rem; line-height:1.7; color:var(--color-charcoal); margin:0 0 .9rem; }
    .sv-tiers { list-style:none; padding:0; margin:0 0 1rem; }
    .sv-tiers li { font-size:.9rem; line-height:1.6; color:var(--color-charcoal); padding:.5rem 0; border-bottom:1px solid var(--color-sand,#f6f1e7); }
    .sv-tiers .sv-ev { margin:0 .5rem 0 0; }
    @media (max-width:640px) { .sv-field select, .sv-field input { min-width:0; width:100%; } .sv-field { width:100%; } }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/services-hero.webp" alt="Shop signs and street lamps lighting Shavteli Street in the old town of Tbilisi at night" fetchpriority="high" width="1920" height="1090">
      <div class="hub-hero-overlay"><div class="container">
        <span class="sv-eyebrow">Living-abroad tool</span>
        <h1>Find services in a language you speak</h1>
        <p class="sub">Finding a dentist is easy. Finding one who understands what hurts is not. This is a directory of local providers indexed by the language they work in, and every language claim links to the source we read it on.</p>
      </div></div>
      <a class="hero-credit" href="https://commons.wikimedia.org/wiki/File:Shavteli_Street_at_Night_,_Tbilisi_Georgia.jpg" target="_blank" rel="nofollow noopener">Photo: Shalika Malintha / Wikimedia Commons (CC BY 2.0), cropped</a>
    </header>
    <div class="sv-canvas">
    <div class="sv-wrap">
      <div class="sv-controls">
        <div class="sv-field sv-field-city"><label for="svCity">City</label><input type="search" id="svCity" list="svCityList" placeholder="Type a city&hellip;" autocomplete="off" aria-describedby="svCityHint"><datalist id="svCityList">${cityOptions}</datalist><span id="svCityHint" class="sr-only">Type to narrow the list below, or complete a city name to open its page</span></div>
        <div class="sv-field"><label for="svCat">Service</label><select id="svCat"><option value="all">Any service</option>${catOptions}</select></div>
        <div class="sv-field"><label for="svLang">Language</label><select id="svLang"><option value="all">Any language</option>${langOptions}</select></div>
        <button type="button" class="sv-reset" id="svReset">Reset</button>
      </div>
      <nav class="sv-hubs" id="by-service" aria-label="Browse by service">
        <h2>Browse by service</h2>
        <div class="sv-hubs-grid">${SERVICE_HUBS}</div>
      </nav>
${LANGUAGE_TILES ? `      <nav class="sv-lgs" id="by-language" aria-label="Browse by language">
        <h2>Browse by language</h2>
        <p class="sv-lg-lede">The language is usually what you arrive knowing. These are the ones the directory covers across enough cities to be worth a page of their own.</p>
        <div class="sv-lgs-grid">${LANGUAGE_TILES}</div>
      </nav>` : ''}
      <section class="sv-ft-sec" id="deepest" aria-label="Cities with the deepest coverage">
        <h2>Where the directory goes deepest</h2>
        <p class="sv-ft-lede">Coverage is uneven, and pretending otherwise would not help you. These eight cities hold the most providers we have sourced; most of the ${nCities} below hold a handful, and 67 hold exactly one.</p>
        <div class="sv-ft-grid">
        ${FEATURED_CARDS}
        </div>
        ${FEATURED_CREDIT}
      </section>
      <p class="sv-count" id="svCount">Showing all <b>${nCities}</b> cities, <b>${providers.length}</b> providers in total.</p>
      <div id="svGrid" class="sv-ix-grid">
      ${cityIndex}
      </div>
      <p class="sv-grid-credit">City photographs come from Wikimedia Commons under CC BY or CC BY-SA. Each one names its photographer and licence on that city's own page.</p>
      <div class="sv-empty is-hidden" id="svEmpty">
        <p>Nothing matches that combination yet.</p>
        <p>This directory is early and deliberately small: a provider only appears once we can point at a source for the language it works in. If you know one that belongs here, <a href="/contact">tell us</a> and include where the language is stated.</p>
      </div>

      <section class="sv-method">
        <h2>How to read this</h2>
        <p>Currently ${providers.length} providers across ${nCities} cities, ${nCats} service types and ${nLangs} languages. Nothing goes in without a source, and the source is named on every card.</p>
        <p><strong>Read the tier before you trust the row.</strong> Roughly half these listings now come from aggregator directories, and many of those make a claim about their whole roster ("our listed clinics speak English") rather than about the named business. We say so in the card's own words. A provider that states its languages on its own site is a stronger signal than one that appears on a list someone else curates, and a directory may sell placement.</p>
        <p>Each card carries a tier saying <em>how</em> we know, because that matters more than the claim itself:</p>
        <ul class="sv-tiers">
          ${Object.keys(EV_RANK).map((k) => `<li><span class="sv-ev sv-ev-${k}">${EV_LABEL[k]}</span>${esc(EVIDENCE[k])}</li>`).join('\n          ')}
        </ul>
        <p><strong>We have not visited or called any of these providers.</strong> Nothing here carries the "we confirmed" tier yet, so treat every entry as a claim someone else made, not a recommendation from us. A hospital advertising interpretation services is not the same as a doctor who speaks your language, and a directory listing may be paid placement on the directory's side.</p>
        <p>Where the German Embassy in Bangkok is the source, note their own wording: the list is published without guarantee of accuracy or service quality, and naming a doctor or hospital does not constitute an endorsement. The same caution applies to everything else on this page.</p>
        <p>No provider has paid to appear here, and there are no affiliate links in these listings. If that ever changes, paid placement will be labelled as paid.</p>
      </section>
    </div>
    </div>
  </main>
  ${FOOTER}
${shell.bodyEnd}
  <script>
    (function(){
      var grid=document.getElementById('svGrid'),count=document.getElementById('svCount'),empty=document.getElementById('svEmpty');
      var q=document.getElementById('svCity'),catSel=document.getElementById('svCat'),langSel=document.getElementById('svLang');
      var CITY_SLUG=${JSON.stringify(cityLookup)};
      var cards=[].slice.call(grid.querySelectorAll('.sv-ix'));
      var CAT_LABEL=${JSON.stringify(Object.fromEntries(usedCats.map((c) => [c, CATS[c]])))};
      var CAT_PLURAL=${JSON.stringify(Object.fromEntries(usedCats.map((c) => [c, CAT_PLURAL[c] || CATS[c].toLowerCase()])))};
      var LANG_LABEL=${JSON.stringify(Object.fromEntries(usedLangs.map((l) => [l, LANGS[l]])))};
      var COUNTS=${JSON.stringify(COUNTS)};
      var TOTAL=${providers.length};
      function has(el,attr,v){ return (' '+el.getAttribute(attr)+' ').indexOf(' '+v+' ')>-1; }
      function render(){
        var cat=catSel.value,lang=langSel.value,term=(q.value||'').trim().toLowerCase();
        var shown=0,rows=0;
        cards.forEach(function(el){
          var slug=el.getAttribute('data-city'),k=COUNTS[slug];
          // How many of this city's providers actually answer the question being asked. A city
          // whose match count is zero is hidden even if it holds the service and the language
          // separately: Barcelona has therapists and it has German, but not both in one provider.
          var n;
          if(cat!=='all'&&lang!=='all') n=k.p[cat+'|'+lang]||0;
          else if(cat!=='all') n=k.c[cat]||0;
          else if(lang!=='all') n=k.l[lang]||0;
          else n=k.t;
          var ok=n>0&&(!term||el.getAttribute('data-name').indexOf(term)>-1);
          el.classList.toggle('is-hidden',!ok);
          // The count tile holds the number and its unit in two elements, so the filter writes them
          // separately: putting "4 dentists" into one of them would have left the other showing the
          // word the card was built with.
          var cEl=el.querySelector('.sv-ix-count');
          var nEl=cEl.querySelector('.sv-ix-n'), uEl=cEl.querySelector('.sv-ix-unit');
          nEl.textContent=cat!=='all'?n:cEl.getAttribute('data-total-n');
          uEl.textContent=cat!=='all'
            ?(n===1?CAT_PLURAL[cat].replace(/s$/,''):CAT_PLURAL[cat])
            :cEl.getAttribute('data-total-u');
          // The filter travels with the click, so the city page opens on the same question.
          var qs=[];
          if(cat!=='all')qs.push('cat='+cat);
          if(lang!=='all')qs.push('lang='+lang);
          el.setAttribute('href','/services/'+slug+(qs.length?'?'+qs.join('&'):''));
          if(ok){shown++;rows+=n;}
        });
        var bits=[];
        if(cat!=='all')bits.push('with '+CAT_LABEL[cat]);
        if(lang!=='all')bits.push('working in '+LANG_LABEL[lang]);
        // The total belongs to an unfiltered page only. Typing a city and still being told about
        // 3,096 providers is the same false promise the per-city counts used to make.
        var filtered=cat!=='all'||lang!=='all'||!!term;
        count.innerHTML='Showing <b>'+shown+'</b> '+(shown===1?'city':'cities')+(bits.length?' '+bits.join(', '):'')
          +', <b>'+(filtered?rows:TOTAL)+'</b> providers'+(filtered?' in '+(shown===1?'it':'them'):' in total')+'.';
        empty.classList.toggle('is-hidden',shown>0);
        try{
          var u=new URL(window.location);
          [['cat',cat],['lang',lang]].forEach(function(p){ if(p[1]==='all')u.searchParams.delete(p[0]); else u.searchParams.set(p[0],p[1]); });
          history.replaceState(null,'',u);
        }catch(e){}
      }
      // Picking a city goes to that city's page rather than filtering this one down to a single
      // card: the city page is the thing worth landing on.
      function qs(){
        var p=[];
        if(catSel.value!=='all')p.push('cat='+catSel.value);
        if(langSel.value!=='all')p.push('lang='+langSel.value);
        return p.length?'?'+p.join('&'):'';
      }
      function go(slug){ window.location.href='/services/'+slug+qs(); }
      // Typing narrows the cards below. Completing a city, either from the browser's suggestions or
      // by hand, opens that city, because the city page is the thing worth landing on.
      q.addEventListener('input',function(){
        var slug=CITY_SLUG[(q.value||'').trim().toLowerCase()];
        if(slug){go(slug);return;}
        render();
      });
      // Enter on a narrowed-down list opens the one city left, so the keyboard never dead-ends.
      q.addEventListener('keydown',function(e){
        if(e.key!=='Enter')return;
        e.preventDefault();
        var slug=CITY_SLUG[(q.value||'').trim().toLowerCase()];
        if(!slug){
          var left=cards.filter(function(el){return !el.classList.contains('is-hidden');});
          if(left.length===1)slug=left[0].getAttribute('data-city');
        }
        if(slug)go(slug);
      });
      [catSel,langSel].forEach(function(s){s.addEventListener('change',render);});
      document.getElementById('svReset').addEventListener('click',function(){catSel.value='all';langSel.value='all';q.value='';render();});
      (function(){
        var sp=new URLSearchParams(window.location.search);
        function set(sel,v){ if(!v)return; for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){sel.value=v;return;} } }
        set(catSel,sp.get('cat'));set(langSel,sp.get('lang'));
        // ?city= used to filter this page; it now belongs to the city's own page.
        if(sp.get('city')&&document.querySelector('.sv-ix[data-city="'+sp.get('city')+'"]'))
          { window.location.replace('/services/'+sp.get('city')); return; }
        if(sp.get('cat')||sp.get('lang'))render();
      })();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'services.html'), html);
console.log(`Wrote services.html: ${providers.length} providers, ${nCities} cities, ${nCats} services, ${nLangs} languages.`);
console.log('  evidence: ' + evCounts.map(([k, n]) => k + ' ' + n).join(', '));

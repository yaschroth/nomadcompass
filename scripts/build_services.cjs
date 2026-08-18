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
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
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

const cityOptions = usedCities.map((c) => `<option value="${c}">${esc(CITY[c].name)}, ${esc(CITY[c].country)}</option>`).join('');
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
  // Six is as many chips as fit on one line on a phone; the rest are counted instead of listed.
  const shown = langs.slice(0, 6);
  const rest = langs.length - shown.length;
  return `<a class="sv-ix" href="/services/${slug}" data-city="${slug}" data-n="${rows.length}" data-cats="${cats.join(' ')}" data-langs="${langs.join(' ')}" data-name="${esc((c.name + ' ' + c.country).toLowerCase())}">
        <span class="sv-ix-top">${flag}<span class="sv-ix-name">${esc(c.name)}<span class="sv-ix-country">${esc(c.country)}</span></span></span>
        <span class="sv-ix-count" data-total="${rows.length} provider${rows.length === 1 ? '' : 's'}">${rows.length} provider${rows.length === 1 ? '' : 's'}</span>
        <span class="sv-ix-langs">${shown.map((l) => `<span class="sv-lang">${esc(LANGS[l])}</span>`).join('')}${rest > 0 ? `<span class="sv-lang sv-lang-more">+${rest}</span>` : ''}</span>
      </a>`;
}
const cityIndex = usedCities.map(cityIndexCard).join('\n      ');

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

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}">${t}</a></li>`).join('');
  return `<nav class="nav" id="mainNav"><div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">${li('nav-link')}</ul>
      <form class="nav-search" action="/cities" method="get" role="search"><input type="search" name="q" placeholder="Jump to a city&hellip;" aria-label="Search a city" autocomplete="off" list="navCityList"><datalist id="navCityList"></datalist></form>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div><div class="nav-mobile" id="navMobile"><ul class="nav-mobile-links">${li('nav-mobile-link')}</ul>
      </div></nav>
  <script>(function(){var n=document.getElementById('mainNav'),t=document.getElementById('navToggle'),mm=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');mm.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});window.addEventListener('scroll',function(){n.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}
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
    .sv-canvas { background:var(--color-sand,#f6f1e7); border-top:1px solid var(--color-sand-dark,#e3d9c6); }
    .sv-wrap { max-width:1080px; margin:0 auto; padding:2.5rem var(--space-4,1rem) 4rem; }
    .sv-controls { display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; justify-content:center; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.25rem 1.4rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .sv-field { display:flex; flex-direction:column; gap:.35rem; }
    .sv-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); }
    .sv-field select, .sv-field input { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff; color:var(--color-ink); min-width:180px; }
    .sv-reset { font-family:inherit; font-size:.85rem; font-weight:600; color:var(--color-terracotta); background:none; border:none; cursor:pointer; text-decoration:underline; padding:.5rem 0; }
    .sv-count { text-align:center; font-size:.92rem; color:var(--color-stone); margin:1.5rem 0 .8rem; } .sv-count b { color:var(--color-ink); }
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
    .sv-card { display:flex; flex-direction:column; background:#fff; border:1px solid #e7ded0; border-radius:14px; padding:1.2rem 1.3rem 1.05rem; box-shadow:0 1px 2px rgba(15,23,42,.04), 0 6px 16px rgba(15,23,42,.05); transition:border-color .15s, box-shadow .15s, transform .15s; }
    .sv-card:hover { border-color:var(--color-terracotta); box-shadow:0 12px 28px rgba(15,23,42,.12); transform:translateY(-2px); }
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
    .sv-ix-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; }
    .sv-ix { display:flex; flex-direction:column; gap:.55rem; padding:1.1rem 1.15rem; background:#fff;
      border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:var(--radius-md,8px);
      box-shadow:0 1px 2px rgba(15,23,42,.04); text-decoration:none; transition:border-color .15s, box-shadow .15s, transform .15s; }
    .sv-ix:hover { border-color:var(--color-terracotta,#c65d3b); box-shadow:0 6px 18px rgba(15,23,42,.09); transform:translateY(-2px); }
    .sv-ix.is-hidden { display:none; }
    .sv-ix-top { display:flex; align-items:center; gap:.6rem; }
    .sv-ix-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(15,23,42,.12); flex:0 0 auto; }
    .sv-ix-name { font-family:'DM Serif Display',serif; font-size:1.15rem; color:var(--color-ink); line-height:1.2; }
    .sv-ix-country { display:block; font-family:var(--font-sans,system-ui); font-size:var(--text-xs); font-weight:600;
      letter-spacing:.06em; text-transform:uppercase; color:var(--color-stone); margin-top:.15rem; }
    .sv-ix-count { font-size:var(--text-sm); color:var(--color-terracotta-dark,#a8492c); font-weight:600; }
    .sv-ix-langs { display:flex; flex-wrap:wrap; gap:.3rem; }
    .sv-ix .sv-lang-more { background:var(--color-sand,#f2e9da); color:var(--color-stone); }
    .sv-method { max-width:760px; margin:3rem auto 0; padding-top:1.75rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); }
    .sv-method h2 { font-family:'DM Serif Display',serif; font-size:1.5rem; color:var(--color-ink); margin:0 0 .8rem; }
    .sv-method p { font-size:.92rem; line-height:1.7; color:var(--color-charcoal); margin:0 0 .9rem; }
    .sv-tiers { list-style:none; padding:0; margin:0 0 1rem; }
    .sv-tiers li { font-size:.9rem; line-height:1.6; color:var(--color-charcoal); padding:.5rem 0; border-bottom:1px solid var(--color-sand,#f6f1e7); }
    .sv-tiers .sv-ev { margin:0 .5rem 0 0; }
    @media (max-width:640px) { .sv-field select, .sv-field input { min-width:0; width:100%; } .sv-field { width:100%; } }
  </style>
</head>
<body>
  ${navHtml()}
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
        <div class="sv-field"><label for="svCity">City</label><select id="svCity"><option value="all">Any city</option>${cityOptions}</select></div>
        <div class="sv-field"><label for="svCat">Service</label><select id="svCat"><option value="all">Any service</option>${catOptions}</select></div>
        <div class="sv-field"><label for="svLang">Language</label><select id="svLang"><option value="all">Any language</option>${langOptions}</select></div>
        <div class="sv-field"><label for="svQ">Search</label><input type="search" id="svQ" placeholder="Name contains..." autocomplete="off"></div>
        <button type="button" class="sv-reset" id="svReset">Reset</button>
      </div>
      <p class="sv-count" id="svCount">Showing all <b>${nCities}</b> cities, <b>${providers.length}</b> providers in total.</p>
      <div id="svGrid" class="sv-ix-grid">
      ${cityIndex}
      </div>
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
  <script>
    (function(){
      var grid=document.getElementById('svGrid'),count=document.getElementById('svCount'),empty=document.getElementById('svEmpty');
      var citySel=document.getElementById('svCity'),catSel=document.getElementById('svCat'),langSel=document.getElementById('svLang'),q=document.getElementById('svQ');
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
          var cEl=el.querySelector('.sv-ix-count');
          if(cat!=='all') cEl.textContent=n+' '+(n===1?CAT_PLURAL[cat].replace(/s$/,''):CAT_PLURAL[cat]);
          else cEl.textContent=cEl.getAttribute('data-total');
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
        count.innerHTML='Showing <b>'+shown+'</b> '+(shown===1?'city':'cities')+(bits.length?' '+bits.join(', '):'')
          +', <b>'+(bits.length?rows:TOTAL)+'</b> providers in total.';
        empty.classList.toggle('is-hidden',shown>0);
        try{
          var u=new URL(window.location);
          [['cat',cat],['lang',lang]].forEach(function(p){ if(p[1]==='all')u.searchParams.delete(p[0]); else u.searchParams.set(p[0],p[1]); });
          history.replaceState(null,'',u);
        }catch(e){}
      }
      // Picking a city goes to that city's page rather than filtering this one down to a single
      // card: the city page is the thing worth landing on.
      citySel.addEventListener('change',function(){
        if(citySel.value==='all')return;
        var qs=[];
        if(catSel.value!=='all')qs.push('cat='+catSel.value);
        if(langSel.value!=='all')qs.push('lang='+langSel.value);
        window.location.href='/services/'+citySel.value+(qs.length?'?'+qs.join('&'):'');
      });
      [catSel,langSel].forEach(function(s){s.addEventListener('change',render);});
      q.addEventListener('input',render);
      document.getElementById('svReset').addEventListener('click',function(){citySel.value='all';catSel.value='all';langSel.value='all';q.value='';render();});
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

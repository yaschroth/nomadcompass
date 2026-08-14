require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Builds index-alt.html: VERSION B, a complete alternative homepage design.
 *
 * Not a reskinned hero on the old body. Every section below the hero is new too: a city rail
 * instead of the card grid, a dark proof band, a statement block, and a closing CTA. The shape
 * follows a supplied travel-landing reference (rounded photo hero, badge chips, horizontal
 * picks rail, dark feature band, big centred statement, closing band) but uses this site's
 * type, palette, data and links, so it reads as The Nomad HQ rather than as someone's comp.
 *
 * Nav and footer are lifted from index.html at build time rather than duplicated, so the
 * sitewide sweeps (tools nav, analytics, footer legal) keep working on this page too.
 *
 * noindex, no canonical, absent from the sitemap: a review artefact, not a second homepage.
 *
 * Usage: node scripts/build_index_alt.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { stats } = require('./lib/site-stats.cjs');
const S = stats();

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const icon = (n, cls) => `<svg class="nh-icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="/assets/icons.svg#${n}"></use></svg>`;

// ---- data -------------------------------------------------------------------------------
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const overall = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); return n ? t / n : 0; };
const nscore = (c) => Math.max(2.5, Math.min(9.9, 6.9 + (overall(c) - 6.47) / 0.44 * 1.05));

const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));
const hasCard = (id) => fs.existsSync(path.join(ROOT, 'images', 'cities', id + '-card.webp'));
const RAIL = m.exports.slice().sort((a, b) => overall(b) - overall(a)).filter((c) => hasCard(c.id)).slice(0, 10);
// Three cities whose photo is embedded in the statement line; credited below it.
const INLINE = RAIL.slice(0, 3);

// ---- shell lifted from the live homepage ------------------------------------------------
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const grab = (re, what) => { const x = home.match(re); if (!x) throw new Error('could not lift ' + what + ' from index.html'); return x[0]; };
const NAV = grab(/<nav class="nav" id="mainNav">[\s\S]*?<\/nav>/, 'nav');
// The homepage's nav script is pretty-printed, not the minified one the tool generators emit,
// so match on the comment that precedes it rather than on its body.
const NAVJS = grab(/<!-- Navigation Script -->\s*<script>[\s\S]*?<\/script>/, 'nav script');
const FOOTER = grab(/<footer class="footer">[\s\S]*?<\/footer>/, 'footer');

const COMMONS = 'https://commons.wikimedia.org/wiki/File:Chureito_Pagoda_and_Mount_Fuji_20241022.jpg';

// ---- sections ---------------------------------------------------------------------------
const railCards = RAIL.map((c) => {
  const code = iso(c.flag);
  const flag = code ? `<img class="b-flag" src="/assets/flags/${code}.svg" alt="" width="20" height="15" loading="lazy">` : '';
  const cost = typeof c.costPerMonth === 'number' ? '$' + c.costPerMonth.toLocaleString('en-US') : 'n/a';
  return `          <li class="b-city">
            <a href="/cities/${c.id}">
              <span class="b-city-img"><img src="/images/cities/${c.id}-card.webp" alt="${esc(c.name)}, ${esc(c.country)}" loading="lazy" width="800" height="532"><span class="b-city-score">${nscore(c).toFixed(1)}</span></span>
              <span class="b-city-meta">${flag}${esc(c.country)}</span>
              <span class="b-city-name">${esc(c.name)}</span>
              <span class="b-city-cost">${cost}<small> / month</small></span>
            </a>
          </li>`;
}).join('\n');

const FEATURES = [
  ['scale', `${S.categories} scores per city`, `Cost, WiFi, safety, climate, visas and eight more, the same ${S.categories} categories for every city so two places can actually be compared.`],
  ['globe', `${S.cities} cities, ${S.countries} countries`, 'Not a top-ten list. A full index, including the places nobody else bothers to write up.'],
  ['gem', 'Free, no account', 'No sign-up, no paywall, no email gate. Everything on this site is readable by anyone, including machines.'],
  ['target', 'Built to be checked', 'Where a figure comes from a source we name it, and where it is our own judgement we say that instead.'],
].map(([ic, h, p]) => `            <li class="b-feature">
              <span class="b-feature-ico">${icon(ic)}</span>
              <h3>${h}</h3>
              <p>${p}</p>
            </li>`).join('\n');

const inlinePills = INLINE.map((c) => `<span class="b-pill"><img src="/images/cities/${c.id}-card.webp" alt="" loading="lazy" width="800" height="532"></span>`);
const inlineCredit = INLINE.map((c) => {
  const a = ATTR[c.id] || {};
  return a.author ? `${esc(c.name)}: ${esc(a.author)} (${esc(a.license || '')})` : null;
}).filter(Boolean).join(' &middot; ');

const CSS = `
    /* ============================================
       VERSION B  (index-alt.html only)
       A full alternative homepage. Namespaced .b- / .ha- so it cannot touch the live design.
       ============================================ */
    body.vb { background: var(--color-cream); }
    .vb .b-wrap { max-width: var(--container-max); margin: 0 auto; padding: 0 var(--space-4); }
    .vb .b-eyebrow {
      display: inline-flex; align-items: center; gap: .5rem; margin: 0 0 var(--space-4);
      padding: .35rem .85rem .35rem .6rem; border-radius: var(--radius-full);
      background: var(--color-sand); border: 1px solid var(--color-sand-dark);
      font-size: var(--text-xs); font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
      color: var(--color-charcoal);
    }
    .vb .b-eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-terracotta); }
    .vb .b-h2 { font-family: var(--font-display); font-size: var(--text-h2); line-height: 1.1; color: var(--color-ink); margin: 0 0 var(--space-3); text-wrap: balance; }
    .vb .b-lead { font-size: var(--text-lg); line-height: 1.65; color: var(--color-charcoal); margin: 0; max-width: 62ch; }

    /* --- hero ------------------------------------------------------------------------ */
    .ha-wrap { padding: calc(var(--nav-height) + var(--space-4)) var(--space-4) var(--space-6); }
    .ha-card { position: relative; border-radius: 28px; overflow: hidden; min-height: min(76vh, 720px);
      display: flex; align-items: flex-end; box-shadow: 0 24px 60px rgba(15,23,42,.22);
      max-width: var(--container-max); margin: 0 auto; }
    .ha-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    /* Light in the middle on purpose: a heavier wash erased Mount Fuji, which defeats the
       point of the photograph. Contrast for the copy comes from text-shadow instead. */
    .ha-card::after { content: ''; position: absolute; inset: 0; background:
      linear-gradient(100deg, rgba(9,17,33,.78) 0%, rgba(9,17,33,.34) 30%, rgba(9,17,33,.04) 55%, transparent 78%),
      linear-gradient(to top, rgba(9,17,33,.66) 0%, rgba(9,17,33,.12) 38%, transparent 58%); }
    .ha-inner { position: relative; z-index: 1; width: 100%; padding: clamp(1.5rem, 4vw, 3.25rem); color: #fff; }
    .ha-badge { display: inline-flex; align-items: center; gap: .5rem; margin: 0 0 var(--space-5);
      padding: .4rem .9rem .4rem .7rem; border-radius: var(--radius-full);
      background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.28);
      font-size: var(--text-xs); font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #fff; }
    .ha-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-accent-coral); flex: 0 0 auto; }
    .ha-h1 { font-family: var(--font-display); font-size: clamp(2.3rem, 6vw, 4rem); line-height: 1.06;
      margin: 0 0 var(--space-4); color: #fff; max-width: 16ch; text-shadow: 0 2px 30px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.4); }
    .ha-sub { font-size: var(--text-lg); line-height: 1.6; color: rgba(255,255,255,.9); margin: 0 0 var(--space-6);
      max-width: 52ch; text-shadow: 0 1px 16px rgba(0,0,0,.7), 0 1px 2px rgba(0,0,0,.45); }
    .ha-search { display: flex; align-items: center; gap: .5rem; background: rgba(255,255,255,.96);
      border-radius: var(--radius-full); padding: .45rem .45rem .45rem 1.1rem; max-width: 560px;
      box-shadow: 0 10px 30px rgba(9,17,33,.25); }
    .ha-search .nh-icon { width: 1.1rem; height: 1.1rem; color: var(--color-stone); flex: 0 0 auto; }
    .ha-search input { flex: 1 1 auto; min-width: 0; border: none; background: none; font-family: inherit;
      font-size: var(--text-base); color: var(--color-ink); padding: .55rem .2rem; }
    .ha-search input:focus { outline: none; }
    .ha-go { flex: 0 0 auto; border: none; cursor: pointer; font-family: inherit; font-size: var(--text-sm);
      font-weight: 600; color: #fff; background: var(--color-terracotta); border-radius: var(--radius-full);
      padding: .62rem 1.35rem; transition: background var(--transition-fast); }
    .ha-go:hover { background: var(--color-terracotta-dark); }
    .ha-chips { display: flex; flex-wrap: wrap; gap: .45rem; margin: var(--space-5) 0 0; padding: 0; list-style: none; }
    /* base.css has a:not(.btn):not(.nav-link){color:terracotta} at specificity (0,2,1), which
       beats a plain class. Every link colour on this page has to outrank that. */
    .ha-card .ha-chips a { display: inline-block; padding: .42rem .85rem; border-radius: var(--radius-full);
      background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); color: #fff;
      font-size: var(--text-sm); font-weight: 600; text-decoration: none; text-shadow: 0 1px 8px rgba(0,0,0,.35);
      transition: background var(--transition-fast), border-color var(--transition-fast); }
    .ha-card .ha-chips a:hover { background: rgba(255,255,255,.28); border-color: #fff; color: #fff; }
    .ha-stats { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1.4rem; list-style: none; margin: var(--space-6) 0 0; padding: 0; }
    .ha-stats li { display: flex; align-items: baseline; gap: .4rem; color: rgba(255,255,255,.88);
      font-size: var(--text-sm); text-shadow: 0 1px 10px rgba(0,0,0,.55); }
    .ha-stats b { font-family: var(--font-display); font-size: 1.45rem; font-weight: 400; color: #fff;
      font-variant-numeric: tabular-nums; text-shadow: 0 1px 12px rgba(0,0,0,.55); }
    .ha-card a.ha-credit { position: absolute; right: .85rem; bottom: .6rem; z-index: 2; font-size: .64rem;
      color: rgba(255,255,255,.88); text-decoration: none; background: rgba(9,17,33,.5); border-radius: 6px; padding: .18rem .5rem; }
    .ha-card a.ha-credit:hover { color: #fff; background: rgba(9,17,33,.75); }

    /* --- city rail -------------------------------------------------------------------- */
    .vb .b-rail-sec { padding: var(--space-16) 0 var(--space-12); }
    .vb .b-rail-head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap; margin: 0 0 var(--space-8); }
    .vb .b-rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr);
      gap: var(--space-4); overflow-x: auto; scroll-snap-type: x mandatory; padding: 0 0 var(--space-4);
      margin: 0; list-style: none; scrollbar-width: thin; }
    .vb .b-city { scroll-snap-align: start; }
    .vb .b-city a { display: block; text-decoration: none; color: var(--color-ink); }
    .vb .b-city-img { position: relative; display: block; border-radius: 18px; overflow: hidden; aspect-ratio: 4 / 3; background: var(--color-sand); }
    .vb .b-city-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform var(--transition-slow); }
    .vb .b-city a:hover .b-city-img img { transform: scale(1.05); }
    .vb .b-city-score { position: absolute; top: .6rem; right: .6rem; background: rgba(255,255,255,.94);
      color: var(--color-ink); font-family: var(--font-display); font-size: 1rem; line-height: 1;
      padding: .32rem .5rem; border-radius: 8px; box-shadow: var(--shadow-sm); }
    .vb .b-city-meta { display: flex; align-items: center; gap: .35rem; margin: .7rem 0 .15rem;
      font-size: var(--text-xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--color-stone); }
    .vb .b-flag { border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); display: inline-block; }
    .vb .b-city-name { display: block; font-family: var(--font-display); font-size: 1.3rem; line-height: 1.15; color: var(--color-ink); }
    .vb .b-city-cost { display: block; margin-top: .2rem; font-size: var(--text-sm); font-weight: 700; color: var(--color-terracotta); font-variant-numeric: tabular-nums; }
    .vb .b-city-cost small { font-weight: 400; color: var(--color-stone); }

    /* --- dark proof band -------------------------------------------------------------- */
    .vb .b-proof { background: linear-gradient(135deg, #0f172a 0%, #16233d 55%, #1d2f4d 100%); color: #fff;
      border-radius: 28px; padding: clamp(2rem, 5vw, 3.5rem); margin: var(--space-8) 0 var(--space-16); }
    .vb .b-proof-top { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-8); flex-wrap: wrap; margin: 0 0 var(--space-10); }
    .vb .b-proof .b-eyebrow { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.24); color: rgba(255,255,255,.9); }
    .vb .b-proof .b-eyebrow .dot { background: var(--color-accent-coral); }
    .vb .b-proof h2 { font-family: var(--font-display); font-size: var(--text-h2); line-height: 1.1; margin: 0; color: #fff; max-width: 18ch; }
    .vb .b-proof-aside { max-width: 44ch; }
    .vb .b-proof-aside p { color: rgba(255,255,255,.82); line-height: 1.7; margin: 0 0 var(--space-4); }
    .vb .b-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: var(--space-5); list-style: none; margin: 0; padding: 0; }
    .vb .b-feature { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); border-radius: 18px; padding: var(--space-5); }
    .vb .b-feature-ico { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;
      border-radius: 12px; background: rgba(255,255,255,.12); color: #fff; font-size: 20px; margin: 0 0 var(--space-4); }
    .vb .b-feature h3 { font-size: var(--text-base); font-weight: 600; color: #fff; margin: 0 0 .4rem; }
    .vb .b-feature p { font-size: var(--text-sm); line-height: 1.6; color: rgba(255,255,255,.72); margin: 0; }

    /* --- statement -------------------------------------------------------------------- */
    .vb .b-statement { text-align: center; padding: 0 0 var(--space-16); }
    .vb .b-statement h2 { font-family: var(--font-display); font-size: clamp(1.9rem, 4.6vw, 3rem); line-height: 1.28;
      color: var(--color-ink); margin: 0 auto var(--space-6); max-width: 26ch; }
    .vb .b-pill { display: inline-block; vertical-align: middle; width: clamp(58px, 8vw, 96px); aspect-ratio: 16 / 10;
      border-radius: var(--radius-full); overflow: hidden; margin: 0 .15em; box-shadow: var(--shadow-sm); }
    .vb .b-pill img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .vb .b-statement-note { font-size: var(--text-sm); color: var(--color-stone); margin: 0 auto; max-width: 60ch; }
    .vb .b-photo-credit { display: block; margin-top: var(--space-3); font-size: .68rem; color: var(--color-stone); }

    /* --- closing band ----------------------------------------------------------------- */
    .vb .b-cta { position: relative; overflow: hidden; border-radius: 28px; margin: 0 0 var(--space-16);
      background: linear-gradient(120deg, #1b2a44 0%, #0f172a 65%); color: #fff;
      padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 3.5rem); text-align: center; }
    .vb .b-cta::before { content: ''; position: absolute; right: -8%; top: -40%; width: 46%; height: 180%;
      background: radial-gradient(circle at center, rgba(192,57,43,.32), transparent 68%); pointer-events: none; }
    .vb .b-cta > * { position: relative; z-index: 1; }
    .vb .b-cta h2 { font-family: var(--font-display); font-size: clamp(1.9rem, 4.4vw, 2.9rem); line-height: 1.12;
      margin: 0 auto var(--space-4); color: #fff; max-width: 20ch; }
    .vb .b-cta p { color: rgba(255,255,255,.82); font-size: var(--text-lg); line-height: 1.6; margin: 0 auto var(--space-8); max-width: 54ch; }
    .vb .b-cta-btns { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
    .vb .b-cta .btn-ghost { color: #fff; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.06); }
    .vb .b-cta .btn-ghost:hover { background: rgba(255,255,255,.16); border-color: #fff; color: #fff; }

    @media (max-width: 767px) {
      .ha-wrap { padding: calc(var(--nav-height) + var(--space-3)) var(--space-3) var(--space-5); }
      .ha-card { border-radius: 20px; min-height: 82vh; }
      /* A portrait crop of a 16:9 photo centres on empty sky and loses both the mountain and
         the pagoda. Bias the crop right and down so the subject survives. */
      .ha-img { object-position: 64% 58%; }
      .ha-h1 { max-width: none; }
      .ha-search { max-width: none; padding-left: .9rem; }
      .ha-go { padding: .6rem 1rem; }
      .ha-stats { gap: .35rem 1rem; }
      .ha-stats b { font-size: 1.2rem; }
      .vb .b-rail { grid-auto-columns: minmax(210px, 1fr); }
      .vb .b-rail-sec { padding: var(--space-10) 0 var(--space-8); }
      .vb .b-proof, .vb .b-cta { border-radius: 20px; }
    }
`;

const BODY = `  <main id="main-content" tabindex="-1">

    <section class="ha-wrap">
      <div class="ha-card">
        <img class="ha-img" src="/assets/fuji-hero.webp" alt="Mount Fuji seen across Fujiyoshida from Arakurayama Sengen Park, with the red Chureito Pagoda and autumn trees in the foreground" fetchpriority="high" width="1920" height="1080">
        <div class="ha-inner">
          <p class="ha-badge"><span class="dot"></span>The digital nomad city index</p>
          <h1 class="ha-h1">Find the best cities for digital nomads</h1>
          <p class="ha-sub">Every city scored on the ${S.categories} things that decide whether a place actually works for remote life: cost of living, WiFi, safety, climate, visas and more.</p>
          <form class="ha-search" action="/cities" method="get" role="search">
            ${icon('compass')}
            <label class="sr-only" for="haCity">Search a city</label>
            <input type="search" id="haCity" name="q" placeholder="Lisbon, Chiang Mai, Medellin&hellip;" autocomplete="off">
            <button type="submit" class="ha-go">Search</button>
          </form>
          <ul class="ha-chips">
            <li><a href="/best/best-digital-nomad-cities-in-europe">Europe</a></li>
            <li><a href="/best/best-digital-nomad-cities-in-asia">Asia</a></li>
            <li><a href="/best/best-digital-nomad-cities-in-latin-america">Latin America</a></li>
            <li><a href="/best/best-digital-nomad-cities-in-north-america">North America</a></li>
            <li><a href="/best/best-digital-nomad-cities-in-africa">Africa</a></li>
            <li><a href="/best/best-digital-nomad-cities-in-oceania">Oceania</a></li>
          </ul>
          <ul class="ha-stats">
            <li><b><span data-stat="cities">${S.cities}</span></b> cities rated</li>
            <li><b><span data-stat="countries">${S.countries}</span></b> countries</li>
            <li><b><span data-stat="categories">${S.categories}</span></b> scores per city</li>
            <li><b><span data-stat="rankings">${S.rankings}</span></b> rankings</li>
          </ul>
        </div>
        <a class="ha-credit" href="${COMMONS}" target="_blank" rel="nofollow noopener">Photo: Supanut Arunoprayote / Wikimedia Commons (CC BY 4.0), cropped</a>
      </div>
    </section>

    <section class="b-rail-sec">
      <div class="b-wrap">
        <div class="b-rail-head">
          <div>
            <p class="b-eyebrow"><span class="dot"></span>Top rated right now</p>
            <h2 class="b-h2">The cities scoring highest today</h2>
            <p class="b-lead">Ranked by Nomad Score, our composite of all ${S.categories} categories. Every card opens a full guide with the score breakdown, monthly costs and neighbourhoods.</p>
          </div>
          <a href="/cities" class="btn btn-secondary">Browse all cities &rarr;</a>
        </div>
        <ul class="b-rail">
${railCards}
        </ul>
      </div>
    </section>

    <div class="b-wrap">
      <section class="b-proof">
        <div class="b-proof-top">
          <div>
            <p class="b-eyebrow"><span class="dot"></span>A better way to choose</p>
            <h2>Comparable numbers, not a listicle</h2>
          </div>
          <div class="b-proof-aside">
            <p>Most "best cities" articles are one person's holiday. This is an index: the same categories applied to every city, so the comparison actually means something.</p>
            <a href="/about" class="btn btn-primary">How we score &rarr;</a>
          </div>
        </div>
        <ul class="b-features">
${FEATURES}
        </ul>
      </section>

      <section class="b-statement">
        <h2>Real numbers ${inlinePills[0]} for the city you ${inlinePills[1]} actually move to</h2>
        <p class="b-statement-note">${S.cities} cities across ${S.countries} countries, ${S.rankings} rankings and ${S.tools} free tools, from a route planner to a visa finder.<span class="b-photo-credit">Photos: ${inlineCredit} &middot; Wikimedia Commons</span></p>
      </section>

      <section class="b-cta">
        <h2>Ready to find your next base?</h2>
        <p>Answer a few questions about what matters to you and the Wheel ranks all ${S.cities} cities against your priorities. No account, no email.</p>
        <div class="b-cta-btns">
          <a href="/wheel" class="btn btn-primary btn-lg">Find my city &rarr;</a>
          <a href="/compare" class="btn btn-lg btn-ghost">Compare two cities</a>
        </div>
      </section>
    </div>

  </main>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Version B: alternative homepage design | The Nomad HQ (internal preview)</title>
  <meta name="description" content="Internal design review page. An alternative homepage layout for The Nomad HQ.">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/fuji-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <style>${CSS}  </style>
</head>
<body class="vb">
  <a href="#main-content" class="skip-link">Skip to main content</a>
${NAV}
${NAVJS}
${BODY}
${FOOTER}
  <script src="/cities-data.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index-alt.html'), html);
console.log(`index-alt.html (Version B) written: ${Math.round(html.length / 1024)}KB, ${RAIL.length} cities in the rail.`);

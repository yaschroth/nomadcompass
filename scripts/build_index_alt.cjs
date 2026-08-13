/**
 * Builds index-alt.html: the homepage with an alternative hero, for side-by-side review.
 * Everything below the hero is the live homepage untouched. Marked noindex so it can be
 * deployed for review without entering the index or competing with the real homepage.
 *
 * Node, not PowerShell: Get-Content/Set-Content mangle non-ASCII.
 * Usage: node scripts/build_index_alt.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const CSS = `
    /* ============================================
       ALTERNATIVE HERO (index-alt.html only)
       Photo-card treatment: full-bleed image in a rounded card, left-aligned copy over a
       side scrim, a working city search on the bar, and region chips that link to real
       ranking pages. Namespaced .ha- so none of it touches the live hero above.
       ============================================ */
    .ha-wrap {
      padding: calc(var(--nav-height) + var(--space-4)) var(--space-4) var(--space-6);
    }

    .ha-card {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      min-height: min(76vh, 720px);
      display: flex;
      align-items: flex-end;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
      max-width: var(--container-max);
      margin: 0 auto;
    }

    .ha-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Two scrims: one from the left for the copy, one from the bottom for the search bar.
       Deliberately light in the middle: Mount Fuji sits behind the headline and a heavier
       wash erased it, which defeats the point of choosing this photograph. The copy gets its
       contrast from text-shadow plus the concentrated bottom-left gradient instead. */
    .ha-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(100deg, rgba(9, 17, 33, 0.78) 0%, rgba(9, 17, 33, 0.34) 30%, rgba(9, 17, 33, 0.04) 55%, transparent 78%),
        linear-gradient(to top, rgba(9, 17, 33, 0.66) 0%, rgba(9, 17, 33, 0.12) 38%, transparent 58%);
    }

    .ha-inner {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: clamp(1.5rem, 4vw, 3.25rem);
      color: #fff;
    }

    .ha-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 var(--space-5);
      padding: 0.4rem 0.9rem 0.4rem 0.7rem;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.28);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fff;
    }

    .ha-badge .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-accent-coral);
      flex: 0 0 auto;
    }

    .ha-h1 {
      font-family: var(--font-display);
      font-size: clamp(2.3rem, 6vw, 4rem);
      line-height: 1.06;
      margin: 0 0 var(--space-4);
      color: #fff;
      max-width: 16ch;
      text-shadow: 0 2px 30px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .ha-sub {
      font-size: var(--text-lg);
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 var(--space-6);
      max-width: 52ch;
      text-shadow: 0 1px 16px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.45);
    }

    .ha-search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.96);
      border-radius: var(--radius-full);
      padding: 0.45rem 0.45rem 0.45rem 1.1rem;
      max-width: 560px;
      box-shadow: 0 10px 30px rgba(9, 17, 33, 0.25);
    }

    .ha-search .nh-icon {
      width: 1.1rem;
      height: 1.1rem;
      color: var(--color-stone);
      flex: 0 0 auto;
    }

    .ha-search input {
      flex: 1 1 auto;
      min-width: 0;
      border: none;
      background: none;
      font-family: inherit;
      font-size: var(--text-base);
      color: var(--color-ink);
      padding: 0.55rem 0.2rem;
    }

    .ha-search input:focus { outline: none; }

    .ha-go {
      flex: 0 0 auto;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 600;
      color: #fff;
      background: var(--color-terracotta);
      border-radius: var(--radius-full);
      padding: 0.62rem 1.35rem;
      transition: background var(--transition-fast);
    }

    .ha-go:hover { background: var(--color-terracotta-dark); }

    /* Every chip goes to a ranking page that actually exists, so the row is navigation
       rather than decoration. */
    .ha-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin: var(--space-5) 0 0;
      padding: 0;
      list-style: none;
    }

    /* base.css has a:not(.btn):not(.nav-link){color:terracotta} at specificity (0,2,1), which
       beats a plain class. Anything setting a link colour on this page has to outrank it or
       the chips and the credit come out terracotta on the photograph. */
    .ha-card .ha-chips a {
      display: inline-block;
      padding: 0.42rem 0.85rem;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }

    .ha-card .ha-chips a:hover {
      background: rgba(255, 255, 255, 0.28);
      border-color: #fff;
      color: #fff;
    }

    .ha-stats {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1.4rem;
      list-style: none;
      margin: var(--space-6) 0 0;
      padding: 0;
    }

    .ha-stats li {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      color: rgba(255, 255, 255, 0.88);
      font-size: var(--text-sm);
      text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55);
    }

    .ha-stats b {
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 400;
      color: #fff;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
    }

    .ha-card a.ha-credit {
      position: absolute;
      right: 0.85rem;
      bottom: 0.6rem;
      z-index: 2;
      font-size: 0.64rem;
      color: rgba(255, 255, 255, 0.88);
      text-decoration: none;
      background: rgba(9, 17, 33, 0.5);
      border-radius: 6px;
      padding: 0.18rem 0.5rem;
    }

    .ha-card a.ha-credit:hover { color: #fff; background: rgba(9, 17, 33, 0.75); }

    @media (max-width: 767px) {
      .ha-wrap { padding: calc(var(--nav-height) + var(--space-3)) var(--space-3) var(--space-5); }
      .ha-card { border-radius: 20px; min-height: 82vh; }
      /* A portrait crop of a 16:9 photo centres on empty sky and loses both the mountain and
         the pagoda. Bias the crop right and down so the subject survives. */
      .ha-img { object-position: 64% 58%; }
      .ha-h1 { max-width: none; }
      .ha-search { max-width: none; padding-left: 0.9rem; }
      .ha-go { padding: 0.6rem 1rem; }
      .ha-stats { gap: 0.35rem 1rem; }
      .ha-stats b { font-size: 1.2rem; }
    }
`;

const REGIONS = [
  ['/best/best-digital-nomad-cities-in-europe', 'Europe'],
  ['/best/best-digital-nomad-cities-in-asia', 'Asia'],
  ['/best/best-digital-nomad-cities-in-latin-america', 'Latin America'],
  ['/best/best-digital-nomad-cities-in-north-america', 'North America'],
  ['/best/best-digital-nomad-cities-in-africa', 'Africa'],
  ['/best/best-digital-nomad-cities-in-oceania', 'Oceania'],
];

const COMMONS = 'https://commons.wikimedia.org/wiki/File:Chureito_Pagoda_and_Mount_Fuji_20241022.jpg';

const HERO = `    <section class="ha-wrap">
      <div class="ha-card">
        <img class="ha-img" src="/assets/fuji-hero.webp" alt="Mount Fuji seen across Fujiyoshida from Arakurayama Sengen Park, with the red Chureito Pagoda and autumn trees in the foreground" fetchpriority="high" width="1920" height="1080">
        <div class="ha-inner">
          <p class="ha-badge"><span class="dot"></span>The digital nomad city index</p>
          <h1 class="ha-h1">Find the best cities for digital nomads</h1>
          <p class="ha-sub">Every city scored on the 13 things that decide whether a place actually works for remote life: cost of living, WiFi, safety, climate, visas and more.</p>
          <form class="ha-search" action="/cities" method="get" role="search">
            <svg class="nh-icon" aria-hidden="true"><use href="/assets/icons.svg#compass"></use></svg>
            <label class="sr-only" for="haCity">Search a city</label>
            <input type="search" id="haCity" name="q" placeholder="Lisbon, Chiang Mai, Medellin&hellip;" autocomplete="off" list="haCityList">
            <datalist id="haCityList"></datalist>
            <button type="submit" class="ha-go">Search</button>
          </form>
          <ul class="ha-chips">
${REGIONS.map(([h, t]) => `            <li><a href="${h}">${t}</a></li>`).join('\n')}
          </ul>
          <ul class="ha-stats">
            <li><b><span data-stat="cities">710</span></b> cities rated</li>
            <li><b><span data-stat="countries">121</span></b> countries</li>
            <li><b><span data-stat="categories">13</span></b> scores per city</li>
            <li><b><span data-stat="rankings">32</span></b> rankings</li>
          </ul>
        </div>
        <a class="ha-credit" href="${COMMONS}" target="_blank" rel="nofollow noopener">Photo: Supanut Arunoprayote / Wikimedia Commons (CC BY 4.0), cropped</a>
      </div>
    </section>`;

let out = src;

// 1. Swap the hero section.
const heroRe = /    <section class="hero">[\s\S]*?<\/section>/;
if (!heroRe.test(out)) throw new Error('hero section not found');
out = out.replace(heroRe, HERO);

// 2. Add the alternative hero CSS at the end of the inline style block.
out = out.replace(/\n  <\/style>/, CSS + '\n  </style>');

// 3. Keep it out of the index: this is a design variant, not a second homepage.
if (/<meta name="robots"[^>]*>/.test(out)) {
  out = out.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">');
} else {
  out = out.replace(/(<meta name="viewport"[^>]*>)/, '$1\n  <meta name="robots" content="noindex, nofollow">');
}
// A canonical pointing at / would contradict noindex on a page that is deliberately different.
out = out.replace(/\n\s*<link rel="canonical"[^>]*>/, '');
// Preload the hero this page actually paints, not the homepage watercolour.
out = out.replace(/<link rel="preload" as="image" href="\/images\/extended_surf_4000\.webp"[^>]*>/,
  '<link rel="preload" as="image" href="/assets/fuji-hero.webp" fetchpriority="high">');
out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>Design variant: photo hero | The Nomad HQ (internal preview)</title>');

fs.writeFileSync(path.join(ROOT, 'index-alt.html'), out);
console.log('index-alt.html written,', Math.round(out.length / 1024) + 'KB');

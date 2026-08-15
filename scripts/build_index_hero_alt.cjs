require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Builds index-hero-alt.html: the homepage with its hero restyled to the .hub-hero pattern that
 * /best, /activities, /map, /route, /services and six more pages already share, for review
 * side by side with the live homepage.
 *
 * Only the hero changes. Everything below it is the live homepage, because that is the whole
 * question being asked: does the front page look better wearing the same hero as the rest of
 * the site?
 *
 * The background image stays exactly as it is. .page-bg is a fixed full-page layer carrying
 * images/extended_surf_4000.webp, and this hero deliberately does NOT add a .hub-hero-img of its
 * own: it lets that layer show through and puts only the shared overlay gradient on top. So the
 * watercolour is untouched and the hero gets the other pages' treatment of it.
 *
 * noindex, no canonical, absent from the sitemap: a review artefact, not a second homepage.
 *
 * Usage: node scripts/build_index_hero_alt.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// The hero's three city tiles are generated into index.html by apply_home_hero_cards.cjs. Lift
// them rather than regenerate, so the two pages can never disagree about which cities they show.
const picks = src.match(/<!-- hero-cards-start -->([\s\S]*?)<!-- hero-cards-end -->/);
if (!picks) throw new Error('hero-cards markers not found in index.html');

const HERO = `    <header class="hub-hero hero-alt">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">The digital nomad city index</span>
        <h1>Find the best cities for digital nomads</h1>
        <p class="sub">The Nomad HQ helps digital nomads find the city that actually fits their life.</p>
        <form class="hero-search" action="/cities" method="get" role="search" data-city-search>
          <label class="sr-only" for="heroCity">Search a city</label>
          <input type="search" id="heroCity" name="q" placeholder="Lisbon, Chiang Mai, Medell&iacute;n&hellip;" autocomplete="off">
          <button type="submit" class="hero-go" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
        </form>
        <ul class="hero-picks">
${picks[1].trimEnd()}
        </ul>
      </div></div>
    </header>`;

const CSS = `
    /* ============================================
       HERO VARIANT (index-hero-alt.html only)
       Wears the shared .hub-hero from base.css. Only the parts that pattern has no opinion about
       are set here: the search field and the three city tiles, both of which now sit on a dark
       scrim rather than on the light page.
       ============================================ */
    .hero-alt .container { max-width: var(--container-max); }

    /* The shared overlay is tuned for a dark photograph. Over this watercolour, which is pale,
       it lands too light and the coral eyebrow drops to about 2:1 against it. Same gradient,
       same shape, deepened so the text band reads the way it does on the other pages. */
    .hero-alt .hub-hero-overlay {
      background: linear-gradient(to top,
        rgba(15, 23, 42, .96) 0%,
        rgba(15, 23, 42, .82) 42%,
        rgba(15, 23, 42, .42) 74%,
        rgba(15, 23, 42, .10) 92%,
        transparent 100%);
    }
    /* The overlay stretches with its content, so on a narrow viewport the eyebrow rides up into
       the pale part of the watercolour. Carrying its own shadow costs nothing and keeps the
       image lighter than deepening the gradient again would. */
    .hero-alt .hub-eyebrow { text-shadow: 0 1px 3px rgba(0, 0, 0, .65), 0 1px 16px rgba(0, 0, 0, .5); }

    .hero-alt .hero-search { max-width: 560px; margin: var(--space-6) 0 0; }
    /* The tiles are already dark photographs, so they only need laying out in a row here. */
    .hero-alt .hero-picks {
      flex-direction: row;
      margin: var(--space-6) 0 0;
      gap: var(--space-4);
    }
    .hero-alt .hero-picks > li { flex: 1 1 0; min-width: 0; }
    .hero-alt .hero-pick { height: 116px; }
    .hero-alt .hero-pick-climate { display: none; }
    .hero-alt .hero-picks a.hero-pick .hero-pick-name { font-size: 1.2rem; }

    @media (max-width: 900px) {
      .hero-alt .hero-picks { flex-direction: column; }
      .hero-alt .hero-picks > li { flex: 1 1 auto; }
    }
`;

let out = src;

// 1. Swap the hero. Everything else on the page is left alone.
const heroRe = /    <section class="hero">[\s\S]*?<\/section>/;
if (!heroRe.test(out)) throw new Error('hero section not found in index.html');
out = out.replace(heroRe, HERO);

// 2. Variant CSS at the end of the inline style block.
out = out.replace(/\n  <\/style>/, CSS + '\n  </style>');

// 3. Keep it out of the index.
if (/<meta name="robots"[^>]*>/.test(out)) {
  out = out.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">');
} else {
  out = out.replace(/(<meta name="viewport"[^>]*>)/, '$1\n  <meta name="robots" content="noindex, nofollow">');
}
// A canonical pointing at / would contradict noindex on a page that is deliberately different.
out = out.replace(/\n\s*<link rel="canonical"[^>]*>/, '');
out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>Hero variant: the shared site hero | The Nomad HQ (internal preview)</title>');

fs.writeFileSync(path.join(ROOT, 'index-hero-alt.html'), out);
console.log('index-hero-alt.html written, ' + Math.round(out.length / 1024) + 'KB');

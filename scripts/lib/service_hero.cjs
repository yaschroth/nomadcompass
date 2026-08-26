/**
 * The photo hero the services directory wears, matching /cities/<city> and /services.
 *
 * Those two already had it: a full-bleed photograph, a dark gradient rising from the bottom, and
 * the title, standfirst and a strip of figures sitting on the gradient. The five service families
 * below /services had a breadcrumb, a serif h1 on white and a paragraph, which is a different site.
 *
 * Every one of the 329 cities the directory covers has a hero image already, in the three sizes
 * /cities uses, so a city-scoped page can carry its own city rather than a stock photograph. The
 * ten service hubs and the thirty-two service-and-language pages are about 84 cities at once, so
 * they carry /assets/services-hero.webp, the image their parent /services already uses. Putting
 * Madrid on a page about 84 cities would be prettier and would be a lie.
 *
 * All of them are 100vh. `size` no longer changes the height, only the type: 'full' is for a page
 * that is an index and nothing else (the service hubs, the service-and-language pages), whose h1
 * is a short phrase and can be set large. The default is for the three families that carry
 * provider listings, whose h1 is a long sentence naming a city, a service and up to six languages,
 * and which needs the smaller size to stay to three lines.
 *
 * Usage:  const H = require('./lib/service_hero.cjs');
 *         ... <style> ${H.css} </style>
 *         ${H.hero({ crumbs, eyebrow, h1, sub, stats, image, size:'band' })}
 */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const css = `
    /* Every hero fills the screen, as /cities/<city> and /services do. The listing families were
       on a shorter band so the providers would start higher; measured, that gave 72% of the
       viewport on one page and 88% on another, because the band's max was under the content's own
       height and the hero simply grew to fit. Two thirds of a screen and seven eighths of a screen
       do not read as a decision, they read as a mistake, so they are all 100vh now. */
    .sv-hero { position:relative; width:100%; display:flex; align-items:flex-end; overflow:hidden;
      min-height:100vh; }
    .sv-hero-pic { display:contents; }
    .sv-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    /* Light wash at the top so the dark nav stays legible over a bright photograph. */
    .sv-hero::before { content:''; position:absolute; top:0; left:0; right:0; z-index:1; pointer-events:none;
      height:calc(var(--nav-height,64px) + 44px);
      background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
    /* The darkening covers the whole photograph, not just the block the text sits in. Scoped to the
       content's own height it left the breadcrumb and the eyebrow on bare photograph, and the
       services hero is a lit street at night: white 12px type on a shop sign is unreadable.
       This is the gradient /cities/<city> uses, at inset 0, for the same reason. */
    /* The scrim belongs to the TEXT BLOCK, not to the hero box.
       Covering the whole hero was the obvious thing and it was wrong twice over. Calibrated for a
       100vh hero it left the breadcrumb on bare sky: 1.62:1 over Lisbon's haze, 1.02:1 over
       Madrid's. Turned up until those passed, it buried the photograph, and a hero whose picture
       you cannot see is not the thing that was asked for.
       On the block it tracks the text wherever the text goes, so a four-line title carries its own
       darkening up with it instead of climbing out of a fixed ramp. The block also carries
       nav-height + 2.5rem of padding above the breadcrumb, so the gradient can fade to .42 at its
       own top edge, which is soft against the photograph, and still be about .72 where the
       breadcrumb actually sits, 15% lower down. Measured on both skies. Madrid's white sky is the
       binding case and came to 4.53:1 at .70 there, which is over the line by 0.03 and no use
       across 329 cities whose skies vary; .76 puts it near 5. */
    /*
       The last two stops exist only to kill the edge: ending the ramp at .42 put a visible step
       across the photograph where the block began. .16 meets what the ::after whisper is already
       doing there, so the two blend. Neither stop is anywhere near the text. */
    .sv-hero-in { position:relative; z-index:1; width:100%; color:#fff;
      padding:calc(var(--nav-height,64px) + 2.5rem) 0 2.4rem;
      background:linear-gradient(to top, rgba(15,23,42,.96) 0%, rgba(15,23,42,.86) 65%,
        rgba(15,23,42,.76) 82%, rgba(15,23,42,.42) 93%, rgba(15,23,42,.16) 100%); }
    /* A whisper over the rest of the picture, so the top of the frame is not brighter than the nav. */
    .sv-hero::after { content:''; position:absolute; inset:0; z-index:0; pointer-events:none;
      background:linear-gradient(to top, transparent 55%, rgba(15,23,42,.22) 100%); }
    .sv-hero-full .sv-hero-in { padding:calc(var(--nav-height,64px) + 3rem) 0 3rem; }
    /* No max-width of its own. The hero used to cap at 1040 while the page below it used the site
       container, so the h1 started 115px to the right of the chips underneath it. */
    .sv-hero-crumbs { font-size:var(--text-sm); color:rgba(255,255,255,.8); margin:0 0 .7rem;
      text-shadow:0 1px 10px rgba(0,0,0,.4); }
    .sv-hero-crumbs a { color:rgba(255,255,255,.86); text-decoration:none; }
    .sv-hero-crumbs a:hover { color:#fff; text-decoration:underline; }
    .sv-hero-eyebrow { display:inline-flex; align-items:center; gap:.45rem; margin:0 0 .7rem;
      font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em;
      /* #ff8863, which /services uses, measures 3.67:1 on the brightest pixel of this photograph
         and 12px uppercase is small text, so it needed 4.5:1 and did not have it. #ffb199 measures
         4.92:1 on the same pixel. A text-shadow does not count toward contrast. */
      color:#ffb199; text-shadow:0 1px 10px rgba(0,0,0,.35); }
    .sv-hero-eyebrow img { border-radius:2px; box-shadow:0 0 0 1px rgba(255,255,255,.35); }
    .sv-hero-eyebrow svg { width:16px; height:16px; }
    .sv-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(1.9rem,4.6vw,3.1rem); line-height:1.08;
      margin:0 0 .8rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.4); text-wrap:balance; max-width:22ch; }
    .sv-hero-full h1 { font-size:clamp(2.1rem,5.5vw,3.5rem); }
    .sv-hero-sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0;
      max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.35); }
    /* The figures the page is built on, in the same strip position the city pages use. */
    .sv-hero-stats { display:flex; flex-wrap:wrap; gap:1.6rem; margin:1.5rem 0 0; }
    .sv-hero-stat { display:flex; flex-direction:column; }
    .sv-hero-stat b { font-family:'DM Serif Display',serif; font-size:var(--text-xl); font-weight:400;
      color:#fff; line-height:1.2; font-variant-numeric:tabular-nums; text-shadow:0 1px 12px rgba(0,0,0,.35); }
    /* .5 measures 4.33:1 where the strip actually sits. .62 measures 5.62:1 there. */
    .sv-hero-stat small { margin-top:2px; font-size:.6875rem; text-transform:uppercase; letter-spacing:.06em;
      color:rgba(255,255,255,.62); }
    .sv-hero a.hero-credit { position:absolute; right:.7rem; bottom:.5rem; z-index:2; font-size:.66rem;
      color:rgba(255,255,255,.92); text-decoration:none; background:rgba(15,23,42,.45);
      border-radius:6px; padding:.15rem .45rem; }
    .sv-hero a.hero-credit:hover { color:#fff; background:rgba(15,23,42,.72); text-decoration:underline; }
    @media (max-width:640px) {
      .sv-hero-stats { gap:.9rem 1.3rem; }
      .sv-hero h1 { max-width:none; }
    }`;

/**
 * A city's own photograph, in the three sizes /cities already ships.
 * `attr` is the record from images/cities/attribution.json.
 */
const cityImage = (slug, name, attr = {}) => ({
  picture: `<picture class="sv-hero-pic">`
    + `<source media="(max-width:640px)" srcset="/images/cities/${slug}-m.webp">`
    + `<source media="(max-width:1100px)" srcset="/images/cities/${slug}-t.webp">`
    + `<img class="sv-hero-img" src="/images/cities/${slug}.webp" alt="${esc(attr.alt || name)}"`
    + ` fetchpriority="high" decoding="async" width="1920" height="1275">`
    + `</picture>`,
  credit: attr.author
    ? `<a class="hero-credit" href="${esc(attr.sourcePageUrl || '#')}" target="_blank" rel="nofollow noopener">`
      + `Photo: ${esc(attr.author)}${attr.license ? ' (' + esc(attr.license) + ')' : ''}</a>`
    : '',
});

/** The directory's own image, for the pages that are about many cities at once. */
const sectionImage = () => ({
  picture: `<picture class="sv-hero-pic">`
    + `<img class="sv-hero-img" src="/assets/services-hero.webp"`
    + ` alt="Shop signs and street lamps lighting Shavteli Street in the old town of Tbilisi at night"`
    + ` fetchpriority="high" decoding="async" width="1920" height="1090"></picture>`,
  credit: `<a class="hero-credit" href="https://commons.wikimedia.org/wiki/File:Shavteli_Street_at_Night,_Tbilisi,_Georgia.jpg"`
    + ` target="_blank" rel="nofollow noopener">Photo: Diego Delso (CC BY-SA 4.0)</a>`,
});

/**
 * crumbs: already-escaped HTML for the breadcrumb line, or ''
 * eyebrow: already-escaped HTML (a flag and a country, or an icon and a label)
 * h1, sub: plain text, escaped here
 * stats: [[value, label], ...]
 * image: { picture, credit } from cityImage or sectionImage
 * size: 'full' for an index page, anything else for a page carrying listings
 */
const hero = ({ crumbs = '', eyebrow = '', h1, sub = '', stats = [], image, size = 'band' }) =>
  `<header class="sv-hero${size === 'full' ? ' sv-hero-full' : ''}">
      ${image.picture}
      <div class="sv-hero-in"><div class="container">
        ${crumbs ? `<p class="sv-hero-crumbs">${crumbs}</p>` : ''}
        ${eyebrow ? `<span class="sv-hero-eyebrow">${eyebrow}</span>` : ''}
        <h1>${esc(h1)}</h1>
        ${sub ? `<p class="sv-hero-sub">${esc(sub)}</p>` : ''}
        ${stats.length ? `<div class="sv-hero-stats">${stats
    .map(([v, l]) => `<div class="sv-hero-stat"><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join('')}</div>` : ''}
      </div></div>
      ${image.credit}
    </header>`;

module.exports = { css, hero, cityImage, sectionImage, esc };

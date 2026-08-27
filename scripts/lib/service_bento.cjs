/**
 * The compartmented box the services directory is built from, in one place.
 *
 * /services got this treatment first: a card is not a padded rectangle with everything stacked
 * inside it, it is a small grid of cells with a hairline between them, so the name, the count and
 * the languages are three things a reader can find rather than three lines to read through. The
 * five service page families were still on the flat version, a 1px border and no shadow, and a
 * count that floated at the end of the name with nothing holding it.
 *
 * This lives in a lib because the CSS for those families was copied five times. svp-chips was
 * already defined twice with the two copies drifting, which is how a design ends up meaning five
 * slightly different things on five pages that link to each other.
 *
 * Two shapes, matching the two on /services:
 *
 *   card  (.sb-card)   the .sv-ix shape: an identity row that keeps its own height, holding a name
 *                      and a count tile, over a tray with a top border, an eyebrow and its content.
 *   chip  (.sb-chip)   the .sv-hub shape: a label cell and a count cell with a hairline between
 *                      them, so the number is a compartment rather than a word at the end.
 *
 * Colours and shadows are copied from build_services.cjs deliberately rather than re-picked. The
 * shadow is two layers because one was invisible: a single 0 8px 20px -8px has a negative spread
 * and the darkest pixel it produced against the page measured rgb(253,253,253).
 *
 * Usage:  const B = require('./lib/service_bento.cjs');
 *         ...  <style> ${B.css} </style>
 *         B.chip({ href, label, n })  B.cardHead({ name, sub, n, unit })  B.tray(eyebrow, inner)
 *         B.cityTile({ href, slug, name, country, iso, n, unit, index, eyebrow, trayInner })
 *         B.hub({ href, icon, name, n, sub })   ... plus B.revealJs once per page that uses tiles
 */

const fs = require('fs');
const path = require('path');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SHADOW = '0 3px 6px rgba(15,23,42,.10), 0 14px 32px rgba(15,23,42,.18)';
const SHADOW_HOVER = '0 6px 14px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.22)';
const EDGE = '#E0D5C2';
const RULE = 'var(--color-sand-dark,#E3D9C6)';

const css = `
    /* ---- the compartmented card, shared with .sv-ix on /services ---- */
    .sb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(272px,1fr)); gap:1rem; align-items:start; }
    a.sb-card:not(.btn):not(.nav-link) { display:grid; grid-template-rows:auto auto; gap:0; padding:0; overflow:hidden;
      background:#fff; color:var(--color-ink); text-decoration:none;
      border:1px solid ${EDGE}; border-radius:var(--radius-md,8px); box-shadow:${SHADOW};
      transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sb-card:hover { border-color:var(--color-terracotta,#c0392b); box-shadow:${SHADOW_HOVER}; transform:translateY(-2px); }
    /* A floor on the identity row so a one-line name and a two-line one sit their count tiles at the
       same height across a row: "Santiago de Compostela" used to push its own down. */
    .sb-head { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:.62rem;
      padding:.85rem .95rem .9rem; min-height:3.9rem; }
    .sb-name { font-family:'DM Serif Display',serif; font-size:1.08rem; color:var(--color-ink); line-height:1.2;
      min-width:0; overflow-wrap:anywhere; }
    .sb-sub { display:block; font-family:var(--font-sans,system-ui); font-size:var(--text-xs); font-weight:600;
      letter-spacing:.06em; text-transform:uppercase; color:var(--color-stone); margin-top:.15rem; }
    /* The count is a tile in the corner of the identity row, not a number trailing the name. */
    .sb-count { display:flex; flex-direction:column; align-items:center; justify-content:center;
      min-width:3.05rem; padding:.3rem .42rem; background:#fff;
      border:1px solid ${RULE}; border-radius:var(--radius-sm,4px); }
    .sb-count b { font-size:1.02rem; font-weight:800; line-height:1; color:var(--color-terracotta-dark,#a03325);
      font-variant-numeric:tabular-nums; }
    .sb-count small { margin-top:.12rem; font-size:.6rem; font-weight:700; text-transform:uppercase;
      letter-spacing:.05em; color:var(--color-stone); }
    .sb-tray { display:block; padding:.65rem .95rem .8rem; background:#fff; border-top:1px solid ${RULE}; }
    .sb-eyebrow { display:block; margin:0 0 .4rem; font-size:.6rem; font-weight:700; text-transform:uppercase;
      letter-spacing:.11em; color:var(--color-stone); }
    .sb-tray-text { display:block; font-size:var(--text-xs); color:var(--color-stone); line-height:1.45; }
    /* A ratio the reader would otherwise have to work out. Madrid holds 146 of the 763 translators
       we list there and Alicante 40 of 120, which is 19% against 33%: the same two numbers, a
       different answer. The bar is the comparison; the figures under it are the evidence. */
    .sb-bar { display:block; height:5px; margin:0 0 .38rem; border-radius:3px;
      background:var(--color-sand,#f2ece0); overflow:hidden; }
    .sb-bar i { display:block; height:100%; background:var(--color-terracotta,#c0392b); }
    .sb-figs { display:flex; align-items:baseline; justify-content:space-between; gap:.5rem;
      font-size:var(--text-xs); color:var(--color-stone); }
    .sb-figs b { font-weight:700; color:var(--color-ink); font-variant-numeric:tabular-nums; }
    .sb-langs { display:flex; flex-wrap:wrap; gap:.3rem; }
    /* A language and its count are two cells of one chip, so the eye can run down the numbers. */
    .sb-lang { display:inline-flex; align-items:stretch; overflow:hidden; background:#fff;
      border:1px solid ${RULE}; border-radius:var(--radius-sm,4px); font-size:.72rem; line-height:1; }
    .sb-lang i { font-style:normal; padding:.26rem .4rem; font-weight:700; color:var(--color-ink); }
    .sb-lang b { padding:.26rem .38rem; font-weight:700; color:var(--color-stone);
      border-left:1px solid ${RULE}; font-variant-numeric:tabular-nums; }
    /* "+3" counts the languages that did not fit. It is not a language, so it does not wear their
       chip: no border, no ground. It does take their height, because a lone "+1" wrapping onto a
       line of its own otherwise reads as something dropped rather than something meant. */
    .sb-lang-more { display:inline-flex; align-items:center; padding:.26rem .1rem .26rem .25rem;
      font-size:.72rem; line-height:1; font-weight:600; color:var(--color-stone); }

    /* ---- the compartmented chip, shared with .sv-hub on /services ---- */
    /* No margin here. The list resets exist for the one chip row that is a <ul> (the language
       facets on a city page); putting them on .sb-chips put "margin:0" later in the cascade than
       every family's own rule at the same specificity, so .svp-chips, .svp-langbar and .svc-chips
       all silently lost their spacing and butted straight into whatever followed. Margin is the
       family's business. */
    .sb-chips { display:flex; flex-wrap:wrap; gap:.5rem; }
    ul.sb-chips { padding:0; list-style:none; }
    a.sb-chip:not(.btn):not(.nav-link), span.sb-chip, li.sb-chip, button.sb-chip { display:inline-grid;
      grid-template-columns:auto auto; align-items:stretch; gap:0; padding:0; overflow:hidden;
      background:#fff; color:var(--color-ink); text-decoration:none; font-family:inherit;
      border:1px solid ${EDGE}; border-radius:var(--radius-md,8px); box-shadow:${SHADOW};
      transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sb-chip:hover, button.sb-chip:hover { border-color:var(--color-terracotta,#c0392b);
      box-shadow:${SHADOW_HOVER}; transform:translateY(-1px); }
    .sb-chip-label { align-self:center; padding:.44rem .68rem; font-weight:700; font-size:var(--text-sm); line-height:1.25; }
    /* A <li> is a label, not a link. Wearing the same shadow as the chips below it made the
       language counts look clickable, which they are not. */
    li.sb-chip { box-shadow:none; border-color:${RULE}; }
    .sb-chip-n { display:flex; align-items:center; padding:.44rem .6rem; background:#fff;
      border-left:1px solid ${RULE}; font-size:.72rem; font-weight:700; color:var(--color-stone);
      font-variant-numeric:tabular-nums; }
    @media (prefers-reduced-motion:reduce) {
      a.sb-card, a.sb-chip, button.sb-chip { transition:none; }
      a.sb-card:hover, a.sb-chip:hover, button.sb-chip:hover { transform:none; }
    }

    /* ---- the photographed city tile, the full .sv-ix shape from /services ----
       The plain .sb-card above is the same card without a picture. These declarations are copied
       from build_services.cjs rather than re-picked: the two pages sit one click apart and a tile
       that is 4px shorter or a shade lighter on one of them reads as a different component. */
    .sb-card-pic { grid-template-rows:auto auto 1fr; }
    /* A fixed height, so a card whose photograph is missing is exactly as tall as one that has it. */
    .sb-pic { display:block; height:96px; overflow:hidden; background:var(--color-sand,#f6f1e7);
      border-bottom:1px solid ${RULE}; }
    .sb-pic img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }
    a.sb-card:hover .sb-pic img { transform:scale(1.045); }
    /* The flag sits outside the name so a wrapping name does not push it off its line. */
    .sb-card-pic .sb-head { grid-template-columns:auto minmax(0,1fr) auto; min-height:5.7rem; padding:.9rem 1rem .95rem; }
    .sb-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(15,23,42,.12); flex:0 0 auto; align-self:start; margin-top:.2rem; }
    .sb-card-pic .sb-name { font-size:1.15rem; }
    .sb-card-pic .sb-count { min-width:3.15rem; }
    .sb-card-pic .sb-tray { padding:.7rem 1rem .85rem; }
    /* Chips that are labels rather than label-and-count pairs: the services a city holds. Two rows'
       worth of height is reserved for the same reason /services reserves it, so a city with one row
       of chips is not shorter than the card beside it. */
    .sb-tags { display:flex; flex-wrap:wrap; align-content:flex-start; gap:.3rem; min-height:62px; }
    .sb-tag { display:inline-block; padding:.26rem .45rem; font-size:.72rem; line-height:1.25; font-weight:700;
      color:var(--color-ink); background:#fff; border:1px solid ${RULE}; border-radius:var(--radius-sm,4px); }
    /* "+2" counts what did not fit. Not a service, so not their chip. */
    .sb-tag-more { display:inline-block; padding:.26rem .1rem .26rem .25rem; font-size:.72rem; line-height:1.25;
      font-weight:600; color:var(--color-stone); }
    /* The language chips need the same reserve when they are the tray of a photographed tile.
       Without it the service hubs came out in three heights at wide widths, 259, 283 and 285, with
       26px between cards in one row: a city whose chips wrapped to a second line grew and the rest
       did not. Scoped to .sb-card-pic so the flat card families keep the height they have. */
    .sb-card-pic .sb-langs { align-content:flex-start; min-height:62px; }

    /* ---- the compact row with an icon, the .sv-hub shape from /services ---- */
    .sb-hubs { display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:.75rem; }
    /* min-height for the same reason as everywhere else here: at one width a long label wraps to a
       second line and stands 6px taller than its neighbours. The row is reserved so it cannot. */
    a.sb-hub:not(.btn):not(.nav-link) { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:stretch;
      gap:0; padding:0; min-height:3.75rem; overflow:hidden; background:#fff; color:var(--color-ink);
      border:1px solid ${EDGE}; border-radius:var(--radius-md,8px); text-decoration:none;
      box-shadow:${SHADOW}; transition:border-color .15s, box-shadow .15s, transform .15s; }
    a.sb-hub:hover { border-color:var(--color-terracotta,#c0392b); box-shadow:${SHADOW_HOVER}; transform:translateY(-2px); }
    .sb-hub-ico { display:grid; place-items:center; width:2.9rem; background:#fff; border-right:1px solid ${RULE}; }
    .sb-hub svg { width:19px; height:19px; color:var(--color-terracotta-dark,#a03325); flex:0 0 auto; }
    .sb-hub-name { align-self:center; padding:.72rem .8rem; font-weight:700; font-size:var(--text-sm); line-height:1.25; }
    .sb-hub-stat { display:flex; flex-direction:column; align-items:flex-end; justify-content:center;
      width:5.8rem; padding:.5rem .7rem; background:#fff; border-left:1px solid ${RULE}; }
    .sb-hub-stat b { font-size:1.02rem; font-weight:800; line-height:1.15; color:var(--color-ink);
      font-variant-numeric:tabular-nums; }
    .sb-hub-stat small { font-size:.68rem; font-weight:600; color:var(--color-stone); white-space:nowrap;
      font-variant-numeric:tabular-nums; }
    @media (prefers-reduced-motion:reduce) {
      a.sb-hub { transition:none; }
      a.sb-hub:hover { transform:none; }
      a.sb-card:hover .sb-pic img { transform:none; }
    }`;

/** A label and its count, as two cells of one box. `n` may be omitted for a chip with no number. */
const chip = ({ href, label, n, cls = '', attrs = '' }) => {
  const inner = `<span class="sb-chip-label">${esc(label)}</span>`
    + (n === undefined || n === null || n === '' ? '' : `<span class="sb-chip-n">${esc(n)}</span>`);
  const c = ('sb-chip ' + cls).trim();
  return href
    ? `<a class="${c}" href="${href}"${attrs ? ' ' + attrs : ''}>${inner}</a>`
    : `<span class="${c}"${attrs ? ' ' + attrs : ''}>${inner}</span>`;
};

/** The identity row: a name, an optional line under it, and the count tile. */
const cardHead = ({ name, sub, n, unit }) => `<span class="sb-head">`
  + `<span class="sb-name">${esc(name)}${sub ? `<span class="sb-sub">${esc(sub)}</span>` : ''}</span>`
  + `<span class="sb-count"><b>${esc(n)}</b>${unit ? `<small>${esc(unit)}</small>` : ''}</span>`
  + `</span>`;

/** The tray under it: what this is, then the thing itself. */
const tray = (eyebrow, inner) => `<span class="sb-tray">`
  + (eyebrow ? `<span class="sb-eyebrow">${esc(eyebrow)}</span>` : '')
  + inner + `</span>`;

/** A row of language chips, with a "+n" for whatever did not fit. */
const langChips = (pairs, cap = 3) => {
  const shown = pairs.slice(0, cap);
  const rest = pairs.length - shown.length;
  return `<span class="sb-langs">`
    + shown.map(([name, n]) => `<span class="sb-lang"><i>${esc(name)}</i><b>${esc(n)}</b></span>`).join('')
    + (rest > 0 ? `<span class="sb-lang-more">+${rest}</span>` : '')
    + `</span>`;
};

/** A share of a whole, as a bar over the two numbers that made it. */
const shareBar = (n, total) => {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return `<span class="sb-bar"><i style="width:${Math.max(pct, 2)}%"></i></span>`
    + `<span class="sb-figs"><span><b>${esc(n)}</b> of ${esc(total)}</span><span>${pct}%</span></span>`;
};

/**
 * The city photographs, loaded once for whichever generators want them.
 *
 * Three page families list cities, and all three were drawing a plain card while /services, one
 * click away, drew a photographed tile. Doing the lookup here rather than in each generator is the
 * same reason the CSS is here: three copies is how a design ends up meaning three things.
 */
const CITY_PHOTOS = (() => {
  const root = path.resolve(__dirname, '..', '..');
  const dir = path.join(root, 'images', 'cities');
  const attribFile = path.join(dir, 'attribution.json');
  let attrib = {};
  if (fs.existsSync(attribFile)) {
    const raw = JSON.parse(fs.readFileSync(attribFile, 'utf8'));
    attrib = Array.isArray(raw) ? Object.fromEntries(raw.map((r) => [r.slug, r])) : raw;
  }
  const present = new Set(fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('-card.webp')).map((f) => f.replace(/-card\.webp$/, ''))
    : []);
  return { attrib, present };
})();

/** How many tiles ship their photograph in the HTML before the rest are deferred. */
const EAGER_TILES = 24;

/**
 * A city tile: photograph, flag, name over country, a count, and whatever the page wants in the
 * tray. The one shape /services uses, so a reader clicking between these pages sees one component.
 *
 * `index` is the tile's position on the whole page, not within its country block, so the eager
 * photographs are the ones actually reached first.
 */
const cityTile = ({ href, slug, name, country, iso, n, unit, index = 0, eyebrow, trayInner }) => {
  const a = CITY_PHOTOS.attrib[slug] || {};
  const band = CITY_PHOTOS.present.has(slug)
    ? pic({ slug, alt: a.alt || name, eager: index < EAGER_TILES })
    : '<span class="sb-pic"></span>';
  return `<a class="sb-card sb-card-pic" href="${href}">`
    + band
    + cardHeadFlag({ iso, name, sub: country, n, unit })
    + tray(eyebrow, trayInner)
    + `</a>`;
};

/**
 * The photograph band at the top of a city tile.
 *
 * `eager: false` ships a placeholder carrying the source rather than an <img>, for the tiles below
 * the fold. /services measured this: a hidden <img> is still fetched, so 329 tiles cost 421
 * requests whether the card was painted or not. The reveal script builds the real element when the
 * tile comes near the viewport. The placeholder keeps the band's height either way, which is what
 * holds every tile on the grid to one height.
 */
const pic = ({ slug, alt, eager }) => (eager
  ? `<span class="sb-pic"><img src="/images/cities/${esc(slug)}-card.webp" alt="${esc(alt)}" width="600" height="400" loading="lazy" decoding="async"></span>`
  : `<span class="sb-pic" data-src="/images/cities/${esc(slug)}-card.webp" data-alt="${esc(alt)}"></span>`);

/** The identity row of a photographed tile: flag, name over country, and the count tile. */
const cardHeadFlag = ({ iso, name, sub, n, unit }) => `<span class="sb-head">`
  + (iso ? `<img class="sb-flag" src="/assets/flags/${esc(iso)}.svg" alt="" width="26" height="20" loading="lazy">` : '<span></span>')
  + `<span class="sb-name">${esc(name)}${sub ? `<span class="sb-sub">${esc(sub)}</span>` : ''}</span>`
  + `<span class="sb-count"><b>${esc(n)}</b>${unit ? `<small>${esc(unit)}</small>` : ''}</span>`
  + `</span>`;

/** A row of plain label chips, with a "+n" for whatever did not fit. */
const tagChips = (labels, cap = 3) => {
  const shown = labels.slice(0, cap);
  const rest = labels.length - shown.length;
  return `<span class="sb-tags">`
    + shown.map((l) => `<span class="sb-tag">${esc(l)}</span>`).join('')
    + (rest > 0 ? `<span class="sb-tag-more">+${rest}</span>` : '')
    + `</span>`;
};

/** The compact row: an icon, a label, and a count over what it counts. */
const hub = ({ href, icon, name, n, sub }) => `<a class="sb-hub" href="${href}">`
  + `<span class="sb-hub-ico">${icon || ''}</span>`
  + `<span class="sb-hub-name">${esc(name)}</span>`
  + `<span class="sb-hub-stat"><b>${esc(n)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`
  + `</a>`;

/**
 * Builds the deferred photographs as their tiles come into view.
 *
 * Inlined rather than shipped as a file because it is eleven lines and every page that wants it
 * already carries its own <style>. Without IntersectionObserver every placeholder is filled at
 * once, which is the behaviour before this existed rather than a broken page.
 */
const revealJs = `<script>(function(){
  var q=[].slice.call(document.querySelectorAll('.sb-pic[data-src]'));
  if(!q.length)return;
  function fill(el){var s=el.getAttribute('data-src');if(!s)return;el.removeAttribute('data-src');
    var i=new Image();i.src=s;i.alt=el.getAttribute('data-alt')||'';i.width=600;i.height=400;
    i.loading='lazy';i.decoding='async';el.appendChild(i);}
  if(!('IntersectionObserver' in window)){q.forEach(fill);return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){io.unobserve(e.target);fill(e.target);}});},{rootMargin:'600px 0px'});
  q.forEach(function(el){io.observe(el);});
})();</script>`;

module.exports = { css, chip, cardHead, cardHeadFlag, tray, langChips, tagChips, shareBar, pic, hub, cityTile, revealJs, EAGER_TILES, esc };

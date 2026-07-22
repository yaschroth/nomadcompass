/**
 * Brings expansion (new-template) city pages up to the enhanced hero design so
 * they match the original 410. The base generator emits a hero WITHOUT the stat
 * bar, a separate `<section class="quick-stats">`, and a standalone dark
 * `<section class="score-section">` band. Enhanced pages instead put the stat
 * grid INSIDE the hero and load `city-hero-score.js`, which moves the score ring
 * into that bar and removes the score band at runtime.
 *
 * For each page that still has a standalone `.quick-stats` section and does NOT
 * load city-hero-score.js, this:
 *   1. lifts the `.quick-stats-grid` out of the standalone section,
 *   2. drops that now-empty section,
 *   3. inserts a byline + the grid into `.city-hero-content` (after the tagline),
 *   4. adds `<script src="../scripts/city-hero-score.js"></script>` after votes.js.
 * The score-section stays in the HTML; city-hero-score.js folds it into the hero
 * on load (same as every enhanced page). Idempotent.
 * Usage: node scripts/fix_new_city_hero.cjs [slug]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');

const BYLINE = '        <p class="city-hero-byline">By <a href="/about/yannick-schroth">Yannick Schroth</a> &middot; Updated <time datetime="2026-07-01">July 2026</time></p>';

const only = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html') && f !== 'index.html').filter((f) => !only || f === only || f === only + '.html');

// Old brand name "Nomad Compass" leaks from the base template; the live brand is
// "The Nomad HQ". Fix nav + footer logos wherever they are still stale.
function fixBrand(s) {
  return s
    .replace(/(nav-logo-nomad">)Nomad(<\/span><span class="nav-logo-accent">)Compass/g, '$1The Nomad$2HQ')
    .replace(/(footer-logo-nomad">)Nomad(<\/span><span class="footer-logo-accent">)Compass/g, '$1The Nomad$2HQ')
    // The base template wraps the page in <main class="main-content"> whose
    // padding-top (nav height) pushes the full-bleed hero down below the fold.
    // Enhanced pages use a plain <main> so the hero sits under the transparent nav.
    .replace(/<main class="main-content">/, '<main>');
}

let fixed = 0, skipAlready = 0, skipEnhanced = 0, noMatch = 0, brandOnly = 0;
for (const file of files) {
  let s = fs.readFileSync(path.join(DIR, file), 'utf8');
  const before = s;
  if (/city-hero-score\.js/.test(s)) {
    const nb = fixBrand(s);
    if (nb !== s) { fs.writeFileSync(path.join(DIR, file), nb); brandOnly++; }
    skipAlready++; continue;
  }
  if (!/<section class="quick-stats">/.test(s)) {
    const nb = fixBrand(s);
    if (nb !== s) { fs.writeFileSync(path.join(DIR, file), nb); brandOnly++; }
    skipEnhanced++; continue;
  }
  s = fixBrand(s);

  // 1+2. Pull the grid out of the standalone quick-stats section and drop the section.
  const secRe = /\n[ \t]*<!-- Quick Stats -->\n[ \t]*<section class="quick-stats">\n[ \t]*<div class="container">\n[ \t]*(<div class="quick-stats-grid">[\s\S]*?<\/div>)\n[ \t]*<\/div>\n[ \t]*<\/section>\n/;
  const m = s.match(secRe);
  if (!m) { noMatch++; continue; }
  const grid = m[1]
    .split('\n')
    .map((line, i) => (i === 0 ? '        ' + line : line)) // re-indent grid open to hero depth
    .join('\n');
  s = s.replace(secRe, '\n');

  // 3. Insert byline + grid inside .city-hero-content, right after the tagline.
  const heroRe = /(<p class="city-hero-tagline">[\s\S]*?<\/p>)\n([ \t]*<\/div>\n[ \t]*<\/section>)/;
  if (!heroRe.test(s)) { noMatch++; s = before; continue; }
  s = s.replace(heroRe, (_, tagline, close) => `${tagline}\n${BYLINE}\n${grid}\n${close}`);

  // 4. Load the hero-score transform (matches enhanced page placement: after votes.js).
  if (/<script src="\.\.\/scripts\/votes\.js"><\/script>/.test(s)) {
    s = s.replace(/(<script src="\.\.\/scripts\/votes\.js"><\/script>)/, `$1\n  <script src="../scripts/city-hero-score.js"></script>`);
  } else {
    // fallback: before cities-data-dependent inline logic
    s = s.replace(/(<script src="\.\.\/cities-data\.js"><\/script>)/, `$1\n  <script src="../scripts/city-hero-score.js"></script>`);
  }

  if (s !== before) { fs.writeFileSync(path.join(DIR, file), s); fixed++; }
}
console.log(`Hero upgraded: ${fixed} | brand-only fixes: ${brandOnly} | already had script: ${skipAlready} | no quick-stats section: ${skipEnhanced} | anchor miss: ${noMatch}`);

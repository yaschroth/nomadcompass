/**
 * The blocks a generated page must carry, lifted from pages that already have them.
 *
 * Why this exists: scripts/_safe_write.cjs refuses to overwrite an HTML file that would lose one of
 * twelve tracked features. A generator that does not reproduce them therefore aborts on its second
 * run, and the only way to keep building is --force, which switches the guard off for the whole
 * family. That is exactly what had happened here: build_service_city_pages.cjs reproduced
 * nav-drop-menu and nav-search but not G-JV1BMRJF89, cookie-consent, #organization, skip-link or
 * nomadhq_consent, so 287 pages were being written with the guard disabled.
 *
 * Lifting rather than templating is deliberate. These blocks are owned by the sweep scripts and
 * change without warning; a copy in a generator would drift silently. Lifted, the generator emits
 * whatever the sweeps last wrote, the guard stays on, and the sweeps become a safety net instead of
 * a dependency. It also fixes the nav search on service pages, which carried the form but not the
 * resolver because apply_nav_search.cjs never listed the services directory.
 *
 * Usage: const shell = require('./lib/page_shell.cjs');  shell.headTop, shell.nav, ...
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const read = (file) => {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) {
    console.error('page_shell: ' + file + ' is missing. It is the source of the page shell.');
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
};

// index.html is swept by everything and is the most reliable source for the injected blocks.
// services.html owns the directory's own look.
const INDEX = read('index.html');
const SERVICES = read('services.html');

function grab(src, srcName, what, re) {
  const m = src.match(re);
  if (!m) {
    console.error(
      'page_shell: could not find ' + what + ' in ' + srcName + '.\n' +
      '  Either a sweep changed its markers or that page has not been swept yet.\n' +
      '  Fix the source page rather than loosening this pattern: every generated page needs it.',
    );
    process.exit(1);
  }
  return m[0];
}

// Page-specific look, from the hub.
const style = grab(SERVICES, 'services.html', 'the style block', /<style>[\s\S]*?<\/style>/);
const nav = grab(SERVICES, 'services.html', 'the nav', /<nav class="nav"[\s\S]*?<\/nav>\s*<script>[\s\S]*?<\/script>/);
const footer = grab(SERVICES, 'services.html', 'the footer', /<footer class="footer"[\s\S]*?<\/footer>/);

// Sweep-injected blocks, in the order and position the sweeps put them.
// The two leading spaces matter: apply_analytics.cjs detects its own block with /  <!-- ga4 -->/
// and inserted a second copy into all 287 pages when the lift dropped them.
const headTop = grab(INDEX, 'index.html', 'the GA4 block', /  <!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/);
const brandGraph = grab(INDEX, 'index.html', 'the brand graph', /<!-- brand-graph -->[\s\S]*?<\/script>/);
const bodyStart = grab(INDEX, 'index.html', 'the skip link', /<a [^>]*class="skip-link"[^>]*>[^<]*<\/a>/);
const consent = grab(INDEX, 'index.html', 'the consent banner', /  <!-- cc -->[\s\S]*?<!-- \/cc -->/);
const navSearchJs = grab(INDEX, 'index.html', 'the nav search resolver', /<!-- nav-search-js -->[\s\S]*?<!-- \/nav-search-js -->/);

// Two more sweeps the shell was not lifting, which is why apply_best_page.cjs aborted in the write
// guard on its first run after the site gained them: the template it emitted was a page that would
// have deleted Travelpayouts and the affiliate click tracker from all 32 ranking pages. They sit at
// the same two positions the sweeps put them in, so a generated page needs no further handling.
const travelpayouts = grab(INDEX, 'index.html', 'the Travelpayouts loader', /<!-- travelpayouts -->[\s\S]*?<!-- \/travelpayouts -->/);
const affTrack = grab(INDEX, 'index.html', 'the affiliate click tracker', /<!-- aff-track -->[\s\S]*?<!-- \/aff-track -->/);

const headEnd = brandGraph + '\n' + travelpayouts;
const bodyEnd = consent + '\n' + navSearchJs + '\n' + affTrack;

/**
 * The photo credit is per page, not sitewide: it names the photographer of every hero that page
 * happens to show, which is a condition of the Creative Commons licences rather than a nicety.
 * apply_photo_credit.cjs owns it and recomputes it from whatever the page ends up displaying, so a
 * generator only has to carry the existing block through its own rewrite and then let the sweep
 * run. Without that the write guard refuses the generator, and the tempting fix is --force, which
 * would delete the credits from every page in the family at once.
 */
function liftPhotoCredit(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return '';
  const m = fs.readFileSync(p, 'utf8').match(/  <!-- photo-credit -->[\s\S]*?<!-- \/photo-credit -->\n/);
  return m ? m[0] : '';
}

/**
 * Write a generated page, carrying its photo credit through.
 *
 * The seven service generators build their HTML deep inside a render function that does not know
 * its own output path, so lifting the block into the template is awkward in a way that invites the
 * shortcut the guard exists to prevent. Doing it at the write instead needs only the path the
 * generator already has. The block goes back exactly where apply_photo_credit.cjs puts it, directly
 * before the footer, and a page that never had one is written unchanged.
 *
 * `file` is relative to the repository root, the same string the caller passes to path.join(ROOT, ...).
 */
function writePage(file, html) {
  const credit = liftPhotoCredit(file);
  if (credit && !html.includes('<!-- photo-credit -->')) {
    const at = html.indexOf('  <footer class="footer"');
    if (at !== -1) html = html.slice(0, at) + credit + html.slice(at);
  }
  fs.writeFileSync(path.join(ROOT, file), html);
}

// The needles _safe_write.cjs tracks that this shell is responsible for. A generator can assert
// against this list before writing, so a missing block fails at the generator with a clear message
// rather than inside the write guard with a generic one.
const NEEDLES = [
  'G-JV1BMRJF89', 'cookie-consent', 'nomadhq_consent', '#organization',
  'nav-drop-menu', 'nav-search', 'skip-link', 'tp-em.com', 'affiliate_click',
];

/**
 * Throws if the finished page would drop a tracked feature. Call it once per page, before writing:
 * it turns a silent --force habit into a loud failure at the point the mistake was made.
 */
function assertComplete(html, label) {
  const lost = NEEDLES.filter((n) => !html.includes(n));
  if (lost.length) {
    console.error(
      'page_shell: ' + label + ' would be written without ' + lost.join(', ') + '.\n' +
      '  Include shell.headTop, shell.headEnd, shell.bodyStart, shell.bodyEnd and shell.nav.\n' +
      '  Do not reach for --force: that is what disabled the guard on 287 pages.',
    );
    process.exit(1);
  }
}


/**
 * The nav is lifted verbatim from services.html, so it arrives with Services marked active. Any
 * other page built from this shell then highlights the wrong tab: the four blog category pages
 * shipped that way until this existed. Pass the label the page belongs under ('Blog', 'Cities',
 * ...), or nothing to highlight none of them.
 */
// The four places a label can sit: the desktop bar, the desktop Tools dropdown, the mobile list and
// the mobile sub-list. /tier-list and the other tools live only in the dropdown, so a version that
// knew about the top bar alone could not mark them at all.
const LINK = 'class="nav-(?:link|drop-link|mobile-link|mobile-sub)';

function navFor(active) {
  const cleared = nav.replace(new RegExp('(' + LINK + ') active"', 'g'), '$1"');
  if (!active) return cleared;
  const re = new RegExp('(' + LINK + ')(">' + active + '<)', 'g');
  const out = cleared.replace(re, '$1 active$2');
  if (out === cleared) {
    console.error('page_shell: no nav item labelled "' + active + '". Check the label against the nav in services.html.');
    process.exit(1);
  }
  return out;
}

module.exports = { style, nav, navFor, footer, headTop, headEnd, bodyStart, bodyEnd, NEEDLES, assertComplete, liftPhotoCredit, writePage };

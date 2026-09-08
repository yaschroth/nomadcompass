require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Gives the nav its behaviour back on the pages that were shipped without it.
 *
 * styles/nav.css sets .nav transparent and .nav.scrolled opaque, and something has to add
 * that class. On 404, the about pages, the activities and the rankings a small inline script
 * does it. On all 1000 city pages it was never emitted, so the nav sat transparent over the
 * content forever and the owner reported exactly that: "header suddenly stays transparent
 * when hovering down".
 *
 * The same script also drives the mobile menu, and that is the more serious half of what was
 * missing. Every city page carries <button id="navToggle"> and <div id="navMobile"> in the
 * markup with nothing bound to either, so on a phone the hamburger did nothing at all and the
 * only way to leave a city page was the browser's back button. That had been true of the whole
 * city section, which is most of the site.
 *
 * Two differences from the copy those other pages carry, both deliberate:
 *
 *   - it null-checks before binding. The generators do not all emit the same nav, and a
 *     TypeError on a missing element would kill every later inline script on the page.
 *   - it sets the scrolled state on load as well as on scroll. Arriving at /cities/tuzla
 *     #cost-of-living from a jump link or reloading part-way down leaves the page already
 *     scrolled with no scroll event to follow, which is the case the owner hit.
 *
 * Idempotent between its markers. Run after any generator that rewrites the body.
 * Usage: node scripts/apply_nav_behaviour.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const OPEN = '<!-- nav-behaviour -->';
const CLOSE = '<!-- /nav-behaviour -->';
const BLOCK_RE = /\n?[ \t]*<!-- nav-behaviour -->[\s\S]*?<!-- \/nav-behaviour -->/g;

const JS = `  ${OPEN}
  <script>(function(){
    var n=document.getElementById('mainNav'),t=document.getElementById('navToggle'),
        m=document.getElementById('navMobile'),b=document.body;
    if(t&&m){t.addEventListener('click',function(){
      var o=t.classList.toggle('active');m.classList.toggle('active');
      b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});}
    if(n){var s=function(){n.classList.toggle('scrolled',window.scrollY>10);};
      window.addEventListener('scroll',s,{passive:true});s();}
  })();</script>
  ${CLOSE}`;

const SKIP = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

let added = 0, already = 0, noNav = 0, noBody = 0;

for (const fp of walk(ROOT, [])) {
  const html = fs.readFileSync(fp, 'utf8');

  // Only pages that actually carry the nav this drives.
  if (!html.includes('id="mainNav"') && !html.includes('id="navToggle"')) { noNav++; continue; }

  // A page that already binds the scrolled class by its own script is left alone: two
  // handlers on one nav is not a bug worth creating to fix a formatting inconsistency.
  const bare = html.replace(BLOCK_RE, '');
  if (bare.includes("classList.toggle('scrolled'")) { already++; continue; }

  const at = bare.lastIndexOf('</body>');
  if (at === -1) { noBody++; continue; }

  const next = bare.slice(0, at) + JS + '\n' + bare.slice(at);
  if (next === html) { already++; continue; }
  if (!DRY) fs.writeFileSync(fp, next);
  added++;
}

console.log('Nav behaviour: ' + added + ' page(s) given the scroll + mobile-menu script'
  + '  |  ' + already + ' already had one, ' + noNav + ' carry no nav'
  + (noBody ? ', ' + noBody + ' had no </body>' : '')
  + (DRY ? '  [dry run]' : ''));

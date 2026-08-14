require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Injects a slim search box into the desktop nav of every page. It is an autocomplete
 * that resolves a typed city straight to /cities/<slug> (the city page). A datalist gives
 * native suggestions from assets/city-search-index.js; on submit the JS matches the input
 * to a city and navigates to its guide. No-JS fallback: the <form> GET-submits to
 * /cities?q= (the filtered browse), so it still works and still backs the SearchAction.
 * Desktop only (styles/nav.css hides it on mobile, where /cities carries the search).
 *
 * Two injected pieces, both idempotent:
 *   - the form + datalist in the nav  (marker: class="nav-search")   -> before <div class="nav-actions">
 *   - the index script + resolver JS  (marker: <!-- nav-search-js -->) -> before </body>
 *
 * Run after any generator that rewrites the nav/body. Chained into rebuild_rankings.cjs.
 * Usage: node scripts/apply_nav_search.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const FORM = '<form class="nav-search" action="/cities" method="get" role="search"><input type="search" name="q" placeholder="Jump to a city&hellip;" aria-label="Search a city" autocomplete="off" list="navCityList"><datalist id="navCityList"></datalist></form>';

// Drives every city-search form on the page, not just the one in the nav. The homepage hero
// now carries a second field, and a lone querySelector meant it got neither the autocomplete
// list nor the jump-straight-to-the-city-page behaviour: it fell back to a plain GET to
// /cities?q=. Each form's datalist is resolved from its own input's list attribute, so the two
// cannot collide over an id.
const JS = `  <!-- nav-search-js -->
  <script src="/assets/city-search-index.js" defer></script>
  <script>(function(){function init(){var forms=document.querySelectorAll('form.nav-search,form[data-city-search]');if(!forms.length||!window.NOMAD_CITIES)return;var L=window.NOMAD_CITIES;function fill(dl){if(!dl||dl.childElementCount)return;var frag=document.createDocumentFragment();L.forEach(function(c){var o=document.createElement('option');o.value=c[0];frag.appendChild(o);});dl.appendChild(frag);}function resolve(q){q=q.trim().toLowerCase();if(!q)return null;var hit=L.find(function(c){return c[0].toLowerCase()===q;});if(!hit)hit=L.find(function(c){return c[0].toLowerCase().indexOf(q)===0;});if(!hit)hit=L.find(function(c){return c[0].toLowerCase().indexOf(q)>-1;});return hit;}Array.prototype.forEach.call(forms,function(f){var input=f.querySelector('input[name="q"]');if(!input)return;fill(document.getElementById(input.getAttribute('list')));f.addEventListener('submit',function(e){var hit=resolve(input.value);if(hit){e.preventDefault();window.location.href='/cities/'+hit[1];}});});}if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);})();</script>
  <!-- /nav-search-js -->`;

function htmlIn(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => (dir === '.' ? f : path.join(dir, f)));
}
const all = ['.', 'cities', 'best', 'tier-list', 'activities', 'about', 'blog', 'blog/category' ].flatMap(htmlIn);

const formRe = /<form class="nav-search"[\s\S]*?<\/form>/;
const jsRe = /  <!-- nav-search-js -->[\s\S]*?<!-- \/nav-search-js -->/;
let form = 0, skipped = 0, js = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  // Form + datalist in the nav.
  if (formRe.test(html)) { html = html.replace(formRe, FORM); }
  else if (/<div class="nav-actions">/.test(html)) { html = html.replace('<div class="nav-actions">', FORM + '\n      <div class="nav-actions">'); }
  else { skipped++; }

  // Resolver JS before </body> (only on pages that got the form).
  if (/class="nav-search"/.test(html)) {
    if (jsRe.test(html)) { html = html.replace(jsRe, JS); }
    else if (/<\/body>/i.test(html)) { html = html.replace(/<\/body>/i, JS + '\n</body>'); }
    js++;
  }

  if (html !== before) { fs.writeFileSync(abs, html); form++; }
}
console.log(`Nav search: written ${form}, js on ${js}, skipped (no nav-actions) ${skipped} of ${all.length}`);

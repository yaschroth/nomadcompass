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

// Drives every city-search form on the page, not just the first one it finds. A lone
// querySelector meant the homepage hero field got neither the suggestions nor the
// jump-straight-to-the-city-page behaviour and quietly fell back to a plain GET to /cities?q=.
//
// Two suggestion modes. Forms marked data-city-search get the branded dropdown below the field;
// everything else keeps the native <datalist>, resolved from its own input's list attribute so
// the two cannot collide over an id. The dropdown exists because the native datalist renders as
// a narrow dark strip that no page CSS can reach.
const JS = `  <!-- nav-search-js -->
  <script src="/assets/city-search-index.js" defer></script>
  <style>
  form[data-city-search]{position:relative;}
  .cs-panel{position:absolute;top:calc(100% + .45rem);left:0;right:0;z-index:60;margin:0;padding:.3rem;list-style:none;background:#fff;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:var(--radius-md,8px);box-shadow:0 14px 34px rgba(15,23,42,.18);max-height:min(46vh,340px);overflow-y:auto;display:none;}
  .cs-panel.is-open{display:block;}
  .cs-opt{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem;padding:.5rem .65rem;border-radius:var(--radius-sm,4px);cursor:pointer;}
  .cs-opt[aria-selected="true"],.cs-opt:hover{background:var(--color-sand,#f6f1e7);}
  .cs-name{font-weight:600;color:var(--color-ink,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cs-country{flex:0 0 auto;font-size:.78rem;color:var(--color-stone,#8a8175);}
  .cs-empty{padding:.55rem .65rem;font-size:.85rem;color:var(--color-stone,#8a8175);}
  </style>
  <script>(function(){
  function init(){
    var forms=document.querySelectorAll('form.nav-search,form[data-city-search]');
    if(!forms.length||!window.NOMAD_CITIES)return;
    var L=window.NOMAD_CITIES,uid=0;
    function fill(dl){if(!dl||dl.childElementCount)return;var frag=document.createDocumentFragment();L.forEach(function(c){var o=document.createElement('option');o.value=c[0];frag.appendChild(o);});dl.appendChild(frag);}
    function resolve(q){q=q.trim().toLowerCase();if(!q)return null;var hit=L.find(function(c){return c[0].toLowerCase()===q;});if(!hit)hit=L.find(function(c){return c[0].toLowerCase().indexOf(q)===0;});if(!hit)hit=L.find(function(c){return c[0].toLowerCase().indexOf(q)>-1;});return hit;}
    function suggest(q,max){q=q.trim().toLowerCase();if(!q)return [];var starts=[],has=[];for(var i=0;i<L.length&&starts.length<max;i++){var n=L[i][0].toLowerCase();if(n.indexOf(q)===0)starts.push(L[i]);}
      if(starts.length<max)for(var j=0;j<L.length&&starts.length+has.length<max;j++){var m=L[j][0].toLowerCase();if(m.indexOf(q)>0&&starts.indexOf(L[j])<0)has.push(L[j]);}
      return starts.concat(has);}
    // The branded dropdown. The native datalist renders as a narrow dark strip that nothing on
    // the page can style, so opted-in forms drop the list attribute and get this instead.
    function combobox(f,input){
      var id='csPanel'+(++uid),panel=document.createElement('ul'),rows=[],active=-1;
      panel.className='cs-panel';panel.id=id;panel.setAttribute('role','listbox');
      f.appendChild(panel);
      input.removeAttribute('list');
      input.setAttribute('role','combobox');
      input.setAttribute('aria-expanded','false');
      input.setAttribute('aria-controls',id);
      input.setAttribute('aria-autocomplete','list');
      input.setAttribute('autocomplete','off');
      function close(){panel.classList.remove('is-open');input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
      function mark(i){
        if(!rows.length)return;
        if(active>-1&&rows[active])rows[active].el.setAttribute('aria-selected','false');
        active=i<0?rows.length-1:i>=rows.length?0:i;
        var r=rows[active];r.el.setAttribute('aria-selected','true');
        input.setAttribute('aria-activedescendant',r.el.id);
        var top=r.el.offsetTop,bot=top+r.el.offsetHeight;
        if(top<panel.scrollTop)panel.scrollTop=top;
        else if(bot>panel.scrollTop+panel.clientHeight)panel.scrollTop=bot-panel.clientHeight;
      }
      function go(c){window.location.href='/cities/'+c[1];}
      function render(){
        var list=suggest(input.value,8);
        panel.textContent='';rows=[];active=-1;input.removeAttribute('aria-activedescendant');
        if(!input.value.trim()){close();return;}
        if(!list.length){
          var e=document.createElement('li');e.className='cs-empty';e.textContent='No city matches that.';
          panel.appendChild(e);panel.classList.add('is-open');input.setAttribute('aria-expanded','true');return;
        }
        list.forEach(function(c,i){
          var li=document.createElement('li');
          li.className='cs-opt';li.id=id+'-'+i;li.setAttribute('role','option');li.setAttribute('aria-selected','false');
          var n=document.createElement('span');n.className='cs-name';n.textContent=c[0];li.appendChild(n);
          if(c[2]){var k=document.createElement('span');k.className='cs-country';k.textContent=c[2];li.appendChild(k);}
          // mousedown, not click: the input blurs first on click and the panel would already be gone.
          li.addEventListener('mousedown',function(ev){ev.preventDefault();go(c);});
          panel.appendChild(li);rows.push({el:li,city:c});
        });
        panel.classList.add('is-open');input.setAttribute('aria-expanded','true');
      }
      input.addEventListener('input',render);
      input.addEventListener('focus',function(){if(input.value.trim())render();});
      input.addEventListener('blur',function(){setTimeout(close,120);});
      input.addEventListener('keydown',function(e){
        if(e.key==='ArrowDown'){e.preventDefault();if(!rows.length)render();else mark(active+1);}
        else if(e.key==='ArrowUp'){e.preventDefault();if(rows.length)mark(active-1);}
        else if(e.key==='Escape'){close();}
        else if(e.key==='Enter'&&active>-1&&rows[active]){e.preventDefault();go(rows[active].city);}
      });
      document.addEventListener('click',function(e){if(!f.contains(e.target))close();});
    }
    Array.prototype.forEach.call(forms,function(f){
      var input=f.querySelector('input[name="q"]');
      if(!input)return;
      if(f.hasAttribute('data-city-search'))combobox(f,input);
      else fill(document.getElementById(input.getAttribute('list')));
      f.addEventListener('submit',function(e){var hit=resolve(input.value);if(hit){e.preventDefault();window.location.href='/cities/'+hit[1];}});
    });
  }
  if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
  })();</script>
  <!-- /nav-search-js -->`;

function htmlIn(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => (dir === '.' ? f : path.join(dir, f)));
}
// Every level under a directory, for services/<city>/<service>[/<language>].html.
function htmlUnder(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => htmlIn(path.join(dir, e.name)).concat(htmlUnder(path.join(dir, e.name))));
}
// services was missing from this list entirely, so the largest page family on the site carried a
// search box whose resolver had never been swept onto it. The pages get it from lib/page_shell.cjs
// now, but a sweep that cannot see a page cannot repair one either.
const all = ['.', 'cities', 'best', 'tier-list', 'activities', 'about', 'blog', 'blog/category', 'services']
  .flatMap(htmlIn).concat(htmlUnder('services'));

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
  // Third anchor, for pages whose nav has no nav-actions wrapper. Without it this sweep could only
  // ever REFRESH a form that already existed, so once a generator overwrote one of those pages the
  // search box was gone for good and nothing could put it back. That is what happened to
  // cities.html, visa.html, geoarbitrage.html and tier-list/maker.html on the 740-city rebuild.
  // The toggle button closes the nav on every template, so it is the reliable last resort.
  else if (/<button[^>]*class="nav-toggle"/.test(html)) {
    html = html.replace(/<button[^>]*class="nav-toggle"/, (m) => FORM + '\n      ' + m);
  } else { skipped++; }

  // Resolver JS before </body> (only on pages that got the form).
  if (/class="nav-search"/.test(html)) {
    if (jsRe.test(html)) { html = html.replace(jsRe, JS); }
    else if (/<\/body>/i.test(html)) { html = html.replace(/<\/body>/i, JS + '\n</body>'); }
    js++;
  }

  if (html !== before) { fs.writeFileSync(abs, html); form++; }
}
console.log(`Nav search: written ${form}, js on ${js}, skipped (no nav-actions) ${skipped} of ${all.length}`);

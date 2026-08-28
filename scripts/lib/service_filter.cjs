/**
 * The filter bar the services directory uses, in one place.
 *
 * /services has had a working City / Service / Language filter since it was built. None of the
 * other 887 pages did, which is backwards: the index is where you already know how to narrow by
 * clicking a tile, and the pages you land on after that are the long ones. /services/lawyers lists
 * 255 cities across 75 countries in one scroll, and the only way to find Portugal was to scroll to
 * Portugal.
 *
 * The provider cards had carried data-cat, data-lang and data-name since they were written, and the
 * city pages carried a .svc-controls rule and a .svc-group.is-hidden rule with nothing to apply
 * them to. The data layer for this existed; the behaviour never got written.
 *
 * The contract, deliberately small so one implementation serves six page families:
 *
 *   .sf-item          a thing that can be filtered. Carries data-name plus a data-<key> per field.
 *   .sf-group         a section that hides itself when it holds no visible item (a country block,
 *                     a service block). Optional: a page with one flat list has none.
 *   #<id>Count        a live region rewritten with the current tally.
 *   #<id>Empty        shown when nothing matches.
 *
 * A select matches if the item's data-<key> token list CONTAINS the value, so one attribute can
 * hold several ("data-cats='doctor dentist lawyer'"). The search field matches data-name.
 *
 * Nothing here is required for the page to work. Without JavaScript every item is visible, which is
 * the state the crawler sees and the state the page ships in.
 *
 * Usage:  const F = require('./lib/service_filter.cjs');
 *         <style> ${F.css} </style>
 *         ${F.bar({ id: 'svl', fields: [...] })}
 *         ${F.js({ id: 'svl', noun: 'city', nounPlural: 'cities', total: 78 })}
 */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lifted from build_services.cjs rather than re-picked, for the reason everything else in this
// directory is: the reader crosses between these pages and a control that is 2px different or a
// shade lighter reads as a different control.
const css = `
    .sf-bar { display:flex; flex-wrap:wrap; align-items:flex-end; gap:.9rem 1.1rem; margin:0 0 var(--space-6);
      padding:1rem 1.15rem; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6);
      border-radius:var(--radius-md,8px); box-shadow:0 3px 6px rgba(15,23,42,.06); }
    .sf-field { display:flex; flex-direction:column; gap:.35rem; }
    .sf-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
      color:var(--color-stone); }
    .sf-field select, .sf-field input { font-family:inherit; font-size:.95rem; padding:.55rem .7rem;
      border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff;
      color:var(--color-ink); min-width:180px; }
    .sf-field-q input { min-width:240px; }
    .sf-field select:focus-visible, .sf-field input:focus-visible { outline:2px solid var(--color-terracotta,#c0392b);
      outline-offset:1px; }
    .sf-reset { align-self:flex-end; margin-bottom:.1rem; padding:.55rem .2rem; background:none; border:0;
      font-family:inherit; font-size:.88rem; font-weight:700; color:var(--color-terracotta-dark,#a03325);
      text-decoration:underline; text-underline-offset:3px; cursor:pointer; }
    .sf-reset:hover { color:var(--color-ink); }
    .sf-count { margin:0 0 var(--space-6); font-size:var(--text-sm); color:var(--color-stone); }
    .sf-count b { color:var(--color-ink); font-variant-numeric:tabular-nums; }
    .sf-item.is-hidden, .sf-group.is-hidden { display:none; }
    .sf-empty { margin:var(--space-8) 0; padding:1.4rem 1.5rem; background:var(--color-sand,#f6f1e7);
      border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:var(--radius-md,8px); }
    .sf-empty p { margin:0 0 .5rem; color:var(--color-charcoal,#334155); line-height:1.6; }
    .sf-empty p:last-child { margin:0; }
    .sf-empty.is-hidden { display:none; }
    @media (max-width:640px) {
      .sf-bar { gap:.75rem; }
      .sf-field { width:100%; }
      .sf-field select, .sf-field input { min-width:0; width:100%; }
    }`;

/**
 * The control bar.
 *
 * `fields` is an array of either
 *   { key:'q', search:true, label:'City', placeholder:'Type a city…' }
 *   { key:'cat', label:'Service', any:'Any service', options:[[value, label], …] }
 * A select with only one option is kept, because with the "Any" default it is still a real choice:
 * one of Paris's 99 German-speaking lawyers also speaks English, and a menu offering only English
 * finds that one. A select with NO options is dropped.
 */
/** Below this many rows a filter is furniture: you can see the whole list without it. */
const MIN_ITEMS = 6;

/**
 * Below how many rendered rows a capped page still gets no filter.
 *
 * A page that shows three cards of a service and links to the child page for the rest is a
 * signpost, and a search box over three cards is furniture. A page that shows 120 of 267 is a
 * listing, and leaving it with no way to search was the actual complaint: 133 pages held six or
 * more rows and offered nothing, the worst of them 120 rows deep.
 */
const CAPPED_MIN = 12;

const bar = ({ id, fields, complete = true, items = Infinity }) => {
  // A filter over a preview used to lie, so capped pages got none at all. It does not lie: TOTAL is
  // counted from the rendered .sf-item nodes, so the tally has always described exactly the rows
  // the reader can see. Only the word "all" was wrong. So the filter is offered here too, and
  // count()/js() say "on this page" instead, with the "Showing 120 of 267" line and its link to the
  // full child page left where they were.
  if (!complete && items < CAPPED_MIN) return '';
  if (items < MIN_ITEMS) return '';
  const usable = fields.filter((f) => f.search || (f.options && f.options.length > 0));
  if (!usable.length) return '';
  const parts = usable.map((f) => {
    const fid = id + '-' + f.key;
    if (f.search) {
      return `<div class="sf-field sf-field-q"><label for="${fid}">${esc(f.label)}</label>`
        + `<input type="search" id="${fid}" data-sf="${esc(f.key)}" placeholder="${esc(f.placeholder || '')}" autocomplete="off"></div>`;
    }
    return `<div class="sf-field"><label for="${fid}">${esc(f.label)}</label>`
      + `<select id="${fid}" data-sf="${esc(f.key)}"><option value="all">${esc(f.any || 'Any')}</option>`
      + f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')
      + `</select></div>`;
  });
  return `<div class="sf-bar" id="${id}Bar">\n        ${parts.join('\n        ')}\n        `
    + `<button type="button" class="sf-reset" id="${id}Reset">Reset</button>\n      </div>`;
};

/**
 * The tally line, and the region the script rewrites.
 *
 * `capped` is for a page showing part of what it counts. The number is the same either way, since
 * it is the rendered rows in both cases; what changes is the claim made about it. "Showing all 120
 * listings" on a page holding 120 of 267 is the only part of a capped filter that was ever untrue.
 */
const count = ({ id, total, noun, nounPlural, capped = false }) =>
  `<p class="sf-count" id="${id}Count" role="status" aria-live="polite">`
  + (capped
    ? `All <b>${total}</b> ${total === 1 ? esc(noun) : esc(nounPlural)} on this page.`
    : `Showing all <b>${total}</b> ${total === 1 ? esc(noun) : esc(nounPlural)}.`)
  + `</p>`;

/** What a reader sees when a combination has nothing in it. */
const empty = ({ id, what }) => `<div class="sf-empty is-hidden" id="${id}Empty">
        <p>Nothing matches that combination.</p>
        <p>${esc(what)} If you know a provider that belongs here, <a href="/contact">tell us</a> and include where the language is stated.</p>
      </div>`;

/**
 * The behaviour.
 *
 * Reads its fields from the DOM rather than from a config repeated in every generator: a control
 * declares which attribute it filters with data-sf, so adding a field is a markup change.
 */
const js = ({ id, noun, nounPlural, capped = false }) => `<script>
    (function(){
      var bar=document.getElementById('${id}Bar');
      if(!bar)return;
      var out=document.getElementById('${id}Count'),blank=document.getElementById('${id}Empty');
      var items=[].slice.call(document.querySelectorAll('.sf-item'));
      var groups=[].slice.call(document.querySelectorAll('.sf-group'));
      var controls=[].slice.call(bar.querySelectorAll('[data-sf]'));
      if(!items.length)return;
      var TOTAL=items.length;
      // A token list, so one attribute can hold several values: data-cats="doctor dentist".
      function holds(el,key,v){
        var raw=el.getAttribute('data-'+key);
        if(raw===null)return false;
        return (' '+raw+' ').indexOf(' '+v+' ')>-1;
      }
      function render(){
        var terms=[];
        controls.forEach(function(c){
          var v=(c.value||'').trim();
          if(!v||v==='all')return;
          terms.push({key:c.getAttribute('data-sf'),v:v,search:c.type==='search'});
        });
        var shown=0;
        items.forEach(function(el){
          var ok=terms.every(function(t){
            if(t.search)return (el.getAttribute('data-name')||'').indexOf(t.v.toLowerCase())>-1;
            return holds(el,t.key,t.v);
          });
          el.classList.toggle('is-hidden',!ok);
          if(ok)shown++;
        });
        // A country heading over nothing is worse than no heading: it reads as an empty country.
        groups.forEach(function(g){
          var any=g.querySelector('.sf-item:not(.is-hidden)');
          g.classList.toggle('is-hidden',!any);
        });
        if(out){
          out.innerHTML = shown===TOTAL
            ? ${capped ? `'All <b>'+TOTAL+'</b> '+(TOTAL===1?'${esc(noun)}':'${esc(nounPlural)}')+' on this page.'`
    : `'Showing all <b>'+TOTAL+'</b> '+(TOTAL===1?'${esc(noun)}':'${esc(nounPlural)}')+'.'`}
            : ${capped ? `'<b>'+shown+'</b> of the '+TOTAL+' '+'${esc(nounPlural)}'+' on this page.'`
    : `'Showing <b>'+shown+'</b> of '+TOTAL+' '+'${esc(nounPlural)}'+'.'`};
        }
        if(blank)blank.classList.toggle('is-hidden',shown>0);
      }
      controls.forEach(function(c){
        c.addEventListener('input',render);
        c.addEventListener('change',render);
      });
      // The tally is rendered once at load from the same count the filter uses. A pair page lists a
      // provider under each language they speak, so its 27 providers are 32 cards, and a
      // server-rendered "27" would have been contradicted by the first keystroke.
      render();
      document.getElementById('${id}Reset').addEventListener('click',function(){
        controls.forEach(function(c){ c.value=c.type==='search'?'':'all'; });
        render();
      });
      // A filter carried in the URL, so a link can arrive pre-narrowed and the page still says so.
      var qs=new URLSearchParams(location.search),touched=false;
      controls.forEach(function(c){
        var v=qs.get(c.getAttribute('data-sf'));
        if(v){ c.value=v; touched=true; }
      });
      if(touched)render();
    })();
  </script>`;

module.exports = { css, bar, count, empty, js, esc };

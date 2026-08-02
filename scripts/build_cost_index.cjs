/**
 * Builds /cost-of-living-index — a linkable "Digital Nomad Cost of Living Index" asset: a sortable,
 * filterable table of every city we have real Numbeo data for, ranked by a transparent monthly
 * solo-nomad budget (central rent + our one-person basket), with full methodology + Numbeo
 * attribution + schema.org/Dataset markup. Reads data/numbeo-costs.json + assets/fx-usd.json +
 * cities-data.js + city-regions.js. Clones the shared nav/footer/head from geoarbitrage.html so it
 * stays in sync. Re-run after refreshing the cost data. Usage: node scripts/build_cost_index.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const COSTS = require(path.join(ROOT, 'data', 'numbeo-costs.json'));
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const REG = (() => { try { return require(path.join(ROOT, 'city-regions.js')); } catch (e) { return {}; } })();
const byId = new Map(CITIES.map((c) => [c.id, c]));
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America', oceania: 'Oceania' };

function usd(local, rate) { if (local == null || !rate) return null; const v = local / rate; return v >= 100 ? Math.round(v / 10) * 10 : Math.round(v); }

const rows = [];
for (const [slug, d] of Object.entries(COSTS)) {
  if (slug === '_meta') continue;
  const c = byId.get(slug); if (!c) continue;
  const rate = FX.rates[d.cur]; if (!rate) continue;
  if (d.rent1c == null || d.singleNoRent == null) continue;
  const solo = usd(d.rent1c + d.singleNoRent, rate);
  rows.push({
    id: slug, name: c.name, country: c.country, flag: c.id, region: REG[slug] || '',
    solo, rent: usd(d.rent1c, rate), basket: usd(d.singleNoRent, rate),
    meal: usd(d.mealInexp, rate), transit: usd(d.transport, rate),
  });
}
rows.sort((a, b) => a.solo - b.solo);
rows.forEach((r, i) => { r.rank = i + 1; });

const money = (v) => v == null ? '' : '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cheapest = rows[0], priciest = rows[rows.length - 1];
const asOf = (COSTS._meta && COSTS._meta.updated) || 'this year';
const fxDate = (FX.time_last_update_utc || '').replace(/^[A-Za-z]+, /, '').replace(/ \d{2}:\d{2}.*$/, '');

// ---- clone shared shell from geoarbitrage.html ----
const src = fs.readFileSync(path.join(ROOT, 'geoarbitrage.html'), 'utf8');
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('shell missing: ' + name); return m[0]; };
const ga4 = grab(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/, 'ga4');
const nav = grab(/<nav class="nav"[\s\S]*?<\/nav>\s*<script>\(function\(\)\{var n=document\.getElementById\('mainNav'[\s\S]*?\}\)\(\);<\/script>/, 'nav');
const footer = grab(/<footer class="footer">[\s\S]*?<\/footer>/, 'footer');
const navsearch = grab(/<!-- nav-search-js -->[\s\S]*?<!-- \/nav-search-js -->/, 'navsearch');
const cc = grab(/<!-- cc -->[\s\S]*?<!-- \/cc -->/, 'cc');
const brand = grab(/<!-- brand-graph -->[\s\S]*?<\/script>/, 'brand');

// table rows
const tbody = rows.map((r) => {
  const flag = `<img src="/assets/flags/${byId.get(r.id) && byId.get(r.id).id ? '' : ''}" >`;
  const cc2 = (byId.get(r.id) || {});
  return `<tr data-region="${r.region}" data-name="${esc(r.name.toLowerCase())} ${esc(r.country.toLowerCase())}">`
    + `<td class="ci-rank">${r.rank}</td>`
    + `<td class="ci-city"><a href="/cities/${r.id}">${esc(r.name)}</a><span class="ci-country">${esc(r.country)}</span></td>`
    + `<td class="ci-num ci-solo" data-v="${r.solo}">${money(r.solo)}</td>`
    + `<td class="ci-num" data-v="${r.rent}">${money(r.rent)}</td>`
    + `<td class="ci-num" data-v="${r.basket}">${money(r.basket)}</td>`
    + `<td class="ci-num" data-v="${r.meal == null ? '' : r.meal}">${money(r.meal)}</td>`
    + `<td class="ci-num" data-v="${r.transit == null ? '' : r.transit}">${money(r.transit)}</td>`
    + `</tr>`;
}).join('\n');

const regionOptions = Object.keys(REGION_NAMES).map((k) => `<option value="${k}">${REGION_NAMES[k]}</option>`).join('');

// schema.org Dataset (link-worthy)
const dataset = {
  '@context': 'https://schema.org', '@type': 'Dataset',
  name: 'The Nomad HQ Digital Nomad Cost of Living Index',
  description: `Monthly cost-of-living for ${rows.length} cities for a single remote worker: central 1-bedroom rent plus a transparent one-person basket (groceries, meals out, utilities, transport and essentials), priced from Numbeo and converted to USD.`,
  url: 'https://thenomadhq.com/cost-of-living-index',
  creator: { '@id': 'https://thenomadhq.com/#organization' },
  isBasedOn: 'https://www.numbeo.com/cost-of-living/',
  dateModified: fxDate, license: 'https://thenomadhq.com/terms',
  variableMeasured: ['Monthly solo-nomad budget (USD)', '1-bedroom rent, city centre (USD)', 'Monthly one-person basket excluding rent (USD)'],
};

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  ${ga4}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Nomad Cost of Living Index ${new Date().getFullYear()}: Real Monthly Costs, ${rows.length} Cities | The Nomad HQ</title>
  <meta name="description" content="A transparent, sourced cost-of-living index for digital nomads: the real monthly budget for ${rows.length} cities, ranked, from central rent plus a one-person basket priced from Numbeo. Sort and filter by region.">
  <link rel="canonical" href="https://thenomadhq.com/cost-of-living-index">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Digital Nomad Cost of Living Index | The Nomad HQ">
  <meta property="og:description" content="The real monthly budget for ${rows.length} nomad cities, ranked and sourced.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://thenomadhq.com/cost-of-living-index">
  <meta property="og:image" content="https://thenomadhq.com/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/geo-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(dataset)}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://thenomadhq.com/"},{"@type":"ListItem","position":2,"name":"Cost of Living Index","item":"https://thenomadhq.com/cost-of-living-index"}]}</script>
  <style>
    .ci-wrap { max-width:1160px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3.5rem; }
    .ci-controls { display:flex; flex-wrap:wrap; gap:.7rem 1rem; align-items:end; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.15rem; box-shadow:0 6px 16px rgba(15,23,42,.05); margin-bottom:1.2rem; }
    .ci-field label { display:block; font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .3rem; font-weight:600; }
    .ci-field input, .ci-field select { font-family:inherit; font-size:.95rem; padding:.5rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:9px; background:#fff; }
    .ci-field input { width:200px; }
    .ci-count { margin-left:auto; font-size:.85rem; color:var(--color-stone); align-self:center; }
    .ci-tablewrap { overflow-x:auto; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; background:#fff; box-shadow:0 6px 16px rgba(15,23,42,.05); }
    table.ci-table { border-collapse:collapse; width:100%; min-width:720px; font-size:.92rem; }
    .ci-table th { text-align:right; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--color-stone); font-weight:700; padding:.7rem .8rem; border-bottom:2px solid var(--color-sand-dark,#e3d9c6); cursor:pointer; white-space:nowrap; user-select:none; background:var(--color-sand,#f6f1e7); position:sticky; top:0; }
    .ci-table th:first-child, .ci-table th.ci-city-h { text-align:left; }
    .ci-table th.sorted::after { content:' \\2193'; } .ci-table th.sorted.asc::after { content:' \\2191'; }
    .ci-table td { padding:.6rem .8rem; border-bottom:1px solid var(--color-sand,#f0e9dc); text-align:right; font-variant-numeric:tabular-nums; }
    .ci-table tr:last-child td { border-bottom:none; }
    .ci-table tbody tr:hover { background:var(--color-sand,#faf6ee); }
    .ci-rank { color:var(--color-stone); font-variant-numeric:tabular-nums; }
    .ci-city { text-align:left; }
    .ci-city a { color:var(--color-ink); font-weight:700; text-decoration:none; } .ci-city a:hover { color:var(--color-terracotta); }
    .ci-country { display:block; font-size:.78rem; color:var(--color-stone); font-weight:400; }
    .ci-solo { font-weight:800; color:var(--color-ink); }
    .ci-note { font-size:.8rem; color:var(--color-stone); margin-top:1rem; line-height:1.6; }
    .ci-headline { font-size:1.05rem; color:var(--color-charcoal); line-height:1.6; margin:0 0 1.3rem; } .ci-headline b { color:var(--color-ink); }
    @media (max-width:640px){ .ci-field input{width:100%;} .ci-field{flex:1 1 100%;} }
  </style>
  ${brand}
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${nav}
  <main id="main-content" tabindex="-1">
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/geo-hero.webp" alt="A sunlit villa with a pool, evoking the lifestyle a nomad budget buys" fetchpriority="high" width="1920" height="1267">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Data</span>
        <h1>Digital Nomad Cost of Living Index</h1>
        <p class="sub">The real monthly budget for ${rows.length} cities, ranked from cheapest to priciest. Every figure is central rent plus a transparent one-person basket, priced from Numbeo and converted to USD. Sort any column, or filter by region.</p>
      </div></div>
    </header>
    <div class="ci-wrap">
      <p class="ci-headline">A comfortable solo-nomad month ranges from <b>${money(cheapest.solo)}</b> in <b>${esc(cheapest.name)}</b> to <b>${money(priciest.solo)}</b> in <b>${esc(priciest.name)}</b>. That is the same life costing <b>${(priciest.solo / cheapest.solo).toFixed(1)}x</b> more depending on where you base yourself.</p>
      <div class="ci-controls">
        <div class="ci-field"><label for="ciSearch">Search city or country</label><input type="search" id="ciSearch" placeholder="e.g. Lisbon, Thailand&hellip;" autocomplete="off"></div>
        <div class="ci-field"><label for="ciRegion">Region</label><select id="ciRegion"><option value="">Anywhere</option>${regionOptions}</select></div>
        <span class="ci-count" id="ciCount"></span>
      </div>
      <div class="ci-tablewrap">
        <table class="ci-table" id="ciTable">
          <thead><tr>
            <th data-k="rank" class="sorted asc">#</th>
            <th data-k="name" class="ci-city-h">City</th>
            <th data-k="solo" title="Central 1-bed rent + one-person basket">Solo / mo</th>
            <th data-k="rent">1-bed rent</th>
            <th data-k="basket" title="One-person monthly basket, excludes rent">Monthly basket</th>
            <th data-k="meal">Meal out</th>
            <th data-k="transit">Transit pass</th>
          </tr></thead>
          <tbody id="ciBody">
${tbody}
          </tbody>
        </table>
      </div>
      <p class="ci-note">Prices sourced from <a href="https://www.numbeo.com/cost-of-living/" target="_blank" rel="nofollow noopener">Numbeo</a> (${esc(asOf)}), converted to USD at rates from ${esc(fxDate)}. "Solo / mo" is a central 1-bedroom rent plus our one-person monthly basket. Real spend varies with lifestyle. Cities where Numbeo has no data keep an editorial estimate on their guide and are not listed here.</p>
    </div>
  <!-- tc-start -->
    <style>
  .tool-content { border-top: 1px solid var(--color-sand-dark,#e3d9c6); background: var(--color-sand,#f6f1e7); padding: 3rem 0 3.5rem; }
  .tool-content .container { max-width: 820px; }
  .tool-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.55rem; color: var(--color-ink,#0f172a); margin: 0 0 .8rem; }
  .tool-content .tc-block { margin-bottom: 2rem; }
  .tool-content p { font-size: 1.02rem; line-height: 1.7; color: var(--color-charcoal,#334155); margin: 0 0 .9rem; }
  .tool-content ul.tc-list { margin: 0 0 1rem 1.1rem; } .tool-content ul.tc-list li { line-height: 1.7; color: var(--color-charcoal); margin-bottom:.3rem; }
  .tool-content details { border-bottom: 1px solid var(--color-sand-dark,#e3d9c6); padding: .85rem 0; }
  .tool-content summary { font-weight: 600; color: var(--color-ink,#0f172a); cursor: pointer; font-size: 1.02rem; list-style: none; position: relative; padding-right: 1.5rem; }
  .tool-content summary::-webkit-details-marker { display: none; }
  .tool-content summary::after { content: '+'; position: absolute; right: 0; top: -2px; font-size: 1.3rem; color: var(--color-terracotta,#c0392b); }
  .tool-content details[open] summary::after { content: '\\2013'; }
  .tool-content details p { margin: .7rem 0 0; }
  .tool-content .tc-related ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem .7rem; }
  .tool-content .tc-related a { display: inline-block; background: #fff; border: 1px solid var(--color-sand-dark,#e3d9c6); border-radius: 999px; padding: .4rem .9rem; font-size: .9rem; font-weight: 600; color: var(--color-charcoal,#334155); text-decoration: none; }
  .tool-content .tc-related a:hover { border-color: var(--color-terracotta,#c0392b); color: var(--color-terracotta,#c0392b); }
</style>
    <section class="tool-content"><div class="container">
      <div class="tc-block"><h2>How this index is built</h2><p>Most "cheapest cities" lists are guesses. This one is not. For every city we take current prices from <a href="https://www.numbeo.com/cost-of-living/" target="_blank" rel="nofollow noopener">Numbeo</a>, the largest crowd-sourced cost-of-living database, and turn them into a single, comparable monthly budget for one remote worker, using the same recipe everywhere so the ranking is fair.</p></div>
      <div class="tc-block"><h2>What the "solo / month" figure includes</h2><p>The headline number is <b>central 1-bedroom rent</b> plus a fixed <b>one-person monthly basket</b> that we price from the same Numbeo data in every city:</p>
        <ul class="tc-list">
          <li>Groceries for one (a set list of staples: milk, bread, eggs, chicken, vegetables, fruit and so on)</li>
          <li>Twelve meals out at inexpensive restaurants</li>
          <li>Basic utilities, a mobile plan and home internet</li>
          <li>A monthly public-transport pass</li>
          <li>A gym membership and a few cinema tickets</li>
        </ul>
        <p>Rent is the biggest and most variable cost, so it is shown separately too. The basket is deliberately modest and identical across cities: the point is a like-for-like comparison, not your exact spend. All local prices are converted to USD at published exchange rates.</p></div>
      <div class="tc-block"><h2>How to read it</h2><p>Sort by any column, or filter by region, to find where your money goes furthest. Then open a city's full guide for the detailed cost table, visa notes and neighbourhoods, or drop your income into the <a href="/geoarbitrage">Geoarbitrage calculator</a> to see your savings, and the <a href="/salary">Salary calculator</a> to see what you would need to earn there.</p></div>
      <div class="tc-block"><h2>Frequently asked questions</h2>
          <details><summary>Where does the data come from?</summary><p>Individual prices are from Numbeo, a large crowd-sourced database updated continuously. We aggregate them into a single monthly budget with a fixed, published basket, and convert to USD. Numbeo is credited on every city and linked throughout.</p></details>
          <details><summary>Why is my city more or less than I expected?</summary><p>The basket is a modest single-person lifestyle and rent is city-centre. If you share a flat, live outside the centre or cook every meal you will spend less; a central apartment and eating out often will cost more. Use it to compare cities, not as your personal budget.</p></details>
          <details><summary>How current is it?</summary><p>Prices reflect the latest Numbeo figures at the time we last refreshed the index (${esc(asOf)}), with exchange rates from ${esc(fxDate)}. We refresh periodically.</p></details>
          <details><summary>Which cities are missing?</summary><p>Numbeo does not cover many small towns and beach spots. Those keep an editorial cost estimate on their own guide but are left out of this ranking so it stays strictly like-for-like.</p></details>
      </div>
      <div class="tc-block tc-related"><h2>Keep exploring</h2><ul><li><a href="/geoarbitrage">Geoarbitrage Calculator</a></li><li><a href="/salary">Salary Calculator</a></li><li><a href="/nomad-visas">Nomad Visa Finder</a></li><li><a href="/best">Best cities rankings</a></li><li><a href="/cities">Browse all cities</a></li></ul></div>
    </div></section>
  <!-- tc-end -->
  </main>
  ${footer}
  ${navsearch}
  <script>
    (function(){
      var body=document.getElementById('ciBody'),table=document.getElementById('ciTable');
      var search=document.getElementById('ciSearch'),region=document.getElementById('ciRegion'),count=document.getElementById('ciCount');
      var rowsArr=[].slice.call(body.querySelectorAll('tr'));
      var sortK='rank',sortAsc=true;
      function num(tr,k){var c=tr.querySelector('[data-v]');/*fallback*/return 0;}
      function cellVal(tr,k){
        if(k==='name')return tr.querySelector('.ci-city a').textContent.toLowerCase();
        if(k==='rank')return +tr.querySelector('.ci-rank').textContent;
        var idx={solo:2,rent:3,basket:4,meal:5,transit:6}[k];
        var td=tr.children[idx];var v=td.getAttribute('data-v');return v===''?-1:+v;
      }
      function apply(){
        var q=(search.value||'').trim().toLowerCase(),rg=region.value;
        var vis=rowsArr.filter(function(tr){
          if(rg&&tr.getAttribute('data-region')!==rg)return false;
          if(q&&tr.getAttribute('data-name').indexOf(q)<0)return false;return true;
        });
        vis.sort(function(a,b){var x=cellVal(a,sortK),y=cellVal(b,sortK);if(x<y)return sortAsc?-1:1;if(x>y)return sortAsc?1:-1;return 0;});
        body.innerHTML='';vis.forEach(function(tr){body.appendChild(tr);});
        count.textContent=vis.length+' of '+rowsArr.length+' cities';
      }
      table.querySelectorAll('th[data-k]').forEach(function(th){th.addEventListener('click',function(){
        var k=th.getAttribute('data-k');
        if(sortK===k)sortAsc=!sortAsc;else{sortK=k;sortAsc=(k==='name'||k==='rank');}
        table.querySelectorAll('th').forEach(function(h){h.classList.remove('sorted','asc');});
        th.classList.add('sorted');if(sortAsc)th.classList.add('asc');
        apply();
      });});
      search.addEventListener('input',apply);region.addEventListener('change',apply);
      apply();
    })();
  </script>
  ${cc}
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'cost-of-living-index.html'), page);
console.log('Built cost-of-living-index.html with', rows.length, 'cities. Cheapest', cheapest.name, money(cheapest.solo), '| priciest', priciest.name, money(priciest.solo));

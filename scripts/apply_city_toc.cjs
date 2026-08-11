require(require('path').join(__dirname,'_safe_write.cjs'));
// apply_city_toc.cjs — add the sticky in-page section nav (jump links) + scrollspy to every city page.
// Idempotent (skips pages that already have id="cityToc"). RUN LAST, after all content-applying
// scripts, because it needs every target section/heading present to anchor the jump links.
// Styling lives in styles/city-page.css (.city-toc / #cityToc). DRY-RUN unless APPLY=1.
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'cities');
const APPLY = process.env.APPLY === '1';

const NAV = `<!-- Sticky in-page section nav (jump links) -->
    <nav class="city-toc" id="cityToc" aria-label="Jump to a section">
      <div class="city-toc-inner">
        <a href="#facts">Facts</a>
        <a href="#scores">Scores</a>
        <a href="#weather">Weather</a>
        <a href="#neighborhoods">Neighborhoods</a>
        <a href="#cost-of-living">Cost</a>
        <a href="#visas">Visas</a>
        <a href="#where-to-stay">Stay</a>
        <a href="#coworking">Coworking</a>
        <a href="#where-to-eat">Eat</a>
        <a href="#reviews">Reviews</a>
        <a href="#faq">FAQ</a>
      </div>
    </nav>

    `;

const JS = `  <!-- city-toc-js: highlight the active section in the sticky jump nav -->
  <script>(function(){var toc=document.querySelector('.city-toc');if(!toc)return;var inner=toc.querySelector('.city-toc-inner');var links=[].slice.call(toc.querySelectorAll('a'));var map={},targets=[];links.forEach(function(a){var id=a.getAttribute('href').slice(1);var el=document.getElementById(id);if(el){map[id]=a;targets.push(el);}});if(!targets.length)return;var current=null;function setActive(id){if(current===id||!map[id])return;current=id;links.forEach(function(a){a.classList.remove('active');});var a=map[id];a.classList.add('active');if(inner){inner.scrollLeft=a.offsetLeft-inner.clientWidth/2+a.clientWidth/2;}}var obs=new IntersectionObserver(function(entries){var vis=entries.filter(function(e){return e.isIntersecting;});if(vis.length){vis.sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top;});setActive(vis[0].target.id);}},{rootMargin:'-132px 0px -68% 0px',threshold:0});targets.forEach(function(t){obs.observe(t);});})();</script>
  <!-- /city-toc-js -->
`;

// [anchor substring, replacement] pairs; each anchor must occur exactly once per page.
const idEdits = [
  ['<section class="categories-section">', '<section class="categories-section" id="scores">'],
  ['<section class="voting-section">', '<section class="voting-section" id="reviews">'],
  ['<h2>Cost of Living', '<h2 id="cost-of-living">Cost of Living'],
  ['<h2>Best Coworking Spaces', '<h2 id="coworking">Best Coworking Spaces'],
  ['<h2>Visas', '<h2 id="visas">Visas'],
  ['<h2>Where to Stay in', '<h2 id="where-to-stay">Where to Stay in'],
  ['<h2>Where to Eat', '<h2 id="where-to-eat">Where to Eat'],
];

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));
let done = 0, skip = 0, bad = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('id="cityToc"')) { skip++; continue; }

  // validate every anchor is present exactly once before touching the file
  const missing = [];
  for (const [a] of idEdits) if (!s.includes(a)) missing.push(a);
  if (!s.includes('<section class="score-section">')) missing.push('score-section');
  if (!s.includes('</body>')) missing.push('</body>');
  if (missing.length) { bad++; console.error('SKIP (missing anchor) ' + f + ': ' + missing.join(' | ')); continue; }

  for (const [a, b] of idEdits) s = s.replace(a, b);
  s = s.replace('<section class="score-section">', NAV + '<section class="score-section">');
  s = s.replace('</body>', JS + '</body>');

  if (APPLY) fs.writeFileSync(p, s);
  done++;
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' | patched: ' + done + ' | already had TOC: ' + skip + ' | bad(skipped): ' + bad + ' | total: ' + files.length);

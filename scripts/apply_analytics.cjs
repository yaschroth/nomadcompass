/**
 * Installs Google Analytics 4 (gtag.js) with GDPR Consent Mode v2 on every page,
 * idempotently, plus a slim cookie-consent banner.
 *   - Head (after <head>, <!-- ga4 --> markers): gtag with consent DEFAULT denied for
 *     all storage; if the visitor previously accepted (localStorage), consent is granted
 *     immediately. GA loads either way but only sets analytics cookies once granted.
 *   - Body (before </body>, <!-- cc --> markers): the Accept/Decline banner, shown only
 *     until the visitor chooses; Accept -> consent update granted + remembered.
 *
 * Run after any generator that rewrites <head>/<body>. Chained into rebuild_rankings.cjs.
 * Usage: node scripts/apply_analytics.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GA_ID = 'G-JV1BMRJF89';

const BLOCK = `  <!-- ga4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('nomadhq_consent')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}gtag('config','${GA_ID}');</script>
  <!-- /ga4 -->`;

const BANNER = `  <!-- cc -->
  <div id="cookie-consent" class="cc-banner" role="dialog" aria-label="Cookie consent" hidden>
    <p class="cc-text">We use cookies to measure traffic and improve the site. Accept analytics cookies, or decline and we keep only what is essential. See our <a href="/privacy">Privacy Policy</a>.</p>
    <div class="cc-actions">
      <button type="button" id="cc-decline" class="cc-btn cc-btn-ghost">Decline</button>
      <button type="button" id="cc-accept" class="cc-btn cc-btn-primary">Accept</button>
    </div>
  </div>
  <style>
    .cc-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;gap:1rem 1.4rem;flex-wrap:wrap;justify-content:center;background:var(--color-ink,#0f172a);color:#fff;padding:.9rem 1.2rem;box-shadow:0 -4px 22px rgba(0,0,0,.2);}
    .cc-banner[hidden]{display:none!important;}
    .cc-text{margin:0;font-size:.9rem;line-height:1.5;max-width:66ch;color:rgba(255,255,255,.9);}
    .cc-text a{color:#ff8863;text-decoration:underline;}
    .cc-actions{display:flex;gap:.6rem;flex:0 0 auto;}
    .cc-btn{cursor:pointer;border-radius:999px;padding:.5rem 1.2rem;font-size:.88rem;font-weight:600;font-family:inherit;border:1px solid transparent;transition:background .15s,border-color .15s;}
    .cc-btn-primary{background:var(--color-terracotta,#c0392b);color:#fff;}
    .cc-btn-primary:hover{background:#a5311f;}
    .cc-btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.4);}
    .cc-btn-ghost:hover{border-color:#fff;}
  </style>
  <script>(function(){var K='nomadhq_consent',bar=document.getElementById('cookie-consent');function upd(s){if(typeof gtag==='function'){gtag('consent','update',{analytics_storage:s==='granted'?'granted':'denied'});}}var saved=null;try{saved=localStorage.getItem(K);}catch(e){}if(saved!=='granted'&&saved!=='denied'){if(bar)bar.hidden=false;}function choose(s){try{localStorage.setItem(K,s);}catch(e){}upd(s);if(bar)bar.hidden=true;}var a=document.getElementById('cc-accept'),d=document.getElementById('cc-decline');if(a)a.addEventListener('click',function(){choose('granted');});if(d)d.addEventListener('click',function(){choose('denied');});})();</script>
  <!-- /cc -->`;

function htmlIn(dir) {
  const abs = dir === '.' ? ROOT : path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => (dir === '.' ? f : path.join(dir, f)));
}
const all = ['.', 'cities', 'best', 'tier-list', 'activities', 'blog', 'about'].flatMap(htmlIn);

const gaRe = /  <!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/;
const ccRe = /  <!-- cc -->[\s\S]*?<!-- \/cc -->/;
let ga = 0, cc = 0, noHead = 0, noBody = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  // GA4 head snippet (update-in-place, else insert after <head>).
  if (gaRe.test(html)) { html = html.replace(gaRe, BLOCK); }
  else {
    const m = html.match(/<head[^>]*>/i);
    if (m) html = html.replace(m[0], m[0] + '\n' + BLOCK); else noHead++;
  }

  // Consent banner (update-in-place, else insert before </body>).
  if (ccRe.test(html)) { html = html.replace(ccRe, BANNER); }
  else if (/<\/body>/i.test(html)) { html = html.replace(/<\/body>/i, BANNER + '\n</body>'); }
  else noBody++;

  if (html !== before) { fs.writeFileSync(abs, html); ga++; }
  if (/  <!-- cc -->/.test(html)) cc++;
}
console.log(`GA4 (${GA_ID}) + consent: written ${ga}, banner on ${cc}, no <head> ${noHead}, no </body> ${noBody} of ${all.length}`);

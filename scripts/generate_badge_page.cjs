require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Generates badge.html  ->  served at /badge: the Checked badge, for providers to put on their own site.
 *
 * WHY
 *
 * The directory lists 79,000 providers and about 25,000 of them have a website. A provider that
 * confirms its entry earns the Checked tier, and this page gives it something to do with that: a
 * badge for its own site that links back to its card. The link is the point. Each one is a link
 * from a provider's domain to the page that lists it, earned by confirming an entry and never by
 * paying, which is the only kind of link this site should ever ask for. The same page tells a
 * provider who is not Checked yet how to get there: the "Is this you?" link on its card.
 *
 * The list of entries is built from the data, so a provider whose tier lapsed is simply not offered
 * (expire_checked_tier.cjs moves it back to self-declared after a year). Re-run with the directory.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));
const M = require(path.join(__dirname, 'lib', 'service_data.cjs'));
const P = require(path.join(__dirname, 'lib', 'service_prose.cjs'));
const { db } = require(path.join(__dirname, 'lib', 'service_db.cjs'));

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The most specific page a card is on: the city-and-service page where one exists, else the city page.
const pairUrl = {};
const manifest = path.join(ROOT, 'data', 'service-pair-pages.json');
if (fs.existsSync(manifest)) JSON.parse(fs.readFileSync(manifest, 'utf8')).forEach((p) => { pairUrl[p.city + '|' + p.service] = p.url; });

const entries = db.providers
  .filter((p) => p.evidence === 'visited')
  .map((p) => ({
    name: p.name,
    city: M.CITY[p.city] ? M.CITY[p.city].name : p.city,
    url: 'https://thenomadhq.com' + (pairUrl[p.city + '|' + p.category] || '/services/' + p.city) + '#' + P.cardId(p),
    on: p.confirmedOn || '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.city.localeCompare(b.city));

if (!entries.length) { console.error('generate_badge_page: no Checked rows, nothing to offer'); process.exit(1); }

const title = 'The Confirmed listing badge | The Nomad HQ';
const description = 'Providers that confirmed their entry on The Nomad HQ can show the Confirmed listing badge on their site. What it means, who may use it, and the embed code.';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="https://thenomadhq.com/badge">

  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://thenomadhq.com/badge">
  <meta property="og:image" content="https://thenomadhq.com/assets/og-image.png">

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">

  <style>
    .bd-hero { background:var(--color-ink,#0f172a); color:#fff; padding:5.5rem 1.25rem 3rem; }
    .bd-hero-inner { max-width:820px; margin:0 auto; }
    .bd-eyebrow { display:block; font-size:.74rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#ffb199; margin:0 0 .8rem; }
    .bd-hero h1 { font-family:'DM Serif Display',serif; font-weight:400; font-size:clamp(2rem,5vw,3rem); line-height:1.1; margin:0 0 1rem; color:#fff; }
    .bd-lead { font-size:1.08rem; line-height:1.65; color:rgba(255,255,255,.86); max-width:62ch; margin:0; }
    .bd-wrap { max-width:820px; margin:0 auto; padding:2.5rem 1.25rem 4rem; }
    .bd-wrap h2 { font-family:'DM Serif Display',serif; font-weight:400; font-size:1.55rem; margin:2.4rem 0 .8rem; }
    .bd-wrap p, .bd-wrap li { font-size:1rem; line-height:1.7; }
    .bd-wrap ol { padding-left:1.3rem; }
    .bd-previews { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem; margin:1.25rem 0 0; }
    .bd-preview { display:flex; align-items:center; justify-content:center; padding:2rem 1rem; border:1px solid #e7ded0; }
    .bd-preview.is-dark { background:#f6f1e7; }
    .bd-preview.is-light { background:#fff; }
    .bd-preview img { display:block; width:260px; height:60px; }
    .bd-get { margin-top:1.25rem; padding:1.5rem; background:#f6f1e7; border:1px solid #e7ded0; }
    .bd-get label { display:block; font-weight:700; font-size:.92rem; margin:0 0 .4rem; }
    .bd-get select, .bd-get textarea { width:100%; font:inherit; font-size:.95rem; padding:.65rem .75rem; border:1px solid #cfc5b4; background:#fff; color:var(--color-ink,#0f172a); border-radius:0; }
    .bd-get textarea { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.82rem; line-height:1.5; min-height:7.5rem; resize:vertical; margin-top:.5rem; }
    .bd-row { display:flex; flex-wrap:wrap; gap:.75rem 1rem; align-items:center; margin-top:1rem; }
    .bd-variant { display:flex; gap:1rem; font-size:.92rem; }
    .bd-variant label { display:inline-flex; align-items:center; gap:.35rem; font-weight:600; margin:0; }
    .bd-copy { cursor:pointer; font:inherit; font-weight:700; font-size:.92rem; padding:.6rem 1.2rem; background:var(--color-terracotta,#c0392b); color:#fff; border:0; border-radius:0; clip-path:polygon(0 0,100% 0,96% 100%,0 100%); }
    .bd-copy:hover { background:#a5311f; }
    .bd-copied { font-size:.88rem; color:#1c5c3c; }
    .bd-preview-live { margin-top:1.25rem; padding:1.25rem; background:#fff; border:1px dashed #cfc5b4; display:flex; align-items:center; gap:1rem; flex-wrap:wrap; font-size:.88rem; color:var(--color-stone,#6b7280); }
    .bd-preview-live[hidden] { display:none; }
    .bd-none { margin-top:.75rem; font-size:.95rem; }
    @media (max-width:640px) { .bd-hero { padding-top:4.5rem; } }
  </style>
  ${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.navFor()}

  <main id="main-content">
    <header class="bd-hero">
      <div class="bd-hero-inner">
        <span class="bd-eyebrow">For listed providers</span>
        <h1>The Confirmed listing badge</h1>
        <p class="bd-lead">A provider that confirms its own entry in our directory, including the languages it works in, is marked <em>Checked with them</em> with the date and listed first on its city, service and language pages. If that is you, you can show it on your own site. The badge links to your entry.</p>
      </div>
    </header>

    <div class="bd-wrap">
      <div class="bd-previews">
        <div class="bd-preview is-dark"><img src="/assets/badge-checked.svg" alt="The Checked badge, dark version" width="260" height="60"></div>
        <div class="bd-preview is-light"><img src="/assets/badge-checked-light.svg" alt="The Checked badge, light version" width="260" height="60"></div>
      </div>

      <h2>What it means</h2>
      <p>It means the provider answered us and confirmed what its card says, on the date the card shows. That is all it means, and it is more than any list we read can tell us, because it comes from the business itself in answer to a question. It says nothing about how good the work is. It cannot be bought, and it cannot be given to anyone who did not confirm their own entry.</p>
      <p>A confirmation holds for twelve months. After that the card goes back to the tier it had before, until the provider confirms again, and the badge should come down with it.</p>

      <h2>Get your badge</h2>
      <div class="bd-get">
        <label for="bdPick">Your entry</label>
        <select id="bdPick">
          <option value="">Choose your listing</option>
          ${entries.map((e, i) => `<option value="${i}">${esc(e.name)} (${esc(e.city)})</option>`).join('\n          ')}
        </select>
        <div class="bd-row">
          <div class="bd-variant" role="radiogroup" aria-label="Badge version">
            <label><input type="radio" name="bdVar" value="badge-checked" checked> Dark</label>
            <label><input type="radio" name="bdVar" value="badge-checked-light"> Light</label>
          </div>
        </div>
        <label for="bdCode" style="margin-top:1rem">Paste this where you want the badge</label>
        <textarea id="bdCode" readonly spellcheck="false" placeholder="Choose your listing above and the code appears here."></textarea>
        <div class="bd-row">
          <button type="button" class="bd-copy" id="bdCopy" disabled>Copy the code</button>
          <span class="bd-copied" id="bdCopied" hidden>Copied.</span>
        </div>
        <div class="bd-preview-live" id="bdLive" hidden><span>How it will look:</span><span id="bdLiveIn"></span></div>
        <p class="bd-none">Not in the list? Then your entry is not Checked yet. Find your card in the directory and use the <em>Is this you?</em> link on it to confirm or correct it, or reply to the email we sent you. Once we have your confirmation, your entry appears here.</p>
      </div>

      <h2>How to use it</h2>
      <ol>
        <li>Keep the link. The badge stands for one entry, and the link is what lets a visitor check it.</li>
        <li>Use the image as it is. Resize it if you like, but do not redraw it or change its words.</li>
        <li>One badge per site, on the page where you present your practice.</li>
        <li>Take it down if your entry is no longer Checked.</li>
      </ol>

      <h2>Not listed at all?</h2>
      <p>If you serve clients in more than one language and work in one of our cities, <a href="/list-your-business">list your business</a>. Listing is free.</p>
    </div>
  </main>

  <script>(function(){
    var E=${JSON.stringify(entries.map((e) => ({ n: e.name, c: e.city, u: e.url })))};
    var pick=document.getElementById('bdPick'),code=document.getElementById('bdCode'),copy=document.getElementById('bdCopy'),ok=document.getElementById('bdCopied'),live=document.getElementById('bdLive'),liveIn=document.getElementById('bdLiveIn');
    function variant(){var r=document.querySelector('input[name=bdVar]:checked');return r?r.value:'badge-checked';}
    function build(){
      var e=E[pick.value];ok.hidden=true;
      if(!e){code.value='';copy.disabled=true;live.hidden=true;return;}
      var img='https://thenomadhq.com/assets/'+variant()+'.svg';
      code.value='<a href="'+e.u+'" title="Confirmed listing on The Nomad HQ"><img src="'+img+'" alt="Confirmed listing on The Nomad HQ" width="260" height="60" loading="lazy" style="border:0"></a>';
      copy.disabled=false;
      liveIn.innerHTML='<a href="'+e.u+'"><img src="/assets/'+variant()+'.svg" alt="" width="260" height="60" style="display:block"></a>';
      live.hidden=false;
    }
    pick.addEventListener('change',build);
    Array.prototype.forEach.call(document.querySelectorAll('input[name=bdVar]'),function(r){r.addEventListener('change',build);});
    copy.addEventListener('click',function(){
      code.focus();code.select();
      var done=function(){ok.hidden=false;};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code.value).then(done,function(){try{document.execCommand('copy');done();}catch(e){}});}
      else{try{document.execCommand('copy');done();}catch(e){}}
    });
  })();</script>

  ${shell.footer}
${shell.bodyEnd}
</body>
</html>
`;

shell.assertComplete(html, 'badge.html');
shell.writePage('badge.html', html);
console.log('Wrote badge.html with ' + entries.length + ' Checked entries.');

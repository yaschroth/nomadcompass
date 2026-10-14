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
 *
 * ONE BADGE PER PROVIDER, NOT ONE FOR EVERYBODY
 *
 * A single badge image can be pasted onto any site by anyone. So each Checked provider gets its own
 * pair of SVGs at /badges/<city>-<name>.svg (and -light.svg) carrying its name and the date it
 * confirmed: copied onto another firm's site it names the wrong firm. Every key ever issued is kept
 * in data/badge-issued.json, and when a provider stops being Checked its files are rewritten as
 * "Listing not confirmed". Sites that embedded it change with it, without anyone asking them to.
 * vercel.json caches /badges/ for a day, not the week /assets/ gets, so the change arrives.
 */
const fs = require('fs');
const { execFileSync } = require('child_process');
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

// The file name: city first, because one name can be listed in two cities (MexTax, Lux Brumalis).
const badgeKey = (p) => p.city + '-' + P.cardId(p).replace(/^p-/, '');

const entries = db.providers
  .filter((p) => p.evidence === 'visited')
  .map((p) => ({
    key: badgeKey(p),
    name: p.name,
    city: M.CITY[p.city] ? M.CITY[p.city].name : p.city,
    url: 'https://thenomadhq.com' + (pairUrl[p.city + '|' + p.category] || '/services/' + p.city) + '#' + P.cardId(p),
    on: p.confirmedOn || '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.city.localeCompare(b.city));

if (!entries.length) { console.error('generate_badge_page: no Checked rows, nothing to offer'); process.exit(1); }
const dupKey = entries.map((e) => e.key).filter((k, i, a) => a.indexOf(k) !== i);
if (dupKey.length) { console.error('generate_badge_page: two Checked rows share a badge file: ' + dupKey.join(', ')); process.exit(1); }

// ---- the badge files ------------------------------------------------------------------------------
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const longDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${Number(m[3])} ${MON[Number(m[2]) - 1]} ${m[1]}` : ''; };
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Text as outlines in the site's own fonts (scripts/text_to_path.py). The badge is an <img> on
 * somebody else's site and cannot load our fonts; outlines need none. One python call per batch.
 * A name in a script the fonts do not cover (a Tokyo clinic) comes back `missing` and is drawn as
 * <text> in the system sans instead.
 */
function outlines(jobs) {
  if (!jobs.length) return [];
  const out = execFileSync('python', ['-I', path.join(__dirname, 'text_to_path.py')], { input: JSON.stringify(jobs), maxBuffer: 1 << 26 });
  return JSON.parse(out.toString());
}
const NAME_FONT = { font: 'barlow-600', size: 12.5 };
const W = 320; const H = 88; const TX = 76; const NAME_MAX = W - TX - 14;
// Cut on a word where one is near, keeping a word that the cut already ends on.
const cutTo = (s, n) => {
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  if (s.charAt(n - 1) === ' ') return cut.replace(/[\s,.&-]+$/, '') + '…';
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.&-]+$/, '') + '…';
};
// Names that do not fit are cut in proportion to how far over they are and measured again, until they fit.
function fittedNames(names) {
  let cur = names.slice();
  let m = outlines(cur.map((t) => ({ text: t, ...NAME_FONT })));
  for (let round = 0; round < 4; round += 1) {
    const over = cur.map((t, i) => (!m[i].missing && m[i].width > NAME_MAX ? i : -1)).filter((i) => i >= 0);
    if (!over.length) break;
    over.forEach((i) => { cur[i] = cutTo(names[i], Math.max(8, Math.floor((cur[i].length * NAME_MAX) / m[i].width) - round)); });
    const again = outlines(over.map((i) => ({ text: cur[i], ...NAME_FONT })));
    over.forEach((i, j) => { m[i] = again[j]; });
  }
  return cur.map((t, i) => ({ text: t, o: m[i] }));
}
const FIXED = outlines([
  { text: 'CONFIRMED LISTING ON', font: 'chakra-petch-700', size: 9, track: 1.3 },
  { text: 'LISTING NOT CONFIRMED', font: 'chakra-petch-700', size: 9, track: 1.3 },
  { text: 'The Nomad', font: 'chakra-petch-700', size: 21 },
  { text: 'HQ', font: 'chakra-petch-700', size: 21 },
  { text: 'Confirmation lapsed', font: 'barlow-400', size: 10.5 },
]);
const [EYEBROW, EYEBROW_LAPSED, NOMAD, HQ, LAPSED_LINE] = FIXED;
const at = (o, x, y, fill) => `<path transform="translate(${x} ${y})" fill="${fill}" d="${o.d}"/>`;

/**
 * The owner's pick of three (2026-10-14), "A: Slant": an ink field with a terracotta slab cut on the
 * home hero's "/" diagonal, the white check inside it, and the wordmark as the nav writes it. The
 * lapsed version keeps the layout and greys the slab, so a stale embed visibly tells on itself.
 */
function badgeSvg({ name, on, dateLine, light, lapsed }) {
  const bg = light ? '#ffffff' : '#0f172a';
  const ink = light ? '#0f172a' : '#ffffff';
  const sub = light ? '#64748b' : '#94a3b8';
  const slab = lapsed ? '#64748b' : '#c0392b';
  const head = lapsed ? sub : (light ? '#c0392b' : '#ff8863');
  const label = lapsed ? `Listing not confirmed on The Nomad HQ: ${name.text}` : `Confirmed listing on The Nomad HQ: ${name.text}, ${longDate(on)}`;
  const mark = lapsed
    ? '<path d="M7 15h18v2.4H7z"/>'
    : '<path d="M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z"/>';
  const nameEl = name.o.missing
    ? `<text x="${TX}" y="66" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="12.5" font-weight="600" fill="${ink}">${xml(name.text)}</text>`
    : at(name.o, TX, 66, ink);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${xml(label)}">
<title>${xml(label)}</title>
<rect width="${W}" height="${H}" fill="${bg}"/>${light ? `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#0f172a" stroke-opacity=".9"/>` : ''}
<polygon points="0,0 62,0 46,${H} 0,${H}" fill="${slab}"/>
<g transform="translate(10 28)" fill="#ffffff">${mark}</g>
${at(lapsed ? EYEBROW_LAPSED : EYEBROW, TX, 24, head)}
${at(NOMAD, TX, 47, ink)}${at(HQ, TX + NOMAD.width + 6, 47, lapsed ? sub : '#c0392b')}
${nameEl}
${at(lapsed ? LAPSED_LINE : dateLine, TX, 80, sub)}
</svg>
`;
}

const BADGE_DIR = path.join(ROOT, 'badges');
const ISSUED_FILE = path.join(ROOT, 'data', 'badge-issued.json');
fs.mkdirSync(BADGE_DIR, { recursive: true });
const issued = fs.existsSync(ISSUED_FILE) ? JSON.parse(fs.readFileSync(ISSUED_FILE, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
const live = new Set();
for (const e of entries) {
  if (!e.on) { console.error('generate_badge_page: Checked row without confirmedOn: ' + e.name); process.exit(1); }
  live.add(e.key);
  issued[e.key] = { name: e.name, firstIssued: (issued[e.key] && issued[e.key].firstIssued) || today };
}
// Issued once and no longer Checked: the file stays, and says so.
const lapsed = Object.keys(issued).filter((k) => !live.has(k));
const names = fittedNames([...entries.map((e) => e.name), ...lapsed.map((k) => issued[k].name)]);
const dates = outlines(entries.map((e) => ({ text: 'Confirmed ' + longDate(e.on), font: 'barlow-400', size: 10.5 })));
entries.forEach((e, i) => {
  const a = { name: names[i], on: e.on, dateLine: dates[i] };
  fs.writeFileSync(path.join(BADGE_DIR, e.key + '.svg'), badgeSvg(a));
  fs.writeFileSync(path.join(BADGE_DIR, e.key + '-light.svg'), badgeSvg({ ...a, light: true }));
});
lapsed.forEach((k, j) => {
  const a = { name: names[entries.length + j], lapsed: true };
  fs.writeFileSync(path.join(BADGE_DIR, k + '.svg'), badgeSvg(a));
  fs.writeFileSync(path.join(BADGE_DIR, k + '-light.svg'), badgeSvg({ ...a, light: true }));
});
fs.writeFileSync(ISSUED_FILE, JSON.stringify(issued, null, 1) + '\n');
const sample = entries.find((e) => e.name.length < 26) || entries[0];

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
    .bd-preview img { display:block; width:320px; max-width:100%; height:auto; }
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
        <div class="bd-preview is-dark"><img src="/badges/${sample.key}.svg" alt="An example badge, dark version" width="320" height="88"></div>
        <div class="bd-preview is-light"><img src="/badges/${sample.key}-light.svg" alt="An example badge, light version" width="320" height="88"></div>
      </div>

      <h2>What it means</h2>
      <p>It means the provider answered us and confirmed what its card says, on the date the card shows. That is all it means, and it is more than any list we read can tell us, because it comes from the business itself in answer to a question. It says nothing about how good the work is. It cannot be bought, and it cannot be given to anyone who did not confirm their own entry.</p>
      <p>Each badge is made for one provider: it carries your name and the date you confirmed, and it links to your entry. Copied onto another site it names you, not them, and the link shows whose it is.</p>
      <p>A confirmation holds for twelve months. After that the card goes back to the tier it had before, until the provider confirms again, and the badge changes by itself to read <em>Listing not confirmed</em>, wherever it is shown. Confirm again and it comes back.</p>

      <h2>Get your badge</h2>
      <div class="bd-get">
        <label for="bdPick">Your entry</label>
        <select id="bdPick">
          <option value="">Choose your listing</option>
          ${entries.map((e, i) => `<option value="${i}">${esc(e.name)} (${esc(e.city)})</option>`).join('\n          ')}
        </select>
        <div class="bd-row">
          <div class="bd-variant" role="radiogroup" aria-label="Badge version">
            <label><input type="radio" name="bdVar" value="" checked> Dark</label>
            <label><input type="radio" name="bdVar" value="-light"> Light</label>
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
        <li>Link the image from our address, as the code does, rather than saving a copy: that is what lets it update when your entry does.</li>
      </ol>

      <h2>Not listed at all?</h2>
      <p>If you serve clients in more than one language and work in one of our cities, <a href="/list-your-business">list your business</a>. Listing is free.</p>
    </div>
  </main>

  <script>(function(){
    var E=${JSON.stringify(entries.map((e) => ({ n: e.name, c: e.city, u: e.url, k: e.key })))};
    var pick=document.getElementById('bdPick'),code=document.getElementById('bdCode'),copy=document.getElementById('bdCopy'),ok=document.getElementById('bdCopied'),live=document.getElementById('bdLive'),liveIn=document.getElementById('bdLiveIn');
    function variant(){var r=document.querySelector('input[name=bdVar]:checked');return r?r.value:'';}
    function build(){
      var e=E[pick.value];ok.hidden=true;
      if(!e){code.value='';copy.disabled=true;live.hidden=true;return;}
      var img='https://thenomadhq.com/badges/'+e.k+variant()+'.svg';
      code.value='<a href="'+e.u+'" title="Confirmed listing on The Nomad HQ"><img src="'+img+'" alt="Confirmed listing on The Nomad HQ: '+e.n.replace(/"/g,'&quot;')+'" width="320" height="88" loading="lazy" style="border:0;max-width:100%;height:auto"></a>';
      copy.disabled=false;
      liveIn.innerHTML='<a href="'+e.u+'"><img src="/badges/'+e.k+variant()+'.svg" alt="" width="320" height="88" style="display:block;max-width:100%;height:auto"></a>';
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

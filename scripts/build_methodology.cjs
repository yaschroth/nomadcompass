require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Builds /methodology from data/provenance.json.
 *
 * The manifest has existed for a while and no reader has ever seen it. It records, per dataset, the
 * tier, the source, the corroborating sources, the retrieval date, the coverage and the known
 * limits. The site's whole position against Nomad List is that its numbers can be checked, and the
 * one artifact that proves it was sitting in the repo.
 *
 * Generated rather than written, so it cannot drift from the manifest it describes. Change
 * provenance.json and re-run; do not edit methodology.html.
 *
 * The page is deliberately not flattering. The editorial tier is given the same room as the other
 * two, including the note that the 13 category scores driving the Nomad Score, every ranking and
 * every share card are editorial judgement presented as if measured. Publishing a provenance page
 * that quietly omits its weakest entry would be worse than having no page.
 *
 * The one design decision worth stating: coverage is drawn as a bar, not left as prose. "331 of 710
 * cities" reads like a fact in a sentence and like a gap when it is half a bar, and the gap is the
 * honest part. It is the only thing on the page that is a graphic rather than text.
 *
 * Usage: node scripts/build_methodology.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const BASE = 'https://thenomadhq.com';
const URL = BASE + '/methodology';

const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'provenance.json'), 'utf8'));
const TIERS = prov._tiers;

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLES = {
  climate: 'Climate normals', timezones: 'Time zones', 'hero-images': 'City photographs',
  'numbeo-costs': 'Cost of living components', visa: 'Visa rules and income thresholds',
  'city-elevations': 'Elevation', 'city-scores': 'The 13 category scores',
  'cost-per-month': 'Monthly budget figure', 'guide-prose': 'City guide sections',
  neighborhoods: 'Neighbourhood descriptions', venues: 'Venue ratings and listings',
  'service-languages': 'Service providers by language', 'country-facts': 'Country facts panel',
  'country-meta': 'Plug types and country metadata',
};

const ORDER = ['primary', 'triangulated', 'editorial'];
const TIER_LABEL = { primary: 'Primary', triangulated: 'Triangulated', editorial: 'Editorial' };
const TIER_LEDE = {
  primary: 'Taken straight from whoever produces or governs the data. If you follow the link you land on the same number.',
  triangulated: 'No usable primary source exists, so the figure is agreed across at least two independent sources, both named here.',
  editorial: 'Our judgement, not a measurement. Listed here in full because a number you cannot check should say so.',
};

const datasets = Object.keys(prov).filter((k) => !k.startsWith('_'));
const byTier = {};
ORDER.forEach((t) => { byTier[t] = datasets.filter((k) => prov[k].tier === t); });

const niceDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  return d + ' ' + MONTHS[m - 1] + ' ' + y;
};

/** "331 of 710 cities" -> a bar. Anything without an "N of M" gets the text alone. */
function coverage(text) {
  if (!text) return '';
  const m = String(text).match(/([\d,]+)\s+of\s+([\d,]+)/);
  if (!m) return '<p class="mth-cov-text">' + esc(text) + '</p>';
  const have = Number(m[1].replace(/,/g, ''));
  const all = Number(m[2].replace(/,/g, ''));
  if (!all) return '<p class="mth-cov-text">' + esc(text) + '</p>';
  const pct = Math.max(2, Math.round((have / all) * 100));
  return '<div class="mth-cov">'
    + '<div class="mth-bar" role="img" aria-label="' + esc(have + ' of ' + all + ', ' + pct + ' percent') + '">'
    + '<span style="width:' + pct + '%"></span></div>'
    + '<p class="mth-cov-text">' + esc(text) + '</p></div>';
}

/** Long text as an open first sentence plus a disclosure holding the remainder. */
function fold(text) {
  const cut = text.indexOf('. ');
  if (cut < 0 || cut > 300) return '<p>' + esc(text) + '</p>';
  return '<details class="mth-more"><summary>' + esc(text.slice(0, cut + 1))
    + ' <span>Read the rest</span></summary><p>' + esc(text.slice(cut + 2)) + '</p></details>';
}

function card(key) {
  const d = prov[key];
  const title = TITLES[key] || key;
  const src = d.sourceUrl
    ? '<a href="' + esc(d.sourceUrl) + '" rel="noopener nofollow" target="_blank">' + esc(d.source) + '</a>'
    : esc(d.source);
  /**
   * A corroboration entry is usually a URL and is sometimes a description of where to look.
   *
   * Linking every entry unconditionally produced two anchors on this page whose href was an English
   * sentence: href="Each provider's own site, recorded per row as sourceUrl in
   * data/service-languages.json". A browser resolves that against the current directory, so both
   * were 404s, on the one page whose whole job is to show that the sourcing is real. A description
   * is worth printing, it is just not worth linking.
   */
  const isUrl = (u) => /^https?:\/\//i.test(String(u));
  const corr = (d.corroboration || []).length
    ? '<p class="mth-row"><span class="mth-k">Corroborated against</span><span class="mth-v">'
      + d.corroboration.map((u) => (isUrl(u)
        ? '<a href="' + esc(u) + '" rel="noopener nofollow" target="_blank">'
          + esc(String(u).replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a>'
        : esc(u))).join(', ')
      + '</span></p>'
    : '';
  const when = d.retrieved
    ? '<p class="mth-row"><span class="mth-k">Retrieved</span><span class="mth-v">' + esc(niceDate(d.retrieved)) + '</span></p>'
    : '';
  // Same treatment for the longest caveats. Two of them are working notes rather than prose, several
  // hundred words with capitalised asides, and burying the short honest ones next to them would
  // punish the datasets that documented themselves well. First sentence stays out, rest folds away.
  const limits = d.knownLimits
    ? '<div class="mth-limits"><span class="mth-limits-k">What this does not cover</span>'
      + (d.knownLimits.length > 320 ? fold(d.knownLimits) : '<p>' + esc(d.knownLimits) + '</p>')
      + '</div>'
    : '';
  // One method runs to 1,200 characters, four times the next longest, and it names the scripts that
  // do the work. Collapsing it keeps the card the same size as its neighbours without hiding
  // anything: the opening sentence stays visible and the rest is one click away.
  const method = d.method.length > 320 ? fold(d.method) : esc(d.method);
  return `<article class="mth-card mth-${esc(d.tier)}" id="${esc(key)}">
          <div class="mth-card-head">
            <h3>${esc(title)}</h3>
            <span class="mth-pill">${esc(TIER_LABEL[d.tier] || d.tier)}</span>
          </div>
          <p class="mth-row"><span class="mth-k">Source</span><span class="mth-v">${src}</span></p>
          ${corr}${when}
          <p class="mth-row"><span class="mth-k">How</span><span class="mth-v">${method}</span></p>
          ${coverage(d.coverage)}
          ${limits}
        </article>`;
}

const section = (t) => `<section class="mth-tier" id="tier-${t}">
        <div class="mth-tier-head">
          <h2>${esc(TIER_LABEL[t])}<span class="mth-count">${byTier[t].length} ${byTier[t].length === 1 ? 'dataset' : 'datasets'}</span></h2>
          <p>${esc(TIER_LEDE[t])}</p>
        </div>
        <div class="mth-grid">
${byTier[t].map(card).join('\n')}
        </div>
      </section>`;

// The footer markup lives with the other generated pages; lift it from one rather than restate it.
const donor = fs.readFileSync(path.join(ROOT, 'compare.html'), 'utf8');
const fm = donor.match(/<footer class="footer">[\s\S]*?<\/footer>/);
if (!fm) { console.error('could not lift the footer from compare.html'); process.exit(1); }
const FOOTER = fm[0];

const DESC = 'Every dataset behind The Nomad HQ, what it is sourced from, when it was retrieved, '
  + 'how much of the site it covers and where it falls short.';

const ld = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Methodology and sources',
  url: URL,
  description: DESC,
  isPartOf: { '@type': 'WebSite', '@id': BASE + '/#website' },
  about: datasets.map((k) => ({ '@type': 'Dataset', name: TITLES[k] || k, description: prov[k].method })),
};
const crumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', BASE + '/'], ['Methodology', URL]]
    .map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Methodology: Where Our Numbers Come From | The Nomad HQ</title>
  <meta name="description" content="${esc(DESC)}">
  <link rel="canonical" href="${URL}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Where our numbers come from | The Nomad HQ">
  <meta property="og:description" content="${esc(DESC)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${URL}">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumb)}</script>
  <style>
    .mth-header { background:linear-gradient(180deg,var(--color-sand,#f6f1e7) 0%, rgba(246,241,231,0) 100%); padding: calc(var(--nav-height,64px) + 3.25rem) 1.25rem 2rem; text-align:center; }
    .mth-header .container { max-width:760px; }
    .mth-crumbs { font-size:.82rem; color:var(--color-stone,#64748b); margin:0 0 1rem; }
    .mth-crumbs a { color:var(--color-terracotta,#c0392b); text-decoration:none; }
    .mth-crumbs span { margin:0 .4rem; color:var(--color-sand-dark,#e3d9c6); }
    .mth-eyebrow { display:inline-block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:var(--color-terracotta,#c0392b); margin:0 0 .6rem; }
    .mth-header h1 { font-family:'DM Serif Display',serif; color:var(--color-ink,#0f172a); font-size:clamp(2.2rem,5.5vw,3.2rem); line-height:1.1; margin:0 0 .9rem; }
    .mth-header p { color:var(--color-charcoal,#334155); font-size:1.08rem; line-height:1.7; margin:0 auto; max-width:62ch; }

    .mth-wrap { max-width:1080px; margin:0 auto; padding:.5rem var(--space-4,1rem) 3.5rem; }

    /* the summary strip: how much of the site is measured, in one line */
    .mth-summary { display:flex; flex-wrap:wrap; gap:.6rem; justify-content:center; margin:0 0 2.8rem; }
    .mth-sum { display:flex; align-items:baseline; gap:.45rem; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:999px; padding:.5rem 1rem; text-decoration:none; }
    .mth-sum:hover { border-color:var(--color-terracotta,#c0392b); }
    .mth-sum b { font-family:'DM Serif Display',serif; font-size:1.25rem; color:var(--color-ink,#0f172a); }
    .mth-sum span { font-size:.86rem; color:var(--color-stone,#64748b); }
    .mth-sum i { width:8px; height:8px; border-radius:50%; display:inline-block; }

    .mth-tier { margin:0 0 3rem; }
    .mth-tier-head { max-width:64ch; margin:0 0 1.3rem; }
    .mth-tier-head h2 { font-family:'DM Serif Display',serif; font-size:1.75rem; color:var(--color-ink,#0f172a); margin:0 0 .4rem; display:flex; align-items:baseline; gap:.7rem; flex-wrap:wrap; }
    .mth-count { font-family:inherit; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-stone,#64748b); }
    .mth-tier-head p { color:var(--color-charcoal,#334155); font-size:1rem; line-height:1.65; margin:0; }

    .mth-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:1.1rem; align-items:start; }
    .mth-card { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-left-width:3px; border-radius:14px; padding:1.15rem 1.25rem 1.25rem; }
    .mth-card-head { display:flex; align-items:baseline; justify-content:space-between; gap:.7rem; margin:0 0 .85rem; }
    .mth-card-head h3 { font-family:'DM Serif Display',serif; font-size:1.18rem; line-height:1.25; color:var(--color-ink,#0f172a); margin:0; }
    .mth-pill { flex:none; font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; padding:.2rem .55rem; border-radius:999px; }

    /* Tier colour is carried by the left border and the pill, nothing else, so the cards still read
       as one family rather than three. */
    .mth-primary { border-left-color:#2f855a; }
    .mth-primary .mth-pill { color:#2f855a; background:rgba(47,133,90,.1); }
    .mth-triangulated { border-left-color:#b7791f; }
    .mth-triangulated .mth-pill { color:#8a5a10; background:rgba(183,121,31,.12); }
    .mth-editorial { border-left-color:var(--color-terracotta,#c0392b); }
    .mth-editorial .mth-pill { color:var(--color-terracotta,#c0392b); background:rgba(192,57,43,.09); }

    /* Label above value, not beside it. A two-column row left roughly 180px for the text inside a
       card this wide, so a source name broke across four lines and one long method turned its card
       into a column three times the height of its neighbours. */
    .mth-row { margin:0 0 .7rem; font-size:.9rem; line-height:1.55; }
    .mth-k { display:block; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone,#64748b); margin:0 0 .15rem; }
    .mth-v { display:block; color:var(--color-charcoal,#334155); overflow-wrap:anywhere; }
    .mth-v a { color:var(--color-terracotta,#c0392b); }

    .mth-cov { margin:.9rem 0 0; }
    .mth-bar { height:6px; border-radius:999px; background:var(--color-sand,#f6f1e7); overflow:hidden; }
    .mth-bar span { display:block; height:100%; border-radius:999px; background:currentColor; }
    .mth-primary .mth-bar span { background:#2f855a; }
    .mth-triangulated .mth-bar span { background:#b7791f; }
    .mth-editorial .mth-bar span { background:var(--color-terracotta,#c0392b); }
    .mth-cov-text { font-size:.82rem; color:var(--color-stone,#64748b); margin:.4rem 0 0; line-height:1.5; }

    .mth-more summary { cursor:pointer; color:var(--color-charcoal,#334155); }
    .mth-more summary span { color:var(--color-terracotta,#c0392b); font-weight:600; white-space:nowrap; }
    .mth-more summary::marker { color:var(--color-sand-dark,#e3d9c6); }
    .mth-more p { margin:.5rem 0 0; color:var(--color-charcoal,#334155); }

    .mth-limits { margin:.95rem 0 0; padding:.75rem .85rem; background:var(--color-sand,#f6f1e7); border-radius:10px; }
    .mth-limits-k { display:block; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-terracotta,#c0392b); margin:0 0 .3rem; }
    .mth-limits p { margin:0; font-size:.86rem; line-height:1.6; color:var(--color-charcoal,#334155); }

    .mth-foot { max-width:64ch; margin:1rem auto 0; padding-top:1.6rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); }
    .mth-foot p { color:var(--color-charcoal,#334155); font-size:.95rem; line-height:1.7; margin:0 0 .7rem; }
    .mth-foot a { color:var(--color-terracotta,#c0392b); }

    @media (max-width:560px) {
      .mth-card-head { flex-direction:column; align-items:flex-start; gap:.4rem; }
    }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.nav}
  <main>
    <header class="mth-header"><div class="container">
      <nav class="mth-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Methodology</nav>
      <span class="mth-eyebrow">How we know</span>
      <h1>Where our numbers come from</h1>
      <p>Every dataset on this site, what produced it, when we fetched it, how much of the site it
      actually covers, and where it falls short. The last of those is the reason this page exists:
      a number you cannot check should say so, and ${byTier.editorial.length} of our
      ${datasets.length} datasets are our own judgement rather than a measurement.</p>
    </div></header>

    <div class="mth-wrap">
      <div class="mth-summary">
${ORDER.map((t) => `        <a class="mth-sum" href="#tier-${t}"><i class="mth-dot-${t}" style="background:${t === 'primary' ? '#2f855a' : t === 'triangulated' ? '#b7791f' : '#c0392b'}"></i><b>${byTier[t].length}</b><span>${esc(TIER_LABEL[t].toLowerCase())}</span></a>`).join('\n')}
      </div>

${ORDER.map(section).join('\n\n')}

      <div class="mth-foot">
        <p>Tiers are defined in our provenance manifest, which this page is generated from, so the
        two cannot drift apart. Primary means ${esc(TIERS.primary.charAt(0).toLowerCase() + TIERS.primary.slice(1))}
        Triangulated means ${esc(TIERS.triangulated.charAt(0).toLowerCase() + TIERS.triangulated.slice(1))}
        Editorial means ${esc(TIERS.editorial.charAt(0).toLowerCase() + TIERS.editorial.slice(1))}</p>
        <p>Found a figure that looks wrong, or a source we should be using instead? Tell us on the
        <a href="/contact">contact page</a>. Corrections are the cheapest way this page gets better.</p>
      </div>
    </div>
  </main>
  ${FOOTER}
  ${shell.bodyEnd}
</body>
</html>
`;

shell.assertComplete(html, 'methodology.html');
const finalHtml = html;

const out = path.join(ROOT, 'methodology.html');
console.log('methodology.html: ' + datasets.length + ' datasets ('
  + ORDER.map((t) => byTier[t].length + ' ' + t).join(', ') + ')');
console.log('  ' + Math.round(finalHtml.length / 1024) + ' KB');
if (APPLY) { fs.writeFileSync(out, finalHtml); console.log('  written'); } else {
  console.log('\nDry run. Re-run with --apply to write.');
}

/**
 * Generates static, indexable city-vs-city comparison pages at /vs/<a>-vs-<b>, targeting the
 * high-demand "X vs Y for digital nomads" query pattern. Content is fully data-driven from
 * cities-data (Nomad Score, monthly cost, 13 category scores) so nothing is fabricated. The page
 * shell (nav + its script + footer) is cloned from compare.html so the site chrome stays in sync;
 * asset links are absolute so /vs/ depth does not matter. Idempotent (overwrites). Adds BreadcrumbList
 * + FAQPage schema. Run generate_sitemap.cjs afterwards.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const byId = new Map((new Function(code + ';return CITIES;'))().map((c) => [c.id, c]));

// shell pieces from compare.html
const cmp = fs.readFileSync(path.join(ROOT, 'compare.html'), 'utf8');
const NAV = cmp.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
const FOOTER = cmp.match(/<footer[\s\S]*?<\/footer>/)[0];
const NAVSCRIPT = (cmp.match(/<script>[\s\S]*?<\/script>/g) || []).find((b) => b.includes('navToggle'));

const CATS = [
  ['climate', 'Climate'], ['cost', 'Cost of Living'], ['wifi', 'WiFi'], ['nightlife', 'Nightlife'],
  ['nature', 'Nature'], ['safety', 'Safety'], ['food', 'Food'], ['community', 'Community'],
  ['english', 'English'], ['visa', 'Visa'], ['culture', 'Culture'], ['cleanliness', 'Cleanliness'],
  ['airquality', 'Air Quality'],
];
const KEYS = CATS.map((c) => c[0]);

function nomadScore(c) {
  const raw = KEYS.reduce((s, k) => s + (c.scores[k] || 0), 0) / KEYS.length;
  return Number(Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1));
}
function iso(flag) { const p = [...(flag || '')]; if (p.length !== 2) return null; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); }
function flagImg(c) { const i = iso(c.flag); return i ? `<img class="flag-img" src="/assets/flags/${i}.svg" alt="" loading="lazy">` : ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

// curated, high-demand pairs (validated against data below)
const PAIRS = [
  ['lisbon', 'porto'], ['lisbon', 'barcelona'], ['lisbon', 'madrid'], ['lisbon', 'berlin'], ['lisbon', 'valencia'],
  ['porto', 'valencia'], ['barcelona', 'madrid'], ['barcelona', 'valencia'], ['valencia', 'alicante'], ['madrid', 'valencia'],
  ['chiangmai', 'bangkok'], ['chiangmai', 'bali'], ['bangkok', 'bali'], ['bali', 'canggu'], ['canggu', 'ubud'],
  ['medellin', 'mexicocity'], ['medellin', 'buenosaires'], ['buenosaires', 'mexicocity'],
  ['tbilisi', 'budapest'], ['budapest', 'prague'], ['prague', 'krakow'], ['krakow', 'warsaw'], ['berlin', 'prague'],
  ['tenerife', 'laspalmas'], ['kualalumpur', 'bangkok'], ['kualalumpur', 'bali'],
  ['hanoi', 'hochiminhcity'], ['danang', 'hoian'], ['hanoi', 'danang'],
  ['split', 'dubrovnik'], ['tallinn', 'riga'], ['tokyo', 'osaka'], ['tokyo', 'seoul'], ['seoul', 'taipei'], ['osaka', 'seoul'],
  ['sofia', 'tbilisi'], ['istanbul', 'athens'], ['dubai', 'istanbul'], ['athens', 'lisbon'], ['taipei', 'bangkok'],
];

function verdictLine(a, b, sa, sb) {
  if (sa === sb) return `${a.name} and ${b.name} are neck and neck at ${sa}`;
  const [w, l, sw, sl] = sa > sb ? [a, b, sa, sb] : [b, a, sb, sa];
  return `${w.name} edges ahead, ${sw} to ${sl}`;
}

function build(a, b) {
  const sa = nomadScore(a), sb = nomadScore(b);
  const leadsA = [], leadsB = [];
  for (const [k, label] of CATS) {
    if (a.scores[k] > b.scores[k]) leadsA.push({ label, d: a.scores[k] - b.scores[k], v: a.scores[k] });
    else if (b.scores[k] > a.scores[k]) leadsB.push({ label, d: b.scores[k] - a.scores[k], v: b.scores[k] });
  }
  const topN = (arr, n = 3) => arr.slice().sort((x, y) => y.d - x.d || y.v - x.v).slice(0, n).map((x) => x.label.toLowerCase());
  const strengthsA = topN(leadsA), strengthsB = topN(leadsB);
  const cheaper = a.costPerMonth <= b.costPerMonth ? a : b;
  const pricier = cheaper === a ? b : a;
  const diff = Math.abs(a.costPerMonth - b.costPerMonth);

  const rows = [
    `<tr><th scope="row">Nomad Score</th><td class="${sa >= sb ? 'vs-win' : ''}">${sa}</td><td class="${sb >= sa ? 'vs-win' : ''}">${sb}</td></tr>`,
    `<tr><th scope="row">Monthly budget</th><td class="${a.costPerMonth <= b.costPerMonth ? 'vs-win' : ''}">${money(a.costPerMonth)}</td><td class="${b.costPerMonth <= a.costPerMonth ? 'vs-win' : ''}">${money(b.costPerMonth)}</td></tr>`,
  ];
  for (const [k, label] of CATS) {
    const av = a.scores[k], bv = b.scores[k];
    rows.push(`<tr><th scope="row">${label}</th><td class="${av >= bv ? 'vs-win' : ''}">${av}/10</td><td class="${bv >= av ? 'vs-win' : ''}">${bv}/10</td></tr>`);
  }

  const listOr = (arr, fallback) => arr.length ? arr.join(', ') : fallback;
  const chooseA = `Choose ${a.name} for ${listOr(strengthsA, 'its overall balance')}${cheaper === a ? ' and a lower monthly budget' : ''}.`;
  const chooseB = `Choose ${b.name} for ${listOr(strengthsB, 'its overall balance')}${cheaper === b ? ' and a lower monthly budget' : ''}.`;

  const faqs = [
    [`Is ${a.name} or ${b.name} cheaper for digital nomads?`,
      `${cheaper.name} is the cheaper base, around ${money(cheaper.costPerMonth)} a month versus ${money(pricier.costPerMonth)} in ${pricier.name}${diff ? `, a difference of about ${money(diff)}` : ''}.`],
    [`Which has better WiFi, ${a.name} or ${b.name}?`,
      a.scores.wifi === b.scores.wifi ? `Both score ${a.scores.wifi}/10 for WiFi, so connectivity is comparable.` : `${(a.scores.wifi > b.scores.wifi ? a : b).name} scores higher for WiFi (${Math.max(a.scores.wifi, b.scores.wifi)}/10 versus ${Math.min(a.scores.wifi, b.scores.wifi)}/10).`],
    [`Which is safer, ${a.name} or ${b.name}?`,
      a.scores.safety === b.scores.safety ? `Both rate ${a.scores.safety}/10 on safety.` : `${(a.scores.safety > b.scores.safety ? a : b).name} rates higher on safety (${Math.max(a.scores.safety, b.scores.safety)}/10 versus ${Math.min(a.scores.safety, b.scores.safety)}/10).`],
    [`${a.name} or ${b.name}: which is better overall for remote work?`,
      sa === sb ? `They tie on the overall Nomad Score (${sa}/10), so it comes down to your priorities.` : `${(sa > sb ? a : b).name} takes the overall Nomad Score (${Math.max(sa, sb)}/10 versus ${Math.min(sa, sb)}/10), though the right pick depends on what you value most.`],
  ];

  const slug = [a.id, b.id].join('-vs-');
  const title = `${a.name} vs ${b.name} for Digital Nomads`;
  const desc = `${a.name} or ${b.name} for remote work? Compare Nomad Score, cost of living, WiFi, safety and all 13 categories side by side to pick your base.`;
  const url = `https://thenomadhq.com/vs/${slug}`;

  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) };
  const crumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenomadhq.com/' },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://thenomadhq.com/compare' },
    { '@type': 'ListItem', position: 3, name: `${a.name} vs ${b.name}`, item: url },
  ] };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ga4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-JV1BMRJF89"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('nomadhq_consent')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}gtag('config','G-JV1BMRJF89');</script>
  <!-- /ga4 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preload" as="image" href="/images/cities/${a.id}.webp" fetchpriority="high">
  <title>${title} | The Nomad HQ</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${title} | The Nomad HQ">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://thenomadhq.com/assets/og-image.png">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(crumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${NAV}
  <main id="main-content" tabindex="-1">
    <header class="vs-hero">
      <div class="vs-hero-media">
        <img src="/images/cities/${a.id}.webp" alt="${esc(a.name)}" onerror="this.src='${a.image}'">
        <img src="/images/cities/${b.id}.webp" alt="${esc(b.name)}" onerror="this.src='${b.image}'">
      </div>
      <div class="vs-hero-overlay"><div class="container">
        <span class="eyebrow">Head to head</span>
        <div class="vs-hero-cities">
          <span class="vs-hero-city">${flagImg(a)} ${esc(a.name)}</span>
          <span class="vs-hero-vs">vs</span>
          <span class="vs-hero-city">${flagImg(b)} ${esc(b.name)}</span>
        </div>
        <h1>${a.name} vs ${b.name}: Which Is Better for Digital Nomads?</h1>
        <span class="vs-verdict-badge">Overall: <b>${verdictLine(a, b, sa, sb)}</b></span>
      </div></div>
    </header>
    <div class="vs-body">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/compare">Compare</a><span>/</span><span aria-current="page">${a.name} vs ${b.name}</span></nav>
      <section>
        <p>Deciding between <a href="/cities/${a.id}">${a.name}</a> and <a href="/cities/${b.id}">${b.name}</a> for your next remote-work base? On the overall Nomad Score, ${verdictLine(a, b, sa, sb)}. On budget, ${cheaper.name} is the more affordable of the two at roughly ${money(cheaper.costPerMonth)} a month versus ${money(pricier.costPerMonth)} in ${pricier.name}. Below is the full side-by-side across all 13 factors we rate, plus where each city pulls ahead.</p>
      </section>
      <section>
        <h2>${a.name} vs ${b.name}: side by side</h2>
        <div class="vs-table-wrap"><table class="vs-table">
          <thead><tr><th scope="col">Factor</th><th scope="col">${flagImg(a)} ${esc(a.name)}</th><th scope="col">${flagImg(b)} ${esc(b.name)}</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table></div>
      </section>
      <section>
        <h2>Where each city wins</h2>
        <div class="vs-cols">
          <div class="vs-col"><h3>${flagImg(a)} ${esc(a.name)} is stronger on</h3><ul>${leadsA.length ? leadsA.sort((x, y) => y.d - x.d).map((x) => `<li>${x.label}</li>`).join('') : '<li>Evenly matched or behind across the board</li>'}</ul></div>
          <div class="vs-col"><h3>${flagImg(b)} ${esc(b.name)} is stronger on</h3><ul>${leadsB.length ? leadsB.sort((x, y) => y.d - x.d).map((x) => `<li>${x.label}</li>`).join('') : '<li>Evenly matched or behind across the board</li>'}</ul></div>
        </div>
      </section>
      <section>
        <h2>The verdict</h2>
        <p>${chooseA} ${chooseB} For an interactive breakdown with a third city, open the <a href="/compare?a=${a.id}&amp;b=${b.id}">full comparison tool</a>.</p>
        <p class="vs-cta"><a class="btn btn-primary" href="/cities/${a.id}">${a.name} guide &rarr;</a><a class="btn btn-secondary" href="/cities/${b.id}">${b.name} guide &rarr;</a><a class="btn btn-ghost" href="/compare?a=${a.id}&amp;b=${b.id}">Compare in the tool &rarr;</a></p>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        ${faqs.map(([q, ans]) => `<h3 class="vs-faq-q">${q}</h3><p class="vs-faq-a">${esc(ans)}</p>`).join('\n        ')}
      </section>
    </div>
  </main>
  ${FOOTER}
  <script src="/cities-data.js"></script>
  <script src="/assets/city-search-index.js" defer></script>
  ${NAVSCRIPT}
</body>
</html>`;
}

const OUT = path.join(ROOT, 'vs');
fs.mkdirSync(OUT, { recursive: true });
const seen = new Set();
let done = 0, missing = [];
for (const [x, y] of PAIRS) {
  const a = byId.get(x), b = byId.get(y);
  if (!a || !b) { missing.push(`${x}/${y}`); continue; }
  const [id1, id2] = [a.id, b.id];
  const slug = `${id1}-vs-${id2}`;
  if (seen.has(slug)) continue;
  seen.add(slug);
  fs.writeFileSync(path.join(OUT, slug + '.html'), build(a, b));
  done++;
}
console.log(`vs pages generated: ${done}` + (missing.length ? ` | missing city: ${missing.join(', ')}` : ''));

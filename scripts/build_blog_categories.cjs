require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds blog topic-cluster pillar pages at /blog/category/<slug> (one per article:section):
 * a crawlable landing page listing every post in that category, so the blog gains real
 * topical hubs instead of only JS filter chips. Also injects a static "Browse by topic" row
 * of links into blog.html. Run the head/body sweeps + sitemap afterwards.
 * Usage: node scripts/build_blog_categories.cjs
 */
const fs = require('fs');
const path = require('path');
// The analytics, consent, skip-link and brand-graph blocks are owned by the sweeps and are
// lifted from a live page rather than restated here. Without them _safe_write refuses the write,
// which is how this generator came to be blocked.
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));

// Travelpayouts and the affiliate click tracker are blog-family blocks that page_shell does not
// carry (the service pages have neither). Both are marker-delimited and owned by their own sweeps,
// so they are lifted from a page that already has them rather than restated here, which is what
// _safe_write was refusing the write over.
const liftBlock = (html, name) => {
  const i = html.indexOf('<!-- ' + name + ' -->');
  const j = html.indexOf('<!-- /' + name + ' -->');
  return i >= 0 && j > i ? html.slice(i, j + name.length + 9) : '';
};
const AFF_DONOR = (() => {
  // ROOT is declared further down, so resolve it here rather than reaching forward to it.
  const root = path.resolve(__dirname, '..');
  for (const f of ['blog/category/city-guides.html', 'blog.html', 'blog/budapest-nomad-guide.html']) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const tp = liftBlock(html, 'travelpayouts');
    const at = liftBlock(html, 'aff-track');
    if (tp && at) return tp + '\n  ' + at;
  }
  console.error('build_blog_categories: no page carries both affiliate blocks; run the sweeps first');
  return '';
})();
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (h, re) => { const m = h.match(re); return m ? m[1] : ''; };

// --- collect post metadata ---
const posts = fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html')).map((f) => {
  const h = fs.readFileSync(path.join(ROOT, 'blog', f), 'utf8');
  return {
    slug: f.replace(/\.html$/, ''),
    title: get(h, /<title>([^<]*)<\/title>/).split(/\s*[|]\s*/)[0].trim(),
    excerpt: get(h, /name="description" content="([^"]*)"/),
    image: get(h, /property="og:image" content="([^"]*)"/),
    section: get(h, /property="article:section" content="([^"]*)"/).replace(/&amp;/g, '&'),
    date: get(h, /property="article:published_time" content="([^"]*)"/).slice(0, 10),
  };
});

const CATS = [
  { name: 'City Guides', slug: 'city-guides', h1: 'City Guides', blurb: 'In-depth, field-tested guides to living and working remotely in specific cities, cost of living, neighborhoods, coworking, and the day-to-day reality of each base.',
    body: 'Every guide here is written from lived experience rather than scraped from a spreadsheet. Each one digs into what a place is actually like to base yourself in for a month or more: a realistic monthly budget, which neighbourhoods suit remote workers, where the wifi holds up, the coworking scene, and the small day-to-day frictions nobody warns you about. Read them alongside the hard numbers in our <a href="/cities">410 city profiles</a> and the <a href="/best">best-cities rankings</a>, put two places <a href="/compare">side by side</a>, or thread several into one trip with the <a href="/route">route planner</a>.',
    related: [['/cities', 'All 410 city guides'], ['/best', 'Best cities rankings'], ['/compare', 'Compare cities'], ['/route', 'Route Planner'], ['/best-weather', 'Best weather by month']] },
  { name: 'Remote Work', slug: 'remote-work', h1: 'Remote Work', blurb: 'Coworking, productivity, and the practical craft of working well from anywhere, from building a routine that survives time zones to picking the right desk abroad.',
    body: 'Working well from anywhere is a skill, not a given. These pieces cover the practical craft of it: building a routine that survives jet lag and time-zone gaps, finding reliable wifi and a desk you actually want to sit at, and staying focused when the beach is right outside. When you are ready to choose a base around your work, the <a href="/best/best-cities-for-fast-wifi">fastest-wifi ranking</a>, the <a href="/best/best-cities-for-nomad-community">best cities for community</a>, the <a href="/timezones">time-zone overlap finder</a> and the <a href="/wheel">Decision Wheel</a> turn the advice into a shortlist.',
    related: [['/best/best-cities-for-fast-wifi', 'Best for fast wifi'], ['/best/best-cities-for-nomad-community', 'Best for community'], ['/timezones', 'Time Zone Finder'], ['/wheel', 'Decision Wheel'], ['/best', 'All rankings']] },
  { name: 'Visa & Legal', slug: 'visa-legal', h1: 'Visas & Legal', blurb: 'Digital nomad visas, taxes, and the paperwork side of living abroad, explained in plain language so you can plan the move without nasty surprises.',
    body: 'The paperwork side of nomad life is where good trips go wrong, so we keep it plain. These guides walk through digital nomad visas, tourist-entry rules, taxes and residency without the jargon, so you can plan a move without a nasty surprise at the border or in April. Check what your own passport can do in the <a href="/visa">visa finder</a>, see which places have launched a <a href="/best/best-cities-for-digital-nomad-visas">dedicated nomad visa</a>, and weigh the cost of each base with the <a href="/geoarbitrage">geoarbitrage calculator</a>.',
    related: [['/visa', 'Visa Finder by passport'], ['/best/best-cities-for-digital-nomad-visas', 'Best for nomad visas'], ['/geoarbitrage', 'Geoarbitrage Calculator'], ['/best', 'All rankings'], ['/cities', 'All city guides']] },
  { name: 'Lifestyle', slug: 'lifestyle', h1: 'Lifestyle', blurb: 'The bigger picture of nomad life: where the scenes are, how communities form, and comparisons to help you choose a region rather than a single city.',
    body: 'Beyond the spreadsheets, this is the texture of nomad life: where the scenes are, how communities and coliving spaces form, and how whole regions compare rather than single cities. Use it to work out the vibe you are after, then get specific with the <a href="/tier-list">cities tier list</a>, the <a href="/best">best-cities rankings</a>, or the <a href="/best-weather">best-weather-by-month finder</a> if you would rather follow the sun around the calendar.',
    related: [['/tier-list', 'Cities tier list'], ['/best', 'Best cities rankings'], ['/best-weather', 'Best weather by month'], ['/route', 'Route Planner'], ['/cities', 'All city guides']] },
];
const dateFmt = (d) => { if (!d) return ''; const [y, mo] = d.split('-'); const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return M[+mo - 1] + ' ' + y; };


fs.mkdirSync(path.join(ROOT, 'blog', 'category'), { recursive: true });
let built = 0;
for (const cat of CATS) {
  const items = posts.filter((p) => p.section === cat.name).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (!items.length) continue;
  const url = `${BASE}/blog/category/${cat.slug}`;
  const cards = items.map((p) => `        <a class="bc-card" href="/blog/${p.slug}">
          <span class="bc-card-img"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.closest('.bc-card-img').style.background='var(--color-sand)';this.remove();"></span>
          <span class="bc-card-body"><span class="bc-tag">${esc(cat.name)}</span><span class="bc-card-title">${esc(p.title)}</span><span class="bc-card-excerpt">${esc(p.excerpt)}</span><span class="bc-card-meta">Yannick Schroth &middot; ${dateFmt(p.date)}</span></span>
        </a>`).join('\n');
  const otherCats = CATS.filter((c) => c.slug !== cat.slug && posts.some((p) => p.section === c.name))
    .map((c) => `<a href="/blog/category/${c.slug}">${esc(c.name)}</a>`).join('');
  const collLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.h1 + ' | The Nomad HQ Blog', url, description: cat.blurb, isPartOf: { '@type': 'Blog', '@id': BASE + '/blog' }, hasPart: items.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: BASE + '/blog/' + p.slug })) };
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Blog', BASE + '/blog'], [cat.h1, url]].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(cat.h1)} for Digital Nomads: Guides & Articles | The Nomad HQ</title>
  <meta name="description" content="${esc(cat.blurb)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(cat.h1)} | The Nomad HQ Blog">
  <meta property="og:description" content="${esc(cat.blurb)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(collLd)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    .bc-header { background:linear-gradient(180deg,var(--color-sand,#f6f1e7) 0%, rgba(246,241,231,0) 100%); padding: calc(var(--nav-height,64px) + 3.25rem) 1.25rem 2.25rem; text-align:center; }
    .bc-header .container { max-width:760px; }
    .bc-crumbs { font-size:.82rem; color:var(--color-stone); margin:0 0 1rem; }
    .bc-crumbs a { color:var(--color-terracotta); text-decoration:none; }
    .bc-crumbs span { margin:0 .4rem; color:var(--color-sand-dark); }
    .bc-eyebrow { display:inline-block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:var(--color-terracotta); margin:0 0 .6rem; }
    .bc-header h1 { font-family:'DM Serif Display',serif; color:var(--color-ink); font-size:clamp(2.2rem,5.5vw,3.2rem); line-height:1.1; margin:0 0 .8rem; }
    .bc-header p { color:var(--color-charcoal); font-size:1.1rem; line-height:1.7; margin:0 auto; max-width:60ch; }
    .bc-wrap { max-width:1080px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3rem; }
    .bc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.3rem; }
    .bc-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; overflow:hidden; text-decoration:none; transition:border-color .15s,transform .15s,box-shadow .15s; }
    .bc-card:hover { border-color:var(--color-terracotta); transform:translateY(-3px); box-shadow:0 12px 28px rgba(15,23,42,.1); }
    .bc-card-img { display:block; height:170px; background:var(--color-sand); }
    .bc-card-img img { width:100%; height:100%; object-fit:cover; display:block; }
    .bc-card-body { display:flex; flex-direction:column; gap:.4rem; padding:1.1rem 1.2rem 1.3rem; }
    .bc-tag { align-self:flex-start; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-terracotta); background:rgba(192,57,43,.08); padding:.2rem .55rem; border-radius:999px; }
    .bc-card-title { font-family:'DM Serif Display',serif; font-size:1.3rem; line-height:1.2; color:var(--color-ink); }
    .bc-card-excerpt { font-size:.92rem; line-height:1.55; color:var(--color-stone); }
    .bc-card-meta { font-size:.8rem; color:var(--color-stone); margin-top:.2rem; }
    .bc-other { margin:2.5rem 0 0; padding-top:1.5rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); text-align:center; }
    .bc-other-label { font-size:.85rem; font-weight:600; color:var(--color-stone); margin-right:.4rem; }
    .bc-other a { display:inline-block; margin:.3rem; padding:.45rem .95rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:999px; color:var(--color-charcoal); text-decoration:none; font-weight:600; font-size:.9rem; transition:border-color .15s,color .15s; }
    .bc-other a:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .bc-intro { max-width:760px; margin:0 auto 2.2rem; }
    .bc-intro p { font-size:1.05rem; line-height:1.7; color:var(--color-charcoal,#334155); margin:0; }
    .bc-related { max-width:1080px; margin:2.6rem auto 0; padding-top:1.6rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); }
    .bc-related h2 { font-family:'DM Serif Display',serif; font-size:1.35rem; color:var(--color-ink,#0f172a); margin:0 0 .85rem; }
    .bc-related-links { display:flex; flex-wrap:wrap; gap:.5rem .6rem; }
    .bc-related-links a { display:inline-block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:999px; padding:.4rem .9rem; font-weight:600; font-size:.9rem; color:var(--color-charcoal,#334155); text-decoration:none; }
    .bc-related-links a:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
  </style>
${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.navFor('Blog')}
  <main>
    <header class="bc-header"><div class="container">
      <nav class="bc-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span>${esc(cat.h1)}</nav>
      <span class="bc-eyebrow">Blog topic</span>
      <h1>${esc(cat.h1)}</h1>
      <p>${esc(cat.blurb)}</p>
    </div></header>
    <div class="bc-wrap">
      <div class="bc-intro"><p>${cat.body}</p></div>
      <div class="bc-grid">
${cards}
      </div>
      <div class="bc-related"><h2>Keep exploring</h2><div class="bc-related-links">${cat.related.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div></div>
      <div class="bc-other"><span class="bc-other-label">More topics:</span>${otherCats}<a href="/blog">All articles</a></div>
    </div>
  </main>
  ${shell.footer}
  ${AFF_DONOR}
${shell.bodyEnd}
</body>
</html>`;
  fs.writeFileSync(path.join(ROOT, 'blog', 'category', cat.slug + '.html'), html);
  built++;
}

// Inject a static "Browse by topic" row into blog.html (idempotent).
const blogPath = path.join(ROOT, 'blog.html');
let blog = fs.readFileSync(blogPath, 'utf8');
const topicRow = `      <!-- blog-topics -->
      <nav class="blog-topics" aria-label="Blog topics" style="max-width:1080px;margin:0 auto 1.5rem;padding:0 1rem;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;">
        <span style="font-size:.85rem;font-weight:600;color:var(--color-stone,#8a8175);">Browse by topic:</span>
        ${CATS.filter((c) => posts.some((p) => p.section === c.name)).map((c) => `<a href="/blog/category/${c.slug}" style="padding:.4rem .9rem;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:999px;color:var(--color-charcoal,#3a3a3a);text-decoration:none;font-weight:600;font-size:.9rem;">${esc(c.name)}</a>`).join('')}
      </nav>
`;
const topicRe = /      <!-- blog-topics -->[\s\S]*?<\/nav>\n/;
if (topicRe.test(blog)) { blog = blog.replace(topicRe, topicRow); }
else {
  // insert the static topic links right before the JS filter tabs (or the article grid)
  const anchor = blog.search(/<div[^>]*class="[^"]*(category-tabs|article-grid|blog-main)[^"]*"/);
  if (anchor >= 0) { const ls = blog.lastIndexOf('\n', anchor) + 1; blog = blog.slice(0, ls) + topicRow + blog.slice(ls); }
  else { console.log('WARN: blog.html topic-row anchor not found'); }
}
fs.writeFileSync(blogPath, blog);

console.log(`Built ${built} blog category pages + injected the topic row into blog.html.`);

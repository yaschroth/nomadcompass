require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes a new blog article by lifting the shell from an article that already exists.
 *
 * Hand-copying a 60KB article to get at the 20KB that is actually the writing is how the nav, the
 * GA4 block, the consent banner, the skip link and the footer drift apart between posts. Everything
 * outside the head meta, the hero, the contents list and <article> is taken verbatim from a donor
 * post, so a new article starts life with whatever the sweeps last wrote.
 *
 * The spec is a JSON file:
 *   {
 *     "slug": "...",                 // the URL and the filename
 *     "title": "...",                // <= 60 chars rendered, see BLOG_STYLE_GUIDE 5.1
 *     "description": "...",          // 140-155 chars
 *     "ogDescription": "...",
 *     "section": "City Guides",
 *     "tags": ["Las Palmas", "Spain"],
 *     "published": "2026-08-26",
 *     "readMinutes": 11,
 *     "city": "laspalmas",           // the cityId, for the sidebar score widget and the hero image
 *     "hero": { "src": "...", "alt": "..." },   // omit src to use /images/cities/<city>.webp
 *     "toc": [["slug","Label"], ...],
 *     "bodyFile": "path to the <article> inner HTML"
 *   }
 *
 * It writes a MINIMAL BlogPosting stub and nothing else, because scripts/apply_blog_seo.cjs
 * upgrades an existing block rather than creating one: with no stub it reports "no JSON-LD found"
 * and changes nothing. From the stub it fills in the full Person author, the publisher, wordCount,
 * articleSection, and adds BreadcrumbList and FAQPage. Always run it after this.
 *
 * Usage: node scripts/new_blog_post.cjs <spec.json> [--donor blog/budapest-nomad-guide.html] [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';

const specPath = process.argv[2];
if (!specPath) { console.error('usage: node scripts/new_blog_post.cjs <spec.json> [--apply]'); process.exit(2); }
const APPLY = process.argv.includes('--apply');
const donorAt = process.argv.indexOf('--donor');
const DONOR = donorAt > 0 ? process.argv[donorAt + 1] : 'blog/budapest-nomad-guide.html';

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const donor = fs.readFileSync(path.join(ROOT, DONOR), 'utf8');
const bodyHtml = fs.readFileSync(path.isAbsolute(spec.bodyFile) ? spec.bodyFile
  : path.join(ROOT, spec.bodyFile), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cut = (from, to) => {
  const i = donor.indexOf(from);
  const j = donor.indexOf(to, i);
  if (i < 0 || j < 0) { console.error('donor is missing ' + from + ' / ' + to); process.exit(1); }
  return { i, j };
};

// everything before the SEO block, and everything from the stylesheets to </head>
const seo = cut('<!-- SEO Meta Tags -->', '<link rel="stylesheet"');
const headTop = donor.slice(0, seo.i);
const headRest = donor.slice(seo.j, donor.indexOf('</head>') + '</head>'.length);
// the JSON-LD the donor carries sits inside headTop..seo; drop any that leaked into headRest
const headRestClean = headRest.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

const afterHead = donor.slice(donor.indexOf('</head>') + '</head>'.length, donor.indexOf('<main id="main-content"'));
let tail = donor.slice(donor.indexOf('</article>'));

// The donor's sidebar carries ITS city's Nomad Score. Left alone, a Las Palmas article ships with
// a widget reading "Nomad Score: Budapest 7.9", which is the kind of error a reader spots instantly.
// The score is read off the city page rather than recomputed, because the formula already lives in
// four places and a fifth copy is a fifth thing to keep in sync.
if (spec.city) {
  const cityPage = path.join(ROOT, 'cities', spec.city + '.html');
  if (!fs.existsSync(cityPage)) { console.error('no city page for ' + spec.city); process.exit(1); }
  const cityHtml = fs.readFileSync(cityPage, 'utf8');
  const score = (cityHtml.match(/Nomad Score ([\d.]+)\/10/) || [, ''])[1];
  const name = (cityHtml.match(/<h1 class="city-hero-title">([^<]+)</) || [, spec.city])[1];
  if (!score) { console.error('no Nomad Score on the ' + spec.city + ' page'); process.exit(1); }
  const widget = donor.slice(donor.indexOf('<!-- Nomad Score Widget -->'),
    donor.indexOf('</div>', donor.indexOf('View Full Profile')) + 6);
  if (widget) {
    // dasharray 176 is the full circle; the offset is the unfilled remainder
    const offset = Math.round(176 * (1 - Number(score) / 10));
    const fresh = widget
      .replace(/<h4>Nomad Score: [^<]*<\/h4>/, () => `<h4>Nomad Score: ${esc(name)}</h4>`)
      .replace(/stroke-dashoffset="\d+"/, () => `stroke-dashoffset="${offset}"`)
      .replace(/(class="score-value"[^>]*>)[\d.]+/, (_, a) => a + score)
      .replace(/href="\.\.\/cities\/[a-z0-9-]+"/, () => `href="/cities/${spec.city}"`);
    tail = tail.split(widget).join(fresh);
  }
}

// Our own city heroes are vision-verified and self-hosted; a guessed stock-photo id is not. The
// first draft of these articles shipped a close-up of carved stone as "Las Canteras beach".
if (spec.city && (!spec.hero || !spec.hero.src)) {
  spec.hero = spec.hero || {};
  spec.hero.src = '/images/cities/' + spec.city + '.webp';
}

// og:image and twitter:image must be absolute: a crawler fetching the card has no page context to
// resolve "/images/..." against. The <img> on the page stays root-relative.
const social = /^https?:/.test(spec.hero.src) ? spec.hero.src : BASE + spec.hero.src;

const month = new Date(spec.published + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const head = `<!-- SEO Meta Tags -->
  <title>${esc(spec.title)}</title>
  <meta name="description" content="${esc(spec.description)}">
  <meta name="author" content="Yannick Schroth">

  <!-- Canonical URL -->
  <link rel="canonical" href="${BASE}/blog/${spec.slug}">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(spec.title)}">
  <meta property="og:description" content="${esc(spec.ogDescription || spec.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${BASE}/blog/${spec.slug}">
  <meta property="og:image" content="${esc(social)}">
  <meta property="article:published_time" content="${spec.published}T10:00:00Z">
  <meta property="article:author" content="Yannick Schroth">
  <meta property="article:section" content="${esc(spec.section)}">
${(spec.tags || []).map((t) => `  <meta property="article:tag" content="${esc(t)}">`).join('\n')}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(spec.title)}">
  <meta name="twitter:description" content="${esc(spec.ogDescription || spec.description)}">
  <meta name="twitter:image" content="${esc(social)}">

  <!-- Structured Data (JSON-LD). A stub; apply_blog_seo.cjs fills it out. -->
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: spec.title,
    description: spec.description,
    image: social,
    datePublished: spec.published + 'T10:00:00Z',
    dateModified: spec.published + 'T10:00:00Z',
    mainEntityOfPage: { '@type': 'WebPage', '@id': BASE + '/blog/' + spec.slug },
    inLanguage: 'en',
  }, null, 2).replace(/\n/g, '\n  ')}
  </script>

  `;

const article = `<main id="main-content" tabindex="-1" class="main-content">
    <!-- Article Header -->
    <header class="article-header container accent-container accent-forest accent-top-left">
      <span class="category-tag">${esc(spec.section)}</span>
      <h1>${esc(spec.title)}</h1>
      <div class="article-meta">
        <span class="author">
          <img src="/assets/yannick-schroth.webp" alt="Yannick Schroth" class="author-avatar">
          <strong><a href="/about/yannick-schroth">Yannick Schroth</a></strong>
        </span>
        <span class="divider"></span>
        <span>${month}</span>
        <span class="divider"></span>
        <span>${spec.readMinutes} min read</span>
      </div>
    </header>

    <!-- Hero Image -->
    <figure class="article-hero">
      <img decoding="async" width="1200" height="600"
        src="${esc(spec.hero.src)}"
        alt="${esc(spec.hero.alt)}">
    </figure>

    <!-- Article Layout -->
    <div class="article-layout">
      <aside class="toc-sidebar">
        <div class="toc-wrapper">
          <h4>Contents</h4>
          <ol class="toc-list">
${spec.toc.map(([id, label]) => `            <li><a href="#${id}">${esc(label)}</a></li>`).join('\n')}
          </ol>
        </div>
      </aside>

      <article class="article-content">
${bodyHtml.trim()}
      `;

const html = headTop + head + headRestClean + afterHead + article + tail;

// --- checks that are cheap to run and expensive to miss
const problems = [];
const words = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
if ((html.match(/<h1/g) || []).length !== 1) problems.push('there must be exactly one <h1>');
if (/[—]|\s–\s/.test(bodyHtml)) problems.push('em-dash or spaced en-dash in the body');
if (spec.title.length > 60) problems.push('title is ' + spec.title.length + ' chars, over 60');
if (spec.description.length < 140 || spec.description.length > 155) {
  problems.push('meta description is ' + spec.description.length + ' chars, want 140-155');
}
for (const [id] of spec.toc) {
  if (!new RegExp('id="' + id + '"').test(bodyHtml)) problems.push('contents links #' + id + ', which the body does not define');
}
const heads = [...bodyHtml.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/g)];
const h2s = heads.filter((x) => x[1] === '2').length;
if (h2s < 6) problems.push('only ' + h2s + ' H2 sections');
const readMin = Math.round(words / 200);
if (Math.abs(readMin - spec.readMinutes) > 2) problems.push('byline says ' + spec.readMinutes + ' min but the body reads as ' + readMin);

console.log(spec.slug + ': ' + words + ' words, ' + h2s + ' H2 sections, ~' + readMin + ' min read');
if (problems.length) { problems.forEach((p) => console.error('  PROBLEM: ' + p)); }
if (!APPLY) { console.log('\nDry run. Re-run with --apply to write blog/' + spec.slug + '.html'); process.exit(problems.length ? 1 : 0); }
if (problems.length) { console.error('\nrefused: fix the problems above'); process.exit(1); }

fs.writeFileSync(path.join(ROOT, 'blog', spec.slug + '.html'), html);
console.log('\nwrote blog/' + spec.slug + '.html');
console.log('next: node scripts/apply_blog_seo.cjs ' + spec.slug + '  then the link/audit scripts');

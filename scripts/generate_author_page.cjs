/**
 * Generates about/yannick-schroth.html  ->  served at /about/yannick-schroth.
 * The author bio page (ProfilePage schema) that the author entity `url` points
 * to. Pulls the article list live from blog/ and identity from lib/author.cjs.
 * Re-run after adding articles or editing the author constant.
 */
const fs = require('fs');
const path = require('path');
const { SITE, AUTHOR, personEntity } = require('./lib/author.cjs');

const ROOT = path.resolve(__dirname, '..');
const get = (re, s) => { const m = s.match(re); return m ? m[1] : null; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// collect articles: slug, title (suffix stripped), section, date
const articles = fs.readdirSync(path.join(ROOT, 'blog'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const html = fs.readFileSync(path.join(ROOT, 'blog', f), 'utf8');
    const rawTitle = get(/<title>([^<]*)<\/title>/, html) || f;
    const title = rawTitle.split('|')[0].trim();
    const section = get(/<meta property="article:section" content="([^"]+)"/, html) || 'Guide';
    const date = (get(/<meta property="article:published_time" content="([0-9-]+)/, html) || '');
    return { slug: f.replace(/\.html$/, ''), title, section, date };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const articleItems = articles
  .map((a) => `          <li>
            <a href="/blog/${a.slug}">${esc(a.title)}</a>
            <span class="author-article-tag">${esc(a.section)}</span>
          </li>`)
  .join('\n');

const knowsList = AUTHOR.knowsAbout.map((k) => `<li>${esc(k)}</li>`).join('');

const profileLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: personEntity(),
}, null, 2);

const socialLinks = AUTHOR.sameAs.length
  ? AUTHOR.sameAs.map((u) => `<a href="${u}" rel="me" target="_blank">${u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>`).join(' &middot; ')
  : '<span class="author-social-todo">Social profiles coming soon.</span>';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <title>About ${esc(AUTHOR.name)} | The Nomad HQ</title>
  <meta name="description" content="${esc(AUTHOR.name)} is the founder of The Nomad HQ. He writes practical guides for digital nomads on visas, cost of living, coworking and remote work.">
  <link rel="canonical" href="${AUTHOR.url}">

  <meta property="og:title" content="About ${esc(AUTHOR.name)} | The Nomad HQ">
  <meta property="og:description" content="Founder of The Nomad HQ. Practical guides for digital nomads on visas, cost of living, coworking and remote work.">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${AUTHOR.url}">
  <meta property="og:image" content="${AUTHOR.image}">

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">

  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">

  <script type="application/ld+json">
  ${profileLd.replace(/\n/g, '\n  ')}
  </script>

  <style>
    .author-page { max-width: 820px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
    .author-head { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; margin-bottom: 2rem; }
    .author-head img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
    .author-head h1 { font-family: 'DM Serif Display', serif; font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 .25rem; }
    .author-head .author-role { color: var(--color-text-muted, #666); font-weight: 600; }
    .author-head .author-social { margin-top: .5rem; font-size: .9rem; }
    .author-social-todo { color: #999; }
    .author-bio-text p { font-size: 1.05rem; line-height: 1.7; margin: 0 0 1rem; }
    .author-section-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin: 2.5rem 0 1rem; }
    .author-knows { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem; }
    .author-knows li { background: rgba(31,111,84,.08); color: #1f6f54; padding: .35rem .75rem; border-radius: 999px; font-size: .9rem; font-weight: 600; }
    .author-articles { list-style: none; padding: 0; margin: 0; }
    .author-articles li { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: .6rem 0; border-bottom: 1px solid rgba(0,0,0,.07); }
    .author-articles a { font-weight: 600; text-decoration: none; color: inherit; }
    .author-articles a:hover { text-decoration: underline; }
    .author-article-tag { color: #888; font-size: .8rem; white-space: nowrap; }
  </style>
</head>
<body>

  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/rentals" class="nav-link">Rentals</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
    </div>
  </nav>

  <main class="author-page">
    <div class="author-head">
      <img src="${AUTHOR.imagePath}" alt="${esc(AUTHOR.name)}, founder of The Nomad HQ">
      <div>
        <h1>${esc(AUTHOR.name)}</h1>
        <div class="author-role">${esc(AUTHOR.jobTitle)}</div>
        <div class="author-social">${socialLinks}</div>
      </div>
    </div>

    <div class="author-bio-text">
      <p>${esc(AUTHOR.bio)}</p>
      <p>The Nomad HQ exists to cut through the noise around location independence: which cities actually work for remote work, what they really cost month to month, how the visa rules apply to your nationality, and where to find reliable internet and a desk. Every guide here is written to answer a real question a nomad is searching for, with concrete numbers instead of vague promises.</p>
    </div>

    <h2 class="author-section-title">What ${esc(AUTHOR.name.split(' ')[0])} writes about</h2>
    <ul class="author-knows">${knowsList}</ul>

    <h2 class="author-section-title">Recent articles</h2>
    <ul class="author-articles">
${articleItems}
    </ul>
  </main>

  <footer class="footer">
    <div class="container">
      <p style="text-align:center; padding:2rem 0; color:#777;">&copy; The Nomad HQ &middot; <a href="/">Home</a> &middot; <a href="/blog">Blog</a> &middot; <a href="/cities">Cities</a></p>
    </div>
  </footer>

</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'about'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'about', 'yannick-schroth.html'), html);
console.log(`Wrote about/yannick-schroth.html with ${articles.length} article links.`);

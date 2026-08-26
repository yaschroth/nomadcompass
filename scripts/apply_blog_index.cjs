require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts every published article on the blog index and in the sitemap.
 *
 * BLOG_STYLE_GUIDE section 1 makes both mandatory for discovery, and both were manual steps: write
 * the article, remember the card, remember the sitemap line. A missed card is an orphan page and a
 * missed sitemap line is a page Google may never fetch.
 *
 * It only ADDS. An article that already has a card on blog.html is left exactly as it is, because
 * the excerpts there are hand-written and better than anything derived from a meta description.
 * New cards are built from the article's own head: title, description, section, hero image and the
 * reading time in its byline, then inserted at the top of the grid so the newest is first.
 *
 * Usage: node scripts/apply_blog_index.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const APPLY = process.argv.includes('--apply');

const get = (re, s) => { const m = s.match(re); return m ? m[1] : ''; };
const esc = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;');

const slugOf = (f) => f.replace(/\.html$/, '');
const articles = fs.readdirSync(path.join(ROOT, 'blog'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const html = fs.readFileSync(path.join(ROOT, 'blog', f), 'utf8');
    return {
      slug: slugOf(f),
      title: get(/<title>([^<]*?)(?:\s*\|\s*The Nomad HQ)?<\/title>/, html),
      description: get(/<meta name="description" content="([^"]+)"/, html),
      section: get(/<meta property="article:section" content="([^"]+)"/, html) || 'City Guides',
      published: get(/<meta property="article:published_time" content="([^"T]+)/, html),
      image: get(/<meta property="og:image" content="([^"]+)"/, html),
      alt: get(/<figure class="article-hero">[\s\S]*?alt="([^"]*)"/, html),
      minutes: get(/<span>(\d+) min read<\/span>/, html) || '10',
    };
  });

const categorySlug = (s) => s.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------- blog.html
let index = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');
const missing = articles.filter((a) => !new RegExp('blog/' + a.slug + '"').test(index));
missing.sort((a, b) => (b.published || '').localeCompare(a.published || ''));

const card = (a) => `        <!-- ${a.title} -->
        <article class="article-card" data-category="${categorySlug(a.section)}">
          <img
            src="${a.image.replace(/w=1200&h=630/, 'w=600&h=400')}"
            alt="${esc(a.alt || a.title)}"
            class="article-card-image"
          >
          <div class="article-card-body">
            <span class="category-tag">${esc(a.section)}</span>
            <h3><a href="blog/${a.slug}">${esc(a.title)}</a></h3>
            <p class="excerpt">
              ${esc(a.description)}
            </p>
            <div class="article-card-footer">
              <div class="article-card-author">
                <img src="/assets/yannick-schroth.webp" alt="Yannick Schroth">
                <span>Yannick Schroth</span>
              </div>
              <span>${a.minutes} min read</span>
            </div>
          </div>
        </article>
`;

if (missing.length) {
  const anchor = index.indexOf('<div class="article-grid">');
  if (anchor < 0) { console.error('blog.html: no <div class="article-grid">'); process.exit(1); }
  const at = index.indexOf('\n', anchor) + 1;
  index = index.slice(0, at) + missing.map(card).join('') + index.slice(at);
}

// ---------------------------------------------------------------- sitemap.xml
const sitemapPath = path.join(ROOT, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
const absent = articles.filter((a) => !sitemap.includes(`${BASE}/blog/${a.slug}<`));
if (absent.length) {
  // sit them next to the blog entries that already exist, before </urlset>
  const entries = absent.map((a) => `  <url>
    <loc>${BASE}/blog/${a.slug}</loc>
    <lastmod>${a.published || new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`).join('');
  sitemap = sitemap.replace('</urlset>', () => entries + '</urlset>');
}

console.log(articles.length + ' articles');
console.log('  cards to add to blog.html : ' + missing.length
  + (missing.length ? '  (' + missing.map((a) => a.slug).join(', ') + ')' : ''));
console.log('  sitemap entries to add    : ' + absent.length
  + (absent.length ? '  (' + absent.map((a) => a.slug).join(', ') + ')' : ''));

const thin = articles.filter((a) => !a.description || !a.image);
if (thin.length) console.log('  WARNING, missing description or og:image: ' + thin.map((a) => a.slug).join(', '));

if (!APPLY) { console.log('\nDry run. Re-run with --apply to write.'); process.exit(0); }
if (missing.length) fs.writeFileSync(path.join(ROOT, 'blog.html'), index);
if (absent.length) fs.writeFileSync(sitemapPath, sitemap);
console.log('\nwritten');

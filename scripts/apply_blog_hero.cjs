require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Gives every blog post the full-screen photo hero the city and services pages open with.
 *
 * Posts used to open on a centred title over white, then a rounded photograph below it, which made
 * the blog read like a different site from /cities/<city> and /services/<city>. This rebuilds the
 * header and the photograph into one block: the photograph fills the screen, and the breadcrumb,
 * category, title and byline sit on its lower edge over the same measured scrim (styles/blog.css,
 * .post-hero).
 *
 * The credit: a city photograph is credited from images/cities/attribution.json, exactly as the
 * city page credits the same file. A post with its own photograph (images/blog/) carries its credit
 * by hand as a figcaption, and that credit is kept. Pexels heroes need none (Pexels licence) and
 * are requested at 1920 wide, because a 1200x600 crop stretched to full screen looks soft.
 *
 * Idempotent: a post already carrying the block is re-read from the block and rebuilt the same way.
 * Run after new_blog_post.cjs and before apply_photo_credit / apply_entity_schema.
 *
 * Usage: node scripts/apply_blog_hero.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));

const esc = (s) => String(s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const catSlug = (s) => s.toLowerCase().replace(/&amp;|&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const OLD = /[ \t]*<!-- Article Header -->\s*<header class="article-header[^"]*">([\s\S]*?)<\/header>\s*<!-- Hero Image -->\s*<figure class="article-hero">([\s\S]*?)<\/figure>\n?/;
const NEW = /[ \t]*<!-- post-hero -->[\s\S]*?<!-- \/post-hero -->\n?/;

function parse(html) {
  let m = html.match(OLD);
  if (m) {
    const head = m[1], fig = m[2];
    return {
      block: m[0],
      category: (head.match(/<span class="category-tag">([^<]*)<\/span>/) || [])[1],
      h1: (head.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1],
      meta: (head.match(/<div class="article-meta">([\s\S]*?)<\/div>\s*$/) || [])[1],
      src: (fig.match(/src="([^"]*)"/) || [])[1],
      alt: (fig.match(/alt="([^"]*)"/) || [])[1],
      credit: (fig.match(/<figcaption class="article-hero-credit">([\s\S]*?)<\/figcaption>/) || [])[1],
    };
  }
  m = html.match(NEW);
  if (m) {
    const b = m[0];
    return {
      block: b,
      category: (b.match(/<span class="post-hero-eyebrow">([^<]*)<\/span>/) || [])[1],
      h1: (b.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1],
      meta: (b.match(/<div class="post-hero-meta">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/) || [])[1],
      src: (b.match(/<img class="post-hero-img" src="([^"]*)"/) || [])[1],
      alt: (b.match(/<img class="post-hero-img"[^>]*alt="([^"]*)"/) || [])[1],
      credit: (b.match(/<p class="hero-credit" data-own>([\s\S]*?)<\/p>/) || [])[1],
    };
  }
  return null;
}

function build(p) {
  let src = p.src;
  let picture;
  let credit = '';
  const city = src.match(/^\/images\/cities\/([a-z0-9-]+)\.webp$/);
  if (/images\.pexels\.com/.test(src)) src = src.replace(/w=\d+&h=\d+/, 'w=1920&h=1280');
  if (city) {
    const slug = city[1];
    const has = (v) => fs.existsSync(path.join(ROOT, 'images', 'cities', slug + v + '.webp'));
    picture = '<picture class="post-hero-pic">'
      + (has('-m') ? `<source media="(max-width:640px)" srcset="/images/cities/${slug}-m.webp">` : '')
      + (has('-t') ? `<source media="(max-width:1100px)" srcset="/images/cities/${slug}-t.webp">` : '')
      + `<img class="post-hero-img" src="${src}" alt="${p.alt}" width="1920" height="1080" fetchpriority="high" decoding="async"></picture>`;
    const a = Array.isArray(ATTR) ? ATTR.find((r) => r.slug === slug) : ATTR[slug];
    if (a && a.author && a.sourcePageUrl) {
      credit = `<a class="hero-credit" href="${esc(a.sourcePageUrl)}" target="_blank" rel="nofollow noopener">Photo: ${esc(a.author)} / ${esc(a.source || 'Wikimedia Commons')}${a.license ? ' (' + esc(a.license) + ')' : ''}</a>`;
    }
  } else {
    picture = `<picture class="post-hero-pic"><img class="post-hero-img" src="${src}" alt="${p.alt}" width="1920" height="1080" fetchpriority="high" decoding="async"></picture>`;
  }
  if (p.credit) credit = `<p class="hero-credit" data-own>${p.credit.trim()}</p>`;
  const cat = p.category.trim();
  return `    <!-- post-hero -->
    <header class="post-hero">
      ${picture}
      <div class="post-hero-in"><div class="container">
        <p class="post-hero-crumbs"><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; <a href="/blog/category/${catSlug(cat)}">${cat}</a></p>
        <span class="post-hero-eyebrow">${cat}</span>
        <h1>${p.h1.trim()}</h1>
        <div class="post-hero-meta">${p.meta.trim()}</div>
      </div></div>
      ${credit}
    </header>
    <!-- /post-hero -->
`;
}

const files = fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html'));
let done = 0;
const problems = [];
for (const f of files) {
  const fp = path.join(ROOT, 'blog', f);
  const html = fs.readFileSync(fp, 'utf8');
  const p = parse(html);
  if (!p) { problems.push(f + ': no header/hero block found'); continue; }
  const missing = ['category', 'h1', 'meta', 'src', 'alt'].filter((k) => !p[k]);
  if (missing.length) { problems.push(f + ': could not read ' + missing.join(', ')); continue; }
  if (!fs.existsSync(path.join(ROOT, 'blog', 'category', catSlug(p.category.trim()) + '.html'))) {
    problems.push(f + ': no category page for "' + p.category + '"'); continue;
  }
  const out = html.replace(p.block, () => build(p));
  if (out !== html) { done++; if (!DRY) fs.writeFileSync(fp, out); }
}
console.log(`${done} post(s) ${DRY ? 'would be ' : ''}rewritten, ${files.length - done - problems.length} unchanged`);
problems.forEach((p) => console.log('  ' + p));
if (problems.length) process.exit(1);

/**
 * Applies the technical-SEO layer of BLOG_STYLE_GUIDE.md to every blog article:
 *
 *   1. Consolidates the author to the single Yannick Schroth entity
 *      (meta tags, byline, author box, JSON-LD) from scripts/lib/author.cjs.
 *   2. Upgrades the article JSON-LD: @type Article -> BlogPosting, full Person
 *      author, mainEntityOfPage, inLanguage, articleSection, keywords, wordCount.
 *   3. Injects a BreadcrumbList (Home > Blog > Article) if absent.
 *   4. Generates a FAQPage from a "Frequently Asked Questions" section if one
 *      exists (none yet; future-proofing).
 *   5. Adds the robots max-image-preview directive if missing.
 *
 * Idempotent. Usage:
 *   node scripts/apply_blog_seo.cjs            # all blog/*.html
 *   node scripts/apply_blog_seo.cjs <slug>     # one file (test mode)
 */
const fs = require('fs');
const path = require('path');
const { SITE, AUTHOR, personEntity } = require('./lib/author.cjs');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const firstName = AUTHOR.name.split(' ')[0];

const only = process.argv[2];
const files = fs
  .readdirSync(BLOG)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !only || f === only || f === only + '.html');

const stripTags = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const get = (re, s) => { const m = s.match(re); return m ? m[1] : null; };

function extractFaq(html, articleInner) {
  // find a "Frequently Asked Questions" / "FAQ" h2 and the block after it
  const h2 = articleInner.match(/<h2[^>]*>\s*(?:Frequently Asked Questions|FAQ|FAQs)[^<]*<\/h2>([\s\S]*?)(?=<h2|<\/article|$)/i);
  if (!h2) return null;
  const block = h2[1];
  const qa = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
  let m;
  while ((m = re.exec(block))) {
    const q = stripTags(m[1]);
    const a = stripTags(m[2]);
    if (q && a) qa.push({ q, a });
  }
  if (!qa.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((x) => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a },
    })),
  };
}

let changed = 0;
const report = [];

for (const file of files) {
  const abs = path.join(BLOG, file);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const slug = file.replace(/\.html$/, '');
  const canonical = get(/<link rel="canonical" href="([^"]+)"/, html) || `${SITE}/blog/${slug}`;
  const oldAuthor = get(/<meta name="author" content="([^"]+)"/, html);

  // --- 1. author consolidation ---------------------------------------------
  // global full-name swap (safe: full personas don't collide with body text)
  if (oldAuthor && oldAuthor !== AUTHOR.name) {
    html = html.split(oldAuthor).join(AUTHOR.name);
  }
  // rebuild byline span (name-agnostic match) -> linked name + author avatar
  html = html.replace(
    /<span class="author">\s*<img[^>]*class="author-avatar"[^>]*>\s*<strong>[\s\S]*?<\/strong>\s*<\/span>/i,
    `<span class="author">
          <img src="${AUTHOR.imagePath}" alt="${AUTHOR.name}" class="author-avatar">
          <strong><a href="${AUTHOR.bioPath}">${AUTHOR.name}</a></strong>
        </span>`
  );
  // rebuild author bio box -> avatar + linked name + standard bio + more-link
  html = html.replace(
    /<div class="author-bio">\s*<img[^>]*class="author-bio-avatar"[^>]*>\s*<div class="author-bio-content">[\s\S]*?<\/div>\s*<\/div>/i,
    `<div class="author-bio">
          <img src="${AUTHOR.imagePath}" alt="${AUTHOR.name}" class="author-bio-avatar">
          <div class="author-bio-content">
            <h4><a href="${AUTHOR.bioPath}">${AUTHOR.name}</a></h4>
            <p>${AUTHOR.bio}</p>
            <p class="author-more"><a href="${AUTHOR.bioPath}">More about ${firstName} &rarr;</a></p>
          </div>
        </div>`
  );

  // --- 5. robots directive --------------------------------------------------
  if (!/name="robots"/i.test(html)) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>\s*)/i,
      `$1\n  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">\n`
    );
  }

  // --- 2/3/4. JSON-LD upgrade ----------------------------------------------
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const ldm = html.match(ldRe);
  let ldNote = 'ok';
  if (ldm) {
    let data;
    try { data = JSON.parse(ldm[1]); } catch (e) { data = null; ldNote = 'JSON parse FAILED (skipped)'; }
    if (data && (data['@type'] === 'Article' || data['@type'] === 'BlogPosting')) {
      const articleInner = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || [, ''])[1];
      const wordCount = articleInner ? stripTags(articleInner).split(' ').length : undefined;
      const articleSection = get(/<meta property="article:section" content="([^"]+)"/, html);
      const keywords = get(/<meta name="keywords" content="([^"]+)"/, html);

      const upgraded = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: data.headline || get(/<title>([^<]*?)(?:\s*\|[^<]*)?<\/title>/, html),
        description: data.description || get(/<meta name="description" content="([^"]+)"/, html),
        image: data.image,
        author: personEntity(),
        publisher: data.publisher || {
          '@type': 'Organization',
          name: 'The Nomad HQ',
          logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo-256.svg` },
        },
        datePublished: data.datePublished,
        dateModified: data.dateModified || data.datePublished,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        inLanguage: 'en',
      };
      if (articleSection) upgraded.articleSection = articleSection;
      if (keywords) upgraded.keywords = keywords;
      if (wordCount) upgraded.wordCount = wordCount;

      const json = JSON.stringify(upgraded, null, 2).replace(/\n/g, '\n  ');
      html = html.replace(ldRe, `<script type="application/ld+json">\n  ${json}\n  </script>`);

      // BreadcrumbList
      if (!/"BreadcrumbList"/.test(html)) {
        const crumb = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
            { '@type': 'ListItem', position: 3, name: upgraded.headline, item: canonical },
          ],
        };
        const cjson = JSON.stringify(crumb, null, 2).replace(/\n/g, '\n  ');
        html = html.replace(
          /(<script type="application\/ld\+json">[\s\S]*?<\/script>)/,
          `$1\n\n  <script type="application/ld+json">\n  ${cjson}\n  </script>`
        );
      }

      // FAQPage (only if a FAQ section exists)
      if (!/"FAQPage"/.test(html)) {
        const faq = extractFaq(html, articleInner);
        if (faq) {
          const fjson = JSON.stringify(faq, null, 2).replace(/\n/g, '\n  ');
          html = html.replace(
            /(<script type="application\/ld\+json">[\s\S]*?<\/script>)(\s*<\/head>)/,
            `$1\n\n  <script type="application/ld+json">\n  ${fjson}\n  </script>$2`
          );
          ldNote = 'ok +FAQPage';
        }
      }
    } else if (data) {
      ldNote = `unexpected @type=${data['@type']} (skipped)`;
    }
  } else {
    ldNote = 'no JSON-LD found';
  }

  if (html !== before) { fs.writeFileSync(abs, html); changed++; }
  report.push(`${changed && html !== before ? '✓' : ' '} ${slug.padEnd(38)} author:${oldAuthor || '?'} -> ${AUTHOR.name.split(' ')[0]}  ld:${ldNote}`);
}

console.log(report.join('\n'));
console.log(`\nFiles changed: ${changed}/${files.length}`);

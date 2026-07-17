/**
 * Sitewide structured-data sweep. Injects, idempotently, before </head>:
 *   1. the brand graph (Organization + WebSite) on EVERY page   -> marker <!-- brand-graph -->
 *   2. an Article node (author=Yannick, publisher=The Nomad HQ, dates, image) on the
 *      editorial guide pages: cities/*.html and activities/*.html  -> marker <!-- article-schema -->
 *
 * Self-contained: reads canonical/description/og:image/byline-date straight from each
 * page, so it never depends on a data file or a slug<->id mapping.
 *
 * IMPORTANT: run this LAST, after any page generator (generators rewrite <head> and would
 * drop the injected nodes). It is chained as the final step of rebuild_rankings.cjs.
 * Usage: node scripts/apply_entity_schema.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { brandGraphScript, articleScript } = require('./entity_schema.cjs');

const attr = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const canonicalOf = (h) => attr(h, /<link rel="canonical" href="([^"]+)"/i);
const descOf = (h) => attr(h, /<meta name="description" content="([^"]+)"/i);
const ogImageOf = (h) => attr(h, /<meta property="og:image" content="([^"]+)"/i);
const dateOf = (h) => attr(h, /<time datetime="(\d{4}-\d{2}-\d{2})"/i) || '2026-07-01';
const headlineOf = (h) => {
  const t = attr(h, /<title>([^<]*)<\/title>/i);
  return t.split(/\s*[|]\s*/)[0].trim() || t.trim();
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Collect target files.
function htmlIn(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
}
const rootHtml = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const all = [
  ...rootHtml,
  ...htmlIn('cities'), ...htmlIn('best'), ...htmlIn('tier-list'),
  ...htmlIn('activities'), ...htmlIn('blog'), ...htmlIn('about'),
];
const articleDirs = ['cities' + path.sep, 'activities' + path.sep];

let brand = 0, brandSkip = 0, article = 0, articleSkip = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  if (!/<!-- brand-graph -->/.test(html)) {
    html = html.replace(/<\/head>/i, brandGraphScript() + '\n</head>');
    brand++;
  } else brandSkip++;

  const isArticle = articleDirs.some((d) => rel.includes(d));
  if (isArticle && !/<!-- article-schema -->/.test(html)) {
    const url = canonicalOf(html);
    if (url) {
      const node = articleScript({
        headline: decode(headlineOf(html)),
        description: decode(descOf(html)),
        url,
        image: ogImageOf(html),
        datePublished: dateOf(html),
        dateModified: dateOf(html),
      });
      html = html.replace(/<\/head>/i, node + '\n</head>');
      article++;
    }
  } else if (isArticle) articleSkip++;

  if (html !== before) fs.writeFileSync(abs, html);
}
console.log(`Brand graph: added ${brand}, already ${brandSkip} | Article: added ${article}, already ${articleSkip} (of ${all.length} pages)`);

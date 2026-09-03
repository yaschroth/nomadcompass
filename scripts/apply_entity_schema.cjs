require(require('path').join(__dirname,'_safe_write.cjs'));
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

function htmlUnder(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  // Every level below, not one: the services directory is three deep now, and a page the sweep
  // cannot see is a page without the brand graph.
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => htmlIn(path.join(dir, e.name)).concat(htmlUnder(path.join(dir, e.name))));
}
const rootHtml = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const all = [
  ...rootHtml,
  ...htmlIn('cities'), ...htmlIn('best'), ...htmlIn('tier-list'),
  ...htmlIn('activities'), ...htmlIn('blog'), ...htmlIn('blog/category'), ...htmlIn('about'),
  ...htmlIn('services'), ...htmlUnder('services'),
  // 107 /vs/ pages were missing the brand graph for the same reason: the directory postdates
  // this list and nobody added it.
  ...htmlIn('vs'),
];
const articleDirs = ['cities' + path.sep, 'activities' + path.sep];

/**
 * Removes every brand graph the page carries, and reports how many there were.
 *
 * Two shapes have to be told apart. A marker followed by a script holding "#organization" is a
 * brand graph and goes with its script. A marker followed by anything else is a stray left behind
 * by an older insertion point: fifteen blog posts carry one in front of their FAQPage schema, and
 * deleting the script with it would delete the FAQ markup. Those lose the marker only.
 */
function stripBrandGraphs(html) {
  const M = '<!-- brand-graph -->';
  let removed = 0;
  for (;;) {
    const i = html.indexOf(M);
    if (i === -1) break;
    // Where the marker's own indentation starts, so removal does not leave a ragged blank line.
    let start = i;
    while (start > 0 && (html[start - 1] === ' ' || html[start - 1] === '\t')) start--;

    const rest = html.slice(i + M.length);
    const open = rest.match(/^\s*<script type="application\/ld\+json">/);
    let end = i + M.length;
    if (open) {
      const close = rest.indexOf('</script>');
      const body = rest.slice(0, close);
      if (close !== -1 && body.includes('#organization')) end = i + M.length + close + '</script>'.length;
    }
    while (end < html.length && (html[end] === '\r' || html[end] === '\n')) end++;
    html = html.slice(0, start) + html.slice(end);
    removed++;
  }
  return { html, removed };
}

let brand = 0, article = 0, brandCollapsed = 0;
for (const rel of all) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  // Strip every existing brand graph, then insert exactly one.
  //
  // This used to test for '  <!-- brand-graph --><script ...>' with exactly two leading spaces and
  // the script on the same line, and insert before </head> when that failed. lib/page_shell.cjs
  // emits the block with neither, so on 1,086 pages the test failed every run and another complete
  // Organization + WebSite graph was appended: two conflicting brand entities per page, invisible
  // to every other gate. Matching loosely and collapsing is the fix, not a third insertion point.
  const brandBlock = brandGraphScript();
  const stripped = stripBrandGraphs(html);
  if (stripped.removed > 1) brandCollapsed++;
  html = stripped.html.replace(/<\/head>/i, brandBlock + '\n</head>');
  brand++;

  const isArticle = articleDirs.some((d) => rel.includes(d));
  if (isArticle) {
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
      const artRe = /  <!-- article-schema --><script type="application\/ld\+json">.*?<\/script>/s;
      if (artRe.test(html)) { html = html.replace(artRe, node); }
      else { html = html.replace(/<\/head>/i, node + '\n</head>'); }
      article++;
    }
  }

  if (html !== before) fs.writeFileSync(abs, html);
}
console.log(`Brand graph: ${brand} pages (duplicates collapsed on ${brandCollapsed}) | Article: ${article} pages (of ${all.length} total)`);

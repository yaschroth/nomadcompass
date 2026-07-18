/**
 * Anti-templating guard for the blog (BLOG_STYLE_GUIDE.md section 4.5). Reads the prose
 * of every blog/*.html (the <article class="article-content"> body, minus templated
 * sub-blocks: affiliate boxes, CTAs, author bio, explore chips, related articles, TOC,
 * scripts, styles) and reports two problems:
 *
 *   A) Cross-article boilerplate: a sentence (>= 40 chars) that appears verbatim in
 *      3 or more articles. Usually a copy-pasted CTA, internal-link sentence, or
 *      disclaimer. Rewrite each per its article's topic.
 *   B) In-article stuffing: an exact 3-word phrase whose density (occurrences * 3 /
 *      body words) exceeds 1.5% in a single article. Vary with pronouns/synonyms.
 *
 * Exit code 1 if any problem is found, so it can gate a pre-publish check.
 * Usage: node scripts/check_repetition.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'blog');

const STUFF_MAX = 0.015; // 1.5% density cap for any exact 3-word phrase
const BOILER_MIN_ARTICLES = 3; // a sentence in >= this many articles is boilerplate
const MIN_SENTENCE_CHARS = 40;

function prose(html) {
  const m = html.match(/<article class="article-content">([\s\S]*?)<\/article>/i);
  let s = m ? m[1] : '';
  // strip templated / non-prose sub-blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  for (const cls of ['affiliate-box', 'affiliate-banner', 'article-cta', 'author-bio', 'blog-explore-chips', 'related-articles', 'toc-wrapper', 'article-tags', 'nomad-score-widget']) {
    // remove the first-level div with this class (greedy-safe: up to the matching depth is hard in regex;
    // these blocks don't nest same-class, so a lazy match to the next sibling boundary is close enough)
    s = s.replace(new RegExp('<div class="' + cls + '[\\s\\S]*?<\\/div>\\s*(?=<h2|<h3|<div class="|<p|$)', 'gi'), ' ');
  }
  s = s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
const sentenceOwners = new Map(); // sentence -> Set(slug)
const stuffing = []; // {slug, phrase, count, density}

for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const text = prose(fs.readFileSync(path.join(DIR, f), 'utf8'));

  // A) sentences
  const seen = new Set();
  text.split(/(?<=[.!?])\s+/).forEach((raw) => {
    const s = raw.trim();
    if (s.length < MIN_SENTENCE_CHARS) return;
    if (seen.has(s)) return; seen.add(s);
    if (!sentenceOwners.has(s)) sentenceOwners.set(s, new Set());
    sentenceOwners.get(s).add(slug);
  });

  // B) 3-word shingles
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const total = words.length;
  const counts = new Map();
  for (let i = 0; i + 2 < words.length; i++) {
    const g = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  let worst = null;
  for (const [g, c] of counts) {
    const density = (c * 3) / total;
    if (density > STUFF_MAX && (!worst || density > worst.density)) worst = { phrase: g, count: c, density };
  }
  if (worst) stuffing.push({ slug, ...worst });
}

const boiler = [...sentenceOwners.entries()]
  .filter(([, set]) => set.size >= BOILER_MIN_ARTICLES)
  .map(([s, set]) => ({ sentence: s, count: set.size, slugs: [...set] }))
  .sort((a, b) => b.count - a.count);

console.log(`Checked ${files.length} articles.\n`);
console.log(`A) Cross-article boilerplate (identical sentence in >= ${BOILER_MIN_ARTICLES} articles): ${boiler.length}`);
boiler.slice(0, 25).forEach((b) => console.log(`   [${b.count}x] "${b.sentence.slice(0, 100)}${b.sentence.length > 100 ? '…' : ''}"`));
console.log(`\nB) In-article stuffing (a 3-word phrase over ${(STUFF_MAX * 100).toFixed(1)}% density): ${stuffing.length}`);
stuffing.sort((a, b) => b.density - a.density).forEach((s) => console.log(`   ${s.slug}: "${s.phrase}" ${s.count}x = ${(s.density * 100).toFixed(2)}%`));

const problems = boiler.length + stuffing.length;
console.log(`\n${problems === 0 ? 'OK: no repetition problems.' : 'FOUND ' + problems + ' repetition problem(s); fix before publishing.'}`);
process.exit(problems === 0 ? 0 : 1);

/**
 * Audits blog/*.html against the mechanical rules in BLOG_STYLE_GUIDE.md and
 * prints a PASS / WARN / FAIL report. Does NOT modify files.
 *
 *   node scripts/audit_blog.cjs            # all articles
 *   node scripts/audit_blog.cjs <slug>     # one article
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://thenomadhq.com';
const AUTHOR = 'Yannick Schroth';

const only = process.argv[2];
const files = fs.readdirSync(path.join(ROOT, 'blog'))
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !only || f === only || f === only + '.html');

const get = (re, s) => { const m = s.match(re); return m ? m[1] : null; };
const count = (re, s) => (s.match(re) || []).length;
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

let totalFail = 0, totalWarn = 0;

for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(ROOT, 'blog', file), 'utf8');
  const article = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || [, ''])[1];
  const issues = [];
  const FAIL = (m) => { issues.push('  FAIL ' + m); totalFail++; };
  const WARN = (m) => { issues.push('  WARN ' + m); totalWarn++; };

  // headings
  const h1 = count(/<h1[\s>]/gi, html);
  if (h1 !== 1) FAIL(`H1 count = ${h1} (must be 1)`);
  const h2 = count(/<h2[\s>]/gi, html);
  if (h2 < 8) WARN(`only ${h2} H2s (target 8-15)`);
  else if (h2 > 16) WARN(`${h2} H2s (target 8-15)`);

  // title / description
  const title = get(/<title>([^<]*)<\/title>/, html) || '';
  if (title.length > 60) WARN(`title ${title.length} chars > 60`);
  const desc = get(/<meta name="description" content="([^"]*)"/, html) || '';
  if (!desc) FAIL('no meta description');
  else if (desc.length < 120 || desc.length > 160) WARN(`meta description ${desc.length} chars (target 140-155)`);

  // canonical / og:url consistency
  const canonical = get(/<link rel="canonical" href="([^"]+)"/, html);
  const want = `${SITE}/blog/${slug}`;
  if (!canonical) FAIL('no canonical');
  else if (canonical !== want) FAIL(`canonical ${canonical} != ${want}`);
  const ogurl = get(/<meta property="og:url" content="([^"]+)"/, html);
  if (ogurl && ogurl !== want) WARN(`og:url ${ogurl} != canonical`);

  // author + robots
  const author = get(/<meta name="author" content="([^"]+)"/, html);
  if (author !== AUTHOR) FAIL(`author = "${author}" (must be ${AUTHOR})`);
  if (!/name="robots"/i.test(html)) WARN('no robots meta');
  if (/picsum\.photos/.test(html)) WARN('uses picsum placeholder image');

  // JSON-LD
  const types = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((b) => { try { return JSON.parse(b[1])['@type']; } catch { return 'INVALID'; } });
  if (types.includes('INVALID')) FAIL('invalid JSON-LD (does not parse)');
  if (!types.includes('BlogPosting')) FAIL('no BlogPosting JSON-LD');
  if (!types.includes('BreadcrumbList')) WARN('no BreadcrumbList JSON-LD');

  // FAQ
  const hasFaq = /<h2[^>]*>\s*(?:Frequently Asked Questions|FAQ)/i.test(html);
  if (!hasFaq) WARN('no FAQ section');
  else if (!types.includes('FAQPage')) WARN('FAQ section present but no FAQPage JSON-LD');

  // internal links inside the article body
  const internal = new Set([...article.matchAll(/href="(\/(?:blog|cities|services|best|wheel|rentals|about|compare|timezones|route|map|salary|geoarbitrage|nomad-visas|visa|tier-list|cost-of-living-index|best-weather)\/?[^"#]*)"/g)]
    .map((m) => m[1]).filter((h) => h !== `/blog/${slug}`));
  if (internal.size < 3) WARN(`${internal.size} internal links in body (target 3-5)`);

  // em-dash / spaced en-dash in the body
  const em = count(/—/g, article) + count(/ – /g, article);
  if (em > 0) FAIL(`${em} em-dash / spaced en-dash in body (house-style ban)`);

  const words = strip(article).split(' ').length;

  const status = issues.length === 0 ? 'PASS' : (issues.some((i) => i.includes('FAIL')) ? 'FAIL' : 'WARN');
  console.log(`\n[${status}] ${slug}  (${words}w, ${h2} H2, ${internal.size} links)`);
  issues.forEach((i) => console.log(i));
}

console.log(`\n———\n${files.length} articles · ${totalFail} FAIL · ${totalWarn} WARN`);

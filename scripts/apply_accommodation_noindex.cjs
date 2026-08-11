require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * ACCOMMODATION_PAGE_STYLE_GUIDE.md Strategy B (chosen): thin listing pages are
 * noindex,follow and removed from the sitemap. They stay crawlable/browsable for
 * UX and still pass link equity to city pages, but don't compete for crawl budget.
 *   - adds <meta name="robots" content="noindex, follow"> to every accommodations/*.html
 *   - strips every /accommodations/ <url> block from sitemap.xml
 * Idempotent. Usage: node scripts/apply_accommodation_noindex.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// 1. noindex on each listing
let tagged = 0;
const dir = path.join(ROOT, 'accommodations');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(dir, f);
  let html = fs.readFileSync(abs, 'utf8');
  if (/name="robots"/i.test(html)) continue;
  html = html.replace(/(<meta name="viewport"[^>]*>\n)/i, `$1  <meta name="robots" content="noindex, follow">\n`);
  fs.writeFileSync(abs, html);
  tagged++;
}
console.log(`Accommodation pages tagged noindex: ${tagged}`);

// 2. remove accommodation URLs from sitemap
const sp = path.join(ROOT, 'sitemap.xml');
let xml = fs.readFileSync(sp, 'utf8');
const before = (xml.match(/<loc>[^<]*\/accommodations\//g) || []).length;
xml = xml.replace(/\s*<url>(?:(?!<\/url>)[\s\S])*?\/accommodations\/[\s\S]*?<\/url>/g, '');
const after = (xml.match(/<loc>[^<]*\/accommodations\//g) || []).length;
fs.writeFileSync(sp, xml);
console.log(`Sitemap accommodation URLs removed: ${before - after} (remaining: ${after})`);
console.log(`Sitemap total <loc> now: ${(xml.match(/<loc>/g) || []).length}`);

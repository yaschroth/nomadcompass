require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Inline-links the first mention of each city name in a blog post's article prose to that city's
 * guide, so posts have real contextual internal links instead of only the end-of-post block. Only
 * touches text nodes (never inside existing <a>, headings, code, or attributes), links each city
 * at most once per post, caps new links, skips ambiguous names, and is accent-safe. Idempotent:
 * marked with data-al and unwrapped before each run. Usage: node scripts/apply_blog_autolink.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CAP = 14;
const BLOCK = new Set(['Nice', 'Split', 'Male', 'Bath', 'Victoria', 'Hue', 'As', 'Of', 'Central', 'Center', 'George Town', 'Sunshine Coast']);

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// base name (drop parenthetical like "Bali (Canggu)" -> "Bali"), filter risky/short
const CITYLIST = m.exports.filter((c) => c && c.id && c.name).map((c) => ({ id: c.id, name: c.name.replace(/\s*\(.*\)\s*$/, '').trim() }))
  .filter((c) => c.name.length >= 4 && !BLOCK.has(c.name))
  .map((c) => ({ id: c.id, name: c.name, re: new RegExp('(?<![\\p{L}])(' + escRe(c.name) + ')(?![\\p{L}])', 'u') }))
  .sort((a, b) => b.name.length - a.name.length);

function autolink(region, already) {
  const parts = region.split(/(<[^>]+>)/);
  let linkD = 0, hD = 0, skipD = 0, added = 0;
  const used = new Set(already);
  for (let i = 0; i < parts.length; i++) {
    const tok = parts[i];
    if (tok.startsWith('<')) {
      const t = tok.toLowerCase();
      if (/^<a[\s>]/.test(t)) linkD++;
      else if (/^<\/a>/.test(t)) linkD = Math.max(0, linkD - 1);
      else if (/^<h[1-6][\s>]/.test(t)) hD++;
      else if (/^<\/h[1-6]>/.test(t)) hD = Math.max(0, hD - 1);
      else if (/^<(script|style|button|summary|code|figcaption)[\s>]/.test(t)) skipD++;
      else if (/^<\/(script|style|button|summary|code|figcaption)>/.test(t)) skipD = Math.max(0, skipD - 1);
      continue;
    }
    if (linkD || hD || skipD || added >= CAP || !tok.trim()) continue;
    // collect first-occurrence candidates on the ORIGINAL token (no mid-insert index shifts)
    const cands = [];
    for (const c of CITYLIST) {
      if (used.has(c.id)) continue;
      const mm = c.re.exec(tok);
      if (mm) { const start = mm.index + mm[0].indexOf(c.name); cands.push({ start, end: start + c.name.length, c }); }
    }
    // accept non-overlapping matches (earliest start; longer name wins an overlap so "New York" beats "York")
    cands.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const accepted = [];
    for (const cand of cands) {
      if (added + accepted.length >= CAP) break;
      if (used.has(cand.c.id)) continue;
      if (accepted.some((a) => cand.start < a.end && cand.end > a.start)) continue;
      accepted.push(cand); used.add(cand.c.id);
    }
    accepted.sort((a, b) => b.start - a.start);
    let text = tok;
    for (const a of accepted) { text = text.slice(0, a.start) + '<a href="/cities/' + a.c.id + '" data-al>' + a.c.name + '</a>' + text.slice(a.end); }
    added += accepted.length;
    parts[i] = text;
  }
  return { html: parts.join(''), added };
}

const files = fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html') && f !== 'index.html');
let done = 0, total = 0;
for (const file of files) {
  const fp = path.join(ROOT, 'blog', file);
  let html = fs.readFileSync(fp, 'utf8');
  // idempotent: unwrap previous auto-links
  html = html.replace(/<a href="\/cities\/[a-z0-9-]+" data-al>([^<]*)<\/a>/g, '$1');
  const aStart = html.indexOf('<article');
  const aEnd = html.indexOf('</article>');
  if (aStart < 0 || aEnd < 0) { console.log('no article', file); continue; }
  const region = html.slice(aStart, aEnd);
  // cities already linked in the article (skip those)
  const already = [...region.matchAll(/href="\/cities\/([a-z0-9-]+)"/g)].map((x) => x[1]);
  const { html: newRegion, added } = autolink(region, already);
  html = html.slice(0, aStart) + newRegion + html.slice(aEnd);
  fs.writeFileSync(fp, html);
  done++; total += added;
  console.log('  ' + file.replace(/\.html$/, '').padEnd(34), '+' + added + ' city links');
}
console.log(`Auto-linked ${total} city mentions across ${done} posts.`);

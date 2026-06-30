/**
 * SEO clean-URL pass.
 *
 *  1. Rewrites every INTERNAL `.html` link to its clean form so internal links
 *     match the sitemap/canonical (no unnecessary 308 hop after cleanUrls is on).
 *       href="../blog.html"            -> href="../blog"
 *       href="cities/${city.id}.html"  -> href="cities/${city.id}"
 *       href="../index.html#cities"    -> href="/#cities"   (homepage normalises to root)
 *     External (http/https///, mailto, tel), asset (.css/.js/.svg) and pure
 *     "#anchor" links are left untouched.
 *
 *  2. Adds a self-referencing <link rel="canonical"> to any content page that
 *     lacks one (city + accommodation + key top-level pages). Auth/utility pages
 *     are skipped so we don't invite them into the index.
 *
 * Idempotent: re-running makes no further changes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://thenomadhq.com';

const TARGET_DIRS = ['cities', 'blog', 'accommodations'];
const TOP_LEVEL = [
  'index.html', 'blog.html', 'rentals.html', 'wheel.html', 'cities.html',
  'login.html', 'signup.html', 'profile.html',
];
// Pages we clean links on but do NOT give a self-canonical (keep out of index intent).
const NO_CANONICAL = new Set(['login.html', 'signup.html', 'profile.html']);

function listHtml() {
  const files = [];
  for (const d of TARGET_DIRS) {
    const dir = path.join(ROOT, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.html')) files.push(d + '/' + f);
    }
  }
  for (const f of TOP_LEVEL) {
    if (fs.existsSync(path.join(ROOT, f))) files.push(f);
  }
  return files;
}

function canonicalFor(relPath) {
  const p = relPath.replace(/\\/g, '/').replace(/\.html$/, '');
  return p === 'index' ? SITE + '/' : SITE + '/' + p;
}

function isInternalPage(href) {
  if (!href) return false;
  if (/^(https?:)?\/\//i.test(href)) return false;            // external / protocol-relative
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return false;
  if (href.startsWith('#')) return false;                      // pure anchor
  const pathPart = href.split(/[#?]/)[0];
  return /\.html$/.test(pathPart);
}

function cleanHref(href) {
  const m = href.match(/^([^#?]*)([#?].*)?$/);
  let base = m[1].replace(/\.html$/, '');
  const suffix = m[2] || '';
  // Any path that resolves to the homepage normalises to site root.
  if (/(^|\/)index$/.test(base)) {
    base = base.replace(/index$/, '');
    if (base === '' || /^(\.\/|(\.\.\/)+)$/.test(base)) base = '/';
  }
  return base + suffix;
}

let linkChanges = 0;
let canonicalAdds = 0;
let filesTouched = 0;

for (const rel of listHtml()) {
  const abs = path.join(ROOT, rel);
  let content = fs.readFileSync(abs, 'utf8');
  const before = content;

  // 1. internal link cleanup
  content = content.replace(/href\s*=\s*("|')([^"']*)\1/g, (full, q, val) => {
    if (!isInternalPage(val)) return full;
    const cleaned = cleanHref(val);
    if (cleaned === val) return full;
    linkChanges++;
    return 'href=' + q + cleaned + q;
  });

  // 2. self-canonical
  const base = path.basename(rel);
  if (!/rel=["']canonical["']/i.test(content) && !NO_CANONICAL.has(base)) {
    const tag = `  <link rel="canonical" href="${canonicalFor(rel)}">\n`;
    if (/<\/title>/i.test(content)) {
      content = content.replace(/<\/title>/i, '</title>\n' + tag);
      canonicalAdds++;
    } else if (/<\/head>/i.test(content)) {
      content = content.replace(/<\/head>/i, tag + '</head>');
      canonicalAdds++;
    }
  }

  if (content !== before) {
    fs.writeFileSync(abs, content);
    filesTouched++;
  }
}

console.log(`Files touched:     ${filesTouched}`);
console.log(`Internal links cleaned: ${linkChanges}`);
console.log(`Canonicals added:  ${canonicalAdds}`);

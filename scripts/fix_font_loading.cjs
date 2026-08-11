require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Fix the sitewide font-loading bug: pages reference 'DM Serif Display' /
 * Source Sans 3 (via base.css tokens) but never actually load the Google Fonts
 * stylesheet — they only `preload` it (city pages) or have no font links at all
 * (home, blog, wheel, auth). Result: the branded serif silently falls back to
 * Georgia everywhere except /cities. This adds the missing <link rel="stylesheet">.
 * Idempotent. Usage: node scripts/fix_font_loading.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const HREF = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap';
const STYLESHEET = `<link rel="stylesheet" href="${HREF}">`;

function fix(s) {
  if (/rel="stylesheet"[^>]*fonts\.googleapis/.test(s)) return s; // already loads the font CSS
  // Case A: page already preloads the font CSS -> just add the stylesheet right after it.
  const preload = /^([ \t]*)<link rel="preload" href="https:\/\/fonts\.googleapis\.com[^"]*" as="style">/m;
  if (preload.test(s)) return s.replace(preload, (m, ind) => `${m}\n${ind}${STYLESHEET}`);
  // Case B: no font links at all -> insert preconnects + stylesheet before the first CSS <link>.
  const firstCss = /^([ \t]*)<link rel="stylesheet"/m;
  if (firstCss.test(s)) {
    return s.replace(firstCss, (m, ind) =>
      `${ind}\n` +
      `${ind}\n` +
      `${ind}${STYLESHEET}\n${m}`);
  }
  return s;
}

const targets = [];
for (const f of ['index.html', 'blog.html', 'wheel.html', 'rentals.html', 'login.html', 'signup.html', 'profile.html']) {
  if (fs.existsSync(path.join(ROOT, f))) targets.push(path.join(ROOT, f));
}
for (const dir of ['blog', 'cities', 'about']) {
  const d = path.join(ROOT, dir);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.html'))) targets.push(path.join(d, f));
}

let fixed = 0, ok = 0;
for (const abs of targets) {
  const s = fs.readFileSync(abs, 'utf8');
  const out = fix(s);
  if (out !== s) { fs.writeFileSync(abs, out); fixed++; } else { ok++; }
}
console.log(`Font stylesheet added to ${fixed} pages (${ok} already correct / skipped).`);

/**
 * Image perf: (1) serve Unsplash images as WebP (append &fm=webp&q=80 — ~30%
 * smaller); Pexels already negotiates WebP via auto=compress. (2) Add width/height
 * (from the URL's w=/h=) + decoding="async" to cover-images so they don't cause CLS.
 * Safe: all target images use object-fit:cover with a CSS-fixed box. Idempotent.
 * Usage: node scripts/apply_image_webp.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const webp = (url) => (/[?&]fm=webp/.test(url) ? url : url + (url.includes('?') ? '&' : '?') + 'fm=webp&q=80');
const convertUnsplash = (s) => s.replace(/https:\/\/images\.unsplash\.com\/[^"'\s)]+/g, webp);

function addImgDims(s) {
  return s.replace(/<img\b[^>]*\bsrc="(https:\/\/images\.(?:unsplash|pexels)\.com\/[^"]+)"[^>]*>/g, (m, src) => {
    let out = m;
    if (!/\bwidth=/.test(out)) {
      const w = (src.match(/[?&]w=(\d+)/) || [])[1];
      const h = (src.match(/[?&]h=(\d+)/) || [])[1];
      if (w && h) out = out.replace(/^<img\b/, `<img width="${w}" height="${h}"`);
    }
    if (!/\bdecoding=/.test(out)) out = out.replace(/^<img\b/, '<img decoding="async"');
    return out;
  });
}

// cities-data.js: WebP the image URLs (feeds cards + home teaser + related JS)
const cdPath = path.join(ROOT, 'cities-data.js');
const cd0 = fs.readFileSync(cdPath, 'utf8');
const cd = convertUnsplash(cd0);
if (cd !== cd0) fs.writeFileSync(cdPath, cd);

// city + blog pages: WebP URLs + img dimensions
let changed = 0;
for (const dir of ['cities', 'blog']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.html'))) {
    const abs = path.join(ROOT, dir, f);
    const b = fs.readFileSync(abs, 'utf8');
    const s = addImgDims(convertUnsplash(b));
    if (s !== b) { fs.writeFileSync(abs, s); changed++; }
  }
}
console.log(`cities-data.js: ${cd !== cd0 ? 'webp applied' : 'unchanged'} | HTML pages updated: ${changed}`);

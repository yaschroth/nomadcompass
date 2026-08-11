/**
 * Front-end performance sweep for city pages. Four changes, each measured rather than
 * assumed (see the audit that prompted them):
 *
 * 1. Hero becomes a <picture>. The hero is min-height:100vh with object-fit:cover, so on a
 *    portrait phone it is HEIGHT constrained and a plain srcset with sizes="100vw" would
 *    pick a source far too small and render blurry. Phones therefore get a pre-cropped
 *    portrait (identical framing to what object-fit already produces), tablets a 1280
 *    landscape, everything larger the full 1920.
 * 2. The preload is split to match, so we preload the variant the browser will actually
 *    use instead of always fetching the 1920.
 * 3. Leaflet's stylesheet, which sits in <head> and therefore blocks first paint on a
 *    third-party origin, is loaded non-blocking with a noscript fallback. Its script is
 *    deliberately left alone: it already sits at the end of <body>, and adding `defer`
 *    would BREAK the map, because the inline init calls L.map() with no DOMContentLoaded
 *    guard and inline scripts run before deferred ones.
 * 4. unpkg gets a preconnect so the DNS and TLS handshake is not in the critical path.
 *
 * Idempotent. Usage: node scripts/apply_perf_hero.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');
const IMG = path.join(ROOT, 'images', 'cities');
const DRY = process.argv.includes('--dry');

let picture = 0, preload = 0, css = 0, preconnect = 0, noVariants = [];

for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const slug = file.replace(/\.html$/, '');
  const p = path.join(DIR, file);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  const hasVariants = fs.existsSync(path.join(IMG, slug + '-m.webp')) && fs.existsSync(path.join(IMG, slug + '-t.webp'));

  // 1 + 2. Hero picture and matching preload
  if (hasVariants && !/<picture class="city-hero-picture">/.test(s)) {
    const imgRe = /<img([^>]*\bclass="city-hero-image"[^>]*)>/;
    const m = s.match(imgRe);
    if (m) {
      const attrs = m[1];
      const pic =
        `<picture class="city-hero-picture">` +
        `<source media="(max-width: 640px)" srcset="/images/cities/${slug}-m.webp" width="900" height="1350">` +
        `<source media="(max-width: 1100px)" srcset="/images/cities/${slug}-t.webp">` +
        `<img${attrs}>` +
        `</picture>`;
      s = s.replace(imgRe, pic);
      picture++;
    }
    const preRe = /<link rel="preload" as="image" href="\/images\/cities\/[^"]+\.webp"[^>]*>/;
    if (preRe.test(s)) {
      s = s.replace(preRe,
        `<link rel="preload" as="image" href="/images/cities/${slug}-m.webp" fetchpriority="high" media="(max-width: 640px)">\n` +
        `  <link rel="preload" as="image" href="/images/cities/${slug}-t.webp" fetchpriority="high" media="(min-width: 641px) and (max-width: 1100px)">\n` +
        `  <link rel="preload" as="image" href="/images/cities/${slug}.webp" fetchpriority="high" media="(min-width: 1101px)">`);
      preload++;
    }
  } else if (!hasVariants) {
    noVariants.push(slug);
  }

  // 4. Leaflet stylesheet non-blocking, with a noscript fallback so it still applies
  //    when JS is off.
  const cssRe = /<link rel="stylesheet" href="(https:\/\/unpkg\.com\/leaflet@[^"]+\/dist\/leaflet\.css)"([^>]*)>/;
  const cm = s.match(cssRe);
  if (cm && !/media="print"/.test(cm[0])) {
    s = s.replace(cssRe, (full, href, rest) =>
      `<link rel="stylesheet" href="${href}"${rest} media="print" onload="this.media='all';this.onload=null">` +
      `<noscript><link rel="stylesheet" href="${href}"${rest}></noscript>`);
    css++;
  }

  // 5. Preconnect so the third-party handshake is not in the critical path.
  //    The \r?\n matters: these files are CRLF, so a bare \n never matches after a tag.
  //    The counter is set from the result, not from the intent, or it reports work it
  //    never did.
  if (/unpkg\.com/.test(s) && !/rel="preconnect" href="https:\/\/unpkg\.com"/.test(s)) {
    const beforePre = s;
    s = s.replace(/(<meta name="viewport"[^>]*>\r?\n)/,
      `$1  <link rel="preconnect" href="https://unpkg.com" crossorigin>\n`);
    if (s !== beforePre) preconnect++;
  }

  if (!DRY && s !== before) fs.writeFileSync(p, s);
}

console.log(`${DRY ? 'DRY RUN' : 'APPLIED'}`);
console.log(`  hero <picture>: ${picture} | preload split: ${preload} | leaflet css non-blocking: ${css} | preconnect: ${preconnect}`);
if (noVariants.length) console.log(`  no image variants yet (skipped): ${noVariants.length}`);

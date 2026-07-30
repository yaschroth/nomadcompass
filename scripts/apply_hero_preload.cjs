/**
 * Adds an early <link rel="preload" as="image"> for each city page's LCP hero image, so the
 * browser starts fetching it before the stylesheets/scripts are parsed (faster LCP). The hero
 * <img> already carries fetchpriority=high + dimensions; this just moves the discovery earlier.
 * Idempotent + CRLF-safe.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');

const HERO_RE = /<img[^>]*\bsrc="(\/images\/cities\/[^"]+\.(?:webp|jpg|jpeg|png))"[^>]*class="city-hero-image"/;
const ANCHOR = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';

let done = 0, skipped = 0, miss = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(DIR, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (/rel="preload" as="image"/.test(s)) { skipped++; continue; }
  const m = s.match(HERO_RE);
  if (!m) { miss.push(f); continue; }
  const src = m[1];
  const link = `\n  <link rel="preload" as="image" href="${src}" fetchpriority="high">`;
  if (!s.includes(ANCHOR)) { miss.push(f + ' (no anchor)'); continue; }
  s = s.replace(ANCHOR, ANCHOR + link);
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`hero preload added: ${done}, already-had: ${skipped}, no-match: ${miss.length}`);
if (miss.length) console.log('  ', miss.slice(0, 5).join(', '));

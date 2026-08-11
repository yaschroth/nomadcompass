/**
 * Generates responsive hero variants and re-encodes the full-size hero to a weight budget.
 *
 * Why a portrait crop rather than a plain srcset: the hero is `min-height:100vh` with
 * `object-fit:cover`, so on a portrait phone the image is HEIGHT constrained. A normal
 * srcset with sizes="100vw" would pick a source far too small and render a blurry hero.
 * Because object-fit already centre-crops, a pre-made centre-cropped portrait renders
 * identically to what mobile users see today, just at a fraction of the bytes.
 *
 *   <slug>-m.webp   900x1350  centre-cropped portrait, phones (<=640px)
 *   <slug>-t.webp   1280w     landscape, tablets and small laptops
 *   <slug>.webp     1920w     landscape, re-encoded to budget, everything larger
 *
 * Quality is searched downward until the file fits its budget, so detail-heavy photos are
 * compressed harder than simple ones instead of everything sharing one blunt setting.
 *
 * Usage: node scripts/gen_hero_variants.cjs [--force] [slug ...]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'images', 'cities');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

const BUDGET = { m: 170 * 1024, t: 200 * 1024, full: 320 * 1024 };
const QUALITIES = [80, 74, 68, 62, 56, 50];

async function encodeToBudget(input, budget, resize) {
  let last = null;
  for (const quality of QUALITIES) {
    let p = sharp(input);
    if (resize) p = p.resize(resize);
    const buf = await p.webp({ quality, effort: 5 }).toBuffer();
    last = { buf, quality };
    if (buf.length <= budget) return last;
  }
  return last; // detail-heavy image: ship the smallest we could make
}

(async () => {
  const heroes = fs.readdirSync(DIR)
    .filter(f => /\.webp$/.test(f) && !/-(card|m|t)\.webp$/.test(f))
    .map(f => f.replace(/\.webp$/, ''))
    .filter(s => !ONLY.length || ONLY.includes(s));

  let done = 0, before = 0, after = 0, skipped = 0;
  for (const slug of heroes) {
    const src = path.join(DIR, slug + '.webp');
    const mPath = path.join(DIR, slug + '-m.webp');
    const tPath = path.join(DIR, slug + '-t.webp');
    if (!FORCE && fs.existsSync(mPath) && fs.existsSync(tPath)) { skipped++; continue; }

    const origSize = fs.statSync(src).size;
    // Read once into memory so the re-encode is not reading a file we are about to write.
    const input = fs.readFileSync(src);

    const m = await encodeToBudget(input, BUDGET.m, { width: 900, height: 1350, fit: 'cover', position: 'centre' });
    fs.writeFileSync(mPath, m.buf);
    const t = await encodeToBudget(input, BUDGET.t, { width: 1280 });
    fs.writeFileSync(tPath, t.buf);

    // Only rewrite the full-size hero when that actually saves something worth the
    // generational quality loss of re-encoding an already lossy file.
    const full = await encodeToBudget(input, BUDGET.full, null);
    if (full.buf.length < origSize * 0.85) fs.writeFileSync(src, full.buf);

    before += origSize;
    after += fs.statSync(src).size + m.buf.length + t.buf.length;
    done++;
    if (done % 50 === 0) process.stdout.write(`  ${done}/${heroes.length}\r`);
  }
  console.log(`\nheroes processed: ${done} | skipped (already had variants): ${skipped}`);
  if (done) {
    console.log(`full-size hero total: ${Math.round(before / 1024 / 1024)}MB -> variants add up to ${Math.round(after / 1024 / 1024)}MB across three widths`);
  }
})();

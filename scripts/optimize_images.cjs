/**
 * One-off / re-runnable image optimizer for Core Web Vitals. Re-encodes oversized hero webp images
 * (city heroes and the hub/tool heroes) down to a sensible size for full-bleed display, cutting the
 * biggest LCP images roughly in half with no visible quality loss. Only touches files above a size
 * threshold and only overwrites when the result is actually smaller, so it is safe to re-run. Card
 * thumbnails (already small) are left alone. Usage: node scripts/optimize_images.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const kb = (f) => Math.round(fs.statSync(f).size / 1024);

async function reencode(file, maxW, quality, thresholdKB) {
  if (!fs.existsSync(file)) return null;
  const before = kb(file);
  if (before <= thresholdKB) return null;
  const input = fs.readFileSync(file); // read to buffer so sharp holds no handle on the file we overwrite
  const buf = await sharp(input).resize({ width: maxW, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
  const after = Math.round(buf.length / 1024);
  if (after < before) { fs.writeFileSync(file, buf); return { before, after }; }
  return null;
}

(async () => {
  let savedBefore = 0, savedAfter = 0, n = 0;
  // city hero photos (skip -card thumbnails)
  const cdir = path.join(ROOT, 'images', 'cities');
  for (const f of fs.readdirSync(cdir).filter((x) => x.endsWith('.webp') && !x.includes('-card'))) {
    const r = await reencode(path.join(cdir, f), 1600, 70, 350);
    if (r) { savedBefore += r.before; savedAfter += r.after; n++; }
  }
  // hub / tool page heroes (full-bleed 100vh) + homepage hero
  const heroes = fs.existsSync(path.join(ROOT, 'assets')) ? fs.readdirSync(path.join(ROOT, 'assets')).filter((x) => x.endsWith('-hero.webp')).map((x) => path.join(ROOT, 'assets', x)) : [];
  heroes.push(path.join(ROOT, 'images', 'extended_surf_4000.webp'));
  for (const f of heroes) {
    const r = await reencode(f, 1600, 72, 400);
    if (r) { savedBefore += r.before; savedAfter += r.after; n++; console.log('  hero', path.relative(ROOT, f).split(path.sep).join('/'), r.before + 'KB ->', r.after + 'KB'); }
  }
  console.log(`Optimized ${n} images: ${Math.round(savedBefore / 1024)}MB -> ${Math.round(savedAfter / 1024)}MB (saved ${Math.round((savedBefore - savedAfter) / 1024)}MB).`);
})();

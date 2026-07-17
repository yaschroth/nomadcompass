/**
 * Rasterizes the brand mark to logo.png (512x512, padded on white) at the repo root,
 * so the Organization `logo` in JSON-LD (and existing blog publisher schema, which
 * already references /logo.png) resolves to a real, Google-fetchable raster.
 * Usage: node scripts/gen_logo_png.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'assets', 'logo-512.svg'));
(async () => {
  await sharp(svg, { density: 300 })
    .resize(432, 432, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(ROOT, 'logo.png'));
  const st = fs.statSync(path.join(ROOT, 'logo.png'));
  console.log('Wrote logo.png (512x512, ' + Math.round(st.size / 1024) + ' KB)');
})();

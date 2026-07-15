/**
 * Generates branded 1200x630 social share cards (JPG) per city for Open Graph / Twitter.
 * Base = the city hero photo (cover-cropped), dark gradient for legibility, city name +
 * country + Nomad Score badge + brand wordmark. Writes images/og/<slug>.jpg.
 * Usage: node scripts/gen_og_cards.cjs <slug> [<slug> ...]   (no args = all cities)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const HERO = path.join(ROOT, 'images', 'cities');
const OUT = path.join(ROOT, 'images', 'og');
const W = 1200, H = 630;

// --- city data + nomad score (same formula as the live pages) ---
const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const mm = {}; new Function('module', code + ';module.exports=CITIES')(mm);
const CITIES = mm.exports;
const CATS = ['climate','cost','wifi','nightlife','nature','safety','food','community','english','visa','culture','cleanliness','airquality'];
function nomadScore(c) {
  let t = 0, n = 0;
  for (const k of CATS) { if (typeof c.scores[k] === 'number') { t += c.scores[k]; n++; } }
  const raw = n ? t / n : 0;
  return Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// crude width estimate to keep long city names on one line, clear of the score badge.
// Georgia bold averages ~0.6em/char; shrink the font until the name fits `max` px.
function fitSize(text, max, base, min) {
  const est = text.length * base * 0.6;
  if (est <= max) return base;
  return Math.max(min, Math.floor(base * max / est));
}
// name box must end before the score badge (badge left edge = W-250) with a gap
const NAME_MAX_W = (W - 250) - 60 - 40;

function overlaySvg(city) {
  const name = esc(city.name);
  const country = esc(city.country);
  const score = nomadScore(city);
  const nameSize = fitSize(city.name, NAME_MAX_W, 92, 44);
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0F172A" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#0F172A" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#0F172A" stop-opacity="0.88"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0F172A" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#0F172A" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#side)"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#c0392b"/>
  <!-- brand wordmark -->
  <text x="60" y="76" font-family="Georgia, serif" font-size="34" fill="#FFFFFF" font-weight="bold">The Nomad<tspan fill="#FF6B4A">HQ</tspan></text>
  <!-- city name + country -->
  <text x="60" y="${H - 118}" font-family="Georgia, serif" font-size="${nameSize}" fill="#FFFFFF" font-weight="bold">${name}</text>
  <text x="63" y="${H - 62}" font-family="Arial, sans-serif" font-size="34" fill="#E5E7EB" letter-spacing="3">${country.toUpperCase()}</text>
  <!-- nomad score badge -->
  <g>
    <rect x="${W - 250}" y="${H - 168}" width="190" height="108" rx="16" fill="#c0392b"/>
    <text x="${W - 155}" y="${H - 118}" font-family="Arial, sans-serif" font-size="56" fill="#FFFFFF" font-weight="bold" text-anchor="middle">${score}</text>
    <text x="${W - 155}" y="${H - 84}" font-family="Arial, sans-serif" font-size="19" fill="#FFFFFF" text-anchor="middle" letter-spacing="2" opacity="0.9">NOMAD SCORE</text>
  </g>
</svg>`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let slugs = process.argv.slice(2);
  if (!slugs.length) slugs = CITIES.map((c) => c.id).filter((s) => fs.existsSync(path.join(HERO, s + '.webp')));
  let ok = 0, miss = 0;
  for (const slug of slugs) {
    const city = CITIES.find((c) => c.id === slug);
    const hero = path.join(HERO, slug + '.webp');
    if (!city || !fs.existsSync(hero)) { console.error('SKIP (no city/hero):', slug); miss++; continue; }
    try {
      const base = await sharp(hero).resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
      await sharp(base)
        .composite([{ input: overlaySvg(city), top: 0, left: 0 }])
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(OUT, slug + '.jpg'));
      ok++;
    } catch (e) { console.error('FAIL:', slug, e.message); miss++; }
  }
  console.log(`OG cards: ${ok} written, ${miss} skipped -> images/og/`);
})().catch((e) => { console.error(e); process.exit(1); });

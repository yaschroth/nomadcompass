require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Applies vision-verified hero images to city pages. Reads img-<slug>.json
 * (from a verification agent) in argv[2]. For each ok:true entry it:
 *  - downloads the image and writes images/cities/<slug>.webp (1920w) + <slug>-card.webp (800w)
 *  - repoints the hero <img>, og:image, twitter:image, and JSON-LD image to the webp
 *  - inserts a visible photographer/source credit on the hero
 *  - repoints the /cities card image in cities-data.js
 *  - records attribution in images/cities/attribution.json
 * ok:false entries are skipped (city keeps its old image, flagged for manual work).
 * Usage: node scripts/apply_city_image.cjs "<dir with img-*.json>"
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const OUT = path.join(ROOT, 'images', 'cities');
const ATTR = path.join(OUT, 'attribution.json');
const UA = { headers: { 'User-Agent': 'TheNomadHQ/1.0 (city guide images; info@topblog.agency)' } };
const esc = (s) => String(s == null ? '' : s).replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const attrib = fs.existsSync(ATTR) ? JSON.parse(fs.readFileSync(ATTR, 'utf8')) : {};
  let ok = 0, skipped = 0, fail = 0;
  for (const file of fs.readdirSync(DIR).filter((f) => /^img-.+\.json$/.test(f))) {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, ''));
    const slug = j.slug;
    if (!j.ok) { console.error('FLAGGED (kept old image):', slug, j.reason || ''); skipped++; continue; }
    const page = path.join(ROOT, 'cities', slug + '.html');
    if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); fail++; continue; }
    let buf;
    try {
      const res = await fetch(j.viewUrl || j.imageUrl, UA);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      buf = Buffer.from(await res.arrayBuffer());
      // If the viewed thumbnail is under our 1600px hero minimum but a distinct
      // full-res imageUrl exists, re-fetch that so the hero is not soft on large displays.
      const w = (await sharp(buf).metadata()).width || 0;
      if (w < 1600 && j.imageUrl && j.imageUrl !== (j.viewUrl || j.imageUrl)) {
        const r2 = await fetch(j.imageUrl, UA);
        if (r2.ok) { const b2 = Buffer.from(await r2.arrayBuffer()); if (((await sharp(b2).metadata()).width || 0) > w) buf = b2; }
      }
    } catch (e) { console.error('DOWNLOAD FAIL:', slug, e.message); fail++; continue; }

    let hInfo;
    try {
      hInfo = await sharp(buf).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(OUT, slug + '.webp'));
      await sharp(buf).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(OUT, slug + '-card.webp'));
    } catch (e) { console.error('CONVERT FAIL:', slug, e.message); fail++; continue; }

    let s = fs.readFileSync(page, 'utf8');
    const heroSrc = '/images/cities/' + slug + '.webp';
    const absHero = 'https://thenomadhq.com/images/cities/' + slug + '.webp';
    const alt = esc(j.alt || (j.city + ' cityscape'));

    const heroRe = /<img[^>]*class="city-hero-image">/;
    if (!heroRe.test(s)) { console.error('NO HERO IMG:', slug); fail++; continue; }
    s = s.replace(heroRe, () => `<img decoding="async" fetchpriority="high" width="${hInfo.width}" height="${hInfo.height}" src="${heroSrc}" alt="${alt}" class="city-hero-image">`);
    s = s.replace(/(<meta property="og:image" content=")[^"]*(">)/, (_, a, b) => a + absHero + b);
    s = s.replace(/(<meta name="twitter:image" content=")[^"]*(">)/, (_, a, b) => a + absHero + b);
    s = s.replace(/("image":\s*")https?:\/\/[^"]*(")/g, (_, a, b) => a + absHero + b);

    // The credit is REPLACED, not merely inserted when absent. Guarding on the element's existence
    // meant a hero swap left the previous photographer's name, licence and file link in place,
    // which is a false attribution rather than a missing one: Kumasi's page credited Maven Egote
    // under CC BY-SA 4.0 while displaying Afus199620's photograph released CC0. check_photo_credit
    // asks whether a credit exists, not whether it is the right one, so it read that as clean.
    const lic = j.license && !/unsplash|pexels/i.test(j.license) ? ` (${esc(j.license)})` : '';
    const credit = `<a class="hero-credit" href="${esc(j.sourcePageUrl || '#')}" target="_blank" rel="nofollow noopener">Photo: ${esc(j.author || 'Unknown')} / ${esc(j.source || '')}${lic}</a>`;
    const creditRe = /<a class="hero-credit"[\s\S]*?<\/a>/;
    if (creditRe.test(s)) s = s.replace(creditRe, () => credit);
    else s = s.replace('<div class="city-hero-overlay"></div>', () => '<div class="city-hero-overlay"></div>\n      ' + credit);
    fs.writeFileSync(page, s);

    // /cities card image in cities-data.js
    const cdPath = path.join(ROOT, 'cities-data.js');
    let cd = fs.readFileSync(cdPath, 'utf8');
    const idRe = new RegExp('(id:\\s*[\'"]' + slug + '[\'"][\\s\\S]{0,600}?image:\\s*[\'"])[^\'"]*([\'"])');
    if (idRe.test(cd)) {
      cd = cd.replace(idRe, (_, a, b) => a + '/images/cities/' + slug + '-card.webp' + b);
      fs.writeFileSync(cdPath, cd);
    } else {
      console.error('  (card image NOT updated in cities-data.js for ' + slug + ')');
    }

    attrib[slug] = { author: j.author, source: j.source, license: j.license, sourcePageUrl: j.sourcePageUrl, alt: j.alt, landmark: j.landmark };
    console.log('OK ' + slug + ' | ' + hInfo.width + 'x' + hInfo.height + ' | by ' + j.author + ' (' + j.source + (j.license ? ', ' + j.license : '') + ')');
    ok++;
  }
  fs.writeFileSync(ATTR, JSON.stringify(attrib, null, 2));
  console.log(`\nimages applied: ${ok} | flagged/skipped: ${skipped} | failed: ${fail}`);
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Adds verified, freely-licensed real establishment photos to venue cards.
 * Reads venue-images-<slug>.json (from the image agent) in argv[2]. For each found
 * entry it downloads the image, writes images/venues/<slug>-<venue>.webp (600w), and
 * inserts a flush <img class="venue-card-image"> + a small CC attribution credit into
 * the matching coworking/eat/stay card. Text-only cards are left untouched. Idempotent
 * (skips a card that already has a venue-card-image). Only CC/PD images should be in the
 * JSON (the agent is constrained to that); attribution is recorded + shown.
 * Usage: node scripts/apply_venue_images.cjs "<dir with venue-images-*.json>"
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const OUT = path.join(ROOT, 'images', 'venues');
const ATTR = path.join(OUT, 'attribution.json');
const UA = { headers: { 'User-Agent': 'TheNomadHQ/1.0 (venue images; hello@thenomadhq.com)' } };

const stripDash = (s) => String(s == null ? '' : s).replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ');
const esc = (s) => stripDash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (s) => String(s || '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().toLowerCase();
const vslug = (s) => String(s).toLowerCase().replace(/&amp;/g, ' and ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CARD = { coworking: 'cowork-card', eat: 'eat-card', stay: 'stay-card' };
const NAMECLASS = { coworking: 'cowork-card-name', eat: 'eat-card-name', stay: 'stay-card-name' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const attrib = fs.existsSync(ATTR) ? JSON.parse(fs.readFileSync(ATTR, 'utf8')) : {};
  for (const file of fs.readdirSync(DIR).filter((f) => /^venue-images-.+\.json$/.test(f))) {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, ''));
    const slug = data.slug;
    const page = path.join(ROOT, 'cities', slug + '.html');
    if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); continue; }
    let s = fs.readFileSync(page, 'utf8');
    let ok = 0, miss = 0, skip = 0;

    for (const v of (data.images || [])) {
      const cardClass = CARD[v.kind];
      if (!cardClass || !v.name || !(v.viewUrl || v.imageUrl)) { miss++; continue; }
      const vs = vslug(v.name);
      const webpRel = '/images/venues/' + slug + '-' + vs + '.webp';
      const webpAbs = path.join(OUT, slug + '-' + vs + '.webp');

      // locate the matching card (by normalized name within a card block of this kind)
      const blockRe = new RegExp('<article class="' + cardClass + '">[\\s\\S]*?</article>', 'g');
      let m, target = null;
      while ((m = blockRe.exec(s))) {
        const nm = (m[0].match(new RegExp('class="' + NAMECLASS[v.kind] + '">([^<]*)<')) || [])[1];
        if (nm && (norm(nm) === norm(v.name) || norm(nm).includes(norm(v.name)) || norm(v.name).includes(norm(nm)))) { target = m; break; }
      }
      if (!target) { console.error('  no card match:', slug, v.kind, v.name); miss++; continue; }
      if (/venue-card-image/.test(target[0])) { skip++; continue; }

      // download + convert (retry with backoff on 429/5xx; throttle to be polite to Wikimedia)
      try {
        let buf = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await fetch(v.viewUrl || v.imageUrl, UA);
          if (res.ok) { buf = Buffer.from(await res.arrayBuffer()); break; }
          if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
          throw new Error('HTTP ' + res.status);
        }
        if (!buf) throw new Error('HTTP 429 (gave up)');
        await sharp(buf).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(webpAbs);
        await new Promise((r) => setTimeout(r, 350));
      } catch (e) { console.error('  DL/convert fail:', slug, v.name, e.message); miss++; continue; }

      const alt = esc(v.alt || (v.name + ' in ' + (data.city || slug)));
      const cred = v.author ? esc(v.author) : 'Unknown';
      const lic = v.license ? ' (' + esc(v.license) + ')' : '';
      const href = esc(v.sourcePageUrl || '#');
      const img = `\n            <img class="venue-card-image" src="${webpRel}" alt="${alt}" loading="lazy" decoding="async" width="600" height="400">` +
                  `\n            <p class="venue-img-credit">Photo: <a href="${href}" target="_blank" rel="nofollow noopener">${cred}${lic}</a></p>`;

      // insert as first child of the article (flush top). For stay-card, still first child (before stay-card-body).
      const openTag = '<article class="' + cardClass + '">';
      const replaced = target[0].replace(openTag, openTag + img);
      s = s.replace(target[0], replaced);
      attrib[slug + '/' + vs] = { name: v.name, kind: v.kind, author: v.author, source: v.source, license: v.license, sourcePageUrl: v.sourcePageUrl, confirm: v.confirm };
      ok++;
    }
    // Mark the page as checked (even with 0 hits) so it is not re-attempted every sweep.
    if (!/venue-images-checked/.test(s)) s = s.replace(/<\/body>/i, '<!-- venue-images-checked -->\n</body>');
    fs.writeFileSync(page, s);
    console.log(`${slug}: images added ${ok} | missed ${miss} | skipped ${skip}`);
  }
  fs.writeFileSync(ATTR, JSON.stringify(attrib, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });

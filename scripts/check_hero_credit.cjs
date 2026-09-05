/**
 * HERO CREDIT GATE  (a page credits the photographer of the picture it is actually showing)
 *
 * check_photo_credit.cjs asks whether a credit EXISTS. That is not the same question, and the
 * difference is not academic: two pages were found publishing someone else's CC-licensed work
 * under the wrong photographer's name, and both passed that gate as clean.
 *
 *   kumasi   the hero was swapped and apply_city_image.cjs only inserted a credit when none was
 *            present, so the page kept the previous file's link, author and licence. It credited
 *            Maven Egote under CC BY-SA 4.0 while displaying Afus199620's photograph, CC0.
 *   kohtao   credited "Ko Nang Yuan Panorama.JPG" by Isderion, CC BY-SA 3.0 DE. The picture on the
 *            page was the John-Suwan viewpoint by kallerna, CC BY-SA 4.0. A different photograph
 *            of a different place by a different person.
 *
 * A missing credit is a hole. A wrong credit is a false statement about someone's work, and under
 * CC BY-SA it is also a licence breach. So this checks the claim against the source:
 *
 *   author    the name on the page must match the Artist field on the Commons file page
 *   licence   the licence on the page must match the file's licence
 *   identity  the credited file's aspect ratio must be close to the hero on disk. A hero is a crop
 *             of its original, so the ratio moves; it does not move by half. This is what caught
 *             kohtao, where a 4.55 panorama was credited for a 2.03 hero.
 *
 * KNOWN LIMIT, stated because a gate that overstates its reach is worse than none: the identity
 * test is a ratio comparison, not a pixel comparison. A credit pointing at the wrong file whose
 * aspect ratio happens to match the hero will pass. Closing that needs the source file downloaded
 * and compared, which is a different and much heavier job than a gate should do.
 *
 * Results are cached in data/.hero-credit-cache.json so a normal run costs no network calls; only
 * pages whose credit has changed since the last run are asked about again. --refresh ignores it.
 *
 * Usage: node scripts/check_hero_credit.cjs [--refresh] [--limit N]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const REFRESH = process.argv.includes('--refresh');
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : 0; })();
const CACHE = path.join(ROOT, 'data', '.hero-credit-cache.json');
const UA = 'TheNomadHQ/1.0 (hero credit gate; info@topblog.agency)';

const get = (url) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': UA } }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { r.resume(); return get(r.headers.location).then(res, rej); }
    let b = ''; r.on('data', (d) => { b += d; }); r.on('end', () => res(b));
  }).on('error', rej);
});

// Hero dimensions from the webp header, so no image library is needed.
function webpSize(file) {
  let b; try { b = fs.readFileSync(file); } catch (e) { return null; }
  if (b.slice(0, 4).toString() !== 'RIFF' || b.slice(8, 12).toString() !== 'WEBP') return null;
  const cc = b.slice(12, 16).toString();
  if (cc === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (cc === 'VP8L') { const p = b.readUInt32LE(21); return { w: 1 + (p & 0x3fff), h: 1 + ((p >> 14) & 0x3fff) }; }
  if (cc === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  return null;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// NFD strips combining accents but does nothing for a letter with a stroke through it, which is
// why "Jakub Halun" and Commons' "Jakub Hałun" compared as different people on the first run.
// Same fold splice_new_cities.cjs uses for slugs.
const fold = (s) => String(s).replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ø/g, 'o').replace(/Ø/g, 'O')
  .replace(/đ/g, 'd').replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/ß/g, 'ss')
  .replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ı/g, 'i')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Is this the same photographer, written differently?
 *
 * Commons' Artist field is free text and the site's credit is a cleaned-up rendering of it, so an
 * exact match is the wrong bar. A first pass demanding one flagged ten pages and every one was the
 * same person: "Arne Mueseler" against "Arne Müseler", "Giovanni Dall'Orto" against his username
 * "G.dallorto", "Fido (elfidomx)" against a flickr URL ending elfidomx, and Commons' own typo
 * "Jorgre Menjivar" which the site had quietly corrected. A gate that cries wolf ten times gets
 * switched off, so the bar is: do the two names share any substantial token?
 *
 * That still catches what actually went wrong. "Maven Egote" against "Afus199620" and "Isderion"
 * against "kallerna" share nothing at all, which is what a credit naming the wrong person looks
 * like. A page crediting "Unknown" where Commons names somebody also shares nothing, and should
 * be flagged: the name is available and the page is not using it.
 */
function sameName(pageName, commonsName) {
  const a = fold(pageName), b = fold(commonsName);
  if (!a || !b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const tokens = (s) => String(s).split(/[^\p{L}\p{N}]+/u).map(fold).filter((t) => t.length >= 4);
  const ta = tokens(pageName), tb = tokens(commonsName);
  return ta.some((t) => b.includes(t)) || tb.some((t) => a.includes(t));
}

const pages = fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html'));
const claims = [];
for (const f of (LIMIT ? pages.slice(0, LIMIT) : pages)) {
  const slug = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(ROOT, 'cities', f), 'utf8');
  const m = html.match(/<a class="hero-credit" href="([^"]*)"[^>]*>Photo: ([^<]*)<\/a>/);
  if (!m) continue;                                    // check_photo_credit owns "is there one"
  const fileM = m[1].match(/\/wiki\/(File:.+)$/);
  if (!fileM) continue;                                // not a Commons file, nothing to compare to
  const t = decode(m[2]);
  const lic = t.match(/\(([^)]*)\)\s*$/);
  claims.push({ slug, file: decodeURIComponent(fileM[1]).replace(/_/g, ' '), author: t.split(' / ')[0].trim(), license: lic ? lic[1] : '' });
}

let cache = {};
if (!REFRESH) { try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { cache = {}; } }

(async () => {
  const need = claims.filter((c) => !cache[c.file]);
  for (let i = 0; i < need.length; i += 50) {
    const batch = need.slice(i, i + 50);
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
      + '&iiprop=extmetadata%7Csize&titles=' + encodeURIComponent(batch.map((c) => c.file).join('|'));
    let j; try { j = JSON.parse(await get(url)); } catch (e) { console.error('  batch failed: ' + e.message); continue; }
    const norm = {};
    for (const n of (j.query && j.query.normalized) || []) norm[n.to] = n.from;
    for (const p of Object.values((j.query && j.query.pages) || {})) {
      const key = norm[p.title] || p.title;
      if (p.missing !== undefined) { cache[key] = { missing: true }; continue; }
      const ii = (p.imageinfo || [])[0]; if (!ii) continue;
      const em = ii.extmetadata || {};
      const strip = (v) => v ? String(v.value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
      cache[key] = { author: decode(strip(em.Artist)), license: decode(strip(em.LicenseShortName)), w: ii.width, h: ii.height };
    }
  }
  if (need.length) { try { fs.writeFileSync(CACHE, JSON.stringify(cache)); } catch (e) { /* cache is an optimisation */ } }

  const problems = [];
  for (const c of claims) {
    const m = cache[c.file];
    if (!m) continue;                                              // could not ask; not a failure
    if (m.missing) { problems.push([c.slug, 'the credited file no longer exists on Commons: ' + c.file]); continue; }
    if (m.author && c.author && !/own work/i.test(m.author) && !sameName(c.author, m.author)) {
      problems.push([c.slug, `credits "${c.author}", Commons says "${m.author}"`]); continue;
    }
    const s = webpSize(path.join(ROOT, 'images', 'cities', c.slug + '.webp'));
    if (s && s.w && s.h && m.w && m.h) {
      const a = m.w / m.h, b = s.w / s.h;
      if (Math.abs(a - b) / a > 0.4) {
        problems.push([c.slug, `credited file is ${m.w}x${m.h} (ratio ${a.toFixed(2)}) but the hero is ${s.w}x${s.h} (${b.toFixed(2)}): the credit points at a different photograph`]);
      }
    }
  }

  console.log('HERO CREDIT GATE  (a page credits the photographer of the picture it shows)\n');
  console.log(`  ${claims.length} city heroes credited to a Wikimedia Commons file`);
  console.log(`  ${need.length} checked against Commons this run, ${claims.length - need.length} from cache\n`);
  if (!problems.length) { console.log('  clean: every credit names the photographer Commons names.'); process.exit(0); }
  console.log(`  ${problems.length} wrong credit(s):\n`);
  for (const [slug, why] of problems) console.log(`    ${slug.padEnd(18)} ${why}`);
  console.log('\n  A wrong credit is a false statement about someone\'s work, not a cosmetic issue.');
  process.exit(1);
})();

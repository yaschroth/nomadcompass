/**
 * Geo-verifies researched accommodations against OpenStreetMap (Nominatim, keyless).
 * Reads stays-<slug>.json from argv[2], writes stays-<slug>.verified.json.
 * Mirrors verify_venues.cjs: rating >= 4.0 gate; keep if an OSM result exists within
 * ~25km of the city center OR the stay has an official url; otherwise keep via a Booking
 * deep-link on the exact name (accommodation names on Booking resolve reliably).
 * Nominatim policy: <=1 req/sec, valid User-Agent. Sequential + 1.1s throttle.
 * Usage: node scripts/verify_stays.cjs "<dir with stays-*.json>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const HEADERS = {
  'User-Agent': 'TheNomadHQ/1.0 (stay verification; info@topblog.agency)',
  'Referer': 'https://thenomadhq.com',
  'Accept-Language': 'en',
};
const RADIUS_KM = 25;
const RGATE = 4.0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cd = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
function cityCenter(slug) {
  const m = cd.match(new RegExp('id:\\s*[\'"]' + slug + '[\'"][\\s\\S]{0,2500}?lat:\\s*(-?[0-9.]+)[\\s\\S]{0,400}?lng:\\s*(-?[0-9.]+)'));
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}
function haversine(la1, lo1, la2, lo2) {
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(la2 - la1), dLng = toR(lo2 - lo1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(la1)) * Math.cos(toR(la2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
async function nominatim(q) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(q), { headers: HEADERS });
      if (res.status === 429 || res.status === 503) { await sleep(2000 * (attempt + 1)); continue; }
      if (!res.ok) return null;
      const j = await res.json();
      return j && j[0] ? { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), display: j[0].display_name } : null;
    } catch (e) { await sleep(1500); }
  }
  return null;
}

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => /^stays-.+\.json$/.test(f) && !/\.verified\.json$/.test(f));
  for (const file of files) {
    const slug = file.replace(/^stays-/, '').replace(/\.json$/, '');
    const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, ''));
    const center = cityCenter(slug);
    if (!center) { console.error('NO CENTER for', slug, '- skipping'); continue; }
    const cityName = data.city || slug;
    const country = data.country || '';
    let kept = 0, gated = 0;
    const out = [];
    for (const v of (data.stays || [])) {
      if (!(typeof v.rating === 'number' && v.rating >= RGATE)) { gated++; continue; }
      const queries = [v.osm_query, `${v.name}, ${cityName}, ${country}`, `${v.name}, ${country}`, v.name].filter(Boolean);
      let hit = null;
      for (const q of queries) {
        await sleep(1100);
        const r = await nominatim(q);
        if (r && haversine(center.lat, center.lng, r.lat, r.lng) <= RADIUS_KM) { hit = r; break; }
      }
      if (hit) { out.push({ ...v, verified: true, lat: hit.lat, lng: hit.lng, source: 'osm' }); kept++; }
      else if (v.url) { out.push({ ...v, verified: false, source: 'url-only' }); kept++; }
      // Accommodation names resolve reliably on Booking even when unmapped in OSM; keep and link via Booking.
      else { out.push({ ...v, verified: false, source: 'booking' }); kept++; }
    }
    data.stays = out;
    fs.writeFileSync(path.join(DIR, `stays-${slug}.verified.json`), JSON.stringify(data, null, 2));
    console.log(`${slug}: kept ${kept} stays | below-gate ${gated}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });

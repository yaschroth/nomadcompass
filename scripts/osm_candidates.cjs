/**
 * Finds candidate providers in OpenStreetMap, for `discover_providers.cjs verify` to prove or drop.
 *
 * WHY THIS EXISTS
 *
 * The Google Maps actor is the paid step of discovery, and on 2026-09-21 the Apify account had hit
 * its monthly hard limit: the pipeline could not find a single new business. OpenStreetMap already
 * holds most of the vets, hairdressers, opticians, gyms, garages, estate agents and accountants in
 * our cities, many with their website tagged, and the Overpass API serves them for nothing under
 * an open licence.
 *
 * WHAT OSM IS TRUSTED FOR, AND WHAT IT IS NOT
 *
 * Exactly what Maps is trusted for: that a business of this kind exists here and that this is its
 * website. Never the language. A candidate becomes a row only if its own site says in its own words
 * which languages it works in, which `verify` decides and quotes. So no OSM tag ever reaches a card:
 * not `language:en=yes`, not the address. The address stays out on purpose, because the row's
 * authority is the business's site, and an address copied from the map would be the one field on
 * the card that the business never said.
 *
 * MEASURED, AND IT IS THE REASON NOT TO RUN THIS AT SCALE. The pilot on 2026-09-22 read 354 OSM
 * candidates in Lisbon and Istanbul (dentists, estate agents, gyms, opticians, garages, salons) and
 * found 0 language claims. The fetches worked: 18 of a 24-site sample loaded, most are published in
 * Portuguese only, and the three that mention English do so in a language switcher, which is rightly
 * not a claim. OSM cannot be asked who courts foreigners, and a business that does not court them
 * has no reason to say what it speaks. Maps's "English speaking ..." queries select for exactly the
 * businesses that do, which is where their 12% comes from. Use this only where a category has no
 * other route and a few rows matter more than the time, and expect close to nothing.
 *
 * Usage:
 *   node scripts/osm_candidates.cjs --city lisbon[,porto] [--cats vet,hair] [--radius 12] [--cap 150]
 *     [--out data/proposals/osm-candidates-lisbon.json]
 *   then: node scripts/discover_providers.cjs verify <that file> --out <proposals file> --from openstreetmap
 */
const fs = require('fs');
const path = require('path');
const { cities } = require('./discover_providers.cjs');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
// The main server first and twice: on 2026-09-21 the mirrors timed out or answered 504 while it,
// asked again, answered.
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'thenomadhq-directory/1.0 (+https://thenomadhq.com)';

/**
 * Our categories in OSM's words. Each entry is a set of tag filters, any of which places a feature
 * in the category. Order matters when one feature matches two: the first category wins, which is
 * why the narrow health tags come before anything broad.
 */
const CATS = {
  dentist: [['amenity', 'dentist'], ['healthcare', 'dentist']],
  therapy: [['healthcare', '^(psychotherapist|counselling|psychologist)$']],
  physio: [['healthcare', '^(physiotherapist|chiropractor|osteopath)$'],
    ['healthcare:speciality', '(chiropractic|osteopathy|physiotherapy)']],
  vet: [['amenity', 'veterinary']],
  optician: [['shop', 'optician'], ['craft', 'optician'], ['healthcare', 'optometrist']],
  pharmacy: [['amenity', 'pharmacy'], ['healthcare', 'pharmacy']],
  hair: [['shop', '^(hairdresser|barber)$']],
  mechanic: [['shop', '^(car_repair|motorcycle_repair)$']],
  fitness: [['leisure', 'fitness_centre']],
  realestate: [['office', 'estate_agent'], ['shop', 'estate_agent']],
  tax: [['office', '^(accountant|tax_advisor)$']],
};

function query(lat, lng, radiusM, cats) {
  const parts = [];
  cats.forEach((c) => CATS[c].forEach(([k, v]) => {
    const cond = v.startsWith('^') || v.startsWith('(') ? `["${k}"~"${v}"]` : `["${k}"="${v}"]`;
    // Only features with a website: without one there is no page on which a claim could stand.
    parts.push(`nwr(around:${radiusM},${lat},${lng})${cond}[~"^(website|contact:website|url)$"~"^https?://"];`);
  }));
  return `[out:json][timeout:90];(${parts.join('')});out tags;`;
}

function categoryOf(tags, cats) {
  for (const c of cats) {
    for (const [k, v] of CATS[c]) {
      const t = tags[k];
      if (!t) continue;
      if (v.startsWith('^') || v.startsWith('(') ? new RegExp(v).test(t) : t === v) return c;
    }
  }
  return '';
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };

async function overpass(q) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ep = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      // eslint-disable-next-line no-await-in-loop
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(200000),
      });
      if (r.ok) return (await r.json()).elements || [];
      // 429 and 504 are Overpass saying "busy", not "no": wait and ask again, politely.
      console.error(`  overpass ${r.status} from ${new URL(ep).host}, retrying`);
    } catch (e) { console.error(`  overpass ${e.name} from ${new URL(ep).host}, retrying`); }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 15000 * (attempt + 1)));
  }
  throw new Error('Overpass did not answer after six attempts');
}

// A name or tag that courts foreigners is read first when a category has more sites than the cap.
const FOREIGN = /\b(international|expat|english|foreign|global|multilingual|british|american)\b/i;

(async () => {
  const CITY = cities();
  const slugs = val('--city', '').split(',').filter(Boolean);
  const cats = val('--cats', Object.keys(CATS).join(',')).split(',').filter(Boolean);
  const radiusM = Math.round(parseFloat(val('--radius', '12')) * 1000);
  const cap = parseInt(val('--cap', '150'), 10);
  if (!slugs.length) { console.error('need --city <slug[,slug]>'); process.exit(2); }
  cats.forEach((c) => { if (!CATS[c]) { console.error(`unknown category: ${c}`); process.exit(2); } });

  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8')).providers;
  const out = [];
  for (const slug of slugs) {
    const c = CITY.get(slug);
    if (!c || typeof c.lat !== 'number') { console.error(`unknown city or no coordinates: ${slug}`); process.exit(2); }
    const listed = new Set(db.filter((p) => p.city === slug).map((p) => hostOf(p.url || '')).filter(Boolean));
    // One query per category. All ten at once over a 12 km radius made Overpass answer 504 six times
    // running; one category at a time, it answers.
    const els = [];
    for (const cat of cats) {
      // A category Overpass will not answer is skipped and said so, rather than taking the whole
      // run with it: six refusals on one category used to discard every city already fetched.
      try {
        // eslint-disable-next-line no-await-in-loop
        els.push(...await overpass(query(c.lat, c.lng, radiusM, [cat])));
      } catch (e) { console.error(`  ${slug} ${cat}: skipped, ${e.message}`); }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 1500));
    }
    const byCat = {};
    const seen = new Set();
    for (const e of els) {
      const t = e.tags || {};
      const url = (t.website || t['contact:website'] || t.url || '').split(';')[0].trim();
      const name = (t.name || t['name:en'] || '').trim();
      const cat = categoryOf(t, cats);
      const host = hostOf(url);
      if (!name || !host || !cat || listed.has(host) || seen.has(host)) continue;
      seen.add(host);
      (byCat[cat] = byCat[cat] || []).push({
        name, url, city: slug, category: cat, foundVia: `openstreetmap ${e.type}/${e.id}`,
        _foreign: FOREIGN.test(`${name} ${t.description || ''}`) || Object.keys(t).some((k) => /^language:/.test(k)),
      });
    }
    const counts = [];
    for (const cat of cats) {
      const list = (byCat[cat] || []).sort((a, b) => Number(b._foreign) - Number(a._foreign)).slice(0, cap);
      list.forEach((x) => { delete x._foreign; out.push(x); });
      counts.push(`${cat} ${list.length}${(byCat[cat] || []).length > cap ? `/${byCat[cat].length}` : ''}`);
    }
    console.log(`${slug}: ${counts.join(', ')}`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 3000));
  }
  const file = path.resolve(val('--out', path.join(ROOT, 'data', 'proposals', `osm-candidates-${slugs.join('-')}.json`)));
  fs.writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`${out.length} candidates written to ${path.relative(ROOT, file)}`);
  console.log(`then: node scripts/discover_providers.cjs verify ${path.relative(ROOT, file)} --out <proposals> --from openstreetmap`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });

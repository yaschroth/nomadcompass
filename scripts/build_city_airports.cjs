require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Maps every city to the airport a traveller would actually fly into, from OurAirports.
 *
 * Nothing on the site knew what airport serves a city. The route planner drew flight legs as
 * great-circle lines between city centroids, which is why it could show a distance and a CO2 figure
 * but never a route, a price or even a working search link: it had no IATA codes to search with.
 * Every one of the 737 flight links on the site is the same generic affiliate URL.
 *
 * Source: OurAirports (ourairports.com), public domain, the airports.csv they publish. Primary for
 * airport location, IATA code and whether the airport has scheduled service.
 *
 * The selection rule, which is the part worth arguing about:
 *   - only airports with an IATA code AND scheduled_service = yes. An airfield without scheduled
 *     service is not somewhere you can fly to, whatever its coordinates say. Scheduled service is
 *     the signal that matters, NOT the size class: the first version of this ranked by class and
 *     excluded small_airport, which sent El Nido to Puerto Princesa 174km away when El Nido has its
 *     own airport with scheduled flights 4km outside town, and Vilcabamba to Guayaquil at 245km
 *     when Catamayo is 34km up the road. Both of those are classed small.
 *   - a hub slightly further out still usually beats a nearer regional strip, because that is where
 *     the routes and the competition are. So distance is discounted by class rather than filtered
 *     by it: 60km off a large airport, 25km off a medium one. A large hub 130km away therefore
 *     beats a small field at 80km, and El Nido's own airport still beats everything.
 *   - distance is straight-line from the city coordinate, so a city on the far side of a bay may
 *     be further by road than the number suggests.
 *
 * Cities with nothing in range are recorded as unserved rather than pointed at a guess. Being
 * honest that Gorkha has no airport is more useful than sending someone to one 400km away as if it
 * were the obvious choice.
 *
 * Usage: node scripts/build_city_airports.cjs <airports.csv> [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const csvPath = process.argv[2];
if (!csvPath || csvPath.startsWith('--')) {
  console.error('usage: node scripts/build_city_airports.cjs <airports.csv> [--apply]');
  console.error('  get it from https://davidmegginson.github.io/ourairports-data/airports.csv');
  process.exit(2);
}

/** Minimal CSV reader for the OurAirports shape: quoted fields, embedded commas, no embedded newlines. */
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; } else if (ch === '"') { q = false; } else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    rows.push(out);
  }
  return rows;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const head = rows.shift();
const col = {};
head.forEach((h, i) => { col[h] = i; });

const airports = [];
for (const r of rows) {
  const iata = (r[col.iata_code] || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata)) continue;
  if ((r[col.scheduled_service] || '') !== 'yes') continue;
  const type = r[col.type];
  if (type !== 'large_airport' && type !== 'medium_airport' && type !== 'small_airport') continue;
  const lat = Number(r[col.latitude_deg]);
  const lng = Number(r[col.longitude_deg]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  airports.push({
    iata, type, lat, lng,
    name: r[col.name],
    city: r[col.municipality] || '',
    country: r[col.iso_country],
  });
}
console.log(airports.length + ' airports with an IATA code and scheduled service');

const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const arr = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
let depth = 0;
let end = -1;
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === '[') depth += 1;
  else if (arr[i] === ']') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITIES = eval(arr.slice(0, end));

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
function km(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Class discounts the distance rather than filtering by it. A hub is worth travelling further for,
// but not so much further that a town with its own scheduled airport gets sent past it.
const BONUS = { large_airport: 60, medium_airport: 25, small_airport: 0 };
const MAX_KM = 250;

/**
 * Nearest-airport is wrong for a big city, and wrong in a consistent direction: the close-in field
 * is usually the domestic one. Left alone this picked LaGuardia for New York, Orly for Paris, Linate
 * for Milan, Ciampino for Rome, Congonhas for Sao Paulo, Gimpo for Seoul, Itami for Osaka,
 * Aeroparque for Buenos Aires and Midway for Chicago. Every one of those is the airport you would
 * NOT search for an international flight.
 *
 * IATA publishes metropolitan area codes for exactly this, and the flight APIs accept them, so a
 * search on NYC covers JFK, Newark and LaGuardia at once. Where a city has no metro code but the
 * nearest-airport rule still lands on the wrong field, the international gateway is named instead.
 *
 * Hand-maintained and short on purpose: only cities where the automatic answer is actually wrong.
 */
const METRO = {
  newyork: 'NYC', london: 'LON', paris: 'PAR', tokyo: 'TYO', osaka: 'OSA', milan: 'MIL',
  rome: 'ROM', buenosaires: 'BUE', saopaulo: 'SAO', washingtondc: 'WAS', chicago: 'CHI',
  beijing: 'BJS', seoul: 'SEL', stockholm: 'STO', toronto: 'YTO', montreal: 'YMQ', jakarta: 'JKT',
  // no metro code, but the nearest airport is the wrong one to search
  bangkok: 'BKK',      // Suvarnabhumi, the international gateway; nearest is Don Mueang
  istanbul: 'IST',     // nearest is Sabiha Gokcen on the Asian side
  shanghai: 'PVG',     // nearest is Hongqiao, which is mostly domestic
};

/**
 * The distance discount has no idea where the water and the hard borders are, so it can pick an
 * airport that is close in a straight line and unreachable in practice. Anguilla was being sent to
 * Sint Maarten, 20km away across open sea, when Anguilla's own international airport is 1.4km from
 * the town centre: SXM is classed large and the 60km bonus beat AXA's 25km one.
 *
 * There is no general rule available here. "Prefer the airport in the city's own country" would
 * break Basel, whose airport is in France, Malmo, which flies from Copenhagen, and Freiburg and
 * Chamonix, which do the same. So this is the same shape as METRO above: hand-maintained, short,
 * and only where the automatic answer would strand somebody. Each entry names why.
 *
 * Cases NOT listed, because the cross-border answer is right or genuinely arguable: Basel (BSL is
 * Basel's own airport, in France), Malmo (CPH over the bridge), Freiburg, Chamonix and Annecy
 * (Geneva), Saranda and Ksamil (the Corfu ferry is the normal route), Andorra, Monaco, Vaduz and
 * San Marino (no airport in the country at all).
 */
const HOME_AIRPORT = {
  thevalley: 'AXA',     // SXM is on another island across open sea; AXA is 1.4km from town
  kas: 'DLM',           // KZS is Kastellorizo, a Greek island 9km offshore, two flights a week
  kampot: 'KOS',        // PQC is Phu Quoc, an island in Vietnam, with no land route
  kep: 'KOS',           // same
  victoriafalls: 'VFA', // the town's own airport; LVI is Livingstone, over the Zambian border
  eilat: 'ETM',         // Ramon was built to serve Eilat; AQJ is Aqaba, across the Jordanian border
  musanze: 'KGL',       // GOM is Goma in DR Congo, across a border nobody flies into for Rwanda
  stepantsminda: 'TBS', // OGZ is Vladikavkaz, over the Russian border at Larsi
};

const out = {};
const unserved = [];
const overrideMisses = [];
for (const c of CITIES) {
  let best = null;
  const want = HOME_AIRPORT[c.id];
  for (const a of airports) {
    const d = km(c.lat, c.lng, a.lat, a.lng);
    if (want) { if (a.iata === want) best = { a, d, eff: d }; continue; }
    if (d > MAX_KM) continue;
    const eff = d - BONUS[a.type];
    if (!best || eff < best.eff) best = { a, d, eff };
  }
  // An override naming an airport that has dropped out of OurAirports, or lost its scheduled
  // service, must be loud rather than silently falling back to the answer it was there to replace.
  if (want && !best) overrideMisses.push(c.id + ' -> ' + want);
  if (!best) { unserved.push(c.id); continue; }
  const rec = {
    iata: best.a.iata,
    name: best.a.name,
    km: Math.round(best.d),
    type: best.a.type.replace('_airport', ''),
  };
  if (METRO[c.id]) {
    rec.searchCode = METRO[c.id];
    rec.nearest = best.a.iata;
  }
  out[c.id] = rec;
}

const served = Object.keys(out).length;
console.log(served + ' of ' + CITIES.length + ' cities mapped to an airport, ' + unserved.length + ' unserved');
console.log(Object.keys(HOME_AIRPORT).length + ' hand-set, where the nearest airport is across water or a hard border');
if (overrideMisses.length) {
  console.error('\n  OVERRIDE NOT FOUND (no IATA match with scheduled service): ' + overrideMisses.join(', '));
  process.exitCode = 1;
}
const far = Object.entries(out).filter(([, a]) => a.km > 120).sort((a, b) => b[1].km - a[1].km);
console.log(far.length + ' are more than 120km from their airport');
far.slice(0, 8).forEach(([id, a]) => console.log('    ' + id.padEnd(20) + a.iata + '  ' + a.km + 'km  ' + a.name));
console.log('\n  shared airports (several cities, one airport):');
const byIata = {};
Object.entries(out).forEach(([id, a]) => { (byIata[a.iata] = byIata[a.iata] || []).push(id); });
Object.entries(byIata).filter(([, v]) => v.length > 2).sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5).forEach(([i, v]) => console.log('    ' + i + '  ' + v.join(', ')));
if (unserved.length) console.log('\n  unserved: ' + unserved.slice(0, 12).join(', ') + (unserved.length > 12 ? ' +' + (unserved.length - 12) : ''));

const payload = {
  _source: {
    source: 'OurAirports (ourairports.com) airports.csv',
    sourceUrl: 'https://ourairports.com/data/',
    licence: 'Public domain',
    method: 'Nearest airport with an IATA code and scheduled service, '
      + 'discounting the straight-line distance by 60km for a large hub and 25km for a medium one, '
      + 'capped at 250km. Straight-line from the city coordinate, so '
      + 'road distance can be longer. Cities with nothing in range are omitted rather than guessed at. '
      + 'Twenty large cities carry a searchCode, the IATA metropolitan area code, because the nearest '
      + 'airport there is the domestic one: searching NYC covers JFK, Newark and LaGuardia together.',
    coverage: served + ' of ' + CITIES.length + ' cities',
  },
  airports: out,
};

const dest = path.join(ROOT, 'data', 'city-airports.json');
if (APPLY) {
  fs.writeFileSync(dest, JSON.stringify(payload, null, 1) + '\n');
  console.log('\nwritten to data/city-airports.json');
} else {
  console.log('\nDry run. Re-run with --apply to write.');
}

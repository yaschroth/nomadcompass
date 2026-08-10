/**
 * Generates assets/city-tz.js = { <id>: "IANA/Zone" } for every city, so the tools can compute
 * DST-aware UTC offsets in the browser via Intl (instead of the fixed cities-data.js `timezone`).
 * IANA is derived from lat/lng with tz-lookup (devDependency); cities without coordinates and a
 * couple of border cities where tz-lookup returns the neighbouring country's zone are overridden
 * by hand below. Usage: node scripts/build_city_tz.cjs   (needs: npm i -D tz-lookup)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const tzlookup = require('tz-lookup');
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);

// cities with no lat/lng in the dataset
const FALLBACK = { kochi: 'Asia/Kolkata', pune: 'Asia/Kolkata', jaipur: 'Asia/Kolkata', weligama: 'Asia/Colombo', adelaide: 'Australia/Adelaide' };
// tz-lookup returns the neighbouring country's zone for these border towns; force the correct one
// Border cases where tz-lookup's boundary data puts the point in the neighbouring country.
// Stepantsminda (Kazbegi) sits about 10km from the Russian border and resolved to
// Europe/Moscow; it is in Georgia, which is Asia/Tbilisi. Same offset today, wrong country.
const OVERRIDE = { sarande: 'Europe/Tirane', eilat: 'Asia/Jerusalem', stepantsminda: 'Asia/Tbilisi' };

const out = {};
let missing = [];
for (const c of m.exports) {
  if (!c || !c.id) continue;
  let z = OVERRIDE[c.id];
  if (!z && typeof c.lat === 'number' && typeof c.lng === 'number') { try { z = tzlookup(c.lat, c.lng); } catch (e) { /* ignore */ } }
  if (!z) z = FALLBACK[c.id];
  if (!z) { missing.push(c.id); continue; }
  out[c.id] = z;
}
const js = 'const CITY_TZ = ' + JSON.stringify(out) + ';\n' +
  "if (typeof module !== 'undefined' && module.exports) { module.exports = CITY_TZ; }\n";
fs.writeFileSync(path.join(ROOT, 'assets', 'city-tz.js'), js);
console.log(`Wrote assets/city-tz.js with ${Object.keys(out).length} zones${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}.`);

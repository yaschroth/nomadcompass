/**
 * Emits assets/city-search-index.js: a compact [name, slug] list of all cities,
 * loaded by the header search box so a query resolves straight to /cities/<slug>.
 * slug === the city id === the city page filename (verified 1:1).
 * Usage: node scripts/gen_city_search_index.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const rows = m.exports
  .filter((c) => c && c.id && c.name)
  .map((c) => [String(c.name), String(c.id)])
  .sort((a, b) => a[0].localeCompare(b[0]));
const out = 'window.NOMAD_CITIES=' + JSON.stringify(rows) + ';';
fs.writeFileSync(path.join(ROOT, 'assets', 'city-search-index.js'), out);
console.log(`Wrote assets/city-search-index.js with ${rows.length} cities (${Math.round(out.length / 1024)} KB)`);

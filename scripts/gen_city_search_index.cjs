/**
 * Emits assets/city-search-index.js: a compact [name, slug, country] list of all cities,
 * loaded by the search boxes so a query resolves straight to /cities/<slug>.
 * slug === the city id === the city page filename (verified 1:1).
 *
 * The country is the third field, added for the branded suggestion dropdown: a bare list of
 * names cannot tell San Jose from San Jose. Appending rather than reshaping keeps every existing
 * reader working, they all index [0] and [1].
 * Usage: node scripts/gen_city_search_index.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const rows = m.exports
  .filter((c) => c && c.id && c.name)
  .map((c) => [String(c.name), String(c.id), String(c.country || '')])
  .sort((a, b) => a[0].localeCompare(b[0]));
const out = 'window.NOMAD_CITIES=' + JSON.stringify(rows) + ';';
fs.writeFileSync(path.join(ROOT, 'assets', 'city-search-index.js'), out);
console.log(`Wrote assets/city-search-index.js with ${rows.length} cities (${Math.round(out.length / 1024)} KB)`);

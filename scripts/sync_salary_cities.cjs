require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * salary.html has no generator (it was hand-built), but it BAKES the same compact city array as
 * geoarbitrage: [id, name, country, iso, region, nomadScore, costPerMonth]. This rewrites that one
 * `var CITIES=[...]` line from cities-data.js + city-regions.js so new cities show up in the
 * salary calculator, leaving every applied sweep (analytics, nav, schema, footer) untouched.
 * Usage: node scripts/sync_salary_cities.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const rm = {};
new Function('module', 'window', fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8') + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };

const DATA = m.exports
  .filter((c) => c && c.id && typeof c.costPerMonth === 'number' && c.costPerMonth > 0)
  .map((c) => [c.id, c.name, c.country, iso(c.flag), REGION[c.id] || '', nomadScore(c), c.costPerMonth]);

const abs = path.join(ROOT, 'salary.html');
const src = fs.readFileSync(abs, 'utf8');
const re = /var CITIES=\[.*?\];/s;
if (!re.test(src)) { console.error('salary.html: no `var CITIES=[...]` array found; aborting.'); process.exit(1); }
fs.writeFileSync(abs, src.replace(re, 'var CITIES=' + JSON.stringify(DATA) + ';'));
console.log(`salary.html: city array synced (${DATA.length} cities with cost).`);

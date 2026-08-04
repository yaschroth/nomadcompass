/**
 * Propagates the reconciled cities-data.js `costPerMonth` into the pages that BAKE a per-city cost
 * (they don't live-load cities-data.js). Surgical number-only replacements keyed by city id, so all
 * the applied sweeps (analytics, consent, schema, nav-search, footer, toc) are preserved.
 *   - geoarbitrage.html / salary.html : cost is element #6 after the id in each `[...]` row
 *   - route.html                      : same position #6 (followed by score + timezone)
 *   - cities.html                     : data-cost="N" attribute on each card
 *   - map.html                        : data-cost="$N/mo" on each marker anchor
 * index/compare/wheel live-load cities-data.js (auto-updated); timezones/best-weather bake no cost.
 * Usage: node scripts/apply_cost_propagation.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const CPM = new Map(CITIES.map((c) => [c.id, c.costPerMonth]));
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const esc = (id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let report = [];
function patch(file, kind) {
  const abs = path.join(ROOT, file);
  let s = fs.readFileSync(abs, 'utf8');
  let n = 0;
  for (const [id, cpm] of CPM) {
    if (cpm == null) continue;
    let re, rep;
    if (kind === 'array') { // ["id",...5 fields...,COST  (cost = 6th element after id)
      re = new RegExp('(\\["' + esc(id) + '"(?:,[^,\\]]*){5},)(\\d+)');
      rep = '$1' + cpm;
    } else if (kind === 'data-cost-int') { // data-slug="id" ... data-cost="N"
      re = new RegExp('(data-slug="' + esc(id) + '"[^>]*?data-cost=")(\\d+)(")');
      rep = '$1' + cpm + '$3';
    } else if (kind === 'data-cost-money') { // href="/cities/id" ... data-cost="$N/mo"
      re = new RegExp('(href="/cities/' + esc(id) + '"[^>]*?data-cost=")\\$[\\d,]+/mo(")');
      rep = '$1$$' + commas(cpm) + '/mo$2';
    }
    const before = s;
    s = s.replace(re, rep);
    if (s !== before) n++;
  }
  fs.writeFileSync(abs, s);
  report.push(`${file}: ${n} updated`);
}

patch('geoarbitrage.html', 'array');
patch('salary.html', 'array');
patch('route.html', 'array');
patch('cities.html', 'data-cost-int');
patch('map.html', 'data-cost-money');
console.log(report.join('\n'));

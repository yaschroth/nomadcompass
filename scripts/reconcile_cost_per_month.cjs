/**
 * Reconciles cities-data.js `costPerMonth` with the real Numbeo cost data. For every city that has
 * a real cost record, sets costPerMonth = the "Solo nomad" monthly budget (1-bed centre rent +
 * one-person basket) in USD, rounded to the nearest $10 -- exactly how the first 100 were set, so
 * the whole dataset stays consistent. Cities without real data keep their editorial estimate.
 * Updates the number in place per city object (matches `id: "slug"` then its `costPerMonth: N`).
 * Usage: node scripts/reconcile_cost_per_month.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const COSTS = require(path.join(ROOT, 'data', 'numbeo-costs.json'));
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json'));

const solo = (v) => {
  const rate = FX.rates[v.cur];
  if (!rate || v.rent1c == null || v.singleNoRent == null) return null;
  return Math.round((v.rent1c + v.singleNoRent) / rate / 10) * 10;
};

const file = path.join(ROOT, 'cities-data.js');
let src = fs.readFileSync(file, 'utf8');
let changed = 0; const diffs = [];
for (const [id, v] of Object.entries(COSTS)) {
  if (id === '_meta') continue;
  const target = solo(v);
  if (target == null) continue;
  const re = new RegExp('(id:\\s*"' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[\\s\\S]{0,600}?costPerMonth:\\s*)(\\d+)');
  const m = src.match(re);
  if (!m) { continue; }
  const cur = parseInt(m[2], 10);
  if (cur !== target) { diffs.push(`${id}: ${cur} -> ${target}`); src = src.replace(re, `$1${target}`); changed++; }
}
console.log('costPerMonth updated:', changed);
console.log(diffs.slice(0, 25).join('\n'));
if (!DRY) { fs.writeFileSync(file, src); console.log('wrote cities-data.js'); }

/**
 * Sitewide city-page sweep: inserts a "money & visa" callout into each city page's
 * explore block, just before the "Browse all city guides" row. The callout gives a
 * real, data-driven cost-context line (how the city's cost of living ranks among all
 * cities we track) plus contextual links to the Salary, Geoarbitrage and Nomad Visa
 * tools (the salary link is pre-filled with the city). Idempotent (skips pages that
 * already carry <!-- money-cta -->), CRLF-aware. Run this LAST, after page generation.
 * Usage: node scripts/apply_money_cta.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = new Map(CITIES.map((c) => [c.id, c]));
const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
// Absolute nomad-budget bands (USD/mo). Matches how nomads actually think about a base,
// rather than a percentile against a dataset that skews to hundreds of tiny cheap towns.
function band(cost) {
  if (cost <= 1000) return 'one of the more affordable bases for nomads';
  if (cost <= 1800) return 'a mid-range budget by nomad standards';
  if (cost <= 3000) return 'on the pricier side for a nomad base';
  return 'one of the more expensive bases we track';
}
const ANCHOR = '<p class="city-explore-links"><a href="/cities">Browse all city guides</a>';
const RE = /[ \t]*<!-- money-cta -->[\s\S]*?<!-- \/money-cta -->\r?\n/;

const dir = path.join(ROOT, 'cities');
let done = 0, updated = 0, noAnchor = [], noData = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const id = f.replace(/\.html$/, '');
  const c = byId.get(id);
  if (!c || typeof c.costPerMonth !== 'number') { noData.push(id); continue; }
  const abs = path.join(dir, f);
  let s = fs.readFileSync(abs, 'utf8');
  const had = RE.test(s);
  if (had) s = s.replace(RE, ''); // strip old block so the sweep is re-runnable
  if (!s.includes(ANCHOR)) { noAnchor.push(id); continue; }

  const ctx = `A comfortable solo budget in ${c.name} is about <b>${money(c.costPerMonth)}/mo</b>, ${band(c.costPerMonth)}.`;
  const block =
    `<!-- money-cta -->\n` +
    `          <div class="city-money-cta">\n` +
    `            <p class="city-money-line">${ctx}</p>\n` +
    `            <p class="city-explore-links"><strong>Plan your move:</strong> ` +
    `<a href="/salary?city=${id}">What you need to earn in ${c.name}</a> &middot; ` +
    `<a href="/geoarbitrage">How far your salary goes</a> &middot; ` +
    `<a href="/nomad-visas">Which nomad visas fit</a></p>\n` +
    `          </div>\n` +
    `          <!-- /money-cta -->\n` +
    `          ${ANCHOR}`;

  s = s.replace(ANCHOR, block);
  fs.writeFileSync(abs, s);
  had ? updated++ : done++;
}
console.log(`money-cta added: ${done}, updated: ${updated}, no-anchor: ${noAnchor.length}, no-cost-data: ${noData.length}`);
if (noAnchor.length) console.log('  no-anchor:', noAnchor.slice(0, 10).join(', '));
if (noData.length) console.log('  no-cost-data:', noData.slice(0, 10).join(', '));

/**
 * Gate: no city page shows a cost figure without saying where it came from.
 *
 * The headline monthly cost is the most load-bearing number on the site. It is in the page title,
 * the meta description, the facts panel, the money CTA, /compare, /cities, the wheel, the map, the
 * rankings and every share card. 330 of the 710 cities derive it from a Numbeo basket; the other
 * 380 are our own estimate, and until 2026-08-29 nothing on the page distinguished them, which
 * data/provenance.json had recorded as a known limit rather than fixed.
 *
 * A page satisfies this by one of two routes, and which one is not a choice:
 *
 *   sourced    The city is in data/numbeo-costs.json, and apply_city_costs.cjs has written its
 *              block naming Numbeo and the date the data carries.
 *   estimated  The city is not, and apply_cost_basis.cjs has written the note saying so.
 *
 * The two are mutually exclusive on purpose. A page carrying both would tell a reader the figure
 * is a guess directly above a table sourcing it, and a page carrying neither is the state this
 * gate exists to prevent returning.
 *
 * Usage: node scripts/check_cost_basis.cjs [--all]
 * Exit 1 if any city page states no basis, or states both.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');

const COSTS = require(path.join(ROOT, 'data', 'numbeo-costs.json'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const sourced = new Set(Object.keys(COSTS).filter((k) => !k.startsWith('_')));

const errors = [];
let bySurvey = 0;
let byNote = 0;
let noFigure = 0;

for (const c of CITIES) {
  const abs = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(abs)) continue;
  const html = fs.readFileSync(abs, 'utf8');

  if (c.costPerMonth == null) { noFigure++; continue; }

  const hasBlock = html.includes('<!-- cost-start -->');
  const hasNote = html.includes('<!-- cost-basis -->');
  const shouldBeSourced = sourced.has(c.id);

  if (hasBlock && hasNote) {
    errors.push(c.id + ': claims both a Numbeo block and an estimate note');
    continue;
  }
  if (shouldBeSourced && !hasBlock) {
    errors.push(c.id + ': has Numbeo data but the page shows no sourced cost block');
    continue;
  }
  if (!shouldBeSourced && !hasNote) {
    errors.push(c.id + ': $' + c.costPerMonth + '/mo with no statement of where the figure came from');
    continue;
  }
  // A note that names a figure the data no longer holds is worse than no note.
  if (hasNote) {
    const want = '$' + String(c.costPerMonth).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const m = html.match(/<div class="cost-basis">[\s\S]*?<\/div>/);
    if (m && !m[0].includes(want + ' a month')) {
      errors.push(c.id + ': the basis note names a different figure than cities-data.js (' + want + ')');
      continue;
    }
    byNote++;
  } else bySurvey++;
}

console.log('COST BASIS GATE  (the headline figure always says whether it was measured or estimated)\n');
console.log('  ' + bySurvey + ' cities state a Numbeo-sourced figure');
console.log('  ' + byNote + ' cities state the figure is our estimate');
if (noFigure) console.log('  ' + noFigure + ' cities carry no cost figure at all');
console.log('');

if (errors.length) {
  console.log('  ERRORS (' + errors.length + '):');
  errors.slice(0, SHOW_ALL ? errors.length : 20).forEach((e) => console.log('    ' + e));
  if (!SHOW_ALL && errors.length > 20) console.log('    ... and ' + (errors.length - 20) + ' more (--all)');
  process.exit(1);
}
console.log('  clean: every city page says where its cost figure came from.');

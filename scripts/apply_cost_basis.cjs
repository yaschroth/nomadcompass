require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Says, on the page, where each city's headline cost figure came from.
 *
 * data/provenance.json has stated the problem against cost-per-month for months:
 *
 *   "knownLimits": "The 379 estimated figures are indistinguishable from the sourced ones on the
 *                   page."
 *
 * That is exactly right and it is the site's largest remaining credibility gap. 330 of the 710
 * cities carry a figure built from a Numbeo basket. The other 380 carry an editorial estimate. A
 * reader looking at "$1,150 a month" on Oaxaca and "$2,140 a month" on Porto had no way to tell
 * that one is derived from a published survey and the other is our judgement, and the cost figure
 * is now the first thing in the page title and the meta description, which makes the silence worse
 * rather than better.
 *
 * How the two are actually produced, which is what this note has to describe honestly:
 *
 *   sourced    reconcile_cost_per_month.cjs sets costPerMonth = (Numbeo one-bedroom city-centre
 *              rent + Numbeo one-person monthly costs excluding rent), converted to USD and
 *              rounded to $10. apply_city_costs.cjs already prints that block, with the Numbeo
 *              date and the FX rate, on those 330 pages. They are left alone.
 *   estimated  "Cities without real data keep their editorial estimate", in that script's own
 *              words. The estimate predates the reconcile and no script derives it, so this note
 *              does not claim a method for it. Saying "set from comparable cities" would be
 *              inventing provenance, which is the failure this whole note exists to correct.
 *
 * Idempotent between its markers. check_cost_basis.cjs is the gate: every city page must state a
 * basis by one route or the other.
 *
 * Usage: node scripts/apply_cost_basis.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const COSTS = require(path.join(ROOT, 'data', 'numbeo-costs.json'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const sourced = new Set(Object.keys(COSTS).filter((k) => !k.startsWith('_')));
const N_SOURCED = sourced.size;
const N_TOTAL = CITIES.length;

const OPEN = '<!-- cost-basis -->';
const CLOSE = '<!-- /cost-basis -->';
const BLOCK_RE = /\n?[ \t]*<!-- cost-basis -->[\s\S]*?<!-- \/cost-basis -->/g;

const CSS = `<style>
      .cost-basis { margin: 0 0 var(--space-6, 2rem); padding: .95rem 1.1rem; border-radius: 10px;
        background: var(--color-sand, #f4efe4); border: 1px solid var(--color-sand-dark, #e3d9c6); }
      .cost-basis p { margin: 0; font-size: var(--text-sm, .9rem); line-height: 1.65; color: var(--color-charcoal, #3d3833); }
      .cost-basis strong { color: var(--color-ink, #1a1a1a); }
      .cost-basis a { color: var(--color-clay, #b4552d); }
    </style>`;

/**
 * The note for a city with no cost survey behind it.
 *
 * It states the figure, says plainly that it is not a measurement, says what the other 330 pages
 * have that this one does not, and tells the reader what to do about it. It does not apologise and
 * it does not pad: a reader who wants the number still gets it, with the right amount of trust
 * attached.
 */
function note(c) {
  return `<div class="cost-basis">
        <p><strong>Where this figure comes from.</strong> No cost survey covers ${esc(c.name)}, so the `
    + `${money(c.costPerMonth)} a month above is our own estimate rather than a measurement. `
    + `On ${N_SOURCED} of our ${N_TOTAL} city guides the figure is built from a published Numbeo basket, `
    + `a one-bedroom rent in the centre plus one person's monthly costs without rent, converted to USD; `
    + `this city is not one of them. Treat it as a starting point and check current rental listings `
    + `before you budget against it. <a href="/methodology">How we source everything</a>.</p>
      </div>`;
}

let written = 0;
let cleared = 0;
const missing = [];

for (const c of CITIES) {
  const abs = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(abs)) continue;
  const html = fs.readFileSync(abs, 'utf8');
  const bare = html.replace(BLOCK_RE, '');

  // A city that has gained real data since the last run must lose its estimate note, or the page
  // says the figure is a guess while the Numbeo block underneath it says otherwise.
  if (sourced.has(c.id) || c.costPerMonth == null) {
    if (html !== bare) { if (!DRY) fs.writeFileSync(abs, bare); cleared++; }
    continue;
  }

  // After the heading, before the prose it introduces: the reader meets the caveat with the
  // section, not after having read and believed it.
  const anchor = bare.match(/<h2 id="cost-of-living">[\s\S]*?<\/h2>/);
  if (!anchor) { missing.push(c.id); continue; }
  const at = bare.indexOf(anchor[0]) + anchor[0].length;
  const block = `\n      ${OPEN}\n      ${CSS}\n      ${note(c)}\n      ${CLOSE}`;
  const next = bare.slice(0, at) + block + bare.slice(at);

  if (next === html) continue;
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}

console.log('Cost basis: ' + written + ' estimated city page(s) marked'
  + (cleared ? ', ' + cleared + ' cleared (now sourced)' : '')
  + '  |  ' + N_SOURCED + ' sourced, ' + (N_TOTAL - N_SOURCED) + ' estimated'
  + (DRY ? '  [dry run]' : ''));
if (missing.length) console.log('  no cost-of-living heading: ' + missing.slice(0, 8).join(', '));

require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Says so, on the eight pages where the measured cost figure does not describe where the reader
 * would actually live.
 *
 * classify_cost_conflicts.cjs separates 172 pages whose prose disagrees with their cost table into
 * two faults. On 148 both numbers are right and only the framing was missing, which the reconciling
 * sentence in apply_city_costs.cjs now supplies. On eight the disagreement is real, and it is the
 * measurement that misleads:
 *
 *   - Every rent the page quotes sits above the measured rent, so Numbeo is describing somewhere
 *     else. Zanzibar quotes from $225 against a measured $100.
 *   - Or the page names a premium district and the measurement averages across it. Goa quotes
 *     $155-295 for inland Mapusa, which matches Numbeo almost exactly, and $365-575 for the Anjuna
 *     belt. Rent alone in the belt exceeds the entire $350 headline.
 *
 * WHAT THIS DOES NOT DO IS CHANGE THE RANKING, and that is deliberate rather than lazy. The
 * measured figure is correct for the city as Numbeo defines it, and the only alternative number
 * available is editorial rent from the page prose plus a measured basket. Prose rent was tested
 * against Numbeo on the 330 sourced cities when the budget range was built and came out 23% off at
 * the median. Substituting it here would trade a figure that is right about the wrong area for one
 * that is roughly right about the right area, on eight cities, silently. So the number stays, the
 * page says plainly what it does and does not cover, and the ranking question is recorded rather
 * than answered by me.
 *
 * Idempotent between <!-- catchment-note --> markers. Renders inside the cost section, directly
 * after the table it qualifies, because a caveat a reader meets after the number is a caveat.
 *
 * Usage: node scripts/apply_catchment_note.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// Written per city rather than generated, because the fact differs per city and a template would
// say "the surrounding area" everywhere and mean nothing anywhere.
const NOTES = {
  goa: 'Numbeo reports Goa as a single district, and that average is honest for the district: the '
    + 'inland rents quoted below, $155 to $295 around Mapusa and Panaji, match it closely. Almost '
    + 'nobody reading this will live there. The nomad belt at Anjuna, Vagator and Assagao runs $365 '
    + 'to $575 for the same kind of flat, which is more than the whole headline figure. Treat the '
    + 'number above as the district, and the guide below as the coast.',
  zanzibar: 'Every rent quoted in the guide below starts above the measured figure here, which '
    + 'means the survey is describing a different Zanzibar: the island away from Stone Town and the '
    + 'northern beach strip, where almost no visitor stays. Budget from the guide rather than from '
    + 'the table if you are looking at Stone Town, Paje or Nungwi.',
  buenosaires: 'Argentine rents are quoted and paid in dollars in the neighbourhoods foreigners '
    + 'use, and the peso figures the survey converts from lag the market badly during a '
    + 'devaluation. The guide below reflects what Palermo and Recoleta actually cost in dollars, '
    + 'which is roughly double the converted average.',
  malang: 'The measured average covers the wider Malang regency, including the villages around it. '
    + 'The rents in the guide below are for the city and the university district, which is where '
    + 'anybody working remotely would live and is meaningfully dearer.',
  leipzig: 'Leipzig has had one of the fastest-rising rental markets in Germany, and a survey '
    + 'average lags a market moving that quickly. The figures in the guide below are closer to what '
    + 'is currently advertised in the central districts.',
  ohrid: 'The measured figure covers Ohrid year-round, including the winter months when the town '
    + 'empties. Lakefront rents in the season, which is when almost everyone comes, run to the '
    + 'figures in the guide below instead.',
  lima: 'Lima is a city of ten million with an enormous spread between districts. The measured '
    + 'average takes in all of them; the guide below prices Miraflores, Barranco and San Isidro, '
    + 'which is where a foreign remote worker would realistically be.',
  antwerp: 'The measured average covers the whole city including the outer districts. The guide '
    + 'below prices the centre and the areas around it, where the difference is substantial.',
};

const OPEN = '<!-- catchment-note -->';
const CLOSE = '<!-- /catchment-note -->';

const block = (text) => `${OPEN}
      <div class="cost-basis">
        <p><strong>What this figure covers.</strong> ${text} <a href="/methodology">How we source everything</a>.</p>
      </div>
      ${CLOSE}`;

let applied = 0, already = 0;
const missing = [];

for (const [id, text] of Object.entries(NOTES)) {
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(p)) { missing.push(id + ' (no page)'); continue; }
  let html = fs.readFileSync(p, 'utf8');

  // Strip any previous copy first, so a reworded note replaces rather than accumulates.
  const stripped = html.replace(new RegExp('\\s*' + OPEN + '[\\s\\S]*?' + CLOSE), '');
  const want = block(text);

  // Anchor after the cost table, which is the thing being qualified.
  const anchor = '<!-- cost-end -->';
  if (!stripped.includes(anchor)) { missing.push(id + ' (no cost table to qualify)'); continue; }
  const out = stripped.replace(anchor, anchor + '\n      ' + want);

  if (out === html) { already++; continue; }
  applied++;
  if (APPLY) fs.writeFileSync(p, out);
}

console.log('Catchment notes  (the measured figure does not describe where the reader would live)\n');
console.log('  cities needing one: ' + Object.keys(NOTES).length);
console.log('  written: ' + applied + (APPLY ? '' : '   [dry run]'));
if (already) console.log('  already current: ' + already);
if (missing.length) console.log('  PROBLEM: ' + missing.join(', '));
console.log('\n  The ranking is unchanged on all eight. See the header for why.');

/**
 * Gate: a page that counts its own list must reach the same number every time it says it.
 *
 * A filtered listing states its size in up to three places: the search box placeholder, the tally
 * line under the bar, and the cards themselves. They are computed separately, from different
 * variables, and they have drifted apart three times now:
 *
 *   /services/lisbon          "All 103 listings on this page" over 26 cards. The tally used the
 *                             providers in the city rather than the cards rendered.
 *   /services/madrid/lawyers  "Search 122 listings" beside "All 214 listings on this page" over 47
 *                             cards. Three numbers for one list. The placeholder used every lawyer
 *                             in Madrid, and the tally summed whole language sections, which are
 *                             sliced to eight and which list a trilingual firm three times.
 *
 * Each was reported by a reader rather than caught here, which is the argument for this file. The
 * check is exact: no tolerance, because there is no reason for these to differ by one.
 *
 * The filter script recomputes its tally from the DOM on the first interaction, so a wrong number
 * corrects itself as soon as somebody types. That is precisely what makes it worth gating; it is
 * wrong only in the state every visitor sees first, and right by the time anyone would go looking.
 *
 * Usage: node scripts/check_filter_counts.cjs [--all]
 * Exit 1 if any page's stated size disagrees with the cards it renders.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');

const SKIP_TOP = new Set(['node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill', 'tests', 'logos', 'components']);

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }
    if (e.name.endsWith('.html')) pages.push({ abs: p, rel: r });
  }
})(ROOT, '');

const errors = [];
let checked = 0;

for (const { abs, rel } of pages) {
  const html = fs.readFileSync(abs, 'utf8');
  // Only the markup counts. A number inside a <style> or <script> is not a claim to a reader.
  const body = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const cards = (body.match(/class="[^"]*\bsf-item\b/g) || []).length;
  if (!cards) continue;

  const said = [];
  const ph = html.match(/placeholder="Search ([\d,]+) listings/);
  if (ph) said.push(['search placeholder', parseInt(ph[1].replace(/,/g, ''), 10)]);
  // The tally line, whichever id this page family uses for it.
  const ct = html.match(/id="sv[a-zA-Z]*Count"[^>]*>[\s\S]{0,140}?<b>([\d,]+)<\/b>/);
  if (ct) said.push(['tally line', parseInt(ct[1].replace(/,/g, ''), 10)]);
  if (!said.length) continue;

  checked++;
  const wrong = said.filter(([, n]) => n !== cards);
  if (wrong.length) {
    errors.push(rel + ': renders ' + cards + ' cards but says '
      + wrong.map(([w, n]) => n + ' in the ' + w).join(' and '));
  }

  /**
   * Every dropdown option, against the cards it would actually select.
   *
   * Two failures, both found by a reader on /services/madrid/lawyers. The menu offered
   * "Polish (1)" when no card on the page was Polish, so choosing it emptied the list, and
   * "English (80)" over 43 English cards. Both came from counting the city instead of the page.
   * On the hubs the same menu counted providers while the cards are cities, so "English (2099)"
   * narrowed to 235 tiles: two true numbers measuring different things, which is worse than one
   * wrong one. An option that can only return nothing is the serious half of this.
   */
  for (const sel of body.matchAll(/<select id="[^"]+" data-sf="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const key = sel[1];
    const per = {};
    for (const it of body.matchAll(/class="[^"]*\b(?:sf-item|sv-ix)\b[^"]*"([^>]*)>/g)) {
      const m = it[1].match(new RegExp('data-' + key + '="([^"]*)"'));
      if (m) m[1].split(/\s+/).forEach((v) => { if (v) per[v] = (per[v] || 0) + 1; });
    }
    for (const opt of sel[2].matchAll(/<option value="([^"]+)">([^<]*)<\/option>/g)) {
      if (opt[1] === 'all') continue;
      const hits = per[opt[1]] || 0;
      const label = opt[2].replace(/&amp;/g, '&');
      if (hits === 0) {
        errors.push(rel + ': the ' + key + ' menu offers "' + label + '", which matches no card on the page');
        continue;
      }
      const says = label.match(/\((\d[\d,]*)\)/);
      if (says && parseInt(says[1].replace(/,/g, ''), 10) !== hits) {
        errors.push(rel + ': the ' + key + ' menu says "' + label + '" but selecting it shows ' + hits);
      }
    }
  }
}

console.log('FILTER COUNT GATE  (the page agrees with itself about how long its list is)\n');
console.log('  ' + checked + ' pages state the size of a filtered list');

if (errors.length) {
  console.log('\n  ERRORS (' + errors.length + '):');
  errors.slice(0, SHOW_ALL ? errors.length : 20).forEach((e) => console.log('    ' + e));
  if (!SHOW_ALL && errors.length > 20) console.log('    ... and ' + (errors.length - 20) + ' more (--all)');
  process.exit(1);
}
console.log('  clean: every stated count matches the cards on the page.');

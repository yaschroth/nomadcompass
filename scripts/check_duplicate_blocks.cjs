/**
 * Gate: no page carries two copies of a block that should appear once.
 *
 * Written because it happened. Converting build_vs_pages.cjs to lib/page_shell.cjs added
 * ${shell.bodyEnd} while the generator's own template still carried its own copy of the nav search
 * resolver, so all 107 head-to-head pages shipped with the block twice: two <style> blocks, two
 * copies of the resolver script, 87 duplicated lines each. The same conversion also doubled the
 * GA4 block, which was caught only because someone happened to grep for that one marker. Nothing
 * else would have noticed: the page renders identically, every other gate passes, and the second
 * copy of an analytics tag can double-count.
 *
 * The markers below are the sitewide blocks that a sweep owns and inserts exactly once. Each is
 * counted by its OPENING comment, so a matched open/close pair counts as one.
 *
 * Usage: node scripts/check_duplicate_blocks.cjs [--all]
 * Exit 1 if any page carries a block more than once.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');

// marker -> what owns it, for the message. All are inserted once per page by a sweep or the shell.
const ONCE = {
  '<!-- ga4 -->': 'apply_analytics.cjs',
  '<!-- cc -->': 'apply_analytics.cjs (consent banner)',
  '<!-- nav-search-js -->': 'apply_nav_search.cjs',
  '<!-- travelpayouts -->': 'apply_travelpayouts.cjs',
  '<!-- aff-track -->': 'apply_affiliate_tracking.cjs',
  '<!-- brand-graph -->': 'apply_entity_schema.cjs',
  '<!-- photo-credit -->': 'apply_photo_credit.cjs',
  '<!-- money-cta -->': 'apply_money_cta.cjs',
  '<!-- similar-cities -->': 'apply_similar_cities.cjs',
  '<!-- facts-start -->': 'apply_city_facts.cjs',
  '<!-- cost-basis -->': 'apply_cost_basis.cjs',
  '<!-- city-scores:': 'apply_city_scores.cjs',
  '<nav class="nav"': 'the shared nav',
  '<footer class="footer"': 'the shared footer',
};

const SKIP_DIRS = new Set(['node_modules', '.git', 'ui-ux-pro-max-skill']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

const files = walk(ROOT, []);
const problems = [];
let scanned = 0;

for (const fp of files) {
  const s = fs.readFileSync(fp, 'utf8');
  scanned++;
  for (const [marker, owner] of Object.entries(ONCE)) {
    let n = 0, i = 0;
    while ((i = s.indexOf(marker, i)) !== -1) { n++; i += marker.length; }
    if (n > 1) {
      problems.push({ file: path.relative(ROOT, fp).replace(/\\/g, '/'), marker, n, owner });
    }
  }
}

console.log('DUPLICATE BLOCK GATE  (a sweep-owned block appears once per page)\n');
console.log('  ' + scanned + ' pages, ' + Object.keys(ONCE).length + ' blocks checked\n');

if (!problems.length) {
  console.log('  clean: no page carries a block twice.');
  process.exit(0);
}

const byMarker = new Map();
for (const p of problems) {
  if (!byMarker.has(p.marker)) byMarker.set(p.marker, []);
  byMarker.get(p.marker).push(p);
}

console.log('  FAILING: ' + problems.length + ' duplicated block(s):\n');
for (const [marker, list] of byMarker) {
  console.log('  ' + marker + '  (' + list[0].owner + ') on ' + list.length + ' page(s):');
  for (const p of (SHOW_ALL ? list : list.slice(0, 6))) console.log('    ' + p.file + ' x' + p.n);
  if (!SHOW_ALL && list.length > 6) console.log('    ... and ' + (list.length - 6) + ' more (--all)');
  console.log('');
}
console.log('  A generator that emits its own copy of a block the shell also supplies is the usual');
console.log('  cause. Remove it from the generator template, not from the shell.');
process.exit(1);

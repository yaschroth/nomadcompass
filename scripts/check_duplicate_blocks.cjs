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
 * Counting markers is not enough on its own. When apply_city_guide_sections overwrote the
 * cost-basis note with the cost prose, the markers stayed exactly where they were, so this gate
 * saw one block and passed, while 257 city pages printed the same paragraph twice, once inside
 * the block and once below it. A reader would have seen it immediately. So the visible prose is
 * counted too: no page may print the same substantial paragraph more than once.
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

// tests/fixtures holds third-party HTML captured for the service readers to parse. It is not our
// markup and its repetitions are the source's, not ours. check_local_assets.cjs skips it too.
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill']);

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
const dupProse = [];
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

  // The same visible paragraph twice on one page. Short ones repeat legitimately (a shared caption,
  // a stock line in a card), so only substantial prose counts, and the two copies are compared with
  // whitespace normalised because they are rarely indented alike.
  const seen = new Map();
  // <p must not match <path: the service pages carry inline SVG icons and an unanchored <p turned
  // every one of them into a phantom paragraph.
  for (const m of s.matchAll(/<p(?=[\s>])(?![^>]*\bclass=)[^>]*>([\s\S]*?)<\/p>/g)) {
    const t = m[1].replace(/[\s]+/g, ' ').trim();
    if (t.length < 200) continue;
    const seenN = (seen.get(t) || 0) + 1;
    seen.set(t, seenN);
    if (seenN === 2) {
      dupProse.push({ file: path.relative(ROOT, fp).replace(/[\\]/g, '/'), text: t.slice(0, 70) });
    }
  }
}

console.log('DUPLICATE BLOCK GATE  (a sweep-owned block appears once per page)\n');
console.log('  ' + scanned + ' pages, ' + Object.keys(ONCE).length + ' blocks checked\n');

if (dupProse.length) {
  console.log('  FAILING: ' + dupProse.length + ' page(s) print the same paragraph twice:\n');
  for (const d of (SHOW_ALL ? dupProse : dupProse.slice(0, 8))) {
    console.log('    ' + d.file + '  "' + d.text + '..."');
  }
  if (!SHOW_ALL && dupProse.length > 8) console.log('    ... and ' + (dupProse.length - 8) + ' more (--all)');
  console.log('');
  console.log('  Usually a sweep that wrote its prose into a block another sweep owns, leaving the');
  console.log('  original standing below it. Fix the sweep, then rebuild the affected pages.\n');
}

if (!problems.length && !dupProse.length) {
  console.log('  clean: no page carries a block twice, and no paragraph is printed twice.');
  process.exit(0);
}

if (!problems.length) process.exit(1);

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

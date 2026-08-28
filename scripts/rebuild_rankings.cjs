/**
 * One command to rebuild every ranking page from source, e.g. after adding or editing
 * cities in cities-data.js. Runs the full pipeline:
 *   1. rank_best.cjs      -> recomputes best-<key>.json (top 15) from current city data
 *   2. apply_best_page    -> rebuilds best/<slug>.html from best-<key>.json + content-<key>.json
 *   3. build_best_hub     -> rebuilds /best
 *   4. generate_sitemap   -> refreshes sitemap.xml
 *
 * A page is "live" if it has a content-<key>.json in the repo root (the unique prose).
 * When a newly added city rises into a ranking it will render immediately via the
 * apply-time tagline fallback; write a real blurb for it in content-<key>.json when ready.
 *
 * Usage: node scripts/rebuild_rankings.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const run = (script, args = []) => execFileSync(node, [path.join(__dirname, script), ...args], { cwd: ROOT, stdio: 'inherit' });

// Live keys = every content-<key>.json present in the repo root.
// Exclude content-activity-*.json: the editorial activity pages are a separate system
// (build_activities.cjs), not Nomad-Score rankings, so rank_best/apply_best_page skip them.
const keys = fs.readdirSync(ROOT)
  .filter((f) => /^content-.+\.json$/.test(f) && !/^content-activity-/.test(f))
  .map((f) => f.replace(/^content-|\.json$/g, ''))
  .sort();

if (!keys.length) { console.error('No content-*.json found; nothing to rebuild.'); process.exit(1); }
console.log(`Rebuilding ${keys.length} ranking pages: ${keys.join(', ')}\n`);

// apply_city_rankings rebuilds the whole inside of section.city-seo-explore, and three other sweeps
// write into that same section. It carries the blog links across and nothing else, so a plain run
// silently deletes the money CTA from 710 pages, the "Best of" links from 710 and the head-to-head
// links from 91. They are re-applied here rather than left as a step to remember.
const STEPS = [
  ['ranking data (rank_best)', 'rank_best.cjs', keys],
  ['pages (apply_best_page)', 'apply_best_page.cjs', keys],
  ['hub (build_best_hub)', 'build_best_hub.cjs'],
  ['tier list (build_tier_list)', 'build_tier_list.cjs'],
  ['sitemap (generate_sitemap)', 'generate_sitemap.cjs'],
  ['city "Featured in rankings" links (apply_city_rankings)', 'apply_city_rankings.cjs'],
  ['similar cities (apply_similar_cities)', 'apply_similar_cities.cjs'],
  ['money CTA, overwritten above (apply_money_cta)', 'apply_money_cta.cjs'],
  ['"Best of" links, same section (apply_best_links)', 'apply_best_links.cjs'],
  ['head-to-head links, same section (apply_vs_links)', 'apply_vs_links.cjs'],
  ['nav search box (apply_nav_search)', 'apply_nav_search.cjs'],
  ['structured data (apply_entity_schema, must run last)', 'apply_entity_schema.cjs'],
  ['analytics (apply_analytics)', 'apply_analytics.cjs'],
  ['search snippets (check_meta, a gate)', 'check_meta.cjs'],
];
STEPS.forEach(([label, script, args], i) => {
  console.log((i ? '\n' : '') + (i + 1) + '/' + STEPS.length + '  ' + label + '...');
  run(script, args || []);
});
console.log('\nDone. Review changes with `git diff` before committing.');

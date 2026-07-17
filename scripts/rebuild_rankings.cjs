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

console.log('1/4  ranking data (rank_best)…');
run('rank_best.cjs', keys);
console.log('\n2/4  pages (apply_best_page)…');
run('apply_best_page.cjs', keys);
console.log('\n3/4  hub (build_best_hub)…');
run('build_best_hub.cjs');
console.log('\n4/6  tier list (build_tier_list)…');
run('build_tier_list.cjs');
console.log('\n5/6  sitemap (generate_sitemap)…');
run('generate_sitemap.cjs');
console.log('\n6/7  city "Featured in rankings" links (apply_city_rankings)…');
run('apply_city_rankings.cjs');
console.log('\n7/7  structured data (apply_entity_schema, must run last)…');
run('apply_entity_schema.cjs');
console.log('\nDone. Review changes with `git diff` before committing.');

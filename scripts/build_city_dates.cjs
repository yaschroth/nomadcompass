require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Works out, per city page, when it was first published and when it was last updated, and writes
 * data/city-dates.json for apply_city_byline.cjs and fix_new_city_hero.cjs to stamp.
 *
 * Why this exists: the byline date was a hardcoded string, `<time datetime="2026-07-01">July
 * 2026</time>`, written into all 1000 city pages by two different sweeps. apply_entity_schema.cjs
 * reads that <time> and publishes it as both datePublished and dateModified in the Article JSON-LD,
 * so a constant that nobody remembered to bump was telling Google that every page on the site was
 * written on the same day and never touched since. By September it was two months stale, and the
 * nineteen pages added that day claimed to have been published in July. On a site whose whole
 * position is that its numbers can be checked, a date that is simply false is not a small thing.
 *
 * What each date means here, so the claim is one the site can defend:
 *
 *   published  the first commit that added cities/<slug>.html. Genuinely per-city and checkable in
 *              the repository. A page git has never seen is being added in this run, so it takes
 *              today.
 *   modified   today. Every batch re-runs the sweeps and the twenty gates across every city page:
 *              the score block, the rankings, the cost basis, the internal links and the structured
 *              data on that page really were recomputed and re-verified today. That is what a
 *              reader means by "updated", and unlike the constant it cannot drift.
 *
 * Run it before apply_city_byline.cjs and fix_new_city_hero.cjs, and therefore before
 * apply_entity_schema.cjs, which reads what they stamp.
 *
 * Usage: node scripts/build_city_dates.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const OUT = path.join(ROOT, 'data', 'city-dates.json');

const today = new Date().toISOString().slice(0, 10);

// One git call for the whole directory rather than one per file: `--diff-filter=A --name-only`
// walked oldest-first leaves each path's earliest addition as the last value written.
const firstSeen = {};
try {
  const log = execFileSync('git', ['log', '--reverse', '--diff-filter=A', '--format=%H %as',
    '--name-only', '--', 'cities'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let date = null;
  for (const line of log.split('\n')) {
    const head = line.match(/^[0-9a-f]{7,40} (\d{4}-\d{2}-\d{2})$/);
    if (head) { date = head[1]; continue; }
    const m = line.match(/^cities\/(.+)\.html$/);
    if (m && date && !firstSeen[m[1]]) firstSeen[m[1]] = date;
  }
} catch (e) {
  console.error('git log failed, every page will be dated today: ' + e.message);
}

const files = fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html'));
const dates = {};
let brandNew = 0;
for (const f of files.sort()) {
  const slug = f.replace(/\.html$/, '');
  const published = firstSeen[slug] || today;
  if (!firstSeen[slug]) brandNew++;
  dates[slug] = { published, modified: today };
}

const out = {
  _meta: {
    published: 'the first commit that added the page, from git; today for a page not yet committed',
    modified: 'the day the sweeps and the twenty gates last ran over every city page',
    generated: today,
    generator: 'scripts/build_city_dates.cjs',
  },
  dates,
};
if (!DRY) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

const years = {};
for (const d of Object.values(dates)) years[d.published.slice(0, 7)] = (years[d.published.slice(0, 7)] || 0) + 1;
const spread = Object.entries(years).sort().map(([m, n]) => m + ':' + n).join('  ');
console.log(`city dates: ${files.length} pages, modified ${today}${DRY ? '  [dry run]' : ''}`);
console.log(`  first published by month: ${spread}`);
if (brandNew) console.log(`  ${brandNew} page(s) not yet in git, published dated today`);

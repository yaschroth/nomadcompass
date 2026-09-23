/**
 * Sends a city-and-service URL that was never written to the city page that holds its providers.
 *
 * WHY THIS EXISTS
 *
 * build_service_pair_pages.cjs writes /services/<city>/<service> only where there is enough to say:
 * 143 combinations are under its 220-word floor, 19 read as near-copies of a bigger page, and 161
 * are in cities holding a single service, where the child would repeat its parent. All three
 * refusals are right, and the result is 323 URLs that hold real providers and answer 404.
 *
 * The URLs are guessable, which is not a theory: /services/tbilisi/vets and
 * /services/chiangmai/therapists were both landed on this month, by readers or crawlers who had seen
 * the pattern on a city that does have the page. Tbilisi has three vets and Chiang Mai two
 * therapists; they are listed on /services/tbilisi and /services/chiangmai, one level up. So the
 * honest answer is a redirect to the page that holds them, not a 404 and not a thin page written to
 * fill the gap.
 *
 * WHY THE LIST IS GENERATED AND NEVER EDITED BY HAND
 *
 * Vercel evaluates redirects BEFORE the filesystem. A redirect kept by hand would, the first day a
 * page crossed the word floor, quietly shadow the real page: the file would exist and nobody would
 * ever be served it. So the list is rebuilt from what exists on disk after every rebuild, and this
 * script refuses to emit a redirect for a path that a file answers. `--check` re-runs that test
 * without writing, which is how it sits in the gate list.
 *
 * WHY 302 AND NOT 301
 *
 * These pages appear as the directory grows: a city three providers short of the floor today has the
 * page next month. A 301 is cached by browsers and would outlive the condition that justified it.
 *
 * Manual redirects in vercel.json are left alone. A generated one is recognised by its shape: a
 * two-segment path under /services/ pointing at its own parent.
 *
 * Usage: node scripts/build_service_redirects.cjs [--check]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const { db } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const { CAT_PLURAL } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const SLUG = Object.fromEntries(Object.entries(CAT_PLURAL).map(([k, v]) => [k, v.replace(/ /g, '-')]));
const page = (rel) => fs.existsSync(path.join(ROOT, `${rel}.html`)) || fs.existsSync(path.join(ROOT, rel, 'index.html'));
// A generated entry: /services/<city>/<service> -> /services/<city>.
const isGenerated = (r) => !r.has && typeof r.source === 'string'
  && /^\/services\/[^/]+\/[^/]+$/.test(r.source)
  && r.destination === r.source.split('/').slice(0, 3).join('/');

const held = new Map();
for (const p of db.providers) {
  const slug = SLUG[p.category];
  if (!slug) continue;
  const source = `/services/${p.city}/${slug}`;
  if (page(`services/${p.city}/${slug}`)) continue;     // the page exists; never shadow it
  if (!page(`services/${p.city}`)) continue;            // nothing to send them to
  held.set(source, `/services/${p.city}`);
}

const generated = [...held.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  .map(([source, destination]) => ({ source, destination, permanent: false }));

const file = path.join(ROOT, 'vercel.json');
const raw = fs.readFileSync(file, 'utf8');
const cfg = JSON.parse(raw);
const manual = (cfg.redirects || []).filter((r) => !isGenerated(r));

// The test this file exists to keep: nothing in the final list may stand in front of a real page.
const shadowing = [...manual, ...generated].filter((r) => !r.has && !r.source.includes(':')
  && page(r.source.replace(/^\//, '')));
if (shadowing.length) {
  console.error(`REFUSED: ${shadowing.length} redirect(s) would hide a page that exists:`);
  shadowing.slice(0, 10).forEach((r) => console.error(`  ${r.source} -> ${r.destination}`));
  process.exit(1);
}

cfg.redirects = [...manual, ...generated];
const next = `${JSON.stringify(cfg, null, 2)}\n`;
if (CHECK) {
  if (next !== raw) {
    console.error('REFUSED: vercel.json is out of date. Run node scripts/build_service_redirects.cjs');
    process.exit(1);
  }
  console.log(`  clean: ${generated.length} generated redirects match what is on disk.`);
  process.exit(0);
}
fs.writeFileSync(file, next);
console.log(`${generated.length} city-and-service URLs redirect to their city page (${manual.length} manual redirects kept).`);

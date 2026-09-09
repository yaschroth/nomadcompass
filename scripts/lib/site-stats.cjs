/**
 * Single source of truth for the numbers the site says about itself.
 *
 * Every count here is COMPUTED from the data, never typed in. Before this existed the site
 * contradicted itself in public: the homepage said 650+ cities, /best and /about said 410,
 * /cities said 710, and the real figure was 710. That is 234 stale numbers across 193 files,
 * on a site whose whole position is that its figures are sourced.
 *
 * Generators must import from here instead of hardcoding a literal, and
 * scripts/apply_site_numbers.cjs sweeps the already-written HTML. scripts/check_site_numbers.cjs
 * fails the build if a stale figure reappears, which is what stops the drift returning.
 *
 * Usage:
 *   const { stats } = require('./lib/site-stats.cjs');   // from scripts/
 *   const s = stats();
 *   `...an index of ${s.cities} cities...`
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function countFiles(dir, re) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return 0;
  return fs.readdirSync(abs).filter((f) => re.test(f)).length;
}

let cached = null;

function stats() {
  if (cached) return cached;

  // Cities: evaluate cities-data.js the same way every other generator in this repo does.
  const m = {};
  new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
  const CITIES = m.exports;

  const countries = new Set(CITIES.map((c) => c && c.country).filter(Boolean)).size;
  // Score categories are whatever keys a city actually carries, not a list we maintain twice.
  const categories = Object.keys((CITIES.find((c) => c && c.scores) || { scores: {} }).scores).length;

  // Tools: parsed out of the nav sweep's TOOLS array rather than duplicated. Requiring that
  // file would execute a sitewide sweep, so read it as text.
  const navSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'apply_tools_nav.cjs'), 'utf8');
  const toolsBlock = navSrc.match(/const TOOLS = \[([\s\S]*?)\n\];/);
  const tools = toolsBlock ? (toolsBlock[1].match(/\['\//g) || []).length : 0;

  let providers = 0, providerCities = 0, providerLanguages = 0;
  const svcPath = path.join(ROOT, 'data', 'service-languages.json');
  if (fs.existsSync(svcPath)) {
    const db = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
    providers = db.providers.length;
    providerCities = new Set(db.providers.map((p) => p.city)).size;
    providerLanguages = new Set(db.providers.flatMap((p) => p.languages)).size;
  }

  cached = {
    cities: CITIES.length,
    countries,
    categories,
    rankings: countFiles('best', /\.html$/),
    tools,
    posts: countFiles('blog', /\.html$/),
    comparisons: countFiles('vs', /\.html$/),
    providers,
    providerCities,
    providerLanguages,
  };
  return cached;
}

/**
 * Phrasings that can ONLY be about this site's whole index, so the number in them may be matched
 * as any 3-4 digits rather than against a list of figures the site used to claim.
 *
 * That list was the original safety mechanism and it was the right call: a blanket rule on "N
 * cities" rewrote 4,855 correct figures, because /services/lawyers says "255 cities" and means it.
 * But a hand-maintained list of old values only holds until the count moves again, and it did:
 * 831 was never added, so about.html publicly claimed 831 cities while the gate reported clean,
 * and 32 ranking pages said "browse all 410 city guides" because "city guides" was not one of the
 * counted nouns. Anchoring on the PHRASE instead of the number closes both, and it cannot fire on
 * a subset count, because no subset is ever described as "browse all N city guides".
 *
 * Each entry is [regex with the number as group 2, prefix group 1, suffix group 3].
 */
const INDEX_PHRASES = [
  /(browse all )(\d{3,4})( city guides)/g,
  /(keep )(\d{3,4})( city guides accurate)/g,
  /(rates )(\d{3,4})( cities)/g,
  /(ranked across )(\d{3,4})( cities)/g,
  /(across our )(\d{3,4})(-city index)/g,
  /(an index of )(\d{3,4})( cities)/g,
];

module.exports = { stats, INDEX_PHRASES };

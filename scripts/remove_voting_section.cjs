require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Takes the leftover community-voting UI off the city pages.
 *
 * Accounts, login and voting were removed sitewide in August 2026 and the Supabase backend was
 * deleted with them. The shell of the feature stayed behind on all 710 city pages, in two places a
 * reader can see:
 *
 *   1. A section headed "What Do Nomads Say?", subtitled "Vote on how accurate these scores are
 *      based on your experience", containing an empty grid. Nothing fills it, because nothing can.
 *      The sticky jump nav carries a "Reviews" link pointing straight at it, so a reader who uses
 *      the in-page nav is sent to a heading that promises other nomads' opinions and delivers an
 *      empty box. On a site whose position is credibility, the worst empty promise is the one the
 *      reader went looking for.
 *
 *   2. Every category tile prints "(base: 4)" underneath "4/10". Those two numbers were only ever
 *      different when votes could adjust the score. Thirteen tiles on each of 710 pages, saying the
 *      same number twice and implying an adjustment that no longer exists.
 *
 * Also drops the two element lookups for the removed section, which are declared and never read.
 *
 * What stays, deliberately:
 *   - the `if (window.VotingService)` branches in renderCategories. They are guarded, the service is
 *     gone so they never run, and displayScore falls through to baseScore. Unpicking that scoring
 *     path across 710 inline scripts is a refactor, not a cleanup, and it is not what a reader sees.
 *   - the .voting-* rules in styles/city-page.css and base.css. They now match nothing, which costs
 *     a reader nothing, and pruning shared stylesheets by hand is how you break a selector something
 *     else still uses. Worth a separate pass with a real usage check.
 *
 * Usage: node scripts/remove_voting_section.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const EDITS = [
  ['voting section',
    /[ \t]*<!-- Community Voting -->\s*<section class="voting-section"[^>]*>[\s\S]*?<\/section>\s*/,
    '\n    '],
  ['Reviews jump link',
    /[ \t]*<a href="#reviews">Reviews<\/a>\s*\n/,
    ''],
  ['(base: N) tile meta',
    /\s*<div class="category-meta">\s*<span class="category-base">\(base: \$\{baseScore\}\)<\/span>\s*\$\{totalVotes > 0 \? `<span class="category-votes">\$\{totalVotes\} votes<\/span>` : ''\}\s*<\/div>/,
    ''],
  ['unused element lookups',
    /\s*const votingGrid = document\.getElementById\('votingGrid'\);\s*const votingLoginPrompt = document\.getElementById\('votingLoginPrompt'\);/,
    ''],
];

let pages = 0;
const missing = {};
const failed = [];

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  let out = html;
  for (const [label, re, to] of EDITS) {
    if (re.test(out)) out = out.replace(re, to);
    else missing[label] = (missing[label] || 0) + 1;
  }
  if (out === html) continue;

  // The inline script is being edited, so prove it still parses before writing over the page.
  const bad = [...out.matchAll(/<script(?![^>]*src=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)]
    .some((s) => { try { new Function(s[1]); return false; } catch (e) { return true; } });
  if (bad) { failed.push(f); continue; }

  pages += 1;
  if (APPLY) fs.writeFileSync(p, out);
}

// --- the generators, so a rebuild does not put it back
const gens = [];
const patch = (file, re, to, label) => {
  const fp = path.join(ROOT, 'scripts', file);
  const before = fs.readFileSync(fp, 'utf8');
  const after = before.replace(re, to);
  if (after === before) return;
  gens.push(file + ': ' + label);
  if (APPLY) fs.writeFileSync(fp, after);
};
patch('generate_city_pages.js',
  /[ \t]*<!-- Community Voting -->\s*<section class="voting-section"[^>]*>[\s\S]*?<\/section>\s*/,
  '\n    ', 'voting section template');
patch('apply_city_toc.cjs', /[ \t]*<a href="#reviews">Reviews<\/a>\s*\n/, '', 'Reviews jump link');
patch('apply_city_toc.cjs',
  /[ \t]*\['<section class="voting-section">', '<section class="voting-section" id="reviews">'\],\s*\n/,
  '', 'the id-injection rule that anchored it');

console.log(pages + ' city pages cleaned');
Object.entries(missing).forEach(([k, v]) => console.log('  ' + v + ' pages had no ' + k));
if (failed.length) {
  console.log('\n  SKIPPED, the edit would break the inline script:');
  failed.slice(0, 10).forEach((b) => console.log('    ' + b));
}
console.log('\ngenerators:');
gens.forEach((g) => console.log('  ' + g));
if (!gens.length) console.log('  (already clean)');
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

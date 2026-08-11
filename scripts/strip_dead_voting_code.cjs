/**
 * Removes the dead remnants the earlier passes left behind.
 *
 * Three things, all provably unreachable rather than merely unused:
 *
 * 1. `if (window.VotingService) { ... }` at the end of init() on the city pages. votes.js is
 *    deleted and nothing else defines VotingService, so the block never ran; the three lines
 *    above it already render the score, the categories and the radar from the base data,
 *    which is exactly what visitors see today. Removed by brace matching, not by regex, so a
 *    nested brace cannot truncate it in the wrong place.
 * 2. `function isLoggedIn()`, which had zero call sites left after the UI was removed but
 *    still read a localStorage auth key.
 * 3. The empty `<div class="nav-actions"></div>` / `<div class="nav-mobile-actions"></div>`
 *    shells on 1588 pages: the first sweep took the two anchors out but left the wrapper.
 *    Harmless to look at (an empty flex container with only a gap has no height) but it is
 *    markup for a feature that no longer exists, and the generators no longer emit it.
 *
 * Deliberately NOT touched: the small `if (window.VotingService) ... else ...` fallbacks
 * inside calculateNomadScore, drawRadarChart and renderCategories. They are equally dead, but
 * removing them means rewriting the scoring math on 710 pages for no user-visible gain, and
 * these pages cannot simply be regenerated without losing everything the later sweeps added.
 *
 * Idempotent. Usage: node scripts/strip_dead_voting_code.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

/** Returns [start, end) of the balanced {...} block that begins at the first { at or after `from`. */
function braceBlock(s, from) {
  const open = s.indexOf('{', from);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return [from, i + 1]; }
  }
  return null;
}

let initBlocks = 0, loginFns = 0, cityPages = 0;
const CITY = path.join(ROOT, 'cities');
for (const f of fs.readdirSync(CITY).filter(f => f.endsWith('.html'))) {
  const p = path.join(CITY, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  // 1. the vote-fetching block inside init()
  const anchor = s.indexOf('renderRelatedCities(city);');
  if (anchor >= 0) {
    const guard = s.indexOf('if (window.VotingService) {', anchor);
    // only if it is the one right after the render calls, not some later occurrence
    if (guard >= 0 && guard - anchor < 200) {
      const blk = braceBlock(s, guard);
      if (blk) {
        const body = s.slice(blk[0], blk[1]);
        if (/fetchVoteAggregates/.test(body)) {
          s = s.slice(0, blk[0]).replace(/\s*$/, '\n      ') + s.slice(blk[1]).replace(/^\s*\n/, '\n');
          initBlocks++;
        }
      }
    }
  }

  // 2. the orphaned login check
  const fn = s.indexOf('function isLoggedIn()');
  if (fn >= 0) {
    const blk = braceBlock(s, fn);
    if (blk) { s = s.slice(0, blk[0]) + s.slice(blk[1]).replace(/^\s*\n/, '\n'); loginFns++; }
  }

  if (s !== before) { if (!DRY) fs.writeFileSync(p, s); cityPages++; }
}

// 3. empty nav wrappers, sitewide
let shells = 0, shellPages = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'ui-ux-pro-max-skill', 'images'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      let s = fs.readFileSync(p, 'utf8');
      const before = s;
      s = s.replace(/[ \t]*<div class="nav-(?:mobile-)?actions">\s*<\/div>\r?\n?/g, () => { shells++; return ''; });
      if (s !== before) { if (!DRY) fs.writeFileSync(p, s); shellPages++; }
    }
  }
})(ROOT);

/* 4. the auth-state CSS, which only ever applied under html.auth-logged-in.
 *
 * Match one rule at a time and check each selector. The first version of this deleted
 * everything after the section comment with `(?:[^{}]*\{[^}]*\}\s*)+`, which does not stop
 * at the end of the auth rules: it ate .nav, .nav-container, .nav-logo and .nav-logo-icon
 * as well, so the header logo rendered at its natural size on every page. Never sweep CSS
 * by "comment plus everything following"; sweep by selector.
 */
const navCss = path.join(ROOT, 'styles/nav.css');
const cssBefore = fs.readFileSync(navCss, 'utf8');
// .nav-login also matches /^\.nav\b/, so the keep-list must name the layout classes in full
const KEEP = /\.nav-logo|\.nav-container|\.nav-links|\.nav-toggle|\.nav-mobile-link|\.nav-drop|\.nav-search|\.nav\.scrolled|^\s*\.nav\s*[,{]/;
let cssRules = 0;
let css = cssBefore.replace(/^[ \t]*(?:html\.auth-logged-in[^{]*|\.nav-(?:login|signup)[^{]*)\{[^}]*\}\r?\n?/gm, (m) => {
  if (KEEP.test(m.split('{')[0])) return m;
  cssRules++;
  return '';
});
css = css.replace(/\/\*[^*]*TEMPORARILY HIDE LOGIN\/SIGNUP BUTTONS[\s\S]*?\*\/\r?\n?/g, '');
css = css.replace(/\/\* -+\s*\r?\n\s*AUTH STATE FLASH PREVENTION[\s\S]*?-+ \*\/\r?\n?/g, '');
css = css.replace(/\/\* (?:If user is logged in|For logged-in users)[\s\S]*?\*\/\r?\n?/g, '');
css = css.replace(/\n{3,}/g, '\n\n');
if (css !== cssBefore && !DRY) fs.writeFileSync(navCss, css);

console.log(`${DRY ? 'DRY RUN' : 'APPLIED'}`);
console.log(`  Stadtseiten bereinigt: ${cityPages} (Init-Block: ${initBlocks}, isLoggedIn: ${loginFns})`);
console.log(`  leere Nav-Huellen entfernt: ${shells} auf ${shellPages} Seiten`);
console.log(`  nav.css Auth-Regeln entfernt: ${cssRules}`);

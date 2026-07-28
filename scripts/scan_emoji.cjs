/**
 * Verification helper (not shipped logic): scans given files/globs for pictographic emoji.
 * Usage: node scripts/scan_emoji.cjs <file-or-dir> [<file-or-dir> ...]
 * Prints "<count>  <file>: <emoji chars>" per offending file. Exit 0 always.
 * Flag-letter regional indicators and the icon-name strings are NOT emoji, so they pass.
 */
const fs = require('fs');
const path = require('path');
// Pictographic ranges: misc technical/symbols/dingbats (2300-27BF), misc symbols+arrows
// pictographs (2B00-2BFF), and the emoji planes (1F000-1FAFF). Deliberately EXCLUDES the
// arrows block (2190-21FF) so typographic arrows like → in copy do not false-positive.
// Regional-indicator flags handled separately (real flag SVGs) unless --flags is passed.
const EMOJI = /[\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}]/u;
const FLAG = /[\u{1F1E6}-\u{1F1FF}]/u;
const wantFlags = process.argv.includes('--flags');

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) {
      if (e === 'node_modules' || e.startsWith('.git')) continue;
      walk(path.join(p, e), out);
    }
  } else if (/\.(html|js|cjs|json)$/.test(p)) out.push(p);
}

const roots = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = [];
for (const r of roots) walk(r, files);

// An emoji codepoint (used for both literal chars and decoded HTML entities).
function isEmojiCp(cp) {
  return (cp >= 0x2300 && cp <= 0x27BF) || (cp >= 0x2B00 && cp <= 0x2BFF) ||
         (cp >= 0x1F000 && cp <= 0x1FAFF) ||
         (wantFlags && cp >= 0x1F1E6 && cp <= 0x1F1FF);
}

let total = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const chars = new Set();
  for (const ch of s) {
    if (EMOJI.test(ch)) chars.add(ch);
    if (wantFlags && FLAG.test(ch)) chars.add(ch);
  }
  // HTML numeric entities: &#128506; (decimal) or &#x1F5FA; (hex)
  let m;
  const decRe = /&#(\d+);/g;
  while ((m = decRe.exec(s))) { const cp = parseInt(m[1], 10); if (isEmojiCp(cp)) chars.add(m[0]); }
  const hexRe = /&#x([0-9a-fA-F]+);/g;
  while ((m = hexRe.exec(s))) { const cp = parseInt(m[1], 16); if (isEmojiCp(cp)) chars.add(m[0]); }
  if (chars.size) {
    total++;
    console.log(chars.size + '  ' + path.relative(process.cwd(), f) + ': ' + [...chars].join(' '));
  }
}
console.log('--- files with emoji: ' + total + ' ---');

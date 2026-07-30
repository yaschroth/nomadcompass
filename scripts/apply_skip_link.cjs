/**
 * Accessibility: injects a "Skip to main content" link as the first focusable element on every
 * page (keyboard users can bypass the nav), and gives the <main> a focus target. Idempotent +
 * CRLF-safe. Runs over all full HTML pages (files that have both <body> and <main>).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP = '<a href="#main-content" class="skip-link">Skip to main content</a>';

function walk(p, out) {
  for (const e of fs.readdirSync(p)) {
    if (e === 'node_modules' || e.startsWith('.git') || e === 'ui-ux-pro-max-skill' || e === 'components') continue;
    const fp = path.join(p, e);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, out);
    else if (e.endsWith('.html')) out.push(fp);
  }
}

const files = [];
walk(ROOT, files);
let done = 0, skipped = 0, noBody = 0;
for (const abs of files) {
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('class="skip-link"')) { skipped++; continue; }
  if (!/<body[^>]*>/.test(s) || !/<main\b/.test(s)) { noBody++; continue; }
  const before = s;
  // 1. skip link as the first thing after <body>
  s = s.replace(/(<body[^>]*>)/, `$1\n  ${SKIP}`);
  // 2. focus target on <main> (only if it has no id yet)
  s = s.replace(/<main\b(?![^>]*\bid=)/, '<main id="main-content" tabindex="-1"');
  if (s !== before) { fs.writeFileSync(abs, s); done++; }
}
console.log(`skip-link added: ${done}, already-had: ${skipped}, no body/main (skipped): ${noBody}`);

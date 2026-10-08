require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts the "Get listed" button in the header of every page (desktop bar and mobile menu).
 * The markup and the insert rules live in lib/nav_cta.cjs; this only walks the site.
 * Idempotent: every run strips and re-inserts, so a doubled button collapses.
 *
 * Usage: node scripts/apply_nav_cta.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const { withNavCta } = require('./lib/nav_cta.cjs');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill', 'components', 'logos', 'public', 'api']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

let written = 0, same = 0, noNav = 0;
for (const abs of walk(ROOT, [])) {
  const html = fs.readFileSync(abs, 'utf8');
  if (!/<nav class="nav"/.test(html)) { noNav++; continue; }
  const next = withNavCta(html);
  if (next === html) { same++; continue; }
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}
console.log('Header "Get listed" button: ' + written + ' page(s) written, ' + same + ' already current'
  + (noNav ? ', ' + noNav + ' without the shared nav skipped' : '') + (DRY ? '  [dry run]' : ''));

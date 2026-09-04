/**
 * Every local file a page asks for must exist.
 *
 * apply_flag_svgs.cjs rewrites the hero flag emoji into <img src="/assets/flags/<iso>.svg"> and
 * never checked the file was there. 58 of the 182 flag codes the site references had no SVG on
 * disk, so those city pages replaced a readable two-letter fallback with a broken-image icon and
 * every gate stayed green: nothing on the site verified that a referenced asset resolves.
 *
 * This checks src, href and content attributes pointing at a root-relative local file. External
 * URLs, anchors, mailto and query strings are not this gate's business, and neither are
 * tests/fixtures, which are third-party pages saved verbatim to test the service parsers against.
 *
 * Usage: node scripts/check_local_assets.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill']);
const EXT = 'svg|webp|png|jpe?g|gif|ico|css|js|mjs|json|xml|txt|woff2?|pdf|avif';
const RE = new RegExp('(?:src|href|content)="(/[^"]+\\.(?:' + EXT + '))"', 'g');

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
}(ROOT));

const missing = new Map();
let refs = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(RE)) {
    const url = m[1];
    // A path built at runtime ("/assets/flags/'+code+'.svg") is script, not a reference.
    if (/['`+${}]/.test(url)) continue;
    refs++;
    if (fs.existsSync(path.join(ROOT, decodeURIComponent(url).slice(1)))) continue;
    if (!missing.has(url)) missing.set(url, []);
    const seen = missing.get(url);
    if (seen.length < 4) seen.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}

console.log('LOCAL ASSET GATE  (a page never points at a file that is not there)\n');
console.log('  ' + pages.length + ' pages, ' + refs + ' local file references\n');

if (!missing.size) {
  console.log('  clean: every local file a page asks for exists.');
  process.exit(0);
}

let broken = 0;
for (const [url, where] of missing) broken += where.length;
console.log('  FAIL: ' + missing.size + ' missing file(s)\n');
for (const [url, where] of [...missing].slice(0, 30)) {
  console.log('    ' + url);
  console.log('        ' + where.join(', '));
}
if (missing.size > 30) console.log('    ... and ' + (missing.size - 30) + ' more');
process.exit(1);

/**
 * Gate: a licensed photograph is never shown without its credit.
 *
 * 655 of the 713 city photographs carry a Creative Commons licence that requires the photographer
 * to be named. For a long time only the city and services pages did it, and the home page, /cities,
 * the rankings, the tier lists and the head-to-heads showed the same images with nothing at all.
 * That is a licence term unmet, and no gate was watching for it because nothing was broken.
 *
 * Two ways a page may satisfy it, checked per photograph:
 *
 *   1. The page names the photographer itself.
 *   2. The page links to /cities/<slug> or /services/<slug>..., which names them beside the same
 *      image, AND the page says so. The hyperlink route is what CC BY 4.0 section 3(a)(2) allows;
 *      the sentence is what makes it findable, and without it the link is just a link.
 *
 * CC0 and public-domain images ask for nothing and are not checked.
 *
 * Usage: node scripts/check_photo_credit.cjs [--all]
 * Exit 1 if any page shows a photograph it does not credit by one of those two routes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');

const NO_CREDIT_NEEDED = /^(CC0|Public domain)$/i;

const ATTRIB = (() => {
  const f = path.join(ROOT, 'images', 'cities', 'attribution.json');
  if (!fs.existsSync(f)) return {};
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
  return Array.isArray(raw) ? Object.fromEntries(raw.map((r) => [r.slug, r])) : raw;
})();

const SKIP_TOP = new Set(['node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill', 'tests', 'logos', 'components']);

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }
    if (e.name.endsWith('.html')) pages.push({ abs: p, rel: r });
  }
})(ROOT, '');

const errors = [];
let checked = 0;
let photos = 0;
let byName = 0;
let byLink = 0;

// A photograph with no attribution entry at all cannot be credited by anyone, which is a data
// problem rather than a page problem, but it is still an image on the site with no source.
const orphanImages = new Set();

/**
 * The page as its text reads, not as its markup is stored.
 *
 * One photographer is credited as "Mariordo (Mario Duran & German Valverde)", which the page holds
 * as "&amp;". Matching the raw markup reported Santo Domingo as uncredited on a page carrying the
 * credit in full. Decode first, the same way check_meta.cjs does.
 */
const decode = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');

for (const { abs, rel } of pages) {
  const raw = fs.readFileSync(abs, 'utf8');
  const html = decode(raw);
  const all = [...new Set(
    [...html.matchAll(/\/images\/cities\/([a-z0-9-]+?)(?:-card|-m|-t)?\.webp/g)].map((m) => m[1]),
  )];
  if (!all.length) continue;

  all.filter((s) => !ATTRIB[s]).forEach((s) => orphanImages.add(s));

  const slugs = all.filter((s) => ATTRIB[s] && !NO_CREDIT_NEEDED.test(ATTRIB[s].license || ''));
  if (!slugs.length) continue;
  checked++;
  photos += slugs.length;

  // Route 2 needs both halves: the link and a sentence telling the reader the link is the credit.
  const saysSo = /names its photographer and licence on that city's own page/.test(html);
  const missing = [];
  for (const s of slugs) {
    const a = ATTRIB[s] || {};
    const author = String(a.author || '').trim();
    // Route 1: the photographer's own name appears on the page.
    if (author && html.includes(author)) { byName++; continue; }
    // Route 2: a link to a page that credits it, plus the sentence.
    if (saysSo && new RegExp('href="/(cities|services)/' + s + '(/|")').test(html)) { byLink++; continue; }
    missing.push(s + (author ? ' (' + author + ')' : ''));
  }
  if (missing.length) {
    errors.push(rel + ': ' + missing.length + ' uncredited photograph'
      + (missing.length === 1 ? '' : 's') + '  ' + missing.slice(0, 4).join(', ')
      + (missing.length > 4 ? ', ...' : ''));
  }
}

console.log('PHOTO CREDIT GATE  (a licensed image is never shown without naming its photographer)\n');
console.log('  ' + checked + ' pages show ' + photos + ' licensed city photographs');
console.log('  credited by name on the page: ' + byName);
console.log('  credited by link to the page that names them: ' + byLink + '\n');

if (orphanImages.size) {
  console.log('  warning: ' + orphanImages.size + ' image(s) with no attribution entry: '
    + [...orphanImages].slice(0, 6).join(', ') + '\n');
}

if (errors.length) {
  console.log('  ERRORS (' + errors.length + ' page(s)):');
  errors.slice(0, SHOW_ALL ? errors.length : 20).forEach((e) => console.log('    ' + e));
  if (!SHOW_ALL && errors.length > 20) console.log('    ... and ' + (errors.length - 20) + ' more (--all)');
  process.exit(1);
}
console.log('  clean: every licensed photograph on the site is credited.');

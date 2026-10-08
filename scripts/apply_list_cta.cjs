require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The "list your business" banner above the footer of every page.
 *
 * It asks providers who work in more than one language to add themselves to the services
 * directory through the form on /list-your-business, which mails info@topblog.agency.
 *
 * Refresh, never insert-if-missing: every run strips every copy of the block and writes exactly one,
 * so a change to the wording or the city count reaches all pages, and a doubled block collapses.
 * On a city page and on a service page for that city the banner names the city and the button
 * carries it as #city=<slug>, which the form reads to preselect it. A fragment, not a query string,
 * so search engines see one URL for the form, not a thousand.
 *
 * The block lives directly before <footer class="footer">. Its styles are in styles/footer.css,
 * which every page with that footer already links. _safe_write.cjs carries the block through any
 * generator that rewrites a page without it, so a rebuild does not silently drop it.
 *
 * Usage: node scripts/apply_list_cta.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const { stats } = require('./lib/site-stats.cjs');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const OPEN = '<!-- list-cta -->';
const CLOSE = '<!-- /list-cta -->';
const STRIP = /[ \t]*<!-- list-cta -->[\s\S]*?<!-- \/list-cta -->[ \t]*\r?\n?/g;
const FOOTER = '<footer class="footer"';

// Not site pages: third-party fixtures, generator templates, logo previews, and the form itself.
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill', 'components', 'logos', 'public', 'api']);
const SKIP_FILES = new Set(['list-your-business.html']);

// [name, slug, country] for every city, the same list the nav search uses.
const sandbox = { window: {} };
new Function('window', fs.readFileSync(path.join(ROOT, 'assets', 'city-search-index.js'), 'utf8'))(sandbox.window);
const CITY = new Map((sandbox.window.NOMAD_CITIES || []).map((c) => [c[1], c[0]]));
if (!CITY.size) { console.error('apply_list_cta: assets/city-search-index.js gave no cities.'); process.exit(1); }
const COUNT = stats().cities;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function cityOf(rel) {
  const m = rel.match(/^cities\/([^/]+)\.html$/) || rel.match(/^services\/([^/.]+)(?:\.html$|\/)/);
  return m && CITY.has(m[1]) ? m[1] : null;
}

function block(indent, slug) {
  const where = slug ? 'in ' + esc(CITY.get(slug)) : 'in one of our ' + COUNT.toLocaleString('en-US') + ' cities';
  const href = '/list-your-business' + (slug ? '#city=' + slug : '');
  // Styled as the top section of the footer (styles/footer.css), inside the footer's own .container
  // so its left edge lines up with the footer columns below.
  return indent + OPEN + '\n'
    + indent + '<aside class="list-cta" aria-label="List your business">\n'
    + indent + '  <div class="container"><div class="list-cta-inner">\n'
    + indent + '    <div class="list-cta-text">\n'
    + indent + '      <p class="list-cta-eyebrow">For local businesses</p>\n'
    + indent + '      <p class="list-cta-title">Serve clients in <em>more than one language?</em></p>\n'
    + indent + '      <p class="list-cta-body">If your clinic, law firm, translation office or practice is ' + where
    + ', add it to our directory of services sorted by language. Listing is free.</p>\n'
    + indent + '    </div>\n'
    + indent + '    <a class="list-cta-btn" href="' + href + '">List your business' + ARROW + '</a>\n'
    + indent + '  </div></div>\n'
    + indent + '</aside>\n'
    + indent + CLOSE + '\n';
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

let written = 0, same = 0, collapsed = 0, withCity = 0;
const noFooter = [];
for (const abs of walk(ROOT, [])) {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  if (SKIP_FILES.has(rel)) continue;
  const html = fs.readFileSync(abs, 'utf8');
  const copies = (html.match(/<!-- list-cta -->/g) || []).length;
  const bare = html.replace(STRIP, '');
  const at = bare.indexOf(FOOTER);
  if (at === -1) { noFooter.push(rel); continue; }
  const lineStart = bare.lastIndexOf('\n', at) + 1;
  const indent = /^[ \t]*$/.test(bare.slice(lineStart, at)) ? bare.slice(lineStart, at) : '';
  const insertAt = indent ? lineStart : at;
  const slug = cityOf(rel);
  if (slug) withCity++;
  const next = bare.slice(0, insertAt) + block(indent, slug) + bare.slice(insertAt);
  if (copies > 1) collapsed++;
  if (next === html) { same++; continue; }
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}

console.log('List-your-business banner: ' + written + ' page(s) written, ' + same + ' already current, '
  + withCity + ' name their city' + (collapsed ? ', ' + collapsed + ' doubled block(s) collapsed' : '') + (DRY ? '  [dry run]' : ''));
if (noFooter.length) console.log('  no shared footer, skipped: ' + noFooter.length + ' (' + noFooter.slice(0, 5).join(', ') + ')');

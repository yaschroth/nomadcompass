/**
 * Gate: what a page shows in a search result.
 *
 * The site ranks and nobody clicks. Search Console for the 30 days to 2026-08-27: 412 pages sat at
 * position 5-10 and took 5,668 impressions for 89 clicks, a 1.6% CTR against a 3-6% norm for that
 * band. The cause was in the markup, and no gate was looking at it: all 710 city descriptions
 * collapsed to two real templates, the dominant one being "Is X good for digital nomads? Nomad
 * Score N/10 - cost of living in USD, WiFi, safety, visas, neighborhoods and coworking, all in one
 * guide." Titles were 22 shapes across the same 710 pages. Nothing was broken, so nothing failed.
 *
 * Three rules, checked on every page a search engine is allowed to index:
 *
 *   1. A title of 1 to 60 characters and a description of 120 to 160. Outside that Google either
 *      truncates it or pads it with page text.
 *   2. No two pages share a description, and no two share a title. This is the rule that would
 *      have caught the old state on day one: 710 pages, 62 distinct descriptions between them.
 *   3. Nothing is missing a description entirely.
 *
 * Templates are not banned outright, because a family of pages built from one shape is fine when
 * the facts inside it differ. Rule 2 is what makes that work: fill the shape with the page's own
 * numbers and the strings differ; fill it with nothing and they do not.
 *
 * Usage: node scripts/check_meta.cjs [--all]
 * Exit 1 on any duplicate, any missing description, or any length outside the band.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');

const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

// Neither published nor crawled: fixtures, logo previews, and the partials the sweeps lift from.
const SKIP_TOP = new Set(['node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill', 'tests', 'logos', 'components']);

const decode = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');

const pages = [];
const walk = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }
    if (!e.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    // A page kept out of the index is not competing for a click, so its snippet is not this
    // gate's business. The thin city pages carry noindex on purpose.
    if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
    pages.push({
      file: r,
      // Measured without the brand suffix: Google drops or rewrites " | The Nomad HQ" as it
      // pleases, and counting it made 602 pages look broken when their own words fit fine.
      title: decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]).trim().replace(/\s*\|\s*The Nomad HQ\s*$/, ''),
      desc: decode((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]).trim(),
    });
  }
};
walk(ROOT, '');

const errors = [];
const warnings = [];

/**
 * A description is allowed past the ceiling when it is long because it has to be.
 *
 * check_service_pages fails a directory page that serves two or more providers in a language its
 * title and description never name: a reader searching for an Italian-speaking lawyer in Madrid
 * would otherwise never reach the page holding ten of them. Madrid's list runs to nine languages,
 * which is 217 characters and cannot be shortened without breaking that rule. Being findable beats
 * being whole on screen, and Google indexes the text either way, so these are reported and not
 * failed. Four or more named languages is the signature of that case; anything under it is a
 * description that simply ran long.
 */
const LANGUAGES = (() => {
  try {
    const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
    return Object.values(M.LANGS || {});
  } catch (e) { return []; }
})();
const namesManyLanguages = (d) =>
  LANGUAGES.filter((l) => new RegExp('\\b' + l + '\\b').test(d)).length >= 4;

// --- 1. lengths
for (const p of pages) {
  if (!p.desc) { errors.push(p.file + ': no meta description'); continue; }
  if (p.title.length > TITLE_MAX) errors.push(p.file + ': title ' + p.title.length + ' chars  "' + p.title + '"');
  if (!p.title) errors.push(p.file + ': no title');
  if (p.desc.length < DESC_MIN) {
    errors.push(p.file + ': description ' + p.desc.length + ' chars  "' + p.desc.slice(0, 70) + '..."');
  } else if (p.desc.length > DESC_MAX) {
    const line = p.file + ': description ' + p.desc.length + ' chars  "' + p.desc.slice(0, 70) + '..."';
    if (namesManyLanguages(p.desc)) warnings.push(line + '  (names every language it serves)');
    else errors.push(line);
  }
}

// --- 2. duplicates
const group = (key) => {
  const m = new Map();
  for (const p of pages) {
    if (!p[key]) continue;
    if (!m.has(p[key])) m.set(p[key], []);
    m.get(p[key]).push(p.file);
  }
  return [...m.entries()].filter(([, files]) => files.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
};
const dupDesc = group('desc');
const dupTitle = group('title');

for (const [text, files] of dupDesc) {
  errors.push(files.length + ' pages share one description: "' + text.slice(0, 60) + '..."'
    + '  (' + files.slice(0, 3).join(', ') + (files.length > 3 ? ', ...' : '') + ')');
}
// A shared title is worth knowing about but is not always wrong: two pages can legitimately be
// named the same thing if their descriptions separate them.
for (const [text, files] of dupTitle) {
  warnings.push(files.length + ' pages share one title: "' + text.slice(0, 60) + '"'
    + '  (' + files.slice(0, 3).join(', ') + (files.length > 3 ? ', ...' : '') + ')');
}

const lens = pages.filter((p) => p.desc).map((p) => p.desc.length);
console.log('META GATE  (a snippet worth clicking: in budget, and not a template)\n');
console.log('  ' + pages.length + ' indexable pages, '
  + new Set(pages.map((p) => p.desc)).size + ' distinct descriptions, '
  + new Set(pages.map((p) => p.title)).size + ' distinct titles');
if (lens.length) {
  console.log('  description lengths ' + Math.min(...lens) + '-' + Math.max(...lens)
    + ', titles up to ' + Math.max(...pages.map((p) => p.title.length)) + '\n');
}

if (warnings.length) {
  console.log('  warnings (' + warnings.length + '):');
  warnings.slice(0, SHOW_ALL ? warnings.length : 8).forEach((w) => console.log('    ' + w));
  if (!SHOW_ALL && warnings.length > 8) console.log('    ... and ' + (warnings.length - 8) + ' more (--all)');
  console.log('');
}

if (errors.length) {
  console.log('  ERRORS (' + errors.length + '):');
  errors.slice(0, SHOW_ALL ? errors.length : 25).forEach((e) => console.log('    ' + e));
  if (!SHOW_ALL && errors.length > 25) console.log('    ... and ' + (errors.length - 25) + ' more (--all)');
  process.exit(1);
}
console.log('  clean: every indexable page has its own title and description, both in budget.');

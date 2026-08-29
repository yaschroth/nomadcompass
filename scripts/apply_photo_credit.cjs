require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Attribution for the city photographs, on every page that shows one.
 *
 * 713 city photographs come from Wikimedia Commons and 655 of them carry a licence that requires
 * credit: 302 CC BY-SA 4.0, 102 CC BY 2.0, 87 CC BY-SA 3.0, and so on down to a single Free Art
 * License. Only the 46 CC0 and 12 public-domain images may be used without naming anyone.
 *
 * The city pages and the services pages have always credited their own hero. Nothing else did. The
 * home page, /cities, all 32 rankings, 34 tier lists, 107 head-to-heads and the activities pages
 * showed those same photographs with no credit and no statement that a licence applied at all,
 * which is a term of the licence unmet, not a matter of taste. For a site whose whole position is
 * that every figure names its source, it is also the wrong thing to be caught doing.
 *
 * Two ways a photograph gets its credit here, and which one applies is decided per photograph:
 *
 *   linked    The page links to /cities/<slug> or /services/<slug>..., and that page names the
 *             photographer beside the same image. CC BY 4.0 section 3(a)(2) allows the conditions
 *             to be satisfied "by providing a URI or hyperlink to a resource that includes the
 *             required information", which is how Wikimedia reusers normally handle a grid of
 *             hundreds. What was missing was any sentence saying so, so a reader had no way to
 *             know the link was also the credit. That sentence is now there.
 *   named     No such link exists, so the photographer is named on this page. This is the ranking
 *             tile backgrounds, the "related" thumbnails and the tier-list decorations: 953
 *             photographs across 384 pages, at most 20 on any one page.
 *
 * The block is idempotent and rewritten whole on every run, so a page that gains or loses a
 * photograph gets the right credit on the next sweep. check_photo_credit.cjs is the gate.
 *
 * Run late, after anything that adds or removes images. Before apply_entity_schema.cjs, which
 * must be the last writer.
 *
 * Usage: node scripts/apply_photo_credit.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The two licences that ask for nothing. Everything else on this list requires a name. */
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

const CSS = `<style>
    .photo-credit { max-width: var(--container, 1200px); margin: 0 auto; padding: 0 var(--space-4, 1rem) var(--space-8, 3rem); }
    .photo-credit p { margin: 0; font-size: var(--text-xs, .78rem); line-height: 1.6; color: var(--color-stone, #7a7266); }
    .photo-credit a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
    .photo-credit a:hover { color: var(--color-ink, #1a1a1a); }
  </style>`;

const OPEN = '<!-- photo-credit -->';
const CLOSE = '<!-- /photo-credit -->';
const BLOCK_RE = /\n?[ \t]*<!-- photo-credit -->[\s\S]*?<!-- \/photo-credit -->/g;

/** One photographer, linked to the file page the image came from. */
function nameOf(slug) {
  const a = ATTRIB[slug] || {};
  const who = a.author ? esc(a.author) : 'Unknown photographer';
  const lic = a.license ? ' (' + esc(a.license) + ')' : '';
  return a.sourcePageUrl
    ? `<a href="${esc(a.sourcePageUrl)}" target="_blank" rel="nofollow noopener">${who}</a>${lic}`
    : who + lic;
}

let written = 0;
let named = 0;
let removed = 0;
const skipped = [];

for (const { abs, rel } of pages) {
  let html = fs.readFileSync(abs, 'utf8');
  const bare = html.replace(BLOCK_RE, '');

  // Every city photograph on the page, measured on the page without its own credit block so a
  // rerun cannot read last run's output as evidence.
  const slugs = [...new Set(
    [...bare.matchAll(/\/images\/cities\/([a-z0-9-]+?)(?:-card|-m|-t)?\.webp/g)].map((m) => m[1]),
  )].filter((s) => ATTRIB[s] && !NO_CREDIT_NEEDED.test(ATTRIB[s].license || ''));

  if (!slugs.length) {
    // A page that used to show one and no longer does keeps a credit for nothing.
    if (html !== bare) { if (!DRY) fs.writeFileSync(abs, bare); removed++; }
    continue;
  }

  // Does the page link to a page that carries this photograph's own credit? /cities/<slug> and
  // everything under /services/<slug> do; both name the photographer beside the same image.
  const linksToCredit = (s) => new RegExp('href="/(cities|services)/' + s + '(/|")').test(bare);
  const unlinked = slugs.filter((s) => !linksToCredit(s));
  const linked = slugs.filter(linksToCredit);

  const parts = [];
  if (unlinked.length) {
    // One entry per photographer and licence, not per photograph. Vyacheslav Argenberg took two of
    // the images on the WiFi ranking, both CC BY 4.0, and naming him twice in the same sentence
    // reads as a bug rather than as a fuller credit.
    const seen = new Set();
    const list = unlinked.slice()
      .sort((a, b) => String((ATTRIB[a] || {}).author || '')
        .localeCompare(String((ATTRIB[b] || {}).author || '')))
      .filter((s) => {
        const a = ATTRIB[s] || {};
        const k = (a.author || '?') + '|' + (a.license || '');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    parts.push(`Photographs: ${list.map(nameOf).join(', ')}.`);
    named += unlinked.length;
  }
  if (linked.length) {
    parts.push(unlinked.length
      ? `Every other city photograph names its photographer and licence on that city's own page.`
      : `Each city photograph names its photographer and licence on that city's own page.`);
  }
  const lede = 'City photographs come from '
    + '<a href="https://commons.wikimedia.org/" target="_blank" rel="nofollow noopener">Wikimedia Commons</a>'
    + ', reused under the Creative Commons licence each one names.';

  const indent = '  ';
  const block = `\n${indent}${OPEN}\n${indent}${CSS}\n`
    + `${indent}<aside class="photo-credit">\n`
    + `${indent}  <p>${lede} ${parts.join(' ')}</p>\n`
    + `${indent}</aside>\n${indent}${CLOSE}`;

  // Between the content and the footer, which every page of every family has.
  const at = bare.lastIndexOf('</main>');
  if (at === -1) { skipped.push(rel + ' (no </main>)'); continue; }
  const next = bare.slice(0, at + '</main>'.length) + block + bare.slice(at + '</main>'.length);

  if (next === html) continue;
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}

console.log('Photo credit: ' + written + ' page(s) written, ' + named + ' photographer(s) named inline'
  + (removed ? ', ' + removed + ' stale block(s) removed' : '') + (DRY ? '  [dry run]' : ''));
if (skipped.length) console.log('  skipped: ' + skipped.slice(0, 6).join(', '));

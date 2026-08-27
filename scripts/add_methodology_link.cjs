require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts /methodology into the footer's legal-and-company row on every page.
 *
 * The page is only worth building if a reader can find it. It goes beside About rather than in the
 * Explore column because it is the same kind of link: what this site is and how it works, not
 * another thing to browse.
 *
 * Idempotent. Usage: node scripts/add_methodology_link.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const ANCHOR = '<a href="/about">About</a>';
const LINK = '<a href="/methodology">Methodology</a>';

// The core pages and the two index pages carry the newer dark-navy footer instead: no footer-legal
// row, but a Company column built from footer-link list items. Same link, different shape.
const COL_ANCHOR = '<li><a href="/about" class="footer-link">About</a></li>';
const COL_LINK = '<li><a href="/methodology" class="footer-link">Methodology</a></li>';

const SKIP_TOP = new Set(['node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill']);

let done = 0;
let already = 0;
let noFooter = 0;
let repaired = 0;
let column = 0;

const walk = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }
    if (!e.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    let out = html;

    // Repair: an earlier version replaced the first "/about" link in the document, and the blog
    // footer has a Company column above the legal row whose About link matched first. Those 26 pages
    // ended up with two anchors inside one <li>.
    if (/<li><a href="\/about">About<\/a><a href="\/methodology">Methodology<\/a><\/li>/.test(out)) {
      out = out.replace('<li><a href="/about">About</a><a href="/methodology">Methodology</a></li>',
        '<li><a href="/about">About</a></li><li><a href="/methodology">Methodology</a></li>');
      repaired += 1;
    }

    const at = out.indexOf('footer-legal');
    if (at < 0) {
      if (out.includes(COL_ANCHOR) && !out.includes(COL_LINK)) {
        out = out.replace(COL_ANCHOR, COL_ANCHOR + COL_LINK);
        column += 1;
      } else if (out.includes(COL_LINK)) {
        already += 1;
      } else {
        noFooter += 1;
      }
      if (APPLY && out !== html) fs.writeFileSync(p, out);
      continue;
    }
    // Everything is scoped to the legal row: finding the anchor, testing whether the link is already
    // there, and inserting. A document-wide includes() matched the 126 city pages whose venue source
    // note links to /methodology and called them done.
    const end = out.indexOf('</nav>', at);
    const row = out.slice(at, end);
    if (!row.includes('/methodology')) {
      if (!row.includes(ANCHOR)) { noFooter += 1; } else {
        out = out.slice(0, at) + row.replace(ANCHOR, ANCHOR + LINK) + out.slice(end);
        done += 1;
      }
    } else {
      already += 1;
    }

    if (APPLY && out !== html) fs.writeFileSync(p, out);
  }
};
walk(ROOT, '');

console.log(done + ' pages given a footer link to /methodology');
if (already) console.log('  ' + already + ' already had one');
if (repaired) console.log('  ' + repaired + ' blog footers repaired: the link had landed inside the Company list item');
if (column) console.log('  ' + column + ' given one in the Company column of the dark-navy footer');
if (noFooter) console.log('  ' + noFooter + ' have no footer-legal row to add it to');
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

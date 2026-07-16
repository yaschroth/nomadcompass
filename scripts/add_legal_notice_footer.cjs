/**
 * Adds a "/legal-notice" link to the footer of every existing page, handling both
 * footer variants: the footer-grid "Legal" column (li list) and the older
 * footer-legal bottom nav. Idempotent. Usage: node scripts/add_legal_notice_footer.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const files = [];
for (const f of fs.readdirSync(ROOT)) if (f.endsWith('.html')) files.push(path.join(ROOT, f));
for (const dir of ['cities', 'blog', 'best', 'about']) {
  const d = path.join(ROOT, dir);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith('.html')) files.push(path.join(d, f));
}

let grid = 0, nav = 0, already = 0, none = 0;
for (const abs of files) {
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('/legal-notice')) { already++; continue; }
  let done = false;
  // Style A: footer-grid Legal column -> after the Terms of Service li
  const gridRe = /(<li><a href="\/terms" class="footer-link">Terms of Service<\/a><\/li>)/;
  if (gridRe.test(s)) {
    s = s.replace(gridRe, `$1\n            <li><a href="/legal-notice" class="footer-link">Legal Notice</a></li>`);
    grid++; done = true;
  }
  // Style B: footer-legal bottom nav -> after Terms, matching whitespace before </nav>
  const navRe = /(<a href="\/terms">Terms<\/a>)(\s*)(<\/nav>)/;
  if (!done && navRe.test(s)) {
    s = s.replace(navRe, `$1$2<a href="/legal-notice">Legal Notice</a>$2$3`);
    nav++; done = true;
  }
  if (done) fs.writeFileSync(abs, s); else none++;
}
console.log(`legal-notice footer link added -> grid: ${grid}, nav: ${nav} | already: ${already} | no footer match: ${none}`);

require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Sitewide: injects a small GA4 click tracker for affiliate links before </body>. On any click of a
 * Travelpayouts link (*.tpx.li / tp.media / tp-em.com) it fires a GA4 'affiliate_click' event with
 * the partner (subdomain), the destination URL and the page path. Uses the existing gtag/Consent
 * Mode setup, no cookies of its own. Idempotent (<!-- aff-track -->), CRLF-aware, skips files with
 * no </body>. Usage: node scripts/apply_affiliate_tracking.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SNIPPET = [
  '<!-- aff-track -->',
  '<script>(function(){',
  '  document.addEventListener("click", function (e) {',
  '    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;',
  '    if (!a) return;',
  '    var h = a.href || "";',
  '    if (!/(?:tpx\\.li|tp-em\\.com|tp\\.media)/.test(h)) return;',
  '    if (typeof gtag !== "function") return;',
  '    var m = h.match(/^https?:\\/\\/([a-z0-9-]+)\\.tpx\\.li/);',
  '    var partner = m ? m[1] : "travelpayouts";',
  '    gtag("event", "affiliate_click", {',
  '      affiliate_partner: partner,',
  '      affiliate_placement: a.getAttribute("data-aff") || "",',
  '      link_url: h,',
  '      page_path: location.pathname',
  '    });',
  '  }, true);',
  '})();</script>',
  '<!-- /aff-track -->',
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
}

const files = [];
walk(ROOT, files);
let done = 0, skipped = 0, noBody = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('<!-- aff-track -->')) { skipped++; continue; }
  if (!s.includes('</body>')) { noBody++; continue; }
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const block = SNIPPET.join(eol) + eol;
  s = s.replace('</body>', block + '</body>');
  fs.writeFileSync(f, s);
  done++;
}
console.log(`aff-track injected: ${done} | already-present: ${skipped} | no </body>: ${noBody}`);

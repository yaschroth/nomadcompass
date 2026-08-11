require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds a subtle transport affiliate aside at the end of each city page's "Getting Around" section:
 * airport transfer (GetTransfer) + car rental (Auto Europe, QEEQ), Travelpayouts links,
 * rel="sponsored nofollow", data-aff="transport" (for GA4 tracking). Idempotent
 * (skips pages already carrying gettransfer.tpx.li), CRLF-safe. Inserts just before the next <h2>
 * after "Getting Around". Usage: node scripts/apply_affiliate_transport.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const LINE =
  '<p class="aff-transport" style="font-size:.92rem;color:var(--color-stone);background:var(--color-sand,#f6f1e7);border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:10px;padding:.7rem .95rem;margin:1rem 0 1.4rem;">' +
  '<strong style="color:var(--color-charcoal);font-weight:600;">Sorting transport?</strong> ' +
  'Book an <a href="https://gettransfer.tpx.li/VsXIPChy" target="_blank" rel="sponsored nofollow" data-aff="transport">airport transfer</a>, ' +
  'or compare car rental on <a href="https://autoeurope.tpx.li/jKF6nkTd" target="_blank" rel="sponsored nofollow" data-aff="transport">Auto Europe</a> ' +
  'and <a href="https://qeeq.tpx.li/wWufeCEY" target="_blank" rel="sponsored nofollow" data-aff="transport">QEEQ</a>.</p>';

// capture the Getting Around section up to the next <h2, insert the line before that <h2
const RE = /(<h2[^>]*>\s*Getting Around\s*<\/h2>[\s\S]*?)(\r?\n\s*<h2)/;

const dir = path.join(ROOT, 'cities');
let done = 0, skipped = 0, noSection = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(dir, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('gettransfer.tpx.li')) { skipped++; continue; }
  if (!RE.test(s)) { noSection.push(f.replace('.html', '')); continue; }
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace(RE, (m, sec, nextH2) => sec + eol + LINE + nextH2);
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`transport aside added: ${done} | already-present: ${skipped} | no Getting-Around section: ${noSection.length}`);
if (noSection.length) console.log('  skipped:', noSection.slice(0, 8).join(', '));

/**
 * Turns the "eSIM: Airalo / Holafly" value in the Nomad Facts panel into an affiliate link on
 * "Airalo" (Travelpayouts). Idempotent (skips pages already linking airalo.tpx.li), CRLF-safe.
 * Surgical: only the eSIM fact value is touched, the rest of the panel is untouched.
 * Usage: node scripts/apply_affiliate_esim.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const OLD = '<span class="fact-value">eSIM: Airalo / Holafly</span>';
const NEW = '<span class="fact-value">eSIM: <a href="https://airalo.tpx.li/THf7i0S1" target="_blank" rel="sponsored nofollow">Airalo</a> / Holafly</span>';

const dir = path.join(ROOT, 'cities');
let done = 0, skipped = 0, noMatch = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(dir, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('airalo.tpx.li')) { skipped++; continue; }
  if (!s.includes(OLD)) { noMatch.push(f.replace('.html', '')); continue; }
  s = s.replace(OLD, NEW);
  fs.writeFileSync(abs, s);
  done++;
}
console.log(`eSIM affiliate link added: ${done} | already-linked: ${skipped} | no eSIM fact: ${noMatch.length}`);
if (noMatch.length) console.log('  no-match:', noMatch.slice(0, 8).join(', '));

/**
 * Adds a visible YMYL disclaimer wherever we publish visa, immigration or tax guidance.
 *
 * Why: these are "Your Money or Your Life" topics. Someone can book a flight or file a
 * return on the strength of what we wrote. 530 of 710 city pages carried no caveat at
 * all, and the two visa tools carried none, so this was the largest correctness-of-duty
 * gap on the site rather than a cosmetic one.
 *
 * The note goes at the END of the visa section, after the reader has the information,
 * not before it, so it reads as a qualifier rather than a warning label.
 *
 * Idempotent via the ymyl-note class. Usage: node scripts/apply_ymyl_notice.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const VISA_NOTE =
  '<p class="ymyl-note"><strong>General information, not legal advice.</strong> ' +
  'Visa rules change often and turn on your nationality, income and reason for staying. ' +
  'Confirm the current requirements with the country’s immigration authority or a qualified ' +
  'immigration adviser before you book anything.</p>';

const TAX_NOTE =
  '<p class="ymyl-note"><strong>General information, not tax advice.</strong> ' +
  'Tax residency and what you owe depend on your own circumstances and on treaties between ' +
  'the countries involved. Speak to a qualified tax adviser in both jurisdictions before you ' +
  'act on anything here.</p>';

let city = 0, tool = 0, blog = 0, skipped = 0;

// --- city pages: end of the "Visas" section ---
const CITY = path.join(ROOT, 'cities');
for (const f of fs.readdirSync(CITY).filter(f => f.endsWith('.html'))) {
  const p = path.join(CITY, f);
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('ymyl-note')) { skipped++; continue; }
  // Attribute-tolerant on the heading, CRLF-tolerant on the boundary: both have bitten
  // sweeps in this repo before.
  const start = s.search(/<h2[^>]*\bid="visas"[^>]*>/);
  if (start < 0) { skipped++; continue; }
  const rest = s.slice(start + 10);
  const nextH2 = rest.search(/<h2[^>]*>/);
  if (nextH2 < 0) { skipped++; continue; }
  const insertAt = start + 10 + nextH2;
  s = s.slice(0, insertAt) + VISA_NOTE + '\n          ' + s.slice(insertAt);
  if (!DRY) fs.writeFileSync(p, s);
  city++;
}

// --- visa tools: after the intro, before the interactive part ---
for (const [file, note, anchor] of [
  ['visa.html', VISA_NOTE, /<\/section>/],
  ['nomad-visas.html', VISA_NOTE, /<\/section>/],
]) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('ymyl-note')) { skipped++; continue; }
  const m = s.match(anchor);
  if (!m) { console.log('  kein Anker in ' + file); continue; }
  s = s.slice(0, m.index) + '  ' + note + '\n      ' + s.slice(m.index);
  if (!DRY) fs.writeFileSync(p, s);
  tool++;
}

// --- tax and visa blog articles ---
for (const [file, note] of [
  ['blog/digital-nomad-tax-guide.html', TAX_NOTE],
  ['blog/portugal-digital-nomad-visa.html', VISA_NOTE],
]) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('ymyl-note')) { skipped++; continue; }
  // straight after the first paragraph of the article body
  const m = s.match(/<\/p>/);
  if (!m) continue;
  const at = m.index + 4;
  s = s.slice(0, at) + '\n        ' + note + s.slice(at);
  if (!DRY) fs.writeFileSync(p, s);
  blog++;
}

console.log(`${DRY ? 'DRY RUN' : 'APPLIED'} | Stadtseiten: ${city} | Visa-Tools: ${tool} | Blog: ${blog} | uebersprungen: ${skipped}`);

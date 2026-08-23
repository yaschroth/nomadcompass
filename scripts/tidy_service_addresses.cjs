/**
 * Applies the address rules to the addresses that were published before those rules existed.
 *
 * Every rule in scripts/lib/service_text.cjs was written because a card went out wrong, and the
 * ingest has applied them since. The rows already in the directory have not seen them: 300-odd
 * carry a contact e-mail where the street should end, a few dozen carry a label the reader left
 * behind, and a handful carry an HTML entity. This is the same code over the same field, so the
 * two can never disagree.
 *
 * What it will not do is empty a field. Where tidying leaves something that is no longer an address
 * (no number in it, or almost nothing left), the row is reported and left exactly as it was: those
 * are rows that never held an address, "keine Praxis - freiberufl." among them, and a note that is
 * wrong is still better than a blank where an address should be.
 *
 * Usage: node scripts/tidy_service_addresses.cjs [--write]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const T = require(path.join(ROOT, 'scripts', 'lib', 'service_text.cjs'));

const F = path.join(ROOT, 'data', 'service-languages.json');
const db = JSON.parse(fs.readFileSync(F, 'utf8'));

const stillAnAddress = (t) => !!t && /\d/.test(t) && t.length >= 10;

const changed = [];
const held = [];
db.providers.forEach((r) => {
  const was = r.area || '';
  const now = T.tidyAddress(was);
  if (now === was) return;
  if (!stillAnAddress(now)) { held.push([r, was, now]); return; }
  changed.push([r, was, now]);
});

changed.slice(0, 30).forEach(([r, a, b]) => {
  console.log('  ' + r.city + '  ' + r.name);
  console.log('     - ' + a);
  console.log('     + ' + b);
});
if (changed.length > 30) console.log('  ... and ' + (changed.length - 30) + ' more');

if (held.length) {
  console.log('\nleft alone, because tidying would not leave an address behind:');
  held.forEach(([r, a, b]) => console.log('  ' + r.city.padEnd(12) + JSON.stringify(a) + '\n' + ' '.repeat(14) + 'would become ' + JSON.stringify(b)));
}

console.log('\n' + changed.length + ' addresses to tidy, ' + held.length + ' held back, of ' + db.providers.length + ' rows.');

if (!process.argv.includes('--write')) {
  console.log('Dry run. Re-run with --write to take it.');
  process.exit(0);
}
changed.forEach(([r, , b]) => { r.area = b; });
fs.writeFileSync(F, JSON.stringify(db, null, 2) + '\n');
console.log('written.');

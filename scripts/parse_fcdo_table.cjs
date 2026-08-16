/**
 * Parses an FCDO country list published as an HTML table into one record per practice.
 *
 * These lists all share a shape, flattened to one field per line:
 *   name / [email] / telephone / address / English speaking staff / main specialisation /
 *   public or private / [accreditation]
 * The telephone is the anchor, because every row has one and it is the only field that always
 * starts with a dialling code.
 *
 * The city is read from the address rather than from any heading, and a row is kept only when
 * exactly one city the site covers appears in it. That is what stops a practice in a town the site
 * does not have from being filed under the nearest one it does.
 *
 * Rows whose English column reads No are dropped: the whole point of a row here is a language
 * claim, and that column saying No is the source telling you there is not one. Rows with an empty
 * English cell are dropped too, for the same reason.
 *
 * Usage: node scripts/parse_fcdo_table.cjs <in.txt> <out.json> "<Country>" [alias=id,alias=id]
 *   e.g. ... nl.txt nl.json "Netherlands" "den haag=thehague"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const [, , IN, OUT, COUNTRY, ALIASES] = process.argv;
if (!IN || !OUT || !COUNTRY) {
  console.error('usage: node scripts/parse_fcdo_table.cjs <in.txt> <out.json> "<Country>" [alias=id,...]');
  process.exit(1);
}
const lines = fs.readFileSync(IN, 'utf8').split('\n').map((s) => s.trim());

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const NAMES = {};
const inCountry = m.exports.filter((c) => c.country === COUNTRY);
if (!inCountry.length) { console.error('no cities on the site for country: ' + COUNTRY); process.exit(1); }
inCountry.forEach((c) => { NAMES[c.name.toLowerCase()] = c.id; });
(ALIASES || '').split(',').filter(Boolean).forEach((pair) => {
  const [k, v] = pair.split('=');
  NAMES[k.trim().toLowerCase()] = v.trim();
});

const PHONE = /^(\+|00)\d/;
// Not only Yes and No: at least one list prints "Some".
const GRADE = /^(yes|no|some|limited)\b/i;
const EMAIL = /@/;

const out = [];
const dropped = { noCity: 0, noGrade: 0, gradeNo: 0, noName: 0 };

for (let i = 0; i < lines.length; i++) {
  if (!PHONE.test(lines[i])) continue;
  const address = lines[i + 1] || '';
  const english = lines[i + 2] || '';
  const speciality = lines[i + 3] || '';
  if (!GRADE.test(english)) { dropped.noGrade++; continue; }
  if (/^no\b/i.test(english)) { dropped.gradeNo++; continue; }

  let n = i - 1;
  if (n >= 0 && EMAIL.test(lines[n])) n--;
  const name = lines[n] || '';
  if (!name || name.length < 4 || EMAIL.test(name) || PHONE.test(name)) { dropped.noName++; continue; }

  const tail = address.toLowerCase().replace(/[^a-z' -]/g, ' ');
  const found = [...new Set(
    Object.keys(NAMES).filter((k) => new RegExp('\\b' + k + '\\b').test(tail)).map((k) => NAMES[k]),
  )];
  if (found.length === 0) { dropped.noCity++; continue; }
  if (found.length > 1) { dropped.noCity++; continue; }

  out.push({ city: found[0], name, address, english, speciality });
}

const per = {};
out.forEach((o) => { per[o.city] = (per[o.city] || 0) + 1; });
console.log('kept ' + out.length + ' in ' + Object.keys(per).length + ' cities. dropped ' + JSON.stringify(dropped));
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

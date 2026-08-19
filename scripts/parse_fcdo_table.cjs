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

// The column order is not the same in every country: Belgium prints name, address, telephone,
// email where Italy and the Netherlands print name, email, telephone, address. So the header row is
// read and the offsets derived from it rather than assumed.
const HEADER_START = /^(name of (the )?(medical facility|facility|practitioner)|hospital name|facility name|name$)/i;
const COLS = {
  name: /^(name of|hospital name|facility name|name$)/i,
  email: /^e-?mail/i,
  phone: /^(telephone|phone|tel\b)/i,
  address: /^address/i,
  english: /^english/i,
  // Japan's list is better than the rest: instead of ticking English it names the languages of
  // each facility, so those rows can carry what they actually claim.
  languages: /^languages$/i,
  speciality: /^(main specialisation|main specialization|speciality|specialisation)/i,
};
let ORDER = null;
for (let i = 0; i < lines.length && !ORDER; i++) {
  if (!HEADER_START.test(lines[i])) continue;
  // A column this parser does not care about ("Regions served", "Accreditation") must not end the
  // header: Croatia prints one between the address and the English column, and stopping there made
  // the parser announce that the list has no English column when it plainly does.
  const labels = [];
  let unknownRun = 0;
  for (let j = i; j < i + 12 && j < lines.length; j++) {
    const hit = Object.keys(COLS).find((k) => COLS[k].test(lines[j]));
    if (!hit) {
      unknownRun++;
      if (unknownRun >= 2 && labels.length) break;   // two in a row means the data has started
    } else {
      unknownRun = 0;
    }
    labels.push(hit || null);
  }
  while (labels.length && labels[labels.length - 1] === null) labels.pop();
  if (labels.includes('phone') && labels.includes('address')) ORDER = labels;
}
if (!ORDER) {
  console.error('no column header found in ' + IN + '. This list is not one of the standard tables.');
  process.exit(1);
}
const at = (k) => ORDER.indexOf(k);
console.log('columns: ' + ORDER.map((x, i) => i + ':' + (x || '?')).join(' '));
// Some countries publish a table with no language column at all. Those rows carry no claim of
// their own, only the one the FCDO's travel advice makes about the whole list: "a list of medical
// providers in X where some staff will speak English". Pass --roster to take them on that basis,
// which is how the Egypt and Morocco rows already in the file work. Check the sentence is really
// on the country's travel-advice page before using it.
const ROSTER = process.argv.includes('--roster');
if (at('english') < 0 && at('languages') < 0 && !ROSTER) {
  console.error('this list has no English column and no languages column, so no row on it carries a language claim of its own.');
  console.error('If the country\'s travel advice says the list is providers "where some staff will speak English", re-run with --roster.');
  process.exit(2);
}

// Language names as the lists write them, to the codes the directory uses.
// Through the shared loader: rows name their source by id, so a direct read gives no URL and a
// note missing the sentence its source carries.
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const CODE = {};
Object.entries(DB._languages).forEach(([code, name]) => { CODE[name.toLowerCase()] = code; });
Object.assign(CODE, { mandarin: 'zh', 'chinese (mandarin)': 'zh', cantonese: 'zh', filipino: 'tl', castilian: 'es' });
const unknownLangs = new Set();
const toCodes = (cell) => [...new Set((cell || '')
  .split(/[,/;]|\band\b/i)
  .map((s) => s.trim().toLowerCase().replace(/\(.*\)/, '').replace(/[^a-z ]/g, '').trim())
  .filter(Boolean)
  .map((n) => { const c = CODE[n]; if (!c) unknownLangs.add(n); return c; })
  .filter(Boolean))];

const deaccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
// Mexico and Singapore print the dialling code in brackets, "(65) 6472 2000", so a leading
// bracket counts as the start of a number too.
// Croatia prefixes its numbers with "T ", so a single leading letter is allowed.
const PHONE = /^([A-Za-z]\s+)?(\+|00|0\d|\()[\d\s()./-]{6,}$/;
// Not only Yes and No: at least one list prints "Some".
const GRADE = /^(yes|no|some|limited)\b/i;
const EMAIL = /@/;

const out = [];
const dropped = { noCity: 0, noGrade: 0, gradeNo: 0, noName: 0 };

let shifted = 0;
for (let i = 0; i < lines.length; i++) {
  if (!PHONE.test(lines[i])) continue;

  // Everything is measured from the phone line, and the two sides are treated differently, because
  // an empty cell shifts only what comes after it. Columns printed after the phone keep a fixed
  // offset from it. Columns printed before it are read by walking backwards, so that a row with no
  // email (the Erasmus MC in Rotterdam has none) does not drag its name out of position.
  const cell = (k) => (at(k) > at('phone') ? (lines[i + at(k) - at('phone')] || '') : null);

  const pre = ORDER.slice(0, at('phone'));
  const got = {};
  let k = i - 1;
  for (let c = pre.length - 1; c >= 0 && k >= 0; c--) {
    const col = pre[c];
    // An email cell that holds no address is simply absent; skip the column, not the line.
    if (col === 'email' && !EMAIL.test(lines[k])) { shifted++; continue; }
    got[col] = lines[k];
    k--;
  }

  const address = at('address') > at('phone') ? cell('address') : (got.address || '');
  const english = at('english') > at('phone') ? cell('english') : (got.english || '');
  const speciality = at('speciality') > at('phone') ? cell('speciality') : (got.speciality || '');
  const name = at('name') > at('phone') ? cell('name') : (got.name || '');

  const langCell = at('languages') >= 0
    ? (at('languages') > at('phone') ? cell('languages') : (got.languages || ''))
    : '';
  const codes = toCodes(langCell);

  // A list with a languages column is judged on that; one with an English column on the grade.
  if (at('languages') >= 0) {
    if (!codes.length) { dropped.noGrade++; continue; }
  } else if (at('english') < 0) {
    // Roster mode: the list itself is the claim, so there is nothing per row to test.
  } else {
    if (!GRADE.test(english)) { dropped.noGrade++; continue; }
    if (/^no\b/i.test(english)) { dropped.gradeNo++; continue; }
  }
  if (!name || name.length < 4 || EMAIL.test(name) || PHONE.test(name)) { dropped.noName++; continue; }

  // Accents are folded rather than stripped. Deleting them turned "Malaga" into "m laga", which
  // silently stopped it matching at all, and the only reason those rows landed in the right place
  // was that the town in front of it still matched.
  const tail = deaccent(address).toLowerCase().replace(/[^a-z0-9' -]/g, ' ');
  const found = [...new Set(
    Object.keys(NAMES).filter((k) => new RegExp('\\b' + k + '\\b').test(tail)).map((k) => NAMES[k]),
  )];
  if (found.length === 0) { dropped.noCity++; continue; }

  let city = found[0];
  if (found.length > 1) {
    // Two site cities in one address usually means town plus province, as in "29602 Marbella
    // (Malaga)". The town is the one that follows the postcode.
    const afterPost = tail.match(/\b\d{4,6}\s+([a-z' -]+)/);
    const town = afterPost && Object.keys(NAMES)
      .filter((k) => new RegExp('\\b' + k + '\\b').test(afterPost[1]))
      .map((k) => NAMES[k]);
    if (town && town.length === 1) city = town[0];
    else { dropped.noCity++; continue; }
  }

  out.push({ city, name, address, english, speciality, languageCell: langCell, codes });
}

const per = {};
out.forEach((o) => { per[o.city] = (per[o.city] || 0) + 1; });
if (unknownLangs.size) console.log('language names not recognised: ' + [...unknownLangs].join(', '));
if (shifted) console.log(shifted + ' row(s) had an empty cell and were realigned');
console.log('kept ' + out.length + ' in ' + Object.keys(per).length + ' cities. dropped ' + JSON.stringify(dropped));
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

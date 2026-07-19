/**
 * Derives a compact visa dataset (assets/visa-data.js) from the open passport-index-dataset.
 * Source (download first to c:/tmp/passport.csv):
 *   https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv
 *   (CC BY-SA 4.0, Ilya Ilyankou / Passport Index). Only keeps the destination countries that
 * appear in cities-data.js and drops "visa required" (the default), so the baked file stays small.
 * Output: VISA_DATA = { P:[passports], D:[canonicalDestNames], V:{passport:"idx:code,..."} }
 *   code: <int> = visa-free days, F = visa free, O = visa on arrival, E = e-visa, A = eta, X = no admission.
 * Usage: node scripts/build_visa_data.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CSV = 'c:/tmp/passport.csv';

// our-country -> canonical passport-index destination name
const NAMEFIX = { UAE: 'United Arab Emirates', 'Puerto Rico': 'United States', UK: 'United Kingdom', Bosnia: 'Bosnia and Herzegovina', 'New Caledonia': 'France' };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const ourCanon = new Set(m.exports.filter((c) => c && c.country).map((c) => NAMEFIX[c.country] || c.country));

const lines = fs.readFileSync(CSV, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
const passports = new Set(), destsInData = new Set();
lines.forEach((l) => { const p = l.split(','); passports.add(p[0]); destsInData.add(p[1]); });

const DESTS = [...ourCanon].filter((d) => destsInData.has(d)).sort();
const destIdx = {}; DESTS.forEach((d, i) => { destIdx[d] = i; });
const P = [...passports].sort();

function code(req) {
  if (/^\d+$/.test(req)) return req;            // visa-free days
  if (req === 'visa free') return 'F';
  if (req === 'visa on arrival') return 'O';
  if (req === 'e-visa') return 'E';
  if (req === 'eta') return 'A';
  if (req === 'no admission') return 'X';
  return null;                                  // visa required / -1 -> omit
}

const V = {};
lines.forEach((l) => {
  const [pass, dest, req] = l.split(',');
  if (destIdx[dest] === undefined) return;
  const c = code(req);
  if (c === null) return;
  (V[pass] = V[pass] || []).push(destIdx[dest] + ':' + c);
});
const Vpacked = {}; Object.keys(V).forEach((p) => { Vpacked[p] = V[p].join(','); });

const out = 'const VISA_DATA = ' + JSON.stringify({ P, D: DESTS, V: Vpacked }) + ';\n' +
  "if (typeof module !== 'undefined' && module.exports) { module.exports = VISA_DATA; }\n";
fs.writeFileSync(path.join(ROOT, 'assets', 'visa-data.js'), out);
const kb = Math.round(Buffer.byteLength(out) / 1024);
console.log(`Wrote assets/visa-data.js: ${P.length} passports, ${DESTS.length} destinations, ${kb}KB.`);

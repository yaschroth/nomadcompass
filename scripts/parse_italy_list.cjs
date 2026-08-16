// Parses the FCDO's Italy list. Each record is a flattened table row:
//   name / [email] / telephone / address / English speaking staff / specialisation / Public|Private
//   / [accreditation]
// The telephone is the reliable anchor: every row has one and it starts +39 or 0039.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node ' + path.basename(process.argv[1]) + ' <in.txt> <out.json>'); process.exit(1); }
const lines = fs.readFileSync(IN, 'utf8').split('\n').map((s) => s.trim());

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const IT = {};
m.exports.filter((c) => c.country === 'Italy').forEach((c) => { IT[c.name.toLowerCase()] = c.id; });
// The addresses are written in Italian.
Object.assign(IT, {
  napoli: 'naples', roma: 'rome', milano: 'milan', firenze: 'florence', torino: 'turin',
  genova: 'genoa', bologna: 'bologna', palermo: 'palermo', bari: 'bari', catania: 'catania',
  lecce: 'lecce', trieste: 'trieste', verona: 'verona', siena: 'siena', bergamo: 'bergamo',
  lucca: 'lucca', perugia: 'perugia', matera: 'matera',
});

const PHONE = /^(\+39|0039)/;
// The column is not only Yes/No: one row reads "Some". An empty cell means the row simply makes no
// language claim, and those are dropped rather than read as a yes.
const YESNO = /^(yes|no|some|limited)\b/i;
const EMAIL = /@/;

const out = [];
const dropped = { noCity: 0, noEnglish: 0, englishNo: 0, noName: 0 };

for (let i = 0; i < lines.length; i++) {
  if (!PHONE.test(lines[i])) continue;
  const address = lines[i + 1] || '';
  const english = lines[i + 2] || '';
  const speciality = lines[i + 3] || '';
  if (!YESNO.test(english)) { dropped.noEnglish++; continue; }
  if (/^no\b/i.test(english)) { dropped.englishNo++; continue; }

  // Walk back over the email to the name.
  let n = i - 1;
  if (n >= 0 && EMAIL.test(lines[n])) n--;
  const name = lines[n] || '';
  if (!name || name.length < 4 || EMAIL.test(name) || PHONE.test(name)) { dropped.noName++; continue; }

  // The city is the word or words after the five-digit postcode.
  const mm = address.match(/\b\d{5}\b\s*(.+)$/);
  const tail = (mm ? mm[1] : '').replace(/\(.*$/, '').replace(/[^A-Za-z' ]/g, ' ').trim().toLowerCase();
  let city = null;
  for (const key of Object.keys(IT)) {
    if (new RegExp('\\b' + key + '\\b').test(tail)) { city = IT[key]; break; }
  }
  if (!city) { dropped.noCity++; continue; }

  out.push({ city, name, address, english, speciality });
}

const per = {};
out.forEach((o) => { per[o.city] = (per[o.city] || 0) + 1; });
console.log('kept ' + out.length + ' in ' + Object.keys(per).length + ' cities. dropped ' + JSON.stringify(dropped));
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));
console.log('--- specialities seen:');
console.log([...new Set(out.map((o) => o.speciality))].join(' | '));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

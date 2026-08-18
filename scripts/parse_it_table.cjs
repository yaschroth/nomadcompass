/**
 * Reads the Italian consulate general in Barcelona's lists, which are tables rather than blocks.
 *
 * Columns are COGNOME, NOME, CITTA, INDIRIZZO, TELEFONO, EMAIL, and pdf_text.cjs returns them one
 * cell per line. The email is the only reliable end of a record, so records are cut there.
 *
 * The awkward part is that this writer breaks a word across two cells: the city arrives as
 * "BARCEL" + "ONA" and one surname as "OR" + "IOLO". So the fields before the address are joined
 * from the right until the tail spells a city we know, and what is left is the name. A record whose
 * fields cannot be resolved that way is reported rather than guessed at.
 *
 * Usage: node scripts/parse_it_table.cjs <list.txt> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_it_table.cjs <list.txt> [--json]'); process.exit(2); }

const lines = fs.readFileSync(file, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);

const CITY = {
  barcelona: 'barcelona', barcellona: 'barcelona',
  madrid: 'madrid', valencia: 'valencia', valenza: 'valencia',
  siviglia: 'seville', sevilla: 'seville',
  malaga: 'malaga', marbella: 'marbella', granada: 'granadaspain',
  alicante: 'alicante', bilbao: 'bilbao', cadice: 'cadiz', cadiz: 'cadiz',
  zaragoza: 'zaragoza', saragozza: 'zaragoza',
  'palmademallorca': 'palma', palma: 'palma', ibiza: 'ibiza', eivissa: 'ibiza',
  'laspalmas': 'laspalmas', 'laspalmasdegrancanaria': 'laspalmas',
  tenerife: 'tenerife', 'santacruzdetenerife': 'tenerife',
  girona: 'girona', gerona: 'girona', toledo: 'toledo', salamanca: 'salamanca',
  'sansebastian': 'sansebastian',
};

// What a section heading means. Anything not listed, architects and engineers among them, has no
// place in this directory and its records are dropped with the heading named.
const SECTION = [
  [/avvocat|studi legali/i, 'legal'],
  [/odontolog|dentist/i, 'dentist'],
  [/psichiatr|psicolog|psicoterap/i, 'therapy'],
  [/fisioterap|osteopat/i, 'physio'],
  [/veterinar/i, 'vet'],
  [/ottic|oculist/i, 'optician'],
  [/commercialist|tributarist|fiscalist|consulenti del lavoro/i, 'tax'],
  [/traduttor|interpret/i, 'translator'],
  [/medic|endocrinolog|neurolog|cardiolog|dermatolog|ginecolog|pediatr|chirurg|urolog|ortoped|radiolog|oncolog|gastroenterolog|reumatolog|allergolog|otorinolaringoiatr|anestesi|nutrizionist/i, 'doctor'],
];

const HEADER = /^(cognome|nome|citt|indirizzo|tel[eé]fono|telefono|e|mail|email|cap|n\.b\.|elenco)/i;
const isAddress = (l) =>
  /^(c\/|calle|avda|av\.|avenida|passeig|paseo|pla[czç]a|plaza|rambla|ronda|carrer|via|gran|ctra|camino|trav|pl\.|c\.)/i.test(l) ||
  /\b\d{5}\b/.test(l) || /\bn[ºo°]?\s*\d/i.test(l);

const key = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const clean = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
const titleCase = (s) =>
  clean(s).toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_, a, b) => a + b.toUpperCase());

const rows = [];
const skipped = [];
// A list can be single-purpose and carry no heading at all: the sworn translators' PDF is nothing
// but translators, so the category is given on the command line.
const forced = (process.argv.find((a) => a.startsWith('--category=')) || '').split('=')[1] || null;
let category = forced;
let heading = '';
let buf = [];

const flush = (emails) => {
  const fields = [];
  const addr = [];
  for (const l of buf) (isAddress(l) || addr.length ? addr : fields).push(l);
  if (!fields.length) { buf = []; return; }
  // Join from the right until the tail spells a city, which is what repairs "BARCEL" + "ONA".
  let city = null;
  let rest = null;
  for (let k = fields.length - 1; k >= 1; k--) {
    const tail = key(fields.slice(k).join(''));
    if (CITY[tail]) { city = CITY[tail]; rest = fields.slice(0, k); break; }
  }
  if (!city) { skipped.push([fields.join(' / ').slice(0, 46), 'city not in the index']); buf = []; return; }
  if (!category) { skipped.push([fields.join(' / ').slice(0, 46), 'section "' + heading + '" is not a category here']); buf = []; return; }
  // Exactly two fields left, a surname and a given name. Gluing more than that together was tried
  // and it invents people: "BOVE" and "FRANCESCA" in adjacent cells became "Bovefrancesca", and a
  // record that had lost its email swallowed the next one's city into the name. A name is the whole
  // point of this directory, so anything that does not resolve cleanly is reported, not repaired.
  if (rest.length !== 2) {
    skipped.push([fields.join(' / ').slice(0, 46), rest.length + ' name fields, not 2']);
    buf = [];
    return;
  }
  const [surname, given] = rest;
  const name = titleCase(given) + ' ' + titleCase(surname);
  const area = addr.length ? clean(addr.join(', ')) : null;
  rows.push({ city, name, category, area, heading: clean(heading), email: emails[0] || '' });
  buf = [];
};

for (const l of lines) {
  if (HEADER.test(l) && l.length < 22) continue;
  if (/@/.test(l)) {
    // The record ends at its first email; any further address lines belong to no one.
    flush([clean(l)]);
    continue;
  }
  // A heading is recognised wherever it stands, and it ends whatever record was being collected.
  // Requiring an empty buffer meant the preamble above the first heading swallowed it, and every
  // record in the file then had no category at all.
  if (l === l.toUpperCase() && l.length > 4 && !/\d/.test(l)) {
    const hit = SECTION.find(([re]) => re.test(l));
    if (hit) { category = hit[1]; heading = l; buf = []; continue; }
  }
  buf.push(l);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  const per = {};
  rows.forEach((r) => { per[r.city + ' ' + r.category] = (per[r.city + ' ' + r.category] || 0) + 1; });
  console.log(rows.length + ' rows');
  console.log(Object.entries(per).sort().map(([k2, n]) => '  ' + k2.padEnd(24) + n).join('\n'));
  console.log('skipped ' + skipped.length + ':');
  skipped.slice(0, 10).forEach(([w, why]) => console.log('  ' + w.padEnd(48) + why));
}

/**
 * Records, for every roster source in the registry, which language its roster claim is actually
 * about, so the ingest stops assuming German.
 *
 * The default is the publishing mission's own language. That is not a guess: a consular list names
 * providers who work in the language of the country that publishes it, and it is the property the
 * whole directory rests on.
 *
 * The exceptions are read off each source's own claimQuote and written out here rather than derived.
 * Deriving them was tried and is in the git history: matching language words across five languages
 * of quote found "anglais" but not "français", called an Italian list Spanish, and read the notes
 * as if they were the claim. A dozen hand-checked lines beat a regex that is wrong in both
 * directions and silent about it.
 */
const fs = require('fs');

const BY_HOST = [
  [/diplo\.de|auswaertiges/i, ['de']],
  [/bmeia\.gv\.at|eda\.admin\.ch/i, ['de']],
  [/usembassy\.gov|state\.gov|gov\.uk|fcdo/i, ['en']],
  [/diplomatie\.gouv\.fr|ambafrance/i, ['fr']],
  [/esteri\.it/i, ['it']],
  [/gov\.pl/i, ['pl']],
  [/exteriores\.gob\.es/i, ['es']],
  [/nederlandwereldwijd\.nl|minbuza/i, ['nl']],
  [/diplomatie\.belgium\.be/i, ['nl']],
  [/swedenabroad\.se/i, ['sv']],
  [/norway\.no/i, ['no']],
  [/um\.dk/i, ['da']],
];

/**
 * Sources whose claim is not about the publisher's own language, each with the words that say so.
 * Matched on the URL and the publisher together: a mission publishes several lists that do not all
 * agree, and gov.pl hides which is which behind an attachment id, so Bogota is only reachable by name.
 */
const EXCEPTIONS = [
  // Missions that publish an English list for their citizens rather than one in their own language.
  [/hungary\.diplomatie\.belgium\.be/, ['en'], 'Below is a list of English-speaking doctors and dentists in Budapest.'],
  [/norway\.no\/contentassets\/571c0bb63ba74ae5ba9f3836fc1ee6cc/, ['en'], 'All the lawyers listed below speak English.'],
  [/norway\.no\/contentassets\/fd09bf9e40574741962c2d57a2f44f9c/, ['en'], 'The following list of English-speaking lawyers has been prepared by the Royal Norwegian Embassy Ankara'],
  [/um\.dk\/media\/y1nm3ioi/, ['en'], 'List of English Speaking Lawyers and Law Firms in Istanbul'],
  // French lists that say plainly that they cover English too.
  [/vn\.diplomatie\.gouv\.fr/, ['fr', 'en'], 'Avocats francophones et/ou anglophones au Vietnam'],
  [/hu\.diplomatie\.gouv\.fr\/files\/hu\/files\/liste-d-avocats/, ['fr', 'en'], "LISTE D'AVOCATS FRANCOPHONES ET ANGLOPHONES ET NOTAIRES FRANCOPHONES"],
  // A sworn-translator list is a language pair, and both halves are the claim.
  [/meksyk\/lista-adwokatow/, ['pl', 'es'], 'Tlumacze przysiegli hiszpanski-polski-hiszpanski'],
  [/kolumbia|Poland in Bogota/, ['pl', 'es'], 'TRADUCTORES OFICIALES ESPANOL - POLACO, POLACO - ESPANOL'],
];

const reg = JSON.parse(fs.readFileSync('data/verified-consular-sources.json', 'utf8'));
const roster = reg.filter((x) => /^roster/i.test(x.claimType || ''));

let byHost = 0;
const exceptional = [];
const stuck = [];
for (const src of roster) {
  const ex = EXCEPTIONS.find(([re]) => re.test((src.url || '') + ' ' + (src.publisher || '')));
  if (ex) { src.rosterLanguage = ex[1]; exceptional.push({ src, ex }); continue; }
  const host = (BY_HOST.find(([re]) => re.test(src.url || '')) || [])[1];
  if (!host) { stuck.push(src); continue; }
  src.rosterLanguage = host;
  byHost += 1;
}

console.log('roster sources: ' + roster.length);
console.log('  the publisher\'s own language: ' + byHost);
console.log('  read off the quote instead:   ' + exceptional.length);
console.log('  could not be settled:         ' + stuck.length);
exceptional.forEach(({ src, ex }) => console.log('    ' + ex[1].join('+').padEnd(6) + src.city.padEnd(12)
  + src.publisher.slice(0, 44) + '\n        "' + ex[2] + '"'));
stuck.forEach((u) => console.log('    STUCK  ' + u.city + '  ' + u.publisher + '\n        ' + u.url));

if (stuck.length) { console.error('\nRefusing to write while any source is unsettled.'); process.exit(1); }
if (!process.argv.includes('--write')) { console.log('\nDry run. Re-run with --write to save.'); process.exit(0); }
fs.writeFileSync('data/verified-consular-sources.json', JSON.stringify(reg, null, 1) + '\n');
console.log('\nwritten');

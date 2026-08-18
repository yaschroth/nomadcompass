/**
 * Reads a consular list of local professionals, in the block form that several ministries use.
 *
 * Written for the French embassy in Spain's "Professionnels francophones", which carries the whole
 * country on one page, and since extended to the Italian consulates in Spain, whose pages and PDFs
 * are laid out the same way: a title and a name, then the practice, then an address line with a
 * postcode. Takes HTML or the plain text of a PDF as produced by scripts/pdf_text.cjs.
 *
 * One page carries the whole country: lawyers by consular district, then doctors by specialty,
 * then sworn translators and interpreters. It is not a table, it is a run of blocks, so entries are
 * found by their opening line and closed by the next one.
 *
 * The city comes from the entry's own address line, never from the heading above it. The headings
 * are consular districts, and a district heading is not a city: the lawyers listed under Granada
 * include one who also covers Malaga and Cordoba, and the Estremadura heading is followed by a
 * practice that says in its own text that it sits in Seville. Reading the heading would have filed
 * both in the wrong place, which is the same mistake that put Jalandhar's hospitals under Amritsar
 * in the India list.
 *
 * Usage: node scripts/parse_consular_page.cjs <page.html|list.txt> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_consular_page.cjs <page.html|list.txt> [--json]'); process.exit(2); }

const raw = fs.readFileSync(file, 'utf8');
// A PDF read by pdf_text.cjs arrives as plain lines; only markup needs stripping.
const html = /.html?$/i.test(file) ? raw : raw.replace(/&/g, '&amp;');
const lines = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#8217;|&rsquo;|&#039;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&deg;/g, ' ')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

// Which country's tables to read the addresses against. This is not a nicety: Spanish and French
// postcodes are both five digits and they collide. 38001 is Santa Cruz de Tenerife and 38000 is
// Grenoble, so a list read with the wrong table would file Grenoble's lawyers on a Canary island.
const COUNTRY = ((process.argv.find((a) => a.startsWith('--country=')) || '').split('=')[1] || 'es').toLowerCase();

// City names as this page writes them, French and Spanish, against our ids. Postcodes are the
// tie-breaker: several of these names appear in an address that belongs to a different town.
const CITIES_ES = [
  ['barcelon', 'barcelona', /^08/],
  ['madrid', 'madrid', /^28/],
  ['valenc', 'valencia', /^46/],
  ['valence', 'valencia', /^46/],
  ['sevill', 'seville', /^41/],
  ['séville', 'seville', /^41/],
  ['malaga', 'malaga', /^290/],
  ['málaga', 'malaga', /^290/],
  ['marbella', 'marbella', /^296/],
  ['granada', 'granadaspain', /^18/],
  ['grenade', 'granadaspain', /^18/],
  ['alicante', 'alicante', /^03/],
  ['cadix', 'cadiz', /^11/],
  ['cádiz', 'cadiz', /^11/],
  ['cadiz', 'cadiz', /^11/],
  ['bilbao', 'bilbao', /^48/],
  ['palma', 'palma', /^07(0|1)/],
  ['ibiza', 'ibiza', /^078/],
  ['eivissa', 'ibiza', /^078/],
  ['zaragoza', 'zaragoza', /^50/],
  ['saragosse', 'zaragoza', /^50/],
  ['las palmas', 'laspalmas', /^35/],
  ['santa cruz de tenerife', 'tenerife', /^38/],
  ['tenerife', 'tenerife', /^38/],
  ['gerona', 'girona', /^17/],
  ['girona', 'girona', /^17/],
  ['gérone', 'girona', /^17/],
  ['san sebasti', 'sansebastian', /^20/],
  ['donostia', 'sansebastian', /^20/],
  ['toledo', 'toledo', /^45/],
  ['tolède', 'toledo', /^45/],
  ['salamanca', 'salamanca', /^37/],
  ['salamanque', 'salamanca', /^37/],
];

// The core postcode range of each city, for the many addresses that print the code and no town at
// all. It is only consulted when nothing follows the code on the line, because what follows is
// usually a different town: "28220 Majadahonda" is not Madrid, and the range alone would have
// swallowed it.
const CITIES_FR = [
  ['paris', 'paris', /^75/],
  ['lyon', 'lyon', /^69/],
  ['marseille', 'marseille', /^13(0|1)/],
  ['marsiglia', 'marseille', /^13(0|1)/],
  ['nice', 'nice', /^06/],
  ['nizza', 'nice', /^06/],
  ['bordeaux', 'bordeaux', /^33/],
  ['toulouse', 'toulouse', /^31/],
  ['tolosa', 'toulouse', /^31/],
  ['montpellier', 'montpellier', /^34/],
  ['nantes', 'nantes', /^44/],
  ['strasbourg', 'strasbourg', /^67/],
  ['strasburgo', 'strasbourg', /^67/],
  ['grenoble', 'grenoble', /^38/],
  ['annecy', 'annecy', /^74/],
  ['aix-en-provence', 'aixenprovence', /^13/],
  ['aix en provence', 'aixenprovence', /^13/],
  ['colmar', 'colmar', /^68/],
  ['chamonix', 'chamonix', /^74/],
  ['avignon', 'avignon', /^84/],
];

const CORE_FR = {
  paris: [75001, 75020], lyon: [69001, 69009], marseille: [13001, 13016],
  nice: [6000, 6300], bordeaux: [33000, 33300], toulouse: [31000, 31500],
  montpellier: [34000, 34090], nantes: [44000, 44300], strasbourg: [67000, 67200],
  grenoble: [38000, 38100], annecy: [74000, 74000], aixenprovence: [13090, 13100],
  colmar: [68000, 68000], chamonix: [74400, 74400], avignon: [84000, 84000],
};

const CORE_ES = {
  madrid: [28001, 28055], barcelona: [8001, 8042], valencia: [46001, 46026],
  seville: [41001, 41020], malaga: [29001, 29018], marbella: [29600, 29604],
  granadaspain: [18001, 18016], alicante: [3001, 3016], cadiz: [11001, 11012],
  bilbao: [48001, 48015], palma: [7001, 7015], ibiza: [7800, 7819],
  zaragoza: [50001, 50018], laspalmas: [35001, 35019], tenerife: [38001, 38010],
  girona: [17001, 17007], sansebastian: [20001, 20018], toledo: [45001, 45009],
  salamanca: [37001, 37008],
};

const CITIES = COUNTRY === 'fr' ? CITIES_FR : CITIES_ES;
const CORE = COUNTRY === 'fr' ? CORE_FR : CORE_ES;

const startsEntry = (l) =>
  /^(Me\.?|Docteure?|Doctora|Dr\.?|Dra\.?|Maître|Avv\.?|Dott\.ssa|Dott\.?|Prof\.?|Ing\.?|Arch\.?)\s+[A-ZÁÉÍÓÚÑÜÈÊ]/.test(l) ||
  /^[A-ZÁÉÍÓÚÑÜÇ][A-ZÁÉÍÓÚÑÜÇ'’ -]{3,}\s+[A-ZÁÉÍÓÚÑÜ][a-zà-ÿ]/.test(l);

// What the entry is, read from the words the page itself uses. The section heading is only the
// fallback, because a block of dentists sits under a medical heading and says "Dentiste" per entry.
const categoryOf = (text) => {
  if (/dentiste|dentaire|dentist|odontoiatr|implantolog|orthodont|ortodonz|stomatolog/i.test(text)) return 'dentist';
  if (/psycholog|psicolog|psychiatr|psichiatr|psychanalys|psicoterap|psychoth[eé]rap/i.test(text)) return 'therapy';
  if (/kin[eé]sith[eé]rap|physioth[eé]rap|fisioterap|ost[eé]opath|osteopat/i.test(text)) return 'physio';
  if (/opticien|optom[eé]tr/i.test(text)) return 'optician';
  if (/v[eé]t[eé]rinaire|veterinar/i.test(text)) return 'vet';
  if (/traducteur|traductrice|traduttor|traduttric|interpr[eè]te|interpret[ei]/i.test(text)) return 'translator';
  if (/commercialist|tributarist|fiscalist/i.test(text)) return 'tax';
  if (/avocat|abogad|avvocat|juriste|barreau|studio legale/i.test(text)) return 'legal';
  if (/m[eé]decin|docteur|chirurgien|cardiolog|dermatolog|gyn[eé]colog|p[eé]diatr|ophtalmolog|radiolog|urolog|neurolog|angiolog|endocrinolog|gastro|rhumatolog|allergolog|orl|sage-femme|nutrition|medico|chirurg|pediatr|ginecolog|oculist|cardiolog/i.test(text)) {
    return 'doctor';
  }
  return null;
};

// Some tables put the surname in one cell and the given name in the next, so they arrive on two
// lines and no entry is ever recognised: the Italian consulate in Paris lists its surgeons that
// way. They are rejoined here, but only when the second line is a given name in ordinary case. A
// heading is followed by another all-capitals line, so headings never trigger this.
for (let i = 0; i < lines.length - 1; i++) {
  const a = lines[i];
  const b = lines[i + 1];
  if (a.length < 3 || a.length > 30 || /[\d@]/.test(a)) continue;
  if (a !== a.toUpperCase() || !/[A-ZÀ-Ý]{3}/.test(a)) continue;
  if (!/^[A-ZÀ-Ý][a-zà-ÿ]{2,}(\s[A-ZÀ-Ý][a-zà-ÿ]+)*$/.test(b)) continue;
  lines[i] = a + ' ' + b;
  lines.splice(i + 1, 1);
}

// A single-purpose list states its profession once, in its title, and never again per entry: the
// Italian consulate in Paris publishes a page of lawyers where most blocks say only an address.
const DEFAULT_CATEGORY =
  (process.argv.find((a) => a.startsWith('--default-category=')) || '').split('=')[1] || null;

const entries = [];
let current = null;
// The translator section splits into a French/Spanish list and a French/Catalan one, and that
// heading is the only place the language pair is stated, so it travels with the entry.
let heading = '';
for (const l of lines) {
  if (/^(Liste des|Liste d'|Ordre des|Information g[eé]n[eé]rale|Traducteurs et interpr)/i.test(l)) {
    heading = l;
    if (current) entries.push(current);
    current = null;
    continue;
  }
  if (startsEntry(l)) {
    if (current) entries.push(current);
    current = { name: l, body: [], heading };
    continue;
  }
  if (current) current.body.push(l);
}
if (current) entries.push(current);

const clean = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();

const rows = [];
const skipped = [];
for (const e of entries) {
  const text = e.name + ' ' + e.body.join(' ');
  // The address is the line carrying a Spanish postcode. Some entries give two, a practice and a
  // second consulting room; the first is taken and the row says so in its area.
  const addr = e.body.find((l) => /\b\d{5}\b/.test(l) && !/^t[eé]l|^fax|^m[eé]l|^courriel/i.test(l));
  if (!addr) { skipped.push([e.name, 'no address line']); continue; }
  const pc = (addr.match(/\b(\d{5})\b/) || [])[1];
  const low = clean(addr).toLowerCase();
  const hit = CITIES.find(([word, , pcRe]) => low.includes(clean(word).toLowerCase()) && pcRe.test(pc));
  let city = hit ? hit[1] : null;
  if (!city) {
    // Nothing but the code on the line, so the range decides. Anything written after the code is a
    // town name, and if it is not one of ours the entry is not ours either.
    const after = clean(addr).slice(clean(addr).indexOf(pc) + 5).replace(/^[\s,.-]+/, '');
    if (!/[A-Za-z]{3}/.test(after)) {
      const n = Number(pc);
      city = Object.keys(CORE).find((id) => n >= CORE[id][0] && n <= CORE[id][1]) || null;
    }
  }
  if (!city) { skipped.push([e.name, 'address not in the index: ' + clean(addr).slice(0, 60)]); continue; }
  // The title is a claim about the profession and the page uses it consistently, so it decides when
  // the entry's own words do not: a lawyer's block often says only "droit civil et des affaires".
  const category = categoryOf(text) ||
    (/^(Me\.?|Ma[iî]tre|Avv\.?)\s/.test(e.name) ? 'legal'
      : /^(Docteure?|Doctora|Dr\.?|Dra\.?|Dott\.ssa|Dott\.?)\s/.test(e.name) ? 'doctor' : DEFAULT_CATEGORY);
  if (!category) { skipped.push([e.name, 'no category in the text']); continue; }
  // "Me. CHABANEIX Luis" and "Docteur Laetitia RICAUD": the page puts the surname in capitals on
  // either side of the given name, so the title is dropped and the rest kept as written.
  const name = clean(e.name.replace(/^(Me\.?|Docteure?|Doctora|Dr\.?|Dra\.?|Ma[iî]tre|Avv\.?|Dott\.ssa|Dott\.?|Prof\.?|Ing\.?|Arch\.?)\s+/, ''))
    .replace(/\s*\(.*$/, '')
    .replace(/[,;:.\s-]+$/, '');
  // Half of these entries put the street on its own line and the postcode on the next, so an area
  // read from the postcode line alone says "28009 Madrid" and nothing more. Take the line above it
  // when that line is part of the address rather than a label or a practice name.
  let area = clean(addr);
  if (/^\d{5}/.test(area)) {
    const prev = e.body[e.body.indexOf(addr) - 1] || '';
    if (/^(C\/|Calle|Avda|Av\.|Avenida|Paseo|Plaza|Pla[cç]a|Rambla|Ronda|Carrer|Passeig|Gran V|Camino|Ctra|Travessera|Via|V[ií]a)/i.test(prev)) {
      area = clean(prev) + ', ' + area;
    }
  }
  rows.push({ city, name, category, area, heading: clean(e.heading || '') });
}

// The same lawyer appears under two consular districts where their practice covers both, so the
// list is deduplicated on city and name before anything is reported.
const seen = new Set();
const unique = rows.filter((r) => {
  const k = r.city + '|' + r.name.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(unique, null, 2));
} else {
  const per = {};
  unique.forEach((r) => { per[r.city + ' ' + r.category] = (per[r.city + ' ' + r.category] || 0) + 1; });
  console.log(unique.length + ' rows from ' + entries.length + ' blocks');
  console.log(Object.entries(per).sort().map(([k, n]) => '  ' + k.padEnd(26) + n).join('\n'));
  console.log('skipped ' + skipped.length + ':');
  skipped.slice(0, 14).forEach(([n, why]) => console.log('  ' + clean(n).slice(0, 34).padEnd(36) + why));
}

/**
 * Parses the German Embassy Paris list of German-speaking doctors into one record per practice.
 *
 * Same shape as the Rome list and parsed the same way: a speciality heading, then entries of the
 * form SURNAME, Firstname, title / practice / street / postcode and town / contact details. The
 * postcode line is the anchor.
 *
 * Only Paris proper is kept. The list covers the embassy's whole district, so it also carries
 * practices in Versailles, Neuilly-sur-Seine, Boulogne-Billancourt, Rueil-Malmaison, Chambourcy and
 * others. Those are their own towns, not Paris, and there is no Paris row to be had from them.
 *
 * Usage: node scripts/parse_paris_list.cjs <fr.txt> <out.json>
 */
const fs = require('fs');
const path = require('path');

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node scripts/parse_paris_list.cjs <in.txt> <out.json>'); process.exit(1); }
const L = fs.readFileSync(IN, 'utf8').split('\n').map((s) => s.trim());

// Heading -> [category, English wording for the note].
const CAT = {
  Allgemeinmedizin: ['doctor', 'general medicine'],
  Augenheilkunde: ['doctor', 'ophthalmology'],
  Chirurgie: ['doctor', 'surgery'],
  'Gynäkologen': ['doctor', 'gynaecology and midwifery'],
  Urologie: ['doctor', 'urology'],
  'Hals-, Nasen- und Ohrenärzte': ['doctor', 'ear, nose and throat medicine'],
  Dermatologie: ['doctor', 'dermatology'],
  'Innere Medizin': ['doctor', 'internal medicine'],
  Kardiologie: ['doctor', 'cardiology'],
  'Pädiatrie': ['doctor', 'paediatrics'],
  Neurologie: ['doctor', 'neurology'],
  Radiologie: ['doctor', 'radiology'],
  Psychiatrie: ['therapy', 'psychiatry'],
  Osteopathie: ['physio', 'osteopathy'],
  Physiotherapie: ['physio', 'physiotherapy'],
  Zahnheilkunde: ['dentist', 'dentistry'],
  'Krankenhäuser': ['doctor', 'hospitals'],
  'Tierärzte': ['vet', 'veterinary medicine'],
};
const headingKey = (l) => Object.keys(CAT).find((k) => l === k || l.startsWith(k)) || null;

// A Paris postcode is 75xxx. Everything else on this list is a different town.
const POST = /^(\d{5})\s+(.+)$/;
// Most surnames are set in capitals but not all ("Ermisch", "Wolter-Desfosses"), so the class has
// to allow lower case; NOT_A_PERSON below is what keeps the speciality lines out.
const NAME = /^[A-ZÄÖÜ][\p{L}'’ .()-]{1,},/u;
const CONTACT = /^(Tel|Fax|Mobil|E-?Mail|Terminvereinbarung|www\.|http|Sprechstunde|Praxis|Metro|RER)/i;
// Each entry is followed by lines describing what it treats. They start with a capital and carry
// commas, so they look like names; these words are how you tell them apart.
const NOT_A_PERSON = /(logie|login|heilkunde|chirurg|therapie|medizin|praxis|zentrum|klinik|clinique|centre|cabinet|institut|h(o|ô)pital|laser|supervision)/i;
// A given name, optionally with the title on the same line ("Allan, Dr.", "Segolene").
const CONTINUATION = /^[A-ZÄÖÜÉÈÀ][\p{L}'’-]*(,\s*(Dr|Prof|Dres)\b.*)?$/u;

let heading = null;
const out = [];
const skipped = {};

for (let i = 0; i < L.length; i++) {
  const hk = headingKey(L[i]);
  if (hk) { heading = hk; continue; }
  const pm = L[i].match(POST);
  if (!pm || !heading) continue;

  if (!pm[1].startsWith('75')) {
    skipped[pm[2]] = (skipped[pm[2]] || 0) + 1;
    continue;
  }

  // Walk back to the name. A candidate over 44 characters is one of the speciality descriptions
  // the list puts under each entry ("Kinder-Dermatologie, Aesthetische Dermatologie, ..."), which
  // starts with a capital and carries commas and would otherwise be taken for somebody's name.
  let n = -1;
  for (let j = i - 1; j >= 0 && j > i - 9; j--) {
    if (!NAME.test(L[j]) || CONTACT.test(L[j]) || L[j].length > 60) continue;
    if (NOT_A_PERSON.test(L[j])) continue;
    n = j; break;
  }
  if (n < 0) continue;

  // The name is split across lines: "SURNAME," then "Firstname" then sometimes "Dr.". The
  // candidate above lands on whichever of those carries the comma, so walk back over any bare
  // surname line and then forward to collect the given name and title.
  const SURNAME_LINE = /^[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß'’ -]*,$/;
  let start = n;
  while (start > 0 && SURNAME_LINE.test(L[start - 1])) start--;
  const parts = [];
  for (let j = start; j < i && parts.length < 3; j++) {
    const c = L[j];
    if (!c || CONTACT.test(c)) break;
    if (/^\d/.test(c)) break;                       // the street has begun
    if (j > start && !/^(Dr|Prof|Dres)\b/.test(c) && !CONTINUATION.test(c)) break;
    if (j > start && NOT_A_PERSON.test(c)) break;   // "Gemeinschaftspraxis" is not a given name
    parts.push(c.replace(/,$/, ''));
  }
  const printed = parts.join(', ');
  if (!printed || printed.length < 4) continue;

  const [category, speciality] = CAT[heading];
  const street = L.slice(start + parts.length, i)
    .filter((x) => x && !CONTACT.test(x) && !/^\(/.test(x))
    .concat(L[i])
    .join(', ');
  out.push({ heading, category, speciality, printed, street });
}

const per = {};
out.forEach((o) => { per[o.category] = (per[o.category] || 0) + 1; });
console.log('kept ' + out.length + ' in Paris: ' + JSON.stringify(per));
console.log('outside Paris, not kept: ' + Object.entries(skipped).map(([k, v]) => k + ' ' + v).join(', '));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

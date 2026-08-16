// Parses the German Embassy Rome's list of German-speaking doctors and therapists.
//
// Layout: a speciality heading in capitals, then entries of the form
//   SURNAME, Dr. med. Firstname / street / 00xxx Roma / phone, email / what they do / hours / EHIC
// The postcode line is the anchor: every Rome address ends "00xxx Roma".
const fs = require('fs');
const path = require('path');
const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node ' + path.basename(process.argv[1]) + ' <in.txt> <out.json>'); process.exit(1); }
const L = fs.readFileSync(IN, 'utf8').split('\n').map((s) => s.trim());

const HEADING = /^[A-ZÄÖÜ][A-ZÄÖÜ ()\/.,-]{5,}$/;
const NAME = /^[A-ZÄÖÜ][A-ZÄÖÜ'’ .()-]{2,},/;
// The address line that ends an entry's block. Rome is either named outright ("00144 Roma-EUR",
// and one entry the source mistypes as "0062 Roma") or given by a 001xx postcode, which is the
// city's own range and covers the outlying districts like Casal Palocco.
//
// This matters because the list is not only Rome: it also carries practices in Fossombrone in the
// Marche, Roseto degli Abruzzi on the Adriatic and Riano, a separate comune 20km north written as
// "bei Rom". None of those are Rome and none are kept.
const CAP = /^\d{4,5}\b.*$/;
const isRome = (l) => /\bRoma\b/i.test(l) || /^001\d\d\b/.test(l);

// Heading -> category in the site's vocabulary.
// Keyed on the start of the heading, not the whole of it. Several headings carry a mixed-case
// gloss ("DERMATOLOGEN (Hautaerzte)", "INNERE MEDIZIN (mit Schwerpunkten)"), and matching the whole
// line missed them, which left dermatologists, gynaecologists and ENT doctors sitting under
// whichever heading came before them.
const CAT = {
  ALLGEMEINMEDIZINER: 'doctor', 'INNERE MEDIZIN': 'doctor', 'AUGENÄRZTE': 'doctor',
  CHIRURGEN: 'doctor', DERMATOLOGEN: 'doctor', 'GYNÄKOLOGEN': 'doctor',
  'HALS-, NASEN-, OHRENÄRZTE': 'doctor', 'KINDERÄRZTE': 'doctor', 'ORTHOPÄDEN': 'doctor',
  PSYCHIATER: 'therapy', PSYCHOLOGEN: 'therapy',
  'ZAHNÄRZTE': 'dentist', PHYSIOTHERAPIE: 'physio', OSTEOPATHIE: 'physio',
  // HEILPRAKTIKER has no equivalent in the site's twelve categories and is left out rather than
  // filed under one it does not belong to.
};
const headingKey = (l) => {
  const up = l.toUpperCase().replace(/\s+/g, ' ').trim();
  return Object.keys(CAT).find((k) => up.startsWith(k)) || null;
};

let heading = null;
let category = null;
const out = [];

for (let i = 0; i < L.length; i++) {
  const l = L[i];
  // Checked before the name test: "HALS-, NASEN-, OHRENAERZTE" has a comma in it and would
  // otherwise be read as somebody's surname, which silently emptied that whole section.
  const hk = headingKey(l);
  if (hk) { heading = hk; category = CAT[hk]; continue; }
  if (/^(THERAPEUTEN|HEILPRAKTIKER)$/i.test(l)) { heading = l.toUpperCase(); category = null; continue; }
  if (!CAP.test(l) || !isRome(l) || !category) continue;

  // Walk back to the name: the first line above that looks like "SURNAME,".
  let n = -1;
  for (let j = i - 1; j >= 0 && j > i - 7; j--) if (NAME.test(L[j])) { n = j; break; }
  if (n < 0) continue;
  // One name wraps onto a second line ("BALDA, Prof. Dr. Dr. Prof. h.c." / "Bernd-Ruediger"). A
  // continuation carries no digit and is not a street.
  let printed = L[n];
  const next = L[n + 1] || '';
  // Only a name line that stops at a title is unfinished ("BALDA, Prof. Dr. Dr. Prof. h.c." then
  // "Bernd-Ruediger"). Everything else that follows is the practice or the street, and belongs in
  // the address, not glued onto the person's name.
  if (/(h\.c\.|Dr\.|Dres\.|med\.|dent\.|Prof\.)$/.test(L[n]) && next && !/\d/.test(next)) {
    printed += ' ' + next;
  }
  printed = printed.replace(/\s+/g, ' ').trim();
  const street = L.slice(n + 1, i + 1).filter((x) => x !== next || /\d/.test(x)).join(', ').replace(/\s+/g, ' ').trim();

  // What they do: the lines after the contact block, before the opening hours.
  const detail = [];
  for (let j = i + 1; j < L.length && j < i + 12; j++) {
    const c = L[j];
    if (/^(Tel|Fax|Mobil|Mobile|E-?Mail|www\.|http)/i.test(c) || /@/.test(c)) continue;
    if (/^(Mo|Di|Mi|Do|Fr|Sa|So|Nach|Termin|Ja$|Nein$)/.test(c)) break;
    if (HEADING.test(c) || NAME.test(c)) break;
    if (c) detail.push(c);
  }

  out.push({ heading, category, printed, street, detail: detail.join(' ').slice(0, 200) });
}

// The list repeats one dentist verbatim, and files one doctor twice, under orthopaedics and again
// under osteopathy. First mention wins, so the doctor keeps the more specific of his two headings.
// Containment, not equality, which is the same test scripts/check_service_dupes.cjs applies. One
// doctor is filed twice, under orthopaedics as "KLEINHEINZ, Dr. med. Stephan" and under osteopathy
// with his practice appended, and only the first should survive.
const seenName = [];
const dedup = out.filter((o) => {
  const k = o.printed.toLowerCase().replace(/[^a-z]/g, '');
  if (seenName.some((s) => s.includes(k) || k.includes(s))) return false;
  seenName.push(k);
  return true;
});
out.length = 0;
out.push(...dedup);

const per = {};
out.forEach((o) => { per[o.category] = (per[o.category] || 0) + 1; });
console.log('kept ' + out.length + ': ' + JSON.stringify(per));
out.forEach((o) => console.log('  ' + o.category.padEnd(8) + o.printed.slice(0, 52).padEnd(54) + '| ' + o.street.slice(0, 45)));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

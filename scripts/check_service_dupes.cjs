/**
 * Fails if two providers in the same city look like the same business under different spellings.
 *
 * The batch scripts have always guarded against an exact repeat of city + name, and that is not
 * enough. Sources spell the same hospital differently: the UK FCDO writes "Chiangmai Ram
 * Hospital" where a directory writes "Chiang Mai Ram Hospital", and "BNH Hospital" and "Bangkok
 * Nursing Home Hospital (BNH)" are one building on Convent Road. Four such pairs reached the
 * published page before anyone looked.
 *
 * The test: strip everything but letters and digits, lowercase, and flag a pair where one name
 * contains the other. That catches spacing, punctuation and "City" suffixes without flagging
 * genuinely different businesses.
 *
 * Deliberate exceptions live in ALLOW, with the reason. A source that really does print one name
 * at two addresses is not a mistake to fix, it is a fact to record.
 *
 * Usage: node scripts/check_service_dupes.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
// Through the shared loader: rows name their source by id, so a direct read gives no URL and a
// note missing the sentence its source carries.
const { db: DB } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));

// city|normalised-name pairs that are known to be two different things.
const ALLOW = new Set([
  // The FCDO's Mexico list prints this name at two addresses in different districts; both are
  // kept and the second carries its district in the name so they can be told apart.
  'mexicocity|centromedicoabcobservatorio|centromedicoabcobservatoriolosmoralespolanco',
  // Two St Luke's hospitals, one on E. Rodriguez in Quezon City and one in Bonifacio Global City
  // in Taguig, both printed separately on the British Embassy Manila's list.
  'manila|stlukesmedicalcenter|stlukesmedicalcenterbgc',
  // Two lawyers on the Hungarian Bar Association list, at different chambers on different
  // streets: Bathory utca and Baross utca. Hungarian puts the surname first, so one is Laszlo
  // Peter and the other Laszlo Peter Andras, and neither is the other under a longer name.
  'budapest|drlaszlopeter|drlaszlopeterandras',
  // "Clinic Tokyo" is the English name Japan's health register gives クリニック 東京虎ノ門COR, a
  // clinic in Toranomon; American Clinic Tokyo is on the UK FCDO's list at 1-7-4 Akasaka.
  'tokyo|americanclinictokyo|clinictokyo',
  // Medical Korea lists two eye clinics: Bright Eye at 465 Gangnam-daero, Seocho-gu (Kyobo Tower),
  // and Gangnam Seoul Bright Eye at 390 Gangnam-daero, Gangnam-gu (Mijin Plaza), different phones.
  'seoul|brighteyeclinic|gangnamseoulbrighteyeclinic',
  // Daegu's list gives two clinics one English name: 박창순내과의원 in Dong-gu (053-981-5070) and
  // 박정국내과의원 in Dalseo-gu (053-632-5577), two doctors both called Park.
  'daegu|parksinternalmedicineclinic|parksinternalmedicineclinic',
  // 속편한내과의원 in Suseong-gu (053-741-3399) and 상인속편한내과의원 in Dalseo-gu (053-644-7585).
  'daegu|sanginsokpyeonhaninternalmedicineclinic|sokpyeonhaninternalmedicineclinic',
  // Japan's foreign ministry lists Kyoai's clinic and its dental department separately, one address
  // (Wisma Keiai, Jl. Jend. Sudirman), filed under doctors and dentists.
  'jakarta|kyoaimedicalservices|jakartakyoaimedicalservicesdental',
  // Two sites of one hospital group on the same ministry page: the Liberdade medical centre at Rua
  // Fagundes 121 and the hospital itself at Rua Pistoia 100, Parque Novo Mundo.
  'saopaulo|centromedicoliberdadehospitalnipobrasileiroenkyo|hospitalnipobrasileiro',
  // One person, two professions on two statutory registers: a court interpreter on the Slovenian
  // justice ministry's register and a lawyer on the Bar Association of Slovenia's.
  'ljubljana|andoljsektatjana|tatjanaandoljsek',
  // Two Bucharest firms at different addresses: Popovici Nitu Stoica at 239 Calea Dorobanti and
  // Stoica & Associates at Str. Dr. N. Staicovici 2 (Opera Center II).
  'bucharest|popovicinitustoicaassociates|stoicaassociates',
  // A La Paz translation agency and two of its translators, each listed by the US embassy by name.
  'lapaz|digitallanguageservices|digitallanguageservicesdanielromano',
  'lapaz|digitallanguageservices|digitallanguageservicesroxanavalero',
  // Three sites of Clinica Kennedy in Guayaquil: Kennedy, La Alborada and Samborondon.
  'guayaquil|clinicakennedylaalborada|clinicakennedy',
  'guayaquil|clinicakennedy|clinicakennedysamborondon',
  // Two Limassol firms: Chambers & Co at Kosta Partasidi 11, Michael Chambers & Co at 25 Voukourestiou.
  'cyprus|chambersco|michaelchamberscollc',
  // Two campuses of Yonsei's hospital: Severance in Sinchon (Seodaemun-gu), Gangnam Severance in Gangnam-gu.
  'seoul|gangnamseverancehospital|severancehospital',
  // Two Prague lawyers on the Czech bar's register: Jan Koválik and Jan Koval.
  'prague|mgrjankovalik|mgrjankoval',
]);

// "And" and "&" are the same word; see withoutConjunctions for the sixteen firms that proved it.
const { withoutConjunctions } = require(path.join(ROOT, 'scripts', 'lib', 'service_text.cjs'));
// Accents are folded, not deleted: deleting them turned "Mgr. Martin Říha" into "mgrmartinha", which
// sits inside "mgrmartinhalaj", and flagged two Prague lawyers as one.
const norm = (s) => withoutConjunctions(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

// The containment test above misses the case that actually reached the site: the same person under
// two name orders. The German embassy in Paris publishes one doctors list at a German URL and a
// French one, and the two parsers read them as "Proisl, Oliver, Dr." and "Dr. Oliver PROISL".
// Neither string contains the other, so 26 Paris doctors were published twice.
//
// The test that catches it: the same words in a different order. Titles are dropped first, because
// one list prints them and the other does not, and accents are folded, because one list prints
// SCHULZE-DOBOLD where the other prints Schulze-Doebold.
const TITLE_WORD = /^(dr|dre|prof|med|dent|phil|phd|llm|mba|ma|dipl|mme|mr|m|maitre|mtre|herr|frau|monsieur|madame)$/;
const words = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ae/g, 'a')
  .split(/[^a-z0-9]+/).filter(Boolean).filter((w) => !TITLE_WORD.test(w));
const wordKey = (s) => { const w = words(s); return w.length >= 2 ? w.slice().sort().join(' ') : ''; };

// Two entries of one statutory register are two licensed facilities, because the register is what
// decides identity: Japan's health ministry register holds a Yoshida Dental Clinic in two Fukuoka
// wards, and "Ura Clinic" sits inside "Nakamura Clinic". Its first ingest tripped this gate 838
// times, and of the pairs one name contained the other in, 823 were at different street addresses;
// the other 4 were a medical and a dental clinic under one name, registered separately and filed
// under two categories. This gate is for one business reaching us from two sources, so a pair of
// distinct entries on the same register host is not its question. A pair from a register and any
// other source is still checked.
const { sources: SOURCES } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const regEntry = (p) => {
  const s = SOURCES[p.source] || {};
  if (s.kind !== 'register') return null;
  try { return { host: new URL(s.url).hostname, url: s.url }; } catch (e) { return null; }
};
const twoRegisterEntries = (a, b) => {
  const x = regEntry(a); const y = regEntry(b);
  if (x && y && x.host === y.host && x.url !== y.url) return true;
  // The same holds for a government's own list of designated businesses, where every entry sits on
  // one page: Seoul designates four offices whose English names are all "Hyundai Certified Real
  // Estate Agency", each tested and numbered separately. Two entries of one such list are two.
  // And for a statutory register read through one search page: Romania's justice ministry numbers
  // each authorised translator, and two called Popescu Elena are two authorisations. Where one person
  // sits on a register twice (Slovakia lists interpreters and translators separately), the ingest
  // merges them; this gate is not the place to guess which same-named entries are one person.
  const sa = SOURCES[a.source] || {}; const sb = SOURCES[b.source] || {};
  return !!(a.source && a.source === b.source && ['government', 'register'].includes(sa.kind) && sa.kind === sb.kind);
};
const byCity = {};
for (const p of DB.providers) (byCity[p.city] = byCity[p.city] || []).push(p);

const problems = [];
for (const [city, rows] of Object.entries(byCity)) {
  // Each name is normalised once, not once per pair: Bucharest alone holds 5,585 sworn translators,
  // fifteen million pairs, and normalising inside the loop made this gate the slowest step of the build.
  const N = rows.map((r) => norm(r.name));
  const K = rows.map((r) => wordKey(r.name));
  for (let i = 0; i < rows.length; i++) {
    const a = N[i];
    if (a.length < 8) continue;
    for (let j = i + 1; j < rows.length; j++) {
      const b = N[j];
      if (b.length < 8) continue;
      const ka = K[i];
      const sameWords = ka && ka === K[j];
      if (!sameWords && !a.includes(b) && !b.includes(a)) continue;
      if (twoRegisterEntries(rows[i], rows[j])) continue;
      const key = [city, a, b].sort().join('|');
      const alt = [city, b, a].join('|');
      if (ALLOW.has(key) || ALLOW.has(alt) || ALLOW.has([city, a, b].join('|'))) continue;
      problems.push(`${city}: "${rows[i].name}" and "${rows[j].name}"`);
    }
  }
}

if (problems.length) {
  console.log('SERVICE DUPLICATE GATE\n');
  problems.forEach((p) => console.log('  ' + p));
  console.log(`\n${problems.length} pair(s) look like one business listed twice.`);
  console.log('Merge them into a single row carrying every language both sources claim, or add the');
  console.log('pair to ALLOW in this file with the reason it is genuinely two businesses.');
  process.exit(1);
}

console.log(`\n  clean: ${DB.providers.length} providers, no two in a city look like the same business.`);

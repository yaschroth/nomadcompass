/**
 * The claim detector decides whether a provider may be published. This is what holds it honest.
 *
 * discover_providers.cjs adds a row only where the provider's own site states the languages it
 * works in. Everything rests on one function deciding what counts as stating it, and that function
 * is a regex over page text, which is exactly the kind of thing that quietly rots into either
 * "matches nothing" or "matches everything".
 *
 * Both failure directions cost something real. A miss is a provider we could have listed. A false
 * positive publishes a language claim the provider never made, which is the one error this site
 * treats as unforgivable, so the refusals below matter more than the matches.
 *
 * Usage: node scripts/check_language_claims.cjs
 */
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { findClaim, textOf } = require(path.join(ROOT, 'scripts', 'discover_providers.cjs'));

// [what must happen, the sentence, and for a match the languages it must name]
const CASES = [
  // --- must be read as a claim -----------------------------------------------
  ['match', 'Our vets speak fluent English and Thai.', ['en', 'th']],
  ['match', 'We have English-speaking stylists for expats and travellers.', ['en']],
  ['match', 'Wir sprechen Deutsch und Englisch.', ['de', 'en']],
  ['match', 'Hablamos inglés y español con todos nuestros pacientes.', ['en', 'es']],
  ['match', 'Consultations are available in English and Russian.', ['en', 'ru']],
  ['match', 'Atendimento em inglês e português.', ['en', 'pt']],
  ['match', 'Our team can assist you in English, French and Arabic.', ['en', 'fr', 'ar']],
  ['match', 'Ein deutschsprachiger Tierarzt ist jeden Dienstag da.', ['de']],

  // --- must be refused --------------------------------------------------------
  // Names a language, claims nothing about speaking it.
  ['reject', 'We serve a full English breakfast every morning.'],
  ['reject', 'The clinic is on the corner opposite the English Church.'],
  ['reject', 'Our English Setter grooming package includes a bath.'],
  // Claims fluency, names no language.
  ['reject', 'Our team is fluent and highly professional.'],
  ['reject', 'We speak your language.'],
  // A language selector, not a sentence about service. This is the common one: almost every site
  // with a language menu would otherwise be read as claiming all of them.
  ['reject', 'English Deutsch Español Français Italiano Português Русский 中文 日本語 한국어'],
  // No language, no claim.
  ['reject', 'Founded in 1998, we are a family business in the old town.'],

  // --- a customer's words, quoted on the business's own page ------------------
  // This one shipped: a testimonial on a Mexico City salon's site was read as the salon claiming
  // English. It is a customer saying it, which is the same kind of evidence this script refuses
  // from Google, and being quoted on the provider's own page does not change whose words they are.
  ['reject', 'Also, Jess speaks English which was super easy to tell her exactly what I wanted.'],
  ['reject', 'I loved that my dentist speaks English, would recommend to anyone.'],
  // ...but the business's own voice survives, even in the same paragraph.
  ['match', 'Our dentists speak English and Spanish.', ['en', 'es']],
  ['match', 'English spoken.', ['en']],
  // A Spanish sentence containing "me" is ordinary Spanish, not an English review.
  ['match', 'Nos pueden escribir: hablamos inglés y español.', ['en', 'es']],

  // --- a country is not a language -------------------------------------------
  // All three of these shipped. "thai" matched inside Thailand and published a Bangkok clinic as
  // working in Thai on the strength of its postal address; "german" and "deutsch" do the same
  // inside Germany and Deutschland. A language name has to be a whole word.
  ['reject', 'Dental Treatment Center in Bangkok, Thailand'],
  ['reject', 'Our office in Germany handles the paperwork.'],
  ['reject', 'Unsere Kanzlei in Deutschland berät Sie gern.'],
  // ...while the languages themselves still read, including glued to a suffix.
  ['match', 'Wir sprechen Deutsch und Englisch.', ['de', 'en']],
  ['match', 'Ein deutschsprachiger Anwalt ist immer erreichbar.', ['de']],
  ['match', 'Our vets speak fluent English and Thai.', ['en', 'th']],

  // --- a hedged claim is not a working language -------------------------------
  // "a bit of French" is honest of the practice and useless to somebody who needs to be understood.
  ['reject', 'He speaks a bit of French too.'],
  ['reject', 'Our receptionist has basic English.'],
  ['reject', 'El doctor habla un poco de inglés.'],
];

let pass = 0;
const fails = [];

CASES.forEach(([want, text, langs]) => {
  const got = findClaim(text);
  let ok = want === 'match' ? !!got : !got;
  if (ok && want === 'match' && langs) {
    const found = got.languages.slice().sort().join(',');
    const expect = langs.slice().sort().join(',');
    if (found !== expect) { ok = false; got.wrongLangs = `${found} != ${expect}`; }
  }
  if (ok) pass += 1;
  else fails.push([want, text, got]);
});

// The detector reads page text, not sentences handed to it, so prove the stripping works too.
const page = '<html><head><style>.a{color:red}</style><script>var x="English speaking";</script></head>'
  + '<body><nav>Home | About</nav><p>Our dentists speak English and Spanish.</p></body></html>';
const fromPage = findClaim(textOf(page));
if (!fromPage || fromPage.languages.slice().sort().join(',') !== 'en,es') {
  fails.push(['match', '(claim inside real HTML)', fromPage]);
} else pass += 1;

// A claim must not be lifted out of a <script> block, which is markup and not something a reader
// was ever shown.
const scriptOnly = '<html><body><script>var msg = "we speak English and German";</script><p>Willkommen.</p></body></html>';
if (findClaim(textOf(scriptOnly))) {
  fails.push(['reject', '(claim only inside <script>)', findClaim(textOf(scriptOnly))]);
} else pass += 1;

const total = CASES.length + 2;
if (fails.length) {
  console.error(`check_language_claims: ${fails.length} of ${total} wrong.\n`);
  fails.forEach(([want, text, got]) => {
    console.error(`  expected ${want}: ${JSON.stringify(String(text).slice(0, 78))}`);
    console.error(`    got: ${got ? `MATCH [${got.languages.join(',')}]${got.wrongLangs ? ' wrong languages: ' + got.wrongLangs : ''}` : 'no claim'}`);
  });
  process.exit(1);
}
console.log(`check_language_claims: clean. ${pass}/${total} sentences read the way they must be.`);

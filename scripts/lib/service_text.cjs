/**
 * The rules for turning what a reader found into the address that goes on a card.
 *
 * These lived inside ingest_verified_sources.cjs, which was fine while the ingest was the only
 * thing that wrote an address. It is not: rows written before a rule existed carry exactly the
 * fault the rule was written for, and tidying those has to apply the same rules rather than a copy
 * of them that drifts. Every one of these is here because a card went out wrong.
 *
 * Usage: const { tidyAddress, unentity } = require('./lib/service_text.cjs');
 */

/**
 * An HTML entity is one character, not eight characters of punctuation.
 *
 * "Gran V&iacute;a de les Corts Catalanes 617" is Gran Via, and the reader handed the markup on
 * untouched. The accent comes off downstream anyway, so the letter is the whole of what is needed.
 */
const unentity = (t) => String(t || '')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&([a-z])(?:acute|grave|circ|uml|tilde|ring|cedil|slash);/gi, (_, l) => l)
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'");

// The word "address" is not part of an address. The German embassy Santiago list writes
// "Anschrift: Enrique Nercasseau 2300" and the Norwegian one writes "Address: ...", and the label
// went out on the card in front of the street. The colon is what makes it a label: without one,
// "Address 1:, 13, Gitanjali" lost the word and kept the "1:".
const ADDRESS_LABEL = /^\s*(?:Anschrift|Adresse(?:\s+postale)?|Address|Indirizzo|Direcci[oó]n|Endere[cç]o|Domicilio)(?:\s*\d)?\s*:\s*/i;

// A sentence that carries on from the line above. "of Hosp & Hegen, Hellbrunnerstrasse 9a, 5020
// Salzburg" is the tail of "...partner of Hosp & Hegen", and the address after it is a real one.
// Not "c/o", which belongs to an address: taking it off left "Claudio Di Manao, Via Baldo degli
// Ubaldi, 59" reading as though the man were part of the street.
const CONTINUES_ABOVE = /^\s*(?:of|von|bei|at|in)\s+/i;

/**
 * Another entry's name in front of the address.
 *
 * Two translators who share an office are two entries on the list, and the reader ran them
 * together: "Irene STEINMETZ-CRISANTI*, Via Baldo degli Ubaldi 115, 00167 Roma" is Federico
 * Crisanti's row with Irene's name still on the front of it, and "- Cristina GLORIA* (B), Via Dei
 * Traghetti, 128" is Monika Schmidt's.
 *
 * A shouted word before the first comma was the whole of the test once, and it is not enough, because
 * a street, a clinic and a building shout too. Three things have to hold together, and each of them
 * is a row it would otherwise have taken the front off:
 *
 *   no street word          "CALLE SAN SEBASTIAN, 2750" is an address, and lost its street
 *   no word for a business  "Praxis BAUM", "Centre Medic ATANOR", "Kardiologische Klinik GULI" and
 *                           "Kanzlei MM-LEGALE" are what those places are called
 *   a given name in front   "ADENTA, Ganibu dambis 4" is a Riga clinic, "BUREX Kojimachi, 3, 5, 2"
 *                           a Tokyo building; neither has a first name before the shouted word
 *   four words at the most  "All India Institute of Medical Sciences (AIIMS) Ansari Nagar, New
 *                           Delhi" is one hospital, and it lost the district it stands in
 */
const NAME_BEFORE_ADDRESS = /^[^,\d]*\b[A-Z][A-Z'-]{3,}\b[^,\d]*,\s*/;
const STREET_WORD = /\bc\/|\b(?:str|strasse|strada|street|calle|carrer|rua|via|viale|avda|avenida|av|rue|blvd|road|rd|weg|gasse|platz|plaza|piazza|largo|corso|lane|utca|ulica|ulice|gatan|court|crescent|square|terrace|gardens|mews|quay|wharf|boulevard|parade|close|drive)\b\.?/i;
const BUSINESS_WORD = /\b(?:praxis|kanzlei|studio|cabinet|centre|center|centro|centrum|klinik|clinic|clinica|clinique|h[oô]pital|hospital|ospedale|krankenhaus|spital|notar\w*|advokat\w*|consult\w*|associat\w*|partner\w*|law|legal|medic\w*|dental|group|gmbh|ltd|llp|inc|s\.?r\.?l|s\.?l)\b/i;
const GIVEN_NAME = /^[A-Z][a-z'’-]+$/;
const SHOUTED = /^[A-Z][A-Z'’-]{3,}/;

const withoutNameInFront = (t) => {
  const m = t.match(NAME_BEFORE_ADDRESS);
  if (!m || STREET_WORD.test(m[0]) || BUSINESS_WORD.test(m[0])) return t;
  const words = m[0].replace(/[,*()]/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length > 4) return t;
  const shouted = words.findIndex((w) => SHOUTED.test(w));
  if (shouted < 1 || !words.slice(0, shouted).some((w) => GIVEN_NAME.test(w))) return t;
  return t.slice(m[0].length);
};

/**
 * A phone number at the end of an address, and not the postcode at the end of one.
 *
 * The first cut of this took any trailing run of digits and punctuation, which is exactly what a
 * postcode is: it would have turned "2 Rawdon Street, Kolkata - 700 0017" into "Kolkata -" and done
 * the same to every Japanese and Brazilian address in the directory. Three things tell a phone
 * number from a postcode and one of them has to hold: a label in front of it, a leading plus, or
 * more digits than any postcode has.
 *
 * The leading "00" of an international call is not one of the three. It reads as a dialling prefix
 * and it is also how Rome writes its postcode, and "Via Emilio Longoni 69, 00155" lost the 00155.
 * A number dialled that way is nine digits and more, so the digit count already covers it.
 *
 * Nor is a ZIP+4. "Chicago, Illinois 60602-4213" is nine digits by that count and it is a postcode,
 * so the one shape American post uses is named here rather than left to arithmetic.
 */
const ZIP_PLUS_FOUR = /^\d{5}-\d{4}$/;
const withoutTrailingPhone = (t) => {
  const m = t.match(/,?\s*(?:\b([A-Za-z][A-Za-z.]{1,12})\s*:\s*)?(\(?(?:\+|00)?[\d\s()\/.+-]{6,})(?:\s*\([^)]*\))?\s*$/);
  if (!m) return t;
  const run = m[2].trim();
  if (ZIP_PLUS_FOUR.test(run)) return t;
  const digits = (run.match(/\d/g) || []).length;
  return (m[1] || /^\(?\+/.test(run) || digits >= 9) ? t.slice(0, t.length - m[0].length) : t;
};

// A label with nothing behind it, left where a reader found the cell empty: an address that ends
// "SE-114 26 Stockholm, Internet:" is a complete address with a dangling word after it. It runs
// after the phone number comes off, because "08022 Barcelone - Tel. +34 93 2054231" only ends in a
// label once the number behind the label is gone.
const DANGLING_LABEL = /[,;]?\s*\b(?:Internet|Webseite|Website|Web|Homepage|Sito|Courriel|E-?Mail|Email|Tel|Telefon|Fax|s\.o)\b\s*[:.]?\s*$/i;

/**
 * A contact block inside an address is a second entry the reader ran into the first.
 *
 * "Tyge Sorensen, Nyhavn 6, 1051 Kobenhavn K, Kontakt:, Soren Holck-Andersen, advokat@adv-nyhavn.dk"
 * is two Copenhagen lawyers in one row, and "Holck-Andersen &", the name on the card, belonged to
 * neither of them. "Wildcat Law Ltd Fleet Street Karolina Gover ... +44 7799 750 772" is two London
 * ones under a name that is a postcode. A phone number, an e-mail, or a label that starts a fresh
 * entry means the row was never one entry, whatever else about it looked right.
 *
 * The plus is written with a space after it as often as not ("+ 351 224 912 342"), a German list
 * abbreviates the telephone to a single letter ("T: 0049 30 28040776"), and what follows the colon
 * is as often a comma as a space, because the reader found the cell after the label empty:
 * "1051 Kobenhavn K, Kontakt:, Soren Holck-Andersen" is where the second entry starts.
 */
const RUN_TOGETHER = /[\w.+-]+@[\w.-]+\.\w{2,}|\+\s?\d[\d\s()\/.-]{6,}|\b(?:Address|Anschrift|Indirizzo|Contact Person|Kontakt|T|Tel|Phone|Telefon|Fax|Mob|Mobil|Portable|Courriel)\b\s*[:.](?=[\s,])|\b(?:0049|00\d\d)\s?\d{2,}/i;

const trim = (t) => t.replace(/^[;,.\s]+/, '').replace(/[,;\s]+$/, '');


/**
 * Everything above, in the one order they work in.
 *
 * `limit` is where the card cuts the address off, and it belongs in the middle rather than at the
 * end: the truncation is what leaves "20123 Milano, wolf.kuehne@dl" with half an e-mail on it, so
 * the tail comes off after the cut and not before.
 */
const tidyAddress = (text, limit) => {
  let t = trim(withoutNameInFront(unentity(text)
    .replace(ADDRESS_LABEL, '')
    .replace(CONTINUES_ABOVE, '')));
  if (limit) t = t.slice(0, limit);
  // The cross-reference some German lists put after an address ("4600 Kutaisi, s.o. (Ehefrau v. Dr.
  // Vashakmadze)"), then the e-mail, then the phone number, then whatever label is left over.
  //
  // Round and round until it stops changing, because these stack: one Paris firm ends its address
  // with four of its partners' e-mail addresses in a row, and taking one off only uncovers the next.
  //
  // The last comma-separated piece goes if an e-mail is anywhere in it, rather than the e-mail alone
  // going: some lists write the at sign as "[at]" to keep a scraper off, and the cut at 120
  // characters leaves the domain trailing behind a space, so "adiestelhorst[at] dacbe" is one piece
  // and not two.
  for (let i = 0; i < 8; i += 1) {
    const was = t;
    t = withoutTrailingPhone(t.replace(/,\s*[^,]*(?:@|\[at\])[^,]*$/i, '').replace(/,?\s*\bs\.o\..*$/i, ''))
      .replace(DANGLING_LABEL, '')
      .replace(/[,;\s]+$/, '');
    if (t === was) break;
  }
  // A postcode run into the town it belongs to, which is how one Rome list writes it.
  return trim(t.replace(/(\d{4,6})([A-Z][a-z])/g, '$1 $2'));
};

module.exports = {
  unentity, tidyAddress, withoutTrailingPhone, withoutNameInFront,
  ADDRESS_LABEL, CONTINUES_ABOVE, NAME_BEFORE_ADDRESS, DANGLING_LABEL, RUN_TOGETHER,
};

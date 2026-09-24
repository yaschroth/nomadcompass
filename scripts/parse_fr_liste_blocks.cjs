/**
 * Reads a French mission's liste de notoriete written as stacked blocks under headings.
 *
 * Most French posts publish the list in the page as a run of short lines: a name, what the person
 * does, a firm, a street, a postcode and town, then the contact lines. Cities, regions and
 * professions are headings above the entries. The German juristes and traducteurs pages (the two
 * biggest French lists we had not read, 305 and 236 entries) are this shape, and so are Austria,
 * Iceland, Lithuania, Ecuador, Kuwait, Cyprus, Bosnia and a dozen small posts.
 *
 * parse_fr_notoriete.cjs reads the Prague and Tokyo shape, where every entry either shouts its
 * surname or labels its address. On the German juristes page it merged Isabel DATZ and Jan-Carl
 * Janssen into one entry and gave the Baden-Baden firm EPP "Freiburg im Breisgau" as its role:
 * the heading BELOW the entry, the trap every French list has sprung on us. This reader was written
 * so that a heading can only ever apply to what comes after it.
 *
 * HOW AN ENTRY IS FOUND
 *
 *   - A heading (an <h1>-<h6>, or an empty heading tag whose text is the next line) closes the
 *     entry in progress. Nothing after it can reach back.
 *   - A line that is only a profession ("Pediatres", "Psychiatre", "Dentiste :") or only language
 *     names ("Francais - allemand") is a heading too, even though the page set it as plain text.
 *     The Cyprus page lists its specialists that way, and without this the word "Psychiatre" was
 *     read as the last line of the paediatric oncologist above it, who was then filed as a therapist.
 *   - Once an entry has an address or a contact line, the next line that looks like a name opens
 *     the next entry. A line that describes (practice areas, "Droit du travail", a sentence in lower
 *     case, anything with a label) never opens one, because the Malaysian list prints the practice
 *     areas AFTER the phone number and they would otherwise have been published as a lawyer.
 *   - With --blank (for PDFs) a blank line also closes the entry.
 *
 * WHAT IT RETURNS, and what it leaves to the ingest
 *
 *   name       the first line that is a name, with the role after " - " or "," taken off
 *   role       the lines that describe the entry (practice areas, firm), for the card's note
 *   specialty  the headings above it, for categorisation only (never printed)
 *   area       the first address block, labelled parts joined ("Code postal : 108" + "Ville :")
 *   languages  ONLY what the entry, or a language heading directly above it, states:
 *                "Langues : ...", "Langues pratiquees : ...", "Tungumal : ...", "autres langues :",
 *                "(francophone)", "anglophone", a line of nothing but language names, and the
 *                arrow lines of the Norwegian list ("FR -> NOR")
 *
 * OPTIONS, set per source in the manifest's parserArgs
 *
 *   --roster <code>        the page claims every entry speaks this: added to every entry's own
 *                          languages (Austria's "autres langues : italien" means French AND Italian;
 *                          handing the ingest [it] alone would have dropped the French)
 *   --scope <regex>        the roster applies only under headings matching this
 *   --skip <regex>         entries under headings matching this are not returned at all (the
 *                          German list's "France" section is lawyers in Paris and Strasbourg)
 *   --drop <code>          a language never returned (the country's own, e.g. de in Germany)
 *   --city-heading         where the address names no town, the nearest heading is appended to
 *                          it, so "Kingdom Hospital, Ath Thumamah Road" under "A Riyad:" can be
 *                          placed. Only the page's own heading, never a guess.
 *   --oneline              "Name : Specialty / Address - T : ..." one entry per line (Riyadh)
 *   --blank                blank lines separate entries (PDF text)
 *   --layout               pdftotext -layout instead of reading order
 *
 * Usage: node scripts/parse_fr_liste_blocks.cjs <page.html|list.pdf|list.txt> [options] [--json]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));

const argv = process.argv.slice(2);
const file = argv[0];
if (!file) { console.error('usage: node scripts/parse_fr_liste_blocks.cjs <file> [options] [--json]'); process.exit(2); }
const opt = (name) => { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : ''; };
const opts = (name) => argv.map((a, i) => (a === name ? argv[i + 1] : null)).filter(Boolean);
const flag = (name) => argv.includes(name);
const ROSTER = opts('--roster');
const SCOPE = opt('--scope') ? new RegExp(opt('--scope'), 'i') : null;
const SKIP = opt('--skip') ? new RegExp(opt('--skip'), 'i') : null;
const DROP = new Set(opts('--drop'));
const CITY_HEADING = flag('--city-heading');
const ONELINE = flag('--oneline');
const BLANK = flag('--blank');
// Unmarked headings are opt-in, per source. The Cyprus page sets "Psychiatre" as plain text ABOVE
// the psychiatrist; the German traducteurs page sets "Traductrice-interpretre francais / italien"
// and "Francais, allemand, anglais, espagnol" as plain text at the END of the entry they describe.
// Read the second page the Cyprus way and every translator in "Exterieur de Munich" got the
// languages of the one listed above her: the heading-below trap, exactly. No rule of thumb tells the
// two apart from the text alone, so a source says which kind it is.
const PSEUDO = flag('--pseudo');
// Switzerland sets every lawyer's name as an <h5>. A heading at this level opens an entry instead of
// closing one.
const NAME_LEVEL = +opt('--name-level') || 0;
// Uruguay marks each lawyer "(francophone)" or "(Francais)". The second is the same slot and the
// same claim; it is read only where a source says so, since elsewhere "francais" can be a nationality
// in a sentence about something else.
const NATIONALITY = flag('--nationality');
// Phnom Penh lists each agency, its address and phone, and THEN the names of its translators. Read
// the usual way, "IM Lim" (of Alpha Translation) opened a new entry and took the next agency's
// address. With this, a name is a new entry only if what follows it is not another bare name.
const STAFF_AFTER = flag('--staff-after');
// Cairo's lawyer PDF sets a whole entry on one line: "Maitre Asser HAMZA 33, Rue Kasr El Nile -
// Centre Ville - Le Caire Telephone : (02) ...". The name runs until the first house number or
// street word, the address until the first contact label.
const INLINE = flag('--inline');
// Belgrade's lawyer table puts the practice areas in the cell BEFORE the name, so read in order they
// are the last lines of the lawyer above. Where a source is shaped like that, no note is written.
const NO_ROLE = flag('--no-role');
// --as <word>: what every entry on a single-profession list is, in the list's own word ("avocat").
// A lawyer's practice areas name other professions: "droit medical" filed a Vienna lawyer as a
// doctor, and "nouvelles technologies" (which holds "hno", the German ENT abbreviation) filed a
// Seoul law firm as one. The word is put where the ingest categorises from and is never printed.
const AS = opt('--as');

// ---------------------------------------------------------------- reading the file into lines

const readLines = () => {
  if (/\.pdf$/i.test(file)) {
    const out = execFileSync('pdftotext', ['-enc', 'UTF-8', ...(flag('--layout') ? ['-layout'] : []), file, '-'],
      { encoding: 'utf8', maxBuffer: 1 << 26 });
    // Private-use glyphs are the PDF's icon font: the Austrian translators list puts a telephone
    // symbol (U+F0FC) before every "Portable :", which hid the label and put phone numbers in notes.
    return out.split(/\r?\n/).map((l) => l.normalize('NFC').replace(/[\uE000-\uF8FF]/g, ' ').replace(/\s+/g, ' ').trim())
      // A running page header or footer is not an entry. The Austrian lists repeat the disclaimer
      // and "Page 3 sur 32" at every page break, in the middle of whatever entry the break fell in.
      .filter((l) => !/^(Page \d+|\d+)$|n.engage pas la responsabilit|responsabilit[ée] de l.administration|fournies que sur le montant|^[«»"]|^Liste de notori[ée]t[ée] de \w+ \d{4} des TRADUCTEURS|^SP[ÉE]CIALIS[ÉE]S DANS LA LANGUE|traducteurs assermentés par le minist/i.test(l));
  }
  const raw = fs.readFileSync(file, 'utf8');
  if (!/<\/?(html|body|div|p)\b/i.test(raw)) return raw.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim());
  // Only the article. The menu above it ("Medecins francophones", "Juristes francophones") and the
  // footer below it are headings and links that are not part of any list.
  let body = raw.replace(/<(script|style|nav|header|footer)\b[\s\S]*?<\/\1>/gi, ' ');
  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(h[1-6])\b[^>]*>/gi, (_, h) => '\n#' + h.toLowerCase() + '# ')
    .replace(/<\/(p|div|li|tr|td|th|h[1-6]|dt|dd|ul|ol|table)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split('\n')
    .map((l) => T.unentity(l).replace(/[\u00a0\u200b]/g, ' ').replace(/\s+/g, ' ').trim());
};

let lines = readLines();
if (!/\.pdf$/i.test(file) && !/\.txt$/i.test(file)) {
  // From the page title to the end of the article.
  const start = lines.findIndex((l) => /^#h1#/.test(l));
  let end = lines.findIndex((l, i) => i > start && /^(Haut de page|Aidez-nous|Si vous souhaitez figurer|R[ée]publique$|Retour en haut)/i.test(l));
  if (end < 0) end = lines.length;
  lines = lines.slice(Math.max(0, start), end);
  // The side menu "Dans cette rubrique" sits between the title and the list on most posts.
  lines = lines.filter((l, i, a) => !(i > 0 && /^Dans cette rubrique$/i.test(a[i - 1])) || /^#h/.test(l));
}
// --from / --to: read only one part of a page. The Brazilian page puts the translators, the lawyers
// and the doctors of four consular districts on one page, and its heading levels run backwards (an
// <h4> "Liste des avocats francophones" above the <h2> districts), so no heading can say where the
// lawyers begin. The page's own words can.
if (opt('--from')) { const re = new RegExp(opt('--from'), 'i'); const k = lines.findIndex((l) => re.test(l)); if (k >= 0) lines = lines.slice(k); }
if (opt('--to')) { const re = new RegExp(opt('--to'), 'i'); const k = lines.findIndex((l, j) => j > 0 && re.test(l)); if (k > 0) lines = lines.slice(0, k); }
if (!BLANK) lines = lines.filter(Boolean);

// ---------------------------------------------------------------- what kind of line is this

const LABEL_CONTACT = /^(?:-\s*)?(?:T[ée]l(?:[ée]phone|[ée]copie|efon)?(?:\s*(?:\.|portable|mobile|fixe|bureau|&|et)\s*\w*)*|T[ée]l[ée]\b|Tlf|S[íi]mi|Fax|T[ée]l[ée]copie|Port(?:able)?|Mob(?:ile|il)?|GSM|H\/P|Cell|WhatsApp|Hot\s?line|Urgences?|Standard|E-?mails?|Mails?|M[ée]l|Courriels?|Adresse (?:e-?mail|[ée]lectronique|mail)|Netfang|Internet|Site(?:\s+(?:internet|web))?|Web(?:site)?|Heimas[íi]ða|Skype|Blogger|Ph|Contact francophone)\b\s*[.:：]?/i;
const isContact = (l) => LABEL_CONTACT.test(l) || /^T\s*:/.test(l)
  || /^(?:-\s*)?[\w.+-]+@[\w.-]+\.\w{2,}\s*[;,/]?$/.test(l)
  || /^(?:-\s*)?\[?[\w.+-]+@[\w.-]+\.\w{2,}\]?(\s*(?:\/|ou|;)\s*[\w.+-]+@[\w.-]+\.\w{2,})*$/.test(l)
  || /^(?:https?:\/\/|www\.)\S+$/i.test(l)
  // A web address written without www, "kanzlei-grudzinski.de/avocat-a-berlin/". It holds the word
  // avocat, and before this it was read as a heading over the next nine Berlin lawyers.
  || /^[\w.-]+\.(?:de|com|fr|eu|at|net|org|legal|law|lt|is|nl|hu|no|dk|ch|lawyer|avocat)(?:\/\S*)?$/i.test(l)
  || /^(?:-\s*)?(?:ou\s+)?[+(]?\s?\d[\d\s().\/–-]{6,}(?:\s*\((?:portable|bureau|fixe)\))?$/i.test(l);

const LANG_LABEL = /^(?:-\s*)?(?:Langues?(?:\s+(?:parl[ée]es|pratiqu[ée]es|de travail))?|Tungum[áa]l|Languages?(?:\s+spoken)?|Idiomas?|autres?\s+langues?)\s*[:：]\s*(.+)$/i;
const ADDRESS_LABEL = /^(?:-\s*)?;?(?:Adresse(?:\s+(?:de correspondance|postale|du cabinet|[àa]\s+[^:]{1,25}))?|Heimilisfang|Address|Localisation|Location|Cabinet|Bureau)\s*[:：]\s*(.+)$/i;
const ADDRESS_PART = /^(?:-\s*)?(?:Code postal|P[óo]stfang|Ville|Borg)\s*[:：]\s*(.+)$/i;
// German streets are one word, "Eisenbahnstrasse 19-23", so the suffix is matched without a word
// boundary in front of it. Everything else is a word of its own.
const STREET = /(?:str\.|stra(?:ss|ß)e|gasse|weg|platz|allee|ring|damm|ufer|chaussee|promenade|anlage|markt|graben)\s*\d|\b(?:rue|avenue|av\.?|bd\.?|boulevard|all[ée]e|quai|place|chemin|impasse|road|street|st\.|lane|drive|calle|carrera|avenida|rua|via|viale|piazza|utca|[úu]t|k[öo]r[úu]t|t[ée]r|ulica|ul\.|gata|gatan|gade|vej|vegur|braut|laan|straat|plein|gracht|kade|singel|jalan|soi|tower|building|floor|suite|centre|center|plaza|g\.)\b/i;
const POSTCODE_TOWN = /(?:^|[\s,])(?:[A-Z]{1,2}\s?-\s?)?(?:\d{5}-\d{3}|\d{4,6}|\d{3}\s\d{2}|\d{4}\s?[A-Z]{2}|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|CEP:?\s*\d{5}-\d{3}|LT-\d{5})\s*[–-]?\s+[A-ZÄÖÜÉÈÅØÆÞ][\p{L}'’.-]+/u;
// A town in ordinary case, then its postcode: "Vilnius, LT-44301", "Dhaka-1000", "Shanghai 200040".
// Not a shouted word: "OAB 16777" is a Brazilian bar number and was read as an address.
const TOWN_POSTCODE = /[A-Z][a-zà-ÿ'’.-]{2,}(?:\s[A-Z][a-zà-ÿ-]+)?,?\s*(?:LT-|-\s?)?\d{4,6}\b/u;
// "Cabinet : ALPHABETO URUGUAY : www.alphabeto.com.uy" is the firm, not where it is. A label is an
// address only when what it labels has a number or a street in it, or the label says Adresse.
const labelledAddress = (l) => {
  const m = l.match(ADDRESS_LABEL);
  if (!m) return '';
  return (/\d/.test(m[1]) || STREET.test(m[1]) || /^(?:-\s*)?;?(?:Adresse|Heimilisfang|Address)/i.test(l)) ? m[1].trim() : '';
};
const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/;
const isAddress = (l) => !!labelledAddress(l) || ADDRESS_PART.test(l) || POSTCODE_TOWN.test(l)
  // "Londres WC1N 2PL": the British write the town before the postcode.
  || (UK_POSTCODE.test(l) && l.split(/\s+/).length <= 6)
  || /\b\d{4,6},\s*[A-Z][\p{L}-]+/u.test(l)
  || (STREET.test(l) && /\d/.test(l) && l.length < 160 && !/[:：]/.test(l.replace(/^[^:]*:\s*/, '')))
  || (TOWN_POSTCODE.test(l) && l.length < 120 && !/[:：]/.test(l));

// The words for a profession, so that a line holding nothing else is read as a heading. French
// first, since that is the language of the lists this reads, then the ones the Norwegian and
// Icelandic pages use.
const PROF = /(?:logues?|iatres?|istes?|dentistes?|chirurgiens?|m[ée]decins?|g[ée]n[ée]ralistes?|p[ée]diatres?|gyn[ée]co|kin[ée]|ost[ée]o|psych|sages?-femmes?|infirmi|orthophon|ophtalm|dermato|\bORL\b|urolog|avocats?|notaires?|huissiers?|traducteurs?|traductrices?|interpr[èe]tes?|juristes?|obst[ée]tric|anesth|radiolog|cardio|neuro|pneumo|gastro|h[ée]mato|oncolo|rhumato|endocrino|n[ée]phro|allergo|maternit[ée]|accouchement|soins|h[ôo]pitaux|cliniques?|structures m[ée]dicales|professionnels|m[ée]decine|dentaire|ophtalmologie|kin[ée]sith[ée]rap|tannlege|lege|advokat|oversett)/i;
const HONORIFIC = /^(?:-\s*)?(?:Dr\.?|Dre\.?|Dra\.?|Docteur|Doctor|Pr\.?|Prof\.?|Ma[iî]tre|Me|M\.|MM\.|Mme\.?|Mmes|Mlle|Mr\.?|Mrs\.?|Ms\.?|Monsieur|Madame|Frau|Herr|Herrn|Notarin|Notar)\s/;
const SHOUTED_WORD = /\b[A-ZÀ-ÝÞ][A-ZÀ-ÝÞ'’-]{1,}\b/u;
const PLACE_WORD = /\b(?:Plaza|Tower|Towers|Floor|Building|Bldg|Seksyen|Jalan|Unit|Lot|Block|Menara|Wisma|Centre|Center|Court|House|Complex|Residence|R[ée]sidence|Immeuble|Quartier|District|Station|Mall|Park|Square|Garden|Gardens|Utama|Mutiara|Damansara|Petaling|Setapak|Bangsar|Chancery|Fields|Row|Inn|Lane|Street|Road|Avenue|Soi|Moo|Sukhumvit|Condo|Condominium|Apartments?|Caminho|Rua|Avenida|Edf|Edif[íi]cio|Torre|Sala|Bairro|Setor|Quadra|Conj|Andar)\b/;
const LANGWORD = (w) => !!L.readLanguages(w, false).length;

// A line made only of language names: "Francais - allemand", "francais, allemand, anglais".
const onlyLanguages = (l) => {
  const parts = L.fold(l).replace(/[()]/g, ' ').split(/\s*(?:[,;/|+–-]|→|->|\bet\b|\band\b)\s*/).map((p) => p.trim()).filter(Boolean);
  // Each part a language and nothing else: "Malaysian Institute of Translation" begins with a
  // language and is not one.
  return parts.length >= 1 && parts.every((p) => p.split(/\s+/).length <= 2) && parts.every((p) => LANGWORD(p) || /^(fr|nor|no|en|ang|es|esp|de|all|it|pt)$/.test(p)) && parts.some((p) => LANGWORD(p) || /^(fr|nor|no)$/.test(p));
};
const ARROW_CODES = { fr: 'fr', nor: 'no', no: 'no', en: 'en', ang: 'en', es: 'es', esp: 'es', de: 'de', all: 'de', it: 'it', pt: 'pt' };
// "Bahasa Melayu" is Malay. The lexicon reads "bahasa" as Indonesian, and a Kuala Lumpur doctor
// who speaks English and Malay came out as speaking English and Indonesian.
const malay = (l) => String(l).replace(/bahasa\s+(?:melayu|malaysia)/gi, 'malais');
const readLangLine = (l) => {
  l = malay(l);
  if (/→|->/.test(l)) return l.split(/→|->/).map((p) => ARROW_CODES[L.fold(p).trim()]).filter(Boolean);
  return L.readLanguages(l.replace(/[()]/g, ' ').replace(/\s[–-]\s/g, ', '), false);
};

// "francophone", "anglophone": a claim about the one entry they are written in.
const PHONE_WORD = { franco: 'fr', anglo: 'en', hispano: 'es', germano: 'de', luso: 'pt', arabo: 'ar', italo: 'it', russo: 'ru', sino: 'zh' };
const phoneClaims = (text) => {
  const out = [];
  // "(tous les dentistes parlent anglais)": the Bratislava list, about one practice.
  for (const m of String(text).matchAll(/\bparlent?\s+(?:tous\s+)?(?:couramment\s+)?(anglais|fran[çc]ais|allemand|espagnol|italien|russe|arabe|portugais)\b/gi)) {
    const c = L.readLanguages(m[1], false)[0];
    if (c && !out.includes(c)) out.push(c);
  }
  if (NATIONALITY && /\((?:Fran[çc]ais|Fran[çc]aise)\)/.test(text) && !out.includes('fr')) out.push('fr');
  for (const m of String(text).matchAll(/\b(franco|anglo|hispano|germano|luso|arabo|italo|russo|sino)phones?\b/gi)) {
    // "francophones et/ou anglophones" says each is one or the other, which says nothing about any.
    if (/et\s*\/\s*ou|and\s*\/\s*or|phones?\s+ou\s+\w+phones?|\bou\s+(?:franco|anglo)phones?/i.test(text)) return [];
    const c = PHONE_WORD[m[1].toLowerCase()];
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
};

const isDescription = (l) => /^[a-zà-ÿ(«"“]/.test(l)
  || /^(?:Droit|Droits|Sp[ée]cialis|Specialis|Domaines?|Consultations?|Avocat|Avocate|Avocats|Rechtsanw|Fachanw|Notai|Notar\b|Notarin\b|Traduct|Interpr|M[ée]decin|Membre|Mitglied|Master|Ma[iî]trise|LL\.?\s?M|Dipl|Langue|Expert|Assermen|Agr[ée]|Intervention|Contentieux|Arbitrage|Conseil|Fusions|Propri[ée]t[ée]|Franchise|Recouvrement|Cabinet d.avocats [ée]galement|Bureaux?\b|Accords|Boardroom|Pas de contenu|Cette liste|Liste|Attention|Avertissement|Pour |Si |Les |La |Le |L’|L'|Il |Elle |Voici|N°|Horaires|Sur rendez|Contact|Kraamzorg|Formatrice|Assistance|Spécialit|Sp[ée]cialit[ée]s|Immigration|Local content|Tax|Legal|Cardiologue|G[ée]n[ée]raliste|P[ée]diatre|Chirurgien|Psycholog|Psychiatre|Dermatolog|Gyn[ée]colog|Orthop[ée]d|Ophtalmolog|Dentiste|Kin[ée]sith|Ost[ée]opath|Sage-femme|Urolog|ORL\b|Urgentiste|Anesth)/i.test(l)
  || /[:：]/.test(l.replace(/^[^:]*https?:.*/, ''))
  || l.split(/\s+/).length > 12
  || (l.match(/,/g) || []).length >= 3;

const isNameLike = (l) => {
  if (!l || isContact(l) || isAddress(l) || LANG_LABEL.test(l) || /^#h/.test(l)) return false;
  // "Gunnhildur Petursdottir - Cabinet d'avocats : Lausnir Law Firm": the person, then the firm.
  // The label in the second half made the whole line read as a description, and nine of Iceland's
  // eleven lawyers were lost for it.
  // "1 – M. Amair FAROOQUI", "3 —M.Yogesh SAXENA": the New Delhi list numbers its lawyers.
  l = l.replace(/^\d{1,3}\s*[–—-]\s*/, '');
  const halves = l.replace(/^-\s*/, '').split(/\s+[-–]\s+/);
  let bare = halves.length > 1 && halves[0].split(/\s+/).length <= 5 && !/[:：]/.test(halves[0]) ? halves[0] : l.replace(/^-\s*/, '');
  // "- MICHNER Alois, autres langues : espagnol / portugais": the Austrian translators list writes
  // the languages after the name, and the label's colon made the line read as a description. The
  // line was then taken as the LAST line of the translator above, who was given Michner's
  // languages: the heading-below trap in another form.
  bare = bare.replace(/^-\s*/, '').replace(/,\s*(?:autres?\s+langues?|[a-zà-ÿ]).*$/, '');
  // "Antonio Lizardo Coutinho Junior / OAB 16777": the Brazilian bar number after the name.
  bare = bare.replace(/\s*[\/-]\s*OAB\b.*$/i, '');
  // "Dental Centrum Dobes (tous les dentistes parlent anglais)": the bracket is about the entry,
  // and it is lower case, which made the practice read as a sentence.
  bare = bare.replace(/^[•*]\s*/, '').replace(/\s*\([^)]*\)\s*/g, ' ').trim() || bare;
  if (HONORIFIC.test(bare)) return true;
  if (isDescription(bare)) return false;
  // The middle of an address, which in Kuala Lumpur is several capitalised lines long: "Plaza
  // Sentral", "Seksyen 10, Wangsa Maju", "Unit 14-02, Robinson 112", "Damansara Utama,". Each of
  // them opened a new entry and took the rest of the address with it.
  if (/\d|,\s*$|;/.test(bare) || PLACE_WORD.test(bare)) return false;
  // "Salzburg, Austria": a town and a country, from a line of somebody's qualifications. It opened
  // an entry in the New Delhi list and would have gone out as a lawyer called Salzburg.
  if (/^[A-Z][a-zà-ÿ-]+,\s*[A-Z][a-zà-ÿ-]+\.?$/.test(bare)) return false;
  // "Cabinet Allemagne", "Bureau en France": which of an entry's offices this is, not a firm.
  if (/^(?:Cabinets?|Bureaux?)\s+(?:en\s+|[àa]\s+)?(?:Allemagne|France|Autriche|[A-Z][a-z]+)$/.test(bare)) return false;
  if (SHOUTED_WORD.test(bare) && bare.split(/\s+/).length <= 10) return true;
  const words = bare.split(/\s+/);
  const caps = words.filter((w) => /^[A-ZÀ-ÝÞ]/.test(w)).length;
  const lower = words.filter((w) => /^[a-zà-ÿ]/.test(w) && !/^(de|du|des|d'|von|van|der|den|la|le|di|da|dos|das|do|e|y|ir|und|et|&|bin|binti|al|el|ben|zu|af)$/i.test(w)).length;
  return words.length <= 7 && caps >= 2 && lower === 0;
};

// A line holding nothing but a profession, or a profession and a place: a heading the page did not
// mark as one. "Pediatres", "Cardiologue - Pathologue", "Gynecologues-obstetriciens :",
// "MEDECINS GENERALISTES A KUALA LUMPUR".
const isPseudoHeading = (l, next) => {
  // "VIENNE (Bundesland Wien)": the bracket glosses the heading.
  const bare = l.replace(/\s*:\s*$/, '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!bare || isContact(l) || /\d|@|www\.|https?:/i.test(bare) || HONORIFIC.test(bare) || bare.split(/\s+/).length > 7) return false;
  // "Dentiste :" stands over the entries below it. "Coordonnees a Munich :" stands over the rest of
  // the entry it is in, which is the difference: what follows a heading is a name.
  // A profession with a colon is a heading whatever follows it: "Generalistes (Enfants) - Pediatres :"
  // stands over "Pastel care s.r.o.", which does not look like a name, and was read as the last line
  // of the English-speaking GP above it.
  if (/:\s*$/.test(l) && PROF.test(bare) && bare.split(/\s+/).length <= 6) return true;
  if (/:\s*$/.test(l) && bare.split(/\s+/).length <= 6 && !/[,;]/.test(bare)) return !next || isNameLike(next) || HONORIFIC.test(next);
  // "SAO PAULO", "CURITIBA": a town shouted on its own over the lawyers practising in it.
  if (bare === bare.toUpperCase() && /[A-Z]/.test(bare) && bare.split(/\s+/).length <= 3 && next && (HONORIFIC.test(next) || /^-\s+[A-Z][a-z]{0,3}[A-ZÀ-Ý]{2,}/.test(next))) return true;
  if (!PROF.test(bare)) return false;
  // "Maitre Collin ANDREW" shouts and is a person; "PEDIATRES" shouts from end to end and is not.
  const allShouted = bare === bare.toUpperCase();
  if (SHOUTED_WORD.test(bare) && !allShouted && !/\bORL\b/.test(bare)) return false;
  // Short, or shouted from end to end. "Traductrice assermentee aupres du Landgericht de Heilbronn"
  // names a profession and is a sentence about one translator, not a heading over the next six.
  if (!allShouted && bare.split(/\s+/).length > 4) return false;
  // And it has to stand over something: the line after it opens an entry.
  return !next || isNameLike(next) || /^#h/.test(next) || HONORIFIC.test(next);
};

// ---------------------------------------------------------------- walking the lines

const heads = []; // [{level, text}]
const headingText = () => heads.map((h) => h.text).filter(Boolean).join(' > ');
const setHeading = (level, text) => {
  while (heads.length && heads[heads.length - 1].level >= level) heads.pop();
  heads.push({ level, text });
};

const entries = [];
let cur = null;
const flush = () => { if (cur && cur.lines.length) entries.push(cur); cur = null; };
// The headings for categorising leave out the page title: "Liste des traducteurs, avocats et
// medecins francophones" names three professions and made a Kuala Lumpur translation institute a
// law firm.
const openHeading = () => heads.filter((h) => h.level > 1).map((h) => h.text).filter(Boolean).join(' > ');
const open = () => { cur = { heading: headingText(), catHeading: openHeading(), headingLangs: headingLangs(), lines: [], tail: false }; };
// A heading made of language names is a claim about everything under it, until the next heading at
// its level or above: the German traducteurs page sorts Munich's translators under "Francais -
// allemand", "Allemand - anglais - francais" and so on.
function headingLangs() {
  // Not the page title (level 1). A title such as "Traducteurs et professionnels francophones" is
  // the page's claim, and whether it covers the hospitals further down is the manifest's decision
  // (claimType, rosterLanguage), made by someone who read the page, not this reader's.
  for (let i = heads.length - 1; i >= 0; i--) {
    if (heads[i].level < 2) continue;
    const t = heads[i].text;
    if (t && onlyLanguages(t)) return readLangLine(t);
    const p = phoneClaims(t);
    if (p.length) return p;
  }
  return [];
}

for (let i = 0; i < lines.length; i++) {
  let l = lines[i];
  // In a PDF a line standing alone between blank lines is a heading: "VIENNE", "HAUTE-AUTRICHE".
  // Left in, it became the name of the first lawyer under it, and ABPURG Clara went out as VIENNE.
  if (BLANK && !l) {
    if (cur && !cur.tail && cur.lines.length === 1 && !isContact(cur.lines[0])) { setHeading(7, cur.lines[0]); cur = null; }
    if (cur && cur.tail) flush();
    continue;
  }
  if (!l) continue;
  const hm = l.match(/^#h([1-6])#\s*(.*)$/);
  if (hm && NAME_LEVEL && +hm[1] === NAME_LEVEL) {
    let text = hm[2].trim();
    if (!text && lines[i + 1] && !/^#h/.test(lines[i + 1])) { text = lines[i + 1]; i++; }
    // "4- M. Jean-Yves GICQUEL": the list's own numbering is not part of the name.
    if (text) { flush(); open(); cur.lines.push(text.replace(/^\d+\s*[-.)]\s*/, '')); cur.named = true; continue; }
  }
  if (hm) {
    flush();
    let text = hm[2].trim();
    // An empty heading tag and the text on the next line is how these pages set most headings.
    if (!text && lines[i + 1] && !/^#h/.test(lines[i + 1])) { text = lines[i + 1]; i++; }
    setHeading(+hm[1], text);
    continue;
  }
  const next = lines.slice(i + 1).find(Boolean) || '';
  if (PSEUDO && (!cur || cur.tail || !cur.named) && isPseudoHeading(l, next)) {
    flush();
    setHeading(7, l.replace(/\s*:\s*$/, ''));
    continue;
  }
  if (INLINE && /(?:T[ée]l[ée]phone|Portable|Fixe|T[ée]l[ée]copie)\s*:/.test(l) && /^(?:[A-Z]{2,}\s*:\s*)?(?:Ma[iî]tre|Cabinet|[A-Z][A-Za-z]+\s+[A-Z]{2,})/.test(l)) {
    flush(); open(); cur.lines.push(l.replace(/^[A-Z][A-Z ]+:\s*(?=Ma[iî]tre)/, '')); cur.inline = true; flush();
    continue;
  }
  if (ONELINE && / : /.test(l) && /\//.test(l)) {
    flush(); open(); cur.lines.push(l); cur.oneline = true; flush();
    continue;
  }
  // The page speaking again after an entry: "Liste des cabinets d'avocats membres de la Chambre de
  // commerce francaise de Montevideo". It is not the last line of the lawyer above it, and it went
  // onto his card as his note.
  if ((!cur || cur.tail) && /^(?:Liste\b|Cette liste|Ces listes|Pour (?:tout|toute|les|vos|plus)|Si vous|Attention|Avertissement|Rappel|Voici|Les (?:m[ée]decins|avocats|traducteurs) (?:conseils|pr[ée]sents)|Il (?:n.y a|existe|est)|L.(?:ambassade|ordre)|En cas d|Consulter|Aucun)/i.test(l)) { flush(); continue; }
  if (cur && cur.tail && isNameLike(l) && !(STAFF_AFTER && isNameLike(next))) flush();
  // What stands between a heading and the first name is the page talking, not an entry: "La liste
  // de ces professionnels est donnee a titre purement indicatif", "Publie le 19 mars 2026".
  if (cur && !cur.tail && !cur.named && isNameLike(l) && cur.lines.every((x) => !isNameLike(x))) cur.lines = [];
  if (!cur) open();
  if (isNameLike(l)) cur.named = true;
  cur.lines.push(l);
  if (isContact(l) || isAddress(l) || LANG_LABEL.test(l)) cur.tail = true;
}
flush();

// ---------------------------------------------------------------- turning an entry into a row

const cleanName = (n) => {
  // Brackets are about the entry, not part of its name: "(civil/penal)", "(avocat conseil)",
  // "(francophone)", "(droit europeen, nationalite, marche interieur)". And the Brazilian bar number.
  n = n.replace(/\s*\([^)]*\)?\s*/g, ' ').replace(/\s*[\/-]\s*OAB\b.*$/i, '').replace(/\s+/g, ' ').trim();
  let s = n.replace(/^\d{1,3}\s*[–—-]\s*/, '').replace(/^M\.(?=[A-Z])/, 'M. ').replace(/^[-–•*]\s*/, '').replace(/\s*\((?:[^)]*phone[^)]*|m[ée]decin[^)]*|avocat[^)]*|Rechtsanw[^)]*)\)\s*/gi, ' ');
  s = s.replace(/\s*:\s*https?:\/\/\S+/, '').replace(/\s*[:：].*$/, '');
  s = s.replace(/\s*\((?:Fran[çc]aise?|francophone|anglophone|[^)]*logue|[^)]*iatre|[^)]*ologist)\)\s*/gi, ' ');
  // The role written after the name: "Sophie VAN AERDE - Medecin conseil de l'Ambassade",
  // "Christian Klima - Rechtsanwalt", "Gunnhildur Petursdottir - Logmannsstofa". A firm joined by a
  // dash to the person stays with the card as its note, not its name.
  const dash = s.split(/\s+[-–]\s+/);
  if (dash.length > 1 && dash[0].split(/\s+/).length >= 2) s = dash[0];
  // ", LL.M", ", autres langues : ...", ", traductions medicales", ", anglophone"
  s = s.replace(/,\s*(?:LL\.?\s?M.*|[a-zà-ÿ].*|Dr\. .*|D\.D\.F.*|(?:Rechtsanw|Avocat|Notar|Fachanw|Traduct|Interpr|Advocate|Barrister|Solicitor)\w*.*)$/, '');
  s = s.replace(/[.,]?\s+(?:Rechtsanw[äa]lt(?:in)?|Rechtsanwalt|Avocat|Avocate|Notar|Notarin)\b.*$/, (m, off) => (/\b[A-ZÀ-Ý]{2,}\b/.test(s.slice(0, off)) ? '' : m));
  // "Herrn Ra Nikolaus GEIBEN", "Herrn JR. Hans-Bernhard RIEGLER": the Saarbruecken salutation.
  s = s.replace(/^(?:Frau|Herrn?)\s+(?:(?:Ra|RA|Jr|JR)\.?\s+)*/, '');
  s = s.replace(/^(Me)\s+/, 'Maitre ').replace(/\s+/g, ' ').trim();
  return s;
};

// A job title and nothing else is not a note. "Traductrice assermentee." sat on ten cards.
const TITLE_ONLY = /^(?:Avocat|Avocate|Avocats|Rechtsanw[äa]lt(?:in|innen)?|Rechtsanwalt|Notar|Notarin|Notaire|Traducteur|Traductrice|Interpr[èe]te|Advocate|Lawyer|Attorney|Solicitor|Barrister)(?:\s*(?:[/&-]|et|and)\s*(?:Avocat\w*|Rechtsanw\w*|Notar\w*|Notaire|Traduct\w*|Interpr\w*))*(?:\s+(?:assermenté\w*|juré\w*|diplômé\w*|agréé\w*|indépendant\w*|de conférence|et interpr[èe]te\w*|freelance|jurée?))*\.?$/i;

const rows = [];
const refused = [];
for (const e of entries) {
  if (SKIP && SKIP.test(e.heading)) { refused.push({ why: 'skipped heading', heading: e.heading, first: e.lines[0] }); continue; }
  let nameLine = '';
  let area = '';
  const roleBits = [];
  const specBits = [];
  const langs = [];
  const phones = [];
  const emails = [];
  let url = '';
  const addrGroups = [];
  let group = [];
  let labelled = {};
  const endGroup = () => { if (group.length) addrGroups.push(group.join(', ')); group = []; };

  if (e.inline) {
    const l = e.lines[0];
    const cut = l.search(/\s(?:\d+[A-Za-z]?\s*(?:\((?:W|E|N|S)\))?[,\s]|rue\b|Rue\b|avenue\b|Av\.)/);
    const contact = l.search(/\s(?:T[ée]l[ée]phone|Portable|Fixe|T[ée]l[ée]copie|@)\s*:/);
    if (cut < 0 || contact < 0 || cut > contact) { refused.push({ why: 'inline shape', heading: e.heading, first: l.slice(0, 80) }); continue; }
    nameLine = l.slice(0, cut).trim();
    // "Maitre Ahmed EL BORAI El Borai & Partners 5 rue ...": the firm after the person stays out of the name.
    addrGroups.push(l.slice(cut, contact).trim().replace(/\s*[-–]\s*$/, ''));
    phoneClaims(l).forEach((c) => langs.push(c));
  } else if (e.oneline) {
    const l = e.lines[0];
    const m = l.match(/^(.+?)\s:\s(.+?)\s\/\s(.+)$/);
    if (!m) { refused.push({ why: 'oneline shape', heading: e.heading, first: l }); continue; }
    nameLine = m[1];
    specBits.push(m[2]);
    roleBits.push(m[2]);
    // Up to the first contact. "Fahad SAKKAL : Generaliste / T : (011) 4625017" has no address at
    // all, and without the first test his phone number went out as one.
    const where = /^(?:T|P|Tel|T[ée]l)\b\s*:/.test(m[3]) ? '' : m[3].split(/\s[-–]\s(?:T|P|Tel|T[ée]l)\b\s*:?|\s[-–]\s\+?\d|\s[-–]\s[\w.+-]+@/)[0];
    addrGroups.push(where.replace(/\s*[-–]\s*$/, ''));
    phones.push(...(l.match(/\+?\d[\d\s()]{7,}/g) || []));
  } else {
    for (const l of e.lines) {
      const lm = l.match(LANG_LABEL);
      if (lm) { langs.push(...L.readLanguages(malay(lm[1]), false)); endGroup(); continue; }
      // "- ABSOLON Aniko, autres langues : italien, hongrois (de/vers allemand)"
      const inline = l.match(/autres?\s+langues?\s*:\s*([^/]+)/i);
      if (inline) langs.push(...L.readLanguages(inline[1].replace(/\(.*$/, ''), false));
      phoneClaims(l).forEach((c) => langs.push(c));
      if (/→|->/.test(l) && onlyLanguages(l)) { langs.push(...readLangLine(l)); continue; }
      if (isContact(l)) {
        endGroup();
        const em = l.match(/[\w.+-]+@[\w.-]+\.\w{2,}/g); if (em) emails.push(...em);
        const w = l.match(/\b(?:https?:\/\/|www\.)[^\s,;]+/i); if (w && !url) url = w[0];
        const ph = l.match(/\+?\d[\d\s().\/-]{6,}/); if (ph && !/@/.test(l)) phones.push(ph[0].trim());
        continue;
      }
      const ap = l.match(ADDRESS_PART);
      if (ap) {
        const k = L.fold(l).replace(/^-\s*/, '').split(':')[0].trim();
        labelled[/code|postfang/.test(k) ? 'pc' : 'town'] = ap[1].trim().replace(/\.$/, '');
        continue;
      }
      const al = labelledAddress(l);
      if (al) { endGroup(); group.push(al); endGroup(); continue; }
      if (isAddress(l) && (nameLine || !isNameLike(l))) {
        // The street the reader did not know was one, on the line above the postcode: Amsterdam's
        // "Dijsselhofplantsoen 16-18", Munich's "Tal 43". A name and a number, directly above a
        // postcode and town, is that entry's street.
        const prev = roleBits[roleBits.length - 1] || '';
        if (!group.length && POSTCODE_TOWN.test(l) && /^[\p{L}][\p{L}'’ .-]+\s\d+[\w\/-]*$/u.test(prev)) group.push(roleBits.pop());
        group.push(l.replace(/^-\s*/, '').replace(/\.$/, ''));
        continue;
      }
      endGroup();
      if (!nameLine && isNameLike(l) && !TITLE_ONLY.test(l.replace(/^(Frau|Herr|Herrn)\s+/, ''))) {
        nameLine = l;
        // "BUTASOVA Andrea Mgr. - anglais, francais": Bratislava writes the languages after the name.
        const tail = l.split(/\s+[-–]\s+/).slice(1).join(', ');
        if (tail && onlyLanguages(tail)) langs.push(...readLangLine(tail));
        continue;
      }
      if (!nameLine && /^(Frau|Herr|Herrn|Mme|M\.)?\s*(Rechtsanw\w*|Notar\w*|Avocat\w*)$/i.test(l)) continue;
      if (onlyLanguages(l)) { langs.push(...readLangLine(l)); continue; }
      if (TITLE_ONLY.test(l)) { specBits.push(l); continue; }
      roleBits.push(l);
    }
    endGroup();
    if (labelled.pc || labelled.town) {
      // Iceland labels the street, the postcode and the town on three lines.
      const street = addrGroups.shift() || '';
      addrGroups.unshift([street, [labelled.pc, labelled.town].filter(Boolean).join(' ')].filter(Boolean).join(', '));
    }
  }
  if (!nameLine) { refused.push({ why: 'no name', heading: e.heading, first: e.lines.slice(0, 2).join(' | ') }); continue; }

  // The address in the list's own country, where an entry gives one in France as well:
  // Peter ALEFELD practises in Toulouse and Munich, and is on the German list for Munich.
  const foreign = (g) => /\bF-\s?\d{5}\b|\bFrance\b|\(France\)|\bParis\b/i.test(g);
  // The part of the address that names a town, where the street and the town were split by a line
  // the reader could not call an address ("10th Floor" / "Plaza Sentral" / "50470 Kuala Lumpur").
  const home = addrGroups.filter((g) => !foreign(g));
  const withTown = home.filter((g) => POSTCODE_TOWN.test(g) || TOWN_POSTCODE.test(g) || UK_POSTCODE.test(g));
  area = withTown[0] || home[0] || addrGroups[0] || '';
  if (CITY_HEADING && area) {
    const h = (e.heading.split(' > ').pop() || '').replace(/^(?:A|À|En|Au)\s+/i, '').replace(/[:()]/g, ' ').trim();
    if (h && !L.fold(area).includes(L.fold(h.split(/\s+/)[0]))) area = area + ', ' + h;
  }

  const own = [...new Set([...langs, ...(langs.length ? [] : e.headingLangs)])];
  const inScope = !SCOPE || SCOPE.test(e.heading);
  let languages = own;
  if (ROSTER.length && inScope) languages = [...new Set([...ROSTER, ...own])];
  languages = languages.filter((c) => !DROP.has(c));

  rows.push({
    heading: e.heading,
    specialty: [AS, e.catHeading, ...specBits].filter(Boolean).join(' | '),
    role: NO_ROLE ? '' : roleBits.join('; ').replace(/\s+/g, ' ').slice(0, 300),
    name: cleanName(nameLine),
    languages,
    languagesOwn: own,
    area: T.unentity(area).replace(/\s+/g, ' ').trim(),
    phone: phones.join(', '),
    email: [...new Set(emails)].join(', '),
    url,
  });
}

// A note carried by three cards is about the list, not about any of them (check_service_notes).
// Within one list, a note shared by two rows is already that: "Droit penal." on the Vienna list.
{
  const n = {};
  rows.forEach((r) => { if (r.role) n[r.role] = (n[r.role] || 0) + 1; });
  rows.forEach((r) => { if (n[r.role] > 1 || TITLE_ONLY.test(r.role) || r.role.split(/\s+/).length <= 4) r.role = ''; });
}
if (flag('--json')) {
  process.stdout.write(JSON.stringify({ rows, refused }, null, 1));
} else {
  rows.forEach((r) => console.log([r.name, r.languages.join(','), r.area, r.heading, r.role.slice(0, 60)].join(' | ')));
  console.log('\n' + rows.length + ' rows, ' + rows.filter((r) => r.languages.length).length + ' with languages, ' + refused.length + ' refused');
  refused.forEach((r) => console.log('  refused ' + r.why + ': ' + r.first + '  [' + r.heading + ']'));
}

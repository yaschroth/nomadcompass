/**
 * The words a consular list uses for a language, and how to read a line of them.
 *
 * Every mission writes the claim in its own language, so the same fact arrives as "Deutsch und
 * Englisch", "German and English" or "allemand, anglais" depending on who published the list. This
 * lexicon started inside the table reader, where it grew every time a list used a word it had not
 * seen. It lives here now because the block reader needs the same words: a second copy would drift,
 * and the language a row is filed under is the one thing on this site that must not.
 *
 * An unknown word is collected rather than guessed. It is a gap in the lexicon, not a fact about the
 * provider, and the caller decides whether to report it.
 */
const LANG = {
  deutsch: 'de', german: 'de', allemand: 'de', tedesco: 'de', aleman: 'de',
  englisch: 'en', english: 'en', anglais: 'en', inglese: 'en', ingles: 'en',
  griechisch: 'el', greek: 'el', ellinika: 'el',
  franz: 'fr', french: 'fr', francais: 'fr', francese: 'fr', frances: 'fr',
  italienisch: 'it', italian: 'it', italiano: 'it', italien: 'it',
  spanisch: 'es', spanish: 'es', span: 'es', espagnol: 'es', spagnolo: 'es',
  portugiesisch: 'pt', portuguese: 'pt', portugais: 'pt',
  russisch: 'ru', russian: 'ru', russe: 'ru',
  niederl: 'nl', dutch: 'nl', hollandisch: 'nl',
  polnisch: 'pl', polish: 'pl', polonais: 'pl',
  tuerkisch: 'tr', turkisch: 'tr', turkish: 'tr',
  arabisch: 'ar', arabic: 'ar', arabe: 'ar',
  kroatisch: 'hr', croatian: 'hr', serbisch: 'sr', serbian: 'sr',
  bulgarisch: 'bg', rumaenisch: 'ro', rumanisch: 'ro', romanian: 'ro',
  schwedisch: 'sv', swedish: 'sv', daenisch: 'da', danisch: 'da', danish: 'da',
  norwegisch: 'no', norwegian: 'no', finnisch: 'fi', finnish: 'fi',
  tschechisch: 'cs', czech: 'cs', ungarisch: 'hu', hungarian: 'hu',
  hebraeisch: 'he', hebraisch: 'he', hebrew: 'he',
  japanisch: 'ja', japanese: 'ja', chinesisch: 'zh', chinese: 'zh', mandarin: 'zh',
  koreanisch: 'ko', korean: 'ko', thai: 'th', vietnamesisch: 'vi', vietnamese: 'vi',
  hindi: 'hi', persisch: 'fa', persian: 'fa', farsi: 'fa',
  albanisch: 'sq', albanian: 'sq', ukrainisch: 'uk', ukrainian: 'uk',
  slowakisch: 'sk', slovak: 'sk', slowenisch: 'sl', slovenian: 'sl',
  indonesisch: 'id', indonesian: 'id', malaiisch: 'ms', malay: 'ms',
  singhalesisch: 'si', sinhala: 'si', tamilisch: 'ta', tamil: 'ta',
  suaheli: 'sw', swahili: 'sw', afrikaans: 'af',
  // Two spellings the Athens list gets wrong. Both are unambiguous, and dropping a language because
  // the mission mistyped it would understate what the doctor speaks.
  deutch: 'de', italienenisch: 'it',
  // Swedish, because the Swedish missions write the claim in Swedish and none of it was readable:
  // "Svensk- och engelsktalande advokater i Tyskland" annotates each of its lawyers "(svenska,
  // engelska)" and the lexicon matched not one of them. Two Swedish words already worked by
  // accident, spanska through the span- key and italienska through italien-, which is the kind of
  // luck that hides a gap.
  svenska: 'sv', svensk: 'sv', engelska: 'en', engelsk: 'en', tyska: 'de', tysk: 'de',
  franska: 'fr', finska: 'fi', norska: 'no', danska: 'da', ryska: 'ru', polska: 'pl',
  nederlandska: 'nl', hollandska: 'nl', portugisiska: 'pt', grekiska: 'el', turkiska: 'tr',
  arabiska: 'ar', kinesiska: 'zh', japanska: 'ja', koreanska: 'ko', ungerska: 'hu',
  tjeckiska: 'cs', rumanska: 'ro', estniska: 'et', lettiska: 'lv', litauiska: 'lt',
  isländska: 'is', islandska: 'is', hebreiska: 'he', persiska: 'fa', thailandska: 'th',
  // South and Southeast Asian languages the Swedish lists for India, Nepal and Cambodia name, and
  // which nothing in this directory could read: "The staff also speak Punjabi, Tamil, Bengali",
  // "communicating in English, Nepali and Hindi", "Languages: English, French, Chinese & Khmer".
  punjabi: 'pa', panjabi: 'pa', bengali: 'bn', bangla: 'bn', nepali: 'ne', nepalese: 'ne',
  khmer: 'km', cambodian: 'km', marathi: 'mr', telugu: 'te', kannada: 'kn', malayalam: 'ml',
  gujarati: 'gu', urdu: 'ur', punjab: 'pa', assamese: 'as', odia: 'or', oriya: 'or',
  lao: 'lo', burmese: 'my', tagalog: 'tl', filipino: 'tl', bahasa: 'id',
  // As the Swedish list for India spells it, twice.
  telegu: 'te',
  /**
   * French, Italian and Spanish, because each mission writes the claim in its own language and this
   * lexicon had grown by whatever the German and British lists happened to say.
   *
   * Measured 2026-08-25: of the language names a French post uses it could read nine and not the
   * other 26, so "Dr Hiroshi Yamakawa (francais, anglais, japonais)" came out as French and English
   * with the Japanese dropped. Italian was 4 of 23 and Spanish 5 of 25. France, Italy and Spain
   * between them are 73 of the 337 sources in the registry.
   *
   * Basque is left out on purpose: eu is not one of the 56 codes the dataset holds, and a code the
   * dataset does not hold makes the build refuse the row outright.
   */
  neerlandais: 'nl', olandese: 'nl', holandes: 'nl',
  tcheque: 'cs', ceco: 'cs', checo: 'cs',
  slovaque: 'sk', slovacco: 'sk', eslovaco: 'sk',
  hongrois: 'hu', ungherese: 'hu', hungaro: 'hu',
  roumain: 'ro', rumeno: 'ro', rumano: 'ro',
  bulgare: 'bg', bulgaro: 'bg',
  grec: 'el', greco: 'el', griego: 'el',
  turc: 'tr', turco: 'tr',
  arabo: 'ar',
  hebreu: 'he', ebraico: 'he', hebreo: 'he',
  japonais: 'ja', giapponese: 'ja', japones: 'ja',
  chinois: 'zh', cinese: 'zh', chino: 'zh',
  coreen: 'ko', coreano: 'ko',
  vietnamien: 'vi', vietnamita: 'vi',
  persan: 'fa', persiano: 'fa', persa: 'fa',
  suedois: 'sv', svedese: 'sv', sueco: 'sv',
  norvegien: 'no', norvegese: 'no', noruego: 'no',
  danois: 'da', danese: 'da', danes: 'da',
  finnois: 'fi', finlandese: 'fi', finlandes: 'fi',
  croate: 'hr', croato: 'hr', croata: 'hr',
  serbe: 'sr', serbo: 'sr', serbio: 'sr',
  ukrainien: 'uk', ucraino: 'uk', ucraniano: 'uk',
  albanais: 'sq', albanese: 'sq', albanes: 'sq',
  indonesien: 'id', indonesiano: 'id',
  malais: 'ms', malese: 'ms', malayo: 'ms',
  portugues: 'pt', portoghese: 'pt',
  ruso: 'ru', russo: 'ru',
  catalan: 'ca', catalano: 'ca', catala: 'ca',
  polacco: 'pl', polaco: 'pl',
};

/**
 * The abbreviations, read only where the source wrote the full stop that marks one.
 *
 * The German Embassy Lisbon annotates every doctor "(engl., franz.)" or "(deutsch, port., engl.)",
 * and of those the lexicon above could read only franz. and deutsch: forty entries came out as
 * French-speaking with English missing, which is worse than incomplete, because it takes a doctor
 * off the English page and leaves him on the French one alone.
 *
 * A prefix rule would read these without a table - "engl." is the start of "englisch" - and it also
 * reads "Tel." as Telugu, which is on every second line of every one of these lists. So the
 * abbreviations are named, and only a part that ends in a full stop is looked up here at all. Each
 * one below has been seen in a source; this is not a list of what German could abbreviate.
 */
const ABBREV = {
  dt: 'de', dtsch: 'de', deu: 'de', ted: 'de',
  engl: 'en', eng: 'en', ingl: 'en', angl: 'en',
  ital: 'it', port: 'pt', russ: 'ru', griech: 'el', niederl: 'nl', poln: 'pl',
  tschech: 'cs', ungar: 'hu', rum: 'ro', turk: 'tr', tuerk: 'tr', arab: 'ar',
  chin: 'zh', jap: 'ja', kor: 'ko', hebr: 'he', schwed: 'sv', norw: 'no',
  dan: 'da', daen: 'da', finn: 'fi', kroat: 'hr', serb: 'sr', slowak: 'sk',
  slowen: 'sl', ukr: 'uk', span: 'es', spa: 'es', franz: 'fr', esp: 'es',
};

// Under a German "Sprachen:" label a bare letter is that language's German initial. Milan writes
// "Sprachen: D / E / F / Chinesisch", and reading only the spelled-out word gave a lawyer whose one
// language was Chinese: not merely incomplete but wrong, since it would have taken him off the
// German page and put him on a Chinese one. The mixed line is what proves the convention: the list
// spells out the unusual language and abbreviates the ones its readers expect.
const LETTER = { d: 'de', e: 'en', f: 'fr', i: 'it', s: 'es', p: 'pt', n: 'nl', r: 'ru' };

const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();

/**
 * Reads one line of a language claim into codes.
 *
 * `allowLetters` is for a line under an explicit language label, where a lone "D" means German. It
 * is off by default because in free text a lone letter is an initial.
 * `unknown` is an optional Set that collects words the lexicon does not hold.
 */
const readLanguages = (line, allowLetters, unknown) => {
  const out = [];
  // A bracket is not part of a word. The Swedish list for Germany puts its languages in parentheses
  // and this file's PDF reader renders the closing one as a backslash, so the parts arrived as
  // "(svenska" and "engelska\" and startsWith matched neither. "och" is Swedish for and.
  const bare = (p) => p.replace(/^[("'[\\\s]+/, '').replace(/[)"'\]\\\s.]+$/, '');
  // The label in front of the claim, which is not one of the languages. Without this the example in
  // the comment above did not work: "Sprachen: D / E / F" gave French alone, because the first part
  // was "sprachen: d" rather than "d" and a two-word part is not a letter.
  const said = fold(line).replace(/^\s*[a-zà-ÿ ]{4,30}:\s*/, '');
  // A lone "e" is Italian for and, which is why it separates parts. Under a label where single
  // letters are the convention it is English instead, so it cannot also be the separator there.
  const parts = allowLetters
    ? said.split(/[,;/|+&]+|\band\b|\bund\b|\boch\b|\bou\b|\boder\b/)
    : said.split(/[,;/|+&]+|\band\b|\bund\b|\boch\b|\bou\b|\boder\b|\be\b/);
  // Whether the source wrote a full stop is the only thing that says a part is an abbreviation, and
  // bare() takes it off, so it is noted before that happens.
  parts.map((p) => ({ p: bare(p.trim()), raw: p }))
    .filter((x) => x.p)
    .forEach(({ p, raw }) => {
      // Every abbreviation inside the part, not only the part itself. Lisbon writes three of them
      // between two commas, "(port, franz., engl. dt.)", and reading the part as a whole finds
      // French and stops. A full stop is still what marks one, so "Tel." is looked up and missed
      // rather than read as Telugu.
      (raw.match(/[a-zà-ÿ]{2,8}\./g) || []).forEach((tok) => {
        const a = ABBREV[tok.slice(0, -1)];
        if (a && !out.includes(a)) out.push(a);
      });
      const abbreviated = /\.\s*$/.test(raw);
      // The longest key that fits, for the same reason as in readLanguagesProse below: "Malayalam"
      // begins with "malay" and the first match in insertion order is the wrong language.
      const hit = Object.keys(LANG).filter((k) => p.startsWith(k)).sort((a, b) => b.length - a.length)[0];
      if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); return; }
      if (abbreviated && ABBREV[p]) { if (!out.includes(ABBREV[p])) out.push(ABBREV[p]); return; }
      if (allowLetters && p.length === 1 && LETTER[p]) { if (!out.includes(LETTER[p])) out.push(LETTER[p]); return; }
      if (unknown && p.length > 2 && p.length < 24 && !/^\(|^[0-9]/.test(p)) unknown.add(p);
    });
  return out;
};

/**
 * Reads a language claim out of a sentence, where readLanguages needs a list.
 *
 * Most missions write "Sprachen: Deutsch, Englisch" and readLanguages splits that on the commas.
 * Some write prose instead, and the Swedish lists for India and Nepal are the reason this exists:
 * "All our staff and lawyers speak fluent English", "The firm has English and Hindi speaking staff",
 * "The staff also speak Punjabi, Tamil, Bengali and also some foreign languages like German". Split
 * on commas and not one of those parts begins with a language.
 *
 * Scanning a whole page for language words would invent claims, because "English law", "the French
 * company" and "Indian Law Institute" are not statements about anybody's staff. So only a sentence
 * that says somebody speaks is read at all, and inside such a sentence a language word counts
 * wherever it appears. That is the difference between a claim and a coincidence.
 */
const SPEAKS = /\b(speaks?|spoken|speaking|fluent|fluency|conversant|communicat\w*|talar|spricht|sprechen|parle|parla|habla)\b/i;

const readLanguagesProse = (text, unknown) => {
  const out = [];
  String(text || '').split(/(?<=[.;:!?])\s+|\n|•/).forEach((sentence) => {
    if (!SPEAKS.test(sentence)) return;
    const words = fold(sentence).split(/[^a-z]+/).filter(Boolean);
    words.forEach((w) => {
      /**
       * The longest key that fits, not the first one found.
       *
       * "Malayalam" begins with "malay", and taking the first match in insertion order filed a
       * Bangalore firm as speaking Malay, which is a different language spoken 3,000 km away. Where
       * one language's name is the start of another's, only length tells them apart.
       */
      const hit = Object.keys(LANG).filter((k) => w === k || (k.length > 4 && w.startsWith(k)))
        .sort((a, b) => b.length - a.length)[0];
      if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); return; }
      if (unknown && w.length > 4 && /\w(ese|ish|ian|ali|abic|ench|erman)$/.test(w)) unknown.add(w);
    });
  });
  return out;
};

/**
 * The words a list uses to introduce a language claim, in every language a mission publishes in.
 *
 * This is here because it was in nine places and each of them held a different, smaller set. Only
 * two readers knew "Korrespondenzsprachen", none knew "Sprachkenntnisse", which is how the German
 * embassy Warsaw labels all 51 of its doctors, and none knew "Langues pratiquees", which is how the
 * French consulate Milan labels 56 of its 65 lawyers. 940 rows were read and thrown away for
 * stating no language on sources whose verifier had confirmed that every entry states one.
 *
 * A label the readers do not know is not a missing language, it is a missing word, and a missing
 * word here is silent: the row simply goes out with nothing, or is refused as claiming nothing.
 */
const CLAIM_LABEL = '(?:Sprachkenntnisse|Sprachen|Sprache|Korrespondenzsprachen|Korrespondenzsprache'
  + '|Korrespondenz|Arbeitssprachen|Arbeitssprache|Muttersprache|Fremdsprachen|Fremdsprache'
  + '|Languages? spoken|Spoken languages?|Languages?|Speaks|Spricht'
  + '|Langues pratiqu[ée]es|Langues|Langue|Idiomas?|Lingue|Lingua|Lingu[ií]stica'
  + '|J[eę]zyki|Spr[åa]k|Spr[åa]kkunskaper|Talar)';
const CLAIM_LABEL_RE = new RegExp('^\\s*' + CLAIM_LABEL + '\\s*[:：]\\s*(.+)$', 'i');
// The same label met inside a line rather than at the start of one, which is where a PDF that sets
// the whole entry on one line puts it.
/**
 * The value may hold full stops, because that is where the abbreviations are.
 *
 * Stopping the capture at the first one is the obvious reading and it is wrong: the German embassy
 * Lisbon writes "Korrespondenzsprachen: Deu., Port., Franz., Eng., Spa." and the capture came back
 * as "Deu", so seven Porto and Lisbon lawyers went out claiming French alone when their own entry
 * names five languages.
 *
 * What ends the claim is a sentence, not a full stop: a full stop, a space and a capitalised word
 * with another word behind it. "Port.," has no space after the abbreviation and does not end it;
 * "Italian. The office is open" does.
 */
const CLAIM_INLINE_RE = new RegExp('\\b' + CLAIM_LABEL + '\\s*[:：]\\s*([^;\\n]{2,140})', 'i');
const untilTheNextSentence = (s) => String(s).split(/\.\s+(?=[A-Z][a-z]{2,}\s)/)[0];

/**
 * The claim written as a question the entry answers.
 *
 * The US embassy Buenos Aires gives each doctor a field reading "English-speaking: Yes", and the
 * FCDO's lists do the same in a column of their own. The language is in the LABEL and the value is
 * a yes, so a reader looking for a language in the value finds nothing at all: 106 Buenos Aires
 * rows were refused for claiming no language by a page that claims one for every entry.
 *
 * A No is a claim too, and the answer to it is to read nothing rather than to read the language.
 */
const SPEAKING_ANSWER = /\b([A-Za-zÀ-ÿ]{4,20})[-\s]speaking\s*[:?]?\s*(yes|no|ja|nein|si|sí|no|oui|non)\b/gi;
const AFFIRMATIVE = /^(yes|ja|si|sí|oui)$/i;
const codeOf = (word) => {
  const w = fold(word);
  const hit = Object.keys(LANG).filter((k) => w === k || w.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  return hit ? LANG[hit] : '';
};
/**
 * Returns null where the page does not use this shape at all, so the caller can go on looking, and
 * an array where it does. An empty array from a page that uses it is an answer: this entry was
 * asked whether it speaks English and said no.
 */
const readSpeakingAnswer = (text) => {
  const answers = [...String(text || '').matchAll(SPEAKING_ANSWER)];
  if (!answers.length) return null;
  const out = [];
  for (const m of answers) {
    if (!AFFIRMATIVE.test(m[2])) continue;
    const c = codeOf(m[1]);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
};

/**
 * A language claim in brackets, and the two ways of getting it wrong.
 *
 * The French embassy Tokyo writes "Dr Hiroshi Yamakawa (francais, anglais, japonais)" and the German
 * missions write "(deutsch- und englischsprachig)", sometimes with a job title inside the same
 * brackets, so the test cannot be that the whole bracket is languages.
 *
 * It cannot be "contains a language word" either, because the word for a country begins with the
 * word for its language and these pages are full of countries: "Rechtsanwalt (Deutschland)",
 * "zugelassen in (Spanien)". Read as a language list those give German and Spanish on no evidence.
 * The countries are named here and taken out before the claim is read.
 */
// The Romance names for Greece and Turkey are here because the Romance names for Greek and Turkish
// are so short that the country begins with the language: grece, grecia, turquie, turchia, turquia.
const COUNTRY_WORD = /^(deutschland|osterreich|oesterreich|schweiz|frankreich|spanien|portugal|niederlande|england|grossbritannien|belgien|polen|ungarn|griechenland|turkei|tuerkei|russland|japan|china|korea|brasilien|argentinien|mexiko|kolumbien|chile|indien|thailand|vietnam|usa|eu|grece|grecia|turquie|turchia|turquia)$/;
const BRACKETED = /\(([^()]{2,120})\)|\/([^/\n]{3,120})\//g;
const readBracketed = (text, unknown) => {
  const out = [];
  for (const b of String(text || '').match(BRACKETED) || []) {
    const kept = b.slice(1, -1).split(/[,;/|+&]|\bund\b|\band\b|\bou\b|\be\b/i)
      .filter((p) => !COUNTRY_WORD.test(fold(p).replace(/[^a-z]/g, '')))
      .join(', ');
    readLanguages(kept, false, unknown).forEach((c) => { if (!out.includes(c)) out.push(c); });
  }
  return out;
};

/**
 * Every kind of claim this directory knows how to read, tried in the order of how much they prove.
 *
 * A labelled list is the strongest: the mission wrote the label and meant it. "English-speaking:
 * Yes" is as strong and only looks different. A sentence that says somebody speaks is weaker but
 * still a claim. Anything else is not read, because a language word in prose that does not say
 * anybody speaks it is a coincidence: "English law", "the French company", "Indian Law Institute".
 */
const readClaim = (text, unknown) => {
  const s = String(text || '');
  const inline = s.match(CLAIM_INLINE_RE);
  if (inline) {
    const got = readLanguages(untilTheNextSentence(inline[1]), false, unknown);
    if (got.length) return got;
  }
  // Asked and answered: whatever the answer was, it is the answer, and prose must not overrule it.
  const answered = readSpeakingAnswer(s);
  if (answered) return answered;
  const bracketed = readBracketed(s, unknown);
  if (bracketed.length) return bracketed;
  return readLanguagesProse(s, unknown);
};

module.exports = {
  LANG, LETTER, ABBREV, fold, readLanguages, readLanguagesProse, SPEAKS,
  CLAIM_LABEL, CLAIM_LABEL_RE, CLAIM_INLINE_RE, readSpeakingAnswer, readBracketed, readClaim,
};

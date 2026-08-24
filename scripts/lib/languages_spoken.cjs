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
  parts.map((p) => bare(p.trim())).filter(Boolean)
    .forEach((p) => {
      const hit = Object.keys(LANG).find((k) => p.startsWith(k));
      if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); return; }
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
      const hit = Object.keys(LANG).find((k) => w === k || (k.length > 4 && w.startsWith(k)));
      if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); return; }
      if (unknown && w.length > 4 && /\w(ese|ish|ian|ali|abic|ench|erman)$/.test(w)) unknown.add(w);
    });
  });
  return out;
};

module.exports = { LANG, LETTER, fold, readLanguages, readLanguagesProse, SPEAKS };

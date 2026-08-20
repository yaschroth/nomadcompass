/**
 * Reads a provider list written as one paragraph per entry, with the name in bold.
 *
 * This is how the US missions write theirs: a paragraph opening with the practice in bold, then the
 * address, the phone, the website, the specialties, and last of all what the entry speaks. Vienna's
 * doctors list is 251 such paragraphs and 150 of them end in "English fluent." or "Native English
 * speaker." That closing clause is a per-entry language claim, which is the strongest kind, and no
 * reader here could see it.
 *
 * The claim is read only from the end of the paragraph and only when it is stated as a proficiency
 * or as a bare list of languages. A specialty line mentioning Chinese medicine is not a claim that
 * anyone speaks Chinese, and the difference is the whole point of this file.
 *
 * Usage: node scripts/parse_html_paragraph_list.cjs <page.html> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_html_paragraph_list.cjs <page.html> [--json]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');

const strip = (s) => String(s)
  .replace(/<br\s*\/?>/gi, ', ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;|&(l|r)dquo;/g, '"').replace(/&#\d+;/g, ' ')
  .replace(/\s+/g, ' ').trim();

const LANG = {
  english: 'en', german: 'de', deutsch: 'de', french: 'fr', spanish: 'es', italian: 'it',
  russian: 'ru', hungarian: 'hu', czech: 'cs', slovak: 'sk', polish: 'pl', dutch: 'nl',
  portuguese: 'pt', arabic: 'ar', turkish: 'tr', hebrew: 'he', persian: 'fa', farsi: 'fa',
  chinese: 'zh', mandarin: 'zh', japanese: 'ja', korean: 'ko', greek: 'el', romanian: 'ro',
  croatian: 'hr', serbian: 'sr', bosnian: 'bs', slovenian: 'sl', bulgarian: 'bg', ukrainian: 'uk',
  swedish: 'sv', norwegian: 'no', danish: 'da', finnish: 'fi', hindi: 'hi', urdu: 'ur',
  swahili: 'sw', albanian: 'sq', armenian: 'hy', georgian: 'ka', thai: 'th', vietnamese: 'vi',
};
const PROFICIENCY = /\b(fluent|fluently|native|mother tongue|adequate|good|basic|spoken|speaks?|proficient|working knowledge)\b/i;

/**
 * The languages an entry claims, read from the end of its paragraph.
 *
 * Two shapes count and nothing else: a proficiency statement ("English fluent", "Native English
 * speaker", "English: Fluent") or a closing clause that is nothing but languages ("German and
 * Spanish."). Anything earlier in the paragraph is a specialty, an address or a firm name, and
 * reading a language out of it would invent a claim.
 */
const languagesOf = (text) => {
  const tail = text.slice(-120);
  const clause = (tail.split(/[;.]\s*/).filter(Boolean).pop() || '').trim();
  if (!clause || clause.length > 90) return [];
  const found = [];
  Object.keys(LANG).forEach((word) => {
    if (new RegExp('\\b' + word + '\\b', 'i').test(clause) && !found.includes(LANG[word])) found.push(LANG[word]);
  });
  if (!found.length) return [];
  if (PROFICIENCY.test(clause)) return found;
  // No proficiency word: accept only when the clause is little more than the languages themselves.
  const words = clause.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean);
  const languageWords = words.filter((w) => LANG[w.toLowerCase()]).length;
  const filler = words.filter((w) => /^(and|or|also|only|und|y|e)$/i.test(w)).length;
  return words.length - languageWords - filler <= 1 ? found : [];
};

const entries = [];
// A paragraph or list item whose first thing is bold: that bold text is the name.
for (const m of html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
  const inner = m[2];
  const boldMatch = inner.match(/^\s*(?:<[^>]+>\s*)*?<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/);
  if (!boldMatch) continue;
  const name = strip(boldMatch[2]).replace(/[,:;]\s*$/, '');
  if (!name || name.length < 4 || name.length > 90) continue;
  const text = strip(inner);
  const rest = text.slice(name.length).replace(/^[,\s:]+/, '');
  if (rest.length < 10) continue;
  // A bold lead is also how these pages set their own headings: "Tap Water", "Financial
  // difficulties", "Official websites use .gov". A provider has a way of being contacted, and a
  // paragraph of advice does not.
  const contactable = /\b(Tel|Tel\.|Phone|Fax|Mobile)\b[.:]?\s*[+\d(]|\+\d{1,3}[ \-(]\d/i.test(rest)
    || /\b\d{4,5}\b.*\b(street|str\.|strasse|gasse|platz|weg|road|rd\.|avenue|via|calle|rue|utca)\b/i.test(rest)
    || /\b(street|str\.|strasse|gasse|platz|weg|road|avenue|via|calle|rue|utca)\b.*\b\d{4,5}\b/i.test(rest);
  if (!contactable) continue;

  // The address runs from the name to wherever the contact details begin.
  const address = rest.split(/\b(?:Tel|Tel\.|Phone|Fax|Mobile|E-?mail|homepage|website|http)/i)[0]
    .replace(/[,;\s]+$/, '');
  entries.push({
    name,
    area: address.slice(0, 140),
    postcode: (address.match(/\b(\d{4,5})\b/) || [])[1] || '',
    languages: languagesOf(text),
    languageClause: (text.slice(-120).split(/[;.]\s*/).filter(Boolean).pop() || '').trim().slice(0, 60),
    url: (inner.match(/href="(https?:\/\/[^"]+)"/) || [])[1] || '',
    detail: rest.slice(0, 300),
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows: entries }, null, 1));
} else {
  console.log(entries.length + ' entries, ' + entries.filter((e) => e.languages.length).length
    + ' stating a language of their own, ' + entries.filter((e) => e.postcode).length + ' with a postcode');
  entries.slice(0, 8).forEach((e) => console.log('  ' + e.name.slice(0, 34).padEnd(36)
    + (e.languages.join(',') || '-').padEnd(10) + e.area.slice(0, 44)));
  const without = entries.filter((e) => !e.languages.length).slice(0, 3);
  if (without.length) console.log('  no claim read from, for example: ' + without.map((e) => '"' + e.languageClause + '"').join(' | ').slice(0, 150));
}

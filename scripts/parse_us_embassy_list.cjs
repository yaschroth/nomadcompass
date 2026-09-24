/**
 * Reads the provider lists the U.S. embassies and consulates publish: doctors, hospitals, lawyers,
 * a few dentists and translators, almost all of them PDFs, a handful Word documents.
 *
 * They are one family in their words and seventy in their layout. Every one opens with the same
 * State Department disclaimer and most say "the information ... on language ability [is] provided
 * directly by the lawyers", but one sets its entries as blocks with blank lines between them, the
 * next as a run of labelled lines with no blank line anywhere, and a third names the entry on the
 * line before "Address:". So the layout is an option the manifest passes, and the reading of the
 * language claim, which is the part that must not vary, is done here once for all of them.
 *
 * How an entry is found (the manifest picks one with parserArgs):
 *   (default)            blocks separated by blank lines in pdftotext -layout output; the first line
 *                        is the name. A block that opens with a label ("Tel:", "Address:") or with a
 *                        small letter is the rest of the entry above it, cut by a page break.
 *   --name-before <re>   pdftotext -raw output; the name is the line right before any line matching
 *                        <re> (usually ^Address). The India lists have no blank lines at all.
 *   --start <re>         a line matching <re> opens a new entry and is its name.
 * Other options:
 *   --raw                read with pdftotext -raw instead of -layout (content order, no blank lines).
 *   --from <re> / --until <re>   ignore everything before the first / after the first matching line.
 *   --place-from-heading pass the section heading along as `detail`, so a list that heads each town
 *                        and then leaves it out of the address can still be placed. Only for lists
 *                        whose headings are towns, and checked by hand when used.
 *   --cols               cut each layout line at its widest gap and read the left column first.
 *
 * The language claim. These lists write it every way there is, and each of these is in a source:
 *   "Languages spoken: English, Hindi, Marathi"      a labelled list
 *   "Languages: Greek, English (Fluent), French (Basic)"  a labelled list with a level per language
 *   "ENGLISH: Fluent" / "English Spoken: Fluent" / "Ability to read/speak English: Fluent"
 *   "English Language spoken: Extensive" (India)      a level for English alone
 *   "Beijing Tianbo Law Firm (English-speaking)"      a tag on the name
 *   "Speaks English and Hebrew." / "Fluent in English." prose
 * The rules that make it safe:
 *   - A level that hedges is not a claim. "French (Basic)", "Arabic (limited)", "English: Good/limited",
 *     "Spanish (not fluent)" and "(intermediate)" give nothing for that language. A level written
 *     after a group of languages joined by "and" applies to the whole group.
 *   - A level for English alone beats the list. India writes "Languages spoken: Kannada & Marathi"
 *     and then "English Language spoken: Limited" under the same hospital; English is dropped even
 *     where the list above it names English.
 *   - Prose is only read where somebody speaks, and not where that somebody is the secretary, the
 *     receptionist or the answering machine: "(Secretary speaks English)" and "message is in Hebrew
 *     & English" say nothing about the doctor. "Experience treating English speaking or U.S.
 *     patients" is about the patients and is not read either.
 *   - More than six languages for one provider is refused whole, by the directory's own rule.
 *
 * Usage: node scripts/parse_us_embassy_list.cjs <file.pdf|.docx|.txt> [options] [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const argv = process.argv.slice(2);
const file = argv[0];
if (!file) { console.error('usage: node scripts/parse_us_embassy_list.cjs <file> [--raw] [--start <re>] [--name-before <re>] [--json]'); process.exit(2); }
const opt = (k) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : ''; };
const RAW = argv.includes('--raw');
const START = opt('--start') ? new RegExp(opt('--start')) : null;
const NAME_BEFORE = opt('--name-before') ? new RegExp(opt('--name-before'), 'i') : null;
const FROM = opt('--from') ? new RegExp(opt('--from')) : null;
const UNTIL = opt('--until') ? new RegExp(opt('--until')) : null;
const PLACE_FROM_HEADING = argv.includes('--place-from-heading');
const COLS = argv.includes('--cols');
// The entry's own specialty line goes to the ingest's categoriser only on medical lists: on a law list
// "Specialty: taxation, customs" or "medical malpractice" would file the firm as tax or as a doctor.
const SPEC = argv.includes('--spec');
// Every entry on the list has labelled fields (Address:, Telephone:): a block without one is not an entry.
const NEED_LABEL = argv.includes('--need-label');
const PERSON = opt('--person') ? new RegExp(opt('--person')) : null;
const SEP = opt('--sep') ? new RegExp(opt('--sep')) : null;
// The line under the name is the specialty, not the first line of the address (the Mumbai list).
const SECOND_LINE_SPEC = argv.includes('--second-line-specialty');

// ---------------------------------------------------------------- text
const textOf = () => {
  if (/\.pdf$/i.test(file)) {
    // --layout keeps the layout reading even with --name-before (Seoul: labels in a column).
    const raw = RAW || (NAME_BEFORE && !argv.includes('--layout'));
    const out = path.join(os.tmpdir(), 'usemb-' + path.basename(file).replace(/\W+/g, '') + (raw ? '-raw' : '') + '.txt');
    execFileSync('pdftotext', [raw ? '-raw' : '-layout', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
    return fs.readFileSync(out, 'utf8');
  }
  if (/\.docx$/i.test(file)) {
    // A Word list is paragraphs, and a table cell is a paragraph of its own: each cell's text on its
    // own line, a blank line after each table row so a row reads as one block.
    const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 1 << 28 });
    const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
    return unesc(xml
      .replace(/<\/w:tr>/g, '\n\n')
      .replace(/<w:br\s*\/?>/g, '\n')
      // --left-of-tab: the Bucharest list sets the firm and its address left of a tab stop and its
      // practice areas right of it, line by line; only the left side is the entry.
      .replace(/<w:tab\s*\/?>/g, argv.includes('--left-of-tab') ? '\u0001' : ' ')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''));
  }
  return fs.readFileSync(file, 'utf8');
};

// Written as code points, not as characters, so the file stays plain ASCII.
const ch = (...cps) => String.fromCharCode(...cps);
const WIDE_SPACE = new RegExp('[' + ch(0xa0, 0x3000) + ']', 'g');
const WIDE_COLON = new RegExp(ch(0xff1a), 'g');
// Chinese characters sit beside the romanised name and address on the China list; the directory prints ASCII.
const CJK = new RegExp('[' + ch(0x3400) + '-' + ch(0x9fff) + ch(0xff00) + '-' + ch(0xffef) + ch(0x3001) + '-' + ch(0x303f) + ']+', 'g');
let lines = textOf().split(/\r?\n/).map((l) => l.replace(/\f/g, '').replace(WIDE_SPACE, ' ').replace(WIDE_COLON, ': ').replace(CJK, ' ').replace(/\(\s*\)/g, ' ').replace(/\s*Back to Top\s*$/i, '').trimEnd());
if (argv.includes('--left-of-tab')) lines = lines.map((l) => l.split('\u0001')[0].trimEnd());
// --colonize "Address|Telephone|Fax": a list that sets its labels in a column with no colon after
// them ("Address    445 Hakdong-ro, Seoul"), which every label test here expects.
if (opt('--colonize')) {
  const re = new RegExp('^(\\s*)(' + opt('--colonize') + ')\\s{2,}', 'i');
  lines = lines.map((l) => l.replace(re, '$1$2: '));
}
if (FROM) { const i = lines.findIndex((l) => FROM.test(l)); if (i >= 0) lines = lines.slice(i); }
if (UNTIL) { const i = lines.findIndex((l, k) => k > 0 && UNTIL.test(l)); if (i >= 0) lines = lines.slice(0, i); }
if (COLS) {
  const left = []; const right = [];
  lines.forEach((l) => {
    const gaps = [...l.matchAll(/ {4,}/g)].filter((m) => m.index > 15);
    const widest = gaps.sort((a, b) => b[0].length - a[0].length)[0];
    if (!widest) { left.push(l); right.push(''); return; }
    left.push(l.slice(0, widest.index)); right.push(l.slice(widest.index + widest[0].length));
  });
  lines = left.concat(['', ''], right);
}

// Page furniture: page numbers, the classification banner, and any line that repeats on most pages.
const seen = {};
lines.forEach((l) => { const k = l.trim(); if (k) seen[k] = (seen[k] || 0) + 1; });
const FURNITURE = /^(?:\d{1,3}|\d+\s*\/\s*\d+|page \d+( of \d+)?|p a g e \| \d+|SENSITIVE BUT UNCLASSIFIED|UNCLASSIFIED|SBU|.*SBU\s*-\s*PRIVACY OR PII)$/i;
lines = lines.map((l) => {
  const t = l.trim();
  if (FURNITURE.test(t) || (seen[t] >= 4 && t.length > 12 && !/:/.test(t))) return '';
  return l;
});

// ---------------------------------------------------------------- labels
// A line that opens with one of these is a field of the entry above it, never the start of one.
const LABEL = /^\s*(?:[\u2022\u00b7\u25aa\-*]\s*)?(?:Address|Addr|Office|Office Address|Physical Address|Location|Tel|Tel\.|Telephone|Phone|Ph|Mobile|Mob|Cell|Cellular|Fax|E-?mail|Email ID|Website|Web|Web ?site|Url|Specialty|Speciali[sz]ation|Specialties|Specializes in|Areas? of (?:practice|expertise|law|specialization)|Practice areas?|Area|Languages?(?: spoken)?|Spoken languages?|Other languages(?: spoken)?|Foreign languages?|English(?:[\w /]*)?|Ability to read\/speak English|Office hours|Hours|Working hours|Medical License|License|Licensed|Education|Qualifications?|Credentials|Experience|Admitted|Bar|Membership|Member|Fees?|Insurance|Contact(?: person)?|Contact details|Hospital affiliation|Affiliation|Affiliated|Online consultation|Casualty|After Hours(?: Availability)?|Work|Home|Landmark|Consulting Rooms|OPD|Emergency|Notes?|Remarks?|Services?|Staff|Direct|WhatsApp|Whatsapp|Hotline|Open|Clinic|Branch|Head office|Main office|Postal address|Mailing address|Also|Other)\b[^:\n]{0,40}:/i;
const ADDRESS_LABEL = /^\s*(?:Street Address|Office Location|Office Address|Address|Addr|Office Address|Physical Address|Location|Postal address|Mailing address|Office)\s*[:\-]\s*/i;
// Single letters too, where a colon follows: The Hague writes "T: +31...", "E:", "W:".
const CONTACT_LABEL = /^\s*(?:[TEWFM](?=:)|Tel|Tel\.|Telephone|Phone|Ph|Mobile|Mob|Cell|Cellular|Fax|E-?mail|Email ID|Website|Web|Url|WhatsApp|Hotline|Direct)\b/i;

// ---------------------------------------------------------------- the language claim
const HEDGE = /\b(basic|basics|limited|intermediate|pre-intermediate|conversational|some|little|elementary|beginn\w*|not fluent|non-fluent|fair|moderate|average|poor|passive|understand\w*|reading|read only|written only|working knowledge|a bit|minimal|partial|rudimentary|survival|medium|lower|learning|no)\b/i;
const POSITIVE = /\b(fluent\w*|native|mother tongue|excellent|very good|good|proficien\w*|full|professional|business|advanced|high|extensive|yes|bilingual|first language|c1|c2)\b/i;

const codeOf = (w) => {
  const f = L.fold(w).replace(/[^a-z]/g, '');
  if (f.length < 3) return '';
  const hit = Object.keys(L.LANG).filter((k) => f === k || (k.length > 3 && f.startsWith(k))).sort((a, b) => b.length - a.length)[0];
  return hit ? L.LANG[hit] : '';
};
const codesIn = (s) => {
  const out = [];
  String(s).split(/[^A-Za-z\u00c0-\u00ff-]+/).forEach((w) => {
    // "English-speaking" and "Spanish-speaking" name their language before the dash.
    const c = codeOf(w.split('-')[0]);
    if (c && !out.includes(c)) out.push(c);
  });
  return out;
};

/**
 * One value of a language field, e.g. "Greek, English (Fluent), French (Basic)" or
 * "Italian (native), German and English (proficiency) French and Spanish (intermediate)".
 * Cut at commas, semicolons and at a closing bracket, so a level stays with the group it follows.
 */
const readValue = (value) => {
  const keep = []; const drop = [];
  // A full stop ends a group too: "Spanish, English & French. Working knowledge of Portuguese and
  // Italian." hedges the second sentence, not the first.
  String(value).replace(/\)\s*(?=[A-Za-z])/g, '),')
    .split(/[,;]|\.\s+|\s-\s|\/(?=\s*[A-Z])/).forEach((seg) => {
    const langs = codesIn(seg.replace(/\([^)]*\)/g, ' ').replace(/\b(fluent|native|good|basic|limited|some|intermediate|spoken|written|and|only|in)\b/gi, ' '));
    if (!langs.length) return;
    const quals = (seg.match(/\(([^)]*)\)/g) || []).join(' ') + ' ' + seg.replace(/\([^)]*\)/g, ' ');
    // "not fluent" contains "fluent": the hedge is tested first.
    if (HEDGE.test(quals.replace(/\b(?:english|arabic|spanish|french|german)\b/gi, ' ')) && !/\bno\b.*\b(?:problem|issue)/i.test(quals)) {
      langs.forEach((c) => { if (!drop.includes(c)) drop.push(c); });
      return;
    }
    langs.forEach((c) => { if (!keep.includes(c)) keep.push(c); });
  });
  return { keep: keep.filter((c) => !drop.includes(c)), drop };
};

// Somebody other than the provider. A claim about them is not a claim about the provider.
const NOT_THE_PROVIDER = /\b(secretar\w*|reception\w*|receptionist|assistant|front desk|nurse|nurses|message|recording|voicemail|answering|website|web site|prompt|option|helpline|hotline|patients?|clients?|community|brochure|forms?|documents?|translation of|translat\w+ (?:of|into)|classes|course|instruction|notes|reports?)\b/i;
// "Our language capabilities include English, Arabic and French." (Doha) is a claim too.
// "Very good English." (Amman) likewise.
const SPEAK_VERB = /\b(speaks?|speaking|spoken|fluent|fluency|conversant|language capabilit\w*|(?:very good|excellent) (?:english|arabic|french|german|spanish))\b/i;

const readEntryLanguages = (entryLines, name) => {
  const text = entryLines.join('\n');
  const keep = []; const drop = [];
  const add = (r) => { r.keep.forEach((c) => { if (!keep.includes(c)) keep.push(c); }); r.drop.forEach((c) => { if (!drop.includes(c)) drop.push(c); }); };
  let sawClaim = false;
  let englishLevel = null; // true = claimed, false = hedged or denied

  // 1. The tag on the name: "(English-speaking)".
  const tag = String(name).match(/\(([^)]*speaking[^)]*)\)/i);
  if (tag) { add({ keep: codesIn(tag[1]), drop: [] }); sawClaim = true; }

  for (let i = 0; i < entryLines.length; i += 1) {
    const l = entryLines[i].trim();
    // 2. A level for English alone: "ENGLISH: Fluent", "English Spoken: Fluent", "English Language
    // spoken: Extensive", "Ability to read/speak English: Good/limited", "English/ French Spoken: Fluent".
    const lvl = l.match(/^(?:[\u2022\u00b7\-*]\s*)?(?:Ability to (?:read\/speak|speak\/read|speak) English|((?:English|Spanish|French|German|Italian|Arabic|Russian|Portuguese|Chinese|Mandarin|Japanese|Hebrew)(?:\s*[\/&,]\s*(?:English|Spanish|French|German|Italian|Arabic|Russian|Portuguese|Chinese|Mandarin|Japanese|Hebrew))*)(?:\s+Language)?(?:\s+(?:spoken|speaking|proficiency|level|ability))?)\s*[:\-]\s*([^\n]*)$/i);
    if (lvl && !/^english\s*[:\-]\s*(?:and|,)/i.test(l)) {
      const who = lvl[1] ? codesIn(lvl[1]) : ['en'];
      // The value may go on to name other languages: "English: Fluent Other: French (fluent), German (limited)".
      const [level, rest] = lvl[2].split(/\bOthers?(?: languages?)?\s*:/i);
      const firstWord = String(level).trim();
      const positive = POSITIVE.test(firstWord) && !HEDGE.test(firstWord);
      who.forEach((c) => {
        if (positive) { if (!keep.includes(c)) keep.push(c); if (c === 'en') englishLevel = true; } else { if (!drop.includes(c)) drop.push(c); if (c === 'en') englishLevel = false; }
      });
      if (rest) add(readValue(rest));
      sawClaim = true;
      continue;
    }
    // 3. A labelled list, which may wrap onto the next line.
    const lab = l.match(/^(?:[\u2022\u00b7\-*]\s*)?(?:(?:Other|Foreign|Spoken|Working)\s+)?(?:Languages?|Language\(s\)|Idiomas?)(?:\s+(?:spoken|spoken in the office|used))?\s*[:\-]\s*(.*)$/i)
      || l.match(/^(?:[\u2022\u00b7\-*]\s*)?Spoken languages?\s*[:\-]\s*(.*)$/i)
      // "Correspondence: English, French, Arabic" (Cairo), the English form of the German lists'
      // Korrespondenzsprachen, which the directory already reads as a claim.
      || l.match(/^Correspondence(?: languages?)?\s*:\s*(.*)$/i)
      // Set on the same line as the e-mail: "Email: ozlembendasan@hotmail.com Language: English, Turkish".
      || l.match(/^(?:E-?mail|Web(?:site|page)?|Fax|Tel\w*|Office)\b.*?\s(?:Languages?|Language\(s\))(?:\s+spoken)?\s*:\s*(.*)$/i)
      // Or at the end of a paragraph of prose: "...Parental Child Abduction. Languages: Spanish/English." (Panama).
      || l.match(/[.;]\s+(?:Languages?|Language\(s\))(?:\s+spoken)?\s*:\s*(.*)$/i);
    if (lab) {
      let value = lab[1];
      // "Languages Spoken:" with the value on the next line, or a value that ends mid-list.
      let j = i + 1;
      while (j < entryLines.length && j <= i + 2 && (!value.trim() || /(,|\band|&)\s*$/i.test(value))
        && !LABEL.test(entryLines[j]) && entryLines[j].trim()) { value += ' ' + entryLines[j].trim(); j += 1; }
      // "Languages: Fluent in English, Hindi and Kannada" and "Language: fluently English." read the same.
      add(readValue(value.replace(/\b(fluently|fluent in|fluent|native|also|mostly)\b/gi, ' ').replace(/^\s*[:\-]/, '')));
      sawClaim = true;
      continue;
    }
  }

  // 4. Prose, only where somebody speaks and it is not somebody else.
  if (!sawClaim) {
    text.replace(/\n/g, ' ').split(/(?<=[.;!?])\s+|\s{3,}|\u2022/).forEach((sentence) => {
      if (!SPEAK_VERB.test(sentence) || NOT_THE_PROVIDER.test(sentence)) return;
      // "English speaking" as an adjective in front of a noun that is not the provider is covered by
      // NOT_THE_PROVIDER; a sentence of prose with a level word in it is read with readValue.
      const s = sentence.replace(/\b(speaks?|speaking|spoken|fluent(?:ly)? in|fluent(?:ly)?|conversant in|he|she|they|also|the doctor|dr\.?)\b/gi, ',');
      const r = readValue(s);
      if (r.keep.length || r.drop.length) { add(r); sawClaim = true; }
    });
  }
  let out = keep.filter((c) => !drop.includes(c));
  if (englishLevel === false) out = out.filter((c) => c !== 'en');
  if (englishLevel === true && !out.includes('en')) out.push('en');
  const tooMany = out.length > 6;
  return { languages: tooMany ? [] : out.sort(), tooMany, sawClaim, hedged: drop };
};

// ---------------------------------------------------------------- headings
const looksLikeHeading = (l) => {
  const t = l.trim();
  if (!t || t.length > 70 || /\d{3,}|@|www\.|https?:/i.test(t) || LABEL.test(t)) return false;
  // "La Paz Consular District": a section in mixed case.
  if (/^[A-Z][\w ,.'-]{2,40} Consular District$/.test(t)) return true;
  // A colon at the end does not make a heading: the Santo Domingo list ends every firm's name with
  // one, "Aaron Suero & Pedersini DLawyers:".
  const letters = t.replace(/[^A-Za-z\u00c0-\u00ff]/g, '');
  if (letters.length < 3) return false;
  const upper = t.replace(/[^A-Z\u00c0-\u00de]/g, '').length;
  return upper / letters.length > 0.85;
};

// ---------------------------------------------------------------- entries
const entries = [];
let heading = '';
let headings = [];
// A heading misspelt on the list is a category the ingest cannot read: Chennai heads its
// psychotherapist "PSYCOTHERAPY" and he would have been filed as a general doctor.
const HEADING_TYPOS = [[/\bPSYCOTHERAP/i, 'PSYCHOTHERAP'], [/\bOPTHALM/i, 'OPHTHALM'], [/\bPEADIATR/i, 'PAEDIATR'], [/\bPSYCHITR/i, 'PSYCHIATR']];
const pushHeading = (h) => {
  heading = HEADING_TYPOS.reduce((t, [re, r]) => t.replace(re, r), h.replace(/[:\s]+$/, '').trim());
  // ORTHODONTISTS, PERIODONTISTS and PROSTHODONTICS name no word the ingest files as dental.
  if (/odont/i.test(heading) && !/dent(al|ist)/i.test(heading)) heading += ' (dental)'; headings = headings.concat(heading).slice(-3); };

if (opt('--line-re')) {
  /**
   * --line-re <re>: one entry per line of a table read in content order, group 1 the name and group
   * 2 the rest (street, town, postcode). Bratislava's list is "JUDr. Ficek, Milan Zilinska 14
   * Bratislava 811 05": no column survives, but a title, a surname and a given name end the name.
   */
  const re = new RegExp(opt('--line-re'), 'u');
  for (const raw of lines) {
    const l = raw.trim();
    const m = l.match(re);
    if (m) entries.push({ heading, headings: headings.slice(), lines: [m[1], m[2]] });
    else if (looksLikeHeading(l)) pushHeading(l);
  }
} else if (argv.includes('--one-line')) {
  /**
   * --one-line: one entry per line, "Name: address", with the telephone in a column to the right
   * (the Athens and Thessaloniki medical lists). A town in capitals may lead the line, "CRETE:
   * General Hospital of Chania: 28 Ag. Eleftheriou Str., Chania", and is kept at the end of the
   * address, where it helps the placement and cannot become the name.
   */
  for (const raw of lines) {
    const l = raw.trim().split(/\s{3,}Tel\b|\s{3,}(?=\S)/)[0].replace(/\s+Tel:.*$/, '').trim();
    if (!l) continue;
    if (looksLikeHeading(l) && !/:/.test(l)) { pushHeading(l); continue; }
    const m = l.match(/^(?:([A-Z][A-Z/ ]{2,24}):\s+)?([^:]{3,90}?):\s*(.+)$/);
    if (!m || LABEL.test(l) || !/\d|Str\.|Ave|Blvd/.test(m[3])) continue;
    entries.push({ heading, headings: headings.slice(), lines: [m[2], m[3] + (m[1] ? ', ' + m[1] : '')] });
  }
} else if (NAME_BEFORE || START || SEP) {
  const ls = lines.map((l) => l.trim());
  let cur = null;
  for (let i = 0; i < ls.length; i += 1) {
    const l = ls[i];
    if (!l) continue;
    // The next line that has anything on it: a layout reading puts blank lines between fields.
    const after = (k) => { let j = k + 1; while (j < ls.length && !ls[j]) j += 1; return ls[j] || ''; };
    // --sep <re> with --start ".": a separator line ("-----", Spain) closes the entry, and the first
    // line after it that is not a heading opens the next.
    if (SEP && SEP.test(l)) { if (cur) entries.push(cur); cur = null; continue; }
    // A line of prose (the paragraph about the region before the first firm) opens nothing.
    const opens = SEP ? (!cur && !looksLikeHeading(l) && l.split(/\s+/).length <= 8 && !/:/.test(l)) : START ? START.test(l) : (NAME_BEFORE.test(after(i)) && !NAME_BEFORE.test(l) && !LABEL.test(l));
    if (opens) {
      if (cur) entries.push(cur);
      // A name set over two lines: "SUNDARAM MEDICAL FOUNDATION" over "In-patient Services", "VIJAYA
      // HOSPITAL" over "(Unit of Vijaya Medical & Educational Trust)". The first line was taken for a
      // heading; it is the name, and the second line qualifies it.
      if (/^\(|^(?:In|Out)-patient|^Institution\b|^A unit\b/i.test(l) && heading && ls[i - 1] === heading) {
        const own = heading;
        headings = headings.slice(0, -1);
        heading = headings[headings.length - 1] || '';
        cur = { heading, headings: headings.slice(), lines: [own + (/^\(/.test(l) ? '' : ' ' + l)] };
        continue;
      }
      cur = { heading, headings: headings.slice(), lines: [l] };
      continue;
    }
    // A heading only between entries: a short capitalised line that is not a field and is followed
    // by the next entry's name or another heading.
    if (looksLikeHeading(l) && !LABEL.test(l)) {
      const nextOpens = SEP ? false : START ? START.test(ls[i + 1] || '') : NAME_BEFORE.test(ls[i + 2] || '');
      const nextIsHeading = looksLikeHeading(ls[i + 1] || '');
      if (nextOpens || nextIsHeading || !cur) { pushHeading(l); continue; }
    }
    if (cur) cur.lines.push(l);
  }
  if (cur) entries.push(cur);
} else {
  let block = [];
  const flush = () => {
    if (!block.length) return;
    const first = block[0];
    const prev = entries[entries.length - 1];
    // The rest of the entry above, cut off by a page break or a stray blank line.
    // With --need-label, on a list where every entry carries labelled fields, a block with no field
    // at all is the tail of the entry above: the Santo Domingo list breaks "Specializes in:" across
    // pages and the second half, starting with a capital, took the firm's language line with it.
    // A name alone ("A-LAW INTERNATIONAL LAW FIRM", then a blank line, then the address) has no field
    // either, and is the start of the next entry, not the end of the last one.
    const letters = first.replace(/[^A-Za-z]/g, '');
    const nameBlock = block.length <= 2 && letters.length > 3 && first.replace(/[^A-Z]/g, '').length / letters.length > 0.6;
    const noField = NEED_LABEL && !nameBlock && !block.some((l) => ADDRESS_LABEL.test(l) || CONTACT_LABEL.test(l));
    // An address line opening a block is the firm above it, cut off by a page break:
    // "Marken medien meyen" / 14/14 / "Breite Str. 22, 41460 Neuss".
    const isStreet = /\b\d{4,5}\b/.test(first) && /(str\.|stra(ss|ß)e|street|road|avenue|platz|weg\b|allee|via |rue )/i.test(first);
    // A name standing alone over a blank line is the name of the block that follows it.
    // Or two: the firm and the lawyer ("DU MONGH LAWYERS" / "Johan DU MONGH").
    const nameAlone = prev && prev.lines.length <= 2 && prev.heading === heading
      && !prev.lines.some((l) => /\d|@/.test(l) || LABEL.test(l) || l.split(/\s+/).length > 7);
    const continues = prev && (noField || isStreet || nameAlone || LABEL.test(first) || /^[a-z(&,]/.test(first) || (/^\d/.test(first) && !/^\d+\.\s+[A-Z]/.test(first)));
    if (continues) prev.lines.push(...block);
    else entries.push({ heading, headings: headings.slice(), lines: block.slice(), indent: blockIndent });
    block = [];
  };
  let blockIndent = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i].trim();
    if (!l) { flush(); continue; }
    // A heading stands alone. A firm set in capitals, "DVMS LEGAL, S.R.L. (ECIJA)", has its address
    // on the very next line and is an entry.
    const next = (lines[i + 1] || '').trim();
    // --centered-headings: only a centred line is a heading (Brussels sets its towns in the middle of
    // the page and its firms, also in capitals, at the margin).
    const centred = !argv.includes('--centered-headings') || /^\s{12,}/.test(lines[i]);
    const alone = (!next || looksLikeHeading(next)) && centred;
    if (!block.length && looksLikeHeading(l) && alone) { flush(); pushHeading(l); continue; }
    if (!block.length) blockIndent = lines[i].length - lines[i].trimStart().length;
    block.push(l.replace(/\s{3,}/g, '   '));
  }
  flush();
}

// ---------------------------------------------------------------- rows
const cleanName = (n) => String(n)
  .replace(/\((?:[^)]*speaking[^)]*)\)/ig, ' ')
  .replace(/^\s*(?:(?:[\u2022\u00b7\u25aa*\-]|\d{1,3}[.)]|[A-Z]\))\s*)+/, '')
  .replace(/^(?:Name|Law Firm|Firm|Attorney|Lawyer|Doctor|Hospital|Clinic)\s*:\s*/i, '')
  .replace(/\s{2,}.*$/, '')
  // A telephone number set on the name's line: "DR. INDIKA WEERAPERUMA (077) 1109061".
  .replace(/\s+[(+]?\d[\d\s()./-]{6,}.*$/, '')
  // A specialty in brackets after the name, "Dr. Branimir Jurisic (Cardiologist)": the heading says
  // what the doctor does, and a bracket in a name is refused by the ingest.
  .replace(/\s*\([^()]*\)\s*$/, '')
  .replace(/[\s,;:\u2013-]+$/, '')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The name, without what the line goes on to say about it, and in reading order.
 *
 * "CASTEL, Dr. Elias - Gynecology & High Risk Pregnancy" is a name, a dash and a specialty; the part
 * after a spaced dash is what the doctor does, which the section heading already says. And a
 * surname written first in capitals is turned round, "Dr. Elias Castel", because that is how every
 * other card in the directory reads. Only that exact shape is turned round: a firm name with commas
 * in it ("Skadden, Arps, Slate, Meagher & Flom LLP") has no lower-case given name after its comma.
 */
const DASH = new RegExp('\\s[-' + String.fromCharCode(0x2013, 0x2014) + ']\\s');
const readingOrder = (n, isPersonIn) => {
  let out = n;
  // A Slovak or Czech academic title in front says the entry is a person: "JUDr. Ficek, Milan".
  let isPerson = isPersonIn;
  if (/^(?:JUDr|Mgr|PhDr|Ing)\.\s?/.test(out)) { out = out.replace(/^(?:JUDr|Mgr|PhDr|Ing)\.\s?/, '').replace(/,\s*PhD\.?$/, ''); isPerson = true; }
  const cut = out.split(DASH);
  if (cut.length > 1 && cut[0].split(/\s+/).length >= 2) out = cut[0].trim();
  // "SURNAME, Dr., Given, LL.M." and, for a lawyer listed under his firm, "Becker, Caitlin" too.
  // The surname must be in capitals unless the entry is known to be a person, so a firm called
  // "Skadden, Arps" is never turned round.
  // No i flag: with it [\p{Ll}] matched capitals too, "RUSSO, VINCENZO" was turned round here and
  // then turned back by the no-comma rule below.
  const m = out.match(/^((?:(?:[Vv]on|[Vv]an|[Dd]e|[Dd]i|[Dd]a|[Dd]el|[Dd]er)\s+)?[\p{Lu}][\p{L}'-]+(?:[ -][\p{Lu}][\p{L}'-]+)?),\s*((?:Dr|Prof|Mr|Mrs|Ms)\.?,?\s*)?([\p{Lu}][\p{Ll}][\p{L}.' -]*?)(?:,?\s*(?:Dr\.?|M\.?D\.?|MD|LL\.?M\.?|Ph\.?D\.?))?$/u);
  if (m && (isPerson || m[1] === m[1].toUpperCase())) {
    const sur = m[1] === m[1].toUpperCase()
      ? m[1].toLowerCase().replace(/(^|[ '-])(\p{Ll})/gu, (x, a, b) => a + b.toUpperCase()) : m[1];
    out = ((m[2] ? m[2].replace(/,/g, '').trim() + ' ' : '') + m[3].trim() + ' ' + sur).trim();
  }
  // "RUSSO, VINCENZO": both in capitals (Naples).
  const allCaps = out.match(/^([\p{Lu}'-]+(?: [\p{Lu}'-]+)?), ([\p{Lu}'-]+(?: [\p{Lu}'-]+)?)$/u);
  const tc = (s) => s.toLowerCase().replace(/(^|[ '-])(\p{Ll})/gu, (x, a, b) => a + b.toUpperCase());
  if (allCaps && !/\b(LAW|LEGAL|CLINIC|DENTAL|HOSPITAL|MEDICAL|CENTER|CENTRE|GROUP|PARTNERS|ASSOCIATES|OFFICE|LLC|LLP|CO|INC)\b/.test(out)) {
    out = tc(allCaps[2]) + ' ' + tc(allCaps[1]);
  }
  // "BEETH Eric": surname in capitals, given name after it, no comma (Brussels). Not where the capitals
  // are the words for a business: "SCANDINAVIAN DENTAL Clinic" stays as it is.
  const noComma = out.match(/^((?:VAN |VON |DE |DI |LE )?[\p{Lu}][\p{Lu}'-]+(?: [\p{Lu}][\p{Lu}'-]+)?) ([\p{Lu}][\p{Ll}][\p{L}-]*(?: [\p{Lu}][\p{Ll}][\p{L}-]*)?)$/u);
  if (noComma && !/\b(LAW|LEGAL|CLINIC|DENTAL|HOSPITAL|MEDICAL|CENTER|CENTRE|GROUP|PARTNERS|ASSOCIATES|OFFICE|LLC|LLP)\b/.test(noComma[1])) {
    out = noComma[2] + ' ' + noComma[1].toLowerCase().replace(/(^|[ '-])(\p{Ll})/gu, (x, a, b) => a + b.toUpperCase());
  }
  // "DR. JAMSHED J. DALAL", a person set in capitals, reads as "Dr. Jamshed J. Dalal". Only a name
  // that opens with the title: a hospital in capitals may carry an acronym that must stay one.
  if (/^D[Rr]\.?\s+[A-Z][A-Z .'/-]+$/.test(out)) {
    out = out.toLowerCase().replace(/(^|[ '/-])([a-z])/g, (x, a, b) => a + b.toUpperCase()).replace(/^Dr\b\.?/, 'Dr.');
  }
  return out;
};

const rows = entries.map((e) => {
  const ls = e.lines;
  // --surname-first: every "Word, Word" entry on the list is a person written surname first
  // ("Raposo, Nuno Bettencourt"), unless the part after the comma names a business.
  const surnameFirst = argv.includes('--surname-first') && !/\b(Advogad|Abogad|Associad|Asociad|Associates|Law|Legal|Partners|Office|Firm|Lawyers)/i.test(ls[0]);
  const name = readingOrder(cleanName(ls[0]), !!(PERSON && PERSON.test(ls[0])) || surnameFirst);
  let body = ls.slice(1);
  let spec2 = '';
  // "Family Physician Contact:": the Brussels list sets the specialty on the line that opens the
  // contact column. It says what the doctor is and is not part of the address.
  const ci = body.findIndex((l) => /^\S.*?\s+Contact:\s*$/.test(l));
  if (ci >= 0) { spec2 = body[ci].replace(/\s*Contact:\s*$/, ''); body = body.filter((x, j) => j !== ci); }
  // Or set over the lines above a bare "Contact:": "Marriage and Family" / "Therapy" / "Contact:".
  const bare = body.findIndex((l) => /^Contact:\s*$/.test(l));
  if (bare > 0 && !spec2) {
    let k = bare - 1; const words = [];
    while (k >= 0 && words.length < 2 && !/\d|www\.|@/.test(body[k])) { words.unshift(body[k]); k -= 1; }
    spec2 = words.join(' ');
    body = body.filter((x, j) => j <= k || j > bare);
  }
  if (SECOND_LINE_SPEC && body.length > 1 && !/[0-9]/.test(body[0]) && !LABEL.test(body[0])) { spec2 = body[0]; body = body.slice(1); }
  // The address: the value of an Address label and the unlabelled lines under it, or, where there is
  // no label, the unlabelled lines right under the name.
  let addr = [];
  const ai = body.findIndex((l) => ADDRESS_LABEL.test(l));
  if (ai >= 0) {
    addr.push(body[ai].replace(ADDRESS_LABEL, ''));
    for (let j = ai + 1; j < body.length && j <= ai + 3 && !LABEL.test(body[j]) && !CONTACT_LABEL.test(body[j]); j += 1) addr.push(body[j]);
  } else {
    // The contact person comes before the address on the Doha list ("Contact: Emma Higham").
    let j0 = 0;
    while (j0 < body.length && /^(?:Contact(?: person)?|Partners?|Attorney|Managing Partner)\s*:/i.test(body[j0])) j0 += 1;
    for (let j = j0; j < body.length && j < j0 + 4 && !LABEL.test(body[j]) && !CONTACT_LABEL.test(body[j]); j += 1) {
      if (/\b(speaks?|speaking|fluent|languages?)\b/i.test(body[j]) && !/\d/.test(body[j])) break;
      addr.push(body[j]);
    }
  }
  // A line left with only digits once its Chinese characters are gone is a house number already given.
  addr = addr.filter((l) => !/^[\d\s\/,.#-]+$/.test(l))
    // A line about the doctor rather than where the doctor is: "Dual US-India dental license,
    // Diplomate, American Board of Periodontology", "Experience of over 35 years".
    .filter((l) => !/\b(licen[cs]e|diplomate|experience|years|certified|board of|fellow(?:ship)?|member of|consultant|specialist|trained)\b/i.test(l));
  const area = addr.join(', ').replace(/\s*\(0\d{1,4}\)\s*[\d -]{5,}/g, ' ').replace(/,?\s*Google Maps\b/gi, '').split(/\b(?:Tel|Tel\.|Telephone|Phone|Fax|Mobile|Cell|E-?mail|Website|www\.|https?:)\b/i)[0]
    .replace(/\s+/g, ' ').replace(/[,;\s]+$/, '').trim();
  const joined = ls.join(' ');
  const spec = (body.find((l) => /^(?:Specialty|Specialties|Speciali[sz]ation|Specializes in|Areas? of (?:practice|expertise))\s*:/i.test(l)) || '').replace(/^[^:]*:\s*/, '');
  const lang = readEntryLanguages(ls, ls[0]);
  return {
    name,
    area: area.slice(0, 160),
    // The section heading is what says what these people are ("DENTISTS, GENERAL"), and the ingest
    // categorises from specialty. The entry's own specialty line comes after it and is read too.
    // The current heading only. Joining the last three filed Mumbai's dermatologists as dentists,
    // because DENTISTRY was still one of the three when DERMATOLOGY began.
    // --no-heading-spec: Brussels has no specialty headings, and a practice name in capitals
    // ("SCANDINAVIAN DENTAL") was taken for one and filed a urologist as a dentist.
    specialty: [argv.includes('--no-heading-spec') ? '' : e.heading, SPEC ? spec : '', spec2].filter(Boolean).join(' / ').slice(0, 200),
    heading: e.heading,
    ...(PLACE_FROM_HEADING && e.heading ? { detail: e.heading } : {}),
    languages: lang.languages,
    tooMany: lang.tooMany || undefined,
    hedged: lang.hedged.length ? lang.hedged : undefined,
    url: ((joined.match(/\b((?:https?:\/\/|www\.)[^\s,;)]+)/i) || [])[1] || '').replace(/[.]+$/, ''),
    lines: ls,
    // --person-indent: Oslo sets each lawyer indented under the firm he works at.
    person: !!(PERSON && PERSON.test(ls[0])) || (argv.includes('--person-indent') && (e.indent || 0) >= 3),
  };
}).map((r, i, all) => {
  /**
   * --person <re>: a lawyer listed under the firm he works at. The Frankfurt list gives the firm
   * its address and then each lawyer his own English level with no address of his own; the lawyer
   * is the entry (the claim is his), and where to find him is the firm's address, with the firm's
   * name in front of it.
   */
  if (!r.person) return r;
  // A lawyer with an address of his own keeps it ("MEYEN, Robert, Breite Str. 22, 41460 Neuss").
  if (/\d{4,}/.test(r.area) && !/:/.test(r.area)) return r;
  let k = i - 1;
  // The nearest entry above that is not a person and has a real address: a page break leaves the
  // tail of a lawyer's practice areas as a block of its own, and it is not his firm.
  while (k >= 0 && (all[k].person || !/\d/.test(all[k].area) || /:/.test(all[k].name + all[k].area))) k -= 1;
  const firm = all[k];
  if (!firm) return r;
  return { ...r, area: [firm.name, firm.area].filter(Boolean).join(', ').slice(0, 160) };
  // A subtitle that could not be joined to the name above it is not a name: "Out-patient Services".
}).filter((r) => r.name && r.lines.length >= 2 && !/^(?:\(|(?:In|Out)-patient\b|Institution\b|A unit\b)/i.test(r.name)
  // The list's own title is not an entry: "English Speaking Lawyers in Ulaanbaatar".
  && !/^(?:List of|English[- ]Speaking|Local Providers|Medical (?:Resources|Specialists))\b/i.test(r.name)
  // A building is where a firm is, not its name: "Bucharest Tower Center, 22nd Floor" is the first
  // line of an entry whose firm name the Bucharest list sets where the reader cannot see it.
  && !(/\b(Floor|Fl\.|Block|Building|Bldg|Suite|Tower Center|Business Center)\b/i.test(r.name) && /\d/.test(r.name)));

/**
 * A row whose claim was read and came to nothing is taken out here, not left empty.
 *
 * An empty row on a roster list inherits the roster language in the ingest, so a lawyer the list
 * itself marks "Ability to read/speak English: Good/limited" would go out as English-speaking on
 * the strength of the list's title. The same for a row refused for naming more than six languages.
 * They are counted, and printed without --json, so the refusal is visible.
 */
const refused = rows.filter((r) => !r.languages.length && (r.hedged || r.tooMany));
const kept = rows.filter((r) => !refused.includes(r));

if (argv.includes('--json')) {
  console.log(JSON.stringify({ rows: kept, refused: refused.map((r) => ({ name: r.name, hedged: r.hedged, tooMany: r.tooMany })) }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length + ' with a language, '
    + rows.filter((r) => r.hedged).length + ' with a hedged language dropped, ' + rows.filter((r) => r.tooMany).length + ' refused for more than six');
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 40).padEnd(42) + (r.languages.join(',') || '-').padEnd(14)
    + (r.hedged ? '[-' + r.hedged.join(',') + '] ' : '') + r.area.slice(0, 50).padEnd(52) + (r.heading || '').slice(0, 30)));
}

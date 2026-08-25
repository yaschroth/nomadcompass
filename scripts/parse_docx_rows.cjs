/**
 * Reads a provider list published as a Word document, as rows rather than as an inspection.
 *
 * scripts/parse_docx_list.cjs opens a .docx and prints what is in it, which is what it was written
 * for and all it does: with --json it returns the tables and the blocks it found, never a row with a
 * name, an address and a language. So it scores nothing in pick_source_readers.cjs, is never chosen,
 * and every Word document in the registry has always reported "no parser could read it". Six of them
 * do, covering Prague, Munich, Amsterdam, Dubai, Santiago and Nairobi.
 *
 * Both arrangements are here because a Word list is one or the other and the manifest's shape label
 * is a hint. A table is read by its header where it has one. A block is one entry: a name on the
 * first line and labelled lines under it.
 *
 * The labels are in four languages, which is the whole difficulty. The US Embassy Nairobi writes
 * "Physical Address:" and "Areas of practice:", the Swedish Embassy Abu Dhabi writes "E-post:" and
 * "Specialisering:", the Polish Embassy Santiago writes "Adres:" and "Zakres uslug:", and the Polish
 * list for the Netherlands abbreviates them to single letters, "T +31 6 21 484 232". A single letter
 * is only read as a label when what follows it is a telephone number, an e-mail or a web address,
 * because otherwise "W" is the first word of a Polish sentence as often as it is a website.
 *
 * Usage: node scripts/parse_docx_rows.cjs <file.docx> [--json]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_docx_rows.cjs <file.docx> [--json]'); process.exit(2); }

let xml = '';
try {
  xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 1 << 28 });
} catch (e) {
  console.error('not a readable .docx: ' + String(e.message).split('\n')[0]);
  process.exit(1);
}

const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
// A soft break inside a paragraph is a line, and a document that writes a whole entry as one
// paragraph is unreadable without them.
const paraText = (p) => unesc(p
  .replace(/<w:br\s*\/?>/g, '\n')
  .replace(/<w:tab\s*\/?>/g, ' ')
  .replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();
const paragraphsIn = (scope) => [...scope.matchAll(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g)].map((m) => paraText(m[0]));

const tables = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((t) =>
  [...t[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((r) =>
    [...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) => paragraphsIn(c[0]).filter(Boolean).join('\n'))));

const blocks = (() => {
  const out = [];
  let current = [];
  paragraphsIn(xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, '<w:p></w:p>')).forEach((p) => {
    const ls = p.split('\n').map((l) => l.trim());
    if (!ls.some(Boolean)) { if (current.length) out.push(current); current = []; return; }
    ls.filter(Boolean).forEach((l) => current.push(l));
  });
  if (current.length) out.push(current);
  return out;
})();

// --- the labels, in the four languages these documents use --------------------------------------------
const LABEL = /^\s*(Physical\s+Address|Postal\s+address|Address|Adres|Adresse|Anschrift|Direcci[oó]n|Telephone|Tel|Telefon|Tlf|Mobile|Cellphone|Mobil|Portable|Fax|Telefax|E-?mail(?:\s+address)?|E-?post|M[ée]l|Webpage|Website|Hemsida|WWW|Web|Internet|Areas?\s+of\s+practice|Legal\s+areas?(?:\s*&\s*languages)?|Zakres\s+us[łl]ug|Specialisering|Spezialgebiete?|Practice\s+areas?|Languages?|J[eę]zyki|Spr[åa]k|Sprachen?|Langues?|Kancelaria|Firm|Cabinet)\s*[:：]\s*(.*)$/i;
// The single-letter form the Polish list for the Netherlands uses. Only a label when the value is
// unmistakably a telephone number, an e-mail or a web address.
const LETTER_LABEL = /^\s*([TFEW])\s*[:.]?\s+(\S.*)$/;
const FIELD = {
  physicaladdress: 'address', postaladdress: 'address', address: 'address', adres: 'address',
  adresse: 'address', anschrift: 'address', direccion: 'address',
  telephone: 'phone', tel: 'phone', telefon: 'phone', tlf: 'phone', mobile: 'phone',
  cellphone: 'phone', mobil: 'phone', portable: 'phone', fax: 'fax', telefax: 'fax',
  email: 'email', emailaddress: 'email', epost: 'email', mel: 'email',
  webpage: 'url', website: 'url', hemsida: 'url', www: 'url', web: 'url', internet: 'url',
  areasofpractice: 'practice', areaofpractice: 'practice', practiceareas: 'practice',
  practicearea: 'practice', legalareas: 'practice', legalarea: 'practice',
  legalareaslanguages: 'practice', zakresuslug: 'practice', specialisering: 'practice',
  spezialgebiet: 'practice', spezialgebiete: 'practice',
  language: 'languages', languages: 'languages', jezyki: 'languages', sprak: 'languages',
  sprache: 'languages', sprachen: 'languages', langue: 'languages', langues: 'languages',
  kancelaria: 'firm', firm: 'firm', cabinet: 'firm',
};
const fieldOf = (label) => FIELD[L.fold(label).replace(/[^a-z]/g, '')] || '';
const LETTER_FIELD = { t: 'phone', f: 'fax', e: 'email', w: 'url' };

const readBlock = (ls) => {
  const fields = {};
  const plain = [];
  let last = '';
  ls.slice(1).forEach((l) => {
    const m = l.match(LABEL);
    if (m) {
      const f = fieldOf(m[1]);
      if (f && m[2]) fields[f] = fields[f] ? fields[f] + ', ' + m[2] : m[2];
      last = f && m[2] ? f : '';
      return;
    }
    const s = l.match(LETTER_LABEL);
    if (s && (/^[+(\d]/.test(s[2]) || /@/.test(s[2]) || /^(?:www\.|https?:)/i.test(s[2]))) {
      const f = LETTER_FIELD[s[1].toLowerCase()];
      if (f) { fields[f] = fields[f] || s[2]; last = ''; return; }
    }
    // A bulleted continuation belongs to the label above it, which on the Polish lists is a run of
    // practice areas under "Zakres uslug:".
    if (/^[·•▪-]\s*/.test(l) && last) { fields[last] += ', ' + l.replace(/^[·•▪-]\s*/, ''); return; }
    last = '';
    plain.push(l);
  });
  return { fields, plain };
};

const rowOf = (name, fields, plain, heading) => {
  const area = T.tidyAddress([fields.firm, fields.address, ...plain].filter(Boolean).join(', '));
  const langs = L.readLanguages(fields.languages || '', false, unknownLangs);
  // Where a source heads one column "Legal areas & languages" the languages are inside the practice
  // text and there is no line of their own to read: "Family Law, Adoptions ... Czech, English".
  const fromPractice = langs.length ? [] : L.readLanguages(fields.practice || '', false);
  return {
    heading: heading || '',
    specialty: heading || '',
    role: (fields.practice || '').replace(/\s+/g, ' ').slice(0, 200),
    practice: (fields.practice || '').replace(/\s+/g, ' ').slice(0, 200),
    // "1. Achapa & Associates Advocates" is numbered by the document, not called that.
    name: String(name || '').replace(/^\s*\d{1,3}[.)]\s*/, '').replace(/[,;:]\s*$/, '').slice(0, 80),
    languages: langs.length ? langs : fromPractice,
    languagesText: fields.languages || '',
    languageLine: fields.languages || '',
    area: area.slice(0, 160),
    postcode: (area.match(/\b(\d{4,6})\b/) || [])[1] || '',
    phone: (fields.phone || '').slice(0, 60),
    email: fields.email || (plain.join(' ').match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    url: fields.url || '',
  };
};

// --- a table, read by its header ------------------------------------------------------------------------
const COLUMN = [
  [/name|nazwisko|nom|firma|attorney|advocate/i, 'name'],
  [/language|sprach|j[eę]zyk|spr[åa]k|langue/i, 'languages'],
  [/contact|kontakt|adres|address|dane/i, 'contact'],
  [/area|practice|zakres|usług|specialit|fach|legal/i, 'practice'],
];
const fromTables = () => {
  const out = [];
  for (const rows of tables) {
    const body = rows.filter((r) => r.some((c) => c && c.trim()));
    if (body.length < 3 || (body[0] || []).length < 2) continue;
    const header = body[0].map((c) => c.replace(/\s+/g, ' ').trim());
    const map = header.map((h) => (COLUMN.find(([re]) => re.test(h)) || [])[1] || '');
    // Without a header the first column is still the name: that is the one thing every one of these
    // tables agrees on.
    if (!map.includes('name')) map[0] = 'name';
    const heading = header.join(' | ').slice(0, 80);
    body.slice(1).forEach((r) => {
      const fields = {};
      let name = '';
      r.forEach((cell, i) => {
        const v = String(cell || '').replace(/\n+/g, ', ').replace(/\s+/g, ' ').trim();
        if (!v) return;
        if (map[i] === 'name') { name = v; return; }
        if (map[i] === 'languages') { fields.languages = v; return; }
        if (map[i] === 'contact') { fields.address = fields.address ? fields.address + ', ' + v : v; return; }
        if (map[i] === 'practice') { fields.practice = v; return; }
      });
      if (name) out.push(rowOf(name, fields, [], heading));
    });
  }
  return out;
};

const fromBlocks = () => blocks
  .filter((b) => b.length > 1)
  .map((b) => {
    const { fields, plain } = readBlock(b);
    // A block with no label in it is the covering note, the disclaimer or a section heading.
    if (!Object.keys(fields).length) return null;
    return rowOf(b[0], fields, plain, '');
  })
  .filter(Boolean);

const table = fromTables();
const block = fromBlocks();
// Whichever read more of the document, scored the way the ingest scores.
const withLang = (rs) => rs.filter((r) => r.languages.length).length;
const rows = (withLang(table) > withLang(block) || (withLang(table) === withLang(block) && table.length >= block.length))
  ? table : block;

const kept = rows.filter((r) => r.name.length > 2 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows: kept }, null, 1));
} else {
  console.log(kept.length + ' entries (' + table.length + ' as a table, ' + block.length + ' as blocks), '
    + kept.filter((r) => r.languages.length).length + ' with languages of their own, '
    + kept.filter((r) => r.area).length + ' with an address');
  kept.slice(0, 14).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(16) + r.area.slice(0, 54)));
  if (unknownLangs.size) console.log('  words a language line used that this lexicon does not hold: ' + [...unknownLangs].slice(0, 24).join(' | '));
}

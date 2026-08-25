/**
 * Reads a French mission's liste de notoriete, the shape it publishes as a page rather than a PDF.
 *
 * France runs the widest consular network of any country whose lists this directory uses, and about
 * twenty of its posts publish the list in the page instead of attaching it. scripts/parse_diplo_fr_list.cjs
 * reads the Paris shape and nothing here read this one, so Prague, Madrid, Tokyo, Warsaw, Bucharest,
 * Santiago, Montreal, Dakar, Ho Chi Minh City and Dubai all sat verified and unread.
 *
 * Two arrangements, one reader, because they differ only in how an entry announces itself.
 *
 * Prague and Madrid write a person, and the ministry capitalises the surname:
 *
 *     Carlos DOMINGUEZ ABRALDES
 *     Cabinet d'avocats ABRALDES LAWYERS
 *     Cernokosteleckaa 2020/20
 *     100 00 Prague 10
 *     Domaines d'activite : avocats generalistes
 *     Langues : francais, anglais, espagnol, portugais, tcheque, russe, polonais, italien
 *
 * Tokyo writes institutions, which have no surname to capitalise, and labels the address instead:
 *
 *     St. Luke's International Hospital
 *     Adresse : 9-1 Akashi-cho, Chuo-ku, Tokyo 104-8560
 *     Tel : 03-3541-5151
 *
 * So an entry begins either at a name with a capitalised surname in it or at whatever line an
 * "Adresse :" is written under. The capitals test also has to refuse a heading, and the thing that
 * separates "Carlos DOMINGUEZ ABRALDES" from "AVOCATS FRANCOPHONES EN ESPAGNE" is that a name has
 * something in it that is not shouted. A line shouted from end to end is a heading.
 *
 * "Langues :" is why these pages are worth reading at all. Every other source for the Czech Republic
 * says English; this one says francais, anglais, espagnol, tcheque, russe, polonais, slovaque and
 * arabe, per lawyer, in the lawyer's own entry.
 *
 * Usage: node scripts/parse_fr_notoriete.cjs <page.html> [--json]
 */
const fs = require('fs');
const path = require('path');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_fr_notoriete.cjs <page.html> [--json]'); process.exit(2); }
const raw = fs.readFileSync(file, 'utf8');

const lines = (/<\/?(html|body|div|p)\b/i.test(raw) ? raw
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|tr|td|th|h[1-6]|dt|dd)>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  : raw)
  .split('\n')
  .map((l) => T.unentity(l).replace(/\s+/g, ' ').trim())
  .filter(Boolean);

// "Adresse a Hanoi :" and "Adresse a Ho Chi Minh-Ville :" are how the Vietnam page labels the two
// offices of a firm, so the label is allowed a few words of its own before the colon.
const LABEL = /^(Adresses?(?:\s+[^:：]{1,28})?|T[ée]l(?:\.|[ée]phone)?(?:\s*\/\s*fax)?|Fax|Portable|Mobile|M[ée]l|Mail|Courriel|E-?mail|Site(?:\s+internet)?|Web|Langues?|Domaines?\s+d['’]activit[ée]|Sp[ée]cialit[ée]s?|Horaires|Consultations?|Honoraires)\s*[:：]\s*(.*)$/i;
const FIELD = {
  adresse: 'address', adresses: 'address',
  tel: 'phone', telephone: 'phone', telfax: 'phone', telephonefax: 'phone',
  fax: 'fax', portable: 'phone', mobile: 'phone',
  mel: 'email', mail: 'email', courriel: 'email', email: 'email',
  site: 'url', siteinternet: 'url', web: 'url',
  langue: 'languages', langues: 'languages',
  domainedactivite: 'practice', domainesdactivite: 'practice',
  specialite: 'practice', specialites: 'practice',
  horaires: 'hours', consultation: 'hours', consultations: 'hours', honoraires: 'fees',
};
const fieldOf = (label) => FIELD[L.fold(label).replace(/[^a-z]/g, '')] || '';

// The contact glyphs these pages use in place of a label: a phone, an envelope, a globe.
const GLYPH = /^[☎✉\u{1F4F1}\u{1F4DE}\u{1F4E7}\u{1F310}\u{1F4E0}]/u;
const isContact = (l) => GLYPH.test(l) || /^(?:www\.|https?:)/i.test(l) || /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(l);

/**
 * A line that opens an entry.
 *
 * A capitalised surname of three letters or more, and at least one word beside it that is not
 * shouted. Without the second half every section heading on the Spanish page opened an entry.
 */
const CAPS = /(?:^|\s)[A-ZÀ-ÞĄ-Ž][A-ZÀ-ÞĄ-Ž'’-]{2,}(?:\s|$)/;
// The page's own furniture, which sits above the list and reads like an entry with a date under it.
// "ETIAS - Aller en Europe" is a banner on all twenty of these pages and came out as a provider
// whose address was "Publie le 19 decembre 2025".
const FURNITURE = /^(Publi[ée] le|Mis[e]? [àa] jour le|Cr[ée]dits?\b|Voir le fil|Accueil$|Partager|Imprimer|ETIAS\b)/i;
const looksLikeName = (l) => {
  if (!l || l.length < 4 || l.length > 90) return false;
  if (LABEL.test(l) || isContact(l) || FURNITURE.test(l)) return false;
  if (/^[\d(]/.test(l) || /[:：]\s*$/.test(l)) return false;
  const words = l.split(/\s+/);
  if (words.length < 2 || words.length > 10) return false;
  if (!CAPS.test(l)) return false;
  // Every word shouted is a heading, not a name.
  return words.some((w) => /[a-zà-ÿ]/.test(w));
};

/**
 * This reader refuses a page that is not one of these lists.
 *
 * It has to. The entry boundary here is a capitalised surname, which almost every consular list in
 * any language has, so without a guard it reads thirteen entries out of a German block list for
 * Canada and forty-nine out of the Athens table, none of them stating a language. On a roster source
 * nothing states a language, so those reads score exactly as well as a correct one and the reader
 * that gets asked first wins.
 *
 * The labels are not the evidence: "Tel.:", "Fax:" and "E-Mail:" are written the same way by every
 * mission in Europe, and requiring three of them let both those pages through. What only a French
 * post writes is the French of the page around the list.
 */
const FRENCH_PAGE = [
  /liste de notori[ée]t[ée]/i, /francophones?\b/i, /Publi[ée] le\b/i, /Mis[e]? [àa] jour le\b/i,
  /n['’]engage pas la responsabilit/i, /\bavocats?\b/i, /\bm[ée]decins?\b/i, /\btraducteurs?\b/i,
  /\bconsulat/i, /\bambassade\b/i,
];
const frenchness = FRENCH_PAGE.filter((re) => re.test(raw)).length;
if (frenchness < 3) {
  if (process.argv.includes('--json')) console.log(JSON.stringify({ rows: [] }, null, 1));
  else console.log('0 entries: this page is not a French mission\'s, it uses ' + frenchness + ' of the words they all use');
  process.exit(0);
}

// --- cut the page into entries ---------------------------------------------------------------------
const entries = [];
let current = null;
for (let i = 0; i < lines.length; i += 1) {
  const l = lines[i];
  const labelledBelow = LABEL.test(lines[i + 1] || '') && fieldOf((lines[i + 1].match(LABEL) || [])[1] || '') === 'address';
  /**
   * The Tokyo rule, kept from firing on the Santiago page.
   *
   * An institution has no capitalised surname, so on the Japanese list the thing that marks a name
   * is the "Adresse :" written under it. On the Chilean list the same test read "Avocat, Secretaire
   * general de la Chambre de commerce franco-chilienne" as a lawyer, because that line also sits
   * over an address: it is Maitre Enrique BENITEZ URRUTIA's job title, and splitting there took his
   * office away from him and gave it to his job. A run of lines can only be ended this way once the
   * entry it would end has an address of its own.
   */
  const hasAddress = !!current && current.lines.some((x) => {
    const m = x.match(LABEL);
    if (m) return fieldOf(m[1]) === 'address';
    return !isContact(x) && /\d/.test(x);
  });
  const opensEntry = !LABEL.test(l) && !isContact(l) && !FURNITURE.test(l) && !/[:：]\s*$/.test(l)
    && (looksLikeName(l) || (labelledBelow && (!current || hasAddress) && l.length > 3 && !/^[\d(]/.test(l)));
  /**
   * A second name under the first one is a subtitle, not the next entry.
   *
   * The Prague page writes the lawyer and then the firm, "Eliska BARTHELEMY" over "Cabinet
   * d'avocats BARTHELEMY & PARTNERS", and both read as names. Splitting there published the firm
   * with the person's languages and lost the person. An entry has to have said something about
   * itself before another name can end it.
   */
  if (opensEntry && (!current || current.lines.length >= 2)) {
    current = { name: l, lines: [] };
    entries.push(current);
    continue;
  }
  if (current && !FURNITURE.test(l)) current.lines.push(l);
}

// --- read one entry ----------------------------------------------------------------------------------
const rows = entries.map((e) => {
  const f = {};
  const plain = [];
  for (const l of e.lines) {
    const m = l.match(LABEL);
    if (m) {
      const k = fieldOf(m[1]);
      if (k && m[2]) f[k] = f[k] ? f[k] + ', ' + m[2] : m[2];
      continue;
    }
    if (isContact(l)) continue;
    plain.push(l);
  }
  /**
   * Which unlabelled lines are the address.
   *
   * Madrid labels none of them: under the name come a sentence about what the lawyer does and then
   * a street and a postcode. A digit or a street word tells them apart, and the rest goes to role,
   * which the ingest uses only when there is no address at all.
   */
  const STREET = /\b(rue|avenue|av|bd|boulevard|place|chemin|route|impasse|c\/|calle|carrer|via|rua|ul|ulice|utca|str|stra[sß]{1,2}e|street|road)\b\.?/i;
  const addressish = plain.filter((l) => /\d/.test(l) || STREET.test(l));
  const describes = plain.filter((l) => !addressish.includes(l));
  const area = T.tidyAddress([f.address, ...addressish].filter(Boolean).join(', '));
  return {
    heading: '',
    specialty: '',
    role: [f.practice, ...describes].filter(Boolean).join('; ').slice(0, 200),
    practice: (f.practice || '').slice(0, 200),
    // Montreal bullets its people: "▪️M. Francis LAMER".
    name: e.name.replace(/^[▪•·*▪️\s-]+/, '').replace(/[,;:]\s*$/, '').slice(0, 80),
    languages: L.readLanguages(f.languages || '', false, unknownLangs),
    languagesText: f.languages || '',
    languageLine: f.languages || '',
    area: area.slice(0, 160),
    postcode: (area.match(/\b(\d{4,5}(?:[- ]\d{2,4})?)\b/) || [])[1] || '',
    phone: (f.phone || '').slice(0, 60),
    email: f.email || (e.lines.join(' ').match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    url: f.url || (e.lines.join(' ').match(/(?:https?:\/\/|www\.)[\w.-]+\.\w{2,}[^\s,;]*/i) || [])[0] || '',
  };
}).filter((r) => r.name.length > 3 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length
    + ' with languages of their own, ' + rows.filter((r) => r.area).length + ' with an address');
  rows.slice(0, 14).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(20) + r.area.slice(0, 50)));
  if (unknownLangs.size) console.log('  words a language line used that this lexicon does not hold: ' + [...unknownLangs].slice(0, 24).join(' | '));
}

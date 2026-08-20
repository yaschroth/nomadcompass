/**
 * Reads the German embassy in France's lists of German-speaking providers.
 *
 * https://allemagneenfrance.diplo.de publishes one page per consular district and category: doctors
 * by specialty, lawyers, notaries, psychotherapists, family mediators, tax advisers.
 *
 * The first version of this parser turned every <br> into a comma, and that one line lost the whole
 * structure. The name cell is not a string, it is a list of lines: a law firm and then its partners,
 * one per line, sometimes with a line of its own saying which languages the office works in. Flatten
 * that into a comma-joined string and "ALARIS LAW | HARTMANN, David H. | MOURRUAU, Thierry" becomes
 * one unreadable name, which is why 33 of 46 Paris lawyers had to be thrown away. Lines are kept as
 * lines here, and each one is classified.
 *
 * The doctors page carries the strongest roster-level claim in this whole directory, in the
 * embassy's own words: "Die Benennung der Aerzte richtet sich ausschliesslich nach dem Kriterium der
 * Deutschsprachigkeit", the naming of doctors follows the criterion of German-speaking and nothing
 * else. The tax page carries the weakest: the embassy asserts nothing and the only wording is the
 * firms' own copy about serving German-speaking clients, which is a claim about their customers.
 *
 * Usage: node scripts/parse_diplo_fr_list.cjs <page.html> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_fr_list.cjs <page.html> [--json]'); process.exit(2); }

const html = fs.readFileSync(file, 'utf8');

// Same decoding as before, except <br> and the closing block tags become newlines instead of
// commas. Everything downstream reads a cell as lines.
const dec = (s) => String(s || '')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;|&(l|r)dquo;/g, '"')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
  .replace(/\n{2,}/g, '\n').trim();

// A line that is a role, a contact detail or a heading is not a person and not a business.
const ROLE = /^(Notaire|Notar|Associ|Juristin|Jurist|Sekret|Assistent|Rechtsanwalt|Anwalt|Avocate?s?|Partner|Kollegin|Kollege|Fachanwalt|Sp[ée]cialiste|LL\.?M|Terminvereinbarung|Sprechstunde|Sprachen|Tel|Fax|E-Mail|Mobil|www\.|http)\b/i;
const LANGNOTE = /^\(?\s*(dt\.|deutsch|allemand|frz\.|engl\.)/i;
// Titles the lists put after the name, or in front of it. Kept, but moved to the front where a
// reader expects them.
const TITLE_TOK = /^(Prof\.|Dr\.|Dre\.|med\.|Med\.|dent\.|Dent\.|phil\.|Phil\.|Ph\.?D\.?|LL\.?M\.?|MBA|M\.A\.|Dipl\.[-\w]*\.?)$/;
const FIRMWORD = /(Avocats?|Cabinet|Soci[ée]t[ée]|Notaires?|Notariat|Partners?|Associ[ée]s|&|SELARL|SCP|GmbH|AARPI|LAW|Legal|Rechtsanw|Praxis|Kanzlei|Clinique|Centre|Etude|Startup)/i;

// "PROISL, Oliver, Dr." -> "Dr. Oliver PROISL". "BEYER-de MORANT, Anabel" -> "Anabel BEYER-de MORANT".
// The lists write the surname first, so the comma is a reliable pivot and no guessing is needed.
const swapSurnameFirst = (line) => {
  const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const surname = parts[0];
  const titles = [];
  const given = [];
  parts.slice(1).forEach((p) => {
    // "Marcus Wolfgang" is a given name; "Dr. Med. Med. Dent." is a pile of titles.
    const keep = [];
    p.split(/\s+/).forEach((t) => (TITLE_TOK.test(t) ? titles.push(t) : keep.push(t)));
    if (keep.length) given.push(keep.join(' ').replace(/\b(Monsieur|Madame|Herr|Frau)\b/g, '').trim());
  });
  if (!given.length) return null;
  // More than two given-name words means the line is not a plain name, it is a name plus a job
  // description, and guessing where one ends would put the guess on the page.
  if (given.join(' ').split(/\s+/).length > 3) return null;
  const title = titles.join(' ').replace(/\s+/g, ' ').trim();
  return ((title ? title + ' ' : '') + given.join(' ') + ' ' + surname).replace(/\s+/g, ' ').trim();
};

// "Maitre Vincent ROUSSEL", "M. Alexandre KATZNER (deutschsprachig)": already in reading order.
const HONORIFIC = /^(Ma[iî]tre|Mtre\.?|M\.|Mme\.?|Herr|Frau|Dr\.|Prof\.)\s+(.+)$/;
const asHonorific = (line) => {
  const m = line.match(HONORIFIC);
  if (!m) return null;
  const rest = m[2].replace(/\s*[,(].*$/, '').trim();
  if (!/^[A-ZÄÖÜÀ-Þ]/.test(rest) || rest.split(/\s+/).length > 4) return null;
  if (!/[A-ZÀ-Þ]{2,}/.test(rest)) return null; // a surname in capitals is what makes it a name
  return (/^(Dr\.|Prof\.)/.test(m[1]) ? m[1] + ' ' : '') + rest;
};

const parts = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>|<table>([\s\S]*?)<\/table>/g)];
let heading = '';
const rows = [];
for (const m of parts) {
  if (m[1] !== undefined) { heading = dec(m[1]).replace(/\s+/g, ' '); continue; }
  for (const r of m[2].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => dec(c[1]));
    if (!cells.length) continue;
    const flat = cells.join(' ').replace(/\n/g, ' ');
    // The emergency-number table has no names in it, and a phone number is not a provider.
    if (/^(Allgemeiner Notruf|S\.O\.S|Centre anti|Notruf|Urgences|SAMU|Polizei)/i.test(cells[0])) continue;
    if (cells[0].replace(/\n/g, '').length < 4) continue;

    const postcode = (flat.match(/\b(\d{5})\b/) || [])[1] || '';
    const area = (cells.slice(0, 3).find((c) => /\b\d{5}\b/.test(c)) || '')
      .split('\n').filter((l) => !/^(Tel|Fax|E-Mail|Mobil|www\.|http)/i.test(l)).join(', ')
      .replace(/\s*,\s*/g, ', ').replace(/^,\s*|,\s*$/g, '');
    const url = (flat.match(/\b((?:https?:\/\/|www\.)[^\s|,]+)/) || [])[1] || '';
    const phone = (flat.match(/Tel\.?\s*:?\s*([0-9 ./]{8,})/i) || [])[1] || '';
    // The specialty is whichever cell is neither address nor contact: on the doctors and therapists
    // pages it is the last one, on the lawyers page the practice areas.
    const specialty = (cells.slice(1).reverse().find((c) => c && !/\d{5}|Tel|Fax|E-Mail|@/i.test(c)) || '')
      .replace(/\n/g, ' ').replace(/\s*,\s*/g, ', ').replace(/,\s*$/, '');

    // Now the name cell, line by line. Two of the pages break a single name across a <br>, so
    // "BERGER," and "Anke" arrive as separate lines and would otherwise become a business called
    // "BERGER, / Anke". A line ending in a comma is a name that has not finished: glue it to the
    // next one before anything else looks at it.
    const lines = [];
    cells[0].split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).forEach((l) => {
      if (lines.length && /,$/.test(lines[lines.length - 1])) lines[lines.length - 1] += ' ' + l;
      else lines.push(l);
    });
    const people = [];
    const firms = [];
    let langNote = '';
    for (const raw of lines) {
      let line = raw;
      const paren = line.match(/\s*\(\s*(dt|deutschsprachig|allemand)[^)]*\)\s*$/i);
      if (paren) { langNote = paren[0].trim(); line = line.slice(0, paren.index).trim(); }
      const trailing = line.match(/\s*,\s*(deutschsprachig|germanophone)\s*$/i);
      if (trailing) { langNote = trailing[1]; line = line.slice(0, trailing.index).trim(); }
      // A trailing parenthetical is a qualification or a role, not part of the name.
      line = line.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (!line) continue;
      if (/^Mitglied\b/i.test(line)) continue; // a bar membership is neither a person nor a firm
      if (LANGNOTE.test(line)) { langNote = line.replace(/^[( ]+|[) ]+$/g, ''); continue; }
      if (/\b\d{5}\b/.test(line) || /^(Tel|Fax|E-Mail|Mobil|www\.|http)/i.test(line)) continue;
      const hon = asHonorific(line);
      if (hon) { people.push(hon); continue; }
      const swapped = line.includes(',') && !FIRMWORD.test(line.split(',')[0]) ? swapSurnameFirst(line) : null;
      if (swapped && swapped.length >= 4 && swapped.length <= 70) { people.push(swapped); continue; }
      // A few rows write SURNAME Firstname with no comma at all.
      const noComma = line.match(/^([A-Z\u00C0-\u00DE][A-Z\u00C0-\u00DE'-]{2,})\s+([A-Z\u00C0-\u00DE][a-z\u00E0-\u00FF'-]{2,})$/);
      if (noComma) { people.push(noComma[2] + ' ' + noComma[1]); continue; }
      if (ROLE.test(line)) continue;
      // Anything left that is neither a person nor a role is the business they belong to.
      if (line.length >= 3 && line.length <= 80) firms.push(line);
    }

    const firm = firms.join(' / ').slice(0, 80);
    const base = { heading, area, postcode, phone, url, specialty, langNote, firm };
    if (people.length) people.forEach((name) => rows.push({ ...base, name, kind: 'person' }));
    // A notary office with no named partner is still a real business, and the list is about the
    // office. A row with neither a person nor a firm is dropped rather than guessed at.
    else if (firms[0] && firms[0].length >= 4) rows.push({ ...base, name: firms[0].slice(0, 80), firm: '', kind: 'business' });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(rows.length + ' entries (' + rows.filter((r) => r.kind === 'person').length + ' people, ' +
    rows.filter((r) => r.kind === 'business').length + ' businesses), ' +
    rows.filter((r) => r.postcode).length + ' with a postcode, ' + rows.filter((r) => r.url).length + ' with a website');
  const byHeading = {};
  rows.forEach((r) => { byHeading[r.heading] = (byHeading[r.heading] || 0) + 1; });
  Object.entries(byHeading).forEach(([h, n]) => console.log('   ' + String(n).padStart(3) + '  ' + h.slice(0, 60)));
  rows.slice(0, 8).forEach((r) => console.log('  e.g. ' + r.name.slice(0, 30).padEnd(32) +
    (r.firm || '-').slice(0, 22).padEnd(24) + r.postcode + '  ' + r.specialty.slice(0, 34)));
}

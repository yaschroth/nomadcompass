/**
 * Reads the German embassy in France's lists of German-speaking providers.
 *
 * https://allemagneenfrance.diplo.de publishes one page per district and category: doctors by
 * specialty, lawyers, notaries, psychotherapists, family mediators, tax advisers. Each page is a run
 * of h2 headings, one per specialty, each followed by a table whose first cell holds the name and
 * the address and whose second holds the phone.
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
const dec = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, ', ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
  .replace(/&quot;/g, '"').replace(/&(l|r)dquo;/g, '"')
  .replace(/\s+/g, ' ').replace(/\s*,\s*,/g, ',').trim();

// Headings and tables in document order, so each table knows which specialty it sits under.
const parts = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>|<table>([\s\S]*?)<\/table>/g)];
let heading = '';
const rows = [];
for (const m of parts) {
  if (m[1] !== undefined) { heading = dec(m[1]); continue; }
  const body = m[2];
  for (const r of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => dec(c[1]));
    if (!cells.length) continue;
    const first = cells[0];
    if (!first || first.length < 6) continue;
    // The emergency-number table has no names in it, and a phone number is not a provider.
    if (/^(Allgemeiner Notruf|S\.O\.S|Centre anti|Notruf|Urgences)/i.test(first)) continue;
    // These tables have three columns, name then address then contact, not two. Reading the address
    // out of the first cell found nothing at all: every entry came back without a postcode, which is
    // what made it obvious. Where a page really does put both in one cell, the split still applies.
    let name = first;
    let area = cells.slice(1).find((c) => /\b\d{4,5}\b/.test(c) && !/^(Tel|Fax|E-Mail)/i.test(c)) || '';
    if (!area) {
      const cut = first.search(/\d{1,4}[ ,]|\bbd\.?\b|\brue\b|\bav\.?\b|\bplace\b|\bClinique\b|\bH[oô]pital\b/i);
      if (cut > 4) { name = first.slice(0, cut).replace(/[,\s]+$/, ''); area = first.slice(cut).trim(); }
    }
    const pc = (area.match(/\b(\d{5})\b/) || first.match(/\b(\d{5})\b/) || [])[1] || '';
    // The lists write the surname in capitals first and put the title in its own element, so a naive
    // read gives "Oliver, Dr. PROISL" and "Ermisch, Christiane , Dr.". Pull the title out first,
    // then swap, then put it back at the front where it belongs.
    // No trailing word boundary: a title ends in a full stop, and \b after "." never matches at the
    // end of a string, so every title stayed in the middle of the name where it was found.
    const TITLE = /(Prof\. Dr\. med\.|Prof\. Dr\.|Dr\. med\. dent\.|Dr\. med\.|Dr\.|Prof\.|Ma[iî]tre)/;
    const title = (name.match(TITLE) || [])[1] || '';
    name = name.replace(new RegExp(TITLE.source, 'g'), ' ')
      .replace(/\s*,\s*/g, ', ').replace(/(^|\s),\s*/g, ' ').replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();
    const swapped = name.match(/^([A-ZÄÖÜ][A-ZÄÖÜ' -]{2,}),\s*(.+)$/);
    if (swapped) name = swapped[2].trim() + ' ' + swapped[1].trim();
    name = (title ? title + ' ' : '') + name.replace(/,\s*$/, '').trim();
    if (name.length < 4 || name.length > 70) continue;
    rows.push({ heading, name, area, postcode: pc, phone: cells[1] || '' });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(rows.length + ' entries');
  const byHeading = {};
  rows.forEach((r) => { byHeading[r.heading] = (byHeading[r.heading] || 0) + 1; });
  Object.entries(byHeading).forEach(([h, n]) => console.log('   ' + String(n).padStart(3) + '  ' + h.slice(0, 60)));
  rows.slice(0, 4).forEach((r) => console.log('  e.g. ' + r.name + ' | ' + r.area.slice(0, 60) + ' | ' + r.postcode));
}

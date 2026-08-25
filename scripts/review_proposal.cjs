/**
 * Lays a proposal out so it can actually be read before it is applied.
 *
 * The rule is that nobody applies a batch without reading the whole of it, and the reason the rule
 * exists is that every batch so far has held something that had to be refused: a chamber of commerce
 * as a lawyer, a column header as a paediatric dentist, an embassy as a translator. That rule is easy
 * to keep for ninety rows and impossible for nine hundred, and the ingest can now open sources that
 * hold three hundred each.
 *
 * So this prints the batch grouped by the source it came from, with the rows that look wrong pulled
 * to the top of each group. The flags are not a filter. Nothing is dropped here and nothing is
 * changed; a flag only says where to look first, and a group with no flags still has to be read.
 *
 * Usage:
 *   node scripts/review_proposal.cjs data/proposals/<name>.json          # everything, by source
 *   node scripts/review_proposal.cjs data/proposals/<name>.json --flagged  # only the flagged rows
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/review_proposal.cjs <proposal.json> [--flagged]'); process.exit(2); }
const FLAGGED_ONLY = process.argv.includes('--flagged');
const p = JSON.parse(fs.readFileSync(file, 'utf8'));

/**
 * What has had to be refused by hand before, written down.
 *
 * Each of these is a mistake that reached a proposal: an institution that is not a provider, a page
 * heading read as a person, an address that is a list of practice areas.
 */
const FLAGS = [
  [(r) => /\b(kammer|komora|komora|chamber|c[áa]mara|barreau|colegio|orden dos|bar association|ordre des)\b/i.test(r.name),
    'a professional body, not a provider'],
  [(r) => /\b(botschaft|embassy|consulate|konsulat|ambasciata|ambassade|embajada|generalkonsulat)\b/i.test(r.name),
    'the mission itself'],
  [(r) => /\b(universit|hochschule|facult|institut nacional|ministry|ministerium)\b/i.test(r.name),
    'an institution rather than a practice'],
  [(r) => r.name.split(/\s+/).length < 2, 'a one-word name'],
  [(r) => /^(dr|prof|me|mr|mrs|ms|herr|frau)\.?$/i.test(r.name.replace(/\s+/g, '')), 'a title with no name'],
  [(r) => /\b(hospital|klinik|clinic|centro medico|medical cent)\b/i.test(r.name) && !/\d/.test(r.name),
    'a hospital, which may be a building rather than a listed provider'],
  [(r) => !/\d/.test(r.area), 'an address with no number in it'],
  /**
   * An address that runs into a biography.
   *
   * The flag used to be that the address was long, and on the US consular attorney lists that fired
   * on nine rows in ten, because those addresses genuinely run into the entry's prose and trimming
   * them was measured and refused: the rule that did it damaged 472 good addresses elsewhere. A
   * length is not evidence of anything. These words are.
   */
  [(r) => /\b(born|studied|graduated|degree|university|universit[àa]|admitted to|jurisprudence|laurea|LL\.?M)\b/i.test(r.area),
    'a biography in the address'],
  [(r) => /\b(recht|law|derecho|diritto|prawo|droit)\w*\s*,/i.test(r.area),
    'practice areas in the address'],
  [(r) => /\b(mo|di|mi|do|fr|sa|so|mon|tue|wed|thu|fri)\b.*\d{1,2}[:.]\d{2}/i.test(r.area),
    'opening hours in the address'],
  [(r) => /@|www\.|https?:/i.test(r.area), 'a contact detail in the address'],
];
const flagsOn = (r) => FLAGS.filter(([test]) => { try { return test(r); } catch (e) { return false; } }).map(([, why]) => why);

const bySource = new Map();
(p.rows || []).forEach((r) => {
  if (!bySource.has(r.sourceUrl)) bySource.set(r.sourceUrl, []);
  bySource.get(r.sourceUrl).push(r);
});

const perSource = new Map((p.perSource || []).map((s) => [s.url, s]));
const line = (r, flags) => '   ' + (flags.length ? '!! ' : '   ')
  + r.city.padEnd(14) + r.category.padEnd(11) + r.languages.join(',').padEnd(14)
  + r.name.slice(0, 34).padEnd(36) + r.area.slice(0, 56)
  + (flags.length ? '\n        ^ ' + flags.join('; ') : '');

let total = 0;
let flaggedTotal = 0;
[...bySource.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([url, rows]) => {
    const s = perSource.get(url) || {};
    const marked = rows.map((r) => ({ r, flags: flagsOn(r) }));
    const flagged = marked.filter((m) => m.flags.length);
    total += rows.length;
    flaggedTotal += flagged.length;
    if (FLAGGED_ONLY && !flagged.length) return;
    console.log('\n' + '='.repeat(110));
    console.log(rows.length + ' rows' + (flagged.length ? ', ' + flagged.length + ' flagged' : '')
      + '   read by ' + (s.parser || '?') + '   read ' + (s.read || '?') + ', kept ' + (s.kept || rows.length));
    console.log(url);
    [...flagged, ...(FLAGGED_ONLY ? [] : marked.filter((m) => !m.flags.length))]
      .forEach((m) => console.log(line(m.r, m.flags)));
  });

console.log('\n' + '='.repeat(110));
console.log(total + ' rows from ' + bySource.size + ' sources, ' + flaggedTotal + ' flagged for a look.');
console.log('A flag is a place to start, not a verdict, and an unflagged group still has to be read.');
console.log('proposal: ' + path.basename(file));

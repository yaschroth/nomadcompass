/**
 * Reads a result page from Spain's register of sworn translators and interpreters.
 *
 * The table gives name, surname, address, phone, email, province, country, language, title and
 * whether the entry is active. Only the name, the address and the language are taken: this directory
 * does not republish anyone's phone number or email, and the register is the place to get those.
 *
 * The address is what makes the source usable here. The dropdown filters by province, but the
 * address names the town, so a sworn translator in Rubi is not filed under Barcelona.
 *
 * Usage: node scripts/parse_maec_translators.cjs <result.html> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_maec_translators.cjs <result.html> [--json]'); process.exit(2); }

const html = fs.readFileSync(file, 'utf8');
const dec = (s) => String(s || '')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const table = html.slice(html.indexOf('jqTablaTraductoresInterpretes'));
const body = table.slice(table.indexOf('<tbody>'), table.indexOf('</tbody>'));
const rows = [];
for (const m of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
  const cells = [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => dec(c[1]));
  if (cells.length < 10) continue;
  const [first, last, address, , , province, , language, title, active] = cells;
  // The register appends its own entry number to the given name, "Ada - 6585".
  const name = (first.replace(/\s*-\s*\d+\s*$/, '').trim() + ' ' + last.trim()).replace(/\s+/g, ' ').trim();
  if (!name || name.length < 4) continue;
  rows.push({ name, address, province, language, title, active: /activo/i.test(active) });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.active).length + ' active');
  const towns = {};
  rows.forEach((r) => {
    const t = (r.address.match(/\b\d{5}\s+([A-ZÁÉÍÓÚÑÜ' .-]{3,})$/) || [])[1];
    if (t) towns[t.trim()] = (towns[t.trim()] || 0) + 1;
  });
  console.log('towns in the addresses: ' + Object.entries(towns).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => t + ' ' + n).join(', '));
  rows.slice(0, 3).forEach((r) => console.log('  ' + r.name + ' | ' + r.address.slice(0, 60) + ' | ' + r.language));
}

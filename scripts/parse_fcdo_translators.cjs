/**
 * Reads the FCDO's "Find a professional service abroad" results page for translators.
 *
 * The lawyers branch and the translators branch return different markup, and the row pattern written
 * for lawyers matched nothing here, so seven countries came back "0 providers" and looked like empty
 * sources. They were not: the page listed real people the whole time. A zero from a source that
 * should have something is a bug report, not a result.
 *
 * This branch is worth more than the lawyer one for a directory indexed by language, because it
 * states the languages each provider works in AND the regions they cover, per person, rather than
 * one claim for the whole roster.
 *
 * Usage: node scripts/parse_fcdo_translators.cjs <result.html> <Country> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
const country = process.argv[3];
if (!file || !country) {
  console.error('usage: node scripts/parse_fcdo_translators.cjs <result.html> <Country> [--json]');
  process.exit(2);
}

const html = fs.readFileSync(file, 'utf8');
const decode = (s) => String(s || '')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

// Each provider is one <li> holding an <h3> with the name and a run of <p><strong>Field</strong>:
// value</p>. Cutting on the heading is safer than cutting on <li>, which the page also uses for its
// own navigation.
const chunks = html.split(/<h3 class="govuk-heading-s/).slice(1);

const field = (chunk, label) => {
  const re = new RegExp('<strong>' + label + '<\\/strong>\\s*:?\\s*([^<]*)', 'i');
  const m = chunk.match(re);
  return m ? decode(m[1]) : '';
};

const rows = [];
for (const chunk of chunks) {
  // The split leaves the rest of the h3's own attributes at the front of the chunk, so the name has
  // to start after the tag closes, and a chunk with no language or service field is one of the
  // page's other headings, "Contact details" among them, not a provider.
  const head = chunk.slice(chunk.indexOf('>') + 1, chunk.indexOf('</h3>'));
  const name = decode(head.replace(/<span[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, ' '));
  if (!name || name.length < 3) continue;
  if (!/<strong>(Languages translated or interpreted|Services provided)<\/strong>/i.test(chunk)) continue;
  const kind = (head.match(/<span[^>]*>\(([^)]*)\)/) || [])[1] || '';
  const languages = field(chunk, 'Languages translated or interpreted');
  const regions = field(chunk, 'Regions');
  const services = field(chunk, 'Services provided');
  const site = (chunk.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="govuk-link"/) ||
                chunk.match(/class="govuk-link"[^>]+href="(https?:\/\/[^"]+)"/) || [])[1] || '';
  const official = /official services/i.test(chunk) || /sworn/i.test(chunk);
  rows.push({
    name,
    kind: decode(kind),
    languages: languages ? languages.split(/,\s*/).map((x) => x.trim()).filter(Boolean) : [],
    regions: regions ? regions.split(/,\s*/).map((x) => x.trim()).filter(Boolean) : [],
    services,
    url: site,
    official,
    country,
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(rows.length + ' translators in ' + country);
  const langs = {};
  rows.forEach((r) => r.languages.forEach((l) => { langs[l] = (langs[l] || 0) + 1; }));
  console.log('  languages: ' + Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, n]) => l + ' ' + n).join(', '));
  const regs = {};
  rows.forEach((r) => r.regions.forEach((x) => { regs[x] = (regs[x] || 0) + 1; }));
  console.log('  regions: ' + Object.entries(regs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l, n]) => l + ' ' + n).join(', '));
  rows.slice(0, 3).forEach((r) => console.log('  e.g. ' + r.name + ' [' + r.languages.join(', ') + '] ' + r.regions.slice(0, 3).join('/')));
}

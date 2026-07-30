/**
 * Adds to each /best/* ranking page (a) a visible "Last updated" freshness stamp and (b) a compact
 * "at a glance" summary table (# | City | Country | key metric | Nomad Score) above the detailed
 * list. The table is scannable and targets featured snippets / People Also Ask (which a young
 * domain can win without a top-10 organic rank). Data is parsed straight from the existing ranked
 * <li> items, so it always matches the list. Idempotent + CRLF-safe.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'best');
const UPDATED = 'Last updated July 2026';

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Turn a hi-stat into { label, value }. e.g. "$500/mo" -> Monthly cost / $500/mo,
// "WiFi 10/10" -> WiFi / 10/10, "Nomad Score 9.6" -> (score) / 9.6
function parseHi(hi) {
  hi = hi.trim();
  if (/^\$/.test(hi)) return { label: 'Monthly cost', value: hi, isScore: false };
  const m = hi.match(/^(\S+)\s+(.+)$/);
  if (m && /^Nomad$/i.test(m[1])) return { label: 'Nomad Score', value: hi.replace(/^Nomad Score\s*/i, ''), isScore: true };
  if (m) return { label: m[1], value: m[2], isScore: false };
  return { label: 'Highlight', value: hi, isScore: false };
}

function build(items, mode) {
  const headKey = mode.isScore ? '' : `<th>${esc(mode.keyLabel)}</th>`;
  const rows = items.map((it) => {
    const keyCell = mode.isScore ? '' : `<td>${esc(it.keyValue)}</td>`;
    return `<tr><td class="bt-rank">${it.rank}</td><td><a href="${it.url}">${esc(it.name)}</a></td>` +
      `<td>${esc(it.country)}</td>${keyCell}<td class="bt-num">${esc(it.score)}</td></tr>`;
  }).join('');
  return `<div class="best-table-wrap"><table class="best-table">` +
    `<caption>At a glance: the full ranking</caption>` +
    `<thead><tr><th class="bt-rank">#</th><th>City</th><th>Country</th>${headKey}<th>Nomad Score</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`;
}

let done = 0, skipped = 0, miss = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(DIR, f);
  let s = fs.readFileSync(abs, 'utf8');
  if (s.includes('class="best-table"')) { skipped++; continue; }

  // parse the ranked items
  const listM = s.match(/<ol class="best-list">([\s\S]*?)<\/ol>/);
  if (!listM) { miss.push(f); continue; }
  const items = [];
  for (const li of listM[1].split(/<li class="best-item/).slice(1)) {
    const url = (li.match(/class="best-name"><a href="([^"]+)"/) || [])[1];
    const name = (li.match(/class="best-name"><a href="[^"]+">([^<]+)</) || [])[1];
    const country = (li.match(/class="best-country">([^<]+)</) || [])[1] || '';
    const hi = (li.match(/class="best-stat hi">([^<]+)</) || [])[1] || '';
    const nomad = (li.match(/class="best-stat nomad">Nomad Score ([\d.]+)</) || [])[1];
    const rank = (li.match(/class="best-rank"><span>(\d+)</) || [])[1];
    if (!url || !name || !rank) continue;
    const parsed = parseHi(hi);
    items.push({ rank, url, name, country, keyValue: parsed.value, score: parsed.isScore ? parsed.value : (nomad || parsed.value), _hi: parsed });
  }
  if (items.length < 3) { miss.push(f + ' (few items)'); continue; }

  const first = items[0]._hi;
  const mode = { isScore: first.isScore, keyLabel: first.label };
  const table = build(items, mode);

  const before = s;
  // 1. freshness stamp right after the breadcrumb nav
  s = s.replace(/(<nav class="crumbs"[\s\S]*?<\/nav>)/, `$1\n      <p class="best-updated">${UPDATED}</p>`);
  // 2. summary table just above the detailed ranked list
  s = s.replace('<ol class="best-list">', table + '\n        <ol class="best-list">');

  if (s !== before) { fs.writeFileSync(abs, s); done++; }
  else miss.push(f + ' (no anchor)');
}
console.log(`best pages updated: ${done}, already-had: ${skipped}, no-match: ${miss.length}`);
if (miss.length) console.log('  ', miss.slice(0, 8).join(', '));

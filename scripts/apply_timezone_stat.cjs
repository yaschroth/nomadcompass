require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Replaces the broken "Time Difference" quick-stat in every city hero with an always-populated
 * "Timezone" stat (UTC offset from cities-data). The old stat showed "N/A" on UTC+0 cities (the
 * generator wrote an empty data-timezone for offset 0) and "Sign in" on every other city for
 * logged-out visitors, so it never read as a real stat. Idempotent + CRLF-safe.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const fn = new Function('module', code + '\n;module.exports = CITIES;');
const m = {}; fn(m);
const tzById = new Map(m.exports.map((c) => [c.id, c.timezone]));

function fmtOffset(o) {
  if (o == null || isNaN(o)) return 'UTC';
  const sign = o < 0 ? '-' : '+';
  const abs = Math.abs(o);
  const h = Math.floor(abs);
  const min = Math.round((abs - h) * 60);
  return 'UTC' + sign + h + (min ? ':' + String(min).padStart(2, '0') : '');
}

const VALUE_RE = /<div class="quick-stat-value" id="timeDifference"[^>]*>[^<]*<\/div>/;
const LABEL_STR = '<div class="quick-stat-label">Time Difference</div>';

let done = 0, skipped = 0, miss = [];
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  if (!tzById.has(slug)) { miss.push(f + ' (no data)'); continue; }
  const abs = path.join(ROOT, 'cities', f);
  let s = fs.readFileSync(abs, 'utf8');
  const before = s;
  const utc = fmtOffset(tzById.get(slug));
  s = s.replace(VALUE_RE, `<div class="quick-stat-value">${utc}</div>`);
  s = s.split(LABEL_STR).join('<div class="quick-stat-label">Timezone</div>');
  if (s !== before) { fs.writeFileSync(abs, s); done++; }
  else if (/quick-stat-label">Timezone</.test(s)) skipped++;
  else miss.push(f);
}
console.log(`city pages updated: ${done}, already-done: ${skipped}, no-match: ${miss.length}`);
if (miss.length) console.log('  ', miss.slice(0, 5).join(', '));

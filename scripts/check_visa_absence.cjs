/**
 * Lists every sentence on a city page that asserts a visa route does NOT exist, grouped by country,
 * and fails on any that is not covered by a dated re-check in data/visa-absence-checks.json.
 *
 * Why: three of the four visa errors found in one day (TODO 0e) were assertions of absence. Olinda
 * said Brazil had no nomad visa (VITEM XIV, since 2022); Swakopmund said Namibia had none (six
 * months, $2,000 a month). check_visa_consistency.cjs compares figures between pages of the same
 * country, so a country whose every page is wrong in the same direction passes it clean, and a
 * sentence that names no figure is invisible to it. An absence reads as authoritative and is the one
 * thing a reader acts on without checking.
 *
 * A claim is covered when its country has an entry in data/visa-absence-checks.json:
 *   { "<Country>": { "checked": "YYYY-MM-DD", "source": "<official url>", "verdict": "none" | "exists",
 *                   "note": "..." } }
 * "none" means the absence is true as of the date; "exists" means such a route exists and every page
 * claiming otherwise is an error. A check older than MAX_DAYS no longer covers anything, because
 * these regimes change (Thailand, Brazil and Namibia all moved within eighteen months).
 *
 * Usage: node scripts/check_visa_absence.cjs [--list]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MAX_DAYS = 180;
const LIST = process.argv.includes('--list');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const cities = m.exports.filter((c) => c && c.id);
const CHECKS_F = path.join(ROOT, 'data', 'visa-absence-checks.json');
const CHECKS = fs.existsSync(CHECKS_F) ? JSON.parse(fs.readFileSync(CHECKS_F, 'utf8')) : {};

// "no (dedicated|specific|formal) (digital nomad|remote work|freelance) visa", "does not (offer|have) a ... visa",
// "there is no ... visa", "has yet to (introduce|launch) a ... visa", "lacks a ... visa".
const VISA = '(?:digital[- ]nomad|nomad|remote[- ]work(?:er)?|freelanc\\w*|long[- ]stay|retirement|work(?:ing)? holiday|startup|self[- ]employ\\w*)';
const RX = [
  new RegExp(`\\b(?:has|offers|there is|there's)\\s+no\\s+(?:\\w+\\s+){0,3}${VISA}\\s+(?:visa|permit|scheme|programme|program|route|category|framework)`, 'i'),
  new RegExp(`\\b(?:does not|doesn't|did not|has not|hasn't|never)\\s+(?:yet\\s+)?(?:offer|have|has|issue|introduce|launch|run|created?)\\s+(?:a|an|any)\\s+(?:\\w+\\s+){0,3}${VISA}\\s+(?:visa|permit|scheme|programme|program|route|category)`, 'i'),
  new RegExp(`\\b(?:has yet to|is yet to)\\s+(?:offer|introduce|launch|create)\\s+(?:a|an|any)\\s+(?:\\w+\\s+){0,3}${VISA}`, 'i'),
  new RegExp(`\\b(?:lacks|without)\\s+(?:a|an|any)\\s+(?:\\w+\\s+){0,3}${VISA}\\s+(?:visa|permit|scheme|route)`, 'i'),
  new RegExp(`\\bno\\s+${VISA}\\s+(?:visa|permit|scheme)\\s+(?:exists|is available|is on offer)`, 'i'),
];
const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

const byCountry = {};
for (const c of cities) {
  const f = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(f)) continue;
  const body = fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = decode(body);
  for (const s of text.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
    if (!RX.some((r) => r.test(s))) continue;
    (byCountry[c.country] = byCountry[c.country] || []).push({ city: c.id, s: s.trim().slice(0, 260) });
  }
}

const now = Date.now();
let uncovered = 0, errors = 0;
const rows = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);
// A country where a route exists can still carry true absence sentences ("no visa for freelancers,
// but a nomad permit exists"); the auditor lists those cities in `accepted`, judged on `checked`.
// A null verdict means the official pages could not be reached: reported, not failed.
let unverified = 0;
for (const [country, hits] of rows) {
  const ck = CHECKS[country];
  const fresh = ck && ck.checked && (now - Date.parse(ck.checked)) / 864e5 <= MAX_DAYS;
  const accepted = new Set((ck && ck.accepted) || []);
  const wrong = fresh && ck.verdict === 'exists' ? hits.filter((h) => !accepted.has(h.city)) : [];
  const state = !ck ? 'UNCHECKED' : !fresh ? `STALE (${ck.checked})` : ck.verdict == null ? 'UNVERIFIED (official pages unreachable)'
    : ck.verdict === 'exists' ? (wrong.length ? `WRONG on ${wrong.length}: ${ck.visa || 'a route'} exists` : `ok, ${ck.visa || 'route'} exists, remaining sentences accepted`) : `ok, none as of ${ck.checked}`;
  if (!fresh) uncovered += hits.length;
  if (fresh && ck.verdict == null) unverified += hits.length;
  errors += wrong.length;
  if (LIST || !fresh || wrong.length) {
    console.log(`${country} (${hits.length}) ${state}`);
    if (LIST || wrong.length) (wrong.length ? wrong : hits).forEach((h) => console.log(`    ${h.city}: ${h.s}`));
  }
}
if (unverified) console.log(`\n${unverified} claims rest on a check that could not reach an official page (verdict null).`);
const total = rows.reduce((n, r) => n + r[1].length, 0);
console.log(`\n${total} absence claims in ${rows.length} countries; ${uncovered} not covered by a fresh check, ${errors} contradicted by one.`);
process.exit(uncovered || errors ? 1 : 0);

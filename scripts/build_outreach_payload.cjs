/**
 * Trims data/outreach-targets.json into the payload the private outreach tool embeds.
 *
 * The full catalogue is ~1.9 MB, most of it repeated source notes. The tool needs enough to write
 * a credible mail and nothing more, so notes are capped, addresses limited to three, and the keys
 * are shortened. The catalogue ships inside the page; only the STATUS of each firm lives in the
 * artifact's db, keyed on the domain, so re-publishing an updated catalogue never disturbs it.
 *
 * Usage: node scripts/build_outreach_payload.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { targets } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'outreach-targets.json'), 'utf8'));

const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || '');

const rows = targets.map((t) => ({
  id: t.id,
  n: t.name,
  w: t.website,
  ev: t.evidence,
  ag: t.aggregator ? 1 : 0,
  c: t.cities,
  k: t.countries.filter(Boolean),
  g: t.categories,
  l: t.languages,
  u: t.listings,
  a: t.addresses.slice(0, 3).map((x) => clip(x, 140)),
  no: clip(t.notes.filter(Boolean).join(' · '), 420),
  s: t.sources.slice(0, 2),
  su: t.sourceUrls.filter(Boolean).slice(0, 1),
  d: t.checked,
  // The address to write to, the kind it is, and every candidate found. The tool shows the kind
  // because "role-same-domain" and "a partner's personal address" are not the same thing to send to.
  e: t.email || '',
  ek: t.emailKind || '',
  ea: t.emailAmbiguous ? 1 : 0,
  ec: t.emails && t.emails.length > 1 ? t.emails.slice(0, 5) : undefined,
  // The channel to reach them on, and what it needs. wa is digits only, ready for a wa.me link.
  ch: t.channel || '',
  wa: t.whatsapp || '',
  so: t.social || undefined,
}));

const payload = {
  built: new Date().toISOString().slice(0, 10),
  firms: rows.length,
  rows,
};
const out = path.join(ROOT, 'data', 'outreach-payload.json');
fs.writeFileSync(out, JSON.stringify(payload));
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`${rows.length} firms -> data/outreach-payload.json (${kb} KB)`);
console.log(`  countries: ${new Set(rows.flatMap((r) => r.k)).size}, cities: ${new Set(rows.flatMap((r) => r.c)).size}`);
console.log(`  categories: ${[...new Set(rows.flatMap((r) => r.g))].join(', ')}`);
const mailable = rows.filter((r) => r.e);
console.log(`  ${mailable.length} with an address, ${mailable.filter((r) => /^role-/.test(r.ek)).length} of them a role mailbox`);
['whatsapp', 'social', 'email'].forEach((c) => {
  const n = rows.filter((r) => r.ch === c).length;
  if (n) console.log(`  ${String(n).padStart(5)} reachable by ${c}`);
});

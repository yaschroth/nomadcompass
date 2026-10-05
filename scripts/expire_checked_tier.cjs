require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Lets the Checked tier lapse twelve months after the provider confirmed its entry.
 *
 * "Checked with them" ranks above an official list because the business itself answered us. That
 * is true on the day and decays: a confirmation from 2026 would still read as current in 2029, and
 * the card would keep its place at the top of the city on a claim nobody has renewed. So a row whose
 * confirmedOn is more than MAX_DAYS old goes back to `self-declared`, which is what a year-old answer
 * from the provider is: its own word, unverified since. The date moves to `lastConfirmedOn` so the
 * history survives and a renewed reply can restore the tier by setting evidence and confirmedOn again.
 *
 * build_services.cjs refuses to build while any Checked row is past the limit, so this cannot be
 * forgotten: the first rebuild after a confirmation turns a year old stops and names this script.
 *
 * Usage: node scripts/expire_checked_tier.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const F = path.join(ROOT, 'data', 'service-languages.json');
const MAX_DAYS = 365;
const APPLY = process.argv.includes('--apply');

const lapsed = (p, now = Date.now()) => p.evidence === 'visited' && /^\d{4}-\d{2}-\d{2}$/.test(p.confirmedOn || '')
  && (now - Date.parse(p.confirmedOn + 'T00:00:00Z')) / 864e5 > MAX_DAYS;

if (require.main === module) {
  const db = JSON.parse(fs.readFileSync(F, 'utf8'));
  const due = db.providers.filter((p) => lapsed(p));
  const live = db.providers.filter((p) => p.evidence === 'visited').length;
  console.log(`${live} row(s) carry the Checked tier; ${due.length} confirmed more than ${MAX_DAYS} days ago.`);
  due.forEach((p) => console.log(`  - ${p.name} [${p.city}/${p.category}] confirmed ${p.confirmedOn}`));
  if (due.length && APPLY) {
    for (const p of due) { p.evidence = 'self-declared'; p.lastConfirmedOn = p.confirmedOn; delete p.confirmedOn; }
    fs.writeFileSync(F, JSON.stringify(db, null, 2) + '\n');
    console.log(`lapsed ${due.length}; rebuild the services pages.`);
  } else if (due.length) console.log('dry run: pass --apply to lapse them.');
}

module.exports = { lapsed, MAX_DAYS };

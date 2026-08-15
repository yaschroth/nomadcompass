/**
 * Fails if two providers in the same city look like the same business under different spellings.
 *
 * The batch scripts have always guarded against an exact repeat of city + name, and that is not
 * enough. Sources spell the same hospital differently: the UK FCDO writes "Chiangmai Ram
 * Hospital" where a directory writes "Chiang Mai Ram Hospital", and "BNH Hospital" and "Bangkok
 * Nursing Home Hospital (BNH)" are one building on Convent Road. Four such pairs reached the
 * published page before anyone looked.
 *
 * The test: strip everything but letters and digits, lowercase, and flag a pair where one name
 * contains the other. That catches spacing, punctuation and "City" suffixes without flagging
 * genuinely different businesses.
 *
 * Deliberate exceptions live in ALLOW, with the reason. A source that really does print one name
 * at two addresses is not a mistake to fix, it is a fact to record.
 *
 * Usage: node scripts/check_service_dupes.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));

// city|normalised-name pairs that are known to be two different things.
const ALLOW = new Set([
  // The FCDO's Mexico list prints this name at two addresses in different districts; both are
  // kept and the second carries its district in the name so they can be told apart.
  'mexicocity|centromedicoabcobservatorio|centromedicoabcobservatoriolosmoralespolanco',
]);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const byCity = {};
for (const p of DB.providers) (byCity[p.city] = byCity[p.city] || []).push(p);

const problems = [];
for (const [city, rows] of Object.entries(byCity)) {
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = norm(rows[i].name);
      const b = norm(rows[j].name);
      if (a.length < 8 || b.length < 8) continue;
      if (!a.includes(b) && !b.includes(a)) continue;
      const key = [city, a, b].sort().join('|');
      const alt = [city, b, a].join('|');
      if (ALLOW.has(key) || ALLOW.has(alt) || ALLOW.has([city, a, b].join('|'))) continue;
      problems.push(`${city}: "${rows[i].name}" and "${rows[j].name}"`);
    }
  }
}

if (problems.length) {
  console.log('SERVICE DUPLICATE GATE\n');
  problems.forEach((p) => console.log('  ' + p));
  console.log(`\n${problems.length} pair(s) look like one business listed twice.`);
  console.log('Merge them into a single row carrying every language both sources claim, or add the');
  console.log('pair to ALLOW in this file with the reason it is genuinely two businesses.');
  process.exit(1);
}

console.log(`\n  clean: ${DB.providers.length} providers, no two in a city look like the same business.`);

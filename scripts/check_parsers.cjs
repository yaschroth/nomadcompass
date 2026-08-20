/**
 * Runs each source reader over a frozen page and fails if what it reads has changed.
 *
 * There are four readers now and they share code and habits: a fix for one list is a change for all
 * of them. Teaching the table reader about Zagreb, where the specialty sits in the first column,
 * came within one test of breaking Athens, where it does not, and the only reason it did not ship
 * that way is that I happened to re-run Athens by hand. That is not a method.
 *
 * A fixture is a page already saved on disk, the reader that should read it, and three things that
 * must stay true: how many entries come out, how many of them carry a language of their own, and
 * three names, chosen from the start, the middle and the end so that a change in the middle of a
 * long list cannot hide.
 *
 * Names are the point. A count can stay the same while every row shifts by one, which is exactly
 * what a column mix-up does.
 *
 * Update a fixture only when you meant to change what a reader reads:
 *   node scripts/check_parsers.cjs --update
 *
 * Usage: node scripts/check_parsers.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIX = path.join(ROOT, 'data', 'parser-fixtures.json');
const UPDATE = process.argv.includes('--update');

if (!fs.existsSync(FIX)) {
  console.error('No fixtures yet. Create data/parser-fixtures.json with entries of the form');
  console.error('  { "name": "...", "file": "<absolute path>", "parser": "parse_diplo_table_list.cjs", "args": [] }');
  console.error('then run with --update to record what the readers currently produce.');
  process.exit(2);
}

const fixtures = JSON.parse(fs.readFileSync(FIX, 'utf8'));
// Fixture paths are stored relative to the repository, so the file means the same thing on
// another machine.
fixtures.forEach((f) => { f.stored = f.file; f.file = path.isAbsolute(f.file) ? f.file : path.join(ROOT, f.file); });
const read = (f) => {
  const out = execFileSync('node', [path.join(ROOT, 'scripts', f.parser), f.file, ...(f.args || []), '--json'],
    { encoding: 'utf8', maxBuffer: 1 << 26 });
  const j = JSON.parse(out);
  return Array.isArray(j) ? j : (j.rows || []);
};
// The first, the middle and the last entry: a change anywhere in the list moves at least one.
const sampleOf = (rows) => [0, Math.floor(rows.length / 2), rows.length - 1]
  .filter((i, k, a) => rows[i] && a.indexOf(i) === k).map((i) => rows[i].name);

let failed = 0;
const missing = [];
for (const f of fixtures) {
  if (!fs.existsSync(f.file)) { missing.push(f.name); continue; }
  let rows;
  try {
    rows = read(f);
  } catch (e) {
    console.log('  FAIL  ' + f.name.padEnd(26) + 'the reader threw: ' + String(e.message).split('\n')[0].slice(0, 80));
    failed += 1;
    continue;
  }
  const got = {
    rows: rows.length,
    withLanguages: rows.filter((r) => (r.languages || []).length).length,
    sample: sampleOf(rows),
  };

  if (UPDATE) { f.expect = got; console.log('  set   ' + f.name.padEnd(26) + got.rows + ' rows, ' + got.withLanguages + ' with languages'); continue; }

  const want = f.expect || {};
  const problems = [];
  if (got.rows !== want.rows) problems.push('rows ' + want.rows + ' -> ' + got.rows);
  if (got.withLanguages !== want.withLanguages) problems.push('with languages ' + want.withLanguages + ' -> ' + got.withLanguages);
  (want.sample || []).forEach((n, i) => { if (got.sample[i] !== n) problems.push('name ' + (i + 1) + ' "' + n + '" -> "' + (got.sample[i] || 'nothing') + '"'); });

  if (problems.length) {
    console.log('  FAIL  ' + f.name.padEnd(26) + problems.join('; ').slice(0, 160));
    failed += 1;
  } else {
    console.log('  ok    ' + f.name.padEnd(26) + got.rows + ' rows, ' + got.withLanguages + ' with a language of their own');
  }
}

if (UPDATE) {
  // Write back the path as it was stored, or an update on one machine would pin the file to it.
  fixtures.forEach((f) => { f.file = f.stored; delete f.stored; });
  fs.writeFileSync(FIX, JSON.stringify(fixtures, null, 1) + '\n');
  console.log('\nRecorded what the readers produce today. Commit this only if the change was intended.');
  process.exit(0);
}

if (missing.length) console.log('\n  ' + missing.length + ' fixture page(s) are not on this machine, skipped: ' + missing.join(', '));
if (failed) {
  console.log('\n' + failed + ' reader(s) no longer read their fixture the same way.');
  console.log('If that was the point, run with --update and say so in the commit message.');
  process.exit(1);
}
console.log('\n  clean: ' + (fixtures.length - missing.length) + ' fixtures, every reader still reads its page the same way.');

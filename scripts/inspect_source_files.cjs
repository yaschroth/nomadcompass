/**
 * Says which parser can read each saved consular list, and how much it would yield.
 *
 * The lists are gathered faster than they can be ingested, and they come in at least four shapes:
 * a table that names its columns, a table that does not, running text under headings, and a PDF.
 * Opening each one by hand to find out which is which is the slow part, so this runs every parser
 * over every file and reports what came back. It writes nothing to the directory.
 *
 * A file that no parser can read is the useful output here, not a failure: it names the next shape
 * worth teaching, ranked by how many entries are behind it.
 *
 * Usage: node scripts/inspect_source_files.cjs <dir> [--roster de]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/inspect_source_files.cjs <dir> [--roster de]'); process.exit(2); }
const rosterAt = process.argv.indexOf('--roster');
const ROSTER = rosterAt > 0 ? process.argv[rosterAt + 1] : 'de';

const walk = (p) => fs.readdirSync(p, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]));

const run = (script, args) => {
  try {
    return JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts', script), ...args, '--json'],
      { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch (e) { return null; }
};

const files = walk(dir).filter((f) => /\.(html?|pdf|txt)$/i.test(f));
const results = [];
for (const f of files) {
  const size = fs.statSync(f).size;
  const row = { file: path.relative(dir, f), kb: Math.round(size / 1024), best: '', rows: 0, withLangs: 0, note: '' };

  if (/\.pdf$/i.test(f)) {
    const head = fs.readFileSync(f).slice(0, 5).toString('latin1');
    row.best = head.startsWith('%PDF') ? 'pdf, needs a text extraction pass' : 'NOT A PDF, the server sent something else';
    results.push(row);
    continue;
  }

  const html = fs.readFileSync(f, 'utf8');
  if (!/<table|<h[23]/i.test(html)) { row.note = 'no tables and no headings'; results.push(row); continue; }

  const table = run('parse_diplo_table_list.cjs', [f]);
  const flat = run('parse_diplo_flat_list.cjs', [f, '--roster', ROSTER]);
  const fr = run('parse_diplo_fr_list.cjs', [f]);
  const score = [
    ['table', table ? table.rows : [], (r) => r.languages.length],
    ['flat', flat ? flat.rows : [], (r) => (r.ownLanguages || []).length],
    ['paris-style', Array.isArray(fr) ? fr : [], () => false],
  ].map(([name, rows, hasLang]) => ({ name, n: rows.length, withLangs: rows.filter(hasLang).length }));

  // A parser that finds languages of its own beats one that finds more rows without them: the
  // per-entry claim is the thing this directory is built on.
  score.sort((a, b) => b.withLangs - a.withLangs || b.n - a.n);
  const top = score[0];
  row.best = top.n ? top.name : '';
  row.rows = top.n;
  row.withLangs = top.withLangs;
  row.note = score.map((s) => s.name + ' ' + s.n + '/' + s.withLangs).join('  ');
  results.push(row);
}

results.sort((a, b) => b.withLangs - a.withLangs || b.rows - a.rows);
console.log(results.length + ' saved files\n');
console.log('  rows/with-languages by parser, best first\n');
results.forEach((r) => {
  console.log('  ' + String(r.rows).padStart(4) + ' rows ' + String(r.withLangs).padStart(4) + ' with langs  '
    + (r.best || 'NO PARSER').padEnd(12) + r.file.slice(0, 46).padEnd(48) + r.note);
});
const unread = results.filter((r) => !r.rows && !/pdf/.test(r.best));
console.log('\n' + results.filter((r) => r.rows).length + ' files a parser can read, '
  + results.filter((r) => /^pdf/.test(r.best)).length + ' PDFs, ' + unread.length + ' no parser can read yet.');

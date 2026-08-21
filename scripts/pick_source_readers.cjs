/**
 * Records, per source file, which reader actually reads it.
 *
 * The ingest tries two readers: a pair for PDFs and a pair for everything else. There are nine, and
 * the other seven were written for shapes the defaults cannot see. Nothing told the batch which one
 * to use, so 131 manifest rows reported "no parser could read it" when in truth only five files
 * defeat every reader, four of them scans.
 *
 * Scored the way the ingest scores: the reader that finds the most rows carrying a language of their
 * own wins, and row count breaks a tie. Only written where a non-default reader beats the default,
 * so a source that already works is left exactly as it is.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const reg = JSON.parse(fs.readFileSync('data/verified-consular-sources.json', 'utf8'));
const READERS = [
  ['parse_diplo_table_list.cjs', []],
  ['parse_diplo_block_list.cjs', []],
  ['parse_diplo_pdf_list.cjs', []],
  ['parse_pdf_blocks.cjs', []],
  ['parse_pdf_blocks.cjs', ['--columns']],
  ['parse_pdf_columns.cjs', []],
  ['parse_html_paragraph_list.cjs', []],
  ['parse_labelled_blocks.cjs', []],
  ['parse_labelled_blocks.cjs', ['--raw']],
  ['parse_xlsx_list.cjs', []],
  ['parse_docx_list.cjs', []],
];

const run = (script, file, extra) => {
  try {
    const out = execFileSync('node', [path.join('scripts', script), file, ...extra, '--json'],
      { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
    const j = JSON.parse(out);
    const rows = Array.isArray(j) ? j : (j.rows || []);
    return { n: rows.length, withLang: rows.filter((r) => (r.languages || []).length).length };
  } catch (e) { return { n: 0, withLang: 0 }; }
};
/**
 * Whether one read beats another.
 *
 * Row count is not evidence. parse_pdf_blocks with --columns reads more "rows" than anything else
 * out of almost every file, including HTML ones it is reading as raw text, and carries a language on
 * none of them: that is a reader chopping a page into noise, not reading it. Only a gain in rows that
 * state their own language counts as a better read.
 */
const better = (a, b) => !b || a.withLang > b.withLang;

const files = new Map();
reg.forEach((s) => { if (!files.has(s.file)) files.set(s.file, s); });

const changes = [];
let i = 0;
for (const [file, src] of files) {
  i += 1;
  if (!fs.existsSync(file)) continue;
  if (src.parser) continue;                       // already told which reader to use
  const isPdf = /\.pdf$/i.test(file);
  const defaults = isPdf
    ? [['parse_diplo_pdf_list.cjs', []], ['parse_diplo_block_list.cjs', []]]
    : [['parse_diplo_table_list.cjs', []], ['parse_diplo_block_list.cjs', []]];

  let best = null;
  defaults.forEach(([r, x]) => { const g = run(r, file, x); if (better(g, best)) best = { reader: r, args: x, ...g }; });
  const baseline = best;

  READERS.forEach(([r, x]) => { const g = run(r, file, x); if (better(g, best)) best = { reader: r, args: x, ...g }; });

  if (best.reader !== baseline.reader || String(best.args) !== String(baseline.args)) {
    changes.push({ file, src, baseline, best });
  }
  if (i % 40 === 0) console.error('  ...' + i + '/' + files.size);
}

console.log('files where another reader beats the default: ' + changes.length + ' of ' + files.size + '\n');
changes.sort((a, b) => b.best.n - a.best.n).forEach((c) => {
  console.log('  ' + String(c.best.n).padStart(4) + ' rows (' + String(c.best.withLang).padStart(3) + ' with a language)  '
    + c.best.reader.replace('parse_', '').replace('.cjs', '').padEnd(22)
    + (c.best.args.join(' ') || '').padEnd(10)
    + 'was ' + String(c.baseline.n).padStart(3) + '   ' + c.src.city.padEnd(13) + path.basename(c.file).slice(0, 34));
});

if (!process.argv.includes('--write')) { console.log('\nDry run. Re-run with --write to record these in the registry.'); process.exit(0); }
const byFile = new Map(changes.map((c) => [c.file, c.best]));
let set = 0;
reg.forEach((s) => {
  const b = byFile.get(s.file);
  if (!b || s.parser) return;
  s.parser = b.reader;
  if (b.args.length) s.parserArgs = b.args;
  set += 1;
});
fs.writeFileSync('data/verified-consular-sources.json', JSON.stringify(reg, null, 1) + '\n');
console.log('\nrecorded a reader on ' + set + ' manifest rows');

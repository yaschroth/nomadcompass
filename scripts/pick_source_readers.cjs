/**
 * Records, per source file, which reader actually reads it.
 *
 * The ingest tries two readers: a pair for PDFs and a pair for everything else. There are seventeen,
 * and the rest were written for shapes the defaults cannot see. Nothing told the batch which one to
 * use, so 131 manifest rows reported "no parser could read it" when in truth only a handful of files
 * defeat every reader, most of them scans.
 *
 * Scored the way the ingest scores: the reader that finds the most rows carrying a language of their
 * own wins. Only written where a non-default reader beats the default, so a source that already
 * works is left exactly as it is.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const reg = JSON.parse(fs.readFileSync('data/verified-consular-sources.json', 'utf8'));
/**
 * The readers, in the order a tie is broken.
 *
 * Order used not to matter, because a reader only won by finding more rows that state their own
 * language and a tie left the incumbent in place. It matters now that a read of nothing can be
 * beaten by a read of something (see `better` below), and the ones that read a page they do not
 * understand are last on purpose: parse_pdf_blocks --columns will chop almost any file into rows.
 */
const READERS = [
  ['parse_diplo_table_list.cjs', [], 'html'],
  ['parse_html_paragraph_list.cjs', [], 'html'],
  // Written on 2026-08-24 for three shapes nothing here could read: tables used for layout rather
  // than for tabulation with no header row, Austria's labels stacked above their values, and the
  // German missions' entries that run on with the boundary marked only in the markup.
  ['parse_html_row_entries.cjs', [], 'html'],
  ['parse_stacked_labels.cjs', [], 'html text'],
  ['parse_diplo_bold_run.cjs', [], 'html'],
  ['parse_fr_notoriete.cjs', [], 'html text'],
  ['parse_diplo_pdf_list.cjs', [], 'pdf text'],
  ['parse_pdf_columns.cjs', [], 'pdf text'],
  // Written on 2026-08-24 for two more: a three-column table whose lines are records, and stacks of
  // labelled blocks side by side.
  ['parse_pdf_table_columns.cjs', [], 'pdf text'],
  ['parse_pdf_column_blocks.cjs', [], 'pdf text'],
  ['parse_labelled_blocks.cjs', [], 'pdf text'],
  ['parse_labelled_blocks.cjs', ['--raw'], 'pdf text'],
  ['parse_xlsx_list.cjs', [], 'zip'],
  ['parse_docx_rows.cjs', [], 'zip'],
  ['parse_pdf_blocks.cjs', [], 'pdf text'],
];
/**
 * The readers that read something out of anything, asked only when nothing else read the file.
 *
 * parse_pdf_blocks with --columns chops almost any page into rows and carries a language on none of
 * them. That is harmless while a better read exists to beat it, and it is not harmless on a roster
 * source, where no row states its own language and the count of rows is the only thing left to
 * judge by. So these are a second round rather than a competitor.
 */
const LAST_RESORT = [
  ['parse_diplo_block_list.cjs', [], 'pdf text'],
  ['parse_pdf_blocks.cjs', ['--columns'], 'pdf text'],
];

/**
 * What kind of file this is, read from the file rather than from its name.
 *
 * The name lies. The Polish consulate in Munich serves a Word document at a URL ending .pdf, and
 * parse_docx_rows.cjs reads it correctly, so an extension test would have thrown away 26 real rows.
 *
 * The kind matters because a reader offered a file it cannot understand does not fail cleanly: on a
 * roster source, where nothing states its own language and the tie is broken by whichever reader
 * finds rows first, parse_pdf_blocks.cjs read the raw HTML of the French list for Tokyo as text and
 * won it with 169 rows of markup against the 72 real entries a reader of that page finds. Nineteen
 * sources were picked that way before this test existed.
 */
const kindOf = (file) => {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(4096);
  const n = fs.readSync(fd, buf, 0, 4096, 0);
  fs.closeSync(fd);
  const head = buf.slice(0, n);
  if (head.slice(0, 2).toString('latin1') === 'PK') return 'zip';
  if (head.slice(0, 5).toString('latin1') === '%PDF') return 'pdf';
  if (/<(!doctype|html|head|body|div|table|p)\b/i.test(head.toString('utf8'))) return 'html';
  return 'text';
};

const run = (script, file, extra) => {
  try {
    // A timeout, because this runs every reader over every file and one that never returns stops the
    // whole sweep with nothing written. A reader that cannot finish a file in a minute has not read
    // it, and scoring it nought is the right answer anyway.
    const out = execFileSync('node', [path.join('scripts', script), file, ...extra, '--json'],
      { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
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
 *
 * Except where nobody finds a language at all. On a roster source no row states its own language,
 * because the claim is made once for the whole list, so every reader scored nought and the incumbent
 * kept the file: 111 sources reported "no parser could read it" and a good half of them were roster
 * lists a reader here reads perfectly. There the count of rows is the only evidence there is, and
 * the reader that finds the most of them wins.
 *
 * That is the rule this comment used to warn against, and what makes it safe now is that it is asked
 * of a shorter list: a reader is only offered a file of a kind it can read (see kindOf), and the two
 * that chop any page into rows are held back to a second round (see LAST_RESORT). Taking the first
 * reader in list order instead was tried and is worse: it gave the Spanish liste de notoriete to a
 * reader that found 77 entries in it over the one that finds 284.
 */
const better = (a, b) => !b || a.withLang > b.withLang
  || (a.withLang === b.withLang && b.withLang === 0 && a.n > b.n);

const files = new Map();
reg.forEach((s) => { if (!files.has(s.file)) files.set(s.file, s); });

const changes = [];
let i = 0;
for (const [file, src] of files) {
  i += 1;
  if (!fs.existsSync(file)) continue;
  if (src.parser) continue;                       // already told which reader to use
  const isPdf = /\.pdf$/i.test(file);
  const kind = kindOf(file);
  // The ingest's own two, so that "better than the default" means what it says.
  const defaults = isPdf
    ? [['parse_diplo_pdf_list.cjs', []], ['parse_diplo_block_list.cjs', []]]
    : [['parse_diplo_table_list.cjs', []], ['parse_diplo_block_list.cjs', []]];

  let best = null;
  defaults.forEach(([r, x]) => { const g = run(r, file, x); if (better(g, best)) best = { reader: r, args: x, ...g }; });
  const baseline = best;

  READERS.forEach(([r, x, kinds]) => {
    if (!kinds.split(' ').includes(kind)) return;
    const g = run(r, file, x);
    if (better(g, best)) best = { reader: r, args: x, ...g };
  });
  if (!best.n) {
    LAST_RESORT.forEach(([r, x, kinds]) => {
      if (!kinds.split(' ').includes(kind)) return;
      const g = run(r, file, x);
      if (better(g, best)) best = { reader: r, args: x, ...g };
    });
  }

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

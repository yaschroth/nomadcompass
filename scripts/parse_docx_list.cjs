/**
 * Reads a provider list published as a Word .docx file.
 *
 * Six of the verified consular lists are Word documents, covering Prague, Munich, Amsterdam, Dubai,
 * Santiago and Nairobi, and they come in two arrangements. Some are tables, one row per firm. The
 * rest are running blocks of labelled lines: a name, then Tel:, E-mail:, Languages: and so on, with
 * a blank line between entries.
 *
 * A .docx is a zip holding word/document.xml, so both arrangements can be read without a library.
 * The one thing that must not be lost is where a line ends: Word writes a soft break as <w:br/> and
 * a paragraph as <w:p>, and a document that puts a whole entry in one paragraph with soft breaks
 * looks like one line of noise unless both are turned back into newlines.
 *
 * Usage:
 *   node scripts/parse_docx_list.cjs <file.docx> --tables [--json]
 *   node scripts/parse_docx_list.cjs <file.docx> --blocks [--json]
 *   node scripts/parse_docx_list.cjs <file.docx> --raw
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_docx_list.cjs <file.docx> [--tables|--blocks|--raw] [--json]'); process.exit(2); }

let xml = '';
try {
  xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 1 << 28 });
} catch (e) {
  console.error('not a readable .docx: ' + String(e.message).split('\n')[0]);
  process.exit(1);
}

const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
// The text of one paragraph, with soft breaks kept as newlines.
const paraText = (p) => unesc(p
  .replace(/<w:br\s*\/?>/g, '\n')
  .replace(/<w:tab\s*\/?>/g, ' ')
  .replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();

const paragraphsIn = (scope) => [...scope.matchAll(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g)]
  .map((m) => paraText(m[0]));

const tables = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((t) => {
  const rows = [...t[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((r) => {
    const cells = [...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)]
      .map((c) => paragraphsIn(c[0]).filter(Boolean).join('\n'));
    return cells;
  });
  return rows;
});

// Everything outside a table, as blocks separated by empty paragraphs.
const outsideTables = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, '<w:p></w:p>');
const blocks = (() => {
  const out = [];
  let current = [];
  paragraphsIn(outsideTables).forEach((p) => {
    // A paragraph can itself hold several lines when Word used soft breaks.
    const lines = p.split('\n').map((l) => l.trim());
    lines.forEach((line) => {
      if (!line) { if (current.length) { out.push(current); current = []; } return; }
      current.push(line);
    });
  });
  if (current.length) out.push(current);
  return out;
})();

const mode = process.argv.includes('--tables') ? 'tables'
  : process.argv.includes('--blocks') ? 'blocks'
    : process.argv.includes('--raw') ? 'raw' : 'raw';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(mode === 'tables' ? { tables } : { blocks }, null, 1));
  process.exit(0);
}

if (mode === 'raw') {
  console.log(tables.length + ' table(s), ' + tables.reduce((a, t) => a + t.length, 0) + ' rows in them; '
    + blocks.length + ' block(s) outside tables');
  tables.slice(0, 2).forEach((t, i) => {
    console.log('  table ' + i + ', ' + t.length + ' rows, ' + (t[0] || []).length + ' columns');
    t.slice(0, 3).forEach((r) => console.log('     ' + r.map((c) => c.replace(/\n/g, ' / ').slice(0, 40)).join(' | ').slice(0, 170)));
  });
  blocks.slice(0, 4).forEach((b, i) => console.log('  block ' + i + ': ' + b.join(' / ').slice(0, 160)));
  process.exit(0);
}

if (mode === 'tables') {
  const flat = tables.flat().filter((r) => r.some((c) => c));
  console.log(flat.length + ' rows across ' + tables.length + ' table(s)');
  flat.slice(0, 8).forEach((r) => console.log('  ' + r.map((c) => c.replace(/\n/g, ' / ').slice(0, 44)).join(' | ').slice(0, 180)));
} else {
  console.log(blocks.length + ' blocks, ' + blocks.filter((b) => b.length > 2).length + ' of them more than two lines');
  blocks.filter((b) => b.length > 2).slice(0, 6).forEach((b) => console.log('  ' + b.join(' / ').slice(0, 170)));
}

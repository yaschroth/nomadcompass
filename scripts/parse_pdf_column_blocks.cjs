/**
 * Reads a provider list written as labelled blocks, in one column or in several side by side.
 *
 * This is the other thing a three-column page can be. parse_pdf_table_columns.cjs handles a table,
 * where a line means one record: name, address, telephone. Sweden's list for Cambodia uses the same
 * three columns for something quite different, two independent stacks of blocks, each firm giving
 * its own labelled fields:
 *
 *     P&A Asia Law Office                        Boravuth & Associates
 *     Address: #Unit. 2103A, Fortune Tower        Address: #189, St. 38C, Phum Trea
 *     Telephone: +855 99841478                    Telephone: (855) 77 722 168
 *     Languages: English, French, Chinese & Khmer Languages: English, Chinese, French & Khmer
 *
 * Nothing on a line relates the left firm to the right one, so the table reader paired each with the
 * other's address and now refuses the shape outright. What both readers share is finding the
 * columns, by clustering where cells start rather than cutting the page at an offset. From there
 * this one reads each column downwards on its own, which is the only order in which these mean
 * anything.
 *
 * The language claim comes two ways and both are here. Cambodia labels it, "Languages: English,
 * French, Chinese & Khmer", which is the cleanest statement any source in this directory makes.
 * India and Nepal write it into a sentence instead, "The firm has English and Hindi speaking staff",
 * and that is read only out of a sentence that says somebody speaks, so that "English law" in a list
 * of practice areas is not mistaken for a claim about the staff.
 *
 * Usage: node scripts/parse_pdf_column_blocks.cjs <file.pdf> [--json]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_pdf_column_blocks.cjs <file.pdf> [--json]'); process.exit(2); }

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'colblocks-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try {
    execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error('pdftotext could not read this file');
    process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));

const cellsOf = (l) => {
  const out = [];
  const re = /\S(?:.*?\S)?(?=\s{2,}|$)/g;
  let m;
  while ((m = re.exec(l))) out.push({ at: m.index, text: m[0].trim() });
  return out;
};

/**
 * The columns, from where cells start.
 *
 * A column has to hold a real share of the page's cells to be one. Ten per cent was chosen because
 * India's list is one column with a handful of indented continuation lines, and counting those as a
 * second column would have cut every long address in half.
 */
const columnsOf = () => {
  const hist = {};
  let total = 0;
  lines.forEach((l) => cellsOf(l).forEach((c) => { hist[c.at] = (hist[c.at] || 0) + 1; total += 1; }));
  const offsets = Object.keys(hist).map(Number).sort((a, b) => a - b);
  const groups = [];
  offsets.forEach((o) => {
    const last = groups[groups.length - 1];
    if (last && o - last.to <= 8) { last.to = o; last.n += hist[o]; } else groups.push({ from: o, to: o, n: hist[o] });
  });
  const real = groups.filter((g) => g.n >= Math.max(4, total * 0.1));
  const edges = [];
  for (let i = 1; i < real.length; i += 1) edges.push(Math.round((real[i - 1].to + real[i].from) / 2));
  return { edges, count: Math.max(real.length, 1) };
};

const { edges, count } = columnsOf();
const colOf = (at) => { let c = 0; while (c < edges.length && at >= edges[c]) c += 1; return c; };

// Each column read downwards as its own page.
const columns = Array.from({ length: count }, () => []);
lines.forEach((l) => {
  const per = Array.from({ length: count }, () => []);
  cellsOf(l).forEach((c) => per[Math.min(colOf(c.at), count - 1)].push(c.text));
  per.forEach((cells, i) => columns[i].push(cells.join(' ')));
});

const LABEL = /^\s*(Address|Adress|Addresse|Telephone|Telefon|Tel|Phone|Mobile|Mobil|Fax|E-?mail|Epost|Website|Web|Services|Legal practice areas|Practice Areas|Practice|Languages|Language|Point of [Cc]ontact|Contact person|Contact|Spr[åa]k)\s*[:.]/i;
const labelOf = (l) => { const m = l.match(LABEL); return m ? m[1].toLowerCase().replace(/[^a-z]/g, '') : ''; };
const valueOf = (l) => l.replace(LABEL, '').trim();
const HEADING = /^(LIST OF|F[öo]rteckning|Disclaimer|Please note|Lawyers list|Advokatlista|Namn|Name)\b/i;
const BULLET = /^\s*[•·*\-–]\s+/;

/**
 * A rule between entries says where one ends, and says it better than anything inferred.
 *
 * The US embassy's Madrid list draws a line of dashes between firms, and its first line is the firm:
 * "Abogados Duguech & Dip", then the website, then a point of contact, then Address. Anchoring on
 * the ADDRESS label instead took the line directly above it, so 46 Madrid firms went in named after
 * whoever answers the telephone, or after their own web address. Where a separator exists it decides,
 * and the address anchor is for lists that have none.
 */
const SEPARATOR = /^[-–—_=*]{3,}$/;

const blocks = [];
columns.forEach((col) => {
  const ruled = col.filter((l) => SEPARATOR.test(l.trim())).length >= 3;
  if (ruled) {
    let buf = [];
    const take = () => {
      const lines = buf.filter((l) => l && !SEPARATOR.test(l));
      buf = [];
      if (lines.length < 2) return;
      /**
       * The name is the last thing said before the first labelled field, not the first thing in the
       * block.
       *
       * Everything above the first rule belongs to the same buffer as the first firm: the Madrid
       * list opens with a paragraph and a run of province names, and reading downwards found those
       * instead, gave them Abogados Duguech & Dip's address and lost the firm. Reading up from the
       * first label finds the firm every time, past its own web address, which is what sits between
       * the two.
       */
      const first = lines.findIndex((l) => labelOf(l));
      const before = (first < 0 ? lines : lines.slice(0, first))
        .filter((l) => !HEADING.test(l) && !BULLET.test(l) && !/^(https?:|www\.)/i.test(l)
          && l.length <= 70 && !/:$/.test(l));
      const name = before[before.length - 1];
      if (!name) return;
      blocks.push({ name, lines: lines.slice(first < 0 ? 0 : first) });
    };
    col.forEach((raw) => { const l = raw.trim(); if (SEPARATOR.test(l)) take(); else buf.push(l); });
    take();
    return;
  }
  let cur = null;
  for (let i = 0; i < col.length; i += 1) {
    const l = col[i].trim();
    if (!l) continue;
    if (labelOf(l)) { if (cur) cur.lines.push(l); continue; }
    if (HEADING.test(l) || BULLET.test(l)) { if (cur) cur.lines.push(l); continue; }
    /**
     * A new firm begins above the ADDRESS label, not above any label.
     *
     * An address runs over two or three unlabelled lines and the line after it carries the next
     * label, so "any unlabelled line followed by a label" made a new firm out of every one of them:
     * "Phnom Penh, Cambodia" became a firm because "Telephone:" came next. Address is the label that
     * opens a block and appears once in it, which is what makes it the reliable marker.
     */
    let j = i + 1;
    while (j < col.length && !col[j].trim()) j += 1;
    if (j < col.length && /^(address|adress|addresse)$/.test(labelOf(col[j]))) { cur = { name: l, lines: [] }; blocks.push(cur); continue; }
    if (cur) cur.lines.push(l);
  }
});

const rows = blocks.map((b) => {
  const fields = {};
  let last = '';
  b.lines.forEach((l) => {
    const k = labelOf(l);
    if (k) { fields[k] = (fields[k] ? fields[k] + ' ' : '') + valueOf(l); last = k; } else if (last) fields[last] += ' ' + l;
  });
  const prose = b.lines.filter((l) => !labelOf(l)).join(' ');
  const said = fields.languages || fields.language || fields.sprak || fields.språk || '';
  return {
    name: b.name,
    languages: said ? L.readLanguages(said) : L.readLanguagesProse([prose, fields.contact || ''].join(' ')),
    languageLine: (said || '').trim(),
    area: (fields.address || fields.adress || fields.addresse || '').replace(/\s{2,}/g, ' ').trim(),
    role: (fields.services || fields.practice || fields.legalpracticeareas || '').slice(0, 160),
    phone: (fields.telephone || fields.tel || fields.phone || fields.telefon || '').split(/\s{2,}/)[0].trim(),
    email: ((fields.email || fields.email || '') + ' ' + prose).match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0] || '',
    url: (fields.website || fields.web || '').match(/(?:https?:\/\/|www\.)\S+/)?.[0] || '',
  };
}).filter((r) => r.name && r.name.length > 2);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(count + ' column(s)' + (edges.length ? ', split at ' + edges.join(', ') : ''));
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 34).padEnd(36) + (r.languages.join(',') || '-').padEnd(16) + r.area.slice(0, 52)));
  console.log('\n' + rows.length + ' rows, ' + rows.filter((r) => r.languages.length).length + ' with a language of their own, '
    + rows.filter((r) => r.area).length + ' with an address');
}

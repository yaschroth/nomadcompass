/**
 * Reads a list whose entries are labelled fields rather than columns or blocks.
 *
 * The US missions publish their attorney and doctor lists this way: a name in capitals, then
 * "Specializes in:", "Speaks:", "Address:", "Tel. #:", "E-mail:". The layout around those labels is
 * chaotic, two columns that do not line up and entries that run across page breaks, and both a
 * column reader and a block reader made nonsense of it: names came out as "Address: Elaion 25,
 * Ilion" and "Fax: 28210 23081 PAPADOSIFOU, CHRI".
 *
 * The labels are the structure. An entry is a run of them, the name is the last line before the run
 * that reads like a name rather than a label, and a line that is not a label continues the label
 * above it. That holds however the columns fall.
 *
 * "Speaks:" is why this is worth doing: it is a per-entry language claim, and 164 of them are
 * waiting in the lists for Athens, Warsaw and Madrid.
 *
 * Usage: node scripts/parse_labelled_blocks.cjs <file.pdf> [--columns] [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_labelled_blocks.cjs <file.pdf> [--columns] [--json]'); process.exit(2); }
const COLUMNS = process.argv.includes('--columns');

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'labelled-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  // -raw keeps the content-stream order, which is what holds an entry together on a page whose
  // columns do not line up: -layout interleaved two columns and made nonsense of every name.
  const mode = process.argv.includes('--raw') ? '-raw' : '-layout';
  try { execFileSync('pdftotext', [mode, '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) {
    console.error('pdftotext could not read this file'); process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

let lines = text.split(/\r?\n/).map((l) => l.replace(/\f/g, '').trimEnd());
if (COLUMNS) {
  const left = [];
  const right = [];
  lines.forEach((l) => {
    if (l.trim().length < 3) { left.push(''); right.push(''); return; }
    const gaps = [...l.matchAll(/ {4,}/g)].filter((m) => m.index > 15);
    const widest = gaps.sort((a, b) => b[0].length - a[0].length)[0];
    if (!widest) { left.push(l); right.push(''); return; }
    left.push(l.slice(0, widest.index).trimEnd());
    right.push(l.slice(widest.index + widest[0].length).trimEnd());
  });
  lines = left.concat([''], right);
}

const LABEL = /^\s*(Speaks|Languages?|Address|Office address|Postal address|Tel\.?\s*#?|Telephone|Phone|Fax|Mobile|Cell(?:phone)?|E-?mail|Website|Webpage|Web|Specializ\w+ in|Areas? of practice|Practice areas)\s*[:#]\s*(.*)$/i;
const norm = (l) => l.toLowerCase().replace(/[^a-z]/g, '');
const KEY = {
  speaks: 'languages', language: 'languages', languages: 'languages',
  address: 'address', officeaddress: 'address', postaladdress: 'postal',
  tel: 'phone', telephone: 'phone', phone: 'phone', fax: 'fax',
  mobile: 'mobile', cell: 'mobile', cellphone: 'mobile',
  email: 'email', website: 'url', webpage: 'url', web: 'url',
};
const fieldOf = (label) => {
  const k = norm(label);
  if (KEY[k]) return KEY[k];
  if (/special|practice/.test(k)) return 'practice';
  return '';
};

// A name is what a person or a firm is called: no label, no digits at the start, not a sentence.
const looksLikeName = (l) => {
  const t = l.trim();
  if (!t || t.length < 5 || t.length > 70) return false;
  if (LABEL.test(t)) return false;
  if (/^\d|@|www\.|http/.test(t)) return false;
  if (/\b(the|and|of|for|with|from|please|this|you|your|are|is|will|may)\b/i.test(t) && t.split(/\s+/).length > 5) return false;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 4) return false;
  // A practice list wraps onto lines like "auto/accidents." and "relations, immigration," which are
  // short enough to look like names. A name starts with a capital and does not trail a comma.
  if (!/^[A-ZÀ-Þ]/.test(t) || /,$/.test(t)) return false;
  // Either shouted, which is how these lists write a name, or Title Case with few words.
  const upper = t.replace(/[^A-ZÀ-Þ]/g, '').length;
  return upper / letters.length > 0.6 || t.split(/\s+/).length <= 5;
};

const entries = [];
let current = null;
let lastName = '';
let lastField = '';
let awaitingName = true;
let plainSinceName = 0;
for (const raw of lines) {
  const l = raw.trim();
  if (!l) { lastField = ''; continue; }
  const m = l.match(LABEL);
  if (m) {
    const field = fieldOf(m[1]);
    if (!field) { lastField = ''; continue; }
    // A label after a completed entry starts the next one.
    if (!current || (current.fields.languages && field === 'languages')) {
      if (current && Object.keys(current.fields).length) entries.push(current);
      current = { name: lastName, fields: {} };
    }
    if (!current.name && lastName) current.name = lastName;
    current.fields[field] = (current.fields[field] ? current.fields[field] + ' ' : '') + m[2].trim();
    lastField = field;
    continue;
  }
  // While an entry is still collecting its labels, a plain line continues the last one. Only once
  // the entry has an address or a phone are its labels done, and the next plain line is the name of
  // the entry after it. In content-stream order that is exactly how these lists run.
  const done = current && (current.fields.address || current.fields.phone || current.fields.postal);
  if (current && lastField && !done) {
    current.fields[lastField] += ' ' + l;
    continue;
  }
  // The name is the FIRST line of an entry, and these lists shout it. What follows it, before the
  // labels start, is where the person studied: reading the last plain line instead of the first
  // gave every entry a name like "LL.M, University of Bonn, Germany".
  if (current && Object.keys(current.fields).length) { entries.push(current); current = null; awaitingName = true; }
  if (awaitingName && looksLikeName(l)) {
    const letters = l.replace(/[^A-Za-zÀ-ÿ]/g, '');
    const shouted = l.replace(/[^A-ZÀ-Þ]/g, '').length / (letters.length || 1) > 0.6;
    if (shouted || plainSinceName >= 3) { lastName = l.replace(/[,;:]\s*$/, ''); awaitingName = false; plainSinceName = 0; }
    else plainSinceName += 1;
    lastField = '';
  } else if (current && lastField) {
    current.fields[lastField] += ' ' + l;
  } else {
    plainSinceName += 1;
  }
}
if (current && Object.keys(current.fields).length) entries.push(current);

const rows = entries.filter((e) => e.name).map((e) => ({
  name: e.name.replace(/\s+/g, ' ').trim(),
  languagesText: (e.fields.languages || '').replace(/\s+/g, ' ').trim(),
  area: (e.fields.address || e.fields.postal || '').replace(/\s+/g, ' ').trim().slice(0, 140),
  postcode: ((e.fields.address || '') + ' ' + (e.fields.postal || '')).match(/\b(\d{3}\s?\d{2}|\d{5}(?:-\d{3})?)\b/) ? RegExp.$1 : '',
  practice: (e.fields.practice || '').replace(/\s+/g, ' ').trim().slice(0, 200),
  email: (e.fields.email || '').split(/\s+/)[0] || '',
  url: (e.fields.url || '').split(/\s+/)[0] || '',
  phone: (e.fields.phone || '').split(/\s{2,}/)[0] || '',
}));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languagesText).length + ' stating what they speak, '
    + rows.filter((r) => r.area).length + ' with an address');
  rows.slice(0, 8).forEach((r) => console.log('  ' + r.name.slice(0, 36).padEnd(38)
    + (r.languagesText || '-').slice(0, 26).padEnd(28) + r.area.slice(0, 40)));
}

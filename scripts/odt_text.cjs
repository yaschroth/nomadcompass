/**
 * Extracts readable text from an ODT file, with no dependencies.
 *
 * Some of the embassy lists behind the services directory are published as OpenDocument rather
 * than HTML: Morocco's is an .odt last updated in 2020. An ODT is a ZIP archive whose content.xml
 * holds the document body, and Node ships inflate but no unzip, so this walks the archive's local
 * file headers itself and inflates the one member it wants.
 *
 * Two details the format makes you handle:
 *   - When the general purpose bit 3 flag is set, the compressed size in the local header is zero
 *     and the real size lives in a descriptor after the data. Inflating to the end of the buffer
 *     with Z_SYNC_FLUSH gets the member out anyway.
 *   - Cells are separated by <text:tab/>, not by whitespace, so those become " | " before the tags
 *     are stripped. Without that, a name and its address run together into one unreadable line.
 *
 * Companion to pdf_text.cjs, which does the same job for the lists published as PDFs.
 *
 * Usage: node scripts/odt_text.cjs <in.odt> <out.txt>
 */
const fs = require('fs');
const zlib = require('zlib');

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node scripts/odt_text.cjs <in.odt> <out.txt>'); process.exit(1); }

const buf = fs.readFileSync(IN);
let off = 0;
let found = null;
while (off < buf.length - 4) {
  if (buf.readUInt32LE(off) !== 0x04034b50) { off++; continue; }
  const flags = buf.readUInt16LE(off + 6);
  const method = buf.readUInt16LE(off + 8);
  const csize = buf.readUInt32LE(off + 18);
  const nlen = buf.readUInt16LE(off + 26);
  const elen = buf.readUInt16LE(off + 28);
  const name = buf.slice(off + 30, off + 30 + nlen).toString('latin1');
  const data = off + 30 + nlen + elen;
  if (name === 'content.xml') {
    if (!csize || (flags & 8)) {
      // Size lives in a trailing descriptor: inflate to the end and stop at the stream's own end.
      found = zlib.inflateRawSync(buf.slice(data), { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    } else {
      found = method === 0 ? buf.slice(data, data + csize) : zlib.inflateRawSync(buf.slice(data, data + csize));
    }
    break;
  }
  off = data + (csize || 1);
}
if (!found) { console.error('no content.xml in ' + IN + ': is it really an ODT?'); process.exit(1); }

let x = found.toString('utf8');
x = x.replace(/<text:tab\/>/g, ' | ').replace(/<text:s\/>/g, ' ');
x = x.replace(/<\/text:p>/g, '\n').replace(/<\/table:table-row>/g, '\n');
x = x.replace(/<[^>]+>/g, '');
x = x.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&apos;/g, "'").replace(/&quot;/g, '"');
x = x.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');

// The same refusal pdf_text.cjs makes: output that is mostly not letters means the decode failed,
// and a garbled list is worse than no list.
const letters = (x.match(/[A-Za-z]/g) || []).length;
if (x.length && letters / x.length < 0.45) {
  console.error('decoded ' + x.length + ' chars but only ' + Math.round((letters / x.length) * 100) + '% are letters; refusing to write it');
  process.exit(1);
}

fs.writeFileSync(OUT, x + '\n');
console.log('wrote ' + OUT + ': ' + x.split('\n').length + ' lines, ' + x.length + ' chars');

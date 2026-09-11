/**
 * Turns a guide_reframe.cjs replacement file into the extension shape the guide gates read.
 *
 * check_guide_phrasing.cjs and check_guide_cross_overlap.cjs take {"slug.field": "text"} and
 * compare that text against the whole corpus. A reframe file is {"slug.field": {old, now}} or an
 * array of those, so the gates cannot read it directly, and for several batches they were simply
 * not run on rewritten sentences: the phrasing gate had only ever seen extensions. A rewrite is
 * exactly as likely to land on another city's sentence as a new one is, and more likely to land
 * on one written earlier in the same session.
 *
 * Run this BEFORE applying, like every other guide check, because both overlap gates read the
 * current guide-content.json and will happily compare an applied sentence against itself.
 *
 *   node scripts/guide_reframe_ext.cjs batch.json > batch.ext.json
 */
'use strict';
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/guide_reframe_ext.cjs <reframe.json>'); process.exit(2); }

const repl = JSON.parse(fs.readFileSync(file, 'utf8'));
const out = {};
for (const [key, spec] of Object.entries(repl)) {
  const pairs = Array.isArray(spec) ? spec : [spec];
  // A leading space matches how extensions are written, so the gates that anchor on ". " or on
  // the start of a sentence see the first sentence of the batch like any other.
  out[key] = ' ' + pairs.map((p) => String(p.now || '').trim()).join(' ');
}
process.stdout.write(JSON.stringify(out, null, 2) + '\n');

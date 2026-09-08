/**
 * Gate: no sentence that survives its own deletion.
 *
 * The owner's instruction (2026-09-08), after finding prose that cited the site's own score and
 * called it correct: "das sind leere worthuellen, die nichts aussagen. sowas niemals schreiben."
 * Empty word-shells. Never write one.
 *
 * Four families, each of which was actually present rather than theoretical:
 *
 *   score      Prose pointing at a number the reader can already see and asserting it is right.
 *              "The cost score of 3 is accurate." Says nothing at all.
 *   meta       The site talking about its own production. "the weakest score in this batch",
 *              "on this site", "in this dataset". A reader does not know what a batch is, and
 *              should not have to. This one leaks working vocabulary onto a public page.
 *   hedge      A claim of significance with no claim behind it. "This is worth knowing." "It is
 *              worth noting." If what follows carries the information, the frame is padding.
 *   tautology  Restating the subject as its own predicate. "The wet season is wet."
 *
 * Deliberately NOT flagged: a sentence telling a reader not to trust a rating, which is a real
 * instruction; the methodology page, which exists to discuss how scores are built; and score
 * words inside markup, attributes or scripts, which are structure rather than prose.
 *
 * Usage: node scripts/check_empty_phrases.cjs [--all]
 * Exit 1 if any page or data file carries one.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill', 'assets']);

// The methodology page's whole subject is how the scores are made, so score talk there is the
// content rather than filler. Same for the pages that exist to explain the ranking.
const EXEMPT_PAGES = /(?:^|[\\/])(?:methodology|about|privacy|terms|disclaimer|cookies)\.html$/i;

// The first version of this gate matched any sentence containing "score" and reported 13,886
// hits, which is not a gate, it is noise. Two reasons, both instructive. "Nomad Score" is the
// site's own product name, so pages legitimately explain what is and is not generated from it.
// And stripped navigation has no sentence-ending punctuation, so one match swallowed the entire
// menu as a single "sentence". Both are fixed by matching the offence rather than the topic.
//
// The offence is narrow: asserting that a number is correct. Not mentioning a score, not scoping
// a claim to the dataset ("the cheapest city on this site" tells a reader exactly how far the
// superlative reaches, which is honest), but pointing at a figure and saying it is right.
const RULES = [
  // Only the verdict form. A wider pattern flagged 107 sentences on the ranking pages that
  // translate a number into a consequence, which is those pages' entire job: "Community sits at
  // just 3, so a newcomer should expect a slow, quiet start" tells a reader what the 3 means.
  // What is banned is asserting the number is correct, or echoing a claim already made in the
  // same sentence: "Bergen is famously rainy, which the climate score of 4 reflects".
  { id: 'score',
    re: new RegExp(
      '(?:,?\\s*(?:and|which)\\s+)?(?:the\\s+)?[a-z]+\\s+scores?\\s+of\\s+\\d+\\s+' +
        '(?:is\\s+(?:fair|honest|accurate|right|correct|decent|justified|earned|deserved|about right)[^.]{0,45}' +
        '|backs up[^.]{0,45}|reflects that[^.]{0,35})' +
      '|,?\\s*which\\s+the\\s+[a-z]+\\s+scores?\\s+of\\s+\\d+\\s+(?:reflects|records|confirms|captures)' +
      '|(?:The|Its|Our)\\s+\\d+\\s+(?:is|are)\\s+(?:(?:a|an|genuinely|straightforwardly|entirely)\\s+)*' +
        '(?:fair|honest|earned|deserved|straightforward|accurate|reading|middle|average)',
      'gi'),
    ok: /worth more than|rather than rely|instead of any|do not rely|not a substitute/i },

  { id: 'meta',
    // Production vocabulary that means nothing to a reader. "on this site" is deliberately absent:
    // scoping a superlative to the dataset is honest rather than empty.
    re: /[^.!?]{0,160}(?:in this batch|this batch of|in this dataset|in this file|the other cities here|as (?:I|we) wrote|in the last (?:batch|pass))[^.!?]{0,160}[.!?]/gi,
    ok: null },

  { id: 'hedge',
    // A frame promising significance with nothing delivered after it.
    re: /[^.!?]{0,120}(?:is worth knowing|are worth knowing|is worth noting|it is worth mentioning|worth bearing in mind)\\s*[.!?]/gi.source
      ? new RegExp('[^.!?]{0,120}(?:is worth knowing|are worth knowing|is worth noting|it is worth mentioning|worth bearing in mind)\\s*[.!?]'.replace(/\\/g, String.fromCharCode(92)), 'gi')
      : null,
    ok: null },
];

// A full stop between two digits is a decimal, not a sentence end. Without this the matcher
// cut "Match score of 9.6 leads the list" at the point and reported a fragment as broken prose.
const DECIMAL = /(\d)\.(\d)/g;

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ');

const protectDecimals = (t) => String(t).replace(DECIMAL, '$1․$2');

const hits = [];

function scan(label, text, exempt) {
  for (const rule of RULES) {
    if (exempt && rule.id === 'score') continue;
    for (const m of String(text).match(rule.re) || []) {
      const t = m.trim();
      if (t.length < 12) continue;
      if (rule.ok && rule.ok.test(t)) continue;
      hits.push({ label, rule: rule.id, text: t.slice(0, 120) });
    }
  }
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

const pages = walk(ROOT, []);
for (const fp of pages) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  scan(rel, protectDecimals(strip(fs.readFileSync(fp, 'utf8'))), EXEMPT_PAGES.test(rel));
}

// The data files the generators write prose from, so a fix in HTML alone would be undone.
let dataFiles = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'data'))) {
  if (!f.endsWith('.json')) continue;
  let obj;
  try { obj = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { continue; }
  dataFiles++;
  const visit = (node, trail) => {
    if (typeof node === 'string') { if (node.length > 40) scan('data/' + f + ' ' + trail, protectDecimals(node), false); return; }
    if (Array.isArray(node)) return node.forEach((v, i) => visit(v, trail + '[' + i + ']'));
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) visit(v, trail ? trail + '.' + k : k);
    }
  };
  visit(obj, '');
}

console.log('EMPTY PHRASE GATE  (no sentence that survives its own deletion)\n');
console.log('  ' + pages.length + ' pages, ' + dataFiles + ' data files scanned\n');

if (!hits.length) {
  console.log('  clean: nothing asserts a number, cites the production process, or frames an absent fact.');
  process.exit(0);
}

const byRule = new Map();
for (const h of hits) {
  if (!byRule.has(h.rule)) byRule.set(h.rule, []);
  byRule.get(h.rule).push(h);
}
console.log('  FAILING: ' + hits.length + ' empty phrase(s)\n');
for (const [rule, list] of byRule) {
  console.log('  [' + rule + '] ' + list.length + ':');
  for (const h of (SHOW_ALL ? list : list.slice(0, 8))) console.log('    ' + h.label + '\n      "' + h.text + '"');
  if (!SHOW_ALL && list.length > 8) console.log('    ... and ' + (list.length - 8) + ' more (--all)');
  console.log('');
}
process.exit(1);

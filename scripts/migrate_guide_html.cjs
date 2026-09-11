require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Lifts the guide prose of the 650 HTML-only city pages into data/guide-content.json, so that the
 * deepening loop and its four gates can reach them at all.
 *
 * WHY THIS EXISTS. 350 cities keep their seven guide sections in guide-content.json. The other 650
 * had theirs written straight into the HTML by an older generator and were never migrated, so
 * guide_worklist, guide_extend, check_guide_overlap, check_guide_cross_overlap,
 * check_guide_phrasing and check_guide_self_repeat have all been blind to two thirds of the site.
 * Measured on 2026-09-11, 625 of those 650 sit under the 1,155-word floor, median 877, against a
 * figure of 1,331 that had been recorded for them and was wrong: a naive HTML strip counts the
 * seven headings, the cost box and the visa and transport notes, which is about 190 words a page.
 *
 * WHAT IT TAKES AND WHAT IT LEAVES. Only the first run of plain <p> paragraphs under each heading,
 * which is the same span apply_city_guide_sections.cjs rewrites on a refresh. Everything another
 * sweep owns is masked off by its comment markers first, exactly as the applier does, so the cost
 * box and the cost-basis note cannot be swallowed. The headings themselves are left alone: they
 * carry the ids apply_city_toc.cjs points its jump links at.
 *
 * MULTIPLE PARAGRAPHS SURVIVE. Several of these pages split a section into two or three <p>. The
 * applier renders a section by splitting on blank lines, so paragraphs are joined here with a blank
 * line and come back out as the same paragraphs. That round trip is what --verify checks.
 *
 * TWO HEADING GENERATIONS. 238 of the 650 use the headings this script's sibling writes; 410 use
 * the older bare set, plus "Visas and Staying Long-Term" and "Who X Is Best For". Both are matched,
 * from the shared ALIASES table, so neither generation is silently half-migrated.
 *
 * Usage:
 *   node scripts/migrate_guide_html.cjs            report only, writes nothing
 *   node scripts/migrate_guide_html.cjs --write     merge into data/guide-content.json
 *   node scripts/migrate_guide_html.cjs --verify    re-render from JSON and diff against the page
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');
const GUIDE = path.join(ROOT, 'data', 'guide-content.json');
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const NAME = new Map(CITIES.map((c) => [c.id, c.name]));

const ORDER = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];
const ALIASES = {
  costOfLiving: [(n) => `Cost of Living in ${n}`],
  whereToWork: [(n) => `Where to Work in ${n}`, () => 'Where to Work'],
  gettingAround: [(n) => `Getting Around ${n}`, () => 'Getting Around'],
  visas: [(n) => `Visas for ${n}`, () => 'Visas and Staying Long-Term'],
  bestTime: [(n) => `Best Time to Visit ${n}`, () => 'Best Time to Visit'],
  prosCons: [(n) => `Pros and Cons of ${n}`, () => 'Pros and Cons'],
  whoFor: [(n) => `Who ${n} Is For`, (n) => `Who ${n} Is Best For`],
};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rxEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The inverse of esc(), plus the entities the older generator emitted for accented names.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è',
  iacute: 'í', oacute: 'ó', aacute: 'á', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä',
  ccedil: 'ç', atilde: 'ã', otilde: 'õ', ecirc: 'ê', ocirc: 'ô', acirc: 'â', agrave: 'à', ugrave: 'ù',
  szlig: 'ß', aring: 'å', oslash: 'ø', aelig: 'æ', ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'" };
const unesc = (s) => s
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENT ? ENT[n] : m));

const OWNED = [
  ['<!-- cost-basis -->', '<!-- /cost-basis -->'],
  ['<!-- cost-start -->', '<!-- cost-end -->'],
];
function mask(str) {
  let out = str;
  for (const [open, close] of OWNED) {
    for (let i = 0; ; ) {
      const a = out.indexOf(open, i);
      if (a === -1) break;
      const b = out.indexOf(close, a + open.length);
      if (b === -1) break;
      const end = b + close.length;
      out = out.slice(0, a) + ' '.repeat(end - a) + out.slice(end);
      i = end;
    }
  }
  return out;
}

/** Returns {sections, missing} for one page, or null if it has no guide block. */
function extract(slug) {
  const file = path.join(DIR, slug + '.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const gi = html.indexOf('id="guide"');
  if (gi < 0) return null;
  const name = NAME.get(slug) || slug;

  const sections = {};
  const missing = [];   // blocking: the heading itself could not be located
  const notProse = [];  // not blocking: that section is not prose on this page, so we do not own it
  const markup = [];    // blocking: the paragraphs carry inline tags this data model cannot hold
  const split = [];     // blocking: the prose is broken across several runs by a list or a block
  for (const key of ORDER) {
    let hm = null;
    for (const gen of ALIASES[key]) {
      hm = html.match(new RegExp('<h2[^>]*>\\s*' + rxEsc(esc(gen(name))) + '\\s*</h2>', 'i'));
      if (hm) break;
    }
    if (!hm) { missing.push(key + '(no heading)'); continue; }

    const start = hm.index + hm[0].length;
    const rest = html.slice(start);
    const endRel = rest.search(/<h2[\s>]/i);
    const segment = endRel === -1 ? rest : rest.slice(0, endRel);

    // Same run rule as the applier: the first block of consecutive plain <p>, found in the masked
    // copy so it can never begin inside a region another sweep owns.
    const runRe = /(?:[ \t]*<p>(?:(?!<\/p>)[\s\S])*<\/p>\s*)+/;
    const rm = mask(segment).match(runRe);
    // No plain <p> run under the heading means the section is not prose on this page. 373 of these
    // pages render Pros and Cons as two <ul> lists. Storing prose for it in the JSON would be
    // WORSE than storing nothing: apply_city_guide_sections cannot find a <p> run to replace
    // either, so the text would sit in the data file describing a page it never reaches. Record it
    // as not ours and migrate the six sections that are.
    if (!rm) { notProse.push(key); continue; }

    const run = segment.slice(rm.index, rm.index + rm[0].length);
    const inner = [...run.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);

    // REFUSE a section whose prose is SPLIT by a list or another block, because the applier only
    // ever rewrites the first run of paragraphs. Storing that first run alone would leave the JSON
    // describing a fraction of the section: Cusco's whereToWork is 31 words in the first run and
    // 273 on the page. Nothing is lost from the page, but guide_worklist would then read those
    // cities as far thinner than they are and send a whole deepening batch at pages that are
    // already fine. 79 sections across 37 cities look like this. Storing the whole thing is not
    // the answer either: the applier would write it all into the first run and leave the later
    // paragraphs below the list, printing them twice.
    const allP = [...mask(segment).matchAll(/<p>([\s\S]*?)<\/p>/g)];
    if (allP.length > inner.length) { split.push(key); continue; }

    // REFUSE anything carrying inline markup rather than quietly flattening it. guide-content.json
    // holds plain text and apply_city_guide_sections escapes it, so a <strong> lifted in here comes
    // back out as visible &lt;strong&gt; if kept, or disappears from the page if stripped. 371 of
    // these pages use inline tags, 6,388 <strong> and 16 links between them, mostly bolded labels
    // like "Rent:". Losing those is a visible change to somebody's page, and this script is not the
    // place to decide that silently. --verify is what proved it: flattening produced 1,235
    // paragraphs the applier would have rewritten.
    if (inner.some((t) => /<\s*\/?\s*[a-z]/i.test(t))) { markup.push(key); continue; }

    const paras = inner
      .map((t) => unesc(t.replace(/\s+/g, ' ').trim()))
      .filter(Boolean);
    if (!paras.length) { missing.push(key + '(empty)'); continue; }
    sections[key] = paras.join('\n\n');
  }
  return { sections, missing, notProse, markup, split };
}

const guide = JSON.parse(fs.readFileSync(GUIDE, 'utf8'));
const already = new Set(Object.keys(guide).filter((k) => !k.startsWith('_')));
const slugs = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))
  .filter((s) => !already.has(s)).sort();

const ok = [];
const hasMarkup = [];
const splitProse = [];
const listStyle = [];
const partial = [];
const skipped = [];
for (const slug of slugs) {
  const r = extract(slug);
  if (!r) { skipped.push(slug + '(no guide block)'); continue; }
  if (r.missing.length) { partial.push(slug + ' [' + r.missing.join(',') + ']'); continue; }
  if (r.markup.length) { hasMarkup.push(slug + ' [' + r.markup.join(',') + ']'); continue; }
  if (r.split.length) { splitProse.push(slug + ' [' + r.split.join(',') + ']'); continue; }
  if (r.notProse.length) listStyle.push(slug + ' [' + r.notProse.join(',') + ']');
  ok.push([slug, r.sections]);
}

const w = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const totals = ok.map(([slug, s]) => [slug, ORDER.reduce((a, k) => a + (s[k] ? w(s[k]) : 0), 0)]).sort((a, b) => a[1] - b[1]);

console.log('\nGUIDE HTML MIGRATION\n');
console.log('  candidates (not already in JSON) :', slugs.length);
console.log('  migrated                         :', ok.length);
console.log('    of those, six sections only    :', listStyle.length, '(Pros and Cons is a list, not prose)');
console.log('  NOT migrated, inline markup      :', hasMarkup.length);
console.log('  NOT migrated, prose split by list:', splitProse.length);
console.log('  NOT migrated, heading not found  :', partial.length);
console.log('  no guide block                   :', skipped.length);
if (totals.length) {
  console.log('  word totals: min ' + totals[0][1] + '  median ' + totals[Math.floor(totals.length / 2)][1]
    + '  max ' + totals[totals.length - 1][1]);
  console.log('  under the 1155 floor             :', totals.filter((t) => t[1] < 1155).length);
  console.log('  words to the floor               : ~' + totals.filter((t) => t[1] < 1155)
    .reduce((a, t) => a + (1155 - t[1]), 0).toLocaleString());
}
if (partial.length) {
  const tally = {};
  for (const p of partial) {
    const reason = p.slice(p.indexOf('[') + 1, -1);
    tally[reason] = (tally[reason] || 0) + 1;
  }
  console.log('\n  partial pages by reason (left alone so nothing is half-migrated):');
  Object.entries(tally).sort((a, b) => b[1] - a[1])
    .forEach(([r, n]) => console.log('    ' + String(n).padStart(4) + '  ' + r));
}
if (skipped.length) console.log('\n  no guide block: ' + skipped.join(' '));

if (process.argv.includes('--verify')) {
  // Round trip: render each migrated section the way the applier would and look for it on the page.
  // Two different failures hide behind one word here, so they are counted apart.
  //
  //   TEXT     the rendered paragraph is not on the page and its decoded text is not there either.
  //            The applier would change what a reader sees. This must be zero.
  //   ENCODING the decoded text matches but the bytes do not, because the page spells something as
  //            a raw & or a numeric entity and the applier would write the canonical form. A
  //            browser renders both identically, so this is a normalisation, not a content change.
  //
  // Conflating them is how a migration ships a content change calling itself a formatting one.
  const decode = (x) => unesc(x).replace(/\s+/g, ' ').trim();
  let text = 0, encoding = 0;
  const shown = [];
  for (const [slug, s] of ok) {
    const html = fs.readFileSync(path.join(DIR, slug + '.html'), 'utf8');
    const pagePara = new Set([...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => decode(m[1])));
    for (const key of ORDER) {
      if (!s[key]) continue;
      for (const p of s[key].split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)) {
        if (html.includes('<p>' + esc(p) + '</p>')) continue;
        if (pagePara.has(decode(p))) { encoding++; continue; }
        text++;
        if (shown.length < 8) shown.push(slug + '.' + key + ': ' + p.slice(0, 90));
      }
    }
  }
  console.log('\n  round trip:');
  console.log('    paragraphs whose TEXT would change    :', text, text ? '<- must be zero' : '');
  console.log('    paragraphs differing only in ENCODING :', encoding, '(raw & or numeric entity, renders the same)');
  shown.forEach((x) => console.log('      ' + x));
  console.log('');
  process.exit(text ? 1 : 0);
}

if (process.argv.includes('--prune')) {
  // Remove cities that an EARLIER, laxer run of this script merged in but that the current rules
  // reject. Needed once, after the split-prose rule was added: 37 cities had already been migrated
  // holding only the first run of a section whose prose a list breaks in two. Their pages are
  // untouched and correct, so dropping them from the JSON simply returns them to unreachable,
  // which is the honest state until the data model can represent them.
  const dropped = [];
  for (const slug of Object.keys(guide)) {
    if (slug.startsWith('_')) continue;
    const r = extract(slug);
    if (!r) continue;
    if (r.missing.length || r.markup.length || r.split.length) { delete guide[slug]; dropped.push(slug); }
  }
  if (!dropped.length) { console.log('\n  nothing to prune\n'); process.exit(0); }
  const eol = fs.readFileSync(GUIDE, 'utf8').includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(GUIDE, JSON.stringify(guide, null, 2).replace(/\n/g, eol) + eol);
  console.log('\n  pruned ' + dropped.length + ' cities the current rules reject:');
  console.log('    ' + dropped.join(' '));
  console.log('  now ' + Object.keys(guide).filter((k) => !k.startsWith('_')).length + ' cities\n');
  process.exit(0);
}

if (process.argv.includes('--write')) {
  for (const [slug, s] of ok) guide[slug] = s;
  const eol = fs.readFileSync(GUIDE, 'utf8').includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(GUIDE, JSON.stringify(guide, null, 2).replace(/\n/g, eol) + eol);
  console.log('\n  merged ' + ok.length + ' cities into data/guide-content.json'
    + ' (now ' + Object.keys(guide).filter((k) => !k.startsWith('_')).length + ' cities)\n');
} else {
  console.log('\n  dry run. --write to merge, --verify to round-trip check.\n');
}

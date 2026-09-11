require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Injects the long-form guide sections (Cost of Living, Where to Work, Getting Around, Visas, Best
 * Time to Visit, Pros and Cons, Who It's For) that the base generator no longer emits, bringing new
 * expansion cities up to the ~3000-word depth of the established pages. Content is genuine per-city
 * prose from data/guide-content.json ({slug:{costOfLiving,whereToWork,gettingAround,visas,bestTime,
 * prosCons,whoFor}}); headings are left plain so apply_city_toc adds the ids + jump links afterwards.
 * Inserted as <section class="city-guide" id="guide"> before the "Where to Stay" block. Idempotent
 * (skips pages already carrying id="guide"), CRLF-safe. Usage: node scripts/apply_city_guide_sections.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');
const CONTENT = require(path.join(ROOT, 'data', 'guide-content.json'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const NAME = new Map(CITIES.map((c) => [c.id, c.name]));

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// paragraphs: split content on blank lines into <p> blocks (most are one paragraph)
const paras = (t) => String(t).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `        <p>${esc(p)}</p>`).join('\n');

const ANCHOR = '<!-- Where to Stay -->';
const ORDER = [
  ['costOfLiving', (n) => `Cost of Living in ${n}`],
  ['whereToWork', (n) => `Where to Work in ${n}`],
  ['gettingAround', (n) => `Getting Around ${n}`],
  ['visas', (n) => `Visas for ${n}`],
  ['bestTime', (n) => `Best Time to Visit ${n}`],
  ['prosCons', (n) => `Pros and Cons of ${n}`],
  ['whoFor', (n) => `Who ${n} Is For`],
];

/**
 * The headings above are what this script WRITES. They are not the only headings on the site.
 *
 * An older generator produced a different set, and 410 city pages still carry it: bare "Where to
 * Work", "Getting Around", "Pros and Cons", plus "Visas and Staying Long-Term" and "Who X Is Best
 * For". Only "Cost of Living in X" is common to both.
 *
 * That matters because refresh() finds a section by matching its heading text and, failing to find
 * it, does `continue`. On those 410 pages a refresh would therefore have silently updated the cost
 * section and left the other six untouched, reporting success. This is the same shape as the
 * insert-never-refresh trap that froze a wrong byline on 1000 pages: the run reports what it did,
 * not what it could not find.
 *
 * Matching both generations is the fix rather than rewriting the headings, because the headings
 * carry the ids that apply_city_toc.cjs points its jump links at, and that sweep skips any page
 * that already has a TOC, so it would not repair what a rename broke.
 *
 * ORDER stays the canonical form for injection. ALIASES is consulted only when locating an
 * existing section. The trailing \s*</h2> anchor is what keeps "Getting Around" from matching
 * "Getting Around Jodhpur" and taking the wrong section.
 */
const ALIASES = {
  costOfLiving: [(n) => `Cost of Living in ${n}`],
  whereToWork: [(n) => `Where to Work in ${n}`, () => 'Where to Work'],
  gettingAround: [(n) => `Getting Around ${n}`, () => 'Getting Around'],
  visas: [(n) => `Visas for ${n}`, () => 'Visas and Staying Long-Term'],
  bestTime: [(n) => `Best Time to Visit ${n}`, () => 'Best Time to Visit'],
  prosCons: [(n) => `Pros and Cons of ${n}`, () => 'Pros and Cons'],
  whoFor: [(n) => `Who ${n} Is For`, (n) => `Who ${n} Is Best For`],
};

/**
 * Refresh the prose of a guide section that is already on the page.
 *
 * Skipping a page that already carries id="guide" made this sweep unable to correct its own
 * output: edit data/guide-content.json for a city that has already been injected and nothing
 * happens, which is the same insert-never-refresh trap that froze a stale byline date and a wrong
 * photographer on 1000 pages.
 *
 * It replaces ONLY the paragraphs under each heading, never the heading itself. The headings are
 * emitted plain here and apply_city_toc.cjs adds the ids and the jump links afterwards, so
 * rewriting the whole block would strip those ids and leave the in-page nav pointing at anchors
 * that no longer exist. apply_city_toc skips a page that already has a TOC, so it would not repair
 * them either.
 */
/**
 * Blanks the regions other sweeps own, keeping the string the same length so an index found in the
 * mask still points at the right character in the original.
 *
 * Matching is on the paired comment markers alone. What a sweep writes between its own markers is
 * that sweep's business, and this one must not care whether the markup inside happens to carry a
 * class: assuming it did is what cost 350 pages their cost-basis note.
 */
const OWNED = [
  ['<!-- cost-basis -->', '<!-- /cost-basis -->'],  // apply_cost_basis.cjs
  ['<!-- cost-start -->', '<!-- cost-end -->'],     // apply_city_costs.cjs
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

function refresh(html, name, c, eol) {
  let out = html, changed = 0;
  const notFound = [];
  for (const [key, heading] of ORDER) {
    // A section the JSON does not carry is not an error on a refresh. 373 of the migrated pages
    // render Pros and Cons as two <ul> lists rather than prose, so there is nothing for this
    // script to own there and no key is stored. Writing paras(undefined) would put the literal
    // word "undefined" on the page, which is why this guard comes before anything else.
    if (!c[key] || !String(c[key]).trim()) continue;
    // Replace ONLY the first run of PLAIN <p> paragraphs inside the section, and leave everything
    // else where it is. Other sweeps put their own markup in these sections and none of it may be
    // touched: apply_cost_basis writes a comment, a <style> block and a note between the Cost of
    // Living heading and the prose; the YMYL "not legal advice" note closes Visas; the affiliate
    // transport aside closes Getting Around.
    //
    // Two earlier versions got this wrong in opposite directions. The first required the run to
    // start immediately after the </h2>, so it silently did nothing on any page where the
    // cost-basis block sits in between, which is all 670 estimated ones. The second located the
    // section first and took the first plain <p> inside it, on the reasoning that every block a
    // sweep owns carries a class. The cost-basis note does not: apply_cost_basis puts the class on
    // the wrapping <div> and the paragraph inside is a bare <p>. So the run began on the note, and
    // 350 pages had "Where this figure comes from" overwritten with the cost prose, losing the one
    // sentence that tells a reader the figure is an estimate rather than a measurement.
    //
    // Neither rule is enough alone. The regions a sweep owns are masked out by their comment
    // markers first, so no run can begin inside one, and the run is then found anywhere in what
    // remains. Masking preserves length, so an index into the mask is valid in the real segment.
    let hm = null;
    for (const gen of (ALIASES[key] || [heading])) {
      const t = esc(gen(name)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      hm = out.match(new RegExp('<h2[^>]*>\\s*' + t + '\\s*</h2>', 'i'));
      if (hm) break;
    }
    if (!hm) { notFound.push(key); continue; }
    const start = hm.index + hm[0].length;
    const rest = out.slice(start);
    const endRel = rest.search(/<h2[\s>]/i);
    const segment = endRel === -1 ? rest : rest.slice(0, endRel);

    const runRe = /(?:[ \t]*<p>(?:(?!<\/p>)[\s\S])*<\/p>\s*)+/;
    const rm = mask(segment).match(runRe);
    if (!rm) { notFound.push(key + '(no prose)'); continue; }

    const body = paras(c[key]).replace(/\n/g, eol);
    const replaced = segment.slice(0, rm.index) + body + eol + segment.slice(rm.index + rm[0].length);
    if (replaced !== segment) {
      out = out.slice(0, start) + replaced + (endRel === -1 ? '' : rest.slice(endRel));
      changed++;
    }
  }
  return { out, changed, notFound };
}

let done = 0, refreshed = 0, unchanged = 0, noAnchor = 0, noContent = 0, incomplete = [];
const unreachable = [];
for (const [slug, c] of Object.entries(CONTENT)) {
  if (slug === '_meta') continue;
  const file = path.join(DIR, slug + '.html');
  if (!fs.existsSync(file)) { noContent++; continue; }
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('id="guide"')) {
    // Refreshing does NOT require all seven. Injection does, because it builds the whole block and
    // a gap would ship an empty heading; a refresh only rewrites the sections it has prose for and
    // leaves the rest exactly as they are.
    const name = NAME.get(slug) || slug;
    const eol = s.includes('\r\n') ? '\r\n' : '\n';
    const r = refresh(s, name, c, eol);
    // A section whose heading cannot be located is the failure this script used to hide: it
    // skipped, counted the page as refreshed on the strength of the sections it DID find, and
    // said nothing. Report it, so a run that cannot reach six of seven sections says so.
    if (r.notFound.length) unreachable.push(slug + '(' + r.notFound.join(',') + ')');
    if (r.changed) { fs.writeFileSync(file, r.out); refreshed++; } else unchanged++;
    continue;
  }
  if (!s.includes(ANCHOR)) { noAnchor++; continue; }
  const name = NAME.get(slug) || slug;
  const missing = ORDER.filter(([k]) => !c[k] || !String(c[k]).trim()).map(([k]) => k);
  if (missing.length) { incomplete.push(slug + '(' + missing.join(',') + ')'); continue; }
  const body = ORDER.map(([k, h]) => `        <h2>${esc(h(name))}</h2>\n${paras(c[k])}`).join('\n');
  const block = `    <section class="city-guide" id="guide">\n      <div class="container">\n${body}\n      </div>\n    </section>\n\n    `;
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace(ANCHOR, block.replace(/\n/g, eol) + ANCHOR);
  fs.writeFileSync(file, s);
  done++;
}
console.log(`guide sections: injected ${done} | refreshed ${refreshed} | unchanged ${unchanged} | no-anchor ${noAnchor} | no-page ${noContent} | incomplete ${incomplete.length}`);
if (incomplete.length) console.log('  incomplete:', incomplete.join(', '));
if (unreachable.length) {
  console.log('  UNREACHABLE SECTIONS on ' + unreachable.length + ' page(s), prose NOT updated there:');
  console.log('    ' + unreachable.slice(0, 12).join(' '));
  if (unreachable.length > 12) console.log('    ... and ' + (unreachable.length - 12) + ' more');
}

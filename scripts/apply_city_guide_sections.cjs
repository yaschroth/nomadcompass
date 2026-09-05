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
function refresh(html, name, c, eol) {
  let out = html, changed = 0;
  for (const [key, heading] of ORDER) {
    const h = esc(heading(name));
    // Replace ONLY the run of plain <p> paragraphs directly after the heading, and stop at the
    // first element that is anything else. Other sweeps inject their own blocks inside these
    // sections: the YMYL "not legal advice" note sits at the end of Visas, and the affiliate
    // transport aside at the end of Getting Around. A first draft matched everything up to the
    // next <h2> and would have deleted the YMYL note from San Francisco. _safe_write caught it,
    // which is the whole reason that guard exists.
    const re = new RegExp('(<h2[^>]*>\\s*' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      + '\\s*</h2>)((?:\\s*<p>(?:(?!</p>)[\\s\\S])*</p>)+)', 'i');
    const m = out.match(re);
    if (!m) continue;
    const body = paras(c[key]).replace(/\n/g, eol);
    const next = m[1] + eol + body;
    if (next !== m[0]) { out = out.replace(re, () => next); changed++; }
  }
  return { out, changed };
}

let done = 0, refreshed = 0, unchanged = 0, noAnchor = 0, noContent = 0, incomplete = [];
for (const [slug, c] of Object.entries(CONTENT)) {
  if (slug === '_meta') continue;
  const file = path.join(DIR, slug + '.html');
  if (!fs.existsSync(file)) { noContent++; continue; }
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('id="guide"')) {
    const name = NAME.get(slug) || slug;
    const missing = ORDER.filter(([k]) => !c[k] || !String(c[k]).trim()).map(([k]) => k);
    if (missing.length) { incomplete.push(slug + '(' + missing.join(',') + ')'); continue; }
    const eol = s.includes('\r\n') ? '\r\n' : '\n';
    const r = refresh(s, name, c, eol);
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

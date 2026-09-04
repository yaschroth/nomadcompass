require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Installs the inline city script block on pages that were generated without it.
 *
 * Every established city page carries one 22KB block that does the visible work of the page: it
 * animates the Nomad Score gauge, draws the category radar, fills the thirteen score tiles and
 * writes the average temperature into the hero stat bar. generate_city_pages.js emits the markup
 * those functions target, the SVG circle with id="scoreGaugeFill" and the stat cells, but not the
 * script that fills them. So a freshly generated page renders a score of 0 and a temperature of
 * "--" and looks broken, which is exactly how a batch of 30 new cities came out.
 *
 * This is the same class of gap the expansion notes already record: the tooling that gave the older
 * pages their depth is no longer all in the repo. Rather than reconstruct 17KB of behaviour, the
 * block is lifted from a page that has it. Verified before use: masking the city id and the
 * descriptions object, the block is byte-identical across Porto, Busan and Lisbon, so there is one
 * canonical version and no per-city logic hiding in it.
 *
 * The two parts that DO differ per city are rebuilt here:
 *   CITY_ID                 the page's own slug
 *   CATEGORY_DESCRIPTIONS   thirteen notes. Written from data/category-descriptions.json where the
 *                           city is present, and otherwise left as an empty object, which the block
 *                           already handles: the tiles fall back to the score alone rather than
 *                           inventing an explanation for it. apply_category_notes.cjs fills these
 *                           in properly once the notes are researched.
 *
 * Usage: node scripts/apply_city_score_block.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const DIR = path.join(ROOT, 'cities');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const IDS = CITIES.map((c) => c.id);

// data/category-descriptions.json still holds notes for 70 slugs that no longer exist, left from
// cities that were renamed or dropped. A new city landing on one of those slugs silently inherits
// them: batch 38's Inverness picked up a set averaging eleven words per tile, a quarter of the
// forty-word floor apply_category_notes.cjs enforces, and reported it as a success. Notes that
// would not pass that gate are treated as absent, so the tiles start empty and get written properly.
const NOTE_FLOOR = 40;
const stale = [];
const NOTES = (() => {
  const f = path.join(ROOT, 'data', 'category-descriptions.json');
  if (!fs.existsSync(f)) return {};
  const all = JSON.parse(fs.readFileSync(f, 'utf8'));
  const out = {};
  for (const [id, notes] of Object.entries(all)) {
    if (id.startsWith('_') || !notes || typeof notes !== 'object') continue;
    const words = Object.values(notes).map((v) => String(v).trim().split(/\s+/).length);
    if (!words.length || Math.min(...words) < NOTE_FLOOR) { stale.push(id); continue; }
    out[id] = notes;
  }
  return out;
})();

/** Pull the canonical block out of a page that already has one. */
function template() {
  for (const id of IDS) {
    const abs = path.join(DIR, id + '.html');
    if (!fs.existsSync(abs)) continue;
    const html = fs.readFileSync(abs, 'utf8');
    const at = html.indexOf('const CITY_ID');
    if (at === -1) continue;
    const start = html.lastIndexOf('<script', at);
    const end = html.indexOf('</script>', at);
    if (start === -1 || end === -1) continue;
    return { from: id, block: html.slice(start, end + '</script>'.length) };
  }
  return null;
}

const T = template();
if (!T) { console.error('No page carries the block, nothing to copy from.'); process.exit(1); }

const swap = (block, id) => block
  .replace(/const CITY_ID = '[a-z0-9-]+';/, "const CITY_ID = '" + id + "';")
  .replace(/const CATEGORY_DESCRIPTIONS = \{[\s\S]*?\};/,
    'const CATEGORY_DESCRIPTIONS = ' + JSON.stringify(NOTES[id] || {}) + ';');

let added = 0;
let withNotes = 0;
const failed = [];

for (const id of IDS) {
  const abs = path.join(DIR, id + '.html');
  if (!fs.existsSync(abs)) continue;
  let html = fs.readFileSync(abs, 'utf8');
  if (html.includes('const CITY_ID')) continue;

  const block = swap(T.block, id);
  if (!block.includes("const CITY_ID = '" + id + "'")) { failed.push(id + ' (id swap failed)'); continue; }

  // Before </body>, after the markup it operates on.
  const next = html.replace(/(\r?\n<\/body>)/, '\r\n  ' + block + '$1');
  if (next === html) { failed.push(id + ' (no </body>)'); continue; }
  if (!DRY) fs.writeFileSync(abs, next);
  added++;
  if (NOTES[id]) withNotes++;
}

console.log('Score block: added to ' + added + ' page(s), copied from ' + T.from
  + '; ' + withNotes + ' had category notes on file, ' + (added - withNotes) + ' start empty'
  + (DRY ? '  [dry run]' : ''));
if (stale.length) {
  console.log('  ' + stale.length + ' slug(s) in category-descriptions.json hold notes below the '
    + NOTE_FLOOR + '-word floor and were ignored: ' + stale.slice(0, 10).join(', ')
    + (stale.length > 10 ? ' +' + (stale.length - 10) : ''));
}
if (failed.length) console.log('  failed: ' + failed.join(', '));

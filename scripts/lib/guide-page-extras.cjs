/**
 * Words a city's guide shows a reader that data/guide-content.json does NOT hold.
 *
 * The JSON stores seven prose sections. A good many pages also carry <ul> lists inside those
 * sections, most often a pair of Pros and Cons bullets, and sometimes <h3> subheadings. Those words
 * are on the page and a reader reads them, but no key in the data file represents them, so any tool
 * that measures depth from the JSON alone under-reads those cities.
 *
 * It under-reads them by a lot. Bukhara counts 578 words in the JSON and 686 on the page: its
 * pro-and-con bullets are 108 words the data file has never seen. Targeting the floor from the JSON
 * figure would have meant writing about 110 words more than necessary into each of roughly 220
 * cities, some 24,000 words spent buying depth those pages already had.
 *
 * So the floor is judged against JSON words plus these extras, while the 90-220 band still applies
 * to the JSON sections alone, because the band is about what this tooling writes.
 *
 * Sweep-owned regions are masked exactly as apply_city_guide_sections masks them, so the cost table
 * is never counted as writing.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'cities');

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
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

const cache = new Map();

/** Words in <li> and <h3> inside the guide block, which the JSON never holds. 0 if no page. */
function pageExtras(slug) {
  if (cache.has(slug)) return cache.get(slug);
  let n = 0;
  const file = path.join(DIR, slug + '.html');
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    const i = html.indexOf('id="guide"');
    if (i >= 0) {
      const j = html.indexOf('<!-- Where to Stay -->', i);
      const block = mask(html.slice(i, j > 0 ? j : i + 80000));
      for (const re of [/<li>([\s\S]*?)<\/li>/g, /<h3[^>]*>([\s\S]*?)<\/h3>/g]) {
        for (const m of block.matchAll(re)) n += words(m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' '));
      }
    }
  }
  cache.set(slug, n);
  return n;
}

module.exports = { pageExtras };

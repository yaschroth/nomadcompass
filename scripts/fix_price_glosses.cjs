require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Second pass after fix_degenerate_prices.cjs, for the shapes the 2026-10-06 ranking writers found:
 *
 *   "$345-450 / $370-480"           a range followed by a near copy: the old local-currency column after
 *                                   its local side was converted too. The first range stays.
 *   "$4,030 (roughly $3,800)"       the same in brackets, with or without "about", "roughly", "approx.".
 *   "$0-0.50 per ride ($0.15-0.35)" a range that rounded to $0 with the precise one in brackets: the
 *                                   bracket is kept and the zero range goes.
 *   "$0-0.50", "around $0"          a small fare rounded to nothing becomes "under $0.50" / "under $1".
 *
 * Left alone on purpose: brackets that change the unit ("$47,850 a year (roughly $4,000 a month)") and
 * budgets that genuinely start at zero ("budget $0 to $80 for cafe spend").
 *
 * Usage: node scripts/fix_price_glosses.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
// A number never ends on its sentence's full stop or a list comma ("$920-1,270. Add groceries").
const NUM = '\\d[\\d,]*\\d(?:\\.\\d+)?|\\d(?:\\.\\d+)?';
const RANGE = '\\$(?:' + NUM + ')(?:\\s*(?:-|to)\\s*\\$?(?:' + NUM + '))?';
// Both sides must be RANGES ("$21-35 per meal / $20-33"): a pair of single prices separated by a slash
// is two different things in a table ("Metro ride / Metrobus ride: $0.29 / $0.35").
const RANGE2 = '\\$(?:' + NUM + ')\\s*-\\s*\\$?(?:' + NUM + ')';
const SLASH = new RegExp('(' + RANGE2 + ')( per [a-z]+|/month|/mo)?\\s+/\\s+' + RANGE2 + '(?: per [a-z]+|/month|/mo)?', 'g');
// The words between the figure and the bracket may not cross a sentence or a list: "$920-1,270. Add
// groceries ($230-320)" is a second item, not a gloss.
const PAREN = new RegExp('(' + RANGE + ')([^()<$.;:]{0,30}?)\\s*\\((?:about|roughly|approx\\.?|around)?\\s*(' + RANGE + ')(\\s*each)?\\s*\\)', 'g');
// Only the unambiguous zero shapes. A bare "$0" can mean free (Valletta's and Belgrade's buses are), so
// it is listed for a person to read rather than rewritten.
const ZERO_RANGE = /\$0\s*(?:-|to)\s*\$?(0\.\d+|1(?:\.00)?)(?![\d.,]*\d)/g;
const ZERO_WORD = /\b(around|roughly|as cheap as|minimum fare(?: of)?|fares? starts? at)\s+\$0(?![\d.,]*\d)(?!\s*(?:-|to))/gi;
const isZero = (r) => /^\$0(?:\s*(?:-|to)|$)/.test(r);

function fix(text, log, where) {
  let t = text;
  t = t.replace(SLASH, (all, first, unit) => { log.push(where + ': "' + all + '" -> "' + first + (unit || '') + '"'); return first + (unit || ''); });
  t = t.replace(PAREN, (all, lead, mid, inner, each) => {
    if (/month|year|week|day|night/i.test(mid + inner) && !/per|\/|a /.test(mid)) return all;
    if (/\b(a|per) (month|year)\b/i.test(mid) && /month|year/.test(all.slice(all.indexOf('(')))) return all;
    const rep = isZero(lead) ? inner + mid : lead + mid;
    log.push(where + ': "' + all + '" -> "' + rep + '"');
    return rep;
  });
  t = t.replace(ZERO_RANGE, (all, upper) => {
    const rep = 'under $' + (upper === '1.00' ? '1' : upper);
    log.push(where + ': "' + all + '" -> "' + rep + '"');
    return rep;
  });
  t = t.replace(ZERO_WORD, (all, w) => {
    const rep = (/^(around|roughly|as cheap as)$/i.test(w) ? '' : w.replace(/ of$/i, '') + ' ') + 'under $1';
    log.push(where + ': "' + all + '" -> "' + rep + '"');
    return rep;
  });
  const bare = t.match(/[^.<>]{0,60}\$0(?![\d.,]*\d)(?!\s*(?:-|to))[^.<>]{0,40}/g);
  if (bare) bare.forEach((b) => REVIEW.push(where + ': ' + b.trim()));
  return t;
}

const log = [];
const REVIEW = [];
const GF = path.join(ROOT, 'data', 'guide-content.json');
const raw = fs.readFileSync(GF, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const g = JSON.parse(raw);
const G = g.cities || g;
for (const c of Object.keys(G)) for (const k of Object.keys(G[c] || {})) if (typeof G[c][k] === 'string') G[c][k] = fix(G[c][k], log, 'json ' + c + '.' + k);
const nJson = log.length;
const changed = [];
for (const f of fs.readdirSync(path.join(ROOT, 'cities'))) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(ROOT, 'cities', f);
  const t = fs.readFileSync(p, 'utf8');
  // Only visible prose and the category tiles: never inside other scripts or attributes.
  const n = t.replace(/(<script[\s\S]*?<\/script>)|(<[^>]+>)|([^<]+)/g, (m, script, tag, textNode) => {
    if (tag) return tag;
    if (script) return /CATEGORY_DESCRIPTIONS/.test(script) ? fix(script, log, f) : script;
    return fix(textNode, log, f);
  });
  if (n !== t) changed.push([p, n]);
}
console.log(log.join('\n'));
if (REVIEW.length) console.log('\nREVIEW BY HAND, a bare $0 (it may mean free):\n  ' + REVIEW.join('\n  '));
console.log(`\n${nJson} in the guide JSON, ${log.length - nJson} on ${changed.length} pages`);
if (APPLY) {
  fs.writeFileSync(GF, JSON.stringify(g, null, 2).replace(/\n/g, eol) + eol);
  for (const [p, n] of changed) fs.writeFileSync(p, n);
  console.log('written');
} else console.log('dry run: --apply to write');

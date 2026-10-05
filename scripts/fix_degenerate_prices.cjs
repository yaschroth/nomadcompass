require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Repairs price ranges whose two ends are the same dollar figure ("$0.50-0.50", "$1-1", "$0-0") and
 * exchange rates that a conversion sweep turned into "$1 to 1".
 *
 * They are what the 2026-08 USD conversion left behind: a local range such as "20-30 baht" converted
 * and rounded at both ends to the same dollar, and "1 USD to 10.5 SEK" had its local side converted
 * too. check_price_shapes.cjs could not see them because its range pattern wanted a "$" on both ends;
 * it now flags them ("same both ends").
 *
 * A collapsed range becomes "about $X" (or just "$X" after a word that already hedges, "around",
 * "roughly"); a zero becomes "under $1", which is what a fare that rounded to $0 means. A collapsed
 * exchange rate is recomputed from assets/fx-usd.json, the rate the cost tables use, as "N to the US
 * dollar". Writes data/guide-content.json and every page, so a later guide refresh agrees.
 *
 * Usage: node scripts/fix_degenerate_prices.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json')).rates;

const fmtRate = (r) => (r < 10 ? r.toFixed(1) : r < 100 ? String(Math.round(r)) : Number(r.toPrecision(2)).toLocaleString('en-US'));
const HEDGE = /(?:around|roughly|about|approximately|some)\s+$/i;
const DEGEN = /\$\s?(\d[\d,]*(?:\.\d+)?)\s*(?:-|–|to)\s*\$?\s?(\d[\d,]*(?:\.\d+)?)(?![\d.,]*\d)/g;

function fix(text, log, where) {
  let out = '';
  let last = 0;
  let m;
  DEGEN.lastIndex = 0;
  while ((m = DEGEN.exec(text))) {
    if (m[1] !== m[2]) continue;
    const before = text.slice(Math.max(0, m.index - 120), m.index);
    let start = m.index;
    let rep;
    // An exchange rate: "(SEK) trades at roughly $1 to 1", "the rate sits around $1 to 1".
    const code = /\(([A-Z]{3})\)[^()]{0,80}$/.exec(before) || /\b([A-Z]{3})\b[^()]{0,40}$/.exec(before);
    if (m[1] === '1' && /\bto\b/.test(m[0]) && code && FX[code[1]] && code[1] !== 'USD') {
      rep = fmtRate(FX[code[1]]) + ' to the US dollar';
      const h = HEDGE.exec(text.slice(0, m.index));
      if (!h) rep = 'about ' + rep;
    } else if (Number(m[1].replace(/,/g, '')) === 0) {
      const h = /(?:around|roughly|about|approximately|as little as|start at|from)\s+$/i.exec(text.slice(0, m.index));
      if (h) start = m.index - h[0].length;
      rep = 'under $1';
    } else {
      rep = (HEDGE.test(text.slice(0, m.index)) ? '$' : 'about $') + m[1];
    }
    out += text.slice(last, start) + rep;
    last = m.index + m[0].length;
    log.push(where + ': "' + text.slice(start, last) + '" -> "' + rep + '"');
  }
  out += text.slice(last);
  // A dollar figure glossed with another dollar figure, "$28 (~$27)": the old local-currency gloss after
  // its local side was converted too. The gloss goes; a note riding in the same brackets stays.
  return out.replace(/(\$[\d,.]+(?:\s*(?:-|–|to)\s*\$?[\d,.]+)?(?:[^()<$]{0,30}?|\/month<\/strong>|<\/strong>))\s*\(~\$[\d,.]+(?:\s*(?:-|–|to)\s*\$?[\d,.]+)?(, [^()]*)?\)/g, (all, lead, note) => {
    const rep = lead + (note ? ' (' + note.slice(2) + ')' : '');
    log.push(where + ': "' + all.slice(0, 70) + '" -> "' + rep.slice(0, 70) + '"');
    return rep;
  });
}

const log = [];
const GF = path.join(ROOT, 'data', 'guide-content.json');
const raw = fs.readFileSync(GF, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const g = JSON.parse(raw);
const G = g.cities || g;
for (const c of Object.keys(G)) for (const k of Object.keys(G[c] || {})) if (typeof G[c][k] === 'string') G[c][k] = fix(G[c][k], log, 'json ' + c + '.' + k);
const jsonCount = log.length;
const SKIP = new Set(['node_modules', '.git', 'scripts', 'data', 'ui-ux-pro-max-skill', '.vercel', 'assets', 'images', 'styles']);
const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || (!rel && SKIP.has(e.name))) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, rel + e.name + '/');
    else if (e.name.endsWith('.html')) pages.push([p, rel + e.name]);
  }
})(ROOT, '');
const changed = [];
for (const [p, r] of pages) {
  const t = fs.readFileSync(p, 'utf8');
  const n = fix(t, log, r);
  if (n !== t) changed.push([p, n]);
}
console.log(log.join('\n'));
console.log(`\n${jsonCount} in the guide JSON, ${log.length - jsonCount} on ${changed.length} pages`);
if (APPLY) {
  fs.writeFileSync(GF, JSON.stringify(g, null, 2).replace(/\n/g, eol) + eol);
  for (const [p, n] of changed) fs.writeFileSync(p, n);
  console.log('written');
} else console.log('dry run: --apply to write');

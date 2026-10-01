/**
 * Reads the city title test (data/title-test.json) against Search Console.
 *
 * Half the city pages carry title shape A, half shape B (scripts/lib/city_snippet.cjs, variantOf).
 * A raw comparison of the two groups after the switch would mostly measure how the groups already
 * differed: Busan alone takes 232 impressions a month and sits in one of them. So the read is a
 * difference in differences: each group's CTR in the test window minus its own CTR in the baseline
 * window, then B's change minus A's. Anything that moved the whole site in between (a core update,
 * the season, the impressions doubling in September) moves both groups and cancels.
 *
 * Rows are page x date, never query x page: grouping by query drops the anonymised queries, which
 * were 93% of city-page impressions in September. "Positions 1-20" is applied per page per day.
 *
 * Significance is a permutation test over cities: the group labels are reshuffled 2,000 times and
 * the DiD recomputed, and p is the share of shuffles at least as far from zero as the real one.
 * Clicks cluster by page, so a plain two-proportion test would claim far more certainty than ~140
 * clicks a month can carry.
 *
 * How big a difference chance alone makes: a placebo run with no title change at all (August
 * 5-September 1 as the baseline, September 2-29 as the "test", today's split) gave a DiD of -0.52
 * points at p = 0.11. So one 28-day window can only call an effect of roughly 0.6 points or more,
 * a 50%+ lift on a 1.1% CTR. Anything smaller needs the second read, 56 days in.
 *
 * Usage (NODE_PATH must point at the repo's node_modules, as for gsc_query.cjs):
 *   node scripts/measure_title_test.cjs                       test window = startedOn + 27 days
 *   node scripts/measure_title_test.cjs --start 2026-10-15 --end 2026-11-11
 *   node scripts/measure_title_test.cjs --rows test.json --base-rows base.json   offline, page x date rows
 *   node scripts/measure_title_test.cjs --write-baseline      (re)write cities + baseline into the json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'title-test.json');
const KEY = 'C:/Users/yasch/.google/paraguay-seo-84d8fa4d2bf2.json';
const GOOGLEAPIS = 'C:/Users/yasch/AppData/Roaming/npm/node_modules/mcp-server-gsc/node_modules/googleapis';
const SITE = 'sc-domain:thenomadhq.com';
const MAX_POS = 20;
const PERMUTATIONS = 2000;

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const day = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => day(new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5));

async function fetchRows(start, end) {
  const { google } = require(GOOGLEAPIS);
  const auth = new google.auth.GoogleAuth({ keyFile: KEY, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: {
        startDate: start, endDate: end, dimensions: ['page', 'date'], rowLimit: 25000, startRow,
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/cities/' }] }],
      },
    });
    const got = r.data.rows || [];
    rows.push(...got);
    if (got.length < 25000) break;
  }
  return rows;
}

/** https://thenomadhq.com/cities/palermo(.html)(/)(?x) -> palermo */
const cityId = (url) => {
  const m = String(url).split(/[?#]/)[0].replace(/\/+$/, '').match(/\/cities\/([^/]+)$/);
  return m ? m[1].replace(/\.html$/, '') : null;
};

/** Per city: impressions, clicks and impression-weighted position, positions 1-20 only. */
function perCity(rows, ids) {
  const out = {};
  for (const r of rows) {
    const id = cityId(r.keys[0]);
    if (!id || !ids.has(id) || r.position > MAX_POS) continue;
    const o = out[id] || (out[id] = { i: 0, c: 0, p: 0 });
    o.i += r.impressions; o.c += r.clicks; o.p += r.position * r.impressions;
  }
  return out;
}

function groupStats(per, assign) {
  const g = { A: { pages: 0, impressions: 0, clicks: 0, p: 0 }, B: { pages: 0, impressions: 0, clicks: 0, p: 0 } };
  for (const [id, o] of Object.entries(per)) {
    const x = g[assign[id]];
    if (!x) continue;
    x.pages++; x.impressions += o.i; x.clicks += o.c; x.p += o.p;
  }
  for (const k of ['A', 'B']) {
    const x = g[k];
    x.ctr = x.impressions ? +(100 * x.clicks / x.impressions).toFixed(3) : 0;
    x.position = x.impressions ? +(x.p / x.impressions).toFixed(2) : 0;
    delete x.p;
  }
  return g;
}

const ctrOf = (per, ids) => {
  let i = 0, c = 0;
  for (const id of ids) { const o = per[id]; if (o) { i += o.i; c += o.c; } }
  return i ? c / i : 0;
};
const did = (base, test, a, b) => (ctrOf(test, b) - ctrOf(base, b)) - (ctrOf(test, a) - ctrOf(base, a));

function permutationP(base, test, assign, observed) {
  const ids = Object.keys(assign);
  const nB = ids.filter((id) => assign[id] === 'B').length;
  // Seeded, so two runs on the same data print the same p.
  let seed = 20261001;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  let extreme = 0;
  for (let k = 0; k < PERMUTATIONS; k++) {
    const sh = ids.slice();
    for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
    const d = did(base, test, sh.slice(nB), sh.slice(0, nB));
    if (Math.abs(d) >= Math.abs(observed) - 1e-12) extreme++;
  }
  return (extreme + 1) / (PERMUTATIONS + 1);
}

const pct = (x) => (100 * x).toFixed(2) + '%';
const loadRows = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

(async () => {
  const T = JSON.parse(fs.readFileSync(FILE, 'utf8'));

  if (args.includes('--write-baseline')) {
    // The assignment comes from the library, the same function the titles are built with.
    const S = require(path.join(__dirname, 'lib', 'city_snippet.cjs'));
    const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
    const m = {};
    // eslint-disable-next-line no-new-func
    new Function('m', src + ';m.d = CITIES;')(m);
    const cities = {};
    for (const c of m.d.slice().sort((a, b) => a.id.localeCompare(b.id))) cities[c.id] = S.variantOf(c.id);
    const end = arg('--end') || addDays(T.startedOn, -2);
    const start = arg('--start') || addDays(end, -27);
    const rows = arg('--base-rows') ? loadRows(arg('--base-rows')) : await fetchRows(start, end);
    const g = groupStats(perCity(rows, new Set(Object.keys(cities))), cities);
    T.cities = cities;
    T.baseline = { window: { start, end }, positions: '1-' + MAX_POS, A: g.A, B: g.B };
    fs.writeFileSync(FILE, JSON.stringify(T, null, 2) + '\n');
    const n = Object.values(cities).reduce((o, v) => (o[v]++, o), { A: 0, B: 0 });
    console.log(`wrote ${path.relative(ROOT, FILE)}: ${n.A} A, ${n.B} B, baseline ${start} to ${end}`);
    console.log(JSON.stringify(T.baseline, null, 2));
    return;
  }

  const assign = T.cities;
  const ids = new Set(Object.keys(assign));
  const A = Object.keys(assign).filter((id) => assign[id] === 'A');
  const B = Object.keys(assign).filter((id) => assign[id] === 'B');

  const start = arg('--start') || T.startedOn;
  const end = arg('--end') || addDays(start, 27);
  const available = day(new Date(Date.now() - 2 * 864e5));
  if (!arg('--rows') && end > available) {
    console.log(`note: Search Console has data to about ${available}; the window ends ${end}, so it is not complete yet.\n`);
  }
  const testRows = arg('--rows') ? loadRows(arg('--rows')) : await fetchRows(start, end < available ? end : available);
  const baseRows = arg('--base-rows') ? loadRows(arg('--base-rows'))
    : await fetchRows(T.baseline.window.start, T.baseline.window.end);

  const base = perCity(baseRows, ids);
  const test = perCity(testRows, ids);
  const gb = groupStats(base, assign);
  const gt = groupStats(test, assign);

  console.log(`TITLE TEST  A: ${T.variants.A}`);
  console.log(`            B: ${T.variants.B}`);
  const baseLabel = arg('--base-rows') ? 'from ' + path.basename(arg('--base-rows'))
    : `${T.baseline.window.start} to ${T.baseline.window.end}`;
  const testLabel = arg('--rows') ? 'from ' + path.basename(arg('--rows')) : `${start} to ${end}`;
  console.log(`baseline ${baseLabel}, test ${testLabel}, positions 1-${MAX_POS}\n`);
  const line = (k, w, g) => `  ${k}  ${w.padEnd(8)}  pages ${String(g.pages).padStart(4)}  impressions ${String(g.impressions).padStart(6)}`
    + `  clicks ${String(g.clicks).padStart(4)}  CTR ${g.ctr.toFixed(2).padStart(5)}%  position ${g.position.toFixed(1)}`;
  for (const k of ['A', 'B']) {
    console.log(line(k, 'baseline', gb[k]));
    console.log(line(k, 'test', gt[k]));
    console.log(`     change  CTR ${(gt[k].ctr - gb[k].ctr >= 0 ? '+' : '') + (gt[k].ctr - gb[k].ctr).toFixed(2)} pts,`
      + ` position ${(gt[k].position - gb[k].position >= 0 ? '+' : '') + (gt[k].position - gb[k].position).toFixed(1)}\n`);
  }
  const d = did(base, test, A, B);
  const p = permutationP(base, test, assign, d);
  console.log(`difference in differences (B change minus A change): ${d >= 0 ? '+' : ''}${(100 * d).toFixed(2)} pts of CTR`);
  console.log(`permutation p = ${p.toFixed(3)}  (${PERMUTATIONS} reshuffles of the city labels)`);
  const posGap = (gt.B.position - gb.B.position) - (gt.A.position - gb.A.position);
  if (Math.abs(posGap) >= 0.5) {
    console.log(`caution: B's position moved ${posGap.toFixed(1)} more than A's; part of any CTR gap is ranking, not the title.`);
  }
  console.log(p < 0.05
    ? `read: ${d > 0 ? 'B' : 'A'} wins. Set every page to it in city_snippet.title() and rerun apply_city_titles.cjs --apply.`
    : 'read: no difference this window can tell apart from chance. Keep both running another 28 days, or call it a tie and keep A.');
  console.log(`(test-window CTR, A ${pct(ctrOf(test, A))} vs B ${pct(ctrOf(test, B))})`);
})().catch((e) => { console.error('measure_title_test: ' + e.message); process.exit(1); });

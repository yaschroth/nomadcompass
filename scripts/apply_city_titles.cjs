require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The title of every city page, from scripts/lib/city_snippet.cjs title(), and nothing else.
 *
 * Written for the title test that starts 2026-10-01 (data/title-test.json): half the pages keep
 * shape A, half get shape B, chosen by a hash of the city id. The test is read with
 * scripts/measure_title_test.cjs.
 *
 * Four places carry the title, and all four are set here so they never disagree:
 *   <title>                         the search result
 *   og:title                        with the " | The Nomad HQ" suffix every city page already has
 *   twitter:title                   bare
 *   Article JSON-LD "headline"      apply_entity_schema.cjs derives it from <title>, so it would
 *                                   follow on that sweep's next run anyway; set now so the page is
 *                                   consistent the moment it ships.
 * The Place JSON-LD ("Palermo, Italy") and the breadcrumb ("Palermo") name the city, not the page,
 * and are left alone. The description is apply_city_meta.cjs's job.
 *
 * Before anything is written, the would-be titles go through the same rules as check_meta.cjs: at
 * most 60 characters without the brand suffix, and no title shared with any other indexable page.
 * A failure there stops the run.
 *
 * Usage:
 *   node scripts/apply_city_titles.cjs              dry run: counts, 10 samples per variant
 *   node scripts/apply_city_titles.cjs --apply      write
 *   node scripts/apply_city_titles.cjs --root DIR   act on a copy of the site (used to run the
 *                                                   real check_meta.cjs on the would-be pages)
 * Idempotent: a page already carrying its title is not rewritten.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const rootArg = args.indexOf('--root');
const ROOT = rootArg >= 0 ? path.resolve(args[rootArg + 1]) : path.resolve(__dirname, '..');
const S = require(path.join(__dirname, 'lib', 'city_snippet.cjs'));

const m = {};
// eslint-disable-next-line no-new-func
new Function('m', fs.readFileSync(path.join(__dirname, '..', 'cities-data.js'), 'utf8') + ';m.d = CITIES;')(m);
const byId = {};
for (const c of m.d) if (c && c.id) byId[c.id] = c;

const BRAND = ' | The Nomad HQ';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');
// The JSON-LD sits inside <script>, where "</" would end it early.
const jsonStr = (s) => JSON.stringify(s).replace(/</g, '\\u003c');

const TITLE_RE = /<title>[^<]*<\/title>/;
const OG_RE = /<meta property="og:title" content="[^"]*">/;
const TW_RE = /<meta name="twitter:title" content="[^"]*">/;
const ART_RE = /(<!-- article-schema --><script type="application\/ld\+json">[^<]*?"headline":)"(?:[^"\\]|\\.)*"/;

function rewrite(html, t) {
  const missing = [];
  const set = (re, to, label) => {
    if (!re.test(html)) { missing.push(label); return; }
    html = html.replace(re, to);
  };
  set(TITLE_RE, `<title>${esc(t)}</title>`, '<title>');
  set(OG_RE, `<meta property="og:title" content="${esc(t + BRAND)}">`, 'og:title');
  set(TW_RE, `<meta name="twitter:title" content="${esc(t)}">`, 'twitter:title');
  set(ART_RE, (_, head) => `${head}${jsonStr(t)}`, 'Article headline');
  return { html, missing };
}

// ---- 1. compute
const dir = path.join(ROOT, 'cities');
const plan = [];
let unknown = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
  const c = byId[f.replace(/\.html$/, '')];
  if (!c) { unknown++; continue; }
  const file = path.join(dir, f);
  const before = fs.readFileSync(file, 'utf8');
  const t = S.title(c);
  const { html, missing } = rewrite(before, t);
  plan.push({
    id: c.id, file, variant: S.variantOf(c.id), t, html, missing, changed: html !== before,
    old: decode((before.match(/<title>([^<]*)<\/title>/) || [, ''])[1]),
  });
}

// ---- 2. the check_meta rules, on the would-be titles
const SKIP_TOP = new Set(['node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill', 'tests', 'logos', 'components']);
const cityFiles = new Set(plan.map((p) => path.resolve(p.file)));
const titles = new Map();
const add = (t, rel) => { if (!titles.has(t)) titles.set(t, []); titles.get(t).push(rel); };
const walk = (d, rel) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }
    if (!e.name.endsWith('.html') || cityFiles.has(path.resolve(p))) continue;
    const html = fs.readFileSync(p, 'utf8');
    if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
    add(decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]).trim().replace(/\s*\|\s*The Nomad HQ\s*$/, ''), r);
  }
};
walk(ROOT, '');
for (const p of plan) {
  if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(p.html)) continue;
  add(p.t, 'cities/' + p.id + '.html');
}
const errors = [];
for (const p of plan) {
  if (!p.t || p.t.length > S.TITLE_CAP) errors.push(`${p.id}: title ${p.t.length} chars "${p.t}"`);
  if (/\u2014/.test(p.t)) errors.push(`${p.id}: em-dash in "${p.t}"`);
  if (/[€£¥]/.test(p.t)) errors.push(`${p.id}: non-USD currency in "${p.t}"`);
  if (p.missing.length) errors.push(`${p.id}: no ${p.missing.join(', ')} to set`);
}
for (const [t, files] of titles) {
  if (files.length > 1 && files.some((f) => f.startsWith('cities/'))) {
    errors.push(`${files.length} pages share "${t}" (${files.join(', ')})`);
  }
}

// ---- 3. report
const n = { A: 0, B: 0 };
const changed = { A: 0, B: 0 };
for (const p of plan) { n[p.variant]++; if (p.changed) changed[p.variant]++; }
const lens = plan.map((p) => p.t.length);
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}  ${plan.length} city pages (${unknown} files with no city in cities-data.js skipped)`);
console.log(`  variant A ${n.A} pages, ${changed.A} would change | variant B ${n.B} pages, ${changed.B} would change`);
console.log(`  titles ${Math.min(...lens)}-${Math.max(...lens)} chars, ${new Set(plan.map((p) => p.t)).size} distinct over ${plan.length}`);
for (const v of ['A', 'B']) {
  console.log(`\n  sample, variant ${v}:`);
  const pool = plan.filter((p) => p.variant === v);
  // Spread across the alphabet rather than the first ten.
  for (let i = 0; i < 10 && i < pool.length; i++) {
    const p = pool[Math.floor(i * pool.length / 10)];
    console.log(`    ${p.id.padEnd(16)} ${p.old}`);
    console.log(`    ${''.padEnd(16)} ${p.t}  (${p.t.length})`);
  }
}
if (errors.length) {
  console.log(`\n  ERRORS (${errors.length}), nothing written:`);
  errors.slice(0, 30).forEach((e) => console.log('    ' + e));
  process.exit(1);
}
console.log('\n  check_meta rules: every would-be title is 1-60 chars and no other indexable page shares it.');

if (APPLY) {
  let w = 0;
  for (const p of plan) if (p.changed) { fs.writeFileSync(p.file, p.html); w++; }
  console.log(`  wrote ${w} pages.`);
} else {
  console.log('  dry run: nothing written. --apply to write.');
}

/**
 * Gate: every var() a stylesheet or generator uses names a token that exists, or carries a fallback.
 *
 * A CSS custom property that was never defined and has no fallback does not resolve to zero or to
 * anything else: the whole declaration is invalid and the browser drops it. Nothing warns, and the
 * source looks correct.
 *
 * That is what happened here. Two country-heading rules said "margin: 0 0 var(--space-7)". The
 * spacing scale runs 1,2,3,4,5,6,8,10,12,16,20,24 with no 7, so the margin was discarded and every
 * country heading on the service hubs sat 0px below the grid above it. Three more uses of the same
 * phantom had been added since, taking the top padding off three page families.
 *
 * A var() WITH a fallback is fine and is not reported: var(--color-sand-dark, #e3d9c6) is
 * deliberate, and the generators use that form for tokens the shell owns.
 *
 * Usage: node scripts/check_css_tokens.cjs
 * Exit 1 on any token used with neither a definition nor a fallback, except the known debt below.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const SOURCES = ['styles', 'scripts'];
const READ = /\.(css|cjs|js|html)$/;
const SKIP = new Set(['node_modules', '.git', 'ui-ux-pro-max-skill']);
// This file names tokens in its own prose and regexes; scanning itself is noise.
const SELF = 'check_css_tokens.cjs';

// Phantom tokens that predate this gate. Each is a declaration that has never once applied: that
// text is not bold, that button has no amber, that panel has no coral. Giving them real values
// would CHANGE how those pages look, and nobody asked for those pages to change, so they are
// recorded here rather than quietly altered. Keyed by file, so the same token used anywhere new
// still fails.
const KNOWN = new Set([
  'styles/city-page.css|--font-bold',
  'styles/city-page.css|--color-coral',
  'scripts/create_accommodation_pages.js|--color-amber',
  'scripts/create_accommodation_pages.js|--color-amber-dark',
  'scripts/create_accommodation_pages.js|--font-bold',
]);

const files = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (READ.test(f.name) && f.name !== SELF) files.push(p);
  }
};
for (const d of SOURCES) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
// The published pages carry inline blocks that can define tokens of their own.
for (const f of ['index.html', 'services.html']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) files.push(p);
}

const defined = new Set();
const text = new Map();
for (const p of files) {
  const s = fs.readFileSync(p, 'utf8');
  text.set(p, s);
  for (const m of s.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
}

// var(--x) with nothing after the name is the dangerous form. var(--x, y) is fine.
const USE = /var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g;

const problems = [];
const known = [];
for (const [p, s] of text) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  s.split('\n').forEach((line, i) => {
    USE.lastIndex = 0;
    let m;
    while ((m = USE.exec(line)) !== null) {
      if (defined.has(m[1])) continue;
      const where = rel + ':' + (i + 1) + '  ' + m[1];
      (KNOWN.has(rel + '|' + m[1]) ? known : problems).push(where);
    }
  });
}

console.log('CSS TOKEN GATE  (' + files.length + ' files, ' + defined.size + ' tokens defined)');

if (known.length) {
  console.log('\n  known debt (' + known.length + '): declarations that have never applied');
  known.forEach((x) => console.log('    ' + x));
}

if (problems.length) {
  console.log('\n  ERRORS (' + problems.length + '):');
  problems.slice(0, 40).forEach((x) => console.log('    ' + x));
  if (problems.length > 40) console.log('    ... and ' + (problems.length - 40) + ' more');
  console.log('\n  A var() with no definition and no fallback makes the whole declaration invalid.');
  console.log('  Use a token that exists, or give it a fallback.');
  process.exit(1);
}

console.log('\n  clean: every var() resolves, or carries a fallback.');

/**
 * Sitewide head sweep: injects the Travelpayouts partner script into the <head> of every page,
 * right before </head>. Idempotent (skips pages already carrying <!-- travelpayouts -->) and
 * CRLF-aware. Only touches files that actually have a </head> (skips partials/fragments).
 * Usage: node scripts/apply_travelpayouts.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SNIPPET = [
  '<!-- travelpayouts -->',
  '<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2">',
  '  (function () {',
  '      var script = document.createElement("script");',
  '      script.async = 1;',
  '      script.setAttribute("data-cmp-ab","2");',
  "      script.src = 'https://tp-em.com/NTU3OTE2.js?t=557916';",
  '      document.head.appendChild(script);',
  '  })();',
  '</script>',
  '<!-- /travelpayouts -->',
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
}

const files = [];
walk(ROOT, files);
let done = 0, skipped = 0, noHead = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('<!-- travelpayouts -->')) { skipped++; continue; }
  if (!s.includes('</head>')) { noHead++; continue; }
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const block = SNIPPET.join(eol) + eol;
  s = s.replace('</head>', block + '</head>');
  fs.writeFileSync(f, s);
  done++;
}
console.log(`Travelpayouts injected: ${done} | already-present: ${skipped} | no <head> (partials): ${noHead}`);

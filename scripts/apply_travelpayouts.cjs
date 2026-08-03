/**
 * Sitewide head sweep: injects the Travelpayouts partner script into the <head> of every page,
 * right before </head>, CONSENT-GATED so the external tp-em.com script only loads after the visitor
 * accepts cookies (or immediately if they accepted in a prior session). The script tag and its src
 * stay in the HTML source, so Travelpayouts site verification still passes. Idempotent + updating
 * (replaces any existing <!-- travelpayouts --> block) and CRLF-aware. Skips files without a <head>.
 * Usage: node scripts/apply_travelpayouts.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SNIPPET = [
  '<!-- travelpayouts -->',
  '<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2">',
  '  (function () {',
  '      var loaded = false;',
  '      function loadTP() {',
  '          if (loaded) return; loaded = true;',
  '          var script = document.createElement("script");',
  '          script.async = 1;',
  '          script.setAttribute("data-cmp-ab","2");',
  "          script.src = 'https://tp-em.com/NTU3OTE2.js?t=557916';",
  '          document.head.appendChild(script);',
  '      }',
  '      var granted = false;',
  "      try { granted = localStorage.getItem('nomadhq_consent') === 'granted'; } catch (e) {}",
  '      if (granted) { loadTP(); return; }',
  "      document.addEventListener('DOMContentLoaded', function () {",
  "          var a = document.getElementById('cc-accept');",
  "          if (a) a.addEventListener('click', loadTP);",
  '      });',
  "      window.addEventListener('nomadhq:consent-granted', loadTP);",
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
// EOL-aware removal of any existing block
const BLOCK_RE = /[ \t]*<!-- travelpayouts -->[\s\S]*?<!-- \/travelpayouts -->\r?\n?/;

const files = [];
walk(ROOT, files);
let inserted = 0, updated = 0, noHead = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes('</head>')) { noHead++; continue; }
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const block = SNIPPET.join(eol) + eol;
  const had = BLOCK_RE.test(s);
  if (had) s = s.replace(BLOCK_RE, '');
  s = s.replace('</head>', block + '</head>');
  fs.writeFileSync(f, s);
  had ? updated++ : inserted++;
}
console.log(`Travelpayouts (consent-gated): inserted ${inserted} | updated ${updated} | no <head>: ${noHead}`);

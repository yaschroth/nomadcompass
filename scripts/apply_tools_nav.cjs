/**
 * Sitewide nav sweep: restructures the header into a compact set of top-level links plus a
 * "Tools" dropdown that groups the interactive tools. Rewrites the desktop <ul class="nav-links">
 * and the mobile <ul class="nav-mobile-links"> on every page with root-relative hrefs (identical
 * everywhere) and per-page active states. Idempotent (balanced <ul> matcher handles the nested
 * dropdown menu on re-runs). Dropdown behaviour is pure CSS (styles live in styles/nav.css).
 * Run this AFTER any page generator that emits its own nav. Usage: node scripts/apply_tools_nav.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const FLAT_BEFORE = [['/', 'Home']];
const TOOLS = [
  ['/route', 'Route Planner'],
  ['/best-weather', 'Best Weather by Month'],
  ['/visa', 'Visa Finder'],
  ['/nomad-visas', 'Nomad Visa Finder'],
  ['/geoarbitrage', 'Geoarbitrage Calculator'],
  ['/salary', 'Salary Calculator'],
  ['/cost-of-living-index', 'Cost of Living Index'],
  ['/timezones', 'Time Zone Finder'],
  ['/compare', 'Compare Cities'],
  ['/wheel', 'Decision Wheel'],
  ['/map', 'World Map'],
  ['/tier-list', 'Tier List'],
  ['/tier-list/maker', 'Tier List Maker'],
];
const FLAT_AFTER = [['/cities', 'Cities'], ['/best', 'Rankings'], ['/blog', 'Blog']];
const TOOL_PATHS = TOOLS.map((t) => t[0]);

function pagePath(file) {
  let rel = path.relative(ROOT, file).replace(/\\/g, '/');
  rel = rel.replace(/\.html$/, '');
  if (rel === 'index') return '/';
  if (rel.endsWith('/index')) rel = rel.slice(0, -6);
  return '/' + rel;
}
// which top-level section is active for a given page path
function sectionOf(p) {
  if (p === '/') return 'home';
  if (p === '/tier-list/maker' || p === '/tier-list') return p; // tool exact
  if (TOOL_PATHS.indexOf(p) >= 0) return p;
  if (p.indexOf('/cities') === 0) return '/cities';
  if (p.indexOf('/best') === 0) return '/best';
  if (p.indexOf('/blog') === 0) return '/blog';
  return '';
}

function buildDesktop(p) {
  const sec = sectionOf(p);
  const toolsActive = TOOL_PATHS.indexOf(sec) >= 0;
  const flat = (arr) => arr.map(([h, t]) => `<li><a href="${h}" class="nav-link${(h === '/' ? sec === 'home' : sec === h) ? ' active' : ''}">${t}</a></li>`).join('');
  const toolLis = TOOLS.map(([h, t]) => `<li><a href="${h}" class="nav-drop-link${sec === h ? ' active' : ''}">${t}</a></li>`).join('');
  return '<ul class="nav-links">' +
    flat(FLAT_BEFORE) +
    `<li class="nav-item-drop"><button type="button" class="nav-link nav-drop-btn${toolsActive ? ' active' : ''}" aria-haspopup="true" aria-expanded="false">Tools<span class="nav-caret" aria-hidden="true"></span></button>` +
    `<ul class="nav-drop-menu">${toolLis}</ul></li>` +
    flat(FLAT_AFTER) +
    '</ul>';
}
function buildMobile(p) {
  const sec = sectionOf(p);
  const flat = (arr) => arr.map(([h, t]) => `<li><a href="${h}" class="nav-mobile-link${(h === '/' ? sec === 'home' : sec === h) ? ' active' : ''}">${t}</a></li>`).join('');
  const toolAs = TOOLS.map(([h, t]) => `<a href="${h}" class="nav-mobile-sub${sec === h ? ' active' : ''}">${t}</a>`).join('');
  return '<ul class="nav-mobile-links">' +
    flat(FLAT_BEFORE) +
    `<li class="nav-mobile-group"><span class="nav-mobile-label">Tools</span>${toolAs}</li>` +
    flat(FLAT_AFTER) +
    '</ul>';
}

// replace the balanced <ul ...> ... </ul> starting at openTag with newBlock
function replaceUl(html, openTag, newBlock) {
  const start = html.indexOf(openTag);
  if (start < 0) return html;
  let i = start + openTag.length, depth = 1;
  while (i < html.length && depth > 0) {
    const no = html.indexOf('<ul', i), nc = html.indexOf('</ul>', i);
    if (nc < 0) return html;
    if (no >= 0 && no < nc) { depth++; i = no + 3; } else { depth--; i = nc + 5; }
  }
  return html.slice(0, start) + newBlock + html.slice(i);
}

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
let changed = 0, skipped = 0;
for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  if (html.indexOf('<ul class="nav-links">') < 0) { skipped++; continue; }
  const p = pagePath(f);
  const next = replaceUl(replaceUl(html, '<ul class="nav-links">', buildDesktop(p)), '<ul class="nav-mobile-links">', buildMobile(p));
  if (next !== html) { fs.writeFileSync(f, next); changed++; }
}
console.log(`Tools-nav applied to ${changed} pages (${skipped} had no standard nav).`);

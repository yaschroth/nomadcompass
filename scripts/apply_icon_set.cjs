require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Brings every inline icon on the published pages onto the current icon set (IBM Carbon since
 * 2026-10-08). Icons referenced through the sprite (<use href="/assets/icons.svg#...">) change with the
 * sprite and are not touched here. This handles the copies that were written into pages inline:
 *
 *   1. inline nh-icon SVGs (the service generators emit inlineIcon(); ~99,000 on /services pages),
 *      re-rendered by name through lib/icons.cjs;
 *   2. the 12 icons in the city facts panel, matched by the label beside each one, because the
 *      markup carries no icon name (the map below must agree with ICONS in apply_city_facts.cjs);
 *   3. the three contact cards on /contact, matched by their label.
 *
 * Refresh, not insert: every run re-renders what it finds, so it is idempotent and also picks up a
 * later change to the set. Rebuilding the pages through their generators would do the same, but the
 * services chain takes a long time and the facts sweep would also rewrite the facts themselves.
 *
 * Usage: node scripts/apply_icon_set.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const { inlineIcon, ICON_INNER } = require('./lib/icons.cjs');
const { carbonSvg } = require('./lib/carbon.cjs');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tests', 'ui-ux-pro-max-skill', 'components', 'logos', 'public', 'api']);

const FACT = {
  'Currency': 'currency', 'Language': 'language', 'Plugs &amp; power': 'plug', 'Tap water': 'rain-drop',
  'Tipping': 'percentage', 'Ride-hailing': 'car', 'Emergency': 'hospital', 'Mobile data': 'connection-signal',
  'Driving side': 'road', 'Dialling code': 'phone', 'Time zone': 'time', 'Best time to visit': 'calendar',
};
const CONTACT = { 'Email': 'email', 'LinkedIn': 'logo--linkedin', 'Instagram': 'logo--instagram' };

// An inline nh-icon has its viewBox on the <svg>; a sprite reference does not, and is left alone.
const INLINE = /<svg class="nh-icon nh-icon-([a-z0-9-]+)([^"]*)" viewBox="[^"]*"[^>]*>[\s\S]*?<\/svg>/g;
const FACT_RE = /(<span class="fact-ico">)<svg[^>]*>[\s\S]*?<\/svg>(<\/span><span class="fact-text"><span class="fact-label">)([^<]+)(?=<\/span>)/g;
const CONTACT_RE = /(<span class="contact-icon">)<svg[^>]*>[\s\S]*?<\/svg>(<\/span>\s*<span class="contact-card-label">)([^<]+)(?=<\/span>)/g;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

let written = 0, nInline = 0, nFact = 0, nContact = 0;
const unknown = {};
for (const abs of walk(ROOT, [])) {
  const html = fs.readFileSync(abs, 'utf8');
  if (!html.includes('nh-icon nh-icon-') && !html.includes('fact-ico') && !html.includes('contact-icon')) continue;
  let next = html.replace(INLINE, (m, name, extra) => {
    if (!(name in ICON_INNER)) { unknown[name] = (unknown[name] || 0) + 1; return m; }
    nInline++;
    return inlineIcon(name, extra.trim() || undefined);
  });
  next = next.replace(FACT_RE, (m, open, mid, label) => {
    const file = FACT[label];
    if (!file) { unknown['fact:' + label] = (unknown['fact:' + label] || 0) + 1; return m; }
    nFact++;
    return open + carbonSvg(file) + mid + label;
  });
  next = next.replace(CONTACT_RE, (m, open, mid, label) => {
    const file = CONTACT[label];
    if (!file) return m;
    nContact++;
    return open + carbonSvg(file) + mid + label;
  });
  if (next === html) continue;
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}

console.log('Icon set: ' + written + ' page(s) written; ' + nInline + ' inline icons, ' + nFact + ' facts-panel icons, '
  + nContact + ' contact icons re-rendered' + (DRY ? '  [dry run]' : ''));
if (Object.keys(unknown).length) console.log('  left alone (no mapping): ' + JSON.stringify(unknown));

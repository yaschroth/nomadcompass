/**
 * Inline SVG from the vendored IBM Carbon icons (scripts/icons/carbon, Apache-2.0).
 *
 * The sprite names (#sun, icon('scale')) go through scripts/lib/icons.cjs. This is for the few places
 * that carry their own icons outside the sprite: the city facts panel and the contact page. One reader,
 * so every Carbon icon on the site is cleaned the same way.
 *
 * carbonSvg('currency') -> '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">...</svg>'
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'icons', 'carbon');
const cache = {};

function carbonInner(file) {
  if (cache[file]) return cache[file];
  const p = path.join(DIR, file + '.svg');
  if (!fs.existsSync(p)) {
    console.error('carbon: scripts/icons/carbon/' + file + '.svg is missing. Download it from @carbon/icons svg/32.');
    process.exit(1);
  }
  // Same cleaning as build_icons.cjs: no comments, no wrapper, no invisible sizing rectangle.
  cache[file] = fs.readFileSync(p, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/<rect[^>]*(?:Transparent|cls-1)[^>]*\/>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cache[file];
}

function carbonSvg(file) {
  return '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">' + carbonInner(file) + '</svg>';
}

module.exports = { carbonInner, carbonSvg };

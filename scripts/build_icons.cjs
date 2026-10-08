require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Generates the two committed icon assets from IBM Carbon icons (Apache-2.0), vendored as plain SVG
 * files in scripts/icons/carbon/ (with their LICENSE.txt), so the build needs no package install.
 * Switched from Lucide on 2026-10-08: the owner wanted squarer, higher-quality pictograms to go with
 * the square corners and Chakra Petch. The site's own names below stay the same, so nothing that
 * references #sun or icon('scale') had to change; CARBON maps each name to the Carbon file.
 *   - assets/icons.svg        : one cached SVG sprite of <symbol> entries
 *   - scripts/lib/icons.cjs   : the source-of-truth used by every generator/sweep
 *                               (inner markup map, CATEGORY_ICON, WEATHER_ICON, icon()/inlineIcon()).
 * Re-run after adding an icon name below. Idempotent.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CARBON_DIR = path.join(ROOT, 'scripts', 'icons', 'carbon');

// Every symbol the site needs, grouped by purpose (comment only).
const NAMES = [
  // categories (13)
  'sun', 'wallet', 'wifi', 'moon', 'trees', 'shield', 'utensils', 'users',
  'messages-square', 'stamp', 'drama', 'sparkles', 'wind',
  // weather
  'cloud-sun', 'cloud', 'cloud-fog', 'cloud-drizzle', 'cloud-rain', 'cloud-snow',
  'cloud-lightning', 'thermometer',
  // ui marks
  'check', 'x', 'thumbs-up', 'thumbs-down', 'star', 'badge-check',
  // homepage rank tiles
  'gem', 'coins', 'flower-2', 'users-round',
  // homepage tools grid
  'map', 'clock', 'target', 'scale', 'globe', 'trophy',
  // blog footer
  'compass', 'coffee',
  // /services provider categories (legal reuses 'scale' above).
  // 'languages' was named by service_labels.cjs and never built, so the translator category, which
  // is the second largest on the site, had an empty space where its icon goes.
  'stethoscope', 'paw-print', 'brain', 'bone', 'glasses', 'scissors', 'wrench', 'dumbbell',
  'calculator', 'key', 'languages', 'pill-bottle', 'school',
];

// Site name -> Carbon file. Where Carbon has no direct match the nearest honest one is used: vets get
// a person walking a dog, therapy a speech bubble, physio a spine, gyms a runner.
const CARBON = {
  sun: 'sun', wallet: 'wallet', wifi: 'wifi', moon: 'asleep', trees: 'tree', shield: 'security',
  utensils: 'restaurant', users: 'events', 'messages-square': 'forum', stamp: 'stamp', drama: 'theater',
  sparkles: 'clean', wind: 'windy',
  'cloud-sun': 'partly-cloudy', cloud: 'cloudy', 'cloud-fog': 'fog', 'cloud-drizzle': 'rain--drizzle',
  'cloud-rain': 'rain', 'cloud-snow': 'snow', 'cloud-lightning': 'thunderstorm', thermometer: 'temperature',
  check: 'checkmark', x: 'close', 'thumbs-up': 'thumbs-up', 'thumbs-down': 'thumbs-down', star: 'star',
  'badge-check': 'certificate--check',
  gem: 'gem', coins: 'money', 'flower-2': 'sprout', 'users-round': 'user--multiple',
  map: 'map', clock: 'time', target: 'target', scale: 'scales', globe: 'earth', trophy: 'trophy',
  compass: 'compass', coffee: 'cafe',
  stethoscope: 'stethoscope', 'paw-print': 'dog-walker', brain: 'chat', bone: 'spine-label',
  glasses: 'reading--glasses', scissors: 'cut', wrench: 'tool-kit', dumbbell: 'running',
  calculator: 'calculator', key: 'password', languages: 'language', 'pill-bottle': 'medication', school: 'education',
};

// Neither Lucide nor Carbon has a tooth, and dentistry was standing in with 'smile', which reads as a
// mood rather than a molar. This one was drawn on a 24 box; it is scaled to Carbon's 32 box and stroked
// at Carbon's 2-unit line weight with square ends, so it sits with the filled Carbon shapes. Its own
// fill/stroke attributes beat the inherited fill from .nh-icon. Kept here rather than hand-added to
// scripts/lib/icons.cjs, or the next run of this script would drop it.
const CUSTOM = {
  tooth: '<path transform="scale(1.3333)" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" d="M12 5.7c-1.4-1.4-3-2.2-4.7-2.2C4.9 3.5 3 5.6 3 8.4c0 1.7.5 2.9 1 4.1.5 1.3.8 2.9 1 4.7.2 1.8.4 3.8 1.8 3.8 1.2 0 1.5-1.7 1.8-3.5.3-1.9.6-3.6 2.4-3.6s2.1 1.7 2.4 3.6c.3 1.8.6 3.5 1.8 3.5 1.4 0 1.6-2 1.8-3.8.2-1.8.5-3.4 1-4.7.5-1.2 1-2.4 1-4.1 0-2.8-1.9-4.9-4.3-4.9-1.7 0-3.3.8-4.7 2.2z" />',
};

// Pull the inner markup (paths/circles/...) out of a Carbon file, dropping comments, the outer <svg>
// wrapper and Carbon's invisible sizing rectangle (fill:none in Carbon's own CSS; under fill:currentColor
// it would paint the whole box). Collapse to a single line.
function innerOf(name) {
  const file = CARBON[name];
  if (!file) { console.error('build_icons: no Carbon file mapped for "' + name + '"'); process.exit(1); }
  const raw = fs.readFileSync(path.join(CARBON_DIR, file + '.svg'), 'utf8');
  const body = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/<rect[^>]*(?:Transparent|cls-1)[^>]*\/>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return body;
}

const inner = {};
for (const n of NAMES) inner[n] = innerOf(n);
Object.assign(inner, CUSTOM);
const ALL = NAMES.concat(Object.keys(CUSTOM));

// 1. assets/icons.svg sprite. Carbon icons are filled shapes on a 32 box; fill="currentColor" on each
//    <symbol> lets an external <use> take the host's colour; .nh-icon in CSS is the sizing hook.
const symbolAttrs = 'viewBox="0 0 32 32" fill="currentColor"';
const symbols = ALL.map((n) => `  <symbol id="${n}" ${symbolAttrs}>${inner[n]}</symbol>`).join('\n');
const sprite =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n` +
  `<!-- Icons from IBM Carbon (Apache-2.0). Built by scripts/build_icons.cjs. Do not edit by hand. -->\n` +
  symbols +
  `\n</svg>\n`;
fs.writeFileSync(path.join(ROOT, 'assets', 'icons.svg'), sprite);
console.log('assets/icons.svg written (' + ALL.length + ' symbols)');

// 2. scripts/lib/icons.cjs source-of-truth.
const CATEGORY_ICON = {
  climate: 'sun', cost: 'wallet', wifi: 'wifi', nightlife: 'moon', nature: 'trees',
  safety: 'shield', food: 'utensils', community: 'users', english: 'messages-square',
  visa: 'stamp', culture: 'drama', cleanliness: 'sparkles', airquality: 'wind',
};
// Open-Meteo WMO weather_code -> icon name.
const WEATHER_ICON = {
  0: 'sun', 1: 'cloud-sun', 2: 'cloud-sun', 3: 'cloud',
  45: 'cloud-fog', 48: 'cloud-fog',
  51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
  61: 'cloud-drizzle', 63: 'cloud-rain', 65: 'cloud-rain',
  71: 'cloud-snow', 73: 'cloud-snow', 75: 'cloud-snow',
  80: 'cloud-drizzle', 81: 'cloud-rain', 82: 'cloud-lightning',
  95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning',
};

const lib =
`/**
 * Source of truth for the site's icon system. Generated by scripts/build_icons.cjs
 * from IBM Carbon (Apache-2.0). Symbols live in the cached sprite /assets/icons.svg; helpers below emit
 * either a <use> reference (default, light) or fully inline SVG (for contexts that cannot rely
 * on the external sprite). Used by every generator/sweep so all icons stay identical.
 */
'use strict';

// Inner markup per symbol (for inlineIcon()).
const ICON_INNER = ${JSON.stringify(inner, null, 2)};

const CATEGORY_ICON = ${JSON.stringify(CATEGORY_ICON, null, 2)};
const WEATHER_ICON = ${JSON.stringify(WEATHER_ICON, null, 2)};

const SYMBOL_ATTRS = 'viewBox="0 0 32 32" fill="currentColor"';

// Reference the cached sprite (preferred).
function icon(name, extraClass) {
  const cls = 'nh-icon nh-icon-' + name + (extraClass ? ' ' + extraClass : '');
  return '<svg class="' + cls + '" aria-hidden="true"><use href="/assets/icons.svg#' + name + '"></use></svg>';
}

// Self-contained inline SVG (no sprite dependency).
function inlineIcon(name, extraClass) {
  const cls = 'nh-icon nh-icon-' + name + (extraClass ? ' ' + extraClass : '');
  return '<svg class="' + cls + '" ' + SYMBOL_ATTRS + ' aria-hidden="true">' + (ICON_INNER[name] || '') + '</svg>';
}

module.exports = { ICON_INNER, CATEGORY_ICON, WEATHER_ICON, icon, inlineIcon, SYMBOL_ATTRS };
`;
fs.mkdirSync(path.join(ROOT, 'scripts', 'lib'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'scripts', 'lib', 'icons.cjs'), lib);
console.log('scripts/lib/icons.cjs written');

// 3. Runtime helper in cities-data.js (globals for pages that render icons in JS,
//    e.g. compare.html categories). Idempotent: replace the marked block, or append.
{
  const p = path.join(ROOT, 'cities-data.js');
  let s = fs.readFileSync(p, 'utf8');
  const START = '// >>> nh-icons runtime (generated by scripts/build_icons.cjs)';
  const END = '// <<< nh-icons runtime';
  const block =
    START + '\n' +
    'var NH_CATEGORY_ICON = ' + JSON.stringify(CATEGORY_ICON) + ';\n' +
    'var NH_WEATHER_ICON = ' + JSON.stringify(WEATHER_ICON) + ';\n' +
    'function icon(name, extraClass){\n' +
    "  var cls = 'nh-icon nh-icon-' + name + (extraClass ? ' ' + extraClass : '');\n" +
    "  return '<svg class=\"' + cls + '\" aria-hidden=\"true\"><use href=\"/assets/icons.svg#' + name + '\"></use></svg>';\n" +
    '}\n' +
    END;
  const re = new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END);
  if (re.test(s)) {
    s = s.replace(re, block);
  } else {
    s = s.replace(/\s*$/, '') + '\n\n' + block + '\n';
  }
  fs.writeFileSync(p, s);
  console.log('cities-data.js: nh-icons runtime helper injected');
}

/**
 * Site style rule: NO em-dashes anywhere. Replace every em-dash (— / &mdash; /
 * &#8212;) with ", " (comma) and collapse the surrounding horizontal whitespace.
 * Safe: only targets em-dash chars/entities (never hyphens or number commas).
 * Covers all HTML pages + the generator output strings so they don't reappear.
 * Idempotent. Usage: node scripts/strip_emdashes.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function strip(s) {
  let out = s.replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ');
  out = out.replace(/,[ \t]*,/g, ', '); // collapse accidental double comma
  return out;
}

const files = [];
for (const f of ['index.html', 'cities.html', 'wheel.html', 'blog.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'disclosure.html', '404.html', 'rentals.html', 'login.html', 'signup.html', 'profile.html']) {
  if (fs.existsSync(path.join(ROOT, f))) files.push(f);
}
for (const d of ['cities', 'blog', 'accommodations', 'about']) {
  const dir = path.join(ROOT, d);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) files.push(path.join(d, f));
}
// generator OUTPUT strings (so regeneration stays clean)
for (const g of ['scripts/generate_core_pages.cjs', 'scripts/create_accommodation_pages.js', 'scripts/city-hero-score.js', 'scripts/generate_city_pages.js']) {
  if (fs.existsSync(path.join(ROOT, g))) files.push(g);
}

let changed = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const b = fs.readFileSync(abs, 'utf8');
  const o = strip(b);
  if (o !== b) { fs.writeFileSync(abs, o); changed++; }
}
console.log('em-dashes stripped in', changed, 'files');

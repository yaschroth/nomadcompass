/**
 * Replaces each city page's CATEGORY_DESCRIPTIONS object with researched 50-100
 * word descriptions. Reads cats-<slug>.json (13 keys) from argv[2].
 * Validates all 13 keys, strips em-dashes, and swaps the object in place.
 * Usage: node scripts/apply_city_tiles.cjs "<dir with cats-*.json>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const stripDash = (s) => s.replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ').replace(/,[ \t]*,/g, ', ');
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

let ok = 0, fail = 0;
const warn = [];
for (const file of fs.readdirSync(DIR).filter((f) => /^cats-.+\.json$/.test(f))) {
  const slug = file.replace(/^cats-/, '').replace(/\.json$/, '');
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); fail++; continue; }
  let obj;
  try { obj = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, '')); }
  catch (e) { console.error('BAD JSON:', slug, e.message); fail++; continue; }
  const missing = KEYS.filter((k) => !obj[k] || !String(obj[k]).trim());
  if (missing.length) { console.error('MISSING KEYS:', slug, missing.join(',')); fail++; continue; }
  const clean = {};
  for (const k of KEYS) {
    clean[k] = stripDash(String(obj[k]).trim());
    const n = wc(clean[k]);
    if (n < 45 || n > 110) warn.push(`${slug}.${k}=${n}w`);
  }
  let s = fs.readFileSync(page, 'utf8');
  const re = /const CATEGORY_DESCRIPTIONS = \{[\s\S]*?\};/;
  if (!re.test(s)) { console.error('NO CATEGORY_DESCRIPTIONS:', slug); fail++; continue; }
  s = s.replace(re, () => 'const CATEGORY_DESCRIPTIONS = ' + JSON.stringify(clean) + ';');
  fs.writeFileSync(page, s);
  ok++;
}
console.log(`tiles applied: ${ok} | failed: ${fail}`);
if (warn.length) console.log('word-count warnings (outside 45-110):', warn.join(', '));

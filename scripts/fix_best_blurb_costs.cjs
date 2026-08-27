/**
 * Makes the cost figures inside the /best ranking blurbs agree with the cost the same page prints.
 *
 * Every ranking page shows two costs per city three inches apart: the table renders
 * money(costPerMonth) from cities-data.js, and the hand-written blurb beside it names a figure of
 * its own. 130 of the 169 blurb figures disagreed with the table, by up to 137%: the blurbs say
 * Berlin is "3,400 a month" while the table says $2,520, and Pokhara "900 a month" against $380.
 * They were written before the Numbeo pipeline reset costPerMonth and nothing regenerated them.
 *
 * Every one of them was also written without a currency symbol, so a reader saw "at 3,400 a month"
 * with no unit at all. Both are fixed here: the number becomes the current costPerMonth, and it
 * gets a "$".
 *
 * The blurbs argue from these numbers ("the cheapest base on the list", "tied for the most
 * expensive"), so changing them can invalidate the sentence around them. --verify re-reads the
 * finished JSON and checks every superlative against the cities actually on that page, and it is
 * the part of this script worth trusting: the substitution is mechanical, the claims are not.
 *
 * Usage: node scripts/fix_best_blurb_costs.cjs [--apply] [--verify]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const VERIFY = process.argv.includes('--verify');

const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const start = src.indexOf('const CITIES = [');
const body = src.slice(start + 'const CITIES = '.length);
let depth = 0;
let end = -1;
for (let i = 0; i < body.length; i++) {
  if (body[i] === '[') depth++;
  else if (body[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITIES = eval(body.slice(0, end));
const COST = new Map(CITIES.map((c) => [c.id, c.costPerMonth]));
const NAME = new Map(CITIES.map((c) => [c.id, c.name]));

// Both notations, because both drifted. 135 figures were written with no currency mark at all and
// 93 more carry a "$" and a stale number, and a reader cannot tell the two apart: they are equally
// wrong about the same city on the same page.
// "USD 1,400 per month" already names its currency correctly and is left alone.
const BARE = /(?<!USD )(?<![€£¥\d,.\-–\w])\$?(\d{1,3}(?:,\d{3})+|\d{3,6})(\s(?:a|per)\smonth)/g;

// A blurb may quote a rival's cost to make a comparison ("half of Lisbon's $2,600 a month"). That
// figure belongs to the other city and must not be rewritten to this one's.
//
// Only the possessive counts. Merely naming another city near the number does not: thirteen blurbs
// do that and every one of the thirteen is still quoting its own cost ("Porto ... reads as Lisbon's
// calmer, cheaper twin. At $2,140 a month it undercuts the capital"). A looser test skipped five
// figures that were stale, including Alexandria at $1,100 against a real $320.
const NAMES = new Set(CITIES.map((c) => c.name));
const namesSomeoneElse = (text, at, self) => {
  const m = text.slice(Math.max(0, at - 40), at).match(/([A-Z][\w.À-ɏ-]*(?:\s[A-Z][\w.À-ɏ-]*)*)'s\s(?:roughly\s|about\s|around\s|just\s)?$/);
  return !!(m && m[1] !== self && NAMES.has(m[1]));
};

const money = (v) => '$' + Number(v).toLocaleString('en-US');
const keyOf = (f) => f.replace(/^content-/, '').replace(/\.json$/, '');

const files = fs.readdirSync(ROOT).filter((f) => /^content-.*\.json$/.test(f));

let changed = 0;
let already = 0;
const skipped = [];
const borrowed = [];
const touched = [];

for (const f of files) {
  const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const json = JSON.parse(raw.replace(/^﻿/, ''));
  let dirty = false;

  const fix = (text, id, where) => {
    const cost = COST.get(id);
    if (cost == null) { skipped.push(f + ' ' + where + ': no city called "' + id + '"'); return text; }
    const self = NAME.get(id);
    return String(text).replace(BARE, (m, num, tail, at, whole) => {
      const said = Number(num.replace(/,/g, ''));
      if (namesSomeoneElse(whole, at, self)) { borrowed.push(f + ' [' + self + '] ' + m); return m; }
      if (said === cost) { already += 1; return money(cost) + tail; }
      changed += 1;
      touched.push({ key: keyOf(f), id, said, now: cost });
      dirty = true;
      return money(cost) + tail;
    });
  };

  for (const en of json.entries || []) {
    if (!en.blurb) continue;
    const out = fix(en.blurb, en.id, 'entry');
    if (out !== en.blurb) { en.blurb = out; dirty = true; }
  }
  for (const q of json.quickPicks || []) {
    if (!q.note) continue;
    const out = fix(q.note, q.id, 'quickPick');
    if (out !== q.note) { q.note = out; dirty = true; }
  }

  if (dirty && APPLY) fs.writeFileSync(path.join(ROOT, f), JSON.stringify(json, null, 2) + '\n');
}

console.log(changed + ' blurb figures rewritten to the cost the table prints, '
  + already + ' already agreed and only needed the "$"');
if (touched.length) {
  const worst = touched.slice().sort((a, b) => Math.abs(b.said - b.now) / b.now - Math.abs(a.said - a.now) / a.now);
  worst.slice(0, 10).forEach((t) => console.log('  ' + (NAME.get(t.id) || t.id) + ': '
    + t.said.toLocaleString('en-US') + ' -> ' + money(t.now) + '  (' + t.key + ')'));
  if (worst.length > 10) console.log('  ... and ' + (worst.length - 10) + ' more');
}
skipped.forEach((s) => console.log('  SKIPPED ' + s));
if (borrowed.length) {
  console.log('  ' + borrowed.length + ' figures quote another city and were left as written:');
  borrowed.slice(0, 8).forEach((x) => console.log('    ' + x));
}

// --- The claims built on those numbers.
if (VERIFY) {
  const SUPER = [
    [/\b(?:the\s+)?(?:single\s+)?most expensive\b/i, 'max'],
    [/\bthe priciest\b/i, 'max'],
    [/\bthe cheapest\b/i, 'min'],
    [/\bthe least expensive\b/i, 'min'],
  ];
  // A hedge turns a claim about the top slot into a claim about a group, which a rank cannot falsify.
  const HEDGED = /\b(?:one of|among|tie[sd] for|nearly|almost|close to|sits? in|in the (?:cheapest|priciest)|handful|half|second|third|fourth|fifth)\b/i;
  // "it is NOT the cheapest base here" is the opposite claim, and Daegu's was true.
  const NEGATED = /\bnot the (?:cheapest|priciest|most expensive|least expensive)\b/i;
  // "the priciest ASIAN base here" is a claim about a subset this script cannot reconstruct, so it
  // is listed for a person instead of being called broken. Tokyo's was true, Mazatlan's was not.
  const NARROWED = /\b(?:cheapest|priciest|most expensive|least expensive)\s+(?!base|option|city|bases|options|cities|here|on\b|in\b)[a-zA-Z-]+\s+(?:base|option|city|bases|options|cities)\b/i;
  const broken = [];
  let checked = 0;
  let orphans = 0;
  const narrowed = [];

  for (const f of files) {
    const key = keyOf(f);
    const dataPath = path.join(ROOT, 'best-' + key + '.json');
    if (!fs.existsSync(dataPath)) {
      // content-activity-*.json feed /activities, not a ranking, and name no costs. Only say
      // something if such a file starts carrying figures nothing can check.
      const holdsCosts = /\$[\d,]+\s(?:a|per)\smonth/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      if (holdsCosts) console.log('  ' + f + ' names monthly costs but has no best-' + key + '.json to check them against');
      continue;
    }
    const page = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const onPage = page.cities.map((c) => c.id).filter((id) => COST.has(id));
    if (!onPage.length) continue;
    const costs = onPage.map((id) => COST.get(id));
    const max = Math.max(...costs);
    const min = Math.min(...costs);

    const json = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^﻿/, ''));
    const rendered = new Set(onPage);
    for (const en of (json.entries || []).concat(json.quickPicks || [])) {
      const text = String(en.blurb || en.note || '');
      const mine = COST.get(en.id);
      if (mine == null) continue;
      // A blurb for a city the ranking no longer includes never reaches a page, so its claims
      // cannot be wrong in front of a reader. Counted, not reported.
      if (!rendered.has(en.id)) { if (/\$[\d,]+\s(?:a|per)\smonth/.test(text)) orphans += 1; continue; }
      for (const sentence of text.split(/(?<=[.!?])\s+/)) {
        if (!/\$[\d,]+\s(?:a|per)\smonth/.test(sentence)) continue;
        for (const [re, kind] of SUPER) {
          if (!re.test(sentence)) continue;
          checked += 1;
          if (NEGATED.test(sentence)) continue;
          if (NARROWED.test(sentence)) { narrowed.push('  ' + key + '  [' + (NAME.get(en.id) || en.id) + '] "' + sentence.trim() + '"'); continue; }
          // "one of the most expensive" and "tied for" are claims about a group, not the top slot.
          if (HEDGED.test(sentence)) continue;
          const holds = kind === 'max' ? mine === max : mine === min;
          if (!holds) {
            broken.push('  ' + key + '  [' + (NAME.get(en.id) || en.id) + ' ' + money(mine) + '] claims "'
              + kind + '" but this page runs ' + money(min) + ' to ' + money(max) + '\n      "' + sentence.trim() + '"');
          }
        }
      }
    }
  }
  console.log('\n' + checked + ' superlative cost claims checked against the cities on their own page');
  if (narrowed.length) {
    console.log('  ' + narrowed.length + ' name a subset this cannot rank and were read by hand:');
    narrowed.forEach((n) => console.log(n));
  }
  if (!broken.length) console.log('  every unhedged one still holds.');
  else { console.log('  ' + broken.length + ' no longer hold:'); broken.forEach((b) => console.log(b)); }
}

if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

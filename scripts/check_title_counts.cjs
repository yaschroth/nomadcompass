/**
 * A number in a city-and-service title counts the people the title describes, not the page.
 *
 * "2111 English-speaking doctors in Tokyo" sat over 1,966 who are; the other 145 work in Chinese or
 * Korean only. 158 pair pages had a title like that, because the skeletons put the page total
 * beside a language. Search shows the title, so it is the one claim every reader sees.
 *
 * This reads the <title> each page actually carries, finds the languages it names, and requires
 * every number in it to equal the providers listed there who work in at least one of them.
 *
 * Usage: node scripts/check_title_counts.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-pair-pages.json'), 'utf8'));

// Longest names first, so "Brazilian Portuguese" would be found before "Portuguese".
const NAMES = Object.entries(M.LANGS).sort((a, b) => b[1].length - a[1].length);

const bad = [];
let checked = 0;
for (const p of pages) {
  const file = path.join(ROOT, p.file);
  if (!fs.existsSync(file)) continue;
  const m = /<title>([^<]*)<\/title>/.exec(fs.readFileSync(file, 'utf8'));
  if (!m) continue;
  const title = m[1].replace(/\s*\|\s*The Nomad HQ\s*$/, '');
  let rest = title;
  const codes = [];
  for (const [code, name] of NAMES) {
    const re = new RegExp('\\b' + name + '\\b');
    if (re.test(rest)) { codes.push(code); rest = rest.replace(re, ' '); }
  }
  const numbers = (title.match(/\b\d+\b/g) || []).map(Number);
  if (!codes.length || !numbers.length) continue;
  checked++;
  const rows = M.pairOf(p.city, p.service).rows;
  const want = rows.filter((r) => codes.some((c) => r.languages.includes(c))).length;
  numbers.filter((n) => n !== want).forEach((n) => bad.push(`${p.url}: "${title}" says ${n}, ${want} work in ${codes.join('/')}`));
}

if (bad.length) {
  console.error(`check_title_counts: ${bad.length} title(s) count more or fewer than they name`);
  bad.slice(0, 15).forEach((b) => console.error('  ' + b));
  process.exit(1);
}
console.log(`clean: ${checked} titles with a count, each equal to the providers working in the languages it names.`);

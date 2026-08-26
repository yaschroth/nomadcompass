require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Makes every city page in a country state the same nomad-visa income threshold, and say what rule
 * produces it.
 *
 * A nomad visa is a national rule, so one country should be one number. Twenty-one Spanish pages
 * carried eleven different figures, from $2,490 to $3,280, because each was written when that city
 * was built and most of these thresholds are pegged to a wage that rises every year. Romania's four
 * pages spanned 51%. /nomad-visas disagreed with all of them.
 *
 * Each figure below was checked against the rule behind it rather than copied from one source, and
 * the rule goes on the page next to the number. That is the part that matters: a bare figure rots
 * silently, while "200% of Spain's minimum wage" tells the next reader what to recompute and tells
 * the next writer why the number moved.
 *
 * Verified 2026-08-26. Converted from the legal amount at assets/fx-usd.json (01 Aug 2026), which is
 * the same rate the Cost Index prints, so the site is internally consistent.
 *
 *   Spain      EUR 2,849/mo   200% of the SMI. The SMI is EUR 1,221 x 14 payments, and the UGE works
 *                             from the annual figure, which is why it is not simply double 1,221.
 *   Portugal   EUR 3,680/mo   4x the national minimum wage, which rose to EUR 920 in January 2026.
 *   Croatia    EUR 3,622.50   2.5x the average net salary, set in Narodne novine 3/26.
 *   Romania    RON 29,604/mo  3x the average gross salary per INS. Renewals drop to 1x.
 *   Mexico     680 x the daily UMA in income, or 11,460 x it in savings. Consulates have applied
 *              this with real variation since the July 2025 switch from the minimum wage to the UMA.
 *
 * Usage: node scripts/apply_visa_thresholds.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const COUNTRIES = {
  Spain: {
    usd: 3280,
    rule: "That floor is 200% of Spain's minimum wage, so it rises whenever the wage does.",
    toolRule: 'About 200% of Spain’s minimum wage, so it rises with the wage; more if you bring family.',
  },
  Portugal: {
    usd: 4240,
    rule: 'That floor is four times the Portuguese minimum wage, so it rises whenever the wage does.',
    toolRule: 'Four times the Portuguese minimum wage, so it rises with the wage.',
  },
  Croatia: {
    usd: 4170,
    rule: "That floor is 2.5 times Croatia's average net salary, so it moves with the national average.",
    toolRule: 'Two and a half times the Croatian average net salary, so it moves with the national average.',
    tool: { duration: '18 months' },
  },
  Romania: {
    usd: 6490,
    rule: "That floor is three times Romania's average gross salary, so it moves with the national average. Renewals are assessed at one times the average instead.",
    toolRule: 'Three times the Romanian average gross wage; renewals are assessed at one times it.',
  },
  Ecuador: {
    usd: 1446,
    rule: "That floor is three times Ecuador's unified basic salary, which is $482 for 2026, so it rises when that salary does. Ecuador uses the US dollar, so there is no conversion to watch.",
    toolRule: 'Three times Ecuador’s unified basic salary, which is $482 for 2026. The country uses the US dollar.',
  },
  Montenegro: {
    usd: 2070,
    rule: "That floor is three times Montenegro's minimum wage, and the wage itself depends on your education, so applicants with a bachelor's degree or higher are assessed at about $2,760 rather than $2,070. The scheme is currently legislated to close at the end of 2026.",
    toolRule: 'Three times the minimum wage, which is education-dependent: about $2,760 with a degree. Legislated to close at the end of 2026.',
  },
  Mexico: {
    usd: 4600,
    savings: 77500,
    rule: 'Both are set from the daily UMA, Mexico’s index unit: 680 times it in income, or 11,460 times it as a balance. Consulates have applied them with real variation since the 2025 switch away from the minimum wage.',
    toolRule: 'Set from the UMA index unit, not the minimum wage; a savings balance of about $77,500 works instead. Consulates vary.',
  },
};

const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const arr = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
let d = 0;
let end = -1;
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === '[') d += 1;
  else if (arr[i] === ']') { d -= 1; if (d === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const byId = new Map(eval(arr.slice(0, end)).map((c) => [c.id, c.country]));

const MONEY = /\$\d[\d,]*(?:\s*(?:-|–|to)\s*\$?\d[\d,]*)?/;
const MONEY_G = /\$\d[\d,]*(?:\s*(?:-|–|to)\s*\$?\d[\d,]*)?/g;
const INCOMEY = /\b(income|earn(?:ing|s)?|salary|threshold|proof of)\b/i;
// A savings or bank-balance figure is a different test with a different number. Skipping any
// sentence that mentioned one left five Mexican pages untouched, because Mexico's scheme states
// both in a single clause: "roughly $3,700 in monthly income or $73,000 in savings". So the two are
// told apart by where they sit relative to the savings word, and each is set from its own rule.
const SAVINGS_WORD = /\b(savings|in the bank|bank balance|assets|investment balance)\b/i;

/** Rewrite the income figure, and the savings figure separately if the sentence states one. */
function setFigures(sentence, income, savings) {
  if (!SAVINGS_WORD.test(sentence) || !savings) return sentence.replace(MONEY, income);
  // The two tests are alternatives and the sentences say so: "income around $3,700 per month OR
  // $73,000 in savings". Splitting on that "or" is what tells them apart. Measuring which keyword
  // sits nearest each figure does not, because "monthly income or $73,000 in savings" puts the word
  // "income" one character closer to the savings figure than the word "savings" is, which produced
  // a page reading "$4,600 in monthly income or $4,600 in savings".
  return sentence.split(/(\s+or\s+)/).map((chunk, i) => {
    if (i % 2 === 1) return chunk;                        // the captured " or "
    if (!MONEY.test(chunk)) return chunk;
    return chunk.replace(MONEY, SAVINGS_WORD.test(chunk) ? savings : income);
  }).join('');
}

let pages = 0;
let ruleAdded = 0;
const skipped = [];
const samples = [];

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const id = f.replace('.html', '');
  const spec = COUNTRIES[byId.get(id)];
  if (!spec) continue;

  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  const i = html.lastIndexOf('{"climate"');
  if (i < 0) continue;
  const j = html.indexOf('};', i);
  let notes;
  try { notes = JSON.parse(html.slice(i, j + 1)); } catch (e) { continue; }
  const visa = String(notes.visa || '');
  if (!visa) continue;

  const sentences = visa.split(/(?<=[.!?])\s+/);
  const target = sentences.findIndex((s) => MONEY.test(s) && INCOMEY.test(s));
  if (target < 0) { skipped.push(id + ': no income sentence with a figure'); continue; }

  const want = '$' + spec.usd.toLocaleString('en-US');
  const save = spec.savings ? '$' + spec.savings.toLocaleString('en-US') : null;
  const before = sentences[target];
  sentences[target] = setFigures(before, want, save);

  // Only append the rule if the page does not already explain where the number comes from.
  const explains = /\b(minimum wage|average (?:net|gross)? ?salary|average gross wage|UMA|SMI|times the)\b/i;
  let added = false;
  if (!explains.test(visa)) {
    sentences.splice(target + 1, 0, spec.rule);
    added = true;
    ruleAdded += 1;
  }

  const next = Object.assign({}, notes, { visa: sentences.join(' ') });
  if (samples.length < 6) {
    samples.push('  ' + id + '\n    was  ' + before.slice(0, 140)
      + '\n    now  ' + sentences[target].slice(0, 140) + (added ? '\n    +    ' + spec.rule.slice(0, 120) : ''));
  }
  pages += 1;

  if (!APPLY) continue;
  const out = html.slice(0, i) + JSON.stringify(next) + html.slice(j + 1);
  const bad = [...out.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .some((s) => { try { new Function(s[1]); return false; } catch (e) { return true; } });
  if (bad) { console.error('  SKIP ' + f + ': would not parse'); continue; }
  fs.writeFileSync(p, out);
}

// --- the tool the city pages should agree with
const visaPath = path.join(ROOT, 'nomad-visas.html');
let visaHtml = fs.readFileSync(visaPath, 'utf8');
let toolRows = 0;
for (const [country, spec] of Object.entries(COUNTRIES)) {
  const re = new RegExp("('" + country + "','[a-z]{2}','[^']{3,60}',)(\\d+)(,')([^']*)(','[a-z-]+',')([^']*)(')");
  if (!re.test(visaHtml)) { skipped.push('nomad-visas: no row for ' + country); continue; }
  visaHtml = visaHtml.replace(re, (m, head, oldUsd, a, duration, b, oldRule, tail) => {
    toolRows += 1;
    const dur = spec.tool && spec.tool.duration ? spec.tool.duration : duration;
    return head + spec.usd + a + dur + b + spec.toolRule + tail;
  });
}
if (APPLY && toolRows) fs.writeFileSync(visaPath, visaHtml);

console.log(pages + ' city pages set to their country figure, rule added to ' + ruleAdded + ' of them');
console.log(toolRows + ' /nomad-visas rows updated to match\n');
samples.forEach((s) => console.log(s));
if (skipped.length) {
  console.log('\n  not touched (' + skipped.length + '):');
  skipped.slice(0, 14).forEach((s) => console.log('    ' + s));
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

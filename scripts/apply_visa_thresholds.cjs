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
 * Re-verified 2026-09-29 (research findings of 2026-09-26), same fx file:
 *
 *   Spain      Unchanged. US consulates (Washington) state the same yearly floor as 200% of the
 *              MONTHLY SMI over 14 payments, EUR 2,442 (~$2,810). Same EUR 34,188 a year, so the
 *              figure stays and the tool note now names both readings.
 *   Portugal   Unchanged figure (EUR 3,680 = $4,236 at the fx file). The D8 residence permit is
 *              2 years, renewable for 3 (Lei 23/2007 art. 75), not "1 year, renewable to 5".
 *   Croatia    Unchanged figure. MUP: granted for up to 18 months; a shorter grant can be extended
 *              by up to 6 months.
 *   S. Korea   The F-1-D became permanent on 30 Jun 2026 (MoJ press release 7 Jul 2026). The floor
 *              is 1x to 2x GNI per head (2025 base KRW 52.41m) by age AND region: capital region
 *              18-34 1.5x, 35+ or family 2x; elsewhere 18-34 1x, 35+ or family 1.5x. One monthly
 *              number cannot say that, so Korean city pages are written by hand (pages: false) and
 *              only the tool row, which shows the lowest tier, is set from here.
 *   Colombia   COP 5,252,715/mo: 3x the 2026 SMMLV of COP 1,750,905 (Decreto 0159 de 2026; the rule
 *              is Resolucion 5477 de 2022 art. 46).
 *
 * The /nomad-visas prose states how many visas the table holds. That count is rewritten from the
 * VISAS array on every run, so removing or adding a row cannot leave "more than 40" behind.
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
    toolRule: 'About 200% of Spain’s minimum wage, so it rises with the wage; more if you bring family. Some consulates, Washington among them, state the same yearly floor as about $2,810 a month over fourteen payments.',
  },
  Portugal: {
    usd: 4240,
    rule: 'That floor is four times the Portuguese minimum wage, so it rises whenever the wage does.',
    toolRule: 'Four times the Portuguese minimum wage, so it rises with the wage.',
    tool: { duration: '2-year permit, renewable for 3' },
  },
  Croatia: {
    usd: 4170,
    rule: "That floor is 2.5 times Croatia's average net salary, so it moves with the national average.",
    toolRule: 'Two and a half times the Croatian average net salary, so it moves with the national average. A shorter grant can be extended by up to six months.',
    tool: { duration: 'Up to 18 months' },
  },
  Colombia: {
    usd: 1640,
    rule: "That floor is three times Colombia's monthly minimum wage, which is set every year, so it rises whenever the wage does.",
    toolRule: 'Three times Colombia’s monthly minimum wage, so it rises with the wage every year.',
    tool: { duration: 'Up to 2 years' },
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
  'South Africa': {
    usd: 3280,
    // Unlike every other entry here, this one is NOT pegged to a wage. It is a flat rand figure
    // (R650,796/yr) set in the October 2024 regulations, cut from the R1,000,000 the scheme opened
    // with, so it only moves when the regulations are amended or when the rand does. Verified
    // 2026-09-12. Per nomadhq-prices-usd the rand amount never goes on the page, only the rule.
    rule: 'That floor is a flat rand figure set in the October 2024 regulations rather than a wage-pegged one, so the dollar equivalent moves with the currency rather than with any wage.',
    toolRule: 'A flat rand amount from the October 2024 rules, cut from the opening figure; the dollar value moves with the currency, not a wage.',
    tool: { duration: 'Up to 3 years' },
  },
  'South Korea': {
    // The LOWEST tier: 1x GNI per head (2025 base KRW 52.41m) for ages 18-34 outside Seoul, Incheon
    // and Gyeonggi, KRW 4.37m a month. The top tier (2x, capital region, 35+ or family) is $6,070.
    // The F-1-D became a permanent category on 2026-06-30 and the stay went from 2 years to 3.
    usd: 3030,
    // The floor depends on the city (capital region or not) and on the applicant's age, so no single
    // monthly figure is right for every Korean page. pages: false keeps this script off them; they
    // were written by hand on 2026-09-29 with the tiers that apply to each city. Before this guard
    // the script wrote "$6,070 annual remote income" on Busan and appended the rule sentence twice.
    pages: false,
    rule: "That floor is set from Korea's gross national income per head by age and region, from one times for applicants aged 18 to 34 outside Seoul, Incheon and Gyeonggi to twice for applicants 35 and over, or families, inside them.",
    toolRule: 'One to two times Korea’s GNI per head, by age and region: about $3,030 a month for ages 18 to 34 outside Seoul, Incheon and Gyeonggi, rising to about $6,070 for ages 35 and over, or families, in that capital region.',
    tool: { duration: 'Up to 3 years' },
  },
  'Czech Republic': {
    // Digital Nomad Program (MPO, Government Resolution No. 475 of 2023): income of at least 1.5x the
    // average gross annual salary announced by the Ministry of Labour and Social Affairs. The current
    // announcement is Sdeleni 44/2026 Sb., CZK 590,580 a year (CZK 49,215 a month), valid 1 May 2026
    // to 30 April 2027, so the floor is CZK 73,823 a month = $3,512 at the fx file. Open only to
    // citizens of 13 countries (MPO list, 1 Jul 2025: Australia, Brazil, India, Israel, Japan,
    // Canada, South Korea, Mexico, New Zealand, Singapore, UK, US, Taiwan) in IT or marketing.
    // Verified 2026-09-29. The 2023 embassy figure (CZK 60,530 = 1.5 x 40,353) confirms the method.
    usd: 3510,
    rule: 'That floor is one and a half times the Czech average gross salary, which the labour ministry announces every year, so it moves with the national average.',
    toolRule: 'One and a half times the Czech average gross salary, which the labour ministry announces every year. Open only to citizens of 13 countries, the US, UK, Canada and Australia among them, in IT or marketing work.',
  },
  Moldova: {
    // Digital nomad residence right since 20 September 2025: Law 144/2025 added art. 37^2 to Law
    // 200/2010. The floor is "18 salarii medii prognozate ... pentru ultimele 6 luni" (three a month),
    // text as approved by the government (gov.md, nu-665-mded-2024.pdf). The forecast average monthly
    // salary for 2026 is MDL 17,400 (Government decision on 916-MMPS-2025), so MDL 52,200 a month =
    // $2,973 at the fx file. Up to two years, renewable. Verified 2026-09-29.
    usd: 2970,
    rule: "That floor is three times Moldova's forecast average monthly salary, which the government sets every year, so it rises when the forecast does.",
    toolRule: 'Three times Moldova’s forecast average monthly salary, which the government sets every year, earned from a company registered outside Moldova over the six months before you apply.',
    tool: { duration: 'Up to 2 years, renewable' },
  },
  Italy: {
    // DM 29 Feb 2024 (Gazzetta Ufficiale n. 79, 4 Apr 2024), art. 2: income "non inferiore al triplo
    // del livello minimo previsto per l'esenzione dalla partecipazione alla spesa sanitaria". The US
    // consulates (New York, Los Angeles, Boston) state that as EUR 24,789 a year (3 x EUR 8,263.31) =
    // $28,536 at the fx file, so $2,380 a month. London rounds the base up to EUR 8,500 (EUR 25,500,
    // about $29,350). The old $32,230 (EUR 28,000) had no consulate behind it. Verified 2026-10-01.
    // Every Italian page states the floor ANNUALLY ($28,540 a year), which the sentence logic below
    // would skip anyway, so the pages were written by hand on 2026-10-01 (pages: false).
    usd: 2380,
    pages: false,
    rule: "That floor is three times Italy's income threshold for exemption from health charges, so it moves when that threshold does.",
    toolRule: 'About $28,540 a year, three times Italy’s income threshold for exemption from health charges, as the US consulates state it; London’s consulate rounds the base up and asks about $29,350. Health cover required.',
  },
  // Added 2026-10-05 (TODO 0e): two pages each had denied these schemes existed. Both floors are set
  // in US dollars by the scheme itself, so no conversion and no wage peg to recompute.
  Brazil: {
    usd: 1500,
    savings: 18000,
    rule: 'Both figures are fixed in US dollars by CNIg Resolution 45 of 2021, which created the VITEM XIV, so they do not move with the real.',
    toolRule: 'Fixed in US dollars by CNIg Resolution 45/2021; $18,000 in savings works instead. One year, renewable once.',
  },
  Namibia: {
    usd: 2000,
    rule: 'That floor is set in US dollars by the Namibia Investment Promotion and Development Board, with more required for a spouse and each child.',
    toolRule: 'Set in US dollars; $1,000 more for a spouse and $500 per child. Six months, not renewable.',
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
  if (!spec || spec.pages === false) continue;

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

  // Every figure in COUNTRIES is MONTHLY. Some pages state the same rule annually, because the law
  // behind it is written per year (South Africa is a rand-per-annum figure). Dropping a monthly
  // number into "must earn at least $X annually" produced "$3,280 annually" on Cape Town and
  // Oudtshoorn before this guard existed. Leave those sentences alone and report them instead.
  // "annual income of at least $X" is annual too: without "annual" in this list Johannesburg read
  // "an annual income of at least $3,280", a monthly figure labelled as a yearly one.
  if (/\b(a year|annual(?:ly)?|per annum|per year|\/year|yearly)\b/i.test(sentences[target])) {
    skipped.push(id + ': states the floor ANNUALLY, not monthly; fix by hand');
    continue;
  }

  const want = '$' + spec.usd.toLocaleString('en-US');
  const save = spec.savings ? '$' + spec.savings.toLocaleString('en-US') : null;
  const before = sentences[target];
  sentences[target] = setFigures(before, want, save);

  // Only append the rule if the page does not already explain where the number comes from.
  const explains = /\b(minimum wage|average (?:net|gross)? ?salary|average gross wage|UMA|SMI|times the)\b/i;
  // The rule text itself counts as an explanation. Ecuador's rule says "unified basic salary" and
  // South Africa's says "flat rand figure", neither of which the pattern above knows, so every run
  // appended the rule again: Cuenca carried the same two sentences four times by 2026-09-29.
  let added = false;
  if (!explains.test(visa) && !visa.includes(spec.rule)) {
    sentences.splice(target + 1, 0, spec.rule);
    added = true;
    ruleAdded += 1;
  }

  // Collapse any rule sentence that an earlier run stacked more than once.
  let joined = sentences.join(' ');
  const twice = spec.rule + ' ' + spec.rule;
  while (joined.includes(twice)) joined = joined.split(twice).join(spec.rule);

  const next = Object.assign({}, notes, { visa: joined });
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
// --- the row count the prose states. The page said "more than 40" and "40 countries" over a table
// of 41 rows, then 40 once Norway's row went (its permit is contract-bound, not a nomad visa).
// Every sentence that states the count is listed here and set from the array itself.
const vStart = visaHtml.indexOf('var VISAS=[');
const vEnd = visaHtml.indexOf('];', vStart);
const rowCount = vStart < 0 ? 0 : (visaHtml.slice(vStart, vEnd).match(/^\s*\['/gm) || []).length;
const COUNT_PHRASES = [
  /(\bWe compare )(\d+)( digital nomad and remote-work visas)/,
  /(\. )(\d+)( remote-work visas compared by the income)/,
  /(\bacross )(\d+)( countries\.")/,
  /(\blines up )(\d+)( nomad and remote-work visas)/,
];
let countFixed = 0;
if (rowCount) {
  for (const re of COUNT_PHRASES) {
    if (!re.test(visaHtml)) { skipped.push('nomad-visas: count phrase missing ' + re.source.slice(0, 40)); continue; }
    visaHtml = visaHtml.replace(re, (m, a, n, b) => { if (Number(n) !== rowCount) countFixed += 1; return a + rowCount + b; });
  }
}
if (/\b(more than|over) \d+ (countries|nomad|remote-work)/i.test(visaHtml.replace(/<script[\s\S]*?<\/script>/g, ''))) {
  skipped.push('nomad-visas: a "more than N" count phrase is back; state the row count instead');
}

if (APPLY && (toolRows || countFixed)) fs.writeFileSync(visaPath, visaHtml);

console.log(pages + ' city pages set to their country figure, rule added to ' + ruleAdded + ' of them');
console.log(toolRows + ' /nomad-visas rows updated to match');
console.log(rowCount + ' rows in the table; ' + countFixed + ' count phrase(s) corrected\n');
samples.forEach((s) => console.log(s));
if (skipped.length) {
  console.log('\n  not touched (' + skipped.length + '):');
  skipped.slice(0, 14).forEach((s) => console.log('    ' + s));
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Restores the informative score-description paragraph on newer city pages whose
 * intro was reduced to a bare tagline (a wrong earlier sweep). For any city page
 * whose score-description <p> is just the city's tagline, this APPENDS the same
 * data-driven "strengths / typical budget / main trade-off" sentence that older
 * cities carry (identical wording to de_templatize_cities.cjs). The <h2> heading
 * is left untouched. Deterministic + idempotent (skips pages already enriched).
 * Usage: node scripts/fix_new_city_intros.cjs [slug]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const fn = new Function('module', code + '\n;module.exports = CITIES;');
const m = {}; fn(m);
const byId = new Map(m.exports.map((c) => [c.id, c]));

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// Same label maps + selection as de_templatize_cities.cjs so wording is identical.
const CATS = { climate: 'climate', cost: 'low costs', wifi: 'fast WiFi', nightlife: 'nightlife', nature: 'nature', safety: 'safety', food: 'food', community: 'a large nomad community', english: 'English', visa: 'easy visas', culture: 'culture', cleanliness: 'cleanliness', airquality: 'clean air' };
const WEAK = { climate: 'the climate', cost: 'cost', wifi: 'internet speed', nightlife: 'nightlife', nature: 'nature access', safety: 'safety', food: 'the food scene', community: 'the size of the nomad scene', english: 'the language barrier', visa: 'visa access', culture: 'the culture scene', cleanliness: 'cleanliness', airquality: 'air quality' };

function facts(c) {
  const sc = c.scores || {};
  const sorted = Object.entries(sc).filter(([k]) => CATS[k]).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(([k]) => CATS[k]);
  const last = sorted[sorted.length - 1];
  const weak = last && last[1] <= 5 ? WEAK[last[0]] : null;
  const cost = c.costPerMonth ? `$${c.costPerMonth.toLocaleString('en-US')}` : null;
  return { top, weak, cost };
}

// The trailing data sentence only (no tagline; the page already holds the tagline).
function introSentence(c, f, h) {
  const [t1, t2, t3] = f.top, cost = f.cost, weak = f.weak;
  const clim = (c.climateType || '').toLowerCase();
  const variants = [
    () => `For remote workers, ${c.name} leans on ${t1} and ${t2}${cost ? `, with a typical budget near ${cost} a month` : ''}.${weak ? ` The main trade-off is ${weak}.` : ''}`,
    () => `${cost ? `Plan on roughly ${cost} a month. ` : ''}Its strengths are ${t1} and ${t2}${weak ? `, while ${weak} is where it scores lower` : ` and ${t3}`}.`,
    () => `A ${clim || 'distinctive'} climate and strong ${t1 === 'climate' ? t2 : t1} make ${c.name} an easy base${cost ? `, and at about ${cost} a month it fits a range of budgets` : ''}.${weak ? ` Keep ${weak} in mind.` : ''}`,
    () => `What pulls nomads here is ${t1}, backed by ${t2} and ${t3}.${cost ? ` Budget around ${cost} a month.` : ''}${weak ? ` ${cap(weak)} is the weak spot.` : ''}`,
    () => `${c.name} pairs ${t1} with ${t2}${clim && t1 !== 'climate' && t2 !== 'climate' ? ` and a ${clim} climate` : ''}${cost ? `, all for about ${cost} a month` : ''}.${weak ? ` If anything, ${weak} lags.` : ''}`,
    () => `${cost ? `Expect ${cost} a month here. ` : ''}${cap(t1)} and ${t2} are the standout strengths${weak ? `, with ${weak} the main caveat` : ''}.`,
  ];
  return variants[h % variants.length]();
}

// Data-sentence signatures; if any is present the page is already enriched.
const ENRICHED = /leans on|standout strengths|weak spot|scores lower|an easy base|pulls nomads here|Plan on roughly|Expect \$|Budget around|If anything,|excels in/;

const only = process.argv[2];
const files = fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html')).filter((x) => !only || x === only || x === only + '.html');

let fixed = 0, already = 0, noData = 0, noMatch = 0;
for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const c = byId.get(slug);
  if (!c) { noData++; continue; }
  const abs = path.join(ROOT, 'cities', file);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const f = facts(c), h = hash(c.id);

  html = html.replace(
    /(<div class="score-description">\s*<h2>[^<]*<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/,
    (mm, open, para, close) => {
      if (ENRICHED.test(para)) { already++; return mm; }
      const sentence = introSentence(c, f, h);
      const sep = /\s$/.test(para) ? '' : ' ';
      fixed++;
      return `${open}${para}${sep}${sentence}${close}`;
    }
  );

  if (html !== before) fs.writeFileSync(abs, html);
  else if (!ENRICHED.test(before)) noMatch++;
}
console.log(`Intros restored: ${fixed} | already enriched: ${already} | no data: ${noData} | no score-description anchor: ${noMatch}`);

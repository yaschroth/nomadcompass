require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * De-templatizes the repetitive scaffolding on city pages so each city's unique
 * content stands out (helps indexing). For every cities/*.html:
 *   1. Replaces the Mad-Libs "score description" intro (only 4 variants across 410,
 *      with an identical closing sentence) with a tagline-led, data-driven intro
 *      whose H2 + paragraph structure varies per city (deterministic hash).
 *   2. Rewrites the 4 FAQ answers with varied phrasing (still data-accurate) and
 *      keeps the FAQPage JSON-LD in sync.
 * Deterministic + idempotent. Usage: node scripts/de_templatize_cities.cjs [slug]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const fn = new Function('module', code + '\n;module.exports = CITIES;');
const m = {}; fn(m);
const byId = new Map(m.exports.map((c) => [c.id, c]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// positive labels for STRENGTHS (high score)
const CATS = { climate: 'climate', cost: 'low costs', wifi: 'fast WiFi', nightlife: 'nightlife', nature: 'nature', safety: 'safety', food: 'food', community: 'a large nomad community', english: 'English', visa: 'easy visas', culture: 'culture', cleanliness: 'cleanliness', airquality: 'clean air' };
// singular noun labels for a WEAKNESS (low score), so phrasings like "X is the weak spot" read right
const WEAK = { climate: 'the climate', cost: 'cost', wifi: 'internet speed', nightlife: 'nightlife', nature: 'nature access', safety: 'safety', food: 'the food scene', community: 'the size of the nomad scene', english: 'the language barrier', visa: 'visa access', culture: 'the culture scene', cleanliness: 'cleanliness', airquality: 'air quality' };
const qual = (s) => (s >= 8 ? 'excellent' : s >= 6.5 ? 'good' : s >= 5 ? 'workable' : 'patchy');

function facts(c) {
  const sc = c.scores || {};
  const sorted = Object.entries(sc).filter(([k]) => CATS[k]).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(([k]) => CATS[k]);
  const last = sorted[sorted.length - 1];
  const weak = last && last[1] <= 5 ? WEAK[last[0]] : null;
  const cost = c.costPerMonth ? `$${c.costPerMonth.toLocaleString('en-US')}` : null;
  return { top, weak, cost, wifi: sc.wifi ?? 6, safety: sc.safety ?? 6 };
}

const H2T = [
  (c) => `Why ${c.name} Works for Remote Work`,
  (c) => `Living in ${c.name} as a Digital Nomad`,
  (c) => `${c.name} for Digital Nomads: The Honest Take`,
  (c) => `Is ${c.name} a Good Base for Remote Work?`,
  (c) => `What ${c.name} Offers Digital Nomads`,
  (c) => `${c.name} at a Glance for Remote Workers`,
  (c) => `Setting Up as a Nomad in ${c.name}`,
  (c) => `A Remote Worker's Guide to ${c.name}`,
];

function introParagraph(c, f, h) {
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
  const tagline = c.tagline ? esc(c.tagline).replace(/\s*$/, '') : '';
  return `${tagline}${tagline ? ' ' : ''}${variants[h % variants.length]()}`;
}

function faqs(c, f, h) {
  const cost = f.cost || 'a moderate amount';
  const topTxt = f.top.slice(0, 2).join(' and ');
  const q = (i) => (h + i) % 2; // stagger variant choice per question
  return [
    { q: `How much does it cost to live in ${c.name} as a digital nomad?`,
      a: [
        `A comfortable nomad budget in ${c.name} is around ${cost} a month: a furnished rental, food, coworking, and getting around. Live a little outside the center or eat local to spend less.`,
        `Budget roughly ${cost} a month in ${c.name} for a furnished place, food, coworking, and transport. The most popular central areas cost more; suburbs and local spots cost noticeably less.`,
      ][q(0)] },
    { q: `Is the internet fast enough for remote work in ${c.name}?`,
      a: [
        `${c.name} rates ${f.wifi} out of 10 for WiFi in our scoring, so it handles video calls and daily remote work ${qual(f.wifi)}. Carry a local SIM with data as a backup for cafes and travel days.`,
        `With a WiFi score of ${f.wifi}/10, connectivity in ${c.name} is ${qual(f.wifi)} for calls and focused work. A prepaid local SIM keeps you online when you are away from the apartment.`,
      ][q(1)] },
    { q: `Is ${c.name} safe for digital nomads?`,
      a: [
        `${c.name} scores ${f.safety} out of 10 for safety in our ratings, which is ${qual(f.safety)} for solo travel and long stays. Use normal precautions at night and with valuables, and choose well-reviewed areas.`,
        `Our safety score for ${c.name} is ${f.safety}/10, ${qual(f.safety)} for nomads. As anywhere, watch your belongings, favor busier streets after dark, and research neighborhoods before you book.`,
      ][q(2)] },
    { q: `Is ${c.name} a good city for digital nomads overall?`,
      a: [
        `${c.name} stands out for ${topTxt} among remote workers. With a typical budget near ${cost} a month and a growing nomad scene, it suits anyone whose priorities line up with those strengths.`,
        `For nomads, ${c.name} is worth a look if you value ${topTxt}. Costs sit near ${cost} a month and the community keeps growing, though, like anywhere, it will not match every checklist.`,
      ][q(3)] },
  ];
}

const only = process.argv[2];
const files = fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html')).filter((x) => !only || x === only || x === only + '.html');

let intro = 0, faqUpd = 0, changed = 0, skipped = 0;
for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const c = byId.get(slug);
  if (!c) { skipped++; continue; }
  const abs = path.join(ROOT, 'cities', file);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const f = facts(c), h = hash(c.id);

  // 1. intro (only replace the templated "excels in" version)
  html = html.replace(
    /<div class="score-description">\s*<h2>[^<]*<\/h2>\s*<p>([\s\S]*?)<\/p>/,
    (mm, para) => {
      if (!/excels in|welcoming environment for remote workers/.test(para)) return mm;
      intro++;
      return `<div class="score-description">\n            <h2>${esc(H2T[h % H2T.length](c))}</h2>\n            <p>${introParagraph(c, f, h)}</p>`;
    }
  );

  // 2. FAQ answers (body + JSON-LD, kept in sync)
  const fa = faqs(c, f, h);
  const faqBody = fa.map((x) => `          <details class="city-faq">\n            <summary>${esc(x.q)}</summary>\n            <p>${esc(x.a)}</p>\n          </details>`).join('\n');
  if (/<h2 id="faq">/.test(html)) {
    // use REPLACEMENT FUNCTIONS so '$' in cost strings ($2,800) is inserted literally
    html = html.replace(
      /<h2 id="faq">[^<]*<\/h2>[\s\S]*?(\n\s*<\/section>)/,
      (mm, close) => `<h2 id="faq">Frequently Asked Questions About ${esc(c.name)}</h2>\n${faqBody}${close}`
    );
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: fa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
    const ld = `<script type="application/ld+json">\n  ${JSON.stringify(faqLd, null, 2).replace(/\n/g, '\n  ')}\n  </script>`;
    // tempered match so it stays within the single FAQPage <script> (never spans City/Breadcrumb)
    html = html.replace(/<script type="application\/ld\+json">\s*\{(?:(?!<\/script>)[\s\S])*?"@type":\s*"FAQPage"(?:(?!<\/script>)[\s\S])*?<\/script>/, () => ld);
    faqUpd++;
  }

  if (html !== before) { fs.writeFileSync(abs, html); changed++; }
}
console.log(`Changed: ${changed} | intros rewritten: ${intro} | FAQ blocks updated: ${faqUpd} | no-data skipped: ${skipped}`);

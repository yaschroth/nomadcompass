/**
 * Injects a real, sourced cost-of-living table into each city page, right after the guide's
 * "Cost of Living in <City>" heading. Data: data/numbeo-costs.json (raw Numbeo components in
 * local currency, with the Numbeo "data last updated" date) converted to USD via assets/fx-usd.json.
 * Shows three persona budgets (solo nomad / couple / lean-local, built transparently from the same
 * figures) plus key line items, with clear Numbeo attribution + FX note. Idempotent + self-updating
 * via <!-- cost-start --> / <!-- cost-end -->. Only touches cities present in numbeo-costs.json.
 * Usage: node scripts/apply_city_costs.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const COSTS = require(path.join(ROOT, 'data', 'numbeo-costs.json'));
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json'));

// CITIES for display names
const m = { exports: {} };
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const NAME = {}; m.exports.forEach((c) => { if (c && c.id) NAME[c.id] = c.name; });

const SYM = { USD: '$', EUR: '€', GBP: '£', THB: '฿', JPY: '¥', CNY: '¥', INR: '₹',
  BRL: 'R$', MXN: '$', KRW: '₩', TRY: '₺', RUB: '₽', ZAR: 'R', AUD: '$', CAD: '$', NZD: '$',
  CHF: 'CHF ', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', SEK: 'kr', NOK: 'kr', DKK: 'kr', RON: 'lei',
  BGN: 'лв', HRK: 'kn', ILS: '₪', AED: 'AED ', SAR: 'SAR ', QAR: 'QAR ', KZT: '₸',
  IDR: 'Rp', MYR: 'RM', PHP: '₱', VND: '₫', SGD: '$', HKD: '$', TWD: 'NT$', LKR: 'Rs', NPR: 'Rs',
  EGP: 'E£', MAD: 'DH', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', UYU: '$U', GEL: '₾', RSD: 'din',
  UAH: '₴', ISK: 'kr', KES: 'KSh' };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function usd(local, rate) {
  if (local == null || !rate) return null;
  const v = local / rate;
  const r = v >= 100 ? Math.round(v / 10) * 10 : Math.round(v);
  return r;
}
const money = (n) => n == null ? null : '$' + commas(n);
function localStr(local, cur) {
  if (local == null) return '';
  const sym = SYM[cur] || (cur + ' ');
  return sym + commas(Math.round(local));
}
const fxDate = (FX.time_last_update_utc || '').replace(/^[A-Za-z]+, /, '').replace(/ \d{2}:\d{2}.*$/, '');

function costBox(slug, d) {
  const rate = FX.rates[d.cur];
  if (!rate) { console.error('NO FX RATE for', d.cur, '(' + slug + ')'); return null; }
  const city = NAME[slug] || slug;
  const solo = (d.rent1c != null && d.singleNoRent != null) ? usd(d.rent1c + d.singleNoRent, rate) : null;
  const couple = (d.rent1c != null && d.singleNoRent != null) ? usd(d.rent1c + d.singleNoRent * 1.8, rate) : null;
  const lean = (d.singleNoRent != null && (d.rent1o != null || d.rent1c != null)) ? usd((d.rent1o != null ? d.rent1o : d.rent1c) + d.singleNoRent, rate) : null;

  const personaDefs = [
    ['Solo nomad', solo, '1-bed centre + living costs', ' is-primary'],
    ['Couple', couple, 'shared 1-bed + costs', ''],
    ['Lean / local', lean, 'cheaper area + costs', ''],
  ].filter((p) => p[1] != null);
  const personas = personaDefs.map((p) =>
    `          <div class="cost-persona${p[3]}"><span class="cost-persona-val">${money(p[1])}<span class="cost-per">/mo</span></span><span class="cost-persona-label">${p[0]}</span><span class="cost-persona-note">${esc(p[2])}</span></div>`
  ).join('\n');

  const lineDefs = [
    ['1-bed rent, city centre', d.rent1c],
    ['1-bed rent, outside centre', d.rent1o],
    ['Monthly costs excl. rent (1 person)', d.singleNoRent],
    ['Meal, inexpensive restaurant', d.mealInexp],
    ['Monthly transit pass', d.transport],
    ['Buy price, per m² (centre)', d.buySqm],
  ];
  const lines = lineDefs.filter((l) => l[1] != null).map((l) => {
    const u = usd(l[1], rate);
    return `          <li><span class="cost-line-label">${esc(l[0])}</span><span class="cost-line-val">${money(u)}<em>${esc(localStr(l[1], d.cur))}</em></span></li>`;
  }).join('\n');

  const rr = Math.round(rate * 100) / 100;
  const rateStr = SYM[d.cur] ? '$1 = ' + SYM[d.cur].trim() + rr : '$1 = ' + rr + ' ' + d.cur;
  const url = 'https://www.numbeo.com/cost-of-living/in/' + encodeURIComponent(d.numbeoSlug || city);

  return `<!-- cost-start -->
      <div class="cost-box" data-cost="v1">
        <div class="cost-head">
          <span class="cost-badge">Real market data</span>
          <span class="cost-asof">Source: <a href="${url}" target="_blank" rel="nofollow noopener">Numbeo</a> · ${esc(d.date)}</span>
        </div>
        <div class="cost-personas">
${personas}
        </div>
        <ul class="cost-lines">
${lines}
        </ul>
        <p class="cost-src">Converted to USD at ${esc(rateStr)} (${esc(fxDate)}). Solo is centre rent plus Numbeo's single-person monthly costs; couple and lean are our estimates from the same figures.</p>
      </div>
      <!-- cost-end -->`;
}

let ok = 0, noAnchor = 0, noRate = 0;
for (const slug of Object.keys(COSTS)) {
  if (slug === '_meta') continue;
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); continue; }
  const box = costBox(slug, COSTS[slug]);
  if (!box) { noRate++; continue; }
  let s = fs.readFileSync(page, 'utf8');
  s = s.replace(/\s*<!-- cost-start -->[\s\S]*?<!-- cost-end -->/, ''); // idempotent
  const city = NAME[slug] || slug;
  const h2re = new RegExp('(<h2[^>]*>\\s*Cost of Living[^<]*</h2>)');
  if (!h2re.test(s)) { console.error('NO COST HEADING:', slug); noAnchor++; continue; }
  s = s.replace(h2re, (mt, h2) => h2 + '\n' + box);
  fs.writeFileSync(page, s);
  ok++;
}
console.log(`Cost table: applied ${ok} | no anchor ${noAnchor} | no fx rate ${noRate}`);

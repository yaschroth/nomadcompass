/**
 * Adds a substantial static content block (intro + "how it works" + FAQ + contextual internal
 * links) and FAQPage JSON-LD to each interactive tool page, so the pages are not thin content and
 * have real body links (the tools themselves render results client-side). Bespoke, unique copy per
 * tool. Injected before the footer; idempotent via <!-- tc-start -->/<!-- tc-end --> markers and a
 * marked FAQ script. Usage: node scripts/apply_tool_content.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CITY = (id, name) => ({ href: '/cities/' + id, label: name });
const R = { cities: { href: '/cities', label: 'Browse all 410 cities' }, best: { href: '/best', label: 'Best cities rankings' }, map: { href: '/map', label: 'The world map' }, route: { href: '/route', label: 'Route Planner' }, tz: { href: '/timezones', label: 'Time Zone Finder' }, visa: { href: '/visa', label: 'Visa Finder' }, weather: { href: '/best-weather', label: 'Best Weather by Month' }, geo: { href: '/geoarbitrage', label: 'Geoarbitrage Calculator' }, wheel: { href: '/wheel', label: 'Decision Wheel' }, compare: { href: '/compare', label: 'Compare cities' }, blog: { href: '/blog', label: 'The blog' } };

// ---- data for the static "popular results" blocks (real, crawlable city links, no JS) ----
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const VISA = require(path.join(ROOT, 'assets', 'visa-data.js'));
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const score = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const CITIES = m.exports.filter((c) => c && c.id).map((c) => ({ id: c.id, name: c.name, country: c.country, tz: c.timezone, cost: c.costPerMonth, score: score(c) }));
const NAMEFIX = { UAE: 'United Arab Emirates', 'Puerto Rico': 'United States', UK: 'United Kingdom', Bosnia: 'Bosnia and Herzegovina', 'New Caledonia': 'France' };
const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MSLUG = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function comfort(cl, mo) { if (!cl || cl.h[mo] == null || cl.l[mo] == null) return null; const avg = (cl.h[mo] + cl.l[mo]) / 2; const r = cl.r[mo] == null ? 40 : cl.r[mo]; return 0.65 * Math.max(0, 100 - Math.abs(avg - 24) * 5) + 0.35 * Math.max(0, 100 - r * 0.5); }
const link = (c, hash) => `<a href="/cities/${c.id}${hash || ''}">${c.name}</a>`;
const listLinks = (arr, hash) => arr.map((c) => link(c, hash)).join(', ');

function block(title, groups) {
  // groups: [ [subhead, htmlBody], ... ]
  return `<div class="tc-block tc-popular"><h2>${title}</h2>` + groups.map((g) => `<div class="tc-pg"><h3>${g[0]}</h3><p>${g[1]}</p></div>`).join('') + '</div>';
}

const POP = {
  weather() {
    const months = [0, 3, 6, 9];
    const groups = months.map((mo) => {
      const ranked = CITIES.filter((c) => CLIMATE[c.id] && comfort(CLIMATE[c.id], mo) != null)
        .map((c) => ({ c, cf: comfort(CLIMATE[c.id], mo) })).sort((a, b) => b.cf - a.cf).slice(0, 8).map((x) => x.c);
      return [`Best weather in ${MONF[mo]}`, listLinks(ranked, '#weather') + `. <a href="/best-weather?month=${MSLUG[mo]}">See the full ${MONF[mo]} ranking &rarr;</a>`];
    });
    return block('Where it is warm, month by month', groups);
  },
  visa() {
    const destIdx = {}; VISA.D.forEach((d, i) => { destIdx[d] = i; });
    const byCanon = {}; CITIES.forEach((c) => { const canon = NAMEFIX[c.country] || c.country; (byCanon[canon] = byCanon[canon] || []).push(c); });
    const PLABEL = { 'United States': 'US', 'United Kingdom': 'UK', Germany: 'German', Australia: 'Australian' };
    const passports = ['United States', 'United Kingdom', 'Germany', 'Australia'];
    const groups = passports.map((p) => {
      const map = {}; (VISA.V[p] || '').split(',').forEach((tok) => { const i = tok.indexOf(':'); if (i > 0) map[+tok.slice(0, i)] = tok.slice(i + 1); });
      const free = CITIES.filter((c) => { const idx = destIdx[NAMEFIX[c.country] || c.country]; if (idx === undefined) return false; const v = map[idx]; return v !== undefined && v !== 'X' && v !== 'O' && v !== 'E' && v !== 'A'; })
        .sort((a, b) => b.score - a.score).slice(0, 10);
      return [`Visa-free for ${PLABEL[p]} passports`, listLinks(free) + `. <a href="/visa?passport=${encodeURIComponent(p)}">Full ${PLABEL[p]} passport list &rarr;</a>`];
    });
    return block('Where popular passports go visa-free', groups);
  },
  geo() {
    const withCost = CITIES.filter((c) => typeof c.cost === 'number' && c.cost > 0);
    const cheapest = withCost.slice().sort((a, b) => a.cost - b.cost).slice(0, 15);
    const value = withCost.slice().sort((a, b) => (b.score / b.cost) - (a.score / a.cost)).slice(0, 10);
    return block('The maths of geoarbitrage', [
      ['The cheapest nomad cities', cheapest.map((c) => `${link(c)} (~$${c.cost.toLocaleString('en-US')}/mo)`).join(', ') + '.'],
      ['Best value for money (score per dollar)', listLinks(value) + '. Enter your income above for a personalised savings ranking.'],
    ]);
  },
  route() {
    const routes = [
      ['A European summer', ['lisbon', 'porto', 'barcelona', 'split', 'athens']],
      ['A South-East Asia loop', ['bangkok', 'chiangmai', 'canggu', 'ubud']],
      ['Latin America on a budget', ['mexicocity', 'oaxaca', 'medellin', 'buenosaires']],
      ['The nomad classics', ['lisbon', 'barcelona', 'medellin', 'bali']],
    ];
    const byId = {}; CITIES.forEach((c) => { byId[c.id] = c; });
    const groups = routes.filter((r) => r[1].every((id) => byId[id])).map((r) => {
      const cs = r[1].map((id) => byId[id]);
      return [r[0], cs.map((c) => link(c)).join(' &rarr; ') + `. <a href="/route?route=${r[1].map((id) => id + ':14').join(',')}">Open this route &rarr;</a>`];
    });
    return block('Popular nomad routes', groups);
  },
  tz() {
    const homes = [['a US East-coast team (UTC-5)', -5], ['a UK team (UTC+0)', 0], ['a Central-European team (UTC+1)', 1], ['an East-Asian team (UTC+9)', 9]];
    const groups = homes.map((h) => {
      const ranked = CITIES.filter((c) => typeof c.tz === 'number').map((c) => ({ c, ov: Math.max(0, 8 - Math.abs(c.tz - h[1])) }))
        .filter((x) => x.ov >= 6).sort((a, b) => b.ov - a.ov || b.c.score - a.c.score).slice(0, 8).map((x) => x.c);
      return [`Best overlap with ${h[0]}`, listLinks(ranked) + '.'];
    });
    return block('Which cities line up with your team', groups);
  },
};

const TOOLS = {
  'route.html': {
    h: 'About the Nomad Route Planner',
    intro: 'Planning a multi-city trip as a digital nomad means juggling budget, visas, weather and jet lag all at once. This route planner puts them on one screen: add the cities you want to string together, set a start date and how long you will stay in each, and it works out the dates, a month-by-month budget, the weather you will actually get, a packing list, and a Schengen day tracker for the whole trip.',
    how: 'Each stop’s cost is our estimated monthly budget for that city, split across the exact nights you are there and nudged up or down for local high and low season. Weather comes from 2019–2023 climate normals (Open-Meteo) for the month you arrive. Flight legs use the great-circle distance between stops, and the jet-lag figure is the real UTC offset difference on your travel date, daylight saving included. The Schengen tracker counts nights in Schengen-area countries against the 90-days-in-any-180 rule.',
    faq: [
      ['How is the trip budget worked out?', 'We take each city’s estimated monthly cost of living for one person, divide it into a nightly rate, and multiply by the nights you spend there in each calendar month. Peak-season months get a small uplift and low-season months a small discount, based on the local climate. It is a planning estimate in USD, not a quote.'],
      ['Does it include flight prices?', 'No. Flights vary far too much by date and airline to estimate honestly. We show the distance, a rough flight time and an approximate CO2 figure for each leg so you can see the shape of the trip, but not a ticket price.'],
      ['What is the Schengen 90/180 rule?', 'Most non-EU visitors may spend at most 90 days inside the Schengen area in any rolling 180-day window. The planner counts the nights your route spends in Schengen countries and warns you if a stretch would put you over the limit.'],
      ['Is the weather a forecast?', 'No, it is a historical average for that month from five years of data, so it tells you what is typical rather than what the sky will do on a given day. Use it to avoid rainy seasons and pick comfortable months.'],
      ['Can I save or share a route?', 'Yes. Your route and dates live in the page URL, so the "Copy share link" button gives you a link that reopens the exact same trip. You can also export it as an .ics calendar or print a one-page itinerary.'],
    ],
    related: [R.tz, R.visa, R.weather, R.geo, R.cities, CITY('lisbon', 'Lisbon'), CITY('bali', 'Bali'), CITY('medellin', 'Medellín')],
  },
  'timezones.html': {
    h: 'About the Time Zone Overlap Finder',
    intro: 'If you work with a team, clients or family in another country, the single biggest quality-of-life factor is how many working hours you share. This tool ranks nomad cities by exactly that: pick the time zone you need to stay in sync with and see where your 9-to-5 lines up, so meetings land at a civilised hour instead of at 3am.',
    how: 'Every city carries its real IANA time zone, and the tool computes each city’s UTC offset for the date you choose using your browser’s time-zone engine, so daylight-saving shifts are included. Overlap is the number of shared working hours assuming a 9-to-5 day on both sides: a city on your exact offset gives the full eight hours, and every hour of difference removes one. A "DST" tag means that city is on summer time for the selected date.',
    faq: [
      ['How is the overlap calculated?', 'We assume a standard 9-to-5 working day in both places and count how many of those hours happen at the same real-world moment. Same offset means all eight hours overlap; a three-hour difference leaves five hours, and so on.'],
      ['Does it account for daylight saving?', 'Yes. Offsets are computed from each city’s IANA time zone for the date you pick, so summer-time shifts are built in. You can switch between "right now", July and January to see how the overlap changes across the year.'],
      ['What if my team works asynchronously?', 'Then overlap matters less, and you can optimise for cost, weather or community instead. This tool is aimed at people who need real-time calls; if that is not you, our other tools will serve you better.'],
      ['Which cities overlap with US or European hours?', 'For US Eastern and Central time, Latin America is your friend; for UK and European hours, Africa and the Middle East line up well; for East-Asian hours, South-East Asia and Oceania. Set your home zone above to see the full ranked list.'],
    ],
    related: [R.route, R.weather, R.visa, R.map, R.cities, CITY('medellin', 'Medellín'), CITY('capetown', 'Cape Town'), CITY('lisbon', 'Lisbon')],
  },
  'best-weather.html': {
    h: 'How to find the best weather, any month',
    intro: 'One of the quiet superpowers of remote work is following good weather around the planet. Instead of enduring a grey winter, you can be somewhere warm and dry and keep working. This finder answers a simple question for any month of the year: where is it actually nice right now? Pick a month and it ranks cities by warmth and dryness from five years of climate data.',
    how: 'For the month you choose, we look up each city’s average daytime high, night-time low and rainfall from 2019–2023 Open-Meteo normals, then score it for comfort: mild-to-warm temperatures score highest and heavy rain pulls the score down. The "beach weather" filter keeps only places that are genuinely hot and fairly dry. Every card links to that city’s full monthly weather chart so you can see the whole year at a glance.',
    faq: [
      ['Where is warm in the European winter?', 'From December to February the reliably warm, dry nomad bases are in the tropics and the southern hemisphere: think the Canary Islands, South and South-East Asia, Latin America and Australia. Select January or December above to see the current ranking.'],
      ['What is the best month to visit a specific city?', 'Open any city and scroll to its weather chart: the best months for comfortable weather are highlighted, and we call out the warmest and wettest months in plain language.'],
      ['How do you decide the "best" weather?', 'We reward comfortable temperatures (roughly 20–28°C by day) and penalise heavy rainfall, using historical monthly averages. It is about typical conditions, not a forecast, so it is ideal for planning weeks or months ahead.'],
      ['Can I avoid the rainy season?', 'Yes, that is exactly what this is for. Rainy months score poorly, so the top results for any month are the driest, most pleasant options. Cross-check the city’s own chart for the full rainfall picture.'],
    ],
    related: [R.route, R.cities, R.best, R.geo, CITY('laspalmas', 'Las Palmas'), CITY('chiangmai', 'Chiang Mai'), CITY('medellin', 'Medellín'), CITY('capetown', 'Cape Town')],
  },
  'visa.html': {
    h: 'Understanding visas as a digital nomad',
    intro: 'Where your passport can take you shapes everything else about the nomad life. This finder turns a messy question into a clear one: pick your passport and see, for every city we cover, whether you can enter visa-free, get a visa on arrival, need an e-visa, or need a full visa in advance, plus which countries now offer a dedicated digital nomad visa for staying longer.',
    how: 'The entry data is derived from the open Passport Index dataset, which tracks tourist-entry requirements between every pair of countries. We show visa-free stays with their day limits, so you know whether you get 30, 90 or 180 days. The "nomad visa" flags are our own editorial list of countries that have launched a remote-work or digital-nomad residence permit.',
    faq: [
      ['What is a digital nomad visa?', 'It is a residence permit that lets you live in a country for six months to a few years while working remotely for clients or an employer abroad, usually with a minimum income requirement. Dozens of countries now offer one, from Portugal and Spain to Indonesia, Costa Rica and the UAE.'],
      ['What is the difference between visa-free and visa on arrival?', 'Visa-free means you can just show up and enter for a set number of days with no paperwork. Visa on arrival means you get the visa at the border, usually for a fee. An e-visa or ETA must be applied for online before you travel.'],
      ['Does visa-free entry mean I can work there?', 'No. Almost all visa-free and tourist entries are for tourism only and do not permit local employment. Working remotely for clients outside the country sits in a grey area in many places; a proper digital nomad visa is the clean way to stay and work legally.'],
      ['How long can I stay visa-free?', 'It depends on your passport and the destination, from 14 days up to 180. The finder shows the exact day limit on each visa-free result. Always confirm with the official embassy before you book, as rules change often.'],
    ],
    related: [R.route, R.weather, R.geo, R.best, R.cities, CITY('lisbon', 'Lisbon'), CITY('bangkok', 'Bangkok'), CITY('mexicocity', 'Mexico City')],
  },
  'geoarbitrage.html': {
    h: 'What is geoarbitrage?',
    intro: 'Geoarbitrage is the simple idea behind a lot of remote-work freedom: earn in a strong currency or a high-paying market, and live somewhere the cost of living is far lower. The gap between the two is money you keep. This calculator makes it concrete: enter what you earn and see how much you would save each month, and at what rate, in every city we cover.',
    how: 'We take your after-tax monthly income and subtract each city’s estimated monthly cost of living for one person, a comfortable budget covering rent, food, coworking, getting around and some fun. What is left is your monthly saving, and the savings rate is that figure as a share of your income. Costs are our editorial estimates in USD; taxes are not modelled, since they depend on your residency.',
    faq: [
      ['What does geoarbitrage mean?', 'It means arbitraging geography: using the difference between where you earn and where you spend. A salary that barely covers rent in San Francisco or London can fund a very comfortable life with high savings in parts of Latin America, South-East Asia or Eastern Europe.'],
      ['Which cities let me save the most?', 'On a typical remote salary, the highest savings rates are in South-East Asia (Vietnam, Indonesia, Thailand), South Asia and parts of Latin America and the Balkans, where a good monthly budget can be well under $1,000. Enter your income above for a personalised ranking.'],
      ['How accurate are the cost figures?', 'They are considered editorial estimates of a comfortable single-person budget, not official statistics. Your real spend depends heavily on your lifestyle, how you like to live and how long you stay, so treat them as a starting point for comparison.'],
      ['Does this include taxes?', 'No. The calculator uses after-tax income you enter and does not model taxes in the destination, which vary with your residency and visa status. Speak to a cross-border accountant before making decisions based on tax.'],
    ],
    related: [R.route, R.visa, R.best, R.cities, CITY('chiangmai', 'Chiang Mai'), CITY('medellin', 'Medellín'), CITY('tbilisi', 'Tbilisi'), CITY('canggu', 'Canggu')],
  },
  'tier-list/maker.html': {
    h: 'About the Tier List Maker',
    intro: 'A tier list is the fastest way to turn a messy opinion into something you can share. Drag the cities you know into S through F tiers, add any of our 410 destinations, and you have your own personal ranking of the best nomad cities, built on your priorities rather than ours. It is a bit of fun, and a genuinely useful way to compare places at a glance.',
    how: 'Start from a pool of the top-rated cities, then drag any card into a tier on desktop, or tap a city and tap a tier on a phone. Search to add more cities to the pool. Your whole board is saved in the page link, so the share button gives you a URL that reopens your exact tier list for a friend or a forum post.',
    faq: [
      ['How do I share my tier list?', 'Your arrangement is encoded in the page URL, so just hit "Copy share link" and paste it anywhere. Whoever opens it sees your exact board. Nothing is saved to an account, so the link is the tier list.'],
      ['How is this different from your official tier list?', 'Our tier list ranks cities from our data-driven Nomad Score. This maker is entirely yours: rank places by whatever matters to you, whether that is nightlife, cost or somewhere you simply loved.'],
      ['Can I rank cities I have not been to?', 'Of course, though it is most fun and useful for places you know. If you are still deciding where to go, the Decision Wheel and the city rankings are a better starting point.'],
    ],
    related: [{ href: '/tier-list', label: 'Our official tier list' }, R.best, R.wheel, R.cities, R.route, CITY('lisbon', 'Lisbon'), CITY('bali', 'Bali')],
  },
};

const CSS = `<style>
  .tool-content { border-top: 1px solid var(--color-sand-dark,#e3d9c6); background: var(--color-sand,#f6f1e7); padding: 3rem 0 3.5rem; }
  .tool-content .container { max-width: 820px; }
  .tool-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.55rem; color: var(--color-ink,#0f172a); margin: 0 0 .8rem; }
  .tool-content .tc-block { margin-bottom: 2rem; }
  .tool-content p { font-size: 1.02rem; line-height: 1.7; color: var(--color-charcoal,#334155); margin: 0 0 .9rem; }
  .tool-content details { border-bottom: 1px solid var(--color-sand-dark,#e3d9c6); padding: .85rem 0; }
  .tool-content summary { font-weight: 600; color: var(--color-ink,#0f172a); cursor: pointer; font-size: 1.02rem; list-style: none; position: relative; padding-right: 1.5rem; }
  .tool-content summary::-webkit-details-marker { display: none; }
  .tool-content summary::after { content: '+'; position: absolute; right: 0; top: -2px; font-size: 1.3rem; color: var(--color-terracotta,#c0392b); }
  .tool-content details[open] summary::after { content: '\\2013'; }
  .tool-content details p { margin: .7rem 0 0; }
  .tool-content .tc-related ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem .7rem; }
  .tool-content .tc-related a { display: inline-block; background: #fff; border: 1px solid var(--color-sand-dark,#e3d9c6); border-radius: 999px; padding: .4rem .9rem; font-size: .9rem; font-weight: 600; color: var(--color-charcoal,#334155); text-decoration: none; }
  .tool-content .tc-related a:hover { border-color: var(--color-terracotta,#c0392b); color: var(--color-terracotta,#c0392b); }
  .tool-content .tc-pg { margin-bottom: 1rem; }
  .tool-content .tc-pg h3 { font-size: 1.02rem; color: var(--color-ink,#0f172a); margin: 0 0 .25rem; }
  .tool-content .tc-pg p { font-size: .95rem; line-height: 1.65; margin: 0; }
</style>`;

const POPKEY = { 'route.html': 'route', 'timezones.html': 'tz', 'best-weather.html': 'weather', 'visa.html': 'visa', 'geoarbitrage.html': 'geo' };

function build(cfg, popHtml) {
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: cfg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const faqHtml = cfg.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n          ');
  const rel = cfg.related.map((r) => `<li><a href="${r.href}">${r.label}</a></li>`).join('');
  const section = '<!-- tc-start -->\n    ' + CSS + `
    <section class="tool-content"><div class="container">
      <div class="tc-block"><h2>${cfg.h}</h2><p>${cfg.intro}</p></div>
      ${popHtml || ''}
      <div class="tc-block"><h2>How it works</h2><p>${cfg.how}</p></div>
      <div class="tc-block"><h2>Frequently asked questions</h2>
          ${faqHtml}
      </div>
      <div class="tc-block tc-related"><h2>Keep exploring</h2><ul>${rel}</ul></div>
    </div></section>
    <!-- tc-end -->`;
  const ld = `<script type="application/ld+json" data-tc-faq>${JSON.stringify(faqLd)}</script>`;
  return { section, ld };
}

let changed = 0;
for (const [file, cfg] of Object.entries(TOOLS)) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) { console.log('MISSING', file); continue; }
  let html = fs.readFileSync(fp, 'utf8');
  // strip previous injection (idempotent)
  html = html.replace(/\s*<!-- tc-start -->[\s\S]*?<!-- tc-end -->/, '');
  html = html.replace(/\s*<script type="application\/ld\+json" data-tc-faq>[\s\S]*?<\/script>/, '');
  const popHtml = POPKEY[file] ? POP[POPKEY[file]]() : '';
  const { section, ld } = build(cfg, popHtml);
  // inject section at the end of <main>
  const mainIdx = html.lastIndexOf('</main>');
  if (mainIdx < 0) { console.log('NO MAIN', file); continue; }
  html = html.slice(0, mainIdx) + section + '\n  ' + html.slice(mainIdx);
  // inject FAQ JSON-LD before </head>
  html = html.replace('</head>', '  ' + ld + '\n</head>');
  fs.writeFileSync(fp, html);
  changed++;
}
console.log(`Tool content + FAQ schema applied to ${changed} tool pages.`);

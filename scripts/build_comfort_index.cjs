require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Builds /comfort-index: the Nomad Comfort Index, every city ranked by how comfortable its climate
 * is across a whole year, from the climate normals in assets/city-climate.js: 1991-2020 weather-station
 * normals where one stands for the city, the 2019-2023 Open-Meteo ERA5 grid elsewhere (which one is in
 * data/city-climate-source.json, written by build_climate_stations.cjs).
 *
 * Why it exists: Search Console (Sept 2026) showed /best/best-cities-for-year-round-weather taking
 * impressions for "comfort index" queries it could not answer. The site already had a comfort
 * model; it was only ever shown one city at a time.
 *
 * THE COMFORT FUNCTION IS THE EIGHTH COPY of the one in apply_city_weather.cjs, apply_city_facts.cjs,
 * apply_tool_content.cjs, build_best_weather.cjs, build_route.cjs, best-weather.html and route.html.
 * All eight must stay identical, or this index and the "Best time" panel on a city page disagree
 * about the same city. Change them together. The best-months rule (top three months, ties to the
 * earlier month, listed in calendar order) is copied from apply_city_facts.cjs for the same reason.
 *
 * Yearly score = the mean of the twelve monthly scores. A "comfortable month" scores 80 or more,
 * the line /best-weather draws for Ideal weather. 64 was tried first and counted a dry month
 * averaging 8C as comfortable, which put Athens and Berlin's April on the comfortable side.
 *
 * The full table is static HTML (crawlable); the inline script only sorts, filters and adds
 * tooltips. Built on lib/page_shell.cjs. After running: apply_tools_nav.cjs (marks the nav item
 * active), then generate_sitemap.cjs. Usage: node scripts/build_comfort_index.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));
const BASE = 'https://thenomadhq.com';

const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const PROV = require(path.join(ROOT, 'data', 'provenance.json'));
const ATTRIB = (() => {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'cities', 'attribution.json'), 'utf8'));
  return Array.isArray(raw) ? Object.fromEntries(raw.map((r) => [r.slug, r])) : raw;
})();
const SOURCE = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'city-climate-source.json'), 'utf8')).cities; } catch (e) { return {}; } })();
const ELEV = (() => { try { const e = require(path.join(ROOT, 'data', 'city-elevations.json')); return e.elevations || e; } catch (e) { return {}; } })();
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const rm = {};
new Function('module', 'window', fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8') + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'the Middle East', northamerica: 'North America', oceania: 'Oceania' };
const REGION_LABEL = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America', oceania: 'Oceania' };

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SLUG = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const COMFORTABLE = 80;

// Verbatim from apply_city_weather.cjs. See the header: eight copies, one model.
function comfort(hi, lo, r) {
  const avg = (hi + lo) / 2;
  // 18-25C average is comfortable, highs above 30C cost extra, and rain past 50mm keeps costing
  // without a floor, so a monsoon month can no longer win on temperature alone.
  const off = avg < 18 ? 18 - avg : avg > 25 ? avg - 25 : 0;
  const tS = Math.max(0, 100 - off * 6 - Math.max(0, hi - 30) * 5);
  const rr = r == null ? 40 : r;
  const rS = rr <= 50 ? 100 : Math.max(-60, 100 - (rr - 50) * 0.5);
  return 0.55 * tS + 0.45 * rS;
}
// The two halves, for the worked examples only. Same arithmetic as comfort().
function halves(hi, lo, r) {
  const avg = (hi + lo) / 2;
  const off = avg < 18 ? 18 - avg : avg > 25 ? avg - 25 : 0;
  const tS = Math.max(0, 100 - off * 6 - Math.max(0, hi - 30) * 5);
  const rS = r <= 50 ? 100 : Math.max(-60, 100 - (r - 50) * 0.5);
  return { avg, tS, rS };
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bin = (v) => (v >= 80 ? 4 : v >= COMFORTABLE ? 3 : v >= 48 ? 2 : v >= 30 ? 1 : 0);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------- data
const rows = [];
for (const c of m.exports) {
  if (!c || !c.id || !CLIMATE[c.id]) continue;
  const cl = CLIMATE[c.id];
  const valid = [];
  for (let i = 0; i < 12; i++) if (cl.h[i] != null && cl.l[i] != null) valid.push(i);
  if (valid.length < 12) continue; // a yearly mean needs the whole year
  const ms = valid.map((i) => comfort(cl.h[i], cl.l[i], cl.r[i]));
  const ranked = valid.map((i) => ({ i, c: ms[i] })).sort((a, b) => b.c - a.c);
  const best = ranked.slice(0, 3).map((x) => x.i).sort((a, b) => a - b);
  rows.push({
    id: c.id, name: c.name, country: c.country, region: REGION[c.id] || '',
    ms, year: ms.reduce((a, b) => a + b, 0) / 12,
    good: ms.filter((v) => v >= COMFORTABLE).length,
    best, cl,
  });
}
rows.sort((a, b) => b.year - a.year || b.good - a.good || a.name.localeCompare(b.name));
rows.forEach((r, i) => { r.rank = i + 1; });
const N = rows.length;
if (N < 900) { console.error('build_comfort_index: only ' + N + ' cities with a full year of climate data. Refusing to publish a thin index.'); process.exit(1); }

// headline facts, all computed
const all12 = rows.filter((r) => r.good === 12).length;
const none = rows.filter((r) => r.good === 0).length;
const byMonth = MON.map((_, i) => rows.filter((r) => r.ms[i] >= COMFORTABLE).length);
const bestMo = byMonth.indexOf(Math.max(...byMonth));
const worstMo = byMonth.indexOf(Math.min(...byMonth));
const median = Math.round(rows[Math.floor(N / 2)].year);
const top = rows.slice(0, 8);
const negCities = rows.filter((r) => r.ms.some((v) => v < 0)).length;
const elevOf = (id) => { const e = ELEV[id]; const v = e && typeof e === 'object' ? (e.elevation != null ? e.elevation : e.m) : e; return typeof v === 'number' ? v : null; };
const topIn = (reg) => rows.find((r) => r.region === reg);
const list = (arr) => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const cityLink = (r) => `<a href="/cities/${r.id}">${esc(r.name)}</a>`;
const yr = (r) => Math.round(r.year);
// Per month, a full 100 is common (73 to 160 cities each month), so "the top five" by score alone
// is the same five year-round cities every month. Among the best scorers, show the five furthest
// above their own yearly average: the cities for which that month is the one to plan around.
const perfect = MON.map((_, i) => rows.filter((r) => Math.round(r.ms[i]) >= 100).length);
const monthTop = MON.map((_, i) => rows.map((r) => ({ r, v: r.ms[i] }))
  .sort((a, b) => Math.round(b.v) - Math.round(a.v) || (b.v - b.r.year) - (a.v - a.r.year)).slice(0, 5));

// worked examples, recomputed from the data so the text cannot drift from the model
function example(id, mo) {
  const r = rows.find((x) => x.id === id); if (!r) return null;
  const hi = r.cl.h[mo], lo = r.cl.l[mo], rain = r.cl.r[mo];
  const h = halves(hi, lo, rain);
  return { r, mo, hi, lo, rain, avg: h.avg, tS: Math.round(h.tS), rS: Math.round(h.rS), score: Math.round(r.ms[mo]) };
}
const exA = example('lisbon', 6);
const exB = example('chiangmai', 7);
const exC = example('bergen', 0);
const lima = rows.find((r) => r.id === 'lima');
// How many cities rest on a station and how many on the grid, and one city the grid got badly wrong,
// all read from the sidecar so the prose cannot drift from the data.
const nStation = rows.filter((r) => SOURCE[r.id] && SOURCE[r.id].source === 'station').length;
// Stations without published 1991-2020 normals (PAGASA's Iloilo sheet is 1991-2009, IMD's Madikeri 1981-2010).
const nShort = rows.filter((r) => SOURCE[r.id] && SOURCE[r.id].source === 'station' && SOURCE[r.id].period !== '1991-2020').length;
const stationPhrase = (n) => (nShort ? `weather-station averages for ${n} cities (1991-2020 normals for all but ${nShort})` : `1991-2020 weather-station normals for ${n} cities`);
const nGrid = N - nStation;
const highGrid = rows.filter((r) => elevOf(r.id) >= 2000 && !(SOURCE[r.id] && SOURCE[r.id].source === 'station')).length;
const sumR = (a) => a.reduce((x, y) => x + y, 0);
const maniSrc = SOURCE.manizales && SOURCE.manizales.source === 'station' && SOURCE.manizales.era5 ? SOURCE.manizales : null;
const mani = maniSrc ? rows.find((r) => r.id === 'manizales') : null;
const maniGridYear = maniSrc ? Math.round(maniSrc.era5.h.reduce((t, h, i) => t + comfort(h, maniSrc.era5.l[i], maniSrc.era5.r[i]), 0) / 12) : null;

// ---------------------------------------------------------------- table
const tbody = rows.map((r) => {
  const ys = yr(r);
  const w = r.cl.h.map((h, i) => `${h}/${r.cl.l[i]}/${r.cl.r[i] == null ? '' : r.cl.r[i]}`).join(' ');
  const msR = r.ms.map((v) => Math.round(v));
  const cells = r.ms.map((v) => `<i class="k${bin(v)}"></i>`).join('');
  return `<tr data-r="${r.region}" data-n="${esc((r.name + ' ' + r.country).toLowerCase())}" data-y="${r.year.toFixed(2)}" data-c="${r.good}" data-m="${msR.join(',')}" data-w="${w}">`
    + `<td class="cx-rank">${r.rank}</td>`
    + `<td class="cx-city"><a href="/cities/${r.id}">${esc(r.name)}</a><span>${esc(r.country)}</span></td>`
    + `<td class="cx-score"><b>${ys}</b><span class="cx-bar"><i style="width:${Math.max(0, ys)}%"></i></span></td>`
    + `<td class="cx-months"><b>${r.good}</b><span>/12</span><span class="cx-mo-only"> comfortable</span></td>`
    + `<td class="cx-strip"><span class="cx-cells" role="img">${cells}</span></td>`
    + `<td class="cx-best"><span class="cx-mo-only">Best: </span>${r.best.map((i) => MON[i]).join(', ')}</td>`
    + '</tr>';
}).join('\n');

const regionOptions = Object.keys(REGION_LABEL).map((k) => `<option value="${k}">${REGION_LABEL[k]}</option>`).join('');
const monthOptions = MONF.map((n, i) => `<option value="${SLUG[i]}">Most comfortable in ${n}</option>`).join('');
const monthHead = MON.map((s) => `<i>${s[0]}</i>`).join('');
const monthCss = MON.map((_, i) => `.cx-table[data-mo="${i}"] .cx-cells i:nth-child(${i + 1}){box-shadow:0 0 0 2px var(--color-ink);z-index:1}.cx-table[data-mo="${i}"] .cx-mlab i:nth-child(${i + 1}){color:var(--color-ink);font-weight:800}`).join('');

const monthCards = monthTop.map((arr, i) => `<div class="cx-mcard">
          <h3><a href="/comfort-index?month=${SLUG[i]}#cx-table">${MONF[i]}</a><span>${perfect[i]} cities at 100</span></h3>
          <ol>${arr.map((x) => `<li><a href="/cities/${x.r.id}">${esc(x.r.name)}</a><span>${yr(x.r)}</span></li>`).join('')}</ol>
        </div>`).join('\n        ');

// ---------------------------------------------------------------- copy
const deg = '&deg;C';
const exText = (e, what) => `${cityLink(e.r)} in ${MONF[e.mo]}: highs of ${e.hi}${deg}, lows of ${e.lo}${deg}, a mean of ${e.avg.toFixed(1).replace(/\.0$/, '')}${deg} and ${e.rain} mm of rain. Temperature scores ${e.tS}, rain scores ${e.rS}, and the month comes out at ${e.score}${what}`;

const FAQ = [
  ['What is a comfort index?',
    `A comfort index turns a city's climate into one number for how pleasant it is to live in. This one scores every month from 0 to 100 on temperature and rain, then averages the twelve months into a yearly score, so a city that is mild and dry all year scores near 100 and one with a long monsoon or a hard winter scores far lower.`],
  ['How is the yearly comfort score calculated?',
    `Each month scores 0 to 100: 55% for temperature, where a day-night average of 18 to 25${deg} gets full marks, and 45% for rain, where up to 50 mm a month is free. The yearly score is the plain average of the twelve months. We also count the comfortable months, those scoring ${COMFORTABLE} or more.`],
  ['Which cities have the most comfortable weather year round?',
    `${list(top.slice(0, 6).map((r) => `${esc(r.name)} (${yr(r)})`))} lead the index. ${all12} cities stay comfortable in all twelve months, most of them on dry coasts cooled by the ocean, such as the Canary Islands, the Peruvian coast and Morocco's Atlantic shore, or on high plateaus near the tropics, such as central Mexico and East Africa.`],
  ['What are the best places to live for weather?',
    `By yearly comfort, the leader in each region is ${Object.keys(REGION_NAMES).map((k) => { const r = topIn(k); return r ? `${esc(r.name)} in ${REGION_NAMES[k]} (${yr(r)})` : null; }).filter(Boolean).join('; ')}. Filter the table by region to see the rest, then weigh humidity and sunshine, which the index does not measure.`],
  ['Why does a cold, dry city outscore a hot, rainy one?',
    `The temperature half of a month's score stops at zero, but the rain half keeps falling to minus 60. A frozen month with no rain keeps 45 points; a monsoon month can drop below zero. We built it that way on the view that daily rain disrupts a working day more than cold does. If you hate cold more than rain, read the 12-month strip rather than the yearly score.`],
  ['Is this the same as the BestPlaces comfort index?',
    `No. BestPlaces publishes its own comfort index for places in the United States, with its own method. This index covers ${fmt(N)} cities worldwide, uses ${stationPhrase(fmt(nStation))} and Open-Meteo's ERA5 grid for 2019 to 2023 for the other ${fmt(nGrid)}, and its whole formula is written out on this page, so any score can be recomputed by hand.`],
];
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&deg;/g, '°').replace(/&amp;/g, '&');
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) };
const faqHtml = FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n          ');

const clim = PROV.climate || {};
const dataset = {
  '@context': 'https://schema.org', '@type': 'Dataset',
  name: 'The Nomad Comfort Index',
  description: `Climate comfort scores for ${N} cities worldwide: a 0 to 100 score for every month from temperature and rainfall, the yearly average of those scores, the number of comfortable months and the three best months, computed from ${stationPhrase(nStation)} and Open-Meteo ERA5 averages for 2019 to 2023 for the other ${nGrid}.`,
  url: BASE + '/comfort-index',
  creator: { '@id': BASE + '/#organization' },
  isBasedOn: [clim.sourceUrl || 'https://www.ncei.noaa.gov/products/wmo-climate-normals', 'https://open-meteo.com/en/docs/historical-weather-api'],
  temporalCoverage: '1991-01-01/2023-12-31',
  spatialCoverage: { '@type': 'Place', name: 'Worldwide' },
  dateModified: clim.retrieved || undefined,
  license: BASE + '/terms',
  measurementTechnique: `Monthly score = 0.55 x temperature + 0.45 x rain. Temperature: 100 when the mean of the average high and low is 18-25 C, minus 6 per degree outside that band and minus 5 per degree the high exceeds 30 C, floored at 0. Rain: 100 up to 50 mm, minus 0.5 per mm above, floored at -60. Yearly score = mean of the 12 monthly scores. Comfortable month = score of ${COMFORTABLE} or more.`,
  variableMeasured: ['Monthly comfort score (0-100)', 'Yearly comfort score (mean of 12 months)', 'Comfortable months per year', 'Best three months'],
};
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Comfort Index', BASE + '/comfort-index']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

// Funchal, Madeira: the island of eternal spring, a calm hillside view with no crowd in it.
// (The first hero was a crowded Las Canteras beach; a comfort index wants the climate, not the people.)
const HERO_ID = 'funchal';
const hero = ATTRIB[HERO_ID] || {};
const heroCredit = hero.author ? `<a class="hero-credit" href="${esc(hero.sourcePageUrl)}" target="_blank" rel="nofollow noopener">Photo: ${esc(hero.author)} / ${esc(hero.source || 'Wikimedia Commons')} (${esc(hero.license)})</a>` : '';

// The nav is lifted from services.html. apply_tools_nav.cjs adds "Comfort Index" to it; until that
// sweep has run on services.html the label is not there, so fall back to no active item and let the
// sweep (which also runs on this page) set it.
let nav;
if (shell.nav.includes('>Comfort Index<')) nav = shell.navFor('Comfort Index');
else { nav = shell.navFor(); console.log('note: services.html nav has no "Comfort Index" yet; run apply_tools_nav.cjs after this.'); }

const title = `Comfort Index: ${N} Cities Ranked by Climate Comfort`;
const desc = `${N} cities scored 0 to 100 for climate comfort, month by month, from weather-station and climate records. Filter by region or find the best for any month.`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${BASE}/comfort-index">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="The Nomad Comfort Index: ${N} cities ranked by climate comfort">
  <meta property="og:description" content="A 0 to 100 comfort score for every month in ${N} cities, the comfortable months in each, and the best three to go.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/comfort-index">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/images/cities/${HERO_ID}.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(dataset)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    :root { --cx-k0:#efe8da; --cx-k1:#d6e5d3; --cx-k2:#a6cbb0; --cx-k3:#5ea47e; --cx-k4:#2f7d5a; --cx-line:var(--color-sand-dark,#e3d9c6); --cx-soft:#faf6ee; }
    .hub-hero a.hero-credit { position:absolute; right:.8rem; bottom:.55rem; z-index:2; font-size:.68rem; color:rgba(255,255,255,.8); text-decoration:none; text-shadow:0 1px 6px rgba(0,0,0,.5); max-width:calc(100% - 1.6rem); text-align:right; }
    .hub-hero a.hero-credit:hover { color:#fff; text-decoration:underline; }
    .cx-wrap { max-width:1180px; margin:0 auto; padding:2.2rem var(--space-4,1rem) 3rem; }
    .cx-lead { font-size:var(--text-lg); line-height:1.7; color:var(--color-charcoal); max-width:68ch; margin:0 0 1.6rem; }
    .cx-lead b { color:var(--color-ink); }
    .cx-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; margin:0 0 2rem; }
    .cx-stat { background:#fff; border:1px solid var(--cx-line); border-radius:14px; padding:1.05rem 1.2rem; box-shadow:0 6px 16px rgba(15,23,42,.04); }
    .cx-stat b { display:block; font-family:var(--font-display); font-weight:400; font-size:2.1rem; line-height:1.1; color:var(--color-ink); }
    .cx-stat span { display:block; font-size:.9rem; color:var(--color-stone); line-height:1.45; margin-top:.25rem; }
    .cx-controls { display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; background:#fff; border:1px solid var(--cx-line); border-radius:14px; padding:1rem 1.15rem; box-shadow:0 6px 16px rgba(15,23,42,.04); margin-bottom:1rem; }
    .cx-field label { display:block; font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .3rem; font-weight:600; }
    .cx-field input, .cx-field select { font-family:inherit; font-size:.95rem; padding:.5rem .7rem; border:1px solid var(--cx-line); border-radius:9px; background:#fff; color:var(--color-ink); max-width:100%; }
    .cx-field input { width:210px; }
    .cx-count { margin-left:auto; font-size:.88rem; color:var(--color-stone); align-self:center; }
    .cx-legend { display:flex; flex-wrap:wrap; align-items:center; gap:.4rem .9rem; font-size:.82rem; color:var(--color-stone); margin:0 0 .9rem; }
    .cx-rampgrp { white-space:nowrap; }
    .cx-ramp { display:inline-flex; margin:0 .3rem; gap:2px; vertical-align:middle; }
    .cx-ramp i { width:22px; height:12px; border-radius:3px; display:block; }
    .k0{background:var(--cx-k0)} .k1{background:var(--cx-k1)} .k2{background:var(--cx-k2)} .k3{background:var(--cx-k3)} .k4{background:var(--cx-k4)}
    .cx-tablewrap { border:1px solid var(--cx-line); border-radius:14px; background:#fff; box-shadow:0 6px 16px rgba(15,23,42,.04); }
    table.cx-table { border-collapse:separate; border-spacing:0; width:100%; font-size:.93rem; }
    .cx-table th { text-align:left; font-size:.7rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); font-weight:700; padding:.75rem .8rem; border-bottom:1px solid var(--cx-line); white-space:nowrap; user-select:none; background:var(--color-sand,#f6f1e7); position:sticky; top:var(--nav-height,64px); z-index:2; }
    .cx-table th:first-child { border-top-left-radius:14px; } .cx-table th:last-child { border-top-right-radius:14px; }
    .cx-table th[data-k] { cursor:pointer; } .cx-table th[data-k]:hover { color:var(--color-ink); }
    .cx-table th.sorted::after { content:' \\2193'; } .cx-table th.sorted.asc::after { content:' \\2191'; }
    .cx-table td { padding:.5rem .8rem; border-bottom:1px solid #f1ebe0; vertical-align:middle; font-variant-numeric:tabular-nums; }
    .cx-table tbody tr:last-child td { border-bottom:none; }
    .cx-table tbody tr:hover td { background:var(--cx-soft); }
    .cx-rank { color:var(--color-stone); width:2.6rem; }
    .cx-table td.cx-city a { color:var(--color-ink); font-weight:700; text-decoration:none; } .cx-table td.cx-city a:hover { color:var(--color-terracotta); }
    .cx-city span { font-size:.84rem; color:var(--color-stone); margin-left:.45rem; }
    .cx-score { width:9rem; white-space:nowrap; }
    .cx-score b { display:inline-block; min-width:2.1rem; font-size:1.05rem; color:var(--color-ink); }
    .cx-bar { display:inline-block; vertical-align:middle; width:4.6rem; height:6px; border-radius:3px; background:#efe8da; overflow:hidden; margin-left:.35rem; }
    .cx-bar i { display:block; height:100%; background:var(--cx-k4); border-radius:3px; }
    .cx-months { width:5.5rem; white-space:nowrap; color:var(--color-stone); } .cx-months b { color:var(--color-ink); }
    .cx-mo-only { display:none; }
    .cx-table tbody tr[hidden] { display:none !important; }
    .cx-strip { width:16.5rem; }
    .cx-cells, .cx-mlab { display:grid; grid-template-columns:repeat(12,1fr); gap:2px; width:15rem; }
    .cx-cells i { position:relative; display:block; height:20px; border-radius:4px; cursor:default; }
    .cx-mlab i { font-style:normal; text-align:center; font-size:.68rem; letter-spacing:0; }
    .cx-best { color:var(--color-charcoal); white-space:nowrap; width:9.5rem; }
    .cx-more { display:block; margin:0 auto; font-family:inherit; font-size:.92rem; font-weight:600; color:var(--color-ink); background:#fff; border:1px solid var(--cx-line); border-radius:999px; padding:.6rem 1.3rem; cursor:pointer; }
    .cx-more:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .cx-morewrap { padding:1rem; border-top:1px solid #f1ebe0; }
    .cx-empty { padding:2rem 1rem; text-align:center; color:var(--color-stone); }
    .cx-note { font-size:.84rem; color:var(--color-stone); line-height:1.6; margin:1rem 0 0; }
    .cx-tip { position:absolute; z-index:50; pointer-events:none; background:var(--color-ink); color:#fff; font-size:.8rem; line-height:1.4; padding:.45rem .65rem; border-radius:8px; box-shadow:0 8px 20px rgba(15,23,42,.25); white-space:nowrap; }
    .cx-tip b { color:#fff; } .cx-tip span { color:rgba(255,255,255,.72); }
    .cx-section { margin-top:3.2rem; }
    .cx-h2 { font-family:var(--font-display); font-weight:400; font-size:clamp(1.5rem,3vw,1.9rem); color:var(--color-ink); margin:0 0 .5rem; }
    .cx-sub { color:var(--color-stone); margin:0 0 1.3rem; max-width:68ch; line-height:1.6; }
    .cx-months-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
    .cx-mcard { background:#fff; border:1px solid var(--cx-line); border-radius:14px; padding:1rem 1.1rem .8rem; }
    .cx-mcard h3 { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; font-size:1.02rem; margin:0 0 .5rem; } .cx-mcard h3 span { font-family:var(--font-body); font-size:.76rem; font-weight:400; color:var(--color-stone); } .cx-months-grid .cx-mcard h3 a { color:var(--color-ink); text-decoration:none; } .cx-months-grid .cx-mcard h3 a:hover { color:var(--color-terracotta); }
    .cx-mcard ol { list-style:none; margin:0; padding:0; counter-reset:m; }
    .cx-mcard li { display:flex; justify-content:space-between; gap:.6rem; padding:.3rem 0; border-top:1px solid #f1ebe0; font-size:.9rem; counter-increment:m; }
    .cx-mcard li::before { content:counter(m); color:var(--color-stone); width:1rem; flex:0 0 auto; font-variant-numeric:tabular-nums; }
    .cx-months-grid .cx-mcard li a { flex:1; min-width:0; color:var(--color-charcoal); text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .cx-months-grid .cx-mcard li a:hover { color:var(--color-terracotta); }
    .cx-mcard li span { color:var(--color-stone); font-variant-numeric:tabular-nums; }
    .cx-prose { background:var(--color-sand,#f6f1e7); border-top:1px solid var(--cx-line); padding:3rem 0 3.5rem; margin-top:3.5rem; }
    .cx-prose .container { max-width:820px; }
    .cx-prose h2 { font-family:var(--font-display); font-weight:400; font-size:1.6rem; color:var(--color-ink); margin:2.2rem 0 .8rem; } .cx-prose h2:first-child { margin-top:0; }
    .cx-prose p, .cx-prose li { font-size:1.02rem; line-height:1.72; color:var(--color-charcoal); }
    .cx-prose p { margin:0 0 .95rem; }
    .cx-prose ul { margin:0 0 1rem 1.1rem; padding:0; } .cx-prose li { margin-bottom:.45rem; }
    .cx-prose a { color:var(--color-terracotta); }
    .cx-formula { background:#fff; border:1px solid var(--cx-line); border-radius:12px; padding:1rem 1.2rem; margin:0 0 1.1rem; }
    .cx-formula p { margin:0 0 .5rem; } .cx-formula p:last-child { margin:0; }
    .cx-prose details { border-bottom:1px solid var(--cx-line); padding:.85rem 0; }
    .cx-prose summary { font-weight:600; color:var(--color-ink); cursor:pointer; font-size:1.02rem; list-style:none; position:relative; padding-right:1.5rem; }
    .cx-prose summary::-webkit-details-marker { display:none; }
    .cx-prose summary::after { content:'+'; position:absolute; right:0; top:-2px; font-size:1.3rem; color:var(--color-terracotta); }
    .cx-prose details[open] summary::after { content:'\\2013'; }
    .cx-prose details p { margin:.7rem 0 0; }
    .cx-related ul { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:.5rem .7rem; }
    .cx-related li { margin:0; }
    .cx-prose .cx-related a { display:inline-block; background:#fff; border:1px solid var(--cx-line); border-radius:999px; padding:.4rem .9rem; font-size:.9rem; font-weight:600; color:var(--color-charcoal); text-decoration:none; }
    .cx-prose .cx-related a:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    ${monthCss}
    @media (max-width:1023px){ .cx-months-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media (max-width:900px){
      .cx-stats { grid-template-columns:1fr; gap:.6rem; }
      .cx-stat { display:flex; align-items:baseline; gap:.8rem; padding:.8rem 1rem; }
      .cx-stat b { font-size:1.7rem; flex:0 0 auto; } .cx-stat span { margin:0; }
      .cx-tablewrap { border-radius:12px; }
      .cx-table, .cx-table thead, .cx-table tbody { display:block; width:100%; }
      .cx-table tr { display:grid; grid-template-columns:2.1rem minmax(0,1fr) auto; grid-template-areas:"rank city score" ". strip strip" ". meta best"; column-gap:.6rem; row-gap:.4rem; padding:.7rem .9rem; border-bottom:1px solid #f1ebe0; }
      .cx-table tbody tr:last-child { border-bottom:none; }
      .cx-table thead tr { padding:.55rem .9rem; background:var(--color-sand,#f6f1e7); border-radius:12px 12px 0 0; position:sticky; top:var(--nav-height,64px); z-index:2; grid-template-areas:". strip strip"; row-gap:0; }
      .cx-table thead th { display:none; padding:0; border:0; position:static; background:none; }
      .cx-table thead th.cx-strip { display:block; grid-area:strip; width:auto; }
      .cx-table td { display:block; padding:0; border:0; width:auto; }
      .cx-table tbody tr:hover td { background:none; }
      .cx-rank { grid-area:rank; padding-top:.1rem !important; }
      .cx-table td.cx-city { grid-area:city; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-top:.1rem; } .cx-city span { font-size:.8rem; margin-left:.35rem; }
      .cx-score { grid-area:score; text-align:right; } .cx-score b { font-size:1.25rem; min-width:0; } .cx-bar { display:none; }
      .cx-strip { grid-area:strip; }
      .cx-cells, .cx-mlab { width:100%; }
      .cx-cells i { height:22px; }
      .cx-months { grid-area:meta; font-size:.82rem; } .cx-best { grid-area:best; font-size:.82rem; text-align:right; color:var(--color-stone); }
      .cx-mo-only { display:inline; }
      .cx-field { flex:1 1 100%; } .cx-field input, .cx-field select { width:100%; }
      .cx-count { margin-left:0; }
      .cx-months-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width:520px){ .cx-months-grid { grid-template-columns:1fr; } }
  </style>
  ${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${nav}
  <main id="main-content" tabindex="-1">
    <header class="hub-hero">
      <img class="hub-hero-img" src="/images/cities/${HERO_ID}.webp" alt="${esc(hero.alt || 'Funchal on the hillsides above the harbour, Madeira')}" fetchpriority="high" width="1600" height="1067">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Data</span>
        <h1>The Nomad Comfort Index</h1>
        <p class="sub">How comfortable is a city's climate across the whole year? Every one of our ${N} cities, scored month by month on temperature and rain from five years of climate records, then ranked.</p>
      </div></div>
      ${heroCredit}
    </header>
    <div class="cx-wrap">
      <p class="cx-lead">Each city gets a comfort score from 0 to 100 for every month, and its yearly score is the average of the twelve. <b>${esc(top[0].name)}</b>, <b>${esc(top[1].name)}</b> and <b>${esc(top[2].name)}</b> top the list; the median city scores <b>${median}</b>. The strip beside each city shows where its comfortable months fall, so a city with a perfect summer and a hard winter is easy to tell from one that is merely pleasant all year.</p>
      <div class="cx-stats">
        <div class="cx-stat"><b>${all12}</b><span>cities are comfortable in all twelve months, and ${none} in none of them</span></div>
        <div class="cx-stat"><b>${MONF[bestMo]}</b><span>is comfortable in the most cities: ${byMonth[bestMo]} of ${N}</span></div>
        <div class="cx-stat"><b>${MONF[worstMo]}</b><span>is comfortable in the fewest: ${byMonth[worstMo]} of ${N}</span></div>
      </div>
      <div class="cx-controls" id="cx-table">
        <div class="cx-field"><label for="cxSearch">Search city or country</label><input type="search" id="cxSearch" placeholder="e.g. Lisbon, Peru&hellip;" autocomplete="off"></div>
        <div class="cx-field"><label for="cxRegion">Region</label><select id="cxRegion"><option value="">All regions</option>${regionOptions}</select></div>
        <div class="cx-field"><label for="cxMonth">Rank by</label><select id="cxMonth"><option value="">Whole year</option>${monthOptions}</select></div>
        <span class="cx-count" id="cxCount" aria-live="polite">${N} cities</span>
      </div>
      <div class="cx-legend"><span>Monthly comfort, January to December:</span><span class="cx-rampgrp">less <span class="cx-ramp" aria-hidden="true"><i class="k0"></i><i class="k1"></i><i class="k2"></i><i class="k3"></i><i class="k4"></i></span> more</span><span>&middot; the darkest step (${COMFORTABLE}+) counts as a comfortable month</span></div>
      <div class="cx-tablewrap">
        <table class="cx-table" id="cxTable">
          <thead><tr>
            <th class="cx-rank">#</th>
            <th class="cx-city" data-k="name">City</th>
            <th class="cx-score sorted" data-k="score" id="cxScoreH">Yearly score</th>
            <th class="cx-months" data-k="months" title="Months scoring ${COMFORTABLE} or more">Comfortable</th>
            <th class="cx-strip"><span class="cx-mlab" aria-label="January to December">${monthHead}</span></th>
            <th class="cx-best">Best months</th>
          </tr></thead>
          <tbody id="cxBody">
${tbody}
          </tbody>
        </table>
        <div class="cx-morewrap" id="cxMoreWrap" hidden><button type="button" class="cx-more" id="cxMore"></button></div>
        <p class="cx-empty" id="cxEmpty" hidden>No city matches. Clear the search or pick another region.</p>
      </div>
      <p class="cx-note">Scores from the average daily high and low and total rain for each month: ${stationPhrase(fmt(nStation))}, Open-Meteo ERA5 averages for 2019 to 2023 for the other ${fmt(nGrid)}, named under each city's weather chart. Hover or tap a month in the strip for its numbers. The best months are the three highest-scoring ones, the same three each city's guide shows in its weather chart.</p>

      <section class="cx-section">
        <h2 class="cx-h2">Perfect for a month, ordinary the rest of the year</h2>
        <p class="cx-sub">Every month, between ${Math.min(...perfect)} and ${Math.max(...perfect)} cities score a full 100. Listed under each month are the five that score it furthest above their own yearly average, so that month is the one to plan around; the number beside each is its yearly score. Open a month for its full ranking.</p>
        <div class="cx-months-grid">
        ${monthCards}
        </div>
      </section>
    </div>

    <section class="cx-prose"><div class="container">
      <h2>How the comfort score works</h2>
      <p>Every month of every city gets a score out of 100, made of two parts.</p>
      <div class="cx-formula">
        <p><b>Temperature, 55% of the month.</b> Take the average of the month's typical daytime high and night-time low. Anything from 18 to 25${deg} scores the full 100. Every degree outside that band costs 6 points, and every degree the daytime high climbs past 30${deg} costs another 5, so a city that is mild on average but scorching in the afternoon still pays for the heat. This part never drops below zero.</p>
        <p><b>Rain, 45% of the month.</b> Up to 50 mm of rain in the month is free. Every millimetre beyond that costs half a point, and this part can fall as far as minus 60, so a monsoon month drags the whole month down however warm it is.</p>
        <p><b>Yearly score.</b> The plain average of the twelve monthly scores. A <b>comfortable month</b> is one that scores ${COMFORTABLE} or more, the same line our <a href="/best-weather">best weather by month finder</a> draws for ideal weather. In a dry month that rules out anything averaging below about 12${deg}, and most months with afternoon highs in the mid-30s.</p>
      </div>
      <p>Three months, worked through. ${exA ? exText(exA, ', about as good as a month gets.') : ''} ${exB ? exText(exB, ', because the rain wipes out a pleasant temperature.') : ''} ${exC ? exText(exC, exC.score < 0 ? ': the cold wipes out the temperature half and the rain pulls the month below zero.' : ': the cold wipes out the temperature half and only the rain half is left.') : ''}</p>
      <p>The 18 to 25${deg} band, the penalties and the 55/45 split are our judgement about what makes a month easy to live and work in. They are not an international standard, which is why every number is written out here. The same model picks the best months to visit on every city guide, so this index and the guides cannot disagree about a city.</p>

      <h2>What the index cannot tell you</h2>
      <ul>
        <li><b>It describes climate, not weather.</b> For ${fmt(nStation)} cities the figures are the 1991-2020 normals of a weather station near the city, the 30-year averages national weather services publish${nShort ? ` (for ${nShort} of them the station publishes other years, and the chart says which)` : ''}; for the other ${fmt(nGrid)} they are averages of five years, 2019 to 2023. Either way they describe a typical January, not the one you will get.</li>
        <li><b>Humidity, sunshine and wind are not in it.</b> ${lima ? `${cityLink(lima)} scores ${yr(lima)} because it is mild and almost rainless, yet the model cannot see the low grey cloud that sits over the coast for much of the southern winter.` : ''} Equally, 30${deg} feels very different in dry Andalusia than on a humid tropical coast.</li>
        <li><b>It is harder on rain than on cold.</b> A month far below freezing but dry keeps 45 points from its rain half, while a very wet month can fall below zero. ${negCities} cities have at least one month that does. That is a choice, made on the view that rain disrupts a working day more than cold does. If cold is what you cannot stand, read the strip rather than the yearly number.</li>
        <li><b>Cities without a nearby station carry a margin.</b> A city takes a station's numbers only when the station is within 25 km and 250 m of height. For the other ${fmt(nGrid)} the data comes from ERA5, a reanalysis that averages the weather over grid cells about 25 km wide: on a coast a cell can take in open sea, in the mountains slopes far above or below the town. ${highGrid ? `${highGrid} of them sit above 2,000 m, and those deserve the most caution.` : ''}${mani ? ` ${cityLink(mani)} shows the size of the error: its grid cell put ${fmt(sumR(maniSrc.era5.r))} mm of rain a year on it and a comfort score of ${maniGridYear}, while the ${esc(maniSrc.station)} station measures ${fmt(sumR(mani.cl.r))} mm, and it scores ${yr(mani)}.` : ''}</li>
      </ul>

      <h2>Frequently asked questions</h2>
      ${faqHtml}

      <h2>Keep exploring</h2>
      <div class="cx-related"><ul>
        <li><a href="/best-weather">Best weather by month</a></li>
        <li><a href="/best/best-cities-for-year-round-weather">Best cities for year-round weather</a></li>
        <li><a href="/route">Plan a route around the seasons</a></li>
        <li><a href="/map">Every city on the world map</a></li>
        <li><a href="/methodology">Where every dataset comes from</a></li>
      </ul></div>
    </div></section>
  </main>
  ${shell.footer}
${shell.bodyEnd}
  <script>
    (function(){
      var table=document.getElementById('cxTable'),body=document.getElementById('cxBody');
      var search=document.getElementById('cxSearch'),region=document.getElementById('cxRegion'),month=document.getElementById('cxMonth');
      var count=document.getElementById('cxCount'),empty=document.getElementById('cxEmpty'),scoreH=document.getElementById('cxScoreH');
      var SLUG=${JSON.stringify(SLUG)},MONF=${JSON.stringify(MONF)};
      var rows=[].map.call(body.rows,function(tr){
        return {tr:tr,n:tr.getAttribute('data-n'),r:tr.getAttribute('data-r'),y:+tr.getAttribute('data-y'),c:+tr.getAttribute('data-c'),
          m:tr.getAttribute('data-m').split(',').map(Number),name:tr.querySelector('.cx-city a').textContent,
          rank:tr.querySelector('.cx-rank'),b:tr.querySelector('.cx-score b'),bar:tr.querySelector('.cx-bar i')};
      });
      rows.forEach(function(x){x.tr.querySelector('.cx-cells').setAttribute('aria-label','Comfort by month, January to December: '+x.m.join(', '));});
      var sortK='score',asc=false,mo=-1,open=false,LIM=50;
      var more=document.getElementById('cxMore'),moreWrap=document.getElementById('cxMoreWrap');
      more.addEventListener('click',function(){open=true;apply();});
      function val(x){return mo<0?x.y:x.m[mo];}
      function apply(){
        var q=(search.value||'').trim().toLowerCase(),rg=region.value;
        var vis=rows.filter(function(x){return (!rg||x.r===rg)&&(!q||x.n.indexOf(q)>=0);});
        vis.sort(function(a,b){var d;
          if(sortK==='name')d=a.name.localeCompare(b.name);
          else if(sortK==='months')d=a.c-b.c||val(a)-val(b);
          else d=val(a)-val(b)||a.y-b.y;
          return asc?d:-d;});
        var f=document.createDocumentFragment();
        rows.forEach(function(x){x.tr.hidden=true;});
        vis.forEach(function(x,i){x.tr.hidden=!open&&i>=LIM;x.rank.textContent=i+1;var v=Math.round(val(x));x.b.textContent=v;x.bar.style.width=Math.max(0,v)+'%';f.appendChild(x.tr);});
        body.appendChild(f);
        empty.hidden=vis.length>0;
        moreWrap.hidden=open||vis.length<=LIM;more.textContent='Show all '+vis.length+' cities';
        count.textContent=vis.length===rows.length?rows.length+' cities':vis.length+' of '+rows.length+' cities';
      }
      function setMonth(i){mo=i;if(i<0)table.removeAttribute('data-mo');else table.setAttribute('data-mo',i);scoreH.textContent=i<0?'Yearly score':MONF[i].slice(0,3)+' score';}
      function syncUrl(){try{var u=new URL(window.location);if(mo>=0)u.searchParams.set('month',SLUG[mo]);else u.searchParams.delete('month');if(region.value)u.searchParams.set('region',region.value);else u.searchParams.delete('region');history.replaceState(null,'',u);}catch(e){}}
      table.querySelectorAll('th[data-k]').forEach(function(th){th.addEventListener('click',function(){
        var k=th.getAttribute('data-k');if(sortK===k)asc=!asc;else{sortK=k;asc=(k==='name');}
        table.querySelectorAll('th').forEach(function(h){h.classList.remove('sorted','asc');});th.classList.add('sorted');if(asc)th.classList.add('asc');apply();});});
      search.addEventListener('input',apply);
      region.addEventListener('change',function(){apply();syncUrl();});
      month.addEventListener('change',function(){setMonth(month.value?SLUG.indexOf(month.value):-1);sortK='score';asc=false;
        table.querySelectorAll('th').forEach(function(h){h.classList.remove('sorted','asc');});scoreH.classList.add('sorted');apply();syncUrl();});
      // tooltip for the 12-month strip
      var tip=document.createElement('div');tip.className='cx-tip';tip.hidden=true;document.body.appendChild(tip);
      function show(cell){var tr=cell.closest('tr');if(!tr||!tr.getAttribute('data-w'))return;var i=[].indexOf.call(cell.parentNode.children,cell);
        var w=tr.getAttribute('data-w').split(' ')[i].split('/'),sc=tr.getAttribute('data-m').split(',')[i];
        tip.innerHTML='<b>'+MONF[i]+'</b> <span>&middot;</span> '+w[0]+'&deg; / '+w[1]+'&deg;C <span>&middot;</span> '+(w[2]===''?'n/a':w[2]+' mm rain')+' <span>&middot;</span> <b>'+sc+'</b>';
        tip.hidden=false;var r=cell.getBoundingClientRect(),tw=tip.offsetWidth,vw=document.documentElement.clientWidth;
        var left=Math.min(Math.max(8,r.left+r.width/2-tw/2),vw-tw-8);tip.style.left=(left+window.pageXOffset)+'px';tip.style.top=(r.top+window.pageYOffset-tip.offsetHeight-8)+'px';}
      body.addEventListener('mouseover',function(e){var c=e.target.closest('.cx-cells i');if(c)show(c);else tip.hidden=true;});
      body.addEventListener('mouseleave',function(){tip.hidden=true;});
      body.addEventListener('click',function(e){var c=e.target.closest('.cx-cells i');if(c)show(c);});
      window.addEventListener('scroll',function(){tip.hidden=true;},{passive:true});
      // state from the URL (?month=jan&region=asia)
      try{var sp=new URLSearchParams(window.location.search);var mp=(sp.get('month')||'').toLowerCase();var rp=sp.get('region');
        if(rp&&region.querySelector('option[value="'+rp+'"]'))region.value=rp;
        if(SLUG.indexOf(mp)>=0){month.value=mp;setMonth(SLUG.indexOf(mp));}}catch(e){}
      apply();
    })();
  </script>
</body>
</html>`;

shell.assertComplete(html, 'comfort-index.html');
shell.writePage('comfort-index.html', html);
console.log(`Wrote comfort-index.html: ${N} cities. Top ${rows.slice(0, 3).map((r) => r.name + ' ' + yr(r)).join(', ')}; ${all12} comfortable all year; median ${median}.`);

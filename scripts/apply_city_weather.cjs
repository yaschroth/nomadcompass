require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Injects a static, crawlable "Weather in <City>" section (12-month temperature + rainfall
 * chart, best-time-to-visit summary) into every city page that has climate data in
 * assets/city-climate.js. Rendered server-side, so no client JS. The numbers are 1991-2020 station
 * normals where scripts/build_climate_stations.cjs found a station close enough, and the 2019-2023
 * Open-Meteo ERA5 grid elsewhere; data/city-climate-source.json says which, and the section names
 * the station, its distance and the provider (Meteostat's CC BY 4.0 licence requires the credit). Inserted right after the "Category Breakdown" section. Idempotent via
 * <!-- cw-start -->/<!-- cw-end --> markers (re-run safely after climate coverage grows).
 * Styles live in styles/city-page.css. Usage: node scripts/apply_city_weather.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const SOURCE = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'city-climate-source.json'), 'utf8')).cities; } catch (e) { return {}; } })();
const escH = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EXT = 'target="_blank" rel="nofollow noopener"';
const PROVIDER_HTML = {
  wmo: `WMO climate normals, published by <a href="https://www.ncei.noaa.gov/products/wmo-climate-normals" ${EXT}>NOAA NCEI</a>`,
  ideam: `<a href="https://www.ideam.gov.co/sala-de-prensa/informes/Normales-clim%C3%A1ticas-est%C3%A1ndar" ${EXT}>IDEAM</a>, Colombia's met service`,
  meteostat: `<a href="https://meteostat.net" ${EXT}>Meteostat</a> and its data providers (<a href="https://creativecommons.org/licenses/by/4.0/" ${EXT}>CC BY 4.0</a>)`,
};
// Subtitle and source line for the section: which station, how far, whose data.
function sourceLines(id) {
  const s = SOURCE[id];
  if (s && s.source === 'station' && PROVIDER_HTML[s.provider]) {
    const de = s.elev_diff_m;
    const height = Math.abs(de) >= 100 ? `, ${Math.abs(de)} m ${de > 0 ? 'higher' : 'lower'}` : '';
    return {
      sub: '30-year monthly averages (1991-2020) from a local weather station, and the best time to visit',
      note: `Climate normals for 1991-2020 measured at the ${escH(s.station)} weather station, ${s.distance_km < 1 ? 'under 1' : Math.round(s.distance_km)} km away${height}. Historical averages, not a forecast. Source: ${PROVIDER_HTML[s.provider]}.`,
    };
  }
  return {
    sub: 'Monthly averages from 2019-2023 (Open-Meteo), and the best time to visit',
    note: 'Historical monthly averages, not a forecast. Source: Open-Meteo ERA5, a grid of roughly 25 km cells, because no weather station with published normals is close enough to the city.',
  };
}
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const NAME = {}; m.exports.forEach((c) => { if (c && c.id) NAME[c.id] = c.name; });
const COORD = {}; m.exports.forEach((c) => { if (c && c.id && c.lat != null && c.lng != null) COORD[c.id] = { lat: c.lat, lng: c.lng }; });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SLUG = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function colorFor(avg) {
  if (avg < 7) return '#5b8fc9';
  if (avg < 13) return '#4c9fb0';
  if (avg < 19) return '#4fae7e';
  if (avg < 24) return '#d9b13a';
  if (avg < 29) return '#e8804d';
  return '#d1503a';
}
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

function buildSection(id) {
  const cl = CLIMATE[id];
  const name = NAME[id] || id;
  const H = cl.h, L = cl.l, R = cl.r;
  // valid months
  const valid = [];
  for (let i = 0; i < 12; i++) if (H[i] != null && L[i] != null) valid.push(i);
  if (valid.length < 6) return null;
  const min = -5, max = 42, range = max - min;
  const maxRain = Math.max(30, ...R.map((x) => (x == null ? 0 : x)));
  // best months by comfort
  const ranked = valid.map((i) => ({ i, c: comfort(H[i], L[i], R[i]) })).sort((a, b) => b.c - a.c);
  const best = ranked.slice(0, 3).map((x) => x.i).sort((a, b) => a - b);
  const bestSet = new Set(best);
  // warmest / wettest
  let warm = valid[0], wet = valid[0];
  valid.forEach((i) => { if (H[i] > H[warm]) warm = i; if ((R[i] || 0) > (R[wet] || 0)) wet = i; });

  const cols = [];
  for (let i = 0; i < 12; i++) {
    if (H[i] == null || L[i] == null) { cols.push(`<div class="cw-col"><div class="cw-mo">${MON[i]}</div></div>`); continue; }
    const hi = H[i], lo = L[i], r = R[i] == null ? 0 : R[i];
    const bottom = ((lo - min) / range * 100).toFixed(1);
    const height = Math.max(4, (hi - lo) / range * 100).toFixed(1);
    const col = colorFor((hi + lo) / 2);
    const rh = Math.round(Math.min(1, r / maxRain) * 30);
    const title = `${MON[i]}: ${hi}&deg;/${lo}&deg;C high-low, ${r}mm rain`;
    cols.push(
      `<div class="cw-col${bestSet.has(i) ? ' is-best' : ''}" title="${title}">` +
      `<div class="cw-hi">${hi}&deg;</div>` +
      `<div class="cw-temp-track"><span class="cw-temp-bar" style="bottom:${bottom}%;height:${height}%;background:${col}"></span></div>` +
      `<div class="cw-lo">${lo}&deg;</div>` +
      `<div class="cw-rain-track"><span class="cw-rain-bar" style="height:${rh}px"></span></div>` +
      `<div class="cw-mo">${MON[i]}</div></div>`
    );
  }
  const bestTxt = best.map((i) => MON[i]).join(', ');
  const summary = `<p class="cw-summary">The best time to visit ${name} for comfortable weather is <b>${bestTxt}</b>. ` +
    `The warmest month is <b>${MON[warm]}</b> (around ${H[warm]}&deg;C by day), and the wettest is <b>${MON[wet]}</b> (about ${R[wet] || 0}mm of rain).</p>` +
    `<p class="cw-cta">Chasing good weather? See <a href="/best-weather?month=${SLUG[best[0]]}">other cities that are warm in ${MON[best[0]]}</a>, or <a href="/route">plan a multi-city route</a> around the seasons, or <a href="https://kiwi.tpx.li/1UDkD8n7" target="_blank" rel="sponsored nofollow" data-aff="flights_weather">search flights</a> when you are ready to move. Staying a while in ${name}? Check <a href="/visa">visa options</a>, your <a href="/timezones">time-zone overlap</a> and <a href="/geoarbitrage">how far your budget stretches</a>, or find it on <a href="/map">the world map</a>.</p>`;
  const legend = `<div class="cw-legend"><span><span class="sw" style="background:#4fae7e"></span>Daily high &amp; low (&deg;C)</span><span><span class="sw" style="background:#7bb0e0"></span>Rainfall (mm/month)</span><span><span class="sw" style="background:rgba(47,125,90,.4)"></span>Best months to visit</span></div>`;

  const co = COORD[id];
  const live = co
    ? `<div class="cw-live" data-lat="${co.lat}" data-lng="${co.lng}" hidden>
          <span class="cw-live-eyebrow">Right now</span>
          <span class="cw-live-row"></span>
        </div>
        `
    : '';
  const liveScript = co ? '\n        <script src="/scripts/city-live-conditions.js" defer></script>' : '';

  const src = sourceLines(id);
  return '<!-- cw-start -->\n' +
    `    <section class="weather-section" id="weather">
      <div class="container">
        <div class="section-header">
          <h2>Weather in ${name}</h2>
          <p>${src.sub}</p>
        </div>
        ${live}<div class="cw-chart"><div class="cw-cols">
          ${cols.join('\n          ')}
        </div>${legend}</div>
        ${summary}
        <p class="cw-note">${src.note}</p>${liveScript}
      </div>
    </section>\n` +
    '    <!-- cw-end -->';
}

const dir = path.join(ROOT, 'cities');
let changed = 0, skipped = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html') && x !== 'index.html')) {
  const id = f.replace(/\.html$/, '');
  const fp = path.join(dir, f);
  let html = fs.readFileSync(fp, 'utf8');
  // strip any previous injection (idempotent + updatable)
  html = html.replace(/\s*<!-- cw-start -->[\s\S]*?<!-- cw-end -->/, '');
  if (!CLIMATE[id]) { fs.writeFileSync(fp, html); skipped++; continue; }
  const section = buildSection(id);
  if (!section) { fs.writeFileSync(fp, html); skipped++; continue; }
  // Tolerate extra attributes on the anchor (apply_city_toc adds id="scores"); an exact-string
  // match silently stripped the weather section from every page once the id landed.
  const open = html.search(/<section class="categories-section"[^>]*>/);
  if (open < 0) { fs.writeFileSync(fp, html); skipped++; continue; }
  const close = html.indexOf('</section>', open) + '</section>'.length;
  html = html.slice(0, close) + '\n\n    ' + section + html.slice(close);
  fs.writeFileSync(fp, html);
  changed++;
}
console.log(`Weather section applied to ${changed} city pages (${skipped} skipped: no climate/anchor).`);

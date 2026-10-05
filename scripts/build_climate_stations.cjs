/**
 * Replaces the gridded climate normals with measured station normals wherever a station is close
 * enough to stand for the city, and records which source every city ended up with.
 *
 * Why: assets/city-climate.js was built by build_city_climate.cjs from Open-Meteo's ERA5 reanalysis
 * (2019-2023), a grid of roughly 25 km cells. In mountains and on wet tropical coasts a cell is not
 * the town. Manizales (2,150 m) came out at 6,120 mm of rain a year with highs of 17-19C; its own
 * airport station measures 1,611 mm and highs of 21-23C, and the comfort index ranked it last on
 * the grid's numbers. Split read 297 mm in November and Porto 267 mm in December.
 *
 * Sources, best first (1991-2020 normals, the current WMO standard period, unless noted):
 *   wmo        WMO Climate Normals 1991-2020 as submitted by each national met service, published by
 *              NOAA NCEI (accession 0253808, data-composite-primary-parameters TMAX/TMIN/PRCP)
 *   ideam      IDEAM, Colombia's met service: "Normales climatologicas estandar 1991-2020" (xlsx)
 *   meteostat  Meteostat bulk normals (CC BY 4.0, credit "Meteostat and its data providers")
 *   national   data/climate-national-normals.json: stations transcribed from national met services
 *              that are missing from the WMO file (PAGASA, DHM Nepal, IMD, Meteo-France), each with its
 *              file URL and its own period, which is not always 1991-2020 (Iloilo 1991-2009; IMD's
 *              newest for Madikeri and Kochi's naval air station is 1981-2010). Ranked
 *              like a WMO station; the period travels into the sidecar and onto the page.
 *
 * A city takes a station when the station is within MAX_KM of the city coordinate AND within
 * MAX_ELEV_M of the city's elevation (data/city-elevations.json), has all twelve months of mean
 * daily max, mean daily min and precipitation, and passes the checks below. Airports and stations
 * with a WMO index get a 3 km head start; a national-service file beats Meteostat by 0.5 km.
 * Every other city keeps ERA5. Nothing is interpolated or adjusted for elevation.
 *
 * Checks, each one because the data actually had the fault:
 *   - WMO file coordinates that disagree with Meteostat's register by >10 km for the same WMO index:
 *     taken from the register when the names agree (the file has degrees-minutes read as decimals,
 *     Split Marjan sat in Sisak), dropped when they do not.
 *   - Station elevation vs the ground at the stated coordinate (Open-Meteo elevation API, cached):
 *     more than 200 m apart means the coordinate is wrong, station dropped.
 *   - Whole countries whose WMO TMAX/TMIN are not mean daily values: Mongolia, Turkmenistan,
 *     Armenia, Oman and Niger have median day-night ranges of 22-31C against 10-15C everywhere
 *     else (Ulaanbaatar "33C highs in July", Gyumri "-23C lows"). Their WMO rows are not used.
 *   - Per station: high below low in any month, |T| out of range, rain over 3,000 mm in a month,
 *     or a mean day-night range outside 2.5-19C (Kutaisi's file has a 205C July low).
 *   - REJECT below: stations a reviewer found wrong against every other source.
 *
 * ERA5 values replaced by a station are kept in the sidecar (era5: {h,l,r}), so a rerun can
 * restore them if a station is later rejected, and the comparison stays reproducible.
 *
 * Outputs (only with --apply):
 *   assets/city-climate.js          same shape as before: CITY_CLIMATE[id] = {h, l, r}, nothing else
 *   data/city-climate-source.json   id -> {source, provider, station, stationId, distance_km,
 *                                   elev_diff_m, period, era5?, flag?}
 * Consumers read only the first file; never add keys inside a CITY_CLIMATE entry.
 *
 * Cache: c:/tmp/nomad-climate-stations (Meteostat station list + per-station normals, the three WMO
 * CSVs, the IDEAM xlsx, the station DEM lookups). Missing files are downloaded, sequentially and
 * slowly. After --apply run the climate rebuild chain (see data/provenance.json "climate").
 *
 * Usage:
 *   node scripts/build_climate_stations.cjs            dry run: coverage, error distribution, flags
 *   node scripts/build_climate_stations.cjs --apply    write both files
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
const CACHE = 'c:/tmp/nomad-climate-stations';
const APPLY = process.argv.includes('--apply');
const MAX_KM = 25;
const MAX_ELEV_M = 250;
const UA = { 'User-Agent': 'NomadHQ climate normals (yaschroth@gmail.com)' };
const URLS = {
  meteostatStations: 'https://bulk.meteostat.net/v2/stations/full.json.gz',
  meteostatNormals: (id) => `https://bulk.meteostat.net/v2/normals/${id}.csv.gz`,
  wmo: (el) => `https://www.ncei.noaa.gov/data/oceans/archive/arc0216/0253808/1.1/data/0-data/data-composite-primary-parameters/wmo_normals_9120_${el}.csv`,
  ideam: 'https://www.ideam.gov.co/file-download/download/public/17585',
};
const BAD_TEMP_COUNTRIES = new Set(['Mongolia', 'Turkmenistan', 'Armenia', 'Oman', 'Niger']);
// city id -> station key (src:id) that must not be used for it, with the reason.
const REJECT = {
  iloilo: { 'meteostat:98637': 'highs 25-28C and lows 18-21C, 3-5C below every other source for a sea-level tropical city' },
  leh: { 'wmo:00042034': 'annual rain 35 mm, a third of the roughly 100 mm usually published for Leh; temperatures look right but the station is all-or-nothing' },
  nanaimo: { 'meteostat:71772': 'one of two Meteostat records for Entrance Island; this one has 480 mm a year, the other and Gabriola Island 926-930 mm' },
};
const PROVIDER = {
  wmo: 'WMO Climate Normals 1991-2020 (national met service, via NOAA NCEI)',
  ideam: 'IDEAM Normales Climatologicas 1991-2020',
  meteostat: 'Meteostat and its data providers (CC BY 4.0)',
  pagasa: 'PAGASA climatological normals (Philippines)',
  dhm: 'DHM Nepal climate normals 1991-2020',
  imd: 'IMD Climatological Tables (India)',
  meteofrance: 'Meteo-France fiches climatologiques 1991-2020 (Licence Ouverte 2.0)',
};
// Stations transcribed by hand from national met services that are absent from the WMO submission,
// each with the URL of the official file and its own period (PAGASA's Iloilo sheet covers 1991-2009).
const NATIONAL_F = path.join(ROOT, 'data', 'climate-national-normals.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hav = (a, b, c, d) => { const t = Math.PI / 180; const x = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(x)); };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => sum(a) / a.length;
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

async function download(url, file, { gunzip = false } = {}) {
  if (fs.existsSync(file)) return true;
  const r = await fetch(url, { headers: UA });
  if (r.status === 404) return false;
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  let b = Buffer.from(await r.arrayBuffer());
  if (gunzip) b = zlib.gunzipSync(b);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, b);
  return true;
}

// ---- minimal xlsx reader (zip central directory + shared strings + one sheet), no dependency ----
function readXlsx(file) {
  const buf = fs.readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    entries[name] = { method, csize, off };
    p += 46 + nl + xl + cl;
  }
  const read = (name) => {
    const e = entries[name]; if (!e) return null;
    const start = e.off + 30 + buf.readUInt16LE(e.off + 26) + buf.readUInt16LE(e.off + 28);
    const raw = buf.subarray(start, start + e.csize);
    return (e.method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8');
  };
  const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const shared = [];
  const ss = read('xl/sharedStrings.xml') || '';
  for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(dec([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')));
  const wb = read('xl/workbook.xml');
  const rels = read('xl/_rels/workbook.xml.rels');
  const sheets = {};
  for (const m of wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const t = new RegExp(`Id="${m[2]}"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="${m[2]}"`).exec(rels);
    sheets[dec(m[1])] = 'xl/' + (t[1] || t[2]).replace(/^\/?xl\//, '');
  }
  const col = (ref) => { let c = 0; for (const ch of ref.replace(/\d+/g, '')) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
  return (sheetName) => {
    const xml = read(sheets[sheetName]); const rows = [];
    for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      for (const cm of rm[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const v = /<v>([\s\S]*?)<\/v>/.exec(cm[3] || '');
        let val = v ? v[1] : null;
        if (val != null && /t="s"/.test(cm[2])) val = shared[+val];
        else if (val != null && !/t="(str|inlineStr)"/.test(cm[2])) val = +val;
        row[col(cm[1])] = val;
      }
      rows.push(row);
    }
    return rows;
  };
}

function sane(h, l, r) {
  for (let i = 0; i < 12; i++) if (h[i] < l[i] || h[i] > 48 || l[i] < -45 || r[i] < 0 || r[i] > 3000) return false;
  const dr = mean(h.map((v, i) => v - l[i]));
  return dr >= 2.5 && dr <= 19;
}
// Station names as a reader should see them under the chart, keyed by WMO index (or source id).
// The files carry run-together names (Stacruzdetenerife), operator codes (ACC/FIC/RCC/MET/COM) and
// network suffixes (AUT, AWS, CS, ASOS) that mean nothing to a reader.
const NAME_FIX = {
  63740: 'Nairobi Jomo Kenyatta Airport', 60020: 'Santa Cruz de Tenerife', '08184': 'Girona-Costa Brava Airport',
  '06451': 'Brussels Airport', '01415': 'Stavanger Sola', 16714: 'Athens (Plaka)', 94648: 'Adelaide (West Terrace)',
  72254: 'Austin Camp Mabry', 47696: 'Yokosuka',
};
function displayName(id, name) {
  if (NAME_FIX[id]) return NAME_FIX[id];
  return String(name).replace(/\s+/g, ' ').replace(/\s*-?\s*\b(AUT|Aut|Aws|AWS|Asos|ASOS|CS|Fwf)\b\s*$/, '').replace(/ Int'l\b/, ' International').replace(/\s+\/\s+/g, ' / ').trim();
}
function pretty(name) {
  let s = String(name).replace(/_+/g, ' ').trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\b(Ap|Intl|Aero)\b/g, (w) => ({ Ap: 'Airport', Intl: 'International', Aero: 'Aero' }[w]));
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ');
  return s;
}

(async () => {
  const m = {};
  new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
  const CUR = require(path.join(ROOT, 'assets', 'city-climate.js'));
  const ELEV = require(path.join(ROOT, 'data', 'city-elevations.json')).elevations;
  const SIDE_F = path.join(ROOT, 'data', 'city-climate-source.json');
  const SIDE = fs.existsSync(SIDE_F) ? JSON.parse(fs.readFileSync(SIDE_F, 'utf8')).cities : {};
  const cities = m.exports.filter((c) => c && c.id && CUR[c.id] && typeof c.lat === 'number');
  // The gridded baseline: the ERA5 cache entry when it was fetched for the city's current coordinate
  // (build_city_climate.cjs refetches a moved pin), else the ERA5 values kept in the sidecar for
  // station cities, else the file. Without the first, a moved pin kept the old cell's grid values.
  const GRID = (() => { try { return JSON.parse(fs.readFileSync('c:/tmp/nomad-climate-cache.json', 'utf8')); } catch (e) { return {}; } })();
  const ERA = {};
  for (const c of cities) {
    const g = GRID[c.id];
    ERA[c.id] = g && g.at && g.at[0] === c.lat && g.at[1] === c.lng ? { h: g.h, l: g.l, r: g.r } : (SIDE[c.id] && SIDE[c.id].era5) || CUR[c.id];
  }

  // ---- downloads (cached) ----
  await download(URLS.meteostatStations, path.join(CACHE, 'stations.json.gz'));
  for (const el of ['PRCP', 'TMAX', 'TMIN']) await download(URLS.wmo(el), path.join(CACHE, 'wmo', el + '.csv'));
  await download(URLS.ideam, path.join(CACHE, 'ideam-normals-1991-2020.xlsx'));

  const MS = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(CACHE, 'stations.json.gz'))));
  const msById = {}, msByWmo = {};
  for (const s of MS) { msById[s.id] = s; const w = s.identifiers && s.identifiers.wmo; if (w && !msByWmo[w]) msByWmo[w] = s; }

  // ---- WMO 1991-2020 ----
  const wraw = {};
  for (const [el, key] of [['PRCP', 'r'], ['TMAX', 'h'], ['TMIN', 'l']]) {
    for (const ln of fs.readFileSync(path.join(CACHE, 'wmo', el + '.csv'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean)) {
      const f = ln.split(',').map((s) => s.trim());
      const s = wraw[f[2]] || (wraw[f[2]] = { id: f[2], lat: +f[4], lng: +f[5], el: +f[6], country: f[7], name: f[8] });
      if (s[key]) { s.dup = true; continue; }
      s[key] = f.slice(9, 21).map((v) => { const x = parseFloat(v); return isNaN(x) || x <= -99 ? null : x; });
      if (Math.abs(s.lat - +f[4]) > 0.01 || Math.abs(s.lng - +f[5]) > 0.01) s.dup = true;
    }
  }
  const STATIONS = [];
  const dropped = { coord: 0, country: 0, insane: 0 };
  for (const s of Object.values(wraw)) {
    if (s.dup || !['h', 'l', 'r'].every((k) => s[k] && s[k].every((v) => v != null))) continue;
    if (BAD_TEMP_COUNTRIES.has(s.country)) { dropped.country++; continue; }
    if (!sane(s.h, s.l, s.r)) { dropped.insane++; continue; }
    let { lat, lng, el } = s; let name = pretty(s.name);
    const wm = /^000(\d{5})$/.exec(s.id);
    const reg = wm && msByWmo[wm[1]];
    if (reg) {
      const sameName = (() => { const a = norm(s.name), b = norm(reg.name.en); return (a.length >= 4 && b.includes(a.slice(0, 4))) || (b.length >= 4 && a.includes(b.slice(0, 4))); })();
      const dd = hav(lat, lng, reg.location.latitude, reg.location.longitude);
      if (dd > 10 && !sameName) { dropped.coord++; continue; }
      if (dd > 10) { lat = reg.location.latitude; lng = reg.location.longitude; el = reg.location.elevation; }
      if (sameName) name = reg.name.en;
    }
    STATIONS.push({ src: 'wmo', id: s.id, wmo: wm ? wm[1] : null, name, lat, lng, el, h: s.h, l: s.l, r: s.r, pref: !!wm || /aeropuerto|aeroporto|airport|\bap\b|intl|aeroport/i.test(s.name) });
  }
  // ---- IDEAM 1991-2020 ----
  {
    const sheet = readXlsx(path.join(CACHE, 'ideam-normals-1991-2020.xlsx'));
    const byId = {};
    for (const [nm, key] of [['PRECIPITACIÓN', 'r'], ['TEMPERATURA MÁXIMA', 'h'], ['TEMPERATURA MÍNIMA', 'l']]) {
      for (const row of sheet(nm).slice(2)) {
        if (row[0] == null || typeof row[7] !== 'number') continue;
        const id = String(row[0]);
        const s = byId[id] || (byId[id] = { id, name: String(row[2]).trim(), el: row[6], lng: row[7], lat: row[8] });
        if (s[key] || s.lat !== row[8]) { s.dup = true; continue; }
        s[key] = row.slice(9, 21).map((v) => (typeof v === 'number' ? v : null));
      }
    }
    for (const s of Object.values(byId)) {
      if (s.dup || !['h', 'l', 'r'].every((k) => s[k] && s[k].every((v) => v != null))) continue;
      if (!sane(s.h, s.l, s.r)) { dropped.insane++; continue; }
      STATIONS.push({ src: 'ideam', id: s.id, wmo: null, name: s.name, lat: s.lat, lng: s.lng, el: s.el, h: s.h, l: s.l, r: s.r, pref: /aeropuerto/i.test(s.name) });
    }
  }
  // ---- national met services not in the WMO file (data/climate-national-normals.json) ----
  // A station here is the met service's own file, so Meteostat's copy of the same WMO index is skipped:
  // Meteostat had Tagbilaran at a rounded coordinate 6 km off and labelled 1991-2020, PAGASA says 1991-2013.
  const nationalWmo = new Set();
  for (const s of (fs.existsSync(NATIONAL_F) ? JSON.parse(fs.readFileSync(NATIONAL_F, 'utf8')).stations : [])) {
    if (!sane(s.h, s.l, s.r)) { dropped.insane++; continue; }
    if (s.wmo) nationalWmo.add(String(s.wmo));
    STATIONS.push({ src: s.provider, id: s.id, wmo: s.wmo || null, name: s.name, lat: s.lat, lng: s.lng, el: s.el, h: s.h, l: s.l, r: s.r, pref: false, period: s.period, periodNote: s.periodNote, url: s.url });
  }
  // ---- Meteostat normals, fetched only for stations that could qualify ----
  const msWithNormals = MS.filter((s) => s.inventory && s.inventory.normals && s.inventory.normals.start && s.location && s.location.latitude != null);
  const msWant = new Set();
  for (const c of cities) {
    for (const s of msWithNormals) {
      if (Math.abs(s.location.latitude - c.lat) > 0.3) continue;
      if (hav(c.lat, c.lng, s.location.latitude, s.location.longitude) > MAX_KM) continue;
      if (ELEV[c.id] == null || s.location.elevation == null || Math.abs(s.location.elevation - ELEV[c.id]) > MAX_ELEV_M) continue;
      msWant.add(s.id);
    }
  }
  let fetched = 0;
  for (const id of msWant) {
    const f = path.join(CACHE, 'normals', id + '.csv'), f404 = path.join(CACHE, 'normals', id + '.404');
    if (fs.existsSync(f) || fs.existsSync(f404)) continue;
    const ok = await download(URLS.meteostatNormals(id), f, { gunzip: true });
    if (!ok) fs.writeFileSync(f404, '');
    fetched++; await sleep(250);
  }
  if (fetched) console.log(`fetched ${fetched} Meteostat normals files`);
  for (const id of msWant) {
    const f = path.join(CACHE, 'normals', id + '.csv');
    if (!fs.existsSync(f)) continue;
    const rows = fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split(','))
      .filter((r) => r[0] === '1991' && r[1] === '2020').sort((a, b) => +a[2] - +b[2]);
    if (rows.length !== 12 || rows.some((r) => r[3] === '' || r[4] === '' || r[5] === '')) continue;
    const l = rows.map((r) => +r[3]), h = rows.map((r) => +r[4]), r = rows.map((x) => +x[5]);
    if (!sane(h, l, r)) { dropped.insane++; continue; }
    const s = msById[id];
    if (s.identifiers && s.identifiers.wmo && nationalWmo.has(String(s.identifiers.wmo))) continue;
    STATIONS.push({ src: 'meteostat', id, wmo: (s.identifiers && s.identifiers.wmo) || null, name: s.name.en, lat: s.location.latitude, lng: s.location.longitude, el: s.location.elevation, h, l, r, pref: !!(s.identifiers && (s.identifiers.wmo || s.identifiers.icao)) });
  }

  // ---- DEM check on every station that could be picked ----
  const DEM_F = path.join(CACHE, 'dem-stations.json');
  const DEM = fs.existsSync(DEM_F) ? JSON.parse(fs.readFileSync(DEM_F, 'utf8')) : {};
  const near = (c) => STATIONS.filter((s) => Math.abs(s.lat - c.lat) < 0.3 && hav(c.lat, c.lng, s.lat, s.lng) <= MAX_KM);
  const needDem = new Map();
  for (const c of cities) for (const s of near(c)) if (DEM[s.src + ':' + s.id] == null) needDem.set(s.src + ':' + s.id, s);
  const todo = [...needDem.entries()];
  for (let i = 0; i < todo.length; i += 100) {
    const b = todo.slice(i, i + 100);
    const u = 'https://api.open-meteo.com/v1/elevation?latitude=' + b.map((x) => x[1].lat).join(',') + '&longitude=' + b.map((x) => x[1].lng).join(',');
    let res;
    for (let t = 0; t < 6; t++) { res = await (await fetch(u, { headers: UA })).json(); if (res.elevation) break; await sleep(20000); }
    b.forEach((x, j) => { DEM[x[0]] = res.elevation[j]; });
    fs.writeFileSync(DEM_F, JSON.stringify(DEM));
    if (i + 100 < todo.length) await sleep(15000);
  }

  // ---- match ----
  const side = {}, out = {};
  const log = { station: Object.fromEntries(Object.keys(PROVIDER).map((k) => [k, 0])), era5: 0, rejected: [] };
  for (const c of cities) {
    const e = ELEV[c.id];
    const cands = near(c).map((s) => {
      const key = s.src + ':' + s.id;
      const d = hav(c.lat, c.lng, s.lat, s.lng), de = s.el - e;
      const demBad = DEM[key] != null && Math.abs(DEM[key] - s.el) > 200;
      const rej = REJECT[c.id] && REJECT[c.id][key];
      if (rej) log.rejected.push(`${c.id}: ${key} ${rej}`);
      return { ...s, key, d, de, ok: e != null && Math.abs(de) <= MAX_ELEV_M && !demBad && !rej, eff: d - (s.pref ? 3 : 0) + (s.src === 'meteostat' ? 0.5 : 0) };
    }).filter((x) => x.ok).sort((a, b) => a.eff - b.eff);
    const s = cands[0];
    if (s) {
      out[c.id] = { h: s.h.map(Math.round), l: s.l.map(Math.round), r: s.r.map(Math.round) };
      side[c.id] = {
        source: 'station', provider: s.src, dataset: PROVIDER[s.src], station: displayName(s.wmo || s.id, s.name), stationId: s.wmo || s.id,
        period: s.period || '1991-2020', ...(s.periodNote ? { periodNote: s.periodNote } : {}), ...(s.url ? { url: s.url } : {}), distance_km: +s.d.toFixed(1), elev_diff_m: Math.round(s.de), era5: ERA[c.id],
      };
      log.station[s.src]++;
    } else {
      out[c.id] = ERA[c.id];
      side[c.id] = { source: 'era5', provider: 'open-meteo', dataset: 'Open-Meteo ERA5 reanalysis', period: '2019-2023' };
      log.era5++;
    }
  }

  // ---- ERA5-only plausibility: compare with the station cities around them ----
  const stationIds = Object.keys(side).filter((id) => side[id].source === 'station');
  const byId = Object.fromEntries(cities.map((c) => [c.id, c]));
  const flags = [];
  for (const c of cities) {
    if (side[c.id].source !== 'era5') continue;
    const nb = stationIds.map((id) => byId[id]).filter((o) => hav(c.lat, c.lng, o.lat, o.lng) <= 300 && Math.abs((ELEV[o.id] || 0) - (ELEV[c.id] || 0)) <= 600);
    const ratios = nb.map((o) => sum(side[o.id].era5.r) / Math.max(1, sum(out[o.id].r))).sort((a, b) => a - b);
    const med = ratios.length ? ratios[ratios.length >> 1] : null;
    const rain = sum(ERA[c.id].r);
    let why = null;
    if (med != null && ratios.length >= 2 && (med >= 1.5 || med <= 0.67) && rain > 300) why = `${ratios.length} station cities within 300 km show ERA5 ${med >= 1.5 ? 'too wet' : 'too dry'} by x${med.toFixed(2)} (median); ERA5 here ${rain} mm/yr`;
    else if (rain >= 4000) why = `ERA5 gives ${rain} mm/yr${med != null ? `; nearby station cities median ERA5/station x${med.toFixed(2)}` : ', no station city nearby to compare'}`;
    if (why) { side[c.id].flag = why; flags.push(`${c.id} (${c.name}, ${c.country}, ${ELEV[c.id]} m): ${why}`); }
  }

  // ---- report ----
  const rows = stationIds.map((id) => {
    const a = side[id].era5, b = out[id];
    return { id, ratio: sum(a.r) / Math.max(1, sum(b.r)), dh: mean(a.h.map((v, i) => v - b.h[i])), dl: mean(a.l.map((v, i) => v - b.l[i])), elev: ELEV[id] };
  });
  const q = (arr, p) => { const s = [...arr].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.round(p * (s.length - 1)))]; };
  const changed = stationIds.filter((id) => JSON.stringify(out[id]) !== JSON.stringify(CUR[id]));
  console.log(`cities ${cities.length}: station ${stationIds.length} (${Object.entries(log.station).filter((x) => x[1]).map(([k, n]) => k + ' ' + n).join(', ')}), ERA5 ${log.era5}`);
  console.log(`stations usable ${STATIONS.length}; dropped: ${dropped.coord} WMO coordinate conflicts, ${dropped.country} rows from ${BAD_TEMP_COUNTRIES.size} countries with non-daily TMAX/TMIN, ${dropped.insane} failing the sanity checks`);
  console.log(`ERA5 / station annual rain: p5 ${q(rows.map((r) => r.ratio), 0.05).toFixed(2)}, median ${q(rows.map((r) => r.ratio), 0.5).toFixed(2)}, p95 ${q(rows.map((r) => r.ratio), 0.95).toFixed(2)}; off by 1.5x or more: ${rows.filter((r) => r.ratio >= 1.5 || r.ratio <= 1 / 1.5).length}`);
  console.log(`ERA5 - station mean high: median ${q(rows.map((r) => r.dh), 0.5).toFixed(1)}C, off by >2C: ${rows.filter((r) => Math.abs(r.dh) > 2).length}; mean low: median ${q(rows.map((r) => r.dl), 0.5).toFixed(1)}C, off by >2C: ${rows.filter((r) => Math.abs(r.dl) > 2).length}`);
  console.log(`cities whose numbers change: ${changed.length}`);
  if (log.rejected.length) console.log('rejected by review:\n  ' + [...new Set(log.rejected)].join('\n  '));
  console.log(`ERA5-only cities flagged (${flags.length}):\n  ` + flags.join('\n  '));

  if (!APPLY) { console.log('\ndry run: nothing written (pass --apply)'); return; }
  const ordered = {};
  for (const id of Object.keys(CUR)) ordered[id] = out[id] || CUR[id];
  fs.writeFileSync(path.join(ROOT, 'assets', 'city-climate.js'), 'const CITY_CLIMATE = ' + JSON.stringify(ordered) + ';\n' +
    "if (typeof module !== 'undefined' && module.exports) { module.exports = CITY_CLIMATE; }\n");
  const meta = {
    generated: new Date().toISOString().slice(0, 10),
    by: 'scripts/build_climate_stations.cjs',
    rule: `nearest station with 1991-2020 normals within ${MAX_KM} km and ${MAX_ELEV_M} m of the city's elevation, airports and WMO-indexed stations favoured by 3 km; otherwise ERA5 2019-2023`,
    sources: {
      wmo: URLS.wmo('{TMAX,TMIN,PRCP}'),
      ideam: 'https://www.ideam.gov.co/sala-de-prensa/informes/Normales-clim%C3%A1ticas-est%C3%A1ndar',
      meteostat: 'https://meteostat.net (bulk normals, CC BY 4.0)',
      national: 'data/climate-national-normals.json (per-station url in the sidecar)',
      'open-meteo': 'https://open-meteo.com/en/docs/historical-weather-api',
    },
    counts: { station: stationIds.length, ...log.station, era5: log.era5, era5Flagged: flags.length },
  };
  const sideOrdered = {};
  for (const id of Object.keys(CUR)) if (side[id]) sideOrdered[id] = side[id];
  fs.writeFileSync(SIDE_F, JSON.stringify({ _meta: meta, cities: sideOrdered }, null, 1) + '\n');
  console.log('\nwrote assets/city-climate.js and data/city-climate-source.json');
})().catch((e) => { console.error(e); process.exit(1); });

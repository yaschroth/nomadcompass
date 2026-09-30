/**
 * Gate: an internet speed on a city page must say who measured it.
 *
 * Until 2026-09-29, 401 of the 1000 WiFi score tiles quoted speeds that nobody measured: "Good
 * infrastructure with speeds of 30-80 Mbps", "cafes typically offer 20-50 Mbps", "averages 80-90
 * Mbps on fixed broadband". They were template-era sentences, and the guide prose on 332 pages
 * repeated the same kind of figure ("Fixed broadband speeds average 150-220 Mbps", "Cafe WiFi is
 * typically 10-30 Mbps"). The tiles now quote Ookla's Speedtest Global Index from
 * data/internet-speeds.json, and the guide prose says only what it can say without a number.
 *
 * Two checks on every cities/*.html:
 *   TILE   the "wifi" entry of the inline CATEGORY_DESCRIPTIONS object. A speed figure fails unless
 *          the tile names Ookla or Speedtest (or a named regulator), and when it names Ookla, every
 *          Mbps figure in it must be one of the medians data/internet-speeds.json holds for that
 *          city or its country, rounded. Naming the source next to a made-up number is not a source.
 *   PROSE  any <p> or <li> in the guide. A speed figure fails unless the same element names
 *          Ookla, Speedtest or a regulator.
 *
 * Venue descriptions (<p class="venue-desc">) fail as well: a coworking space's advertised line
 * speed is the venue's own unverified claim. The 161 there were removed on 2026-09-29.
 *
 * Usage:
 *   node scripts/check_speed_claims.cjs              all city pages
 *   node scripts/check_speed_claims.cjs FILE...      only these files (used to test the gate
 *                                                    against a pre-fix copy of a page)
 *   node scripts/check_speed_claims.cjs --venues     also list venue-desc speed claims
 *   node scripts/check_speed_claims.cjs --all        list every failure, not the first 60
 * Exit 1 if any tile or guide paragraph quotes an unsourced speed.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const SHOW_VENUES = args.includes('--venues');
const ALL = args.includes('--all');
const files = args.filter((a) => !a.startsWith('--'));

const SPEED = /\d\s*(?:[Mm]bps|[Gg]bps|Mb\/s|Gb\/s|Mbit|Gbit|megabits?\b|gigabits? per second)/;
const SPEED_ALL = /(\d[\d,.]*)\s*(?:[Mm]bps|[Gg]bps|Mb\/s|Gb\/s|Mbit|Gbit|megabits?\b)/g;
const OOKLA = /\b(?:Ookla|Speedtest)\b/;
// A national regulator's published measurement is a primary source too.
const REGULATOR = /\b(?:Ofcom|FCC|ARCEP|Bundesnetzagentur|ANACOM|ACMA|TRAI|NBTC|CRTC|ComReg|AGCOM|CNMC|Commerce Commission|Measuring Broadband)\b/;

const speeds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'internet-speeds.json'), 'utf8'));

// city id -> country, from the data file every page is generated from.
const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const CITIES = new Function(src + ';return CITIES;')();
const countryOf = {};
for (const c of CITIES) countryOf[c.id] = c.country;

const allowed = (id) => {
  const e = speeds[countryOf[id]];
  const set = new Set();
  if (!e) return set;
  for (const v of [e.fixed, e.mobile]) if (v != null) set.add(Math.round(v));
  const city = (e.cities || {})[id];
  if (city) for (const v of [city.fixed, city.mobile]) if (v != null) set.add(Math.round(v));
  return set;
};

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const targets = files.length
  ? files.map((f) => path.resolve(f))
  : fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, 'cities', f));

const fails = [];
const venues = [];
let tilesChecked = 0;
let sourcedTiles = 0;

for (const file of targets) {
  const id = path.basename(file, '.html');
  const html = fs.readFileSync(file, 'utf8');

  const m = html.match(/const CATEGORY_DESCRIPTIONS = (\{.*?\});\s*\n/);
  let body = html;
  if (m) {
    body = html.replace(m[0], '');
    let obj;
    try { obj = JSON.parse(m[1]); } catch (e) { fails.push(`${id}: CATEGORY_DESCRIPTIONS does not parse (${e.message})`); obj = {}; }
    const w = obj.wifi || '';
    tilesChecked++;
    if (SPEED.test(w)) {
      if (OOKLA.test(w)) {
        sourcedTiles++;
        const ok = allowed(id);
        for (const [, n] of w.matchAll(SPEED_ALL)) {
          const v = Math.round(parseFloat(n.replace(/,/g, '')));
          if (!ok.has(v)) fails.push(`${id}: wifi tile names Ookla but quotes ${n} Mbps, which data/internet-speeds.json does not hold for ${countryOf[id] || 'this city'}`);
        }
      } else if (!REGULATOR.test(w)) {
        fails.push(`${id}: wifi tile quotes a speed with no source  "${w.match(new RegExp('.{0,50}' + SPEED.source + '.{0,10}'))[0]}"`);
      }
    }
  }

  for (const el of body.matchAll(/<(p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
    const attrs = el[2] || '';
    const text = strip(el[3]);
    if (!SPEED.test(text)) continue;
    if (/venue-desc/.test(attrs)) { venues.push(`${id}: ${text.slice(0, 110)}`); continue; }
    if (OOKLA.test(text) || REGULATOR.test(text)) continue;
    const at = text.search(SPEED);
    fails.push(`${id}: guide ${el[1]} quotes a speed with no source  "${text.slice(Math.max(0, at - 60), at + 15)}"`);
  }

  // Everything else a reader or a crawler sees: hero stats ("70 Mbps / Avg. WiFi Speed" sat in every
  // hero until 2026-09-29), table cells, and the JSON-LD FAQ. Paragraphs and list items were judged
  // above, so they are taken out first; other scripts and styles are not text.
  const ld = [...body.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((x) => x[1]).join(' ');
  const rest = body
    .replace(/<(p|li)(\s[^>]*)?>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');
  for (const [where, text] of [['page', strip(rest)], ['JSON-LD', ld]]) {
    for (const sentence of text.split(/(?<=[.!?])\s+|\\n/)) {
      if (!SPEED.test(sentence) || OOKLA.test(sentence) || REGULATOR.test(sentence)) continue;
      const at = sentence.search(SPEED);
      fails.push(`${id}: ${where} text quotes a speed with no source  "${sentence.slice(Math.max(0, at - 60), at + 15).trim()}"`);
    }
  }
}

console.log('SPEED CLAIMS GATE  (an internet speed must name who measured it)\n');
console.log(`  ${targets.length} pages, ${tilesChecked} wifi tiles, ${sourcedTiles} quoting Ookla`);
// Venue speeds now fail too. On 2026-09-29 all 161 advertised figures ("200 Mbps fiber") were
// removed rather than checked one venue site at a time: the feature stays ("with fiber"), the
// unverified number goes. A new one needs a source on the page or it does not ship.
if (venues.length) {
  for (const v of venues) fails.push('venue speed with no source  ' + v);
  if (SHOW_VENUES) for (const v of venues) console.log('    ' + v);
}
if (fails.length) {
  console.log(`\n  FAIL ${fails.length}:`);
  for (const f of (ALL ? fails : fails.slice(0, 60))) console.log('    ' + f);
  if (!ALL && fails.length > 60) console.log(`    ... and ${fails.length - 60} more`);
  process.exit(1);
}
console.log('\n  clean: every speed on a tile or in the guide names its source.');

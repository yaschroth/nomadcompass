/**
 * Injects a "Nomad facts at a glance" panel into every city page: currency, language,
 * plug type + mains voltage, tap water, tipping norm, ride-hailing app, emergency number
 * and eSIM. Country-level data from scripts/lib/country-facts.cjs (+ plug letters from
 * country-meta.cjs). Inserted right after the score section. Idempotent and self-updating:
 * re-running replaces the block between <!-- facts-start --> and <!-- facts-end -->, so
 * data edits propagate on the next run. Usage: node scripts/apply_city_facts.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const META = require('./lib/country-meta.cjs');
const FACTS = require('./lib/country-facts.cjs');

const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + '\n;globalThis.__c=CITIES;', sandbox);
const CITIES = sandbox.__c;

// International dialling codes, keyed by the same country names as cities-data.js.
const DIAL = {
  Albania: '+355', Argentina: '+54', Armenia: '+374', Australia: '+61', Austria: '+43', Azerbaijan: '+994',
  Bahrain: '+973', Belgium: '+32', Bolivia: '+591', Bosnia: '+387', 'Bosnia and Herzegovina': '+387',
  Brazil: '+55', Bulgaria: '+359', Cambodia: '+855', Canada: '+1', 'Cape Verde': '+238', Chile: '+56',
  China: '+86', Colombia: '+57', 'Costa Rica': '+506', Croatia: '+385', Cyprus: '+357', 'Czech Republic': '+420',
  Denmark: '+45', 'Dominican Republic': '+1', Ecuador: '+593', Egypt: '+20', Estonia: '+372', Ethiopia: '+251',
  Fiji: '+679', Finland: '+358', France: '+33', Georgia: '+995', Germany: '+49', Ghana: '+233', Greece: '+30',
  Guatemala: '+502', Hungary: '+36', Iceland: '+354', India: '+91', Indonesia: '+62', Iran: '+98', Ireland: '+353',
  Israel: '+972', Italy: '+39', Japan: '+81', Jordan: '+962', Kazakhstan: '+7', Kenya: '+254', Kosovo: '+383',
  Kuwait: '+965', Kyrgyzstan: '+996', Laos: '+856', Latvia: '+371', Lebanon: '+961', Lithuania: '+370',
  Luxembourg: '+352', Malaysia: '+60', Malta: '+356', Mauritius: '+230', Mexico: '+52', Montenegro: '+382',
  Morocco: '+212', Mozambique: '+258', Namibia: '+264', Nepal: '+977', Netherlands: '+31', 'New Caledonia': '+687',
  'New Zealand': '+64', Nigeria: '+234', 'North Macedonia': '+389', Norway: '+47', Oman: '+968', Palestine: '+970',
  Panama: '+507', Paraguay: '+595', Peru: '+51', Philippines: '+63', Poland: '+48', Portugal: '+351',
  'Puerto Rico': '+1', Qatar: '+974', Romania: '+40', Rwanda: '+250', 'Saudi Arabia': '+966', Senegal: '+221',
  Serbia: '+381', Singapore: '+65', Slovakia: '+421', Slovenia: '+386', 'South Africa': '+27', 'South Korea': '+82',
  Spain: '+34', 'Sri Lanka': '+94', Sweden: '+46', Switzerland: '+41', Taiwan: '+886', Tanzania: '+255',
  Thailand: '+66', Tunisia: '+216', Turkey: '+90', UAE: '+971', UK: '+44', Uganda: '+256', 'United Kingdom': '+44',
  'United States': '+1', Uruguay: '+598', Uzbekistan: '+998', Vietnam: '+84',
};
// Countries that drive on the left; everything else drives on the right.
const LEFT = new Set(['UK', 'United Kingdom', 'Ireland', 'Australia', 'New Zealand', 'India', 'Sri Lanka', 'Nepal',
  'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Japan', 'South Africa', 'Kenya', 'Tanzania', 'Uganda',
  'Cyprus', 'Malta', 'Mauritius', 'Fiji', 'Namibia', 'Mozambique']);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Same comfort model the weather section uses, so "Best time" matches that chart exactly.
function comfort(hi, lo, r) {
  const avg = (hi + lo) / 2;
  const tS = Math.max(0, 100 - Math.abs(avg - 24) * 5);
  const rS = Math.max(0, 100 - (r == null ? 40 : r) * 0.5);
  return 0.65 * tS + 0.35 * rS;
}
function bestMonths(id) {
  const cl = CLIMATE[id];
  if (!cl) return null;
  const valid = [];
  for (let i = 0; i < 12; i++) if (cl.h[i] != null && cl.l[i] != null) valid.push(i);
  if (valid.length < 6) return null;
  const ranked = valid.map((i) => ({ i, c: comfort(cl.h[i], cl.l[i], cl.r[i]) })).sort((a, b) => b.c - a.c);
  return ranked.slice(0, 3).map((x) => x.i).sort((a, b) => a - b).map((i) => MON[i]).join(', ');
}
function utcOffset(tz) {
  if (tz == null || isNaN(tz)) return null;
  const sign = tz < 0 ? '-' : '+';
  const abs = Math.abs(tz);
  const h = Math.floor(abs);
  const min = Math.round((abs - h) * 60);
  return 'UTC' + sign + h + (min ? ':' + String(min).padStart(2, '0') : '');
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SCORE_SEC = /<section class="score-section">[\s\S]*?<\/section>/;
const BLOCK = /\n?\s*<!-- facts-start -->[\s\S]*?<!-- facts-end -->/;

// Clean single-stroke line icons (Lucide, ISC-licensed) so the panel reads editorial, not emoji.
const ICONS = {
  currency: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  language: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  water: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  tipping: '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  ride: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  emergency: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6"/><path d="M12 9v6"/>',
  data: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  drive: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/><path d="M12 14.4V21"/><path d="M9.9 10.9 3.7 8.9"/><path d="m14.1 10.9 6.2-2"/>',
  dial: '<path d="M13.8 16.6a1 1 0 0 0 1.2-.3l.4-.5A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.5.4a1 1 0 0 0-.3 1.2 14 14 0 0 0 6.4 6.4z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  season: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

function fact(icon, label, value, raw) {
  return `          <div class="fact"><span class="fact-ico">${svg(icon)}</span><span class="fact-text"><span class="fact-label">${label}</span><span class="fact-value">${raw ? value : esc(value)}</span></span></div>`;
}

function panel(city) {
  const f = FACTS[city.country];
  if (!f) return null;
  const plugs = META[city.country] ? 'Type ' + META[city.country][0] : '';
  const power = [plugs, f.volt].filter(Boolean).join(' · ');
  const best = bestMonths(city.id);
  const utc = utcOffset(city.timezone);
  const facts = [
    fact('currency', 'Currency', f.cur),
    fact('language', 'Language', f.lang),
    fact('plug', 'Plugs &amp; power', power),
    fact('water', 'Tap water', f.water),
    fact('tipping', 'Tipping', f.tip),
    fact('ride', 'Ride-hailing', f.ride),
    fact('emergency', 'Emergency', f.emg),
    fact('data', 'Mobile data', 'eSIM: <a href="https://airalo.tpx.li/THf7i0S1" target="_blank" rel="sponsored nofollow">Airalo</a> / Holafly', true),
    fact('drive', 'Driving side', LEFT.has(city.country) ? 'Left' : 'Right'),
    fact('dial', 'Dialling code', DIAL[city.country] || 'n/a'),
    fact('clock', 'Time zone', utc || 'n/a'),
    fact('season', 'Best time to visit', best || 'Year-round'),
  ].join('\n');
  return `
    <!-- facts-start -->
    <section class="facts-section" id="facts" aria-label="Nomad facts at a glance">
      <div class="container">
        <div class="section-header">
          <h2>Nomad Facts at a Glance</h2>
          <p>The practical basics for ${esc(city.name)}, ${esc(city.country)}</p>
        </div>
        <div class="facts-panel">
          <div class="facts-grid">
${facts}
          </div>
        </div>
        <p class="facts-note">Country-level guidance to get you oriented, not a substitute for checking locally. Numbers and norms can change; 112 reaches emergency services from most mobiles worldwide.</p>
      </div>
    </section>
    <!-- facts-end -->`;
}

let ok = 0, skip = 0, noFacts = 0, noAnchor = 0;
for (const city of CITIES) {
  const page = path.join(ROOT, 'cities', city.id + '.html');
  if (!fs.existsSync(page)) { skip++; continue; }
  const block = panel(city);
  if (!block) { noFacts++; console.error('NO FACTS for country:', city.country, '(' + city.id + ')'); continue; }
  let s = fs.readFileSync(page, 'utf8');
  if (BLOCK.test(s)) {
    s = s.replace(BLOCK, '\n' + block);
  } else if (SCORE_SEC.test(s)) {
    s = s.replace(SCORE_SEC, (m) => m + '\n' + block);
  } else { noAnchor++; console.error('NO SCORE SECTION:', city.id); continue; }
  fs.writeFileSync(page, s);
  ok++;
}
console.log(`Facts panel: applied ${ok} | no page ${skip} | no facts ${noFacts} | no anchor ${noAnchor}`);

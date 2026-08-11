require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Replaces the emoji UI icons on every city page with the self-hosted line-icon system
 * (see scripts/lib/icons.cjs + /assets/icons.svg). Touches, per cities/*.html:
 *   - category tiles: ${cat.icon} emoji  -> ${icon(cat.icon)} (cities-data CATEGORIES now holds names)
 *   - vote buttons:   👍 / 👎            -> line thumbs-up / thumbs-down (in the JS template)
 *   - pros/cons:      ✓ Pros / ✗ Cons    -> inline check / x SVG (static markup)
 *   - weather JS:     fetchRelatedCitiesWeather + fetchWeather emoji maps -> icon(name) SVG
 * Idempotent and CRLF-aware. Run after scripts/build_icons.cjs. Mirrors apply_flag_svgs.cjs.
 */
const fs = require('fs');
const path = require('path');
const { icon } = require('./lib/icons.cjs');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');

const CHECK = icon('check');
const XMARK = icon('x');

// New weather functions (identical across all pages; anchored whole-function replacement).
const NEW_RELATED = [
  '      async function fetchRelatedCitiesWeather(cities) {',
  "        const weatherIcons = { 0: 'sun', 1: 'cloud-sun', 2: 'cloud-sun', 3: 'cloud', 45: 'cloud-fog', 48: 'cloud-fog', 51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle', 61: 'cloud-drizzle', 63: 'cloud-rain', 65: 'cloud-rain', 71: 'cloud-snow', 73: 'cloud-snow', 75: 'cloud-snow', 80: 'cloud-drizzle', 81: 'cloud-rain', 82: 'cloud-lightning', 95: 'cloud-lightning' };",
  '        for (const city of cities) {',
  '          if (city.lat && city.lng) {',
  '            try {',
  '              const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true`);',
  '              const data = await res.json();',
  '              if (data.current_weather) {',
  "                const wName = weatherIcons[data.current_weather.weathercode] || 'thermometer';",
  '                const temp = Math.round(data.current_weather.temperature);',
  '                const weatherEl = document.querySelector(`.city-card-weather[data-city-id="${city.id}"]`);',
  '                if (weatherEl) {',
  '                  weatherEl.querySelector(\'.weather-icon\').innerHTML = icon(wName);',
  '                  weatherEl.querySelector(\'.weather-temp\').textContent = `${temp}°C`;',
  '                }',
  '              }',
  '            } catch (e) { /* ignore weather errors */ }',
  '          }',
  '        }',
  '      }',
].join('\n');

const NEW_FETCHWEATHER = [
  '      async function fetchWeather() {',
  "        const el = document.getElementById('currentWeather');",
  '        if (!el) return;',
  '        const lat = el.dataset.lat;',
  '        const lng = el.dataset.lng;',
  "        if (!lat || !lng) { el.textContent = 'N/A'; return; }",
  '        try {',
  '          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);',
  '          const data = await res.json();',
  '          if (data.current_weather) {',
  '            const temp = Math.round(data.current_weather.temperature);',
  '            const code = data.current_weather.weathercode;',
  "            const wName = code === 0 ? 'sun' : code <= 3 ? 'cloud-sun' : code <= 49 ? 'cloud' : code <= 69 ? 'cloud-rain' : code <= 79 ? 'cloud-snow' : 'cloud-lightning';",
  '            el.innerHTML = `${temp}°C ` + icon(wName);',
  '          }',
  "        } catch (e) { el.textContent = 'N/A'; }",
  '      }',
].join('\n');

const RELATED_RE = /      async function fetchRelatedCitiesWeather\(cities\) \{[\s\S]*?\n      \}/;
const FETCHW_RE = /      async function fetchWeather\(\) \{[\s\S]*?catch \(e\) \{ el\.textContent = 'N\/A'; \}\r?\n      \}/;

let done = 0, skipped = 0, misses = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(DIR, f);
  let s = fs.readFileSync(abs, 'utf8');
  const before = s;
  const EOL = s.includes('\r\n') ? '\r\n' : '\n';
  const toEol = (str) => str.replace(/\n/g, EOL);

  // 1. category tile icon (JS template literal)
  s = s.split('<span class="category-icon">${cat.icon}</span>')
       .join('<span class="category-icon">${icon(cat.icon)}</span>');
  // 2. vote buttons (JS template literal)
  s = s.split('>👍</button>').join(">${icon('thumbs-up')}</button>");
  s = s.split('>👎</button>').join(">${icon('thumbs-down')}</button>");
  // 3. pros/cons labels (static markup)
  s = s.split('<span class="pros-label">✓ Pros</span>')
       .join('<span class="pros-label">' + CHECK + ' Pros</span>');
  s = s.split('<span class="cons-label">✗ Cons</span>')
       .join('<span class="cons-label">' + XMARK + ' Cons</span>');
  // 4. weather functions (whole-function anchored replacement)
  if (RELATED_RE.test(s)) s = s.replace(RELATED_RE, toEol(NEW_RELATED));
  if (FETCHW_RE.test(s)) s = s.replace(FETCHW_RE, toEol(NEW_FETCHWEATHER));

  if (s !== before) {
    fs.writeFileSync(abs, s);
    done++;
  } else if (/nh-icon-check/.test(s)) {
    skipped++; // already migrated
  } else {
    misses.push(f);
  }
}
console.log(`city pages updated: ${done}, already-done: ${skipped}, no-match: ${misses.length}`);
if (misses.length) console.log('  no-match sample:', misses.slice(0, 5).join(', '));

/**
 * Injects the interactive "Best Neighborhoods" section (card list + Leaflet map)
 * onto city pages that lack it, matching the enhanced 410 exactly. Reads
 * neighborhoods-<slug>.json from the batch dir (argv[2]) = an array of
 * { name, tagline, description, vibe, bestFor, pros[], cons[], lat, lng, priceLevel }.
 * Inserts the section before <section class="city-guide"> and the inline map-init
 * script before </body> (Leaflet is already loaded on city pages). Idempotent
 * (guards on the existing neighborhoods-section). Usage:
 *   node scripts/apply_city_neighborhoods.cjs <batchDir>
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const m = {}; new Function('module', code + '\n;module.exports = CITIES;')(m);
const byId = new Map(m.exports.map((c) => [c.id, c]));

function cardHtml(n, i) {
  const pros = (n.pros || []).map((p) => `<li>${esc(p)}</li>`).join('');
  const cons = (n.cons || []).map((p) => `<li>${esc(p)}</li>`).join('');
  return `            <article class="neighborhood-card" data-index="${i}" data-lat="${n.lat}" data-lng="${n.lng}">
              <div class="neighborhood-card-header">
                <div class="neighborhood-card-title">
                  <h3 class="neighborhood-name">${esc(n.name)}</h3>
                  <span class="neighborhood-price">${esc(n.priceLevel || '$$')}</span>
                </div>
                <span class="neighborhood-vibe">${esc(n.vibe)}</span>
              </div>
              <p class="neighborhood-tagline">${esc(n.tagline)}</p>
              <p class="neighborhood-description">${esc(n.description)}</p>
              <div class="neighborhood-best-for">
                <strong>Best for:</strong> ${esc(n.bestFor)}
              </div>
              <div class="neighborhood-pros-cons">
                <div class="neighborhood-pros">
                  <span class="pros-label">✓ Pros</span>
                  <ul>${pros}</ul>
                </div>
                <div class="neighborhood-cons">
                  <span class="cons-label">✗ Cons</span>
                  <ul>${cons}</ul>
                </div>
              </div>
            </article>`;
}

function sectionHtml(city, hoods) {
  const cards = hoods.map((n, i) => cardHtml(n, i)).join('\n');
  return `    <section class="neighborhoods-section" id="neighborhoods">
      <div class="container">
        <div class="section-header">
          <h2>Best Neighborhoods in ${esc(city.name)}</h2>
          <p>Where to base yourself for the perfect nomad experience</p>
        </div>
        <div class="neighborhoods-layout">
          <div class="neighborhoods-map-container">
            <div id="neighborhoodsMap" class="neighborhoods-map"></div>
          </div>
          <div class="neighborhoods-list">
${cards}
          </div>
        </div>
      </div>
    </section>

`;
}

function mapScript(hoods) {
  const data = JSON.stringify(hoods.map((n) => ({ name: n.name, tagline: n.tagline, lat: n.lat, lng: n.lng })));
  return `  <script>
    (function() {
      const mapEl = document.getElementById('neighborhoodsMap');
      if (!mapEl || typeof L === 'undefined') return;
      const neighborhoods = ${data};
      if (neighborhoods.length === 0) return;
      const avgLat = neighborhoods.reduce((s, n) => s + n.lat, 0) / neighborhoods.length;
      const avgLng = neighborhoods.reduce((s, n) => s + n.lng, 0) / neighborhoods.length;
      const map = L.map('neighborhoodsMap', { scrollWheelZoom: false }).setView([avgLat, avgLng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19
      }).addTo(map);
      const createIcon = (index, isActive) => L.divIcon({
        className: 'neighborhood-marker' + (isActive ? ' active' : ''),
        html: '<span>' + (index + 1) + '</span>', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
      });
      const markers = neighborhoods.map((n, i) => {
        const marker = L.marker([n.lat, n.lng], { icon: createIcon(i, false) }).addTo(map)
          .bindPopup('<strong>' + n.name + '</strong><br>' + n.tagline);
        marker.on('click', () => highlightNeighborhood(i));
        return marker;
      });
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
      function highlightNeighborhood(index) {
        markers.forEach((mk, i) => mk.setIcon(createIcon(i, i === index)));
        document.querySelectorAll('.neighborhood-card').forEach((card, i) => card.classList.toggle('active', i === index));
        map.panTo(markers[index].getLatLng());
        markers[index].openPopup();
      }
      document.querySelectorAll('.neighborhood-card').forEach((card, i) => card.addEventListener('click', () => highlightNeighborhood(i)));
      setTimeout(() => highlightNeighborhood(0), 500);
    })();
  </script>
`;
}

let done = 0, skip = 0, noData = 0, noAnchor = 0;
for (const file of fs.readdirSync(DIR).filter((f) => /^neighborhoods-.+\.json$/.test(f))) {
  const slug = file.replace(/^neighborhoods-/, '').replace(/\.json$/, '');
  const city = byId.get(slug);
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!city || !fs.existsSync(page)) { noData++; continue; }
  let hoods;
  try { hoods = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, '')); }
  catch (e) { console.error('BAD JSON', slug, e.message); noData++; continue; }
  if (!Array.isArray(hoods) || hoods.length < 3) { console.error('TOO FEW', slug); noData++; continue; }

  let s = fs.readFileSync(page, 'utf8');
  if (/class="neighborhoods-section"/.test(s)) { skip++; continue; }
  if (!/<section class="city-guide"/.test(s)) { console.error('NO ANCHOR', slug); noAnchor++; continue; }

  s = s.replace(/(\n\s*)(<section class="city-guide")/, (mm, ws, tag) => `\n${sectionHtml(city, hoods)}${ws}${tag}`);
  s = s.replace(/(\n\s*<\/body>)/i, `${mapScript(hoods)}$1`);
  fs.writeFileSync(page, s);
  done++;
}
console.log(`Neighborhoods: injected ${done} | already had ${skip} | no data ${noData} | no anchor ${noAnchor}`);

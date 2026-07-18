/**
 * For blog posts that cover MULTIPLE cities (comparisons, "best of" lists), show scores +
 * key stats for EVERY city, not just one. Two idempotent edits per mapped post:
 *   1. Insert a "City scores at a glance" comparison table (Nomad Score, monthly cost, and
 *      key category ratings per city) before the first <h2> in the article body.
 *      Marker: <!-- city-scores-start --> ... <!-- city-scores-end -->
 *   2. Replace a single-city sidebar `nomad-score-widget` (misleading on a multi-city post)
 *      with a compact multi-city version (score + profile link per city).
 * Scores are The Nomad HQ's own 0-10 ratings (labeled as such, not "official data").
 * Usage: node scripts/apply_blog_city_scores.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const byId = {}; m.exports.forEach((c) => { if (c && c.id) byId[c.id] = c; });
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
function nomadScore(c) { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); }
const money = (v) => typeof v === 'number' ? '$' + v.toLocaleString('en-US') + '/mo' : 'n/a';

// Multi-city posts -> the cities they cover (curated for accuracy).
const MAP = {
  'medellin-vs-chiang-mai': ['medellin', 'chiangmai'],
  'best-european-cities-nomads': ['lisbon', 'tbilisi', 'budapest', 'split', 'berlin', 'tallinn'],
  'best-coworking-spaces-bali': ['canggu', 'ubud'],
};

const COLS = [['cost', 'Cost'], ['wifi', 'WiFi'], ['safety', 'Safety'], ['community', 'Community'], ['climate', 'Climate']];

function tableBlock(ids) {
  const cities = ids.map((id) => byId[id]).filter(Boolean);
  const head = `<th>City</th><th>Nomad Score</th><th>Budget</th>` + COLS.map((c) => `<th>${c[1]}</th>`).join('');
  const rows = cities.map((c) => {
    const sc = nomadScore(c);
    const cats = COLS.map(([k]) => `<td>${typeof c.scores[k] === 'number' ? c.scores[k] : '-'}</td>`).join('');
    return `<tr><td class="csb-city"><a href="/cities/${c.id}">${esc(c.name)}</a><span>${esc(c.country)}</span></td><td class="csb-score">${sc}</td><td>${esc(money(c.costPerMonth))}</td>${cats}</tr>`;
  }).join('');
  return `    <!-- city-scores-start -->
    <div class="city-scores-block">
      <style>
        .city-scores-block{max-width:820px;margin:2rem auto;padding:1.4rem 1.5rem;background:#fff;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:14px}
        .city-scores-block h3{font-family:'DM Serif Display',serif;font-size:1.4rem;color:var(--color-ink,#0f172a);margin:0 0 1rem}
        .csb-scroll{overflow-x:auto}
        .csb-table{width:100%;border-collapse:collapse;font-size:.92rem}
        .csb-table th,.csb-table td{padding:.55rem .6rem;text-align:center;border-bottom:1px solid var(--color-sand,#f0e9dc);white-space:nowrap}
        .csb-table th{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--color-stone,#8a8175);font-weight:700}
        .csb-table td:first-child,.csb-table th:first-child{text-align:left}
        .csb-city a{font-weight:700;color:var(--color-ink,#0f172a);text-decoration:none}
        .csb-city a:hover{color:var(--color-terracotta,#c0392b)}
        .csb-city span{display:block;font-size:.75rem;color:var(--color-stone,#8a8175);font-weight:400}
        .csb-score{font-weight:800;color:var(--color-terracotta,#c0392b);font-size:1.05rem}
        .csb-note{font-size:.8rem;color:var(--color-stone,#8a8175);margin:.9rem 0 0}
      </style>
      <h3>City scores at a glance</h3>
      <div class="csb-scroll"><table class="csb-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="csb-note">The Nomad HQ ratings (0-10) across our 13 categories. Open a city guide for the full breakdown.</p>
    </div>
    <!-- city-scores-end -->
`;
}

function miniWidget(ids) {
  const cities = ids.map((id) => byId[id]).filter(Boolean);
  const rows = cities.map((c) => `<div class="nsm-row"><span class="nsm-name">${esc(c.name)}</span><span class="nsm-score">${nomadScore(c)}</span><a href="/cities/${c.id}">Profile &rarr;</a></div>`).join('');
  return `<div class="nomad-score-widget">
            <style>.nsm-row{display:flex;align-items:center;gap:.5rem;padding:.5rem 0;border-bottom:1px solid #E8DDD0}.nsm-row:last-child{border-bottom:none}.nsm-name{font-weight:700;flex:1}.nsm-score{font-weight:800;color:#c0392b}.nsm-row a{font-size:.82rem;font-weight:600}</style>
            <h4>City scores</h4>${rows}
          </div>`;
}

let tables = 0, widgets = 0;
for (const slug of Object.keys(MAP)) {
  const abs = path.join(ROOT, 'blog', slug + '.html');
  if (!fs.existsSync(abs)) { console.log('missing', slug); continue; }
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const ids = MAP[slug];

  // 1) in-body comparison table (update-in-place else insert before the first <h2> in the article body)
  const block = tableBlock(ids);
  const tableRe = /    <!-- city-scores-start -->[\s\S]*?<!-- city-scores-end -->\n/;
  if (tableRe.test(html)) { html = html.replace(tableRe, block); }
  else {
    const artIdx = html.indexOf('<article class="article-content">');
    const searchFrom = artIdx >= 0 ? artIdx : 0;
    const h2Idx = html.indexOf('<h2', searchFrom);
    if (h2Idx >= 0) {
      // back up to the start of the line of that <h2>
      const lineStart = html.lastIndexOf('\n', h2Idx) + 1;
      html = html.slice(0, lineStart) + block + html.slice(lineStart);
    }
  }
  if (html !== before) tables++;

  // 2) replace a single-city sidebar widget with the multi-city one
  const w = miniWidget(ids);
  const widgetRe = /<div class="nomad-score-widget">[\s\S]*?View Full Profile[\s\S]*?<\/a>\s*<\/div>/;
  if (widgetRe.test(html)) { html = html.replace(widgetRe, w); widgets++; }
  else {
    // already converted? refresh it
    const w2Re = /<div class="nomad-score-widget">\s*<style>\.nsm-row[\s\S]*?<\/div>/;
    if (w2Re.test(html)) { html = html.replace(w2Re, w); }
  }

  fs.writeFileSync(abs, html);
}
console.log(`Blog city scores: tables on ${tables} posts, widgets replaced/refreshed on ${widgets}.`);

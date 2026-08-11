require(require('path').join(__dirname,'_safe_write.cjs'));
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
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const badgeColor = (s) => s >= 8 ? '#C0392B' : s >= 7 ? '#C4622E' : s >= 6 ? '#9E7B1E' : '#5C6672';
const lvl = (v) => v >= 8 ? 'hi' : v >= 6 ? 'good' : v >= 4 ? 'mid' : 'low';

// Multi-city posts -> the cities they cover (curated for accuracy).
const MAP = {
  'medellin-vs-chiang-mai': ['medellin', 'chiangmai'],
  'best-european-cities-nomads': ['lisbon', 'tbilisi', 'budapest', 'split', 'berlin', 'tallinn'],
  'best-coworking-spaces-bali': ['canggu', 'ubud'],
};

const COLS = [['cost', 'Cost'], ['wifi', 'WiFi'], ['safety', 'Safety'], ['community', 'Community'], ['climate', 'Climate']];

function tableBlock(ids) {
  const cities = ids.map((id) => byId[id]).filter(Boolean);
  const head = `<th class="csb-th-city">City</th><th>Nomad Score</th><th>Budget</th>` + COLS.map((c) => `<th>${c[1]}</th>`).join('');
  const rows = cities.map((c) => {
    const sc = nomadScore(c);
    const code = iso(c.flag);
    const flag = code ? `<img class="csb-flag" src="/assets/flags/${code}.svg" alt="" width="22" height="16" loading="lazy">` : '';
    const cats = COLS.map(([k]) => {
      const v = c.scores[k];
      return typeof v === 'number' ? `<td><span class="csb-chip" data-lvl="${lvl(v)}">${v}</span></td>` : '<td><span class="csb-chip" data-lvl="mid">-</span></td>';
    }).join('');
    return `<tr>
            <td class="csb-city">${flag}<a href="/cities/${c.id}">${esc(c.name)}</a><span>${esc(c.country)}</span></td>
            <td><span class="csb-badge" style="background:${badgeColor(sc)}">${sc}</span></td>
            <td class="csb-budget">${esc(money(c.costPerMonth))}</td>${cats}
          </tr>`;
  }).join('');
  return `    <!-- city-scores-start -->
    <div class="city-scores-block">
      <style>
        .city-scores-block{max-width:860px;margin:2.25rem auto;padding:1.6rem 1.75rem 1.4rem;background:#fff;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:18px;box-shadow:0 10px 34px rgba(15,23,42,.07)}
        .city-scores-block h3{font-family:'DM Serif Display',serif;font-size:1.5rem;color:var(--color-ink,#0f172a);margin:0 0 1.1rem;letter-spacing:-.01em}
        .csb-scroll{overflow-x:auto;margin:0 -.4rem}
        .csb-table{width:100%;border-collapse:separate;border-spacing:0 .25rem;font-size:.92rem;min-width:560px}
        .csb-table th{padding:.2rem .55rem .7rem;text-align:center;font-size:.66rem;text-transform:uppercase;letter-spacing:.09em;color:var(--color-stone,#8a8175);font-weight:700;border-bottom:1px solid var(--color-sand,#f0e9dc)}
        .csb-th-city,.csb-table td:first-child{text-align:left}
        .csb-table td{padding:.5rem .55rem;text-align:center;vertical-align:middle}
        .csb-table tbody tr{transition:background .12s}
        .csb-table tbody tr:hover td{background:var(--color-sand,#faf6ee)}
        .csb-table tbody tr:hover td:first-child{border-radius:10px 0 0 10px}
        .csb-table tbody tr:hover td:last-child{border-radius:0 10px 10px 0}
        .csb-city{display:flex;align-items:center;flex-wrap:wrap;gap:.15rem .55rem;line-height:1.2}
        .csb-flag{border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,.08);flex:0 0 auto}
        .csb-city a{font-family:'DM Serif Display',serif;font-size:1.08rem;color:var(--color-ink,#0f172a);text-decoration:none}
        .csb-city a:hover{color:var(--color-terracotta,#c0392b)}
        .csb-city span{flex-basis:100%;padding-left:calc(22px + .55rem);font-size:.74rem;color:var(--color-stone,#8a8175)}
        .csb-badge{display:inline-flex;align-items:center;justify-content:center;min-width:2.5rem;height:2.5rem;padding:0 .5rem;border-radius:50%;color:#fff;font-weight:800;font-size:1.02rem;box-shadow:0 3px 10px rgba(15,23,42,.18)}
        .csb-budget{font-weight:600;color:var(--color-charcoal,#3a3a3a);white-space:nowrap}
        .csb-chip{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:9px;font-weight:700;font-size:.9rem}
        .csb-chip[data-lvl=hi]{background:rgba(47,125,90,.16);color:#2f7d5a}
        .csb-chip[data-lvl=good]{background:rgba(158,123,30,.16);color:#8a6d15}
        .csb-chip[data-lvl=mid]{background:rgba(15,23,42,.06);color:var(--color-stone,#8a8175)}
        .csb-chip[data-lvl=low]{background:rgba(192,57,43,.12);color:#c0392b}
        .csb-note{font-size:.78rem;color:var(--color-stone,#8a8175);margin:1.1rem 0 0;padding-top:.9rem;border-top:1px solid var(--color-sand,#f0e9dc)}
      </style>
      <h3>City scores at a glance</h3>
      <div class="csb-scroll"><table class="csb-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="csb-note">The Nomad HQ ratings, scored 0 to 10 across our 13 categories. Open a city guide for the full breakdown.</p>
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

/**
 * Adds a small "Things to do in <city>" block to each city page that is featured on an activity
 * page, linking back to those activities (and the activities hub). Builds the reverse map by
 * reading which cities each activities/*.html links to, so it stays in sync with build_activities.
 * Closes the city -> /activities internal-link gap. Injected after the weather section (or the
 * category breakdown). Idempotent via <!-- ca-start -->/<!-- ca-end -->. Usage: node scripts/apply_city_activities.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const NAME = {}; m.exports.forEach((c) => { if (c && c.id) NAME[c.id] = c.name; });

const ACT_DIR = path.join(ROOT, 'activities');
const acts = fs.readdirSync(ACT_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => f.replace(/\.html$/, ''));
// reverse map: cityId -> [activity slugs], preserving activity order (diving, kayaking, shopping, surfing)
const rev = {};
for (const a of acts) {
  const h = fs.readFileSync(path.join(ACT_DIR, a + '.html'), 'utf8');
  [...new Set([...h.matchAll(/href="\/cities\/([a-z0-9-]+)"/g)].map((mm) => mm[1]))].forEach((id) => { (rev[id] = rev[id] || []).push(a); });
}

function humanList(arr) {
  const links = arr.map((a) => `<a href="/activities/${a}">${a}</a>`);
  if (links.length === 1) return links[0];
  if (links.length === 2) return links[0] + ' and ' + links[1];
  return links.slice(0, -1).join(', ') + ' and ' + links[links.length - 1];
}

let changed = 0;
for (const [id, list] of Object.entries(rev)) {
  const fp = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, 'utf8');
  html = html.replace(/\s*<!-- ca-start -->[\s\S]*?<!-- ca-end -->/, '');
  const name = NAME[id] || id;
  const block = '<!-- ca-start -->\n' +
    `    <div class="container" style="max-width:1100px;margin:1.4rem auto 0;padding:0 var(--space-4,1rem);">
      <p style="font-size:.98rem;line-height:1.65;color:var(--color-charcoal,#334155);background:var(--color-sand,#f6f1e7);border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:12px;padding:.85rem 1.1rem;margin:0;"><strong>Things to do in ${name}:</strong> it is one of our top nomad spots for ${humanList(list)}. See more <a href="/activities">things to do off the clock</a>.</p>
    </div>\n    <!-- ca-end -->`;
  let idx = html.indexOf('<!-- cw-end -->');
  if (idx >= 0) { idx += '<!-- cw-end -->'.length; }
  else { const open = html.indexOf('<section class="categories-section">'); if (open < 0) continue; idx = html.indexOf('</section>', open) + '</section>'.length; }
  html = html.slice(0, idx) + '\n\n    ' + block + html.slice(idx);
  fs.writeFileSync(fp, html);
  changed++;
}
console.log(`Activity links added to ${changed} city pages (${acts.length} activities).`);

/**
 * Extracts the establishment list (coworking, eat, stays) from a city page into
 * a JSON the venue-image agent consumes. Usage: node scripts/extract_venues.cjs <slug> [<slug>...]
 * Writes <dir>/venues-list-<slug>.json to the scratch batch dir (argv env DIR) or ./.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.DIR || ROOT;

function grabCards(html, nameClass, kind) {
  const out = [];
  const re = new RegExp('<article class="' + kind.card + '">([\\s\\S]*?)</article>', 'g');
  let m;
  while ((m = re.exec(html))) {
    const block = m[1];
    const name = (block.match(new RegExp('class="' + nameClass + '">([^<]*)<')) || [])[1];
    const type = (block.match(/class="(?:venue-type|eat-card-type)">([^<]*)</) || [])[1] || '';
    const area = (block.match(/class="venue-area">([^<]*)</) || [])[1] || '';
    if (name) out.push({ name: name.trim(), type: type.trim(), area: area.trim(), kind: kind.k });
  }
  return out;
}

for (const slug of process.argv.slice(2)) {
  const html = fs.readFileSync(path.join(ROOT, 'cities', slug + '.html'), 'utf8');
  const venues = [
    ...grabCards(html, 'cowork-card-name', { card: 'cowork-card', k: 'coworking' }),
    ...grabCards(html, 'eat-card-name', { card: 'eat-card', k: 'eat' }),
    ...grabCards(html, 'stay-card-name', { card: 'stay-card', k: 'stay' }),
  ];
  const city = (html.match(/<h1[^>]*>([^<,]+)/) || [])[1] || slug;
  fs.writeFileSync(path.join(OUT, 'venues-list-' + slug + '.json'), JSON.stringify({ slug, city: city.trim(), venues }, null, 2));
  console.log(slug + ': ' + venues.length + ' venues (' + venues.filter(v=>v.kind==='coworking').length + ' cowork, ' + venues.filter(v=>v.kind==='eat').length + ' eat, ' + venues.filter(v=>v.kind==='stay').length + ' stay)');
}

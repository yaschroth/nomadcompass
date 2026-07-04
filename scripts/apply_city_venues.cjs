/**
 * Replaces the fake venue cards on city pages with real, geo-verified venues.
 * Reads venues-<slug>.verified.json from argv[2] and edits cities/<slug>.html:
 *   - "Where to Stay"  -> a single Booking.com search deep-link CTA (affiliate-ready)
 *   - "Best Coworking Spaces" -> real coworking/cafe text cards
 *   - "Where to Eat & Drink"  -> real restaurant/bar text cards
 * Text-only cards (no image, no rating). rating>=4.0 hard gate. >=3 survivors per
 * section or the section keeps its old markup (flagged). Idempotent via
 * data-venues="v1" (cowork/eat skip if stamped; the Stay CTA always regenerates
 * so flipping BOOKING_AFFILIATE_ID + re-running re-bakes every href).
 * Usage: node scripts/apply_city_venues.cjs "<dir with venues-*.verified.json>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];

// ---- affiliate config: blank until you have a Booking.com aid (via Travelpayouts or direct) ----
const BOOKING_AFFILIATE_ID = '';

const stripDash = (s) => String(s == null ? '' : s).replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ').replace(/,[ \t]*,/g, ', ');
const esc = (s) => stripDash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mapsUrl = (name, city) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ', ' + city);
const RGATE = 4.0;
const gate = (list) => (list || []).filter((v) => typeof v.rating === 'number' && v.rating >= RGATE && v.name);

function venueLink(v, city) {
  const href = v.url ? String(v.url) : mapsUrl(v.name, city);
  return { href: esc(href), label: v.url ? 'Visit website &rarr;' : 'View on Maps &rarr;' };
}
function coworkCard(v, city) {
  const { href, label } = venueLink(v, city);
  const area = v.area ? `\n            <div class="venue-area">${esc(v.area)}</div>` : '';
  return `          <article class="cowork-card">
            <h3 class="cowork-card-name">${esc(v.name)}</h3>
            <div class="venue-type">${esc(v.type || 'Coworking space')}</div>${area}
            <p class="venue-desc">${esc(v.description || '')}</p>
            <a href="${href}" target="_blank" rel="noopener nofollow" class="btn btn-secondary" style="width: 100%;">${label}</a>
          </article>`;
}
function eatCard(v, city) {
  const { href, label } = venueLink(v, city);
  const area = v.area ? `\n            <div class="venue-area">${esc(v.area)}</div>` : '';
  return `          <article class="eat-card">
            <h3 class="eat-card-name">${esc(v.name)}</h3>
            <div class="eat-card-type">${esc(v.type || 'Restaurant')}</div>${area}
            <p class="eat-card-description">${esc(v.description || '')}</p>
            <a href="${href}" target="_blank" rel="noopener nofollow" class="btn btn-secondary" style="width: 100%;">${label}</a>
          </article>`;
}
function stayCta(city, country) {
  const ss = encodeURIComponent(city + (country ? ', ' + country : ''));
  const aid = BOOKING_AFFILIATE_ID ? 'aid=' + encodeURIComponent(BOOKING_AFFILIATE_ID) + '&' : '';
  const href = `https://www.booking.com/searchresults.html?${aid}ss=${ss}&group_adults=1&no_rooms=1`;
  return `          <div class="stay-cta">
            <p class="stay-cta-lead">Browse apartments, aparthotels and hotels across ${esc(city)}. Compare prices and book a base that suits a remote-work stay.</p>
            <a href="${href}" target="_blank" rel="sponsored nofollow noopener" class="btn btn-primary btn-lg" style="width: auto;">See available stays in ${esc(city)} &rarr;</a>
            <p class="stay-cta-note">Affiliate link. See our <a href="/disclosure">disclosure</a>.</p>
          </div>`;
}
// (h2 anchor ... grid-open)(rest of grid-open tag)>(inner)(grid-close + container-close + section-close)
const sectionRe = (anchor) => new RegExp('(<h2>' + anchor + '[^<]*</h2>[\\s\\S]*?<div class="affiliate-grid")[^>]*>[\\s\\S]*?(</div>\\s*</div>\\s*</section>)');

let ok = 0, fail = 0;
const flags = [];
for (const file of fs.readdirSync(DIR).filter((f) => /^venues-.+\.verified\.json$/.test(f))) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const slug = data.slug || file.replace(/^venues-/, '').replace(/\.verified\.json$/, '');
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); fail++; continue; }
  let s = fs.readFileSync(page, 'utf8');
  const city = data.city || slug;
  const country = data.country || '';
  const cowork = gate(data.coworking);
  const eat = gate(data.eat);
  let changed = false;

  const stayRe = sectionRe('Where to Stay in ');
  if (stayRe.test(s)) {
    s = s.replace(stayRe, (m, p1, p2) => p1 + ' data-venues="v1">\n' + stayCta(city, country) + '\n        ' + p2);
    changed = true;
  } else { console.error('NO STAY SECTION:', slug); }

  const cwRe = sectionRe('Best Coworking Spaces');
  const cwM = s.match(cwRe);
  if (cwM && !/data-venues="v1"/.test(cwM[0])) {
    if (cowork.length >= 3) {
      const cards = cowork.slice(0, 6).map((v) => coworkCard(v, city)).join('\n');
      s = s.replace(cwRe, (m, p1, p2) => p1 + ' data-venues="v1">\n' + cards + '\n        ' + p2);
      changed = true;
    } else { flags.push(`${slug}:cowork(${cowork.length})`); }
  }

  const eatRe = sectionRe('Where to Eat');
  const eatM = s.match(eatRe);
  if (eatM && !/data-venues="v1"/.test(eatM[0])) {
    if (eat.length >= 3) {
      const cards = eat.slice(0, 6).map((v) => eatCard(v, city)).join('\n');
      s = s.replace(eatRe, (m, p1, p2) => p1 + ' data-venues="v1">\n' + cards + '\n        ' + p2);
      changed = true;
    } else { flags.push(`${slug}:eat(${eat.length})`); }
  }

  if (changed) { fs.writeFileSync(page, s); ok++; }
}
console.log(`venues applied: ${ok} | failed: ${fail}`);
if (flags.length) console.log('THIN (kept old cards):', flags.join(', '));

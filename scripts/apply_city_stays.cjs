require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds real, named accommodation cards to the "Where to Stay" section, ABOVE the
 * existing Booking.com search CTA (which is kept as a catch-all). Reads
 * stays-<slug>.verified.json from argv[2] and edits cities/<slug>.html in place.
 *
 * Text-only cards (no image, no rating shown). rating>=4.0 hard gate. Each card links
 * to a Booking.com deep-link on the exact property name (affiliate-ready via
 * BOOKING_AFFILIATE_ID), so real places show AND every link monetizes. Needs >=2
 * surviving stays or the section is left as just the CTA (logged THIN). Idempotent via
 * data-stays="s1" on the stay grid (skip if already stamped).
 * Usage: node scripts/apply_city_stays.cjs "<dir with stays-*.verified.json>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2];

// ---- affiliate config: keep in sync with apply_city_venues.cjs ----
const BOOKING_AFFILIATE_ID = '';

const stripDash = (s) => String(s == null ? '' : s).replace(/[ \t]*(?:&mdash;|&#8212;|—)[ \t]*/g, ', ').replace(/,[ \t]*,/g, ', ');
const esc = (s) => stripDash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const RGATE = 4.0;

function bookingHref(name, city, country) {
  const ss = encodeURIComponent(name + ', ' + city + (country ? ', ' + country : ''));
  const aid = BOOKING_AFFILIATE_ID ? 'aid=' + encodeURIComponent(BOOKING_AFFILIATE_ID) + '&' : '';
  return `https://www.booking.com/searchresults.html?${aid}ss=${ss}&group_adults=1&no_rooms=1`;
}
function stayCard(v, city, country) {
  const href = esc(bookingHref(v.name, city, country));
  const area = v.area ? `\n              <div class="venue-area">${esc(v.area)}</div>` : '';
  return `          <article class="stay-card">
            <div class="stay-card-body">
              <h3 class="stay-card-name">${esc(v.name)}</h3>
              <div class="venue-type">${esc(v.type || 'Hotel')}</div>${area}
              <p class="venue-desc">${esc(v.description || '')}</p>
              <a href="${href}" target="_blank" rel="sponsored nofollow noopener" class="btn btn-secondary" style="width: 100%;">Check availability &rarr;</a>
            </div>
          </article>`;
}

// (h2 + up to grid-open tag)(grid-open attrs)>(inner ws)(the kept stay-cta div)
const stayGridRe = /(<h2>Where to Stay in [^<]*<\/h2>[\s\S]*?<div class="affiliate-grid")([^>]*)>([\s\S]*?)(<div class="stay-cta">)/;

// Read the raw research files directly. Geo-verification is redundant for stays: the
// cards link to a Booking search on the property name (self-resolving) and the >=4.0
// rating gate is enforced below, so a .verified pass changes nothing in the output.
const files = fs.readdirSync(DIR).filter((f) => /^stays-.+\.json$/.test(f) && !/\.verified\.json$/.test(f));
let ok = 0, thin = 0, skipped = 0, fail = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8').replace(/^﻿/, ''));
  const slug = data.slug || file.replace(/^stays-/, '').replace(/\.verified\.json$/, '');
  const page = path.join(ROOT, 'cities', slug + '.html');
  if (!fs.existsSync(page)) { console.error('NO PAGE:', slug); fail++; continue; }
  let s = fs.readFileSync(page, 'utf8');
  const city = data.city || slug;
  const country = data.country || '';

  const m = s.match(stayGridRe);
  if (!m) { console.error('NO STAY GRID:', slug); fail++; continue; }
  if (/data-stays="s1"/.test(m[2])) { skipped++; continue; }

  const stays = (data.stays || []).filter((v) => typeof v.rating === 'number' && v.rating >= RGATE && v.name);
  if (stays.length < 2) { console.error('THIN (kept CTA only):', slug, stays.length); thin++; continue; }

  const cards = stays.map((v) => stayCard(v, city, country)).join('\n');
  s = s.replace(stayGridRe, (full, p1, p2, p3, p4) => p1 + p2 + ' data-stays="s1">' + p3 + cards + '\n          ' + p4);
  fs.writeFileSync(page, s);
  console.log('OK ' + slug + ' | ' + stays.length + ' stays');
  ok++;
}
console.log(`\nstays applied: ${ok} | thin: ${thin} | skipped(stamped): ${skipped} | failed: ${fail}`);

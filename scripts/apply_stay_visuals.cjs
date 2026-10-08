require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * A designed header for every "Where to Stay" card that has no photo.
 *
 * Owner's choice (2026-10-08) over taking photos from Booking.com or the hotels' own sites, which their
 * terms and copyright do not allow: 1,961 of 2,051 stay cards had no image. The header shows the type and
 * the neighbourhood as large text on navy, with a Carbon icon for the type as a faint watermark (the
 * same treatment as the home page tool tiles). CSS in styles/city-page.css hides the type and area lines
 * in the card body when a header carries them, so nothing is printed twice and nothing is lost to a
 * screen reader.
 *
 * Refresh, not insert: every run strips every header and adds one to each card that has no
 * venue-card-image, so a card that later gets a real photo (apply_venue_images.cjs) loses its header
 * on the next run. Run it after apply_city_stays.cjs and apply_venue_images.cjs.
 *
 * Usage: node scripts/apply_stay_visuals.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const { carbonInner } = require('./lib/carbon.cjs');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const DIR = path.join(ROOT, 'cities');

// Accommodation type -> Carbon icon. Unlisted types fall back to the building.
const ICON = {
  'Hostel': 'hotel', 'Hotel': 'building', 'Boutique hotel': 'building', 'Aparthotel': 'enterprise',
  'Serviced apartments': 'home', 'Guesthouse': 'home', 'Resort': 'palm-tree',
};

const CARD = /<article class="stay-card">([\s\S]*?)<\/article>/g;
const STRIP = /<!-- stay-visual -->[\s\S]*?<!-- \/stay-visual -->\s*/g;
const text = (html, cls) => {
  const m = html.match(new RegExp('<div class="' + cls + '">([^<]*)</div>'));
  return m ? m[1].trim() : '';
};

function visual(type, area, indent) {
  const icon = '<svg class="stay-visual-icon" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">'
    + carbonInner(ICON[type] || 'building') + '</svg>';
  return '<!-- stay-visual --><div class="stay-visual">' + icon
    + (type ? '<span class="stay-visual-type">' + type + '</span>' : '')
    + (area ? '<span class="stay-visual-area">' + area + '</span>' : '')
    + '</div><!-- /stay-visual -->\n' + indent;
}

let written = 0, added = 0, withPhoto = 0;
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(DIR, f);
  const html = fs.readFileSync(abs, 'utf8');
  if (!html.includes('class="stay-card"')) continue;
  const next = html.replace(CARD, (card, inner) => {
    const body = inner.replace(STRIP, '');
    if (body.includes('venue-card-image')) { withPhoto++; return '<article class="stay-card">' + body + '</article>'; }
    const type = text(body, 'venue-type');
    const area = text(body, 'venue-area');
    const indent = (body.match(/^\s*/) || [''])[0].replace(/^\r?\n/, '');
    added++;
    return '<article class="stay-card">' + body.replace(/^(\s*)/, (ws) => ws + visual(type, area, indent)) + '</article>';
  });
  if (next === html) continue;
  if (!DRY) fs.writeFileSync(abs, next);
  written++;
}
console.log('Stay headers: ' + added + ' card(s) carry one, ' + withPhoto + ' have a photo instead; '
  + written + ' page(s) written' + (DRY ? '  [dry run]' : ''));

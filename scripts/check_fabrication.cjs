/**
 * Gate: nothing on the site may state a rating, a review count, a verification badge or a response
 * time that no source supports.
 *
 * On 2026-08-26, 657 accommodation pages were deleted for exactly this. Each showed a star rating
 * and a review count under a "Verified Host" badge, for a business that did not exist. The numbers
 * came out of a hash of the property name:
 *
 *     const rating  = (4.2 + (hash % 8) / 10).toFixed(1);
 *     const reviews = 50 + (hash % 450);
 *
 * An earlier pass had noticed those pages were thin and put a noindex on them. That is the mistake
 * this script exists to catch a second time: a noindex hides a fabrication from Google, it does not
 * stop the page telling a reader something untrue.
 *
 * Two halves:
 *   PAGES      rendered text claiming "(497 reviews)", "Verified Host", "Usually responds within..."
 *   GENERATORS a script that manufactures such a value from a hash, a random number or a constant
 *
 * Since 2026-09-29 it also covers nomad head counts ("2,000+ Active Nomads", "around 600 remote
 * workers"): a stat label that implies a count fails on any page, a count in prose fails unless the
 * sentence names who counted, and a generator with a nomad_count field or template fails.
 *
 * The generator half matters more. A page can be cleaned by hand; a generator puts it back.
 *
 * A real, sourced rating is fine and this does not flag it: the check is for a trust signal with no
 * provenance, which is why the generator scan looks for the value being COMPUTED rather than read.
 *
 * Usage: node scripts/check_fabrication.cjs
 * Exit 1 if anything is found.
 */
const fs = require('fs');
const path = require('path');
const { mapTextNodes } = require(path.join(__dirname, 'lib', 'to_usd.cjs'));

const ROOT = path.resolve(__dirname, '..');

// Claims about trust that a reader takes at face value.
const CLAIMS = [
  [/\(\s*\d{2,}\s+reviews?\s*\)/i, 'a review count'],
  [/\b\d[\d,]*\s+reviews?\b/i, 'a review count'],
  [/\bverified\s+(?:host|owner|listing|provider|partner)\b/i, 'a verification badge'],
  [/\busually\s+responds?\s+within\b/i, 'a response-time claim'],
  [/\b\d\.\d\s*\/\s*5\b/, 'a star rating'],
  [/\brate[sd]?\s+\d\.\d\b/i, 'a star rating'],
];

// A rating that names where it came from is evidence, not invention: "a 9.2 Booking.com score
// across 400 reviews" can be checked, and the site's own source rule asks for exactly that. Only an
// unattributed one is flagged, which is the difference between the city pages, which cite Google and
// Booking.com for real named venues, and the deleted accommodation pages, which cited nothing
// because there was nothing to cite.
// Naming a platform anywhere in the sentence is not enough, and neither is a bare capitalised word:
// "suites on Gran Via ... rated 9.9" names a street, not a source. The attribution has to follow the
// figure. Either a known platform, or "on/by/from <Proper Noun>" within a short distance of it.
const PLATFORM = /\b(?:google|booking(?:\.com)?|tripadvisor|thefork|holiwise|yelp|airbnb|trustpilot|coworker(?:\.com)?|opentable|justdial|the coworking spaces|foursquare|hostelworld|agoda|expedia|guests|members)\b/i;

// A hotel's star class is a category, not a review score: "a polished 4.5-star hotel" and "four-star
// boutique hotel" are describing what kind of place it is. Only a rating OF something gets checked.
const STAR_CLASS = /\b\d(?:\.\d)?-star\s+(?:hotel|boutique|resort|property|aparthotel|restaurant)\b/i;
const attributed = (sentence, match) => {
  const at = sentence.indexOf(match);
  const after = sentence.slice(at + match.length, at + match.length + 40);
  // The source can lead as easily as follow: "Google-rated 4.7", "a 9.2 Booking.com score across
  // 400 reviews". Only a named platform counts on the leading side, because the loose "on <Proper
  // Noun>" test would read "suites on Gran Via ... rated 9.9" as sourced to a street.
  const before = sentence.slice(Math.max(0, at - 30), at);
  return PLATFORM.test(after) || PLATFORM.test(before)
    || /\b(?:on|by|from|per)\s+(?:the\s+)?[A-Z][A-Za-z.]{2,}/.test(after);
};

// Trust badges and response times have no attributed form. "Verified by Google" would still be a
// badge this site is in no position to award, so those stay flagged whatever sits beside them.
const NEVER_OK = /verified|responds?\s+within/i;

// A trust value being MADE rather than read from a source.
const MANUFACTURED = [
  [/rating\s*=\s*[^;\n]*(?:hash|Math\.random|%\s*\d)/i, 'a rating computed from a hash or random'],
  [/reviews?\s*=\s*[^;\n]*(?:hash|Math\.random|%\s*\d)/i, 'a review count computed from a hash or random'],
  [/(?:ratingValue|reviewCount|aggregateRating)\s*[:=]\s*[^,;\n]*(?:hash|Math\.random)/i, 'schema.org rating from a hash or random'],
  [/getRandomItems\s*\(\s*NEARBY/i, 'randomised "what is nearby" claims'],
  // Every city hero carried "2,000+ Active Nomads" (or 500+, or 5,000+) until 2026-09-29. Nothing
  // counted anyone: generate_city_pages.js bucketed the figure out of our own community score,
  //     nomad_count: city.scores.community >= 7 ? "5,000+" : city.scores.community >= 5 ? "2,000+" : "500+"
  // and the Python generator did the same with seven buckets. A head count has no source we could
  // cite for 1000 cities, so the field and the stat are gone, and either coming back fails here.
  [/["']?\b(?:nomad_?count|nomads_?count|active_?nomads|nomad_?population)\b["']?\s*[:=]/i, 'a nomad head count field'],
  [/quick-stat-label">\s*(?:Active\s+)?Nomads\b|quick-stat-label">\s*Nomad\s+(?:count|population)/i, 'a nomad head-count stat in a page template'],
];

// The same claim as it reaches a reader. A stat LABEL is enough to flag, whatever number sits in the
// value beside it, because the label is what asserts that someone counted: "Active Nomads",
// "Nomads here now", "Nomad population", "Remote workers now".
const HEADCOUNT_LABEL = /^\s*(?:(?:active|digital)\s+)*(?:nomads|remote\s+workers)(?:\s+(?:here|now|here\s+now|in\s+town|right\s+now|on\s+the\s+ground))?\s*$|^\s*nomad\s+(?:count|population|head\s*count)\s*$/i;
// And the prose form: "an estimated 15,000-20,000 remote workers", "around 600 active nomads".
// Allowed only when the sentence names who counted, the same test the rating check applies.
// The number may not end in a comma: "Since 2009, remote workers have..." is a year, not a count.
const HEADCOUNT_PROSE = /\b\d(?:[\d,]*\d)?(?:\s?(?:-|–|to)\s?\d(?:[\d,]*\d)?)?\+?\s(?:(?:active|digital|remote|foreign)\s)*(?:nomads|remote\s+workers)\b/i;
const COUNT_SOURCE = /\b(?:nomads\.com|nomad\s?list|census|statistics|ministry|survey|according to|reports?|data from)\b/i;

const SKIP_TOP = new Set(['node_modules', 'data', 'assets', 'images', 'styles', 'ui-ux-pro-max-skill']);
const pageHits = [];
const genHits = [];

const walk = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!rel && SKIP_TOP.has(e.name)) continue; walk(p, r); continue; }

    if (e.name.endsWith('.html')) {
      const html = fs.readFileSync(p, 'utf8');
      // Head counts are checked across the whole page: a venue-src note sources venue ratings, it
      // says nothing about how many nomads live in the city.
      mapTextNodes(html, (text) => {
        if (HEADCOUNT_LABEL.test(text)) {
          pageHits.push(r + ': a nomad head-count stat with no source  "' + text.trim() + '"');
          return text;
        }
        for (const s of text.split(/(?<=[.!?])\s+/)) {
          const m = s.match(HEADCOUNT_PROSE);
          if (m && !COUNT_SOURCE.test(s) && !attributed(s, m[0])) {
            pageHits.push(r + ': a nomad head count with no source  "' + s.trim().replace(/\s+/g, ' ').slice(0, 120) + '"');
          }
        }
        return text;
      });
      // A source stated once for a section covers every rating inside it, which is how the Cost
      // Index has always cited Numbeo. Demanding it in each sentence would push the pages toward
      // repeating "on Google" forty times, which is noisier without being more honest. So sections
      // carrying a venue-src note are skipped, and everything else is checked sentence by sentence.
      for (const chunk of html.split(/(?=<section\b)/)) {
        if (chunk.includes('venue-src')) continue;
        mapTextNodes(chunk, (text) => {
          for (const s of text.split(/(?<=[.!?])\s+/)) {
            for (const [re, what] of CLAIMS) {
              const m = s.match(re);
              if (!m) continue;
              if (STAR_CLASS.test(s)) continue;
              if (!NEVER_OK.test(m[0]) && attributed(s, m[0])) continue;
              pageHits.push(r + ': ' + what + ' with no source  "' + s.trim().replace(/\s+/g, ' ').slice(0, 120) + '"');
            }
          }
          return text;
        });
      }
    } else if (e.name.endsWith('.js') || e.name.endsWith('.cjs') || e.name.endsWith('.py')) {
      if (p === __filename) continue;   // this file quotes the offending code in its own header
      const src = fs.readFileSync(p, 'utf8');
      for (const [re, what] of MANUFACTURED) {
        const m = src.match(re);
        if (m) genHits.push(r + ': ' + what + '\n      ' + m[0].trim().slice(0, 110));
      }
    }
  }
};
walk(ROOT, '');

// The score-tile text reaches the city pages inside a <script> object that the page scan above does
// not read, so its source files are checked here. These are reported, not failed: the files are
// edited by hand by the owner, and the fix is a sentence rewrite, not something a sweep may do.
const dataWarnings = [];
for (const rel of ['data/category-descriptions.json', 'data/guide-content.json']) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  let data;
  try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (err) { continue; }
  for (const [id, o] of Object.entries(data)) {
    if (!o || typeof o !== 'object') continue;
    for (const [k, v] of Object.entries(o)) {
      for (const s of String(v || '').replace(/<[^>]+>/g, ' ').split(/(?<=[.!?])\s+/)) {
        const m = s.match(HEADCOUNT_PROSE);
        if (m && !COUNT_SOURCE.test(s) && !attributed(s, m[0])) {
          dataWarnings.push(rel + ' ' + id + '.' + k + ': "' + s.trim().slice(0, 110) + '"');
        }
      }
    }
  }
}

console.log('FABRICATION GATE  (no invented ratings, review counts, trust badges or nomad head counts)\n');

if (dataWarnings.length) {
  console.log('  warnings: nomad head counts with no source in owner-edited data (' + dataWarnings.length + '), rendered in the score tiles:');
  dataWarnings.forEach((w) => console.log('    ' + w));
  console.log('');
}

if (genHits.length) {
  console.log('  GENERATORS manufacturing a trust value (' + genHits.length + '):');
  genHits.forEach((g) => console.log('    ' + g));
  console.log('');
}
if (pageHits.length) {
  console.log('  PAGES stating one (' + pageHits.length + '):');
  pageHits.slice(0, 30).forEach((h) => console.log('    ' + h));
  if (pageHits.length > 30) console.log('    ... and ' + (pageHits.length - 30) + ' more');
  console.log('');
}

if (genHits.length || pageHits.length) {
  console.log('  A noindex does not fix any of this. If it cannot be sourced, remove the element.');
  process.exit(1);
}
console.log('  clean: no unsourced ratings, review counts, verification badges or nomad head counts.');

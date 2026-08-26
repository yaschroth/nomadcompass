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
const PLATFORM = /\b(?:google|booking(?:\.com)?|tripadvisor|thefork|holiwise|yelp|airbnb|trustpilot|coworker(?:\.com)?|foursquare|hostelworld|agoda|expedia|guests)\b/i;
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
];

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
              if (!NEVER_OK.test(m[0]) && attributed(s, m[0])) continue;
              pageHits.push(r + ': ' + what + ' with no source  "' + s.trim().replace(/\s+/g, ' ').slice(0, 120) + '"');
            }
          }
          return text;
        });
      }
    } else if (e.name.endsWith('.js') || e.name.endsWith('.cjs')) {
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

console.log('FABRICATION GATE  (no invented ratings, review counts or trust badges)\n');

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
console.log('  clean: no unsourced ratings, review counts or verification badges.');

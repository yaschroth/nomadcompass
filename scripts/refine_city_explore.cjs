/**
 * One-time migration: compacts the old "Explore More Nomad Cities Like X" heading
 * + chip list + CTA paragraph on existing city pages into a single subtle "Nearby"
 * strip (the carousel above already covers related cities visually; this keeps the
 * crawlable links). The FAQ underneath is handled separately by de_templatize.
 * Idempotent. Usage: node scripts/refine_city_explore.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let changed = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(ROOT, 'cities', f);
  let s = fs.readFileSync(abs, 'utf8');
  const before = s;

  s = s.replace(
    /<h2>Explore More Nomad Cities Like [^<]*<\/h2>\s*<ul class="city-seo-related">[\s\S]*?<\/ul>\s*<p>Compare destinations with[\s\S]*?<\/p>/,
    (m) => {
      const cityLinks = [...m.matchAll(/<li><a href="(\/cities\/[^"]+)">([^,<]+)[^<]*<\/a>/g)]
        .map((x) => `<a href="${x[1]}">${x[2].trim()}</a>`);
      const blog = (m.match(/href="(\/blog\/[^"]+)"/) || [])[1];
      let strip = `<p class="city-seo-nearby"><strong>Nearby:</strong> ${cityLinks.join(', ')}. ` +
        `<a href="/cities">Browse all city guides</a> or <a href="/wheel">find your match with the Nomad Wheel</a>.`;
      if (blog) strip += ` Read the <a href="${blog}">full guide</a>.`;
      strip += `</p>`;
      return strip;
    }
  );

  if (s !== before) { fs.writeFileSync(abs, s); changed++; }
}
console.log(`Explore blocks compacted: ${changed}`);

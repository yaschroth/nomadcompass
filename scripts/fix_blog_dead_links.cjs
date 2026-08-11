require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Repairs the dead links in the blog template. 301 links pointed at href="#".
 *
 * Four distinct defects, fixed differently because they are different things:
 *
 * 1. The blog footer was entirely dead. About, Contact, Privacy and Terms all pointed
 *    nowhere even though those pages exist, which for Privacy and Terms is the worst of
 *    the four. Wired to the real pages. Community, Packing List and Insurance have no
 *    page behind them and are removed rather than left pointing at nothing.
 * 2. Related-article links were dead. Matched to the real article by title.
 * 3. Affiliate CTAs shipped with a literal "[AFFILIATE] Replace with actual affiliate
 *    link" comment still in the markup. Hotel CTAs now go to a Booking search for that
 *    city, the same pattern the city pages use; coworking CTAs go to our own city page,
 *    which now lists real venues.
 * 4. Hashtag chips and social buttons. Tags are not navigation, so they become spans
 *    instead of links to nowhere. Social buttons get real share intents.
 *
 * Idempotent. Usage: node scripts/fix_blog_dead_links.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const DRY = process.argv.includes('--dry');

const FOOTER = {
  'About': '/about', 'Contact': '/contact', 'Privacy': '/privacy', 'Terms': '/terms',
  'Visa Guide': '/nomad-visas', 'Cost Calculator': '/cost-of-living-index',
};
const DROP = ['Community', 'Packing List', 'Insurance'];

// article title -> slug, for the "related reading" blocks
const BY_TITLE = {};
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html'))) {
  const s = fs.readFileSync(path.join(BLOG, f), 'utf8');
  const t = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  BY_TITLE[t.split('|')[0].trim().toLowerCase()] = '/blog/' + f.replace(/\.html$/, '');
  const h1 = (s.match(/<h1[^>]*>([^<]*)<\/h1>/) || [])[1];
  if (h1) BY_TITLE[h1.trim().toLowerCase()] = '/blog/' + f.replace(/\.html$/, '');
}

const CITY_OF = {
  'bangkok-budget-guide': ['Bangkok', 'bangkok'], 'best-coworking-spaces-bali': ['Bali', 'bali'],
  'budapest-nomad-guide': ['Budapest', 'budapest'], 'cape-town-nomad-guide': ['Cape Town', 'capetown'],
  'digital-nomad-guide-lisbon': ['Lisbon', 'lisbon'], 'digital-nomads-tbilisi-georgia': ['Tbilisi', 'tbilisi'],
  'dubai-digital-nomad-guide': ['Dubai', 'dubai'], 'mexico-city-nomad-guide': ['Mexico City', 'mexicocity'],
  'medellin-vs-chiang-mai': ['Medellín', 'medellin'], 'portugal-digital-nomad-visa': ['Lisbon', 'lisbon'],
};

const booking = city => 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(city) + '&amp;group_adults=1&amp;no_rooms=1';

let footer = 0, related = 0, affiliate = 0, tags = 0, social = 0, dropped = 0;

for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html'))) {
  const p = path.join(BLOG, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  const slug = f.replace(/\.html$/, '');
  const [cityName, citySlug] = CITY_OF[slug] || [];
  const url = 'https://thenomadhq.com/blog/' + slug;
  const title = ((s.match(/<h1[^>]*>([^<]*)<\/h1>/) || [])[1] || '').trim();

  // Social buttons first, with their own pass: an inline SVG icon path can run well past
  // any sensible window for the generic matcher (Instagram's is over 600 characters).
  s = s.replace(/<a href="#"([^>]*\bclass="social-link"[^>]*)>([\s\S]*?)<\/a>/g, (full, attrs, inner) => {
    const aria = (attrs.match(/aria-label="([^"]+)"/) || [])[1];
    const PROFILE = {
      Instagram: 'https://www.instagram.com/ynncks/',
      LinkedIn: 'https://www.linkedin.com/in/yannick-schroth/',
    };
    if (aria && PROFILE[aria]) { social++; return `<a href="${PROFILE[aria]}"${attrs} target="_blank" rel="noopener me">${inner}</a>`; }
    dropped++; return '';
  });

  // A "related reading" card pointed at a Porto article that was never written. The city
  // guide is the honest destination rather than a link to nothing.
  s = s.replace(/<a href="#">(Porto: [^<]*)<\/a>/g, (m, t) => { related++; return `<a href="/cities/porto">${t}</a>`; });

  s = s.replace(/<a href="#"([^>]*)>([\s\S]{0,600}?)<\/a>/g, (full, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').replace(/&rarr;|&nbsp;/g, '').trim();

    // These are the brand's own profile links in the footer, not share buttons, so they
    // must point at accounts that exist. index.html and the Organization sameAs list only
    // Instagram and LinkedIn; Twitter and YouTube have no account and are removed rather
    // than redirected to something they are not.
    const aria = (attrs.match(/aria-label="([^"]+)"/) || [])[1];
    if (/social-link/.test(attrs) && aria) {
      const PROFILE = {
        Instagram: 'https://www.instagram.com/ynncks/',
        LinkedIn: 'https://www.linkedin.com/in/yannick-schroth/',
      };
      if (PROFILE[aria]) { social++; return `<a href="${PROFILE[aria]}"${attrs} target="_blank" rel="noopener me">${inner}</a>`; }
      dropped++; return '';
    }

    // hashtag chips are labels, not navigation
    if (text.startsWith('#')) { tags++; return `<span class="article-tag">${inner}</span>`; }

    if (DROP.includes(text)) { dropped++; return ''; }
    if (FOOTER[text]) { footer++; return `<a href="${FOOTER[text]}"${attrs}>${inner}</a>`; }

    const rel = BY_TITLE[text.toLowerCase()];
    if (rel && rel !== '/blog/' + slug) { related++; return `<a href="${rel}"${attrs}>${inner}</a>`; }

    if (/find hotels/i.test(text) && cityName) {
      affiliate++;
      return `<a href="${booking(cityName)}"${attrs} target="_blank" rel="sponsored nofollow noopener">${inner}</a>`;
    }
    if (/coworking/i.test(text) && citySlug) {
      affiliate++;
      return `<a href="/cities/${citySlug}#coworking"${attrs}>${inner}</a>`;
    }
    if (/immigration consultant/i.test(text)) {
      affiliate++;
      return `<a href="/nomad-visas"${attrs}>${inner}</a>`;
    }
    return full;
  });

  // the placeholder comments have no reason to remain in shipped HTML
  s = s.replace(/\s*<!--\s*\/?\*?\s*\[AFFILIATE\][^>]*-->/g, '');
  // empty list items left by dropped footer entries
  s = s.replace(/<li>\s*<\/li>/g, '');

  if (!DRY && s !== before) fs.writeFileSync(p, s);
}

console.log(`${DRY ? 'DRY RUN' : 'APPLIED'}`);
console.log(`  Footer repariert: ${footer} | verwandte Artikel: ${related} | Affiliate-CTAs: ${affiliate}`);
console.log(`  Hashtags zu <span>: ${tags} | Social-Share: ${social} | ohne Ziel entfernt: ${dropped}`);

/**
 * A city guide on the blog and its city page point at each other.
 *
 * Fifteen city pages did not link the blog guide written about that very city (Fukuoka, Busan,
 * Sarajevo...), so those guides were reached only from the blog index and their category page, two
 * links each. The links are set by hand; this only says when one is missing.
 *
 * The map is kept by hand too: a post belongs here only if it is about that city. A new city guide
 * gets a line here when it is published.
 *
 * Usage: node scripts/check_blog_city_links.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const GUIDE_CITY = {
  'bangkok-budget-guide': ['bangkok'],
  'best-coworking-spaces-bali': ['bali', 'ubud', 'canggu'],
  'bodrum-digital-nomad-guide': ['bodrum'],
  'budapest-nomad-guide': ['budapest'],
  'busan-digital-nomad-guide': ['busan'],
  'canggu-cost-of-living-guide': ['canggu', 'bali'],
  'cape-town-nomad-guide': ['capetown'],
  'chania-digital-nomad-guide': ['chania', 'crete'],
  'dali-china-digital-nomad-guide': ['dali'],
  'digital-nomad-guide-lisbon': ['lisbon'],
  'digital-nomads-tbilisi-georgia': ['tbilisi'],
  'dresden-digital-nomad-guide': ['dresden'],
  'dubai-digital-nomad-guide': ['dubai'],
  'fukuoka-digital-nomad-guide': ['fukuoka'],
  'gijon-digital-nomad-guide': ['gijon'],
  'ibiza-digital-nomad-guide': ['ibiza'],
  'las-palmas-digital-nomad-guide': ['laspalmas'],
  'medellin-vs-chiang-mai': ['medellin', 'chiangmai'],
  'mexico-city-nomad-guide': ['mexicocity'],
  'palermo-digital-nomad-guide': ['palermo'],
  'praia-cape-verde-digital-nomad-guide': ['capeverde'],
  'santa-teresa-digital-nomad-guide': ['santateresa'],
  'sarajevo-digital-nomad-guide': ['sarajevo'],
  'siem-reap-digital-nomad-guide': ['siemreap'],
  // 2026-09-26 batch
  'hiring-a-lawyer-in-antalya': ['antalya'],
  'buying-property-in-fethiye-as-a-foreigner': ['fethiye'],
  'buying-property-in-split-croatia': ['split'],
  'abogado-gestor-notario-spain-foreigners': ['alicante'],
  'english-speaking-doctor-medellin': ['medellin'],
  'portugal-tax-adviser-for-nomads': ['lisbon'],
  'english-speaking-doctor-germany': ['berlin', 'hamburg'],
  'english-speaking-doctors-japan': ['tokyo'],
  'luxembourg-digital-nomad-guide': ['luxembourg'],
  'swakopmund-digital-nomad-guide': ['swakopmund'],
  'lombok-digital-nomad-guide': ['lombok'],
  'wanaka-digital-nomad-guide': ['wanaka'],
  'sal-boa-vista-cape-verde-remote-work': ['capeverde'],
  'dakar-digital-nomad-guide': ['dakar'],
  'oslo-digital-nomad-guide': ['oslo'],
  'is-nashville-good-for-digital-nomads': ['nashville'],
  'best-miami-neighborhoods-for-digital-nomads': ['miami'],
  'st-kilda-melbourne-digital-nomad-guide': ['melbourne'],
};

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const bad = [];
let pairs = 0;
for (const [post, cities] of Object.entries(GUIDE_CITY)) {
  const blog = read(path.join(ROOT, 'blog', post + '.html'));
  if (!blog) { bad.push(`blog/${post}.html is in the map but does not exist`); continue; }
  for (const city of cities) {
    const page = read(path.join(ROOT, 'cities', city + '.html'));
    if (!page) { bad.push(`cities/${city}.html is in the map but does not exist`); continue; }
    pairs++;
    if (!page.includes(`href="/blog/${post}"`)) bad.push(`/cities/${city} does not link /blog/${post}`);
    // The guide names its main city; secondary cities (Ubud for the Bali coworking post) need not be
    // linked back, since the post is not about them alone.
    if (city === cities[0] && !blog.includes(`href="/cities/${city}"`)) bad.push(`/blog/${post} does not link /cities/${city}`);
  }
}

// A guide on disk that the map does not know is how the fifteen went missing in the first place.
const known = new Set(Object.keys(GUIDE_CITY));
const GENERAL = new Set(['index', 'best-european-cities-nomads', 'digital-nomad-tax-guide', 'portugal-digital-nomad-visa',
  'remote-work-routine-guide', 'rise-of-coliving-spaces', 'stay-productive-working-abroad',
  'best-middle-east-cities-for-a-month-of-remote-work', 'safest-cities-for-female-digital-nomads']);
for (const f of fs.readdirSync(path.join(ROOT, 'blog')).filter((x) => x.endsWith('.html'))) {
  const s = f.replace(/\.html$/, '');
  if (!known.has(s) && !GENERAL.has(s)) bad.push(`blog/${f} is neither in GUIDE_CITY nor listed as a general post`);
}

if (bad.length) {
  console.error(`check_blog_city_links: ${bad.length} problem(s)`);
  bad.forEach((b) => console.error('  ' + b));
  process.exit(1);
}
console.log(`clean: ${pairs} guide and city pairs link each other.`);

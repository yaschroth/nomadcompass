/**
 * Single source of truth for the blog author entity (E-E-A-T).
 * Edit here once, then re-run `node scripts/apply_blog_seo.cjs` to bake the
 * change into every article + the bio page. See BLOG_STYLE_GUIDE.md §7.
 *
 * Real photo (assets/yannick-schroth.webp) and LinkedIn/Instagram are wired in.
 * Optional later: enrich `bio` / `description` with real specifics (years remote,
 * countries) and add an X/YouTube profile to `sameAs`.
 */
const SITE = 'https://thenomadhq.com';

const AUTHOR = {
  name: 'Yannick Schroth',
  slug: 'yannick-schroth',
  bioPath: '/about/yannick-schroth',
  get url() { return SITE + this.bioPath; },

  imagePath: '/assets/yannick-schroth.webp',
  get image() { return SITE + this.imagePath; },

  jobTitle: 'Founder, The Nomad HQ',

  // One-line credential for the visible byline / author box.
  credential: 'Founder of The Nomad HQ, writing practical guides for digital nomads.',

  // Schema description (safe + true; enrich with real specifics over time).
  description:
    'Yannick Schroth is the founder of The Nomad HQ, where he writes practical, ' +
    'field-tested guides for digital nomads on visas, cost of living, coworking, ' +
    'and building a location-independent career.',

  // Visible bio paragraph used in article author boxes.
  bio:
    'Yannick Schroth is the founder of The Nomad HQ. He writes practical, ' +
    'field-tested guides for digital nomads on visas, cost of living, coworking, ' +
    'and building a remote career you can run from anywhere.',

  knowsAbout: [
    'Digital nomad visas',
    'Remote work',
    'Cost of living abroad',
    'Coworking spaces',
    'Geoarbitrage',
    'Long-term travel',
    'Location independence',
  ],
  knowsLanguage: ['English', 'German'],
  nationality: 'German',

  // Real profiles only. Leave empty rather than inventing one.
  sameAs: [
    'https://www.linkedin.com/in/yannick-schroth/',
    'https://www.instagram.com/ynncks/',
  ],
};

/** Full schema.org Person object for JSON-LD `author`. */
function personEntity() {
  const p = {
    '@type': 'Person',
    name: AUTHOR.name,
    url: AUTHOR.url,
    image: AUTHOR.image,
    jobTitle: AUTHOR.jobTitle,
    description: AUTHOR.description,
    knowsAbout: AUTHOR.knowsAbout,
    knowsLanguage: AUTHOR.knowsLanguage,
    nationality: AUTHOR.nationality,
  };
  if (AUTHOR.sameAs.length) p.sameAs = AUTHOR.sameAs;
  return p;
}

module.exports = { SITE, AUTHOR, personEntity };

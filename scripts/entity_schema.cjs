/**
 * Single source of truth for the site's brand + author structured-data entities.
 * Used by apply_entity_schema.cjs (sitewide sweep) and any generator that wants the
 * canonical Organization / WebSite / Person nodes so their @ids stay consistent
 * across every page (lets other JSON-LD reference publisher/author by @id).
 */
const SITE = 'https://thenomadhq.com';
const ORG_ID = SITE + '/#organization';
const SITE_ID = SITE + '/#website';
const PERSON_ID = SITE + '/about/yannick-schroth#person';

const ORG = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'The Nomad HQ',
  url: SITE + '/',
  logo: { '@type': 'ImageObject', url: SITE + '/logo.png', width: 512, height: 512 },
  description: 'Data-driven guides and rankings that help remote workers choose where to live and work, built on an index of 650+ cities scored across 13 categories.',
  founder: { '@id': PERSON_ID },
  sameAs: [
    'https://www.linkedin.com/in/yannick-schroth/',
    'https://www.instagram.com/ynncks/',
  ],
};

const WEBSITE = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: 'The Nomad HQ',
  url: SITE + '/',
  publisher: { '@id': ORG_ID },
  inLanguage: 'en',
  // Sitelinks searchbox. Backed by a real endpoint: /cities?q= prefills the search
  // box and filters on load (see generate_cities_hub.cjs). Do not declare this unless
  // that deep-link keeps working.
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: SITE + '/cities?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

// Author reference used by content pages (self-contained, so pages don't depend on
// the author page being crawled first, while still sharing the same @id).
const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Yannick Schroth',
  url: SITE + '/about/yannick-schroth',
  jobTitle: 'Founder, The Nomad HQ',
  worksFor: { '@id': ORG_ID },
};

// One compact brand graph injected into every page's <head>.
function brandGraphScript() {
  const graph = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE] };
  return '  <!-- brand-graph --><script type="application/ld+json">' + JSON.stringify(graph) + '</script>';
}

// An Article node for an editorial page (city guide, activity page, etc.).
function articleScript({ headline, description, url, image, datePublished, dateModified }) {
  const node = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: image || undefined,
    author: { '@id': PERSON_ID, '@type': 'Person', name: 'Yannick Schroth', url: SITE + '/about/yannick-schroth' },
    publisher: { '@id': ORG_ID },
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: url,
    isPartOf: { '@id': SITE_ID },
  };
  return '  <!-- article-schema --><script type="application/ld+json">' + JSON.stringify(node) + '</script>';
}

module.exports = { SITE, ORG_ID, SITE_ID, PERSON_ID, ORG, WEBSITE, PERSON, brandGraphScript, articleScript };

require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Generates the core trust/legal pages: about, contact, privacy, terms,
 * disclosure. Shared nav + footer + head (fonts loaded correctly). Regenerable.
 * Usage: node scripts/generate_core_pages.cjs
 *
 * NOTE: privacy/terms/disclosure are reasonable, plain-English templates, have a
 * professional review before relying on them. Contact email is a placeholder.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const UPDATED = 'July 1, 2026';
const CONTACT_EMAIL = 'info@topblog.agency';

const NAV = `  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/assets/logo.svg" alt="" class="nav-logo-icon">
        <span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span>
      </a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li><li><a href="/map" class="nav-link">Map</a></li>
        <li><a href="/best" class="nav-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-link">Tier List</a></li>
        <li><a href="/compare" class="nav-link">Compare</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
      
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="/" class="nav-mobile-link">Home</a></li>
        <li><a href="/wheel" class="nav-mobile-link">Wheel</a></li>
        <li><a href="/cities" class="nav-mobile-link">Cities</a></li><li><a href="/map" class="nav-mobile-link">Map</a></li>
        <li><a href="/best" class="nav-mobile-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-mobile-link">Tier List</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      
    </div>
  </nav>

  <script>
    (function () {
      const nav = document.getElementById('mainNav');
      const navToggle = document.getElementById('navToggle');
      const navMobile = document.getElementById('navMobile');
      const body = document.body;
      navToggle.addEventListener('click', function () {
        const isOpen = navToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        body.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
      });
      navMobile.querySelectorAll('.nav-mobile-link, .nav-mobile-actions .btn').forEach(function (link) {
        link.addEventListener('click', function () {
          navToggle.classList.remove('active');
          navMobile.classList.remove('active');
          body.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
      window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
    })();
  </script>`;

const FOOTER = `  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about">
          <a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a>
          <p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Explore</h4>
          <ul class="footer-links">
            <li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li>
            <li><a href="/wheel" class="footer-link">Nomad Wheel</a></li>
            <li><a href="/activities" class="footer-link">By Activity</a></li>
            <li><a href="/blog" class="footer-link">Blog</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Company</h4>
          <ul class="footer-links">
            <li><a href="/about" class="footer-link">About</a></li>
            <li><a href="/methodology" class="footer-link">Methodology</a></li>
            <li><a href="/contact" class="footer-link">Contact</a></li>
            <li><a href="/about/yannick-schroth" class="footer-link">Author</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Legal</h4>
          <ul class="footer-links">
            <li><a href="/privacy" class="footer-link">Privacy Policy</a></li>
            <li><a href="/terms" class="footer-link">Terms of Service</a></li>
            <li><a href="/disclosure" class="footer-link">Affiliate Disclosure</a></li>
            <li><a href="/legal-notice" class="footer-link">Legal Notice</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you. This never affects our data-driven ratings.</p>
        <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p>
      </div>
    </div>
  </footer>`;

function page(slug, title, desc, bodyHtml, robots = 'index, follow', extraCss = '', mainClass = 'legal-page') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="https://thenomadhq.com/${slug}">
  <meta name="robots" content="${robots}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="https://thenomadhq.com/${slug}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <style>
    .legal-page { max-width: 820px; margin: 0 auto; padding: calc(var(--nav-height, 64px) + 3rem) 1.25rem 4.5rem; }
    .legal-page h1 { font-family: 'DM Serif Display', serif; color: var(--color-ink); font-size: clamp(2rem, 5vw, 2.9rem); line-height: 1.1; margin: 0 0 .4rem; }
    .legal-page .lead { color: var(--color-stone); font-size: 1.1rem; line-height: 1.6; margin: 0 0 2rem; }
    .legal-page h2 { font-family: 'DM Serif Display', serif; color: var(--color-ink); font-size: 1.4rem; margin: 2.25rem 0 .6rem; }
    .legal-page p, .legal-page li { color: var(--color-charcoal); line-height: 1.75; }
    .legal-page ul { padding-left: 1.25rem; margin: .5rem 0 1rem; }
    .legal-page li { margin-bottom: .35rem; }
    .legal-page a:not(.btn) { color: var(--color-terracotta); }
    .legal-updated { color: var(--color-stone); font-size: .9rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--color-sand-dark); }
    .legal-cta { display: inline-flex; margin-top: 1rem; }
${extraCss}
  </style>
</head>
<body>
${NAV}

  <main${mainClass ? ` class="${mainClass}"` : ''}>
${bodyHtml}
  </main>

${FOOTER}
</body>
</html>
`;
}

// Bespoke, styled contact page (the generic legal template looked bland here).
function contactPage() {
  const title = 'Contact The Nomad HQ';
  const desc = 'Questions, corrections, city suggestions or partnership ideas. Reader corrections are what keep the city guides accurate, and we read every message.';
  const ICON = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7v.01"/></svg>',
  };
  const card = (href, ext, icon, label, value, note) =>
    `<a class="contact-card" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>
          <span class="contact-icon">${icon}</span>
          <span class="contact-card-label">${label}</span>
          <span class="contact-card-value">${value}</span>
          <span class="contact-card-note">${note}</span>
        </a>`;
  const body = `
    <header class="contact-hero">
      <div class="container">
        <span class="contact-eyebrow">Get in touch</span>
        <h1>Contact</h1>
        <p class="contact-lead">Questions, corrections, city suggestions, or partnership ideas. We read everything, and reader corrections are what keep 410 city guides accurate.</p>
      </div>
    </header>
    <div class="contact-wrap">
      <div class="contact-methods">
        ${card('mailto:' + CONTACT_EMAIL, false, ICON.email, 'Email', CONTACT_EMAIL, 'The fastest way to reach us')}
        ${card('https://www.linkedin.com/in/yannick-schroth/', true, ICON.linkedin, 'LinkedIn', 'Yannick Schroth', 'Connect with the founder')}
        ${card('https://www.instagram.com/ynncks/', true, ICON.instagram, 'Instagram', '@ynncks', 'Behind the scenes')}
      </div>
      <div class="contact-note-card">
        <h2>Spotted something out of date?</h2>
        <p>Found a cost, a visa rule, or a WiFi speed that has changed? Tell us the city and what changed, and we will fix it. Reader corrections are the single best way to keep the ratings honest.</p>
        <p class="contact-reply">We typically reply within a few business days.</p>
        <a href="/cities" class="btn btn-secondary">Browse the city guides &rarr;</a>
      </div>
    </div>`;
  const styles = `
    .contact-hero { background: linear-gradient(180deg, var(--color-sand, #f6f1e7) 0%, rgba(246,241,231,0) 100%); padding: calc(var(--nav-height,64px) + 3.5rem) 1.25rem 2.5rem; text-align: center; }
    .contact-hero .container { max-width: 720px; }
    .contact-eyebrow { display:inline-block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:var(--color-terracotta); margin:0 0 .7rem; }
    .contact-hero h1 { font-family:'DM Serif Display',serif; color:var(--color-ink); font-size:clamp(2.2rem,5.5vw,3.2rem); line-height:1.1; margin:0 0 .8rem; }
    .contact-lead { color:var(--color-charcoal); font-size:1.12rem; line-height:1.7; margin:0 auto; max-width:60ch; }
    .contact-wrap { max-width:900px; margin:0 auto; padding:1.5rem 1.25rem 4.5rem; }
    .contact-methods { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.1rem; }
    .contact-card { display:flex; flex-direction:column; align-items:flex-start; gap:.25rem; padding:1.5rem 1.4rem; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .contact-card:hover { border-color:var(--color-terracotta); transform:translateY(-3px); box-shadow:0 12px 28px rgba(15,23,42,.1); }
    .contact-icon { display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; background:rgba(192,57,43,.1); color:var(--color-terracotta); margin-bottom:.6rem; }
    .contact-icon svg { width:22px; height:22px; }
    .contact-card-label { font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; color:var(--color-stone,#8a8175); font-weight:700; }
    .contact-card-value { font-family:'DM Serif Display',serif; font-size:1.2rem; color:var(--color-ink,#0f172a); word-break:break-word; }
    .contact-card-note { font-size:.85rem; color:var(--color-stone,#8a8175); }
    .contact-note-card { margin-top:1.6rem; padding:1.75rem 1.9rem; background:#F6F1E7; border:1px solid #E3D9C6; border-radius:16px; }
    .contact-note-card h2 { font-family:'DM Serif Display',serif; color:var(--color-ink,#0f172a); font-size:1.4rem; margin:0 0 .6rem; }
    .contact-note-card p { color:var(--color-charcoal,#3a3a3a); line-height:1.7; margin:0 0 .8rem; }
    .contact-reply { color:var(--color-stone,#8a8175) !important; font-size:.92rem; }
    .contact-note-card .btn { margin-top:.4rem; }`;
  return page('contact', title, desc, body, 'index, follow', styles, '');
}

const updatedLine = `    <p class="legal-updated">Last updated: ${UPDATED}</p>`;
// Privacy was revised (third-party/map-tile + self-hosted-fonts clarification) after the others.
const privacyUpdatedLine = `    <p class="legal-updated">Last updated: July 28, 2026</p>`;

// NOTE: about.html is intentionally NOT generated here. It is a bespoke, hand-maintained
// page (custom layout, AboutPage + Organization + Person JSON-LD, stat row, category grid,
// author card, explore hub) that no longer fits the shared legal template. Edit about.html directly.
const pages = {
  'legal-notice.html': page('legal-notice', 'Legal Notice, The Nomad HQ', 'Company and contact details for The Nomad HQ, operated by Topblog LLC. This page also serves as our imprint (Impressum).', `    <h1>Legal Notice</h1>
    <p class="lead">Company and contact information for The Nomad HQ. This page also serves as our imprint (Impressum).</p>
    <h2>Site operator</h2>
    <p>This website, The Nomad HQ (thenomadhq.com), is operated by:</p>
    <ul>
      <li><strong>Topblog LLC</strong></li>
      <li>1309 Coffeen Avenue STE 1200</li>
      <li>Sheridan, Wyoming 82801</li>
      <li>United States</li>
    </ul>
    <h2>Contact</h2>
    <p>Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. For corrections, city suggestions, or anything else, see our <a href="/contact">contact page</a>.</p>
    <h2>Responsible for content</h2>
    <p>Editorial content is written and maintained by Yannick Schroth on behalf of Topblog LLC. Read more on the <a href="/about/yannick-schroth">author page</a>.</p>
    <h2>Affiliate links</h2>
    <p>Some links on this site are affiliate links, and we may earn a commission at no extra cost to you. This never influences our ratings. Full details are in our <a href="/disclosure">affiliate disclosure</a>.</p>
    <h2>Liability for content and links</h2>
    <p>We produce our content with care, but we cannot guarantee that it is always accurate, complete, or current; city data in particular changes over time. Our pages may link to external websites we do not control, and we are not responsible for their content. See our <a href="/terms">terms of service</a> for the full disclaimer.</p>
    <h2>Data protection</h2>
    <p>How we collect and handle your data is explained in our <a href="/privacy">privacy policy</a>.</p>
${updatedLine}`),

  'contact.html': contactPage(),

  'disclosure.html': page('disclosure', 'Affiliate Disclosure, The Nomad HQ', 'Some links on The Nomad HQ earn a commission. What that does and does not change about what we recommend, and how to spot one on the page.', `    <h1>Affiliate Disclosure</h1>
    <p class="lead">In plain English: some links earn us a commission. That never changes what we recommend.</p>
    <p>The Nomad HQ is reader-supported. Some links on this site, for example, to accommodation booking platforms, travel insurance, eSIMs, or banking services, are <strong>affiliate links</strong>. If you click one and make a purchase, we may earn a commission <strong>at no extra cost to you</strong>.</p>
    <h2>How this affects our content</h2>
    <p>It does not. Our city ratings and the Nomad Score are derived from data and independent assessment, and are <strong>never</strong> influenced by whether a destination or provider has an affiliate program. We link to services because we think they are useful to remote workers, not because of commissions.</p>
    <h2>How to identify affiliate links</h2>
    <p>Affiliate and sponsored links are marked with <code>rel="sponsored"</code> and, where relevant, a note near the link. Commissions help us keep the site free and continue researching and updating city guides.</p>
    <p>This disclosure is provided in accordance with U.S. Federal Trade Commission (FTC) guidelines. Questions? <a href="/contact">Contact us</a>.</p>
${updatedLine}`),

  'privacy.html': page('privacy', 'Privacy Policy, The Nomad HQ', 'What The Nomad HQ collects and why, the cookies the banner controls, the third parties involved, your rights over the data and how long it is kept.', `    <h1>Privacy Policy</h1>
    <p class="lead">This policy explains what we collect and why. We keep it minimal.</p>
    <h2>Information we collect</h2>
    <ul>
      <li><strong>Analytics data.</strong> We use privacy-respecting analytics and Google Search Console to understand aggregate traffic (pages viewed, approximate location, device, referrer). This is not used to personally identify you.</li>
      <li><strong>Messages.</strong> If you email us, we keep your message and address to reply.</li>
    </ul>
    <h2>Cookies</h2>
    <p>We use essential cookies for basic functionality and may use analytics and affiliate cookies (e.g., to attribute a referral to a booking partner). You can block cookies in your browser; core content will still work.</p>
    <h2>Third parties</h2>
    <p>We rely on trusted providers to run the site: hosting and CDN (Vercel) and analytics (Google). When you open an interactive map, the map tiles and mapping library load from OpenStreetMap, Carto, and a public code CDN, which receive your IP address in order to serve them. Affiliate links are handled by their respective networks (for example, Booking.com). Each provider processes data under its own privacy policy. We host our own fonts, so no data is sent to any font CDN. We do not sell your personal information.</p>
    <h2>Your rights</h2>
    <p>Depending on where you live (e.g., the EU/UK under GDPR, or California under CCPA), you may have the right to access, correct, or delete your data, or opt out of certain processing. To exercise these rights, <a href="/contact">contact us</a>.</p>
    <h2>Data retention &amp; children</h2>
    <p>We keep personal data only as long as needed for the purposes above. The site is not directed to children under 13, and we do not knowingly collect their data.</p>
    <h2>Changes</h2>
    <p>We may update this policy; material changes will be reflected by the date below. Questions? <a href="/contact">Contact us</a>.</p>
${privacyUpdatedLine}`),

  'terms.html': page('terms', 'Terms of Service, The Nomad HQ', 'The terms for using The Nomad HQ: the site is informational, what we do not warrant, how affiliate links work, and the limits of our liability.', `    <h1>Terms of Service</h1>
    <p class="lead">By using The Nomad HQ, you agree to these terms.</p>
    <h2>Informational purposes only</h2>
    <p>The Nomad HQ provides information about cities, cost of living, visas, safety, and related topics for <strong>general informational purposes only</strong>. Data can change quickly and may contain errors. Nothing here is legal, financial, immigration, tax, or travel advice. <strong>Always verify critical details</strong>, especially visa rules, taxes, and safety, with official sources before making decisions.</p>
    <h2>No warranties</h2>
    <p>The site is provided &ldquo;as is,&rdquo; without warranties of any kind, express or implied, including accuracy, completeness, or fitness for a particular purpose.</p>
    <h2>Limitation of liability</h2>
    <p>To the fullest extent permitted by law, The Nomad HQ and its author are not liable for any loss or damage arising from your use of, or reliance on, the site or its content.</p>
    <h2>Affiliate links</h2>
    <p>Some links are affiliate links, as described in our <a href="/disclosure">Affiliate Disclosure</a>.</p>
    <h2>Intellectual property &amp; acceptable use</h2>
    <p>Site content is owned by The Nomad HQ or its licensors and may not be copied or scraped at scale without permission. Do not misuse the site, attempt to disrupt it, or use it unlawfully.</p>
    <h2>Third-party links</h2>
    <p>We link to third-party sites we do not control and are not responsible for their content or practices.</p>
    <h2>Changes &amp; contact</h2>
    <p>We may update these terms; continued use means you accept the changes. Questions? <a href="/contact">Contact us</a>.</p>
${updatedLine}`),

  '404.html': page('404', 'Page Not Found, The Nomad HQ', 'Sorry, we could not find that page. Browse our city guides, take the Nomad Wheel, or read the blog.', `    <h1>Page not found</h1>
    <p class="lead">We couldn&rsquo;t find that page, it may have moved, or never existed.</p>
    <p>Try one of these instead:</p>
    <ul>
      <li><a href="/cities">Browse all 410 city guides</a></li>
      <li><a href="/wheel">Find your match on the Nomad Wheel</a></li>
      <li><a href="/blog">Read the blog</a></li>
      <li><a href="/">Go to the homepage</a></li>
    </ul>
    <a href="/cities" class="btn btn-primary btn-lg legal-cta">Browse cities &rarr;</a>`, 'noindex, follow'),
};

let n = 0;
for (const [file, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), html);
  n++;
}
console.log(`Wrote ${n} core pages: ${Object.keys(pages).join(', ')}`);

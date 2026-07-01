/**
 * Generates the core trust/legal pages: about, contact, privacy, terms,
 * disclosure. Shared nav + footer + head (fonts loaded correctly). Regenerable.
 * Usage: node scripts/generate_core_pages.cjs
 *
 * NOTE: privacy/terms/disclosure are reasonable, plain-English templates — have a
 * professional review before relying on them. Contact email is a placeholder.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const UPDATED = 'July 1, 2026';
const CONTACT_EMAIL = 'hello@thenomadhq.com';

const NAV = `  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/assets/logo.svg" alt="" class="nav-logo-icon">
        <span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span>
      </a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions">
        <a href="/login" class="nav-login">Login</a>
        <a href="/signup" class="btn btn-primary nav-signup">Sign Up</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="/" class="nav-mobile-link">Home</a></li>
        <li><a href="/wheel" class="nav-mobile-link">Wheel</a></li>
        <li><a href="/cities" class="nav-mobile-link">Cities</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions">
        <a href="/login" class="btn btn-secondary">Login</a>
        <a href="/signup" class="btn btn-primary">Sign Up</a>
      </div>
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
            <li><a href="/cities" class="footer-link">All Cities</a></li>
            <li><a href="/wheel" class="footer-link">Nomad Wheel</a></li>
            <li><a href="/blog" class="footer-link">Blog</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Company</h4>
          <ul class="footer-links">
            <li><a href="/about" class="footer-link">About</a></li>
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
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you. This never affects our data-driven ratings.</p>
        <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p>
      </div>
    </div>
  </footer>`;

function page(slug, title, desc, bodyHtml, robots = 'index, follow') {
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
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
    .legal-page a { color: var(--color-terracotta); }
    .legal-updated { color: var(--color-stone); font-size: .9rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--color-sand-dark); }
    .legal-cta { display: inline-flex; margin-top: 1rem; }
  </style>
</head>
<body>
${NAV}

  <main class="legal-page">
${bodyHtml}
  </main>

${FOOTER}
</body>
</html>
`;
}

const updatedLine = `    <p class="legal-updated">Last updated: ${UPDATED}</p>`;

const pages = {
  'about.html': page('about', 'About The Nomad HQ', 'The Nomad HQ rates 410 cities on the 13 things that matter most to digital nomads, so remote workers can find their ideal base with real data instead of guesswork.', `    <h1>About The Nomad HQ</h1>
    <p class="lead">We help remote workers find the right city to live and work &mdash; using data, not hype.</p>
    <p>The Nomad HQ rates <strong>410 cities</strong> on the 13 things that actually matter to digital nomads: cost of living, internet, safety, climate, visas, community, food, culture, and more. Every city gets a calibrated <strong>Nomad Score</strong> and a full breakdown, so you can compare destinations like-for-like instead of trusting scattered blog opinions.</p>
    <h2>How we rate cities</h2>
    <p>Each of the 13 categories is scored 1&ndash;10 from official data sources, global indices, and hands-on assessment. The Nomad Score is a calibrated composite of those categories, tuned so the strongest and weakest cities genuinely stand out. Ratings are independent &mdash; they are never influenced by advertising or affiliate partnerships. You can <a href="/cities">browse and compare every city</a> or <a href="/wheel">match your priorities on the Nomad Wheel</a>.</p>
    <h2>Who is behind it</h2>
    <p>The Nomad HQ is written and maintained by <a href="/about/yannick-schroth">Yannick Schroth</a>, who covers remote work, travel, and the practicalities of living abroad. Read more on the <a href="/about/yannick-schroth">author page</a>.</p>
    <h2>Get in touch</h2>
    <p>Spotted an error, or have a city we should add? <a href="/contact">Contact us</a> &mdash; reader corrections keep the ratings honest.</p>
    <a href="/cities" class="btn btn-primary btn-lg legal-cta">Browse all cities &rarr;</a>`),

  'contact.html': page('contact', 'Contact The Nomad HQ', 'Get in touch with The Nomad HQ — corrections, city suggestions, partnerships, or press.', `    <h1>Contact</h1>
    <p class="lead">Questions, corrections, city suggestions, or partnership ideas &mdash; we read everything.</p>
    <p>The fastest way to reach us is email:</p>
    <ul>
      <li><strong>Email:</strong> <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></li>
      <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/yannick-schroth/" rel="noopener" target="_blank">Yannick Schroth</a></li>
      <li><strong>Instagram:</strong> <a href="https://www.instagram.com/ynncks/" rel="noopener" target="_blank">@ynncks</a></li>
    </ul>
    <p>Found something out of date &mdash; a cost, a visa rule, a WiFi speed? Tell us the city and what changed and we will update it. Reader corrections are the single best way to keep 410 city guides accurate.</p>
    <p>We typically reply within a few business days.</p>`),

  'disclosure.html': page('disclosure', 'Affiliate Disclosure — The Nomad HQ', 'How The Nomad HQ uses affiliate links and how that does (and does not) affect our content.', `    <h1>Affiliate Disclosure</h1>
    <p class="lead">In plain English: some links earn us a commission. That never changes what we recommend.</p>
    <p>The Nomad HQ is reader-supported. Some links on this site &mdash; for example, to accommodation booking platforms, travel insurance, eSIMs, or banking services &mdash; are <strong>affiliate links</strong>. If you click one and make a purchase, we may earn a commission <strong>at no extra cost to you</strong>.</p>
    <h2>How this affects our content</h2>
    <p>It does not. Our city ratings and the Nomad Score are derived from data and independent assessment, and are <strong>never</strong> influenced by whether a destination or provider has an affiliate program. We link to services because we think they are useful to remote workers &mdash; not because of commissions.</p>
    <h2>How to identify affiliate links</h2>
    <p>Affiliate and sponsored links are marked with <code>rel="sponsored"</code> and, where relevant, a note near the link. Commissions help us keep the site free and continue researching and updating city guides.</p>
    <p>This disclosure is provided in accordance with U.S. Federal Trade Commission (FTC) guidelines. Questions? <a href="/contact">Contact us</a>.</p>
${updatedLine}`),

  'privacy.html': page('privacy', 'Privacy Policy — The Nomad HQ', 'How The Nomad HQ collects, uses, and protects your information.', `    <h1>Privacy Policy</h1>
    <p class="lead">This policy explains what we collect and why. We keep it minimal.</p>
    <h2>Information we collect</h2>
    <ul>
      <li><strong>Analytics data.</strong> We use privacy-respecting analytics and Google Search Console to understand aggregate traffic (pages viewed, approximate location, device, referrer). This is not used to personally identify you.</li>
      <li><strong>Account data.</strong> If you create an account or vote on cities, we store the email and preferences you provide via our authentication provider.</li>
      <li><strong>Messages.</strong> If you email us, we keep your message and address to reply.</li>
    </ul>
    <h2>Cookies</h2>
    <p>We use essential cookies for basic functionality and may use analytics and affiliate cookies (e.g., to attribute a referral to a booking partner). You can block cookies in your browser; core content will still work.</p>
    <h2>Third parties</h2>
    <p>We rely on trusted providers to run the site, including our hosting/CDN (Vercel), authentication/database (Supabase), analytics (Google), and affiliate networks. These providers process data under their own privacy policies. We do not sell your personal information.</p>
    <h2>Your rights</h2>
    <p>Depending on where you live (e.g., the EU/UK under GDPR, or California under CCPA), you may have the right to access, correct, or delete your data, or opt out of certain processing. To exercise these rights, <a href="/contact">contact us</a>.</p>
    <h2>Data retention &amp; children</h2>
    <p>We keep personal data only as long as needed for the purposes above. The site is not directed to children under 13, and we do not knowingly collect their data.</p>
    <h2>Changes</h2>
    <p>We may update this policy; material changes will be reflected by the date below. Questions? <a href="/contact">Contact us</a>.</p>
${updatedLine}`),

  'terms.html': page('terms', 'Terms of Service — The Nomad HQ', 'The terms governing your use of The Nomad HQ.', `    <h1>Terms of Service</h1>
    <p class="lead">By using The Nomad HQ, you agree to these terms.</p>
    <h2>Informational purposes only</h2>
    <p>The Nomad HQ provides information about cities, cost of living, visas, safety, and related topics for <strong>general informational purposes only</strong>. Data can change quickly and may contain errors. Nothing here is legal, financial, immigration, tax, or travel advice. <strong>Always verify critical details</strong> &mdash; especially visa rules, taxes, and safety &mdash; with official sources before making decisions.</p>
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
};

let n = 0;
for (const [file, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), html);
  n++;
}
console.log(`Wrote ${n} core pages: ${Object.keys(pages).join(', ')}`);

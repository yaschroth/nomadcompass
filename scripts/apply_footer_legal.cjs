require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Adds the legal/company links + affiliate disclosure to the footer of every
 * existing page (before the copyright line) and bumps the year 2025 -> 2026.
 * Handles both footer-bottom variants (city "All rights reserved" and blog
 * "Made with coffee..."). Idempotent. Usage: node scripts/apply_footer_legal.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const LEGAL = `<nav class="footer-legal" aria-label="Legal and company">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/disclosure">Affiliate Disclosure</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/legal-notice">Legal Notice</a>
        </nav>
        <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
        `;

const RE = /(<div class="footer-bottom">\s*)(<p[^>]*>&copy; )2025( The Nomad HQ[^<]*<\/p>)/;

const targets = [];
for (const f of ['wheel.html', 'blog.html', 'rentals.html', 'login.html', 'signup.html', 'profile.html']) {
  if (fs.existsSync(path.join(ROOT, f))) targets.push(path.join(ROOT, f));
}
for (const dir of ['cities', 'blog']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.html'))) targets.push(path.join(ROOT, dir, f));
}

let changed = 0, already = 0, nomatch = 0;
for (const abs of targets) {
  let s = fs.readFileSync(abs, 'utf8');
  if (/footer-legal/.test(s)) { already++; continue; }
  if (!RE.test(s)) { nomatch++; continue; }
  s = s.replace(RE, (m, open, pOpen, pRest) => open + LEGAL + pOpen + '2026' + pRest);
  fs.writeFileSync(abs, s);
  changed++;
}
console.log(`Footer legal links added: ${changed} | already had: ${already} | NO footer match: ${nomatch}`);

/**
 * The "Get listed" button in the header: one on the desktop bar, straight after the nav search, and one
 * at the foot of the mobile menu. Both go to /list-your-business.
 *
 * withNavCta(html) strips every copy and inserts exactly one of each, so it is safe to run on any page
 * any number of times. apply_nav_cta.cjs runs it sitewide, and _safe_write.cjs runs it on a page whose
 * generator wrote the nav without the button, the same carry the list-cta banner gets.
 */
const DESKTOP = '<a href="/list-your-business" class="nav-cta">Get listed</a>';
const MOBILE = '<a href="/list-your-business" class="nav-mobile-cta">Get listed</a>';

// No whitespace is added around either link, so strip-then-insert gives back the page byte for byte.
// (A first version added a newline and indent; on pages where the form and the burger share a line,
// the strip could not take back exactly what the insert added and every run grew the page.)
const STRIP = /<a [^>]*class="nav-(?:mobile-)?cta"[^>]*>[^<]*<\/a>/g;
const FORM = /<form class="nav-search"[\s\S]*?<\/form>/;
const MOBILE_UL = /(<div class="nav-mobile"[^>]*>\s*<ul class="nav-mobile-links">[\s\S]*?<\/ul>)/;

function withNavCta(html) {
  if (!/<nav class="nav"/.test(html)) return html;
  let out = html.replace(STRIP, '');
  if (FORM.test(out)) out = out.replace(FORM, (m) => m + DESKTOP);
  else out = out.replace(/<button[^>]*class="nav-toggle"/, (m) => DESKTOP + m);
  out = out.replace(MOBILE_UL, (m) => m + MOBILE);
  return out;
}

const hasNavCta = (html) => html.includes('class="nav-cta"');

module.exports = { withNavCta, hasNavCta, DESKTOP, MOBILE };

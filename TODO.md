# The Nomad HQ — TODO / Backlog

Deferred work and decisions, so nothing gets lost. Newest/most important first.

---

## 1. Affiliate conversion layer (deferred — biggest revenue lever)

**Goal:** monetize via accommodation affiliate (Booking) + affiliate links in blog posts.
**Status:** decided NOT to build yet (focus on blog quality first). The structure is ready for it
(city pages have a "Where to Stay" section; blog posts have `[AFFILIATE]` placeholder slots).

### Chosen approach
- **Lightweight Booking deep-link CTAs** ("See available stays in {City} →") in each indexed city
  page's "Where to Stay" section and in relevant blog posts.
- Parameterize by a **single `affiliateId` config** that is blank until approved: links show real
  Booking listings on click immediately, and start **earning** the moment the ID is set (one config
  change + re-run a script, no rebuild).
- **Skip** on-page listing cards (needs an API feed, is a maintenance burden, and is duplicate/thin
  content). The **Stay22 map widget** is the alternative if we later want real listings rendered
  in-page — heavier (third-party JS, Core Web Vitals cost); revisit once we have traffic.

### Provider decision — PENDING (pick one before building)
- **Travelpayouts** — recommended. Affiliate network that resells Booking.com + hotels via one
  account/marker; fast approval for a new, pre-traffic site. Lightweight deep-links.
- **Stay22** — free account, very low approval bar, in-page map of real stays across platforms.
- **Direct Booking.com `aid`** — keeps full commission (no network cut) but slower approval for a
  young site. Use only if we already have an approved `aid`.
- **Airbnb — NOT available.** Their open affiliate program is closed; do not build on it.

### Requirements when we build it (do NOT skip)
- `rel="sponsored nofollow"` + `target="_blank"` on every affiliate link (Google requirement).
- An **affiliate disclosure** near the links + a `/disclosure` page (FTC requirement).
- Replace the existing `[AFFILIATE]` placeholder comments and `href="#"` slots (blog sidebars +
  city "Where to Stay").
- Money lives on **indexed city pages + blog**, NOT the 657 accommodation pages (those are
  intentionally `noindex` — see [ACCOMMODATION_PAGE_STYLE_GUIDE.md](ACCOMMODATION_PAGE_STYLE_GUIDE.md)).

### Also worth adding (open programs that approve new sites, fit the nomad audience)
- Travel insurance — **SafetyWing** (already linked once, untracked) / Genki.
- eSIM — **Airalo**. Banking — **Wise**. Coworking / visa / relocation services.

---

## 2. Rentals section — currently HIDDEN (2026-06-30)

Removed from the nav sitewide, `noindex` on `rentals.html`, and dropped from the sitemap, to focus
on the blog. The file and logic are kept. **To bring it back:** `git revert` the "hide Rentals"
commit, or re-add the nav item (reverse of `scripts/hide_rentals.cjs`) and remove the `noindex`.
Tied to item 1 (rentals only makes sense once the accommodation/affiliate layer exists).

---

## 3. Content focus — blog first

Make the blog articles genuinely good and unique (the current priority). Then revisit:
- **City pages:** 410 templated pages risk thin-content non-indexing. Consider focusing quality on
  a strong core (~40–60 cities) and `noindex` the weakest until fleshed out.
- Add booking-intent content ("Where to stay in {City} as a nomad", neighborhood guides) once the
  affiliate layer exists.

---

## 4. Smaller cleanups surfaced by the SEO audits

- ✅ **Dead footer links** removed from index.html (2026-07-01). Footer now links
  About/Contact/Privacy/Terms/Affiliate-Disclosure sitewide (`scripts/apply_footer_legal.cjs`).
- ✅ **Legal/trust pages** added (2026-07-01): `/privacy`, `/terms`, `/disclosure`, `/contact`,
  `/about` via `scripts/generate_core_pages.cjs`. TWO follow-ups: (a) have a professional review the
  privacy/terms/disclosure wording; (b) set up the `hello@thenomadhq.com` inbox used on /contact
  (placeholder) or swap the address.
- ✅ **Font-loading bug** fixed sitewide (2026-07-01): pages now actually load the DM Serif Display
  stylesheet (`scripts/fix_font_loading.cjs`) — was silently falling back to Georgia everywhere
  except /cities.
- **Newsletter capture — DEFERRED (owner said not yet).** The footer "Subscribe" form is fake:
  `onsubmit="event.preventDefault(); alert('Thanks!')"` stores nothing. Wire it to a real provider
  (MailerLite / Buttondown / ConvertKit) so signups build an actual list — best owned-audience asset
  for an affiliate site. Same fake form on index.html footer.
- **Analytics still missing.** GSC is set up (owner), but no GA4/Plausible page analytics installed —
  add one to see traffic, top landing pages, and behavior. Resubmit the (now fresh) sitemap in GSC.
- **`index-shell.html`** is a homepage duplicate (already `noindex`); delete when convenient.
- **Author entity:** now linked sitewide (footer); still worth enriching Yannick's bio with concrete
  first-hand specifics (cities visited, years nomading) for E-E-A-T.
- **Core Web Vitals:** the 410 external Unsplash `<img>` have no `width`/`height` (CLS) or `srcset`;
  homepage LCP is an 875 KB CSS background image; no caching headers in `vercel.json`. All fixable.
- **Thin content:** ~200 city pages are near-duplicate templated prose — consider `noindex` on the
  weak tail + concentrating unique content on a ~40-60 core (see item 3).

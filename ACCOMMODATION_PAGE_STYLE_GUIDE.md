# Accommodation Page Style & SEO Guide — The Nomad HQ

Source of truth for the **SEO, structure, and indexing strategy** of the 657 listing pages in
[`accommodations/`](accommodations/). Counterpart of [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md)
and [`CITY_PAGE_STYLE_GUIDE.md`](CITY_PAGE_STYLE_GUIDE.md).

Shared rules (clean self-canonical URLs, em-dash ban, one `<h1>`, mobile parity) are the same as
the blog and not repeated; see [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md).

---

## 0. Read first — the indexing decision (this page type is different)

These 657 pages are the **thinnest and most templated content on the site**, and there are a lot
of them. That is exactly the profile that hurts a young domain's crawl budget and overall quality
signal (see the indexing spec, "crawl budget / thin & duplicate pages"). Current state audited
2026-06-30, a typical page ([`accommodations/accra-penthouse-loft.html`](accommodations/accra-penthouse-loft.html)):

- **~660 words**, 4 H2s ("About This Apartment", "Amenities", "Why Nomads Love It",
  "What's Nearby") — mostly templated phrasing.
- **No JSON-LD, no Open Graph, no Twitter, no `robots` meta.** Self-canonical present.
- Meta description ~179 chars (too long). Title carries an em-dash and the brand suffix.
- Links to its parent city (`../cities/<city>`), which is good, but little else.

**Before optimising 657 pages, decide which strategy applies.** Pick one:

| Strategy | When | What to do |
|---|---|---|
| **A. Index as real inventory** | The listings are real, bookable, and you can make each genuinely unique + substantive | Apply this whole guide: unique copy, `Accommodation` schema, OG, internal links, keep in sitemap |
| **B. `noindex`, keep for UX** *(recommended default until they're real/unique)* | The listings are illustrative/templated and exist mainly for on-site browsing | Add `<meta name="robots" content="noindex,follow">`, **remove them from [`sitemap.xml`](sitemap.xml)**, keep them crawlable via `follow` so link equity still flows to city pages |
| **C. Consolidate** | Many near-duplicate listings per city add little | Replace per-listing pages with a single "Where to stay in {City}" section/page and 301 the old URLs |

Indexing 657 thin, templated pages (Strategy A done badly) is worse than not indexing them.
Only choose A if you will actually make them substantive and distinct. The rest of this guide is
the spec for Strategy A; the `noindex` snippet for Strategy B is in section 9.

---

## 1. URL, file & head (Strategy A)

- Path `accommodations/<slug>.html` → `https://thenomadhq.com/accommodations/<slug>` (clean URL).
  Slug is `{city}-{property-name}`, lowercase kebab-case, immutable.
- Required `<head>`:

```html
<title>{Property}, {City}: Nomad-Friendly {Type}</title>      <!-- <= 60 chars, NO em-dash, NO brand suffix if it would exceed 60 -->
<meta name="description" content="...">                         <!-- 140-155 chars: property + city + type + a concrete draw (price/area/wifi) -->
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://thenomadhq.com/accommodations/<slug>">
<!-- Open Graph (currently ABSENT - add all): og:title, og:description, og:type=website, og:url, og:image (the listing photo) -->
<!-- Twitter: twitter:card=summary_large_image, twitter:title/description/image -->
```

Open Graph is missing on every accommodation page today — add it so shared links render a card.

---

## 2. Structured data

Inject into the static `<head>`:

1. **`BreadcrumbList`** — Home → Cities → {City} → {Property} (anchor the listing under its
   city, which is its real parent and strongest topical signal):
   ```json
   { "@type":"BreadcrumbList","itemListElement":[
     {"@type":"ListItem","position":1,"name":"Home","item":"https://thenomadhq.com/"},
     {"@type":"ListItem","position":2,"name":"Cities","item":"https://thenomadhq.com/cities"},
     {"@type":"ListItem","position":3,"name":"{City}","item":"https://thenomadhq.com/cities/<city-slug>"},
     {"@type":"ListItem","position":4,"name":"{Property}","item":"https://thenomadhq.com/accommodations/<slug>"}
   ]}
   ```
2. **Main entity — `Accommodation`** (or the specific subtype: `Apartment`, `House`, `Hostel`,
   `Hotel`):
   ```json
   { "@type":"Apartment","name":"{Property}","description":"{unique description}",
     "image":"{photo URL}",
     "address":{"@type":"PostalAddress","addressLocality":"{City}","addressCountry":"{Country}"},
     "amenityFeature":[{"@type":"LocationFeatureSpecification","name":"High-speed WiFi","value":true}],
     "url":"https://thenomadhq.com/accommodations/<slug>" }
   ```
   Map the page's "Amenities" list into `amenityFeature` entries.

**Honesty rules (important):** do **not** add `Offer`/`priceRange`, `aggregateRating`, or
`Review` schema unless the price and reviews are **real and current**. Fake offers and ratings are
a structured-data violation and a manual-action risk. If you can't verify a price, omit the offer.

---

## 3. Content & uniqueness

This is where Strategy A succeeds or fails. Each listing needs **genuinely unique, specific copy**,
not the same four templated paragraphs with the name swapped:

- **300–500+ words of real, listing-specific detail:** the actual neighborhood, what's a short
  walk away, the real desk/WiFi/work setup, who it suits (solo, couple, long stay), and an honest
  note on trade-offs. Specifics beat adjectives.
- Keep the real sections ("About", "Amenities", "Why Nomads Love It", "What's Nearby") but write
  them per-property. Two listings in the same city must read differently.
- **Unique photo per listing.** Reused stock photos across listings = mass-produced signal.
- Exactly one `<h1>` (the property name). H2s should carry "{City}" or the type where natural.
- No em-dashes; house style per [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §4.

If you cannot write unique, substantive copy for a listing, it belongs in Strategy B (`noindex`),
not the index.

---

## 4. Internal linking

Every listing must link, in static HTML:

- **Up** to its city page (`/cities/<city-slug>`) with a descriptive anchor (e.g. "digital nomad
  guide to {City}") — it already links the city in the nav; add a contextual in-content link too.
- **Sideways** to 2–3 other listings in the same city (`/accommodations/<city>-*`).
- **Across** to [`/rentals`](/rentals) (the rentals hub) and, where relevant, the matching blog
  city guide.

Root-absolute form, descriptive anchors, all resolving. This keeps each listing one click from its
city cluster and lets link equity flow upward to the city pages (which are the pages you most want
to rank).

---

## 5. Images

WebP or optimised stock, **unique per listing**, showing the actual property/area, descriptive alt
text including the property and city. Hero explicitly sized, `loading="lazy"` for gallery shots.
See [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §10.

---

## 9. Strategy B snippet (`noindex`, keep for UX)

If a listing is not going to be made substantive and unique, do this instead of section 1–5:

```html
<meta name="robots" content="noindex, follow">
```

- `follow` keeps the outbound links live so equity still flows to the city pages.
- **Remove the URL from [`sitemap.xml`](sitemap.xml)** (don't ask Google to index a page you've
  noindexed — that's a mixed signal). 657 accommodation URLs are currently in the sitemap; if you
  choose B, strip them.
- The pages stay reachable via the [`/rentals`](/rentals) hub and city pages for human browsing.

---

## 10. Per-page checklist (Strategy A)

- [ ] Clean URL resolves (200); canonical = `og:url` = `https://thenomadhq.com/accommodations/<slug>`.
- [ ] `<title>` ≤ 60, no em-dash; meta description 140–155 (property + city + draw).
- [ ] `robots: max-image-preview:large`; **Open Graph added**; Twitter card present.
- [ ] JSON-LD: **`BreadcrumbList` + `Accommodation`/subtype**; no fake `Offer`/`Review`; validates.
- [ ] Exactly one `<h1>`; ≥ 300 words of **unique, property-specific** copy.
- [ ] Static internal links: parent city + 2–3 sibling listings + `/rentals` — all resolve.
- [ ] Unique photo; not a near-duplicate of other listings.
- [ ] In `sitemap.xml` only if indexed (Strategy A); if Strategy B, `noindex,follow` and removed from sitemap.
- [ ] No em-dashes; mobile parity.

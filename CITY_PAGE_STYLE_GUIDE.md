# City Page Style & SEO Guide — The Nomad HQ

Source of truth for the **SEO, structure, structured data, and quality** of the 410
city pages in [`cities/`](cities/). It is the city-page counterpart of
[`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md).

Two related documents:
- [`CITY_PAGE_GUIDE.md`](CITY_PAGE_GUIDE.md) — how to *build/fill* a city page (template,
  data, the 10 content sections). Use it for the mechanics of creating a page.
- **This file** — how to make that page *rank and get indexed*. Read both before adding or
  editing a city page.

Shared, non-negotiable rules are identical to the blog and are not repeated in full here:
clean self-canonical URLs, the em-dash / spaced-en-dash ban, exactly one `<h1>`, mobile-first
parity, no thin/duplicate content. See [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §2, §4, §11.

---

## 0. Current state (audited 2026-06-30) — what every city page is missing

A typical city page (e.g. [`cities/lisbon.html`](cities/lisbon.html)) is already substantial
(~3,300 words, 8 H2s, 1 H1, self-canonical present). But every city page is missing:

- **All structured data.** Zero JSON-LD. No `BreadcrumbList`, no `Place`/`City` entity,
  no `FAQPage`. This is the single biggest gap (city pages are eligible for rich results and
  knowledge-panel signals they currently forfeit).
- **`robots` meta** (`max-image-preview:large`) — absent.
- **Twitter card + `og:url`** — absent (only 4 OG tags, no Twitter tags).
- **Crawlable internal links.** The "Where to Stay" and "You Might Also Like" sections are
  **JS-rendered** (`href="${r.id}.html"` built at runtime), so the raw HTML has **0** static
  links to other cities, accommodations, or blog guides. Discovery and link equity are lost.
- **A real FAQ section** (and its `FAQPage` schema).
- **An em-dash in the `<title>`** ("Lisbon, Portugal — The Nomad HQ City Guide") — house-style
  violation, and the meta description runs short (~116 chars; target 140–155).

Fixing these is the city-page work plan. The rest of this guide is the spec.

---

## 1. URL, file & head

- Path `cities/<slug>.html` → served at `https://thenomadhq.com/cities/<slug>` (clean URL).
  Slug = the city `id` in [`cities-data.js`](cities-data.js); it never changes (301 if renamed).
- Required `<head>`, in addition to charset/viewport/fonts:

```html
<title>{City} Digital Nomad Guide: Cost, WiFi & Visa</title>   <!-- <= 60 chars, NO em-dash, NO brand suffix if it would exceed 60 -->
<meta name="description" content="...">                         <!-- 140-155 chars, "{City}" + "digital nomad" + a number/hook -->
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://thenomadhq.com/cities/<slug>">
<!-- Open Graph: og:title, og:description, og:type=website, og:url (the canonical), og:image (the hero) -->
<!-- Twitter: twitter:card=summary_large_image, twitter:title/description/image -->
```

- **Title formula:** `{City} Digital Nomad Guide: {benefit}` or `{City} for Digital Nomads:
  Cost of Living, WiFi & Visa`. Keep the city name first (it is the primary keyword) and the
  whole rendered title ≤ 60 chars. Drop the ` | The Nomad HQ` suffix rather than exceed 60.
- **Meta description:** lead with the city, include "digital nomad"/"remote work", and a
  concrete pull (a cost figure, the score, the WiFi speed). Active voice, ends on a hook.

---

## 2. Structured data (the priority fix)

Inject into the static `<head>` (these pages are static HTML, so the JSON-LD must be written
into the file or generated at build time, not via runtime JS):

1. **`BreadcrumbList`** — Home → Cities → {City}:
   ```json
   { "@type":"BreadcrumbList","itemListElement":[
     {"@type":"ListItem","position":1,"name":"Home","item":"https://thenomadhq.com/"},
     {"@type":"ListItem","position":2,"name":"Cities","item":"https://thenomadhq.com/cities"},
     {"@type":"ListItem","position":3,"name":"{City}","item":"https://thenomadhq.com/cities/<slug>"}
   ]}
   ```
2. **Main entity — `City`** (a subtype of `Place`). Use the data the page already holds:
   ```json
   { "@type":"City","name":"{City}","description":"{tagline/excerpt}",
     "containedInPlace":{"@type":"Country","name":"{Country}"},
     "geo":{"@type":"GeoCoordinates","latitude":{lat},"longitude":{lng}},
     "image":"{hero image URL}",
     "url":"https://thenomadhq.com/cities/<slug>" }
   ```
   The page already stores the weather lat/lng and country — reuse them.
3. **`FAQPage`** — once a FAQ section exists (section 5), generated from its `<h3>`/`<p>` pairs,
   exactly like the blog (the same extraction logic in
   [`scripts/apply_blog_seo.cjs`](scripts/apply_blog_seo.cjs) can be reused).

**Do NOT fabricate `aggregateRating` or `Review` schema.** The "Nomad Score" is our own
editorial metric, not aggregated user reviews, and the "What Do Nomads Say?" testimonials are
illustrative. Marking them as `Review`/`aggregateRating` is review-spam and risks a manual
action. Only use `Review` schema if the reviews are real, attributable, and on-page.

Validate with Google's Rich Results Test after adding.

---

## 3. Headings & content structure

- **Exactly one `<h1>`** = the city name (or "{City} Digital Nomad Guide"). Never a second H1.
- **8–12 H2s**, each a full keyword-bearing phrase that includes the city or a category term.
  Keep the existing real sections, but make the headings carry the keyword:
  - Good: `Best Neighborhoods in {City} for Remote Workers`, `Cost of Living in {City}`
  - Weak: `Category Breakdown`, `What Do Nomads Say?` → add the anchor:
    `What Digital Nomads Say About {City}`
- Every `<h2>`/`<h3>` (including FAQ) must contain the city name or a secondary keyword
  (cost of living, WiFi, coworking, visa, safety, neighborhoods). See
  [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §5.0.5.
- **Length:** city guides should be 1,500–3,000+ words of genuine, city-specific prose. The
  category descriptions, neighborhoods, and "where to stay/work/eat" are where uniqueness lives.

---

## 4. Uniqueness — the templated-page risk (read this)

410 city pages built from one template is exactly the pattern Google flags as
mass-produced/thin if the only thing that changes is the city name. Each page MUST be
genuinely distinct:

- **City-specific prose, not Mad-Libs.** "{City} has great coffee and fast WiFi" repeated 410
  times is thin. Name real neighborhoods, real coworking spaces, real dishes, real prices, real
  visa specifics for that city.
- **A unique hero image per city** (a recognisable landmark or street scene — see section 6).
  Never reuse one hero across cities.
- **Unique title + meta description** per city (not a pure string template).
- **Real category descriptions** (the 10–13 scores) written for that city, not generic filler.
- If a city genuinely has little to say, it is better **`noindex`** than a thin near-duplicate
  (a thin page can drag down the whole `/cities/` cluster's quality signal).

---

## 5. FAQ section (add one)

End each city page with `<h2 id="faq">Frequently Asked Questions About {City}</h2>` and 6–8
H3 question/answer pairs, **40–60 words each, derived from the page's own data** (cost, WiFi,
safety, best areas, visa, best time to visit). Every H3 must contain the city name. This is the
same format and the same `FAQPage` generation as the blog ([`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §6).
Harvest the real questions from Google's "People also ask" for "{City} digital nomad".

---

## 6. Internal linking (fix the JS-only links)

Googlebot follows `<a href>` in the **static** HTML. Today the related-city and accommodation
links are built by JS, so they don't exist for the crawler. Every city page must contain, in
the static HTML, **at least 5–8 real internal links**:

- **Up to the hub:** the breadcrumb link to [`/cities`](/cities) and [`/`](/).
- **Sideways to 3–6 related cities** (`/cities/<other>`) — same region, similar budget, or the
  "vs" pairing. Render these as static `<a>` (or pre-render the "You Might Also Like" block),
  not runtime JS.
- **Down to that city's accommodations** (`/accommodations/<city>-*`) if they exist.
- **Across to relevant blog guides:** link the matching city blog post when one exists
  (e.g. `/cities/lisbon` ↔ [`/blog/digital-nomad-guide-lisbon`](/blog/digital-nomad-guide-lisbon),
  `/cities/bangkok` ↔ `/blog/bangkok-budget-guide`), plus a money/decision guide
  (`/blog/digital-nomad-tax-guide`) and a tool (`/wheel`).
- Descriptive anchors only, root-absolute form (`/cities/<slug>`), and every target must resolve.

This turns the 410 city pages into a real internal link graph instead of sitemap-only islands.

---

## 7. Images

WebP or optimised remote stock, **unique per city**, topical (landmark > city > country), with
descriptive alt text containing the city name. Hero ~1200px wide, `fetchPriority="high"`,
explicitly sized; below-the-fold images `loading="lazy"`. Never reuse a hero across cities (a
reused hero is a templated-page signal). See [`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §10
and [`IMAGE_VERIFICATION_CHECKLIST.md`](IMAGE_VERIFICATION_CHECKLIST.md).

---

## 8. Voice & house style

Same as the blog: prose-first, concrete specifics over generalities, **zero em-dashes / spaced
en-dashes**, no AI-cliché phrases, vary sentence length. See
[`BLOG_STYLE_GUIDE.md`](BLOG_STYLE_GUIDE.md) §4. The city tagline in the hero must follow the
em-dash ban (the current `CITY_PAGE_GUIDE.md` example tagline uses one — do not copy it
verbatim; use a comma or colon).

---

## 9. Per-page checklist

- [ ] Clean URL resolves (200); canonical = `og:url` = `https://thenomadhq.com/cities/<slug>`.
- [ ] `<title>` ≤ 60, no em-dash; meta description 140–155, city + keyword + hook.
- [ ] `robots: max-image-preview:large`; Twitter card present.
- [ ] JSON-LD: **`BreadcrumbList` + `City`** (+ `FAQPage` if a FAQ exists), validates in Rich Results Test.
- [ ] Exactly one `<h1>`; 8–12 keyword-bearing H2s.
- [ ] FAQ section, 6–8 city-keyword H3s, 40–60-word answers.
- [ ] **5–8 static internal links** (related cities, accommodations, matching blog guide, tool) — all resolve.
- [ ] Unique hero image + genuinely city-specific content (not a near-duplicate of other cities).
- [ ] City present in [`sitemap.xml`](sitemap.xml) and linked from the [`/cities`](/cities) hub.
- [ ] No em-dashes anywhere; mobile parity.

# Blog Style Guide & Workflow — The Nomad HQ

This document is the source of truth for writing, editing, and shipping blog
articles on **thenomadhq.com**. Read it before creating any new article or
making non-trivial changes to an existing one.

It is adapted from a proven style guide used on a sister site whose blog ranks
on Google. The **principles are fixed; the implementation is mapped onto our
stack**, which is different:

- **Stack:** plain static HTML (no React/Vite/Next). One self-contained
  `.html` file per article in [`blog/`](blog/). No build step, no CMS.
- **Hosting:** Vercel, `cleanUrls: true` (see [`vercel.json`](vercel.json)),
  primary domain `thenomadhq.com` (non-www). A blog URL is
  `https://thenomadhq.com/blog/<slug>` (no `.html`).
- **SEO meta + JSON-LD** live inline in each file's `<head>` (there is no
  `useSEO` hook). The author entity is centralised in
  [`scripts/lib/author.cjs`](scripts/lib/author.cjs) and baked into every
  article by [`scripts/apply_blog_seo.cjs`](scripts/apply_blog_seo.cjs).
- **Discovery:** [`sitemap.xml`](sitemap.xml) lists every article (clean URL);
  the blog index is [`blog.html`](blog.html); the audit tool is
  [`scripts/audit_blog.cjs`](scripts/audit_blog.cjs).

The reference article for structure, voice, and density is
[`blog/digital-nomad-tax-guide.html`](blog/digital-nomad-tax-guide.html) — when
in doubt, match its shape.

> **Language:** everything is in **English**. Voice is second person, direct,
> practical. We write for digital nomads and remote workers, not tourists.

---

## 1. File location & required head

- Path: `blog/<slug>.html` — the filename (minus `.html`) **is** the URL slug.
- Each article is a standalone HTML document. Its `<head>` MUST contain, in
  this order:

```html
<title>Primary keyword: promise | The Nomad HQ</title>   <!-- ≤ 60 chars incl. suffix; see 5.1 -->
<meta name="description" content="...">                   <!-- 140–155 chars, keyword + hook -->
<meta name="keywords" content="...">                      <!-- optional, comma-separated -->
<meta name="author" content="Yannick Schroth">            <!-- always; see section 7 -->
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://thenomadhq.com/blog/<slug>">   <!-- self-canonical, clean URL -->
<!-- Open Graph: og:title, og:description, og:type=article, og:url, og:image -->
<!-- Twitter: twitter:card=summary_large_image, twitter:title/description/image -->
<meta property="article:published_time" content="YYYY-MM-DDT10:00:00Z">
<meta property="article:author" content="Yannick Schroth">
<meta property="article:section" content="City Guides">   <!-- or Visas, Remote Work, etc. -->
<!-- JSON-LD: BlogPosting + BreadcrumbList (+ FAQPage if there is a FAQ) -->
```

**Hard invariants** (the audit script enforces these):

- The **canonical, `og:url`, and the URL in the sitemap must be identical** and
  use the clean form (no `.html`). A mismatch is what got the blog de-indexed
  before; never reintroduce it.
- **Publish date never changes.** Use `article:published_time` and JSON-LD
  `datePublished`. On a substantial later edit, set JSON-LD `dateModified` to
  the edit date (a freshness signal) — never backdate it.
- After creating a new article you must (a) add a card linking it from
  [`blog.html`](blog.html), and (b) add its clean URL to
  [`sitemap.xml`](sitemap.xml). Both are required for discovery.

---

## 2. Heading hierarchy (H1–H4)

- **H1 — exactly one per page**, the article title. Never add a second `<h1>`
  anywhere (sidebars, author box, noscript). Double-H1 is an SEO error the
  audit flags.
- **H2 — main sections.** Keyword-rich, written as full phrases or promises,
  not single nouns. Target **8–15 H2s** per article.
  - Good: `Cost of Living in Bangkok: Real Monthly Numbers in THB and USD`
  - Bad: `Costs`
- **H3 — sub-sections within an H2, or individual FAQ questions** (section 6).
  Use only when there is genuine sub-structure.
- **H4 — rare**, only when an H3 itself has multiple distinct sub-points.

Never skip a level (H2 → H4). Order is always H2 → H3 → H4.

### Heading distribution

- **One H2 per 200–400 words.** A 2,500-word article has 8–12 H2 sections.
- **No H2 section under 100 words** — merge it or drop the heading.
- **No H2 section over 800 words** without H3 sub-headings. A wall of text
  reads as AI-generated and loses readers.
- Headings are **full phrases**, never bare nouns. See 5.0.5 for the keyword rule.

---

## 3. Length by article type

| Type | Word count | Notes |
|------|-----------|-------|
| Money / cornerstone (visa, tax, residency, "best cities") | 3000–4000 | Comprehensive |
| Practical city guides (cost, coworking, neighborhoods) | 2000–3000 | Specific names, prices, areas |
| Lifestyle / remote-work how-to | 2000–3000 | First-hand observations welcome |
| News & updates | 800–1500 | Time-sensitive, shorter is fine |

Reading time = words / 200, rounded. Keep the `X min read` byline honest.

---

## 4. Voice & style

- **English, second person, direct.** "You'll pay around $700/month" beats
  "one can expect to pay".
- **Prose-first.** Bullets only for genuine enumerable lists (checklists, fee
  tables, pure data), never as the structural backbone of a section.
- **Paragraphs of 3–5 sentences.** Avoid single-sentence chunks.
- **Specificity over generality.** Concrete names, addresses, prices, dates.
  "2,500 THB ($70)/month" beats "cheap". "Thonglor" beats "a nice area".
- **First-hand observations, sparingly.** One or two per article: "After three
  months based in Canggu...". Never one per section, never faked.
- **Acknowledge limits.** "Most nomads", "usually", "around" reads more honest
  than absolutes.
- **End sections with insight or a transition,** not an abrupt stop or a summary.
- **No same-pattern repetition across sections.** If every H2 follows the same
  internal shape, the article reads as templated and Google deprioritises it.

### 4.1 First-paragraph hook

The first 100 words decide whether the reader stays. The hook must:

1. **State the problem or question** in concrete terms, not abstract framing.
2. **Hint at the answer / value** — what the reader will know by the end.
3. **Signal credibility** — a specific number, place, year, or first-hand note.

Forbidden in the opening: warm-up phrases ("In this article…", "Let's take a
look…"), definitional openers ("Bangkok is the capital of Thailand…"),
throat-clearing ("Before we dive in…"), and disclaimers (save them for the close).

### 4.2 Sentence variety

AI text has near-uniform sentence length. Vary it.

- Mix short and long. Average 15–25 words, with regular outliers both ways.
- **At least one 5–10 word sentence per H2 section.** Short sentences carry
  emphasis.
- Long sentences (40+ words) only for genuine nuance or enumeration, never filler.
- **No two consecutive sentences with the same opening pattern.** If three
  sentences start "Bangkok has… / Bangkok offers… / Bangkok is…", rewrite.

### 4.2.1 Paragraph length (max 90 words)

- **Max 90 words per paragraph.** If a thought needs more, split it into two.
- Shorter paragraphs read better and scan better (especially on mobile) and raise
  the odds of winning a featured snippet.
- Applies to body prose; lists, tables, and blockquotes do not count as paragraphs.

### 4.3 Pull quotes, callouts, emphasis

- Blockquotes (`<blockquote>`) sparingly: a real quote, a warning the reader
  must not miss, or a highlighted rule. **Max 2–3 per article.**
- **Bold** for key terms on first mention, key prices, key dates. *Italic* for
  foreign-language terms on first mention. Both used sparingly — bolding every
  third word destroys the signal.

### Forbidden phrases (AI clichés)

- "In today's world", "in this day and age"
- "It's important to note", "it's worth noting"
- "Let's dive in", "let's take a look"
- "When it comes to…", "at the end of the day"
- "Look no further", "the world is your oyster"
- "Nestled in", "a hidden gem", "a melting pot"
- "Whether you're a… or a…, there's something for everyone"
- "Ultimately", "in conclusion" as section bookends
- Any filler without substance.

### Forbidden patterns (deeper AI tells)

- **Em-dashes (`—`) and spaced en-dashes (` – `) as connectors. House-style
  ban (target 0 per article).** They are the single strongest AI tell. Use a
  **comma, colon, parentheses, or restructure the sentence** instead. The only
  allowed long-dash use is the **unspaced range dash in numbers/dates**:
  `800–1,500`, `17–45`, `2024–2026`. The audit flags any spaced or sentence-level
  em/en-dash.
- **Triadic adjective lists.** "Fast, simple, and secure." "Cheap, sunny, and
  safe." The second-strongest AI tell after dashes. Max 1–2 per article.
- **Hedging without commitment.** "It may be the case that…", "in many cases".
  Either commit or specify the condition.
- **Bullet points dissolved into prose.** "Firstly… Secondly… Thirdly…" as
  paragraph structure. Either make a real list or write real prose.
- **Section-summary bookends.** Don't end a section with "As you can see, X has
  many advantages." End with insight or a transition.

### 4.4 Search intent matching

Every article answers one intent. Match the structure to it:

- **Informational** ("How does the Portugal digital nomad visa work?") — hook +
  concrete answer in the first 100 words, then depth, then FAQ. Soft CTA.
- **Commercial investigation** ("Medellín vs Chiang Mai for nomads") —
  comparison structure, table early, a clear verdict, supporting detail.
  Medium CTA.
- **Transactional** ("Apply for the Portugal D8 visa step by step") —
  numbered steps, document checklists, costs, timelines, edge cases. Strong CTA.

If an article tries to serve multiple intents, split it.

### 4.5 No repetition patterns (boilerplate & stuffing)

Formulaic repetition is the strongest "this page is templated / AI-generated" tell
and a direct Helpful-Content risk. Two kinds are banned. Check tool:
`node scripts/check_repetition.cjs` (run before publishing; a new article must not
introduce either problem).

**A) Cross-article boilerplate.** No sentence (from ~40 chars) may appear verbatim in
**3 or more articles**. The usual offenders:

- **CTAs:** not the same "Compare cities with our Nomad Wheel" line in 12 articles.
  Write each CTA fresh, tied to that article's topic.
- **Internal-link sentences:** not a template like "We cover X in a separate guide."
  Build the link into a topic-specific sentence, not a recurring block.
- **Disclaimers / date stamps:** keep the YMYL disclaimer as the single standard block
  (7.6.1), not restated as varied prose in every article.
- **Fact blocks:** the same "furnished adds 20 to 30 percent" line should not appear
  word-for-word in eight city guides. Rephrase per article or drop it.

**B) In-article stuffing.** No exact multi-word phrase (3+ words) over **1.5% density**
in one article (e.g. "digital nomad Bangkok" 40 times in a 2,500-word piece). This is
the upper bound to 5.5 (keyword density 0.5 to 1.5%). Keep the keyword-in-every-heading
rule (5.0.5), but in body prose use **pronouns, synonyms, and reworded sentences**
("the city", "here", "the neighborhood") so the exact phrase does not dominate.

**C) Vary intros and conclusions.** No shared opener or closing block across 3+ articles.
Every article needs its own hook (4.1).

---

## 5. Keywords & SEO

- One **main keyword** + 2–3 related keywords per article.
- Main keyword must appear in: the `title`, the **first H2**, and the **first
  paragraph** (within the first 100 words).
- Related keywords distributed naturally across H2s and body. No stuffing.
- `excerpt`/meta description includes the main keyword and ends on a hook.

### 5.0.5 Keyword presence in every heading (H2, H3, and FAQ H3)

**Every H2 and H3 — including every FAQ question — must contain the main
keyword OR a secondary keyword (or a natural variation).** Hard rule.

Counts as a variation: a direct mention; a stem variation (`nomad` ↔
`nomadic`); a topical synonym tied to the entity (`residence permit` for visa,
`flat`/`apartment` for housing, `the capital`/`Lisbon` for the geo anchor); a
compound that includes the keyword; or a secondary keyword from the article's set.

Does **not** count: generic abstractions ("The Two Options", "The Reality",
"Final Thoughts" alone), or process labels ("Step 1", "Overview", "Verdict")
used bare — append the topical anchor, e.g. `Final Verdict: Is Bangkok Worth It
for Nomads?`.

FAQ H3s get no exception and no inheritance from the section title:

- Bad: `How much does it cost?` → Good: `How much does it cost to live in Bangkok?`
- Bad: `Is it safe?` → Good: `Is Cape Town safe for digital nomads?`
- Bad: `Do I need a visa?` → Good: `Do digital nomads need a visa for Georgia?`

### 5.1 Title formulas

Use one of these. Avoid generic "[Topic] in [City]".

- `[Topic]: [specific value/promise] [year]` — "Cost of Living in Lisbon 2026: Real Monthly Numbers"
- `What [audience] need to know about [topic]` — "What Remote Workers Need to Know About the Spain Digital Nomad Visa"
- `[Number] [type] [topic]` — "10 Mistakes First-Time Nomads Make in Bangkok"
- `[A] vs [B] for [audience]` — "Medellín vs Chiang Mai: Which Is Better for Nomads?"
- `How to [verb] [topic] in [place]` — "How to Open a Bank Account in Portugal as a Nomad"

Requirements:

- **50–60 characters** in the rendered `<title>`. Longer gets truncated in SERPs.
- **Main keyword in the first ~35 characters** (mobile truncation).
- **Specific over generic.** Include the **year** only for things that change
  yearly (costs, visa rules, fees); omit it for evergreen topics. If you include
  a year, update title + body each year it stays live.
- The ` | The Nomad HQ` suffix is part of the rendered `<title>`. Keep the
  human-written part short enough that the total stays ≤ 60 where possible.

### 5.2 URL slug rules

- **kebab-case only**, lowercase + hyphens. Includes the main keyword.
- **≤ 60 characters**, no stopwords (`the`, `a`, `to`, `for`, `in`) unless part
  of the keyword phrase.
- **Slug never changes after publication.** To rename, keep the old slug as a
  301 redirect in [`vercel.json`](vercel.json) (`redirects`), and never link the
  old slug internally.

### 5.3 Featured snippet & "People Also Ask"

- **How/What/When/Why articles:** answer the title question in **40–60 words** in
  the first paragraph (or right after the first H2). Google lifts it as the snippet.
- **Step-by-step articles:** use a numbered list early; Google extracts it as a
  rich result.
- **Comparison articles:** put a comparison table in the first third.
- **Definition articles:** open with a clean one-sentence definition.
- **Use the FAQ section to capture PAA queries** — harvest real questions from
  Google's "People also ask" box and answer each in 40–60 words.

### 5.4 Meta description (the `<meta name="description">`)

- **140–155 characters.** Beyond ~155 Google clips mid-word.
- Includes the main keyword naturally; ends on a hook (value, question, promise).
- Active voice, present tense. "What every nomad should know" beats "In this
  article we explain…".

### 5.5 Main-keyword density

The exact lexical form you want to rank for (e.g. `digital nomad visa`,
`coworking`, `cost of living`) must appear often enough that audit tools read the
page as being about it.

- **Target 0.5–1.5 %** of body words. A 2,500-word article needs ~12–38 mentions.
  Below ~0.4 % the page reads as topically diluted.
- Count the **exact compound** ("digital nomad visa"), not loose variations
  ("the visa", "it") — auditors match the lexeme.
- Mention it in the first paragraph, every relevant H2/FAQ H3, and roughly every
  ~150 words of prose where it's natural. Never stuff (no three in two sentences).
- Audit before publish with `node scripts/audit_blog.cjs`.

---

## 6. FAQ section

Every article with natural Q&A should end with `## Frequently Asked Questions`
(rendered as an `<h2>`). The audit checks for it, and the JSON-LD `FAQPage` is
generated from it.

**Required markup (so it maps cleanly to schema):**

```html
<h2 id="faq">Frequently Asked Questions</h2>

<h3>How much does it cost to live in Bangkok per month?</h3>
<p>A comfortable nomad budget runs $1,000–$1,500/month: roughly $400–600 for a
condo, $300 for food, and the rest for coworking and transport. You can go lower
in the suburbs or higher in Thonglor.</p>

<h3>Is the internet fast enough for video calls in Bangkok?</h3>
<p>Yes. Fiber in most condos delivers 300–1,000 Mbps, and coworking spaces are
reliable. Carry a local SIM (AIS or True) with a data plan as backup.</p>
```

- **H3 per question** (question text including the `?`).
- Answer follows directly as one or more `<p>`.
- **6–12 real questions** someone would actually search. Answers **40–60 words**.
- **Every FAQ H3 must contain the main or a secondary keyword** (section 5.0.5),
  no exceptions.
- Do **not** use inline `<strong>Question?</strong> Answer` — it does not extract
  to schema.

When a FAQ section exists, the article's JSON-LD must include a `FAQPage` block
whose `mainEntity` array mirrors the questions/answers (the apply script can
generate it from the H3/`<p>` pairs under the FAQ `<h2>`).

---

## 7. Author & E-E-A-T

Google evaluates content for **E-E-A-T** (Experience, Expertise,
Authoritativeness, Trustworthiness). For YMYL topics (visas, taxes, banking,
moving abroad), this is the biggest ranking lever besides links. The goal is to
make **Yannick Schroth a recognised entity** as a digital-nomad / relocation expert.

### 7.1 One consistent author — single source of truth

The full `Person` entity lives in
[`scripts/lib/author.cjs`](scripts/lib/author.cjs). Every article uses
**`Yannick Schroth`** — same name spelling, same bio URL, same photo, same
`sameAs` set. **Never** introduce a second author or per-article personas (the
blog previously used 10 invented names; that violated this rule and was
consolidated). To change author identity, edit the constant once and re-run
[`scripts/apply_blog_seo.cjs`](scripts/apply_blog_seo.cjs); all articles update.

Per-article JSON-LD `author` must be the full `Person` entity, not just a name:

```json
{
  "@type": "Person",
  "name": "Yannick Schroth",
  "url": "https://thenomadhq.com/about/yannick-schroth",
  "image": "https://thenomadhq.com/assets/yannick-schroth.webp",
  "jobTitle": "Founder, The Nomad HQ",
  "description": "Yannick Schroth is the founder of The Nomad HQ...",
  "knowsAbout": ["Digital nomad visas", "Remote work", "Cost of living abroad", "Coworking", "Geoarbitrage"],
  "knowsLanguage": ["English", "German"],
  "nationality": "German",
  "sameAs": ["<LinkedIn>", "<Instagram>", "<X>"]
}
```

Rules: `url` always points to the **bio page** (`/about/yannick-schroth`), not
the homepage. `image` is the **same author photo** everywhere. `sameAs` is the
**same set** on every article. `knowsAbout` uses specific, mappable topics.

### 7.2 Author bio page (required infrastructure)

A dedicated page at `/about/yannick-schroth`
([`about/yannick-schroth.html`](about/yannick-schroth.html)) with:

- **`ProfilePage` schema** wrapping the same `Person` JSON-LD.
- **First-person bio** (300–500 words): years working remotely, background, why
  and how you started, what expertise applies to readers, who you've helped.
- **The same author photo** used in article author boxes.
- **Contact / social links** (LinkedIn, Instagram, X, email).
- **A list of recent articles** (real internal links).

Internal-link this page from: the footer, every article's byline + author box,
and the homepage About section.

### 7.3 Visible author box on every article

Every article shows one (and only one) author box near the end: the author
photo, name **linked to the bio page**, a one-line credential, and a "More about
Yannick" link. It is generated from the author constant by the apply script so
identity stays consistent. Before adding any author UI by hand, check there is
exactly one author box (no duplicate).

### 7.4 Real-world signals (your homework — cannot be coded)

A real LinkedIn (`/in/...`), Instagram, and X presence with nomad content;
guest posts and podcast appearances linking back to the bio page; genuine press
mentions. Every real profile goes into the `sameAs` array and strengthens the
entity. **Do not fabricate profiles or facts** — an empty `sameAs` is better
than a fake one.

### 7.5 Identity consistency

Name everywhere: `Yannick Schroth`. Bio URL everywhere:
`https://thenomadhq.com/about/yannick-schroth`. Photo URL everywhere:
`https://thenomadhq.com/assets/yannick-schroth.webp`. Any inconsistency breaks
the entity.

---

## 7.6 Trust & YMYL rules

Visas, taxes, banking, and relocation are YMYL ("Your Money / Your Life")
topics held to a higher bar.

### 7.6.1 Disclaimer requirement

Any article giving **visa, tax, legal, or financial** guidance ends with a clear
in-body disclaimer (not just a footer line):

```html
<blockquote>
  <strong>Disclaimer:</strong> This article is general information, not
  individual legal, tax, or immigration advice. Rules and rates change, and they
  vary by nationality and circumstances. Verify your situation with a qualified
  professional and the official sources before making decisions.
</blockquote>
```

- Visa / residency / tax / banking articles: **required**.
- City cost-of-living guides that quote tax or visa rules: **required** for that part.
- Pure lifestyle / culture / productivity articles: optional.

For safety/travel content, use a milder version pointing to the relevant
government travel-advisory page.

### 7.6.2 Citations

Attribute any statistic, rate, fee, or legal reference to a **primary source**:
official immigration / tax authorities, government statistics offices, central
banks, Numbeo only for rough cost ranges (label it as such). Inline:
`Portugal's minimum income threshold for the D8 is €3,480/month (SEF/AIMA, 2026)`.
No citations of competing blogs or affiliate sources. Don't cite personal
observations or widely-known facts.

### 7.6.3 Fact-checking

Before publishing or updating a YMYL article, re-verify every visa rule, tax
rate, fee, and threshold against the official source (it ages fast). If a claim
can't be verified quickly, remove it or hedge it explicitly ("as of 2026").

---

## 7.7 CTA placement

Every article has **at least two CTAs**, different wording and position. We are
not a consultancy, so our CTAs are product/engagement CTAs:

- **Mid-article CTA (~60% scroll):** a styled callout matching the topic, e.g.
  "Comparing cities? Use our [Nomad City Finder](/wheel) to match a destination
  to your budget and priorities."
- **Closing CTA:** stronger, topic-specific, e.g. browse the full
  [city guides](/cities), find [nomad-ready rentals](/rentals), or read a related
  guide.

Rules: different copy in each; match the article's intent (informational = soft,
transactional = strong); **max 2 CTAs**; lifestyle articles can use a soft
internal-link CTA that doubles as a related-reading link.

---

## 8. Internal links

Every article includes **3–5 internal links** to related content.

- **Format:** `<a href="/blog/<slug>">descriptive anchor</a>` (clean URL, no
  `.html`). Also link relevant city pages (`/cities/<slug>`) and tools
  (`/wheel`, `/rentals`, `/cities`).
- **Descriptive anchor text**, never "click here" / "read more".
- **Links must resolve.** The destination must exist and not be a 301'd old
  slug. Verify with the audit script (it checks every `/blog/...` and
  `/cities/...` link against real files).

### 8.1 Funnel mapping

Move the reader toward conversion (tools / contact):

1. **Awareness** — culture, productivity, "rise of coliving".
2. **Interest** — city guides (Bangkok, Lisbon, Bali coworking).
3. **Consideration** — comparisons ("Medellín vs Chiang Mai", "best European
   cities").
4. **Decision** — visa / tax / banking money pages.

Awareness/lifestyle articles link down to at least one Interest/Consideration
piece. Consideration articles link to ≥2 Decision articles. A reader landing on
a culture piece should reach a city guide → a comparison → a visa guide → a tool
in ~3 clicks. Link the matching **city page** (`/cities/<city>`) whenever an
article centers on a city.

---

## 9. External links

**1–2 authoritative external links** per article when relevant (boosts E-E-A-T).

- Must be **authoritative**: government immigration/tax sites, official tourism
  boards, central banks, Wikipedia for neutral background.
- **No affiliate / referral links in the body prose.** (Sidebar affiliate
  widgets are a separate, clearly-marked unit — keep them out of the editorial
  text.)
- **Must return 200.** Verify with `curl -sI "<url>" | head -1` before adding;
  replace any 3xx with the final destination.

---

## 10. Images

### 10.1 Topical fit

Every article needs a featured (hero) image that represents the topic. No
off-topic stock (no generic laptop-on-a-beach on a tax article). Search priority:

1. **Landmark / concrete object** (best): "Bangkok skyline river", "Lisbon tram
   28", "coworking space Bali".
2. **City / district**: "Thonglor street", "Alfama Lisbon".
3. **Country** (fallback only).
4. **Generic "tropical beach / laptop"** — avoid; signals low effort.

Sources (free, commercial use, **no attribution required**): Unsplash, Pexels,
Pixabay. Wikimedia Commons is fine for landmarks **but check the per-file
licence** — CC BY / BY-SA require visible on-site attribution (see 10.1.1).

> Current state: many articles use remote Pexels/Unsplash hero URLs. That is
> acceptable if each is **unique and topical**. Prefer migrating heroes to local
> `/blog/<slug>.webp` over time for speed and control (see 10.1.1). **Never use
> `picsum.photos` or other random-placeholder images** in production — they are
> not topical and read as unfinished.

### 10.1.1 Format, sharpness & licensing

- **WebP** for locally-hosted images. **Sharpness beats the size cap** — never
  ship a blurry hero. Targets (defaults, not hard limits): hero ≤ 200 KB, inline
  ≤ 150 KB. **Downscale first, then encode**: resize to real display width (hero
  ~1200 px, inline ~800 px), encode at quality ≈ 80. Never upscale a small source.
- **Licensing:** prefer no-attribution sources. If a CC licence requires credit
  (CC BY / BY-SA), attribution is **mandatory and must be visible on the live
  site** (a `/credits` page linked in the footer, and/or a caption). Record each
  in `IMAGE_CREDITS.md`. If a licence is unclear, don't use the image.

### 10.2 Uniqueness — one image, one article

Each hero image is used by **exactly one article**. Reusing heroes across
articles makes the blog look mass-produced and lowers perceived quality.

### 10.2.1 Image density

`ceil(words / 1500)` images per article: 1 hero up to 1500 words, +1 inline per
additional 1500 words. Inline images go **between H2 sections**, illustrate
something concrete in the nearby section, and follow all rules above.

### 10.3 Alt text

- **Every image needs alt text.** Empty `alt=""` is never acceptable for content
  images.
- Alt describes what the image shows **and** contains an article keyword
  naturally. "Coworking space in Canggu, Bali with nomads at shared desks", not
  "office".

---

## 11. Pre-publish checklist (run the audit)

```bash
node scripts/audit_blog.cjs            # all articles
node scripts/audit_blog.cjs <slug>     # one article
```

Per article, confirm:

- [ ] Exactly **one `<h1>`**; **8–15 H2s**, each keyword-bearing (5.0.5).
- [ ] `<title>` ≤ 60 chars; meta description 140–155; both keyword-bearing.
- [ ] `canonical` = `og:url` = the sitemap URL = `https://thenomadhq.com/blog/<slug>`.
- [ ] JSON-LD: **BlogPosting + BreadcrumbList** (+ **FAQPage** if there's a FAQ),
      author = the full Yannick `Person` entity. Validate in Rich Results Test.
- [ ] **Frequently Asked Questions** section, 6–12 keyword-bearing H3s, 40–60-word answers.
- [ ] **3–5 internal links** (descriptive anchors, all resolving) + 1–2 authority
      external links.
- [ ] **0 em-dashes / spaced en-dashes**; ≤ 2 triadic lists; no forbidden phrases.
- [ ] Word count matches the type (section 3); main-keyword density 0.5–1.5 %.
- [ ] **No paragraph over 90 words** (4.2.1).
- [ ] **`node scripts/check_repetition.cjs` passes** — no cross-article boilerplate,
      no in-article stuffing (4.5).
- [ ] Hero image unique + topical + has alt text; `ceil(words/1500)` images total.
- [ ] YMYL disclaimer present if the article gives visa/tax/financial guidance.
- [ ] Article is **linked from [`blog.html`](blog.html)** and present in
      [`sitemap.xml`](sitemap.xml).
- [ ] One author box only; byline + box use Yannick, linked to the bio page.
- [ ] **`ARTICLE_LOG.md` updated** with the create/edit and why (section 13).

## 12. Deploy

Static site, no build. Commit and push to `master`; Vercel auto-deploys (see
[`nomadhq-stack-deploy`] notes). After deploy, spot-check the live clean URL
returns 200 and the JSON-LD validates in Google's Rich Results Test. Re-submit
`sitemap.xml` in Search Console and request indexing for new cornerstone articles.

---

## 13. Maintenance & performance review

### 13.1 Article log

[`ARTICLE_LOG.md`](ARTICLE_LOG.md) is the source of truth for what has been done to
which article. **Update it after every blog change** (create, edit, delete):

- Before starting article work, **read `ARTICLE_LOG.md`** to see the current status
  and what has already been done, so sessions don't redo work or start blind.
- After committing, add a change-history entry: date, slug, what changed, why.
- A change that touches many articles at once (e.g. a schema sweep via
  `apply_blog_seo.cjs`) is logged once at the sweep level with the slugs it affected.

### 13.2 Monthly performance review (Google Search Console)

We have GSC access (`sc-domain:thenomadhq.com`). Once a month, review the Performance
report and act on the highest-impact items, then log them in `ARTICLE_LOG.md`:

1. **Low-CTR pages in the top 20** (impressions but few clicks): rewrite the `<title>`
   and meta description to match the intent of the queries the page actually ranks for
   (read them from the query report). This is the fastest CTR lever.
2. **Pages in positions 8 to 20** for real-volume queries: closest to page 1. Expand the
   section that matches the query, add internal links pointing to the page, tighten the
   on-page match. Confirm the query genuinely fits the page first.
3. **Zero-impression pages**: candidates for a rewrite, a stronger internal-link path, or
   merging into a better article. First check they are actually indexed (URL inspection):
   an unindexed page is a discovery problem, not a content one.

Note: queries Google reports as anonymized won't show in the query breakdown; use the
page-level data for those.

### 13.3 Freshness

Bump JSON-LD `dateModified` (never `datePublished`) only on a **substantive** edit:
rewrote a section, updated prices/visa rules, added FAQ entries. Not for typos, a single
new link, or "bumping for SEO", Google devalues zero-delta updates. Re-verify every
numerical/visa/tax claim when you touch a YMYL article; those age fast.

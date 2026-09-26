# Blog article brief (shared by every writer agent)

You are writing ONE article for thenomadhq.com, a site for digital nomads and expats. Repo root:
`C:\Users\yasch\Coding Projects\Website Projects\nomadcompass`. Its position against Nomad List is
credibility and depth: every figure has a source, nothing is invented. Research in depth first,
write second. A thin or generic article is a failure even if it passes the scripts.

## Read before you research
1. `BLOG_STYLE_GUIDE.md` in full. It is the source of truth EXCEPT for the overrides below.
2. `ARTICLE_LOG.md` (what exists, what worked).
3. Two model posts, for markup and voice: `blog/busan-digital-nomad-guide.html` and
   `blog/las-palmas-digital-nomad-guide.html`. Copy their `<article>` markup conventions exactly
   (TOC anchors, h2 ids, callout/CTA markup, the FAQ section `<h2 id="faq">` and its Q&A markup).
4. The city page for your topic (`cities/<id>.html`) and, for service topics, the directory pages
   you were given (`services/...html`), so you know what our site already says.

## Overrides of the style guide (these win)
- NO disclaimer blockquote, no "this is not legal/tax advice", no "consult a professional" hedging.
  Legal cover lives on /terms. Instead, state each rule with its source and the date it applies.
  Saying when a lawyer is REQUIRED by law (e.g. a notary deed) is information and is fine.
- NO first-person experience claims. The author (Yannick Schroth) did not visit for this piece.
  No invented anecdotes, quotes, testimonials, "locals told me", ratings or reviews.
- NO em-dashes and no en-dashes used as dashes anywhere (use commas, colons, full stops).
- Every price in USD. You may add the local currency in parentheses; state the rate date once.
- NO affiliate or referral links in the body.
- NO empty phrases: every sentence must carry information a reader could act on or check. A
  sentence that could be deleted without loss must be deleted. Avoid the forbidden phrases list.
- Never recommend, rank or name "the best" individual lawyer, doctor, clinic or firm. For
  providers, link our directory page, which lists them with sources. Naming public institutions
  (a bar association, a ministry, a public hospital, a registry) is fine.

## Research standard
- Consult at least 15 distinct sources. Primary sources first: government sites, official
  registers, bar/medical associations, statistics offices, central banks, official tariffs.
- A number, fee, threshold or legal rule goes in only if a primary source states it, or two
  independent secondary sources agree. Otherwise leave it out. Date-sensitive items say "as of
  <month year>".
- Use WebSearch and WebFetch. Record every claim in `sources.md`:
  `claim | URL | date accessed | the exact quote or figure`.
- Our own ratings/costs come from the city page; call them "our ratings". If a primary source
  contradicts our city page or `nomad-visas.html`, do NOT silently contradict it: use the
  primary figure only if you are sure, and write the discrepancy in NOTES.md for the editor.

## Links (set by hand, each one chosen for this article)
- Internal: 4 to 8 links, clean URLs (no .html), each target MUST exist as a file (check with ls).
  Link the city page(s), the relevant `/services/...` directory pages, `/nomad-visas` where visas
  come up, and 1 to 2 genuinely related blog posts. Anchor text says what the target holds.
- External: 2 to 6 authoritative primary sources as inline citations. Verify each returns 200
  (`curl -sIL -o /dev/null -w "%{http_code}" <url>`); use the final URL after redirects.

## Length and shape
- Style guide section 3: practical city guides 2000 to 3000 words; money/legal/visa/tax and
  "best cities" pieces 3000 to 4000 words. Paragraphs at most 90 words.
- Lead with the fact that decides the question (see ARTICLE_LOG: Bodrum leads with 11 Mbps).
- FAQ: 6 to 8 real questions people search, answered from the article's own researched content.
- Exactly two CTAs (mid-article and closing), different wording, pointing to our pages.

## Deliverables (write ONLY inside your own output folder; do not edit repo files, do not commit)
- `body.html`: the inner HTML of `<article>`, in the model posts' markup.
- `spec.json`, per the header of `scripts/new_blog_post.cjs`: slug, title (<= 60 chars),
  description (140 to 155 chars), ogDescription, section (one of "City Guides", "Remote Work",
  "Visa & Legal", "Lifestyle"), tags, "published": "2026-09-26", readMinutes (words/200), city
  (a cityId whose `cities/<id>.html` and `images/cities/<id>.webp` exist), toc, and bodyFile as an
  ABSOLUTE path to your body.html.
- `sources.md` and `NOTES.md` (discrepancies, things you could not verify, image reuse).
- Validate with `node scripts/new_blog_post.cjs <abs path to spec.json>` WITHOUT `--apply`, run
  from the repo root. Fix until it passes. Never pass `--apply`.
- Check whether `/images/cities/<city>.webp` is already another post's hero (grep blog/); note it.

## Your final message
slug, title, word count, number of sources consulted, the internal links used, the external
links used, and a short NOTES summary (discrepancies above all).

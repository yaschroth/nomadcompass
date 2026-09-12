# The Nomad HQ — TODO / Backlog

Deferred work and decisions, so nothing gets lost. Newest/most important first.

---

## 0. IN PROGRESS: the 1,155-word floor across all 649 loop-reachable cities

The floor job was declared done at 350 of 350 (below), but the site has 1,000 city pages and the
migration brought the loop-reachable corpus to 649. Measured page-aware (JSON sections plus the
`<li>` and `<h3>` the page carries and the data file does not), **507 of 649 clear the floor as of
2026-09-12, from 429 when the page-aware fix landed.** 142 to go. Live count:
`node scripts/guide_worklist.cjs --count`.

Shape that works for a city in the low 700s: about 145 words into prosCons and about 80 into each
of the other six. Read the page bullets first, because the thin cities keep their real Pros and Cons
in `<ul>` items the JSON does not hold, and a prosCons that lists pros and cons just restates what
the reader has read; write it to weigh the trade instead.

**Two structural blockers to decide on:**

- **42 migrated cities store six sections, not seven.** Their Pros and Cons on the page is two `<ul>`
  lists with no `<p>` run, so `apply_city_guide_sections` cannot reach it and `guide-content.json`
  has no `prosCons` key at all. Naha and Aswan are examples. Those cities can still clear the floor
  by taking the words in the other six sections, but they will never have a written prosCons unless
  the applier learns to insert a paragraph before a list. That is a code change with sitewide
  blast radius and it has not been made.
- **351 HTML-only pages remain unreachable** by the loop (see the migration notes in the memory
  file), and 9 pages match no known heading generation.

## 0c. DONE 2026-09-12: South African load shedding ended and 9 guides had not noticed

Eskom imposed its **last load shedding on 16 May 2025**. None since: 441 consecutive days by
August 2026, and the whole 2026 winter carried without a stage. Verified against Eskom and
government releases, not a travel blog.

Nine South African pages still told readers to buy an inverter, install EskomSePush and plan the
working week around a published schedule. All corrected, city by city rather than by sweeping one
sentence into nine pages: Stellenbosch, Gqeberha, Nelspruit, Oudtshoorn, Durban, Cape Town,
Johannesburg, Knysna, Hermanus, plus Mbabane, which imports its power from Eskom and inherited
the claim across the border.

Each says the cuts **stopped**, and says the grid was **repaired rather than rebuilt**, so the risk
receded rather than vanished. That second half matters: the hardware is still in the buildings and
a bad run of breakdowns would bring the cuts back. A reader arriving with the old picture needs to
be told it changed, not to find the subject quietly missing.

**Deliberately not touched:**
- **Swakopmund (Namibia)** says load-shedding happens there. Namibia has its own grid and imports
  only part of its supply; the Namibian position was not verified, so the claim was left alone
  rather than corrected on the assumption that it tracks South Africa. Verify before editing.
- The 14 non-SA pages using the term (Malawi, Zambia, Uganda, Bangladesh, Pakistan, Mozambique,
  Zimbabwe) are describing their own countries and remain accurate.

**Loose end:** South Africa's remote-work visa floor is a **fixed rand amount** set in the October
2024 regulations, about **USD 39,000/year** (R650,976), and it is now stated on Stellenbosch and
Johannesburg, which agree. South Africa is *not* in the COUNTRIES table in
`scripts/apply_visa_thresholds.cjs`, so nothing keeps future pages in line. Add it, with the note that it is flat rather than wage-pegged
so only a regulation change moves it. Same gap for **South Korea**, whose F-1-D test is 2x GNI per
capita, halved to 1x for applicants aged 18-34 outside Seoul/Incheon/Gyeonggi.

## 0a. OPEN: the EU Entry/Exit System changes what 192 Schengen guides should say

The EES became **fully operational across the Schengen area on 10 April 2026**, after a phased
rollout that started 12 October 2025. It records a facial image and fingerprints at every external
crossing, **replaces the passport stamp** for non-EU short-stay travellers, and **counts the
90-in-180 allowance automatically across all member states**. ETIAS is a separate scheme expected
later in 2026. Verified against the Commission's own notice, not a travel blog.

**Scope measured 2026-09-12:** 218 sections across 192 cities in `guide-content.json` mention
Schengen; 330 HTML pages do. Only three were made *wrong* by the change and all three are fixed:

- `corfu.visas` told readers to "track every entry stamp", which is now impossible (it was written
  in this same session, which is the lesson: a current fact can go stale between the research and
  the writing).
- `ancona.visas` said the Albania ferry is "checked and stamped much as an airport would".
- `malmo.visas` described the EES in the future tense as something that "will automate" stamping.

**What is still open is not a correction but an improvement.** Most Schengen guides describe the
90/180 rule without saying how it is now enforced, which is no longer the most useful thing a
reader can be told. **Do NOT sweep a boilerplate sentence into 192 sections**: that is exactly the
shape that makes pages read as generated, and the phrasing gate would flag it anyway. Fold the EES
fact in city by city as each Schengen guide is deepened, phrased differently each time and attached
to something local (a ferry that is an external crossing, a land border, an island hop that is not).

---

## 0b. OPEN: 84 sections open with "Be honest with yourself"

`check_guide_openers.cjs` flagged this construction at 59 uses when the opener work was done; it now
stands at **84 sections** across the corpus because it kept getting written. It is the single most
visible template signature left in the guides. Fixing it means individual rewrites, not a rotation
through six replacement frames, for the reason recorded in `guide_reframe.cjs`'s own header. Two
were fixed on 2026-09-11 (sidibousaid, barichara) while those cities were being deepened, which is
the cheap way to pay it down: fix the opener whenever a city is touched for another reason.

---

## 0. RESOLVED 2026-09-11: every JSON-backed city guide clears the 1,155-word floor

The owner asked on 2026-09-05 ("THEY ALL MUST BE DEEP") for all 350 cities whose guide prose lives
in `data/guide-content.json` to reach 1,155 words across the seven sections. Done and published:
**350 of 350**, min 1,155, median 1,184, max 1,380.

**What the last stretch cost, and what it taught.** From ~800 words a city needed roughly 355, and
the shape that lands it is four sections at 90 to 100 words each rather than seven at 50. A short
addition has nowhere to go: `check_guide_overlap.cjs` rejects any proper noun already standing in
that section, so 50 words of genuinely new material is harder to find than 100. Check the
arithmetic BEFORE the gates, because a city landing at 1,153 wastes a whole cycle.

**Where the new facts came from, once the obvious material was spent.** Administrative and seasonal
specifics: how a deposit is held, what a utility bills and on what cycle, which registration has a
deadline, what a local wind or a migration or a harvest does to the year. Those are per-COUNTRY and
per-COAST rather than per-city, which is exactly why `check_guide_phrasing.cjs` kept catching
siblings. Picking a DIFFERENT mechanism for the second city of a country beats rewording the same
one: Xian's winter-heating line was the mirror image of Chengdu's and collided on eight shingles, so
it was swapped for the student population, which is the fact that actually sets prices there.

**STILL OPEN: the 1,295 target.** 118 cities clear it; 232 do not, needing about 27,000 words in
total. Every one of them is now within 140 words of it, so this is a much smaller job than the
floor was. `node scripts/guide_worklist.cjs --count` prints the live split.

---

## 0a. RESOLVED 2026-09-09: the 172 conflicting cost pages, split and fixed

Found 2026-09-08, fixed the next day. Recorded here because the first diagnosis was wrong and the
correction is the useful part.

**What I claimed first:** 172 pages contradict their own cost table, the prose is probably right,
and Goa proves it because Numbeo covers a whole state while nomads live on one coast.

**What the classifier found** (`scripts/classify_cost_conflicts.cjs`), once the test compared RENT
rather than totals:

- **148 are not contradictions at all.** The rents agree and only the totals differ, because the
  table prices a defined one-person basket and the guide range is a judgement about how somebody
  lives. Both right, measuring different things, with nothing on the page saying so. Fixed by a
  direction-neutral reconciling sentence in `apply_city_costs.cjs`, applied to the 177 pages where
  the two figures actually differ by more than 15% and withheld where they agree. Direction-neutral
  matters: the guide runs LOWER than the table on Budapest, Seoul and a dozen more, so a note
  saying "the guide runs higher" would be wrong on a tenth of its pages.
- **8 are real**, and on those the measurement misleads: zanzibar, buenosaires, goa, malang,
  leipzig, ohrid, lima, antwerp. Each now carries a per-city note (`apply_catchment_note.cjs`)
  saying what the figure covers.
- **16 could not be classified** because their pages quote rent only in local currency. They get
  the reconciling sentence, which is true regardless of which class they belong to.

**Goa, corrected.** The page does not contradict itself and the table is not wrong. It quotes
$155-295 inland, which matches Numbeo almost exactly, AND $365-575 for the Anjuna belt. The fault
is that the headline averages a district whose readers will all live in its expensive corner.
Comparing the cheapest rent bullet cleared Goa entirely; comparing the dearest caught it. That is
why the classifier now tests both directions.

**STILL OPEN, and the reason it is open.** The ranking is unchanged on all eight. The measured
figure is correct for the city as Numbeo defines it, and the only substitute available is editorial
rent from the prose plus a measured basket. Prose rent was tested against Numbeo across the 330
sourced cities when the budget range was built: 23% off at the median, 72 of 488 endpoints more
than 50% out. Swapping a number that is right about the wrong area for one that is roughly right
about the right area, silently, on eight cities, is not an improvement I should make alone.
If you want those eight re-ranked, say so and it is an hour's work.

---

## 0b. RESOLVED 2026-09-11: the guide templating, and the census that could not see it

**CORRECTION to what this section claimed on 2026-09-09.** It recorded whoFor as resolved. It was
not. `check_guide_openers.cjs` said in its header that place names were stripped and the code never
stripped them, so any template carrying the city's own name inside its first five words counted as
one unique opener per city and was never reported. 310 of 350 whoFor sections were opening
"<City> suits ..." before that campaign and still were after it. Masking now lives in
`scripts/lib/guide-openers.cjs`, shared with `guide_dump_sections.cjs`.

**The measurement that started it.** `check_guide_openers.cjs` counted 1,981 of 16,207 sentences,
about 12%, opening with one of 62 five-word skeletons used a dozen times or more. The heaviest were
the whoFor verdicts: 187 cities said "It is a poor fit for", another 88 "It does not suit anyone".

**Done 2026-09-09.** 710 sentences rewritten by hand, in batches of 15-34, through
`guide_reframe.cjs`. That cleared the second sentence of the verdict; it never touched the first.

**Done 2026-09-10/11, 635 more sentences, published and pushed.** prosCons: 113 "The case for
<City> is ... The case against is ..." pairs and 210 "Against that ..." pivots. whoFor: all 310
"<City> suits ..." verdicts and 60 "Anyone weighing it against <City> ..." comparisons. Measured
with the fixed census: **whoFor 0.0%** at min 5, **prosCons 1.5%** at min 8, corpus 4.9% at min 12.

The constructions cleared, in the order they fell: "It is a poor fit for" (187), "It does not suit
anyone" (88), "It also suits anyone" (209), "It is a strong choice" (40), "It works well for" (69),
then nine smaller ones totalling 117.

**What the corpus figure means now.** 1,496 of 16,512 at the original threshold, 9.1%. But two
thirds of that is price and visa data: "Budget around $940 a month", "A one bedroom runs roughly
$520 to $700", "There is no digital nomad visa". Those repeat because they are the same measurement
quoted for a different city, and a reader comparing two pages wants them to line up. Varying the
frame would make the numbers harder to read and the prose no better. `check_guide_openers.cjs
--prose` excludes them and reports what is actually a writing habit: **3.8% at min 12**.

**LEFT AFTER 2026-09-11, measured per field with `--prose --min 8`.** Two of seven fields are done.
The other five have never been touched, and the figures below are what the fixed census reports:

| field | templated | the honest reading |
|---|---|---|
| whoFor | 0.0% | done |
| prosCons | 1.5% | done |
| gettingAround | 3.0% | "You do not need a car", "<City> is compact and walkable" — part habit |
| whereToWork | 8.2% | "<City> has a small coworking ..." on 50 cities is the one real habit |
| costOfLiving | 9.1% | mostly price frames; "Market produce is cheap and" on 20 is a habit |
| visas | 13.3% | almost all data: Schengen, 90/180, "no digital nomad visa" |
| bestTime | 14.0% | almost all data: "Winter from December to February ..." |

**Do not rewrite the seasonal and visa frames.** They are the same measurement quoted for a
different city, and a reader comparing two pages wants them to line up. The right fix is to grow
the DATA_TEMPLATE list in `scripts/lib/guide-openers.cjs` to cover the season and Schengen shapes,
so the census stops charging them as habits. That is a small job and it makes every future figure
honest. The genuine habits left are the coworking openers (50 + 19 + 13 + 11 + 10 cities, all
saying the same thing about the same absence) and the walkability openers in gettingAround.

**What the rewriting turned up, which was worth more than the rewriting.** Four sections were
saying the same thing twice: Namur put the Ardennes within reach and then put the Ardennes at the
door, with a third sentence explaining where the Ardennes are; Nitra named Great Moravia twice,
Iquitos the rubber boom twice, Prilep Byzantine history twice. Chasing that led to widening
`check_guide_self_repeat.cjs` from the closing sentence to every pair, which found 26 more (Nassau
explaining Eastern time twice in a row, Dili quoting the same reef survey in consecutive sentences,
Apia describing the same buses twice). All 26 fixed, gate now blocks on both passes.

**Process notes that cost time.**

- The phrasing gate reads six-word shingles, so it cannot see a writer falling into the same CLAUSE
  SHAPE. One batch used a "which is ..." tail nine times in 23 sentences and the gate was clean.
  Reading a batch back before applying is the only thing that catches those.
- `guide_reframe.cjs` enforces the 90-220 band, and cities deepened to near the cap have almost no
  room. Plzen, Coorg, Inverness, Broome and a dozen others had to be written to fit.
- `--allow-shorter` exists for removing a restatement, where the shortening IS the fix. It is not
  for making an ordinary rewrite easier.

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

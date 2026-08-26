# Article Log: The Nomad HQ blog

Source of truth for what has been done to which blog article. **Update after every
blog change** (create, edit, delete). See `BLOG_STYLE_GUIDE.md` section 13.

Status legend: 🔴 needs work · 🟡 partial / follow-ups open · ✅ meets the style guide.

## Status

| Slug | Title | Status | Notes |
|------|-------|--------|-------|
| bangkok-budget-guide | Bangkok on a Budget: The Digital Nomad's Complete Guide | 🟡 | Full BlogPosting+FAQ schema, author entity. |
| best-coworking-spaces-bali | The 10 Best Coworking Spaces in Bali for Remote Workers | 🟡 | |
| best-european-cities-nomads | The Best European Cities for Digital Nomads in 2026 | 🟡 | Year in title, keep current. |
| budapest-nomad-guide | Budapest: Europe's Most Underrated Nomad Destination | 🟡 | |
| cape-town-nomad-guide | Cape Town: Sun, Surf, and Startups for Remote Workers | 🟡 | |
| digital-nomad-guide-lisbon | The Ultimate Digital Nomad Guide to Lisbon in 2026 | 🟡 | Year in title, keep current. |
| digital-nomad-tax-guide | Digital Nomad Tax Guide: What You Need to Know in 2026 | 🟡 | YMYL, needs disclaimer + citations reviewed. Reference article. |
| digital-nomads-tbilisi-georgia | Why Digital Nomads Are Flocking to Tbilisi, Georgia | 🟡 | GSC: ranks pos ~60-82 for "tbilisi digital nomad" (page 6+). |
| dubai-digital-nomad-guide | Dubai for Digital Nomads: Luxury Meets Remote Work | 🟡 | |
| las-palmas-digital-nomad-guide | Las Palmas Digital Nomad Guide: Costs, Visas, Districts | ✅ | Written 2026-08-26 against GSC demand: 171 impressions on "digital nomad guide las palmas" at pos 19-25 with no guide behind it. |
| praia-cape-verde-digital-nomad-guide | Praia Digital Nomad Guide: Cape Verde Costs and Visas | ✅ | 158 impressions across praia/boa vista queries landing on the country page. Honest about community 2/10. |
| dresden-digital-nomad-guide | Dresden Digital Nomad Guide: Rent, Wifi and Visa Routes | ✅ | 87 impressions, top query is "digital nomad accommodation dresden", so the article leads with accommodation. |
| busan-digital-nomad-guide | Busan Digital Nomad Guide: Costs, Wifi and the Visa | ✅ | 173 impressions, pos 8.3, no article behind the city page. Wifi 9 vs English 4 is the trade. |
| bodrum-digital-nomad-guide | Bodrum Digital Nomad Guide: Internet, Costs and Season | ✅ | 148 impressions, pos 7.6. Leads with the 11 Mbps citywide average, which is the deciding fact. |
| fukuoka-digital-nomad-guide | Fukuoka Digital Nomad Guide: Japan's Cheapest Big City | ✅ | 105 impressions, pos 8.1. Only city in our data scoring 10 for safety. |
| gijon-digital-nomad-guide | Gijon Digital Nomad Guide: Costs, Cider and Green Spain | ✅ | 131 impressions, best CTR of any city page. Headings varied to clear the 1.5% stuffing cap. |
| sarajevo-digital-nomad-guide | Sarajevo Digital Nomad Guide: Europe's Cheapest Capital | ✅ | 89 impressions, pos 8.7. Winter air quality (4/10) stated in the lead, not buried. |
| canggu-cost-of-living-guide | Canggu Cost of Living 2026: What Bali Really Costs Now | ✅ | Cost angle, deliberately distinct from best-coworking-spaces-bali. Year in title, keep current. |
| medellin-vs-chiang-mai | Medellín vs Chiang Mai: Which City Wins for Nomads in 2026? | 🟡 | Comparison intent, table early. |
| mexico-city-nomad-guide | Mexico City: The New Nomad Capital of Latin America | 🟡 | |
| portugal-digital-nomad-visa | How to Get a Portugal Digital Nomad Visa (Step by Step) | 🟡 | YMYL transactional; verify D8 thresholds/fees. |
| remote-work-routine-guide | How to Build a Remote Work Routine That Actually Works | 🟡 | Lifestyle, soft CTA. |
| rise-of-coliving-spaces | The Rise of Coliving: Best Spaces for Digital Nomads in 2026 | 🟡 | GSC: ranks for "co living for digital nomad" pos ~30. |
| stay-productive-working-abroad | How to Stay Productive While Working Remotely Abroad | 🟡 | Lifestyle. |

All 15 carry the standard blog schema (BlogPosting + author entity + publisher) and the
sitewide brand graph. None have been through the full style-guide pass (voice audit,
repetition check baseline, per-article image uniqueness), hence 🟡.

## Change history

- **2026-08-26 (second batch)**: Five more city guides from page-level GSC demand: Busan (173
  impressions, pos 8.3), Bodrum (148, 7.6), Gijon (131, best CTR of any city page), Fukuoka (105,
  8.1) and Sarajevo (89, 8.7). All were city pages ranking on page one with no article behind them.
  Each leads with the number that actually decides the city: Bodrum's 11 Mbps citywide average,
  Fukuoka's perfect safety score, Sarajevo's winter air quality of 4/10, Busan's English 4 against
  wifi 9.
  Fixed while writing: our own Spanish city pages carried SEVEN different figures for one national
  visa income floor, from EUR 2,160 to EUR 2,850. The Las Palmas article published earlier that day
  had the stale one. Both it and the new Gijon guide now describe the rule (twice the minimum wage,
  about $3,100 at the 2026 rate) rather than quoting a number that silently ages. THE TEN CITY PAGES
  ARE STILL INCONSISTENT and need a pass.
  check_repetition caught "in Gijon" at 1.99% across 14 headings; varied the heading forms
  (possessive, reordering, Asturias) rather than dropping the anchor, since 5.0.5 requires it.
  apply_blog_index.cjs now prefers the -card.webp variant for blog.html cards instead of serving a
  1920px hero into a 600x400 slot.
  24 articles, 0 FAIL, 0 WARN, repetition clean.

- **2026-08-26**: Four new city guides, chosen from Search Console rather than by guesswork:
  Las Palmas, Praia (Cape Verde), Dresden and Canggu. Each targets queries where a city page
  already ranked with no article behind it. All four written from our own sourced data (category
  scores, the Numbeo-backed cost index, the services directory) and priced in USD only.
  New tooling: `scripts/new_blog_post.cjs` lifts the shell from a donor article so nav, GA4,
  consent and footer cannot drift, and refuses a post that breaks the title, meta, heading or
  em-dash rules; `scripts/apply_blog_index.cjs` adds the blog.html card and the sitemap entry,
  which were manual steps the guide requires but nothing enforced.
  Fixed in passing: `apply_blog_seo.cjs` built JSON-LD with a replacement STRING, so any article
  whose meta description quoted a price ("$1,500 to $2,500") had "$1" read as a capture reference
  and wrote itself a corrupt BlogPosting block. Canggu hit it. Now a function replacement.
  `build_blog_categories.cjs` had been blocked by the write gate; it now lifts the shell via
  page_shell.cjs and the two affiliate blocks from a live page instead of restating them.
  audit_blog.cjs: 19 articles, 0 FAIL, 0 WARN. check_repetition: clean.

- **2026-07-18**: All 15 articles: freshness pass (2025 → 2026, dateModified bumped);
  "Explore the data behind this guide" internal-link block added; brand graph + GA4 +
  consent + nav search applied via sitewide sweeps. Baseline `check_repetition.cjs`:
  **0 boilerplate, 0 stuffing** (clean).
- **2026-07-18**: Established this log + BLOG_STYLE_GUIDE.md sections 4.2.1 (90-word
  paragraphs), 4.5 (anti-repetition + `check_repetition.cjs`), 13 (article log + monthly
  GSC review + freshness).

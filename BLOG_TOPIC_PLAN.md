# Blog Topic Plan: independent subjects

Written 2026-08-10. Concept only, nothing drafted yet.

## The problem this solves

The blog holds 15 articles, all published between 2025-01-15 and 2025-03-15, median
3,467 words. Nine of the fifteen are city guides for cities the site already covers with a
~6,500-word page (Budapest, Tbilisi, Bali, Cape Town, Bangkok, Lisbon, Dubai, Mexico City,
plus a Medellín/Chiang Mai comparison). Only four carry a subject the city pages cannot:
tax, coliving, remote-work routine, productivity.

**Three article shapes are now owned by dedicated sections and should not be repeated in
the blog:** single-city guides belong on `/cities`, "best cities for X" on `/best`, and
head-to-head comparisons on `/vs`. A blog article that takes one of those shapes competes
with our own page for the same query.

## Selection rule

Prefer subjects **derived from our own datasets**. Those are the only articles a competitor
cannot reproduce without the data, they are citable, and they reinforce the one position we
can defend (see the USP note: credibility and crawlable depth, not community). Everything
here is subject to the standing source rule: primary source or triangulation, and a
plausibility check before publishing.

---

## Tier A: derived from our own data

### A1. The passport gap: how much of the world you can actually enter
- **Claim, verified against our data today:** of our 710 cities, a German passport enters
  522 visa-free and must apply in advance for 16. A Nigerian passport enters 7 visa-free
  and must apply for 552. Japan 507, Brazil 432, South Africa 140, India 38.
- **Data basis:** `assets/visa-data.js`, 199 passports x 117 destinations, joined to the
  city list. Already built.
- **Search intent:** informational and comparative. Very long tail ("visa free countries
  for a Nigerian passport", "where can I travel without a visa").
- **Why independent:** a city page answers the visa question for one city and one reader.
  This is the cross-cutting view, and it is a subject with real weight rather than a
  listicle.
- **BLOCKER, must be resolved first:** only 15 of the 117 destinations were verified to the
  current standard. The other 102 predate the source rule and their origin was never
  recorded. Publishing a headline number built on unverified data would be exactly the
  mistake the source rule exists to prevent. Either verify the backlog or scope the article
  to the verified subset and say so.

### A2. The timezone tax: what a remote job costs you in hours
- **Claim, verified:** 161 of our 710 cities give four or more hours of overlap with a
  New York 09:00-17:00 day. 225 give none at all.
- **Data basis:** `assets/city-tz.js` (IANA, primary source, all 710 cities), evaluated
  through the Intl API so daylight saving is handled correctly.
- **Search intent:** high commercial intent, and underserved. People search for where to
  live while keeping a US or EU employer; most results are opinion.
- **Why independent:** no city page frames the decision this way, and it feeds the existing
  `/timezones` tool rather than competing with any section.
- **Status:** ready to write. Strongest candidate.

### A3. What a monthly budget actually buys
- **Data basis:** `data/numbeo-costs.json`, real component prices for 331 cities, converted
  through `assets/fx-usd.json`. Costs were cross-checked recently: 329 of 330 comparable
  cities agree with Numbeo within 40%.
- **Search intent:** commercial, high volume ("digital nomad budget", "cheapest cities to
  live").
- **Caveat to state in the article:** only 331 of 710 cities carry sourced cost data; the
  rest are editorial estimates. Scope the piece to the sourced set.
- **Overlap risk:** moderate. `/best` already ranks cheap cities, so this must be about the
  *shape* of a budget (what changes between $1,000 and $2,500) rather than a ranking.

### A4. The altitude effect
- **Data basis:** `data/city-elevations.json` (Copernicus DEM via Open-Meteo, all 710)
  crossed with the climate normals.
- **Angle:** altitude buys a cooler climate at tropical latitudes, and costs sleep,
  exertion and sometimes air quality. Mexico City, Bogotá, Cusco, Addis Ababa, La Paz.
- **Search intent:** low volume, high distinctiveness. A piece that gets linked rather than
  a piece that ranks.
- **Status:** ready, but lower priority than A2.

### A5. Where the weather is genuinely good all year
- **What the data says today:** only 11 of 710 cities have twelve months with daytime highs
  between 18 and 30C and under 100mm of rain. 101 cities have none.
- **BLOCKER, do not write yet:** the list those numbers produce includes Lima, which is
  famously overcast for much of the year. Our climate dataset holds temperature and
  precipitation but **no sunshine or cloud cover**, so "good weather" is currently
  unmeasurable. Open-Meteo's archive does expose sunshine duration; it needs to be fetched
  and added before this article can be honest. This is a good example of the plausibility
  rule catching an article before it embarrassed us rather than after.

---

## Tier B: practical evergreens with no city overlap

These are useful and genuinely independent, but any competitor can write them, so they are
breadth rather than moat. Each needs real sourcing under the standing rule; none of them
can be written from general knowledge alone.

- **Health insurance for long-term nomads.** Needs current products and prices; sources
  must be the insurers themselves, not comparison-site copy.
- **Getting paid across borders.** Multi-currency accounts, receiving fees, what actually
  arrives. Source: the providers' own published fee schedules.
- **The Schengen 90/180 rule, calculated properly.** The rolling window is widely
  misexplained. Primary source: the European Commission's own short-stay calculator and
  the Schengen Borders Code.
- **Mail, residence and where you are actually tax resident.** High risk, high value.
  Requires naming jurisdictions and citing statute, or it should not be published.
- **Air quality by season.** Would pair with a sourced air-quality dataset, which we do not
  have yet. Deferred until then.

---

## Suggested order

1. **A2, the timezone tax.** Data is primary, complete and already verified. Nothing blocks it.
2. **A3, what a budget buys**, scoped to the 331 sourced cities.
3. **A1, the passport gap**, once the 102-destination visa backlog is verified.
4. **A5, year-round weather**, once sunshine data is added.
5. Tier B as breadth, one at a time, each with sources gathered before drafting.

## Note on cadence

The publishing gap matters as much as the subjects. Nothing has been published in roughly
seventeen months, and every existing article sits inside a two-month window in early 2025.
A visibly frozen blog reads as an abandoned site. Whatever is chosen, a steady trickle beats
a burst.

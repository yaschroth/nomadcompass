# WiFi score method (proposal, 2026-10-01)

Status: proposal only. Nothing in cities-data.js or any page has been changed. The only repo files
written are data/internet-speeds.json (extended) and its entry in data/provenance.json.

## What the score measures

scores.wifi has been free editorial judgement. This rule replaces it with one number per city derived
from Ookla's Speedtest Global Index (August 2026 edition, the latest on 2026-10-01): the median fixed
broadband download and the median mobile download, both in Mbps, as stored in
data/internet-speeds.json. It measures speed only. It does not measure reliability, power cuts, cafe
WiFi, censorship or coverage outside towns, because no source in the file measures those.

## Inputs per city

1. Fixed median F and mobile median M.
2. Ookla's own city median is used for a metric wherever Ookla publishes that city
   (`cities.<id>` in the file; 144 cities). Otherwise the national median for that metric is used.
   The two metrics are chosen independently, so a city can have a city fixed figure and a national
   mobile figure (3 cities).
3. Hong Kong uses Ookla's "Hong Kong (SAR)" market, stored under China.cities.hongkong, as before.
4. `basis` in proposal.json is "city" when the fixed figure (or, with no fixed figure, the mobile
   figure) is Ookla's city median, "national" otherwise, and "editorial" when the country has no
   usable Ookla figure at all (see below).

## The rule

Step 1, put both metrics on one scale. Across the 143 countries in the file (national values only):

| | mean of ln(Mbps) | SD of ln(Mbps) | geometric mean |
|---|---|---|---|
| fixed | 4.5756 | 0.8714 | 97.1 Mbps |
| mobile | 4.4767 | 0.7286 | 87.9 Mbps |

zF = (ln F - 4.5756) / 0.8714 and zM = (ln M - 4.4767) / 0.7286.

Step 2, blend: z = 0.75 zF + 0.25 zM. Fixed broadband gets three quarters of the weight because the
connection a remote worker works on (apartment, coworking, cafe) is fixed broadband; mobile is the
backup and the hotspot. When a country publishes only one metric (39 countries lack a current mobile
median, Eswatini and Eritrea lack a fixed one), z is that metric's z alone. Nothing is imputed.

Step 3, express z as a fixed-equivalent speed: E = exp(4.5756 + 0.8714 z), in Mbps. Written out
without z: E = F^0.75 x Mf^0.25, where Mf = 97.1 x (M / 87.9)^1.196 is the mobile median moved onto the
fixed scale. With one metric only, E = F, or E = Mf.

Step 4, map E to 0-10 with this table:

| score | fixed-equivalent speed E | cities |
|---|---|---|
| 10 | 400 Mbps or more | 4 |
| 9 | 274 to 400 | 82 |
| 8 | 203.5 to 274 | 160 |
| 7 | 152 to 203.5 | 182 |
| 6 | 100.5 to 152 | 202 |
| 5 | 54 to 100.5 | 209 |
| 4 | 24 to 54 | 76 |
| 3 | 6 to 24 | 13 |
| 2 | 2.5 to 6 | 1 |
| 1 | under 2.5 | 1 |

Where the table comes from: the 930 measured cities were ranked by E and given, rank for rank, the
scores the same 930 cities hold today (percentile matching), so the site's existing spread of WiFi
scores is kept and only the order changes. Cities with identical inputs (every national-basis city of
one country) are one tie group and get the rounded mean of the scores their ranks span, so a country
is never split by an arbitrary tie-break. The thresholds above sit in the gaps between the resulting
bands; applying the table reproduces the proposal exactly.

For future use, freeze the table and the four ln constants: a new city or a new Ookla edition is then
scored by the table, without re-running the percentile match, so existing cities do not shift when the
set grows. Re-derive the table only as a deliberate recalibration.

Sensitivity: with a 0.6 or 0.9 fixed weight instead of 0.75, about 200 cities move by one point and
none by more than one.

## Countries missing from the dataset

On 2026-09-29 the file held only the 105 countries whose city pages quoted a speed. To score all 999
cities, every other country in cities-data.js was fetched on 2026-10-01 from
speedtest.net/global-index/<slug> exactly as the file was first built: each country page embeds a
`var data = {...}` JSON with the monthly history (fixedMedian, mobileMedian), and the latest edition
per metric was taken under the file's own rules (nothing older than March 2026; a value more than
double or less than half the median of the six editions before it is an anomaly and left null). City
medians come from the same August 2026 global index page the original build used, now matched against
all 999 city names rather than only the pages that quoted a speed. The result, recorded in the file's
_meta (`extended`, `excluded`, `noCountryPage`):

- 38 countries added, with 17 Ookla city medians (Budapest, Doha, Almaty, Bishkek, Chisinau, Lagos,
  Yangon, Mandalay and others). The file now holds 143 countries and 144 city medians.
- 7 countries have a page but only a fixed series older than March 2026 and no mobile series:
  Andorra, Dominica, Gambia, Lesotho, Liechtenstein, San Marino, Sierra Leone. Mauritania's mobile
  series is also too old (its fixed figure is current).
- The Maldives still has no usable figure (675 Mbps in May 2026 after 20 to 37 Mbps before).
- 59 countries and territories have no Global Index page at all: every plausible slug returns 404
  (a sample of ten rechecked a second time). Among them: Puerto Rico, Cuba, Belarus, Bhutan, Malawi, Seychelles, Timor-Leste,
  Vatican City, the French overseas departments, the Crown Dependencies, Greenland, the Faroes, most
  Pacific states and most Caribbean territories. An older Ookla sitemap still lists some of them
  (Bermuda, Curacao, Guam, Jersey, Puerto Rico, Reunion, Belarus) but those pages are gone.

These 67 countries hold 69 cities. They keep their current editorial WiFi score, marked
basis "editorial" in proposal.json. No score is borrowed from a neighbour or a sovereign state: Ookla
does not say whether, for example, Puerto Rico or Aland tests sit inside the United States or Finland
figures, so using them would be a guess.

## Within-country adjustment: none

Ookla publishes city medians only for the cities in its global top lists. No primary source in hand
gives a comparable speed for a small town or a remote place, so every other city gets its country's
median. Plainly: a Pacific or Caribbean resort island gets its country's median, Sapa and Ha Giang get
Vietnam's, Wadi Rum gets Jordan's, Batad gets the Philippines'. For remote places this overstates the
connection, sometimes badly, and the guide prose on those pages says so (see impact.md).

The one source that could support a within-country adjustment is Ookla's own open performance tiles
(fixed and mobile tests aggregated on a roughly 600 m grid, quarterly, global). It was not used: it
publishes mean speeds, not medians, so it does not match the Global Index figures, and it is published under
CC BY-NC-SA 4.0 (to confirm on the dataset page before relying on this), which needs a decision about non-commercial use and share-alike before anything
derived from it is published. If that is cleared, the adjustment would be: city tile median of tests
within the city's boundary vs the national tile median, applied as a ratio to the national figure,
only where the city has a minimum number of tests.

## What the rule deliberately leaves out

- Censorship and blocking (China's Great Firewall, Iran, Turkmenistan, Myanmar). Shanghai's tile today
  says its score "is held at 6 entirely by the Great Firewall"; under this rule it is 9. A documented
  access penalty would need its own primary source (Freedom House, Freedom on the Net, is the obvious
  one) and is not part of this proposal.
- Power reliability, cafe WiFi, coverage outside town. These stay in the tile prose.

## What was applied (2026-10-01)

The rule above was applied in a deliberately cautious form, because a national median says little
about a remote town:

- **Cities with an Ookla city median (144):** the measured score above, in full.
- **Cities on their country's national median:** the measured national score is used as a ceiling,
  not a target. Such a city keeps its editorial score unless that score is more than one point above
  the national score, in which case it is lowered to national + 1. A city may sit below its country
  (rural and island connections are often slower); it may not sit far above it without a measurement.
- **Cities with no usable Ookla figure (69):** unchanged.

209 scores changed in all: 117 lowered by the ceiling, and the rest measured cities whose measured
score differed from the old one. The full proposal, which would have moved 657 cities, is kept for reference; its main
weakness was giving remote towns such as Sapa or Wadi Rum their country's urban median.

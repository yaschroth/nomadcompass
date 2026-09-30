# Proposal, not applied: a cross-national safety baseline for all 1,000 cities

The applied correction (method.md) keeps each country's level where editorial judgement put it. This document proposes replacing those levels with official and survey data. Nothing here is applied. The computed result for every city is in full_proposal.json; the code is in raw/compute.py.

## Method

1. **Homicide: the most comparable official crime statistic.**
   - The source is UNODC's Crime Trends Survey: the intentional homicide rate per 100,000, pooled over the latest five published years. File: https://data.unodc.org/sites/dataportal.unodc.org/files/2026-07/data_cts_intentional_homicide.xlsx (release of July 2026, data mostly to 2023 or 2024).
   - Small countries are noisy: one killing in Liechtenstein moves the rate by 2.5. The rate is therefore smoothed with a prior of three deaths at 1.0 per 100,000 (empirical Bayes).
   - We take minus the log of (rate + 0.25). A move from 0.2 to 0.4 then counts the same as a move from 2 to 4, and differences below about 0.25 count as noise.
2. **Perceived safety: the share of adults who feel safe walking alone at night where they live.**
   - The source is Gallup's Global Safety Report 2025, which covers 144 countries with fieldwork in 2024: https://www.gallup.com/file/analytics/695138/Gallup_Global-Safety-Report-2025.pdf
   - This captures street crime, harassment and fear, none of which homicide sees.
3. **Blend.** Both components are standardised across the site's cities, each city weighted equally, and averaged 50/50. When one component is missing the other is used alone.
4. **Calibration to today's scale.** The blended country index is mapped by equal percentiles onto the current distribution of safety scores: about 3% of cities at 10, 16% at 9, 27% at 8, 24% at 7, 17% at 6 and 13% below.
   - A 9 keeps meaning "top fifth of the cities we cover".
   - The site mean (7.19) and standard deviation (1.49) are unchanged by construction, so the Nomad Score's rescaling constants (6.47 and 0.44) stay valid.
   - Measured result: mean 7.20 to 7.24, SD 1.48 to 1.50.
5. **Within-country adjustment.** Same as method.md: one point per doubling of police-recorded violent and property crime against the national rate, capped at minus 1.5 and plus 1.0.
6. **Territories without their own homicide series** (the Faroes, Aland, the Channel Islands, Monaco, San Marino and others) take their parent state's baseline. They then take the adjustment from their own police data where it exists.

## What it would do

- Across the 978 cities with a baseline, 636 scores change. 342 stay the same, 226 fall by 1, 189 rise by 1, 107 rise by 2, 65 fall by 2, and 49 move by 3 or 4.
- 22 cities get no baseline: small territories with neither a UNODC series nor a Gallup figure, such as Brunei, Curacao, Aruba, Anguilla and Djibouti.

**Countries that would fall**, as the mean change per city:

| Country | Mean change | Homicide per 100k | Safe at night |
|---|---|---|---|
| Ecuador | -1.9 | 26.9 | 38% |
| Chile | -1.8 | 5.9 | 39% |
| Uruguay | -1.7 | 10.4 | 50% |
| Colombia | -1.6 | 24.5 | 49% |
| South Africa | -1.6 | 40 | 33% |
| New Zealand | -1.7 | 1.4 | 64% (women 47%) |
| Laos | -1.4 | not in UNODC | 63% |
| Mexico | -1.1 | 26.6 | 51% |
| Finland | -0.8 | 1.35 | 88% |
| Japan | -0.4 | 0.23 | 78% |

**Countries that would rise:**

| Country | Mean change | Homicide per 100k | Safe at night |
|---|---|---|---|
| Algeria | +2.7 | 1.5 | 78% |
| Indonesia | +2.1 | 0.37 | 83% |
| Egypt | +2.1 | 1.5 | 82% |
| China | +1.7 | 0.55 | 94% |
| United Kingdom | +1.4 | 1.0 | 76% |
| Ireland | +1.2 | 0.65 | 76% |
| Serbia | +1.2 | 1.1 | 78% |
| Bosnia | +1.2 | 1.1 | 69% |
| Vietnam | +1.2 | not in UNODC | 88% |
| United States | +1.0 | 6.1 | 71% |

**The 10s would change.**

- Most Japanese cities leave 10 (24 of 29 become 9): Japan's homicide rate is the lowest in the data, but only 78% of Japanese adults feel safe at night.
- The new 10s include Singapore, Hong Kong, Muscat, Salalah and Nizwa, several Chinese cities (Shanghai, Beijing, Xiamen, Guilin), Kaohsiung and Taichung, and Lucerne, Zermatt, Torshavn, Geiranger and Reine. Geiranger and Reine get there on a dozen offences a year, which is a small-number artefact.

## Known weaknesses: why this should not be applied as is

- **Homicide under-recording.**
  - UNODC figures depend on what each state reports. Several countries that rise the most (Algeria, Egypt, Iraq, Indonesia, China) report homicide rates below most of Western Europe. Independent public-health estimates put some of them far higher.
  - Gallup also asks people in some of these countries a politically sensitive question, which likely inflates "feel safe" answers.
  - A published score would need a plausibility check against WHO mortality estimates before these rises are accepted.
- **Perception is not risk.** Gallup's measure falls where people are anxious rather than victimised. Italy (60%) and New Zealand (64%) score lower than their crime data suggest. This is the right signal for how comfortable a solo woman may feel, but a weak signal of crime itself.
- **One national figure hides regional gaps.**
  - Glasgow would rise from 5 to 8 and Naples from 4 to 7 because they inherit a national baseline. Scotland and southern Italy differ from their national averages.
  - The within-country step only fixes this where regional police data exist. Eurostat covers Italy but not Scotland.
- **Tourist-inflated per-resident rates.** Police count crimes where they happen but divide by residents. Visitor-heavy places look worse than they feel: Dubrovnik, Plitvice, the Cyclades, Fuerteventura, Queenstown, Kyoto, Jeju, Hallstatt and Zermatt.
- **Definitions differ between territories and their parents.**
  - Faroese, Greenlandic and Crown dependency figures use their own penal codes.
  - The Faroes' very low recorded violence (1.4 per 1,000 against Denmark's 4.8) partly reflects categories that leave out threats and violence against public officials, which Denmark counts.
- **Small numbers.** Iceland recorded 8 homicides in 2024 against 2 to 5 in earlier years. Liechtenstein, Monaco and the Channel Islands have a few cases a decade. Smoothing helps, but these baselines remain uncertain by about a point.
- **Coverage.** Gallup has no figure for Qatar, Taiwan is not in UNODC (its homicide rate, 0.32 to 0.53 per 100,000 in 2021 to 2025, is taken from the Taiwan National Police Agency yearbook instead), and 22 territories have neither. Those places keep their current editorial level.

## Recommendation

Apply the within-country correction now (proposal.json). Treat this cross-national method as the target, in three steps:

1. Add a WHO mortality cross-check for homicide.
2. Cap any country's move at plus or minus 2 in the first release.
3. Publish the two inputs beside each score, so a reader can see why Japan and Norway differ.

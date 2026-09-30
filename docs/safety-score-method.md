# How the safety score uses official crime data

*Draft for /methodology. It describes the correction that is proposed for application now (proposal.json). The cross-national method in full-method.md is a separate proposal and is not applied.*

## What the score is

The safety score runs from 1 to 10. It rates personal safety for someone living in the city for a few months: the chance of being attacked, robbed or stolen from.

Each country's level is still set by editorial judgement. Official police statistics now decide where each city sits **inside its own country**. When the police data show that one city has more crime than another city in the same country, the first city's score can no longer be higher.

## The data we use

We only use police-recorded crime published by the national statistics office or the police. Both the city figure and the national figure come from the same table and the same year, and we average the last two or three published years.

| Country | Source | City unit | Violent measure | Property measure |
|---|---|---|---|---|
| Canada | Statistics Canada, table 35-10-0026-01 | Census metropolitan area | Violent Crime Severity Index | Non-violent Crime Severity Index |
| Finland (and Aland) | Statistics Finland, table 13h4 | Municipality | Assault offences + robbery per 1,000 | Thefts per 1,000 |
| Sweden | Bra (Swedish National Council for Crime Prevention), municipal statistics via Kolada | Municipality | Reported violent crime per 100,000 | Reported theft offences per 100,000 |
| Norway | Statistics Norway, table 08487 | Municipality | Violence and maltreatment per 1,000 | Property theft per 1,000 |
| Denmark | Statistics Denmark, STRAF11 and FOLK1A | Municipality | Crimes of violence + robbery per 1,000 | Offences against property per 1,000 |
| Faroe Islands | Hagstova Foroya, RL02010, compared with Statistics Denmark | Whole territory | Crimes against life and limb per 1,000 | Burglary + theft per 1,000 |
| Greenland | Statistics Greenland, KRXAN1 and population tables | Nuuk police station | Violence + robbery per 1,000 | Burglary + theft per 1,000 |
| EU countries, Iceland, Switzerland | Eurostat, police-recorded offences by NUTS 3 region (crim_gen_reg) | NUTS 3 region (a county, province or district) | Assault + robbery per 100,000 | Theft per 100,000 |
| England and Wales | ONS / Home Office, police force area and Community Safety Partnership tables | Community Safety Partnership | Violence against the person + sexual offences + robbery per 1,000 | Total recorded crime excluding fraud per 1,000 |
| United States | FBI Crime Data Explorer | City police agency | Violent crime per 100,000 | Property crime per 100,000 |
| New Zealand | NZ Police victimisation data (policedata.nz) with Stats NZ population | Territorial authority (city or district council) | Assault + sexual offences + robbery victimisations per 10,000 | Burglary + theft victimisations per 10,000 |
| Australia | Australian Bureau of Statistics, Recorded Crime: Victims | State or territory | Assault + sexual assault + robbery victims per 100,000 | Burglary + vehicle theft + other theft victims per 100,000 |
| Japan | National Police Agency, annual crime statistics, with Statistics Bureau population | Prefecture | Heinous + violent penal code offences per 100,000 | All penal code offences per 100,000 |
| South Korea | Korean National Police Agency, crime by region of occurrence (data.go.kr) | City, or metropolitan city / province | Serious + violent crime per 100,000 | All recorded crime per 100,000 |
| Taiwan | National Police Agency, police statistics | City or county | Violent crime cases per 100,000 | Theft cases per 100,000 |

Recorded crime is not comparable between countries, because laws, reporting habits and counting rules differ. That is why we only ever compare a city with its own country.

## How a score is set

1. **Country level.** This is the median of the current scores of all the country's cities on the site.
2. **City crime index.** We divide the city's rate by the national rate, separately for violent crime and property crime. The index combines the two ratios, weighting violent crime at 70% and property crime at 30%, and expresses the result in doublings.
3. **Country centre.** This is the median index of the country's cities on the site. The typical city we cover is usually a larger city with more crime than the national average, so we measure each city against that typical city, not against the national rate. For a country with fewer than three cities that have data, we use the national rate.
4. **Adjustment.** Each doubling of crime above the country centre costs one point, and each halving gains one point.
   - The adjustment is capped at minus 1.5 and plus 1.0.
   - When a place records fewer than about 100 offences a year, we shrink the adjustment towards zero, because a handful of cases can double a small town's rate.
5. **Score.** Country level plus adjustment, rounded to a whole number, with two limits:
   - A score never moves against the data. If the police data put a city above its country's typical city, rounding cannot lower its score, and if they put it below, rounding cannot raise it. The only exception is a score more than one point away from what the data support.
   - A city is not raised to 10 on fewer than 50 recorded offences a year.

Two places are handled on their own:

- **Greenland.** Its crime rates are far above Denmark's. Reported violence per resident is about four times Denmark's, and the homicide rate over 2015 to 2024 was about 10 per 100,000 against Denmark's 0.8. Greenland therefore gets its own level instead of Denmark's. That level is Denmark's level minus the gap between the two in the cross-national comparison of homicide and perceived safety.
- **The Faroe Islands and Aland.** Their own statistics offices publish comparable figures, so each is measured against its parent state: Denmark for the Faroes, Finland for Aland.

## Which cities this is applied to

- **Every city in:** Canada, Finland (including Aland), Sweden, Norway, Denmark, the Faroe Islands, Greenland, Iceland and New Zealand.
- **Elsewhere, only cities now scored 9 or 10, and only downwards.** A score changes in either of two cases:
  - It sits more than one point above what the official data support for that country.
  - It is higher than the score of another city in the same country that has at most half its crime.
  In both cases it takes the value the method gives.
- **Visitor-dominated places.** In places such as Plitvice, Santorini, Hallstatt or Queenstown, visitors far outnumber residents. Per-resident rates there count crimes against visitors but divide by residents only, so we do not use them to lower a score.

## What this does not do

- It does not compare countries with each other. A 9 in Norway and a 9 in Japan still rest on editorial judgement at country level. A separate proposal (full-method.md) sets country levels from UNODC homicide data and the Gallup survey of feeling safe at night.
- It does not measure how safe women feel, which recorded crime captures poorly. Gallup's 2025 Global Safety Report is the only comparable source, and it shows large gender gaps in some countries we rate highly. In New Zealand, for example, 47% of women feel safe walking alone at night, against 82% of men.
- It uses where people live, not where visitors go. A city centre that draws commuters, students and tourists has a higher per-resident rate than its streets feel.

## Sources

The full list of figures, years and URLs for every city is in proposal.json. The main tables are:

- Statistics Canada 35-10-0026-01: https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510002601
- Statistics Finland 13h4: https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__rpk/statfin_rpk_pxt_13h4.px/
- Bra municipal statistics via Kolada (KPI N07403, U07417): https://www.kolada.se
- Statistics Norway 08487: https://www.ssb.no/en/statbank/table/08487
- Statistics Denmark STRAF11: https://www.statbank.dk/STRAF11
- Hagstova Foroya RL02010: https://statbank.hagstova.fo/pxweb/en/H2/H2__RL__RL02/logr_brot.px
- Statistics Greenland KRXAN1: https://bank.stat.gl/pxweb/en/Greenland/Greenland__KR/KRXAN1.px
- Eurostat crim_gen_reg: https://ec.europa.eu/eurostat/databrowser/view/crim_gen_reg/default/table
- ONS, Crime in England and Wales, police force area data tables: https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov
- NZ Police victimisation time and place: https://www.police.govt.nz/about-us/publications-statistics/data-and-statistics/policedatanz/victimisation-time-and-place
- ABS Recorded Crime, Victims 2025: https://www.abs.gov.au/statistics/people/crime-and-justice/recorded-crime-victims/latest-release
- National Police Agency of Japan, crime statistics 2024: https://www.npa.go.jp/toukei/soubunkan/R06/excel/R06_003.xlsx
- Korean National Police Agency, crime by region 2024: https://www.data.go.kr/data/3074462/fileData.do
- Taiwan National Police Agency statistics: https://www.npa.gov.tw

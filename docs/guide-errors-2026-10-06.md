# Guide errors reported while writing the wave-4 rankings (2026-10-06)

The ranking agents built their prose from our own city guides and reported what looked wrong. Every
item was checked against a primary source before it was changed; where the report itself was wrong,
that is noted. Status as of the end of 2026-10-06.

## Visa and entry rules that disagree between guides (DONE, except where marked open)
- **Japan nomad status:** ISA page and country chart: six months, no extension, JPY 10 million. "49" and
  "51" were the same list counted two ways (49 countries plus Hong Kong and Taiwan). The launch day could
  not be confirmed (MOFA blocks fetches), so the pages now say spring 2024. Sapporo and Kanazawa no longer
  present border runs as workable; British visitors can apply in Japan for a further 90 days.
- **South Korea:** Daegu's "extensions" sentence now plainly means yearly F-1-D renewals. OPEN: whether
  a visa-free entry can be extended in Korea (HiKorea and immigration.go.kr unreachable).
- **Greece:** workfromgreece.gr: visa up to 1 year, then a 2-year residence permit renewable in 2-year
  steps. Athens, Crete, Rhodes, Thessaloniki fixed; Santorini was right. OPEN: Athens "no in-country
  application since February 2026" (mfa.gr returns 403).
- **Turkey:** Istanbul now describes certificate then consulate; Kas no longer calls it Schengen-style;
  seven visa tiles that denied a Turkish nomad visa fixed.
- **Brazil VITEM XIV:** CNIg Resolution 45/2021: renewable once, applicable from inside Brazil via the
  Ministry of Justice, registration within 90 days. Nine pages fixed.
- **Argentina:** Communication A 8226 (April 2025) ended the controls behind the blue rate; advice
  rewritten in seven cities. Disposition 758/2022 sets no income figure; applications are online or at
  Migraciones, never a consulate. Tourist extension fee is 20 UMSM, about $13 (both reported figures were
  wrong). OPEN: nomad visa fee, two invented visa names (Rosario, Mendoza), Mar del Plata tax claim.
- **Peru:** 183 days in 365; Mancora, Iquitos, Cusco fixed. OPEN: Lima, Cusco and Arequipa tiles still
  treat border runs as a reset.
- **India:** the official e-visa page sets a per-visit limit only for the e-Business visa; the e-Tourist
  visa (1 and 5 year) allows 180 days per calendar year, the 30-day one runs from first arrival. 25 pages
  fixed. Gangtok: Restricted Area Permit (plus a Protected Area Permit for Tsomgo and North Sikkim); Leh:
  Protected Area Permit.
- **Malaysia:** MDEC: DE Rantau $24,000 (tech) or $60,000 (other roles), RM1,000 (about $240), six to
  eight weeks; tourist extensions only on special grounds. Six cities fixed. OPEN: Sarawak entry length
  (Kuching 90 vs Miri 30).
- **Taiwan:** BOCA: visa-free stays are not extendable except for British and Canadian passports.
  Taichung, Hualien, Taitung, Kaohsiung fixed. OPEN: Kaohsiung category text calls the nomad visa
  "6-month non-renewable".
- **Vietnam:** e-visa $25 single, $50 multiple; Ho Chi Minh City fixed (Hanoi was right).
- **Morocco:** Decree 2.26.530 moved Morocco to UTC+0 with no DST from 2026-09-20 (IANA
  Africa/Casablanca). `timezone` set to 0 for all 15 cities; facts panel and hero stat refreshed
  (apply_timezone_stat.cjs now refreshes as well as inserts); prose in Agadir, Fes, Ifrane, Tangier
  rewritten. Overstay: an offence under Law 02-03 (Ifrane fixed). OPEN: Essaouira's consulate-first
  carte de sejour.
- **UK:** ETA (GBP 20, about $27) now named on London and Leeds.
- **Croatia:** up to 18 months (Rovinj fixed); EU citizens are not under 90/180 (Pula fixed). Zagreb's
  "travel insurance" is correct: the ministry accepts travel or private health insurance.
- **Rarotonga:** visitor stay capped at eight months; whoFor and the tile fixed.

## Collapsed prices and doubled glosses (DONE)
Fixed by `scripts/fix_price_glosses.cjs` (282 doubled glosses on 80 pages, zero fares), by hand (bare "$0"
fares in Semarang, Batumi, Yogyakarta, Zanzibar; Sapa's "$0 Loi" was Dong Loi), and in
`apply_city_costs.cjs` ("already in US dollars" instead of "$1 = $1"; A$, C$, NZ$, S$, HK$, MX$, AR$,
COL$, CLP$ instead of a bare "$" for other dollar currencies; a 0 line is left out). check_price_shapes.cjs
now flags the slash and "(about $...)" forms.

## Guide prose that disagrees with the page's own cost figure (OPEN, owner decision)
Gwangju, Crete, Oaxaca, Tepoztlan, Santiago, Antigua, Boquete, Ipoh, Chefchaouen, Ouarzazate, Cordoba,
Osijek, Antalya, Oulu, Zermatt, Geiranger, Paris, Patras (transit pass), Huanchaco. Cordoba's "50-60%
lower than Buenos Aires" is fixed (now "roughly a quarter below", from our own figures).

## Guide prose that disagrees with our climate data (DONE)
Fixed in the guides against the climate data. Rarotonga's "day highs" were the data's fault, not the
prose's: the pin sat at 306 m on the mountain, so the airport station (Meteostat 91843, 7 m) failed the
250 m elevation test and the city kept an ERA5 ocean cell with highs of 22-25C. The pin now sits in
Avarua; the station gives 26-30C, Rarotonga left the eternal-spring ranking (Villa de Leyva is #15) and
645 cities are on station data. Eight more titles and descriptions (Bandipur, Bohol, Chamonix, Coorg,
Gangtok, Gorkha, Iloilo, Kochi) still carried the pre-station temperatures from 2026-10-05 and were
refreshed.

## Other factual slips (DONE, except where marked open)
All items in the original list were fixed, including Tetouan's tagline (not an imperial city; 26 copies
in cities-data.js, the city page, the Morocco ranking and the tier lists) and the Casablanca mosque line
in scripts/generate_city_pages.js. OPEN: Medellin's tap-water line comes from the Colombia entry in
scripts/lib/country-facts.cjs; no primary source for Medellin's potability was reachable (EPM's page
404s), so it is unchanged.

## Noticed while fixing, not yet checked
de_templatize_cities.cjs puts "daily remote work patchy" on 42 pages; Chefchaouen's border run "to Spain
or Portugal"; Providenciales tagline "third-largest barrier reef"; Shillong "no working airport" (Umroi
has scheduled flights); Shillong's claim that Meghalaya has no Inner Line Permit; Kuching's Sarawak
stamp rule; Salvador's processing time; Recife's residence-card fee (R$204.77 on gov.br).

## Fixed earlier on 2026-10-06
DE Rantau not valid in Sabah/Sarawak (Kota Kinabalu, Miri); Philippines EO 86 (Manila, Cebu, Siargao);
Peru Decree 1582 (Huaraz); Rovinj euro; Jeju Gimhae is Busan's airport; Rabat is on the Atlantic.

# Guide errors reported while writing the wave-4 rankings (2026-10-06)

The ranking agents built their prose from our own city guides and reported what looked wrong. Nothing
below has been verified against a primary source yet; each needs a check before it is changed. Items
already fixed on 2026-10-06 are listed at the end.

## Visa and entry rules that disagree between guides
- **Japan nomad status:** launch date given as March 2024 (Kyoto, Sapporo) and 1 April 2024 (Osaka,
  Fukuoka); eligible countries 49 (Sapporo) vs 51 (Kyoto, Fukuoka, Kanazawa). Sapporo and Kanazawa
  present border runs as workable; Tokyo, Osaka, Fukuoka, Kamakura warn of refusals.
- **South Korea:** Daegu says "Extensions within Korea are possible"; Gwangju and Busan say a 90-day
  entry cannot be extended in-country.
- **Greece nomad visa duration:** Athens 1+1 years, Thessaloniki up to three years, Santorini two-year
  permits renewable in two-year steps; Crete and Thessaloniki call it a residence permit.
- **Turkey:** Istanbul says the certificate is converted in-country (others: consulate route); Kas
  calls Turkey's limit a "Schengen-style rolling window".
- **Brazil VITEM XIV:** Florianopolis says renewable indefinitely (it is renewable once); Porto Alegre
  says no in-country conversion, Joao Pessoa/Salvador/Recife say yes via the Federal Police; Rio
  "weeks" vs Recife/Tiradentes "90 days" to register; Curitiba "on arrival in some cases".
- **Argentina:** blue-rate advice in Mendoza, Cordoba, Rosario, Mar del Plata, Bariloche, El Chalten,
  Purmamarca vs Salta (rates unified); extension fee ~USD 200 (Buenos Aires) vs ~$50; nomad visa
  income ~$2,500 (Cordoba, Mar del Plata) vs none (Rosario); consulate (Cordoba) vs online.
- **Peru:** Mancora "90 days within a 180-day window" (rule is 183 in 365); Iquitos "ninety rather
  than one hundred and eighty"; Cusco cons "beyond 90 days requires border runs".
- **India e-Tourist visa per-visit limit:** Goa, Kochi, Bangalore, Pune all differ; unify from the
  official e-visa page. Gangtok and Leh call foreigners' permits "Inner Line Permits" (likely
  Restricted/Protected Area Permits).
- **Malaysia:** DE Rantau income given only as $24,000 in Penang and Kuala Lumpur (non-tech roles need
  $60,000); fees $240 vs $245; processing times from 5-10 business days to 6-16 weeks (MDEC: ~8 weeks);
  in-country extensions possible (Ipoh) vs not (Langkawi, KL); Sarawak entry 90 days (Kuching) vs
  30 (Miri).
- **Taiwan visa-free extension:** Kaohsiung (no), Tainan (UK and Canada only), Taichung (often once).
- **Vietnam e-visa fee:** Hanoi $25/$50 vs Ho Chi Minh City $55.
- **Morocco:** time zone stated three ways (Agadir, Ifrane/Fes, Tangier correct: GMT+1, GMT in
  Ramadan); overstay "fine and a stamp" (Ifrane) vs court under Law 02-03; Essaouira consulate-first
  carte de sejour vs others.
- **UK:** London says six months visa-free with nothing to apply for; most visa-free visitors now need
  a UK ETA.
- **Croatia:** Rovinj "maximum of twelve months" vs 18 in the same paragraph; Pula says most EU
  countries get 90/180 (EU citizens have no limit); Zagreb "travel insurance" (health insurance).
- **Rarotonga:** long-term permit capped at eight months, later "will stretch to six".

## Collapsed prices and doubled glosses not caught by fix_degenerate_prices.cjs
Sao Paulo "one US dollar buys roughly $1"; Buenos Aires, Cordoba, Rosario "converted to USD at $1 = $1";
Baguio, Davao, Cebu, Dumaguete, Palawan, Bariloche, Arequipa fares or passes of "$0"; doubled forms
"$345-450 / $370-480" (Daegu, Kota Kinabalu, Langkawi, Huanchaco, Bariloche), "(about $580 to $900)"
(Kaohsiung, Kuching), "($800-1,200)" (Lake Atitlan), "(roughly 1,400-2,400 USD)" (Athens),
"(roughly $3,800)" (Rhodes), "($35-50 at the current rate)" (Buenos Aires), "($2,000+ USD)" (Puerto
Vallarta), "$12 one way ($11)" and a euro fare (Dubrovnik), "$12 to $16 (roughly $11 to $15)" (Lima),
"$670 and $1,250 (roughly $780 to $1,450 )" (Bangalore), Cappadocia, Trondheim, Ho Chi Minh City.
Extend the repair and check_price_shapes.cjs to these shapes.

## Guide prose that disagrees with the page's own cost figure
Gwangju, Crete, Oaxaca, Tepoztlan, Santiago, Antigua, Boquete, Ipoh, Chefchaouen, Ouarzazate, Cordoba,
Osijek, Antalya, Oulu, Zermatt, Geiranger, Paris, Patras (transit pass), Huanchaco.

## Guide prose that disagrees with our climate data
Kyoto and Daegu summer highs; Nanyuki night lows; Rarotonga day highs; wettest month in Valparaiso,
Lake Atitlan, Ipoh, El Nido, Johor Bahru; Amasra rainfall vs Antalya; Santa Fe altitude 2,200 vs 2,100;
Santiago smog season.

## Other factual slips
Kanazawa to Osaka by Shinkansen (change at Tsuruga); Kumamoto to Fukuoka 40 vs 60 minutes; Mexico City
museum superlative; Rome "2025 is a Jubilee year"; Tromso is in Troms, not Finnmark; Oulu "6 to 54 US
AQI, solidly good"; Queenstown "littler"; Vaduz stamp and Monaco crime superlatives; Rio time difference
with Europe; Gramado duplicated visa paragraph and hedge; Istanbul garbled con; Kota Kinabalu Mount
Kinabalu "within an hour"; Cebu "north of the typhoon belt"; Johor Bahru "on the equator"; Malacca stale
MYR rate; Osijek Vukovar distance; Ifrane altitude, ski area, macaques, Fes travel time; Casablanca tram
lines and mosque rank; Tetouan tagline and Tangier time; Rabat (fixed); Chefchaouen "Medelin";
Kolkata rickshaw superlative; Pune Justdial rating in prose; Shillong repeats; Gangtok heating repeat;
Huaraz earthquake toll; Mancora and Huanchaco garbled sentences; Manizales to Medellin "two hours";
Medellin facts panel tap-water line.

## Fixed on 2026-10-06
DE Rantau not valid in Sabah/Sarawak (Kota Kinabalu, Miri); Philippines EO 86 (Manila, Cebu, Siargao);
Peru Decree 1582 (Huaraz); Rovinj euro; Jeju Gimhae is Busan's airport; Rabat is on the Atlantic.

# Consular sources for the services directory, per mission

Kept so a later pass does not re-search what has already been checked. Add a line whenever a
mission is worked, including the ones that yield nothing.

## Portugal

| Mission | Lists it publishes | Taken | Note |
|---|---|---|---|
| UK, FCDO | medical facilities; lawyers via Find a professional service abroad | yes | English only |
| Germany, Lisbon | doctors, translators, lawyers | all three | doctors carry per-entry languages |
| France, Lisbon | doctors, notaries and bar, translators | doctors and legal | translators page has no PDF; the bar list's district column does not survive extraction cleanly |
| Switzerland, Lisbon | Vertrauensarzt / Vertrauensanwalt page | none | eda.admin.ch answers 403 to this client |
| Austria, Lisbon | Vertrauensaerztinnen, Vertrauensanwaeltinnen | both, via manual download | blocks this client; states Sprachkenntnisse per entry, the best-structured source in the file |

## What no mission publishes anywhere, checked repeatedly

Tax advisers, estate agents, mechanics, hairdressers, opticians and gyms. No embassy or chamber
publishes a provider list with a language claim for these. They need directory-tier sources, which
this file already uses for 113 rows, or they stay empty. Filling them without a source would remove
the only argument this directory has.

## Spain

| Mission | Lists it publishes | Taken | Note |
|---|---|---|---|
| UK, FCDO | medical facilities; lawyers | yes | English only |
| Germany, Madrid | doctors (PDF) | eleven rows | the PDF wrote /Lang tags into its text and the reader now strips them; a first pass got three rows, a second got eight more across nine specialties |
| Austria, Madrid | trusted doctor, trusted lawyers | both, via manual download | states Sprachkenntnisse per entry |
| France, Madrid | not yet checked | none | four lists in Portugal, expect the same here |
| Italy, Madrid | not yet checked | none | |

### German consulate general, Malaga (2026-08-18)

List of German-speaking doctors, PDF, stand 10.07.2026. Twenty rows across Marbella (9), Malaga (5),
Seville (4) and Granada (2), in four categories: doctors, dentists, a physiotherapist and two
therapy entries. It only opened after the reader learned to cut /Lang tags glued to the front of a
word: 157 of its lines carried one. Entries in Estepona, Mijas, Benalmadena, Torrox, Nerja,
Sotogrande, Vejer, Palmones and Gibraltar are outside the index, and one dentist was left out
because the address pairs a Granada city postcode with the town name Motril.

### German consulate, Las Palmas de Gran Canaria (2026-08-18)

List of German-speaking doctors, stand August 2026, covering the provinces of Las Palmas and
Tenerife. Seventeen rows: Tenerife 13, Las Palmas 2, Fuerteventura 2. Maspalomas and Playa del
Ingles were left out because they are their own resorts 50 km from Las Palmas de Gran Canaria, and
Lanzarote and La Palma are not in the index.

### German consulate general, Barcelona (2026-08-18)

Selection of German-speaking doctors in the Barcelona consular district. Twenty-four rows across
Barcelona (21) and Valencia (3), in three categories, and the first Catalan-language rows in the
directory: the file states the languages per entry, so eleven of them carry Catalan, English,
French or Italian rather than a blanket German.

It needed two more repairs to the reader. Its objects all sit in one compressed object stream, and
its text sits in literal strings that mean nothing until they go through a subset font table. The
file also mismaps two of its own glyphs, K as a masculine ordinal and T as a backslash, which is
legible from TEºNON for the Teknon clinic and restored by hand. Six entries were skipped because
the name is set in a decorative font and cannot be read; two of those are listed under their
practice name, which is readable.

### French embassy in Spain, Professionnels francophones (2026-08-18)

https://es.diplomatie.gouv.fr/fr/liste-de-notoriete carries the whole country on one page: lawyers
by consular district, doctors by specialty, then sworn translators and interpreters. Read by
scripts/parse_fr_es.cjs, 151 new rows across 16 cities, Barcelona 79 and Madrid 32.

The city is taken from each address, never from the heading, because a consular district is not a
city: the Granada heading covers a lawyer who also serves Malaga and Cordoba, and the Estremadura
heading is followed by a practice whose own text places it in Seville. Where an address prints only
a postcode, a core-range table decides, and only when nothing follows the code on the line, since
what follows is usually another town. That rule is what keeps Majadahonda out of Madrid and Arona
out of Tenerife.

The translator section splits into a French/Spanish list and a French/Catalan one. That heading is
the only statement of the language pair, so it travels with the row: the Catalan interpreters are
listed as French and Catalan, not French and Spanish.

Note the shape of the source. It is the first that carries lawyers, doctors and translators
together, and it moved French from 6 percent of the directory to 11.

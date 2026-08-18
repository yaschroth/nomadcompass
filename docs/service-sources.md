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

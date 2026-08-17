# Consular lists this machine cannot fetch

Some ministries answer 403 or 404 to any non-browser client. The lists exist and are public; only
the fetch fails. When that happens the URL goes here, the user saves the page, and the file is read
from `c:\tmp\incoming\`.

**How to save:** for a page, Ctrl+S in the browser and choose "Webpage, HTML only" (the list is in
the HTML; images and CSS are not needed). For a PDF, just download it. Keep the suggested filename
so the reader below picks it up without being told.

## Waiting

| Save as | URL | What is on it | Symptom |
|---|---|---|---|
| `ch-portugal-arzt-anwalt.html` | https://www.eda.admin.ch/countries/portugal/de/home/dienstleistungen/arzt-anwalt.html | Swiss embassy Lisbon: Vertrauensarzt and Vertrauensanwalt | 403 to this client |
| `at-lisbon-doctors.html` | https://www.bmeia.gv.at/oeb-lissabon/service-fuer-buergerinnen/soziales-gesundheit/vertrauensaerztinnen | Austrian embassy Lisbon: trusted doctors | 404, including bmeia.gv.at itself, so it is a block |
| `at-lisbon-lawyers.html` | https://www.bmeia.gv.at/oeb-lissabon/service-fuer-buergerinnen/hilfe-in-rechtsfragen/vertrauensanwaelte-und-vertrauensanwaeltinnen/ | Austrian embassy Lisbon: trusted lawyers | 404, same block |

## Done

Nothing yet.

## Note

Switzerland and Austria have missions in most of the countries this directory covers, so both
blocks will recur per country rather than once. Expect this list to grow as each country is worked,
and expect the same two ministries to be the reason most of the time.

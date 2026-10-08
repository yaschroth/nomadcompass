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
| `at-madrid-lawyers.html` | https://www.bmeia.gv.at/oeb-madrid/service-fuer-buergerinnen/hilfe-in-rechtsfragen/vertrauensanwaelte-und-vertrauensanwaeltinnen | Austrian embassy Madrid: trusted lawyers | same bmeia block |

### Japanese missions (added 2026-10-09)

Every `*.emb-japan.go.jp` host and `www.mofa.go.jp` answers 403 (Akamai "Access Denied") to this
machine, robots.txt included. Their lists of medical institutions where Japanese can be used (日本語が
通じる医療機関) are the only Japanese-language source for most cities outside Japan. On each page below,
open the medical / "医療機関" link (usually under `/itpr_ja/`) and save the list page or PDF as
`jp-<city>-medical.html` or `.pdf`.

| Save as | Start page | Cities it covers |
|---|---|---|
| `jp-chicago-medical.*` | https://www.chicago.us.emb-japan.go.jp/itpr_ja/index.html | Chicago |
| `jp-seattle-medical.*` | https://www.seattle.us.emb-japan.go.jp/itpr_ja/index.html | Seattle, Portland |
| `jp-houston-medical.*` | https://www.houston.us.emb-japan.go.jp/itpr_ja/index.html | Houston |
| `jp-boston-medical.*` | https://www.boston.us.emb-japan.go.jp/itpr_ja/index.html | Boston |
| `jp-honolulu-medical.*` | https://www.honolulu.us.emb-japan.go.jp/itpr_ja/index.html | Honolulu |
| `jp-denver-medical.*` | https://www.denver.us.emb-japan.go.jp/itpr_ja/index.html | Denver |
| `jp-miami-medical.*` | https://www.miami.us.emb-japan.go.jp/itpr_ja/index.html | Miami |
| `jp-la-medical.*` | https://www.la.us.emb-japan.go.jp/itpr_ja/index.html | Los Angeles |
| `jp-vancouver-medical.*` | https://www.vancouver.ca.emb-japan.go.jp/ | Vancouver |
| `jp-toronto-medical.*` | https://www.toronto.ca.emb-japan.go.jp/ | Toronto |
| `jp-uk-medical.*` | https://www.uk.emb-japan.go.jp/ | London, Edinburgh |
| `jp-sydney-medical.*` | https://www.sydney.au.emb-japan.go.jp/ | Sydney |
| `jp-hk-medical.*` | https://www.hk.emb-japan.go.jp/ | Hong Kong |
| `jp-shanghai-medical.*` | https://www.shanghai.cn.emb-japan.go.jp/ | Shanghai |
| `jp-hcmc-medical.*` | https://www.hcmcgj.vn.emb-japan.go.jp/ | Ho Chi Minh City |
| `jp-manila-medical.*` | https://www.ph.emb-japan.go.jp/ | Manila, Cebu |
| `jp-bangkok-medical.*` | https://www.th.emb-japan.go.jp/ | Bangkok |
| `jp-mexico-medical.*` | https://www.mx.emb-japan.go.jp/ | Mexico City |

## Held for the owner's decision (2026-10-09)

- US Consulate Krakow attorney and doctor lists (42 rows): publicly posted but marked "SENSITIVE BUT UNCLASSIFIED".
- Hong Kong EDB international and private school lists (~35 English-medium schools): terms forbid reuse beyond personal use; worth a permission request.
- German Embassy Cairo lawyers PDF: "nur zum persönlichen Gebrauch und nicht zur Weiterverbreitung".
- French Embassy Laos lawyers (15 rows): languages explicit but no city per lawyer.

## Done

- Austria, Madrid: trusted doctor and trusted lawyers, downloaded 2026-08-17 and read. Three rows.

- Austria, Lisbon: both pages, doctors and trusted lawyers, downloaded by the user on 2026-08-17 and read. Three rows for Lisbon; the fourth entry is in Albufeira, which the site does not cover.

## Note

Switzerland and Austria have missions in most of the countries this directory covers, so both
blocks will recur per country rather than once. Expect this list to grow as each country is worked,
and expect the same two ministries to be the reason most of the time.

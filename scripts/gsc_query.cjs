/**
 * Search Console, read-only, without the MCP server.
 *
 * The gsc MCP server times out at session start often enough that topic choice stalled on it. This
 * talks to the same API with the same service account, through the googleapis copy that ships with
 * the globally installed mcp-server-gsc, so nothing new is installed and no key lives in the repo.
 *
 * Writes every (query, page) row for the last 90 days, with clicks, impressions, ctr and position.
 *
 * Usage: node scripts/gsc_query.cjs <out.json> [days]
 */
const fs = require('fs');

const KEY = 'C:/Users/yasch/.google/paraguay-seo-84d8fa4d2bf2.json';
const GOOGLEAPIS = 'C:/Users/yasch/AppData/Roaming/npm/node_modules/mcp-server-gsc/node_modules/googleapis';
const SITE = 'sc-domain:thenomadhq.com';

const out = process.argv[2];
const days = Number(process.argv[3] || 90);
if (!out) { console.error('usage: node scripts/gsc_query.cjs <out.json> [days]'); process.exit(2); }

(async () => {
  const { google } = require(GOOGLEAPIS);
  const auth = new google.auth.GoogleAuth({ keyFile: KEY, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });
  // Search Console lags about two days; asking for them returns nothing and shrinks the window.
  const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 864e5).toISOString().slice(0, 10);
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate: start, endDate: end, dimensions: ['query', 'page'], rowLimit: 25000, startRow },
    });
    const got = r.data.rows || [];
    rows.push(...got);
    if (got.length < 25000) break;
  }
  fs.writeFileSync(out, JSON.stringify(rows));
  console.log(`${start} to ${end}: ${rows.length} query/page rows -> ${out}`);
})().catch((e) => { console.error('gsc_query: ' + e.message); process.exit(1); });

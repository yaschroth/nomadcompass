/**
 * Reads Bing Webmaster Tools data for thenomadhq.com.
 *
 * The API key lives in .env.local, which is gitignored, and is NEVER printed. Every URL is
 * scrubbed before it reaches the console or an error message, because the key travels in the query
 * string and an unsanitised error is the usual way a secret ends up in a log or a transcript.
 *
 * Bing's API is the counterpart to IndexNow rather than a replacement: IndexNow pushes changed URLs
 * out, this pulls performance data back. Google Search Console answers the same questions for
 * Google; this is the Bing half, which matters more than its market share suggests because Bing
 * also feeds Copilot, DuckDuckGo and Yahoo.
 *
 * Usage:
 *   node scripts/bing_stats.cjs verify        does the key work, which sites does it cover
 *   node scripts/bing_stats.cjs traffic       clicks and impressions over time
 *   node scripts/bing_stats.cjs queries       top search queries
 *   node scripts/bing_stats.cjs pages         top pages
 *   node scripts/bing_stats.cjs quota         how many URLs may still be submitted today
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://thenomadhq.com';

function readKey() {
  const f = path.join(ROOT, '.env.local');
  if (!fs.existsSync(f)) { console.error('.env.local is missing.'); process.exit(1); }
  const m = fs.readFileSync(f, 'utf8').match(/^\s*BING_WEBMASTER_API_KEY\s*=\s*(.+?)\s*$/m);
  if (!m) { console.error('BING_WEBMASTER_API_KEY not found in .env.local'); process.exit(1); }
  const k = m[1].replace(/^["']|["']$/g, '');
  if (!k || k === 'PLATZHALTER') { console.error('BING_WEBMASTER_API_KEY is still the placeholder.'); process.exit(1); }
  return k;
}
const KEY = readKey();

// Anything that might carry the key to a human-readable surface goes through this first.
const scrub = (s) => String(s).split(KEY).join('<key>');

const call = (method, params = {}) => new Promise((res, rej) => {
  const q = new URLSearchParams({ ...params, apikey: KEY });
  const url = 'https://ssl.bing.com/webmaster/api.svc/json/' + method + '?' + q;
  https.get(url, { headers: { 'Content-Type': 'application/json' } }, (r) => {
    let b = '';
    r.on('data', (d) => { b += d; });
    r.on('end', () => {
      if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode + ' from ' + method + ': ' + scrub(b).slice(0, 300)));
      let j; try { j = JSON.parse(b); } catch (e) { return rej(new Error('unparseable reply from ' + method + ': ' + scrub(b).slice(0, 200))); }
      if (j.ErrorCode) return rej(new Error(method + ' error ' + j.ErrorCode + ': ' + scrub(j.Message || '')));
      res(j.d !== undefined ? j.d : j);
    });
  }).on('error', (e) => rej(new Error(scrub(e.message))));
});

// Bing returns dates as /Date(1234567890000)/
const asDate = (v) => {
  const m = String(v).match(/\/Date\((\d+)/);
  return m ? new Date(Number(m[1])).toISOString().slice(0, 10) : String(v);
};

const CMD = process.argv[2] || 'verify';

(async () => {
  try {
    if (CMD === 'verify') {
      const sites = await call('GetUserSites');
      const list = Array.isArray(sites) ? sites : [];
      console.log('key works. ' + list.length + ' site(s) on this account:');
      for (const s of list) console.log('  ' + (s.Url || JSON.stringify(s)));
      const ours = list.find((s) => String(s.Url || '').includes('thenomadhq.com'));
      console.log(ours ? '\nthenomadhq.com is present and verified.' : '\nWARNING: thenomadhq.com is not on this account.');
      return;
    }

    if (CMD === 'traffic') {
      const rows = await call('GetRankAndTrafficStats', { siteUrl: SITE });
      const list = (Array.isArray(rows) ? rows : []).map((r) => ({
        date: asDate(r.Date), clicks: r.Clicks, impressions: r.Impressions,
      })).sort((a, b) => a.date.localeCompare(b.date));
      if (!list.length) { console.log('no traffic rows returned yet.'); return; }
      const tot = list.reduce((a, r) => ({ c: a.c + r.clicks, i: a.i + r.impressions }), { c: 0, i: 0 });
      console.log('BING TRAFFIC  ' + list[0].date + ' to ' + list[list.length - 1].date);
      console.log('  ' + tot.i.toLocaleString() + ' impressions, ' + tot.c.toLocaleString() + ' clicks, CTR '
        + (tot.i ? (100 * tot.c / tot.i).toFixed(2) : '0') + '%\n');
      for (const r of list.slice(-14)) {
        console.log('  ' + r.date + '  ' + String(r.impressions).padStart(7) + ' impr  ' + String(r.clicks).padStart(5) + ' clicks');
      }
      return;
    }

    if (CMD === 'queries') {
      const rows = await call('GetQueryStats', { siteUrl: SITE });
      const list = (Array.isArray(rows) ? rows : []).sort((a, b) => b.Impressions - a.Impressions);
      console.log('BING QUERIES  ' + list.length + ' returned\n');
      console.log('  impr  clicks  avgpos  query');
      for (const r of list.slice(0, 40)) {
        console.log('  ' + String(r.Impressions).padStart(5) + '  ' + String(r.Clicks).padStart(6)
          + '  ' + String(r.AvgImpressionPosition ?? '').padStart(6) + '  ' + r.Query);
      }
      return;
    }

    if (CMD === 'pages') {
      const rows = await call('GetPageStats', { siteUrl: SITE });
      const list = (Array.isArray(rows) ? rows : []).sort((a, b) => b.Impressions - a.Impressions);
      console.log('BING PAGES  ' + list.length + ' returned\n');
      console.log('  impr  clicks  page');
      for (const r of list.slice(0, 40)) {
        console.log('  ' + String(r.Impressions).padStart(5) + '  ' + String(r.Clicks).padStart(6) + '  ' + r.Query);
      }
      return;
    }

    if (CMD === 'quota') {
      const q = await call('GetUrlSubmissionQuota', { siteUrl: SITE });
      console.log('URL submission quota: daily ' + q.DailyQuota + ', monthly ' + q.MonthlyQuota);
      return;
    }

    console.error('unknown command: ' + CMD);
    process.exit(1);
  } catch (e) {
    console.error(scrub(e.message));
    process.exit(1);
  }
})();

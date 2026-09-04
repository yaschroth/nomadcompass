require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Downloads the flag SVG for every country in cities-data.js that does not have one yet.
 *
 * apply_flag_svgs.cjs rewrites the hero flag emoji into <img src="/assets/flags/<iso>.svg">, but it
 * never checked that the file exists. Batch 36 added 29 countries with no SVG on disk, so the sweep
 * replaced 30 readable emoji with 30 broken-image icons and reported success. This closes that:
 * run it before apply_flag_svgs.cjs and the file is always there first.
 *
 * Source: flagcdn.com, which publishes the SVGs used for the 125 flags already in assets/flags.
 * Verified byte-identical to the ones on disk, so this adds to that set rather than mixing styles.
 * The flags themselves are national symbols and not copyrightable as such; flagcdn places its
 * renderings in the public domain.
 *
 * Usage:
 *   node scripts/fetch_flag_svgs.cjs           report what is missing
 *   node scripts/fetch_flag_svgs.cjs --apply   download it
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DIR = path.join(ROOT, 'assets', 'flags');

const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();

// A flag emoji is two regional indicator symbols, which ARE the ISO 3166-1 alpha-2 code.
// No lookup table is needed, and none can drift out of date.
const toCode = (emoji) => {
  const pts = [...(emoji || '')];
  if (pts.length !== 2) return null;
  const code = pts.map((p) => String.fromCharCode(p.codePointAt(0) - 0x1f1e6 + 97)).join('');
  return /^[a-z]{2}$/.test(code) ? code : null;
};

const wanted = new Map();
const unreadable = [];
for (const c of CITIES) {
  const code = toCode(c.flag);
  if (!code) { unreadable.push(c.id + ' (' + c.country + ')'); continue; }
  if (!wanted.has(code)) wanted.set(code, c.country);
}

fs.mkdirSync(DIR, { recursive: true });
const missing = [...wanted].filter(([code]) => !fs.existsSync(path.join(DIR, code + '.svg')));

console.log(wanted.size + ' distinct country flags used by ' + CITIES.length + ' cities, '
  + (wanted.size - missing.length) + ' already on disk, ' + missing.length + ' missing');
if (unreadable.length) console.log('  no readable flag emoji: ' + unreadable.join(', '));
if (!missing.length) { console.log('  nothing to fetch.'); process.exit(0); }
for (const [code, country] of missing) console.log('  ' + code + '.svg  ' + country);
if (!APPLY) { console.log('\nDRY-RUN. Re-run with --apply to download.'); process.exit(0); }

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'user-agent': 'thenomadhq-build' } }, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return get(res.headers.location).then(resolve, reject); }
    if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
    const chunks = [];
    res.on('data', (d) => chunks.push(d));
    res.on('end', () => resolve(Buffer.concat(chunks)));
  }).on('error', reject);
});

(async () => {
  let ok = 0;
  const failed = [];
  for (const [code, country] of missing) {
    try {
      const buf = await get('https://flagcdn.com/' + code + '.svg');
      // A 404 page or an error body would sail straight into assets/ and render as nothing.
      if (buf.length < 80 || !buf.slice(0, 400).toString('utf8').includes('<svg')) {
        throw new Error('not an SVG (' + buf.length + ' bytes)');
      }
      fs.writeFileSync(path.join(DIR, code + '.svg'), buf);
      ok++;
    } catch (e) {
      failed.push(code + ' (' + country + '): ' + e.message);
    }
  }
  console.log('\ndownloaded ' + ok + ' flag(s) into assets/flags');
  if (failed.length) {
    console.error('FAILED, and these city pages will show a broken image:');
    for (const f of failed) console.error('  ' + f);
    process.exitCode = 1;
  }
})();

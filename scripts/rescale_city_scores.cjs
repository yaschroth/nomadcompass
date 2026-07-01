/**
 * The Nomad Score (raw average of 13 category scores) compresses to ~5.0-7.6 —
 * almost no variance. This sweep rewrites calculateNomadScore in every city page
 * to rescale that raw average (z-score -> mean 6.9, sd 1.05, clamped 2.5-9.9) so
 * top/bottom cities actually stand out. Monotonic, so rankings are unchanged.
 * Idempotent. Usage: node scripts/rescale_city_scores.cjs [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const NEW = `function calculateNomadScore(city, aggregates) {
        var raw;
        if (window.VotingService && aggregates && Object.keys(aggregates).length > 0) {
          raw = parseFloat(window.VotingService.calculateAdjustedNomadScore(city, aggregates));
        } else {
          const cats = getCategoryKeys();
          raw = cats.reduce((s, k) => s + city.scores[k], 0) / cats.length;
        }
        // Calibrated composite: the raw average of 13 categories compresses to ~5-7.6,
        // so rescale (z-score to mean 6.9, sd 1.05, clamped) for real spread. Monotonic.
        return Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
      }`;

const RE = /function calculateNomadScore\(city, aggregates\) \{[\s\S]*?\.length\)\.toFixed\(1\);\s*\n\s*\}/;

let changed = 0, already = 0, nomatch = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(ROOT, 'cities', f);
  let s = fs.readFileSync(abs, 'utf8');
  if (/6\.9 \+ \(raw - 6\.47\)/.test(s)) { already++; continue; }
  if (!RE.test(s)) { nomatch++; continue; }
  const out = s.replace(RE, () => NEW);
  if (out !== s) { if (!DRY) fs.writeFileSync(abs, out); changed++; }
}
console.log(`${DRY ? '[dry] ' : ''}rescaled: ${changed} | already done: ${already} | NO MATCH: ${nomatch}`);

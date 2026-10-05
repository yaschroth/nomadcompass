/**
 * Gate: no tracked text file may contain a lone carriage return (\r not followed by \n).
 *
 * Git reads a file with a lone \r as binary, stops normalising its line endings and commits the
 * whole file as CRLF, which buried 11 real changed lines under 90,000 lines of churn (TODO 0g).
 * _safe_write.cjs now repairs them on every write, so a hit here names a writer that does not go
 * through it: the sweep that ran last is the suspect.
 *
 * Usage: node scripts/check_line_endings.cjs [--fix]
 *   --fix  turns each lone \r into the line break it was half of, writing in binary
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const TEXT = /\.(html?|js|cjs|mjs|json|css|md|txt|xml|svg)$/i;

const files = execSync('git ls-files -z', { cwd: ROOT, maxBuffer: 1 << 28 }).toString().split('\0').filter((f) => TEXT.test(f));
const hits = [];
for (const f of files) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const b = fs.readFileSync(p);
  let n = 0;
  for (let i = 0; i < b.length; i++) if (b[i] === 13 && b[i + 1] !== 10) n++;
  if (!n) continue;
  hits.push([f, n]);
  if (FIX) {
    const out = [];
    for (let i = 0; i < b.length; i++) out.push(b[i] === 13 && b[i + 1] !== 10 ? 10 : b[i]);
    fs.writeFileSync(p, Buffer.from(out));
  }
}
if (!hits.length) { console.log(`clean: no lone carriage return in ${files.length} tracked text files.`); process.exit(0); }
console.log(`${hits.length} file(s) with a lone carriage return${FIX ? ' (fixed)' : ''}:`);
hits.slice(0, 40).forEach(([f, n]) => console.log(`  ${f}: ${n}`));
process.exit(FIX ? 0 : 1);

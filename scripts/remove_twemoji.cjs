require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Removes the twemoji CDN dependency sitewide. Every emoji it used to upgrade is now a
 * self-hosted line-icon (assets/icons.svg) or flag SVG, so twemoji is dead weight + a third-party
 * CDN. Strips, per file type:
 *   - the <!-- Twemoji ... --> comment + <script src="...jsdelivr...twemoji..."> include (all pages)
 *   - the standalone DOMContentLoaded twemoji.parse(document.body) <script> block (city pages, blog)
 *   - the inline twemoji.parse(resultsGrid) guard (wheel)
 * Idempotent + CRLF-aware. Pass --dry to only report match counts.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const INCLUDE = /[ \t]*<!-- Twemoji[^\n>]*-->\r?\n[ \t]*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@?twemoji[^"]*"[^>]*><\/script>\r?\n/g;
const CITYPARSE = /[ \t]*<script>\r?\n[ \t]*document\.addEventListener\('DOMContentLoaded', function\(\) \{\r?\n[ \t]*if \(typeof twemoji[^\n]*\r?\n[ \t]*twemoji\.parse\(document\.body[^\n]*\r?\n[ \t]*\}\r?\n[ \t]*\}\);\r?\n[ \t]*<\/script>[ \t]*(?:\r?\n)?/g;
const BLOGPARSE = /[ \t]*<!-- Parse emojis with Twemoji -->\r?\n[ \t]*<script>\r?\n[ \t]*if \(typeof twemoji[^\n]*\r?\n[ \t]*twemoji\.parse\(document\.body[^\n]*\r?\n[ \t]*\}\r?\n[ \t]*<\/script>\r?\n/g;
const WHEELGUARD = /\r?\n[ \t]*\/\/ Parse emoji flags with Twemoji[^\n]*\r?\n[ \t]*if \(typeof twemoji[^\n]*\r?\n[ \t]*twemoji\.parse\(resultsGrid[^\n]*\r?\n[ \t]*\}\r?\n/g;
// Dead twemoji output-image sizing style (no img.emoji elements exist once twemoji is gone).
const EMOJISTYLE = /[ \t]*<!-- Twemoji emoji sizing -->\r?\n[ \t]*<style>\r?\n[ \t]*img\.emoji \{[\s\S]*?\}\r?\n[ \t]*<\/style>\r?\n/g;

function cnt(re, s) { const m = s.match(re); return m ? m.length : 0; }

function processFile(abs, extraRes) {
  let s = fs.readFileSync(abs, 'utf8');
  const EOL = s.includes('\r\n') ? '\r\n' : '\n';
  const before = s;
  const counts = { include: cnt(INCLUDE, s), emojiStyle: cnt(EMOJISTYLE, s) };
  s = s.replace(INCLUDE, '');
  s = s.replace(EMOJISTYLE, '');
  for (const [name, re, repl] of extraRes) {
    counts[name] = cnt(re, s);
    s = s.replace(re, repl === undefined ? '' : repl.replace(/\n/g, EOL));
  }
  if (!DRY && s !== before) fs.writeFileSync(abs, s);
  return { counts, changed: s !== before };
}

let cityChanged = 0, cityParse = 0, cityInc = 0, stillTwemoji = [];
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const abs = path.join(ROOT, 'cities', f);
  const r = processFile(abs, [['parse', CITYPARSE]]);
  if (r.changed) cityChanged++;
  cityParse += r.counts.parse; cityInc += r.counts.include;
  if (/twemoji/i.test(fs.readFileSync(abs, 'utf8'))) stillTwemoji.push('cities/' + f);
}
console.log(`city pages: changed ${cityChanged}, includes removed ${cityInc}, parse blocks removed ${cityParse}`);

for (const [file, extras] of [
  ['index.html', []],
  ['wheel.html', [['wheelGuard', WHEELGUARD, '\n']]],
  ['blog.html', [['blogParse', BLOGPARSE]]],
]) {
  const abs = path.join(ROOT, file);
  const r = processFile(abs, extras);
  console.log(`${file}: ${JSON.stringify(r.counts)} changed=${r.changed}`);
  if (/twemoji/i.test(fs.readFileSync(abs, 'utf8'))) stillTwemoji.push(file);
}

if (stillTwemoji.length) console.log(`STILL references twemoji (${stillTwemoji.length}): ${stillTwemoji.slice(0, 6).join(', ')}`);
else console.log('no twemoji references remain');

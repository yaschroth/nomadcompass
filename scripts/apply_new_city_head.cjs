require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Adds the two things generate_city_pages.js does not write and every established city page has:
 * the canonical link, and the city-blog-articles script that pulls in related posts.
 *
 * Written down as a script because it has been done by hand twice, once per batch, and the anchor
 * is not obvious: the blog script goes before </body>, not into the head, and not after the
 * "<!-- cc -->" comment that looks like the right place.
 *
 * Idempotent: a page that already has either is left alone for that part.
 *
 * Usage: node scripts/apply_new_city_head.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const m = {};
new Function('m', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';m.d=CITIES')(m);

let canon = 0, blog = 0, already = 0, noAnchor = [];

for (const c of m.d) {
  const file = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  if (!/rel="canonical"/.test(html)) {
    // Straight after the last existing <link ...> in the head, which is where the generated
    // pages put their stylesheets.
    const link = '  <link rel="canonical" href="https://thenomadhq.com/cities/' + c.id + '">';
    const at = html.lastIndexOf('</head>');
    if (at < 0) { noAnchor.push(c.id + ' (no </head>)'); continue; }
    html = html.slice(0, at) + link + '\n' + html.slice(at);
    canon++;
  }

  if (!html.includes('city-blog-articles.js')) {
    const at = html.lastIndexOf('</body>');
    if (at < 0) { noAnchor.push(c.id + ' (no </body>)'); continue; }
    html = html.slice(0, at) + '  <script src="../scripts/city-blog-articles.js"></script>\n'
      + html.slice(at);
    blog++;
  }

  if (html === before) { already++; continue; }
  if (APPLY) fs.writeFileSync(file, html);
}

console.log('canonical added: ' + canon + ' | blog script added: ' + blog
  + ' | already complete: ' + already
  + (noAnchor.length ? ' | NO ANCHOR: ' + noAnchor.join(', ') : ''));
if (!APPLY) console.log('Dry run. Re-run with --apply to write.');

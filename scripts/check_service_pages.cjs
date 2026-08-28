/**
 * The gate on the services page family.
 *
 * It exists because of one failure. A reader searched for German-speaking doctors in Barcelona,
 * landed on the page that holds eleven of them, and read the heading "English and French-speaking
 * doctors in Barcelona". The page was right and its heading was wrong, which is worse than a page
 * that is simply missing: it turns a good answer away at the door.
 *
 * So the two assertions that matter here are about agreement between what a page says and what it
 * holds. A page may not name a language it does not list, and it may not stay silent about a
 * language it does list. Everything else in this file is ordinary structural hygiene.
 *
 * Usage: node scripts/check_service_pages.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));

const problems = [];
const note = (file, msg) => problems.push(file + ': ' + msg);

const manifests = ['data/service-city-pages.json', 'data/service-pair-pages.json', 'data/service-hub-pages.json', 'data/service-lang-pages.json', 'data/service-city-lang-pages.json', 'data/service-language-pages.json', 'data/service-country-pages.json']
  .map((f) => path.join(ROOT, f))
  .filter((f) => fs.existsSync(f))
  .flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')));

if (!manifests.length) {
  console.error('check_service_pages: no manifest found. Run the generators first.');
  process.exit(1);
}

// The city manifest keys a page by slug where the others key by url and file. One shape here, so
// the orphan check and the page loop cannot disagree about what exists.
const pages = manifests.map((r) => (r.slug && !r.url
  ? Object.assign({}, r, { url: '/services/' + r.slug, file: 'services/' + r.slug + '.html', city: r.slug })
  : r));

// Every language name the dataset knows, so a heading can be read for the languages it claims.
const LANG_NAMES = Object.entries(M.LANGS).map(([code, name]) => ({ code, name }));

const titles = new Map();
const descs = new Map();
let checked = 0;

for (const row of pages) {
  const file = path.join(ROOT, row.file);
  if (!fs.existsSync(file)) { note(row.url, 'in the manifest but not on disk'); continue; }
  const html = fs.readFileSync(file, 'utf8');
  checked++;

  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const text = html.replace(/<[^>]+>/g, ' ');

  if (!h1.trim()) note(row.url, 'has no h1');
  if (canonical !== BASE + row.url) note(row.url, 'canonical is ' + canonical + ', expected ' + BASE + row.url);
  if (title.replace(/ \| The Nomad HQ$/, '').trim() === h1.trim()) {
    note(row.url, 'title and h1 are the same string');
  }
  if (titles.has(title)) note(row.url, 'shares its title with ' + titles.get(title));
  else titles.set(title, row.url);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (descs.has(desc)) note(row.url, 'shares its meta description with ' + descs.get(desc));
  else descs.set(desc, row.url);

  // --- the two that matter --------------------------------------------------------------------
  const pair = M.pairOf(row.city, row.service);
  if (pair) {
    const rows = row.language ? pair.rows.filter((r) => r.languages.includes(row.language)) : pair.rows;
    const held = {};
    rows.forEach((r) => r.languages.forEach((l) => { held[l] = (held[l] || 0) + 1; }));

    const namedInH1 = LANG_NAMES.filter((l) => new RegExp('\\b' + l.name + '\\b').test(h1)).map((l) => l.code);
    const claimedButAbsent = namedInH1.filter((code) => !held[code]);
    if (claimedButAbsent.length) {
      note(row.url, 'the heading names ' + claimedButAbsent.map((c) => M.LANGS[c]).join(', ') +
        ' but no provider on the page is listed as working in it');
    }

    // The search result is a surface too, and it was the one that failed. A reader looking for
    // German-speaking doctors in Barcelona saw a title about English and French and never clicked
    // the page holding eleven of them, so a language the page can serve has to be visible in the
    // title or the description, not only in the body.
    const localForSerp = M.LOCAL[pair.country];
    const servable = Object.entries(held).filter(([l, n]) => l !== localForSerp && n >= 2).map(([l]) => l);
    const inSerp = (code) => new RegExp('\\b' + M.LANGS[code] + '\\b').test(title + ' ' + desc);
    const invisible = servable.filter((code) => !inSerp(code));
    if (invisible.length) {
      note(row.url, 'serves ' + invisible.map((c) => held[c] + ' providers in ' + M.LANGS[c]).join(', ') +
        ', and neither the title nor the description says so');
    }

    // A language on two or more of the page's providers has to be findable on the page itself, in
    // the heading or in a section heading. Two rows is the point at which it stops being a curiosity.
    const local = M.LOCAL[pair.country];
    const shouldName = Object.entries(held).filter(([l, n]) => l !== local && n >= 2).map(([l]) => l);
    const silent = shouldName.filter((code) => !new RegExp('\\b' + M.LANGS[code] + '\\b').test(text));
    if (silent.length) {
      note(row.url, 'lists ' + silent.map((c) => held[c] + ' providers working in ' + M.LANGS[c]).join(', ') +
        ' and never says so anywhere on the page');
    }

    // The count in the standfirst has to be the count of what is rendered.
    // A page may show fewer cards than it holds, but only if it says so: Spain's register puts 759
    // sworn translators in Madrid and a page listing them all is a phone book. What it may not do is
    // drop rows silently, which is what happened when providers recorded only in the local language
    // belonged to no language section.
    const cards = (html.match(/class="sv-card /g) || []).length;
    const uniqueNames = new Set(rows.map((r) => r.name)).size;
    // A page of a series says it too, in the pager that names which page it is and links the rest.
    const saysSo = /class="svp-capped|class="svp-pager/.test(html);
    if (cards < uniqueNames && !saysSo) {
      note(row.url, 'renders ' + cards + ' cards for ' + uniqueNames + ' providers and does not say it is showing a subset');
    }
  }

  // No internal link may carry a query string: that was the old, unindexable way of asking.
  const q = (html.match(/href="\/services\/[^"]*\?[^"]*"/g) || []);
  if (q.length) note(row.url, q.length + ' internal link(s) still carry a query string, e.g. ' + q[0]);

  if (/&mdash;|—/.test(html)) note(row.url, 'contains an em-dash');
}

// A page on disk that no manifest claims is an orphan: nothing links to it and nothing removes it.
const onDisk = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) onDisk.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(path.join(ROOT, 'services'));
const claimed = new Set(pages.map((r) => r.file.split(path.sep).join('/')));
const orphans = onDisk.filter((f) => !claimed.has(f));
orphans.forEach((f) => note(f, 'is on disk but in no manifest'));

// Every internal link into the directory has to land on a file. 172 did not: the sibling and
// nearby-city chips pointed at child pages for single-service cities, which never get one, and at
// pairs the word floor held back. A link to a page we chose not to create is our mistake.
{
  const onDiskSet = new Set(onDisk);
  const resolves = (url) => {
    const rel = url.replace(/^\//, '').split('#')[0].split('?')[0];
    return onDiskSet.has(rel + '.html') || onDiskSet.has(rel) || fs.existsSync(path.join(ROOT, rel + '.html'));
  };
  const dead = new Map();
  for (const f of onDisk) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of html.matchAll(/href="(\/services\/[^"#?]*)"/g)) {
      if (!resolves(m[1])) dead.set(m[1], (dead.get(m[1]) || 0) + 1);
    }
  }
  [...dead.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([url, n]) => note(url, 'is linked ' + n + ' times and does not exist'));
}

// Vercel would serve services/<city>/index.html and services/<city>.html at the same clean URL.
onDisk.filter((f) => /\/index\.html$/.test(f)).forEach((f) => note(f, 'would collide with the city page URL'));

if (problems.length) {
  console.error('check_service_pages: ' + problems.length + ' problem(s) across ' + checked + ' pages');
  problems.slice(0, 40).forEach((p) => console.error('  - ' + p));
  if (problems.length > 40) console.error('  ... and ' + (problems.length - 40) + ' more');
  process.exit(1);
}
console.log('check_service_pages: ' + checked + ' pages, no page names a language it lacks or hides one it holds.');

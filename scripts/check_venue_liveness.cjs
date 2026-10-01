/**
 * A venue the liveness check found closed must not come back onto a city page.
 *
 * On 2026-09-29 several closed coworking spaces were found on city pages only by chance (Hubba
 * Ekkamai in Bangkok had closed in 2020, Dojo Bali in 2022). The 2026-10-01 liveness pass then
 * checked every card on every city page against OpenStreetMap and the venue's own website, and
 * removed the ones with evidence of closure. data/venue-closures.json is the log of that pass:
 * one entry per removed venue, with the evidence URL.
 *
 * The cards are written by generators (apply_city_venues.cjs, apply_city_stays.cjs) from research
 * files that still contain those venues, so a regenerated page would quietly put them back. This
 * gate is what stops that.
 *
 * What it flags, for each logged venue, on that venue's own city page:
 *   - a card (cowork-card, stay-card or eat-card) whose name is the venue's name;
 *   - a prose mention of the name in a sentence that does not say it closed. Sentences such as
 *     "Dojo Bali closed in December 2022" are the warning a reader needs and are allowed.
 * It also checks data/guide-content.json (the prose source for expansion cities) and every blog
 * post, with the same closed-context rule.
 *
 * Report-only by default (exit 0). --strict exits 1 when anything is flagged.
 *
 * Usage: node scripts/check_venue_liveness.cjs [--strict] [--root <dir>]
 *   --root points the check at another copy of the site (used to test it on a pre-fix page).
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const rootIdx = args.indexOf('--root');
const ROOT = rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : path.resolve(__dirname, '..');
const LOG = path.resolve(__dirname, '..', 'data', 'venue-closures.json');

const decode = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const norm = (s) => decode(s).normalize('NFC').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Words that mark a sentence as reporting the closure rather than recommending the venue.
const CLOSED_CONTEXT = /\b(closed|closing|shut|no longer|ceased|defunct|former(ly)?|used to|permanently)\b/i;

// A sentence naming the venue is allowed when it, or the sentence right after it, reports the
// closure: "Hubud is the name you will still meet in older guides. Its own site has said for
// years that it closed." is a warning, not a recommendation.
function sentencesWith(text, name) {
  const plain = norm(text.replace(/<[^>]+>/g, ' '));
  const n = norm(name);
  const re = new RegExp('(^|[^a-z0-9])' + esc(n) + '($|[^a-z0-9])');
  const out = [];
  const ss = plain.split(/(?<=[.!?])\s+/);
  ss.forEach((s, i) => {
    if (re.test(s) && !CLOSED_CONTEXT.test(s) && !CLOSED_CONTEXT.test(ss[i + 1] || '')) out.push(s);
  });
  return out;
}

function cardNames(html) {
  const names = [];
  const re = /<article class="(cowork-card|stay-card|eat-card)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const nm = (m[2].match(/class="(?:cowork|stay|eat)-card-name">([^<]*)</) || [])[1];
    if (nm) names.push({ card: m[1], name: nm });
  }
  return names;
}

// The cards are removed from the page body. Strip them before the prose scan so a card is
// reported once, as a card, and not again as a sentence.
const stripCards = (html) => html.replace(/<article class="(?:cowork-card|stay-card|eat-card)">[\s\S]*?<\/article>/g, ' ');
// Head metadata and scripts are not prose a reader sees as a recommendation.
const bodyOf = (html) => {
  const b = html.split(/<body[^>]*>/i)[1] || html;
  return b.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
};

const log = JSON.parse(fs.readFileSync(LOG, 'utf8'));
const closed = (log.venues || []).filter((v) => v.action === 'removed');

const problems = [];
const guidePath = path.join(ROOT, 'data', 'guide-content.json');
const guide = fs.existsSync(guidePath) ? JSON.parse(fs.readFileSync(guidePath, 'utf8')) : {};
const blogDir = path.join(ROOT, 'blog');
const blogs = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir).filter((f) => f.endsWith('.html')).map((f) => ({ f: 'blog/' + f, html: fs.readFileSync(path.join(blogDir, f), 'utf8') }))
  : [];

for (const v of closed) {
  const file = path.join(ROOT, 'cities', v.slug + '.html');
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const c of cardNames(html)) {
      if (norm(c.name) === norm(v.name)) problems.push(`cities/${v.slug}.html: ${c.card} "${v.name}" is back (closed: ${v.evidenceUrl})`);
    }
    for (const n of [v.name, ...(v.proseNames || [])]) {
      for (const s of sentencesWith(stripCards(bodyOf(html)), n)) {
        problems.push(`cities/${v.slug}.html: prose names "${n}" without saying it closed: "${s.slice(0, 160)}"`);
      }
    }
  }
  const g = guide[v.slug];
  if (g) {
    for (const n of [v.name, ...(v.proseNames || [])]) {
      for (const s of sentencesWith(JSON.stringify(g).replace(/\\n/g, ' '), n)) {
        problems.push(`data/guide-content.json [${v.slug}]: names "${n}": "${s.slice(0, 160)}"`);
      }
    }
  }
  // Blog posts: only flag a post that also names the venue's city, so a common venue name
  // ("The Hub") in an unrelated article is not reported.
  for (const b of blogs) {
    const text = bodyOf(b.html);
    if (!norm(text).includes(norm(v.city))) continue;
    for (const n of [v.name, ...(v.proseNames || [])]) {
      for (const s of sentencesWith(text, n)) problems.push(`${b.f}: names "${n}" (${v.city}): "${s.slice(0, 160)}"`);
    }
  }
}

console.log(`check_venue_liveness: ${closed.length} venues logged closed, ${problems.length} problem(s)`);
for (const p of problems) console.log('  ' + p);
if (STRICT && problems.length) process.exit(1);

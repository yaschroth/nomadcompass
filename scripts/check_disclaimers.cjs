/**
 * Legal cover belongs on a legal page, not in the middle of what a reader came for.
 *
 * WHY THIS EXISTS
 *
 * Owner's rule, 2026-09-18: "wir können solche rechtlichen/absicherungsdinge auf irgendeiner der
 * rechtsseiten oder im footer schreiben, aber nicht im clientfacing content". At the time the site
 * carried a YMYL paragraph on 1,200 pages, 758 sentences saying something was not a recommendation,
 * 841 saying a claim was roster-level, 340 about paid placement and 330 saying we had not visited
 * anyone. None of it was information. All of it is on /terms, which the footer links from every
 * page of the site.
 *
 * WHY IT READS SCRIPTS AND JSON-LD NOW (2026-09-29)
 *
 * The first version stripped every <script> block before matching, and knew a handful of
 * phrasings. It reported the site clean while about 1,800 hedge sentences and clauses sat on
 * roughly 1,000 pages, plus a "check current rental listings" line on 670 cost-basis notes:
 * "Always verify current entry requirements with the Ghana Immigration Service before travel, as
 * rules change", "treat this as an editorial overview rather than legal advice", "German is kept
 * here ... and is worth confirming before you rely on it". Most were in plain text and simply
 * worded differently from anything the gate knew. About 370 more sat where it could not look:
 *
 *   1. A city page's score tiles are not in the HTML. They render from an inline
 *      `CATEGORY_DESCRIPTIONS = {...}` object, so stripping scripts stripped every tile.
 *   2. FAQ answers live twice, once visible and once in application/ld+json, and the JSON-LD copy
 *      is what a search engine quotes. Stripping scripts stripped that too.
 *
 * So the tile object and every ld+json block are now PARSED (not regex-scraped) and their strings
 * are checked like visible text. If either no longer parses, that is reported too, because a
 * broken tile object blanks every tile on the page.
 *
 * The new shapes are the verify-it-yourself family: "confirm/verify/check the current rules ...",
 * "always confirm with the embassy", "rather than legal advice", "editorial orientation",
 * "before you rely on it", and the "as rules change" tail. Telling the reader to go and re-check
 * what the page just told them is cover, not information: the page either knows the rule or says
 * what it does not know.
 *
 * This is a phrasing gate, so it is deliberately narrow. It matches the shapes that only ever occur
 * as cover, and not the ones that can be real content: "entirely at your own risk" is a true thing
 * to say about riding on the back of a jeepney in Salento, "what should I verify locally" is a
 * reasonable FAQ heading, "always confirm the meter is running" is how you take a taxi, "check the
 * last bus before setting off" is a plan, "an abogado gives legal advice" is a job description, and
 * "set up a mobile data plan before you rely on any villa's wifi" is advice. The verify family
 * therefore only fires when the thing to be re-checked is a rule, a requirement or an official
 * source, never a timetable, a meter or a menu. A gate that cried wolf on those would be turned off
 * within a week.
 *
 * Usage: node scripts/check_disclaimers.cjs [--list] [--root <dir>]
 *   --root lets the gate be pointed at a copy of the site (used to prove it fails on a page that
 *   still hedges).
 */
const fs = require('fs');
const path = require('path');

const argRoot = process.argv.indexOf('--root');
const ROOT = argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.resolve(__dirname, '..');

// The pages whose job this is. A disclaimer here is the point.
const ALLOWED = new Set(['terms.html', 'privacy.html', 'legal-notice.html', 'disclosure.html',
  'methodology.html', '404.html']);

const PATTERNS = [
  [/\bis not a recommendation\b/i, 'says something is not a recommendation'],
  [/\bnot a recommendation from us\b/i, 'says something is not a recommendation'],
  [/\bwithout endorsing\b|\bdoes not (?:constitute|amount to) an endorsement\b/i, 'disclaims endorsement'],
  [/\bneither the [^.]{0,40}\bendorses\b/i, 'disclaims endorsement'],
  [/\bwithout (?:a )?guarantee of (?:accuracy|the service)\b/i, 'disclaims a guarantee'],
  [/\bgives no warranty\b/i, 'disclaims a guarantee'],
  [/\bnot (?:legal|medical|financial|tax|immigration) advice\b/i, 'a not-advice disclaimer'],
  [/\b(?:rather than|not|and not|nor)\s+(?:formal\s+)?(?:legal|medical|financial|tax|immigration|safety)(?:\s*(?:,|or|and)\s*(?:legal|medical|financial|tax|immigration|safety))*\s+(?:advice|guidance)\b/i, 'a not-advice disclaimer'],
  [/\beditorial,? not legal\b/i, 'a not-advice disclaimer'],
  [/\bnothing (?:here|in this (?:guide|article|post)) is (?:legal|medical|financial|tax|immigration|visa) advice\b/i, 'a not-advice disclaimer'],
  [/\bnot a substitute for (?:professional|qualified|legal|medical|tax)\b/i, 'a not-advice disclaimer'],
  [/\beditorial (?:overview|orientation|background|context)\b|\beditorial guidance (?:only|rather than|to prompt)\b|\b(?:treat|this is) (?:this|it|everything here|all of this) as (?:an? )?(?:general )?editorial\b/i, 'labels itself as editorial cover'],
  [/\bprompt to verify\b|\bprompt your own research\b/i, 'tells the reader to verify it themselves'],
  [/\bwe have not (?:called or )?visited\b/i, 'says what we have not done'],
  [/\bwe hold no view\b|\bwe make no judgement\b/i, 'says what we have no view on'],
  [/\bnothing (?:further|more specific) is claimed\b/i, 'says what is not claimed'],
  [/\bmay be paid placement\b|\bmay sell placement\b|\bhas paid to appear\b/i, 'a paid-placement caveat'],
  [/\bclaim about (?:the|a) roster rather than\b/i, 'a roster-level caveat'],
  [/\bread that tier with more caution\b|\bwith more caution than the rest\b/i, 'tells the reader to be careful'],
  [/\btreat (?:each|every|this) one as a claim\b/i, 'tells the reader how to treat the data'],
  // the verify-it-yourself family: only when what is to be re-checked is a rule or an official source
  [/\b(?:confirm|verify|check|double-check)(?:ing)?\b[^.;:]{0,60}?\b(?:current|latest|up-to-date)\b[^.;:]{0,50}?\b(?:rules?|requirements?|terms|entry|visa|thresholds?|eligibility|allowance|regulations|guidance|advisor(?:y|ies)|travel advice|immigration|conditions for your|criteria)\b/i, 'tells the reader to re-check the rules'],
  [/\b(?:always|please)\s+(?:verify|confirm|check|double-check)\b[^.;]{0,80}?\b(?:current|latest|official|officially|embassy|consulate|immigration|requirements?|rules|eligibility|allowance|status|situation|terms)\b/i, 'tells the reader to re-check the rules'],
  [/\b(?:verify|confirm|check)\b[^.;]{0,50}?\bwith (?:an? |the )?official (?:sources?|channels?|government sources?|source)\b/i, 'tells the reader to re-check with an official source'],
  [/\b(?:verify|confirm)\b[^.;]{0,60}?\bofficially\b/i, 'tells the reader to re-check with an official source'],
  // "before relying on it FOR calls" is a plan (test the room first); "confirm ... before you rely on
  // it" is cover. Only the second fires.
  [/\bworth (?:confirming|verifying) before (?:you )?rel(?:y|ying) on\b|\b(?:confirm|verify)(?:ing)?\b[^.;]{0,160}?\bbefore (?:you )?rel(?:y|ying) on (?:it|them|this|any of (?:this|it|them)|anything here|any figure here|any detail here|any single [a-z]+)\b(?!\s+for\b)/i, 'a before-you-rely-on-it caveat'],
  // not "as conditions shift": that is weather
  [/,?\s+as (?:rules|policies|policy|requirements|regulations|entry rules|immigration rules|visa rules|thresholds|entry conditions)(?: and [a-z ]{3,30})? (?:can |may |do |often |frequently |periodically )?(?:change|shift|evolve|update)s?\b/i, 'an as-rules-change tail'],
];

// Scripts and styles are not read by anyone, EXCEPT the two that render reader-facing text: the
// tile object and ld+json. Those are parsed and checked below; everything else is stripped.
const STRIP = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const TAGS = /<[^>]+>/g;
const ENT = { nbsp: ' ', amp: '&', rsquo: '’', lsquo: '‘', ldquo: '"', rdquo: '"', quot: '"', '#39': "'", '#8217': '’' };
const decode = (s) => s.replace(/&(#?\w+);/g, (m, k) => (ENT[k] !== undefined ? ENT[k] : m));

function balancedObject(src, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  return null;
}
function strings(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => strings(v, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (!/^(?:@id|@type|@context|url|image|logo|sameAs|contentUrl|thumbnailUrl)$/.test(k)) strings(v, out); }
  return out;
}

// Returns [{where, text}] for one page: visible text, each tile, each ld+json string.
function readerText(html, rel, problems) {
  const out = [{ where: 'page', text: decode(html.replace(STRIP, ' ').replace(TAGS, ' ')) }];
  const tileRe = /CATEGORY_DESCRIPTIONS\s*=\s*\{/g;
  let m;
  while ((m = tileRe.exec(html))) {
    const obj = balancedObject(html, m.index + m[0].length - 1);
    try {
      for (const [k, v] of Object.entries(JSON.parse(obj))) if (typeof v === 'string') out.push({ where: 'tile ' + k, text: decode(v.replace(TAGS, ' ')) });
    } catch (e) { problems.push({ rel, why: 'the score-tile object no longer parses', quote: e.message }); }
  }
  const ldRe = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = ldRe.exec(html))) {
    try { for (const s of strings(JSON.parse(m[1]))) out.push({ where: 'ld+json', text: decode(s.replace(TAGS, ' ')) }); }
    catch (e) { problems.push({ rel, why: 'an ld+json block no longer parses', quote: e.message }); }
  }
  return out;
}

const hits = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (ALLOWED.has(rel)) continue;
    const html = fs.readFileSync(p, 'utf8');
    if (/class="ymyl-note"/i.test(html.replace(STRIP, ' '))) hits.push({ rel, why: 'a YMYL disclaimer block', quote: 'class="ymyl-note"' });
    for (const { where, text } of readerText(html, rel, hits)) {
      for (const [re, why] of PATTERNS) {
        const mm = re.exec(text);
        if (mm) hits.push({ rel, why: why + (where === 'page' ? '' : ' (' + where + ')'), quote: text.slice(Math.max(0, mm.index - 60), mm.index + 110).replace(/\s+/g, ' ') });
      }
    }
  }
}
walk(ROOT);

if (!hits.length) {
  console.log('check_disclaimers: clean. No page outside the legal pages hedges at the reader, in its text, its tiles or its JSON-LD.');
  process.exit(0);
}

const byWhy = new Map();
hits.forEach((h) => { const k = h.why.replace(/ \(.*\)$/, ''); byWhy.set(k, (byWhy.get(k) || 0) + 1); });
const pages = new Set(hits.map((h) => h.rel)).size;
console.error(`check_disclaimers: ${hits.length} finding(s) on ${pages} page(s): legal cover in client-facing content`);
[...byWhy.entries()].sort((a, b) => b[1] - a[1]).forEach(([why, n]) => console.error(`  ${n}  ${why}`));
const show = process.argv.includes('--list') ? hits : hits.slice(0, 8);
show.forEach((h) => {
  console.error(`  ${h.rel}: ${h.why}`);
  console.error(`    ...${h.quote}...`);
});
if (!process.argv.includes('--list') && hits.length > 8) console.error(`  ... and ${hits.length - 8} more, use --list`);
console.error('  It belongs on /terms, which the footer links from every page.');
process.exit(1);

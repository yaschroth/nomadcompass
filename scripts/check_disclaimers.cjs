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
 * This is a phrasing gate, so it is deliberately narrow. It matches the shapes that only ever occur
 * as cover, and not the ones that can be real content: "entirely at your own risk" is a true thing
 * to say about riding on the back of a jeepney in Salento, and "what should I verify locally" is a
 * reasonable FAQ heading. A gate that cried wolf on those would be turned off within a week.
 *
 * Usage: node scripts/check_disclaimers.cjs [--list]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// The pages whose job this is. A disclaimer here is the point.
const ALLOWED = new Set(['terms.html', 'privacy.html', 'legal-notice.html', 'disclosure.html',
  'methodology.html', '404.html']);

const PATTERNS = [
  [/\bis not a recommendation\b/i, 'says something is not a recommendation'],
  [/\bnot a recommendation from us\b/i, 'says something is not a recommendation'],
  [/\bwithout endorsing\b|\bdoes not (?:constitute|amount to) an endorsement\b/i, 'disclaims endorsement'],
  [/\bneither the [^.]{0,40}\bendorses\b/i, 'disclaims endorsement'],
  [/\bwithout (?:a )?guarantee of (?:accuracy|the service)\b/i, 'disclaims a guarantee'],
  [/\bnot (?:legal|medical|financial|tax|immigration) advice\b/i, 'a not-advice disclaimer'],
  [/\bnot a substitute for (?:professional|qualified|legal|medical|tax)\b/i, 'a not-advice disclaimer'],
  [/\bwe have not (?:called or )?visited\b/i, 'says what we have not done'],
  [/\bwe hold no view\b|\bwe make no judgement\b/i, 'says what we have no view on'],
  [/\bnothing (?:further|more specific) is claimed\b/i, 'says what is not claimed'],
  [/\bmay be paid placement\b|\bmay sell placement\b|\bhas paid to appear\b/i, 'a paid-placement caveat'],
  [/\bclaim about (?:the|a) roster rather than\b/i, 'a roster-level caveat'],
  [/\bread that tier with more caution\b|\bwith more caution than the rest\b/i, 'tells the reader to be careful'],
  [/\btreat (?:each|every|this) one as a claim\b/i, 'tells the reader how to treat the data'],
  [/\bclass="ymyl-note"/i, 'a YMYL disclaimer block'],
];

// Scripts and styles are not read by anyone; a CSS rule named .ymyl-note is dead weight, not a
// disclaimer, and gets reported separately so it can be cleaned without failing the build.
const STRIP = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const TAGS = /<[^>]+>/g;

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
    const text = html.replace(STRIP, ' ').replace(TAGS, ' ');
    for (const [re, why] of PATTERNS) {
      const m = re.source.includes('ymyl-note') ? re.exec(html) : re.exec(text);
      if (m) hits.push({ rel, why, quote: (m.input.slice(Math.max(0, m.index - 60), m.index + 110)).replace(/\s+/g, ' ') });
    }
  }
}
walk(ROOT);

if (!hits.length) {
  console.log('check_disclaimers: clean. No page outside the legal pages hedges at the reader.');
  process.exit(0);
}

const byWhy = new Map();
hits.forEach((h) => byWhy.set(h.why, (byWhy.get(h.why) || 0) + 1));

console.error(`check_disclaimers: ${hits.length} page(s) carry legal cover in client-facing content`);
[...byWhy.entries()].sort((a, b) => b[1] - a[1]).forEach(([why, n]) => console.error(`  ${n}  ${why}`));
const show = process.argv.includes('--list') ? hits : hits.slice(0, 8);
show.forEach((h) => {
  console.error(`  ${h.rel}: ${h.why}`);
  console.error(`    ...${h.quote}...`);
});
if (!process.argv.includes('--list') && hits.length > 8) console.error(`  ... and ${hits.length - 8} more, use --list`);
console.error('  It belongs on /terms, which the footer links from every page.');
process.exit(1);

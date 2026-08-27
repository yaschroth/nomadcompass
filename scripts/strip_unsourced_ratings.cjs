require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Removes venue ratings from the city guide prose, where nothing supports them.
 *
 * The venue CARDS are fine: their ratings come from the triangulated venues dataset and every
 * section now carries a source line saying so. These are different. They sit in the seven long-form
 * guide sections, whose provenance record says in its own words that the figures quoted in the prose
 * were not individually sourced. So there is nothing to attribute them to.
 *
 * That leaves removing them, which is the only option that cannot make things worse. Asserting a
 * source I have not checked would be fabricating the attribution rather than the number, and on a
 * page about trustworthiness that is the same offence wearing a hat.
 *
 * Each rewrite is written out rather than pattern-matched, because a rating sits mid-clause more
 * often than not and cutting it has to leave a sentence behind: "It holds a 4.9/5 rating from
 * members and offers 24/7 access" becomes "It offers 24/7 access", not "It and offers 24/7 access".
 *
 * NOT touched, and worth knowing why:
 *   - "Polished 4.5-star hotel above Queen Street Mall" (Brisbane). A hotel class, not a review.
 *   - Ratings that already name where they came from: OpenTable in Calgary, Trustpilot in Marrakech,
 *     Justdial in Pune, The Coworking Spaces in Salalah. Those are citations and they stay.
 *
 * Usage: node scripts/strip_unsourced_ratings.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const EDITS = [
  ['cali', 'coworking space, rated 4.6 stars and offering 1,500 square meters',
    'coworking space, offering 1,500 square meters'],
  ['cartagena', 'It rates 4.7 out of 5 and is the best daily-rate choice.',
    'It is the best daily-rate choice.'],
  ['clujnapoca', 'is the longest-running and most well-known option, with a 4.6-star rating from nearly 400 reviews.',
    'is the longest-running and most well-known option.'],
  ['guayaquil', ', rated 4.5/5, is a solid choice in the Simon Bolivar area',
    ' is a solid choice in the Simon Bolivar area'],
  ['ipoh', 'No minimum contract. Rated 4.3/5.', 'No minimum contract.'],
  ['jeddah', 'has panoramic Red Sea views and a 4.8 rating from 49 reviews, making it arguably the most consistently praised space in the city.',
    'has panoramic Red Sea views.'],
  ['klaipeda', 'It holds a 4.9/5 rating from members and offers 24/7 access.',
    'It offers 24/7 access.'],
  ['klaipeda', 'free WiFi, great atmosphere, rated 4.6.', 'free WiFi and a good atmosphere.'],
  ['muscat', 'is the pioneer, launched in 2015 and rated 4.3/5.', 'is the pioneer, launched in 2015.'],
  ['podgorica', ' It earns a 4.9-star rating from members.', ''],
  ['rhodes', 'Charming open-sided restaurant with 4.7-star reviews, known for fresh seafood',
    'Charming open-sided restaurant known for fresh seafood'],
  ['riga', 'is community-focused with a 4.7/5 rating and a strong resident tech crowd.',
    'is community-focused with a strong resident tech crowd.'],
  ['riyadh', 'is a startup-focused space rated 4.9/5, open 24/7', 'is a startup-focused space, open 24/7'],
  ['riyadh', 'in Ar Rabi (rated 4.6/5),', 'in Ar Rabi,'],
  ['riyadh', 'in Namar (rated 4.8/5), and', 'in Namar, and'],
  // "best-reviewed" is the rating claim restated in words, so it goes with the figure.
  ['riyadh', 'in Al Maliha (rated 4.7/5) are among the best-reviewed spots for focused work.',
    'in Al Maliha are among the best-known spots for focused work.'],
  ['rotterdam', 'with a 4.9-star rating and strong entrepreneur network.',
    'with a strong entrepreneur network.'],
  ['sanur', 'with rooftop views, coworking events, and a 4.8/5 rating from nearly 300 reviewers.',
    'with rooftop views and coworking events.'],
  ['tampere', 'conference rooms included in membership. Rated 4.8/5 and well reviewed for its atmosphere',
    'conference rooms included in membership'],
  ['verona', 'popular with tech freelancers, rated 4.7 by members.', 'popular with tech freelancers.'],
  ['yogyakarta', 'is the most established option, rated 4.6/5 with over 500 reviews, open daily until midnight',
    'is the most established option, open daily until midnight'],
  ['york', 'on High Ousegate (rated 4.6/5) offers confirmed free WiFi',
    'on High Ousegate offers confirmed free WiFi'],
];

const files = new Map();
let done = 0;
const missed = [];

for (const [id, from, to] of EDITS) {
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(p)) { missed.push(id + ': no page'); continue; }
  if (!files.has(p)) files.set(p, fs.readFileSync(p, 'utf8'));
  const html = files.get(p);
  if (!html.includes(from)) { missed.push(id + ': not found, "' + from.slice(0, 62) + '"'); continue; }
  files.set(p, html.split(from).join(to));
  done += 1;
}

if (APPLY) for (const [p, html] of files) fs.writeFileSync(p, html);

console.log(done + ' of ' + EDITS.length + ' unsourced prose ratings removed across ' + files.size + ' pages');
if (missed.length) {
  console.log('\n  NOT APPLIED:');
  missed.forEach((m) => console.log('    ' + m));
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');

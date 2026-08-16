/**
 * Parses the British High Commission's India list into one record per facility.
 *
 * The list is published as an ODT of about 2,300 lines covering the whole country. Run
 * scripts/odt_text.cjs over it first, then this over the text.
 *
 * Two bugs found while writing it are worth keeping in view, because both produced wrong facts
 * rather than missing ones:
 *
 *   - Keying each facility to the nearest preceding city heading attributed hospitals in Jalandhar
 *     to Amritsar and hospitals in Agra to Udaipur. The list covers many cities the site does not
 *     have, and their headings never reset the pointer. So the city is now read from the facility's
 *     own address, and a block is kept only when exactly one site city appears in it.
 *   - Even then, a trailing sentence from the previous entry ("Located in Amritsar, Punjab and can
 *     provide services to the surrounding areas") leaked into the next entry's header and set its
 *     city. Claim sentences are stripped from the header before the address is read.
 *
 * Usage: node scripts/parse_india_list.cjs <india.txt> <out.json>
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node scripts/parse_india_list.cjs <india.txt> <out.json>'); process.exit(1); }
const raw = fs.readFileSync(IN, 'utf8');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const cities = m.exports.filter((c) => c.country === 'India');
// name-as-written-in-the-address -> site id. Aliases are the spellings the list actually uses.
const ALIAS = {
  'new delhi': 'newdelhi', 'bengaluru': 'bangalore', 'puducherry': 'pondicherry',
  'alleppey': 'alappuzha', 'alleppy': 'alappuzha', 'cochin': 'kochi', 'ernakulam': 'kochi',
  'calcutta': 'kolkata', 'bombay': 'mumbai', 'madras': 'chennai',
};
const NAMES = {};
cities.forEach((c) => { NAMES[c.name.toLowerCase()] = c.id; });
Object.assign(NAMES, ALIAS);
// "Delhi" on its own is left out on purpose: it sits inside "New Delhi" and inside "Delhi NCR",
// and the entries that matter already carry New Delhi in the address.

const ANCHOR = 'This company has told us the following things:';
// The closing bullets are not phrased consistently ("they do not have any other branches in India",
// "they do not have branches in India and is based in Kolkata", "service provided in Mumbai"), so
// the last line matching any of these forms is taken as the end of a block.
const CLAIM_END = /(branch|EHIC|repayment|pay for treatment|service provided|experience of representing)/i;
const NOT_A_NAME = /^(ph|phone|tel|fax|email|e-mail|website|web|mobile|address|and|or)\b/i;
const CLAIMY = /^(list of medical|the following list|prepared by|further and alternatively|our aim is|updated:|they |you |it is a|it covers|it caters|located in|apart from|specialisations|this company|www\.)/i;
const JUNK = /^(list of medical|the following list|prepared by|they have|they cover|it caters|it covers|it is a|located in|apart from|address|and |or )/i;
const STATE_BANNER = /^[A-Z&.\- ]{4,}$/;

const segs = raw.split(ANCHOR);
const out = [];
const dropped = { noCity: 0, twoCities: 0, noName: 0 };

for (let i = 1; i < segs.length; i++) {
  // The claims belong to the block before this segment; the header at its tail belongs to the next.
  const claimSeg = segs[i].split('\n');
  let cut = -1;
  for (let j = 0; j < claimSeg.length && j < 20; j++) if (CLAIM_END.test(claimSeg[j])) cut = j;
  const claims = claimSeg.slice(0, cut + 1).map((s) => s.trim()).filter(Boolean);

  const prev = segs[i - 1].split('\n');
  let pcut = -1;
  for (let j = 0; j < prev.length; j++) if (CLAIM_END.test(prev[j])) pcut = j;
  const header = prev.slice(pcut + 1).map((s) => s.trim()).filter(Boolean);
  while (header.length && CLAIMY.test(header[0])) header.shift();
  if (!header.length) { dropped.noName++; continue; }

  const blob = header.join(' ').toLowerCase();
  const found = [...new Set(
    Object.keys(NAMES).filter((n) => new RegExp('\\b' + n + '\\b').test(blob)).map((n) => NAMES[n]),
  )];
  if (found.length === 0) { dropped.noCity++; continue; }
  if (found.length > 1) { dropped.twoCities++; continue; }

  let name = '';
  for (const h of header) {
    const c = h.replace(/\s*\|\s*/g, ' ').trim();
    if (!c || JUNK.test(c) || STATE_BANNER.test(c) || NOT_A_NAME.test(c)) continue;
    // A block often opens with its own city heading ("Jaipur", "Mumbai - Private Hospitals"). That
    // is not the facility's name; the name is the line after it.
    const bare = c.toLowerCase().replace(/\s*[-,(].*$/, '').replace(/[^a-z ]/g, '').trim();
    if (NAMES[bare] || c === 'www.gov.uk') continue;
    name = c
      // No hospital on this list has a digit in its name, and every address starts with one.
      .split(/(?=\d)/)[0]
      // The ODT also glues a name onto the next line with no space ("Bombay HospitalBombay
      // Hospital, 12, Marine Lines"), so a name-ending word followed by a capital is a boundary.
      .split(/(?<=Hospital|Hospitals|Centre|Center|Clinic|Trust|Sciences)(?=[A-Z])/)[0]
      .replace(/[,\-\s]+$/, '')
      .trim();
    if (name.length >= 4) break;
    name = '';
  }
  if (!name) { dropped.noName++; continue; }

  out.push({
    city: found[0],
    name,
    header,
    english: claims.filter((c) => /english/i.test(c)),
    government: claims.some((c) => /government/i.test(c)),
  });
}

const per = {};
out.forEach((o) => { per[o.city] = (per[o.city] || 0) + 1; });
console.log('kept ' + out.length + ' facilities in ' + Object.keys(per).length + ' site cities');
console.log('dropped: ' + JSON.stringify(dropped));
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

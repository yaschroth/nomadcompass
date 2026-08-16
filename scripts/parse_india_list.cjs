// Parses the British High Commission's India list into one record per facility.
//
// A first attempt keyed each facility to the nearest preceding city heading. That is wrong in a
// way that would have published real errors: the list covers cities the site does not have, and a
// heading for Jalandhar or Chandigarh did not reset the pointer, so their hospitals were being
// attributed to Amritsar. Agra's were landing in Udaipur.
//
// So the city is taken from the facility's own address instead, and a block is only kept when
// exactly one site city name appears in it. A hospital whose address says Chandigarh cannot then
// be filed under Amritsar, whatever heading it sat below.
//
// Blocks are delimited by "This company has told us the following things:". Everything after the
// last claims line of one block and before the next anchor is the next facility's name and address.
const fs = require('fs');
const path = require('path');
const ROOT = 'c:/Users/yasch/Coding Projects/Website Projects/nomadcompass';
const SCRATCH = path.dirname(process.argv[1]);
const raw = fs.readFileSync(path.join(SCRATCH, 'india.txt'), 'utf8');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const cities = m.exports.filter((c) => c.country === 'India');
// name-in-address -> site id. Aliases are the spellings the list actually uses.
const ALIAS = {
  'new delhi': 'newdelhi', 'bengaluru': 'bangalore', 'puducherry': 'pondicherry',
  'pondicherry': 'pondicherry', 'alleppey': 'alappuzha', 'alleppy': 'alappuzha', 'cochin': 'kochi', 'ernakulam': 'kochi',
  'calcutta': 'kolkata', 'bombay': 'mumbai', 'madras': 'chennai',
};
const NAMES = {};
cities.forEach((c) => { NAMES[c.name.toLowerCase()] = c.id; });
Object.assign(NAMES, ALIAS);
// "Delhi" alone is left out on purpose: it also appears inside "New Delhi" and in phrases like
// "Delhi NCR", and the ones that matter already carry New Delhi in the address.

const ANCHOR = 'This company has told us the following things:';
// The closing bullets are not phrased consistently ("they do not have any other branches in
// India", "they do not have branches in India and is based in Kolkata", "service provided in
// Mumbai"), so the last line matching any of these forms ends the block.
const CLAIM_END = /(branch|EHIC|repayment|pay for treatment|service provided|experience of representing)/i;
const NOT_A_NAME = /^(ph|phone|tel|fax|email|e-mail|website|web|mobile|address|and|or)\b/i;

const segs = raw.split(ANCHOR);
const out = [];
const dropped = { noCity: 0, twoCities: 0, noName: 0 };

for (let i = 1; i < segs.length; i++) {
  // Claims belong to the block before this segment; the header at the tail belongs to the next.
  const claimSeg = segs[i].split('\n');
  let cut = -1;
  for (let j = 0; j < claimSeg.length && j < 20; j++) if (CLAIM_END.test(claimSeg[j])) cut = j;
  const claims = claimSeg.slice(0, cut + 1).map((s) => s.trim()).filter(Boolean);

  // The header for THIS block is the tail of the previous segment.
  const prev = segs[i - 1].split('\n');
  let pcut = -1;
  for (let j = 0; j < prev.length; j++) if (CLAIM_END.test(prev[j])) pcut = j;
  let header = prev.slice(pcut + 1).map((s) => s.trim()).filter(Boolean);

  // Strip any claim sentences still sitting at the top of the header. This matters for more than
  // tidiness: a trailing claim reading "Located in Amritsar, Punjab and can provide services to the
  // surrounding areas" was putting a Jalandhar hospital into Amritsar, and one naming Rajasthan was
  // putting a Dehradun hospital into Jaipur. The city is read from the address, so a stray sentence
  // in the header is a wrong answer, not noise.
  const CLAIMY = /^(list of medical|the following list|prepared by|further and alternatively|our aim is|updated:|they |you |it is a|it covers|it caters|located in|apart from|specialisations|this company|www\.)/i;
  while (header.length && CLAIMY.test(header[0])) header.shift();
  if (!header.length) { dropped.noName++; continue; }

  const blob = header.join(' ').toLowerCase();
  const found = [...new Set(Object.keys(NAMES).filter((n) => new RegExp('\\b' + n + '\\b').test(blob)).map((n) => NAMES[n]))];
  if (found.length === 0) { dropped.noCity++; continue; }
  if (found.length > 1) { dropped.twoCities++; continue; }

  // The ODT runs a name straight into its address with no separator ("Kothari Medical Centre8/3
  // Alipore Road"), and some blocks open with a state banner or a stray sentence. Take the first
  // header line that looks like a name, then cut it at the first digit, since none of these
  // hospitals have a digit in the name but every address starts with one.
  const JUNK = /^(list of medical|the following list|prepared by|they have|they cover|it caters|it covers|it is a|located in|apart from|address|and |or )/i;
  const STATES = /^[A-Z&.\- ]{4,}$/;
  let name = '';
  for (const h of header) {
    const c = h.replace(/\s*\|\s*/g, ' ').trim();
    if (!c || JUNK.test(c) || STATES.test(c) || NOT_A_NAME.test(c)) continue;
    // A block often opens with its own city heading ("Jaipur", "Mumbai - Private Hospitals").
    // That is not the facility's name; the name is the line after it.
    const bare = c.toLowerCase().replace(/\s*[-,(].*$/, '').replace(/[^a-z ]/g, '').trim();
    if (NAMES[bare] || c === 'www.gov.uk') continue;
    // The ODT also glues a name straight onto the next line ("Bombay HospitalBombay Hospital, 12,
    // Marine Lines"), so a name-ending word followed by a capital with no space is a boundary.
    name = c.split(/(?=\d)/)[0]
      .replace(/(Hospital|Hospitals|Centre|Center|Clinic|Trust|Sciences)(?=[A-Z])/, '$1')
      .split('')[0]
      .replace(/[,\-\s]+$/, '').trim();
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
fs.writeFileSync(path.join(SCRATCH, 'india.json'), JSON.stringify(out, null, 1));

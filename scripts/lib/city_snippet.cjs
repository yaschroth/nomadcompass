/**
 * The title and the meta description a city page shows in a search result.
 *
 * Both used to be templates. All 710 descriptions collapsed to two real strings, the dominant one
 * being "Is X good for digital nomads? Nomad Score N/10 - cost of living in USD, WiFi, safety,
 * visas, neighborhoods and coworking, all in one guide.", which contains no fact about the city
 * beyond its name. Titles were 22 shapes over 710 pages. Search Console for the 30 days to
 * 2026-08-27: 412 pages sitting at position 5-10 took 5,668 impressions and 89 clicks, a 1.6% CTR
 * against a 3-6% norm. The pages rank; the snippet gives nobody a reason to choose them.
 *
 * So the snippet is composed from what the page actually holds. Every figure here is on the page
 * itself and traceable to data on disk:
 *
 *   costPerMonth, the 13 scores   cities-data.js
 *   monthly high and low          assets/city-climate.js (Open-Meteo, tier primary)
 *
 * Title and description live in one file because they are read together, in one result, and were
 * previously written by two sweeps that did not know about each other: the title said "Cost, WiFi
 * & Visa" while the description promised the same three things again.
 *
 * On the cost figure: it is Numbeo for 331 cities and our own estimate for the other 379
 * (data/provenance.json, tier editorial). "runs about $1,490 a month" is fair for both. A bare
 * "$1,490" stated as measured would not be, so the hedge stays.
 *
 * Usage:  const S = require('./lib/city_snippet.cjs');
 *         S.title(city)        ->  "Palermo, Italy Digital Nomad Guide: $1,490/mo"
 *         S.description(city)  ->  "Palermo runs about $1,490 a month. Food rates 8/10 ..."
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const TITLE_CAP = 60;
// The band audit_blog.cjs already enforces on articles. Google truncates around 155-160 on desktop.
const DESC_MIN = 140;
const DESC_MAX = 158;

const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];

// How a score reads in a sentence. "airquality" and "english" are the two that cannot just be
// lower-cased, and "cost" is the one whose label is not its own name: a 9 for cost means cheap.
const LABEL = {
  climate: 'climate', cost: 'value', wifi: 'wifi', nightlife: 'nightlife', nature: 'nature',
  safety: 'safety', food: 'food', community: 'the nomad scene', english: 'English',
  visa: 'visa access', culture: 'culture', cleanliness: 'cleanliness', airquality: 'air quality',
};

const MONTH = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Monthly highs and lows for all 710 cities, from the file the city pages already read. */
const CLIMATE = (() => {
  const f = path.join(ROOT, 'assets', 'city-climate.js');
  if (!fs.existsSync(f)) return {};
  const m = {};
  // eslint-disable-next-line no-new-func
  new Function('m', fs.readFileSync(f, 'utf8') + ';m.d = CITY_CLIMATE;')(m);
  return m.d || {};
})();

const money = (n) => '$' + Number(n).toLocaleString('en-US');
// Sentence-start forms. Only wifi needs one: the site writes WiFi 8,572 times against 350
// Wifi, and a plain first-letter uppercase gives the wrong one of the two.
const CAP = { wifi: 'WiFi' };
const cap = (s) => CAP[s] || s.replace(/^./, (c) => c.toUpperCase());

/**
 * The title.
 *
 * The city name comes first and "Digital Nomad Guide" stays whole, because that is the shape the
 * queries match and it is not what needed fixing. What it gains is the number: a result carrying
 * a price stands out in a column of results that do not. Longest name in the index is
 * "Santiago de Compostela", which still fits the first option at 52 characters.
 */
function title(c) {
  const cost = money(c.costPerMonth);
  // Singapore, Cyprus and Mauritius are their own country, so the usual shape reads
  // "Singapore, Singapore Digital Nomad Guide".
  const withCountry = c.name === c.country ? [] : [
    `${c.name}, ${c.country} Digital Nomad Guide: ${cost}/mo`,
  ];
  const opts = [
    ...withCountry,
    `${c.name} Digital Nomad Guide: ${cost}/mo`,
    ...(c.name === c.country ? [] : [`${c.name}, ${c.country} Digital Nomad Guide`]),
    `${c.name} Digital Nomad Guide`,
  ];
  return opts.find((t) => t.length <= TITLE_CAP) || opts[opts.length - 1];
}

/**
 * How each category scores across the whole index, so a snippet can say what is unusual about a
 * city rather than what is merely high or low on a 1-10 scale.
 *
 * This distinction is the difference between a useful snippet and a repetitive one. Ranked by raw
 * score, "the nomad scene a weaker 3/10" was the weakness named on 334 of 710 pages, because
 * community averages 4.2 across the index and a 3 is an ordinary result, not a warning. Culture
 * averages 7.4, so a 5 there is genuinely worth knowing and was never mentioned.
 */
const CITIES = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
  const m = {};
  // eslint-disable-next-line no-new-func
  new Function('m', src + ';m.d = CITIES;')(m);
  return m.d;
})();

const STATS = (() => {
  const out = {};
  for (const k of KEYS) {
    const v = CITIES.map((c) => c.scores && c.scores[k]).filter((x) => typeof x === 'number');
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || 1;
    out[k] = { mean, sd };
  }
  return out;
})();

// Cost is not eligible for either slot. The first sentence already states the price, so "value a
// weaker 1/10" after "runs about $5,720 a month" spends 22 characters restating it, and it did
// exactly that on 96 pages.
const SLOT_KEYS = KEYS.filter((k) => k !== 'cost');
// About the bottom sixth of a category. Below this a score is worth a reader's attention.
const WEAK_Z = -1.0;

/**
 * What this city is unusually good at, and anything it is unusually bad at.
 *
 * Strengths are ranked on rarity AND height, not rarity alone. Community averages 4.2 across the
 * index, so a 9 there is the rarest thing a city can have and pure z-ranking opened New York with
 * "The nomad scene rates 9/10" while its two 10s for food and nightlife went unmentioned. Past
 * about one and a half deviations, how unusual a score is stops being the interesting part and how
 * good it is takes over, which is what the cap expresses.
 */
const Z_CAP = 1.5;

function scoreClause(c, forceTwo) {
  const z = (k) => (c.scores[k] - STATS[k].mean) / STATS[k].sd;
  const rank = (k) => Math.min(z(k), Z_CAP) + c.scores[k] / 10;
  const keys = SLOT_KEYS.filter((k) => typeof c.scores[k] === 'number');
  if (!keys.length) return null;
  const strong = keys.slice().sort((a, b) => rank(b) - rank(a));
  const [a, b] = strong;
  const low = keys.slice().sort((x, y) => z(x) - z(y))[0];
  // Normally the second strength is named only when it is close to the first, so the sentence does
  // not claim two things a city is not equally good at. `forceTwo` is for the cities whose
  // description would otherwise come out short: a real second score beats leaving the line empty.
  //
  // Selection is by the z-and-height blend, but the sentence reads them in plain score order.
  // Otherwise Porto opened "The nomad scene rates 7/10 and climate 8/10", which asks the reader to
  // wonder why the smaller number went first.
  const pair = b && (forceTwo || rank(b) >= rank(a) - 0.35)
    ? [a, b].sort((x, y) => c.scores[y] - c.scores[x])
    : [a];
  const head = pair.length === 2
    ? `${cap(LABEL[pair[0]])} rates ${c.scores[pair[0]]}/10 and ${LABEL[pair[1]]} ${c.scores[pair[1]]}/10`
    : `${cap(LABEL[a])} rates ${c.scores[a]}/10`;
  // Never name the same category as both the strength and the weakness.
  return z(low) <= WEAK_Z && !pair.includes(low)
    ? `${head}, ${LABEL[low]} a weaker ${c.scores[low]}/10.`
    : `${head}.`;
}

/**
 * One fact from twelve months of temperature.
 *
 * A place with little seasonal spread is described by its range, because that is the interesting
 * thing about it. A place with real seasons is described by its two ends, which is what someone
 * choosing a month actually wants.
 */
function climateClause(c) {
  const k = CLIMATE[c.id];
  if (!k || !Array.isArray(k.h) || k.h.length !== 12) return null;
  const hi = Math.max(...k.h);
  const lo = Math.min(...k.h);
  if (hi - lo <= 6) return `A steady ${lo} to ${hi}C all year.`;
  const warm = MONTH[k.h.indexOf(hi)];
  const cool = MONTH[k.h.indexOf(lo)];
  return `${cool} ${lo}C, ${warm} ${hi}C.`;
}

/**
 * What the page is, in a few words.
 *
 * Graded by length rather than written once, because the three facts above it come out anywhere
 * between 95 and 140 characters depending on the city's name, its climate spread and whether it
 * has a weakness worth naming. With a single closing sentence 662 of the 710 descriptions landed
 * under the 140 floor and Google fills the rest from page text, which is the state this file
 * exists to leave. The ladder means the sentence is chosen to fit the room that is left.
 */
const CLOSERS = [
  'What it costs, where to work, and how long you can stay.',
  'Costs, coworking and visas, with a source for each one.',
  'Cost of living, wifi, coworking and where to stay.',
  'Costs, coworking, visas and where to stay.',
  'Costs, coworking and the visa rules.',
  'Coworking, visas and costs.',
  'Costs, wifi and visas.',
];

/**
 * The description: cost, then strengths, then weather, then what the page is.
 *
 * The first three are facts and are taken in that order. The fourth is chosen from the ladder: of
 * the closers that fit, prefer the ones that land inside the band, and pick between those by the
 * slug so two of our results side by side do not read identically.
 */
function description(c) {
  return compose(c, false) || compose(c, true);
}

function compose(c, forceTwo) {
  const parts = [`${c.name} runs about ${money(c.costPerMonth)} a month.`];
  const add = (s) => {
    if (s && [...parts, s].join(' ').length <= DESC_MAX) parts.push(s);
  };
  add(scoreClause(c, forceTwo));
  add(climateClause(c));

  const stem = parts.join(' ');
  const fits = CLOSERS.filter((x) => (stem + ' ' + x).length <= DESC_MAX);
  if (!fits.length) return (!forceTwo && stem.length < DESC_MIN) ? null : stem;
  const inBand = fits.filter((x) => (stem + ' ' + x).length >= DESC_MIN);
  const pool = inBand.length ? inBand : [fits[0]];
  let h = 0;
  for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) >>> 0;
  const out = stem + ' ' + pool[h % pool.length];
  // A short result on the first pass is worth retrying with the second strength named.
  return (!forceTwo && out.length < DESC_MIN) ? null : out;
}

module.exports = { title, description, TITLE_CAP, DESC_MIN, DESC_MAX, CLIMATE, KEYS };

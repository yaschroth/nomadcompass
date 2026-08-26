/**
 * Rewrites local-currency prices as USD, which is the house rule for every price on the site.
 *
 * Shared because the same prices are written in three places that drifted apart: the score-notes
 * object baked into each city page, data/category-descriptions.json that the generator reads to
 * WRITE those notes, and the guide-section prose in the page body. Sweeping any one of them alone
 * leaves the other two able to put the local figures back.
 *
 * Rates are injected, never hardcoded. A constant is how the existing parenthetical glosses went
 * stale: they were written at EUR/USD 1.09 and the market is at 1.167, an 8% error in whatever a
 * reader budgets against.
 *
 * makeConverter(rates, opts) -> { convert, dropped, kept, unresolved, CODES }
 *   rates    open.er-api.com style map, units of the currency per 1 USD
 *   opts.html  set for HTML text: leaves line-leading indentation alone when tidying whitespace
 *
 *   convert(text, yenCode) -> { text, hits }
 *   yenCode  JPY or CNY, since the yen sign is written for both and they are 20x apart
 */

// TL is how Turkish prices are actually written, RMB likewise for the yuan, NIS likewise for the
// Israeli shekel (the ISO code is ILS and nobody writes it).
const ALIAS = { TL: 'TRY', RMB: 'CNY', NIS: 'ILS' };
const CODES = ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'TL',
  'AED', 'SAR', 'ILS', 'THB', 'MYR', 'SGD', 'HKD', 'TWD', 'KRW', 'JPY', 'CNY', 'RMB', 'INR', 'IDR',
  'PHP', 'VND', 'BRL', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'ZAR', 'EGP', 'MAD', 'KES', 'NGN', 'GHS',
  'RUB', 'UAH', 'BGN', 'RSD', 'MKD', 'ALL', 'BAM', 'GEL', 'AMD', 'AZN', 'KZT', 'UZS', 'MNT', 'LKR',
  'BDT', 'PKR', 'NPR', 'MMK', 'KHR', 'LAK', 'BND', 'NZD', 'AUD', 'CAD', 'ISK', 'MDL', 'TND', 'JOD',
  'QAR', 'OMR', 'BHD', 'KWD', 'MOP', 'MVR', 'FJD', 'XPF', 'XOF', 'XAF',
  // Found by scanning the pages for three-letter codes against a number rather than by listing the
  // currencies I expected. Montevideo was still printing "UYU 28,000-45,000" after a sweep that
  // reported itself finished, because a hand-written list of currencies is quietly incomplete.
  'UYU', 'BOB', 'TZS', 'NIS', 'DOP', 'CVE', 'MUR', 'NAD', 'RWF', 'UGX', 'MZN', 'PYG', 'IRR', 'ETB',
  'CRC'];

const C = '(?:' + CODES.join('|') + ')';
// Must not end on a separator, or "under INR 250." swallows the full stop and the sentence runs
// into the next one.
const N = '\\d(?:[\\d,.]*\\d)?';
const CONN = '\\s*(?:-|\u2013|to)\\s*';
// "between 800 and 1,400 JOD" is a range too. This wider connector is only used on the local-currency
// side: an earlier version matched just "1,400 JOD" and left "800 and" stranded in front of the
// converted figure. It is deliberately NOT used for the dollar-side patterns, where "and" would let
// "$50 and 3 nights" read as one amount.
const RCONN = '\\s*(?:-|\u2013|to|and)\\s*';
const MONEY = '\\$[\\d,.]+(?:' + CONN + '\\$?[\\d,.]+)?';
const UNIT = '(?:\\s*(?:per|a)\\s(?:month|night|day|week|year)|\\s*\\/\\s?(?:month|night|day|week|yr|year)|\\s*monthly|\\s*annually)';

// The range half is all-or-nothing. Letting the connector match without a second number turned
// "SAR 6,500 to SAR 11,000" into "SAR $1,730 11,000", because the trailing form read the SECOND
// SAR as the unit for the FIRST number and left the rest behind.
const TRAIL = new RegExp('(' + N + ')(?:(' + RCONN + ')(' + N + '))?\\s?(' + C + ')\\b', 'g');
const LEAD = new RegExp('\\b(' + C + ')\\s?(' + N + ')(?:(' + RCONN + ')(?:' + C + '\\s?)?(' + N + '))?', 'g');

// A gloss parenthetical is dropped only if it holds nothing but money and filler. That guard is the
// difference between eating "(about 870-1,300 USD)" and eating "(down from $1,500 last year)".
const FILLER = /\b(?:about|approx\.?|approximately|roughly|around|circa|to|or|and|USD|per|a|an|month|months|mo|mth|night|day|week|wk|year|yr|monthly|annually|equivalent|total|all|in)\b/gi;
const isPureGloss = (s) => !/[a-z]/i.test(s.replace(FILLER, '').replace(/[~\d\s,.\-\u2013$/()]/g, ''));
// Longest first: "month" has to win before "mo" gets a look.
const UNIT_IN = /(month|mth|mo|night|day|week|wk|year|yr)/i;
const LONG_UNIT = { mo: 'month', mth: 'month', wk: 'week', yr: 'year' };

// The yen sign is written for both the Japanese yen and the Chinese yuan, so it is resolved by the
// caller from the city's country rather than guessed here.
const SYMBOL = { '\u20ac': 'EUR', '\u00a3': 'GBP', '\u20a4': 'GBP', '\u20b9': 'INR', '\u0e3f': 'THB', '\u20a9': 'KRW', '\u20bd': 'RUB' };
const SYMS = '[\u20ac\u00a3\u20a4\u20b9\u0e3f\u20a9\u20bd\u00a5]';
const SYM_RE = new RegExp('(' + SYMS + ')\\s?(' + N + ')(?:(' + RCONN + ')(?:' + SYMS + '\\s?)?(' + N + '))?', 'g');

// Prices written as a word rather than a code or a symbol. Every one of these resolves to a single
// currency in the cities that actually use it, checked rather than assumed: "lei" appears only on
// Romanian pages, "peso" only on a Mexican one. Ambiguous names stay out of this table on purpose.
const NAME_CODE = {
  euro: 'EUR', euros: 'EUR', yen: 'JPY', yuan: 'CNY', renminbi: 'CNY', lei: 'RON', baht: 'THB',
  sol: 'PEN', soles: 'PEN', peso: 'MXN', pesos: 'MXN', dong: 'VND',
};
// Japan's nomad-visa threshold is written "10 million yen" on eight pages, so the scale word has to
// be part of the match. Without it the number read as a bare 10 and nothing converted.
const SCALE = { thousand: 1e3, million: 1e6, billion: 1e9 };
const NAME_RE = new RegExp('\\b(' + N + ')(?:(' + RCONN + ')(' + N + '))?\\s(?:(thousand|million|billion)\\s)?('
  + Object.keys(NAME_CODE).sort((a, b) => b.length - a.length).join('|') + ')\\b', 'gi');

// A sentence that explains an exchange rate is not a price, and converting the number inside it
// destroys the sentence. "pegged to the USD at roughly 0.71 JOD per dollar" came out of an earlier
// version of this sweep as "at roughly $1 per dollar". These are passed through and reported, since
// a preamble like "prices below are in euros" needs rewriting by a person, not arithmetic.
// Kept narrow on purpose. A first attempt matched the bare words "equivalent" and "conversion",
// which exempted "the regional Uber equivalent, fares averaging PHP 80-250" and a coworking space
// in a "French Gothic church conversion". Those are prices, and skipping them is the failure this
// guard exists to avoid in the other direction.
const RATE_TALK = new RegExp([
  '\\bpegged\\b', '\\bexchange rate\\b',
  '\\bper (?:dollar|USD|euro|EUR|AUD|NZD|CAD|GBP)\\b', '\\bto the dollar\\b', '\\bper \\$1\\b',
  '\\b(?:USD|US dollar|dollar) equivalents?\\b', '\\bUSD figures use\\b',
  '\\b1\\s?(?:USD|EUR|NZD|AUD|CAD|GBP|CHF)\\s?(?:=|is|buys)\\b', '\\$\\s?1\\s?=',
  '\\bare (?:usually )?quoted in\\b', '\\b(?:prices|figures|rents)[^.]{0,24}\\bbelow are\\b',
  '\\ball prices\\b',
].join('|'), 'i');

const num = (s) => Number(String(s).replace(/,/g, '').replace(/\.$/, ''));
const round = (v) => {
  if (v >= 1000) return Math.round(v / 10) * 10;
  if (v >= 100) return Math.round(v / 5) * 5;
  if (v >= 10) return Math.round(v);
  return Math.round(v * 2) / 2;
};
const money = (v) => {
  const r = round(v);
  return '$' + (r % 1 !== 0 ? r.toFixed(2) : r.toLocaleString('en-US'));
};

function makeConverter(rates, opts) {
  const html = !!(opts && opts.html);
  const dropped = new Set();
  const kept = new Set();
  const unresolved = new Set();

  const pair = (code, a, conn, b) => {
    const r = rates[ALIAS[code] || code];
    if (!r) { unresolved.add(code); return null; }
    const lo = money(num(a) / r);
    if (!b) return lo;
    const hi = money(num(b) / r);
    // Keep the connector the sentence used. "between 800 and 1,400" has to come back as
    // "between $1,130 and $1,970", not as a dash, or the surrounding words stop making sense.
    if (/and/i.test(conn)) return lo + ' and ' + hi;
    if (/to/i.test(conn)) return lo + ' to ' + hi;
    return lo + '-' + hi.replace('$', '');
  };

  const rateTalk = [];

  function convertOne(text, yenCode) {
    let hits = 0;
    let t = text;

    t = t.replace(NAME_RE, (m, a, conn, b, scale, name) => {
      const k = scale ? SCALE[scale.toLowerCase()] : 1;
      const out = pair(NAME_CODE[name.toLowerCase()], num(a) * k, conn, b ? num(b) * k : b);
      if (out === null) return m;
      hits += 1;
      return out;
    });

    t = t.replace(SYM_RE, (m, sym, a, conn, b) => {
      const code = SYMBOL[sym] || yenCode;
      if (!code) return m;
      const out = pair(code, a, conn, b);
      if (out === null) return m;
      hits += 1;
      return out;
    });
    t = t.replace(TRAIL, (m, a, conn, b, code) => {
      const out = pair(code, a, conn, b);
      if (out === null) return m;
      hits += 1;
      return out;
    });
    t = t.replace(LEAD, (m, code, a, conn, b) => {
      const out = pair(code, a, conn, b);
      if (out === null) return m;
      hits += 1;
      return out;
    });

    // Leftover ways of writing dollars, now that the local figures are gone. Strip a trailing "USD"
    // off a figure that already has a sign before turning bare "USD 180-400" into "$180-400",
    // otherwise the later rule reaches into "$1,770-2,450 USD" and signs only the far end.
    // "$3,700 USD" says the unit twice. Counted as a hit so a page carrying only this still gets
    // written: 630 of them across 131 files were left redundant when the count ignored it.
    t = t.replace(new RegExp('(' + MONEY + ')\\s*USD\\b', 'g'), (m, fig) => { hits += 1; return fig; });
    t = t.replace(new RegExp('\\bUSD\\s?(' + N + ')(' + CONN + ')(' + N + ')', 'g'),
      (m, a, conn, b) => '$' + a + (/to/i.test(conn) ? ' to $' : '-') + b);
    t = t.replace(new RegExp('(' + N + ')(' + CONN + ')(' + N + ')\\s?USD\\b', 'g'),
      (m, a, conn, b) => '$' + a + (/to/i.test(conn) ? ' to $' : '-') + b);
    t = t.replace(new RegExp('\\bUSD\\s?(' + N + ')', 'g'), (m, a) => '$' + a);
    t = t.replace(new RegExp('(' + N + ')\\s?USD\\b', 'g'), (m, a) => '$' + a);

    // Now that both halves read in dollars, the parenthetical gloss is a duplicate. A couple of
    // entries keep their only "/month" inside it, so lift the unit out rather than losing it with
    // the parens. A word or two can sit between figure and gloss ("$260 to $520 per month all-in
    // ($230 to $470)"), so the tail is captured and put back.
    t = t.replace(new RegExp('(' + MONEY + ')((?:' + UNIT + ')?(?:\\s+[a-z][a-z-]{0,9})?)[\\s,]*\\(([^)]{0,60})\\)', 'g'),
      (m, fig, tail, inside) => {
        if (!/\d/.test(inside) || !inside.includes('$')) return m;
        if (!isPureGloss(inside)) { kept.add(inside); return m; }
        dropped.add(inside);
        if (new RegExp(UNIT, 'i').test(tail)) return fig + tail;
        const u = inside.match(UNIT_IN);
        if (!u) return fig + tail;
        const word = u[1].toLowerCase();
        return fig + '/' + (LONG_UNIT[word] || word) + tail;
      });

    // "(around 10 million yen, roughly $67,000)" puts the gloss inside the same parenthetical rather
    // than after it, so converting the first half leaves two dollar figures that disagree. Keep the
    // fresh one. The filler word is required: without it this would eat "rent $500, food $300".
    t = t.replace(new RegExp('(' + MONEY + ')\\s*,\\s*(?:roughly|about|approximately|around|circa|~|approx\\.?)\\s*' + MONEY, 'gi'),
      (m, fig) => { hits += 1; return fig; });

    t = t.replace(/\$\s*\$/g, '$');
    t = t.replace(/\$(\d+)\.(\d)\b/g, (m, a, b) => '$' + a + '.' + b + '0');
    // In HTML the run of spaces after a newline is indentation, not a typo. Collapsing it would
    // reflow every file the sweep touches and bury the real change in the diff.
    t = html ? t.replace(/(?<!\n)[ \t]{2,}/g, ' ') : t.replace(/\s{2,}/g, ' ');
    t = t.replace(/[ \t]+([,.;])/g, '$1');
    return { text: t, hits };
  }

  /**
   * Convert a passage, leaving any sentence that is explaining an exchange rate alone. Splitting
   * first means one rate-explaining sentence does not exempt the prices around it.
   */
  function convert(text, yenCode) {
    const parts = text.split(/(?<=[.!?])(\s+)/);
    let hits = 0;
    const out = parts.map((part, i) => {
      if (i % 2 === 1) return part;            // the captured separator
      if (RATE_TALK.test(part)) {
        if (/\d/.test(part)) rateTalk.push(part.trim());
        return part;
      }
      const r = convertOne(part, yenCode);
      hits += r.hits;
      return r.text;
    }).join('');
    return { text: out, hits };
  }

  return { convert, dropped, kept, unresolved, rateTalk, CODES };
}

/**
 * Rewrite the text nodes of an HTML document, leaving tags, attributes and the protected elements
 * alone. Walking tag by tag is enough here: the protected elements do not nest inside themselves.
 */
function mapTextNodes(html, fn) {
  const TAG = /<[^>]*>/g;
  let out = '';
  let last = 0;
  let skipUntil = null;
  let m;
  while ((m = TAG.exec(html)) !== null) {
    const text = html.slice(last, m.index);
    out += skipUntil ? text : fn(text);
    out += m[0];
    last = m.index + m[0].length;

    const tag = m[0];
    if (skipUntil) {
      if (new RegExp('^</' + skipUntil + '\\b', 'i').test(tag)) skipUntil = null;
    } else if (/^<(script|style)\b/i.test(tag)) {
      skipUntil = tag.match(/^<(\w+)/)[1].toLowerCase();
    } else if (/^<span[^>]*\bclass="[^"]*\bcost-line-val\b/i.test(tag)) {
      skipUntil = 'span';
    } else if (/^<p[^>]*\bclass="[^"]*\bcost-src\b/i.test(tag)) {
      skipUntil = 'p';
    }
  }
  out += skipUntil ? html.slice(last) : fn(html.slice(last));
  return out;
}


module.exports = { makeConverter, mapTextNodes, CODES, RATE_TALK };

/**
 * The prose on a services page, computed from the rows rather than written.
 *
 * The rule this module exists to keep: nothing is said that the data does not support. No "Lisbon
 * has excellent dental care". Every sentence here is a count, a date, a distance, a district or a
 * named source, so a page can be substantial without a word of invention. Where a hand-written
 * layer is missing the page says so in one sentence instead of padding, because 150 words of
 * "always check credentials" repeated across 400 pages is the thin content we are trying to leave.
 *
 * Everything returns plain text; the generators wrap it. words() counts what the uniqueness gate
 * measures, so declared boilerplate can be excluded from it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const { sources: SOURCES } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const { CAT_PLURAL, EV_LABEL } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));
const PUB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-publishers.json'), 'utf8'));

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : (a[0] || ''));
const plural = (n, one, many) => (n === 1 ? one : (many || one + 's'));
const count = (n) => (n === 1 ? 'one' : n === 2 ? 'two' : n === 3 ? 'three' : n === 4 ? 'four' : n === 5 ? 'five' : n === 6 ? 'six' : String(n));
const langName = (l) => M.LANGS[l] || l;

// "an English claim", but "a Ukrainian claim": the article follows the sound, and Ukrainian is the
// one name of the 53 whose spelling and sound disagree about it. Written out because a rule that
// only reads the first letter got it wrong, and 64 pages said "a English-speaking doctor".
const SOUNDS_CONSONANT = new Set(['Ukrainian']);
const an = (word) => (/^[AEIOU]/.test(word) && !SOUNDS_CONSONANT.has(word) ? 'an ' : 'a ') + word;
const catName = (c) => CAT_PLURAL[c] || c;
const singular = (c) => catName(c).replace(/ies$/, 'y').replace(/s$/, '');
// A pharmacy is a shop, and "pharmacies who work in English" reads as a slip in a heading. Gyms are
// the same case and still say "who": their titles are live and being measured, and this would move
// them. Add a category here when it names a place rather than a person.
const PLACES = new Set(['pharmacy']);
const who = (c) => (PLACES.has(c) ? 'that' : 'who');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function niceDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  return Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

/** Who published a source, from the domain owner. Unmatched hosts stay hostnames, which is honest. */
function publisherOf(host) {
  if (PUB.exact[host]) return PUB.exact[host];
  const hit = Object.keys(PUB.suffix).find((s) => host.endsWith(s));
  return hit ? PUB.suffix[hit] : { publisher: host, short: host, kind: 'other' };
}

/** What the page is, in one paragraph: how many, in which languages, checked when. */
function standfirst(pair) {
  const city = M.cities[pair.city];
  const langs = pair.nonLocal.filter(([, n]) => n >= 1).slice(0, 3);
  const bits = [];
  bits.push(count(pair.n) + ' ' + plural(pair.n, singular(pair.category), catName(pair.category)) +
    ' in ' + city.name + ' whose working language is recorded somewhere we can point at');
  const langBit = langs.length
    ? langs.map(([l, n]) => n + ' in ' + langName(l)).join(', ')
    : '';
  const first = bits[0].charAt(0).toUpperCase() + bits[0].slice(1) + '.';
  const second = langBit
    ? (langs.length === 1
      ? 'All ' + (pair.n === 1 ? 'of it' : pair.n) + ' ' + (pair.n === 1 ? 'is' : 'are') + ' listed as working in ' + langName(langs[0][0]) + '.'
      : 'Listed by language: ' + langBit + '.')
    : '';
  const dates = pair.checked;
  const third = dates.length
    ? (dates[0] === dates[dates.length - 1]
      ? 'Last checked on ' + niceDate(dates[0]) + '.'
      : 'Last checked between ' + niceDate(dates[0]) + ' and ' + niceDate(dates[dates.length - 1]) + '.')
    : '';
  return [first, second, third].filter(Boolean).join(' ');
}

/** Where the rows came from, as prose. Different for every pair, because the source mix differs. */
function provenance(pair) {
  const src = pair.sources;
  if (!src.length) return '';
  const named = src.map((s) => Object.assign({}, s, publisherOf(s.host)));
  const out = [];
  if (named.length === 1) {
    const s = named[0];
    out.push((pair.n === 1 ? 'The entry comes' : 'All ' + pair.n + ' come') + ' from one place, ' + s.publisher + '.');
  } else if (named.every((s) => s.n === 1)) {
    // Five providers, five sources: there is no majority to lead with, and saying "1 of the 5 come
    // from" reads as a bug. Say what is actually true, that each was found on its own.
    out.push('Each of these ' + pair.n + ' was found on a different source: ' +
      list(named.map((s) => s.publisher)) + '.');
  } else {
    const top = named[0];
    const rest = named.slice(1);
    // "The other come from an Italian consulate (7)" agreed with nothing: one source left,
    // seven providers left, and a verb for neither. Count the providers, not the sources.
    const left = pair.n - top.n;
    out.push(top.n + ' of the ' + pair.n + ' come from ' + top.publisher + '. ' +
      (rest.length === 1
        ? 'The other ' + (left === 1 ? 'one comes' : left + ' come') + ' from ' + rest[0].publisher + '.'
        : 'The others come from ' +
          list(rest.map((s) => s.publisher + (s.n > 1 ? ' (' + s.n + ')' : ''))) + '.'));
  }
  // The publisher caveat, once per page rather than once per card. It used to sit in every note:
  // six sentences repeated between 446 and 1,384 times were half of all the note text in the
  // dataset, which is a lot of bytes to say the same thing and exactly what a search engine reads
  // as one page duplicated.
  const caveatOnce = [];
  const kinds = new Set(named.map((s) => s.kind));
  if (kinds.has('consular')) {
    // This used to be three sentences of explanation repeated on every consular page. It said the
    // same thing 113 times over, which is the shape a search engine reads as one page duplicated.
    // The explanation lives once on the directory page now, and each entry still quotes its own
    // mission's wording underneath.
  }
  if (kinds.has('directory')) {
    const d = named.filter((s) => s.kind === 'directory').reduce((a, s) => a + s.n, 0);
    out.push(d + ' of these ' + plural(d, 'is', 'are') + ' from a commercial directory rather than an official list.');
  }
  // What each source says about its own list: who it admits, what it checks, what it disclaims.
  // This used to sit on every card that came from that source, so the Madrid consulate's listing
  // requirement was printed 34 times on one page. It is a fact about the list, so it belongs to the
  // list, once. Capped at the three sources that supplied the most rows: a city page can draw on a
  // dozen, and a paragraph of twelve disclaimers is the same padding in a different place.
  const pageNotes = [];
  for (const { id } of (pair.srcIds || []).slice(0, 3)) {
    const note = (SOURCES[id] || {}).pageNote;
    if (note && !pageNotes.includes(note)) pageNotes.push(note);
  }
  return out.concat(pageNotes, caveatOnce).join(' ');
}

/** What the language claim is worth, from the evidence mix. */
function claimScope(pair) {
  const ev = pair.evCounts;
  const official = ev.official || 0;
  const self = ev['self-declared'] || 0;
  const dir = ev.directory || 0;
  const visited = ev.visited || 0;
  const parts = [];
  if (official === pair.n) {
    parts.push('All ' + pair.n + ' sit on an official list, the strongest tier this directory carries.');
  } else if (official) {
    parts.push(official + ' of the ' + pair.n + ' sit on an official list; the remaining ' +
      (pair.n - official) + ' ' + plural(pair.n - official, 'rests', 'rest') + ' on ' + list([
        self ? (self === pair.n - official ? 'the provider stating it' : self + ' on the provider stating it') : '',
        dir ? (dir === pair.n - official ? 'a directory listing' : dir + ' on a directory listing') : '',
      ].filter(Boolean)) + '.');
  } else {
    parts.push('None of these sits on an official list, so treat the language claim as the provider’s or the directory’s own word.');
  }
  if (!visited) {

  }
  return parts.join(' ');
}

/** Where in the city they are. A source that only covers one district is a limitation worth saying. */
function geography(pair) {
  const areas = Object.entries(pair.areas).filter(([a]) => a && a.length > 2).sort((a, b) => b[1] - a[1]);
  if (!areas.length) return '';
  const city = M.cities[pair.city];
  const withPc = Object.values(pair.areas).reduce((a, b) => a + b, 0);
  if (areas.length === 1) {
    return 'Every address we hold for these sits in postcode ' + areas[0][0] + '. That is where this source looked, not where every ' +
      singular(pair.category) + ' in ' + city.name + ' is.';
  }
  const top = areas.slice(0, 5);
  return 'Spread across ' + areas.length + ' postcodes: ' + top.map(([a, n]) => a + ' (' + n + ')').join(', ') +
    (areas.length > top.length ? ', and ' + (areas.length - top.length) + ' more' : '') +
    (withPc < pair.n ? '. ' + (pair.n - withPc) + ' of the ' + pair.n + ' give no postcode.' : '.');
}

/** If nobody here fits. This is the block that carries the small pages. */
function alternatives(pair) {
  const city = M.cities[pair.city];
  const near = M.nearest(pair.city, pair.category, 8);
  const out = [];
  // Any nearby city that holds the service is worth naming. An earlier version only offered
  // cities with more providers than this one, which told Barcelona, with 16 dentists, that we list
  // none nearby.
  const close = near.filter((x) => x.km <= 1500);
  if (close.length) {
    const top = close.slice(0, 3);
    out.push('If none of these fits, the nearest ' + catName(pair.category) + ' we list are in ' +
      list(top.map((x) => x.name + ' (' + x.n + ', ' + x.km + ' km away)')) + '.');
  } else if (near.length) {
    const top = near.slice(0, 2);
    out.push('We list no ' + catName(pair.category) + ' near ' + city.name +
      '. The closest anywhere in the index are ' + list(top.map((x) => x.name + ' (' + x.n + ')')) + '.');
  }
  const others = city.services.filter((c) => c !== pair.category);
  if (others.length) {
    const top = others.slice(0, 4);
    out.push(city.name + ' itself also has ' +
      list(top.map((c) => {
        const k = M.pairOf(pair.city, c).n;
        return k + ' ' + (k === 1 ? singular(c) : catName(c));
      })) +
      (others.length > top.length ? ' and ' + (others.length - top.length) + ' more services' : '') + ' listed.');
  }
  out.push('A gap here means we have not found a source we can cite, not that nobody exists.');
  return out.join(' ');
}

/** Two or three questions whose answers are counts and dates, so they can never drift from the page. */
function faq(pair) {
  const city = M.cities[pair.city];
  const q = [];
  q.push({
    q: 'How many ' + catName(pair.category) + ' in ' + city.name + ' does this page list?',
    a: count(pair.n).charAt(0).toUpperCase() + count(pair.n).slice(1) + '. That is the number whose working language we can trace to a published source, not the number practising in ' + city.name + '.',
  });
  if (pair.nonLocal.length) {
    q.push({
      q: 'Which languages are recorded?',
      a: pair.nonLocal.slice(0, 4).map(([l, n]) => langName(l) + ' (' + n + ')').join(', ') +
        '. A provider can appear under more than one language.',
    });
  }
  const dates = pair.checked;
  if (dates.length) {
    q.push({
      q: 'When was this last checked?',
      a: dates[0] === dates[dates.length - 1]
        ? 'On ' + niceDate(dates[0]) + '. Each entry links to the source it was read on, so you can check it yourself.'
        : 'Between ' + niceDate(dates[0]) + ' and ' + niceDate(dates[dates.length - 1]) + '. Each entry links to the source it was read on, so you can check it yourself.',
    });
  }
  return q;
}

/**
 * The declared sentence for a missing hand-written layer. Short, true, and registered as boilerplate
 * so it cannot be counted towards a page's unique word total.
 */
function gapSentence(country, category) {
  return 'We have not yet written up how ' + country + ' registers and licenses ' + catName(category) +
    ', so this page gives you the language claim and its source and nothing more.';
}

const BOILERPLATE = [
  'A gap here means we have not found a source we can cite, not that nobody exists.',
];


// --- the provider card -------------------------------------------------------------------------
// One renderer for every page in the family. Two copies had already drifted once: a physiotherapist
// was a bone on the hub and a pulse on the city page.
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A row flagged `mobile` has a service area and no address, so it gets no Maps link: the pin
// would land on whichever of its districts Google prefers. The card decides that, not this
// function, because the URL is still right for anything that does have a place to go.
// "Checked with them" is only worth reading beside the day it happened, and a date carried in prose
// is a date the next row forgets. The badge gets it from the field, on every page that renders a
// card, so the claim on the tier legend is structurally true rather than true by discipline.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : '';
}
function evBadge(p) {
  const on = p.evidence === 'visited' ? shortDate(p.confirmedOn) : '';
  return `<span class="sv-ev sv-ev-${p.evidence}">${EV_LABEL[p.evidence]}</span>`
    + (on ? `<span class="sv-on">${on}</span>` : '');
}

function mapsUrl(p) {
  const c = M.cities[p.city];
  // A Maps search, not a claimed pin: we have not verified any listing's coordinates.
  return 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent([p.name, p.area, c && c.name, c && c.country].filter(Boolean).join(', '));
}

function card(p, opts) {
  const o = opts || {};
  const chips = p.languages.map((l) => `<span class="sv-lang">${esc(langName(l))}</span>`).join('');
  const host = M.hostOf(p.sourceUrl);
  const name = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="nofollow noopener">${esc(p.name)}</a>`
    : esc(p.name);
  const meta = [o.showCategory === false ? '' : esc(M.CATS[p.category]), p.area ? esc(p.area) : '']
    .filter(Boolean).join('&nbsp;&middot; ');
  /**
   * What the language filter matches this card on.
   *
   * Normally every language the provider works in. But a page grouped INTO language sections
   * renders the same provider once per section, and each of those cards is that provider as an
   * X-speaking lawyer, not the provider in general. Tagged with all their languages, a firm working
   * in Arabic and English matched an Arabic filter from inside the English section, so choosing
   * Arabic on /services/madrid/lawyers left the page headed "English-speaking lawyers in Madrid".
   * `o.lang` lets such a page tag each copy with the section it belongs to. Everything else keeps
   * the full list, which is right where cards are grouped by category rather than by language.
   */
  const filterLangs = o.lang ? o.lang : p.languages.join(' ');
  return `<article class="sv-card sf-item sv-c-${p.category}${p.evidence === 'visited' ? ' sv-checked' : ''}" data-cat="${p.category}" data-lang="${filterLangs}" data-name="${esc(p.name.toLowerCase())}">
        <div class="sv-head">
          <span class="sv-ico">${o.icon || ''}</span>
          <div>
            <h3 class="sv-name">${name}</h3>
            <p class="sv-meta">${meta}</p>
          </div>
        </div>
        <p class="sv-langs"><span class="sv-lang-label">Speaks</span>${chips}</p>
        ${p.note ? `<p class="sv-note">${esc(p.note)}</p>` : ''}
        <div class="sv-foot">
          <p class="sv-src">${evBadge(p)}<a href="${esc(p.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(host)}</a></p>
          <p class="sv-links">${p.url ? `<a class="sv-go" href="${esc(p.url)}" target="_blank" rel="nofollow noopener">Website</a>` : '<span class="sv-nogo">No site</span>'}${p.mobile ? '' : `<a class="sv-go" href="${esc(mapsUrl(p))}" target="_blank" rel="nofollow noopener">Maps</a>`}${contactLinks(p, o.lang)}</p>
        </div>
      </article>`;
}
/**
 * The contact details a provider gave us itself, shown in full.
 *
 * Standing rule from the owner: where a firm supplies its own details, publish all of them. That is
 * only ever data the firm sent in order to be reachable, so withholding half of it serves nobody.
 * It is deliberately NOT applied to rows read off a roster: a phone number on a consular list was
 * published by the embassy, not handed to us, and belongs to a different decision.
 *
 * Rendered as more <a class="sv-go"> in the card's existing link row, so a contact link is the same
 * object as the Website and Maps links beside it and needs no CSS of its own.
 */
const WA_HELLO = {
  en: 'Hello, I found you through thenomadhq.com',
  de: 'Guten Tag, ich habe Sie über thenomadhq.com gefunden',
  es: 'Hola, les encontré a través de thenomadhq.com',
  fr: 'Bonjour, je vous ai trouvés via thenomadhq.com',
  it: 'Buongiorno, vi ho trovati tramite thenomadhq.com',
  pt: 'Bom dia, encontrei-vos através de thenomadhq.com',
  nl: 'Goedendag, ik heb u gevonden via thenomadhq.com',
};

const SOCIAL_NAME = { linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok',
  vk: 'VK', wechat: 'WeChat', whatsapp: 'WhatsApp', xing: 'XING' };

function contactLinks(p, lang) {
  const out = [];
  // wa.me takes digits only: no plus, no spaces, no dashes.
  const wa = (p.whatsapp || '').replace(/[^\d]/g, '');
  if (wa) {
    // Greet them in a language they actually work in, which is the whole premise of the directory.
    const pick = (lang && WA_HELLO[lang]) ? lang
      : (p.languages || []).find((l) => WA_HELLO[l]) || 'en';
    out.push(`<a class="sv-go" href="https://wa.me/${wa}?text=${encodeURIComponent(WA_HELLO[pick])}"`
      + ` target="_blank" rel="nofollow noopener">WhatsApp</a>`);
  }
  // Shown even when the digits match the WhatsApp number: tapping "WhatsApp" and dialling are
  // two different things, and these hotlines are given as one number for both. An array because a
  // firm with an office line and a mobile sent both, and both are how to reach them.
  for (const tel of [].concat(p.phone || [])) {
    out.push(`<a class="sv-go" href="tel:${esc(String(tel).replace(/[^\d+]/g, ''))}">${esc(tel)}</a>`);
  }
  if (p.email) out.push(`<a class="sv-go" href="mailto:${esc(p.email)}">Email</a>`);
  for (const s of p.social || []) {
    let label = 'Profile';
    try { label = new URL(s).hostname.replace(/^www\./, '').split('.')[0]; } catch (e) { /* keep */ }
    // Capitalising the first letter gave "Linkedin", which is not how anyone writes it and reads as
    // carelessness on a card whose whole job is to look like it was checked.
    label = SOCIAL_NAME[label] || (label.charAt(0).toUpperCase() + label.slice(1));
    out.push(`<a class="sv-go" href="${esc(s)}" target="_blank" rel="nofollow noopener">`
      + esc(label) + `</a>`);
  }
  return out.join('');
}

module.exports = {
  esc, card, mapsUrl, contactLinks, WA_HELLO,
  words, list, plural, count, langName, an, catName, singular, who, niceDate, publisherOf,
  standfirst, provenance, claimScope, geography, alternatives, faq, gapSentence, BOILERPLATE,
};

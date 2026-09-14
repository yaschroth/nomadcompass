/**
 * Runs the live search that ships on /services, in Node, against the index it actually fetches, and
 * asserts what it puts on the screen.
 *
 * WHY THIS EXISTS
 *
 * Every defect this surface has had was invisible to the existing gates and visible in one second
 * to a person who opened the page. The suggestion list inserted "Madrid, Spain" and the search
 * returned one provider instead of 956, because the haystack has no comma. `indexOf('en')` matched
 * inside "denl", which is German and Dutch and contains no English. A city could be chosen that had
 * none of the selected combination. check_service_pages and check_filter_counts read the static
 * markup and all three of those live in the JavaScript, so all three shipped.
 *
 * There is no headless browser in this repo, so this builds the smallest DOM the script needs,
 * evaluates the page's own inline script inside it, and then drives it: set a control, dispatch the
 * event the page listens for, read what got written into #svHits. It is the shipped code, not a
 * reimplementation of it, which is the whole point. A reimplementation would agree with itself
 * while the page was broken.
 *
 * What it asserts, each one a bug that actually shipped:
 *   - a city alone returns that city's providers and nothing else
 *   - a service and a language together narrow, and the language test respects code boundaries
 *   - a name typed with its country attached still finds the provider
 *   - a combination with no answers explains which half is missing
 *   - the button out of the search names a page that exists
 *   - a provider that gave us its own contact details shows all of them
 *   - a practice with a service area and no address is not offered a map of it
 *
 * Usage: node scripts/check_service_search.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'services.html'), 'utf8');

/* ---------- the smallest DOM the script needs ------------------------------------------------ */

class El {
  constructor(tag, id) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.id = id || '';
    this.options = [];
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this._value = '';
    this.style = {};
    const cls = new Set();
    this.classList = {
      add: (n) => cls.add(n),
      remove: (n) => cls.delete(n),
      contains: (n) => cls.has(n),
      toggle: (n, on) => (on === undefined ? (cls.has(n) ? cls.delete(n) : cls.add(n)) : (on ? cls.add(n) : cls.delete(n))),
    };
  }

  get value() { return this._value; }

  // A real <select> refuses a value none of its options carry, and that refusal is load-bearing:
  // the filter bug was a select left at selectedIndex -1 reading back as "".
  set value(v) {
    if (this.tagName === 'SELECT') {
      this._value = this.options.some((o) => o.value === v) ? v : '';
      return;
    }
    this._value = v;
  }

  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }

  dispatch(type, ev) {
    (this.listeners[type] || []).forEach((fn) => fn(Object.assign({ preventDefault() {} }, ev)));
  }

  appendChild(c) { this.children.push(c); if (c.tagName === 'SCRIPT' && c.src) loadScript(c); return c; }

  setAttribute(k, v) { this.attrs[k] = String(v); }

  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }

  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k); }

  removeAttribute(k) { delete this.attrs[k]; }

  focus() {}

  scrollIntoView() {}

  querySelector() { return null; }

  querySelectorAll() { return []; }
}

let sandbox = null;

/** The page appends a <script src> for the index; here that means reading the file it names. */
function loadScript(el) {
  const file = path.join(ROOT, el.src.replace(/^\//, ''));
  if (!fs.existsSync(file)) { if (el.onerror) el.onerror(); return; }
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: el.src });
  if (el.onload) el.onload();
}

/** Pulls one <select>'s options straight out of the built page, so the values are the real ones. */
function selectFrom(html, id) {
  const m = new RegExp('<select id="' + id + '"[^>]*>([\\s\\S]*?)</select>').exec(html);
  if (!m) throw new Error('no <select id="' + id + '"> in services.html');
  const el = new El('select', id);
  const re = /<option value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g;
  let o;
  while ((o = re.exec(m[1]))) {
    el.options.push({ value: o[1], textContent: o[2].replace(/<[^>]*>/g, ''), disabled: false });
  }
  el._value = el.options.length ? el.options[0].value : '';
  return el;
}

const ids = {};
function el(id, tag) { ids[id] = ids[id] || new El(tag || 'div', id); return ids[id]; }

['svCity', 'svHits', 'svHitCount', 'svCta', 'svHitsMore', 'svResults', 'svCount', 'svGrid',
  'svMore', 'svEmpty', 'svEmptyWhy', 'svEmptyDo', 'svForm', 'svSearch', 'svReset'].forEach((i) => el(i));
ids.svCity.tagName = 'INPUT';
ids.svGrid.setAttribute('data-collapsed', '');
ids.svCityPick = selectFrom(HTML, 'svCityPick');
ids.svCat = selectFrom(HTML, 'svCat');
ids.svLang = selectFrom(HTML, 'svLang');

// The city cards the static grid ships. The script reads them to filter the grid and to decide
// whether a ?city= belongs to a page of its own, so they have to be real.
const cards = [];
const cardRe = /<article class="sv-ix"[^>]*data-city="([^"]+)"[^>]*data-name="([^"]*)"/g;
let c;
while ((c = cardRe.exec(HTML))) {
  const a = new El('article');
  a.setAttribute('data-city', c[1]);
  a.setAttribute('data-name', c[2]);
  cards.push(a);
}

const document = {
  getElementById: (id) => ids[id] || null,
  createElement: (t) => new El(t),
  createTextNode: (t) => ({ textContent: t }),
  querySelector: (sel) => {
    const m = /\.sv-ix\[data-city="([^"]+)"\]/.exec(sel);
    if (m) return cards.find((a) => a.getAttribute('data-city') === m[1]) || null;
    return null;
  },
  querySelectorAll: (sel) => (/\.sv-ix\b/.test(sel) ? cards : []),
  head: new El('head'),
  body: new El('body'),
  addEventListener() {},
};

const timers = [];
sandbox = vm.createContext({
  document,
  window: { location: new URL('https://thenomadhq.com/services'), NOMAD_SERVICES: null },
  history: { replaceState() {} },
  location: new URL('https://thenomadhq.com/services'),
  URL,
  URLSearchParams,
  console,
  // Debounces are the page's business, not this gate's. Collect and flush them by hand so a render
  // that the page scheduled 120ms out is measured rather than missed.
  setTimeout: (fn) => { timers.push(fn); return timers.length; },
  clearTimeout: (i) => { if (i) timers[i - 1] = null; },
  encodeURIComponent,
  decodeURIComponent,
});
sandbox.window.window = sandbox.window;
sandbox.globalThis = sandbox;

function flush() {
  for (let i = 0; i < 40 && timers.some(Boolean); i += 1) {
    const due = timers.splice(0, timers.length);
    due.forEach((fn) => fn && fn());
  }
}

/* ---------- run the page's own script --------------------------------------------------------- */

// The search lives in the last inline script on the page. Take every inline script that mentions
// svHits so a future split still runs.
const scripts = [...HTML.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .filter((s) => s.includes('svHits'));
if (scripts.length !== 1) {
  console.error(`FAIL: expected exactly one inline script driving #svHits, found ${scripts.length}`);
  process.exit(1);
}
try {
  vm.runInContext(scripts[0], sandbox, { filename: 'services.html inline' });
} catch (e) {
  console.error('FAIL: the page script threw on load: ' + e.message);
  process.exit(1);
}

/* ---------- drive it -------------------------------------------------------------------------- */

const fails = [];
const ok = [];
function check(name, cond, detail) {
  (cond ? ok : fails).push(name + (cond ? '' : ': ' + detail));
}

/** Sets the controls, fires what the page listens for, flushes debounces, returns the hit HTML. */
function search({ q = '', city = 'all', cat = 'all', lang = 'all' } = {}) {
  ids.svCity.value = q;
  ids.svCityPick.value = city;
  ids.svCat.value = cat;
  ids.svLang.value = lang;
  ids.svCity.dispatch('focus');          // loads the index, once
  flush();
  ids.svCityPick.dispatch('change');
  flush();
  return ids.svHits.innerHTML;
}

// The index is fetched on the first focus, which is the behaviour being tested: nothing is loaded
// until somebody actually searches.
ids.svCity.dispatch('focus');
flush();
const IDX = sandbox.window.NOMAD_SERVICES;
if (!IDX || !IDX.length) {
  console.error('FAIL: the page never loaded assets/service-search-index.js');
  process.exit(1);
}
const META = sandbox.window.NOMAD_SERVICE_CITIES || {};
const PAGES = sandbox.window.NOMAD_SERVICE_PAGES || {};
// The page escapes what it prints, so "R&amp;C Dental" has to come back as "R&C Dental" before it
// can be compared with the row it came from. Without this the gate reports its own bug.
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const names = (html) => [...html.matchAll(/<p class="sv-hit-name">(?:<a [^>]*>)?([^<]*)/g)].map((m) => unesc(m[1]));

// 1. A city on its own is a search. It used to return the 329-card grid instead.
const bigCity = Object.keys(META).map((s) => [s, IDX.filter((r) => r[1] === s).length])
  .sort((a, b) => b[1] - a[1])[0];
let html = search({ city: bigCity[0] });
const cityHits = names(html);
check('a city alone returns that city', cityHits.length > 0,
  `${bigCity[0]} has ${bigCity[1]} providers and the search showed none`);
const inCity = new Set(IDX.filter((r) => r[1] === bigCity[0]).map((r) => r[0]));
const strays = cityHits.filter((n) => !inCity.has(n));
check('a city returns only that city', strays.length === 0,
  'not from ' + bigCity[0] + ': ' + strays.slice(0, 3).join(' | '));

// 2. Language codes are concatenated pairs, so "en" hides inside "denl". Assert the boundary.
const pair = (() => {
  for (const r of IDX) {
    const ls = [];
    for (let i = 0; i < r[3].length; i += 2) ls.push(r[3].substr(i, 2));
    if (ls.length > 1) return { cat: r[2], lang: ls[1], city: r[1], name: r[0] };
  }
  return null;
})();
if (pair) {
  html = search({ city: pair.city, cat: pair.cat, lang: pair.lang });
  check('service + language narrows', names(html).includes(pair.name),
    `${pair.name} works in ${pair.lang} and did not come back`);
}
const straddle = IDX.find((r) => r[3].length >= 4 && r[3].slice(1, 3) === 'en' && !/(^|..)en/.test(r[3].match(/../g).join('')));
if (straddle) {
  html = search({ city: straddle[1], lang: 'en' });
  check('a language code is not matched across the boundary', !names(html).includes(straddle[0]),
    `${straddle[0]} speaks ${straddle[3]} and was returned as an English speaker`);
}

// 3. The suggestion list writes "Madrid, Spain"; the haystack has no comma.
const withCountry = (() => {
  const r = IDX.find((x) => META[x[1]] && META[x[1]][1]);
  return r ? { q: META[r[1]][0] + ', ' + META[r[1]][1], city: r[1] } : null;
})();
if (withCountry) {
  html = search({ q: withCountry.q });
  const n = IDX.filter((r) => r[1] === withCountry.city).length;
  check('a name typed with its country still matches', names(html).length > 1,
    `"${withCountry.q}" should find around ${n} and found ${names(html).length}`);
}

// 4. An impossible combination says which half is missing rather than "nothing matches".
const cats = [...new Set(IDX.map((r) => r[2]))];
const langs = [...new Set(IDX.flatMap((r) => (r[3].match(/../g) || [])))];
const impossible = (() => {
  for (const cat of cats) {
    for (const l of langs) {
      if (!IDX.some((r) => r[2] === cat && (r[3].match(/../g) || []).includes(l))) return { cat, lang: l };
    }
  }
  return null;
})();
if (impossible && ids.svCat.options.some((o) => o.value === impossible.cat)
  && ids.svLang.options.some((o) => o.value === impossible.lang)) {
  html = search({ cat: impossible.cat, lang: impossible.lang });
  check('an empty combination explains itself', names(html).length === 0 && /No provider/.test(ids.svHitCount.innerHTML),
    'the count line did not say the result was empty');
}

// 5. The button out of the search must name a page that exists.
html = search({ city: bigCity[0] });
const ctaHref = (/href="([^"]+)"/.exec(ids.svCta.innerHTML) || [])[1];
if (ctaHref) {
  const file = path.join(ROOT, ctaHref.replace(/^\//, '') + '.html');
  check('the button out of the search opens a page that exists', fs.existsSync(file),
    `${ctaHref} has no file`);
}

// 6. Contact details a provider gave us are shown in full, the rule this data carries.
const contacts = IDX.map((r, i) => [r, i]).filter(([r]) => r[7]);
if (contacts.length) {
  const [row] = contacts[0];
  html = search({ city: row[1], cat: row[2] });
  const li = (html.split('<li class="sv-hit">').find((s) => s.includes(row[0])) || '');
  const ct = row[7];
  if (ct.w) {
    check('a supplied WhatsApp number is offered', li.includes('wa.me/' + ct.w), `${row[0]} has one and the result showed none`);
    check('the WhatsApp link carries a greeting', /wa\.me\/\d+\?text=%?\w/.test(li), 'the prefilled message is missing');
  }
  if (ct.e) check('a supplied email is offered', li.includes('mailto:' + ct.e), `${row[0]} has one and the result showed none`);
  if (ct.p) check('a supplied phone number is offered', li.includes('tel:'), `${row[0]} has one and the result showed none`);
  (ct.s || []).forEach((s) => check('a supplied profile is offered', li.includes(s), `${row[0]}: ${s} missing`));
}

// 7. A practice that travels to you has a service area, not an address. Offering a map of it
// puts a pin on whichever of its districts Google prefers, which is a link that lies.
const mobile = IDX.find((r) => r[7] && r[7].m);
if (mobile) {
  html = search({ city: mobile[1], cat: mobile[2] });
  const li = (html.split('<li class="sv-hit">').find((s) => s.includes(mobile[0])) || '');
  check('a mobile practice is not offered a map of its service area', !li.includes('maps/search'),
    `${mobile[0]} has no address and the result offered a map anyway`);
}

/* ---------- report ---------------------------------------------------------------------------- */

if (fails.length) {
  console.error('check_service_search: ' + fails.length + ' of ' + (fails.length + ok.length) + ' assertions failed');
  fails.forEach((f) => console.error('  FAIL  ' + f));
  process.exit(1);
}
console.log('check_service_search: clean, ' + ok.length + ' assertions over '
  + IDX.length + ' providers, run against the page\'s own script.');
ok.forEach((o) => console.log('    ' + o));

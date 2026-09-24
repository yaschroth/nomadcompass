/**
 * Reads two more German official lists that name, per provider, the foreign languages that provider
 * works in, and whose terms do not forbid reuse. It sits beside read_de_chambers.cjs (KV Hamburg,
 * PTK NRW, RAK Freiburg) and follows the same rule; that script is not touched.
 *
 * THE TWO SOURCES
 *
 *   rakdus  Rechtsanwaltskammer Düsseldorf, "Anwaltssuche". The statutory bar of the Düsseldorf
 *           district (Landgerichte Düsseldorf, Duisburg, Kleve, Krefeld, Mönchengladbach, Wuppertal).
 *           Of our 1,000 cities only dusseldorf lies in it (Cologne is RAK Köln, Münster RAK Hamm).
 *           The chamber says of the language field: "Die Angaben erfolgen nach Selbsteinschätzung;
 *           eine Prüfung durch die Rechtsanwaltskammer findet nicht statt." So it is the lawyer's own
 *           statement, published by the chamber: the same footing as PTK NRW's member entries.
 *           Query: rak-dus.de/fuer-mandanten/anwaltssuche links out to an Angular app at
 *           rakdus-online-services.dev-mc.de/lawyer-search. The app ships socket.io, which made it look
 *           like a websocket-only search; it is not. Watching the page over the DevTools protocol shows
 *           two plain REST calls, and neither needs a cookie or token:
 *             GET  /api/v1/member/getAllSearchOptions.json   (41 language names, among other lists)
 *             POST /api/v1/member/searchByCriteria.json      form body dataValues[foreignLanguages][0]=Englisch
 *           The answer is JSON, every hit at once (English: 4,683 members, 3.8 MB, about 5 s), and each
 *           record carries the member's COMPLETE foreignLanguages list, main address, branch offices
 *           (offices[], branch=true), degrees and website. So one query per language gives everyone.
 *           TRAP: with no location the search covers the whole district and also members whose main
 *           office is abroad (country="SPANIEN", city="PALMA DE MALLORCA"); `propose` keeps only the
 *           address in Düsseldorf. A member whose main office is elsewhere but who has a BRANCH office in
 *           Düsseldorf is kept with that branch's street, and marked office: "branch".
 *           TRAP: the list can repeat a language inside one record ("englisch" twice); deduplicated.
 *           TRAP: about one in six members is a Syndikusrechtsanwalt (in-house counsel), who may act
 *           only for the employer; a member whose every profession is Syndikus is refused.
 *           TRAP: there is no per-member page; the app expands a row in place. sourceUrl is therefore
 *           the search page itself, where the entry is found by name.
 *           Terms: rak-dus.de/impressum AND the app's own /legal-notice (same text, read 2026-09-24):
 *           "Sie können unsere Informationen speichern und Verknüpfungen zu unseren Seiten einrichten.
 *           Bei Verlinkung von kommerziellen Anbietern müssen die Seiten der Rechtsanwaltskammer
 *           Düsseldorf alleiniger Bestandteil des Navigator-Fensters sein und die Rechtsanwaltskammer
 *           Düsseldorf muss als Quelle ersichtlich sein. Die Informationen dürfen nicht verändert oder
 *           verfälscht werden." So: store, link out (never frame), name the chamber, do not alter. Names
 *           and degrees are therefore printed as the register prints them ("Dr. iur.", "LL.M. (London)").
 *           The dev-mc.de host has no robots.txt (the SPA answers every path with index.html).
 *
 *   leipzig Stadt Leipzig (Gesundheitsamt + Referat für Migration und Integration), brochure
 *           "Mehrsprachige gesundheitsbezogene Angebote in Leipzig", 8th edition 01/2023, editorial
 *           close August 2022. The city's own list of dentists, midwives and speech therapists "Dort
 *           wird auch mindestens eine andere Sprache als Deutsch gesprochen". It is the only edition on
 *           leipzig.de (www. and static. serve the same file, Last-Modified 2023-03-21); the news item
 *           of 2023-01-04 calls it "eine regelmäßig aktualisierte Variante".
 *           Doctors and psychotherapists are NOT in it: page 14 sends readers to the KV Sachsen
 *           Arztsuche instead. The counselling chapters (Gesundheitsamt, addiction, family, HIV, PSZ)
 *           are public services and fit none of our categories, so only three chapters are read.
 *           Parsing: `pdftotext -raw` (xpdf 4 or poppler) gives the entries in content-stream order,
 *           one block per provider: name lines, street, "PLZ Ort", Tel., E-Mail, "Sprache(n):", the
 *           German language names, then the same names in their own script ("English | Русский").
 *           TRAP: -layout splits the page into two columns that do not line up (the right column
 *           runs longer), and the plain mode drops one "Sprache:" block (Rieger, p. 22). Only -raw
 *           keeps each block whole. TRAP: Arabic/Persian lines come out as reversed presentation forms;
 *           they are skipped. TRAP: the list is printed with a typo, "Potugiesisch" (Dentale MVZ).
 *           The free-translation (SprInt) symbol is drawn only in the counselling chapters, never in
 *           these three (checked by rendering the pages), so no language here is an interpreter claim.
 *           Terms: leipzig.de/impressum (read 2026-09-24) has no copyright, reuse or database clause at
 *           all; it only sets rules for LINKS (a link must load the whole page, no framing, do not use
 *           the city arms). The PDF carries no copyright line either.
 *           Categories: dentists are "dentist". Midwives and speech therapists have no category of
 *           their own; they are proposed as "doctor" (midwife) and "physio" (speech therapist) with
 *           specialty set, for the owner to accept or drop.
 *
 * THE RULE
 *
 * A language is published only where the source names it for that provider. German is never added
 * (these are German lists; it is the local language). A provider with more than six named foreign
 * languages is refused whole. A name we cannot map to one ISO 639-1 code in our language list
 * ("Serbokroatisch", "Kurdisch", "Pashto/dari", "Luxemburgisch", "Bosnisch") is dropped and listed in
 * refused.json; it never becomes a guess.
 *
 * STAGES
 *
 *   list     node scripts/read_de_more.cjs list --source rakdus|leipzig --cache <dir>
 *   propose  node scripts/read_de_more.cjs propose --source rakdus|leipzig --cache <dir>
 *              writes <dir>/<source>/proposals.json and refused.json
 *
 * There is no ingest stage on purpose: the owner decides per source.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SOURCE = val('--source');
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'de-more')));
const DIR = path.join(CACHE, SOURCE || '_');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;
const SUPPORTED = require(path.join(ROOT, 'data', 'service-languages.json'))._languages;

// German language names as these two lists print them, to ISO 639-1. RAK Düsseldorf prints them in
// lower case ("englisch", "französisch", "Farsi"); Leipzig capitalised, one typo ("Potugiesisch").
const LANG = {
  englisch: 'en', französisch: 'fr', spanisch: 'es', italienisch: 'it', russisch: 'ru', türkisch: 'tr',
  polnisch: 'pl', arabisch: 'ar', persisch: 'fa', farsi: 'fa', portugiesisch: 'pt', potugiesisch: 'pt',
  griechisch: 'el', chinesisch: 'zh', japanisch: 'ja', koreanisch: 'ko', niederländisch: 'nl',
  holländisch: 'nl', ukrainisch: 'uk', rumänisch: 'ro', ungarisch: 'hu', tschechisch: 'cs', kroatisch: 'hr',
  serbisch: 'sr', bulgarisch: 'bg', vietnamesisch: 'vi', indonesisch: 'id', dänisch: 'da', schwedisch: 'sv',
  norwegisch: 'no', finnisch: 'fi', slowakisch: 'sk', albanisch: 'sq', hebräisch: 'he', georgisch: 'ka',
  singhalesisch: 'si', thai: 'th', suaheli: 'sw', kisuaheli: 'sw',
};
// Not a working language here, and not counted towards the six.
const IGNORE = /^(deutsch|gebärdensprache|latein)$/;
function langCode(name) {
  const base = String(name).toLowerCase().trim();
  if (IGNORE.test(base)) return { ignore: true };
  const code = LANG[base];
  if (code && SUPPORTED[code]) return { code };
  return { unknown: base };
}
function codesOf(names) {
  const named = [...new Set(names.map((n) => n.trim()).filter(Boolean))].map((n) => ({ n, ...langCode(n) })).filter((x) => !x.ignore);
  return {
    named: named.map((x) => x.n),
    codes: [...new Set(named.filter((x) => x.code).map((x) => x.code))],
    unknown: named.filter((x) => x.unknown).map((x) => x.n),
  };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

async function http(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 55000);
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) }, signal: c.signal });
      clearTimeout(t);
      if (r.status === 200) return r;
      console.log(`  HTTP ${r.status} ${url}`);
    } catch (e) { console.log(`  ${e.name} ${url}`); }
    await sleep(4000 * (a + 1));
  }
  return null;
}
const save = (f, o) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1)); };
const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

// ============================================================================ rakdus
const RAKDUS_APP = 'https://rakdus-online-services.dev-mc.de';
const RAKDUS_SEARCH = RAKDUS_APP + '/lawyer-search';
const RAKDUS_API = RAKDUS_APP + '/api/v1/member';

async function rakdusList() {
  const opts = await (await http(RAKDUS_API + '/getAllSearchOptions.json')).json();
  const out = fs.existsSync(path.join(DIR, 'list.json')) ? load('list.json') : { langs: {}, members: {} };
  for (const lang of opts.foreignLanguages) {
    if (out.langs[lang] !== undefined) continue;
    const body = new URLSearchParams();
    body.append('dataValues[foreignLanguages][0]', lang);
    const r = await http(RAKDUS_API + '/searchByCriteria.json', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    if (!r) continue;
    const hits = await r.json();
    for (const m of hits) {
      // Contact fields a directory row never shows are not kept in the cache.
      const { email, mobile, fax, phone, ...keep } = m;
      out.members[m.id] = keep;
    }
    out.langs[lang] = hits.length;
    console.log(`  ${lang}: ${hits.length}`);
    save('list.json', out);
    await sleep(3000);
  }
  console.log(`${Object.keys(out.members).length} distinct members`);
}

// "Dr. iur." and "Prof." go in front of the name, every other degree ("LL.M. (London)", "Master of
// Laws", "Dipl.-Kaufmann") behind it, all as printed.
const PREFIX = /^(Prof|Dr|JUDr|Professor)/;
function rakdusName(m) {
  const pre = [m.academicTitle, ...m.academicDegrees.filter((d) => PREFIX.test(d))].filter(Boolean);
  const post = m.academicDegrees.filter((d) => !PREFIX.test(d));
  return [...pre, m.firstName, m.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() + (post.length ? ', ' + post.join(', ') : '');
}
const web = (w) => (w ? (/^https?:\/\//i.test(w) ? w : 'https://' + w.trim()) : undefined);

function rakdusPropose() {
  const L = load('list.json');
  const rows = []; const refused = [];
  for (const m of Object.values(L.members)) {
    const main = !m.country && m.city === 'Düsseldorf';
    const branch = !main && (m.offices || []).find((o) => o.branch && !o.country && o.city === 'Düsseldorf');
    if (!main && !branch) continue; // elsewhere in the district or abroad: not a row, not worth listing
    const name = rakdusName(m);
    // A Syndikusrechtsanwalt is in-house counsel: admitted only to advise the employer, so he cannot
    // take a private client. Kept only when the register also lists him in a practising profession.
    if (m.professions.length && m.professions.every((p) => /Syndikus/.test(p))) { refused.push({ name, why: 'in-house counsel only (Syndikus)', professions: m.professions }); continue; }
    const { named, codes, unknown } = codesOf(m.foreignLanguages);
    if (named.length > MAX_LANGS) { refused.push({ name, why: `${named.length} languages`, named }); continue; }
    if (unknown.length) refused.push({ name, why: 'unmapped language dropped', unknown });
    if (!codes.length) continue;
    const at = main ? m : branch;
    rows.push({
      city: 'dusseldorf', name, firm: at.co || undefined, category: 'legal', languages: codes,
      url: web(m.website), sourceUrl: RAKDUS_SEARCH, evidence: 'official', checked: TODAY,
      area: at.street || undefined, office: main ? undefined : 'branch',
      profession: m.professions.join(', '), quote: 'Fremdsprachen: ' + named.map(cap).join(', '), registerId: m.id,
    });
    // The register also records a second profession ("Rechtsanwalt, Steuerberater"). A lawyer the
    // chamber lists as Steuerberater is proposed once more under "tax", with the same languages.
    if (m.professions.some((p) => /^Steuerberater(in)?$/.test(p))) rows.push({ ...rows[rows.length - 1], category: 'tax' });
  }
  return { rows, refused };
}

// ============================================================================ leipzig
const LEJ_PAGE = 'https://www.leipzig.de/newsarchiv/news/broschuere-fuer-mehrsprachige-gesundheitsbezogene-angebote-neu-aufgelegt';
const LEJ_PDF = 'https://www.leipzig.de/fileadmin/mediendatenbank/leipzig-de/Stadt/02.5_Dez5_Jugend_Soziales_Gesundheit_Schule/53_Gesundheitsamt/Startseite/Mehrsprachige_gesundheitsbezogene_Angebote_in_Leipzig.pdf';

async function leipzigList() {
  const r = await http(LEJ_PDF);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, 'brochure.pdf'), buf);
  save('meta.json', { url: LEJ_PDF, lastModified: r.headers.get('last-modified'), bytes: buf.length, fetched: TODAY });
  console.log(`${buf.length} bytes, Last-Modified ${r.headers.get('last-modified')}`);
}

// The three chapters we read, by their heading line; the chapter that follows them ends the read.
const SECTIONS = {
  Zahnmedizin: { category: 'dentist' },
  Hebammen: { category: 'doctor', specialty: 'Hebamme (midwife)' },
  'Logopäden': { category: 'physio', specialty: 'Logopädie (speech therapist)' },
};
const STOP = /^(Gesundheitsfachberufe|Weitere Beratungsangebote)$/;
// A line in the providers' own scripts, printed under the German names: "English | Русский".
const NATIVE = /^(English|Русский|Français|Português|Español|Nederlands|Magyarul|Česky|Български|українською|Kisuaheli|\|)$/;
// Two practices are not persons; everything before the street is the practice's name. For these two
// the brochure's first lines are the name and the rest is a description.
const ORG_NAME = { Dentale: 3, Geburtshaus: 2 };
// A person's first line sometimes ends in a title and the name is on the next line
// ("Frau Dr. med. dent." / "Christian Baumberger").
const TITLE_ONLY = /^(Herr|Frau)( (Dr\.|med\.|dent\.|Dipl\.-Stom\.|MUDr\.|Univ\.|Prag|Dr\.\/Med\.|Uni|Sofia))+$/;

function leipzigPropose() {
  const raw = execFileSync('pdftotext', ['-enc', 'UTF-8', '-raw', path.join(DIR, 'brochure.pdf'), '-'], { maxBuffer: 1 << 26 }).toString('utf8');
  const pages = raw.split('\f');
  const rows = []; const refused = [];
  let section = null; let cur = null;
  const flush = () => {
    if (!cur || !section) { cur = null; return; }
    const e = cur; cur = null;
    if (!e.langLines) { if (e.lines.length) refused.push({ page: e.page, lines: e.lines, why: 'block without a language line (intro text?)' }); return; }
    const zi = e.lines.findIndex((l) => /^\d{5} \S/.test(l));
    const town = zi >= 0 ? e.lines[zi].slice(6).trim() : null;
    const street = zi > 0 ? e.lines[zi - 1] : null;
    const head = zi > 0 ? e.lines.slice(0, zi - 1) : e.lines.slice();
    let name; let note;
    if (ORG_NAME[head[0]]) { name = head.slice(0, ORG_NAME[head[0]]).join(' '); note = head.slice(ORG_NAME[head[0]]).join(' ') || undefined; } else {
      const n = TITLE_ONLY.test(head[0]) ? 2 : 1;
      name = head.slice(0, n).join(' ').replace(/^(Herr|Frau)\s+/, '');
      note = head.slice(n).join(' ') || undefined;
    }
    const names = e.langLines.join(' | ').split(/\s*\|\s*|\s+/).filter(Boolean);
    const { named, codes, unknown } = codesOf(names);
    const base = { name, page: e.page };
    if (town && town !== 'Leipzig') { refused.push({ ...base, why: `address in ${town}, not Leipzig` }); return; }
    if (named.length > MAX_LANGS) { refused.push({ ...base, why: `${named.length} languages`, named }); return; }
    if (unknown.length) refused.push({ ...base, why: 'unmapped language dropped', unknown });
    if (!codes.length) return;
    // Evelyn Müller has no practice address: the brochure prints the districts she visits instead.
    const area = street || (note ? 'Home visits: ' + note.replace(/^Hausbesuche für .*? in den Stadtteilen /, '').replace(/- /g, '') : undefined);
    rows.push({
      city: 'leipzig', name, category: SECTIONS[section].category, specialty: SECTIONS[section].specialty,
      languages: codes, sourceUrl: LEJ_PDF, evidence: 'official', checked: TODAY,
      area, note: street ? note : undefined, pdfPage: e.page,
      quote: (named.length > 1 ? 'Sprachen: ' : 'Sprache: ') + named.join(' | '),
    });
  };
  pages.forEach((pg, pi) => {
    for (const line0 of pg.split(/\r?\n/)) {
      const line = line0.trim();
      if (!line || /[؀-ۿﭐ-﻿]/.test(line) || /^\d{1,3}$/.test(line)) continue;
      if (SECTIONS[line]) { flush(); section = line; continue; }
      if (STOP.test(line)) { flush(); section = null; continue; }
      if (!section) continue;
      const lab = line.match(/^Sprachen?:\s*(.*)$/);
      if (cur && lab) { cur.langLines = []; cur.inLang = true; if (lab[1]) cur.langLines.push(lab[1]); continue; }
      if (cur && cur.inLang) {
        // German names continue ("Potugiesisch | Englisch | Arabisch |" / "Koreanisch") until the
        // first line that is not all German language names: that is the native-script line.
        const toks = line.split(/\s*\|\s*|\s+/).filter(Boolean);
        if (toks.length && toks.every((t) => LANG[t.toLowerCase()] || IGNORE.test(t.toLowerCase()) || /^[A-ZÄÖÜ][a-zäöü]+isch$/.test(t))) { cur.langLines.push(line); continue; }
        cur.inLang = false; cur.done = true;
      }
      if (cur && cur.done && line.split(/\s*\|\s*|\s+/).filter(Boolean).every((t) => NATIVE.test(t))) continue;
      if (/^(Herr|Frau)\b/.test(line) || !cur || cur.done) { flush(); cur = { page: pi + 1, lines: [], tel: false }; }
      if (/^(Tel\.|E-Mail)/.test(line) || cur.tel) { cur.tel = true; continue; }
      cur.lines.push(line);
    }
  });
  flush();
  return { rows, refused };
}

// ============================================================================ main
const SOURCES = {
  rakdus: {
    list: rakdusList, propose: rakdusPropose,
    source: {
      publisher: 'Rechtsanwaltskammer Düsseldorf', url: RAKDUS_SEARCH,
      licenceOrTermsQuote: 'rak-dus.de/impressum and the search app\'s own /legal-notice (read 2026-09-24): "Sie können unsere Informationen speichern und Verknüpfungen zu unseren Seiten einrichten. Bei Verlinkung von kommerziellen Anbietern müssen die Seiten der Rechtsanwaltskammer Düsseldorf alleiniger Bestandteil des Navigator-Fensters sein und die Rechtsanwaltskammer Düsseldorf muss als Quelle ersichtlich sein. Die Informationen dürfen nicht verändert oder verfälscht werden."',
      pageNote: 'The statutory bar of the Düsseldorf district publishes a search of its lawyers with the foreign languages each has registered with it. The languages are the lawyers\' own statements, which the chamber publishes without testing them.',
    },
  },
  leipzig: {
    list: leipzigList, propose: leipzigPropose,
    source: {
      publisher: 'Stadt Leipzig, Gesundheitsamt and Referat für Migration und Integration', url: LEJ_PDF,
      licenceOrTermsQuote: 'leipzig.de/impressum (read 2026-09-24) has no copyright, reuse or database clause; it only sets rules for links: "Links auf Internetseiten der Stadt Leipzig müssen zu einem vollständig neuen Laden der Seite, auf die verwiesen wird, führen. Der Inhalt verlinkter Seiten darf nicht als Teil anderer Seiten eingebunden werden." The brochure itself carries no copyright line.',
      pageNote: 'The City of Leipzig\'s health office publishes a brochure of dentists, midwives and speech therapists who work in at least one language besides German, with the languages each one gives. The current edition is from January 2023.',
    },
  },
};

(async () => {
  const S = SOURCES[SOURCE];
  if (!S || !['list', 'propose'].includes(cmd)) {
    console.log('usage: node scripts/read_de_more.cjs list|propose --source rakdus|leipzig --cache <dir>');
    process.exit(1);
  }
  if (cmd === 'list') { await S.list(); return; }
  const { rows, refused } = S.propose();
  rows.sort((a, b) => a.city.localeCompare(b.city) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  save('proposals.json', { source: S.source, written: TODAY, rows: rows.map((r) => JSON.parse(JSON.stringify(r))) });
  save('refused.json', refused);
  const by = {}; const lang = {};
  for (const r of rows) { const k = `${r.city}/${r.category}`; by[k] = (by[k] || 0) + 1; for (const l of r.languages) lang[l] = (lang[l] || 0) + 1; }
  console.log(`${rows.length} rows`, by, lang, `${refused.length} refused/notes`);
})();

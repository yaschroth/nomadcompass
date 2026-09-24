/**
 * Reads the register of the Ordre des traducteurs, terminologues et interprètes agréés du Québec
 * (OTTIAQ) for the certified translators and interpreters in our cities who hold a licence in a
 * language other than the local ones.
 *
 * WHY THIS SOURCE, AND WHY IT IS THE ONLY ONE HERE
 *
 * This reader came out of a sweep of registers with a per-person languages field in Canada, Ireland,
 * South Africa, Kenya, Nigeria, Ghana, Egypt, Morocco, Israel, the UAE outside Dubai, Qatar and
 * Saudi Arabia (2026-09-24). OTTIAQ was the one that is official, reachable and silent on reuse:
 *
 *   - OTTIAQ is a professional order under Quebec's Code des professions: the titles "traducteur
 *     agréé", "interprète agréé" and "terminologue agréé" are reserved to its members by law, and
 *     each licence (permis) is issued for one language pair after the order has assessed it. The
 *     pair is therefore the regulator's statement, not the member's self-description. Official tier.
 *   - The répertoire says what it is for: "Le répertoire est mis à la disposition du public afin
 *     que celui-ci puisse vérifier si une personne est membre de l'Ordre. Il permet également
 *     d'effectuer une recherche pour répondre à un besoin précis, selon la combinaison linguistique
 *     et le domaine de spécialisation." robots.txt disallows nothing outside /wp/wp-admin/. The
 *     site's only policy pages (Sécurité et confidentialité, Protection des renseignements
 *     personnels) say nothing about reuse; there is no terms-of-use page. The page note credits it.
 *
 * What was checked and refused, so nobody repeats it (quotes are the sites' own words):
 *   - ATIO (Ontario's statutory translators' association, same kind of data, Toronto and Ottawa):
 *     its Linking Policy "prohibits the creation of links to, caching of, and the framing of any
 *     portion of http://www.atio.on.ca ... by anyone except certified ATIO professionals in good
 *     standing", and anyone who "intends to represent to the public that they make referrals to
 *     ... an individual that is certified" must first "provide ATIO with a written list" for its
 *     approval. ASK PERMISSION. (The data is there: POST /directory/translator/ with
 *     search[atio_languages_source][query][]=ES and search[address_city_1][query]=Toronto, then
 *     admin-ajax.php action=paupanels with the serialized rel and the page's paupanels_nonce.)
 *   - Barreau du Québec, Trouver un avocat: has a language filter (l=ES, r=07 is Montréal, about
 *     1,800 lawyers for Spanish alone) but each lawyer's card sits behind a captcha and the terms
 *     say "Nul ne peut vendre ou modifier, à des fins publiques ou commerciales, les textes ...
 *     et renseignements" and allow use "non pour une reproduction, une publication ou une
 *     distribution de quelque nature que ce soit". ASK PERMISSION.
 *   - Abu Dhabi Department of Health, Find a Medical Professional (on TAMM): every licensed
 *     professional carries currentlanguageEn ("English - Arabic"), but the API only answers the
 *     TAMM front end (a CSRF token; plain requests get a WAF page), and TAMM's copyright page
 *     allows reproduction "for personal, non-commercial use, or for use within your organisation"
 *     and its terms threaten action against "collecting or storing personal information about
 *     others". ASK PERMISSION. The records also carry date of birth, which must never be copied.
 *   - No language field at all: CMQ (Quebec physicians; the getPhysicianDetails payload has none),
 *     RCDSO (Ontario dentists), Law Society of BC, Law Society of Ireland, the Irish Medical
 *     Council, Qatar MOPH (via Hukoomi), the Alinity registers (Physiotherapy Alberta, College of
 *     Alberta Psychologists, CHCPBC: no language search field).
 *   - Unreachable from here: CPSA (search.cpsa.ca refuses the connection), Law Society of Alberta
 *     (Wordfence "access limited"), Alberta Find a Provider, OACIQ, Chambre des notaires, OMVQ,
 *     ODQ, STIBC, Law Society of Ontario, gov.il, MDCN, LPC (403 or Cloudflare challenges).
 *
 * THE RULE
 *
 * A language is published when the member holds a licence (permis) whose source or target is that
 * language, and the member's own page on ottiaq.org shows that pair ("Espagnol → Français"). The
 * page is fetched and the pair must be found on it; the GraphQL answer alone is not the evidence,
 * the page a reader can open is.
 *
 * Local languages are dropped: English and French everywhere in Canada (the brief for this sweep;
 * note that service_data.cjs LOCAL has Canada: null), and for the handful of members abroad the
 * country's language as service_data.cjs LOCAL gives it (see LOCAL_OF below). Most members
 * hold only English and French, so most of the register yields nothing, which is correct.
 *
 * Refused, and listed in refused.json:
 *   - statut "Membre n'exerçant plus" (a member who no longer practises).
 *   - profession "Candidat à l'exercice" (not yet licensed).
 *   - sign languages (Langue des signes québécoise, ASL): real licences, but the directory has no
 *     code for them. Counted, not mapped to anything.
 *   - names the directory cannot place in one language: "Serbo-Croatian", "Iranian", "Berber".
 *   - more than 6 languages in total, per the site-wide rule.
 *
 * WHERE A MEMBER IS
 *
 * Only about a quarter of members publish an address, and only those can be placed in a city. The
 * address line holding the city reads "Montréal (Québec) H2S 2A2". Traps:
 *   - Montreal addresses often name the borough, not the city ("Verdun (Québec) H4G ..."). Borough
 *     names are accepted only with a Montreal-island postal code (H). Westmount, Mont-Royal,
 *     Côte-Saint-Luc, Pointe-Claire, Dorval, Kirkland and the other island suburbs are separate
 *     municipalities and are NOT Montreal; they are counted as "near, not placed".
 *   - Ottawa absorbed Nepean, Gloucester and Kanata in 2001, Toronto absorbed North York in 1998,
 *     Quebec City absorbed Sainte-Foy, Charlesbourg, Beauport and others in 2002: those names are
 *     accepted with the right province. L'Ancienne-Lorette and Gatineau are separate cities.
 *   - "Montpellier (Québec)" and "Cambridge (Ontario)" are Canadian places that share a name with
 *     cities on our list. The province in brackets decides, and a foreign city must also match
 *     the country line (in French: "États-Unis", "Pérou", "Pays-Bas", "Royaume-Uni").
 *   - "Montreal" and "Montréal", "Quebec" and "Québec", "Saint Laurent" and "Saint-Laurent" all
 *     occur: names are compared with accents, spaces and hyphens folded away.
 *
 * Member numbers are not all digits ("30925-TRAG"); the page URL takes them as they are.
 *
 * STAGES
 *
 *   list     node scripts/read_anglo_registers.cjs list --cache <dir>
 *              one GraphQL call for the language list, one for all members (about 2,100, a 4 MB
 *              answer). Checks that the count equals "total".
 *   pages    node scripts/read_anglo_registers.cjs pages --cache <dir>
 *              fetches the ottiaq.org/repertoire/<no> page of every member who could yield a row,
 *              gzipped into the cache, two at a time. Resumable.
 *   propose  node scripts/read_anglo_registers.cjs propose --cache <dir>
 *              applies the rule and writes <dir>/proposals.json and <dir>/refused.json, and lists
 *              rows whose name already exists in that city in data/service-languages.json.
 *
 * Nothing here writes to data/. The rows use the directory's own row shape (city, name, category,
 * languages, sourceUrl, evidence, checked, area, quote) so the usual ingest can take them.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const GQL = 'https://ottiaq.org/wp/graphql/';
const PAGE = (no) => 'https://ottiaq.org/repertoire/' + encodeURIComponent(no);

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'ottiaq')));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ---- where ------------------------------------------------------------------
// [our city id, the names an address may give, the province or country in brackets / on the last
// line, postal-code test or null]
const MTL_BOROUGHS = ['Ahuntsic', 'Cartierville', 'Anjou', 'Côte-des-Neiges', 'Notre-Dame-de-Grâce', 'Lachine', 'LaSalle',
  'Plateau-Mont-Royal', 'Sud-Ouest', "L'Île-Bizard", 'Sainte-Geneviève', 'Mercier', 'Hochelaga-Maisonneuve', 'Montréal-Nord',
  'Outremont', 'Pierrefonds', 'Roxboro', 'Rivière-des-Prairies', 'Pointe-aux-Trembles', 'Rosemont', 'Saint-Laurent',
  'Saint-Léonard', 'Verdun', 'Ville-Marie', 'Villeray', 'Saint-Michel', 'Parc-Extension'];
const QC_BOROUGHS = ['Sainte-Foy', 'Sillery', 'Cap-Rouge', 'Charlesbourg', 'Beauport', 'Loretteville', 'Val-Bélair', 'Lac-Saint-Charles',
  'Saint-Émile', 'Vanier', 'Duberger', 'Les Saules', 'Neufchâtel'];
const PLACES = [
  { city: 'montreal', names: ['Montréal'], region: 'quebec', postal: /^H/ },
  { city: 'montreal', names: MTL_BOROUGHS, region: 'quebec', postal: /^H/, borough: true },
  { city: 'quebeccity', names: ['Québec', 'Quebec City', 'Ville de Québec'], region: 'quebec', postal: /^G/ },
  { city: 'quebeccity', names: QC_BOROUGHS, region: 'quebec', postal: /^G/, borough: true },
  { city: 'ottawa', names: ['Ottawa'], region: 'ontario', postal: /^K/ },
  { city: 'ottawa', names: ['Nepean', 'Gloucester', 'Kanata', 'Orléans', 'Vanier'], region: 'ontario', postal: /^K/, borough: true },
  { city: 'toronto', names: ['Toronto'], region: 'ontario', postal: /^M/ },
  { city: 'toronto', names: ['North York', 'Scarborough', 'Etobicoke', 'East York', 'York'], region: 'ontario', postal: /^M/, borough: true },
  { city: 'calgary', names: ['Calgary'], region: 'alberta', postal: /^T/ },
  { city: 'vancouver', names: ['Vancouver'], region: 'colombiebritannique', postal: /^V/ },
  { city: 'victoria', names: ['Victoria'], region: 'colombiebritannique', postal: /^V/ },
  { city: 'halifax', names: ['Halifax'], region: 'nouvelleecosse', postal: /^B/ },
  // Abroad: the last address line is the country, in French.
  { city: 'lima', names: ['Lima'], country: 'perou' },
  { city: 'newyork', names: ['New York'], country: 'etatsunis' },
  { city: 'atlanta', names: ['Atlanta'], country: 'etatsunis' },
  { city: 'thehague', names: ['Den Haag', 'La Haye', 'The Hague'], country: 'paysbas' },
  { city: 'brighton', names: ['Brighton'], country: 'royaumeuni' },
  { city: 'cordoba', names: ['Córdoba', 'Cordoba'], country: 'argentine' },
  { city: 'algiers', names: ['Alger', 'Algiers'], country: 'algerie' },
];
const REGION_ALIAS = { qc: 'quebec', on: 'ontario', ab: 'alberta', bc: 'colombiebritannique', britishcolumbia: 'colombiebritannique', ns: 'nouvelleecosse' };

function placeOf(adresse) {
  const lines = String(adresse || '').split(/<br\s*\/?>/i).map((s) => s.replace(/&#39;/g, "'").trim()).filter(Boolean);
  if (lines.length < 2) return { why: 'no address' };
  const country = fold(lines[lines.length - 1]);
  // The locality line is the last one before the country that has "(Region)" in it, or, abroad
  // without brackets ("Den Haag 2585XN"), the line before the country.
  const body = lines.slice(0, -1);
  let loc = [...body].reverse().find((s) => /\(.+\)/.test(s)) || body[body.length - 1];
  const m = loc.match(/^(.*?)\s*\(([^)]*)\)\s*(.*)$/);
  const town = (m ? m[1] : loc.replace(/\s+[0-9A-Z]{4,}\s*$/, '')).trim();
  const region = fold(m ? m[2] : '');
  const postal = (m ? m[3] : '').replace(/\s+/g, '').toUpperCase();
  const t = fold(town);
  for (const p of PLACES) {
    if (!p.names.some((n) => fold(n) === t)) continue;
    if (p.country) {
      if (country === p.country) return { city: p.city, town, country };
      continue;
    }
    if (country !== 'canada') continue;
    if ((REGION_ALIAS[region] || region) !== p.region) continue;
    if (p.postal && postal && !p.postal.test(postal)) continue;
    if (p.borough && !postal) continue; // a borough name without a postal code is too ambiguous
    // The area is the borough's standard spelling, not the member's ("Saint Laurent", "L'île Bizard").
    const std = p.names.find((n) => fold(n) === t);
    return { city: p.city, town, area: p.borough ? std : undefined, country: 'canada' };
  }
  return { why: 'not one of our cities', town, country };
}

// ---- languages --------------------------------------------------------------
function langMap() {
  const ours = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'))._languages;
  const byName = {};
  for (const [code, name] of Object.entries(ours)) byName[fold(name)] = code;
  // OTTIAQ's English names that differ from ours. Mandarin and Cantonese are both Chinese here,
  // the directory has one code for it. Filipino is the standardised Tagalog.
  Object.assign(byName, { mandarin: 'zh', cantonese: 'zh', chinese: 'zh', filipino: 'tl', panjabi: 'pa', punjabi: 'pa', farsi: 'fa' });
  return byName;
}
const SIGN = /sign language/i;
const AMBIGUOUS = /^(serbo-croatian|iranian|berber)$/i; // no one language of ours to put it under

// Written out for the cities PLACES can yield, and copied from service_data.cjs LOCAL, rather than
// required from it: service_data exits the process whenever the live dataset holds a country its
// LOCAL table lacks, which other work in progress can cause at any time, and a reader that only
// needs fourteen entries should not die of it. Canada is ['en', 'fr'] by this sweep's brief
// (LOCAL has Canada: null).
const LOCAL_OF = {
  montreal: ['en', 'fr'], quebeccity: ['en', 'fr'], ottawa: ['en', 'fr'], toronto: ['en', 'fr'], calgary: ['en', 'fr'],
  vancouver: ['en', 'fr'], victoria: ['en', 'fr'], halifax: ['en', 'fr'],
  lima: ['es'], cordoba: ['es'], newyork: ['en'], atlanta: ['en'], brighton: ['en'], thehague: ['nl'], algiers: ['ar'],
};
function localFor(city) {
  if (!LOCAL_OF[city]) throw new Error('no local language written down for ' + city);
  return LOCAL_OF[city];
}

// ---- http -------------------------------------------------------------------
async function post(body) {
  for (let a = 0; a < 3; a += 1) {
    try {
      const r = await fetch(GQL, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
      if (r.status === 200) return await r.json();
      console.log('graphql status ' + r.status);
    } catch (e) { console.log('graphql ' + e.message); }
    await sleep(5000 * (a + 1));
  }
  return null;
}
async function getText(url) {
  for (let a = 0; a < 3; a += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40000) });
      if (r.status === 200) return await r.text();
      if (r.status === 404 || r.status === 500) return null;
    } catch (e) { /* retried */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}

// ---- list -------------------------------------------------------------------
async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const meta = await post({ query: '{ connexenceMeta }' });
  if (!meta) throw new Error('no answer for connexenceMeta');
  fs.writeFileSync(path.join(CACHE, 'meta.json'), JSON.stringify(meta.data.connexenceMeta));
  // The register serves everyone in one answer when asked for more than it holds. "seed" fixes the
  // random order the site shows, which does not matter here but keeps two runs comparable.
  const all = await post({ query: '{ connexenceMembers(limit: 5000, offset: 0, seed: 1) }' });
  if (!all) throw new Error('no answer for connexenceMembers');
  const c = all.data.connexenceMembers;
  if (c.hasMore || c.members.length !== c.total) throw new Error(`incomplete: ${c.members.length} of ${c.total}`);
  fs.writeFileSync(path.join(CACHE, 'members.json'), JSON.stringify({ listed: new Date().toISOString().slice(0, 10), members: c.members }));
  console.log(`${c.members.length} members, ${meta.data.connexenceMeta.langs.length} languages`);
}

// ---- candidates (shared by pages and propose) -------------------------------
function load() {
  const meta = JSON.parse(fs.readFileSync(path.join(CACHE, 'meta.json'), 'utf8'));
  const { listed, members } = JSON.parse(fs.readFileSync(path.join(CACHE, 'members.json'), 'utf8'));
  const LN = {};
  for (const l of meta.langs) LN[l.identifiant] = l;
  return { LN, listed, members };
}
function assess(m, LN, byName) {
  const name = `${m.prenom || ''} ${m.nom || ''}`.replace(/\s+/g, ' ').trim();
  const out = { no: m.numeroMembre, name, refused: null, sign: [], unmapped: [] };
  if (/n.exer[cç]ant plus/i.test(m.statutDossier || '')) { out.refused = 'no longer practising (' + m.statutDossier + ')'; return out; }
  const permis = (m.permis || []).filter((p) => !/candidat/i.test(p.profession || ''));
  if (!permis.length) { out.refused = (m.permis || []).length ? 'candidate, not yet licensed' : 'no licence listed'; return out; }
  const place = placeOf(m.adresse);
  out.place = place;
  if (!place.city) { out.refused = place.why; return out; }
  const local = localFor(place.city);
  const all = new Set(); const pairs = [];
  for (const p of permis) {
    const a = LN[p.langueDepart]; const b = LN[p.langueArrivee];
    if (!a || !b) { out.unmapped.push(`${p.langueDepart}>${p.langueArrivee}`); continue; }
    pairs.push({ from: a, to: b, profession: p.profession, sexe: m.sexe });
    for (const l of [a, b]) {
      if (SIGN.test(l.nomAnglais)) { out.sign.push(l.nomAnglais); continue; }
      if (AMBIGUOUS.test(l.nomAnglais)) { out.unmapped.push(l.nomAnglais); continue; }
      const code = byName[fold(l.nomAnglais)];
      if (!code) { out.unmapped.push(l.nomAnglais); continue; }
      all.add(code);
    }
  }
  out.pairs = pairs;
  out.all = [...all];
  out.languages = out.all.filter((c) => !local.includes(c));
  if (out.all.length > MAX_LANGS) { out.refused = out.all.length + ' languages'; return out; }
  if (!out.languages.length) { out.refused = 'local languages only'; return out; }
  return out;
}

// ---- pages ------------------------------------------------------------------
const pagePath = (no) => path.join(CACHE, 'pages', String(no).replace(/[^0-9A-Za-z-]/g, '_') + '.html.gz');
async function pages() {
  const { LN, members } = load();
  const byName = langMap();
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const todo = members.map((m) => assess(m, LN, byName)).filter((a) => !a.refused && !fs.existsSync(pagePath(a.no)));
  console.log(`${todo.length} member pages to fetch`);
  let i = 0; let ok = 0; let bad = 0;
  const worker = async () => {
    while (i < todo.length) {
      const a = todo[i++];
      const t = await getText(PAGE(a.no));
      if (t && t.includes('No de membre')) { fs.writeFileSync(pagePath(a.no), zlib.gzipSync(t)); ok += 1; } else bad += 1;
      await sleep(700);
    }
  };
  await Promise.all([worker(), worker()]);
  console.log(`fetched ${ok}, failed ${bad}`);
}

// ---- propose ----------------------------------------------------------------
const flat = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&rarr;/g, '→').replace(/&harr;/g, '↔').replace(/\s+/g, ' ');
// The title as the order writes it, in the member's grammatical gender (meta.professions.fr has f/m/o).
function titleOf(meta, profession, sexe) {
  const p = ((meta.professions || {}).fr || []).find((x) => x.id === profession);
  if (!p) return profession;
  const g = /femme/i.test((sexe || {}).sexeFrancais || '') ? 'f' : /homme/i.test((sexe || {}).sexeFrancais || '') ? 'm' : 'o';
  return p[g] || p.o;
}
// A register's name in capitals ("MARIA OCANDO") is re-cased; names written normally are left alone.
const recase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s);

function propose() {
  const { LN, listed, members } = load();
  const meta = JSON.parse(fs.readFileSync(path.join(CACHE, 'meta.json'), 'utf8'));
  const byName = langMap();
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
  const known = new Set(db.providers.map((p) => p.city + '|' + fold(p.name)));
  const rows = []; const refused = []; const tally = {};
  const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
  const near = {};
  for (const m of members) {
    const a = assess(m, LN, byName);
    if (a.sign.length) count('holds a sign-language licence (not mapped)');
    if (a.refused) {
      count(a.refused === 'not one of our cities' || a.refused === 'no address' ? a.refused : 'refused: ' + a.refused.replace(/\d+ languages/, 'more than 6 languages'));
      if (a.refused === 'not one of our cities' && a.place && a.place.country === 'canada') near[a.place.town] = (near[a.place.town] || 0) + 1;
      if (!/not one of our cities|no address|local languages only/.test(a.refused)) refused.push({ no: a.no, name: a.name, why: a.refused });
      continue;
    }
    if (a.unmapped.length) refused.push({ no: a.no, name: a.name, why: 'partly unmapped: ' + a.unmapped.join(', ') });
    const f = pagePath(a.no);
    if (!fs.existsSync(f)) { count('page not fetched'); continue; }
    const page = flat(zlib.gunzipSync(fs.readFileSync(f)).toString());
    // Every pair the row rests on must be printed on the member's own page, in the order's words.
    // A member licensed both ways gets one line with a double arrow ("Français ↔ Portugais"), in
    // either order; matching only "→" refused 20 members the first time round.
    const f1 = (p) => p.from.nomFrancais; const f2 = (p) => p.to.nomFrancais;
    const shown = a.pairs.filter((p) => page.includes(`${f1(p)} → ${f2(p)}`) ||
      page.includes(`${f1(p)} ↔ ${f2(p)}`) || page.includes(`${f2(p)} ↔ ${f1(p)}`));
    const shownCodes = new Set(shown.flatMap((p) => [p.from, p.to]).map((l) => byName[fold(l.nomAnglais)]).filter(Boolean));
    const languages = a.languages.filter((c) => shownCodes.has(c));
    if (!languages.length) { count('pair not found on the member page'); refused.push({ no: a.no, name: a.name, why: 'pair not on page' }); continue; }
    const quote = [...new Set(shown.filter((p) => [p.from, p.to].some((l) => languages.includes(byName[fold(l.nomAnglais)])))
      .map((p) => `${titleOf(meta, p.profession, p.sexe)}, ${p.from.nomFrancais} → ${p.to.nomFrancais}`))].join('; ');
    const name = recase(a.name);
    const row = {
      city: a.place.city, name, category: 'translator', languages,
      sourceUrl: PAGE(a.no), evidence: 'official',
      checked: fs.statSync(f).mtime.toISOString().slice(0, 10),
      ...(a.place.area ? { area: a.place.area } : {}),
      quote,
    };
    if (known.has(row.city + '|' + fold(name))) { count('already in the directory under that name'); row.dupeOfExisting = true; }
    rows.push(row);
    count('proposed');
  }
  const out = {
    source: {
      publisher: "Ordre des traducteurs, terminologues et interprètes agréés du Québec (OTTIAQ)",
      url: 'https://ottiaq.org/repertoire',
      licenceOrTermsQuote: "Le répertoire est mis à la disposition du public afin que celui-ci puisse vérifier si une personne est membre de l'Ordre. Il permet également d'effectuer une recherche pour répondre à un besoin précis, selon la combinaison linguistique et le domaine de spécialisation. (No terms-of-use page exists; the privacy and security pages say nothing about reuse; robots.txt disallows only /wp/wp-admin/.)",
      pageNote: "Some of these are certified translators and interpreters listed by OTTIAQ, the professional order that licenses them in Quebec. Each language shown is one the order has licensed them to translate or interpret, as printed on their entry in its public register.",
      listed,
    },
    rows,
  };
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(tally);
  const by = {}; const bl = {};
  rows.forEach((r) => { by[r.city] = (by[r.city] || 0) + 1; r.languages.forEach((l) => { bl[l] = (bl[l] || 0) + 1; }); });
  console.log('by city', by);
  console.log('by language', bl);
  console.log('Canadian towns near but not placed', Object.entries(near).sort((x, y) => y[1] - x[1]).slice(0, 15).map((x) => x.join(':')).join(', '));
}

(async () => {
  if (cmd === 'list') await list();
  else if (cmd === 'pages') await pages();
  else if (cmd === 'propose') propose();
  else console.log('usage: node scripts/read_anglo_registers.cjs list|pages|propose --cache <dir>');
})();

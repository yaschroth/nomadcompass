/**
 * Reads the official Latin American rolls that name a provider together with the foreign languages
 * that provider is licensed or appointed to work in.
 *
 * WHY THESE SOURCES
 *
 * A search of health ministries, tourism boards, medical councils, health-provider registers and
 * bar associations in the sixteen countries our Latin American cities sit in (2026-09-24) found no
 * public register that prints a language against a named doctor, dentist, lawyer or clinic. Brazil's
 * CFM "Busca Médicos" has name, CRM, state, specialty and status, and no language; Colombia's REPS
 * provider directory and the tourism-board lists are the same shape or are promotional brochures.
 *
 * What these countries do have is the sworn or public translator (traductor público, tradutor
 * público e intérprete comercial), appointed or licensed PER LANGUAGE by a public body, and several
 * of those bodies publish the roll. The language on such a roll is not a self-description: it is the
 * language the state examined the person in and licensed them for. That is the official tier.
 *
 * SOURCES READ HERE
 *
 *   ctpcba   Colegio de Traductores Públicos de la Ciudad de Buenos Aires, the college that holds
 *            the matrícula under Ley 20.305. Every matriculated translator with a web profile has a
 *            page at /traductor/<slug>/, and the site's own sitemaps (traductores-sitemap1..8.xml)
 *            list them all. The page prints "Idiomas" (the languages of the matrícula), province,
 *            barrio, address, phone, email. City: buenosaires where the province reads "C.A.B.A.".
 *            "GBA GRAN BS. AS." (the suburbs) is not the city and is not proposed.
 *            The site's own search shows "de forma aleatoria hasta 30" (a random 30), so the
 *            sitemaps, not the search, are the only way to read the whole roll.
 *   jucesp   Junta Comercial do Estado de São Paulo, "Consultas Leiloeiro e Tradutor": one POST
 *            returns every tradutor público e intérprete comercial ever matriculated in the state
 *            (about 1,535), with languages, city, phones, email, website and status. Only status
 *            "Atuante" is proposed, and only city São Paulo.
 *   cr-rree  Costa Rica's Ministerio de Relaciones Exteriores y Culto, "Traductores e Intérpretes
 *            Oficiales": an AJAX endpoint behind the page returns the whole list as <li> items with
 *            appointment type, languages, province and canton, phones and email.
 *   pe-rree  Peru's Ministerio de Relaciones Exteriores, "Directorio de Traductores Públicos del
 *            Perú": one PDF per language of the Traductores Públicos Juramentados it appointed and
 *            ratified. Every "sede" in the 2026 PDFs is a Lima district.
 *   ctsf2    Colegio de Traductores de la Provincia de Santa Fe, 2.ª Circunscripción (Rosario),
 *            created by provincial Ley 10.757: "Listado de profesionales", read through its pager
 *            with the seed held fixed, then one profile page each. City: rosario, by "Localidad".
 *
 * LOOKED AT AND NOT READ HERE (see the agent report for the quotes)
 *
 *   Colegio de Traductores Públicos del Uruguay: its public getTraductores.php returns every
 *   member's national ID number and password hash beside the profile. Not used, not stored.
 *   Consejo de la Judicatura Federal (Mexico), 2026 list of peritos: a 44 MB scan with OCR'd names,
 *   no contact data and only a judicial circuit (state) for place.
 *   Tribunal Superior de Justicia CDMX peritos list, JUCEB, JUCESC, JUCEPE, Poder Judicial de
 *   Guanajuato: behind a Cloudflare challenge or unreachable from outside the country.
 *
 * THE RULE
 *
 * A row is proposed only where the roll itself names the language. The local language is never
 * published: Spanish on the Spanish-speaking rolls, Portuguese on the Brazilian one (the Costa Rican
 * roll lists "Español" beside the foreign language, and it is dropped). A language the directory has
 * no code for (Latin, Quechua) is not published; if nothing is left, the person is refused.
 * More than six languages is refused whole.
 *
 * TRAPS
 *
 *   - The RREE Costa Rica endpoint ignores "limit" above its own page size only if you page; asking
 *     for limit=2000 at offset 0 returned all 277 in one response (offset 277 returns one empty li).
 *   - JUCESP needs the __RequestVerificationToken from the GET and the cookie that came with it,
 *     or the POST answers with the empty form.
 *   - JUCESP marks people "Atuante" who took office in the 1950s. Anyone appointed more than 60
 *     years before the check is refused as a stale entry rather than published as a working
 *     translator; the report lists them.
 *   - The Peru PDFs lay out one person per sede, vertically centred, so a two-line name can have
 *     its second line below the row and an address line above it. pdftotext -table (xpdf 4) keeps
 *     the columns; the name is read from the row's own line plus a continuation directly below it at
 *     the same column, and every name must come out as "SURNAMES, GIVEN NAMES" or it is refused.
 *     Districts are matched against the list of Lima districts, not read by column, because the
 *     column drifts between pages.
 *   - Two PDFs sit under the German page (an old one and the 2026 one); the dated one is used.
 *   - The CTPCBA site carries a hidden "Our partner: essay writing service" spam link in its footer
 *     comment. It is not ours to fix, but it means the WordPress install is not well kept.
 *
 *   fetch    node scripts/read_latam_sources.cjs fetch <ctpcba|jucesp|cr-rree|pe-rree|all> --cache <dir> [--conc 3]
 *   propose  node scripts/read_latam_sources.cjs propose --cache <dir> [--out <dir>]
 *
 * Nothing here writes under data/. It reads data/service-languages.json only to mark rows the
 * directory already holds. Ingest is a separate, reviewed step.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'latam')));
const OUT = path.resolve(val('--out', CACHE));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;
const today = () => new Date().toISOString().slice(0, 10);

async function get(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      // A stalled response never ends on its own: node's fetch has no read timeout, and one hung
      // socket froze the Rosario pager for ten minutes before this was added.
      const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(60000), headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
      if (r.status === 200) return opts.binary ? Buffer.from(await r.arrayBuffer()) : await r.text();
      if (r.status === 404 || r.status === 410) return null;
    } catch (e) { /* retried below */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}
// The Ecuadorian judiciary's host drops about one connection in five from outside the country
// (connect timeout, not a refusal); five tries three seconds apart get through.
async function retry(fn) {
  for (let a = 0; ; a += 1) {
    try { return await fn(); } catch (e) { if (a >= 4) throw e; await sleep(3000); }
  }
}
async function pool(items, conc, fn) {
  let i = 0;
  const worker = async () => { while (i < items.length) { const x = items[i++]; await fn(x); } };
  await Promise.all(Array.from({ length: conc }, worker));
}
const gz = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(s)); };
const ungz = (f) => zlib.gunzipSync(fs.readFileSync(f)).toString();
const mdate = (f) => fs.statSync(f).mtime.toISOString().slice(0, 10);

const ACCENT = { acute: '́', grave: '̀', tilde: '̃', circ: '̂', uml: '̈', cedil: '̧' };
const decode = (s) => String(s || '')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  // Named accents ("&eacute;", and "&eacute" without its semicolon on rree.go.cr) as letters.
  .replace(/&([A-Za-z])(acute|grave|tilde|circ|uml|cedil);?/g, (m, l, k) => (l + ACCENT[k]).normalize('NFC'))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Language names as the four rolls write them (Spanish and Portuguese), to the directory's codes.
// Anything not here is reported, never guessed.
const LANG = {
  INGLES: 'en', INGLES_: 'en', FRANCES: 'fr', ALEMAN: 'de', ALEMAO: 'de', ITALIANO: 'it', PORTUGUES: 'pt',
  RUSO: 'ru', RUSSO: 'ru', CHINO: 'zh', CHINES: 'zh', MANDARIM: 'zh', MANDARIN: 'zh', JAPONES: 'ja', COREANO: 'ko',
  ARABE: 'ar', HEBREO: 'he', HEBRAICO: 'he', POLACO: 'pl', POLONES: 'pl', HOLANDES: 'nl', NEERLANDES: 'nl',
  CATALAN: 'ca', UCRANIANO: 'uk', CHECO: 'cs', TCHECO: 'cs', DANES: 'da', DINAMARQUES: 'da', SUECO: 'sv',
  ESLOVENO: 'sl', ESLOVACO: 'sk', GRIEGO: 'el', GREGO: 'el', RUMANO: 'ro', ROMENO: 'ro', HUNGARO: 'hu',
  BULGARO: 'bg', ALBANES: 'sq', NORUEGO: 'no', NORUEGUES: 'no', FINLANDES: 'fi', TURCO: 'tr', LITUANO: 'lt',
  CROATA: 'hr', SERBIO: 'sr', PERSA: 'fa', 'PERSA-FARSI-IRANI': 'fa', HINDI: 'hi', VIETNAMITA: 'vi', TAILANDES: 'th', INDONESIO: 'id',
  ESPANOL: 'es', ESPANHOL: 'es', CASTELLANO: 'es', 'CHINO MANDARIN': 'zh', 'CHINO CANTONES': 'zh', NEERLANDES_: 'nl',
};
// Named on a roll but not a language the directory lists (or not one language: Serbo-Croatian).
const NO_CODE = new Set(['LATIM', 'LATIN', 'QUECHUA', 'AIMARA', 'SERVO-CROATA', 'ARMENIO', 'BIELORRUSO', 'ESTONIO']);
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
function codes(names, local) {
  const out = []; const unknown = []; const nocode = [];
  for (const n of names) {
    const k = fold(n);
    if (!k) continue;
    if (NO_CODE.has(k)) { nocode.push(k); continue; }
    const c = LANG[k];
    if (!c) { unknown.push(n); continue; }
    if (!local.includes(c) && !out.includes(c)) out.push(c);
  }
  return { out, unknown, nocode };
}

// "PONCE CEVALLOS, MARÍA ANGÉLICA" -> "María Angélica Ponce Cevallos". The words are the roll's own;
// only the order (given names first, as a card reads) and the capitals change.
const SMALL = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'da', 'das', 'do', 'dos', 'e', 'van', 'von', 'der', 'di']);
function titleCase(s) {
  return String(s).toLowerCase().split(/\s+/).filter(Boolean).map((w, i) => (i > 0 && SMALL.has(w) ? w
    : w.replace(/(^|[-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()))).join(' ');
}
function displayName(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  const isUpper = s === s.toUpperCase();
  if (s.includes(',')) {
    const [sur, given] = s.split(',').map((x) => x.trim());
    const n = `${given} ${sur}`;
    return isUpper ? titleCase(n) : n;
  }
  return isUpper ? titleCase(s) : s;
}

// ---- ctpcba -----------------------------------------------------------------
const CTP = 'https://www.traductores.org.ar';
const slugOf = (u) => u.replace(/\/+$/, '').split('/').pop();
async function fetchCtpcba() {
  const dir = path.join(CACHE, 'ctpcba');
  fs.mkdirSync(dir, { recursive: true });
  const idx = await get(`${CTP}/sitemap_index.xml`);
  const maps = [...idx.matchAll(/<loc>([^<]*traductores-sitemap\d*\.xml)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const m of maps) {
    const x = await get(m);
    if (x) for (const u of x.matchAll(/<loc>([^<]*\/traductor\/[^<]+)<\/loc>/g)) urls.add(u[1]);
    await sleep(500);
  }
  fs.writeFileSync(path.join(CACHE, 'ctpcba-urls.json'), JSON.stringify([...urls]));
  const todo = [...urls].filter((u) => !fs.existsSync(path.join(dir, `${slugOf(u)}.html.gz`)));
  console.log(`${urls.size} profiles in the sitemaps, ${todo.length} to fetch`);
  let n = 0; let bad = 0;
  await pool(todo, Number(val('--conc', '3')), async (u) => {
    const t = await get(u);
    if (t && t.includes('Perfil del traductor')) gz(path.join(dir, `${slugOf(u)}.html.gz`), t); else bad += 1;
    n += 1;
    if (n % 250 === 0) console.log(`  ${n}/${todo.length} (${bad} failed)`);
    await sleep(350);
  });
  console.log(`done, ${bad} failed`);
}
// A CTPCBA licence is valid wherever its holder lives, and some list an address in another of our
// cities. Outside C.A.B.A. the second contact line is the locality, not a barrio. Only a locality
// that IS the city counts: Villa San Lorenzo is not Salta, San Martín is not Mendoza, and "GBA GRAN
// BS. AS." (the suburbs) is not Buenos Aires. Grand Bourg is a barrio of the city of Salta.
const CTP_CITY = {
  'BUENOS AIRES|MAR DEL PLATA': 'mardelplata', 'TIERRA DEL FUEGO|USHUAIA': 'ushuaia',
  'SALTA|SALTA': 'salta', 'SALTA|SALTA CAPITAL': 'salta', 'SALTA|GRAND BOURG': 'salta',
  'RIO NEGRO|SAN CARLOS DE BARILOCHE': 'bariloche', 'RIO NEGRO|BARILOCHE': 'bariloche',
  'CORDOBA|CORDOBA': 'cordoba', 'CORDOBA|CORDOBA CAPITAL': 'cordoba',
  'MENDOZA|MENDOZA': 'mendoza', 'MENDOZA|CIUDAD DE MENDOZA': 'mendoza', 'MENDOZA|CAPITAL': 'mendoza',
  'CHUBUT|PUERTO MADRYN': 'puertomadryn', 'SANTA FE|ROSARIO': 'rosario',
};
function parseCtpcba(html) {
  const name = decode((html.match(/Perfil del traductor<\/h1>[\s\S]*?<h1[^>]*>([^<]*)<\/h1>/) || [])[1]);
  const li = html.indexOf('>Idiomas<');
  const le = html.indexOf('>Especializaciones<', li);
  const langs = li > 0 ? [...html.slice(li, le > 0 ? le : li + 1500).matchAll(/<span>([^<]*)<\/span>/g)].map((m) => decode(m[1])) : [];
  const ci = html.indexOf('>CONTACTO<');
  const seg = ci > 0 ? html.slice(ci, ci + 6000) : '';
  const items = [...seg.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => ({
    href: (m[1].match(/href="([^"]*)"/) || [])[1] || '',
    text: decode((m[1].match(/elementor-icon-list-text">([\s\S]*?)<\/span>\s*(?:<\/a>)?\s*$/) || [])[1] || m[1]),
  }));
  // The contact list is positional: province, barrio, address, phone, website, email, three
  // social links. Blank fields print "-", and an empty website still links "http://".
  const at = (i) => (items[i] && items[i].text !== '-' ? items[i].text : '');
  const web = items.find((x) => /^https?:\/\/[^/]+\.[a-z]{2,}/i.test(x.href) && !/facebook|twitter|instagram|linkedin/i.test(x.href));
  return { name, langs, province: at(0), barrio: at(1), address: at(2), phone: at(3), url: web ? web.href : '' };
}

// ---- jucesp -----------------------------------------------------------------
const JUC = 'https://vre.jucesp.sp.gov.br/ConsultasLeiloeiroTradutor';
async function fetchJucesp() {
  const r = await fetch(JUC, { headers: { 'User-Agent': UA } });
  const cookie = (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')]).map((c) => String(c).split(';')[0]).join('; ');
  const page = await r.text();
  const tok = (page.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/) || [])[1];
  const body = new URLSearchParams({ __RequestVerificationToken: tok, AgeTipo: '2', AgeMatricula: '', AgeNome: '', AgeSituacao: '0', AgeDataPosseDe: '', AgeDataPosseAte: '', AgeIdiomaId: '0', AgeZonaConsulta: '0', AgeEndeComeLogradouro: '', AgeEndeComeBairro: '', AgeEndeComeMunicipio: '', MatriculaCancelada: 'false', MatriculaCancelada120: 'false' });
  const res = await fetch(`${JUC}/ListaLeiloeirosTradutores`, { method: 'POST', body, headers: { 'User-Agent': UA, Cookie: cookie, Referer: JUC, 'Content-Type': 'application/x-www-form-urlencoded' } });
  const t = await res.text();
  const n = (t.match(/<tr>/g) || []).length - 1;
  if (n < 100) throw new Error(`JUCESP answered with ${n} rows; token or cookie not accepted`);
  gz(path.join(CACHE, 'jucesp', 'tradutores.html.gz'), t);
  console.log(`jucesp: ${n} rows`);
}
function parseJucesp(html) {
  const b = html.slice(html.indexOf('<tbody>'));
  return [...b.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => decode(x[1])))
    .filter((c) => c.length >= 11)
    .map((c) => ({ name: c[0], matricula: c[1], posse: c[2], langs: c[3].split('/').map((s) => s.trim()).filter(Boolean), city: c[5], phones: c[7], email: c[8], site: c[9], status: c[10] }));
}

// ---- cr-rree ----------------------------------------------------------------
const CR_PAGE = 'https://www.rree.go.cr/?sec=servicios&cat=traductores&cont=1054';
const CR_API = 'https://www.rree.go.cr/files/includes/content-load.php?accion=interpretes&cargo=&provincia=&canton=&nombre=&idiomas=&offset=0&limit=2000';
async function fetchCr() {
  const t = await get(CR_API);
  if (!t || (t.match(/<li>/g) || []).length < 100) throw new Error('RREE Costa Rica list came back short');
  gz(path.join(CACHE, 'cr-rree', 'list.html.gz'), t);
  console.log(`cr-rree: ${(t.match(/<li>/g) || []).length} entries`);
}
function parseCr(html) {
  return html.split(/<li>/).slice(1).map((it) => {
    const g = (c) => decode((it.match(new RegExp(`<span class="${c}">([\\s\\S]*?)</span>`)) || [])[1]);
    const cat = g('metaCategory');
    const [role, langs] = [cat.split('-')[0].trim(), cat.split('-').slice(1).join('-')];
    const [province, canton] = g('metaQuote').split(',').map((s) => s.trim());
    return { role, langs: langs.split(',').map((s) => s.trim()).filter(Boolean), name: g('metaTitle'), province: province || '', canton: canton || '' };
  }).filter((r) => r.name);
}
// Greater San José: the cantons of San José province that form the city's built-up area (GAM).
// Pérez Zeledón is a hundred kilometres south and is not the city. The list gives only province and
// canton, and our resort towns are districts of large cantons whose seat is elsewhere (Tamarindo in
// Santa Cruz, La Fortuna in San Carlos, Monteverde in Puntarenas/Monteverde, Santa Teresa in
// Puntarenas, Puerto Viejo in Talamanca). A canton-only address there is held, not placed.
const CR_HELD = {
  'Guanacaste|Santa Cruz': 'Tamarindo', 'Alajuela|San Carlos': 'La Fortuna', 'Puntarenas|Puntarenas': 'Monteverde and Santa Teresa',
  'Puntarenas|Monteverde': 'Monteverde', 'Limón|Talamanca': 'Puerto Viejo',
};
const CR_CITY = {
  'San José': { 'San José': 1, Escazú: 1, Moravia: 1, Currridabat: 1, Curridabat: 1, 'Montes de Oca': 1, Goicoechea: 1, Tibás: 1, 'Santa Ana': 1, Desamparados: 1, Alajuelita: 1, Mora: 1, 'Vásquez de Coronado': 1 },
};

// ---- ctsf2 (Rosario) --------------------------------------------------------
// Colegio de Traductores de la Provincia de Santa Fe, 2.ª Circunscripción, created by provincial
// Ley 10.757 (1992). Its "Listado de profesionales" shows results "aleatorios", but the pager
// carries a ?seed=N, and with the seed held fixed the pages are a stable ordering of the whole roll.
const CTSF = 'https://traductoresrosario.org.ar/listado-de-profesionales';
async function fetchCtsf() {
  const dir = path.join(CACHE, 'ctsf2');
  fs.mkdirSync(dir, { recursive: true });
  const first = await get(CTSF);
  const seed = (first.match(/\?seed=(\d+)&(?:amp;)?page=2/) || [])[1];
  const last = Math.max(...[...first.matchAll(/[?&](?:amp;)?page=(\d+)/g)].map((m) => Number(m[1])));
  if (!seed || !last) throw new Error('no seed or page count on the Rosario list');
  const ids = new Set();
  for (let p = 1; p <= last; p += 1) {
    const h = p === 1 ? first : await get(`${CTSF}?seed=${seed}&page=${p}`);
    if (h) for (const m of h.matchAll(/listado-de-profesionales\/(\d+)"/g)) ids.add(m[1]);
    await sleep(600);
  }
  fs.writeFileSync(path.join(dir, 'ids.json'), JSON.stringify([...ids]));
  const todo = [...ids].filter((id) => !fs.existsSync(path.join(dir, `${id}.html.gz`)));
  console.log(`ctsf2: ${ids.size} profiles over ${last} pages, ${todo.length} to fetch`);
  await pool(todo, 2, async (id) => {
    const t = await get(`${CTSF}/${id}`);
    if (t && t.includes('Idioma/s')) gz(path.join(dir, `${id}.html.gz`), t);
    await sleep(500);
  });
}
function parseCtsf(html) {
  const field = (k) => decode((html.match(new RegExp(`<p>${k}:\\s*<br>\\s*<span>([^<]*)<`)) || [])[1]);
  const li = html.indexOf('<h3>Idioma/s</h3>');
  const ul = li > 0 ? html.slice(li, html.indexOf('</ul>', li)) : '';
  return {
    name: decode((html.match(/<h2>([^<]+)<\/h2>/) || [])[1]),
    langs: [...ul.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => decode(m[1])),
    locality: field('Localidad'),
    web: field('Sitio web'),
  };
}

// ---- ec-cj (Ecuador) --------------------------------------------------------
// Consejo de la Judicatura, "Consulta de peritos acreditados": a JSF/RichFaces form. One session
// (cookie + javax.faces.ViewState from the GET), then an AJAX "Buscar" per province with profession
// 16 = "INTÉRPRETES Y TRADUCTORES", then the data scroller's "page" parameter, ten rows a page, until
// a page repeats the previous one. A row is one person in one language ("Especialidad"), with
// canton, phone, email and the accreditation's expiry (Fecha Caducidad). The first column is the
// person's cédula; it is used only to merge a person's rows and is never written out.
const EC = 'https://appsj.funcionjudicial.gob.ec/perito-web/pages/peritos_nacional.jsf';
const EC_PROV = { 18: 'PICHINCHA', 2: 'AZUAY', 10: 'GUAYAS', 14: 'MANABÍ', 11: 'IMBABURA', 19: 'TUNGURAHUA', 12: 'LOJA', 24: 'SANTA ELENA' };
async function fetchEc() {
  const dir = path.join(CACHE, 'ec-cj');
  fs.mkdirSync(dir, { recursive: true });
  for (const [pid, pname] of Object.entries(EC_PROV)) {
    const r0 = await retry(() => fetch(EC, { headers: { 'User-Agent': UA } }));
    const cookie = (r0.headers.getSetCookie ? r0.headers.getSetCookie() : []).map((c) => c.split(';')[0]).join('; ');
    const page0 = await r0.text();
    const action = (page0.match(/action="(\/perito-web\/pages\/peritos_nacional\.jsf[^"]*)"/) || [])[1];
    const vs = (page0.match(/id="javax\.faces\.ViewState" value="([^"]+)"/) || [])[1];
    const base = {
      j_idt33: 'j_idt33', 'j_idt33:identificacion': '', 'j_idt33:nombre': '', 'j_idt33:provincia': pid, 'j_idt33:canton': '',
      'j_idt33:profesion': '16', 'j_idt33:especialidad': '', 'j_idt33:institucion': '', 'javax.faces.ViewState': vs,
      'javax.faces.partial.ajax': 'true', 'AJAX:EVENTS_COUNT': '1', rfExt: 'null',
    };
    const post = async (extra) => {
      const res = await retry(() => fetch(`https://appsj.funcionjudicial.gob.ec${action}`, {
        method: 'POST', body: new URLSearchParams({ ...base, ...extra }),
        headers: { 'User-Agent': UA, Cookie: cookie, 'Faces-Request': 'partial/ajax', 'Content-Type': 'application/x-www-form-urlencoded' },
      }));
      return res.text();
    };
    const pages = [await post({
      'javax.faces.source': 'j_idt33:j_idt55', 'javax.faces.partial.event': 'click', 'javax.faces.partial.execute': 'j_idt33:j_idt55 @component',
      'javax.faces.partial.render': '@component', 'org.richfaces.ajax.component': 'j_idt33:j_idt55', 'j_idt33:j_idt55': 'j_idt33:j_idt55',
    })];
    // Row ids run on across pages (dtIntOJ:10, :11 ...), so the first row of a page is found by
    // its column, not by "dtIntOJ:0"; matching on :0 read page 2 as empty and stopped at ten rows.
    const firstId = (x) => (x.match(/:j_idt58" class="rf-dt-c">([^<]*)</) || [])[1];
    for (let p = 2; p < 200; p += 1) {
      await sleep(700);
      const x = await post({
        'javax.faces.source': 'j_idt33:dtIntOJ:j_idt91', 'javax.faces.partial.execute': 'j_idt33:dtIntOJ:j_idt91 @component',
        'javax.faces.partial.render': '@component', 'org.richfaces.ajax.component': 'j_idt33:dtIntOJ:j_idt91', 'j_idt33:dtIntOJ:j_idt91:page': String(p),
      });
      if (!firstId(x) || firstId(x) === firstId(pages[pages.length - 1])) break;
      pages.push(x);
    }
    gz(path.join(dir, `${pid}.xml.gz`), pages.join('\n<!--PAGE-->\n'));
    console.log(`ec-cj ${pname}: ${pages.length} pages`);
    await sleep(1500);
  }
}
function parseEc(xml) {
  return [...xml.matchAll(/<tr id="j_idt33:dtIntOJ:\d+"[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => decode(x[1])))
    .filter((c) => c.length >= 10)
    .map((c) => ({ id: c[0], name: c[1], province: c[2], canton: c[3], profession: c[6], lang: c[7], from: c[8], until: c[9] }));
}
// Canton = the city for these; Loja canton (Vilcabamba), Santa Elena (Montañita) and San Miguel de
// los Bancos (Mindo) contain our towns without being them, and are held.
const EC_CITY = { QUITO: 'quito', CUENCA: 'cuenca', GUAYAQUIL: 'guayaquil', MANTA: 'manta', OTAVALO: 'otavalo', 'BAÑOS DE AGUA SANTA': 'banos', 'BAÑOS': 'banos' };
const EC_HELD = { LOJA: 'Vilcabamba', 'SANTA ELENA': 'Montañita', 'SAN MIGUEL DE LOS BANCOS': 'Mindo' };

// ---- pe-rree ----------------------------------------------------------------
const PE_COLL = 'https://www.gob.pe/institucion/rree/colecciones/60818-directorio-de-traductores-publicos-del-peru';
async function fetchPe() {
  const dir = path.join(CACHE, 'pe-rree');
  fs.mkdirSync(dir, { recursive: true });
  const coll = await get(PE_COLL);
  const pages = [...new Set([...coll.matchAll(/href="(\/institucion\/rree\/informes-publicaciones\/\d+-traductores-publicos-juramentados-[a-z]+)"/g)].map((m) => m[1]))];
  const index = [];
  for (const p of pages) {
    const h = await get(`https://www.gob.pe${p}`);
    await sleep(800);
    if (!h) continue;
    // A page also links its sibling languages' PDFs ("related documents"); only files named with
    // this page's own id are its list. The Chinese page picked up the German PDF before this.
    const own = p.split('/').pop().split('-')[0];
    const pdfs = [...new Set([...h.matchAll(/(https:\/\/cdn\.www\.gob\.pe\/uploads\/document\/file\/\d+\/[^"?]+\.pdf)/g)].map((m) => m[1]))]
      .filter((u) => u.split('/').pop().startsWith(`${own}-`));
    // The German page carries the old list and the 2026 one; the one with a date in its name wins.
    const pdf = pdfs.find((u) => /\d{1,2}-\d{1,2}-20\d\d\.pdf$/.test(u)) || pdfs[0];
    if (!pdf) continue;
    const buf = await get(pdf, { binary: true });
    await sleep(800);
    if (!buf) continue;
    const f = path.join(dir, `${p.split('/').pop()}.pdf`);
    fs.writeFileSync(f, buf);
    index.push({ page: `https://www.gob.pe${p}`, pdf, file: path.basename(f) });
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`pe-rree: ${index.length} PDFs`);
}
const LIMA_DISTRICTS = ['ANCÓN', 'ATE', 'BARRANCO', 'BREÑA', 'CARABAYLLO', 'CHACLACAYO', 'CHORRILLOS', 'CIENEGUILLA', 'COMAS', 'EL AGUSTINO', 'INDEPENDENCIA', 'JESÚS MARÍA', 'JESUS MARIA', 'LA MOLINA', 'LA VICTORIA', 'LINCE', 'LOS OLIVOS', 'LURIGANCHO', 'LURÍN', 'MAGDALENA DEL MAR', 'MIRAFLORES', 'PACHACÁMAC', 'PUEBLO LIBRE', 'PUENTE PIEDRA', 'RÍMAC', 'SAN BORJA', 'SAN ISIDRO', 'SAN JUAN DE LURIGANCHO', 'SAN JUAN DE MIRAFLORES', 'SAN LUIS', 'SAN MARTÍN DE PORRES', 'SAN MIGUEL', 'SANTA ANITA', 'SANTIAGO DE SURCO', 'SURCO', 'SURQUILLO', 'VILLA EL SALVADOR', 'VILLA MARÍA DEL TRIUNFO', 'CALLAO', 'BELLAVISTA', 'LA PERLA', 'LA PUNTA', 'LIMA', 'CERCADO DE LIMA'];
// Named one by one: a pattern such as "ends in -O" also matched ROSARIO, SOCORRO and ANTONIO,
// the second lines of three names, which were then cut off.
const PE_LANGS = /^(ALEMÁN|CASTELLANO|CHINO|PORTUGUÉS|POLACO|RUSO|JAPONÉS|FRANCÉS|INGLÉS|ITALIANO|ÁRABE|COREANO|HOLANDÉS|QUECHUA)$/;
function parsePePdf(file) {
  const txt = execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', file, '-'], { maxBuffer: 50e6 }).toString();
  const lines = txt.split(/\r?\n/);
  const people = new Map(); const bad = []; const used = new Set();
  const cellAt = (line, col) => {
    if (!line || line.length <= col) return '';
    const m = line.slice(col).match(/^\S+(?: \S+)*/);
    return line[col] !== ' ' && (col === 0 || line[col - 1] === ' ') && m ? m[0] : '';
  };
  const districtIn = (s) => LIMA_DISTRICTS.filter((d) => new RegExp(`(^|\\s{2,})${d}(\\s{2,}|$)`).test(s)).sort((a, b) => b.length - a.length)[0];
  for (let i = 0; i < lines.length; i += 1) {
    const L = lines[i];
    // Resolution numbers are four or five digits ("01219-2002-RE"), and sometimes only one space
    // separates them from the name.
    const m = L.match(/^(\s*)(\S+)\s+(\S+)\s+(\S.*?\S)\s+(\d{4,5}-\d{4}-RE|\d{2}\/\d{2}\/\d{4})/);
    if (!m || !PE_LANGS.test(m[2]) || !PE_LANGS.test(m[3])) continue;
    const col = L.indexOf(m[4], m[1].length + m[2].length + m[3].length);
    let name = m[4];
    // pdftotext -table puts a blank line between text lines, so "below" and "above" mean the
    // nearest non-blank line, never simply i + 1.
    const nbi = (dir) => {
      for (let k = i + dir; k >= 0 && k < lines.length && Math.abs(k - i) < 4; k += dir) if (lines[k].trim()) return k;
      return -1;
    };
    const isRow = (x) => /\d{4,5}-\d{4}-RE/.test(x) && PE_LANGS.test(x.trim().split(/\s+/)[0]);
    const ni = nbi(1); const pi = nbi(-1);
    const next = ni >= 0 ? lines[ni] : ''; const prev = pi >= 0 ? lines[pi] : '';
    const NAMEY = /^[A-ZÁÉÍÓÚÑÜ .'-]+$/;
    const below = next && !isRow(next) ? cellAt(next, col) : '';
    if (below && NAMEY.test(below.replace(/,/g, '')) && !PE_LANGS.test(below.split(' ')[0]) && !(below.includes(',') && name.includes(','))) {
      name = `${name} ${below}`; used.add(ni);
    }
    // A line in the name column above the row that no earlier row took as its second line is the
    // start of this name: "VALENCIA MANRIQUE, GRACE" above "ELIZABETH", and, with no comma of its
    // own, "PASTORE-ALINANTE CIFALDI DE" above "FERNÁNDEZ BACA, LUISA" (a married name). Without the
    // "no earlier row took it" check, OLCHAUSKI's "ANGÉLICA" would be glued onto the next person.
    const above = prev && !isRow(prev) && !used.has(pi) ? cellAt(prev, col) : '';
    if (above && NAMEY.test(above.replace(/,/g, '')) && !(above.includes(',') && name.includes(','))) { name = `${above} ${name}`; used.add(pi); }
    if ((name.match(/,/g) || []).length !== 1) { bad.push(name); continue; }
    // "SANTIAGO DE" on the row and "SURCO" below it: try the row alone, then row + next line.
    let district = districtIn(L);
    if (!district || district === 'SURCO' || district === 'LIMA') {
      // The two halves can straddle the row either way: "SANTIAGO DE" on it and "SURCO" below, or
      // "MAGDALENA DEL" above it and "MAR" on it.
      const glue = (s) => s.replace(/(SANTIAGO DE|MAGDALENA DEL|SAN JUAN DE)\s{2,}.*?\s{2,}(SURCO|MAR|LURIGANCHO|MIRAFLORES)(?=\s{2,}|$)/, '$1 $2');
      district = districtIn(glue(`${L}  ${next.trim()}`)) || districtIn(glue(`${prev.trim()}  ${L.trim()}`)) || district;
    }
    const pair = [m[2], m[3]];
    const key = name.replace(/\s+/g, ' ');
    const p = people.get(key) || { name: key, langs: new Set(), districts: [] };
    pair.forEach((x) => p.langs.add(x));
    if (district && !p.districts.includes(district)) p.districts.push(district);
    people.set(key, p);
  }
  return { people: [...people.values()].map((p) => ({ ...p, langs: [...p.langs] })), bad };
}

// ---- propose ----------------------------------------------------------------
const SOURCES = {
  ctpcba: {
    publisher: 'Colegio de Traductores Públicos de la Ciudad de Buenos Aires (CTPCBA)',
    url: `${CTP}/traductores/`,
    licenceOrTermsQuote: 'No terms of use are published anywhere on traductores.org.ar (the 155-page page-sitemap was read; no terms, legal notice or reuse clause exists). The public search says: "se mostrará de forma aleatoria hasta 30 traductores públicos matriculados según los filtros ingresados". robots.txt holds only a pasted Apache line (Header set X-Robots-Tag "noindex, nofollow"), not a robots rule.',
    pageNote: 'Some of these are public translators on the roll of the Colegio de Traductores Públicos de la Ciudad de Buenos Aires, the body that licenses them under Ley 20.305. The languages shown are the ones each translator is licensed (matriculado) in.',
  },
  jucesp: {
    publisher: 'Junta Comercial do Estado de São Paulo (JUCESP)',
    url: JUC,
    licenceOrTermsQuote: 'No terms of use on institucional.jucesp.sp.gov.br or vre.jucesp.sp.gov.br. JUCESP itself sends the public to this list: "Para saber se um leiloeiro é oficial e matriculado na Junta Comercial do Estado de São Paulo, consulte as listas disponíveis somente no nosso site institucional", and "Somente tradutor e intérprete público inscrito na Junta Comercial pode ser contratado para essa finalidade" (Lei nº 14.195/2021). The same roll is published in the Diário Oficial do Estado.',
    pageNote: 'Some of these are sworn translators (tradutores públicos e intérpretes comerciais) on the roll of the Junta Comercial do Estado de São Paulo, the state body that appoints them. The languages shown are the ones each translator is appointed in.',
  },
  'cr-rree': {
    publisher: 'Ministerio de Relaciones Exteriores y Culto de Costa Rica',
    url: CR_PAGE,
    licenceOrTermsQuote: 'No terms of use on rree.go.cr (footer and site map read). The page introduces the list as "La lista de traductores e intérpretes oficiales está ordenada alfabéticamente por el nombre." Appointments are made under Ley 8142 de Traducciones e Interpretaciones Oficiales.',
    pageNote: 'Some of these are official translators and interpreters appointed by Costa Rica\'s Ministry of Foreign Affairs under Ley 8142. The languages shown are the ones each person is appointed in.',
  },
  'ec-cj': {
    publisher: 'Consejo de la Judicatura del Ecuador, Sistema Pericial',
    url: EC,
    licenceOrTermsQuote: 'No terms of use on funcionjudicial.gob.ec or the Sistema Pericial. The Consejo publishes the search for the public: "Consulta de peritos acreditados" (and reports "Ecuador cuenta con 10.716 peritos calificados"). The register also shows each perito\'s cédula number; that column is not stored or published here.',
    pageNote: 'Some of these are court-accredited translators and interpreters on the register of Ecuador\'s Consejo de la Judicatura. The languages shown are the ones each person is accredited in, and only accreditations still in force when we checked are listed.',
  },
  ctsf2: {
    publisher: 'Colegio de Traductores de la Provincia de Santa Fe, 2.ª Circunscripción',
    url: CTSF,
    licenceOrTermsQuote: 'No terms of use on traductoresrosario.org.ar (robots.txt redirects to a 404 page). The list says of itself: "Esta base de datos de profesionales permite realizar diferentes tipos de búsquedas ... En cada perfil profesional encontrará los datos de contacto." The college was "Creado en 1992 por la Ley Provincial N.º 10.757".',
    pageNote: 'Some of these are public translators on the roll of the Colegio de Traductores de la Provincia de Santa Fe (2nd district, Rosario), created by provincial law 10.757. The languages shown are the ones each translator lists on that roll.',
  },
  'pe-rree': {
    publisher: 'Ministerio de Relaciones Exteriores del Perú',
    url: PE_COLL,
    licenceOrTermsQuote: 'No terms of use on gob.pe restrict reuse. The ministry says: "Para facilidad de los usuarios, la Cancillería publica listados con los datos de contacto de los Traductores Públicos Juramentados, ordenados alfabéticamente, lo cual no constituye recomendación ni aval alguno."',
    pageNote: 'Some of these are sworn public translators (Traductores Públicos Juramentados) appointed by Peru\'s Ministry of Foreign Affairs, which publishes one list per language. The ministry says the list is not a recommendation.',
  },
};

function existingIndex() {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
  const k = (s) => fold(s).replace(/[^A-Z0-9]+/g, '');
  const set = new Set(db.providers.map((p) => `${p.city}|${k(p.name)}`));
  return (city, name) => set.has(`${city}|${k(name)}`);
}

function propose() {
  fs.mkdirSync(OUT, { recursive: true });
  const known = existingIndex();
  const bundles = {}; const refused = [];
  const push = (src, row, raw) => {
    const r = codes(raw.langs, raw.local);
    if (r.unknown.length) refused.push({ src, name: row.name, why: `unmapped language ${r.unknown.join(', ')}` });
    if (!r.out.length) { refused.push({ src, name: row.name, why: r.nocode.length ? `only ${r.nocode.join(', ')}` : 'no foreign language on the roll' }); return; }
    if (r.out.length > MAX_LANGS) { refused.push({ src, name: row.name, why: `${r.out.length} languages` }); return; }
    if (known(row.city, row.name)) { refused.push({ src, name: row.name, why: 'already in the directory' }); return; }
    // One person can sit on a roll twice (two CTPCBA profiles, two Costa Rican entries for two
    // appointments) or on two rolls (a CTPCBA licence with a Rosario address, and the Rosario
    // college). Same city and same name is one row: languages are merged into the first one seen,
    // and a second source's entry is dropped rather than published as a second card.
    const k = `${row.city}|${fold(row.name).replace(/[^A-Z]+/g, '')}`;
    const prior = seenPeople.get(k);
    if (prior) {
      if (prior.src === src) {
        r.out.forEach((c) => { if (!prior.row.languages.includes(c)) prior.row.languages.push(c); });
        if (!prior.row.quote.includes(raw.langs.join(', '))) prior.row.quote += `; ${raw.langs.join(', ')}`;
        (prior.row.alsoOn = prior.row.alsoOn || []).push(row.sourceUrl);
      } else refused.push({ src, name: row.name, why: `same person already proposed from ${prior.src}` });
      return;
    }
    const out = { ...row, category: 'translator', languages: r.out, evidence: 'official', quote: raw.langs.join(', ') };
    seenPeople.set(k, { src, row: out });
    (bundles[src] = bundles[src] || []).push(out);
  };
  const seenPeople = new Map();

  // CTPCBA
  const cdir = path.join(CACHE, 'ctpcba');
  if (fs.existsSync(cdir)) {
    for (const f of fs.readdirSync(cdir)) {
      const o = parseCtpcba(ungz(path.join(cdir, f)));
      const sourceUrl = `${CTP}/traductor/${f.replace(/\.html\.gz$/, '')}/`;
      const city = o.province === 'C.A.B.A.' ? 'buenosaires' : CTP_CITY[`${fold(o.province)}|${fold(o.barrio).replace(/[-\s]+$/, '')}`];
      if (!city) continue;
      if (!o.name) { refused.push({ src: 'ctpcba', name: f, why: 'no name on the page' }); continue; }
      push('ctpcba', {
        city, name: displayName(o.name), nameAsListed: o.name, ...(o.url ? { url: o.url } : {}),
        sourceUrl, checked: mdate(path.join(cdir, f)), ...(o.barrio && city === 'buenosaires' ? { area: titleCase(o.barrio) } : {}),
      }, { langs: o.langs, local: ['es'] });
    }
  }

  // JUCESP
  const jf = path.join(CACHE, 'jucesp', 'tradutores.html.gz');
  if (fs.existsSync(jf)) {
    const checked = mdate(jf);
    const seen = new Set();
    for (const r of parseJucesp(ungz(jf))) {
      if (r.status !== 'Atuante' || fold(r.city) !== 'SAO PAULO') continue;
      if (seen.has(r.matricula)) continue;
      seen.add(r.matricula);
      const yr = Number((r.posse.match(/^(\d{4})/) || [])[1]);
      if (yr && Number(checked.slice(0, 4)) - yr > 60) { refused.push({ src: 'jucesp', name: r.name, why: `appointed ${r.posse}, more than 60 years ago; roll likely stale` }); continue; }
      const site = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(r.site) ? (/^https?:/.test(r.site) ? r.site : `https://${r.site}`) : '';
      push('jucesp', {
        city: 'saopaulo', name: displayName(r.name), nameAsListed: r.name, ...(site ? { url: site } : {}),
        sourceUrl: JUC, checked, matricula: r.matricula,
      }, { langs: r.langs, local: ['pt'] });
    }
  }

  // Costa Rica
  const crf = path.join(CACHE, 'cr-rree', 'list.html.gz');
  if (fs.existsSync(crf)) {
    const checked = mdate(crf);
    for (const r of parseCr(ungz(crf))) {
      const hold = CR_HELD[`${r.province}|${r.canton}`];
      if (hold) { refused.push({ src: 'cr-rree', name: r.name, why: `held: address is canton ${r.canton} only, which contains ${hold} but is not it` }); continue; }
      if (!(r.province === 'San José' && CR_CITY['San José'][r.canton])) continue;
      const canton = r.canton === 'Currridabat' ? 'Curridabat' : r.canton;
      push('cr-rree', {
        city: 'sanjosecr', name: r.name.replace(/\s+/g, ' '), sourceUrl: CR_PAGE, checked, area: canton, role: r.role,
      }, { langs: r.langs, local: ['es'] });
    }
  }

  // Ecuador
  const edir = path.join(CACHE, 'ec-cj');
  if (fs.existsSync(edir)) {
    const people = new Map();
    for (const f of fs.readdirSync(edir).filter((x) => x.endsWith('.xml.gz'))) {
      const checked = mdate(path.join(edir, f));
      for (const r of parseEc(ungz(path.join(edir, f)))) {
        if (!/INT[ÉE]RPRETES Y TRADUCTORES$/.test(r.profession)) continue;
        // An accreditation lasts two years; one that ran out before the check is not published.
        if (r.until && r.until < checked) { refused.push({ src: 'ec-cj', name: r.name, why: `accreditation expired ${r.until}` }); continue; }
        const held = EC_HELD[fold(r.canton).replace(/Ñ/g, 'N')] || EC_HELD[r.canton];
        const city = EC_CITY[r.canton] || EC_CITY[fold(r.canton)];
        if (!city) { if (held) refused.push({ src: 'ec-cj', name: r.name, why: `held: canton ${r.canton} contains ${held} but is not it` }); continue; }
        const p = people.get(r.id) || { name: r.name, city, langs: [], until: r.until, checked };
        if (!p.langs.includes(r.lang)) p.langs.push(r.lang);
        if (r.until > p.until) p.until = r.until;
        people.set(r.id, p);
      }
    }
    for (const p of people.values()) {
      // "VEJAR MORAN TOMAS SEBASTIAN": surnames first with no comma, and compound surnames ("DEL
      // POZO", "DE LA TORRE") make the split unknowable, so the order is the register's own.
      push('ec-cj', {
        city: p.city, name: titleCase(p.name), nameAsListed: p.name, sourceUrl: EC, checked: p.checked, accreditedUntil: p.until,
      }, { langs: p.langs, local: ['es'] });
    }
  }

  // Rosario
  const rdir = path.join(CACHE, 'ctsf2');
  if (fs.existsSync(rdir)) {
    for (const f of fs.readdirSync(rdir).filter((x) => x.endsWith('.html.gz'))) {
      const o = parseCtsf(ungz(path.join(rdir, f)));
      // "Funes / Rosario" and "Chajarí / Rosario" name Rosario as one of two bases; they are kept.
      if (!o.locality.split('/').map((s) => fold(s)).includes('ROSARIO')) continue;
      const web = /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(o.web) ? (/^https?:/.test(o.web) ? o.web : `https://${o.web}`) : '';
      push('ctsf2', {
        city: 'rosario', name: o.name, ...(web ? { url: web } : {}),
        sourceUrl: `${CTSF}/${f.replace(/\.html\.gz$/, '')}`, checked: mdate(path.join(rdir, f)),
      }, { langs: o.langs, local: ['es'] });
    }
  }

  // Peru
  const pdir = path.join(CACHE, 'pe-rree');
  if (fs.existsSync(path.join(pdir, 'index.json'))) {
    const index = JSON.parse(fs.readFileSync(path.join(pdir, 'index.json'), 'utf8'));
    const all = new Map();
    for (const e of index) {
      const { people, bad } = parsePePdf(path.join(pdir, e.file));
      bad.forEach((b) => refused.push({ src: 'pe-rree', name: b, why: 'name did not parse as SURNAMES, GIVEN NAMES' }));
      for (const p of people) {
        const k = p.name;
        const a = all.get(k) || { name: k, langs: new Set(), districts: [], pdfs: [], checked: mdate(path.join(pdir, e.file)) };
        p.langs.forEach((x) => a.langs.add(x));
        p.districts.forEach((d) => { if (!a.districts.includes(d)) a.districts.push(d); });
        a.pdfs.push(e.pdf);
        all.set(k, a);
      }
    }
    for (const a of all.values()) {
      push('pe-rree', {
        city: 'lima', name: displayName(a.name), nameAsListed: a.name, sourceUrl: a.pdfs[0], checked: a.checked,
        ...(a.districts.length ? { area: titleCase(a.districts[0] === 'JESUS MARIA' ? 'JESÚS MARÍA' : a.districts[0]) } : {}),
        ...(a.pdfs.length > 1 ? { alsoOn: a.pdfs.slice(1) } : {}),
      }, { langs: [...a.langs], local: ['es'] });
    }
  }

  const bundlesOut = [];
  for (const [src, rows] of Object.entries(bundles)) {
    const b = { source: SOURCES[src], rows };
    fs.writeFileSync(path.join(OUT, `proposals-${src}.json`), JSON.stringify(b, null, 1));
    bundlesOut.push(b);
  }
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify(bundlesOut, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify(refused, null, 1));
  const tally = {};
  for (const [src, rows] of Object.entries(bundles)) {
    rows.forEach((r) => { const k = `${src} ${r.city}`; tally[k] = (tally[k] || 0) + 1; });
  }
  const langs = {};
  Object.values(bundles).flat().forEach((r) => r.languages.forEach((l) => { langs[l] = (langs[l] || 0) + 1; }));
  const why = {};
  refused.forEach((r) => { const k = `${r.src}: ${r.why.replace(/[\d/]+.*$/, '').replace(/ [A-Z].*$/, '')}`; why[k] = (why[k] || 0) + 1; });
  console.log(tally, langs, why);
}

module.exports = { parseCtpcba, parseJucesp, parseCr, parsePePdf, parseEc, parseCtsf, displayName, codes };

if (require.main === module) {
  (async () => {
    const which = argv[1];
    if (cmd === 'fetch') {
      if (which === 'ctpcba' || which === 'all') await fetchCtpcba();
      if (which === 'jucesp' || which === 'all') await fetchJucesp();
      if (which === 'cr-rree' || which === 'all') await fetchCr();
      if (which === 'pe-rree' || which === 'all') await fetchPe();
      if (which === 'ctsf2' || which === 'all') await fetchCtsf();
      if (which === 'ec-cj' || which === 'all') await fetchEc();
      return;
    }
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_latam_sources.cjs <fetch <source>|propose> --cache <dir> [--out <dir>]');
    process.exit(2);
  })();
}

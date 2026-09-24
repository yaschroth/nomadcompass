/**
 * Second pass over the official Latin American rolls that name a provider together with the
 * foreign languages that provider is licensed or appointed in. The first pass is
 * scripts/read_latam_sources.cjs (CTPCBA Buenos Aires, JUCESP São Paulo, Rosario, Costa Rica RREE,
 * Peru RREE, Ecuador judiciary); read its header first, the rule and most traps are the same.
 *
 * WHY THESE SOURCES
 *
 * The sworn or public translator is the one provider in Latin America whom a public body licenses
 * PER LANGUAGE and lists by name. In Brazil every state's Junta Comercial keeps the roll of
 * tradutores e intérpretes públicos (Lei 14.195/2021 arts. 22 to 34, IN DREI 52/2022), and most
 * publish it. The language printed against a name is the language the Junta matriculated the person
 * in after a public examination. That is the official tier.
 *
 * SOURCES READ HERE
 *
 *   jucerja  Junta Comercial do Estado do Rio de Janeiro, /AuxiliaresComercio/Tradutores. The page
 *            lists the roll five at a time; its own script pages through
 *            /AuxiliaresComercio/PaginarTradutores?pagina=N (an HTML fragment). Every entry has
 *            Situação Funcional, matrícula, e-mail, phones, website, a full street address ending in
 *            "<bairro> - <município> - RJ - CEP", and Idioma. City: rio where the município reads
 *            "Rio de Janeiro"; paraty where it reads "Paraty". Niterói is its own city and is not Rio.
 *   jucemg   Junta Comercial do Estado de Minas Gerais: one page per language
 *            (/pagina/<n>/<idioma>) linked from /pagina/37. A person is a <p> block: name, matrícula,
 *            how qualified, e-mail, site, phones, sometimes "Endereço", and "Situação funcional".
 *            Most entries give no address at all. A person is placed only where the Endereço names
 *            the city; the rest are held (the phone area code 31 covers forty municipalities).
 *   jucisrs  Junta Comercial do Rio Grande do Sul: one TablePress table at
 *            sistemas.jucisrs.rs.gov.br/tradutores with Situação, Idiomas, Município. City:
 *            portoalegre, gramado.
 *   jucep    Junta Comercial do Estado da Paraíba, /contatos/tradutores: two translators in cards,
 *            each with a street address and CEP. CEPs 58000-000 to 58099-999 are João Pessoa.
 *   uy-pj    Uruguay, Poder Judicial, Registro Único de Peritos PDF: Traductor Público by language,
 *            plus "Idóneo en" Árabe/Chino/Coreano. Montevideo by Departamento. (See parseUy.)
 *   cjj      Jalisco, Consejo de la Judicatura, Lista de Auxiliares 2026-2027 PDF: intérpretes and
 *            traductores per language pair, placed by partido judicial. (See parseCjj.)
 *   pjyuc    Yucatán, Poder Judicial, Registro de Peritos directory: Mérida. (See parseYuc.)
 *   held     Panama MIRE, Guatemala MINEDUC and Querétaro padrón: read and counted, never proposed,
 *            because none prints a place that is one of our cities.
 *
 * LOOKED AT AND NOT READ HERE (quotes in the agent report)
 *
 *   JUCEPAR (Curitiba), JUCESC (Florianópolis), JUCEPE (Recife), JUCEB (Salvador), JUCEPA (Belém),
 *   JUCEAL (Maceió), JUCERN (Natal), JUCIS-DF (Brasília), JUCEA (Manaus), JUCEMS (Campo Grande):
 *   the TCP connection times out from outside Brazil, from curl and from headless Chrome alike (the
 *   host names resolve; nothing answers). JUCEC (Fortaleza) answers 403 from ce.gov.br. Wayback
 *   copies exist for some (JUCESC 2021) but a years-old roll cannot say who is "Regular" today.
 *   JUCEG (Goiás) publishes its roll, but no city of ours is in Goiás.
 *   Mexico City (poderjudicialcdmx.gob.mx, iejcdmx.gob.mx): Cloudflare "Sorry, you have been
 *   blocked", from curl and from Chrome. Nuevo León (pjenl.gob.mx): Imperva "Request unsuccessful".
 *   Guanajuato (poderjudicial-gto.gob.mx), Quintana Roo, Puebla, Sinaloa judiciaries: time out.
 *   Dominican Republic Poder Judicial: Wordfence "Tu acceso a este sitio ha sido limitado".
 *   Paraguay CSJ: pj.gov.py/nominas/traductores redirects to datos.csj.gov.py, which times out
 *   (and Wayback holds only 404s for it). Bolivia: the Órgano Judicial's ODIN perito system times out.
 *   Colombia: MinRelaciones has published no list of traductores oficiales since Res. 10547 of 2018.
 *   Chile: none exists (the Ministry translates in-house). Mendoza college: site returns 503 and
 *   its "matriculados" page is member information, not a roll. Córdoba college (ctppc.com.ar):
 *   403 Forbidden to this client; its search form was not touched, and no PDF roll was found.
 *
 * THE RULE
 *
 * A row is proposed only where the roll itself names the language. The local language is never
 * published: Portuguese on the Brazilian rolls, Spanish elsewhere. A language the directory has no
 * code for (Latin, Libras, Guaraní) is not published; if nothing is left the person is refused.
 * More than six languages is refused whole. Only a status the roll itself calls current ("Regular")
 * is proposed: "Dados desatualizados", "Suspenso", "Licenciado", "Irregular", "cancelada" are not.
 *
 * TRAPS
 *
 *   - JUCERJA's pager keeps no filter: PaginarTradutores pages the whole roll, every status. The
 *     status is read per entry. A page past the end returns the pager with no entries.
 *   - JUCERJA writes "Nº - / -" where the house number is blank; the address is kept as printed.
 *   - JUCEMG lists one person on several language pages; the matrícula merges them.
 *   - JUCEMG's "Regular, mas com pendência documental relativa a recadastramento" is still Regular:
 *     the matrícula stands until the Junta suspends it.
 *
 *   fetch    node scripts/read_latam_sources2.cjs fetch <jucerja|jucemg|jucisrs|jucep|...|all> --cache <dir>
 *   propose  node scripts/read_latam_sources2.cjs propose --cache <dir> [--out <dir>]
 *
 * Nothing here writes under data/. It reads data/service-languages.json only to mark rows the
 * directory already holds. Ingest is a separate, reviewed step.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const { displayName } = require('./read_latam_sources.cjs');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'latam2')));
const OUT = path.resolve(val('--out', CACHE));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_LANGS = 6;

async function get(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(60000), headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
      if (r.status === 200) return opts.binary ? Buffer.from(await r.arrayBuffer()) : await r.text();
      if (r.status === 404 || r.status === 410) return null;
    } catch (e) { /* retried below */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}
const gz = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(s)); };
const ungz = (f) => zlib.gunzipSync(fs.readFileSync(f)).toString();
const mdate = (f) => fs.statSync(f).mtime.toISOString().slice(0, 10);
const NAMED = { nbsp: ' ', amp: '&', quot: '"', lt: '<', gt: '>', ordm: 'º', ordf: 'ª', deg: '°', ndash: '-', mdash: '-', laquo: '«', raquo: '»', ccedil: 'ç', Ccedil: 'Ç' };
const ACCENT = { acute: '\u0301', grave: '\u0300', tilde: '\u0303', circ: '\u0302', uml: '\u0308', cedil: '\u0327' };
const decode = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([A-Za-z])(acute|grave|tilde|circ|uml|cedil);/g, (m, l, k) => (l + ACCENT[k]).normalize('NFC'))
  .replace(/&([a-zA-Z]+);/g, (m, k) => (k in NAMED ? NAMED[k] : m))
  .replace(/[ \t\r\f\v\u00a0]+/g, ' ').replace(/ *\n */g, '\n').trim();
const oneLine = (s) => decode(s).replace(/\s+/g, ' ').trim();
const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

// Language names as the rolls write them (Portuguese and Spanish), folded, to the directory's codes.
// Anything not here is reported, never guessed.
const LANG = {
  INGLES: 'en', FRANCES: 'fr', ALEMAO: 'de', ALEMAN: 'de', ITALIANO: 'it', PORTUGUES: 'pt', ESPANHOL: 'es', ESPANOL: 'es', CASTELLANO: 'es',
  RUSSO: 'ru', RUSO: 'ru', CHINES: 'zh', CHINO: 'zh', MANDARIM: 'zh', MANDARIN: 'zh', 'CHINES MANDARIM': 'zh', 'CHINO MANDARIN': 'zh',
  JAPONES: 'ja', COREANO: 'ko', ARABE: 'ar', HEBRAICO: 'he', HEBREO: 'he', POLONES: 'pl', POLACO: 'pl',
  HOLANDES: 'nl', NEERLANDES: 'nl', CATALAO: 'ca', CATALAN: 'ca', UCRANIANO: 'uk', TCHECO: 'cs', CHECO: 'cs',
  DINAMARQUES: 'da', DANES: 'da', SUECO: 'sv', ESLOVENO: 'sl', ESLOVACO: 'sk', GREGO: 'el', GRIEGO: 'el',
  ROMENO: 'ro', RUMANO: 'ro', HUNGARO: 'hu', BULGARO: 'bg', ALBANES: 'sq', NORUEGUES: 'no', NORUEGO: 'no',
  FINLANDES: 'fi', FINLANDES_: 'fi', TURCO: 'tr', LITUANO: 'lt', LETAO: 'lv', LETON: 'lv', ESTONIANO: 'et', ESTONIO: 'et',
  CROATA: 'hr', SERVIO: 'sr', SERBIO: 'sr', PERSA: 'fa', FARSI: 'fa', HINDI: 'hi', VIETNAMITA: 'vi', TAILANDES: 'th',
  INDONESIO: 'id', AFRICANER: 'af', AFRICANO: 'af', 'AFRIKAANS': 'af', MALAIO: 'ms', TAGALO: 'tl', GEORGIANO: 'ka',
};
// Named on a roll but not a language the directory lists, or not one language.
const NO_CODE = new Set(['LATIM', 'LATIN', 'LIBRAS', 'LSB', 'GUARANI', 'QUECHUA', 'AIMARA', 'AYMARA', 'SERVO-CROATA', 'ARMENIO', 'BIELORRUSSO', 'BIELORRUSO', 'ESPERANTO', 'CRIOULO', 'CREOLE', 'KRIOL', 'MAYA', 'OTOMI', 'LENGUA DE SENAS MEXICANA', 'LENGUA DE SENAS']);
function codes(names, local) {
  const out = []; const unknown = []; const nocode = [];
  for (const n of names) {
    const k = fold(n).replace(/[.;:]+$/, '');
    if (!k) continue;
    if (NO_CODE.has(k)) { nocode.push(k); continue; }
    const c = LANG[k];
    if (!c) { unknown.push(n); continue; }
    if (!local.includes(c) && !out.includes(c)) out.push(c);
  }
  return { out, unknown, nocode };
}
const webUrl = (s) => {
  const x = String(s || '').trim().split(/\s+|\s*[|;,]\s*/)[0];
  if (!x || /linkedin|facebook|instagram|twitter|wa\.me/i.test(x)) return '';
  if (!/^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(x)) return '';
  return /^https?:/i.test(x) ? x : `https://${x}`;
};

// ---- jucerja ----------------------------------------------------------------
const RJ = 'https://www.jucerja.rj.gov.br';
const RJ_PAGE = `${RJ}/AuxiliaresComercio/Tradutores`;
async function fetchJucerja() {
  const dir = path.join(CACHE, 'jucerja');
  fs.mkdirSync(dir, { recursive: true });
  const pages = [];
  for (let p = 1; p < 400; p += 1) {
    const h = await get(`${RJ}/AuxiliaresComercio/PaginarTradutores?pagina=${p}&ordenacao=`, { headers: { 'X-Requested-With': 'XMLHttpRequest', Referer: RJ_PAGE } });
    const n = h ? (h.match(/Situação Funcional:|Situa&#231;&#227;o Funcional:/g) || []).length : 0;
    if (!n) break;
    pages.push(h);
    if (p % 20 === 0) console.log(`  jucerja page ${p}`);
    await sleep(500);
  }
  gz(path.join(dir, 'pages.html.gz'), pages.join('\n<!--PAGE-->\n'));
  console.log(`jucerja: ${pages.length} pages`);
}
function parseJucerja(html) {
  // One <li class="ats-listaLnks-item"> per person: an <h4> name, then <h5>label</h5><h6>value</h6>
  // pairs. (Reading the decoded text with one pattern mis-split entries whose website was blank.)
  return html.split('<li class="ats-listaLnks-item">').slice(1).map((it) => {
    const f = {};
    for (const m of it.matchAll(/<h5[^>]*>([^<]*)<\/h5>\s*<h6[^>]*>([\s\S]*?)<\/h6>/g)) f[oneLine(m[1]).replace(/:$/, '')] = oneLine(m[2]);
    const addr = f['Endereço'] || '';
    const am = addr.match(/- ([^-]*?) - ([^-]+?) - RJ - CEP: ?(\d+)\s*$/);
    return {
      name: oneLine((it.match(/<h4[^>]*>([\s\S]*?)<\/h4>/) || [])[1]), status: f['Situação Funcional'] || '', matricula: f['Matrícula'] || '',
      since: f['Data Matrícula'] || '', site: f.WebSite || '', address: addr,
      bairro: am ? am[1].trim() : '', municipio: am ? am[2].trim() : '', cep: am ? am[3] : '',
      langs: (f.Idioma || '').split(',').map((x) => x.trim()).filter(Boolean),
    };
  }).filter((p) => p.name);
}
const RJ_CITY = { 'RIO DE JANEIRO': 'rio', PARATY: 'paraty', PARATI: 'paraty' };

// ---- jucemg -----------------------------------------------------------------
const MG = 'https://jucemg.mg.gov.br';
const MG_INDEX = `${MG}/pagina/37/tradutores-e-interpretes-publicos`;
async function fetchJucemg() {
  const dir = path.join(CACHE, 'jucemg');
  fs.mkdirSync(dir, { recursive: true });
  const idx = await get(MG_INDEX);
  const seg = idx.slice(idx.indexOf('Lista dos Tradutores'), idx.indexOf('matr&iacute;cula cancelada'));
  const links = [...new Set([...seg.matchAll(/href="((?:https?:\/\/(?:www\.)?jucemg\.mg\.gov\.br)?\/pagina\/(\d+)\/[^"]+)"/g)].map((m) => m[2]))];
  const index = [];
  for (const id of links) {
    const h = await get(`${MG}/pagina/${id}`);
    await sleep(800);
    if (!h) continue;
    gz(path.join(dir, `${id}.html.gz`), h);
    index.push({ id, url: `${MG}/pagina/${id}`, title: oneLine((h.match(/<h1 class="title[^"]*">([^<]*)<\/h1>/) || [])[1]) });
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`jucemg: ${index.length} language pages (${index.map((x) => x.title).join(', ')})`);
}
function parseJucemg(html) {
  const a = html.indexOf('<section class="section__xs">');
  const b = html.indexOf('</section>', a);
  const body = html.slice(a, b);
  return [...body.matchAll(/<p>\s*<strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/g)].map((m) => {
    const lines = decode(m[2]).split('\n').map((s) => s.trim()).filter(Boolean);
    const f = (re) => { const l = lines.find((x) => re.test(x)); return l ? l.replace(re, '').trim() : ''; };
    return {
      name: oneLine(m[1]), matricula: (f(/^Matr[ií]cula:\s*/).match(/^(\d+)/) || [])[1] || '',
      since: (f(/^Matr[ií]cula:\s*/).match(/de (\d{2}\/\d{2}\/\d{4})/) || [])[1] || '',
      site: f(/^Site:\s*/), address: f(/^Endere[çc]o:\s*/), status: f(/^Situa[çc][ãa]o funcional:\s*/i),
      phones: f(/^Telefones?:\s*/),
    };
  }).filter((p) => p.name && p.matricula);
}
// "Rua ..., n° 802, Sala 1105 - Bairro Lourdes - Belo Horizonte - MG - CEP ..." or just "Juiz de Fora - MG".
const MG_CITY = { 'BELO HORIZONTE': 'belohorizonte', 'OURO PRETO': 'ouropreto', TIRADENTES: 'tiradentes', DIAMANTINA: 'diamantina' };
function mgCity(address) {
  const a = fold(address);
  for (const [k, v] of Object.entries(MG_CITY)) if (new RegExp(`(^|[-,/] *)${k}( *[-,/]|\\s*$| MG\\b)`).test(a)) return v;
  return '';
}

// ---- jucisrs ----------------------------------------------------------------
const RS = 'https://sistemas.jucisrs.rs.gov.br/tradutores/';
async function fetchJucisrs() {
  const t = await get(RS);
  if (!t || (t.match(/<tr /g) || []).length < 100) throw new Error('JUCISRS table came back short');
  gz(path.join(CACHE, 'jucisrs', 'tradutores.html.gz'), t);
  console.log(`jucisrs: ${(t.match(/<tr /g) || []).length - 1} rows`);
}
function parseJucisrs(html) {
  const b = html.slice(html.indexOf('<tbody'));
  return [...b.matchAll(/<tr [^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => oneLine(x[1])))
    .filter((c) => c.length >= 13)
    .map((c) => ({ matricula: c[0], name: c[1], status: c[3], since: c[4], langs: c[5].split(/[,;/]| e /).map((s) => s.trim()).filter(Boolean), site: c[8], address: c[9], municipio: c[10], uf: c[11] }));
}
const RS_CITY = { 'PORTO ALEGRE': 'portoalegre', GRAMADO: 'gramado' };

// ---- jucep (Paraíba) --------------------------------------------------------
const PB = 'https://jucep.pb.gov.br/contatos/tradutores';
async function fetchJucep() {
  const t = await get(PB);
  if (!t || !t.includes('Contatos de Tradutores')) throw new Error('JUCEP page changed');
  gz(path.join(CACHE, 'jucep', 'tradutores.html.gz'), t);
  console.log('jucep: saved');
}
function parseJucep(html) {
  const s = html.slice(html.indexOf('Contatos de Tradutores'));
  return [...s.matchAll(/<h5>([\s\S]*?)<\/h5>\s*<p><strong>([^<]+)<\/strong><\/p>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => {
    const body = decode(m[3]);
    return { langs: oneLine(m[1]).split(/[,/]| e /).map((x) => x.trim()).filter(Boolean), name: oneLine(m[2]), address: body.split('\n')[0], cep: ((body.match(/CEP:\s*([\d.-]+)/) || [])[1] || '').replace(/\D/g, '') };
  });
}

const pdfText = (file) => execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', file, '-'], { maxBuffer: 80e6 }).toString();

// ---- uy-pj (Uruguay) --------------------------------------------------------
// Poder Judicial, Registro Único de Peritos (Acordada 7449): "Listado completo de especialidades
// (peritos)", one PDF. Under "TRADUCTOR PUBLICO / IDIOMAS" a language heading (Alemán, Francés,
// Inglés, Italiano, Portugués) is followed by "Surnames, Given names   <zones>   <Departamento>"; after
// it come "IDONEO EN ÁRABE / CHINO / COREANO". The Departamento is where the perito is based. Only
// Montevideo is placed: the department of Montevideo is the city. Canelones, Maldonado (Punta del
// Este) and Colonia are departments, not our towns, and are held. No contact data is printed.
// The Colegio de Traductores Públicos del Uruguay's own endpoint is NOT used (it leaks members'
// national ID numbers and password hashes; see the first script's header).
const UY_PAGE = 'https://www.poderjudicial.gub.uy/peritos/peritos-habilitados';
async function fetchUy() {
  const page = await get(UY_PAGE);
  const href = (page.match(/href="([^"]*Listado[^"]*especialidades[^"]*\.pdf)"/i) || [])[1];
  if (!href) throw new Error('no peritos PDF on the Poder Judicial page');
  const url = new URL(href, UY_PAGE).href;
  const buf = await get(url, { binary: true });
  const dir = path.join(CACHE, 'uy-pj');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'peritos.pdf'), buf);
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ page: UY_PAGE, pdf: url }));
  console.log(`uy-pj: ${buf.length} bytes from ${url}`);
}
const UY_DEPTS = ['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José', 'Florida', 'Flores', 'Durazno', 'Lavalleja', 'Rocha', 'Treinta y Tres', 'Cerro Largo', 'Rivera', 'Tacuarembó', 'Salto', 'Paysandú', 'Río Negro', 'Soriano', 'Artigas'];
function parseUy(file) {
  const lines = pdfText(file).split(/\r?\n/);
  const a = lines.findIndex((l) => /^TRADUCTOR PUBLICO\s*$/.test(l.trim()));
  const out = []; const bad = [];
  let lang = '';
  for (let i = a + 1; i < lines.length; i += 1) {
    const l = lines[i].replace(/\f/g, '');
    const t = l.trim();
    if (!t || /^Página\s+\d+/.test(t) || /^Area Temática/.test(t) || t === 'IDIOMAS') continue;
    const ido = t.match(/^IDONEO EN (\S+)$/);
    if (ido) { lang = ido[1]; continue; }
    if (/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s-]{5,}$/.test(t)) break; // the next profession heading ends the section
    if (/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(t)) { lang = t; continue; }
    if (!lang) continue;
    const m = l.match(/^(\S[^,]*,\s*\S.*?)\s{2,}(.*)$/);
    if (!m) { bad.push(t); continue; }
    const dept = UY_DEPTS.find((d) => new RegExp(`${d}\\s*$`).test(m[2].trim())) || '';
    out.push({ name: m[1].trim(), lang, zones: m[2].replace(new RegExp(`${dept}\\s*$`), '').trim(), dept });
  }
  return { rows: out, bad };
}

// ---- cjj (Jalisco) ----------------------------------------------------------
// Consejo de la Judicatura del Estado de Jalisco, "Lista Auxiliares de la Administración de
// Justicia 2026-2027" (valid 1 May 2026 to 30 April 2027), a PDF linked from the api behind
// cjj.gob.mx/experts. Sections "INTÉRPRETE|TRADUCTOR DE LOS IDIOMAS X-Y Y VICEVERSA", then blocks
// NOMBRE / TELEFONO / CELULAR / CORREO / PARTIDO(S) JUDICIAL(ES). The convocatoria makes every
// applicant prove a domicile ("comprobante de domicilio ... respecto al o los Partidos ... donde
// pretende desempeñarse"), so the partido is where the person is based. Partido 1 is Guadalajara
// (Guadalajara, Zapopan, Tlaquepaque, Tonalá), 27 is Puerto Vallarta; 31 (Tlajomulco) and the rest
// are not our cities.
const CJJ_API = 'https://api.cjj.gob.mx/experts?url=experts';
async function fetchCjj() {
  const j = JSON.parse(await get(CJJ_API, { headers: { Origin: 'https://www.cjj.gob.mx' } }));
  const files = j.data.experts.flatMap((e) => e.experts_files.map((f) => ({ year: e.yearName, text: f.text, file: f.file })));
  const cur = files.filter((f) => /^LISTA AUXILIARES/i.test(f.year)).sort((x, y) => y.year.localeCompare(x.year))[0];
  if (!cur) throw new Error('no LISTA AUXILIARES on the CJJ api');
  const buf = await get(cur.file, { binary: true });
  const dir = path.join(CACHE, 'cjj');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'lista.pdf'), buf);
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(cur));
  console.log(`cjj: ${cur.text} (${buf.length} bytes)`);
}
function parseCjj(file) {
  const lines = pdfText(file).split(/\r?\n/);
  const out = []; let sect = null; let cur = null;
  const flush = () => { if (cur && sect) out.push({ ...cur, role: sect.role, langs: sect.langs }); cur = null; };
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].replace(/\f/g, '').trim();
    if (!t || /^\d{1,4}$/.test(t)) continue;
    const h = t.match(/^(INTÉRPRETE|TRADUCTORA?) DE\s+LOS\s+IDIOMAS\s+(.+?)\s+Y\s+VICEVERSA\.?$/);
    if (h) { flush(); sect = { role: h[1], langs: h[2].split('-').map((x) => x.trim()) }; continue; }
    const kv = t.match(/^([A-ZÁÉÍÓÚ ]+):\s*(.*)$/);
    if (kv) {
      if (/^NOMBRE$/.test(kv[1])) { flush(); cur = { name: kv[2].trim() }; continue; }
      if (cur && /^PARTIDOS? JUDICIAL/.test(kv[1])) cur.partidos = (kv[2].match(/\d+/g) || []).map(Number);
      continue;
    }
    // A wrapped name continues on the next line with no label ("CAROLINE MICHELE").
    if (cur && !cur.partidos && /^[A-ZÁÉÍÓÚÑÜ .'-]+$/.test(t) && lines[i].search(/\S/) > 12) { cur.name += ` ${t}`; continue; }
    if (/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ,.()-]{3,}$/.test(t)) { flush(); sect = null; } // any other heading ends the section
  }
  flush();
  return out.filter((r) => r.name);
}
const CJJ_CITY = { 1: 'guadalajara', 27: 'puertovallarta' };

// ---- pjyuc (Yucatán) --------------------------------------------------------
// Poder Judicial del Estado de Yucatán, Registro de Peritos, "Directorio": one table of every
// registered perito with Especialidad, registration number, Domicilio, phones, Vigencia
// ("23/03/2026 A 22/03/2029") and Dependencia. Rows with a Dependencia are state employees (Fiscalía)
// and are not proposed. A row is placed in Mérida when the Domicilio names Mérida; a Domicilio that
// names another municipality (Tekax, Valladolid, Progreso, Conkal ...) is not placed; a Domicilio with
// no municipality at all is placed only if a phone carries Mérida's area code 999, and says so in
// "placement" so the reviewer can drop that group.
const YUC = 'https://www.pjyucatan.gob.mx/registro_peritos/Pages/directorio';
async function fetchYuc() {
  const t = await get(YUC);
  if (!t || !t.includes('tbldirectorio')) throw new Error('Yucatán directory changed');
  gz(path.join(CACHE, 'pjyuc', 'directorio.html.gz'), t);
  console.log('pjyuc: saved');
}
function parseYuc(html) {
  const b = html.slice(html.indexOf('tbldirectorio'));
  return [...b.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => oneLine(x[1])))
    .filter((c) => c.length >= 12)
    .map((c) => ({ name: c[1], esp: c[3], reg: c[5], address: c[6], phone: c[7], cell: c[8], vigencia: c[9], dependencia: c[11] }));
}
const YUC_OTHER = /\b(Tekax|Valladolid|Progreso|Conkal|Dzidzant[uú]n|Oxkutzcab|Chapab|Kanas[ií]n|Um[aá]n|Tizim[ií]n|Motul|Ticul|Izamal|Canc[uú]n|Playa del Carmen)\b/i;

// ---- held-only rolls ----------------------------------------------------------
// These publish name + language but no place we can match to one of our cities without guessing.
// They are fetched so the report can count them; nothing from them is proposed.
//   mire-pa  Panama, Ministerio de Relaciones Exteriores, "Traductores Públicos Autorizados": one
//            TablePress table, name, phones, IDIOMA 1..4. No address, no city.
//   gt-mineduc  Guatemala, Ministerio de Educación (DISERSA), traductores jurados: Livewire table
//            paged by ?page=N; Departamento only (Sacatepéquez is not Antigua, Sololá is not the lake).
//   qro-pj   Querétaro, Poder Judicial, Padrón de Auxiliares: POST especialidadtmp=<id> per
//            language; name and phone only. Querétaro is our city, but the padrón prints no place.
const PA = 'https://mire.gob.pa/traductores-publicos-autorizados/';
const GT = 'https://certificados.mineduc.gob.gt/';
const QRO = 'https://www.poderjudicialqro.gob.mx/cedulas/padron-de-peritos.php';
async function fetchHeld() {
  const pa = await get(PA);
  if (pa) gz(path.join(CACHE, 'held', 'mire-pa.html.gz'), pa);
  const gtPages = [];
  for (let p = 1; p < 200; p += 1) {
    const h = await get(`${GT}?page=${p}`);
    const rows = h ? parseTableRows(h, 5) : [];
    if (!rows.length || (gtPages.length && rows[0].join('|') === gtPages[gtPages.length - 1][0].join('|'))) break;
    gtPages.push(rows);
    await sleep(600);
  }
  fs.writeFileSync(path.join(CACHE, 'held', 'gt-mineduc.json'), JSON.stringify(gtPages.flat()));
  const form = await get(QRO);
  const opts = [...form.slice(form.indexOf('especialidadtmp')).matchAll(/<option[^>]*value='(\d+)'[^>]*>([^<]*)/g)]
    .filter((m) => /^(TRADUCTOR|INTERPRETE)\s+\S+.*ESPA/.test(m[2].trim()));
  const qro = [];
  for (const [, id, label] of opts) {
    const h = await get(QRO, { method: 'POST', body: new URLSearchParams({ especialidadtmp: id }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    await sleep(700);
    if (h) parseTableRows(h, 3).filter((r) => r[0] === label.trim()).forEach((r) => qro.push({ esp: r[0], name: r[1] }));
  }
  fs.writeFileSync(path.join(CACHE, 'held', 'qro-pj.json'), JSON.stringify(qro));
  console.log(`held: mire-pa ${pa ? 'saved' : 'FAILED'}, gt-mineduc ${gtPages.flat().length} rows, qro-pj ${qro.length} rows`);
}
function parseTableRows(html, min) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => oneLine(x[1]))).filter((r) => r.length >= min && r[0]);
}

// ---- propose ----------------------------------------------------------------
const IN_DREI = 'Lei 14.195/2021 art. 22 ff. and IN DREI 52/2022 make the Junta Comercial the body that matriculates tradutores e intérpretes públicos, and the Junta publishes the roll so the public can check who may sign a sworn translation ("Somente Tradutor e Intérprete Público matriculado na Junta Comercial pode ser contratado para essa finalidade", JUCEMG).';
const SOURCES = {
  jucerja: {
    publisher: 'Junta Comercial do Estado do Rio de Janeiro (JUCERJA)', url: RJ_PAGE,
    licenceOrTermsQuote: `No terms of use on jucerja.rj.gov.br; the only notice is the footer "© Junta Comercial do Estado do Rio de Janeiro. Todos os Direitos Reservados. Copyright 2016." (a generic copyright line, not a clause on reuse or extraction; flagged for the owner). The LGPD page says the Junta processes data "para publicidade, autenticidade, segurança e eficácia dos atos jurídicos (art. 1º da Lei n. 8.934/94)". ${IN_DREI}`,
    pageNote: 'Some of these are sworn translators (tradutores e intérpretes públicos) on the roll of the Junta Comercial do Estado do Rio de Janeiro, the state body that appoints them. The languages shown are the ones each translator is appointed in.',
  },
  jucemg: {
    publisher: 'Junta Comercial do Estado de Minas Gerais (JUCEMG)', url: MG_INDEX,
    licenceOrTermsQuote: `JUCEMG "Aspectos legais e responsabilidades": "Qualquer conteúdo (imagens, fotos, textos, tabelas, arquivos,...) desde que identificada à fonte e atribuído o crédito, podem ser reutilizadas." Reuse is allowed with attribution. ${IN_DREI}`,
    pageNote: 'Some of these are sworn translators (tradutores e intérpretes públicos) on the roll of the Junta Comercial do Estado de Minas Gerais, which appoints them and publishes one list per language. The languages shown are the ones each translator is appointed in.',
  },
  jucisrs: {
    publisher: 'Junta Comercial, Industrial e Serviços do Rio Grande do Sul (JucisRS)', url: RS,
    licenceOrTermsQuote: `JucisRS "Termos de uso" (jucisrs.rs.gov.br/termos-de-uso) covers only browsers, JavaScript and style sheets; there is no clause on reuse. The Junta links the list as "RELACAO DE TRADUTORES ATUALIZADA". ${IN_DREI}`,
    pageNote: 'Some of these are sworn translators (tradutores públicos e intérpretes comerciais) on the roll of the Junta Comercial do Rio Grande do Sul, the state body that appoints them. Only translators the roll marks "Regular" are listed, with the languages each is appointed in.',
  },
  jucep: {
    publisher: 'Junta Comercial do Estado da Paraíba (JUCEP)', url: PB,
    licenceOrTermsQuote: `No terms of use on jucep.pb.gov.br. The page is headed "Contatos de Tradutores Juramentados". ${IN_DREI}`,
    pageNote: 'Some of these are sworn translators listed by the Junta Comercial do Estado da Paraíba, the state body that appoints them. The language shown is the one each is appointed in.',
  },
  'uy-pj': {
    publisher: 'Poder Judicial del Uruguay, Registro Único de Peritos', url: UY_PAGE,
    licenceOrTermsQuote: 'No terms of use on poderjudicial.gub.uy (footer, peritos page and site map read). The Suprema Corte keeps the register under Acordada 7449 ("Reglamento Registro Único de Peritos") and publishes the "Listado completo de especialidades (peritos)" for the public, with a contact for queries (peritos@poderjudicial.gub.uy).',
    pageNote: 'Some of these are public translators and language experts on the Registro Único de Peritos of Uruguay\'s judiciary, listed for the language each is registered in. The register gives no contact details.',
  },
  cjj: {
    publisher: 'Consejo de la Judicatura del Estado de Jalisco', url: 'https://www.cjj.gob.mx/experts',
    licenceOrTermsQuote: 'No terms of use on cjj.gob.mx. The list is published by the Council\'s own order: the approved list "será publicada en el Boletín Judicial, así como en el portal de Internet del Consejo" (Convocatoria 2026-2027), and the PDF opens "Se hace del conocimiento de funcionarios y servidores públicos ... Abogados, Litigantes y Público en General".',
    pageNote: 'Some of these are court-authorised translators and interpreters on the 2026-2027 list of the Consejo de la Judicatura del Estado de Jalisco, which authorises each for named language pairs and judicial districts. The languages shown are the pairs each is authorised in.',
  },
  pjyuc: {
    publisher: 'Poder Judicial del Estado de Yucatán, Registro de Peritos', url: YUC,
    licenceOrTermsQuote: 'No terms of use on pjyucatan.gob.mx (footer carries only "Poder Judicial del Estado de Yucatán"). The Registro de Peritos publishes the Directorio of registered peritos with each registration\'s validity.',
    pageNote: 'Some of these are translators and interpreters on the Registro de Peritos of the Poder Judicial del Estado de Yucatán, registered for the language pairs shown, with registrations valid when we checked.',
  },
};

function existingIndex() {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
  const k = (s) => fold(s).replace(/[^A-Z0-9]+/g, '');
  const set = new Set(db.providers.map((p) => `${p.city}|${k(p.name)}`));
  return (city, name) => set.has(`${city}|${k(name)}`);
}
const dmy = (s) => { const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };

function propose() {
  fs.mkdirSync(OUT, { recursive: true });
  const known = existingIndex();
  const bundles = {}; const refused = []; const held = [];
  const seen = new Map();
  const push = (src, row, raw) => {
    const r = codes(raw.langs, raw.local);
    if (r.unknown.length) refused.push({ src, name: row.name, why: `unmapped language ${r.unknown.join(', ')} (other languages kept)` });
    if (!r.out.length) { refused.push({ src, name: row.name, why: r.nocode.length ? `only ${r.nocode.join(', ')}` : 'no foreign language on the roll' }); return; }
    if (r.out.length > MAX_LANGS) { refused.push({ src, name: row.name, why: `${r.out.length} languages` }); return; }
    if (known(row.city, row.name)) { refused.push({ src, name: row.name, why: 'already in the directory' }); return; }
    const k = `${row.city}|${fold(row.name).replace(/[^A-Z]+/g, '')}`;
    const prior = seen.get(k);
    if (prior) {
      r.out.forEach((c) => { if (!prior.languages.includes(c)) prior.languages.push(c); });
      if (raw.quote && !prior.quote.includes(raw.quote)) prior.quote += `; ${raw.quote}`;
      return;
    }
    const out = { ...row, category: 'translator', languages: r.out, evidence: 'official', quote: raw.quote || raw.langs.join(', ') };
    seen.set(k, out);
    (bundles[src] = bundles[src] || []).push(out);
  };

  // JUCERJA
  const rjf = path.join(CACHE, 'jucerja', 'pages.html.gz');
  if (fs.existsSync(rjf)) {
    const checked = mdate(rjf);
    for (const p of parseJucerja(ungz(rjf))) {
      if (!/^Regular/i.test(p.status)) { refused.push({ src: 'jucerja', name: p.name, why: `status ${p.status}` }); continue; }
      const city = RJ_CITY[fold(p.municipio)];
      if (!city) { held.push({ src: 'jucerja', name: p.name, place: p.municipio || p.address, why: 'municipality is not one of our cities' }); continue; }
      const url = webUrl(p.site);
      push('jucerja', { city, name: p.name, ...(url ? { url } : {}), sourceUrl: RJ_PAGE, checked, area: p.bairro, matricula: p.matricula }, { langs: p.langs, local: ['pt'] });
    }
  }

  // JUCEMG: one page per language; the matrícula merges a person's pages.
  const mgd = path.join(CACHE, 'jucemg');
  if (fs.existsSync(path.join(mgd, 'index.json'))) {
    const people = new Map();
    for (const e of JSON.parse(fs.readFileSync(path.join(mgd, 'index.json'), 'utf8'))) {
      if (/cancelad/i.test(e.title)) continue;
      const f = path.join(mgd, `${e.id}.html.gz`);
      for (const p of parseJucemg(ungz(f))) {
        const q = people.get(p.matricula) || { ...p, langs: [], pages: [], checked: mdate(f) };
        if (!q.langs.includes(e.title)) q.langs.push(e.title);
        q.pages.push(e.url);
        if (!q.address && p.address) q.address = p.address;
        people.set(p.matricula, q);
      }
    }
    for (const p of people.values()) {
      const status = p.status.replace(/^Situa[çc][ãa]o funcional:\s*/i, '');
      if (!/^Regular/i.test(status)) { refused.push({ src: 'jucemg', name: p.name, why: `status ${status}` }); continue; }
      const city = mgCity(p.address);
      if (!city) { held.push({ src: 'jucemg', name: p.name, place: p.address || '(no address on the roll)', why: p.address ? 'address is not one of our cities' : 'no address on the roll' }); continue; }
      const url = webUrl(p.site);
      const area = (p.address.match(/Bairro ([^-]+?) -/) || [])[1];
      push('jucemg', { city, name: p.name, ...(url ? { url } : {}), sourceUrl: p.pages[0], ...(p.pages.length > 1 ? { alsoOn: p.pages.slice(1) } : {}), checked: p.checked, ...(area ? { area: area.trim() } : {}), matricula: p.matricula }, { langs: p.langs, local: ['pt'] });
    }
  }

  // JucisRS
  const rsf = path.join(CACHE, 'jucisrs', 'tradutores.html.gz');
  if (fs.existsSync(rsf)) {
    const checked = mdate(rsf);
    for (const p of parseJucisrs(ungz(rsf))) {
      const city = RS_CITY[fold(p.municipio)];
      if (!city) continue;
      if (p.status !== 'Regular') { refused.push({ src: 'jucisrs', name: p.name, why: `status ${p.status}` }); continue; }
      const url = webUrl(p.site);
      push('jucisrs', { city, name: p.name, ...(url ? { url } : {}), sourceUrl: RS, checked, matricula: p.matricula }, { langs: p.langs.flatMap((x) => x.split('|')).map((x) => x.trim()), local: ['pt'] });
    }
  }

  // JUCEP
  const pbf = path.join(CACHE, 'jucep', 'tradutores.html.gz');
  if (fs.existsSync(pbf)) {
    for (const p of parseJucep(ungz(pbf))) {
      if (!/^580[0-9]{2}/.test(p.cep)) { held.push({ src: 'jucep', name: p.name, place: p.cep, why: 'CEP outside João Pessoa' }); continue; }
      push('jucep', { city: 'joaopessoa', name: p.name, sourceUrl: PB, checked: mdate(pbf), area: p.address.split(' - ').pop().trim() }, { langs: p.langs, local: ['pt'] });
    }
  }

  // Uruguay
  const uyf = path.join(CACHE, 'uy-pj', 'peritos.pdf');
  if (fs.existsSync(uyf)) {
    const idx = JSON.parse(fs.readFileSync(path.join(CACHE, 'uy-pj', 'index.json'), 'utf8'));
    const { rows, bad } = parseUy(uyf);
    bad.forEach((b) => refused.push({ src: 'uy-pj', name: b, why: 'line did not parse as "Surnames, Given names  zones  Departamento"' }));
    for (const r of rows) {
      if (r.dept !== 'Montevideo') { held.push({ src: 'uy-pj', name: r.name, place: r.dept || '(no departamento)', why: r.dept ? 'departamento is not Montevideo' : 'no departamento on the line' }); continue; }
      push('uy-pj', { city: 'montevideo', name: displayName(r.name), nameAsListed: r.name, sourceUrl: idx.pdf, checked: mdate(uyf) }, { langs: [r.lang], local: ['es'], quote: /^[A-ZÁÉÍÓÚ]+$/.test(r.lang) ? `Idóneo en ${r.lang}` : `Traductor Público, ${r.lang}` });
    }
  }

  // Jalisco
  const jf = path.join(CACHE, 'cjj', 'lista.pdf');
  if (fs.existsSync(jf)) {
    const idx = JSON.parse(fs.readFileSync(path.join(CACHE, 'cjj', 'index.json'), 'utf8'));
    for (const r of parseCjj(jf)) {
      const cities = [...new Set((r.partidos || []).map((n) => CJJ_CITY[n]).filter(Boolean))];
      if (!cities.length) { held.push({ src: 'cjj', name: r.name, place: `partido judicial ${(r.partidos || []).join(', ') || '?'}`, why: 'judicial district is not one of our cities' }); continue; }
      for (const city of cities) {
        push('cjj', { city, name: titleCaseName(r.name), nameAsListed: r.name, sourceUrl: idx.file, checked: mdate(jf), validUntil: '2027-04-30', partidos: r.partidos }, { langs: r.langs, local: ['es'], quote: `${r.role} de los idiomas ${r.langs.join('-')}` });
      }
    }
  }

  // Yucatán
  const yf = path.join(CACHE, 'pjyuc', 'directorio.html.gz');
  if (fs.existsSync(yf)) {
    const checked = mdate(yf);
    for (const r of parseYuc(ungz(yf))) {
      if (!/TRADUC|INT[ÉE]RPRET/i.test(r.esp)) continue;
      if (r.dependencia) { refused.push({ src: 'pjyuc', name: r.name, why: `works for ${r.dependencia}, not for hire` }); continue; }
      // Pairs are written "(INGLÉS-ESPAÑOL-INGLÉS)", once or several times; a few rows drop the
      // brackets ("IDIOMAS INGLÉS-ESPAÑOL-INGLÉS").
      let pairs = [...r.esp.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
      if (!pairs.length) pairs = (r.esp.match(/IDIOMAS\s+([A-ZÁÉÍÓÚÑ -]+-[A-ZÁÉÍÓÚÑ -]+)$/) || []).slice(1);
      if (!pairs.length) { refused.push({ src: 'pjyuc', name: r.name, why: `no language pair in "${r.esp}"` }); continue; }
      const until = dmy((r.vigencia.split(/\s+A\s+/)[1]) || '');
      if (until && until < checked) { refused.push({ src: 'pjyuc', name: r.name, why: `registration ran out ${until}` }); continue; }
      const langs = [...new Set(pairs.flatMap((p) => p.split('-').map((x) => x.trim())))];
      let placement = '';
      if (/M[ée]rida/i.test(r.address)) placement = 'address names Mérida';
      else if (YUC_OTHER.test(r.address) || /,\s*Yuc/i.test(r.address)) { held.push({ src: 'pjyuc', name: r.name, place: r.address, why: 'address names another municipality' }); continue; }
      else if (/(^|\D)\(?999\)?[\s.-]?\d/.test(`${r.phone} ${r.cell}`)) placement = 'address names no municipality; phone has Mérida area code 999';
      else { held.push({ src: 'pjyuc', name: r.name, place: r.address || '(no address)', why: 'no municipality and no Mérida phone' }); continue; }
      push('pjyuc', { city: 'merida', name: titleCaseName(r.name), nameAsListed: r.name, sourceUrl: YUC, checked, registro: r.reg, validUntil: until, placement }, { langs: langs.map((x) => x.replace(/^NGL/, 'INGL')), local: ['es'], quote: r.esp });
    }
  }

  // Held-only rolls: counted, never proposed.
  const heldCounts = {};
  const paf = path.join(CACHE, 'held', 'mire-pa.html.gz');
  if (fs.existsSync(paf)) {
    const rows = parseTableRows(ungz(paf), 6).filter((r) => r[0] && r[0] !== 'NOMBRE COMPLETO');
    heldCounts['mire-pa'] = { people: rows.length, why: 'no address or city on the roll (national list); 1,231 give a 2xx landline, which is not a city' };
  }
  const gtf = path.join(CACHE, 'held', 'gt-mineduc.json');
  if (fs.existsSync(gtf)) {
    const rows = JSON.parse(fs.readFileSync(gtf, 'utf8'));
    const by = {}; rows.forEach((r) => { by[r[1]] = (by[r[1]] || 0) + 1; });
    heldCounts['gt-mineduc'] = { rows: rows.length, people: new Set(rows.map((r) => r[0])).size, byDepartamento: by, why: 'departamento only; none of our Guatemalan cities is a departamento' };
  }
  const qf = path.join(CACHE, 'held', 'qro-pj.json');
  if (fs.existsSync(qf)) {
    const rows = JSON.parse(fs.readFileSync(qf, 'utf8'));
    heldCounts['qro-pj'] = { rows: rows.length, people: new Set(rows.map((r) => r.name)).size, why: 'name and phone only, no place on the padrón' };
  }

  const bundlesOut = [];
  for (const [src, rows] of Object.entries(bundles)) {
    const b = { source: SOURCES[src], rows };
    fs.writeFileSync(path.join(OUT, `proposals-${src}.json`), JSON.stringify(b, null, 1));
    bundlesOut.push(b);
  }
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify(bundlesOut, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify(refused, null, 1));
  fs.writeFileSync(path.join(OUT, 'held.json'), JSON.stringify({ held, heldCounts }, null, 1));
  const tally = {}; const langs = {};
  for (const [src, rows] of Object.entries(bundles)) rows.forEach((r) => { tally[`${src} ${r.city}`] = (tally[`${src} ${r.city}`] || 0) + 1; r.languages.forEach((l) => { langs[l] = (langs[l] || 0) + 1; }); });
  const why = {}; refused.forEach((r) => { const k = `${r.src}: ${r.why.replace(/\d.*$/, '').replace(/ [A-Z(].*$/, '')}`; why[k] = (why[k] || 0) + 1; });
  const hw = {}; held.forEach((r) => { const k = `${r.src}: ${r.why}`; hw[k] = (hw[k] || 0) + 1; });
  console.log(tally, langs, why, hw, heldCounts);
}
// "STAUNER TOBIAS": surnames first, no comma; the order is the roll's own, only the capitals change.
function titleCaseName(s) {
  const SMALL = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'von', 'van', 'der', 'di', 'da']);
  return String(s).toLowerCase().split(/\s+/).filter(Boolean).map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()))).join(' ');
}

module.exports = { parseJucerja, parseJucemg, parseJucisrs, parseJucep, parseUy, parseCjj, parseYuc, codes };

if (require.main === module) {
  (async () => {
    const which = argv[1];
    if (cmd === 'fetch') {
      const run = { jucerja: fetchJucerja, jucemg: fetchJucemg, jucisrs: fetchJucisrs, jucep: fetchJucep, 'uy-pj': fetchUy, cjj: fetchCjj, pjyuc: fetchYuc, held: fetchHeld };
      for (const [k, fn] of Object.entries(run)) if (which === k || which === 'all') await fn();
      return;
    }
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_latam_sources2.cjs <fetch <source|all>|propose> --cache <dir> [--out <dir>]');
    process.exit(2);
  })();
}

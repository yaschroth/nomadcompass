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
 *
 * LOOKED AT AND NOT READ HERE (quotes in the agent report)
 *
 *   JUCEPAR (Curitiba), JUCESC (Florianópolis), JUCEPE (Recife), JUCEB (Salvador), JUCEPA (Belém),
 *   JUCEAL (Maceió), JUCERN (Natal), JUCIS-DF (Brasília), JUCEA (Manaus), JUCEMS (Campo Grande):
 *   the TCP connection times out from outside Brazil, from curl and from headless Chrome alike (the
 *   host names resolve; nothing answers). JUCEC (Fortaleza) answers 403 from ce.gov.br.
 *   JUCEG (Goiás) publishes its roll, but no city of ours is in Goiás.
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
// (perit
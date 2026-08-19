/**
 * Queries Spain's official register of sworn translators and interpreters.
 *
 * https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Buscador-STIJ.aspx is the register
 * the Spanish foreign ministry keeps of everyone entitled to produce sworn translations, searchable
 * by country, province, language and title. The FCDO's own "list of translators in Spain" holds no
 * names at all: it tells you to search this register instead. So this is the primary source, and
 * going to it directly is better than quoting somebody's pointer to it.
 *
 * It is an ASP.NET WebForms page, so a query is a postback: read __VIEWSTATE, __VIEWSTATEGENERATOR
 * and __EVENTVALIDATION off the page, then post them back with the four dropdowns and the search
 * button. Nothing here is guessed; it is the flow the page's own button follows.
 *
 * Usage: node scripts/fetch_maec_translators.cjs <PROVINCE> <LANGUAGE> <out.html>
 *   e.g. node scripts/fetch_maec_translators.cjs BARCELONA "INGLÉS" out.html
 */
const fs = require('fs');

const URL_PAGE = 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Buscador-STIJ.aspx';
const [, , PROVINCE, LANGUAGE, OUT] = process.argv;
if (!PROVINCE || !LANGUAGE || !OUT) {
  console.error('usage: node scripts/fetch_maec_translators.cjs <PROVINCE> <LANGUAGE> <out.html>');
  process.exit(2);
}

let cookie = '';
const remember = (res) => {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const jar = {};
  cookie.split('; ').filter(Boolean).forEach((c) => { const i = c.indexOf('='); jar[c.slice(0, i)] = c.slice(i + 1); });
  set.forEach((c) => { const p = c.split(';')[0]; const i = p.indexOf('='); jar[p.slice(0, i)] = p.slice(i + 1); });
  cookie = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
};

const UA = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es-ES,es;q=0.9' };

// Unquoted attributes are normal in this page's markup, so every pattern here has to allow them.
const hidden = (html, name) => {
  // This page writes both the attribute names and their values without quotes, so a pattern that
  // insists on quotes finds nothing and the form looks like it has changed when it has not.
  const quoted = html.match(new RegExp('name="?' + name + '"?[^>]*?value="([^"]*)"'));
  if (quoted) return quoted[1];
  const bare = html.match(new RegExp('name="?' + name + '"?[^>]*?value=([^ >]+)'));
  return bare ? bare[1] : '';
};
const controlName = (html, suffix) => {
  const m = html.match(new RegExp('name=([^ >"]*\\$' + suffix + ')'));
  return m ? m[1] : '';
};

(async () => {
  const first = await fetch(URL_PAGE, { headers: UA });
  remember(first);
  const html = await first.text();

  const fields = {
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __VIEWSTATE: hidden(html, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: hidden(html, '__VIEWSTATEGENERATOR'),
    __EVENTVALIDATION: hidden(html, '__EVENTVALIDATION'),
  };
  if (!fields.__VIEWSTATE) { console.error('no __VIEWSTATE on the page; the form has changed'); process.exit(1); }

  const country = controlName(html, 'ddlCountry');
  const province = controlName(html, 'ddlProvince');
  const language = controlName(html, 'ddlLanguage');
  // The register's own button, not the ministry's site-wide search box. Matching /btn/ anywhere on
  // the page picked ctl00$ctl56$ctl04$btnSearch, which searches the whole ministry and returns a
  // page with no register results on it at all.
  const button = controlName(html, 'btnSearchKeyWorks');
  const active = controlName(html, 'cbActive');
  if (!country || !province || !language) {
    console.error('could not find the dropdowns; the form has changed');
    process.exit(1);
  }

  const body = new URLSearchParams(fields);
  body.set(country, 'ESPAÑA');
  body.set(province, PROVINCE);
  body.set(language, LANGUAGE);
  if (button) body.set(button, 'Buscar');
  // Only people currently entitled to work, which is what the FCDO's own instructions say to tick.
  if (active) body.set(active, 'on');

  const res = await fetch(URL_PAGE, {
    method: 'POST',
    headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie, Referer: URL_PAGE },
    body: body.toString(),
    redirect: 'follow',
  });
  const out = await res.text();
  fs.writeFileSync(OUT, out);
  const rows = (out.match(/<tr/g) || []).length;
  console.log(PROVINCE + ' / ' + LANGUAGE + ': ' + res.status + ', ' + out.length + ' bytes, ' + rows + ' table rows');
})();

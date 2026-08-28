/**
 * Stops a generator from silently deleting work it does not know about.
 *
 * The generators in this repo write whole pages, but almost every page has since been
 * through sweeps the generators were never updated for: analytics and the consent banner,
 * the brand-graph JSON-LD, the Tools dropdown and nav search, affiliate tracking, the city
 * TOC, the facts panel, and so on. A generator that predates a sweep will happily overwrite
 * the result, and because the page still looks fine, nobody notices.
 *
 * That is not hypothetical. On 2026-08-11 a plain run of generate_core_pages.cjs wiped GA4,
 * the cookie banner, Travelpayouts, the brand graph, the nav search and the Tools dropdown
 * off six core pages at once.
 *
 * So: require this at the top of any script that writes .html, and it compares the outgoing
 * markup against what is already on disk. If a tracked feature is present in the old file and
 * missing from the new one, the write is refused and the script exits non-zero, naming what
 * would have been lost. Pass --force to overwrite on purpose.
 *
 * The check reads the current file rather than a whitelist of templates, so it keeps working
 * when the next sweep adds something nobody remembered to list here.
 */
const fs = require('fs');
const path = require('path');

const FEATURES = [
  ['GA4 + Consent Mode', 'G-JV1BMRJF89'],
  ['Cookie-Banner', 'cookie-consent'],
  ['Brand-Graph JSON-LD', '#organization'],
  ['Tools-Dropdown', 'nav-drop-menu'],
  ['Nav-Suche', 'nav-search'],
  ['Travelpayouts', 'tp-em.com'],
  ['Skip-Link', 'skip-link'],
  ['Affiliate-Tracking', 'affiliate_click'],
  ['Cookie-Consent-Skript', 'nomadhq_consent'],
  ['Stadt-Inhaltsverzeichnis', 'city-toc'],
  ['Fakten-Panel', 'facts-panel'],
  ['YMYL-Hinweis', 'ymyl-note'],
];

const FORCE = process.argv.includes('--force');
const realWrite = fs.writeFileSync;

fs.writeFileSync = function (file, data, ...rest) {
  const name = String(file);
  if (typeof data === 'string' && /\.html$/i.test(name) && fs.existsSync(name)) {
    let old = '';
    try { old = realWrite === null ? '' : fs.readFileSync(name, 'utf8'); } catch { old = ''; }
    const lost = FEATURES.filter(([, needle]) => old.includes(needle) && !data.includes(needle));
    if (lost.length && !FORCE) {
      console.error('');
      console.error('ABBRUCH beim Schreiben von ' + path.relative(process.cwd(), name));
      console.error('Diese Vorlage ist aelter als die Seite und wuerde entfernen:');
      lost.forEach(([label]) => console.error('  - ' + label));
      console.error('');
      console.error('Vorlage erst aktualisieren. Bewusstes Ueberschreiben: --force');
      process.exit(1);
    }
  }
  return realWrite.call(fs, file, data, ...rest);
};

module.exports = { FEATURES };

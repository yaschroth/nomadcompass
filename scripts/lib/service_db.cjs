/**
 * Loads the provider data with its sources put back together.
 *
 * data/service-languages.json holds one row per provider and names its source by id.
 * data/service-sources.json holds one record per source: the URL, who publishes it, and the
 * sentence every row of that source repeats. Storing that sentence once took 568KB off a 3.7MB
 * file, and the point of it is the next thirty thousand rows.
 *
 * Every reader goes through here, so nothing downstream needs to know the data is split: a row
 * comes back with a sourceUrl and a whole note, exactly as before. Two scripts used to read the
 * JSON directly and both broke the moment the split landed, which is the reason this file exists
 * rather than the same six lines in three places.
 *
 * Usage: const { db, sources } = require('./lib/service_db.cjs');
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function load() {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
  const f = path.join(ROOT, 'data', 'service-sources.json');
  const sources = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};

  const missing = new Set();
  db.providers.forEach((p) => {
    if (!p.source || p.sourceUrl) return;
    const s = sources[p.source];
    if (!s) { missing.add(p.source); return; }
    p.sourceUrl = s.url;
    p.note = (s.notePrefix || '') + (p.note || '') + (s.noteSuffix || '');
  });
  if (missing.size) {
    console.error('REFUSED: ' + missing.size + ' source id(s) named by rows are not in data/service-sources.json: '
      + [...missing].slice(0, 3).join(', '));
    process.exit(1);
  }
  return { db, sources };
}

module.exports = load();
module.exports.load = load;

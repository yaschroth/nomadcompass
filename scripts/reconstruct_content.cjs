require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * One-off: rebuilds content-<key>.json from an already-built best/<slug>.html for the
 * legacy ranking pages whose source prose was never kept in the repo. Makes the whole
 * ranking system reproducible so rebuild_rankings.cjs can regenerate every page.
 * Usage: node scripts/reconstruct_content.cjs            (all legacy keys below)
 *        node scripts/reconstruct_content.cjs cost wifi   (specific keys)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.DIR || ROOT;

const LEGACY = {
  cost: 'cheapest-cities-for-digital-nomads',
  wifi: 'best-cities-for-fast-wifi',
  safety: 'safest-cities-for-digital-nomads',
  climate: 'best-cities-for-year-round-weather',
  visa: 'best-cities-for-digital-nomad-visas',
  food: 'best-cities-for-food',
  nature: 'best-cities-for-nature-and-outdoors',
  community: 'best-cities-for-nomad-community',
  nightlife: 'best-cities-for-nightlife',
  english: 'best-cities-for-english-speakers',
  overall: 'best-all-round-cities-for-digital-nomads',
};

const unent = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rsquo;/g, '’')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&ndash;/g, '–').replace(/&rarr;/g, '→');
const strip = (s) => unent(String(s || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const idFrom = (href) => { const m = href.match(/\/cities\/([a-z0-9-]+)/i); return m ? m[1] : null; };

function reconstruct(key, slug) {
  const hp = path.join(ROOT, 'best', slug + '.html');
  if (!fs.existsSync(hp)) { console.error('skip (no html):', slug); return; }
  const h = fs.readFileSync(hp, 'utf8');
  const g = (re) => { const m = h.match(re); return m ? m[1] : ''; };

  const metaTitle = strip(g(/<title>([\s\S]*?)<\/title>/)).replace(/\s*\|\s*The Nomad HQ\s*$/, '');
  const metaDescription = unent(g(/name="description" content="([^"]*)"/));
  const heroSubtitle = strip(g(/class="sub">([\s\S]*?)<\/p>/));

  // intro paragraphs (everything in .best-intro before .best-method)
  const introBlock = g(/class="best-intro">([\s\S]*?)<p class="best-method"/);
  const intro = (introBlock.match(/<p>([\s\S]*?)<\/p>/g) || []).map(strip).filter(Boolean).join('\n\n');
  // methodology = .best-method minus the appended "Explore the numbers..." sentence
  let methodology = strip(g(/class="best-method">([\s\S]*?)<\/p>/));
  methodology = methodology.replace(/\s*Explore the numbers yourself on the comparison tool[\s\S]*$/, '').trim();

  // quick picks
  const quickPicks = [];
  const pickRe = /<a class="best-pick" href="\/cities\/([a-z0-9-]+)">[\s\S]*?class="best-pick-label">([\s\S]*?)<\/span>[\s\S]*?class="best-pick-note">([\s\S]*?)<\/p>/g;
  let pm; while ((pm = pickRe.exec(h))) quickPicks.push({ id: pm[1], label: strip(pm[2]), note: strip(pm[3]) });

  // considerations (.best-weigh paragraphs)
  const weighBlock = g(/class="best-weigh">([\s\S]*?)<\/section>/);
  const considerations = (weighBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || []).map(strip).filter(Boolean).join('\n\n');

  // ranked entries: split into per-item blocks, then pull id + blurb from each
  const entries = [];
  const blocks = h.split(/<li class="best-item/).slice(1);
  for (const b of blocks) {
    const idm = b.match(/class="best-name"><a href="\/cities\/([a-z0-9-]+)"/);
    if (!idm) continue;
    const bm = b.match(/class="best-blurb">([\s\S]*?)<\/p>/);
    entries.push({ id: idm[1], blurb: strip(bm ? bm[1] : '') });
  }

  // closing
  const closeBlock = g(/class="best-closing">([\s\S]*?)<\/section>/);
  const closing = (closeBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || []).map(strip).filter(Boolean).join('\n\n');

  // faq
  const faq = [];
  const faqRe = /class="best-faq-q">([\s\S]*?)<\/h3><p class="best-faq-a">([\s\S]*?)<\/p>/g;
  let fm; while ((fm = faqRe.exec(h))) faq.push({ q: strip(fm[1]), a: strip(fm[2]) });

  const content = { metaTitle, metaDescription, heroSubtitle, intro, methodology, quickPicks, considerations, entries, closing, faq };
  fs.writeFileSync(path.join(OUT, 'content-' + key + '.json'), JSON.stringify(content, null, 2));
  console.log(`content-${key}.json  (intro ${intro.split('\\n\\n').length}p, ${quickPicks.length} picks, ${entries.length} entries, ${faq.length} FAQ)`);
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LEGACY);
for (const k of keys) { if (LEGACY[k]) reconstruct(k, LEGACY[k]); else console.error('unknown legacy key:', k); }

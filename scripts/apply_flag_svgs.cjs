/**
 * Replaces flag EMOJI (which fall back to letters like "BE"/"PY" on Windows) with
 * self-hosted SVG flags in assets/flags/<iso>.svg. Touches:
 *   - cities-data.js: adds a global flagSvg(emoji) helper (loaded everywhere flags render)
 *   - styles/base.css: adds the .flag-img rule
 *   - index.html: homepage city-card flag -> flagSvg(city.flag)
 *   - cities/*.html: hero flag (static) -> <img>, and the related-cities JS -> flagSvg(r.flag)
 * (cities.html hub is handled by its generator.) Idempotent.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const fn = new Function('module', code + '\n;module.exports = CITIES;');
const m = {}; fn(m);
const byId = new Map(m.exports.map((c) => [c.id, c]));

const toCode = (emoji) => {
  const pts = [...(emoji || '')];
  if (pts.length !== 2) return null;
  return pts.map((p) => String.fromCharCode(p.codePointAt(0) - 0x1f1e6 + 97)).join('');
};
const imgTag = (code, alt) => `<img class="flag-img" src="/assets/flags/${code}.svg" alt="${alt}" loading="lazy">`;

// 1. cities-data.js helper
{
  const p = path.join(ROOT, 'cities-data.js');
  let s = fs.readFileSync(p, 'utf8');
  if (!/function flagSvg/.test(s)) {
    s += `\n\n// Render a country flag emoji as a self-hosted SVG <img> (consistent across platforms).\n` +
      `function flagSvg(emoji){\n` +
      `  if(!emoji) return '';\n` +
      `  const pts=[...emoji];\n` +
      `  if(pts.length!==2) return emoji;\n` +
      `  const code=pts.map(p=>String.fromCharCode(p.codePointAt(0)-0x1F1E6+97)).join('');\n` +
      `  return '<img class="flag-img" src="/assets/flags/'+code+'.svg" alt="" loading="lazy">';\n` +
      `}\n`;
    fs.writeFileSync(p, s);
    console.log('cities-data.js: flagSvg helper added');
  } else console.log('cities-data.js: helper already present');
}

// 2. base.css rule
{
  const p = path.join(ROOT, 'styles', 'base.css');
  let s = fs.readFileSync(p, 'utf8');
  if (!/\.flag-img\b/.test(s)) {
    s += `\n\n/* Self-hosted country flag SVGs (emoji fall back to letters like "BE" on Windows). */\n` +
      `.flag-img {\n  display: inline-block;\n  width: 1.33em;\n  height: auto;\n  vertical-align: middle;\n  border-radius: 2px;\n  box-shadow: 0 0 0 .5px rgba(0,0,0,.12);\n}\n`;
    fs.writeFileSync(p, s);
    console.log('base.css: .flag-img added');
  } else console.log('base.css: .flag-img already present');
}

// 3. index.html homepage card flag
{
  const p = path.join(ROOT, 'index.html');
  let s = fs.readFileSync(p, 'utf8');
  const b = s;
  s = s.split('<span class="city-card-flag">${city.flag}</span>').join('<span class="city-card-flag">${flagSvg(city.flag)}</span>');
  if (s !== b) { fs.writeFileSync(p, s); console.log('index.html: homepage card flag -> flagSvg'); }
  else console.log('index.html: already done');
}

// 4. city pages: hero (static) + related-cities JS
let updated = 0, heroDone = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  const c = byId.get(slug);
  if (!c) continue;
  const abs = path.join(ROOT, 'cities', f);
  let s = fs.readFileSync(abs, 'utf8');
  const b = s;
  const fcode = toCode(c.flag);
  if (fcode) {
    s = s.replace(/<div class="city-hero-flag">[^<]*<\/div>/, `<div class="city-hero-flag">${imgTag(fcode, ((c.country || '') + ' flag').trim())}</div>`);
  }
  s = s.split('<span class="city-card-flag">${r.flag}</span>').join('<span class="city-card-flag">${flagSvg(r.flag)}</span>');
  if (s !== b) {
    fs.writeFileSync(abs, s);
    updated++;
    if (/<div class="city-hero-flag"><img/.test(s)) heroDone++;
  }
}
console.log(`city pages updated: ${updated} (hero img set: ${heroDone})`);

// 5. wheel.html result cards: dynamic flag emoji -> flagSvg() (cities-data.js is loaded there)
{
  const p = path.join(ROOT, 'wheel.html');
  let s = fs.readFileSync(p, 'utf8');
  const b = s;
  s = s.split('<span class="city-card-flag">${city.flag}</span>')
       .join('<span class="city-card-flag">${flagSvg(city.flag)}</span>');
  if (s !== b) { fs.writeFileSync(p, s); console.log('wheel.html: result-card flag -> flagSvg'); }
  else console.log('wheel.html: already done');
}

// 6. blog.html featured-city cards: static flag emoji -> self-hosted <img>
{
  const p = path.join(ROOT, 'blog.html');
  let s = fs.readFileSync(p, 'utf8');
  const b = s;
  for (const [emoji, alt] of [['🇵🇹', 'Portugal'], ['🇹🇭', 'Thailand'], ['🇨🇴', 'Colombia'], ['🇬🇪', 'Georgia'], ['🇲🇽', 'Mexico']]) {
    const code = toCode(emoji);
    if (code) s = s.split(`<span class="flag">${emoji}</span>`).join(`<span class="flag">${imgTag(code, alt + ' flag')}</span>`);
  }
  if (s !== b) { fs.writeFileSync(p, s); console.log('blog.html: featured flags -> <img>'); }
  else console.log('blog.html: already done');
}

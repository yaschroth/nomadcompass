/**
 * Builds a "Best cities for X" landing page at best/<slug>.html from:
 *   - best-<key>.json     (accurate ranked data, from rank_best.cjs)
 *   - content-<key>.json  (unique prose written by an agent)
 * Rich structure: hero, multi-paragraph intro, quick picks, "what to weigh", ranked
 * cards with sub-score chips + long blurbs, closing, FAQ, related. ItemList + FAQPage
 * JSON-LD, self-hosted flags + thumbnails, links to each guide + /compare.
 * Usage: DIR=... node scripts/apply_best_page.cjs <key> [<key> ...]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.DIR || ROOT;
const OUTDIR = path.join(ROOT, 'best');
const BASE = 'https://thenomadhq.com';

const CHIP = { cost: 'Affordability', wifi: 'WiFi', safety: 'Safety', climate: 'Climate', visa: 'Visa access', food: 'Food', nature: 'Nature', community: 'Community', nightlife: 'Nightlife', english: 'English' };
const SHORT = { climate: 'Climate', cost: 'Value', wifi: 'WiFi', nightlife: 'Nightlife', nature: 'Nature', safety: 'Safety', food: 'Food', community: 'Community', english: 'English', visa: 'Visa', culture: 'Culture', cleanliness: 'Clean', airquality: 'Air' };
// contextual sub-scores shown on each card (minus the page's own metric)
const CONTEXT = ['safety', 'wifi', 'cost', 'community', 'climate'];

// short labels for the grouped "More rankings" chips (geo pages derive their label from the h1)
const RLBL = {
  overall: 'All-round', value: 'Best value', cost: 'Cheapest', wifi: 'Fast WiFi', safety: 'Safest',
  climate: 'Year-round weather', visa: 'Nomad visas', food: 'Food', nature: 'Nature & outdoors',
  community: 'Nomad community', nightlife: 'Nightlife', english: 'English-speaking',
  female: 'Female nomads', broke: 'Tight budget', beginner: 'First-timers', families: 'Families', party: 'Party scene',
};
const relShort = (r) => (r.key.startsWith('region_') || r.key.startsWith('country_'))
  ? r.h1.replace(/^Best Digital Nomad Cities in (the )?/, '') : (RLBL[r.key] || r.h1);
const relGroup = (r) => r.key.startsWith('region_') ? 'region' : r.key.startsWith('country_') ? 'country' : 'priority';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const txt = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (v) => typeof v === 'number' ? '$' + v.toLocaleString('en-US') + '/mo' : '';
const flag = (iso) => iso ? '/assets/flags/' + iso + '.svg' : '';
const paras = (s) => String(s || '').split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

function navHtml() {
  return `<nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
        <li><a href="/best" class="nav-link active">Rankings</a></li>
        <li><a href="/tier-list" class="nav-link">Tier List</a></li>
        <li><a href="/compare" class="nav-link">Compare</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions"><a href="/login" class="nav-login">Login</a><a href="/signup" class="btn btn-primary nav-signup">Sign Up</a></div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="/" class="nav-mobile-link">Home</a></li>
        <li><a href="/wheel" class="nav-mobile-link">Wheel</a></li>
        <li><a href="/cities" class="nav-mobile-link">Cities</a></li>
        <li><a href="/best" class="nav-mobile-link active">Rankings</a></li>
        <li><a href="/tier-list" class="nav-mobile-link">Tier List</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div>
    </div>
  </nav>`;
}
function footerHtml() {
  return `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li><li><a href="/activities" class="footer-link">By Activity</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
}
function navScript() {
  return `<script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}

const CSS = `
  .best-hero { position: relative; width: 100%; min-height: 100vh; display: flex; align-items: flex-end; overflow: hidden; }
  .best-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .best-hero-overlay { position: relative; z-index: 1; width: 100%; padding: calc(var(--nav-height,64px) + 2rem) 0 3.5rem; background: linear-gradient(to top, rgba(15,23,42,.95) 0%, rgba(15,23,42,.72) 50%, rgba(15,23,42,.2) 80%, transparent 100%); color: #fff; }
  .best-hero::before { content:''; position:absolute; top:0; left:0; right:0; height: calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background: linear-gradient(to bottom, rgba(255,255,255,.82), rgba(255,255,255,.45) 55%, transparent); }
  .best-hero .container { max-width: 940px; }
  .best-eyebrow { display:inline-block; font-size: var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .85rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
  .best-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.2rem,6vw,3.75rem); line-height:1.08; margin:0 0 1.05rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; max-width:860px; }
  .best-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0 0 1.6rem; max-width:52ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
  .best-hero .btn-ghost { color:#fff; border:1px solid rgba(255,255,255,.45); background:rgba(255,255,255,.08); }
  .best-hero .btn-ghost:hover { background:rgba(255,255,255,.18); border-color:#fff; }
  .best-body { max-width: 940px; margin: 0 auto; padding: 0 var(--space-4,1rem); }
  .crumbs { display:flex; flex-wrap:wrap; align-items:center; gap:.4rem; font-size:.82rem; color:var(--color-stone); padding:1.1rem 0 0; }
  .crumbs a { color:var(--color-terracotta); text-decoration:none; font-weight:600; }
  .crumbs a:hover { text-decoration:underline; }
  .crumbs span { color:var(--color-sand-dark); }
  .crumbs span[aria-current] { color:var(--color-charcoal); font-weight:600; }
  .best-intro { padding: 1.75rem 0 .5rem; }
  .best-intro p { font-size:var(--text-lg); line-height:1.78; color:var(--color-charcoal); margin:0 0 1.15rem; }
  .best-method { font-size:var(--text-sm); color:var(--color-stone); line-height:1.6; border-left:3px solid var(--color-terracotta); padding:.4rem 0 .4rem 1rem; margin:1.6rem 0 0; background:linear-gradient(90deg, rgba(192,57,43,.05), transparent); }
  .best-method a { color:var(--color-terracotta); font-weight:600; }

  .best-picks { margin: 2.75rem 0 .5rem; }
  .best-h2 { font-family:'DM Serif Display',serif; font-size:1.85rem; color:var(--color-ink); margin:0 0 1.3rem; }
  .best-picks-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
  .best-pick { display:block; text-decoration:none; padding:1.1rem 1.2rem 1.2rem; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:var(--radius-lg,14px); transition:border-color .15s, transform .15s; }
  .best-pick:hover { border-color:var(--color-terracotta); transform:translateY(-2px); }
  .best-pick-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--color-terracotta); }
  .best-pick-city { display:flex; align-items:center; gap:.5rem; font-family:'DM Serif Display',serif; font-size:1.3rem; color:var(--color-ink); margin:.4rem 0 .35rem; }
  .best-pick-city img { width:24px; height:18px; border-radius:3px; box-shadow:0 0 0 1px rgba(0,0,0,.1); }
  .best-pick-note { font-size:var(--text-sm); color:var(--color-charcoal); line-height:1.5; margin:0; }

  .best-weigh { padding: 2.75rem 0 .5rem; }
  .best-weigh p { font-size:var(--text-base); line-height:1.75; color:var(--color-charcoal); margin:0 0 1rem; }

  .best-listwrap { padding: 2.75rem 0 .5rem; }
  .best-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:1.15rem; counter-reset:rank; }
  .best-item { position:relative; display:grid; grid-template-columns:64px 150px 1fr; gap:1.2rem; align-items:stretch; background:#fff; border:1px solid var(--color-sand-dark); border-radius:var(--radius-lg,14px); overflow:hidden; transition:box-shadow .15s, border-color .15s, transform .15s; }
  .best-item:hover { box-shadow:0 12px 30px rgba(15,23,42,.09); border-color:#c9d6e8; transform:translateY(-2px); }
  .best-rank { display:flex; align-items:center; justify-content:center; background:linear-gradient(160deg, #1b2a44, #0f172a); }
  .best-rank span { font-family:'DM Serif Display',serif; font-size:1.7rem; color:#fff; }
  .best-item.top1 .best-rank { background:linear-gradient(160deg,#e0674f,#c0392b); }
  .best-item.top2 .best-rank, .best-item.top3 .best-rank { background:linear-gradient(160deg,#334155,#1b2a44); }
  .best-thumb { width:150px; height:100%; min-height:150px; object-fit:cover; background:var(--color-sand); }
  .best-main { padding:1.15rem 1.35rem 1.25rem 0; display:flex; flex-direction:column; gap:.55rem; }
  .best-head { display:flex; align-items:baseline; gap:.55rem; flex-wrap:wrap; }
  .best-flag { width:27px; height:20px; border-radius:3px; object-fit:cover; box-shadow:0 0 0 1px rgba(0,0,0,.1); align-self:center; }
  .best-name { font-family:'DM Serif Display',serif; font-size:1.5rem; line-height:1.05; margin:0; }
  .best-name a { color:var(--color-ink); text-decoration:none; }
  .best-name a:hover { color:var(--color-terracotta); }
  .best-country { color:var(--color-stone); font-size:var(--text-sm); }
  .best-stats { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }
  .best-stat { font-size:12px; font-weight:600; color:var(--color-charcoal); background:var(--color-sand); border-radius:999px; padding:3px 10px; font-variant-numeric:tabular-nums; }
  .best-stat.hi { background:var(--color-terracotta); color:#fff; }
  .best-stat.nomad { background:rgba(192,57,43,.1); color:var(--color-terracotta); }
  .best-sub { display:flex; flex-wrap:wrap; gap:.75rem; margin:.1rem 0; }
  .best-subchip { display:flex; align-items:center; gap:.3rem; font-size:11.5px; color:var(--color-stone); font-variant-numeric:tabular-nums; }
  .best-subchip b { color:var(--color-charcoal); font-weight:700; }
  .best-subbar { width:34px; height:5px; border-radius:999px; background:var(--color-sand-dark); overflow:hidden; }
  .best-subbar span { display:block; height:100%; background:#94a3b8; border-radius:999px; }
  .best-blurb { font-size:var(--text-base); line-height:1.68; color:var(--color-charcoal); margin:.15rem 0 0; }
  .best-links { display:flex; gap:1.1rem; margin-top:.35rem; }
  .best-links a { font-size:var(--text-sm); font-weight:600; color:var(--color-terracotta); text-decoration:none; }
  .best-links a:hover { text-decoration:underline; }

  .best-closing { padding: 2.75rem 0 .5rem; }
  .best-closing p { font-size:var(--text-lg); line-height:1.78; color:var(--color-charcoal); margin:0 0 1.1rem; }
  .best-faq { padding: 2.75rem 0 1rem; }
  .best-faq-q { font-size:var(--text-lg); font-weight:600; color:var(--color-ink); margin:1.5rem 0 .4rem; }
  .best-faq-a { font-size:var(--text-base); line-height:1.72; color:var(--color-charcoal); margin:0; }
  .best-related { padding: 2.25rem 0 1rem; }
  .best-related-group { margin-bottom: 1.6rem; }
  .best-related-group h3 { font-size: 12px; text-transform: uppercase; letter-spacing:.09em; color:var(--color-stone); font-weight:700; margin:0 0 .8rem; }
  .best-related-tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(184px,1fr)); gap:.75rem; }
  .best-rel-tile { position:relative; display:block; height:118px; border-radius:12px; overflow:hidden; text-decoration:none; background:#0f172a; box-shadow:0 2px 8px rgba(15,23,42,.1); transition:transform .18s ease, box-shadow .18s ease; }
  .best-rel-tile:hover { transform:translateY(-2px); box-shadow:0 12px 24px rgba(15,23,42,.2); }
  .best-rel-tile:focus-visible { outline:3px solid var(--color-terracotta); outline-offset:2px; }
  .best-rel-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .45s ease; }
  .best-rel-tile:hover .best-rel-img { transform:scale(1.07); }
  .best-rel-scrim { position:absolute; inset:0; background:linear-gradient(180deg, rgba(15,23,42,.12) 0%, rgba(15,23,42,0) 38%, rgba(15,23,42,.82) 100%); }
  .best-rel-label { position:absolute; left:.75rem; right:.75rem; bottom:.6rem; z-index:2; color:#fff; font-weight:700; font-size:.98rem; line-height:1.18; text-shadow:0 1px 5px rgba(0,0,0,.6); }
  @media (prefers-reduced-motion:reduce){ .best-rel-tile, .best-rel-img { transition:none; } }
  .best-cta { text-align:center; padding: 2.5rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
  @media (max-width:640px){ .best-item{ grid-template-columns:52px 1fr; } .best-thumb{ display:none; } .best-main{ padding:1rem 1.1rem; } .best-picks-grid{ grid-template-columns:1fr; } .best-rank span{ font-size:1.4rem; } }
`;

function build(key, related) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, 'best-' + key + '.json'), 'utf8'));
  const content = JSON.parse(fs.readFileSync(path.join(DIR, 'content-' + key + '.json'), 'utf8').replace(/^﻿/, ''));
  const byId = {}; data.cities.forEach((c) => { byId[c.id] = c; });
  const blurbById = {}; (content.entries || []).forEach((e) => { blurbById[e.id] = e.blurb; });
  const top = data.cities[0];
  const url = BASE + '/best/' + data.slug;
  const chipLabel = CHIP[data.metric] || 'Score';
  const ctx = CONTEXT.filter((k) => k !== data.metric).slice(0, 3);

  const items = data.cities.map((c) => {
    // Fall back to the city's tagline so a city added later (before its blurb is written) still renders.
    const blurb = blurbById[c.id] || c.tagline || '';
    const metricStat = data.metric === 'cost'
      ? `<span class="best-stat hi">${esc(money(c.costPerMonth))}</span>`
      : data.metric === 'overall'
      ? `<span class="best-stat hi">Nomad Score ${c.nomadScore}</span>`
      : data.metric === 'match'
      ? `<span class="best-stat hi">Match ${c.metricScore}/10</span>`
      : data.metric === 'value'
      ? `<span class="best-stat hi">Value ${c.metricScore}</span>`
      : `<span class="best-stat hi">${esc(chipLabel)} ${c.metricScore}/10</span>`;
    const nomadStat = data.metric === 'overall' ? '' : `<span class="best-stat nomad">Nomad Score ${c.nomadScore}</span>`;
    const budgetStat = data.metric !== 'cost' ? `<span class="best-stat">${esc(money(c.costPerMonth))}</span>` : '';
    const subs = ctx.map((k) => {
      const v = c.scores[k]; if (typeof v !== 'number') return '';
      return `<span class="best-subchip">${esc(SHORT[k] || k)} <b>${v}</b><span class="best-subbar"><span style="width:${v * 10}%"></span></span></span>`;
    }).join('');
    const cls = c.rank <= 3 ? ' top' + c.rank : '';
    return `        <li class="best-item${cls}">
          <div class="best-rank"><span>${c.rank}</span></div>
          <img class="best-thumb" src="/images/cities/${c.id}-card.webp" alt="${esc(c.name)}" loading="lazy" onerror="this.style.display='none'">
          <div class="best-main">
            <div class="best-head"><img class="best-flag" src="${flag(c.iso)}" alt="" width="27" height="20"><h2 class="best-name"><a href="/cities/${c.id}">${esc(c.name)}</a></h2><span class="best-country">${esc(c.country)}</span></div>
            <div class="best-stats">${metricStat}${nomadStat}${budgetStat}</div>
            <div class="best-sub">${subs}</div>
            ${blurb ? `<p class="best-blurb">${txt(blurb)}</p>` : ''}
            <div class="best-links"><a href="/cities/${c.id}">Full guide &rarr;</a><a href="/compare?a=${c.id}">Compare &rarr;</a></div>
          </div>
        </li>`;
  }).join('\n');

  const introHtml = paras(content.intro).map((p) => `<p>${txt(p)}</p>`).join('\n        ');
  const weighHtml = paras(content.considerations).map((p) => `<p>${txt(p)}</p>`).join('\n        ');
  const closeHtml = paras(content.closing).map((p) => `<p>${txt(p)}</p>`).join('\n        ');
  const picks = (content.quickPicks || []).filter((p) => byId[p.id]).map((p) => {
    const c = byId[p.id];
    return `          <a class="best-pick" href="/cities/${c.id}"><span class="best-pick-label">${esc(p.label)}</span><span class="best-pick-city"><img src="${flag(c.iso)}" alt="" width="24" height="18">${esc(c.name)}</span><p class="best-pick-note">${txt(p.note)}</p></a>`;
  }).join('\n');
  const faqHtml = (content.faq || []).map((f) => `        <div><h3 class="best-faq-q">${txt(f.q)}</h3><p class="best-faq-a">${txt(f.a)}</p></div>`).join('\n');
  const relGroups = { priority: [], region: [], country: [] };
  related.filter((r) => r.key !== key).forEach((r) => relGroups[relGroup(r)].push(r));
  const relTile = (r) => `<a class="best-rel-tile" href="/best/${r.slug}" aria-label="${esc(r.h1)}"><img class="best-rel-img" src="/images/cities/${r.top}.webp" alt="" loading="lazy" onerror="this.style.display='none'"><span class="best-rel-scrim"></span><span class="best-rel-label">${esc(relShort(r))}</span></a>`;
  const relBlock = (title, arr) => arr.length ? `<div class="best-related-group"><h3>${title}</h3><div class="best-related-tiles">${arr.map(relTile).join('')}</div></div>` : '';
  const relatedHtml = relBlock('By priority', relGroups.priority) + '\n        ' + relBlock('By region', relGroups.region) + '\n        ' + relBlock('By country', relGroups.country);

  const itemListLd = { '@context': 'https://schema.org', '@type': 'ItemList', name: esc(data.h1), itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: data.cities.length,
    itemListElement: data.cities.map((c) => ({ '@type': 'ListItem', position: c.rank, url: BASE + '/cities/' + c.id, name: c.name })) };
  const faqLd = (content.faq && content.faq.length) ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const crumbs = [['Home', BASE + '/'], ['Rankings', BASE + '/best'], [data.h1, url]];
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };
  const crumbHtml = `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1].replace(BASE, '')}">${esc(c[0])}</a><span>/</span>` : `<span aria-current="page">${esc(c[0])}</span>`).join('')}</nav>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(content.metaTitle || data.h1)} | The Nomad HQ</title>
  <meta name="description" content="${esc(content.metaDescription || '')}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(content.metaTitle || data.h1)} | The Nomad HQ">
  <meta property="og:description" content="${esc(content.metaDescription || '')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/images/og/${top.id}.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(content.metaTitle || data.h1)}">
  <meta name="twitter:image" content="${BASE}/images/og/${top.id}.jpg">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="../styles/base.css">
  <link rel="stylesheet" href="../styles/nav.css">
  <link rel="stylesheet" href="../styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  ${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : ''}
  <style>${CSS}</style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="best-hero">
      <img class="best-hero-img" src="/images/cities/${top.id}.webp" alt="${esc(top.name)}, ${esc(top.country)}" fetchpriority="high">
      <div class="best-hero-overlay"><div class="container">
        <span class="best-eyebrow">The Nomad HQ City Index</span>
        <h1>${esc(data.h1)}</h1>
        <p class="sub">${esc(content.heroSubtitle || '')}</p>
        <a href="#ranking" class="btn btn-lg btn-ghost">See the ranking &darr;</a>
      </div></div>
    </header>
    <div class="best-body">
      ${crumbHtml}
      <section class="best-intro">
        ${introHtml}
        <p class="best-method">${txt(content.methodology || '')} Explore the numbers yourself on the <a href="/compare">comparison tool</a> or <a href="/cities">browse all 410 city guides</a>.</p>
      </section>

      ${picks ? `<section class="best-picks"><h2 class="best-h2">At a glance</h2><div class="best-picks-grid">\n${picks}\n        </div></section>` : ''}

      ${weighHtml ? `<section class="best-weigh"><h2 class="best-h2">What to weigh before you book</h2>\n        ${weighHtml}\n      </section>` : ''}

      <section class="best-listwrap" id="ranking">
        <h2 class="best-h2">The ranking</h2>
        <ol class="best-list">
${items}
        </ol>
      </section>

      ${closeHtml ? `<section class="best-closing">\n        ${closeHtml}\n      </section>` : ''}

      ${(content.faq && content.faq.length) ? `<section class="best-faq"><h2 class="best-h2">Frequently asked questions</h2>\n${faqHtml}\n      </section>` : ''}

      <section class="best-related"><h2 class="best-h2">More nomad city rankings</h2>
        ${relatedHtml}
      </section>

      <div class="best-cta">
        <a href="/compare" class="btn btn-primary btn-lg">Compare these cities &rarr;</a>
        <a href="/cities" class="btn btn-secondary btn-lg">Browse all city guides</a>
      </div>
    </div>
  </main>
  ${footerHtml()}
  ${navScript()}
</body>
</html>
`;
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(path.join(OUTDIR, data.slug + '.html'), html);
  console.log(`best/${data.slug}.html  (${data.cities.length} cities, ${content.entries ? content.entries.length : 0} blurbs, ${content.quickPicks ? content.quickPicks.length : 0} picks, ${content.faq ? content.faq.length : 0} FAQ)`);
}

const allKeys = fs.readdirSync(DIR).filter((f) => /^best-.+\.json$/.test(f)).map((f) => f.replace(/^best-|\.json$/g, ''));
const related = allKeys.map((k) => { const d = JSON.parse(fs.readFileSync(path.join(DIR, 'best-' + k + '.json'), 'utf8')); return { key: k, slug: d.slug, h1: d.h1, top: d.cities[0] && d.cities[0].id }; });
const keys = process.argv.slice(2);
for (const k of keys) build(k, related);

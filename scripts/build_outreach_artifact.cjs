/**
 * Rebuilds the private Backlink-Pipeline artifact from its last published version.
 *
 * The artifact is one 1.1 MB HTML file: the catalogue is a JSON blob inside it and the tool around
 * it is a few hundred lines of plain JS. Two things change independently. The catalogue changes
 * whenever a harvest runs, and the tool changes when it grows a feature. Re-typing either by hand
 * is how a working tool gets broken, so this does both mechanically:
 *
 *   1. swaps the embedded payload for the current data/outreach-payload.json
 *   2. applies the channel patches below, each of which asserts its anchor exists
 *
 * Every patch is anchored on an exact string from the published file and throws if it is missing,
 * so a version that has drifted fails loudly here instead of publishing something half-patched.
 *
 * Usage:
 *   node scripts/build_outreach_artifact.cjs <published.html> [out.html]
 *
 * The input is the artifact as last published, which the Artifact read tool saves to disk. The
 * output is what gets published back. Neither is committed: the file carries every contact address
 * we hold, and data/outreach-*.json is gitignored for exactly that reason.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2];
const OUT = process.argv[3] || (SRC && SRC.replace(/\.html$/, '.patched.html'));

if (!SRC || !fs.existsSync(SRC)) {
  console.error('usage: node scripts/build_outreach_artifact.cjs <published.html> [out.html]');
  process.exit(1);
}

let html = fs.readFileSync(SRC, 'utf8');
const before = html.length;

/** Replace exactly once, and say so loudly when the anchor has moved. */
function patch(label, find, replace) {
  const i = html.indexOf(find);
  if (i < 0) throw new Error(`anchor not found for "${label}". The published file has drifted.`);
  if (html.indexOf(find, i + find.length) >= 0) throw new Error(`anchor for "${label}" is not unique.`);
  html = html.slice(0, i) + replace + html.slice(i + find.length);
}

// ---- 1. the catalogue -------------------------------------------------------
const payload = fs.readFileSync(path.join(ROOT, 'data', 'outreach-payload.json'), 'utf8');
const OPEN = '<script type="application/json" id="payload">';
const a = html.indexOf(OPEN);
if (a < 0) throw new Error('payload block not found');
const b = html.indexOf('</script>', a);
html = html.slice(0, a + OPEN.length) + payload + html.slice(b);
console.log(`payload swapped: ${(payload.length / 1024).toFixed(0)} KB`);

// ---- 2. styles for the channel block ---------------------------------------
patch('channel css', `  @media (max-width:1100px){ .strip{grid-template-columns:repeat(3,1fr)} }`, `  /* The channel block. The primary action in the panel, so it reads as one object rather than as
     more links: a tinted card, the best channel first and largest, the rest as quiet siblings. */
  .chan{display:flex;flex-direction:column;gap:9px;padding:13px;border-radius:var(--r);
        background:var(--accent-soft);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent)}
  .chan-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .chan-why{font-size:12.5px;color:var(--ink-2);margin:0}
  .chan-go{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:var(--r);
           background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:600;
           font-size:13.5px;border:0;cursor:pointer}
  .chan-go:hover{filter:brightness(1.08)}
  .chan-go.wa{background:#1f9d55}
  .chan-alt{display:flex;gap:6px;flex-wrap:wrap}
  .chan-alt a{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:var(--r);
              background:var(--surface);border:1px solid var(--line);color:var(--ink-2);
              text-decoration:none;font-size:12.5px}
  .chan-alt a:hover{border-color:var(--line-2);color:var(--ink)}
  .chan-none{font-size:13px;color:var(--muted)}
  .chip{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
        padding:1px 5px;border-radius:3px;border:1px solid currentColor}
  .chip-whatsapp{color:#1f9d55} .chip-social{color:var(--st-queued)} .chip-email{color:var(--st-sent)}

  @media (max-width:1100px){ .strip{grid-template-columns:repeat(3,1fr)} }`);

// ---- 3. the channel filter --------------------------------------------------
patch('channel filter control',
  `    <select id="fEv"><option value="">Alle Belege</option>`,
  `    <select id="fChan"><option value="">Alle Kontaktwege</option><option value="whatsapp">nur WhatsApp</option><option value="social">nur Social</option><option value="email">nur E-Mail</option><option value="none">ohne Kontaktweg</option></select>
    <select id="fEv"><option value="">Alle Belege</option>`);

// ---- 4. the message, and the helpers that build the block -------------------
patch('wa message + helpers', `  var EVNAME = {'official':'amtlich','self-declared':'selbst angegeben','directory':'Verzeichnis'};`,
  `  var EVNAME = {'official':'amtlich','self-declared':'selbst angegeben','directory':'Verzeichnis'};

  // The WhatsApp opener. Short, because it is a chat and not a letter: who we are, where they are
  // listed, what we would like checked, and how to be taken off. The long mail draft below is the
  // wrong shape for a messenger and gets ignored at that length.
  var WA_MSG = {
    en: function(city,cat,url){ return 'Hello! We run The Nomad HQ, a directory that lists providers by the language they work in. You are listed under ' + cat + ' in ' + city + ':\\n' + url + '\\n\\nThe listing is free and editorial. Could you check it is right: your languages, address and website? If anything is wrong, or you would rather not appear, just reply here and I will correct or remove it.'; },
    de: function(city,cat,url){ return 'Guten Tag! Wir betreiben The Nomad HQ, ein Verzeichnis, das Anbieter nach ihrer Arbeitssprache ordnet. Sie sind unter ' + cat + ' in ' + city + ' gelistet:\\n' + url + '\\n\\nDer Eintrag ist redaktionell und kostenlos. Könnten Sie kurz prüfen, ob er stimmt: Sprachen, Adresse, Website? Falls etwas nicht passt oder Sie nicht erscheinen möchten, genügt eine Antwort hier.'; },
    es: function(city,cat,url){ return '¡Buenos días! Gestionamos The Nomad HQ, un directorio que ordena a los profesionales según el idioma en el que trabajan. Aparecen ustedes en ' + cat + ' en ' + city + ':\\n' + url + '\\n\\nLa ficha es editorial y gratuita. ¿Podrían revisar si es correcta: idiomas, dirección y sitio web? Si algo no es correcto, o prefieren no aparecer, basta con responder aquí.'; },
    fr: function(city,cat,url){ return 'Bonjour ! Nous gérons The Nomad HQ, un annuaire qui classe les prestataires selon la langue dans laquelle ils travaillent. Vous figurez sous ' + cat + ' à ' + city + ' :\\n' + url + '\\n\\nLa fiche est éditoriale et gratuite. Pourriez-vous vérifier qu\\'elle est exacte : langues, adresse, site internet ? Si quelque chose est inexact, ou si vous préférez ne pas y figurer, une réponse ici suffit.'; },
    it: function(city,cat,url){ return 'Buongiorno! Gestiamo The Nomad HQ, una directory che ordina i professionisti in base alla lingua in cui lavorano. Siete elencati alla voce ' + cat + ' a ' + city + ':\\n' + url + '\\n\\nLa scheda è redazionale e gratuita. Potreste verificare che sia corretta: lingue, indirizzo, sito web? Se qualcosa non è corretto, o preferite non comparire, è sufficiente rispondere qui.'; },
    pt: function(city,cat,url){ return 'Bom dia! Gerimos o The Nomad HQ, um diretório que organiza prestadores segundo a língua em que trabalham. Estão listados em ' + cat + ' em ' + city + ':\\n' + url + '\\n\\nO registo é editorial e gratuito. Podem verificar se está correto: línguas, morada e site? Se algo estiver incorreto, ou preferirem não constar, basta responder aqui.'; }
  };
  var CHAN_LABEL = {whatsapp:'WhatsApp', social:'Social', email:'E-Mail'};
  var SOC_LABEL = {facebook:'Facebook', instagram:'Instagram', linkedin:'LinkedIn'};

  function waText(r){
    var pick = (r.l||[]).filter(function(l){ return WA_MSG[l]; })[0] || 'en';
    return WA_MSG[pick](r.c[0]||'', r.g[0]||'', r.u[0]||'https://thenomadhq.com/services');
  }
  function waHref(r){ return 'https://wa.me/' + r.wa + '?text=' + encodeURIComponent(waText(r)); }

  // Only a profile that can actually receive a message from a stranger. A LinkedIn company page
  // cannot, so it is shown as a link to look at and never offered as a way to write.
  function dmProfiles(r){
    var out = [], so = r.so || {};
    if (so.facebook) out.push(['facebook', so.facebook]);
    if (so.instagram) out.push(['instagram', so.instagram]);
    if (so.linkedin && /linkedin\\.com\\/in\\//i.test(so.linkedin)) out.push(['linkedin', so.linkedin]);
    return out;
  }
  function otherProfiles(r){
    var so = r.so || {};
    return (so.linkedin && !/linkedin\\.com\\/in\\//i.test(so.linkedin)) ? [['linkedin', so.linkedin]] : [];
  }`);

// ---- 5. the block itself, at the top of the panel --------------------------
patch('channel block in panel',
  `    h += '<div class="grp"><span class="lbl">Status</span>' + segHTML(r.id, statusOf(r), true) + '</div>';`,
  `    h += '<div class="grp"><span class="lbl">Status</span>' + segHTML(r.id, statusOf(r), true) + '</div>';

    // The channel block. Best way in first, alternatives beside it, and the reason it was chosen,
    // so the pick is legible rather than magic.
    h += '<div class="grp"><span class="lbl">Kontaktweg</span><div class="chan">';
    if (r.ch === 'whatsapp'){
      h += '<div class="chan-top"><button class="chan-go wa" type="button" data-wa="'+esc(r.id)+'">WhatsApp öffnen &rarr;</button>'
         + '<span class="chip chip-whatsapp">WhatsApp</span></div>'
         + '<p class="chan-why">Nachricht ist vorausgefüllt in der Sprache der Firma. Senden musst du selbst. Wird beim Klick als gesendet markiert.</p>';
    } else if (r.ch === 'social'){
      var dms = dmProfiles(r);
      h += '<div class="chan-top"><a class="chan-go" href="'+esc(dms[0][1])+'" target="_blank" rel="noopener noreferrer" data-social="'+esc(r.id)+'">'
         + esc(SOC_LABEL[dms[0][0]]) + ' öffnen &rarr;</a><span class="chip chip-social">Social</span></div>'
         + '<p class="chan-why">Profil öffnen und Nachricht einfügen: kein Netzwerk füllt eine DM vor. Text unten kopieren.</p>';
      if (dms.length > 1){
        h += '<div class="chan-alt">';
        for (var dm=1; dm<dms.length; dm++) h += '<a href="'+esc(dms[dm][1])+'" target="_blank" rel="noopener noreferrer" data-social="'+esc(r.id)+'">'+esc(SOC_LABEL[dms[dm][0]])+' ↗</a>';
        h += '</div>';
      }
    } else if (r.ch === 'email'){
      h += '<div class="chan-top"><span class="mono">'+esc(r.e)+'</span><span class="chip chip-email">E-Mail</span></div>'
         + '<div class="chan-alt"><a href="#" data-copy="'+esc(r.e)+'">Adresse kopieren</a></div>'
         + '<p class="chan-why">'+esc(r.ek)+(r.ea?' · mehrere gleich gute Postfächer, bitte prüfen':'')+'</p>';
    } else {
      h += '<p class="chan-none">Kein Kontaktweg gefunden. Website öffnen und selbst nachsehen.</p>';
    }
    // Everything else we hold, so a dead channel is one click from the next one.
    var extras = [];
    if (r.ch !== 'whatsapp' && r.wa) extras.push('<a href="'+esc(waHref(r))+'" target="_blank" rel="noopener noreferrer" data-social="'+esc(r.id)+'">WhatsApp ↗</a>');
    if (r.ch !== 'email' && r.e) extras.push('<a href="#" data-copy="'+esc(r.e)+'">'+esc(r.e)+'</a>');
    if (r.ch !== 'social'){
      var alt = dmProfiles(r);
      for (var x=0; x<alt.length; x++) extras.push('<a href="'+esc(alt[x][1])+'" target="_blank" rel="noopener noreferrer" data-social="'+esc(r.id)+'">'+esc(SOC_LABEL[alt[x][0]])+' ↗</a>');
    }
    var seen = otherProfiles(r);
    for (var y=0; y<seen.length; y++) extras.push('<a href="'+esc(seen[y][1])+'" target="_blank" rel="noopener noreferrer">'+esc(SOC_LABEL[seen[y][0]])+' (Seite, keine DM möglich) ↗</a>');
    if (extras.length) h += '<div class="chan-alt">' + extras.join('') + '</div>';
    h += '</div></div>';

    if (r.ch === 'whatsapp' || r.ch === 'social'){
      h += '<div class="grp"><span class="lbl">Nachricht &middot; kurz, für Messenger</span>'
         + '<textarea class="in draft mono" id="waDraft" readonly>'+esc(waText(r))+'</textarea>'
         + '<button class="copy" data-copy-wa="'+esc(r.id)+'">Nachricht kopieren und als gesendet markieren</button></div>';
    }`);

// ---- 6. clicks --------------------------------------------------------------
patch('click targets',
  `    var t = ev.target.closest ? ev.target.closest('[data-open],[data-set],[data-filter],[data-copy],[data-copy-draft],[data-lang],[data-sort]') : null;`,
  `    var t = ev.target.closest ? ev.target.closest('[data-open],[data-set],[data-filter],[data-copy],[data-copy-draft],[data-lang],[data-sort],[data-wa],[data-social],[data-copy-wa]') : null;`);

patch('click handlers',
  `    if (t.hasAttribute('data-copy-draft')){`,
  `    // Opening the chat is the last thing that happens before the message goes, so it is the
    // honest moment to record it, the same rule the mail draft already follows.
    if (t.hasAttribute('data-wa')){
      var waId = t.getAttribute('data-wa');
      var waRow = null;
      for (var wi=0; wi<ROWS.length; wi++) if (ROWS[wi].id === waId){ waRow = ROWS[wi]; break; }
      if (waRow){ window.open(waHref(waRow), '_blank', 'noopener'); if (statusOf({id:waId}) !== 'sent') setStatus(waId, 'sent'); }
      return;
    }
    if (t.hasAttribute('data-social')){
      var soId = t.getAttribute('data-social');
      if (statusOf({id:soId}) !== 'sent') setStatus(soId, 'sent');
      return; // the anchor's own target="_blank" opens it
    }
    if (t.hasAttribute('data-copy-wa')){
      copy(($('waDraft')||{}).value || '', t);
      var cwId = t.getAttribute('data-copy-wa');
      if (statusOf({id:cwId}) !== 'sent') setStatus(cwId, 'sent');
      return;
    }
    if (t.hasAttribute('data-copy-draft')){`);

// ---- 7. filter state, wiring and reset -------------------------------------
patch('filter state',
  `  var f = {q:'', status:'', country:'', cat:'', lang:'', ev:'', hideAgg:true, sort:'n', dir:1};`,
  `  var f = {q:'', status:'', country:'', cat:'', lang:'', ev:'', chan:'', hideAgg:true, sort:'n', dir:1};`);

patch('filter predicate',
  `    if (f.ev && r.ev !== f.ev) return false;`,
  `    if (f.ev && r.ev !== f.ev) return false;
    if (f.chan === 'none'){ if (r.ch) return false; }
    else if (f.chan && r.ch !== f.chan) return false;`);

patch('filter change', `    else if (id === 'fEv') f.ev = ev.target.value;`,
  `    else if (id === 'fEv') f.ev = ev.target.value;
    else if (id === 'fChan') f.chan = ev.target.value;`);

patch('filter reset',
  `    $('q').value=''; $('fCountry').value=''; $('fCat').value=''; $('fLang').value=''; $('fEv').value=''; $('fAgg').checked=true;`,
  `    $('q').value=''; $('fCountry').value=''; $('fCat').value=''; $('fLang').value=''; $('fEv').value=''; $('fChan').value=''; $('fAgg').checked=true;`);

// ---- 8. a chip in the list, so the channel is visible before opening a row --
patch('row chip',
  `        + (sv.email?' <span class="flag" style="color:var(--st-yes)">· E-Mail hinterlegt</span>':'')+'</span></td>'`,
  `        + (sv.email?' <span class="flag" style="color:var(--st-yes)">· E-Mail hinterlegt</span>':'')+'</span>'
        + (r.ch?' <span class="chip chip-'+r.ch+'">'+esc(CHAN_LABEL[r.ch])+'</span>':'')+'</td>'`);

fs.writeFileSync(OUT, html);
console.log(`patched ${path.basename(SRC)} -> ${path.basename(OUT)}`);
console.log(`  ${(before / 1024).toFixed(0)} KB -> ${(html.length / 1024).toFixed(0)} KB`);

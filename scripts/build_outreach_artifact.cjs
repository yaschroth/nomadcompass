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

/**
 * Replace exactly once, and say so loudly when the anchor has moved.
 *
 * The published file uses CRLF; the anchors in this script are written with LF, because that is
 * what a source file here contains. Every anchor was single-line until the database block needed
 * patching, so the mismatch stayed invisible and then read as "the published file has drifted",
 * which was wrong and sent me looking in the wrong place. Both forms are tried, and the
 * replacement takes the line ending of whichever matched, so the file never ends up mixed.
 */
const applied = [];
const already = [];

function patch(label, find, replace) {
  // Already published? Ask the result, not a marker.
  //
  // Every patch below had been applied and published, so running this file again threw on the
  // first anchor that its own replacement had consumed: "the published file has drifted", about a
  // file that had drifted in exactly the way this script drifted it. Worse was the patch that did
  // NOT throw. 'wa message + helpers' is anchored on the EVNAME line and replaces it with that
  // same line plus the whole WA_MSG block, so the anchor survives its own replacement and a second
  // run appended a second copy of WA_MSG. The tool would have loaded, and the later copy would
  // have silently won.
  //
  // So the question asked first is whether the replacement is already there. That is the result,
  // not a marker beside it, which is the difference between "this patch has been applied" and
  // "something once wrote a comment here". An anchor that is missing AND a replacement that is
  // absent is still a hard failure, because that is real drift.
  const crlf = (s) => s.replace(/\r?\n/g, '\r\n');
  if (html.indexOf(replace) >= 0 || (replace.includes('\n') && html.indexOf(crlf(replace)) >= 0)) {
    already.push(label);
    return;
  }
  let needle = find;
  let body = replace;
  if (html.indexOf(needle) < 0 && find.includes('\n')) {
    needle = crlf(find);
    body = crlf(replace);
  }
  const i = html.indexOf(needle);
  if (i < 0) throw new Error(`anchor not found for "${label}". The published file has drifted.`);
  if (html.indexOf(needle, i + needle.length) >= 0) throw new Error(`anchor for "${label}" is not unique.`);
  html = html.slice(0, i) + body + html.slice(i + needle.length);
  applied.push(label);
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
  .chan-alt a,.chan-alt button{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;
              border-radius:var(--r);background:var(--surface);border:1px solid var(--line);
              color:var(--ink-2);text-decoration:none;font-size:12.5px;cursor:pointer}
  .chan-alt a:hover,.chan-alt button:hover{border-color:var(--line-2);color:var(--ink)}
  .chan-none{font-size:13px;color:var(--muted)}
  /* Reporting a dead channel is a quiet action, never a primary one: it sits with the alternatives
     and only turns red once it has been used. */
  .chan-bad{color:var(--st-no)!important;border-color:color-mix(in srgb,var(--st-no) 45%,transparent)!important}
  .chan-flag{font-size:12.5px;color:var(--st-no);margin:0}
  /* One per contact, right beside it. Small and grey until hovered, because reporting a dead
     number is a correction and not one of the things the panel is asking you to do. */
  .xbad{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
        padding:0;border-radius:5px;background:none;border:1px solid var(--line);color:var(--muted);
        cursor:pointer;font-size:11px;line-height:1;flex:none}
  .xbad:hover{border-color:var(--st-no);color:var(--st-no);background:var(--st-no-bg)}
  .chan-pair{display:inline-flex;align-items:center;gap:4px}
  .chan-dead{text-decoration:line-through;opacity:.6}
  .chip{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
        padding:1px 5px;border-radius:3px;border:1px solid currentColor}
  .chip-whatsapp{color:#1f9d55} .chip-social{color:var(--st-queued)} .chip-email{color:var(--st-sent)}
  .chip-broken{color:var(--st-no)}

  @media (max-width:1100px){ .strip{grid-template-columns:repeat(3,1fr)} }`);

// ---- 3. the channel filter --------------------------------------------------
patch('channel filter control',
  `    <select id="fEv"><option value="">Alle Belege</option>`,
  `    <select id="fChan"><option value="">Alle Kontaktwege</option><option value="whatsapp">nur WhatsApp</option><option value="social">nur Social</option><option value="email">nur E-Mail</option><option value="none">ohne Kontaktweg</option><option value="broken">defekt gemeldet</option></select>
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

  // A reported-dead channel, kept per firm as {channel: 'YYYY-MM-DD'}. The date, not a boolean,
  // because "this number was dead in September" is worth knowing when it is re-sourced in November.
  // It lives in the same database document as the status, so it survives a reload and a republish,
  // and can be read back from outside the page to drive a fresh harvest of exactly these firms.
  function brokenMap(id){
    var s = state[id] || {};
    return (s.broken && typeof s.broken === 'object') ? s.broken : {};
  }
  function isBroken(id, ch){ return !!brokenMap(id)[ch]; }
  function anyBroken(id){ for (var k in brokenMap(id)) return true; return false; }

  var KIND_LABEL = {whatsapp:'WhatsApp', facebook:'Facebook', instagram:'Instagram',
                    linkedin:'LinkedIn', email:'E-Mail'};

  // Every way in we hold for this firm, best first, each one reportable on its own. Reporting used
  // to work on the channel ("social is broken"), which was too coarse: a firm can have a dead
  // Instagram and a perfectly good Facebook, and marking the channel threw both away.
  function contactItems(r){
    var out = [];
    if (r.wa) out.push({k:'whatsapp', label:'WhatsApp', href:waHref(r), wa:1});
    var so = r.so || {};
    if (so.facebook)  out.push({k:'facebook',  label:'Facebook',  href:so.facebook});
    if (so.instagram) out.push({k:'instagram', label:'Instagram', href:so.instagram});
    if (so.linkedin && /linkedin\\.com\\/in\\//i.test(so.linkedin)) out.push({k:'linkedin', label:'LinkedIn', href:so.linkedin});
    if (r.e) out.push({k:'email', label:r.e, copy:r.e});
    return out;
  }
  function chipFor(k){ return k === 'whatsapp' ? 'whatsapp' : (k === 'email' ? 'email' : 'social'); }
  function xBtn(id, k){
    var t = (KIND_LABEL[k] || k) + ' funktioniert nicht';
    return '<button type="button" class="xbad" data-broken="' + esc(id) + '|' + esc(k) + '"'
         + ' title="' + esc(t) + '" aria-label="' + esc(t) + '">&#10005;</button>';
  }

  // Which language we write to a firm in.
  //
  // The country's own language where that is German, Spanish or Portuguese, and English everywhere
  // else. NOT the languages the firm works in, which is what this used to do: a Bangkok barber who
  // advertises English is still a Thai business, and picking "a language it works in" meant writing
  // to Italy and France in Italian and French off the back of a directory field, which is a claim
  // about who they serve rather than about who opens the mail. Four languages, written properly,
  // beat twenty written from a table.
  var COUNTRY_LANG = {
    'Germany':'de','Austria':'de','Switzerland':'de','Liechtenstein':'de',
    'Spain':'es','Mexico':'es','Argentina':'es','Colombia':'es','Chile':'es','Peru':'es',
    'Ecuador':'es','Bolivia':'es','Uruguay':'es','Paraguay':'es','Venezuela':'es',
    'Costa Rica':'es','Panama':'es','Guatemala':'es','Honduras':'es','Nicaragua':'es',
    'El Salvador':'es','Dominican Republic':'es','Cuba':'es','Puerto Rico':'es',
    'Portugal':'pt','Brazil':'pt','Angola':'pt','Mozambique':'pt','Cape Verde':'pt'
  };
  // The first country, because it is the one the first listing and the message itself name.
  function msgLang(r){
    var c = (r.k || []).filter(Boolean)[0] || '';
    var l = COUNTRY_LANG[c] || 'en';
    return WA_MSG[l] ? l : 'en';
  }

  function waText(r){
    return WA_MSG[msgLang(r)](r.c[0]||'', r.g[0]||'', r.u[0]||'https://thenomadhq.com/services');
  }
  function waHref(r){ return 'https://wa.me/' + r.wa + '?text=' + encodeURIComponent(waText(r)); }
  // wa.me is a redirector: it forwards to api.whatsapp.com, which refuses to be framed. That is
  // fine in a real tab and fatal inside this sandbox, so every WhatsApp link here is a plain anchor
  // with target="_blank" and never window.open, which the sandbox blocks and some browsers then
  // turn into a navigation of the iframe itself. web.whatsapp.com is offered beside it for a
  // network or browser that blocks the redirector outright.
  function webWaHref(r){ return 'https://web.whatsapp.com/send?phone=' + r.wa + '&text=' + encodeURIComponent(waText(r)); }

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

// ---- 4b. the mail draft follows the same rule ------------------------------
//
// The tabs used to offer every language the firm was recorded as working in, defaulting to the
// first. That is the same mistake as the WhatsApp text made: the directory field says who they can
// serve, not what language reaches them. Now the country's language leads, with English beside it
// as the only alternative, so the two message types cannot say different things about the same firm.
patch('draft language by country',
  `  function draftLangsFor(r){
    var out = [];
    for (var i=0;i<r.l.length;i++) if (DRAFTS[r.l[i]] && out.indexOf(r.l[i])<0) out.push(r.l[i]);
    if (out.indexOf('en')<0) out.push('en');
    return out;
  }`,
  `  function draftLangsFor(r){
    var out = [];
    var own = msgLang(r);
    if (DRAFTS[own]) out.push(own);
    if (out.indexOf('en') < 0) out.push('en');
    return out;
  }`);

// ---- 4c. what answering is worth, said in both message types ---------------
//
// Both openers asked a stranger to check their entry and offered nothing back, while the thing
// worth offering was already true and already built. A reply moves the row to the "visited" tier,
// and EV_RANK in scripts/lib/service_labels.cjs sorts every city page on
// { visited: 0, official: 1, 'self-declared': 2, directory: 3 } ascending, so a firm that confirms
// its entry is printed above every firm that has not. data/service-languages.json says the same in
// its own words: "which is why these are listed first".
//
// It is a fact about how the page is built, not an inducement. The order cannot be bought, the
// listing stays free, and the only way into the top tier is to answer a question about your own
// entry. Both message types carry the same sentence, because a firm that receives both and finds
// they differ has learned that one of them is marketing.
//
// Anchored on each language's own question rather than on a line number, and the WhatsApp opener
// and the mail draft ask that question differently in every language, so all twelve anchors are
// unique. The apostrophes are doubled because these sit inside single-quoted JS strings in the
// published file, where the artifact needs to read \' and the template literal here has to emit it.
const WA_ASK = {
  en: `Could you check it is right: your languages, address and website? `,
  de: `Könnten Sie kurz prüfen, ob er stimmt: Sprachen, Adresse, Website? `,
  es: `¿Podrían revisar si es correcta: idiomas, dirección y sitio web? `,
  fr: `Pourriez-vous vérifier qu\\'elle est exacte : langues, adresse, site internet ? `,
  it: `Potreste verificare che sia corretta: lingue, indirizzo, sito web? `,
  pt: `Podem verificar se está correto: línguas, morada e site? `,
};
const WA_RANK = {
  en: `Entries confirmed by the business are marked as checked and listed above the ones we have only read, so a reply also moves you up the page for your city. `,
  de: `Von den Betrieben selbst bestätigte Einträge werden als geprüft gekennzeichnet und vor denen gelistet, die wir nur gelesen haben. Eine Antwort bringt Sie also auch auf der Seite Ihrer Stadt nach oben. `,
  es: `Las fichas confirmadas por el propio negocio se marcan como verificadas y aparecen por delante de las que solo hemos leído, de modo que una respuesta también les sube en la página de su ciudad. `,
  fr: `Les fiches confirmées par l\\'établissement lui-même sont signalées comme vérifiées et placées devant celles que nous avons seulement lues, une réponse vous fait donc aussi remonter sur la page de votre ville. `,
  it: `Le schede confermate dall\\'attività stessa vengono contrassegnate come verificate e precedono quelle che abbiamo soltanto letto, quindi una risposta vi fa salire anche nella pagina della vostra città. `,
  pt: `As fichas confirmadas pelo próprio negócio são assinaladas como verificadas e aparecem à frente das que apenas lemos, pelo que uma resposta também vos faz subir na página da vossa cidade. `,
};
Object.keys(WA_ASK).forEach((lang) => {
  patch(`wa ranking sentence (${lang})`, WA_ASK[lang], WA_ASK[lang] + WA_RANK[lang]);
});

// The draft lines do not all end where their sentence does. German and French break the line after
// "...website.", but the other four run straight on into "If anything is wrong, " and wrap mid
// sentence, so appending after the line produced "If anything is wrong, Entries confirmed by the
// business are ... for your city. or you would rather not be listed". The trailing clause has to
// move below the new sentence, so each language says where its line splits rather than trusting
// the line to be a sentence.
const DRAFT_ASK = {
  de: [`        + 'Ich schreibe, damit Sie die Angaben einmal prüfen können: Adresse, Arbeitssprachen, Website. '`, ''],
  en: [`        + 'I am writing so you can check it: address, working languages, website. `, `If anything is wrong, '`],
  es: [`        + 'Les escribo para que puedan revisarla: dirección, idiomas de trabajo, sitio web. `, `Si algo no es correcto, '`],
  fr: [`        + 'Je vous écris afin que vous puissiez la vérifier : adresse, langues de travail, site internet. '`, ''],
  it: [`        + 'Vi scrivo perché possiate verificarla: indirizzo, lingue di lavoro, sito web. `, `Se qualcosa non è corretto, '`],
  pt: [`        + 'Escrevo para que possam verificá-lo: morada, línguas de trabalho, site. `, `Se algo estiver incorreto, '`],
};
Object.keys(DRAFT_ASK).forEach((lang) => {
  const [head, tail] = DRAFT_ASK[lang];
  const sentence = `        + '${WA_RANK[lang].trim()} '`;
  // With a tail the head is an unterminated string, so it is closed here and the tail reopened on
  // its own line; without one the head is already a whole line and the sentence simply follows it.
  const replacement = tail
    ? `${head}'\n${sentence}\n        + '${tail}`
    : `${head}\n${sentence}`;
  patch(`draft ranking sentence (${lang})`, head + tail, replacement);
});

// ---- 4d. the tier this tool creates, named in the tool ---------------------
//
// EVNAME had no 'visited', and that is the one tier the outreach produces: a firm that answers is
// moved to it, build_outreach_dataset ranks it, and the payload carries it through as ev. The
// panel was printing undefined for exactly the firms this pipeline had already succeeded with.
patch('evname visited',
  `  var EVNAME = {'official':'amtlich','self-declared':'selbst angegeben','directory':'Verzeichnis'};`,
  `  var EVNAME = {'official':'amtlich','visited':'bestätigt','self-declared':'selbst angegeben','directory':'Verzeichnis'};`);

// ---- 5. the block itself, at the top of the panel --------------------------
patch('channel block in panel',
  `    h += '<div class="grp"><span class="lbl">Status</span>' + segHTML(r.id, statusOf(r), true) + '</div>';`,
  `    h += '<div class="grp"><span class="lbl">Status</span>' + segHTML(r.id, statusOf(r), true) + '</div>';

    // The channel block. Best way in first, alternatives beside it, and the reason it was chosen,
    // so the pick is legible rather than magic.
    h += '<div class="grp"><span class="lbl">Kontaktweg</span><div class="chan">';
    var items = contactItems(r);
    var live = [], dead = [];
    for (var ii=0; ii<items.length; ii++) (isBroken(r.id, items[ii].k) ? dead : live).push(items[ii]);

    if (!items.length){
      h += '<p class="chan-none">Kein Kontaktweg gefunden. Website oeffnen und selbst nachsehen.</p>';
    } else if (!live.length){
      h += '<p class="chan-none">Alle gefundenen Kontaktwege sind als defekt gemeldet. Wird neu gesucht.</p>';
    } else {
      // The best one that still works leads. A reported-dead contact does not merely get a mark,
      // it steps aside, so the panel always offers something that can actually be used.
      var top = live[0];
      h += '<div class="chan-top"><span class="chan-pair">';
      if (top.copy){
        h += '<span class="mono">' + esc(top.label) + '</span>'
           + '<button type="button" class="chan-go" data-copy="' + esc(top.copy) + '">Adresse kopieren</button>';
      } else {
        h += '<a class="chan-go' + (top.wa ? ' wa' : '') + '" href="' + esc(top.href) + '"'
           + ' target="_blank" rel="noopener noreferrer" data-social="' + esc(r.id) + '">'
           + esc(top.label) + ' oeffnen &rarr;</a>';
      }
      h += xBtn(r.id, top.k) + '</span>'
         + '<span class="chip chip-' + chipFor(top.k) + '">' + esc(KIND_LABEL[top.k] || top.k) + '</span></div>';

      if (top.k === 'whatsapp'){
        h += '<p class="chan-why">Nachricht ist vorausgefuellt in der Sprache des Landes. Senden musst du selbst. Wird beim Klick als gesendet markiert.</p>'
           + '<div class="chan-alt"><a href="' + esc(webWaHref(r)) + '" target="_blank" rel="noopener noreferrer" data-social="' + esc(r.id) + '">WhatsApp Web &#8599;</a>'
           + '<button type="button" data-copy="+' + esc(r.wa) + '">+' + esc(r.wa) + ' kopieren</button></div>';
      } else if (top.k === 'email'){
        h += '<p class="chan-why">' + esc(r.ek) + (r.ea ? ' &middot; mehrere gleich gute Postfaecher, bitte pruefen' : '') + '</p>';
      } else {
        h += '<p class="chan-why">Profil oeffnen und Nachricht einfuegen: kein Netzwerk fuellt eine DM vor. Text unten kopieren.</p>';
      }

      if (live.length > 1){
        h += '<div class="chan-alt">';
        for (var li=1; li<live.length; li++){
          var it = live[li];
          h += '<span class="chan-pair">';
          if (it.copy) h += '<button type="button" data-copy="' + esc(it.copy) + '">' + esc(it.label) + '</button>';
          else h += '<a href="' + esc(it.href) + '" target="_blank" rel="noopener noreferrer" data-social="' + esc(r.id) + '">' + esc(it.label) + ' &#8599;</a>';
          h += xBtn(r.id, it.k) + '</span>';
        }
        h += '</div>';
      }
    }

    // A page we can look at but not write to. Kept for context, never offered as a way in.
    var seen = otherProfiles(r);
    if (seen.length){
      h += '<div class="chan-alt">';
      for (var y=0; y<seen.length; y++) h += '<a class="chan-dead" href="' + esc(seen[y][1]) + '" target="_blank" rel="noopener noreferrer">' + esc(SOC_LABEL[seen[y][0]]) + ' (Seite, keine DM moeglich) &#8599;</a>';
      h += '</div>';
    }

    if (dead.length){
      h += '<p class="chan-flag">Als defekt gemeldet: '
         + dead.map(function(it){ return esc(KIND_LABEL[it.k] || it.k) + ' (' + esc(brokenMap(r.id)[it.k]) + ')'; }).join(', ')
         + '</p><div class="chan-alt">';
      for (var di=0; di<dead.length; di++){
        h += '<button type="button" data-unbroken="' + esc(r.id) + '|' + esc(dead[di].k) + '">'
           + esc(KIND_LABEL[dead[di].k] || dead[di].k) + ' doch erreichbar</button>';
      }
      h += '</div>';
    }
    h += '</div></div>';

    if (r.ch === 'whatsapp' || r.ch === 'social'){
      h += '<div class="grp"><span class="lbl">Nachricht &middot; kurz, für Messenger</span>'
         + '<textarea class="in draft mono" id="waDraft" readonly>'+esc(waText(r))+'</textarea>'
         + '<button class="copy" data-copy-wa="'+esc(r.id)+'">Nachricht kopieren und als gesendet markieren</button></div>';
    }`);

// ---- 6. clicks --------------------------------------------------------------
patch('click targets',
  `    var t = ev.target.closest ? ev.target.closest('[data-open],[data-set],[data-filter],[data-copy],[data-copy-draft],[data-lang],[data-sort]') : null;`,
  `    var t = ev.target.closest ? ev.target.closest('[data-open],[data-set],[data-filter],[data-copy],[data-copy-draft],[data-lang],[data-sort],[data-social],[data-copy-wa],[data-broken],[data-unbroken]') : null;`);


patch('click handlers',
  `    if (t.hasAttribute('data-copy-draft')){`,
  `    // Opening the chat is the last thing that happens before the message goes, so it is the
    // honest moment to record it, the same rule the mail draft already follows. The anchor opens
    // itself: this only records. window.open was tried and is blocked by the sandbox, which turned
    // the click into a navigation of the iframe and an "refused to connect" from WhatsApp.
    if (t.hasAttribute('data-social')){
      var soId = t.getAttribute('data-social');
      if (statusOf({id:soId}) !== 'sent') setStatus(soId, 'sent');
      return; // the anchor's own target="_blank" opens it
    }
    // Reporting a dead channel writes the report and nothing else: it is not a status change and
    // must not look like one.
    if (t.hasAttribute('data-broken') || t.hasAttribute('data-unbroken')){
      var isOn = t.hasAttribute('data-broken');
      var bp = (t.getAttribute(isOn ? 'data-broken' : 'data-unbroken') || '').split('|');
      if (bp.length === 2) setBroken(bp[0], bp[1], isOn);
      return;
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
    else if (f.chan === 'broken'){ if (!anyBroken(r.id)) return false; }
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
        + (r.ch?' <span class="chip chip-'+r.ch+'">'+esc(CHAN_LABEL[r.ch])+'</span>':'')
        + (anyBroken(r.id)?' <span class="chip chip-broken">defekt</span>':'')+'</td>'`);

// ---- 8a. THE BUG ------------------------------------------------------------
//
// renderStrip() threw on every single render, and had done since "queued" was added to STATUS.
//
//   var counts = {open:0,sent:0,yes:0,no:0};        // five statuses, four counters
//   ...
//   counts[s.k].toLocaleString('de-DE')             // s.k === 'queued' -> undefined.toLocaleString
//
// render() calls renderStrip() LAST, which is why the damage looked like anything but a rendering
// bug: the table and the count line are written before the throw and look perfectly healthy, while
// the five status tiles and the subtitle never appear. And because the initial render() sits
// directly above the database block, the throw took the entire db initialisation with it. No
// use("db"), so no store, no subscription, no banner, no error of any kind. The status list could
// not load because nothing ever asked for it, and every click was lost on reload because setStatus
// calls render() before it writes, so the write was never reached either.
//
// Fixed by deriving the counters from STATUS instead of writing them out a second time by hand, so
// the two cannot drift apart again, and by tolerating a status the store holds that STATUS no
// longer lists.
patch('strip counters',
  `  function renderStrip(){
    var counts = {open:0,sent:0,yes:0,no:0};
    for (var i=0;i<ROWS.length;i++){ if (f.hideAgg && ROWS[i].ag) continue; counts[statusOf(ROWS[i])]++; }`,
  `  function renderStrip(){
    // Derived from STATUS. A hand-written literal here is what broke the page for a week.
    var counts = {};
    for (var c=0;c<STATUS.length;c++) counts[STATUS[c].k] = 0;
    for (var i=0;i<ROWS.length;i++){
      if (f.hideAgg && ROWS[i].ag) continue;
      var sk = statusOf(ROWS[i]);
      if (counts[sk] === undefined) counts[sk] = 0;
      counts[sk]++;
    }`);

// A rendering bug must never again be able to take the database with it. The db block is what
// makes this tool remember anything; it has no business depending on the status tiles drawing.
patch('init render guard',
  `  render();

  // ---- db: status survives reloads and republishes ---------------------------`,
  `  try {
    render();
  } catch (e) {
    // Keep going: a half-drawn table is worth far more than a page that silently stops before it
    // has loaded a single status.
    if (window.console && console.error) console.error('render() beim Start gescheitert', e);
  }

  // ---- db: status survives reloads and republishes ---------------------------`);

// ---- 8b. a build stamp in static HTML --------------------------------------
//
// Two rounds of diagnosis were spent on JavaScript that provably shipped and provably did not
// appear. Every instrument so far needed the page's script to run, which begs the question being
// asked. This one does not: it is literal markup in the masthead, so if the page renders at all it
// is visible, and if it is absent the file being served is not the file being published.
patch('build stamp',
  `    <h1>Backlink-Pipeline</h1>`,
  `    <h1>Backlink-Pipeline</h1>
    <span class="dach" title="Aus welchem Build diese Seite stammt. Rein statisch, ohne JavaScript.">BUILD ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</span>`);

// ---- 8c. read the write back -----------------------------------------------
//
// "When I reload, my changes are gone" has two possible causes and they need opposite fixes: the
// write never landed, or it landed and the read never returns it. set() resolving proves only that
// the call was accepted. Reading the document straight back proves what is actually stored.
// The writer for a reported dead channel. Same document as the status, same last-writer-wins
// rules, so it needs no storage of its own and comes back with everything else on reload.
patch('setBroken',
  `  function saveFields(id){`,
  `  function setBroken(id, ch, on){
    captureFields(id);
    var prev = state[id] || {};
    var b = Object.assign({}, brokenMap(id));
    if (on) b[ch] = new Date().toISOString().slice(0,10); else delete b[ch];
    var body = Object.assign({}, prev, {broken: b, updatedAt: new Date().toISOString()});
    state[id] = body;
    render();
    if (current === id) openPanel(id);
    if (!db){ warn('Kein Speicher verfuegbar, die Meldung gilt nur fuer diese Sitzung.'); return; }
    db.collection('outreach').doc(id).set(body)
      .catch(function(e){ warn('Meldung nicht gespeichert (' + (e && e.code) + ').'); });
  }

  function saveFields(id){`);

patch('write read-back',
  `    db.collection('outreach').doc(id).set(body)
      .catch(function(e){ warn('Status nicht gespeichert (' + (e && e.code) + ').'); });`,
  `    db.collection('outreach').doc(id).set(body)
      .then(function(){
        return db.collection('outreach').doc(id).get().then(function(snap){
          var d = snap && snap.data && snap.data();
          diag(snap && snap.exists
            ? ('gespeichert: ' + id + ' = "' + (d && d.status) + '", ' + hhmmss())
            : ('SCHREIBEN VERSCHWUNDEN: ' + id + ' ist nach dem Speichern nicht da, ' + hhmmss()));
        });
      })
      .catch(function(e){
        warn('Status nicht gespeichert (' + (e && e.code) + ').');
        diag('Schreiben gescheitert: ' + (e && e.code ? e.code : '?') + ' ' + (e && e.message ? e.message : ''));
      });`);

// ---- 9. the database, instrumented -----------------------------------------
//
// The status list stopped loading and NOTHING said so: the page showed every firm as "Nicht
// kontaktiert" while 51 documents sat in the store, and no banner appeared. That combination is
// only possible in the gaps this block had. use() resolving null warns, and a terminal query error
// warns, but an exception thrown INSIDE the snapshot handler is caught by nobody, and a
// subscription that simply never delivers looks exactly like one that delivered nothing.
//
// So the handler now reports rather than swallows, and every stage says where it got to. The
// diagnosis line is deliberately separate from warn(), which replaces the whole banner area.
patch('db diagnostics',
  `  if (window.claude && typeof window.claude.use === 'function'){`,
  `  // Its own element, so warn() replacing the banner area cannot wipe it and it cannot wipe warn().
  function diag(msg){
    var el = document.getElementById('dbdiag');
    if (!el){
      el = document.createElement('div');
      el.id = 'dbdiag';
      el.className = 'banner';
      el.style.cssText = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px';
      var host = document.getElementById('dbwarn');
      if (host && host.parentNode) host.parentNode.insertBefore(el, host.nextSibling);
    }
    el.textContent = 'DB: ' + msg;
  }
  var sawSnapshot = false;
  var t0 = Date.now();
  var hhmmss = function(){ return new Date().toTimeString().slice(0,8); };

  diag('warte auf claude.use("db") ...');
  // A subscription that never delivers and never errors is the one failure this block could not
  // see. Fifteen seconds is well past the ten the runtime allows itself to answer in.
  setTimeout(function(){
    if (!sawSnapshot) diag('nach 15s kein Snapshot und kein Fehler. Das Abo antwortet nicht.');
  }, 15000);

  if (window.claude && typeof window.claude.use === 'function'){`);

patch('db snapshot handler',
  `      db = store;
      db.collection('outreach').onSnapshot(function(snap){
        var next = {};
        snap.docs.forEach(function(d){ next[d.id] = d.data() || {}; });
        // Never rebuild the open panel from a snapshot: it would wipe whatever is half-typed in it.
        // The panel already shows the local state, and reopening it picks the stored values up.
        if (current) captureFields(current);
        if (current && state[current]) next[current] = Object.assign({}, next[current], state[current]);
        state = next;
        render();
      }, function(e){`,
  `      db = store;
      diag('Speicher da nach ' + (Date.now() - t0) + 'ms, lese "outreach" ...');

      // Everything here runs inside the platform's callback, where a throw reaches no catch of
      // ours and no error callback. Reporting it is the whole point of the try.
      function applySnapshot(snap, label){
        try {
          var docs = (snap && snap.docs) || [];
          var next = {};
          docs.forEach(function(d){ next[d.id] = (d.data && d.data()) || {}; });
          // Never rebuild the open panel from a snapshot: it would wipe whatever is half-typed in it.
          // The panel already shows the local state, and reopening it picks the stored values up.
          if (current) captureFields(current);
          if (current && state[current]) next[current] = Object.assign({}, next[current], state[current]);
          state = next;
          var withStatus = 0;
          for (var k in next) if (next[k] && next[k].status) withStatus++;
          diag(label + ': ' + docs.length + ' Dokumente, ' + withStatus + ' mit Status, ' + hhmmss()
            + (snap && snap.metadata && snap.metadata.fromCache ? ' (Cache)' : ''));
          render();
        } catch (err) {
          diag(label + ' konnte nicht verarbeitet werden: ' + (err && err.message ? err.message : err));
        }
      }

      // A one-shot read, BEFORE the subscription and independent of it. The status list used to
      // hang entirely on onSnapshot: when that never delivered, the page showed every firm as
      // uncontacted for ever and reported nothing, because a subscription that stays silent is
      // indistinguishable from one that delivered an empty set. get() has only two outcomes, and
      // both are visible.
      db.collection('outreach').get().then(function(snap){
        sawSnapshot = true;
        applySnapshot(snap, 'Erstabruf');
      }).catch(function(e){
        diag('Erstabruf gescheitert: ' + (e && e.code ? e.code : '?') + ' ' + (e && e.message ? e.message : ''));
      });

      db.collection('outreach').onSnapshot(function(snap){
        sawSnapshot = true;
        applySnapshot(snap, 'Live');
      }, function(e){`);

/**
 * Every token the added CSS uses must be defined in the artifact itself.
 *
 * check_css_tokens.cjs cannot do this one. It checks the site's stylesheets against the site's
 * tokens, and this file's CSS belongs to a different document with its own :root, so to that gate
 * every --accent here looks undefined. The check still needs doing, because a var() with no
 * definition and no fallback drops the whole declaration silently, so it is done here instead,
 * against the file that actually carries the definitions.
 */
const usedTokens = new Set();
for (const m of html.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
  if (m[2] === ')') usedTokens.add(m[1]); // no fallback, so it has to exist
}
const definedTokens = new Set([...html.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
const missing = [...usedTokens].filter((t) => !definedTokens.has(t));
if (missing.length) {
  throw new Error(`these tokens are used with no definition and no fallback: ${missing.join(', ')}`);
}
console.log(`css tokens: ${usedTokens.size} used without a fallback, all defined`);

fs.writeFileSync(OUT, html);
console.log(`patched ${path.basename(SRC)} -> ${path.basename(OUT)}`);
console.log(`  ${(before / 1024).toFixed(0)} KB -> ${(html.length / 1024).toFixed(0)} KB`);
// Which patches did something this run, and which were already in the published file. Without
// this the run prints the same line whether it changed twelve things or nothing at all, and
// "nothing at all" is the normal state for every patch from an earlier round.
console.log(`  applied now (${applied.length}): ${applied.join(', ') || 'none'}`);
console.log(`  already published (${already.length}): ${already.join(', ') || 'none'}`);

/**
 * One definition of "the same sentence opener", shared by the census and the writing tools.
 *
 * check_guide_openers.cjs measures how formulaic the guide prose is; guide_dump_sections.cjs warns
 * a writer away from the openers that measurement finds. They had separate copies of the rule, and
 * both copies were wrong in the same way: the census header said place names were stripped, and
 * neither one stripped them. That is not cosmetic. 310 of 350 whoFor sections open "<City> suits
 * ...", and 112 prosCons sections open "The case for <City> is ...", and because the name sat
 * inside the five-word window every one of them counted as a unique opener. The corpus's single
 * commonest construction was invisible to the tool built to find it, through a whole campaign of
 * rewriting that reported the field clean.
 *
 *   skeleton(sentence)  -> the five-word opener, place names masked to "place"
 *   isDataFrame(k)      -> true for the openers that quote a measurement rather than a judgement
 *
 * Usage:  const { skeleton, isDataFrame } = require('./lib/guide-openers.cjs');   // from scripts/
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

// The frames that quote a measurement. "Budget around $940 a month" repeats across cities because
// it is the same measurement wearing a different figure, and a reader comparing two pages wants
// those to line up: varying the frame would make the numbers harder to read and the prose no
// better. The habit worth counting is the one in the judgements around them.
const DATA_TEMPLATE = /^(budget|a one bedroom|groceries land|fibre runs|a monthly transit|this is our own|this figure is our own|the time zone is|there is no (digital|remote))/;
const isDataFrame = (k) => DATA_TEMPLATE.test(k);

// Every place name on the site. Names are matched WHOLE rather than word by word, which two
// failures made necessary. A name is folded before splitting, or an accent shatters it into
// fragments that are ordinary words: "Setúbal" became "set" and "bal" under the character-class
// strip, and "set" then masked all sixteen "Set against that ..." sentences, hiding the very kind
// of construction this exists to count. And a demonym inside a country name must not mask on its
// own: "American Samoa", "French Polynesia" and "English Harbour" are places, but "American
// medical care", "French is the working language" and "English is widely spoken" are sentences
// about this corpus's most-discussed subjects.
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

const PHRASES = new Map();   // first word -> word arrays, longest first
const TOKENS = new Set();    // single-word names, safe to mask on their own
for (const c of CITIES) {
  for (const name of [c.name, c.country]) {
    const w = fold(String(name || ''));
    if (!w.length) continue;
    if (w.length === 1) { if (w[0].length > 2) TOKENS.add(w[0]); continue; }
    if (!PHRASES.has(w[0])) PHRASES.set(w[0], []);
    PHRASES.get(w[0]).push(w);
  }
}
for (const list of PHRASES.values()) list.sort((a, b) => b.length - a.length);
// Single-word names that are ordinary English words far more often than they are the place. "Solo"
// is a city in Java and "solo travellers" are on every page; "Bath", "Reading", "Split" and "Nice"
// are the same bargain. A word here is only ever a word.
for (const w of 'solo bath reading split nice'.split(' ')) TOKENS.delete(w);

/**
 * The five-word opener of a sentence, with place names masked.
 *
 * A masked name keeps its POSITION (it becomes "place") rather than being deleted, or the window
 * slides and merges constructions that are not the same one. A run of them collapses to a single
 * token, so "The case for Pago Pago is" lands on the same skeleton as "The case for Guam is".
 * Only a capitalised word is masked, so "Reading the small print" keeps its verb.
 *
 * Tokenising is a run of letters, so a hyphen and a digit separate words. Joining "one-bedroom"
 * into one token instead would take it out of DATA_TEMPLATE's reach and put 87 price frames back
 * into the prose census.
 */
function skeleton(s) {
  const raw = String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[A-Za-z]+/g) || [];
  const low = raw.map((w) => w.toLowerCase());
  const out = [];
  for (let i = 0; i < raw.length && out.length < 5; i++) {
    let hit = 0;
    if (/^[A-Z]/.test(raw[i])) {
      for (const p of PHRASES.get(low[i]) || []) {
        if (p.every((w, k) => low[i + k] === w)) { hit = p.length; break; }
      }
      if (!hit && TOKENS.has(low[i])) hit = 1;
    }
    if (hit) {
      if (out[out.length - 1] !== 'place') out.push('place');
      i += hit - 1;
    } else {
      out.push(low[i]);
    }
  }
  return out.join(' ');
}

module.exports = { skeleton, isDataFrame, DATA_TEMPLATE };

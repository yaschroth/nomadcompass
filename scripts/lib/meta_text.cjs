/**
 * Fitting a hand-written sentence and a derived one into a meta description.
 *
 * The ranking and tier-list descriptions are written by hand and go stale: /best/cheapest-cities
 * said "from $700 bases in Vietnam" on a page whose cheapest was Jodhpur at $280 and which listed
 * no Vietnamese city. The fix is to append figures taken from the page's own table at build time,
 * which cannot drift. The problem that creates is length: the hand-written halves already run to
 * about 150 characters, so naively appending anything either overflows or throws the written half
 * away, and the first attempt did the latter on all 32 pages.
 *
 * So the written half is trimmed to make room rather than dropped. It says what the page ranks,
 * which is what a searcher recognises; the derived half carries the numbers, which is what is new
 * to them. Both earn their space.
 *
 * Trimming happens at a sentence boundary first, then at a comma, and never mid-word.
 */

/** Google shows about 155-160 characters of a description on desktop. */
const MAX = 158;

const sentences = (s) => String(s).trim().split(/(?<=[.!?])\s+/).filter(Boolean);

/**
 * As much of `stem` as fits alongside `tail`, then `tail`.
 *
 * Returns the stem alone when there is no tail, and the tail alone only when not even a single
 * clause of the stem will fit beside it.
 */
function fit(stem, tail, max = MAX) {
  const s = String(stem || '').trim();
  const t = String(tail || '').trim();
  if (!t) return s.slice(0, max);
  if (!s) return t;
  if ((s + ' ' + t).length <= max) return s + ' ' + t;

  // Whole sentences of the stem, as many as leave room for the tail.
  const parts = sentences(s);
  for (let n = parts.length - 1; n >= 1; n--) {
    const head = parts.slice(0, n).join(' ');
    if ((head + ' ' + t).length <= max) return head + ' ' + t;
  }

  // One sentence and still too long. Cutting it at a comma was tried and is worse than either half
  // alone: a list cut at a comma loses its remaining items and reads as a bug, which is how the
  // female-nomads tier list came out promising "a safety-led blend of safety".
  //
  // So one half goes, and it is the shorter one. Keeping the derived half by rule left
  // /tier-list/north-america showing 51 characters of "66 cities ranked, none in S tier, led by
  // San Diego." when its written sentence was 109 and said more.
  return t.length >= s.length ? t : s;
}

/** Google starts padding a description from page text below roughly this. */
const MIN = 120;

/**
 * A composed description, closed with whichever tail lands it in the band.
 *
 * The six service generators each build a true sentence out of counts and city names, so their
 * lengths swing with the city: "4 doctors in Agadir who work in English (4)." is 96 characters and
 * the same shape in Abu Dhabi with four languages listed is 165. Both were outside what Google
 * shows, 446 pages of them, and the fix is not to write a different sentence but to close it with
 * one of several endings and pick the ending by the room left.
 *
 * `closers` is ordered longest first. The first that lands inside the band wins; failing that, the
 * longest that fits at all; failing that, the core is trimmed at a sentence boundary, never
 * mid-word.
 */
function band(core, closers = [], min = MIN, max = MAX) {
  const c = String(core || '').trim().replace(/\s+/g, ' ');
  const list = closers.map((x) => String(x).trim()).filter(Boolean);
  const fits = list.filter((x) => (c + ' ' + x).length <= max);
  const inBand = fits.filter((x) => (c + ' ' + x).length >= min);
  if (inBand.length) return c + ' ' + inBand[0];
  // The core is never trimmed. It is what the caller decided the page must say, and on the service
  // pages that includes every language the page serves, which check_service_pages requires: cut it
  // and a reader looking for an Italian-speaking lawyer in Madrid never reaches the page holding
  // ten of them. Two attempts at trimming did real damage, one cutting mid-word to "...Catalan (3)
  // and Chine" and one dropping the sentence naming the languages outright.
  //
  // So this function only ever adds. Over the display budget beats wrong.
  return c;
}

module.exports = { fit, band, sentences, MAX, MIN };

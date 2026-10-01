/**
 * Practice areas a lawyer's source records, read from the row's own note.
 *
 * Searchers ask for the work, not only the language: "property lawyer in Split" and "real estate
 * lawyer in Split" were 153 impressions a month on a page whose title and intro said only "lawyers".
 * The data already held the answer. The UK Foreign Office lists give each firm's legal expertise
 * ("bankruptcy, corporate, real estate"), the German embassy lists give Fachgebiete
 * ("Immobilienrecht, Familienrecht"), the French ones a domaine ("droit immobilier"). This module is
 * the one place that reads them, so the pair page that states a count and the gate that checks the
 * count can never disagree about what "real estate" matches.
 *
 * A row with no recorded practice area matches nothing. That is not a claim that the lawyer does not
 * do the work, which is why every sentence built on these counts says "their sources record".
 *
 * "intellectual property" is not property law, and it sits in most of the Foreign Office lists, so
 * the bare word "property" only counts when "intellectual" is not in front of it.
 */
const AREAS = [
  {
    key: 'property',
    label: 'real estate',
    re: /\breal[ -]estate\b|immobilien|\bimmobilier|inmobiliari|imobili[aá]ri|immobiliare|conveyanc|(?<!intellectual )\bproperty\b/i,
  },
  {
    key: 'company',
    label: 'company law',
    re: /\bcorporate\b|gesellschaftsrecht|firmengr[uü]ndung|unternehmensgr[uü]ndung|company law|droit des soci[eé]t[eé]s|des soci[eé]t[eé]s|mercantil|societ[aá]rio/i,
  },
  {
    key: 'immigration',
    label: 'immigration',
    re: /immigration|einwanderung|ausl[aä]nder|aufenthalt|des [eé]trangers|extranjer|imigra|\bvisas?\b|\bresidency\b/i,
  },
];
const BY_KEY = Object.fromEntries(AREAS.map((a) => [a.key, a]));

/** Whether the row's source records this practice area. */
const handles = (row, key) => BY_KEY[key].re.test(String((row && row.note) || ''));

/** [{ key, label, n }] for the areas at least one row records, biggest first. */
function counts(rows) {
  return AREAS
    .map((a) => ({ key: a.key, label: a.label, n: rows.filter((r) => a.re.test(String(r.note || ''))).length }))
    .filter((a) => a.n > 0)
    .sort((a, b) => b.n - a.n);
}

/** The title words that make a count a property count, for the gate. */
const PROPERTY_TITLE = /\bproperty lawyers?\b|\breal[ -]estate lawyers?\b/i;

module.exports = { AREAS, handles, counts, PROPERTY_TITLE };

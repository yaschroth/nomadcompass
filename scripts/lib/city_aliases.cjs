/**
 * City aliases and letter folding shared by every reader that places a provider in one of our cities
 * from free text. Lifted out of ingest_verified_sources.cjs (2026-10-13) so a second reader does not
 * grow a third, smaller copy that silently misses "Spalato" or "Wien".
 */
const ALIASES = {
  rome: ['roma'],
  milan: ['milano', 'mailand'],
  florence: ['firenze', 'florenz'],
  naples: ['napoli', 'neapel'],
  turin: ['torino'],
  venice: ['venezia', 'venedig'],
  genoa: ['genova'],
  bologna: ['bologna'],
  lisbon: ['lisboa', 'lissabon', 'lisbonne'],
  porto: ['oporto'],
  seville: ['sevilla'],
  vienna: ['wien', 'vienne'],
  // French, because the French consulates write their own names for our cities, and the 34 medical
  // lists added on 2026-09-22 placed Vienna's 138 doctors "elsewhere" for saying "1180 Vienne".
  // "Vienne" is also a town near Lyon: that is safe, because a French list naming it finds a city
  // in another country, placeOf keeps the list's own city, and the row is refused as elsewhere.
  singapore: ['singapour'],
  thessaloniki: ['salonique'],
  beijing: ['pekin'],
  valletta: ['la valette'],
  santodomingo: ['saint-domingue', 'saint domingue'],
  pondicherry: ['pondichery'],
  cairo: ['le caire'],
  munich: ['munchen', 'muenchen'],
  cologne: ['koln', 'koeln'],
  prague: ['praha', 'prag'],
  warsaw: ['warszawa', 'warschau', 'varsovie'],
  krakow: ['krakau'],
  copenhagen: ['kobenhavn', 'kopenhagen', 'copenhague'],
  gothenburg: ['goteborg'],
  brussels: ['bruxelles', 'brussel', 'brussels'],
  antwerp: ['antwerpen', 'anvers'],
  geneva: ['geneve', 'genf'],
  zurich: ['zuerich'],
  belgrade: ['beograd'],
  bucharest: ['bucuresti', 'bukarest', 'bucarest'],
  athens: ['athen', 'athina', 'athenes'],
  nicosia: ['lefkosia', 'lefkosa'],
  moscow: ['moskva', 'moskau'],
  // These three keys used to be marrakesh, hochiminh and riodejaneiro, which are not our slugs, so the
  // aliases never matched and nine verified sources filed under those names gave no rows at all.
  marrakech: ['marrakesh'],
  bogota: ['bogota'],
  medellin: ['medellin'],
  santiago: ['santiago de chile'],
  dublin: ['baile atha cliath'],
  hochiminhcity: ['ho chi minh', 'hcmc', 'saigon'],
  saopaulo: ['sao paulo'],
  rio: ['rio de janeiro'],
  mexicocity: ['mexico, d.f.', 'ciudad de mexico', 'cdmx', 'mexico city'],
  buenosaires: ['buenos aires'],
  capetown: ['cape town', 'kapstadt', 'le cap'],
  telaviv: ['tel aviv', 'tel-aviv'],
  kualalumpur: ['kuala lumpur'],
  tbilisi: ['tiflis', 'tbilissi'],
  almaty: ['almaty', 'alma-ata'],
  yerevan: ['jerewan', 'eriwan'],
  seoul: ['seoul'],
  taipei: ['taipeh'],
  bali: ['denpasar', 'kuta', 'ubud', 'seminyak'],
  chiangmai: ['chiang mai'],
};
// French exonyms found by the French-list parse of 2026-09-24: 31 rows read to "not in our cities"
// because the lists wrote Hambourg, Francfort, Koweit or Alexandrie. Merged into ALIASES rather than
// written into it, so a key it already had keeps its own entries.
const MORE_ALIASES = {"hamburg":["hambourg"],"frankfurt":["francfort"],"nuremberg":["nurnberg","nuernberg"],"thehague":["la haye","den haag"],"guangzhou":["canton"],"riyadh":["riyad","riad"],"jeddah":["djeddah"],"addisababa":["addis abeba"],"newdelhi":["delhi"],"kuwait":["koweit"],"london":["londres"],"alexandria":["alexandrie"],"siena":["sienne"]};
for (const [k, v] of Object.entries(MORE_ALIASES)) ALIASES[k] = [...new Set([...(ALIASES[k] || []), ...v])];
// From the UK and US consular parses of the same day. "cyprus" is the site's whole-island page, so
// Nicosia, Limassol and Larnaca place there (Paphos has its own); the Indian cities go by their
// renamed spellings; Panama and Palma are here because the town reader takes "Panama City" as
// "Panama" and "Palma de Mallorca" as "Palma", which must still find the city.
const UK_US_ALIASES = {
  cyprus: ['nicosia', 'lefkosia', 'limassol', 'lemesos', 'larnaca'], tirana: ['tirane'], shkoder: ['shkodra'],
  vlore: ['vlora'], bangalore: ['bengaluru'], mysore: ['mysuru'], pondicherry: ['pondichery', 'puducherry'],
  kolkata: ['calcutta'], kochi: ['cochin', 'ernakulam'], jeju: ['jeju-si', 'jeju city'], ghent: ['gent'],
  yangon: ['rangoon'], panama: ['panama'], palma: ['palma'],
  brussels: ['uccle', 'ixelles', 'etterbeek', 'jette', 'auderghem', 'woluwe-saint-lambert', 'woluwe-saint-pierre', 'watermael-boitsfort', 'schaerbeek', 'saint-gilles', 'anderlecht'],
};
for (const [k, v] of Object.entries(UK_US_ALIASES)) ALIASES[k] = [...new Set([...(ALIASES[k] || []), ...v])];
// The German missions write our cities in German or in the local form: Peking, Kairo, Kanton, Alger,
// Jbeil. La Paz is the city's own name and needs no alias.
const DE_ALIASES = {
  beijing: ['peking'], algiers: ['alger'], byblos: ['jbeil'], panama: ['ciudad de panama'],
  guangzhou: ['kanton'], manila: ['metro manila'], cairo: ['kairo'],
};
for (const [k, v] of Object.entries(DE_ALIASES)) ALIASES[k] = [...new Set([...(ALIASES[k] || []), ...v])];
// The Italian and Polish missions' names for our cities (Monaco di Baviera, Francoforte, Salonicco,
// Wilno, Bruksela, Kopenhaga...), from the Italian, Polish and Spanish consular parses of 2026-09-24.
const EXONYMS = {
  munich: ['monaco di baviera'],
  frankfurt: ['francoforte'],
  nuremberg: ['norimberga'],
  regensburg: ['ratisbona'],
  freiburg: ['friburgo'],
  cologne: ['colonia'],
  stuttgart: ['stoccarda'],
  athens: ['atene', 'ateny', 'atenas'],
  thessaloniki: ['salonicco', 'saloniki', 'salonica'],
  zagreb: ['zagabria'],
  rijeka: ['fiume'],
  split: ['spalato'],
  vilnius: ['wilno'],
  kaunas: ['kowno'],
  brussels: ['bruksela'],
  antwerp: ['antwerpia'],
  riga: ['ryga'],
  shanghai: ['szanghaj'],
  istanbul: ['stambul'],
  copenhagen: ['kopenhaga', 'kobenhavn k'],
  basel: ['basilea', 'bazylea'],
  zurich: ['zurigo', 'zurych'],
  geneva: ['ginevra', 'genewa'],
  lausanne: ['losanna', 'lozanna'],
  jerusalem: ['gerusalemme'],
  tunis: ['tunisi'],
  algiers: ['algeri', 'alger'],
  constantine: ['costantina'],
  ljubljana: ['lubiana'],
  warsaw: ['varsavia'],
  krakow: ['cracovia'],
  gdansk: ['danzica'],
  wroclaw: ['wrocław', 'breslavia', 'wroclaw'],
  bialystok: ['białystok'],
  thehague: ["l'aia"],
  dublin: ['dublino'],
  strasbourg: ['strasburgo'],
  lisbon: ['lizbona'],
  prague: ['praga'],
  vienna: ['wieden'],
  beirut: ['bejrut'],
  tirana: ['tiranie'],
  belfast: ['belfaście'],
  crete: ['heraklion', 'irakleio', 'iraklio'],
  corfu: ['kerkyra'],
  patras: ['patrasso', 'patra'],
  oran: ['orano'],
  phoenix: ['pheonix'],
  cyprus: ['nicosia', 'lefkosia'],
};
for (const [k, v] of Object.entries(EXONYMS)) ALIASES[k] = [...new Set([...(ALIASES[k] || []), ...v])];

/**
 * The letters NFD cannot take apart: a stroke or a missing dot is part of the letter, not an accent on
 * it. Without this "Wrocław" folded to "wrocław" and never matched the city, and "Diyarbakır" kept its
 * dotless i. Small letters, because everything folded is compared in small letters.
 */
const unstroke = (s) => String(s || '').replace(/ß/g, 'ss').replace(/[łŁ]/g, 'l').replace(/[øØ]/g, 'o')
  .replace(/[đĐðÐ]/g, 'd').replace(/ı/g, 'i').replace(/[æÆ]/g, 'ae').replace(/[œŒ]/g, 'oe')
  .replace(/[þÞ]/g, 'th').replace(/[ħĦ]/g, 'h');

const fold = (s) => unstroke(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

module.exports = { ALIASES, unstroke, fold };

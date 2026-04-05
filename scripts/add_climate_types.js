/**
 * Add climate types to cities-data.js
 * Based on Köppen climate classification simplified for users
 */

const fs = require('fs');
const path = require('path');

// Climate type mapping for all cities
// Categories: Tropical, Arid, Mediterranean, Oceanic, Humid Subtropical, Continental, Subarctic, Highland, Monsoon
const CLIMATE_TYPES = {
  // Middle East & North Africa - mostly Arid
  abudhabi: 'Arid',
  dubai: 'Arid',
  doha: 'Arid',
  muscat: 'Arid',
  cairo: 'Arid',
  marrakech: 'Arid',
  casablanca: 'Mediterranean',
  rabat: 'Mediterranean',
  tunis: 'Mediterranean',
  amman: 'Mediterranean',
  beirut: 'Mediterranean',
  telaviv: 'Mediterranean',

  // Sub-Saharan Africa
  accra: 'Tropical',
  addisababa: 'Highland',
  dakar: 'Tropical',
  daressalaam: 'Tropical',
  johannesburg: 'Highland',
  kigali: 'Highland',
  lagos: 'Tropical',
  nairobi: 'Highland',
  capetown: 'Mediterranean',
  zanzibar: 'Tropical',
  mauritius: 'Tropical',

  // Southeast Asia - mostly Tropical
  bangkok: 'Tropical',
  chiangmai: 'Tropical',
  hanoi: 'Humid Subtropical',
  hochiminhcity: 'Tropical',
  hoian: 'Tropical',
  nhatrang: 'Tropical',
  danang: 'Tropical',
  phnompenh: 'Tropical',
  siemreap: 'Tropical',
  vientiane: 'Tropical',
  kualalumpur: 'Tropical',
  penang: 'Tropical',
  ipoh: 'Tropical',
  langkawi: 'Tropical',
  singapore: 'Tropical',
  manila: 'Tropical',
  cebu: 'Tropical',
  bali: 'Tropical',
  ubud: 'Tropical',
  canggu: 'Tropical',
  yogyakarta: 'Tropical',
  phuket: 'Tropical',
  kohphangan: 'Tropical',
  kohsamui: 'Tropical',
  huahin: 'Tropical',
  phuquoc: 'Tropical',

  // East Asia
  tokyo: 'Humid Subtropical',
  osaka: 'Humid Subtropical',
  kyoto: 'Humid Subtropical',
  fukuoka: 'Humid Subtropical',
  nagoya: 'Humid Subtropical',
  sapporo: 'Continental',
  seoul: 'Continental',
  busan: 'Humid Subtropical',
  jeju: 'Humid Subtropical',
  taipei: 'Humid Subtropical',
  hongkong: 'Humid Subtropical',
  shenzhen: 'Humid Subtropical',

  // South Asia
  mumbai: 'Tropical',
  bangalore: 'Tropical',
  goa: 'Tropical',
  pune: 'Tropical',
  jaipur: 'Arid',
  kochi: 'Tropical',
  colombo: 'Tropical',
  weligama: 'Tropical',
  kathmandu: 'Humid Subtropical',
  pokhara: 'Humid Subtropical',

  // Central Asia & Caucasus
  tbilisi: 'Humid Subtropical',
  batumi: 'Humid Subtropical',
  yerevan: 'Continental',
  baku: 'Arid',

  // Western Europe - mostly Oceanic
  london: 'Oceanic',
  manchester: 'Oceanic',
  edinburgh: 'Oceanic',
  dublin: 'Oceanic',
  cork: 'Oceanic',
  paris: 'Oceanic',
  lyon: 'Oceanic',
  brussels: 'Oceanic',
  ghent: 'Oceanic',
  antwerp: 'Oceanic',
  amsterdam: 'Oceanic',
  rotterdam: 'Oceanic',
  utrecht: 'Oceanic',
  hamburg: 'Oceanic',
  berlin: 'Continental',

  // Northern Europe
  copenhagen: 'Oceanic',
  stockholm: 'Continental',
  oslo: 'Continental',
  helsinki: 'Continental',
  reykjavik: 'Subarctic',
  stavanger: 'Oceanic',

  // Central Europe
  vienna: 'Continental',
  zurich: 'Oceanic',
  geneva: 'Oceanic',
  prague: 'Continental',
  brno: 'Continental',
  warsaw: 'Continental',
  krakow: 'Continental',
  wroclaw: 'Continental',
  poznan: 'Continental',
  gdansk: 'Oceanic',
  budapest: 'Continental',

  // Baltic States
  tallinn: 'Continental',
  riga: 'Continental',
  vilnius: 'Continental',

  // Southern Europe - mostly Mediterranean
  lisbon: 'Mediterranean',
  porto: 'Mediterranean',
  faro: 'Mediterranean',
  ericeira: 'Mediterranean',
  madrid: 'Mediterranean',
  barcelona: 'Mediterranean',
  valencia: 'Mediterranean',
  seville: 'Mediterranean',
  malaga: 'Mediterranean',
  bilbao: 'Oceanic',
  gijon: 'Oceanic',
  tarifa: 'Mediterranean',
  laspalmas: 'Arid',
  tenerife: 'Arid',
  fuerteventura: 'Arid',
  rome: 'Mediterranean',
  milan: 'Humid Subtropical',
  florence: 'Mediterranean',
  palermo: 'Mediterranean',
  nice: 'Mediterranean',
  athens: 'Mediterranean',
  thessaloniki: 'Mediterranean',
  crete: 'Mediterranean',
  malta: 'Mediterranean',
  valletta: 'Mediterranean',
  cyprus: 'Mediterranean',

  // Balkans & Southeast Europe
  split: 'Mediterranean',
  dubrovnik: 'Mediterranean',
  zagreb: 'Continental',
  ljubljana: 'Continental',
  belgrade: 'Continental',
  bucharest: 'Continental',
  clujnapoca: 'Continental',
  sofia: 'Continental',
  plovdiv: 'Continental',
  sarajevo: 'Continental',
  podgorica: 'Mediterranean',
  tirana: 'Mediterranean',
  skopje: 'Continental',

  // Turkey
  istanbul: 'Mediterranean',
  antalya: 'Mediterranean',

  // North America
  vancouver: 'Oceanic',
  toronto: 'Continental',
  montreal: 'Continental',
  austin: 'Humid Subtropical',
  miami: 'Tropical',
  denver: 'Continental',
  seattle: 'Oceanic',
  portland: 'Oceanic',

  // Mexico & Central America
  mexicocity: 'Highland',
  guadalajara: 'Highland',
  oaxaca: 'Highland',
  sanmigueldeallende: 'Highland',
  guanajuato: 'Highland',
  merida: 'Tropical',
  playadelcarmen: 'Tropical',
  tulum: 'Tropical',
  puertovallarta: 'Tropical',
  sayulita: 'Tropical',
  puertoescondido: 'Tropical',
  sanjosecr: 'Tropical',
  tamarindo: 'Tropical',
  boquete: 'Highland',
  panama: 'Tropical',
  antigua: 'Highland',
  lakeatitlan: 'Highland',

  // Caribbean
  sanjuan: 'Tropical',
  santodomingo: 'Tropical',
  puntacana: 'Tropical',

  // South America
  bogota: 'Highland',
  medellin: 'Highland',
  cartagena: 'Tropical',
  cali: 'Tropical',
  santamarta: 'Tropical',
  quito: 'Highland',
  cuenca: 'Highland',
  montanita: 'Tropical',
  lima: 'Arid',
  cusco: 'Highland',
  arequipa: 'Arid',
  lapaz: 'Highland',
  santacruz: 'Tropical',
  asuncion: 'Humid Subtropical',
  buenosaires: 'Humid Subtropical',
  cordoba: 'Humid Subtropical',
  mendoza: 'Arid',
  bariloche: 'Oceanic',
  montevideo: 'Humid Subtropical',
  santiago: 'Mediterranean',
  valparaiso: 'Mediterranean',
  saopaulo: 'Humid Subtropical',
  florianopolis: 'Humid Subtropical',
  salvador: 'Tropical',

  // Morocco coastal
  essaouira: 'Mediterranean',
  chefchaouen: 'Mediterranean',
  taghazout: 'Mediterranean',

  // Australia & New Zealand
  sydney: 'Humid Subtropical',
  melbourne: 'Oceanic',
  brisbane: 'Humid Subtropical',
  perth: 'Mediterranean',
  adelaide: 'Mediterranean',
  goldcoast: 'Humid Subtropical',
  byronbay: 'Humid Subtropical',
  cairns: 'Tropical',
  hobart: 'Oceanic',
  auckland: 'Oceanic',
  wellington: 'Oceanic',
  christchurch: 'Oceanic',
  queenstown: 'Oceanic',
};

function updateCitiesData() {
  const filePath = path.join(__dirname, '..', 'cities-data.js');
  let content = fs.readFileSync(filePath, 'utf-8');

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const [cityId, climateType] of Object.entries(CLIMATE_TYPES)) {
    // Find the city and add climateType after the id line (only if not already present)
    const pattern = new RegExp(`(id: "${cityId}",\\n)(?!\\s*climateType:)`);

    if (pattern.test(content)) {
      content = content.replace(pattern, `$1    climateType: "${climateType}",\n`);
      updatedCount++;
    } else if (!content.includes(`id: "${cityId}"`)) {
      console.log(`City not found: ${cityId}`);
      notFoundCount++;
    }
    // else: already has climateType, skip silently
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${updatedCount} cities with climate types`);
  if (notFoundCount > 0) {
    console.log(`${notFoundCount} cities not found in data file`);
  }
}

updateCitiesData();

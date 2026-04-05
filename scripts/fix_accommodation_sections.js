/**
 * Fix and regenerate accommodation sections with city-specific dummy data
 */

const fs = require('fs');
const path = require('path');

// Accommodation name templates - will be combined with city names
const COLIVING_NAMES = ['Nomad House', 'Hub Coliving', 'Remote Base', 'Wanderer\'s Home', 'Digital Den', 'Cozy Collective', 'The Hive', 'Basecamp', 'Tribe House', 'Nest Coliving'];
const APARTMENT_TYPES = ['Central Loft', 'Old Town Flat', 'Modern Studio', 'Downtown Apartment', 'City View Suite', 'Urban Retreat', 'Historic Quarter Flat', 'Riverside Apartment', 'Garden Studio', 'Penthouse Loft'];
const HOSTEL_NAMES = ['Backpackers Inn', 'Social Hostel', 'Nomad Hostel', 'The Common Room', 'Wanderlust House', 'Adventure Lodge', 'Traveler\'s Rest', 'Global Village', 'Journey House', 'Explorer\'s Den'];

// Descriptions for each type
const COLIVING_DESCS = [
  'Modern coliving space with dedicated coworking area. Fast WiFi, weekly events, and a vibrant community of remote workers.',
  'Purpose-built for digital nomads with private rooms and shared common spaces. Includes coworking, gym access, and regular networking events.',
  'Popular coliving spot with rooftop terrace and 24/7 workspace. Monthly rates available with all utilities included.'
];

const APARTMENT_DESCS = [
  'Fully furnished apartment in a prime location. High-speed WiFi, equipped kitchen, and walking distance to cafes and restaurants.',
  'Stylish apartment with dedicated workspace. Monthly discounts available, great reviews from remote workers.',
  'Comfortable apartment with all amenities for long stays. Quiet neighborhood, reliable internet, and helpful host.'
];

const HOSTEL_DESCS = [
  'Social hostel with a great atmosphere for meeting fellow travelers. Common area doubles as a coworking space during the day.',
  'Budget-friendly option with private rooms available. Free breakfast, fast WiFi, and regular social events.',
  'Well-reviewed hostel in a central location. Clean facilities, helpful staff, and a mix of dorms and private rooms.'
];

// Price ranges by region (rough estimates)
const PRICE_DATA = {
  asia: { coliving: '$400-800/month', apartment: '$25-60/night', hostel: '$8-20/night' },
  europe: { coliving: '€800-1500/month', apartment: '€50-120/night', hostel: '€15-35/night' },
  latinamerica: { coliving: '$500-900/month', apartment: '$30-70/night', hostel: '$10-25/night' },
  africa: { coliving: '$400-700/month', apartment: '$25-55/night', hostel: '$8-18/night' },
  middleeast: { coliving: '$600-1200/month', apartment: '$40-90/night', hostel: '$12-30/night' },
  oceania: { coliving: 'A$1200-2000/month', apartment: 'A$80-150/night', hostel: 'A$25-50/night' },
  northamerica: { coliving: '$800-1500/month', apartment: '$60-120/night', hostel: '$20-45/night' }
};

// Map cities to regions
const CITY_REGIONS = {
  // Asia
  tokyo: 'asia', osaka: 'asia', kyoto: 'asia', fukuoka: 'asia', bangkok: 'asia', chiangmai: 'asia',
  phuket: 'asia', kohsamui: 'asia', krabi: 'asia', hanoi: 'asia', hochiminhcity: 'asia', danang: 'asia',
  hoian: 'asia', bali: 'asia', canggu: 'asia', ubud: 'asia', jakarta: 'asia', kualalumpur: 'asia',
  penang: 'asia', langkawi: 'asia', singapore: 'asia', manila: 'asia', cebu: 'asia', taipei: 'asia',
  seoul: 'asia', busan: 'asia', hongkong: 'asia', macau: 'asia', shanghai: 'asia', beijing: 'asia',
  chengdu: 'asia', shenzhen: 'asia', bangalore: 'asia', mumbai: 'asia', delhi: 'asia', goa: 'asia',
  kolkata: 'asia', jaipur: 'asia', colombo: 'asia', kathmandu: 'asia', phnom_penh: 'asia', siemreap: 'asia',
  vientiane: 'asia', luangprabang: 'asia', yangon: 'asia',

  // Europe
  lisbon: 'europe', porto: 'europe', faro: 'europe', ericeira: 'europe', madeira: 'europe',
  barcelona: 'europe', madrid: 'europe', valencia: 'europe', seville: 'europe', malaga: 'europe',
  bilbao: 'europe', gijon: 'europe', grancanaria: 'europe', tenerife: 'europe', fuerteventura: 'europe',
  berlin: 'europe', munich: 'europe', hamburg: 'europe', frankfurt: 'europe', cologne: 'europe',
  amsterdam: 'europe', rotterdam: 'europe', paris: 'europe', lyon: 'europe', nice: 'europe',
  marseille: 'europe', bordeaux: 'europe', london: 'europe', manchester: 'europe', edinburgh: 'europe',
  dublin: 'europe', cork: 'europe', galway: 'europe', rome: 'europe', milan: 'europe', florence: 'europe',
  naples: 'europe', venice: 'europe', bologna: 'europe', palermo: 'europe', vienna: 'europe',
  prague: 'europe', brno: 'europe', budapest: 'europe', warsaw: 'europe', krakow: 'europe', gdansk: 'europe',
  wroclaw: 'europe', bucharest: 'europe', clujnapoca: 'europe', sofia: 'europe', plovdiv: 'europe',
  belgrade: 'europe', zagreb: 'europe', split: 'europe', dubrovnik: 'europe', ljubljana: 'europe',
  tallinn: 'europe', riga: 'europe', vilnius: 'europe', helsinki: 'europe', stockholm: 'europe',
  copenhagen: 'europe', oslo: 'europe', reykjavik: 'europe', athens: 'europe', thessaloniki: 'europe',
  crete: 'europe', rhodes: 'europe', corfu: 'europe', santorini: 'europe', cyprus: 'europe',
  malta: 'europe', brussels: 'europe', ghent: 'europe', antwerp: 'europe', geneva: 'europe',
  zurich: 'europe', basel: 'europe', luxembourg: 'europe', monaco: 'europe', tbilisi: 'europe',
  batumi: 'europe', yerevan: 'europe', kyiv: 'europe', lviv: 'europe', odessa: 'europe',
  chisinau: 'europe', tirana: 'europe', sarajevo: 'europe', skopje: 'europe', podgorica: 'europe',
  pristina: 'europe',

  // Latin America
  mexicocity: 'latinamerica', guadalajara: 'latinamerica', oaxaca: 'latinamerica', playadelcarmen: 'latinamerica',
  tulum: 'latinamerica', cancun: 'latinamerica', puertovallarta: 'latinamerica', sanmigueldeallende: 'latinamerica',
  merida: 'latinamerica', guanajuato: 'latinamerica', buenosaires: 'latinamerica', mendoza: 'latinamerica',
  cordoba: 'latinamerica', bariloche: 'latinamerica', saopaulo: 'latinamerica', riodejaneiro: 'latinamerica',
  florianopolis: 'latinamerica', salvador: 'latinamerica', recife: 'latinamerica', fortaleza: 'latinamerica',
  bogota: 'latinamerica', medellin: 'latinamerica', cartagena: 'latinamerica', cali: 'latinamerica',
  santamarta: 'latinamerica', lima: 'latinamerica', cusco: 'latinamerica', arequipa: 'latinamerica',
  santiago: 'latinamerica', valparaiso: 'latinamerica', quito: 'latinamerica', cuenca: 'latinamerica',
  montevideo: 'latinamerica', asuncion: 'latinamerica', lapaz: 'latinamerica', sucre: 'latinamerica',
  panama: 'latinamerica', boquete: 'latinamerica', sanjose: 'latinamerica', antigua: 'latinamerica',
  sanjuan: 'latinamerica', havana: 'latinamerica', santodomingo: 'latinamerica',

  // Africa
  capetown: 'africa', johannesburg: 'africa', durban: 'africa', nairobi: 'africa', mombasa: 'africa',
  daressalaam: 'africa', zanzibar: 'africa', kampala: 'africa', kigali: 'africa', addisababa: 'africa',
  accra: 'africa', lagos: 'africa', dakar: 'africa', marrakech: 'africa', casablanca: 'africa',
  essaouira: 'africa', fez: 'africa', tangier: 'africa', chefchaouen: 'africa', tunis: 'africa',
  cairo: 'africa', luxor: 'africa', hurghada: 'africa', mauritius: 'africa',

  // Middle East
  dubai: 'middleeast', abudhabi: 'middleeast', doha: 'middleeast', muscat: 'middleeast',
  telaviv: 'middleeast', jerusalem: 'middleeast', amman: 'middleeast', beirut: 'middleeast',
  istanbul: 'middleeast', antalya: 'middleeast', izmir: 'middleeast', bodrum: 'middleeast', baku: 'middleeast',

  // Oceania
  sydney: 'oceania', melbourne: 'oceania', brisbane: 'oceania', perth: 'oceania', adelaide: 'oceania',
  goldcoast: 'oceania', cairns: 'oceania', hobart: 'oceania', darwin: 'oceania', byronbay: 'oceania',
  auckland: 'oceania', wellington: 'oceania', christchurch: 'oceania', queenstown: 'oceania',

  // North America
  newyork: 'northamerica', losangeles: 'northamerica', sanfrancisco: 'northamerica', miami: 'northamerica',
  austin: 'northamerica', denver: 'northamerica', seattle: 'northamerica', portland: 'northamerica',
  chicago: 'northamerica', boston: 'northamerica', lasvegas: 'northamerica', sandiego: 'northamerica',
  honolulu: 'northamerica', toronto: 'northamerica', vancouver: 'northamerica', montreal: 'northamerica'
};

function getRegion(cityId) {
  return CITY_REGIONS[cityId] || 'asia'; // Default to Asia pricing
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateAccommodations(cityId, cityName) {
  const hash = hashString(cityId);
  const region = getRegion(cityId);
  const prices = PRICE_DATA[region];

  // Pick names based on hash for consistency
  const colivingName = COLIVING_NAMES[hash % COLIVING_NAMES.length];
  const apartmentType = APARTMENT_TYPES[(hash + 3) % APARTMENT_TYPES.length];
  const hostelName = HOSTEL_NAMES[(hash + 7) % HOSTEL_NAMES.length];

  // Pick descriptions
  const colivingDesc = COLIVING_DESCS[hash % COLIVING_DESCS.length];
  const apartmentDesc = APARTMENT_DESCS[(hash + 1) % APARTMENT_DESCS.length];
  const hostelDesc = HOSTEL_DESCS[(hash + 2) % HOSTEL_DESCS.length];

  return [
    {
      name: `${cityName} ${colivingName}`,
      type: 'Coliving',
      price: prices.coliving,
      desc: colivingDesc
    },
    {
      name: `${apartmentType}`,
      type: 'Apartment',
      price: prices.apartment,
      desc: apartmentDesc
    },
    {
      name: `${hostelName}`,
      type: 'Hostel',
      price: prices.hostel,
      desc: hostelDesc
    }
  ];
}

// Get all city HTML files
const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let errorCount = 0;

cityFiles.forEach(filename => {
  const cityId = filename.replace('.html', '');
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Extract city name from the page title or h1
  const cityNameMatch = content.match(/<h1 class="city-hero-title">([^<]+)<\/h1>/);
  const cityName = cityNameMatch ? cityNameMatch[1].split(',')[0].trim() : cityId;

  // Generate accommodations for this city
  const accommodations = generateAccommodations(cityId, cityName);

  // Create new accommodation section HTML
  const newAccommodationSection = `
    <!-- Accommodation -->
    <section class="affiliate-section accommodation-section">
      <div class="container">
        <div class="section-header">
          <h2>Where to Stay</h2>
          <p>Best accommodation options for nomads in ${cityName}</p>
        </div>
        <div class="affiliate-grid">
          <article class="eat-card">
            <h3 class="eat-card-name">${accommodations[0].name}</h3>
            <div class="eat-card-type">${accommodations[0].type} • ${accommodations[0].price}</div>
            <p class="eat-card-description">${accommodations[0].desc}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>
          </article>
          <article class="eat-card">
            <h3 class="eat-card-name">${accommodations[1].name}</h3>
            <div class="eat-card-type">${accommodations[1].type} • ${accommodations[1].price}</div>
            <p class="eat-card-description">${accommodations[1].desc}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>
          </article>
          <article class="eat-card">
            <h3 class="eat-card-name">${accommodations[2].name}</h3>
            <div class="eat-card-type">${accommodations[2].type} • ${accommodations[2].price}</div>
            <p class="eat-card-description">${accommodations[2].desc}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>
          </article>
        </div>
      </div>
    </section>`;

  // Remove existing accommodation section and replace it
  // Pattern to match the entire accommodation section
  const accommodationPattern = /\s*<!-- Accommodation -->\s*<section class="affiliate-section accommodation-section">[\s\S]*?<\/section>/;

  if (accommodationPattern.test(content)) {
    content = content.replace(accommodationPattern, newAccommodationSection);
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
  } else {
    console.log(`Could not find accommodation section in: ${cityId}`);
    errorCount++;
  }
});

console.log(`Updated ${updatedCount} city pages with unique accommodations`);
if (errorCount > 0) {
  console.log(`Errors: ${errorCount} pages`);
}

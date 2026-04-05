/**
 * Add missing lat, lng, costPerMonth to cities
 */

const fs = require('fs');
const path = require('path');

// City coordinates and estimated costs (based on cost score)
const CITY_DATA = {
  copenhagen: { lat: 55.6761, lng: 12.5683, cost: 2800 },
  stockholm: { lat: 59.3293, lng: 18.0686, cost: 2600 },
  oslo: { lat: 59.9139, lng: 10.7522, cost: 3000 },
  helsinki: { lat: 60.1699, lng: 24.9384, cost: 2400 },
  reykjavik: { lat: 64.1466, lng: -21.9426, cost: 3200 },
  brussels: { lat: 50.8503, lng: 4.3517, cost: 2000 },
  ljubljana: { lat: 46.0569, lng: 14.5058, cost: 1500 },
  zagreb: { lat: 45.8150, lng: 15.9819, cost: 1200 },
  dubrovnik: { lat: 42.6507, lng: 18.0944, cost: 1800 },
  gdansk: { lat: 54.3520, lng: 18.6466, cost: 1100 },
  wroclaw: { lat: 51.1079, lng: 17.0385, cost: 1000 },
  brno: { lat: 49.1951, lng: 16.6068, cost: 1100 },
  rotterdam: { lat: 51.9244, lng: 4.4777, cost: 2200 },
  utrecht: { lat: 52.0907, lng: 5.1214, cost: 2100 },
  faro: { lat: 37.0194, lng: -7.9322, cost: 1400 },
  hamburg: { lat: 53.5511, lng: 9.9937, cost: 2000 },
  cork: { lat: 51.8985, lng: -8.4756, cost: 1800 },
  antwerp: { lat: 51.2194, lng: 4.4025, cost: 1900 },
  ghent: { lat: 51.0543, lng: 3.7174, cost: 1700 },
  osaka: { lat: 34.6937, lng: 135.5023, cost: 1800 },
  kyoto: { lat: 35.0116, lng: 135.7681, cost: 1700 },
  busan: { lat: 35.1796, lng: 129.0756, cost: 1300 },
  fukuoka: { lat: 33.5904, lng: 130.4017, cost: 1400 },
  kochi: { lat: 9.9312, lng: 76.2673, cost: 800 },
  pune: { lat: 18.5204, lng: 73.8567, cost: 700 },
  vientiane: { lat: 17.9757, lng: 102.6331, cost: 800 },
  langkawi: { lat: 6.3500, lng: 99.8000, cost: 900 },
  shenzhen: { lat: 22.5431, lng: 114.0579, cost: 1500 },
  jaipur: { lat: 26.9124, lng: 75.7873, cost: 600 },
  kohsamui: { lat: 9.5120, lng: 100.0136, cost: 1200 },
  nhatrang: { lat: 12.2388, lng: 109.1967, cost: 800 },
  jeju: { lat: 33.4890, lng: 126.4983, cost: 1400 },
  sapporo: { lat: 43.0618, lng: 141.3545, cost: 1500 },
  nagoya: { lat: 35.1815, lng: 136.9066, cost: 1600 },
  weligama: { lat: 5.9750, lng: 80.4297, cost: 800 },
  denver: { lat: 39.7392, lng: -104.9903, cost: 2200 },
  toronto: { lat: 43.6532, lng: -79.3832, cost: 2400 },
  montreal: { lat: 45.5017, lng: -73.5673, cost: 1800 },
  florianopolis: { lat: -27.5954, lng: -48.5480, cost: 1200 },
  bariloche: { lat: -41.1335, lng: -71.3103, cost: 1000 },
  cordoba: { lat: -31.4201, lng: -64.1888, cost: 800 },
  montevideo: { lat: -34.9011, lng: -56.1645, cost: 1400 },
  asuncion: { lat: -25.2637, lng: -57.5759, cost: 900 },
  salvador: { lat: -12.9714, lng: -38.5014, cost: 1000 },
  santacruz: { lat: -17.7833, lng: -63.1821, cost: 700 },
  cartagena: { lat: 10.3910, lng: -75.4794, cost: 1200 },
  santamarta: { lat: 11.2408, lng: -74.1990, cost: 1000 },
  sanjuan: { lat: 18.4655, lng: -66.1057, cost: 1600 },
  santodomingo: { lat: 18.4861, lng: -69.9312, cost: 1200 },
  puntacana: { lat: 18.5601, lng: -68.3725, cost: 1400 },
  antigua: { lat: 14.5586, lng: -90.7295, cost: 1000 },
  boquete: { lat: 8.7795, lng: -82.4411, cost: 1100 },
  sayulita: { lat: 20.8686, lng: -105.4413, cost: 1300 },
  puertoescondido: { lat: 15.8617, lng: -97.0721, cost: 1000 },
  tamarindo: { lat: 10.2994, lng: -85.8375, cost: 1500 },
  montanita: { lat: -1.8286, lng: -80.7535, cost: 900 },
  valparaiso: { lat: -33.0472, lng: -71.6127, cost: 1100 },
  mendoza: { lat: -32.8895, lng: -68.8458, cost: 900 },
  ushuaia: { lat: -54.8019, lng: -68.3030, cost: 1200 },
  cusco: { lat: -13.5320, lng: -71.9675, cost: 900 },
  arequipa: { lat: -16.4090, lng: -71.5375, cost: 800 },
  lakeatitlan: { lat: 14.6869, lng: -91.2322, cost: 1000 },
  sanmigueldeallende: { lat: 20.9144, lng: -100.7452, cost: 1500 },
  guanajuato: { lat: 21.0190, lng: -101.2574, cost: 1000 },
  puertovallarta: { lat: 20.6534, lng: -105.2253, cost: 1400 },
  merida: { lat: 20.9674, lng: -89.5926, cost: 1200 },
  tulum: { lat: 20.2114, lng: -87.4654, cost: 1600 },
  nairobi: { lat: -1.2921, lng: 36.8219, cost: 1000 },
  capetown: { lat: -33.9249, lng: 18.4241, cost: 1400 },
  johannesburg: { lat: -26.2041, lng: 28.0473, cost: 1200 },
  dakar: { lat: 14.7167, lng: -17.4677, cost: 1000 },
  accra: { lat: 5.6037, lng: -0.1870, cost: 1100 },
  lagos: { lat: 6.5244, lng: 3.3792, cost: 1200 },
  cairo: { lat: 30.0444, lng: 31.2357, cost: 800 },
  tunis: { lat: 36.8065, lng: 10.1815, cost: 700 },
  casablanca: { lat: 33.5731, lng: -7.5898, cost: 900 },
  marrakech: { lat: 31.6295, lng: -7.9811, cost: 1000 },
  essaouira: { lat: 31.5085, lng: -9.7595, cost: 800 },
  chefchaouen: { lat: 35.1688, lng: -5.2636, cost: 700 },
  rabat: { lat: 34.0209, lng: -6.8416, cost: 900 },
  addisababa: { lat: 8.9806, lng: 38.7578, cost: 900 },
  kigali: { lat: -1.9403, lng: 29.8739, cost: 1000 },
  daressalaam: { lat: -6.7924, lng: 39.2083, cost: 900 },
  zanzibar: { lat: -6.1659, lng: 39.2026, cost: 1100 },
  mauritius: { lat: -20.3484, lng: 57.5522, cost: 1300 },
  sanjosecr: { lat: 9.9281, lng: -84.0907, cost: 1400 },
  panama: { lat: 8.9824, lng: -79.5199, cost: 1600 },
  cali: { lat: 3.4516, lng: -76.5320, cost: 1000 },
  quito: { lat: -0.1807, lng: -78.4678, cost: 1000 },
  cuenca: { lat: -2.9001, lng: -79.0059, cost: 900 },
  ipoh: { lat: 4.5975, lng: 101.0901, cost: 700 },
  huahin: { lat: 12.5684, lng: 99.9577, cost: 1000 },
  phuquoc: { lat: 10.2899, lng: 103.9840, cost: 900 },
  batumi: { lat: 41.6168, lng: 41.6367, cost: 900 },
  gijon: { lat: 43.5322, lng: -5.6611, cost: 1200 },
  poznan: { lat: 52.4064, lng: 16.9252, cost: 1000 }
};

const dataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(dataPath, 'utf-8');

let updatedCount = 0;

for (const [cityId, data] of Object.entries(CITY_DATA)) {
  // Find the city block and add missing data before timezone
  const timezonePattern = new RegExp(
    `(id:\\s*"${cityId}"[\\s\\S]*?)(\\n\\s*timezone:\\s*-?\\d+\\s*\\n\\s*\\})`,
    'm'
  );

  const match = content.match(timezonePattern);
  if (match) {
    // Check if data already exists
    if (!match[1].includes('costPerMonth')) {
      const insert = `    costPerMonth: ${data.cost},\n    lat: ${data.lat},\n    lng: ${data.lng},\n`;
      content = content.replace(
        timezonePattern,
        `$1${insert}$2`
      );
      updatedCount++;
    }
  }
}

fs.writeFileSync(dataPath, content, 'utf-8');
console.log(`Updated ${updatedCount} cities with missing data`);

// Verify syntax
const { execSync } = require('child_process');
try {
  execSync(`node -c "${dataPath}"`, { encoding: 'utf-8' });
  console.log('Syntax check PASSED!');
} catch (e) {
  console.log('Syntax check FAILED:', e.message);
}

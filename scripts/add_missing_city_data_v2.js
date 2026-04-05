/**
 * Add missing lat, lng, costPerMonth to remaining cities
 */

const fs = require('fs');
const path = require('path');

const CITY_DATA = {
  saopaulo: { lat: -23.5505, lng: -46.6333, cost: 1300 },
  portland: { lat: 45.5152, lng: -122.6784, cost: 2200 },
  seattle: { lat: 47.6062, lng: -122.3321, cost: 2600 },
  taghazout: { lat: 30.5459, lng: -9.7103, cost: 800 },
  amman: { lat: 31.9454, lng: 35.9284, cost: 1000 },
  beirut: { lat: 33.8938, lng: 35.5018, cost: 1200 },
  muscat: { lat: 23.5880, lng: 58.3829, cost: 1400 },
  abudhabi: { lat: 24.4539, lng: 54.3773, cost: 2200 },
  doha: { lat: 25.2854, lng: 51.5310, cost: 2400 },
  brisbane: { lat: -27.4698, lng: 153.0251, cost: 2000 },
  perth: { lat: -31.9505, lng: 115.8605, cost: 1900 },
  adelaide: { lat: -34.9285, lng: 138.6007, cost: 1700 },
  queenstown: { lat: -45.0312, lng: 168.6626, cost: 2200 },
  goldcoast: { lat: -28.0167, lng: 153.4000, cost: 1800 },
  christchurch: { lat: -43.5321, lng: 172.6362, cost: 1600 },
  byronbay: { lat: -28.6434, lng: 153.6150, cost: 2000 },
  cairns: { lat: -16.9186, lng: 145.7781, cost: 1600 },
  hobart: { lat: -42.8821, lng: 147.3272, cost: 1500 },
  ericeira: { lat: 38.9637, lng: -9.4154, cost: 1500 },
  canggu: { lat: -8.6478, lng: 115.1385, cost: 1400 },
  valletta: { lat: 35.8989, lng: 14.5146, cost: 1600 },
  plovdiv: { lat: 42.1354, lng: 24.7453, cost: 800 },
  tarifa: { lat: 36.0139, lng: -5.6036, cost: 1100 },
  fuerteventura: { lat: 28.3587, lng: -14.0537, cost: 1200 },
  bilbao: { lat: 43.2630, lng: -2.9350, cost: 1500 },
  stavanger: { lat: 58.9700, lng: 5.7331, cost: 2600 }
};

const dataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(dataPath, 'utf-8');

let updatedCount = 0;

for (const [cityId, data] of Object.entries(CITY_DATA)) {
  const timezonePattern = new RegExp(
    `(id:\\s*"${cityId}"[\\s\\S]*?)(\\n\\s*timezone:\\s*-?\\d+\\s*\\n\\s*\\})`,
    'm'
  );

  const match = content.match(timezonePattern);
  if (match) {
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

const { execSync } = require('child_process');
try {
  execSync(`node -c "${dataPath}"`, { encoding: 'utf-8' });
  console.log('Syntax check PASSED!');
} catch (e) {
  console.log('Syntax check FAILED:', e.message);
}

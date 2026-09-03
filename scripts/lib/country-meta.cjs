/**
 * Per-country metadata used by the Route Planner: Schengen-area membership (for the 90/180
 * day tracker) and the typical power plug type(s) (for the packing list). Covers every
 * country present in cities-data.js. Plug letters follow the IEC world plug standard;
 * schengen reflects the area as of 2025 (Croatia 2023; Bulgaria + Romania land borders 2025).
 * Handles name variants (UK / United Kingdom, Bosnia / Bosnia and Herzegovina).
 */
// name: [ plugTypes, schengen ]
const META = {
  Albania: ['C/F', 0], Argentina: ['C/I', 0], Armenia: ['C/F', 0], Australia: ['I', 0],
  Austria: ['C/F', 1], Azerbaijan: ['C/F', 0], Bahrain: ['G', 0], Belgium: ['C/E', 1],
  Bolivia: ['A/C', 0], Bosnia: ['C/F', 0], 'Bosnia and Herzegovina': ['C/F', 0], Botswana: ['D/G/M', 0],
  Brazil: ['C/N', 0],
  // Zambia, Nicaragua and El Salvador have been in cities-data.js without a META row for some
  // time; the file's own docstring claims it covers every country present, so it did not.
  Zambia: ['C/D/G', 0], Nicaragua: ['A/B', 0], 'El Salvador': ['A/B', 0],
  Togo: ['C/E', 0], Vanuatu: ['C/G/I', 0],

  // batch 35
  Barbados: ['A/B', 0],
  Bermuda: ['A/B', 0],
  'Cayman Islands': ['A/B', 0],
  Curacao: ['A/B/F', 0],
  Aruba: ['A/B/F', 0],
  Bahamas: ['A/B', 0],
  Dominica: ['D/G', 0],
  Grenada: ['G', 0],
  'Saint Lucia': ['G', 0],
  'Trinidad and Tobago': ['A/B', 0],
  Guyana: ['A/B/D/G', 0],
  Suriname: ['A/B/C/F', 0],
  Honduras: ['A/B', 0],
  Belize: ['A/B/G', 0],
  Moldova: ['C/F', 0],
  Tajikistan: ['C/F/I', 0],
  Brunei: ['G', 0],
  'Timor-Leste': ['C/E/F/I', 0],
  Bhutan: ['C/D/F/G/M', 0],
  Madagascar: ['C/D/E/J/K', 0],
  Malawi: ['G', 0],
  Zimbabwe: ['D/G', 0],
  Cameroon: ['C/E', 0],
  Benin: ['C/E', 0],
  Seychelles: ['G', 0],
  Samoa: ['I', 0],
  Tonga: ['I', 0],
  'Cook Islands': ['I', 0],
  'French Polynesia': ['A/B/C/E', 0],
  Bulgaria: ['C/F', 1], Cambodia: ['A/C/G', 0], Canada: ['A/B', 0], 'Cape Verde': ['C/F', 0],
  Chile: ['C/L', 0], China: ['A/C/I', 0], Colombia: ['A/B', 0], 'Costa Rica': ['A/B', 0],
  Croatia: ['C/F', 1], Cyprus: ['G', 0], 'Czech Republic': ['C/E', 1], Denmark: ['C/F/K', 1],
  'Dominican Republic': ['A/B', 0], Ecuador: ['A/B', 0], Egypt: ['C/F', 0], Estonia: ['C/F', 1],
  Ethiopia: ['C/F', 0], Fiji: ['I', 0], Finland: ['C/F', 1], France: ['C/E', 1],
  Georgia: ['C/F', 0], Germany: ['C/F', 1], Ghana: ['D/G', 0], Greece: ['C/F', 1],
  Guatemala: ['A/B', 0], Hungary: ['C/F', 1], Iceland: ['C/F', 1], India: ['C/D/M', 0],
  Indonesia: ['C/F', 0], Iran: ['C/F', 0], Ireland: ['G', 0], Israel: ['C/H/M', 0],
  Italy: ['C/F/L', 1], Japan: ['A/B', 0], Jordan: ['B/C/D/F/G', 0], Kazakhstan: ['C/F', 0],
  Kenya: ['G', 0], Kyrgyzstan: ['C/F', 0], Uzbekistan: ['C/F/I', 0],
  Kosovo: ['C/F', 0], Kuwait: ['G', 0], Laos: ['A/B/C/E/F', 0], Latvia: ['C/F', 1],
  Lebanon: ['A/B/C/D/G', 0], Lithuania: ['C/F', 1], Luxembourg: ['C/F', 1], Malaysia: ['G', 0],
  Malta: ['G', 1], Mauritius: ['C/G', 0], Mexico: ['A/B', 0], Montenegro: ['C/F', 0],
  Morocco: ['C/E', 0], Mozambique: ['C/F/M', 0], Namibia: ['D/M', 0], Nepal: ['C/D/M', 0],
  Netherlands: ['C/F', 1], 'New Caledonia': ['C/F', 0], 'New Zealand': ['I', 0], Nigeria: ['D/G', 0],
  'North Macedonia': ['C/F', 0], Norway: ['C/F', 1], Oman: ['G', 0], Palestine: ['C/H/M', 0],
  Panama: ['A/B', 0], Paraguay: ['C', 0], Peru: ['A/B/C', 0], Philippines: ['A/B/C', 0],
  Poland: ['C/E', 1], Portugal: ['C/F', 1], 'Puerto Rico': ['A/B', 0], Qatar: ['G', 0],
  Romania: ['C/F', 1], Rwanda: ['C/J', 0], 'Saudi Arabia': ['G', 0], Senegal: ['C/D/E/K', 0],
  Serbia: ['C/F', 0], Singapore: ['G', 0], Slovakia: ['C/E', 1], Slovenia: ['C/F', 1],
  'South Africa': ['C/D/M/N', 0], 'South Korea': ['C/F', 0], Spain: ['C/F', 1], 'Sri Lanka': ['D/G/M', 0],
  Sweden: ['C/F', 1], Switzerland: ['C/J', 1], Taiwan: ['A/B', 0], Tanzania: ['D/G', 0],
  Thailand: ['A/B/C', 0], Tunisia: ['C/E', 0], Turkey: ['C/F', 0], UAE: ['G', 0],
  UK: ['G', 0], Uganda: ['G', 0], 'United Kingdom': ['G', 0], 'United States': ['A/B', 0],
  Uruguay: ['C/F/L', 0], Vietnam: ['A/C/F', 0],
  Algeria: ['C/F', 0], Bangladesh: ['C/D/G', 0], Cuba: ['A/B/C/L', 0], 'Ivory Coast': ['C/E', 0],
  Jamaica: ['A/B', 0], Maldives: ['D/G', 0], Mongolia: ['C/E', 0], Myanmar: ['C/D/G', 0],
  Pakistan: ['C/D', 0],
};
module.exports = META;

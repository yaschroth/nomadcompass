/**
 * Add 100 new cities to The Nomad HQ
 * Run with: node scripts/add_100_cities.js
 */

const fs = require('fs');
const path = require('path');

// 100 NEW cities (verified not in existing data)
const NEW_CITIES = [
  // FRANCE (6)
  { id: "bordeaux", name: "Bordeaux", country: "France", flag: "🇫🇷", climateType: "Oceanic", lat: 44.8378, lng: -0.5792, timezone: 1, costPerMonth: 1900, tagline: "Wine capital meets startup culture in southwestern France's most elegant city.", scores: { climate: 7, cost: 5, wifi: 8, nightlife: 7, nature: 7, safety: 8, food: 9, community: 6, english: 6, visa: 6 } },
  { id: "toulouse", name: "Toulouse", country: "France", flag: "🇫🇷", climateType: "Mediterranean", lat: 43.6047, lng: 1.4442, timezone: 1, costPerMonth: 1700, tagline: "The Pink City—aerospace hub with vibrant student energy and southern charm.", scores: { climate: 7, cost: 6, wifi: 8, nightlife: 7, nature: 6, safety: 8, food: 8, community: 5, english: 5, visa: 6 } },
  { id: "montpellier", name: "Montpellier", country: "France", flag: "🇫🇷", climateType: "Mediterranean", lat: 43.6108, lng: 3.8767, timezone: 1, costPerMonth: 1600, tagline: "Sun-drenched Mediterranean vibes with beaches, history, and affordable French living.", scores: { climate: 8, cost: 6, wifi: 7, nightlife: 7, nature: 8, safety: 8, food: 8, community: 5, english: 5, visa: 6 } },
  { id: "marseille", name: "Marseille", country: "France", flag: "🇫🇷", climateType: "Mediterranean", lat: 43.2965, lng: 5.3698, timezone: 1, costPerMonth: 1800, tagline: "France's oldest city—raw, real, and right on the Mediterranean.", scores: { climate: 8, cost: 6, wifi: 7, nightlife: 7, nature: 8, safety: 6, food: 9, community: 5, english: 5, visa: 6 } },
  { id: "nantes", name: "Nantes", country: "France", flag: "🇫🇷", climateType: "Oceanic", lat: 47.2184, lng: -1.5536, timezone: 1, costPerMonth: 1600, tagline: "Creative, green, and affordable—France's most livable city.", scores: { climate: 6, cost: 6, wifi: 8, nightlife: 6, nature: 7, safety: 9, food: 8, community: 5, english: 5, visa: 6 } },
  { id: "annecy", name: "Annecy", country: "France", flag: "🇫🇷", climateType: "Continental", lat: 45.8992, lng: 6.1294, timezone: 1, costPerMonth: 2100, tagline: "Alpine paradise with crystal-clear lakes and mountain adventures.", scores: { climate: 6, cost: 4, wifi: 8, nightlife: 5, nature: 10, safety: 9, food: 8, community: 4, english: 5, visa: 6 } },

  // GERMANY (6)
  { id: "munich", name: "Munich", country: "Germany", flag: "🇩🇪", climateType: "Continental", lat: 48.1351, lng: 11.5820, timezone: 1, costPerMonth: 2400, tagline: "Bavarian charm meets high-tech innovation—beer gardens and startups.", scores: { climate: 6, cost: 4, wifi: 9, nightlife: 8, nature: 8, safety: 9, food: 8, community: 7, english: 8, visa: 6 } },
  { id: "cologne", name: "Cologne", country: "Germany", flag: "🇩🇪", climateType: "Oceanic", lat: 50.9375, lng: 6.9603, timezone: 1, costPerMonth: 1900, tagline: "Cathedral city with carnival spirit and thriving creative scene.", scores: { climate: 6, cost: 5, wifi: 9, nightlife: 8, nature: 5, safety: 8, food: 7, community: 6, english: 8, visa: 6 } },
  { id: "frankfurt", name: "Frankfurt", country: "Germany", flag: "🇩🇪", climateType: "Oceanic", lat: 50.1109, lng: 8.6821, timezone: 1, costPerMonth: 2200, tagline: "Europe's financial hub with surprising soul and global connections.", scores: { climate: 6, cost: 4, wifi: 9, nightlife: 7, nature: 5, safety: 8, food: 7, community: 6, english: 9, visa: 6 } },
  { id: "dresden", name: "Dresden", country: "Germany", flag: "🇩🇪", climateType: "Continental", lat: 51.0504, lng: 13.7373, timezone: 1, costPerMonth: 1400, tagline: "Baroque beauty risen from ashes—culture and affordability in eastern Germany.", scores: { climate: 5, cost: 7, wifi: 8, nightlife: 6, nature: 7, safety: 8, food: 7, community: 5, english: 7, visa: 6 } },
  { id: "leipzig", name: "Leipzig", country: "Germany", flag: "🇩🇪", climateType: "Continental", lat: 51.3397, lng: 12.3731, timezone: 1, costPerMonth: 1300, tagline: "Berlin's cooler cousin—art, music, and the best value in Germany.", scores: { climate: 5, cost: 8, wifi: 8, nightlife: 8, nature: 6, safety: 8, food: 7, community: 6, english: 7, visa: 6 } },
  { id: "heidelberg", name: "Heidelberg", country: "Germany", flag: "🇩🇪", climateType: "Continental", lat: 49.3988, lng: 8.6724, timezone: 1, costPerMonth: 1700, tagline: "Romantic castle town with Germany's oldest university and intellectual energy.", scores: { climate: 6, cost: 5, wifi: 8, nightlife: 6, nature: 8, safety: 9, food: 7, community: 5, english: 8, visa: 6 } },

  // AUSTRIA (3)
  { id: "salzburg", name: "Salzburg", country: "Austria", flag: "🇦🇹", climateType: "Continental", lat: 47.8095, lng: 13.0550, timezone: 1, costPerMonth: 2000, tagline: "Mozart's birthplace—baroque splendor wrapped in Alpine majesty.", scores: { climate: 6, cost: 5, wifi: 8, nightlife: 6, nature: 9, safety: 9, food: 8, community: 4, english: 7, visa: 6 } },
  { id: "innsbruck", name: "Innsbruck", country: "Austria", flag: "🇦🇹", climateType: "Alpine", lat: 47.2692, lng: 11.4041, timezone: 1, costPerMonth: 1900, tagline: "Ski in the morning, work in the afternoon—Alpine adventure capital.", scores: { climate: 5, cost: 5, wifi: 8, nightlife: 5, nature: 10, safety: 9, food: 7, community: 4, english: 7, visa: 6 } },
  { id: "graz", name: "Graz", country: "Austria", flag: "🇦🇹", climateType: "Continental", lat: 47.0707, lng: 15.4395, timezone: 1, costPerMonth: 1600, tagline: "Austria's second city—student vibes, design scene, and culinary capital.", scores: { climate: 6, cost: 6, wifi: 8, nightlife: 7, nature: 7, safety: 9, food: 8, community: 5, english: 7, visa: 6 } },

  // SWITZERLAND (3)
  { id: "basel", name: "Basel", country: "Switzerland", flag: "🇨🇭", climateType: "Continental", lat: 47.5596, lng: 7.5886, timezone: 1, costPerMonth: 3200, tagline: "Art Basel's home—where three countries meet and culture thrives.", scores: { climate: 6, cost: 2, wifi: 9, nightlife: 6, nature: 7, safety: 10, food: 8, community: 5, english: 8, visa: 5 } },
  { id: "lausanne", name: "Lausanne", country: "Switzerland", flag: "🇨🇭", climateType: "Continental", lat: 46.5197, lng: 6.6323, timezone: 1, costPerMonth: 3000, tagline: "Olympic capital on Lake Geneva—French flair with Swiss precision.", scores: { climate: 6, cost: 2, wifi: 9, nightlife: 6, nature: 9, safety: 10, food: 8, community: 5, english: 7, visa: 5 } },
  { id: "lucerne", name: "Lucerne", country: "Switzerland", flag: "🇨🇭", climateType: "Continental", lat: 47.0502, lng: 8.3093, timezone: 1, costPerMonth: 3100, tagline: "Postcard-perfect Switzerland—mountains, lakes, and medieval charm.", scores: { climate: 6, cost: 2, wifi: 9, nightlife: 5, nature: 10, safety: 10, food: 7, community: 4, english: 7, visa: 5 } },

  // ITALY (6)
  { id: "bologna", name: "Bologna", country: "Italy", flag: "🇮🇹", climateType: "Humid Subtropical", lat: 44.4949, lng: 11.3426, timezone: 1, costPerMonth: 1700, tagline: "La Grassa, La Dotta, La Rossa—fat, learned, and red. Italy's food capital.", scores: { climate: 7, cost: 5, wifi: 8, nightlife: 7, nature: 6, safety: 8, food: 10, community: 6, english: 6, visa: 6 } },
  { id: "turin", name: "Turin", country: "Italy", flag: "🇮🇹", climateType: "Humid Subtropical", lat: 45.0703, lng: 7.6869, timezone: 1, costPerMonth: 1600, tagline: "Industrial elegance—coffee culture, chocolate, and Alpine views.", scores: { climate: 6, cost: 6, wifi: 8, nightlife: 6, nature: 8, safety: 8, food: 9, community: 5, english: 5, visa: 6 } },
  { id: "verona", name: "Verona", country: "Italy", flag: "🇮🇹", climateType: "Humid Subtropical", lat: 45.4384, lng: 10.9916, timezone: 1, costPerMonth: 1700, tagline: "Romeo and Juliet's city—romance, opera, and wine country gateway.", scores: { climate: 7, cost: 5, wifi: 7, nightlife: 6, nature: 7, safety: 8, food: 9, community: 4, english: 5, visa: 6 } },
  { id: "naples", name: "Naples", country: "Italy", flag: "🇮🇹", climateType: "Mediterranean", lat: 40.8518, lng: 14.2681, timezone: 1, costPerMonth: 1400, tagline: "Raw, chaotic, unforgettable—birthplace of pizza and southern Italian soul.", scores: { climate: 8, cost: 7, wifi: 6, nightlife: 7, nature: 8, safety: 5, food: 10, community: 5, english: 4, visa: 6 } },
  { id: "bari", name: "Bari", country: "Italy", flag: "🇮🇹", climateType: "Mediterranean", lat: 41.1171, lng: 16.8719, timezone: 1, costPerMonth: 1300, tagline: "Puglia's gateway—white-washed old town, fresh seafood, and southern warmth.", scores: { climate: 8, cost: 7, wifi: 7, nightlife: 6, nature: 7, safety: 7, food: 9, community: 4, english: 4, visa: 6 } },
  { id: "catania", name: "Catania", country: "Italy", flag: "🇮🇹", climateType: "Mediterranean", lat: 37.5079, lng: 15.0830, timezone: 1, costPerMonth: 1200, tagline: "Sicily's volcanic heart—Etna views, baroque beauty, and street food heaven.", scores: { climate: 9, cost: 7, wifi: 6, nightlife: 7, nature: 9, safety: 6, food: 9, community: 4, english: 4, visa: 6 } },

  // SPAIN (6)
  { id: "palma", name: "Palma de Mallorca", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 39.5696, lng: 2.6502, timezone: 1, costPerMonth: 2100, tagline: "Island sophistication—yacht harbors, Gothic cathedral, and year-round sun.", scores: { climate: 9, cost: 5, wifi: 8, nightlife: 7, nature: 8, safety: 8, food: 8, community: 7, english: 7, visa: 6 } },
  { id: "ibiza", name: "Ibiza", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 38.9067, lng: 1.4206, timezone: 1, costPerMonth: 2500, tagline: "Party island turned wellness retreat—beaches, beats, and bohemian spirit.", scores: { climate: 9, cost: 4, wifi: 7, nightlife: 10, nature: 8, safety: 8, food: 7, community: 6, english: 7, visa: 6 } },
  { id: "marbella", name: "Marbella", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 36.5099, lng: -4.8862, timezone: 1, costPerMonth: 2200, tagline: "Costa del Sol glamour—luxury marina, golf courses, and endless sunshine.", scores: { climate: 9, cost: 4, wifi: 8, nightlife: 8, nature: 7, safety: 8, food: 8, community: 6, english: 7, visa: 6 } },
  { id: "cadiz", name: "Cádiz", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 36.5271, lng: -6.2886, timezone: 1, costPerMonth: 1400, tagline: "Europe's oldest city—Atlantic breezes, Carnival spirit, and authentic Andalusia.", scores: { climate: 8, cost: 7, wifi: 7, nightlife: 7, nature: 8, safety: 8, food: 9, community: 4, english: 4, visa: 6 } },
  { id: "granadaspain", name: "Granada", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 37.1773, lng: -3.5986, timezone: 1, costPerMonth: 1300, tagline: "Alhambra's home—tapas tradition, flamenco caves, and Sierra Nevada snow.", scores: { climate: 7, cost: 7, wifi: 7, nightlife: 8, nature: 8, safety: 8, food: 9, community: 5, english: 5, visa: 6 } },
  { id: "girona", name: "Girona", country: "Spain", flag: "🇪🇸", climateType: "Mediterranean", lat: 41.9794, lng: 2.8214, timezone: 1, costPerMonth: 1600, tagline: "Medieval gem near Barcelona—Game of Thrones streets and world-class dining.", scores: { climate: 7, cost: 6, wifi: 8, nightlife: 5, nature: 8, safety: 9, food: 9, community: 5, english: 6, visa: 6 } },

  // PORTUGAL (4)
  { id: "cascais", name: "Cascais", country: "Portugal", flag: "🇵🇹", climateType: "Mediterranean", lat: 38.6979, lng: -9.4215, timezone: 0, costPerMonth: 2000, tagline: "Lisbon's seaside escape—surf, seafood, and sophisticated coastal living.", scores: { climate: 8, cost: 5, wifi: 8, nightlife: 6, nature: 8, safety: 9, food: 8, community: 6, english: 8, visa: 7 } },
  { id: "coimbra", name: "Coimbra", country: "Portugal", flag: "🇵🇹", climateType: "Mediterranean", lat: 40.2033, lng: -8.4103, timezone: 0, costPerMonth: 1200, tagline: "Portugal's Oxford—ancient university, fado tradition, and student energy.", scores: { climate: 7, cost: 7, wifi: 7, nightlife: 6, nature: 7, safety: 9, food: 8, community: 4, english: 6, visa: 7 } },
  { id: "funchal", name: "Funchal", country: "Portugal", flag: "🇵🇹", climateType: "Subtropical", lat: 32.6669, lng: -16.9241, timezone: 0, costPerMonth: 1600, tagline: "Madeira's garden city—eternal spring, levada hikes, and island tranquility.", scores: { climate: 9, cost: 6, wifi: 7, nightlife: 5, nature: 10, safety: 9, food: 8, community: 5, english: 7, visa: 7 } },
  { id: "pontadelgada", name: "Ponta Delgada", country: "Portugal", flag: "🇵🇹", climateType: "Oceanic", lat: 37.7394, lng: -25.6687, timezone: -1, costPerMonth: 1400, tagline: "Azores adventure base—volcanic lakes, whale watching, and mid-Atlantic magic.", scores: { climate: 7, cost: 6, wifi: 6, nightlife: 4, nature: 10, safety: 9, food: 7, community: 3, english: 6, visa: 7 } },

  // UK (4)
  { id: "brighton", name: "Brighton", country: "United Kingdom", flag: "🇬🇧", climateType: "Oceanic", lat: 50.8225, lng: -0.1372, timezone: 0, costPerMonth: 2200, tagline: "London-by-the-sea—creative, quirky, and proudly alternative.", scores: { climate: 5, cost: 4, wifi: 9, nightlife: 8, nature: 7, safety: 8, food: 8, community: 7, english: 10, visa: 5 } },
  { id: "bristol", name: "Bristol", country: "United Kingdom", flag: "🇬🇧", climateType: "Oceanic", lat: 51.4545, lng: -2.5879, timezone: 0, costPerMonth: 2000, tagline: "Street art capital—Banksy's hometown with independent spirit and music scene.", scores: { climate: 5, cost: 5, wifi: 9, nightlife: 8, nature: 7, safety: 8, food: 8, community: 6, english: 10, visa: 5 } },
  { id: "glasgow", name: "Glasgow", country: "United Kingdom", flag: "🇬🇧", climateType: "Oceanic", lat: 55.8642, lng: -4.2518, timezone: 0, costPerMonth: 1700, tagline: "Scotland's beating heart—Victorian grandeur, live music, and legendary nightlife.", scores: { climate: 4, cost: 6, wifi: 9, nightlife: 9, nature: 8, safety: 7, food: 8, community: 6, english: 10, visa: 5 } },
  { id: "galway", name: "Galway", country: "Ireland", flag: "🇮🇪", climateType: "Oceanic", lat: 53.2707, lng: -9.0568, timezone: 0, costPerMonth: 1900, tagline: "Ireland's cultural heart—trad music, Wild Atlantic Way, and Celtic soul.", scores: { climate: 4, cost: 5, wifi: 8, nightlife: 8, nature: 9, safety: 9, food: 8, community: 6, english: 10, visa: 6 } },

  // BENELUX (3)
  { id: "bruges", name: "Bruges", country: "Belgium", flag: "🇧🇪", climateType: "Oceanic", lat: 51.2093, lng: 3.2247, timezone: 1, costPerMonth: 1800, tagline: "Medieval fairytale—canals, chocolate, and perfectly preserved Gothic beauty.", scores: { climate: 5, cost: 5, wifi: 8, nightlife: 5, nature: 5, safety: 9, food: 8, community: 4, english: 8, visa: 6 } },
  { id: "maastricht", name: "Maastricht", country: "Netherlands", flag: "🇳🇱", climateType: "Oceanic", lat: 50.8514, lng: 5.6910, timezone: 1, costPerMonth: 1700, tagline: "Where Netherlands meets Belgium—Burgundian lifestyle and European crossroads.", scores: { climate: 6, cost: 5, wifi: 9, nightlife: 7, nature: 6, safety: 9, food: 8, community: 5, english: 9, visa: 6 } },
  { id: "eindhoven", name: "Eindhoven", country: "Netherlands", flag: "🇳🇱", climateType: "Oceanic", lat: 51.4416, lng: 5.4697, timezone: 1, costPerMonth: 1800, tagline: "Design capital—Philips heritage, tech startups, and Dutch innovation hub.", scores: { climate: 5, cost: 5, wifi: 9, nightlife: 6, nature: 5, safety: 9, food: 7, community: 6, english: 9, visa: 6 } },

  // SCANDINAVIA (5)
  { id: "bergen", name: "Bergen", country: "Norway", flag: "🇳🇴", climateType: "Oceanic", lat: 60.3913, lng: 5.3221, timezone: 1, costPerMonth: 2800, tagline: "Gateway to the fjords—colorful Bryggen, rain, and dramatic Norwegian nature.", scores: { climate: 4, cost: 2, wifi: 9, nightlife: 6, nature: 10, safety: 10, food: 7, community: 4, english: 9, visa: 5 } },
  { id: "gothenburg", name: "Gothenburg", country: "Sweden", flag: "🇸🇪", climateType: "Oceanic", lat: 57.7089, lng: 11.9746, timezone: 1, costPerMonth: 2200, tagline: "Sweden's friendly west coast—seafood, archipelago, and laid-back vibes.", scores: { climate: 5, cost: 4, wifi: 9, nightlife: 7, nature: 8, safety: 9, food: 8, community: 5, english: 9, visa: 5 } },
  { id: "malmo", name: "Malmö", country: "Sweden", flag: "🇸🇪", climateType: "Oceanic", lat: 55.6050, lng: 13.0038, timezone: 1, costPerMonth: 2000, tagline: "Bridge to Copenhagen—diverse, progressive, and surprisingly affordable for Scandinavia.", scores: { climate: 5, cost: 4, wifi: 9, nightlife: 7, nature: 6, safety: 8, food: 8, community: 5, english: 9, visa: 5 } },
  { id: "aarhus", name: "Aarhus", country: "Denmark", flag: "🇩🇰", climateType: "Oceanic", lat: 56.1629, lng: 10.2039, timezone: 1, costPerMonth: 2100, tagline: "Denmark's second city—student energy, modern architecture, and hygge perfected.", scores: { climate: 5, cost: 3, wifi: 9, nightlife: 7, nature: 7, safety: 10, food: 8, community: 5, english: 9, visa: 5 } },
  { id: "tampere", name: "Tampere", country: "Finland", flag: "🇫🇮", climateType: "Continental", lat: 61.4978, lng: 23.7610, timezone: 2, costPerMonth: 1800, tagline: "Finland's industrial heart turned sauna capital—lakes, tech, and Nordic calm.", scores: { climate: 4, cost: 5, wifi: 9, nightlife: 6, nature: 9, safety: 10, food: 7, community: 4, english: 9, visa: 5 } },

  // BALTICS (3)
  { id: "tartu", name: "Tartu", country: "Estonia", flag: "🇪🇪", climateType: "Continental", lat: 58.3780, lng: 26.7290, timezone: 2, costPerMonth: 1200, tagline: "Estonia's intellectual capital—university town with startup DNA.", scores: { climate: 4, cost: 7, wifi: 9, nightlife: 6, nature: 7, safety: 9, food: 7, community: 5, english: 8, visa: 7 } },
  { id: "kaunas", name: "Kaunas", country: "Lithuania", flag: "🇱🇹", climateType: "Continental", lat: 54.8985, lng: 23.9036, timezone: 2, costPerMonth: 1100, tagline: "Lithuania's hidden gem—art deco architecture and emerging creative scene.", scores: { climate: 4, cost: 8, wifi: 8, nightlife: 6, nature: 6, safety: 9, food: 7, community: 4, english: 7, visa: 7 } },
  { id: "klaipeda", name: "Klaipėda", country: "Lithuania", flag: "🇱🇹", climateType: "Oceanic", lat: 55.7033, lng: 21.1443, timezone: 2, costPerMonth: 1000, tagline: "Baltic Sea port—Curonian Spit gateway and seaside charm.", scores: { climate: 4, cost: 8, wifi: 7, nightlife: 5, nature: 8, safety: 9, food: 7, community: 3, english: 6, visa: 7 } },

  // CENTRAL EUROPE (6)
  { id: "kosice", name: "Košice", country: "Slovakia", flag: "🇸🇰", climateType: "Continental", lat: 48.7164, lng: 21.2611, timezone: 1, costPerMonth: 900, tagline: "Slovakia's eastern capital—Gothic cathedral, cheap beer, and undiscovered charm.", scores: { climate: 5, cost: 9, wifi: 7, nightlife: 6, nature: 7, safety: 8, food: 7, community: 3, english: 5, visa: 6 } },
  { id: "bratislava", name: "Bratislava", country: "Slovakia", flag: "🇸🇰", climateType: "Continental", lat: 48.1486, lng: 17.1077, timezone: 1, costPerMonth: 1300, tagline: "Compact capital between Vienna and Budapest—castle views and Danube walks.", scores: { climate: 6, cost: 7, wifi: 8, nightlife: 7, nature: 6, safety: 8, food: 7, community: 5, english: 7, visa: 6 } },
  { id: "sibiu", name: "Sibiu", country: "Romania", flag: "🇷🇴", climateType: "Continental", lat: 45.7983, lng: 24.1256, timezone: 2, costPerMonth: 900, tagline: "Transylvania's gem—Germanic architecture, Carpathian gateway, and medieval festivals.", scores: { climate: 5, cost: 9, wifi: 7, nightlife: 5, nature: 9, safety: 8, food: 8, community: 4, english: 6, visa: 7 } },
  { id: "brasov", name: "Brașov", country: "Romania", flag: "🇷🇴", climateType: "Continental", lat: 45.6427, lng: 25.5887, timezone: 2, costPerMonth: 1000, tagline: "Dracula country—Gothic spires, ski slopes, and Transylvanian mystery.", scores: { climate: 5, cost: 9, wifi: 7, nightlife: 6, nature: 9, safety: 8, food: 8, community: 5, english: 6, visa: 7 } },
  { id: "timisoara", name: "Timișoara", country: "Romania", flag: "🇷🇴", climateType: "Continental", lat: 45.7489, lng: 21.2087, timezone: 2, costPerMonth: 900, tagline: "Little Vienna—where the 1989 revolution began and tech talent thrives.", scores: { climate: 6, cost: 9, wifi: 8, nightlife: 7, nature: 6, safety: 8, food: 7, community: 5, english: 7, visa: 7 } },
  { id: "varna", name: "Varna", country: "Bulgaria", flag: "🇧🇬", climateType: "Humid Subtropical", lat: 43.2141, lng: 27.9147, timezone: 2, costPerMonth: 900, tagline: "Bulgaria's Black Sea capital—beach life, ancient gold, and summer vibes.", scores: { climate: 7, cost: 9, wifi: 7, nightlife: 7, nature: 8, safety: 8, food: 7, community: 4, english: 6, visa: 7 } },

  // BALKANS (6)
  { id: "novisad", name: "Novi Sad", country: "Serbia", flag: "🇷🇸", climateType: "Continental", lat: 45.2671, lng: 19.8335, timezone: 1, costPerMonth: 800, tagline: "EXIT Festival's home—Danube fortress, café culture, and Serbian hospitality.", scores: { climate: 6, cost: 9, wifi: 7, nightlife: 8, nature: 6, safety: 8, food: 8, community: 5, english: 6, visa: 8 } },
  { id: "mostar", name: "Mostar", country: "Bosnia and Herzegovina", flag: "🇧🇦", climateType: "Mediterranean", lat: 43.3438, lng: 17.8078, timezone: 1, costPerMonth: 800, tagline: "Iconic bridge, Ottoman legacy, and resilient Balkan beauty.", scores: { climate: 7, cost: 9, wifi: 6, nightlife: 5, nature: 8, safety: 8, food: 8, community: 3, english: 5, visa: 8 } },
  { id: "kotor", name: "Kotor", country: "Montenegro", flag: "🇲🇪", climateType: "Mediterranean", lat: 42.4247, lng: 18.7712, timezone: 1, costPerMonth: 1200, tagline: "Fjord-like bay meets medieval walls—Montenegro's dramatic crown jewel.", scores: { climate: 8, cost: 7, wifi: 7, nightlife: 6, nature: 10, safety: 8, food: 8, community: 5, english: 6, visa: 8 } },
  { id: "ohrid", name: "Ohrid", country: "North Macedonia", flag: "🇲🇰", climateType: "Continental", lat: 41.1231, lng: 20.8016, timezone: 1, costPerMonth: 700, tagline: "UNESCO lake town—365 churches, ancient history, and Balkan tranquility.", scores: { climate: 7, cost: 9, wifi: 6, nightlife: 4, nature: 9, safety: 9, food: 7, community: 3, english: 5, visa: 8 } },
  { id: "sarande", name: "Sarandë", country: "Albania", flag: "🇦🇱", climateType: "Mediterranean", lat: 39.8661, lng: 20.0050, timezone: 1, costPerMonth: 800, tagline: "Albanian Riviera—turquoise waters, ancient Butrint, and Europe's last secret.", scores: { climate: 8, cost: 9, wifi: 6, nightlife: 6, nature: 9, safety: 7, food: 8, community: 3, english: 5, visa: 8 } },
  { id: "prizren", name: "Prizren", country: "Kosovo", flag: "🇽🇰", climateType: "Continental", lat: 42.2139, lng: 20.7397, timezone: 1, costPerMonth: 600, tagline: "Ottoman jewel—cobblestone streets, fortress views, and Balkan authenticity.", scores: { climate: 6, cost: 10, wifi: 6, nightlife: 5, nature: 7, safety: 7, food: 7, community: 3, english: 5, visa: 8 } },

  // CROATIA & SLOVENIA (4)
  { id: "pula", name: "Pula", country: "Croatia", flag: "🇭🇷", climateType: "Mediterranean", lat: 44.8666, lng: 13.8496, timezone: 1, costPerMonth: 1300, tagline: "Roman arena by the sea—Istrian wine, truffles, and Adriatic adventures.", scores: { climate: 8, cost: 6, wifi: 7, nightlife: 6, nature: 8, safety: 9, food: 9, community: 4, english: 7, visa: 6 } },
  { id: "zadar", name: "Zadar", country: "Croatia", flag: "🇭🇷", climateType: "Mediterranean", lat: 44.1194, lng: 15.2314, timezone: 1, costPerMonth: 1400, tagline: "Sea organ sunsets—ancient walls, island-hopping gateway, and Croatian cool.", scores: { climate: 8, cost: 6, wifi: 7, nightlife: 6, nature: 9, safety: 9, food: 8, community: 5, english: 7, visa: 6 } },
  { id: "bled", name: "Bled", country: "Slovenia", flag: "🇸🇮", climateType: "Continental", lat: 46.3683, lng: 14.1146, timezone: 1, costPerMonth: 1500, tagline: "Fairytale lake—island church, castle cliff, and Julian Alps backdrop.", scores: { climate: 6, cost: 6, wifi: 7, nightlife: 4, nature: 10, safety: 10, food: 7, community: 4, english: 7, visa: 6 } },
  { id: "piran", name: "Piran", country: "Slovenia", flag: "🇸🇮", climateType: "Mediterranean", lat: 45.5283, lng: 13.5681, timezone: 1, costPerMonth: 1400, tagline: "Venetian gem on the Adriatic—Slovenia's tiny slice of Mediterranean magic.", scores: { climate: 7, cost: 6, wifi: 7, nightlife: 5, nature: 8, safety: 10, food: 8, community: 3, english: 7, visa: 6 } },

  // GREECE (4)
  { id: "paphos", name: "Paphos", country: "Cyprus", flag: "🇨🇾", climateType: "Mediterranean", lat: 34.7754, lng: 32.4245, timezone: 2, costPerMonth: 1600, tagline: "Aphrodite's birthplace—ancient mosaics, year-round sun, and expat-friendly.", scores: { climate: 9, cost: 6, wifi: 7, nightlife: 5, nature: 7, safety: 9, food: 7, community: 6, english: 8, visa: 6 } },
  { id: "chania", name: "Chania", country: "Greece", flag: "🇬🇷", climateType: "Mediterranean", lat: 35.5138, lng: 24.0180, timezone: 2, costPerMonth: 1400, tagline: "Crete's Venetian jewel—harbor sunsets, mountain gorges, and Greek island life.", scores: { climate: 8, cost: 6, wifi: 7, nightlife: 6, nature: 9, safety: 9, food: 9, community: 5, english: 7, visa: 6 } },
  { id: "rhodes", name: "Rhodes", country: "Greece", flag: "🇬🇷", climateType: "Mediterranean", lat: 36.4341, lng: 28.2176, timezone: 2, costPerMonth: 1300, tagline: "Knights and beaches—medieval old town meets 300 days of sunshine.", scores: { climate: 9, cost: 6, wifi: 6, nightlife: 7, nature: 8, safety: 9, food: 8, community: 4, english: 7, visa: 6 } },
  { id: "santorini", name: "Santorini", country: "Greece", flag: "🇬🇷", climateType: "Mediterranean", lat: 36.3932, lng: 25.4615, timezone: 2, costPerMonth: 2200, tagline: "Volcanic drama—iconic sunsets, whitewashed villages, and caldera views.", scores: { climate: 8, cost: 4, wifi: 6, nightlife: 6, nature: 9, safety: 9, food: 8, community: 4, english: 7, visa: 6 } },

  // TURKEY & CAUCASUS (5)
  { id: "bodrum", name: "Bodrum", country: "Turkey", flag: "🇹🇷", climateType: "Mediterranean", lat: 37.0343, lng: 27.4305, timezone: 3, costPerMonth: 1400, tagline: "Turkish Riviera star—ancient Halicarnassus, blue voyages, and coastal glamour.", scores: { climate: 9, cost: 6, wifi: 7, nightlife: 8, nature: 8, safety: 7, food: 8, community: 5, english: 6, visa: 8 } },
  { id: "fethiye", name: "Fethiye", country: "Turkey", flag: "🇹🇷", climateType: "Mediterranean", lat: 36.6214, lng: 29.1153, timezone: 3, costPerMonth: 1100, tagline: "Paragliding paradise—Ölüdeniz lagoon, Lycian tombs, and adventure base.", scores: { climate: 9, cost: 7, wifi: 7, nightlife: 6, nature: 10, safety: 8, food: 8, community: 5, english: 6, visa: 8 } },
  { id: "izmir", name: "Izmir", country: "Turkey", flag: "🇹🇷", climateType: "Mediterranean", lat: 38.4192, lng: 27.1287, timezone: 3, costPerMonth: 1000, tagline: "Turkey's most liberal city—Aegean breezes, bazaars, and progressive spirit.", scores: { climate: 8, cost: 7, wifi: 8, nightlife: 7, nature: 7, safety: 7, food: 9, community: 5, english: 5, visa: 8 } },
  { id: "cappadocia", name: "Cappadocia", country: "Turkey", flag: "🇹🇷", climateType: "Semi-Arid", lat: 38.6431, lng: 34.8289, timezone: 3, costPerMonth: 900, tagline: "Hot air balloon heaven—fairy chimneys, cave hotels, and lunar landscapes.", scores: { climate: 6, cost: 8, wifi: 6, nightlife: 4, nature: 10, safety: 8, food: 7, community: 4, english: 5, visa: 8 } },
  { id: "kutaisi", name: "Kutaisi", country: "Georgia", flag: "🇬🇪", climateType: "Humid Subtropical", lat: 42.2679, lng: 42.6946, timezone: 4, costPerMonth: 700, tagline: "Georgia's ancient capital—UNESCO monasteries, canyons, and authentic hospitality.", scores: { climate: 7, cost: 9, wifi: 6, nightlife: 4, nature: 9, safety: 8, food: 8, community: 3, english: 4, visa: 10 } },

  // MIDDLE EAST (5)
  { id: "gyumri", name: "Gyumri", country: "Armenia", flag: "🇦🇲", climateType: "Continental", lat: 40.7942, lng: 43.8453, timezone: 4, costPerMonth: 600, tagline: "Armenia's cultural heart—black stone architecture, crafts, and resilient spirit.", scores: { climate: 5, cost: 10, wifi: 6, nightlife: 4, nature: 7, safety: 8, food: 7, community: 3, english: 4, visa: 9 } },
  { id: "haifa", name: "Haifa", country: "Israel", flag: "🇮🇱", climateType: "Mediterranean", lat: 32.7940, lng: 34.9896, timezone: 2, costPerMonth: 2000, tagline: "Bahá'í gardens cascade down to the sea—tech hub with Mediterranean soul.", scores: { climate: 8, cost: 5, wifi: 9, nightlife: 6, nature: 7, safety: 7, food: 8, community: 5, english: 8, visa: 5 } },
  { id: "eilat", name: "Eilat", country: "Israel", flag: "🇮🇱", climateType: "Desert", lat: 29.5581, lng: 34.9482, timezone: 2, costPerMonth: 1800, tagline: "Red Sea resort—year-round diving, desert adventures, and duty-free shopping.", scores: { climate: 8, cost: 5, wifi: 8, nightlife: 7, nature: 9, safety: 7, food: 7, community: 4, english: 8, visa: 5 } },
  { id: "aqaba", name: "Aqaba", country: "Jordan", flag: "🇯🇴", climateType: "Desert", lat: 29.5267, lng: 35.0078, timezone: 3, costPerMonth: 1000, tagline: "Jordan's Red Sea gem—Petra gateway, coral reefs, and desert warmth.", scores: { climate: 8, cost: 7, wifi: 6, nightlife: 4, nature: 9, safety: 8, food: 7, community: 3, english: 6, visa: 7 } },
  { id: "manama", name: "Manama", country: "Bahrain", flag: "🇧🇭", climateType: "Desert", lat: 26.2285, lng: 50.5860, timezone: 3, costPerMonth: 1800, tagline: "Gulf's liberal island—F1 circuits, souks, and expat-friendly lifestyle.", scores: { climate: 6, cost: 5, wifi: 8, nightlife: 7, nature: 4, safety: 8, food: 7, community: 5, english: 8, visa: 6 } },

  // SOUTHEAST ASIA (15)
  { id: "luangprabang", name: "Luang Prabang", country: "Laos", flag: "🇱🇦", climateType: "Tropical", lat: 19.8830, lng: 102.1347, timezone: 7, costPerMonth: 800, tagline: "UNESCO riverside—morning alms, French colonial charm, and Mekong magic.", scores: { climate: 7, cost: 9, wifi: 5, nightlife: 4, nature: 9, safety: 8, food: 8, community: 4, english: 4, visa: 7 } },
  { id: "pai", name: "Pai", country: "Thailand", flag: "🇹🇭", climateType: "Tropical", lat: 19.3592, lng: 98.4422, timezone: 7, costPerMonth: 700, tagline: "Mountain hippie town—hot springs, waterfalls, and chill northern vibes.", scores: { climate: 8, cost: 9, wifi: 6, nightlife: 5, nature: 9, safety: 8, food: 8, community: 6, english: 6, visa: 6 } },
  { id: "krabi", name: "Krabi", country: "Thailand", flag: "🇹🇭", climateType: "Tropical", lat: 8.0863, lng: 98.9063, timezone: 7, costPerMonth: 1000, tagline: "Limestone paradise—island hopping, rock climbing, and Andaman adventures.", scores: { climate: 8, cost: 8, wifi: 7, nightlife: 5, nature: 10, safety: 8, food: 8, community: 6, english: 6, visa: 6 } },
  { id: "kampot", name: "Kampot", country: "Cambodia", flag: "🇰🇭", climateType: "Tropical", lat: 10.5943, lng: 104.1640, timezone: 7, costPerMonth: 600, tagline: "Pepper farms and river sunsets—Cambodia's most charming small town.", scores: { climate: 8, cost: 9, wifi: 5, nightlife: 4, nature: 8, safety: 7, food: 7, community: 4, english: 5, visa: 8 } },
  { id: "dalat", name: "Da Lat", country: "Vietnam", flag: "🇻🇳", climateType: "Highland", lat: 11.9404, lng: 108.4583, timezone: 7, costPerMonth: 700, tagline: "Vietnam's little Paris—cool highlands, coffee farms, and French villas.", scores: { climate: 9, cost: 9, wifi: 7, nightlife: 5, nature: 9, safety: 8, food: 8, community: 5, english: 5, visa: 6 } },
  { id: "quynhon", name: "Quy Nhon", country: "Vietnam", flag: "🇻🇳", climateType: "Tropical", lat: 13.7830, lng: 109.2197, timezone: 7, costPerMonth: 600, tagline: "Vietnam's next big thing—pristine beaches, seafood, and zero tourists.", scores: { climate: 8, cost: 9, wifi: 6, nightlife: 4, nature: 8, safety: 9, food: 8, community: 3, english: 3, visa: 6 } },
  { id: "sapa", name: "Sapa", country: "Vietnam", flag: "🇻🇳", climateType: "Subtropical Highland", lat: 22.3364, lng: 103.8438, timezone: 7, costPerMonth: 600, tagline: "Rice terrace wonderland—trekking, ethnic villages, and mountain mist.", scores: { climate: 6, cost: 9, wifi: 5, nightlife: 3, nature: 10, safety: 8, food: 7, community: 4, english: 4, visa: 6 } },
  { id: "malacca", name: "Malacca", country: "Malaysia", flag: "🇲🇾", climateType: "Tropical", lat: 2.1896, lng: 102.2501, timezone: 8, costPerMonth: 800, tagline: "Straits heritage—UNESCO old town, Peranakan culture, and food paradise.", scores: { climate: 8, cost: 8, wifi: 7, nightlife: 5, nature: 5, safety: 8, food: 9, community: 4, english: 7, visa: 7 } },
  { id: "kotakinabalu", name: "Kota Kinabalu", country: "Malaysia", flag: "🇲🇾", climateType: "Tropical", lat: 5.9804, lng: 116.0735, timezone: 8, costPerMonth: 900, tagline: "Borneo's gateway—Mount Kinabalu, island parks, and jungle adventures.", scores: { climate: 8, cost: 8, wifi: 7, nightlife: 5, nature: 10, safety: 8, food: 8, community: 4, english: 7, visa: 7 } },
  { id: "siargao", name: "Siargao", country: "Philippines", flag: "🇵🇭", climateType: "Tropical", lat: 9.8482, lng: 126.0458, timezone: 8, costPerMonth: 900, tagline: "Surfing capital—Cloud 9 waves, island hopping, and barefoot paradise.", scores: { climate: 8, cost: 8, wifi: 5, nightlife: 6, nature: 10, safety: 7, food: 7, community: 7, english: 8, visa: 7 } },
  { id: "palawan", name: "Palawan", country: "Philippines", flag: "🇵🇭", climateType: "Tropical", lat: 9.8349, lng: 118.7384, timezone: 8, costPerMonth: 800, tagline: "Best island in the world—underground rivers, lagoons, and pristine nature.", scores: { climate: 8, cost: 8, wifi: 4, nightlife: 4, nature: 10, safety: 7, food: 7, community: 5, english: 8, visa: 7 } },
  { id: "boracay", name: "Boracay", country: "Philippines", flag: "🇵🇭", climateType: "Tropical", lat: 11.9674, lng: 121.9248, timezone: 8, costPerMonth: 1000, tagline: "White Beach paradise—sunset sailing, vibrant nightlife, and island energy.", scores: { climate: 8, cost: 7, wifi: 6, nightlife: 8, nature: 9, safety: 7, food: 7, community: 6, english: 8, visa: 7 } },
  { id: "dumaguete", name: "Dumaguete", country: "Philippines", flag: "🇵🇭", climateType: "Tropical", lat: 9.3068, lng: 123.3054, timezone: 8, costPerMonth: 700, tagline: "City of gentle people—university town, diving paradise, and slow living.", scores: { climate: 8, cost: 8, wifi: 6, nightlife: 5, nature: 9, safety: 8, food: 7, community: 5, english: 9, visa: 7 } },
  { id: "elnido", name: "El Nido", country: "Philippines", flag: "🇵🇭", climateType: "Tropical", lat: 11.1784, lng: 119.3930, timezone: 8, costPerMonth: 1100, tagline: "Limestone cathedral—secret lagoons, island hopping, and bucket-list beauty.", scores: { climate: 8, cost: 7, wifi: 4, nightlife: 5, nature: 10, safety: 7, food: 7, community: 5, english: 8, visa: 7 } },
  { id: "lombok", name: "Lombok", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical", lat: -8.6500, lng: 116.3249, timezone: 8, costPerMonth: 900, tagline: "Bali's quieter neighbor—Rinjani volcano, Gili islands, and authentic vibes.", scores: { climate: 9, cost: 8, wifi: 6, nightlife: 5, nature: 10, safety: 7, food: 7, community: 5, english: 5, visa: 5 } },

  // MORE INDONESIA (5)
  { id: "bandung", name: "Bandung", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical Highland", lat: -6.9175, lng: 107.6191, timezone: 7, costPerMonth: 700, tagline: "Java's cool highland—volcanic craters, tea plantations, and café culture.", scores: { climate: 8, cost: 9, wifi: 7, nightlife: 6, nature: 8, safety: 7, food: 8, community: 4, english: 4, visa: 5 } },
  { id: "surabaya", name: "Surabaya", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical", lat: -7.2575, lng: 112.7521, timezone: 7, costPerMonth: 700, tagline: "East Java's hero city—gateway to volcanoes, authentic Indonesia.", scores: { climate: 8, cost: 9, wifi: 7, nightlife: 5, nature: 7, safety: 7, food: 8, community: 3, english: 4, visa: 5 } },
  { id: "malang", name: "Malang", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical Highland", lat: -7.9666, lng: 112.6326, timezone: 7, costPerMonth: 600, tagline: "Colonial hill town—Bromo gateway, apple orchards, and Dutch heritage.", scores: { climate: 8, cost: 9, wifi: 6, nightlife: 5, nature: 9, safety: 8, food: 7, community: 3, english: 4, visa: 5 } },
  { id: "semarang", name: "Semarang", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical", lat: -6.9666, lng: 110.4196, timezone: 7, costPerMonth: 600, tagline: "Central Java's capital—temples, traditions, and unexplored charm.", scores: { climate: 8, cost: 9, wifi: 7, nightlife: 5, nature: 6, safety: 7, food: 8, community: 3, english: 4, visa: 5 } },
  { id: "nusapenida", name: "Nusa Penida", country: "Indonesia", flag: "🇮🇩", climateType: "Tropical", lat: -8.7275, lng: 115.5444, timezone: 8, costPerMonth: 1100, tagline: "Bali's wild island—dramatic cliffs, manta rays, and Instagram famous spots.", scores: { climate: 9, cost: 7, wifi: 5, nightlife: 3, nature: 10, safety: 7, food: 6, community: 4, english: 5, visa: 5 } },

  // SOUTH AMERICA (5)
  { id: "sucre", name: "Sucre", country: "Bolivia", flag: "🇧🇴", climateType: "Subtropical Highland", lat: -19.0196, lng: -65.2619, timezone: -4, costPerMonth: 600, tagline: "Bolivia's white city—colonial perfection, language schools, and altitude charm.", scores: { climate: 8, cost: 9, wifi: 5, nightlife: 5, nature: 7, safety: 7, food: 7, community: 4, english: 3, visa: 8 } },
  { id: "cochabamba", name: "Cochabamba", country: "Bolivia", flag: "🇧🇴", climateType: "Subtropical Highland", lat: -17.3935, lng: -66.1570, timezone: -4, costPerMonth: 600, tagline: "City of eternal spring—Bolivia's food capital and valley paradise.", scores: { climate: 9, cost: 9, wifi: 5, nightlife: 5, nature: 7, safety: 6, food: 8, community: 3, english: 3, visa: 8 } },
  { id: "vilcabamba", name: "Vilcabamba", country: "Ecuador", flag: "🇪🇨", climateType: "Subtropical Highland", lat: -4.2636, lng: -79.2219, timezone: -5, costPerMonth: 700, tagline: "Valley of longevity—expat haven, hiking trails, and eternal spring.", scores: { climate: 9, cost: 9, wifi: 5, nightlife: 3, nature: 9, safety: 7, food: 7, community: 5, english: 5, visa: 8 } },
  { id: "mancora", name: "Máncora", country: "Peru", flag: "🇵🇪", climateType: "Desert", lat: -4.1034, lng: -81.0453, timezone: -5, costPerMonth: 900, tagline: "Peru's surf town—eternal summer, beach bars, and laid-back coastal living.", scores: { climate: 9, cost: 8, wifi: 5, nightlife: 6, nature: 8, safety: 6, food: 8, community: 5, english: 4, visa: 8 } },
  { id: "huanchaco", name: "Huanchaco", country: "Peru", flag: "🇵🇪", climateType: "Desert", lat: -8.0775, lng: -79.1194, timezone: -5, costPerMonth: 700, tagline: "Ancient surf village—reed boats, ceviche, and pre-Inca history.", scores: { climate: 8, cost: 9, wifi: 5, nightlife: 4, nature: 7, safety: 7, food: 8, community: 4, english: 4, visa: 8 } },
];

// Read existing cities-data.js
const dataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(dataPath, 'utf-8');

// Find the closing bracket of CITIES array
const closingBracket = content.lastIndexOf('];');

// Generate new city entries
let newEntries = '';
NEW_CITIES.forEach(city => {
  newEntries += `  {
    id: "${city.id}",
    climateType: "${city.climateType}",
    name: "${city.name}",
    country: "${city.country}",
    flag: "${city.flag}",
    tagline: "${city.tagline}",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop",
    scores: {
      climate: ${city.scores.climate},
      cost: ${city.scores.cost},
      wifi: ${city.scores.wifi},
      nightlife: ${city.scores.nightlife},
      nature: ${city.scores.nature},
      safety: ${city.scores.safety},
      food: ${city.scores.food},
      community: ${city.scores.community},
      english: ${city.scores.english},
      visa: ${city.scores.visa}
    },
    costPerMonth: ${city.costPerMonth},
    lat: ${city.lat},
    lng: ${city.lng},
    timezone: ${city.timezone}
  },
`;
});

// Insert new cities before the closing bracket
content = content.slice(0, closingBracket) + newEntries + content.slice(closingBracket);

// Update the comment at top
content = content.replace(
  /This file contains data for \d+ popular digital nomad destinations/,
  `This file contains data for ${219 + NEW_CITIES.length} popular digital nomad destinations`
);

// Write back
fs.writeFileSync(dataPath, content, 'utf-8');

console.log(`Added ${NEW_CITIES.length} new cities to cities-data.js`);
console.log('New cities:', NEW_CITIES.map(c => c.id).join(', '));

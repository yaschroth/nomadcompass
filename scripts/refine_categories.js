/**
 * Script to refine culture, cleanliness, and air quality scores
 * Based on:
 * - Culture: UNESCO sites, museum density, historical significance, arts scene
 * - Cleanliness: Sanitation indexes, waste management, infrastructure
 * - Air Quality: WHO PM2.5 data, AQI averages
 */

const fs = require('fs');
const path = require('path');

// City-specific scores based on research
// Format: { culture, cleanliness, airquality }
const cityScores = {
  // ===== EUROPE =====
  // Portugal
  'lisbon': { culture: 9, cleanliness: 7, airquality: 8 },
  'porto': { culture: 9, cleanliness: 7, airquality: 8 },
  'faro': { culture: 6, cleanliness: 7, airquality: 9 },
  'cascais': { culture: 6, cleanliness: 8, airquality: 8 },
  'coimbra': { culture: 8, cleanliness: 7, airquality: 8 },
  'funchal': { culture: 6, cleanliness: 7, airquality: 9 },
  'pontadelgada': { culture: 5, cleanliness: 7, airquality: 10 },
  'ericeira': { culture: 5, cleanliness: 7, airquality: 9 },

  // Spain
  'barcelona': { culture: 10, cleanliness: 7, airquality: 7 },
  'madrid': { culture: 10, cleanliness: 7, airquality: 6 },
  'valencia': { culture: 8, cleanliness: 7, airquality: 7 },
  'seville': { culture: 9, cleanliness: 7, airquality: 7 },
  'malaga': { culture: 7, cleanliness: 7, airquality: 8 },
  'tenerife': { culture: 5, cleanliness: 7, airquality: 9 },
  'laspalmas': { culture: 6, cleanliness: 7, airquality: 9 },
  'bilbao': { culture: 8, cleanliness: 8, airquality: 7 },
  'granadaspain': { culture: 9, cleanliness: 7, airquality: 7 },
  'palma': { culture: 7, cleanliness: 7, airquality: 8 },
  'ibiza': { culture: 5, cleanliness: 6, airquality: 9 },
  'marbella': { culture: 5, cleanliness: 7, airquality: 8 },
  'cadiz': { culture: 7, cleanliness: 6, airquality: 8 },
  'girona': { culture: 8, cleanliness: 8, airquality: 7 },
  'tarifa': { culture: 5, cleanliness: 6, airquality: 9 },
  'fuerteventura': { culture: 4, cleanliness: 7, airquality: 9 },
  'gijon': { culture: 6, cleanliness: 7, airquality: 8 },

  // France
  'paris': { culture: 10, cleanliness: 6, airquality: 6 },
  'lyon': { culture: 8, cleanliness: 7, airquality: 6 },
  'nice': { culture: 8, cleanliness: 7, airquality: 7 },
  'bordeaux': { culture: 8, cleanliness: 7, airquality: 7 },
  'toulouse': { culture: 7, cleanliness: 7, airquality: 7 },
  'montpellier': { culture: 7, cleanliness: 7, airquality: 7 },
  'marseille': { culture: 8, cleanliness: 5, airquality: 6 },
  'nantes': { culture: 7, cleanliness: 7, airquality: 7 },
  'annecy': { culture: 6, cleanliness: 8, airquality: 7 },

  // Italy
  'rome': { culture: 10, cleanliness: 5, airquality: 6 },
  'milan': { culture: 9, cleanliness: 6, airquality: 5 },
  'florence': { culture: 10, cleanliness: 6, airquality: 6 },
  'naples': { culture: 9, cleanliness: 4, airquality: 6 },
  'bologna': { culture: 8, cleanliness: 6, airquality: 6 },
  'turin': { culture: 8, cleanliness: 7, airquality: 5 },
  'verona': { culture: 8, cleanliness: 7, airquality: 6 },
  'palermo': { culture: 8, cleanliness: 5, airquality: 7 },
  'bari': { culture: 7, cleanliness: 5, airquality: 7 },
  'catania': { culture: 7, cleanliness: 5, airquality: 7 },

  // Germany
  'berlin': { culture: 10, cleanliness: 7, airquality: 7 },
  'munich': { culture: 9, cleanliness: 8, airquality: 7 },
  'hamburg': { culture: 8, cleanliness: 8, airquality: 7 },
  'cologne': { culture: 8, cleanliness: 7, airquality: 6 },
  'frankfurt': { culture: 7, cleanliness: 8, airquality: 6 },
  'dresden': { culture: 9, cleanliness: 8, airquality: 7 },
  'leipzig': { culture: 8, cleanliness: 7, airquality: 6 },
  'heidelberg': { culture: 8, cleanliness: 8, airquality: 7 },

  // UK & Ireland
  'london': { culture: 10, cleanliness: 7, airquality: 6 },
  'manchester': { culture: 8, cleanliness: 6, airquality: 6 },
  'edinburgh': { culture: 9, cleanliness: 7, airquality: 7 },
  'brighton': { culture: 7, cleanliness: 6, airquality: 7 },
  'bristol': { culture: 7, cleanliness: 7, airquality: 7 },
  'glasgow': { culture: 8, cleanliness: 6, airquality: 7 },
  'dublin': { culture: 8, cleanliness: 6, airquality: 7 },
  'cork': { culture: 6, cleanliness: 6, airquality: 8 },
  'galway': { culture: 7, cleanliness: 6, airquality: 8 },

  // Netherlands & Belgium
  'amsterdam': { culture: 9, cleanliness: 7, airquality: 7 },
  'rotterdam': { culture: 7, cleanliness: 8, airquality: 7 },
  'utrecht': { culture: 7, cleanliness: 8, airquality: 7 },
  'maastricht': { culture: 7, cleanliness: 8, airquality: 7 },
  'eindhoven': { culture: 6, cleanliness: 8, airquality: 7 },
  'brussels': { culture: 8, cleanliness: 6, airquality: 6 },
  'antwerp': { culture: 8, cleanliness: 7, airquality: 6 },
  'ghent': { culture: 8, cleanliness: 7, airquality: 7 },
  'bruges': { culture: 9, cleanliness: 8, airquality: 7 },

  // Austria & Switzerland
  'vienna': { culture: 10, cleanliness: 9, airquality: 7 },
  'salzburg': { culture: 9, cleanliness: 9, airquality: 8 },
  'innsbruck': { culture: 7, cleanliness: 9, airquality: 8 },
  'graz': { culture: 7, cleanliness: 9, airquality: 7 },
  'zurich': { culture: 8, cleanliness: 10, airquality: 8 },
  'geneva': { culture: 8, cleanliness: 9, airquality: 7 },
  'basel': { culture: 8, cleanliness: 9, airquality: 7 },
  'lausanne': { culture: 7, cleanliness: 9, airquality: 8 },
  'lucerne': { culture: 7, cleanliness: 10, airquality: 9 },

  // Nordic countries
  'copenhagen': { culture: 9, cleanliness: 9, airquality: 8 },
  'aarhus': { culture: 7, cleanliness: 9, airquality: 8 },
  'stockholm': { culture: 9, cleanliness: 9, airquality: 8 },
  'gothenburg': { culture: 7, cleanliness: 9, airquality: 8 },
  'malmo': { culture: 7, cleanliness: 9, airquality: 8 },
  'oslo': { culture: 8, cleanliness: 9, airquality: 8 },
  'bergen': { culture: 7, cleanliness: 9, airquality: 9 },
  'stavanger': { culture: 6, cleanliness: 9, airquality: 9 },
  'helsinki': { culture: 8, cleanliness: 9, airquality: 9 },
  'tampere': { culture: 6, cleanliness: 9, airquality: 9 },
  'reykjavik': { culture: 7, cleanliness: 9, airquality: 10 },

  // Baltics
  'tallinn': { culture: 8, cleanliness: 8, airquality: 8 },
  'tartu': { culture: 6, cleanliness: 8, airquality: 9 },
  'riga': { culture: 8, cleanliness: 7, airquality: 7 },
  'vilnius': { culture: 8, cleanliness: 7, airquality: 7 },
  'kaunas': { culture: 7, cleanliness: 7, airquality: 7 },
  'klaipeda': { culture: 6, cleanliness: 7, airquality: 8 },

  // Poland & Czech
  'warsaw': { culture: 8, cleanliness: 7, airquality: 5 },
  'krakow': { culture: 9, cleanliness: 7, airquality: 4 },
  'gdansk': { culture: 8, cleanliness: 7, airquality: 6 },
  'wroclaw': { culture: 8, cleanliness: 7, airquality: 5 },
  'poznan': { culture: 7, cleanliness: 7, airquality: 5 },
  'prague': { culture: 10, cleanliness: 7, airquality: 6 },
  'brno': { culture: 7, cleanliness: 7, airquality: 6 },

  // Hungary, Slovakia, Romania
  'budapest': { culture: 9, cleanliness: 6, airquality: 5 },
  'bratislava': { culture: 7, cleanliness: 7, airquality: 6 },
  'kosice': { culture: 6, cleanliness: 7, airquality: 6 },
  'bucharest': { culture: 7, cleanliness: 5, airquality: 5 },
  'clujnapoca': { culture: 6, cleanliness: 6, airquality: 6 },
  'brasov': { culture: 7, cleanliness: 6, airquality: 7 },
  'sibiu': { culture: 7, cleanliness: 7, airquality: 7 },
  'timisoara': { culture: 6, cleanliness: 6, airquality: 6 },

  // Bulgaria
  'sofia': { culture: 7, cleanliness: 5, airquality: 5 },
  'plovdiv': { culture: 8, cleanliness: 6, airquality: 6 },
  'varna': { culture: 6, cleanliness: 6, airquality: 7 },

  // Balkans
  'belgrade': { culture: 8, cleanliness: 5, airquality: 5 },
  'novisad': { culture: 7, cleanliness: 6, airquality: 6 },
  'zagreb': { culture: 7, cleanliness: 7, airquality: 7 },
  'split': { culture: 8, cleanliness: 7, airquality: 8 },
  'dubrovnik': { culture: 9, cleanliness: 8, airquality: 8 },
  'pula': { culture: 7, cleanliness: 7, airquality: 8 },
  'zadar': { culture: 7, cleanliness: 7, airquality: 8 },
  'ljubljana': { culture: 7, cleanliness: 8, airquality: 7 },
  'bled': { culture: 6, cleanliness: 8, airquality: 8 },
  'piran': { culture: 6, cleanliness: 8, airquality: 8 },
  'sarajevo': { culture: 8, cleanliness: 5, airquality: 4 },
  'mostar': { culture: 8, cleanliness: 5, airquality: 6 },
  'podgorica': { culture: 5, cleanliness: 5, airquality: 7 },
  'kotor': { culture: 8, cleanliness: 6, airquality: 8 },
  'tirana': { culture: 6, cleanliness: 4, airquality: 5 },
  'sarande': { culture: 5, cleanliness: 5, airquality: 8 },
  'skopje': { culture: 6, cleanliness: 5, airquality: 4 },
  'ohrid': { culture: 8, cleanliness: 5, airquality: 7 },
  'prizren': { culture: 7, cleanliness: 5, airquality: 5 },

  // Greece & Cyprus & Malta
  'athens': { culture: 10, cleanliness: 5, airquality: 6 },
  'thessaloniki': { culture: 8, cleanliness: 5, airquality: 6 },
  'crete': { culture: 8, cleanliness: 6, airquality: 8 },
  'chania': { culture: 8, cleanliness: 6, airquality: 8 },
  'rhodes': { culture: 8, cleanliness: 6, airquality: 8 },
  'santorini': { culture: 7, cleanliness: 7, airquality: 9 },
  'cyprus': { culture: 7, cleanliness: 6, airquality: 7 },
  'paphos': { culture: 8, cleanliness: 7, airquality: 7 },
  'malta': { culture: 8, cleanliness: 6, airquality: 7 },
  'valletta': { culture: 9, cleanliness: 7, airquality: 7 },

  // Turkey
  'istanbul': { culture: 10, cleanliness: 5, airquality: 5 },
  'antalya': { culture: 7, cleanliness: 6, airquality: 7 },
  'bodrum': { culture: 6, cleanliness: 6, airquality: 8 },
  'fethiye': { culture: 6, cleanliness: 6, airquality: 8 },
  'izmir': { culture: 7, cleanliness: 5, airquality: 6 },
  'cappadocia': { culture: 9, cleanliness: 6, airquality: 8 },

  // Caucasus
  'tbilisi': { culture: 8, cleanliness: 5, airquality: 6 },
  'batumi': { culture: 5, cleanliness: 5, airquality: 7 },
  'kutaisi': { culture: 6, cleanliness: 5, airquality: 7 },
  'yerevan': { culture: 8, cleanliness: 5, airquality: 5 },
  'gyumri': { culture: 6, cleanliness: 4, airquality: 6 },
  'baku': { culture: 7, cleanliness: 6, airquality: 5 },

  // ===== ASIA =====
  // Japan
  'tokyo': { culture: 10, cleanliness: 10, airquality: 7 },
  'osaka': { culture: 9, cleanliness: 9, airquality: 7 },
  'kyoto': { culture: 10, cleanliness: 9, airquality: 7 },
  'fukuoka': { culture: 7, cleanliness: 9, airquality: 7 },
  'sapporo': { culture: 7, cleanliness: 9, airquality: 8 },
  'nagoya': { culture: 7, cleanliness: 9, airquality: 7 },

  // South Korea
  'seoul': { culture: 9, cleanliness: 8, airquality: 4 },
  'busan': { culture: 7, cleanliness: 8, airquality: 5 },
  'jeju': { culture: 6, cleanliness: 8, airquality: 7 },

  // Taiwan & Hong Kong
  'taipei': { culture: 8, cleanliness: 7, airquality: 6 },
  'hongkong': { culture: 8, cleanliness: 8, airquality: 5 },

  // China
  'shenzhen': { culture: 5, cleanliness: 7, airquality: 4 },

  // Singapore
  'singapore': { culture: 7, cleanliness: 10, airquality: 6 },

  // Malaysia
  'kualalumpur': { culture: 7, cleanliness: 6, airquality: 5 },
  'penang': { culture: 8, cleanliness: 6, airquality: 5 },
  'langkawi': { culture: 5, cleanliness: 6, airquality: 7 },
  'malacca': { culture: 8, cleanliness: 6, airquality: 6 },
  'kotakinabalu': { culture: 5, cleanliness: 6, airquality: 7 },
  'ipoh': { culture: 6, cleanliness: 6, airquality: 6 },

  // Thailand
  'bangkok': { culture: 9, cleanliness: 5, airquality: 3 },
  'chiangmai': { culture: 8, cleanliness: 5, airquality: 3 },
  'phuket': { culture: 6, cleanliness: 5, airquality: 7 },
  'kohphangan': { culture: 4, cleanliness: 4, airquality: 8 },
  'kohsamui': { culture: 5, cleanliness: 5, airquality: 7 },
  'krabi': { culture: 5, cleanliness: 5, airquality: 7 },
  'pai': { culture: 5, cleanliness: 4, airquality: 5 },
  'huahin': { culture: 4, cleanliness: 5, airquality: 6 },

  // Vietnam
  'hochiminhcity': { culture: 8, cleanliness: 4, airquality: 4 },
  'hanoi': { culture: 9, cleanliness: 4, airquality: 3 },
  'danang': { culture: 6, cleanliness: 5, airquality: 6 },
  'hoian': { culture: 9, cleanliness: 5, airquality: 6 },
  'nhatrang': { culture: 5, cleanliness: 4, airquality: 6 },
  'dalat': { culture: 6, cleanliness: 5, airquality: 7 },
  'quynhon': { culture: 5, cleanliness: 5, airquality: 7 },
  'sapa': { culture: 7, cleanliness: 4, airquality: 6 },
  'phuquoc': { culture: 4, cleanliness: 5, airquality: 8 },

  // Indonesia
  'bali': { culture: 9, cleanliness: 4, airquality: 6 },
  'ubud': { culture: 9, cleanliness: 5, airquality: 6 },
  'canggu': { culture: 6, cleanliness: 4, airquality: 6 },
  'yogyakarta': { culture: 9, cleanliness: 5, airquality: 5 },
  'lombok': { culture: 6, cleanliness: 4, airquality: 7 },
  'bandung': { culture: 6, cleanliness: 4, airquality: 4 },
  'surabaya': { culture: 6, cleanliness: 4, airquality: 5 },
  'malang': { culture: 6, cleanliness: 5, airquality: 5 },
  'semarang': { culture: 6, cleanliness: 4, airquality: 5 },
  'nusapenida': { culture: 5, cleanliness: 4, airquality: 8 },

  // Philippines
  'manila': { culture: 7, cleanliness: 4, airquality: 4 },
  'cebu': { culture: 6, cleanliness: 4, airquality: 5 },
  'siargao': { culture: 4, cleanliness: 4, airquality: 8 },
  'palawan': { culture: 5, cleanliness: 5, airquality: 8 },
  'boracay': { culture: 4, cleanliness: 5, airquality: 8 },
  'dumaguete': { culture: 5, cleanliness: 5, airquality: 7 },
  'elnido': { culture: 4, cleanliness: 4, airquality: 9 },

  // Cambodia & Laos
  'phnompenh': { culture: 7, cleanliness: 3, airquality: 5 },
  'siemreap': { culture: 10, cleanliness: 4, airquality: 6 },
  'kampot': { culture: 5, cleanliness: 4, airquality: 7 },
  'vientiane': { culture: 6, cleanliness: 4, airquality: 5 },
  'luangprabang': { culture: 9, cleanliness: 5, airquality: 7 },

  // India
  'mumbai': { culture: 9, cleanliness: 3, airquality: 3 },
  'bangalore': { culture: 7, cleanliness: 4, airquality: 4 },
  'goa': { culture: 7, cleanliness: 4, airquality: 6 },
  'pune': { culture: 7, cleanliness: 4, airquality: 4 },
  'jaipur': { culture: 9, cleanliness: 4, airquality: 3 },
  'kochi': { culture: 7, cleanliness: 5, airquality: 6 },

  // Sri Lanka & Nepal
  'colombo': { culture: 7, cleanliness: 4, airquality: 5 },
  'weligama': { culture: 5, cleanliness: 4, airquality: 7 },
  'kathmandu': { culture: 9, cleanliness: 3, airquality: 2 },
  'pokhara': { culture: 6, cleanliness: 4, airquality: 5 },

  // Middle East
  'dubai': { culture: 6, cleanliness: 9, airquality: 5 },
  'abudhabi': { culture: 7, cleanliness: 9, airquality: 5 },
  'doha': { culture: 6, cleanliness: 9, airquality: 5 },
  'manama': { culture: 5, cleanliness: 7, airquality: 5 },
  'muscat': { culture: 6, cleanliness: 8, airquality: 6 },
  'telaviv': { culture: 8, cleanliness: 7, airquality: 6 },
  'haifa': { culture: 7, cleanliness: 7, airquality: 6 },
  'eilat': { culture: 4, cleanliness: 7, airquality: 7 },
  'amman': { culture: 8, cleanliness: 5, airquality: 5 },
  'aqaba': { culture: 5, cleanliness: 5, airquality: 7 },
  'beirut': { culture: 8, cleanliness: 4, airquality: 5 },

  // ===== AFRICA =====
  'cairo': { culture: 10, cleanliness: 3, airquality: 2 },
  'marrakech': { culture: 9, cleanliness: 4, airquality: 6 },
  'casablanca': { culture: 7, cleanliness: 5, airquality: 5 },
  'essaouira': { culture: 7, cleanliness: 5, airquality: 8 },
  'chefchaouen': { culture: 7, cleanliness: 5, airquality: 8 },
  'taghazout': { culture: 4, cleanliness: 4, airquality: 8 },
  'rabat': { culture: 7, cleanliness: 6, airquality: 6 },
  'tunis': { culture: 8, cleanliness: 4, airquality: 5 },
  'capetown': { culture: 8, cleanliness: 6, airquality: 7 },
  'johannesburg': { culture: 6, cleanliness: 5, airquality: 5 },
  'nairobi': { culture: 6, cleanliness: 4, airquality: 5 },
  'zanzibar': { culture: 7, cleanliness: 4, airquality: 8 },
  'daressalaam': { culture: 5, cleanliness: 3, airquality: 5 },
  'kigali': { culture: 5, cleanliness: 8, airquality: 7 },
  'accra': { culture: 6, cleanliness: 4, airquality: 5 },
  'lagos': { culture: 6, cleanliness: 3, airquality: 3 },
  'dakar': { culture: 6, cleanliness: 4, airquality: 5 },
  'addisababa': { culture: 7, cleanliness: 4, airquality: 5 },
  'mauritius': { culture: 6, cleanliness: 7, airquality: 8 },

  // ===== AMERICAS =====
  // USA
  'austin': { culture: 8, cleanliness: 7, airquality: 7 },
  'miami': { culture: 7, cleanliness: 7, airquality: 7 },
  'denver': { culture: 7, cleanliness: 8, airquality: 6 },
  'portland': { culture: 8, cleanliness: 7, airquality: 6 },
  'seattle': { culture: 8, cleanliness: 7, airquality: 6 },

  // Canada
  'vancouver': { culture: 7, cleanliness: 8, airquality: 7 },
  'toronto': { culture: 8, cleanliness: 8, airquality: 6 },
  'montreal': { culture: 9, cleanliness: 7, airquality: 6 },

  // Mexico
  'mexicocity': { culture: 10, cleanliness: 5, airquality: 4 },
  'oaxaca': { culture: 9, cleanliness: 5, airquality: 7 },
  'playadelcarmen': { culture: 5, cleanliness: 5, airquality: 7 },
  'tulum': { culture: 6, cleanliness: 5, airquality: 8 },
  'guadalajara': { culture: 8, cleanliness: 5, airquality: 5 },
  'puertovallarta': { culture: 6, cleanliness: 6, airquality: 7 },
  'sanmigueldeallende': { culture: 9, cleanliness: 7, airquality: 7 },
  'merida': { culture: 8, cleanliness: 6, airquality: 7 },
  'guanajuato': { culture: 9, cleanliness: 6, airquality: 7 },
  'puertoescondido': { culture: 5, cleanliness: 4, airquality: 8 },
  'sayulita': { culture: 5, cleanliness: 5, airquality: 8 },

  // Central America & Caribbean
  'sanjosecr': { culture: 6, cleanliness: 6, airquality: 7 },
  'tamarindo': { culture: 4, cleanliness: 6, airquality: 8 },
  'panama': { culture: 6, cleanliness: 6, airquality: 6 },
  'boquete': { culture: 4, cleanliness: 6, airquality: 9 },
  'antigua': { culture: 9, cleanliness: 5, airquality: 7 },
  'lakeatitlan': { culture: 7, cleanliness: 4, airquality: 8 },
  'sanjuan': { culture: 8, cleanliness: 6, airquality: 7 },
  'puntacana': { culture: 4, cleanliness: 6, airquality: 8 },
  'santodomingo': { culture: 7, cleanliness: 5, airquality: 6 },

  // South America
  'medellin': { culture: 7, cleanliness: 6, airquality: 6 },
  'bogota': { culture: 8, cleanliness: 5, airquality: 5 },
  'cartagena': { culture: 8, cleanliness: 5, airquality: 7 },
  'santamarta': { culture: 5, cleanliness: 4, airquality: 7 },
  'cali': { culture: 7, cleanliness: 5, airquality: 6 },
  'lima': { culture: 8, cleanliness: 5, airquality: 5 },
  'cusco': { culture: 10, cleanliness: 5, airquality: 7 },
  'arequipa': { culture: 8, cleanliness: 5, airquality: 6 },
  'mancora': { culture: 4, cleanliness: 4, airquality: 8 },
  'huanchaco': { culture: 5, cleanliness: 4, airquality: 7 },
  'quito': { culture: 9, cleanliness: 5, airquality: 6 },
  'cuenca': { culture: 8, cleanliness: 6, airquality: 7 },
  'montanita': { culture: 4, cleanliness: 4, airquality: 8 },
  'vilcabamba': { culture: 5, cleanliness: 5, airquality: 8 },
  'buenosaires': { culture: 9, cleanliness: 5, airquality: 6 },
  'cordoba': { culture: 7, cleanliness: 6, airquality: 7 },
  'mendoza': { culture: 7, cleanliness: 6, airquality: 7 },
  'bariloche': { culture: 6, cleanliness: 7, airquality: 9 },
  'santiago': { culture: 8, cleanliness: 7, airquality: 5 },
  'valparaiso': { culture: 8, cleanliness: 5, airquality: 6 },
  'montevideo': { culture: 7, cleanliness: 7, airquality: 8 },
  'asuncion': { culture: 5, cleanliness: 4, airquality: 5 },
  'lapaz': { culture: 7, cleanliness: 4, airquality: 5 },
  'santacruz': { culture: 5, cleanliness: 5, airquality: 6 },
  'sucre': { culture: 8, cleanliness: 5, airquality: 7 },
  'cochabamba': { culture: 6, cleanliness: 4, airquality: 5 },
  'saopaulo': { culture: 9, cleanliness: 5, airquality: 5 },
  'florianopolis': { culture: 6, cleanliness: 6, airquality: 7 },
  'salvador': { culture: 9, cleanliness: 4, airquality: 6 },

  // ===== OCEANIA =====
  'sydney': { culture: 8, cleanliness: 8, airquality: 7 },
  'melbourne': { culture: 9, cleanliness: 8, airquality: 7 },
  'brisbane': { culture: 7, cleanliness: 8, airquality: 7 },
  'perth': { culture: 6, cleanliness: 8, airquality: 8 },
  'adelaide': { culture: 7, cleanliness: 8, airquality: 7 },
  'goldcoast': { culture: 5, cleanliness: 8, airquality: 8 },
  'byronbay': { culture: 5, cleanliness: 7, airquality: 9 },
  'cairns': { culture: 5, cleanliness: 7, airquality: 8 },
  'hobart': { culture: 6, cleanliness: 8, airquality: 9 },
  'auckland': { culture: 7, cleanliness: 8, airquality: 8 },
  'wellington': { culture: 8, cleanliness: 8, airquality: 9 },
  'queenstown': { culture: 5, cleanliness: 9, airquality: 10 },
  'christchurch': { culture: 6, cleanliness: 8, airquality: 8 }
};

// Read the cities-data.js file
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(citiesDataPath, 'utf-8');

// Update each city's scores
let updatedCount = 0;

for (const [cityId, scores] of Object.entries(cityScores)) {
  // Find this city's scores block
  const regex = new RegExp(
    `(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)culture:\\s*\\d+,\\s*cleanliness:\\s*\\d+,\\s*airquality:\\s*\\d+`,
    'g'
  );

  const replacement = `$1culture: ${scores.culture},\n      cleanliness: ${scores.cleanliness},\n      airquality: ${scores.airquality}`;

  const newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    content = newContent;
    updatedCount++;
  }
}

// Write the updated content
fs.writeFileSync(citiesDataPath, content, 'utf-8');

console.log(`Updated ${updatedCount} cities with refined scores!`);
console.log(`\nScoring methodology:`);
console.log(`- Culture: UNESCO sites, museums, historical significance, arts scene (1-10)`);
console.log(`- Cleanliness: Sanitation standards, waste management, street cleanliness (1-10)`);
console.log(`- Air Quality: WHO PM2.5 data, AQI averages - higher = cleaner air (1-10)`);

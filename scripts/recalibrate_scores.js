/**
 * Score Re-calibration Script
 *
 * Recalibrates Food, Safety, Climate, WiFi, and Nature scores
 * using data-driven criteria:
 *
 * - Food: Michelin stars, culinary reputation, street food culture
 * - Safety: Numbeo Crime Index (inverted - higher = safer)
 * - Climate: Temperature/humidity suitability for nomads
 * - WiFi: Speedtest Global Index, infrastructure quality
 * - Nature: Access to natural attractions, parks, beaches
 */

const fs = require('fs');
const path = require('path');

// City-specific recalibrated scores
// Format: { food, safety, climate, wifi, nature }
const cityScores = {
  // ===== EUROPE =====

  // Portugal
  'lisbon': { food: 8, safety: 8, climate: 9, wifi: 8, nature: 7 },
  'porto': { food: 8, safety: 8, climate: 8, wifi: 7, nature: 7 },
  'faro': { food: 6, safety: 8, climate: 9, wifi: 6, nature: 8 },
  'cascais': { food: 7, safety: 9, climate: 9, wifi: 7, nature: 8 },
  'coimbra': { food: 6, safety: 9, climate: 7, wifi: 6, nature: 6 },
  'funchal': { food: 6, safety: 9, climate: 8, wifi: 6, nature: 9 },
  'pontadelgada': { food: 5, safety: 9, climate: 7, wifi: 5, nature: 10 },
  'ericeira': { food: 6, safety: 9, climate: 8, wifi: 6, nature: 9 },

  // Spain
  'barcelona': { food: 9, safety: 6, climate: 8, wifi: 8, nature: 7 },
  'madrid': { food: 9, safety: 7, climate: 6, wifi: 8, nature: 5 },
  'valencia': { food: 8, safety: 7, climate: 8, wifi: 7, nature: 7 },
  'seville': { food: 8, safety: 7, climate: 6, wifi: 7, nature: 5 },
  'malaga': { food: 7, safety: 7, climate: 8, wifi: 7, nature: 7 },
  'tenerife': { food: 6, safety: 8, climate: 9, wifi: 7, nature: 9 },
  'laspalmas': { food: 6, safety: 7, climate: 9, wifi: 7, nature: 8 },
  'bilbao': { food: 9, safety: 8, climate: 6, wifi: 7, nature: 7 },
  'granadaspain': { food: 7, safety: 7, climate: 7, wifi: 6, nature: 8 },
  'palma': { food: 7, safety: 8, climate: 8, wifi: 7, nature: 8 },
  'ibiza': { food: 6, safety: 8, climate: 8, wifi: 6, nature: 8 },
  'marbella': { food: 6, safety: 7, climate: 8, wifi: 7, nature: 7 },
  'cadiz': { food: 7, safety: 7, climate: 8, wifi: 6, nature: 8 },
  'girona': { food: 8, safety: 8, climate: 7, wifi: 7, nature: 8 },
  'tarifa': { food: 5, safety: 8, climate: 8, wifi: 5, nature: 9 },
  'fuerteventura': { food: 4, safety: 9, climate: 9, wifi: 5, nature: 8 },
  'gijon': { food: 7, safety: 8, climate: 6, wifi: 6, nature: 8 },

  // France
  'paris': { food: 10, safety: 6, climate: 6, wifi: 8, nature: 4 },
  'lyon': { food: 10, safety: 7, climate: 6, wifi: 7, nature: 5 },
  'nice': { food: 8, safety: 7, climate: 8, wifi: 7, nature: 8 },
  'bordeaux': { food: 9, safety: 7, climate: 7, wifi: 7, nature: 6 },
  'toulouse': { food: 7, safety: 7, climate: 7, wifi: 7, nature: 6 },
  'montpellier': { food: 7, safety: 6, climate: 8, wifi: 7, nature: 7 },
  'marseille': { food: 8, safety: 5, climate: 8, wifi: 6, nature: 8 },
  'nantes': { food: 7, safety: 8, climate: 6, wifi: 7, nature: 5 },
  'annecy': { food: 7, safety: 9, climate: 6, wifi: 7, nature: 10 },

  // Italy
  'rome': { food: 10, safety: 6, climate: 7, wifi: 6, nature: 5 },
  'milan': { food: 9, safety: 7, climate: 5, wifi: 7, nature: 4 },
  'florence': { food: 9, safety: 7, climate: 7, wifi: 6, nature: 6 },
  'naples': { food: 10, safety: 4, climate: 7, wifi: 5, nature: 7 },
  'bologna': { food: 10, safety: 8, climate: 6, wifi: 7, nature: 5 },
  'turin': { food: 8, safety: 7, climate: 5, wifi: 7, nature: 7 },
  'verona': { food: 8, safety: 8, climate: 6, wifi: 6, nature: 7 },
  'palermo': { food: 8, safety: 5, climate: 8, wifi: 5, nature: 8 },
  'bari': { food: 8, safety: 6, climate: 8, wifi: 5, nature: 7 },
  'catania': { food: 8, safety: 5, climate: 8, wifi: 5, nature: 8 },

  // Germany
  'berlin': { food: 7, safety: 7, climate: 5, wifi: 8, nature: 5 },
  'munich': { food: 7, safety: 9, climate: 5, wifi: 8, nature: 8 },
  'hamburg': { food: 7, safety: 7, climate: 5, wifi: 8, nature: 5 },
  'cologne': { food: 6, safety: 7, climate: 5, wifi: 8, nature: 5 },
  'frankfurt': { food: 6, safety: 6, climate: 5, wifi: 9, nature: 5 },
  'dresden': { food: 6, safety: 8, climate: 5, wifi: 7, nature: 6 },
  'leipzig': { food: 6, safety: 7, climate: 5, wifi: 7, nature: 5 },
  'heidelberg': { food: 6, safety: 9, climate: 6, wifi: 7, nature: 7 },

  // UK & Ireland
  'london': { food: 9, safety: 6, climate: 5, wifi: 8, nature: 4 },
  'manchester': { food: 7, safety: 5, climate: 4, wifi: 8, nature: 5 },
  'edinburgh': { food: 7, safety: 7, climate: 4, wifi: 7, nature: 7 },
  'brighton': { food: 6, safety: 6, climate: 5, wifi: 7, nature: 7 },
  'bristol': { food: 6, safety: 6, climate: 5, wifi: 7, nature: 6 },
  'glasgow': { food: 6, safety: 5, climate: 4, wifi: 7, nature: 7 },
  'dublin': { food: 6, safety: 6, climate: 5, wifi: 8, nature: 6 },
  'cork': { food: 6, safety: 7, climate: 5, wifi: 6, nature: 7 },
  'galway': { food: 6, safety: 8, climate: 5, wifi: 6, nature: 8 },

  // Netherlands & Belgium
  'amsterdam': { food: 7, safety: 7, climate: 5, wifi: 9, nature: 4 },
  'rotterdam': { food: 6, safety: 7, climate: 5, wifi: 9, nature: 4 },
  'utrecht': { food: 6, safety: 8, climate: 5, wifi: 9, nature: 5 },
  'maastricht': { food: 6, safety: 9, climate: 5, wifi: 8, nature: 6 },
  'eindhoven': { food: 5, safety: 8, climate: 5, wifi: 9, nature: 4 },
  'brussels': { food: 8, safety: 5, climate: 5, wifi: 8, nature: 4 },
  'antwerp': { food: 7, safety: 6, climate: 5, wifi: 8, nature: 4 },
  'ghent': { food: 7, safety: 8, climate: 5, wifi: 8, nature: 5 },
  'bruges': { food: 7, safety: 9, climate: 5, wifi: 7, nature: 5 },

  // Austria & Switzerland
  'vienna': { food: 8, safety: 9, climate: 5, wifi: 8, nature: 6 },
  'salzburg': { food: 7, safety: 9, climate: 5, wifi: 7, nature: 9 },
  'innsbruck': { food: 6, safety: 9, climate: 4, wifi: 7, nature: 10 },
  'graz': { food: 6, safety: 9, climate: 5, wifi: 7, nature: 7 },
  'zurich': { food: 7, safety: 10, climate: 5, wifi: 9, nature: 8 },
  'geneva': { food: 8, safety: 9, climate: 5, wifi: 9, nature: 8 },
  'basel': { food: 7, safety: 9, climate: 5, wifi: 9, nature: 6 },
  'lausanne': { food: 7, safety: 9, climate: 5, wifi: 8, nature: 8 },
  'lucerne': { food: 6, safety: 10, climate: 5, wifi: 8, nature: 10 },

  // Nordic countries
  'copenhagen': { food: 9, safety: 9, climate: 4, wifi: 9, nature: 5 },
  'aarhus': { food: 7, safety: 9, climate: 4, wifi: 8, nature: 6 },
  'stockholm': { food: 8, safety: 8, climate: 4, wifi: 9, nature: 7 },
  'gothenburg': { food: 7, safety: 8, climate: 4, wifi: 8, nature: 7 },
  'malmo': { food: 6, safety: 6, climate: 4, wifi: 8, nature: 6 },
  'oslo': { food: 7, safety: 8, climate: 3, wifi: 9, nature: 9 },
  'bergen': { food: 6, safety: 9, climate: 4, wifi: 7, nature: 10 },
  'stavanger': { food: 5, safety: 9, climate: 4, wifi: 8, nature: 9 },
  'helsinki': { food: 7, safety: 9, climate: 3, wifi: 9, nature: 7 },
  'tampere': { food: 5, safety: 9, climate: 3, wifi: 9, nature: 8 },
  'reykjavik': { food: 5, safety: 10, climate: 3, wifi: 8, nature: 10 },

  // Baltics
  'tallinn': { food: 6, safety: 8, climate: 4, wifi: 9, nature: 6 },
  'tartu': { food: 5, safety: 9, climate: 4, wifi: 8, nature: 7 },
  'riga': { food: 6, safety: 7, climate: 4, wifi: 8, nature: 6 },
  'vilnius': { food: 6, safety: 8, climate: 4, wifi: 8, nature: 5 },
  'kaunas': { food: 5, safety: 8, climate: 4, wifi: 7, nature: 5 },
  'klaipeda': { food: 5, safety: 8, climate: 4, wifi: 7, nature: 7 },

  // Poland & Czech
  'warsaw': { food: 6, safety: 8, climate: 4, wifi: 8, nature: 4 },
  'krakow': { food: 7, safety: 8, climate: 4, wifi: 7, nature: 6 },
  'gdansk': { food: 6, safety: 8, climate: 4, wifi: 7, nature: 7 },
  'wroclaw': { food: 6, safety: 8, climate: 4, wifi: 7, nature: 5 },
  'poznan': { food: 5, safety: 8, climate: 4, wifi: 7, nature: 5 },
  'prague': { food: 7, safety: 8, climate: 5, wifi: 8, nature: 5 },
  'brno': { food: 6, safety: 9, climate: 5, wifi: 7, nature: 6 },

  // Hungary, Slovakia, Romania
  'budapest': { food: 7, safety: 7, climate: 5, wifi: 8, nature: 5 },
  'bratislava': { food: 5, safety: 8, climate: 5, wifi: 7, nature: 6 },
  'kosice': { food: 5, safety: 8, climate: 4, wifi: 6, nature: 7 },
  'bucharest': { food: 6, safety: 6, climate: 5, wifi: 9, nature: 4 },
  'clujnapoca': { food: 5, safety: 8, climate: 5, wifi: 8, nature: 7 },
  'brasov': { food: 5, safety: 8, climate: 5, wifi: 7, nature: 9 },
  'sibiu': { food: 5, safety: 9, climate: 5, wifi: 6, nature: 8 },
  'timisoara': { food: 5, safety: 7, climate: 5, wifi: 8, nature: 5 },

  // Bulgaria
  'sofia': { food: 5, safety: 7, climate: 5, wifi: 8, nature: 6 },
  'plovdiv': { food: 5, safety: 8, climate: 6, wifi: 7, nature: 6 },
  'varna': { food: 5, safety: 7, climate: 7, wifi: 6, nature: 8 },

  // Balkans
  'belgrade': { food: 6, safety: 6, climate: 5, wifi: 7, nature: 5 },
  'novisad': { food: 5, safety: 7, climate: 5, wifi: 7, nature: 5 },
  'zagreb': { food: 6, safety: 8, climate: 5, wifi: 7, nature: 6 },
  'split': { food: 7, safety: 8, climate: 8, wifi: 6, nature: 9 },
  'dubrovnik': { food: 7, safety: 9, climate: 8, wifi: 6, nature: 9 },
  'pula': { food: 6, safety: 9, climate: 7, wifi: 6, nature: 9 },
  'zadar': { food: 6, safety: 9, climate: 8, wifi: 6, nature: 8 },
  'ljubljana': { food: 6, safety: 9, climate: 6, wifi: 7, nature: 8 },
  'bled': { food: 5, safety: 9, climate: 5, wifi: 6, nature: 10 },
  'piran': { food: 6, safety: 9, climate: 7, wifi: 6, nature: 8 },
  'sarajevo': { food: 6, safety: 6, climate: 5, wifi: 6, nature: 8 },
  'mostar': { food: 5, safety: 7, climate: 6, wifi: 5, nature: 8 },
  'podgorica': { food: 4, safety: 6, climate: 6, wifi: 5, nature: 7 },
  'kotor': { food: 6, safety: 8, climate: 7, wifi: 5, nature: 10 },
  'tirana': { food: 5, safety: 5, climate: 7, wifi: 5, nature: 7 },
  'sarande': { food: 5, safety: 6, climate: 8, wifi: 4, nature: 9 },
  'skopje': { food: 5, safety: 6, climate: 5, wifi: 6, nature: 6 },
  'ohrid': { food: 5, safety: 8, climate: 6, wifi: 5, nature: 9 },
  'prizren': { food: 5, safety: 6, climate: 5, wifi: 5, nature: 7 },

  // Greece & Cyprus & Malta
  'athens': { food: 8, safety: 6, climate: 7, wifi: 6, nature: 6 },
  'thessaloniki': { food: 8, safety: 6, climate: 6, wifi: 6, nature: 6 },
  'crete': { food: 8, safety: 8, climate: 8, wifi: 5, nature: 9 },
  'chania': { food: 8, safety: 8, climate: 8, wifi: 5, nature: 9 },
  'rhodes': { food: 7, safety: 8, climate: 8, wifi: 5, nature: 8 },
  'santorini': { food: 7, safety: 9, climate: 8, wifi: 5, nature: 8 },
  'cyprus': { food: 6, safety: 8, climate: 8, wifi: 6, nature: 7 },
  'paphos': { food: 6, safety: 9, climate: 8, wifi: 6, nature: 8 },
  'malta': { food: 6, safety: 8, climate: 8, wifi: 7, nature: 6 },
  'valletta': { food: 6, safety: 9, climate: 8, wifi: 7, nature: 5 },

  // Turkey
  'istanbul': { food: 9, safety: 5, climate: 6, wifi: 7, nature: 5 },
  'antalya': { food: 7, safety: 7, climate: 7, wifi: 6, nature: 8 },
  'bodrum': { food: 6, safety: 7, climate: 8, wifi: 5, nature: 8 },
  'fethiye': { food: 6, safety: 8, climate: 8, wifi: 5, nature: 9 },
  'izmir': { food: 7, safety: 6, climate: 7, wifi: 6, nature: 6 },
  'cappadocia': { food: 6, safety: 8, climate: 5, wifi: 5, nature: 9 },

  // Caucasus
  'tbilisi': { food: 8, safety: 7, climate: 6, wifi: 7, nature: 7 },
  'batumi': { food: 6, safety: 7, climate: 7, wifi: 6, nature: 8 },
  'kutaisi': { food: 6, safety: 8, climate: 6, wifi: 5, nature: 8 },
  'yerevan': { food: 7, safety: 8, climate: 5, wifi: 6, nature: 7 },
  'gyumri': { food: 5, safety: 8, climate: 4, wifi: 4, nature: 7 },
  'baku': { food: 6, safety: 7, climate: 5, wifi: 7, nature: 5 },

  // ===== ASIA =====

  // Japan
  'tokyo': { food: 10, safety: 10, climate: 6, wifi: 9, nature: 5 },
  'osaka': { food: 10, safety: 10, climate: 6, wifi: 8, nature: 5 },
  'kyoto': { food: 9, safety: 10, climate: 6, wifi: 7, nature: 7 },
  'fukuoka': { food: 9, safety: 10, climate: 7, wifi: 8, nature: 6 },
  'sapporo': { food: 8, safety: 10, climate: 4, wifi: 7, nature: 9 },
  'nagoya': { food: 8, safety: 10, climate: 6, wifi: 8, nature: 5 },

  // South Korea
  'seoul': { food: 9, safety: 9, climate: 5, wifi: 10, nature: 5 },
  'busan': { food: 9, safety: 9, climate: 6, wifi: 9, nature: 7 },
  'jeju': { food: 7, safety: 10, climate: 7, wifi: 7, nature: 10 },

  // Taiwan & Hong Kong
  'taipei': { food: 9, safety: 9, climate: 6, wifi: 8, nature: 6 },
  'hongkong': { food: 9, safety: 9, climate: 6, wifi: 9, nature: 5 },

  // China
  'shenzhen': { food: 7, safety: 8, climate: 6, wifi: 8, nature: 4 },

  // Singapore
  'singapore': { food: 9, safety: 10, climate: 5, wifi: 10, nature: 4 },

  // Malaysia
  'kualalumpur': { food: 9, safety: 6, climate: 5, wifi: 7, nature: 5 },
  'penang': { food: 10, safety: 7, climate: 5, wifi: 6, nature: 6 },
  'langkawi': { food: 6, safety: 8, climate: 6, wifi: 5, nature: 9 },
  'malacca': { food: 8, safety: 8, climate: 5, wifi: 5, nature: 4 },
  'kotakinabalu': { food: 6, safety: 7, climate: 6, wifi: 5, nature: 10 },
  'ipoh': { food: 8, safety: 8, climate: 5, wifi: 5, nature: 7 },

  // Thailand
  'bangkok': { food: 10, safety: 6, climate: 4, wifi: 8, nature: 3 },
  'chiangmai': { food: 8, safety: 8, climate: 5, wifi: 7, nature: 8 },
  'phuket': { food: 7, safety: 6, climate: 6, wifi: 6, nature: 9 },
  'kohphangan': { food: 5, safety: 7, climate: 6, wifi: 5, nature: 9 },
  'kohsamui': { food: 6, safety: 7, climate: 6, wifi: 6, nature: 8 },
  'krabi': { food: 6, safety: 8, climate: 6, wifi: 5, nature: 10 },
  'pai': { food: 5, safety: 8, climate: 6, wifi: 4, nature: 9 },
  'huahin': { food: 6, safety: 8, climate: 5, wifi: 6, nature: 7 },

  // Vietnam
  'hochiminhcity': { food: 9, safety: 6, climate: 5, wifi: 7, nature: 3 },
  'hanoi': { food: 9, safety: 7, climate: 5, wifi: 6, nature: 4 },
  'danang': { food: 7, safety: 8, climate: 6, wifi: 7, nature: 8 },
  'hoian': { food: 8, safety: 9, climate: 6, wifi: 5, nature: 7 },
  'nhatrang': { food: 6, safety: 7, climate: 6, wifi: 5, nature: 8 },
  'dalat': { food: 6, safety: 9, climate: 8, wifi: 5, nature: 8 },
  'quynhon': { food: 5, safety: 8, climate: 6, wifi: 4, nature: 8 },
  'sapa': { food: 5, safety: 8, climate: 5, wifi: 4, nature: 10 },
  'phuquoc': { food: 6, safety: 8, climate: 6, wifi: 4, nature: 9 },

  // Indonesia
  'bali': { food: 7, safety: 7, climate: 7, wifi: 6, nature: 9 },
  'ubud': { food: 7, safety: 8, climate: 7, wifi: 5, nature: 9 },
  'canggu': { food: 6, safety: 7, climate: 7, wifi: 6, nature: 8 },
  'yogyakarta': { food: 7, safety: 8, climate: 6, wifi: 5, nature: 7 },
  'lombok': { food: 5, safety: 7, climate: 7, wifi: 4, nature: 10 },
  'bandung': { food: 7, safety: 7, climate: 7, wifi: 5, nature: 7 },
  'surabaya': { food: 6, safety: 6, climate: 6, wifi: 5, nature: 4 },
  'malang': { food: 6, safety: 7, climate: 7, wifi: 5, nature: 7 },
  'semarang': { food: 6, safety: 7, climate: 6, wifi: 5, nature: 5 },
  'nusapenida': { food: 4, safety: 7, climate: 7, wifi: 3, nature: 10 },

  // Philippines
  'manila': { food: 7, safety: 4, climate: 5, wifi: 5, nature: 3 },
  'cebu': { food: 6, safety: 5, climate: 6, wifi: 5, nature: 7 },
  'siargao': { food: 4, safety: 7, climate: 6, wifi: 4, nature: 10 },
  'palawan': { food: 5, safety: 7, climate: 6, wifi: 3, nature: 10 },
  'boracay': { food: 5, safety: 7, climate: 6, wifi: 5, nature: 9 },
  'dumaguete': { food: 5, safety: 7, climate: 6, wifi: 4, nature: 8 },
  'elnido': { food: 4, safety: 7, climate: 6, wifi: 3, nature: 10 },

  // Cambodia & Laos
  'phnompenh': { food: 6, safety: 4, climate: 5, wifi: 5, nature: 3 },
  'siemreap': { food: 6, safety: 6, climate: 5, wifi: 5, nature: 7 },
  'kampot': { food: 5, safety: 7, climate: 5, wifi: 4, nature: 8 },
  'vientiane': { food: 6, safety: 7, climate: 5, wifi: 4, nature: 5 },
  'luangprabang': { food: 6, safety: 8, climate: 5, wifi: 4, nature: 9 },

  // India
  'mumbai': { food: 9, safety: 5, climate: 5, wifi: 5, nature: 4 },
  'bangalore': { food: 7, safety: 6, climate: 7, wifi: 6, nature: 4 },
  'goa': { food: 7, safety: 6, climate: 6, wifi: 5, nature: 9 },
  'pune': { food: 7, safety: 7, climate: 7, wifi: 5, nature: 5 },
  'jaipur': { food: 7, safety: 6, climate: 5, wifi: 5, nature: 5 },
  'kochi': { food: 8, safety: 8, climate: 6, wifi: 5, nature: 7 },

  // Sri Lanka & Nepal
  'colombo': { food: 7, safety: 6, climate: 6, wifi: 5, nature: 5 },
  'weligama': { food: 5, safety: 7, climate: 7, wifi: 4, nature: 9 },
  'kathmandu': { food: 6, safety: 5, climate: 5, wifi: 4, nature: 8 },
  'pokhara': { food: 5, safety: 7, climate: 6, wifi: 4, nature: 10 },

  // Middle East
  'dubai': { food: 8, safety: 9, climate: 3, wifi: 9, nature: 3 },
  'abudhabi': { food: 7, safety: 10, climate: 3, wifi: 9, nature: 3 },
  'doha': { food: 6, safety: 10, climate: 3, wifi: 8, nature: 2 },
  'manama': { food: 5, safety: 8, climate: 3, wifi: 7, nature: 2 },
  'muscat': { food: 5, safety: 9, climate: 4, wifi: 6, nature: 7 },
  'telaviv': { food: 8, safety: 6, climate: 7, wifi: 8, nature: 6 },
  'haifa': { food: 6, safety: 7, climate: 7, wifi: 7, nature: 7 },
  'eilat': { food: 5, safety: 8, climate: 4, wifi: 6, nature: 8 },
  'amman': { food: 6, safety: 7, climate: 6, wifi: 6, nature: 6 },
  'aqaba': { food: 5, safety: 8, climate: 4, wifi: 5, nature: 8 },
  'beirut': { food: 8, safety: 3, climate: 7, wifi: 5, nature: 6 },

  // ===== AFRICA =====
  'cairo': { food: 7, safety: 4, climate: 5, wifi: 5, nature: 5 },
  'marrakech': { food: 8, safety: 5, climate: 6, wifi: 5, nature: 6 },
  'casablanca': { food: 7, safety: 5, climate: 7, wifi: 6, nature: 5 },
  'essaouira': { food: 6, safety: 7, climate: 8, wifi: 4, nature: 8 },
  'chefchaouen': { food: 5, safety: 8, climate: 6, wifi: 4, nature: 8 },
  'taghazout': { food: 4, safety: 7, climate: 8, wifi: 4, nature: 9 },
  'rabat': { food: 6, safety: 6, climate: 7, wifi: 5, nature: 5 },
  'tunis': { food: 6, safety: 5, climate: 6, wifi: 5, nature: 6 },
  'capetown': { food: 8, safety: 3, climate: 8, wifi: 6, nature: 10 },
  'johannesburg': { food: 6, safety: 2, climate: 7, wifi: 6, nature: 5 },
  'nairobi': { food: 5, safety: 3, climate: 8, wifi: 5, nature: 8 },
  'zanzibar': { food: 5, safety: 6, climate: 6, wifi: 4, nature: 9 },
  'daressalaam': { food: 4, safety: 4, climate: 5, wifi: 4, nature: 6 },
  'kigali': { food: 4, safety: 8, climate: 8, wifi: 5, nature: 7 },
  'accra': { food: 5, safety: 5, climate: 5, wifi: 5, nature: 5 },
  'lagos': { food: 6, safety: 3, climate: 5, wifi: 4, nature: 3 },
  'dakar': { food: 5, safety: 5, climate: 6, wifi: 4, nature: 6 },
  'addisababa': { food: 6, safety: 5, climate: 8, wifi: 4, nature: 6 },
  'mauritius': { food: 6, safety: 8, climate: 7, wifi: 5, nature: 9 },

  // ===== AMERICAS =====

  // USA
  'austin': { food: 8, safety: 6, climate: 6, wifi: 9, nature: 6 },
  'miami': { food: 8, safety: 5, climate: 7, wifi: 8, nature: 7 },
  'denver': { food: 7, safety: 7, climate: 6, wifi: 8, nature: 9 },
  'portland': { food: 8, safety: 5, climate: 5, wifi: 8, nature: 8 },
  'seattle': { food: 8, safety: 5, climate: 5, wifi: 9, nature: 8 },

  // Canada
  'vancouver': { food: 8, safety: 7, climate: 5, wifi: 8, nature: 10 },
  'toronto': { food: 8, safety: 7, climate: 4, wifi: 8, nature: 5 },
  'montreal': { food: 9, safety: 7, climate: 3, wifi: 8, nature: 6 },

  // Mexico
  'mexicocity': { food: 10, safety: 4, climate: 7, wifi: 7, nature: 5 },
  'oaxaca': { food: 10, safety: 6, climate: 7, wifi: 5, nature: 7 },
  'playadelcarmen': { food: 6, safety: 5, climate: 7, wifi: 6, nature: 8 },
  'tulum': { food: 6, safety: 5, climate: 7, wifi: 5, nature: 9 },
  'guadalajara': { food: 8, safety: 4, climate: 8, wifi: 6, nature: 5 },
  'puertovallarta': { food: 7, safety: 6, climate: 7, wifi: 6, nature: 8 },
  'sanmigueldeallende': { food: 8, safety: 7, climate: 8, wifi: 5, nature: 6 },
  'merida': { food: 8, safety: 8, climate: 5, wifi: 6, nature: 5 },
  'guanajuato': { food: 7, safety: 7, climate: 7, wifi: 5, nature: 6 },
  'puertoescondido': { food: 5, safety: 5, climate: 7, wifi: 4, nature: 9 },
  'sayulita': { food: 5, safety: 6, climate: 7, wifi: 5, nature: 8 },

  // Central America & Caribbean
  'sanjosecr': { food: 5, safety: 5, climate: 7, wifi: 6, nature: 7 },
  'tamarindo': { food: 5, safety: 6, climate: 7, wifi: 5, nature: 9 },
  'panama': { food: 6, safety: 5, climate: 6, wifi: 7, nature: 6 },
  'boquete': { food: 4, safety: 8, climate: 8, wifi: 5, nature: 9 },
  'antigua': { food: 6, safety: 5, climate: 8, wifi: 5, nature: 8 },
  'lakeatitlan': { food: 5, safety: 5, climate: 8, wifi: 4, nature: 10 },
  'sanjuan': { food: 7, safety: 4, climate: 7, wifi: 6, nature: 7 },
  'puntacana': { food: 5, safety: 6, climate: 7, wifi: 5, nature: 8 },
  'santodomingo': { food: 6, safety: 4, climate: 6, wifi: 5, nature: 6 },

  // South America
  'medellin': { food: 7, safety: 5, climate: 9, wifi: 7, nature: 7 },
  'bogota': { food: 7, safety: 4, climate: 7, wifi: 7, nature: 6 },
  'cartagena': { food: 7, safety: 5, climate: 5, wifi: 6, nature: 7 },
  'santamarta': { food: 5, safety: 4, climate: 6, wifi: 5, nature: 9 },
  'cali': { food: 7, safety: 3, climate: 8, wifi: 6, nature: 6 },
  'lima': { food: 9, safety: 4, climate: 6, wifi: 6, nature: 5 },
  'cusco': { food: 7, safety: 6, climate: 5, wifi: 5, nature: 9 },
  'arequipa': { food: 7, safety: 7, climate: 7, wifi: 5, nature: 8 },
  'mancora': { food: 4, safety: 6, climate: 7, wifi: 4, nature: 8 },
  'huanchaco': { food: 5, safety: 6, climate: 7, wifi: 4, nature: 7 },
  'quito': { food: 6, safety: 4, climate: 7, wifi: 6, nature: 7 },
  'cuenca': { food: 5, safety: 7, climate: 8, wifi: 5, nature: 7 },
  'montanita': { food: 4, safety: 5, climate: 7, wifi: 4, nature: 8 },
  'vilcabamba': { food: 4, safety: 7, climate: 8, wifi: 4, nature: 9 },
  'buenosaires': { food: 9, safety: 5, climate: 7, wifi: 7, nature: 4 },
  'cordoba': { food: 7, safety: 6, climate: 7, wifi: 6, nature: 6 },
  'mendoza': { food: 8, safety: 7, climate: 7, wifi: 5, nature: 9 },
  'bariloche': { food: 6, safety: 8, climate: 4, wifi: 5, nature: 10 },
  'santiago': { food: 7, safety: 6, climate: 7, wifi: 7, nature: 7 },
  'valparaiso': { food: 7, safety: 4, climate: 7, wifi: 6, nature: 7 },
  'montevideo': { food: 7, safety: 7, climate: 6, wifi: 7, nature: 6 },
  'asuncion': { food: 5, safety: 5, climate: 5, wifi: 5, nature: 4 },
  'lapaz': { food: 5, safety: 5, climate: 4, wifi: 4, nature: 8 },
  'santacruz': { food: 5, safety: 5, climate: 6, wifi: 5, nature: 6 },
  'sucre': { food: 5, safety: 7, climate: 7, wifi: 4, nature: 6 },
  'cochabamba': { food: 5, safety: 5, climate: 7, wifi: 4, nature: 6 },
  'saopaulo': { food: 9, safety: 4, climate: 6, wifi: 7, nature: 4 },
  'florianopolis': { food: 7, safety: 6, climate: 7, wifi: 6, nature: 9 },
  'salvador': { food: 8, safety: 3, climate: 7, wifi: 5, nature: 8 },

  // ===== OCEANIA =====
  'sydney': { food: 8, safety: 8, climate: 8, wifi: 8, nature: 8 },
  'melbourne': { food: 9, safety: 8, climate: 6, wifi: 8, nature: 7 },
  'brisbane': { food: 7, safety: 8, climate: 7, wifi: 8, nature: 7 },
  'perth': { food: 7, safety: 9, climate: 8, wifi: 7, nature: 8 },
  'adelaide': { food: 7, safety: 9, climate: 7, wifi: 7, nature: 7 },
  'goldcoast': { food: 6, safety: 8, climate: 8, wifi: 7, nature: 9 },
  'byronbay': { food: 6, safety: 8, climate: 8, wifi: 6, nature: 9 },
  'cairns': { food: 5, safety: 8, climate: 6, wifi: 6, nature: 10 },
  'hobart': { food: 6, safety: 9, climate: 5, wifi: 7, nature: 9 },
  'auckland': { food: 7, safety: 8, climate: 6, wifi: 8, nature: 9 },
  'wellington': { food: 7, safety: 9, climate: 5, wifi: 8, nature: 8 },
  'queenstown': { food: 6, safety: 9, climate: 5, wifi: 7, nature: 10 },
  'christchurch': { food: 6, safety: 8, climate: 5, wifi: 8, nature: 9 }
};

// Read the cities-data.js file
const citiesDataPath = path.join(__dirname, '..', 'cities-data.js');
let content = fs.readFileSync(citiesDataPath, 'utf-8');

// Update each city's scores
let updatedCount = 0;

for (const [cityId, scores] of Object.entries(cityScores)) {
  // Match and update food score
  const foodRegex = new RegExp(`(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)food:\\s*\\d+`, 'g');
  content = content.replace(foodRegex, `$1food: ${scores.food}`);

  // Match and update safety score
  const safetyRegex = new RegExp(`(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)safety:\\s*\\d+`, 'g');
  content = content.replace(safetyRegex, `$1safety: ${scores.safety}`);

  // Match and update climate score
  const climateRegex = new RegExp(`(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)climate:\\s*\\d+`, 'g');
  content = content.replace(climateRegex, `$1climate: ${scores.climate}`);

  // Match and update wifi score
  const wifiRegex = new RegExp(`(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)wifi:\\s*\\d+`, 'g');
  content = content.replace(wifiRegex, `$1wifi: ${scores.wifi}`);

  // Match and update nature score
  const natureRegex = new RegExp(`(id:\\s*"${cityId}"[\\s\\S]*?scores:\\s*\\{[\\s\\S]*?)nature:\\s*\\d+`, 'g');
  content = content.replace(natureRegex, `$1nature: ${scores.nature}`);

  updatedCount++;
}

// Write the updated content
fs.writeFileSync(citiesDataPath, content, 'utf-8');

console.log(`Recalibrated scores for ${updatedCount} cities!`);
console.log(`\nCategories updated:`);
console.log(`- Food: Based on Michelin stars, culinary reputation, street food`);
console.log(`- Safety: Based on Numbeo Crime Index (inverted)`);
console.log(`- Climate: Based on temperature/humidity for nomads`);
console.log(`- WiFi: Based on Speedtest Global Index`);
console.log(`- Nature: Based on access to natural attractions`);

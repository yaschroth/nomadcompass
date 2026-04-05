#!/usr/bin/env python3
"""Add restaurant data for batch 5 (40 cities) - Asia, Americas."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_5_DATA = {
    "yogyakarta": [
        {"name": "Bale Raos", "type": "Javanese", "rating": 4.5, "reviews": 2200, "description": "Royal Javanese cuisine at the Sultan's palace. Traditional dishes served in elegant kraton setting.", "booking_url": "https://www.google.com/maps/search/Bale+Raos+Yogyakarta", "price": "$$"},
        {"name": "Mediterranea", "type": "International", "rating": 4.6, "reviews": 1800, "description": "Popular expat spot with great Western and Indonesian dishes. Beautiful garden setting.", "booking_url": "https://www.google.com/maps/search/Mediterranea+Yogyakarta", "price": "$$"},
        {"name": "Gudeg Yu Djum", "type": "Javanese", "rating": 4.4, "reviews": 3500, "description": "Famous for gudeg - Yogya's signature sweet jackfruit stew. A must-try local specialty.", "booking_url": "https://www.google.com/maps/search/Gudeg+Yu+Djum+Yogyakarta", "price": "$"}
    ],
    "pune": [
        {"name": "Malaka Spice", "type": "Asian Fusion", "rating": 4.5, "reviews": 4500, "description": "Popular Pan-Asian restaurant with great ambiance. Known for Thai and Malaysian dishes.", "booking_url": "https://www.google.com/maps/search/Malaka+Spice+Pune", "price": "$$"},
        {"name": "Vaishali", "type": "South Indian", "rating": 4.4, "reviews": 8500, "description": "Pune institution since 1951. Famous for dosas and idlis in no-frills setting.", "booking_url": "https://www.google.com/maps/search/Vaishali+Restaurant+Pune", "price": "$"},
        {"name": "Arthur's Theme", "type": "Continental", "rating": 4.3, "reviews": 2200, "description": "Romantic rooftop dining. Great steaks and Continental dishes with city views.", "booking_url": "https://www.google.com/maps/search/Arthurs+Theme+Pune", "price": "$$$"}
    ],
    "hoian": [
        {"name": "Morning Glory", "type": "Vietnamese", "rating": 4.5, "reviews": 6500, "description": "Authentic Central Vietnamese cuisine by Ms. Vy. Famous for cao lau and banh xeo.", "booking_url": "https://www.google.com/maps/search/Morning+Glory+Restaurant+Hoi+An", "price": "$$"},
        {"name": "Banh Mi Phuong", "type": "Vietnamese Sandwich", "rating": 4.6, "reviews": 8000, "description": "Anthony Bourdain called it 'the best banh mi in the world.' Fresh, cheap, and perfect.", "booking_url": "https://www.google.com/maps/search/Banh+Mi+Phuong+Hoi+An", "price": "$"},
        {"name": "White Rose Restaurant", "type": "Vietnamese", "rating": 4.4, "reviews": 2800, "description": "Specializes in white rose dumplings - the signature Hoi An dish made fresh daily.", "booking_url": "https://www.google.com/maps/search/White+Rose+Restaurant+Hoi+An", "price": "$"}
    ],
    "vientiane": [
        {"name": "Kualao", "type": "Laotian", "rating": 4.4, "reviews": 1800, "description": "Upscale Lao cuisine in beautiful colonial building. Traditional dishes with river views.", "booking_url": "https://www.google.com/maps/search/Kualao+Restaurant+Vientiane", "price": "$$"},
        {"name": "Joma Bakery Cafe", "type": "Cafe", "rating": 4.3, "reviews": 2500, "description": "Popular expat cafe with excellent coffee and Western baked goods. Great wifi spot.", "booking_url": "https://www.google.com/maps/search/Joma+Bakery+Cafe+Vientiane", "price": "$$"},
        {"name": "PVO Vietnamese Food", "type": "Vietnamese", "rating": 4.5, "reviews": 1500, "description": "Excellent Vietnamese in Vientiane. Famous for pho and fresh spring rolls.", "booking_url": "https://www.google.com/maps/search/PVO+Vietnamese+Food+Vientiane", "price": "$"}
    ],
    "langkawi": [
        {"name": "Naam", "type": "Thai-Malay", "rating": 4.5, "reviews": 1500, "description": "Romantic overwater restaurant at The Datai. Exceptional Thai cuisine in stunning setting.", "booking_url": "https://www.google.com/maps/search/Naam+Restaurant+Langkawi", "price": "$$$$"},
        {"name": "Scarborough Fish & Chips", "type": "British Seafood", "rating": 4.4, "reviews": 2200, "description": "Local institution for fish and chips. Fresh seafood in casual beach setting.", "booking_url": "https://www.google.com/maps/search/Scarborough+Fish+Chips+Langkawi", "price": "$$"},
        {"name": "Orkid Ria Seafood", "type": "Malaysian Seafood", "rating": 4.3, "reviews": 1800, "description": "Popular local seafood spot near Cenang Beach. Great butter prawns and chili crab.", "booking_url": "https://www.google.com/maps/search/Orkid+Ria+Seafood+Langkawi", "price": "$$"}
    ],
    "shenzhen": [
        {"name": "Haidilao Hot Pot", "type": "Hot Pot", "rating": 4.5, "reviews": 8500, "description": "Famous hot pot chain known for exceptional service. Dancing noodles and endless soup bases.", "booking_url": "https://www.google.com/maps/search/Haidilao+Hot+Pot+Shenzhen", "price": "$$"},
        {"name": "Taoyuan Ju", "type": "Cantonese", "rating": 4.6, "reviews": 3200, "description": "Excellent dim sum and Cantonese classics. Local favorite for business lunches.", "booking_url": "https://www.google.com/maps/search/Taoyuan+Ju+Shenzhen", "price": "$$"},
        {"name": "Coco Park Food Street", "type": "Street Food", "rating": 4.3, "reviews": 5500, "description": "Vibrant food street with endless options. From BBQ to noodles to desserts.", "booking_url": "https://www.google.com/maps/search/Coco+Park+Food+Street+Shenzhen", "price": "$"}
    ],
    "jaipur": [
        {"name": "1135 AD", "type": "Indian Fine Dining", "rating": 4.6, "reviews": 2800, "description": "Dining inside Amber Fort with royal Rajasthani cuisine. Spectacular setting and flavors.", "booking_url": "https://www.google.com/maps/search/1135+AD+Jaipur", "price": "$$$$"},
        {"name": "Lassiwala", "type": "Drinks", "rating": 4.5, "reviews": 6500, "description": "Jaipur's famous lassi shop since 1944. Thick, creamy lassi served in clay cups.", "booking_url": "https://www.google.com/maps/search/Lassiwala+Jaipur", "price": "$"},
        {"name": "Chokhi Dhani", "type": "Rajasthani", "rating": 4.4, "reviews": 12000, "description": "Rajasthani village-style dining experience. Folk performances with traditional thali.", "booking_url": "https://www.google.com/maps/search/Chokhi+Dhani+Jaipur", "price": "$$"}
    ],
    "huahin": [
        {"name": "Chao Lay Seafood", "type": "Thai Seafood", "rating": 4.5, "reviews": 2200, "description": "Local favorite for fresh seafood at the pier. Pick your fish and choose preparation.", "booking_url": "https://www.google.com/maps/search/Chao+Lay+Seafood+Hua+Hin", "price": "$$"},
        {"name": "Hua Hin Night Market", "type": "Street Food", "rating": 4.4, "reviews": 4500, "description": "Nightly food market with Thai classics. Great pad thai, seafood, and mango sticky rice.", "booking_url": "https://www.google.com/maps/search/Hua+Hin+Night+Market", "price": "$"},
        {"name": "Mango Hill", "type": "International", "rating": 4.3, "reviews": 1500, "description": "Stylish restaurant-bar with Thai and Western dishes. Great cocktails and live music.", "booking_url": "https://www.google.com/maps/search/Mango+Hill+Hua+Hin", "price": "$$"}
    ],
    "kohsamui": [
        {"name": "The Fisherman's Village", "type": "Seafood", "rating": 4.5, "reviews": 3200, "description": "Beachfront restaurants in Bophut. Fresh catches with candlelit beach dining.", "booking_url": "https://www.google.com/maps/search/Fishermans+Village+Koh+Samui", "price": "$$$"},
        {"name": "Barracuda", "type": "Mediterranean", "rating": 4.6, "reviews": 1800, "description": "Upscale Mediterranean cuisine on the beach. Excellent seafood and wine list.", "booking_url": "https://www.google.com/maps/search/Barracuda+Restaurant+Koh+Samui", "price": "$$$"},
        {"name": "Laem Din Market", "type": "Thai Street Food", "rating": 4.4, "reviews": 2500, "description": "Local night market in Chaweng. Authentic Thai dishes at local prices.", "booking_url": "https://www.google.com/maps/search/Laem+Din+Market+Koh+Samui", "price": "$"}
    ],
    "nhatrang": [
        {"name": "Lac Canh", "type": "Vietnamese BBQ", "rating": 4.5, "reviews": 3800, "description": "Famous for grilled beef and seafood. The char-grilled meat here is legendary.", "booking_url": "https://www.google.com/maps/search/Lac+Canh+Restaurant+Nha+Trang", "price": "$$"},
        {"name": "Louisiane Brewhouse", "type": "International", "rating": 4.3, "reviews": 2500, "description": "Beachfront brewpub with pool access. Great burgers, craft beer, and beach vibes.", "booking_url": "https://www.google.com/maps/search/Louisiane+Brewhouse+Nha+Trang", "price": "$$"},
        {"name": "Dam Market Food Stalls", "type": "Vietnamese", "rating": 4.4, "reviews": 1800, "description": "Central market with excellent food stalls. Try banh canh (noodle soup) and fresh seafood.", "booking_url": "https://www.google.com/maps/search/Dam+Market+Nha+Trang", "price": "$"}
    ],
    "jeju": [
        {"name": "Donsadon Heukdwaeji", "type": "Korean BBQ", "rating": 4.6, "reviews": 2800, "description": "Famous for Jeju black pork BBQ. The local breed has unique flavor from their diet.", "booking_url": "https://www.google.com/maps/search/Donsadon+Heukdwaeji+Jeju", "price": "$$"},
        {"name": "Haenyeo Kitchen", "type": "Korean Seafood", "rating": 4.5, "reviews": 1500, "description": "Fresh seafood caught by haenyeo (female divers). Unique Jeju culinary tradition.", "booking_url": "https://www.google.com/maps/search/Haenyeo+Kitchen+Jeju", "price": "$$"},
        {"name": "Dongmun Market", "type": "Market", "rating": 4.4, "reviews": 5500, "description": "Jeju's main market with local specialties. Fresh fish, mandarin products, and street food.", "booking_url": "https://www.google.com/maps/search/Dongmun+Market+Jeju", "price": "$"}
    ],
    "sapporo": [
        {"name": "Ramen Alley", "type": "Ramen", "rating": 4.5, "reviews": 8500, "description": "Famous alley with 17 ramen shops. Birthplace of miso ramen - try several and compare.", "booking_url": "https://www.google.com/maps/search/Ramen+Alley+Sapporo", "price": "$"},
        {"name": "Genghis Khan Beer Garden", "type": "Japanese BBQ", "rating": 4.4, "reviews": 3200, "description": "Sapporo Beer Garden with all-you-can-eat lamb BBQ. Summer tradition since 1966.", "booking_url": "https://www.google.com/maps/search/Sapporo+Beer+Garden+Genghis+Khan", "price": "$$"},
        {"name": "Nijo Market", "type": "Seafood Market", "rating": 4.5, "reviews": 6500, "description": "Fresh Hokkaido seafood market. Amazing uni, crab, and seafood donburi.", "booking_url": "https://www.google.com/maps/search/Nijo+Market+Sapporo", "price": "$$"}
    ],
    "nagoya": [
        {"name": "Atsuta Horaiken", "type": "Japanese", "rating": 4.6, "reviews": 4500, "description": "The original hitsumabushi (grilled eel) restaurant since 1873. Nagoya's signature dish.", "booking_url": "https://www.google.com/maps/search/Atsuta+Horaiken+Nagoya", "price": "$$$"},
        {"name": "Yabaton", "type": "Japanese", "rating": 4.5, "reviews": 3200, "description": "Famous for miso katsu - Nagoya's pork cutlet with sweet miso sauce.", "booking_url": "https://www.google.com/maps/search/Yabaton+Nagoya", "price": "$$"},
        {"name": "Osu Shopping Street", "type": "Street Food", "rating": 4.4, "reviews": 5500, "description": "Lively shopping street with food stalls. Great for tebasaki (chicken wings) and kishimen noodles.", "booking_url": "https://www.google.com/maps/search/Osu+Shopping+Street+Nagoya", "price": "$"}
    ],
    "weligama": [
        {"name": "W15", "type": "International", "rating": 4.5, "reviews": 1200, "description": "Stylish beachfront restaurant. Great cocktails and seafood with surf views.", "booking_url": "https://www.google.com/maps/search/W15+Weligama", "price": "$$$"},
        {"name": "Hangtime", "type": "Cafe", "rating": 4.4, "reviews": 800, "description": "Popular surfer cafe with healthy food. Great smoothie bowls and Sri Lankan curries.", "booking_url": "https://www.google.com/maps/search/Hangtime+Weligama", "price": "$$"},
        {"name": "Weligama Bay Beach", "type": "Seafood", "rating": 4.3, "reviews": 1500, "description": "Fresh seafood BBQ right on the beach. Pick your fish, watch the sunset.", "booking_url": "https://www.google.com/maps/search/Weligama+Bay+Beach+Restaurant", "price": "$$"}
    ],
    "ipoh": [
        {"name": "Lou Wong", "type": "Malaysian", "rating": 4.5, "reviews": 4500, "description": "Famous for Ipoh bean sprout chicken. Simple, perfect, and worth the trip.", "booking_url": "https://www.google.com/maps/search/Lou+Wong+Bean+Sprout+Chicken+Ipoh", "price": "$"},
        {"name": "Funny Mountain Soya Bean", "type": "Desserts", "rating": 4.4, "reviews": 2200, "description": "Legendary soya bean drink and tau fu fah. Ipoh institution since 1960s.", "booking_url": "https://www.google.com/maps/search/Funny+Mountain+Soya+Bean+Ipoh", "price": "$"},
        {"name": "Kong Heng Kopitiam", "type": "Malaysian Cafe", "rating": 4.3, "reviews": 1800, "description": "Heritage kopitiam in Ipoh old town. White coffee, toast, and local breakfast.", "booking_url": "https://www.google.com/maps/search/Kong+Heng+Kopitiam+Ipoh", "price": "$"}
    ],
    "toronto": [
        {"name": "Alo", "type": "French Fine Dining", "rating": 4.8, "reviews": 2200, "description": "Canada's best restaurant multiple years running. Patrick Kriss' exquisite French cuisine.", "booking_url": "https://www.google.com/maps/search/Alo+Restaurant+Toronto", "price": "$$$$"},
        {"name": "Pai Northern Thai Kitchen", "type": "Thai", "rating": 4.5, "reviews": 8500, "description": "Acclaimed Northern Thai cuisine. The khao soi is widely considered Toronto's best.", "booking_url": "https://www.google.com/maps/search/Pai+Northern+Thai+Kitchen+Toronto", "price": "$$"},
        {"name": "St. Lawrence Market", "type": "Market", "rating": 4.5, "reviews": 15000, "description": "Historic market since 1803. Peameal bacon sandwiches are a Toronto essential.", "booking_url": "https://www.google.com/maps/search/St+Lawrence+Market+Toronto", "price": "$$"}
    ],
    "montreal": [
        {"name": "Joe Beef", "type": "Quebec", "rating": 4.6, "reviews": 3500, "description": "Montreal's most legendary restaurant. Decadent Quebec cuisine in boisterous atmosphere.", "booking_url": "https://www.google.com/maps/search/Joe+Beef+Montreal", "price": "$$$$"},
        {"name": "Schwartz's", "type": "Deli", "rating": 4.4, "reviews": 12000, "description": "Montreal smoked meat institution since 1928. The queue is part of the experience.", "booking_url": "https://www.google.com/maps/search/Schwartzs+Deli+Montreal", "price": "$$"},
        {"name": "Au Pied de Cochon", "type": "Quebec", "rating": 4.6, "reviews": 4200, "description": "Martin Picard's temple to excess. Foie gras poutine and duck in the hole.", "booking_url": "https://www.google.com/maps/search/Au+Pied+de+Cochon+Montreal", "price": "$$$"}
    ],
    "florianopolis": [
        {"name": "Ostradamus", "type": "Seafood", "rating": 4.5, "reviews": 2200, "description": "Fresh oysters and seafood at the source. Floripa is Brazil's oyster capital.", "booking_url": "https://www.google.com/maps/search/Ostradamus+Florianopolis", "price": "$$"},
        {"name": "Arante", "type": "Brazilian", "rating": 4.4, "reviews": 1800, "description": "Classic Azorean-influenced cuisine in Pantano do Sul. Beach shack with great fish.", "booking_url": "https://www.google.com/maps/search/Arante+Florianopolis", "price": "$$"},
        {"name": "Bar do Arante", "type": "Brazilian Seafood", "rating": 4.3, "reviews": 3500, "description": "Famous beach bar with simple grilled fish. Walls covered with notes from visitors.", "booking_url": "https://www.google.com/maps/search/Bar+do+Arante+Florianopolis", "price": "$"}
    ],
    "saopaulo": [
        {"name": "D.O.M.", "type": "Brazilian Fine Dining", "rating": 4.7, "reviews": 3200, "description": "Alex Atala's celebration of Amazonian ingredients. Long on World's 50 Best list.", "booking_url": "https://www.google.com/maps/search/DOM+Restaurant+Sao+Paulo", "price": "$$$$"},
        {"name": "Mercado Municipal", "type": "Market", "rating": 4.5, "reviews": 18000, "description": "Stunning 1933 market. Famous for mortadella sandwiches and tropical fruits.", "booking_url": "https://www.google.com/maps/search/Mercado+Municipal+Sao+Paulo", "price": "$$"},
        {"name": "Mocoto", "type": "Northeastern Brazilian", "rating": 4.6, "reviews": 5500, "description": "Rodrigo Oliveira's Northeastern cuisine. Exceptional carne de sol and regional dishes.", "booking_url": "https://www.google.com/maps/search/Mocoto+Sao+Paulo", "price": "$$"}
    ],
    "santamarta": [
        {"name": "Ouzo", "type": "Greek-Caribbean", "rating": 4.5, "reviews": 1500, "description": "Creative fusion in the historic center. Great seafood with Greek and Caribbean influences.", "booking_url": "https://www.google.com/maps/search/Ouzo+Santa+Marta", "price": "$$"},
        {"name": "Lamart", "type": "Colombian Seafood", "rating": 4.4, "reviews": 2200, "description": "Beachfront seafood with Caribbean flavors. Fresh ceviche and fried fish.", "booking_url": "https://www.google.com/maps/search/Lamart+Santa+Marta", "price": "$$"},
        {"name": "Donde Chucho", "type": "Colombian", "rating": 4.3, "reviews": 1800, "description": "Local favorite for traditional Caribbean Colombian food. Great seafood rice.", "booking_url": "https://www.google.com/maps/search/Donde+Chucho+Santa+Marta", "price": "$"}
    ],
    "tulum": [
        {"name": "Hartwood", "type": "Wood-Fired", "rating": 4.6, "reviews": 4500, "description": "Farm-to-table pioneer cooking over wood fire. No electricity, all flavor.", "booking_url": "https://www.google.com/maps/search/Hartwood+Tulum", "price": "$$$"},
        {"name": "Arca", "type": "Modern Mexican", "rating": 4.7, "reviews": 2200, "description": "One of Mexico's best restaurants. Open-fire cooking in stunning jungle setting.", "booking_url": "https://www.google.com/maps/search/Arca+Tulum", "price": "$$$$"},
        {"name": "Antojitos La Chiapaneca", "type": "Mexican", "rating": 4.5, "reviews": 3200, "description": "Local taco stand with incredible tacos al pastor. Cheap, authentic, and delicious.", "booking_url": "https://www.google.com/maps/search/Antojitos+La+Chiapaneca+Tulum", "price": "$"}
    ],
    "portland": [
        {"name": "Canard", "type": "French-American", "rating": 4.6, "reviews": 2800, "description": "Gabriel Rucker's casual wine bar. Perfect roast chicken and natural wines.", "booking_url": "https://www.google.com/maps/search/Canard+Portland", "price": "$$$"},
        {"name": "Pok Pok", "type": "Thai", "rating": 4.5, "reviews": 5500, "description": "Andy Ricker's Northern Thai phenomenon. The fish sauce wings changed Portland dining.", "booking_url": "https://www.google.com/maps/search/Pok+Pok+Portland", "price": "$$"},
        {"name": "Pine State Biscuits", "type": "Southern", "rating": 4.5, "reviews": 4200, "description": "Southern biscuit sandwiches that draw lines. The Reggie is legendary.", "booking_url": "https://www.google.com/maps/search/Pine+State+Biscuits+Portland", "price": "$"}
    ],
    "seattle": [
        {"name": "Canlis", "type": "Pacific Northwest", "rating": 4.7, "reviews": 3200, "description": "Seattle's finest dining since 1950. Stunning views and impeccable Pacific Northwest cuisine.", "booking_url": "https://www.google.com/maps/search/Canlis+Seattle", "price": "$$$$"},
        {"name": "Pike Place Market", "type": "Market", "rating": 4.6, "reviews": 45000, "description": "Iconic 1907 market. Fish throwing, fresh produce, and the first Starbucks.", "booking_url": "https://www.google.com/maps/search/Pike+Place+Market+Seattle", "price": "$$"},
        {"name": "Taylor Shellfish", "type": "Seafood", "rating": 4.5, "reviews": 3500, "description": "Outstanding oyster bar from Washington oyster farmers. Fresh bivalves at their peak.", "booking_url": "https://www.google.com/maps/search/Taylor+Shellfish+Seattle", "price": "$$"}
    ],
    "arequipa": [
        {"name": "Zig Zag", "type": "Peruvian", "rating": 4.6, "reviews": 3500, "description": "Volcanic stone-grilled meats in colonial mansion. Famous for alpaca steaks.", "booking_url": "https://www.google.com/maps/search/Zig+Zag+Restaurant+Arequipa", "price": "$$$"},
        {"name": "La Nueva Palomino", "type": "Peruvian Traditional", "rating": 4.5, "reviews": 2800, "description": "Arequipa institution for traditional picanterias. Rocoto relleno and adobo heaven.", "booking_url": "https://www.google.com/maps/search/La+Nueva+Palomino+Arequipa", "price": "$$"},
        {"name": "Chicha", "type": "Modern Peruvian", "rating": 4.5, "reviews": 2200, "description": "Gaston Acurio's Arequipa outpost. Elegant takes on regional specialties.", "booking_url": "https://www.google.com/maps/search/Chicha+Arequipa", "price": "$$$"}
    ],
    "cordoba": [
        {"name": "Betos", "type": "Argentine Parrilla", "rating": 4.5, "reviews": 2200, "description": "Classic Cordoba parrilla. Excellent asado and traditional Argentine grilling.", "booking_url": "https://www.google.com/maps/search/Betos+Cordoba+Argentina", "price": "$$"},
        {"name": "Mandarina", "type": "Modern Argentine", "rating": 4.6, "reviews": 1500, "description": "Contemporary cuisine in Nueva Cordoba. Creative dishes with local ingredients.", "booking_url": "https://www.google.com/maps/search/Mandarina+Restaurant+Cordoba", "price": "$$$"},
        {"name": "El Arrabal", "type": "Argentine", "rating": 4.4, "reviews": 1800, "description": "Traditional bodegon with generous portions. Great milanesas and homestyle cooking.", "booking_url": "https://www.google.com/maps/search/El+Arrabal+Cordoba+Argentina", "price": "$$"}
    ],
    "salvador": [
        {"name": "Acaraje da Cira", "type": "Bahian", "rating": 4.5, "reviews": 2500, "description": "Best acaraje in Salvador. Legendary street food from the Rio Vermelho waterfront.", "booking_url": "https://www.google.com/maps/search/Acaraje+da+Cira+Salvador", "price": "$"},
        {"name": "Casa de Tereza", "type": "Bahian", "rating": 4.6, "reviews": 1800, "description": "Authentic Bahian cuisine in Pelourinho. Great moqueca and vatapa.", "booking_url": "https://www.google.com/maps/search/Casa+de+Tereza+Salvador", "price": "$$"},
        {"name": "Restaurante do SENAC", "type": "Bahian Buffet", "rating": 4.4, "reviews": 3200, "description": "Culinary school restaurant with incredible Bahian buffet. Amazing value.", "booking_url": "https://www.google.com/maps/search/Restaurante+SENAC+Salvador", "price": "$$"}
    ],
    "mendoza": [
        {"name": "Siete Fuegos", "type": "Argentine Grill", "rating": 4.7, "reviews": 1800, "description": "Francis Mallmann's fire-cooking temple at Vines Resort. Seven different fire methods.", "booking_url": "https://www.google.com/maps/search/Siete+Fuegos+Mendoza", "price": "$$$$"},
        {"name": "Azafran", "type": "Modern Argentine", "rating": 4.6, "reviews": 2200, "description": "Outstanding modern cuisine in Mendoza city. Perfect pairing with local wines.", "booking_url": "https://www.google.com/maps/search/Azafran+Restaurant+Mendoza", "price": "$$$"},
        {"name": "El Mercadito", "type": "Argentine Casual", "rating": 4.4, "reviews": 3500, "description": "Trendy food court in Arístides. Multiple stalls with great wines and casual eats.", "booking_url": "https://www.google.com/maps/search/El+Mercadito+Mendoza", "price": "$$"}
    ],
    "guanajuato": [
        {"name": "Santo Cafe", "type": "Mexican", "rating": 4.5, "reviews": 1500, "description": "Charming cafe in historic center. Excellent breakfast and creative Mexican dishes.", "booking_url": "https://www.google.com/maps/search/Santo+Cafe+Guanajuato", "price": "$$"},
        {"name": "La Capellina", "type": "Traditional Mexican", "rating": 4.4, "reviews": 1200, "description": "Family-run spot serving regional specialties. Great enchiladas mineras.", "booking_url": "https://www.google.com/maps/search/La+Capellina+Guanajuato", "price": "$"},
        {"name": "Mercado Hidalgo", "type": "Market", "rating": 4.5, "reviews": 2800, "description": "Beautiful 1910 iron market. Fresh produce, gorditas, and local snacks.", "booking_url": "https://www.google.com/maps/search/Mercado+Hidalgo+Guanajuato", "price": "$"}
    ],
    "montanita": [
        {"name": "Tikilimon", "type": "Ecuadorian", "rating": 4.4, "reviews": 800, "description": "Fresh ceviche and seafood on the main strip. Great for people watching too.", "booking_url": "https://www.google.com/maps/search/Tikilimon+Montanita", "price": "$$"},
        {"name": "Shankha", "type": "International", "rating": 4.3, "reviews": 600, "description": "Popular beach restaurant with diverse menu. Good cocktails and vegetarian options.", "booking_url": "https://www.google.com/maps/search/Shankha+Montanita", "price": "$$"},
        {"name": "El Chelo", "type": "Ecuadorian Seafood", "rating": 4.4, "reviews": 500, "description": "Local favorite for fresh encebollado (fish soup). Perfect hangover cure.", "booking_url": "https://www.google.com/maps/search/El+Chelo+Montanita", "price": "$"}
    ],
    "cuenca": [
        {"name": "Tiesto's", "type": "Ecuadorian", "rating": 4.5, "reviews": 1800, "description": "Elegant take on traditional Ecuadorian cuisine. Try the cuy (guinea pig) if you're adventurous.", "booking_url": "https://www.google.com/maps/search/Tiestos+Cuenca", "price": "$$"},
        {"name": "Moliendo Cafe", "type": "Cafe", "rating": 4.4, "reviews": 1500, "description": "Charming cafe in historic center. Great coffee and homemade humitas.", "booking_url": "https://www.google.com/maps/search/Moliendo+Cafe+Cuenca", "price": "$"},
        {"name": "Mercado 10 de Agosto", "type": "Market", "rating": 4.5, "reviews": 1200, "description": "Traditional market with excellent food stalls. Authentic local experience.", "booking_url": "https://www.google.com/maps/search/Mercado+10+de+Agosto+Cuenca", "price": "$"}
    ],
    "puntacana": [
        {"name": "La Yola", "type": "Seafood", "rating": 4.6, "reviews": 2200, "description": "Over-water restaurant at Punta Cana Resort. Fresh Caribbean seafood with stunning views.", "booking_url": "https://www.google.com/maps/search/La+Yola+Punta+Cana", "price": "$$$"},
        {"name": "Jellyfish Beach Restaurant", "type": "Seafood", "rating": 4.5, "reviews": 3500, "description": "Beachfront fine dining. Mediterranean-Caribbean fusion in beautiful setting.", "booking_url": "https://www.google.com/maps/search/Jellyfish+Beach+Restaurant+Punta+Cana", "price": "$$$"},
        {"name": "Captain Cook", "type": "Dominican", "rating": 4.3, "reviews": 1800, "description": "Casual local spot for Dominican seafood. Great whole fish and tostones.", "booking_url": "https://www.google.com/maps/search/Captain+Cook+Punta+Cana", "price": "$$"}
    ],
    "cali": [
        {"name": "El Zaguán de San Antonio", "type": "Colombian", "rating": 4.5, "reviews": 2500, "description": "Traditional Cali cuisine in San Antonio neighborhood. Great sancocho and empanadas.", "booking_url": "https://www.google.com/maps/search/El+Zaguan+de+San+Antonio+Cali", "price": "$$"},
        {"name": "Platillos Voladores", "type": "Colombian Fusion", "rating": 4.6, "reviews": 1500, "description": "Creative Colombian cuisine in trendy setting. Modern takes on Valle classics.", "booking_url": "https://www.google.com/maps/search/Platillos+Voladores+Cali", "price": "$$"},
        {"name": "Ringlete", "type": "Colombian", "rating": 4.4, "reviews": 2200, "description": "Classic Cali eatery since 1954. Famous for cholado (fruit salad) and lulada.", "booking_url": "https://www.google.com/maps/search/Ringlete+Cali", "price": "$"}
    ],
    "bariloche": [
        {"name": "Cassis", "type": "Patagonian", "rating": 4.6, "reviews": 1800, "description": "Farm-to-table Patagonian cuisine. Lamb, trout, and local ingredients with lake views.", "booking_url": "https://www.google.com/maps/search/Cassis+Bariloche", "price": "$$$"},
        {"name": "El Boliche de Alberto", "type": "Argentine Parrilla", "rating": 4.5, "reviews": 3500, "description": "Classic Patagonian parilla. Cordero al asador (spit-roasted lamb) done right.", "booking_url": "https://www.google.com/maps/search/El+Boliche+de+Alberto+Bariloche", "price": "$$"},
        {"name": "Rapa Nui", "type": "Chocolate/Cafe", "rating": 4.5, "reviews": 4500, "description": "Bariloche's famous chocolate shop and cafe. Swiss tradition in Patagonia.", "booking_url": "https://www.google.com/maps/search/Rapa+Nui+Bariloche", "price": "$$"}
    ],
    "santodomingo": [
        {"name": "Pat'e Palo", "type": "Dominican", "rating": 4.5, "reviews": 2200, "description": "Upscale Dominican cuisine in colonial zone. Beautiful courtyard setting.", "booking_url": "https://www.google.com/maps/search/Pat+e+Palo+Santo+Domingo", "price": "$$$"},
        {"name": "Adrian Tropical", "type": "Dominican", "rating": 4.4, "reviews": 5500, "description": "Popular chain for traditional Dominican food. Great mofongo and sancocho.", "booking_url": "https://www.google.com/maps/search/Adrian+Tropical+Santo+Domingo", "price": "$$"},
        {"name": "El Conuco", "type": "Dominican Traditional", "rating": 4.3, "reviews": 3200, "description": "Tourist favorite with traditional decor. Live music and Dominican classics.", "booking_url": "https://www.google.com/maps/search/El+Conuco+Santo+Domingo", "price": "$$"}
    ],
    "puertoescondido": [
        {"name": "El Sultan", "type": "Mediterranean-Mexican", "rating": 4.5, "reviews": 1200, "description": "Creative fusion in Rinconada. Great mezze, tacos, and craft cocktails.", "booking_url": "https://www.google.com/maps/search/El+Sultan+Puerto+Escondido", "price": "$$"},
        {"name": "Espadin", "type": "Mexican", "rating": 4.4, "reviews": 1500, "description": "Outstanding Oaxacan cuisine. Excellent mole and mezcal selection.", "booking_url": "https://www.google.com/maps/search/Espadin+Puerto+Escondido", "price": "$$"},
        {"name": "Mercado Benito Juarez", "type": "Market", "rating": 4.3, "reviews": 800, "description": "Local market with cheap eats. Great for fresh seafood cocktails and tlayudas.", "booking_url": "https://www.google.com/maps/search/Mercado+Benito+Juarez+Puerto+Escondido", "price": "$"}
    ],
    "sayulita": [
        {"name": "Don Pedro's", "type": "Mexican Seafood", "rating": 4.4, "reviews": 2800, "description": "Beachfront institution for fresh seafood. Great fish tacos and sunset views.", "booking_url": "https://www.google.com/maps/search/Don+Pedros+Sayulita", "price": "$$"},
        {"name": "Mary's", "type": "Mexican", "rating": 4.5, "reviews": 1500, "description": "Cozy courtyard restaurant with excellent breakfast and Mexican dishes.", "booking_url": "https://www.google.com/maps/search/Marys+Restaurant+Sayulita", "price": "$$"},
        {"name": "Terrazola", "type": "Mexican", "rating": 4.4, "reviews": 1200, "description": "Rooftop dining with pueblo views. Creative Mexican cuisine and great margaritas.", "booking_url": "https://www.google.com/maps/search/Terrazola+Sayulita", "price": "$$"}
    ],
    "lakeatitlan": [
        {"name": "Casa Palopo", "type": "Guatemalan Fine Dining", "rating": 4.6, "reviews": 800, "description": "Fine dining with stunning lake views. Refined Guatemalan cuisine at boutique hotel.", "booking_url": "https://www.google.com/maps/search/Casa+Palopo+Lake+Atitlan", "price": "$$$$"},
        {"name": "Cafe Sabor Cruceno", "type": "Guatemalan", "rating": 4.4, "reviews": 600, "description": "Local favorite in Santa Cruz. Simple Guatemalan dishes with lake views.", "booking_url": "https://www.google.com/maps/search/Cafe+Sabor+Cruceno+Lake+Atitlan", "price": "$"},
        {"name": "The Snug", "type": "International", "rating": 4.3, "reviews": 500, "description": "Popular expat hangout in San Marcos. Good burgers, pizza, and vegetarian options.", "booking_url": "https://www.google.com/maps/search/The+Snug+San+Marcos+Lake+Atitlan", "price": "$$"}
    ],
    "boquete": [
        {"name": "The Rock", "type": "International", "rating": 4.5, "reviews": 1200, "description": "Riverside restaurant built around giant boulders. Creative international menu.", "booking_url": "https://www.google.com/maps/search/The+Rock+Restaurant+Boquete", "price": "$$$"},
        {"name": "Big Daddy's Grill", "type": "American", "rating": 4.3, "reviews": 1500, "description": "Popular expat spot for American comfort food. Great burgers and wings.", "booking_url": "https://www.google.com/maps/search/Big+Daddys+Grill+Boquete", "price": "$$"},
        {"name": "Sugar & Spice", "type": "Panamanian", "rating": 4.4, "reviews": 800, "description": "Excellent local cuisine in town center. Try the sancocho and patacones.", "booking_url": "https://www.google.com/maps/search/Sugar+and+Spice+Boquete", "price": "$$"}
    ],
    "johannesburg": [
        {"name": "Marble", "type": "South African", "rating": 4.6, "reviews": 2800, "description": "David Higgs' celebration of fire cooking. Excellent steaks and local ingredients.", "booking_url": "https://www.google.com/maps/search/Marble+Restaurant+Johannesburg", "price": "$$$"},
        {"name": "Che Argentine Grill", "type": "Argentine", "rating": 4.5, "reviews": 2200, "description": "Best steak in Joburg. Authentic Argentine parrilla in Melrose Arch.", "booking_url": "https://www.google.com/maps/search/Che+Argentine+Grill+Johannesburg", "price": "$$$"},
        {"name": "The Local Grill", "type": "South African", "rating": 4.4, "reviews": 3500, "description": "Excellent steaks from local farms. Great atmosphere in Parktown North.", "booking_url": "https://www.google.com/maps/search/The+Local+Grill+Johannesburg", "price": "$$$"}
    ],
    "dakar": [
        {"name": "Chez Loutcha", "type": "Senegalese", "rating": 4.5, "reviews": 1200, "description": "Legendary for thieboudienne - Senegal's national fish and rice dish. Iconic spot.", "booking_url": "https://www.google.com/maps/search/Chez+Loutcha+Dakar", "price": "$"},
        {"name": "La Calebasse", "type": "Senegalese", "rating": 4.4, "reviews": 800, "description": "Traditional Senegalese cuisine in Almadies. Excellent yassa and mafe.", "booking_url": "https://www.google.com/maps/search/La+Calebasse+Dakar", "price": "$$"},
        {"name": "Le Lagon 1", "type": "Seafood", "rating": 4.3, "reviews": 1500, "description": "Oceanfront dining with fresh seafood. Beautiful setting on the Corniche.", "booking_url": "https://www.google.com/maps/search/Le+Lagon+1+Dakar", "price": "$$"}
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_5_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

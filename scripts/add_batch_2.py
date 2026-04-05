#!/usr/bin/env python3
"""Add restaurant data for batch 2 (30 cities)."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_2_DATA = {
    "casablanca": [
        {
            "name": "La Sqala",
            "type": "Moroccan",
            "rating": 4.5,
            "reviews": 4200,
            "description": "Beautiful garden restaurant in a restored 18th century fortress. Traditional Moroccan breakfast and lunch.",
            "booking_url": "https://www.google.com/maps/search/La+Sqala+Casablanca",
            "price": "$$"
        },
        {
            "name": "Rick's Cafe",
            "type": "International",
            "rating": 4.3,
            "reviews": 3500,
            "description": "Recreated from the Casablanca film. Atmospheric spot for cocktails and international cuisine.",
            "booking_url": "https://www.google.com/maps/search/Ricks+Cafe+Casablanca",
            "price": "$$$"
        },
        {
            "name": "Le Petit Rocher",
            "type": "Seafood",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Ocean-view seafood restaurant along the Corniche. Fresh catch with French-Moroccan preparations.",
            "booking_url": "https://www.google.com/maps/search/Le+Petit+Rocher+Casablanca",
            "price": "$$$"
        }
    ],
    "accra": [
        {
            "name": "Buka Restaurant",
            "type": "Ghanaian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Authentic Ghanaian cuisine in stylish setting. Famous for jollof rice, banku with tilapia, and fufu.",
            "booking_url": "https://www.google.com/maps/search/Buka+Restaurant+Accra",
            "price": "$$"
        },
        {
            "name": "The Republic Bar & Grill",
            "type": "Modern African",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Hip rooftop spot in Osu. Creative cocktails and fusion dishes with live music on weekends.",
            "booking_url": "https://www.google.com/maps/search/The+Republic+Bar+Grill+Accra",
            "price": "$$"
        },
        {
            "name": "Azmera",
            "type": "Ethiopian",
            "rating": 4.3,
            "reviews": 1200,
            "description": "Best Ethiopian in Accra. Traditional injera platters with various wots in cozy atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Azmera+Restaurant+Accra",
            "price": "$$"
        }
    ],
    "nairobi": [
        {
            "name": "Carnivore Restaurant",
            "type": "BBQ",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Famous all-you-can-eat meat restaurant. Game meats carved tableside - a Nairobi institution.",
            "booking_url": "https://www.google.com/maps/search/Carnivore+Restaurant+Nairobi",
            "price": "$$$"
        },
        {
            "name": "Mama Oliech",
            "type": "Kenyan",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Legendary local spot for fried tilapia and ugali. Politicians and locals queue up alike.",
            "booking_url": "https://www.google.com/maps/search/Mama+Oliech+Nairobi",
            "price": "$"
        },
        {
            "name": "Talisman",
            "type": "International Fusion",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Karen's beloved garden restaurant. Creative menu mixing African, Asian, and European influences.",
            "booking_url": "https://www.google.com/maps/search/Talisman+Restaurant+Nairobi",
            "price": "$$$"
        }
    ],
    "kigali": [
        {
            "name": "Heaven Restaurant",
            "type": "International",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Hillside restaurant with stunning views. Proceeds support local NGO. Creative international menu.",
            "booking_url": "https://www.google.com/maps/search/Heaven+Restaurant+Kigali",
            "price": "$$"
        },
        {
            "name": "Brachetto",
            "type": "Italian",
            "rating": 4.4,
            "reviews": 1200,
            "description": "Best Italian in Kigali with wood-fired pizzas. Lovely garden terrace setting.",
            "booking_url": "https://www.google.com/maps/search/Brachetto+Restaurant+Kigali",
            "price": "$$"
        },
        {
            "name": "Repub Lounge",
            "type": "Rwandan Fusion",
            "rating": 4.3,
            "reviews": 900,
            "description": "Trendy spot serving modern Rwandan dishes. Great cocktails and vibrant atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Repub+Lounge+Kigali",
            "price": "$$"
        }
    ],
    "lagos": [
        {
            "name": "Terra Kulture",
            "type": "Nigerian",
            "rating": 4.4,
            "reviews": 2500,
            "description": "Art gallery meets restaurant. Excellent jollof rice, suya, and traditional Nigerian dishes.",
            "booking_url": "https://www.google.com/maps/search/Terra+Kulture+Lagos",
            "price": "$$"
        },
        {
            "name": "NOK by Alara",
            "type": "Pan-African",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Upscale Pan-African cuisine in chic Victoria Island setting. Creative takes on continent's best dishes.",
            "booking_url": "https://www.google.com/maps/search/NOK+by+Alara+Lagos",
            "price": "$$$"
        },
        {
            "name": "Yellow Chilli",
            "type": "Nigerian",
            "rating": 4.3,
            "reviews": 3200,
            "description": "Celebrity chef Sisi Jemimah's restaurant. Refined Nigerian classics in stylish surroundings.",
            "booking_url": "https://www.google.com/maps/search/Yellow+Chilli+Lagos",
            "price": "$$"
        }
    ],
    "lima": [
        {
            "name": "Central",
            "type": "Peruvian Fine Dining",
            "rating": 4.9,
            "reviews": 3500,
            "description": "Ranked #1 in World's 50 Best Restaurants. Chef Virgilio Martinez explores Peru's diverse ecosystems.",
            "booking_url": "https://www.google.com/maps/search/Central+Restaurante+Lima",
            "price": "$$$$"
        },
        {
            "name": "La Mar",
            "type": "Cevicheria",
            "rating": 4.6,
            "reviews": 8500,
            "description": "Gaston Acurio's legendary ceviche spot. The freshest seafood in Lima's most vibrant setting.",
            "booking_url": "https://www.google.com/maps/search/La+Mar+Cebicheria+Lima",
            "price": "$$$"
        },
        {
            "name": "Isolina",
            "type": "Peruvian Criolla",
            "rating": 4.5,
            "reviews": 4200,
            "description": "Jose del Castillo's homage to Peruvian tavern cooking. Generous portions of lomo saltado and anticuchos.",
            "booking_url": "https://www.google.com/maps/search/Isolina+Taberna+Peruana+Lima",
            "price": "$$"
        }
    ],
    "cusco": [
        {
            "name": "Chicha",
            "type": "Peruvian",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Gaston Acurio's Cusco outpost. Andean ingredients prepared with modern techniques in colonial setting.",
            "booking_url": "https://www.google.com/maps/search/Chicha+Cusco",
            "price": "$$$"
        },
        {
            "name": "San Pedro Market",
            "type": "Market Food",
            "rating": 4.5,
            "reviews": 8000,
            "description": "Cusco's main market with food stalls. Fresh juices, ceviche, and traditional Andean dishes.",
            "booking_url": "https://www.google.com/maps/search/Mercado+San+Pedro+Cusco",
            "price": "$"
        },
        {
            "name": "Morena Peruvian Kitchen",
            "type": "Peruvian Fusion",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Creative Peruvian cooking in cozy plaza-side setting. Great alpaca dishes and pisco cocktails.",
            "booking_url": "https://www.google.com/maps/search/Morena+Peruvian+Kitchen+Cusco",
            "price": "$$"
        }
    ],
    "bogota": [
        {
            "name": "El Chato",
            "type": "Colombian",
            "rating": 4.7,
            "reviews": 2800,
            "description": "On Latin America's 50 Best list. Chef Alvaro Clavijo's celebration of Colombian ingredients.",
            "booking_url": "https://www.google.com/maps/search/El+Chato+Bogota",
            "price": "$$$"
        },
        {
            "name": "Leo",
            "type": "Modern Colombian",
            "rating": 4.8,
            "reviews": 1500,
            "description": "Leonor Espinosa's award-winning exploration of Colombia's biodiversity. Extraordinary tasting menus.",
            "booking_url": "https://www.google.com/maps/search/Leo+Cocina+y+Cava+Bogota",
            "price": "$$$$"
        },
        {
            "name": "La Puerta Falsa",
            "type": "Colombian Traditional",
            "rating": 4.4,
            "reviews": 6500,
            "description": "Bogota's oldest restaurant since 1816. Traditional tamales and chocolate completo with cheese.",
            "booking_url": "https://www.google.com/maps/search/La+Puerta+Falsa+Bogota",
            "price": "$"
        }
    ],
    "cartagena": [
        {
            "name": "La Cevicheria",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Anthony Bourdain's favorite spot in Cartagena. Exceptional ceviche in colorful Getsemani setting.",
            "booking_url": "https://www.google.com/maps/search/La+Cevicheria+Cartagena",
            "price": "$$"
        },
        {
            "name": "Carmen",
            "type": "Modern Colombian",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Elegant restaurant in the old city. Chef's innovative takes on Caribbean Colombian cuisine.",
            "booking_url": "https://www.google.com/maps/search/Carmen+Restaurant+Cartagena",
            "price": "$$$"
        },
        {
            "name": "La Cocina de Pepina",
            "type": "Colombian",
            "rating": 4.4,
            "reviews": 3800,
            "description": "Home-style Caribbean cooking in Getsemani. Generous portions of arroz con coco and fried fish.",
            "booking_url": "https://www.google.com/maps/search/La+Cocina+de+Pepina+Cartagena",
            "price": "$"
        }
    ],
    "santiago": [
        {
            "name": "Borago",
            "type": "Chilean Fine Dining",
            "rating": 4.8,
            "reviews": 1800,
            "description": "Chef Rodolfo Guzman's celebration of Chilean terroir. One of Latin America's most acclaimed restaurants.",
            "booking_url": "https://www.google.com/maps/search/Borago+Santiago",
            "price": "$$$$"
        },
        {
            "name": "Liguria",
            "type": "Chilean",
            "rating": 4.4,
            "reviews": 6500,
            "description": "Santiago institution for traditional Chilean food. Multiple locations, always packed with locals.",
            "booking_url": "https://www.google.com/maps/search/Liguria+Restaurant+Santiago",
            "price": "$$"
        },
        {
            "name": "Mercado Central",
            "type": "Seafood Market",
            "rating": 4.5,
            "reviews": 12000,
            "description": "Historic fish market with restaurants. Essential for caldillo de congrio and fresh Chilean seafood.",
            "booking_url": "https://www.google.com/maps/search/Mercado+Central+Santiago",
            "price": "$$"
        }
    ],
    "valparaiso": [
        {
            "name": "Cafe Turri",
            "type": "Chilean",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Legendary hilltop restaurant with bay views. Classic Chilean cuisine in beautiful historic building.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Turri+Valparaiso",
            "price": "$$$"
        },
        {
            "name": "J Cruz M",
            "type": "Chilean Seafood",
            "rating": 4.4,
            "reviews": 1500,
            "description": "Historic port-side restaurant since 1940. Sailors, poets, and tourists gather for seafood classics.",
            "booking_url": "https://www.google.com/maps/search/J+Cruz+M+Valparaiso",
            "price": "$$"
        },
        {
            "name": "Apice",
            "type": "Modern Chilean",
            "rating": 4.6,
            "reviews": 800,
            "description": "Young chef's creative tasting menus showcasing Chilean products. Rising star of Valparaiso dining.",
            "booking_url": "https://www.google.com/maps/search/Apice+Restaurant+Valparaiso",
            "price": "$$$"
        }
    ],
    "quito": [
        {
            "name": "Zazu",
            "type": "Modern Ecuadorian",
            "rating": 4.6,
            "reviews": 2200,
            "description": "Alexander Lau's celebration of Ecuadorian ingredients. On Latin America's 50 Best list.",
            "booking_url": "https://www.google.com/maps/search/Zazu+Restaurant+Quito",
            "price": "$$$"
        },
        {
            "name": "Mercado Central",
            "type": "Market Food",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Quito's bustling central market. Authentic ceviche, encebollado, and hornado among the vendors.",
            "booking_url": "https://www.google.com/maps/search/Mercado+Central+Quito",
            "price": "$"
        },
        {
            "name": "Theatrum",
            "type": "Ecuadorian Fine Dining",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Upscale dining in historic theater building. Elegant Ecuadorian cuisine with city views.",
            "booking_url": "https://www.google.com/maps/search/Theatrum+Restaurant+Quito",
            "price": "$$$"
        }
    ],
    "sanjuan": [
        {
            "name": "La Alcapurria Quema",
            "type": "Puerto Rican Street Food",
            "rating": 4.6,
            "reviews": 2500,
            "description": "Best alcapurrias in San Juan. Traditional fritters stuffed with meat, always fresh and hot.",
            "booking_url": "https://www.google.com/maps/search/La+Alcapurria+Quema+San+Juan",
            "price": "$"
        },
        {
            "name": "Marmalade",
            "type": "Modern Caribbean",
            "rating": 4.7,
            "reviews": 3200,
            "description": "Chef Peter Schintler's elegant Old San Juan restaurant. Innovative Caribbean fusion cuisine.",
            "booking_url": "https://www.google.com/maps/search/Marmalade+Restaurant+San+Juan",
            "price": "$$$$"
        },
        {
            "name": "La Casita Blanca",
            "type": "Puerto Rican",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Classic criolla cooking in home-like setting. Legendary mofongo and traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/La+Casita+Blanca+San+Juan",
            "price": "$$"
        }
    ],
    "santacruz": [
        {
            "name": "La Casona",
            "type": "Bolivian",
            "rating": 4.4,
            "reviews": 1200,
            "description": "Traditional Bolivian dishes in colonial house setting. Great majadito and silpancho.",
            "booking_url": "https://www.google.com/maps/search/La+Casona+Restaurant+Santa+Cruz+Bolivia",
            "price": "$$"
        },
        {
            "name": "Jardin de Asia",
            "type": "Asian Fusion",
            "rating": 4.3,
            "reviews": 1500,
            "description": "Popular Asian fusion spot. Good sushi and Thai dishes in pleasant garden setting.",
            "booking_url": "https://www.google.com/maps/search/Jardin+de+Asia+Santa+Cruz+Bolivia",
            "price": "$$"
        },
        {
            "name": "La Pascana",
            "type": "Bolivian Grill",
            "rating": 4.5,
            "reviews": 900,
            "description": "Best parrilla in Santa Cruz. Argentine-style grilled meats with Bolivian hospitality.",
            "booking_url": "https://www.google.com/maps/search/La+Pascana+Santa+Cruz+Bolivia",
            "price": "$$"
        }
    ],
    "lapaz": [
        {
            "name": "Gustu",
            "type": "Modern Bolivian",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Claus Meyer's restaurant training underprivileged youth. Revolutionary Bolivian cuisine using forgotten ingredients.",
            "booking_url": "https://www.google.com/maps/search/Gustu+La+Paz",
            "price": "$$$"
        },
        {
            "name": "Popular Cocina Boliviana",
            "type": "Bolivian",
            "rating": 4.4,
            "reviews": 1500,
            "description": "Traditional Bolivian comfort food done well. Great salteñas, pique macho, and anticuchos.",
            "booking_url": "https://www.google.com/maps/search/Popular+Cocina+Boliviana+La+Paz",
            "price": "$"
        },
        {
            "name": "Ali Pacha",
            "type": "Bolivian Vegan",
            "rating": 4.5,
            "reviews": 800,
            "description": "World's highest vegan fine dining. Chef Michelangelo Cestari's exploration of Andean ingredients.",
            "booking_url": "https://www.google.com/maps/search/Ali+Pacha+La+Paz",
            "price": "$$$"
        }
    ],
    "asuncion": [
        {
            "name": "Tierra Colorada",
            "type": "Paraguayan",
            "rating": 4.5,
            "reviews": 1200,
            "description": "Upscale Paraguayan cuisine celebrating local ingredients. Beautiful garden setting.",
            "booking_url": "https://www.google.com/maps/search/Tierra+Colorada+Asuncion",
            "price": "$$$"
        },
        {
            "name": "Lido Bar",
            "type": "Paraguayan Traditional",
            "rating": 4.3,
            "reviews": 2800,
            "description": "Historic downtown bar since 1965. Essential for empanadas and cold beer.",
            "booking_url": "https://www.google.com/maps/search/Lido+Bar+Asuncion",
            "price": "$"
        },
        {
            "name": "Bolsi",
            "type": "Traditional Paraguayan",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Classic Asuncion restaurant for traditional dishes. Known for sopa paraguaya and bori bori.",
            "booking_url": "https://www.google.com/maps/search/Bolsi+Asuncion",
            "price": "$$"
        }
    ],
    "guadalajara": [
        {
            "name": "Alcalde",
            "type": "Modern Mexican",
            "rating": 4.7,
            "reviews": 2500,
            "description": "On Latin America's 50 Best list. Chef Francisco Ruano's refined Jaliscan cuisine.",
            "booking_url": "https://www.google.com/maps/search/Alcalde+Restaurant+Guadalajara",
            "price": "$$$"
        },
        {
            "name": "Birrieria Las 9 Esquinas",
            "type": "Mexican",
            "rating": 4.5,
            "reviews": 4500,
            "description": "Legendary birria spot since 1951. This is what birria should taste like.",
            "booking_url": "https://www.google.com/maps/search/Birrieria+Las+9+Esquinas+Guadalajara",
            "price": "$"
        },
        {
            "name": "La Chata",
            "type": "Traditional Mexican",
            "rating": 4.4,
            "reviews": 5200,
            "description": "Guadalajara institution for traditional Jaliscan fare. Great tortas ahogadas and pozole.",
            "booking_url": "https://www.google.com/maps/search/La+Chata+Guadalajara",
            "price": "$"
        }
    ],
    "puertovallarta": [
        {
            "name": "Cafe des Artistes",
            "type": "Mexican Fine Dining",
            "rating": 4.6,
            "reviews": 3500,
            "description": "Thierry Blouet's legendary restaurant. French-Mexican cuisine in romantic jungle setting.",
            "booking_url": "https://www.google.com/maps/search/Cafe+des+Artistes+Puerto+Vallarta",
            "price": "$$$$"
        },
        {
            "name": "El Arrayán",
            "type": "Traditional Mexican",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Authentic regional Mexican cuisine. Excellent moles and traditional dishes in colorful setting.",
            "booking_url": "https://www.google.com/maps/search/El+Arrayan+Puerto+Vallarta",
            "price": "$$"
        },
        {
            "name": "Mariscos Cisneros",
            "type": "Mexican Seafood",
            "rating": 4.4,
            "reviews": 1500,
            "description": "Local favorite for fresh seafood. Great ceviche tostadas and fish tacos.",
            "booking_url": "https://www.google.com/maps/search/Mariscos+Cisneros+Puerto+Vallarta",
            "price": "$"
        }
    ],
    "sanjosecr": [
        {
            "name": "Sikwa",
            "type": "Costa Rican",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Celebrating indigenous Costa Rican cuisine. Chef Pablo Bonilla's exploration of forgotten recipes.",
            "booking_url": "https://www.google.com/maps/search/Sikwa+Restaurant+San+Jose+Costa+Rica",
            "price": "$$$"
        },
        {
            "name": "Restaurante Silvestre",
            "type": "Farm-to-Table",
            "rating": 4.5,
            "reviews": 800,
            "description": "Costa Rica's farm-to-table pioneer. Creative menu sourced from local farmers and foragers.",
            "booking_url": "https://www.google.com/maps/search/Restaurante+Silvestre+San+Jose",
            "price": "$$$"
        },
        {
            "name": "Mercado Central",
            "type": "Market Food",
            "rating": 4.4,
            "reviews": 3500,
            "description": "San Jose's historic market. Essential for casado, gallo pinto, and fresh tropical fruits.",
            "booking_url": "https://www.google.com/maps/search/Mercado+Central+San+Jose+Costa+Rica",
            "price": "$"
        }
    ],
    "tamarindo": [
        {
            "name": "Pangas Beach Club",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 2500,
            "description": "Beachfront dining with toes in the sand. Fresh seafood and sunset cocktails.",
            "booking_url": "https://www.google.com/maps/search/Pangas+Beach+Club+Tamarindo",
            "price": "$$$"
        },
        {
            "name": "El Chiringuito",
            "type": "Mediterranean",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Spanish-style beach restaurant. Great paella and sangria with ocean views.",
            "booking_url": "https://www.google.com/maps/search/El+Chiringuito+Tamarindo",
            "price": "$$"
        },
        {
            "name": "Nogui's",
            "type": "Costa Rican",
            "rating": 4.3,
            "reviews": 2200,
            "description": "Local institution for breakfast and casados. Reliable tico cooking at fair prices.",
            "booking_url": "https://www.google.com/maps/search/Noguis+Tamarindo",
            "price": "$"
        }
    ],
    "panama": [
        {
            "name": "Maito",
            "type": "Modern Panamanian",
            "rating": 4.7,
            "reviews": 2800,
            "description": "Ranked #6 in Latin America's 50 Best. Chef Mario Castrellon's tribute to Panama's biodiversity.",
            "booking_url": "https://www.google.com/maps/search/Maito+Panama+City",
            "price": "$$$"
        },
        {
            "name": "Mercado de Mariscos",
            "type": "Seafood Market",
            "rating": 4.4,
            "reviews": 6500,
            "description": "Panama City's fish market with upstairs cevicherias. Ultra-fresh seafood at great prices.",
            "booking_url": "https://www.google.com/maps/search/Mercado+de+Mariscos+Panama",
            "price": "$"
        },
        {
            "name": "Donde Jose",
            "type": "Modern Panamanian",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Jose Carles' intimate tasting menu experience. Surprising, creative Panamanian cuisine.",
            "booking_url": "https://www.google.com/maps/search/Donde+Jose+Panama",
            "price": "$$$$"
        }
    ],
    "antigua": [
        {
            "name": "Cafe Condesa",
            "type": "Guatemalan",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Beautiful courtyard restaurant on the central park. Excellent Guatemalan breakfast and lunch.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Condesa+Antigua+Guatemala",
            "price": "$$"
        },
        {
            "name": "Hector's Bistro",
            "type": "Guatemalan Fusion",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Intimate fine dining from acclaimed Guatemalan chef. Creative tasting menus with local ingredients.",
            "booking_url": "https://www.google.com/maps/search/Hectors+Bistro+Antigua+Guatemala",
            "price": "$$$"
        },
        {
            "name": "La Fonda de la Calle Real",
            "type": "Traditional Guatemalan",
            "rating": 4.4,
            "reviews": 3200,
            "description": "Antigua institution for traditional dishes. Pepian, jocón, and other Guatemalan classics.",
            "booking_url": "https://www.google.com/maps/search/La+Fonda+de+la+Calle+Real+Antigua",
            "price": "$$"
        }
    ],
    "zurich": [
        {
            "name": "Kronenhalle",
            "type": "Swiss",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Historic restaurant adorned with Picassos and Chagalls. Classic Swiss dishes in legendary setting.",
            "booking_url": "https://www.google.com/maps/search/Kronenhalle+Zurich",
            "price": "$$$$"
        },
        {
            "name": "Zeughauskeller",
            "type": "Swiss Traditional",
            "rating": 4.3,
            "reviews": 5500,
            "description": "15th century arsenal turned beer hall. Hearty Swiss fare including excellent sausages.",
            "booking_url": "https://www.google.com/maps/search/Zeughauskeller+Zurich",
            "price": "$$"
        },
        {
            "name": "Haus Hiltl",
            "type": "Vegetarian",
            "rating": 4.4,
            "reviews": 4200,
            "description": "World's oldest vegetarian restaurant since 1898. Incredible buffet with global influences.",
            "booking_url": "https://www.google.com/maps/search/Haus+Hiltl+Zurich",
            "price": "$$"
        }
    ],
    "geneva": [
        {
            "name": "Cafe du Soleil",
            "type": "Swiss",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Geneva's most famous fondue restaurant. Traditional cheese fondue in charming setting.",
            "booking_url": "https://www.google.com/maps/search/Cafe+du+Soleil+Geneva",
            "price": "$$$"
        },
        {
            "name": "Bayview by Michel Roth",
            "type": "French Fine Dining",
            "rating": 4.7,
            "reviews": 1200,
            "description": "Michelin-starred lakeside dining. Elegant French cuisine with stunning Geneva views.",
            "booking_url": "https://www.google.com/maps/search/Bayview+Michel+Roth+Geneva",
            "price": "$$$$"
        },
        {
            "name": "Buvette des Bains",
            "type": "Swiss Casual",
            "rating": 4.3,
            "reviews": 1800,
            "description": "Lakeside spot by the Bains des Paquis. Casual Swiss food with amazing summer vibes.",
            "booking_url": "https://www.google.com/maps/search/Buvette+des+Bains+Geneva",
            "price": "$$"
        }
    ],
    "dublin": [
        {
            "name": "Chapter One",
            "type": "Irish Fine Dining",
            "rating": 4.7,
            "reviews": 2800,
            "description": "Michelin-starred restaurant in Writers Museum basement. Refined Irish cuisine at its finest.",
            "booking_url": "https://www.google.com/maps/search/Chapter+One+Dublin",
            "price": "$$$$"
        },
        {
            "name": "The Pig's Ear",
            "type": "Modern Irish",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Creative Irish cooking in Georgian townhouse. Great for elevated comfort food.",
            "booking_url": "https://www.google.com/maps/search/The+Pigs+Ear+Dublin",
            "price": "$$$"
        },
        {
            "name": "Leo Burdock",
            "type": "Fish & Chips",
            "rating": 4.4,
            "reviews": 4500,
            "description": "Dublin's most famous chipper since 1913. Traditional fish and chips done perfectly.",
            "booking_url": "https://www.google.com/maps/search/Leo+Burdock+Dublin",
            "price": "$"
        }
    ],
    "london": [
        {
            "name": "Dishoom",
            "type": "Indian",
            "rating": 4.6,
            "reviews": 25000,
            "description": "Bombay-style cafe inspired by Irani cafes. Essential for bacon naan roll and black daal.",
            "booking_url": "https://www.google.com/maps/search/Dishoom+London",
            "price": "$$"
        },
        {
            "name": "St. John",
            "type": "British",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Fergus Henderson's nose-to-tail temple. British cooking that changed London's food scene.",
            "booking_url": "https://www.google.com/maps/search/St+John+Restaurant+London",
            "price": "$$$"
        },
        {
            "name": "Bao",
            "type": "Taiwanese",
            "rating": 4.5,
            "reviews": 8500,
            "description": "Cult following for pillowy bao buns. Small, packed, and worth every minute of the queue.",
            "booking_url": "https://www.google.com/maps/search/Bao+Soho+London",
            "price": "$$"
        }
    ],
    "manchester": [
        {
            "name": "Mana",
            "type": "Fine Dining",
            "rating": 4.7,
            "reviews": 1200,
            "description": "Michelin-starred Nordic-inspired cuisine. Chef Simon Martin's exceptional tasting menus.",
            "booking_url": "https://www.google.com/maps/search/Mana+Restaurant+Manchester",
            "price": "$$$$"
        },
        {
            "name": "Rudy's Pizza",
            "type": "Italian",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Neapolitan pizza perfection. Always a queue but always worth it for the margherita.",
            "booking_url": "https://www.google.com/maps/search/Rudys+Pizza+Manchester",
            "price": "$"
        },
        {
            "name": "Bundobust",
            "type": "Indian Street Food",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Gujarati street food meets craft beer. Vada pav, okra fries, and rotating local brews.",
            "booking_url": "https://www.google.com/maps/search/Bundobust+Manchester",
            "price": "$"
        }
    ],
    "edinburgh": [
        {
            "name": "The Kitchin",
            "type": "Scottish Fine Dining",
            "rating": 4.7,
            "reviews": 3200,
            "description": "Tom Kitchin's Michelin-starred celebration of Scottish produce. From nature to plate philosophy.",
            "booking_url": "https://www.google.com/maps/search/The+Kitchin+Edinburgh",
            "price": "$$$$"
        },
        {
            "name": "Ondine",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 3800,
            "description": "Sustainable Scottish seafood specialist. Fresh oysters and spectacular fish dishes.",
            "booking_url": "https://www.google.com/maps/search/Ondine+Edinburgh",
            "price": "$$$"
        },
        {
            "name": "The Scran & Scallie",
            "type": "Scottish Gastropub",
            "rating": 4.4,
            "reviews": 2500,
            "description": "Tom Kitchin's casual gastropub. Elevated Scottish pub classics in Stockbridge.",
            "booking_url": "https://www.google.com/maps/search/Scran+and+Scallie+Edinburgh",
            "price": "$$"
        }
    ],
    "paris": [
        {
            "name": "Le Comptoir du Pantheon",
            "type": "French Bistro",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Perfect Left Bank bistro. Classic French dishes executed flawlessly with great people watching.",
            "booking_url": "https://www.google.com/maps/search/Le+Comptoir+du+Pantheon+Paris",
            "price": "$$"
        },
        {
            "name": "Septime",
            "type": "Modern French",
            "rating": 4.7,
            "reviews": 4200,
            "description": "Bertrand Grebaut's natural wine-focused tasting menus. One of Paris's hardest reservations.",
            "booking_url": "https://www.google.com/maps/search/Septime+Paris",
            "price": "$$$"
        },
        {
            "name": "Bouillon Chartier",
            "type": "French Traditional",
            "rating": 4.3,
            "reviews": 18000,
            "description": "Historic workers' canteen since 1896. Traditional French fare at incredible value in stunning space.",
            "booking_url": "https://www.google.com/maps/search/Bouillon+Chartier+Paris",
            "price": "$"
        }
    ],
    "lyon": [
        {
            "name": "Daniel et Denise",
            "type": "Lyonnaise Bouchon",
            "rating": 4.6,
            "reviews": 3500,
            "description": "Quintessential Lyonnaise bouchon. Meilleur Ouvrier de France serving traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/Daniel+et+Denise+Lyon",
            "price": "$$"
        },
        {
            "name": "Les Halles de Lyon Paul Bocuse",
            "type": "Food Hall",
            "rating": 4.5,
            "reviews": 8500,
            "description": "France's finest food hall. Extraordinary charcuterie, cheese, and prepared foods from Lyon's best.",
            "booking_url": "https://www.google.com/maps/search/Les+Halles+de+Lyon+Paul+Bocuse",
            "price": "$$"
        },
        {
            "name": "Cafe Comptoir Abel",
            "type": "Traditional French",
            "rating": 4.4,
            "reviews": 2200,
            "description": "One of Lyon's oldest bouchons since 1928. Authentic Lyonnaise cooking in historic setting.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Comptoir+Abel+Lyon",
            "price": "$$"
        }
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_2_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

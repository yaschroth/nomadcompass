#!/usr/bin/env python3
"""Add restaurant data for batch 3 (30 cities) - Europe & Mediterranean."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_3_DATA = {
    "nice": [
        {
            "name": "La Petite Maison",
            "type": "Nicoise",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Legendary Nicoise restaurant now global. The original location for salade nicoise and Provencal classics.",
            "booking_url": "https://www.google.com/maps/search/La+Petite+Maison+Nice",
            "price": "$$$"
        },
        {
            "name": "Chez Pipo",
            "type": "French",
            "rating": 4.5,
            "reviews": 3200,
            "description": "The best socca (chickpea crepe) in Nice since 1923. Local institution in the old town.",
            "booking_url": "https://www.google.com/maps/search/Chez+Pipo+Nice",
            "price": "$"
        },
        {
            "name": "Jan",
            "type": "South African-French",
            "rating": 4.7,
            "reviews": 1500,
            "description": "Michelin-starred fusion from South African chef Jan Hendrik. Creative cuisine in intimate setting.",
            "booking_url": "https://www.google.com/maps/search/Jan+Restaurant+Nice",
            "price": "$$$$"
        }
    ],
    "milan": [
        {
            "name": "Latteria San Marco",
            "type": "Italian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Tiny neighborhood gem serving homestyle Italian. No menu, just daily specials and warm hospitality.",
            "booking_url": "https://www.google.com/maps/search/Latteria+San+Marco+Milan",
            "price": "$$"
        },
        {
            "name": "Luini Panzerotti",
            "type": "Italian Street Food",
            "rating": 4.5,
            "reviews": 12000,
            "description": "Milan institution since 1888. Perfect fried panzerotti - queues at lunch are worth it.",
            "booking_url": "https://www.google.com/maps/search/Luini+Panzerotti+Milan",
            "price": "$"
        },
        {
            "name": "Ratana",
            "type": "Modern Milanese",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Contemporary Milanese cuisine in a converted railway building. Excellent risotto alla milanese.",
            "booking_url": "https://www.google.com/maps/search/Ratana+Milan",
            "price": "$$$"
        }
    ],
    "rome": [
        {
            "name": "Da Enzo al 29",
            "type": "Roman",
            "rating": 4.6,
            "reviews": 8500,
            "description": "Trastevere gem for perfect Roman classics. The cacio e pepe and carbonara are legendary.",
            "booking_url": "https://www.google.com/maps/search/Da+Enzo+al+29+Rome",
            "price": "$$"
        },
        {
            "name": "Roscioli",
            "type": "Italian",
            "rating": 4.6,
            "reviews": 6500,
            "description": "Part deli, part restaurant. Exceptional cured meats, cheeses, and pasta in the heart of Rome.",
            "booking_url": "https://www.google.com/maps/search/Roscioli+Rome",
            "price": "$$$"
        },
        {
            "name": "Supplì Roma",
            "type": "Roman Street Food",
            "rating": 4.5,
            "reviews": 4200,
            "description": "The original supplì (fried rice balls) since 1979. Classic Roman street food done perfectly.",
            "booking_url": "https://www.google.com/maps/search/Suppli+Roma",
            "price": "$"
        }
    ],
    "florence": [
        {
            "name": "Trattoria Mario",
            "type": "Tuscan",
            "rating": 4.5,
            "reviews": 7500,
            "description": "No-frills lunch spot since 1953. Shared tables, daily specials, and authentic Florentine bistecca.",
            "booking_url": "https://www.google.com/maps/search/Trattoria+Mario+Florence",
            "price": "$"
        },
        {
            "name": "All'Antico Vinaio",
            "type": "Italian Sandwiches",
            "rating": 4.6,
            "reviews": 25000,
            "description": "World-famous schiacciata sandwiches. The queue wraps around the block but moves fast.",
            "booking_url": "https://www.google.com/maps/search/All+Antico+Vinaio+Florence",
            "price": "$"
        },
        {
            "name": "Cibreo Trattoria",
            "type": "Tuscan",
            "rating": 4.4,
            "reviews": 3200,
            "description": "Same kitchen as the fine dining Cibreo at half the price. No pasta - just authentic Tuscan dishes.",
            "booking_url": "https://www.google.com/maps/search/Cibreo+Trattoria+Florence",
            "price": "$$"
        }
    ],
    "palermo": [
        {
            "name": "Ferro di Cavallo",
            "type": "Sicilian",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Legendary Palermo trattoria in the Vucciria. No menu - just incredible daily Sicilian cooking.",
            "booking_url": "https://www.google.com/maps/search/Ferro+di+Cavallo+Palermo",
            "price": "$"
        },
        {
            "name": "Mercato di Ballaro",
            "type": "Street Food Market",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Palermo's oldest market with incredible street food. Panelle, arancine, and sfincione galore.",
            "booking_url": "https://www.google.com/maps/search/Mercato+di+Ballaro+Palermo",
            "price": "$"
        },
        {
            "name": "Gagini",
            "type": "Modern Sicilian",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Refined Sicilian cuisine in elegant setting. Chef's contemporary take on island traditions.",
            "booking_url": "https://www.google.com/maps/search/Gagini+Social+Restaurant+Palermo",
            "price": "$$$"
        }
    ],
    "madrid": [
        {
            "name": "Sobrino de Botin",
            "type": "Spanish",
            "rating": 4.4,
            "reviews": 18000,
            "description": "World's oldest restaurant (1725, Guinness certified). Legendary roast suckling pig and lamb.",
            "booking_url": "https://www.google.com/maps/search/Sobrino+de+Botin+Madrid",
            "price": "$$$"
        },
        {
            "name": "Mercado de San Miguel",
            "type": "Food Hall",
            "rating": 4.3,
            "reviews": 35000,
            "description": "Historic iron market with gourmet stalls. Perfect for tapas hopping and Spanish specialties.",
            "booking_url": "https://www.google.com/maps/search/Mercado+de+San+Miguel+Madrid",
            "price": "$$"
        },
        {
            "name": "DiverXO",
            "type": "Avant-Garde",
            "rating": 4.8,
            "reviews": 2500,
            "description": "Three Michelin stars of theatrical Spanish-Asian fusion. Chef Dabiz Munoz's wild culinary show.",
            "booking_url": "https://www.google.com/maps/search/DiverXO+Madrid",
            "price": "$$$$"
        }
    ],
    "valencia": [
        {
            "name": "La Pepica",
            "type": "Spanish Paella",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Valencia's most famous paella restaurant since 1898. Hemingway's favorite on the beach.",
            "booking_url": "https://www.google.com/maps/search/La+Pepica+Valencia",
            "price": "$$$"
        },
        {
            "name": "Mercado Central",
            "type": "Market",
            "rating": 4.6,
            "reviews": 15000,
            "description": "Europe's largest fresh food market. Stunning modernist building with incredible produce.",
            "booking_url": "https://www.google.com/maps/search/Mercado+Central+Valencia",
            "price": "$"
        },
        {
            "name": "Ricard Camarena",
            "type": "Modern Spanish",
            "rating": 4.8,
            "reviews": 1200,
            "description": "Two Michelin stars showcasing Valencian ingredients. Elegant fine dining at its best.",
            "booking_url": "https://www.google.com/maps/search/Ricard+Camarena+Restaurant+Valencia",
            "price": "$$$$"
        }
    ],
    "seville": [
        {
            "name": "El Rinconcillo",
            "type": "Spanish Tapas",
            "rating": 4.4,
            "reviews": 6500,
            "description": "Seville's oldest bar since 1670. Classic tapas in atmospheric wood-paneled setting.",
            "booking_url": "https://www.google.com/maps/search/El+Rinconcillo+Seville",
            "price": "$$"
        },
        {
            "name": "Casa Robles",
            "type": "Andalusian",
            "rating": 4.5,
            "reviews": 3800,
            "description": "Traditional Sevillian restaurant near the cathedral. Excellent gazpacho and iberian pork.",
            "booking_url": "https://www.google.com/maps/search/Casa+Robles+Seville",
            "price": "$$"
        },
        {
            "name": "Eslava",
            "type": "Modern Tapas",
            "rating": 4.6,
            "reviews": 4200,
            "description": "Creative tapas in San Lorenzo neighborhood. The slow-cooked egg with mushrooms is famous.",
            "booking_url": "https://www.google.com/maps/search/Eslava+Seville",
            "price": "$$"
        }
    ],
    "malaga": [
        {
            "name": "El Pimpi",
            "type": "Andalusian",
            "rating": 4.4,
            "reviews": 18000,
            "description": "Malaga's most iconic bodega. Traditional tapas, local wine, and walls signed by celebrities.",
            "booking_url": "https://www.google.com/maps/search/El+Pimpi+Malaga",
            "price": "$$"
        },
        {
            "name": "Casa Lola",
            "type": "Spanish Tapas",
            "rating": 4.5,
            "reviews": 4500,
            "description": "Popular tapas bar with creative dishes. Great salmorejo and fried fish.",
            "booking_url": "https://www.google.com/maps/search/Casa+Lola+Malaga",
            "price": "$$"
        },
        {
            "name": "El Tapeo de Cervantes",
            "type": "Modern Spanish",
            "rating": 4.6,
            "reviews": 3200,
            "description": "Small tapas bar with big flavors. International influences on Spanish classics.",
            "booking_url": "https://www.google.com/maps/search/El+Tapeo+de+Cervantes+Malaga",
            "price": "$$"
        }
    ],
    "tenerife": [
        {
            "name": "El Rincon de Juan Carlos",
            "type": "Spanish Fine Dining",
            "rating": 4.8,
            "reviews": 1200,
            "description": "Two Michelin stars in Los Gigantes. Juan Carlos Padron's celebration of Canarian ingredients.",
            "booking_url": "https://www.google.com/maps/search/El+Rincon+de+Juan+Carlos+Tenerife",
            "price": "$$$$"
        },
        {
            "name": "Guachinche Quintero",
            "type": "Canarian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Traditional guachinche (local tavern) with home cooking. Authentic Canarian experience.",
            "booking_url": "https://www.google.com/maps/search/Guachinche+Quintero+Tenerife",
            "price": "$"
        },
        {
            "name": "NUB",
            "type": "Modern Canarian",
            "rating": 4.7,
            "reviews": 900,
            "description": "Michelin-starred restaurant celebrating Tenerife terroir. Chef Andrea Bernardi's creative cuisine.",
            "booking_url": "https://www.google.com/maps/search/NUB+Restaurant+Tenerife",
            "price": "$$$"
        }
    ],
    "athens": [
        {
            "name": "Karamanlidika tou Fani",
            "type": "Greek Deli",
            "rating": 4.6,
            "reviews": 4500,
            "description": "Traditional meze spot specializing in cured meats. Excellent pastourma and soujouk.",
            "booking_url": "https://www.google.com/maps/search/Karamanlidika+tou+Fani+Athens",
            "price": "$$"
        },
        {
            "name": "To Kafeneio",
            "type": "Greek Traditional",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Classic Plaka taverna since 1980. Excellent moussaka and grilled meats in garden setting.",
            "booking_url": "https://www.google.com/maps/search/To+Kafeneio+Athens",
            "price": "$$"
        },
        {
            "name": "Spondi",
            "type": "French-Greek Fine Dining",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Two Michelin stars in beautiful neoclassical courtyard. Mediterranean fine dining at its peak.",
            "booking_url": "https://www.google.com/maps/search/Spondi+Athens",
            "price": "$$$$"
        }
    ],
    "thessaloniki": [
        {
            "name": "Ouzeri Tsinari",
            "type": "Greek",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Traditional ouzeri in upper town. Outstanding meze and spectacular city views.",
            "booking_url": "https://www.google.com/maps/search/Ouzeri+Tsinari+Thessaloniki",
            "price": "$$"
        },
        {
            "name": "Extravaganza",
            "type": "Modern Greek",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Creative Greek cuisine in elegant waterfront setting. Fresh seafood and local wines.",
            "booking_url": "https://www.google.com/maps/search/Extravaganza+Thessaloniki",
            "price": "$$$"
        },
        {
            "name": "Full tou Meze",
            "type": "Greek Meze",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Popular spot for traditional meze. Generous portions and lively atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Full+tou+Meze+Thessaloniki",
            "price": "$"
        }
    ],
    "crete": [
        {
            "name": "Peskesi",
            "type": "Cretan",
            "rating": 4.7,
            "reviews": 3500,
            "description": "Farm-to-table Cretan cuisine in Heraklion. Ancient recipes with organic ingredients from their farm.",
            "booking_url": "https://www.google.com/maps/search/Peskesi+Heraklion+Crete",
            "price": "$$"
        },
        {
            "name": "Portes",
            "type": "Cretan",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Chania old town favorite. Traditional Cretan dishes in beautiful courtyard.",
            "booking_url": "https://www.google.com/maps/search/Portes+Chania+Crete",
            "price": "$$"
        },
        {
            "name": "Erganos",
            "type": "Cretan Taverna",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Authentic family taverna in Heraklion. Excellent dakos, lamb, and local wine.",
            "booking_url": "https://www.google.com/maps/search/Erganos+Heraklion+Crete",
            "price": "$"
        }
    ],
    "cyprus": [
        {
            "name": "To Anamma",
            "type": "Cypriot Meze",
            "rating": 4.6,
            "reviews": 1800,
            "description": "Outstanding meze in Nicosia. Traditional Cypriot feast with endless small plates.",
            "booking_url": "https://www.google.com/maps/search/To+Anamma+Nicosia+Cyprus",
            "price": "$$"
        },
        {
            "name": "Ocean Basket",
            "type": "Seafood",
            "rating": 4.3,
            "reviews": 3200,
            "description": "Popular seafood chain with fresh Mediterranean catches. Great calamari and grilled fish.",
            "booking_url": "https://www.google.com/maps/search/Ocean+Basket+Cyprus",
            "price": "$$"
        },
        {
            "name": "Meze Taverna",
            "type": "Cypriot",
            "rating": 4.5,
            "reviews": 1500,
            "description": "Classic taverna in Paphos. Halloumi, kleftiko, and souvlaki done right.",
            "booking_url": "https://www.google.com/maps/search/Meze+Taverna+Paphos+Cyprus",
            "price": "$$"
        }
    ],
    "warsaw": [
        {
            "name": "Stary Dom",
            "type": "Polish",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Classic Polish cuisine in elegant old town setting. Excellent pierogi and bigos.",
            "booking_url": "https://www.google.com/maps/search/Stary+Dom+Warsaw",
            "price": "$$"
        },
        {
            "name": "Atelier Amaro",
            "type": "Modern Polish",
            "rating": 4.7,
            "reviews": 1200,
            "description": "Poland's first Michelin star. Chef Wojciech Amaro's innovative Polish cuisine.",
            "booking_url": "https://www.google.com/maps/search/Atelier+Amaro+Warsaw",
            "price": "$$$$"
        },
        {
            "name": "Bar Mleczny Prasowy",
            "type": "Polish Milk Bar",
            "rating": 4.3,
            "reviews": 2200,
            "description": "Classic milk bar (communist-era cafeteria). Authentic, cheap, and delicious Polish food.",
            "booking_url": "https://www.google.com/maps/search/Bar+Mleczny+Prasowy+Warsaw",
            "price": "$"
        }
    ],
    "krakow": [
        {
            "name": "Pod Aniolami",
            "type": "Polish",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Medieval cellar restaurant with traditional Polish cuisine. Excellent meat platters.",
            "booking_url": "https://www.google.com/maps/search/Pod+Aniolami+Krakow",
            "price": "$$"
        },
        {
            "name": "Starka",
            "type": "Polish Vodka Bar",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Vodka-focused restaurant in Kazimierz. Traditional dishes paired with house-infused vodkas.",
            "booking_url": "https://www.google.com/maps/search/Starka+Restaurant+Krakow",
            "price": "$$"
        },
        {
            "name": "Milkbar Tomasza",
            "type": "Polish Milk Bar",
            "rating": 4.4,
            "reviews": 3200,
            "description": "Hip milk bar in the Jewish quarter. Traditional Polish dishes at bargain prices.",
            "booking_url": "https://www.google.com/maps/search/Milkbar+Tomasza+Krakow",
            "price": "$"
        }
    ],
    "bucharest": [
        {
            "name": "Caru' cu Bere",
            "type": "Romanian",
            "rating": 4.4,
            "reviews": 15000,
            "description": "Stunning 1879 beer hall with Gothic interior. Traditional Romanian food in spectacular setting.",
            "booking_url": "https://www.google.com/maps/search/Caru+cu+Bere+Bucharest",
            "price": "$$"
        },
        {
            "name": "Lacrimi si Sfinti",
            "type": "Modern Romanian",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Contemporary Romanian cuisine in hidden courtyard. Creative takes on traditional recipes.",
            "booking_url": "https://www.google.com/maps/search/Lacrimi+si+Sfinti+Bucharest",
            "price": "$$$"
        },
        {
            "name": "La Mama",
            "type": "Romanian Traditional",
            "rating": 4.3,
            "reviews": 4500,
            "description": "Homestyle Romanian cooking. Generous portions of sarmale, mici, and other classics.",
            "booking_url": "https://www.google.com/maps/search/La+Mama+Restaurant+Bucharest",
            "price": "$$"
        }
    ],
    "clujnapoca": [
        {
            "name": "Baracca",
            "type": "Italian-Romanian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Popular spot with great pasta and local dishes. Lovely terrace in the city center.",
            "booking_url": "https://www.google.com/maps/search/Baracca+Cluj+Napoca",
            "price": "$$"
        },
        {
            "name": "Roata",
            "type": "Romanian",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Traditional Transylvanian cuisine in rustic setting. Excellent sausages and polenta.",
            "booking_url": "https://www.google.com/maps/search/Roata+Cluj+Napoca",
            "price": "$$"
        },
        {
            "name": "Samsara Foodhouse",
            "type": "International",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Creative brunch and all-day dining. Popular with locals and digital nomads alike.",
            "booking_url": "https://www.google.com/maps/search/Samsara+Foodhouse+Cluj+Napoca",
            "price": "$$"
        }
    ],
    "sofia": [
        {
            "name": "Shtastliveca",
            "type": "Bulgarian",
            "rating": 4.5,
            "reviews": 4500,
            "description": "Popular restaurant serving traditional Bulgarian dishes. Great shopska salad and grilled meats.",
            "booking_url": "https://www.google.com/maps/search/Shtastliveca+Sofia",
            "price": "$$"
        },
        {
            "name": "Made in Home",
            "type": "Bulgarian Fusion",
            "rating": 4.6,
            "reviews": 2200,
            "description": "Cozy spot with creative Bulgarian cuisine. Excellent brunch and homemade bread.",
            "booking_url": "https://www.google.com/maps/search/Made+in+Home+Sofia",
            "price": "$$"
        },
        {
            "name": "Hadjidraganov's Houses",
            "type": "Bulgarian Traditional",
            "rating": 4.4,
            "reviews": 3800,
            "description": "Beautiful restoration serving classic Bulgarian fare. Live folk music on weekends.",
            "booking_url": "https://www.google.com/maps/search/Hadjidraganovs+Houses+Sofia",
            "price": "$$"
        }
    ],
    "riga": [
        {
            "name": "Vincents",
            "type": "Fine Dining",
            "rating": 4.7,
            "reviews": 1500,
            "description": "Latvia's most acclaimed restaurant. Chef Martins Ritins' modern Latvian cuisine.",
            "booking_url": "https://www.google.com/maps/search/Vincents+Riga",
            "price": "$$$$"
        },
        {
            "name": "Folkklubs Ala Pagrabs",
            "type": "Latvian",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Traditional Latvian food with live folk music. Great for authentic local experience.",
            "booking_url": "https://www.google.com/maps/search/Folkklubs+Ala+Pagrabs+Riga",
            "price": "$$"
        },
        {
            "name": "Riga Central Market",
            "type": "Market",
            "rating": 4.5,
            "reviews": 6500,
            "description": "Europe's largest market in former Zeppelin hangars. Fresh produce, smoked fish, and local specialties.",
            "booking_url": "https://www.google.com/maps/search/Riga+Central+Market",
            "price": "$"
        }
    ],
    "vilnius": [
        {
            "name": "Ertlio Namas",
            "type": "Lithuanian",
            "rating": 4.6,
            "reviews": 1800,
            "description": "Fine dining in 16th century building. Elegant Lithuanian cuisine with modern touches.",
            "booking_url": "https://www.google.com/maps/search/Ertlio+Namas+Vilnius",
            "price": "$$$"
        },
        {
            "name": "Senoji Trobele",
            "type": "Traditional Lithuanian",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Cozy spot for traditional dishes. Excellent cepelinai and kugelis.",
            "booking_url": "https://www.google.com/maps/search/Senoji+Trobele+Vilnius",
            "price": "$$"
        },
        {
            "name": "Sweet Root",
            "type": "Modern Lithuanian",
            "rating": 4.7,
            "reviews": 900,
            "description": "Innovative tasting menus using foraged Lithuanian ingredients. Rising star of Baltic cuisine.",
            "booking_url": "https://www.google.com/maps/search/Sweet+Root+Vilnius",
            "price": "$$$"
        }
    ],
    "podgorica": [
        {
            "name": "Pod Volat",
            "type": "Montenegrin",
            "rating": 4.5,
            "reviews": 1200,
            "description": "Traditional Montenegrin cuisine with river views. Excellent grilled meats and local cheese.",
            "booking_url": "https://www.google.com/maps/search/Pod+Volat+Podgorica",
            "price": "$$"
        },
        {
            "name": "Lanterna",
            "type": "Mediterranean",
            "rating": 4.4,
            "reviews": 800,
            "description": "Popular spot for seafood and pasta. Pleasant terrace in the city center.",
            "booking_url": "https://www.google.com/maps/search/Lanterna+Restaurant+Podgorica",
            "price": "$$"
        },
        {
            "name": "Mihajlovic",
            "type": "Montenegrin Grill",
            "rating": 4.3,
            "reviews": 1500,
            "description": "Local favorite for grilled meats. No-frills setting but excellent cevapi and pljeskavica.",
            "booking_url": "https://www.google.com/maps/search/Mihajlovic+Podgorica",
            "price": "$"
        }
    ],
    "tirana": [
        {
            "name": "Mullixhiu",
            "type": "Albanian Fine Dining",
            "rating": 4.7,
            "reviews": 1500,
            "description": "Albania's most acclaimed restaurant. Traditional techniques with modern presentation.",
            "booking_url": "https://www.google.com/maps/search/Mullixhiu+Tirana",
            "price": "$$$"
        },
        {
            "name": "Oda",
            "type": "Albanian Traditional",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Authentic Albanian cuisine in historic house. Excellent tavë kosi and grilled lamb.",
            "booking_url": "https://www.google.com/maps/search/Oda+Restaurant+Tirana",
            "price": "$$"
        },
        {
            "name": "Era Vila",
            "type": "Albanian",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Garden restaurant with traditional dishes. Beautiful setting near the pyramid.",
            "booking_url": "https://www.google.com/maps/search/Era+Vila+Tirana",
            "price": "$$"
        }
    ],
    "sarajevo": [
        {
            "name": "Dveri",
            "type": "Bosnian",
            "rating": 4.6,
            "reviews": 2200,
            "description": "Traditional Bosnian restaurant in old town. Excellent cevapi and other local specialties.",
            "booking_url": "https://www.google.com/maps/search/Dveri+Sarajevo",
            "price": "$$"
        },
        {
            "name": "Cevabdzinica Zeljo",
            "type": "Bosnian Street Food",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Legendary cevapi spot since 1968. Small sausages in fresh bread - pure Sarajevo.",
            "booking_url": "https://www.google.com/maps/search/Zeljo+Cevabdzinica+Sarajevo",
            "price": "$"
        },
        {
            "name": "Park Princeva",
            "type": "Bosnian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Hillside restaurant with panoramic city views. Traditional dishes and great atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Park+Princeva+Sarajevo",
            "price": "$$"
        }
    ],
    "skopje": [
        {
            "name": "Dva Elena",
            "type": "Macedonian",
            "rating": 4.5,
            "reviews": 1500,
            "description": "Traditional Macedonian cuisine in the old bazaar. Great tavce gravce and grilled meats.",
            "booking_url": "https://www.google.com/maps/search/Dva+Elena+Skopje",
            "price": "$$"
        },
        {
            "name": "Pivnica An",
            "type": "Macedonian",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Historic beer hall with local dishes. Lively atmosphere in the old town.",
            "booking_url": "https://www.google.com/maps/search/Pivnica+An+Skopje",
            "price": "$$"
        },
        {
            "name": "Kaj Serdarot",
            "type": "Macedonian Traditional",
            "rating": 4.3,
            "reviews": 1200,
            "description": "Family-run spot with homestyle cooking. Authentic Macedonian experience.",
            "booking_url": "https://www.google.com/maps/search/Kaj+Serdarot+Skopje",
            "price": "$"
        }
    ],
    "yerevan": [
        {
            "name": "Dolmama",
            "type": "Armenian",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Armenia's most celebrated restaurant. Traditional dishes elevated with modern techniques.",
            "booking_url": "https://www.google.com/maps/search/Dolmama+Yerevan",
            "price": "$$$"
        },
        {
            "name": "Lavash",
            "type": "Armenian Traditional",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Excellent Armenian cuisine near Republic Square. Great khorovats and dolma.",
            "booking_url": "https://www.google.com/maps/search/Lavash+Restaurant+Yerevan",
            "price": "$$"
        },
        {
            "name": "Pandok Yerevan",
            "type": "Armenian",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Traditional tavern with live music. Hearty Armenian fare and excellent wine selection.",
            "booking_url": "https://www.google.com/maps/search/Pandok+Yerevan",
            "price": "$$"
        }
    ],
    "baku": [
        {
            "name": "Firuze",
            "type": "Azerbaijani",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Upscale Azerbaijani cuisine in the old city. Excellent plov and kebabs.",
            "booking_url": "https://www.google.com/maps/search/Firuze+Restaurant+Baku",
            "price": "$$$"
        },
        {
            "name": "Shirvanshah Museum Restaurant",
            "type": "Azerbaijani Traditional",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Historic setting near the palace. Traditional dishes with beautiful views.",
            "booking_url": "https://www.google.com/maps/search/Shirvanshah+Museum+Restaurant+Baku",
            "price": "$$"
        },
        {
            "name": "Dolma",
            "type": "Azerbaijani",
            "rating": 4.5,
            "reviews": 1500,
            "description": "Excellent local cuisine in modern setting. Wide variety of dolma and grilled meats.",
            "booking_url": "https://www.google.com/maps/search/Dolma+Restaurant+Baku",
            "price": "$$"
        }
    ],
    "batumi": [
        {
            "name": "Retro Restaurant",
            "type": "Georgian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Classic Georgian dishes in vintage-themed setting. Great khachapuri and khinkali.",
            "booking_url": "https://www.google.com/maps/search/Retro+Restaurant+Batumi",
            "price": "$$"
        },
        {
            "name": "Old Boulevard",
            "type": "Georgian Fusion",
            "rating": 4.4,
            "reviews": 1200,
            "description": "Seaside dining with Georgian and European dishes. Beautiful Black Sea views.",
            "booking_url": "https://www.google.com/maps/search/Old+Boulevard+Restaurant+Batumi",
            "price": "$$"
        },
        {
            "name": "Sanapiro",
            "type": "Georgian Traditional",
            "rating": 4.3,
            "reviews": 900,
            "description": "Local favorite for Adjarian cuisine. The Adjarian khachapuri here is exceptional.",
            "booking_url": "https://www.google.com/maps/search/Sanapiro+Batumi",
            "price": "$"
        }
    ],
    "antalya": [
        {
            "name": "7 Mehmet",
            "type": "Turkish",
            "rating": 4.6,
            "reviews": 3500,
            "description": "Legendary Antalya restaurant with panoramic views. Outstanding Turkish cuisine since 1970s.",
            "booking_url": "https://www.google.com/maps/search/7+Mehmet+Antalya",
            "price": "$$$"
        },
        {
            "name": "Vanilla Lounge",
            "type": "Mediterranean",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Rooftop dining in Kaleici old town. Creative Mediterranean dishes with sea views.",
            "booking_url": "https://www.google.com/maps/search/Vanilla+Lounge+Antalya",
            "price": "$$$"
        },
        {
            "name": "Seraser",
            "type": "Turkish Fine Dining",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Elegant Ottoman-style restaurant in historic district. Refined Turkish cuisine.",
            "booking_url": "https://www.google.com/maps/search/Seraser+Fine+Dining+Antalya",
            "price": "$$$"
        }
    ],
    "istanbul": [
        {
            "name": "Ciya Sofrasi",
            "type": "Turkish Regional",
            "rating": 4.6,
            "reviews": 8500,
            "description": "Legendary for rare Anatolian dishes. Chef Musa Dagdeviren's encyclopedic Turkish cuisine.",
            "booking_url": "https://www.google.com/maps/search/Ciya+Sofrasi+Istanbul",
            "price": "$$"
        },
        {
            "name": "Karakoy Lokantasi",
            "type": "Turkish",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Modern Turkish tavern in trendy Karakoy. Excellent mezes and daily specials.",
            "booking_url": "https://www.google.com/maps/search/Karakoy+Lokantasi+Istanbul",
            "price": "$$"
        },
        {
            "name": "Mikla",
            "type": "Modern Turkish",
            "rating": 4.7,
            "reviews": 3200,
            "description": "Rooftop fine dining with Bosphorus views. Chef Mehmet Gurs' Anatolian-Nordic cuisine.",
            "booking_url": "https://www.google.com/maps/search/Mikla+Istanbul",
            "price": "$$$$"
        }
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_3_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

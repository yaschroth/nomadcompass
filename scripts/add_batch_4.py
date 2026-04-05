#!/usr/bin/env python3
"""Add restaurant data for batch 4 (30 cities) - Asia, Scandinavia, more Europe."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_4_DATA = {
    "phuket": [
        {
            "name": "Suay Restaurant",
            "type": "Modern Thai",
            "rating": 4.6,
            "reviews": 2200,
            "description": "Chef Tammasak Chootong's creative Thai cuisine. Local ingredients with contemporary flair.",
            "booking_url": "https://www.google.com/maps/search/Suay+Restaurant+Phuket",
            "price": "$$$"
        },
        {
            "name": "Raya Restaurant",
            "type": "Southern Thai",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Legendary Phuket Town restaurant since 1953. Authentic southern Thai curries in charming Sino-Portuguese building.",
            "booking_url": "https://www.google.com/maps/search/Raya+Restaurant+Phuket",
            "price": "$$"
        },
        {
            "name": "Kan Eang @ Pier",
            "type": "Seafood",
            "rating": 4.4,
            "reviews": 4200,
            "description": "Waterfront seafood restaurant with stunning views. Fresh catches and classic Thai preparations.",
            "booking_url": "https://www.google.com/maps/search/Kan+Eang+Pier+Phuket",
            "price": "$$"
        }
    ],
    "kohphangan": [
        {
            "name": "Fisherman's Restaurant",
            "type": "Thai Seafood",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Beachfront dining with fresh daily catches. Romantic setting perfect for sunset dinners.",
            "booking_url": "https://www.google.com/maps/search/Fishermans+Restaurant+Koh+Phangan",
            "price": "$$"
        },
        {
            "name": "Pura Vida",
            "type": "International",
            "rating": 4.4,
            "reviews": 1200,
            "description": "Popular healthy spot in Srithanu. Great smoothie bowls, vegan options, and yoga vibes.",
            "booking_url": "https://www.google.com/maps/search/Pura+Vida+Koh+Phangan",
            "price": "$$"
        },
        {
            "name": "Thong Sala Night Market",
            "type": "Street Food",
            "rating": 4.5,
            "reviews": 2500,
            "description": "Saturday night market with incredible Thai street food. Best pad thai and grilled seafood on the island.",
            "booking_url": "https://www.google.com/maps/search/Thong+Sala+Night+Market+Koh+Phangan",
            "price": "$"
        }
    ],
    "ubud": [
        {
            "name": "Mozaic",
            "type": "French-Indonesian",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Chris Salans' pioneering fine dining. French techniques with Balinese ingredients in garden setting.",
            "booking_url": "https://www.google.com/maps/search/Mozaic+Ubud+Bali",
            "price": "$$$$"
        },
        {
            "name": "Warung Babi Guling Ibu Oka",
            "type": "Balinese",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Anthony Bourdain-approved suckling pig. The most famous babi guling in Bali.",
            "booking_url": "https://www.google.com/maps/search/Ibu+Oka+Ubud",
            "price": "$"
        },
        {
            "name": "Swept Away",
            "type": "International",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Romantic riverside dining at The Samaya. Creative cuisine suspended over the Ayung River.",
            "booking_url": "https://www.google.com/maps/search/Swept+Away+Ubud",
            "price": "$$$"
        }
    ],
    "sanmigueldeallende": [
        {
            "name": "Moxi",
            "type": "Modern Mexican",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Hotel Matilda's celebrated restaurant. Chef Enrique Olvera's refined Mexican cuisine.",
            "booking_url": "https://www.google.com/maps/search/Moxi+San+Miguel+de+Allende",
            "price": "$$$$"
        },
        {
            "name": "The Restaurant",
            "type": "Farm-to-Table",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Donnie Masterton's farm-to-table pioneer. Local ingredients in stunning rooftop setting.",
            "booking_url": "https://www.google.com/maps/search/The+Restaurant+San+Miguel+de+Allende",
            "price": "$$$"
        },
        {
            "name": "Tio Lucas",
            "type": "Mexican Grill",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Local favorite for grilled meats. Excellent arrachera and traditional Mexican dishes.",
            "booking_url": "https://www.google.com/maps/search/Tio+Lucas+San+Miguel+de+Allende",
            "price": "$$"
        }
    ],
    "merida": [
        {
            "name": "La Chaya Maya",
            "type": "Yucatecan",
            "rating": 4.5,
            "reviews": 6500,
            "description": "Best introduction to Yucatecan cuisine. Poc chuc, papadzules, and sopa de lima done right.",
            "booking_url": "https://www.google.com/maps/search/La+Chaya+Maya+Merida",
            "price": "$$"
        },
        {
            "name": "Apoala",
            "type": "Modern Mexican",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Upscale Mexican in colonial courtyard. Creative takes on Oaxacan and Yucatecan dishes.",
            "booking_url": "https://www.google.com/maps/search/Apoala+Merida",
            "price": "$$$"
        },
        {
            "name": "Mercado Lucas de Galvez",
            "type": "Market Food",
            "rating": 4.4,
            "reviews": 3200,
            "description": "Merida's main market. Cheap eats, fresh produce, and authentic local atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Mercado+Lucas+de+Galvez+Merida",
            "price": "$"
        }
    ],
    "hongkong": [
        {
            "name": "Tim Ho Wan",
            "type": "Dim Sum",
            "rating": 4.5,
            "reviews": 15000,
            "description": "World's cheapest Michelin star. Famous for baked BBQ pork buns at unbeatable prices.",
            "booking_url": "https://www.google.com/maps/search/Tim+Ho+Wan+Hong+Kong",
            "price": "$"
        },
        {
            "name": "Yung Kee",
            "type": "Cantonese",
            "rating": 4.4,
            "reviews": 5500,
            "description": "Hong Kong institution since 1942. Legendary roast goose and century eggs.",
            "booking_url": "https://www.google.com/maps/search/Yung+Kee+Hong+Kong",
            "price": "$$$"
        },
        {
            "name": "The Chairman",
            "type": "Modern Cantonese",
            "rating": 4.7,
            "reviews": 2800,
            "description": "Asia's Best Restaurant 2021. Elevated Cantonese using finest Hong Kong ingredients.",
            "booking_url": "https://www.google.com/maps/search/The+Chairman+Hong+Kong",
            "price": "$$$$"
        }
    ],
    "copenhagen": [
        {
            "name": "Noma",
            "type": "New Nordic",
            "rating": 4.8,
            "reviews": 3500,
            "description": "Four-time World's Best Restaurant. Rene Redzepi's legendary New Nordic cuisine.",
            "booking_url": "https://www.google.com/maps/search/Noma+Copenhagen",
            "price": "$$$$"
        },
        {
            "name": "Reffen",
            "type": "Street Food Market",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Copenhagen's largest street food market. Diverse stalls from tacos to Thai on the harbor.",
            "booking_url": "https://www.google.com/maps/search/Reffen+Copenhagen",
            "price": "$$"
        },
        {
            "name": "Gasoline Grill",
            "type": "Burgers",
            "rating": 4.6,
            "reviews": 4200,
            "description": "Cult burger joint in former gas station. Simple, perfect burgers that draw massive queues.",
            "booking_url": "https://www.google.com/maps/search/Gasoline+Grill+Copenhagen",
            "price": "$"
        }
    ],
    "stockholm": [
        {
            "name": "Ekstedt",
            "type": "Nordic",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Michelin-starred cooking over open fire. Chef Niklas Ekstedt's primal Nordic cuisine.",
            "booking_url": "https://www.google.com/maps/search/Ekstedt+Stockholm",
            "price": "$$$$"
        },
        {
            "name": "Pelikan",
            "type": "Swedish Traditional",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Classic Swedish beer hall since 1904. Traditional husmanskost in stunning art nouveau interior.",
            "booking_url": "https://www.google.com/maps/search/Pelikan+Stockholm",
            "price": "$$"
        },
        {
            "name": "Meatballs for the People",
            "type": "Swedish",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Gourmet meatballs in every variety. Swedish comfort food elevated to an art form.",
            "booking_url": "https://www.google.com/maps/search/Meatballs+for+the+People+Stockholm",
            "price": "$$"
        }
    ],
    "oslo": [
        {
            "name": "Maaemo",
            "type": "Nordic Fine Dining",
            "rating": 4.8,
            "reviews": 1500,
            "description": "Three Michelin stars showcasing Norwegian terroir. One of Scandinavia's best restaurants.",
            "booking_url": "https://www.google.com/maps/search/Maaemo+Oslo",
            "price": "$$$$"
        },
        {
            "name": "Mathallen",
            "type": "Food Hall",
            "rating": 4.4,
            "reviews": 5500,
            "description": "Oslo's premier food hall. Nordic specialties, coffee, and diverse cuisines under one roof.",
            "booking_url": "https://www.google.com/maps/search/Mathallen+Oslo",
            "price": "$$"
        },
        {
            "name": "Fiskeriet Youngstorget",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Fresh Norwegian seafood at market prices. Excellent fish soup and fish and chips.",
            "booking_url": "https://www.google.com/maps/search/Fiskeriet+Youngstorget+Oslo",
            "price": "$$"
        }
    ],
    "helsinki": [
        {
            "name": "Olo",
            "type": "Nordic Fine Dining",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Michelin-starred modern Finnish cuisine. Seasonal tasting menus with Baltic inspiration.",
            "booking_url": "https://www.google.com/maps/search/Olo+Restaurant+Helsinki",
            "price": "$$$$"
        },
        {
            "name": "Old Market Hall",
            "type": "Food Market",
            "rating": 4.5,
            "reviews": 4500,
            "description": "Historic 1889 market hall. Finnish specialties from reindeer to salmon to Karelian pies.",
            "booking_url": "https://www.google.com/maps/search/Old+Market+Hall+Helsinki",
            "price": "$$"
        },
        {
            "name": "Ravintola Savotta",
            "type": "Finnish Traditional",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Hearty Finnish cuisine in rustic lodge setting. Game meats, forest berries, and traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/Ravintola+Savotta+Helsinki",
            "price": "$$$"
        }
    ],
    "reykjavik": [
        {
            "name": "Dill",
            "type": "New Nordic",
            "rating": 4.7,
            "reviews": 1500,
            "description": "Iceland's only Michelin star. Seasonal Icelandic ingredients in innovative tasting menus.",
            "booking_url": "https://www.google.com/maps/search/Dill+Restaurant+Reykjavik",
            "price": "$$$$"
        },
        {
            "name": "Baejarins Beztu",
            "type": "Hot Dogs",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Iceland's most famous hot dog stand since 1937. Bill Clinton approved.",
            "booking_url": "https://www.google.com/maps/search/Baejarins+Beztu+Pylsur+Reykjavik",
            "price": "$"
        },
        {
            "name": "Grillid",
            "type": "Icelandic Fine Dining",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Panoramic views from the Saga Hotel. Refined Icelandic cuisine with spectacular setting.",
            "booking_url": "https://www.google.com/maps/search/Grillid+Reykjavik",
            "price": "$$$$"
        }
    ],
    "brussels": [
        {
            "name": "Aux Armes de Bruxelles",
            "type": "Belgian",
            "rating": 4.3,
            "reviews": 6500,
            "description": "Classic Belgian brasserie since 1921. Traditional moules-frites and waterzooi.",
            "booking_url": "https://www.google.com/maps/search/Aux+Armes+de+Bruxelles",
            "price": "$$"
        },
        {
            "name": "Chez Leon",
            "type": "Belgian",
            "rating": 4.2,
            "reviews": 8500,
            "description": "Brussels mussels institution since 1893. Multiple floors of Belgian classics.",
            "booking_url": "https://www.google.com/maps/search/Chez+Leon+Brussels",
            "price": "$$"
        },
        {
            "name": "Fritland",
            "type": "Belgian Fries",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Best frites in Brussels. Double-fried perfection with countless sauce options.",
            "booking_url": "https://www.google.com/maps/search/Fritland+Brussels",
            "price": "$"
        }
    ],
    "ljubljana": [
        {
            "name": "Hiša Franko",
            "type": "Slovenian Fine Dining",
            "rating": 4.8,
            "reviews": 1800,
            "description": "Ana Ros's World's Best Female Chef restaurant. Two Michelin stars in the Soca Valley.",
            "booking_url": "https://www.google.com/maps/search/Hisa+Franko+Slovenia",
            "price": "$$$$"
        },
        {
            "name": "Gostilna As",
            "type": "Slovenian",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Excellent Slovenian cuisine near Triple Bridge. Great struklji and local wines.",
            "booking_url": "https://www.google.com/maps/search/Gostilna+As+Ljubljana",
            "price": "$$"
        },
        {
            "name": "Open Kitchen (Odprta Kuhna)",
            "type": "Street Food Market",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Friday street food market in Pogacarjev Square. Local chefs' stalls and great atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Odprta+Kuhna+Ljubljana",
            "price": "$$"
        }
    ],
    "zagreb": [
        {
            "name": "Vinodol",
            "type": "Croatian",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Elegant Croatian dining since 1990. Beautiful covered terrace and traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/Vinodol+Zagreb",
            "price": "$$"
        },
        {
            "name": "Noel",
            "type": "Modern Croatian",
            "rating": 4.7,
            "reviews": 1200,
            "description": "Michelin-starred modern Croatian cuisine. Chef's creative interpretations of local traditions.",
            "booking_url": "https://www.google.com/maps/search/Noel+Restaurant+Zagreb",
            "price": "$$$$"
        },
        {
            "name": "Dolac Market",
            "type": "Market",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Zagreb's main farmers market since 1930. Fresh produce, cheese, and quick bites.",
            "booking_url": "https://www.google.com/maps/search/Dolac+Market+Zagreb",
            "price": "$"
        }
    ],
    "dubrovnik": [
        {
            "name": "Nautika",
            "type": "Mediterranean Fine Dining",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Spectacular fortress-wall location. Fresh Adriatic seafood with stunning sea views.",
            "booking_url": "https://www.google.com/maps/search/Nautika+Restaurant+Dubrovnik",
            "price": "$$$$"
        },
        {
            "name": "Azur",
            "type": "Asian-Mediterranean",
            "rating": 4.6,
            "reviews": 2500,
            "description": "Fusion flavors in the old town. Creative Asian-Dalmatian dishes on hidden terrace.",
            "booking_url": "https://www.google.com/maps/search/Azur+Dubrovnik",
            "price": "$$$"
        },
        {
            "name": "Konoba Ribar",
            "type": "Croatian Seafood",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Authentic konoba in Gruz harbor. Fresh-off-the-boat seafood at local prices.",
            "booking_url": "https://www.google.com/maps/search/Konoba+Ribar+Dubrovnik",
            "price": "$$"
        }
    ],
    "gdansk": [
        {
            "name": "Restauracja Kubicki",
            "type": "Polish",
            "rating": 4.5,
            "reviews": 1800,
            "description": "One of Poland's oldest restaurants. Traditional Polish and Gdansk cuisine since 1918.",
            "booking_url": "https://www.google.com/maps/search/Restauracja+Kubicki+Gdansk",
            "price": "$$"
        },
        {
            "name": "Metamorfoza",
            "type": "Modern Polish",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Creative Polish cuisine in old town. Fresh Baltic fish and innovative presentations.",
            "booking_url": "https://www.google.com/maps/search/Metamorfoza+Gdansk",
            "price": "$$$"
        },
        {
            "name": "Bar Mleczny Neptun",
            "type": "Polish Milk Bar",
            "rating": 4.3,
            "reviews": 2500,
            "description": "Classic milk bar experience. Cheap, filling Polish comfort food in retro setting.",
            "booking_url": "https://www.google.com/maps/search/Bar+Mleczny+Neptun+Gdansk",
            "price": "$"
        }
    ],
    "wroclaw": [
        {
            "name": "Bernard",
            "type": "Polish",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Excellent Polish cuisine in market square. Great pierogi and zurek in beautiful cellar.",
            "booking_url": "https://www.google.com/maps/search/Bernard+Restaurant+Wroclaw",
            "price": "$$"
        },
        {
            "name": "Konspira",
            "type": "Polish Fusion",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Hidden speakeasy-style restaurant. Creative Polish dishes with great cocktails.",
            "booking_url": "https://www.google.com/maps/search/Konspira+Wroclaw",
            "price": "$$$"
        },
        {
            "name": "Pierogarnia Stary Mlyn",
            "type": "Polish Pierogi",
            "rating": 4.4,
            "reviews": 3200,
            "description": "Pierogi specialist near the cathedral. Dozens of varieties from sweet to savory.",
            "booking_url": "https://www.google.com/maps/search/Pierogarnia+Stary+Mlyn+Wroclaw",
            "price": "$"
        }
    ],
    "brno": [
        {
            "name": "Koishi",
            "type": "Japanese Fusion",
            "rating": 4.6,
            "reviews": 1800,
            "description": "Outstanding Japanese-Czech fusion. Creative dishes with excellent cocktails.",
            "booking_url": "https://www.google.com/maps/search/Koishi+Brno",
            "price": "$$$"
        },
        {
            "name": "Borgo Agnese",
            "type": "Italian-Czech",
            "rating": 4.5,
            "reviews": 1200,
            "description": "Local favorite in the city center. Great pasta and Czech wines.",
            "booking_url": "https://www.google.com/maps/search/Borgo+Agnese+Brno",
            "price": "$$"
        },
        {
            "name": "Pivnice Pegas",
            "type": "Czech",
            "rating": 4.4,
            "reviews": 2500,
            "description": "Historic microbrewery restaurant. Traditional Czech dishes with house-brewed beer.",
            "booking_url": "https://www.google.com/maps/search/Pivnice+Pegas+Brno",
            "price": "$$"
        }
    ],
    "rotterdam": [
        {
            "name": "FG Restaurant",
            "type": "Fine Dining",
            "rating": 4.7,
            "reviews": 1500,
            "description": "Two Michelin stars in a former railway station. Chef Francois Geurds' creative cuisine.",
            "booking_url": "https://www.google.com/maps/search/FG+Restaurant+Rotterdam",
            "price": "$$$$"
        },
        {
            "name": "Markthal",
            "type": "Food Hall",
            "rating": 4.4,
            "reviews": 12000,
            "description": "Iconic horseshoe-shaped food hall. Dozens of vendors under stunning painted ceiling.",
            "booking_url": "https://www.google.com/maps/search/Markthal+Rotterdam",
            "price": "$$"
        },
        {
            "name": "Hotel New York",
            "type": "Dutch",
            "rating": 4.3,
            "reviews": 3500,
            "description": "Historic Holland-America Line building. Grand cafe with harbor views and Dutch classics.",
            "booking_url": "https://www.google.com/maps/search/Hotel+New+York+Rotterdam",
            "price": "$$$"
        }
    ],
    "utrecht": [
        {
            "name": "Karel V",
            "type": "Fine Dining",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Michelin-starred dining in historic hotel. French-Dutch cuisine in medieval chapel setting.",
            "booking_url": "https://www.google.com/maps/search/Karel+V+Restaurant+Utrecht",
            "price": "$$$$"
        },
        {
            "name": "Cafe Olivier",
            "type": "Belgian-Dutch",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Atmospheric restaurant in former church. Great Belgian beers and brasserie fare.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Olivier+Utrecht",
            "price": "$$"
        },
        {
            "name": "De Rechtbank",
            "type": "International",
            "rating": 4.5,
            "reviews": 1500,
            "description": "Popular spot in former courthouse. Excellent brunch and creative dinner menu.",
            "booking_url": "https://www.google.com/maps/search/De+Rechtbank+Utrecht",
            "price": "$$"
        }
    ],
    "faro": [
        {
            "name": "Faz Gostos",
            "type": "Portuguese",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Excellent Algarve cuisine in the old town. Fresh fish and traditional cataplana.",
            "booking_url": "https://www.google.com/maps/search/Faz+Gostos+Faro",
            "price": "$$$"
        },
        {
            "name": "Restaurante Ria Formosa",
            "type": "Seafood",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Fresh seafood overlooking the lagoon. Grilled fish and local oysters.",
            "booking_url": "https://www.google.com/maps/search/Restaurante+Ria+Formosa+Faro",
            "price": "$$"
        },
        {
            "name": "A Venda",
            "type": "Portuguese Tapas",
            "rating": 4.3,
            "reviews": 1500,
            "description": "Cozy petiscos spot in downtown. Small plates and excellent Portuguese wines.",
            "booking_url": "https://www.google.com/maps/search/A+Venda+Faro",
            "price": "$$"
        }
    ],
    "hamburg": [
        {
            "name": "The Table",
            "type": "Fine Dining",
            "rating": 4.8,
            "reviews": 1200,
            "description": "Three Michelin stars from Kevin Fehling. One of Germany's best restaurants.",
            "booking_url": "https://www.google.com/maps/search/The+Table+Kevin+Fehling+Hamburg",
            "price": "$$$$"
        },
        {
            "name": "Fischmarkt",
            "type": "Fish Market",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Famous Sunday morning market since 1703. Fresh fish, street food, and lively atmosphere.",
            "booking_url": "https://www.google.com/maps/search/Fischmarkt+Hamburg",
            "price": "$"
        },
        {
            "name": "Bullerei",
            "type": "German Modern",
            "rating": 4.4,
            "reviews": 4500,
            "description": "Tim Malzer's popular restaurant in former slaughterhouse. Excellent steaks and burgers.",
            "booking_url": "https://www.google.com/maps/search/Bullerei+Hamburg",
            "price": "$$$"
        }
    ],
    "cork": [
        {
            "name": "Ichigo Ichie",
            "type": "Japanese",
            "rating": 4.7,
            "reviews": 1200,
            "description": "Ireland's only Michelin-starred Japanese. Takashi Miyazaki's kaiseki using Irish ingredients.",
            "booking_url": "https://www.google.com/maps/search/Ichigo+Ichie+Cork",
            "price": "$$$$"
        },
        {
            "name": "English Market",
            "type": "Food Market",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Historic covered market since 1788. The best of Irish produce, cheeses, and prepared foods.",
            "booking_url": "https://www.google.com/maps/search/English+Market+Cork",
            "price": "$$"
        },
        {
            "name": "Jacobs on the Mall",
            "type": "Modern Irish",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Contemporary Irish cuisine in former Turkish baths. Excellent local ingredients.",
            "booking_url": "https://www.google.com/maps/search/Jacobs+on+the+Mall+Cork",
            "price": "$$$"
        }
    ],
    "antwerp": [
        {
            "name": "The Jane",
            "type": "Fine Dining",
            "rating": 4.6,
            "reviews": 2500,
            "description": "Two Michelin stars in stunning church setting. Nick Bril's rock-and-roll fine dining.",
            "booking_url": "https://www.google.com/maps/search/The+Jane+Antwerp",
            "price": "$$$$"
        },
        {
            "name": "Frites Atelier",
            "type": "Belgian Fries",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Sergio Herman's gourmet frites. Perfect Belgian fries with creative toppings.",
            "booking_url": "https://www.google.com/maps/search/Frites+Atelier+Antwerp",
            "price": "$$"
        },
        {
            "name": "De Bomma",
            "type": "Belgian",
            "rating": 4.4,
            "reviews": 2200,
            "description": "Grandma-style Flemish cooking. Stoofvlees and other Belgian classics done with love.",
            "booking_url": "https://www.google.com/maps/search/De+Bomma+Antwerp",
            "price": "$$"
        }
    ],
    "ghent": [
        {
            "name": "Publiek",
            "type": "Modern Belgian",
            "rating": 4.6,
            "reviews": 1500,
            "description": "Michelin-starred creative Belgian cuisine. Excellent value for quality.",
            "booking_url": "https://www.google.com/maps/search/Publiek+Ghent",
            "price": "$$$"
        },
        {
            "name": "De Vitrine",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 1200,
            "description": "Outstanding seafood in simple setting. Daily fresh catches prepared with finesse.",
            "booking_url": "https://www.google.com/maps/search/De+Vitrine+Ghent",
            "price": "$$"
        },
        {
            "name": "Balls & Glory",
            "type": "Belgian Comfort Food",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Belgian meatballs elevated. Creative flavors from Wout Bru in casual setting.",
            "booking_url": "https://www.google.com/maps/search/Balls+and+Glory+Ghent",
            "price": "$$"
        }
    ],
    "osaka": [
        {
            "name": "Dotonbori Area",
            "type": "Street Food",
            "rating": 4.6,
            "reviews": 25000,
            "description": "Japan's kitchen - neon-lit food paradise. Takoyaki, okonomiyaki, and kushikatsu galore.",
            "booking_url": "https://www.google.com/maps/search/Dotonbori+Osaka",
            "price": "$"
        },
        {
            "name": "Mizuno",
            "type": "Okonomiyaki",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Legendary okonomiyaki since 1945. The fluffy yam-based version is worth the queue.",
            "booking_url": "https://www.google.com/maps/search/Mizuno+Okonomiyaki+Osaka",
            "price": "$$"
        },
        {
            "name": "Hajime",
            "type": "Japanese Fine Dining",
            "rating": 4.8,
            "reviews": 800,
            "description": "Three Michelin stars with artistic presentation. Chef Hajime Yoneda's innovative cuisine.",
            "booking_url": "https://www.google.com/maps/search/Hajime+Restaurant+Osaka",
            "price": "$$$$"
        }
    ],
    "kyoto": [
        {
            "name": "Kikunoi",
            "type": "Kaiseki",
            "rating": 4.8,
            "reviews": 1800,
            "description": "Three Michelin stars for traditional kaiseki. The pinnacle of Kyoto's refined cuisine.",
            "booking_url": "https://www.google.com/maps/search/Kikunoi+Kyoto",
            "price": "$$$$"
        },
        {
            "name": "Nishiki Market",
            "type": "Food Market",
            "rating": 4.5,
            "reviews": 18000,
            "description": "Kyoto's kitchen for 400 years. Pickles, tofu, sweets, and seasonal specialties.",
            "booking_url": "https://www.google.com/maps/search/Nishiki+Market+Kyoto",
            "price": "$$"
        },
        {
            "name": "Gion Karyo",
            "type": "Kyoto Cuisine",
            "rating": 4.6,
            "reviews": 1200,
            "description": "Elegant Kyoto-style dining in Gion. Beautiful seasonal courses in traditional setting.",
            "booking_url": "https://www.google.com/maps/search/Gion+Karyo+Kyoto",
            "price": "$$$"
        }
    ],
    "busan": [
        {
            "name": "Jagalchi Market",
            "type": "Seafood Market",
            "rating": 4.5,
            "reviews": 12000,
            "description": "Korea's largest seafood market. Pick your fish and have it prepared fresh upstairs.",
            "booking_url": "https://www.google.com/maps/search/Jagalchi+Market+Busan",
            "price": "$$"
        },
        {
            "name": "BIFF Square Street Food",
            "type": "Korean Street Food",
            "rating": 4.4,
            "reviews": 5500,
            "description": "Legendary hotteok and street food alley. Korean sweet pancakes and endless snacks.",
            "booking_url": "https://www.google.com/maps/search/BIFF+Square+Busan",
            "price": "$"
        },
        {
            "name": "Donsadon",
            "type": "Korean BBQ",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Excellent samgyeopsal (pork belly) BBQ. Local favorite in Seomyeon area.",
            "booking_url": "https://www.google.com/maps/search/Donsadon+Busan",
            "price": "$$"
        }
    ],
    "fukuoka": [
        {
            "name": "Yatai Stalls",
            "type": "Street Food",
            "rating": 4.5,
            "reviews": 8500,
            "description": "Fukuoka's famous outdoor food stalls. Hakata ramen, yakitori, and oden by the river.",
            "booking_url": "https://www.google.com/maps/search/Yatai+Stalls+Fukuoka",
            "price": "$"
        },
        {
            "name": "Shin Shin Ramen",
            "type": "Ramen",
            "rating": 4.5,
            "reviews": 3200,
            "description": "One of Fukuoka's best for Hakata tonkotsu ramen. Creamy pork broth perfection.",
            "booking_url": "https://www.google.com/maps/search/Shin+Shin+Ramen+Fukuoka",
            "price": "$"
        },
        {
            "name": "Kawabata Shopping Arcade",
            "type": "Food Street",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Historic covered arcade with food stalls. Great for mentaiko, mochi, and local snacks.",
            "booking_url": "https://www.google.com/maps/search/Kawabata+Shopping+Arcade+Fukuoka",
            "price": "$"
        }
    ],
    "kochi": [
        {
            "name": "Kayees Rahmathulla Hotel",
            "type": "Kerala",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Legendary biryani spot since 1948. The Malabar biryani here is exceptional.",
            "booking_url": "https://www.google.com/maps/search/Kayees+Rahmathulla+Hotel+Kochi",
            "price": "$"
        },
        {
            "name": "Fusion Bay",
            "type": "Seafood",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Fresh Kerala seafood with harbor views. Great karimeen fry and fish curries.",
            "booking_url": "https://www.google.com/maps/search/Fusion+Bay+Kochi",
            "price": "$$"
        },
        {
            "name": "Fort House Restaurant",
            "type": "Kerala",
            "rating": 4.3,
            "reviews": 2500,
            "description": "Waterfront dining in Fort Kochi. Traditional Kerala dishes with Chinese fishing net views.",
            "booking_url": "https://www.google.com/maps/search/Fort+House+Restaurant+Kochi",
            "price": "$$"
        }
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_4_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

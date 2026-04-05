#!/usr/bin/env python3
"""Add restaurant data for batch 1 (30 cities)."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

# Curated restaurant data for batch 1
BATCH_1_DATA = {
    "split": [
        {
            "name": "Villa Spiza",
            "type": "Croatian",
            "rating": 4.7,
            "reviews": 3200,
            "description": "Tiny gem in Diocletian's Palace serving daily-changing Croatian comfort food. No menu - just whatever's fresh that day.",
            "booking_url": "https://www.google.com/maps/search/Villa+Spiza+Split",
            "price": "$$"
        },
        {
            "name": "Konoba Marjan",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Family-run spot near Marjan Hill with stunning Adriatic seafood. Try the black risotto and grilled fish.",
            "booking_url": "https://www.google.com/maps/search/Konoba+Marjan+Split",
            "price": "$$"
        },
        {
            "name": "Uje Oil Bar",
            "type": "Mediterranean",
            "rating": 4.6,
            "reviews": 2500,
            "description": "Olive oil-focused restaurant showcasing Croatian oils and local ingredients. Creative Mediterranean dishes in historic setting.",
            "booking_url": "https://www.google.com/maps/search/Uje+Oil+Bar+Split",
            "price": "$$"
        }
    ],
    "playadelcarmen": [
        {
            "name": "Alux Restaurant",
            "type": "Mexican Fine Dining",
            "rating": 4.6,
            "reviews": 4500,
            "description": "Extraordinary dining inside a natural cenote cave. Upscale Mexican cuisine in one of the most unique settings on Earth.",
            "booking_url": "https://www.google.com/maps/search/Alux+Restaurant+Playa+del+Carmen",
            "price": "$$$"
        },
        {
            "name": "El Fogon",
            "type": "Mexican",
            "rating": 4.5,
            "reviews": 6000,
            "description": "Authentic Yucatecan tacos and local favorites. The al pastor and cochinita pibil are legendary among locals.",
            "booking_url": "https://www.google.com/maps/search/El+Fogon+Playa+del+Carmen",
            "price": "$"
        },
        {
            "name": "La Cueva del Chango",
            "type": "Mexican Breakfast",
            "rating": 4.4,
            "reviews": 3800,
            "description": "Jungle-like garden setting perfect for brunch. Organic Mexican dishes with fresh juices and excellent coffee.",
            "booking_url": "https://www.google.com/maps/search/La+Cueva+del+Chango+Playa+del+Carmen",
            "price": "$$"
        }
    ],
    "kualalumpur": [
        {
            "name": "Jalan Alor",
            "type": "Street Food",
            "rating": 4.5,
            "reviews": 12000,
            "description": "KL's most famous food street with dozens of hawker stalls. Must-try char kway teow, satay, and grilled wings.",
            "booking_url": "https://www.google.com/maps/search/Jalan+Alor+Kuala+Lumpur",
            "price": "$"
        },
        {
            "name": "Dewakan",
            "type": "Modern Malaysian",
            "rating": 4.8,
            "reviews": 1500,
            "description": "Malaysia's first restaurant on Asia's 50 Best list. Chef Darren Teoh showcases indigenous Malaysian ingredients.",
            "booking_url": "https://www.google.com/maps/search/Dewakan+Kuala+Lumpur",
            "price": "$$$$"
        },
        {
            "name": "Village Park Restaurant",
            "type": "Malaysian",
            "rating": 4.6,
            "reviews": 8000,
            "description": "Famous for arguably KL's best nasi lemak. The crispy fried chicken with sambal is worth the queue.",
            "booking_url": "https://www.google.com/maps/search/Village+Park+Restaurant+Kuala+Lumpur",
            "price": "$"
        }
    ],
    "hochiminhcity": [
        {
            "name": "The Lunch Lady",
            "type": "Vietnamese Street Food",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Featured on Anthony Bourdain's show. A different noodle soup each day of the week, cooked by the legendary Nguyen Thi Thanh.",
            "booking_url": "https://www.google.com/maps/search/The+Lunch+Lady+Ho+Chi+Minh+City",
            "price": "$"
        },
        {
            "name": "Anan Saigon",
            "type": "Modern Vietnamese",
            "rating": 4.6,
            "reviews": 3200,
            "description": "Chef Peter Cuong Franklin's celebration of Vietnamese street food, elevated. Try the famous pho French dip.",
            "booking_url": "https://www.google.com/maps/search/Anan+Saigon+Ho+Chi+Minh+City",
            "price": "$$$"
        },
        {
            "name": "Banh Mi Huynh Hoa",
            "type": "Vietnamese Sandwich",
            "rating": 4.7,
            "reviews": 9000,
            "description": "The most famous banh mi in Saigon. Overflowing with pate, cold cuts, and pickled vegetables. Always a queue.",
            "booking_url": "https://www.google.com/maps/search/Banh+Mi+Huynh+Hoa+Ho+Chi+Minh+City",
            "price": "$"
        }
    ],
    "porto": [
        {
            "name": "Cantinho do Avillez",
            "type": "Modern Portuguese",
            "rating": 4.6,
            "reviews": 4200,
            "description": "Celebrity chef Jose Avillez's Porto outpost. Creative Portuguese tapas in a charming riverside setting.",
            "booking_url": "https://www.google.com/maps/search/Cantinho+do+Avillez+Porto",
            "price": "$$"
        },
        {
            "name": "Cafe Santiago",
            "type": "Portuguese",
            "rating": 4.5,
            "reviews": 7500,
            "description": "Home of Porto's most famous francesinha - the legendary meat sandwich drowned in cheese and spicy sauce.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Santiago+Porto",
            "price": "$$"
        },
        {
            "name": "Flor dos Congregados",
            "type": "Traditional Portuguese",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Old-school tasca with traditional Porto dishes. Excellent caldo verde, tripas, and other northern specialties.",
            "booking_url": "https://www.google.com/maps/search/Flor+dos+Congregados+Porto",
            "price": "$"
        }
    ],
    "belgrade": [
        {
            "name": "Question Mark (Znak Pitanja)",
            "type": "Serbian",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Belgrade's oldest tavern from 1823. Traditional Serbian cuisine with rakija in a historic setting near the cathedral.",
            "booking_url": "https://www.google.com/maps/search/Question+Mark+Znak+Pitanja+Belgrade",
            "price": "$$"
        },
        {
            "name": "Dva Jelena",
            "type": "Serbian Traditional",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Iconic restaurant in bohemian Skadarlija street. Live traditional music and hearty Serbian dishes since 1832.",
            "booking_url": "https://www.google.com/maps/search/Dva+Jelena+Belgrade",
            "price": "$$"
        },
        {
            "name": "Ambar",
            "type": "Balkan",
            "rating": 4.4,
            "reviews": 4200,
            "description": "Modern take on Balkan cuisine with unlimited small plates concept. Great river views and excellent rakija selection.",
            "booking_url": "https://www.google.com/maps/search/Ambar+Belgrade",
            "price": "$$"
        }
    ],
    "laspalmas": [
        {
            "name": "El Herrero",
            "type": "Spanish Tapas",
            "rating": 4.6,
            "reviews": 2100,
            "description": "Legendary local tapas bar in Vegueta. Old-school atmosphere with excellent ham, cheese, and classic Spanish dishes.",
            "booking_url": "https://www.google.com/maps/search/El+Herrero+Las+Palmas",
            "price": "$"
        },
        {
            "name": "Deliciosa Marta",
            "type": "Canarian Fusion",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Creative Canarian cuisine in a beautiful courtyard. Fresh seafood and innovative takes on traditional island dishes.",
            "booking_url": "https://www.google.com/maps/search/Deliciosa+Marta+Las+Palmas",
            "price": "$$$"
        },
        {
            "name": "La Barra de Juan",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 1500,
            "description": "Fresh catch prepared simply. Popular with locals for fried fish, papas arrugadas, and ocean-to-table quality.",
            "booking_url": "https://www.google.com/maps/search/La+Barra+de+Juan+Las+Palmas",
            "price": "$$"
        }
    ],
    "oaxaca": [
        {
            "name": "Los Danzantes",
            "type": "Modern Oaxacan",
            "rating": 4.6,
            "reviews": 3500,
            "description": "Upscale Oaxacan cuisine in a stunning courtyard. Famous for mole negro and extensive mezcal selection.",
            "booking_url": "https://www.google.com/maps/search/Los+Danzantes+Oaxaca",
            "price": "$$$"
        },
        {
            "name": "Mercado 20 de Noviembre",
            "type": "Mexican Market",
            "rating": 4.7,
            "reviews": 8000,
            "description": "Legendary food market with smoky grilled meats. Pick your meat at the butchers and have it grilled at the pasillo de carnes.",
            "booking_url": "https://www.google.com/maps/search/Mercado+20+de+Noviembre+Oaxaca",
            "price": "$"
        },
        {
            "name": "Casa Oaxaca",
            "type": "Traditional Oaxacan",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Chef Alejandro Ruiz's celebration of Oaxacan ingredients. Seven different moles and traditional dishes with modern presentation.",
            "booking_url": "https://www.google.com/maps/search/Casa+Oaxaca+Restaurant",
            "price": "$$$"
        }
    ],
    "penang": [
        {
            "name": "Tek Sen",
            "type": "Chinese-Malaysian",
            "rating": 4.6,
            "reviews": 4500,
            "description": "Legendary zi char restaurant. Famous for double-roasted pork and claypot dishes. Always packed with locals.",
            "booking_url": "https://www.google.com/maps/search/Tek+Sen+Restaurant+Penang",
            "price": "$$"
        },
        {
            "name": "Penang Road Famous Teochew Chendul",
            "type": "Dessert",
            "rating": 4.5,
            "reviews": 6000,
            "description": "The most famous cendol in Malaysia. Shaved ice with coconut milk, palm sugar, and green rice flour jelly since 1936.",
            "booking_url": "https://www.google.com/maps/search/Penang+Road+Famous+Teochew+Chendul",
            "price": "$"
        },
        {
            "name": "Siam Road Char Koay Teow",
            "type": "Street Food",
            "rating": 4.7,
            "reviews": 3200,
            "description": "Possibly the best char kway teow in the world. Worth the queue for the wok hei smoky noodles.",
            "booking_url": "https://www.google.com/maps/search/Siam+Road+Char+Koay+Teow+Penang",
            "price": "$"
        }
    ],
    "montevideo": [
        {
            "name": "Mercado del Puerto",
            "type": "Uruguayan BBQ",
            "rating": 4.5,
            "reviews": 7500,
            "description": "Historic market hall with incredible parrilla (grill) restaurants. The ultimate Uruguayan meat experience.",
            "booking_url": "https://www.google.com/maps/search/Mercado+del+Puerto+Montevideo",
            "price": "$$"
        },
        {
            "name": "La Pulperia",
            "type": "Uruguayan",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Traditional Uruguayan dishes in charming rustic setting. Excellent empanadas, asado, and local wines.",
            "booking_url": "https://www.google.com/maps/search/La+Pulperia+Montevideo",
            "price": "$$"
        },
        {
            "name": "Cafe Bacacay",
            "type": "Uruguayan Cafe",
            "rating": 4.4,
            "reviews": 1500,
            "description": "Beloved corner cafe in Ciudad Vieja. Classic Uruguayan coffee culture with excellent medialunas and people watching.",
            "booking_url": "https://www.google.com/maps/search/Cafe+Bacacay+Montevideo",
            "price": "$"
        }
    ],
    "dubai": [
        {
            "name": "Al Ustad Special Kabab",
            "type": "Iranian",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Hidden gem in Bur Dubai serving Iranian kebabs since 1978. Featured on Anthony Bourdain's show. Cash only.",
            "booking_url": "https://www.google.com/maps/search/Al+Ustad+Special+Kabab+Dubai",
            "price": "$"
        },
        {
            "name": "Tresind Studio",
            "type": "Modern Indian",
            "rating": 4.8,
            "reviews": 1800,
            "description": "Two Michelin stars and ranked #3 in MENA's 50 Best. Chef Himanshu Saini's theatrical modern Indian tasting menu.",
            "booking_url": "https://www.google.com/maps/search/Tresind+Studio+Dubai",
            "price": "$$$$"
        },
        {
            "name": "Ravi Restaurant",
            "type": "Pakistani",
            "rating": 4.4,
            "reviews": 12000,
            "description": "Dubai institution since 1978. Legendary Pakistani and North Indian dishes at unbeatable prices. Open 24 hours.",
            "booking_url": "https://www.google.com/maps/search/Ravi+Restaurant+Dubai",
            "price": "$"
        }
    ],
    "miami": [
        {
            "name": "Joe's Stone Crab",
            "type": "Seafood",
            "rating": 4.5,
            "reviews": 15000,
            "description": "Miami Beach institution since 1913. The original stone crab destination with legendary key lime pie.",
            "booking_url": "https://www.google.com/maps/search/Joes+Stone+Crab+Miami",
            "price": "$$$$"
        },
        {
            "name": "Versailles",
            "type": "Cuban",
            "rating": 4.4,
            "reviews": 18000,
            "description": "The most famous Cuban restaurant in America. Essential for ropa vieja, Cuban sandwich, and cafe con leche.",
            "booking_url": "https://www.google.com/maps/search/Versailles+Restaurant+Miami",
            "price": "$$"
        },
        {
            "name": "KYU",
            "type": "Asian BBQ",
            "rating": 4.6,
            "reviews": 4500,
            "description": "Wynwood's hottest spot for wood-fired Asian cuisine. The coconut miso-glazed short rib is legendary.",
            "booking_url": "https://www.google.com/maps/search/KYU+Miami",
            "price": "$$$"
        }
    ],
    "vancouver": [
        {
            "name": "Vij's",
            "type": "Indian",
            "rating": 4.6,
            "reviews": 4200,
            "description": "Canada's most famous Indian restaurant. No reservations, but worth the wait for innovative Indian cuisine.",
            "booking_url": "https://www.google.com/maps/search/Vijs+Restaurant+Vancouver",
            "price": "$$$"
        },
        {
            "name": "Miku",
            "type": "Japanese",
            "rating": 4.5,
            "reviews": 6500,
            "description": "Aburi sushi pioneer with stunning waterfront views. Their flame-seared sushi is unlike anything else.",
            "booking_url": "https://www.google.com/maps/search/Miku+Restaurant+Vancouver",
            "price": "$$$"
        },
        {
            "name": "Phnom Penh",
            "type": "Cambodian-Vietnamese",
            "rating": 4.5,
            "reviews": 3800,
            "description": "Chinatown institution famous for butter beef and chicken wings. Cash only, always packed, always delicious.",
            "booking_url": "https://www.google.com/maps/search/Phnom+Penh+Restaurant+Vancouver",
            "price": "$"
        }
    ],
    "auckland": [
        {
            "name": "Depot Eatery",
            "type": "New Zealand",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Chef Al Brown's bustling shared plates restaurant. Fresh oysters, sliders, and NZ comfort food.",
            "booking_url": "https://www.google.com/maps/search/Depot+Eatery+Auckland",
            "price": "$$"
        },
        {
            "name": "Cassia",
            "type": "Modern Indian",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Sid Sahrawat's award-winning modern Indian cuisine. New Zealand ingredients with Indian techniques.",
            "booking_url": "https://www.google.com/maps/search/Cassia+Restaurant+Auckland",
            "price": "$$$"
        },
        {
            "name": "Federal Delicatessen",
            "type": "American Deli",
            "rating": 4.4,
            "reviews": 4800,
            "description": "New York-style deli in Auckland. Outstanding pastrami sandwiches, bagels, and comfort food classics.",
            "booking_url": "https://www.google.com/maps/search/Federal+Delicatessen+Auckland",
            "price": "$$"
        }
    ],
    "hanoi": [
        {
            "name": "Pho Gia Truyen",
            "type": "Vietnamese",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Legendary pho spot on Bat Dan street since 1950s. Simple perfection - just beef pho, nothing else needed.",
            "booking_url": "https://www.google.com/maps/search/Pho+Gia+Truyen+Hanoi",
            "price": "$"
        },
        {
            "name": "Bun Cha Huong Lien (Obama Bun Cha)",
            "type": "Vietnamese",
            "rating": 4.5,
            "reviews": 8000,
            "description": "Where Obama and Bourdain had their famous meal. The Obama Combo is still on the menu.",
            "booking_url": "https://www.google.com/maps/search/Bun+Cha+Huong+Lien+Hanoi",
            "price": "$"
        },
        {
            "name": "Cha Ca La Vong",
            "type": "Vietnamese Seafood",
            "rating": 4.4,
            "reviews": 3200,
            "description": "The original cha ca restaurant since 1871. Turmeric-marinated fish cooked tableside, a Hanoi institution.",
            "booking_url": "https://www.google.com/maps/search/Cha+Ca+La+Vong+Hanoi",
            "price": "$$"
        }
    ],
    "danang": [
        {
            "name": "Ba Duong",
            "type": "Vietnamese",
            "rating": 4.6,
            "reviews": 2800,
            "description": "Famous for Mi Quang - Da Nang's signature turmeric noodle dish. Locals' favorite since decades.",
            "booking_url": "https://www.google.com/maps/search/Ba+Duong+Mi+Quang+Da+Nang",
            "price": "$"
        },
        {
            "name": "Banh Xeo Ba Duong",
            "type": "Vietnamese",
            "rating": 4.5,
            "reviews": 3500,
            "description": "The best banh xeo (crispy pancakes) in Da Nang. Huge portions filled with shrimp, pork, and bean sprouts.",
            "booking_url": "https://www.google.com/maps/search/Banh+Xeo+Ba+Duong+Da+Nang",
            "price": "$"
        },
        {
            "name": "Madame Lan",
            "type": "Vietnamese",
            "rating": 4.4,
            "reviews": 4200,
            "description": "Elegant Vietnamese restaurant with beautifully presented Central Vietnamese dishes. Great for a special dinner.",
            "booking_url": "https://www.google.com/maps/search/Madame+Lan+Da+Nang",
            "price": "$$"
        }
    ],
    "taipei": [
        {
            "name": "Din Tai Fung (Original)",
            "type": "Taiwanese",
            "rating": 4.7,
            "reviews": 15000,
            "description": "The original xiao long bao restaurant, now a global empire. Still the benchmark for soup dumplings.",
            "booking_url": "https://www.google.com/maps/search/Din+Tai+Fung+Xinyi+Taipei",
            "price": "$$"
        },
        {
            "name": "RAW",
            "type": "Modern Taiwanese",
            "rating": 4.8,
            "reviews": 2500,
            "description": "Chef Andre Chiang's two Michelin star restaurant. Innovative Taiwanese cuisine that's nearly impossible to book.",
            "booking_url": "https://www.google.com/maps/search/RAW+Restaurant+Taipei",
            "price": "$$$$"
        },
        {
            "name": "Shilin Night Market",
            "type": "Night Market",
            "rating": 4.5,
            "reviews": 25000,
            "description": "Taipei's largest and most famous night market. Essential for stinky tofu, oyster omelette, and bubble tea.",
            "booking_url": "https://www.google.com/maps/search/Shilin+Night+Market+Taipei",
            "price": "$"
        }
    ],
    "manila": [
        {
            "name": "Toyo Eatery",
            "type": "Modern Filipino",
            "rating": 4.7,
            "reviews": 2200,
            "description": "Asia's 50 Best listed restaurant. Chef Jordy Navarra's celebration of Filipino ingredients and traditions.",
            "booking_url": "https://www.google.com/maps/search/Toyo+Eatery+Manila",
            "price": "$$$"
        },
        {
            "name": "Aristocrat Restaurant",
            "type": "Filipino",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Manila institution since 1936. Famous for their barbecue chicken and classic Filipino comfort food.",
            "booking_url": "https://www.google.com/maps/search/Aristocrat+Restaurant+Manila",
            "price": "$$"
        },
        {
            "name": "Salcedo Saturday Market",
            "type": "Filipino Market",
            "rating": 4.5,
            "reviews": 3500,
            "description": "Makati's beloved weekend food market. Regional Filipino dishes, fresh produce, and artisan goods.",
            "booking_url": "https://www.google.com/maps/search/Salcedo+Saturday+Market+Manila",
            "price": "$"
        }
    ],
    "cebu": [
        {
            "name": "House of Lechon",
            "type": "Filipino",
            "rating": 4.6,
            "reviews": 4200,
            "description": "Cebu is the lechon capital of the Philippines, and this is among the best. Crispy pork perfection.",
            "booking_url": "https://www.google.com/maps/search/House+of+Lechon+Cebu",
            "price": "$$"
        },
        {
            "name": "Zubuchon",
            "type": "Filipino BBQ",
            "rating": 4.5,
            "reviews": 3800,
            "description": "Anthony Bourdain called it 'the best pig ever.' Marketman's legendary lechon with organic pigs.",
            "booking_url": "https://www.google.com/maps/search/Zubuchon+Cebu",
            "price": "$$"
        },
        {
            "name": "Lantaw Native Restaurant",
            "type": "Filipino Seafood",
            "rating": 4.4,
            "reviews": 5500,
            "description": "Floating restaurant with stunning sunset views. Fresh seafood in a traditional Filipino setting.",
            "booking_url": "https://www.google.com/maps/search/Lantaw+Native+Restaurant+Cebu",
            "price": "$$"
        }
    ],
    "siemreap": [
        {
            "name": "Cuisine Wat Damnak",
            "type": "Modern Cambodian",
            "rating": 4.7,
            "reviews": 2500,
            "description": "Cambodia's most acclaimed restaurant. Chef Joannès Rivière's set menus showcase forgotten Khmer ingredients.",
            "booking_url": "https://www.google.com/maps/search/Cuisine+Wat+Damnak+Siem+Reap",
            "price": "$$$"
        },
        {
            "name": "Genevieve's",
            "type": "Cambodian",
            "rating": 4.5,
            "reviews": 1800,
            "description": "Home-style Khmer cooking in intimate setting. Excellent amok and other traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/Genevieves+Restaurant+Siem+Reap",
            "price": "$$"
        },
        {
            "name": "Pou Kitchen",
            "type": "Cambodian Street Food",
            "rating": 4.4,
            "reviews": 1200,
            "description": "Social enterprise restaurant serving refined street food. Supports local community while serving delicious food.",
            "booking_url": "https://www.google.com/maps/search/Pou+Kitchen+Siem+Reap",
            "price": "$"
        }
    ],
    "phnompenh": [
        {
            "name": "Romdeng",
            "type": "Cambodian",
            "rating": 4.5,
            "reviews": 3200,
            "description": "NGO restaurant training at-risk youth. Adventurous menu including tarantulas, plus excellent traditional dishes.",
            "booking_url": "https://www.google.com/maps/search/Romdeng+Phnom+Penh",
            "price": "$$"
        },
        {
            "name": "Friends the Restaurant",
            "type": "Cambodian Tapas",
            "rating": 4.6,
            "reviews": 4500,
            "description": "Another NGO gem training street youth. Khmer tapas in beautiful colonial building. Must-try spring rolls.",
            "booking_url": "https://www.google.com/maps/search/Friends+Restaurant+Phnom+Penh",
            "price": "$$"
        },
        {
            "name": "Sovanna II",
            "type": "Cambodian BBQ",
            "rating": 4.4,
            "reviews": 2100,
            "description": "Legendary riverside BBQ spot. Grill your own meats and seafood Cambodian-style with delicious dipping sauces.",
            "booking_url": "https://www.google.com/maps/search/Sovanna+II+Phnom+Penh",
            "price": "$"
        }
    ],
    "kathmandu": [
        {
            "name": "Krishnarpan",
            "type": "Nepali Fine Dining",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Nepal's finest dining experience at Dwarika's Hotel. Up to 22-course Nepali feast in royal setting.",
            "booking_url": "https://www.google.com/maps/search/Krishnarpan+Dwarikis+Kathmandu",
            "price": "$$$$"
        },
        {
            "name": "Bhojan Griha",
            "type": "Traditional Nepali",
            "rating": 4.5,
            "reviews": 2800,
            "description": "Cultural dining with traditional music and dance. Authentic Newari and Nepali dishes in heritage building.",
            "booking_url": "https://www.google.com/maps/search/Bhojan+Griha+Kathmandu",
            "price": "$$"
        },
        {
            "name": "Thamel House Restaurant",
            "type": "Nepali",
            "rating": 4.4,
            "reviews": 3500,
            "description": "Traditional Newari house serving set meals. Excellent dal bhat and momos in the heart of Thamel.",
            "booking_url": "https://www.google.com/maps/search/Thamel+House+Restaurant+Kathmandu",
            "price": "$$"
        }
    ],
    "pokhara": [
        {
            "name": "Moondance Restaurant",
            "type": "International",
            "rating": 4.5,
            "reviews": 2200,
            "description": "Lakeside institution with stunning Annapurna views. Great steaks, pasta, and Nepali dishes.",
            "booking_url": "https://www.google.com/maps/search/Moondance+Restaurant+Pokhara",
            "price": "$$"
        },
        {
            "name": "Caffe Concerto",
            "type": "Italian",
            "rating": 4.4,
            "reviews": 1800,
            "description": "Best pizza in Pokhara with Italian owner. Perfect post-trek comfort food with mountain views.",
            "booking_url": "https://www.google.com/maps/search/Caffe+Concerto+Pokhara",
            "price": "$$"
        },
        {
            "name": "Godfather's Pizzeria",
            "type": "Italian",
            "rating": 4.3,
            "reviews": 2500,
            "description": "Backpacker favorite with generous portions. Great pizzas and pasta at budget-friendly prices.",
            "booking_url": "https://www.google.com/maps/search/Godfathers+Pizzeria+Pokhara",
            "price": "$"
        }
    ],
    "mumbai": [
        {
            "name": "Trishna",
            "type": "Seafood",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Mumbai's legendary crab restaurant. The butter pepper garlic crab is mandatory. Book ahead.",
            "booking_url": "https://www.google.com/maps/search/Trishna+Restaurant+Mumbai",
            "price": "$$$"
        },
        {
            "name": "Leopold Cafe",
            "type": "Indian",
            "rating": 4.3,
            "reviews": 12000,
            "description": "Historic Colaba cafe since 1871. Tourist institution but still serving solid Indian and Continental fare.",
            "booking_url": "https://www.google.com/maps/search/Leopold+Cafe+Mumbai",
            "price": "$$"
        },
        {
            "name": "Swati Snacks",
            "type": "Gujarati Street Food",
            "rating": 4.5,
            "reviews": 6500,
            "description": "Elevated Gujarati street food in clean surroundings. Famous for panki, sev puri, and handvo.",
            "booking_url": "https://www.google.com/maps/search/Swati+Snacks+Mumbai",
            "price": "$"
        }
    ],
    "bangalore": [
        {
            "name": "MTR (Mavalli Tiffin Rooms)",
            "type": "South Indian",
            "rating": 4.5,
            "reviews": 15000,
            "description": "Bangalore institution since 1924. Legendary for dosa, idli, and filter coffee. Worth the queue.",
            "booking_url": "https://www.google.com/maps/search/MTR+Mavalli+Tiffin+Rooms+Bangalore",
            "price": "$"
        },
        {
            "name": "Karavalli",
            "type": "Coastal Indian",
            "rating": 4.6,
            "reviews": 3200,
            "description": "Award-winning coastal cuisine from Karnataka, Kerala, and Goa. Beautiful setting at Taj Gateway.",
            "booking_url": "https://www.google.com/maps/search/Karavalli+Restaurant+Bangalore",
            "price": "$$$"
        },
        {
            "name": "Vidyarthi Bhavan",
            "type": "South Indian",
            "rating": 4.4,
            "reviews": 8500,
            "description": "Heritage dosa joint since 1943. The crispy masala dosa and filter coffee are legendary.",
            "booking_url": "https://www.google.com/maps/search/Vidyarthi+Bhavan+Bangalore",
            "price": "$"
        }
    ],
    "goa": [
        {
            "name": "Gunpowder",
            "type": "South Indian",
            "rating": 4.6,
            "reviews": 3500,
            "description": "Hidden gem in Assagao serving Kerala and South Indian dishes. Beautiful garden setting, book ahead.",
            "booking_url": "https://www.google.com/maps/search/Gunpowder+Goa+Assagao",
            "price": "$$"
        },
        {
            "name": "Vinayak Family Restaurant",
            "type": "Goan Seafood",
            "rating": 4.5,
            "reviews": 2800,
            "description": "No-frills local favorite in Baga for authentic Goan seafood. Try the fish thali and prawn curry.",
            "booking_url": "https://www.google.com/maps/search/Vinayak+Family+Restaurant+Goa",
            "price": "$"
        },
        {
            "name": "Antares",
            "type": "Modern European",
            "rating": 4.4,
            "reviews": 4200,
            "description": "Celebrity chef Sarah Todd's Vagator beach restaurant. Great cocktails and sunset views.",
            "booking_url": "https://www.google.com/maps/search/Antares+Restaurant+Goa",
            "price": "$$$"
        }
    ],
    "colombo": [
        {
            "name": "Ministry of Crab",
            "type": "Seafood",
            "rating": 4.6,
            "reviews": 5500,
            "description": "Cricketer-owned crab restaurant in historic Dutch Hospital. Sri Lankan mud crab at its finest.",
            "booking_url": "https://www.google.com/maps/search/Ministry+of+Crab+Colombo",
            "price": "$$$"
        },
        {
            "name": "Nuga Gama",
            "type": "Sri Lankan",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Traditional Sri Lankan village experience at Cinnamon Grand. Authentic rice and curry spread.",
            "booking_url": "https://www.google.com/maps/search/Nuga+Gama+Colombo",
            "price": "$$"
        },
        {
            "name": "Upali's",
            "type": "Sri Lankan",
            "rating": 4.4,
            "reviews": 2800,
            "description": "Popular for authentic Sri Lankan rice and curry. Great value with generous portions.",
            "booking_url": "https://www.google.com/maps/search/Upalis+Colombo",
            "price": "$"
        }
    ],
    "telaviv": [
        {
            "name": "HaKosem",
            "type": "Israeli Street Food",
            "rating": 4.6,
            "reviews": 6500,
            "description": "The king of falafel in Tel Aviv. Legendary crispy falafel and sabich. Always a queue, always worth it.",
            "booking_url": "https://www.google.com/maps/search/HaKosem+Tel+Aviv",
            "price": "$"
        },
        {
            "name": "Miznon",
            "type": "Israeli",
            "rating": 4.5,
            "reviews": 5200,
            "description": "Chef Eyal Shani's pita empire. Whole roasted cauliflower and creative pita sandwiches.",
            "booking_url": "https://www.google.com/maps/search/Miznon+Tel+Aviv",
            "price": "$$"
        },
        {
            "name": "OCD",
            "type": "Modern Israeli",
            "rating": 4.7,
            "reviews": 1800,
            "description": "Raz Rahav's tasting menu in intimate setting. Creative, boundary-pushing Israeli cuisine.",
            "booking_url": "https://www.google.com/maps/search/OCD+Restaurant+Tel+Aviv",
            "price": "$$$$"
        }
    ],
    "cairo": [
        {
            "name": "Abou El Sid",
            "type": "Egyptian",
            "rating": 4.5,
            "reviews": 4500,
            "description": "Upscale Egyptian cuisine in beautiful traditional setting. Excellent koshary, molokhia, and grilled meats.",
            "booking_url": "https://www.google.com/maps/search/Abou+El+Sid+Cairo",
            "price": "$$"
        },
        {
            "name": "Koshary Abou Tarek",
            "type": "Egyptian Street Food",
            "rating": 4.4,
            "reviews": 8000,
            "description": "Cairo's most famous koshary joint. Four floors of carb-loaded Egyptian comfort food.",
            "booking_url": "https://www.google.com/maps/search/Koshary+Abou+Tarek+Cairo",
            "price": "$"
        },
        {
            "name": "Zooba",
            "type": "Modern Egyptian",
            "rating": 4.5,
            "reviews": 3200,
            "description": "Hip spot modernizing Egyptian street food. Great foul, taameya, and creative drinks.",
            "booking_url": "https://www.google.com/maps/search/Zooba+Cairo",
            "price": "$"
        }
    ],
    "marrakech": [
        {
            "name": "Jemaa el-Fnaa Food Stalls",
            "type": "Moroccan Street Food",
            "rating": 4.4,
            "reviews": 15000,
            "description": "The famous night market with dozens of food stalls. Essential experience for tagine, couscous, and snails.",
            "booking_url": "https://www.google.com/maps/search/Jemaa+el+Fnaa+Food+Stalls+Marrakech",
            "price": "$"
        },
        {
            "name": "Nomad",
            "type": "Modern Moroccan",
            "rating": 4.5,
            "reviews": 5500,
            "description": "Rooftop restaurant with medina views. Modern take on Moroccan classics with great cocktails.",
            "booking_url": "https://www.google.com/maps/search/Nomad+Marrakech",
            "price": "$$"
        },
        {
            "name": "Al Fassia",
            "type": "Traditional Moroccan",
            "rating": 4.6,
            "reviews": 3200,
            "description": "All-female run restaurant serving exceptional traditional cuisine. Famous lamb tagine and pastilla.",
            "booking_url": "https://www.google.com/maps/search/Al+Fassia+Marrakech",
            "price": "$$$"
        }
    ]
}

def main():
    # Load existing data
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add batch 1 data
    added = 0
    for city_id, restaurants in BATCH_1_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    # Save
    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

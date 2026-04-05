#!/usr/bin/env python3
"""Add restaurant data for batch 6 (50 cities) - Africa, Middle East, Australia, More Europe."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_6_DATA = {
    "daressalaam": [
        {"name": "305 Karafuu", "type": "Seafood", "rating": 4.5, "reviews": 1200, "description": "Waterfront restaurant with fresh Indian Ocean seafood. Beautiful setting on the harbor.", "booking_url": "https://www.google.com/maps/search/305+Karafuu+Dar+es+Salaam", "price": "$$$"},
        {"name": "Mamboz Corner BBQ", "type": "Tanzanian BBQ", "rating": 4.4, "reviews": 800, "description": "Local institution for mishkaki (grilled meat skewers). Street food at its finest.", "booking_url": "https://www.google.com/maps/search/Mamboz+Corner+BBQ+Dar+es+Salaam", "price": "$"},
        {"name": "Akemi Revolving Restaurant", "type": "International", "rating": 4.3, "reviews": 1500, "description": "Revolving rooftop restaurant with city views. Mix of Asian and Continental cuisine.", "booking_url": "https://www.google.com/maps/search/Akemi+Revolving+Restaurant+Dar+es+Salaam", "price": "$$"}
    ],
    "zanzibar": [
        {"name": "The Rock Restaurant", "type": "Seafood", "rating": 4.5, "reviews": 5500, "description": "Iconic restaurant on a rock in the ocean. Fresh seafood with the most unique setting.", "booking_url": "https://www.google.com/maps/search/The+Rock+Restaurant+Zanzibar", "price": "$$$"},
        {"name": "Forodhani Night Market", "type": "Street Food", "rating": 4.4, "reviews": 3200, "description": "Famous night food market in Stone Town. Zanzibar pizza, seafood, and sugar cane juice.", "booking_url": "https://www.google.com/maps/search/Forodhani+Gardens+Night+Market+Zanzibar", "price": "$"},
        {"name": "Emerson Spice Tea House", "type": "Swahili", "rating": 4.6, "reviews": 1200, "description": "Rooftop dining with call to prayer views. Traditional Swahili cuisine in historic setting.", "booking_url": "https://www.google.com/maps/search/Emerson+Spice+Tea+House+Zanzibar", "price": "$$$"}
    ],
    "tunis": [
        {"name": "Dar El Jeld", "type": "Tunisian", "rating": 4.6, "reviews": 1800, "description": "Refined Tunisian cuisine in stunning 17th century palace. The city's most elegant dining.", "booking_url": "https://www.google.com/maps/search/Dar+El+Jeld+Tunis", "price": "$$$"},
        {"name": "El Ali", "type": "Tunisian Traditional", "rating": 4.4, "reviews": 1200, "description": "Local favorite near the Medina. Great couscous and traditional dishes.", "booking_url": "https://www.google.com/maps/search/El+Ali+Restaurant+Tunis", "price": "$$"},
        {"name": "Cafe M'Rabet", "type": "Cafe", "rating": 4.3, "reviews": 800, "description": "Historic 18th century cafe in the souk. Traditional mint tea and atmosphere.", "booking_url": "https://www.google.com/maps/search/Cafe+M+Rabet+Tunis", "price": "$"}
    ],
    "essaouira": [
        {"name": "La Table by Madada", "type": "Modern Moroccan", "rating": 4.6, "reviews": 1500, "description": "Creative Moroccan cuisine with sea views. One of Morocco's best restaurants.", "booking_url": "https://www.google.com/maps/search/La+Table+by+Madada+Essaouira", "price": "$$$"},
        {"name": "Port Stalls", "type": "Seafood", "rating": 4.5, "reviews": 2800, "description": "Fresh grilled fish at the port. Pick your catch and they grill it for you.", "booking_url": "https://www.google.com/maps/search/Essaouira+Port+Fish+Stalls", "price": "$"},
        {"name": "Elizir", "type": "Moroccan Italian", "rating": 4.4, "reviews": 1200, "description": "Italian-Moroccan fusion in the medina. Great pasta and tagines.", "booking_url": "https://www.google.com/maps/search/Elizir+Essaouira", "price": "$$"}
    ],
    "taghazout": [
        {"name": "SPOT", "type": "International", "rating": 4.4, "reviews": 600, "description": "Popular surfer cafe with ocean views. Great breakfast and healthy options.", "booking_url": "https://www.google.com/maps/search/SPOT+Taghazout", "price": "$$"},
        {"name": "L'Auberge", "type": "Moroccan French", "rating": 4.5, "reviews": 400, "description": "Charming rooftop restaurant. French-Moroccan cuisine with surf town vibes.", "booking_url": "https://www.google.com/maps/search/L+Auberge+Taghazout", "price": "$$"},
        {"name": "Amouage", "type": "Moroccan", "rating": 4.3, "reviews": 300, "description": "Local restaurant with authentic tagines. Great value traditional food.", "booking_url": "https://www.google.com/maps/search/Amouage+Taghazout", "price": "$"}
    ],
    "chefchaouen": [
        {"name": "Casa Aladdin", "type": "Moroccan", "rating": 4.5, "reviews": 2200, "description": "Rooftop dining with blue city views. Traditional Moroccan dishes in magical setting.", "booking_url": "https://www.google.com/maps/search/Casa+Aladdin+Chefchaouen", "price": "$$"},
        {"name": "Bab Ssour", "type": "Moroccan Traditional", "rating": 4.4, "reviews": 1800, "description": "Local favorite for traditional cuisine. Excellent pastilla and tagines.", "booking_url": "https://www.google.com/maps/search/Bab+Ssour+Chefchaouen", "price": "$$"},
        {"name": "Sofia", "type": "Cafe", "rating": 4.3, "reviews": 1200, "description": "Charming cafe in the blue medina. Great breakfast and mint tea.", "booking_url": "https://www.google.com/maps/search/Cafe+Sofia+Chefchaouen", "price": "$"}
    ],
    "addisababa": [
        {"name": "Yod Abyssinia", "type": "Ethiopian", "rating": 4.5, "reviews": 2500, "description": "Traditional dining with live music and dance. The full Ethiopian cultural experience.", "booking_url": "https://www.google.com/maps/search/Yod+Abyssinia+Addis+Ababa", "price": "$$"},
        {"name": "Kategna", "type": "Ethiopian", "rating": 4.6, "reviews": 1800, "description": "Upscale Ethiopian cuisine. Perfect injera and diverse regional dishes.", "booking_url": "https://www.google.com/maps/search/Kategna+Restaurant+Addis+Ababa", "price": "$$"},
        {"name": "Tomoca Coffee", "type": "Coffee", "rating": 4.5, "reviews": 3200, "description": "Legendary coffee house since 1953. The birthplace of coffee culture in its homeland.", "booking_url": "https://www.google.com/maps/search/Tomoca+Coffee+Addis+Ababa", "price": "$"}
    ],
    "mauritius": [
        {"name": "La Maison d'Ete", "type": "French-Mauritian", "rating": 4.6, "reviews": 1200, "description": "Elegant dining in colonial estate. French-Mauritian cuisine with beautiful gardens.", "booking_url": "https://www.google.com/maps/search/La+Maison+d+Ete+Mauritius", "price": "$$$"},
        {"name": "Le Chamarel", "type": "Mauritian", "rating": 4.5, "reviews": 800, "description": "Mountain restaurant with stunning views. Local specialties in scenic setting.", "booking_url": "https://www.google.com/maps/search/Le+Chamarel+Restaurant+Mauritius", "price": "$$"},
        {"name": "Port Louis Waterfront", "type": "International", "rating": 4.3, "reviews": 2500, "description": "Waterfront dining complex. Mix of local and international restaurants.", "booking_url": "https://www.google.com/maps/search/Port+Louis+Waterfront+Mauritius", "price": "$$"}
    ],
    "amman": [
        {"name": "Hashem", "type": "Jordanian", "rating": 4.5, "reviews": 8500, "description": "Legendary falafel and hummus since 1952. Even royalty eats here. Cash only.", "booking_url": "https://www.google.com/maps/search/Hashem+Restaurant+Amman", "price": "$"},
        {"name": "Sufra", "type": "Jordanian", "rating": 4.6, "reviews": 3200, "description": "Upscale Jordanian cuisine in beautiful old house. Great mansaf and mezze.", "booking_url": "https://www.google.com/maps/search/Sufra+Restaurant+Amman", "price": "$$"},
        {"name": "Fakhr El-Din", "type": "Levantine", "rating": 4.5, "reviews": 2200, "description": "Elegant Lebanese-Jordanian cuisine. Beautiful terrace in wealthy Abdoun.", "booking_url": "https://www.google.com/maps/search/Fakhr+El+Din+Amman", "price": "$$$"}
    ],
    "beirut": [
        {"name": "Tawlet", "type": "Lebanese Regional", "rating": 4.6, "reviews": 2800, "description": "Different Lebanese regional cuisines daily. Supporting women cooks from across Lebanon.", "booking_url": "https://www.google.com/maps/search/Tawlet+Beirut", "price": "$$"},
        {"name": "Em Sherif", "type": "Lebanese", "rating": 4.7, "reviews": 3500, "description": "Legendary Lebanese feast. Endless mezze in opulent setting.", "booking_url": "https://www.google.com/maps/search/Em+Sherif+Beirut", "price": "$$$$"},
        {"name": "Barbar", "type": "Lebanese Fast Food", "rating": 4.4, "reviews": 5500, "description": "24-hour Beirut institution. Famous shawarma and manakish.", "booking_url": "https://www.google.com/maps/search/Barbar+Beirut", "price": "$"}
    ],
    "muscat": [
        {"name": "Bait Al Luban", "type": "Omani", "rating": 4.5, "reviews": 2200, "description": "Traditional Omani cuisine near Mutrah Souq. Authentic dishes in heritage setting.", "booking_url": "https://www.google.com/maps/search/Bait+Al+Luban+Muscat", "price": "$$"},
        {"name": "The Beach", "type": "Mediterranean", "rating": 4.6, "reviews": 1800, "description": "Stunning beachfront restaurant at Chedi Hotel. Mediterranean cuisine with Gulf views.", "booking_url": "https://www.google.com/maps/search/The+Beach+Restaurant+Chedi+Muscat", "price": "$$$$"},
        {"name": "Kargeen Caffe", "type": "Omani Cafe", "rating": 4.4, "reviews": 3500, "description": "Garden cafe with traditional ambiance. Great shisha and Omani snacks.", "booking_url": "https://www.google.com/maps/search/Kargeen+Caffe+Muscat", "price": "$$"}
    ],
    "abudhabi": [
        {"name": "Li Beirut", "type": "Lebanese", "rating": 4.6, "reviews": 2200, "description": "Outstanding Lebanese at Jumeirah Etihad. Elegant setting with exceptional mezze.", "booking_url": "https://www.google.com/maps/search/Li+Beirut+Abu+Dhabi", "price": "$$$"},
        {"name": "Hakkasan", "type": "Chinese Fine Dining", "rating": 4.5, "reviews": 3500, "description": "Michelin-starred Cantonese at Emirates Palace. Sophisticated Chinese cuisine.", "booking_url": "https://www.google.com/maps/search/Hakkasan+Abu+Dhabi", "price": "$$$$"},
        {"name": "Al Fanar", "type": "Emirati", "rating": 4.4, "reviews": 2800, "description": "Traditional Emirati cuisine. Rare chance to try authentic local dishes.", "booking_url": "https://www.google.com/maps/search/Al+Fanar+Restaurant+Abu+Dhabi", "price": "$$"}
    ],
    "doha": [
        {"name": "IDAM by Alain Ducasse", "type": "French-Mediterranean", "rating": 4.6, "reviews": 1500, "description": "Alain Ducasse's Middle East outpost at MIA. Stunning views and refined cuisine.", "booking_url": "https://www.google.com/maps/search/IDAM+Alain+Ducasse+Doha", "price": "$$$$"},
        {"name": "Damasca One", "type": "Syrian", "rating": 4.5, "reviews": 2200, "description": "Excellent Syrian cuisine in Souq Waqif. Great mezze and grilled meats.", "booking_url": "https://www.google.com/maps/search/Damasca+One+Doha", "price": "$$"},
        {"name": "Shay Al Shamoos", "type": "Qatari", "rating": 4.4, "reviews": 1800, "description": "Traditional Qatari dishes. One of the few places for authentic local cuisine.", "booking_url": "https://www.google.com/maps/search/Shay+Al+Shamoos+Doha", "price": "$$"}
    ],
    "brisbane": [
        {"name": "GOMA Restaurant", "type": "Modern Australian", "rating": 4.5, "reviews": 2200, "description": "Dining at Gallery of Modern Art. Creative Australian cuisine with river views.", "booking_url": "https://www.google.com/maps/search/GOMA+Restaurant+Brisbane", "price": "$$$"},
        {"name": "Eat Street Northshore", "type": "Street Food Market", "rating": 4.4, "reviews": 5500, "description": "Shipping container food market. Diverse cuisines and vibrant atmosphere.", "booking_url": "https://www.google.com/maps/search/Eat+Street+Northshore+Brisbane", "price": "$$"},
        {"name": "Stokehouse Q", "type": "Seafood", "rating": 4.5, "reviews": 2800, "description": "Waterfront seafood at South Bank. Fresh Queensland produce and great views.", "booking_url": "https://www.google.com/maps/search/Stokehouse+Q+Brisbane", "price": "$$$"}
    ],
    "perth": [
        {"name": "Wildflower", "type": "Modern Australian", "rating": 4.7, "reviews": 1500, "description": "Native Australian ingredients in iconic rooftop. One of Perth's finest.", "booking_url": "https://www.google.com/maps/search/Wildflower+Restaurant+Perth", "price": "$$$$"},
        {"name": "Long Chim", "type": "Thai", "rating": 4.5, "reviews": 3200, "description": "David Thompson's Thai street food. Authentic flavors in State Buildings.", "booking_url": "https://www.google.com/maps/search/Long+Chim+Perth", "price": "$$"},
        {"name": "Mary's", "type": "Burgers", "rating": 4.4, "reviews": 2500, "description": "Late-night burgers and rock vibes. Cult Sydney export now in Perth.", "booking_url": "https://www.google.com/maps/search/Marys+Burgers+Perth", "price": "$$"}
    ],
    "adelaide": [
        {"name": "Orana", "type": "Native Australian", "rating": 4.8, "reviews": 1200, "description": "Jock Zonfrillo's celebration of Australian native ingredients. Groundbreaking cuisine.", "booking_url": "https://www.google.com/maps/search/Orana+Restaurant+Adelaide", "price": "$$$$"},
        {"name": "Adelaide Central Market", "type": "Market", "rating": 4.6, "reviews": 8500, "description": "Australia's finest produce market since 1869. Fresh everything and great food stalls.", "booking_url": "https://www.google.com/maps/search/Adelaide+Central+Market", "price": "$$"},
        {"name": "Africola", "type": "African-Australian", "rating": 4.5, "reviews": 2200, "description": "Duncan Welgemoed's bold African-inspired cuisine. Loud, fun, and delicious.", "booking_url": "https://www.google.com/maps/search/Africola+Adelaide", "price": "$$$"}
    ],
    "wellington": [
        {"name": "Logan Brown", "type": "New Zealand Fine Dining", "rating": 4.6, "reviews": 1800, "description": "Wellington's premier fine dining in historic bank building. NZ ingredients elevated.", "booking_url": "https://www.google.com/maps/search/Logan+Brown+Wellington", "price": "$$$$"},
        {"name": "Ortega Fish Shack", "type": "Seafood", "rating": 4.5, "reviews": 1500, "description": "Spanish-influenced seafood in Cuba Street. Fresh catches simply prepared.", "booking_url": "https://www.google.com/maps/search/Ortega+Fish+Shack+Wellington", "price": "$$$"},
        {"name": "Wellington Night Market", "type": "Street Food", "rating": 4.4, "reviews": 2200, "description": "Friday/Saturday night market on the waterfront. Global street food and local vibes.", "booking_url": "https://www.google.com/maps/search/Wellington+Night+Market", "price": "$"}
    ],
    "queenstown": [
        {"name": "Botswana Butchery", "type": "Steakhouse", "rating": 4.5, "reviews": 3500, "description": "Premium NZ meats in elegant lakefront setting. One of Queenstown's best.", "booking_url": "https://www.google.com/maps/search/Botswana+Butchery+Queenstown", "price": "$$$$"},
        {"name": "Fergburger", "type": "Burgers", "rating": 4.4, "reviews": 12000, "description": "World-famous burger joint. Lines form for massive burgers 21 hours a day.", "booking_url": "https://www.google.com/maps/search/Fergburger+Queenstown", "price": "$$"},
        {"name": "Rata", "type": "Modern NZ", "rating": 4.6, "reviews": 2200, "description": "Josh Emett's relaxed fine dining. Local ingredients in beautiful tree-lined setting.", "booking_url": "https://www.google.com/maps/search/Rata+Restaurant+Queenstown", "price": "$$$"}
    ],
    "goldcoast": [
        {"name": "Labart", "type": "Modern Australian", "rating": 4.6, "reviews": 1200, "description": "Award-winning modern Australian in Burleigh. Creative dishes with local produce.", "booking_url": "https://www.google.com/maps/search/Labart+Gold+Coast", "price": "$$$"},
        {"name": "Justin Lane", "type": "Italian", "rating": 4.5, "reviews": 2500, "description": "Vibrant rooftop with quality pizza and pasta. Great for groups.", "booking_url": "https://www.google.com/maps/search/Justin+Lane+Gold+Coast", "price": "$$"},
        {"name": "Miami Marketta", "type": "Street Food Market", "rating": 4.4, "reviews": 3500, "description": "Weekly night market with live music. Diverse food stalls and great atmosphere.", "booking_url": "https://www.google.com/maps/search/Miami+Marketta+Gold+Coast", "price": "$$"}
    ],
    "christchurch": [
        {"name": "Inati", "type": "Modern NZ", "rating": 4.6, "reviews": 1200, "description": "Sharing plates celebrating NZ produce. One of the post-earthquake city's best.", "booking_url": "https://www.google.com/maps/search/Inati+Christchurch", "price": "$$$"},
        {"name": "Riverside Market", "type": "Food Hall", "rating": 4.5, "reviews": 2800, "description": "Multi-level food hall on the Avon. Fresh produce and diverse cuisines.", "booking_url": "https://www.google.com/maps/search/Riverside+Market+Christchurch", "price": "$$"},
        {"name": "Twenty Seven Steps", "type": "European", "rating": 4.5, "reviews": 1500, "description": "Intimate restaurant in historic building. European-influenced local cuisine.", "booking_url": "https://www.google.com/maps/search/Twenty+Seven+Steps+Christchurch", "price": "$$$"}
    ],
    "byronbay": [
        {"name": "Fleet", "type": "Modern Australian", "rating": 4.7, "reviews": 1200, "description": "Tiny fine dining from ex-Noma chef. One of regional Australia's best restaurants.", "booking_url": "https://www.google.com/maps/search/Fleet+Restaurant+Byron+Bay", "price": "$$$$"},
        {"name": "The Farm", "type": "Farm-to-Table", "rating": 4.5, "reviews": 3500, "description": "Working farm with multiple eateries. Fresh produce straight from the paddock.", "booking_url": "https://www.google.com/maps/search/The+Farm+Byron+Bay", "price": "$$"},
        {"name": "Beach Byron Bay", "type": "Seafood", "rating": 4.4, "reviews": 2200, "description": "Beachfront restaurant with fresh local seafood. Great for sunset drinks.", "booking_url": "https://www.google.com/maps/search/Beach+Byron+Bay+Restaurant", "price": "$$$"}
    ],
    "cairns": [
        {"name": "Ochre Restaurant", "type": "Australian Native", "rating": 4.5, "reviews": 2500, "description": "Native Australian ingredients since 1994. Crocodile, kangaroo, and more.", "booking_url": "https://www.google.com/maps/search/Ochre+Restaurant+Cairns", "price": "$$$"},
        {"name": "Prawn Star", "type": "Seafood", "rating": 4.4, "reviews": 3200, "description": "Fresh prawns on a boat at the marina. Catch your own or buy ready to eat.", "booking_url": "https://www.google.com/maps/search/Prawn+Star+Cairns", "price": "$$"},
        {"name": "Night Markets", "type": "Food Court", "rating": 4.3, "reviews": 5500, "description": "Esplanade night market with Asian food stalls. Cheap eats and souvenirs.", "booking_url": "https://www.google.com/maps/search/Cairns+Night+Markets", "price": "$"}
    ],
    "hobart": [
        {"name": "Fico", "type": "Italian", "rating": 4.6, "reviews": 1500, "description": "Outstanding Italian using Tasmanian produce. One of Australia's best.", "booking_url": "https://www.google.com/maps/search/Fico+Restaurant+Hobart", "price": "$$$"},
        {"name": "Salamanca Market", "type": "Market", "rating": 4.5, "reviews": 8500, "description": "Saturday market with local produce and food. Tasmania's best market experience.", "booking_url": "https://www.google.com/maps/search/Salamanca+Market+Hobart", "price": "$$"},
        {"name": "Franklin", "type": "Modern Australian", "rating": 4.5, "reviews": 1800, "description": "Fire-focused cooking with Tasmanian ingredients. Beautiful industrial space.", "booking_url": "https://www.google.com/maps/search/Franklin+Restaurant+Hobart", "price": "$$$"}
    ],
    "ericeira": [
        {"name": "Tik Tak", "type": "Portuguese", "rating": 4.5, "reviews": 1500, "description": "Legendary seafood spot with ocean views. Fresh fish, simple preparation.", "booking_url": "https://www.google.com/maps/search/Tik+Tak+Ericeira", "price": "$$"},
        {"name": "Mar d'Areia", "type": "Seafood", "rating": 4.4, "reviews": 1200, "description": "Beach restaurant at Foz do Lizandro. Great for sunset and seafood rice.", "booking_url": "https://www.google.com/maps/search/Mar+d+Areia+Ericeira", "price": "$$"},
        {"name": "Prim", "type": "Modern European", "rating": 4.5, "reviews": 800, "description": "Stylish spot popular with surfers. Good brunch and dinner options.", "booking_url": "https://www.google.com/maps/search/Prim+Ericeira", "price": "$$"}
    ],
    "canggu": [
        {"name": "Crate Cafe", "type": "Cafe", "rating": 4.5, "reviews": 3500, "description": "Iconic Bali brunch spot. Great coffee, smoothie bowls, and digital nomad vibes.", "booking_url": "https://www.google.com/maps/search/Crate+Cafe+Canggu", "price": "$$"},
        {"name": "Ji Terrace by the Sea", "type": "Indonesian Fine Dining", "rating": 4.6, "reviews": 1200, "description": "Upscale Indonesian with spectacular sunset views. Perfect special occasion spot.", "booking_url": "https://www.google.com/maps/search/Ji+Terrace+by+the+Sea+Canggu", "price": "$$$"},
        {"name": "Warung Dandelion", "type": "Balinese", "rating": 4.4, "reviews": 2200, "description": "Local warung with authentic Indonesian food. Great nasi campur and satay.", "booking_url": "https://www.google.com/maps/search/Warung+Dandelion+Canggu", "price": "$"}
    ],
    "valletta": [
        {"name": "Noni", "type": "Modern Maltese", "rating": 4.7, "reviews": 1200, "description": "Michelin-starred modern Maltese. Chef Jonathan Brincat's innovative cuisine.", "booking_url": "https://www.google.com/maps/search/Noni+Restaurant+Valletta", "price": "$$$$"},
        {"name": "Legligin", "type": "Maltese", "rating": 4.5, "reviews": 2200, "description": "Wine bar with traditional Maltese food. Great ftira and local wines.", "booking_url": "https://www.google.com/maps/search/Legligin+Valletta", "price": "$$"},
        {"name": "Is-Suq Tal-Belt", "type": "Food Market", "rating": 4.4, "reviews": 1800, "description": "Covered food market with diverse stalls. Modern meets traditional in grand space.", "booking_url": "https://www.google.com/maps/search/Is+Suq+Tal+Belt+Valletta", "price": "$$"}
    ],
    "plovdiv": [
        {"name": "Pavaj", "type": "Bulgarian", "rating": 4.6, "reviews": 1500, "description": "Creative Bulgarian cuisine in the old town. One of Bulgaria's best restaurants.", "booking_url": "https://www.google.com/maps/search/Pavaj+Plovdiv", "price": "$$$"},
        {"name": "Hebros Restaurant", "type": "Bulgarian", "rating": 4.5, "reviews": 1200, "description": "Romantic dining in 200-year-old house. Traditional dishes beautifully presented.", "booking_url": "https://www.google.com/maps/search/Hebros+Restaurant+Plovdiv", "price": "$$"},
        {"name": "Kapana District", "type": "Street Food", "rating": 4.4, "reviews": 2500, "description": "Bohemian quarter with hip cafes and bars. Great for casual dining and drinks.", "booking_url": "https://www.google.com/maps/search/Kapana+District+Plovdiv", "price": "$$"}
    ],
    "tarifa": [
        {"name": "La Pescaderia", "type": "Seafood", "rating": 4.5, "reviews": 1500, "description": "Fresh fish market turned restaurant. Simply grilled catches from the strait.", "booking_url": "https://www.google.com/maps/search/La+Pescaderia+Tarifa", "price": "$$"},
        {"name": "Chilimosa", "type": "International", "rating": 4.4, "reviews": 1200, "description": "Popular surfer spot with eclectic menu. Great breakfast and Mexican dishes.", "booking_url": "https://www.google.com/maps/search/Chilimosa+Tarifa", "price": "$$"},
        {"name": "El Frances", "type": "Spanish Tapas", "rating": 4.3, "reviews": 800, "description": "Traditional tapas in the old town. Excellent jamón and local specialties.", "booking_url": "https://www.google.com/maps/search/El+Frances+Tarifa", "price": "$$"}
    ],
    "fuerteventura": [
        {"name": "La Frasquita", "type": "Canarian", "rating": 4.5, "reviews": 1200, "description": "Traditional Canarian dishes in El Cotillo. Great goat cheese and fresh fish.", "booking_url": "https://www.google.com/maps/search/La+Frasquita+Fuerteventura", "price": "$$"},
        {"name": "Avenida", "type": "Seafood", "rating": 4.4, "reviews": 1800, "description": "Fresh seafood in Corralejo. Excellent grilled fish and paella.", "booking_url": "https://www.google.com/maps/search/Avenida+Restaurant+Corralejo", "price": "$$"},
        {"name": "Gran Tarajal Fish Market", "type": "Seafood", "rating": 4.3, "reviews": 600, "description": "Fresh fish straight from the boats. Local experience with great value.", "booking_url": "https://www.google.com/maps/search/Gran+Tarajal+Fish+Market+Fuerteventura", "price": "$"}
    ],
    "phuquoc": [
        {"name": "Crab House", "type": "Seafood", "rating": 4.5, "reviews": 2200, "description": "Famous for fresh crab and seafood. Pick your catch from the tanks.", "booking_url": "https://www.google.com/maps/search/Crab+House+Phu+Quoc", "price": "$$"},
        {"name": "Night Market", "type": "Street Food", "rating": 4.4, "reviews": 3500, "description": "Bustling night market with seafood BBQ. Excellent value and local atmosphere.", "booking_url": "https://www.google.com/maps/search/Phu+Quoc+Night+Market", "price": "$"},
        {"name": "The Pepper Tree", "type": "Vietnamese", "rating": 4.4, "reviews": 1200, "description": "Garden restaurant with traditional Vietnamese. Great for the island's famous pepper.", "booking_url": "https://www.google.com/maps/search/The+Pepper+Tree+Phu+Quoc", "price": "$$"}
    ],
    "rabat": [
        {"name": "Dar Naji", "type": "Moroccan", "rating": 4.5, "reviews": 1200, "description": "Traditional Moroccan in beautiful riad setting. Excellent couscous and tagines.", "booking_url": "https://www.google.com/maps/search/Dar+Naji+Rabat", "price": "$$"},
        {"name": "Le Dhow", "type": "Moroccan-French", "rating": 4.4, "reviews": 1500, "description": "Restaurant on a boat in the marina. Beautiful setting and fusion cuisine.", "booking_url": "https://www.google.com/maps/search/Le+Dhow+Rabat", "price": "$$$"},
        {"name": "Cafe Maure", "type": "Cafe", "rating": 4.3, "reviews": 800, "description": "Historic cafe in the Kasbah. Mint tea with stunning river views.", "booking_url": "https://www.google.com/maps/search/Cafe+Maure+Rabat", "price": "$"}
    ],
    "bilbao": [
        {"name": "Azurmendi", "type": "Basque Fine Dining", "rating": 4.9, "reviews": 1800, "description": "Three Michelin stars from Eneko Atxa. Sustainable Basque cuisine at its peak.", "booking_url": "https://www.google.com/maps/search/Azurmendi+Bilbao", "price": "$$$$"},
        {"name": "La Ribera Market", "type": "Market", "rating": 4.5, "reviews": 3500, "description": "Europe's largest covered market. Pintxos bars and fresh Basque produce.", "booking_url": "https://www.google.com/maps/search/Mercado+de+la+Ribera+Bilbao", "price": "$$"},
        {"name": "Gure Toki", "type": "Basque Pintxos", "rating": 4.5, "reviews": 2200, "description": "Award-winning pintxos in the old town. Creative Basque bites.", "booking_url": "https://www.google.com/maps/search/Gure+Toki+Bilbao", "price": "$$"}
    ],
    "stavanger": [
        {"name": "Fisketorget", "type": "Seafood", "rating": 4.5, "reviews": 1800, "description": "Fish market with restaurant. Fresh Norwegian seafood in harbor setting.", "booking_url": "https://www.google.com/maps/search/Fisketorget+Stavanger", "price": "$$$"},
        {"name": "Renaa", "type": "Nordic Fine Dining", "rating": 4.7, "reviews": 800, "description": "Two Michelin stars using local ingredients. Norway's petroleum capital's best dining.", "booking_url": "https://www.google.com/maps/search/Renaa+Restaurant+Stavanger", "price": "$$$$"},
        {"name": "Hanekam", "type": "Norwegian", "rating": 4.4, "reviews": 1200, "description": "Cozy spot with traditional Norwegian dishes. Great for local comfort food.", "booking_url": "https://www.google.com/maps/search/Hanekam+Stavanger", "price": "$$"}
    ],
    "gijon": [
        {"name": "Casa Gerardo", "type": "Asturian", "rating": 4.6, "reviews": 1500, "description": "Michelin-starred Asturian cuisine since 1882. Traditional fabada done perfectly.", "booking_url": "https://www.google.com/maps/search/Casa+Gerardo+Gijon", "price": "$$$"},
        {"name": "Sidreria Tierra Astur", "type": "Asturian Cider House", "rating": 4.5, "reviews": 3500, "description": "Authentic cider house with traditional dishes. Great for sidra pouring experience.", "booking_url": "https://www.google.com/maps/search/Sidreria+Tierra+Astur+Gijon", "price": "$$"},
        {"name": "La Mar de Bien", "type": "Seafood", "rating": 4.4, "reviews": 1200, "description": "Fresh seafood in Cimadevilla. Excellent fish and shellfish from the Bay of Biscay.", "booking_url": "https://www.google.com/maps/search/La+Mar+de+Bien+Gijon", "price": "$$"}
    ],
    "poznan": [
        {"name": "Ratuszova", "type": "Polish", "rating": 4.5, "reviews": 1800, "description": "Traditional Polish in old town square. Great pierogi and local dishes.", "booking_url": "https://www.google.com/maps/search/Ratuszova+Poznan", "price": "$$"},
        {"name": "Concordia Taste", "type": "Modern Polish", "rating": 4.6, "reviews": 1200, "description": "Creative Polish cuisine using local ingredients. One of Poznan's finest.", "booking_url": "https://www.google.com/maps/search/Concordia+Taste+Poznan", "price": "$$$"},
        {"name": "Rogal Swietomarcinski", "type": "Bakery", "rating": 4.5, "reviews": 2500, "description": "Famous for St. Martin croissants. Traditional Poznan pastry you must try.", "booking_url": "https://www.google.com/maps/search/Rogal+Swietomarcinski+Poznan", "price": "$"}
    ],
    "bordeaux": [
        {"name": "Le Pressoir d'Argent", "type": "French Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Gordon Ramsay's two Michelin star restaurant. Exceptional with Bordeaux wines.", "booking_url": "https://www.google.com/maps/search/Le+Pressoir+d+Argent+Bordeaux", "price": "$$$$"},
        {"name": "La Tupina", "type": "French Southwestern", "rating": 4.5, "reviews": 4500, "description": "Legendary restaurant for traditional Bordelais cuisine. Open fire cooking.", "booking_url": "https://www.google.com/maps/search/La+Tupina+Bordeaux", "price": "$$$"},
        {"name": "Marche des Capucins", "type": "Market", "rating": 4.4, "reviews": 3200, "description": "Bordeaux's belly since 1880. Oysters, wine, and local produce.", "booking_url": "https://www.google.com/maps/search/Marche+des+Capucins+Bordeaux", "price": "$$"}
    ],
    "toulouse": [
        {"name": "Michel Sarran", "type": "French Fine Dining", "rating": 4.7, "reviews": 1500, "description": "Two Michelin stars of southwestern French cuisine. Toulouse's finest.", "booking_url": "https://www.google.com/maps/search/Michel+Sarran+Toulouse", "price": "$$$$"},
        {"name": "Le Genty Magre", "type": "French Bistro", "rating": 4.5, "reviews": 2200, "description": "Excellent cassoulet in charming setting. Classic Toulouse cooking.", "booking_url": "https://www.google.com/maps/search/Le+Genty+Magre+Toulouse", "price": "$$"},
        {"name": "Marche Victor Hugo", "type": "Market", "rating": 4.5, "reviews": 3500, "description": "Vibrant covered market with restaurants upstairs. Best for local produce.", "booking_url": "https://www.google.com/maps/search/Marche+Victor+Hugo+Toulouse", "price": "$$"}
    ],
    "montpellier": [
        {"name": "La Maison de la Lozere", "type": "Regional French", "rating": 4.5, "reviews": 1500, "description": "Excellent Lozere and Languedoc cuisine. Great terrace in old town.", "booking_url": "https://www.google.com/maps/search/La+Maison+de+la+Lozere+Montpellier", "price": "$$"},
        {"name": "Les Halles Castellane", "type": "Market", "rating": 4.4, "reviews": 1800, "description": "Food market with great stalls. Fresh Mediterranean produce and prepared foods.", "booking_url": "https://www.google.com/maps/search/Les+Halles+Castellane+Montpellier", "price": "$$"},
        {"name": "La Reserve Rimbaud", "type": "French Fine Dining", "rating": 4.6, "reviews": 800, "description": "Michelin-starred riverside dining. Refined southern French cuisine.", "booking_url": "https://www.google.com/maps/search/La+Reserve+Rimbaud+Montpellier", "price": "$$$"}
    ],
    "marseille": [
        {"name": "Le Petit Nice", "type": "French Fine Dining", "rating": 4.8, "reviews": 1200, "description": "Three Michelin stars celebrating Mediterranean fish. Bouillabaisse elevated.", "booking_url": "https://www.google.com/maps/search/Le+Petit+Nice+Marseille", "price": "$$$$"},
        {"name": "Chez Etienne", "type": "Provencal Pizza", "rating": 4.5, "reviews": 2200, "description": "Legendary pizza in Le Panier. Wood-fired pies in historic setting.", "booking_url": "https://www.google.com/maps/search/Chez+Etienne+Marseille", "price": "$"},
        {"name": "Vieux Port Fish Market", "type": "Seafood Market", "rating": 4.4, "reviews": 3500, "description": "Morning fish market by the port. Buy direct from fishermen.", "booking_url": "https://www.google.com/maps/search/Vieux+Port+Fish+Market+Marseille", "price": "$$"}
    ],
    "nantes": [
        {"name": "L'Atlantide 1874", "type": "French Fine Dining", "rating": 4.6, "reviews": 1200, "description": "Two Michelin stars with Loire views. Refined cuisine in elegant setting.", "booking_url": "https://www.google.com/maps/search/L+Atlantide+1874+Nantes", "price": "$$$$"},
        {"name": "La Cigale", "type": "French Brasserie", "rating": 4.4, "reviews": 5500, "description": "Stunning art nouveau brasserie since 1895. Classic French dishes in beautiful space.", "booking_url": "https://www.google.com/maps/search/La+Cigale+Nantes", "price": "$$"},
        {"name": "Marche de Talensac", "type": "Market", "rating": 4.5, "reviews": 2200, "description": "Nantes' main covered market. Fresh produce and excellent food stalls.", "booking_url": "https://www.google.com/maps/search/Marche+de+Talensac+Nantes", "price": "$$"}
    ],
    "annecy": [
        {"name": "Le Clos des Sens", "type": "French Fine Dining", "rating": 4.8, "reviews": 800, "description": "Two Michelin stars with lake views. Laurent Petit's extraordinary cuisine.", "booking_url": "https://www.google.com/maps/search/Le+Clos+des+Sens+Annecy", "price": "$$$$"},
        {"name": "L'Esquisse", "type": "Modern French", "rating": 4.5, "reviews": 1200, "description": "Creative French cuisine in old town. Michelin-starred lakeside dining.", "booking_url": "https://www.google.com/maps/search/L+Esquisse+Annecy", "price": "$$$"},
        {"name": "Le Freti", "type": "Savoyard", "rating": 4.4, "reviews": 1800, "description": "Traditional Savoyard fondue and raclette. Cozy alpine atmosphere.", "booking_url": "https://www.google.com/maps/search/Le+Freti+Annecy", "price": "$$"}
    ],
    "munich": [
        {"name": "Tantris", "type": "German Fine Dining", "rating": 4.7, "reviews": 2200, "description": "Two Michelin stars since 1971. Legendary Munich institution in iconic space.", "booking_url": "https://www.google.com/maps/search/Tantris+Munich", "price": "$$$$"},
        {"name": "Hofbrauhaus", "type": "German Beer Hall", "rating": 4.3, "reviews": 45000, "description": "World's most famous beer hall since 1589. Essential Munich experience.", "booking_url": "https://www.google.com/maps/search/Hofbrauhaus+Munich", "price": "$$"},
        {"name": "Viktualienmarkt", "type": "Market", "rating": 4.5, "reviews": 15000, "description": "Munich's famous food market. Beer gardens, sausages, and Bavarian specialties.", "booking_url": "https://www.google.com/maps/search/Viktualienmarkt+Munich", "price": "$$"}
    ],
    "cologne": [
        {"name": "Ox & Klee", "type": "German Fine Dining", "rating": 4.6, "reviews": 1200, "description": "Two Michelin stars on the Rhine. Creative German cuisine with river views.", "booking_url": "https://www.google.com/maps/search/Ox+and+Klee+Cologne", "price": "$$$$"},
        {"name": "Frueh am Dom", "type": "German Beer Hall", "rating": 4.4, "reviews": 8500, "description": "Classic Kolsch beer hall near the cathedral. Traditional dishes and local beer.", "booking_url": "https://www.google.com/maps/search/Frueh+am+Dom+Cologne", "price": "$$"},
        {"name": "Ehrenstrasse", "type": "Street Food", "rating": 4.3, "reviews": 2500, "description": "Trendy street with diverse food options. Great for casual international eats.", "booking_url": "https://www.google.com/maps/search/Ehrenstrasse+Cologne+Food", "price": "$$"}
    ],
    "frankfurt": [
        {"name": "Lafleur", "type": "French Fine Dining", "rating": 4.7, "reviews": 1500, "description": "Two Michelin stars in Palmengarten. Andreas Krolik's refined French cuisine.", "booking_url": "https://www.google.com/maps/search/Lafleur+Frankfurt", "price": "$$$$"},
        {"name": "Apfelwein Wagner", "type": "German Traditional", "rating": 4.4, "reviews": 3500, "description": "Traditional apple wine tavern in Sachsenhausen. Frankfurt classics.", "booking_url": "https://www.google.com/maps/search/Apfelwein+Wagner+Frankfurt", "price": "$$"},
        {"name": "Kleinmarkthalle", "type": "Market", "rating": 4.5, "reviews": 5500, "description": "Indoor food market with diverse stalls. Great for local specialties.", "booking_url": "https://www.google.com/maps/search/Kleinmarkthalle+Frankfurt", "price": "$$"}
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_6_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

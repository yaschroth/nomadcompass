#!/usr/bin/env python3
"""Batch 9: Final batch - Add restaurant data for remaining 72 cities."""
import json
import os

RESTAURANTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'restaurants.json')

BATCH_9_DATA = {
    "leuven": [
        {"name": "De Hoorn", "type": "Belgian", "rating": 4.6, "reviews": 1800, "description": "Historic brewery restaurant serving classic Belgian cuisine with their own craft beers.", "booking_url": "https://www.google.com/maps/search/De+Hoorn+Leuven", "price": "$$"},
        {"name": "De Werf", "type": "Mediterranean", "rating": 4.5, "reviews": 1200, "description": "Charming restaurant with courtyard seating and creative Mediterranean dishes.", "booking_url": "https://www.google.com/maps/search/De+Werf+Leuven", "price": "$$"},
        {"name": "Domus", "type": "Belgian", "rating": 4.4, "reviews": 2100, "description": "Student favorite brewing their own beer and serving hearty Belgian pub food.", "booking_url": "https://www.google.com/maps/search/Domus+Leuven", "price": "$$"}
    ],
    "luxembourg": [
        {"name": "Mosconi", "type": "Italian Fine Dining", "rating": 4.8, "reviews": 1400, "description": "Two Michelin star Italian restaurant with refined cuisine and elegant setting.", "booking_url": "https://www.google.com/maps/search/Mosconi+Luxembourg", "price": "$$$$"},
        {"name": "Bouquet Garni", "type": "French", "rating": 4.6, "reviews": 1100, "description": "Classic French cuisine in the old town with seasonal menus and fine wines.", "booking_url": "https://www.google.com/maps/search/Bouquet+Garni+Luxembourg", "price": "$$$"},
        {"name": "Brasserie Guillaume", "type": "French Brasserie", "rating": 4.4, "reviews": 1800, "description": "Popular brasserie on Place Guillaume with terrace seating and classic dishes.", "booking_url": "https://www.google.com/maps/search/Brasserie+Guillaume+Luxembourg", "price": "$$"}
    ],
    "nuremberg": [
        {"name": "Bratwurst Röslein", "type": "Franconian", "rating": 4.5, "reviews": 4200, "description": "Historic restaurant serving authentic Nuremberg bratwurst since 1431.", "booking_url": "https://www.google.com/maps/search/Bratwurst+Roslein+Nuremberg", "price": "$$"},
        {"name": "Restaurant Essigbrätlein", "type": "Fine Dining", "rating": 4.8, "reviews": 1100, "description": "Two Michelin star restaurant with innovative cuisine in a medieval setting.", "booking_url": "https://www.google.com/maps/search/Essigbratlein+Nuremberg", "price": "$$$$"},
        {"name": "Albrecht Dürer Stube", "type": "Franconian", "rating": 4.4, "reviews": 2400, "description": "Traditional Franconian restaurant near Dürer's house with rustic atmosphere.", "booking_url": "https://www.google.com/maps/search/Albrecht+Durer+Stube+Nuremberg", "price": "$$"}
    ],
    "stuttgart": [
        {"name": "Weinstube Fröhlich", "type": "Swabian", "rating": 4.6, "reviews": 1600, "description": "Traditional wine tavern serving Swabian specialties like Maultaschen and Spätzle.", "booking_url": "https://www.google.com/maps/search/Weinstube+Frohlich+Stuttgart", "price": "$$"},
        {"name": "Ochsen", "type": "German", "rating": 4.5, "reviews": 1900, "description": "Historic restaurant in a half-timbered building with regional cuisine.", "booking_url": "https://www.google.com/maps/search/Ochsen+Stuttgart", "price": "$$"},
        {"name": "Cube Restaurant", "type": "International", "rating": 4.4, "reviews": 2200, "description": "Modern restaurant atop the Kunstmuseum with stunning city views and creative cuisine.", "booking_url": "https://www.google.com/maps/search/Cube+Restaurant+Stuttgart", "price": "$$$"}
    ],
    "dusseldorf": [
        {"name": "Berens am Kai", "type": "Fine Dining", "rating": 4.7, "reviews": 1400, "description": "Michelin-starred restaurant in the Media Harbour with harbor views and refined cuisine.", "booking_url": "https://www.google.com/maps/search/Berens+am+Kai+Dusseldorf", "price": "$$$$"},
        {"name": "Brauerei Füchschen", "type": "German Brewpub", "rating": 4.5, "reviews": 3800, "description": "Traditional Altbier brewery with hearty German food and lively atmosphere.", "booking_url": "https://www.google.com/maps/search/Brauerei+Fuchschen+Dusseldorf", "price": "$$"},
        {"name": "Takumi", "type": "Japanese Ramen", "rating": 4.6, "reviews": 4200, "description": "Authentic Japanese ramen shop with long queues and exceptional tonkotsu broth.", "booking_url": "https://www.google.com/maps/search/Takumi+Dusseldorf", "price": "$$"}
    ],
    "freiburg": [
        {"name": "Wolfshöhle", "type": "German", "rating": 4.6, "reviews": 1200, "description": "Cozy restaurant with Black Forest specialties and extensive wine list.", "booking_url": "https://www.google.com/maps/search/Wolfshohle+Freiburg", "price": "$$$"},
        {"name": "Hausbrauerei Feierling", "type": "German Brewpub", "rating": 4.5, "reviews": 2100, "description": "Atmospheric brewpub with own beer garden and traditional German dishes.", "booking_url": "https://www.google.com/maps/search/Hausbrauerei+Feierling+Freiburg", "price": "$$"},
        {"name": "Martin's Bräu", "type": "German", "rating": 4.4, "reviews": 1800, "description": "Historic brewery restaurant near the Münster with regional cuisine.", "booking_url": "https://www.google.com/maps/search/Martins+Brau+Freiburg", "price": "$$"}
    ],
    "strasbourg": [
        {"name": "Maison Kammerzell", "type": "Alsatian", "rating": 4.5, "reviews": 5200, "description": "Iconic medieval building serving classic Alsatian cuisine like choucroute and tarte flambée.", "booking_url": "https://www.google.com/maps/search/Maison+Kammerzell+Strasbourg", "price": "$$$"},
        {"name": "Au Crocodile", "type": "French Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Michelin-starred restaurant with refined French cuisine in an elegant setting.", "booking_url": "https://www.google.com/maps/search/Au+Crocodile+Strasbourg", "price": "$$$$"},
        {"name": "Le Clou", "type": "Alsatian", "rating": 4.4, "reviews": 2400, "description": "Traditional winstub in the old town with authentic Alsatian specialties.", "booking_url": "https://www.google.com/maps/search/Le+Clou+Strasbourg", "price": "$$"}
    ],
    "grenoble": [
        {"name": "Le Fantin Latour", "type": "French", "rating": 4.7, "reviews": 1100, "description": "Michelin-starred restaurant with creative French cuisine using Alpine ingredients.", "booking_url": "https://www.google.com/maps/search/Le+Fantin+Latour+Grenoble", "price": "$$$$"},
        {"name": "La Ferme à Dédé", "type": "French", "rating": 4.5, "reviews": 1600, "description": "Rustic restaurant specializing in raclette, fondue, and mountain cuisine.", "booking_url": "https://www.google.com/maps/search/La+Ferme+a+Dede+Grenoble", "price": "$$"},
        {"name": "L'Épicurien", "type": "French Bistro", "rating": 4.4, "reviews": 900, "description": "Charming bistro with market-driven menu and excellent local wines.", "booking_url": "https://www.google.com/maps/search/L+Epicurien+Grenoble", "price": "$$"}
    ],
    "aixenprovence": [
        {"name": "Le Formal", "type": "French Fine Dining", "rating": 4.7, "reviews": 900, "description": "Michelin-starred restaurant in a 17th-century mansion with Provençal fine dining.", "booking_url": "https://www.google.com/maps/search/Le+Formal+Aix+en+Provence", "price": "$$$$"},
        {"name": "Le Petit Pierre", "type": "French", "rating": 4.6, "reviews": 1400, "description": "Cozy bistro with seasonal Provençal cuisine and charming atmosphere.", "booking_url": "https://www.google.com/maps/search/Le+Petit+Pierre+Aix+en+Provence", "price": "$$"},
        {"name": "Les Deux Garçons", "type": "French Café", "rating": 4.3, "reviews": 3200, "description": "Historic café on Cours Mirabeau where Cézanne once dined, serving classic dishes.", "booking_url": "https://www.google.com/maps/search/Les+Deux+Garcons+Aix+en+Provence", "price": "$$"}
    ],
    "chiangrai": [
        {"name": "Phu Lae", "type": "Northern Thai", "rating": 4.6, "reviews": 1800, "description": "Riverside restaurant with stunning views, traditional Lanna cuisine, and cultural shows.", "booking_url": "https://www.google.com/maps/search/Phu+Lae+Chiang+Rai", "price": "$$"},
        {"name": "Barrab", "type": "Thai Fusion", "rating": 4.5, "reviews": 1200, "description": "Creative restaurant in a garden setting with innovative Thai fusion dishes.", "booking_url": "https://www.google.com/maps/search/Barrab+Chiang+Rai", "price": "$$"},
        {"name": "Chivit Thamma Da", "type": "Café", "rating": 4.4, "reviews": 2400, "description": "British-style café on the riverbank with scones, high tea, and Thai dishes.", "booking_url": "https://www.google.com/maps/search/Chivit+Thamma+Da+Chiang+Rai", "price": "$$"}
    ],
    "pattaya": [
        {"name": "Mum Aroi", "type": "Thai Seafood", "rating": 4.5, "reviews": 3200, "description": "Seaside institution serving fresh seafood and Thai classics since 1974.", "booking_url": "https://www.google.com/maps/search/Mum+Aroi+Pattaya", "price": "$$"},
        {"name": "Mantra Restaurant", "type": "International", "rating": 4.6, "reviews": 2100, "description": "Upscale restaurant with multiple cuisines including Japanese, Indian, and Mediterranean.", "booking_url": "https://www.google.com/maps/search/Mantra+Restaurant+Pattaya", "price": "$$$"},
        {"name": "Café des Amis", "type": "French", "rating": 4.4, "reviews": 1400, "description": "Authentic French bistro with excellent wine selection and classic dishes.", "booking_url": "https://www.google.com/maps/search/Cafe+des+Amis+Pattaya", "price": "$$"}
    ],
    "khaolak": [
        {"name": "Smiley's Restaurant", "type": "Thai-International", "rating": 4.5, "reviews": 1600, "description": "Family-run restaurant with excellent Thai and Western dishes and warm hospitality.", "booking_url": "https://www.google.com/maps/search/Smileys+Restaurant+Khao+Lak", "price": "$$"},
        {"name": "Takieng", "type": "Thai", "rating": 4.6, "reviews": 1200, "description": "Authentic Thai restaurant at JW Marriott with refined Southern Thai cuisine.", "booking_url": "https://www.google.com/maps/search/Takieng+Khao+Lak", "price": "$$$"},
        {"name": "Krua Khao Lak", "type": "Thai Seafood", "rating": 4.4, "reviews": 900, "description": "Local favorite for fresh seafood, curries, and Thai home cooking.", "booking_url": "https://www.google.com/maps/search/Krua+Khao+Lak", "price": "$"}
    ],
    "kanchanaburi": [
        {"name": "On's Thai Isaan", "type": "Thai", "rating": 4.5, "reviews": 1400, "description": "Popular restaurant serving authentic Isaan and Thai dishes with river views.", "booking_url": "https://www.google.com/maps/search/Ons+Thai+Isaan+Kanchanaburi", "price": "$"},
        {"name": "Blue Rice Restaurant", "type": "Thai", "rating": 4.6, "reviews": 1100, "description": "Riverside restaurant with beautiful garden, Thai cuisine, and cooking classes.", "booking_url": "https://www.google.com/maps/search/Blue+Rice+Restaurant+Kanchanaburi", "price": "$$"},
        {"name": "Floating Restaurants", "type": "Thai Seafood", "rating": 4.4, "reviews": 2200, "description": "Iconic floating raft restaurants on the River Kwai with fresh fish and atmosphere.", "booking_url": "https://www.google.com/maps/search/Floating+Restaurant+Kanchanaburi", "price": "$$"}
    ],
    "sanur": [
        {"name": "Soul on the Beach", "type": "International", "rating": 4.6, "reviews": 1800, "description": "Beachfront restaurant with creative international cuisine and sunset cocktails.", "booking_url": "https://www.google.com/maps/search/Soul+on+the+Beach+Sanur", "price": "$$"},
        {"name": "Warung Baby Monkeys", "type": "Indonesian", "rating": 4.5, "reviews": 1400, "description": "Garden restaurant with authentic Indonesian dishes and homestyle cooking.", "booking_url": "https://www.google.com/maps/search/Warung+Baby+Monkeys+Sanur", "price": "$"},
        {"name": "Pregina Warung", "type": "Indonesian", "rating": 4.4, "reviews": 2100, "description": "Family-run warung with excellent nasi campur and traditional Balinese dishes.", "booking_url": "https://www.google.com/maps/search/Pregina+Warung+Sanur", "price": "$"}
    ],
    "solo": [
        {"name": "Adem Ayem", "type": "Javanese", "rating": 4.6, "reviews": 1800, "description": "Historic restaurant serving classic Solonese cuisine including nasi liwet.", "booking_url": "https://www.google.com/maps/search/Adem+Ayem+Solo", "price": "$"},
        {"name": "Soto Gading", "type": "Javanese", "rating": 4.5, "reviews": 2400, "description": "Famous for Solo's signature dish: soto with tender beef and creamy coconut broth.", "booking_url": "https://www.google.com/maps/search/Soto+Gading+Solo", "price": "$"},
        {"name": "Timlo Solo", "type": "Javanese", "rating": 4.4, "reviews": 1200, "description": "Traditional restaurant specializing in timlo soup with egg, chicken, and vegetables.", "booking_url": "https://www.google.com/maps/search/Timlo+Solo+Sastro", "price": "$"}
    ],
    "medan": [
        {"name": "Merdeka Walk", "type": "Street Food", "rating": 4.5, "reviews": 3200, "description": "Vibrant food court with diverse Medan specialties from satay to Chinese-Indonesian.", "booking_url": "https://www.google.com/maps/search/Merdeka+Walk+Medan", "price": "$"},
        {"name": "Bihun Bebek Asie", "type": "Chinese-Indonesian", "rating": 4.6, "reviews": 2100, "description": "Legendary duck noodle shop serving Medan's famous bihun bebek since 1945.", "booking_url": "https://www.google.com/maps/search/Bihun+Bebek+Asie+Medan", "price": "$"},
        {"name": "Soto Kesawan", "type": "Indonesian", "rating": 4.4, "reviews": 1600, "description": "Historic soto restaurant with rich coconut-based soup in the old colonial quarter.", "booking_url": "https://www.google.com/maps/search/Soto+Kesawan+Medan", "price": "$"}
    ],
    "makassar": [
        {"name": "Rumah Makan Lae Lae", "type": "Seafood", "rating": 4.6, "reviews": 2800, "description": "Waterfront seafood restaurant with grilled fish, crab, and Makassar specialties.", "booking_url": "https://www.google.com/maps/search/Rumah+Makan+Lae+Lae+Makassar", "price": "$$"},
        {"name": "Coto Nusantara", "type": "Indonesian", "rating": 4.5, "reviews": 2200, "description": "Famous for Makassar's signature coto soup with beef offal and rich peanut broth.", "booking_url": "https://www.google.com/maps/search/Coto+Nusantara+Makassar", "price": "$"},
        {"name": "Pallu Butung", "type": "Indonesian", "rating": 4.4, "reviews": 1400, "description": "Local favorite for pallubasa, a traditional beef soup with coconut milk.", "booking_url": "https://www.google.com/maps/search/Pallu+Butung+Makassar", "price": "$"}
    ],
    "kuching": [
        {"name": "Lepau", "type": "Sarawakian", "rating": 4.6, "reviews": 1800, "description": "Award-winning restaurant serving indigenous Dayak cuisine and Sarawakian specialties.", "booking_url": "https://www.google.com/maps/search/Lepau+Kuching", "price": "$$"},
        {"name": "Top Spot Food Court", "type": "Seafood", "rating": 4.5, "reviews": 3600, "description": "Rooftop seafood market where you pick live seafood and have it cooked fresh.", "booking_url": "https://www.google.com/maps/search/Top+Spot+Food+Court+Kuching", "price": "$$"},
        {"name": "Choon Hui Café", "type": "Malaysian", "rating": 4.4, "reviews": 1200, "description": "Classic kopitiam serving Sarawak laksa and kolo mee since 1949.", "booking_url": "https://www.google.com/maps/search/Choon+Hui+Cafe+Kuching", "price": "$"}
    ],
    "johorbahru": [
        {"name": "Kam Long Curry Fish Head", "type": "Malaysian", "rating": 4.5, "reviews": 2400, "description": "Famous for claypot curry fish head and Chinese-Malaysian dishes.", "booking_url": "https://www.google.com/maps/search/Kam+Long+Curry+Fish+Head+Johor+Bahru", "price": "$$"},
        {"name": "Kin Hwa Dim Sum", "type": "Chinese", "rating": 4.6, "reviews": 1800, "description": "Legendary dim sum restaurant with queues out the door every weekend.", "booking_url": "https://www.google.com/maps/search/Kin+Hwa+Dim+Sum+Johor+Bahru", "price": "$"},
        {"name": "Selera Senibong", "type": "Seafood", "rating": 4.4, "reviews": 2200, "description": "Seaside seafood haven with grilled stingray, chili crab, and satay.", "booking_url": "https://www.google.com/maps/search/Selera+Senibong+Johor+Bahru", "price": "$$"}
    ],
    "baguio": [
        {"name": "Café by the Ruins", "type": "Filipino", "rating": 4.5, "reviews": 4200, "description": "Iconic restaurant built around ruins serving organic Filipino cuisine and famous bread.", "booking_url": "https://www.google.com/maps/search/Cafe+by+the+Ruins+Baguio", "price": "$$"},
        {"name": "Oh My Gulay!", "type": "Vegetarian Filipino", "rating": 4.6, "reviews": 2400, "description": "Artistic multi-level restaurant with vegetarian Filipino food and stunning views.", "booking_url": "https://www.google.com/maps/search/Oh+My+Gulay+Baguio", "price": "$$"},
        {"name": "Good Taste", "type": "Chinese-Filipino", "rating": 4.3, "reviews": 3800, "description": "Budget favorite serving generous portions of Chinese-Filipino comfort food.", "booking_url": "https://www.google.com/maps/search/Good+Taste+Baguio", "price": "$"}
    ],
    "davao": [
        {"name": "Rekado", "type": "Filipino", "rating": 4.6, "reviews": 1800, "description": "Farm-to-table restaurant showcasing Davao's produce with refined Filipino cuisine.", "booking_url": "https://www.google.com/maps/search/Rekado+Davao", "price": "$$"},
        {"name": "Marina Tuna", "type": "Seafood", "rating": 4.5, "reviews": 2400, "description": "Famous for fresh tuna prepared multiple ways, from sashimi to grilled.", "booking_url": "https://www.google.com/maps/search/Marina+Tuna+Davao", "price": "$$"},
        {"name": "Claude's Le Café de Ville", "type": "French-Filipino", "rating": 4.4, "reviews": 1200, "description": "French-inspired café with pastries, continental cuisine, and elegant atmosphere.", "booking_url": "https://www.google.com/maps/search/Claudes+Cafe+de+Ville+Davao", "price": "$$"}
    ],
    "iloilo": [
        {"name": "Breakthrough Restaurant", "type": "Filipino", "rating": 4.5, "reviews": 1600, "description": "Ilonggo cuisine specialist with traditional dishes like KBL and fresh seafood.", "booking_url": "https://www.google.com/maps/search/Breakthrough+Restaurant+Iloilo", "price": "$$"},
        {"name": "Tatoy's Manokan & Seafood", "type": "Filipino Seafood", "rating": 4.6, "reviews": 2800, "description": "Legendary chicken inasal and seafood grill with waterfront dining.", "booking_url": "https://www.google.com/maps/search/Tatoys+Manokan+Iloilo", "price": "$$"},
        {"name": "Batchoy Deco", "type": "Filipino", "rating": 4.4, "reviews": 1200, "description": "Famous for authentic La Paz batchoy noodle soup with rich pork broth.", "booking_url": "https://www.google.com/maps/search/Batchoy+Deco+Iloilo", "price": "$"}
    ],
    "cantho": [
        {"name": "Nem Nướng Thanh Vân", "type": "Vietnamese", "rating": 4.5, "reviews": 1400, "description": "Famous for grilled pork rolls wrapped in rice paper with fresh herbs.", "booking_url": "https://www.google.com/maps/search/Nem+Nuong+Thanh+Van+Can+Tho", "price": "$"},
        {"name": "Nam Bộ Restaurant", "type": "Vietnamese", "rating": 4.6, "reviews": 1100, "description": "Riverside restaurant specializing in Mekong Delta cuisine and river fish.", "booking_url": "https://www.google.com/maps/search/Nam+Bo+Restaurant+Can+Tho", "price": "$$"},
        {"name": "Hồng Phát", "type": "Chinese-Vietnamese", "rating": 4.4, "reviews": 900, "description": "Long-standing restaurant with Chinese-Vietnamese dishes and dim sum.", "booking_url": "https://www.google.com/maps/search/Hong+Phat+Can+Tho", "price": "$"}
    ],
    "hue": [
        {"name": "Ancient Hue", "type": "Vietnamese", "rating": 4.7, "reviews": 3200, "description": "Garden restaurant in a royal setting serving imperial Hue cuisine with cultural shows.", "booking_url": "https://www.google.com/maps/search/Ancient+Hue+Restaurant", "price": "$$"},
        {"name": "Madam Thu", "type": "Vietnamese", "rating": 4.5, "reviews": 2400, "description": "Local favorite for authentic bánh khoái (Hue-style crispy pancake) and bún bò Huế.", "booking_url": "https://www.google.com/maps/search/Madam+Thu+Restaurant+Hue", "price": "$"},
        {"name": "Les Jardins de La Carambole", "type": "Vietnamese-French", "rating": 4.6, "reviews": 1800, "description": "Elegant garden restaurant with French-Vietnamese fusion in a colonial villa.", "booking_url": "https://www.google.com/maps/search/Les+Jardins+Carambole+Hue", "price": "$$$"}
    ],
    "ninhbinh": [
        {"name": "Nhà Hàng Trường Xuân", "type": "Vietnamese", "rating": 4.5, "reviews": 800, "description": "Local restaurant with goat meat specialties and traditional Vietnamese dishes.", "booking_url": "https://www.google.com/maps/search/Truong+Xuan+Restaurant+Ninh+Binh", "price": "$"},
        {"name": "Chookie's Beer Garden", "type": "International", "rating": 4.4, "reviews": 600, "description": "Backpacker-friendly spot with Western and Vietnamese food and cold beers.", "booking_url": "https://www.google.com/maps/search/Chookies+Beer+Garden+Ninh+Binh", "price": "$"},
        {"name": "Thung Nham Eco Restaurant", "type": "Vietnamese", "rating": 4.3, "reviews": 500, "description": "Scenic restaurant amid rice paddies serving local specialties and fresh fish.", "booking_url": "https://www.google.com/maps/search/Thung+Nham+Restaurant+Ninh+Binh", "price": "$$"}
    ],
    "vangvieng": [
        {"name": "Vang Vieng Restaurant", "type": "Lao", "rating": 4.4, "reviews": 900, "description": "Riverside restaurant with traditional Lao dishes and scenic karst views.", "booking_url": "https://www.google.com/maps/search/Vang+Vieng+Restaurant", "price": "$"},
        {"name": "Gary's Irish Bar", "type": "International", "rating": 4.3, "reviews": 1200, "description": "Popular expat hangout with Western food, sports, and lively atmosphere.", "booking_url": "https://www.google.com/maps/search/Garys+Irish+Bar+Vang+Vieng", "price": "$$"},
        {"name": "Amigo's Mexican", "type": "Mexican", "rating": 4.5, "reviews": 800, "description": "Surprisingly authentic Mexican food with tacos, burritos, and margaritas.", "booking_url": "https://www.google.com/maps/search/Amigos+Mexican+Vang+Vieng", "price": "$$"}
    ],
    "sihanoukville": [
        {"name": "Sandan Restaurant", "type": "Khmer", "rating": 4.5, "reviews": 1100, "description": "Social enterprise training disadvantaged youth while serving excellent Khmer cuisine.", "booking_url": "https://www.google.com/maps/search/Sandan+Restaurant+Sihanoukville", "price": "$$"},
        {"name": "Holy Crab", "type": "Seafood", "rating": 4.4, "reviews": 800, "description": "Beachfront seafood restaurant famous for crab dishes and fresh catches.", "booking_url": "https://www.google.com/maps/search/Holy+Crab+Sihanoukville", "price": "$$"},
        {"name": "Treasure Island Seafood", "type": "Seafood", "rating": 4.3, "reviews": 1400, "description": "Beach restaurant with pick-your-own seafood and relaxed island vibes.", "booking_url": "https://www.google.com/maps/search/Treasure+Island+Seafood+Sihanoukville", "price": "$$"}
    ],
    "battambang": [
        {"name": "Jaan Bai", "type": "Khmer Fusion", "rating": 4.6, "reviews": 1800, "description": "Social enterprise restaurant with creative Khmer cuisine and hospitality training.", "booking_url": "https://www.google.com/maps/search/Jaan+Bai+Battambang", "price": "$$"},
        {"name": "Pomme d'Amour", "type": "French", "rating": 4.5, "reviews": 900, "description": "Charming French restaurant with quality steaks, wines, and colonial atmosphere.", "booking_url": "https://www.google.com/maps/search/Pomme+Amour+Battambang", "price": "$$"},
        {"name": "Lonely Tree Café", "type": "Café", "rating": 4.4, "reviews": 700, "description": "Riverside café with excellent coffee, light meals, and peaceful garden setting.", "booking_url": "https://www.google.com/maps/search/Lonely+Tree+Cafe+Battambang", "price": "$"}
    ],
    "hiroshima": [
        {"name": "Nagataya", "type": "Japanese", "rating": 4.6, "reviews": 2800, "description": "Famous for Hiroshima-style okonomiyaki with layers of noodles since 1949.", "booking_url": "https://www.google.com/maps/search/Nagataya+Hiroshima", "price": "$"},
        {"name": "Okonomi-mura", "type": "Japanese", "rating": 4.5, "reviews": 4200, "description": "Four-floor building with dozens of okonomiyaki stalls, each with unique recipes.", "booking_url": "https://www.google.com/maps/search/Okonomimura+Hiroshima", "price": "$"},
        {"name": "Kakifune Kanawa", "type": "Japanese Seafood", "rating": 4.7, "reviews": 1600, "description": "Floating restaurant specializing in Miyajima oysters prepared every way imaginable.", "booking_url": "https://www.google.com/maps/search/Kakifune+Kanawa+Hiroshima", "price": "$$$"}
    ],
    "kanazawa": [
        {"name": "Omicho Market", "type": "Market", "rating": 4.7, "reviews": 5800, "description": "Historic market with seafood stalls, sushi counters, and fresh Noto Peninsula catches.", "booking_url": "https://www.google.com/maps/search/Omicho+Market+Kanazawa", "price": "$$"},
        {"name": "Tamazushi", "type": "Sushi", "rating": 4.6, "reviews": 1400, "description": "Edomae-style sushi with exceptional local fish in an intimate counter setting.", "booking_url": "https://www.google.com/maps/search/Tamazushi+Kanazawa", "price": "$$$"},
        {"name": "Kaga Cuisine Kaname", "type": "Japanese", "rating": 4.5, "reviews": 900, "description": "Traditional Kaga cuisine featuring local specialties like jibuni duck stew.", "booking_url": "https://www.google.com/maps/search/Kaname+Kanazawa", "price": "$$$"}
    ],
    "kaohsiung": [
        {"name": "Liuhe Night Market", "type": "Night Market", "rating": 4.5, "reviews": 8200, "description": "Famous night market with seafood, papaya milk, and endless Taiwanese street food.", "booking_url": "https://www.google.com/maps/search/Liuhe+Night+Market+Kaohsiung", "price": "$"},
        {"name": "Old New Restaurant", "type": "Taiwanese", "rating": 4.6, "reviews": 1200, "description": "Modern Taiwanese cuisine with creative presentations and local ingredients.", "booking_url": "https://www.google.com/maps/search/Old+New+Restaurant+Kaohsiung", "price": "$$"},
        {"name": "Pier 2 Art District Cafés", "type": "Café", "rating": 4.4, "reviews": 2400, "description": "Waterfront area with creative cafés, craft beer, and harbor views.", "booking_url": "https://www.google.com/maps/search/Pier+2+Art+District+Kaohsiung", "price": "$$"}
    ],
    "tainan": [
        {"name": "Du Hsiao Yueh", "type": "Taiwanese", "rating": 4.5, "reviews": 4800, "description": "Legendary noodle shop serving signature tan-tzu noodles since 1895.", "booking_url": "https://www.google.com/maps/search/Du+Hsiao+Yueh+Tainan", "price": "$"},
        {"name": "A-Sha Chinese Noodles", "type": "Taiwanese", "rating": 4.6, "reviews": 2100, "description": "Famous for unique noodle dishes and classic Tainan comfort food.", "booking_url": "https://www.google.com/maps/search/A+Sha+Noodles+Tainan", "price": "$"},
        {"name": "Chihkan Lou Salty Rice Pudding", "type": "Taiwanese", "rating": 4.4, "reviews": 1800, "description": "Historic shop near Chihkan Tower serving savory rice pudding since 1958.", "booking_url": "https://www.google.com/maps/search/Chihkan+Salty+Rice+Pudding+Tainan", "price": "$"}
    ],
    "gwangju": [
        {"name": "Gwangju Mudeungsan Samgyetang", "type": "Korean", "rating": 4.5, "reviews": 1400, "description": "Famous for hearty chicken ginseng soup with traditional preparations.", "booking_url": "https://www.google.com/maps/search/Mudeungsan+Samgyetang+Gwangju", "price": "$$"},
        {"name": "1913 Songjeong Station Market", "type": "Market", "rating": 4.6, "reviews": 2800, "description": "Renovated historic market with food stalls, cafés, and local specialties.", "booking_url": "https://www.google.com/maps/search/1913+Songjeong+Market+Gwangju", "price": "$"},
        {"name": "Dolgorae Baekban", "type": "Korean", "rating": 4.4, "reviews": 1100, "description": "Traditional Korean set meal restaurant with banchan and homestyle cooking.", "booking_url": "https://www.google.com/maps/search/Dolgorae+Baekban+Gwangju", "price": "$"}
    ],
    "daegu": [
        {"name": "Seomun Market", "type": "Market", "rating": 4.6, "reviews": 4200, "description": "Massive traditional market with food alleys, flat dumplings, and local specialties.", "booking_url": "https://www.google.com/maps/search/Seomun+Market+Daegu", "price": "$"},
        {"name": "Dongin-dong Jjimdak Alley", "type": "Korean", "rating": 4.5, "reviews": 2800, "description": "Alley of restaurants serving Daegu's signature braised chicken dish.", "booking_url": "https://www.google.com/maps/search/Dongin+dong+Jjimdak+Daegu", "price": "$$"},
        {"name": "Ttaro Gukbap", "type": "Korean", "rating": 4.4, "reviews": 1600, "description": "Specialty restaurant for Daegu-style beef soup with rice served separately.", "booking_url": "https://www.google.com/maps/search/Ttaro+Gukbap+Daegu", "price": "$"}
    ],
    "sandiego": [
        {"name": "Juniper & Ivy", "type": "New American", "rating": 4.7, "reviews": 3800, "description": "Richard Blais's Little Italy restaurant with creative American cuisine and craft cocktails.", "booking_url": "https://www.google.com/maps/search/Juniper+Ivy+San+Diego", "price": "$$$"},
        {"name": "Tacos El Gordo", "type": "Mexican", "rating": 4.6, "reviews": 8200, "description": "Tijuana-style taco shop with adobada al pastor and legendary carne asada.", "booking_url": "https://www.google.com/maps/search/Tacos+El+Gordo+San+Diego", "price": "$"},
        {"name": "The Fish Market", "type": "Seafood", "rating": 4.5, "reviews": 5400, "description": "Waterfront institution with fresh seafood, sushi, and harbor views since 1979.", "booking_url": "https://www.google.com/maps/search/The+Fish+Market+San+Diego", "price": "$$$"}
    ],
    "losangeles": [
        {"name": "Bestia", "type": "Italian", "rating": 4.7, "reviews": 9200, "description": "Arts District powerhouse with housemade pastas, salumi, and industrial-chic vibes.", "booking_url": "https://www.google.com/maps/search/Bestia+Los+Angeles", "price": "$$$"},
        {"name": "Guerrilla Tacos", "type": "Mexican", "rating": 4.6, "reviews": 4800, "description": "Elevated tacos from Chef Wes Avila with seasonal ingredients and bold flavors.", "booking_url": "https://www.google.com/maps/search/Guerrilla+Tacos+Los+Angeles", "price": "$$"},
        {"name": "Republique", "type": "French-Californian", "rating": 4.5, "reviews": 6200, "description": "All-day café in a historic building with exceptional pastries and French-California cuisine.", "booking_url": "https://www.google.com/maps/search/Republique+Los+Angeles", "price": "$$$"}
    ],
    "newyork": [
        {"name": "Katz's Delicatessen", "type": "Jewish Deli", "rating": 4.5, "reviews": 24000, "description": "Iconic Lower East Side deli serving legendary pastrami sandwiches since 1888.", "booking_url": "https://www.google.com/maps/search/Katzs+Delicatessen+New+York", "price": "$$"},
        {"name": "Le Bernardin", "type": "French Seafood", "rating": 4.8, "reviews": 4200, "description": "Three Michelin star temple of seafood with impeccable service and refined cuisine.", "booking_url": "https://www.google.com/maps/search/Le+Bernardin+New+York", "price": "$$$$"},
        {"name": "Xi'an Famous Foods", "type": "Chinese", "rating": 4.6, "reviews": 8400, "description": "Hand-pulled noodles and spicy cumin lamb from Xi'an in multiple locations.", "booking_url": "https://www.google.com/maps/search/Xian+Famous+Foods+New+York", "price": "$"}
    ],
    "chicago": [
        {"name": "Alinea", "type": "Fine Dining", "rating": 4.8, "reviews": 3800, "description": "Three Michelin star molecular gastronomy experience from Chef Grant Achatz.", "booking_url": "https://www.google.com/maps/search/Alinea+Chicago", "price": "$$$$"},
        {"name": "Portillo's", "type": "American", "rating": 4.5, "reviews": 12000, "description": "Chicago institution for Italian beef sandwiches, Chicago-style hot dogs, and chocolate cake.", "booking_url": "https://www.google.com/maps/search/Portillos+Chicago", "price": "$"},
        {"name": "Girl & The Goat", "type": "New American", "rating": 4.6, "reviews": 5200, "description": "Stephanie Izard's flagship with bold flavors and the famous goat empanadas.", "booking_url": "https://www.google.com/maps/search/Girl+and+Goat+Chicago", "price": "$$$"}
    ],
    "boston": [
        {"name": "Neptune Oyster", "type": "Seafood", "rating": 4.7, "reviews": 4800, "description": "Tiny North End gem with legendary lobster rolls and pristine raw bar.", "booking_url": "https://www.google.com/maps/search/Neptune+Oyster+Boston", "price": "$$$"},
        {"name": "Oleana", "type": "Mediterranean", "rating": 4.6, "reviews": 2400, "description": "Chef Ana Sortun's Eastern Mediterranean restaurant with bold spices and farm ingredients.", "booking_url": "https://www.google.com/maps/search/Oleana+Boston", "price": "$$$"},
        {"name": "Mike's Pastry", "type": "Italian Bakery", "rating": 4.4, "reviews": 18000, "description": "North End institution famous for enormous cannoli and Italian pastries.", "booking_url": "https://www.google.com/maps/search/Mikes+Pastry+Boston", "price": "$"}
    ],
    "nashville": [
        {"name": "Prince's Hot Chicken", "type": "American Southern", "rating": 4.5, "reviews": 6200, "description": "The originator of Nashville hot chicken since 1945, still family-run and fiery.", "booking_url": "https://www.google.com/maps/search/Princes+Hot+Chicken+Nashville", "price": "$"},
        {"name": "Husk", "type": "Southern", "rating": 4.6, "reviews": 4400, "description": "Sean Brock's celebration of Southern ingredients in a beautiful historic house.", "booking_url": "https://www.google.com/maps/search/Husk+Nashville", "price": "$$$"},
        {"name": "The Catbird Seat", "type": "Fine Dining", "rating": 4.8, "reviews": 1200, "description": "Counter-seating tasting menu experience with innovative cuisine and intimate setting.", "booking_url": "https://www.google.com/maps/search/Catbird+Seat+Nashville", "price": "$$$$"}
    ],
    "calgary": [
        {"name": "River Café", "type": "Canadian", "rating": 4.6, "reviews": 2400, "description": "Iconic restaurant on Prince's Island with regional Canadian cuisine and river views.", "booking_url": "https://www.google.com/maps/search/River+Cafe+Calgary", "price": "$$$"},
        {"name": "Charcut Roast House", "type": "Canadian", "rating": 4.5, "reviews": 2800, "description": "Nose-to-tail butcher-focused restaurant with Alberta beef and house charcuterie.", "booking_url": "https://www.google.com/maps/search/Charcut+Roast+House+Calgary", "price": "$$$"},
        {"name": "Tubby Dog", "type": "Hot Dogs", "rating": 4.4, "reviews": 1800, "description": "Cult hot dog joint with creative toppings and late-night vibes.", "booking_url": "https://www.google.com/maps/search/Tubby+Dog+Calgary", "price": "$"}
    ],
    "victoria": [
        {"name": "Brasserie L'École", "type": "French", "rating": 4.7, "reviews": 1800, "description": "Authentic French bistro in Chinatown with classic dishes and natural wines.", "booking_url": "https://www.google.com/maps/search/Brasserie+Ecole+Victoria", "price": "$$$"},
        {"name": "Red Fish Blue Fish", "type": "Seafood", "rating": 4.5, "reviews": 3200, "description": "Waterfront shipping container serving sustainable seafood and fish tacos.", "booking_url": "https://www.google.com/maps/search/Red+Fish+Blue+Fish+Victoria", "price": "$$"},
        {"name": "Ferris' Oyster Bar", "type": "Seafood", "rating": 4.6, "reviews": 2100, "description": "Underground oyster bar with local BC oysters and classic seafood dishes.", "booking_url": "https://www.google.com/maps/search/Ferris+Oyster+Bar+Victoria", "price": "$$$"}
    ],
    "ottawa": [
        {"name": "Atelier", "type": "Fine Dining", "rating": 4.8, "reviews": 1200, "description": "Multi-course molecular gastronomy experience in an intimate 24-seat space.", "booking_url": "https://www.google.com/maps/search/Atelier+Ottawa", "price": "$$$$"},
        {"name": "ByWard Market", "type": "Market", "rating": 4.5, "reviews": 6800, "description": "Historic outdoor market with food vendors, BeaverTails, and local specialties.", "booking_url": "https://www.google.com/maps/search/ByWard+Market+Ottawa", "price": "$"},
        {"name": "Beckta", "type": "Canadian", "rating": 4.6, "reviews": 1600, "description": "Refined Canadian cuisine in an elegant townhouse with exceptional wine program.", "booking_url": "https://www.google.com/maps/search/Beckta+Ottawa", "price": "$$$"}
    ],
    "cancun": [
        {"name": "Lorenzillo's", "type": "Seafood", "rating": 4.5, "reviews": 4800, "description": "Waterfront lobster house with live tanks and Caribbean seafood since 1987.", "booking_url": "https://www.google.com/maps/search/Lorenzillos+Cancun", "price": "$$$"},
        {"name": "Puerto Madero", "type": "Steakhouse", "rating": 4.6, "reviews": 3200, "description": "Upscale steakhouse with Argentine beef, lagoon views, and romantic atmosphere.", "booking_url": "https://www.google.com/maps/search/Puerto+Madero+Cancun", "price": "$$$$"},
        {"name": "La Habichuela", "type": "Mexican", "rating": 4.7, "reviews": 5400, "description": "Maya-inspired cuisine in a garden setting with cochinita pibil and Mayan coffee.", "booking_url": "https://www.google.com/maps/search/La+Habichuela+Cancun", "price": "$$$"}
    ],
    "queretaro": [
        {"name": "1810 Restaurante", "type": "Mexican", "rating": 4.6, "reviews": 1800, "description": "Upscale Mexican in a historic building with traditional dishes and modern touches.", "booking_url": "https://www.google.com/maps/search/1810+Restaurante+Queretaro", "price": "$$$"},
        {"name": "La Mariposa", "type": "Mexican", "rating": 4.5, "reviews": 2400, "description": "Colonial-era restaurant serving breakfast classics and traditional Mexican dishes.", "booking_url": "https://www.google.com/maps/search/La+Mariposa+Queretaro", "price": "$$"},
        {"name": "Tikua Sur", "type": "Mexican Contemporary", "rating": 4.7, "reviews": 1200, "description": "Modern Mexican with indigenous ingredients and innovative techniques.", "booking_url": "https://www.google.com/maps/search/Tikua+Sur+Queretaro", "price": "$$$"}
    ],
    "mazatlan": [
        {"name": "Pedro y Lola", "type": "Mexican", "rating": 4.6, "reviews": 2800, "description": "Historic center gem with refined Mexican cuisine and mezcal cocktails.", "booking_url": "https://www.google.com/maps/search/Pedro+y+Lola+Mazatlan", "price": "$$$"},
        {"name": "El Muchacho Alegre", "type": "Seafood", "rating": 4.5, "reviews": 3200, "description": "Legendary seafood spot for aguachile, ceviches, and fresh catches since 1980.", "booking_url": "https://www.google.com/maps/search/El+Muchacho+Alegre+Mazatlan", "price": "$$"},
        {"name": "Topolo", "type": "Mexican", "rating": 4.4, "reviews": 1600, "description": "Malecón restaurant with ocean views, tacos, and traditional Sinaloan dishes.", "booking_url": "https://www.google.com/maps/search/Topolo+Mazatlan", "price": "$$"}
    ],
    "leon": [
        {"name": "La Estancia Argentina", "type": "Steakhouse", "rating": 4.5, "reviews": 1400, "description": "Premium steakhouse with Argentine cuts and traditional grilling methods.", "booking_url": "https://www.google.com/maps/search/La+Estancia+Argentina+Leon+Mexico", "price": "$$$"},
        {"name": "El Molinito", "type": "Mexican", "rating": 4.4, "reviews": 1800, "description": "Traditional restaurant with regional Guanajuato dishes and family recipes.", "booking_url": "https://www.google.com/maps/search/El+Molinito+Leon+Mexico", "price": "$$"},
        {"name": "Pangea", "type": "International", "rating": 4.6, "reviews": 1100, "description": "Modern restaurant with creative fusion cuisine and stylish atmosphere.", "booking_url": "https://www.google.com/maps/search/Pangea+Leon+Mexico", "price": "$$$"}
    ],
    "manizales": [
        {"name": "Helena", "type": "Colombian", "rating": 4.6, "reviews": 800, "description": "Refined Colombian cuisine with coffee region ingredients and stunning mountain views.", "booking_url": "https://www.google.com/maps/search/Helena+Restaurante+Manizales", "price": "$$$"},
        {"name": "El Cable Parilla", "type": "Steakhouse", "rating": 4.5, "reviews": 1200, "description": "Popular grill restaurant with quality meats and traditional Colombian sides.", "booking_url": "https://www.google.com/maps/search/El+Cable+Parilla+Manizales", "price": "$$"},
        {"name": "Café San Alberto", "type": "Café", "rating": 4.4, "reviews": 900, "description": "Specialty coffee experience from one of Colombia's top coffee producers.", "booking_url": "https://www.google.com/maps/search/Cafe+San+Alberto+Manizales", "price": "$$"}
    ],
    "pereira": [
        {"name": "Donde Hugo", "type": "Colombian", "rating": 4.5, "reviews": 1100, "description": "Traditional Paisa restaurant with bandeja paisa and regional specialties.", "booking_url": "https://www.google.com/maps/search/Donde+Hugo+Pereira+Colombia", "price": "$$"},
        {"name": "Don Juaco", "type": "Steakhouse", "rating": 4.6, "reviews": 900, "description": "Popular grill with Colombian beef, chorizo, and generous portions.", "booking_url": "https://www.google.com/maps/search/Don+Juaco+Pereira", "price": "$$"},
        {"name": "Ritual del Buen Comer", "type": "Colombian Contemporary", "rating": 4.4, "reviews": 600, "description": "Modern Colombian cuisine with coffee country influences.", "booking_url": "https://www.google.com/maps/search/Ritual+Buen+Comer+Pereira", "price": "$$"}
    ],
    "barranquilla": [
        {"name": "Arabe Internacional", "type": "Middle Eastern", "rating": 4.5, "reviews": 2200, "description": "Institution serving Lebanese-Colombian cuisine reflecting the city's Arab heritage.", "booking_url": "https://www.google.com/maps/search/Arabe+Internacional+Barranquilla", "price": "$$"},
        {"name": "La Cueva", "type": "Colombian Seafood", "rating": 4.6, "reviews": 3100, "description": "Legendary spot with Caribbean seafood and the atmosphere of García Márquez's era.", "booking_url": "https://www.google.com/maps/search/La+Cueva+Barranquilla", "price": "$$"},
        {"name": "Narcobollo", "type": "Colombian", "rating": 4.4, "reviews": 1800, "description": "Famous for bollo de yuca and traditional Caribbean Colombian dishes.", "booking_url": "https://www.google.com/maps/search/Narcobollo+Barranquilla", "price": "$"}
    ],
    "guayaquil": [
        {"name": "Lo Nuestro", "type": "Ecuadorian", "rating": 4.6, "reviews": 2400, "description": "Traditional coastal Ecuadorian cuisine with ceviches and seafood in Las Peñas.", "booking_url": "https://www.google.com/maps/search/Lo+Nuestro+Guayaquil", "price": "$$"},
        {"name": "Casa Julian", "type": "International", "rating": 4.5, "reviews": 1600, "description": "Elegant restaurant in Samborondón with contemporary cuisine and wine bar.", "booking_url": "https://www.google.com/maps/search/Casa+Julian+Guayaquil", "price": "$$$"},
        {"name": "Red Crab", "type": "Seafood", "rating": 4.4, "reviews": 2800, "description": "Famous for crab dishes prepared multiple ways including the signature cangrejo al ajillo.", "booking_url": "https://www.google.com/maps/search/Red+Crab+Guayaquil", "price": "$$"}
    ],
    "trujillo": [
        {"name": "El Mochica", "type": "Peruvian", "rating": 4.6, "reviews": 1800, "description": "Traditional Trujillano cuisine with ceviches, fish dishes, and regional specialties.", "booking_url": "https://www.google.com/maps/search/El+Mochica+Trujillo+Peru", "price": "$$"},
        {"name": "Restaurant Romano", "type": "Peruvian", "rating": 4.5, "reviews": 2200, "description": "Historic restaurant in the center serving northern Peruvian coastal cuisine.", "booking_url": "https://www.google.com/maps/search/Restaurant+Romano+Trujillo+Peru", "price": "$$"},
        {"name": "Café Amaretto", "type": "Café", "rating": 4.4, "reviews": 1200, "description": "Popular café in the historic center with coffee, sandwiches, and desserts.", "booking_url": "https://www.google.com/maps/search/Cafe+Amaretto+Trujillo+Peru", "price": "$"}
    ],
    "rosario": [
        {"name": "Restaurant Escauriza", "type": "Argentine", "rating": 4.6, "reviews": 1800, "description": "Classic parrilla with premium Argentine beef and traditional preparations.", "booking_url": "https://www.google.com/maps/search/Restaurant+Escauriza+Rosario", "price": "$$$"},
        {"name": "Davis", "type": "International", "rating": 4.5, "reviews": 1400, "description": "Riverside restaurant with river views, creative cuisine, and extensive wine list.", "booking_url": "https://www.google.com/maps/search/Davis+Restaurant+Rosario", "price": "$$$"},
        {"name": "La Estancia", "type": "Steakhouse", "rating": 4.4, "reviews": 2200, "description": "Popular grill house with quality beef cuts and family atmosphere.", "booking_url": "https://www.google.com/maps/search/La+Estancia+Rosario+Argentina", "price": "$$"}
    ],
    "mardelplata": [
        {"name": "El Viejo Pop", "type": "Seafood", "rating": 4.5, "reviews": 3200, "description": "Port institution with fresh fish, rabas (fried squid), and ocean views.", "booking_url": "https://www.google.com/maps/search/El+Viejo+Pop+Mar+del+Plata", "price": "$$"},
        {"name": "Montecatini", "type": "Italian", "rating": 4.6, "reviews": 1800, "description": "Classic Italian with homemade pastas and seafood in a traditional setting.", "booking_url": "https://www.google.com/maps/search/Montecatini+Mar+del+Plata", "price": "$$"},
        {"name": "Chichilo", "type": "Seafood", "rating": 4.4, "reviews": 2400, "description": "Famous for cazuela de mariscos (seafood stew) and fresh catches of the day.", "booking_url": "https://www.google.com/maps/search/Chichilo+Mar+del+Plata", "price": "$$"}
    ],
    "recife": [
        {"name": "Leite", "type": "Brazilian", "rating": 4.6, "reviews": 2800, "description": "Oldest restaurant in Brazil (1882) with classic Pernambuco cuisine.", "booking_url": "https://www.google.com/maps/search/Restaurante+Leite+Recife", "price": "$$$"},
        {"name": "Oficina do Sabor", "type": "Brazilian", "rating": 4.5, "reviews": 3400, "description": "Creative Northeastern Brazilian cuisine in colorful Olinda with stunning views.", "booking_url": "https://www.google.com/maps/search/Oficina+do+Sabor+Recife", "price": "$$"},
        {"name": "Parraxaxá", "type": "Brazilian Buffet", "rating": 4.4, "reviews": 4200, "description": "Massive buffet of regional Northeastern dishes including baião de dois and carne de sol.", "booking_url": "https://www.google.com/maps/search/Parraxaxa+Recife", "price": "$$"}
    ],
    "luxor": [
        {"name": "Sofra", "type": "Egyptian", "rating": 4.5, "reviews": 2800, "description": "Rooftop restaurant with Nile views serving traditional Egyptian cuisine.", "booking_url": "https://www.google.com/maps/search/Sofra+Restaurant+Luxor", "price": "$$"},
        {"name": "Al-Sahaby Lane", "type": "Egyptian", "rating": 4.4, "reviews": 1800, "description": "Hidden gem in the souq with authentic Egyptian dishes and local atmosphere.", "booking_url": "https://www.google.com/maps/search/Al+Sahaby+Lane+Luxor", "price": "$"},
        {"name": "1886 Restaurant", "type": "International", "rating": 4.6, "reviews": 1200, "description": "Elegant dining at the Winter Palace with French-Egyptian cuisine.", "booking_url": "https://www.google.com/maps/search/1886+Restaurant+Luxor", "price": "$$$"}
    ],
    "alexandria": [
        {"name": "Fish Market", "type": "Seafood", "rating": 4.5, "reviews": 4200, "description": "Pick your fresh fish from the display and have it grilled Mediterranean style.", "booking_url": "https://www.google.com/maps/search/Fish+Market+Alexandria+Egypt", "price": "$$"},
        {"name": "Mohamed Ahmed", "type": "Egyptian", "rating": 4.4, "reviews": 3600, "description": "Legendary foul and falafel spot serving Alexandrian breakfast since 1973.", "booking_url": "https://www.google.com/maps/search/Mohamed+Ahmed+Alexandria", "price": "$"},
        {"name": "Abou El Sid", "type": "Egyptian", "rating": 4.6, "reviews": 1800, "description": "Traditional Egyptian cuisine in an Orient-style setting with classic dishes.", "booking_url": "https://www.google.com/maps/search/Abou+El+Sid+Alexandria", "price": "$$"}
    ],
    "capeverde": [
        {"name": "Kebra Cabana", "type": "Cape Verdean", "rating": 4.5, "reviews": 600, "description": "Traditional Cape Verdean cuisine with cachupa and fresh seafood.", "booking_url": "https://www.google.com/maps/search/Kebra+Cabana+Praia+Cape+Verde", "price": "$$"},
        {"name": "Quintal da Musica", "type": "Cape Verdean", "rating": 4.4, "reviews": 500, "description": "Live music venue with traditional dishes and local Cape Verdean atmosphere.", "booking_url": "https://www.google.com/maps/search/Quintal+da+Musica+Praia", "price": "$$"},
        {"name": "Avis Rara", "type": "International", "rating": 4.3, "reviews": 400, "description": "Fusion restaurant with Portuguese-African influences and ocean views.", "booking_url": "https://www.google.com/maps/search/Avis+Rara+Praia+Cape+Verde", "price": "$$"}
    ],
    "windhoek": [
        {"name": "Joe's Beerhouse", "type": "Namibian", "rating": 4.5, "reviews": 4200, "description": "Legendary restaurant with game meats, craft beers, and incredible atmosphere.", "booking_url": "https://www.google.com/maps/search/Joes+Beerhouse+Windhoek", "price": "$$"},
        {"name": "The Stellenbosch Wine Bar", "type": "International", "rating": 4.6, "reviews": 1400, "description": "Fine dining with South African wines and contemporary cuisine.", "booking_url": "https://www.google.com/maps/search/Stellenbosch+Wine+Bar+Windhoek", "price": "$$$"},
        {"name": "Namibian Breweries", "type": "German-Namibian", "rating": 4.4, "reviews": 1800, "description": "Brewery restaurant with German-influenced dishes and fresh Windhoek lager.", "booking_url": "https://www.google.com/maps/search/Namibian+Breweries+Windhoek", "price": "$$"}
    ],
    "kampala": [
        {"name": "Café Javas", "type": "International", "rating": 4.4, "reviews": 3200, "description": "Popular chain with excellent coffee, generous portions, and reliable food.", "booking_url": "https://www.google.com/maps/search/Cafe+Javas+Kampala", "price": "$$"},
        {"name": "The Lawns", "type": "International", "rating": 4.5, "reviews": 1800, "description": "Garden restaurant at Emin Pasha Hotel with refined cuisine and cocktails.", "booking_url": "https://www.google.com/maps/search/The+Lawns+Kampala", "price": "$$$"},
        {"name": "Endiro Coffee", "type": "Café", "rating": 4.3, "reviews": 1200, "description": "Social enterprise café serving excellent Ugandan coffee and light meals.", "booking_url": "https://www.google.com/maps/search/Endiro+Coffee+Kampala", "price": "$"}
    ],
    "maputo": [
        {"name": "Restaurante Costa do Sol", "type": "Seafood", "rating": 4.5, "reviews": 2800, "description": "Beach institution serving Mozambican seafood and peri-peri prawns.", "booking_url": "https://www.google.com/maps/search/Costa+do+Sol+Maputo", "price": "$$"},
        {"name": "Zambi", "type": "Mozambican", "rating": 4.4, "reviews": 1600, "description": "Traditional Mozambican restaurant with matapa, peri-peri chicken, and live music.", "booking_url": "https://www.google.com/maps/search/Zambi+Restaurant+Maputo", "price": "$$"},
        {"name": "Café Acácia", "type": "Portuguese", "rating": 4.3, "reviews": 1200, "description": "Historic café with Portuguese pastries, coffee, and colonial-era atmosphere.", "booking_url": "https://www.google.com/maps/search/Cafe+Acacia+Maputo", "price": "$"}
    ],
    "arusha": [
        {"name": "The Blue Heron", "type": "International", "rating": 4.5, "reviews": 1400, "description": "Garden restaurant with excellent steaks, Indian cuisine, and safari-eve vibes.", "booking_url": "https://www.google.com/maps/search/Blue+Heron+Arusha", "price": "$$$"},
        {"name": "Stiggy's Thai", "type": "Thai", "rating": 4.6, "reviews": 900, "description": "Surprisingly authentic Thai cuisine run by a dedicated expat chef.", "booking_url": "https://www.google.com/maps/search/Stiggys+Thai+Arusha", "price": "$$"},
        {"name": "Khan's Barbecue", "type": "Indian BBQ", "rating": 4.4, "reviews": 1100, "description": "Popular spot for tandoori, kebabs, and Indian-style barbecue.", "booking_url": "https://www.google.com/maps/search/Khans+Barbecue+Arusha", "price": "$$"}
    ],
    "salalah": [
        {"name": "Al Luban Restaurant", "type": "Omani", "rating": 4.5, "reviews": 1200, "description": "Traditional Dhofari cuisine with frankincense-infused dishes and local specialties.", "booking_url": "https://www.google.com/maps/search/Al+Luban+Restaurant+Salalah", "price": "$$"},
        {"name": "Salalah Restaurant", "type": "Middle Eastern", "rating": 4.4, "reviews": 800, "description": "Popular local spot for Yemeni and Omani dishes with generous portions.", "booking_url": "https://www.google.com/maps/search/Salalah+Restaurant+Oman", "price": "$"},
        {"name": "Sakalan", "type": "Seafood", "rating": 4.3, "reviews": 600, "description": "Fresh Dhofari seafood with lobster, fish, and traditional preparations.", "booking_url": "https://www.google.com/maps/search/Sakalan+Salalah", "price": "$$"}
    ],
    "riyadh": [
        {"name": "Najd Village", "type": "Saudi", "rating": 4.6, "reviews": 4800, "description": "Traditional Najdi cuisine in a heritage-style setting with cultural atmosphere.", "booking_url": "https://www.google.com/maps/search/Najd+Village+Riyadh", "price": "$$"},
        {"name": "Lusin", "type": "Armenian", "rating": 4.5, "reviews": 2400, "description": "Excellent Armenian cuisine with mezze, kebabs, and warm hospitality.", "booking_url": "https://www.google.com/maps/search/Lusin+Riyadh", "price": "$$$"},
        {"name": "Spazio", "type": "Italian", "rating": 4.4, "reviews": 1800, "description": "Contemporary Italian with homemade pasta and modern presentations.", "booking_url": "https://www.google.com/maps/search/Spazio+Riyadh", "price": "$$$"}
    ],
    "jeddah": [
        {"name": "Al Nakheel", "type": "Saudi", "rating": 4.5, "reviews": 3200, "description": "Traditional Saudi restaurant with regional dishes and Red Sea seafood.", "booking_url": "https://www.google.com/maps/search/Al+Nakheel+Jeddah", "price": "$$"},
        {"name": "Shalimar", "type": "Indian-Pakistani", "rating": 4.6, "reviews": 4800, "description": "Legendary restaurant for biryani, kebabs, and subcontinental favorites.", "booking_url": "https://www.google.com/maps/search/Shalimar+Jeddah", "price": "$$"},
        {"name": "Twina", "type": "Mediterranean", "rating": 4.4, "reviews": 1600, "description": "Stylish restaurant on the Corniche with seafood and Mediterranean dishes.", "booking_url": "https://www.google.com/maps/search/Twina+Jeddah", "price": "$$$"}
    ],
    "kuwait": [
        {"name": "Freej Swaileh", "type": "Kuwaiti", "rating": 4.6, "reviews": 3400, "description": "Traditional Kuwaiti restaurant with machboos, grilled fish, and nostalgic atmosphere.", "booking_url": "https://www.google.com/maps/search/Freej+Swaileh+Kuwait", "price": "$$"},
        {"name": "Mais Alghanim", "type": "Lebanese", "rating": 4.5, "reviews": 5200, "description": "Premium Lebanese cuisine with mezze spreads and grilled meats.", "booking_url": "https://www.google.com/maps/search/Mais+Alghanim+Kuwait", "price": "$$$"},
        {"name": "Salt", "type": "Burgers", "rating": 4.4, "reviews": 6800, "description": "Famous Kuwaiti burger chain that started from a food truck on the beach.", "booking_url": "https://www.google.com/maps/search/Salt+Burger+Kuwait", "price": "$$"}
    ],
    "ramallah": [
        {"name": "Darna", "type": "Palestinian", "rating": 4.6, "reviews": 900, "description": "Traditional Palestinian cuisine with musakhan, maqluba, and family recipes.", "booking_url": "https://www.google.com/maps/search/Darna+Restaurant+Ramallah", "price": "$$"},
        {"name": "Snowbar", "type": "International", "rating": 4.4, "reviews": 1200, "description": "Rooftop restaurant with city views, cocktails, and international menu.", "booking_url": "https://www.google.com/maps/search/Snowbar+Ramallah", "price": "$$"},
        {"name": "Azure", "type": "Mediterranean", "rating": 4.5, "reviews": 700, "description": "Upscale restaurant with Mediterranean cuisine and refined atmosphere.", "booking_url": "https://www.google.com/maps/search/Azure+Restaurant+Ramallah", "price": "$$$"}
    ],
    "yazd": [
        {"name": "Malek-o-Tojjar", "type": "Persian", "rating": 4.6, "reviews": 1800, "description": "Historic caravanserai restaurant with traditional Persian dishes and atmosphere.", "booking_url": "https://www.google.com/maps/search/Malek+o+Tojjar+Yazd", "price": "$$"},
        {"name": "Silk Road Hotel Restaurant", "type": "Persian", "rating": 4.5, "reviews": 1200, "description": "Traditional house restaurant with regional Yazdi specialties and rooftop seating.", "booking_url": "https://www.google.com/maps/search/Silk+Road+Hotel+Yazd", "price": "$$"},
        {"name": "Talar-e Yazd", "type": "Persian", "rating": 4.4, "reviews": 800, "description": "Traditional restaurant with Yazdi dishes including shooli and ash-e shouli.", "booking_url": "https://www.google.com/maps/search/Talar+e+Yazd", "price": "$"}
    ],
    "darwin": [
        {"name": "Hanuman", "type": "Indian-Thai", "rating": 4.6, "reviews": 2400, "description": "Upscale Indian and Thai cuisine in a tropical setting with excellent cocktails.", "booking_url": "https://www.google.com/maps/search/Hanuman+Darwin", "price": "$$$"},
        {"name": "Pee Wee's at the Point", "type": "Australian", "rating": 4.5, "reviews": 1800, "description": "Waterfront dining with sunset views and modern Australian seafood.", "booking_url": "https://www.google.com/maps/search/Pee+Wees+at+the+Point+Darwin", "price": "$$$"},
        {"name": "Mindil Beach Sunset Market", "type": "Market", "rating": 4.7, "reviews": 5200, "description": "Famous twilight market with Asian food stalls, crafts, and spectacular sunsets.", "booking_url": "https://www.google.com/maps/search/Mindil+Beach+Markets+Darwin", "price": "$"}
    ],
    "canberra": [
        {"name": "Aubergine", "type": "Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Canberra's top restaurant with degustation menus and Australian wines.", "booking_url": "https://www.google.com/maps/search/Aubergine+Canberra", "price": "$$$$"},
        {"name": "Akiba", "type": "Asian Fusion", "rating": 4.5, "reviews": 1800, "description": "Buzzing pan-Asian restaurant with shared plates and cocktails.", "booking_url": "https://www.google.com/maps/search/Akiba+Canberra", "price": "$$"},
        {"name": "Braddon District", "type": "Various", "rating": 4.4, "reviews": 2400, "description": "Hip neighborhood with diverse restaurants, cafés, and small bars.", "booking_url": "https://www.google.com/maps/search/Braddon+Canberra", "price": "$$"}
    ],
    "suva": [
        {"name": "Governors", "type": "International", "rating": 4.5, "reviews": 800, "description": "Fine dining at the Grand Pacific Hotel with Pacific Rim cuisine.", "booking_url": "https://www.google.com/maps/search/Governors+Restaurant+Suva", "price": "$$$"},
        {"name": "Maya Dhaba", "type": "Indian", "rating": 4.4, "reviews": 1200, "description": "Popular Indian restaurant with curries, tandoori, and vegetarian options.", "booking_url": "https://www.google.com/maps/search/Maya+Dhaba+Suva", "price": "$$"},
        {"name": "Tiko's Floating Restaurant", "type": "Seafood", "rating": 4.3, "reviews": 600, "description": "Unique floating restaurant with fresh Fiji seafood and harbor views.", "booking_url": "https://www.google.com/maps/search/Tikos+Floating+Restaurant+Suva", "price": "$$"}
    ],
    "noumea": [
        {"name": "Le Roof", "type": "French", "rating": 4.6, "reviews": 900, "description": "Iconic overwater restaurant with French cuisine and lagoon views.", "booking_url": "https://www.google.com/maps/search/Le+Roof+Noumea", "price": "$$$"},
        {"name": "Le Miretti", "type": "French-Pacific", "rating": 4.5, "reviews": 700, "description": "Anse Vata restaurant with French-Pacific fusion and fresh seafood.", "booking_url": "https://www.google.com/maps/search/Le+Miretti+Noumea", "price": "$$$"},
        {"name": "Le Bout du Monde", "type": "French", "rating": 4.4, "reviews": 500, "description": "Charming café-restaurant in the Latin Quarter with classic French dishes.", "booking_url": "https://www.google.com/maps/search/Le+Bout+du+Monde+Noumea", "price": "$$"}
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_9_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

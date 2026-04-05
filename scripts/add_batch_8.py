#!/usr/bin/env python3
"""Batch 8: Add restaurant data for 65 more cities."""
import json
import os

RESTAURANTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'restaurants.json')

BATCH_8_DATA = {
    "bodrum": [
        {"name": "Limon Bodrum", "type": "Mediterranean", "rating": 4.6, "reviews": 2800, "description": "Elegant waterfront dining with fresh seafood, Turkish meze, and stunning sunset views over the marina.", "booking_url": "https://www.google.com/maps/search/Limon+Bodrum+Turkey", "price": "$$$"},
        {"name": "Miam Bodrum", "type": "Seafood", "rating": 4.5, "reviews": 1900, "description": "Casual beachside restaurant known for grilled octopus, fish, and creative Turkish-Mediterranean fusion dishes.", "booking_url": "https://www.google.com/maps/search/Miam+Bodrum+Turkey", "price": "$$"},
        {"name": "Bodrum Balıkçısı", "type": "Turkish Seafood", "rating": 4.4, "reviews": 2200, "description": "Traditional fish restaurant in the old town serving the freshest catch of the day with classic preparations.", "booking_url": "https://www.google.com/maps/search/Bodrum+Balikcisi+Turkey", "price": "$$"}
    ],
    "fethiye": [
        {"name": "Mozaik Bahçe", "type": "Turkish", "rating": 4.7, "reviews": 3500, "description": "Garden restaurant with Ottoman-inspired dishes, slow-cooked meats, and exceptional Turkish hospitality.", "booking_url": "https://www.google.com/maps/search/Mozaik+Bahce+Fethiye", "price": "$$"},
        {"name": "Hilmi Restaurant", "type": "Seafood", "rating": 4.5, "reviews": 2100, "description": "Charming waterfront spot in Ölüdeniz known for fresh fish, meze platters, and family recipes.", "booking_url": "https://www.google.com/maps/search/Hilmi+Restaurant+Fethiye", "price": "$$"},
        {"name": "Meğri Lokantası", "type": "Turkish Home Cooking", "rating": 4.6, "reviews": 1800, "description": "Local favorite serving authentic Turkish home cooking with daily-changing dishes and warm atmosphere.", "booking_url": "https://www.google.com/maps/search/Megri+Lokantasi+Fethiye", "price": "$"}
    ],
    "izmir": [
        {"name": "Deniz Restaurant", "type": "Seafood", "rating": 4.6, "reviews": 4200, "description": "Iconic seafood institution on the Kordon promenade serving impeccably fresh fish since 1957.", "booking_url": "https://www.google.com/maps/search/Deniz+Restaurant+Izmir", "price": "$$$"},
        {"name": "Kordon Boyalı Kahve", "type": "Turkish", "rating": 4.5, "reviews": 2800, "description": "Historic café and restaurant with seaside views, famous for breakfast spreads and traditional dishes.", "booking_url": "https://www.google.com/maps/search/Kordon+Boyali+Kahve+Izmir", "price": "$$"},
        {"name": "Sakız Restaurant", "type": "Aegean", "rating": 4.7, "reviews": 1900, "description": "Upscale restaurant celebrating Aegean cuisine with olive oil-based dishes and local wine pairings.", "booking_url": "https://www.google.com/maps/search/Sakiz+Restaurant+Izmir", "price": "$$$"}
    ],
    "cappadocia": [
        {"name": "Seki Restaurant", "type": "Turkish", "rating": 4.7, "reviews": 3200, "description": "Cave restaurant in Göreme with panoramic views, serving traditional Anatolian cuisine and pottery kebabs.", "booking_url": "https://www.google.com/maps/search/Seki+Restaurant+Cappadocia", "price": "$$"},
        {"name": "Topdeck Cave Restaurant", "type": "Turkish", "rating": 4.6, "reviews": 2500, "description": "Romantic cave dining with terrace views of fairy chimneys, known for lamb testi kebab and meze.", "booking_url": "https://www.google.com/maps/search/Topdeck+Cave+Restaurant+Cappadocia", "price": "$$"},
        {"name": "Dibek", "type": "Traditional Turkish", "rating": 4.5, "reviews": 4100, "description": "Authentic Cappadocian restaurant famous for pottery kebab cooked in sealed clay pots over wood fire.", "booking_url": "https://www.google.com/maps/search/Dibek+Restaurant+Cappadocia", "price": "$$"}
    ],
    "kutaisi": [
        {"name": "Palaty", "type": "Georgian", "rating": 4.6, "reviews": 1200, "description": "Elegant restaurant in a historic building serving refined Georgian cuisine with Imeretian specialties.", "booking_url": "https://www.google.com/maps/search/Palaty+Restaurant+Kutaisi", "price": "$$"},
        {"name": "White Stones", "type": "Georgian", "rating": 4.5, "reviews": 900, "description": "Modern Georgian cuisine with creative presentations, excellent khachapuri and wine selection.", "booking_url": "https://www.google.com/maps/search/White+Stones+Kutaisi", "price": "$$"},
        {"name": "Baraqa", "type": "Georgian", "rating": 4.4, "reviews": 700, "description": "Cozy spot for traditional Imeretian dishes including kupati sausages and fresh churchkhela.", "booking_url": "https://www.google.com/maps/search/Baraqa+Kutaisi", "price": "$"}
    ],
    "gyumri": [
        {"name": "Ponchik Monchik", "type": "Armenian", "rating": 4.5, "reviews": 600, "description": "Beloved local spot famous for Armenian donuts and hearty traditional dishes in a cozy setting.", "booking_url": "https://www.google.com/maps/search/Ponchik+Monchik+Gyumri", "price": "$"},
        {"name": "Cherkezi Dzor", "type": "Armenian BBQ", "rating": 4.6, "reviews": 800, "description": "Outdoor restaurant complex with gardens, playgrounds, and exceptional Armenian khorovats grilled meats.", "booking_url": "https://www.google.com/maps/search/Cherkezi+Dzor+Gyumri", "price": "$$"},
        {"name": "Florence Restaurant", "type": "Armenian-European", "rating": 4.4, "reviews": 500, "description": "Elegant restaurant offering both Armenian and European dishes in a refined historic setting.", "booking_url": "https://www.google.com/maps/search/Florence+Restaurant+Gyumri", "price": "$$"}
    ],
    "haifa": [
        {"name": "Fattoush", "type": "Middle Eastern", "rating": 4.6, "reviews": 2800, "description": "Iconic Arab-Israeli restaurant serving exceptional hummus, kebabs, and traditional mezze since 1962.", "booking_url": "https://www.google.com/maps/search/Fattoush+Haifa+Israel", "price": "$$"},
        {"name": "Hanamal 24", "type": "Mediterranean", "rating": 4.7, "reviews": 1900, "description": "Trendy port-area restaurant with seafood, steaks, and Mediterranean dishes in industrial-chic setting.", "booking_url": "https://www.google.com/maps/search/Hanamal+24+Haifa", "price": "$$$"},
        {"name": "Ein El Wadi", "type": "Druze-Arab", "rating": 4.5, "reviews": 1400, "description": "Authentic Druze cuisine in the Carmel mountains with stunning views and homestyle cooking.", "booking_url": "https://www.google.com/maps/search/Ein+El+Wadi+Haifa", "price": "$$"}
    ],
    "eilat": [
        {"name": "The Last Refuge", "type": "Seafood", "rating": 4.6, "reviews": 3200, "description": "Legendary seafood restaurant built into the cliffs with Red Sea views and the freshest fish.", "booking_url": "https://www.google.com/maps/search/Last+Refuge+Eilat", "price": "$$$"},
        {"name": "Pago Pago", "type": "Seafood", "rating": 4.5, "reviews": 2400, "description": "Waterfront institution serving Mediterranean seafood, sushi, and grilled fish in a casual atmosphere.", "booking_url": "https://www.google.com/maps/search/Pago+Pago+Eilat", "price": "$$$"},
        {"name": "Rak Dagim", "type": "Seafood", "rating": 4.4, "reviews": 1800, "description": "Popular local spot for fresh fish cooked your way, with generous portions and reasonable prices.", "booking_url": "https://www.google.com/maps/search/Rak+Dagim+Eilat", "price": "$$"}
    ],
    "aqaba": [
        {"name": "Ali Baba Restaurant", "type": "Jordanian", "rating": 4.5, "reviews": 2100, "description": "Local favorite serving authentic Jordanian cuisine including mansaf, maqluba, and fresh fish.", "booking_url": "https://www.google.com/maps/search/Ali+Baba+Restaurant+Aqaba", "price": "$$"},
        {"name": "Royal Yacht Club Restaurant", "type": "Mediterranean", "rating": 4.6, "reviews": 1600, "description": "Elegant marina restaurant with seafood, steaks, and international cuisine with Red Sea views.", "booking_url": "https://www.google.com/maps/search/Royal+Yacht+Club+Aqaba", "price": "$$$"},
        {"name": "Syrian Palace", "type": "Syrian-Jordanian", "rating": 4.4, "reviews": 1200, "description": "Popular spot for Syrian and Jordanian dishes with excellent grilled meats and traditional mezze.", "booking_url": "https://www.google.com/maps/search/Syrian+Palace+Aqaba", "price": "$$"}
    ],
    "manama": [
        {"name": "Haji's Café", "type": "Bahraini", "rating": 4.5, "reviews": 1800, "description": "Historic café in Muharraq serving traditional Bahraini breakfast and machboos since 1957.", "booking_url": "https://www.google.com/maps/search/Hajis+Cafe+Manama+Bahrain", "price": "$"},
        {"name": "Masso", "type": "Italian", "rating": 4.7, "reviews": 2200, "description": "Upscale Italian dining at the Four Seasons with handmade pasta and premium ingredients.", "booking_url": "https://www.google.com/maps/search/Masso+Manama+Bahrain", "price": "$$$$"},
        {"name": "Saffron by Jena", "type": "Middle Eastern", "rating": 4.6, "reviews": 1500, "description": "Contemporary Middle Eastern cuisine celebrating Gulf flavors with modern techniques.", "booking_url": "https://www.google.com/maps/search/Saffron+Jena+Manama", "price": "$$$"}
    ],
    "luangprabang": [
        {"name": "Tamarind", "type": "Lao", "rating": 4.7, "reviews": 4500, "description": "Renowned restaurant teaching visitors about Lao cuisine through tasting menus and cooking classes.", "booking_url": "https://www.google.com/maps/search/Tamarind+Luang+Prabang", "price": "$$"},
        {"name": "Dyen Sabai", "type": "Lao", "rating": 4.6, "reviews": 3200, "description": "Riverside restaurant with bamboo seating serving authentic Lao dishes and spectacular sunset views.", "booking_url": "https://www.google.com/maps/search/Dyen+Sabai+Luang+Prabang", "price": "$$"},
        {"name": "Khaiphaen", "type": "Lao Social Enterprise", "rating": 4.5, "reviews": 2800, "description": "Social enterprise restaurant training disadvantaged youth while serving excellent Lao cuisine.", "booking_url": "https://www.google.com/maps/search/Khaiphaen+Luang+Prabang", "price": "$$"}
    ],
    "pai": [
        {"name": "Witching Well", "type": "Thai-International", "rating": 4.5, "reviews": 1600, "description": "Atmospheric garden restaurant with live music, creative Thai fusion, and bohemian vibes.", "booking_url": "https://www.google.com/maps/search/Witching+Well+Pai+Thailand", "price": "$$"},
        {"name": "Na's Kitchen", "type": "Thai", "rating": 4.6, "reviews": 2100, "description": "Local favorite run by Na herself, serving authentic Northern Thai dishes with homegrown herbs.", "booking_url": "https://www.google.com/maps/search/Nas+Kitchen+Pai+Thailand", "price": "$"},
        {"name": "Charlie & Lek", "type": "Thai", "rating": 4.4, "reviews": 1400, "description": "Cozy spot for northern Thai specialties like khao soi and fresh spring rolls at great prices.", "booking_url": "https://www.google.com/maps/search/Charlie+Lek+Pai+Thailand", "price": "$"}
    ],
    "krabi": [
        {"name": "Gecko Cabane", "type": "Thai-French", "rating": 4.6, "reviews": 2800, "description": "Fusion restaurant combining Thai and French techniques in a romantic jungle setting.", "booking_url": "https://www.google.com/maps/search/Gecko+Cabane+Krabi", "price": "$$"},
        {"name": "Chalita Café & Restaurant", "type": "Thai", "rating": 4.5, "reviews": 1900, "description": "Riverside restaurant in Krabi Town with local seafood, curries, and beautiful mangrove views.", "booking_url": "https://www.google.com/maps/search/Chalita+Cafe+Krabi", "price": "$$"},
        {"name": "Kodam Kitchen", "type": "Thai Seafood", "rating": 4.4, "reviews": 1500, "description": "Fresh seafood spot in Ao Nang with fish tanks, crab curry, and grilled prawns at fair prices.", "booking_url": "https://www.google.com/maps/search/Kodam+Kitchen+Krabi", "price": "$$"}
    ],
    "kampot": [
        {"name": "Epic Arts Café", "type": "International", "rating": 4.6, "reviews": 1200, "description": "Social enterprise café employing deaf staff, serving great Western and Khmer food with warm service.", "booking_url": "https://www.google.com/maps/search/Epic+Arts+Cafe+Kampot", "price": "$"},
        {"name": "Rikitikitavi", "type": "Asian Fusion", "rating": 4.5, "reviews": 1800, "description": "Stylish restaurant with rooftop bar serving creative Asian fusion and famous Kampot pepper dishes.", "booking_url": "https://www.google.com/maps/search/Rikitikitavi+Kampot", "price": "$$"},
        {"name": "Nelly's Seafood", "type": "Cambodian Seafood", "rating": 4.7, "reviews": 900, "description": "Riverside crab shack serving legendary Kampot pepper crab and fresh seafood at local prices.", "booking_url": "https://www.google.com/maps/search/Nellys+Seafood+Kampot", "price": "$"}
    ],
    "dalat": [
        {"name": "Le Chalet Dalat", "type": "Vietnamese-French", "rating": 4.6, "reviews": 2200, "description": "Charming French-Vietnamese restaurant in a colonial villa with garden seating and excellent steaks.", "booking_url": "https://www.google.com/maps/search/Le+Chalet+Dalat+Vietnam", "price": "$$"},
        {"name": "Trong Dong Restaurant", "type": "Vietnamese", "rating": 4.5, "reviews": 1600, "description": "Local institution serving Central Highlands specialties like venison and bamboo shoot dishes.", "booking_url": "https://www.google.com/maps/search/Trong+Dong+Dalat", "price": "$$"},
        {"name": "V Café", "type": "Vietnamese", "rating": 4.4, "reviews": 1300, "description": "Hip café in an artsy space serving excellent Vietnamese coffee, pho, and bánh mì.", "booking_url": "https://www.google.com/maps/search/V+Cafe+Dalat", "price": "$"}
    ],
    "quynhon": [
        {"name": "Bếp Xưa", "type": "Vietnamese", "rating": 4.5, "reviews": 800, "description": "Traditional Vietnamese restaurant with family recipes and famous bánh xèo pancakes.", "booking_url": "https://www.google.com/maps/search/Bep+Xua+Quy+Nhon", "price": "$"},
        {"name": "Seafood Street An Dương Vương", "type": "Seafood", "rating": 4.4, "reviews": 1200, "description": "Open-air seafood strip where you pick your fish from ice and have it cooked fresh.", "booking_url": "https://www.google.com/maps/search/Seafood+Street+Quy+Nhon", "price": "$"},
        {"name": "Nhà Hàng Hải Sản 2222", "type": "Vietnamese Seafood", "rating": 4.5, "reviews": 600, "description": "Beachside restaurant with ocean views, fresh catch daily, and local seafood preparations.", "booking_url": "https://www.google.com/maps/search/2222+Seafood+Quy+Nhon", "price": "$$"}
    ],
    "sapa": [
        {"name": "Hill Station Signature Restaurant", "type": "Vietnamese-French", "rating": 4.7, "reviews": 2100, "description": "Elegant restaurant with valley views, serving refined Vietnamese and French cuisine.", "booking_url": "https://www.google.com/maps/search/Hill+Station+Restaurant+Sapa", "price": "$$$"},
        {"name": "The Hill Station Deli & Boutique", "type": "Deli", "rating": 4.5, "reviews": 1800, "description": "Cozy deli with excellent coffee, pastries, and light meals using local ingredients.", "booking_url": "https://www.google.com/maps/search/Hill+Station+Deli+Sapa", "price": "$$"},
        {"name": "Little Sapa", "type": "Vietnamese", "rating": 4.4, "reviews": 1400, "description": "Local spot serving authentic Hmong and Vietnamese highland dishes with warm hospitality.", "booking_url": "https://www.google.com/maps/search/Little+Sapa+Restaurant", "price": "$"}
    ],
    "malacca": [
        {"name": "Selvam Restaurant", "type": "Indian", "rating": 4.5, "reviews": 3200, "description": "Legendary banana leaf restaurant serving South Indian cuisine since 1951.", "booking_url": "https://www.google.com/maps/search/Selvam+Restaurant+Malacca", "price": "$"},
        {"name": "Nancy's Kitchen", "type": "Peranakan", "rating": 4.6, "reviews": 2800, "description": "Authentic Nyonya cuisine in a heritage house with family recipes passed down generations.", "booking_url": "https://www.google.com/maps/search/Nancys+Kitchen+Malacca", "price": "$$"},
        {"name": "Jonker 88", "type": "Malaysian", "rating": 4.4, "reviews": 4100, "description": "Famous for cendol and laksa, this heritage shop is a must-visit on Jonker Street.", "booking_url": "https://www.google.com/maps/search/Jonker+88+Malacca", "price": "$"}
    ],
    "kotakinabalu": [
        {"name": "Welcome Seafood Restaurant", "type": "Chinese Seafood", "rating": 4.5, "reviews": 2900, "description": "Massive seafood restaurant with tanks of live fish and famous butter prawns.", "booking_url": "https://www.google.com/maps/search/Welcome+Seafood+Kota+Kinabalu", "price": "$$"},
        {"name": "Little Italy", "type": "Italian", "rating": 4.6, "reviews": 1800, "description": "Popular Italian spot by the waterfront with wood-fired pizzas and fresh pasta.", "booking_url": "https://www.google.com/maps/search/Little+Italy+Kota+Kinabalu", "price": "$$"},
        {"name": "Sri Latha Curry House", "type": "Indian", "rating": 4.4, "reviews": 1500, "description": "No-frills banana leaf spot serving excellent South Indian curries and roti canai.", "booking_url": "https://www.google.com/maps/search/Sri+Latha+Curry+House+Kota+Kinabalu", "price": "$"}
    ],
    "siargao": [
        {"name": "Shaka", "type": "Healthy", "rating": 4.6, "reviews": 1800, "description": "Surfer-favorite serving acai bowls, healthy plates, and excellent coffee in a tropical setting.", "booking_url": "https://www.google.com/maps/search/Shaka+Siargao+Philippines", "price": "$$"},
        {"name": "Kermit Siargao", "type": "Italian-Filipino", "rating": 4.7, "reviews": 2400, "description": "Famous surf resort restaurant with wood-fired pizzas, fresh pasta, and beachfront seating.", "booking_url": "https://www.google.com/maps/search/Kermit+Siargao+Philippines", "price": "$$"},
        {"name": "Bravo", "type": "Filipino Seafood", "rating": 4.5, "reviews": 1200, "description": "Local seafood grill with fresh catch, grilled meats, and authentic Filipino flavors.", "booking_url": "https://www.google.com/maps/search/Bravo+Restaurant+Siargao", "price": "$"}
    ],
    "palawan": [
        {"name": "Kalui Restaurant", "type": "Filipino Seafood", "rating": 4.7, "reviews": 3800, "description": "Puerto Princesa institution with set seafood meals served on bamboo floors since 1995.", "booking_url": "https://www.google.com/maps/search/Kalui+Restaurant+Puerto+Princesa", "price": "$$"},
        {"name": "Ima's Gulay Bar", "type": "Filipino Vegetarian", "rating": 4.6, "reviews": 1400, "description": "Art-filled garden restaurant with creative vegetarian Filipino cuisine.", "booking_url": "https://www.google.com/maps/search/Imas+Gulay+Bar+Palawan", "price": "$"},
        {"name": "Kinabuch's Grill", "type": "Filipino BBQ", "rating": 4.5, "reviews": 2200, "description": "Bustling grill restaurant famous for crocodile sisig and exotic game meats.", "booking_url": "https://www.google.com/maps/search/Kinabuchs+Grill+Palawan", "price": "$$"}
    ],
    "boracay": [
        {"name": "Smoke Restaurant", "type": "Barbecue", "rating": 4.6, "reviews": 2800, "description": "Premium smokehouse with imported meats, craft beers, and a laid-back beach vibe.", "booking_url": "https://www.google.com/maps/search/Smoke+Restaurant+Boracay", "price": "$$$"},
        {"name": "Calamansi Café", "type": "Filipino-International", "rating": 4.5, "reviews": 1900, "description": "Garden café with Filipino comfort food, healthy options, and famous fruit shakes.", "booking_url": "https://www.google.com/maps/search/Calamansi+Cafe+Boracay", "price": "$$"},
        {"name": "D'Talipapa Seafood Market", "type": "Seafood", "rating": 4.4, "reviews": 4200, "description": "Wet market experience where you buy fresh seafood and have it cooked to order nearby.", "booking_url": "https://www.google.com/maps/search/Talipapa+Boracay", "price": "$"}
    ],
    "dumaguete": [
        {"name": "Lab-as Seafood Restaurant", "type": "Filipino Seafood", "rating": 4.5, "reviews": 2100, "description": "Waterfront restaurant with fresh seafood, local fish kinilaw, and sea views.", "booking_url": "https://www.google.com/maps/search/Labas+Seafood+Dumaguete", "price": "$$"},
        {"name": "Gabby's Bistro", "type": "Filipino-International", "rating": 4.6, "reviews": 1600, "description": "Charming bistro with garden seating, excellent steaks, and Filipino comfort classics.", "booking_url": "https://www.google.com/maps/search/Gabbys+Bistro+Dumaguete", "price": "$$"},
        {"name": "Hayahay Treehouse Bar & Viewdeck", "type": "Filipino", "rating": 4.4, "reviews": 1300, "description": "Unique treehouse restaurant with panoramic views, cold beers, and grilled dishes.", "booking_url": "https://www.google.com/maps/search/Hayahay+Treehouse+Dumaguete", "price": "$"}
    ],
    "elnido": [
        {"name": "Trattoria Altrove", "type": "Italian", "rating": 4.7, "reviews": 2800, "description": "Authentic Italian with wood-fired pizzas and handmade pasta in a tropical garden setting.", "booking_url": "https://www.google.com/maps/search/Trattoria+Altrove+El+Nido", "price": "$$"},
        {"name": "Republica Sunset Bar", "type": "International", "rating": 4.5, "reviews": 1900, "description": "Beachfront restaurant with spectacular sunsets, cocktails, and seafood platters.", "booking_url": "https://www.google.com/maps/search/Republica+Sunset+Bar+El+Nido", "price": "$$"},
        {"name": "Angel Wish", "type": "Filipino", "rating": 4.4, "reviews": 1500, "description": "Local favorite for authentic Filipino dishes, fresh fish, and home-cooked meals.", "booking_url": "https://www.google.com/maps/search/Angel+Wish+El+Nido", "price": "$"}
    ],
    "lombok": [
        {"name": "El Bazar", "type": "Mediterranean", "rating": 4.6, "reviews": 2200, "description": "Stylish Senggigi restaurant with Mediterranean-Indonesian fusion and cocktail bar.", "booking_url": "https://www.google.com/maps/search/El+Bazar+Lombok", "price": "$$"},
        {"name": "Warung Menega", "type": "Indonesian Seafood", "rating": 4.5, "reviews": 3100, "description": "Beachfront warung in Jimbaran style with grilled seafood feasts at sunset.", "booking_url": "https://www.google.com/maps/search/Warung+Menega+Lombok", "price": "$$"},
        {"name": "Milk Espresso", "type": "Café", "rating": 4.4, "reviews": 1400, "description": "Hipster café with specialty coffee, brunch favorites, and healthy bowls.", "booking_url": "https://www.google.com/maps/search/Milk+Espresso+Lombok", "price": "$$"}
    ],
    "bandung": [
        {"name": "Warung Nasi Ibu Imas", "type": "Sundanese", "rating": 4.6, "reviews": 2800, "description": "Legendary Sundanese restaurant with traditional rice dishes and sambal variations.", "booking_url": "https://www.google.com/maps/search/Warung+Nasi+Ibu+Imas+Bandung", "price": "$"},
        {"name": "Kampung Daun", "type": "Indonesian", "rating": 4.7, "reviews": 5200, "description": "Magical forest restaurant with private bamboo huts, waterfalls, and authentic Sundanese cuisine.", "booking_url": "https://www.google.com/maps/search/Kampung+Daun+Bandung", "price": "$$"},
        {"name": "Sierra Café & Lounge", "type": "International", "rating": 4.5, "reviews": 1900, "description": "Modern café with mountain views, good coffee, and Western-Indonesian fusion dishes.", "booking_url": "https://www.google.com/maps/search/Sierra+Cafe+Lounge+Bandung", "price": "$$"}
    ],
    "surabaya": [
        {"name": "House of Sampoerna Café", "type": "Indonesian", "rating": 4.5, "reviews": 3800, "description": "Historic café in a Dutch colonial building with Indonesian dishes and museum tours.", "booking_url": "https://www.google.com/maps/search/House+of+Sampoerna+Cafe+Surabaya", "price": "$$"},
        {"name": "Depot Bu Rudy", "type": "Indonesian", "rating": 4.6, "reviews": 4200, "description": "Iconic Surabayan institution famous for sambal dishes and traditional comfort food.", "booking_url": "https://www.google.com/maps/search/Depot+Bu+Rudy+Surabaya", "price": "$"},
        {"name": "Sate Klopo Ondomohen", "type": "Indonesian", "rating": 4.5, "reviews": 2100, "description": "Local legend serving Surabaya's unique coconut satay since 1939.", "booking_url": "https://www.google.com/maps/search/Sate+Klopo+Ondomohen+Surabaya", "price": "$"}
    ],
    "malang": [
        {"name": "Inggil Museum Resto", "type": "Indonesian", "rating": 4.6, "reviews": 2400, "description": "Antique-filled restaurant serving traditional Javanese dishes in a museum-like setting.", "booking_url": "https://www.google.com/maps/search/Inggil+Museum+Resto+Malang", "price": "$$"},
        {"name": "Depot Avia", "type": "Chinese-Indonesian", "rating": 4.5, "reviews": 1800, "description": "Old-school Chinese-Indonesian restaurant with legendary bakso and noodle soups.", "booking_url": "https://www.google.com/maps/search/Depot+Avia+Malang", "price": "$"},
        {"name": "Toko Oen", "type": "Dutch-Indonesian", "rating": 4.4, "reviews": 3100, "description": "Historic 1930s café serving Dutch colonial era ice creams and nostalgic dishes.", "booking_url": "https://www.google.com/maps/search/Toko+Oen+Malang", "price": "$$"}
    ],
    "semarang": [
        {"name": "Lunpia Express", "type": "Chinese-Indonesian", "rating": 4.5, "reviews": 2800, "description": "Famous for Semarang's signature dish: spring rolls with bamboo shoots and prawns.", "booking_url": "https://www.google.com/maps/search/Lunpia+Express+Semarang", "price": "$"},
        {"name": "Soto Bangkong", "type": "Indonesian", "rating": 4.6, "reviews": 2200, "description": "Local institution serving Semarang's distinctive soto with rich coconut broth.", "booking_url": "https://www.google.com/maps/search/Soto+Bangkong+Semarang", "price": "$"},
        {"name": "Ikan Bakar Cianjur", "type": "Indonesian Seafood", "rating": 4.4, "reviews": 1600, "description": "Sundanese-style grilled fish restaurant with sambal variations and fresh vegetables.", "booking_url": "https://www.google.com/maps/search/Ikan+Bakar+Cianjur+Semarang", "price": "$$"}
    ],
    "nusapenida": [
        {"name": "Penida Colada", "type": "International", "rating": 4.5, "reviews": 1400, "description": "Clifftop restaurant with infinity pool views over the ocean and seafood BBQ.", "booking_url": "https://www.google.com/maps/search/Penida+Colada+Nusa+Penida", "price": "$$"},
        {"name": "La Roca Nusa Penida", "type": "Mediterranean", "rating": 4.6, "reviews": 900, "description": "Scenic restaurant built into rocks with Mediterranean-Indonesian fusion and sunset views.", "booking_url": "https://www.google.com/maps/search/La+Roca+Nusa+Penida", "price": "$$"},
        {"name": "Warung Made Nusa Penida", "type": "Indonesian", "rating": 4.4, "reviews": 800, "description": "Simple local warung with authentic Indonesian dishes and friendly service.", "booking_url": "https://www.google.com/maps/search/Warung+Made+Nusa+Penida", "price": "$"}
    ],
    "sucre": [
        {"name": "El Huerto", "type": "International", "rating": 4.6, "reviews": 1800, "description": "Garden restaurant with vegetarian options, organic ingredients, and peaceful courtyard.", "booking_url": "https://www.google.com/maps/search/El+Huerto+Sucre+Bolivia", "price": "$$"},
        {"name": "Condor Café", "type": "Bolivian-International", "rating": 4.5, "reviews": 1200, "description": "Rooftop restaurant with city views, Bolivian dishes, and international favorites.", "booking_url": "https://www.google.com/maps/search/Condor+Cafe+Sucre+Bolivia", "price": "$$"},
        {"name": "Abis Café", "type": "Café", "rating": 4.4, "reviews": 900, "description": "Cozy café with excellent coffee, homemade cakes, and light meals in a colonial setting.", "booking_url": "https://www.google.com/maps/search/Abis+Cafe+Sucre+Bolivia", "price": "$"}
    ],
    "cochabamba": [
        {"name": "Paprika", "type": "Bolivian-International", "rating": 4.6, "reviews": 1400, "description": "Upscale restaurant serving refined Bolivian cuisine with international influences.", "booking_url": "https://www.google.com/maps/search/Paprika+Restaurant+Cochabamba", "price": "$$$"},
        {"name": "La Cantonata", "type": "Italian", "rating": 4.5, "reviews": 1100, "description": "Italian restaurant with homemade pasta, pizzas, and a warm family atmosphere.", "booking_url": "https://www.google.com/maps/search/La+Cantonata+Cochabamba", "price": "$$"},
        {"name": "Wist'upiku", "type": "Bolivian", "rating": 4.4, "reviews": 800, "description": "Traditional restaurant specializing in chicharrón and other Cochabamba specialties.", "booking_url": "https://www.google.com/maps/search/Wistupiku+Cochabamba", "price": "$"}
    ],
    "vilcabamba": [
        {"name": "Shanta's Bar & Restaurant", "type": "International", "rating": 4.5, "reviews": 600, "description": "Popular expat hangout with varied menu, live music, and a social atmosphere.", "booking_url": "https://www.google.com/maps/search/Shantas+Bar+Vilcabamba+Ecuador", "price": "$$"},
        {"name": "Hostería Izhcayluma", "type": "International", "rating": 4.6, "reviews": 800, "description": "Hillside restaurant with valley views, German-Ecuadorian cuisine, and organic garden.", "booking_url": "https://www.google.com/maps/search/Hosteria+Izhcayluma+Vilcabamba", "price": "$$"},
        {"name": "Juice Factory", "type": "Healthy", "rating": 4.4, "reviews": 500, "description": "Health-focused café with fresh juices, smoothie bowls, and vegetarian meals.", "booking_url": "https://www.google.com/maps/search/Juice+Factory+Vilcabamba+Ecuador", "price": "$"}
    ],
    "mancora": [
        {"name": "Angela's Place", "type": "Seafood", "rating": 4.6, "reviews": 1800, "description": "Beachfront institution serving fresh ceviche and grilled seafood since the early days.", "booking_url": "https://www.google.com/maps/search/Angelas+Place+Mancora+Peru", "price": "$$"},
        {"name": "La Sirena d'Juan", "type": "Peruvian", "rating": 4.5, "reviews": 1200, "description": "Upscale beachfront dining with creative Peruvian cuisine and cocktail bar.", "booking_url": "https://www.google.com/maps/search/La+Sirena+Juan+Mancora", "price": "$$$"},
        {"name": "Green Eggs & Ham", "type": "Café", "rating": 4.4, "reviews": 900, "description": "Surfer-friendly café with hearty breakfasts, fresh juices, and healthy options.", "booking_url": "https://www.google.com/maps/search/Green+Eggs+Ham+Mancora", "price": "$"}
    ],
    "huanchaco": [
        {"name": "Big Ben", "type": "Peruvian Seafood", "rating": 4.6, "reviews": 2100, "description": "Famous oceanfront restaurant with exceptional ceviche and views of the caballitos de totora.", "booking_url": "https://www.google.com/maps/search/Big+Ben+Huanchaco+Peru", "price": "$$"},
        {"name": "Otra Cosa", "type": "International", "rating": 4.5, "reviews": 1400, "description": "Social enterprise restaurant training local youth, serving excellent vegetarian and Peruvian dishes.", "booking_url": "https://www.google.com/maps/search/Otra+Cosa+Huanchaco", "price": "$$"},
        {"name": "Piccolo Restaurant", "type": "Italian-Peruvian", "rating": 4.4, "reviews": 900, "description": "Cozy beachside spot with Italian-Peruvian fusion, fresh seafood pasta, and good wine.", "booking_url": "https://www.google.com/maps/search/Piccolo+Restaurant+Huanchaco", "price": "$$"}
    ],
    "lecce": [
        {"name": "Alle Due Corti", "type": "Puglian", "rating": 4.7, "reviews": 3200, "description": "Historic restaurant in a palazzo courtyard serving traditional Salento cuisine.", "booking_url": "https://www.google.com/maps/search/Alle+Due+Corti+Lecce", "price": "$$$"},
        {"name": "Osteria degli Spiriti", "type": "Italian", "rating": 4.6, "reviews": 2100, "description": "Atmospheric osteria in the old town with local wines and Puglian specialties.", "booking_url": "https://www.google.com/maps/search/Osteria+degli+Spiriti+Lecce", "price": "$$"},
        {"name": "Trattoria Nonna Tetti", "type": "Italian", "rating": 4.5, "reviews": 1800, "description": "Homestyle trattoria with grandmother's recipes and fresh orecchiette pasta.", "booking_url": "https://www.google.com/maps/search/Trattoria+Nonna+Tetti+Lecce", "price": "$$"}
    ],
    "trieste": [
        {"name": "Buffet da Pepi", "type": "Central European", "rating": 4.6, "reviews": 2800, "description": "Legendary buffet serving boiled meats, sauerkraut, and Austrian-influenced dishes since 1897.", "booking_url": "https://www.google.com/maps/search/Buffet+da+Pepi+Trieste", "price": "$$"},
        {"name": "Pier The Roof", "type": "Mediterranean", "rating": 4.5, "reviews": 1600, "description": "Rooftop restaurant with harbor views, seafood, and Mediterranean cuisine.", "booking_url": "https://www.google.com/maps/search/Pier+The+Roof+Trieste", "price": "$$$"},
        {"name": "Trattoria da Giovanni", "type": "Italian", "rating": 4.4, "reviews": 1400, "description": "No-frills trattoria with generous portions of pasta and Triestine specialties.", "booking_url": "https://www.google.com/maps/search/Trattoria+da+Giovanni+Trieste", "price": "$$"}
    ],
    "genoa": [
        {"name": "Trattoria da Maria", "type": "Ligurian", "rating": 4.5, "reviews": 3200, "description": "Legendary no-frills trattoria with handwritten menus and authentic Genovese cuisine.", "booking_url": "https://www.google.com/maps/search/Trattoria+da+Maria+Genoa", "price": "$"},
        {"name": "Il Genovese", "type": "Ligurian", "rating": 4.6, "reviews": 1800, "description": "Modern Ligurian cuisine with a focus on pesto, focaccia, and fresh seafood.", "booking_url": "https://www.google.com/maps/search/Il+Genovese+Restaurant+Genoa", "price": "$$"},
        {"name": "Antica Osteria di Vico Palla", "type": "Italian", "rating": 4.7, "reviews": 2400, "description": "Historic osteria in the old port with fresh fish, farinata, and local wines.", "booking_url": "https://www.google.com/maps/search/Antica+Osteria+Vico+Palla+Genoa", "price": "$$"}
    ],
    "sansebastian": [
        {"name": "Arzak", "type": "Basque Fine Dining", "rating": 4.8, "reviews": 4200, "description": "Three Michelin star temple of modern Basque cuisine run by the legendary Arzak family.", "booking_url": "https://www.google.com/maps/search/Arzak+San+Sebastian", "price": "$$$$"},
        {"name": "La Cuchara de San Telmo", "type": "Basque Pintxos", "rating": 4.7, "reviews": 5800, "description": "Standing-room-only pintxos bar famous for slow-cooked beef cheeks and creative bites.", "booking_url": "https://www.google.com/maps/search/La+Cuchara+San+Telmo+San+Sebastian", "price": "$$"},
        {"name": "Bar Zeruko", "type": "Basque Pintxos", "rating": 4.6, "reviews": 3400, "description": "Creative pintxos bar in the old town with innovative presentations and quality ingredients.", "booking_url": "https://www.google.com/maps/search/Bar+Zeruko+San+Sebastian", "price": "$$"}
    ],
    "alicante": [
        {"name": "Nou Manolín", "type": "Spanish Seafood", "rating": 4.6, "reviews": 3800, "description": "Legendary seafood restaurant and tapas bar serving the best rice dishes in Alicante.", "booking_url": "https://www.google.com/maps/search/Nou+Manolin+Alicante", "price": "$$$"},
        {"name": "La Taberna del Gourmet", "type": "Spanish", "rating": 4.5, "reviews": 2400, "description": "Gourmet tapas and local wines in a lively market atmosphere.", "booking_url": "https://www.google.com/maps/search/La+Taberna+del+Gourmet+Alicante", "price": "$$"},
        {"name": "Piripi", "type": "Mediterranean", "rating": 4.4, "reviews": 1900, "description": "Stylish restaurant in the marina with creative Mediterranean cuisine and sea views.", "booking_url": "https://www.google.com/maps/search/Piripi+Alicante", "price": "$$$"}
    ],
    "zaragoza": [
        {"name": "Casa Lac", "type": "Spanish", "rating": 4.6, "reviews": 2800, "description": "Spain's oldest restaurant (since 1825) serving traditional Aragonese cuisine.", "booking_url": "https://www.google.com/maps/search/Casa+Lac+Zaragoza", "price": "$$$"},
        {"name": "Méli Mélo", "type": "French-Spanish", "rating": 4.7, "reviews": 1600, "description": "Intimate bistro with French-Spanish fusion and excellent wine selection.", "booking_url": "https://www.google.com/maps/search/Meli+Melo+Zaragoza", "price": "$$"},
        {"name": "La Bodeguilla de Santa Cruz", "type": "Tapas", "rating": 4.5, "reviews": 2100, "description": "Classic tapas bar with traditional pintxos and local Aragonese wines.", "booking_url": "https://www.google.com/maps/search/La+Bodeguilla+Santa+Cruz+Zaragoza", "price": "$$"}
    ],
    "oxford": [
        {"name": "The Cherwell Boathouse", "type": "British", "rating": 4.5, "reviews": 2100, "description": "Riverside restaurant with punting, seasonal British cuisine, and romantic atmosphere.", "booking_url": "https://www.google.com/maps/search/Cherwell+Boathouse+Oxford", "price": "$$$"},
        {"name": "Oli's Thai", "type": "Thai", "rating": 4.7, "reviews": 1800, "description": "Intimate Thai restaurant with exceptional flavors and friendly service.", "booking_url": "https://www.google.com/maps/search/Olis+Thai+Oxford", "price": "$$"},
        {"name": "The Covered Market", "type": "Market", "rating": 4.6, "reviews": 3400, "description": "Historic indoor market with food stalls, cafés, and local specialties.", "booking_url": "https://www.google.com/maps/search/Covered+Market+Oxford", "price": "$"}
    ],
    "cambridge": [
        {"name": "Midsummer House", "type": "Fine Dining", "rating": 4.8, "reviews": 1900, "description": "Two Michelin star restaurant in a Victorian villa with inventive tasting menus.", "booking_url": "https://www.google.com/maps/search/Midsummer+House+Cambridge", "price": "$$$$"},
        {"name": "Fitzbillies", "type": "British Café", "rating": 4.5, "reviews": 3200, "description": "Historic café famous for Chelsea buns since 1920 and excellent breakfasts.", "booking_url": "https://www.google.com/maps/search/Fitzbillies+Cambridge", "price": "$$"},
        {"name": "The Pint Shop", "type": "Gastropub", "rating": 4.4, "reviews": 2100, "description": "Craft beer bar with excellent pub food, grilled meats, and local ales.", "booking_url": "https://www.google.com/maps/search/Pint+Shop+Cambridge", "price": "$$"}
    ],
    "york": [
        {"name": "Skosh", "type": "British-Asian", "rating": 4.7, "reviews": 2400, "description": "Innovative small plates blending British and Asian flavors in a modern setting.", "booking_url": "https://www.google.com/maps/search/Skosh+York", "price": "$$$"},
        {"name": "The Star Inn the City", "type": "British", "rating": 4.5, "reviews": 3100, "description": "Riverside restaurant with Yorkshire produce and Museum Gardens views.", "booking_url": "https://www.google.com/maps/search/Star+Inn+City+York", "price": "$$$"},
        {"name": "Shambles Kitchen", "type": "Café", "rating": 4.6, "reviews": 1800, "description": "Tiny café on the famous Shambles serving gourmet sandwiches and homemade cakes.", "booking_url": "https://www.google.com/maps/search/Shambles+Kitchen+York", "price": "$"}
    ],
    "bath": [
        {"name": "The Circus Restaurant", "type": "British", "rating": 4.6, "reviews": 2800, "description": "Elegant Georgian townhouse restaurant with refined British cuisine.", "booking_url": "https://www.google.com/maps/search/Circus+Restaurant+Bath", "price": "$$$"},
        {"name": "Acorn", "type": "Plant-Based", "rating": 4.7, "reviews": 1600, "description": "Award-winning vegan restaurant with creative tasting menus and natural wines.", "booking_url": "https://www.google.com/maps/search/Acorn+Restaurant+Bath", "price": "$$$"},
        {"name": "Sally Lunn's", "type": "British Tearoom", "rating": 4.4, "reviews": 4200, "description": "Historic tearoom in Bath's oldest house serving the famous Sally Lunn bun.", "booking_url": "https://www.google.com/maps/search/Sally+Lunns+Bath", "price": "$$"}
    ],
    "trondheim": [
        {"name": "Credo", "type": "Nordic Fine Dining", "rating": 4.8, "reviews": 1200, "description": "Michelin-starred restaurant with zero-waste philosophy and local Norwegian ingredients.", "booking_url": "https://www.google.com/maps/search/Credo+Restaurant+Trondheim", "price": "$$$$"},
        {"name": "Baklandet Skydsstation", "type": "Norwegian", "rating": 4.5, "reviews": 2100, "description": "Charming café in a historic building with traditional Norwegian dishes and pastries.", "booking_url": "https://www.google.com/maps/search/Baklandet+Skydsstation+Trondheim", "price": "$$"},
        {"name": "Trondhjem Mikrobryggeri", "type": "Brewpub", "rating": 4.4, "reviews": 1600, "description": "Microbrewery with craft beers, pub food, and a lively atmosphere.", "booking_url": "https://www.google.com/maps/search/Trondhjem+Mikrobryggeri", "price": "$$"}
    ],
    "tromso": [
        {"name": "Emma's Drømmekjøkken", "type": "Norwegian", "rating": 4.7, "reviews": 1800, "description": "Cozy restaurant with Arctic ingredients including reindeer, whale, and king crab.", "booking_url": "https://www.google.com/maps/search/Emmas+Drommekjokken+Tromso", "price": "$$$"},
        {"name": "Mathallen Tromsø", "type": "Food Hall", "rating": 4.5, "reviews": 1400, "description": "Food hall with local specialties, Arctic tapas, and craft cocktails.", "booking_url": "https://www.google.com/maps/search/Mathallen+Tromso", "price": "$$"},
        {"name": "Risø", "type": "Gastropub", "rating": 4.4, "reviews": 1100, "description": "Hip gastropub with creative dishes, local beers, and a young crowd.", "booking_url": "https://www.google.com/maps/search/Riso+Mat+Kaffebar+Tromso", "price": "$$"}
    ],
    "turku": [
        {"name": "Kaskis", "type": "Nordic", "rating": 4.7, "reviews": 1200, "description": "Modern Nordic cuisine with foraged ingredients and set menus in an intimate setting.", "booking_url": "https://www.google.com/maps/search/Kaskis+Turku", "price": "$$$"},
        {"name": "Mami", "type": "Finnish", "rating": 4.5, "reviews": 900, "description": "Cozy restaurant with Finnish comfort food and seasonal ingredients.", "booking_url": "https://www.google.com/maps/search/Mami+Restaurant+Turku", "price": "$$"},
        {"name": "Tinta", "type": "Mediterranean", "rating": 4.4, "reviews": 800, "description": "Wine bar and restaurant with Mediterranean small plates and natural wines.", "booking_url": "https://www.google.com/maps/search/Tinta+Turku", "price": "$$"}
    ],
    "oulu": [
        {"name": "Uleåborg 1881", "type": "Finnish", "rating": 4.6, "reviews": 1100, "description": "Fine dining in a historic customs house with local Finnish ingredients.", "booking_url": "https://www.google.com/maps/search/Uleaborg+1881+Oulu", "price": "$$$"},
        {"name": "Ravintola Hugo", "type": "International", "rating": 4.5, "reviews": 900, "description": "Stylish restaurant with international menu and excellent cocktails.", "booking_url": "https://www.google.com/maps/search/Ravintola+Hugo+Oulu", "price": "$$"},
        {"name": "Sokeri-Jussin Kievari", "type": "Finnish", "rating": 4.4, "reviews": 700, "description": "Traditional Finnish restaurant in a wooden building with hearty local dishes.", "booking_url": "https://www.google.com/maps/search/Sokeri+Jussin+Kievari+Oulu", "price": "$$"}
    ],
    "groningen": [
        {"name": "House of Elliot", "type": "Dutch-International", "rating": 4.6, "reviews": 1600, "description": "Eclectic restaurant in a beautiful building with creative Dutch cuisine.", "booking_url": "https://www.google.com/maps/search/House+of+Elliot+Groningen", "price": "$$"},
        {"name": "Bistro Boyens", "type": "French", "rating": 4.5, "reviews": 1200, "description": "Classic French bistro with seasonal menus and excellent wine list.", "booking_url": "https://www.google.com/maps/search/Bistro+Boyens+Groningen", "price": "$$$"},
        {"name": "De Kleine Heerlijkheid", "type": "Dutch", "rating": 4.4, "reviews": 900, "description": "Cozy spot with traditional Dutch dishes and local ingredients.", "booking_url": "https://www.google.com/maps/search/De+Kleine+Heerlijkheid+Groningen", "price": "$$"}
    ],
    "thehague": [
        {"name": "Garoeda", "type": "Indonesian", "rating": 4.6, "reviews": 2800, "description": "Iconic rijsttafel restaurant serving elaborate Indonesian banquets since 1949.", "booking_url": "https://www.google.com/maps/search/Garoeda+The+Hague", "price": "$$$"},
        {"name": "Restaurant Calla's", "type": "French Fine Dining", "rating": 4.7, "reviews": 1400, "description": "Michelin-starred restaurant with creative French cuisine near the beach.", "booking_url": "https://www.google.com/maps/search/Restaurant+Callas+The+Hague", "price": "$$$$"},
        {"name": "Hagedis", "type": "Dutch-International", "rating": 4.4, "reviews": 1800, "description": "Lively restaurant in a former tram depot with varied menu and great atmosphere.", "booking_url": "https://www.google.com/maps/search/Hagedis+The+Hague", "price": "$$"}
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_8_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

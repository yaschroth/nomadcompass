#!/usr/bin/env python3
"""Batch 14: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "antigua": {
        "climate": "Antigua has a subtropical highland climate with pleasant temperatures (18-25°C) year-round. The valley is protected by volcanoes. Rain is mostly in afternoon from May to October.",
        "cost": "Affordable with apartments from $400-800/month. One of Central America's best values for a pleasant climate. Tourism keeps some prices up.",
        "wifi": "Good for Central America with speeds of 20-50 Mbps. Tourist infrastructure helps. Cafés and coworking spaces are equipped.",
        "nightlife": "Charming scene with bars in colonial settings. The student Spanish school crowd adds energy. More sophisticated than Guatemala City.",
        "nature": "Three volcanoes frame the city with hiking opportunities. Coffee plantations surround the valley. The landscape is stunning.",
        "safety": "Safer than Guatemala City with tourist-friendly atmosphere. Standard awareness applies. The compact center feels secure.",
        "food": "Guatemalan cuisine with international influence due to Spanish schools. Fresh local ingredients. Prices are very reasonable.",
        "community": "Strong digital nomad and language learning community. Many expats have settled here. The community is welcoming and established.",
        "english": "Better English than Guatemala City due to tourism. Spanish immersion is popular. Language school culture helps.",
        "visa": "Same CA-4 rules as Guatemala. 90 days visa-free. Extensions possible. Accessible.",
        "culture": "UNESCO World Heritage colonial architecture. The Mayan and Spanish heritage is visible. The cobblestone streets are atmospheric.",
        "cleanliness": "Tourist areas are well-maintained. The colonial charm is preserved. Standards are good for Central America.",
        "airquality": "Generally good at altitude. The valley location helps. Fresh highland air."
    },
    "roatan": {
        "climate": "Roatan has a tropical climate with warm temperatures year-round (25-32°C). Hurricane season from June to November poses some risk. Dry season is pleasant.",
        "cost": "Moderate for Central America. Apartments from $500-900/month. Island prices are higher than mainland Honduras.",
        "wifi": "Decent infrastructure for an island with speeds of 15-40 Mbps. Tourist areas have better connectivity. Can be challenging in remote spots.",
        "nightlife": "Beach bar scene with relaxed island vibe. West End has the most options. The atmosphere is casual.",
        "nature": "World-class diving on the Mesoamerican Reef. Beautiful beaches and marine life. The natural beauty is the main draw.",
        "safety": "Safer than mainland Honduras as an island. Tourist areas are secure. The community is welcoming.",
        "food": "Caribbean and Honduran cuisine with fresh seafood. Island dining is pleasant. Prices reflect import costs.",
        "community": "Dive instructor and expat community established. Growing nomad presence. The island attracts adventurers.",
        "english": "Widely spoken due to Garifuna and Bay Island English heritage. Better than mainland Honduras. Communication is easy.",
        "visa": "90 days visa-free for most nationalities. Honduras is accessible. Island is easy to stay on.",
        "culture": "Bay Island culture with Garifuna, English, and Spanish influences. The Caribbean vibe is distinct from mainland. Relaxed island life.",
        "cleanliness": "Beach areas maintained for tourism. Some waste management challenges typical of islands. Standards vary.",
        "airquality": "Excellent air quality with Caribbean breezes. The island location ensures fresh air. Clean ocean air."
    },
    "sanjuandelsur": {
        "climate": "San Juan del Sur has a tropical climate with dry season (November-April) and wet season. Temperatures stay warm (28-35°C). The beach breeze provides relief.",
        "cost": "Affordable with apartments from $400-700/month. Nicaragua is cheap. Beach living at good prices.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Improving gradually. Some cafés have decent connections.",
        "nightlife": "Beach party scene especially on Sundays. The backpacker and surfer crowd creates energy. Relaxed and social.",
        "nature": "Beautiful Pacific beaches with sea turtle nesting. Surfing is popular. The coastline is stunning.",
        "safety": "Generally safe tourist town. Nicaragua has political volatility - check current situation. The beach community is welcoming.",
        "food": "Nicaraguan cuisine with fresh seafood. Beach dining is pleasant. Prices are low.",
        "community": "Small but established nomad and expat community. Surfers and beach lovers settle here. Community is tight-knit.",
        "english": "Growing English due to tourism. Spanish is still needed. Communication possible in tourist areas.",
        "visa": "90 days visa-free for most nationalities. Nicaragua is accessible. Extensions possible.",
        "culture": "Beach and surf culture dominates. Nicaraguan hospitality is warm. The vibe is laid-back.",
        "cleanliness": "Beach town standards. Tourism helps maintenance. Some infrastructure challenges.",
        "airquality": "Excellent air quality with ocean breezes. Clean coastal air. Fresh and pleasant."
    },
    "bocasdeltoro": {
        "climate": "Bocas del Toro has a tropical rainforest climate with rain possible any time. Temperatures stay warm (26-32°C). The Caribbean humidity is constant.",
        "cost": "Affordable with apartments from $400-700/month. Island prices but still cheap. Good value for Caribbean living.",
        "wifi": "Basic island infrastructure with speeds of 10-30 Mbps. Improving with tourism. Some reliability challenges.",
        "nightlife": "Vibrant beach party scene especially on weekends. The backpacker crowd creates energy. Caribbean vibes.",
        "nature": "Stunning archipelago with beaches, reef, and rainforest. Marine life is abundant. The natural beauty is exceptional.",
        "safety": "Generally safe tourist destination. Island community is friendly. Standard awareness applies.",
        "food": "Caribbean cuisine with fresh seafood. Island dining is casual. Prices reflect island logistics.",
        "community": "Established backpacker and expat community. Growing nomad presence. The vibe attracts free spirits.",
        "english": "English widely spoken due to Afro-Caribbean heritage. Better than mainland Panama. Communication is easy.",
        "visa": "Same generous Panamanian visa rules. 180 days. Island is accessible.",
        "culture": "Afro-Caribbean culture with reggae and island vibes. The archipelago has distinct character. Relaxed and welcoming.",
        "cleanliness": "Beach areas maintained for tourism. Some island infrastructure challenges. Standards vary by location.",
        "airquality": "Good air quality with Caribbean breezes. The rainforest and ocean clean the air. Fresh and humid."
    },
    "tulum": {
        "climate": "Tulum has a tropical climate with warm weather year-round (25-33°C). Hurricane season June to November. The beach breeze provides relief from humidity.",
        "cost": "More expensive than most of Mexico. Apartments from $1000-2000/month. Tourist prices have risen significantly.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving with development. Beach areas can be challenging.",
        "nightlife": "Bohemian beach club scene with electronic music. Sunset sessions are famous. The vibe is wellness meets party.",
        "nature": "Stunning Caribbean beaches and cenotes. Mayan ruins on the cliff. The natural beauty is exceptional.",
        "safety": "Tourist areas are generally safe. Some security concerns have emerged with growth. Standard awareness needed.",
        "food": "Trendy health-conscious cafés and upscale Mexican cuisine. Fresh seafood. The food scene has become sophisticated.",
        "community": "Large digital nomad and wellness community. Yoga and conscious living attract many. Community is very active.",
        "english": "Widely spoken due to international tourism. The nomad community uses English. Communication easy.",
        "visa": "Standard Mexican FMM for 180 days. Easy access. Popular for extended stays.",
        "culture": "Mayan heritage meets wellness and bohemian culture. The transformation has been dramatic. Beach and spiritual lifestyles blend.",
        "cleanliness": "Eco-conscious but infrastructure struggles with growth. Beach cleaning is prioritized. Development has outpaced services.",
        "airquality": "Excellent air quality with Caribbean breezes. Clean coastal air. Fresh and pleasant."
    },
    "sayulita": {
        "climate": "Sayulita has a tropical climate with warm weather year-round (25-33°C). Rainy season June to October. Pacific breeze provides relief.",
        "cost": "Moderate with apartments from $700-1300/month. Has become trendy and prices have risen. Still reasonable for a beach town.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving with nomad demand. Some areas have challenges.",
        "nightlife": "Beach bar and surf culture scene. Live music and casual parties. The vibe is relaxed and social.",
        "nature": "Beautiful Pacific beaches with surfing. Jungle and mountains nearby. The natural setting is lovely.",
        "safety": "Generally safe beach town. Standard awareness applies. The community is welcoming.",
        "food": "Mexican beach cuisine with fresh seafood. International options for tourists. The food scene is good.",
        "community": "Established surf and nomad community. The vibe attracts creatives. Community is welcoming and active.",
        "english": "Widely spoken due to American visitors. The surf community uses English. Communication easy.",
        "visa": "Standard Mexican FMM. 180 days. Popular for extended stays.",
        "culture": "Surf and beach culture with Mexican heart. The town has retained character despite growth. Bohemian and artistic.",
        "cleanliness": "Beach areas maintained. Growth has strained infrastructure. Standards are reasonable.",
        "airquality": "Excellent air quality with Pacific breezes. Clean coastal air. Fresh and pleasant."
    },
    "mazatlan": {
        "climate": "Mazatlán has a tropical wet and dry climate with hot summers (28-35°C) and pleasant winters (18-28°C). Hurricane season June to November.",
        "cost": "Affordable with apartments from $500-900/month. Less touristy than other beach towns. Good value.",
        "wifi": "Decent infrastructure with speeds of 25-60 Mbps. The city has reasonable connectivity. Improving.",
        "nightlife": "Vibrant malecón scene with bars and clubs. More authentic than some tourist towns. Mexican party culture.",
        "nature": "Long beach malecón and nearby Sierra Madre. Surfing and fishing traditions. Nature is accessible.",
        "safety": "Generally safe tourist areas. Some Sinaloa reputation but tourist zones are secure. Standard awareness.",
        "food": "Fresh seafood capital with aguachile and ceviche specialties. Authentic Mexican coastal cuisine. Excellent value.",
        "community": "Growing expat community especially retirees. Nomad presence is smaller. Less discovered.",
        "english": "Limited compared to more touristy areas. Spanish helps significantly. Tourism areas have some English.",
        "visa": "Standard Mexican FMM. 180 days. Easy access.",
        "culture": "Authentic Mexican port city with carnival traditions. Less touristy feel. The malecón culture is genuine.",
        "cleanliness": "Malecón is well-maintained. Some urban areas show wear. Standards are reasonable.",
        "airquality": "Good air quality with Pacific breezes. Coastal location helps. Fresh sea air."
    },
    "guanajuato": {
        "climate": "Guanajuato has a semi-arid highland climate with pleasant temperatures (15-28°C). The altitude moderates heat. Rainy season June to September.",
        "cost": "Affordable with apartments from $400-700/month. Excellent value for the charm. Cost of living is low.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. The city center has coverage. Improving with nomad interest.",
        "nightlife": "Student town energy with bars and callejoneadas (singing tours). The colonial setting adds atmosphere. Cultural events.",
        "nature": "Dramatic valley surrounded by mountains. The colorful hillsides are unique. Day trips to countryside possible.",
        "safety": "Very safe with low crime. The university and tourism create secure atmosphere. Walking at night is comfortable.",
        "food": "Mexican cuisine with regional specialties. The food scene is authentic and affordable. Student pricing helps.",
        "community": "Small but growing nomad community. Students and artists create creative environment. Community is developing.",
        "english": "Limited with Spanish essential. The student population has some English. Learning Spanish important.",
        "visa": "Standard Mexican FMM. 180 days. Easy for extended stays.",
        "culture": "UNESCO World Heritage colonial city. Cervantes Festival and cultural heritage. One of Mexico's most beautiful cities.",
        "cleanliness": "Historic center is well-maintained. The city takes pride in its UNESCO status. Standards are high.",
        "airquality": "Good air quality at altitude. The highland location helps. Fresh mountain air."
    },
    "puertoescondido": {
        "climate": "Puerto Escondido has a tropical climate with hot weather (28-35°C). Rainy season June to October. Pacific breeze provides relief.",
        "cost": "Affordable with apartments from $500-900/month. Oaxacan coast offers value. Less expensive than Tulum.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Some reliability challenges. Nomad demand is driving improvements.",
        "nightlife": "Beach bar scene with surf culture. More relaxed than party destinations. Local and international mix.",
        "nature": "Famous surf breaks including the Mexican Pipeline. Beaches and lagoons. Nature is the draw.",
        "safety": "Generally safe beach town. Standard awareness for Mexico. Surf community is welcoming.",
        "food": "Oaxacan cuisine including tlayudas and mezcal. Fresh seafood. Excellent food at low prices.",
        "community": "Growing digital nomad and surf community. Less discovered than Tulum. Community is developing.",
        "english": "Growing with nomad influx. Spanish still important. Communication possible in tourist areas.",
        "visa": "Standard Mexican FMM. 180 days. Popular for extended stays.",
        "culture": "Oaxacan culture meets surf lifestyle. Indigenous heritage is present. Authentic and developing.",
        "cleanliness": "Beach areas reasonably maintained. Development is ongoing. Standards vary.",
        "airquality": "Excellent air quality with Pacific breezes. Clean coastal air. Fresh and pleasant."
    },
    "queretaro": {
        "climate": "Querétaro has a semi-arid highland climate with pleasant temperatures (15-28°C). The altitude creates comfortable year-round weather. Limited rainfall.",
        "cost": "Affordable with apartments from $500-900/month. Good value for a modern Mexican city. Cost of living is reasonable.",
        "wifi": "Good infrastructure with speeds of 40-100 Mbps. The tech and business presence helps. Fiber available.",
        "nightlife": "Growing scene in the historic center. Wine bars and craft beer. More sophisticated than expected.",
        "nature": "Surrounding wine country and Sierra Gorda nearby. The city has parks and green spaces. Nature is accessible.",
        "safety": "One of Mexico's safest cities. The economy is stable and developed. Walking is comfortable anytime.",
        "food": "Mexican cuisine with growing food scene. Craft beer and wine culture. Quality and variety are good.",
        "community": "Growing expat and nomad community. The safety attracts families and professionals. Community is developing.",
        "english": "Business English exists but Spanish is dominant. Less touristy so Spanish helps. Communication possible.",
        "visa": "Standard Mexican FMM. 180 days. Good for extended stays.",
        "culture": "UNESCO colonial center with modern development. Industrial success meets heritage. The balance is appealing.",
        "cleanliness": "Historic center is immaculate. Modern areas are well-planned. Standards are high.",
        "airquality": "Good air quality at altitude. Less pollution than larger cities. Fresh highland air."
    }
}

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'category-descriptions.json')

    # Load existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new cities
    for city_id, descriptions in BATCH_CITIES.items():
        data[city_id] = descriptions
        print(f"Added descriptions for {city_id}")

    # Save updated data
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nTotal cities with descriptions: {len(data)}")

if __name__ == "__main__":
    main()

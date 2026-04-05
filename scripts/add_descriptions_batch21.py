#!/usr/bin/env python3
"""Batch 21: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "cordoba": {
        "climate": "Córdoba (Spain) has a Mediterranean climate with extremely hot summers (35-45°C) and mild winters (8-15°C). One of Spain's hottest cities. Dry heat.",
        "cost": "Affordable by Spanish standards. Apartments from €400-700/month. Southern Spain value.",
        "wifi": "Good Spanish infrastructure with speeds of 40-80 Mbps. Fiber expanding. Reliable.",
        "nightlife": "Andalusian tapas and bar scene. Less intense than Seville. Atmospheric old town.",
        "nature": "River and surrounding countryside. Sierra Morena mountains nearby. Nature accessible.",
        "safety": "Very safe with low crime. Andalusian hospitality. Comfortable.",
        "food": "Andalusian cuisine with salmorejo and flamenquín. Excellent tapas culture. Quality food.",
        "community": "Smaller international community. Growing interest in lesser-known Spain. Authentic.",
        "english": "Limited with Spanish essential. Tourism areas have some English. Learning Spanish helps.",
        "visa": "Schengen rules apply. Spanish digital nomad visa available. Standard access.",
        "culture": "UNESCO Mezquita and Jewish quarter. The Islamic heritage is spectacular. Cultural richness.",
        "cleanliness": "Historic center well-maintained. Andalusian standards. Pleasant.",
        "airquality": "Good air quality despite summer heat. Dry climate helps. Generally clean."
    },
    "cork": {
        "climate": "Cork has a temperate oceanic climate with mild temperatures (5-18°C). Rain is frequent. Ireland's south coast is milder than Dublin.",
        "cost": "More affordable than Dublin. Apartments from €1000-1600/month. Still expensive but better value.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Tech sector presence helps. Reliable.",
        "nightlife": "Famous pub culture with live music. University energy. Warm Irish atmosphere.",
        "nature": "Beautiful coastline and countryside. Ring of Kerry accessible. Nature is spectacular.",
        "safety": "Very safe with low crime. Irish hospitality is legendary. Comfortable.",
        "food": "Growing food scene with English Market famous. Local produce focus. Quality dining.",
        "community": "University and tech community. Growing international presence. Welcoming.",
        "english": "Native English with Irish accent. No barriers. The craic is part of communication.",
        "visa": "Non-Schengen with Irish visa rules. UK/Ireland common travel area. Various options.",
        "culture": "Ireland's second city with proud independent streak. Music and literary heritage. Cultural richness.",
        "cleanliness": "Well-maintained city center. Irish standards. Pleasant.",
        "airquality": "Good air quality with Atlantic breezes. The west coast is clean. Fresh Irish air."
    },
    "crete": {
        "climate": "Crete has a Mediterranean climate with hot summers (28-35°C) and mild winters (12-18°C). Greece's largest and southernmost island. Sunny most of the year.",
        "cost": "Affordable with apartments from €400-800/month. Greek island value. Good quality of life.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Various scenes from Heraklion to beach resorts. Greek nightlife applies. Social evenings.",
        "nature": "Diverse landscape from beaches to Samaria Gorge. Mountains and coastline. Nature is exceptional.",
        "safety": "Very safe with low crime. Cretan hospitality is generous. Comfortable.",
        "food": "Cretan diet is famous for health benefits. Fresh local ingredients. Outstanding cuisine.",
        "community": "Growing expat community. Attractive climate draws visitors. Community developing.",
        "english": "Tourism has built English skills. Greek helps for deeper connection. Communication possible.",
        "visa": "Schengen rules apply. Greece offers digital nomad visa. Easy access.",
        "culture": "Minoan civilization birthplace. Rich heritage across the island. Cultural depth.",
        "cleanliness": "Tourist areas maintained. Greek standards. Pleasant overall.",
        "airquality": "Excellent air quality with sea breezes. The island is clean. Fresh Mediterranean air."
    },
    "cuenca": {
        "climate": "Cuenca (Ecuador) has eternal spring climate at 2,500m with temperatures of 14-22°C year-round. The altitude moderates heat. Pleasant always.",
        "cost": "Very affordable with apartments from $350-600/month. Ecuador uses USD. Excellent value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. Mountain town standards.",
        "nightlife": "Limited but growing scene. Colonial center has options. Quiet evenings.",
        "nature": "Surrounded by mountains and rivers. Cajas National Park nearby. Nature is beautiful.",
        "safety": "Safe by Ecuadorian standards. Popular with retirees. Comfortable.",
        "food": "Ecuadorian cuisine with fresh local ingredients. Markets are excellent. Affordable dining.",
        "community": "Large retirement community. Growing digital presence. Established expat networks.",
        "english": "Growing due to expat community. Spanish still important. Communication possible.",
        "visa": "90 days visa-free. Ecuador has retirement and investment visas. Accessible.",
        "culture": "UNESCO colonial center is beautiful. Indigenous and Spanish heritage. Cultural richness.",
        "cleanliness": "Historic center well-maintained. Pride in UNESCO status. Clean and pleasant.",
        "airquality": "Excellent air quality at altitude. Mountain freshness. Clean highland air."
    },
    "cusco": {
        "climate": "Cusco has a subtropical highland climate at 3,400m with cool temperatures (5-20°C). The altitude requires acclimatization. Dry and wet seasons.",
        "cost": "Moderate due to tourism. Apartments from $400-700/month. Peru offers value outside tourist traps.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Improving.",
        "nightlife": "Vibrant scene on the Plaza. Tourist and local mix. Altitude affects partying.",
        "nature": "Gateway to Machu Picchu. Sacred Valley surroundings. Nature is spectacular.",
        "safety": "Generally safe with standard tourist awareness. Altitude sickness is real. Petty crime exists.",
        "food": "Peruvian cuisine with Andean specialties. Cuy (guinea pig) is traditional. Excellent dining.",
        "community": "Tourist and expat community. Spiritual seekers and travelers. Transient but present.",
        "english": "Tourism has built English skills. Spanish greatly helps. Communication possible.",
        "visa": "183 days visa-free for most nationalities. Peru is accessible.",
        "culture": "Inca capital with Spanish colonial overlay. The history is profound. Cultural weight is immense.",
        "cleanliness": "Tourist areas maintained. Historic preservation. Pleasant overall.",
        "airquality": "Excellent air quality at altitude. Thin air is clean. Pristine Andean air."
    },
    "cyprus": {
        "climate": "Cyprus has a Mediterranean climate with hot summers (30-38°C) and mild winters (12-18°C). One of Europe's sunniest locations. Beach weather most of the year.",
        "cost": "Moderate with apartments from €500-900/month. Island costs but reasonable. Good value for climate.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. EU standards apply. Reliable.",
        "nightlife": "Ayia Napa is famous for clubs. Limassol has sophisticated scene. Varied options.",
        "nature": "Beautiful coastline and Troodos Mountains. Beaches are excellent. Nature is varied.",
        "safety": "Very safe with low crime. The island is welcoming. Comfortable.",
        "food": "Cypriot mezze is excellent. Mediterranean influences. Fresh and flavorful.",
        "community": "British expat community and growing international presence. Tech sector developing. Networks exist.",
        "english": "Widely spoken as colonial heritage. Communication is easy. No barriers.",
        "visa": "EU rules for Republic of Cyprus. Non-Schengen but accessible. Various residence options.",
        "culture": "Greek and Turkish heritage. Divided island adds complexity. Mediterranean lifestyle.",
        "cleanliness": "Tourist areas well-maintained. Standards are good. Pleasant.",
        "airquality": "Excellent air quality with Mediterranean breezes. The island is clean. Fresh sea air."
    },
    "daegu": {
        "climate": "Daegu has a humid subtropical climate with hot summers (28-35°C) and cold winters (-3 to 8°C). Known as Korea's hottest city. Four distinct seasons.",
        "cost": "More affordable than Seoul. Apartments from ₩500,000-900,000/month ($400-720). Good value for Korea.",
        "wifi": "Excellent Korean infrastructure with speeds of 100+ Mbps. Fast and ubiquitous.",
        "nightlife": "Growing scene with downtown options. Less famous than Seoul but active. Korean nightlife culture.",
        "nature": "Mountains surrounding the basin. Hiking is accessible. Nature is close.",
        "safety": "Very safe with low crime. Korean society is orderly. Comfortable.",
        "food": "Famous for spicy flat noodles (makchang). Korean cuisine with local specialties. Quality.",
        "community": "English teacher and expat community. Less international than Seoul. Authentic Korea.",
        "english": "Less English than Seoul. Korean helps significantly. Learning is important.",
        "visa": "Standard Korean visa rules. K-ETA required. Working holiday available.",
        "culture": "Traditional Korean character preserved. Temple heritage. Different from Seoul.",
        "cleanliness": "Very clean with Korean standards. Well-maintained. Good.",
        "airquality": "Can be affected by fine dust. Basin traps pollution. Variable."
    },
    "dakar": {
        "climate": "Dakar has a tropical semi-arid climate with warm temperatures (23-32°C). Dry season November to May. The Atlantic moderates heat.",
        "cost": "Moderate for West Africa. Apartments from $500-1000/month. Regional hub prices.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Senegal has invested. Developing.",
        "nightlife": "Famous music scene with Senegalese mbalax. Clubs and live music. African energy.",
        "nature": "Atlantic coastline and nearby islands. Pink Lake is famous. Coastal nature.",
        "safety": "Generally safe for Africa. Senegal is stable. Standard awareness needed.",
        "food": "Senegalese cuisine with thieboudienne (fish and rice). Fresh and flavorful. Cultural experience.",
        "community": "NGO and development community. Growing tech hub. International presence.",
        "english": "French is dominant. English is limited. French is important.",
        "visa": "Visa-free for many nationalities. Senegal is accessible. 90-day stays common.",
        "culture": "Teranga (hospitality) is central. Music and arts thrive. Vibrant African culture.",
        "cleanliness": "Varies by area. Development ongoing. Challenges exist.",
        "airquality": "Good with Atlantic breezes. Harmattan dust affects winter. Generally fresh."
    },
    "dalat": {
        "climate": "Da Lat has a subtropical highland climate at 1,500m with pleasant temperatures (15-25°C). Known as the city of eternal spring. Cool and refreshing.",
        "cost": "Very affordable with apartments from $200-400/month. Vietnam is cheap. Excellent value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Better than rural areas. Growing.",
        "nightlife": "Limited but growing scene. Night markets and cafes. Quiet town.",
        "nature": "Pine forests and waterfalls. French colonial hill station vibe. Nature is the draw.",
        "safety": "Very safe with Vietnamese hospitality. Peaceful mountain town. Comfortable.",
        "food": "Fresh vegetables from local farms. Vietnamese cuisine with highland twist. Excellent.",
        "community": "Growing nomad community attracted by climate. Artists and nature lovers. Developing.",
        "english": "Growing with tourism. Vietnamese is local. Learning Vietnamese helps.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy 30-day stays.",
        "culture": "French colonial heritage in the highlands. The vibe is unique in Vietnam. Different atmosphere.",
        "cleanliness": "Generally clean mountain town. Tourism helps standards. Pleasant.",
        "airquality": "Excellent air quality with pine forests. Fresh mountain air. Pristine."
    },
    "danang": {
        "climate": "Da Nang has a tropical monsoon climate with warm temperatures (22-33°C). Dry season March to August is best. Beach weather much of the year.",
        "cost": "Affordable with apartments from $300-600/month. Vietnam offers value. Beach living is accessible.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Vietnam has invested. Reliable.",
        "nightlife": "Growing beach bar scene. The city is developing rapidly. Options increasing.",
        "nature": "Beautiful beaches and Marble Mountains. Hai Van Pass nearby. Nature is excellent.",
        "safety": "Very safe with Vietnamese hospitality. Beach town atmosphere. Comfortable.",
        "food": "Central Vietnamese cuisine with banh mi and mi quang. Fresh seafood. Excellent.",
        "community": "Rapidly growing digital nomad community. The beach lifestyle attracts workers. Active.",
        "english": "Growing with international presence. Vietnamese helps. Communication improving.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy access.",
        "culture": "Modern Vietnamese beach city. Ancient Hoi An nearby. Development meets history.",
        "cleanliness": "Well-maintained modern city. Beach cleanliness prioritized. Good standards.",
        "airquality": "Good air quality with sea breezes. Coastal freshness. Clean."
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

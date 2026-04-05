#!/usr/bin/env python3
"""Batch 37: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "roatan": {
        "climate": "Roatán has a tropical climate with warm temperatures year-round (25-32°C). Caribbean island weather. Dry season February to June.",
        "cost": "Moderate for Caribbean. Apartments from $500-1000/month. Bay Islands pricing.",
        "wifi": "Improving infrastructure with speeds of 15-50 Mbps. Island challenges. Developing.",
        "nightlife": "Beach bar scene in West End and West Bay. Relaxed Caribbean vibe.",
        "nature": "World-class diving and snorkeling. Mesoamerican Reef. Nature spectacular.",
        "safety": "Safe tourist island. Honduran mainland different. Comfortable.",
        "food": "Caribbean cuisine with fresh seafood. International options. Good variety.",
        "community": "Diving and expat community. Growing digital presence. Welcoming.",
        "english": "English widely spoken. Bay Islands English Creole. Communication easy.",
        "visa": "CA-4 agreement for 90 days. Honduras accessible.",
        "culture": "Bay Islands English Creole heritage. Diving culture dominates. Caribbean character.",
        "cleanliness": "Tourist areas maintained. Beach cleaning. Good.",
        "airquality": "Excellent air quality with Caribbean breezes. Pristine."
    },
    "rome": {
        "climate": "Rome has a Mediterranean climate with hot summers (28-33°C) and mild winters (6-14°C). Eternal City weather. Pleasant spring and fall.",
        "cost": "Moderate to expensive. Apartments from €800-1400/month. Tourist center pricier.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Variable by area. Improving.",
        "nightlife": "Vibrant scene in Trastevere and centro. Aperitivo culture. Very active.",
        "nature": "Urban but parks available. Day trips to coast and countryside. Villa Borghese.",
        "safety": "Safe with standard tourist awareness. Pickpockets in crowds. Generally comfortable.",
        "food": "Italian cuisine capital. Carbonara, cacio e pepe, supplì. Outstanding.",
        "community": "International and creative community. Eternal expat presence. Established.",
        "english": "Good in tourism. Italian appreciated. Communication possible.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "2,700 years of history. Colosseum to Vatican. Cultural weight immense.",
        "cleanliness": "Varies by area. Historic center challenges. Tourism strain shows.",
        "airquality": "Moderate with traffic effects. Some pollution. Acceptable."
    },
    "rotterdam": {
        "climate": "Rotterdam has a temperate oceanic climate with mild temperatures (3-22°C). North Sea influence. Rain is common.",
        "cost": "Moderate for Netherlands. Apartments from €900-1500/month. Less than Amsterdam.",
        "wifi": "Excellent Dutch infrastructure with speeds of 100+ Mbps. Reliable.",
        "nightlife": "Vibrant scene in Witte de Withstraat. Clubs and bars. Very active.",
        "nature": "Urban with harbor. Day trips to Kinderdijk windmills. Parks available.",
        "safety": "Very safe with low crime. Dutch organization. Comfortable.",
        "food": "International and innovative scene. Market Hall is famous. Quality.",
        "community": "Architecture and design community. Port city diversity. Welcoming.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Dutch options. Standard access.",
        "culture": "Modern architecture capital. Rebuilt after WWII. Innovation defines identity.",
        "cleanliness": "Very clean with Dutch standards. Modern city. Excellent.",
        "airquality": "Good air quality with North Sea breezes. Port managed. Fresh."
    },
    "rovaniemi": {
        "climate": "Rovaniemi has a subarctic climate with cool summers (12-20°C) and very cold winters (-15 to -5°C). Arctic Circle location. Extreme seasons.",
        "cost": "Expensive as Finnish Lapland. Apartments from €700-1200/month. Arctic premium.",
        "wifi": "Excellent Finnish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Limited but atmospheric. Bars and Northern Lights watching. Seasonal.",
        "nature": "Gateway to Lapland wilderness. Northern Lights and midnight sun. Nature spectacular.",
        "safety": "Extremely safe with Finnish standards. Very comfortable.",
        "food": "Lappish cuisine with reindeer and berries. Quality restaurants. Unique flavors.",
        "community": "Small local and tourism community. Santa Claus village draws visitors. Intimate.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Finland is EU. Standard access.",
        "culture": "Santa Claus hometown on Arctic Circle. Indigenous Sámi influences. Arctic identity.",
        "cleanliness": "Very clean with Finnish standards. Pristine wilderness. Excellent.",
        "airquality": "Excellent air quality. Lapland freshness. Among cleanest. Pristine."
    },
    "saigon": {
        "climate": "Ho Chi Minh City has a tropical climate with hot temperatures year-round (27-35°C). Rainy season May to November. Humidity is high.",
        "cost": "Affordable with apartments from $400-800/month. Vietnam offers value. Growing tech hub.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. Vietnam invested. Reliable.",
        "nightlife": "Very active scene in Districts 1 and 3. Bui Vien is famous. Vibrant.",
        "nature": "Urban megacity. Mekong Delta day trips. Cu Chi tunnels nearby.",
        "safety": "Generally safe with traffic biggest risk. Comfortable for Vietnam.",
        "food": "Vietnamese cuisine excellence. Pho, banh mi, com tam. Outstanding street food.",
        "community": "Large expat and digital nomad community. Tech growing. Established.",
        "english": "Growing especially in business areas. Vietnamese helps. Communication improving.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy access.",
        "culture": "Dynamic economic engine. War history and rapid development. Energetic modern Vietnam.",
        "cleanliness": "Developing with challenges. Some areas maintained. Variable.",
        "airquality": "Can be affected by traffic and industry. Variable. Check conditions."
    },
    "salamanca": {
        "climate": "Salamanca has a continental Mediterranean climate with hot summers (28-35°C) and cold winters (0-10°C). Castilian extremes. Beautiful spring and fall.",
        "cost": "Affordable for Spain. Apartments from €400-700/month. University town value.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Famous student scene. Plaza Mayor energy. Bars and tapas. Very active.",
        "nature": "Castilian plateau and rivers. Day trips to Portugal. Nature accessible.",
        "safety": "Very safe with low crime. University atmosphere. Comfortable.",
        "food": "Castilian cuisine with jamón and roasts. Quality tapas. Excellent.",
        "community": "Massive student community. Spanish language school capital. International.",
        "english": "Improving with language students. Spanish immersion. Spanish essential.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "UNESCO old town with historic university. Golden sandstone. Intellectual heritage.",
        "cleanliness": "Historic center well-maintained. Pride in heritage. Beautiful.",
        "airquality": "Good air quality with plateau openness. Continental freshness. Clean."
    },
    "salzburg": {
        "climate": "Salzburg has an oceanic climate with warm summers (18-25°C) and cold winters (-2 to 4°C). Alps nearby affect weather. Four seasons.",
        "cost": "Expensive as Austrian city. Apartments from €800-1400/month. Tourism premium.",
        "wifi": "Excellent Austrian infrastructure with speeds of 50-100+ Mbps. Reliable.",
        "nightlife": "Charming scene in old town. Festival season is famous. Sophisticated.",
        "nature": "Alps surround the city. Lake District nearby. Nature spectacular.",
        "safety": "Very safe with Austrian organization. Low crime. Comfortable.",
        "food": "Austrian cuisine with Salzburger Nockerl. Quality restaurants. Mozart balls everywhere.",
        "community": "Music and tourism community. Festival crowds seasonal. Established.",
        "english": "Good English proficiency. German helps. Communication possible.",
        "visa": "Schengen rules apply. Austrian options. Standard access.",
        "culture": "Mozart's birthplace with baroque architecture. Sound of Music fame. Musical identity.",
        "cleanliness": "Very clean with Austrian standards. Historic preservation. Excellent.",
        "airquality": "Good air quality with Alps nearby. Fresh mountain air. Clean."
    },
    "sanabona": {
        "climate": "San Antonio (Texas) has a humid subtropical climate with hot summers (33-38°C) and mild winters (8-17°C). Central Texas heat. Long summers.",
        "cost": "Affordable for US. Apartments from $1100-1700/month. Texas value.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Reliable.",
        "nightlife": "River Walk scene and Southtown. Margaritas and Tejano. Active.",
        "nature": "Hill Country nearby. River Walk is urban oasis. Day trips available.",
        "safety": "Generally safe. Standard urban awareness. Comfortable.",
        "food": "Tex-Mex excellence. Puffy tacos and breakfast tacos. Outstanding.",
        "community": "Military, tourism, and tech community. Diverse. Welcoming.",
        "english": "Native American English. Spanish also common. No barriers.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "Alamo and Spanish missions. Tex-Mex culture. Texan pride with Mexican influence.",
        "cleanliness": "River Walk maintained. City varies. Good tourist areas.",
        "airquality": "Can be affected by heat and traffic. Generally acceptable."
    },
    "sanpedro": {
        "climate": "San Pedro (Belize) has a tropical climate with warm temperatures year-round (25-32°C). Caribbean island weather. Hurricane season June to November.",
        "cost": "Moderate for Caribbean. Apartments from $600-1100/month. Belize prices.",
        "wifi": "Basic infrastructure with speeds of 10-40 Mbps. Island challenges. Improving.",
        "nightlife": "Beach bar scene. Reggae and Caribbean vibe. Relaxed.",
        "nature": "Belize Barrier Reef is outstanding. World-class diving. Nature spectacular.",
        "safety": "Generally safe island. Belize City different. Comfortable.",
        "food": "Caribbean and Belizean cuisine. Fresh seafood. Quality available.",
        "community": "Expat and diving community. Growing nomad presence. Welcoming.",
        "english": "English is official language. Communication easy.",
        "visa": "30 days on arrival, extendable. Belize accessible.",
        "culture": "Caribbean meets Mayan heritage. Island lifestyle. Relaxed character.",
        "cleanliness": "Beach areas maintained. Island standards. Good.",
        "airquality": "Excellent with Caribbean breezes. Pristine."
    },
    "sansebastian": {
        "climate": "San Sebastián has an oceanic climate with mild temperatures (8-24°C). Atlantic influence. Rain is common. Pleasant summers.",
        "cost": "Expensive for Spain. Apartments from €800-1400/month. Basque Country premium.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Famous pintxos scene. Parte Vieja bars. Sophisticated and active.",
        "nature": "Beautiful beaches and surrounding mountains. Bay is stunning. Nature excellent.",
        "safety": "Very safe with low crime. Basque hospitality. Comfortable.",
        "food": "World-class food scene. Most Michelin stars per capita. Pintxos are legendary. Outstanding.",
        "community": "Foodie and local community. Summer tourism. International.",
        "english": "Moderate with Spanish essential. Basque is local. Spanish helps.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Basque identity with Belle Époque elegance. Food defines culture. Refined character.",
        "cleanliness": "Very clean with Basque pride. Beach maintained. Excellent.",
        "airquality": "Excellent air quality with Atlantic breezes. Fresh coastal air."
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

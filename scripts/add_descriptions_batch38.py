#!/usr/bin/env python3
"""Batch 38: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "santamarta": {
        "climate": "Santa Marta has a tropical climate with hot temperatures year-round (27-34°C). Caribbean coast. Dry season December to April.",
        "cost": "Affordable with apartments from $300-600/month. Colombia offers value. Beach town pricing.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Beach bar scene and Taganga party. Caribbean energy. Active.",
        "nature": "Tayrona Park and Sierra Nevada. Beautiful coastline. Nature spectacular.",
        "safety": "Generally safe tourist area. Standard awareness. Comfortable.",
        "food": "Caribbean Colombian cuisine. Fresh seafood and ceviches. Good value.",
        "community": "Backpacker and surf community. Growing nomad presence. Developing.",
        "english": "Growing with tourism. Spanish essential.",
        "visa": "90 days visa-free with extension. Colombia accessible.",
        "culture": "Caribbean Colombia with indigenous heritage. Relaxed beach culture. Gateway to Tayrona.",
        "cleanliness": "Beach areas maintained. Development varies. Good tourist zones.",
        "airquality": "Good with Caribbean breezes. Fresh coastal air."
    },
    "santorini": {
        "climate": "Santorini has a Mediterranean climate with hot summers (28-33°C) and mild winters (12-15°C). Greek island sunshine. Beach weather most of year.",
        "cost": "Expensive especially in summer. Apartments from €700-1500/month. Tourism premium high.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Famous sunset scene. Fira and Oia bars. Sophisticated and romantic.",
        "nature": "Volcanic caldera is stunning. Black and red beaches. Nature dramatic.",
        "safety": "Very safe with low crime. Greek hospitality. Comfortable.",
        "food": "Greek cuisine with local specialties. Quality restaurants. Good variety.",
        "community": "Tourism and seasonal workers. Romantic couples dominate. International.",
        "english": "Good in tourism. Greek helps. Communication possible.",
        "visa": "Schengen rules apply. Greece is EU. Standard access.",
        "culture": "Volcanic island with whitewashed buildings. The aesthetic is iconic. Romantic identity.",
        "cleanliness": "Tourist areas well-maintained. Famous villages pristine. Beautiful.",
        "airquality": "Excellent air quality with sea breezes. Clean Aegean air."
    },
    "sapabay": {
        "climate": "Sapa has a subtropical highland climate with cool temperatures (8-22°C). Mountain weather with mist. Best season September to November.",
        "cost": "Very affordable with apartments from $200-400/month. Vietnam offers value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Mountain town challenges. Improving.",
        "nightlife": "Very limited. Small bars in town. Trekking focus.",
        "nature": "Rice terraces and mountain landscapes. Fansipan peak nearby. Nature spectacular.",
        "safety": "Safe mountain town. Vietnamese hospitality. Comfortable.",
        "food": "Vietnamese mountain cuisine. Hotpot and local specialties. Simple and good.",
        "community": "Trekking community and ethnic minorities. Hmong and Dao villages. Authentic.",
        "english": "Limited with Vietnamese and ethnic languages. Tour guides help.",
        "visa": "Standard Vietnamese visa rules. E-visa available.",
        "culture": "Ethnic minority cultures and French colonial remnants. Rice terrace heritage. Traditional atmosphere.",
        "cleanliness": "Town center maintained for tourism. Variable. Tourist standards.",
        "airquality": "Excellent mountain air quality. Fresh and cool. Pristine."
    },
    "sarajevo": {
        "climate": "Sarajevo has a humid continental climate with warm summers (20-28°C) and cold winters (-4 to 3°C). Valley setting. Four seasons with snow.",
        "cost": "Very affordable with apartments from €250-500/month. Bosnia offers excellent value.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Improving. Reliable.",
        "nightlife": "Growing scene with bars and cafes. Baščaršija atmosphere. Active.",
        "nature": "Surrounded by mountains. Ski resorts and hiking. Nature accessible.",
        "safety": "Safe with Bosnian hospitality. War history adds context. Comfortable.",
        "food": "Bosnian cuisine with ćevapi and burek. Coffee culture is strong. Excellent.",
        "community": "Growing international interest. Film festival draws visitors. Welcoming.",
        "english": "Good especially among youth. Communication possible.",
        "visa": "90 days visa-free for most. Bosnia accessible.",
        "culture": "Where East meets West. Ottoman and Austro-Hungarian heritage. Complex history.",
        "cleanliness": "Old town maintained. Development continues. Good standards.",
        "airquality": "Can be affected by winter inversion. Summer is fine. Check conditions."
    },
    "sardinia": {
        "climate": "Sardinia has a Mediterranean climate with hot summers (28-33°C) and mild winters (10-16°C). Italian island paradise. Beach weather much of year.",
        "cost": "Moderate with apartments from €500-1000/month. Summer prices higher. Island costs.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Italian standards. Reliable.",
        "nightlife": "Costa Smeralda is famous jet-set scene. Town bars elsewhere. Varies by area.",
        "nature": "Stunning beaches and wild interior. Nuraghi ruins. Nature exceptional.",
        "safety": "Very safe with low crime. Sardinian hospitality. Comfortable.",
        "food": "Sardinian cuisine with pecorino and seafood. Quality is excellent. Distinctive flavors.",
        "community": "Seasonal tourism community. Local Sardinian character. International in summer.",
        "english": "Limited with Italian essential. Tourism has some English.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Unique Sardinian identity distinct from Italy. Nuragic heritage. Island pride.",
        "cleanliness": "Beaches and resorts well-maintained. Italian standards. Good.",
        "airquality": "Excellent air quality with Mediterranean breezes. Island freshness. Pristine."
    },
    "savannah": {
        "climate": "Savannah has a humid subtropical climate with hot summers (30-35°C) and mild winters (8-18°C). Southern US humidity. Spanish moss weather.",
        "cost": "Moderate for US. Apartments from $1200-1900/month. Growing city.",
        "wifi": "Good US infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Charming scene in historic district. Open container laws are unique. Atmospheric.",
        "nature": "Coastal marshes and squares with oak trees. Tybee Island beach. Nature accessible.",
        "safety": "Generally safe in tourist areas. Research neighborhoods.",
        "food": "Southern cuisine excellence. Shrimp and grits, Low Country. Outstanding.",
        "community": "Arts and tourism community. SCAD influence. Growing.",
        "english": "Native American English with southern charm. No barriers.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "Antebellum South preserved. Historic squares and architecture. Southern charm.",
        "cleanliness": "Historic district well-maintained. Tourism standards. Beautiful.",
        "airquality": "Can be humid and heavy. Coastal breezes help. Acceptable."
    },
    "sendai": {
        "climate": "Sendai has a humid continental climate with warm summers (23-28°C) and cold winters (-1 to 5°C). Tohoku region. Four seasons.",
        "cost": "Moderate for Japan. Apartments from ¥60,000-110,000/month ($400-730). More affordable than Tokyo.",
        "wifi": "Excellent Japanese infrastructure with speeds of 100+ Mbps. Impeccable.",
        "nightlife": "Kokubuncho district has bars and clubs. Japanese nightlife. Active.",
        "nature": "Matsushima Bay and mountains nearby. City of trees. Nature accessible.",
        "safety": "Extremely safe with Japanese standards. Very comfortable.",
        "food": "Famous for gyutan (beef tongue). Tohoku specialties. Quality.",
        "community": "University and local community. International students. Welcoming.",
        "english": "Limited with Japanese helpful. Less tourist than Tokyo.",
        "visa": "Standard Japanese visa rules. 90 days visa-free for many.",
        "culture": "Date clan heritage. Tanabata festival famous. Tohoku character.",
        "cleanliness": "Immaculately clean with Japanese standards. Pristine.",
        "airquality": "Good air quality with surrounding nature. Fresh. Clean."
    },
    "sevillaold": {
        "climate": "Seville has a Mediterranean climate with extremely hot summers (35-45°C) and mild winters (8-17°C). Spain's hottest major city. Scorching July-August.",
        "cost": "Moderate for Spain. Apartments from €550-950/month. Andalusian value.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Famous flamenco scene and tapas bars. Triana and center. Very active and late.",
        "nature": "Urban with Guadalquivir River. Day trips to Sierra possible. Parks available.",
        "safety": "Safe with standard tourist awareness. Pickpockets in crowds. Comfortable.",
        "food": "Andalusian tapas excellence. Fried fish and gazpacho. Outstanding.",
        "community": "Large student and flamenco community. International presence. Welcoming.",
        "english": "Limited with Spanish essential. Tourism building English. Spanish important.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Flamenco birthplace with Moorish heritage. Alcázar and cathedral. Deep culture.",
        "cleanliness": "Historic center well-maintained. Tourism drives standards. Good.",
        "airquality": "Generally good but extreme heat affects comfort. Dry and clear."
    },
    "shanghai": {
        "climate": "Shanghai has a humid subtropical climate with hot summers (30-38°C) and cold winters (2-8°C). Four seasons with humidity. Monsoon influences.",
        "cost": "Expensive for China. Apartments from ¥6000-12000/month ($840-1680). International city pricing.",
        "wifi": "Excellent infrastructure with VPN needed for Western services. Speeds of 50-200 Mbps.",
        "nightlife": "World-class scene from Bund to French Concession. Legendary and varied.",
        "nature": "Urban megacity. Day trips to water towns. Parks within city.",
        "safety": "Very safe with Chinese standards. Low crime. Comfortable.",
        "food": "Shanghai cuisine with xiaolongbao. International everything. Outstanding.",
        "community": "Large international business community. Established networks. Cosmopolitan.",
        "english": "Good in international areas. Mandarin helps significantly.",
        "visa": "Chinese visa rules. 144-hour transit possible. Plan ahead.",
        "culture": "Art Deco meets modern towers. The Bund is iconic. Global China.",
        "cleanliness": "Very clean with Chinese efficiency. Well-maintained. Excellent.",
        "airquality": "Variable with pollution concerns. Better than Beijing usually. Check conditions."
    },
    "sibiu": {
        "climate": "Sibiu has a humid continental climate with warm summers (20-27°C) and cold winters (-5 to 2°C). Transylvanian weather. Four seasons.",
        "cost": "Very affordable with apartments from €250-450/month. Romania offers excellent value.",
        "wifi": "Excellent Romanian infrastructure with speeds of 50-150+ Mbps. Among Europe's fastest.",
        "nightlife": "Charming scene in historic center. Bars and cafes. Atmospheric.",
        "nature": "Carpathian Mountains nearby. Hiking and skiing accessible. Nature spectacular.",
        "safety": "Very safe with low crime. Romanian hospitality. Comfortable.",
        "food": "Transylvanian cuisine with Saxon influences. Hearty and affordable.",
        "community": "Growing international interest. Cultural events draw visitors. Authentic.",
        "english": "Good among younger Romanians. Communication possible.",
        "visa": "EU rules apply. Romania approaching Schengen. Standard access.",
        "culture": "Saxon heritage in Transylvania. European Capital of Culture 2007. Beautiful preservation.",
        "cleanliness": "Historic center immaculately maintained. Pride in heritage. Excellent.",
        "airquality": "Excellent air quality with Carpathian surroundings. Fresh mountain air. Pristine."
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

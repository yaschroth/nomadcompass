#!/usr/bin/env python3
"""Batch 29: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "leipzig": {
        "climate": "Leipzig has a humid continental climate with warm summers (18-25°C) and cold winters (-2 to 4°C). Eastern German weather patterns. Four seasons.",
        "cost": "Affordable for Germany. Apartments from €500-800/month. Eastern Germany value.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Tech scene growing. Reliable.",
        "nightlife": "Famous alternative scene. Clubs and bars in former industrial spaces. Berlin vibes at lower cost.",
        "nature": "Lakes and parks around city. Neuseenland recreation area. Nature accessible.",
        "safety": "Safe with standard awareness. Alternative character is welcoming. Comfortable.",
        "food": "Growing food scene with international options. Student-friendly pricing. Quality improving.",
        "community": "Creative and tech community. Artists and students. Berlin alternative. Active.",
        "english": "Good among younger Germans. University helps. Communication possible.",
        "visa": "Schengen rules apply. German freelance visa. Standard access.",
        "culture": "Bach and Goethe heritage. Alternative scene thrives. Cultural depth meets creativity.",
        "cleanliness": "Well-maintained with German standards. Improving. Good.",
        "airquality": "Good air quality for eastern Germany. Better than industrial past. Clean."
    },
    "lille": {
        "climate": "Lille has a temperate oceanic climate with mild temperatures (3-24°C). Rain is common. Northern French weather.",
        "cost": "Moderate for France. Apartments from €600-1000/month. More affordable than Paris.",
        "wifi": "Good French infrastructure with speeds of 50-100 Mbps. Eurostar city connectivity. Reliable.",
        "nightlife": "Vibrant student scene. Flemish influence. Active and diverse.",
        "nature": "Urban with surrounding countryside. Day trips to coast possible. Parks provide green.",
        "safety": "Safe with standard urban awareness. French hospitality. Comfortable.",
        "food": "Flemish influences with moules frites and waffles. French quality. Hearty and good.",
        "community": "University and business community. Cross-border connections. Active.",
        "english": "Moderate with French essential. Business uses English. French helps significantly.",
        "visa": "Schengen rules apply. French options available. Standard access.",
        "culture": "Flemish heritage meets French refinement. The old town is charming. Cross-border character.",
        "cleanliness": "City center maintained. French standards. Good.",
        "airquality": "Good air quality for industrial region. Improving. Acceptable."
    },
    "limassolcity": {
        "climate": "Limassol has a Mediterranean climate with hot summers (30-35°C) and mild winters (12-18°C). Cyprus is sunny. Beach weather most of year.",
        "cost": "Moderate with apartments from €600-1100/month. Cyprus offers value for climate. Growing.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. EU standards. Reliable.",
        "nightlife": "Growing scene with beach clubs and bars. International community. Active.",
        "nature": "Beaches and Troodos Mountains nearby. Wine villages accessible. Nature is varied.",
        "safety": "Very safe with low crime. Cyprus hospitality. Very comfortable.",
        "food": "Cypriot mezze and Mediterranean cuisine. Fresh seafood. Quality.",
        "community": "Large international community. Tech and finance presence. Established.",
        "english": "Excellent English proficiency. British heritage. Communication easy.",
        "visa": "EU rules apply. Cyprus has residence programs. Various options.",
        "culture": "Ancient history meets modern Cyprus. Wine culture developing. Mediterranean lifestyle.",
        "cleanliness": "Tourist areas well-maintained. New developments clean. Good standards.",
        "airquality": "Excellent air quality with sea breezes. Mediterranean freshness. Clean."
    },
    "liverpool": {
        "climate": "Liverpool has a temperate oceanic climate with mild temperatures (4-19°C). Rain is common. Maritime influence from Irish Sea.",
        "cost": "Affordable for UK. Apartments from £700-1100/month. More affordable than London or Manchester.",
        "wifi": "Good UK infrastructure with speeds of 50-100 Mbps. Reliable. Standard British.",
        "nightlife": "Famous scene with Beatles heritage. Concert venues and clubs. Very active.",
        "nature": "Waterfront and nearby beaches. Lake District day trips. Nature accessible.",
        "safety": "Safe with standard urban awareness. Scouse friendliness. Comfortable.",
        "food": "Growing food scene with independent focus. International options. Improving quality.",
        "community": "Creative and football community. University brings diversity. Welcoming.",
        "english": "Native English with Scouse accent. No barriers. Friendly communication.",
        "visa": "UK visa rules apply. Various categories. Post-Brexit requirements.",
        "culture": "Beatles birthplace with maritime heritage. The city has reinvented itself. Cultural pride.",
        "cleanliness": "Waterfront and center maintained. Development continues. Good.",
        "airquality": "Good air quality with maritime breezes. Irish Sea helps. Fresh."
    },
    "ljubljana": {
        "climate": "Ljubljana has a humid continental climate with warm summers (20-27°C) and cold winters (-2 to 5°C). Alps affect weather. Four seasons.",
        "cost": "Moderate for Europe. Apartments from €500-900/month. Slovenia is reasonable. Growing.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Slovenia invests in digital. Reliable.",
        "nightlife": "Charming scene along the river. Student energy. Atmospheric rather than wild.",
        "nature": "Alps and Lake Bled nearby. Caves and coast accessible. Nature is spectacular.",
        "safety": "Very safe with low crime. Slovenian hospitality. Very comfortable.",
        "food": "Slovenian cuisine with Italian and Austrian influences. Fresh and quality. Growing scene.",
        "community": "Growing digital and creative community. Small but welcoming. Intimate.",
        "english": "Good English proficiency. Communication easy.",
        "visa": "Schengen rules apply. Slovenia has various options. Standard access.",
        "culture": "Small capital with big charm. Car-free center and dragon bridges. Green capital status.",
        "cleanliness": "Very clean and green. European Green Capital 2016. Pristine.",
        "airquality": "Good air quality with Alps nearby. Green policies help. Fresh."
    },
    "lodz": {
        "climate": "Łódź has a humid continental climate with warm summers (18-25°C) and cold winters (-4 to 2°C). Central Poland weather. Four seasons.",
        "cost": "Very affordable for Europe. Apartments from €300-550/month. Excellent value.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Poland investing. Reliable.",
        "nightlife": "Growing scene with off-Piotrkowska clubs. Former industrial spaces. Developing.",
        "nature": "Urban with surrounding forests. Parks within city. Day trips possible.",
        "safety": "Safe with standard awareness. Polish hospitality. Comfortable.",
        "food": "Polish cuisine with growing international scene. Affordable. Quality improving.",
        "community": "Creative and tech community growing. Film school heritage. Developing.",
        "english": "Good among younger Poles. Tourism less developed. Communication possible.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "Industrial heritage turned creative. Film school is famous. Transforming city.",
        "cleanliness": "Developing with ongoing renovation. Former industrial areas improving. Variable.",
        "airquality": "Can be affected by heating in winter. Better in summer. Check conditions."
    },
    "lombok": {
        "climate": "Lombok has a tropical climate with warm temperatures (24-33°C). Dry season April to October. Less rain than Bali.",
        "cost": "Very affordable with apartments from $200-500/month. Indonesia offers value. Less touristy than Bali.",
        "wifi": "Improving infrastructure with speeds of 15-50 Mbps. Senggigi and Kuta have options. Developing.",
        "nightlife": "Limited but growing. Beach bars in tourist areas. More relaxed than Bali.",
        "nature": "Mount Rinjani and Gili Islands. Beaches are stunning. Nature is spectacular.",
        "safety": "Safe tourist destination. Indonesian hospitality. Comfortable. Earthquake awareness needed.",
        "food": "Indonesian cuisine with Sasak specialties. Fresh seafood. Excellent value.",
        "community": "Growing nomad and surf community. Bali spillover. Developing.",
        "english": "Moderate in tourism areas. Indonesian helps. Communication possible.",
        "visa": "Indonesian visa rules. Visa on arrival or e-visa. 30-60 days.",
        "culture": "Sasak heritage different from Bali. Muslim majority. Distinct character.",
        "cleanliness": "Tourist areas maintained. Development ongoing. Variable.",
        "airquality": "Good air quality with ocean breezes. Island freshness. Clean."
    },
    "loscabos": {
        "climate": "Los Cabos has a desert climate with hot temperatures (24-35°C). Very little rain. Mexican Pacific warmth.",
        "cost": "Expensive for Mexico. Apartments from $800-1500/month. Resort destination pricing.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Tourist development ensures connectivity. Reliable.",
        "nightlife": "Resort scene with beach clubs and bars. Cabo San Lucas is active. Party atmosphere.",
        "nature": "Dramatic desert meets sea. El Arco and whale watching. Nature is stunning.",
        "safety": "Tourist areas are safe. Resort infrastructure. Comfortable with awareness.",
        "food": "Mexican cuisine with fresh seafood. Resort dining and authentic options. Quality.",
        "community": "Resort and retirement community. Some digital nomads. Established.",
        "english": "Good in tourism industry. Spanish helps locally. Communication easy.",
        "visa": "180 days visa-free for most. Mexico is accessible. FMM permit.",
        "culture": "Baja desert culture meets resort luxury. The landscape is dramatic. Beach lifestyle.",
        "cleanliness": "Resort areas well-maintained. Tourism standards. Good.",
        "airquality": "Excellent air quality with desert and sea. Clean and fresh. Pristine."
    },
    "luangprabang": {
        "climate": "Luang Prabang has a tropical monsoon climate with warm temperatures (17-35°C). Dry season November to April. Pleasant highland location.",
        "cost": "Very affordable with apartments from $200-450/month. Laos offers excellent value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Tourist cafes better. Developing.",
        "nightlife": "Very limited by culture and regulations. Night market and riverside. Quiet.",
        "nature": "Mekong and Nam Khan rivers meet. Kuang Si Falls nearby. Nature is beautiful.",
        "safety": "Very safe with Lao hospitality. Peaceful atmosphere. Very comfortable.",
        "food": "Lao cuisine with French colonial influences. Morning market is famous. Fresh.",
        "community": "Small expat and tourist community. Monks dominate morning. Intimate.",
        "english": "Limited with Lao or French helpful. Tourism has basic English. Learning helps.",
        "visa": "Visa on arrival available. 30 days. Laos is accessible.",
        "culture": "UNESCO World Heritage town. Temples and French colonial blend. Magical atmosphere.",
        "cleanliness": "Historic center well-maintained. UNESCO protection. Beautiful.",
        "airquality": "Good air quality with river breezes. Some burning season effects. Usually fresh."
    },
    "lucerne": {
        "climate": "Lucerne has a temperate climate with warm summers (18-25°C) and cold winters (-1 to 5°C). Lake and mountains affect weather. Four seasons.",
        "cost": "Very expensive as Swiss city. Apartments from CHF 1800-3000/month ($2000-3300). Swiss costs.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Impeccable connectivity.",
        "nightlife": "Charming scene in old town. Bars and restaurants. Sophisticated rather than wild.",
        "nature": "Lake Lucerne and Mount Pilatus. Alps surround. Nature is spectacular.",
        "safety": "Extremely safe with Swiss standards. Low crime. Very comfortable.",
        "food": "Swiss cuisine with international quality. Lake fish specialties. High standard.",
        "community": "Tourism and local community. International visitors. Swiss hospitality.",
        "english": "Good alongside German. Tourism ensures communication. Swiss languages help.",
        "visa": "Swiss rules apply. Various permit categories. Complex but accessible.",
        "culture": "Medieval bridge and Alpine setting. The scenery defines the town. Postcard Switzerland.",
        "cleanliness": "Immaculately clean with Swiss standards. Lake and mountains pristine. Excellent.",
        "airquality": "Excellent air quality with lake and Alps. Fresh mountain air. Pristine."
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

#!/usr/bin/env python3
"""Batch 33: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "nicosia": {
        "climate": "Nicosia has a semi-arid climate with hot summers (35-40°C) and mild winters (10-17°C). Inland Cyprus heat. Last divided capital.",
        "cost": "Moderate with apartments from €500-900/month. Cyprus value but growing.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. EU standards. Reliable.",
        "nightlife": "Growing scene with bars in old city. Both sides have options. Developing.",
        "nature": "Inland with Troodos Mountains accessible. Day trips to coast. Surrounded by hills.",
        "safety": "Very safe with low crime. Buffer zone is peaceful. Comfortable.",
        "food": "Cypriot mezze and both Greek/Turkish influences. Quality restaurants.",
        "community": "Business and diplomatic community. UN presence. International.",
        "english": "Excellent English proficiency. Communication easy.",
        "visa": "EU rules apply. Crossing to north has different rules. Various options.",
        "culture": "Divided city with rich history. Both sides accessible. Unique geopolitical experience.",
        "cleanliness": "City center maintained. Development continues. Good.",
        "airquality": "Can be hot and dusty in summer. Mountains provide relief. Variable."
    },
    "nimbin": {
        "climate": "Nimbin has a subtropical climate with warm summers (24-30°C) and mild winters (10-20°C). Northern NSW rainforest border.",
        "cost": "Affordable for Australia. Rooms/apartments from AUD 800-1400/month. Alternative village pricing.",
        "wifi": "Basic infrastructure with speeds of 10-40 Mbps. Rural Australia challenges. Improving.",
        "nightlife": "Very alternative scene. Small bars and community events. Hippie atmosphere.",
        "nature": "Rainforest and surrounding hills. Alternative community in nature. Beautiful.",
        "safety": "Safe community. Alternative but welcoming. Comfortable.",
        "food": "Vegetarian and organic focus. Markets and cafes. Health conscious.",
        "community": "Famous alternative community. Hippie heritage. Strong sense of belonging.",
        "english": "Native Australian English. Alternative vocabulary. Friendly.",
        "visa": "Australian visa rules apply. Working holiday visas. Standard access.",
        "culture": "Australia's counter-culture capital. Mardi Grass festival. Free-spirited identity.",
        "cleanliness": "Village maintained. Alternative standards. Character.",
        "airquality": "Excellent air quality with rainforest surroundings. Fresh mountain air. Pristine."
    },
    "niteroi": {
        "climate": "Niterói has a tropical climate with warm temperatures (22-32°C). Rio's across-the-bay neighbor. Oceanic breezes help.",
        "cost": "Moderate for Brazil. Apartments from R$2000-4000/month ($400-800). Quieter than Rio.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Brazilian standards. Reliable.",
        "nightlife": "Growing scene with bars and restaurants. More relaxed than Rio. Quality options.",
        "nature": "Beautiful beaches and Oscar Niemeyer architecture. Rio views. Nature accessible.",
        "safety": "Safer than Rio overall. Beach areas comfortable. Standard awareness.",
        "food": "Brazilian cuisine with seafood focus. Quality restaurants. Good value.",
        "community": "Rio alternative community. Growing professional presence. Developing.",
        "english": "Limited with Portuguese essential. Learning Portuguese important.",
        "visa": "90 days visa-free for most. Brazil digital nomad visa. Accessible.",
        "culture": "Oscar Niemeyer's MAC is iconic. Rio views without Rio prices. Distinct character.",
        "cleanliness": "Better maintained than some Rio areas. Beach cleaning. Good standards.",
        "airquality": "Good air quality with ocean breezes. Better than inland. Fresh."
    },
    "oahu": {
        "climate": "Oahu has a tropical climate with warm temperatures year-round (24-30°C). Trade winds moderate heat. Microclimates exist.",
        "cost": "Very expensive. Apartments from $2000-3500/month. Hawaii premium significant.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Hawaiian standards. Reliable.",
        "nightlife": "Waikiki has active scene. Bars and clubs. Tourist-focused options.",
        "nature": "North Shore surf and Diamond Head. Beaches and hiking. Nature spectacular.",
        "safety": "Very safe with low crime. Hawaiian aloha. Very comfortable.",
        "food": "Hawaiian and Pacific Rim fusion. Plate lunch culture. Quality ranges.",
        "community": "Local and military community. Tourism dominates. Island dynamics.",
        "english": "Native American English with pidgin influence. No barriers.",
        "visa": "US visa rules apply. Hawaii is a US state.",
        "culture": "Hawaiian heritage with surf culture. Pearl Harbor history. Paradise meets reality.",
        "cleanliness": "Beach areas maintained. Waikiki is clean. Good standards.",
        "airquality": "Excellent air quality with trade winds. Ocean freshness. Pristine."
    },
    "odessa": {
        "climate": "Odessa has a humid subtropical climate with hot summers (25-30°C) and mild winters (-2 to 5°C). Black Sea moderates weather.",
        "cost": "Very affordable with apartments from $250-500/month. Ukraine offers value. Situation-dependent.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Ukraine has fast internet. Reliable.",
        "nightlife": "Famous beach club scene. Bars and restaurants. Very active when conditions allow.",
        "nature": "Black Sea beaches and surrounding steppe. Coastal beauty.",
        "safety": "Variable - check current situation carefully. Research before visiting.",
        "food": "Ukrainian and Black Sea cuisine. Fresh seafood. Quality and affordable.",
        "community": "Historic international character. Cultural diversity. Resilient.",
        "english": "Good among younger Ukrainians. Russian/Ukrainian local. Communication possible.",
        "visa": "90 days visa-free for most. Check current advisories.",
        "culture": "Pearl of the Black Sea with rich history. Literature and music heritage. Distinct character.",
        "cleanliness": "Central areas maintained. Historic buildings preserved. Good.",
        "airquality": "Good with sea breezes. Coastal freshness. Clean."
    },
    "oldtown": {
        "climate": "San Juan (Old San Juan) has a tropical climate with warm temperatures year-round (25-31°C). Trade winds help. Hurricane season exists.",
        "cost": "Moderate for Caribbean. Apartments from $1200-2200/month. US territory pricing.",
        "wifi": "Good US infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Charming scene with bars in colonial buildings. Puerto Rican energy. Active.",
        "nature": "Beautiful colonial fort and beaches. El Yunque rainforest accessible. Nature varied.",
        "safety": "Tourist areas safe. Old San Juan is comfortable. Standard awareness.",
        "food": "Puerto Rican cuisine with mofongo and seafood. Caribbean flavors. Excellent.",
        "community": "Local and expat community. Tax incentives attract. Growing.",
        "english": "Excellent alongside Spanish. US territory. Communication easy.",
        "visa": "US territory - no visa needed for Americans. Standard US rules for others.",
        "culture": "Spanish colonial heritage in Caribbean. Colorful buildings and history. Unique blend.",
        "cleanliness": "Historic center well-maintained. Tourism standards. Beautiful.",
        "airquality": "Good with ocean breezes. Caribbean freshness. Clean."
    },
    "olomouc": {
        "climate": "Olomouc has a humid continental climate with warm summers (18-25°C) and cold winters (-4 to 2°C). Moravian weather. Four seasons.",
        "cost": "Very affordable with apartments from €300-500/month. Czech Republic value. Excellent budget option.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Czech connectivity. Reliable.",
        "nightlife": "Student scene with bars around squares. Atmospheric. Active during term.",
        "nature": "Moravian countryside surrounding. Day trips to mountains. Nature accessible.",
        "safety": "Very safe with low crime. Czech hospitality. Comfortable.",
        "food": "Czech cuisine with Moravian specialties. Beer culture. Affordable quality.",
        "community": "University community. Less touristy than Prague. Authentic experience.",
        "english": "Good among students. Less English than Prague. Communication possible.",
        "visa": "Schengen rules apply. Czech Republic is EU. Standard access.",
        "culture": "UNESCO column and baroque architecture. Hidden Czech gem. Rich heritage.",
        "cleanliness": "Historic center beautifully maintained. Pride in heritage. Excellent.",
        "airquality": "Good air quality with countryside surroundings. Fresh Moravian air. Clean."
    },
    "osaka": {
        "climate": "Osaka has a humid subtropical climate with hot summers (28-35°C) and mild winters (3-10°C). Four seasons with monsoon influence.",
        "cost": "Moderate for Japan. Apartments from ¥70,000-140,000/month ($460-930). More affordable than Tokyo.",
        "wifi": "Excellent Japanese infrastructure with speeds of 100+ Mbps. Impeccable.",
        "nightlife": "Famous scene in Dotonbori and Namba. Japanese izakaya excellence. Very active.",
        "nature": "Nara deer park and castles nearby. Kyoto accessible. Nature available.",
        "safety": "Extremely safe with Japanese standards. Very comfortable.",
        "food": "Kitchen of Japan with takoyaki and okonomiyaki. The food scene is legendary. Outstanding.",
        "community": "Business and expat community. More relaxed than Tokyo. Welcoming.",
        "english": "Limited with Japanese helpful. Tourism areas function. Learning Japanese benefits.",
        "visa": "Standard Japanese visa rules. 90 days visa-free for many.",
        "culture": "Merchant city character distinct from Tokyo. Castle and comedy culture. Kansai pride.",
        "cleanliness": "Immaculately clean with Japanese standards. Pristine.",
        "airquality": "Good air quality with urban management. Japanese standards. Clean."
    },
    "oslo": {
        "climate": "Oslo has a humid continental climate with warm summers (18-23°C) and cold winters (-5 to 1°C). Fjord moderates weather. Four seasons.",
        "cost": "Very expensive as Norwegian capital. Apartments from NOK 12000-20000/month ($1100-1850). Among world's costliest.",
        "wifi": "Excellent Norwegian infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Sophisticated scene with bars and clubs. Expensive but quality. Active.",
        "nature": "Fjord and surrounding forests. Skiing accessible. Nature spectacular.",
        "safety": "Extremely safe with Scandinavian standards. Very comfortable.",
        "food": "Nordic cuisine with seafood focus. Expensive but quality. International options.",
        "community": "International business and creative community. Diverse. Established.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Norwegian requirements. Standard access.",
        "culture": "Viking heritage meets modern design. Opera house is stunning. Progressive.",
        "cleanliness": "Immaculately clean with Norwegian standards. Pristine.",
        "airquality": "Excellent air quality with fjord and forests. Fresh Scandinavian air. Pristine."
    },
    "ouarzazate": {
        "climate": "Ouarzazate has a hot semi-arid climate with scorching summers (35-45°C) and cool winters (5-18°C). Gateway to Sahara. Desert conditions.",
        "cost": "Very affordable with apartments from $200-400/month. Morocco offers value. Desert town pricing.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Developing. Mobile data helps.",
        "nightlife": "Very limited. Hotel bars and local cafes. Desert quiet.",
        "nature": "Atlas Mountains and Sahara Desert. Dramatic landscapes. Nature is spectacular.",
        "safety": "Safe tourist destination. Moroccan hospitality. Comfortable.",
        "food": "Moroccan cuisine with tagines. Simple but authentic. Affordable.",
        "community": "Small tourism community. Film industry presence. Seasonal.",
        "english": "Limited with French or Arabic helpful. Tourism has basic English.",
        "visa": "90 days visa-free for most. Morocco accessible.",
        "culture": "Hollywood of Morocco with film studios. Kasbah heritage. Desert gateway character.",
        "cleanliness": "Tourism areas maintained. Desert dust constant. Variable.",
        "airquality": "Can be dusty with desert winds. Dry and clear otherwise. Variable."
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

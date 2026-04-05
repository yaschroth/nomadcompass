#!/usr/bin/env python3
"""
Update category descriptions for batch 17 (FINAL) cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH17_DESCRIPTIONS = {
    "yazd": {
        "climate": "Persian desert—extremely hot summers (40°C+), cold winters. Dry year-round. Best visited spring or fall. Extreme.",
        "cost": "Very affordable at $800/month. Iran's economy makes travel cheap. Extraordinary value.",
        "wifi": "Iranian internet—heavily filtered, VPN essential. Speeds 10-30 Mbps. Government restrictions. Plan accordingly.",
        "nightlife": "None publicly—Islamic Republic prohibition. Private gatherings exist. Come for culture, not nightlife.",
        "nature": "Desert oasis, badgirs (wind catchers), and surrounding desert. Zoroastrian towers of silence. Stark beauty.",
        "safety": "Very safe Iranian city. Exceptionally hospitable people. Walking comfortable. Political situation separate from personal safety.",
        "food": "Persian cuisine—tahdig rice, kebabs, and sweet shops. Iranian hospitality means generous portions. Tea culture.",
        "community": "Virtually none. Intrepid travelers only. Farsi essential. Cultural immersion deep. Pioneer territory.",
        "english": "Very limited. Farsi essential. Some tourism English at hotels. Language learning necessary.",
        "visa": "Iranian visa complex for some nationalities. Americans require guide. Check current regulations carefully.",
        "culture": "Zoroastrian heritage, desert architecture, and ancient water systems (qanat). Fire temples. UNESCO recognition. Extraordinary.",
        "cleanliness": "Well-maintained historic city. Desert dust natural. Iranian pride in heritage. Pleasant.",
        "airquality": "Desert air—dry and dusty but clean. No industrial pollution. Harsh but healthy."
    },
    "yerevan": {
        "climate": "Armenian continental—hot summers (35°C), cold winters (-5°C). High altitude. Four distinct seasons. Pleasant spring and fall.",
        "cost": "Budget paradise at $1200/month. Armenia offers extraordinary value. One of Europe's cheapest.",
        "wifi": "Armenian infrastructure—50-100 Mbps common. Tech diaspora drives improvement. Reliable for remote work.",
        "nightlife": "Republic Square energy, wine bars, and growing club scene. Armenian hospitality generous. Genuine fun.",
        "nature": "Mount Ararat views (in Turkey), Lake Sevan, and monastery day trips. Mountain beauty accessible.",
        "safety": "Safe Armenian capital. Friendly atmosphere. Walking comfortable. Geopolitical situation separate from personal safety.",
        "food": "Armenian cuisine—dolma, khorovats BBQ, and lavash bread. Generous portions. Food is celebration. Brandy tradition.",
        "community": "Growing digital nomad presence. Tech and startup scene. Russian and Armenian help. Diaspora connections.",
        "english": "Improving among youth. Russian more common. Tourist areas manageable. Armenian appreciated.",
        "visa": "180 days visa-free for most. Armenia very welcoming. Extension easy. Remote work friendly.",
        "culture": "World's oldest Christian nation, Matenadaran manuscripts, and Genocide memorial. Resilient heritage. Profound history.",
        "cleanliness": "Well-maintained modern areas. Some rougher edges. Armenian pride improving. Generally pleasant.",
        "airquality": "Good—limited industry, mountain location. Clean Armenian air."
    },
    "yogyakarta": {
        "climate": "Tropical Javanese—hot and humid year-round (25-33°C). Rainy season November-April. Indonesian consistency.",
        "cost": "Budget paradise at $900/month. Java's cultural capital extremely affordable. Extraordinary value.",
        "wifi": "Indonesian infrastructure—30-60 Mbps typical. Cafés and coworking improving. Mobile data backup helpful.",
        "nightlife": "Prawirotaman backpacker street, some bars, and traditional performances. Not a party destination. Cultural focus.",
        "nature": "Borobudur and Prambanan temples, Mount Merapi volcano, and surrounding countryside. Extraordinary heritage.",
        "safety": "Very safe Javanese city. Friendly, welcoming atmosphere. Walking comfortable. Indonesian hospitality genuine.",
        "food": "Javanese cuisine—gudeg (jackfruit), sate, and sweet flavors. Different from Bali. Traditional markets. Cheap and delicious.",
        "community": "Small backpacker and arts community. Language students. Few nomads. Bahasa Indonesia helpful.",
        "english": "Limited—Javanese and Indonesian dominate. Tourist services have basics. Language learning beneficial.",
        "visa": "Visa on arrival 30 days, extendable. Indonesia's social visa for longer stays. Second home visa available.",
        "culture": "Borobudur (world's largest Buddhist temple), Prambanan Hindu temples, and Javanese court traditions. UNESCO abundance.",
        "cleanliness": "Varies—tourist areas maintained. Authentic Javanese character. Indonesian standards. Pleasant overall.",
        "airquality": "Can be affected by volcano and regional fires. Generally acceptable. Monitor during events."
    },
    "york": {
        "climate": "Northern English—cool and damp year-round. Cold winters but milder than inland. Rain frequent. Pack layers.",
        "cost": "Moderate UK at £2400/month. Cheaper than London. Historic tourism economy.",
        "wifi": "British infrastructure—fiber available. Reliable connectivity. No concerns.",
        "nightlife": "Historic pubs—Shambles area, ghost tours, and traditional English atmosphere. Not clubbing destination. Pub culture.",
        "nature": "Yorkshire Moors accessible, River Ouse walks, and surrounding countryside. English nature beautiful.",
        "safety": "Very safe English city. Walk anywhere at any hour. Historic tourism means welcoming atmosphere.",
        "food": "Yorkshire pudding, pub classics, and afternoon tea tradition. Betty's tearoom famous. English comfort food.",
        "community": "Small—tourists and students. Few nomads. English-speaking obviously. Easy integration.",
        "english": "Native English—Yorkshire accent distinctive but charming. No language barrier.",
        "visa": "UK visa post-Brexit complexity. Tourist visits straightforward. Working requires skilled worker route.",
        "culture": "York Minster cathedral, Roman walls, and Viking heritage (Jorvik). Medieval streets. English history concentrated.",
        "cleanliness": "Well-maintained historic city. Pride in heritage. Tourist economy drives standards. Excellent.",
        "airquality": "Good—small city, limited industry. English standards. Healthy environment."
    },
    "zurich": {
        "climate": "Swiss alpine-influenced—cold winters with snow, warm summers. Föhn wind brings warmth. Four distinct seasons. Lake moderation.",
        "cost": "World's most expensive at CHF 5000/month ($5500). Switzerland is extreme. Quality matches price.",
        "wifi": "Swiss excellence—fiber standard, among world's best. No connectivity concerns whatsoever.",
        "nightlife": "Sophisticated—Langstrasse nightlife, lake bars, and club scene. Not cheap but genuine. Swiss quality.",
        "nature": "Lake Zurich, Alps accessible, and surrounding countryside. Outstanding natural beauty. Outdoor culture strong.",
        "safety": "Extremely safe Swiss city. Walk anywhere anytime. Swiss order exemplary. Minimal concerns.",
        "food": "Swiss classics—fondue, raclette, and chocolate. International quality. Everything expensive but excellent.",
        "community": "International banking and business community. Expat professionals. English-speaking environment exists.",
        "english": "Excellent—Swiss speak multiple languages. Business environment international. German helpful but English works.",
        "visa": "90-day Schengen standard (Switzerland participates). Swiss work permits very difficult. Highly restrictive.",
        "culture": "Banking heritage, ETH university, and Swiss precision. Dada movement originated here. Clean aesthetic.",
        "cleanliness": "Swiss legendary cleanliness. Everything immaculate. Public spaces pristine. World's highest standards.",
        "airquality": "Excellent—Alpine proximity, lake breezes, environmental consciousness. Among world's cleanest cities."
    }
}

def update_city_descriptions(city_id, descriptions):
    filepath = os.path.join(CITIES_DIR, f"{city_id}.html")
    if not os.path.exists(filepath):
        print(f"  File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'const CATEGORY_DESCRIPTIONS = \{[^}]+\};'
    new_descriptions_json = json.dumps(descriptions, ensure_ascii=False)
    new_line = f'const CATEGORY_DESCRIPTIONS = {new_descriptions_json};'
    new_content, count = re.subn(pattern, new_line, content)

    if count == 0:
        print(f"  Pattern not found in {city_id}.html")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  Updated {city_id}.html")
    return True

def main():
    print("Updating category descriptions for batch 17 (FINAL - 5 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH17_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH17_DESCRIPTIONS)} cities")
    print("\n🎉 ALL CITY DESCRIPTIONS COMPLETED!")

if __name__ == "__main__":
    main()

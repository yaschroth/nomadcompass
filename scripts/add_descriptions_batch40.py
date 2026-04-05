#!/usr/bin/env python3
"""Batch 40: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "suva": {
        "climate": "Suva has a tropical oceanic climate with warm temperatures year-round (23-30°C). Wet side of Viti Levu. Rainy season November to April.",
        "cost": "Moderate for South Pacific. Apartments from FJD 1500-3000/month ($700-1400). Island import costs.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Pacific island challenges. Developing.",
        "nightlife": "Limited but active for Pacific capital. Local bars and clubs. Island atmosphere.",
        "nature": "Tropical surroundings and reef access. Gateway to outer islands. Nature beautiful.",
        "safety": "Generally safe with standard awareness. Fiji hospitality. Comfortable.",
        "food": "Fijian and Indian cuisine blend. Fresh seafood. Interesting fusion.",
        "community": "Government and regional organization community. Pacific hub. International.",
        "english": "Official language alongside Fijian. Communication easy.",
        "visa": "4 months visa-free for most. Fiji accessible.",
        "culture": "Pacific hub with Indo-Fijian heritage. Multicultural island capital. Friendly character.",
        "cleanliness": "Central areas maintained. Development varies. Good for region.",
        "airquality": "Good with ocean breezes. Pacific freshness. Clean."
    },
    "sydney": {
        "climate": "Sydney has a humid subtropical climate with warm summers (22-28°C) and mild winters (10-17°C). Harbor city weather. Beach lifestyle year-round.",
        "cost": "Expensive. Apartments from AUD 2200-3800/month. Among world's costliest housing.",
        "wifi": "Excellent infrastructure with NBN. Speeds of 50-100+ Mbps. Reliable.",
        "nightlife": "World-class scene from The Rocks to Kings Cross. Beaches to bars. Very active.",
        "nature": "Stunning harbor and beaches. Blue Mountains nearby. Nature integrated into city.",
        "safety": "Very safe with low crime. Australian friendliness. Comfortable.",
        "food": "Multicultural excellence. Asian influences strong. Outstanding variety.",
        "community": "Large international community. Tech and creative. Established.",
        "english": "Native Australian English. No barriers.",
        "visa": "Australian visa rules. Working holiday visas popular. Competitive immigration.",
        "culture": "Opera House and harbor define identity. Multicultural and outdoors-focused. World city.",
        "cleanliness": "Very clean with Australian standards. Beaches pristine. Excellent.",
        "airquality": "Good generally. Bushfire smoke can be severe seasonally. Usually fresh."
    },
    "taghazout": {
        "climate": "Taghazout has a Mediterranean climate with warm temperatures (18-28°C). Morocco's surf coast. Pleasant year-round.",
        "cost": "Affordable with apartments from $300-600/month. Morocco offers value. Surf premium.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Surf town growing. Developing.",
        "nightlife": "Limited by culture. Beach cafes and restaurants. Quiet evenings.",
        "nature": "Beautiful beaches and Atlas day trips. Surfing is world-class. Nature is the draw.",
        "safety": "Safe surf town. Moroccan hospitality. Comfortable.",
        "food": "Moroccan cuisine with fresh seafood. Tagines and surf fuel. Good value.",
        "community": "Strong surf and yoga community. Digital nomads discovering. Growing.",
        "english": "Growing with surf tourism. French common. Communication possible.",
        "visa": "90 days visa-free for most. Morocco accessible.",
        "culture": "Berber fishing village turned surf destination. The vibe is laid-back. Surf culture.",
        "cleanliness": "Beach and town improving. Tourism drives standards. Good.",
        "airquality": "Excellent with Atlantic breezes. Fresh coastal air."
    },
    "tallinn": {
        "climate": "Tallinn has a humid continental climate with warm summers (17-22°C) and cold winters (-5 to 0°C). Baltic sea influence. Four seasons.",
        "cost": "Moderate for Europe. Apartments from €600-1000/month. Growing but value remains.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. Estonia leads in digital. Impeccable.",
        "nightlife": "Vibrant scene in old town and Telliskivi. Creative and active. Very alive.",
        "nature": "Baltic coast and surrounding forests. Nature is accessible.",
        "safety": "Very safe with low crime. Estonian efficiency. Comfortable.",
        "food": "Nordic and modern Estonian cuisine. Growing food scene. Quality.",
        "community": "Large digital nomad and startup community. E-residency attracts. Established.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Estonia has digital nomad visa. E-residency popular.",
        "culture": "Medieval old town meets digital innovation. Most digital society. Unique character.",
        "cleanliness": "Very clean with Northern European standards. Excellent.",
        "airquality": "Excellent air quality with Baltic freshness. Clean."
    },
    "tangier": {
        "climate": "Tangier has a Mediterranean climate with warm summers (25-30°C) and mild winters (12-18°C). Strait of Gibraltar weather. Pleasant year-round.",
        "cost": "Affordable with apartments from $350-700/month. Morocco offers value. Growing.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Morocco invested. Reliable.",
        "nightlife": "Growing scene with Kasbah and new marina. International influence. Developing.",
        "nature": "Strait of Gibraltar and surrounding coast. Rif Mountains nearby. Nature interesting.",
        "safety": "Safe for Morocco. Tourist areas comfortable. Standard awareness.",
        "food": "Moroccan and Spanish influences blend. Fresh seafood. Quality available.",
        "community": "Growing international community. Arts and creative. Developing.",
        "english": "Good with French and Spanish also common. Communication possible.",
        "visa": "90 days visa-free for most. Morocco accessible.",
        "culture": "Gateway between continents. Interzone history. Beat generation legacy. Cosmopolitan character.",
        "cleanliness": "Improving with development. Central areas maintained. Good.",
        "airquality": "Excellent with Strait breezes. Fresh Mediterranean air."
    },
    "tarifa": {
        "climate": "Tarifa has a Mediterranean climate with wind. Temperatures (16-28°C) but wind is constant. Southernmost mainland Spain.",
        "cost": "Moderate for Spain. Apartments from €500-900/month. Surf town pricing.",
        "wifi": "Good Spanish infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Beach bar scene and old town bars. Windsport community. Relaxed but active.",
        "nature": "Strait of Gibraltar and beaches. Morocco visible. Wind and wildlife.",
        "safety": "Very safe with low crime. Spanish hospitality. Comfortable.",
        "food": "Andalusian and seafood. Tuna is famous. Quality local food.",
        "community": "Windsurf and kitesurf community. Strong seasonal character. International.",
        "english": "Good with international sports community. Spanish helps.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Wind capital of Europe. Where two seas meet. Windsurf identity.",
        "cleanliness": "Beach and town maintained. Sporty town standards. Good.",
        "airquality": "Excellent with constant wind. Freshest air in Europe possibly. Pristine."
    },
    "tasmania": {
        "climate": "Tasmania has a temperate oceanic climate with cool summers (17-22°C) and cold winters (5-12°C). Australia's coolest state. Four seasons.",
        "cost": "Moderate for Australia. Apartments from AUD 1400-2200/month. More affordable than mainland.",
        "wifi": "Good infrastructure with NBN. Speeds of 40-80 Mbps. Improving.",
        "nightlife": "Limited but Hobart has growing scene. MONA transformed culture. Intimate.",
        "nature": "Wilderness World Heritage areas. Some of cleanest air on earth. Nature spectacular.",
        "safety": "Very safe with low crime. Tasmanian hospitality. Comfortable.",
        "food": "Exceptional food scene. Cool climate produce and seafood. Outstanding quality.",
        "community": "Creative and food community. MONA brings artists. Growing.",
        "english": "Native Australian English. Island character. Friendly.",
        "visa": "Australian visa rules. Working holiday visas. Standard access.",
        "culture": "Wild nature meets MONA art revolution. Island identity distinct. Creative awakening.",
        "cleanliness": "Very clean with pristine surroundings. Excellent.",
        "airquality": "Some of cleanest air on earth. Antarctic winds. Pristine."
    },
    "tetouan": {
        "climate": "Tétouan has a Mediterranean climate with warm summers (25-30°C) and mild winters (10-17°C). Northern Morocco. Pleasant.",
        "cost": "Very affordable with apartments from $200-450/month. Morocco offers value. Less touristy.",
        "wifi": "Decent infrastructure with speeds of 15-40 Mbps. Developing.",
        "nightlife": "Very limited by culture. Cafes and local life. Traditional.",
        "nature": "Rif Mountains and beaches nearby. Chefchaouen day trip. Nature accessible.",
        "safety": "Safe with Moroccan hospitality. Less tourist infrastructure. Comfortable.",
        "food": "Moroccan cuisine with Spanish influences. Fresh and authentic.",
        "community": "Small international presence. Authentic Moroccan experience. Intimate.",
        "english": "Limited with French and Spanish more common. Learning helpful.",
        "visa": "90 days visa-free for most. Morocco accessible.",
        "culture": "UNESCO medina with Andalusian heritage. White dove city. Traditional character.",
        "cleanliness": "Medina maintained. Less tourist polish. Authentic.",
        "airquality": "Good with mountain and sea air. Fresh."
    },
    "thessaloniki": {
        "climate": "Thessaloniki has a Mediterranean climate with hot summers (28-34°C) and cool winters (5-12°C). Northern Greece. Four seasons.",
        "cost": "Affordable for Europe. Apartments from €350-650/month. Greek value. Growing.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Improving. Reliable.",
        "nightlife": "Famous scene along waterfront. Ladadika district. Very active and late.",
        "nature": "Beaches and mountains accessible. Day trips varied. Nature available.",
        "safety": "Safe with standard awareness. Greek hospitality. Comfortable.",
        "food": "Greek cuisine excellence. Best in Greece some say. Outstanding.",
        "community": "Growing digital nomad community. University and creative. Developing.",
        "english": "Good especially among youth. Communication possible.",
        "visa": "Schengen rules apply. Greece has digital nomad visa. Easy access.",
        "culture": "Byzantine heritage and Ottoman layers. Different from Athens. Northern Greek identity.",
        "cleanliness": "Waterfront maintained. City varies. Good tourist areas.",
        "airquality": "Generally good with sea breezes. Some traffic effects. Acceptable."
    },
    "tirana": {
        "climate": "Tirana has a Mediterranean climate with hot summers (28-35°C) and mild winters (5-12°C). Albanian capital. Pleasant springs and falls.",
        "cost": "Very affordable with apartments from €300-550/month. Albania offers excellent value.",
        "wifi": "Improving infrastructure with speeds of 30-70 Mbps. Albania investing. Developing.",
        "nightlife": "Growing scene in Blloku district. Bars and clubs. Active and developing.",
        "nature": "Mountains surround. Day trips to coast and peaks. Nature accessible.",
        "safety": "Safe with Albanian hospitality. Improving reputation. Comfortable.",
        "food": "Albanian and Mediterranean cuisine. Fresh and affordable.",
        "community": "Growing international interest. Digital nomads discovering. Developing.",
        "english": "Growing especially among youth. Communication improving.",
        "visa": "1 year visa-free for most. Albania very accessible.",
        "culture": "Post-communist transformation. Colorful buildings and energy. Rapidly changing.",
        "cleanliness": "Central areas improving. Development ongoing. Variable.",
        "airquality": "Can be affected by traffic. Mountain air nearby is clean. Variable."
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

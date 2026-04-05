#!/usr/bin/env python3
"""Batch 32: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "monteverde": {
        "climate": "Monteverde has a tropical cloud forest climate with cool temperatures (13-24°C). Misty and damp year-round. Unique microclimate.",
        "cost": "Moderate for Costa Rica. Apartments from $500-900/month. Eco-tourism pricing.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Cloud forest limitations. Variable.",
        "nightlife": "Very limited. Small bars in town. Nature focused destination.",
        "nature": "World-famous cloud forest reserve. Hanging bridges and wildlife. Nature is exceptional.",
        "safety": "Very safe with Costa Rican hospitality. Remote and peaceful. Comfortable.",
        "food": "Costa Rican cuisine with organic focus. Eco-lodge dining. Limited but quality.",
        "community": "Conservation and eco-tourism community. Researchers and nature lovers. Intimate.",
        "english": "Good in tourism. Spanish helps locally. Communication possible.",
        "visa": "90 days visa-free for most. Costa Rica accessible. Extensions possible.",
        "culture": "Quaker heritage meets conservation. The forest defines everything. Environmental focus.",
        "cleanliness": "Eco-conscious standards. Nature preservation focus. Good.",
        "airquality": "Pristine cloud forest air. Among cleanest. Refreshing."
    },
    "montpellier": {
        "climate": "Montpellier has a Mediterranean climate with hot summers (28-33°C) and mild winters (6-13°C). Southern France sunshine. Pleasant year-round.",
        "cost": "Moderate for France. Apartments from €500-900/month. More affordable than Nice.",
        "wifi": "Good French infrastructure with speeds of 50-100 Mbps. University city connectivity. Reliable.",
        "nightlife": "Vibrant student scene. Place de la Comédie and bars. Very active.",
        "nature": "Mediterranean beaches and Cévennes mountains nearby. Nature accessible.",
        "safety": "Safe with standard urban awareness. French hospitality. Comfortable.",
        "food": "Mediterranean cuisine with local wine. Quality restaurants. Fresh seafood.",
        "community": "Large university and international community. Young and dynamic. Active.",
        "english": "Moderate with French helpful. University improves English. Communication possible.",
        "visa": "Schengen rules apply. French options. Standard access.",
        "culture": "Medieval old town meets youthful energy. Oldest medical school. Progressive south.",
        "cleanliness": "City center maintained. French standards. Good.",
        "airquality": "Good air quality with Mediterranean climate. Sea breezes help. Clean."
    },
    "mostar": {
        "climate": "Mostar has a Mediterranean climate with hot summers (28-38°C) and mild winters (3-10°C). Herzegovina heat in summer. Pleasant spring and fall.",
        "cost": "Very affordable with apartments from €250-500/month. Bosnia offers excellent value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. Reliable.",
        "nightlife": "Old Bridge area has bars and cafes. Atmospheric evenings. Relaxed.",
        "nature": "Neretva River and surrounding mountains. Kravice waterfalls nearby. Nature beautiful.",
        "safety": "Safe tourist destination. Bosnian hospitality. Comfortable.",
        "food": "Bosnian cuisine with ćevapi and burek. Fresh and affordable. Excellent.",
        "community": "Small tourist and local community. Growing interest. Authentic.",
        "english": "Good in tourism. Bosnian locally. Communication possible.",
        "visa": "90 days visa-free for most. Bosnia accessible.",
        "culture": "Famous bridge rebuilt after war. Ottoman and Balkan heritage. Symbol of reconciliation.",
        "cleanliness": "Old town maintained. Tourism helps standards. Good.",
        "airquality": "Good air quality with river and mountains. Fresh. Clean."
    },
    "nagoya": {
        "climate": "Nagoya has a humid subtropical climate with hot summers (28-35°C) and cold winters (2-9°C). Central Japan weather. Four seasons.",
        "cost": "Moderate for Japan. Apartments from ¥70,000-130,000/month ($460-860). More affordable than Tokyo.",
        "wifi": "Excellent Japanese infrastructure with speeds of 100+ Mbps. Impeccable connectivity.",
        "nightlife": "Sakae entertainment district. Japanese izakaya culture. Active scene.",
        "nature": "Mountains and coast accessible. Day trips to Alps. Nature available.",
        "safety": "Extremely safe with Japanese standards. Low crime. Very comfortable.",
        "food": "Famous for miso katsu and hitsumabushi eel. Local specialties outstanding. Quality.",
        "community": "Industrial and expat community. Toyota headquarters. Established.",
        "english": "Limited with Japanese helpful. Less tourist focused. Learning Japanese benefits.",
        "visa": "Standard Japanese visa rules. 90 days visa-free for many.",
        "culture": "Industrial powerhouse with samurai heritage. Nagoya Castle restored. Distinct character.",
        "cleanliness": "Immaculately clean with Japanese standards. Pride in appearance. Pristine.",
        "airquality": "Good air quality for industrial city. Japanese standards. Clean."
    },
    "nantes": {
        "climate": "Nantes has a temperate oceanic climate with mild temperatures (4-25°C). Atlantic influence. Rain is common.",
        "cost": "Moderate for France. Apartments from €550-950/month. More affordable than Paris.",
        "wifi": "Good French infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Vibrant scene with bars and clubs. Student energy. Active.",
        "nature": "Loire estuary and surrounding countryside. Coast accessible. Green city.",
        "safety": "Safe with standard awareness. French hospitality. Comfortable.",
        "food": "Atlantic seafood and Loire wines. Quality restaurants. Growing scene.",
        "community": "Creative and tech community. Young and dynamic. Welcoming.",
        "english": "Moderate with French helpful. Less tourist than Paris. French recommended.",
        "visa": "Schengen rules apply. French options. Standard access.",
        "culture": "Mechanical elephant and creative machines. Jules Verne birthplace. Inventive spirit.",
        "cleanliness": "Well-maintained green city. French standards. Good.",
        "airquality": "Good air quality with Atlantic breezes. Green policies help. Fresh."
    },
    "naples": {
        "climate": "Naples has a Mediterranean climate with hot summers (28-33°C) and mild winters (8-14°C). Vesuvius creates microclimates. Sunny most of year.",
        "cost": "Affordable for Italy. Apartments from €400-800/month. Southern Italy value.",
        "wifi": "Variable infrastructure with speeds of 20-50 Mbps. Italian south developing. Improving.",
        "nightlife": "Vibrant scene in centro storico. Neapolitan energy. Very active.",
        "nature": "Vesuvius and Amalfi Coast nearby. Islands accessible. Nature dramatic.",
        "safety": "Requires awareness. Tourist areas generally safe. Research neighborhoods. Standard Italian south.",
        "food": "Pizza birthplace and seafood excellence. The food is legendary. Outstanding.",
        "community": "Local and some international. Authentic Italian experience. Growing interest.",
        "english": "Limited with Italian essential. Tourism has some English. Italian helps.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Ancient Greek heritage and Baroque churches. Neapolitan soul is unique. Intense character.",
        "cleanliness": "Challenging in some areas. Centro can be rough. Variable standards.",
        "airquality": "Generally good with sea breezes. Vesuvius area fresh. Acceptable."
    },
    "nashville": {
        "climate": "Nashville has a humid subtropical climate with hot summers (28-35°C) and mild winters (2-10°C). Southern US weather. Four seasons.",
        "cost": "Moderate for US. Apartments from $1300-2100/month. Growing city prices.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Tech hub growing. Reliable.",
        "nightlife": "Famous honky-tonks and live music. Broadway is legendary. Very active.",
        "nature": "Surrounding Tennessee hills. Lakes and state parks. Nature accessible.",
        "safety": "Safe with standard urban awareness. Southern hospitality. Comfortable.",
        "food": "Hot chicken and BBQ famous. Growing food scene. Southern cuisine excellence.",
        "community": "Music and tech community. Healthcare industry. Established and growing.",
        "english": "Native American English with southern charm. No barriers.",
        "visa": "US visa rules apply. Various categories. Competitive.",
        "culture": "Music City with country and beyond. The energy is creative. Southern charm.",
        "cleanliness": "Downtown maintained. Growth continues. Good standards.",
        "airquality": "Good air quality with some humidity effects. Tennessee freshness. Clean."
    },
    "newcastle": {
        "climate": "Newcastle (UK) has a temperate oceanic climate with cool temperatures (3-19°C). Northern England weather. Rain is common.",
        "cost": "Affordable for UK. Apartments from £600-1000/month. Northern value.",
        "wifi": "Good UK infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Famous party scene. Bigg Market and Quayside. Very active.",
        "nature": "Nearby coast and countryside. Hadrian's Wall accessible. Nature available.",
        "safety": "Safe with standard night out awareness. Geordie friendliness. Comfortable.",
        "food": "Growing food scene. Traditional and international options. Quality improving.",
        "community": "University and local community. Proud Geordie identity. Welcoming.",
        "english": "Native English with Geordie accent. Friendly communication.",
        "visa": "UK visa rules apply. Various categories.",
        "culture": "Industrial heritage meets modern arts. Angel of the North nearby. Northern pride.",
        "cleanliness": "City center maintained. Development continues. Good.",
        "airquality": "Good air quality with coastal proximity. Fresh northern air."
    },
    "neworleans": {
        "climate": "New Orleans has a humid subtropical climate with hot summers (30-35°C) and mild winters (10-18°C). High humidity. Hurricane risk exists.",
        "cost": "Moderate for US. Apartments from $1200-1900/month. Varies by neighborhood.",
        "wifi": "Good US infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Legendary scene with live music everywhere. Bourbon Street and beyond. 24/7 energy.",
        "nature": "Mississippi River and bayous. Swamp tours available. Unique ecosystems.",
        "safety": "Requires awareness. French Quarter generally safe. Research neighborhoods.",
        "food": "Cajun and Creole cuisine legendary. Po'boys, gumbo, beignets. Outstanding.",
        "community": "Music, arts, and hospitality community. Deep cultural roots. Welcoming.",
        "english": "Native American English with southern/French influences. Unique dialect.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "Jazz birthplace with French and African heritage. Mardi Gras defines spirit. One of a kind.",
        "cleanliness": "French Quarter maintained. Some areas challenging. Variable.",
        "airquality": "Can be affected by humidity and industry. Variable quality."
    },
    "nice": {
        "climate": "Nice has a Mediterranean climate with hot summers (26-30°C) and mild winters (10-15°C). French Riviera sunshine. Pleasant year-round.",
        "cost": "Expensive as Riviera city. Apartments from €900-1500/month. High season premium.",
        "wifi": "Good French infrastructure with speeds of 50-100 Mbps. Tourism ensures connectivity. Reliable.",
        "nightlife": "Elegant scene with promenade bars and clubs. French Riviera sophistication. Active.",
        "nature": "Stunning coastline and surrounding hills. Monaco nearby. Nature beautiful.",
        "safety": "Safe with standard awareness. Tourist areas comfortable. Comfortable.",
        "food": "Niçoise cuisine with socca and salade niçoise. Mediterranean excellence. Quality.",
        "community": "International residents and tourists. Retirees and creatives. Established.",
        "english": "Good in tourism. French helps deeper connection. Communication possible.",
        "visa": "Schengen rules apply. French options. Standard access.",
        "culture": "Belle Époque architecture on the Riviera. Russian cathedral and old town. Elegant character.",
        "cleanliness": "Well-maintained tourist city. Promenade is beautiful. Good standards.",
        "airquality": "Good air quality with Mediterranean breezes. Riviera freshness. Clean."
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

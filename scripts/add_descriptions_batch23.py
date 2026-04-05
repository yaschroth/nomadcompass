#!/usr/bin/env python3
"""Batch 23: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "faro": {
        "climate": "Faro has a Mediterranean climate with hot summers (28-32°C) and mild winters (12-17°C). The Algarve is Portugal's sunniest region. Pleasant year-round.",
        "cost": "Affordable by Portuguese standards. Apartments from €500-900/month. Algarve tourism affects prices seasonally.",
        "wifi": "Good Portuguese infrastructure with speeds of 40-80 Mbps. Fiber available in center. Reliable.",
        "nightlife": "Relaxed scene in the old town. Student presence adds energy. More charming than party-focused.",
        "nature": "Ria Formosa lagoon system is stunning. Algarve beaches nearby. Nature is excellent.",
        "safety": "Very safe with low crime. Portuguese hospitality. Comfortable throughout.",
        "food": "Fresh seafood and Portuguese cuisine. Cataplana is regional specialty. Quality dining available.",
        "community": "Growing expat community. University brings diversity. Algarve attracts retirees and nomads.",
        "english": "Good English proficiency. Tourism and university help. Communication easy.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad visas. Popular for extended stays.",
        "culture": "Historic old town with Moorish influences. Gateway to Algarve. University town atmosphere.",
        "cleanliness": "Well-maintained historic center. Tourism drives standards. Pleasant.",
        "airquality": "Excellent air quality with Atlantic breezes. Coastal freshness. Clean and healthy."
    },
    "fethiye": {
        "climate": "Fethiye has a Mediterranean climate with hot summers (32-38°C) and mild winters (10-18°C). The Turkish Riviera is sunny. Swimming weather from May to October.",
        "cost": "Affordable with apartments from $300-600/month. Turkey offers excellent value. Tourism affects prices.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Improving.",
        "nightlife": "Harbor bars and restaurants. Ölüdeniz beach scene. Relaxed Turkish atmosphere.",
        "nature": "Stunning coastline with Ölüdeniz lagoon. Paragliding from Babadağ. Nature is spectacular.",
        "safety": "Safe tourist destination. Turkish hospitality. Comfortable for visitors.",
        "food": "Turkish cuisine with fresh seafood. Meze and kebabs. Excellent quality and value.",
        "community": "British expat community established. Growing international presence. Seasonal dynamics.",
        "english": "Good in tourism areas. Turkish helps for deeper connection. Communication possible.",
        "visa": "Turkish e-visa rules apply. Up to 90 days for most. Easy access.",
        "culture": "Ancient Lycian ruins and Turkish traditions. The boat trips show history. Coastal culture.",
        "cleanliness": "Tourist areas maintained. Harbor is pleasant. Good standards.",
        "airquality": "Excellent air quality with sea breezes. Coastal location ensures freshness. Clean Mediterranean air."
    },
    "florianopolis": {
        "climate": "Florianópolis has a humid subtropical climate with warm summers (25-32°C) and mild winters (12-20°C). The island location moderates temperatures. Beach weather much of year.",
        "cost": "Moderate for Brazil. Apartments from R$2000-4000/month ($400-800). Island premium applies.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Brazil has invested. Reliable in urban areas.",
        "nightlife": "Beach party scene at Jurerê. University energy downtown. The island has varied options.",
        "nature": "42 beaches on the island. Lagoa da Conceição is stunning. Nature is the main draw.",
        "safety": "Safer than other Brazilian cities. Beach areas comfortable. Standard awareness needed.",
        "food": "Fresh seafood with açaí culture. Oysters from nearby farms. Brazilian beach food.",
        "community": "Growing startup and nomad community. Quality of life attracts Brazilians. International interest.",
        "english": "Limited with Portuguese essential. Tech community uses English. Learning Portuguese important.",
        "visa": "90 days visa-free for most. Brazil has digital nomad visa. Accessible.",
        "culture": "Azorean heritage on Brazilian island. Surf and startup culture blend. Island lifestyle.",
        "cleanliness": "Beaches are maintained. Urban areas variable. Tourism helps standards.",
        "airquality": "Good air quality with ocean breezes. Island location helps. Fresh coastal air."
    },
    "frankfurt": {
        "climate": "Frankfurt has a temperate oceanic climate with warm summers (20-26°C) and cold winters (-1 to 5°C). The Rhine-Main area has continental influences. Rain is common.",
        "cost": "Expensive as financial hub. Apartments from €1000-1600/month. High demand drives prices.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Business hub connectivity. Reliable.",
        "nightlife": "Varied scene from Alt-Sachsenhausen cider bars to clubs. Financial workers and students. Active.",
        "nature": "Main River runs through. Taunus Mountains nearby. Parks provide urban green.",
        "safety": "Safe with standard urban awareness. Bahnhofsviertel requires more caution. Generally comfortable.",
        "food": "International cuisine due to banking sector. Apfelwein and local specialties. Quality options.",
        "community": "International finance and tech community. Expat networks established. Diverse.",
        "english": "Excellent English in business. International city. Communication easy.",
        "visa": "Schengen rules apply. German freelance visa options. Business visas common.",
        "culture": "Rebuilt after WWII destruction. Goethe's birthplace. Finance meets culture.",
        "cleanliness": "Well-maintained with German standards. Public transport is clean. Good.",
        "airquality": "Moderate with airport and traffic. Better than expected. Acceptable quality."
    },
    "freiburg": {
        "climate": "Freiburg has a temperate climate with warm summers (20-27°C) and mild winters (0-6°C). Germany's sunniest city. The Black Forest affects weather.",
        "cost": "Moderate for Germany. Apartments from €700-1100/month. University town prices.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. University ensures connectivity. Reliable.",
        "nightlife": "University scene with wine bars. The Altstadt has character. More relaxed than party.",
        "nature": "Gateway to Black Forest. Hiking and skiing accessible. Nature is spectacular.",
        "safety": "Very safe with low crime. University atmosphere. Comfortable throughout.",
        "food": "Baden cuisine with Black Forest specialties. Wine region influences. Quality local food.",
        "community": "University and environmental community. Green city attracts like-minded. Progressive.",
        "english": "Good English among younger Germans. University helps. Communication possible.",
        "visa": "Schengen rules apply. German freelance visa options. Standard access.",
        "culture": "Medieval old town with environmental leadership. Germany's green capital. Progressive atmosphere.",
        "cleanliness": "Very clean with German and green standards. Well-maintained. Excellent.",
        "airquality": "Excellent air quality with Black Forest surroundings. Clean mountain air. Fresh."
    },
    "fuerteventura": {
        "climate": "Fuerteventura has a subtropical desert climate with warm temperatures year-round (20-28°C). The Canary Islands enjoy eternal spring. Very little rain.",
        "cost": "Moderate with apartments from €500-900/month. Island import costs. Spanish value overall.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Spanish standards apply. Reliable.",
        "nightlife": "Beach bar scene and resort options. Corralejo has energy. Relaxed island vibe.",
        "nature": "Endless beaches and volcanic landscape. Wind and kite surfing paradise. Nature is dramatic.",
        "safety": "Very safe with tourist infrastructure. Canary Islands are welcoming. Comfortable.",
        "food": "Canarian cuisine with fresh fish. Goat cheese is famous. Spanish quality at island pace.",
        "community": "Surfer and windsport community. Digital nomads discovering island. Developing.",
        "english": "Good in tourism. German is also common. Spanish helps for deeper connection.",
        "visa": "Schengen rules apply. Spanish digital nomad visa available. Easy access.",
        "culture": "Volcanic island with wind sports identity. African proximity adds character. Beach culture.",
        "cleanliness": "Beaches are maintained. Resort areas good. Tourism drives standards.",
        "airquality": "Excellent air quality with constant Atlantic winds. The cleanest of Canaries. Pristine."
    },
    "funchal": {
        "climate": "Funchal has a subtropical climate with mild temperatures year-round (16-26°C). Madeira is the island of eternal spring. Mountains create microclimates.",
        "cost": "Moderate with apartments from €600-1000/month. Island premium but Portuguese value. Rising prices.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Portugal has invested in islands. Reliable.",
        "nightlife": "Relaxed scene with harbor area options. Wine bars and restaurants. Charming rather than party.",
        "nature": "Dramatic volcanic landscape. Levada walks are famous. Nature is spectacular.",
        "safety": "Very safe with low crime. Portuguese hospitality. Comfortable throughout.",
        "food": "Madeira specialties including espetada and bolo do caco. Fresh fish daily. Quality.",
        "community": "Growing digital nomad community. Retirees and nature lovers. Welcoming atmosphere.",
        "english": "Good English proficiency. Tourism ensures communication. Portuguese enriches.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad visas popular. Extended stays possible.",
        "culture": "Portuguese heritage on volcanic island. Botanical gardens and wine culture. Relaxed island life.",
        "cleanliness": "Very clean with pride in appearance. Tourism drives standards. Beautiful.",
        "airquality": "Excellent air quality with Atlantic and mountain air. Clean and fresh. Pristine."
    },
    "galway": {
        "climate": "Galway has a temperate oceanic climate with mild temperatures (5-17°C). Rain is frequent. Ireland's west coast is wild and wet.",
        "cost": "Moderate for Ireland. Apartments from €1000-1600/month. Growing tech sector affects prices.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Tech hub connectivity. Reliable.",
        "nightlife": "Famous pub scene with live music everywhere. The craic is legendary. Vibrant atmosphere.",
        "nature": "Wild Atlantic Way starts here. Connemara and Aran Islands nearby. Nature is dramatic.",
        "safety": "Very safe with Irish hospitality. Low crime. Comfortable throughout.",
        "food": "Oysters are famous. Growing food scene with local focus. Quality seafood and produce.",
        "community": "University, arts, and tech community. International but deeply Irish. Welcoming.",
        "english": "Native English with Irish character. No barriers. The storytelling is part of communication.",
        "visa": "Non-Schengen with Irish rules. UK-Ireland common travel area. Various options.",
        "culture": "Ireland's cultural heart with music and arts festivals. Irish language revival. Bohemian energy.",
        "cleanliness": "City center is maintained. Rain keeps things fresh. Pleasant.",
        "airquality": "Excellent air quality with Atlantic winds. Ireland's west is pristine. Fresh wild air."
    },
    "gdansk": {
        "climate": "Gdańsk has a humid continental climate with warm summers (18-23°C) and cold winters (-3 to 2°C). Baltic Sea moderates temperatures. Four seasons.",
        "cost": "Affordable for Poland. Apartments from €400-700/month. Great value for historic city.",
        "wifi": "Good Polish infrastructure with speeds of 50-100 Mbps. Improving rapidly. Reliable.",
        "nightlife": "Vibrant scene in the old town. Baltic beer culture. University adds energy.",
        "nature": "Baltic beaches and Kashubian lakes nearby. The coastline is accessible. Nature available.",
        "safety": "Very safe with low crime. Polish hospitality. Comfortable atmosphere.",
        "food": "Polish cuisine with Baltic seafood. Pierogi and fresh fish. Quality and affordable.",
        "community": "Growing international presence. Tech sector developing. Welcoming.",
        "english": "Good English among younger Poles. Tourism helps. Communication possible.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "Hanseatic heritage beautifully rebuilt. Solidarity movement birthplace. Rich history.",
        "cleanliness": "Old town is immaculate. Rebuilt with pride. Beautiful.",
        "airquality": "Good air quality with Baltic breezes. Better than southern Poland. Fresh coastal air."
    },
    "geneva": {
        "climate": "Geneva has a temperate climate with warm summers (20-26°C) and cold winters (-1 to 5°C). The lake and mountains affect weather. Four seasons.",
        "cost": "Very expensive as Swiss city. Apartments from CHF 2000-3500/month ($2200-3800). Among world's costliest.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. International organizations ensure connectivity. Impeccable.",
        "nightlife": "Sophisticated scene with bars and clubs. International influence. Expensive but quality.",
        "nature": "Lake Geneva and Alps visible. Mont Blanc nearby. Nature is spectacular.",
        "safety": "Extremely safe with low crime. Swiss organization. Very comfortable.",
        "food": "International cuisine due to UN presence. Swiss specialties available. Quality but expensive.",
        "community": "International organizations and NGO community. Highly diverse. Established networks.",
        "english": "Excellent alongside French. International city. No barriers.",
        "visa": "Non-Schengen Swiss rules. Various permit categories. Complex but accessible.",
        "culture": "International diplomacy capital. French Swiss culture. Refined and multicultural.",
        "cleanliness": "Impeccably clean with Swiss standards. Among world's cleanest cities. Pristine.",
        "airquality": "Good air quality with lake and mountain breezes. Swiss standards. Fresh Alpine air."
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

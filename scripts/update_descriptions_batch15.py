#!/usr/bin/env python3
"""
Update category descriptions for batch 15 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH15_DESCRIPTIONS = {
    "tbilisi": {
        "climate": "Georgian continental—hot summers (35°C), cold winters. Four distinct seasons. Pleasant spring and fall. Dry heat.",
        "cost": "Budget paradise at $1500/month. Georgia offers extraordinary value. One of Europe's best deals.",
        "wifi": "Georgian infrastructure—50-100 Mbps common. Tech scene drives improvement. Reliable for remote work.",
        "nightlife": "Legendary techno scene—Bassiani club world-famous. Wine bars, Rustaveli nightlife. Genuine underground culture.",
        "nature": "Caucasus Mountains accessible, wine country, and mineral baths. Excellent outdoor access from city.",
        "safety": "Very safe Georgian capital. Friendly atmosphere. Walk anywhere comfortably. Georgian hospitality genuine.",
        "food": "Georgian feast—khachapuri (cheese bread), khinkali dumplings, and endless toasts. Wine flows. Food is celebration.",
        "community": "Established nomad hub. Community active and welcoming. Coworking scenes. English works in nomad areas.",
        "english": "Improving rapidly. Younger generation good. Russian also useful. Georgian appreciated but challenging.",
        "visa": "365 days visa-free for most nationalities. Georgia's nomad paradise. No work permit needed. Extraordinary.",
        "culture": "Ancient churches, wine invention (8000 years), and Soviet heritage. Narikala Fortress overlooks city. Resilient beauty.",
        "cleanliness": "Improving—some areas rougher. Old Town character. Georgian standards rising. Generally pleasant.",
        "airquality": "Good—mountain proximity, limited industry. Some traffic pollution. Generally healthy."
    },
    "telaviv": {
        "climate": "Mediterranean coastal—hot humid summers (32°C), mild wet winters. Beach season long. Humidity significant.",
        "cost": "Expensive at $4000/month. Israeli tech prosperity shows. One of world's priciest cities.",
        "wifi": "Israeli excellence—startup nation means world-class connectivity. 100+ Mbps standard. No concerns.",
        "nightlife": "Legendary—Rothschild bars, beach clubs, and 24-hour city energy. Thursday night is Friday. Hedonistic culture.",
        "nature": "Beach city life, Yarkon Park, and Dead Sea day trips. Mediterranean coastline. Urban beach culture.",
        "safety": "Security situation complex. Tourist areas safe. Awareness essential. Iron Dome protects. Research current situation.",
        "food": "Middle Eastern excellence—hummus, shakshuka, and fresh Mediterranean. Food markets. Vegan-friendly. World-class.",
        "community": "Massive startup community. International professionals. English-speaking environment. Networking constant.",
        "english": "Excellent—Israelis speak fluent English. Business language. International environment. No barrier.",
        "visa": "90 days visa-free for most. Israel's visa can be complex. Working requires sponsorship. Security interviews.",
        "culture": "Bauhaus architecture (UNESCO), startup innovation, and beach lifestyle. Young, progressive, intense energy.",
        "cleanliness": "Generally clean modern city. Beach areas maintained. Israeli standards good. Some construction.",
        "airquality": "Coastal breezes help. Traffic affects levels. Mediterranean air generally good."
    },
    "thehague": {
        "climate": "Dutch North Sea—cool and damp year-round. Wind from sea adds chill. Grey much of year. Mild temperatures.",
        "cost": "Expensive Dutch at €2800/month. Cheaper than Amsterdam. International organization presence.",
        "wifi": "Dutch excellence—fiber widespread. Among world's best connectivity. No concerns whatsoever.",
        "nightlife": "Sophisticated—Scheveningen beach bars, embassy culture, and international crowd. Less wild than Amsterdam. Refined.",
        "nature": "North Sea beaches, dune walks, and flat Dutch countryside. Cycling culture. Urban green spaces.",
        "safety": "Very safe Dutch city. Walk anywhere anytime. Dutch order maintained. Minimal concerns.",
        "food": "Indonesian rijsttafel (colonial legacy), Dutch classics, and international options. Herring at stands. Diverse.",
        "community": "International professionals, diplomats, and expats. ICC, tribunals bring global community. English-speaking environment.",
        "english": "Excellent—Dutch speak perfect English. International organizations ensure English works. No barrier.",
        "visa": "90-day Schengen standard. Netherlands startup visa available. Highly skilled migrant route exists.",
        "culture": "Royal seat, international justice capital, and Mauritshuis (Girl with Pearl Earring). Peace Palace. Dignified elegance.",
        "cleanliness": "Dutch immaculate standards. Well-maintained throughout. Pride in public spaces. Exemplary.",
        "airquality": "Coastal breezes help. Limited pollution. Clean North Sea air. Very healthy."
    },
    "thessaloniki": {
        "climate": "Macedonian Mediterranean—hot summers (35°C), cold winters (2°C). More extreme than southern Greece. Four seasons.",
        "cost": "Affordable Greek at €1800/month. Cheaper than Athens. Student economy helps. Good value.",
        "wifi": "Greek infrastructure—40-70 Mbps typical. University presence helps. Improving steadily.",
        "nightlife": "Legendary—Ladadika district, waterfront bars, and student energy. Greeks party late. Genuine fun.",
        "nature": "Mount Olympus accessible, Halkidiki beaches, and surrounding countryside. Good day trip options.",
        "safety": "Safe Greek city. Tourist-friendly atmosphere. Walk anywhere comfortably. Relaxed and welcoming.",
        "food": "Macedonian Greek—bougatsa pastry, gyros, and seafood. Ottoman influences. Food scene excellent and affordable.",
        "community": "University brings international students. Small nomad scene. Greek helps but English workable.",
        "english": "Good among younger generation. University areas better. Tourist services adequate.",
        "visa": "90-day Schengen standard. Greece's digital nomad visa available. Straightforward process.",
        "culture": "Byzantine heritage—White Tower, churches, and Roman ruins. Laid-back alternative to Athens. Authentic Greece.",
        "cleanliness": "Waterfront well-maintained. Some areas rougher. Greek character. Generally pleasant.",
        "airquality": "Can be affected by traffic. Coastal location helps. Generally acceptable."
    },
    "tokyo": {
        "climate": "Japanese humid subtropical—hot humid summers (35°C), mild winters. Cherry blossoms April, autumn November. Typhoons possible.",
        "cost": "Expensive at ¥400,000/month ($3000). World's largest city isn't cheap. Quality matches price.",
        "wifi": "Japanese excellence—world-class connectivity everywhere. Pocket WiFi readily available. No concerns.",
        "nightlife": "Endless—Shibuya, Shinjuku, Roppongi all different vibes. 24-hour city. Every subculture exists. Mind-blowing variety.",
        "nature": "Urban density but parks excellent. Meiji Shrine forest, day trips to Hakone and Mt Fuji. Nature escapes accessible.",
        "safety": "Extremely safe global megacity. Walk anywhere, leave belongings. Japanese order remarkable. Among world's safest.",
        "food": "World's most Michelin stars. Ramen, sushi, and every cuisine perfected. Convenience store food excellent. Food paradise.",
        "community": "Large international community. English teaching, tech, and business. Networking active but Japanese helps.",
        "english": "Limited despite international presence. Tourist areas have basics. Japanese essential for daily life.",
        "visa": "90 days visa-free for most. Working requires sponsorship. Working holiday for eligible nationalities.",
        "culture": "Ancient shrines meet neon future. Every subculture exists. Pop culture capital. Overwhelming possibilities.",
        "cleanliness": "Japanese immaculate standards. No trash cans but no litter. Exemplary public spaces.",
        "airquality": "Good for megacity. Japanese standards help. Cedar pollen affects spring. Generally healthy."
    },
    "toronto": {
        "climate": "Canadian extremes—cold snowy winters (-10°C), hot humid summers. Four distinct seasons. Lake effect snow. Dramatic.",
        "cost": "Expensive Canadian at CAD $4500/month ($3400). Housing crisis severe. Canada's most expensive city.",
        "wifi": "Canadian infrastructure—100+ Mbps standard. Tech hub ensures connectivity. No concerns.",
        "nightlife": "Entertainment district clubs, Queen West bars, and diverse neighborhood scenes. Everything exists. Late-night poutine.",
        "nature": "Lake Ontario waterfront, Scarborough Bluffs, and cottage country accessible. Urban nature present.",
        "safety": "Generally safe Canadian city. Some areas at night need awareness. Standard major city precautions.",
        "food": "Multicultural—best Chinese outside China, Caribbean, Indian, and everything. Food scene exceptional and diverse.",
        "community": "Massive international community. Every nationality represented. Tech and finance. Networking active.",
        "english": "Native English—multicultural means many accents. French less present than Montreal. No barrier.",
        "visa": "Canadian visa complexity. Working Holiday for eligible. Work permits require sponsorship. Express Entry system.",
        "culture": "CN Tower icon, diverse neighborhoods, and multicultural identity. TIFF, sports teams. Canada's largest city.",
        "cleanliness": "Generally well-maintained. Some areas challenging. Canadian standards apply. Improving.",
        "airquality": "Can be affected by summer smog. Generally good Canadian air. US pollution occasionally drifts."
    },
    "trieste": {
        "climate": "Adriatic with Bora wind—cold powerful wind in winter. Mild summers. Mediterranean tempered by alpine influences.",
        "cost": "Affordable Italian at €2000/month. Off tourist path. Italian quality at reasonable prices.",
        "wifi": "Italian infrastructure—50-80 Mbps typical. Improving. Cafés accommodate working.",
        "nightlife": "Literary café tradition—Caffè San Marco, wine bars, and waterfront evening walks. Sophisticated rather than wild.",
        "nature": "Gulf of Trieste, Carso plateau hiking, and Slovenia border nearby. Unique geographic position.",
        "safety": "Very safe Italian city. Walk anywhere comfortably. Relaxed atmosphere. Border city character.",
        "food": "Central European-Italian fusion—Viennese coffee culture, Italian pasta, and Slavic influences. Unique cuisine.",
        "community": "Small international presence. Literary tourists and coffee enthusiasts. Italian essential. Pioneer territory.",
        "english": "Limited—this is deep Italy. Some tourism English. Italian essential for daily life.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy.",
        "culture": "Habsburg heritage, coffee house tradition (Illy founded here), and literary associations (Joyce lived here). Border city identity.",
        "cleanliness": "Well-maintained Italian city. Less touristed means authentic character. Pleasant throughout.",
        "airquality": "Bora wind cleans air. Coastal location helps. Clean Adriatic air."
    },
    "trujillo": {
        "climate": "Peruvian coastal desert—mild year-round (15-25°C). Garúa fog season. Almost never rains. Spring eternal.",
        "cost": "Budget paradise at $1000/month. Provincial Peru pricing. Extraordinary value.",
        "wifi": "Peruvian provincial—20-40 Mbps typical. Improving but inconsistent. Mobile data backup helpful.",
        "nightlife": "Small city rhythm—Plaza de Armas evenings, some bars and clubs. Not a party destination. Local life.",
        "nature": "Chan Chan ruins, Huanchaco beach surf town, and desert surroundings. Archaeological landscape.",
        "safety": "Safer than Lima. Tourist-friendly atmosphere. Standard awareness. Peruvian hospitality genuine.",
        "food": "Northern Peruvian—ceviche excellence, cabrito (goat), and coastal specialties. Different from Lima. Delicious.",
        "community": "Very small international presence. Language students, archaeologists. Spanish essential. Pioneer territory.",
        "english": "Very limited. Spanish essential for everything. Off tourist track. Language learning necessary.",
        "visa": "183 days visa-free. Peru welcoming. Extensions possible. Straightforward immigration.",
        "culture": "Chan Chan (world's largest adobe city), Moche heritage, and colonial centro. Pre-Columbian civilization center.",
        "cleanliness": "Centro maintained. Some areas rougher. Peruvian standards. Pleasant colonial core.",
        "airquality": "Good—desert climate, coastal breezes. Limited pollution. Healthy environment."
    },
    "tunis": {
        "climate": "Mediterranean North African—hot dry summers (35°C), mild wet winters. Pleasant spring and fall. African sun.",
        "cost": "Very affordable at $1200/month. Tunisia offers excellent value. North African pricing.",
        "wifi": "Tunisian infrastructure—30-60 Mbps typical. Improving. Cafés and hotels reliable. Mobile data backup helpful.",
        "nightlife": "La Marsa and Sidi Bou Said evening culture. Cafés, shisha, and some clubs. Conservative but social.",
        "nature": "Mediterranean beaches, Sahara accessible, and Cap Bon peninsula. Diverse geography.",
        "safety": "Generally safe with awareness. Political situation stable currently. Research current conditions. Tourist areas fine.",
        "food": "Tunisian cuisine—couscous, brik pastry, and harissa everything. French influence. Mediterranean Arab flavors.",
        "community": "Small expat presence. NGO workers, French speakers. Francophone environment. Arabic helpful.",
        "english": "Limited—French is second language. Arabic and French dominate. English less common.",
        "visa": "90 days visa-free for most. Tunisia welcoming to tourists. Straightforward process.",
        "culture": "Carthage ruins, medina UNESCO site, and Arab-French-Mediterranean blend. Ancient history layers.",
        "cleanliness": "Medina authentic, some areas rougher. Tourist areas maintained. North African character.",
        "airquality": "Good—Mediterranean coastal. Limited heavy industry. Clean North African air."
    },
    "turin": {
        "climate": "Northern Italian continental—cold foggy winters, hot summers. Alpine influences. Po Valley can trap pollution. Four seasons.",
        "cost": "Moderate Italian at €2400/month. Cheaper than Milan. Industrial city value.",
        "wifi": "Northern Italian infrastructure—60-100 Mbps typical. Better than south. Reliable for remote work.",
        "nightlife": "Quadrilatero Romano bars, San Salvario nightlife, and aperitivo culture. Less tourist than Florence. Genuine Italian.",
        "nature": "Alps visible and accessible. Day trips to ski resorts. Po River walks. Mountain proximity excellent.",
        "safety": "Safe northern Italian city. Some areas rougher at night. Standard awareness. Comfortable overall.",
        "food": "Piedmontese excellence—agnolotti, bagna cauda, and Barolo wine region. Slow Food movement birthplace. Chocolate tradition.",
        "community": "Automotive industry (Fiat), universities bring some international presence. Italian dominant. Growing startup scene.",
        "english": "Limited compared to tourist cities. Italian essential for daily life. Business community has English.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy challenges.",
        "culture": "Egyptian Museum (largest outside Egypt), Savoy palaces, and automotive heritage. Underrated gem. Industrial elegance.",
        "cleanliness": "Well-maintained northern Italian city. Some industrial character. Pride in presentation.",
        "airquality": "Po Valley traps pollution—can be problematic in winter. Monitor AQI. Summer better."
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
    print("Updating category descriptions for batch 15 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH15_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH15_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

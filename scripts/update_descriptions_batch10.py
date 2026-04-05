#!/usr/bin/env python3
"""
Update category descriptions for batch 10 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH10_DESCRIPTIONS = {
    "montreal": {
        "climate": "Canadian extremes—brutal winters (-15°C with wind chill), beautiful summers. Underground city helps survive January. Four distinct seasons.",
        "cost": "Moderate Canadian at CAD $3200/month. Cheaper than Toronto or Vancouver. Good value for North America.",
        "wifi": "Canadian infrastructure—100+ Mbps standard. Cafés and coworking excellent. No connectivity concerns.",
        "nightlife": "Legendary—Plateau bars, underground clubs, and festival culture. Jazz Fest, Just for Laughs, and summer party mode. European vibes.",
        "nature": "Mont-Royal park, Laurentian Mountains accessible. Cottage country. Winter skiing. Summer lake culture.",
        "safety": "Safe Canadian city. Some awareness in certain areas at night. Generally comfortable. Friendly atmosphere.",
        "food": "Bagels vs NYC (Montreal wins), poutine everywhere, and smoked meat. French Canadian cuisine meets diverse immigrant foods. Excellent.",
        "community": "Creative and tech community thriving. Startup scene established. International but French-dominant. Language defines experience.",
        "english": "Bilingual city—French is official. English works but French appreciation essential. Both languages heard daily.",
        "visa": "Canadian visa complexity. Working Holiday for eligible nationalities. Work permits require sponsorship.",
        "culture": "European France in North America—French language, café culture, and Catholic heritage. Festival city. Underground music scene legendary.",
        "cleanliness": "Canadian standards—clean and organized. Winter challenges with salt and snow. Pleasant urban environment.",
        "airquality": "Good—cold climate helps. Canadian environmental standards. Summer smog occasionally from US drift."
    },
    "mostar": {
        "climate": "Herzeg Mediterranean-influenced—hot dry summers, mild winters. Pleasant most of the year. Mountain backdrop adds weather variation.",
        "cost": "Budget paradise at €1200/month. Bosnia's value is extraordinary. One of Europe's cheapest destinations.",
        "wifi": "Bosnian infrastructure developing—30-50 Mbps typical. Improving but not reliable everywhere. Mobile data helps.",
        "nightlife": "Small town charm—riverside bars, traditional kafanas, and quiet evenings. Not a party destination. Come for history.",
        "nature": "Stunning—Neretva River, surrounding mountains, and Kravice waterfalls. Excellent outdoor access.",
        "safety": "Safe post-war tourist town. Friendly atmosphere. Landmine warnings in rural areas from war. Tourist zones fine.",
        "food": "Bosnian hearty fare—ćevapi, burek, and grilled meats. Turkish coffee culture. Cheap and filling.",
        "community": "Very small international presence. Tourists pass through. Few long-term visitors. Bosnian/Croatian helpful.",
        "english": "Limited—tourism provides basics. Younger generation improving. Local language helpful.",
        "visa": "90 days visa-free for most. Bosnia not EU. Straightforward tourist process.",
        "culture": "Stari Most (Old Bridge) rebuilt after war destruction. Ottoman and Yugoslav layers. War history visible and important. Resilience.",
        "cleanliness": "Tourist areas maintained. Post-war recovery continues. Small-town character. Pleasant.",
        "airquality": "Good—mountain location, limited industry. Clean Balkan air."
    },
    "mumbai": {
        "climate": "Tropical monsoon—brutal monsoon season (Jun-Sep) with flooding. Hot and humid year-round. October-February best.",
        "cost": "Value for rupee at $1800/month. South Mumbai expensive; suburbs cheaper. Contrast is extreme.",
        "wifi": "Indian infrastructure improving—40-80 Mbps in good areas. Varies wildly. Mobile data (Jio) is reliable backup.",
        "nightlife": "Bollywood glamour, rooftop bars, and underground scenes. South Mumbai sophisticated. Late-night energy. Conservative rules in some areas.",
        "nature": "Limited—urban density. Sanjay Gandhi National Park offers escape. Beach escapes to Goa. City focus.",
        "safety": "Generally safe with cultural awareness. Scams exist. Crowded spaces require vigilance. Women travelers need extra caution.",
        "food": "Street food paradise—vada pav, pav bhaji, and regional Indian cuisines. Every Indian state represented. Spicy and spectacular.",
        "community": "Startup and film industry professionals. Growing coworking scene. Diverse but Hindi/English helps enormously.",
        "english": "Widely spoken—colonial legacy. Business language. Hindi for deeper connection. Communication comfortable.",
        "visa": "E-visa available. India visa process can be complex. Extensions bureaucratic. Plan ahead.",
        "culture": "Bollywood capital, colonial architecture, and Indian commercial heart. Gateway of India. Film industry glamour meets street hustle.",
        "cleanliness": "Challenging—developing country density. Some areas maintained; others overwhelming. Accept the chaos.",
        "airquality": "Poor—traffic, industry, and construction. Masks helpful. Air purifier recommended. Health concern."
    },
    "munich": {
        "climate": "Bavarian alpine-influenced—cold winters with Föhn wind breaks, warm summers. Beer garden weather is real. Four seasons.",
        "cost": "Expensive German at €3500/month. Bavaria's prosperity shows in prices. Quality is very high.",
        "wifi": "German infrastructure—100+ Mbps standard. Tech and automotive presence ensures connectivity. Reliable.",
        "nightlife": "Beer gardens in summer, sophisticated bars year-round. Oktoberfest legendary. Less wild than Berlin but genuine Bavarian fun.",
        "nature": "Alps within an hour. Lakes, hiking, and skiing accessible. Urban parks excellent. Outdoor paradise access.",
        "safety": "Extremely safe German city. Low crime. Walk anywhere comfortably. Bavarian order maintained.",
        "food": "Bavarian hearty—Weisswurst, pretzels, and schnitzel. Beer culture serious. Quality over variety. Hearty and satisfying.",
        "community": "Tech (BMW, Siemens), finance, and professional community. International but German-speaking. English works in business.",
        "english": "Good but German expected more than in Berlin. Business community functions in English. Bavarian appreciate language effort.",
        "visa": "90-day Schengen standard. Germany's freelance visa available. Munich is business-friendly for EU pathways.",
        "culture": "Bavarian heritage—Marienplatz, Nymphenburg Palace, and traditional Gemütlichkeit. Art scene excellent. High culture and beer culture coexist.",
        "cleanliness": "German precision at its finest. Spotless public spaces. Efficient everything. Exemplary urban management.",
        "airquality": "Good—Alpine proximity helps. German environmental standards. Clean Bavarian air."
    },
    "naples": {
        "climate": "Southern Mediterranean—hot summers, mild winters. Vesuvius backdrop adds drama. Pleasant most of year.",
        "cost": "Affordable Italian at €2200/month. Southern Italy value. Real prices, not tourist markup.",
        "wifi": "Southern Italian infrastructure—40-60 Mbps typical. Can be unreliable. Patience required. Improving slowly.",
        "nightlife": "Passionate—waterfront bars, street life, and Neapolitan chaos. Centro storico late nights. Genuine Italian energy.",
        "nature": "Vesuvius hiking, Amalfi Coast proximity, and Capri day trips. Extraordinary natural beauty accessible.",
        "safety": "Reputation worse than reality but awareness needed. Pickpockets active. Scooter snatching occurs. Research neighborhoods.",
        "food": "PIZZA birthplace. Margherita was invented here. Seafood, sfogliatella, and espresso culture. Food pilgrimage essential. Unmissable.",
        "community": "Small international presence. Language students. Few nomads—Italian essential. Adventure seekers territory.",
        "english": "Very limited. Italian necessary for everything. Tourist services minimal. Learning essential.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Southern Italy bureaucracy tests patience.",
        "culture": "Archaeological abundance—Pompeii, Herculaneum, and Greek ruins. Baroque churches, underground tunnels, and chaotic vitality. Real Italy.",
        "cleanliness": "Notorious—garbage crises have occurred. Improving but gritty. Southern Italian reality. Character over cleanliness.",
        "airquality": "Traffic affects levels. Vesuvius adds drama not pollution. Generally acceptable Mediterranean air."
    },
    "nashville": {
        "climate": "Southern humid—hot summers (35°C+), mild winters. Four seasons. Pleasant spring and fall. Summer humidity significant.",
        "cost": "Rising at $3500/month. 'It City' premium developed. Still cheaper than LA or NYC.",
        "wifi": "American infrastructure—100+ Mbps standard. Music Row and downtown connected. No concerns.",
        "nightlife": "Honky-tonk heaven—Broadway neon, live country music every night. Bachelorette party central. Genuine music scene beyond tourists.",
        "nature": "Rolling hills, state parks, and Smoky Mountains accessible. Lake culture. Southern outdoor beauty.",
        "safety": "Generally safe American city. Broadway crowds can be chaotic. Standard urban awareness. Friendly atmosphere.",
        "food": "Hot chicken mandatory. BBQ, biscuits, and Southern comfort food. Meat and three tradition. Hearty and delicious.",
        "community": "Music industry, healthcare, and growing tech. Creative community established. Networking through music venues.",
        "english": "Southern American English—friendly and distinctive. No language barrier. Y'all welcome.",
        "visa": "US visa complexity. ESTA for tourism. Working requires sponsorship. No nomad visa.",
        "culture": "Country music capital. Grand Ole Opry, honky-tonks, and songwriter culture. Music is religion. Genuine American scene.",
        "cleanliness": "Downtown maintained for tourism. American Southern city standards. Pleasant overall.",
        "airquality": "Good—no heavy industry. Allergens in spring. Generally healthy environment."
    },
    "newyork": {
        "climate": "Humid subtropical extremes—hot humid summers, cold snowy winters. Four intense seasons. Weather is a topic of conversation.",
        "cost": "World's most expensive at $6000+/month. Manhattan astronomical. Outer boroughs cheaper but not cheap.",
        "wifi": "Global connectivity hub—high-speed everywhere. Tech and media industries ensure excellence. World-class.",
        "nightlife": "Everything exists—Broadway shows, Brooklyn warehouses, jazz clubs, and 4am last call. The city that never sleeps delivers.",
        "nature": "Central Park is remarkable. Hudson Valley, beaches accessible. Urban nature excellent despite density.",
        "safety": "Safer than reputation but awareness essential. Subway late night, research neighborhoods. Times Square pickpockets.",
        "food": "World's best pizza, bagels, and every cuisine on earth. Michelin stars and $1 slices coexist. Food paradise.",
        "community": "Everything and everyone. Every industry represented. Networking is life. Competitive but accessible.",
        "english": "Global English hub. Every language spoken. Diverse accents. Communication never an issue.",
        "visa": "US visa complexity. Tourist status limits. Working requires sponsorship. Very competitive market.",
        "culture": "MoMA, Met, Broadway, and every cultural institution imaginable. Global culture capital. Overwhelming possibilities.",
        "cleanliness": "Garbage is famous. Some areas cleaner than others. Urban density reality. Rats are real.",
        "airquality": "Traffic affects levels. Better than most major cities. Coastal location helps. Generally acceptable."
    },
    "nice": {
        "climate": "Riviera perfection—300 days of sunshine, mild winters, warm summers. Mediterranean at its finest. Beach weather much of year.",
        "cost": "Expensive Riviera at €3500/month. Glamour has a price. Worth it for lifestyle.",
        "wifi": "French infrastructure—80-100 Mbps typical. Tourist area connectivity good. Reliable for remote work.",
        "nightlife": "Riviera sophistication—casino elegance, waterfront bars, and Old Nice charm. Less wild than expected. Refined evenings.",
        "nature": "Mediterranean beaches, Maritime Alps behind city, and Corniche drives. Stunning natural beauty accessible.",
        "safety": "Generally safe but awareness needed. Petty theft on beaches. Promenade des Anglais secure. Tourist areas fine.",
        "food": "Niçoise cuisine—salade niçoise, socca, pissaladière. Mediterranean freshness. Quality over quantity. Expensive but excellent.",
        "community": "Established expat retirement community. Fewer nomads than expected. French language dominant. Seasonal tourism focus.",
        "english": "Less than expected—French Riviera is French. Tourist services in English. Daily life benefits from French.",
        "visa": "90-day Schengen standard. France's digital nomad visa available. Riviera attracts wealth, not budget nomads.",
        "culture": "Belle Époque architecture, Matisse Museum, and Carnival tradition. Riviera glamour with genuine Mediterranean culture.",
        "cleanliness": "Well-maintained for tourism. Beaches cleaned daily. French Riviera standards. Pleasant throughout.",
        "airquality": "Excellent—Mediterranean breezes, coastal location. Clean Riviera air. Among France's best."
    },
    "ninhbinh": {
        "climate": "Northern Vietnamese—hot humid summers, cool winters. Monsoon affects June-September. Best October-April.",
        "cost": "Extremely cheap at $800/month. Rural Vietnam pricing. One of world's most affordable destinations.",
        "wifi": "Rural Vietnamese infrastructure—20-40 Mbps if available. Tourist hotels better. Manage expectations. Mobile data backup.",
        "nightlife": "Virtually none. Small town, early nights. Come for nature and temples, not nightlife.",
        "nature": "Spectacular—'Ha Long Bay on land.' Limestone karsts, rice paddies, and boat rides through caves. Extraordinary beauty.",
        "safety": "Very safe Vietnamese province. Friendly, welcoming. Walking comfortable. Rural peace.",
        "food": "Vietnamese regional—goat meat specialty. Simple local fare. Tourist restaurants exist. Authentic and cheap.",
        "community": "Virtually none. Day-trippers from Hanoi. Very few long-term visitors. Vietnamese essential.",
        "english": "Very limited. Tourism provides basics. Vietnamese language helpful for any depth.",
        "visa": "Vietnamese e-visa for 90 days. Same rules as Hanoi. Small town, simple needs.",
        "culture": "Trang An grottoes, Bai Dinh pagoda (Vietnam's largest), and ancient capital at Hoa Lu. UNESCO landscape.",
        "cleanliness": "Rural Vietnamese standards. Tourist areas maintained. Simple but clean. Natural beauty is focus.",
        "airquality": "Excellent—rural location, rice paddies, limited traffic. Fresh Vietnamese countryside air."
    },
    "nuremberg": {
        "climate": "Bavarian continental—cold winters, warm summers. Christmas market season magical. Four distinct seasons.",
        "cost": "Moderate German at €2400/month. Cheaper than Munich. Good value for quality.",
        "wifi": "German infrastructure—80-100 Mbps standard. Reliable throughout. Cafés accommodate working.",
        "nightlife": "Traditional Bavarian—beer halls, wine bars, and student energy from universities. Less wild than Berlin. Genuine German fun.",
        "nature": "Franconian Switzerland nearby for hiking. City parks extensive. Pleasant outdoor access.",
        "safety": "Very safe German city. Walk anywhere comfortably. Bavarian order. Minimal concerns.",
        "food": "Nuremberg bratwurst is distinctive (small, multiple). Lebkuchen (gingerbread) capital. Bavarian classics. Hearty and delicious.",
        "community": "Smaller international presence than Munich. Industry professionals. University brings some diversity.",
        "english": "Good in business and young generation. More German expected than Berlin. Language effort appreciated.",
        "visa": "90-day Schengen standard. Germany's freelance visa available. Same process throughout Germany.",
        "culture": "Nazi rally grounds (historically important), medieval castle, and Albrecht Dürer heritage. Christmas market world-famous. Complex history.",
        "cleanliness": "German standards—immaculate. Medieval with modern maintenance. Efficient and clean.",
        "airquality": "Good—limited heavy industry. German environmental standards. Healthy Bavarian air."
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
    print("Updating category descriptions for batch 10 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH10_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH10_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Update category descriptions for batch 9 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH9_DESCRIPTIONS = {
    "krakow": {
        "climate": "Continental Polish—cold winters (-5°C), warm summers (25°C). Smog in winter from coal heating. Spring and fall ideal for visiting.",
        "cost": "Excellent value at €1800/month. One of Europe's best deals. Old town premium exists but still affordable.",
        "wifi": "Polish infrastructure solid—80-100 Mbps common. Coworking scenes in Kazimierz. Improving rapidly.",
        "nightlife": "Legendary—Kazimierz Jewish Quarter transformed into bar district. Student energy, clubs, and vodka culture. Stag parties are common but avoidable.",
        "nature": "Tatra Mountains accessible for serious hiking and skiing. Ojców National Park nearby. Good outdoor escapes.",
        "safety": "Very safe Polish city. Tourist areas well-patrolled. Walk anywhere comfortably. Friendly atmosphere.",
        "food": "Polish hearty fare—pierogi, żurek, and kielbasa. Jewish cuisine revival in Kazimierz. Affordable and filling.",
        "community": "Growing nomad scene. English teachers, Erasmus students, and remote workers. Community established and welcoming.",
        "english": "Good among younger generation. Tourist infrastructure accommodates. Polish appreciated but not essential.",
        "visa": "90-day Schengen standard. Poland offers no specific nomad visa but EU pathways exist.",
        "culture": "Wawel Castle, medieval market square (Europe's largest), and Kazimierz's Jewish heritage. Auschwitz proximity adds solemnity. Cultural heavyweight.",
        "cleanliness": "Old town well-maintained. Some areas show age. Polish pride improving standards. Generally pleasant.",
        "airquality": "SERIOUS winter smog—coal heating creates hazardous conditions. Masks recommended November-March. Summer much better."
    },
    "kyoto": {
        "climate": "Japanese seasons at their finest—cherry blossoms (April), autumn colors (November). Hot humid summers, cold winters. Shoulder seasons magical.",
        "cost": "Moderate Japanese at ¥350,000/month ($2500). Tourist accommodation inflates prices. Living locally is more affordable.",
        "wifi": "Japanese excellence—high-speed standard. Traditional buildings may challenge signals. Pocket WiFi recommended.",
        "nightlife": "Refined rather than wild. Gion geisha district, sake bars, and quiet sophistication. Not a party destination. Cultural evenings.",
        "nature": "Arashiyama bamboo grove, mountain temples, and garden perfection. Japanese nature philosophy made tangible. Extraordinary beauty.",
        "safety": "Japanese safety standards—exceptionally secure. Walk anywhere at any hour. Leave belongings without worry.",
        "food": "Kaiseki multi-course artistry, tofu traditions, and matcha everything. Food is art here. Michelin stars abundant. Refined and exquisite.",
        "community": "Small international presence. Language students and cultural seekers. Few nomads—deep immersion territory. Japanese essential.",
        "english": "Limited—this is traditional Japan. Tourist sites have some English. Daily life requires Japanese commitment.",
        "visa": "90 days visa-free for most. Working requires sponsorship. Cultural visa for specific studies available.",
        "culture": "1600 temples, zen gardens, and geisha traditions. Ancient capital's heritage preserved deliberately. Japan's cultural heart. Overwhelming beauty.",
        "cleanliness": "Japanese immaculate standards. Temple grounds pristine. Traditional aesthetics maintained. Exemplary.",
        "airquality": "Excellent—limited industry, gardens everywhere. Clean traditional city. Among Japan's healthiest."
    },
    "lecce": {
        "climate": "Puglia Mediterranean heat—hot dry summers (35°C+), mild winters. Beach season long. Perfect shoulder seasons.",
        "cost": "Affordable Italian at €2000/month. Southern Italy pricing. Great value for quality of life.",
        "wifi": "Southern Italian infrastructure—40-60 Mbps typical. Improving but not northern standards. Patience required.",
        "nightlife": "Passeggiata evening culture—walking, aperitivo, and piazza life. Summer energy. Refined rather than rowdy.",
        "nature": "Two seas accessible—Adriatic and Ionian beaches. Salento peninsula beauty. Excellent coastal access.",
        "safety": "Very safe southern Italian city. Welcoming atmosphere. Walk anywhere comfortably. Genuine hospitality.",
        "food": "Puglian excellence—orecchiette, burrata, taralli, and fresh seafood. Simple ingredients elevated. Food pilgrimage territory.",
        "community": "Small expat presence, mostly retirees. Few nomads—pioneer territory. Italian essential for integration.",
        "english": "Very limited. Italian necessary for daily life. Tourism increasing English slightly. Learning essential.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Southern Italy bureaucracy requires patience.",
        "culture": "Baroque explosion—'Florence of the South' nickname earned. Ornate churches, Roman amphitheater, and Salento traditions. Visually extraordinary.",
        "cleanliness": "Well-maintained historic center. Southern Italian character. Tourist economy drives standards. Pleasant.",
        "airquality": "Excellent—coastal location, limited industry. Clean Puglia air. Healthy Mediterranean environment."
    },
    "leipzig": {
        "climate": "Eastern German continental—cold winters, warm summers. Similar to Berlin but slightly more extreme. Grey but liveable.",
        "cost": "Germany's best value at €2000/month. Much cheaper than Munich or Berlin. Excellent deal for quality.",
        "wifi": "German infrastructure—80-100 Mbps standard. Startup scene ensures connectivity. Reliable throughout.",
        "nightlife": "Underground scene rivaling Berlin. Abandoned factories turned clubs. Art and music collide. Genuinely cool.",
        "nature": "Lake district nearby for summer swimming. Flat but green. Urban parks extensive. Pleasant escapes.",
        "safety": "Generally safe German city. Some areas at night require awareness. Standard precautions. Comfortable overall.",
        "food": "German fare with creative scene growing. Coffee culture excellent. International influences increasing.",
        "community": "Growing creative and startup scene. Artists priced out of Berlin arriving. Young energy. English speakers increasing.",
        "english": "Good in creative scenes. Eastern German older generation less fluent. University and arts communities accommodate.",
        "visa": "90-day Schengen standard. Germany's freelance visa available. Same process as Berlin.",
        "culture": "Bach and Mendelssohn heritage, peaceful revolution history (1989), and contemporary art scene. Music city reinventing itself.",
        "cleanliness": "German standards apply. Well-maintained. Some industrial character remains. Pleasant urban environment.",
        "airquality": "Good—industrial decline cleaned air. German environmental standards. Healthy environment."
    },
    "lima": {
        "climate": "Desert coast paradox—overcast (garúa fog) May-November but almost never rains. Mild year-round (15-27°C). Strange but comfortable.",
        "cost": "Moderate at $2000/month. Miraflores premium exists. Local neighborhoods much cheaper.",
        "wifi": "Peruvian infrastructure—50-80 Mbps in good areas. Miraflores well-connected. Coworking spaces reliable.",
        "nightlife": "Miraflores and Barranco bar scenes. Pisco sour culture. Salsa clubs. Genuine energy but safety awareness needed.",
        "nature": "Pacific coastline, paragliding over cliffs, and desert surroundings. Machu Picchu requires flights. Coastal focus.",
        "safety": "Requires attention—research neighborhoods. Miraflores and San Isidro safer. Petty crime common. Don't display wealth.",
        "food": "WORLD-CLASS culinary destination. Ceviche capital, Nikkei fusion, and Central (world's best restaurant lists). Food pilgrimage essential.",
        "community": "Growing nomad scene in Miraflores. Coworking spaces emerging. Spanish helps enormously.",
        "english": "Limited outside tourist services. Spanish essential for daily life. Younger professionals improving.",
        "visa": "183 days visa-free—generous. Peru's immigration straightforward. Extensions possible.",
        "culture": "Pre-Columbian heritage at Huaca sites, colonial centro, and contemporary gastronomy scene. Archaeological meets cutting-edge.",
        "cleanliness": "Varies dramatically. Miraflores maintained; other areas challenging. Developing city reality.",
        "airquality": "Grey but not polluted—coastal fog is moisture, not smog. Generally acceptable. Traffic affects main arteries."
    },
    "lisbon": {
        "climate": "Atlantic Mediterranean—300 days of sunshine, mild winters, warm summers. Sea breezes moderate heat. Near-perfect weather.",
        "cost": "Rising at €3500/month. Digital nomad influx transformed prices. Worth it but budget carefully.",
        "wifi": "Portuguese fiber excellent—100+ Mbps standard. Cafés and coworking accommodate. Reliable connectivity.",
        "nightlife": "Bairro Alto transforms nightly. Rooftop bars, fado houses, and LX Factory creative scene. Late nights until dawn.",
        "nature": "Sintra palaces and forests, Costa da Caparica beaches, and Arrábida nature. Excellent day trip options.",
        "safety": "Very safe European capital. Pickpockets in tourist zones. Standard awareness. Comfortable walking anywhere.",
        "food": "Pastéis de nata obsession, bacalhau 365 ways, and contemporary Portuguese cuisine. Wine is excellent and cheap.",
        "community": "MASSIVE nomad community. One of Europe's biggest hubs. Meetups daily. Coworking everywhere. Friends instantly.",
        "english": "Excellent—Portuguese young people speak fluent English. International community massive. No language barrier.",
        "visa": "90-day Schengen. Portugal's D7 passive income visa or new digital nomad visa. Established pathways.",
        "culture": "Fado soul, azulejo tile art, Age of Discovery heritage, and contemporary creativity. Melancholic beauty. Saudade defined.",
        "cleanliness": "Graffiti is art here. Some areas rougher. Improving with tourism economy. Charming character.",
        "airquality": "Excellent—Atlantic breezes, coastal location. Clean air year-round. Among Europe's best."
    },
    "london": {
        "climate": "Grey and drizzly—mild temperatures (5-22°C), frequent light rain. Rarely extreme but often damp. Vitamin D supplements recommended.",
        "cost": "Among world's most expensive at £5000+/month. Housing crisis is severe. Budget very carefully.",
        "wifi": "British infrastructure—100+ Mbps fiber widespread. Coworking and cafés abundant. Global hub connectivity.",
        "nightlife": "Everything exists—West End theater, Shoreditch hipsters, Soho clubs, and pub culture. World-class variety. Tube closes early though.",
        "nature": "Hyde Park and Royal Parks extensive. Hampstead Heath for wild swimming. Countryside accessible by train. Urban green space excellent.",
        "safety": "Generally safe global city. Some areas require awareness. Pickpockets and bike theft common. Standard major city precautions.",
        "food": "Global cuisines—Indian, Chinese, Middle Eastern, and everything else. Borough Market grazing. Michelin stars abundant. No longer a food joke.",
        "community": "Massive international community. Every industry represented. Networking opportunities endless. Competitive but accessible.",
        "english": "Global English—native speakers plus international population. Diverse accents. Communication never an issue.",
        "visa": "UK visa complexity post-Brexit. Visitor status limits work. Skilled worker visa requires sponsorship. No nomad visa.",
        "culture": "Museums free and world-class. Theater, music, and art scenes unrivaled. Royal heritage meets contemporary cool. Cultural capital.",
        "cleanliness": "Varies by area. Central maintained; some neighborhoods gritty. Tube shows age. Working urban character.",
        "airquality": "Improving but traffic affects levels. ULEZ helping. Not excellent but acceptable for major capital."
    },
    "losangeles": {
        "climate": "Mediterranean perfection—warm and sunny year-round (18-30°C). Minimal rain. Beach weather most days. Fire season adds smoke risk.",
        "cost": "Expensive American at $4500+/month. Housing crisis severe. Location within LA dramatically affects prices.",
        "wifi": "American infrastructure—100-300 Mbps standard. Tech industry ensures connectivity. No concerns.",
        "nightlife": "Spread across neighborhoods—Hollywood clubs, Silver Lake hipster bars, Santa Monica beach vibes. Need a car to hop between scenes.",
        "nature": "Beaches, mountains, desert—all within two hours. Griffith Park hiking. Malibu coastline. Outdoor paradise.",
        "safety": "Neighborhood dependent—research carefully. Homeless crisis visible. Car break-ins common. Awareness essential.",
        "food": "Taco trucks, Korean BBQ, and farm-to-table everything. Mexican food is America's best. Food truck culture thriving.",
        "community": "Entertainment industry dominates. Tech growing. Creative community massive. Networking culture intense.",
        "english": "American English with heavy Spanish influence. Diverse immigrant communities. No language barrier.",
        "visa": "US visa complexity. ESTA for tourism. Working requires sponsorship. California dreaming requires legal status.",
        "culture": "Hollywood mythology, entertainment industry, and California lifestyle. Museums excellent. Beach culture defines identity.",
        "cleanliness": "Varies dramatically. Venice boardwalk challenging. Wealthy areas pristine. Homelessness visible.",
        "airquality": "Smog improved but fire season creates hazardous conditions. Valley worse than coast. Check AQI during fires."
    },
    "luangprabang": {
        "climate": "Tropical Mekong—hot season brutal (Mar-May), rainy season lush (Jun-Oct), cool season perfect (Nov-Feb). Pack for variation.",
        "cost": "Budget paradise at $1000/month. Laos is cheap. UNESCO status doesn't inflate prices much.",
        "wifi": "Laotian infrastructure challenging—10-30 Mbps if lucky. Some cafés better than others. Manage expectations.",
        "nightlife": "11pm curfew enforced. Bowling alley is late-night option. Morning alms ceremony is the main event. Come for peace, not parties.",
        "nature": "Kuang Si waterfalls, Mekong River life, and surrounding jungle. Pak Ou caves. Nature is the attraction. Beautiful.",
        "safety": "Very safe Laotian town. Friendly, peaceful atmosphere. Walking comfortable anytime. Buddhist calm pervades.",
        "food": "Laotian cuisine—laap, sticky rice, and French colonial baguettes. Morning market local. Riverside dining atmospheric.",
        "community": "Very small. Backpackers pass through. Few long-term nomads. Infrastructure minimal. Adventure seekers only.",
        "english": "Limited—tourism provides basics. Lao helpful. French colonial legacy means some French speakers.",
        "visa": "30-day visa on arrival for most. Extensions in Vientiane. Laos is welcoming but visa runs may be needed.",
        "culture": "UNESCO-preserved French colonial meets Buddhist tradition. Morning alms giving, temple explorations, and riverside tranquility. Timeless.",
        "cleanliness": "Tourist areas maintained. Laotian standards—simple but clean. Heritage preservation careful.",
        "airquality": "Generally good. Burning season can affect. Small town, limited traffic. Fresh Mekong air."
    },
    "luxor": {
        "climate": "Nile desert—extremely hot summers (40°C+), perfect winters (20-25°C). Visit October-April. Summer is brutal.",
        "cost": "Very cheap at $900/month. Egypt's tourism economy plus weak currency. Budget stretches far.",
        "wifi": "Egyptian infrastructure—15-30 Mbps if working. Outages happen. Mobile data backup essential. Patience required.",
        "nightlife": "Very quiet—conservative Egyptian town. Hotel bars, river cruise entertainment. Not a nightlife destination.",
        "nature": "Nile River life, desert surroundings, and agricultural valley. Hot air balloon rides. Ancient monuments are the nature.",
        "safety": "Tourist police everywhere. Sites heavily guarded. Hassle from vendors is constant. Scams target tourists. Vigilance needed.",
        "food": "Egyptian staples—koshari, ful, and Nile fish. Tourist restaurants exist. Authentic food is cheap and good.",
        "community": "Virtually none. Tourists and Egyptologists. Very few long-term visitors. Arabic essential for any depth.",
        "english": "Tourist trade English works. Beyond that, Arabic essential. Guide English varies quality.",
        "visa": "30-day visa on arrival. Extensions bureaucratic. Egypt generally welcoming to tourists.",
        "culture": "Valley of the Kings, Karnak Temple, and Theban Necropolis. Ancient Egypt's greatest hits. World's largest open-air museum. Overwhelming.",
        "cleanliness": "Egyptian developing-world reality. Dust is constant. Tourist sites maintained. Town shows wear.",
        "airquality": "Desert dust, some pollution. Hot and dry. Not a health concern generally but dusty."
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
    print("Updating category descriptions for batch 9 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH9_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH9_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Update category descriptions for batch 4 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH4_DESCRIPTIONS = {
    "helsinki": {
        "climate": "Nordic extremes—summer midnight sun is magical (15-25°C), winter darkness is challenging (-10°C average). Seasonal affective disorder is real; light therapy helps.",
        "cost": "Expensive Scandinavian at €3400/month. High quality comes at Nordic prices. Efficient public services offset some costs.",
        "wifi": "Finnish infrastructure excellence—100+ Mbps standard. Tech-forward nation with reliable connectivity everywhere. Libraries and cafés are work-friendly.",
        "nightlife": "Finnish reserve melts after drinks. Design bars, summer terraces, and sauna culture. Not wild like Berlin, but genuinely interesting. Winter darkness creates cozy vibes.",
        "nature": "Baltic coastline, forested islands, and Nordic wilderness accessible. Nuuksio National Park nearby. Four-season outdoor activities—skiing to berry picking.",
        "safety": "Exceptionally safe—one of world's most secure cities. Trust levels extraordinary. Walk anywhere at any hour. Relaxed and orderly.",
        "food": "Nordic cuisine renaissance—local sourcing, innovative restaurants, and herring traditions. Coffee culture is serious. Quality over quantity approach.",
        "community": "Tech and startup scene thriving. Slush conference draws global entrepreneurs. English-speaking expats exist but Finnish social circles take time to enter.",
        "english": "Excellent English proficiency—Finns learn from childhood. Business, tech, and daily life function in English. One of the easiest non-English countries.",
        "visa": "90-day Schengen standard. Finnish startup visa for entrepreneurs. Work permit requires employer sponsorship. Nordic bureaucracy is efficient.",
        "culture": "Design obsession—Marimekko, Aalto, and functional aesthetics. Sauna is sacred. Sibelius music, literature, and understated Nordic identity.",
        "cleanliness": "Scandinavian spotless—clean air, tidy streets, efficient waste management. High civic standards throughout. This is organizational excellence.",
        "airquality": "Excellent—limited industry, Baltic location, environmental consciousness. Among Europe's cleanest cities for breathing."
    },
    "hiroshima": {
        "climate": "Humid subtropical with hot summers and mild winters. Cherry blossom season (April) is ideal. Comfortable outside July-August heat.",
        "cost": "Reasonable Japanese at ¥300,000/month ($2200). Cheaper than Tokyo. Provincial prices with good infrastructure.",
        "wifi": "Japanese excellence—high-speed fiber standard. Cafés and public spaces connected. Pocket WiFi rentals available. No connectivity concerns.",
        "nightlife": "Local izakaya culture rather than big city clubs. Friendly, welcoming, and intimate. Drink with locals, learn stories. Quieter than Tokyo or Osaka.",
        "nature": "Miyajima Island's floating torii gate, Seto Inland Sea beauty, and mountain hiking. Excellent day trip options. Scenic rather than dramatic.",
        "safety": "Exceptionally safe Japanese city. Crime virtually nonexistent. Walk anywhere at any hour. Leave belongings without worry.",
        "food": "Okonomiyaki (Hiroshima style) is mandatory—layered rather than mixed. Oysters from Miyajima. Japanese culinary excellence at regional prices.",
        "community": "Very small international presence. Peace-related institutions bring some foreigners. Japanese language essential for integration. Pioneer territory.",
        "english": "Limited—this is provincial Japan. Tourist sites have English; daily life requires Japanese. Learning is essential for any extended stay.",
        "visa": "90 days visa-free for most nationalities. Working requires sponsorship. Japan digital nomad developments ongoing.",
        "culture": "Peace Memorial and Atomic Bomb Dome deliver powerful history lessons. City rose from ashes—resilience and hope define identity. Deeply moving.",
        "cleanliness": "Japanese cleanliness standards—immaculate streets, spotless public transport, orderly everything. Exemplary urban management.",
        "airquality": "Excellent—coastal location, limited heavy industry, Japanese environmental standards. Healthy breathing throughout."
    },
    "hochiminhcity": {
        "climate": "Tropical year-round heat (25-35°C) with distinct wet and dry seasons. Humidity is constant. AC is essential. Dry season (Nov-Apr) is more comfortable.",
        "cost": "Excellent value at $1800/month. Live like royalty on Western salary. Street food for $1, massage for $10. Budget nomad favorite.",
        "wifi": "Vietnamese internet has improved dramatically—50-100 Mbps in most places. Cafés designed for remote workers. Mobile data reliable as backup.",
        "nightlife": "Chaotic and fun. Rooftop bars, Bui Vien backpacker street, and District 2 sophistication. Bia hoi (fresh beer) culture. The energy never stops.",
        "nature": "Urban jungle—limited nature access. Cu Chi Tunnels for history. Mekong Delta day trips. Beach requires travel to Mui Ne or Phu Quoc.",
        "safety": "Generally safe but bag snatching from motorbikes is real. Traffic is the true danger—crossing streets is sport. Don't flash valuables.",
        "food": "Phở for breakfast, bánh mì for lunch, and coffee that'll rewire your nervous system. Vietnamese cuisine is extraordinary and dirt cheap.",
        "community": "Massive nomad community, especially in District 2 (Thao Dien). Coworking spaces everywhere. Meetups daily. Established expat infrastructure.",
        "english": "Tourist areas and young Vietnamese speak decent English. Business community accommodates. Beyond expat bubbles, Vietnamese helps enormously.",
        "visa": "E-visa available for 90 days. Extensions and renewals possible. Vietnam visa situation evolving—check current rules. Generally flexible.",
        "culture": "War history visible, French colonial architecture, and Vietnamese Communist iconography. Chaotic yet organized. The hustle is inspiring.",
        "cleanliness": "Developing country reality—garbage visible, pollution present, and construction ongoing. Improving but not sanitized. Character over cleanliness.",
        "airquality": "Motorbike emissions and construction affect levels. Masks helpful on bad days. Not Hanoi-level bad but noticeable. Part of the experience."
    },
    "hoian": {
        "climate": "Tropical with distinct seasons—September-October brings flooding. Dry season (Feb-July) is ideal. Hot and humid year-round.",
        "cost": "Budget paradise at $1300/month. Tailored suits for $50, amazing meals for $3. One of Asia's best value destinations.",
        "wifi": "Vietnamese internet improving—30-60 Mbps in good areas. Old town buildings can challenge signals. Coworking spaces emerging.",
        "nightlife": "Lantern-lit charm over clubs. Riverside bars, rooftop cocktails, and peaceful evening walks. Not a party town—romantic atmosphere dominates.",
        "nature": "An Bang Beach for swimming, Marble Mountains for hiking, and rice paddies for cycling. Excellent nature access despite small size.",
        "safety": "Extremely safe—tourist-friendly UNESCO town. Virtually no crime concerns. Walk anywhere at night. Welcoming atmosphere.",
        "food": "Cao lầu noodles, white rose dumplings, and bánh mì perfection. Hoi An's culinary scene punches above its weight. Cooking classes popular.",
        "community": "Growing nomad presence. Small-town feel means you'll know everyone quickly. Expat community is friendly and accessible.",
        "english": "Tourist town English works. Beyond tourist zone, Vietnamese essential. Younger service workers communicate well.",
        "visa": "Vietnamese e-visa for 90 days. Extensions possible. Rules evolving—check current regulations. Generally accommodating.",
        "culture": "UNESCO Ancient Town—Japanese bridge, Chinese temples, and merchant houses preserved. Living history without museum sterility. Lantern festivals magical.",
        "cleanliness": "Tourist town maintenance. Flooding season challenges everything. Generally well-kept historic core. Beach areas vary.",
        "airquality": "Good—small town, limited traffic, coastal breezes. Burning season can affect. Generally healthy environment."
    },
    "hongkong": {
        "climate": "Humid subtropical extremes—hot steamy summers (30-35°C), mild winters. Typhoon season (Jun-Oct) disrupts. AC is survival equipment.",
        "cost": "Among world's most expensive—$4500+/month for modest living. Property costs are astronomical. Everything else is manageable.",
        "wifi": "World-class infrastructure—200+ Mbps standard. Cafés, MTR, and public spaces connected. Asia's tech hub delivers.",
        "nightlife": "Lan Kwai Fong rooftop bars to underground clubs. Sophisticated and expensive. International finance crowd sets the tone. Dim sum at 3am.",
        "nature": "Surprising nature—70% is country parks. Hiking trails, beaches, and islands accessible. Dragon's Back ridge walk is world-class urban hiking.",
        "safety": "Extremely safe despite density. Low crime, efficient policing. Walk anywhere at any hour. Leave bags in cafés without worry.",
        "food": "Dim sum perfection, roast goose, wonton noodles, and every cuisine on earth. Michelin stars and dai pai dong (street stalls) coexist. Paradise.",
        "community": "Massive international business community. Networking events constant. Expat circles established. English-speaking bubble possible.",
        "english": "Excellent—colonial legacy means English is official. Business, signs, and services all accommodate. Cantonese for local connection.",
        "visa": "90 days visa-free for most. Working requires sponsorship. Investment visa possible. Regulatory environment professional.",
        "culture": "East-West fusion at its purest. Colonial architecture, temples, and futuristic skyline. Cinema heritage, martial arts, and trading tradition.",
        "cleanliness": "Mixed—public spaces immaculate, some areas show wear. Dense urban reality. High standards despite challenges.",
        "airquality": "Challenging—regional pollution and local emissions affect levels. Air quality warnings common. Better in cooler months."
    },
    "hue": {
        "climate": "Tropical monsoon with heavy rains (Sep-Jan) and hot summers. Flooding affects the city annually. Dry season (Mar-Aug) is best.",
        "cost": "Exceptionally cheap at $1000/month. One of Vietnam's most affordable cities. Imperial living for backpacker prices.",
        "wifi": "Provincial Vietnamese internet—30-50 Mbps in good areas. Old town can be patchy. Mobile data provides backup.",
        "nightlife": "Very quiet—this is imperial heritage, not party destination. Riverside cafés, cultural shows, and early nights. Come for history, not nightlife.",
        "nature": "Perfume River, Thien Mu Pagoda, and Bach Ma National Park. Royal tombs in forested hills. Atmospheric rather than dramatic.",
        "safety": "Very safe Vietnamese city. Friendly, welcoming atmosphere. Tourist-oriented and secure. Standard awareness applies.",
        "food": "Royal Hue cuisine is distinct—bun bo Hue (spicy noodles), banh beo (rice cakes), and imperial banquets. Refined and delicious.",
        "community": "Minimal nomad presence. Vietnamese language essential. Some expat teachers exist. Pioneer territory for remote workers.",
        "english": "Limited—tourist services in English, daily life in Vietnamese. Younger generation improving. Learning essential for integration.",
        "visa": "Vietnamese e-visa for 90 days. Same rules as other Vietnamese cities. Generally accommodating.",
        "culture": "Imperial citadel—Forbidden Purple City, royal tombs, and Vietnam's last dynasty. UNESCO heritage in atmospheric decay. Hauntingly beautiful.",
        "cleanliness": "Provincial Vietnamese standards. Some areas well-maintained; others show wear. Flooding creates challenges. Character-rich.",
        "airquality": "Good—small city, limited industry, river location. Better than major Vietnamese cities. Generally healthy."
    },
    "istanbul": {
        "climate": "Mediterranean-influenced with hot summers (30°C+), cold wet winters. Spring and fall ideal. Bosphorus breezes moderate extremes.",
        "cost": "Value-packed at $2200/month with favorable lira exchange. Live well on Western salary. Quality varies by neighborhood.",
        "wifi": "Turkish infrastructure solid—50-100 Mbps in good areas. Cafés designed for working. Mobile data reliable. Occasional throttling.",
        "nightlife": "Legendary scene—rooftop bars overlooking mosques, Beyoğlu clubs, and Bosphorus boat parties. Conservative areas quieter. The city never sleeps.",
        "nature": "Limited urban nature. Princes' Islands for escape, Black Sea for beaches. Not a nature destination but Bosphorus views compensate.",
        "safety": "Generally safe but political situation adds complexity. Tourist areas fine. Some neighborhoods require awareness. Terror threats have occurred.",
        "food": "Kebabs are just the beginning—mezes, fish sandwiches, and regional Turkish cuisines collide. Street food legendary. Breakfast spreads epic.",
        "community": "Growing nomad scene. Affordable living attracts remote workers. Coworking spaces emerging. Mix of Turkish and international creatives.",
        "english": "Tourist areas function in English. Beyond that, Turkish helps significantly. Younger Turks in big cities speak English.",
        "visa": "E-visa for most nationalities—easy process. 90 days in 180. Long-term requires residence permit application. Bureaucracy takes patience.",
        "culture": "Where continents and empires collided—Byzantine, Ottoman, and modern Turkey. Hagia Sophia, Grand Bazaar, and call to prayer soundtrack. Overwhelming richness.",
        "cleanliness": "Mixed—new metro is spotless, some areas less so. Improving infrastructure. Turkish tea culture is civilized.",
        "airquality": "Traffic and industry affect levels. Bosphorus location helps. Summer better than winter. Room for improvement."
    },
    "kanazawa": {
        "climate": "Japan Sea weather—snowy winters, humid summers. Rainy and overcast frequently. Comfortable spring and fall. Pack for all conditions.",
        "cost": "Moderate Japanese at ¥280,000/month ($2000). Provincial prices with high standards. Good value for Japan.",
        "wifi": "Japanese excellence—high-speed standard. Cafés, hotels, and public spaces connected. No concerns for remote work.",
        "nightlife": "Traditional and intimate—geisha districts, sake bars, and quiet evenings. Not a party city. Cultural experiences over clubs.",
        "nature": "Sea of Japan coast, Hakusan National Park nearby. Mountain and coastal access. Four-season outdoor opportunities.",
        "safety": "Japanese safety standards—exceptionally secure. Walk anywhere without concern. Leave belongings without worry.",
        "food": "Fresh Japan Sea seafood—sushi rivals Tokyo at half the price. Kaiseki ryori (multi-course traditional). Gold leaf ice cream is Instagram famous.",
        "community": "Very small international presence. Japanese language essential. Art and craft students exist. Deep immersion territory.",
        "english": "Limited—provincial Japan reality. Tourist sites have some English. Daily life requires Japanese commitment.",
        "visa": "Japanese 90-day visa-free for most. Working requires sponsorship. Small city unlikely to support long-term without specific reasons.",
        "culture": "Preserved Edo-era districts—samurai and geisha quarters survived. Kenrokuen garden is Japan's finest. Craft traditions (gold leaf, pottery) alive.",
        "cleanliness": "Japanese immaculate standards. Historic districts pristine. Everything organized and maintained. Exemplary.",
        "airquality": "Excellent—coastal location, limited industry. Sea breezes keep air fresh. Among Japan's cleanest cities."
    },
    "kathmandu": {
        "climate": "Himalayan subtropical—pleasant dry season (Oct-May), monsoon rains June-September. Altitude moderates heat. Air quality varies seasonally.",
        "cost": "Extremely affordable at $1100/month. Budget travelers' paradise. Quality varies dramatically—cheap doesn't mean comfortable.",
        "wifi": "Challenging—Nepal's infrastructure lags. 10-30 Mbps in good conditions. Power cuts affect connectivity. Coworking spaces more reliable.",
        "nightlife": "Thamel tourist zone has bars and clubs. Buddhist majority means moderate atmosphere. Trekker energy. Not a party destination.",
        "nature": "Gateway to Himalayas—Everest, Annapurna, and countless treks. World-class mountain access. Nature is the point.",
        "safety": "Generally safe but infrastructure concerns. Traffic is chaotic, pollution high, and petty crime occurs. Medical care limited.",
        "food": "Nepali momos (dumplings), dal bhat (lentils and rice), and Tibetan influences. Tourist zone has international options. Authentic is better.",
        "community": "Trekking and yoga community established. Nomads exist but infrastructure challenges limit appeal. Spiritual seekers and adventurers.",
        "english": "Tourist areas function in English. Trekking guides speak English. Beyond tourist bubble, Nepali essential.",
        "visa": "Visa on arrival for most—15/30/90 day options. Extensions available. Nepal is generally welcoming. Straightforward process.",
        "culture": "Hindu-Buddhist fusion at its richest. Temple squares, living goddesses (Kumari), and Tibetan refugee communities. Spiritual and overwhelming.",
        "cleanliness": "Developing country challenges. Dust, garbage, and infrastructure strain visible. Not a clean destination. Authentic over sanitized.",
        "airquality": "Among world's worst cities. Dust, vehicle emissions, and brick kilns create hazardous conditions seasonally. Masks essential."
    },
    "kotor": {
        "climate": "Mediterranean with dramatic rainfall—wettest settlement in Europe by some measures. Hot dry summers, mild wet winters. Beautiful but bring rain gear.",
        "cost": "Reasonable at €2000/month. Tourism raising prices but still value compared to Croatia. Off-season deals exist.",
        "wifi": "Montenegrin infrastructure developing—30-60 Mbps typical. Old town stone walls challenge signals. Improving gradually.",
        "nightlife": "Small-town Mediterranean—waterfront bars, summer beach parties. Cruise ship influx adds energy. Not a nightlife destination.",
        "nature": "Spectacular—fjord-like bay, mountain fortress walks, and Durmitor National Park accessible. Some of Europe's most dramatic landscapes.",
        "safety": "Very safe—low crime, tourist-friendly. Cruise ships bring daytime crowds. Walkable and secure throughout.",
        "food": "Adriatic seafood, Montenegrin mountain cuisine. Black risotto, fresh fish, and local wines. Quality without pretension.",
        "community": "Small but growing nomad presence. Summer brings seasonal workers. Year-round community is tiny. Building connections takes effort.",
        "english": "Good in tourism industry. Young Montenegrins speak English. Daily life manageable without local language.",
        "visa": "Visa-free for most nationalities (up to 90 days). Montenegro not EU but Schengen rules don't apply. Generally relaxed.",
        "culture": "Venetian-influenced medieval town—fortified walls, church bells, and maritime heritage. UNESCO-listed bay. Game of Thrones vibes.",
        "cleanliness": "Well-maintained for tourism. Cruise ship crowds create challenges. Generally pleasant. Stone streets are swept.",
        "airquality": "Excellent—bay location, mountain backdrop, limited traffic. Clean Mediterranean air. Healthy environment."
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
    print("Updating category descriptions for batch 4 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH4_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH4_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

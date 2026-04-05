#!/usr/bin/env python3
"""
Update category descriptions for batch 11 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH11_DESCRIPTIONS = {
    "oaxaca": {
        "climate": "Highland Mexican perfection—eternal spring at 1550m. Warm days (25°C), cool nights. Dry season (Oct-May) ideal. Rainy afternoons June-September.",
        "cost": "Excellent value at $1500/month. Mezcal is cheap, markets cheaper. One of Mexico's best deals for quality of life.",
        "wifi": "Mexican provincial internet—30-60 Mbps typical. Historic center can challenge signals. Coworking spaces more reliable.",
        "nightlife": "Mezcal culture—rooftop bars, live music, and artisan cocktails. Guelaguetza festival season electric. Sophisticated rather than wild.",
        "nature": "Hierve el Agua petrified waterfalls, Sierra Norte ecotourism, and coastal beaches 6 hours away. Excellent outdoor access.",
        "safety": "Generally safe Mexican city. Tourist-friendly atmosphere. Standard awareness. Teacher protests occasionally disrupt but not dangerous.",
        "food": "UNESCO-recognized cuisine—mole negro, tlayudas, chapulines (grasshoppers), and mezcal. Food is the destination. Extraordinary.",
        "community": "Growing nomad scene. Artists, mezcal enthusiasts, and cultural seekers. Spanish essential for depth. Welcoming atmosphere.",
        "english": "Limited—Oaxaca is deeply Mexican. Tourist services have English. Daily life benefits significantly from Spanish.",
        "visa": "180 days visa-free. Mexico welcomes remote workers informally. Oaxaca attracts cultural tourists, not just beach seekers.",
        "culture": "Indigenous Zapotec heritage, Day of the Dead celebrations, and textile traditions. Monte Albán ruins. Living traditions not museum pieces.",
        "cleanliness": "Colonial center well-maintained. Some areas rougher. Mexican character over sterile. Pleasant overall.",
        "airquality": "Excellent—highland location, limited industry. Clean Oaxacan valley air. Among Mexico's healthiest."
    },
    "ohrid": {
        "climate": "Macedonian lake continental—warm summers (28°C), cold winters with snow. Lake moderates extremes. Pleasant May-September.",
        "cost": "Budget paradise at €1000/month. North Macedonia is Europe's best-kept secret for value. Extraordinarily cheap.",
        "wifi": "Macedonian infrastructure—30-50 Mbps typical. Improving but not Western European standard. Mobile data backup helpful.",
        "nightlife": "Small town charm—lakeside bars, summer beach clubs, and quiet evenings. Not a party destination. Come for peace.",
        "nature": "UNESCO lake—one of Europe's oldest and clearest. Swimming, kayaking, and surrounding mountains. Outstanding natural beauty.",
        "safety": "Very safe Macedonian town. Friendly, welcoming atmosphere. Walk anywhere comfortably. Relaxed and peaceful.",
        "food": "Macedonian cuisine—grilled meats, fresh lake trout, and burek. Simple, hearty, and extremely affordable. Rakija flows freely.",
        "community": "Very small international presence. Some tourists, fewer long-term visitors. Pioneer territory. Macedonian helpful.",
        "english": "Limited—younger generation better. Tourism provides basics. Daily life benefits from Macedonian/Serbian basics.",
        "visa": "90 days visa-free for most. North Macedonia not EU but welcoming. Simple tourist process.",
        "culture": "365 churches (one for each day), Byzantine heritage, and Slavic traditions. UNESCO protected lake and town. Ancient Christian site.",
        "cleanliness": "Tourist areas maintained. Small-town Balkan character. Lake beaches cared for. Pleasant overall.",
        "airquality": "Excellent—lake location, mountain surroundings, limited industry. Among Europe's cleanest air."
    },
    "osaka": {
        "climate": "Japanese humid subtropical—hot humid summers (35°C), mild winters. Cherry blossoms April, autumn colors November. Typhoon season August-September.",
        "cost": "Moderate Japanese at ¥300,000/month ($2200). Cheaper than Tokyo. Street food culture keeps dining affordable.",
        "wifi": "Japanese excellence—high-speed everywhere. Pocket WiFi widely available. Among world's best connectivity.",
        "nightlife": "Dotonbori neon, izakaya crawls, and Namba chaos. More fun than Tokyo—Osakans know how to party. Genuine energy.",
        "nature": "Urban density but Osaka Castle park, Nara deer nearby, and Koya-san accessible. Nature requires day trips.",
        "safety": "Japanese safety standards—exceptionally secure. Walk anywhere, leave belongings. Bicycle registration is serious.",
        "food": "Japan's kitchen—takoyaki (octopus balls), okonomiyaki (savory pancakes), and kitsune udon. Street food paradise. Food is religion here.",
        "community": "English teaching community established. Some tech professionals. Japanese helps enormously. Less international than Tokyo.",
        "english": "Better than most Japanese cities but limited. Tourism provides basics. Japanese essential for daily life.",
        "visa": "90 days visa-free for most. Working requires sponsorship. Japan's working holiday for eligible nationalities.",
        "culture": "Bunraku puppetry, comedy (manzai) capital, and merchant heritage. Less formal than Tokyo. Osakans are known for friendliness and humor.",
        "cleanliness": "Japanese immaculate standards. Some areas livelier than pristine. Clean by any global measure.",
        "airquality": "Acceptable—large city pollution but Japanese standards help. Better than other Asian megacities."
    },
    "oslo": {
        "climate": "Scandinavian—cold snowy winters (-7°C), mild summers (22°C). Dark winter months, midnight sun in summer. Four distinct seasons.",
        "cost": "World's most expensive at NOK 35,000/month ($3500). Everything costs double. Norway's oil wealth reflected in prices.",
        "wifi": "Norwegian excellence—fiber standard, fast and reliable. Among world's best digital infrastructure.",
        "nightlife": "Expensive but sophisticated—craft cocktails, waterfront bars, and club scene. Pre-gaming at home common. Quality over quantity.",
        "nature": "Fjords, forests, and skiing from doorstep. Oslofjord islands, Nordmarka forest for hiking. Nature is the attraction.",
        "safety": "Extremely safe Scandinavian capital. Walk anywhere anytime. Norwegian trust society. Minimal concerns.",
        "food": "New Nordic cuisine, seafood excellence, and high-quality everything. Expensive but worth it. Brunost (brown cheese) is acquired taste.",
        "community": "International professionals, especially oil industry. English-speaking community established. High-income expats.",
        "english": "Excellent—Norwegians speak perfect English. Necessary given Norwegian difficulty. International business language.",
        "visa": "90-day Schengen standard. Norway not EU but aligned. Work permits require sponsorship. Skilled worker route exists.",
        "culture": "Viking history, Munch Museum, and contemporary architecture. Opera house on water. Nature meets design. Clean aesthetic.",
        "cleanliness": "Scandinavian pristine. Everything well-maintained. Pride in public spaces. Exemplary standards.",
        "airquality": "Excellent—fjord breezes, environmental consciousness. Among Europe's cleanest capitals."
    },
    "ottawa": {
        "climate": "Canadian extremes—brutal winters (-20°C common), pleasant summers. Rideau Canal freezes into ice skating highway. Four dramatic seasons.",
        "cost": "Moderate Canadian at CAD $2800/month. Cheaper than Toronto or Vancouver. Government town stability.",
        "wifi": "Canadian infrastructure—100+ Mbps standard. Federal capital ensures connectivity. No concerns.",
        "nightlife": "Government town quiet—Byward Market offers bars and restaurants. Not a party city. Hull (Quebec side) for more action.",
        "nature": "Gatineau Park accessible, Rideau Canal, and river access. Parliament Hill grounds. Pleasant urban nature.",
        "safety": "Very safe Canadian capital. Walk anywhere comfortably. Government town order. Friendly atmosphere.",
        "food": "BeaverTails pastry tradition, poutine, and multicultural options. Less food scene than Montreal or Toronto. Government town dining.",
        "community": "Government workers, diplomats, and tech (Shopify). International embassy community. Bilingual environment.",
        "english": "Bilingual city—English dominant but French significant. Both work fine. Federal government bilingualism.",
        "visa": "Canadian visa complexity. Working Holiday for eligible nationalities. Government town means proper documentation.",
        "culture": "Parliament Hill, National Gallery, and bilingual heritage. Tulip Festival. Government buildings meet natural beauty.",
        "cleanliness": "Canadian capital standards—well-maintained. Government pride in presentation. Snow management efficient.",
        "airquality": "Excellent—low density, river location, Canadian environmental standards. Clean capital air."
    },
    "oxford": {
        "climate": "English mild—cool and damp year-round. Rain frequent. Pleasant summers (20°C), cold winters. Pack layers always.",
        "cost": "Expensive UK at £3000/month. University town premium. Student accommodation alternatives exist.",
        "wifi": "British infrastructure—fiber widespread. University and research ensure connectivity. Excellent throughout.",
        "nightlife": "Student pubs, formal college dinners, and academic tradition. Not clubbing destination. Pub culture is genuine.",
        "nature": "Cotswolds accessible, river punting, and college gardens. English countryside beautiful. Christ Church Meadow for walks.",
        "safety": "Very safe English university town. Walk anywhere at any hour. Bicycle theft the main concern. Relaxed atmosphere.",
        "food": "Pub classics, college formal dining, and international options from students. Covered Market for local produce. Traditional English.",
        "community": "Academic and research community global. Students from everywhere. Short-term visitors common. Networking through colleges.",
        "english": "Obviously native English—but with academic vocabulary. Global scholars bring linguistic diversity.",
        "visa": "UK visa post-Brexit complexity. Student visas well-established. Working requires skilled worker route.",
        "culture": "38 colleges, medieval spires, and academic tradition since 1096. Harry Potter filming locations. Intellectual heritage.",
        "cleanliness": "Well-maintained university pride. Historic colleges immaculate. Pleasant English town standards.",
        "airquality": "Good—small city, limited industry. English standards apply. Healthy environment."
    },
    "palermo": {
        "climate": "Sicilian Mediterranean—hot dry summers (35°C+), mild winters. North African influences. Beach season long. Nearly year-round warmth.",
        "cost": "Affordable Italian at €1800/month. Sicily is value. Southern Italian prices without tourist markup.",
        "wifi": "Southern Italian infrastructure—30-50 Mbps typical. Can be unreliable. Patience required. Improving slowly.",
        "nightlife": "Sicilian energy—street life, aperitivo culture, and late-night passeggiata. Kalsa neighborhood bars. Genuine Italian socializing.",
        "nature": "Mondello beach, mountains behind city, and Tyrrhenian coast. Day trips to Cefalù. Mediterranean beauty accessible.",
        "safety": "Reputation worse than reality but awareness needed. Mafia is historic, not tourist concern. Petty theft exists. Research neighborhoods.",
        "food": "Street food paradise—arancini, panelle, sfincione, and cannoli. Arab-Norman cuisine fusion. Cheap, delicious, and unique. Food capital.",
        "community": "Small expat presence. Cultural tourists and Italian learners. Few nomads—pioneer territory. Italian essential.",
        "english": "Very limited. Italian necessary for everything. Southern Italian reality. Learning essential.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Sicilian bureaucracy tests patience.",
        "culture": "Arab-Norman architecture (UNESCO), Baroque churches, and ancient markets. Capuchin Catacombs. History layers extraordinary.",
        "cleanliness": "Improving but gritty. Some areas rough. Sicilian character over sterility. Markets are chaotic.",
        "airquality": "Traffic affects levels. Coastal location helps. Generally acceptable Mediterranean air."
    },
    "paphos": {
        "climate": "Cypriot Mediterranean—hot dry summers (35°C), mild winters. 320 days of sunshine. Beach season March-November. Near-perfect.",
        "cost": "Moderate at €2200/month. Cyprus is reasonable. British expat infrastructure provides options.",
        "wifi": "Cypriot infrastructure—50-80 Mbps typical. Improving rapidly. No major concerns for remote work.",
        "nightlife": "Resort-oriented—bar street, beach clubs, and tourist entertainment. Not sophisticated but sufficient. Ayia Napa for serious partying.",
        "nature": "Akamas Peninsula wilderness, sea caves, and turtle beaches. Troodos mountains accessible. Mediterranean beauty.",
        "safety": "Very safe Cypriot resort. Tourist-friendly, relaxed atmosphere. Walk anywhere comfortably. Mediterranean peace.",
        "food": "Cypriot meze tradition—halloumi, souvlaki, and multiple small dishes. Greek and Middle Eastern influences. Generous portions.",
        "community": "Large British expat community. Retirees and remote workers. English-speaking environment. Easy integration.",
        "english": "Excellent—British colonial legacy plus tourism. English works for everything. Greek helpful but not essential.",
        "visa": "Cyprus not Schengen. 90 days tourist. Digital nomad visa available. British legacy simplifies processes.",
        "culture": "Birthplace of Aphrodite mythology, Roman mosaics (UNESCO), and ancient tombs. Archaeological sites throughout. Greek Orthodox traditions.",
        "cleanliness": "Tourist areas well-maintained. Resort standards apply. Pleasant throughout.",
        "airquality": "Excellent—island location, Mediterranean breezes. Clean Cypriot air. Among Europe's best."
    },
    "paris": {
        "climate": "Northern French temperate—cool and grey much of year. Mild summers (25°C), cold winters. Rain possible anytime. Spring and fall ideal.",
        "cost": "Expensive global at €4000+/month. Central arrondissements astronomical. Outer areas cheaper. Quality costs.",
        "wifi": "French fiber excellent—100+ Mbps standard. Cafés and coworking accommodate. World-class connectivity.",
        "nightlife": "Everything—Marais bars, club scenes, wine caves, and cultural events. Late-night philosophy debates. The world's cultural capital.",
        "nature": "Luxembourg Gardens, Bois de Boulogne, and Seine riverside. Fontainebleau forest accessible. Urban green space elegant.",
        "safety": "Major city awareness needed. Pickpockets in tourist zones. Some areas rough at night. Research arrondissements.",
        "food": "Global culinary capital—patisseries, bistros, and Michelin stars everywhere. Food is serious here. Croissants are religion.",
        "community": "Global creative and business community. Every industry represented. Networking through events and coworking. French helps.",
        "english": "Improving but French expected and appreciated. Tourist services in English. Daily life much better with French.",
        "visa": "90-day Schengen standard. France's digital nomad visa available. French bureaucracy legendary. Patience essential.",
        "culture": "Louvre, Eiffel Tower, and literary tradition. Fashion, art, and intellectual heritage. Every neighborhood has history. The city of light.",
        "cleanliness": "Some areas cleaner than others. Dog waste is real. Metro shows age. Character over sterility.",
        "airquality": "Traffic affects levels. Better than reputation. Improving with environmental policies. Acceptable for major capital."
    },
    "penang": {
        "climate": "Tropical Malaysian—hot and humid year-round (28-32°C). Monsoon affects October-December. Rain possible daily. AC is essential.",
        "cost": "Excellent value at $1500/month. Georgetown affordable. Street food legendary and cheap.",
        "wifi": "Malaysian infrastructure—50-100 Mbps common. Better than most Southeast Asia. Cafés accommodate working.",
        "nightlife": "Georgetown heritage bars, rooftop venues, and local hawker center vibes. Not party destination. Food is the nightlife.",
        "nature": "Penang Hill, national park, and beaches (though not pristine). Langkawi day trips. Island beauty accessible.",
        "safety": "Very safe Malaysian state. Multicultural harmony. Walk anywhere comfortably. Friendly atmosphere throughout.",
        "food": "UNESCO-recognized street food—char kway teow, assam laksa, and nasi kandar. Best street food city in Malaysia. Food pilgrimage.",
        "community": "Growing nomad presence. Georgetown attracts creatives. Malaysian hospitality welcoming. English works well.",
        "english": "Good—Malaysian English (Manglish) works fine. Multilingual society. Tourist services excellent. No language barrier.",
        "visa": "90 days visa-free for most. Malaysia MM2H program for longer stays. Welcoming immigration.",
        "culture": "UNESCO Georgetown—Chinese shophouses, Little India, and colonial heritage. Street art scene. Multicultural harmony visible.",
        "cleanliness": "Heritage zones maintained. Some areas rougher. Tropical humidity challenges. Generally pleasant.",
        "airquality": "Can be affected by Indonesian haze seasonally. Otherwise acceptable. Coastal breezes help."
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
    print("Updating category descriptions for batch 11 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH11_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH11_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

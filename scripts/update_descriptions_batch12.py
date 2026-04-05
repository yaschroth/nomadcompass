#!/usr/bin/env python3
"""
Update category descriptions for batch 12 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH12_DESCRIPTIONS = {
    "plovdiv": {
        "climate": "Bulgarian continental—hot summers (35°C), cold winters. Four distinct seasons. Pleasant spring and fall. Snow in winter.",
        "cost": "Budget paradise at €1200/month. Bulgaria is Europe's cheapest. Extraordinary value for quality.",
        "wifi": "Bulgarian infrastructure improving—50-80 Mbps common. IT sector drives upgrades. Reliable for remote work.",
        "nightlife": "Kapana district transformed—bars, galleries, and creative energy. Student town vibes. Genuine Bulgarian nightlife.",
        "nature": "Rhodope Mountains accessible, Bachkovo Monastery, and thermal springs. Good outdoor access for a city.",
        "safety": "Very safe Bulgarian city. Tourist-friendly atmosphere. Walk anywhere comfortably. Welcoming locals.",
        "food": "Bulgarian cuisine—shopska salad, grilled meats, and banitsa. Cheap and hearty. Rakija is mandatory.",
        "community": "Growing digital nomad scene. Coworking spaces emerging. European Capital of Culture 2019 brought attention.",
        "english": "Improving among youth. Tourist services adequate. Bulgarian appreciated but not essential in expat areas.",
        "visa": "90 days Schengen-adjacent (Bulgaria not yet Schengen member). EU rules apply. Straightforward process.",
        "culture": "Roman amphitheater, Old Town heritage, and Thracian history. 8000 years of continuous habitation. Europe's oldest city claim.",
        "cleanliness": "Old Town well-maintained. Some areas rougher. Bulgarian character. Improving standards.",
        "airquality": "Can be affected in winter from heating. Generally good. Mountain proximity helps."
    },
    "portland": {
        "climate": "Pacific Northwest—grey and drizzly much of year. Mild temperatures (5-25°C). Real summer June-September. Rain defines the culture.",
        "cost": "Moderate American at $3500/month. Cheaper than Seattle or SF. Still expensive for what it offers.",
        "wifi": "American infrastructure—100+ Mbps standard. Tech sector ensures connectivity. Excellent throughout.",
        "nightlife": "Craft beer capital—more breweries than anywhere. Dive bars, strip clubs (legal), and food cart pods. Weird and genuine.",
        "nature": "Columbia Gorge, Mt. Hood skiing, and coast beaches. Outstanding nature access. Pacific Northwest beauty accessible.",
        "safety": "Generally safe but homelessness visible. Downtown challenges exist. Neighborhoods vary. Research before choosing area.",
        "food": "Farm-to-table pioneer, food cart culture, and craft everything. Doughnuts are serious. Coffee is religion.",
        "community": "Creative and tech community. Keep Portland Weird ethos. Progressive values. Networking through events.",
        "english": "American English—Pacific Northwest friendly. Diverse population. No language barrier.",
        "visa": "US visa complexity. ESTA for tourism. Working requires sponsorship. No nomad visa.",
        "culture": "Powell's Books, Nike headquarters, and sustainability focus. Coffee shop culture. Quirky independent spirit.",
        "cleanliness": "Some areas challenging. Homelessness visible downtown. Neighborhoods vary significantly.",
        "airquality": "Generally good but wildfire smoke affects summer/fall. Can be hazardous during fire season."
    },
    "porto": {
        "climate": "Atlantic influenced—mild and wet winters, warm summers. More rain than Lisbon. Pleasant most of year. Ocean moderation.",
        "cost": "Rising but still €2800/month. Cheaper than Lisbon. Digital nomad influx affecting prices. Good value remains.",
        "wifi": "Portuguese fiber excellent—100+ Mbps standard. Cafés accommodate. Reliable connectivity throughout.",
        "nightlife": "Ribeira waterfront, port wine cellars, and Galerias de Paris bar street. Less hectic than Lisbon. Genuine Portuguese vibes.",
        "nature": "Douro Valley wine country, beaches nearby, and Atlantic coast. Excellent day trip options. River and ocean access.",
        "safety": "Very safe Portuguese city. Tourist areas well-patrolled. Walk anywhere comfortably. Friendly atmosphere.",
        "food": "Francesinha sandwich is legendary, port wine mandatory, and fresh seafood. Hearty northern Portuguese cuisine.",
        "community": "Growing nomad scene, smaller than Lisbon but established. Coworking options emerging. Friendly community.",
        "english": "Excellent—young Portuguese speak fluent English. Tourism infrastructure accommodates. No language barrier.",
        "visa": "90-day Schengen. Portugal's D7 or digital nomad visa available. Established pathways for longer stays.",
        "culture": "Ribeira UNESCO site, azulejo tiles everywhere, and port wine heritage. Livraria Lello bookstore. Harry Potter connections.",
        "cleanliness": "Historic center well-maintained. Some graffiti (often artistic). Portuguese character. Pleasant overall.",
        "airquality": "Excellent—Atlantic breezes, coastal location. Clean air year-round. Among Europe's healthiest."
    },
    "prague": {
        "climate": "Central European continental—cold winters (-5°C), warm summers (25°C). Four distinct seasons. Spring and fall ideal.",
        "cost": "Rising at €2800/month. Tourist economy inflates prices. Still cheaper than Western Europe. Good value remains.",
        "wifi": "Czech infrastructure solid—80-100 Mbps standard. IT sector ensures quality. Cafés accommodate working.",
        "nightlife": "Legendary—cheap beer, multi-level clubs, and Old Town chaos. Bachelor parties are common. Genuine scene beyond tourists.",
        "nature": "Bohemian countryside, Karlštejn Castle, and river access. Urban parks extensive. Good day trip options.",
        "safety": "Generally safe but tourist area awareness needed. Pickpockets active. Scams target visitors. Standard precautions.",
        "food": "Czech hearty fare—svíčková, knedlíky dumplings, and trdelník. Beer culture is serious. Meat and carbs dominate.",
        "community": "Large expat community established. Coworking scenes active. English teaching, tech, and creative industries.",
        "english": "Good among younger generation. Tourist infrastructure accommodates. Czech appreciated but English works.",
        "visa": "90-day Schengen standard. Czech Republic Zivno visa for freelancers. Bureaucracy manageable.",
        "culture": "Medieval Old Town, Kafka associations, and astronomical clock. Prague Castle complex. Gothic and Baroque abundance.",
        "cleanliness": "Tourist areas maintained. Some areas rougher. Czech character. Generally pleasant.",
        "airquality": "Acceptable—some winter pollution. City center traffic affects levels. Generally healthy."
    },
    "queretaro": {
        "climate": "Highland Mexican perfection—eternal spring at 1820m. Warm days (25°C), cool nights. Dry season ideal. Near-perfect year-round.",
        "cost": "Good value at $1800/month. Cheaper than Mexico City with similar amenities. Quality of life excellent.",
        "wifi": "Mexican infrastructure—50-80 Mbps in good areas. Growing tech sector drives improvements. Coworking reliable.",
        "nightlife": "Colonial centro bars, wine country nearby, and sophisticated dining. Not party destination. Refined evenings.",
        "nature": "Sierra Gorda biosphere, Peña de Bernal monolith, and wine country. Excellent outdoor access.",
        "safety": "One of Mexico's safest cities. Industrial prosperity, conservative values. Very comfortable. Family-friendly.",
        "food": "Regional cuisine, wine country dining, and growing gastronomy scene. Enchiladas queretanas. Quality over quantity.",
        "community": "Growing expat presence. Aerospace and auto industry brings professionals. Spanish essential but community exists.",
        "english": "Limited—industrial city is Mexican. Business community has English. Daily life needs Spanish.",
        "visa": "180 days visa-free. Mexico welcoming. Querétaro attracts business, not beach tourists.",
        "culture": "UNESCO colonial center, baroque architecture, and independence history. Aqueduct iconic. Sophisticated Mexican city.",
        "cleanliness": "Well-maintained colonial center. Industrial prosperity shows. Among Mexico's cleanest cities.",
        "airquality": "Excellent—highland location, limited pollution. Clean air. Among Mexico's healthiest."
    },
    "quito": {
        "climate": "Eternal spring at 2850m—always 10-21°C. No seasons really. Afternoon rain common. Altitude affects newcomers.",
        "cost": "Affordable at $1600/month. Ecuador uses US dollar, simplifying finances. Good value.",
        "wifi": "Ecuadorian infrastructure—30-60 Mbps typical. Improving but inconsistent. Mobile data backup helpful.",
        "nightlife": "La Mariscal party district, craft beer scenes, and live music. Altitude affects alcohol tolerance. Genuine energy.",
        "nature": "Mitad del Mundo (equator), Cotopaxi volcano, and cloud forest. Galápagos gateway. Extraordinary nature access.",
        "safety": "Requires attention—research neighborhoods. Tourist areas patrolled. Petty crime exists. Don't display wealth.",
        "food": "Ecuadorian highlands—locro de papa soup, hornado pork, and ceviche. Guinea pig is traditional. Unique flavors.",
        "community": "Small expat presence. Language school students. Some nomads. Spanish essential. Welcoming locals.",
        "english": "Limited—this is highland Ecuador. Tourist services have basics. Spanish essential for daily life.",
        "visa": "90 days visa-free. Ecuador welcoming. Extensions straightforward. Dollar economy simplifies finance.",
        "culture": "UNESCO colonial center—first declared World Heritage City. Churches, plazas, and indigenous markets. Living history.",
        "cleanliness": "Historic center maintained. Some areas rougher. Ecuadorian character. Improving standards.",
        "airquality": "Altitude affects breathing initially. Otherwise clean highland air. Limited pollution."
    },
    "ramallah": {
        "climate": "Mediterranean highland—hot dry summers, mild wet winters. Pleasant spring and fall. Similar to Jerusalem.",
        "cost": "Moderate at $2000/month. Palestinian economy. Costs vary with political situation.",
        "wifi": "Palestinian infrastructure—30-50 Mbps typical. Can be affected by circumstances. Mobile data backup essential.",
        "nightlife": "Surprisingly vibrant—bars, cultural events, and café culture. Palestinian creative scene. Resilient social life.",
        "nature": "West Bank hills, olive groves, and historic villages. Access can be complicated. Beautiful landscape.",
        "safety": "Complex—political situation affects daily life. Checkpoints, closures possible. Research current conditions essential.",
        "food": "Palestinian cuisine—musakhan, maqluba, and hummus. Arab hospitality generous. Traditional and delicious.",
        "community": "NGO workers, journalists, and solidarity visitors. Unique international community. Arabic and context essential.",
        "english": "Good among educated population. NGO infrastructure uses English. Arabic deepens understanding.",
        "visa": "Israeli entry required. Complex documentation. Situation-dependent. Research current requirements thoroughly.",
        "culture": "Palestinian cultural capital—museums, theaters, and arts scene. Resilience and creativity. Profound experience.",
        "cleanliness": "Urban Palestinian standards. Some areas maintained well. Context-dependent.",
        "airquality": "Good—highland location. Limited industry. Clean Mediterranean air."
    },
    "rhodes": {
        "climate": "Greek island Mediterranean—hot dry summers (35°C), mild winters. 300 days sunshine. Beach season April-October.",
        "cost": "Moderate at €2200/month. Seasonal pricing—summer premium. Off-season bargains available.",
        "wifi": "Greek island infrastructure—30-60 Mbps typical. Tourist areas better. Not fiber quality but functional.",
        "nightlife": "Faliraki party resort, Old Town bars, and beach clubs. Tourism-oriented. Can find authenticity in Lindos.",
        "nature": "Beaches everywhere, Valley of Butterflies, and ancient ruins integrated with nature. Island beauty accessible.",
        "safety": "Very safe Greek island. Tourist-friendly, welcoming atmosphere. Walk anywhere comfortably. Mediterranean peace.",
        "food": "Greek island cuisine—fresh seafood, meze, and local wine. Tourist restaurants and authentic tavernas coexist.",
        "community": "Small expat presence, mostly seasonal. Tourism workers. Few year-round nomads. Greek helps.",
        "english": "Good in tourist areas. British tourists mean good English infrastructure. Island life benefits from Greek.",
        "visa": "90-day Schengen standard. Greece's digital nomad visa available. Island logistics for bureaucracy.",
        "culture": "Medieval Old Town (UNESCO), Knights of St. John legacy, and ancient Lindos acropolis. Colossus history.",
        "cleanliness": "Tourist areas well-maintained. Beach standards high. Greek island pride. Pleasant throughout.",
        "airquality": "Excellent—island breezes, minimal industry. Clean Aegean air. Among Greece's healthiest."
    },
    "riga": {
        "climate": "Baltic harsh—cold snowy winters (-10°C), mild summers. Dark winter months. Four distinct seasons. Pack warm.",
        "cost": "Good value at €2000/month. Cheaper than Tallinn. Baltic affordability with quality.",
        "wifi": "Baltic excellence—fiber widespread, fast and reliable. Tech sector drives infrastructure. No concerns.",
        "nightlife": "Old Town bars, Art Nouveau district sophistication, and underground clubs. Not Copenhagen expensive. Genuine Baltic fun.",
        "nature": "Baltic beaches (Jūrmala), Gauja National Park, and forest access. Flat but green. Nature is accessible.",
        "safety": "Generally safe Baltic capital. Some areas require awareness at night. Standard precautions. Comfortable overall.",
        "food": "Latvian cuisine—grey peas with bacon, dark rye bread, and Baltic herring. Russian influences. Hearty and warming.",
        "community": "Growing digital nomad scene. Smaller than Tallinn but active. English-speaking environment. Welcoming.",
        "english": "Excellent—Latvians speak good English. Younger generation fluent. Russian also common. No barrier.",
        "visa": "90-day Schengen standard. Latvia part of EU. Startup visa available. Baltic tech ecosystem.",
        "culture": "Art Nouveau architecture (UNESCO), medieval Old Town, and Soviet heritage layers. Christmas market tradition.",
        "cleanliness": "Old Town well-maintained. Baltic pride in presentation. Some areas show age. Generally pleasant.",
        "airquality": "Excellent—Baltic breezes, limited industry. Clean air. Among Europe's healthiest capitals."
    },
    "rome": {
        "climate": "Mediterranean classic—hot summers (35°C), mild winters. Rain mainly fall/winter. Pleasant most of year. Siesta exists for reason.",
        "cost": "Moderate Italian at €3200/month. Centro storico premium. Trastevere and outer neighborhoods cheaper.",
        "wifi": "Italian infrastructure—50-80 Mbps typical. Can be unreliable. Patience required. Coworking spaces more consistent.",
        "nightlife": "Trastevere energy, aperitivo culture, and late-night piazza life. Testaccio clubs. Dolce vita real.",
        "nature": "Urban parks (Villa Borghese), day trips to coast and lakes. Countryside accessible. City focus primarily.",
        "safety": "Tourist area awareness needed. Pickpockets active around monuments. Some neighborhoods rough. Standard precautions.",
        "food": "Carbonara, cacio e pepe, and pizza al taglio. Food is serious religion. No pineapple. No cream in carbonara. Rules matter.",
        "community": "Large expat community. Arts, fashion, and international organizations. Italian helps enormously.",
        "english": "Tourist services in English. Daily life better with Italian. Younger Romans have English. Effort appreciated.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy legendary for difficulty.",
        "culture": "2500 years of history—Colosseum, Vatican, and every era represented. Art and architecture overwhelming. Eternal City earned.",
        "cleanliness": "Notorious garbage challenges. Some areas better than others. Roman character over sterility. Accept it.",
        "airquality": "Traffic affects levels significantly. Historic center pedestrian areas better. Acceptable for major capital."
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
    print("Updating category descriptions for batch 12 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH12_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH12_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

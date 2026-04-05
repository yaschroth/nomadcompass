#!/usr/bin/env python3
"""
Update category descriptions for batch 16 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH16_DESCRIPTIONS = {
    "ubud": {
        "climate": "Tropical highland Bali—cooler than coast (22-30°C). Wet season November-March with dramatic afternoon rain. Green year-round.",
        "cost": "Budget paradise at $1400/month. Bali pricing with highland peace. Yoga retreat economy.",
        "wifi": "Balinese improving—30-60 Mbps in cafés. Coworking spaces reliable. Some villas challenging. Mobile data backup.",
        "nightlife": "Quiet by Bali standards—ecstatic dance, sound healings, and early nights. Not a party destination. Spiritual focus.",
        "nature": "Rice terraces, monkey forest, and jungle waterfalls. Tegallalang iconic. Nature is the attraction. Beautiful.",
        "safety": "Very safe Balinese town. Scooter accidents main risk. Respectful of temples essential. Welcoming atmosphere.",
        "food": "Health food capital—smoothie bowls, vegan cafés, and traditional Balinese. Wellness-oriented. International variety.",
        "community": "Massive wellness and nomad community. Yoga teachers, healers, and remote workers. Community events daily.",
        "english": "Excellent for Indonesia—tourism ensures English works. Some Indonesian deepens experience.",
        "visa": "Visa on arrival 30 days, extendable. Indonesia's second home visa available. Social visa for longer stays.",
        "culture": "Hindu Bali—temples, ceremonies daily, and artistic traditions. Carving, painting, and dance. Living spiritual culture.",
        "cleanliness": "Tourist areas maintained. Some areas rougher. Balinese pride in temples and offerings. Generally pleasant.",
        "airquality": "Good—highland jungle location. Burning season can affect. Generally healthy environment."
    },
    "valencia": {
        "climate": "Spanish Mediterranean—hot dry summers (30°C), mild winters. 300 days sunshine. Beach weather March-November. Excellent.",
        "cost": "Moderate Spanish at €2400/month. Cheaper than Barcelona. Excellent quality of life value.",
        "wifi": "Spanish infrastructure—80-100 Mbps standard. Modern city well-connected. No concerns.",
        "nightlife": "Ruzafa hipster bars, beach clubs, and Las Fallas festival insanity. Mediterranean late nights. Genuine fun.",
        "nature": "City beaches, Albufera lake nature reserve, and mountains accessible. Outstanding urban beach life.",
        "safety": "Very safe Spanish city. Tourist-friendly atmosphere. Walk anywhere comfortably. Relaxed Mediterranean vibe.",
        "food": "Paella birthplace—this is where it's authentic. Horchata, fresh seafood, and Mercado Central. Food pilgrimage.",
        "community": "Growing nomad hub. Coworking scenes active. Spanish helps but community accommodates. Welcoming.",
        "english": "Improving—less than Barcelona but tourist infrastructure works. Young generation better.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Valencia is popular choice.",
        "culture": "City of Arts and Sciences futuristic architecture, historic old town, and Las Fallas tradition. Modern meets medieval.",
        "cleanliness": "Well-maintained Spanish city. Beach areas pristine. Pride in public spaces. High standards.",
        "airquality": "Excellent—coastal Mediterranean. Sea breezes. Limited pollution. Very healthy."
    },
    "valletta": {
        "climate": "Maltese Mediterranean—hot dry summers (32°C), mild winters. Very sunny. Beach weather April-November. Excellent.",
        "cost": "Moderate at €2400/month. Malta's tax haven attracts wealth but city affordable. Island premium.",
        "wifi": "Maltese infrastructure—fiber widespread. Gaming industry ensures connectivity. Reliable throughout.",
        "nightlife": "St. Julian's and Paceville for clubs. Valletta more sophisticated—wine bars and harbor views. Small island options.",
        "nature": "Fortified city focus. Beaches elsewhere on island. Blue Grotto day trips. Gozo accessible. Small island life.",
        "safety": "Extremely safe island nation. Walk anywhere anytime. Maltese order. Minimal concerns.",
        "food": "Maltese-Italian-Arabic fusion—pastizzi, rabbit stew, and fresh seafood. British colonial touches. Unique.",
        "community": "iGaming and finance professionals. International expat community. English-speaking environment. Easy integration.",
        "english": "Excellent—English is official language. Maltese bilingual. No language barrier whatsoever.",
        "visa": "90-day Schengen standard. Malta's nomad residence permit available. EU member. Tax efficiency attracts.",
        "culture": "Knights of Malta fortress city. Entire city UNESCO protected. Baroque churches, harbor views. History everywhere.",
        "cleanliness": "UNESCO standards maintained. Pride in heritage. Limestone city well-kept. Excellent standards.",
        "airquality": "Excellent—island Mediterranean breezes. Limited industry. Clean air."
    },
    "valparaiso": {
        "climate": "Chilean coastal—mild year-round (10-22°C). Cooler than Santiago. Morning fog common. Mediterranean feel.",
        "cost": "Affordable at $1600/month. Cheaper than Santiago. Bohemian economy. Good value.",
        "wifi": "Chilean infrastructure—50-80 Mbps typical. Improving. Cafés accommodate working.",
        "nightlife": "Bohemian bars, live music in hills, and port city energy. Cerro Alegre and Concepción nightlife. Artsy vibes.",
        "nature": "Pacific coastline, cerro hill walks, and wine country accessible. Coastal beauty. Urban nature challenging.",
        "safety": "Requires awareness—some cerros safer than others. Tourist areas fine. Research neighborhoods. Petty crime exists.",
        "food": "Chilean seafood—chorrillana, empanadas, and fresh fish. Port city dining. Wine excellent and cheap.",
        "community": "Artists, students, and small expat presence. Bohemian attracts creatives. Spanish essential. Welcoming.",
        "english": "Limited—Chilean Spanish fast and distinct. Tourist areas have basics. Spanish essential.",
        "visa": "90 days visa-free for most. Chile welcoming. Extensions possible. Straightforward.",
        "culture": "UNESCO cerros, street art everywhere, and Neruda's house (La Sebastiana). Colorful hillside city. Bohemian spirit.",
        "cleanliness": "Varies dramatically by cerro. Some areas rough. Graffiti is art. Character over sterility.",
        "airquality": "Good—coastal breezes. Port activity affects harbor area. Generally healthy."
    },
    "verona": {
        "climate": "Northern Italian continental—cold foggy winters, hot summers. Po Valley climate. Four distinct seasons.",
        "cost": "Moderate Italian at €2400/month. Tourist premium for Romeo and Juliet but reasonable overall.",
        "wifi": "Northern Italian infrastructure—60-80 Mbps typical. Reliable for remote work. Improving.",
        "nightlife": "Piazza delle Erbe aperitivo, opera at Arena, and wine bars. Sophisticated rather than wild. Italian elegance.",
        "nature": "Lake Garda accessible, Lessini Mountains, and wine country. Good day trip options.",
        "safety": "Very safe Italian city. Tourist-friendly atmosphere. Walk anywhere comfortably. Pleasant.",
        "food": "Veronese cuisine—risotto, bollito, and Amarone wine. Northern Italian excellence. Romantic dining.",
        "community": "Small international presence. Opera visitors, tourists. Italian essential for depth.",
        "english": "Tourist services in English. Daily life benefits from Italian. Romeo and Juliet bring visitors.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy.",
        "culture": "Roman Arena, Romeo and Juliet balcony, and medieval streets. Opera festival summer. Romantic city earned.",
        "cleanliness": "Well-maintained for tourism. Pride in presentation. Pleasant throughout.",
        "airquality": "Po Valley can trap pollution. Winter fog. Generally acceptable."
    },
    "vienna": {
        "climate": "Central European continental—cold snowy winters (-2°C), warm summers (25°C). Four distinct seasons. Christmas market weather.",
        "cost": "Moderate European at €2800/month. Good value for imperial capital. Quality extremely high.",
        "wifi": "Austrian excellence—fiber standard. Reliable throughout. No connectivity concerns.",
        "nightlife": "Opera, classical concerts, and sophisticated bars. Naschmarkt area. Less wild than Berlin but genuinely cultural.",
        "nature": "Vienna Woods, Danube River, and urban parks. Schönbrunn gardens. Nature integrated into imperial design.",
        "safety": "Extremely safe European capital. Walk anywhere anytime. Austrian order. Minimal concerns.",
        "food": "Wiener Schnitzel, Sachertorte, and coffee house culture (UNESCO). Quality over trends. Imperial legacy.",
        "community": "International organizations (UN), students, and professionals. English-speaking environment exists.",
        "english": "Good—Viennese are multilingual. Tourist infrastructure excellent. German appreciated.",
        "visa": "90-day Schengen standard. Austria's Red-White-Red Card for skilled workers. EU pathways.",
        "culture": "Imperial heritage—Schönbrunn, Belvedere, and opera. Freud, Klimt, and coffee houses. High culture capital.",
        "cleanliness": "Austrian immaculate standards. World's most liveable city consistently. Exemplary.",
        "airquality": "Good—limited industry, parks extensive. Clean Austrian air."
    },
    "vilnius": {
        "climate": "Baltic continental—cold snowy winters (-7°C), mild summers. Dark winter months. Four distinct seasons.",
        "cost": "Good value at €1800/month. Cheapest Baltic capital. Lithuania offers excellent value.",
        "wifi": "Lithuanian excellence—fiber widespread. Fast and reliable. Tech scene growing. No concerns.",
        "nightlife": "Old Town bars, Užupis artistic district, and craft beer scene. Not wild but genuine. Student energy.",
        "nature": "Trakai castle lake, surrounding forests, and flat Baltic countryside. Nature accessible.",
        "safety": "Very safe Baltic capital. Walk anywhere at any hour. Lithuanian order. Minimal concerns.",
        "food": "Lithuanian cuisine—cepelinai dumplings, dark bread, and hearty fare. Not refined but satisfying.",
        "community": "Growing digital nomad interest. Startup scene emerging. English-speaking environment. Welcoming.",
        "english": "Good—younger Lithuanians speak English well. Russian also common. Tourism accommodates.",
        "visa": "90-day Schengen standard. Lithuania offers startup visa. EU member.",
        "culture": "Baroque Old Town UNESCO site, Užupis 'republic' art district, and Soviet heritage layers. Quirky charm.",
        "cleanliness": "Well-maintained Old Town. Baltic pride in presentation. Generally pleasant.",
        "airquality": "Excellent—limited industry, green surroundings. Clean Baltic air."
    },
    "warsaw": {
        "climate": "Polish continental—cold winters (-5°C), warm summers (25°C). Four distinct seasons. Grey but liveable.",
        "cost": "Good value at €2200/month. Cheaper than Western Europe. Quality improving rapidly.",
        "wifi": "Polish infrastructure solid—80-100 Mbps standard. IT sector drives connectivity. Reliable.",
        "nightlife": "Praga district hipster bars, clubs, and vodka culture. Pawilony courtyards. Genuine Polish nightlife.",
        "nature": "Vistula River, Łazienki Park, and flat Polish countryside. Urban parks extensive.",
        "safety": "Safe Polish capital. Tourist areas comfortable. Some areas at night need awareness. Standard precautions.",
        "food": "Polish hearty—pierogi, żurek soup, and meat-focused cuisine. Milk bars for budget. Improving restaurant scene.",
        "community": "Growing international presence. Tech and business professionals. English in business. Polish helpful.",
        "english": "Good in business and young generation. Service industry improving. Polish appreciated.",
        "visa": "90-day Schengen standard. Poland offers no specific nomad visa. EU pathways available.",
        "culture": "Rebuilt from WWII destruction (Old Town UNESCO), Chopin heritage, and contemporary art. Phoenix city. Resilient.",
        "cleanliness": "Well-maintained modern capital. Pride in reconstruction. Pleasant throughout.",
        "airquality": "Can be affected in winter. Generally acceptable. Improving standards."
    },
    "wellington": {
        "climate": "Notoriously windy—cool year-round (8-20°C). 'Windy Wellington' earned. Four seasons but mild. Pack layers.",
        "cost": "Expensive New Zealand at NZD $4000/month ($2400). Housing tight. Quality of life high.",
        "wifi": "New Zealand infrastructure—fiber widespread. Good connectivity. Reliable throughout.",
        "nightlife": "Cuba Street bars, craft beer culture, and live music. Capital city energy. Not massive but genuine.",
        "nature": "Wellington waterfront, Zealandia wildlife, and surrounding hills. Nature integrated. South Island accessible.",
        "safety": "Extremely safe New Zealand capital. Walk anywhere anytime. Kiwi trust society. Minimal concerns.",
        "food": "Coffee culture serious, farm-to-table, and Asian fusion. Wellington Eats trails. Quality focused.",
        "community": "Government, film industry (Weta), and tech. International professionals. Easy English integration.",
        "english": "Native English—Kiwi accent distinctive but no barrier. Multicultural means diversity.",
        "visa": "New Zealand visa system well-organized. Working holiday, skilled migrant routes. No specific nomad visa.",
        "culture": "Te Papa museum, film industry (Lord of the Rings), and Māori heritage. Compact cultural capital.",
        "cleanliness": "New Zealand pristine standards. Well-maintained throughout. Pride in environment. Excellent.",
        "airquality": "Excellent—wind cleans everything. Among world's cleanest capitals. Very healthy."
    },
    "wroclaw": {
        "climate": "Polish continental—cold winters (-3°C), warm summers (24°C). Four distinct seasons. Central European climate.",
        "cost": "Excellent value at €1800/month. One of Poland's best deals. Student economy helps.",
        "wifi": "Polish infrastructure solid—80-100 Mbps standard. University and tech presence. Reliable.",
        "nightlife": "Student energy—Rynek square bars, clubs, and vodka culture. More intimate than Warsaw or Krakow.",
        "nature": "Oder River, parks, and surrounding countryside. Flat but green. Urban nature pleasant.",
        "safety": "Very safe Polish city. University atmosphere welcoming. Walk anywhere comfortably. Friendly.",
        "food": "Polish cuisine—pierogi, regional specialties, and growing food scene. Student-budget options abundant.",
        "community": "University brings international students. Growing tech scene. Some expats. Polish helpful.",
        "english": "Good among young generation. University areas accommodate. Polish appreciated.",
        "visa": "90-day Schengen standard. Poland offers no specific nomad visa. EU pathways exist.",
        "culture": "Hundred bridges city, dwarf sculptures everywhere, and rebuilt from war. Centennial Hall UNESCO. Charming.",
        "cleanliness": "Well-maintained. Polish pride in presentation. University town standards. Pleasant.",
        "airquality": "Can be affected in winter from heating. Generally acceptable. Improving."
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
    print("Updating category descriptions for batch 16 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH16_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH16_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

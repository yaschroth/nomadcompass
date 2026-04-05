#!/usr/bin/env python3
"""
Update category descriptions for batch 13 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH13_DESCRIPTIONS = {
    "salvador": {
        "climate": "Tropical Brazilian—hot and humid year-round (25-30°C). Wet season April-July. Beach weather always. Pack light and breezy.",
        "cost": "Affordable Brazilian at $1800/month. Northeast Brazil pricing. Good value for vibrant city life.",
        "wifi": "Brazilian infrastructure—40-70 Mbps in good areas. Improving but inconsistent. Coworking spaces more reliable.",
        "nightlife": "Afro-Brazilian energy—axé music, Pelourinho bars, and Carnival intensity year-round. Tuesday night blessings at church. Infectious rhythm.",
        "nature": "Beautiful beaches, Baía de Todos os Santos, and tropical coastline. Morro de São Paulo accessible. Beach city life.",
        "safety": "Requires serious attention. Research neighborhoods thoroughly. Pelourinho tourist areas patrolled. Don't display wealth. Street smarts essential.",
        "food": "Bahian cuisine—acarajé, moqueca, and African-influenced flavors. Coconut, dendê oil, and seafood. Unique in Brazil.",
        "community": "Small international presence. Capoeira practitioners, cultural tourists. Portuguese essential. Afro-Brazilian culture immersive.",
        "english": "Very limited. Portuguese essential for everything. Tourist services minimal. Language learning necessary.",
        "visa": "90 days visa-free for most. Brazil welcoming. Extensions possible. Salvador is off typical tourist path.",
        "culture": "Pelourinho UNESCO heritage, Candomblé religion, and capoeira birthplace. African diaspora capital of Americas. Profoundly cultural.",
        "cleanliness": "Historic center maintained for tourism. Some areas challenging. Brazilian character. Varies by neighborhood.",
        "airquality": "Coastal breezes help. Traffic affects main arteries. Generally acceptable. Beach proximity beneficial."
    },
    "salzburg": {
        "climate": "Austrian alpine—cold snowy winters, mild summers. Mountain weather means rain possible. Föhn winds bring warmth. Four seasons.",
        "cost": "Expensive Austrian at €3000/month. Tourism premium. Mozart tax applies. Quality is very high.",
        "wifi": "Austrian infrastructure—100+ Mbps standard. Reliable throughout. No connectivity concerns.",
        "nightlife": "Sophisticated—opera, classical concerts, and wine bars. Not a party city. Festival season (summer) transforms atmosphere.",
        "nature": "Alps on doorstep—Sound of Music hills, lake district, and skiing accessible. Extraordinary natural beauty.",
        "safety": "Extremely safe Austrian city. Walk anywhere anytime. Austrian order maintained. Minimal concerns.",
        "food": "Austrian classics—Wiener Schnitzel, Salzburger Nockerl, and Mozart chocolates. Coffee house culture. Hearty and quality.",
        "community": "Classical music community, festival visitors. Small year-round expat presence. German language dominant.",
        "english": "Good in tourism and younger generation. Festival brings international visitors. German helpful for daily life.",
        "visa": "90-day Schengen standard. Austria part of EU. No specific nomad visa but EU pathways exist.",
        "culture": "Mozart birthplace, baroque architecture, and Sound of Music locations. Salzburg Festival world-famous. Cultural heavyweight.",
        "cleanliness": "Austrian immaculate standards. Well-maintained throughout. Pride in presentation. Exemplary.",
        "airquality": "Excellent—alpine location, limited industry. Clean mountain air. Among Europe's best."
    },
    "sanjuan": {
        "climate": "Caribbean tropical—warm year-round (26-31°C). Hurricane season June-November. Trade winds moderate heat. Beach weather always.",
        "cost": "Moderate at $2500/month. US territory pricing. Cheaper than mainland cities. Dollar economy.",
        "wifi": "US infrastructure—fiber available, 100+ Mbps in good areas. Hurricane can disrupt. Generally reliable.",
        "nightlife": "Old San Juan bars, Condado beach clubs, and salsa energy. La Placita Thursday nights legendary. Caribbean meets US.",
        "nature": "Beautiful beaches, El Yunque rainforest (only US tropical rainforest), and bioluminescent bays. Nature paradise.",
        "safety": "Tourist areas safe. Some neighborhoods require awareness. US standards generally. Hurricane preparedness important.",
        "food": "Puerto Rican cuisine—mofongo, lechón, and tropical flavors. Spanish Caribbean fusion. Rum is serious business.",
        "community": "US citizens plus expats. Tax advantages attract investors. English-speaking environment. Easy integration.",
        "english": "Bilingual—English and Spanish both official. US territory means English works everywhere. Spanish appreciated.",
        "visa": "US territory—no visa needed for Americans. Same rules as US mainland. Simplifies legal status.",
        "culture": "Old San Juan UNESCO fortifications, Spanish colonial heritage, and Puerto Rican identity. Bomba and plena traditions.",
        "cleanliness": "Old San Juan well-maintained. Beach areas clean. US standards with Caribbean character.",
        "airquality": "Excellent—Caribbean breezes, island location. Clean tropical air. Very healthy environment."
    },
    "sanmigueldeallende": {
        "climate": "Highland Mexican perfection—eternal spring at 1900m. Warm days (25°C), cool nights. Dry most of year. Near-perfect weather.",
        "cost": "Moderate at $2200/month. Gringo premium exists. Art tourism inflates prices. Still good value.",
        "wifi": "Mexican provincial—40-70 Mbps typical. Centro histórico can challenge. Coworking options exist.",
        "nightlife": "Sophisticated—wine bars, rooftop terraces, and art gallery openings. Not party destination. Refined evenings.",
        "nature": "Botanical garden, hot springs nearby, and highland countryside. Wine country emerging. Pleasant escapes.",
        "safety": "Very safe Mexican town. Wealthy community, heavy police presence. Walking comfortable. Tourist-friendly.",
        "food": "Mexican gastronomy elevated—fine dining, traditional markets, and cooking schools. Food is attraction.",
        "community": "Large American and Canadian expat community. Artists, retirees, and creatives. English spoken widely.",
        "english": "Excellent for Mexico—expat community ensures English works. Spanish appreciated but not essential.",
        "visa": "180 days visa-free. Mexico welcoming. San Miguel attracts long-term visitors. Temporary resident available.",
        "culture": "UNESCO colonial town, art galleries everywhere, and Day of the Dead celebrations. Prettiest town in Mexico claim.",
        "cleanliness": "Immaculately maintained. Colonial pride. Tourist economy drives standards. Among Mexico's cleanest.",
        "airquality": "Excellent—highland location, limited traffic in centro. Clean colonial town air."
    },
    "sansebastian": {
        "climate": "Basque Atlantic—mild and rainy. Cool summers (22°C), wet winters. Green for a reason. Pack rain gear always.",
        "cost": "Expensive Spanish at €3200/month. Gastronomy tourism premium. Worth it for food lovers.",
        "wifi": "Spanish infrastructure—80-100 Mbps standard. Reliable connectivity. No concerns.",
        "nightlife": "Pintxos crawl is the experience—bar to bar eating and drinking. Parte Vieja old town energy. Sophisticated rather than wild.",
        "nature": "Beautiful beaches (La Concha), coastal walks, and Basque countryside. Mountains meet ocean. Stunning setting.",
        "safety": "Very safe Basque city. Tourist-friendly, welcoming. Walk anywhere comfortably. Relaxed atmosphere.",
        "food": "World's highest Michelin star density per capita. Pintxos culture, txakoli wine, and Basque gastronomy. Food pilgrimage essential.",
        "community": "Small international presence. Food tourists and Basque culture seekers. Spanish and Basque helpful.",
        "english": "Good in restaurants and tourism. Spanish more useful than Basque for visitors. Tourism accommodates.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Basque Country welcomes visitors.",
        "culture": "Basque identity strong, international film festival, and gastronomic societies (txokos). Cultural distinctiveness.",
        "cleanliness": "Immaculately maintained. Basque pride in presentation. Beach areas pristine. Excellent standards.",
        "airquality": "Excellent—Atlantic breezes, coastal location. Clean Basque air. Among Spain's healthiest."
    },
    "santiago": {
        "climate": "Mediterranean semi-arid—hot dry summers (30°C), mild wet winters. Four seasons. Snow visible on Andes. Pleasant most of year.",
        "cost": "Moderate at $2200/month. Chile is South America's most expensive but quality matches. Good infrastructure.",
        "wifi": "Chilean infrastructure solid—60-100 Mbps common. Best in South America. Reliable for remote work.",
        "nightlife": "Bellavista bars, Lastarria sophistication, and rooftop terraces. Wine culture strong. Genuine Chilean energy.",
        "nature": "Andes skiing within hour, wine valleys, and Pacific beaches accessible. Extraordinary geographic diversity.",
        "safety": "Generally safe for South America. Tourist areas fine. Some neighborhoods need awareness. Protests occasionally.",
        "food": "Chilean cuisine—empanadas, pastel de choclo, and world-class wine. Seafood from coast. Quality ingredients.",
        "community": "Growing international presence. Business and startup community. Regional hub. Spanish helps enormously.",
        "english": "Limited outside business. Chilean Spanish is fast and distinct. Daily life benefits from Spanish.",
        "visa": "90 days visa-free for most. Chile welcoming. Extensions possible. Business-friendly environment.",
        "culture": "Neruda houses, street art, and contemporary architecture. Pre-Columbian museum. Mountains backdrop everything.",
        "cleanliness": "Well-maintained for South America. Some areas rougher. Chilean standards improving. Generally pleasant.",
        "airquality": "Winter smog can be serious—Andes trap pollution. Summer better. Monitor during cold months."
    },
    "saopaulo": {
        "climate": "Subtropical highland—mild year-round (15-28°C). Dramatic afternoon storms. Drier winter. No extreme heat thanks to elevation.",
        "cost": "Moderate at $2400/month. Brazil's business capital. Jardins expensive, other neighborhoods cheaper.",
        "wifi": "Brazilian infrastructure—50-100 Mbps in good areas. Business city ensures connectivity. Reliable overall.",
        "nightlife": "Endless—Vila Madalena bars, underground clubs, and 24-hour city energy. Paulistanos work and party hard.",
        "nature": "Limited urban nature. Ibirapuera Park is escape. Beaches require 2-hour drive. City focus primarily.",
        "safety": "Requires attention—research neighborhoods. Jardins, Vila Madalena safer. Petty crime common. Street smarts essential.",
        "food": "Global gastronomy capital—Japanese (largest outside Japan), Italian, and Brazilian fusion. Food scene rivals world's best.",
        "community": "Large international business community. Startup scene growing. Portuguese essential but English in business.",
        "english": "Better than most Brazilian cities in business. Daily life needs Portuguese. Younger professionals improving.",
        "visa": "90 days visa-free for most. Brazil welcoming. Extensions possible. Business visa for longer stays.",
        "culture": "Museum scene excellent, street art, and contemporary architecture. Economic powerhouse. Latin America's largest city.",
        "cleanliness": "Varies dramatically. Wealthy areas maintained. Some areas challenging. Urban megacity reality.",
        "airquality": "Traffic pollution significant. Varies by neighborhood. Improving with fleet modernization."
    },
    "sarajevo": {
        "climate": "Bosnian continental in valley—cold snowy winters (-5°C), warm summers. Mountain-enclosed microclimate. Four distinct seasons.",
        "cost": "Budget paradise at €1200/month. Bosnia offers extraordinary value. One of Europe's cheapest capitals.",
        "wifi": "Bosnian infrastructure—30-60 Mbps typical. Improving but not Western European. Mobile data backup helpful.",
        "nightlife": "Baščaršija cafés, craft beer scene growing, and nightlife in Ferhadija. Mix of Ottoman charm and modern bars.",
        "nature": "Mountains surround city—Bjelašnica and Jahorina for skiing. Olympic legacy. Excellent outdoor access.",
        "safety": "Safe city but war history means landmine warnings in rural areas. Urban areas fine. Welcoming atmosphere.",
        "food": "Bosnian hearty—ćevapi (mandatory), burek, and strong coffee culture. Turkish influences. Cheap and delicious.",
        "community": "Small but growing international presence. NGO workers, cultural tourists. Bosnian/Serbian/Croatian helpful.",
        "english": "Younger generation good. Tourist areas manageable. Daily life benefits from local language basics.",
        "visa": "90 days visa-free for most. Bosnia not EU. Welcoming immigration policy. Straightforward process.",
        "culture": "Ottoman and Austro-Hungarian layers, war history (siege 1992-96), and resilience. Tunnel Museum profound. Complex and important.",
        "cleanliness": "Old Town well-maintained. Some areas show post-war recovery. Improving steadily. Pleasant character.",
        "airquality": "Winter pollution significant—valley traps smoke from heating. Summer better. Monitor in cold months."
    },
    "seattle": {
        "climate": "Pacific Northwest—grey and drizzly much of year. Mild temperatures (5-22°C). Real summer June-September. Rain defines culture.",
        "cost": "Expensive American at $4500/month. Tech money inflated prices. Housing crisis real.",
        "wifi": "American tech hub—fiber everywhere, fastest speeds. Amazon, Microsoft presence ensures excellence. No concerns.",
        "nightlife": "Capitol Hill bars, Belltown clubs, and craft beer everywhere. Coffee shop culture by day. Music scene genuine.",
        "nature": "Mountains (Rainier, Olympics), Puget Sound, and forest everywhere. Outstanding outdoor access. PNW beauty.",
        "safety": "Generally safe but homelessness visible. Downtown challenges exist. Neighborhoods vary. Research areas.",
        "food": "Pacific Northwest seafood, Pike Place Market, and farm-to-table pioneer. Coffee is serious. Asian cuisines excellent.",
        "community": "Massive tech community. Amazon, Microsoft, and startups. Networking active. Seattle Freeze is real phenomenon.",
        "english": "American English—Pacific Northwest friendly. Diverse tech population. No language barrier.",
        "visa": "US visa complexity. ESTA for tourism. Tech sponsorship common but competitive. No nomad visa.",
        "culture": "Music heritage (Nirvana, grunge), Space Needle, and tech innovation. Libraries excellent. Progressive values.",
        "cleanliness": "Some areas challenging. Homelessness visible downtown. Neighborhoods vary significantly.",
        "airquality": "Generally good but wildfire smoke affects summer/fall severely. Can be hazardous during fire season."
    },
    "seoul": {
        "climate": "Korean extremes—hot humid summers (33°C), cold dry winters (-10°C). Monsoon July-August. Four distinct seasons. Dramatic.",
        "cost": "Moderate at $2400/month. Cheaper than Tokyo. Housing options vary widely. Good value for megacity.",
        "wifi": "World's fastest—Korea's internet legendary. 500+ Mbps normal. Connectivity everywhere. Sets global standard.",
        "nightlife": "Endless—Hongdae clubs, Gangnam sophistication, and 24-hour city. Korean drinking culture intense. Noraebang (karaoke) essential.",
        "nature": "Mountains within city limits (Bukhansan), Han River parks, and palace grounds. Urban nature integrated well.",
        "safety": "Extremely safe Asian megacity. Walk anywhere at any hour. Korean social order. Minimal concerns.",
        "food": "Korean BBQ, street food markets, and fried chicken culture. Kimchi with everything. Cheap and excellent.",
        "community": "English teaching community large. Tech and business professionals. Korean helps but English teaching provides access.",
        "english": "Better in younger generation. Itaewon is English-friendly. Daily life benefits from Korean basics.",
        "visa": "90 days visa-free for most. Korea's D-10 job seeker available. No specific nomad visa but options exist.",
        "culture": "Palaces meet K-pop, traditional meets ultramodern. Korean Wave (Hallyu) origin. Technology everywhere. Fascinating contrasts.",
        "cleanliness": "Korean immaculate standards. Public spaces pristine. Efficient waste management. Exemplary.",
        "airquality": "Significant pollution concerns—yellow dust from China, local sources. Masks common. Monitor AQI regularly."
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
    print("Updating category descriptions for batch 13 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH13_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH13_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

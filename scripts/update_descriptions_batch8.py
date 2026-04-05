#!/usr/bin/env python3
"""
Update category descriptions for batch 8 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH8_DESCRIPTIONS = {
    "ghent": {
        "climate": "Belgian oceanic—grey, damp, and mild. Cool summers (20°C), cold winters. Rain frequent. Medieval atmosphere enhanced by moody weather.",
        "cost": "Moderate Belgian at €2400/month. Cheaper than Brussels or Bruges. Student economy keeps prices reasonable.",
        "wifi": "Belgian infrastructure solid—80-100 Mbps standard. University presence ensures connectivity. Cafés accommodate working.",
        "nightlife": "University energy—student bars, medieval atmosphere pubs, and genuine Belgian beer culture. More authentic than Bruges, less chaotic than Brussels.",
        "nature": "Flat Flanders canals. Cycling through countryside. Not spectacular but pleasant. Urban canal walks are atmospheric.",
        "safety": "Very safe Belgian city. University atmosphere welcoming. Walk anywhere at any hour. Relaxed and friendly.",
        "food": "Belgian classics—waterzooi (Ghent's signature dish), stoofvlees, waffles, and world-class beer. Student-budget options abundant.",
        "community": "University brings international students. Small expat presence. Growing creative scene. Dutch/English speakers integrate easily.",
        "english": "Excellent English among Flemish. University population multilingual. International atmosphere. No language barrier.",
        "visa": "90-day Schengen standard. Belgium offers no specific nomad visa. EU pathways exist for longer stays.",
        "culture": "Medieval masterpiece—Gravensteen castle, Gothic cathedrals, and Ghent Altarpiece. Progressive values meet ancient architecture. Authentic over touristed.",
        "cleanliness": "Well-maintained Belgian pride. Canal-side streets clean. Medieval with modern upkeep. Pleasant throughout.",
        "airquality": "Good—limited industry, canal ventilation. Belgian standards apply. Healthy environment."
    },
    "girona": {
        "climate": "Catalan Mediterranean—hot summers (30°C), mild winters. Costa Brava proximity. Pleasant most of the year. Less humid than Barcelona.",
        "cost": "Moderate at €2400/month. Cheaper than Barcelona. Day-trip tourism means fewer long-term price pressures.",
        "wifi": "Spanish fiber reaching smaller cities—60-80 Mbps typical. Cafés and hotels reliable. Improving steadily.",
        "nightlife": "Small city charm—tapas bars, wine terraces, and student energy from the university. Not a party destination. Sophisticated evenings.",
        "nature": "Costa Brava beaches accessible, Pyrenees nearby, and Empordà countryside. Excellent outdoor access for a small city.",
        "safety": "Very safe Catalan city. Walkable, welcoming atmosphere. No significant concerns. Pleasant throughout.",
        "food": "El Celler de Can Roca (world's best restaurant) is here. Catalan cuisine excellence. Seafood from Costa Brava. Serious food destination.",
        "community": "Small international presence. Cycling community (pro teams train here). Few nomads—Barcelona draws most. Pioneer territory.",
        "english": "Limited—Catalan and Spanish dominate. Tourist services in English. Daily life benefits from language skills.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Same process as Barcelona.",
        "culture": "Game of Thrones filming location, Jewish Quarter, and medieval cathedral. Romanesque and Gothic architecture. Less touristed than Barcelona.",
        "cleanliness": "Well-maintained medieval city. Tourist areas pristine. Catalan pride in presentation. High standards.",
        "airquality": "Excellent—small city, coastal proximity, limited traffic. Among Catalonia's cleanest."
    },
    "glasgow": {
        "climate": "Scottish wet—grey, rainy, and cool. Mild temperatures (5-18°C) year-round. Rain is constant companion. Pack waterproofs.",
        "cost": "Affordable UK at £2400/month. Much cheaper than London or Edinburgh. Good value for quality city.",
        "wifi": "British infrastructure—80-100 Mbps standard. Creative industries ensure connectivity. Cafés accommodate working.",
        "nightlife": "Legendary—live music every night, Sauchiehall Street chaos, and pub culture. Better music scene than Edinburgh. Genuinely wild.",
        "nature": "Scottish Highlands accessible. Loch Lomond nearby. Urban parks extensive. Dramatic landscapes within reach.",
        "safety": "Improving but awareness needed. Some areas rough at night. City center fine. Football rivalry adds tension. Street smarts help.",
        "food": "Scottish renaissance—haggis redefined, craft beer, and international diversity. Curry culture strong. Improving rapidly.",
        "community": "Creative and music community thriving. University brings international students. Growing tech scene. Networking active.",
        "english": "Scottish English—accent takes adjusting but native speakers. Glaswegian friendliness is genuine.",
        "visa": "UK visa complexity post-Brexit. Tourist visits straightforward. Working requires skilled worker route.",
        "culture": "Mackintosh architecture, music heritage (Simple Minds to Franz Ferdinand), and working-class pride. Museums free. Culture accessible.",
        "cleanliness": "Industrial heritage shows. Central areas improved. Some rougher edges. Character over polish.",
        "airquality": "Good—industrial decline cleaned air. Rain helps. Atlantic location. Healthier than reputation suggests."
    },
    "granadaspain": {
        "climate": "Andalusian Mediterranean—hot dry summers (35°C+), mild winters. Sierra Nevada creates microclimate. Snow and beach in same day possible.",
        "cost": "Excellent Spanish value at €1800/month. University and local economy keep prices low. Great deal for quality of life.",
        "wifi": "Spanish infrastructure—60-80 Mbps typical. University presence helps. Improving steadily.",
        "nightlife": "FREE TAPAS with every drink—Granada's legendary tradition. Flamenco caves of Sacromonte. Student energy. Late nights inevitable.",
        "nature": "Sierra Nevada skiing, Alpujarras mountain villages, and Mediterranean beaches (45 min). Outstanding outdoor access.",
        "safety": "Generally safe Spanish city. Albaicín at night requires awareness. Tourist areas fine. Relaxed atmosphere.",
        "food": "Tapas tradition—free with drinks! Andalusian cuisine, North African influences, and university budget-friendly options. Food culture is social.",
        "community": "University dominates. Spanish language students abundant. Growing nomad interest. Spanish helpful for integration.",
        "english": "Limited—Andalusian Spanish dominates. Tourist services in English. Daily life benefits significantly from Spanish.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Straightforward process.",
        "culture": "Alhambra palace—Moorish architecture at its peak. Albaicín neighborhood, flamenco heritage, and García Lorca associations. Overwhelmingly beautiful.",
        "cleanliness": "Tourist areas maintained. Some Albaicín streets rough. Andalusian character. Generally pleasant.",
        "airquality": "Good—mountain location helps dispersion. Limited industry. Clean Andalusian air."
    },
    "guadalajara": {
        "climate": "Highland Mexican perfection—eternal spring at 1500m. Warm days (25-30°C), cool nights. Dry season best (Nov-May). Near-perfect year-round.",
        "cost": "Great value at $1800/month. Mexico's second city without Mexico City prices. Tequila country bonus.",
        "wifi": "Mexican tech hub—60-100 Mbps in good areas. Coworking scenes in Providencia and Chapultepec. Improving rapidly.",
        "nightlife": "Mariachi birthplace—Plaza de los Mariachis is iconic. Clubs, cantinas, and tequila culture. Chapultepec is hipster central.",
        "nature": "Lake Chapala (Mexico's largest), Tequila valley day trips, and Barrancas landscape. Good weekend escapes.",
        "safety": "Requires attention—cartel activity exists regionally. Tourist areas (Providencia, Centro) safer. Research neighborhoods. Street smarts essential.",
        "food": "Jaliscan cuisine—birria, tortas ahogadas, and tequila. Regional Mexican excellence. Street food culture thriving.",
        "community": "Growing tech and startup scene. Some nomad infrastructure. Lake Chapala retirees nearby. Spanish essential.",
        "english": "Limited outside business and tech. Spanish essential for daily life. Expat infrastructure developing.",
        "visa": "180 days visa-free. Mexico welcomes remote workers informally. Temporary resident visa for longer stays.",
        "culture": "Mariachi heritage, Orozco murals, and Hospicio Cabañas. Revolutionary history and contemporary art. Authentic Mexican city.",
        "cleanliness": "Varies by area. Wealthy neighborhoods maintained; others rougher. Mexican urban standards.",
        "airquality": "Better than Mexico City—highland location helps. Traffic affects main arteries. Generally acceptable."
    },
    "guanajuato": {
        "climate": "Highland mild—warm days (20-28°C), cool nights. Dry season ideal (Oct-May). Pleasant year-round at 2000m elevation.",
        "cost": "Budget paradise at $1300/month. University town pricing. One of Mexico's best value destinations.",
        "wifi": "Mexican provincial internet—30-50 Mbps typical. Historic center challenging. Coworking options limited. Mobile data helps.",
        "nightlife": "Callejoneadas (walking serenades through alleys), student bars, and underground streets culture. Unique and romantic rather than wild.",
        "nature": "Colorful mountain setting, surrounding valleys, and dramatic landscapes. City itself is the attraction. Weekend escapes to countryside.",
        "safety": "Safe university town. Tourist-friendly atmosphere. Walking comfortable day and night. Mexican hospitality genuine.",
        "food": "Regional Guanajuatense cuisine, street food, and student-budget options. Enchiladas mineras, gorditas. Authentic and affordable.",
        "community": "University students dominate. Language school visitors. Very few nomads—pioneer territory. Spanish essential.",
        "english": "Very limited. Spanish essential for everything. University may have some English speakers. Learning necessary.",
        "visa": "180 days visa-free. Standard Mexican rules apply. Small city, informal atmosphere.",
        "culture": "UNESCO colonial city—underground streets, colorful hillside houses, and Diego Rivera birthplace. Cervantino festival world-famous. Visually extraordinary.",
        "cleanliness": "Tourist areas maintained. Historic character preserved. Mexican colonial charm. Pleasant atmosphere.",
        "airquality": "Excellent—highland location, limited traffic (pedestrian center), clean mountain air."
    },
    "gwangju": {
        "climate": "Korean humid subtropical—hot humid summers, cold dry winters. Four distinct seasons. Monsoon affects June-July.",
        "cost": "Affordable Korean at $1800/month. Provincial prices with good infrastructure. Much cheaper than Seoul.",
        "wifi": "Korean excellence—100+ Mbps standard everywhere. Korea's internet is world-class. No concerns.",
        "nightlife": "University energy—student bars, noraebang (karaoke), and Korean drinking culture. Less international than Seoul. Authentic.",
        "nature": "Mudeungsan National Park accessible. Surrounding countryside pleasant. Mountain hiking culture strong.",
        "safety": "Extremely safe Korean city. Walk anywhere at any hour. Korean social order applies. Minimal concerns.",
        "food": "Korean regional specialties—Gwangju is known for food. Oritang (duck soup), Korean BBQ, and market food. Excellent and affordable.",
        "community": "Very limited international presence. KAIST and universities bring some foreigners. Korean language essential. Deep immersion territory.",
        "english": "Limited—provincial Korea reality. University areas slightly better. Daily life requires Korean commitment.",
        "visa": "90 days visa-free for most. Korea's D-10 job seeker or other visas for longer stays. No specific nomad visa.",
        "culture": "May 18th Democratic Uprising history—significant Korean political heritage. Art biennale city. Contemporary art scene growing.",
        "cleanliness": "Korean immaculate standards. Well-maintained throughout. Public spaces pristine. Exemplary.",
        "airquality": "Can be affected by regional pollution. Generally acceptable. Korean environmental efforts improving."
    },
    "hamburg": {
        "climate": "North German maritime—cool, grey, and wet. Mild temperatures but frequent rain. Less cold than Berlin winters. Pack for drizzle.",
        "cost": "Expensive German at €3200/month. Second most expensive German city. Harbor prosperity shows in prices.",
        "wifi": "German infrastructure—100+ Mbps standard. Media and tech presence ensures connectivity. Reliable throughout.",
        "nightlife": "Reeperbahn legendary—red light district transformed into club district. St. Pauli alternative scene. Port city energy. Beatles played here.",
        "nature": "Elbe River, harbor walks, and North Sea accessible. Flat but waterways everywhere. Urban with good escapes.",
        "safety": "Generally safe German city. Reeperbahn late at night requires awareness. Standard precautions. Comfortable overall.",
        "food": "Fischbrötchen (fish sandwiches), port city international cuisine, and craft beer scene. Maritime flavors. Quality German fare.",
        "community": "Media and creative industries bring professionals. International port city. English-speaking community exists.",
        "english": "Excellent—Hamburg is international. Business and creative sectors function in English. German appreciated but not essential.",
        "visa": "90-day Schengen standard. Germany's freelance visa available. Hamburg is business-friendly.",
        "culture": "Elbphilharmonie concert hall, Speicherstadt warehouses (UNESCO), and maritime heritage. Media industry. Beatles history.",
        "cleanliness": "German standards with port city character. Well-maintained. Efficient waste management. Pleasant urban environment.",
        "airquality": "Good—maritime location helps. Port activity affects some areas. German environmental standards."
    },
    "hanoi": {
        "climate": "Northern Vietnamese—distinct seasons unlike south. Hot humid summers, surprisingly cold winters (10-15°C). Drizzly spring. Layering essential.",
        "cost": "Excellent value at $1500/month. Cheaper than Ho Chi Minh City. Old Quarter premium exists but still affordable.",
        "wifi": "Vietnamese internet improving—40-80 Mbps in good areas. Cafés accommodate nomads. Mobile data reliable backup.",
        "nightlife": "Bia hoi (fresh beer) corners, Old Quarter energy, and rooftop bars. Less wild than Saigon but genuine. Beer costs 25 cents.",
        "nature": "Limited urban nature. Halong Bay day trips possible. Weekend escapes to Sapa or Ninh Binh. City focus primarily.",
        "safety": "Generally safe Vietnamese city. Scooter traffic is the danger. Bag snatching occurs. Street smarts apply.",
        "food": "Phở capital—this is where it was invented. Bún chả, egg coffee, and Old Quarter street food. Food pilgrimage destination.",
        "community": "Growing nomad scene. Tay Ho (West Lake) is expat central. Coworking spaces emerging. Community smaller than HCMC but established.",
        "english": "Limited—less English than Ho Chi Minh City. Tourist areas manage. Daily life benefits from Vietnamese basics.",
        "visa": "E-visa for 90 days. Same rules as Ho Chi Minh City. Vietnam visa situation evolving—check current rules.",
        "culture": "French colonial architecture, ancient temples, and Communist iconography. Ho Chi Minh Mausoleum. 1000-year-old capital. History layers visible.",
        "cleanliness": "Old Quarter is chaotic character. Some areas rough. Improving but authentic Vietnamese urban reality.",
        "airquality": "Pollution concerns—scooter emissions and regional effects. Not as bad as some Asian capitals but noticeable. Masks on bad days."
    },
    "heidelberg": {
        "climate": "Rhine Valley mild—warm summers (25°C), cold winters. Protected location means less rain than surrounding areas. Pleasant much of year.",
        "cost": "Student town moderate at €2600/month. University presence keeps some prices down. Tourist premium in old town.",
        "wifi": "German infrastructure—80-100 Mbps standard. University ensures connectivity. Cafés accommodate working.",
        "nightlife": "Student energy—Untere Straße bar scene, student pubs with tradition, and academic nightlife. Sophisticated rather than wild.",
        "nature": "Neckar Valley walks, Philosopher's Way hiking, and Odenwald forest nearby. Excellent nature access for a small city.",
        "safety": "Very safe German university town. Walk anywhere at any hour. Minimal concerns. Relaxed and welcoming.",
        "food": "German traditional with student budget options. Regional specialties, international university influence. Quality without pretension.",
        "community": "University brings international students and researchers. Academic expat scene established. English common in university circles.",
        "english": "Excellent in university environment. Student population multilingual. Tourist industry accommodates. German appreciated.",
        "visa": "90-day Schengen standard. Germany's student and researcher visas well-established. Academic pathways exist.",
        "culture": "Germany's oldest university (1386), romantic castle ruins, and philosophical tradition. Mark Twain loved it. Academic pilgrimage site.",
        "cleanliness": "German precision meets tourist maintenance. Immaculate old town. University pride. Exemplary.",
        "airquality": "Good—valley location with river, limited industry. German environmental standards. Healthy environment."
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
    print("Updating category descriptions for batch 8 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH8_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH8_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

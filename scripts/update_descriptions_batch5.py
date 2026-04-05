#!/usr/bin/env python3
"""
Update category descriptions for batch 5 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH5_DESCRIPTIONS = {
    "lyon": {
        "climate": "Continental French with hot summers and cold winters. River confluence moderates extremes. Four distinct seasons. Fog can blanket in winter.",
        "cost": "Expensive French at €3200/month. France's second city with corresponding prices. Quality justifies cost.",
        "wifi": "French fiber infrastructure—100+ Mbps widely available. Tech sector presence ensures good connectivity. Cafés accommodate remote workers.",
        "nightlife": "Sophisticated scene—bouchons (traditional restaurants) transform to bars. Student energy adds life. Presqu'île district is the heart.",
        "nature": "Rhône and Saône rivers for walking, Alps accessible for skiing, Beaujolais wine country nearby. Good outdoor access despite urban setting.",
        "safety": "Generally safe French city. Some suburban areas have issues. Central areas comfortable. Standard urban awareness applies.",
        "food": "France's gastronomic capital—Paul Bocuse's legacy lives. Bouchons serve Lyonnaise classics. World-class dining at every price point.",
        "community": "Business and tech professionals dominate. International schools bring expats. Smaller nomad scene than Paris but established.",
        "english": "French expected—less international than Paris. Business community speaks English. Tourist areas manage. French dramatically improves experience.",
        "visa": "90-day Schengen standard. France's digital nomad visa option. French bureaucracy is thorough. Prepare documentation carefully.",
        "culture": "UNESCO-listed old town, Roman history, Renaissance architecture, and silk-weaving heritage. Lumière brothers invented cinema here. Cultural depth surprises.",
        "cleanliness": "Well-maintained French city pride. Presqu'île is immaculate. Industrial heritage areas grittier. High standards overall.",
        "airquality": "Valley location can trap pollution. Summer better than winter. Improving but not alpine fresh."
    },
    "madrid": {
        "climate": "Continental Mediterranean extremes—blazing summers (40°C+), cold dry winters. 2600 hours of sunshine annually. Altitude (650m) moderates humidity.",
        "cost": "Expensive but manageable at €2800/month. Cheaper than Barcelona or Paris. Excellent value for a capital city.",
        "wifi": "Spanish fiber infrastructure solid—100+ Mbps common. Cafés and coworking spaces deliver. No connectivity concerns.",
        "nightlife": "Legendary—dinner at 10pm, clubs open at 1am, home at sunrise. La Latina tapas crawls, Malasaña hipster bars, and mega-clubs. Never-ending.",
        "nature": "Sierra de Guadarrama mountains an hour away for hiking and skiing. City parks (Retiro) are extensive. Day trips to Toledo, Segovia.",
        "safety": "Generally safe with tourist-area pickpockets. Late-night culture means streets are populated. Standard awareness suffices.",
        "food": "Tapas culture perfected—jamón, croquetas, tortilla española. Mercado San Miguel grazing. Regional Spanish cuisines available. Late dining mandatory.",
        "community": "Large international community. Language school students, tech workers, and EU professionals. Meetups and networking abundant.",
        "english": "Improving but Spanish dominates. Younger generation speaks English. Tourist areas function. Spanish makes everything better.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa (Beckham Law) attracts remote workers with tax benefits.",
        "culture": "Prado, Reina Sofía, Thyssen—world-class art museums. Royal Palace, Flamenco heritage, and football tribalism. Cultural heavyweight.",
        "cleanliness": "Variable—central areas maintained, some neighborhoods grittier. Spanish urban character. Improving overall.",
        "airquality": "Summer heat creates ozone. Traffic affects levels. Winter better. Madrid's altitude helps dispersion."
    },
    "malacca": {
        "climate": "Tropical year-round heat and humidity (28-33°C). Monsoons bring heavy rain (Oct-Mar). AC is essential. Consistent temperatures.",
        "cost": "Exceptional value at $1200/month. Malaysian affordability at its best. Quality heritage accommodation cheap.",
        "wifi": "Malaysian infrastructure developing—30-50 Mbps typical. Heritage buildings can challenge signals. Main hotels reliable.",
        "nightlife": "Very quiet—UNESCO heritage town, not party destination. Jonker Street night market, riverside cafés. Early nights are normal.",
        "nature": "Limited—this is a small heritage town. Beach escapes require travel. Melaka River for walks. Urban exploration focus.",
        "safety": "Very safe—tourist-friendly heritage zone. Walkable and welcoming. Minimal concerns. Malaysian hospitality evident.",
        "food": "Peranakan cuisine heaven—Nyonya laksa, chicken rice balls, cendol. Chinese-Malay fusion at its finest. Street food paradise.",
        "community": "Very small nomad presence. Heritage tourists dominate. Pioneer territory for remote workers. Malaysian language helpful.",
        "english": "Good for Malaysia—tourism and education in English. Chinese and Malay communities bilingual. Daily life manageable.",
        "visa": "90 days visa-free for most. Malaysia's DE Rantau digital nomad visa available. Generally welcoming.",
        "culture": "UNESCO Straits heritage—Portuguese, Dutch, British, Chinese, and Malay layers. Peranakan museums, churches, temples. Living history.",
        "cleanliness": "Tourist areas well-maintained. Heritage preservation prioritized. Tropical humidity challenges. Generally pleasant.",
        "airquality": "Can be affected by regional haze (Indonesia burning). Normally acceptable. Seasonal variation significant."
    },
    "manchester": {
        "climate": "Famously wet—rainy and grey much of the year. Mild temperatures (5-20°C range). Bring waterproofs. Sunshine is celebrated event.",
        "cost": "Affordable UK at £2600/month. Much cheaper than London. Quality Northern value.",
        "wifi": "British infrastructure means 80-100 Mbps standard. MediaCity and tech scene ensure connectivity. Cafés accommodate working.",
        "nightlife": "Legendary music city—live venues, clubs, and pub culture. Northern Quarter alternative scene. Football creates ritual energy.",
        "nature": "Peak District National Park accessible. Lake District day trips possible. Urban with good outdoor access nearby.",
        "safety": "Mixed—some areas require awareness. Central areas fine at night. Football days can be rowdy. Standard UK city.",
        "food": "Curry Mile, craft beer revolution, and northern comfort food. International diversity. Not London but genuinely good.",
        "community": "Tech and creative community thriving. MediaCity brings media workers. Student population adds energy. Networking established.",
        "english": "Native English—Mancunian accent takes adjusting. International population. No language barrier obviously.",
        "visa": "UK visa complexity post-Brexit. Tourist visits straightforward. Working requires skilled worker or Global Talent routes.",
        "culture": "Industrial Revolution birthplace, football temples (United and City), and music heritage (Smiths, Oasis, Joy Division). Working-class pride.",
        "cleanliness": "Improving but industrial heritage shows. Central areas maintained. Some rougher edges. Character over polish.",
        "airquality": "Good for UK industrial city. Traffic affects levels. Rain cleans air frequently. Generally healthy."
    },
    "marrakech": {
        "climate": "Arid with hot summers (40°C+) and mild winters. Desert extremes—cold nights possible. Spring and fall are ideal. Pack for temperature swings.",
        "cost": "Excellent value at $1500/month. Riad living surprisingly affordable. Budget stretches far.",
        "wifi": "Moroccan infrastructure improving—30-60 Mbps in good riads. Medina can challenge signals. Cafés vary. Mobile data backup essential.",
        "nightlife": "Rooftop bars overlooking medina, hidden clubs, and traditional entertainment. Muslim country means limited alcohol zones. Sophisticated scene exists.",
        "nature": "Atlas Mountains for day trips and trekking. Desert excursions possible. City oasis gardens. Dramatic landscapes accessible.",
        "safety": "Persistent hassle from touts and guides. Scams target tourists. Walking at night generally fine. Street smarts essential.",
        "food": "Tagine, couscous, pastilla—Moroccan cuisine is sophisticated. Djemaa el-Fna food stalls. Riad dining atmospheric.",
        "community": "Established expat presence. Artists, writers, and seekers. Small nomad community in Gueliz (new town). French speakers advantaged.",
        "english": "French dominates, Arabic essential for locals. Tourist industry speaks English. Beyond riads, language helps significantly.",
        "visa": "90 days visa-free for most nationalities. Morocco generally welcoming. Straightforward tourist process.",
        "culture": "Medina chaos, Islamic architecture, Berber heritage, and French colonial overlay. Majorelle Garden, souks, and sensory overload.",
        "cleanliness": "Medina is atmospheric rather than clean. New town better maintained. Accept the chaos. Part of the experience.",
        "airquality": "Dust is constant. Desert winds affect quality. Not excellent but manageable. Keep windows closed on dusty days."
    },
    "marseille": {
        "climate": "Mediterranean perfection—hot dry summers, mild winters. Mistral wind can be intense. 300+ days of sunshine. Beach weather much of year.",
        "cost": "Affordable French at €2600/month. Cheaper than Paris or Lyon. Working-class roots keep prices reasonable.",
        "wifi": "French fiber reaching Marseille—80-100 Mbps in good areas. Coworking spaces reliable. Some older buildings challenging.",
        "nightlife": "Port city energy—Vieux Port bars, hip Cours Julien, and Mediterranean nightlife. Grittier than Nice. Real rather than polished.",
        "nature": "Calanques National Park for stunning coastal hiking and swimming. Mediterranean beaches. Excellent outdoor access.",
        "safety": "Reputation worse than reality but awareness needed. North neighborhoods problematic. Tourist areas fine. Street smarts help.",
        "food": "Bouillabaisse capital—fish soup is serious. Mediterranean cuisine, North African influences. Markets are excellent.",
        "community": "Smaller international presence than Paris. Artists and alternative types. Growing but not established nomad scene.",
        "english": "French essential—less international than Riviera. Tourist services in English. Daily life needs French commitment.",
        "visa": "90-day Schengen standard. France's bureaucracy applies. Documentation and patience required.",
        "culture": "France's oldest city—Greek founding, Mediterranean trading history, and multicultural present. MuCEM museum is world-class. Raw and authentic.",
        "cleanliness": "Gritty port city character. Some areas well-maintained; others rough. Not Riviera polish. Real over curated.",
        "airquality": "Good—Mediterranean breezes clean air. Port activity affects some areas. Generally healthy coastal environment."
    },
    "melbourne": {
        "climate": "Four seasons in one day—famously changeable. Mild overall (8-26°C range) but unpredictable. Layers essential. Less extreme than Sydney.",
        "cost": "Expensive Australian at AUD $4500/month. Housing costs high. Good quality of life compensates.",
        "wifi": "Australian NBN infrastructure—100+ Mbps increasingly available. Cafés designed for laptop workers. No concerns.",
        "nightlife": "Laneway bars, rooftop venues, and live music. Coffee culture by day, cocktails by night. Brunswick and Fitzroy hipster central.",
        "nature": "Great Ocean Road, Yarra Valley wine country, and Dandenong Ranges accessible. Urban with good nature access.",
        "safety": "Very safe Australian city. Some areas require awareness at night. Generally secure and relaxed.",
        "food": "Coffee obsession is religion. Italian, Greek, Vietnamese, and modern Australian cuisines. Food culture rivals any global city.",
        "community": "Large international community. Tech and creative industries bring professionals. Networking and meetups abundant.",
        "english": "Australian English—native speakers with distinct accent. Highly multicultural. No language barrier.",
        "visa": "Australian visa complexity. Working Holiday for under-30s. Work visas require sponsorship. No nomad visa exists.",
        "culture": "Street art capital, arts festivals, and sporting obsession (AFL, cricket, tennis). Creative industries thrive. Coffee shop culture defines daily life.",
        "cleanliness": "Well-maintained Australian city. Laneways can be gritty (intentionally). High standards throughout.",
        "airquality": "Excellent normally but bushfire smoke affects summer. Air quality alerts common in fire season. Monitor conditions."
    },
    "merida": {
        "climate": "Tropical heat and humidity year-round (25-35°C). Hot season (Apr-Jun) is brutal. Rainy season brings afternoon storms. AC essential.",
        "cost": "Excellent value at $1800/month. Yucatán affordability with colonial charm. Expat infrastructure keeps quality high.",
        "wifi": "Mexican internet improving—50-80 Mbps in good areas. Coworking spaces reliable. Some older buildings challenging.",
        "nightlife": "Cultural events and plaza gatherings over clubs. Traditional Yucatecan trova music. Sophisticated rather than rowdy.",
        "nature": "Cenotes for swimming, Maya ruins (Uxmal, Chichen Itza), and beach escapes to Progreso. Excellent weekend adventures.",
        "safety": "One of Mexico's safest cities. Walkable, friendly, and relaxed. The exception to Mexico safety concerns.",
        "food": "Yucatecan cuisine is distinct—cochinita pibil, papadzules, poc chuc. Maya and Spanish fusion. Excellent and affordable.",
        "community": "Established expat community, especially retirees. Growing nomad scene. Spanish helpful but English works in expat infrastructure.",
        "english": "Limited beyond expat services. Spanish essential for local life. Community makes language learning easy.",
        "visa": "180 days visa-free. Mexico's Temporary Resident visa for longer stays. Generally welcoming to remote workers.",
        "culture": "Maya heritage meets Spanish colonial—haciendas, cenotes, and living traditions. Paseo Montejo elegance. Cultural depth surprising.",
        "cleanliness": "Well-maintained colonial center. Some areas rougher. Generally pleasant Mexican city standards.",
        "airquality": "Good—no heavy industry, coastal proximity. Humidity more noticeable than pollution. Healthy environment."
    },
    "mexicocity": {
        "climate": "Highland mild (15-25°C year-round) at 2200m elevation. Dry and rainy seasons distinct. Earthquake zone—buildings are built for it.",
        "cost": "Excellent value at $2200/month. Megacity amenities at emerging market prices. Quality varies by colonia.",
        "wifi": "Mexican internet improving—50-100 Mbps in good areas. Coworking spaces abundant. Roma and Condesa well-connected.",
        "nightlife": "World-class and never-ending. Mezcal bars, salsa clubs, and underground scenes. Dinner at 10pm, dancing until dawn.",
        "nature": "Limited—massive urban sprawl. Xochimilco canals, Chapultepec Park, and day trips to volcanoes. City focus.",
        "safety": "Requires attention—research colonias, use Uber, and stay aware. Tourist areas safer. Violence exists but typically avoids visitors.",
        "food": "Culinary paradise—street tacos to Pujol (world's best restaurant lists). Regional Mexican cuisines, world-class markets. Obsessive food culture.",
        "community": "Massive nomad community, especially in Roma and Condesa. Coworking spaces everywhere. Instant social connections. The hub of Latin America.",
        "english": "Tourist areas and young professionals speak English. Spanish transforms the experience. Learning is easy and rewarding.",
        "visa": "180 days visa-free. Mexico welcomes remote workers informally. Temporary Resident visa for longer stays.",
        "culture": "Ancient Aztec foundations, Spanish colonial overlay, modern art explosion. Frida, Diego, and contemporary scene. Museums are world-class.",
        "cleanliness": "Varies dramatically by neighborhood. Polanco immaculate; others challenging. Megacity reality. Accept the complexity.",
        "airquality": "Improving but elevation traps pollution. Ozone warnings common. Better than its reputation but not clean."
    },
    "milan": {
        "climate": "Continental with humid summers (30°C+) and cold foggy winters. Po Valley location traps weather. Spring and fall are ideal.",
        "cost": "Italy's most expensive city at €3500/month. Fashion and finance salaries inflate prices. Quality is high.",
        "wifi": "Italian infrastructure improving—80-100 Mbps in good areas. Business city means reliable connectivity in coworking spaces.",
        "nightlife": "Sophisticated aperitivo culture—Navigli canals, Brera district, and fashion crowd venues. Style matters. Drinks start at 7pm.",
        "nature": "Lakes (Como, Maggiore) within an hour. Alps accessible for skiing. Limited urban nature but stunning day trips.",
        "safety": "Generally safe Italian city. Pickpockets at Duomo and Central Station. Standard awareness. Comfortable overall.",
        "food": "Risotto alla Milanese, cotoletta, and fashion-forward restaurants. Northern Italian cuisine is rich. Aperitivo is social institution.",
        "community": "Business and fashion professionals dominate. International companies bring expats. Tech scene growing. Networking established.",
        "english": "Business English works in professional settings. Italian helps significantly for daily life. Less English than expected.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy requires patience.",
        "culture": "La Scala opera, Last Supper, fashion week, and design excellence. Italy's economic engine with cultural ambition. Style is substance.",
        "cleanliness": "Well-maintained business city. Graffiti exists but overall tidy. Northern Italian standards higher than south.",
        "airquality": "Po Valley air quality issues. Winter fog traps pollution. Not excellent—Milan's environmental challenge."
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
    print("Updating category descriptions for batch 5 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH5_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH5_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

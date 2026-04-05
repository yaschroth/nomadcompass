#!/usr/bin/env python3
"""
Update category descriptions for batch 14 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH14_DESCRIPTIONS = {
    "seville": {
        "climate": "Andalusian extreme—brutally hot summers (40°C+), mild winters. Spring (Feria, Semana Santa) is perfect. Siesta exists for survival.",
        "cost": "Moderate Spanish at €2400/month. Tourist economy but still affordable. Tapas culture keeps food cheap.",
        "wifi": "Spanish infrastructure—60-80 Mbps typical. Improving steadily. Cafés accommodate working.",
        "nightlife": "Flamenco is real here—tablaos and spontaneous performances. Alameda de Hércules bars. Late nights inevitable. Summer terrazas.",
        "nature": "Guadalquivir River, day trips to Sierra Norte, and Doñana wetlands accessible. City focus primarily.",
        "safety": "Safe Spanish city. Tourist areas well-patrolled. Pickpockets in cathedral area. Standard awareness.",
        "food": "Tapas birthplace claim—free with drinks tradition continues. Flamenquín, gazpacho, and sherry. Social eating culture.",
        "community": "Language students abundant. Growing nomad presence. Spanish essential for depth. Welcoming atmosphere.",
        "english": "Tourist services in English. Daily life better with Spanish. Andalusian accent is challenge.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Straightforward process.",
        "culture": "Alcázar palace, cathedral with Giralda, and flamenco heartland. Semana Santa processions profound. Passionate and beautiful.",
        "cleanliness": "Tourist areas maintained. Some areas rougher. Andalusian character. Generally pleasant.",
        "airquality": "Summer heat dominates air concerns. No significant pollution. Generally healthy."
    },
    "siemreap": {
        "climate": "Cambodian tropical—hot year-round (25-35°C). Wet season June-October floods some temples. Dry season ideal for exploring.",
        "cost": "Budget paradise at $1000/month. Cambodia's tourist economy still cheap. Dollar-based simplifies finance.",
        "wifi": "Cambodian infrastructure—20-50 Mbps in town. Temple areas limited. Cafés and hotels more reliable.",
        "nightlife": "Pub Street chaos—tourist party strip. Beyond that, local bars and night markets. Small town transformed by tourism.",
        "nature": "Angkor temples are the nature—jungle-wrapped monuments. Tonle Sap lake. Floating villages. Extraordinary.",
        "safety": "Generally safe tourist town. Bag snatching occurs. Land mine awareness in rural areas. Tourist zones fine.",
        "food": "Cambodian cuisine—amok fish curry, loc lac, and French colonial influence. Street food cheap. Khmer flavors gentle.",
        "community": "NGO workers, temple tourists, hospitality industry. Small nomad presence. English works for basics.",
        "english": "Tourist English works well. Hospitality industry trains staff. Daily life manageable.",
        "visa": "30-day visa on arrival. E-visa available. Extensions in Phnom Penh. Cambodia welcoming.",
        "culture": "Angkor Wat UNESCO complex—world's largest religious monument. Khmer Empire heritage. Archaeological wonder.",
        "cleanliness": "Tourist areas maintained for visitors. Developing country reality beyond. Cambodian standards.",
        "airquality": "Good except burning season. Temple dust present. Generally acceptable. Rural location helps."
    },
    "split": {
        "climate": "Dalmatian Mediterranean—hot dry summers (30°C), mild winters. Beach season May-October. Perfect shoulder seasons.",
        "cost": "Moderate at €2400/month. Croatian coast premium in summer. Off-season bargains available.",
        "wifi": "Croatian infrastructure—50-80 Mbps typical. Tourist areas connected. Improving steadily.",
        "nightlife": "Riva waterfront energy, Diocletian's Palace bars, and beach clubs. Yacht party scene in summer. Croatian fun.",
        "nature": "Islands accessible (Hvar, Brač), Krka waterfalls day trips, and Dalmatian coast. Outstanding natural beauty.",
        "safety": "Very safe Croatian city. Tourist-friendly, welcoming atmosphere. Walk anywhere comfortably. Relaxed.",
        "food": "Dalmatian cuisine—fresh seafood, pršut ham, and peka (dome-cooked meat). Mediterranean excellence. Local wine excellent.",
        "community": "Seasonal tourism dominates. Small year-round expat presence. Growing nomad interest. Croatian helpful.",
        "english": "Good—Croatian tourism industry trains well. Younger generation fluent. Tourist areas excellent.",
        "visa": "Croatia joined Schengen 2023. 90-day rules apply. Digital nomad visa available.",
        "culture": "Diocletian's Palace—Roman emperor's retirement home is living city. UNESCO protected. Ancient meets modern seamlessly.",
        "cleanliness": "Well-maintained for tourism. Croatian pride in presentation. Beach areas pristine. High standards.",
        "airquality": "Excellent—Adriatic breezes, coastal location. Clean Dalmatian air. Among Europe's best."
    },
    "stockholm": {
        "climate": "Scandinavian—cold dark winters (-5°C), mild bright summers. Midnight sun in June, darkness in December. Seasons dramatic.",
        "cost": "Expensive Scandinavian at SEK 30,000/month ($2900). Everything costs more. Quality is exceptional.",
        "wifi": "Swedish excellence—fiber standard. Among world's best digital infrastructure. No concerns.",
        "nightlife": "Sophisticated—Södermalm bars, waterfront venues, and design-forward spaces. Not cheap but genuine. Lagom philosophy applies.",
        "nature": "Archipelago (30,000 islands), urban parks, and water everywhere. Stockholm built on 14 islands. Nature integrated.",
        "safety": "Extremely safe Scandinavian capital. Walk anywhere anytime. Swedish trust society. Minimal concerns.",
        "food": "New Nordic cuisine, fika coffee culture, and herring tradition. Quality over quantity. Expensive but excellent.",
        "community": "International tech and business community. Spotify, Klarna presence. English-speaking environment. Networking active.",
        "english": "Excellent—Swedes speak perfect English. Necessary for survival. International business language.",
        "visa": "90-day Schengen standard. Swedish work permits challenging. No specific nomad visa. Startup visa exists.",
        "culture": "Design obsession, ABBA and music heritage, and royal tradition. Museums free. Architecture impressive. Clean aesthetic.",
        "cleanliness": "Scandinavian pristine. Everything maintained to high standards. Pride in public spaces. Exemplary.",
        "airquality": "Excellent—Baltic location, environmental consciousness. Among Europe's cleanest capitals."
    },
    "strasbourg": {
        "climate": "Alsatian continental—cold winters, warm summers. Christmas market season magical but cold. Four distinct seasons.",
        "cost": "Moderate French at €2600/month. Cheaper than Paris. Alsatian efficiency with French flair.",
        "wifi": "French infrastructure—80-100 Mbps standard. EU Parliament presence ensures connectivity. Reliable.",
        "nightlife": "Alsatian wine bars, student energy (large university), and Franco-German fusion culture. Not Paris but genuine.",
        "nature": "Vosges Mountains accessible, Rhine River, and Black Forest nearby. Good outdoor access.",
        "safety": "Very safe French city. EU institutions presence means high security. Walk anywhere comfortably.",
        "food": "Alsatian excellence—choucroute, tarte flambée, and hearty Germanic-French fusion. Wine route begins here. Michelin stars present.",
        "community": "EU Parliament workers, students, and Franco-German professionals. International atmosphere. French helps.",
        "english": "Good for France—EU presence means more English speakers. Young generation accommodating.",
        "visa": "90-day Schengen standard. France's digital nomad visa available. EU capital pathways.",
        "culture": "Grande Île UNESCO site, Gothic cathedral, and half-timbered Petite France. Franco-German heritage. Christmas market famous.",
        "cleanliness": "Well-maintained EU capital. French standards with Germanic efficiency. Canal areas pristine.",
        "airquality": "Good—limited industry, river location. Clean Alsatian air."
    },
    "sucre": {
        "climate": "Highland Bolivian—eternal spring at 2800m. Warm days (20°C), cool nights. Dry season April-October. Pleasant year-round.",
        "cost": "Budget paradise at $900/month. Bolivia is South America's cheapest. Extraordinary value.",
        "wifi": "Bolivian infrastructure—20-40 Mbps typical. Improving but limited. Mobile data backup essential.",
        "nightlife": "Small city quiet—university bars, colonial plaza evenings. Not a party destination. Come for culture.",
        "nature": "Surrounding valleys, Tarabuco indigenous market, and dinosaur footprints. Highland beauty accessible.",
        "safety": "Safe Bolivian city. Friendly atmosphere. Walking comfortable. Tourist-friendly. Protests possible nationally.",
        "food": "Bolivian highland—salteñas, api morado, and hearty stews. Simple, filling, extremely affordable.",
        "community": "Language school students, some volunteers. Very few nomads. Spanish essential. Pioneer territory.",
        "english": "Very limited. Spanish essential for everything. Bolivia off tourist track. Language learning necessary.",
        "visa": "90 days visa-free for most. Bolivia straightforward. Extensions in La Paz possible.",
        "culture": "Constitutional capital, whitewashed colonial architecture, and UNESCO heritage. Independence history. Dignified beauty.",
        "cleanliness": "Colonial center well-maintained. Bolivian standards. Simple but clean. Pride in heritage.",
        "airquality": "Excellent—highland location, limited industry. Clean Andean air. Among South America's best."
    },
    "sydney": {
        "climate": "Australian subtropical—warm year-round (15-28°C). Mild winters, hot summers. Beach weather often. Southern Hemisphere seasons.",
        "cost": "Expensive Australian at AUD $5500/month ($3700). Housing crisis severe. Beautiful but costly.",
        "wifi": "Australian infrastructure—NBN varies (25-100 Mbps). Cafés and coworking reliable. Generally good.",
        "nightlife": "Lockout laws eased—Kings Cross reviving. Newtown alternative scene. Beach bars. Genuine energy returning.",
        "nature": "Stunning—harbour, beaches (Bondi, Manly), and Blue Mountains accessible. Coastal walks. Nature integrated.",
        "safety": "Very safe Australian city. Walk anywhere comfortably. Australian order maintained. Minimal concerns.",
        "food": "Multicultural excellence—best Asian food outside Asia. Modern Australian cuisine. Coffee culture serious.",
        "community": "International professionals, working holiday makers. Large expat community. Easy English integration.",
        "english": "Native English—Australian accent distinctive but no barrier. Multicultural means linguistic diversity.",
        "visa": "Working Holiday (18-35), skilled worker, or tourist. Australia's visa system well-organized. No nomad visa but options exist.",
        "culture": "Opera House icon, Indigenous heritage, and beach culture. Harbour Bridge. Sporting obsession. Outdoor lifestyle.",
        "cleanliness": "Australian high standards. Well-maintained throughout. Beach areas pristine. Excellent.",
        "airquality": "Generally excellent. Bush fire smoke can devastate air quality seasonally. Otherwise pristine."
    },
    "tainan": {
        "climate": "Southern Taiwan tropical—hot and humid year-round (25-33°C). Typhoon season July-September. Monsoon affects spring.",
        "cost": "Very affordable at $1400/month. Cheaper than Taipei. Taiwan's excellent value city.",
        "wifi": "Taiwanese excellence—fiber widespread. Taiwan's internet world-class. No connectivity concerns.",
        "nightlife": "Night markets are the nightlife—Dadong and Flower markets. Local bars exist. Food is the evening entertainment.",
        "nature": "Limited urban nature. Beaches accessible. Day trips to Alishan mountains. City history focus primarily.",
        "safety": "Extremely safe Taiwanese city. Walk anywhere anytime. Taiwanese society orderly. Minimal concerns.",
        "food": "Taiwan's food capital—beef soup noodles, dan zai noodles, and night market paradise. Must-eat destination.",
        "community": "Small international presence. Language learners and temple tourists. Mandarin essential. Deep Taiwan.",
        "english": "Limited—this is historical Taiwan. Tourist sites have some English. Daily life needs Mandarin.",
        "visa": "90 days visa-free for most. Taiwan welcoming. Extensions possible. Gold Card for professionals.",
        "culture": "Taiwan's ancient capital—temples everywhere, Confucian heritage, and colonial layers (Dutch, Japanese). History is attraction.",
        "cleanliness": "Taiwanese immaculate standards. Temple grounds pristine. Night markets organized chaos. Excellent.",
        "airquality": "Can be affected by regional pollution. Generally acceptable. Coastal location helps."
    },
    "taipei": {
        "climate": "Subtropical humid—hot summers (35°C), mild wet winters. Typhoon season July-September. Rain possible year-round. Humid.",
        "cost": "Moderate at $2200/month. Cheaper than Hong Kong or Tokyo. Good infrastructure value.",
        "wifi": "World-class—Taiwan's tech industry ensures excellence. Fiber everywhere. Among world's best connectivity.",
        "nightlife": "Night markets, rooftop bars, and clubs in Xinyi. 24-hour city energy. Karaoke (KTV) culture strong.",
        "nature": "Mountains accessible (Yangmingshan, Elephant Mountain), hot springs, and Northeast Coast. Nature surprisingly close.",
        "safety": "Extremely safe Asian capital. Walk anywhere anytime. Leave belongings without worry. Exceptionally orderly.",
        "food": "Night market paradise—xiaolongbao, beef noodle soup, and bubble tea birthplace. Din Tai Fung. Food is religion.",
        "community": "Established expat community. Tech and English teaching. Coworking scenes active. English works in expat areas.",
        "english": "Better than most Asian cities. Younger generation good. Mandarin helps for depth but English functional.",
        "visa": "90 days visa-free for most. Taiwan Gold Card for professionals. Welcoming to remote workers.",
        "culture": "National Palace Museum (Chinese treasures), temples, and night market culture. Mix of traditional and ultramodern.",
        "cleanliness": "Taiwanese immaculate standards. MRT spotless. Public spaces pristine. Exemplary.",
        "airquality": "Can be affected by pollution from China and local sources. Generally acceptable. Monitor AQI."
    },
    "tallinn": {
        "climate": "Baltic harsh—cold snowy winters (-10°C), mild summers. Dark winter months. Four distinct seasons. Pack warm.",
        "cost": "Moderate at €2200/month. More expensive than Latvia/Lithuania. Tech prosperity shows. Good value overall.",
        "wifi": "Estonian excellence—digital society pioneer. E-residency country. Among world's best connectivity. 100+ Mbps standard.",
        "nightlife": "Old Town bars, Telliskivi creative hub, and tech startup events. Not wild but genuine. Networking culture.",
        "nature": "Baltic beaches, Lahemaa National Park, and bog walks. Flat but green. Nature accessible.",
        "safety": "Extremely safe Baltic capital. Walk anywhere at any hour. Estonian order. Minimal concerns.",
        "food": "Estonian cuisine—black bread, Baltic herring, and Nordic influences. Improving food scene. Quality over variety.",
        "community": "Digital nomad hub—e-Residency attracts entrepreneurs. Startup scene vibrant. English-speaking environment established.",
        "english": "Excellent—Estonians speak fluent English. Digital society means international outlook. No barrier.",
        "visa": "90-day Schengen standard. Estonian e-Residency famous. Digital nomad visa available. Startup ecosystem.",
        "culture": "Medieval Old Town UNESCO site, tech innovation, and Singing Revolution heritage. Contrast of ancient and digital.",
        "cleanliness": "Baltic pristine standards. Old Town immaculate. Pride in presentation. Exemplary.",
        "airquality": "Excellent—Baltic breezes, limited industry. Among Europe's cleanest capitals. Very healthy."
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
    print("Updating category descriptions for batch 14 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH14_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH14_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

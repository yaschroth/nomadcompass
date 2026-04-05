#!/usr/bin/env python3
"""
Update category descriptions for batch 2 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH2_DESCRIPTIONS = {
    "bordeaux": {
        "climate": "Oceanic wine country—warm summers (25-30°C), mild winters, and the occasional Atlantic storm. Grape-growing weather means pleasant conditions most of the year.",
        "cost": "Upscale French living at €3000/month. Wine country prices apply—quality housing isn't cheap. Still more affordable than Paris with arguably better quality of life.",
        "wifi": "French fiber reaching Bordeaux with 100+ Mbps increasingly common. Cafés and coworking spaces deliver solid connections. Tech startup scene has improved infrastructure.",
        "nightlife": "Wine bars dominate, naturally. Student energy meets sophisticated venues. The riverside quays come alive in summer. Less frenetic than Paris, more refined than raucous.",
        "nature": "Atlantic beaches at Arcachon, Europe's highest sand dune, and endless vineyards. Pyrenees within a few hours for skiing. Excellent outdoor access.",
        "safety": "Very safe French city. Petty theft in tourist areas applies universally. Walkable at night, friendly atmosphere. No significant concerns.",
        "food": "World-class gastronomy at the source. Canelés, entrecôte bordelaise, oysters from Arcachon, and of course, the wine. Michelin stars meet neighborhood bistros.",
        "community": "Growing tech scene and startup culture bring young professionals. Darwin ecosystem hub attracts creatives. Smaller nomad presence than Paris but established.",
        "english": "Less English than Paris—French is expected. Younger professionals speak English. Tourist infrastructure accommodates, but learning French enhances the experience.",
        "visa": "90-day Schengen standard. France's digital nomad visa applies. French bureaucracy requires patience and proper documentation.",
        "culture": "UNESCO-listed cityscape, wine heritage, and Art Nouveau architecture. World wine capital culture means sophisticated dining, festivals, and celebration of terroir.",
        "cleanliness": "Well-maintained French city pride. Elegant stone buildings kept pristine. River promenade is spotless. High standards throughout.",
        "airquality": "Clean Atlantic air and limited heavy industry mean excellent air quality. One of France's healthier cities to breathe."
    },
    "boston": {
        "climate": "Four distinct seasons with real winters—expect snow, freezing temperatures, and the occasional nor'easter. Summers are warm and humid. Fall foliage is legendary.",
        "cost": "Elite expensive at $4500+/month. Cambridge/Somerville are pricey. One of America's most expensive cities, driven by biotech and universities.",
        "wifi": "American infrastructure excellence—100-300 Mbps standard. MIT and Harvard area means cutting-edge connectivity. No concerns for remote work.",
        "nightlife": "College town energy with sports bar passion. Irish pubs in South Boston, cocktail bars in Back Bay, live music in Allston. Last call is 2am—not a late-night city.",
        "nature": "Harbor islands, Cape Cod beaches within reach, White Mountains for hiking and skiing. Four-season outdoor activities. Fall foliage road trips are essential.",
        "safety": "Safe by American urban standards. Some neighborhoods require awareness. Cambridge is particularly secure. Standard city precautions apply.",
        "food": "Seafood capital—lobster rolls and clam chowder define the scene. North End Italian is legendary. Diverse immigrant cuisines throughout. Farm-to-table strong.",
        "community": "Massive student and tech community. Harvard, MIT, biotech corridor bring global talent. Meetups and networking abundant. Intellectual culture dominates.",
        "english": "It's New England—American English with distinctive accent. International academic community means multilingual environments in Cambridge.",
        "visa": "US visa complexity applies. Student visas for universities, H1-B for tech work. No nomad visa exists. Tourist status limits work options.",
        "culture": "American history's birthplace—Freedom Trail, revolutionary sites, and museum quality universities. Sports tribalism (Red Sox, Celtics, Patriots) is religion here.",
        "cleanliness": "Historic neighborhoods well-maintained. T (subway) shows age but functions. Clean American city standards with some urban challenges.",
        "airquality": "Excellent for a major American city. Harbor location and regulations keep air clean. Pollen season affects allergy sufferers."
    },
    "bruges": {
        "climate": "Belgian grey and dampness rule. Cool summers (18-22°C), chilly winters, frequent drizzle. Pack layers and accept the atmospheric moodiness.",
        "cost": "Tourist premium at €2400/month. Day-tripper destination means inflated prices in center. Affordable Belgium exists outside the medieval core.",
        "wifi": "Belgian infrastructure delivers reliable 80-100 Mbps. Historic buildings can challenge signals. Cafés and hotels accommodate remote workers.",
        "nightlife": "Quiet medieval charm—this isn't a party destination. Cozy beer bars, canal-side terraces, and early nights. Come for romance, not raves.",
        "nature": "Flat Flanders for cycling, North Sea coast at Knokke nearby. Not spectacular nature, but pleasant countryside. Polders and canals define the landscape.",
        "safety": "Exceptionally safe—tourist police, low crime, walkable at any hour. One of Europe's safest small cities. Relaxed atmosphere throughout.",
        "food": "Belgian classics perfected—moules-frites, waffles, chocolate shops on every corner. Beer culture is serious. Michelin options exist despite the small size.",
        "community": "Minimal nomad presence—this is tourist territory, not remote work hub. Expats exist but in small numbers. You'll need to create your own connections.",
        "english": "Excellent English proficiency among Flemish. Tourism industry ensures communication. Dutch appreciated but unnecessary.",
        "visa": "90-day Schengen standard. Belgium offers no specific nomad visa. Small city makes long-term settling unusual for remote workers.",
        "culture": "UNESCO medieval masterpiece frozen in time. Belfry tower, Flemish Primitives at Groeninge, Jan van Eyck's legacy. Living museum atmosphere.",
        "cleanliness": "Immaculate medieval streets maintained for tourism. Canals are clean, cobblestones swept. Belgian pride in preservation is evident.",
        "airquality": "Clean North Sea air, minimal industry, small city advantages. Excellent breathing conditions year-round."
    },
    "brussels": {
        "climate": "Belgian oceanic grey—mild temperatures, frequent clouds, and the drizzle that defines northwestern Europe. Summers pleasant, winters damp and dark.",
        "cost": "EU capital expensive at €3200/month. Eurocrat salaries inflate housing. Different communes vary significantly—Saint-Gilles cheaper than Ixelles.",
        "wifi": "EU institutions mean excellent infrastructure—100+ Mbps standard. Coworking spaces abundant for the international community. Reliable connectivity.",
        "nightlife": "Surprisingly varied—Grand Place tourist bars, hip Saint-Gilles spots, and underground electronic scene. Beer culture is sophisticated. Multilingual mix.",
        "nature": "Limited—flat urban environment. Bois de la Cambre park offers escape. Ardennes forest a train ride away. Not a nature destination.",
        "safety": "Mixed reputation—some areas require awareness, especially around Gare du Midi. Central tourist zones are fine. EU quarter is secure.",
        "food": "Belgian excellence—frites, waffles, mussels, beer. North African, Turkish, and global cuisines from diverse communities. Chocolate is art.",
        "community": "Massive international community from EU institutions. Expat scene is established. Digital nomads blend with policy professionals and lobbyists.",
        "english": "Widely spoken in international Brussels. French and Dutch official; English is the working language. Multilingual city accommodates everyone.",
        "visa": "90-day Schengen standard. EU institutions complicate residency—many expats exist in grey zones. Belgium bureaucracy is famously slow.",
        "culture": "Art Nouveau architecture, Magritte's surrealism, comic book heritage (Tintin), and EU political culture. Quirky and underrated.",
        "cleanliness": "Grittier than neighboring cities—graffiti common, some areas rough. Character over cleanliness. Improving but not pristine.",
        "airquality": "Urban European average—traffic affects levels. Not excellent but not alarming. Central location means industry-free."
    },
    "budapest": {
        "climate": "Continental extremes—hot summers (30°C+) and cold winters (below freezing). Spring and fall are ideal. The Danube's presence moderates slightly.",
        "cost": "Incredible value at €2100/month. Former cheap nomad paradise now discovering its worth. Still dramatically cheaper than Western Europe.",
        "wifi": "Excellent Hungarian infrastructure—100+ Mbps fiber widespread. Cafés and coworking spaces deliver strong connections. Tech scene has driven investment.",
        "nightlife": "Legendary ruin bar culture—Szimpla Kert started a global trend. Thermal bath parties, Danube boat clubs, underground electronic scene. Parties until sunrise.",
        "nature": "Buda hills for hiking, Danube Bend for day trips, Lake Balaton for summer beach vibes. Decent outdoor access without leaving the city.",
        "safety": "Generally safe European capital. Tourist scams exist. Pickpockets target busy areas. Nightlife zones require standard awareness.",
        "food": "Hungarian heartiness—goulash, langos, chimney cake. Jewish quarter food scene excellent. Affordable fine dining exists. Wine culture underrated.",
        "community": "One of Europe's original nomad hubs. Ruin bar coworking, established meetups, flowing community. You'll find your people quickly.",
        "english": "Good among younger generation and service industry. Older Hungarians may struggle. Tourist areas function in English.",
        "visa": "90-day Schengen standard. Hungary's White Card for digital nomads available with income requirements. EU complexity applies.",
        "culture": "Habsburg grandeur along the Danube—thermal bath heritage, Ottoman history, Art Nouveau treasures. Opera, classical music, and café culture thrive.",
        "cleanliness": "Improving but uneven. Grand boulevards maintained; side streets vary. Communist-era buildings show age. Character and history over sterility.",
        "airquality": "Winter smog affects the Danube basin. Summer is cleaner. Traffic and industry impact levels. Not Budapest's strongest category."
    },
    "buenosaires": {
        "climate": "Humid subtropical means hot summers and mild winters. No extreme cold but humidity can be oppressive December-February. Fall and spring are perfect.",
        "cost": "Currency crisis creates wild value—$2000/month buys excellent living. Blue dollar rate stretches budgets further. One of the world's best deals currently.",
        "wifi": "Argentine infrastructure is decent—50-100 Mbps in good buildings. Fiber reaching more areas. Some older buildings struggle. Coworking spaces reliable.",
        "nightlife": "Dinner at 10pm, clubs open at 2am, home at sunrise—porteño rhythm is non-negotiable. Tango milongas, electronic clubs, and bar culture legendary.",
        "nature": "Urban sprawl with limited nature access. Tigre delta offers escape. Beaches in Uruguay across the river. Patagonia requires flights.",
        "safety": "Street smarts required. Petty theft common, express kidnappings occur rarely. Tourist areas like Palermo are safer. Don't flash wealth.",
        "food": "Steak paradise—parrillas serve perfect asado. Italian immigrant influence means excellent pasta. Dulce de leche obsession. Wine (Malbec) flows cheaply.",
        "community": "Established nomad scene, especially in Palermo. Coworking spaces growing. Expat community is vibrant. Spanish helps enormously.",
        "english": "Limited outside tourist services and upper-class circles. Spanish essential for daily life. Porteños appreciate efforts to speak their language.",
        "visa": "90 days, extendable with border runs to Uruguay. Rentista visa requires income proof. Argentina's bureaucracy is challenging but manageable.",
        "culture": "European architecture, tango heritage, passionate football culture, and literary tradition (Borges). Paris of South America nickname is earned.",
        "cleanliness": "Gritty and real. Dog waste on sidewalks, graffiti everywhere, crumbling infrastructure. Beautiful chaos over sterile order.",
        "airquality": "Traffic pollution affects central areas. Generally acceptable but not pristine. Smoke from parrillas is the pleasant kind."
    },
    "cairo": {
        "climate": "Desert capital—scorching summers (40°C+), mild winters. Dust and heat define the experience. Air conditioning isn't optional May-September.",
        "cost": "Extremely affordable at $1200/month. Egypt's economy makes Western budgets stretch impossibly far. Quality varies—expat standards cost more.",
        "wifi": "Egypt's infrastructure struggles—20-40 Mbps is good, outages happen, speeds vary wildly. Mobile data provides backup. Patience required.",
        "nightlife": "Conservative but vibrant. Nile-side cafés, shisha bars, upscale hotel clubs. Zamalek and Maadi offer expat scenes. Ramadan changes everything.",
        "nature": "Desert on the doorstep, Nile flowing through. Red Sea diving accessible. Sinai mountains close. Egypt's landscape is dramatic but not green.",
        "safety": "Political stability improved but vigilance needed. Tourist sites heavily guarded. Traffic is the real danger—crossing streets is extreme sport.",
        "food": "Egyptian staples—koshari, ful medames, ta'ameya (Egyptian falafel). Street food is incredible and cheap. Western options in expat areas.",
        "community": "Small expat community concentrated in Maadi and Zamalek. Few digital nomads—this is adventurous territory. Arabic skills transform the experience.",
        "english": "Tourist areas and educated classes communicate. Beyond that, Arabic essential. Learning basics is both necessary and appreciated.",
        "visa": "30-day visa on arrival for most. Extensions through bureaucratic process. Egypt generally accommodating but paperwork-heavy.",
        "culture": "The Pyramids. The Sphinx. Islamic Cairo. Pharaonic history. This is cradle-of-civilization territory—5000 years of human achievement visible daily.",
        "cleanliness": "Chaotic, dusty, and overwhelming. Garbage is a genuine urban crisis. Air quality is poor. This is not a sanitized destination.",
        "airquality": "Among the world's worst. Pollution, dust, traffic emissions, and seasonal burning combine. Masks and air purifiers strongly recommended."
    },
    "cambridge": {
        "climate": "English weather—cool, damp, grey. Summers mild (20-25°C), winters chilly but rarely harsh. Rain is constant possibility. Pack layers.",
        "cost": "University town premium at £3500/month. Student demand and tech money inflate housing. One of UK's most expensive small cities.",
        "wifi": "British infrastructure plus tech corridor investment means 100+ Mbps standard. Silicon Fen startups ensure connectivity. No issues for remote work.",
        "nightlife": "Pub culture dominates—historic college pubs, riverside terraces. Not a party destination. Student term brings energy; holidays are quiet.",
        "nature": "Flat Fens countryside for cycling, punting on the Cam, college gardens. Not dramatic landscape but pleasant green spaces. Norfolk coast for beaches.",
        "safety": "Exceptionally safe—wealthy, well-policed university town. Bike theft is the main crime. Walk anywhere at any hour without concern.",
        "food": "Traditional British, college formal halls, and international options from student diversity. Farm-to-table scene growing. Afternoon tea is obligatory.",
        "community": "Academic and tech community dominate. Researchers, startup founders, university staff. Not typical nomad hub but intellectual community thrives.",
        "english": "Obviously native English—this is England. International academic community brings global perspectives. Received pronunciation still heard.",
        "visa": "UK visa complexity post-Brexit. Tourist visits straightforward. Working or long-term staying requires Global Talent or other visa routes.",
        "culture": "800 years of university tradition—medieval colleges, chapel choirs, punting traditions. Newton, Darwin, Hawking walked these streets. Academic pilgrimage site.",
        "cleanliness": "Immaculate college grounds, well-maintained city center. English civic pride. Historic buildings preserved beautifully.",
        "airquality": "Excellent—small city, limited industry, flat terrain with good dispersion. One of UK's cleanest cities."
    },
    "canberra": {
        "climate": "Four distinct Australian seasons—hot dry summers, cold winters by Aussie standards (near freezing). Bushfire smoke affects summer air quality.",
        "cost": "Public servant salaries inflate prices—$3800/month for comfortable living. Housing is expensive. Food and entertainment reasonable.",
        "wifi": "Excellent Australian NBN infrastructure—100+ Mbps standard. Purpose-built capital means modern connectivity throughout.",
        "nightlife": "Genuinely quiet. Politicians and public servants don't party hard. A few bars in Civic, but Sydney and Melbourne are where Aussies go for nightlife.",
        "nature": "Surrounded by bush—national parks, mountains, and wildlife. Kangaroos on golf courses are normal. Excellent outdoor access for a capital city.",
        "safety": "Extremely safe—wealthy, stable, purpose-built city. One of Australia's safest. Crime is minimal. Relaxed atmosphere throughout.",
        "food": "Multicultural public servant population brings diverse dining. Quality restaurants exist despite small size. Asian cuisine particularly strong.",
        "community": "Not a nomad destination. International embassies bring some expats. Academic community at ANU. You'll need to build connections deliberately.",
        "english": "Australian English—friendly, informal, native speakers. International community from embassies and universities.",
        "visa": "Australian visa complexity. Tourist visits straightforward. Working requires sponsorship. No specific nomad visa exists.",
        "culture": "Purpose-built capital with national institutions—War Memorial, National Gallery, Parliament House. Politics and public service define the city's identity.",
        "cleanliness": "Immaculate planned city. Wide streets, maintained gardens, efficient services. Purpose-built cleanliness throughout.",
        "airquality": "Excellent normally, but bushfire season brings hazardous smoke. Summer 2019-20 saw world's worst air quality. Seasonal risk is real."
    },
    "capetown": {
        "climate": "Mediterranean perfection—warm dry summers, mild wet winters. Table Mountain creates microclimates. Best weather is November-March.",
        "cost": "Good value at $2500/month with favorable exchange rate. Wine country living at emerging market prices. Quality varies by neighborhood.",
        "wifi": "Load shedding (power cuts) challenges connectivity. When power works, 50-100 Mbps available. Backup power essential for remote work reliability.",
        "nightlife": "Vibrant scene from Long Street bars to Camps Bay beach clubs. Wine culture, craft beer, and rooftop venues. Diverse and energetic.",
        "nature": "Absolutely stunning—Table Mountain, Cape Point, wine valleys, whale watching, penguin beaches. One of Earth's most beautiful city settings.",
        "safety": "Real concerns exist. Township violence, car-jacking, and property crime require attention. Tourist areas safer. Research neighborhoods, don't walk at night.",
        "food": "Incredible fusion—Cape Malay, African, colonial influences meet world-class wine country dining. Braai (BBQ) culture, seafood, and Michelin options.",
        "community": "Growing remote work scene. Seminyak-meets-wine-country vibe in suburbs like Sea Point. International community present. English is native.",
        "english": "One of South Africa's 11 official languages and dominant in Cape Town. No language barrier whatsoever.",
        "visa": "90 days visa-free for most. South Africa has no nomad visa but remote work in tourist status is common. Extensions possible.",
        "culture": "Complex history—Dutch colonial, British, apartheid legacy, and African renaissance. District Six, Robben Island, and Bo-Kaap tell important stories.",
        "cleanliness": "Varies dramatically by area. Affluent suburbs immaculate. Township conditions differ completely. Uneven but improving.",
        "airquality": "Excellent—ocean breezes and limited industry. One of the world's cleanest cities for air quality when fires aren't active."
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
    print("Updating category descriptions for batch 2 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH2_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH2_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

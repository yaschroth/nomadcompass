#!/usr/bin/env python3
"""
Update category descriptions for batch 1 cities with unique, compelling content.
"""

import re
import json
import os

# Base path
CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

# Unique descriptions for batch 1 cities
BATCH1_DESCRIPTIONS = {
    "aixenprovence": {
        "climate": "Sun-drenched Provence delivers 300 days of Mediterranean brilliance. Summers are hot and dry, perfect for working from shaded terraces. Mild winters rarely dip below 5°C.",
        "cost": "Refined living at €3000/month reflects Provence's prestige. Housing in the historic center commands premium prices, but you're paying for Cézanne's backyard and world-class quality of life.",
        "wifi": "French fiber has reached Provence—expect 100+ Mbps in most accommodations. University town infrastructure means reliable connectivity, though some charming old buildings have thicker walls than signals.",
        "nightlife": "Aix's scene is sophisticated rather than wild. Wine bars on Cours Mirabeau, jazz clubs in cellars, and summer music festivals define the vibe. Students keep things lively during term time.",
        "nature": "Lavender fields of Luberon, the dramatic Gorges du Verdon, and Sainte-Victoire mountain (Cézanne's muse) all within an hour. Calanques beaches near Marseille offer Mediterranean swimming.",
        "safety": "One of France's safest cities. Wealthy, well-policed, and genuinely relaxed. Pickpockets target tourist spots in summer, but violent crime is virtually nonexistent.",
        "food": "Provençal cuisine at its source—ratatouille, bouillabaisse, tapenade. Markets overflow with olive oil, lavender honey, and local wines. Michelin stars meet rustic bistros.",
        "community": "More artists and retirees than digital nomads. The coworking scene is nascent but growing. You'll likely bond with expats and university researchers rather than fellow remote workers.",
        "english": "French dominates here—this isn't Paris. University students speak decent English, but shopkeepers and locals expect French. A few phrases go a long way toward warmer welcomes.",
        "visa": "90-day Schengen access, with France's new digital nomad visa available for longer stays. The French bureaucracy is legendary—start paperwork early and bring patience.",
        "culture": "Cézanne's studio, ancient Roman baths, baroque fountains on every corner. Opera festivals, art galleries, and the literary café culture that defined French intellectual life.",
        "cleanliness": "Immaculately maintained—the French take civic pride seriously. Cobblestone streets are swept daily, fountains sparkle, and graffiti is rare outside designated areas.",
        "airquality": "Pristine Provençal air, especially outside summer. Mistral winds clear pollution naturally. Occasional wildfire smoke in dry seasons is the only concern."
    },
    "alexandria": {
        "climate": "Mediterranean Egypt means mild winters and hot, humid summers. Sea breezes moderate Alexandria's heat compared to Cairo. November to April offers the most comfortable working weather.",
        "cost": "Remarkably affordable at $1100/month. Your budget stretches far—seafood dinners for $5, apartments for $300. One of the best value propositions in the Mediterranean region.",
        "wifi": "Egypt's internet is improving but inconsistent. Expect 15-40 Mbps in better areas, with occasional outages. Mobile data (Vodafone/Orange) provides essential backup for important calls.",
        "nightlife": "Conservative compared to Western cities, but Alexandria has its charms. Corniche cafés, shisha lounges, and a few underground bars cater to the young professional crowd.",
        "nature": "Mediterranean beaches stretch for miles along the Corniche. Day trips to the Western Desert oases or Nile Delta villages offer contrast. Swimming is popular but beaches vary in quality.",
        "safety": "Generally safe with cultural awareness. Dress conservatively, avoid political discussions, and respect local customs. Solo female travelers should exercise extra caution.",
        "food": "Egyptian coastal cuisine shines here—fresh grilled fish, ful medames, koshari, and legendary seafood restaurants. The food scene is authentic, generous, and incredibly affordable.",
        "community": "Virtually no established nomad community. You'll be pioneering here. Expats exist in small numbers, mostly teachers and NGO workers. Arabic skills open many doors.",
        "english": "Limited English outside tourist zones and upscale hotels. Arabic is essential for daily life. Younger educated Egyptians speak English, but don't assume it.",
        "visa": "30-day visa on arrival for most nationalities, extendable at immigration offices. Process can be bureaucratic but manageable. Consider applying for longer tourist visas in advance.",
        "culture": "Where the Great Library once stood, Cleopatra ruled, and Greek, Roman, and Arab civilizations collided. The new Bibliotheca Alexandrina honors this legacy with world-class exhibitions.",
        "cleanliness": "Urban Egyptian reality—dusty streets, inconsistent garbage collection, and buildings in various states of repair. Main tourist areas are better maintained.",
        "airquality": "Better than Cairo but still affected by traffic and regional dust. Sea breezes help. Summer humidity can feel heavy. Not a major concern for most visitors."
    },
    "amman": {
        "climate": "High desert climate means hot, dry summers and cool winters. Spring and fall are ideal—comfortable temperatures perfect for exploring. Summer afternoons demand air conditioning.",
        "cost": "Solid value at $1800/month. Western Amman is pricier, but overall living costs are reasonable. Eating out is affordable; housing varies widely by neighborhood.",
        "wifi": "Jordan has invested in connectivity—fiber reaches many areas with 50-100 Mbps. Coffee shops and hotels generally reliable. Mobile data (Zain/Orange) works well as backup.",
        "nightlife": "Sophisticated café culture and rooftop bars dominate. Rainbow Street offers the liveliest scene. Alcohol is available but expensive. Social life centers on shisha cafés and restaurants.",
        "nature": "Gateway to Petra, Wadi Rum, and the Dead Sea—some of Earth's most otherworldly landscapes. Weekend adventures are extraordinary. Local hiking in nearby valleys is underrated.",
        "safety": "One of the Middle East's safest capitals. Jordanians are famously hospitable. Political stability and strong security presence. Female travelers report feeling comfortable here.",
        "food": "Levantine cuisine paradise—mansaf (Jordan's national dish), falafel, hummus, and mezze platters. Street food is excellent and safe. Arabic coffee culture is ritualistic.",
        "community": "Small but growing remote work scene, often connected to NGOs and development work. Few dedicated coworking spaces, but hotel lobbies and cafés accommodate laptop workers.",
        "english": "Widely spoken in educated circles and tourist areas. Jordanians are among the most English-proficient in the Arab world. Arabic helps but isn't essential.",
        "visa": "Visa on arrival for most nationalities, or included in Jordan Pass (which covers Petra). Extensions available. One of the easier Middle Eastern countries for visa logistics.",
        "culture": "Ancient Amman sits on seven hills like Rome. Roman amphitheater, citadel ruins, and the contrast of Bedouin traditions meeting modern Arab cosmopolitanism.",
        "cleanliness": "Improving but uneven. Upscale areas are well-maintained; older neighborhoods show wear. Dust is constant—desert environment means regular cleaning.",
        "airquality": "Generally good, though dust storms occur seasonally. Traffic congestion affects downtown. Compared to regional capitals, Amman breathes relatively easy."
    },
    "amsterdam": {
        "climate": "Maritime weather means grey skies, frequent rain, and mild temperatures year-round. Summers are pleasant (15-25°C), winters damp and dark. Vitamin D supplements recommended.",
        "cost": "Eye-wateringly expensive at €4200/month. Housing crisis means €2000+ for a decent flat. Budget carefully—this is one of Europe's priciest cities for nomads.",
        "wifi": "Dutch infrastructure is outstanding—200+ Mbps fiber is standard. Cafés have excellent connections. The Netherlands consistently ranks among Europe's best for internet quality.",
        "nightlife": "Legendary and varied. From techno clubs in industrial spaces to cozy brown cafés, comedy clubs to jazz bars. The Red Light District is just one facet of a diverse scene.",
        "nature": "Flat and green—cycling through tulip fields and windmill country is iconic. Beaches at Zandvoort within 30 minutes. Don't expect mountains, but canals and parks abound.",
        "safety": "Very safe by global standards. Bike theft is rampant—invest in serious locks. Tourist areas see pickpockets. Violent crime is rare; common sense suffices.",
        "food": "Indonesian rijsttafel, Surinamese roti, and global cuisines reflect colonial history. Dutch classics (bitterballen, stroopwafels) charm visitors. Food halls and markets thrive.",
        "community": "Massive international community, though nomads compete with tech workers and creatives. Coworking spaces everywhere. Meetups happen daily. You'll find your tribe.",
        "english": "Essentially universal—Dutch people speak better English than many native speakers. You can live here for years without learning Dutch, though locals appreciate the effort.",
        "visa": "90-day Schengen for most. DAFT treaty benefits Americans and Japanese. New Dutch digital nomad visa emerging. Work permits otherwise challenging.",
        "culture": "Van Gogh, Rembrandt, Anne Frank—history permeates the canal houses. World-class museums, legendary music venues, and a progressive social scene that shaped modern liberalism.",
        "cleanliness": "Tidy despite the party reputation. Streets are clean, canals maintained, and recycling taken seriously. Some graffiti adds character rather than grime.",
        "airquality": "Good overall, though traffic and industry affect levels. Sea breezes help. Among the better European capitals for air quality."
    },
    "antigua": {
        "climate": "Highland tropical paradise—eternal spring at 1500m elevation. Days warm (20-25°C), nights cool. Dry season (Nov-Apr) is ideal; wet season brings afternoon thunderstorms.",
        "cost": "Excellent value at $1800/month. Colonial charm on a budget—beautiful apartments for $600, meals for $3-5. One of Central America's best deals.",
        "wifi": "Guatemala's internet lags behind—expect 10-30 Mbps in most places. Coworking spaces and better hotels offer more reliable connections. Power outages occasionally disrupt service.",
        "nightlife": "Small-town charm with surprising energy. Bars around the central park, rooftop lounges with volcano views, and weekend dance clubs. Backpacker crowd keeps things lively.",
        "nature": "Three volcanoes ring the city—Acatenango and Fuego are bucket-list hikes. Coffee plantations, Lake Atitlán nearby, and Maya highland villages offer weekend adventures.",
        "safety": "Safer than Guatemala's reputation suggests, but not carefree. Tourist police patrol main areas. Avoid walking alone late at night. Petty theft occurs; violent crime is rare for visitors.",
        "food": "Guatemalan classics meet expat influences. Pepián, tamales, fresh tortillas, plus international options. Street food is cheap and delicious. Coffee is world-class—you're at the source.",
        "community": "Established Spanish-school scene brings rotating visitors. Small nomad community growing around coworking spaces. Mix of long-term expats, language learners, and travelers.",
        "english": "Tourism-dependent town means English works in restaurants and hotels. Beyond tourist zones, Spanish is essential. Language schools make learning easy and affordable.",
        "visa": "90 days visa-free for most nationalities (CA-4 region). Border runs to Mexico or Belize reset your stay. Long-term options through retirement or business visas.",
        "culture": "UNESCO World Heritage colonial architecture—crumbling churches, cobblestone streets, and baroque facades against volcanic backdrops. Holy Week processions are spectacular.",
        "cleanliness": "Charming but dusty. Colonial streets are swept but infrastructure is aging. Earthquake damage visible in some areas. Picturesque rather than pristine.",
        "airquality": "Generally excellent at altitude. Occasional volcanic ash when Fuego erupts actively. Dry season can bring dust. Mountain air is refreshing."
    },
    "antwerp": {
        "climate": "Belgian grey dominates—expect clouds, drizzle, and mild temperatures. Summers pleasant (15-23°C), winters damp and dark. Similar to Amsterdam, slightly less wet.",
        "cost": "Expensive but not crushing at €2800/month. Cheaper than Amsterdam or Brussels. Housing in trendy districts (Zuid, Eilandje) commands premiums.",
        "wifi": "Belgian infrastructure delivers—100+ Mbps widely available. Cafés and coworking spaces offer solid connections. No complaints for remote work needs.",
        "nightlife": "Underground electronic scene rivals Berlin. Historic bars in medieval cellars, design-forward cocktail spots, and a thriving LGBTQ+ scene. Less tourist-oriented than Brussels.",
        "nature": "Flat Flemish countryside for cycling. North Sea beaches at Knokke within an hour. Kempen forests offer hiking. Urban parks are well-maintained.",
        "safety": "Generally safe European city. Some areas around Centraal Station require awareness at night. Bike theft common. Overall secure for daily life.",
        "food": "Belgian classics—moules-frites, stoofvlees, waffles—plus Michelin-starred innovation. Chocolate shops on every corner. Beer culture is a UNESCO-recognized tradition.",
        "community": "Smaller than Brussels' nomad scene but growing. Fashion and diamond industries bring creative types. English-speaking expat community is established.",
        "english": "Excellent English proficiency—Flemish people switch effortlessly. Dutch appreciated but unnecessary. International business language dominates.",
        "visa": "90-day Schengen standard. Belgium offers no specific nomad visa but has self-employed options. EU freelancer routes possible with paperwork.",
        "culture": "Rubens' hometown flaunts Flemish Baroque masterpieces. MAS museum, fashion district, and diamond quarter define the city. Design culture runs deep.",
        "cleanliness": "Well-maintained Flemish tidiness. Historic center is pristine; industrial areas show character. Belgian pride in public spaces is evident.",
        "airquality": "Average for industrial European city. Port activity and traffic affect levels. Not a major concern but not alpine fresh."
    },
    "arequipa": {
        "climate": "High desert sunshine—300+ days of clear skies at 2300m elevation. Warm days, cool nights. Minimal rain makes it one of Peru's most pleasant climates.",
        "cost": "Exceptional value at $1400/month. Colonial living for budget prices—nice apartments for $350, lunches for $2. Peru's second city without the Lima premiums.",
        "wifi": "Peruvian internet improving but uneven. Expect 15-40 Mbps in central areas. Coworking spaces offer better reliability. Mobile data provides backup.",
        "nightlife": "University town energy—bars around Plaza de Armas, peñas with live folk music, rooftop terraces with volcano views. More relaxed than Lima's scene.",
        "nature": "Colca Canyon (twice the depth of Grand Canyon), Misti volcano looming overhead, vicuña-dotted highlands. Gateway to some of South America's most dramatic landscapes.",
        "safety": "Safer than Lima and most Peruvian cities. Tourist areas well-patrolled. Standard precautions apply—don't flash valuables. Altitude sickness is a bigger concern than crime.",
        "food": "Arequipeño cuisine is Peru's proudest regional tradition. Rocoto relleno, chupe de camarones, and picanterías serving generations-old recipes. Culinary destination.",
        "community": "Small nomad presence growing among Spanish learners and adventure travelers. Few dedicated coworking spaces but cafés accommodate. You'll know the regulars quickly.",
        "english": "Limited outside tourism industry. Spanish essential for daily life. Arequipeños are patient with learners. Language schools available.",
        "visa": "183 days visa-free for most nationalities—generous by global standards. Extensions possible. Peru's immigration is straightforward.",
        "culture": "The 'White City' built from volcanic sillar stone. Santa Catalina monastery, colonial churches, and indigenous Collagua heritage. UNESCO-recognized historic center.",
        "cleanliness": "Central historic area is well-maintained. Outer neighborhoods vary. Altitude means less humidity and dust. Generally pleasant urban environment.",
        "airquality": "Excellent—high altitude, clear desert air, minimal industry. One of Peru's cleanest cities. The thin air is noticeable but pure."
    },
    "athens": {
        "climate": "Classic Mediterranean—hot, dry summers (35°C+) and mild, rainy winters. Spring and fall are ideal for working. Air conditioning essential June-August.",
        "cost": "Moderate at €2400/month—affordable by Western European standards. Housing prices rising post-crisis but still reasonable. Eating out is cheap; groceries normal.",
        "wifi": "Greek infrastructure has improved significantly. 50-100 Mbps available in most areas. Cafés vary—some excellent, some frustrating. Fiber expanding rapidly.",
        "nightlife": "Legendary scene from rooftop bars overlooking the Acropolis to underground clubs in Gazi. Greeks dine at 10pm, party until dawn. Summer moves to beach clubs.",
        "nature": "Beach day trips to Aegean islands, hiking Mount Hymettus, and the Athens Riviera. Not wilderness-adjacent but sea access is easy. Weekend ferry escapes are a lifestyle.",
        "safety": "Generally safe but street crime has increased with economic hardship. Pickpockets target metro and tourist sites. Omonia area requires caution at night.",
        "food": "Taverna culture at its source—grilled octopus, moussaka, fresh fish, and endless mezze. Street souvlaki is €2.50 and perfect. Wine flows freely and cheaply.",
        "community": "Growing nomad scene post-COVID. Greeks have embraced remote work culture. Coworking spaces multiplying. Expat community established in Koukaki and Pangrati.",
        "english": "Widely spoken, especially by younger Greeks. Tourism-dependent economy ensures English works. Greeks appreciate any Greek phrases you attempt.",
        "visa": "90-day Schengen standard. Greece offers digital nomad visa with €3500/month income requirement. Straightforward process compared to other EU countries.",
        "culture": "The birthplace of Western civilization doesn't need description. Acropolis, Ancient Agora, and 3000 years of history visible on every street. Museums overflow.",
        "cleanliness": "Graffiti covers every surface—it's a culture, not crime. Streets are swept but feel urban. Some areas are rough around edges. Character over sterility.",
        "airquality": "Summer heat creates smog conditions. Traffic pollution affects the basin. Winter is cleaner. Not Athens' strongest category."
    },
    "austin": {
        "climate": "Texas heat is real—summers brutal (35-40°C), but spring and fall are magnificent. Air conditioning is life support May-September. Mild winters rarely see frost.",
        "cost": "Tech boom prices at $4000/month. Austin was affordable until everyone discovered it. Housing market is competitive. Food and entertainment remain reasonable.",
        "wifi": "American infrastructure means 100-300 Mbps standard. Cafés, libraries, and coworking spaces all deliver. Connectivity is never a concern.",
        "nightlife": "Live Music Capital of the World delivers nightly. 6th Street parties hard, South Congress stays classy, East Austin gets weird. SXSW transforms the city annually.",
        "nature": "Hill Country lakes, Barton Springs swimming, Lady Bird Lake kayaking. Not wilderness but excellent urban outdoor options. Weekend drives to Big Bend offer real adventure.",
        "safety": "Safe by American city standards. Property crime in trendy areas. Homeless population visible downtown. Gun culture is Texan normal—adjust expectations.",
        "food": "BBQ pilgrimage destination—Franklin's lines start at 6am for a reason. Tacos for every meal. Farm-to-table scene thrives. Food trucks everywhere.",
        "community": "Massive tech and creative community. Coworking options abundant. Meetups daily. 'Keep Austin Weird' culture welcomes oddballs and entrepreneurs alike.",
        "english": "It's Texas—English dominates. Spanish is widely spoken given proximity to Mexico. International community growing but this is heartland America.",
        "visa": "US visa complexity applies. ESTA for short visits, B1/B2 for longer tourism. Working legally requires sponsorship or existing status. No nomad visa exists.",
        "culture": "Live music heritage, quirky 'weird' identity, tech optimism, and Texan friendliness. Museums are good, but the culture lives in honky-tonks and taco joints.",
        "cleanliness": "Clean American suburb standards in most areas. Downtown sees urban challenges. Texans take pride in property maintenance.",
        "airquality": "Generally good, though allergy season is brutal (cedar fever is real). Summer heat creates ozone warnings. Traffic impact minimal compared to Houston."
    },
    "bali": {
        "climate": "Tropical with distinct wet and dry seasons. April-October is ideal—warm and dry. Wet season brings daily downpours but stays warm. Humidity is constant.",
        "cost": "Variable at $2000/month. Canggu digital nomad pricing has inflated. Ubud and less trendy areas offer better value. You can do $1200 or $4000 depending on lifestyle.",
        "wifi": "Hit or miss—fiber exists but isn't universal. Coworking spaces (Dojo, Outpost) deliver 50+ Mbps. Villa WiFi varies wildly. Mobile data essential as backup.",
        "nightlife": "Canggu beach clubs and Seminyak nightlife cater to every taste. Full moon parties, sunset sessions, and rooftop bars. The scene is young, international, and relentless.",
        "nature": "Rice terraces, volcano treks, waterfall chasing, and world-class diving. Bali packs extraordinary natural beauty into a small island. Beach and jungle both accessible.",
        "safety": "Safe for tourists with cultural awareness. Scooter accidents are the biggest risk—seriously. Petty theft occurs. Respect temples and traditions.",
        "food": "Indonesian staples (nasi goreng, satay) meet global health-food trends. Smoothie bowls became a cliché here. Local warungs offer $2 meals; expat cafés charge Western prices.",
        "community": "Ground zero for the digital nomad movement. Coworking spaces overflow. Instagram entrepreneurs everywhere. Community is massive but can feel superficial.",
        "english": "Tourist English is excellent in Canggu/Ubud/Seminyak. Beyond tourist zones, Bahasa Indonesia helps significantly. Younger Balinese speak English well.",
        "visa": "30-day visa-free extendable to 60 days. B211A social visa allows longer stays. Visa runs to Singapore are a ritual. New digital nomad visa in development.",
        "culture": "Hindu Bali in Muslim Indonesia is unique. Temple ceremonies, offerings (canang sari), and artistic traditions are living culture—not museum pieces. Respect is essential.",
        "cleanliness": "Plastic pollution is a real problem. Tourist areas are maintained; rivers and beaches suffer. Trash management is Bali's great challenge.",
        "airquality": "Generally good, though burning season and traffic in crowded areas affect it. Ocean breezes help. Better than mainland Southeast Asian cities."
    }
}

def update_city_descriptions(city_id, descriptions):
    """Update the CATEGORY_DESCRIPTIONS in a city's HTML file."""
    filepath = os.path.join(CITIES_DIR, f"{city_id}.html")

    if not os.path.exists(filepath):
        print(f"  File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and replace the CATEGORY_DESCRIPTIONS object
    pattern = r'const CATEGORY_DESCRIPTIONS = \{[^}]+\};'

    # Build the new descriptions JSON
    new_descriptions_json = json.dumps(descriptions, ensure_ascii=False)
    new_line = f'const CATEGORY_DESCRIPTIONS = {new_descriptions_json};'

    # Replace
    new_content, count = re.subn(pattern, new_line, content)

    if count == 0:
        print(f"  Pattern not found in {city_id}.html")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  Updated {city_id}.html")
    return True


def main():
    print("Updating category descriptions for batch 1 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH1_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH1_DESCRIPTIONS)} cities")


if __name__ == "__main__":
    main()

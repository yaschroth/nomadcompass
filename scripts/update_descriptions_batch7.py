#!/usr/bin/env python3
"""
Update category descriptions for batch 7 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH7_DESCRIPTIONS = {
    "cappadocia": {
        "climate": "Central Anatolian extremes—hot dry summers (30°C+), cold snowy winters. Perfect balloon weather in spring and fall. Pack for temperature swings.",
        "cost": "Budget paradise at $1200/month. Cave hotels for $50/night. Turkey's favorable exchange rate stretches budgets far.",
        "wifi": "Turkish rural infrastructure—30-50 Mbps in good hotels. Some areas patchy. Mobile data essential backup. Improving but inconsistent.",
        "nightlife": "Peaceful region—rooftop terraces watching balloons, hotel restaurants, and quiet evenings. Not a nightlife destination. Come for landscapes.",
        "nature": "Otherworldly—fairy chimneys, underground cities, and lunar landscapes. Hiking through valleys, balloon rides at dawn. Earth's strangest beauty.",
        "safety": "Very safe Turkish region. Tourist-friendly, well-policed. Walking comfortable day or night. Welcoming atmosphere.",
        "food": "Turkish regional cuisine—pottery kebab, manti dumplings, and fresh bread. Wine production (Cappadocia is wine country). Hearty and affordable.",
        "community": "Minimal nomad presence. Tourists and travel photographers dominate. Very few remote workers. Turkish language essential for any extended stay.",
        "english": "Tourist English in hotels and restaurants. Beyond that, Turkish essential. Learn basics for meaningful interaction.",
        "visa": "Turkish e-visa for most nationalities. 90 days in 180. Straightforward process. Extensions possible in major cities.",
        "culture": "Byzantine churches carved into rock, underground cities, and living cave dwellings. History literally surrounds you. UNESCO protection preserves the magic.",
        "cleanliness": "Tourist areas maintained for visitors. Rural Turkish character. Dusty landscape nature, not neglect.",
        "airquality": "Excellent—rural location, minimal industry. Clean Anatolian plateau air. Dust in dry season but generally pristine."
    },
    "cartagena": {
        "climate": "Caribbean tropical year-round—hot and humid (28-32°C). Wet season (Sep-Nov) brings afternoon rain. Heat is constant. AC is essential.",
        "cost": "Moderate at $2000/month. Tourist economy inflates prices above Colombian norms. Old town premium exists. Beach areas cheaper.",
        "wifi": "Colombian infrastructure—40-70 Mbps in good areas. Old walled city can challenge signals. Coworking spaces more reliable.",
        "nightlife": "Salsa on the street, rooftop bars, and clubs in Getsemaní. Caribbean rhythm drives the scene. Tourist-oriented but genuinely fun.",
        "nature": "Caribbean beaches, Rosario Islands for diving, and mangroves. Playa Blanca day trips. Beautiful but heavily touristed.",
        "safety": "Tourist areas well-patrolled but awareness needed. Scams target visitors. Jewelry snatching occurs. Research neighborhoods.",
        "food": "Caribbean Colombian fusion—ceviche, coconut rice, fried fish, and tropical fruits. Seafood excellent and affordable. Street arepa stalls.",
        "community": "Established expat presence. Beach bars bring seasonal visitors. Small year-round nomad community. Spanish helps enormously.",
        "english": "Tourist services in English. Beyond that, Spanish essential. Colombian warmth transcends language barriers.",
        "visa": "90 days visa-free, easily extended. Colombia welcomes remote workers informally. Border runs to Panama if needed.",
        "culture": "UNESCO walled city—colonial architecture, Caribbean colors, and Gabriel García Márquez associations. Magical realism made tangible.",
        "cleanliness": "Old town well-maintained for tourism. Some areas rougher. Tropical heat creates challenges. Tourist economy drives standards.",
        "airquality": "Caribbean sea breezes help. Urban traffic affects levels. Generally acceptable. Humidity more noticeable than pollution."
    },
    "chania": {
        "climate": "Greek island Mediterranean—hot dry summers (30°C+), mild wet winters. Swimming season April-October. Ideal May-June and September.",
        "cost": "Moderate at €2200/month. Cheaper than Athens. Seasonal tourism inflates summer prices. Off-season bargains exist.",
        "wifi": "Greek island infrastructure—30-60 Mbps typical. Some old town buildings challenging. Improving but not fiber quality.",
        "nightlife": "Venetian harbor bars, waterfront dining, and summer beach clubs. Greek island vibes—relaxed rather than wild. Tourist-oriented.",
        "nature": "Samaria Gorge hiking (Europe's longest), beaches everywhere, and White Mountains. Spectacular outdoor access. Nature is the attraction.",
        "safety": "Very safe Greek island. Tourist-friendly, welcoming atmosphere. Walk anywhere without concern. Greek hospitality genuine.",
        "food": "Cretan cuisine—fresh seafood, olive oil, dakos salad, and mountain herbs. Mediterranean diet at its source. Healthy and delicious.",
        "community": "Small expat presence, mostly retirees. Minimal nomad infrastructure. Pioneer territory. Greek helps for integration.",
        "english": "Good in tourist areas. Younger Greeks speak English. Some older locals Greek-only. Tourist infrastructure functions.",
        "visa": "90-day Schengen standard. Greece's digital nomad visa available with income requirements. Island life possible long-term.",
        "culture": "Venetian-Ottoman layers—harbor lighthouse, old town mosques, and Orthodox churches. Living history. Archaeological sites nearby.",
        "cleanliness": "Tourist areas maintained. Old town charming rather than pristine. Greek island standards. Pleasant overall.",
        "airquality": "Excellent—island breezes, minimal industry. Mediterranean clean air. Among Greece's healthiest environments."
    },
    "chiangmai": {
        "climate": "Northern Thai tropical with burning season (Feb-Apr) air quality crisis. Cool season (Nov-Feb) is ideal at 15-25°C. Hot season (Mar-May) brutal.",
        "cost": "Budget legend at $1600/month. Street food for $1, nice condos for $400. The original nomad budget destination.",
        "wifi": "Thai internet has improved—50-100 Mbps in condos, cafés designed for nomads. Punspace and coworking spaces deliver. Reliable overall.",
        "nightlife": "Night bazaar energy, rooftop bars, and Nimmanhaemin hipster scene. Sunday walking street is magic. Not Bangkok-level but sufficient.",
        "nature": "Doi Suthep mountain temple, waterfalls, elephant sanctuaries, and jungle trekking. Excellent nature access for a city.",
        "safety": "Very safe Thai city. Friendly, welcoming, and relaxed. Scooter accidents the main risk. Respect the King.",
        "food": "Northern Thai excellence—khao soi (curry noodles), sai ua sausage, and night market grazing. Food is the highlight. Cheap and extraordinary.",
        "community": "THE original digital nomad hub. Community is massive and established. Meetups daily. Coworking scenes everywhere. Friends within hours.",
        "english": "Nomad English is excellent—service industry caters to remote workers. Beyond expat bubble, Thai helps. More English than anywhere in Thailand outside Bangkok.",
        "visa": "60-day visa-free extendable to 90. LTR visa for qualified professionals. Elite visa expensive option. Visa runs to Laos are ritual.",
        "culture": "300 temples, Lanna heritage, and living Buddhist traditions. Morning alms giving, meditation retreats, and craft villages. Spiritual and artistic.",
        "cleanliness": "Mixed—Nimmanhaemin modern, old town shows wear. Thai standards apply. Some areas cleaner than others.",
        "airquality": "CRISIS level February-April. Burning season PM2.5 exceeds safe levels dramatically. Masks essential. Rest of year acceptable."
    },
    "chiangrai": {
        "climate": "Northern Thai with cooler temperatures than Chiang Mai. Pleasant cool season, hot March-May. Burning season affects air but less severe.",
        "cost": "Exceptional value at $1200/month. Quieter than Chiang Mai means lower prices. Budget paradise.",
        "wifi": "Provincial Thai internet—30-60 Mbps typical. Improving but not Chiang Mai level. Cafés and hotels vary.",
        "nightlife": "Very quiet—this is temple town, not party destination. Night markets, quiet bars, and early nights. Come for temples.",
        "nature": "Golden Triangle, Mekong River views, and mountain borders with Laos and Myanmar. Trekking and nature excellent.",
        "safety": "Very safe Thai province. Friendly, welcoming atmosphere. Border areas are fine for tourists. Relaxed and secure.",
        "food": "Northern Thai cuisine similar to Chiang Mai—khao soi, sai ua, and regional specialties. Cheaper and equally delicious.",
        "community": "Minimal nomad presence. Artists and spiritual seekers. Very small expat community. Thai language helpful.",
        "english": "Limited—rural Thailand reality. Tourist sites have some English. Daily life needs Thai basics.",
        "visa": "Same Thai visa rules apply. 60 days extendable. Less visa run infrastructure than Chiang Mai.",
        "culture": "White Temple (Wat Rong Khun), Blue Temple, and Black House art installation. Contemporary Buddhist art meets ancient traditions. Visually extraordinary.",
        "cleanliness": "Thai provincial standards. Tourist sites maintained. Small-town character. Pleasant overall.",
        "airquality": "Burning season affects but less severe than Chiang Mai. Mountain location helps. Generally acceptable."
    },
    "chicago": {
        "climate": "Brutal extremes—winters are legendary cold (-20°C with wind chill), summers hot and humid. Spring and fall are brief but beautiful. Lake effect intensifies everything.",
        "cost": "Expensive American at $4000/month. Cheaper than NYC or SF but not cheap. Loop and North Side premium.",
        "wifi": "American infrastructure excellence—100-300 Mbps standard. Cafés, libraries, coworking all deliver. No concerns.",
        "nightlife": "Blues bars, jazz clubs, and neighborhood dive bars. Wrigleyville sports energy. Second City comedy. Diverse and genuine.",
        "nature": "Lake Michigan waterfront, extensive parks, and prairie preserves. Urban nature access solid. Michigan dunes for weekend escapes.",
        "safety": "Neighborhood dependent—research carefully. Tourist areas (Loop, Near North) fine. South and West sides have challenges. Awareness essential.",
        "food": "Deep-dish pizza, hot dogs, Italian beef, and global cuisines. Food city with genuine personality. Mexican Pilsen, Polish neighborhoods, and fine dining.",
        "community": "Tech and creative community established. Coworking scenes in West Loop and River North. Networking active. Friendly Midwest vibes.",
        "english": "American English—Midwest accent is friendliest. Diverse immigrant communities. No language barrier.",
        "visa": "US visa complexity. ESTA for tourism. Working requires sponsorship. No nomad visa exists.",
        "culture": "Architecture pilgrimage—Frank Lloyd Wright, skyscraper birthplace, and lakefront beauty. Art Institute world-class. Blues and jazz heritage. Sports tribalism.",
        "cleanliness": "Downtown maintained; neighborhoods vary. American urban standard. Some areas challenge perception.",
        "airquality": "Lake breezes help. Industrial history cleaned up. Generally good for major American city."
    },
    "coimbra": {
        "climate": "Portuguese inland—hot summers (35°C+), mild wet winters. Mediterranean without sea moderation. Four seasons.",
        "cost": "Excellent value at €1800/month. Cheaper than Lisbon or Porto. Student economy keeps prices reasonable.",
        "wifi": "Portuguese infrastructure—60-80 Mbps typical. University presence helps. Cafés accommodate working.",
        "nightlife": "Student energy—academic tradition includes drinking. Fado houses, student bars, and graduation ceremonies (queima das fitas). Unique vibes.",
        "nature": "Serra da Estrela mountains nearby, Mondego River valley. Not spectacular but pleasant Portuguese countryside.",
        "safety": "Very safe Portuguese city. University atmosphere is welcoming. Walk anywhere comfortably. Relaxed and friendly.",
        "food": "Portuguese comfort food—chanfana (goat stew), local wines, and pastéis. Student budget-friendly. Authentic rather than tourist.",
        "community": "University dominates. International students exist but few nomads. Portuguese language essential for integration.",
        "english": "University brings some English speakers. Tourist services manageable. Daily life benefits from Portuguese.",
        "visa": "90-day Schengen standard. Portugal's D7 visa or digital nomad visa available. Portuguese bureaucracy moderate.",
        "culture": "World's oldest university in continuous operation. Academic traditions (black capes, fado singing), medieval old town, and intellectual heritage.",
        "cleanliness": "University pride keeps standards high. Historic center well-maintained. Pleasant Portuguese city.",
        "airquality": "Inland location—hot and dry summers. No major pollution sources. Generally healthy environment."
    },
    "cologne": {
        "climate": "Rhine Valley mild—oceanic influence means no extremes. Grey and damp. Carnival season (February) is cold but festive.",
        "cost": "Moderate German at €2800/month. Cheaper than Munich or Frankfurt. Good value for quality of life.",
        "wifi": "German infrastructure—100+ Mbps standard. Reliable connectivity throughout. Cafés and coworking spaces accommodate.",
        "nightlife": "Legendary Kölsch beer culture—small glasses refilled automatically. Carnival is world-famous. LGBTQ+ scene strong. Genuine fun.",
        "nature": "Rhine River walks, nearby Eifel region for hiking. Not spectacular but pleasant. Cycling culture established.",
        "safety": "Generally safe German city. Carnival nights can get rowdy. Standard awareness. Comfortable overall.",
        "food": "Kölsch beer with Himmel un Äd (local dishes). Turkish döner, international options. German hearty fare. Brauhaus culture.",
        "community": "Creative and media industry present. Some international community. Growing tech scene. English-speaking expats exist.",
        "english": "Good in younger generation and business. Cologne is international. Daily life manageable in English.",
        "visa": "90-day Schengen standard. Germany's freelance visa established. Bureaucracy thorough but functional.",
        "culture": "Cathedral (Dom) defines the skyline—Gothic magnificence. Roman ruins, carnival tradition, and media industry. History layers visible.",
        "cleanliness": "German standards apply. Well-maintained. Some areas livelier than spotless. Quality throughout.",
        "airquality": "Rhine Valley can trap pollution. Industrial heritage cleaned up. Generally acceptable German standards."
    },
    "copenhagen": {
        "climate": "Scandinavian—cool summers (20°C), cold dark winters. Wind from the sea adds chill. Hygge exists because it's necessary.",
        "cost": "Among world's most expensive at DKK 25,000/month ($3600). Everything costs more. Budget carefully. Quality is high.",
        "wifi": "Danish excellence—200+ Mbps standard. Excellent infrastructure throughout. No connectivity concerns.",
        "nightlife": "Sophisticated—Meatpacking District bars, jazz clubs, and design-forward venues. Not wild but genuinely interesting. Sunday brunches are institution.",
        "nature": "Flat but green—cycling through parks, harbor swimming, and beach escapes nearby. Pleasant rather than dramatic. Design integration impressive.",
        "safety": "Extremely safe—leave bikes unlocked (sort of), walk anywhere at any hour. Danish trust society. Minimal concerns.",
        "food": "New Nordic cuisine capital—Noma's influence everywhere. Smørrebrød tradition, innovative restaurants, and street food markets. Quality over quantity.",
        "community": "International professionals and creatives. Design industry brings global talent. English-speaking community established. Networking active.",
        "english": "Excellent—Danes speak perfect English. Necessary for survival given Danish difficulty. International city.",
        "visa": "90-day Schengen standard. Danish startup visa exists. Work permits challenging. Nordic bureaucracy efficient.",
        "culture": "Design obsession—everything is beautiful. Tivoli Gardens, royal heritage, and contemporary architecture. Hygge philosophy. Bicycle kingdom.",
        "cleanliness": "Scandinavian pristine. Everything maintained to high standards. Pride in public spaces. Exemplary.",
        "airquality": "Excellent—Baltic location, environmental consciousness, cycling culture. Among Europe's cleanest capitals."
    },
    "crete": {
        "climate": "Greek island Mediterranean—long hot summers, mild winters. Southern Europe's warmest island. Beach season April-October.",
        "cost": "Reasonable at €2000/month. Cheaper than mainland. Seasonal pricing—summer premium, winter bargains.",
        "wifi": "Greek island infrastructure—30-60 Mbps typical. Larger towns better connected. Rural areas challenging.",
        "nightlife": "Resort-oriented in tourist areas. Local Cretan taverna culture authentic. Beach bars and clubs in Hersonissos. Varies by area.",
        "nature": "Spectacular—Samaria Gorge, pink sand beaches, mountain villages, and ancient sites. Large island means genuine wilderness. Outstanding outdoor destination.",
        "safety": "Very safe Greek island. Tourist-friendly, welcoming atmosphere. Greek hospitality genuine. Relaxed.",
        "food": "Cretan diet at the source—olive oil, wild greens, fresh fish, and mountain herbs. Raki flows freely. Healthy and delicious.",
        "community": "Expat retirement community established. Fewer nomads—island logistics challenge. Greek helps enormously.",
        "english": "Tourist areas function in English. Local villages Greek-only. Tourism infrastructure accommodates.",
        "visa": "90-day Schengen standard. Greece's digital nomad visa applies. Island logistics for bureaucracy require planning.",
        "culture": "Minoan civilization birthplace—Knossos palace is legendary. Venetian, Ottoman, and Greek layers. Archaeological paradise.",
        "cleanliness": "Tourist areas maintained. Rural areas authentic Greek character. Island pride in presentation.",
        "airquality": "Excellent—island breezes, minimal industry. Clean Mediterranean air. Among Europe's healthiest."
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
    print("Updating category descriptions for batch 7 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH7_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH7_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

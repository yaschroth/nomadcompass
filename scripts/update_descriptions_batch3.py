#!/usr/bin/env python3
"""
Update category descriptions for batch 3 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH3_DESCRIPTIONS = {
    "cuenca": {
        "climate": "Eternal spring at 2500m elevation—comfortable year-round (15-25°C). No heating or AC needed. Light afternoon rains in wet season. Perfect working weather.",
        "cost": "Exceptional value at $1400/month. Retiree haven pricing means excellent apartments for $400, full meals for $3. Ecuador uses USD—no exchange hassles.",
        "wifi": "Ecuadorian internet improving but patchy—20-50 Mbps in good areas. Fiber expanding. Backup mobile data essential for important calls.",
        "nightlife": "Quiet colonial charm—this is retiree territory. Wine bars, jazz cafés, and cultural events exist but no club scene. Early nights are the norm.",
        "nature": "Cajas National Park for highland hiking, cloud forests nearby, and river valleys. Moderate outdoor access without extreme adventure. Pleasant escapes.",
        "safety": "One of Ecuador's safest cities. Relaxed, walkable, minimal concerns. Standard awareness applies—don't display wealth. Retirees feel secure here.",
        "food": "Ecuadorian highland cuisine—hornado (roast pork), mote (hominy), and fresh fruit. International options exist but limited. Markets are excellent.",
        "community": "Large retiree expat community, smaller nomad presence. Mix of English teachers, writers, and creatives. Spanish helps enormously for integration.",
        "english": "Limited to expat businesses and educated locals. Spanish essential for daily life. Language schools available and affordable.",
        "visa": "90 days visa-free, extendable. Ecuador offers retirement and professional visas with reasonable requirements. Immigration generally straightforward.",
        "culture": "UNESCO-listed colonial center—cobblestone streets, baroque churches, and indigenous Cañari heritage. Traditional arts, Panama hats (actually Ecuadorian), and museum quality architecture.",
        "cleanliness": "Well-maintained colonial center. Some areas show wear. Generally pleasant. Elevation keeps humidity and associated issues minimal.",
        "airquality": "Excellent highland air—clean and fresh at altitude. Minimal industry, limited traffic. Breathe easy year-round."
    },
    "cusco": {
        "climate": "High altitude (3400m) means cool year-round—chilly nights near freezing, mild sunny days. Rainy season (Nov-Mar) brings afternoon downpours. Pack layers.",
        "cost": "Budget paradise at $1500/month. Machu Picchu tourism inflates some prices, but local living is incredibly affordable. Street food for $1-2.",
        "wifi": "Tourist infrastructure has driven improvement—30-60 Mbps in center. Cafés vary. Altitude and old buildings can challenge signals. Mobile backup recommended.",
        "nightlife": "Backpacker energy—Plaza de Armas bars, nightclubs playing reggaeton, and pisco sour culture. Tourist-oriented but fun. Altitude affects alcohol tolerance.",
        "nature": "Sacred Valley, Rainbow Mountain, Machu Picchu—world-class trekking at your doorstep. Adventure tourism capital of South America. Extraordinary landscapes.",
        "safety": "Generally safe tourist city. Altitude sickness is a bigger threat than crime. Standard awareness for pickpockets. Taxis late at night.",
        "food": "Peruvian culinary excellence—ceviche, lomo saltado, alpaca steaks. Fusion restaurants meet traditional picanterias. Food scene rivals Lima in quality.",
        "community": "Established backpacker and expat scene. Spanish schools bring rotating community. Small but present digital nomad population.",
        "english": "Tourist-dependent town means English works in hotels and restaurants. Beyond tourist zone, Spanish essential. Quechua still spoken locally.",
        "visa": "183 days visa-free for most—generous by any standard. Peru immigration is straightforward. Extensions possible in Lima.",
        "culture": "Inca capital, Spanish colonial overlay, and living Andean traditions. Inti Raymi festival, ancient stonework, and UNESCO heritage everywhere. Spiritual tourism is big.",
        "cleanliness": "Central plazas maintained; some areas rougher. Altitude means less humidity issues. Tourist economy drives upkeep standards.",
        "airquality": "Thin air at altitude is clean and pure. Occasional dust from dry season. No pollution concerns—just remember to breathe slowly."
    },
    "dresden": {
        "climate": "Continental German climate—warm summers (25°C), cold winters (below freezing). Elbe River moderates slightly. Four distinct seasons with snowy winters.",
        "cost": "Excellent German value at €2200/month. Eastern Germany pricing with western infrastructure. Much cheaper than Munich or Frankfurt.",
        "wifi": "German efficiency means 100+ Mbps widely available. Fiber expanding. Cafés and coworking spaces reliable. No connectivity concerns.",
        "nightlife": "Student city energy—Neustadt alternative scene, riverfront bars, and club culture. Less international than Berlin but genuinely fun. Saturday nights are lively.",
        "nature": "Saxon Switzerland National Park with dramatic sandstone formations. Elbe River cycling. Genuine outdoor adventure surprisingly close to the city.",
        "safety": "Very safe German city. Some far-right activity makes headlines but tourist impact is minimal. Standard precautions; generally secure.",
        "food": "German hearty fare—Sauerbraten, Dresdner Christstollen. Eastern European influences. Craft beer scene growing. Quality without Berlin prices.",
        "community": "Small international community. Technical university brings students. Fewer nomads than Berlin but growing startup scene.",
        "english": "Good among younger generation and professionals. Older eastern Germans may struggle. Tourist infrastructure functions in English.",
        "visa": "90-day Schengen standard. Germany's freelance visa is established path for longer stays. Bureaucracy is thorough but functional.",
        "culture": "Baroque resurrection—Frauenkirche rebuilt from wartime rubble, Zwinger Palace, and world-class museums. The 'Florence of the Elbe' nickname is earned.",
        "cleanliness": "German cleanliness standards apply. Well-maintained public spaces. Historic rebuilding has created pristine old town.",
        "airquality": "Good—industrial decline and river location help. Eastern German pollution legacy largely cleaned up. Comfortable breathing."
    },
    "dublin": {
        "climate": "Irish wet—mild temperatures year-round (5-20°C), frequent rain, and grey skies. Rarely extreme but often damp. Pack waterproofs for every season.",
        "cost": "Shockingly expensive at €3500+/month. Tech company salaries have destroyed housing affordability. One of Europe's priciest cities now.",
        "wifi": "Tech hub infrastructure—100+ Mbps standard. Google, Meta, LinkedIn headquarters mean excellent connectivity throughout.",
        "nightlife": "Legendary pub culture—Temple Bar tourist trap to genuine local joints. Live music every night. Craic is the goal. Last call is late; hangovers are Irish.",
        "nature": "Wicklow Mountains an hour south, coastal walks, and Phoenix Park's urban green space. Not spectacular but accessible outdoor options.",
        "safety": "Generally safe but changing. Housing crisis has increased street issues. Central areas fine; some suburbs require awareness at night.",
        "food": "Irish food revolution—gastropubs, seafood, and farm-to-table beyond stereotypes. Full Irish breakfast, fish and chips, and craft beer scene thriving.",
        "community": "Massive tech expat community. International workforce at big tech companies. Networking and meetups abundant. Easy to build connections.",
        "english": "Native English—Irish accent takes adjusting but no barrier. Highly international city with global English speakers.",
        "visa": "EU/EEA has freedom of movement. Others face Irish immigration complexity. Tech work sponsorship is common route. Brexit changed UK access.",
        "culture": "Literary heritage—Joyce, Yeats, Beckett. Viking history, Georgian architecture, and a music tradition that's alive in every pub. Storytelling is art.",
        "cleanliness": "Central areas maintained; outskirts vary. Rainy weather keeps dust down but brings other challenges. Improving overall.",
        "airquality": "Good—Atlantic winds and rain clear pollution. Limited heavy industry. One of Europe's better capitals for air quality."
    },
    "dubrovnik": {
        "climate": "Adriatic Mediterranean perfection—hot dry summers, mild winters. Swimming season lasts April-October. Winter quieter with occasional rain.",
        "cost": "Tourism premium at €2800/month. Game of Thrones fame raised prices. Off-season offers value; summer is expensive.",
        "wifi": "Croatian infrastructure has improved—50-80 Mbps in most places. Old stone walls can challenge signals. Apartments vary; confirm before booking.",
        "nightlife": "Small town with seasonal energy. Beach bars in summer, quieter winters. Young backpacker crowd brings party vibes peak season.",
        "nature": "Stunning Adriatic coastline, Elafiti Islands for day trips, and Lokrum Island visible from the walls. Crystal-clear swimming everywhere.",
        "safety": "Extremely safe—low crime, tourist-friendly, and welcoming. Walk the walls at night without concern. Croatia is among Europe's safest.",
        "food": "Dalmatian cuisine—fresh seafood, grilled fish, black risotto. Mediterranean influences. Quality restaurants in and around old town. Croatian wine underrated.",
        "community": "Minimal year-round nomad presence. Summer brings tourists, not remote workers. Off-season is very quiet. You'll need to build connections.",
        "english": "Excellent in tourism industry. Croatian young people speak English well. International tourism has made English universal in the center.",
        "visa": "90 days visa-free. Croatia joined Schengen in 2023—same rules now apply. No specific nomad visa but tourist stays are straightforward.",
        "culture": "UNESCO old town—medieval walls, baroque churches, and Game of Thrones filming locations. Maritime heritage and Ragusa's diplomatic history fascinate.",
        "cleanliness": "Immaculate old town maintained for tourism. Stone streets gleam. Croatian pride in presentation. High standards throughout.",
        "airquality": "Exceptional—sea breezes, limited traffic in old town, minimal industry. Some of Europe's cleanest air."
    },
    "edinburgh": {
        "climate": "Scottish weather—cool, wet, and windy. Summers mild (15-20°C), winters cold and dark. Festival season (August) is warmest and busiest.",
        "cost": "Festival premium at £3200/month—expensive British city. Housing competitive, especially during August. Quality comes at a price.",
        "wifi": "British infrastructure means 80-100 Mbps standard. Tech and finance sectors ensure good connectivity. Cafés accommodate remote workers.",
        "nightlife": "Student energy meets cosmopolitan sophistication. Cowgate clubs, New Town cocktail bars, and legendary pubs. Festival Fringe transforms August.",
        "nature": "Arthur's Seat volcano in the city center, Scottish Highlands accessible, and coastal walks nearby. Genuine wilderness within reach.",
        "safety": "Safe British city. Tourist areas well-policed. Some areas require standard awareness at night. Generally secure.",
        "food": "Scottish cuisine renaissance—haggis redefined, seafood from the coasts, and international diversity. Whisky is taken seriously. Michelin stars earned.",
        "community": "Tech and finance professionals mix with students and creatives. Established expat scene. Festival brings global influx annually.",
        "english": "Scottish English—native speakers with distinctive accent. International city with global community. No language barrier.",
        "visa": "UK visa complexity post-Brexit. Tourist visits straightforward. Working requires skilled worker visa or Global Talent route.",
        "culture": "Castle dominating the skyline, UNESCO-listed old and new towns, literary heritage (Stevenson, Doyle, Rowling). Festival Fringe is world's largest arts festival.",
        "cleanliness": "Well-maintained historic city. Tourist economy drives standards. Georgian New Town is immaculate. Old Town shows character.",
        "airquality": "Good—Scottish winds and limited industry. Some traffic impact but generally healthy. Better than most British cities."
    },
    "florence": {
        "climate": "Tuscan summers are hot and sticky (35°C+); winters mild but damp. Spring and fall are ideal. Air conditioning essential June-August.",
        "cost": "Renaissance beauty costs €3000/month. Tourist economy and limited housing supply drive prices. Worth it for the setting.",
        "wifi": "Italian infrastructure improving—50-80 Mbps in good areas. Historic buildings can challenge connectivity. Coworking spaces reliable.",
        "nightlife": "Refined rather than rowdy. Aperitivo culture on piazzas, wine bars, and student energy in San Lorenzo. Summer evenings are magical.",
        "nature": "Tuscan hills for day trips—Chianti wine country, medieval villages, and cypress-lined roads. Accessible beauty without leaving the region.",
        "safety": "Generally safe Italian city. Pickpockets target busy tourist zones. Standard awareness applies. Comfortable walking day or night.",
        "food": "Tuscan cuisine at the source—bistecca alla fiorentina, ribollita, lampredotto street food. Simple ingredients elevated to art. Wine is life.",
        "community": "Art students, academics, and tourists dominate. Small nomad community growing. International art scene is established.",
        "english": "Tourist industry English works. Daily life benefits from Italian. Younger Florentines speak English; older generations less so.",
        "visa": "90-day Schengen standard. Italy's elective residence visa for remote workers available. Italian bureaucracy requires patience.",
        "culture": "Renaissance ground zero—Uffizi, Duomo, David, Ponte Vecchio. Birthplace of the Renaissance literally everywhere you look. Overwhelming cultural density.",
        "cleanliness": "Tourist areas well-maintained. Some graffiti and wear. Italian urban character over sterility. Historic preservation prioritized.",
        "airquality": "Summer heat traps pollution. Traffic affects levels. Spring and fall much better. Not Florence's strongest category."
    },
    "gdansk": {
        "climate": "Baltic climate—cool summers (20°C), cold winters, and wind from the sea. Pleasant June-August; winter is grey and challenging.",
        "cost": "Excellent Polish value at €1900/month. Baltic Sea location without Western prices. Quality housing surprisingly affordable.",
        "wifi": "Polish infrastructure solid—80-100 Mbps widely available. Tech sector has driven investment. Reliable connectivity throughout.",
        "nightlife": "Port city energy—student bars, craft beer scene, and Baltic nightlife. Less wild than Warsaw or Krakow but genuine fun.",
        "nature": "Baltic beaches, Hel Peninsula, and Kashubian lakeland nearby. Coastal cycling excellent. Summer brings beach culture to northern Europe.",
        "safety": "Very safe Polish city. Low crime, friendly atmosphere. Walking comfortable at any hour. One of Europe's safer destinations.",
        "food": "Polish coastal cuisine—smoked fish, pierogi, and hearty soups. Craft beer revolution. Traditional milk bars for budget eating.",
        "community": "Small but growing international scene. Tech industry brings young professionals. Fewer nomads than Krakow but community exists.",
        "english": "Good among younger generation. Tourism and shipping industries speak English. Older Poles may struggle. Polish basics appreciated.",
        "visa": "90-day Schengen standard. Poland offers no specific nomad visa but EU pathways exist. Immigration straightforward.",
        "culture": "Hanseatic trading history, WWII significance (where the war began), amber heritage, and gothic architecture rebuilt from wartime rubble.",
        "cleanliness": "Well-maintained city pride. Reconstructed old town is immaculate. Polish cleaning standards are high. Pleasant urban environment.",
        "airquality": "Baltic breezes help, though winter coal heating affects some Polish cities. Generally good, occasional seasonal dips."
    },
    "geneva": {
        "climate": "Alpine-influenced—pleasant summers (25°C), cold winters, and lake moderating temperatures. Four seasons with occasional fog. Snow in winter.",
        "cost": "Among world's most expensive at CHF 5500+/month. UN and banking salaries drive prices into stratosphere. Budget carefully.",
        "wifi": "Swiss precision means 200+ Mbps standard. Infrastructure is immaculate. Coworking and cafés deliver excellent connectivity.",
        "nightlife": "Refined and international. Diplomatic receptions, wine bars, and quiet sophistication. Not a party city—wealth is understated.",
        "nature": "Alps within sight, Lake Geneva for swimming, and outdoor access in every direction. Mont Blanc day trips. World-class nature adjacent.",
        "safety": "Exceptionally safe—wealthy, stable, and secure. One of the world's safest cities. Walk anywhere without concern.",
        "food": "French-Swiss fusion—fondue, raclette, and lakeside dining. International cuisine from diplomatic community. Quality is extraordinary.",
        "community": "International organizations bring global professionals. Expat community massive but established cliques. Networking requires effort.",
        "english": "Widely spoken in international Geneva. French dominates daily life. Educated population multilingual. English sufficient for most situations.",
        "visa": "Swiss not EU but Schengen-adjacent rules. Work permits challenging and expensive. Tourist stays straightforward. Swiss bureaucracy is precise.",
        "culture": "International diplomacy heritage—UN, Red Cross, WHO. Reformation history (Calvin). Watchmaking tradition. Understated but significant.",
        "cleanliness": "Famously spotless. Swiss standards are legendary. Streets, parks, public transport—all immaculate. This is the gold standard.",
        "airquality": "Excellent—lakeside location, alpine air, strict regulations. Among Europe's cleanest cities for breathing."
    },
    "genoa": {
        "climate": "Mediterranean with microclimate quirks—mild winters, warm summers. Sea moderates temperatures. Less crowded and hot than other Italian riviera.",
        "cost": "Surprisingly affordable Italy at €2400/month. Less touristed than Florence or Rome. Authentic living without premium prices.",
        "wifi": "Italian infrastructure—50-80 Mbps typical. Improving but not Germany. Old town warrens can challenge signals. Verify apartment connectivity.",
        "nightlife": "Porto Antico bars and centro storico hidden gems. University brings young energy. Less polished than Milan, more real.",
        "nature": "Cinque Terre accessible, Ligurian coast for swimming, and Apennine foothills for hiking. Coastal beauty without tourist overcrowding.",
        "safety": "Some old town areas require awareness. Centro storico has dark alleys. Genoa is grittier than tourist Italy. Street smarts needed.",
        "food": "Pesto capital—trofie al pesto, focaccia di Recco, and fresh seafood. Ligurian cuisine is lighter than Tuscan. Food obsession runs deep.",
        "community": "Small international presence. Maritime industries bring some diversity. Few nomads—pioneer territory. Italian language essential.",
        "english": "Limited—this is real Italy, not tourist bubble. English works in hotels; daily life needs Italian. Genoese appreciate effort.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy is legendary but manageable.",
        "culture": "Maritime republic heritage—Columbus, Doria, and centuries of trading wealth. Palazzi dei Rolli, aquarium, and caruggi (medieval alleys). Authentic over curated.",
        "cleanliness": "Gritty port city character. Centro storico can feel neglected. Improving but not pristine. Real over sanitized.",
        "airquality": "Port activity affects levels. Better than it was but still an active industrial port. Mediterranean breezes help."
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
    print("Updating category descriptions for batch 3 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH3_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH3_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

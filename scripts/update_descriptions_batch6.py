#!/usr/bin/env python3
"""
Update category descriptions for batch 6 cities with unique, compelling content.
"""

import re
import json
import os

CITIES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities"

BATCH6_DESCRIPTIONS = {
    "bangkok": {
        "climate": "Tropical furnace—hot and humid year-round (30-35°C). Monsoon rains June-October add floods to the chaos. AC is survival. Dry season (Nov-Feb) is 'cool' at 28°C.",
        "cost": "Great value at $2200/month. Street food for $1, massage for $8, but expat lifestyle creeps up. Sukhumvit condos get expensive.",
        "wifi": "Thai internet has leveled up—100+ Mbps fiber in condos, 50+ in most cafés. 4G everywhere. True Move and AIS deliver reliable mobile data.",
        "nightlife": "Legendary and varied—Khao San backpacker chaos, Sukhumvit sophistication, RCA clubs, and rooftop sky bars. Legal until 2am but solutions exist after.",
        "nature": "Urban concrete jungle—minimal nature access. Escape to beaches (4+ hours) or mountains (Khao Yai) for weekends. City parks exist but aren't the point.",
        "safety": "Generally safe but scams are sport. Tuk-tuk gems, bar fine surprises, and temple closure 'helpers.' Traffic is genuinely dangerous. Don't mess with monarchy.",
        "food": "Street food heaven—pad thai, som tam, boat noodles, and night markets. The world's best $1 meals. Michelin street vendors are real. Food is religion here.",
        "community": "Massive nomad hub. Sukhumvit, Ekkamai, and Ari host coworking spaces and meetups. Community is established and welcoming. You'll make friends instantly.",
        "english": "Tourist English is workable. Young Thais in cities speak it. Beyond expat areas, Thai helps enormously. Learn 'sawadee krap/ka' at minimum.",
        "visa": "60-day visa-free extendable to 90. LTR visa for high earners/professionals. Visa runs to neighboring countries are ritual. Rules constantly evolving.",
        "culture": "Buddhist temples, royal traditions, and Thai resilience. Wats, Floating markets, and the King's portrait everywhere. Respect the monarchy and Buddha. Smile culture is real.",
        "cleanliness": "Developed world infrastructure meets developing world maintenance. Some areas spotless; others rough. Wet markets are intense. Accept the chaos.",
        "airquality": "PM2.5 crisis is real—bad season (Dec-Apr) rivals Beijing. Masks essential during peaks. Check AQI daily. Summer rains clean the air."
    },
    "barcelona": {
        "climate": "Mediterranean ideal—warm dry summers (28°C), mild winters. Beach weather May-October. Humidity creeps in July-August. 300+ days of sunshine.",
        "cost": "Premium pricing at €3000/month. Tourism and tech salaries have inflated housing. Worth it for the lifestyle, but budget carefully.",
        "wifi": "Spanish fiber infrastructure solid—100+ Mbps common. Cafés accommodate laptop workers. Beach WiFi improving. No concerns for remote work.",
        "nightlife": "World-class and late—dinner at 10pm, clubs open at midnight, home at sunrise. Gothic Quarter, Raval underground, and beach clubs. Catalan passion fuels the scene.",
        "nature": "Beach within the city, Montjuïc gardens, and Pyrenees day trips. Costa Brava swimming accessible. Mediterranean lifestyle integrated with urban.",
        "safety": "Pickpockets are relentless on La Rambla and metro. No violent crime concerns. Standard tourist city awareness. Scooter drive-bys happen.",
        "food": "Catalan cuisine excellence—tapas, pa amb tomàquet, seafood paella, and market grazing at La Boqueria. Wine flows cheap. Vermouth hour is sacred.",
        "community": "Massive international community. Digital nomads, tech workers, and creatives flood the city. Meetups daily. Networking is effortless.",
        "english": "Widely spoken in international Barcelona. Catalan and Spanish dominate local life. Young professionals communicate easily. Tourist areas function perfectly.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa (Beckham Law) offers tax advantages. Paperwork required but established path.",
        "culture": "Gaudí's surreal architecture—Sagrada Familia, Park Güell, Casa Batlló. Catalan identity, modernist heritage, and Mediterranean hedonism. Visually overwhelming.",
        "cleanliness": "Tourist areas maintained but gritty nightlife zones show wear. Beach can be crowded and littered. Urban character over sterility.",
        "airquality": "Generally good—sea breezes help. Summer heat creates some ozone. Traffic affects main arteries. Better than many Mediterranean cities."
    },
    "basel": {
        "climate": "Continental Rhine Valley—warm summers (25°C), cold winters. Frequent fog and grey. Three-country corner catches varied weather patterns.",
        "cost": "Swiss expensive at CHF 4000/month. Cheaper than Geneva or Zurich but still astronomical by global standards. Pharma salaries normalize prices locally.",
        "wifi": "Swiss precision—200+ Mbps standard. Excellent infrastructure. Coffee shops and public spaces connected. Germany and France within minutes for cheaper options.",
        "nightlife": "Sophisticated and understated. Art Basel week transforms the city. Otherwise, Rhine-side bars and cultural events. Not a party city.",
        "nature": "Rhine River swimming in summer, Black Forest (Germany) and Jura mountains accessible. Three-country hiking. Good outdoor access despite small size.",
        "safety": "Extremely safe—Swiss standards. Walk anywhere without concern. The biggest risk is expensive beer.",
        "food": "Swiss-French-German fusion—fondue, rösti, and regional specialties. Excellent quality, extreme prices. Cross-border dining saves money.",
        "community": "Pharma and art industries bring international professionals. English-speaking expat scene exists. Small nomad presence—this is work visa territory.",
        "english": "Widely spoken in international Basel. German is local language. French nearby. Multilingual environment accommodates English easily.",
        "visa": "Swiss not Schengen but similar rules apply. Work permits challenging. Tourist visits straightforward. Swiss bureaucracy is precise.",
        "culture": "Art Basel fair defines the city globally. Fondation Beyeler, Kunstmuseum, and architectural gems (Herzog & de Meuron's hometown). Serious cultural weight.",
        "cleanliness": "Swiss immaculate—expectedly pristine. Rhine is clean enough for swimming. High standards throughout.",
        "airquality": "Excellent—limited industry, river location. Swiss environmental consciousness. Among Europe's cleanest cities."
    },
    "bath": {
        "climate": "Classic English—grey, rainy, and mild. Temperatures rarely extreme (5-22°C). Georgian architecture looks best in soft light anyway.",
        "cost": "Tourist premium at £3000/month. Small city, big prices. Heritage and university drive demand. Worth visiting, challenging for long stays.",
        "wifi": "British infrastructure—80-100 Mbps standard. Cafés accommodate workers. University presence ensures connectivity.",
        "nightlife": "Small city charm—historic pubs, wine bars, and student energy. Not a nightlife destination. Sophisticated evenings over wild nights.",
        "nature": "Cotswolds rolling hills accessible. Gentle English countryside. Walking and cycling. Pleasant rather than dramatic.",
        "safety": "Very safe—affluent tourist city. Walk anywhere at any hour. Minimal concerns. English politeness prevails.",
        "food": "Tea rooms, gastropubs, and the Sally Lunn bun. English countryside dining meets international quality. Proper afternoon tea obligatory.",
        "community": "Minimal nomad presence. University and tourism dominate. Retirees and weekenders. Building remote work connections requires effort.",
        "english": "Native English—received pronunciation territory. International tourism. No language barrier obviously.",
        "visa": "UK visa rules post-Brexit. Tourist visits straightforward. Working requires sponsorship.",
        "culture": "Roman baths perfectly preserved, Georgian architecture UNESCO-listed, Jane Austen associations. Entire city is a museum. Living history done right.",
        "cleanliness": "Heritage maintenance impeccable. Georgian facades pristine. English civic pride. This is a showcase city.",
        "airquality": "Excellent—small city, no industry. English rain cleans air. Healthy environment throughout."
    },
    "beirut": {
        "climate": "Mediterranean mild—hot humid summers, mild wet winters. Sea moderates temperatures. Pleasant much of the year.",
        "cost": "Crisis-complicated at $1500/month. Currency collapse created dual pricing. USD essential. Quality available but infrastructure strained.",
        "wifi": "Lebanese infrastructure challenging—power cuts affect everything. Generators common. When working, 20-50 Mbps. Mobile data essential backup.",
        "nightlife": "Legendary resilience—rooftop bars, beach clubs, and Mar Mikhael vibes. Lebanese party through anything. Genuine energy despite everything.",
        "nature": "Mediterranean coast, Jeita Grotto caves, and Cedar Mountains accessible. Skiing and beach in same day possible. Surprising variety.",
        "safety": "Complex—economic crisis, political instability, and regional tensions. Research current situation before visiting. Hospitality remains legendary.",
        "food": "Levantine excellence—mezze, manakish, fresh bread, and Mediterranean fusion. Lebanese cuisine is world-class. Food is cultural identity.",
        "community": "Resilient expat community. Journalists, NGO workers, and creatives. Small but tight-knit. French and Arabic advantaged.",
        "english": "Widely spoken among educated Lebanese. French equally common. Multilingual society. Tourist areas function.",
        "visa": "Visa on arrival for most. Situation dependent—check current political climate. Lebanon has welcomed visitors historically.",
        "culture": "Phoenician roots, Ottoman layers, French influence, and modern Arab cosmopolitanism. Archaeological treasures and contemporary art scene. Resilience is the culture.",
        "cleanliness": "Crisis has affected infrastructure. Garbage collection challenged. Some areas maintained; others struggle. Complex situation.",
        "airquality": "Varies—generators during power cuts affect quality. When grid works, Mediterranean breezes help. Situation dependent."
    },
    "belgrade": {
        "climate": "Continental extremes—hot summers (30°C+), cold winters (below freezing). Danube and Sava rivers moderate slightly. Four distinct seasons.",
        "cost": "Excellent value at €1600/month. Balkan affordability with growing infrastructure. Nightlife cheap by European standards.",
        "wifi": "Serbian infrastructure solid—50-80 Mbps common. Improving rapidly. Coworking spaces reliable. Cafés accommodate laptop workers.",
        "nightlife": "Legendary splavovi (river barges) clubs. Techno, turbo-folk, and underground scenes. Serbians party until dawn. Summer river parties are iconic.",
        "nature": "Confluence of Danube and Sava rivers. Kalemegdan Fortress park. Mountain escapes (Tara, Zlatibor) for weekends. Decent outdoor access.",
        "safety": "Generally safe—some areas at night require awareness. Football hooliganism exists. Tourist zones fine. Balkan hospitality genuine.",
        "food": "Balkan heartiness—ćevapi, pljeskavica, kajmak. Serbian portions are massive. Rakija flows freely. Hearty and affordable.",
        "community": "Growing nomad scene. Affordable living attracts remote workers. Meetups and coworking spaces emerging. English-speaking expats increasing.",
        "english": "Good among younger Serbians. Older generation may struggle. Tourist areas function. Serbian appreciated but not essential.",
        "visa": "90 days visa-free for most. Serbia not EU but welcoming. No specific nomad visa but tourist stays generous.",
        "culture": "Ottoman, Habsburg, and Yugoslav layers. Bohemian Skadarlija, fortress history, and contemporary scene. Transition-era energy. Raw and fascinating.",
        "cleanliness": "Improving but showing age. Central areas maintained; some neighborhoods rougher. Balkan urban character. Authentic over polished.",
        "airquality": "Can be challenging—traffic and heating affect levels. Winter worse than summer. Room for improvement."
    },
    "berlin": {
        "climate": "Continental German—cool summers (20-25°C), cold grey winters. Limited sunshine. Four seasons but none extreme. Pack for rain year-round.",
        "cost": "Rising rapidly at €3400/month. No longer cheap—tech and startups transformed prices. Still value compared to London or Paris.",
        "wifi": "German infrastructure means 100+ Mbps fiber standard. Cafés accommodate working. Coworking spaces excellent. Connectivity reliable.",
        "nightlife": "World's techno capital. Berghain is pilgrimage. Clubs open Friday, close Monday. Underground scenes, beer gardens, and kneipe culture. Legendary.",
        "nature": "Tiergarten urban forest, lakes for summer swimming, and Brandenburg countryside. Flat but green. Cycling paradise.",
        "safety": "Very safe German capital. Some areas require awareness at night. Drug scene visible but non-threatening. Relaxed atmosphere.",
        "food": "International smorgasbord—döner king, Vietnamese influence, and global cuisines. German hearty fare available. Street food culture evolved.",
        "community": "Massive international creative community. Startups, artists, and tech workers. Coworking scenes in every neighborhood. Networking effortless.",
        "english": "Excellent—Berlin runs on English. International population massive. German appreciated but unnecessary for daily life.",
        "visa": "90-day Schengen standard. Germany's freelance visa is established path. Artist visa historically generous. Bureaucracy thorough but functional.",
        "culture": "Wall history, museum island, contemporary art, and counterculture. Cold War division still visible. Creative freedom defines identity. History is everywhere.",
        "cleanliness": "Gritty by German standards—graffiti is art here. Kreuzberg and Neukölln show wear intentionally. Not sterile; characterful.",
        "airquality": "Good for a major capital. Traffic affects levels. Green spaces help. German environmental standards apply."
    },
    "bilbao": {
        "climate": "Basque green—rainy and mild. Maritime influence means no extremes. Often cloudy. Green hills need the water.",
        "cost": "Moderate Spanish at €2400/month. Cheaper than Barcelona or Madrid. Good value for quality of life.",
        "wifi": "Spanish fiber infrastructure—80-100 Mbps common. Reliable connectivity. Cafés accommodate working.",
        "nightlife": "Pintxos crawling through Casco Viejo is the ritual. Bars, wine, and Basque hospitality. Sophisticated rather than wild.",
        "nature": "Green Basque hills, Atlantic coast beaches nearby. San Juan de Gaztelugatxe (Game of Thrones). Excellent outdoor access.",
        "safety": "Very safe Spanish city. ETA era is history. Friendly, welcoming atmosphere. Walk anywhere without concern.",
        "food": "Pintxos perfection—Basque culinary scene rivals world's best. Michelin stars per capita extraordinary. Food is cultural identity here.",
        "community": "Small international presence. Guggenheim brings visitors, not settlers. Spanish essential for integration. Pioneer territory for nomads.",
        "english": "Limited—Spanish and Basque dominate. Tourist services in English. Daily life needs Spanish commitment.",
        "visa": "90-day Schengen standard. Spain's digital nomad visa available. Same process as other Spanish cities.",
        "culture": "Guggenheim transformed this industrial city. Frank Gehry's titanium curves are iconic. Basque identity, traditions, and contemporary art.",
        "cleanliness": "Well-maintained modern city. Industrial heritage cleaned up. Basque pride in presentation. High standards.",
        "airquality": "Good—maritime location helps. Industrial past cleaned up. Rainy weather keeps air fresh."
    },
    "bogota": {
        "climate": "Highland eternal spring at 2600m—cool year-round (8-20°C). No seasons; altitude defines everything. Bring layers. No AC needed.",
        "cost": "Great value at $1800/month. Colombian affordability with capital city amenities. Zona T and Chapinero cost more.",
        "wifi": "Colombian internet improving—50-80 Mbps in good areas. Coworking scenes in Chapinero and Zona G. Fiber expanding.",
        "nightlife": "Colombian energy—Zona Rosa clubs, Chapinero hipster bars, and salsa everywhere. Aguardiente flows. Nights are long and passionate.",
        "nature": "Cerro Monserrate overlooks the city. Coffee region and hiking accessible. Not spectacular within city but day trips offer variety.",
        "safety": "Requires attention—research neighborhoods. Chapinero and Zona T safer. Petty crime exists; violent crime typically avoids tourists. Street smarts essential.",
        "food": "Colombian diversity—ajiaco soup, bandeja paisa, and international options. Coffee is religion (obviously). Quality improving rapidly.",
        "community": "Growing nomad scene. Chapinero and Zona G attract creatives. Coworking spaces multiplying. Spanish helps enormously.",
        "english": "Limited outside business and tourist zones. Spanish essential for daily life. Younger bogotanos learning. Invest in language.",
        "visa": "90 days visa-free, easily extended. Colombia welcomes remote workers informally. Digital nomad visa in development.",
        "culture": "Gold Museum treasures, graffiti tours, and contemporary art scene. Colombian resilience and warmth. Transformational city with painful history.",
        "cleanliness": "Varies by neighborhood. Upscale areas maintained; others rough. Developing city realities. Improving overall.",
        "airquality": "Altitude helps dispersion. Traffic affects levels. Better than many Latin American capitals. Generally manageable."
    },
    "bologna": {
        "climate": "Po Valley weather—hot humid summers, cold foggy winters. Continental Italian. Spring and fall are ideal. Winters can be grey.",
        "cost": "Reasonable Italian at €2600/month. Cheaper than Milan or Florence. University town pricing. Good value.",
        "wifi": "Italian infrastructure—60-80 Mbps typical. University presence helps connectivity. Cafés under porticos accommodate working.",
        "nightlife": "Student energy keeps things lively. Aperitivo culture, wine bars, and late nights in the centro. University town vibes.",
        "nature": "Apennine foothills for hiking. Emilia-Romagna countryside. Not spectacular but pleasant. Food tourism compensates.",
        "safety": "Very safe Italian city. University brings young energy. Walkable and welcoming. Comfortable throughout.",
        "food": "Italy's culinary capital. Tortellini, ragù (not 'bolognese'), mortadella, and Parmigiano-Reggiano. Food pilgrimage territory. Worth the trip for eating alone.",
        "community": "University brings international students. Smaller nomad scene than Florence or Rome. Italian language essential for integration.",
        "english": "Limited outside university. Tourist services in English. Daily life needs Italian. Worth learning—the food conversations alone.",
        "visa": "90-day Schengen standard. Italy's remote worker visa available. Italian bureaucracy—plan ahead.",
        "culture": "World's oldest university, medieval towers, and porticoed streets. Scholarly heritage meets culinary obsession. Intellectual and delicious.",
        "cleanliness": "Well-maintained historic center. University pride keeps standards high. Some graffiti. Italian urban character.",
        "airquality": "Po Valley traps pollution. Winter fog affects quality. Not excellent—regional challenge. Summer better."
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
    print("Updating category descriptions for batch 6 (10 cities)...")
    print("=" * 50)

    success_count = 0
    for city_id, descriptions in BATCH6_DESCRIPTIONS.items():
        print(f"\nProcessing {city_id}...")
        if update_city_descriptions(city_id, descriptions):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Successfully updated {success_count}/{len(BATCH6_DESCRIPTIONS)} cities")

if __name__ == "__main__":
    main()

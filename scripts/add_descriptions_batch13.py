#!/usr/bin/env python3
"""Batch 13: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "santacruz": {
        "climate": "Santa Cruz has a warm tropical climate with temperatures of 23-33°C year-round. The rainy season from November to March brings humidity. The dry season is pleasant.",
        "cost": "Very affordable with apartments from $300-600/month. Bolivia is South America's cheapest country. Excellent value for quality of life.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. The modern Bolivian city has decent connectivity. Coworking options exist.",
        "nightlife": "Vibrant scene with bars and clubs. The local party culture is active. Bolivian hospitality is warm.",
        "nature": "Gateway to Bolivian lowlands and Amazon. National parks are accessible. The surrounding nature is diverse.",
        "safety": "Generally safe with standard precautions. Petty crime exists. The city is more modern than other Bolivian cities.",
        "food": "Bolivian cuisine with regional lowland influences. Fresh fruits and meats are highlights. Prices are incredibly low.",
        "community": "Small digital nomad community. The city attracts fewer tourists than La Paz. Expat community exists.",
        "english": "Limited English with Spanish essential. The city is less touristy. Learning Spanish is necessary.",
        "visa": "90 days visa-free for most nationalities. Bolivia is accessible. Extensions possible.",
        "culture": "Modern Bolivian city with tropical influences. The camba culture is distinct from highland Bolivia. Development is rapid.",
        "cleanliness": "Varies by area. Modern districts are well-maintained. Some areas show development challenges.",
        "airquality": "Generally good but forest fires seasonally affect air. Agricultural burning affects the region. The lowland location helps."
    },
    "lapaz": {
        "climate": "La Paz has a subtropical highland climate at 3,640m elevation. Temperatures stay cool year-round (5-18°C). The altitude creates unique thin air challenges.",
        "cost": "Extremely affordable with apartments from $250-500/month. One of South America's cheapest capitals. Incredible value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. The altitude and terrain affect connectivity. Improving slowly.",
        "nightlife": "Growing scene with bars and peñas (folk music venues). The altitude means partying is challenging. The atmosphere is unique.",
        "nature": "Dramatic Andean setting with mountains and valleys. Day trips to Moon Valley and Titicaca. The landscape is otherworldly.",
        "safety": "Generally safe with petty crime existing. Tourist areas are secure. Standard awareness applies.",
        "food": "Bolivian cuisine with highland specialties like salteñas. Fresh llama and quinoa are unique. Prices are very low.",
        "community": "Small expat community. The altitude limits long-term stays for some. Authentic experience seekers visit.",
        "english": "Limited English with Spanish essential. Tourism provides some support. Learning Spanish is important.",
        "visa": "90 days visa-free for most nationalities. Bolivia welcomes visitors. Extensions possible.",
        "culture": "Indigenous culture is vibrant and visible. The witches' market and colonial heritage coexist. The altitude adds mystique.",
        "cleanliness": "Varies significantly. Tourist areas maintained. Some neighborhoods are challenging.",
        "airquality": "Good at high altitude though thin. Some dust and traffic pollution. The elevation keeps air relatively clean."
    },
    "quito": {
        "climate": "Quito has a mild highland climate at 2,850m with temperatures of 10-20°C year-round. The equatorial location creates consistent weather. Rain is possible any time.",
        "cost": "Affordable with apartments from $400-700/month. Ecuador uses US dollars which simplifies finances. Good value for quality.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. The capital has reasonable connectivity. Fiber expanding.",
        "nightlife": "Vibrant scene in La Mariscal and historic center. The party culture is active. Ecuadorian hospitality is warm.",
        "nature": "Surrounded by volcanoes with stunning Andean scenery. Day trips to equator monument and cloud forests. Nature is spectacular.",
        "safety": "Requires awareness with petty crime. Certain areas should be avoided. Tourist areas are generally safe.",
        "food": "Ecuadorian cuisine features ceviche, llapingachos, and fresh seafood. The food scene is developing. Prices are reasonable.",
        "community": "Established expat community especially retirees. Digital nomad presence growing. Community is welcoming.",
        "english": "Limited outside tourist areas. Spanish is essential. The expat community provides some English environment.",
        "visa": "90 days visa-free for most nationalities. Ecuador offers investment and retirement visas. Accessible.",
        "culture": "Colonial UNESCO old town is spectacular. Indigenous and Spanish heritage blend. The culture is rich.",
        "cleanliness": "Historic center is well-maintained. Some areas show urban challenges. Overall reasonable.",
        "airquality": "Generally good at altitude. Some traffic pollution. The highland location helps air quality."
    },
    "cali": {
        "climate": "Cali has a tropical wet climate with warm temperatures year-round (24-30°C). Being in a valley creates consistent warmth. Rain falls year-round.",
        "cost": "Very affordable with apartments from $350-600/month. Colombian living is good value. The cost of living is low.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Colombia has invested in connectivity. Coworking options exist.",
        "nightlife": "Salsa capital of the world with legendary dancing scene. The nightlife is famous. Caleño party culture is vibrant.",
        "nature": "Valley setting with nearby Pacific coast accessible. Day trips to coffee country. Nature is diverse.",
        "safety": "Improving but requires awareness. Certain areas should be avoided. Tourist areas are increasingly safe.",
        "food": "Colombian cuisine with Pacific and Valle influences. Fresh tropical fruits are abundant. The food is flavorful.",
        "community": "Growing digital nomad community. Salsa attracts dancers. The vibe is social and energetic.",
        "english": "Limited with Spanish essential. The city is less touristy than Medellín. Learning Spanish important.",
        "visa": "180 days visa-free for most nationalities. Colombian policy is generous. Easy for extended stays.",
        "culture": "Salsa culture defines the city. Afro-Colombian influence is strong. The energy is palpable.",
        "cleanliness": "Varies by neighborhood. Some areas are well-maintained. Urban challenges exist.",
        "airquality": "Generally good with valley ventilation. Some traffic pollution. The tropical setting helps."
    },
    "santiagodechile": {
        "climate": "Santiago has a Mediterranean climate with hot summers (28-35°C) and mild winters (5-15°C). Air quality can be poor in winter. The Andes create dramatic backdrop.",
        "cost": "More expensive than other South American capitals. Apartments from $600-1200/month. Chile's development shows in prices.",
        "wifi": "Good infrastructure with speeds of 50-150 Mbps. Chile has strong connectivity. The tech scene is developed.",
        "nightlife": "Vibrant scene in Bellavista and Lastarria. The wine bar culture is sophisticated. Chilean hospitality is welcoming.",
        "nature": "Andes mountains are visible and accessible. Skiing and hiking within hours. Wine country is nearby.",
        "safety": "Safer than most South American capitals. Petty crime exists. The city is generally orderly.",
        "food": "Chilean cuisine features empanadas, seafood, and excellent wine. The food scene is sophisticated. Quality is high.",
        "community": "Established expat and business community. Growing startup scene. The nomad community is active.",
        "english": "Better than most of South America but Spanish helps. Business often operates in English. Communication possible.",
        "visa": "90 days visa-free for most nationalities. Chile offers various visa options. The system is organized.",
        "culture": "Modern South American capital with Chilean identity. The arts scene is developed. European influences show.",
        "cleanliness": "Well-maintained central areas. Some air quality challenges. Standards are good for the region.",
        "airquality": "Can be poor in winter when the basin traps pollution. Summer is better. The issue is recognized."
    },
    "montevideo": {
        "climate": "Montevideo has a humid subtropical climate with warm summers (22-28°C) and mild winters (8-14°C). The Rio de la Plata moderates temperatures. Pleasant most of the year.",
        "cost": "Moderate for South America. Apartments from $600-1000/month. Uruguay is more expensive than neighbors.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Uruguay has invested in connectivity. Reliable service.",
        "nightlife": "Sophisticated scene with bars and live music. The pace is more relaxed than Buenos Aires. Quality over quantity.",
        "nature": "Beaches along the Río de la Plata and Atlantic coast. Day trips to Punta del Este. Nature is accessible.",
        "safety": "Safest capital in South America. Crime rates are low. The atmosphere is relaxed and secure.",
        "food": "Uruguayan cuisine features grilled meats, empanadas, and mate culture. The beef is excellent. The food scene is quality-focused.",
        "community": "Small but established expat community. The stability attracts investors. Digital nomad community is growing.",
        "english": "Limited with Spanish needed. The educated population may speak English. Learning Spanish helps significantly.",
        "visa": "90 days visa-free for most nationalities. Uruguay has stability that attracts long-term residents. Renewable.",
        "culture": "Laid-back culture with strong European influences. The city has a nostalgic charm. Tango culture exists but less intense than Buenos Aires.",
        "cleanliness": "Well-maintained throughout. Public spaces are clean. Standards are high for South America.",
        "airquality": "Good air quality with river breezes. The coastal location ensures fresh air. One of the region's cleanest capitals."
    },
    "asuncion": {
        "climate": "Asunción has a humid subtropical climate with hot summers (30-38°C) and mild winters (15-25°C). The humidity can be intense in summer. The Paraguay River adds humidity.",
        "cost": "Extremely affordable with apartments from $300-550/month. Paraguay is very cheap. Excellent value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Less developed than neighbors. Getting better.",
        "nightlife": "Growing scene with bars and clubs. Paraguayan nightlife is developing. The atmosphere is friendly.",
        "nature": "The Paraguay River provides waterfront. Day trips to Chaco region. Nature is accessible but less developed.",
        "safety": "Generally safe with low violent crime. Some petty theft. The city is relatively secure.",
        "food": "Paraguayan cuisine features chipa, sopa paraguaya, and grilled meats. The food is unique and affordable. Indigenous influences show.",
        "community": "Small expat community. The city attracts fewer visitors. Authentic experience for those who come.",
        "english": "Very limited with Spanish and Guaraní local. Learning Spanish is essential. The country is less touristy.",
        "visa": "90 days visa-free for most nationalities. Paraguay is accessible. Extensions possible.",
        "culture": "Guaraní indigenous culture blends with Spanish colonial heritage. The country has distinct identity. The pace is slow.",
        "cleanliness": "Varies with development. Central areas maintained. Infrastructure is developing.",
        "airquality": "Generally good with less industrial pollution. Humidity can make air feel heavy. Reasonable quality."
    },
    "panamacity": {
        "climate": "Panama City has a tropical climate with warm temperatures year-round (25-32°C). Wet season from May to November brings afternoon showers. Dry season is pleasant.",
        "cost": "Moderate to expensive by Central American standards. Apartments from $700-1400/month. USD currency simplifies finances.",
        "wifi": "Good infrastructure with speeds of 40-100 Mbps. The banking hub has invested in connectivity. Fiber available.",
        "nightlife": "Vibrant scene in Casco Viejo and banking district. Latin and international influences mix. The party culture is active.",
        "nature": "Tropical forests and both Pacific and Caribbean coasts accessible. The Canal Zone has nature. Biodiversity is rich.",
        "safety": "Varies by neighborhood. Tourist and business areas are safe. Some zones require caution.",
        "food": "Panamanian cuisine with Caribbean and Latin influences. Fresh seafood is excellent. International options abound.",
        "community": "Established expat community in banking and retirement. Growing digital nomad presence. The community is diverse.",
        "english": "Better than most Central American countries. The Canal and banking bring English speakers. Communication possible.",
        "visa": "180 days tourist visa for most nationalities. Panama has friendly residence options. Accessible for extended stays.",
        "culture": "Modern skyline meets colonial Casco Viejo. The Canal shapes identity. The culture blends Latin America with international business.",
        "cleanliness": "Modern areas are well-maintained. Some older neighborhoods show wear. Standards are reasonably high.",
        "airquality": "Generally good with ocean breezes. Some traffic pollution in dense areas. The coastal location helps."
    },
    "sanjose": {
        "climate": "San José has a tropical highland climate with pleasant temperatures year-round (18-25°C). The central valley location moderates heat. Rainy season brings afternoon showers.",
        "cost": "Moderate for Central America. Apartments from $600-1100/month. Costa Rica is not the cheapest in the region.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Costa Rica has invested in connectivity. Fiber available in urban areas.",
        "nightlife": "Scene exists in Escazú and San Pedro districts. The Costa Rican culture is social. Options are moderate.",
        "nature": "Gateway to incredible biodiversity. Volcanoes, rainforests, and beaches accessible. Nature is the country's main draw.",
        "safety": "Safest Central American capital. Some petty crime. The pura vida culture is peaceful.",
        "food": "Costa Rican cuisine features gallo pinto and casados. Fresh tropical fruits are excellent. The food scene is developing.",
        "community": "Established expat community especially retirees and nature lovers. Digital nomad scene growing. Community is welcoming.",
        "english": "Better English than most Central American countries. Tourism and education have spread English. Communication often possible.",
        "visa": "90 days visa-free for most nationalities. Costa Rica offers various residency options. The system is organized.",
        "culture": "Pura vida lifestyle emphasizes simplicity and happiness. The country abolished its military. The culture values nature and peace.",
        "cleanliness": "Generally clean with environmental consciousness. The eco-tourism focus shows. Standards are good.",
        "airquality": "Good air quality in the central valley. The highland location helps. One of Central America's cleaner capitals."
    },
    "guatecity": {
        "climate": "Guatemala City has a subtropical highland climate with pleasant temperatures (15-25°C). The altitude moderates heat. Rainy season from May to October.",
        "cost": "Very affordable with apartments from $400-700/month. Guatemala offers excellent value. Cost of living is low.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving gradually. Zones 10 and 14 have better connectivity.",
        "nightlife": "Scene exists in Zona Viva. Guatemalan nightlife is developing. Options are available.",
        "nature": "Gateway to Mayan ruins and volcanic landscapes. Lake Atitlán and Antigua accessible. Natural beauty is stunning.",
        "safety": "Requires significant awareness. Certain zones are safer. Research current conditions. Security is a real concern.",
        "food": "Guatemalan cuisine with Mayan influences. Tamales, pepián, and fresh produce. Prices are very low.",
        "community": "Expat community exists especially in safer zones. Many nomads prefer Antigua. Community is smaller in the capital.",
        "english": "Limited outside tourist and business contexts. Spanish is essential. Learning Spanish important.",
        "visa": "90 days visa-free for most nationalities (CA-4 zone). Guatemala is accessible. Extensions possible.",
        "culture": "Mayan heritage meets colonial influence. The culture is rich and complex. Indigenous traditions are vibrant.",
        "cleanliness": "Varies significantly by zone. Some areas are maintained while others struggle. Infrastructure challenges exist.",
        "airquality": "Can be affected by traffic and dust. The valley location matters. Highland location helps somewhat."
    }
}

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'category-descriptions.json')

    # Load existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new cities
    for city_id, descriptions in BATCH_CITIES.items():
        data[city_id] = descriptions
        print(f"Added descriptions for {city_id}")

    # Save updated data
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nTotal cities with descriptions: {len(data)}")

if __name__ == "__main__":
    main()

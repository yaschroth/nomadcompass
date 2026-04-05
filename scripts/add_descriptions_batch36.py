#!/usr/bin/env python3
"""Batch 36: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "puntacana": {
        "climate": "Punta Cana has a tropical climate with warm temperatures year-round (25-32°C). Hurricane season June to November. Beach weather always.",
        "cost": "Moderate for Caribbean. Apartments from $600-1100/month. Resort area pricing.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Resort development. Reliable.",
        "nightlife": "Resort scene with clubs and bars. All-inclusive options. Tourist-focused.",
        "nature": "Beautiful beaches and palm trees. Saona Island trips. Nature is Caribbean paradise.",
        "safety": "Safe resort area. Tourist infrastructure. Comfortable.",
        "food": "Dominican cuisine with fresh seafood. Resort and local options. Quality varies.",
        "community": "Tourism and expat community. Growing digital presence. International.",
        "english": "Good in tourism. Spanish helps locally.",
        "visa": "Tourist card required. 30 days extendable. Dominican Republic accessible.",
        "culture": "Caribbean resort culture. Dominican hospitality. Beach lifestyle.",
        "cleanliness": "Resorts well-maintained. Beach cleaning. Good standards.",
        "airquality": "Excellent air quality with Caribbean breezes. Clean and fresh."
    },
    "pushkar": {
        "climate": "Pushkar has a semi-arid climate with extremely hot summers (35-45°C) and mild winters (10-25°C). Best October to March. Desert influences.",
        "cost": "Very affordable with rooms from $100-300/month. India offers excellent value.",
        "wifi": "Basic infrastructure with speeds of 5-20 Mbps. Holy town limitations. Variable.",
        "nightlife": "Very limited due to holy town status. No alcohol officially. Rooftop cafes.",
        "nature": "Desert landscape with Pushkar Lake. Camel safari available. Nature is stark.",
        "safety": "Safe pilgrimage town. Indian hospitality. Comfortable for spiritual travelers.",
        "food": "Vegetarian only due to holy status. Indian and traveler options. Simple and pure.",
        "community": "Spiritual seekers and backpackers. Long-term travelers. Intimate.",
        "english": "Good in tourism. Hindi helps.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "Sacred Hindu town with Brahma temple. The spirituality is intense. Pilgrimage atmosphere.",
        "cleanliness": "Holy lake and town maintained. Religious significance. Variable.",
        "airquality": "Can be dusty. Desert climate. Check conditions."
    },
    "quebec": {
        "climate": "Quebec City has a humid continental climate with warm summers (18-26°C) and very cold winters (-15 to -3°C). French Canada character. Four intense seasons.",
        "cost": "Moderate for Canada. Apartments from CAD 1100-1800/month. More affordable than Vancouver.",
        "wifi": "Excellent infrastructure with speeds of 50-100 Mbps. Canadian standards. Reliable.",
        "nightlife": "Charming scene in Old Quebec. French Canadian culture. Atmospheric.",
        "nature": "St. Lawrence River and surrounding forests. Mountains accessible. Nature beautiful.",
        "safety": "Very safe with low crime. French Canadian hospitality. Comfortable.",
        "food": "French Canadian cuisine with poutine and tourtière. Quality restaurants. Excellent.",
        "community": "French-speaking community. University and tourism. Welcoming.",
        "english": "French dominant. English understood but French appreciated.",
        "visa": "Canadian visa rules. Various categories available.",
        "culture": "UNESCO Old City with French heritage. The most European city in North America. Charming.",
        "cleanliness": "Very clean with Canadian standards. Historic preservation. Excellent.",
        "airquality": "Good air quality with river and forests. Fresh Canadian air."
    },
    "queenstown": {
        "climate": "Queenstown has a temperate climate with warm summers (16-25°C) and cold winters (-2 to 8°C). Four seasons with ski option. Mountain weather.",
        "cost": "Expensive as adventure capital. Apartments from NZD 2000-3500/month. Tourism premium.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. NZ standards. Reliable.",
        "nightlife": "Active après-ski and adventure scene. Bars and restaurants. Vibrant.",
        "nature": "Stunning mountain and lake scenery. Adventure sports capital. Nature spectacular.",
        "safety": "Very safe with low crime. Kiwi hospitality. Very comfortable.",
        "food": "Quality restaurants with lamb and local produce. Wine region. Good.",
        "community": "Adventure and seasonal workers community. International visitors. Dynamic.",
        "english": "Native English. No barriers. Kiwi friendliness.",
        "visa": "NZ visa rules apply. Working holiday visas popular.",
        "culture": "Adventure capital of the world. Bungy jumping origin. Thrill-seeking identity.",
        "cleanliness": "Very clean with NZ standards. Pristine surroundings. Excellent.",
        "airquality": "Excellent air quality with mountain freshness. Pristine."
    },
    "quito": {
        "climate": "Quito has a subtropical highland climate at 2,800m with mild temperatures (10-21°C) year-round. Altitude keeps it spring-like. Two wet seasons.",
        "cost": "Very affordable with apartments from $350-700/month. Ecuador uses USD. Good value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. Reliable.",
        "nightlife": "La Mariscal has bars and clubs. Growing scene. Active.",
        "nature": "Surrounded by volcanoes. Equator line nearby. Nature spectacular.",
        "safety": "Requires awareness. Tourist areas safer. Research current situation. Standard caution.",
        "food": "Ecuadorian cuisine with locro and ceviche. Markets are excellent. Affordable.",
        "community": "Growing expat community. NGO presence. International.",
        "english": "Growing but Spanish essential. Learning Spanish important.",
        "visa": "90 days visa-free. Ecuador accessible. Various long-term options.",
        "culture": "UNESCO old town at altitude. Spanish colonial heritage. Cultural depth.",
        "cleanliness": "Historic center maintained. Development varies. Good in centro.",
        "airquality": "Good at altitude. Mountains help. Fresh highland air."
    },
    "rabat": {
        "climate": "Rabat has a Mediterranean climate with warm summers (25-30°C) and mild winters (10-18°C). Atlantic moderates. Pleasant year-round.",
        "cost": "Moderate for Morocco. Apartments from $400-800/month. Capital city prices.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Government investment. Reliable.",
        "nightlife": "Limited compared to Casablanca. Hotel bars and restaurants. Conservative capital.",
        "nature": "Atlantic coast and nearby forests. Beaches accessible. Nature pleasant.",
        "safety": "Safe capital city. Moroccan hospitality. Comfortable.",
        "food": "Moroccan cuisine with diplomatic influences. Quality restaurants. Good variety.",
        "community": "Diplomatic and government community. International presence. Established.",
        "english": "French more useful. Arabic local. Some English in business.",
        "visa": "90 days visa-free for most. Morocco accessible.",
        "culture": "Morocco's refined capital. UNESCO kasbah. Less chaotic than other cities.",
        "cleanliness": "Capital city standards. Better maintained than some Moroccan cities. Good.",
        "airquality": "Good with Atlantic breezes. Fresh coastal air."
    },
    "reykjavik": {
        "climate": "Reykjavik has a subarctic oceanic climate with cool summers (10-15°C) and mild winters (0-3°C). Gulf Stream moderates. Highly variable weather.",
        "cost": "Very expensive. Apartments from ISK 200000-350000/month ($1400-2500). Among world's costliest.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Famous weekend scene. Bars and clubs in center. Very active Friday-Saturday.",
        "nature": "Gateway to Golden Circle and highlands. Northern lights. Nature spectacular.",
        "safety": "Extremely safe with virtually no crime. Very comfortable.",
        "food": "New Nordic cuisine with lamb and seafood. Creative scene. Expensive but quality.",
        "community": "Small but international. Creative industries. Welcoming.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Iceland is accessible. Standard access.",
        "culture": "Nordic heritage with literary tradition. World's northernmost capital. Unique character.",
        "cleanliness": "Very clean. Geothermal energy. Pristine.",
        "airquality": "Excellent air quality. Among world's cleanest. Pristine."
    },
    "rhodes": {
        "climate": "Rhodes has a Mediterranean climate with hot summers (28-35°C) and mild winters (12-17°C). Greece's sunniest island. Beach weather most of year.",
        "cost": "Moderate with apartments from €400-800/month. Greek island value. Seasonal prices.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Active scene in old town and Faliraki. Greek and tourist mix. Very active in summer.",
        "nature": "Beautiful beaches and medieval old town. Valley of Butterflies. Nature varied.",
        "safety": "Very safe with low crime. Greek hospitality. Comfortable.",
        "food": "Greek cuisine with fresh seafood. Quality restaurants in old town. Good.",
        "community": "Tourism and expat community. Seasonal dynamics. International.",
        "english": "Good in tourism. Greek helps. Communication possible.",
        "visa": "Schengen rules apply. Greece is EU. Standard access.",
        "culture": "Medieval old town is UNESCO listed. Knights of St. John heritage. Historical depth.",
        "cleanliness": "Old town and beaches maintained. Tourism standards. Good.",
        "airquality": "Excellent air quality with sea breezes. Mediterranean freshness. Clean."
    },
    "rio": {
        "climate": "Rio de Janeiro has a tropical climate with hot summers (28-35°C) and mild winters (20-25°C). Beach weather year-round. Humid.",
        "cost": "Moderate for Brazil. Apartments from R$2500-5000/month ($500-1000). Varies hugely by neighborhood.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. Reliable in good areas.",
        "nightlife": "Legendary scene from Lapa to Ipanema. Samba and beach bars. World-class.",
        "nature": "Stunning with mountains meeting beaches. Christ the Redeemer. Nature integrated into city.",
        "safety": "Requires significant awareness. Know safe areas. Research neighborhoods carefully.",
        "food": "Brazilian cuisine with beach culture. Acai and churrasco. Outstanding variety.",
        "community": "International and local blend. Strong beach culture. Dynamic.",
        "english": "Limited with Portuguese essential.",
        "visa": "90 days visa-free. Brazil accessible. Digital nomad visa available.",
        "culture": "Carnival capital with samba heritage. Carioca lifestyle. Legendary atmosphere.",
        "cleanliness": "Beach areas cleaned. City varies. Tourist zones maintained.",
        "airquality": "Can be affected by traffic. Coastal breezes help. Variable."
    },
    "rishikesh": {
        "climate": "Rishikesh has a subtropical climate with hot summers (30-40°C) and cool winters (10-20°C). Himalayas nearby cool evenings. Monsoon June to September.",
        "cost": "Very affordable with rooms from $150-400/month. India offers excellent value.",
        "wifi": "Basic infrastructure with speeds of 5-30 Mbps. Yoga areas better. Variable.",
        "nightlife": "None - holy city with no alcohol or meat. Aarti ceremonies instead. Spiritual evenings.",
        "nature": "Ganges River and Himalayan foothills. Rafting and hiking. Nature beautiful.",
        "safety": "Very safe spiritual town. Indian hospitality. Comfortable.",
        "food": "Vegetarian only. Ayurvedic and yogic cuisine. Simple and healthy.",
        "community": "Yoga and spiritual community. Long-term practitioners. Welcoming.",
        "english": "Good in ashrams and yoga centers. Hindi helps.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "World yoga capital and Hindu pilgrimage. Ashrams line the Ganges. Spiritual intensity.",
        "cleanliness": "Sacred Ganges area maintained. Ashrams are clean. Variable elsewhere.",
        "airquality": "Good with Himalayan air. Better than plains. Fresh."
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

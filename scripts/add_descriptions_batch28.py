#!/usr/bin/env python3
"""Batch 28: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "kuching": {
        "climate": "Kuching has an equatorial climate with hot temperatures year-round (24-32°C). Rain can occur any time. Humid but sea breezes help.",
        "cost": "Very affordable with apartments from $300-600/month. Borneo offers excellent value. Lower cost than KL.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Malaysian standards. Reliable.",
        "nightlife": "Growing scene along the waterfront. Bars and cafes. More relaxed than West Malaysia.",
        "nature": "Gateway to Borneo rainforests and orangutans. Bako National Park nearby. Nature is world-class.",
        "safety": "Very safe with low crime. Sarawak hospitality. Very comfortable.",
        "food": "Sarawak laksa is famous. Multicultural cuisine. Outstanding local specialties.",
        "community": "Growing expat community attracted by lifestyle. Nomads discovering it. Developing.",
        "english": "Excellent English proficiency. Colonial heritage. Communication easy.",
        "visa": "Malaysian visa rules. 90 days visa-free for most. Easy access.",
        "culture": "Sarawak heritage with indigenous influences. Cat statues everywhere. Unique Borneo character.",
        "cleanliness": "Well-maintained waterfront. Clean city. Good standards.",
        "airquality": "Generally good with some haze season effects. Usually fresh. Check seasonal conditions."
    },
    "kunming": {
        "climate": "Kunming has a subtropical highland climate with mild temperatures year-round (10-25°C). Spring City nickname is earned. Eternal spring weather.",
        "cost": "Affordable with apartments from ¥2000-4000/month ($280-560). Chinese city value.",
        "wifi": "Good infrastructure with VPN needed for Western services. Speeds of 30-100 Mbps. Chinese internet restrictions.",
        "nightlife": "Growing scene with bars and clubs. University adds energy. Chinese nightlife.",
        "nature": "Stone Forest and surrounding lakes. Gateway to Yunnan. Nature is spectacular.",
        "safety": "Very safe with Chinese standards. Low crime. Comfortable.",
        "food": "Yunnan cuisine with crossing-the-bridge noodles. Fresh and flavorful. Excellent variety.",
        "community": "Small expat community. Chinese tourists dominate. Authentic experience.",
        "english": "Limited with Chinese essential. Tourism areas have some English. Learning Mandarin important.",
        "visa": "Chinese visa rules apply. 144-hour transit visa possible. Plan ahead.",
        "culture": "Diverse Yunnan heritage with minority cultures. The climate defines lifestyle. Spring city character.",
        "cleanliness": "Modern areas well-maintained. Chinese development. Good standards.",
        "airquality": "Good air quality for China. Highland location helps. Better than eastern cities."
    },
    "kyiv": {
        "climate": "Kyiv has a humid continental climate with warm summers (20-27°C) and cold winters (-5 to -1°C). Four distinct seasons. Snow in winter.",
        "cost": "Very affordable with apartments from $300-600/month. Ukraine offers excellent value. Prices vary with stability.",
        "wifi": "Excellent infrastructure with speeds of 50-150 Mbps. Ukraine has fast internet. Reliable.",
        "nightlife": "Vibrant scene when conditions allow. Bars and clubs in center. Ukrainian energy.",
        "nature": "Dnieper River runs through. Day trips to countryside. Urban green spaces.",
        "safety": "Highly variable - check current situation. Conflict has ongoing effects. Research carefully.",
        "food": "Ukrainian cuisine with borscht and varenyky. Hearty and affordable. Growing food scene.",
        "community": "Tech and creative community when conditions allow. Strong before 2022. Resilient.",
        "english": "Good among younger Ukrainians. Russian/Ukrainian local. Communication possible.",
        "visa": "90 days visa-free for most. Check current travel advisories. Situation dependent.",
        "culture": "Slavic heritage with European aspirations. The resilience is remarkable. Cultural depth.",
        "cleanliness": "Central areas maintained. Standards vary. Development was ongoing.",
        "airquality": "Generally good with some traffic effects. Better than expected. Variable."
    },
    "lagos": {
        "climate": "Lagos has a tropical climate with hot temperatures year-round (25-33°C). Rainy season from April to October. Humidity is high.",
        "cost": "Moderate to expensive for Africa. Apartments from $500-1200/month. Nigeria's commercial hub.",
        "wifi": "Variable infrastructure with speeds of 10-50 Mbps. Mobile data often better. Challenging.",
        "nightlife": "Famous scene with Afrobeat and clubs. The energy is intense. World-class nightlife.",
        "nature": "Urban with some beaches. Mangroves and lagoons define geography. Nature is secondary.",
        "safety": "Requires significant awareness. Research areas carefully. Use local guidance.",
        "food": "Nigerian cuisine is diverse and flavorful. Jollof rice debates are serious. Excellent local food.",
        "community": "Large business and tech community. Startup hub of Africa. Established networks.",
        "english": "Official language with Nigerian English. Communication easy.",
        "visa": "Visa required for most. Nigeria has requirements. Plan ahead.",
        "culture": "Nigeria's megacity with Yoruba heritage. The energy is unmatched. African dynamism.",
        "cleanliness": "Challenging with infrastructure limitations. Some areas maintained. Variable.",
        "airquality": "Can be poor with traffic and generators. Urban challenges. Check conditions."
    },
    "lanzarote": {
        "climate": "Lanzarote has a subtropical desert climate with warm temperatures year-round (18-28°C). Very little rain. Volcanic landscape affects weather.",
        "cost": "Moderate with apartments from €500-900/month. Canary Islands value. Tourist pricing.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Spanish standards. Reliable.",
        "nightlife": "Resort scene in Puerto del Carmen. Beach bars and restaurants. Relaxed.",
        "nature": "Volcanic landscape is dramatic. Timanfaya National Park. César Manrique art in nature.",
        "safety": "Very safe with tourist infrastructure. Canary Islands are welcoming. Comfortable.",
        "food": "Canarian cuisine with fresh fish. Mojo sauces are local. Spanish quality.",
        "community": "Expat and winter sun community. Artists and nature lovers. Established.",
        "english": "Good in tourism. German also common. Spanish helps locally.",
        "visa": "Schengen rules apply. Spanish digital nomad visa. Easy access.",
        "culture": "César Manrique's vision shaped the island. Art meets volcanic nature. Unique identity.",
        "cleanliness": "Very clean with environmental focus. Tourism standards. Well-maintained.",
        "airquality": "Excellent air quality with Atlantic winds. Clean volcanic air. Pristine."
    },
    "laos": {
        "climate": "Vientiane has a tropical monsoon climate with hot temperatures (22-35°C). Dry season November to April. Monsoon brings humidity.",
        "cost": "Very affordable with apartments from $200-450/month. Laos offers excellent value. Budget-friendly.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Developing country limitations. Improving.",
        "nightlife": "Limited by culture and regulations. Riverside restaurants and bars. Relaxed.",
        "nature": "Mekong River and surrounding countryside. Caves and waterfalls nearby. Nature is beautiful.",
        "safety": "Very safe with Lao hospitality. Peaceful atmosphere. Comfortable.",
        "food": "Lao cuisine with sticky rice and laap. French colonial influences. Fresh and flavorful.",
        "community": "Small expat and NGO community. Quiet capital. Intimate.",
        "english": "Limited with Lao or French helpful. Tourism has basic English. Learning local language helps.",
        "visa": "Visa on arrival available. 30 days. Extensions possible.",
        "culture": "Buddhist temples and French colonial heritage. The pace is slow. Traditional Southeast Asian.",
        "cleanliness": "Central areas maintained. Development ongoing. Variable.",
        "airquality": "Good generally but burning season can affect. Rural freshness. Usually clean."
    },
    "lasvegas": {
        "climate": "Las Vegas has a hot desert climate with scorching summers (35-45°C) and mild winters (8-15°C). Very little rain. Extreme heat in summer.",
        "cost": "Moderate for US. Apartments from $1200-2000/month. Entertainment costs extra.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Casino strip has great connectivity. Reliable.",
        "nightlife": "World-famous party scene. Casinos, clubs, and shows. 24/7 entertainment.",
        "nature": "Surrounding desert and Red Rock Canyon. Valley of Fire nearby. Nature surprisingly accessible.",
        "safety": "Tourist areas are safe. Strip is well-patrolled. Standard urban awareness elsewhere.",
        "food": "Celebrity chef restaurants and buffets. International cuisine. Quality ranges widely.",
        "community": "Entertainment and hospitality community. Digital presence growing. Transient character.",
        "english": "Native American English. Tourism industry multilingual. No barriers.",
        "visa": "US visa rules apply. ESTA for visa waiver countries. Standard access.",
        "culture": "Entertainment capital with casino culture. The Strip is unique. American excess.",
        "cleanliness": "Casinos immaculate. City areas vary. Tourist zones maintained.",
        "airquality": "Can be affected by dust and heat. Desert environment. Generally acceptable."
    },
    "lausanne": {
        "climate": "Lausanne has a temperate climate with warm summers (18-25°C) and cold winters (-1 to 5°C). Lake Geneva moderates weather. Four seasons.",
        "cost": "Very expensive as Swiss city. Apartments from CHF 1800-3000/month ($2000-3300). Swiss living costs.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Impeccable connectivity.",
        "nightlife": "Sophisticated scene with bars and clubs. Student energy from universities. Active.",
        "nature": "Lake Geneva and Alps views. Wine terraces are UNESCO listed. Nature is stunning.",
        "safety": "Extremely safe with low crime. Swiss organization. Very comfortable.",
        "food": "French Swiss cuisine with lake fish. Wine region specialties. High quality.",
        "community": "Olympic headquarters and university community. International organizations. Established.",
        "english": "Good alongside French. International presence ensures communication. French helps.",
        "visa": "Swiss rules apply. Non-Schengen but associated. Various permit options.",
        "culture": "Olympic capital with French Swiss character. The lake defines life. Refined atmosphere.",
        "cleanliness": "Immaculately clean with Swiss standards. Pristine lakeside. Excellent.",
        "airquality": "Excellent air quality with lake and Alps. Fresh mountain air. Pristine."
    },
    "lecce": {
        "climate": "Lecce has a Mediterranean climate with hot summers (28-35°C) and mild winters (8-15°C). Puglia is sunny. The south is warm.",
        "cost": "Affordable for Italy. Apartments from €350-600/month. Southern Italy value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Italian south developing. Reliable in center.",
        "nightlife": "Charming piazza scene. Bars and restaurants in baroque center. Atmospheric.",
        "nature": "Salento beaches nearby. Olive groves surround. Adriatic and Ionian coasts.",
        "safety": "Very safe with Southern hospitality. Low crime. Comfortable.",
        "food": "Pugliese cuisine with orecchiette and seafood. The food is exceptional. Outstanding value.",
        "community": "Small but growing international interest. Authentic Italian experience. Developing.",
        "english": "Limited with Italian essential. Tourism building English. Learning Italian helps.",
        "visa": "Schengen rules apply. Italian options available. Standard access.",
        "culture": "Baroque architecture rivals Rome. Florence of the South. Stunning heritage.",
        "cleanliness": "Historic center well-maintained. Pride in appearance. Beautiful.",
        "airquality": "Good air quality with southern freshness. Less industrial. Clean."
    },
    "leiden": {
        "climate": "Leiden has a temperate oceanic climate with mild temperatures (3-22°C). Rain is common. Dutch maritime influence.",
        "cost": "Moderate for Netherlands. Apartments from €900-1400/month. University town prices.",
        "wifi": "Excellent Dutch infrastructure with speeds of 100+ Mbps. Reliable. EU standards.",
        "nightlife": "Student scene with bars and cafes. Historic center has character. Active during term.",
        "nature": "Canals and bulb fields nearby. Dutch countryside accessible. Keukenhof famous.",
        "safety": "Very safe with low crime. Dutch organization. Comfortable.",
        "food": "Dutch and international options. Student-friendly pricing. Quality available.",
        "community": "University and international student community. Academic atmosphere. Welcoming.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Dutch options available. Standard access.",
        "culture": "Rembrandt's birthplace with oldest university. The heritage is rich. Academic character.",
        "cleanliness": "Very clean with Dutch standards. Historic center beautiful. Excellent.",
        "airquality": "Good air quality with coastal proximity. Dutch flatness helps ventilation. Fresh."
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

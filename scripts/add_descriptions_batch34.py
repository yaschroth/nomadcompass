#!/usr/bin/env python3
"""Batch 34: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "oviedo": {
        "climate": "Oviedo has an oceanic climate with mild temperatures (8-22°C). Northern Spain is greener and wetter. Pleasant year-round.",
        "cost": "Affordable for Spain. Apartments from €400-700/month. Asturias offers value.",
        "wifi": "Good Spanish infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "University scene with cider houses and bars. Sidrerías are famous. Active and traditional.",
        "nature": "Picos de Europa mountains nearby. Green landscape. Nature spectacular.",
        "safety": "Very safe with low crime. Asturian hospitality. Comfortable.",
        "food": "Asturian cuisine with fabada and cider. The food is hearty. Outstanding local character.",
        "community": "University community. Less touristy than southern Spain. Authentic.",
        "english": "Limited with Spanish essential. Regional language exists. Learning Spanish helps.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Pre-Romanesque architecture is UNESCO listed. Celtic heritage influences. Distinct character.",
        "cleanliness": "Well-maintained city center. Asturian pride. Good standards.",
        "airquality": "Good air quality with mountains and rain. Green region freshness. Clean."
    },
    "oxford": {
        "climate": "Oxford has a temperate oceanic climate with mild temperatures (4-22°C). Southern England. Rain is common.",
        "cost": "Expensive due to university. Apartments from £1200-1800/month. Academic town premium.",
        "wifi": "Excellent UK infrastructure with speeds of 50-100+ Mbps. University connectivity. Reliable.",
        "nightlife": "Pub culture with student energy. College bars and clubs. Active during term.",
        "nature": "Surrounding Cotswolds countryside. Rivers through city. Nature accessible.",
        "safety": "Very safe with university atmosphere. Low crime. Comfortable.",
        "food": "Growing food scene with covered market. Traditional pubs. Quality available.",
        "community": "Academic community dominates. International scholars. Intellectual atmosphere.",
        "english": "Native English with educated character. No barriers. Academic communication.",
        "visa": "UK visa rules apply. University visas common. Various categories.",
        "culture": "800+ years of academic heritage. Dreaming spires and colleges. Intellectual weight.",
        "cleanliness": "Beautifully maintained college grounds. Historic preservation. Pristine.",
        "airquality": "Good air quality with surrounding green. Better than London. Fresh."
    },
    "pai": {
        "climate": "Pai has a tropical climate with distinct seasons. Cool season (November-February) is pleasant at 15-25°C. Hot season is intense.",
        "cost": "Very affordable with apartments from $200-400/month. Cheap Thai mountain town.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Improving. Mountain town challenges.",
        "nightlife": "Small bars and live music. Walking street has atmosphere. Relaxed hippie vibe.",
        "nature": "Mountains and rice paddies. Hot springs and waterfalls. Nature is beautiful.",
        "safety": "Safe mountain town. Thai hospitality. Comfortable. Watch for motorbike accidents.",
        "food": "Thai and international for travelers. Night market is good. Affordable.",
        "community": "Backpacker and alternative community. Long-term travelers. Intimate.",
        "english": "Good in tourism. Thai helps locally.",
        "visa": "Standard Thai visa rules. Easy access.",
        "culture": "Hippie mountain town character. Relaxed alternative vibe. Different from Thailand mainstream.",
        "cleanliness": "Town center maintained. Tourism helps. Variable.",
        "airquality": "Can be affected by burning season smoke. Usually good. Check seasonal conditions."
    },
    "palermo": {
        "climate": "Palermo has a Mediterranean climate with hot summers (28-35°C) and mild winters (10-16°C). Sicily is sunny. Beach weather much of year.",
        "cost": "Affordable for Italy. Apartments from €350-650/month. Sicilian value.",
        "wifi": "Variable infrastructure with speeds of 20-50 Mbps. Italian south developing. Improving.",
        "nightlife": "Vibrant scene in center. Sicilian energy. Active and authentic.",
        "nature": "Surrounded by mountains and sea. Beach options available. Nature accessible.",
        "safety": "Generally safe with standard awareness. Tourist areas comfortable. Italian south.",
        "food": "Sicilian cuisine is legendary. Street food excellence. Arancini and seafood outstanding.",
        "community": "Local community with growing international interest. Authentic Italian experience.",
        "english": "Limited with Italian essential. Tourism has basic English. Italian helps.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Arab-Norman heritage is UNESCO listed. The history is layered. Intense character.",
        "cleanliness": "Varies by area. Some challenges. Centro improving.",
        "airquality": "Good with sea breezes. Mediterranean freshness. Generally clean."
    },
    "pamplona": {
        "climate": "Pamplona has an oceanic climate with warm summers (20-28°C) and cool winters (3-10°C). Northern Spain. Pyrenees influence.",
        "cost": "Affordable for Spain. Apartments from €450-750/month. Basque-Navarra value.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "San Fermín is legendary. Year-round pincho bars. Active and traditional.",
        "nature": "Pyrenees mountains nearby. Green surroundings. Nature accessible.",
        "safety": "Very safe with low crime. Navarra hospitality. Comfortable.",
        "food": "Basque-influenced pintxos and local wine. Excellent food culture. Outstanding.",
        "community": "University and local community. Less touristy outside festival. Authentic.",
        "english": "Limited with Spanish essential. Basque influences. Learning Spanish important.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Running of the bulls fame. Hemingway connection. Medieval old town. Rich heritage.",
        "cleanliness": "City center well-maintained. Spanish standards. Good.",
        "airquality": "Good air quality with mountain air. Fresh northern Spain. Clean."
    },
    "paraty": {
        "climate": "Paraty has a tropical climate with warm temperatures (18-30°C). Rainy season December to March. Coastal humidity.",
        "cost": "Moderate for Brazil. Apartments from R$2000-4000/month ($400-800). Tourism affects prices.",
        "wifi": "Basic infrastructure with speeds of 10-40 Mbps. Colonial town challenges. Improving.",
        "nightlife": "Charming scene in colonial center. Bars and restaurants. Atmospheric.",
        "nature": "Stunning coastline and Atlantic Forest. Islands and waterfalls. Nature exceptional.",
        "safety": "Safe tourist town. Standard awareness. Comfortable.",
        "food": "Brazilian and seafood focus. Cachaça distilleries. Quality available.",
        "community": "Small tourism community. Artists and writers. Intimate.",
        "english": "Limited with Portuguese essential.",
        "visa": "90 days visa-free. Brazil accessible.",
        "culture": "UNESCO colonial town frozen in time. Cobblestones and churches. Magical atmosphere.",
        "cleanliness": "Colonial center well-maintained. Tourism standards. Beautiful.",
        "airquality": "Good with coastal breezes. Forest surroundings help. Fresh."
    },
    "paris": {
        "climate": "Paris has a temperate oceanic climate with mild temperatures (4-25°C). Rain is possible year-round. Four seasons.",
        "cost": "Very expensive. Apartments from €1200-2200/month. World capital pricing.",
        "wifi": "Excellent French infrastructure with speeds of 50-100+ Mbps. Reliable.",
        "nightlife": "Legendary scene from jazz clubs to nightclubs. Endless options. Very active.",
        "nature": "Parks and Seine River. Day trips to Versailles. Urban but green spaces.",
        "safety": "Safe with standard urban awareness. Tourist areas comfortable. Pickpockets exist.",
        "food": "World culinary capital. Michelin stars to bistros. Outstanding everything.",
        "community": "Global community from all industries. Established expat networks. Diverse.",
        "english": "Good in tourism but French appreciated. Communication possible.",
        "visa": "Schengen rules apply. French options available. Standard access.",
        "culture": "World cultural capital. Museums, fashion, philosophy. The cultural weight is immense.",
        "cleanliness": "Varies by area. Tourist zones maintained. Metro can be dirty. Variable.",
        "airquality": "Moderate with some traffic effects. Better than expected. Acceptable."
    },
    "patagonia": {
        "climate": "El Calafate (Patagonia gateway) has a cold semi-arid climate with cool summers (8-18°C) and cold winters (-3 to 8°C). Wild and windy.",
        "cost": "Moderate for Argentina. Apartments from $400-800/month. Tourism pricing.",
        "wifi": "Basic infrastructure with speeds of 10-40 Mbps. Remote location challenges. Variable.",
        "nightlife": "Very limited. Small town bars. Nature focused destination.",
        "nature": "Glaciers and mountains. Perito Moreno is stunning. Nature is world-class.",
        "safety": "Safe tourist destination. Argentine hospitality. Comfortable.",
        "food": "Lamb and Argentine cuisine. Quality restaurants available. Simple but good.",
        "community": "Tourism and outdoor community. Seasonal visitors. Remote character.",
        "english": "Good in tourism. Spanish helps.",
        "visa": "90 days visa-free. Argentina accessible.",
        "culture": "Frontier culture at world's end. The landscape dominates. Adventure identity.",
        "cleanliness": "Tourist areas maintained. Remote town standards. Good.",
        "airquality": "Excellent air quality. Among world's cleanest. Pristine."
    },
    "perth": {
        "climate": "Perth has a Mediterranean climate with hot summers (28-35°C) and mild winters (10-18°C). Australia's sunniest capital. Dry heat.",
        "cost": "Moderate for Australia. Apartments from AUD 1500-2500/month. More affordable than Sydney.",
        "wifi": "Good infrastructure with NBN. Speeds of 40-80 Mbps. Improving.",
        "nightlife": "Growing scene with small bars. Northbridge and Fremantle. Developing.",
        "nature": "Beautiful beaches and surrounding bushland. Margaret River accessible. Nature excellent.",
        "safety": "Very safe with low crime. Western Australian lifestyle. Comfortable.",
        "food": "Growing food scene with fresh produce. Wine region influences. Quality.",
        "community": "Mining and expat community. Remote city character. Friendly isolation.",
        "english": "Native Australian English. No barriers.",
        "visa": "Australian visa rules. Working holiday visas. Immigration competitive.",
        "culture": "Most isolated capital. Relaxed lifestyle. Different from eastern cities. Unique character.",
        "cleanliness": "Very clean with Australian standards. Beach areas pristine. Excellent.",
        "airquality": "Excellent air quality with ocean breezes. Some bushfire risk. Generally pristine."
    },
    "perugia": {
        "climate": "Perugia has a humid subtropical climate with warm summers (26-32°C) and cool winters (3-10°C). Umbrian hills. Four seasons.",
        "cost": "Affordable for Italy. Apartments from €400-700/month. Central Italy value.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. University ensures connectivity. Reliable.",
        "nightlife": "University scene with bars and clubs. Piazza IV Novembre. Active during term.",
        "nature": "Umbrian hills and Lake Trasimeno. Green heart of Italy. Nature beautiful.",
        "safety": "Very safe with low crime. Italian hospitality. Comfortable.",
        "food": "Umbrian cuisine with truffles and olive oil. Chocolate is famous. Excellent.",
        "community": "Large international student community. University for foreigners. Welcoming.",
        "english": "Good among students. Italian helps locally. Communication possible.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Medieval hilltop city with Etruscan roots. University heritage. Authentic Italy.",
        "cleanliness": "Historic center well-maintained. Italian standards. Good.",
        "airquality": "Good air quality with hilltop location. Umbrian freshness. Clean."
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

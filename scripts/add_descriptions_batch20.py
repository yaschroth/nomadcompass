#!/usr/bin/env python3
"""Batch 20: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "catania": {
        "climate": "Catania has a Mediterranean climate with hot summers (30-38°C) and mild winters (10-16°C). Mount Etna creates microclimate effects. Very sunny.",
        "cost": "Affordable for Sicily. Apartments from €350-600/month. Southern Italy value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Italy is variable. Developing.",
        "nightlife": "Vibrant university scene. Via Etnea has options. Sicilian social culture.",
        "nature": "Mount Etna dominates the landscape. Beaches and volcanic terrain. Nature is dramatic.",
        "safety": "Generally safe with standard awareness. Sicily has improved significantly. Tourist areas comfortable.",
        "food": "Sicilian cuisine is exceptional. Arancini, pasta alla Norma, granita. Outstanding food.",
        "community": "University and local community. Growing international interest. Community developing.",
        "english": "Limited with Italian essential. Tourism is building English. Learning Italian helps.",
        "visa": "Schengen rules apply. Italy's options available. Standard European access.",
        "culture": "Baroque architecture and volcanic heritage. The history is layered. Sicilian pride is strong.",
        "cleanliness": "Varies by area. Central areas improving. Sicilian standards.",
        "airquality": "Generally good but Etna emissions occasionally affect area. Usually clean. Sea breezes help."
    },
    "chania": {
        "climate": "Chania has a Mediterranean climate with hot summers (28-33°C) and mild winters (10-16°C). Crete is sunny and warm. Pleasant most of the year.",
        "cost": "Affordable with apartments from €400-700/month. Crete offers value. Good quality of life.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Greece is developing. Tourist areas covered.",
        "nightlife": "Charming old harbor scene. Bars and restaurants in Venetian buildings. Atmospheric.",
        "nature": "Samaria Gorge and beaches nearby. Mountain and sea. Nature is spectacular.",
        "safety": "Very safe with low crime. Cretan hospitality is warm. Comfortable.",
        "food": "Cretan cuisine is healthy and delicious. Fresh ingredients and olive oil. Outstanding food.",
        "community": "Growing expat and nomad community. The climate attracts visitors. Community developing.",
        "english": "Good in tourism. Greek helps for deeper connection. Communication possible.",
        "visa": "Schengen rules apply. Greece offers digital nomad options. Easy access.",
        "culture": "Venetian harbor and Ottoman influences. The history is rich. Cretan identity is strong.",
        "cleanliness": "Old town is well-maintained. Tourism drives standards. Pleasant.",
        "airquality": "Excellent air quality with sea breezes. The island is clean. Fresh Mediterranean air."
    },
    "chefchaouen": {
        "climate": "Chefchaouen has a Mediterranean climate with warm summers (28-33°C) and cool winters (5-15°C). The Rif Mountains affect weather. Pleasant most of the year.",
        "cost": "Very affordable with apartments from $200-400/month. Morocco is cheap. Excellent value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Mountain town challenges. Developing.",
        "nightlife": "Very limited due to culture. Tea houses and rooftop terraces. Quiet evenings.",
        "nature": "Blue-washed mountain town. Hiking in Rif Mountains. Nature is accessible.",
        "safety": "Safe tourist destination. Moroccan hospitality. Comfortable for visitors.",
        "food": "Moroccan cuisine with mountain influences. Tagines and couscous. Affordable and tasty.",
        "community": "Small artist and photographer community. The blue city attracts creatives. Intimate.",
        "english": "Limited with Arabic, Berber, and French local. Tourism has some English. Learning helpful.",
        "visa": "90 days visa-free for most nationalities. Morocco is accessible.",
        "culture": "Famous blue city with Berber heritage. The medina is photogenic. Spiritual atmosphere.",
        "cleanliness": "The blue paint keeps things fresh. Maintained for tourism. Charming.",
        "airquality": "Excellent air quality in the mountains. Fresh and clean. Pristine mountain air."
    },
    "chiangrai": {
        "climate": "Chiang Rai has a tropical climate with distinct seasons. Cool season (November-February) is pleasant at 15-25°C. Hot season is intense.",
        "cost": "Very affordable with apartments from $200-400/month. Cheaper than Chiang Mai. Excellent value.",
        "wifi": "Decent infrastructure with speeds of 15-40 Mbps. Improving with tourism. Northern Thailand standards.",
        "nightlife": "Limited but growing. Night bazaar has options. More relaxed than Chiang Mai.",
        "nature": "Mountains and rice paddies. White Temple and blue temple. Golden Triangle nearby.",
        "safety": "Very safe with Thai hospitality. Peaceful atmosphere. Comfortable.",
        "food": "Northern Thai cuisine with Khantoke dinners. Fresh and flavorful. Excellent value.",
        "community": "Small expat community. Less developed than Chiang Mai. Authentic experience.",
        "english": "Limited compared to Chiang Mai. Thai helps significantly. Communication possible in tourism.",
        "visa": "Standard Thai visa rules. 30-60 day entries. Extensions possible.",
        "culture": "Lanna heritage with spectacular temples. The art scene is growing. Traditional atmosphere.",
        "cleanliness": "Generally clean with Thai standards. Tourist areas maintained. Pleasant.",
        "airquality": "Can be affected by burning season smoke. Generally good. Better than Chiang Mai sometimes."
    },
    "christchurch": {
        "climate": "Christchurch has a temperate oceanic climate with mild summers (18-23°C) and cool winters (5-12°C). The driest major NZ city. Four seasons.",
        "cost": "More affordable than Auckland. Rents from NZD 1400-2400/month. Post-earthquake development.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. NZ connectivity. Reliable.",
        "nightlife": "Rebuilding scene with bars and restaurants. The city is being reimagined. Developing.",
        "nature": "Gateway to South Island adventures. Banks Peninsula and mountains. Nature is spectacular.",
        "safety": "Very safe with low crime. Kiwi friendliness. Comfortable.",
        "food": "Farm-to-table focus with excellent produce. The food scene is growing. Quality available.",
        "community": "Growing tech and creative community. Post-earthquake innovation. Community rebuilding.",
        "english": "Native English with Kiwi character. No barriers. Friendly communication.",
        "visa": "NZ visa rules apply. Working holiday and skills visas. Various options.",
        "culture": "The garden city rebuilding after earthquakes. Innovation meets tradition. Resilience shows.",
        "cleanliness": "Very clean with new infrastructure. Kiwi standards. Fresh and modern.",
        "airquality": "Excellent air quality with South Island freshness. The mountains provide clean air. Pristine."
    },
    "clujnapoca": {
        "climate": "Cluj-Napoca has a humid continental climate with warm summers (20-28°C) and cold winters (-5 to 3°C). The Transylvanian hills affect weather.",
        "cost": "Affordable with apartments from €350-600/month. Romania is cheap. Excellent value.",
        "wifi": "Excellent Romanian infrastructure with speeds of 50-150+ Mbps. Among Europe's best internet.",
        "nightlife": "Vibrant student scene with bars and clubs. The old center has atmosphere. Lively.",
        "nature": "Transylvanian hills and Apuseni Mountains nearby. Nature is accessible. Beautiful surroundings.",
        "safety": "Very safe with low crime. Romania is orderly. Comfortable.",
        "food": "Transylvanian cuisine with Hungarian influences. Hearty and flavorful. Affordable.",
        "community": "Growing tech and startup community. Silicon Valley of Romania. Active community.",
        "english": "Good English among younger Romanians. Tech sector uses English. Communication easy.",
        "visa": "EU rules apply. Romania approaching Schengen. Easy access.",
        "culture": "Hungarian and Romanian heritage blend. University town energy. Cultural richness.",
        "cleanliness": "Old center is well-maintained. Development continues. Good standards.",
        "airquality": "Good air quality with hills around. Better than Bucharest. Fresh Transylvanian air."
    },
    "cochabamba": {
        "climate": "Cochabamba has eternal spring climate at 2,500m with pleasant temperatures year-round (15-27°C). The altitude moderates heat. Rainy season is mild.",
        "cost": "Extremely affordable with apartments from $200-400/month. Bolivia is South America's cheapest. Excellent value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Bolivia is developing. Improving.",
        "nightlife": "Local scene with bars and clubs. The student population adds energy. Authentic.",
        "nature": "Valley surrounded by mountains. Day trips to Chapare jungle. Nature is accessible.",
        "safety": "Generally safe with standard awareness. Bolivian hospitality. Comfortable for tourists.",
        "food": "Bolivian cuisine with silpancho and salteñas. Fresh produce from the valley. Affordable.",
        "community": "Small expat community. Less touristy than La Paz. Authentic experience.",
        "english": "Very limited with Spanish essential. Learning Spanish is important. Immersion opportunity.",
        "visa": "90 days visa-free for most nationalities. Bolivia is accessible.",
        "culture": "City of eternal spring with Spanish colonial heritage. Quechua influences. Traditional Bolivia.",
        "cleanliness": "Varies by area. Central areas maintained. Development ongoing.",
        "airquality": "Good air quality at altitude. The valley can trap some pollution. Generally clean."
    },
    "coimbra": {
        "climate": "Coimbra has a Mediterranean climate with hot summers (28-35°C) and mild winters (8-15°C). The Mondego River adds character. Pleasant most of the year.",
        "cost": "Affordable with apartments from €400-700/month. Cheaper than Lisbon or Porto. Good value.",
        "wifi": "Good Portuguese infrastructure with speeds of 40-80 Mbps. Reliable. University ensures connectivity.",
        "nightlife": "University town energy with Fado and bars. Academic traditions. Charming.",
        "nature": "River valley with surrounding hills. Forest walks accessible. Nature is pleasant.",
        "safety": "Very safe with low crime. University atmosphere. Comfortable.",
        "food": "Portuguese cuisine with regional specialties. Student-friendly prices. Quality available.",
        "community": "Student and academic community. Some international exchange. Developing expat presence.",
        "english": "Good among students. Portuguese enriches experience. Communication possible.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad options. Popular.",
        "culture": "One of Europe's oldest universities. The academic traditions are unique. Historic atmosphere.",
        "cleanliness": "Historic center is maintained. University pride shows. Pleasant.",
        "airquality": "Good air quality with river valley setting. Fresh inland air. Clean."
    },
    "cologne": {
        "climate": "Cologne has a temperate oceanic climate with mild summers (18-25°C) and cool winters (0-6°C). The Rhine moderates weather. Rain is common.",
        "cost": "Moderate for Germany. Apartments from €700-1200/month. Affordable by German standards.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Reliable. EU standards.",
        "nightlife": "Vibrant scene with Kölsch beer culture. Carnival is famous. The Belgisches Viertel has options.",
        "nature": "Rhine River runs through. Day trips to Eifel region. Urban but with river access.",
        "safety": "Safe with standard urban awareness. German efficiency. Comfortable.",
        "food": "Kölsch beer and local cuisine. Growing international scene. Quality options.",
        "community": "Creative and media community. International presence. Active networks.",
        "english": "Good English proficiency. German helps deeper connection. Communication easy.",
        "visa": "Schengen rules apply. German freelance visa options. Standard European access.",
        "culture": "Cathedral is UNESCO-listed. Carnival culture is unique. Cologne has distinctive identity.",
        "cleanliness": "Well-maintained with German standards. Public spaces are clean. Good.",
        "airquality": "Moderate with some traffic effects. The river provides ventilation. Acceptable."
    },
    "colombo": {
        "climate": "Colombo has a tropical climate with warm temperatures year-round (26-32°C). Monsoons bring rain in two seasons. Humidity is constant.",
        "cost": "Affordable with apartments from $400-800/month. Sri Lanka offers value. Developing infrastructure.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Mobile data can be better. Growing.",
        "nightlife": "Growing scene with bars and clubs. Galle Face area has options. Developing.",
        "nature": "Urban but beaches accessible. Day trips to hill country possible. Island nature is beautiful.",
        "safety": "Generally safe with improving conditions. Tourist areas are secure. Awareness needed.",
        "food": "Sri Lankan cuisine with rice and curry, hoppers, and kottu. Fresh and flavorful. Excellent.",
        "community": "Growing expat and digital community. Post-crisis recovery. Community rebuilding.",
        "english": "Good English proficiency. Colonial heritage. Communication is easy.",
        "visa": "ETA visa available online. 30-day stays extendable. Sri Lanka is accessible.",
        "culture": "Colonial heritage meets Buddhist traditions. The history is layered. Sri Lankan warmth.",
        "cleanliness": "Varies by area. Tourist zones maintained. Developing infrastructure.",
        "airquality": "Moderate with some traffic effects. Coastal breezes help. Variable quality."
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

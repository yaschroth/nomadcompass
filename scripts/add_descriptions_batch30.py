#!/usr/bin/env python3
"""Batch 30: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "lund": {
        "climate": "Lund has a temperate oceanic climate with mild summers (17-22°C) and cold winters (-1 to 4°C). Southern Sweden is milder. Four seasons.",
        "cost": "Expensive as Swedish city. Apartments from SEK 8000-13000/month ($750-1220). University town demand.",
        "wifi": "Excellent Swedish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Student scene with bars and clubs. Academic calendar affects activity. Active during term.",
        "nature": "Flat farmland and nearby coast. Day trips to Copenhagen easy. Nature is gentle.",
        "safety": "Very safe with Scandinavian standards. Low crime. Very comfortable.",
        "food": "Swedish cuisine with international options. Student-friendly. Quality available.",
        "community": "University community dominates. International students. Academic atmosphere.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Swedish requirements. Standard access.",
        "culture": "1000-year-old university town. Romanesque cathedral. Academic heritage.",
        "cleanliness": "Very clean with Swedish standards. University maintains. Excellent.",
        "airquality": "Excellent air quality with Scandinavian freshness. Clean."
    },
    "luxembourg": {
        "climate": "Luxembourg has a temperate oceanic climate with mild summers (18-24°C) and cool winters (0-5°C). Rain is common. Four seasons.",
        "cost": "Very expensive as financial hub. Apartments from €1500-2500/month. Among Europe's costliest.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. Financial hub connectivity. Impeccable.",
        "nightlife": "Sophisticated scene with bars and restaurants. International crowd. Quality over quantity.",
        "nature": "Surrounding forests and castles. Müllerthal trails. Compact country is accessible.",
        "safety": "Extremely safe with low crime. Well-organized. Very comfortable.",
        "food": "French and German influences blend. International cuisine. High quality.",
        "community": "International finance and EU community. Highly diverse. Established.",
        "english": "Excellent alongside French, German, and Luxembourgish. Communication easy.",
        "visa": "Schengen rules apply. Various residence options. Financial sector visas.",
        "culture": "Multilingual grand duchy. Medieval fortifications and modern finance. Unique character.",
        "cleanliness": "Very clean with high standards. Well-maintained. Excellent.",
        "airquality": "Good air quality with surrounding forests. Small country helps. Fresh."
    },
    "lviv": {
        "climate": "Lviv has a humid continental climate with warm summers (18-25°C) and cold winters (-5 to 0°C). Western Ukraine. Four seasons.",
        "cost": "Very affordable with apartments from $250-500/month. Ukraine offers excellent value. Prices vary with stability.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Ukraine has fast internet. Reliable.",
        "nightlife": "Famous coffee culture and bars. Historic center is atmospheric. Active scene.",
        "nature": "Carpathian Mountains accessible. Surrounded by countryside. Nature available.",
        "safety": "Check current situation. Western Ukraine different from east. Research carefully.",
        "food": "Ukrainian and Austrian influences. Coffee house culture. Quality and affordable.",
        "community": "Creative and tech community. Strong cultural identity. Resilient.",
        "english": "Good among younger Ukrainians. Ukrainian essential locally. Communication possible.",
        "visa": "90 days visa-free for most. Check current advisories.",
        "culture": "UNESCO old town with Habsburg heritage. Cultural capital of Ukraine. Deep history.",
        "cleanliness": "Historic center well-maintained. Pride in heritage. Good.",
        "airquality": "Generally good with some traffic effects. Better than eastern cities. Acceptable."
    },
    "lyon": {
        "climate": "Lyon has a semi-continental climate with warm summers (22-28°C) and cold winters (1-6°C). Two rivers confluence. Four seasons.",
        "cost": "Moderate for France. Apartments from €700-1200/month. More affordable than Paris.",
        "wifi": "Excellent French infrastructure with speeds of 50-100+ Mbps. Tech hub connectivity. Reliable.",
        "nightlife": "Vibrant scene with bouchons and bars. Student energy. Very active.",
        "nature": "Two rivers and surrounding hills. Beaujolais vineyards nearby. Nature accessible.",
        "safety": "Safe with standard urban awareness. French hospitality. Comfortable.",
        "food": "Gastronomic capital of France. Bouchons and starred restaurants. Outstanding.",
        "community": "Tech, academic, and foodie community. International presence. Established.",
        "english": "Good in business. French essential locally. Communication possible.",
        "visa": "Schengen rules apply. French options available. Standard access.",
        "culture": "Roman heritage and silk history. Traboules are unique. Cultural depth.",
        "cleanliness": "Historic areas maintained. French standards. Good.",
        "airquality": "Moderate with valley effects. Better than Paris. Acceptable."
    },
    "maastricht": {
        "climate": "Maastricht has a temperate oceanic climate with mild temperatures (3-23°C). Southern Netherlands is warmer. Rain is common.",
        "cost": "Moderate for Netherlands. Apartments from €800-1300/month. Less expensive than Amsterdam.",
        "wifi": "Excellent Dutch infrastructure with speeds of 100+ Mbps. Reliable. EU standards.",
        "nightlife": "Lively scene with bars and clubs. University energy. Burgundian atmosphere.",
        "nature": "Hills nearby (unusual for Netherlands). Belgian and German borders. Nature accessible.",
        "safety": "Very safe with low crime. Dutch organization. Comfortable.",
        "food": "Burgundian influences with Belgian proximity. Quality restaurants. Hearty.",
        "community": "University and European institutions community. International. Welcoming.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Dutch options. Standard access.",
        "culture": "Oldest Dutch city with European character. EU treaty signed here. Cross-border atmosphere.",
        "cleanliness": "Very clean with Dutch standards. Historic center beautiful. Excellent.",
        "airquality": "Good air quality for the region. Better than Randstad. Fresh."
    },
    "madeira": {
        "climate": "Madeira has a subtropical climate with mild temperatures year-round (16-26°C). Island of eternal spring. Mountains create microclimates.",
        "cost": "Moderate with apartments from €600-1100/month. Portuguese value. Rising with nomad interest.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Portugal invested in islands. Reliable.",
        "nightlife": "Relaxed scene in Funchal. Wine bars and restaurants. Charming atmosphere.",
        "nature": "Dramatic volcanic landscape. Levada walks famous. Nature is spectacular.",
        "safety": "Very safe with low crime. Portuguese hospitality. Very comfortable.",
        "food": "Madeira specialties with fresh fish. Wine and espetada. Quality.",
        "community": "Growing digital nomad community. Retirees and nature lovers. Welcoming.",
        "english": "Good English proficiency. Tourism ensures communication. Portuguese enriches.",
        "visa": "Schengen rules apply. Portuguese visas popular. Extended stays possible.",
        "culture": "Portuguese heritage on volcanic island. Gardens and wine culture. Relaxed island life.",
        "cleanliness": "Very clean with pride in appearance. Beautiful landscapes. Excellent.",
        "airquality": "Excellent air quality with Atlantic and mountain air. Pristine."
    },
    "malmo": {
        "climate": "Malmö has a temperate oceanic climate with mild summers (17-22°C) and cold winters (-1 to 4°C). Southern Sweden. Bridge to Copenhagen.",
        "cost": "Expensive as Swedish city. Apartments from SEK 9000-14000/month ($850-1300). Scandinavian prices.",
        "wifi": "Excellent Swedish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Growing scene with bars and clubs. Möllevången has character. Active.",
        "nature": "Beaches and flat countryside. Öresund region. Nature is gentle.",
        "safety": "Generally safe with some areas requiring awareness. Swedish standards overall. Comfortable.",
        "food": "Swedish and international cuisine. Diverse food scene. Quality.",
        "community": "Young and diverse community. Copenhagen accessible. International.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Swedish requirements. Standard access.",
        "culture": "Industrial heritage turned creative. Turning Torso defines modern Malmö. Progressive.",
        "cleanliness": "Very clean with Swedish standards. Development continues. Excellent.",
        "airquality": "Good air quality with coastal location. Fresh Scandinavian air. Clean."
    },
    "malta": {
        "climate": "Malta has a Mediterranean climate with hot summers (30-35°C) and mild winters (12-18°C). Among Europe's sunniest. Beach weather much of year.",
        "cost": "Moderate with apartments from €700-1200/month. Island costs but Mediterranean value. Rising.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. EU island standards. Reliable.",
        "nightlife": "Famous scene in Paceville. Beach clubs and bars. Very active.",
        "nature": "Beautiful coastline and Blue Lagoon. Small islands are accessible. Compact nature.",
        "safety": "Very safe with low crime. Maltese hospitality. Comfortable.",
        "food": "Maltese cuisine with Mediterranean influences. Fresh rabbit and fish. Quality.",
        "community": "Large international community. Gaming and crypto presence. Established.",
        "english": "Excellent as official language. British heritage. Communication easy.",
        "visa": "Schengen rules apply. Malta has residence programs. Various options.",
        "culture": "Knights of Malta heritage. 7000 years of history. Unique Mediterranean identity.",
        "cleanliness": "Varies by area. Tourist zones maintained. Good overall.",
        "airquality": "Good air quality with sea breezes. Mediterranean freshness. Clean."
    },
    "managua": {
        "climate": "Managua has a tropical climate with hot temperatures year-round (26-35°C). Dry season November to April. Lake affects humidity.",
        "cost": "Very affordable with apartments from $300-600/month. Nicaragua offers value. Budget-friendly.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Developing. Mobile data helps.",
        "nightlife": "Growing scene with bars and clubs. Zona Hippos has options. Developing.",
        "nature": "Lake Managua and volcanoes nearby. Apoyo Lagoon accessible. Nature dramatic.",
        "safety": "Requires awareness with situation variable. Research current conditions. Use caution.",
        "food": "Nicaraguan cuisine with gallo pinto. Fresh and affordable. Local specialties.",
        "community": "Small expat community. NGO presence. Authentic experience.",
        "english": "Limited with Spanish essential. Learning Spanish important.",
        "visa": "CA-4 agreement allows 90 days. Nicaragua accessible. Extensions possible.",
        "culture": "Revolutionary history and lake city. The earthquakes shaped development. Resilient.",
        "cleanliness": "Varies significantly. Some areas maintained. Challenges exist.",
        "airquality": "Generally acceptable with lake breezes. Some traffic effects. Variable."
    },
    "manchester": {
        "climate": "Manchester has a temperate oceanic climate with mild temperatures (4-20°C). Rain is frequent. Northern England weather.",
        "cost": "Moderate for UK. Apartments from £800-1300/month. More affordable than London.",
        "wifi": "Excellent UK infrastructure with speeds of 50-100+ Mbps. Tech hub connectivity. Reliable.",
        "nightlife": "Famous scene from Northern Quarter to clubs. Music heritage. Very active.",
        "nature": "Peak District nearby. Surrounding countryside. Day trips easy.",
        "safety": "Safe with standard urban awareness. Friendly northern character. Comfortable.",
        "food": "Growing food scene with Curry Mile famous. International options. Quality improving.",
        "community": "Tech, creative, and football community. Universities bring diversity. Active.",
        "english": "Native English with northern accent. No barriers. Friendly communication.",
        "visa": "UK visa rules apply. Tech visas available. Various categories.",
        "culture": "Industrial heritage turned creative. Music from Joy Division to Oasis. Cultural pride.",
        "cleanliness": "City center maintained. Development continues. Good.",
        "airquality": "Moderate with some urban effects. Better than London. Acceptable."
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

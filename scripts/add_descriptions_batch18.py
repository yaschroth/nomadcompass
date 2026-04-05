#!/usr/bin/env python3
"""Batch 18: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "brasov": {
        "climate": "Brașov has a humid continental climate with warm summers (18-26°C) and cold winters (-5 to 3°C). The Carpathian location affects weather. Snow is common in winter.",
        "cost": "Very affordable with apartments from €300-500/month. Romania offers excellent value. One of Europe's cheapest.",
        "wifi": "Excellent Romanian infrastructure with speeds of 50-150+ Mbps. Romania has some of Europe's best internet. Fast and cheap.",
        "nightlife": "Growing scene with bars in the old town. The town square has atmosphere. More charming than party-focused.",
        "nature": "Carpathian Mountains surround the city. Hiking, skiing, and bears. Nature is spectacular.",
        "safety": "Very safe with low crime. Transylvania is orderly. Comfortable atmosphere.",
        "food": "Romanian cuisine with mountain influences. Sarmale and mămăligă are highlights. Affordable and hearty.",
        "community": "Growing digital nomad community attracted by internet and costs. The old town draws visitors. Community developing.",
        "english": "Good English proficiency among younger Romanians. Tourism industry uses English. Communication possible.",
        "visa": "EU rules apply. 90-day stays for most. Romania approaching Schengen.",
        "culture": "Medieval Saxon town in Transylvania. The Black Church and surrounding walls. Dracula legends add mystique.",
        "cleanliness": "Old town is well-maintained. Tourism drives standards. Pleasant throughout.",
        "airquality": "Excellent air quality with mountain surroundings. The Carpathians ensure fresh air. Clean and crisp."
    },
    "bratislava": {
        "climate": "Bratislava has a humid continental climate with warm summers (22-28°C) and cold winters (-2 to 4°C). The Danube adds humidity. Four seasons.",
        "cost": "Moderate for central Europe. Apartments from €500-800/month. Cheaper than Vienna next door.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Slovak connectivity is reliable. EU standards.",
        "nightlife": "Vibrant old town scene. Bars along the Danube. The compact center has good options.",
        "nature": "The Danube and nearby Little Carpathians. Parks and cycling routes. Nature is accessible.",
        "safety": "Very safe with low crime. Slovakia is orderly. Comfortable throughout.",
        "food": "Slovak cuisine with bryndzové halušky famous. Czech and Austrian influences. Quality options available.",
        "community": "Growing international presence. Tech sector developing. Community is building.",
        "english": "Good English among younger Slovaks. Tourism industry uses English. Communication possible.",
        "visa": "Schengen rules apply. Standard European access. Easy for extended stays.",
        "culture": "Castle overlooking the Danube. Historic old town restored. Habsburg heritage.",
        "cleanliness": "Old town is well-maintained. Development continues. Good standards.",
        "airquality": "Generally good with Danube breezes. Some traffic effects. Acceptable quality."
    },
    "brighton": {
        "climate": "Brighton has a temperate oceanic climate with mild temperatures (5-21°C). Sea breezes moderate weather. The south coast is Britain's sunniest.",
        "cost": "Expensive as popular UK destination. Apartments from £1200-1800/month. High demand drives prices.",
        "wifi": "Good UK infrastructure with speeds of 50-100 Mbps. Reliable British service. Tech-friendly town.",
        "nightlife": "Famous party scene with clubs and bars. LGBTQ+ friendly. The pier and lanes have energy.",
        "nature": "Beach and South Downs National Park. Coastal walks are beautiful. Nature is accessible.",
        "safety": "Safe with standard urban awareness. The beach town is welcoming. Comfortable.",
        "food": "Excellent food scene with vegetarian focus. The Lanes have quality options. Progressive dining.",
        "community": "Creative and tech community. LGBTQ+ welcoming. Progressive atmosphere.",
        "english": "Native English with diverse accents. No barriers. Communication easy.",
        "visa": "UK visa rules apply. Various categories available. Post-Brexit requirements.",
        "culture": "Victorian seaside meets progressive modern. The Royal Pavilion is unique. Creative energy.",
        "cleanliness": "Beach and town are maintained. Tourist standards. Pleasant.",
        "airquality": "Good air quality with sea breezes. The coastal location ensures freshness. Clean sea air."
    },
    "brisbane": {
        "climate": "Brisbane has a humid subtropical climate with hot summers (28-35°C) and mild winters (10-21°C). Sunshine is abundant. Summer brings humidity and storms.",
        "cost": "More affordable than Sydney or Melbourne. Rents from AUD 1400-2400/month. Good value for Australian living.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-100 Mbps common. Australian standards.",
        "nightlife": "Growing scene in Fortitude Valley and South Bank. The city is emerging from quiet reputation. Improving.",
        "nature": "River city with surrounding beaches and hinterland. Day trips to Gold Coast easy. Urban parks developed.",
        "safety": "Very safe with low crime. Queensland lifestyle is relaxed. Comfortable.",
        "food": "Improving food scene with local produce emphasis. Asian influences strong. Quality available.",
        "community": "Growing tech and startup community. More affordable alternative to southern cities. Community building.",
        "english": "Native Australian English. No barriers. Laid-back communication style.",
        "visa": "Australian visa rules apply. Working holiday visas popular. Immigration is competitive.",
        "culture": "Queensland culture with outdoor focus. Arts scene growing. Brisbane finding its identity.",
        "cleanliness": "Very clean with subtropical greenery maintained. River adds character. Good standards.",
        "airquality": "Good air quality with coastal breezes. Some humidity in summer. Fresh subtropical air."
    },
    "bristol": {
        "climate": "Bristol has a temperate oceanic climate with mild temperatures (4-22°C). Rain is common. West country weather.",
        "cost": "Moderate for UK. Apartments from £900-1500/month. More affordable than London.",
        "wifi": "Good UK infrastructure with speeds of 50-100 Mbps. Tech sector presence. Reliable.",
        "nightlife": "Vibrant scene with famous music heritage. Street art culture. Alternative and creative.",
        "nature": "Clifton Suspension Bridge and surrounding green spaces. The Gorge is dramatic. Nature accessible.",
        "safety": "Safe with standard urban awareness. Creative atmosphere. Welcoming.",
        "food": "Growing food scene with independent focus. The Harbourside has options. Quality increasing.",
        "community": "Strong creative and tech community. Music and arts heritage. Progressive atmosphere.",
        "english": "Native English with west country accent. No barriers. Creative communication.",
        "visa": "UK visa rules apply. Various options available. Standard British requirements.",
        "culture": "Street art capital with Banksy origins. Music heritage from trip-hop to drum and bass. Creative identity.",
        "cleanliness": "Well-maintained with character. Street art adds rather than detracts. Good standards.",
        "airquality": "Good air quality for UK. The gorge and river help. Fresh western air."
    },
    "brno": {
        "climate": "Brno has a humid continental climate with warm summers (20-27°C) and cold winters (-3 to 3°C). Four distinct seasons. The valley location affects weather.",
        "cost": "Affordable for Europe. Apartments from €400-700/month. Czech value without Prague prices.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Czech connectivity is reliable. Tech sector growing.",
        "nightlife": "University town energy with bars and clubs. More relaxed than Prague. The local scene is authentic.",
        "nature": "The Moravian Karst and vineyards nearby. Parks provide urban green. Nature accessible.",
        "safety": "Very safe with low crime. Czechia is orderly. Comfortable atmosphere.",
        "food": "Czech cuisine with Moravian specialties. Wine region influences. Quality local food.",
        "community": "Growing international and tech community. University brings diversity. Community developing.",
        "english": "Good English among younger Czechs. Less tourist-focused than Prague. Communication possible.",
        "visa": "Schengen rules apply. Standard European access. Czechia is accessible.",
        "culture": "Functionalist architecture and university heritage. The culture is intellectual. Authentic Czech experience.",
        "cleanliness": "Well-maintained city center. Czech standards apply. Pleasant.",
        "airquality": "Generally good with some traffic effects. Better than Prague. Acceptable quality."
    },
    "bruges": {
        "climate": "Bruges has a temperate oceanic climate with mild temperatures (3-23°C). Rain is common. Maritime influence moderates weather.",
        "cost": "Moderate for Belgium. Apartments from €700-1100/month. Tourist town prices but manageable.",
        "wifi": "Excellent Belgian infrastructure with speeds of 50-100+ Mbps. Reliable. EU standards.",
        "nightlife": "Charming scene with Belgian beer bars. The market square has atmosphere. More romantic than party.",
        "nature": "Canals wind through the city. Day trips to coast are easy. The surrounding countryside is flat and green.",
        "safety": "Extremely safe with virtually no crime. The tourist town is welcoming. Very comfortable.",
        "food": "Belgian classics - chocolate, waffles, frites, and excellent beer. The food scene is quality. Touristic but good.",
        "community": "Tourist and hospitality community. International visitors dominate. Local community is distinct.",
        "english": "Excellent English alongside Dutch and French. Tourism ensures communication. No barriers.",
        "visa": "Schengen rules apply. Belgium bureaucracy is complex. Standard European access.",
        "culture": "UNESCO World Heritage medieval center. The preserved cityscape is remarkable. Chocolate and lace heritage.",
        "cleanliness": "Immaculately clean and maintained. Tourism drives standards. Beautiful preservation.",
        "airquality": "Good air quality with maritime influence. The canals add character. Fresh Belgian air."
    },
    "busan": {
        "climate": "Busan has a humid subtropical climate with hot summers (25-30°C) and mild winters (3-8°C). The sea moderates temperatures. Monsoon affects summer.",
        "cost": "More affordable than Seoul. Apartments from ₩700,000-1,200,000/month ($550-950). Good value for Korea.",
        "wifi": "Excellent Korean infrastructure with speeds of 100+ Mbps. Among world's fastest. Ubiquitous connectivity.",
        "nightlife": "Beach and harbor scene with Haeundae clubs. Korean nightlife culture applies. The scene is growing.",
        "nature": "Beautiful beaches and surrounding mountains. Temple hiking is popular. Coastal scenery is stunning.",
        "safety": "Very safe with low crime. Korean society is orderly. Very comfortable.",
        "food": "Fresh seafood capital with Jagalchi Market famous. Korean cuisine with coastal focus. Outstanding quality.",
        "community": "Growing international community. More relaxed than Seoul. Community developing.",
        "english": "Less English than Seoul but improving. Korean helps significantly. Tourism areas function.",
        "visa": "Standard Korean visa rules. K-ETA required. Working holiday visas available.",
        "culture": "Korea's beach city with temple heritage. Film festival brings international attention. Distinct from Seoul.",
        "cleanliness": "Very clean with Korean standards. Beaches are maintained. Excellent.",
        "airquality": "Better than Seoul with sea breezes. Occasional dust from China. Generally good."
    },
    "byronbay": {
        "climate": "Byron Bay has a subtropical climate with warm summers (25-30°C) and mild winters (15-20°C). The most easterly point of Australia. Pleasant year-round.",
        "cost": "Expensive with tourist and wellness demand. Apartments from AUD 2000-3500/month. High prices for beach town.",
        "wifi": "Variable with some areas challenging. Speeds of 20-50 Mbps where available. Improving with NBN.",
        "nightlife": "Beach bar scene and live music. Alternative and bohemian. The vibe is relaxed.",
        "nature": "Famous lighthouse and beaches. Hinterland rainforest is accessible. Nature is spectacular.",
        "safety": "Very safe with beach town atmosphere. Relaxed and welcoming. Comfortable.",
        "food": "Organic and health-conscious focus. Farm-to-table culture. The food scene matches the wellness vibe.",
        "community": "Wellness and creative community. Established alternative scene. Strong sense of community.",
        "english": "Native Australian English. No barriers. Alternative lifestyle vocabulary.",
        "visa": "Australian visa rules apply. Working holiday visas. Popular with backpackers.",
        "culture": "Alternative and wellness capital of Australia. Surfing and yoga culture. Bohemian energy.",
        "cleanliness": "Beach areas are maintained. Eco-consciousness shows. Pleasant overall.",
        "airquality": "Excellent air quality with ocean breezes. The coastal location ensures freshness. Pristine air."
    },
    "cadiz": {
        "climate": "Cádiz has a Mediterranean climate with hot summers (28-35°C) and mild winters (10-17°C). The ocean moderates temperatures. One of Spain's sunniest cities.",
        "cost": "Affordable by Spanish standards. Apartments from €400-700/month. Excellent value for coastal living.",
        "wifi": "Good Spanish infrastructure with speeds of 40-80 Mbps. Reliable. Fiber expanding.",
        "nightlife": "Vibrant Andalusian scene with flamenco and tapas. Carnival is famous. The old town is lively.",
        "nature": "Beautiful beaches and Atlantic coast. Day trips to Morocco possible by ferry. Ocean is the draw.",
        "safety": "Safe with standard awareness. Andalusian hospitality is warm. Comfortable.",
        "food": "Excellent seafood and tapas. Fritura gaditana is famous. The food scene is outstanding value.",
        "community": "Small but growing international community. Kite surfing attracts visitors. Community developing.",
        "english": "Limited with Spanish essential. Andalusian dialect can be challenging. Learning Spanish important.",
        "visa": "Schengen rules apply. Spanish digital nomad visa available. Good for extended stays.",
        "culture": "One of Europe's oldest cities with Phoenician heritage. Carnival rivals Rio. The culture is proud and festive.",
        "cleanliness": "Old town is well-maintained. Beaches are cleaned. Good standards.",
        "airquality": "Excellent air quality with Atlantic breezes. The peninsula location ensures freshness. Clean sea air."
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

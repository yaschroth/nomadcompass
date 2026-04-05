#!/usr/bin/env python3
"""Batch 19: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "cairns": {
        "climate": "Cairns has a tropical climate with hot, humid summers (28-33°C) and mild winters (18-26°C). The wet season brings heavy rain. Gateway to the reef.",
        "cost": "Moderate for Australia. Rents from AUD 1300-2200/month. Tourism affects prices.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-80 Mbps. Australian standards.",
        "nightlife": "Backpacker scene with bars and clubs. The Esplanade has options. Tourist-focused.",
        "nature": "Gateway to Great Barrier Reef and Daintree Rainforest. World-class natural attractions. Nature is the draw.",
        "safety": "Safe with standard awareness. Beach and wildlife safety important. Comfortable.",
        "food": "Fresh seafood and international options. Tourist dining is available. Quality varies.",
        "community": "Tourism and diving community. Backpackers pass through. Seasonal dynamics.",
        "english": "Native Australian English. No barriers. Tourism industry focused.",
        "visa": "Australian visa rules apply. Working holiday visas popular. Gateway to reef trips.",
        "culture": "Indigenous heritage and reef conservation culture. The relaxed tropical vibe prevails. Adventure tourism.",
        "cleanliness": "Esplanade and tourist areas maintained. Standards are good. Tropical challenges.",
        "airquality": "Good air quality with tropical breezes. Wet season can be humid. Fresh coastal air."
    },
    "cairo": {
        "climate": "Cairo has a hot desert climate with scorching summers (35-42°C) and mild winters (15-22°C). The heat is intense. Very little rainfall.",
        "cost": "Very affordable with apartments from $200-500/month. Egypt is cheap. Excellent value.",
        "wifi": "Variable infrastructure with speeds of 10-40 Mbps. Improving but can be unreliable. Mobile data often better.",
        "nightlife": "Growing scene with Nile-side bars. Zamalek has sophisticated options. Cultural restrictions apply.",
        "nature": "The Pyramids and Nile River define the landscape. Desert excursions possible. The history is overwhelming.",
        "safety": "Requires awareness with petty crime and scams. Political situation variable. Research current conditions.",
        "food": "Egyptian cuisine with koshari, foul, and fresh bread. The food is flavorful and cheap. Street food culture.",
        "community": "International development and academic community. Long-term expats exist. Networks established.",
        "english": "Variable with Arabic dominant. Tourism areas have English. Learning Arabic helps.",
        "visa": "Visa on arrival for most nationalities. Egypt is accessible. Extensions possible.",
        "culture": "5,000 years of civilization from Pharaohs to present. The cultural weight is immense. One of history's great cities.",
        "cleanliness": "Challenging with traffic and pollution. Some areas are maintained. Standards vary significantly.",
        "airquality": "Poor with traffic and desert dust. One of the world's most polluted cities. Air quality is concerning."
    },
    "calgary": {
        "climate": "Calgary has a humid continental climate with cold winters (-10 to -5°C) and warm summers (20-28°C). Chinook winds bring sudden warming. Four distinct seasons.",
        "cost": "More affordable than Vancouver or Toronto. Rents from CAD 1400-2200/month. Oil economy affects prices.",
        "wifi": "Excellent infrastructure with speeds of 50-150 Mbps. Canadian standards. Reliable.",
        "nightlife": "Growing scene with country music influence. Downtown has options. Cowboy culture during Stampede.",
        "nature": "Gateway to Banff and the Rockies. Mountains are accessible. Outdoor lifestyle is strong.",
        "safety": "Very safe with low crime. Canadian politeness applies. Comfortable.",
        "food": "Alberta beef is famous. Growing food scene with international options. Quality available.",
        "community": "Oil and tech community. Growing startup scene. Community is established.",
        "english": "Native English with Canadian character. No barriers. Professional communication.",
        "visa": "Canadian visa rules apply. Various options available. Working holiday visas for some.",
        "culture": "Cowboy culture meets oil industry. The Stampede is famous. Modern Canadian city.",
        "cleanliness": "Very clean with Canadian standards. Well-maintained city. High standards.",
        "airquality": "Good air quality with mountain breezes. Occasional smoke from wildfires. Generally clean."
    },
    "cambridge": {
        "climate": "Cambridge has a temperate oceanic climate with mild temperatures (4-22°C). Rain is possible year-round. East Anglia is one of UK's driest regions.",
        "cost": "Expensive due to university and tech. Apartments from £1200-1800/month. High demand.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. Tech hub connectivity. Reliable.",
        "nightlife": "Pub culture with student energy. The Cam riverside has options. More traditional than clubbing.",
        "nature": "The River Cam and surrounding fenlands. Punting is traditional. Countryside is accessible.",
        "safety": "Very safe with university atmosphere. Low crime. Comfortable throughout.",
        "food": "Growing food scene with quality options. University influence brings diversity. Traditional pubs.",
        "community": "Academic and tech community. Silicon Fen has international presence. Networks established.",
        "english": "Native English with educated influence. No barriers. Academic communication.",
        "visa": "UK visa rules apply. University and tech visas common. Various options.",
        "culture": "800 years of academic heritage. College architecture is stunning. Intellectual atmosphere.",
        "cleanliness": "Beautifully maintained historic town. College grounds are pristine. High standards.",
        "airquality": "Good air quality with flat, open surroundings. Better than London. Fresh fenland air."
    },
    "canberra": {
        "climate": "Canberra has a humid continental climate with warm summers (25-30°C) and cold winters (-3 to 12°C). Four distinct seasons. Frost is common in winter.",
        "cost": "More affordable than Sydney. Rents from AUD 1500-2500/month. Public servant economy.",
        "wifi": "Excellent infrastructure as national capital. Speeds of 50-100+ Mbps. NBN well-implemented.",
        "nightlife": "Limited compared to other capitals. Civic has options. More relaxed pace.",
        "nature": "Surrounding bushland and mountains. Lake Burley Griffin is central. Outdoor lifestyle.",
        "safety": "Very safe with government town atmosphere. Low crime. Comfortable.",
        "food": "Growing food scene with multicultural options. Quality available. Less exciting than Sydney.",
        "community": "Government, academic, and diplomatic community. International presence. Established networks.",
        "english": "Native Australian English. No barriers. Professional communication.",
        "visa": "Australian visa rules apply. Government and diplomatic visas common. Standard access.",
        "culture": "National institutions and planned city design. Museums and galleries are excellent. The artificial lake adds character.",
        "cleanliness": "Very clean and well-planned. National capital standards. High maintenance.",
        "airquality": "Generally good but bushfire smoke can be severe. Summer brings risk. Usually clean."
    },
    "cantho": {
        "climate": "Can Tho has a tropical monsoon climate with hot weather year-round (25-35°C). Wet season from May to November. Mekong Delta humidity.",
        "cost": "Very affordable with apartments from $200-400/month. Vietnam is cheap. Excellent value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Better than rural areas. Developing.",
        "nightlife": "Limited but growing scene. Local bars and cafes. More authentic than tourist.",
        "nature": "Mekong Delta waterways and floating markets. The river life is unique. Nature is fascinating.",
        "safety": "Safe and welcoming. Vietnamese hospitality applies. Comfortable atmosphere.",
        "food": "Mekong Delta cuisine with fresh fish and tropical fruits. The food is distinctive. Excellent value.",
        "community": "Small expat community. Less touristy than coastal cities. Authentic experience.",
        "english": "Limited with Vietnamese essential. Growing with tourism. Learning Vietnamese helps.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy 30-day stays.",
        "culture": "Mekong Delta culture with floating markets. The water-based life is unique. Traditional Vietnam.",
        "cleanliness": "Developing standards. Some infrastructure challenges. Improving.",
        "airquality": "Generally good with river breezes. Less industrial than north. Fresh delta air."
    },
    "capeverde": {
        "climate": "Cape Verde has a tropical dry climate with warm temperatures year-round (22-30°C). Trade winds moderate heat. Very little rainfall.",
        "cost": "Moderate for Africa. Apartments from €400-800/month. Island import costs apply.",
        "wifi": "Improving infrastructure with speeds of 10-40 Mbps. Island connectivity challenges. Developing.",
        "nightlife": "Music scene with morna and coladeira. Bars and live music. African rhythms.",
        "nature": "Volcanic islands with dramatic landscapes. Beaches and hiking. Each island is different.",
        "safety": "Safe for Africa. The islands are welcoming. Comfortable atmosphere.",
        "food": "Cachupa is the national dish. Portuguese and African influences. Fresh seafood available.",
        "community": "Small expat community. Music and kite surfing attract visitors. Community is developing.",
        "english": "Portuguese is official. Some English in tourism. Learning Portuguese helps.",
        "visa": "Visa required for most. Can be obtained online or on arrival. Accessible.",
        "culture": "Creole culture with Portuguese heritage. Cesária Évora's homeland. Music defines identity.",
        "cleanliness": "Varies by island. Tourist areas maintained. Development ongoing.",
        "airquality": "Excellent air quality with Atlantic winds. The islands are pristine. Clean ocean air."
    },
    "cappadocia": {
        "climate": "Cappadocia has a continental climate with hot summers (28-35°C) and cold winters (-5 to 5°C). The elevation keeps it cooler. Snow in winter.",
        "cost": "Affordable with cave hotels from $300-700/month. Turkey is cheap. Good value for unique experience.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Reliable in hotels.",
        "nightlife": "Limited but atmospheric. Cave bars and restaurants. The experience is about landscape not parties.",
        "nature": "Fairy chimneys and underground cities. Hot air balloons at sunrise. The landscape is otherworldly.",
        "safety": "Very safe tourist destination. Turkish hospitality. Comfortable throughout.",
        "food": "Turkish cuisine with pottery kebab famous. Local wines from volcanic soil. Excellent food.",
        "community": "Small tourism community. Seasonal visitors. Long-term expats are few.",
        "english": "Tourism has built English proficiency. Turkish helps. Communication possible.",
        "visa": "Turkish e-visa rules apply. Easy access for up to 90 days.",
        "culture": "Byzantine cave churches and underground cities. The history is ancient. Unique landscape culture.",
        "cleanliness": "Tourist areas are maintained. The landscape is protected. Good standards.",
        "airquality": "Excellent air quality with highland freshness. The remote location ensures clean air. Pristine."
    },
    "casablanca": {
        "climate": "Casablanca has a Mediterranean climate with warm summers (25-30°C) and mild winters (10-18°C). The Atlantic moderates temperatures. Fog is common.",
        "cost": "Moderate for Morocco. Apartments from $400-800/month. More expensive than interior cities.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Morocco has invested in connectivity. Improving.",
        "nightlife": "Growing scene with bars and clubs. The Hassan II Mosque area has options. More liberal than interior.",
        "nature": "Atlantic coastline is the main natural feature. Day trips to Atlas Mountains possible. Urban environment.",
        "safety": "Generally safe with standard awareness. More cosmopolitan than other Moroccan cities. Comfortable.",
        "food": "Moroccan cuisine with excellent seafood due to coast. French influences. Quality restaurants.",
        "community": "Business and expatriate community. International presence. Networks exist.",
        "english": "French is more useful than English. Arabic is local. Business uses French.",
        "visa": "90 days visa-free for most nationalities. Morocco is accessible. Easy extended stays.",
        "culture": "Art Deco architecture meets Moroccan tradition. The Hassan II Mosque is spectacular. Modern Morocco.",
        "cleanliness": "Modern areas are maintained. Some urban challenges. Standards vary.",
        "airquality": "Good with Atlantic breezes. The coastal location helps. Fresh sea air."
    },
    "cascais": {
        "climate": "Cascais has a Mediterranean climate with warm summers (25-30°C) and mild winters (10-16°C). Atlantic breezes moderate heat. Pleasant year-round.",
        "cost": "Moderate to expensive as Lisbon suburb. Apartments from €800-1400/month. High demand.",
        "wifi": "Excellent Portuguese infrastructure with speeds of 50-100+ Mbps. Fiber available. Reliable.",
        "nightlife": "Beach bar scene and town center options. More relaxed than Lisbon. Sophisticated.",
        "nature": "Beautiful Atlantic coastline. Sintra Mountains nearby. Nature is accessible.",
        "safety": "Very safe coastal town. Low crime. Comfortable throughout.",
        "food": "Fresh seafood and Portuguese cuisine. Quality restaurants. Beach dining is excellent.",
        "community": "Established expat community. Surf and beach culture. Community is active.",
        "english": "Good English proficiency. Portuguese enriches experience. Communication easy.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad visas. Popular for extended stays.",
        "culture": "Historic fishing village turned upscale resort. The palace and coast blend. Portuguese elegance.",
        "cleanliness": "Very clean and well-maintained. Tourism drives standards. Beautiful.",
        "airquality": "Excellent air quality with Atlantic breezes. The coastal location ensures freshness. Clean sea air."
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

#!/usr/bin/env python3
"""Batch 22: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "daressalaam": {
        "climate": "Dar es Salaam has a tropical climate with hot temperatures year-round (25-33°C). Humid with two rainy seasons. The coast moderates heat slightly.",
        "cost": "Moderate for East Africa. Apartments from $500-1000/month. Regional hub prices apply.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Tanzania has invested. Mobile data often better.",
        "nightlife": "Growing scene with beach bars and clubs. African music and dance. Developing.",
        "nature": "Indian Ocean coastline. Gateway to Zanzibar. Day trips to islands possible.",
        "safety": "Requires awareness with petty crime existing. Tourist areas are safer. Standard caution.",
        "food": "Swahili cuisine with fresh seafood. Indian influences. Flavorful and affordable.",
        "community": "International development and business community. Growing expat presence. Networks exist.",
        "english": "Good English alongside Swahili. Tanzania's colonial heritage. Communication possible.",
        "visa": "Visa on arrival for most nationalities. Tanzania is accessible.",
        "culture": "Swahili culture meets urban African energy. The coastal heritage is rich. Development is rapid.",
        "cleanliness": "Varies significantly by area. Development ongoing. Some challenges.",
        "airquality": "Moderate with traffic and dust. Coastal breezes help. Variable."
    },
    "darwin": {
        "climate": "Darwin has a tropical climate with two seasons: wet (November-April) and dry (May-October). Temperatures stay warm (25-33°C). Monsoonal storms are spectacular.",
        "cost": "Moderate for Australia. Rents from AUD 1400-2200/month. Smaller market.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-80 Mbps. Australian standards.",
        "nightlife": "Relaxed scene with waterfront options. The Mindil Beach markets are famous. Tropical vibe.",
        "nature": "Gateway to Kakadu and the Top End. Crocodiles and wildlife. Nature is spectacular.",
        "safety": "Safe with wildlife awareness needed. Crocodiles are real. Comfortable in town.",
        "food": "Asian influences due to proximity. Fresh seafood and tropical produce. Multicultural dining.",
        "community": "Small but diverse community. Military and government presence. Remote character.",
        "english": "Native Australian English. No barriers. Relaxed communication.",
        "visa": "Australian visa rules apply. Remote location for travelers. Working holiday visas.",
        "culture": "Indigenous heritage and Asian influences. The Top End has unique character. Frontier atmosphere.",
        "cleanliness": "Well-maintained with Australian standards. Tropical challenges. Good overall.",
        "airquality": "Good with wet season cleaning air. Occasional bushfire smoke. Generally fresh."
    },
    "dresden": {
        "climate": "Dresden has a humid continental climate with warm summers (20-26°C) and cold winters (-2 to 4°C). The Elbe River valley affects weather. Four seasons.",
        "cost": "Affordable for Germany. Apartments from €500-800/month. Eastern Germany value.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Reliable. EU standards.",
        "nightlife": "Growing scene with Neustadt district famous. Alternative and artistic vibe. Active.",
        "nature": "Elbe River and Saxon Switzerland nearby. Beautiful hiking. Nature is accessible.",
        "safety": "Safe with standard awareness. The city is orderly. Comfortable.",
        "food": "Saxon cuisine with German specialties. Growing international scene. Quality.",
        "community": "Creative and tech community growing. Eastern German character. Developing.",
        "english": "Good among younger Germans. German helps. Communication possible.",
        "visa": "Schengen rules apply. German freelance visa options. Standard access.",
        "culture": "Baroque rebuilding after WWII is remarkable. The cultural heritage is rich. Art and music.",
        "cleanliness": "Well-maintained with German standards. Public spaces clean. Good.",
        "airquality": "Good air quality with river valley. Better than industrial past. Fresh."
    },
    "dumaguete": {
        "climate": "Dumaguete has a tropical climate with warm temperatures year-round (25-32°C). Protected from typhoons by mountains. Pleasant climate.",
        "cost": "Very affordable with apartments from $200-400/month. Philippines is cheap. Excellent value.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. University town helps. Developing.",
        "nightlife": "Relaxed scene along Rizal Boulevard. University adds energy. More charming than party.",
        "nature": "Gateway to Apo Island diving. Twin lakes in mountains. Nature is excellent.",
        "safety": "Very safe small city. Filipino hospitality. Comfortable.",
        "food": "Filipino cuisine with local seafood. University student pricing. Good value.",
        "community": "Established expat community especially retirees. Growing nomad presence. Welcoming.",
        "english": "Excellent as in all Philippines. University enhances this. Easy communication.",
        "visa": "Standard Philippine visa rules. Easy extensions. Good for long stays.",
        "culture": "City of Gentle People. University town atmosphere. Relaxed Filipino culture.",
        "cleanliness": "Better than most Philippine cities. Pride in appearance. Pleasant.",
        "airquality": "Good air quality with sea breezes. Clean provincial air."
    },
    "dusseldorf": {
        "climate": "Düsseldorf has a temperate oceanic climate with mild summers (18-24°C) and cool winters (1-6°C). The Rhine moderates weather. Rain is common.",
        "cost": "Expensive German city. Apartments from €800-1400/month. Business hub prices.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. German efficiency. Reliable.",
        "nightlife": "Famous Altstadt (old town) with hundreds of bars. German beer culture. Very active.",
        "nature": "Rhine River runs through. Day trips to countryside possible. Urban but green.",
        "safety": "Very safe with low crime. German order. Comfortable.",
        "food": "German cuisine and international options. Japanese community adds variety. Quality.",
        "community": "Japanese and international business community. Creative industries. Networks.",
        "english": "Good English in business. German helps. Communication easy.",
        "visa": "Schengen rules apply. German freelance visa options. Standard access.",
        "culture": "Fashion and art capital. The Kunstsammlung is world-class. Modern Germany.",
        "cleanliness": "Very clean with German standards. Well-maintained. Excellent.",
        "airquality": "Good air quality for Germany. Rhine provides ventilation. Clean."
    },
    "eilat": {
        "climate": "Eilat has a hot desert climate with scorching summers (35-45°C) and mild winters (15-25°C). Very little rain. Red Sea location.",
        "cost": "Expensive for Israel. Apartments from $1000-1800/month. Resort prices.",
        "wifi": "Good Israeli infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Resort scene with beach bars and clubs. Tourist-focused. Active in season.",
        "nature": "Red Sea coral reefs for diving. Desert and mountains nearby. Nature is the draw.",
        "safety": "Safe with Israeli security measures. Tourist area is secure. Comfortable.",
        "food": "Israeli cuisine with fresh seafood. International resort options. Quality.",
        "community": "Tourism and diving community. Seasonal workers. Resort atmosphere.",
        "english": "Good English alongside Hebrew. Tourism ensures communication.",
        "visa": "90 days visa-free for most Western nationalities. Israel is accessible.",
        "culture": "Resort culture meets Israeli identity. Tax-free shopping draws visitors. Beach lifestyle.",
        "cleanliness": "Tourist areas maintained. Beach standards are good. Clean.",
        "airquality": "Good with sea and desert breezes. Dry and fresh. Clean."
    },
    "eindhoven": {
        "climate": "Eindhoven has a temperate oceanic climate with mild summers (17-22°C) and cool winters (1-6°C). Rain is common. Dutch weather.",
        "cost": "Moderate for Netherlands. Apartments from €900-1400/month. Cheaper than Amsterdam.",
        "wifi": "Excellent Dutch infrastructure with speeds of 100+ Mbps. High tech city. Reliable.",
        "nightlife": "Growing creative scene. Strijp-S district is trendy. Design-focused atmosphere.",
        "nature": "Flat countryside accessible by bike. Parks within city. Nature is gentle.",
        "safety": "Very safe with low crime. Dutch organization. Comfortable.",
        "food": "International options with design-forward restaurants. Quality dining available.",
        "community": "Design and tech community. Philips heritage. Innovation hub.",
        "english": "Excellent English proficiency. Communication is effortless.",
        "visa": "Schengen rules apply. Dutch freelance options exist. Standard access.",
        "culture": "Design capital of Netherlands. Dutch Design Week is famous. Innovation culture.",
        "cleanliness": "Very clean with Dutch standards. Well-maintained. Excellent.",
        "airquality": "Good air quality for Netherlands. Better than Randstad. Fresh."
    },
    "elnido": {
        "climate": "El Nido has a tropical climate with warm temperatures (25-32°C). Dry season November to May. Typhoon risk exists.",
        "cost": "Moderate for a tourist destination. Accommodation from $500-1000/month. Island premium.",
        "wifi": "Limited infrastructure with speeds of 5-20 Mbps. Island connectivity challenges. Developing.",
        "nightlife": "Beach bar scene. Relaxed island atmosphere. Not party-focused.",
        "nature": "Spectacular limestone cliffs and lagoons. Palawan is pristine. Nature is exceptional.",
        "safety": "Safe tourist destination. Island community is welcoming. Comfortable.",
        "food": "Filipino and international for tourists. Fresh seafood. Island dining.",
        "community": "Tourism and diving community. Backpackers and nature lovers. Transient.",
        "english": "Good as in all Philippines. Tourism industry. Easy communication.",
        "visa": "Standard Philippine visa rules. Extensions available.",
        "culture": "Island life meets eco-tourism. The natural beauty dominates. Simple lifestyle.",
        "cleanliness": "Eco-tourism focus has improved standards. Beach cleaning efforts. Variable.",
        "airquality": "Excellent air quality with sea breezes. Pristine island air."
    },
    "ericeira": {
        "climate": "Ericeira has an oceanic climate with mild temperatures (13-22°C). Atlantic breezes keep summers cool. Pleasant year-round.",
        "cost": "Moderate with surf tourism driving prices. Apartments from €700-1200/month. Rising costs.",
        "wifi": "Good Portuguese infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Surf bars and beach atmosphere. The town has character. Relaxed.",
        "nature": "World Surfing Reserve with excellent waves. Atlantic coastline. Nature is the draw.",
        "safety": "Very safe fishing village atmosphere. Low crime. Comfortable.",
        "food": "Fresh seafood and Portuguese cuisine. Fish market is excellent. Quality.",
        "community": "Strong surf and digital nomad community. The vibe attracts creatives. Active.",
        "english": "Good due to international surf community. Portuguese enriches. Easy communication.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad visas. Popular.",
        "culture": "Traditional fishing village meets surf culture. The authenticity remains. Charming.",
        "cleanliness": "Well-maintained village. Pride in appearance. Pleasant.",
        "airquality": "Excellent air quality with Atlantic breezes. Fresh coastal air."
    },
    "essaouira": {
        "climate": "Essaouira has a Mediterranean climate moderated by Atlantic winds. Temperatures of 15-25°C. Famous for constant wind. Mild year-round.",
        "cost": "Affordable with apartments from $300-600/month. Morocco is cheap. Good value.",
        "wifi": "Decent infrastructure with speeds of 15-40 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Limited but atmospheric. Medina has restaurants and music. Quiet evenings.",
        "nature": "Atlantic beaches and argan forests. Windsurfing paradise. Nature is accessible.",
        "safety": "Safe tourist destination. Moroccan hospitality. Comfortable.",
        "food": "Fresh seafood from the port. Moroccan cuisine. Simple and delicious.",
        "community": "Artists and windsurfers community. Growing digital presence. Intimate.",
        "english": "French more common than English. Tourism has some English. French helps.",
        "visa": "90 days visa-free for most nationalities. Morocco is accessible.",
        "culture": "UNESCO medina with Portuguese heritage. Artists and musicians. Bohemian atmosphere.",
        "cleanliness": "Medina is well-maintained. Tourism standards. Pleasant.",
        "airquality": "Excellent air quality with constant ocean winds. Fresh and clean."
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

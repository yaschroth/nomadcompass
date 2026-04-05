#!/usr/bin/env python3
"""Batch 9: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "davao": {
        "climate": "Davao has a tropical climate with consistent temperatures year-round (24-32°C). Unlike the rest of the Philippines, it's outside the typhoon belt. Rain is distributed evenly throughout the year.",
        "cost": "Very affordable with apartments from $200-400/month. The cost of living is lower than Manila or Cebu. Excellent value for digital nomads.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps in central areas. Fiber is expanding. Coworking spaces offer better connectivity.",
        "nightlife": "More relaxed than Manila with local bars and restaurants. The Matina Town Square area has options. The pace is slower and more community-focused.",
        "nature": "Mount Apo, the Philippines' highest peak, is nearby. The Philippine Eagle Center is unique. Beaches and islands are accessible.",
        "safety": "Considered one of the Philippines' safest cities. The local government maintains strict order. The atmosphere is relaxed and secure.",
        "food": "Mindanaoan cuisine features fresh seafood and tropical fruits. Durian is the city's symbol. Fresh produce is abundant and cheap.",
        "community": "Small but growing digital nomad community. The affordable living attracts long-term visitors. The local community is welcoming.",
        "english": "Widely spoken like the rest of the Philippines. Bisaya is the local language. Communication is easy.",
        "visa": "Same generous Philippine visa rules apply. Easy extensions available. Good option for affordable extended stays.",
        "culture": "Mindanaoan culture with Indigenous and Muslim influences. The city has a distinct identity from Manila. The pace of life is slower.",
        "cleanliness": "Known for being one of the Philippines' cleanest cities. Strict regulations on smoking and other ordinances. The city takes pride in its order.",
        "airquality": "Good air quality due to less urbanization. The surrounding nature contributes to fresh air. Better than Manila by far."
    },
    "siemreap": {
        "climate": "Siem Reap has a tropical monsoon climate with hot weather year-round (25-35°C). The wet season from May to October brings afternoon downpours. November to April is dry and slightly cooler.",
        "cost": "Very affordable with apartments from $250-500/month. Budget travel is easy here. The tourism economy creates options at all price points.",
        "wifi": "Decent infrastructure for Cambodia with speeds of 10-30 Mbps. Cafés catering to tourists have reliable wifi. Home internet has improved significantly.",
        "nightlife": "Pub Street offers backpacker energy with bars and clubs. The scene is tourist-focused but fun. More sophisticated options exist away from the main strip.",
        "nature": "Angkor temples are surrounded by jungle. The countryside offers cycling through rice paddies. Tonle Sap Lake provides water landscapes.",
        "safety": "Generally safe for tourists with petty theft the main concern. Land mines exist in remote areas - stick to paths. The tourist areas are secure.",
        "food": "Khmer cuisine features amok and lok lak. Street food is abundant and cheap. International restaurants cater to tourists.",
        "community": "Established digital nomad community attracted by low costs. Coworking spaces have emerged. The expat community is tight-knit.",
        "english": "Tourism has created good English proficiency in hospitality. Khmer is the local language. Young Cambodians often speak English well.",
        "visa": "30-day visa on arrival easily extended. E-visa available. Cambodia is accessible for extended stays.",
        "culture": "The Angkor Wat temples are a world wonder. Khmer culture survived the Khmer Rouge era. The resilience of the people is inspiring.",
        "cleanliness": "Variable with tourist areas maintained better. Development has outpaced infrastructure. The dry season brings dust.",
        "airquality": "Generally acceptable but dust can be an issue in dry season. Less industrial pollution than larger cities. The rural surroundings help air quality."
    },
    "phnompenh": {
        "climate": "Phnom Penh has a tropical monsoon climate with high temperatures year-round (25-35°C). The wet season brings heavy rains. The heat and humidity can be intense.",
        "cost": "Very affordable with apartments from $300-600/month. The cost of living is low by any standard. Western luxuries are available but pricier.",
        "wifi": "Improving rapidly with speeds of 15-50 Mbps available. The café and coworking scene has good connectivity. Fiber is expanding.",
        "nightlife": "Growing scene along the Riverside and BKK1 districts. The city has developed sophisticated options. Street-side beer gardens are local favorites.",
        "nature": "Urban environment with Mekong and Tonle Sap rivers providing waterfront. Day trips to countryside temples are possible. The city itself is flat and easily explored.",
        "safety": "Improving but petty crime exists. Bag snatching from motorbikes occurs. General awareness is needed especially at night.",
        "food": "Khmer cuisine plus French colonial influence. The food scene is increasingly sophisticated. Local markets offer authentic experiences.",
        "community": "Growing digital nomad and startup community. BKK1 district is the expat hub. Coworking spaces are well-established.",
        "english": "Better English proficiency than much of Southeast Asia. The NGO presence has increased English usage. Younger generations speak it well.",
        "visa": "30-day visa on arrival easily extended indefinitely. One of the most visa-friendly countries. Easy for long-term stays.",
        "culture": "Painful history from Khmer Rouge visible at memorials. The city is rebuilding and modernizing. French colonial architecture adds character.",
        "cleanliness": "Developing with uneven standards. Some areas are well-maintained while others struggle. Infrastructure is improving.",
        "airquality": "Can be affected by traffic and dust. Less industrial pollution than larger Asian cities. The rivers provide some ventilation."
    },
    "penang": {
        "climate": "Penang has a tropical rainforest climate with consistent heat year-round (27-33°C). Rain can occur any time with heavier downpours during monsoon. The humidity is constant.",
        "cost": "Affordable with apartments from MYR 1500-3000/month ($350-700). The street food is incredibly cheap. George Town offers good value.",
        "wifi": "Good Malaysian infrastructure with speeds of 30-80 Mbps. Cafés and coworking spaces have reliable connections. Fiber is widely available.",
        "nightlife": "More relaxed than KL with heritage bars and beach clubs. George Town has atmospheric options. The scene is sophisticated rather than wild.",
        "nature": "Penang Hill offers jungle and views. Beaches on the north coast are accessible. National parks provide nature escapes.",
        "safety": "Very safe with low crime rates. George Town is walkable and secure. The island atmosphere is relaxed.",
        "food": "One of Asia's best food cities with legendary hawker centers. Char kway teow and laksa are specialties. The UNESCO food heritage is real.",
        "community": "Growing digital nomad community attracted by food and affordability. George Town has excellent coworking options. The creative community is active.",
        "english": "Widely spoken due to British colonial history. Business and daily life function in English. Hokkien and Malay add local flavor.",
        "visa": "Generous 90-day visa-free for many nationalities. Malaysia is accessible for extended stays. The MM2H program offers residence options.",
        "culture": "UNESCO World Heritage George Town preserves Straits Chinese culture. The blend of Malay, Chinese, and Indian is unique. Street art has added modern creativity.",
        "cleanliness": "George Town is well-maintained with heritage preservation. The food culture means some market grit. Overall standards are good.",
        "airquality": "Generally good but haze season from Indonesian fires can affect air. The sea location provides breezes. Most of the year is clear."
    },
    "langkawi": {
        "climate": "Langkawi has a tropical climate with warm weather year-round (28-34°C). The monsoon brings rain from September to November. The dry season offers perfect beach weather.",
        "cost": "Moderate with apartments from MYR 1500-3000/month ($350-700). Duty-free status keeps some costs low. Resort areas are pricier.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps in developed areas. Some beach areas have connectivity challenges. Cafés in Pantai Cenang have good wifi.",
        "nightlife": "Limited beach bar scene. Pantai Cenang has the most options. The island is more about relaxation than partying.",
        "nature": "Stunning UNESCO Geopark with mangroves, beaches, and rainforest. The cable car provides spectacular views. Island hopping reveals pristine nature.",
        "safety": "Very safe with low crime. The island atmosphere is relaxed and welcoming. Tourist areas are well-maintained.",
        "food": "Malaysian cuisine with fresh seafood emphasis. Night markets offer local specialties. International options exist in tourist areas.",
        "community": "Small but growing nomad community. The island attracts those seeking beach lifestyle with affordability. Community is intimate.",
        "english": "Widely spoken in tourist industry. Malay is the local language. Communication is easy in developed areas.",
        "visa": "Same generous Malaysian visa rules. The island is popular for visa runs from Thailand. Easy access for regional travelers.",
        "culture": "Malay culture with legends of the island embedded in the landscape. The pace is slow and relaxed. Tourism hasn't erased local character entirely.",
        "cleanliness": "Tourist beaches are well-maintained. Development standards are generally good. The geopark status encourages conservation.",
        "airquality": "Excellent air quality with sea breezes. The island location ensures fresh air. Haze season can occasionally affect visibility."
    },
    "kota": {
        "climate": "Kota Kinabalu has a tropical rainforest climate with warm weather year-round (26-32°C). It lies outside the main typhoon belt. Rain can occur any time with the wettest months October to January.",
        "cost": "Affordable with apartments from MYR 1500-2800/month ($350-650). The cost of living is reasonable. Fresh seafood is excellent value.",
        "wifi": "Good infrastructure with speeds of 20-60 Mbps. The city center has reliable connectivity. Fiber networks are expanding.",
        "nightlife": "Waterfront area has bars and restaurants. The scene is relaxed and not party-focused. Sunset drinks are the main attraction.",
        "nature": "Gateway to Mount Kinabalu and world-class diving. The islands offshore are stunning. Borneo's wildlife is accessible.",
        "safety": "Very safe with low crime. The East Malaysian culture is welcoming. The laid-back atmosphere adds to security.",
        "food": "Fresh seafood is the highlight. Sabahan and Chinese cuisines dominate. The night markets are excellent.",
        "community": "Small but growing expat community. Attracts nature lovers and divers. The nomad scene is developing.",
        "english": "Widely spoken with Malaysian proficiency levels. Kadazan-Dusun and Malay are local languages. Tourism industry uses English.",
        "visa": "Standard Malaysian visa rules apply. The destination is popular with regional travelers. Easy access for extended stays.",
        "culture": "Indigenous Kadazan-Dusun culture adds unique character. The Sabahan identity is distinct from Peninsular Malaysia. Nature and culture blend beautifully.",
        "cleanliness": "Generally clean with tourism infrastructure. Development is managed reasonably. The natural areas are well-preserved.",
        "airquality": "Excellent air quality with minimal industrial pollution. The rainforest surroundings contribute to clean air. One of Malaysia's best air quality regions."
    },
    "malaga": {
        "climate": "Malaga has a Mediterranean climate with hot summers (28-35°C) and mild winters (12-18°C). Over 300 sunny days per year. The sea moderates temperatures.",
        "cost": "Moderate with apartments from €600-1100/month. Cheaper than Barcelona or Madrid. The Costa del Sol has options at all price points.",
        "wifi": "Good Spanish infrastructure with speeds of 30-80 Mbps. Cafés and coworking spaces have reliable connections. The tech scene is developing.",
        "nightlife": "Vibrant scene with tapas bars, flamenco, and beach clubs. The old town comes alive at night. Marbella nearby offers upscale options.",
        "nature": "Beautiful Mediterranean beaches and nearby mountains. The Costa del Sol is a short drive. Day trips to Granada and Seville are easy.",
        "safety": "Very safe with low crime. The tourist infrastructure is well-established. Beach and city areas are secure.",
        "food": "Andalusian cuisine with excellent seafood espetos (grilled sardines). Tapas culture is embedded in daily life. The food scene is increasingly sophisticated.",
        "community": "Growing digital nomad community attracted by weather and affordability. Coworking spaces are multiplying. The expat community is established.",
        "english": "Tourism has improved English levels. Spanish greatly enhances the experience. Many expats create English-speaking pockets.",
        "visa": "Schengen rules apply with Spanish digital nomad visa available. Spain has become nomad-friendly. The process is straightforward.",
        "culture": "Birthplace of Picasso with excellent museums. Andalusian culture with flamenco and feria traditions. The Mediterranean lifestyle is relaxed.",
        "cleanliness": "Well-maintained tourist areas and beaches. The city takes pride in its appearance. Spanish infrastructure is reliable.",
        "airquality": "Excellent air quality with Mediterranean breezes. The coastal location ensures fresh air. One of Spain's best air quality cities."
    },
    "valencia": {
        "climate": "Valencia has a Mediterranean climate with hot summers (30-35°C) and mild winters (10-17°C). Abundant sunshine year-round. The sea moderates temperature extremes.",
        "cost": "More affordable than Barcelona or Madrid with apartments from €700-1200/month. The food is excellent value. Quality of life per cost is high.",
        "wifi": "Good infrastructure with speeds of 40-100 Mbps. The tech scene ensures good connectivity. Coworking spaces are well-equipped.",
        "nightlife": "Vibrant scene from the old town to the beach. El Carmen district has atmospheric bars. The beach area has summer club scene.",
        "nature": "City beaches are accessible and maintained. The Turia gardens converted from riverbed provide green corridor. Day trips to nature are easy.",
        "safety": "Very safe with low crime rates. The city is walkable and welcoming. Tourist areas and beaches are well-patrolled.",
        "food": "Birthplace of paella with outstanding Mediterranean cuisine. The Central Market is spectacular. The food scene is increasingly innovative.",
        "community": "Strong and growing digital nomad community. The city actively courts remote workers. Coworking spaces host vibrant communities.",
        "english": "Tourism and nomad influx has improved English. Spanish enriches daily life. Many residents speak some English.",
        "visa": "Schengen rules apply with Spanish digital nomad visa available. Valencia is popular with nomad visa applicants. The process is becoming smoother.",
        "culture": "The futuristic City of Arts and Sciences contrasts with medieval old town. Fallas festival is explosive. The culture blends traditional and modern.",
        "cleanliness": "Very clean with well-maintained public spaces. The beaches are kept pristine. The city takes pride in its appearance.",
        "airquality": "Excellent air quality with sea breezes. The Mediterranean location ensures fresh air. One of Spain's most livable cities."
    },
    "sevilla": {
        "climate": "Seville has a Mediterranean climate with extremely hot summers (35-45°C) and mild winters (10-18°C). The summer heat is intense. Spring and autumn are ideal.",
        "cost": "Affordable by Spanish standards with apartments from €600-1000/month. Tapas and drinks are cheap. The cost of living is reasonable.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. The old town can have connectivity challenges in historic buildings. Coworking spaces have reliable connections.",
        "nightlife": "Legendary flamenco and tapas scene. The nightlife starts late and runs until dawn. Every neighborhood has its bars and atmosphere.",
        "nature": "Urban environment with parks and the Guadalquivir River. Day trips to Sierra Nevada and beaches are possible. The city itself is dense but walkable.",
        "safety": "Safe with some petty theft in tourist areas. The old town is generally secure. Standard awareness is sufficient.",
        "food": "Andalusian cuisine at its finest with tapas culture embedded in daily life. The tradition of free tapas with drinks persists. The food is excellent and affordable.",
        "community": "Growing nomad community attracted by culture and affordability. Coworking spaces are developing. The Spanish lifestyle attracts many.",
        "english": "Spanish is dominant with some English in tourism. Learning Spanish is highly rewarding. The local culture requires Spanish for deep connection.",
        "visa": "Schengen rules apply with Spanish digital nomad visa an option. Seville is a popular choice for extended stays. The bureaucracy requires patience.",
        "culture": "Heart of Andalusian culture with flamenco, bullfighting heritage, and Semana Santa. The passion for life is infectious. Every corner has history.",
        "cleanliness": "The old town is well-maintained with narrow streets regularly cleaned. Summer heat can intensify street odors. Overall standards are good.",
        "airquality": "Generally good though summer heat can affect air quality. The river provides some ventilation. Air quality varies with weather patterns."
    },
    "granada": {
        "climate": "Granada has a Mediterranean climate with continental influences. Summers are hot (30-35°C) and winters cold (2-10°C). The Sierra Nevada proximity creates microclimates.",
        "cost": "One of Spain's most affordable cities with apartments from €400-800/month. Student city keeps prices low. Excellent value for quality of life.",
        "wifi": "Good infrastructure with speeds of 30-60 Mbps. The student population ensures good connectivity. Historic buildings may have limitations.",
        "nightlife": "Famous for free tapas with drinks - buy a beer, get a plate. The student scene creates vibrant nightlife. Albaicín has atmospheric bars.",
        "nature": "Sierra Nevada ski resort is 30 minutes away. The Alhambra palace gardens are stunning. Mountains and Mediterranean are both accessible.",
        "safety": "Very safe with low crime rates. The compact old town is easy to navigate. Student atmosphere keeps streets active.",
        "food": "The free tapas tradition is legendary. Andalusian cuisine meets mountain influences. The value is unbeatable.",
        "community": "Large student community plus growing nomad presence. The affordability attracts long-term visitors. Language schools bring international crowds.",
        "english": "Limited English with Spanish dominant. The student population has some English. Learning Spanish significantly enhances the experience.",
        "visa": "Schengen rules apply. Popular with Spanish language students. The nomad visa makes longer stays possible.",
        "culture": "The Alhambra is a world wonder representing Moorish heritage. The city blends Arab, Jewish, and Christian history. Flamenco in the caves of Sacromonte is unforgettable.",
        "cleanliness": "The Albaicín can be rough around edges but atmospheric. Tourist areas are maintained. The medieval character includes some grit.",
        "airquality": "Good air quality with mountain breezes. The elevation and surroundings contribute to fresh air. One of Spain's cleaner cities."
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

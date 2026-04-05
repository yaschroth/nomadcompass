#!/usr/bin/env python3
"""Batch 17: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "bath": {
        "climate": "Bath has a temperate oceanic climate with mild temperatures year-round (5-21°C). Rain is common. The Georgian architecture looks beautiful in any weather.",
        "cost": "Expensive due to tourist popularity. Apartments from £1200-1800/month. High demand drives prices.",
        "wifi": "Good UK infrastructure with speeds of 40-80 Mbps. Reliable connections throughout. Standard British service.",
        "nightlife": "Sophisticated scene with historic pubs and wine bars. Student population adds energy. More refined than rowdy.",
        "nature": "Beautiful surrounding countryside. The Cotswolds are accessible. Parks within the city provide green space.",
        "safety": "Very safe historic town. Low crime rates. Comfortable atmosphere throughout.",
        "food": "Excellent food scene with farm-to-table focus. The Bath Bun and cream teas are tradition. Quality dining available.",
        "community": "Student and tourist community. Historic interest draws visitors. Established expat presence.",
        "english": "Native English with RP influences. No barriers. The communication is straightforward.",
        "visa": "UK visa rules apply. Post-Brexit requirements for non-British. Various visa categories available.",
        "culture": "UNESCO World Heritage with Roman and Georgian heritage. Jane Austen connections. The architecture is spectacular.",
        "cleanliness": "Beautifully maintained historic town. High standards throughout. Pride in preservation shows.",
        "airquality": "Good air quality for UK. The valley location is pleasant. Fresh west country air."
    },
    "battambang": {
        "climate": "Battambang has a tropical monsoon climate with hot weather year-round (25-35°C). The wet season brings heavy rain. Drier than coastal Cambodia.",
        "cost": "Extremely affordable with apartments from $150-300/month. One of Cambodia's cheapest cities. Excellent value.",
        "wifi": "Basic infrastructure with speeds of 10-25 Mbps. Improving. Some reliability challenges.",
        "nightlife": "Limited but authentic scene. Local bars and cafes. More cultural than party focused.",
        "nature": "Countryside with temples and bamboo train. The Sangker River provides scenery. Nature is accessible.",
        "safety": "Safe and welcoming. Land mine risk exists in remote areas - stay on paths. The town is secure.",
        "food": "Khmer cuisine with French influences. Fresh and affordable. The food is authentic.",
        "community": "Small but growing expat community. Artists and cultural travelers. Authentic experience.",
        "english": "Growing with tourism. Khmer is local language. Younger generation speaks some English.",
        "visa": "30-day visa on arrival easily extended. Cambodia is accessible. Easy long-term stays.",
        "culture": "Colonial architecture and temple ruins. The arts scene is developing. Authentic Cambodian culture.",
        "cleanliness": "Developing town standards. Some infrastructure challenges. Charming despite limitations.",
        "airquality": "Generally good with countryside surroundings. Less traffic than larger cities. Fresh rural air."
    },
    "bergen": {
        "climate": "Bergen is one of Europe's rainiest cities with temperatures of 2-18°C. The weather is changeable. Summer offers long days.",
        "cost": "Very expensive as Norway. Apartments from NOK 12000-18000/month ($1200-1800). High but high quality.",
        "wifi": "Excellent Norwegian infrastructure with speeds of 50-150+ Mbps. Reliable and fast. First-class connectivity.",
        "nightlife": "Cozy scene with bars in wooden buildings. The student population adds energy. Hygge atmosphere.",
        "nature": "Stunning fjords and mountains surrounding the city. Seven hills to explore. Nature is the highlight.",
        "safety": "Extremely safe with virtually no crime. Norwegian society is trusting. Very comfortable.",
        "food": "Fresh seafood is exceptional. The fish market is famous. Norwegian cuisine with quality focus.",
        "community": "Student and outdoor community. Growing international presence. The compact city builds connections.",
        "english": "Excellent English proficiency. Norwegians speak English fluently. No barriers.",
        "visa": "Schengen rules apply. Norway has specific requirements. Digital nomad options limited.",
        "culture": "UNESCO World Heritage Bryggen waterfront. The gateway to the fjords. Maritime heritage is rich.",
        "cleanliness": "Immaculately clean with Nordic standards. Public spaces are pristine. Exceptional maintenance.",
        "airquality": "Excellent air quality with fjord breezes. The rain cleanses the air. Fresh and clean."
    },
    "bilbao": {
        "climate": "Bilbao has an oceanic climate with mild temperatures year-round (8-25°C). Rain is common especially in winter. The Basque green shows in the weather.",
        "cost": "Moderate for Spain. Apartments from €600-1000/month. Good value for quality of life.",
        "wifi": "Good Spanish infrastructure with speeds of 40-100 Mbps. Reliable connections. Fiber available.",
        "nightlife": "Vibrant pintxos bar scene. The old town comes alive. Basque culture of socializing.",
        "nature": "Green hills surround the city. The coast is accessible. The natural setting is beautiful.",
        "safety": "Very safe with low crime. The Basque region is orderly. Comfortable atmosphere.",
        "food": "World-class pintxos and Basque cuisine. The food scene rivals Barcelona. Exceptional quality.",
        "community": "Growing international community. The Guggenheim brought visitors. Cultural exchange.",
        "english": "Moderate proficiency. Spanish and Basque are local. Tourism has built English skills.",
        "visa": "Schengen rules apply. Spanish digital nomad visa available. Good for extended stays.",
        "culture": "Guggenheim transformed the city. Basque identity is strong and unique. Contemporary and traditional blend.",
        "cleanliness": "Very clean and well-maintained. The transformation is complete. High standards.",
        "airquality": "Good air quality with Atlantic breezes. Industrial past is cleaned up. Fresh northern air."
    },
    "bled": {
        "climate": "Bled has an alpine climate with warm summers (18-26°C) and cold winters (-3 to 5°C). The lake moderates temperatures. Snow in winter.",
        "cost": "Moderate for Slovenia. Apartments from €500-900/month. Good value for Alpine beauty.",
        "wifi": "Good Slovenian infrastructure with speeds of 40-80 Mbps. Reliable. The country is well-connected.",
        "nightlife": "Limited but charming lakeside bars. The atmosphere is romantic rather than party. Quiet evenings.",
        "nature": "Lake Bled is one of Europe's most beautiful. Mountains and gorges nearby. Nature is the attraction.",
        "safety": "Extremely safe with virtually no crime. Slovenia is orderly. Very comfortable.",
        "food": "Slovenian cuisine with cream cake (kremna rezina) famous. Fresh mountain food. Quality local produce.",
        "community": "Small tourist community. Summer visitors dominate. Year-round expats are few.",
        "english": "Good English proficiency. Slovene is local. Tourism industry uses English.",
        "visa": "Schengen rules apply. Slovenia is accessible. Standard European access.",
        "culture": "Medieval castle on the lake with island church. The romantic setting is famous. Fairytale atmosphere.",
        "cleanliness": "Immaculately clean with pride in tourism. The lake is pristine. High standards.",
        "airquality": "Excellent air quality with Alpine freshness. The mountain setting ensures clean air. Pristine."
    },
    "bodrum": {
        "climate": "Bodrum has a Mediterranean climate with hot summers (28-35°C) and mild winters (12-18°C). Dry summer heat. The sea moderates temperatures.",
        "cost": "Moderate and seasonal. Apartments from $400-800/month off-season. Summer prices spike.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Tourist areas have coverage. Reliable in developed areas.",
        "nightlife": "Famous party scene especially in summer. Beach clubs and bars. The Turkish Riviera reputation.",
        "nature": "Beautiful Aegean coastline with beaches. Sailing is popular. The turquoise coast is stunning.",
        "safety": "Safe tourist destination. Standard beach town awareness. The community is welcoming.",
        "food": "Turkish cuisine with excellent mezes and seafood. Fresh and flavorful. The food is outstanding.",
        "community": "Summer crowd of tourists and expats. Year-round community is smaller. Seasonal dynamics.",
        "english": "Good in tourism areas. Turkish is local. Resort infrastructure supports English.",
        "visa": "Turkish e-visa rules apply. Up to 90 days. Easy access.",
        "culture": "Ancient Halicarnassus with castle and amphitheater. Turkish beach culture. History meets leisure.",
        "cleanliness": "Tourist beaches are maintained. Standards vary by area. Resort areas are clean.",
        "airquality": "Excellent air quality with Aegean breezes. The coastal location ensures freshness. Clean sea air."
    },
    "bologna": {
        "climate": "Bologna has a humid subtropical climate with hot summers (28-35°C) and cold winters (0-8°C). The Po Valley can trap heat and fog.",
        "cost": "Moderate for Italy. Apartments from €600-1000/month. Student city keeps some costs down.",
        "wifi": "Good Italian infrastructure with speeds of 30-70 Mbps. Improving with fiber. Reliable.",
        "nightlife": "Vibrant university scene with bars under the porticos. The aperitivo culture is strong. Social and lively.",
        "nature": "The Apennine hills are accessible. Parks provide urban green space. Nature is nearby.",
        "safety": "Safe with standard urban awareness. The student atmosphere is friendly. Comfortable.",
        "food": "Italy's food capital with tortellini, mortadella, and ragù. The food scene is legendary. Exceptional quality.",
        "community": "Large student community with international exchange. Growing digital presence. Community is active.",
        "english": "Moderate proficiency. Italian is essential for deeper connection. University areas have more English.",
        "visa": "Schengen rules apply. Italy's digital nomad visa is an option. Standard European access.",
        "culture": "Oldest university in the world. The porticos are UNESCO-listed. Progressive and intellectual.",
        "cleanliness": "Well-maintained historic center. Italian standards apply. The porticos are kept clean.",
        "airquality": "Can be poor in winter due to Po Valley basin. Summer is better. Variable quality."
    },
    "boquete": {
        "climate": "Boquete has a spring-like highland climate at 1,200m with temperatures of 15-25°C. Cooler than lowland Panama. Mist and rain are common.",
        "cost": "Moderate with apartments from $500-900/month. Popular with retirees affecting prices. Good value for climate.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. Mountain areas can be challenging.",
        "nightlife": "Limited with restaurants and bars. The atmosphere is relaxed. More about nature than nightlife.",
        "nature": "Coffee plantations and cloud forests. The Volcán Barú is nearby. Nature is the draw.",
        "safety": "Very safe with established expat community. The town is welcoming. Comfortable.",
        "food": "International options due to expat population. Local Panamanian available. Fresh local produce.",
        "community": "Large retirement community. Growing digital presence. Community is established and welcoming.",
        "english": "Widely spoken due to American expat population. Spanish helps but not essential. Communication easy.",
        "visa": "Generous Panamanian visa rules. Various residence options. Easy extended stays.",
        "culture": "Highland culture meets international retirees. The blend is unique. Coffee culture dominates.",
        "cleanliness": "Well-maintained by expat standards. The town takes pride in appearance. Good conditions.",
        "airquality": "Excellent air quality with highland freshness. The cloud forest cleans the air. Pristine mountain air."
    },
    "boracay": {
        "climate": "Boracay has a tropical climate with warm weather year-round (26-32°C). Dry season November to May is ideal. Typhoons can affect the region.",
        "cost": "Moderate to expensive for Philippines. Apartments from $500-1000/month. Island prices apply.",
        "wifi": "Improved after rehabilitation with speeds of 20-50 Mbps. Better than before. Resort areas have good coverage.",
        "nightlife": "Famous party scene though more regulated now. Beach parties and clubs. Still vibrant but controlled.",
        "nature": "World-famous white beach. Water sports and island hopping. The natural beauty rehabilitated.",
        "safety": "Safe tourist destination. Standard beach precautions. The island is well-policed.",
        "food": "International options for tourists. Filipino seafood available. Resort dining is good.",
        "community": "Tourist and service industry community. Expats in hospitality. Transient atmosphere.",
        "english": "Excellent as in all Philippines. Tourism ensures communication. No barriers.",
        "visa": "Standard Philippine visa rules. Easy extensions. Good for long stays.",
        "culture": "Beach resort culture has been rehabilitated. More sustainable focus now. Island hospitality.",
        "cleanliness": "Dramatically improved after 2018 closure. Strict regulations now. Much cleaner than before.",
        "airquality": "Excellent air quality with sea breezes. The island location ensures freshness. Clean tropical air."
    },
    "bordeaux": {
        "climate": "Bordeaux has an oceanic climate with mild temperatures year-round (6-26°C). Rain is common. The Atlantic influence moderates extremes.",
        "cost": "Moderate to expensive for France. Apartments from €800-1400/month. Wine tourism affects prices.",
        "wifi": "Good French infrastructure with speeds of 30-80 Mbps. Reliable connections. Standard French service.",
        "nightlife": "Sophisticated wine bar scene. The old town has atmosphere. French socializing culture.",
        "nature": "Wine country surrounds the city. Atlantic beaches accessible. The Garonne River adds character.",
        "safety": "Safe with standard urban awareness. The city is orderly. Comfortable.",
        "food": "World-class wine and cuisine. Canelés are famous. The food scene matches the wine.",
        "community": "Wine industry and international visitors. Growing expat presence. Cultural exchange.",
        "english": "Moderate proficiency. French is essential for deeper connection. Tourism builds English.",
        "visa": "Schengen rules apply. France offers various options. Standard European access.",
        "culture": "UNESCO World Heritage city center. Wine culture defines identity. Elegant and refined.",
        "cleanliness": "Very clean after major renovation. The city has been transformed. High standards.",
        "airquality": "Good air quality with Atlantic breezes. The river valley is pleasant. Fresh western air."
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

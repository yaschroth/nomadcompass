#!/usr/bin/env python3
"""Batch 41: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "trieste": {
        "climate": "Trieste has a humid subtropical climate with warm summers (24-28°C) and mild winters (4-10°C). Bora wind is famous. Adriatic weather.",
        "cost": "Moderate for Italy. Apartments from €450-800/month. Northeast Italy value.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Italian standards. Reliable.",
        "nightlife": "Charming café scene. Literary heritage. More atmospheric than party.",
        "nature": "Adriatic coast and Karst plateau. Slovenia border nearby. Nature accessible.",
        "safety": "Very safe with low crime. Italian-Austrian blend. Comfortable.",
        "food": "Mix of Italian, Austrian, and Slovenian. Coffee culture is famous. Distinctive.",
        "community": "Literary and intellectual community. Border city diversity. Intimate.",
        "english": "Good with multiple language influences. Communication possible.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Habsburg heritage meets Italian coast. James Joyce lived here. Melancholy elegance.",
        "cleanliness": "Well-maintained historic center. Italian standards. Good.",
        "airquality": "Good with Bora wind clearing air. Adriatic breezes. Fresh."
    },
    "tripoli": {
        "climate": "Tripoli (Lebanon) has a Mediterranean climate with hot summers (28-33°C) and mild winters (10-18°C). Lebanese coast.",
        "cost": "Variable with economic situation. Apartments from $300-600/month when stable. Check current conditions.",
        "wifi": "Variable infrastructure. Check current situation. Lebanese network.",
        "nightlife": "Historic souks and local scene. More conservative than Beirut.",
        "nature": "Coastal and mountain access. Cedars day trips possible.",
        "safety": "Research current situation carefully. Lebanon is complex. Local guidance important.",
        "food": "Lebanese cuisine excellence. Foul and sweets famous. Outstanding.",
        "community": "Local and some international. Situation dependent.",
        "english": "Good alongside Arabic and French.",
        "visa": "Lebanese visa rules. Check current situation.",
        "culture": "Mamluk heritage and souks. Different character from Beirut. Historic depth.",
        "cleanliness": "Variable with situation. Historic areas maintained.",
        "airquality": "Can be affected by generators and situation. Variable."
    },
    "tromso": {
        "climate": "Tromsø has a subarctic climate with cool summers (10-16°C) and cold winters (-6 to -2°C). Arctic Norway. Polar night and midnight sun.",
        "cost": "Expensive as Norwegian Arctic. Apartments from NOK 10000-16000/month ($930-1500).",
        "wifi": "Excellent Norwegian infrastructure with speeds of 100+ Mbps. Impeccable.",
        "nightlife": "Active for Arctic city. Bars and culture. Northern Lights watching.",
        "nature": "Arctic nature and Northern Lights. Fjords and mountains. Nature spectacular.",
        "safety": "Extremely safe. Norwegian standards. Very comfortable.",
        "food": "Arctic cuisine with reindeer and seafood. Quality restaurants. Unique.",
        "community": "University and research community. Arctic hub. Intimate.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Norway accessible. Standard access.",
        "culture": "Gateway to Arctic. Northern Lights capital. Indigenous Sámi heritage. Arctic identity.",
        "cleanliness": "Very clean with Norwegian standards. Pristine.",
        "airquality": "Excellent Arctic air quality. Pristine."
    },
    "tucson": {
        "climate": "Tucson has a hot semi-arid climate with scorching summers (38-42°C) and mild winters (12-20°C). Arizona desert. Dry heat.",
        "cost": "Affordable for US. Apartments from $1000-1600/month. Desert living value.",
        "wifi": "Good US infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "University scene with bars and live music. Fourth Avenue. Active.",
        "nature": "Sonoran Desert and saguaro cacti. Mountains surrounding. Nature spectacular.",
        "safety": "Generally safe with standard awareness. University areas comfortable.",
        "food": "Mexican and Southwestern cuisine. Sonoran hot dogs. Excellent.",
        "community": "University and arts community. Growing tech presence. Welcoming.",
        "english": "Native American English. Spanish also common.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "Old West meets university town. Desert architecture. Southwestern character.",
        "cleanliness": "Generally clean. Desert environment. Good.",
        "airquality": "Can be affected by dust. Generally clear and dry. Desert freshness."
    },
    "tunis": {
        "climate": "Tunis has a Mediterranean climate with hot summers (30-35°C) and mild winters (10-16°C). North African coast. Pleasant spring and fall.",
        "cost": "Affordable with apartments from $300-600/month. Tunisia offers value.",
        "wifi": "Improving infrastructure with speeds of 15-50 Mbps. Developing.",
        "nightlife": "Growing scene in La Marsa and city center. North African nightlife.",
        "nature": "Mediterranean coast and Sahara accessible. Carthage ruins nearby.",
        "safety": "Generally safe with awareness. Research current situation. Tourist areas comfortable.",
        "food": "Tunisian cuisine with brik and couscous. Mediterranean and Arab. Excellent.",
        "community": "Growing international interest. French connection. Developing.",
        "english": "French more useful. Arabic local. Some English in tourism.",
        "visa": "90 days visa-free for most. Tunisia accessible.",
        "culture": "Carthage heritage and medina. Arab Spring birthplace. Historic weight.",
        "cleanliness": "Variable with development. Tourist areas maintained.",
        "airquality": "Good with Mediterranean breezes. Fresh coastal air."
    },
    "turin": {
        "climate": "Turin has a humid subtropical climate with hot summers (26-32°C) and cold winters (0-6°C). Po Valley. Mountains visible.",
        "cost": "Moderate for Italy. Apartments from €500-900/month. Less than Milan.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Growing scene in San Salvario. Aperitivo culture. Developing.",
        "nature": "Alps visible and accessible. Po River runs through. Mountains close.",
        "safety": "Safe with standard awareness. Italian hospitality. Comfortable.",
        "food": "Piedmontese cuisine with slow food movement. Chocolate and wine. Outstanding.",
        "community": "Industrial turning creative. Growing international interest. Developing.",
        "english": "Good in business. Italian helps. Communication possible.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "First capital of Italy. Fiat heritage and elegance. Underrated city.",
        "cleanliness": "Well-maintained with Italian standards. Good.",
        "airquality": "Can be affected by Po Valley pollution. Winter worse. Variable."
    },
    "udaipur": {
        "climate": "Udaipur has a semi-arid climate with hot summers (30-42°C) and mild winters (12-28°C). Best October to March. Lake city moderates.",
        "cost": "Very affordable with apartments from $200-450/month. India offers value.",
        "wifi": "Improving infrastructure with speeds of 10-40 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Limited but atmospheric. Lake palace views and rooftop restaurants. Romantic.",
        "nature": "Lakes and Aravalli hills. Monsoon palace views. Nature beautiful.",
        "safety": "Safe tourist destination. Rajasthani hospitality. Comfortable.",
        "food": "Rajasthani cuisine and Indian options. Fresh and affordable.",
        "community": "Growing tourist community. Photographers and artists. International.",
        "english": "Good in tourism. Hindi helps locally.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "City of Lakes with palace heritage. White City of India. Romantic atmosphere.",
        "cleanliness": "Lake areas maintained for tourism. Variable elsewhere. Tourist standards.",
        "airquality": "Generally good near lakes. Better than plains. Fresh."
    },
    "uluwatu": {
        "climate": "Uluwatu has a tropical climate with warm temperatures year-round (26-32°C). Dry season April to October. Beach weather.",
        "cost": "Moderate for Bali. Villas from $400-900/month. Surf and cliff premium.",
        "wifi": "Good infrastructure with speeds of 20-60 Mbps. Bali has invested. Reliable.",
        "nightlife": "Beach clubs on cliffs. Single Fin is famous. Sunset focused.",
        "nature": "Stunning cliffs and surf breaks. Temple on cliff. Nature dramatic.",
        "safety": "Safe with standard Bali awareness. Tourist area. Comfortable.",
        "food": "International and Indonesian options. Beach club dining. Quality available.",
        "community": "Surf and digital nomad community. Less crowded than north. Established.",
        "english": "Good in tourism. Indonesian helps.",
        "visa": "Indonesian visa rules. Visa on arrival or e-visa.",
        "culture": "Hindu temple and surf culture. Kecak dance at sunset. Balinese spirituality meets surf.",
        "cleanliness": "Tourist areas maintained. Beach cleaning. Good.",
        "airquality": "Excellent with ocean breezes. Clean coastal air."
    },
    "uppsala": {
        "climate": "Uppsala has a humid continental climate with warm summers (18-23°C) and cold winters (-5 to 0°C). Central Sweden. Four seasons.",
        "cost": "Expensive as Swedish university town. Apartments from SEK 9000-14000/month ($840-1300).",
        "wifi": "Excellent Swedish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Student scene with bars and clubs. Active during term. University energy.",
        "nature": "Surrounding forests and countryside. Nature accessible.",
        "safety": "Very safe with Scandinavian standards. Comfortable.",
        "food": "Swedish cuisine with student options. Quality available.",
        "community": "Large university community. International students. Academic.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Swedish requirements. Standard access.",
        "culture": "Sweden's oldest university. Viking heritage. Academic tradition.",
        "cleanliness": "Very clean with Swedish standards. Excellent.",
        "airquality": "Excellent air quality. Scandinavian freshness. Clean."
    },
    "urbino": {
        "climate": "Urbino has a humid subtropical climate with warm summers (26-32°C) and cool winters (2-10°C). Marche hills. Four seasons.",
        "cost": "Affordable for Italy. Apartments from €350-600/month. Off-beaten-path value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. University ensures connectivity.",
        "nightlife": "Small university town scene. Piazzas and bars. Intimate.",
        "nature": "Rolling hills and surrounding countryside. Nature beautiful.",
        "safety": "Very safe with low crime. Italian hospitality. Comfortable.",
        "food": "Marche cuisine with truffles and wild boar. Excellent local food.",
        "community": "University and art restoration community. International students. Academic.",
        "english": "Limited with Italian essential. University helps.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Renaissance palace and UNESCO center. Birthplace of Raphael. Artistic heritage.",
        "cleanliness": "Historic center well-maintained. Italian standards. Beautiful.",
        "airquality": "Excellent hilltop air quality. Fresh Marche air. Clean."
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

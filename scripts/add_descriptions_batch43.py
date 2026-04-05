#!/usr/bin/env python3
"""Batch 43 (Final): Add comprehensive category descriptions for remaining cities."""

import json
import os

BATCH_CITIES = {
    "yogyakarta": {
        "climate": "Yogyakarta has a tropical monsoon climate with warm temperatures year-round (24-33°C). Dry season April to October. Java weather.",
        "cost": "Very affordable with apartments from $200-400/month. Indonesia offers excellent value. Cultural capital pricing.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Indonesia invested. Reliable.",
        "nightlife": "Growing scene in Prawirotaman. Bars and live music. Active for Java.",
        "nature": "Volcanic landscape with Merapi and Borobudur. Beaches south. Nature dramatic.",
        "safety": "Very safe with Javanese hospitality. Cultural town atmosphere. Comfortable.",
        "food": "Javanese cuisine with gudeg and bakpia. Street food excellence. Outstanding value.",
        "community": "Artist and creative community. University presence. Welcoming.",
        "english": "Improving with tourism. Indonesian helps. Communication possible.",
        "visa": "Indonesian visa rules. Visa on arrival or e-visa. 30-60 days.",
        "culture": "Cultural capital of Java. Batik and gamelan. Kraton sultanate. Deep heritage.",
        "cleanliness": "Central areas maintained. Development varies. Good.",
        "airquality": "Generally good. Volcanic ash occasionally affects. Usually fresh."
    },
    "zanzibar": {
        "climate": "Zanzibar has a tropical climate with warm temperatures year-round (25-32°C). Two rainy seasons. Indian Ocean weather.",
        "cost": "Moderate for East Africa. Apartments from $400-800/month. Island premium. Tourism pricing.",
        "wifi": "Improving infrastructure with speeds of 10-40 Mbps. Island developing. Variable.",
        "nightlife": "Stone Town has bars and restaurants. Beach areas relaxed. Island atmosphere.",
        "nature": "Beautiful beaches and spice plantations. Marine park snorkeling. Nature stunning.",
        "safety": "Safe tourist destination. Zanzibar hospitality. Comfortable.",
        "food": "Swahili cuisine with Indian and Arab influences. Fresh seafood. Flavorful.",
        "community": "Growing digital and tourism community. International visitors. Developing.",
        "english": "Good alongside Swahili. Tourism ensures communication.",
        "visa": "Visa on arrival for most. Tanzania accessible.",
        "culture": "Stone Town is UNESCO listed. Slave trade history. Swahili heritage. Spice island identity.",
        "cleanliness": "Stone Town maintained. Beach areas vary. Tourism helps standards.",
        "airquality": "Excellent with Indian Ocean breezes. Island freshness. Clean."
    },
    "zurich": {
        "climate": "Zurich has a humid continental climate with warm summers (18-25°C) and cold winters (-2 to 4°C). Lake and Alps affect weather.",
        "cost": "Very expensive. Apartments from CHF 2200-4000/month ($2400-4400). Among world's costliest.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Impeccable.",
        "nightlife": "Sophisticated scene in Langstrasse and old town. Quality over quantity. Active.",
        "nature": "Lake Zurich and Alps visible. Mountains accessible. Nature spectacular.",
        "safety": "Extremely safe with virtually no crime. Swiss organization. Very comfortable.",
        "food": "International and Swiss cuisine. Quality is assured. Expensive but excellent.",
        "community": "International finance and tech community. Highly diverse. Established.",
        "english": "Good alongside German. Business uses English. Communication possible.",
        "visa": "Swiss rules apply. Various permit categories. Complex but accessible.",
        "culture": "Financial capital with Dadaism birthplace. Swiss precision meets creativity.",
        "cleanliness": "Immaculately clean with Swiss standards. Pristine.",
        "airquality": "Excellent with lake and mountain air. Fresh Alpine breezes. Pristine."
    },
    "zakopane": {
        "climate": "Zakopane has a mountain climate with cool summers (15-20°C) and cold winters (-8 to 0°C). Tatra Mountains. Ski resort.",
        "cost": "Affordable for Europe. Apartments from €300-600/month. Polish mountain value.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Tourist area covered. Reliable.",
        "nightlife": "Après-ski scene and Krupówki street. Bars and restaurants. Seasonal activity.",
        "nature": "Tatra Mountains National Park. Hiking and skiing. Nature spectacular.",
        "safety": "Very safe with Polish hospitality. Mountain town character. Comfortable.",
        "food": "Highlander cuisine with oscypek cheese. Hearty mountain food. Excellent.",
        "community": "Outdoor sports and tourism community. Seasonal workers. Active.",
        "english": "Good in tourism. Polish helps locally.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "Górale highland culture. Unique wooden architecture. Mountain identity.",
        "cleanliness": "Tourist areas maintained. Mountain town standards. Good.",
        "airquality": "Excellent mountain air quality. Tatra freshness. Pristine."
    },
    "zermatt": {
        "climate": "Zermatt has an Alpine climate with cool summers (12-20°C) and cold winters (-10 to -2°C). High altitude. Car-free resort.",
        "cost": "Very expensive as Swiss ski resort. Apartments from CHF 2500-5000/month ($2700-5500). Premium alpine.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Resort connectivity. Impeccable.",
        "nightlife": "Après-ski scene with bars and clubs. Seasonal activity. Sophisticated.",
        "nature": "Matterhorn views and glacier access. World-class skiing. Nature spectacular.",
        "safety": "Extremely safe with Swiss standards. Very comfortable.",
        "food": "Swiss Alpine cuisine with fondue and raclette. Quality assured.",
        "community": "Seasonal tourism and outdoor sports. International visitors. Resort character.",
        "english": "Good in tourism. German helps locally.",
        "visa": "Swiss rules apply. Accessible.",
        "culture": "Matterhorn defines identity. Car-free village. Alpine excellence.",
        "cleanliness": "Immaculately clean. Swiss mountain standards. Pristine.",
        "airquality": "Excellent high-altitude Alpine air. Among cleanest. Pristine."
    },
    "zagreb": {
        "climate": "Zagreb has a humid continental climate with warm summers (20-27°C) and cold winters (-2 to 4°C). Croatian capital. Four seasons.",
        "cost": "Moderate for Europe. Apartments from €500-900/month. Croatia growing but value remains.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Croatia investing. Reliable.",
        "nightlife": "Vibrant scene in Tkalčićeva and Jarun. Bars and clubs. Very active.",
        "nature": "Surrounding hills and Sljeme mountain. Day trips to coast. Nature accessible.",
        "safety": "Very safe with low crime. Croatian hospitality. Comfortable.",
        "food": "Croatian and continental cuisine. Growing food scene. Quality available.",
        "community": "Growing international and tech community. Creative scene. Welcoming.",
        "english": "Good especially among youth. Communication possible.",
        "visa": "Schengen rules apply. Croatia joined 2023. Standard access.",
        "culture": "Austro-Hungarian heritage with Croatian identity. Museums and street art. Cultural depth.",
        "cleanliness": "Historic center well-maintained. Growing city standards. Good.",
        "airquality": "Good with hills around. Better than coastal cities in summer. Fresh."
    },
    "zhangjiajie": {
        "climate": "Zhangjiajie has a humid subtropical climate with hot summers (26-33°C) and cool winters (4-10°C). Misty mountains. Four seasons.",
        "cost": "Affordable for China. Apartments from ¥1500-3000/month ($210-420). Chinese provincial pricing.",
        "wifi": "Good infrastructure with VPN needed. Speeds of 30-80 Mbps. Chinese internet.",
        "nightlife": "Limited. Small city character. Tourist town evenings.",
        "nature": "Avatar mountains are stunning. UNESCO site. Nature is world-class.",
        "safety": "Very safe with Chinese standards. Tourist infrastructure. Comfortable.",
        "food": "Hunan cuisine with local specialties. Spicy and flavorful.",
        "community": "Small tourism community. Chinese tourists dominate. Limited international.",
        "english": "Very limited with Chinese essential.",
        "visa": "Chinese visa rules. Plan ahead.",
        "culture": "Tujia minority heritage. Avatar mountains made famous. Nature defines identity.",
        "cleanliness": "Tourist areas maintained. Chinese development. Good.",
        "airquality": "Good mountain air. Humidity creates mist. Fresh when clear."
    },
    "zillertal": {
        "climate": "Zillertal has an Alpine climate with warm summers (16-23°C) and cold winters (-8 to 2°C). Tyrolean Alps. Ski resort valley.",
        "cost": "Expensive as Austrian Alps. Apartments from €800-1500/month. Mountain premium.",
        "wifi": "Good Austrian infrastructure with speeds of 50-100 Mbps. Resort coverage. Reliable.",
        "nightlife": "Famous après-ski scene. Mountain parties. Seasonal activity.",
        "nature": "Dramatic Alpine valley. Hiking and skiing. Nature spectacular.",
        "safety": "Very safe with Austrian hospitality. Mountain town atmosphere. Comfortable.",
        "food": "Tyrolean cuisine with mountain specialties. Quality restaurants.",
        "community": "Outdoor sports and tourism community. Seasonal dynamics. International.",
        "english": "Good in tourism. German helps locally.",
        "visa": "Schengen rules apply. Austria is EU. Standard access.",
        "culture": "Traditional Tyrolean valley. Winter sports heritage. Alpine authenticity.",
        "cleanliness": "Very clean with Austrian standards. Pristine.",
        "airquality": "Excellent Alpine air quality. Mountain freshness. Pristine."
    },
    "zuerich": {
        "climate": "Zurich has a humid continental climate with warm summers (18-25°C) and cold winters (-2 to 4°C). Lake and Alps affect weather.",
        "cost": "Very expensive. Apartments from CHF 2200-4000/month ($2400-4400). Among world's costliest.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Impeccable.",
        "nightlife": "Sophisticated scene in Langstrasse and old town. Quality over quantity. Active.",
        "nature": "Lake Zurich and Alps visible. Mountains accessible. Nature spectacular.",
        "safety": "Extremely safe with virtually no crime. Swiss organization. Very comfortable.",
        "food": "International and Swiss cuisine. Quality is assured. Expensive but excellent.",
        "community": "International finance and tech community. Highly diverse. Established.",
        "english": "Good alongside German. Business uses English. Communication possible.",
        "visa": "Swiss rules apply. Various permit categories. Complex but accessible.",
        "culture": "Financial capital with Dadaism birthplace. Swiss precision meets creativity.",
        "cleanliness": "Immaculately clean with Swiss standards. Pristine.",
        "airquality": "Excellent with lake and mountain air. Fresh Alpine breezes. Pristine."
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

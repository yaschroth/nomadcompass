#!/usr/bin/env python3
"""Batch 11: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "doha": {
        "climate": "Doha has a hot desert climate with extreme summer heat (40-50°C) and mild winters (15-25°C). Summer is brutal outdoors. Air conditioning is essential most of the year.",
        "cost": "Expensive with apartments from QAR 5000-12000/month ($1400-3300). The city caters to high-income residents. Alcohol is particularly pricey.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. The tech investment ensures reliable connectivity. Modern buildings have excellent wifi.",
        "nightlife": "Limited due to cultural restrictions. Luxury hotel bars and restaurants are the main options. The scene is sophisticated but regulated.",
        "nature": "Desert landscapes with sand dunes and inland sea. Marine experiences in the Arabian Gulf. Urban parks provide some green space.",
        "safety": "Extremely safe with very low crime rates. The country is orderly and well-policed. Women can move freely.",
        "food": "International cuisines available at all levels. Middle Eastern food is excellent. The hotel scene drives fine dining.",
        "community": "Large expat community in various industries. The population is majority expat. Professional networks are well-established.",
        "english": "Widely spoken in business and daily life. Arabic is official but not necessary for visitors. The international population uses English.",
        "visa": "Various visa options with visa-free entry for many nationalities. Qatar is relatively accessible. Working requires sponsorship.",
        "culture": "Modern Gulf city with traditional Islamic values. The rapid development has created gleaming infrastructure. Cultural sensitivity is expected.",
        "cleanliness": "Immaculate with heavy investment in maintenance. Public spaces are pristine. Standards are exceptionally high.",
        "airquality": "Can be affected by dust and sand storms. Indoor air quality is excellent with filtration. Summer haze is common."
    },
    "muscat": {
        "climate": "Muscat has a hot desert climate with very hot summers (38-45°C) and pleasant winters (18-28°C). Humidity near the coast adds to summer discomfort. Winter is ideal.",
        "cost": "Moderate for the Gulf with apartments from OMR 300-600/month ($800-1600). Less expensive than UAE or Qatar. Good value for Gulf living.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. The country has invested in connectivity. Hotels and cafés have reliable wifi.",
        "nightlife": "Limited due to Islamic culture. Hotel bars serve alcohol to non-Muslims. The scene is quiet and sophisticated.",
        "nature": "Stunning mountain and coastal scenery. Wadis (valleys) offer natural swimming pools. The desert and sea create diverse landscapes.",
        "safety": "Extremely safe with virtually no crime. Oman is known for its stability and welcoming culture. One of the region's safest countries.",
        "food": "Omani cuisine with Middle Eastern and Indian influences. Fresh seafood is excellent. International options exist in hotels.",
        "community": "Smaller expat community than UAE. Professional networks exist in oil and gas sectors. The atmosphere is more traditional.",
        "english": "Widely spoken in business and tourism. Arabic is appreciated. Communication is generally easy.",
        "visa": "Various visa options with e-visa available. Oman is relatively accessible. Working requires sponsorship.",
        "culture": "Traditional Arab culture with remarkable hospitality. The Sultan maintained stability and moderation. The culture is dignified and welcoming.",
        "cleanliness": "Very clean with pride in maintaining the environment. Public spaces are well-kept. Standards are high throughout.",
        "airquality": "Good air quality except during dust storms. Coastal breezes help in Muscat. The desert air is generally clean."
    },
    "amman": {
        "climate": "Amman has a semi-arid climate with hot summers (30-35°C) and mild winters (5-15°C). The elevation keeps it cooler than lowland areas. Rain comes in winter.",
        "cost": "Moderate with apartments from JOD 300-600/month ($425-850). Affordable for the Middle East. Good value for quality of life.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. The city center has good connectivity. Modern areas have fiber.",
        "nightlife": "Growing scene with bars and restaurants in Rainbow Street and Jabal Amman. The scene is more liberal than neighboring countries. Options exist.",
        "nature": "Dramatic desert landscapes with Petra and Wadi Rum nearby. Dead Sea is accessible for day trips. The surrounding nature is spectacular.",
        "safety": "Very safe with low crime rates. Jordan is stable in a volatile region. Hospitality is genuine.",
        "food": "Jordanian and Levantine cuisine with excellent mezze and mansaf. Fresh falafel and hummus are everywhere. The food is flavorful and affordable.",
        "community": "International community from NGOs and regional organizations. Expat networks exist. The atmosphere is cosmopolitan for the region.",
        "english": "Good English proficiency in educated circles. Arabic is primary. Tourism and business function in English.",
        "visa": "Visa on arrival for many nationalities. Jordan is accessible. Working requires specific permissions.",
        "culture": "Ancient history from Petra to Roman ruins. Jordanian hospitality is legendary. The culture balances tradition with openness.",
        "cleanliness": "Varies by area with downtown showing urban wear. Newer areas are well-maintained. Archaeological sites are carefully preserved.",
        "airquality": "Generally good with dry climate. Some dust and traffic pollution. Better than many Middle Eastern cities."
    },
    "beirut": {
        "climate": "Beirut has a Mediterranean climate with hot summers (28-32°C) and mild, rainy winters (10-17°C). The sea moderates temperatures. Four seasons are distinct.",
        "cost": "Currently volatile due to economic crisis. Dollars go far but situation is complex. Research current conditions before visiting.",
        "wifi": "Infrastructure has suffered from crisis but functional with speeds of 10-30 Mbps. Power cuts affect connectivity. Generators are common.",
        "nightlife": "Legendary scene that persists despite challenges. The party culture is resilient. Beirut knows how to celebrate.",
        "nature": "Mediterranean coast with mountains nearby. Skiing and beaches on the same day is possible. The natural beauty is significant.",
        "safety": "Requires awareness of current situation. The country has security challenges. Monitoring news is essential.",
        "food": "Lebanese cuisine is one of the world's great cuisines. Fresh mezze, grilled meats, and sweets are extraordinary. The food scene is exceptional.",
        "community": "Resilient expat and local community. Lebanese hospitality is warm. Networks exist despite challenges.",
        "english": "Good English alongside French and Arabic. The educated population is multilingual. Communication is generally easy.",
        "visa": "Visa on arrival for many nationalities. Current situation should be checked. The country welcomes visitors.",
        "culture": "Phoenician heritage meets French influence and Arab culture. The resilience of Beirut is remarkable. The cultural scene is vibrant.",
        "cleanliness": "Crisis has affected services. Some areas are challenged. The people maintain pride despite difficulties.",
        "airquality": "Variable with some traffic pollution. The coastal location provides ventilation. Conditions change with circumstances."
    },
    "istanbul": {
        "climate": "Istanbul has a Mediterranean climate transitioning to humid subtropical. Summers are warm (25-30°C) and winters cool (5-10°C). The Bosphorus creates microclimates.",
        "cost": "Affordable by European standards with apartments from $400-900/month. Currency fluctuations affect purchasing power. Excellent value for the experience.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. Cafés and coworking spaces have reliable connections. The tech scene has improved connectivity.",
        "nightlife": "Legendary scene from Beyoglu bars to Bosphorus clubs. The city has endless options. Turkish hospitality enhances the experience.",
        "nature": "The Bosphorus and islands provide natural beauty. Day trips to beaches and forests are possible. The city integrates water beautifully.",
        "safety": "Generally safe with standard urban awareness. Political situation requires monitoring. Tourist areas are secure.",
        "food": "Turkish cuisine is incredible from kebabs to mezes to baklava. The food scene is diverse and affordable. The culinary heritage is remarkable.",
        "community": "Growing digital nomad community. The creative and tech scenes are active. Expat networks are well-established.",
        "english": "Good English in tourist areas and business. Turkish enhances the experience significantly. The international community uses English.",
        "visa": "E-visa required for most nationalities. Up to 90 days in 180 day period. Turkey is accessible for extended stays.",
        "culture": "Where East meets West with Byzantine, Ottoman, and modern influences. The history is layered and fascinating. The culture is rich and complex.",
        "cleanliness": "Varies significantly by area. Historic sites are maintained. Urban density creates challenges in some neighborhoods.",
        "airquality": "Can be affected by traffic and geography. The Bosphorus provides some ventilation. Quality varies by area and season."
    },
    "antalya": {
        "climate": "Antalya has a Mediterranean climate with hot summers (30-35°C) and mild winters (10-15°C). Over 300 sunny days per year. The sea moderates temperatures.",
        "cost": "Affordable with apartments from $350-700/month. Tourism infrastructure keeps costs reasonable. Excellent value for beach living.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Tourist areas have reliable connectivity. Coworking options exist.",
        "nightlife": "Beach clubs and old town bars offer options. The scene is active in summer. Kaleici district has atmospheric choices.",
        "nature": "Stunning Turquoise Coast with beaches and mountains. Ancient ruins dot the landscape. The natural beauty is exceptional.",
        "safety": "Safe tourist destination with well-established infrastructure. Standard awareness applies. The city is welcoming to visitors.",
        "food": "Turkish Mediterranean cuisine with excellent seafood. Fresh produce from the region is outstanding. The food scene is excellent value.",
        "community": "Growing nomad community attracted by climate and affordability. Expat retirees are common. Community is developing.",
        "english": "Tourism has built good English proficiency. Turkish adds local connection. Communication is easy in tourist areas.",
        "visa": "Same Turkish e-visa rules apply. Up to 90 days stays. Easy access for extended visits.",
        "culture": "Ancient Lycian and Roman heritage meets beach resort culture. Kaleici old town preserves history. The blend of ancient and modern is appealing.",
        "cleanliness": "Tourist areas are well-maintained. Beaches are cleaned regularly. The city invests in tourism infrastructure.",
        "airquality": "Excellent air quality with Mediterranean breezes. The coastal location ensures fresh air. One of Turkey's best air quality areas."
    },
    "mumbai": {
        "climate": "Mumbai has a tropical climate with hot temperatures year-round (25-35°C). Monsoon from June to September brings heavy rain. Humidity is constant.",
        "cost": "Expensive for India with apartments from ₹50,000-150,000/month ($600-1800). South Mumbai is premium. Other areas offer better value.",
        "wifi": "Variable infrastructure with speeds of 20-100 Mbps depending on location. Fiber is available in modern buildings. Coworking spaces have good connectivity.",
        "nightlife": "India's most vibrant nightlife with clubs, bars, and restaurants. The scene is diverse and energetic. Bollywood influence is everywhere.",
        "nature": "Urban environment with some green spaces. Beaches exist but aren't pristine. Day trips to hill stations possible.",
        "safety": "Generally safe for a mega-city. Petty crime exists. The crowds can be overwhelming but rarely threatening.",
        "food": "Street food capital with vada pav and pav bhaji legendary. Diverse cuisines from all of India. Fine dining has grown significantly.",
        "community": "Large and diverse with strong entrepreneurial community. Networking opportunities are endless. The energy is palpable.",
        "english": "Widely spoken as lingua franca. Business operates in English. Communication is straightforward.",
        "visa": "E-visa required for most nationalities. Various options available. The process is straightforward online.",
        "culture": "Financial and entertainment capital of India. Bollywood creates unique cultural energy. The hustle and ambition are defining.",
        "cleanliness": "Challenging in many areas with overcrowding straining infrastructure. Premium areas are maintained. The contrast is stark.",
        "airquality": "Often poor due to traffic, industry, and density. Masks are advisable. Air purifiers common in homes."
    },
    "bangalore": {
        "climate": "Bangalore has a tropical savanna climate with pleasant temperatures (20-30°C) due to elevation. The weather is moderate year-round. Monsoon brings refreshing rain.",
        "cost": "More affordable than Mumbai with apartments from ₹30,000-80,000/month ($360-960). Tech salaries are high. Good value for professionals.",
        "wifi": "Excellent tech hub infrastructure with speeds of 50-200 Mbps. The startup ecosystem ensures good connectivity. Coworking spaces are abundant.",
        "nightlife": "Growing scene with microbreweries, pubs, and clubs. Koramangala and Indiranagar are hotspots. The tech crowd creates vibrant atmosphere.",
        "nature": "Garden city with parks and tree-lined streets. Day trips to Nandi Hills and Coorg are popular. The climate encourages outdoor activities.",
        "safety": "Relatively safe for an Indian metro. Standard urban awareness applies. Tech parks are secure environments.",
        "food": "South Indian cuisine with dosas and idlis. Diverse international options due to cosmopolitan population. The food scene is sophisticated.",
        "community": "India's tech capital with massive startup ecosystem. Networking is endless. Digital nomad community is growing.",
        "english": "Widely spoken with tech jargon common. Communication is easy. The international tech community uses English.",
        "visa": "Standard Indian visa rules. Tech industry sponsors many visas. E-visa available for tourism.",
        "culture": "Tech culture meets traditional South Indian heritage. The city has transformed rapidly. Innovation and tradition coexist.",
        "cleanliness": "Better than many Indian cities but traffic affects streets. Tech parks are well-maintained. The city is greener than Mumbai.",
        "airquality": "Moderate with traffic pollution increasing. Better than Delhi or Mumbai. The garden city reputation is being challenged."
    },
    "goa": {
        "climate": "Goa has a tropical monsoon climate with hot temperatures (25-35°C). Monsoon from June to September brings heavy rain. October to March is ideal beach season.",
        "cost": "Affordable with long-term rentals from ₹20,000-50,000/month ($240-600). Beach living at good prices. Tourist season prices spike.",
        "wifi": "Improving infrastructure with speeds of 20-60 Mbps in developed areas. Beach shacks have variable connectivity. Coworking spaces have reliable wifi.",
        "nightlife": "Famous beach party scene from Anjuna to Vagator. Trance and electronic music culture runs deep. The scene is legendary.",
        "nature": "Beautiful beaches, palm groves, and Western Ghats mountains. The backwaters and wildlife sanctuaries add variety. Nature is the main attraction.",
        "safety": "Generally safe for tourists. Beach safety and scooter riding require caution. The atmosphere is relaxed and welcoming.",
        "food": "Goan cuisine blends Portuguese and Indian influences. Fresh seafood is excellent. Beach shack dining is quintessential Goa.",
        "community": "Large digital nomad community especially in winter. The beach lifestyle attracts remote workers. Community is well-established and social.",
        "english": "Widely spoken due to tourism and colonial history. Konkani is local language. Communication is easy.",
        "visa": "Standard Indian visa rules apply. E-visa available. Popular for extended winter stays.",
        "culture": "Portuguese colonial heritage creates unique character. The laid-back beach culture is famous. Churches and temples coexist.",
        "cleanliness": "Beach areas vary with tourist management challenges. Some areas are well-maintained while others show wear. Monsoon cleans and renews.",
        "airquality": "Generally good with coastal breezes. Monsoon brings fresh air. One of India's better air quality regions."
    },
    "delhi": {
        "climate": "Delhi has extreme seasons with scorching summers (40-45°C) and cold winters (5-15°C). October to March is pleasant. Summer heat is intense.",
        "cost": "Moderate for India with apartments from ₹25,000-70,000/month ($300-840). Good value for a capital city. The range of options is vast.",
        "wifi": "Good infrastructure in developed areas with speeds of 40-100 Mbps. Fiber is expanding. Coworking spaces have reliable connectivity.",
        "nightlife": "Growing scene in Hauz Khas, Connaught Place, and Gurgaon. The party culture is vibrant. High-end options abound.",
        "nature": "Urban environment with parks like Lodhi Gardens. Day trips to Rajasthan and Himalayas possible. The city itself is dense and urban.",
        "safety": "Requires awareness especially for women. The metro is safe. Tourist areas are generally secure.",
        "food": "Incredible street food and Mughlai cuisine. Chandni Chowk is a food pilgrimage. The diversity of cuisines is remarkable.",
        "community": "Large professional and diplomatic community. Networking opportunities are plentiful. The energy is intense.",
        "english": "Widely spoken in business and educated circles. Hindi is primary. Communication is generally possible.",
        "visa": "Standard Indian visa rules. E-visa available. The capital has all embassy services.",
        "culture": "Centuries of history from Mughal to British Raj to modern democracy. The monuments are spectacular. The culture is layered and complex.",
        "cleanliness": "Significant challenges with pollution and waste. Some areas are better maintained. The government is working on improvements.",
        "airquality": "Notorious for poor air quality especially in winter. Masks and air purifiers are essential. The situation is concerning."
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

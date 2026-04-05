#!/usr/bin/env python3
"""Batch 15: Add comprehensive category descriptions for 10 more cities from missing list."""

import json
import os

BATCH_CITIES = {
    "aarhus": {
        "climate": "Aarhus has a temperate oceanic climate with mild summers (17-22°C) and cold winters (0-4°C). Denmark is characterized by frequent rain and wind. Summer offers long days.",
        "cost": "Expensive like all of Denmark. Apartments from DKK 8000-14000/month ($1200-2100). High quality of life justifies costs.",
        "wifi": "Excellent Danish infrastructure with speeds of 50-100+ Mbps. Tech-savvy society ensures good connectivity. Public wifi widely available.",
        "nightlife": "University town energy with bars and clubs. The Latin Quarter has atmospheric options. Danish hygge culture influences socializing.",
        "nature": "Beautiful coastline and forests accessible. The city has green spaces and waterfront. Day trips to countryside are easy.",
        "safety": "Very safe with low crime. Danish society is trusting and organized. Walking at night is completely safe.",
        "food": "New Nordic cuisine influence with excellent restaurants. Danish bakeries and local specialties. The food scene is sophisticated.",
        "community": "University and startup community. Growing international presence. The compact city builds connections.",
        "english": "Excellent English proficiency. Danes speak English fluently. No language barriers.",
        "visa": "Schengen rules apply. Denmark has specific work permit requirements. Digital nomad scene is growing.",
        "culture": "Denmark's second city with modern architecture and museums. ARoS museum is world-class. Creative and youthful energy.",
        "cleanliness": "Immaculately clean with Nordic standards. Public spaces are pristine. Environmental consciousness is strong.",
        "airquality": "Excellent air quality with coastal breezes. One of Europe's cleanest cities. Fresh Scandinavian air."
    },
    "abudhabi": {
        "climate": "Abu Dhabi has a hot desert climate with extreme summers (40-50°C) and pleasant winters (18-25°C). Air conditioning is essential most of the year.",
        "cost": "Expensive with apartments from AED 6000-15000/month ($1600-4100). High standard of living. Similar to Dubai but slightly different vibe.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. The tech investment shows. Some VOIP restrictions.",
        "nightlife": "More conservative than Dubai but hotel bars and restaurants exist. The scene is sophisticated but limited.",
        "nature": "Desert landscapes and coastline. Mangroves and islands to explore. The desert safari experience is unique.",
        "safety": "Extremely safe with virtually no crime. Very orderly society. One of the world's safest cities.",
        "food": "International cuisines at all levels. Middle Eastern food is excellent. The dining scene caters to expats.",
        "community": "Large expat community in various industries. Professional networks established. Government and oil sectors dominate.",
        "english": "Widely spoken in daily life. Arabic is official but not essential. International workforce uses English.",
        "visa": "Various visa options available. Tourist visas for many nationalities. Working requires sponsorship.",
        "culture": "Emirati culture meets modern development. More traditional than Dubai. Sheikh Zayed Mosque is spectacular.",
        "cleanliness": "Immaculate throughout. Heavy investment in maintenance. Standards are exceptional.",
        "airquality": "Can be affected by dust. Indoor air quality is excellent. Summer haze is common."
    },
    "accra": {
        "climate": "Accra has a tropical savanna climate with warm temperatures year-round (25-32°C). Two rainy seasons. The heat is constant with sea breeze relief.",
        "cost": "Moderate for Africa. Apartments in expat areas from $600-1200/month. Local living is cheaper.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Mobile internet often more reliable. Tech sector is growing.",
        "nightlife": "Vibrant scene with bars, clubs, and live music. Ghanaian nightlife is energetic. Afrobeats and highlife music.",
        "nature": "Beaches along the coast. Day trips to national parks possible. The city itself is urban.",
        "safety": "Generally safe for Africa. Standard urban awareness needed. Petty crime exists but violent crime is low.",
        "food": "Ghanaian cuisine features jollof rice, banku, and fresh seafood. The food is flavorful. International options in expat areas.",
        "community": "Growing tech and startup community. The diaspora connection brings international influence. Coworking spaces emerging.",
        "english": "Official language and widely spoken. Ghana's colonial heritage means excellent English. Communication is easy.",
        "visa": "Visa required for most nationalities. Available on arrival for some. Ghana is relatively accessible.",
        "culture": "Welcoming Ghanaian culture with rich traditions. The Year of Return has brought diaspora connection. Hospitality is genuine.",
        "cleanliness": "Varies significantly by area. Some infrastructure challenges. Development is ongoing.",
        "airquality": "Moderate with some traffic pollution. The coastal location helps. Can be dusty in harmattan season."
    },
    "addisababa": {
        "climate": "Addis Ababa has a subtropical highland climate at 2,400m with pleasant temperatures (10-25°C). The altitude keeps it cool. Rainy season from June to September.",
        "cost": "Affordable with apartments from $400-800/month. Ethiopia is relatively cheap. Expat areas are pricier.",
        "wifi": "Limited infrastructure with speeds of 10-30 Mbps. Connectivity challenges exist. Government controls internet.",
        "nightlife": "Growing scene with live music venues showcasing Ethiopian music. The cultural scene is unique. Traditional bars called tej bet.",
        "nature": "The highlands and Entoto Mountain are accessible. Day trips to stunning landscapes. The Great Rift Valley is near.",
        "safety": "Requires awareness with political situation variable. Tourist areas are generally safe. Research current conditions.",
        "food": "Ethiopian cuisine is unique with injera and various stews. The coffee ceremony is essential. Vegetarian options abound.",
        "community": "International development and diplomatic community. African Union headquarters. Business networks exist.",
        "english": "Taught in schools and spoken in business. Amharic is local language. Communication possible in tourist areas.",
        "visa": "E-visa available for most nationalities. 30-90 day options. Ethiopia is accessible.",
        "culture": "Ancient civilization with unique calendar and customs. Ethiopian Orthodox heritage is visible. One of Africa's most distinctive cultures.",
        "cleanliness": "Developing with infrastructure challenges. New development is improving standards. The city is transforming.",
        "airquality": "Good at altitude. Some traffic pollution. The highland location helps air quality."
    },
    "adelaide": {
        "climate": "Adelaide has a Mediterranean climate with hot, dry summers (28-35°C) and mild winters (10-16°C). The driest state capital in Australia.",
        "cost": "More affordable than Sydney or Melbourne. Rents from AUD 1300-2200/month. Good value for Australian living.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-100 Mbps. Australian connectivity standards.",
        "nightlife": "Growing scene in the laneways and beach areas. Wine bar culture from nearby wine regions. More relaxed than eastern cities.",
        "nature": "Beaches, hills, and wine country all accessible. The Barossa and McLaren Vale nearby. Nature is a highlight.",
        "safety": "Very safe with low crime. Relaxed Australian atmosphere. Comfortable at all hours.",
        "food": "Excellent due to nearby wine regions. Fresh local produce. The food scene has grown significantly.",
        "community": "Smaller but growing tech and creative community. More affordable alternative to eastern cities. Friendly locals.",
        "english": "Native Australian English. No barriers. The relaxed accent is distinctive.",
        "visa": "Australian visa rules apply. Working holiday and skills visas. Immigration is competitive.",
        "culture": "Festival city with numerous arts events. More relaxed pace than Sydney. Wine and food culture defines identity.",
        "cleanliness": "Very clean throughout. Well-maintained public spaces. Australian standards are high.",
        "airquality": "Excellent air quality. The driest capital means less humidity. Clean and fresh."
    },
    "aixenprovence": {
        "climate": "Aix-en-Provence has a Mediterranean climate with hot summers (30-35°C) and mild winters (8-12°C). Over 300 sunny days per year. The mistral wind can be strong.",
        "cost": "Moderate to expensive for France. Apartments from €800-1400/month. Provence lifestyle adds to costs.",
        "wifi": "Good French infrastructure with speeds of 30-80 Mbps. Cafés may be variable. Home connections are reliable.",
        "nightlife": "Sophisticated scene with wine bars and terraces. Student population adds energy. The atmosphere is refined.",
        "nature": "Provence countryside is accessible. Mont Sainte-Victoire dominates the landscape. Lavender fields nearby.",
        "safety": "Very safe with low crime. The town is compact and welcoming. French civilization shows.",
        "food": "Provençal cuisine with excellent markets. Fresh local ingredients. The food culture is exceptional.",
        "community": "Student population and expat residents. Art and culture attract visitors. Community is cultured.",
        "english": "French dominant but some English in tourism. Learning French greatly enhances experience. Communication possible.",
        "visa": "Schengen rules apply. France offers various visa options. The process is bureaucratic but organized.",
        "culture": "Cézanne's hometown with artistic heritage. The cours Mirabeau is elegant. Provençal culture is proud.",
        "cleanliness": "Well-maintained historic center. French standards apply. The town is beautiful.",
        "airquality": "Excellent air quality with mistral clearing pollution. Provence is known for clean air. Fresh and sunny."
    },
    "alexandria": {
        "climate": "Alexandria has a Mediterranean climate with mild temperatures year-round (15-30°C). Sea breezes moderate the heat. Winter can bring rain.",
        "cost": "Very affordable with apartments from $200-500/month. Egypt is cheap. Excellent value.",
        "wifi": "Variable infrastructure with speeds of 10-40 Mbps. Improving. Some reliability challenges.",
        "nightlife": "More relaxed than Cairo. Mediterranean cafe culture. The corniche has evening activity.",
        "nature": "Mediterranean coastline is the highlight. Beaches are accessible. Day trips to desert possible.",
        "safety": "Generally safe for tourists. Standard awareness for Egypt. The city is more relaxed than Cairo.",
        "food": "Egyptian and Mediterranean cuisine. Excellent seafood. The food is flavorful and cheap.",
        "community": "Smaller expat community than Cairo. Historical and academic connections. Authentic experience.",
        "english": "Limited with Arabic dominant. Tourism areas have some English. Learning Arabic helps.",
        "visa": "Visa on arrival for most nationalities. Egypt is accessible. Extensions possible.",
        "culture": "Ancient history from the library to the lighthouse. The Mediterranean character is distinct from Cairo. Faded grandeur.",
        "cleanliness": "Varies with Egyptian standards. The corniche is maintained. Some areas are challenging.",
        "airquality": "Good due to sea location. Better than Cairo. Mediterranean breezes help."
    },
    "alicante": {
        "climate": "Alicante has a Mediterranean climate with hot summers (28-35°C) and mild winters (10-17°C). One of Europe's sunniest cities. The sea moderates temperatures.",
        "cost": "Affordable by Spanish standards. Apartments from €500-900/month. Excellent value for coastal living.",
        "wifi": "Good Spanish infrastructure with speeds of 40-100 Mbps. Fiber available. Reliable connections.",
        "nightlife": "Beach bar scene and old town options. The party culture is active especially in summer. Spanish nightlife hours.",
        "nature": "Beautiful beaches and nearby mountains. Day trips to Costa Blanca villages. Nature is accessible.",
        "safety": "Very safe with low crime. Tourist infrastructure is well-established. Comfortable atmosphere.",
        "food": "Valencian cuisine with excellent rice dishes and seafood. The food scene is quality. Spanish tapas culture.",
        "community": "Growing digital nomad community. Many British and European expats. Community is established.",
        "english": "Tourism has built English proficiency. Spanish enriches experience. Communication possible in tourist areas.",
        "visa": "Schengen rules apply. Spanish digital nomad visa available. Good for extended stays.",
        "culture": "Castle overlooking the city with historic old town. Mediterranean lifestyle. Relaxed coastal culture.",
        "cleanliness": "Well-maintained beaches and tourist areas. Spanish standards. The city is pleasant.",
        "airquality": "Excellent air quality with sea breezes. The coastal location ensures fresh air. One of Spain's sunniest, cleanest cities."
    },
    "annecy": {
        "climate": "Annecy has an oceanic climate with warm summers (20-28°C) and cold winters (-2 to 8°C). The lake and mountains create microclimate. Snow in winter.",
        "cost": "Expensive as a desirable French town. Apartments from €900-1500/month. Alpine location adds premium.",
        "wifi": "Good French infrastructure with speeds of 30-70 Mbps. Tourism ensures connectivity. Reliable service.",
        "nightlife": "Charming but limited scene. Wine bars and restaurants. The atmosphere is refined rather than party.",
        "nature": "Stunning Alpine lake and mountains. Outdoor activities year-round. One of France's most beautiful settings.",
        "safety": "Extremely safe with virtually no crime. The affluent atmosphere adds security. Very comfortable.",
        "food": "French Alpine cuisine with Savoyard specialties. Excellent restaurants and markets. The food culture is refined.",
        "community": "Small expat and outdoor sports community. The beauty attracts visitors. Community is quality-focused.",
        "english": "French dominant with some English in tourism. Learning French important. Communication possible.",
        "visa": "Schengen rules apply. France offers various options. The location is desirable.",
        "culture": "Medieval old town on a crystal-clear lake. The Venice of the Alps. Sophisticated French culture.",
        "cleanliness": "Immaculately clean. The lake is famously pure. Standards are exceptional.",
        "airquality": "Excellent air quality with Alpine freshness. The lake and mountains ensure clean air. One of France's best."
    },
    "antwerp": {
        "climate": "Antwerp has a temperate oceanic climate with mild temperatures year-round (3-23°C). Rain is common throughout the year. Summers are pleasant.",
        "cost": "Moderate for Belgium. Apartments from €700-1200/month. Good value for quality of life.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. Belgium is well-connected. Reliable service.",
        "nightlife": "Vibrant scene in various neighborhoods. The fashion and design crowd creates energy. Belgian beer culture.",
        "nature": "Urban environment but parks exist. The Scheldt River provides waterfront. Day trips to countryside easy.",
        "safety": "Safe with standard urban awareness. The city is well-organized. Comfortable atmosphere.",
        "food": "Belgian cuisine with excellent frites, chocolate, and beer. International options. The food scene is quality.",
        "community": "Fashion, diamonds, and port industries bring international presence. Creative community. Networks exist.",
        "english": "Excellent English alongside Dutch and French. Communication is easy. The international presence helps.",
        "visa": "Schengen rules apply. Belgium has complex bureaucracy. The process requires patience.",
        "culture": "Rubens hometown with world-class fashion and diamonds. The port city has distinctive character. Culture is sophisticated.",
        "cleanliness": "Well-maintained with Belgian standards. The city has character without being sterile. Good overall.",
        "airquality": "Moderate with some port and traffic effects. Better than Brussels. Generally acceptable."
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

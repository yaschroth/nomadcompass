#!/usr/bin/env python3
"""Batch 8: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "rio": {
        "climate": "Rio has a tropical savanna climate with hot summers (30-40°C) and mild winters (20-25°C). Humidity is high year-round. The sea breeze provides some relief.",
        "cost": "Moderate for South America with apartments from $500-1200/month in good areas. Beach living is accessible. The currency fluctuations affect purchasing power.",
        "wifi": "Variable infrastructure with speeds of 15-50 Mbps depending on location. Copacabana and Ipanema have better connectivity. Coworking spaces offer reliable connections.",
        "nightlife": "Legendary scene from beach kiosks to samba clubs in Lapa. The party culture is deeply ingrained. Cariocas know how to celebrate.",
        "nature": "Dramatic mountains meet stunning beaches in an urban setting. Tijuca National Park is the world's largest urban rainforest. The natural beauty is unmatched.",
        "safety": "Requires significant awareness with crime a real concern. Stick to established tourist areas. Favela tours should only be with reputable guides.",
        "food": "Brazilian cuisine features feijoada, churrasco, and fresh tropical fruits. Juice bars are everywhere. The food scene ranges from street to sophisticated.",
        "community": "Growing digital nomad community especially in Copacabana and Ipanema. The beach lifestyle attracts remote workers. Portuguese skills help significantly.",
        "english": "Limited English outside tourist areas. Portuguese is essential for real connection. Brazilians are friendly and try to communicate regardless.",
        "visa": "90 days visa-free for most nationalities with option to extend. Brazil is working on digital nomad visa. The process is relatively straightforward.",
        "culture": "Carnival culture, samba, and beach life define the Carioca spirit. The joy of life is infectious. Art, music, and celebration are everywhere.",
        "cleanliness": "Varies significantly by area. Tourist beaches are cleaned but some areas are challenging. The natural beauty contrasts with urban issues.",
        "airquality": "Generally good due to ocean breezes and surrounding mountains. Some traffic-related pollution in busy areas. The natural ventilation helps."
    },
    "saopaulo": {
        "climate": "São Paulo has a humid subtropical climate with warm summers (25-30°C) and mild winters (12-20°C). The altitude keeps temperatures moderate. Rain is common year-round.",
        "cost": "Brazil's most expensive city but affordable by global standards. Apartments range from $500-1200/month. The food scene offers value at all levels.",
        "wifi": "Best connectivity in Brazil with speeds of 30-80 Mbps in business districts. Coworking spaces are abundant and well-equipped. Tech startups ensure good infrastructure.",
        "nightlife": "One of the world's great nightlife cities with clubs like D-Edge. Vila Madalena and Jardins offer diverse options. The scene runs until dawn and beyond.",
        "nature": "Urban environment with parks like Ibirapuera providing green space. Day trips to beaches and countryside are possible. The city itself is concrete-heavy.",
        "safety": "Requires awareness with crime present. Stick to established neighborhoods. Many areas are safe but caution is always needed.",
        "food": "South America's food capital with every cuisine represented excellently. The Japanese food rivals Tokyo. The Italian heritage shows in excellent pasta.",
        "community": "Largest startup ecosystem in Latin America. Strong tech and creative communities. Coworking spaces have active professional networks.",
        "english": "Better English than Rio in business contexts but Portuguese is still essential. The international business community uses English. Daily life requires Portuguese.",
        "visa": "Same Brazilian visa rules as Rio. The business environment is more formal. São Paulo is where Brazil does business.",
        "culture": "Brazil's cultural and economic engine. World-class museums, galleries, and theater. The city's diversity creates rich cultural offerings.",
        "cleanliness": "Business districts are maintained while some areas are challenging. The scale of the city creates inconsistency. Graffiti art adds character.",
        "airquality": "Can be problematic due to traffic and industry. The sprawl creates pollution challenges. Air quality varies by neighborhood and season."
    },
    "marrakech": {
        "climate": "Marrakech has a hot semi-arid climate with scorching summers (35-45°C) and mild winters (10-20°C). The heat can be intense from June to September. Spring and autumn are ideal.",
        "cost": "Very affordable with beautiful riads from $400-800/month. The medina offers incredible value. Luxury experiences are accessible at lower prices than Europe.",
        "wifi": "Improving infrastructure with speeds of 10-30 Mbps. Riads and cafés have variable connections. The new town has better connectivity than the medina.",
        "nightlife": "Rooftop bars and restaurants with calls to prayer as backdrop. The nightlife is atmospheric but not wild. Some clubs cater to tourists.",
        "nature": "Gateway to Atlas Mountains and Sahara Desert. Day trips to mountain villages and valleys. The surrounding landscapes are stunning.",
        "safety": "Generally safe with persistent touts being the main annoyance. Navigate the medina with confidence. Scams target tourists but violent crime is rare.",
        "food": "Moroccan cuisine features tagines, couscous, and incredible pastries. The food is aromatic and flavorful. Mint tea is a cultural institution.",
        "community": "Small but growing digital nomad community. The creative scene attracts artists and designers. Coworking options are limited but expanding.",
        "english": "French is more useful than English. Arabic and Berber are local languages. Tourism has improved English in hospitality.",
        "visa": "90 days visa-free for most Western nationalities. Morocco is accessible for extended stays. The borders with Algeria are closed.",
        "culture": "Ancient medina culture meets French colonial influence. The architecture and crafts are extraordinary. Islamic traditions shape daily life.",
        "cleanliness": "The medina has ancient character which includes some grit. Riads maintain internal cleanliness beautifully. Standards vary throughout the city.",
        "airquality": "Generally good but dust from the desert can affect air. Summer heat creates haze. The dry climate means little humidity."
    },
    "capetown": {
        "climate": "Cape Town has a Mediterranean climate with warm summers (25-30°C) and mild, wet winters (10-15°C). The summer is ideal with long sunny days. Wind can be strong.",
        "cost": "Affordable by Western standards with apartments from $600-1200/month. The exchange rate favors visitors. World-class experiences at reasonable prices.",
        "wifi": "Good infrastructure with speeds of 30-100 Mbps. Load shedding (power cuts) disrupts connectivity. Coworking spaces have backup power.",
        "nightlife": "Sophisticated scene from Long Street bars to wine country. The rooftop and beach club scene is excellent. South African hospitality is warm.",
        "nature": "Arguably the world's most naturally beautiful city. Table Mountain, beaches, and wine country all accessible. The outdoor lifestyle is exceptional.",
        "safety": "Requires significant awareness with high crime rates. Stick to established areas and don't walk at night in certain zones. The beauty comes with challenges.",
        "food": "Excellent wine country cuisine with diverse South African influences. Fresh seafood and braai culture are highlights. The food scene is increasingly sophisticated.",
        "community": "Established digital nomad community especially in the summer. Cape Town has become a popular remote work destination. The lifestyle attracts entrepreneurs.",
        "english": "Widely spoken as one of the official languages. Afrikaans and Xhosa also common. No language barriers for visitors.",
        "visa": "90 days visa-free for most nationalities. South Africa has discussed digital nomad visas. Extensions are possible.",
        "culture": "Rainbow nation culture blending African, European, and Malay influences. The apartheid history creates complex dynamics. The arts scene is vibrant.",
        "cleanliness": "Varies dramatically by area. Tourist zones are well-maintained. The inequality is visible in living conditions.",
        "airquality": "Generally excellent with mountain and ocean breezes. One of Africa's cleanest air cities. The natural setting ensures fresh air."
    },
    "nairobi": {
        "climate": "Nairobi has a subtropical highland climate with moderate temperatures year-round (12-26°C). The altitude keeps it cool for Africa. Two rainy seasons bring green periods.",
        "cost": "Moderate with Western-style apartments from $500-1200/month. Local living is very affordable. International products are expensive.",
        "wifi": "Good infrastructure due to tech hub status with speeds of 20-60 Mbps. Mobile internet is reliable. Coworking spaces have excellent connectivity.",
        "nightlife": "Vibrant scene in Westlands and Karen with bars and clubs. Live music and cultural events are common. The nightlife has African and international flavors.",
        "nature": "Nairobi National Park has lions with city skyline backdrop. Gateway to Kenya's incredible wildlife. Day trips to Great Rift Valley are possible.",
        "safety": "Requires significant caution especially at night. Use established taxis and stay in secure areas. The city has security challenges.",
        "food": "Kenyan cuisine features nyama choma and ugali. International options are good in upscale areas. The food scene is improving rapidly.",
        "community": "Strong tech community as Africa's 'Silicon Savannah'. Growing startup ecosystem attracts entrepreneurs. Coworking culture is well-established.",
        "english": "Widely spoken as an official language alongside Swahili. Business operates in English. Communication is straightforward.",
        "visa": "E-visa required for most nationalities. The process is straightforward. Kenya is pushing for tech-friendly policies.",
        "culture": "Diverse tribal cultures meet modern African urbanity. The Maasai heritage is visible. Creative industries are booming.",
        "cleanliness": "Varies significantly with affluent areas well-maintained. Traffic congestion affects air and cleanliness. The city is rapidly developing.",
        "airquality": "Moderate air quality with some traffic pollution. The altitude helps with freshness. Varies by neighborhood and season."
    },
    "auckland": {
        "climate": "Auckland has a humid subtropical climate with warm summers (20-25°C) and mild winters (10-15°C). Rain is common but rarely heavy. The weather changes quickly.",
        "cost": "Expensive with rents from NZD 2000-3500/month. The isolated location affects prices. Quality of life is high but costly.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. Fiber is widely available. The tech scene ensures good connectivity.",
        "nightlife": "Vibrant scene in Britomart and Ponsonby. The craft beer and wine bar culture is strong. The scene is refined rather than rowdy.",
        "nature": "City of sails with beautiful harbors and beaches. Volcanic cones provide urban hiking. Day trips to forests and islands are easy.",
        "safety": "Very safe with low crime rates. The relaxed Kiwi culture creates welcoming atmosphere. Most areas are secure.",
        "food": "Pacific fusion cuisine with excellent seafood. The food scene is innovative and fresh. New Zealand wine is world-class.",
        "community": "Growing tech community with startup scene. The nomad community is smaller but quality-focused. Kiwi friendliness makes connections easy.",
        "english": "Native English with Kiwi accent and expressions. No language barriers. Maori adds cultural depth to the language.",
        "visa": "Various options including working holiday visas. New Zealand has skills-based immigration. The remote location affects visa policies.",
        "culture": "Maori heritage meets British colonial history and Pacific influences. The outdoor culture is central to identity. Innovation and sustainability are valued.",
        "cleanliness": "Very clean throughout with pride in public spaces. Environmental consciousness is high. Parks and beaches are well-maintained.",
        "airquality": "Excellent air quality due to isolation and clean energy. Among the world's cleanest urban air. Fresh Pacific air is a constant."
    },
    "wellington": {
        "climate": "Wellington has a temperate oceanic climate with mild temperatures year-round (8-20°C). Wind is legendary and constant. Rain is common but the sun appears frequently.",
        "cost": "Cheaper than Auckland but still expensive. Apartments range NZD 1600-2800/month. The compact size makes car-free living possible.",
        "wifi": "Excellent infrastructure with fiber widely available. Speeds of 50-100+ Mbps are standard. The tech and creative industries ensure good connectivity.",
        "nightlife": "Creative scene with craft beer bars and live music venues. Cuba Street has bohemian character. The compact city creates concentrated energy.",
        "nature": "Harbor setting with hills providing stunning views. The surrounding region has wild beauty. Wind-swept coastline is dramatic.",
        "safety": "Very safe with low crime. The compact, walkable city adds to security. Kiwi culture is welcoming and trusting.",
        "food": "Café culture is exceptional with excellent coffee. The food scene punches above its weight. Fresh local ingredients are emphasized.",
        "community": "Strong creative and tech community. Government sector adds to professional networks. The compact size builds genuine connections.",
        "english": "Native English in New Zealand's capital. No language barriers. Te Reo Maori adds cultural richness.",
        "visa": "Same New Zealand visa rules as Auckland. Wellington has a more established professional expat community. Working visas are accessible.",
        "culture": "New Zealand's cultural capital with museums, theater, and film industry (Weta). The creative energy is palpable. Progressive values are evident.",
        "cleanliness": "Very clean with well-maintained public spaces. The compact size allows good maintenance. Environmental consciousness is strong.",
        "airquality": "Excellent air quality with constant wind ensuring freshness. Among the world's cleanest capital cities. The maritime location brings pure air."
    },
    "perth": {
        "climate": "Perth has a Mediterranean climate with hot, dry summers (30-40°C) and mild, wet winters (10-18°C). Sunshine is abundant year-round. The isolation creates unique weather patterns.",
        "cost": "Expensive but cheaper than Sydney or Melbourne. Rents range AUD 1500-2500/month. The mining economy drives high wages and costs.",
        "wifi": "Good infrastructure with NBN providing 40-100 Mbps. The isolation has driven investment in connectivity. Cafés have reliable wifi.",
        "nightlife": "Growing scene in Northbridge and Fremantle. The small bar revolution has improved options. The isolation historically limited entertainment.",
        "nature": "Stunning beaches and the vast outback are accessible. Kings Park provides urban nature. The wildflower season is spectacular.",
        "safety": "Very safe with low crime rates. The isolation creates a trusting community. Beaches are well-patrolled.",
        "food": "Fresh seafood and excellent wine from Margaret River region. The Asian influence is growing. The food scene has improved dramatically.",
        "community": "Smaller expat and nomad community due to isolation. The mining industry brings international workers. Community is tight-knit once established.",
        "english": "Native Australian English. No language barriers. The isolation creates distinctive local expressions.",
        "visa": "Australian visa rules apply. Working holiday visas are popular. The mining industry sponsors skilled workers.",
        "culture": "Relaxed beach culture with growing arts scene. The isolation creates self-reliance. Perth has developed its own unique identity.",
        "cleanliness": "Very clean with excellent public services. Beaches are pristine. The wealth from mining shows in infrastructure.",
        "airquality": "Excellent air quality with Indian Ocean breezes. Among Australia's cleanest air cities. The isolation protects from industrial pollution."
    },
    "brisbanecity": {
        "climate": "Brisbane has a humid subtropical climate with hot summers (28-35°C) and mild winters (10-21°C). The sunshine is abundant. Summer brings humidity and afternoon storms.",
        "cost": "More affordable than Sydney or Melbourne. Rents range AUD 1400-2400/month. The Gold Coast nearby offers beach lifestyle.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-100 Mbps are common. Cafés and coworking spaces have reliable connections.",
        "nightlife": "Growing scene in Fortitude Valley and South Bank. The city is emerging from Brisbane's traditionally quiet reputation. Live music and bars are thriving.",
        "nature": "River city with surrounding beaches and hinterland. Day trips to Gold Coast and Sunshine Coast are easy. Urban parks are well-developed.",
        "safety": "Very safe with low crime rates. The relaxed Queensland lifestyle is welcoming. Most areas are secure.",
        "food": "Improving food scene with emphasis on local produce. Asian influences are strong. The café culture is well-developed.",
        "community": "Growing tech and startup community. More affordable alternative to Sydney. The nomad community is building.",
        "english": "Native Australian English with Queensland character. No language barriers. The laid-back accent is distinctive.",
        "visa": "Australian visa rules apply. Working holiday visas are popular. Queensland attracts many backpackers and workers.",
        "culture": "Laid-back Queensland culture with outdoor focus. The arts scene is growing. Brisbane is finding its own identity beyond Sydney and Melbourne.",
        "cleanliness": "Very clean with subtropical greenery maintained. South Bank is well-kept. The river adds to the pleasant atmosphere.",
        "airquality": "Good air quality with coastal breezes. Some humidity in summer. The outdoor lifestyle is supported by fresh air."
    },
    "hongkong": {
        "climate": "Hong Kong has a humid subtropical climate with hot, humid summers (28-33°C) and mild winters (15-20°C). Typhoon season runs from May to November. The humidity can be intense.",
        "cost": "Extremely expensive with tiny apartments from HKD 15,000-30,000/month ($2000-4000). The cost of living is very high. Food can be affordable at local spots.",
        "wifi": "World-class infrastructure with speeds of 100+ Mbps standard. The city is extremely connected. Wifi is ubiquitous.",
        "nightlife": "Legendary scene from Lan Kwai Fong to Soho and Wan Chai. The city never sleeps with bars and clubs abundant. The energy is intense.",
        "nature": "Surprisingly green with country parks covering 40% of land. Hiking trails are excellent. The harbor and outlying islands offer escapes.",
        "safety": "Very safe with low crime rates historically. Recent political changes have altered the atmosphere. The city remains orderly.",
        "food": "One of the world's great food cities with incredible dim sum and Cantonese cuisine. The variety is astonishing. Michelin stars meet humble noodle shops.",
        "community": "Large expat community in finance and business. The recent changes have affected community dynamics. The professional networks remain strong.",
        "english": "Widely spoken as an official language. Business operates in English. Cantonese is primary for local life.",
        "visa": "Various visa options with 90-180 day tourist stays depending on nationality. Working requires specific visas. The rules have evolved recently.",
        "culture": "Unique blend of Chinese traditions and British colonial heritage. The East-West fusion creates distinctive culture. Recent changes are reshaping the identity.",
        "cleanliness": "Very clean with efficient public services. The density is managed remarkably well. Standards are high throughout.",
        "airquality": "Can be poor with pollution from local and regional sources. Visibility varies significantly. Air quality monitoring is common."
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

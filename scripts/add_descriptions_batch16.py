#!/usr/bin/env python3
"""Batch 16: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "aqaba": {
        "climate": "Aqaba has a hot desert climate with scorching summers (35-42°C) and mild winters (15-22°C). The Red Sea moderates temperatures slightly. Very little rainfall.",
        "cost": "Affordable with apartments from JOD 250-450/month ($350-650). Jordan is reasonably priced. Beach living at good value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving with tourism development. Hotels have good connections.",
        "nightlife": "Limited due to culture but hotel bars exist. Beachside cafes provide evening atmosphere. More relaxed than nightclub focused.",
        "nature": "Red Sea diving and snorkeling are world-class. Desert landscapes nearby including Wadi Rum. Nature is the main draw.",
        "safety": "Very safe with Jordan's stability. Aqaba is welcoming and tourist-friendly. Very comfortable.",
        "food": "Jordanian cuisine with excellent seafood. Fresh fish from the Red Sea. Middle Eastern flavors are excellent.",
        "community": "Small expat community in diving and tourism. Winter visitors from Europe. Community is intimate.",
        "english": "Good English in tourism sector. Arabic is local but not essential for visitors. Communication is possible.",
        "visa": "Jordan Pass includes visa for most nationalities. Accessible for tourists. Extensions possible.",
        "culture": "Gateway to Petra and Wadi Rum. Jordanian hospitality is legendary. The culture is welcoming.",
        "cleanliness": "Tourist areas are maintained. Development is improving standards. The beaches are cared for.",
        "airquality": "Excellent air quality with sea and desert breezes. Very clean and dry. Fresh coastal air."
    },
    "arequipa": {
        "climate": "Arequipa has a semi-arid highland climate at 2,335m with mild temperatures year-round (10-23°C). The altitude keeps it comfortable. Very little rain.",
        "cost": "Very affordable with apartments from $300-600/month. Peru offers excellent value. Cost of living is low.",
        "wifi": "Decent infrastructure with speeds of 15-40 Mbps. Improving with tourism. Cafes have wifi.",
        "nightlife": "Growing scene with bars around the plaza. The student population adds energy. More relaxed than Lima.",
        "nature": "Surrounded by volcanoes including El Misti. Gateway to Colca Canyon. The landscapes are dramatic.",
        "safety": "Generally safe with standard awareness. The city is welcoming. Tourist areas are secure.",
        "food": "Arequipa is Peru's culinary capital with unique regional dishes like rocoto relleno. The food scene is excellent.",
        "community": "Small expat community growing. Language students and long-term travelers. Community is developing.",
        "english": "Limited with Spanish essential. Tourism areas have some support. Learning Spanish is important.",
        "visa": "183 days visa-free for most nationalities. Peru is accessible. Extensions possible.",
        "culture": "UNESCO World Heritage colonial architecture in white volcanic stone. The culture is proud and distinctive.",
        "cleanliness": "Historic center is well-maintained. The city takes pride in its appearance. Standards are good.",
        "airquality": "Excellent air quality at altitude. The dry climate helps. Clean highland air."
    },
    "arusha": {
        "climate": "Arusha has a mild highland climate with temperatures of 15-28°C. The altitude keeps it comfortable. Two rainy seasons.",
        "cost": "Moderate for East Africa with apartments from $400-800/month. Safari tourism affects prices. Reasonable value.",
        "wifi": "Variable infrastructure with speeds of 10-30 Mbps. Mobile data often better. Improving gradually.",
        "nightlife": "Some bars and restaurants. The safari crowd creates social atmosphere. More relaxed than party focused.",
        "nature": "Gateway to Serengeti, Ngorongoro, and Kilimanjaro. The wildlife is spectacular. Nature is the primary draw.",
        "safety": "Generally safe for tourists. Standard awareness for East Africa. The tourism infrastructure helps.",
        "food": "Tanzanian cuisine with international options for tourists. Fresh produce is available. Simple but satisfying.",
        "community": "Safari industry and conservation community. International researchers and volunteers. Networks exist.",
        "english": "Widely spoken alongside Swahili. Tanzania's tourism ensures English access. Communication is easy.",
        "visa": "Visa on arrival for most nationalities. Tanzania is accessible. Safari packages common.",
        "culture": "Maasai culture meets safari tourism. The bush camp experience is unique. Conservation culture is strong.",
        "cleanliness": "Varies with development levels. Tourist areas maintained. Infrastructure is developing.",
        "airquality": "Good air quality at altitude. The highland location helps. Fresh African air."
    },
    "baguio": {
        "climate": "Baguio is the summer capital of the Philippines at 1,500m with cool temperatures (15-25°C). Known as the City of Pines. Much cooler than lowland Philippines.",
        "cost": "Very affordable with apartments from $200-400/month. The Philippines is cheap. Excellent value for cool climate.",
        "wifi": "Decent infrastructure with speeds of 15-40 Mbps. Better than rural Philippines. Improving steadily.",
        "nightlife": "University town energy with bars and cafes. Session Road has options. More cultural than party.",
        "nature": "Pine forests and mountains provide escape from tropical heat. Rice terraces nearby. Cool climate is refreshing.",
        "safety": "Safe tourist destination. The highland community is welcoming. Comfortable atmosphere.",
        "food": "Mix of Filipino and highland cuisine. Fresh vegetables from local farms. Good variety.",
        "community": "Student and artist community. Long-term expats escaping heat. Community is established.",
        "english": "Excellent English as in all Philippines. Communication is easy. No barriers.",
        "visa": "Same generous Philippine visa rules. Easy extensions. Good for long stays.",
        "culture": "American colonial heritage meets Filipino mountain culture. The cool climate creates distinct atmosphere. Artist community is active.",
        "cleanliness": "Better maintained than lowland cities. The cooler climate helps. Standards are reasonable.",
        "airquality": "Good air quality with pine forest surroundings. Much cleaner than Manila. Fresh mountain air."
    },
    "baku": {
        "climate": "Baku has a semi-arid climate with hot summers (30-38°C) and mild winters (3-10°C). The Caspian Sea moderates temperatures. Can be windy.",
        "cost": "Affordable with apartments from $400-800/month. Azerbaijan offers good value. Oil wealth creates modern infrastructure.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. The country has invested in connectivity. Reliable service.",
        "nightlife": "Growing scene with modern bars and clubs. The old city has atmosphere. Developing nightlife culture.",
        "nature": "Caspian Sea coastline and mud volcanoes. Day trips to mountains possible. The landscape is unique.",
        "safety": "Very safe with low crime. The city is orderly. Comfortable atmosphere.",
        "food": "Azerbaijani cuisine is excellent with kebabs, plov, and dolma. Fresh Caspian seafood. The food is flavorful.",
        "community": "Small expat community in oil and business. Growing tourism. Community is developing.",
        "english": "Growing proficiency. Russian is common. Azerbaijani is local. Tourism is building English.",
        "visa": "E-visa available for most nationalities. Easy process. Azerbaijan is accessible.",
        "culture": "Ancient and modern blend in the old city and Flame Towers. Oil wealth has transformed the city. Unique Caucasian culture.",
        "cleanliness": "Very clean modern areas. Oil money shows in maintenance. Standards are high.",
        "airquality": "Generally good with sea breezes. Some industrial effects. Reasonable quality."
    },
    "bandung": {
        "climate": "Bandung has a tropical highland climate at 768m with cooler temperatures (17-28°C). Much more comfortable than Jakarta. Rainy season is strong.",
        "cost": "Very affordable with apartments from $200-400/month. Indonesia is cheap. Excellent value.",
        "wifi": "Variable infrastructure with speeds of 10-40 Mbps. Improving gradually. Mobile data often better.",
        "nightlife": "Growing scene with cafes and bars. University population adds energy. More relaxed than Jakarta.",
        "nature": "Surrounded by volcanoes and tea plantations. The cool climate enables outdoor activities. Nature is accessible.",
        "safety": "Generally safe with standard awareness. The city is welcoming. Tourist areas are secure.",
        "food": "Sundanese cuisine is distinct and delicious. Local specialties are unique. The food scene is excellent value.",
        "community": "Student and creative community. Growing digital presence. Community is developing.",
        "english": "Limited with Indonesian essential. University areas have some English. Learning Indonesian helps.",
        "visa": "30-day visa on arrival for most nationalities. Extensions possible. Indonesia is accessible.",
        "culture": "Art Deco colonial heritage meets contemporary creativity. The creative industries are growing. Youthful energy.",
        "cleanliness": "Varies by area. Development is ongoing. Some infrastructure challenges.",
        "airquality": "Better than Jakarta due to altitude. Some traffic pollution. Generally acceptable."
    },
    "bari": {
        "climate": "Bari has a Mediterranean climate with hot summers (28-35°C) and mild winters (8-14°C). The Adriatic moderates temperatures. Sunny most of the year.",
        "cost": "Affordable by Italian standards. Apartments from €400-700/month. Southern Italy offers value.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Improving. Cafes have wifi.",
        "nightlife": "Growing scene in the old town. Italian aperitivo culture. The atmosphere is social.",
        "nature": "Adriatic coastline and nearby trulli region. Puglia is beautiful. Nature is accessible.",
        "safety": "Safe with Italian standards. The city has improved significantly. Comfortable.",
        "food": "Puglian cuisine is excellent with orecchiette, burrata, and fresh seafood. The food is outstanding.",
        "community": "Small but growing expat community. Puglia attracts visitors. Community is developing.",
        "english": "Limited with Italian important. Tourism is building English. Learning Italian helps.",
        "visa": "Schengen rules apply. Italy has digital nomad options. Standard European access.",
        "culture": "Gateway to Puglia with historic old town. The region's uniqueness is appealing. Italian south character.",
        "cleanliness": "Old town is well-maintained. Southern Italian standards. Improving with tourism.",
        "airquality": "Good air quality with Adriatic breezes. The coastal location helps. Fresh sea air."
    },
    "bariloche": {
        "climate": "Bariloche has a cold semi-arid climate with warm summers (18-25°C) and cold winters (-2 to 8°C). Snow in winter makes it a ski destination. Patagonian weather is changeable.",
        "cost": "Moderate for Argentina. Apartments from $400-800/month. Tourism affects prices seasonally.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. Tourist areas have coverage.",
        "nightlife": "Ski resort atmosphere with bars and cafes. Chocolate shops are famous. Seasonal energy.",
        "nature": "Stunning Andean lakes and mountains. Outdoor activities year-round. One of South America's most beautiful settings.",
        "safety": "Very safe for Argentina. The resort atmosphere is secure. Comfortable environment.",
        "food": "Patagonian cuisine with famous chocolate. Fresh trout and lamb. European influences show.",
        "community": "Adventure sports and tourism community. Seasonal workers and long-term residents. Community varies by season.",
        "english": "Limited with Spanish needed. Tourism areas have some English. Learning Spanish helps.",
        "visa": "90 days visa-free for most nationalities. Argentina is accessible. Extensions possible.",
        "culture": "Swiss-inspired Alpine village in Patagonia. The European heritage is visible. Adventure culture dominates.",
        "cleanliness": "Well-maintained tourist town. Standards are good. The natural environment is pristine.",
        "airquality": "Excellent air quality with Patagonian winds. One of the world's cleanest air regions. Fresh mountain air."
    },
    "barranquilla": {
        "climate": "Barranquilla has a tropical climate with hot weather year-round (28-35°C). The Caribbean coast is humid. Heat is constant.",
        "cost": "Very affordable with apartments from $300-500/month. Colombia is cheap. Excellent value for Caribbean living.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Colombia has invested in connectivity. Reliable.",
        "nightlife": "Vibrant scene with Caribbean energy. Carnival is famous. The party culture is strong.",
        "nature": "Caribbean coast and Magdalena River. Beaches accessible. Urban but with water access.",
        "safety": "Improving but requires awareness. Tourist areas are generally safe. Standard precautions.",
        "food": "Caribbean Colombian cuisine with fresh seafood. The food is flavorful. Very affordable.",
        "community": "Smaller expat community than Medellín or Cartagena. More authentic experience. Community is developing.",
        "english": "Limited with Spanish essential. Less touristy means more Spanish needed. Learning is important.",
        "visa": "180 days visa-free for most nationalities. Colombia is generous. Easy access.",
        "culture": "Carnival de Barranquilla is UNESCO-listed. Caribbean music and culture. Gabriel García Márquez connections.",
        "cleanliness": "Varies by area. Development is ongoing. Some infrastructure challenges.",
        "airquality": "Generally good with Caribbean breezes. The coastal location helps. Reasonably fresh."
    },
    "basel": {
        "climate": "Basel has a temperate oceanic climate with warm summers (20-28°C) and cold winters (-1 to 5°C). The Rhine River adds character. Four seasons.",
        "cost": "Very expensive as Switzerland. Apartments from CHF 1500-2500/month ($1700-2800). High costs but high quality.",
        "wifi": "Excellent Swiss infrastructure with speeds of 100+ Mbps. Reliable and fast. First-class connectivity.",
        "nightlife": "Sophisticated scene with bars and clubs. Art Basel brings international energy. Refined atmosphere.",
        "nature": "Rhine River and nearby Black Forest and Jura Mountains. The tri-border location offers variety. Nature is accessible.",
        "safety": "Extremely safe with virtually no crime. Swiss efficiency applies. Very comfortable.",
        "food": "Swiss cuisine plus international due to location. The art scene brings quality dining. High standards.",
        "community": "Art and pharmaceutical industries bring internationals. Academic community at the university. Networks are established.",
        "english": "Good English alongside German and French. International community uses English. Communication easy.",
        "visa": "Swiss non-EU rules apply. Permits are difficult. The country is selective.",
        "culture": "Art Basel makes this a world cultural capital. The old town on the Rhine is beautiful. Architecture and art define the city.",
        "cleanliness": "Immaculately clean with Swiss standards. Public spaces are pristine. Exceptional.",
        "airquality": "Excellent air quality. Swiss environmental standards are high. Fresh Rhine valley air."
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

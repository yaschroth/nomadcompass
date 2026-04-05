#!/usr/bin/env python3
"""Batch 12: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "krakow": {
        "climate": "Krakow has a humid continental climate with warm summers (20-25°C) and cold, snowy winters (-5 to 5°C). The city can be grey in winter. Summer is pleasant.",
        "cost": "Very affordable by European standards with apartments from €400-700/month. One of Europe's best value cities. The quality of life per cost is excellent.",
        "wifi": "Good Polish infrastructure with speeds of 50-150 Mbps. Cafés and coworking spaces are well-equipped. Fiber is widely available.",
        "nightlife": "Legendary scene with hundreds of bars in the old town and Kazimierz district. The student population ensures vibrant energy. Polish hospitality is warm.",
        "nature": "The Vistula River and nearby Tatra Mountains provide nature access. Day trips to stunning Polish countryside are easy. Parks provide urban greenery.",
        "safety": "Very safe with low crime rates. The city is welcoming and orderly. Tourist areas are well-policed.",
        "food": "Polish cuisine features pierogi, kielbasa, and hearty dishes. The food scene has become increasingly sophisticated. Prices are extremely reasonable.",
        "community": "Growing digital nomad community attracted by costs and quality. Coworking spaces are modern. The expat community is active.",
        "english": "Good English proficiency especially among younger Poles. Polish is helpful for deeper connection. Tourism operates in English.",
        "visa": "Schengen rules apply. Poland welcomes tourists and remote workers. The visa situation is straightforward.",
        "culture": "Medieval old town and Jewish heritage in Kazimierz district. The history is layered and profound. Contemporary culture is thriving.",
        "cleanliness": "Old town is beautifully maintained. Some areas show post-communist development. Overall standards are good.",
        "airquality": "Can be poor in winter due to heating. Summer is generally good. The basin location traps pollution."
    },
    "warsaw": {
        "climate": "Warsaw has a humid continental climate with warm summers (22-28°C) and cold winters (-5 to 3°C). Four distinct seasons. Winter can be harsh.",
        "cost": "More expensive than Krakow but affordable for a capital. Apartments from €500-900/month. Good value for European living.",
        "wifi": "Excellent infrastructure with Poland's best connectivity (100+ Mbps common). Tech sector ensures good internet. Coworking spaces are modern.",
        "nightlife": "Vibrant scene with clubs, bars, and live music. The reconstruction after WWII created unique modern architecture for nightlife. The energy is cosmopolitan.",
        "nature": "The Vistula River provides waterfront recreation. Łazienki Park is beautiful. Day trips to Polish countryside are easy.",
        "safety": "Very safe European capital with low crime. The city is modern and well-organized. Walking at night is generally safe.",
        "food": "Polish cuisine plus international options. The food scene has grown significantly. Quality and variety are excellent.",
        "community": "Strong business and tech community. Startup scene is developing. Coworking culture is established.",
        "english": "Good English in business and among younger people. The international presence is growing. Communication is easy.",
        "visa": "Schengen rules apply. The capital has all embassy services. EU membership makes access easy.",
        "culture": "Remarkable story of reconstruction after near-total WWII destruction. The old town is UNESCO listed. Modern culture is emerging confidently.",
        "cleanliness": "Modern and well-maintained throughout. The reconstruction created functional infrastructure. Standards are high.",
        "airquality": "Can be affected by traffic and winter heating. Generally acceptable. Better than many European capitals."
    },
    "riga": {
        "climate": "Riga has a humid continental climate with mild summers (18-24°C) and cold winters (-5 to -1°C). The Baltic Sea moderates extremes slightly. Winter is dark and cold.",
        "cost": "Affordable with apartments from €500-900/month. Good value for Baltic living. The cost of living is reasonable.",
        "wifi": "Good Baltic infrastructure with speeds of 50-100 Mbps. Tech sector has improved connectivity. Coworking spaces exist.",
        "nightlife": "Vibrant old town scene with bars and clubs. The party culture is active. Latvian hospitality is genuine once approached.",
        "nature": "Baltic Sea beaches and nearby forests. The city has parks and waterfront. Day trips to Jurmala beach are popular.",
        "safety": "Very safe with low crime. The city is orderly and well-managed. Tourist areas are secure.",
        "food": "Latvian cuisine features hearty dishes. The food scene has modernized significantly. Baltic ingredients are highlighted.",
        "community": "Smaller nomad community but growing. Tech scene exists. The compact city builds connections.",
        "english": "Good English proficiency especially among younger Latvians. Latvian and Russian are local languages. Tourism operates in English.",
        "visa": "Schengen rules apply. The Baltics are accessible. EU membership simplifies everything.",
        "culture": "Art Nouveau architecture is spectacular. The medieval old town is atmospheric. Soviet heritage adds complexity.",
        "cleanliness": "Well-maintained old town and public spaces. Baltic standards are high. The city takes pride in its appearance.",
        "airquality": "Good air quality with Baltic breezes. One of Europe's cleaner capitals. The location ensures fresh air."
    },
    "tallinn": {
        "climate": "Tallinn has a humid continental climate with mild summers (17-22°C) and cold, dark winters (-5 to 0°C). The Gulf of Finland affects weather. Winter is challenging.",
        "cost": "Moderate with apartments from €600-1100/month. More expensive than other Baltic capitals. Tech wealth has increased costs.",
        "wifi": "Excellent infrastructure as a digital society leader. Speeds of 100+ Mbps standard. E-Estonia innovation is evident.",
        "nightlife": "Vibrant old town scene with bars and clubs. The tech community creates energy. Estonian reserve dissolves after drinks.",
        "nature": "Baltic Sea access and nearby forests. The coastline is accessible. Day trips to islands and nature parks are easy.",
        "safety": "Very safe with low crime rates. The digital society is well-organized. Estonian efficiency applies to safety.",
        "food": "New Nordic influences on Estonian cuisine. The food scene has elevated significantly. Local ingredients are emphasized.",
        "community": "Strong tech and startup community. E-residency attracts digital entrepreneurs. The nomad scene is established.",
        "english": "Excellent English proficiency. Business operates smoothly in English. Estonian is difficult but respected.",
        "visa": "Schengen rules apply. E-residency offers digital access without physical residency. Estonia is tech-friendly.",
        "culture": "Medieval old town is UNESCO-listed perfection. The digital innovation contrasts with ancient architecture. Small country pride is palpable.",
        "cleanliness": "Immaculately clean with Nordic standards. Public spaces are pristine. The maintenance is excellent.",
        "airquality": "Excellent air quality with Baltic breezes. One of Europe's cleanest capitals. The small scale helps quality."
    },
    "vilnius": {
        "climate": "Vilnius has a humid continental climate with warm summers (20-25°C) and cold winters (-5 to 0°C). Four distinct seasons. Winter can be harsh.",
        "cost": "Most affordable Baltic capital with apartments from €400-700/month. Excellent value for quality. The cost of living is very reasonable.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Tech sector growing. Coworking spaces are equipped.",
        "nightlife": "Vibrant old town scene. The city has become known for creative nightlife. Lithuanian hospitality is warm.",
        "nature": "The city has parks and nearby forests. Day trips to Trakai Castle and nature are easy. Green spaces are accessible.",
        "safety": "Very safe with low crime. The city is well-organized. Tourist areas are secure.",
        "food": "Lithuanian cuisine meets modern influences. The food scene has grown significantly. Local ingredients featured.",
        "community": "Growing digital nomad and startup community. The affordability attracts remote workers. Community is developing.",
        "english": "Good English proficiency among younger people. Lithuanian is local language. Tourism and business function in English.",
        "visa": "Schengen rules apply. Lithuania is accessible and welcoming. EU membership simplifies travel.",
        "culture": "Baroque old town is UNESCO-listed. The independent republic of Uzupis adds creative spirit. History is proudly preserved.",
        "cleanliness": "Well-maintained old town and public areas. Standards are good. The city takes pride in appearance.",
        "airquality": "Good air quality for a capital city. The location and size help. Generally clean and fresh."
    },
    "sarajevo": {
        "climate": "Sarajevo has a humid continental climate with warm summers (25-30°C) and cold winters (-3 to 5°C). The valley location intensifies seasons. Snow is common in winter.",
        "cost": "Very affordable with apartments from €300-500/month. One of Europe's cheapest capitals. Excellent value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving rapidly. Cafés have wifi.",
        "nightlife": "Vibrant scene in Baščaršija and old town. Bosnian hospitality is legendary. Kafanas (traditional bars) offer atmosphere.",
        "nature": "Mountains surrounding the city with Olympic facilities. Nature is accessible directly from the city. Day hikes and skiing possible.",
        "safety": "Safe for tourists with people extremely welcoming. Landmines exist in remote rural areas - stay on marked paths. The city itself is secure.",
        "food": "Bosnian cuisine features ćevapi, burek, and Turkish influences. The food is hearty and delicious. Prices are incredibly low.",
        "community": "Small but growing nomad community. The authentic experience attracts visitors. Community is intimate.",
        "english": "Growing English proficiency. Serbian/Croatian/Bosnian is local. Younger people often speak English.",
        "visa": "90 days visa-free for most nationalities. Not in Schengen or EU. Accessible for extended stays.",
        "culture": "Where East meets West with Ottoman, Austro-Hungarian, and Yugoslav layers. The siege history is profound. Resilience defines the character.",
        "cleanliness": "Old town is maintained with character. Some areas show post-war development challenges. Standards are improving.",
        "airquality": "Can be poor in winter due to heating. Valley traps pollution. Summer is generally better."
    },
    "belgrade": {
        "climate": "Belgrade has a humid subtropical climate with hot summers (28-35°C) and cold winters (-2 to 5°C). The river confluence affects weather. Four distinct seasons.",
        "cost": "Affordable with apartments from €350-600/month. Excellent value for European living. Nightlife is surprisingly cheap.",
        "wifi": "Good infrastructure with speeds of 40-100 Mbps. Tech sector is developing. Cafés have reliable connections.",
        "nightlife": "Legendary scene with splavovi (river clubs) and Savamala bars. The party culture is famous. Belgrade rivals any European capital.",
        "nature": "Two rivers provide waterfront recreation. Ada Ciganlija island is a beach. Day trips to nature are possible.",
        "safety": "Generally safe with low violent crime. Some petty crime. The city is welcoming to visitors.",
        "food": "Serbian cuisine with excellent grilled meats. Kafanas serve traditional dishes. The food is hearty and generous.",
        "community": "Growing digital nomad community attracted by costs and nightlife. Coworking spaces exist. The vibe attracts creatives.",
        "english": "Good English among younger Serbians. Serbian is local language. Communication is generally possible.",
        "visa": "90 days visa-free for most nationalities. Not in EU or Schengen. Easy access for extended stays.",
        "culture": "Complex history from Ottoman rule to Yugoslavia to independence. The culture is resilient and creative. Hospitality is genuine.",
        "cleanliness": "Central areas are maintained. Some neighborhoods show development challenges. Standards are improving.",
        "airquality": "Can be affected by traffic. The rivers provide some ventilation. Generally acceptable."
    },
    "skopje": {
        "climate": "Skopje has a continental climate with hot summers (30-38°C) and cold winters (-3 to 5°C). The valley location intensifies temperatures. Summer heat can be intense.",
        "cost": "Very affordable with apartments from €200-400/month. One of Europe's cheapest capitals. Excellent value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Improving. The tech sector is developing.",
        "nightlife": "Growing scene with bars and clubs. Macedonian hospitality is warm. The old bazaar has atmosphere.",
        "nature": "Mountains surround the city. Day trips to Ohrid Lake are popular. Nature is accessible.",
        "safety": "Safe for tourists. The people are welcoming. Standard awareness is sufficient.",
        "food": "Macedonian cuisine blends Balkan and Turkish influences. Grilled meats and salads are highlights. Prices are very low.",
        "community": "Small nomad community. The authenticity attracts visitors. Community is developing.",
        "english": "Growing English proficiency. Macedonian is local language. Tourism areas have some English.",
        "visa": "90 days visa-free for most nationalities. Not in EU or Schengen. Accessible.",
        "culture": "Ancient history meets controversial modern monuments. The old bazaar preserves Ottoman heritage. The identity is complex.",
        "cleanliness": "New city center is maintained. Some areas show development challenges. Standards vary.",
        "airquality": "Can be poor due to valley location trapping pollution. Winter heating affects air. Summers are better."
    },
    "tirana": {
        "climate": "Tirana has a Mediterranean climate with hot summers (28-35°C) and mild winters (5-12°C). Summer can be very hot. Spring and autumn are pleasant.",
        "cost": "Very affordable with apartments from €250-450/month. One of Europe's best values. Excellent cost of living.",
        "wifi": "Improving infrastructure with speeds of 30-70 Mbps. Fiber is expanding. Cafés have wifi.",
        "nightlife": "Vibrant scene in Blloku district. The transformation from communist to party capital is remarkable. Albanian hospitality is generous.",
        "nature": "Mountains and beaches are accessible from the capital. Day trips to stunning coastline. The countryside is beautiful.",
        "safety": "Generally safe with low violent crime. Some petty crime. The city has improved dramatically.",
        "food": "Albanian cuisine blends Mediterranean and Balkan influences. Fresh ingredients are abundant. Prices are very low.",
        "community": "Rapidly growing digital nomad community. The affordability attracts remote workers. Community is developing fast.",
        "english": "Growing English proficiency especially among youth. Albanian is local. Italian is also common.",
        "visa": "One year visa-free for most nationalities since 2022. Incredibly generous policy. Albania welcomes digital nomads.",
        "community": "Rapidly growing digital nomad community. The affordability attracts remote workers. Community is developing fast.",
        "culture": "Communist past meets Mediterranean energy. The transformation is remarkable. The hospitality is overwhelming.",
        "cleanliness": "Central areas are improving. Some development has been rapid. Standards are rising.",
        "airquality": "Can be affected by traffic and construction. Improving with development. Generally acceptable."
    },
    "podgorica": {
        "climate": "Podgorica has a Mediterranean climate with very hot summers (35-40°C) and mild winters (5-12°C). The city is in a valley that intensifies summer heat. Winter is pleasant.",
        "cost": "Affordable with apartments from €350-600/month. Montenegro offers good value. The cost of living is reasonable.",
        "wifi": "Decent infrastructure with speeds of 30-60 Mbps. Fiber available in newer buildings. The country has invested in connectivity.",
        "nightlife": "Limited scene but options exist. Montenegrin nightlife is more coastal-focused. Bars and restaurants available.",
        "nature": "Gateway to stunning Montenegrin nature. Mountains, lakes, and coast accessible. Day trips reveal spectacular scenery.",
        "safety": "Very safe with low crime. Montenegrin hospitality is warm. The atmosphere is relaxed.",
        "food": "Montenegrin cuisine blends Mediterranean and Balkan influences. Grilled meats and seafood are highlights. Prices are reasonable.",
        "community": "Small nomad community. The coast attracts more visitors. Podgorica is functional rather than exciting.",
        "english": "Good English proficiency. Serbian/Montenegrin is local. Communication is easy in tourist settings.",
        "visa": "90 days visa-free for most nationalities. Not in EU. Montenegro is accessible.",
        "culture": "Newest European capital with mix of Ottoman and Austro-Hungarian heritage. The character is developing. The country's natural beauty is the draw.",
        "cleanliness": "Central areas are maintained. Development is ongoing. Standards are reasonable.",
        "airquality": "Can be very hot in summer affecting perceived air quality. The valley location matters. Generally acceptable."
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

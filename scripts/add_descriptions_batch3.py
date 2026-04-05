#!/usr/bin/env python3
"""Batch 3: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "hochiminhcity": {
        "climate": "Ho Chi Minh City has a tropical climate with temperatures between 25-35°C year-round. The dry season from December to April offers the most comfortable conditions. The rainy season brings daily afternoon downpours but they're usually brief and refreshing.",
        "cost": "Vietnam's largest city offers incredible value with meals for $2-4 and comfortable studios for $400-600/month. The cost of living is 60-70% lower than Western cities. Street food culture means you can eat well for very little.",
        "wifi": "Internet infrastructure has improved dramatically with average speeds of 40-80 Mbps. Cafés throughout District 1 and 3 offer reliable wifi for remote work. Fiber connections in apartments typically deliver 100+ Mbps.",
        "nightlife": "The nightlife scene is vibrant and varied, from rooftop bars in District 1 to underground clubs in District 2. Bui Vien Street offers backpacker party vibes while more sophisticated options exist throughout the city. The scene runs late into the night.",
        "nature": "Urban parks like Tao Dan provide green escapes within the city. Day trips to Cu Chi Tunnels and Mekong Delta offer nature experiences. The city itself is densely built but tree-lined boulevards add greenery.",
        "safety": "Generally safe for visitors with petty theft being the main concern. Bag snatching from motorbikes occurs so keep belongings secure. Traffic is chaotic but locals are helpful and violent crime against foreigners is rare.",
        "food": "Vietnamese cuisine shines in its birthplace of pho and banh mi. Street food stalls serve incredible dishes at rock-bottom prices. The food scene ranges from humble street corners to world-class restaurants.",
        "community": "A growing digital nomad community centers around District 1 and Thao Dien in District 2. Coworking spaces like Dreamplex and Toong host regular events. The expat community is welcoming and diverse.",
        "english": "English proficiency is growing, especially among younger Vietnamese. Tourist areas and business districts have good English support. Learning basic Vietnamese phrases helps in local neighborhoods.",
        "visa": "Vietnam offers 15-day visa-free entry for many nationalities. E-visas for 30 days are easily obtained online. Longer stays require visa runs or business visa arrangements.",
        "culture": "A fascinating blend of Vietnamese traditions, French colonial heritage, and modern development. The city pulses with entrepreneurial energy and youthful optimism. Temples sit alongside skyscrapers in this dynamic metropolis.",
        "cleanliness": "Street cleanliness varies by district with central areas better maintained. Air quality can be affected by traffic and construction. Modern buildings and malls maintain high standards.",
        "airquality": "Air quality is moderate to poor, especially during rush hours. The dry season tends to have worse air quality than the wet season. Many expats use air purifiers in their apartments."
    },
    "hanoi": {
        "climate": "Hanoi experiences four distinct seasons with hot humid summers and cool winters. Spring (March-April) and autumn (September-November) offer the most pleasant weather. Winter can be surprisingly cold and damp.",
        "cost": "Hanoi offers excellent value with local meals for $1-3 and apartments in the Old Quarter for $350-500/month. The cost of living is lower than Ho Chi Minh City. Traditional markets offer incredibly cheap fresh produce.",
        "wifi": "Internet speeds are reliable at 30-60 Mbps in most cafés. The Old Quarter has numerous laptop-friendly coffee shops. Home fiber connections typically offer 80-150 Mbps.",
        "nightlife": "The nightlife has a different character than Saigon, with beer corners and rooftop bars. Ta Hien Street is famous for cheap bia hoi and social atmosphere. The scene is more relaxed but still entertaining.",
        "nature": "Beautiful lakes like Hoan Kiem and West Lake provide urban green spaces. Weekend trips to Ha Long Bay and Sapa offer stunning natural beauty. The city has more parks and trees than southern cities.",
        "safety": "Very safe for visitors with low crime rates. Traffic is the biggest hazard as motorbikes dominate the streets. Locals are generally honest and helpful to tourists.",
        "food": "Hanoi is Vietnam's culinary capital with distinct northern cuisine. Pho here is considered the original and best. The Old Quarter offers endless street food exploration opportunities.",
        "community": "The nomad community is smaller but tight-knit, centered around West Lake and the Old Quarter. Coworking spaces like Toong and Hub have active communities. The slower pace attracts those seeking authenticity.",
        "english": "English levels are improving but generally lower than in Saigon. Tourist areas have adequate English support. Learning Vietnamese basics is more necessary here.",
        "visa": "Same visa policies as Ho Chi Minh City with 15-day visa-free for many nationalities. E-visas available for 30 days. The city is close to Laos border for visa runs.",
        "culture": "Vietnam's cultural heart with ancient temples, lakes, and French colonial architecture. The city moves at a slower, more traditional pace than Saigon. Arts and traditional crafts thrive here.",
        "cleanliness": "The Old Quarter can be cluttered but charming. Newer areas are cleaner and more organized. Street cleaning happens early morning throughout the city.",
        "airquality": "Air quality is often poor, especially in winter when pollution gets trapped. Seasonal haze from agricultural burning affects visibility. Air purifiers are recommended for long-term residents."
    },
    "kualalumpur": {
        "climate": "Kuala Lumpur has a tropical climate with temperatures of 27-33°C year-round. Rain can occur any time but is usually brief. Air-conditioned spaces provide relief from the heat and humidity.",
        "cost": "KL offers good value compared to Singapore with meals for $3-6 and modern apartments for $500-800/month. The city has options for every budget. Shopping and entertainment are reasonably priced.",
        "wifi": "Excellent internet infrastructure with speeds of 50-100 Mbps standard. Cafés and malls offer reliable free wifi. Home connections can reach 500+ Mbps with fiber.",
        "nightlife": "Despite being a Muslim-majority country, KL has vibrant nightlife in areas like Bukit Bintang and Changkat. Rooftop bars and clubs cater to expats and tourists. The scene is diverse and international.",
        "nature": "The Petronas Towers are iconic but KL also has green spaces like KLCC Park and Lake Gardens. Batu Caves and nearby highlands offer nature escapes. The Cameron Highlands are a short drive away.",
        "safety": "Generally safe with low violent crime rates. Petty theft can occur in tourist areas. The police are professional and the city is well-patrolled.",
        "food": "Malaysian cuisine is a delicious fusion of Malay, Chinese, and Indian flavors. Hawker centers serve incredible food at low prices. The food scene is one of Asia's best.",
        "community": "A diverse expat community with many digital nomads choosing KL as a base. Coworking spaces are modern and affordable. The international community is welcoming and well-established.",
        "english": "English is widely spoken as a second language. Business and tourism operate smoothly in English. Most signage is in both Malay and English.",
        "visa": "Generous 90-day visa-free entry for many nationalities. Easy visa runs to nearby countries if needed. The MM2H program offers long-term residence options.",
        "culture": "A melting pot of Malay, Chinese, Indian, and international influences. Modern skyscrapers meet traditional mosques and temples. The city celebrates diversity in its festivals and daily life.",
        "cleanliness": "Modern areas are well-maintained and clean. Public transportation is spotless. Some older neighborhoods show more wear but overall standards are high.",
        "airquality": "Air quality is generally moderate but can worsen during haze season from Indonesian fires. The city monitors air quality closely. Modern buildings have good filtration systems."
    },
    "seoul": {
        "climate": "Seoul has four distinct seasons with hot humid summers and cold winters. Spring cherry blossoms and autumn foliage are spectacular. Winter temperatures drop well below freezing with occasional snow.",
        "cost": "Seoul is more expensive than Southeast Asia but offers good value for a developed city. Meals range from $5-15 and apartments from $800-1500/month. The excellent public transit keeps transportation costs low.",
        "wifi": "South Korea has some of the world's fastest internet with speeds over 100 Mbps standard. Wifi is ubiquitous and reliable everywhere. Even subway cars have excellent connectivity.",
        "nightlife": "Legendary nightlife districts like Hongdae, Itaewon, and Gangnam offer endless options. Korean drinking culture is social and welcoming. Clubs and bars stay open until dawn.",
        "nature": "Mountains surround Seoul with excellent hiking within the city limits. Bukhansan National Park offers challenging trails with city views. The Han River parks provide urban recreation space.",
        "safety": "One of the world's safest major cities with very low crime rates. Women can walk alone at night without concern. The police are helpful and professional.",
        "food": "Korean cuisine is a highlight with BBQ, bibimbap, and countless dishes to explore. Cheap eats are abundant in university areas. The food delivery culture is incredibly convenient.",
        "community": "Large expat community with many English teachers and digital nomads. Seoul Global Center provides support for foreigners. Meetup groups and language exchanges are popular.",
        "english": "English levels vary but are improving, especially among younger Koreans. Tourist areas have good English support. Learning basic Korean significantly enhances the experience.",
        "visa": "90-day visa-free entry for many Western nationalities. K-ETA registration required before arrival. Working holiday visas available for some countries.",
        "culture": "A fascinating blend of ancient traditions and cutting-edge modernity. K-pop and Korean culture have global influence. Palaces and temples exist alongside futuristic architecture.",
        "cleanliness": "Extremely clean and well-maintained throughout the city. Public spaces are spotless. The culture emphasizes cleanliness and order.",
        "airquality": "Air quality can be poor due to fine dust from China and local sources. Real-time air quality apps are essential. Many residents wear masks on high-pollution days."
    },
    "buenosaires": {
        "climate": "Buenos Aires has a humid subtropical climate with hot summers and mild winters. The best weather is in spring (September-November) and autumn (March-May). Summer can be hot and humid with temperatures above 30°C.",
        "cost": "Argentina's economic situation makes BA incredibly affordable for those earning in dollars or euros. Excellent meals for $5-10 and apartments for $400-700/month. Currency fluctuations can significantly affect prices.",
        "wifi": "Internet speeds are decent at 20-50 Mbps in most locations. Cafés in Palermo and Recoleta are laptop-friendly. Home connections have improved significantly in recent years.",
        "nightlife": "One of the world's great nightlife cities with clubs that don't start until 2am. Tango shows, wine bars, and electronic music scenes thrive. The party culture is legendary.",
        "nature": "The city itself is urban but beautiful parks like Bosques de Palermo provide green space. Day trips to the Tigre Delta offer nature escapes. The Pampas and Patagonia are accessible for longer trips.",
        "safety": "Petty crime exists so basic precautions are needed. Avoid flashy displays of wealth and stay aware in crowded areas. Most neighborhoods are safe during the day.",
        "food": "World-famous steaks, empanadas, and Italian-influenced cuisine. Asado culture is a social institution. The café culture with medialunas is delightful.",
        "community": "Large and active digital nomad community, especially in Palermo. Coworking spaces host regular events and meetups. The expat community is welcoming and well-established.",
        "english": "English is not widely spoken outside tourist areas. Spanish is essential for daily life. Language exchanges are popular and a great way to meet people.",
        "visa": "90-day visa-free entry for most Western nationalities. Extensions and border runs are possible. The country is welcoming to long-term visitors.",
        "culture": "European elegance meets Latin passion in this cultural capital. Theater, art, and literature are deeply valued. The city has a distinctive identity that captivates visitors.",
        "cleanliness": "Street cleanliness varies by neighborhood. Some areas show urban wear but central districts are well-maintained. Parks and plazas are generally clean.",
        "airquality": "Generally good air quality compared to other major Latin American cities. Occasional pollution from traffic in busy areas. The wide avenues help with air circulation."
    },
    "bogota": {
        "climate": "At 2,600m elevation, Bogotá has spring-like weather year-round with temperatures of 12-20°C. The altitude means it's much cooler than tropical lowlands. Rain can occur year-round but is usually brief.",
        "cost": "Colombia offers excellent value with meals for $3-6 and apartments for $400-700/month. The cost of living has risen but remains affordable. Domestic flights and transport are reasonably priced.",
        "wifi": "Internet infrastructure has improved significantly with speeds of 30-60 Mbps common. Cafés in Chapinero and Usaquén are work-friendly. Fiber connections in apartments can reach 100+ Mbps.",
        "nightlife": "Bogotá has legendary nightlife with salsa clubs, electronic music venues, and craft cocktail bars. Zona Rosa and Chapinero offer diverse options. The party scene runs late into the night.",
        "nature": "Surrounded by mountains with hiking trails accessible from the city. Monserrate offers stunning views. Day trips to Lake Guatavita and other natural areas are easy.",
        "safety": "Safety has improved dramatically but awareness is still important. Stick to established neighborhoods and use registered taxis or apps. Most tourist areas are safe during the day.",
        "food": "Colombian cuisine features hearty dishes like bandeja paisa and ajiaco. The food scene has become increasingly sophisticated with world-class restaurants. Street food is abundant and cheap.",
        "community": "Growing digital nomad community centered in Chapinero and Usaquén. Coworking spaces are modern and affordable. Colombian hospitality makes integration easy.",
        "english": "English proficiency is improving but Spanish is essential for daily life. Tourist areas have some English support. Language exchange opportunities abound.",
        "visa": "180 days visa-free for most nationalities, one of the most generous policies. Easy to extend or do border runs. Colombia actively welcomes digital nomads.",
        "culture": "A renaissance city with booming arts, music, and gastronomy scenes. Colombian warmth and hospitality are genuine. The city has transformed remarkably in recent decades.",
        "cleanliness": "Central and upscale areas are well-maintained. Street art adds character throughout the city. Environmental awareness is growing.",
        "airquality": "Air quality is generally good due to altitude and breezes. Rush hour traffic can affect certain areas. The cool climate means less need for air conditioning."
    },
    "playaydelcarmen": {
        "climate": "Playa del Carmen has a tropical climate with warm weather year-round. Temperatures stay between 25-33°C. Hurricane season runs June to November but direct hits are rare.",
        "cost": "Prices have risen with tourism but remain reasonable at $800-1200/month for a comfortable lifestyle. Eating at local spots saves money versus tourist restaurants. Long-term rentals offer better value.",
        "wifi": "Internet has improved significantly with speeds of 30-50 Mbps available. Many cafés and coworking spaces have reliable connections. Some residential areas have fiber options.",
        "nightlife": "The famous Fifth Avenue offers countless bars, clubs, and restaurants. The party scene caters to tourists and expats alike. Beach clubs provide daytime entertainment.",
        "nature": "Stunning Caribbean beaches, cenotes for swimming, and jungle excursions nearby. The Riviera Maya offers world-class diving. Mayan ruins like Tulum are easily accessible.",
        "nature": "Stunning Caribbean beaches and crystal-clear cenotes are the main attractions. The underwater cave systems are world-famous for diving. Day trips to Mayan ruins add cultural depth to nature experiences.",
        "safety": "Tourist areas are well-patrolled and generally safe. Exercise normal precautions especially at night. The local economy depends on tourism so visitor safety is prioritized.",
        "food": "Excellent Mexican cuisine with fresh seafood being a highlight. International options abound on Fifth Avenue. Local taquerias offer authentic flavors at low prices.",
        "community": "Large and established digital nomad community with regular meetups. The beach lifestyle attracts remote workers year-round. Many coworking spaces cater specifically to nomads.",
        "english": "English is widely spoken in tourist areas. Many businesses operate bilingually. Spanish helps in local neighborhoods but isn't essential.",
        "visa": "Mexico offers 180-day tourist visas making it easy for extended stays. Visa runs aren't necessary for most visitors. The FMM permit is straightforward to obtain.",
        "culture": "A blend of Mayan heritage, Mexican traditions, and international beach culture. The town has grown rapidly but retains some charm. Nearby archaeological sites offer cultural depth.",
        "cleanliness": "Main tourist areas are well-maintained and cleaned regularly. Beach cleanliness is prioritized. Some development has outpaced infrastructure.",
        "airquality": "Excellent air quality with Caribbean breezes keeping the air fresh. The coastal location ensures good ventilation. Occasional sargassum seaweed affects beach areas seasonally."
    },
    "phuket": {
        "climate": "Phuket has a tropical climate with a wet season (May-October) and dry season (November-April). Temperatures stay warm year-round at 25-33°C. The dry season offers the best beach weather.",
        "cost": "Thailand's most expensive destination but still affordable by Western standards. Comfortable living costs $1000-1500/month. Luxury options are available at reasonable prices.",
        "wifi": "Internet infrastructure is good with speeds of 30-60 Mbps in most areas. Cafés and coworking spaces offer reliable connections. Resort areas have invested in good connectivity.",
        "nightlife": "Patong Beach offers infamous party scenes while other areas are more relaxed. Beach clubs and rooftop bars provide varied options. The nightlife caters to all preferences.",
        "nature": "Beautiful beaches, limestone cliffs, and island-hopping opportunities. Marine national parks offer excellent snorkeling and diving. The natural beauty is the main attraction.",
        "safety": "Generally safe for tourists with petty crime being the main concern. Motorbike accidents are common so drive carefully. Beach safety flags should be observed.",
        "food": "Southern Thai cuisine features fresh seafood and spicy curries. International food is readily available in tourist areas. Beachfront dining is a highlight.",
        "community": "Established expat community with many long-term residents. Digital nomads gather in areas like Chalong and Rawai. Coworking spaces cater to remote workers.",
        "english": "English is widely spoken in tourist areas. Staff at hotels and restaurants generally speak English. Basic Thai helps in local markets.",
        "visa": "Standard Thai visa rules apply with 30-60 day entries depending on nationality. Visa runs are easy to nearby countries. Long-term visa options are limited.",
        "culture": "Thai Buddhist culture blended with beach resort development. Beautiful temples provide cultural contrast to beach life. The Old Town in Phuket City has Sino-Portuguese charm.",
        "cleanliness": "Tourist beaches are cleaned regularly. Resort areas maintain high standards. Some development has environmental impacts.",
        "airquality": "Generally excellent air quality due to coastal breezes. The monsoon season keeps the air clean. Occasional smoke from regional agricultural burning affects visibility."
    },
    "ubud": {
        "climate": "Ubud has a tropical climate with distinct wet (November-March) and dry (April-October) seasons. Temperatures are slightly cooler than coastal Bali due to elevation. Morning mist adds to the mystical atmosphere.",
        "cost": "Very affordable with beautiful villas for $400-700/month and meals for $3-6. Yoga classes and wellness activities are reasonably priced. The cost of living attracts long-term visitors.",
        "wifi": "Internet has improved significantly with speeds of 20-40 Mbps available. Many cafés cater to laptop workers. Some remote areas still have connectivity challenges.",
        "nightlife": "Ubud is not a party destination but has cozy bars and live music venues. Ecstatic dance and sound healing replace nightclubs. The pace slows down after sunset.",
        "nature": "Stunning rice terraces, jungle walks, and sacred monkey forest define the landscape. Waterfalls and rivers provide swimming spots. The natural beauty is Ubud's essence.",
        "safety": "Very safe with low crime rates. Watch for monkeys stealing belongings in the forest. Motorbike travel requires caution on narrow roads.",
        "food": "Health-conscious cafés serve smoothie bowls, vegan options, and organic fare. Traditional Balinese cuisine is available at warungs. The food scene caters to wellness seekers.",
        "community": "Major digital nomad hub with a strong wellness and creative community. Coworking spaces like Outpost and Hubud are institutions. The community is supportive and active.",
        "english": "English is widely spoken due to heavy tourism. Menus and signage are typically bilingual. Basic Indonesian is appreciated but not essential.",
        "visa": "Standard Indonesian visa rules with 30-day visa-free or 60-day visa on arrival options. Visa extensions are possible. The B211A visa offers longer stays.",
        "culture": "Balinese Hindu culture permeates daily life with offerings, ceremonies, and temple visits. The arts scene thrives with traditional and contemporary work. Spirituality attracts many visitors.",
        "cleanliness": "Central Ubud is well-maintained for tourists. Plastic waste is a growing concern. Many businesses are adopting eco-friendly practices.",
        "airquality": "Generally good air quality with fresh mountain breezes. Occasional smoke from rice field burning. The lush vegetation helps purify the air."
    },
    "canggu": {
        "climate": "Canggu has tropical weather similar to the rest of Bali with wet and dry seasons. Temperatures are consistently warm at 26-32°C. The beach breeze provides relief from humidity.",
        "cost": "Prices have risen with popularity but remain affordable at $800-1200/month for a good lifestyle. Trendy cafés charge more than local warungs. Long-term villa rentals offer value.",
        "wifi": "Excellent internet infrastructure due to nomad demand with speeds of 30-60 Mbps. Cafés compete on wifi quality. Home connections are reliable in developed areas.",
        "nightlife": "Beach clubs like Finn's, La Brisa, and The Lawn define the scene. Sunset sessions transition into night parties. The vibe is laid-back but social.",
        "nature": "Black sand beaches, rice paddies, and epic surfing define Canggu. Sunset at Echo Beach is a daily ritual. The landscape is flat and easy to explore by scooter.",
        "safety": "Safe for tourists with petty theft being the main concern. Surf conditions can be dangerous for beginners. Traffic on the main roads requires attention.",
        "food": "Trendy brunch spots, smoothie bowls, and international cuisine dominate. Local warungs offer cheap authentic food. The café scene rivals any global city.",
        "community": "The epicenter of Bali's digital nomad scene with a young, social crowd. Coworking spaces are social hubs. The community is very active with events and meetups.",
        "english": "English is the primary language in cafés and businesses. The nomad-heavy population means English dominates. Basic Indonesian is appreciated.",
        "visa": "Same Indonesian visa rules apply. Many nomads use visa agents for extensions. The area is popular for visa-run trips to nearby countries.",
        "culture": "Traditional Balinese culture meets international surf and digital nomad culture. Temples sit alongside beach clubs. The blend can feel jarring but somehow works.",
        "cleanliness": "Tourist areas are maintained but rapid development strains infrastructure. Beach cleanups are community efforts. Some areas show the impact of overtourism.",
        "airquality": "Good air quality with ocean breezes. Traffic on main roads can affect air in busy periods. The open landscape helps with air circulation."
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

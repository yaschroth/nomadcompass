#!/usr/bin/env python3
"""
Generate city detail pages for all cities in cities-data.js
Based on the Hanoi template structure
"""

import re
import os
import json

# City-specific data for generating content
CITY_CONTENT = {
    "lisbon": {
        "hero_image": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1600&h=900&fit=crop",
        "hero_alt": "Lisbon's colorful Alfama district with traditional tiled buildings and tram",
        "monthly_budget": "€1,800",
        "wifi_speed": "100 Mbps",
        "nomad_count": "5,000+",
        "score_title": "A Top-Tier Nomad Destination",
        "score_description": "Lisbon scores highly across most categories, excelling in climate, safety, community, and English accessibility. The main trade-off is cost—Lisbon has become more expensive in recent years, though it's still reasonable by Western European standards.",
        "categories": {
            "climate": "Lisbon enjoys 300+ sunny days per year with mild winters. Summers are warm but not too hot thanks to Atlantic breezes.",
            "cost": "Once a budget destination, Lisbon has become pricier. Expect €1,500-2,000/month for a comfortable nomad lifestyle.",
            "wifi": "Excellent infrastructure with fast fiber widely available. Most cafes and coworking spaces offer 100+ Mbps.",
            "nightlife": "Vibrant scene from Bairro Alto's bars to LX Factory events. Something for every taste, from fado to techno.",
            "nature": "Easy access to beaches (30 min to Costa da Caparica) and Sintra's forests. The Tagus River adds to the natural beauty.",
            "safety": "One of Europe's safest capitals. Petty theft can occur in tourist areas, but violent crime is rare.",
            "food": "From pastéis de nata to fresh seafood, Lisbon's food scene is exceptional. Great value at local tascas.",
            "community": "One of Europe's biggest nomad hubs. Regular meetups, coworking events, and a welcoming expat community.",
            "english": "Widely spoken, especially among younger Portuguese. You can easily get by without Portuguese.",
            "visa": "EU citizens have no restrictions. Non-EU can use the D7 visa or new Digital Nomad Visa for longer stays."
        },
        "stays": [
            {"type": "Coliving Space", "name": "Selina Secret Garden", "price": "From €850/month • Private room", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Boutique Hotel", "name": "Alfama Boutique Hotel", "price": "From €120/night • Breakfast included", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"},
            {"type": "Apartment", "name": "LX Factory Loft", "price": "From €1,400/month • Entire place", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Second Home Lisboa", "day": "€25", "month": "€350", "wifi": "500 Mbps"},
            {"name": "Heden Cowork", "day": "€18", "month": "€250", "wifi": "200 Mbps"},
            {"name": "Outsite Lisbon", "day": "€30", "month": "€400", "wifi": "300 Mbps"}
        ],
        "food": [
            {"name": "Time Out Market", "type": "Food Hall", "description": "Lisbon's famous food market with dozens of stalls from top local chefs. Great for sampling Portuguese cuisine."},
            {"name": "Cervejaria Ramiro", "type": "Seafood Restaurant", "description": "Legendary seafood spot known for fresh prawns and clams. Worth the wait for an authentic Lisbon experience."},
            {"name": "Pensão Amor", "type": "Bar & Lounge", "description": "Quirky bar in a former brothel. Great cocktails and a unique atmosphere in the Cais do Sodré neighborhood."}
        ]
    },
    "hanoi": {
        "hero_image": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1600&h=900&fit=crop",
        "hero_alt": "Hanoi Old Quarter at night with lanterns and motorbikes",
        "monthly_budget": "$800",
        "wifi_speed": "50 Mbps",
        "nomad_count": "2,500+",
        "score_title": "A Budget Nomad's Paradise",
        "score_description": "Hanoi delivers exceptional value with world-class street food and incredibly low living costs. The trade-offs are language barriers and humid summers, but the rich culture and growing nomad community make it a compelling choice for adventurous remote workers.",
        "categories": {
            "climate": "Hot, humid summers (35°C+) and mild winters. The best months are October-December and March-April. Monsoon season brings heavy rains from May-September.",
            "cost": "One of the most affordable cities in Asia. A comfortable nomad lifestyle costs $600-900/month including rent, food, and entertainment. Street food meals from $1.",
            "wifi": "Generally reliable with 30-50 Mbps in cafes and coworking spaces. Most apartments come with fiber internet. The Coffee House chain is popular for reliable connections.",
            "nightlife": "The Old Quarter comes alive after dark with bia hoi (fresh beer) corners and rooftop bars. Ta Hien 'Beer Street' is legendary. Quieter scene than Ho Chi Minh City.",
            "nature": "City parks around West Lake and Hoan Kiem Lake offer green escapes. Day trips to Ha Long Bay, Ninh Binh, and Sapa provide stunning natural landscapes.",
            "safety": "Very safe for a Southeast Asian capital. Petty theft and traffic are the main concerns. Violent crime is rare. Solo travelers report feeling comfortable.",
            "food": "World-class street food culture. Pho, bun cha, banh mi, and egg coffee are must-tries. Food is incredibly cheap and consistently delicious at local spots.",
            "community": "Growing nomad scene centered around West Lake (Tay Ho). Regular meetups, Facebook groups, and a welcoming expat community. Not as established as Bangkok or Bali.",
            "english": "Limited outside tourist areas and younger Vietnamese. Learning basic Vietnamese helps significantly. Google Translate is your friend for daily interactions.",
            "visa": "90-day e-visa available for most nationalities ($25). Easy border runs to neighboring countries. Digital nomad visa not yet available but the e-visa is straightforward."
        },
        "stays": [
            {"type": "Serviced Apartment", "name": "Tay Ho (West Lake)", "price": "From $400/month • Popular with expats", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Boutique Hotel", "name": "Old Quarter Stay", "price": "From $25/night • Central location", "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=200&fit=crop"},
            {"type": "Long-term Rental", "name": "Ba Dinh District", "price": "From $350/month • Quiet & residential", "image": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Toong Coworking", "day": "$8", "month": "$120", "wifi": "100 Mbps"},
            {"name": "The Coffee House", "day": "Free", "month": "$2/coffee", "wifi": "30 Mbps"},
            {"name": "Dreamplex", "day": "$10", "month": "$150", "wifi": "200 Mbps"}
        ],
        "food": [
            {"name": "Pho 10 Ly Quoc Su", "type": "Street Food Legend", "description": "The definitive Hanoi pho experience. Rich beef broth, fresh herbs, and perfectly chewy noodles for under $2. Arrive before 8am to beat the crowds."},
            {"name": "Bun Cha Huong Lien", "type": "The Obama Spot", "description": "Famous after Obama's visit, but genuinely excellent. Grilled pork patties with rice noodles and dipping broth. Still only $3 per serving."},
            {"name": "Giang Cafe", "type": "Egg Coffee Original", "description": "The birthplace of ca phe trung (egg coffee). Creamy, sweet, and utterly unique. Hidden down an alley in the Old Quarter since 1946."}
        ]
    },
    "medellin": {
        "hero_image": "https://images.unsplash.com/photo-1622561431836-7a71e9371e09?w=1600&h=900&fit=crop",
        "hero_alt": "Medellín cityscape with mountains and metro cable cars",
        "monthly_budget": "$1,200",
        "wifi_speed": "50 Mbps",
        "nomad_count": "8,000+",
        "score_title": "The City of Eternal Spring",
        "score_description": "Medellín offers perfect year-round weather, a massive nomad community, and excellent value. The main concerns are safety in certain areas and limited English, but the city's transformation and warmth of its people make it a top nomad destination.",
        "categories": {
            "climate": "Perfect 22-28°C year-round thanks to its valley location at 1,500m altitude. No need for AC or heating. Light rain possible any time but rarely all day.",
            "cost": "Excellent value with $1,000-1,500/month covering a nice apartment in El Poblado, food, and entertainment. Ubers are cheap, meals from $3-5.",
            "wifi": "Generally good at 30-80 Mbps in apartments and coworking spaces. Fiber is increasingly common. Some cafes have slower connections.",
            "nightlife": "Legendary party scene in El Poblado and Laureles. Salsa clubs, rooftop bars, and clubs that go until sunrise. Parque Lleras is the epicenter.",
            "nature": "Surrounded by mountains with easy access to hiking, paragliding, and day trips to Guatapé. City parks and botanical gardens provide urban green space.",
            "safety": "Much improved but still requires street smarts. Stick to known areas, use Uber at night, and be aware of your surroundings. Most nomads feel safe.",
            "food": "Great variety from street food to international cuisine. Try bandeja paisa, arepas, and empanadas. El Poblado has excellent restaurants at reasonable prices.",
            "community": "One of the largest nomad communities in the Americas. Weekly meetups, Facebook groups, and coworking spaces full of remote workers. Very easy to make friends.",
            "english": "Limited outside tourist areas. Spanish helps enormously for daily life. Many nomads take Spanish classes here. Younger Colombians often speak some English.",
            "visa": "180 days visa-free for most nationalities. Easy to extend or do a border run. Colombia also offers a digital nomad visa for longer stays."
        },
        "stays": [
            {"type": "Apartment", "name": "El Poblado Studio", "price": "From $800/month • Prime location", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Selina Medellín", "price": "From $600/month • Community vibes", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Laureles Boutique", "price": "From $45/night • Local neighborhood", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Selina Cowork", "day": "$15", "month": "$180", "wifi": "100 Mbps"},
            {"name": "Tinkko", "day": "$12", "month": "$150", "wifi": "80 Mbps"},
            {"name": "WeWork Medellín", "day": "$25", "month": "$300", "wifi": "200 Mbps"}
        ],
        "food": [
            {"name": "Mondongos", "type": "Traditional Colombian", "description": "Famous for its hearty tripe soup and massive bandeja paisa. A true local institution since 1979. Come hungry."},
            {"name": "El Cielo", "type": "Fine Dining", "description": "Michelin-recognized Colombian cuisine reimagined. Multi-course tasting menu with theatrical presentation. Worth the splurge."},
            {"name": "Pergamino Café", "type": "Specialty Coffee", "description": "Some of the best coffee in the coffee capital. Third-wave roasting with beans from local farms. Great for working."}
        ]
    },
    "chiangmai": {
        "hero_image": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&h=900&fit=crop",
        "hero_alt": "Chiang Mai temple with golden spires and mountain backdrop",
        "monthly_budget": "$1,000",
        "wifi_speed": "60 Mbps",
        "nomad_count": "10,000+",
        "score_title": "The Original Nomad Hub",
        "score_description": "Chiang Mai pioneered the digital nomad movement and remains one of the best places to work remotely. Incredible food, low costs, and the largest nomad community in Asia. The only downsides are burning season smoke (Feb-Apr) and visa complexity.",
        "categories": {
            "climate": "Hot season (Mar-May) can hit 40°C. Rainy season (Jun-Oct) brings afternoon showers. Cool season (Nov-Feb) is perfect at 20-30°C. Burning season smoke is a real issue.",
            "cost": "One of the best value destinations on Earth. $800-1,200/month covers a nice condo, unlimited Thai food, coworking, and entertainment. Massages from $5.",
            "wifi": "Excellent infrastructure with 50-100 Mbps common in apartments and cafes. Maya Mall has reliable fallback options. Thailand has great 4G/5G too.",
            "nightlife": "More chill than Bangkok but still fun. Nimmanhaemin has trendy bars and clubs. Night Bazaar area has live music. Sunday Walking Street is a weekly highlight.",
            "nature": "Surrounded by mountains and national parks. Doi Suthep temple, elephant sanctuaries, and waterfalls within easy reach. Great for weekend adventures.",
            "safety": "Very safe city with low crime. Main concerns are motorbike accidents and the occasional scam. Solo travelers of all genders feel comfortable here.",
            "food": "World-class Thai food everywhere. Khao soi is the must-try local dish. Night markets, street food, and trendy cafes. Possibly the best food-to-cost ratio anywhere.",
            "community": "The OG nomad hub with the most established community. Daily meetups, Punspace and other coworking hubs, and thousands of remote workers. Incredibly easy to connect.",
            "english": "Better than most of Thailand thanks to tourism and nomads. Younger Thais often speak good English. Menus usually have English translations.",
            "visa": "60-day visa-free for most, extendable to 90 days. Visa runs to Laos are common. Thailand Elite visa available for long-term stays. New DTV visa launched 2024."
        },
        "stays": [
            {"type": "Condo", "name": "Nimman Area Studio", "price": "From $400/month • Walk to everything", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Hub53 Coliving", "price": "From $500/month • Community focused", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Old City Guesthouse", "price": "From $20/night • Temple views", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Punspace Nimman", "day": "$8", "month": "$100", "wifi": "100 Mbps"},
            {"name": "CAMP at Maya", "day": "Free", "month": "Free w/ purchase", "wifi": "50 Mbps"},
            {"name": "Yellow Coworking", "day": "$6", "month": "$80", "wifi": "80 Mbps"}
        ],
        "food": [
            {"name": "Khao Soi Mae Sai", "type": "Northern Thai", "description": "The city's signature dish done perfectly. Creamy coconut curry with egg noodles and tender chicken. Under $2 for a life-changing bowl."},
            {"name": "Ristr8to", "type": "Specialty Coffee", "description": "World Latte Art Champion's cafe. Exceptional coffee in a stylish space. Perfect for a work session with great WiFi."},
            {"name": "SP Chicken", "type": "Street Food", "description": "Legendary grilled chicken that's been perfecting the recipe for decades. Smoky, juicy, and served with sticky rice. Always packed with locals."}
        ]
    },
    "bali": {
        "hero_image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=900&fit=crop",
        "hero_alt": "Bali rice terraces with palm trees and misty mountains",
        "monthly_budget": "$1,500",
        "wifi_speed": "50 Mbps",
        "nomad_count": "15,000+",
        "score_title": "The Instagram Nomad Paradise",
        "score_description": "Bali (especially Canggu) has become the world's most famous digital nomad destination. Surf, yoga, incredible cafes, and a huge community. The downsides are increasing costs, visa hassles, and over-tourism in hot spots.",
        "categories": {
            "climate": "Tropical year-round at 27-30°C. Dry season (Apr-Oct) is ideal. Wet season (Nov-Mar) brings afternoon downpours but is still workable. Humidity is always high.",
            "cost": "More expensive than mainland Southeast Asia. Budget $1,200-2,000/month for Canggu lifestyle. Villas from $500/month, smoothie bowls $6, scooter rental $50/month.",
            "wifi": "Improving but inconsistent. Many cafes offer 30-50 Mbps. Newer coworking spaces have 100+ Mbps. Always have a backup plan (Starlink is increasingly common).",
            "nightlife": "Canggu has beach clubs and bars. Seminyak is more upscale. Ubud is quiet. Full moon parties and sunset sessions are the vibe. Old Man's is the classic nomad hangout.",
            "nature": "Stunning rice terraces, beaches, volcanoes, and waterfalls. Surf breaks for all levels. Diving and snorkeling on nearby islands. The nature is why people come.",
            "safety": "Generally safe but petty theft occurs. Motorbike accidents are the biggest risk. Watch for scams in tourist areas. Monkeys will steal your stuff at temples.",
            "food": "Amazing cafe culture with healthy bowls, smoothies, and international options. Local warungs serve cheap Indonesian food. Seafood BBQ on Jimbaran beach is a must.",
            "community": "Massive, sometimes overwhelming nomad community. Endless events, meetups, and networking. Easy to make friends but can feel like a bubble. Very entrepreneurial crowd.",
            "english": "Widely spoken in tourist areas. Most locals in Canggu/Ubud speak good English. Further from tourist spots, Indonesian helps.",
            "visa": "30-day visa-free, extendable to 60 days. B211 visa for 6 months requires an agent. Indonesia launched a Digital Nomad Visa but rules keep changing."
        },
        "stays": [
            {"type": "Villa", "name": "Canggu Private Villa", "price": "From $600/month • Pool included", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Outpost Canggu", "price": "From $900/month • All inclusive", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Guesthouse", "name": "Ubud Homestay", "price": "From $25/night • Rice field views", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Dojo Bali", "day": "$15", "month": "$180", "wifi": "100 Mbps"},
            {"name": "Outpost Cowork", "day": "$20", "month": "$250", "wifi": "150 Mbps"},
            {"name": "Hubud (Ubud)", "day": "$18", "month": "$200", "wifi": "80 Mbps"}
        ],
        "food": [
            {"name": "Warung Dandelion", "type": "Healthy Cafe", "description": "The original Canggu health cafe. Smoothie bowls, organic salads, and great coffee. Popular nomad working spot with reliable WiFi."},
            {"name": "Naughty Nuri's", "type": "BBQ & Ribs", "description": "Legendary pork ribs and strong martinis. A Bali institution since Ubud days. Messy, delicious, and always packed."},
            {"name": "La Brisa", "type": "Beach Club", "description": "Stunning beachfront made of reclaimed wood. Great food, cocktails, and sunset views. The most Instagrammed spot in Canggu."}
        ]
    },
    "mexicocity": {
        "hero_image": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1600&h=900&fit=crop",
        "hero_alt": "Mexico City Palacio de Bellas Artes and city skyline",
        "monthly_budget": "$1,500",
        "wifi_speed": "80 Mbps",
        "nomad_count": "20,000+",
        "score_title": "The Megacity That Has It All",
        "score_description": "Mexico City delivers world-class food, art, and culture at excellent value. The nomad community has exploded, making it easy to connect. Safety concerns exist but are manageable with street smarts. The altitude takes adjustment.",
        "categories": {
            "climate": "Eternal spring at 2,240m altitude. Days are warm (20-25°C), nights are cool. Rainy season (Jun-Oct) brings afternoon showers. Dry season is sunny and perfect.",
            "cost": "Great value for a world capital. $1,200-2,000/month covers Roma/Condesa apartment, eating out daily, and entertainment. Tacos from $1, Uber is cheap.",
            "wifi": "Excellent infrastructure with 50-100+ Mbps common. Most cafes have good connections. Coworking spaces are reliable. Mexico has invested heavily in internet.",
            "nightlife": "Legendary and varied. Mezcal bars, rooftop lounges, underground clubs, live music venues. Roma, Condesa, and Juárez are the main areas. Goes late.",
            "nature": "Urban jungle with beautiful parks like Chapultepec (one of the world's largest). Day trips to pyramids, volcanoes, and pueblos mágicos. Not a nature destination per se.",
            "safety": "Requires awareness but most neighborhoods are fine. Stick to Roma, Condesa, Polanco, Coyoacán. Use Uber at night. Petty crime exists but violence against tourists is rare.",
            "food": "One of the world's great food cities. From street tacos to fine dining, it's exceptional. Must-try: al pastor, tlacoyos, and churros. Food markets are incredible.",
            "community": "Exploded post-pandemic to become one of the largest nomad hubs. Tons of meetups, coworking spaces, and networking events. Very entrepreneurial and creative crowd.",
            "english": "More common than you'd expect in nomad areas. Younger Mexicans often speak English. Spanish helps a lot for daily life and is worth learning.",
            "visa": "180 days visa-free for most nationalities. Very easy—just show up. Overstaying is penalized. Some nomads do border runs, others apply for temporary residence."
        },
        "stays": [
            {"type": "Apartment", "name": "Roma Norte Flat", "price": "From $900/month • Trendy location", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Selina CDMX", "price": "From $700/month • Social atmosphere", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Condesa Boutique", "price": "From $60/night • Art Deco charm", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Selina Cowork", "day": "$15", "month": "$180", "wifi": "100 Mbps"},
            {"name": "WeWork Roma", "day": "$30", "month": "$350", "wifi": "200 Mbps"},
            {"name": "Homework", "day": "$12", "month": "$150", "wifi": "80 Mbps"}
        ],
        "food": [
            {"name": "El Vilsito", "type": "Tacos al Pastor", "description": "Night-only taco stand that's a pilgrimage site. Watch the trompo spin, get your tacos with pineapple. Open midnight to 4am. Life-changing."},
            {"name": "Pujol", "type": "Fine Dining", "description": "One of the world's best restaurants. Modern Mexican tasting menu with the famous mole that's been aging for years. Book weeks ahead."},
            {"name": "Café de Tacuba", "type": "Traditional Mexican", "description": "Operating since 1912 in a stunning colonial building. Classic Mexican dishes in an elegant setting. Don't miss the hot chocolate."}
        ]
    },
    "budapest": {
        "hero_image": "https://images.unsplash.com/photo-1541343672885-9be56236302a?w=1600&h=900&fit=crop",
        "hero_alt": "Budapest Parliament building along the Danube at dusk",
        "monthly_budget": "€1,200",
        "wifi_speed": "100 Mbps",
        "nomad_count": "6,000+",
        "score_title": "Central Europe's Hidden Gem",
        "score_description": "Budapest offers an incredible lifestyle at Eastern European prices. Thermal baths, ruin bars, and stunning architecture make it a joy to explore. The nomad community is established and welcoming. Winters are cold but manageable.",
        "categories": {
            "climate": "Four distinct seasons. Summers are warm (25-35°C), winters are cold (0 to -5°C) with occasional snow. Spring and autumn are ideal for exploring. Indoor life is cozy in winter.",
            "cost": "Great value for Europe. €1,000-1,500/month covers a central apartment, eating out, and entertainment. Local meals from €5, beers from €2.",
            "wifi": "Excellent infrastructure with 100+ Mbps standard in apartments. Cafes and coworking spaces are reliable. Hungary has invested in digital infrastructure.",
            "nightlife": "Legendary ruin bars in the Jewish Quarter. Szimpla Kert started the trend. Clubs, live music, and rooftop bars. The party scene goes until sunrise.",
            "nature": "City parks and the Danube provide urban nature. Margaret Island is a green oasis. Day trips to the Danube Bend, Lake Balaton, and hills around the city.",
            "safety": "Very safe with low crime. Pickpockets exist in tourist areas. No-go zones are minimal. Solo travelers feel comfortable day and night.",
            "food": "Hearty Hungarian cuisine—goulash, langos, chimney cake. Growing international food scene. Jewish Quarter has excellent restaurants. Great wine culture.",
            "community": "Established nomad scene with regular meetups. Loffice and other coworking spaces host events. Welcoming to newcomers. Good mix of nationalities.",
            "english": "Widely spoken by younger Hungarians. Older generation less so. You can get by with English in the city center. Hungarian is notoriously difficult.",
            "visa": "EU citizens have no restrictions. Non-EU get 90 days in the Schengen Area. Hungary offers a White Card residence permit for some nationalities."
        },
        "stays": [
            {"type": "Apartment", "name": "District VII Flat", "price": "From €600/month • Ruin bar district", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Coliving Budapest", "price": "From €500/month • Community living", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Buda Castle Hotel", "price": "From €70/night • Historic setting", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Loffice Budapest", "day": "€15", "month": "€180", "wifi": "150 Mbps"},
            {"name": "Kaptar", "day": "€12", "month": "€150", "wifi": "100 Mbps"},
            {"name": "Impact Hub", "day": "€20", "month": "€220", "wifi": "200 Mbps"}
        ],
        "food": [
            {"name": "Bors GasztroBar", "type": "Soup & Sandwiches", "description": "Tiny joint famous for creative soups and overstuffed sandwiches. Try the bread bowl. Always a queue but worth it. Cash only."},
            {"name": "Szimpla Kert", "type": "Ruin Bar & Market", "description": "The original ruin bar and Sunday farmers market. Get breakfast, browse local produce, and soak in the atmosphere."},
            {"name": "New York Café", "type": "Historic Café", "description": "The most beautiful café in the world. Stunning interior, good coffee, worth one visit for the architecture alone. Touristy but iconic."}
        ]
    },
    "tbilisi": {
        "hero_image": "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1600&h=900&fit=crop",
        "hero_alt": "Tbilisi old town with colorful balconies and Narikala Fortress",
        "monthly_budget": "$800",
        "wifi_speed": "50 Mbps",
        "nomad_count": "4,000+",
        "score_title": "The 365-Day Visa Paradise",
        "score_description": "Tbilisi offers incredible value, fascinating culture, and the easiest visa situation in the world—365 days visa-free for 95+ countries. The wine, food, and hospitality are legendary. Growing nomad community in a unique destination.",
        "categories": {
            "climate": "Four seasons with hot summers (35°C+) and cold winters (around 0°C). Spring and autumn are ideal. The city is in a valley so summers can feel intense.",
            "cost": "Remarkably affordable. $600-1,000/month covers everything comfortably. Khinkali dumplings from $2, wine is incredibly cheap, rent from $300/month.",
            "wifi": "Generally good at 30-70 Mbps in apartments. Improving rapidly. Some cafes have slower connections. Fabrika and other coworking spaces are reliable.",
            "nightlife": "Underground techno scene at venues like Bassiani (one of the world's best clubs). Wine bars, rooftop terraces, and chacha (grape brandy) everywhere.",
            "nature": "Dramatic mountains within a few hours. Kazbegi, Svaneti, and wine regions are stunning. Urban nature is limited but the nearby Caucasus compensates.",
            "safety": "Very safe city with low crime. Georgians are incredibly hospitable. Solo travelers feel comfortable. Political protests occasionally occur.",
            "food": "Incredible Georgian cuisine—khinkali, khachapuri, mtsvadi, pkhali. Natural wine scene is world-class. Hospitality culture means huge portions and generous hosts.",
            "community": "Growing rapidly since the pandemic. Fabrika is the hub. Regular meetups and events. Smaller but very welcoming community. Many entrepreneurs and creatives.",
            "english": "Limited among older Georgians. Younger generation speaks more. Russian is widely understood. Learning a few Georgian phrases goes a long way.",
            "visa": "365 days visa-free for 95+ nationalities. Just show up. Possibly the best visa situation in the world for nomads. Easy to stay long-term."
        },
        "stays": [
            {"type": "Apartment", "name": "Old Tbilisi Flat", "price": "From $300/month • Historic center", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Fabrika Hostel", "price": "From $250/month • Creative hub", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Rooms Hotel", "price": "From $80/night • Design hotel", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Fabrika", "day": "$8", "month": "$100", "wifi": "80 Mbps"},
            {"name": "Impact Hub Tbilisi", "day": "$12", "month": "$140", "wifi": "100 Mbps"},
            {"name": "Terminal", "day": "$10", "month": "$120", "wifi": "60 Mbps"}
        ],
        "food": [
            {"name": "Shavi Lomi", "type": "Modern Georgian", "description": "Creative Georgian cuisine in a cozy setting. Farm-to-table ingredients with traditional recipes updated. Excellent natural wine list."},
            {"name": "Pasanauri", "type": "Traditional", "description": "No-frills khinkali specialist. Watch them make the dumplings fresh. Order by the dozen and eat with your hands. Incredibly cheap."},
            {"name": "Cafe Stamba", "type": "Coffee & Brunch", "description": "Soviet-era printing house turned design hotel cafe. Great coffee, beautiful space, and reliable WiFi for working. Popular nomad spot."}
        ]
    },
    "barcelona": {
        "hero_image": "https://images.unsplash.com/photo-1583422409516-2f0e82ef7fc7?w=1600&h=900&fit=crop",
        "hero_alt": "Barcelona cityscape with Sagrada Familia and Mediterranean Sea",
        "monthly_budget": "€2,000",
        "wifi_speed": "100 Mbps",
        "nomad_count": "12,000+",
        "score_title": "Mediterranean Beach City Life",
        "score_description": "Barcelona offers the dream combination of beach, city, and culture. Gaudí architecture, world-class food, and vibrant nightlife. It's gotten expensive but the lifestyle is worth it. Large international community and excellent infrastructure.",
        "categories": {
            "climate": "Mediterranean perfection. Mild winters (10-15°C), warm summers (25-30°C). 300+ sunny days. Beach weather from May-October. Sea breeze keeps summers pleasant.",
            "cost": "No longer cheap. €1,800-2,500/month for a good lifestyle. Rent has skyrocketed. Still cheaper than London or Paris. Great value for wine and tapas.",
            "wifi": "Excellent throughout the city. 100+ Mbps standard. Spain has good digital infrastructure. Coworking spaces and cafes are reliable.",
            "nightlife": "Legendary scene from Gothic Quarter bars to beachfront clubs. Goes very late—dinner at 10pm, clubs at 2am. Something for every taste and budget.",
            "nature": "Beach in the city, plus mountains (Montjuïc, Tibidabo). Day trips to Costa Brava, Montserrat, and Pyrenees. Perfect balance of urban and outdoor.",
            "safety": "Watch for pickpockets on La Rambla and in crowds. Otherwise very safe. Violent crime is rare. Solo travelers feel comfortable.",
            "food": "Catalan cuisine plus every world food. Fresh seafood, incredible markets (La Boqueria), creative tapas. Food scene rivals any European capital.",
            "community": "Huge international community. Tons of nomads, entrepreneurs, and creatives. Regular meetups and events. Very easy to build a social circle.",
            "english": "Widely spoken in tourist/business areas. Catalans prefer Catalan, then Spanish, then English. You can get by with English but Spanish helps.",
            "visa": "EU citizens have no restrictions. Non-EU get 90 days Schengen. Spain offers a digital nomad visa (2023) for longer stays."
        },
        "stays": [
            {"type": "Apartment", "name": "Eixample Flat", "price": "From €1,200/month • Central location", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Cloudworks Living", "price": "From €900/month • All inclusive", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Gothic Quarter Hotel", "price": "From €100/night • Historic center", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Cloudworks", "day": "€25", "month": "€280", "wifi": "200 Mbps"},
            {"name": "MOB Barcelona", "day": "€20", "month": "€220", "wifi": "150 Mbps"},
            {"name": "Aticco", "day": "€22", "month": "€250", "wifi": "100 Mbps"}
        ],
        "food": [
            {"name": "La Boqueria", "type": "Food Market", "description": "The world's most famous food market. Fresh seafood, jamón, fruit, and tapas bars inside. Go early to avoid tourist crowds. Essential Barcelona experience."},
            {"name": "Can Paixano", "type": "Cava Bar", "description": "Standing-room-only cava bar with delicious sandwiches. Chaotic, cheap, and utterly authentic. Cash only. The local experience."},
            {"name": "Tickets", "type": "Tapas", "description": "Ferran Adrià's creative tapas spot. Whimsical dishes and theatrical presentation. Book well in advance. Worth the splurge."}
        ]
    },
    "berlin": {
        "hero_image": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1600&h=900&fit=crop",
        "hero_alt": "Berlin TV Tower and cityscape at sunset",
        "monthly_budget": "€1,800",
        "wifi_speed": "100 Mbps",
        "nomad_count": "15,000+",
        "score_title": "Europe's Creative Capital",
        "score_description": "Berlin offers unmatched creative freedom, legendary nightlife, and a massive international community. It's the startup capital of Europe with excellent infrastructure. The weather is gray but the culture compensates. Finding apartments is notoriously difficult.",
        "categories": {
            "climate": "Continental with cold, gray winters (-2 to 5°C) and warm summers (20-30°C). Lots of overcast days. Summers are magical with late sunsets. Winters require vitamin D.",
            "cost": "Still affordable by Western European standards but rising fast. €1,500-2,200/month. Finding an apartment is the hard part. Once settled, living costs are reasonable.",
            "wifi": "Excellent infrastructure. Apartments and coworking spaces have 100+ Mbps. Germany's stereotype of bad internet doesn't apply to Berlin. Cafes are usually reliable.",
            "nightlife": "Legendary techno scene. Berghain is the world's most famous club. Endless bars, clubs, and cultural events. The city never sleeps on weekends.",
            "nature": "Urban green spaces like Tiergarten and Tempelhofer Feld. Lakes within the city for summer swimming. Brandenburg forests for day trips. It's a surprisingly green city.",
            "safety": "Very safe city. Standard urban awareness applies. Some areas are grittier but not dangerous. Solo travelers of all genders feel comfortable.",
            "food": "Incredible international variety reflecting the diverse population. Turkish, Vietnamese, Middle Eastern, and creative fusion. Street food culture is strong.",
            "community": "Huge startup and nomad community. Tons of meetups, events, and networking opportunities. English is widely spoken in professional circles. Very international.",
            "english": "Widely spoken, especially in professional and startup contexts. You can live in Berlin without German. Learning German is appreciated but not essential.",
            "visa": "EU citizens have no restrictions. Non-EU can apply for a freelance visa (Freiberufler) with proof of income. Process takes a few months but is doable."
        },
        "stays": [
            {"type": "Apartment", "name": "Kreuzberg Flat", "price": "From €1,000/month • Vibrant area", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Quarters Coliving", "price": "From €900/month • Furnished", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Mitte Boutique", "price": "From €90/night • Central Berlin", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Factory Berlin", "day": "€30", "month": "€350", "wifi": "200 Mbps"},
            {"name": "Betahaus", "day": "€25", "month": "€280", "wifi": "150 Mbps"},
            {"name": "St. Oberholz", "day": "€15", "month": "€180", "wifi": "100 Mbps"}
        ],
        "food": [
            {"name": "Mustafas Gemüse Kebap", "type": "Döner", "description": "The most famous döner in Berlin. Expect a long queue but it's worth it. Loaded with vegetables and secret sauce. A Berlin institution."},
            {"name": "Markthalle Neun", "type": "Food Hall", "description": "Beautiful historic market hall. Thursday Street Food Thursday is legendary. Great for exploring international cuisines and local products."},
            {"name": "Café Einstein", "type": "Viennese Café", "description": "Classic coffee house culture. Excellent breakfast, good for meetings. Beautiful interior in an old villa. A bit of old-world elegance."}
        ]
    },
    "bangkok": {
        "hero_image": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&h=900&fit=crop",
        "hero_alt": "Bangkok skyline with temples and skyscrapers at sunset",
        "monthly_budget": "$1,200",
        "wifi_speed": "80 Mbps",
        "nomad_count": "12,000+",
        "score_title": "The Gateway to Southeast Asia",
        "score_description": "Bangkok is chaotic, cheap, and endlessly fascinating. Amazing food, legendary nightlife, and a huge nomad community. The heat and traffic take adjustment, but the city rewards those who embrace its intensity.",
        "categories": {
            "climate": "Hot year-round (30-35°C) with high humidity. Hot season (Mar-May) is brutal. Rainy season (Jun-Oct) brings afternoon downpours. 'Cool' season (Nov-Feb) is most pleasant.",
            "cost": "Excellent value. $1,000-1,500/month covers a nice condo, eating out daily, and entertainment. Street food from $1, BTS makes commuting cheap. AC is essential.",
            "wifi": "Great infrastructure with 50-100+ Mbps common. Cafes, malls, and coworking spaces are reliable. Thailand has excellent 4G/5G coverage too.",
            "nightlife": "Legendary and varied. Rooftop bars, clubs, live music, and the infamous nightlife areas. Khao San Road for backpackers, Thonglor for upscale. Goes late.",
            "nature": "Urban jungle with limited green space. Lumpini Park is an oasis. Easy access to beaches (2-3 hours) and islands. The city itself isn't a nature destination.",
            "safety": "Safe for a megacity. Standard scam awareness needed. Traffic is the biggest danger. Solo travelers feel comfortable. Avoid political protests.",
            "food": "World-class street food and restaurants. Thai food is legendary—pad thai, som tam, mango sticky rice. International options everywhere. Food is a major draw.",
            "community": "Large nomad and expat community. Coworking spaces, meetups, and events. Easy to connect with other remote workers. Very international crowd.",
            "english": "Better than most of Thailand in tourist/business areas. Signs are in English. Older Thais speak less. You can get by but Thai phrases help.",
            "visa": "60-day visa-free for most, extendable to 90 days. Visa runs to neighbors are easy. Thailand Elite visa for long-term. New DTV visa launched 2024."
        },
        "stays": [
            {"type": "Condo", "name": "Sukhumvit Studio", "price": "From $500/month • BTS connected", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": "Hubba Hostel", "price": "From $400/month • Community focused", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": "Silom Boutique", "price": "From $40/night • Business district", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": "Hubba Thailand", "day": "$10", "month": "$130", "wifi": "100 Mbps"},
            {"name": "The Hive Thonglor", "day": "$15", "month": "$180", "wifi": "150 Mbps"},
            {"name": "TCDC Commons", "day": "$5", "month": "N/A", "wifi": "80 Mbps"}
        ],
        "food": [
            {"name": "Jay Fai", "type": "Michelin Street Food", "description": "Legendary street food chef with a Michelin star. Famous for crab omelette and drunken noodles. Expensive by Thai standards but worth it. Book ahead."},
            {"name": "Thipsamai", "type": "Pad Thai", "description": "The most famous pad thai in Bangkok since 1966. Queue up for the orange-wrapped version. An essential Bangkok experience."},
            {"name": "Chinatown (Yaowarat)", "type": "Street Food Area", "description": "The best street food concentration in Bangkok. Go after dark when the stalls set up. Seafood, noodles, and endless options."}
        ]
    }
}

# Default content generator for cities without specific content
def generate_default_content(city):
    """Generate default content based on city data"""
    scores = city['scores']
    country = city['country']
    name = city['name']

    # Determine currency based on country
    currency = "$"
    if country in ["Portugal", "Spain", "France", "Germany", "Italy", "Netherlands", "Ireland", "Austria", "Belgium", "Finland", "Greece", "Malta", "Cyprus", "Estonia", "Latvia", "Lithuania", "Slovakia", "Slovenia"]:
        currency = "€"
    elif country in ["UK"]:
        currency = "£"
    elif country in ["Japan"]:
        currency = "¥"
    elif country in ["Thailand", "Indonesia", "Malaysia", "Vietnam", "Philippines", "Cambodia", "Nepal", "India", "Sri Lanka"]:
        currency = "$"
    elif country in ["Switzerland"]:
        currency = "CHF "

    # Calculate monthly budget based on cost score
    cost_score = scores['cost']
    if cost_score >= 9:
        budget = f"{currency}800"
    elif cost_score >= 8:
        budget = f"{currency}1,000"
    elif cost_score >= 7:
        budget = f"{currency}1,200"
    elif cost_score >= 6:
        budget = f"{currency}1,500"
    elif cost_score >= 5:
        budget = f"{currency}1,800"
    elif cost_score >= 4:
        budget = f"{currency}2,200"
    elif cost_score >= 3:
        budget = f"{currency}2,800"
    else:
        budget = f"{currency}3,500"

    # WiFi speed based on score
    wifi_score = scores['wifi']
    if wifi_score >= 9:
        wifi_speed = "150 Mbps"
    elif wifi_score >= 8:
        wifi_speed = "100 Mbps"
    elif wifi_score >= 7:
        wifi_speed = "60 Mbps"
    elif wifi_score >= 6:
        wifi_speed = "40 Mbps"
    else:
        wifi_speed = "25 Mbps"

    # Nomad count based on community score
    community_score = scores['community']
    if community_score >= 10:
        nomad_count = "15,000+"
    elif community_score >= 9:
        nomad_count = "10,000+"
    elif community_score >= 8:
        nomad_count = "6,000+"
    elif community_score >= 7:
        nomad_count = "4,000+"
    elif community_score >= 6:
        nomad_count = "2,500+"
    elif community_score >= 5:
        nomad_count = "1,500+"
    else:
        nomad_count = "500+"

    # Generate score title based on strengths
    top_categories = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
    top_names = [cat[0] for cat in top_categories]

    if 'cost' in top_names and scores['cost'] >= 8:
        score_title = "A Budget-Friendly Destination"
    elif 'community' in top_names and scores['community'] >= 9:
        score_title = "A Thriving Nomad Hub"
    elif 'climate' in top_names and scores['climate'] >= 8:
        score_title = "Sun-Soaked Paradise"
    elif 'nightlife' in top_names and scores['nightlife'] >= 8:
        score_title = "Where the Nightlife Never Stops"
    elif 'food' in top_names and scores['food'] >= 9:
        score_title = "A Culinary Destination"
    elif 'safety' in top_names and scores['safety'] >= 9:
        score_title = "Safe Haven for Remote Workers"
    elif 'nature' in top_names and scores['nature'] >= 9:
        score_title = "Nature Lover's Paradise"
    elif 'wifi' in top_names and scores['wifi'] >= 9:
        score_title = "Digital Infrastructure Excellence"
    else:
        score_title = f"Discover {name}"

    # Generate category descriptions
    categories = {}

    # Climate
    if scores['climate'] >= 8:
        categories['climate'] = f"Excellent weather year-round makes {name} a joy to live in. Expect plenty of sunshine and mild temperatures. Outdoor activities are possible most of the year."
    elif scores['climate'] >= 6:
        categories['climate'] = f"{name} has decent weather with distinct seasons. Summers are warm and pleasant, while winters can be cool. Spring and autumn are often the best times to visit."
    else:
        categories['climate'] = f"The weather in {name} can be challenging with cold winters and variable conditions. Pack layers and be prepared for gray days. Indoor coworking spaces become essential."

    # Cost
    if scores['cost'] >= 8:
        categories['cost'] = f"Incredibly affordable destination. Your money goes far in {name} with low rent, cheap food, and affordable entertainment. Perfect for extending your runway."
    elif scores['cost'] >= 6:
        categories['cost'] = f"Reasonably priced for what you get. {name} offers good value compared to major Western cities. Budget carefully for a comfortable lifestyle."
    else:
        categories['cost'] = f"{name} is on the expensive side. High rent and living costs mean you'll need a solid income. The quality of life can justify the expense for many."

    # WiFi
    if scores['wifi'] >= 8:
        categories['wifi'] = f"Excellent internet infrastructure in {name}. Fast fiber connections are widely available. Coworking spaces and cafes offer reliable high-speed access."
    elif scores['wifi'] >= 6:
        categories['wifi'] = f"Generally reliable internet in {name}. Most places have decent speeds for video calls and regular work. Some areas may have slower connections."
    else:
        categories['wifi'] = f"Internet can be inconsistent in {name}. Always have a backup plan. Coworking spaces are your best bet for reliable connections."

    # Nightlife
    if scores['nightlife'] >= 8:
        categories['nightlife'] = f"Vibrant nightlife scene in {name}. From trendy bars to clubs, there's something for everyone. Easy to socialize and meet other nomads."
    elif scores['nightlife'] >= 6:
        categories['nightlife'] = f"Decent nightlife options in {name}. You'll find bars, restaurants, and occasional events. Not a party capital but enough to keep you entertained."
    else:
        categories['nightlife'] = f"Quiet nightlife scene in {name}. More focused on relaxation than partying. Great if you prefer early mornings and productive days."

    # Nature
    if scores['nature'] >= 8:
        categories['nature'] = f"Stunning natural surroundings near {name}. Easy access to outdoor activities, parks, and scenic areas. Perfect for weekend adventures."
    elif scores['nature'] >= 6:
        categories['nature'] = f"Decent nature access from {name}. Parks and green spaces provide urban escapes. Day trips open up more outdoor options."
    else:
        categories['nature'] = f"Urban environment with limited nature access in {name}. You'll need to travel for significant outdoor experiences. City parks provide some green space."

    # Safety
    if scores['safety'] >= 8:
        categories['safety'] = f"Very safe city with low crime rates. {name} feels comfortable day and night. Solo travelers report feeling secure exploring."
    elif scores['safety'] >= 6:
        categories['safety'] = f"Generally safe with standard precautions. {name} is fine for most travelers. Be aware of petty crime in tourist areas."
    else:
        categories['safety'] = f"Exercise caution in {name}. Research neighborhoods and stay aware of your surroundings. Stick to known safe areas, especially at night."

    # Food
    if scores['food'] >= 9:
        categories['food'] = f"World-class food scene in {name}. From street food to fine dining, the culinary options are exceptional. A true destination for food lovers."
    elif scores['food'] >= 7:
        categories['food'] = f"Great food variety in {name}. Local cuisine is worth exploring, plus good international options. You'll eat well here."
    else:
        categories['food'] = f"Basic food options in {name}. Local cuisine may be limited. International food is available in larger areas."

    # Community
    if scores['community'] >= 9:
        categories['community'] = f"Large, established nomad community in {name}. Regular meetups, events, and coworking spaces full of remote workers. Very easy to make friends."
    elif scores['community'] >= 7:
        categories['community'] = f"Growing nomad community in {name}. You'll find other remote workers and occasional events. Takes some effort but connections are possible."
    else:
        categories['community'] = f"Small nomad community in {name}. You'll be more of a pioneer here. Great for those who prefer less crowded scenes."

    # English
    if scores['english'] >= 8:
        categories['english'] = f"English is widely spoken in {name}. You can easily navigate daily life without learning the local language. Signs and menus often have English."
    elif scores['english'] >= 6:
        categories['english'] = f"English is spoken in tourist areas and by younger locals. Learning some local phrases helps significantly with daily interactions in {name}."
    else:
        categories['english'] = f"Limited English in {name}. Learning the local language or using translation apps is essential. A great opportunity for immersion if you're up for it."

    # Visa
    if scores['visa'] >= 9:
        categories['visa'] = f"Excellent visa situation for nomads. Long stays are easy in {name}. Visa-free periods are generous or digital nomad visas are available."
    elif scores['visa'] >= 7:
        categories['visa'] = f"Manageable visa process for {name}. Most nationalities get reasonable visa-free periods. Extensions or border runs are options."
    else:
        categories['visa'] = f"Visa situation requires planning in {name}. Shorter visa-free periods mean you'll need to plan extensions or apply for longer-term options."

    return {
        "hero_image": city.get('image', '').replace('w=800&h=500', 'w=1600&h=900'),
        "hero_alt": f"{name} cityscape and landmarks",
        "monthly_budget": budget,
        "wifi_speed": wifi_speed,
        "nomad_count": nomad_count,
        "score_title": score_title,
        "score_description": f"{name} offers a unique experience for digital nomads. With its mix of culture, infrastructure, and community, it's worth considering for your next base. Every city has trade-offs—weigh what matters most to you.",
        "categories": categories,
        "stays": [
            {"type": "Apartment", "name": f"{name} City Center", "price": f"From {budget}/month • Central location", "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop"},
            {"type": "Coliving", "name": f"{name} Coliving", "price": f"From {budget.replace(',', '').replace('€', '').replace('$', '').replace('£', '')}/month • Community", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop"},
            {"type": "Hotel", "name": f"Boutique Hotel {name}", "price": "From $50/night • Comfortable stay", "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"}
        ],
        "coworking": [
            {"name": f"Cowork {name}", "day": "$15", "month": "$150", "wifi": wifi_speed},
            {"name": "Local Cafe", "day": "Free", "month": "w/ purchase", "wifi": "30 Mbps"},
            {"name": f"Hub {name}", "day": "$12", "month": "$120", "wifi": "80 Mbps"}
        ],
        "food": [
            {"name": "Local Restaurant", "type": "Traditional", "description": f"Experience authentic local cuisine in {name}. Try the regional specialties for an immersive food experience."},
            {"name": "Street Food Market", "type": "Street Food", "description": f"The best way to taste {name}'s food culture. Fresh, affordable, and full of local flavors."},
            {"name": "Nomad Cafe", "type": "Cafe & Workspace", "description": f"Popular with remote workers in {name}. Good coffee, reliable WiFi, and a productive atmosphere."}
        ]
    }


def get_city_content(city):
    """Get content for a city, either custom or generated"""
    city_id = city['id']
    if city_id in CITY_CONTENT:
        return CITY_CONTENT[city_id]
    return generate_default_content(city)


def generate_city_page(city):
    """Generate HTML content for a city page"""
    content = get_city_content(city)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{city['name']} digital nomad guide: cost of living, WiFi speeds, coworking spaces, visa info, and where to stay in {city['country']}.">

  <title>{city['name']}, {city['country']} — NomadCompass City Guide</title>

  <!-- Open Graph -->
  <meta property="og:title" content="{city['name']} Digital Nomad Guide | NomadCompass">
  <meta property="og:description" content="Everything you need to know about living and working remotely in {city['name']}. Cost of living, coworking spaces, neighborhoods, and visa info.">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{content['hero_image'].replace('w=1600&h=900', 'w=1200&h=630')}">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="../styles/base.css">
  <link rel="stylesheet" href="../styles/nav.css">
  <link rel="stylesheet" href="../styles/footer.css">

  <!-- Page-specific styles -->
  <style>
    /* Page fade-in animation */
    body {{
      animation: pageIn 0.4s ease-out;
    }}
    @keyframes pageIn {{
      from {{ opacity: 0; }}
      to {{ opacity: 1; }}
    }}

    /* ============================================
       CITY DETAIL PAGE STYLES
       ============================================ */

    /* --- SECTION 1: HERO --- */
    .city-hero {{
      position: relative;
      height: 60vh;
      min-height: 400px;
      max-height: 600px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }}

    .city-hero-image {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}

    .city-hero-overlay {{
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(31, 28, 25, 0.9) 0%,
        rgba(31, 28, 25, 0.4) 50%,
        rgba(31, 28, 25, 0.1) 100%
      );
    }}

    .city-hero-content {{
      position: relative;
      z-index: 1;
      padding: var(--space-8);
      width: 100%;
      max-width: var(--container-max);
      margin: 0 auto;
    }}

    .city-hero-flag {{
      font-size: 3rem;
      margin-bottom: var(--space-2);
    }}

    .city-hero-title {{
      font-size: clamp(2.5rem, 6vw, 4rem);
      color: var(--color-white);
      margin-bottom: var(--space-2);
    }}

    .city-hero-country {{
      font-size: var(--text-xl);
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: var(--space-4);
    }}

    .city-hero-tagline {{
      font-size: var(--text-lg);
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      line-height: var(--leading-relaxed);
    }}

    /* --- SECTION 2: QUICK STATS BAR --- */
    .quick-stats {{
      background-color: var(--color-forest);
      padding: var(--space-6) 0;
    }}

    .quick-stats-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }}

    @media (min-width: 768px) {{
      .quick-stats-grid {{
        grid-template-columns: repeat(4, 1fr);
      }}
    }}

    .quick-stat {{
      text-align: center;
      color: var(--color-white);
    }}

    .quick-stat-value {{
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      margin-bottom: var(--space-1);
    }}

    .quick-stat-label {{
      font-size: var(--text-sm);
      opacity: 0.8;
    }}

    /* --- SECTION 3: NOMAD SCORE GAUGE --- */
    .score-section {{
      padding: var(--space-16) 0;
      background-color: var(--color-cream);
    }}

    .score-container {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-8);
    }}

    @media (min-width: 768px) {{
      .score-container {{
        flex-direction: row;
        justify-content: center;
      }}
    }}

    .score-gauge {{
      position: relative;
      width: 200px;
      height: 200px;
    }}

    .score-gauge-bg {{
      fill: none;
      stroke: var(--color-sand-dark);
      stroke-width: 12;
    }}

    .score-gauge-fill {{
      fill: none;
      stroke: var(--color-terracotta);
      stroke-width: 12;
      stroke-linecap: round;
      transform: rotate(-90deg);
      transform-origin: center;
      transition: stroke-dasharray 1s ease;
    }}

    .score-gauge-text {{
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }}

    .score-gauge-value {{
      font-family: var(--font-display);
      font-size: var(--text-5xl);
      color: var(--color-ink);
      line-height: 1;
    }}

    .score-gauge-label {{
      font-size: var(--text-sm);
      color: var(--color-stone);
      margin-top: var(--space-1);
    }}

    .score-description {{
      max-width: 400px;
      text-align: center;
    }}

    @media (min-width: 768px) {{
      .score-description {{
        text-align: left;
      }}
    }}

    .score-description h2 {{
      margin-bottom: var(--space-4);
    }}

    /* --- SECTION 4: CATEGORY BREAKDOWN --- */
    .categories-section {{
      padding: var(--space-16) 0;
      background-color: var(--color-white);
    }}

    .categories-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }}

    @media (min-width: 768px) {{
      .categories-grid {{
        grid-template-columns: repeat(2, 1fr);
      }}
    }}

    .category-item {{
      background-color: var(--color-sand);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
    }}

    .category-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }}

    .category-name {{
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-semibold);
      color: var(--color-ink);
    }}

    .category-icon {{
      font-size: var(--text-xl);
    }}

    .category-score {{
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-terracotta);
    }}

    .category-bar {{
      height: 8px;
      background-color: var(--color-sand-dark);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--space-3);
    }}

    .category-bar-fill {{
      height: 100%;
      background-color: var(--color-terracotta);
      border-radius: var(--radius-full);
      transition: width 0.8s ease;
    }}

    .category-description {{
      font-size: var(--text-sm);
      color: var(--color-charcoal);
      line-height: var(--leading-relaxed);
    }}

    /* --- AFFILIATE SECTIONS SHARED --- */
    .affiliate-section {{
      padding: var(--space-16) 0;
    }}

    .affiliate-section:nth-child(even) {{
      background-color: var(--color-sand);
    }}

    .affiliate-section:nth-child(odd) {{
      background-color: var(--color-cream);
    }}

    .section-header {{
      text-align: center;
      margin-bottom: var(--space-10);
    }}

    .section-header h2 {{
      margin-bottom: var(--space-2);
    }}

    .section-header p {{
      color: var(--color-stone);
    }}

    .affiliate-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }}

    @media (min-width: 640px) {{
      .affiliate-grid {{
        grid-template-columns: repeat(2, 1fr);
      }}
    }}

    @media (min-width: 1024px) {{
      .affiliate-grid {{
        grid-template-columns: repeat(3, 1fr);
      }}
    }}

    /* --- SECTION 5: WHERE TO STAY --- */
    .stay-card {{
      background-color: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }}

    .stay-card-image {{
      width: 100%;
      height: 160px;
      object-fit: cover;
    }}

    .stay-card-body {{
      padding: var(--space-5);
    }}

    .stay-card-type {{
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-terracotta);
      margin-bottom: var(--space-1);
    }}

    .stay-card-name {{
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-ink);
      margin-bottom: var(--space-2);
    }}

    .stay-card-price {{
      font-size: var(--text-sm);
      color: var(--color-stone);
      margin-bottom: var(--space-4);
    }}

    /* --- SECTION 6: COWORKING SPACES --- */
    .cowork-card {{
      background-color: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--space-5);
    }}

    .cowork-card-name {{
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-ink);
      margin-bottom: var(--space-3);
    }}

    .cowork-card-prices {{
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-3);
    }}

    .cowork-price {{
      font-size: var(--text-sm);
    }}

    .cowork-price-value {{
      font-weight: var(--font-semibold);
      color: var(--color-ink);
    }}

    .cowork-price-label {{
      color: var(--color-stone);
    }}

    .cowork-wifi {{
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-forest);
      background-color: var(--color-sand);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-4);
    }}

    /* --- SECTION 7: EAT & DRINK --- */
    .eat-card {{
      background-color: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--space-5);
    }}

    .eat-card-name {{
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-ink);
      margin-bottom: var(--space-1);
    }}

    .eat-card-type {{
      font-size: var(--text-sm);
      color: var(--color-terracotta);
      margin-bottom: var(--space-2);
    }}

    .eat-card-description {{
      font-size: var(--text-sm);
      color: var(--color-charcoal);
      margin-bottom: var(--space-4);
      line-height: var(--leading-relaxed);
    }}

    /* --- SECTION 8: COMMUNITY VOTING --- */
    .voting-section {{
      padding: var(--space-16) 0;
      background-color: var(--color-white);
    }}

    .voting-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }}

    @media (min-width: 768px) {{
      .voting-grid {{
        grid-template-columns: repeat(2, 1fr);
      }}
    }}

    .voting-item {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--color-sand);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }}

    .voting-category {{
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }}

    .voting-icon {{
      font-size: var(--text-xl);
    }}

    .voting-name {{
      font-weight: var(--font-medium);
      color: var(--color-ink);
    }}

    .voting-score {{
      font-size: var(--text-sm);
      color: var(--color-stone);
    }}

    .voting-actions {{
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }}

    .vote-btn {{
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      font-size: var(--text-lg);
      transition: all var(--transition-fast);
    }}

    .vote-btn:hover:not(:disabled) {{
      transform: scale(1.1);
    }}

    .vote-btn:disabled {{
      opacity: 0.5;
      cursor: not-allowed;
    }}

    .vote-btn.upvote {{
      background-color: var(--color-forest);
      color: var(--color-white);
    }}

    .vote-btn.downvote {{
      background-color: var(--color-sand-dark);
      color: var(--color-charcoal);
    }}

    .vote-count {{
      min-width: 40px;
      text-align: center;
      font-weight: var(--font-semibold);
      color: var(--color-ink);
    }}

    .voting-login-prompt {{
      text-align: center;
      padding: var(--space-8);
      background-color: var(--color-sand);
      border-radius: var(--radius-lg);
      margin-top: var(--space-6);
    }}

    .voting-login-prompt p {{
      margin-bottom: var(--space-4);
      color: var(--color-charcoal);
    }}

    /* --- SECTION 9: RELATED CITIES --- */
    .related-section {{
      padding: var(--space-16) 0;
      background-color: var(--color-sand);
    }}

    .related-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }}

    @media (min-width: 640px) {{
      .related-grid {{
        grid-template-columns: repeat(2, 1fr);
      }}
    }}

    @media (min-width: 1024px) {{
      .related-grid {{
        grid-template-columns: repeat(3, 1fr);
      }}
    }}

    .related-card {{
      background-color: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      transition: transform var(--transition-base);
    }}

    .related-card:hover {{
      transform: translateY(-4px);
    }}

    .related-card-image {{
      width: 100%;
      height: 140px;
      object-fit: cover;
    }}

    .related-card-body {{
      padding: var(--space-4);
    }}

    .related-card-header {{
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }}

    .related-card-flag {{
      font-size: var(--text-xl);
    }}

    .related-card-name {{
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-ink);
    }}

    .related-card-country {{
      font-size: var(--text-sm);
      color: var(--color-stone);
    }}
  </style>
</head>
<body>

  <!-- ==========================================
       NAVIGATION
       ========================================== -->
  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="../index.html" class="nav-logo">
        Nomad<span class="nav-logo-accent">Compass</span>
      </a>
      <ul class="nav-links">
        <li><a href="../index.html" class="nav-link">Home</a></li>
        <li><a href="../wheel.html" class="nav-link">Wheel</a></li>
        <li><a href="../index.html#cities" class="nav-link active">Cities</a></li>
        <li><a href="../blog.html" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions">
        <a href="../login.html" class="nav-login">Login</a>
        <a href="../signup.html" class="btn btn-primary nav-signup">Sign Up</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="../index.html" class="nav-mobile-link">Home</a></li>
        <li><a href="../wheel.html" class="nav-mobile-link">Wheel</a></li>
        <li><a href="../index.html#cities" class="nav-mobile-link active">Cities</a></li>
        <li><a href="../blog.html" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions">
        <a href="../login.html" class="btn btn-secondary">Login</a>
        <a href="../signup.html" class="btn btn-primary">Sign Up</a>
      </div>
    </div>
  </nav>

  <!-- Navigation Script -->
  <script>
    (function() {{
      const nav = document.getElementById('mainNav');
      const navToggle = document.getElementById('navToggle');
      const navMobile = document.getElementById('navMobile');
      const body = document.body;

      navToggle.addEventListener('click', function() {{
        const isOpen = navToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        body.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
      }});

      const mobileLinks = navMobile.querySelectorAll('.nav-mobile-link, .nav-mobile-actions .btn');
      mobileLinks.forEach(link => {{
        link.addEventListener('click', () => {{
          navToggle.classList.remove('active');
          navMobile.classList.remove('active');
          body.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }});
      }});

      window.addEventListener('scroll', () => {{
        nav.classList.toggle('scrolled', window.scrollY > 10);
      }}, {{ passive: true }});
    }})();
  </script>

  <!-- ==========================================
       MAIN CONTENT
       ========================================== -->
  <main class="main-content">

    <!-- ==========================================
         SECTION 1: HERO
         Full-width city image with overlay
         ========================================== -->
    <section class="city-hero">
      <img
        src="{content['hero_image']}"
        alt="{content['hero_alt']}"
        class="city-hero-image"
      >
      <div class="city-hero-overlay"></div>
      <div class="city-hero-content">
        <div class="city-hero-flag">{city['flag']}</div>
        <h1 class="city-hero-title">{city['name']}</h1>
        <p class="city-hero-country">{city['country']}</p>
        <p class="city-hero-tagline">{city['tagline']}</p>
      </div>
    </section>

    <!-- ==========================================
         SECTION 2: QUICK STATS BAR
         4 key numbers at a glance
         ========================================== -->
    <section class="quick-stats">
      <div class="container">
        <div class="quick-stats-grid">
          <div class="quick-stat">
            <div class="quick-stat-value">{content['monthly_budget']}</div>
            <div class="quick-stat-label">Monthly Budget</div>
          </div>
          <div class="quick-stat">
            <div class="quick-stat-value">{content['wifi_speed']}</div>
            <div class="quick-stat-label">Avg. WiFi Speed</div>
          </div>
          <div class="quick-stat">
            <div class="quick-stat-value">{city['scores']['safety']}/10</div>
            <div class="quick-stat-label">Safety Score</div>
          </div>
          <div class="quick-stat">
            <div class="quick-stat-value">{content['nomad_count']}</div>
            <div class="quick-stat-label">Active Nomads</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 3: NOMAD SCORE GAUGE
         Large circular gauge showing overall score
         ========================================== -->
    <section class="score-section accent-container accent-ocean accent-top-left">
      <div class="container">
        <div class="score-container">
          <div class="score-gauge">
            <svg viewBox="0 0 100 100" width="200" height="200">
              <!-- Background circle -->
              <circle
                class="score-gauge-bg"
                cx="50"
                cy="50"
                r="42"
              />
              <!-- Score fill (animated) -->
              <circle
                class="score-gauge-fill"
                id="scoreGaugeFill"
                cx="50"
                cy="50"
                r="42"
                stroke-dasharray="0 264"
              />
            </svg>
            <div class="score-gauge-text">
              <div class="score-gauge-value" id="nomadScoreValue">0</div>
              <div class="score-gauge-label">Nomad Score</div>
            </div>
          </div>
          <div class="score-description">
            <h2>{content['score_title']}</h2>
            <p>{content['score_description']}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 4: CATEGORY BREAKDOWN
         All 10 categories with progress bars
         ========================================== -->
    <section class="categories-section accent-container accent-forest accent-bottom-right">
      <div class="container">
        <div class="section-header">
          <h2>Category Breakdown</h2>
          <p>How {city['name']} scores across all 10 factors</p>
        </div>
        <div class="categories-grid" id="categoriesGrid">
          <!-- Categories will be generated by JavaScript -->
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 5: WHERE TO STAY
         Accommodation recommendations with affiliate links
         ========================================== -->
    <section class="affiliate-section">
      <div class="container">
        <div class="section-header">
          <h2>Where to Stay in {city['name']}</h2>
          <p>Top neighborhoods and accommodations for digital nomads</p>
        </div>
        <div class="affiliate-grid">
          <article class="stay-card">
            <img src="{content['stays'][0]['image']}" alt="{content['stays'][0]['name']}" class="stay-card-image">
            <div class="stay-card-body">
              <div class="stay-card-type">{content['stays'][0]['type']}</div>
              <h3 class="stay-card-name">{content['stays'][0]['name']}</h3>
              <p class="stay-card-price">{content['stays'][0]['price']}</p>
              <a href="#" class="btn btn-primary" style="width: 100%;">Find Apartments →</a>
            </div>
          </article>
          <article class="stay-card">
            <img src="{content['stays'][1]['image']}" alt="{content['stays'][1]['name']}" class="stay-card-image">
            <div class="stay-card-body">
              <div class="stay-card-type">{content['stays'][1]['type']}</div>
              <h3 class="stay-card-name">{content['stays'][1]['name']}</h3>
              <p class="stay-card-price">{content['stays'][1]['price']}</p>
              <a href="#" class="btn btn-primary" style="width: 100%;">Book Now →</a>
            </div>
          </article>
          <article class="stay-card">
            <img src="{content['stays'][2]['image']}" alt="{content['stays'][2]['name']}" class="stay-card-image">
            <div class="stay-card-body">
              <div class="stay-card-type">{content['stays'][2]['type']}</div>
              <h3 class="stay-card-name">{content['stays'][2]['name']}</h3>
              <p class="stay-card-price">{content['stays'][2]['price']}</p>
              <a href="#" class="btn btn-primary" style="width: 100%;">View Listings →</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 6: COWORKING SPACES
         Best places to work with affiliate links
         ========================================== -->
    <section class="affiliate-section">
      <div class="container">
        <div class="section-header">
          <h2>Best Coworking Spaces</h2>
          <p>Where nomads get work done in {city['name']}</p>
        </div>
        <div class="affiliate-grid">
          <article class="cowork-card">
            <h3 class="cowork-card-name">{content['coworking'][0]['name']}</h3>
            <div class="cowork-card-prices">
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][0]['day']}</span>
                <span class="cowork-price-label">/day</span>
              </div>
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][0]['month']}</span>
                <span class="cowork-price-label">/month</span>
              </div>
            </div>
            <div class="cowork-wifi">📶 {content['coworking'][0]['wifi']} WiFi</div>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Learn More →</a>
          </article>
          <article class="cowork-card">
            <h3 class="cowork-card-name">{content['coworking'][1]['name']}</h3>
            <div class="cowork-card-prices">
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][1]['day']}</span>
                <span class="cowork-price-label">/day</span>
              </div>
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][1]['month']}</span>
                <span class="cowork-price-label">/month</span>
              </div>
            </div>
            <div class="cowork-wifi">📶 {content['coworking'][1]['wifi']} WiFi</div>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Find Locations →</a>
          </article>
          <article class="cowork-card">
            <h3 class="cowork-card-name">{content['coworking'][2]['name']}</h3>
            <div class="cowork-card-prices">
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][2]['day']}</span>
                <span class="cowork-price-label">/day</span>
              </div>
              <div class="cowork-price">
                <span class="cowork-price-value">{content['coworking'][2]['month']}</span>
                <span class="cowork-price-label">/month</span>
              </div>
            </div>
            <div class="cowork-wifi">📶 {content['coworking'][2]['wifi']} WiFi</div>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Learn More →</a>
          </article>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 7: EAT & DRINK
         Restaurant and bar recommendations
         ========================================== -->
    <section class="affiliate-section">
      <div class="container">
        <div class="section-header">
          <h2>Where to Eat & Drink</h2>
          <p>Best food and drink spots in {city['name']}</p>
        </div>
        <div class="affiliate-grid">
          <article class="eat-card">
            <h3 class="eat-card-name">{content['food'][0]['name']}</h3>
            <div class="eat-card-type">{content['food'][0]['type']}</div>
            <p class="eat-card-description">{content['food'][0]['description']}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">View Location →</a>
          </article>
          <article class="eat-card">
            <h3 class="eat-card-name">{content['food'][1]['name']}</h3>
            <div class="eat-card-type">{content['food'][1]['type']}</div>
            <p class="eat-card-description">{content['food'][1]['description']}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">View Location →</a>
          </article>
          <article class="eat-card">
            <h3 class="eat-card-name">{content['food'][2]['name']}</h3>
            <div class="eat-card-type">{content['food'][2]['type']}</div>
            <p class="eat-card-description">{content['food'][2]['description']}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">View Location →</a>
          </article>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 8: COMMUNITY VOTING
         User voting on categories with localStorage
         ========================================== -->
    <section class="voting-section">
      <div class="container">
        <div class="section-header">
          <h2>What Do Nomads Say?</h2>
          <p>Vote on how accurate these scores are based on your experience</p>
        </div>
        <div class="voting-grid" id="votingGrid">
          <!-- Voting items will be generated by JavaScript -->
        </div>
        <div class="voting-login-prompt" id="votingLoginPrompt" style="display: none;">
          <p>Sign up to vote and help other nomads make better decisions.</p>
          <a href="../signup.html" class="btn btn-primary">Sign Up to Vote</a>
        </div>
      </div>
    </section>

    <!-- ==========================================
         SECTION 9: RELATED CITIES
         Similar cities the user might like
         ========================================== -->
    <section class="related-section">
      <div class="container">
        <div class="section-header">
          <h2>You Might Also Like</h2>
          <p>Cities with similar vibes to {city['name']}</p>
        </div>
        <div class="related-grid" id="relatedGrid">
          <!-- Related cities will be generated by JavaScript -->
        </div>
      </div>
    </section>

  </main>

  <!-- ==========================================
       FOOTER
       ========================================== -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about">
          <a href="../index.html" class="footer-logo">
            Nomad<span class="footer-logo-accent">Compass</span>
          </a>
          <p class="footer-description">
            Your trusted guide for finding the perfect city to work and live remotely.
          </p>
          <div class="footer-social">
            <a href="#" class="footer-social-link" aria-label="Twitter">
              <svg class="footer-social-icon" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="footer-social-link" aria-label="Instagram">
              <svg class="footer-social-icon" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#" class="footer-social-link" aria-label="YouTube">
              <svg class="footer-social-icon" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Explore</h4>
          <ul class="footer-links">
            <li><a href="../index.html#cities" class="footer-link">All Cities</a></li>
            <li><a href="../wheel.html" class="footer-link">Decision Wheel</a></li>
            <li><a href="../compare.html" class="footer-link">Compare Cities</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Resources</h4>
          <ul class="footer-links">
            <li><a href="../blog.html" class="footer-link">Blog</a></li>
            <li><a href="../guides.html" class="footer-link">City Guides</a></li>
            <li><a href="../faq.html" class="footer-link">FAQ</a></li>
          </ul>
        </div>
        <div class="footer-column footer-newsletter">
          <h4 class="footer-heading">Stay Connected</h4>
          <p class="footer-newsletter-text">Get weekly nomad insights.</p>
          <form class="footer-newsletter-form" onsubmit="event.preventDefault(); alert('Thanks for subscribing!');">
            <input type="email" class="footer-newsletter-input" placeholder="Enter your email" required>
            <button type="submit" class="footer-newsletter-btn">Subscribe</button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-disclosure">Some links on this site are affiliate links. We may earn a commission at no extra cost to you.</p>
        <p class="footer-copyright">&copy; 2025 NomadCompass. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- ==========================================
       CITY DATA
       ========================================== -->
  <script src="../cities-data.js"></script>

  <!-- ==========================================
       PAGE SCRIPTS
       ========================================== -->
  <script>
    /**
     * {city['name'].upper()} CITY DETAIL PAGE SCRIPTS
     */

    (function() {{
      'use strict';

      const CITY_ID = '{city['id']}';

      const CATEGORY_DESCRIPTIONS = {{
        climate: "{content['categories']['climate']}",
        cost: "{content['categories']['cost']}",
        wifi: "{content['categories']['wifi']}",
        nightlife: "{content['categories']['nightlife']}",
        nature: "{content['categories']['nature']}",
        safety: "{content['categories']['safety']}",
        food: "{content['categories']['food']}",
        community: "{content['categories']['community']}",
        english: "{content['categories']['english']}",
        visa: "{content['categories']['visa']}"
      }};

      const scoreGaugeFill = document.getElementById('scoreGaugeFill');
      const nomadScoreValue = document.getElementById('nomadScoreValue');
      const categoriesGrid = document.getElementById('categoriesGrid');
      const votingGrid = document.getElementById('votingGrid');
      const votingLoginPrompt = document.getElementById('votingLoginPrompt');
      const relatedGrid = document.getElementById('relatedGrid');

      function getCityData() {{
        return CITIES.find(city => city.id === CITY_ID);
      }}

      function calculateNomadScore(city) {{
        const categories = getCategoryKeys();
        const total = categories.reduce((sum, key) => sum + city.scores[key], 0);
        return (total / categories.length).toFixed(1);
      }}

      function animateScoreGauge(score) {{
        const circumference = 2 * Math.PI * 42;
        const fillPercent = score / 10;
        const dashLength = circumference * fillPercent;

        setTimeout(() => {{
          scoreGaugeFill.style.strokeDasharray = `${{dashLength}} ${{circumference}}`;
        }}, 300);

        nomadScoreValue.textContent = score;
      }}

      function renderCategories(city) {{
        const categories = getCategoryKeys();

        const html = categories.map(key => {{
          const category = CATEGORIES[key];
          const score = city.scores[key];
          const description = CATEGORY_DESCRIPTIONS[key];
          const fillWidth = score * 10;

          return `
            <div class="category-item">
              <div class="category-header">
                <div class="category-name">
                  <span class="category-icon">${{category.icon}}</span>
                  <span>${{category.name}}</span>
                </div>
                <div class="category-score">${{score}}/10</div>
              </div>
              <div class="category-bar">
                <div class="category-bar-fill" style="width: ${{fillWidth}}%"></div>
              </div>
              <p class="category-description">${{description}}</p>
            </div>
          `;
        }}).join('');

        categoriesGrid.innerHTML = html;
      }}

      function isLoggedIn() {{
        return localStorage.getItem('auth_token') !== null;
      }}

      function getVotes() {{
        const stored = localStorage.getItem(`votes-${{CITY_ID}}`);
        return stored ? JSON.parse(stored) : {{}};
      }}

      function saveVotes(votes) {{
        localStorage.setItem(`votes-${{CITY_ID}}`, JSON.stringify(votes));
      }}

      function handleVote(category, delta) {{
        if (!isLoggedIn()) {{
          votingLoginPrompt.style.display = 'block';
          return;
        }}

        const votes = getVotes();

        if (!votes[category]) {{
          votes[category] = {{ count: 0, userVoted: null }};
        }}

        if (votes[category].userVoted === delta) {{
          votes[category].count -= delta;
          votes[category].userVoted = null;
        }} else {{
          if (votes[category].userVoted !== null) {{
            votes[category].count -= votes[category].userVoted;
          }}
          votes[category].count += delta;
          votes[category].userVoted = delta;
        }}

        saveVotes(votes);
        renderVoting(getCityData());
      }}

      function renderVoting(city) {{
        const categories = getCategoryKeys();
        const votes = getVotes();
        const loggedIn = isLoggedIn();

        const html = categories.map(key => {{
          const category = CATEGORIES[key];
          const score = city.scores[key];
          const categoryVotes = votes[key] || {{ count: 0, userVoted: null }};

          return `
            <div class="voting-item">
              <div class="voting-category">
                <span class="voting-icon">${{category.icon}}</span>
                <div>
                  <div class="voting-name">${{category.name}}</div>
                  <div class="voting-score">Score: ${{score}}/10</div>
                </div>
              </div>
              <div class="voting-actions">
                <button
                  class="vote-btn upvote ${{categoryVotes.userVoted === 1 ? 'active' : ''}}"
                  onclick="window.handleVote('${{key}}', 1)"
                  ${{!loggedIn ? 'disabled' : ''}}
                  aria-label="Upvote ${{category.name}}"
                >
                  👍
                </button>
                <span class="vote-count">${{categoryVotes.count > 0 ? '+' : ''}}${{categoryVotes.count}}</span>
                <button
                  class="vote-btn downvote ${{categoryVotes.userVoted === -1 ? 'active' : ''}}"
                  onclick="window.handleVote('${{key}}', -1)"
                  ${{!loggedIn ? 'disabled' : ''}}
                  aria-label="Downvote ${{category.name}}"
                >
                  👎
                </button>
              </div>
            </div>
          `;
        }}).join('');

        votingGrid.innerHTML = html;
        votingLoginPrompt.style.display = loggedIn ? 'none' : 'block';
      }}

      window.handleVote = handleVote;

      function findRelatedCities(currentCity, count = 3) {{
        const categories = getCategoryKeys();

        const similarities = CITIES
          .filter(city => city.id !== currentCity.id)
          .map(city => {{
            let sumSquares = 0;
            categories.forEach(key => {{
              const diff = city.scores[key] - currentCity.scores[key];
              sumSquares += diff * diff;
            }});
            const distance = Math.sqrt(sumSquares);

            return {{ city, distance }};
          }});

        similarities.sort((a, b) => a.distance - b.distance);

        return similarities.slice(0, count).map(s => s.city);
      }}

      function renderRelatedCities(city) {{
        const related = findRelatedCities(city, 3);

        const html = related.map(relatedCity => `
          <a href="${{relatedCity.id}}.html" class="related-card">
            <img
              src="${{relatedCity.image}}"
              alt="${{relatedCity.name}}, ${{relatedCity.country}}"
              class="related-card-image"
              loading="lazy"
            >
            <div class="related-card-body">
              <div class="related-card-header">
                <span class="related-card-flag">${{relatedCity.flag}}</span>
                <span class="related-card-name">${{relatedCity.name}}</span>
              </div>
              <p class="related-card-country">${{relatedCity.country}}</p>
            </div>
          </a>
        `).join('');

        relatedGrid.innerHTML = html;
      }}

      function init() {{
        const city = getCityData();

        if (!city) {{
          console.error('City data not found for:', CITY_ID);
          return;
        }}

        const nomadScore = calculateNomadScore(city);
        animateScoreGauge(nomadScore);

        renderCategories(city);
        renderVoting(city);
        renderRelatedCities(city);
      }}

      if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', init);
      }} else {{
        init();
      }}

    }})();
  </script>

  <!-- Auth State Management -->
  <script src="../scripts/auth.js"></script>

</body>
</html>'''

    return html


def main():
    # Read cities-data.js and parse city data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    cities_data_path = os.path.join(project_dir, 'cities-data.js')
    cities_dir = os.path.join(project_dir, 'cities')

    # Read and parse cities-data.js
    with open(cities_data_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract CITIES array using regex
    cities_match = re.search(r'const CITIES = \[(.*?)\];', content, re.DOTALL)
    if not cities_match:
        print("Could not find CITIES array")
        return

    cities_str = cities_match.group(1)

    # Parse each city object
    city_pattern = r'\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*flag:\s*"([^"]+)",\s*tagline:\s*"([^"]+)",\s*image:\s*"([^"]+)",\s*scores:\s*\{([^}]+)\}'

    cities = []
    for match in re.finditer(city_pattern, cities_str):
        city_id, name, country, flag, tagline, image, scores_str = match.groups()

        # Parse scores
        scores = {}
        for score_match in re.finditer(r'(\w+):\s*(\d+)', scores_str):
            scores[score_match.group(1)] = int(score_match.group(2))

        cities.append({
            'id': city_id,
            'name': name,
            'country': country,
            'flag': flag,
            'tagline': tagline,
            'image': image,
            'scores': scores
        })

    print(f"Found {len(cities)} cities")

    # Create cities directory if it doesn't exist
    os.makedirs(cities_dir, exist_ok=True)

    # Generate pages for all cities
    for city in cities:
        filename = os.path.join(cities_dir, f"{city['id']}.html")
        html = generate_city_page(city)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"Generated: {city['id']}.html")

    print(f"\nGenerated {len(cities)} city pages!")


if __name__ == '__main__':
    main()

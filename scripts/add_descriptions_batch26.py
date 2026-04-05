#!/usr/bin/env python3
"""Batch 26: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "huahin": {
        "climate": "Hua Hin has a tropical climate with warm temperatures year-round (26-34°C). Less rainfall than other Thai beach destinations. Dry season November to April.",
        "cost": "Moderate for Thailand. Apartments from $400-800/month. Beach town premium but Thai value.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Thailand has invested. Reliable.",
        "nightlife": "Relaxed scene with beach bars and night markets. More family-oriented than Pattaya. Calm.",
        "nature": "Beautiful beaches and national parks nearby. Royal palaces add character. Nature accessible.",
        "safety": "Very safe with royal town atmosphere. Thai hospitality. Very comfortable.",
        "food": "Thai cuisine with fresh seafood focus. Night markets are excellent. Great value.",
        "community": "Retiree and long-stay community. Growing digital presence. Established.",
        "english": "Good in tourism industry. Thai helps for deeper connection. Communication possible.",
        "visa": "Standard Thai visa rules. 30-60 day entries. Extensions possible.",
        "culture": "Royal beach town with Thai character. More refined than other resorts. Traditional yet touristy.",
        "cleanliness": "Well-maintained due to royal connection. Beaches cleaned. Good standards.",
        "airquality": "Good air quality with sea breezes. Less pollution than Bangkok. Fresh."
    },
    "huehue": {
        "climate": "Hué has a tropical monsoon climate with warm temperatures (21-34°C). Heavy rain from September to January. Best from March to August.",
        "cost": "Very affordable with apartments from $200-400/month. Vietnam is cheap. Excellent value.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Limited but atmospheric. Riverside bars and cafes. Cultural rather than party.",
        "nature": "Perfume River and surrounding tombs. Hai Van Pass nearby. Nature has historical overlay.",
        "safety": "Very safe with Vietnamese hospitality. Historic town is welcoming. Comfortable.",
        "food": "Hué is famous for royal cuisine. Bún bò Huế is legendary. Outstanding local specialties.",
        "community": "Small but growing international presence. Teachers and travelers. Authentic experience.",
        "english": "Moderate in tourism. Vietnamese helps significantly. Learning appreciated.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy access.",
        "culture": "Imperial Vietnamese capital with tombs and citadel. The history is profound. Cultural richness.",
        "cleanliness": "Historic areas maintained. UNESCO protection. Pleasant.",
        "airquality": "Good air quality with river breezes. Less industrial than north. Fresh."
    },
    "innsbruck": {
        "climate": "Innsbruck has an Alpine climate with warm summers (18-26°C) and cold winters (-5 to 4°C). Mountains create weather patterns. Snow in winter.",
        "cost": "Moderate for Austria. Apartments from €700-1200/month. Ski season increases prices.",
        "wifi": "Excellent Austrian infrastructure with speeds of 50-100+ Mbps. Reliable. EU standards.",
        "nightlife": "University scene with bars and clubs. Old town has atmosphere. Active but civilized.",
        "nature": "Alps surround the city. World-class skiing and hiking. Nature is spectacular.",
        "safety": "Very safe with low crime. Austrian organization. Very comfortable.",
        "food": "Austrian cuisine with mountain specialties. Tyrolean dumplings and schnitzel. Quality.",
        "community": "University, winter sports, and tourism community. International students. Welcoming.",
        "english": "Good English proficiency. German helps locally. Communication easy.",
        "visa": "Schengen rules apply. Austrian options available. Standard access.",
        "culture": "Olympic city with Habsburg heritage. The Golden Roof and Alps define identity. Mountain elegance.",
        "cleanliness": "Very clean with Austrian standards. Alps ensure fresh surroundings. Pristine.",
        "airquality": "Excellent air quality with mountain air. Valley can trap some pollution in winter. Generally pristine."
    },
    "inverness": {
        "climate": "Inverness has a temperate oceanic climate with cool temperatures (4-17°C). Rain is common. Scotland's Highlands weather.",
        "cost": "Moderate for UK. Apartments from £700-1100/month. More affordable than Edinburgh.",
        "wifi": "Good UK infrastructure with speeds of 40-80 Mbps. Scottish government investment. Reliable.",
        "nightlife": "Pub scene with traditional music. The riverside has options. Cozy rather than wild.",
        "nature": "Gateway to Scottish Highlands. Loch Ness and mountains nearby. Nature is spectacular.",
        "safety": "Very safe with Highland hospitality. Low crime. Very comfortable.",
        "food": "Scottish cuisine with fresh local produce. Whisky and seafood. Quality available.",
        "community": "Local Highland community with some international presence. Tourism brings visitors. Authentic.",
        "english": "Native English with Scottish accent. Gaelic heritage. No barriers.",
        "visa": "UK visa rules apply. Various categories. Post-Brexit requirements.",
        "culture": "Highland capital with Jacobite heritage. The landscape defines culture. Wild Scottish atmosphere.",
        "cleanliness": "Clean and well-maintained. Scottish pride. Good standards.",
        "airquality": "Excellent air quality with Highland freshness. Among UK's cleanest. Pristine."
    },
    "izmir": {
        "climate": "Izmir has a Mediterranean climate with hot summers (30-38°C) and mild winters (8-15°C). Turkey's third largest city. Sunny most of the year.",
        "cost": "Affordable with apartments from $300-600/month. Turkey offers excellent value. Good living standards.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Turkish standards. Improving.",
        "nightlife": "Growing scene along Kordon. University adds energy. Mediterranean atmosphere.",
        "nature": "Aegean coast and surrounding historical sites. Ephesus day trips. Beautiful coastline.",
        "safety": "Safe with Turkish hospitality. Progressive Turkish city. Comfortable.",
        "food": "Aegean cuisine with fresh seafood and olive oil. Boyoz pastries are local. Excellent.",
        "community": "University and business community. Growing international interest. Welcoming.",
        "english": "Moderate with Turkish helpful. Tourism areas function. Learning Turkish appreciated.",
        "visa": "Turkish e-visa rules apply. Up to 90 days for most. Easy access.",
        "culture": "Ancient Smyrna meets modern Turkey. Most liberal Turkish city. Cosmopolitan atmosphere.",
        "cleanliness": "Kordon and center maintained. Development continues. Good standards.",
        "airquality": "Good air quality with Aegean breezes. Better than Istanbul. Fresh."
    },
    "jaipur": {
        "climate": "Jaipur has a semi-arid climate with extremely hot summers (35-45°C) and mild winters (10-25°C). Best season October to March. Monsoon brings relief.",
        "cost": "Very affordable with apartments from $200-400/month. India offers value. Excellent for budget.",
        "wifi": "Improving infrastructure with speeds of 15-50 Mbps. Variable quality. Mobile data often better.",
        "nightlife": "Limited due to culture. Hotel bars and rooftop restaurants. Cultural events instead.",
        "nature": "Desert landscape and hills. Amber Fort surroundings are dramatic. Nature has historical context.",
        "safety": "Generally safe with tourist awareness needed. Tourist areas are monitored. Standard caution.",
        "food": "Rajasthani cuisine with dal baati churma. Rich and flavorful. Vegetarian-friendly.",
        "community": "Growing digital presence. Gem and textile traders. International tourists.",
        "english": "Good in tourism and business. Hindi is local. Communication possible.",
        "visa": "Indian e-visa available. 30-90 days depending on type. Accessible.",
        "culture": "Pink City with stunning palaces and forts. Rajasthani heritage is rich. Color and history everywhere.",
        "cleanliness": "Varies significantly. Tourist sites maintained. Typical Indian challenges.",
        "airquality": "Can be poor especially in winter. Dust is common. Check conditions."
    },
    "jaisalmer": {
        "climate": "Jaisalmer has a hot desert climate with scorching summers (40-48°C) and cool winters (5-25°C). Best from October to March. Extreme conditions.",
        "cost": "Very affordable with apartments from $150-300/month. Remote desert town pricing. Excellent value.",
        "wifi": "Basic infrastructure with speeds of 5-20 Mbps. Desert town limitations. Mobile data helps.",
        "nightlife": "Very limited. Rooftop restaurants and cultural shows. Desert quiet.",
        "nature": "Thar Desert and sand dunes. Camel safaris are famous. Desert landscape is dramatic.",
        "safety": "Safe tourist destination. Desert hospitality. Comfortable.",
        "food": "Rajasthani cuisine with desert specialties. Simple but flavorful. Vegetarian focus.",
        "community": "Small tourist community. Seasonal visitors. Remote atmosphere.",
        "english": "Limited with Hindi and Rajasthani local. Tourism has basic English. Learning Hindi helps.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "Golden city rising from desert. Living fort is UNESCO heritage. Magical atmosphere.",
        "cleanliness": "Fort and tourist areas maintained. Desert dust is constant. Variable.",
        "airquality": "Can be dusty especially in summer. Desert conditions. Variable."
    },
    "jakarta": {
        "climate": "Jakarta has a tropical monsoon climate with hot temperatures year-round (27-34°C). Wet season November to March. Flooding is a concern.",
        "cost": "Affordable with apartments from $400-800/month. Indonesia offers value. Range varies widely.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps in good areas. Indonesia has invested. Variable by location.",
        "nightlife": "Vibrant scene in SCBD and Kemang. International and local options. Very active.",
        "nature": "Urban megacity with limited nature. Thousand Islands day trips possible. Car needed for escapes.",
        "safety": "Requires awareness with traffic being biggest risk. Tourist areas are safer. Research areas.",
        "food": "Indonesian cuisine is diverse and delicious. Street food culture is rich. Outstanding value.",
        "community": "Large expat and startup community. International businesses. Established networks.",
        "english": "Good in business and tourism. Indonesian helps locally. Communication possible.",
        "visa": "Visa on arrival or e-visa available. 30-60 days. Extensions possible.",
        "culture": "Indonesian capital with diverse heritage. The megacity energy is intense. Modern and traditional mix.",
        "cleanliness": "Varies significantly by area. Some neighborhoods well-maintained. Challenges exist.",
        "airquality": "Can be poor with traffic and industry. One of world's most congested cities. Check conditions."
    },
    "jeju": {
        "climate": "Jeju has a humid subtropical climate with mild summers (25-30°C) and cool winters (5-10°C). South Korean island with distinct weather. Typhoon risk in summer.",
        "cost": "Moderate for Korea. Apartments from ₩600,000-1,000,000/month ($480-800). Island premium.",
        "wifi": "Excellent Korean infrastructure with speeds of 100+ Mbps. Fast and reliable.",
        "nightlife": "Limited compared to mainland. Resort and beach options. Relaxed atmosphere.",
        "nature": "Volcanic island with UNESCO biosphere. Hallasan mountain and beaches. Nature is spectacular.",
        "safety": "Very safe with low crime. Korean organization. Very comfortable.",
        "food": "Jeju specialties including black pork and abalone. Fresh seafood. Outstanding quality.",
        "community": "Growing digital nomad community. Korean tourists dominate. International increasing.",
        "english": "Less than mainland Korea. Korean helps significantly. Tourism areas function.",
        "visa": "Standard Korean rules. Visa-free for many nationalities up to 30 days. Easy access.",
        "culture": "Volcanic island with unique heritage. Haenyeo diving women culture. Distinct from mainland.",
        "cleanliness": "Very clean with Korean standards. Island pride. Excellent.",
        "airquality": "Excellent air quality with ocean surroundings. Better than mainland. Pristine."
    },
    "jodhpur": {
        "climate": "Jodhpur has a semi-arid climate with extremely hot summers (35-45°C) and mild winters (10-25°C). Best October to March. Desert influences.",
        "cost": "Very affordable with apartments from $150-350/month. Rajasthan offers value. Excellent budget destination.",
        "wifi": "Improving infrastructure with speeds of 10-30 Mbps. Variable quality. Developing.",
        "nightlife": "Very limited. Rooftop restaurants and cultural performances. Heritage hotels offer atmosphere.",
        "nature": "Desert landscape with Mehrangarh Fort dominating. Bishnoi villages nearby. Dramatic scenery.",
        "safety": "Safe tourist destination. Rajasthani hospitality. Comfortable.",
        "food": "Rajasthani cuisine with mirchi bada and makhaniya lassi. Rich and spicy. Affordable.",
        "community": "Small tourist and photographer community. Blue city attracts artists. Intimate.",
        "english": "Limited with Hindi local. Tourism has basic English. Learning Hindi appreciated.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "Blue City with massive fort. Rajput warrior heritage. Visual drama everywhere.",
        "cleanliness": "Blue city areas maintained for tourism. Varies elsewhere. Tourist zones pleasant.",
        "airquality": "Can be dusty. Desert climate brings particles. Variable quality."
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

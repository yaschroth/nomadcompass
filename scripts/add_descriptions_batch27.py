#!/usr/bin/env python3
"""Batch 27: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "kampala": {
        "climate": "Kampala has a tropical climate with warm temperatures year-round (21-28°C). Two rainy seasons. Equatorial location near Lake Victoria.",
        "cost": "Moderate for East Africa. Apartments from $400-800/month. Regional hub pricing.",
        "wifi": "Improving infrastructure with speeds of 10-40 Mbps. Mobile data often better. Developing.",
        "nightlife": "Growing scene with bars and clubs. African music and international. Active.",
        "nature": "Lake Victoria and surrounding hills. Gateway to gorillas. Green and hilly city.",
        "safety": "Generally safe with standard awareness. Tourist areas comfortable. Research areas.",
        "food": "Ugandan cuisine with rolex (egg roll) famous. International options available. Affordable.",
        "community": "NGO and development community. Growing tech hub. Established networks.",
        "english": "Excellent as official language. Communication is easy.",
        "visa": "Visa on arrival or e-visa. Uganda is accessible. Tourist visa straightforward.",
        "culture": "East African hub with diverse heritage. The energy is entrepreneurial. Developing city.",
        "cleanliness": "Varies by area. Some zones well-maintained. Development ongoing.",
        "airquality": "Generally good with hills and greenery. Traffic affects some areas. Better than many African capitals."
    },
    "kathmandu": {
        "climate": "Kathmandu has a subtropical climate at 1,400m with warm summers (20-30°C) and cool winters (2-20°C). Monsoon from June to September.",
        "cost": "Very affordable with apartments from $200-450/month. Nepal offers excellent value. Budget-friendly.",
        "wifi": "Improving infrastructure with speeds of 10-40 Mbps. Thamel has best connectivity. Variable.",
        "nightlife": "Thamel has bars and restaurants. Live music and rooftop venues. Atmospheric.",
        "nature": "Himalayas visible on clear days. Gateway to Everest and Annapurna. Nature is world-class.",
        "safety": "Generally safe with tourist awareness. Political situations occasionally affect. Usually comfortable.",
        "food": "Nepali cuisine with dal bhat and momos. International in Thamel. Excellent value.",
        "community": "Established backpacker and spiritual community. Long-term travelers. Welcoming.",
        "english": "Good in tourism industry. Nepali helps locally. Communication possible.",
        "visa": "Visa on arrival available. Nepal is accessible. Extensions straightforward.",
        "culture": "Hindu and Buddhist heritage blend. Temples and stupas everywhere. Spiritual atmosphere.",
        "cleanliness": "Challenging with infrastructure limitations. Thamel maintained. Variable standards.",
        "airquality": "Can be poor especially in winter. Valley traps pollution. Check conditions before visiting."
    },
    "kauai": {
        "climate": "Kauai has a tropical climate with warm temperatures year-round (23-29°C). Trade winds moderate heat. Wettest place on earth at Mount Waialeale.",
        "cost": "Expensive as Hawaiian island. Apartments from $1800-3000/month. Island premium significant.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Hawaiian standards. Reliable.",
        "nightlife": "Very limited. Beach bars and restaurants. Garden Isle is quiet.",
        "nature": "Spectacular Na Pali coast and Waimea Canyon. The nature is world-class. Dramatic beauty.",
        "safety": "Very safe with low crime. Hawaiian aloha spirit. Very comfortable.",
        "food": "Hawaiian and Asian fusion. Fresh fish and local produce. Quality dining available.",
        "community": "Small local community. Tourists and residents mix. Island character.",
        "english": "Native American English with Hawaiian influence. No barriers.",
        "visa": "US visa rules apply. Hawaii is a US state. Standard access.",
        "culture": "Hawaiian heritage with aloha spirit. Garden Isle character. Laid-back paradise.",
        "cleanliness": "Very clean with environmental consciousness. Natural beauty preserved. Pristine.",
        "airquality": "Excellent air quality with ocean and trade winds. Among cleanest in US. Pristine."
    },
    "kl": {
        "climate": "Kuala Lumpur has an equatorial climate with hot temperatures year-round (27-35°C). Rain can occur any time. Humidity is constant.",
        "cost": "Moderate with apartments from $400-900/month. Malaysia offers value. MM2H program attractive.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Malaysia has invested. Reliable.",
        "nightlife": "Vibrant scene in Bukit Bintang and KLCC. International and local mix. Active.",
        "nature": "Batu Caves and surrounding forests. Urban but nature accessible. Day trips to highlands.",
        "safety": "Safe with standard awareness. Malaysian hospitality. Comfortable.",
        "food": "Exceptional multicultural cuisine. Malay, Chinese, Indian fusion. Outstanding food scene.",
        "community": "Large expat and digital nomad community. International hub. Established networks.",
        "english": "Excellent English proficiency. Colonial heritage. Communication easy.",
        "visa": "90 days visa-free for most. MM2H for long-term. Accessible.",
        "culture": "Multicultural capital with Petronas Towers. Malay, Chinese, and Indian blend. Modern and diverse.",
        "cleanliness": "Well-maintained modern areas. Public transport clean. Good standards.",
        "airquality": "Variable with haze season from Indonesia possible. Generally acceptable. Check conditions."
    },
    "kobe": {
        "climate": "Kobe has a humid subtropical climate with hot summers (28-33°C) and mild winters (3-10°C). Four seasons with monsoon rain in summer.",
        "cost": "Moderate for Japan. Apartments from ¥80,000-150,000/month ($530-1000). More affordable than Tokyo.",
        "wifi": "Excellent Japanese infrastructure with speeds of 100+ Mbps. Impeccable connectivity.",
        "nightlife": "Sophisticated scene in Sannomiya. Bars and restaurants. Quality over quantity.",
        "nature": "Mountains behind and sea in front. Rokko Mountain hiking. Nature accessible.",
        "safety": "Extremely safe with Japanese standards. Low crime. Very comfortable.",
        "food": "Famous Kobe beef and fresh seafood. Japanese quality. Outstanding dining.",
        "community": "International port city community. Expats established. Welcoming.",
        "english": "Limited with Japanese helpful. Tourism areas function. Learning Japanese benefits.",
        "visa": "Standard Japanese visa rules. 90 days visa-free for many. Various work visas.",
        "culture": "Historic port with cosmopolitan character. Earthquake rebuilding showed resilience. Refined atmosphere.",
        "cleanliness": "Immaculately clean with Japanese standards. Pride in appearance. Pristine.",
        "airquality": "Good air quality with sea breezes. Japanese standards. Fresh."
    },
    "kochi": {
        "climate": "Kochi (India) has a tropical monsoon climate with hot temperatures (25-35°C). Heavy monsoon June to September. Kerala weather patterns.",
        "cost": "Affordable with apartments from $250-500/month. Kerala offers value. Growing tech hub.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tech sector presence helps. Developing.",
        "nightlife": "Growing scene in Fort Kochi. Bars and cultural venues. More atmospheric than party.",
        "nature": "Arabian Sea coast and backwaters nearby. Chinese fishing nets iconic. Nature accessible.",
        "safety": "Generally safe. Kerala is India's most developed state. Comfortable.",
        "food": "Kerala cuisine with fresh seafood and coconut. Appam and fish curry. Excellent.",
        "community": "Growing tech and startup community. International tourists in Fort Kochi. Developing.",
        "english": "Good English proficiency. Kerala is educated. Communication easy.",
        "visa": "Indian e-visa available. Standard access.",
        "culture": "Colonial heritage with Portuguese, Dutch, and British layers. Fort Kochi is atmospheric. Cultural richness.",
        "cleanliness": "Better than most Indian cities. Kerala standards higher. Pleasant.",
        "airquality": "Good air quality with sea breezes. Better than northern India. Fresh coastal air."
    },
    "kohphangan": {
        "climate": "Koh Phangan has a tropical climate with warm temperatures year-round (26-32°C). Best season December to August. Monsoon affects different coasts.",
        "cost": "Affordable with apartments from $300-700/month. Thai island value. Tourism affects prices.",
        "wifi": "Improving infrastructure with speeds of 15-50 Mbps. Some areas better than others. Developing.",
        "nightlife": "Famous Full Moon Party. Beach bars and yoga scene coexist. Party and wellness mix.",
        "nature": "Tropical beaches and jungle interior. Snorkeling and hiking. Nature is beautiful.",
        "safety": "Generally safe with standard island awareness. Tourist areas comfortable. Watch for motorbike accidents.",
        "food": "Thai cuisine with fresh seafood. Healthy options for yoga crowd. Good variety.",
        "community": "Yoga, wellness, and party community. Digital nomads established. Diverse.",
        "english": "Good in tourism. Thai helps locally. Communication possible.",
        "visa": "Standard Thai visa rules. Island access via ferry or flight. Extensions possible.",
        "culture": "Party island meets wellness retreat. The duality is unique. Evolving character.",
        "cleanliness": "Beach areas maintained. Some environmental pressure from tourism. Variable.",
        "airquality": "Good air quality with sea breezes. Island freshness. Clean."
    },
    "kohsamui": {
        "climate": "Koh Samui has a tropical climate with warm temperatures year-round (26-33°C). Different monsoon pattern from other Thai islands. Best December to April.",
        "cost": "Moderate for Thailand. Apartments from $400-900/month. Upscale island premium.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Tourist development ensures connectivity. Reliable.",
        "nightlife": "Beach clubs and bars in Chaweng. More upscale than Phangan. Active scene.",
        "nature": "Beautiful beaches and Ang Thong Marine Park nearby. Waterfalls and viewpoints. Nature excellent.",
        "safety": "Safe tourist island. Thai hospitality. Comfortable throughout.",
        "food": "Thai cuisine with international options. Fresh seafood. Quality varies by area.",
        "community": "Expat and tourism community. Wellness retreats established. International.",
        "english": "Good in tourism industry. Thai helps deeper connection. Communication easy.",
        "visa": "Standard Thai visa rules. Direct flights available. Easy access.",
        "culture": "Thai beach culture with Big Buddha temple. More developed than neighbors. Resort island character.",
        "cleanliness": "Tourist areas well-maintained. Beach cleaning regular. Good standards.",
        "airquality": "Good air quality with ocean breezes. Island freshness. Clean."
    },
    "krabi": {
        "climate": "Krabi has a tropical climate with hot temperatures (27-34°C). Dry season November to March. Monsoon can be dramatic.",
        "cost": "Affordable with apartments from $300-600/month. Thailand value. Less expensive than Phuket.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Reliable.",
        "nightlife": "Ao Nang has bars and restaurants. More relaxed than Phuket. Beach town atmosphere.",
        "nature": "Stunning limestone karsts and islands. Railay Beach is world-famous. Nature is spectacular.",
        "safety": "Safe tourist area. Thai hospitality applies. Comfortable.",
        "food": "Thai cuisine with fresh seafood. Southern Thai flavors. Good value.",
        "community": "Rock climbing and beach community. Digital nomads present. Developing.",
        "english": "Good in tourism areas. Thai helps locally. Communication possible.",
        "visa": "Standard Thai visa rules. Airport serves area. Easy access.",
        "culture": "Thai beach culture with dramatic landscape. The karsts define the area. Natural beauty focus.",
        "cleanliness": "Beaches maintained. Tourism helps standards. Good.",
        "airquality": "Excellent air quality with sea breezes. Clean coastal environment. Fresh."
    },
    "krakow": {
        "climate": "Krakow has a humid continental climate with warm summers (20-26°C) and cold winters (-4 to 3°C). Four distinct seasons. Snow in winter.",
        "cost": "Affordable for Europe. Apartments from €400-700/month. Polish value with historic charm.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Poland has invested. Reliable.",
        "nightlife": "Vibrant scene in Kazimierz and old town. Student energy. Very active.",
        "nature": "Vistula River and Tatra Mountains accessible. Day trips to nature. Accessible.",
        "safety": "Very safe with low crime. Polish hospitality. Comfortable throughout.",
        "food": "Polish cuisine with pierogi and zapiekanka. Growing food scene. Affordable quality.",
        "community": "Large student and expat community. Tech growing. Established networks.",
        "english": "Good among younger Poles. Tourism industry fluent. Communication easy.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "UNESCO old town and Jewish heritage. Auschwitz nearby. Cultural depth and weight.",
        "cleanliness": "Old town beautifully maintained. Pride in heritage. Excellent.",
        "airquality": "Can be poor in winter due to heating. Summer is fine. Check winter conditions."
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

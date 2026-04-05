#!/usr/bin/env python3
"""Batch 25: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "haifa": {
        "climate": "Haifa has a Mediterranean climate with hot summers (28-32°C) and mild winters (10-18°C). Mount Carmel creates microclimates. Pleasant most of the year.",
        "cost": "Moderate for Israel. Apartments from $800-1400/month. More affordable than Tel Aviv.",
        "wifi": "Good Israeli infrastructure with speeds of 50-100 Mbps. Tech nation connectivity. Reliable.",
        "nightlife": "Growing scene with German Colony and downtown options. More relaxed than Tel Aviv. Developing.",
        "nature": "Mount Carmel and beaches. Bahá'í Gardens are stunning. Nature is accessible.",
        "safety": "Generally safe with Israeli security context. Tourist areas comfortable. Awareness needed.",
        "food": "Diverse cuisine reflecting mixed population. Middle Eastern and Mediterranean. Quality options.",
        "community": "Tech and academic community. Mixed Arab-Jewish population. Universities attract international.",
        "english": "Good English alongside Hebrew and Arabic. Communication easy.",
        "visa": "90 days visa-free for most Western nationalities. Israel is accessible.",
        "culture": "Bahá'í World Centre and coexistence city. The gardens are world famous. Diverse heritage.",
        "cleanliness": "Well-maintained especially tourist areas. The gardens are pristine. Good standards.",
        "airquality": "Good air quality with sea and mountain breezes. Better than inland. Fresh."
    },
    "hamburg": {
        "climate": "Hamburg has a temperate oceanic climate with cool summers (17-23°C) and mild winters (0-5°C). The Elbe and maritime influence bring rain. Four seasons.",
        "cost": "Expensive as major German city. Apartments from €900-1500/month. High demand.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Business hub connectivity. Reliable.",
        "nightlife": "Famous Reeperbahn and St. Pauli scene. Live music heritage from Beatles era. Very active.",
        "nature": "Elbe River and harbor. Lakes within city. Day trips to North Sea possible.",
        "safety": "Safe with standard urban awareness. Reeperbahn can be rough. Generally comfortable.",
        "food": "Fish markets and international cuisine. Harbor influences. Quality German and global options.",
        "community": "Creative, media, and business community. International port city. Established networks.",
        "english": "Good English proficiency. German helps deeper connection. Communication easy.",
        "visa": "Schengen rules apply. German freelance visa options. Standard access.",
        "culture": "Maritime heritage and modern media hub. Beatles connection. Distinctive northern German character.",
        "cleanliness": "Well-maintained with German standards. Harbor areas cleaned. Good.",
        "airquality": "Good air quality with maritime breezes. Port activities contained. Fresh."
    },
    "hamilton": {
        "climate": "Hamilton (New Zealand) has a temperate oceanic climate with warm summers (20-25°C) and mild winters (8-14°C). Waikato region is fertile. Rain is common.",
        "cost": "More affordable than Auckland. Rents from NZD 1400-2200/month. Good value for NZ.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. NZ connectivity. Reliable.",
        "nightlife": "University town scene with bars and venues. Hamilton Gardens area. Relaxed.",
        "nature": "Waikato River and surrounding countryside. Hobbiton and Waitomo nearby. Nature accessible.",
        "safety": "Very safe with low crime. Kiwi friendliness. Comfortable.",
        "food": "Growing food scene with local produce. Waikato farming region. Quality available.",
        "community": "University and agricultural community. Growing diversity. Welcoming.",
        "english": "Native English with Kiwi character. No barriers. Friendly.",
        "visa": "NZ visa rules apply. Working holiday and skills visas. Various options.",
        "culture": "University town with Maori heritage strong. Waikato region identity. Relaxed NZ culture.",
        "cleanliness": "Clean with NZ standards. Gardens are well-maintained. Good.",
        "airquality": "Excellent air quality with rural surroundings. Fresh Waikato air. Pristine."
    },
    "hannover": {
        "climate": "Hannover has a temperate oceanic climate with mild summers (18-24°C) and cold winters (-1 to 5°C). Northern German plains weather. Rain is common.",
        "cost": "Moderate for Germany. Apartments from €600-1000/month. More affordable than Munich or Berlin.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Trade fair city connectivity. Reliable.",
        "nightlife": "University scene with various options. Linden district has character. Functional rather than famous.",
        "nature": "Herrenhausen Gardens and surrounding countryside. Green spaces within city. Nature accessible.",
        "safety": "Very safe with low crime. German order. Comfortable throughout.",
        "food": "German cuisine with regional specialties. International options available. Standard quality.",
        "community": "Trade fair and business community. University brings diversity. Functional.",
        "english": "Good English proficiency. German helps. Communication easy.",
        "visa": "Schengen rules apply. German freelance visa options. Standard access.",
        "culture": "Trade fair capital with garden heritage. Practical German character. Less touristy.",
        "cleanliness": "Well-maintained with German standards. Gardens are pristine. Good.",
        "airquality": "Good air quality for northern Germany. Plains provide ventilation. Clean."
    },
    "havana": {
        "climate": "Havana has a tropical climate with warm temperatures year-round (24-32°C). Hurricane season from June to November. Humidity is constant.",
        "cost": "Complex due to dual economy. Private rentals from $300-700/month. Costs vary based on access.",
        "wifi": "Limited infrastructure with public wifi hotspots. Speeds of 1-10 Mbps. Challenging for remote work.",
        "nightlife": "Famous scene with live music and salsa everywhere. Rum and music culture. Legendary.",
        "nature": "Malecón seafront and nearby beaches. Viñales day trips. Caribbean beauty.",
        "safety": "Very safe for Latin America. Tourist areas well-patrolled. Comfortable.",
        "food": "Cuban cuisine with rice, beans, and pork. Paladares offer quality. Variety limited but improving.",
        "community": "Growing digital presence as internet expands. Artists and musicians. Unique community.",
        "english": "Limited with Spanish essential. Tourism has some English. Learning Spanish important.",
        "visa": "Tourist card required. Cuba regulations are specific. Check current rules.",
        "culture": "Revolutionary history meets Caribbean joy. The music, cars, and architecture are iconic. Unforgettable.",
        "cleanliness": "Crumbling beauty is part of charm. Some infrastructure challenges. Varies.",
        "airquality": "Good air quality with sea breezes. Limited industry. Fresh Caribbean air."
    },
    "heidelberg": {
        "climate": "Heidelberg has a temperate climate with warm summers (20-26°C) and mild winters (0-6°C). One of Germany's warmest cities. The Neckar valley affects weather.",
        "cost": "Moderate for Germany. Apartments from €700-1200/month. University town demand.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. University ensures connectivity. Reliable.",
        "nightlife": "Student scene in the old town. Atmospheric bars along the river. Charming.",
        "nature": "Neckar River and surrounding hills. Philosophers' Walk has views. Nature accessible.",
        "safety": "Very safe with low crime. University atmosphere. Very comfortable.",
        "food": "German cuisine with student-friendly options. Quality varies. Atmospheric dining available.",
        "community": "University and research community. International students. Established networks.",
        "english": "Good English with academic influence. German helps locally. Communication easy.",
        "visa": "Schengen rules apply. German student and freelance visas. Standard access.",
        "culture": "Romantic Germany with castle ruins and old university. Poets and philosophers. Historic atmosphere.",
        "cleanliness": "Beautifully maintained old town. Tourism drives standards. Pristine.",
        "airquality": "Good air quality with river valley. Mountains provide shelter. Fresh."
    },
    "hobart": {
        "climate": "Hobart has a temperate oceanic climate with cool summers (18-22°C) and cold winters (5-12°C). Tasmania is Australia's coolest state. Four seasons.",
        "cost": "Moderate for Australia. Rents from AUD 1400-2200/month. More affordable than mainland cities.",
        "wifi": "Good infrastructure with NBN available. Speeds of 40-80 Mbps. Improving.",
        "nightlife": "Growing scene around Salamanca and waterfront. MONA has transformed culture. Developing.",
        "nature": "Mount Wellington and wilderness nearby. Tasmania is nature-focused. Spectacular surroundings.",
        "safety": "Very safe with low crime. Tasmanian hospitality. Very comfortable.",
        "food": "Exceptional food scene with local produce. Cool climate wines and seafood. Outstanding quality.",
        "community": "Creative and food community. MONA attracts artists. Growing tech presence.",
        "english": "Native Australian English. No barriers. Friendly island character.",
        "visa": "Australian visa rules apply. Working holiday visas. Standard access.",
        "culture": "Colonial heritage meets MONA modern art revolution. Tasmania's capital finding new identity. Creative energy.",
        "cleanliness": "Very clean with pristine surroundings. Tasmanian standards. Excellent.",
        "airquality": "Excellent air quality with Antarctic winds. Among world's cleanest air. Pristine."
    },
    "hoian": {
        "climate": "Hoi An has a tropical monsoon climate with warm temperatures (22-34°C). Best season from February to July. Flooding possible in rainy season.",
        "cost": "Affordable with apartments from $300-600/month. Vietnam offers value. Tourism affects prices.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Lantern-lit old town atmosphere. Riverside bars and restaurants. Charming not party.",
        "nature": "Ancient town meets beach at An Bang. Rice paddies surround. Beautiful surroundings.",
        "safety": "Very safe with Vietnamese hospitality. Tourist town is welcoming. Comfortable.",
        "food": "Central Vietnamese cuisine is exceptional. Cao lầu and white rose. Outstanding local food.",
        "community": "Established expat community. Artists and teachers. Welcoming atmosphere.",
        "english": "Good in tourism industry. Vietnamese helps deeper connection. Communication possible.",
        "visa": "Standard Vietnamese visa rules. E-visa available. Easy access.",
        "culture": "UNESCO Ancient Town with lanterns and tailors. Japanese, Chinese, and Vietnamese heritage blend. Magical atmosphere.",
        "cleanliness": "Old town is well-maintained. UNESCO protection. Beautiful.",
        "airquality": "Good air quality with coastal breezes. Less industrial. Fresh."
    },
    "hongkong": {
        "climate": "Hong Kong has a humid subtropical climate with hot summers (28-33°C) and mild winters (14-20°C). Typhoon season from May to November. Humidity is intense.",
        "cost": "Very expensive with apartments from HKD 15000-25000/month ($1900-3200). Among world's costliest housing.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. Global connectivity hub. Impeccable.",
        "nightlife": "World-class scene from Lan Kwai Fong to rooftop bars. Vibrant until late. Legendary.",
        "nature": "Surprising amount of hiking and beaches. Country parks cover much of territory. Nature accessible.",
        "safety": "Very safe with low crime. Well-organized society. Very comfortable.",
        "food": "World-class dining from street food to Michelin stars. Dim sum and roast goose. Outstanding.",
        "community": "Global business and finance community. International hub. Established networks.",
        "english": "Excellent alongside Cantonese and Mandarin. Communication easy.",
        "visa": "90 days visa-free for most nationalities. Easy access. Work visas competitive.",
        "culture": "East meets West in dramatic fashion. Skyscrapers, temples, and markets. Dynamic energy.",
        "cleanliness": "Very clean with high standards. Public transport is pristine. Excellent.",
        "airquality": "Variable with pollution from mainland sometimes affecting. Can be poor. Check conditions."
    },
    "houston": {
        "climate": "Houston has a humid subtropical climate with hot summers (30-38°C) and mild winters (8-18°C). Humidity is intense. Hurricane risk exists.",
        "cost": "Moderate for US. Apartments from $1200-2000/month. No state income tax benefits.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Business hub connectivity. Reliable.",
        "nightlife": "Diverse scene across neighborhoods. Montrose has character. Spread out city.",
        "nature": "Urban but Gulf Coast beaches accessible. Space Center and beyond. Car needed for nature.",
        "safety": "Varies significantly by area. Research neighborhoods. Standard US urban awareness.",
        "food": "Exceptional diversity with Tex-Mex, Vietnamese, and BBQ. Food scene is excellent. Great value.",
        "community": "Diverse international community. Energy sector and medical center. Large and varied.",
        "english": "Native American English. Spanish also common. No barriers.",
        "visa": "Standard US visa rules. Various categories. Competitive.",
        "culture": "Space City with energy industry. Museum district is excellent. Diverse and sprawling.",
        "cleanliness": "Varies by area. Downtown and museums maintained. Suburban sprawl varies.",
        "airquality": "Can be affected by humidity and industry. Variable quality. Check conditions."
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

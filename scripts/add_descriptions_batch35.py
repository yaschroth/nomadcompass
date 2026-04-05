#!/usr/bin/env python3
"""Batch 35: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "philadelphia": {
        "climate": "Philadelphia has a humid subtropical climate with hot summers (28-33°C) and cold winters (-2 to 6°C). Four seasons. East coast weather.",
        "cost": "Moderate for US East Coast. Apartments from $1300-2100/month. More affordable than NYC.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Reliable.",
        "nightlife": "Vibrant scene in Center City and Fishtown. Craft beer culture. Active.",
        "nature": "Schuylkill River Trail and Fairmount Park. Day trips to mountains. Nature accessible.",
        "safety": "Varies by neighborhood. Center City is comfortable. Research areas.",
        "food": "Cheesesteaks and growing food scene. Italian Market. Quality available.",
        "community": "Tech, education, and arts community. Diverse and growing. Welcoming.",
        "english": "Native American English. No barriers.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "American independence birthplace. Rocky steps and Ben Franklin. Historic pride.",
        "cleanliness": "Center City maintained. Varies by area. Standard urban.",
        "airquality": "Moderate with some traffic effects. Acceptable for East Coast."
    },
    "piran": {
        "climate": "Piran has a Mediterranean climate with warm summers (26-30°C) and mild winters (6-12°C). Slovenian Riviera. Pleasant year-round.",
        "cost": "Moderate with apartments from €500-900/month. Slovenia is reasonable. Summer premium.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Charming Venetian piazza scene. Bars and restaurants. Atmospheric.",
        "nature": "Adriatic coast and Slovenian hills. Karst region nearby. Nature beautiful.",
        "safety": "Very safe with low crime. Slovenian hospitality. Comfortable.",
        "food": "Mediterranean seafood and Slovenian cuisine. Quality restaurants.",
        "community": "Small tourism community. Quiet outside summer. Intimate.",
        "english": "Good English proficiency. Communication easy.",
        "visa": "Schengen rules apply. Slovenia is EU. Standard access.",
        "culture": "Venetian heritage on Slovenian coast. Tartini Square is stunning. Charming identity.",
        "cleanliness": "Very clean and maintained. Pride in appearance. Excellent.",
        "airquality": "Excellent air quality with sea breezes. Clean coastal air."
    },
    "plzen": {
        "climate": "Plzeň has a humid continental climate with warm summers (18-25°C) and cold winters (-4 to 2°C). Czech weather patterns. Four seasons.",
        "cost": "Very affordable with apartments from €300-500/month. Czech value outside Prague.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Beer is the star - Pilsner Urquell hometown. Bars and brewery tours. Active.",
        "nature": "Bohemian Forest nearby. Surrounding countryside. Nature accessible.",
        "safety": "Very safe with low crime. Czech hospitality. Comfortable.",
        "food": "Czech cuisine with world-famous beer. Hearty and affordable.",
        "community": "University and beer tourism community. Less touristy than Prague. Authentic.",
        "english": "Good among younger Czechs. Less English than Prague. Communication possible.",
        "visa": "Schengen rules apply. Czech Republic is EU. Standard access.",
        "culture": "Birthplace of Pilsner beer. Industrial heritage. Beer defines identity.",
        "cleanliness": "City center maintained. Czech standards. Good.",
        "airquality": "Good air quality with countryside surroundings. Fresh Bohemian air."
    },
    "pokhara": {
        "climate": "Pokhara has a subtropical climate at 800m with warm temperatures (15-30°C). Lake moderates climate. Monsoon season June to September.",
        "cost": "Very affordable with apartments from $150-350/month. Nepal offers excellent value.",
        "wifi": "Basic infrastructure with speeds of 10-30 Mbps. Lakeside has better connectivity. Developing.",
        "nightlife": "Lakeside bars and restaurants. Relaxed traveler scene. Active.",
        "nature": "Himalayan views with Annapurna range. Lakes and paragliding. Nature spectacular.",
        "safety": "Very safe with Nepali hospitality. Peaceful lakeside. Comfortable.",
        "food": "Nepali and international cuisine. Dal bhat and traveler fare. Affordable.",
        "community": "Trekking and adventure community. Long-term travelers. Welcoming.",
        "english": "Good in tourism. Nepali helps locally.",
        "visa": "Visa on arrival. Nepal accessible. Extensions straightforward.",
        "culture": "Adventure capital with lake serenity. The mountains define everything. Peaceful energy.",
        "cleanliness": "Lakeside maintained for tourism. Variable elsewhere. Tourist standards.",
        "airquality": "Good air quality with mountains. Better than Kathmandu. Fresh."
    },
    "ponza": {
        "climate": "Ponza has a Mediterranean climate with hot summers (28-33°C) and mild winters (10-16°C). Italian island. Beach weather most of year.",
        "cost": "Expensive in summer. Apartments from €600-1200/month. Island premium.",
        "wifi": "Basic island infrastructure with speeds of 15-40 Mbps. Improving.",
        "nightlife": "Small harbor scene. Bars and restaurants. Italian summer evenings.",
        "nature": "Beautiful island beaches and coves. Crystal clear water. Nature stunning.",
        "safety": "Very safe island. Italian hospitality. Comfortable.",
        "food": "Fresh seafood and Italian cuisine. Island specialties. Quality.",
        "community": "Italian summer community. Locals and visitors. Seasonal.",
        "english": "Limited with Italian essential.",
        "visa": "Schengen rules apply. Italy. Standard access.",
        "culture": "Roman-era island with fishing heritage. Chic Italian summer retreat. Authentic character.",
        "cleanliness": "Beach and harbor maintained. Tourism standards. Good.",
        "airquality": "Excellent island air quality. Sea breezes. Pristine."
    },
    "portland": {
        "climate": "Portland (Oregon) has a temperate oceanic climate with mild temperatures (5-27°C). Pacific Northwest rain. Grey winters.",
        "cost": "Moderate for US West Coast. Apartments from $1500-2400/month. Growing city prices.",
        "wifi": "Excellent US infrastructure with speeds of 100+ Mbps. Tech presence. Reliable.",
        "nightlife": "Vibrant scene with craft beer and music. Keep Portland Weird. Active.",
        "nature": "Surrounded by mountains and forests. Columbia River Gorge. Nature spectacular.",
        "safety": "Generally safe with some areas to avoid. Downtown has challenges. Comfortable overall.",
        "food": "Food cart culture and farm-to-table excellence. Outstanding variety.",
        "community": "Creative and tech community. Progressive character. Welcoming.",
        "english": "Native American English. No barriers.",
        "visa": "US visa rules apply. Various categories.",
        "culture": "Keep Portland Weird ethos. Craft everything. Quirky progressive character.",
        "cleanliness": "Downtown has some challenges. Neighborhoods vary. Mixed.",
        "airquality": "Good generally. Wildfire smoke season affects summer. Usually fresh."
    },
    "portodoportugal": {
        "climate": "Porto has an oceanic climate with mild temperatures (8-25°C). Atlantic influence. Rain is common in winter.",
        "cost": "Moderate with apartments from €600-1000/month. More affordable than Lisbon. Rising.",
        "wifi": "Good Portuguese infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Vibrant scene in Ribeira and Galerias. Port wine bars. Very active.",
        "nature": "Douro River and Atlantic coast. Wine region accessible. Nature beautiful.",
        "safety": "Very safe with low crime. Portuguese hospitality. Comfortable.",
        "food": "Francesinha and seafood excellence. Port wine. Outstanding.",
        "community": "Growing digital nomad and creative community. Established networks.",
        "english": "Good English proficiency. Communication easy. Portuguese enriches.",
        "visa": "Schengen rules apply. Portuguese D7 and digital nomad visas. Popular.",
        "culture": "UNESCO Ribeira and azulejos. Harry Potter bookshop. Cultural richness.",
        "cleanliness": "Historic center maintained. Tourism drives standards. Good.",
        "airquality": "Good air quality with Atlantic breezes. Fresh."
    },
    "portosanto": {
        "climate": "Porto Santo has a subtropical climate with mild temperatures (18-26°C). Drier than Madeira. Beach island weather.",
        "cost": "Moderate with apartments from €500-900/month. Island costs. Less developed than Madeira.",
        "wifi": "Good infrastructure with speeds of 30-60 Mbps. Portugal invested. Reliable.",
        "nightlife": "Very limited. Small beach bars. Quiet island.",
        "nature": "9km golden beach is the draw. Volcanic landscape. Nature simple but beautiful.",
        "safety": "Very safe small island. Portuguese hospitality. Comfortable.",
        "food": "Portuguese seafood and island fare. Quality available.",
        "community": "Small local and visitor community. Quiet retreat. Intimate.",
        "english": "Good English. Tourism ensures communication.",
        "visa": "Schengen rules apply. Portuguese visas. Standard access.",
        "culture": "Christopher Columbus lived here. Beach-focused island. Simple character.",
        "cleanliness": "Beach and town maintained. Island pride. Good.",
        "airquality": "Excellent air quality with Atlantic winds. Pristine."
    },
    "poznan": {
        "climate": "Poznań has a humid continental climate with warm summers (18-25°C) and cold winters (-4 to 2°C). Polish weather. Four seasons.",
        "cost": "Affordable for Europe. Apartments from €400-700/month. Polish value.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Poland investing. Reliable.",
        "nightlife": "University scene with bars and clubs. Old town has atmosphere. Active.",
        "nature": "Lakes and surrounding countryside. Malta Lake recreation. Nature accessible.",
        "safety": "Very safe with low crime. Polish hospitality. Comfortable.",
        "food": "Polish cuisine with rogal świętomarciński. Growing food scene. Affordable.",
        "community": "University and business community. International presence. Welcoming.",
        "english": "Good among younger Poles. Communication possible.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "Where Poland began. Trade fair city. Historic and modern blend.",
        "cleanliness": "Old town maintained. Polish standards. Good.",
        "airquality": "Can be affected by heating in winter. Better in summer. Variable."
    },
    "pristina": {
        "climate": "Pristina has a humid continental climate with hot summers (22-30°C) and cold winters (-4 to 3°C). Kosovo weather. Four seasons.",
        "cost": "Very affordable with apartments from €200-400/month. Kosovo offers excellent value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Developing. Improving.",
        "nightlife": "Growing cafe and bar scene. Young population adds energy. Developing.",
        "nature": "Surrounding mountains. Day trips to countryside. Nature available.",
        "safety": "Generally safe. European presence provides stability. Comfortable.",
        "food": "Balkan cuisine with Turkish influences. Affordable and hearty.",
        "community": "Young and dynamic population. NGO and international presence. Growing.",
        "english": "Good English especially among youth. Communication possible.",
        "visa": "90 days visa-free for most. Kosovo accessible. Unique status.",
        "culture": "Youngest country in Europe. Newborn monument. Youthful energy and resilience.",
        "cleanliness": "Central areas improving. Development ongoing. Variable.",
        "airquality": "Can be affected by lignite power plants. Winter worse. Check conditions."
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

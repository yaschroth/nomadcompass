#!/usr/bin/env python3
"""Batch 5: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "losangeles": {
        "climate": "LA has a Mediterranean climate with mild, wet winters and warm, dry summers. Temperatures typically range 15-30°C throughout the year. The sunshine is reliable with over 280 sunny days annually.",
        "cost": "One of the most expensive US cities with apartments from $2000-3500/month. Dining varies widely from cheap tacos to high-end restaurants. A car is almost essential which adds to costs.",
        "wifi": "Excellent internet infrastructure with speeds of 100+ Mbps readily available. Cafés in areas like Silver Lake and Santa Monica are laptop-friendly. Home connections are fast and reliable.",
        "nightlife": "Hollywood and West Hollywood offer legendary nightlife scenes. Rooftop bars, beach parties, and celebrity-spotting define the experience. The scene is spread across the sprawling city.",
        "nature": "Beaches, mountains, and desert are all within reach. Griffith Park and Santa Monica Mountains offer hiking. The outdoor lifestyle is a defining feature of LA life.",
        "safety": "Safety varies significantly by neighborhood. Tourist areas and affluent neighborhoods are generally safe. Homelessness is visible in certain areas. Car break-ins are common.",
        "food": "Incredible diversity from Mexican and Korean to Persian and Ethiopian. The taco culture is legendary. Farm-to-table dining thrives with year-round local produce.",
        "community": "Large creative and tech communities with endless networking opportunities. Venice and Santa Monica have strong nomad presences. The entertainment industry drives much of the culture.",
        "english": "Native English with Spanish widely spoken. The multicultural population speaks many languages. Business operates primarily in English.",
        "visa": "Standard US visa rules apply with ESTA for many nationalities. Entertainment industry visas are common. The city attracts international talent.",
        "culture": "Entertainment capital of the world where dreams are pursued. Diverse cultures create distinct neighborhoods. Beach culture, wellness, and creativity define the lifestyle.",
        "cleanliness": "Varies by area with beach communities well-maintained. Some urban areas struggle with litter and homelessness. The sprawl means inconsistent standards.",
        "airquality": "Historically smoggy but improved significantly. Valley areas can trap pollution. Coastal breezes keep beach communities fresh."
    },
    "sanfrancisco": {
        "climate": "SF has a unique microclimate with cool temperatures year-round averaging 12-18°C. The famous fog rolls in, especially in summer. Layers are essential as weather changes block to block.",
        "cost": "One of the world's most expensive cities with rents from $2500-4500+/month. Tech salaries offset costs for some. Dining and entertainment are premium priced.",
        "wifi": "Excellent tech hub connectivity with speeds of 100+ Mbps standard. The tech culture means every café has reliable wifi. Home connections can reach gigabit speeds.",
        "nightlife": "Diverse scene from dive bars to craft cocktail lounges. The Mission and SOMA have vibrant options. The scene is more subdued than LA but has character.",
        "nature": "Stunning natural beauty with beaches, parks, and nearby mountains. Golden Gate Park and the Presidio offer urban nature. Day trips to wine country and Yosemite are popular.",
        "safety": "Property crime and car break-ins are significant issues. Some areas have visible homelessness and drug use. Most neighborhoods are safe for walking during the day.",
        "food": "Pioneer of farm-to-table dining with incredible food diversity. Chinatown and Mission district offer authentic cuisines. The food scene rivals any US city.",
        "community": "Massive tech community with constant networking events and startups. Coworking spaces are everywhere. The nomad community overlaps heavily with tech workers.",
        "english": "Native English with tech jargon ubiquitous. Multilingual population adds diversity. Business is conducted entirely in English.",
        "visa": "Standard US visa rules with many tech visas. The startup culture attracts international talent. H1-B visas are common in the industry.",
        "culture": "Progressive, tech-obsessed, and health-conscious culture. Innovation and disruption are celebrated. The city has a proud history of counterculture and activism.",
        "cleanliness": "Varies significantly with some areas well-maintained and others challenging. Tenderloin and parts of SOMA have issues. Parks and tourist areas are better kept.",
        "airquality": "Generally good but wildfire season can bring hazardous smoke. The fog helps clean the air. Climate change has increased fire-related air quality issues."
    },
    "austin": {
        "climate": "Austin has a humid subtropical climate with hot summers reaching 35-40°C. Winters are mild at 5-15°C. Spring and fall offer ideal weather. The heat from May to September is intense.",
        "cost": "Once affordable, Austin has become expensive with rents from $1500-2500/month. The tech boom has driven up costs. Still more affordable than coastal tech hubs.",
        "wifi": "Excellent internet with fiber available in many areas. The tech presence ensures reliable connectivity everywhere. Cafés and coworking spaces have strong connections.",
        "nightlife": "Live music capital of the world with venues on every block of 6th Street. The scene spans genres from country to electronic. SXSW brings the world annually.",
        "nature": "Barton Springs, Lake Travis, and surrounding Hill Country offer outdoor escapes. The green belts provide hiking and swimming. Nature is integrated into city life.",
        "safety": "Generally safe with low violent crime. Sixth Street can get rowdy on weekends. Normal urban precautions apply in downtown areas.",
        "food": "BBQ is king but the food scene has become diverse and sophisticated. Tacos are a way of life. Food trucks and unique concepts thrive.",
        "community": "Massive tech and creative communities have merged with native Austin culture. Coworking spaces are abundant. The 'Keep Austin Weird' ethos persists despite growth.",
        "english": "Native English with Texas character. Spanish is common due to proximity to Mexico. The tech influx has diversified accents.",
        "visa": "Standard US visa rules apply. The tech industry sponsors many visas. Texas has no state income tax which attracts workers.",
        "culture": "Music, tech, and Texas culture create a unique blend. The creative scene is vibrant and accessible. Outdoor activities and wellness are priorities.",
        "cleanliness": "Generally clean with well-maintained parks and public spaces. Some downtown areas show wear. The rapid growth has strained infrastructure.",
        "airquality": "Generally good air quality with occasional allergen issues. Cedar fever in winter affects many residents. Summer heat can trap ozone."
    },
    "toronto": {
        "climate": "Toronto has a humid continental climate with cold winters (-5 to -15°C) and warm summers (20-30°C). The lake moderates extremes but winters are still harsh. Four distinct seasons offer variety.",
        "cost": "Canada's most expensive city with rents from CAD 2000-3500/month. Dining and entertainment are reasonably priced. Healthcare is covered by provincial insurance for residents.",
        "wifi": "Excellent internet infrastructure with speeds of 50-150 Mbps common. Cafés throughout downtown are work-friendly. Home fiber connections are available.",
        "nightlife": "Diverse nightlife from Queen West bars to King West clubs. The multicultural population creates varied scenes. Entertainment district offers mainstream options.",
        "nature": "Lake Ontario waterfront and ravine system provide urban nature. Toronto Islands offer an escape. Day trips to Niagara Falls and cottage country are popular.",
        "safety": "Very safe city with low crime rates by North American standards. Some areas require normal urban awareness. The city is well-policed and welcoming.",
        "food": "Incredible diversity with every cuisine represented authentically. Chinatown, Little Italy, and ethnic enclaves offer exploration. The food scene has gained international recognition.",
        "community": "Large and diverse international community. Tech scene is growing rapidly. Coworking spaces are abundant in downtown core.",
        "english": "English is primary with French as second official language. The multicultural population speaks hundreds of languages. Business operates in English.",
        "visa": "Various visa options including working holiday for many nationalities. The startup visa program attracts entrepreneurs. Immigration is relatively accessible.",
        "culture": "Multicultural mosaic with over 200 ethnic origins represented. The arts scene is world-class. Toronto prides itself on diversity and inclusion.",
        "cleanliness": "Generally clean with good public services. Snow removal is efficient in winter. Downtown core is well-maintained.",
        "airquality": "Generally good but can be affected by industrial pollution and summer smog. Lake breezes help clear the air. Air quality has improved over decades."
    },
    "vancouver": {
        "climate": "Vancouver has a mild oceanic climate with cool, rainy winters and pleasant summers. Rain is frequent from October to April but temperatures rarely drop below freezing. Summer temperatures reach 20-25°C.",
        "cost": "Extremely expensive with rents from CAD 2200-3800/month. The housing market is among the world's priciest. Nature activities are affordable as compensation.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps typical. Cafés downtown and in neighborhoods have reliable connections. Home internet is consistent.",
        "nightlife": "More relaxed than Toronto with Granville Street and Gastown offering options. Craft beer and cocktail scenes are strong. The city favors quality over quantity.",
        "nature": "Arguably the world's best urban nature access with mountains, ocean, and forests. Stanley Park is iconic. Skiing, hiking, and water sports are all accessible from downtown.",
        "safety": "Very safe overall though Downtown Eastside has visible drug issues. Bike theft is common. Most neighborhoods are welcoming and secure.",
        "food": "Asian food excellence due to large Chinese and Japanese populations. Fresh seafood from Pacific waters. The farm-to-table movement is strong.",
        "community": "Growing tech community, especially in gaming and VFX. The outdoor lifestyle attracts a health-conscious crowd. Coworking options are developing.",
        "english": "English is primary with Chinese languages widely spoken. French is official but rarely used locally. Business operates in English.",
        "visa": "Canadian visa rules apply. Working holiday and startup visas available. The city attracts many international students.",
        "culture": "Pacific Northwest culture blends with Asian influences. Outdoor lifestyle defines the identity. Environmental consciousness is strong.",
        "cleanliness": "Very clean with strong environmental values. Some downtown areas affected by homelessness. Nature areas are well-preserved.",
        "airquality": "Generally excellent but wildfire season can bring dangerous smoke levels. The rainforest location usually ensures clean air. Climate change has increased fire risks."
    },
    "montreal": {
        "climate": "Montreal has harsh winters (-10 to -20°C) and humid summers (25-30°C). The underground city helps cope with winter. Four seasons bring dramatic changes.",
        "cost": "Most affordable major Canadian city with rents from CAD 1200-2000/month. Dining and culture are reasonably priced. The value for quality of life is excellent.",
        "wifi": "Good internet with speeds of 40-80 Mbps typical. The café culture supports laptop workers. Home connections are reliable.",
        "nightlife": "Legendary nightlife with clubs like Stereo and diverse bar scenes. The drinking age of 18 creates youthful energy. The Plateau and downtown pulse with activity.",
        "nature": "Mount Royal park provides urban nature. The Laurentians offer skiing and hiking nearby. Summer festivals make the most of warm months.",
        "safety": "Very safe with low crime rates. Some areas require normal urban awareness. The city is generally welcoming to visitors.",
        "food": "French culinary heritage meets diverse immigrant cuisines. Bagels and smoked meat are iconic. The restaurant scene rivals any North American city.",
        "community": "Vibrant creative community with affordable living attracting artists and entrepreneurs. The tech scene is growing. French-English dynamic creates unique culture.",
        "english": "French is primary but English widely spoken, especially downtown. Bill 101 requires French signage. Many residents are bilingual.",
        "visa": "Canadian visa rules apply. Quebec has additional immigration requirements. The unique culture attracts international visitors.",
        "culture": "European feel in North America with distinct Québécois identity. Festivals throughout the year celebrate arts and culture. The city has a creative, bohemian spirit.",
        "cleanliness": "Generally clean with infrastructure challenges from harsh winters. Snow removal is efficient. The underground city provides clean indoor connections.",
        "airquality": "Good air quality with cold winters bringing fresh air. Summer smog occasionally affects the region. The green spaces help clean the air."
    },
    "denver": {
        "climate": "Denver has a semi-arid climate with sunny days year-round. Summers reach 30-35°C while winters bring snow but often sunny skies at -5 to 5°C. The altitude means intense sun.",
        "cost": "Costs have risen significantly with rents from $1500-2500/month. The outdoor lifestyle is affordable. Overall more accessible than coastal cities.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps available. The tech growth has improved connectivity throughout. Coffee shops are work-friendly.",
        "nightlife": "LoDo and RiNo districts offer vibrant options from craft breweries to clubs. The legal cannabis adds a unique dimension. The scene is social and active.",
        "nature": "World-class outdoor access with the Rocky Mountains just an hour away. City parks and trails are abundant. Skiing, hiking, and camping are weekend activities.",
        "safety": "Generally safe with some property crime. Homeless population is visible in certain areas. Most neighborhoods are family-friendly and secure.",
        "food": "Farm-to-table and New American cuisine thrive. The craft beer scene is exceptional. Diverse cuisines represent the growing population.",
        "community": "Outdoor-focused community with growing tech presence. Young professionals have driven growth. Coworking spaces serve the startup ecosystem.",
        "english": "Native English with growing Spanish-speaking population. The Western character adds regional flavor. Business operates in English.",
        "visa": "Standard US visa rules apply. The quality of life attracts international workers. Tech companies sponsor visas.",
        "culture": "Outdoor lifestyle defines Denver culture. Health, wellness, and adventure are priorities. Legal cannabis has changed the cultural landscape.",
        "cleanliness": "Generally clean with well-maintained parks. Some urban areas show strain from growth. The dry climate means less mud and mold.",
        "airquality": "Generally good but brown cloud can affect winter air quality. The altitude and sun create ozone in summer. Mountain proximity brings fresh air."
    },
    "seattle": {
        "climate": "Seattle has a marine west coast climate with mild temperatures year-round at 10-25°C. The famous rain is more persistent drizzle than downpours. Summers are spectacular with long days.",
        "cost": "Expensive tech hub with rents from $1800-3000/month. Amazon and Microsoft presence drives up costs. No state income tax offsets some expenses.",
        "wifi": "Excellent tech hub connectivity with speeds of 100+ Mbps standard. Coffee culture means every café has good wifi. Home gigabit connections are available.",
        "nightlife": "Capitol Hill and Belltown offer diverse nightlife options. The craft cocktail and beer scenes are excellent. Live music venues honor the city's musical legacy.",
        "nature": "Stunning access to mountains, water, and forests. The Puget Sound and Cascade Mountains frame the city. Olympic and Rainier National Parks are day trips.",
        "safety": "Generally safe with some areas having visible homelessness. Property crime occurs downtown. Most neighborhoods are secure and welcoming.",
        "food": "Fresh Pacific seafood and farm-to-table excellence. Asian influences are strong due to Pacific Rim connections. The coffee culture set global standards.",
        "community": "Massive tech community with Amazon, Microsoft, and startups. The 'Seattle Freeze' means locals can seem reserved. Coworking spaces are abundant.",
        "english": "Native English with tech jargon common. Pacific Northwest speech has subtle differences. The international tech workforce adds diversity.",
        "visa": "Standard US visa rules with many tech visas. Major companies sponsor international workers. The immigration system is well-established here.",
        "culture": "Coffee, tech, and outdoor culture define Seattle. Progressive values and environmental consciousness are strong. The musical heritage from grunge continues to influence.",
        "cleanliness": "Downtown has visible homelessness and some cleanliness issues. Residential neighborhoods are well-maintained. Parks are generally clean.",
        "airquality": "Generally good but wildfire smoke increasingly affects summers. The maritime climate usually keeps air fresh. Rain naturally cleans the air."
    },
    "boston": {
        "climate": "Boston has a humid continental climate with hot summers (25-30°C) and cold, snowy winters (-3 to 3°C). Fall foliage is spectacular. The coastal location moderates extremes somewhat.",
        "cost": "Expensive city with rents from $2200-3500/month. The student economy creates budget options. Healthcare and education are quality but costly.",
        "wifi": "Excellent infrastructure with speeds of 50-100 Mbps standard. The university presence ensures good connectivity. Cafés near campuses are work-friendly.",
        "nightlife": "College town energy with diverse bars and clubs. Historical pubs add character. The scene is lively but regulated with early closing times.",
        "nature": "Charles River Esplanade and nearby beaches provide nature access. Fall trips to New Hampshire and Vermont are essential. Harbor islands offer urban escape.",
        "safety": "Very safe with low crime rates. Some neighborhoods require standard urban awareness. The student population keeps streets active.",
        "food": "Seafood excellence with clam chowder and lobster rolls iconic. Italian food in North End is authentic. The food scene has become sophisticated.",
        "community": "Intellectual community with Harvard, MIT, and many universities. Startups and biotech drive innovation. The nomad community overlaps with academic visitors.",
        "english": "Native English with distinctive Boston accent. The academic presence brings international diversity. Business and academia operate in English.",
        "visa": "Standard US visa rules with many student and academic visas. Universities sponsor international talent. The research community is globally connected.",
        "culture": "History pervades Boston from the Freedom Trail to Revolutionary sites. Academic excellence creates intellectual culture. Sports passion runs deep.",
        "cleanliness": "Generally clean with well-maintained historic areas. Snow removal is efficient despite challenges. Parks and public spaces are well-kept.",
        "airquality": "Good air quality with ocean breezes helping clear pollution. Summer can bring occasional smog. The compact city means less car dependence."
    },
    "chicago": {
        "climate": "Chicago has extreme seasons with brutally cold winters (-10 to -20°C with wind chill) and hot, humid summers (25-35°C). The lake effect intensifies weather. Spring and fall are beautiful but brief.",
        "cost": "More affordable than coastal cities with rents from $1400-2500/month. Food and entertainment are reasonably priced. The value for a major city is excellent.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps available. Cafés throughout the city have reliable connections. Home internet is consistent.",
        "nightlife": "Vibrant scene from jazz clubs to dive bars to mega clubs. Each neighborhood has distinct character. The music heritage from blues to house lives on.",
        "nature": "Lake Michigan provides beaches and waterfront parks. The extensive park system offers urban nature. Nearby dunes and forests provide escapes.",
        "safety": "Safety varies significantly by neighborhood. Downtown and North Side are generally safe. South and West sides have higher crime rates.",
        "food": "Deep dish pizza is iconic but the food scene has become world-class. Every cuisine is represented. The steakhouse tradition continues.",
        "community": "Diverse communities with growing tech and startup presence. Coworking spaces serve various neighborhoods. The Midwest friendliness makes connections easier.",
        "english": "Native English with Chicago accent. The diverse population speaks many languages. Business operates in English.",
        "visa": "Standard US visa rules apply. The diverse economy supports various visa categories. International companies have significant presence.",
        "culture": "World-class architecture, museums, and cultural institutions. The blues, jazz, and comedy legacies continue. Neighborhood identity is strong throughout the city.",
        "cleanliness": "Generally clean downtown with well-maintained parks. Some neighborhoods show urban wear. The lakefront is well-preserved.",
        "airquality": "Moderate air quality affected by industry and traffic. Lake breezes help clean the air. Summers can bring ozone alerts."
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

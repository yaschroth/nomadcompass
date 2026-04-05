#!/usr/bin/env python3
"""Batch 4: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "london": {
        "climate": "London has a temperate maritime climate with mild temperatures year-round. Summers average 18-23°C while winters rarely drop below freezing. The famous grey skies mean rain can occur any time, so layers are essential.",
        "cost": "One of Europe's most expensive cities with high rent and dining costs. Expect to pay £1500-2500/month for a flat and £15-25 for restaurant meals. Public transport is pricey but efficient.",
        "wifi": "Excellent internet infrastructure with speeds typically 50-100 Mbps. Coffee shops and coworking spaces have reliable connections. Residential fiber can reach 500+ Mbps.",
        "nightlife": "World-class nightlife spanning historic pubs, cocktail bars, and legendary clubs. Areas like Shoreditch, Soho, and Brixton offer distinct vibes. The scene caters to every taste and budget.",
        "nature": "Surprisingly green with expansive Royal Parks like Hyde Park and Hampstead Heath. The Thames provides waterside walks throughout the city. Day trips to countryside are easy by train.",
        "safety": "Generally safe with well-policed streets. Petty crime occurs in tourist areas and on public transport. Most neighborhoods are safe to walk at night.",
        "food": "A global food capital with cuisines from every corner of the world. Borough Market and street food scenes are highlights. From Michelin stars to market stalls, the options are endless.",
        "community": "Massive international community with established nomad and tech scenes. Coworking spaces abound in areas like Shoreditch and Clerkenwell. Networking opportunities are unparalleled.",
        "english": "Native English-speaking city with complete language accessibility. Regional accents vary but communication is never an issue. International business hub.",
        "visa": "UK tourist visas allow 6-month stays for many nationalities. Working requires appropriate visas post-Brexit. The visa system has become more complex.",
        "culture": "Centuries of history meet cutting-edge contemporary culture. World-class museums, theater, and arts are abundant. The city's diversity creates a unique cultural tapestry.",
        "cleanliness": "Central areas are well-maintained with regular street cleaning. Some neighborhoods show urban wear. Public transport is generally clean.",
        "airquality": "Air quality has improved but still affected by traffic, especially in central areas. Low Emission Zone helps control pollution. Parks provide fresh air respite."
    },
    "paris": {
        "climate": "Paris has a moderate oceanic climate with distinct seasons. Summers are pleasant at 20-25°C while winters are chilly at 3-8°C. Spring and autumn are beautiful with mild temperatures.",
        "cost": "Expensive by European standards with apartments from €1200-2000/month. Eating out ranges from affordable bistros to pricey restaurants. The café culture can add up quickly.",
        "wifi": "Reliable internet with speeds of 30-60 Mbps in most locations. Cafés are hit-or-miss for working. Many coworking spaces offer excellent connectivity.",
        "nightlife": "Sophisticated nightlife from wine bars to world-famous clubs. The Marais, Oberkampf, and Pigalle offer diverse options. The scene emphasizes quality over excess.",
        "nature": "Beautiful parks like Luxembourg Gardens, Tuileries, and Bois de Boulogne provide green spaces. The Seine riverbanks are UNESCO-listed. Easy escapes to Fontainebleau forest.",
        "safety": "Generally safe with some pickpocket activity in tourist areas. Certain suburbs require more caution. The city center is well-patrolled.",
        "food": "Arguably the world's greatest food city with legendary cuisine. From corner bakeries to Michelin-starred restaurants, quality is paramount. The market culture is exceptional.",
        "community": "Growing digital nomad presence, especially in areas like Le Marais and the 11th. Coworking spaces are multiplying. The French startup scene is thriving.",
        "english": "English proficiency has improved significantly among younger Parisians. Tourist areas function in English. Learning French greatly enhances the experience.",
        "visa": "Schengen zone rules allow 90-day stays in 180-day periods. Longer stays require specific visas. France offers a tech visa for startups.",
        "culture": "Unrivaled cultural heritage with world-famous museums, architecture, and arts. Fashion, philosophy, and gastronomy define Parisian identity. The city inspires like no other.",
        "cleanliness": "Mixed - central tourist areas are maintained but some streets show urban grit. Metro stations vary in cleanliness. Parks are generally well-kept.",
        "airquality": "Air quality is moderate with traffic pollution being the main concern. Certain weather patterns trap pollution. Car-free days are increasingly common."
    },
    "newyork": {
        "climate": "New York has a humid subtropical climate with hot summers and cold winters. Summer temperatures reach 30°C+ while winter can drop below -10°C. Spring and fall offer ideal weather.",
        "cost": "One of the world's most expensive cities with Manhattan rents from $2500-4000+/month. Brooklyn and Queens offer slightly better value. Eating out and entertainment are pricey.",
        "wifi": "Excellent connectivity with speeds of 100+ Mbps common. Coffee shops and libraries offer free wifi. Residential fiber can reach gigabit speeds.",
        "nightlife": "The city that never sleeps lives up to its name with legendary bars, clubs, and venues. Every neighborhood has its character. The options are truly endless.",
        "nature": "Central Park is the iconic green space but smaller parks dot every neighborhood. The Hudson River Greenway provides scenic cycling. Day trips to beaches and mountains are possible.",
        "safety": "Much safer than its reputation suggests with low crime in most areas. Standard urban precautions apply. The subway is generally safe at all hours.",
        "food": "A global food capital where every cuisine is represented at the highest level. From dollar pizza to tasting menus, the range is unmatched. Food trends start here.",
        "community": "Massive and diverse with endless networking opportunities. Coworking spaces are abundant in Manhattan and Brooklyn. Every interest has its community.",
        "english": "Native English with countless accents and languages spoken. The city is remarkably multilingual. Business operates primarily in English.",
        "visa": "ESTA allows 90-day visits for many nationalities. Working requires appropriate visas. The B1/B2 visa allows longer tourist stays.",
        "culture": "The cultural capital of the Americas with world-class everything. Broadway, museums, galleries, and street art create endless cultural experiences. The energy is unmatched.",
        "cleanliness": "Street cleanliness varies by neighborhood. Some areas struggle with litter and trash. The subway stations range from new to grimey.",
        "airquality": "Air quality has improved over decades but traffic affects certain areas. Summer can bring smog and humidity. Buildings increasingly have air filtration."
    },
    "miami": {
        "climate": "Miami has a tropical monsoon climate with warm weather year-round. Summer temperatures reach 32-35°C with high humidity. Winter offers perfect weather at 20-25°C. Hurricane season runs June to November.",
        "cost": "Costs have risen significantly with apartments from $1800-2800/month. Dining and entertainment vary widely in price. The beach lifestyle can be done affordably or lavishly.",
        "wifi": "Good internet infrastructure with speeds of 50-100 Mbps common. Cafés and coworking spaces have reliable connections. Beach areas have improved connectivity.",
        "nightlife": "World-famous party scene with clubs in South Beach and Brickell. Latin music and culture influence the vibe. The scene attracts international crowds.",
        "nature": "Beautiful beaches are the main attraction with Everglades nearby for wildlife. Key Biscayne and nearby keys offer nature escapes. The marine environment is spectacular.",
        "safety": "Tourist areas are well-policed and safe. Some neighborhoods require more caution. Beach safety including sun and water awareness is important.",
        "food": "Cuban, Latin American, and Caribbean cuisines dominate. Fresh seafood is excellent. The food scene has become increasingly sophisticated.",
        "community": "Growing tech and nomad community, especially in areas like Wynwood and Brickell. The Latin American connection brings diverse entrepreneurs. Coworking options are expanding.",
        "english": "English is primary but Spanish is widely spoken. Many neighborhoods are bilingual. Miami feels like a gateway between Americas.",
        "visa": "Standard US visa rules apply. ESTA for many nationalities allows 90 days. The city attracts many Latin American visitors and residents.",
        "culture": "Art Deco architecture meets Latin vibes in this unique American city. Art Basel has elevated the cultural scene. The multicultural energy is distinctive.",
        "cleanliness": "Beach areas and tourist zones are well-maintained. Urban areas vary. The city invests heavily in keeping beaches clean.",
        "airquality": "Generally good air quality with ocean breezes. Humidity can make air feel heavy in summer. Tropical storms temporarily clear the air."
    },
    "sydney": {
        "climate": "Sydney has a humid subtropical climate with warm summers and mild winters. Summer temperatures reach 25-30°C while winter stays pleasant at 10-17°C. The harbor location moderates extremes.",
        "cost": "One of the world's most expensive cities with rent from AUD 2000-3500/month. Dining and entertainment are pricey. The high minimum wage means service costs are high.",
        "wifi": "Good internet with speeds of 40-100 Mbps depending on location. NBN rollout has improved connectivity. Cafés generally have reliable wifi.",
        "nightlife": "Strict lockout laws have affected the scene but good options remain. Areas like Newtown and Surry Hills have vibrant bars. The beach club and rooftop scene is strong.",
        "nature": "Stunning harbor, world-famous beaches, and bushland within the city limits. Bondi to Coogee walk is iconic. The Blue Mountains are an easy day trip.",
        "safety": "Very safe city with low crime rates. Beach safety requires attention to rips and currents. Wildlife occasionally makes urban appearances.",
        "food": "Excellent food scene with Asian fusion and modern Australian cuisine. Brunch culture is legendary. Fresh seafood and produce are highlights.",
        "community": "Established expat and working holiday community. Coworking spaces are modern and well-equipped. The startup scene is growing.",
        "english": "Native English with distinctive Australian accent and slang. No language barriers. International business operates smoothly.",
        "visa": "Working holiday visas available for many nationalities under 30-35. Tourist visas allow various stay lengths. The points-based immigration system is competitive.",
        "culture": "Indigenous heritage meets British colonial history and modern multiculturalism. The arts scene is vibrant with world-class opera and galleries. Beach and outdoor culture defines the lifestyle.",
        "cleanliness": "Very clean and well-maintained throughout. Beaches are pristine. Public transport is spotless by global standards.",
        "airquality": "Generally excellent air quality though bushfire season can bring smoke. Ocean breezes keep the air fresh. The harbor location ensures good ventilation."
    },
    "melbourne": {
        "climate": "Melbourne is famous for four seasons in one day with changeable weather. Summers average 25-30°C while winters are cool at 7-14°C. Always carry layers as conditions shift rapidly.",
        "cost": "Expensive but slightly more affordable than Sydney. Rent ranges from AUD 1600-2800/month. The café and food scene is accessible across price points.",
        "wifi": "Reliable internet with NBN providing 40-100 Mbps. The city's café culture means plenty of work-friendly spots. Coworking spaces are abundant.",
        "nightlife": "Hidden laneway bars and rooftop venues define the scene. Live music is exceptional with venues throughout the city. The nightlife culture is more alternative than Sydney.",
        "nature": "Urban parks like Royal Botanic Gardens provide green space. The Great Ocean Road and Yarra Valley are easy escapes. Beach culture exists though waters are cooler.",
        "safety": "Very safe with low crime rates. Normal urban precautions apply. The city is well-lit and well-patrolled.",
        "food": "Australia's culinary capital with world-class coffee culture. Every cuisine is represented at high quality. Laneway restaurants and hidden gems define the scene.",
        "community": "Strong creative and tech communities with many coworking options. The startup ecosystem is thriving. The city attracts those seeking culture over beaches.",
        "english": "Native English with Australian expressions. No language barriers exist. The multicultural population speaks many languages.",
        "visa": "Same Australian visa rules as Sydney apply. Working holiday visas are popular. The city attracts many international students.",
        "culture": "Australia's cultural capital with exceptional street art, theater, and arts festivals. The laneway culture creates discovery around every corner. Creativity and alternative culture thrive.",
        "cleanliness": "Very clean with well-maintained public spaces. Street art adds character without feeling dirty. The CBD is particularly well-kept.",
        "airquality": "Generally good but bushfire smoke can affect air quality seasonally. The inland location means less sea breeze than Sydney. Urban parks help clean the air."
    },
    "tokyo": {
        "climate": "Tokyo has four distinct seasons with humid summers reaching 30-35°C and mild winters around 5-10°C. Cherry blossom season in spring and autumn foliage are spectacular. Rainy season hits in June.",
        "cost": "More affordable than its reputation suggests with meals from ¥500-1500 and apartments from ¥100,000-180,000/month. The efficiency means high value for money. Convenience store food is cheap and quality.",
        "wifi": "Pocket wifi and SIM cards are essential as café wifi can be limited. Home internet is excellent at 100+ Mbps. Many newer cafés now offer reliable connections.",
        "nightlife": "From tiny Golden Gai bars to massive Shibuya clubs, the nightlife is unmatched. Each neighborhood has distinct character. The scene runs until morning trains resume.",
        "nature": "Urban parks like Yoyogi and Shinjuku Gyoen provide green escapes. Mountains and hot springs are accessible by train. The city integrates nature into urban spaces.",
        "safety": "One of the world's safest major cities where wallets are returned intact. Women can walk alone at any hour. The biggest risk is missing last train.",
        "food": "Perhaps the world's greatest food city with everything from ramen counters to Michelin stars. The depth and variety are staggering. Convenience store food rivals restaurants elsewhere.",
        "community": "Growing nomad community though networking requires effort. Coworking spaces are emerging in areas like Shibuya and Meguro. Language barriers affect community building.",
        "english": "English proficiency is improving but remains limited outside tourist areas. Translation apps are essential. Learning basic Japanese significantly enhances the experience.",
        "visa": "90-day visa-free stays for many nationalities. Longer stays require specific visas. Working holiday visas available for some countries.",
        "culture": "Ancient traditions seamlessly blend with cutting-edge technology and pop culture. The attention to detail and quality is extraordinary. Every district has unique character.",
        "cleanliness": "Exceptionally clean despite minimal public trash cans. The cultural emphasis on cleanliness is evident everywhere. Public transport is spotless.",
        "airquality": "Generally good air quality for a megacity. Some seasonal pollen issues in spring. The city has made significant improvements over decades."
    },
    "osaka": {
        "climate": "Osaka has a humid subtropical climate similar to Tokyo but slightly warmer. Summers are hot and humid at 30-35°C. Winter is milder than Tokyo. Typhoon season affects autumn.",
        "cost": "More affordable than Tokyo with meals from ¥400-1200 and apartments from ¥70,000-140,000/month. The food culture emphasizes value. Overall living costs are 15-20% lower than Tokyo.",
        "wifi": "Similar to Tokyo with pocket wifi recommended. Cafés increasingly offer wifi. Home internet provides excellent speeds.",
        "nightlife": "Dotonbori and surrounding areas offer lively nightlife with a more relaxed vibe than Tokyo. The locals are friendly and outgoing. Izakayas and bars stay open late.",
        "nature": "Osaka Castle Park and surrounding areas provide urban green spaces. Day trips to Nara deer park and Koyasan are easy. The Kansai region offers diverse nature experiences.",
        "safety": "Very safe like all Japanese cities. Violent crime is extremely rare. The main risks are bicycle theft and occasional pickpockets in crowded areas.",
        "food": "Known as Japan's kitchen with famous dishes like takoyaki, okonomiyaki, and kushikatsu. The food culture is more casual and abundant than Tokyo. Street food is a way of life.",
        "community": "Smaller expat community than Tokyo but friendly and welcoming. The city's personality makes connections easier. Coworking options are growing.",
        "english": "English proficiency is lower than Tokyo. Tourist areas have some English support. Learning Japanese is more important here.",
        "visa": "Same Japanese visa rules apply. The city is a good base for exploring the Kansai region. Working holiday visas are available.",
        "culture": "More casual and humorous than Tokyo with distinctive dialect and personality. The city has its own proud identity. Historical sites like Osaka Castle add depth.",
        "cleanliness": "Very clean like all Japanese cities. The food-focused culture means restaurants take cleanliness seriously. Streets are well-maintained.",
        "airquality": "Good air quality similar to other Japanese cities. Industrial areas may have slightly lower quality. The bay location provides some ventilation."
    },
    "dubai": {
        "climate": "Dubai has a hot desert climate with extreme summer heat reaching 40-45°C. Winter from November to March is pleasant at 20-30°C. Air conditioning is essential most of the year.",
        "cost": "Expensive with apartments from AED 5000-12000/month ($1400-3300). Dining ranges from cheap to ultra-luxury. Alcohol is particularly expensive.",
        "wifi": "Excellent internet infrastructure with speeds of 100+ Mbps. Wifi is widely available in malls and cafés. Some VOIP services are restricted.",
        "nightlife": "Glamorous scene with rooftop bars, beach clubs, and international DJs. Alcohol is served in licensed venues only. The scene is sophisticated and expensive.",
        "nature": "Desert landscapes offer dune experiences and desert safaris. The Arabian Gulf provides beach and water activities. Urban parks are well-maintained oases.",
        "safety": "Extremely safe with very low crime rates. Strict laws maintain order. Women can move freely throughout the city.",
        "food": "International cuisine from around the world at all price points. Middle Eastern food is excellent. The dining scene caters to the global population.",
        "community": "Large expat community comprising majority of residents. Networking events are common. The transient nature means communities form and reform.",
        "english": "English is the common language in business and daily life. Arabic is official but not essential. The international population uses English primarily.",
        "visa": "Various visa options from tourist to residence. Many nationalities get 30-90 day visas on arrival. The UAE has implemented digital nomad visas.",
        "culture": "Modern architecture and luxury malls meet traditional Arab culture. The transformation from desert to megacity is remarkable. Cultural sensitivity around local customs is expected.",
        "cleanliness": "Immaculately clean with heavy investment in maintenance. Public spaces are pristine. Standards are exceptional throughout.",
        "airquality": "Affected by dust storms and construction. Indoor air quality is excellent with filtration. Summer months can have haze and dust."
    },
    "copenhagen": {
        "climate": "Copenhagen has a temperate oceanic climate with mild summers (20-25°C) and cold, dark winters (0-5°C). The long summer days are beautiful while winter darkness can be challenging. Rain is possible year-round.",
        "cost": "One of Europe's most expensive cities. Apartments range from DKK 10,000-18,000/month ($1500-2700). Dining out is pricey but quality is high. Cycling saves on transport.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. Cafés and public spaces have reliable wifi. The tech-savvy population demands good connectivity.",
        "nightlife": "Sophisticated scene with craft cocktail bars and underground clubs. Vesterbro and Nørrebro have vibrant options. The hygge culture influences the cozy bar scene.",
        "nature": "Harbor swimming, parks, and nearby beaches provide nature access. The flat terrain is perfect for cycling. Day trips to forests and coastline are easy.",
        "safety": "Very safe with extremely low crime rates. Cycling is safe throughout the city. The social trust culture extends to personal safety.",
        "food": "New Nordic cuisine originated here with world-renowned restaurants. Street food markets and casual dining are excellent. Smørrebrød and pastries are local highlights.",
        "community": "International community especially in tech and design sectors. Coworking spaces are well-designed and active. The expat community is established but Danish social circles can be hard to enter.",
        "english": "English is widely spoken with near-universal proficiency. Business operates in English. Learning Danish is appreciated but not essential.",
        "visa": "Schengen rules apply with 90-day stays. Denmark has implemented digital nomad visa options. Nordic mobility agreements ease movement within the region.",
        "culture": "Design excellence, cycling culture, and hygge define Copenhagen. The city is a leader in sustainability and quality of life. Architecture blends historic and cutting-edge.",
        "cleanliness": "Extremely clean with strong environmental consciousness. Waste sorting and recycling are priorities. Public spaces are meticulously maintained.",
        "airquality": "Excellent air quality due to cycling culture and clean energy. The coastal location provides fresh air. One of Europe's cleanest capital cities."
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

#!/usr/bin/env python3
"""Batch 6: Add comprehensive category descriptions for 10 European cities."""

import json
import os

BATCH_CITIES = {
    "vienna": {
        "climate": "Vienna has a humid continental climate with warm summers (20-30°C) and cold winters (-2 to 5°C). Spring and autumn offer pleasant conditions. Snow is common in winter.",
        "cost": "Moderate by Western European standards with apartments from €800-1400/month. Excellent public services justify costs. Coffee house culture is affordable entertainment.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps typical. Coffee houses increasingly offer wifi though some maintain traditional atmospheres. Coworking spaces have excellent connections.",
        "nightlife": "Sophisticated scene from classical music venues to modern clubs. The Gürtel area has vibrant bars. The scene values quality and tradition.",
        "nature": "The Vienna Woods and Danube provide extensive nature access. The city has large parks and green spaces. Nearby Alps offer mountain escapes.",
        "safety": "Extremely safe with very low crime rates. Public transport is secure at all hours. The city consistently ranks among the world's safest.",
        "food": "Famous for schnitzel, sachertorte, and coffee house culture. The food scene combines tradition with modern innovation. Markets offer fresh local produce.",
        "community": "International community especially in diplomacy and music. Growing startup scene. The expat community is established but integration takes time.",
        "english": "Good English proficiency especially among younger people. Tourist areas function in English. German greatly enhances the experience.",
        "visa": "Schengen rules apply with 90-day stays. Austria has specific requirements for longer residency. The digital nomad scene is growing.",
        "culture": "Imperial heritage creates a grand cultural backdrop. World-class museums, opera, and music scene. The city balances tradition and modernity beautifully.",
        "cleanliness": "Exceptionally clean with excellent public services. The Viennese take pride in their city's appearance. Public transport is spotless.",
        "airquality": "Good air quality with the city surrounded by greenery. Occasional inversions affect winter air. The environmental consciousness is strong."
    },
    "munich": {
        "climate": "Munich has a humid continental climate with Alpine influences. Summers are warm (20-28°C) with afternoon thunderstorms. Winters are cold (-2 to 4°C) with regular snow.",
        "cost": "Germany's most expensive city with rents from €1200-2000/month. Beer halls and traditional restaurants remain affordable. The standard of living is high.",
        "wifi": "Excellent German efficiency with speeds of 50-100 Mbps. Cafés and public spaces have reliable connections. Tech industry presence ensures good infrastructure.",
        "nightlife": "Traditional beer halls coexist with modern clubs. Schwabing has bohemian bars while Kultfabrik offers electronic music. Oktoberfest is legendary.",
        "nature": "Alps are visible from the city and reachable within an hour. English Garden is one of Europe's largest urban parks. Lakes and mountains offer endless recreation.",
        "safety": "Very safe with low crime rates. The city is well-organized and efficient. Cycling is safe throughout.",
        "food": "Bavarian cuisine features hearty dishes and world-famous beer. International options are excellent. The food scene balances tradition with innovation.",
        "community": "Large international community especially in tech and automotive sectors. Coworking spaces serve startups. The expat community is welcoming.",
        "english": "Good English proficiency in business and tourism. German helps significantly in daily life. The international presence eases communication.",
        "visa": "Schengen rules apply. Germany offers various visas for skilled workers. The economy attracts international talent.",
        "culture": "Bavarian traditions blend with cosmopolitan modernity. World-class museums and cultural institutions abound. Beer culture is a way of life.",
        "cleanliness": "Very clean with German precision in public services. The city takes maintenance seriously. Public transport is immaculate.",
        "airquality": "Good air quality with Alpine breezes helping. Occasional föhn winds can affect conditions. The green spaces contribute to clean air."
    },
    "dublin": {
        "climate": "Dublin has a temperate oceanic climate with mild temperatures year-round (5-15°C typically). Rain is frequent but rarely heavy. Summers are cool and pleasant.",
        "cost": "Expensive with severe housing crisis. Rents range €1500-2500/month for central locations. The tech industry has driven up all costs significantly.",
        "wifi": "Excellent infrastructure due to tech hub status with speeds of 50-100+ Mbps. Cafés and pubs are increasingly work-friendly. Home connections are reliable.",
        "nightlife": "Legendary pub culture from traditional sessions to Temple Bar tourist scene. Live music is everywhere. The locals know how to celebrate.",
        "nature": "Phoenix Park and coastal walks provide urban nature. Wicklow Mountains are a short drive for hiking. The rugged Irish coastline is spectacular.",
        "safety": "Generally safe with some petty crime in certain areas. The city center is well-policed. Irish hospitality creates a welcoming environment.",
        "food": "Food scene has transformed with excellent restaurants and cafés. Traditional Irish food is hearty. International cuisines reflect the tech-driven diversity.",
        "community": "Massive tech community with Google, Facebook, and many startups. The nomad community is substantial. Coworking spaces are abundant and social.",
        "english": "Native English with distinctive Irish accent and expressions. No language barriers exist. The chat is part of Irish culture.",
        "visa": "Non-Schengen with separate Irish visa rules. UK/Ireland common travel area for British citizens. Working holiday visas available for some nationalities.",
        "culture": "Literary heritage, music, and storytelling define Irish culture. The warmth of the people is genuine. Modern creativity builds on deep traditions.",
        "cleanliness": "Generally clean though some areas show urban wear. The Georgian architecture is well-preserved. Public services are good.",
        "airquality": "Good air quality due to Atlantic winds. The maritime climate keeps air fresh. Some traffic-related pollution in the center."
    },
    "zurich": {
        "climate": "Zurich has a humid continental climate with warm summers (18-28°C) and cold winters (-2 to 5°C). The lake moderates extremes. Fog can persist in winter.",
        "cost": "One of the world's most expensive cities. Rents start at CHF 2000-3500/month (€2000-3500). Everything from food to transport is premium priced.",
        "wifi": "Excellent Swiss efficiency with speeds of 100+ Mbps common. The infrastructure is world-class. Tech companies enjoy perfect connectivity.",
        "nightlife": "Sophisticated scene from Langstrasse bars to lakeside clubs. The scene is stylish but expensive. Quality is prioritized over excess.",
        "nature": "The lake and surrounding Alps provide stunning nature access. Urban swimming spots are popular in summer. Skiing and hiking are weekend activities.",
        "safety": "Extremely safe with virtually no violent crime. The city is incredibly orderly. You can walk anywhere at any hour.",
        "food": "High quality but expensive dining. Swiss cuisine features fondue and local specialties. International options reflect the global population.",
        "community": "International finance and tech community. Expats form tight-knit groups. The startup scene is growing.",
        "english": "Good English proficiency in business. German (Swiss German) is primary. The international business community operates in English.",
        "visa": "Non-EU with separate Swiss visa requirements. Permits are difficult to obtain. The country is selective about immigration.",
        "culture": "Precision, quality, and order define Zurich. Cultural institutions are world-class. The city balances efficiency with livability.",
        "cleanliness": "Immaculately clean throughout. Swiss precision applies to everything. Public spaces are pristine.",
        "airquality": "Excellent air quality with Alpine freshness. The lake provides natural ventilation. Environmental standards are strict."
    },
    "florence": {
        "climate": "Florence has a humid subtropical climate with hot summers (30-35°C) and mild winters (5-12°C). Spring and fall are ideal for visiting. August heat drives locals away.",
        "cost": "Moderate with apartments from €800-1400/month. Tourism inflates some prices. Living like a local is affordable.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Historic buildings can have connectivity challenges. Modern coworking spaces offer reliable connections.",
        "nightlife": "Relaxed scene with wine bars and late-night trattorias. The student population adds energy. Santo Spirito area has local character.",
        "nature": "Tuscan hills surround the city offering stunning landscapes. Boboli Gardens provide urban green space. Day trips to Chianti countryside are essential.",
        "safety": "Very safe with low crime rates. Pickpockets target tourist areas. The city feels secure at all hours.",
        "food": "Tuscan cuisine is a highlight with bistecca fiorentina, ribollita, and local wines. Simple ingredients elevated to art. The food tradition is deeply respected.",
        "community": "Art students, academics, and some nomads form the international community. The city is smaller so community builds naturally. Italian skills help significantly.",
        "english": "Lower English proficiency than northern Europe. Tourist areas function in English. Learning Italian is rewarding and necessary for deeper connection.",
        "visa": "Schengen rules apply. Italy has a nomad visa program. The bureaucracy requires patience.",
        "culture": "Renaissance heritage makes Florence an open-air museum. Art, architecture, and craft traditions are alive. The culture is deeply rooted and proudly maintained.",
        "cleanliness": "Historic center is well-maintained. Some areas away from tourists show wear. Italian cities have character not sterility.",
        "airquality": "Generally good but summer heat can create stagnant conditions. The surrounding hills affect air flow. Traffic restrictions help the historic center."
    },
    "milan": {
        "climate": "Milan has a humid subtropical climate with hot summers (28-35°C) and cold, foggy winters (0-8°C). The city can feel grey in winter. Spring and fall are pleasant.",
        "cost": "Italy's most expensive city with rents from €1000-1800/month. Fashion and business drive high standards. Northern efficiency meets Italian style.",
        "wifi": "Good infrastructure with speeds of 30-60 Mbps. The business focus ensures reliable connectivity. Coworking spaces are modern and well-equipped.",
        "nightlife": "Sophisticated scene from aperitivo culture to world-famous clubs. Navigli district offers relaxed evenings. The fashion crowd sets the tone.",
        "nature": "Less natural beauty than other Italian cities but parks exist. Lake Como is an hour away. The Alps are accessible for skiing and hiking.",
        "safety": "Generally safe with some pickpocket activity around the station and tourist areas. The city is well-policed. Normal urban awareness applies.",
        "food": "Milanese cuisine features risotto, cotoletta, and northern Italian specialties. The food scene is innovative and excellent. Aperitivo culture is a delicious tradition.",
        "community": "Business and fashion industries bring international crowds. The nomad community is growing. Coworking spaces host active communities.",
        "english": "Better English than southern Italy but Italian helps significantly. Business operates increasingly in English. The fashion industry is international.",
        "visa": "Schengen rules apply. Italy's nomad visa is an option. The northern efficiency makes bureaucracy slightly easier.",
        "culture": "Fashion, design, and business define modern Milan. Cultural institutions from La Scala to art museums are world-class. The city is elegant and productive.",
        "cleanliness": "Clean by Italian standards with northern efficiency. The city maintains appearances. Public transport is well-kept.",
        "airquality": "Can be poor due to the Po Valley basin trapping pollution. Winter fog exacerbates air quality issues. Summer is generally better."
    },
    "athens": {
        "climate": "Athens has a hot Mediterranean climate with scorching summers (30-40°C) and mild winters (10-15°C). The sea moderates temperatures. Summer heat can be intense.",
        "cost": "Very affordable by European standards with apartments from €400-800/month. The economic situation keeps prices low. Excellent value for quality of life.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. Cafés throughout the city have wifi. Some older buildings have limitations.",
        "nightlife": "Vibrant scene from rooftop bars with Acropolis views to underground clubs. Greeks dine late and party later. The energy lasts until dawn.",
        "nature": "Urban setting but beaches are accessible by tram. Day trips to islands and mountains are easy. The Athenian Riviera offers swimming spots.",
        "safety": "Generally safe with some areas requiring awareness. Petty crime exists in tourist zones. The economic situation has affected some neighborhoods.",
        "food": "Greek cuisine is healthy, delicious, and affordable. Fresh seafood, mezedes, and local specialties abound. The food culture is social and generous.",
        "community": "Growing digital nomad community attracted by affordability. Coworking spaces have emerged. The Greek hospitality creates welcoming environments.",
        "english": "Good English proficiency especially in tourism. Greek is appreciated for deeper connections. Younger generations speak English fluently.",
        "visa": "Schengen rules apply. Greece offers a digital nomad visa. The bureaucracy can be challenging but people are helpful.",
        "culture": "Ancient heritage meets modern Mediterranean lifestyle. The Acropolis overlooks a city transformed by economic challenges and recovery. The culture values hospitality and conversation.",
        "cleanliness": "Varies by area with tourist zones well-maintained. Some neighborhoods show urban wear. Street cleaning occurs regularly in central areas.",
        "airquality": "Can be affected by traffic and geography that traps pollution. The nefos (smog) is less severe than decades past. Sea breezes help in coastal areas."
    },
    "helsinki": {
        "climate": "Helsinki has a humid continental climate with cold winters (-5 to -15°C) and mild summers (15-25°C). Winters are dark with minimal daylight. Summer midnight sun compensates.",
        "cost": "Expensive with rents from €1200-2000/month. High quality of life justifies costs. Excellent public services are included.",
        "wifi": "Excellent infrastructure with Finland's tech leadership evident. Speeds of 50-100+ Mbps are standard. The digital society functions seamlessly.",
        "nightlife": "Quality scene with excellent bars and clubs. Kallio district has creative energy. The scene is sophisticated and unpretentious.",
        "nature": "Baltic Sea access, numerous parks, and proximity to forests. Sauna culture connects to nature. Summer cottages are integral to Finnish life.",
        "safety": "Extremely safe with very low crime. The society functions on trust. You can walk anywhere at any hour.",
        "food": "Nordic cuisine emphasis on local, seasonal ingredients. Excellent coffee culture. The food scene has become increasingly innovative.",
        "community": "Growing international tech community. Startup scene is vibrant (Slush, Supercell). Finnish reserve requires patience but relationships are genuine once formed.",
        "english": "Excellent English proficiency. Business and daily life function perfectly in English. Finns appreciate attempts at Finnish.",
        "visa": "Schengen rules apply. Finland offers various residence options. The immigration system is efficient.",
        "culture": "Design, technology, and nature define Finnish culture. Sauna is sacred. The culture values equality, education, and quiet competence.",
        "cleanliness": "Extremely clean with pride in public spaces. Nordic efficiency ensures excellent maintenance. Even nature is treated with respect.",
        "airquality": "Excellent air quality with Baltic breezes and forest surroundings. The city is remarkably clean. Environmental consciousness is high."
    },
    "edinburgh": {
        "climate": "Edinburgh has a temperate oceanic climate with mild temperatures year-round (3-18°C). Wind is constant. Rain is common but rarely severe.",
        "cost": "Expensive especially during Festival season. Rents range £1200-1800/month. Student areas offer better value.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Cafés and pubs are increasingly work-friendly. The tech scene ensures good connectivity.",
        "nightlife": "Historic pubs, student bars, and clubs create diverse options. The Festival transforms the city annually. Scottish hospitality is warm.",
        "nature": "Arthur's Seat provides urban mountain hiking. The Scottish Highlands are easily accessible. Coastal walks offer dramatic scenery.",
        "safety": "Very safe with low crime rates. The city is compact and well-lit. Scottish welcome creates security.",
        "food": "Traditional Scottish fare meets modern gastronomy. Excellent seafood and locally sourced ingredients. The food scene has elevated significantly.",
        "community": "International community from universities and the Festival. Tech scene is growing. The city is small enough to build genuine connections.",
        "english": "Native English with Scottish accent and occasional Scots words. No language barriers. The banter is part of the experience.",
        "visa": "UK visa rules apply. Post-Brexit requirements have changed. Scotland's unique identity creates welcoming atmosphere.",
        "culture": "Historic charm meets vibrant creative scene. The Festival brings world culture annually. Literary and artistic heritage runs deep.",
        "cleanliness": "Generally clean with well-preserved historic areas. Stone buildings require maintenance. The Old Town charm includes some grit.",
        "airquality": "Excellent air quality due to coastal winds. The Scottish weather keeps air fresh. One of Britain's cleanest cities."
    },
    "brussels": {
        "climate": "Brussels has a temperate oceanic climate with mild temperatures year-round (2-23°C). Rain is frequent in all seasons. Grey days are common.",
        "cost": "Moderate compared to other European capitals with rents from €900-1500/month. The multicultural food scene offers value. EU presence drives up some areas.",
        "wifi": "Good infrastructure with speeds of 30-60 Mbps. Cafés and coworking spaces have reliable connections. The EU district has excellent tech infrastructure.",
        "nightlife": "Diverse scene from art nouveau bars to underground clubs. The beer culture is exceptional. The international crowd creates varied options.",
        "nature": "Forêt de Soignes offers forest walks. Urban parks dot the city. Day trips to Bruges and Belgian countryside are easy.",
        "safety": "Generally safe with some areas requiring awareness. Parts of Molenbeek have reputations. The center is well-patrolled.",
        "food": "World-famous chocolate, waffles, frites, and beer. The multicultural population creates diverse dining. French and Belgian cuisine excel.",
        "community": "Massive international community from EU institutions. Coworking spaces serve international professionals. English is widely used in professional settings.",
        "english": "Good English proficiency especially among EU workers. French and Dutch (Flemish) are official. The trilingual reality means English often becomes the common language.",
        "visa": "Schengen rules apply. EU institution workers have specific arrangements. Belgium is complex bureaucratically.",
        "culture": "Art nouveau architecture, surrealist art heritage, and EU cosmopolitanism. The city doesn't shout its charms. Comic strip culture adds whimsy.",
        "cleanliness": "Varies by area with some streets showing urban character. The Grand Place is immaculate. Belgian cities have a lived-in quality.",
        "airquality": "Moderate air quality with some traffic pollution. Low emission zones are being implemented. The flat terrain doesn't aid natural ventilation."
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

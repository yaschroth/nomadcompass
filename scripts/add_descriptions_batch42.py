#!/usr/bin/env python3
"""Batch 42: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "utrecht": {
        "climate": "Utrecht has a temperate oceanic climate with mild temperatures (3-22°C). Central Netherlands. Rain is common.",
        "cost": "Moderate for Netherlands. Apartments from €900-1500/month. Growing but less than Amsterdam.",
        "wifi": "Excellent Dutch infrastructure with speeds of 100+ Mbps. Reliable.",
        "nightlife": "Charming canal-side scene. University energy. Active and intimate.",
        "nature": "Canals and surrounding countryside. Day trips easy. Urban green spaces.",
        "safety": "Very safe with low crime. Dutch organization. Comfortable.",
        "food": "Growing food scene with quality restaurants. Dutch and international.",
        "community": "Large university and young professional community. International. Welcoming.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Dutch options. Standard access.",
        "culture": "Medieval canals with modern university energy. Dom Tower is iconic. Charming character.",
        "cleanliness": "Very clean with Dutch standards. Canal areas beautiful. Excellent.",
        "airquality": "Good air quality for Netherlands. Better than Randstad cores. Fresh."
    },
    "vaduz": {
        "climate": "Vaduz has an Alpine climate with warm summers (18-25°C) and cold winters (-2 to 4°C). Tiny country in Alps.",
        "cost": "Expensive as principality. Limited rental market. Swiss-level costs.",
        "wifi": "Excellent infrastructure with speeds of 100+ Mbps. Small country, good coverage.",
        "nightlife": "Very limited. Small town. Quiet evenings.",
        "nature": "Alps surround the valley. Hiking and skiing. Nature spectacular.",
        "safety": "Extremely safe with virtually no crime. Very comfortable.",
        "food": "Austrian and Swiss influences. Quality restaurants available.",
        "community": "Small local and finance community. Tax haven character. Intimate.",
        "english": "Good alongside German. Communication possible.",
        "visa": "Schengen rules apply via Switzerland. Liechtenstein is accessible.",
        "culture": "Principality with castle overlooking. Tax haven reputation. Unique small nation.",
        "cleanliness": "Very clean. High standards. Excellent.",
        "airquality": "Excellent Alpine air quality. Fresh mountain air. Pristine."
    },
    "valparaiso": {
        "climate": "Valparaíso has a Mediterranean climate with mild temperatures (12-22°C). Pacific coast moderates. Oceanic influences.",
        "cost": "Affordable with apartments from $300-600/month. Chile offers value. Artist haven.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Chilean standards. Reliable.",
        "nightlife": "Bohemian scene in hills. Bars and live music. Atmospheric and active.",
        "nature": "Pacific coast and surrounding hills. Colorful cityscape. Nature integrated.",
        "safety": "Requires awareness with some areas. Tourist zones comfortable. Standard caution.",
        "food": "Chilean seafood and local specialties. Empanadas and wine. Quality.",
        "community": "Artist and creative community. University presence. Bohemian.",
        "english": "Limited with Spanish essential.",
        "visa": "90 days visa-free for most. Chile accessible.",
        "culture": "UNESCO port city with street art. Neruda's home. Bohemian identity.",
        "cleanliness": "Variable with colorful chaos being character. Some areas maintained.",
        "airquality": "Good with Pacific breezes. Coastal freshness. Clean."
    },
    "varna": {
        "climate": "Varna has a humid continental climate with hot summers (26-32°C) and cool winters (2-8°C). Black Sea resort. Beach weather in summer.",
        "cost": "Very affordable with apartments from €250-500/month. Bulgaria offers excellent value.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Bulgaria investing. Reliable.",
        "nightlife": "Beach club scene in summer. Year-round city options. Active.",
        "nature": "Black Sea beaches and nearby nature reserves. Summer resort.",
        "safety": "Safe with low crime. Bulgarian hospitality. Comfortable.",
        "food": "Bulgarian cuisine with fresh seafood. Shopska salad and grills. Affordable.",
        "community": "Growing digital nomad community. Seasonal tourism. Developing.",
        "english": "Growing especially among youth. Communication possible.",
        "visa": "EU rules apply. Bulgaria approaching Schengen. Standard access.",
        "culture": "Sea capital with ancient history. Roman baths and beach culture blend.",
        "cleanliness": "Beach areas maintained in season. City varies. Good tourist zones.",
        "airquality": "Good with Black Sea breezes. Fresh coastal air."
    },
    "venice": {
        "climate": "Venice has a humid subtropical climate with hot summers (26-32°C) and cold winters (3-8°C). Lagoon creates humidity. Acqua alta floods possible.",
        "cost": "Expensive tourist destination. Apartments from €1000-2000/month. Premium location.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Tourist area coverage. Reliable.",
        "nightlife": "Charming campo scene. Aperitivo culture. More romantic than party.",
        "nature": "Lagoon and islands. Lido beach accessible. Water defines everything.",
        "safety": "Very safe with virtually no crime. Tourist crowds main concern. Comfortable.",
        "food": "Venetian cuisine with cicchetti and seafood. Quality but tourist traps exist.",
        "community": "Shrinking local population. Tourists dominate. Art and academic community.",
        "english": "Good in tourism. Italian appreciated.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Unique floating city. Biennale and carnival. Cultural treasure under pressure.",
        "cleanliness": "Canal areas maintained. Unique challenges. Tourist areas clean.",
        "airquality": "Good with lagoon breezes. No cars helps. Fresh."
    },
    "verona": {
        "climate": "Verona has a humid subtropical climate with hot summers (26-32°C) and cold winters (1-7°C). Po Valley. Four seasons.",
        "cost": "Moderate for Italy. Apartments from €550-950/month. Northern Italy.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. Reliable.",
        "nightlife": "Charming scene around Piazza delle Erbe. Arena events. Active.",
        "nature": "Adige River and Lake Garda nearby. Wine country. Nature accessible.",
        "safety": "Very safe with low crime. Italian hospitality. Comfortable.",
        "food": "Veronese cuisine with risotto and local wine. Amarone region. Excellent.",
        "community": "Tourism and local community. Opera brings visitors. International.",
        "english": "Good in tourism. Italian helps.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Romeo and Juliet city. Roman Arena hosts opera. Romantic heritage.",
        "cleanliness": "Historic center well-maintained. Tourism standards. Beautiful.",
        "airquality": "Can be affected by Po Valley conditions. Variable."
    },
    "vilnius": {
        "climate": "Vilnius has a humid continental climate with warm summers (18-23°C) and cold winters (-6 to -1°C). Baltic weather. Four seasons.",
        "cost": "Affordable for Europe. Apartments from €450-800/month. Baltic value.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Lithuania investing. Reliable.",
        "nightlife": "Growing scene in old town and Užupis. Bars and clubs. Active.",
        "nature": "Surrounding forests and lakes. Trakai day trip. Nature accessible.",
        "safety": "Very safe with low crime. Lithuanian hospitality. Comfortable.",
        "food": "Lithuanian and international cuisine. Growing food scene. Affordable.",
        "community": "Growing tech and creative community. Startup scene. Welcoming.",
        "english": "Good especially among youth. Communication possible.",
        "visa": "Schengen rules apply. Lithuania is EU. Standard access.",
        "culture": "Baroque old town is UNESCO listed. Užupis artist republic. Cultural depth.",
        "cleanliness": "Historic center well-maintained. Lithuanian standards. Good.",
        "airquality": "Good air quality with surrounding nature. Fresh Baltic air."
    },
    "viterbo": {
        "climate": "Viterbo has a Mediterranean climate with hot summers (28-34°C) and mild winters (4-12°C). Tuscia region. Four seasons.",
        "cost": "Very affordable for Italy. Apartments from €350-600/month. Off-beaten-path value.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. Provincial Italy. Developing.",
        "nightlife": "Limited but charming. Medieval quarter bars. Quiet.",
        "nature": "Volcanic lakes and hot springs nearby. Nature accessible.",
        "safety": "Very safe with low crime. Italian hospitality. Comfortable.",
        "food": "Tuscia cuisine with local specialties. Fresh and affordable.",
        "community": "Small university and local community. Authentic experience. Intimate.",
        "english": "Limited with Italian essential.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Papal palaces and medieval quarter. Thermal baths famous. Historic depth.",
        "cleanliness": "Historic center maintained. Italian provincial standards. Good.",
        "airquality": "Good with countryside surroundings. Fresh Lazio air."
    },
    "vladivostok": {
        "climate": "Vladivostok has a humid continental climate with warm summers (18-24°C) and cold winters (-15 to -5°C). Pacific influences. Monsoon effects.",
        "cost": "Moderate for Russia. Apartments from $400-800/month. Remote Russia.",
        "wifi": "Decent infrastructure with speeds of 30-70 Mbps. Developing.",
        "nightlife": "Growing scene. Bars and clubs. Russian Pacific character.",
        "nature": "Pacific coast and surrounding taiga. Nature is remote and beautiful.",
        "safety": "Generally safe. Russian standards. Research current situation.",
        "food": "Russian with Asian influences. Pacific seafood. Unique blend.",
        "community": "Small international presence. Russian Pacific character.",
        "english": "Limited with Russian essential.",
        "visa": "Russian visa rules apply. Research current situation.",
        "culture": "End of Trans-Siberian. Russian Pacific city. Remote frontier character.",
        "cleanliness": "Central areas maintained. Development varies. Good for region.",
        "airquality": "Good with Pacific air. Fresh and clean."
    },
    "wroclaw": {
        "climate": "Wrocław has a humid continental climate with warm summers (18-25°C) and cold winters (-3 to 2°C). Silesian weather. Four seasons.",
        "cost": "Affordable for Europe. Apartments from €400-700/month. Polish value.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Poland investing. Reliable.",
        "nightlife": "Vibrant scene in Rynek and islands. University energy. Very active.",
        "nature": "Odra River with many islands and bridges. Nature integrated into city.",
        "safety": "Very safe with low crime. Polish hospitality. Comfortable.",
        "food": "Polish and Silesian cuisine. Growing food scene. Affordable.",
        "community": "Large university and growing tech community. International. Welcoming.",
        "english": "Good among younger Poles. Communication possible.",
        "visa": "Schengen rules apply. Poland is EU. Standard access.",
        "culture": "City of 100 bridges and dwarf statues. Complex history. Charming character.",
        "cleanliness": "Old town beautifully maintained. Polish standards. Excellent.",
        "airquality": "Can be affected by heating in winter. Better in summer. Variable."
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

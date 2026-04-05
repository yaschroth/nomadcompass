#!/usr/bin/env python3
"""Batch 24: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "genoa": {
        "climate": "Genoa has a Mediterranean climate with warm summers (26-30°C) and mild winters (8-13°C). The Ligurian coast is protected. Pleasant much of the year.",
        "cost": "Moderate for Italy. Apartments from €500-900/month. Less expensive than Milan or Rome.",
        "wifi": "Good Italian infrastructure with speeds of 30-70 Mbps. Improving. Reliable in center.",
        "nightlife": "Historic center has atmospheric bars. Student scene adds energy. More charming than party.",
        "nature": "Dramatic coastline and Cinque Terre nearby. Portofino day trips. Nature is stunning.",
        "safety": "Generally safe with some areas requiring awareness. Historic center is comfortable. Standard caution.",
        "food": "Ligurian cuisine with pesto, focaccia, and fresh seafood. The food is exceptional. Outstanding value.",
        "community": "University and maritime community. Growing international interest. Authentic Italian experience.",
        "english": "Limited with Italian essential. Tourism has some English. Learning Italian helps.",
        "visa": "Schengen rules apply. Italian options available. Standard access.",
        "culture": "Maritime republic heritage with UNESCO old town. The history is layered. Authentic Italy.",
        "cleanliness": "Historic center improving. Varies by area. Development ongoing.",
        "airquality": "Good with sea breezes. Port can affect some areas. Generally fresh."
    },
    "ghent": {
        "climate": "Ghent has a temperate oceanic climate with mild temperatures (3-22°C). Rain is common. Belgian maritime influence.",
        "cost": "Moderate for Belgium. Apartments from €700-1100/month. More affordable than Brussels.",
        "wifi": "Excellent Belgian infrastructure with speeds of 50-100+ Mbps. Reliable. EU standards.",
        "nightlife": "Vibrant student scene with bars and clubs. The Patershol area has atmosphere. Active.",
        "nature": "Canals and surrounding Flanders countryside. Cycling is easy. Urban green spaces.",
        "safety": "Very safe with low crime. Belgian order. Comfortable throughout.",
        "food": "Belgian classics plus growing food scene. Waterzooi is local specialty. Quality.",
        "community": "University and international community. Tech sector growing. Welcoming.",
        "english": "Excellent English alongside Dutch and French. No barriers. Easy communication.",
        "visa": "Schengen rules apply. Belgium bureaucracy is complex. Standard access.",
        "culture": "Medieval architecture preserved. Van Eyck's altarpiece is here. Flemish heritage.",
        "cleanliness": "Very clean with Belgian standards. Historic center beautiful. Well-maintained.",
        "airquality": "Good air quality for Belgium. The canals add character. Fresh."
    },
    "gibraltar": {
        "climate": "Gibraltar has a Mediterranean climate with warm summers (25-30°C) and mild winters (13-18°C). The Rock affects local weather. Pleasant year-round.",
        "cost": "Expensive as British territory. Apartments from £1000-1800/month. Tax haven prices.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. British standards. Reliable.",
        "nightlife": "Compact scene with British pubs and Spanish influences. Casino options. Small but varied.",
        "nature": "The Rock and its apes are unique. Strait of Gibraltar views. Nature is compact but special.",
        "safety": "Very safe with British organization. Small territory is well-managed. Comfortable.",
        "food": "British and Spanish influences blend. Fresh seafood from the strait. Quality available.",
        "community": "Expat and financial services community. Small but international. British character.",
        "english": "Native English as British territory. Spanish also useful. No barriers.",
        "visa": "British territory rules. Non-Schengen. Various options for British connections.",
        "culture": "Unique British-Spanish blend. The Rock defines identity. Tax haven culture.",
        "cleanliness": "Well-maintained British standards. Compact and clean. Good.",
        "airquality": "Good air quality with strait breezes. The location ensures freshness. Clean."
    },
    "girona": {
        "climate": "Girona has a Mediterranean climate with hot summers (28-33°C) and mild winters (5-12°C). The Costa Brava is nearby. Pleasant most of the year.",
        "cost": "Moderate for Catalonia. Apartments from €600-1000/month. More affordable than Barcelona.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Fiber expanding. Reliable.",
        "nightlife": "Charming scene in the old town. University adds energy. More atmospheric than party.",
        "nature": "Costa Brava beaches and Pyrenees nearby. The old town straddles the river. Beautiful surroundings.",
        "safety": "Very safe with low crime. Catalan hospitality. Comfortable.",
        "food": "Catalan cuisine at its finest. Proximity to El Celler de Can Roca. Outstanding food scene.",
        "community": "Growing international community. Barcelona spillover. Quality of life attracts.",
        "english": "Good in tourism. Catalan and Spanish local. Communication possible.",
        "visa": "Schengen rules apply. Spanish digital nomad visa. Standard access.",
        "culture": "Medieval Jewish quarter and cathedral. Game of Thrones filming location. Cultural depth.",
        "cleanliness": "Historic center well-maintained. Pride in appearance. Beautiful.",
        "airquality": "Good air quality with Catalan countryside. Better than Barcelona. Fresh."
    },
    "gothenburg": {
        "climate": "Gothenburg has a temperate oceanic climate with mild summers (17-22°C) and cold winters (-2 to 4°C). Coastal location moderates extremes. Swedish west coast weather.",
        "cost": "Expensive as Swedish city. Apartments from SEK 10000-15000/month ($950-1400). Scandinavian prices.",
        "wifi": "Excellent Swedish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Vibrant scene in Avenyn area. Live music and bars. More relaxed than Stockholm.",
        "nature": "Archipelago is stunning. Nearby forests and coastline. Nature is accessible.",
        "safety": "Very safe with Scandinavian standards. Low crime. Very comfortable.",
        "food": "Famous seafood scene. West coast cuisine is celebrated. Outstanding quality.",
        "community": "University, tech, and creative community. Volvo headquarters. International but Swedish.",
        "english": "Excellent English proficiency. Swedish adds depth. No barriers.",
        "visa": "Schengen rules apply. Swedish rules are strict. Various options.",
        "culture": "Industrial heritage meets progressive values. Music scene is vibrant. Friendly Swedish city.",
        "cleanliness": "Very clean with Swedish standards. Well-maintained. Excellent.",
        "airquality": "Excellent air quality with coastal breezes. The archipelago ensures freshness. Pristine."
    },
    "grenoble": {
        "climate": "Grenoble has an oceanic climate with Alpine influences. Summers are warm (20-28°C) and winters cold (-1 to 7°C). Surrounded by mountains.",
        "cost": "Moderate for France. Apartments from €500-900/month. University town prices.",
        "wifi": "Good French infrastructure with speeds of 40-80 Mbps. Tech and research presence. Reliable.",
        "nightlife": "Student scene with bars and cafes. Mountain town atmosphere. Active but not wild.",
        "nature": "Three mountain ranges visible. Gateway to Alps skiing. Nature is spectacular.",
        "safety": "Generally safe with some areas requiring awareness. University areas comfortable. Standard caution.",
        "food": "Alpine cuisine with fondue and raclette. French quality applies. Mountain specialties.",
        "community": "University, tech, and research community. International scientists. Established networks.",
        "english": "Good in tech and academic circles. French helps locally. Communication possible.",
        "visa": "Schengen rules apply. French options available. Standard access.",
        "culture": "Mountain city with research excellence. Stendhal's birthplace. Alpine innovation.",
        "cleanliness": "Central areas well-maintained. French standards. Good.",
        "airquality": "Can be affected by valley inversion. Mountains trap pollution sometimes. Variable."
    },
    "guadalajara": {
        "climate": "Guadalajara has a subtropical highland climate with warm weather year-round (18-30°C). The altitude keeps it pleasant. Dry and wet seasons.",
        "cost": "Affordable with apartments from $400-800/month. Mexico offers value. Growing tech sector.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Mexico's tech hub. Reliable in central areas.",
        "nightlife": "Vibrant scene with mariachi and modern clubs. The Chapultepec corridor is famous. Active.",
        "nature": "Lake Chapala nearby. Tequila region day trips. Urban but nature accessible.",
        "safety": "Requires awareness with some areas to avoid. Tourist areas are safer. Research neighborhoods.",
        "food": "Jalisco cuisine with tortas ahogadas and birria. Tequila and food culture. Outstanding.",
        "community": "Growing tech and startup community. Mexican Silicon Valley. Networks developing.",
        "english": "Good in tech sector. Spanish essential for daily life. Business uses English.",
        "visa": "180 days visa-free for most. Mexico has temporary resident visa. Accessible.",
        "culture": "Mariachi and tequila birthplace. Traditional Mexico meets innovation. Cultural pride.",
        "cleanliness": "Varies by area. Central zones maintained. Development ongoing.",
        "airquality": "Moderate with some traffic effects. Altitude helps. Generally acceptable."
    },
    "guatemala": {
        "climate": "Guatemala City has eternal spring climate at 1,500m with temperatures of 15-25°C year-round. The altitude keeps it pleasant. Rainy season from May to October.",
        "cost": "Very affordable with apartments from $300-600/month. Central America offers value. Excellent for budget living.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. Zones 10 and 14 have best connectivity. Developing.",
        "nightlife": "Zona Viva has bars and clubs. Growing scene. Requires local knowledge.",
        "nature": "Volcanoes and Lake Atitlán nearby. Antigua is day trip distance. Nature is spectacular.",
        "safety": "Requires significant awareness. Some zones are safer. Research carefully and use precautions.",
        "food": "Guatemalan cuisine with traditional pepián. Coffee culture is excellent. Affordable.",
        "community": "Small expat community concentrated in zones 10 and 14. NGO presence. Networks exist.",
        "english": "Limited with Spanish essential. Business areas have some English. Learning Spanish important.",
        "visa": "CA-4 agreement allows 90 days. Guatemala is accessible. Extensions possible.",
        "culture": "Mayan heritage meets colonial Spanish. The textiles and traditions are rich. Cultural depth.",
        "cleanliness": "Varies significantly by zone. Some areas well-maintained. Challenges exist.",
        "airquality": "Moderate with some traffic effects. Altitude helps. Variable by location."
    },
    "guimaraes": {
        "climate": "Guimarães has an oceanic climate with mild summers (20-28°C) and cool winters (5-12°C). Northern Portugal is greener. Rain is common.",
        "cost": "Very affordable with apartments from €350-600/month. Northern Portugal value. Excellent for budget.",
        "wifi": "Good Portuguese infrastructure with speeds of 40-80 Mbps. Improving. Reliable.",
        "nightlife": "Historic center has bars and cafes. University adds energy. Charming atmosphere.",
        "nature": "Penha mountain nearby. Green northern landscape. Nature is accessible.",
        "safety": "Very safe with low crime. Portuguese hospitality. Comfortable throughout.",
        "food": "Minho cuisine with vinho verde. Traditional Portuguese food. Quality and affordable.",
        "community": "University and local community. Less touristy than Porto. Authentic experience.",
        "english": "Moderate English. Portuguese helps significantly. Communication possible.",
        "visa": "Schengen rules apply. Portuguese visas available. Standard access.",
        "culture": "Birthplace of Portugal with UNESCO old town. The history is foundational. National pride.",
        "cleanliness": "Historic center well-maintained. UNESCO status ensures care. Beautiful.",
        "airquality": "Good air quality with northern freshness. Green surroundings help. Clean."
    },
    "gyeongju": {
        "climate": "Gyeongju has a humid subtropical climate with hot summers (26-32°C) and cold winters (-2 to 8°C). Four distinct seasons. South Korean weather patterns.",
        "cost": "Affordable for Korea. Apartments from ₩400,000-700,000/month ($320-560). Historic town value.",
        "wifi": "Excellent Korean infrastructure with speeds of 100+ Mbps. Fast and ubiquitous.",
        "nightlife": "Limited but atmospheric. Historic town focus. More cultural than party.",
        "nature": "Royal tombs and Bulguksa Temple surroundings. Namsan Mountain hiking. History meets nature.",
        "safety": "Very safe with low crime. Korean organization. Comfortable.",
        "food": "Korean cuisine with traditional focus. Temple food available. Quality local options.",
        "community": "Small international community. Tourists pass through. Local experience.",
        "english": "Limited with Korean helpful. Tourism areas function. Learning Korean benefits.",
        "visa": "Standard Korean visa rules. K-ETA required. Working holiday available.",
        "culture": "Ancient Silla kingdom capital. UNESCO World Heritage sites throughout. Korea's cultural heart.",
        "cleanliness": "Very clean with Korean standards. Historic preservation. Excellent.",
        "airquality": "Good air quality away from major cities. Better than Seoul. Fresh."
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

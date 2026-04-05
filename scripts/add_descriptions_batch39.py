#!/usr/bin/env python3
"""Batch 39: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "sihanoukville": {
        "climate": "Sihanoukville has a tropical monsoon climate with warm temperatures year-round (26-32°C). Rainy season May to October. Beach weather.",
        "cost": "Very affordable with apartments from $250-500/month. Cambodia offers value. Chinese development changed area.",
        "wifi": "Variable infrastructure with speeds of 10-40 Mbps. Developing rapidly. Quality varies.",
        "nightlife": "Changed significantly. Casino scene dominates now. Beach bars remain.",
        "nature": "Islands and beaches are the draw. Koh Rong nearby. Nature beautiful but development pressure.",
        "safety": "Research current situation. Area has changed. Chinese casino development altered character.",
        "food": "Cambodian and Chinese cuisine. Seafood available. Quality varies.",
        "community": "Changed significantly from backpacker to casino tourism. Different character now.",
        "english": "Variable with Chinese now common. English in tourist areas.",
        "visa": "Visa on arrival or e-visa. Cambodia accessible.",
        "culture": "Once backpacker beach paradise. Now significant Chinese casino development. Changed identity.",
        "cleanliness": "Variable with rapid development. Construction ongoing. Mixed.",
        "airquality": "Can be affected by construction. Generally good with sea breezes."
    },
    "siracusa": {
        "climate": "Syracuse has a Mediterranean climate with hot summers (28-35°C) and mild winters (10-16°C). Sicily's east coast. Beach weather most of year.",
        "cost": "Affordable for Italy. Apartments from €350-650/month. Sicilian value.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. Italian south developing.",
        "nightlife": "Charming scene in Ortigia. Piazzas and bars. Atmospheric.",
        "nature": "Beautiful coastline and nature reserves. Greek theater overlooks sea. Nature accessible.",
        "safety": "Safe tourist destination. Sicilian hospitality. Comfortable.",
        "food": "Sicilian cuisine excellence. Fresh seafood and street food. Outstanding.",
        "community": "Small international presence. Authentic Italian experience. Growing interest.",
        "english": "Limited with Italian essential. Tourism building English.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Ancient Greek heritage with baroque Ortigia. Archimedes homeland. Deep history.",
        "cleanliness": "Ortigia well-maintained. Historic preservation. Beautiful.",
        "airquality": "Good with Mediterranean breezes. Fresh coastal air."
    },
    "sitges": {
        "climate": "Sitges has a Mediterranean climate with warm summers (26-30°C) and mild winters (10-15°C). Catalan coast. Beach weather most of year.",
        "cost": "Moderate to expensive. Apartments from €700-1200/month. Barcelona proximity premium.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Famous LGBTQ+ scene. Beach bars and clubs. Very active.",
        "nature": "Beautiful beaches and Garraf mountains behind. Nature accessible.",
        "safety": "Very safe with welcoming atmosphere. Comfortable.",
        "food": "Catalan cuisine with beach focus. Fresh seafood. Quality available.",
        "community": "Strong LGBTQ+ and international community. Arts festivals. Welcoming.",
        "english": "Good with international community. Spanish and Catalan local.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "LGBTQ+ friendly beach town with modernist architecture. Carnival famous. Inclusive character.",
        "cleanliness": "Beach and town well-maintained. Tourism standards. Beautiful.",
        "airquality": "Excellent air quality with sea breezes. Fresh Mediterranean air."
    },
    "solomons": {
        "climate": "Solomon Islands has a tropical climate with warm temperatures year-round (25-32°C). High humidity. Cyclone season November to April.",
        "cost": "Moderate for remote Pacific. Accommodation from $500-1000/month. Island import costs.",
        "wifi": "Basic infrastructure with speeds of 5-20 Mbps. Remote Pacific challenges. Developing.",
        "nightlife": "Very limited. Local bars in Honiara. Remote island character.",
        "nature": "WWII history and pristine reefs. Diving is excellent. Nature exceptional.",
        "safety": "Generally safe but research current situation. Remote area. Local guidance helpful.",
        "food": "Local island cuisine with fish. Limited variety. Simple.",
        "community": "Small expat and diving community. Very remote. Intimate.",
        "english": "English is official but Pijin common. Communication possible.",
        "visa": "Visa on arrival for many. 90 days. Remote destination.",
        "culture": "Melanesian culture with WWII history. Guadalcanal memories. Remote character.",
        "cleanliness": "Variable with development challenges. Town areas maintained.",
        "airquality": "Excellent air quality with Pacific isolation. Pristine."
    },
    "southafrica": {
        "climate": "Cape Town has a Mediterranean climate with warm summers (20-28°C) and cool winters (8-17°C). Southern Hemisphere seasons reversed.",
        "cost": "Moderate with apartments from $500-1000/month. South Africa offers value. Range varies hugely.",
        "wifi": "Good infrastructure with speeds of 30-100 Mbps. Improving. Reliable in good areas.",
        "nightlife": "Vibrant scene from Long Street to V&A Waterfront. World-class options.",
        "nature": "Table Mountain and coast. Wine country nearby. Nature spectacular.",
        "safety": "Requires significant awareness. Know safe areas. Research carefully.",
        "food": "Diverse cuisine with braai culture. Wine country excellence. Outstanding range.",
        "community": "International and creative community. Tech growing. Established.",
        "english": "Excellent as official language. Communication easy.",
        "visa": "90 days visa-free for most. South Africa accessible.",
        "culture": "Complex history with diverse cultures. Natural beauty and urban energy. Deep character.",
        "cleanliness": "Varies significantly by area. Tourist zones maintained. Mixed.",
        "airquality": "Generally good with mountain and sea air. Clean when no fires."
    },
    "spainmajorca": {
        "climate": "Majorca has a Mediterranean climate with hot summers (28-33°C) and mild winters (10-17°C). Balearic island sunshine. Beach weather most of year.",
        "cost": "Moderate with apartments from €600-1100/month. Summer season premium. Growing.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Reliable.",
        "nightlife": "Varies from Magaluf party to Palma sophistication. Full range available.",
        "nature": "Beautiful beaches and Serra de Tramuntana mountains. Nature excellent.",
        "safety": "Very safe with low crime. Tourist infrastructure. Comfortable.",
        "food": "Spanish and Majorcan cuisine. Ensaimada pastry famous. Quality available.",
        "community": "Large German and British community. Growing nomad presence. International.",
        "english": "Good with international community. Spanish and Catalan local.",
        "visa": "Schengen rules apply. Spanish options. Standard access.",
        "culture": "Balearic island with varied character. Palma is sophisticated. Beach meets culture.",
        "cleanliness": "Tourist areas well-maintained. Beach cleaning. Good standards.",
        "airquality": "Excellent air quality with sea breezes. Clean Mediterranean air."
    },
    "stockholm": {
        "climate": "Stockholm has a humid continental climate with warm summers (18-23°C) and cold winters (-5 to 1°C). Nordic seasons. Archipelago moderates.",
        "cost": "Very expensive. Apartments from SEK 12000-20000/month ($1100-1850). Scandinavian prices.",
        "wifi": "Excellent Swedish infrastructure with speeds of 100+ Mbps. Nordic connectivity. Impeccable.",
        "nightlife": "Sophisticated scene in Södermalm and Östermalm. Quality over chaos. Active.",
        "nature": "Archipelago of 30,000 islands. City on water. Nature integrated.",
        "safety": "Very safe with Scandinavian standards. Comfortable.",
        "food": "New Nordic cuisine and food halls. Quality dining. Expensive but excellent.",
        "community": "International business and creative community. Established.",
        "english": "Excellent English proficiency. Communication effortless.",
        "visa": "Schengen rules apply. Swedish requirements. Standard access.",
        "culture": "Nobel Prize city on 14 islands. Design and innovation. Scandinavian elegance.",
        "cleanliness": "Very clean with Swedish standards. Pristine.",
        "airquality": "Excellent air quality with archipelago freshness. Clean Nordic air."
    },
    "strasbourg": {
        "climate": "Strasbourg has a semi-continental climate with warm summers (20-26°C) and cold winters (-1 to 5°C). Alsatian weather. Four seasons.",
        "cost": "Moderate for France. Apartments from €600-1000/month. Alsatian value.",
        "wifi": "Excellent infrastructure with speeds of 50-100+ Mbps. EU institutions presence. Reliable.",
        "nightlife": "Charming scene in Petite France and Grande Île. Bars and wine bars. Atmospheric.",
        "nature": "Surrounding Vosges Mountains and Rhine River. Nature accessible.",
        "safety": "Safe with EU institution security. Low crime. Comfortable.",
        "food": "Alsatian cuisine with choucroute and flammekueche. German and French blend. Outstanding.",
        "community": "EU Parliament and international community. University presence. Diverse.",
        "english": "Good with international presence. French and German local.",
        "visa": "Schengen rules apply. French options. Standard access.",
        "culture": "Franco-German heritage. UNESCO Grande Île. European Parliament seat. Diplomatic character.",
        "cleanliness": "Historic center beautifully maintained. EU city standards. Excellent.",
        "airquality": "Good air quality with river and countryside. Fresh Alsatian air."
    },
    "stuttgart": {
        "climate": "Stuttgart has a temperate oceanic climate with warm summers (20-26°C) and mild winters (0-5°C). Valley setting affects weather. Four seasons.",
        "cost": "Expensive as German industrial hub. Apartments from €900-1500/month. High demand.",
        "wifi": "Excellent German infrastructure with speeds of 50-100+ Mbps. Reliable.",
        "nightlife": "Growing scene in various neighborhoods. Wine village festivals. Active.",
        "nature": "Surrounded by vineyards and forests. Black Forest day trips. Nature accessible.",
        "safety": "Very safe with German organization. Low crime. Comfortable.",
        "food": "Swabian cuisine with spätzle and maultaschen. Wine culture. Quality.",
        "community": "Automotive and tech community. International presence. Established.",
        "english": "Good with business community. German helps locally.",
        "visa": "Schengen rules apply. German freelance visa. Standard access.",
        "culture": "Mercedes and Porsche headquarters. Swabian character distinct. Industrial innovation.",
        "cleanliness": "Very clean with German standards. Well-maintained. Excellent.",
        "airquality": "Can be affected by valley inversion. Improving with green initiatives. Acceptable."
    },
    "surabaya": {
        "climate": "Surabaya has a tropical monsoon climate with hot temperatures year-round (27-34°C). Wet season November to May. Humid.",
        "cost": "Affordable with apartments from $300-600/month. Indonesia offers value. Less touristy.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Indonesia invested. Reliable.",
        "nightlife": "Growing scene with bars and clubs. Indonesian city nightlife. Developing.",
        "nature": "Urban but gateway to East Java. Mount Bromo accessible. Coastal area.",
        "safety": "Generally safe with standard awareness. Indonesian hospitality. Comfortable.",
        "food": "East Javanese cuisine with rawon and rujak cingur. Excellent local specialties.",
        "community": "Business and local community. Less international than Jakarta. Authentic.",
        "english": "Limited with Indonesian helpful. Business areas have some English.",
        "visa": "Indonesian visa rules. Visa on arrival or e-visa. 30-60 days.",
        "culture": "Indonesia's second city. Different character from Jakarta. East Javanese identity.",
        "cleanliness": "Developing with some challenges. Central areas maintained. Variable.",
        "airquality": "Can be affected by traffic and industry. Urban Indonesia. Variable."
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

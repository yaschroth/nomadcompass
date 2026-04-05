#!/usr/bin/env python3
"""
Generate unique, specific category descriptions for all cities.
Uses city data (scores, location, climate) to create contextual descriptions.
"""

import re
import json
from pathlib import Path
from typing import Dict, Any
import random

# Seed for reproducibility
random.seed(42)

def get_region(country: str) -> str:
    """Determine region from country."""
    regions = {
        # Southeast Asia
        "Thailand": "Southeast Asia", "Vietnam": "Southeast Asia", "Indonesia": "Southeast Asia",
        "Malaysia": "Southeast Asia", "Philippines": "Southeast Asia", "Cambodia": "Southeast Asia",
        "Laos": "Southeast Asia", "Myanmar": "Southeast Asia", "Singapore": "Southeast Asia",
        # East Asia
        "Japan": "East Asia", "South Korea": "East Asia", "Taiwan": "East Asia", "China": "East Asia",
        "Hong Kong": "East Asia",
        # South Asia
        "India": "South Asia", "Sri Lanka": "South Asia", "Nepal": "South Asia", "Bangladesh": "South Asia",
        # Middle East
        "UAE": "Middle East", "Israel": "Middle East", "Jordan": "Middle East", "Turkey": "Middle East",
        "Qatar": "Middle East", "Oman": "Middle East", "Kuwait": "Middle East", "Saudi Arabia": "Middle East",
        "Lebanon": "Middle East", "Palestine": "Middle East", "Bahrain": "Middle East",
        # Europe - Western
        "Portugal": "Western Europe", "Spain": "Western Europe", "France": "Western Europe",
        "Netherlands": "Western Europe", "Belgium": "Western Europe", "Luxembourg": "Western Europe",
        "UK": "Western Europe", "Ireland": "Western Europe", "Germany": "Western Europe",
        "Austria": "Western Europe", "Switzerland": "Western Europe",
        # Europe - Southern
        "Italy": "Southern Europe", "Greece": "Southern Europe", "Malta": "Southern Europe",
        "Cyprus": "Southern Europe", "Croatia": "Southern Europe", "Slovenia": "Southern Europe",
        "Montenegro": "Southern Europe", "Albania": "Southern Europe",
        # Europe - Eastern
        "Poland": "Eastern Europe", "Czech Republic": "Eastern Europe", "Hungary": "Eastern Europe",
        "Romania": "Eastern Europe", "Bulgaria": "Eastern Europe", "Slovakia": "Eastern Europe",
        "Ukraine": "Eastern Europe", "Serbia": "Eastern Europe", "Bosnia": "Eastern Europe",
        "North Macedonia": "Eastern Europe", "Kosovo": "Eastern Europe",
        # Europe - Nordic
        "Sweden": "Nordic", "Norway": "Nordic", "Denmark": "Nordic", "Finland": "Nordic",
        "Iceland": "Nordic", "Estonia": "Baltic", "Latvia": "Baltic", "Lithuania": "Baltic",
        # Caucasus
        "Georgia": "Caucasus", "Armenia": "Caucasus", "Azerbaijan": "Caucasus",
        # Latin America
        "Mexico": "Latin America", "Guatemala": "Central America", "Costa Rica": "Central America",
        "Panama": "Central America", "Nicaragua": "Central America", "Honduras": "Central America",
        "El Salvador": "Central America", "Belize": "Central America",
        "Colombia": "South America", "Ecuador": "South America", "Peru": "South America",
        "Bolivia": "South America", "Argentina": "South America", "Chile": "South America",
        "Brazil": "South America", "Uruguay": "South America", "Paraguay": "South America",
        # Caribbean
        "Dominican Republic": "Caribbean", "Puerto Rico": "Caribbean", "Cuba": "Caribbean",
        "Jamaica": "Caribbean",
        # North America
        "USA": "North America", "Canada": "North America",
        # Africa
        "Morocco": "North Africa", "Egypt": "North Africa", "Tunisia": "North Africa",
        "South Africa": "Southern Africa", "Kenya": "East Africa", "Tanzania": "East Africa",
        "Uganda": "East Africa", "Rwanda": "East Africa", "Ethiopia": "East Africa",
        "Ghana": "West Africa", "Senegal": "West Africa", "Nigeria": "West Africa",
        "Namibia": "Southern Africa", "Mozambique": "Southern Africa", "Mauritius": "East Africa",
        "Cape Verde": "West Africa", "Zanzibar": "East Africa",
        # Oceania
        "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Pacific Islands",
        "New Caledonia": "Pacific Islands",
    }
    return regions.get(country, "International")

def generate_climate_desc(city: Dict[str, Any]) -> str:
    """Generate climate description based on score and climate type."""
    score = city['scores']['climate']
    climate_type = city.get('climateType', 'Temperate')
    name = city['name']
    country = city['country']

    climate_details = {
        "Mediterranean": {
            "high": f"Blessed with a Mediterranean climate, {name} offers warm, dry summers and mild winters. Expect 300+ days of sunshine annually—ideal for outdoor work sessions.",
            "mid": f"{name}'s Mediterranean climate brings hot summers and cool winters. Best months are April-June and September-October when temperatures are perfect.",
            "low": f"While Mediterranean in character, {name} can get uncomfortably hot in summer (35°C+) and surprisingly cool in winter. Spring and fall are your best bet."
        },
        "Tropical": {
            "high": f"Year-round warmth in {name} with temperatures hovering around 25-32°C. The tropical climate means consistent conditions, though humidity is high.",
            "mid": f"{name}'s tropical climate brings warm temperatures year-round but significant monsoon rains from May-October. Dry season (Nov-Apr) is ideal for remote work.",
            "low": f"Tropical {name} struggles with extreme humidity, heavy monsoon rains, and occasional air quality issues from agricultural burning. Pack light and plan for AC-dependency."
        },
        "Tropical Savanna": {
            "high": f"{name} enjoys a pleasant tropical savanna climate with distinct wet and dry seasons. The dry season offers perfect working conditions with lower humidity.",
            "mid": f"Tropical savanna climate in {name} means warm temperatures year-round. Wet season brings afternoon thunderstorms, but mornings stay productive.",
            "low": f"The tropical savanna climate in {name} can be challenging—expect intense heat in the dry season and heavy rains that can disrupt plans during wet months."
        },
        "Highland": {
            "high": f"The eternal spring of {name}! Highland altitude keeps temperatures perfect (18-25°C) year-round. No need for AC or heating—nature's perfect workspace.",
            "mid": f"{name}'s highland climate offers pleasant temperatures most of the year, though nights can be cool. The altitude provides relief from tropical heat.",
            "low": f"Highland {name} can be unpredictable—cool mornings, warm afternoons, and occasional fog. The altitude affects some people, so give yourself time to adjust."
        },
        "Subtropical": {
            "high": f"Subtropical {name} delivers the best of both worlds—warm summers, mild winters, and enough seasons to keep things interesting. Year-round outdoor lifestyle possible.",
            "mid": f"{name}'s subtropical climate means hot, humid summers and pleasant winters. Spring and autumn are ideal; summer requires good AC.",
            "low": f"Subtropical {name} can be challenging—summers bring oppressive humidity and heat, while winters can be surprisingly cold and damp."
        },
        "Temperate": {
            "high": f"{name} enjoys mild temperate weather that rarely goes to extremes. Four distinct seasons keep life interesting, with comfortable summers and manageable winters.",
            "mid": f"Classic temperate climate in {name}—expect warm summers, cold winters, and the full range in between. Spring and fall offer the best working conditions.",
            "low": f"{name}'s temperate climate comes with all the downsides—grey winters, unpredictable rain, and limited sunshine. SAD lamps recommended."
        },
        "Desert": {
            "high": f"Desert climate in {name} means abundant sunshine and minimal rain. Winters are perfect (20-25°C), while summer heat is managed with excellent AC infrastructure.",
            "mid": f"{name}'s desert climate brings scorching summers (40°C+) but pleasant winters. Most nomads time their stays for October-April.",
            "low": f"Extreme desert heat in {name} makes summer nearly unbearable without constant AC. Sandstorms and dry air add to the challenges."
        },
        "Humid Subtropical": {
            "high": f"{name} offers a pleasant humid subtropical climate with warm, manageable summers and mild winters. Good outdoor working weather most of the year.",
            "mid": f"Humid subtropical {name} means sticky summers but comfortable shoulder seasons. Air conditioning is essential June through September.",
            "low": f"The humid subtropical climate of {name} brings oppressive summer humidity and typhoon risks. Winters can feel damp and cold."
        },
        "Oceanic": {
            "high": f"{name}'s oceanic climate is remarkably mild—no extreme temperatures, regular rainfall keeping things green, and comfortable year-round.",
            "mid": f"Oceanic {name} means mild but changeable weather. Expect rain throughout the year, but rarely extreme heat or cold.",
            "low": f"Grey skies are common in oceanic {name}. The mild temperatures come with frequent rain and limited sunshine—vitamin D supplements advised."
        },
        "Arid": {
            "high": f"Clear skies dominate in arid {name}. Low humidity makes even warm temperatures comfortable, and rain is rare.",
            "mid": f"Arid {name} offers plenty of sunshine but extreme temperature swings between day and night. Summers require careful heat management.",
            "low": f"The arid climate of {name} brings challenges—extreme heat, cold nights, and limited greenery. Not for those who need humidity."
        },
        "Continental": {
            "high": f"Continental {name} offers distinct seasons with comfortable summers perfect for outdoor work. Winters are cold but the city is well-prepared.",
            "mid": f"{name}'s continental climate means warm summers and cold winters. The shoulder seasons offer the best balance for outdoor activities.",
            "low": f"Harsh continental climate in {name}—brutally cold winters (-20°C possible) and hot summers. Indoor workspace essential half the year."
        },
        "Semi-Arid": {
            "high": f"Semi-arid {name} enjoys abundant sunshine with manageable heat levels. The dry air keeps temperatures comfortable even when it's warm.",
            "mid": f"{name}'s semi-arid climate brings hot summers and cool winters. Spring and fall are ideal, with clear skies most days.",
            "low": f"Semi-arid {name} can be harsh—dust storms, extreme summer heat, and cold winter nights. The dryness affects skin and sinuses."
        },
    }

    default_templates = {
        "high": f"{name} enjoys excellent weather conditions year-round. The climate supports an outdoor lifestyle with reliable conditions for remote work.",
        "mid": f"Weather in {name} has its seasons. Plan around the climate patterns to maximize your productivity and outdoor time.",
        "low": f"Climate can be challenging in {name}. Expect weather-related disruptions and plan indoor alternatives."
    }

    templates = climate_details.get(climate_type, default_templates)

    if score >= 8:
        return templates["high"]
    elif score >= 5:
        return templates["mid"]
    else:
        return templates["low"]

def generate_cost_desc(city: Dict[str, Any]) -> str:
    """Generate cost description based on score and cost per month."""
    score = city['scores']['cost']
    cost = city.get('costPerMonth', 2000)
    name = city['name']
    country = city['country']
    region = get_region(country)

    if score >= 8:
        if cost < 1000:
            return f"Exceptionally affordable at ${cost}/month. {name} offers incredible value—rent, food, and entertainment cost a fraction of Western prices. Your money goes far here."
        elif cost < 1500:
            return f"Highly affordable at around ${cost}/month including rent. {name} lets you live well on a modest budget—great local food, cheap transport, and reasonable accommodation."
        else:
            return f"Budget-friendly at ${cost}/month for a comfortable lifestyle. {name} offers good value compared to Western cities while maintaining quality of life."
    elif score >= 6:
        if cost < 2000:
            return f"Reasonable costs at ${cost}/month. {name} isn't the cheapest, but offers good value for money. Budget carefully for a comfortable stay."
        else:
            return f"Moderate budget needed at ${cost}/month. {name} balances quality of life with costs—not rock-bottom, but manageable with planning."
    elif score >= 4:
        if cost < 2500:
            return f"Mid-range costs at ${cost}/month. {name} requires a decent budget, but you get quality infrastructure and services in return."
        else:
            return f"Above-average expenses at ${cost}/month. {name} isn't cheap, but the cost reflects the quality of life and amenities available."
    else:
        if cost < 3500:
            return f"Expensive destination at ${cost}/month. {name} demands a higher budget—plan accordingly if you want to maintain your lifestyle here."
        else:
            return f"High cost of living at ${cost}+/month. {name} is one of the pricier nomad destinations. The trade-off is excellent infrastructure and quality of life."

def generate_wifi_desc(city: Dict[str, Any]) -> str:
    """Generate WiFi description based on score."""
    score = city['scores']['wifi']
    name = city['name']
    region = get_region(city['country'])

    if score >= 9:
        return f"World-class internet in {name}. Fiber is standard, coworking spaces offer 200+ Mbps, and even cafés have reliable high-speed connections. Video calls never buffer here."
    elif score >= 7:
        return f"Solid internet infrastructure in {name}. Most cafés and coworking spaces offer 50-100 Mbps. The occasional hiccup exists, but overall very reliable for remote work."
    elif score >= 5:
        return f"Decent connectivity in {name}. Main areas have reliable WiFi, but speeds vary. Coworking spaces are your best bet for important calls. Mobile data works as backup."
    elif score >= 3:
        return f"Internet quality varies significantly in {name}. Invest in a good coworking space or accommodation with verified fast WiFi. Mobile data can be unreliable."
    else:
        return f"Connectivity challenges in {name}. WiFi is inconsistent and often slow. Consider a portable router or plan calls carefully around connection windows."

def generate_nightlife_desc(city: Dict[str, Any]) -> str:
    """Generate nightlife description based on score."""
    score = city['scores']['nightlife']
    name = city['name']
    country = city['country']

    if score >= 9:
        return f"Legendary nightlife in {name}. From rooftop bars to underground clubs, the scene caters to every taste. The party doesn't stop until sunrise—pace yourself."
    elif score >= 7:
        return f"Vibrant social scene in {name}. Great bars, live music venues, and social events make it easy to meet people. Weekends get lively without being overwhelming."
    elif score >= 5:
        return f"Decent nightlife options in {name}. You'll find good bars and restaurants for socializing, though the club scene is limited. Weekends offer more energy."
    elif score >= 3:
        return f"Quieter evenings in {name}. A few good bars and restaurants exist for socializing, but don't expect a party scene. Great for focused work periods."
    else:
        return f"Very limited nightlife in {name}. This is a place for early mornings and peaceful evenings. Perfect if you're here to focus on work rather than play."

def generate_nature_desc(city: Dict[str, Any]) -> str:
    """Generate nature description based on score and region."""
    score = city['scores']['nature']
    name = city['name']
    country = city['country']
    region = get_region(country)
    climate = city.get('climateType', '')

    nature_types = {
        "Southeast Asia": "tropical beaches, jungle treks, and island hopping",
        "Pacific Islands": "pristine coral reefs, volcanic landscapes, and lagoon swimming",
        "South America": "Andean peaks, Amazon jungle, and diverse ecosystems",
        "Central America": "volcanic landscapes, cloud forests, and Caribbean coastline",
        "Caribbean": "crystal-clear waters, palm-lined beaches, and coral reefs",
        "Western Europe": "historic parks, countryside walks, and nearby natural reserves",
        "Southern Europe": "Mediterranean coastline, mountain ranges, and scenic trails",
        "Nordic": "dramatic fjords, northern lights, and pristine wilderness",
        "Oceania": "world-class beaches, unique wildlife, and diverse landscapes",
        "North Africa": "desert adventures, oases, and mountain trekking",
        "East Africa": "safari opportunities, volcanic landscapes, and tropical beaches",
    }

    nature_type = nature_types.get(region, "diverse natural landscapes and outdoor activities")

    if score >= 8:
        return f"Nature paradise around {name}. World-class access to {nature_type}. Weekend adventures are endless—bring your hiking boots and swimsuit."
    elif score >= 6:
        return f"Good nature access from {name}. Day trips offer {nature_type}. Parks and green spaces within the city provide daily escape from screens."
    elif score >= 4:
        return f"Some nature options near {name}. You'll need to travel a bit for serious outdoor adventures, but city parks and nearby escapes exist."
    else:
        return f"Limited natural escapes from {name}. This is primarily an urban destination. Plan occasional trips elsewhere if nature is important to you."

def generate_safety_desc(city: Dict[str, Any]) -> str:
    """Generate safety description based on score."""
    score = city['scores']['safety']
    name = city['name']

    if score >= 9:
        return f"Exceptionally safe in {name}. Walk alone at night, leave your laptop at cafés, and relax. Violent crime is nearly non-existent; petty theft is rare."
    elif score >= 7:
        return f"Very safe in {name}. Standard urban awareness applies—don't flash valuables and use common sense—but overall a secure environment for remote workers."
    elif score >= 5:
        return f"Generally safe in {name} with normal precautions. Avoid certain areas at night, watch for pickpockets in tourist zones, and stay aware of your surroundings."
    elif score >= 3:
        return f"Safety requires attention in {name}. Research neighborhoods before booking, avoid walking alone at night, and don't display expensive electronics openly."
    else:
        return f"Elevated safety concerns in {name}. Exercise significant caution, stay in well-reviewed areas, travel in groups when possible, and stay updated on local conditions."

def generate_food_desc(city: Dict[str, Any]) -> str:
    """Generate food description based on score and region."""
    score = city['scores']['food']
    name = city['name']
    country = city['country']
    region = get_region(country)

    cuisine_highlights = {
        "Thailand": "Thai curries, street pad thai, and tropical fruits",
        "Vietnam": "phở, bánh mì, and fresh spring rolls",
        "Japan": "ramen, sushi, and izakaya culture",
        "South Korea": "Korean BBQ, bibimbap, and street food",
        "Indonesia": "nasi goreng, satay, and Balinese cuisine",
        "India": "curries, street chaat, and regional specialties",
        "Mexico": "tacos, mole, and fresh ceviche",
        "Italy": "pasta, pizza, and regional traditions",
        "Spain": "tapas, paella, and Iberian ham",
        "Portugal": "pastéis de nata, bacalhau, and seafood",
        "France": "pastries, wine, and refined cuisine",
        "Greece": "gyros, fresh seafood, and mezze",
        "Turkey": "kebabs, meze, and Turkish breakfast",
        "Morocco": "tagines, couscous, and mint tea",
        "Peru": "ceviche, anticuchos, and fusion cuisine",
        "Argentina": "asado, empanadas, and Malbec",
        "Colombia": "arepas, bandeja paisa, and tropical fruits",
    }

    cuisine = cuisine_highlights.get(country, "local specialties and international options")

    if score >= 8:
        return f"Food paradise in {name}! From street vendors to fine dining, the culinary scene excels. Must-try: {cuisine}. Your taste buds will thank you."
    elif score >= 6:
        return f"Great food scene in {name}. Good variety of local cuisine and international options. {cuisine.split(',')[0]} is worth seeking out."
    elif score >= 4:
        return f"Decent food options in {name}. Local specialties are worth trying, and international restaurants fill the gaps. Quality varies by neighborhood."
    else:
        return f"Limited culinary scene in {name}. Basic options available, but don't expect foodie paradise. Cooking at home might become routine."

def generate_community_desc(city: Dict[str, Any]) -> str:
    """Generate community description based on score."""
    score = city['scores']['community']
    name = city['name']

    if score >= 9:
        return f"Massive nomad community in {name}. Coworking spaces overflow, meetups happen daily, and you'll make friends within hours. This is a digital nomad hub."
    elif score >= 7:
        return f"Strong nomad presence in {name}. Active coworking spaces, regular meetups, and established Facebook/Slack groups. Easy to find your tribe."
    elif score >= 5:
        return f"Growing nomad community in {name}. You'll find fellow remote workers at coworking spaces and occasional meetups. Takes more effort to connect."
    elif score >= 3:
        return f"Small but present nomad scene in {name}. A few dedicated coworking spaces and online groups exist. You might be helping to build the community."
    else:
        return f"Pioneer territory in {name}. Few nomads here means fewer built-in connections, but locals are often more curious and welcoming to remote workers."

def generate_english_desc(city: Dict[str, Any]) -> str:
    """Generate English proficiency description based on score and region."""
    score = city['scores']['english']
    name = city['name']
    country = city['country']

    native_english = ["USA", "UK", "Canada", "Australia", "New Zealand", "Ireland"]

    if country in native_english:
        return f"English is the native language in {name}. No language barriers here—focus entirely on your work and social life."

    if score >= 9:
        return f"Excellent English proficiency in {name}. Most locals speak fluent English, making daily life seamless. Menus, signs, and services all accommodate English speakers."
    elif score >= 7:
        return f"Good English levels in {name}. Service industry workers, young people, and professionals communicate well. You'll manage fine with English only."
    elif score >= 5:
        return f"Basic English in {name}. Tourist areas and younger generation communicate reasonably well. Learning key local phrases helps significantly."
    elif score >= 3:
        return f"Limited English in {name}. Translation apps become essential for daily tasks. The local language opens many doors—consider learning basics."
    else:
        return f"English rarely spoken in {name}. Prepare for language challenges daily. A phrasebook, translation app, and patience are must-haves."

def generate_visa_desc(city: Dict[str, Any]) -> str:
    """Generate visa description based on score and region."""
    score = city['scores']['visa']
    name = city['name']
    country = city['country']
    region = get_region(country)

    # Special visa situations
    special_visas = {
        "Thailand": "60-day tourist visa extendable to 90 days, plus 5-year LTR visa for remote workers. Visa runs to neighboring countries are common.",
        "Indonesia": "30-day visa-free for many nationalities, extendable to 60 days. Second-home visa (B211) popular for longer stays.",
        "Portugal": "90 days Schengen, D7 passive income visa, or new digital nomad visa for remote workers.",
        "Spain": "90 days Schengen. New digital nomad visa available for those earning €2,100+/month from foreign companies.",
        "Croatia": "90 days Schengen plus digital nomad visa for up to one year. EU candidates have easier processes.",
        "Mexico": "180 days visa-free for most nationalities. One of the easiest long-stay options—just show up.",
        "Colombia": "90 days visa-free, extendable to 180 days per year. Digital nomad visa now available.",
        "Georgia": "365 days visa-free for 95+ nationalities. One of the world's most nomad-friendly visa policies.",
        "UAE": "30-90 day tourist visas depending on nationality. Remote work visa available for those meeting income requirements.",
        "Estonia": "90 days Schengen. Digital nomad visa (Type D) for stays up to one year with €3,504/month income proof.",
    }

    if country in special_visas:
        return special_visas[country]

    if score >= 8:
        return f"Very nomad-friendly visa situation in {name}. Long tourist stays, easy extensions, or dedicated remote worker visas available. Minimal bureaucracy."
    elif score >= 6:
        return f"Manageable visa requirements for {name}. Standard tourist visa with possible extensions. Research requirements for your nationality in advance."
    elif score >= 4:
        return f"Moderate visa complexity for {name}. Time-limited stays may require border runs or visa applications. Plan your stay duration carefully."
    else:
        return f"Challenging visa situation for {name}. Strict limits on stays, difficult extensions, or expensive requirements. Not ideal for long-term nomading."

def generate_culture_desc(city: Dict[str, Any]) -> str:
    """Generate culture description based on score."""
    score = city['scores'].get('culture', 5)
    name = city['name']
    country = city['country']

    if score >= 8:
        return f"Cultural treasure trove in {name}. World-class museums, historic sites, vibrant arts scene, and rich local traditions. Every day offers discovery."
    elif score >= 6:
        return f"Good cultural offerings in {name}. Museums, galleries, and cultural events provide plenty to explore. Historic neighborhoods tell local stories."
    elif score >= 4:
        return f"Some cultural attractions in {name}. A few museums and historic sites worth visiting, though not a primary draw for culture enthusiasts."
    else:
        return f"Limited cultural scene in {name}. Focus here is more on nature or business than arts and history. Look elsewhere for museum days."

def generate_cleanliness_desc(city: Dict[str, Any]) -> str:
    """Generate cleanliness description based on score."""
    score = city['scores'].get('cleanliness', 5)
    name = city['name']

    if score >= 8:
        return f"Spotlessly clean streets in {name}. Well-maintained public spaces, efficient waste management, and pride in urban appearance. A pleasure to walk around."
    elif score >= 6:
        return f"Generally clean in {name}. Main areas are well-maintained, though some neighborhoods vary. Standard urban tidiness with reasonable upkeep."
    elif score >= 4:
        return f"Mixed cleanliness in {name}. Tourist areas are maintained, but local neighborhoods can be rough. Expect some urban grit."
    else:
        return f"Cleanliness challenges in {name}. Street litter, irregular waste collection, and infrastructure strain are noticeable. Part of the authentic experience."

def generate_airquality_desc(city: Dict[str, Any]) -> str:
    """Generate air quality description based on score."""
    score = city['scores'].get('airquality', 5)
    name = city['name']
    country = city['country']

    if score >= 8:
        return f"Excellent air quality in {name}. Breathe easy with clean, fresh air year-round. No air purifier needed—open those windows and enjoy."
    elif score >= 6:
        return f"Good air quality in {name} most of the year. Occasional pollution days happen, but generally healthy breathing conditions."
    elif score >= 4:
        return f"Variable air quality in {name}. Check AQI regularly, especially in certain seasons. An air purifier in your accommodation is worthwhile."
    else:
        return f"Air quality concerns in {name}. Regular pollution spikes, seasonal burning, or industrial emissions affect health. Air purifier essential, mask recommended on bad days."

def generate_all_descriptions(city: Dict[str, Any]) -> Dict[str, str]:
    """Generate all category descriptions for a city."""
    return {
        "climate": generate_climate_desc(city),
        "cost": generate_cost_desc(city),
        "wifi": generate_wifi_desc(city),
        "nightlife": generate_nightlife_desc(city),
        "nature": generate_nature_desc(city),
        "safety": generate_safety_desc(city),
        "food": generate_food_desc(city),
        "community": generate_community_desc(city),
        "english": generate_english_desc(city),
        "visa": generate_visa_desc(city),
        "culture": generate_culture_desc(city),
        "cleanliness": generate_cleanliness_desc(city),
        "airquality": generate_airquality_desc(city),
    }

def load_cities_data(data_file: Path) -> list:
    """Load city data from cities-data.js by parsing individual city blocks."""
    content = data_file.read_text(encoding='utf-8')
    cities = []

    # Find each city block between { id: "..." ... }
    # Match city objects with nested scores object
    pattern = r'\{\s*id:\s*"([^"]+)"[^}]*?climateType:\s*"([^"]*)"[^}]*?name:\s*"([^"]+)"[^}]*?country:\s*"([^"]+)"[^}]*?scores:\s*\{([^}]+)\}[^}]*?costPerMonth:\s*(\d+)'

    for match in re.finditer(pattern, content, re.DOTALL):
        city_id = match.group(1)
        climate_type = match.group(2)
        name = match.group(3)
        country = match.group(4)
        scores_text = match.group(5)
        cost_per_month = int(match.group(6))

        # Parse scores
        scores = {}
        score_pattern = r'(\w+):\s*(\d+)'
        for score_match in re.finditer(score_pattern, scores_text):
            scores[score_match.group(1)] = int(score_match.group(2))

        cities.append({
            'id': city_id,
            'climateType': climate_type,
            'name': name,
            'country': country,
            'scores': scores,
            'costPerMonth': cost_per_month
        })

    return cities

def update_city_html(html_path: Path, descriptions: Dict[str, str]) -> bool:
    """Update the CATEGORY_DESCRIPTIONS in a city HTML file."""
    content = html_path.read_text(encoding='utf-8')

    # Create the new descriptions JSON
    desc_json = json.dumps(descriptions, ensure_ascii=False)

    # Pattern to match existing CATEGORY_DESCRIPTIONS - handles the full JSON object
    # The JSON object can contain nested quotes, so we match from the opening to the closing };
    pattern = r'const CATEGORY_DESCRIPTIONS = \{[^;]+\};'
    replacement = f'const CATEGORY_DESCRIPTIONS = {desc_json};'

    if not re.search(pattern, content):
        # Try alternative pattern for multiline
        pattern = r'const CATEGORY_DESCRIPTIONS = \{.*?\};'
        if not re.search(pattern, content, re.DOTALL):
            return False

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        html_path.write_text(new_content, encoding='utf-8')
        return True
    return False

def main():
    base_dir = Path(r'C:/Users/yasch/Coding Projects/Website Projects/nomadcompass')
    cities_dir = base_dir / 'cities'
    data_file = base_dir / 'cities-data.js'

    print("Loading city data...")
    cities = load_cities_data(data_file)
    print(f"Loaded {len(cities)} cities from data file")

    # Create a lookup by ID
    cities_by_id = {c['id']: c for c in cities}

    updated = 0
    skipped = 0
    errors = []

    for html_path in sorted(cities_dir.glob('*.html')):
        city_id = html_path.stem

        if city_id not in cities_by_id:
            print(f"  Skipped {city_id}: not in cities-data.js")
            skipped += 1
            continue

        city = cities_by_id[city_id]
        descriptions = generate_all_descriptions(city)

        try:
            if update_city_html(html_path, descriptions):
                print(f"  Updated {city_id}")
                updated += 1
            else:
                print(f"  Skipped {city_id}: no pattern found")
                skipped += 1
        except Exception as e:
            print(f"  Error {city_id}: {e}")
            errors.append(city_id)

    print(f"\nDone! Updated {updated}, skipped {skipped}, errors {len(errors)}")
    if errors:
        print(f"Errors: {errors}")

if __name__ == "__main__":
    main()

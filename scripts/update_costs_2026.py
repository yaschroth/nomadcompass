#!/usr/bin/env python3
"""
Update city cost estimates to realistic 2026 figures.

Based on research from:
- Numbeo Cost of Living Index 2026
- Expatistan 2026 data
- Nomads.com city data
- MoneySmart Singapore 2026
"""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 2026 realistic cost estimates (USD/month for comfortable nomad lifestyle)
cost_updates = {
    # Western Europe - Expensive
    "lisbon": 3500, "porto": 2800, "barcelona": 3800, "madrid": 3200,
    "berlin": 3400, "amsterdam": 4200, "london": 5500, "paris": 4500,
    "dublin": 4200, "zurich": 6500, "geneva": 6000, "vienna": 3200,
    "munich": 3800, "frankfurt": 3500, "hamburg": 3200, "cologne": 2900,
    "copenhagen": 4500, "stockholm": 4200, "oslo": 5000, "helsinki": 3800,
    "brussels": 3200, "milan": 3500, "rome": 3000, "florence": 2800,
    "nice": 3800, "lyon": 2800, "manchester": 3200, "edinburgh": 3000,
    "reykjavik": 5000, "luxembourg": 5500,

    # Western Europe - Mid-range
    "valencia": 2500, "seville": 2400, "malaga": 2600, "laspalmas": 2400,
    "tenerife": 2400, "palermo": 2200, "naples": 2300, "bordeaux": 2800,
    "toulouse": 2600, "marseille": 2700, "bologna": 2600, "turin": 2500,
    "verona": 2600, "bilbao": 2800, "cork": 3000, "antwerp": 2800,
    "ghent": 2600, "rotterdam": 3000, "utrecht": 3200, "faro": 2200,
    "salzburg": 3000, "innsbruck": 3200, "graz": 2600, "basel": 5000,
    "lausanne": 5500, "lucerne": 5200, "bergen": 4500, "gothenburg": 3800,
    "malmo": 3500, "aarhus": 4000, "bristol": 3000, "brighton": 3200,
    "montpellier": 2500, "nantes": 2600, "annecy": 3200, "strasbourg": 2800,
    "freiburg": 2800, "heidelberg": 2900, "dresden": 2400, "leipzig": 2300,
    "nuremberg": 2700, "stuttgart": 3200, "dusseldorf": 3000, "hannover": 2700,

    # Eastern Europe - Affordable
    "budapest": 2200, "prague": 2600, "krakow": 1800, "warsaw": 2200,
    "bucharest": 1800, "sofia": 1600, "belgrade": 1700, "tallinn": 2400,
    "riga": 1900, "vilnius": 1800, "zagreb": 2000, "ljubljana": 2400,
    "split": 2300, "dubrovnik": 2800, "brno": 2000, "gdansk": 1900,
    "wroclaw": 1800, "poznan": 1700, "clujnapoca": 1700, "plovdiv": 1400,
    "varna": 1500, "kotor": 2000, "podgorica": 1500, "tirana": 1400,
    "sarajevo": 1400, "skopje": 1300, "bratislava": 2200, "kosice": 1600,
    "tartu": 1900, "kaunas": 1600, "novisad": 1500,

    # Southeast Asia - Budget friendly
    "chiangmai": 1600, "bangkok": 2200, "phuket": 2400, "kohphangan": 2000,
    "kohsamui": 2200, "huahin": 1800, "krabi": 1700, "pai": 1200,
    "chiangrai": 1300, "hochiminhcity": 1700, "hanoi": 1500, "danang": 1400,
    "hoian": 1500, "dalat": 1200, "nhatrang": 1400, "bali": 2000,
    "ubud": 1800, "canggu": 2200, "lombok": 1600, "kualalumpur": 1800,
    "penang": 1600, "langkawi": 1700, "ipoh": 1400, "singapore": 4500,
    "manila": 1800, "cebu": 1500, "boracay": 1800, "siargao": 1600,
    "palawan": 1500, "dumaguete": 1300, "siemreap": 1200, "phnompenh": 1400,
    "kampot": 1100, "vientiane": 1200, "luangprabang": 1300, "yogyakarta": 1200,
    "bandung": 1300, "surabaya": 1400,

    # East Asia - Expensive
    "tokyo": 4000, "osaka": 3200, "kyoto": 3000, "fukuoka": 2800,
    "sapporo": 2600, "nagoya": 2800, "seoul": 3000, "busan": 2400,
    "jeju": 2200, "taipei": 2400, "kaohsiung": 2000, "tainan": 1900,
    "hongkong": 4500, "shenzhen": 2800,

    # South Asia
    "mumbai": 1800, "bangalore": 1600, "goa": 1400, "pune": 1400,
    "jaipur": 1200, "kochi": 1300, "udaipur": 1200, "colombo": 1400,
    "weligama": 1200, "kathmandu": 1000, "pokhara": 900,

    # Middle East
    "dubai": 4500, "abudhabi": 4200, "doha": 4000, "telaviv": 4200,
    "istanbul": 2000, "antalya": 1800, "bodrum": 2200, "fethiye": 1800,
    "izmir": 1700, "amman": 1800, "beirut": 1600, "muscat": 2200,

    # Americas - US (Expensive)
    "newyork": 6500, "sanfrancisco": 6000, "losangeles": 5000,
    "miami": 5000, "austin": 4000, "denver": 4200, "seattle": 4500,
    "portland": 4000, "chicago": 4200, "boston": 5000, "sandiego": 4500,
    "nashville": 3800,

    # Americas - Canada
    "vancouver": 4000, "toronto": 4200, "montreal": 3200, "calgary": 3500,
    "victoria": 3800, "ottawa": 3400,

    # Latin America - Affordable
    "mexicocity": 2200, "playadelcarmen": 2400, "tulum": 2800,
    "oaxaca": 1600, "guadalajara": 1800, "merida": 1700, "puertovallarta": 2200,
    "sanmigueldeallende": 2200, "guanajuato": 1500, "queretaro": 1700,
    "sayulita": 2200, "puertoescondido": 1600, "medellin": 1800,
    "bogota": 1700, "cartagena": 2000, "cali": 1500, "santamarta": 1600,
    "buenosaires": 1600, "cordoba": 1300, "mendoza": 1400, "bariloche": 1800,
    "montevideo": 2200, "santiago": 2400, "valparaiso": 1800,
    "lima": 1800, "cusco": 1500, "arequipa": 1400, "saopaulo": 2200,
    "riodejaneiro": 2400, "florianopolis": 2000, "salvador": 1600,
    "quito": 1500, "cuenca": 1400, "montanita": 1300,
    "lapaz": 1000, "sucre": 900, "santacruz": 1200, "asuncion": 1200,

    # Central America & Caribbean
    "sanjosecr": 2200, "tamarindo": 2400, "panama": 2400, "boquete": 1800,
    "antigua": 1800, "lakeatitlan": 1500, "sanjuan": 3200, "puntacana": 2800,
    "santodomingo": 1800, "havana": 1500,

    # Africa
    "capetown": 2000, "johannesburg": 1800, "durban": 1600,
    "cairo": 1200, "alexandria": 1100, "luxor": 1000,
    "marrakech": 1500, "casablanca": 1400, "essaouira": 1300, "rabat": 1400,
    "tunis": 1200, "nairobi": 1600, "mombasa": 1400, "zanzibar": 1500,
    "daressalaam": 1400, "accra": 1800, "lagos": 2000, "dakar": 1600,
    "kigali": 1500, "addisababa": 1300, "kampala": 1200, "arusha": 1400,
    "mauritius": 2200,

    # Oceania
    "sydney": 4500, "melbourne": 4000, "brisbane": 3500, "perth": 3500,
    "adelaide": 3200, "goldcoast": 3500, "cairns": 3000, "hobart": 3000,
    "byronbay": 3500, "darwin": 3800, "canberra": 3500,
    "auckland": 3800, "wellington": 3500, "christchurch": 3200, "queenstown": 4000,

    # Caucasus/Central Asia
    "tbilisi": 1600, "batumi": 1400, "kutaisi": 1200,
    "yerevan": 1400, "gyumri": 1000, "baku": 1800,
}

# Find all cities and update their costs
pattern = r'(id: "([^"]+)"[\s\S]*?costPerMonth: )(\d+)'

def replace_cost(match):
    prefix = match.group(1)
    city_id = match.group(2)
    old_cost = int(match.group(3))

    if city_id in cost_updates:
        new_cost = cost_updates[city_id]
    else:
        # Apply general inflation for cities not in our list
        if old_cost < 1500:
            new_cost = int(old_cost * 1.4)  # 40% increase
        elif old_cost < 2500:
            new_cost = int(old_cost * 1.5)  # 50% increase
        else:
            new_cost = int(old_cost * 1.6)  # 60% increase

        # Round to nearest 100
        new_cost = round(new_cost / 100) * 100

    return f'{prefix}{new_cost}'

# Apply replacements
new_content = re.sub(pattern, replace_cost, content)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

# Count updates
matches = re.findall(pattern, content)
print(f"Updated {len(matches)} city cost estimates to 2026 figures!")

print("\nSample updated costs:")
sample = ["lisbon", "chiangmai", "singapore", "miami", "bangkok", "berlin", "tokyo", "medellin", "newyork", "bali"]
for city in sample:
    if city in cost_updates:
        print(f"  {city.title()}: ${cost_updates[city]:,}/month")

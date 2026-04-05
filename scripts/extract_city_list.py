#!/usr/bin/env python3
"""
Extract city list from cities-data.js for restaurant data processing.
Creates a JSON file with city id, name, and country for all 420 cities.
"""

import re
import json
import os

BASE_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass"
CITIES_DATA_FILE = os.path.join(BASE_DIR, "cities-data.js")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "city_list.json")

def extract_cities():
    """Extract city data from cities-data.js"""

    with open(CITIES_DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match each city object
    # Looking for: id: "...", name: "...", country: "..."
    pattern = r'\{\s*id:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?country:\s*"([^"]+)"'

    matches = re.findall(pattern, content, re.DOTALL)

    cities = []
    for match in matches:
        city_id, name, country = match
        cities.append({
            "id": city_id,
            "name": name,
            "country": country,
            "search_query": f"best restaurants in {name} {country}"
        })

    return cities

def main():
    print("Extracting city list from cities-data.js...")

    cities = extract_cities()

    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(cities, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(cities)} cities")
    print(f"Saved to: {OUTPUT_FILE}")

    # Print sample
    print("\nSample entries:")
    for city in cities[:5]:
        print(f"  - {city['id']}: {city['name']}, {city['country']}")

    # Generate search queries list for Apify
    queries_file = os.path.join(BASE_DIR, "data", "search_queries.txt")
    with open(queries_file, 'w', encoding='utf-8') as f:
        for city in cities:
            f.write(city['search_query'] + '\n')

    print(f"\nSearch queries saved to: {queries_file}")

if __name__ == "__main__":
    main()

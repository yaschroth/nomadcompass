#!/usr/bin/env python3
"""
Fetch top-rated restaurants for NomadCompass cities.
Uses web search to find highly-rated restaurants with 50+ reviews.

Usage:
    python scripts/fetch_restaurants.py [city_id]

    If city_id is provided, fetches data for that city only.
    Otherwise, processes all cities that don't have restaurant data yet.
"""

import json
import os
import re
import urllib.parse
import urllib.request
import time
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_FILE = BASE_DIR / "data" / "restaurants.json"
CITIES_DATA = BASE_DIR / "cities-data.js"

def load_restaurant_data():
    """Load existing restaurant data from JSON file."""
    if DATA_FILE.exists():
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_restaurant_data(data):
    """Save restaurant data to JSON file."""
    DATA_FILE.parent.mkdir(exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def extract_cities_from_js():
    """Extract city IDs and names from cities-data.js."""
    cities = []
    with open(CITIES_DATA, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all city objects
    pattern = r'id:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?country:\s*"([^"]+)"'
    matches = re.findall(pattern, content, re.DOTALL)

    for city_id, name, country in matches:
        cities.append({
            'id': city_id,
            'name': name,
            'country': country
        })

    return cities

def create_google_maps_url(restaurant_name, city_name, country):
    """Create a Google Maps search URL for a restaurant."""
    query = f"{restaurant_name} {city_name} {country}"
    encoded = urllib.parse.quote(query)
    return f"https://www.google.com/maps/search/{encoded}"

def add_restaurant_manually(city_id, city_name, country):
    """Add restaurant data manually (template for filling in)."""
    return [
        {
            "name": f"Top Restaurant 1 in {city_name}",
            "type": "Local Cuisine",
            "rating": 4.5,
            "reviews": 100,
            "description": f"Highly rated restaurant in {city_name}. Update with real data.",
            "booking_url": create_google_maps_url(f"best restaurant", city_name, country),
            "price": "$$"
        },
        {
            "name": f"Top Restaurant 2 in {city_name}",
            "type": "International",
            "rating": 4.4,
            "reviews": 75,
            "description": f"Popular dining spot in {city_name}. Update with real data.",
            "booking_url": create_google_maps_url(f"top rated restaurant", city_name, country),
            "price": "$$"
        },
        {
            "name": f"Top Restaurant 3 in {city_name}",
            "type": "Cafe & Bar",
            "rating": 4.3,
            "reviews": 60,
            "description": f"Favorite local spot in {city_name}. Update with real data.",
            "booking_url": create_google_maps_url(f"popular cafe", city_name, country),
            "price": "$"
        }
    ]

def main():
    import sys

    # Load existing data
    data = load_restaurant_data()
    cities = extract_cities_from_js()

    print(f"Found {len(cities)} cities in cities-data.js")

    # Get cities without restaurant data
    if len(sys.argv) > 1:
        # Process specific city
        city_id = sys.argv[1].lower()
        cities = [c for c in cities if c['id'] == city_id]
        if not cities:
            print(f"City '{city_id}' not found!")
            return

    # Filter cities without data
    cities_to_process = [c for c in cities if c['id'] not in data or c['id'] in ['_comment', '_format']]

    print(f"Cities needing restaurant data: {len(cities_to_process)}")

    for city in cities_to_process:
        city_id = city['id']
        city_name = city['name']
        country = city['country']

        print(f"\nProcessing: {city_name}, {country}")

        # For now, create placeholder data
        # In the future, this could use an API to fetch real data
        restaurants = add_restaurant_manually(city_id, city_name, country)
        data[city_id] = restaurants

        print(f"  Added {len(restaurants)} placeholder restaurants")

    # Save updated data
    save_restaurant_data(data)
    print(f"\nSaved restaurant data to {DATA_FILE}")

if __name__ == "__main__":
    main()

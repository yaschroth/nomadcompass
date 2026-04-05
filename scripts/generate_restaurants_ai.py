#!/usr/bin/env python3
"""
Generate realistic restaurant data for cities using AI.

This script uses Claude to generate research-based restaurant recommendations.
The AI suggests real restaurants that actually exist based on its knowledge.

Usage:
    python scripts/generate_restaurants_ai.py --city lisbon
    python scripts/generate_restaurants_ai.py --batch 10
    python scripts/generate_restaurants_ai.py --all --skip-existing
"""

import json
import os
import time
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
CITY_LIST_FILE = BASE_DIR / "data" / "city_list.json"
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

# Try to import Anthropic
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


def load_city_list():
    """Load city list from JSON."""
    with open(CITY_LIST_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_existing_restaurants():
    """Load existing restaurant data."""
    if not RESTAURANTS_FILE.exists():
        return {}
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith('_')}


def generate_restaurants_ai(city_name, country, count=3):
    """
    Generate restaurant recommendations using Claude AI.
    Returns list of restaurant dicts.
    """
    if not HAS_ANTHROPIC:
        print("  Error: anthropic package not installed")
        return None

    client = anthropic.Anthropic()

    prompt = f"""You are a food expert recommending the best restaurants in {city_name}, {country}.

Generate {count} restaurant recommendations - real places that digital nomads and travelers should try.

For each restaurant, provide:
1. name: The actual restaurant name
2. type: Cuisine type (e.g., "Seafood", "Italian", "Thai Street Food")
3. rating: Estimated rating 4.0-5.0
4. reviews: Estimated review count (realistic: 500-15000 for popular places)
5. description: 1-2 sentences about what makes it special
6. price: Price level ($, $$, $$$, or $$$$)

IMPORTANT:
- Recommend REAL restaurants that exist or are highly likely to exist
- Mix different price points and cuisine types
- Include at least one local/traditional option
- Keep descriptions concise and specific

Return ONLY valid JSON array, no other text:
[
  {{"name": "...", "type": "...", "rating": 4.5, "reviews": 5000, "description": "...", "price": "$$"}},
  ...
]"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract JSON from response
        text = response.content[0].text.strip()

        # Try to parse JSON
        try:
            restaurants = json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from text
            match = re.search(r'\[[\s\S]*\]', text)
            if match:
                restaurants = json.loads(match.group())
            else:
                print(f"  Failed to parse response: {text[:200]}")
                return None

        # Validate and enhance data
        for r in restaurants:
            # Add booking URL
            search_query = f"{r['name']} {city_name}".replace(" ", "+")
            r['booking_url'] = f"https://www.google.com/maps/search/{search_query}"
            r['image'] = None  # Will be filled later

        return restaurants

    except Exception as e:
        print(f"  API error: {e}")
        return None


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Generate AI restaurant data')
    parser.add_argument('--city', type=str, help='Process specific city ID')
    parser.add_argument('--batch', type=int, help='Process first N cities')
    parser.add_argument('--all', action='store_true', help='Process all cities')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Skip cities that already have data')
    parser.add_argument('--count', type=int, default=3,
                        help='Number of restaurants per city')
    parser.add_argument('--delay', type=float, default=1.0,
                        help='Delay between API calls (seconds)')

    args = parser.parse_args()

    if not HAS_ANTHROPIC:
        print("Error: anthropic package not installed")
        print("Install with: pip install anthropic")
        return

    if not os.environ.get('ANTHROPIC_API_KEY'):
        print("Error: ANTHROPIC_API_KEY not set")
        return

    # Load data
    cities = load_city_list()
    existing = load_existing_restaurants()

    print(f"Loaded {len(cities)} cities")
    print(f"Existing data for {len(existing)} cities")

    # Filter cities
    cities_to_process = []
    for city in cities:
        city_id = city['id']

        if args.city and city_id != args.city:
            continue

        if args.skip_existing and city_id in existing:
            continue

        cities_to_process.append(city)

    if args.batch:
        cities_to_process = cities_to_process[:args.batch]

    if not args.all and not args.batch and not args.city:
        print("Specify --all, --batch N, or --city ID")
        return

    print(f"Processing {len(cities_to_process)} cities...")

    # Generate restaurants
    new_data = dict(existing)
    success_count = 0
    fail_count = 0

    for i, city in enumerate(cities_to_process):
        city_id = city['id']
        city_name = city['name']
        country = city['country']

        print(f"\n[{i+1}/{len(cities_to_process)}] {city_name}, {country}...")

        restaurants = generate_restaurants_ai(city_name, country, args.count)

        if restaurants:
            new_data[city_id] = restaurants
            success_count += 1
            for r in restaurants:
                print(f"  - {r['name']} ({r['type']}, {r['price']})")
        else:
            fail_count += 1

        # Rate limiting
        if i < len(cities_to_process) - 1:
            time.sleep(args.delay)

    # Save results
    output = {
        "_comment": "Restaurant data for NomadCompass city pages. Top-rated restaurants with 50+ reviews.",
        "_format": {
            "name": "Restaurant name",
            "type": "Cuisine type",
            "rating": "Rating out of 5",
            "reviews": "Number of reviews (50+)",
            "description": "Brief description",
            "booking_url": "Link to Google Maps",
            "price": "Price range ($, $$, $$$, $$$$)",
            "image": "Restaurant image URL"
        },
        **new_data
    }

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*50}")
    print(f"Success: {success_count} cities")
    print(f"Failed: {fail_count} cities")
    print(f"Saved to: {RESTAURANTS_FILE}")


if __name__ == "__main__":
    main()

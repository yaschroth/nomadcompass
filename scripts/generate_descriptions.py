#!/usr/bin/env python3
"""
Generate AI descriptions for restaurants.

This script takes raw restaurant data (from Apify) and generates
compelling descriptions using Claude AI.

Can be run with or without API - if no API key, generates template descriptions.
"""

import json
import os
import time
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_FILE = BASE_DIR / "data" / "restaurants_raw.json"
OUTPUT_FILE = BASE_DIR / "data" / "restaurants.json"
CITY_LIST_FILE = BASE_DIR / "data" / "city_list.json"

# Try to import Anthropic
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


def load_city_list():
    """Load city list for context."""
    with open(CITY_LIST_FILE, 'r', encoding='utf-8') as f:
        cities = json.load(f)
    return {c['id']: c for c in cities}


def generate_description_ai(restaurant, city_name, country):
    """Generate description using Claude API."""
    if not HAS_ANTHROPIC:
        return None

    client = anthropic.Anthropic()

    prompt = f"""Generate a compelling 1-2 sentence description for this restaurant in {city_name}, {country}.

Restaurant: {restaurant['name']}
Type: {restaurant['type']}
Rating: {restaurant['rating']}/5 ({restaurant['reviews']} reviews)
Price: {restaurant['price']}

Guidelines:
- Highlight what makes it special (signature dish, atmosphere, accolades)
- Be specific to this restaurant, not generic
- Keep it under 25 words
- Don't mention the rating or review count (that's shown separately)

Return ONLY the description, no quotes or extra text."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"  API error: {e}")
        return None


def generate_description_template(restaurant, city_name):
    """Generate a template description without AI."""
    name = restaurant['name']
    rtype = restaurant['type']
    price = restaurant.get('price', '$$')

    # Price-based description
    if price == '$$$$':
        price_desc = "upscale"
    elif price == '$$$':
        price_desc = "refined"
    elif price == '$':
        price_desc = "affordable"
    else:
        price_desc = "popular"

    # Type-based templates
    templates = {
        'seafood': f"Fresh catches and ocean flavors at this {price_desc} {city_name} favorite.",
        'italian': f"Authentic Italian flavors with handmade pasta and regional specialties.",
        'japanese': f"Traditional Japanese cuisine with fresh ingredients and meticulous preparation.",
        'sushi': f"Premium sushi and sashimi in an elegant setting.",
        'indian': f"Rich curries and aromatic spices in a welcoming atmosphere.",
        'thai': f"Authentic Thai flavors balancing sweet, sour, salty, and spicy.",
        'mexican': f"Traditional Mexican dishes with bold flavors and fresh ingredients.",
        'french': f"Classic French cuisine with elegant presentation and refined flavors.",
        'chinese': f"Authentic Chinese specialties from various regional traditions.",
        'korean': f"Korean BBQ and traditional dishes with bold, fermented flavors.",
        'vietnamese': f"Fresh Vietnamese cuisine with aromatic herbs and light flavors.",
        'mediterranean': f"Sun-kissed Mediterranean flavors with olive oil and fresh produce.",
        'steakhouse': f"Premium cuts expertly prepared in a classic steakhouse setting.",
        'pizza': f"Wood-fired pizzas with quality toppings and crispy crusts.",
        'cafe': f"Cozy atmosphere with quality coffee and light bites.",
        'bar': f"Great drinks and atmosphere for socializing.",
        'bakery': f"Freshly baked goods and pastries made daily.",
        'vegetarian': f"Creative plant-based dishes that satisfy any palate.",
        'vegan': f"Innovative vegan cuisine that delights meat-eaters and vegans alike.",
        'tapas': f"Small plates perfect for sharing and trying multiple flavors.",
        'breakfast': f"Morning favorites done right with quality ingredients.",
        'brunch': f"Weekend brunch destination with creative dishes.",
    }

    # Try to match cuisine type
    rtype_lower = rtype.lower()
    for key, template in templates.items():
        if key in rtype_lower:
            return template

    # Default template
    return f"A {price_desc} {rtype.lower()} destination beloved by locals and visitors alike."


def generate_descriptions_batch(restaurants_by_city, cities_lookup, use_ai=False):
    """
    Generate descriptions for all restaurants.

    Args:
        restaurants_by_city: Dict of city_id -> list of restaurants
        cities_lookup: Dict of city_id -> city info
        use_ai: Whether to use Claude API (requires ANTHROPIC_API_KEY)
    """
    total_generated = 0

    for city_id, restaurants in restaurants_by_city.items():
        city_info = cities_lookup.get(city_id, {})
        city_name = city_info.get('name', city_id.title())
        country = city_info.get('country', '')

        print(f"\nProcessing {city_name}...")

        for restaurant in restaurants:
            if restaurant.get('description'):
                continue  # Already has description

            if use_ai:
                desc = generate_description_ai(restaurant, city_name, country)
                if desc:
                    restaurant['description'] = desc
                    total_generated += 1
                    print(f"  {restaurant['name']}: {desc[:50]}...")
                    time.sleep(0.5)  # Rate limiting
                else:
                    # Fallback to template
                    restaurant['description'] = generate_description_template(restaurant, city_name)
                    total_generated += 1
            else:
                restaurant['description'] = generate_description_template(restaurant, city_name)
                total_generated += 1

    return total_generated


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Generate restaurant descriptions')
    parser.add_argument('--ai', action='store_true',
                        help='Use Claude AI (requires ANTHROPIC_API_KEY)')
    parser.add_argument('--input', type=str, default=str(RAW_DATA_FILE),
                        help='Input JSON file with raw restaurant data')
    parser.add_argument('--output', type=str, default=str(OUTPUT_FILE),
                        help='Output JSON file')
    parser.add_argument('--city', type=str,
                        help='Process only specific city')

    args = parser.parse_args()

    # Load data
    input_file = Path(args.input)
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        print("Run fetch_apify_restaurants.py first or provide --input file")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)

    cities_lookup = load_city_list()

    # Filter to specific city if requested
    if args.city:
        if args.city not in restaurants:
            print(f"City '{args.city}' not found in input data")
            return
        restaurants = {args.city: restaurants[args.city]}

    print(f"Processing {len(restaurants)} cities...")

    # Check AI availability
    use_ai = args.ai and HAS_ANTHROPIC and os.environ.get('ANTHROPIC_API_KEY')
    if args.ai and not use_ai:
        if not HAS_ANTHROPIC:
            print("Warning: anthropic package not installed. Using template descriptions.")
        else:
            print("Warning: ANTHROPIC_API_KEY not set. Using template descriptions.")
    elif use_ai:
        print("Using Claude AI for descriptions")
    else:
        print("Using template descriptions")

    # Generate descriptions
    total = generate_descriptions_batch(restaurants, cities_lookup, use_ai)
    print(f"\nGenerated {total} descriptions")

    # Add metadata
    output_data = {
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
        **restaurants
    }

    # Save output
    output_file = Path(args.output)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()

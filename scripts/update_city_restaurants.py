#!/usr/bin/env python3
"""
Update city HTML pages with restaurant data from restaurants.json.

Usage:
    python scripts/update_city_restaurants.py [city_id]

    If city_id is provided, updates only that city.
    Otherwise, updates all cities that have restaurant data.
"""

import json
import os
import re
import html
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_FILE = BASE_DIR / "data" / "restaurants.json"
CITIES_DIR = BASE_DIR / "cities"

# Fallback images by cuisine type (Unsplash)
FALLBACK_IMAGES = {
    "seafood": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=200&fit=crop",
    "italian": "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=400&h=200&fit=crop",
    "japanese": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop",
    "sushi": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=200&fit=crop",
    "indian": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=200&fit=crop",
    "thai": "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&h=200&fit=crop",
    "mexican": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=200&fit=crop",
    "french": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop",
    "chinese": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=200&fit=crop",
    "korean": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=200&fit=crop",
    "vietnamese": "https://images.unsplash.com/photo-1583224994076-e0f367256f8a?w=400&h=200&fit=crop",
    "mediterranean": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=200&fit=crop",
    "steakhouse": "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=200&fit=crop",
    "pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop",
    "cafe": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop",
    "bar": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=200&fit=crop",
    "bakery": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=200&fit=crop",
    "tapas": "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400&h=200&fit=crop",
    "brunch": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=200&fit=crop",
    "default": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop"
}


def get_fallback_image(cuisine_type):
    """Get a fallback image URL based on cuisine type."""
    cuisine_lower = cuisine_type.lower()
    for key, url in FALLBACK_IMAGES.items():
        if key in cuisine_lower:
            return url
    return FALLBACK_IMAGES["default"]


def load_restaurant_data():
    """Load restaurant data from JSON file."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_restaurant_html(restaurants):
    """Generate HTML for the restaurant cards with images."""
    cards = []
    for r in restaurants:
        name = html.escape(r['name'])
        rtype = html.escape(r['type'])
        desc = html.escape(r['description'])
        url = html.escape(r['booking_url'])
        rating = r.get('rating', 4.5)
        reviews = r.get('reviews', 50)
        price = html.escape(r.get('price', '$$'))

        # Get image (with fallback)
        image = r.get('image')
        if not image:
            image = get_fallback_image(rtype)
        image = html.escape(image)

        # Create star rating display (using HTML entities for compatibility)
        full_stars = int(rating)
        half_star = 1 if rating % 1 >= 0.5 else 0
        empty_stars = 5 - full_stars - half_star
        stars = '&#9733;' * full_stars + ('&#189;' if half_star else '') + '&#9734;' * empty_stars

        card = f'''          <article class="eat-card">
            <img src="{image}" alt="{name}" class="eat-card-image" loading="lazy">
            <h3 class="eat-card-name">{name}</h3>
            <div class="eat-card-type">{rtype} • {price}</div>
            <div class="eat-card-rating">{stars} ({reviews:,}+ reviews)</div>
            <p class="eat-card-description">{desc}</p>
            <a href="{url}" target="_blank" rel="noopener" class="btn btn-secondary" style="width: 100%;">View on Maps</a>
          </article>'''
        cards.append(card)

    return '\n'.join(cards)

def update_city_page(city_id, restaurants):
    """Update a city's HTML page with restaurant data."""
    html_file = CITIES_DIR / f"{city_id}.html"

    if not html_file.exists():
        print(f"  Warning: {html_file} not found, skipping")
        return False

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generate new restaurant HTML
    new_cards = generate_restaurant_html(restaurants)

    # Pattern to match the entire "Where to Eat & Drink" section's grid content
    # This matches from <div class="affiliate-grid"> after "Where to Eat" header to the closing </div>
    pattern = r'(<section class="affiliate-section">\s*<div class="container">\s*<div class="section-header">\s*<h2>Where to Eat[^<]*</h2>[^<]*<p>[^<]*</p>\s*</div>\s*<div class="affiliate-grid">)\s*(.*?)\s*(</div>\s*</div>\s*</section>)'

    def replacement(match):
        before = match.group(1)
        after = match.group(3)
        return f'{before}\n{new_cards}\n        {after}'

    new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)

    if count == 0:
        print(f"  Warning: Could not find restaurant section in {city_id}.html")
        return False

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True

def main():
    import sys

    # Load restaurant data
    data = load_restaurant_data()

    # Filter out metadata keys
    cities_with_data = {k: v for k, v in data.items() if not k.startswith('_')}

    print(f"Found restaurant data for {len(cities_with_data)} cities")

    # Optionally filter to specific city
    if len(sys.argv) > 1:
        city_id = sys.argv[1].lower()
        if city_id not in cities_with_data:
            print(f"No restaurant data for city '{city_id}'")
            return
        cities_with_data = {city_id: cities_with_data[city_id]}

    # Update each city page
    updated = 0
    for city_id, restaurants in cities_with_data.items():
        print(f"Updating {city_id}...")
        if update_city_page(city_id, restaurants):
            updated += 1
            print(f"  Updated with {len(restaurants)} restaurants")

    print(f"\nUpdated {updated} city pages")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Fetch restaurant data from Apify Google Maps scraper.

This script can be used in two ways:
1. Automated: Set APIFY_TOKEN environment variable and run
2. Manual: Generate input JSON for Apify Console

Actor: apify/google-maps-scraper
Docs: https://apify.com/apify/google-maps-scraper
"""

import json
import os
import time
from pathlib import Path

# Optional: requests for API calls
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

BASE_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass"
CITY_LIST_FILE = os.path.join(BASE_DIR, "data", "city_list.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "restaurants_raw.json")
APIFY_INPUT_FILE = os.path.join(BASE_DIR, "data", "apify_input.json")

# Apify configuration
ACTOR_ID = "apify/google-maps-scraper"
APIFY_TOKEN = os.environ.get("APIFY_TOKEN", "")


def load_cities():
    """Load city list from JSON file."""
    with open(CITY_LIST_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_apify_input(cities, batch_size=None):
    """
    Generate Apify input configuration.

    Args:
        cities: List of city dicts with search_query field
        batch_size: If set, only process first N cities (for testing)
    """
    if batch_size:
        cities = cities[:batch_size]

    search_queries = [city['search_query'] for city in cities]

    apify_input = {
        "searchStringsArray": search_queries,
        "maxCrawledPlacesPerSearch": 3,  # Get top 3 restaurants per city
        "language": "en",
        "includeImages": True,
        "maxImages": 1,  # Just need 1 image per restaurant
        "scrapeDirectories": False,
        "scrapeReviews": False,  # Don't need full reviews
        "maxReviews": 0,
        "scrapeResponseFromOwnerText": False
    }

    return apify_input


def save_apify_input(apify_input):
    """Save Apify input to JSON file for manual use in Apify Console."""
    with open(APIFY_INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(apify_input, f, indent=2)
    print(f"Apify input saved to: {APIFY_INPUT_FILE}")
    print(f"Total search queries: {len(apify_input['searchStringsArray'])}")


def run_apify_actor(apify_input):
    """
    Run Apify actor via API.

    Requires APIFY_TOKEN environment variable and requests library.
    """
    if not HAS_REQUESTS:
        print("ERROR: requests library not installed. Install with: pip install requests")
        return None

    if not APIFY_TOKEN:
        print("ERROR: APIFY_TOKEN not set. Set it as environment variable or use manual mode.")
        print("\nTo use manual mode:")
        print(f"  1. Copy contents of {APIFY_INPUT_FILE}")
        print("  2. Go to https://console.apify.com/actors/apify~google-maps-scraper")
        print("  3. Paste input and run")
        print("  4. Download results as JSON")
        return None

    print("Starting Apify actor run...")

    # Start the actor run
    run_url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs"
    headers = {"Content-Type": "application/json"}
    params = {"token": APIFY_TOKEN}

    response = requests.post(run_url, json=apify_input, headers=headers, params=params)

    if response.status_code != 201:
        print(f"Error starting actor: {response.status_code}")
        print(response.text)
        return None

    run_data = response.json()
    run_id = run_data['data']['id']
    print(f"Run started: {run_id}")

    # Poll for completion
    status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
    while True:
        response = requests.get(status_url, params=params)
        status = response.json()['data']['status']
        print(f"Status: {status}")

        if status in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
            break

        time.sleep(30)  # Check every 30 seconds

    if status != 'SUCCEEDED':
        print(f"Run failed with status: {status}")
        return None

    # Get dataset ID and fetch results
    dataset_id = response.json()['data']['defaultDatasetId']
    dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
    response = requests.get(dataset_url, params=params)

    return response.json()


def process_apify_results(results, cities):
    """
    Process Apify results into our restaurant format.

    Maps scraped data to city IDs based on search query matching.
    """
    # Create a lookup from search query to city ID
    query_to_city = {}
    for city in cities:
        # Normalize the query for matching
        normalized = city['search_query'].lower()
        query_to_city[normalized] = city['id']

    # Group results by city
    restaurants_by_city = {}

    for result in results:
        # Try to match to a city based on searchString or location
        search_string = result.get('searchString', '').lower()
        city_id = query_to_city.get(search_string)

        if not city_id:
            # Try matching by city name in the address
            for city in cities:
                if city['name'].lower() in result.get('address', '').lower():
                    city_id = city['id']
                    break

        if not city_id:
            print(f"Warning: Could not match result to city: {result.get('title')}")
            continue

        if city_id not in restaurants_by_city:
            restaurants_by_city[city_id] = []

        # Extract relevant fields
        restaurant = {
            "name": result.get('title', 'Unknown'),
            "type": result.get('categoryName', result.get('categories', ['Restaurant'])[0] if result.get('categories') else 'Restaurant'),
            "rating": result.get('totalScore', 4.0),
            "reviews": result.get('reviewsCount', 50),
            "address": result.get('address', ''),
            "booking_url": result.get('url', f"https://www.google.com/maps/search/{result.get('title', '')}"),
            "price": result.get('price', '$$'),
            "image": result.get('imageUrls', [None])[0] if result.get('imageUrls') else None,
            "description": ""  # Will be generated by AI
        }

        # Only keep top 3 per city
        if len(restaurants_by_city[city_id]) < 3:
            restaurants_by_city[city_id].append(restaurant)

    return restaurants_by_city


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Fetch restaurant data from Apify')
    parser.add_argument('--generate-input', action='store_true',
                        help='Generate Apify input file for manual use')
    parser.add_argument('--batch', type=int, default=None,
                        help='Only process first N cities (for testing)')
    parser.add_argument('--run', action='store_true',
                        help='Run Apify actor (requires APIFY_TOKEN)')
    parser.add_argument('--process-results', type=str,
                        help='Process downloaded Apify results JSON file')

    args = parser.parse_args()

    cities = load_cities()
    print(f"Loaded {len(cities)} cities")

    if args.generate_input:
        apify_input = generate_apify_input(cities, args.batch)
        save_apify_input(apify_input)

    elif args.run:
        apify_input = generate_apify_input(cities, args.batch)
        results = run_apify_actor(apify_input)

        if results:
            restaurants = process_apify_results(results, cities)
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(restaurants, f, indent=2, ensure_ascii=False)
            print(f"Saved {sum(len(r) for r in restaurants.values())} restaurants to {OUTPUT_FILE}")

    elif args.process_results:
        with open(args.process_results, 'r', encoding='utf-8') as f:
            results = json.load(f)

        restaurants = process_apify_results(results, cities)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(restaurants, f, indent=2, ensure_ascii=False)
        print(f"Saved {sum(len(r) for r in restaurants.values())} restaurants to {OUTPUT_FILE}")

    else:
        # Default: just generate input file
        apify_input = generate_apify_input(cities, args.batch)
        save_apify_input(apify_input)
        print("\nTo run the scraper:")
        print("  Option A: Set APIFY_TOKEN env var and run with --run flag")
        print("  Option B: Use Apify Console manually:")
        print("    1. Go to https://console.apify.com/actors/apify~google-maps-scraper")
        print("    2. Upload or paste the input from apify_input.json")
        print("    3. Run and download results")
        print("    4. Run: python fetch_apify_restaurants.py --process-results <results.json>")


if __name__ == "__main__":
    main()

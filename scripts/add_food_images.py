#!/usr/bin/env python3
"""Add images to food/restaurant entries in generate_city_pages.js"""

import re

# Read the file
with open('generate_city_pages.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Food/restaurant images (variety of dining aesthetics)
food_images = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop",  # Restaurant interior
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop",  # Restaurant ambiance
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop",  # Fine dining
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop",  # Casual dining
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=200&fit=crop",  # Cafe
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&h=200&fit=crop",  # Asian restaurant
    "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=200&fit=crop",  # Food plating
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=200&fit=crop",  # Bar/lounge
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop",  # Food spread
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=200&fit=crop",  # Street food
    "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=400&h=200&fit=crop",  # Coffee shop
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=200&fit=crop",  # Outdoor dining
]

# Counter for cycling through images
image_index = [0]

def add_image_to_food(match):
    """Add image field to food entry if not present"""
    entry = match.group(0)

    # Skip if already has image
    if '"image":' in entry:
        return entry

    # Get an image (cycle through the list)
    img = food_images[image_index[0] % len(food_images)]
    image_index[0] += 1

    # Add image field before the closing brace
    entry = entry.rstrip('}')
    entry = entry.rstrip()
    if entry.endswith(','):
        entry = entry[:-1]

    entry += f', "image": "{img}"' + '}'

    return entry

# Pattern to match food entries: {"name": "...", "type": "...", "description": "..."}
pattern = r'\{"name":\s*"[^"]+",\s*"type":\s*"[^"]+",\s*"description":\s*"[^"]+"(?:,\s*"image":\s*"[^"]+")?\}'

new_content = re.sub(pattern, add_image_to_food, content)

# Write the file
with open('generate_city_pages.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Added images to {image_index[0]} food/restaurant entries")

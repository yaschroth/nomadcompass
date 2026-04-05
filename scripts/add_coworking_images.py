#!/usr/bin/env python3
"""Add images to coworking spaces in generate_city_pages.js"""

import re

# Read the file
with open('generate_city_pages.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Coworking space images (variety of modern office/coworking aesthetics)
coworking_images = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop",  # Modern office
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=200&fit=crop",  # Open workspace
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop",  # People working
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=200&fit=crop",  # Minimalist desk
    "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&h=200&fit=crop",  # Coworking area
    "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=400&h=200&fit=crop",  # Meeting room
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop",  # Office space
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=200&fit=crop",  # Creative office
    "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&h=200&fit=crop",  # Startup office
    "https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=400&h=200&fit=crop",  # Home office
]

# Counter for cycling through images
image_index = [0]

def add_image_to_coworking(match):
    """Add image field to coworking entry if not present"""
    entry = match.group(0)

    # Skip if already has image
    if '"image":' in entry:
        return entry

    # Get an image (cycle through the list)
    img = coworking_images[image_index[0] % len(coworking_images)]
    image_index[0] += 1

    # Add image field before the closing brace
    # Find the last property before closing brace
    entry = entry.rstrip('}')
    entry = entry.rstrip()
    if entry.endswith(','):
        entry = entry[:-1]

    entry += f', "image": "{img}"' + '}'

    return entry

# Pattern to match coworking entries: {"name": "...", "day": "...", "month": "...", "wifi": "..."}
# More precise pattern that matches the coworking entry structure
pattern = r'\{"name":\s*"[^"]+",\s*"day":\s*"[^"]+",\s*"month":\s*"[^"]+",\s*"wifi":\s*"[^"]+"(?:,\s*"image":\s*"[^"]+")?\}'

new_content = re.sub(pattern, add_image_to_coworking, content)

# Write the file
with open('generate_city_pages.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Added images to {image_index[0]} coworking entries")

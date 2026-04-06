#!/usr/bin/env python3
"""
Update cities-data.js with local images from batch1 folder
"""

import os
import re

# Path to the images folder and data file
IMAGES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\images\batch1"
DATA_FILE = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities-data.js"

# Get all image files
image_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))]

# Create mapping from normalized name to actual filename
image_map = {}
for img in image_files:
    # Remove extension and normalize (lowercase, no spaces)
    name = os.path.splitext(img)[0]
    normalized = name.lower().replace(' ', '').replace('-', '').replace('_', '')
    image_map[normalized] = img
    print(f"  {normalized} -> {img}")

print(f"\nFound {len(image_files)} images in batch1 folder")
print("\nImage mapping:")
for k, v in sorted(image_map.items()):
    print(f"  {k}: {v}")

# Read the cities-data.js file
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all city IDs
city_ids = re.findall(r'id:\s*"([^"]+)"', content)
print(f"\nFound {len(city_ids)} cities in data file")

# Track matches and updates
matches = []
no_match = []

for city_id in city_ids:
    normalized_id = city_id.lower().replace(' ', '').replace('-', '').replace('_', '')
    if normalized_id in image_map:
        matches.append((city_id, image_map[normalized_id]))
    else:
        no_match.append(city_id)

print(f"\nMatched {len(matches)} cities with images:")
for city_id, img_file in matches:
    print(f"  {city_id} -> {img_file}")

# Now update the content
updated_count = 0
for city_id, img_file in matches:
    # Pattern to find this city's image line
    # Looking for pattern: id: "cityid", ... image: "...",
    pattern = rf'(id:\s*"{re.escape(city_id)}"[^}}]*?image:\s*")[^"]*(")'

    new_image_path = f"images/batch1/{img_file}"
    replacement = rf'\g<1>{new_image_path}\2'

    new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)
    if count > 0:
        content = new_content
        updated_count += 1
        print(f"Updated: {city_id} -> {new_image_path}")

# Write the updated content
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ Updated {updated_count} cities with local images")

if no_match:
    print(f"\nNo matching images for these cities (first 20):")
    for city in no_match[:20]:
        print(f"  - {city}")

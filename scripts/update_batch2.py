#!/usr/bin/env python3
"""Update cities-data.js with images from batch2 and optimize them"""

import os
import re
from PIL import Image

IMAGES_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\images\batch2"
DATA_FILE = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\cities-data.js"
TARGET_WIDTH = 800
TARGET_HEIGHT = 500
QUALITY = 80

# Get all image files
image_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))]

# Create mapping from normalized name to actual filename
image_map = {}
for img in image_files:
    name = os.path.splitext(img)[0]
    normalized = name.lower().replace(' ', '').replace('-', '').replace('_', '')
    image_map[normalized] = img

print(f"Found {len(image_files)} images in batch2")

# Read cities-data.js
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all city IDs
city_ids = re.findall(r'id:\s*"([^"]+)"', content)
print(f"Found {len(city_ids)} cities in data file")

# Track matches
matches = []
for city_id in city_ids:
    normalized_id = city_id.lower().replace(' ', '').replace('-', '').replace('_', '')
    if normalized_id in image_map:
        matches.append((city_id, image_map[normalized_id]))

print(f"\nMatched {len(matches)} cities:")
for city_id, img in matches:
    print(f"  {city_id} -> {img}")

# Update the content
updated_count = 0
for city_id, img_file in matches:
    pattern = rf'(id:\s*"{re.escape(city_id)}"[^}}]*?image:\s*")[^"]*(")'
    new_image_path = f"images/batch2/{img_file}"
    new_content, count = re.subn(pattern, rf'\g<1>{new_image_path}\2', content, flags=re.DOTALL)
    if count > 0:
        content = new_content
        updated_count += 1

# Write updated content
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nUpdated {updated_count} cities in cities-data.js")

# Optimize images
print("\nOptimizing images...")
total_before = 0
total_after = 0

for filename in os.listdir(IMAGES_DIR):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        filepath = os.path.join(IMAGES_DIR, filename)
        size_before = os.path.getsize(filepath)
        total_before += size_before

        try:
            with Image.open(filepath) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                img_ratio = img.width / img.height
                target_ratio = TARGET_WIDTH / TARGET_HEIGHT

                if img_ratio > target_ratio:
                    new_height = TARGET_HEIGHT
                    new_width = int(img_ratio * new_height)
                else:
                    new_width = TARGET_WIDTH
                    new_height = int(new_width / img_ratio)

                img = img.resize((new_width, new_height), Image.LANCZOS)
                left = (new_width - TARGET_WIDTH) // 2
                top = (new_height - TARGET_HEIGHT) // 2
                img = img.crop((left, top, left + TARGET_WIDTH, top + TARGET_HEIGHT))
                img.save(filepath, 'JPEG', quality=QUALITY, optimize=True)

            size_after = os.path.getsize(filepath)
            total_after += size_after
            print(f"  {filename}: {size_before//1024}KB -> {size_after//1024}KB")
        except Exception as e:
            print(f"  {filename}: ERROR - {e}")

print(f"\nTotal: {total_before//(1024*1024)}MB -> {total_after//(1024*1024)}MB")

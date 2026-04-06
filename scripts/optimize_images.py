#!/usr/bin/env python3
"""
Optimize images for web - resize and compress
Target: 800x500px, ~80-150KB each
"""

import os
from PIL import Image

INPUT_DIR = r"C:\Users\yasch\Coding Projects\Website Projects\nomadcompass\images\batch1"
TARGET_WIDTH = 800
TARGET_HEIGHT = 500
QUALITY = 80

def optimize_image(filepath):
    """Resize and compress a single image"""
    try:
        with Image.open(filepath) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Calculate dimensions maintaining aspect ratio, then crop to target
            img_ratio = img.width / img.height
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT

            if img_ratio > target_ratio:
                # Image is wider - resize by height, then crop width
                new_height = TARGET_HEIGHT
                new_width = int(img_ratio * new_height)
            else:
                # Image is taller - resize by width, then crop height
                new_width = TARGET_WIDTH
                new_height = int(new_width / img_ratio)

            # Resize
            img = img.resize((new_width, new_height), Image.LANCZOS)

            # Center crop to target dimensions
            left = (new_width - TARGET_WIDTH) // 2
            top = (new_height - TARGET_HEIGHT) // 2
            img = img.crop((left, top, left + TARGET_WIDTH, top + TARGET_HEIGHT))

            # Save with compression
            img.save(filepath, 'JPEG', quality=QUALITY, optimize=True)

            # Get new file size
            new_size = os.path.getsize(filepath)
            return new_size
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return None

# Process all images
total_before = 0
total_after = 0

for filename in os.listdir(INPUT_DIR):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        filepath = os.path.join(INPUT_DIR, filename)
        size_before = os.path.getsize(filepath)
        total_before += size_before

        print(f"Processing {filename}... ", end='')
        size_after = optimize_image(filepath)

        if size_after:
            total_after += size_after
            reduction = (1 - size_after / size_before) * 100
            print(f"{size_before // 1024}KB -> {size_after // 1024}KB ({reduction:.0f}% smaller)")
        else:
            print("FAILED")

print(f"\nTotal: {total_before // (1024*1024)}MB -> {total_after // (1024*1024)}MB")
print(f"Saved {(total_before - total_after) // (1024*1024)}MB ({(1 - total_after/total_before)*100:.0f}% reduction)")

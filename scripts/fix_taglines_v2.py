#!/usr/bin/env python3
"""Fix awkward tagline patterns."""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fixes for specific awkward patterns
fixes = [
    # "Discover this [noun phrase]" -> Better phrasing
    (r'Discover this year-round spring weather', 'Enjoy year-round spring weather'),
    (r'Discover this mediterranean vibes', 'Soak in Mediterranean vibes'),
    (r'Discover this mountains meet ocean', 'Where mountains meet ocean—'),
    (r'Discover this ancient temples, egg coffee', 'Explore ancient temples, egg coffee'),
    (r'Discover this beach city with', 'A beach city with'),
    (r'Discover this island life with', 'Experience island life with'),
    (r'Discover this ancient temples of Angkor', 'Explore the ancient temples of Angkor'),
    (r'Discover this beach shacks', 'Find beach shacks'),
    (r'Discover this colonial architecture', 'Admire colonial architecture'),
    (r'Discover this ancient pyramids', 'Marvel at ancient pyramids'),
    (r'Discover this colonial romance', 'Experience colonial romance'),
    (r'Discover this modern metropolis', 'A modern metropolis'),
    (r'Discover this bohemian port city', 'A bohemian port city'),
    (r'Discover this colonial gem at', 'A colonial gem at'),
    (r'Discover this modern skyline', 'A modern skyline'),
    (r'Discover this colonial gem surrounded', 'A colonial gem surrounded'),
    (r'Discover this alpine lakes', 'Explore alpine lakes'),
    (r'Discover this industrial heritage', 'Industrial heritage'),
    (r'Discover this medieval castles', 'Explore medieval castles'),
    (r'Discover this beach city vibes', 'Beach city vibes'),
    (r'Discover this volcanic island', 'A volcanic island'),
    (r'Discover this ancient history', 'Explore ancient history'),
    (r'Discover this island crossroads', 'An island crossroads'),
    (r'Discover this medieval charm', 'Medieval charm'),
    (r'Discover this baroque old town', 'A baroque old town'),
    (r'Discover this emerging destination', 'An emerging destination'),
    (r'Discover this colonial gem with art', 'A colonial gem with art'),
    (r'Discover this nordic innovation', 'A Nordic innovation'),
    (r'Discover this baltic port city', 'A Baltic port city'),

    # "Experience [awkward phrase]" fixes
    (r'Experience keep it weird', 'Keep it weird—'),
    (r'Experience techno, startups', 'Techno, startups'),
    (r'Experience chaotic, cheap', 'Chaotic, cheap'),
    (r'Experience fairytale spires', 'Fairytale spires'),
    (r'Experience futuristic skyline', 'A futuristic skyline'),
    (r'Experience k-pop, kimchi', 'K-pop, kimchi'),
    (r'Experience bikes, canals', 'Bikes, canals'),
    (r'Experience art Deco', 'Art Deco'),

    # General fixes
    (r'Discover a city of caribbean', 'Caribbean'),
    (r'Discover this ', 'Discover '),  # Generic fallback
]

for old, new in fixes:
    content = re.sub(old, new, content, flags=re.IGNORECASE)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Taglines fixed!")

# Count remaining issues
remaining = len(re.findall(r'Discover this [a-z]', content))
print(f"Remaining 'Discover this' patterns: {remaining}")

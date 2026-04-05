#!/usr/bin/env python3
"""Final pass to fix all remaining fragment taglines to full sentences."""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Specific fixes for awkward patterns
specific_fixes = {
    # Fix specific awkward constructions
    "Discover caribbean beaches meet Sierra Nevada mountains.": "Caribbean beaches meet Sierra Nevada mountains.",
    "Discover wine country capital beneath the Andes mountains.": "A wine country capital beneath the Andes mountains.",
    "Discover surf town party paradise on Ecuador's coast.": "A surf town party paradise on Ecuador's coast.",
    "Discover all-inclusive paradise with white sand beaches.": "An all-inclusive paradise with white sand beaches.",
    "Discover a surf mecca on Oaxaca's wild Pacific coast.": "A surf mecca on Oaxaca's wild Pacific coast.",
    "Discover surf village vibes just north of Puerto Vallarta.": "Surf village vibes just north of Puerto Vallarta.",
    "Discover world-class food scene on the Basque coast.": "A world-class food scene on the Basque coast.",
    "Discover sunny beach city with affordable living.": "A sunny beach city with affordable living.",
    "Discover historic university city with intellectual charm.": "A historic university city with intellectual charm.",
    "Discover medieval walls and Viking history.": "Medieval walls and Viking history await.",
    "Discover tech hub in Norway's historic heartland.": "A tech hub in Norway's historic heartland.",

    # Short fragments - add context
    "The Florence of the South with baroque beauty.": "The Florence of the South, featuring baroque beauty and charm.",
    "Where Italian and Central European culture meet.": "Where Italian and Central European cultures meet in harmony.",
    "Ireland's foodie capital with tech industry growth.": "Ireland's foodie capital with thriving tech industry growth.",
    "Diamond trade meets fashion design and Flemish art.": "Where diamond trade meets fashion design and Flemish art.",
    "Lantern-lit ancient town where history meets beach life.": "A lantern-lit ancient town where history meets beach life.",
    "Southeast Asia's most relaxed capital along the Mekong.": "Southeast Asia's most relaxed capital stretches along the Mekong.",
    "From fishing village to tech megacity in 40 years flat.": "From fishing village to tech megacity in just 40 years.",
    "Mile-high city where mountains meet craft beer culture.": "A mile-high city where mountains meet craft beer culture.",
    "Island paradise where surf culture meets startup energy.": "An island paradise where surf culture meets startup energy.",
    "South America's business capital never sleeps.": "South America's business capital that never sleeps.",
    "Jungle meets beach in Mexico's boho-chic paradise.": "Where jungle meets beach in Mexico's boho-chic paradise.",
    "The White City with volcanic views and colonial charm.": "The White City with volcanic views and colonial charm awaits.",
    "Salsa capital where every night is a dance party.": "The salsa capital where every night is a dance party.",
    "The blue pearl of Morocco tucked into the Rif Mountains.": "The blue pearl of Morocco tucked into the Rif Mountains awaits.",
    "Medieval charm, vibrant culture, and incredible value.": "Medieval charm, vibrant culture, and incredible value await.",
    "Bolivia's economic engine with tropical lowland vibes.": "Bolivia's economic engine with tropical lowland vibes awaits.",
    "World's highest capital with stunning Andean landscapes.": "The world's highest capital with stunning Andean landscapes.",
    "South America's most underrated capital with low costs.": "South America's most underrated capital offers low costs.",
    "France's gastronomic capital with Renaissance charm.": "France's gastronomic capital with Renaissance charm awaits.",

    # Fix Experience patterns that are fragments
    "Experience punting, pubs, and world-class education.": "Experience punting, pubs, and world-class education here.",
    "Experience georgian elegance and Roman baths.": "Experience Georgian elegance and Roman baths.",
    "Experience northern lights and midnight sun.": "Experience the northern lights and midnight sun.",
    "Experience pubs, tech giants, and legendary Irish craic.": "Experience pubs, tech giants, and legendary Irish craic here.",
}

for old, new in specific_fixes.items():
    content = content.replace(f'tagline: "{old}"', f'tagline: "{new}"')

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Final tagline fixes applied!")

# Count and show remaining short taglines
import subprocess
result = subprocess.run(
    ['grep', '-oP', 'tagline: "[^"]*"', '../cities-data.js'],
    capture_output=True, text=True
)
short_taglines = [t for t in result.stdout.strip().split('\n') if len(t) < 65]
print(f"\nRemaining short taglines ({len(short_taglines)}):")
for t in short_taglines[:10]:
    print(f"  {t}")

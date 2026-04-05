#!/usr/bin/env python3
"""Fix remaining awkward tagline patterns."""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# More specific fixes
fixes = [
    # Fix "Discover a city of X" patterns - they're redundant
    (r'Discover a city of entertainment capital', 'Discover the entertainment capital'),
    (r'Discover a city of first city of the Americas', 'Discover the first city of the Americas'),
    (r'Discover a city of atlantic islands', 'Discover Atlantic islands'),
    (r'Discover a city of african', "Discover Africa's"),
    (r'Discover a city of ', 'Discover '),

    # Fix "Discover [adjective]" to "Discover the/a [adjective]"
    (r'Discover windy city', 'Discover the Windy City'),
    (r'Discover tech giant capital', 'Discover a tech giant capital'),
    (r'Discover historic port city', 'Discover a historic port city'),
    (r'Discover surf mecca', 'Discover a surf mecca'),

    # Turn fragments into sentences by adding "Discover" or similar
    # Patterns ending with just a period but no verb
    (r'tagline: "Caribbean port city with carnival spirit\."',
     'tagline: "A Caribbean port city with carnival spirit."'),
    (r"tagline: \"Kerala's cosmopolitan port city\\.\"",
     'tagline: "Kerala\'s cosmopolitan port city awaits."'),
    (r'tagline: "Gateway to Lake Toba and Sumatra\."',
     'tagline: "Your gateway to Lake Toba and Sumatra."'),

    # Fix remaining short fragments
    (r'tagline: "([A-Z][a-z]+\'s [^"]{10,40})\."(?=\n)',
     lambda m: f'tagline: "{m.group(1)} awaits."' if ' and ' not in m.group(1) and '—' not in m.group(1) else f'tagline: "{m.group(1)}."'),
]

for old, new in fixes:
    if callable(new):
        content = re.sub(old, new, content)
    else:
        content = re.sub(old, new, content, flags=re.IGNORECASE)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Additional tagline fixes applied!")

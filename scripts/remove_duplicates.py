#!/usr/bin/env python3
"""Remove duplicate cities from cities-data.js"""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# IDs to remove (the duplicate/redundant ones)
ids_to_remove = [
    "puertorico",  # Duplicate of sanjuan (San Juan, Puerto Rico)
    "bahrain",     # Duplicate of manama (Manama is capital of Bahrain)
]

# Find and track city blocks by ID to identify true duplicates
city_pattern = r'\{\s*id: "([^"]+)"[\s\S]*?timezone: -?\d+\s*\},?'
matches = list(re.finditer(city_pattern, content))

seen_ids = set()
duplicates_to_remove = []

for match in matches:
    city_id = match.group(1)
    if city_id in seen_ids:
        # This is a duplicate
        duplicates_to_remove.append((match.start(), match.end(), city_id))
        print(f"Found duplicate: {city_id}")
    else:
        seen_ids.add(city_id)

    # Also mark explicitly redundant IDs
    if city_id in ids_to_remove:
        duplicates_to_remove.append((match.start(), match.end(), city_id))
        print(f"Removing redundant: {city_id}")

# Remove duplicates from end to start to preserve indices
duplicates_to_remove.sort(reverse=True)

for start, end, city_id in duplicates_to_remove:
    # Find the actual block boundaries including potential trailing comma/newline
    block_end = end
    while block_end < len(content) and content[block_end] in ' \n':
        block_end += 1

    content = content[:start] + content[block_end:]

# Clean up any double commas or empty lines
content = re.sub(r',\s*,', ',', content)
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nRemoved {len(duplicates_to_remove)} duplicate entries")

# Verify count
new_matches = re.findall(r'id: "([^"]+)"', content)
print(f"Total cities now: {len(new_matches)}")

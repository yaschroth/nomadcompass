#!/usr/bin/env python3
"""Fix the cities-data.js file that was corrupted by inserting cities in the wrong place."""

import re

# Read the current file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the corrupted line that starts with the return statement and has city data
# Pattern: return ['climate', ... 'airquality'  {
corrupted_pattern = r"return \['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'  \{"

# Find where the new cities were inserted (after the corrupted return)
match = re.search(corrupted_pattern, content)
if not match:
    print("Could not find corrupted pattern")
    exit(1)

# Split content by lines for easier manipulation
lines = content.split('\n')

# Find line indices
corrupted_line_idx = None
cities_end_idx = None  # Line with ]; that closes CITIES array (around 8712)

for i, line in enumerate(lines):
    if "return ['climate'" in line and "'airquality'" in line and '{' in line:
        corrupted_line_idx = i
    if line.strip() == '];' and i < 8720:  # Original CITIES array closure
        cities_end_idx = i

print(f"Corrupted line: {corrupted_line_idx + 1}")
print(f"CITIES array ends at line: {cities_end_idx + 1}")

# The new cities start at corrupted_line_idx + 1 and go until the end (minus the closing brace)
# Extract new cities (lines after the corrupted return statement, before the final ];})

# Find where the new cities data ends (look for the closing ];} at the end of file)
new_cities_start = corrupted_line_idx + 1  # First line with { id: "lecce"...
new_cities_end = None

# Search from the end to find ]; followed by }
for i in range(len(lines) - 1, new_cities_start, -1):
    if lines[i].strip() == '];':
        new_cities_end = i - 1  # The line before ];
        break

if new_cities_end is None:
    print("Could not find end of new cities")
    exit(1)

print(f"New cities from line {new_cities_start + 1} to {new_cities_end + 1}")

# Extract the new cities (need to include the closing },)
new_cities_lines = lines[new_cities_start:new_cities_end + 1]

# We need to add a comma before the first city since it will be appended to existing cities
# First, check if the line before cities_end_idx ends with },
if lines[cities_end_idx - 1].strip().endswith('},'):
    # Good, we can just insert the new cities
    pass
else:
    # Need to add a comma
    lines[cities_end_idx - 1] = lines[cities_end_idx - 1].rstrip() + ','

# Build the fixed file:
# 1. Lines 0 to cities_end_idx - 1 (original cities)
# 2. New cities
# 3. The original ]; line
# 4. The rest of the original content (CATEGORIES and functions, but with getCategoryKeys fixed)

# Fix the getCategoryKeys function - it should just be:
fixed_getCategoryKeys = """function getCategoryKeys() {
  return ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
}"""

# Build the new file
new_lines = []

# Add original cities (lines 0 to cities_end_idx - 1)
new_lines.extend(lines[:cities_end_idx])

# Add the new cities (with proper formatting, each starting with a comma if needed)
for line in new_cities_lines:
    new_lines.append(line)

# Add the closing of CITIES array
new_lines.append('];')
new_lines.append('')

# Find and add CATEGORIES section (from original line 8714 to 8732)
# But we need to find it in the original content before corruption
# Actually, let's use the lines between cities_end_idx and corrupted_line_idx
# That's the CATEGORIES section

categories_start = cities_end_idx + 1  # After ];
categories_end = corrupted_line_idx - 1  # Before function getCategoryKeys()

# Add CATEGORIES section
for i in range(categories_start, categories_end + 1):
    new_lines.append(lines[i])

# Add fixed getCategoryKeys function
new_lines.append(fixed_getCategoryKeys)

# Write the fixed file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("File fixed successfully!")
print(f"Total lines: {len(new_lines)}")

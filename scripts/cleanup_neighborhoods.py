#!/usr/bin/env python3
"""
Clean up corrupted neighborhoods in generate_city_pages.js
Removes orphaned neighborhood objects that appear after the neighborhoods array closes
"""

import re

# Read the file
with open('generate_city_pages.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find orphaned neighborhood objects after neighborhoods array closes
# These are objects that have neighborhood-like structure but appear after ] and before "categories"
# They look like:     ],
#                       "cons": [...]
#                 },
#                 {
#                       "name": "Residential Suburb"
#                       ...
#                 }
#     ],
#     "categories": {

# We need to fix the pattern: ]<garbage>], "categories"
# The fix should be: ], "categories"

# Pattern explanation:
# (\])\s*,?\s*"cons"[\s\S]*?"priceLevel":\s*"[^"]*"\s*\}\s*(?:,\s*\{[\s\S]*?"priceLevel":\s*"[^"]*"\s*\}\s*)*\]\s*,\s*("categories")

# Actually, let's be more specific - find cases where we have:
# ] (closing neighborhoods)
# followed by orphan data (objects with name, tagline, etc. that shouldn't be there)
# then ], (another closing that shouldn't exist)
# then "categories"

# The simpler approach: remove everything between ]\n    ],\n    "categories" that looks like orphan data

# Pattern to find: ], followed by orphan neighborhood-like objects, then ], then "categories"
pattern = r'(\]\s*),\s*"cons"[\s\S]*?(\],\s*"categories")'

def clean_match(match):
    # Just return the proper closing followed by categories
    return '] ' + match.group(2).lstrip('],').strip()

# First, let's handle the specific pattern where orphan data appears
# The pattern is: neighborhoods array ends with ], then there's orphan data, then another ], then "categories"

# More specific pattern
orphan_pattern = r'(\])\s*,\s*("cons":\s*\[[\s\S]*?)(\],\s*"categories")'

fixed_content = content

# Find all instances where we have ], "cons" which indicates orphan data
# The proper structure should be: neighborhoods: [ {...}, {...} ], categories: {
# The corrupted structure is: neighborhoods: [ {...}, {...} ], <orphan cons/name/etc>, ], categories: {

# Let's do a multi-pass cleanup
# Pass 1: Remove orphan "cons" arrays that appear right after ]
pattern1 = r'(\])\s*,\s*"cons":\s*\[[^\]]*\],\s*"lat":\s*[\d.]+,\s*"lng":\s*[\d.-]+,\s*"priceLevel":\s*"[^"]*"\s*\}'
while re.search(pattern1, fixed_content):
    fixed_content = re.sub(pattern1, r'\1', fixed_content)

# Pass 2: Remove orphan neighborhood objects (those with "name" that appear after ])
pattern2 = r'(\])\s*,\s*\{\s*"name":\s*"[^"]*",\s*"tagline"[^}]*"priceLevel":\s*"[^"]*"\s*\}'
while re.search(pattern2, fixed_content):
    fixed_content = re.sub(pattern2, r'\1', fixed_content)

# Pass 3: Fix double ], patterns
pattern3 = r'\]\s*\]\s*,\s*("categories")'
fixed_content = re.sub(pattern3, r'], \1', fixed_content)

# Pass 4: Clean up any remaining orphan blocks
# Look for patterns like }, { "name": "Old Town" etc. after ]
pattern4 = r'(\])\s*,?\s*\{\s*"name":\s*"(?:Old Town|Creative Quarter|Business District|Residential Suburb|University Area|Historic Center|Hipster District|New Town|Student Quarter|Green District|Expat Hub|Local District|Riverside Area|New Development)[^}]*\}'
while re.search(pattern4, fixed_content):
    fixed_content = re.sub(pattern4, r'\1', fixed_content)

# Pass 5: Fix any remaining ], ], patterns
pattern5 = r'\],?\s*\],?\s*,\s*("categories")'
while re.search(pattern5, fixed_content):
    fixed_content = re.sub(pattern5, r'], \1', fixed_content)

# Write back
with open('generate_city_pages.js', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Cleanup complete! Now run: node scripts/generate_city_pages.js")

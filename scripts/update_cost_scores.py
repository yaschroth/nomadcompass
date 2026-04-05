#!/usr/bin/env python3
"""
Update cost scores to match the new 2026 cost estimates.

Cost score represents AFFORDABILITY (higher = cheaper):
- 10: Ultra budget (<$1,000/month)
- 9: Very cheap ($1,000-$1,300)
- 8: Cheap ($1,300-$1,600)
- 7: Affordable ($1,600-$2,000)
- 6: Moderate ($2,000-$2,400)
- 5: Mid-range ($2,400-$2,800)
- 4: Pricey ($2,800-$3,400)
- 3: Expensive ($3,400-$4,200)
- 2: Very expensive ($4,200-$5,200)
- 1: Ultra expensive ($5,200+)
"""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

def cost_to_score(cost_per_month):
    """Convert monthly cost to affordability score (1-10)."""
    if cost_per_month < 1000:
        return 10
    elif cost_per_month < 1300:
        return 9
    elif cost_per_month < 1600:
        return 8
    elif cost_per_month < 2000:
        return 7
    elif cost_per_month < 2400:
        return 6
    elif cost_per_month < 2800:
        return 5
    elif cost_per_month < 3400:
        return 4
    elif cost_per_month < 4200:
        return 3
    elif cost_per_month < 5200:
        return 2
    else:
        return 1

# Find all cities with their cost scores and costPerMonth
# Pattern to match a city block and extract relevant data
city_pattern = r'(\{\s*id: "([^"]+)"[\s\S]*?cost: )(\d+)([\s\S]*?costPerMonth: )(\d+)'

def update_cost_score(match):
    prefix = match.group(1)
    city_id = match.group(2)
    old_score = int(match.group(3))
    middle = match.group(4)
    cost_per_month = int(match.group(5))

    new_score = cost_to_score(cost_per_month)

    if old_score != new_score:
        print(f"  {city_id}: score {old_score} -> {new_score} (${cost_per_month}/mo)")

    return f'{prefix}{new_score}{middle}{cost_per_month}'

print("Updating cost scores based on 2026 monthly costs...\n")
print("Changes:")

# Apply updates
new_content = re.sub(city_pattern, update_cost_score, content)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\nDone! Cost scores now reflect actual 2026 affordability.")
print("\nScore guide:")
print("  10: <$1,000  |  7: $1,600-2,000  |  4: $2,800-3,400  |  1: $5,200+")
print("   9: $1,000-1,300  |  6: $2,000-2,400  |  3: $3,400-4,200")
print("   8: $1,300-1,600  |  5: $2,400-2,800  |  2: $4,200-5,200")

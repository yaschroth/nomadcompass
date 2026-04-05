#!/usr/bin/env python3
"""Fix taglines to be full sentences."""

import re

# Read the file
with open('../cities-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all taglines and their line positions
tagline_pattern = r'(tagline: ")([^"]+)(")'

def is_full_sentence(tagline):
    """Check if a tagline reads as a full sentence or complete thought."""
    # Taglines starting with these patterns are typically complete thoughts
    complete_starters = [
        "the ", "a ", "an ", "where ", "from ", "this ", "here ", "welcome ",
        "europe's ", "asia's ", "africa's ", "america's ", "australia's ",
        "world's ", "one of ", "home of ", "birthplace of ", "gateway to ",
        "capital of ", "city of ", "land of ", "heart of ", "pearl of ",
        "discover ", "experience ", "explore ", "enjoy ", "embrace ",
        "known as ", "famous for ", "celebrated for ", "renowned for ",
        "it's ", "there's ", "you'll find ", "prepare for ", "get ready ",
        "welcome to ", "step into ", "dive into ", "immerse yourself ",
    ]

    lower = tagline.lower()

    # Check if starts with a complete thought pattern
    for starter in complete_starters:
        if lower.startswith(starter):
            return True

    # Taglines with em-dash that connect complete thoughts
    if "—" in tagline and len(tagline.split("—")) == 2:
        # Check if first part is a complete noun phrase
        first_part = tagline.split("—")[0].lower().strip()
        if any(first_part.startswith(s) for s in complete_starters):
            return True
        # "noun meets noun" patterns
        if " meets " in first_part:
            return True

    # Verb-based sentences that are complete
    if " meets " in lower or " where " in lower:
        return True

    return False

def make_full_sentence(tagline, city_name=""):
    """Convert a fragment tagline into a full sentence."""
    lower = tagline.lower()

    # Already a good sentence
    if is_full_sentence(tagline):
        return tagline

    # Patterns to detect and fix

    # Pattern: "Noun phrase with descriptor." -> "Discover a noun phrase with descriptor."
    # Pattern: "Adjective noun with features." -> "Experience this adjective noun with features."

    # If starts with a city descriptor like "Historic", "Medieval", "Ancient", etc.
    descriptors = ["historic", "medieval", "ancient", "modern", "vibrant", "charming",
                   "colonial", "coastal", "mountain", "beach", "island", "volcanic",
                   "tropical", "alpine", "baltic", "adriatic", "mediterranean",
                   "bohemian", "industrial", "cultural", "creative", "tech", "artistic",
                   "compact", "tiny", "small", "emerging", "rising", "growing",
                   "underrated", "hidden", "secret", "authentic", "traditional",
                   "youthful", "relaxed", "laid-back", "quiet", "clean", "safe",
                   "sunny", "windy", "cool", "cold", "warm", "hot",
                   "unesco", "baroque", "gothic", "roman", "ottoman", "french",
                   "spanish", "italian", "german", "dutch", "british", "japanese"]

    # Pattern: starts with descriptor + noun -> "Discover this..."
    for desc in descriptors:
        if lower.startswith(desc + " "):
            return f"Discover this {tagline[0].lower()}{tagline[1:]}"

    # Pattern: "City's feature" or possessive -> Already good, just ensure capitalization
    if "'s " in tagline[:20]:
        return tagline

    # Pattern: "Noun, noun, and noun" (list format) -> "Experience noun, noun, and noun."
    if tagline.count(",") >= 2 and " and " in tagline:
        return f"Experience {tagline[0].lower()}{tagline[1:]}"

    # Pattern: Short phrase with "with" -> "Discover a city with..."
    if " with " in lower and len(tagline) < 60:
        if lower.startswith(("city ", "town ", "capital ", "island ", "beach ", "port ")):
            return f"Discover this {tagline[0].lower()}{tagline[1:]}"
        else:
            return f"Discover a city of {tagline[0].lower()}{tagline[1:]}"

    # Pattern: "Noun meets noun" -> Already good
    if " meets " in lower:
        return tagline

    # Pattern: List without "and" -> Add "Experience"
    if tagline.count(",") >= 1 and " and " not in tagline and "—" not in tagline:
        return f"Experience {tagline[0].lower()}{tagline[1:]}"

    # Pattern: "Gateway to..." or "Heart of..." -> Already good
    if lower.startswith(("gateway ", "heart ", "pearl ", "jewel ", "gem ")):
        return tagline

    # Pattern: ends with "capital" or "hub" -> "Discover this..."
    if lower.endswith(("capital.", "hub.", "hotspot.", "paradise.", "haven.", "escape.", "retreat.")):
        return f"Discover this {tagline[0].lower()}{tagline[1:]}"

    # Default: Add "Discover" or "Experience" based on content
    if " and " in tagline or "—" in tagline:
        return f"Experience {tagline[0].lower()}{tagline[1:]}"
    else:
        return f"Discover this {tagline[0].lower()}{tagline[1:]}"

# Track changes
changes = []

def replace_tagline(match):
    prefix = match.group(1)
    tagline = match.group(2)
    suffix = match.group(3)

    new_tagline = make_full_sentence(tagline)

    if new_tagline != tagline:
        changes.append((tagline, new_tagline))

    return f'{prefix}{new_tagline}{suffix}'

# Replace all taglines
new_content = re.sub(tagline_pattern, replace_tagline, content)

# Write the file
with open('../cities-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated {len(changes)} taglines")
print("\nSample changes:")
for old, new in changes[:20]:
    print(f"  - \"{old[:50]}...\"")
    print(f"  + \"{new[:50]}...\"")
    print()

#!/usr/bin/env python3
"""Update city taglines with more evocative descriptions."""

import re
from pathlib import Path

# New improved taglines for cities with generic descriptions
UPDATED_TAGLINES = {
    "aixenprovence": "Cézanne's muse—fountains, plane trees, and Provence's most elegant café terraces.",
    "alexandria": "Cleopatra's city reborn—Mediterranean breezes, ancient libraries, and Egyptian soul.",
    "alicante": "Sun-drenched Costa Blanca living—castle views, tapas crawls, and year-round beach days.",
    "arusha": "Safari capital beneath Kilimanjaro—Maasai markets, coffee highlands, and African adventure.",
    "barranquilla": "Colombia's carnival queen—cumbia rhythms, Caribbean heat, and Shakira's hometown.",
    "bath": "Georgian grandeur in golden stone—Roman baths, Jane Austen walks, and spa town elegance.",
    "battambang": "Cambodia's artistic soul—French colonial charm, circus arts, and bamboo train adventures.",
    "boston": "Revolutionary spirit meets innovation—ivy-covered campuses, harbor walks, and Red Sox passion.",
    "calgary": "Cowtown meets Rockies playground—stampede energy, chinook winds, and mountain escapes.",
    "canberra": "Australia's planned capital—world-class galleries, bush capital trails, and political pulse.",
    "cancun": "Turquoise Caribbean meets Mayan mystique—cenotes, ruins, and white-sand paradise.",
    "capeverde": "Atlantic archipelago with year-round sun—Creole soul, volcanic peaks, and morna music.",
    "daegu": "Korea's textile city transformed—fashion streets, herbal medicine markets, and mountain temples.",
    "darwin": "Australia's tropical frontier—crocodile territory, sunset markets, and outback gateway.",
    "davao": "Mindanao's crown jewel—durian capital, Mount Apo trails, and Philippine eagle sanctuary.",
    "dusseldorf": "Rhine elegance meets Little Tokyo—art nouveau architecture, beer halls, and fashion forward.",
    "freiburg": "Germany's solar city—Black Forest gateway, sustainable living, and sunny vine terraces.",
    "groningen": "Student energy in the Dutch north—bike culture, Martini Tower views, and progressive spirit.",
    "guayaquil": "Ecuador's Pacific powerhouse—malecón strolls, iguana parks, and Galápagos gateway.",
    "gwangju": "Korea's democracy heart—May 18 memorial, art biennale, and culinary traditions.",
    "hiroshima": "Peace rising from ashes—atomic dome reflections, Miyajima shrines, and hopeful rebirth.",
    "hue": "Vietnam's imperial soul—citadel grandeur, perfume river poetry, and royal tomb serenity.",
    "iloilo": "Visayan heart of love—Art Deco mansions, batchoy noodles, and island-hopping base.",
    "jeddah": "Red Sea gateway with Hejazi soul—coral houses, floating mosque, and pilgrimage traditions.",
    "johorbahru": "Singapore's laid-back neighbor—theme parks, heritage streets, and half-price living.",
    "kampala": "Pearl of Africa's seven hills—boda-boda chaos, nightlife energy, and Lake Victoria shores.",
    "kanazawa": "Edo-era gem untouched by war—samurai districts, geisha quarters, and Kenroku-en gardens.",
    "kaohsiung": "Taiwan's harbor renaissance—night markets, art warehouses, and lotus pond temples.",
    "kuwait": "Gulf wealth meets Bedouin heritage—futuristic towers, souk traditions, and desert escapes.",
    "leon": "Colonial leather capital awakening—cathedral grandeur, student nights, and Guanajuato gateway.",
    "leuven": "Beer, brains, and Belgian charm—university town energy and the world's longest bar.",
    "luxembourg": "Micro-nation, macro opportunity—fortress canyons, EU institutions, and multilingual ease.",
    "luxor": "World's greatest open-air museum—Valley of Kings, Karnak columns, and Nile sunsets.",
    "makassar": "Sulawesi's seafaring heart—floating markets, Toraja gateway, and spice trade legacy.",
    "manizales": "Coffee region heights—cable cars over green hills, nevado views, and eternal spring.",
    "maputo": "Mozambican rhythm—Art Deco meets African jazz, prawns, and Portuguese-African fusion.",
    "mardelplata": "Argentina's Atlantic queen—beach high-rises, alfajores, and summer escape tradition.",
    "mazatlan": "Pacific Mexico reborn—malecón magic, sport fishing legends, and carnival traditions.",
    "medan": "Sumatra's gateway city—Lake Toba access, durian markets, and Batak highland culture.",
    "montanita": "Ecuador's surf party paradise—beach bonfires, ceviche cocktails, and endless summer.",
    "nashville": "Music City USA—honky-tonk nights, hot chicken heat, and songwriting dreams.",
    "newyork": "Concrete jungle where dreams ignite—skyline ambition, cultural collisions, and infinite energy.",
    "noumea": "Turquoise lagoons meet croissants—where Melanesian reef life meets Côte d'Azur elegance.",
    "nuremberg": "Medieval walls meet modern markets—Christmas magic, bratwurst traditions, and history lessons.",
    "ottawa": "Canada's capital in two tongues—Rideau Canal skating, tulip festivals, and political heritage.",
    "oulu": "Arctic tech hub with Northern Lights—world's northernmost startup scene and midnight sun.",
    "pattaya": "Bangkok's beach escape transformed—water sports, night markets, and island day-trips.",
    "pereira": "Coffee triangle heart—thermal springs, wax palm valleys, and Colombian warmth.",
    "puertoescondido": "Oaxaca's wild Pacific—world-class surf breaks, mezcal sunsets, and bohemian soul.",
    "queretaro": "Colonial jewel with startup spirit—aqueduct views, wine country, and aerospace ambition.",
    "ramallah": "Palestinian cultural capital—art galleries, café culture, and resilient creativity.",
    "recife": "Brazil's Venice—reef-protected beaches, frevo rhythms, and Northeastern soul.",
    "riyadh": "Desert capital awakening—ancient Diriyah, futuristic vision, and Saudi transformation.",
    "rosario": "Birthplace of Che and Messi—river walks, flag monument, and Argentine authenticity.",
    "salalah": "Arabia's monsoon miracle—frankincense land, khareef mists, and Omani escape.",
    "sansebastian": "Pintxos perfection on the Basque coast—three Michelin stars per square meter.",
    "santamarta": "Caribbean meets Sierra Nevada—colonial plazas, Tayrona gateway, and beach-mountain magic.",
    "sanur": "Bali's sunrise coast—reef-calm waters, cycling paths, and peaceful alternative.",
    "sayulita": "Riviera Nayarit's surf village—colorful streets, jungle backdrop, and barefoot vibes.",
    "sihanoukville": "Cambodia's beach frontier—island-hopping base, sunset beers, and coastal development.",
    "solo": "Java's royal heart—batik traditions, kraton culture, and Javanese mysticism.",
    "strasbourg": "Franco-German fusion at EU's heart—half-timbered Petite France and cathedral spires.",
    "stuttgart": "Automotive excellence in vine-covered hills—Porsche, Mercedes, and Swabian precision.",
    "suva": "South Pacific crossroads—Fijian warmth, colonial echoes, and island nation capital.",
    "tainan": "Taiwan's soul city—temple incense, street food origins, and Dutch-era remnants.",
    "tromso": "Arctic gateway to wonder—Northern Lights capital, midnight sun, and polar adventures.",
    "trondheim": "Viking history meets tech future—Nidaros Cathedral, fjord access, and student energy.",
    "trujillo": "Moche and marinera heartland—Chan Chan ruins, surf beaches, and Peruvian tradition.",
    "turku": "Finland's medieval birthplace—archipelago gateway, design heritage, and riverside charm.",
    "victoria": "British Columbia's garden city—inner harbor strolls, afternoon tea, and Pacific beauty.",
    "windhoek": "Namibia's clean-air capital—German heritage, craft beer, and desert adventure gateway.",
    "yazd": "Persia's desert jewel—wind towers, Zoroastrian flame, and silk road soul.",
    "york": "Viking to medieval to modern—shambles walks, minster majesty, and chocolate heritage.",
}

def update_city_tagline(html_path: Path, new_tagline: str) -> bool:
    """Update a city's tagline in its HTML file."""
    content = html_path.read_text(encoding='utf-8')

    # Pattern to match the tagline line
    pattern = r'(<p class="city-hero-tagline">)[^<]+(</p>)'

    # Check if pattern exists
    if not re.search(pattern, content):
        print(f"  Warning: Could not find tagline pattern in {html_path.name}")
        return False

    # Replace with new tagline (escape HTML entities)
    new_tagline_escaped = new_tagline.replace("&", "&amp;").replace("'", "&#039;")
    new_content = re.sub(pattern, f'\\1{new_tagline_escaped}\\2', content)

    if new_content != content:
        html_path.write_text(new_content, encoding='utf-8')
        return True
    return False

def main():
    cities_dir = Path(r'C:/Users/yasch/Coding Projects/Website Projects/nomadcompass/cities')

    updated = 0
    skipped = 0

    for city_id, new_tagline in UPDATED_TAGLINES.items():
        html_path = cities_dir / f"{city_id}.html"

        if not html_path.exists():
            print(f"  Skipped {city_id}: file not found")
            skipped += 1
            continue

        if update_city_tagline(html_path, new_tagline):
            print(f"  Updated {city_id}")
            updated += 1
        else:
            print(f"  Skipped {city_id}: no changes needed")
            skipped += 1

    print(f"\nDone! Updated {updated} cities, skipped {skipped}")

if __name__ == "__main__":
    main()

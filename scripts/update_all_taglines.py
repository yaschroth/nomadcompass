#!/usr/bin/env python3
"""Update all city taglines with more evocative descriptions."""

import re
from pathlib import Path

# Comprehensive taglines for all cities needing improvement
UPDATED_TAGLINES = {
    # A
    "adelaide": "Festival city in wine country—parklands, beaches, and Australia's most livable secret.",
    "amman": "White stone hills where ancient Ammonites meet modern café culture and Levantine warmth.",
    "annecy": "Alpine Venice in the French Alps—crystal lakes, medieval canals, and mountain perfection.",
    "antalya": "Turkish Riviera jewel—Roman ruins, turquoise coves, and digital nomad visa paradise.",
    "antigua": "Cobblestone colonial gem—three volcanoes, Spanish baroque, and Guatemala's cultural heart.",
    "athens": "Acropolis shadows and rooftop bars—ancient philosophy meets Mediterranean nightlife.",

    # B
    "baguio": "Philippines' summer capital—pine-scented highlands, strawberry farms, and cool mountain air.",
    "bali": "Surf, spirituality, and smoothie bowls—the island that launched a thousand nomad dreams.",
    "bariloche": "Patagonian Switzerland—chocolate shops, ski slopes, and Andes lake district magic.",
    "batumi": "Black Sea Vegas meets Georgian charm—casinos, botanical gardens, and Adjarian hospitality.",
    "beirut": "Phoenix city of the Mediterranean—resilient nightlife, mezze feasts, and cultural defiance.",
    "belgrade": "Balkan Belgrade—fortress views, floating river clubs, and Europe's wildest nightlife.",
    "bilbao": "Basque renaissance city—Guggenheim curves, pintxos crawls, and green mountain embrace.",
    "bled": "Fairytale lake perfection—island church bells, castle cliffs, and Julian Alps drama.",
    "bodrum": "Ancient Halicarnassus reborn—blue voyage harbor, whitewashed lanes, and Aegean glamour.",
    "bogota": "Andean metropolis at 2,600 meters—street art, salsa, and world-class gastronomy.",
    "bologna": "La Grassa, La Dotta, La Rossa—Italy's culinary capital beneath medieval porticoes.",
    "boquete": "Panama's highland escape—cloud forest trails, Geisha coffee, and eternal spring.",
    "boracay": "White Beach perfection—powder sand, sunset sails, and Philippine island energy.",
    "brasov": "Transylvanian gateway—Gothic spires beneath the Hollywood sign of the Carpathians.",
    "bratislava": "Danube compact capital—castle views, UFO bridge, and Vienna's affordable neighbor.",
    "brighton": "London-by-the-sea—rainbow lanes, creative rebels, and proudly alternative spirit.",
    "brisbane": "River city sunshine—South Bank culture, rooftop bars, and gateway to the tropics.",
    "bristol": "Banksy's hometown—street art capital, harbor regeneration, and independent soul.",
    "brno": "Czech tech hub awakening—university energy, underground tunnels, and half Prague's prices.",
    "bruges": "Medieval time capsule—chocolate, beer, and Gothic canals frozen in Flemish perfection.",
    "brussels": "EU heart with Art Nouveau soul—comic murals, beer temples, and waffle wanderings.",
    "bucharest": "Little Paris of the East—eclectic architecture, hidden gardens, and surprising nightlife.",
    "budapest": "Thermal bath city—ruin bars, Danube bridges, and Central Europe's most beautiful capital.",
    "buenosaires": "Tango, steak, and Malbec—Paris of South America at extraordinary value.",
    "byronbay": "Byron's bohemian magnet—lighthouse walks, wellness retreats, and Australia's eastern point.",

    # C
    "cairns": "Reef and rainforest gateway—Great Barrier Reef diving and Daintree adventures await.",
    "cali": "Salsa capital of the world—every night a dance party, every corner a rhythm.",
    "cambridge": "Punting past genius—800 years of academic excellence and riverside tradition.",
    "cantho": "Mekong Delta heart—floating markets at dawn, fruit orchards, and river life rhythms.",
    "cappadocia": "Hot air balloon wonderland—fairy chimneys, cave hotels, and lunar landscapes.",
    "cartagena": "Caribbean colonial jewel—walled city romance, salsa nights, and Gabriel García Márquez magic.",
    "cebu": "Queen City of the South—island hopping paradise, whale sharks, and lechon feasts.",
    "chiangrai": "Golden Triangle arts hub—White Temple wonder, Black House mystery, and hill tribe trails.",
    "chicago": "Windy City grandeur—architectural river tours, deep dish debates, and jazz club nights.",
    "christchurch": "Garden city reborn—innovative rebuild, Canterbury gateway, and resilient Kiwi spirit.",
    "cologne": "Cathedral city carnival—Kölsch culture, Roman roots, and Rhine riverside energy.",
    "copenhagen": "Hygge headquarters—Nyhavn colors, Michelin stars, and the world's happiest cyclists.",
    "cordoba": "Argentina's intellectual heart—Jesuit heritage, fernet culture, and sierras on the doorstep.",
    "cuenca": "Ecuador's colonial crown—UNESCO streets, Panama hat artisans, and riverside walks.",
    "cusco": "Inca navel of the world—altitude acclimatization, Machu Picchu gateway, and Andean soul.",
    "cyprus": "Mediterranean crossroads—beach resorts, mountain villages, and EU tax advantages.",

    # D
    "dakar": "Senegalese soul on the Atlantic—Gorée Island memories, teranga hospitality, and Afrobeat nights.",
    "danang": "Vietnam's beach city rising—My Khe sands, Marble Mountains, and pristine infrastructure.",
    "denver": "Mile High momentum—craft beer explosion, mountain access, and Rocky Mountain sunshine.",
    "doha": "Desert ambition realized—Museum of Islamic Art, souq traditions, and World Cup legacy.",
    "dresden": "Baroque phoenix—Frauenkirche resurrection, Elbe valley beauty, and eastern German culture.",
    "dubai": "Future city in the sand—tax-free towers, desert adventures, and global crossroads living.",
    "dublin": "Literary capital with legendary craic—tech giants, Georgian doors, and pub session magic.",

    # E
    "edinburgh": "Castle-crowned capital—festival city, Arthur's Seat hikes, and Scottish soul.",
    "eilat": "Red Sea resort oasis—year-round diving, desert canyons, and duty-free shopping.",
    "eindhoven": "Dutch Design capital—Philips legacy, tech innovation, and creative industrial rebirth.",
    "elnido": "Palawan's limestone paradise—secret lagoons, island hopping, and bucket-list sunsets.",
    "essaouira": "Morocco's windy blue city—kite surfers, artist medinas, and fresh grilled sardines.",

    # F
    "faro": "Algarve gateway—old town charm, beach access, and Portugal's sunniest corner.",
    "fethiye": "Turquoise Coast adventure base—Ölüdeniz lagoon, Lycian Way treks, and paragliding highs.",
    "florence": "Renaissance heart of the world—Uffizi wonders, Tuscan hills, and artisan leather.",
    "florianopolis": "Brazilian island paradise—42 beaches, surf culture, and South America's startup hub.",
    "fuerteventura": "Canary Island wilderness—endless beaches, volcanic landscapes, and kite surfing mecca.",

    # G
    "gdansk": "Baltic amber city—Gothic grandeur, Solidarity birthplace, and maritime heritage.",
    "geneva": "Diplomatic lakeside elegance—jet d'eau, UN quarter, and Alpine panoramas.",
    "genoa": "Italy's greatest port—superba past, pesto birthplace, and authentic Ligurian life.",
    "ghent": "Belgium's best-kept secret—medieval towers, student energy, and canal-side culture.",
    "gijon": "Asturian coast gem—cider culture, surf beaches, and authentic northern Spain.",
    "girona": "Catalonia's medieval marvel—Game of Thrones streets, Jewish quarter, and El Celler legacy.",
    "goa": "India's beach state—Portuguese churches, trance beaches, and susegad slow living.",
    "goldcoast": "Australia's surf city—point breaks, high-rises, and endless summer lifestyle.",
    "grenoble": "Alpine innovation valley—ski lifts from downtown, university energy, and mountain immersion.",
    "guadalajara": "Tequila homeland—mariachi plazas, tech growth, and Mexico's most livable city.",
    "guanajuato": "Underground city of colors—mummy museum, callejoneadas, and mining town romance.",

    # H
    "haifa": "Bahá'í gardens cascade to the sea—tech hub with terraced beauty and coexistence.",
    "hanoi": "Old Quarter chaos and charm—egg coffee rituals, temple incense, and motorbike symphonies.",
    "heidelberg": "Germany's romantic soul—castle ruins, philosopher's walk, and student tavern traditions.",
    "helsinki": "Design capital of happy people—sauna culture, archipelago access, and Nordic innovation.",
    "hochiminhcity": "Saigon's relentless energy—motorbike rivers, rooftop bars, and Vietnam's economic engine.",
    "hoian": "Lantern-lit ancient town—tailor shops, bánh mì perfection, and Thu Bồn river magic.",
    "huanchaco": "Peru's surf village—totora reed boats, ceviche lunch, and pre-Inca mysteries.",

    # I
    "ibiza": "Balearic beat island—superclub sunrises, hidden coves, and bohemian north shores.",
    "innsbruck": "Alpine capital perfection—ski from the city, Habsburg history, and mountain immersion.",
    "ipoh": "Malaysia's hidden gem—white coffee, street art, and limestone cave temples.",

    # J
    "jaipur": "Pink City splendor—Amber Fort majesty, block-print textiles, and Rajasthani royalty.",
    "jeju": "Korea's volcanic paradise—lava tubes, haenyeo divers, and tangerine groves.",

    # K
    "kampot": "Cambodia's riverside retreat—pepper plantations, French colonial quiet, and crab sunsets.",
    "kanchanaburi": "River Kwai history—bridge walks, jungle floats, and waterfall escapes from Bangkok.",
    "khaolak": "Andaman serenity—Similan diving, tsunami memorial, and Thailand's quieter coast.",
    "klaipeda": "Lithuania's Baltic port—Curonian Spit gateway, amber treasures, and seaside charm.",
    "kohphangan": "Full moon party island transformed—yoga retreats, jungle vibes, and Thai island soul.",
    "kohsamui": "Gulf of Thailand luxury—ring road beaches, coconut groves, and island sophistication.",
    "krabi": "Karst cliff paradise—Railay climbing, island hopping, and Andaman adventure base.",
    "kualalumpur": "Twin Towers and street food stalls—Malaysia's multicultural metropolis.",
    "kuching": "Borneo's charming capital—orangutan encounters, Sarawak culture, and riverfront walks.",
    "kyoto": "Japan's cultural soul—thousand temples, geisha glimpses, and seasonal perfection.",

    # L
    "lakeatitlan": "Guatemala's sacred lake—volcano-ringed villages, Maya traditions, and hippie trails.",
    "langkawi": "Duty-free island escape—Eagle Square, mangrove kayaks, and Malaysian beach bliss.",
    "lausanne": "Olympic city on Lake Geneva—vineyard terraces, museums, and Swiss precision living.",
    "lima": "Gastronomic capital of the Americas—ceviche perfection, Miraflores cliffs, and Pacific sunsets.",
    "losangeles": "City of Angels and endless reinvention—beach culture, entertainment industry, and taco trucks.",
    "luangprabang": "Laos' spiritual heart—morning alms, waterfall swims, and French-Indochine elegance.",
    "lucerne": "Swiss postcard perfection—Chapel Bridge, Lion Monument, and Alpine lake serenity.",

    # M
    "madrid": "Spain's passionate capital—Prado masterpieces, tapas crawls, and midnight dinners.",
    "malacca": "Straits of Malacca heritage—Portuguese forts, Peranakan shophouses, and Jonker Street nights.",
    "malaga": "Picasso's birthplace awakened—museum mile, beach life, and Andalusian tech scene.",
    "malang": "Java's cool colonial retreat—Dutch architecture, apple orchards, and volcano gateway.",
    "malmo": "Sweden's creative south—Turning Torso, bike paths, and Copenhagen's affordable neighbor.",
    "manila": "Chaotic capital of contradictions—Intramuros history, mall culture, and Filipino warmth.",
    "marbella": "Costa del Sol glamour—Puerto Banús yachts, old town charm, and beach club life.",
    "marrakech": "Red city sensory overload—souks, riads, and Atlas Mountain gateway.",
    "mauritius": "Indian Ocean paradise—turquoise lagoons, multicultural fusion, and volcanic peaks.",
    "melbourne": "Australia's cultural capital—laneway coffee, street art, and four seasons in one day.",
    "mendoza": "Wine country magnificence—Malbec vineyards, Andes views, and asado traditions.",
    "mexicocity": "Aztec foundations, Diego Rivera murals—megacity of tacos, museums, and Roma cool.",
    "milan": "Fashion and finance capital—Duomo grandeur, aperitivo culture, and Italian design.",
    "montpellier": "France's youngest city—Mediterranean student energy, tram art, and tech ambition.",
    "montreal": "Bilingual creative capital—bagels, festivals, and European soul in North America.",
    "mostar": "Bridge between worlds—Stari Most divers, Ottoman echoes, and Balkan resilience.",
    "mumbai": "Bollywood and business—Marine Drive sunsets, street food feasts, and Indian ambition.",
    "muscat": "Oman's dignified capital—frankincense souks, fort grandeur, and Gulf authenticity.",

    # N
    "nagoya": "Japan's industrial heart—Toyota heritage, castle glory, and hitsumabushi eel.",
    "nairobi": "Safari capital—Maasai Mara gateway, giraffe center, and East African tech hub.",
    "nantes": "Loire creativity unleashed—mechanical elephant, Jules Verne legacy, and green innovation.",
    "naples": "Chaotic, authentic, unforgettable—pizza birthplace, Vesuvius views, and southern Italian soul.",
    "nice": "Côte d'Azur queen—Promenade des Anglais, old town markets, and Mediterranean light.",
    "ninhbinh": "Halong Bay on land—karst mountains, temple caves, and rural Vietnam beauty.",

    # O
    "ohrid": "Macedonia's lakeside jewel—Byzantine churches, beach promenades, and Balkan serenity.",
    "oxford": "Dreaming spires and academic excellence—college quads, pub debates, and British tradition.",

    # P
    "pai": "Northern Thailand's hippie valley—hot springs, canyon views, and backpacker community.",
    "palawan": "Philippines' last frontier—underground rivers, island paradise, and pristine nature.",
    "palermo": "Sicily's chaotic heart—Arab-Norman splendor, street markets, and regeneration energy.",
    "palma": "Mallorca's sophisticated capital—Gothic cathedral, yacht harbor, and Mediterranean living.",
    "panama": "Crossroads of the Americas—canal engineering, Casco Viejo charm, and banking hub.",
    "paris": "City of Light and eternal romance—café terraces, museum treasures, and arrondissement wandering.",
    "penang": "Malaysia's food paradise—George Town heritage, hawker feasts, and multicultural layers.",
    "perth": "Australia's isolated sunshine capital—Swan River, beach suburbs, and mining wealth.",
    "phnompenh": "Cambodia's resilient capital—Royal Palace, riverside promenades, and Khmer renaissance.",
    "piran": "Slovenia's Venetian gem—Adriatic sunsets, salt pans, and tiny town perfection.",
    "playadelcarmen": "Riviera Maya heart—Fifth Avenue strolls, cenote swims, and Caribbean ease.",
    "plovdiv": "Europe's oldest city awakened—Roman theater, creative district, and Bulgarian wine.",
    "podgorica": "Montenegro's modest capital—canyon gateway, riverside walks, and Balkan authenticity.",
    "pokhara": "Nepal's lake city—Annapurna views, paragliding thermals, and trekker's paradise.",
    "pontadelgada": "Azores gateway—volcanic lakes, whale watching, and mid-Atlantic tranquility.",
    "porto": "Ribeira romance—port wine cellars, azulejo tiles, and Douro River soul.",
    "prizren": "Kosovo's cultural gem—Ottoman bridges, fortress views, and Balkan hospitality.",
    "puertovallarta": "Pacific Mexico's gay-friendly gem—malecón art, jungle backdrop, and zona romántica.",
    "pula": "Roman arena on the Adriatic—Istrian wine, truffle hunts, and Croatian coast gateway.",
    "puntacana": "Dominican all-inclusive paradise—palm-lined beaches, golf courses, and Caribbean rhythm.",

    # Q
    "queenstown": "Adventure capital of the world—bungee birthplace, ski fields, and Remarkables views.",
    "quito": "Highest capital in the world—equator straddle, colonial centro, and Andean drama.",

    # R
    "reykjavik": "World's northernmost capital—Northern Lights, geothermal pools, and Viking spirit.",
    "riga": "Baltic Art Nouveau treasure—Jugendstil facades, medieval old town, and Black Balsam.",
    "rome": "Eternal City of empires—Colosseum shadows, Trastevere nights, and dolce vita living.",

    # S
    "salvador": "Brazil's African soul—Pelourinho colors, capoeira rhythms, and Bahian spirituality.",
    "sandiego": "California's finest city—craft beer, beach culture, and perfect weather year-round.",
    "sanjuan": "Caribbean colonial jewel—El Morro fortress, salsa clubs, and Puerto Rican pride.",
    "sanmigueldeallende": "Mexico's most beautiful town—art galleries, expat community, and colonial perfection.",
    "santiago": "Andes-backed metropolis—wine valleys, Providencia cool, and Chilean ambition.",
    "santodomingo": "First city of the Americas—Zona Colonial cobblestones, merengue, and Caribbean history.",
    "santorini": "Cycladic dream in blue and white—caldera sunsets, volcanic beaches, and Greek island magic.",
    "saopaulo": "South American megacity—paulistano hustle, cultural depth, and gastronomic revolution.",
    "sapa": "Vietnam's rice terrace wonderland—hill tribe markets, mountain treks, and misty valleys.",
    "sapporo": "Hokkaido's winter wonderland—powder snow, ramen alleys, and beer garden summers.",
    "sarande": "Albanian Riviera rising—Blue Eye springs, Butrint ruins, and Mediterranean on a budget.",
    "seattle": "Pacific Northwest tech hub—coffee culture, Pike Place, and mountain-framed skyline.",
    "seville": "Andalusian passion incarnate—flamenco, tapas, and orange blossom-scented plazas.",
    "siargao": "Philippines' surf capital—Cloud 9 barrels, island hopping, and barefoot luxury.",
    "siemreap": "Angkor's gateway city—temple sunrise, pub street nights, and Khmer hospitality.",
    "skopje": "North Macedonia's quirky capital—statue overload, old bazaar, and Balkan crossroads.",
    "sofia": "Bulgaria's mountain-backed capital—Orthodox domes, mineral springs, and Vitosha hiking.",
    "split": "Diocletian's living palace—Croatian coast gem, ferry hub, and Dalmatian dolce vita.",
    "stockholm": "Scandinavian island capital—archipelago beauty, design museums, and Nordic cool.",
    "sydney": "Harbor city icon—Opera House sails, Bondi waves, and Australian confidence.",

    # T
    "taghazout": "Morocco's surf village—right-hand point breaks, argan trees, and Atlantic sunsets.",
    "taipei": "Night market capital—bubble tea birthplace, hot springs, and Taiwanese hospitality.",
    "tamarindo": "Costa Rica's surf town—Pacific sunsets, howler monkeys, and pura vida lifestyle.",
    "tenerife": "Canary Island diversity—Teide volcano, black sand beaches, and eternal spring.",
    "thehague": "Dutch seat of power—Peace Palace, North Sea beaches, and regal architecture.",
    "timisoara": "Romania's Little Vienna—Habsburg elegance, revolution birthplace, and cultural revival.",
    "toronto": "Canada's multicultural mosaic—neighborhood diversity, arts scene, and urban energy.",
    "tunis": "Medina meets Mediterranean—Carthage ruins, Sidi Bou Said blues, and Tunisian hospitality.",
    "turin": "Piedmont elegance—chocolate capital, Egyptian treasures, and Alpine backdrop.",

    # V
    "valletta": "Fortress capital in the sun—Knights of Malta legacy, Baroque splendor, and Mediterranean charm.",
    "valparaiso": "Chile's colorful port—hillside funiculars, street art, and bohemian Pablo Neruda spirit.",
    "vangvieng": "Laos adventure playground—tubing transformed, karst climbing, and Blue Lagoon swims.",
    "vienna": "Imperial grandeur and coffee house culture—Klimt, opera, and waltz traditions.",
    "vilcabamba": "Valley of longevity—Ecuadorian highlands, wellness seekers, and eternal spring.",
    "vilnius": "Baltic baroque beauty—Old Town UNESCO, quirky republic, and Lithuanian pride.",

    # W
    "warsaw": "Phoenix capital—Old Town resurrection, Chopin heritage, and Polish resilience.",
    "wellington": "Coolest little capital—craft coffee, film industry, and wind-swept waterfront.",
    "wroclaw": "Polish Venice of a hundred bridges—gnome hunting, market square, and student energy.",

    # Y
    "yerevan": "Pink city of Armenia—Ararat views, brandy cellars, and ancient Christian heritage.",

    # Z
    "zadar": "Croatian coast gem—sea organ sunsets, Roman ruins, and Dalmatian authenticity.",
    "zanzibar": "Spice island enchantment—Stone Town labyrinths, turquoise waters, and Swahili soul.",
    "zaragoza": "Aragón's underrated capital—Mudéjar towers, tapas culture, and Ebro riverside.",
    "zurich": "Swiss precision meets lake beauty—banking center, old town charm, and Alpine access.",
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

    for city_id, new_tagline in sorted(UPDATED_TAGLINES.items()):
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

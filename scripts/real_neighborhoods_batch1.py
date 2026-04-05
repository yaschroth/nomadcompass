#!/usr/bin/env python3
"""
Batch 1: Real neighborhood data for 10 cities.
Run this to add authentic neighborhoods to generate_city_pages.js
"""

import re
import json

# Real neighborhood data researched from nomad/expat sources
REAL_NEIGHBORHOODS = {
    "berlin": [
        {
            "name": "Kreuzberg",
            "tagline": "Berlin's rebellious heart where counterculture thrives",
            "description": "Kreuzberg is the pulsating core of Berlin's alternative scene. This multicultural neighborhood is a magnet for digital nomads with its abundance of trendy cafes, legendary coworking spaces like Betahaus, and a vibrant arts and music scene. The streets buzz with energy from morning coffee to late-night clubs.",
            "vibe": "Alternative & Multicultural",
            "bestFor": "Creatives, political activists, hipsters, and digital nomads seeking authentic Berlin energy",
            "pros": ["Best coworking scene", "Legendary nightlife", "Multicultural food", "Strong nomad community"],
            "cons": ["Can be gritty", "Noisy at night", "Gentrifying fast"],
            "lat": 52.4990,
            "lng": 13.4030,
            "priceLevel": "$$"
        },
        {
            "name": "Prenzlauer Berg",
            "tagline": "Where startups meet strollers on tree-lined streets",
            "description": "Prenzlauer Berg enchants with beautifully restored pre-war buildings and wide, leafy boulevards. Home to The Factory, a Google-backed startup space housing companies like Uber and SoundCloud, it's where Berlin's tech elite works and lives. Mauerpark's Sunday flea market is unmissable.",
            "vibe": "Upscale & Family-Friendly",
            "bestFor": "Tech workers, startup founders, and nomads seeking quality of life with professional networking",
            "pros": ["Beautiful architecture", "Great parks", "Top coworking", "Safe and clean"],
            "cons": ["Higher rents", "Can feel suburban", "Less nightlife"],
            "lat": 52.5389,
            "lng": 13.4229,
            "priceLevel": "$$$"
        },
        {
            "name": "Friedrichshain",
            "tagline": "Street art, techno, and the spirit of East Berlin",
            "description": "Friedrichshain is where Berlin's legendary nightlife lives. The East Side Gallery, the longest remaining stretch of the Berlin Wall, sets the artistic tone. Digital nomads thrive here among indie coffee shops, affordable coworking spaces, and that perfect work-life balance Berlin is famous for.",
            "vibe": "Edgy & Creative",
            "bestFor": "Young professionals, night owls, artists, and nomads who work hard and party harder",
            "pros": ["Vibrant nightlife", "Street art everywhere", "Good value", "Young energy"],
            "cons": ["Very loud weekends", "Tourist spillover", "Can feel chaotic"],
            "lat": 52.5164,
            "lng": 13.4542,
            "priceLevel": "$$"
        },
        {
            "name": "Mitte",
            "tagline": "Historic heart meets modern business district",
            "description": "Mitte is Berlin's center - geographically and economically. Major companies, embassies, and corporate offices cluster here alongside museums and historic landmarks. Impact Hub Berlin offers social-impact-focused coworking, and you're walking distance to everything that matters.",
            "vibe": "Central & Professional",
            "bestFor": "Business travelers, corporate remote workers, and those who want premium access to everything",
            "pros": ["Central location", "Major landmarks", "Professional networking", "Great transport"],
            "cons": ["Highest rents", "Very touristy", "Less authentic"],
            "lat": 52.5200,
            "lng": 13.4050,
            "priceLevel": "$$$"
        },
        {
            "name": "Neukölln",
            "tagline": "Berlin's most diverse neighborhood at unbeatable prices",
            "description": "Neukölln is where budget-conscious nomads discover the real Berlin. Often compared to Kreuzberg but cheaper and more local, it's filled with affordable eateries, art spaces, and coworking hubs. The diverse, international community includes young professionals, students, and artists from around the world.",
            "vibe": "Diverse & Budget-Friendly",
            "bestFor": "Budget nomads, young expats, and those seeking authentic multicultural Berlin",
            "pros": ["Most affordable", "Authentic vibe", "Great food scene", "Strong community"],
            "cons": ["Rougher edges", "Further from center", "Less English"],
            "lat": 52.4811,
            "lng": 13.4350,
            "priceLevel": "$"
        }
    ],

    "budapest": [
        {
            "name": "Erzsébetváros (District VII)",
            "tagline": "Ruin bars, street art, and Budapest's beating heart",
            "description": "The Jewish Quarter is Budapest's most vibrant district - home to Szimpla Kert and the legendary ruin bar scene. Beyond nightlife, its side streets hide vintage shops, Jewish heritage sites, and budget-friendly eateries. Young, trendy, and very much alive, it's where nomads find their tribe.",
            "vibe": "Trendy & Lively",
            "bestFor": "Young nomads, social butterflies, and anyone who doesn't mind trading quiet for character",
            "pros": ["Legendary nightlife", "Great restaurants", "Walkable", "Social scene"],
            "cons": ["Noisy weekends", "Increasingly touristy", "Party scene wears thin"],
            "lat": 47.4979,
            "lng": 19.0686,
            "priceLevel": "$$"
        },
        {
            "name": "Belváros-Lipótváros (District V)",
            "tagline": "Grand boulevards and Danube views in the city center",
            "description": "District V is Budapest's absolute center - Parliament, the Danube, and St. Stephen's Basilica are your neighbors. Beautiful, walkable, and undeniably impressive, it's where you want to be if location is everything. The Central European University area brings intellectual energy.",
            "vibe": "Central & Historic",
            "bestFor": "First-timers, architecture lovers, and those who want iconic Budapest at their doorstep",
            "pros": ["Iconic location", "Beautiful architecture", "Best transport", "High-end dining"],
            "cons": ["Most expensive", "Very touristy", "Can feel impersonal"],
            "lat": 47.4984,
            "lng": 19.0510,
            "priceLevel": "$$$"
        },
        {
            "name": "Terézváros (District VI)",
            "tagline": "Opera houses and artistic energy on Andrássy Avenue",
            "description": "This is where culture vultures and creatives gravitate. The Opera House, bookshop cafés, and artistic energy define Terézváros. It's solid value for such a central, vibrant location - young professionals, creatives, and culture enthusiasts call it home.",
            "vibe": "Cultural & Creative",
            "bestFor": "Artists, culture lovers, and professionals wanting central location without District V prices",
            "pros": ["Cultural attractions", "Great cafes", "Central location", "Good value"],
            "cons": ["Busy main streets", "Some tourist overflow", "Noise from nightlife"],
            "lat": 47.5055,
            "lng": 19.0631,
            "priceLevel": "$$"
        },
        {
            "name": "Újlipótváros (District XIII)",
            "tagline": "Where expats find peace without leaving the city",
            "description": "Budapest's worst-kept secret among long-term expats. Újlipótváros offers family-friendly streets, green spaces, and modern apartments at prices that won't break the bank. Cross the bridge when you want the buzz, then retreat to your quiet, leafy neighborhood.",
            "vibe": "Residential & Peaceful",
            "bestFor": "Long-term stayers, families, and nomads who value calm over chaos",
            "pros": ["Quiet streets", "Good value", "Family-friendly", "Local feel"],
            "cons": ["Less exciting", "Fewer cafes", "Not walkable to center"],
            "lat": 47.5180,
            "lng": 19.0520,
            "priceLevel": "$"
        },
        {
            "name": "Buda Castle District",
            "tagline": "Medieval charm with million-dollar Danube views",
            "description": "Cross the Danube to Buda for a completely different Budapest. The Castle District offers medieval streets, panoramic views, and a peaceful escape from Pest's energy. Fewer nomads venture here, but those who do find inspiration in every cobblestone.",
            "vibe": "Historic & Scenic",
            "bestFor": "History buffs, writers, and those seeking inspiration over convenience",
            "pros": ["Stunning views", "Historic atmosphere", "Peaceful", "Unique character"],
            "cons": ["Far from action", "Steep hills", "Limited nightlife", "Touristy by day"],
            "lat": 47.4969,
            "lng": 19.0399,
            "priceLevel": "$$$"
        }
    ],

    "prague": [
        {
            "name": "Vinohrady",
            "tagline": "Prague's most livable neighborhood for good reason",
            "description": "Vinohrady consistently ranks as Prague's most popular district among expats and digital nomads. Tree-lined streets, quality restaurants, and excellent transit connections create the perfect base. The buzzing community hub around Jiřího z Poděbrad square is where nomads gather.",
            "vibe": "Sophisticated & Residential",
            "bestFor": "Long-term nomads, young professionals, and anyone seeking Prague's best quality of life",
            "pros": ["Beautiful streets", "Great restaurants", "Strong expat community", "Safe and clean"],
            "cons": ["Higher rents", "Can feel quiet", "Limited nightlife"],
            "lat": 50.0755,
            "lng": 14.4490,
            "priceLevel": "$$$"
        },
        {
            "name": "Žižkov",
            "tagline": "Bohemian spirit and the most pubs per capita in Prague",
            "description": "Žižkov's bohemian atmosphere and student population make it Prague's most budget-friendly option. Raw, creative, and authentic - it attracts artists, web developers, and international freelancers who love its alternative feel. You either love Žižkov or you don't, there's no in-between.",
            "vibe": "Bohemian & Alternative",
            "bestFor": "Budget nomads, creatives, students, and those who value character over polish",
            "pros": ["Most affordable", "Authentic local vibe", "Great pubs", "Creative community"],
            "cons": ["Rough around edges", "Less renovated", "Can feel isolated"],
            "lat": 50.0872,
            "lng": 14.4508,
            "priceLevel": "$"
        },
        {
            "name": "Karlín",
            "tagline": "Prague's startup HQ where tech meets craft beer",
            "description": "Karlín has become the unofficial headquarters of Prague's creative and tech communities. This rapidly gentrifying district offers modern apartments, innovative coworking spaces, and a growing selection of international restaurants and craft breweries. Elegant yet relaxed.",
            "vibe": "Modern & Professional",
            "bestFor": "Tech workers, startup founders, and professionals wanting modern amenities with character",
            "pros": ["Modern apartments", "Tech community", "Great restaurants", "Riverside location"],
            "cons": ["Gentrifying fast", "Rising prices", "Can feel corporate"],
            "lat": 50.0922,
            "lng": 14.4487,
            "priceLevel": "$$"
        },
        {
            "name": "Smíchov",
            "tagline": "Prague's best transport hub with everything nearby",
            "description": "Not far from the center, Smíchov blends business and nightlife where office buildings share streets with creative spaces in converted factories. Impact Hub Praha calls this area home. The Anděl metro station makes it Prague's best-connected neighborhood.",
            "vibe": "Convenient & Mixed-Use",
            "bestFor": "Nomads who prioritize transport and convenience over neighborhood charm",
            "pros": ["Best transport connections", "Shopping nearby", "Coworking options", "Affordable"],
            "cons": ["Less charming", "Commercial feel", "Busy streets"],
            "lat": 50.0711,
            "lng": 14.4036,
            "priceLevel": "$$"
        },
        {
            "name": "Holešovice",
            "tagline": "Industrial cool with galleries and weekend markets",
            "description": "Holešovice represents Prague's creative future. Former industrial spaces now house galleries, design studios, and the DOX contemporary art center. The riverside location and weekend farmers' markets at Pražská tržnice add to its appeal for creative nomads.",
            "vibe": "Artsy & Industrial",
            "bestFor": "Creatives, art lovers, and nomads seeking Prague's emerging scene",
            "pros": ["Art galleries", "River access", "Great markets", "Up-and-coming"],
            "cons": ["Still developing", "Fewer amenities", "Can feel empty"],
            "lat": 50.1055,
            "lng": 14.4378,
            "priceLevel": "$$"
        }
    ],

    "amsterdam": [
        {
            "name": "De Pijp",
            "tagline": "Bohemian vibes and Albert Cuyp Market energy",
            "description": "De Pijp is Amsterdam's bohemian heart, centered around the famous Albert Cuyp Market. The neighborhood's plethora of bars, cafes, and international restaurants makes it a social hub. Sarphatipark provides green escape, and prices remain more affordable than Jordaan.",
            "vibe": "Bohemian & Social",
            "bestFor": "Young professionals, social nomads, and anyone who wants to be where the action is",
            "pros": ["Famous market", "Great nightlife", "International food", "Central location"],
            "cons": ["Getting expensive", "Crowded streets", "Tourist spillover"],
            "lat": 52.3547,
            "lng": 4.8936,
            "priceLevel": "$$"
        },
        {
            "name": "Jordaan",
            "tagline": "Picturesque canals and Amsterdam's artistic soul",
            "description": "The Jordaan is Amsterdam's most photogenic neighborhood - narrow streets, picturesque canals, and an artistic vibe that's transformed it into one of the city's most desirable areas. Cozy cafes and boutique dining options create the perfect work environment.",
            "vibe": "Charming & Artistic",
            "bestFor": "Those who value aesthetics, quiet canal-side work sessions, and Dutch charm",
            "pros": ["Beautiful canals", "Cozy cafes", "Artistic atmosphere", "Neighborly vibe"],
            "cons": ["Most expensive", "Very touristy", "Small apartments"],
            "lat": 52.3747,
            "lng": 4.8818,
            "priceLevel": "$$$"
        },
        {
            "name": "Amsterdam Oost",
            "tagline": "Hipster haven where old meets new",
            "description": "Amsterdam East has emerged as the hipster haven - independent shops, art galleries, and trendy cafes fill a mix of old and new architecture. More affordable than central districts, Oost offers authentic Amsterdam living with a creative, laid-back atmosphere.",
            "vibe": "Hip & Up-and-Coming",
            "bestFor": "Budget-conscious nomads, creatives, and those seeking authentic local life",
            "pros": ["More affordable", "Local vibe", "Great cafes", "Less touristy"],
            "cons": ["Further from center", "Still developing", "Fewer landmarks"],
            "lat": 52.3600,
            "lng": 4.9284,
            "priceLevel": "$$"
        },
        {
            "name": "Amsterdam Noord",
            "tagline": "Creative hub across the IJ with space to breathe",
            "description": "Just across the IJ river via free ferry, Amsterdam Noord has transformed into an exciting cultural hub. Creative spaces, trendy eateries, and loft-style living attract young professionals and artists. It's Amsterdam's most affordable central option with an alternative, creative community.",
            "vibe": "Creative & Spacious",
            "bestFor": "Artists, creatives, and nomads seeking space and affordability with ferry-quick city access",
            "pros": ["Most affordable", "Creative community", "Modern spaces", "Quick ferry to center"],
            "cons": ["Across the water", "Still developing", "Industrial areas"],
            "lat": 52.3906,
            "lng": 4.9230,
            "priceLevel": "$"
        },
        {
            "name": "Oud-West",
            "tagline": "Local Amsterdam life with Vondelpark at your door",
            "description": "Oud-West delivers authentic Amsterdam living next to the famous Vondelpark. The neighborhood strikes a perfect balance - residential enough to feel like home, central enough to access everything. De Hallen food hall and cultural center anchor the community.",
            "vibe": "Residential & Balanced",
            "bestFor": "Long-term nomads, families, and those seeking neighborhood life near the park",
            "pros": ["Vondelpark access", "Local feel", "Good balance", "De Hallen food hall"],
            "cons": ["Limited nightlife", "Residential quiet", "Rising prices"],
            "lat": 52.3627,
            "lng": 4.8669,
            "priceLevel": "$$"
        }
    ],

    "seoul": [
        {
            "name": "Itaewon",
            "tagline": "Seoul's international hub where English flows freely",
            "description": "Itaewon is Seoul's undisputed expat capital. International restaurants, English-speaking services, and a vibrant multicultural atmosphere make it the easiest landing spot in Korea. The nightlife is active and the community is established, though it comes at a premium.",
            "vibe": "International & Vibrant",
            "bestFor": "Expats, digital nomads, English speakers, and those new to Korea",
            "pros": ["English everywhere", "International food", "Active nightlife", "Expat community"],
            "cons": ["Expensive", "Very busy", "Less authentic Korean"],
            "lat": 37.5340,
            "lng": 126.9948,
            "priceLevel": "$$$"
        },
        {
            "name": "Hongdae",
            "tagline": "Seoul's creative heartbeat with unbeatable energy",
            "description": "Named after Hongik University, Hongdae is Seoul's creative and youthful heart. Street performances, indie music venues, and affordable restaurants create constant buzz. More affordable than Gangnam, it's where young professionals, students, and creatives thrive.",
            "vibe": "Young & Creative",
            "bestFor": "Young professionals, creatives, students, and those who want Seoul's energy on a budget",
            "pros": ["Vibrant nightlife", "Creative scene", "Affordable", "Young energy"],
            "cons": ["Very crowded", "Noisy weekends", "Not for families"],
            "lat": 37.5563,
            "lng": 126.9237,
            "priceLevel": "$$"
        },
        {
            "name": "Gangnam",
            "tagline": "Seoul's luxury district where business meets status",
            "description": "Yes, that Gangnam. Seoul's business and luxury district delivers glass skyscrapers, department stores, and high-end everything. Perfect for professionals in finance, tech, and startups - you're close to global companies, coworking spaces, and corporate headquarters.",
            "vibe": "Upscale & Professional",
            "bestFor": "Business professionals, corporate remote workers, and those who need premium amenities",
            "pros": ["Modern infrastructure", "Professional networking", "Luxury amenities", "Clean and safe"],
            "cons": ["Most expensive", "Can feel corporate", "Less character"],
            "lat": 37.4979,
            "lng": 127.0276,
            "priceLevel": "$$$"
        },
        {
            "name": "Yeonnam-dong",
            "tagline": "Seoul's trendiest up-and-comer for creative nomads",
            "description": "Yeonnam-dong has become one of Seoul's trendiest neighborhoods for younger expats, artists, and digital nomads. Near Hongdae but quieter, it offers artistic energy, cafes, coworking spaces, and boutique guesthouses in a more laid-back setting.",
            "vibe": "Trendy & Laid-back",
            "bestFor": "Artists, digital nomads, and those seeking Hongdae proximity without the chaos",
            "pros": ["Trendy cafes", "Artistic vibe", "Quieter than Hongdae", "Great for work"],
            "cons": ["Small area", "Getting popular", "Limited late-night"],
            "lat": 37.5603,
            "lng": 126.9213,
            "priceLevel": "$$"
        },
        {
            "name": "Mapo",
            "tagline": "The best balance of cost, convenience, and local charm",
            "description": "Mapo District offers one of Seoul's best balances - close to Hongdae but much calmer, with access to Seoul's energy without the chaos. It's where digital nomads and cultural explorers find their sweet spot between authenticity and convenience.",
            "vibe": "Balanced & Local",
            "bestFor": "Long-term nomads, cultural explorers, and those seeking value with access",
            "pros": ["Great value", "Local charm", "Good transport", "Near Hongdae"],
            "cons": ["Less exciting", "Fewer foreigners", "Basic amenities"],
            "lat": 37.5537,
            "lng": 126.9368,
            "priceLevel": "$"
        }
    ],

    "kualalumpur": [
        {
            "name": "Bukit Bintang",
            "tagline": "KL's entertainment heart with malls and street food",
            "description": "Bukit Bintang is the heart of KL's shopping and entertainment - Pavilion KL, Berjaya Times Square, and a culinary paradise of street food stalls. Well-connected by MRT and monorail, with cafes and coworking spaces like Common Ground, it's where nomads who thrive on energy belong.",
            "vibe": "Central & Energetic",
            "bestFor": "Nomads who want nightlife, shopping, and total convenience at their doorstep",
            "pros": ["Central location", "Great transport", "Endless food options", "Coworking nearby"],
            "cons": ["Crowded", "Noisy", "Tourist-heavy"],
            "lat": 3.1466,
            "lng": 101.7108,
            "priceLevel": "$$"
        },
        {
            "name": "KLCC",
            "tagline": "Petronas Towers and luxury living in the sky",
            "description": "KLCC means living in the shadow of the Petronas Twin Towers and Merdeka 118. This is KL's luxury heart - upscale malls, world-class hotels, and high-end condos. Great for occasional sky dining and rooftop bars, though most expats find it better for visits than living.",
            "vibe": "Luxury & Iconic",
            "bestFor": "Professionals seeking luxury, impressive addresses, and corporate convenience",
            "pros": ["Iconic location", "Luxury amenities", "KLCC Park", "Business hub"],
            "cons": ["Most expensive", "Touristy", "Less authentic"],
            "lat": 3.1579,
            "lng": 101.7117,
            "priceLevel": "$$$"
        },
        {
            "name": "Bangsar",
            "tagline": "Where KL's creatives and young professionals gather",
            "description": "Bangsar is where you go to see and be seen. Trendy cafes, stylish boutiques, and vibrant nightlife attract young professionals and creatives. It's the bohemian, more affluent area with great coworking options and international community, well-connected to the city center.",
            "vibe": "Trendy & Affluent",
            "bestFor": "Creatives, young professionals, and those seeking KL's trendiest neighborhood",
            "pros": ["Trendy cafes", "Good nightlife", "Creative vibe", "Train access"],
            "cons": ["Getting expensive", "Traffic", "Spread out"],
            "lat": 3.1290,
            "lng": 101.6721,
            "priceLevel": "$$"
        },
        {
            "name": "Mont Kiara",
            "tagline": "KL's expat village with international everything",
            "description": "Mont Kiara is undoubtedly KL's expat headquarters - high-end condos, international schools, Korean and Japanese restaurants, and upscale bars. It's the go-to neighborhood where you'll settle right in and feel at home, though you'll need a car to reach the action.",
            "vibe": "Expat & Family-Friendly",
            "bestFor": "Families, long-term expats, and nomads who prioritize comfort over local immersion",
            "pros": ["Expat community", "International amenities", "Safe and clean", "Good condos"],
            "cons": ["Need a car", "Traffic to center", "Isolated bubble"],
            "lat": 3.1716,
            "lng": 101.6511,
            "priceLevel": "$$$"
        },
        {
            "name": "Sri Hartamas",
            "tagline": "Mont Kiara's more affordable, foodie-friendly neighbor",
            "description": "Sri Hartamas offers the benefits of the Mont Kiara area without the premium prices. Great food options, cafes, and a local feel make it popular with younger expats and nomads. It bridges the gap between expat comfort and authentic KL living.",
            "vibe": "Local & Foodie",
            "bestFor": "Budget-conscious expats, foodies, and those seeking Mont Kiara proximity at better value",
            "pros": ["Great food scene", "More affordable", "Local feel", "Near Mont Kiara"],
            "cons": ["Need transport", "Less polished", "Fewer amenities"],
            "lat": 3.1600,
            "lng": 101.6588,
            "priceLevel": "$"
        }
    ],

    "buenosaires": [
        {
            "name": "Palermo",
            "tagline": "BA's undisputed nomad capital across four distinct barrios",
            "description": "Easily Buenos Aires' most popular neighborhood for digital nomads. Divided into Palermo Soho, Palermo Hollywood, and Las Cañitas, it's a treasure trove of boutiques, bars, restaurants, parks, and coworking spaces. The bulk of BA's nomad infrastructure lives here.",
            "vibe": "Trendy & Nomad-Friendly",
            "bestFor": "Digital nomads, remote workers, and anyone seeking the best nomad infrastructure in South America",
            "pros": ["Best coworking", "Great parks", "Nomad community", "Endless dining"],
            "cons": ["Touristy", "Higher prices", "Can feel like an expat bubble"],
            "lat": -34.5875,
            "lng": -58.4275,
            "priceLevel": "$$$"
        },
        {
            "name": "Recoleta",
            "tagline": "French architecture and cultural sophistication",
            "description": "Recoleta seamlessly marries class and charm with French-influenced architecture and tree-lined streets. Buenos Aires' cultural center hosts free concerts, art exhibits, and dance shows. It's upscale, safe, and close to main attractions - the swankier choice for discerning nomads.",
            "vibe": "Upscale & Cultural",
            "bestFor": "Professionals seeking safety, culture, and a more sophisticated Buenos Aires experience",
            "pros": ["Safest area", "Beautiful architecture", "Cultural events", "Central location"],
            "cons": ["More expensive", "Less local vibe", "Older crowd"],
            "lat": -34.5889,
            "lng": -58.3939,
            "priceLevel": "$$$"
        },
        {
            "name": "San Telmo",
            "tagline": "Cobblestones, tango, and bohemian soul",
            "description": "Buenos Aires' oldest neighborhood is also one of its most charming. Cobbled streets, antique shops, historic mansions, and a massive indoor market create bohemian magic. Ideal for creatives and writers - the artsy, relaxed atmosphere fuels inspiration.",
            "vibe": "Bohemian & Historic",
            "bestFor": "Creatives, writers, and those who value atmosphere and history over convenience",
            "pros": ["Historic charm", "Artsy vibe", "Great antiques", "More affordable than Palermo"],
            "cons": ["Less safe at night", "Fewer modern cafes", "Can feel touristy Sundays"],
            "lat": -34.6214,
            "lng": -58.3731,
            "priceLevel": "$$"
        },
        {
            "name": "Villa Crespo",
            "tagline": "Palermo's authentic neighbor at half the price",
            "description": "Villa Crespo attracts nomads looking for authentic, less touristy Buenos Aires. Quiet streets, independent cafés, creative studios, and cultural spaces create an ideal environment for focused work. Compared to Palermo, rent and cost of living are significantly more affordable.",
            "vibe": "Authentic & Affordable",
            "bestFor": "Budget nomads, long-term stayers, and those seeking real porteño life",
            "pros": ["Much cheaper", "Authentic feel", "Quiet for work", "Near Palermo"],
            "cons": ["Less exciting", "Fewer tourists services", "Basic amenities"],
            "lat": -34.5986,
            "lng": -58.4392,
            "priceLevel": "$"
        },
        {
            "name": "Chacarita",
            "tagline": "BA's trendiest up-and-comer for those in the know",
            "description": "Chacarita is a growing extension of Palermo - home to the trendiest vermouth bars, corner cafes, and innovative restaurants in the city right now. Yet the streets remain calm and quiet with a strong residential feel. Early adopters are already here.",
            "vibe": "Emerging & Trendy",
            "bestFor": "Trend-seekers, foodies, and nomads wanting Palermo quality before Palermo prices arrive",
            "pros": ["Cutting-edge food scene", "Quiet streets", "Still affordable", "Local vibe"],
            "cons": ["Still developing", "Fewer cafes to work from", "Further from center"],
            "lat": -34.5847,
            "lng": -58.4544,
            "priceLevel": "$$"
        }
    ],

    "hochiminhcity": [
        {
            "name": "District 1",
            "tagline": "Saigon's beating heart where everything happens",
            "description": "District 1 is the center for all financial, commercial, and administrative activity in Ho Chi Minh City. Rooftop bars, colonial architecture, Ben Thanh Market, and international restaurants cluster here. Perfect for short stays and newcomers who want walkable city life.",
            "vibe": "Central & Dynamic",
            "bestFor": "Short-term nomads, newcomers, and those who thrive on walkable urban energy",
            "pros": ["Central to everything", "Walkable", "Vibrant nightlife", "International options"],
            "cons": ["Most expensive", "Noisy and chaotic", "Tourist-heavy"],
            "lat": 10.7769,
            "lng": 106.7009,
            "priceLevel": "$$$"
        },
        {
            "name": "District 3",
            "tagline": "Leafy streets and the best bánh mì in town",
            "description": "District 3 is considered by many the ideal place to live in Saigon. Close to District 1's action but with leafy, tree-lined streets, classic French villas, and a more relaxed, authentic Vietnamese atmosphere. The bánh mì here is legendary.",
            "vibe": "Authentic & Charming",
            "bestFor": "Long-term nomads seeking authentic Vietnam with D1 proximity",
            "pros": ["Leafy streets", "Authentic vibe", "Great food", "10-15% cheaper than D1"],
            "cons": ["Less nightlife", "Fewer coworking spaces", "Language barrier"],
            "lat": 10.7840,
            "lng": 106.6848,
            "priceLevel": "$$"
        },
        {
            "name": "Thao Dien",
            "tagline": "Saigon's expat island with riverside cafes",
            "description": "Thao Dien is the main expat neighborhood - it acts and feels like an island, divided by the Saigon River or highway. Leafy streets, riverside cafés, and international schools blend global comforts with local charm. The community is established and welcoming.",
            "vibe": "Expat & Comfortable",
            "bestFor": "Families, long-term expats, and nomads prioritizing comfort and community",
            "pros": ["Strong expat community", "Great cafes", "International schools", "Quieter"],
            "cons": ["30-45 min to D1 in traffic", "Can feel isolated", "Expat bubble"],
            "lat": 10.8031,
            "lng": 106.7390,
            "priceLevel": "$$"
        },
        {
            "name": "Binh Thanh",
            "tagline": "Best of both worlds between D1 and Thao Dien",
            "description": "Sandwiched between Districts 1 and 2, Binh Thanh offers best of both worlds for budget-conscious nomads. The strategic location (5-10 minutes to D1 and Thao Dien) makes it ideal. Home to Landmark 81, Vietnam's tallest building, and popular among English teachers and nomads.",
            "vibe": "Strategic & Affordable",
            "bestFor": "Budget nomads, young professionals, and couples wanting value with access",
            "pros": ["Great location", "Most affordable central option", "Modern high-rises", "Good transport"],
            "cons": ["Less character", "Busy streets", "Developing infrastructure"],
            "lat": 10.8011,
            "lng": 106.7102,
            "priceLevel": "$"
        },
        {
            "name": "District 7 (Phu My Hung)",
            "tagline": "Singapore-style planned living in South Saigon",
            "description": "District 7's Phu My Hung is a planned urban area offering low crime, clean streets, and peaceful environment. It feels more like Singapore than Vietnam - ideal for families and anyone seeking peace of mind. International supermarkets and schools abound.",
            "vibe": "Modern & Planned",
            "bestFor": "Families, safety-focused nomads, and those who value order over chaos",
            "pros": ["Very safe", "Clean and organized", "Family-friendly", "Modern amenities"],
            "cons": ["Far from center", "Less authentic", "Can feel sterile"],
            "lat": 10.7285,
            "lng": 106.7180,
            "priceLevel": "$$"
        }
    ],

    "singapore": [
        {
            "name": "Tiong Bahru",
            "tagline": "Art deco charm meets hipster coffee culture",
            "description": "Tiong Bahru is one of Singapore's oldest residential areas, now its most charming for nomads. Art deco buildings, a hipster vibe, cool cafes, and quiet spots to work create the perfect blend. The famous wet market and laid-back atmosphere make it uniquely livable.",
            "vibe": "Hipster & Charming",
            "bestFor": "Creatives, coffee lovers, and nomads seeking Singapore's most characterful neighborhood",
            "pros": ["Unique character", "Great cafes", "Quiet atmosphere", "Good transport"],
            "cons": ["Higher rents", "Limited nightlife", "Smaller area"],
            "lat": 1.2847,
            "lng": 103.8323,
            "priceLevel": "$$$"
        },
        {
            "name": "Tanjong Pagar",
            "tagline": "CBD convenience with heritage shophouse soul",
            "description": "Tanjong Pagar is within walking distance of Singapore's CBD, catering to corporate lifestyles. But the heritage shophouses, restaurants, and cocktail bars give it soul. Perfect for solo nomads who want to maximize productivity then reward themselves with great nightlife.",
            "vibe": "Professional & Vibrant",
            "bestFor": "Solo nomads, business travelers, and those who work hard and play hard",
            "pros": ["Near CBD", "Great nightlife", "Heritage charm", "Restaurants galore"],
            "cons": ["Expensive", "Crowded evenings", "Limited green space"],
            "lat": 1.2753,
            "lng": 103.8426,
            "priceLevel": "$$$"
        },
        {
            "name": "Holland Village",
            "tagline": "Singapore's original expat favorite with village vibes",
            "description": "Holland Village is Singapore's most established expat neighborhood - a cultural melting pot with laid-back vibes that contrast with the city's hustle. Excellent schools, markets, entertainment, restaurants, and green spaces make it ideal for families and long-term stays.",
            "vibe": "Expat & Family-Friendly",
            "bestFor": "Families, couples, and nomads seeking established expat community with village feel",
            "pros": ["Community feel", "Great schools", "Good restaurants", "Green spaces"],
            "cons": ["Further from center", "Higher family rents", "Can feel suburban"],
            "lat": 1.3108,
            "lng": 103.7957,
            "priceLevel": "$$"
        },
        {
            "name": "Kampong Glam",
            "tagline": "Arab Street heritage meets creative energy",
            "description": "Kampong Glam showcases Singapore's Malay heritage in colorful shophouses around Arab Street and Haji Lane. The creative energy, street art, boutiques, and cafes attract a younger crowd. It's one of Singapore's most Instagram-worthy neighborhoods with substance to match.",
            "vibe": "Creative & Cultural",
            "bestFor": "Creatives, culture lovers, and nomads seeking Singapore's most colorful neighborhood",
            "pros": ["Unique character", "Great cafes", "Cultural heritage", "Walkable"],
            "cons": ["Touristy streets", "Limited housing", "Can be crowded"],
            "lat": 1.3019,
            "lng": 103.8593,
            "priceLevel": "$$"
        },
        {
            "name": "East Coast",
            "tagline": "Beach life and hawker food in Singapore's laid-back east",
            "description": "East Coast offers something rare in Singapore - beach access and space. The park's cycling paths, hawker centers, and seafood restaurants create a more relaxed lifestyle. Popular with families and those willing to trade CBD access for quality of life.",
            "vibe": "Beachy & Relaxed",
            "bestFor": "Families, fitness enthusiasts, and nomads who need beach and green space",
            "pros": ["Beach access", "Great hawker food", "More space", "Relaxed vibe"],
            "cons": ["Far from center", "Need transport", "Less urban energy"],
            "lat": 1.3049,
            "lng": 103.9300,
            "priceLevel": "$$"
        }
    ],

    "taipei": [
        {
            "name": "Xinyi",
            "tagline": "Taipei 101 and neon nights in the modern heart",
            "description": "Xinyi is Taipei's modern heart - if you want a neighborhood alive at night with skyscrapers, lights, and crowds, this is it. Home to Taipei 101, expat bars, clubs, and networking events around ATT 4 FUN. The financial district by day, entertainment hub by night.",
            "vibe": "Modern & Vibrant",
            "bestFor": "Professionals, nightlife lovers, and nomads who want Taipei's most dynamic energy",
            "pros": ["Iconic location", "Great nightlife", "Modern amenities", "Business networking"],
            "cons": ["Most expensive", "Can feel corporate", "Crowded"],
            "lat": 25.0330,
            "lng": 121.5654,
            "priceLevel": "$$$"
        },
        {
            "name": "Da'an",
            "tagline": "Parks, night markets, and Taipei's most livable district",
            "description": "Da'an District blends local charm with modern conveniences - traditional markets like Tonghua Night Market, green spaces like Da'an Forest Park, and plenty of coworking options including FutureWard. It's Taipei's most livable neighborhood for good reason.",
            "vibe": "Livable & Balanced",
            "bestFor": "Long-term nomads, families, and anyone seeking Taipei's best quality of life",
            "pros": ["Great parks", "Night markets", "Livable", "Central location"],
            "cons": ["Higher rents", "Can feel residential", "Less exciting nightlife"],
            "lat": 25.0265,
            "lng": 121.5436,
            "priceLevel": "$$"
        },
        {
            "name": "Zhongshan",
            "tagline": "Taipei's trendiest district for cafe-hopping nomads",
            "description": "Zhongshan strikes a perfect balance between business and leisure. It's Taipei's trendiest district with cool cafes, boutique shops, and second-hand stores hidden in charming side-streets. The Japanese colonial-era architecture adds character, and it's more affordable than neighbors.",
            "vibe": "Trendy & Hip",
            "bestFor": "Creatives, cafe lovers, and nomads seeking trendy vibes at reasonable prices",
            "pros": ["Trendy cafes", "Great shopping", "Affordable", "Good transport"],
            "cons": ["Can be crowded", "Tourist areas", "Smaller apartments"],
            "lat": 25.0527,
            "lng": 121.5206,
            "priceLevel": "$$"
        },
        {
            "name": "Shilin",
            "tagline": "Night market fame and National Palace Museum culture",
            "description": "Shilin is best known for Taiwan's biggest night market, but beyond the crowds, it's a solid residential neighborhood. The National Palace Museum, upscale dining options, and MRT access make it worth considering for nomads who prefer something away from downtown.",
            "vibe": "Local & Cultural",
            "bestFor": "Budget nomads, culture lovers, and those who want famous night market access",
            "pros": ["Famous night market", "Cultural attractions", "More affordable", "Local vibe"],
            "cons": ["Further from center", "Busy nights", "Less coworking"],
            "lat": 25.0879,
            "lng": 121.5249,
            "priceLevel": "$"
        },
        {
            "name": "Songshan",
            "tagline": "Raohe Night Market and the creative Songshan district",
            "description": "Songshan combines one of Taipei's best night markets (Raohe) with the creative Songshan Cultural Park. It's emerging as a favorite for nomads seeking authenticity - local neighborhoods, good transport, and that perfect balance of convenience and character.",
            "vibe": "Authentic & Emerging",
            "bestFor": "Nomads seeking authentic Taipei with good infrastructure and night market access",
            "pros": ["Great night market", "Creative spaces", "Good value", "Authentic feel"],
            "cons": ["Less trendy", "Fewer cafes", "Developing area"],
            "lat": 25.0499,
            "lng": 121.5569,
            "priceLevel": "$"
        }
    ]
}


def load_city_content():
    """Load CITY_CONTENT from generate_city_pages.js"""
    with open('generate_city_pages.js', 'r', encoding='utf-8') as f:
        content = f.read()
    return content


def update_neighborhoods(content, city_id, neighborhoods):
    """Update or add neighborhoods for a specific city in CITY_CONTENT"""
    # Pattern to find the city's content block
    # Look for "city_id": { ... } pattern
    city_pattern = rf'("{city_id}":\s*\{{[^}}]*?"neighborhoods":\s*\[)[^\]]*\]'

    # Check if city has neighborhoods array
    if re.search(city_pattern, content, re.DOTALL):
        # Replace existing neighborhoods
        neighborhoods_json = json.dumps(neighborhoods, indent=6)
        # Remove the outer brackets for replacement
        neighborhoods_json = neighborhoods_json[1:-1].strip()
        content = re.sub(
            city_pattern,
            lambda m: m.group(1) + '\n      ' + neighborhoods_json + '\n    ]',
            content,
            flags=re.DOTALL
        )
    else:
        # Add neighborhoods array to city that doesn't have it
        # Find the city block and add neighborhoods before the closing }
        city_block_pattern = rf'("{city_id}":\s*\{{)([\s\S]*?)(\n  \}})'

        def add_neighborhoods(match):
            neighborhoods_json = json.dumps(neighborhoods, indent=6)
            # Indent properly
            neighborhoods_json = neighborhoods_json.replace('\n', '\n    ')
            return match.group(1) + match.group(2) + ',\n    "neighborhoods": ' + neighborhoods_json + match.group(3)

        content = re.sub(city_block_pattern, add_neighborhoods, content)

    return content


def main():
    print("Loading generate_city_pages.js...")
    content = load_city_content()

    updated_count = 0
    for city_id, neighborhoods in REAL_NEIGHBORHOODS.items():
        print(f"Updating {city_id} with {len(neighborhoods)} real neighborhoods...")
        content = update_neighborhoods(content, city_id, neighborhoods)
        updated_count += 1

    print(f"\nWriting updates for {updated_count} cities...")
    with open('generate_city_pages.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Done! Now run: node scripts/generate_city_pages.js")


if __name__ == "__main__":
    main()

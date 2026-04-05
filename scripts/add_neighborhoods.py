#!/usr/bin/env python3
"""Add neighborhood data to cities in generate_city_pages.js"""

import re
import json

# Neighborhood data for major nomad cities
NEIGHBORHOODS = {
    "bangkok": [
        {
            "name": "Sukhumvit (Thong Lo / Ekkamai)",
            "tagline": "The expat playground where East meets West",
            "description": "Sukhumvit's Thong Lo and Ekkamai areas are Bangkok's most polished neighborhoods for nomads. Japanese restaurants, rooftop bars, and boutique gyms line the streets. It's expensive by Thai standards but offers the comforts of home with excellent BTS access.",
            "vibe": "Upscale & International",
            "bestFor": "High earners, foodies, and those who want Western comforts with Thai convenience",
            "pros": ["Best restaurants and nightlife", "Excellent BTS connectivity", "Many coworking spaces", "English widely spoken"],
            "cons": ["Most expensive area", "Can feel less 'Thai'", "Traffic is brutal", "Crowded during rush hour"],
            "lat": 13.7300,
            "lng": 100.5850,
            "priceLevel": "$$$"
        },
        {
            "name": "Ari",
            "tagline": "The hipster haven with a village soul",
            "description": "Ari has quietly become Bangkok's coolest neighborhood. Tree-lined streets, indie coffee shops, and a thriving creative scene make it feel like a small town within the chaos. It's where young Thai professionals and savvy nomads escape the Sukhumvit madness.",
            "vibe": "Hip & Creative",
            "bestFor": "Creatives, coffee lovers, and those seeking authentic Bangkok with a modern twist",
            "pros": ["Best cafe scene in Bangkok", "Quieter, greener streets", "Good value for quality", "Strong local character"],
            "cons": ["Limited nightlife options", "Fewer coworking spaces", "Only one BTS station", "Less English spoken"],
            "lat": 13.7850,
            "lng": 100.5450,
            "priceLevel": "$$"
        },
        {
            "name": "Silom / Sathorn",
            "tagline": "Bangkok's business heart with hidden gems",
            "description": "The CBD by day transforms into a diverse playground by night. Silom offers everything from street food markets to rooftop bars with skyline views. It's well-connected, packed with serviced apartments, and has Bangkok's best mix of work and play.",
            "vibe": "Business & Diverse",
            "bestFor": "Business travelers, LGBTQ+ nomads, and those who want premium without pretense",
            "pros": ["Central location", "Great transport links", "Diverse nightlife", "Many serviced apartments"],
            "cons": ["Very busy during work hours", "Less residential feel", "Can feel corporate", "Limited green space"],
            "lat": 13.7250,
            "lng": 100.5300,
            "priceLevel": "$$$"
        },
        {
            "name": "On Nut",
            "tagline": "The budget nomad's best-kept secret",
            "description": "One stop past the tourist zone, On Nut delivers authentic Bangkok at a fraction of the price. Local markets, excellent street food, and a growing nomad community make it the smart choice for long-term stays. Tesco Lotus and Big C keep you stocked.",
            "vibe": "Local & Affordable",
            "bestFor": "Budget nomads, long-term stayers, and those who want real Thai life",
            "pros": ["Much cheaper than Thong Lo", "Great local food", "Still on BTS line", "Growing nomad scene"],
            "cons": ["Less polished", "Fewer Western options", "Limited nightlife", "Further from center"],
            "lat": 13.7050,
            "lng": 100.6000,
            "priceLevel": "$"
        },
        {
            "name": "Rattanakosin (Old Town)",
            "tagline": "History and chaos in perfect harmony",
            "description": "Bangkok's historic heart around the Grand Palace and Khao San Road is an adventure. Backpackers mix with monks, ancient temples neighbor rooftop bars, and the Chao Phraya River provides escape routes. Not for everyone, but unforgettable.",
            "vibe": "Historic & Backpacker",
            "bestFor": "Culture seekers, budget travelers, and those who prioritize experience over comfort",
            "pros": ["Cheapest accommodation", "Most character and history", "River access", "Walking distance to attractions"],
            "cons": ["No BTS access", "Can be very touristy", "Basic amenities", "Noisy near Khao San"],
            "lat": 13.7520,
            "lng": 100.4920,
            "priceLevel": "$"
        }
    ],
    "bali": [
        {
            "name": "Canggu",
            "tagline": "Where every nomad eventually ends up",
            "description": "Canggu is the undisputed capital of digital nomad life in Bali. Beach clubs, Instagram cafes, and coworking spaces line the streets. It's a bubble, yes, but a very comfortable one. You'll make friends within days and wonder why you ever lived anywhere else.",
            "vibe": "Nomad Paradise",
            "bestFor": "First-time Bali nomads, entrepreneurs, and anyone who wants an instant community",
            "pros": ["Biggest nomad community", "Best coworking spaces", "Great surf and beaches", "Endless social events"],
            "cons": ["Very crowded and touristy", "Traffic is terrible", "Prices keep rising", "Can feel like a bubble"],
            "lat": -8.6500,
            "lng": 115.1300,
            "priceLevel": "$$$"
        },
        {
            "name": "Ubud",
            "tagline": "Find yourself among the rice terraces",
            "description": "Ubud trades beaches for rice paddies and beach clubs for yoga studios. It's Bali's spiritual heart—quieter, greener, and more introspective. Perfect for focused deep work, wellness retreats, or escaping Canggu's chaos while staying connected.",
            "vibe": "Spiritual & Peaceful",
            "bestFor": "Wellness seekers, writers, and those who need quiet focus time",
            "pros": ["Stunning natural beauty", "Strong wellness scene", "Quieter and cooler", "Lower costs than Canggu"],
            "cons": ["No beach access", "Limited nightlife", "Can feel isolated", "Monkey forest monkeys steal things"],
            "lat": -8.5069,
            "lng": 115.2625,
            "priceLevel": "$$"
        },
        {
            "name": "Seminyak",
            "tagline": "Upscale beach vibes without the backpacker scene",
            "description": "Seminyak is Canggu's more polished older sibling. Better restaurants, fancier beach clubs, and a more mature crowd. It's where you go when you want the Bali lifestyle with a bit more sophistication and a bit less chaos.",
            "vibe": "Upscale Beach",
            "bestFor": "Higher earners, couples, and those who prefer quality over quantity",
            "pros": ["Best restaurants in Bali", "Beautiful beaches", "More sophisticated vibe", "Good infrastructure"],
            "cons": ["Expensive", "Less nomad-focused", "Traffic problems", "Fewer coworking spaces"],
            "lat": -8.6900,
            "lng": 115.1680,
            "priceLevel": "$$$"
        },
        {
            "name": "Sanur",
            "tagline": "The calm alternative for focused work",
            "description": "Sanur is Bali's original tourist area, now a peaceful alternative to the west coast madness. Wide beaches, calm waters, and a relaxed pace make it perfect for families and nomads who actually want to get work done.",
            "vibe": "Relaxed & Family-friendly",
            "bestFor": "Families, long-term stayers, and anyone tired of the Canggu scene",
            "pros": ["Quiet and peaceful", "Calm swimming beaches", "Good value for money", "Less crowded"],
            "cons": ["Limited nightlife", "Fewer nomads", "Can feel sleepy", "Further from Canggu/Ubud scene"],
            "lat": -8.6930,
            "lng": 115.2620,
            "priceLevel": "$$"
        },
        {
            "name": "Uluwatu",
            "tagline": "Surf, cliffs, and sunset temples",
            "description": "Uluwatu sits on Bali's southern tip, offering dramatic clifftop views and world-class surf breaks. It's more spread out and requires a scooter, but the payoff is spectacular sunsets, fewer crowds, and some of Bali's most stunning scenery.",
            "vibe": "Surf & Scenic",
            "bestFor": "Surfers, photographers, and those who don't mind being off the beaten path",
            "pros": ["Best surf in Bali", "Incredible sunsets", "Less crowded", "Stunning cliffs"],
            "cons": ["Requires scooter", "Very spread out", "Limited amenities", "Fewer cafes and coworking"],
            "lat": -8.8290,
            "lng": 115.0850,
            "priceLevel": "$$"
        }
    ],
    "medellin": [
        {
            "name": "El Poblado",
            "tagline": "The gringo trail for good reason",
            "description": "El Poblado is where 90% of nomads land, and honestly, it's hard to argue with. Leafy streets, great restaurants, and a walkable layout make it the obvious choice. Yes, it's a bubble. Yes, you'll mostly meet other foreigners. But what a comfortable bubble it is.",
            "vibe": "Expat Central",
            "bestFor": "First-time visitors, safety-conscious nomads, and those who want the easiest landing",
            "pros": ["Safest neighborhood", "Best restaurants and nightlife", "Walking distance to everything", "Easy to meet people"],
            "cons": ["Most expensive area", "Gringo prices common", "Less authentic", "Can feel touristy"],
            "lat": 6.2100,
            "lng": -75.5700,
            "priceLevel": "$$$"
        },
        {
            "name": "Laureles",
            "tagline": "The local favorite with nomad approval",
            "description": "Laureles is where savvy nomads graduate to after their El Poblado phase. It's more Colombian—local families, neighborhood parks, and genuine tascas. Better value, better Spanish practice, and increasingly good cafes without the Poblado markup.",
            "vibe": "Local & Authentic",
            "bestFor": "Spanish learners, budget-conscious nomads, and those seeking more authentic vibes",
            "pros": ["Much better value", "More authentic Colombian life", "Great local restaurants", "Growing cafe scene"],
            "cons": ["Less English spoken", "Fewer fancy options", "Nightlife requires taxi to Poblado", "Takes time to find the gems"],
            "lat": 6.2450,
            "lng": -75.5950,
            "priceLevel": "$$"
        },
        {
            "name": "Envigado",
            "tagline": "Suburban charm with city access",
            "description": "Technically its own municipality, Envigado offers a quieter alternative just south of El Poblado. It's where Colombian families live, with excellent parks, safer streets, and easy metro access. Perfect for long-term stays when you want space.",
            "vibe": "Residential & Safe",
            "bestFor": "Long-term stayers, families, and those who prioritize space and safety",
            "pros": ["Very safe and quiet", "Excellent parks", "Good metro connection", "More space for less money"],
            "cons": ["Fewer nightlife options", "Less walkable", "Can feel suburban", "Requires more Spanish"],
            "lat": 6.1700,
            "lng": -75.5830,
            "priceLevel": "$$"
        },
        {
            "name": "Provenza",
            "tagline": "El Poblado's trendiest corner",
            "description": "Provenza is the most happening part of El Poblado—a few blocks of concentrated cool. Trendy restaurants, rooftop bars, and the city's best people-watching. It's pricey and crowded, but if you want to be where the action is, this is it.",
            "vibe": "Trendy & Social",
            "bestFor": "Social butterflies, nightlife lovers, and those with higher budgets",
            "pros": ["Best nightlife and restaurants", "Very walkable", "Easy to meet people", "Trendy atmosphere"],
            "cons": ["Most expensive", "Very noisy at night", "Crowded streets", "Tourist prices everywhere"],
            "lat": 6.2080,
            "lng": -75.5680,
            "priceLevel": "$$$"
        },
        {
            "name": "Manila / Estadio",
            "tagline": "Up-and-coming with metro convenience",
            "description": "This central area near the football stadium is becoming a nomad favorite. Metro access makes getting around easy, emerging cafes pop up regularly, and you're between Laureles and Poblado. It's Medellin's next big thing.",
            "vibe": "Central & Emerging",
            "bestFor": "Explorers, metro commuters, and those who want to discover before others do",
            "pros": ["Metro access", "Growing scene", "Good central location", "More affordable"],
            "cons": ["Less established", "Fewer amenities currently", "Can feel transitional", "Less polished"],
            "lat": 6.2350,
            "lng": -75.5750,
            "priceLevel": "$$"
        }
    ],
    "chiangmai": [
        {
            "name": "Nimman (Nimmanhaemin)",
            "tagline": "The original nomad neighborhood",
            "description": "Nimman is where the Chiang Mai nomad scene began and where it still centers. Every third building is a cafe, coworking spaces are everywhere, and you'll see more laptops than anywhere in Thailand. It's a bubble, but a productive one.",
            "vibe": "Hipster & Nomad",
            "bestFor": "First-time nomads, coffee addicts, and anyone who wants the classic Chiang Mai experience",
            "pros": ["Best cafe density in Asia", "Many coworking spaces", "Walking distance to Maya Mall", "Easy to meet nomads"],
            "cons": ["Tourist prices", "Can feel repetitive", "Loud traffic on main roads", "Less authentic Thai"],
            "lat": 18.7970,
            "lng": 98.9680,
            "priceLevel": "$$$"
        },
        {
            "name": "Old City",
            "tagline": "Ancient walls, timeless charm",
            "description": "Inside the moat, Chiang Mai's historic Old City offers temple views from your balcony and monk processions at dawn. It's more peaceful than Nimman, more atmospheric, and puts you at the heart of Lanna culture. Sunday Walking Street is unmissable.",
            "vibe": "Historic & Cultural",
            "bestFor": "Culture lovers, photographers, and those who want temples over trendy cafes",
            "pros": ["Beautiful temples everywhere", "Rich cultural atmosphere", "Sunday Walking Street", "Quieter than Nimman"],
            "cons": ["Fewer cafes and coworking", "Can feel touristy", "Limited nightlife", "Some areas very quiet at night"],
            "lat": 18.7870,
            "lng": 98.9880,
            "priceLevel": "$$"
        },
        {
            "name": "Santitham",
            "tagline": "Local life at Nimman's doorstep",
            "description": "Just north of Nimman, Santitham delivers the local experience. Thai families, morning markets, and authentic street food—all within walking distance of Nimman's cafes. It's the smart choice for nomads who want both worlds.",
            "vibe": "Local & Convenient",
            "bestFor": "Long-term stayers, Thai food lovers, and those who want authenticity near amenities",
            "pros": ["Great local markets", "Much cheaper than Nimman", "Walking distance to cafes", "Authentic Thai neighborhood"],
            "cons": ["Less polished", "Fewer English menus", "Basic accommodations", "Quieter nightlife"],
            "lat": 18.8050,
            "lng": 98.9750,
            "priceLevel": "$"
        },
        {
            "name": "Chang Phueak",
            "tagline": "Student vibes and night market eats",
            "description": "North of the moat, Chang Phueak is home to Chiang Mai University students and the famous North Gate night market. It's youthful, affordable, and has some of the best street food in the city. The vibe is more local than tourist.",
            "vibe": "Student & Foodie",
            "bestFor": "Budget travelers, foodies, and those seeking younger, local energy",
            "pros": ["Best street food", "Very affordable", "Near CMU campus", "Local atmosphere"],
            "cons": ["Further from Nimman cafes", "Basic infrastructure", "Less English spoken", "Can feel student-heavy"],
            "lat": 18.8020,
            "lng": 98.9830,
            "priceLevel": "$"
        },
        {
            "name": "Hang Dong",
            "tagline": "Space, nature, and serious focus",
            "description": "South of the city, Hang Dong offers what urban Chiang Mai can't: space. Larger apartments, mountain views, and total quiet make it perfect for focused work. You'll need transport, but you'll finally have room to breathe.",
            "vibe": "Suburban & Peaceful",
            "bestFor": "Remote workers needing quiet, couples, and those with their own transport",
            "pros": ["Very quiet and spacious", "Mountain views", "Great value apartments", "Near nature"],
            "cons": ["Requires scooter/car", "Far from social scene", "Limited restaurants", "Can feel isolated"],
            "lat": 18.7280,
            "lng": 98.9200,
            "priceLevel": "$"
        }
    ],
    "mexicocity": [
        {
            "name": "Roma Norte",
            "tagline": "The undisputed king of CDMX nomad life",
            "description": "Roma Norte has it all: tree-lined streets, art deco architecture, and the highest concentration of excellent cafes and restaurants in Mexico. Every creative professional in the city gravitates here. It's expensive by Mexican standards but delivers world-class quality.",
            "vibe": "Creative & Cosmopolitan",
            "bestFor": "Foodies, creatives, and anyone who wants the best of CDMX walkable experience",
            "pros": ["Best restaurants and cafes", "Beautiful architecture", "Very walkable", "Strong nomad community"],
            "cons": ["Most expensive neighborhood", "Very popular (crowded)", "Gentrification concerns", "Can feel touristy"],
            "lat": 19.4180,
            "lng": -99.1630,
            "priceLevel": "$$$"
        },
        {
            "name": "Condesa",
            "tagline": "Leafy parks and laid-back luxury",
            "description": "Roma's more relaxed neighbor, Condesa centers around two beautiful parks and offers a slightly quieter alternative. Art nouveau buildings, dog-walkers, and outdoor cafes give it an almost European feel. It's polished without being pretentious.",
            "vibe": "Upscale & Green",
            "bestFor": "Park lovers, those with dogs, and nomads who want Roma quality with more breathing room",
            "pros": ["Beautiful parks", "Quieter than Roma", "Excellent restaurants", "Very safe"],
            "cons": ["Expensive", "Less nightlife than Roma", "Can feel sleepy", "Competitive apartment market"],
            "lat": 19.4120,
            "lng": -99.1740,
            "priceLevel": "$$$"
        },
        {
            "name": "Coyoacan",
            "tagline": "Frida Kahlo's neighborhood still inspires",
            "description": "In the south, Coyoacan feels like a village within the city. Cobblestone streets, the famous Frida Kahlo museum, and a bohemian artistic heritage attract a different crowd. It's more Mexican, more historic, and increasingly popular with nomads seeking authenticity.",
            "vibe": "Bohemian & Historic",
            "bestFor": "Culture seekers, artists, and those who prefer authenticity over trendiness",
            "pros": ["Rich cultural history", "Beautiful plazas", "More authentic Mexican", "Great for UNAM students"],
            "cons": ["Far from Roma/Condesa", "Fewer modern cafes", "Limited nightlife", "Requires metro/Uber to reach other areas"],
            "lat": 19.3500,
            "lng": -99.1620,
            "priceLevel": "$$"
        },
        {
            "name": "Juarez",
            "tagline": "Roma's edgier, more affordable sibling",
            "description": "Just west of Roma, Juarez offers similar walkability at lower prices. It's grittier, more diverse, and increasingly home to galleries and creative spaces. The best tacos in the city might be here, along with CDMX's LGBTQ+ scene.",
            "vibe": "Diverse & Emerging",
            "bestFor": "Budget-conscious nomads, LGBTQ+ travelers, and those who like discovering emerging areas",
            "pros": ["More affordable than Roma", "Great street food", "LGBTQ+ friendly", "Walking distance to Roma"],
            "cons": ["Grittier streets", "Less polished", "More noise and traffic", "Some areas less safe at night"],
            "lat": 19.4250,
            "lng": -99.1580,
            "priceLevel": "$$"
        },
        {
            "name": "Polanco",
            "tagline": "Luxury living with world-class museums",
            "description": "Polanco is CDMX's most upscale neighborhood—think Beverly Hills with better museums. Chapultepec Park provides green space, and Masaryk Avenue delivers luxury shopping. It's expensive but offers unmatched safety and quality.",
            "vibe": "Luxury & Safe",
            "bestFor": "High earners, families, and those who prioritize safety and quality above all",
            "pros": ["Safest neighborhood", "Near Chapultepec Park", "World-class museums", "Excellent restaurants"],
            "cons": ["Very expensive", "Less walkable to other neighborhoods", "Can feel corporate", "Less authentic Mexican"],
            "lat": 19.4330,
            "lng": -99.1950,
            "priceLevel": "$$$"
        }
    ],
    "tokyo": [
        {
            "name": "Shibuya",
            "tagline": "The crossing that leads everywhere",
            "description": "Shibuya is Tokyo's beating heart—the famous crossing, Shibuya Sky views, and endless entertainment. For nomads, it offers excellent coworking, great cafes, and the energy that defines Tokyo. It's expensive and intense, but undeniably exciting.",
            "vibe": "Energetic & Central",
            "bestFor": "First-time visitors, those who want to be in the center of everything, nightlife lovers",
            "pros": ["Most central location", "Excellent transport hub", "Endless entertainment", "Many coworking options"],
            "cons": ["Very expensive", "Extremely crowded", "Can be overwhelming", "Noisy"],
            "lat": 35.6580,
            "lng": 139.7020,
            "priceLevel": "$$$"
        },
        {
            "name": "Shimokitazawa",
            "tagline": "Tokyo's indie soul",
            "description": "Shimokita is Tokyo's coolest neighborhood—vintage shops, live music venues, and indie cafes fill narrow streets. It's where Tokyo's creative youth hang out, and increasingly where nomads discover a more authentic, affordable Tokyo experience.",
            "vibe": "Indie & Creative",
            "bestFor": "Creatives, music lovers, and those seeking Tokyo's alternative scene",
            "pros": ["Unique character", "Great indie cafes", "More affordable", "Authentic Tokyo"],
            "cons": ["Limited coworking", "Small apartments", "Less English spoken", "Fewer amenities"],
            "lat": 35.6615,
            "lng": 139.6680,
            "priceLevel": "$$"
        },
        {
            "name": "Meguro / Nakameguro",
            "tagline": "Cherry blossoms and coffee culture",
            "description": "Along the Meguro River, this area offers Tokyo's most Instagram-worthy cherry blossoms and a refined cafe culture. It's residential, sophisticated, and popular with young professionals. A peaceful base with easy access to Shibuya.",
            "vibe": "Refined & Residential",
            "bestFor": "Design lovers, photographers, and those who want quiet sophistication",
            "pros": ["Beautiful riverside walks", "Excellent cafes", "Quieter than central", "Good train access"],
            "cons": ["Limited nightlife", "Residential feel", "Fewer coworking spaces", "Expensive apartments"],
            "lat": 35.6440,
            "lng": 139.6990,
            "priceLevel": "$$$"
        },
        {
            "name": "Shinjuku",
            "tagline": "Neon-lit chaos and endless options",
            "description": "Shinjuku is Tokyo at maximum intensity—the world's busiest station, Golden Gai's tiny bars, and Kabukicho's neon madness. It's not for everyone, but if you want to experience Tokyo's full spectrum, nowhere does it better.",
            "vibe": "Intense & Diverse",
            "bestFor": "Nightlife enthusiasts, first-timers wanting 'Tokyo experience', business travelers",
            "pros": ["Best transport hub", "Incredible nightlife", "Many hotels", "Never boring"],
            "cons": ["Very crowded", "Can feel chaotic", "Red light district nearby", "Expensive"],
            "lat": 35.6895,
            "lng": 139.6920,
            "priceLevel": "$$$"
        },
        {
            "name": "Asakusa",
            "tagline": "Old Tokyo charm by the temple",
            "description": "Asakusa around Senso-ji temple preserves old Tokyo's atmosphere. Traditional shops, riverside walks, and a slower pace offer a contrast to western Tokyo's intensity. Great value and cultural immersion, though further from modern amenities.",
            "vibe": "Traditional & Historic",
            "bestFor": "Culture lovers, budget travelers, and those seeking traditional Japan",
            "pros": ["Rich cultural atmosphere", "More affordable", "Beautiful temple area", "Local character"],
            "cons": ["Far from modern Tokyo", "Limited cafes/coworking", "Very touristy around temple", "Less English spoken"],
            "lat": 35.7115,
            "lng": 139.7970,
            "priceLevel": "$$"
        }
    ],
    "barcelona": [
        {
            "name": "El Born / La Ribera",
            "tagline": "Medieval streets meet modern cool",
            "description": "El Born is Barcelona's most charming neighborhood—narrow medieval lanes open onto artsy plazas filled with boutiques and cocktail bars. The Picasso Museum anchors the cultural scene. It's expensive but delivers old-world charm with new-world amenities.",
            "vibe": "Artsy & Historic",
            "bestFor": "Art lovers, those seeking charm, and nomads who want beauty over beach",
            "pros": ["Most beautiful architecture", "Great cocktail bars", "Cultural attractions", "Central location"],
            "cons": ["Very expensive", "Touristy", "No beach access", "Crowded streets"],
            "lat": 41.3850,
            "lng": 2.1830,
            "priceLevel": "$$$"
        },
        {
            "name": "Gracia",
            "tagline": "Village vibes in the big city",
            "description": "Gracia still feels like the independent village it once was. Plazas buzz with locals, vermouth bars fill up for aperitivo, and the August festival transforms every street. It's where Barcelona's creative class lives and works.",
            "vibe": "Bohemian & Local",
            "bestFor": "Long-term stayers, those seeking local life, and people tired of tourist areas",
            "pros": ["Strong local character", "Great plaza culture", "More affordable", "Less touristy"],
            "cons": ["Far from beach", "Limited coworking", "Hilly streets", "Can feel residential"],
            "lat": 41.4030,
            "lng": 2.1565,
            "priceLevel": "$$"
        },
        {
            "name": "Barceloneta",
            "tagline": "Beach life for the sun-obsessed",
            "description": "Barcelona's beach neighborhood delivers sand and surf steps from your door. Former fishing village character remains in narrow streets, though tourism dominates near the beach. Perfect if beach access is non-negotiable.",
            "vibe": "Beach & Casual",
            "bestFor": "Beach lovers, surfers, and those who need daily ocean access",
            "pros": ["Beach at your doorstep", "Great seafood", "Active lifestyle easy", "Unique character"],
            "cons": ["Very touristy", "Noisy in summer", "Limited coworking", "Basic apartments"],
            "lat": 41.3810,
            "lng": 2.1890,
            "priceLevel": "$$"
        },
        {
            "name": "Eixample",
            "tagline": "Gaudi's playground with room to breathe",
            "description": "Barcelona's elegant grid district showcases modernist architecture at every turn. Wide streets, beautiful buildings, and a mix of residential and commercial make it livable. Left Eixample is the LGBTQ+ center; right is more upscale.",
            "vibe": "Elegant & Spacious",
            "bestFor": "Architecture lovers, LGBTQ+ travelers (left side), those wanting space",
            "pros": ["Beautiful buildings", "Wide, organized streets", "Good apartments", "Central location"],
            "cons": ["Less charming than old town", "Can feel commercial", "Noisy main streets", "Expensive"],
            "lat": 41.3950,
            "lng": 2.1620,
            "priceLevel": "$$$"
        },
        {
            "name": "Poble Sec",
            "tagline": "The local secret under Montjuic",
            "description": "Tucked between Montjuic hill and the old town, Poble Sec offers Barcelona's best value. Local tapas bars, theater scene, and a diverse community keep it authentic. It's the neighborhood savvy nomads discover and keep quiet about.",
            "vibe": "Local & Value",
            "bestFor": "Budget-conscious nomads, tapas lovers, and those who want off-the-beaten-path",
            "pros": ["Best value in central Barcelona", "Authentic tapas bars", "Near Montjuic park", "Local atmosphere"],
            "cons": ["Less polished", "Limited fancy options", "Can feel quiet", "Fewer tourist amenities"],
            "lat": 41.3730,
            "lng": 2.1630,
            "priceLevel": "$"
        }
    ],
    "hanoi": [
        {
            "name": "Tay Ho (West Lake)",
            "tagline": "The expat oasis on the water",
            "description": "West Lake is Hanoi's most livable area for foreigners. Lakeside cafes, international restaurants, and spacious apartments attract long-term nomads. It's quieter, greener, and has the infrastructure expats need—at a premium by Hanoi standards.",
            "vibe": "Expat & Peaceful",
            "bestFor": "Long-term stayers, families, and those who want comfort over chaos",
            "pros": ["Most spacious apartments", "Lakeside walks", "Many Western restaurants", "Peaceful atmosphere"],
            "cons": ["Far from Old Quarter", "Can feel isolated", "Less authentic Vietnamese", "Grab rides needed"],
            "lat": 21.0650,
            "lng": 105.8200,
            "priceLevel": "$$$"
        },
        {
            "name": "Old Quarter",
            "tagline": "Chaos, charm, and pho at dawn",
            "description": "Hanoi's ancient commercial heart is sensory overload in the best way. Motorbikes swarm narrow streets, street food sizzles at every corner, and centuries of history layer beneath the chaos. Not for the faint-hearted, but absolutely authentic.",
            "vibe": "Historic & Intense",
            "bestFor": "Culture seekers, photographers, and those who want full Hanoi immersion",
            "pros": ["Most authentic experience", "Incredible food scene", "Walking distance to everything", "Rich history"],
            "cons": ["Very noisy", "Polluted", "Difficult navigation", "Tourist prices common"],
            "lat": 21.0340,
            "lng": 105.8500,
            "priceLevel": "$$"
        },
        {
            "name": "Ba Dinh",
            "tagline": "Embassy quiet with local prices",
            "description": "The diplomatic district offers Hanoi's most tranquil streets. Tree-lined boulevards, good Vietnamese restaurants, and easy access to Ho Chi Minh Mausoleum. It's where educated Vietnamese families live and increasingly where smart nomads settle.",
            "vibe": "Quiet & Residential",
            "bestFor": "Those seeking quiet, families, and nomads who want local life without chaos",
            "pros": ["Very quiet", "Good local restaurants", "Safe and clean", "Affordable for quality"],
            "cons": ["Less exciting", "Fewer cafes", "Limited nightlife", "Can feel sleepy"],
            "lat": 21.0370,
            "lng": 105.8220,
            "priceLevel": "$$"
        },
        {
            "name": "Hoan Kiem / French Quarter",
            "tagline": "Colonial elegance meets Vietnamese hustle",
            "description": "Around Hoan Kiem Lake, French colonial architecture meets Vietnamese street life. The opera house, luxury hotels, and the famous lake create Hanoi's most scenic area. Weekend pedestrian streets bring the city together.",
            "vibe": "Central & Historic",
            "bestFor": "First-time visitors, those who want iconic Hanoi, weekend wanderers",
            "pros": ["Most scenic area", "Central location", "Weekend walking streets", "Cultural attractions"],
            "cons": ["Expensive", "Very touristy", "Limited accommodation options", "Crowded weekends"],
            "lat": 21.0285,
            "lng": 105.8520,
            "priceLevel": "$$$"
        },
        {
            "name": "Cau Giay",
            "tagline": "Tech hub for digital natives",
            "description": "West of the center, Cau Giay is Hanoi's emerging tech and university district. New apartments, modern malls, and a younger Vietnamese crowd offer a glimpse of Hanoi's future. Great value and increasingly good infrastructure.",
            "vibe": "Modern & Emerging",
            "bestFor": "Tech workers, budget nomads, and those interested in modern Vietnam",
            "pros": ["Modern amenities", "Great value", "Near universities", "Growing scene"],
            "cons": ["Less character", "Far from tourist areas", "Limited English", "Still developing"],
            "lat": 21.0320,
            "lng": 105.7850,
            "priceLevel": "$"
        }
    ]
}

def add_neighborhoods_to_file():
    """Add neighborhood data to generate_city_pages.js"""

    with open('generate_city_pages.js', 'r', encoding='utf-8') as f:
        content = f.read()

    for city_id, neighborhoods in NEIGHBORHOODS.items():
        # Skip lisbon - already has neighborhoods
        if city_id == 'lisbon':
            continue

        # Find the city entry and add neighborhoods
        # Pattern: "city_id": { ... "categories": {
        pattern = rf'("{city_id}":\s*\{{[^}}]*?"score_description":\s*"[^"]*")'

        def add_neighborhoods(match):
            original = match.group(1)
            neighborhoods_json = json.dumps(neighborhoods, indent=6)
            # Fix indentation for nested JSON
            neighborhoods_json = neighborhoods_json.replace('\n', '\n    ')
            return original + ',\n    "neighborhoods": ' + neighborhoods_json

        new_content = re.sub(pattern, add_neighborhoods, content, count=1)

        if new_content != content:
            print(f"Added neighborhoods to {city_id}")
            content = new_content
        else:
            print(f"Could not find {city_id} in file")

    with open('generate_city_pages.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("\nDone! Neighborhoods added to cities.")

if __name__ == '__main__':
    add_neighborhoods_to_file()

#!/usr/bin/env python3
"""Update category descriptions for remaining cities with generic content."""

import re
import json
from pathlib import Path

# Manually crafted descriptions for the remaining 18 cities
CITY_DESCRIPTIONS = {
    "adelaide": {
        "climate": "Mediterranean Adelaide offers warm, dry summers and mild winters. With over 300 sunny days, it's perfect for outdoor work sessions and beach trips.",
        "cost": "Moderate costs at around $2800/month. Adelaide is more affordable than Sydney or Melbourne while offering similar quality of life.",
        "wifi": "Solid internet infrastructure in Adelaide. NBN coverage is good, cafés offer reliable connections, and coworking spaces provide fast, stable WiFi.",
        "nightlife": "Vibrant bar scene in Adelaide. Rundle Street and the West End offer craft cocktails, live music, and wine bars. Festival season transforms the city.",
        "nature": "Nature paradise around Adelaide. Wine regions, beaches, and the Adelaide Hills are all within 30 minutes. Kangaroo Island is a weekend trip away.",
        "safety": "Very safe in Adelaide. One of Australia's safest cities—walk alone at night, explore freely, and enjoy the relaxed atmosphere.",
        "food": "Excellent food scene in Adelaide! Central Market is a foodie heaven, wine regions offer gourmet experiences, and multicultural cuisines abound.",
        "community": "Growing nomad community in Adelaide. Coworking spaces are expanding, and tech meetups are regular. Smaller but welcoming scene.",
        "english": "English is the native language in Adelaide. No language barriers here—focus entirely on your work and social life.",
        "visa": "Standard Australian visa requirements. Working Holiday (417/462), student visas, or sponsored work visas. Digital nomad-specific options limited.",
        "culture": "Rich cultural scene in Adelaide. Festival State reputation is earned—Fringe, WOMADelaide, and Adelaide Festival bring world-class arts annually.",
        "cleanliness": "Very clean city in Adelaide. Well-maintained streets, excellent public spaces, and pride in urban appearance throughout.",
        "airquality": "Excellent air quality in Adelaide. Clean coastal air, minimal pollution, and fresh breezes from the sea. Breathe easy here."
    },
    "cantho": {
        "climate": "Tropical Can Tho has hot, humid weather year-round (28-35°C). Dry season (Nov-Apr) is ideal. Monsoon brings afternoon downpours May-October.",
        "cost": "Very affordable at around $800/month. Can Tho offers authentic Vietnamese prices—great food, cheap accommodation, and low transport costs.",
        "wifi": "Decent connectivity in Can Tho. Main hotels and cafés have workable speeds (20-50 Mbps). 4G coverage is reliable as backup.",
        "nightlife": "Quiet evenings in Can Tho. This is a riverside town for early mornings at floating markets, not late nights. A few local bars exist.",
        "nature": "Mekong Delta paradise around Can Tho. Floating markets, fruit orchards, rice paddies, and river life define the experience here.",
        "safety": "Very safe in Can Tho. Friendly locals, low crime, and a relaxed atmosphere. Standard precautions for motorbike traffic.",
        "food": "Excellent food in Can Tho! Fresh river fish, tropical fruits, and authentic Mekong Delta cuisine. Markets overflow with local specialties.",
        "community": "Small nomad presence in Can Tho. Pioneer territory—few digital nomads, but expat English teachers and travelers pass through.",
        "english": "Limited English in Can Tho. Translation apps essential. Younger locals may speak some English, but Vietnamese phrases help enormously.",
        "visa": "Vietnam offers 30-day visa-free for many nationalities (45 for some), extendable. E-visa (90 days) available for longer stays.",
        "culture": "Authentic Mekong culture in Can Tho. Floating markets, pagodas, and traditional river life offer genuine Vietnamese experiences.",
        "cleanliness": "Variable cleanliness in Can Tho. Main tourist areas are maintained; local neighborhoods show typical developing world conditions.",
        "airquality": "Good air quality in Can Tho. River breezes and agricultural surroundings keep air relatively clean compared to big cities."
    },
    "davao": {
        "climate": "Tropical Davao has consistent warm weather (25-32°C) year-round. Outside the typhoon belt, it enjoys more stable conditions than other Philippine cities.",
        "cost": "Very affordable at around $900/month. Davao offers excellent value—modern amenities at Philippine prices.",
        "wifi": "Good internet in Davao for the Philippines. Main areas have decent speeds (30-50 Mbps), and several coworking spaces cater to remote workers.",
        "nightlife": "Modest nightlife in Davao. Bars and restaurants exist for socializing, but this isn't a party city. Quiet evenings are the norm.",
        "nature": "Nature wonderland around Davao. Mount Apo (Philippines' highest), Philippine Eagle Center, and pristine beaches are all accessible.",
        "safety": "Very safe in Davao. Known as one of the Philippines' safest cities with strict local governance. Feel secure walking around.",
        "food": "Great food scene in Davao! Durian capital of the Philippines, plus fresh seafood, Filipino cuisine, and diverse international options.",
        "community": "Small but growing nomad scene in Davao. Coworking spaces are emerging, and the expat community is welcoming.",
        "english": "Good English in Davao. Filipinos generally speak English well—daily life, business, and socializing are easy.",
        "visa": "Philippines offers 30-day visa-free, extendable to 3 years through immigration offices. Affordable and straightforward extensions.",
        "culture": "Indigenous culture meets modern Davao. Kadayawan Festival celebrates local traditions, and museums showcase Mindanao heritage.",
        "cleanliness": "Very clean for the Philippines. Davao takes pride in cleanliness—strict anti-littering laws and well-maintained public spaces.",
        "airquality": "Good air quality in Davao. Less pollution than Manila, with sea breezes and green spaces keeping air fresh."
    },
    "jaipur": {
        "climate": "Semi-arid Jaipur has hot summers (40°C+) and pleasant winters. October-March is ideal; summer requires constant AC and heat management.",
        "cost": "Very affordable at around $700/month. Jaipur offers incredible value—palatial hotels, great food, and rich experiences for little money.",
        "wifi": "Variable internet in Jaipur. Good hotels and cafés have reliable WiFi; city-wide can be inconsistent. Mobile data provides backup.",
        "nightlife": "Limited nightlife in Jaipur. A conservative city with few late-night options. Hotel bars and rooftop restaurants offer socializing spots.",
        "nature": "Desert landscapes around Jaipur. Tiger reserves (Ranthambore), Aravalli hills, and Rajasthani wilderness offer adventure escapes.",
        "safety": "Generally safe in Jaipur. Tourist-friendly city, but stay alert in crowded areas. Solo female travelers should take extra precautions.",
        "food": "Incredible food in Jaipur! Rajasthani thalis, street chaat, rooftop dining with fort views. Vegetarian paradise with rich, spiced cuisine.",
        "community": "Small nomad presence in Jaipur. Not a digital nomad hub, but growing interest. Connect through coworking spaces and expat groups.",
        "english": "Moderate English in Jaipur. Tourism industry speaks English well; local interactions may need patience or translation help.",
        "visa": "India offers e-visa (30/90/365 days) for many nationalities. Tourist visa extendable with some bureaucracy.",
        "culture": "UNESCO World Heritage Jaipur! Pink City architecture, Amber Fort, City Palace, and living traditions make it a cultural treasure.",
        "cleanliness": "Variable cleanliness in Jaipur. Tourist areas maintained; general city cleanliness is typically Indian—some contrast expected.",
        "airquality": "Air quality challenges in Jaipur. Dust and seasonal pollution affect air quality. Check AQI during winter months especially."
    },
    "johorbahru": {
        "climate": "Tropical Johor Bahru is hot and humid year-round (27-33°C). Expect afternoon thunderstorms, especially November-January monsoon season.",
        "cost": "Affordable at around $1200/month. Much cheaper than Singapore across the causeway, with decent Malaysian prices.",
        "wifi": "Good internet in JB. Modern developments have fast WiFi, and the city's infrastructure continues improving.",
        "nightlife": "Modest nightlife in JB. Malls, restaurants, and some bars for socializing. Many residents head to Singapore for bigger nights out.",
        "nature": "Nature access from JB. Nearby islands (Desaru, Rawa), rainforest reserves, and waterfalls offer weekend escapes from the city.",
        "safety": "Generally safe in JB with standard precautions. Some areas warrant extra awareness at night. Stay alert and you'll be fine.",
        "food": "Excellent food in JB! Malaysian hawker fare, seafood restaurants, and multicultural cuisine. Great value compared to Singapore.",
        "community": "Small nomad presence in JB. Proximity to Singapore attracts some remote workers, but community is still developing.",
        "english": "Good English in JB. Malaysia's multilingual population means English is widely understood in business and service contexts.",
        "visa": "Malaysia offers 90 days visa-free for most nationalities. DE Rantau digital nomad visa available for longer stays.",
        "culture": "Multicultural JB blend. Malay, Chinese, Indian influences create diverse experiences. Heritage zones and temples worth exploring.",
        "cleanliness": "Variable cleanliness in JB. Modern areas are well-maintained; older neighborhoods show typical Malaysian urban conditions.",
        "airquality": "Variable air quality in JB. Generally okay, but haze season (June-September) can bring poor conditions from regional fires."
    },
    "khaolak": {
        "climate": "Tropical Khao Lak has hot, humid weather with a distinct monsoon season. November-April is perfect; May-October brings heavy rains.",
        "cost": "Affordable at around $1100/month. Beach town prices with Thai value—good accommodation and food without Phuket premiums.",
        "wifi": "Decent WiFi in Khao Lak. Resorts and cafés have reliable connections; speeds vary but workable for most remote work.",
        "nightlife": "Very quiet evenings in Khao Lak. This is a family beach destination, not a party scene. Early dinners and peaceful nights.",
        "nature": "Stunning nature around Khao Lak! Similan Islands (world-class diving), Khao Sok National Park, waterfalls, and pristine beaches.",
        "safety": "Very safe in Khao Lak. Peaceful beach community with minimal concerns. Typical beach town safety—watch belongings, enjoy relaxed vibes.",
        "food": "Good food in Khao Lak. Thai seafood restaurants, beachfront dining, and some international options. Fresh and affordable.",
        "community": "Minimal nomad presence in Khao Lak. Dive instructors and resort workers form the expat community. Pioneer territory for nomads.",
        "english": "Basic English in Khao Lak. Tourism industry communicates okay; deeper interactions benefit from Thai language basics.",
        "visa": "Thailand offers 60-day tourist visa, extendable to 90 days. Visa runs or longer-term LTR visa for serious stayers.",
        "culture": "Thai beach culture in Khao Lak. Tsunami memorial, local temples, and authentic southern Thai life away from tourist hordes.",
        "cleanliness": "Clean beach town in Khao Lak. Well-maintained tourist areas and beaches. Resort standards throughout the main strip.",
        "airquality": "Excellent air quality in Khao Lak. Coastal breezes, minimal traffic, and clean sea air. Refreshing change from city pollution."
    },
    "kochi": {
        "climate": "Tropical Kochi is hot and humid year-round. Monsoon (Jun-Sep) brings heavy rain but dramatic beauty. Winter months (Nov-Feb) are ideal.",
        "cost": "Very affordable at around $600/month. Kerala prices are reasonable—good food, decent accommodation, and low transport costs.",
        "wifi": "Variable internet in Kochi. Good hotels and cafés have workable WiFi; consistency can vary. Mobile data supplements well.",
        "nightlife": "Limited nightlife in Kochi. Kerala's conservative culture means few late options. Fort Kochi has artistic cafés and quiet bars.",
        "nature": "Backwater paradise near Kochi! Kerala's famous houseboat experiences, hill stations, and Periyar wildlife sanctuary are accessible.",
        "safety": "Very safe in Kochi. Kerala is known for safety and education. Relaxed atmosphere with welcoming locals.",
        "food": "Fantastic food in Kochi! Kerala seafood, Malabar cuisine, and fresh spices. Appam, fish curry, and banana chips are must-tries.",
        "community": "Small nomad presence in Kochi. Artists, Ayurveda seekers, and travelers form the community. Fort Kochi has creative energy.",
        "english": "Good English in Kochi. Kerala has high literacy and English education. Communication is easier than most of India.",
        "visa": "India offers e-visa (30/90/365 days) for many nationalities. Tourist visa extendable with some bureaucracy.",
        "culture": "Rich cultural fusion in Kochi. Chinese fishing nets, Portuguese churches, Jewish synagogue, and Kathakali dance. Living history.",
        "cleanliness": "Relatively clean for India. Kochi maintains standards above average, especially in Fort Kochi tourist areas.",
        "airquality": "Good air quality in Kochi. Coastal location and greenery keep air relatively fresh. Better than most Indian cities."
    },
    "kuching": {
        "climate": "Tropical Kuching is hot and humid year-round (23-32°C). Rain can occur any time, but monsoon (Nov-Feb) brings heavier downpours.",
        "cost": "Very affordable at around $900/month. Sarawak prices are lower than West Malaysia—excellent value for comfortable living.",
        "wifi": "Good internet in Kuching. Modern cafés and accommodations have reliable connections. Infrastructure continues improving.",
        "nightlife": "Quiet evenings in Kuching. Waterfront dining, local bars, and night markets for socializing. Not a party destination.",
        "nature": "Incredible nature around Kuching! Orangutan sanctuaries, Bako National Park, cave systems, and Borneo rainforest adventures.",
        "safety": "Very safe in Kuching. Friendly locals, low crime, and a welcoming atmosphere. One of Malaysia's most peaceful cities.",
        "food": "Excellent food in Kuching! Sarawak laksa is legendary, plus unique Borneo dishes, seafood, and multicultural cuisine.",
        "community": "Small expat presence in Kuching. Not a nomad hub, but growing interest. Nature lovers and adventurers gravitate here.",
        "english": "Good English in Kuching. English widely spoken alongside Malay and local languages. Communication is easy.",
        "visa": "Malaysia offers 90 days visa-free for most nationalities. DE Rantau digital nomad visa for longer stays.",
        "culture": "Indigenous Dayak culture meets modern Kuching. Museums, longhouses, and cultural villages showcase Borneo heritage.",
        "cleanliness": "Clean waterfront city in Kuching. Well-maintained public spaces and pride in the city's appearance.",
        "airquality": "Generally good air in Kuching. Occasional haze from fires can affect quality, but mostly fresh with river breezes."
    },
    "makassar": {
        "climate": "Tropical Makassar is hot year-round (26-33°C). Dry season (May-Oct) is more comfortable; rainy season brings afternoon storms.",
        "cost": "Very affordable at around $700/month. Eastern Indonesia prices are low—authentic Indonesian living without tourist markups.",
        "wifi": "Variable internet in Makassar. Modern hotels and malls have decent connections; general infrastructure is developing.",
        "nightlife": "Limited nightlife in Makassar. Local hangouts and waterfront spots exist, but this isn't a party city. Early evenings dominate.",
        "nature": "Island adventures from Makassar! Taka Bonerate marine park, Bantimurung waterfalls, and gateway to Toraja highlands.",
        "safety": "Generally safe in Makassar with standard precautions. Friendly locals and developing tourism infrastructure.",
        "food": "Great seafood in Makassar! Famous for coto Makassar soup, fresh grilled fish, and Sulawesi specialties. Food lovers will enjoy.",
        "community": "Minimal nomad presence in Makassar. Few international remote workers—mostly business travelers and adventurous tourists.",
        "english": "Limited English in Makassar. Indonesian phrases essential for daily life. Younger generation may speak some English.",
        "visa": "Indonesia offers 30-day visa-free (extendable) or 60-day visa on arrival. B211 visa for longer stays.",
        "culture": "Bugis seafaring culture in Makassar. Fort Rotterdam, traditional shipbuilding, and authentic South Sulawesi heritage.",
        "cleanliness": "Variable cleanliness in Makassar. Typical Indonesian urban conditions—main areas maintained, local neighborhoods vary.",
        "airquality": "Decent air quality in Makassar. Coastal location helps, though urban traffic creates some pollution."
    },
    "medan": {
        "climate": "Tropical Medan is hot and humid year-round (24-32°C). Rain possible any time, with slightly drier months May-September.",
        "cost": "Very affordable at around $700/month. Sumatra prices are low—authentic Indonesian living costs a fraction of Bali.",
        "wifi": "Variable internet in Medan. Good hotels have reliable WiFi; general infrastructure is improving but inconsistent.",
        "nightlife": "Limited nightlife in Medan. Local bars and restaurants exist, but conservative culture keeps evenings quiet.",
        "nature": "Lake Toba gateway from Medan! Sumatra's jungles, orangutan sanctuaries, and Bukit Lawang are accessible adventures.",
        "safety": "Generally safe in Medan with awareness. Standard urban caution applies; most areas are welcoming to visitors.",
        "food": "Excellent food in Medan! Durian capital of Sumatra, plus amazing Batak cuisine, Indian-influenced dishes, and Chinese Medan specialties.",
        "community": "Very small nomad presence in Medan. Transit point for most travelers—few settle for extended remote work.",
        "english": "Limited English in Medan. Indonesian is essential for daily life. Tourism workers may speak basic English.",
        "visa": "Indonesia offers 30-day visa-free (extendable) or 60-day visa on arrival. B211 visa for longer stays.",
        "culture": "Multicultural Medan blend. Batak highland traditions, Chinese temples, Indian mosques, and diverse heritage.",
        "cleanliness": "Variable cleanliness in Medan. Typical large Indonesian city conditions—some areas well-maintained, others less so.",
        "airquality": "Variable air quality in Medan. Urban traffic and nearby agriculture can affect air. Check conditions seasonally."
    },
    "pune": {
        "climate": "Tropical monsoon Pune has pleasant weather most of the year. Summers hot (38°C), monsoon (Jun-Sep) brings heavy rain, winter is ideal.",
        "cost": "Very affordable at around $800/month. Pune offers great value—modern amenities at Indian prices.",
        "wifi": "Good internet in Pune. Tech hub status means solid infrastructure—coworking spaces and cafés have reliable connections.",
        "nightlife": "Good nightlife in Pune. Koregaon Park and FC Road have bars, clubs, and live music. University culture brings energy.",
        "nature": "Hill stations near Pune! Lonavala, Lavasa, and Western Ghats offer weekend escapes from urban life.",
        "safety": "Safe in Pune by Indian standards. Educational city with relatively low crime. Standard awareness in crowded areas.",
        "food": "Great food in Pune! Maharashtrian cuisine, street food culture, and diverse restaurants. Vada pav and misal pav are essentials.",
        "community": "Growing tech community in Pune. Startup scene attracts young professionals. Nomad-specific community still developing.",
        "english": "Good English in Pune. Educated population and IT sector mean English is widely spoken in professional settings.",
        "visa": "India offers e-visa (30/90/365 days) for many nationalities. Tourist visa extendable with some bureaucracy.",
        "culture": "Historical and modern Pune. Shaniwar Wada fort, Osho Ashram, and vibrant arts scene. University city energy.",
        "cleanliness": "Variable cleanliness in Pune. Modern areas are maintained; general city cleanliness is typically Indian.",
        "airquality": "Variable air quality in Pune. Growing traffic affects air. Winter months can see worse conditions."
    },
    "recife": {
        "climate": "Tropical Recife is warm year-round (25-30°C). Rainy season (Mar-Aug) brings downpours, but sun returns quickly. Always beach weather.",
        "cost": "Affordable at around $1200/month. Northeast Brazil prices are reasonable—good beach living without Rio prices.",
        "wifi": "Decent internet in Recife. Modern accommodations have reliable WiFi; general infrastructure varies by neighborhood.",
        "nightlife": "Vibrant nightlife in Recife! Frevo and forró music, beach bars, and cultural venues. Recife Antigo has great evening energy.",
        "nature": "Beach paradise in Recife! Urban reef beaches, Fernando de Noronha nearby, and Porto de Galinhas within reach.",
        "safety": "Mixed safety in Recife. Research neighborhoods carefully, avoid flashy displays, and stay aware. Not Brazil's safest, but manageable.",
        "food": "Excellent food in Recife! Northeast Brazilian cuisine—tapioca, acarajé, fresh seafood, and tropical fruits. Regional flavors shine.",
        "community": "Small nomad presence in Recife. Not a major hub, but Brazilian warmth welcomes remote workers exploring the northeast.",
        "english": "Limited English in Recife. Portuguese essential for daily life. Tourism workers may speak basic English.",
        "visa": "Brazil offers visa-free entry (90 days) for many nationalities. Extensions possible through Federal Police.",
        "culture": "Rich Afro-Brazilian culture in Recife. Frevo dancing, maracatu rhythms, and Carnival traditions. Historic centro worth exploring.",
        "cleanliness": "Variable cleanliness in Recife. Beach areas maintained; general city conditions vary by neighborhood.",
        "airquality": "Good air quality in Recife. Coastal breezes keep air fresh. Ocean-side living benefits air quality."
    },
    "sanur": {
        "climate": "Tropical Sanur has Bali's classic weather—warm year-round (27-30°C). Dry season (Apr-Oct) ideal; rainy season brings afternoon storms.",
        "cost": "Moderate costs at around $1500/month. More expensive than local Bali prices due to expat demand, but good value overall.",
        "wifi": "Good internet in Sanur. Established tourist infrastructure means reliable WiFi in cafés, villas, and coworking spaces.",
        "nightlife": "Quiet evenings in Sanur. This is Bali's relaxed side—early dinners, beachfront drinks, and peaceful nights. Not a party zone.",
        "nature": "Reef-calm beaches in Sanur. Sunrise coast, cycling paths, and gateway to Nusa islands. Gentle waves suit families and swimmers.",
        "safety": "Very safe in Sanur. Family-friendly area with minimal concerns. Standard beach town awareness is sufficient.",
        "food": "Good food scene in Sanur. Beachfront warungs, upscale restaurants, and healthy cafés. Quality over Canggu's hipster hype.",
        "community": "Established expat community in Sanur. More retirees than nomads, but remote workers appreciate the calm. Growing coworking options.",
        "english": "Good English in Sanur. Tourism workers communicate well. More English than local Balinese areas.",
        "visa": "Indonesia offers 30-day visa-free (extendable) or 60-day visa on arrival. Second-home visa for longer stays.",
        "culture": "Traditional Bali in Sanur. Temple ceremonies, local markets, and authentic Balinese life alongside tourism.",
        "cleanliness": "Clean beach town in Sanur. Well-maintained promenade and beaches. Resort standards throughout.",
        "airquality": "Excellent air in Sanur. Ocean breezes, less traffic than Canggu, and peaceful atmosphere. Fresh and clean."
    },
    "sihanoukville": {
        "climate": "Tropical Sihanoukville has hot, humid weather with monsoon (May-Oct). Dry season (Nov-Apr) offers beach perfection.",
        "cost": "Affordable at around $900/month. Prices have risen with development, but still good value for beach living.",
        "wifi": "Variable internet in Sihanoukville. Quality accommodations have decent WiFi; infrastructure is still developing.",
        "nightlife": "Active nightlife in Sihanoukville. Beach bars, island parties, and tourist-area venues. Development has changed the scene.",
        "nature": "Island paradise from Sihanoukville! Koh Rong, Koh Rong Samloem, and other islands offer stunning beaches and snorkeling.",
        "safety": "Variable safety in Sihanoukville. Rapid development has brought challenges. Research areas and stay aware.",
        "food": "Good seafood in Sihanoukville! Fresh catches, Khmer cuisine, and international restaurants for tourists.",
        "community": "Transient community in Sihanoukville. Backpackers and beach seekers pass through; few long-term nomads settle.",
        "english": "Basic English in Sihanoukville. Tourism workers communicate; deeper interactions need Khmer or patience.",
        "visa": "Cambodia offers e-visa or visa on arrival (30 days). Easy extensions through travel agents.",
        "culture": "Changing Sihanoukville. Former backpacker haven undergoing massive Chinese development. Find authentic spots in surrounding areas.",
        "cleanliness": "Variable cleanliness in Sihanoukville. Rapid development has created challenges. Beach quality varies by area.",
        "airquality": "Decent air quality in Sihanoukville. Coastal location helps, though construction dust can be an issue."
    },
    "solo": {
        "climate": "Tropical Solo has hot, humid weather year-round (23-32°C). Dry season (May-Oct) is more comfortable for exploring.",
        "cost": "Very affordable at around $600/month. Central Java prices are low—authentic Indonesian living at minimal cost.",
        "wifi": "Variable internet in Solo. Modern hotels have decent connections; general infrastructure is developing.",
        "nightlife": "Quiet evenings in Solo. Traditional Javanese culture means early nights. Local cafés and art spaces for socializing.",
        "nature": "Cultural landscapes around Solo. Prambanan temples, Mount Lawu hikes, and Javanese countryside offer day trips.",
        "safety": "Very safe in Solo. Friendly city with welcoming locals. One of Java's most peaceful destinations.",
        "food": "Excellent food in Solo! Javanese cuisine at its finest—nasi liwet, sate buntel, and royal court traditions. Food lovers paradise.",
        "community": "Minimal nomad presence in Solo. Cultural tourists and heritage seekers dominate. Pioneer territory for remote workers.",
        "english": "Limited English in Solo. Indonesian essential for daily life. Tourism industry speaks basic English.",
        "visa": "Indonesia offers 30-day visa-free (extendable) or 60-day visa on arrival. B211 visa for longer stays.",
        "culture": "Royal Javanese culture in Solo. Kraton palaces, batik traditions, wayang puppetry, and mystical heritage. Cultural immersion.",
        "cleanliness": "Clean for Java standards. Solo maintains traditional pride in appearance. Well-kept historic areas.",
        "airquality": "Reasonable air quality in Solo. Less industrial than Surabaya, with Javanese green surroundings."
    },
    "suva": {
        "climate": "Tropical Suva is wet—one of the world's rainiest capitals. Warm year-round (23-30°C), with drier months June-October.",
        "cost": "Moderate costs at around $1500/month. Pacific island prices are higher than Asia—imported goods add up.",
        "wifi": "Variable internet in Suva. Infrastructure is developing but can be inconsistent. Main hotels have workable connections.",
        "nightlife": "Modest nightlife in Suva. Local bars, kava sessions, and occasional live music. Pacific island pace means relaxed evenings.",
        "nature": "South Pacific beauty around Suva! Coral reefs, waterfalls, and authentic Fijian village visits. Island hopping opportunities.",
        "safety": "Generally safe in Suva with standard awareness. Petty crime exists; avoid isolated areas at night.",
        "food": "Interesting food in Suva. Fijian cuisine, Indian influences, and fresh seafood. Lovo feasts and kokoda ceviche worth trying.",
        "community": "Small expat community in Suva. NGO workers, diplomats, and aid organizations form the international presence.",
        "english": "Good English in Suva. Fiji's official language, widely spoken throughout. Communication is easy.",
        "visa": "Fiji offers 4-month visa-free for most nationalities. Extensions possible through immigration.",
        "culture": "Fijian warmth in Suva. Kava ceremonies, village traditions, and multi-ethnic heritage. Genuine Pacific hospitality.",
        "cleanliness": "Variable cleanliness in Suva. Main areas maintained; infrastructure challenges exist in some neighborhoods.",
        "airquality": "Good air quality in Suva. Pacific ocean air and tropical vegetation keep conditions fresh."
    },
    "vilcabamba": {
        "climate": "Highland Vilcabamba has perfect eternal spring—mild temperatures (18-26°C) year-round. The 'Valley of Longevity' lives up to its name.",
        "cost": "Very affordable at around $800/month. Small town Ecuador prices stretch your budget far.",
        "wifi": "Variable internet in Vilcabamba. Small town infrastructure means limited options. Good accommodations have workable connections.",
        "nightlife": "Very quiet evenings in Vilcabamba. This is a wellness retreat destination—early nights and peaceful living.",
        "nature": "Stunning nature around Vilcabamba! Mountain hikes, rivers, waterfalls, and Podocarpus National Park. Outdoor paradise.",
        "safety": "Very safe in Vilcabamba. Small town community where everyone knows everyone. Peaceful and welcoming.",
        "food": "Healthy food focus in Vilcabamba. Organic restaurants, vegetarian options, and fresh local produce. Wellness-oriented eating.",
        "community": "Established expat community in Vilcabamba. Retirees, wellness seekers, and alternative lifestyle people. Small but welcoming.",
        "english": "Some English in Vilcabamba. Expat presence means more English than typical Ecuador, but Spanish helps greatly.",
        "visa": "Ecuador offers 90-day visa-free. Easy extensions possible. Pensioner and investor visas for longer stays.",
        "culture": "Tranquil valley culture in Vilcabamba. Indigenous traditions, wellness retreats, and legends of longevity.",
        "cleanliness": "Clean mountain town in Vilcabamba. Fresh air, natural surroundings, and pride in the peaceful environment.",
        "airquality": "Excellent air quality in Vilcabamba. Mountain valley location, minimal traffic, and lush vegetation. Breathe deep."
    },
    "weligama": {
        "climate": "Tropical Weligama has warm weather year-round (26-30°C). Southwest monsoon (May-Sep) brings rain; Nov-Apr is surf season perfection.",
        "cost": "Very affordable at around $800/month. Sri Lanka prices offer excellent value—beachfront living at budget prices.",
        "wifi": "Variable internet in Weligama. Beach town infrastructure is improving; good guesthouses have workable connections.",
        "nightlife": "Quiet evenings in Weligama. Surf town vibes mean early mornings, not late nights. Beach bars for sunset drinks.",
        "nature": "Beach paradise in Weligama! Surf breaks, whale watching, sea turtle sanctuaries, and palm-fringed coastline.",
        "safety": "Very safe in Weligama. Friendly beach community with minimal concerns. Typical surf town relaxed atmosphere.",
        "food": "Good food in Weligama! Fresh seafood, Sri Lankan rice and curry, and beachfront dining. Affordable and tasty.",
        "community": "Growing surf community in Weligama. Surfers, yoga teachers, and travelers create a welcoming international vibe.",
        "english": "Basic to moderate English in Weligama. Tourism workers communicate okay; local interactions benefit from patience.",
        "visa": "Sri Lanka offers 30-day ETA (extendable to 6 months). Digital nomad visa recently introduced.",
        "culture": "Coastal Sri Lankan culture in Weligama. Stilt fishermen, Buddhist temples, and traditional fishing village life.",
        "cleanliness": "Variable cleanliness in Weligama. Beach areas maintained; general town conditions are developing.",
        "airquality": "Good air quality in Weligama. Ocean breezes and minimal traffic keep air fresh and clean."
    }
}

def update_city_html(html_path: Path, descriptions: dict) -> bool:
    """Update the CATEGORY_DESCRIPTIONS in a city HTML file."""
    content = html_path.read_text(encoding='utf-8')
    desc_json = json.dumps(descriptions, ensure_ascii=False)

    # Pattern to match existing CATEGORY_DESCRIPTIONS
    pattern = r'const CATEGORY_DESCRIPTIONS = \{[^;]+\};'
    replacement = f'const CATEGORY_DESCRIPTIONS = {desc_json};'

    if not re.search(pattern, content):
        return False

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        html_path.write_text(new_content, encoding='utf-8')
        return True
    return False

def main():
    cities_dir = Path(r'C:/Users/yasch/Coding Projects/Website Projects/nomadcompass/cities')

    updated = 0
    for city_id, descriptions in CITY_DESCRIPTIONS.items():
        html_path = cities_dir / f"{city_id}.html"

        if not html_path.exists():
            print(f"  Skipped {city_id}: file not found")
            continue

        if update_city_html(html_path, descriptions):
            print(f"  Updated {city_id}")
            updated += 1
        else:
            print(f"  Failed {city_id}")

    print(f"\nDone! Updated {updated} cities")

if __name__ == "__main__":
    main()

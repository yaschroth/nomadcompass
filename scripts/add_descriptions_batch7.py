#!/usr/bin/env python3
"""Batch 7: Add comprehensive category descriptions for 10 more cities (Asia/LatAm)."""

import json
import os

BATCH_CITIES = {
    "kyoto": {
        "climate": "Kyoto has a humid subtropical climate with hot summers (30-35°C) and cold winters (0-8°C). Spring cherry blossoms and fall foliage are magical. The basin location intensifies temperature extremes.",
        "cost": "More affordable than Tokyo with meals from ¥600-1500 and apartments from ¥70,000-120,000/month. Traditional machiya houses offer unique accommodation. Tourist areas are pricier.",
        "wifi": "Good connectivity with speeds of 30-60 Mbps. Traditional cafés may lack wifi but modern spots have it. Pocket wifi or SIM remains recommended.",
        "nightlife": "Quieter than Tokyo with Gion and Pontocho offering atmospheric bars. The geisha district creates unique evening experiences. The pace is slower and more refined.",
        "nature": "Surrounded by mountains with temples nestled in forested hillsides. Arashiyama bamboo grove is iconic. The city integrates nature throughout its design.",
        "safety": "Extremely safe like all Japanese cities. The traditional atmosphere adds to the sense of security. Temple grounds are peaceful at all hours.",
        "food": "Kaiseki cuisine reaches its highest expression here. Traditional Kyoto specialties like yudofu and matcha are refined arts. The food scene balances tradition with innovation.",
        "community": "Smaller expat community focused on traditional arts and culture. Long-term residents develop deep connections. The city attracts those seeking authenticity.",
        "english": "Lower English levels than Tokyo. Tourist sites have some English support. Japanese is more important here for daily life.",
        "visa": "Standard Japanese visa rules apply. The city attracts cultural visa holders studying traditional arts. Working holiday visas are available.",
        "culture": "Japan's cultural heart with over 2000 temples and shrines. Traditional arts from tea ceremony to calligraphy are practiced. The city moves at a mindful pace.",
        "cleanliness": "Immaculately clean with traditional Japanese attention to detail. Temple grounds are meticulously maintained. The cultural emphasis on cleanliness is evident.",
        "airquality": "Generally good though the basin can trap pollution in summer. The forested surroundings help purify air. Traditional architecture allows natural ventilation."
    },
    "fukuoka": {
        "climate": "Fukuoka has a humid subtropical climate with hot summers (28-33°C) and mild winters (5-12°C). The sea moderates temperatures. Less extreme than Tokyo or Osaka.",
        "cost": "More affordable than other major Japanese cities with apartments from ¥50,000-90,000/month. The food, especially ramen, is excellent value. Quality of life per cost is high.",
        "wifi": "Good infrastructure with speeds of 40-80 Mbps. The startup scene has improved coworking options. Cafés in central areas have reliable connections.",
        "nightlife": "Vibrant scene centered on Nakasu and Tenjin districts. Yatai food stalls create unique evening culture. The atmosphere is more relaxed than Tokyo.",
        "nature": "Sea and mountains accessible from the city. Ohori Park provides urban green space. Beach days are possible in summer.",
        "safety": "Very safe with the friendly Kyushu character adding warmth. The city feels welcoming and secure. Crime is rare.",
        "food": "Hakata ramen originated here and is legendary. Mentaiko, gyoza, and fresh seafood are specialties. The yatai street food culture is unique to Fukuoka.",
        "community": "Growing startup and nomad scene positioned as Japan's startup city. Coworking spaces are emerging. The smaller size makes community building easier.",
        "english": "Lower English levels than Tokyo but improving. The startup scene brings some English speakers. Learning Japanese is more important.",
        "visa": "Standard Japanese visa rules. The startup visa program targets Fukuoka specifically. Working holiday visas are an option.",
        "culture": "Gateway to Asia with Korean and Chinese influences. The Kyushu spirit is warmer and more open than eastern Japan. Traditional festivals are spectacular.",
        "cleanliness": "Very clean with Japanese standards maintained. The compact downtown is well-organized. Public spaces are excellently maintained.",
        "airquality": "Generally good with sea breezes. Occasional yellow dust from China can affect spring. The coastal location ensures fresh air."
    },
    "lima": {
        "climate": "Lima has a unique desert coastal climate with mild temperatures year-round (15-27°C). The garúa (coastal fog) creates grey skies much of the year. Rain is extremely rare.",
        "cost": "Very affordable with apartments from $400-800/month in nice neighborhoods. World-class food is accessible at all price points. The cost of living attracts many nomads.",
        "wifi": "Good infrastructure in Miraflores and Barranco with speeds of 20-50 Mbps. Coastal areas have better connectivity. Some areas still developing.",
        "nightlife": "Vibrant scene in Miraflores and Barranco with bars, clubs, and peñas for live music. The party scene is social and energetic. Lima comes alive at night.",
        "nature": "Coastal setting with Pacific views but limited greenery. Surfing is popular at beaches south of the city. Day trips to mountains and desert offer nature escapes.",
        "safety": "Exercise caution as petty crime exists. Tourist areas are safer but awareness is important. Use authorized taxis and stay alert.",
        "food": "Peru's culinary capital and arguably South America's best food city. Ceviche, anticuchos, and fusion cuisines are extraordinary. The food scene has global recognition.",
        "community": "Growing digital nomad community especially in Miraflores. Coworking spaces have emerged. The food and culture attract long-term visitors.",
        "english": "Limited English outside tourist areas. Spanish is essential for daily life. Learning Spanish is highly rewarding here.",
        "visa": "183 days visa-free for most Western nationalities. Extensions are possible. Peru is welcoming to long-term visitors.",
        "culture": "Inca heritage meets Spanish colonial architecture and modern creativity. The arts scene is vibrant. Lima has undergone a remarkable renaissance.",
        "cleanliness": "Varies significantly by area. Miraflores is well-maintained while other areas show urban challenges. The coastal areas are generally clean.",
        "airquality": "Often grey and overcast but actual pollution levels are moderate. The garúa creates mist rather than smog. Coastal breezes help with air circulation."
    },
    "cartagena": {
        "climate": "Cartagena has a tropical climate with hot temperatures year-round (26-32°C). Humidity is high. The breeze from the Caribbean provides some relief.",
        "cost": "Moderate with apartments from $500-1000/month. Tourism has raised prices above other Colombian cities. Long-term rentals offer better value.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps. The Old Town can have connectivity issues in historic buildings. Getsemaní and Bocagrande are better connected.",
        "nightlife": "Vibrant scene with Caribbean energy. Salsa clubs, rooftop bars, and beach parties offer options. The Old Town comes alive after dark.",
        "nature": "Caribbean beaches and nearby islands like Rosario are accessible. The mangroves and coastal ecology are interesting. The city itself is urban but sea access is easy.",
        "safety": "Tourist areas are generally safe with police presence. Exercise caution at night in less traveled areas. The beach vendors can be persistent.",
        "food": "Caribbean cuisine features fresh seafood, arepas, and tropical fruits. The restaurant scene ranges from street vendors to fine dining. The ceviche is excellent.",
        "community": "Growing nomad community attracted by the beach lifestyle. Coworking spaces have opened in recent years. The vibe is more vacation than deep work.",
        "english": "Tourism has improved English in hospitality. Spanish is needed for deeper interaction. Many locals don't speak English.",
        "visa": "180 days visa-free for most Western nationalities. Same generous Colombian policy. Easy for extended stays.",
        "culture": "Colonial architecture creates a magical Old Town atmosphere. Afro-Caribbean culture adds rhythm and color. The UNESCO heritage is beautifully preserved.",
        "cleanliness": "Tourist areas are well-maintained. Some outer areas show urban challenges. Beach cleanliness varies.",
        "airquality": "Generally good with Caribbean breezes. The humid air can feel heavy. The coastal location ensures reasonable air quality."
    },
    "cancun": {
        "climate": "Cancun has a tropical climate with warm weather year-round. Temperatures range 25-33°C. Hurricane season runs June to November with occasional storms.",
        "cost": "More expensive than interior Mexico but cheaper than US. Apartments range $800-1500/month. Tourist zone prices are inflated but local areas offer value.",
        "wifi": "Good infrastructure in the hotel zone with speeds of 30-60 Mbps. Downtown has variable connectivity. Coworking spaces offer reliable connections.",
        "nightlife": "Famous party scene with mega-clubs and beach bars. Spring break energy year-round in the hotel zone. Downtown offers more local options.",
        "nature": "Caribbean beaches are stunning with turquoise waters. Cenotes and Mayan ruins create unique excursions. Marine life and snorkeling are excellent.",
        "safety": "Tourist areas are well-policed and safe. Some areas outside require more caution. Drug-related violence doesn't typically affect tourists.",
        "food": "Mexican cuisine meets Caribbean seafood. Tourist zone has international options. Downtown has more authentic local food at better prices.",
        "community": "Nomad community exists but more transient than other Mexico spots. The resort atmosphere affects community building. Coworking spaces are growing.",
        "english": "Widely spoken in tourist areas. The tourism industry ensures English accessibility. Spanish helps for local interaction.",
        "visa": "Mexican FMM allows 180-day stays. Easy visa process. Same generous policy as all of Mexico.",
        "culture": "Mayan heritage meets modern resort development. The ancient ruins nearby add cultural depth. Beach culture dominates daily life.",
        "cleanliness": "Hotel zone is well-maintained. Beach cleaning is regular. Development pressures create some environmental challenges.",
        "airquality": "Excellent air quality with Caribbean breezes. The coastal location ensures clean, fresh air. One of Mexico's best air quality destinations."
    },
    "oaxaca": {
        "climate": "Oaxaca has a semi-arid climate at altitude with warm days (25-30°C) and cool nights. The dry season from October to May is ideal. Summer brings afternoon rains.",
        "cost": "Very affordable with apartments from $400-700/month. Mezcal and food are incredibly cheap. The cost of living is low for the quality of life.",
        "wifi": "Moderate infrastructure with speeds of 15-40 Mbps. The centro histórico has variable connections. Coworking spaces have more reliable internet.",
        "nightlife": "Mezcal bars define the scene with live music and cultural events. The arts community creates interesting nightlife. Less party-focused than coastal Mexico.",
        "nature": "Mountains surround the valley with hiking and villages to explore. The Hierve el Agua petrified waterfalls are stunning. Indigenous communities maintain traditional landscapes.",
        "safety": "Very safe for Mexico with a welcoming local culture. The tourist-friendly environment is secure. Basic precautions are sufficient.",
        "food": "One of Mexico's culinary capitals with mole, tlayudas, and chapulines. The food scene is extraordinary and affordable. Mezcal culture is central to Oaxacan identity.",
        "community": "Strong digital nomad community attracted by culture and affordability. Art and food bring creative people. Coworking spaces have active communities.",
        "english": "Limited English with Spanish essential for daily life. The tourist industry provides some English. Learning Spanish is highly rewarding.",
        "visa": "Standard Mexican 180-day FMM. The city is popular for longer stays. Visa runs to Guatemala are an option.",
        "culture": "Indigenous Zapotec heritage meets colonial architecture and contemporary art. The cultural richness is unmatched in Mexico. Traditional crafts and textiles thrive.",
        "cleanliness": "Centro histórico is well-maintained. Traditional architecture and cobblestones add character. The city takes pride in its appearance.",
        "airquality": "Good air quality at altitude with clean mountain air. The valley can trap some pollution. Overall very pleasant breathing."
    },
    "sanmigueldeallende": {
        "climate": "San Miguel has a semi-arid highland climate with warm days and cool nights year-round. Temperatures range 10-28°C. The altitude keeps heat manageable.",
        "cost": "Moderate to expensive due to expat popularity. Apartments range $700-1500/month. Prices are higher than typical Mexico but value is good.",
        "wifi": "Decent infrastructure with speeds of 20-50 Mbps. The historic centro can have connection issues. Modern developments have better connectivity.",
        "nightlife": "Sophisticated scene with wine bars, live music, and cultural events. The arts community creates interesting options. More refined than party destinations.",
        "nature": "Beautiful countryside with hot springs and botanical gardens. The surrounding desert landscape has stark beauty. Day trips to vineyards are popular.",
        "safety": "Very safe with a welcoming atmosphere. The expat presence adds to security. One of Mexico's safest destinations.",
        "food": "Excellent dining from traditional Mexican to international cuisine. The food scene is sophisticated. Local markets offer authentic experiences.",
        "community": "Large established expat community, especially retirees. Newer nomad arrivals mix with long-term residents. Social opportunities are abundant.",
        "english": "Widely spoken due to large American community. You can function entirely in English. Spanish enriches the experience but isn't essential.",
        "visa": "Standard Mexican 180-day FMM. Popular for retirement and extended stays. Easy visa process.",
        "culture": "Colonial architecture in a UNESCO World Heritage setting. Arts and culture events throughout the year. The city has maintained its character beautifully.",
        "cleanliness": "Immaculately maintained colonial center. Pride in the town's appearance is evident. One of Mexico's most beautiful and clean cities.",
        "airquality": "Excellent air quality at altitude. Clean mountain air and limited industry. The highland climate is refreshing."
    },
    "puertovallarta": {
        "climate": "Puerto Vallarta has a tropical climate with warm weather year-round. Summer is hot and humid (30-35°C) with afternoon rains. Winter is dry and perfect (22-28°C).",
        "cost": "Moderate with apartments from $600-1200/month. Tourist zone is pricier while local areas offer value. Long-term rentals are good value.",
        "wifi": "Good infrastructure in tourist areas with speeds of 25-50 Mbps. The malecon area has reliable connections. Some older areas have limitations.",
        "nightlife": "Active scene from beach bars to LGBTQ-friendly Zona Romántica. Live music and dancing are popular. The scene caters to tourists and residents alike.",
        "nature": "Mountains meet ocean creating dramatic landscapes. The botanical gardens and jungle tours offer nature experiences. Whale watching is spectacular in winter.",
        "safety": "Very safe for Mexico with tourist-friendly environment. The malecon is well-patrolled. Standard beach precautions apply.",
        "food": "Fresh seafood dominates with excellent Mexican cuisine. The restaurant scene is sophisticated. Street tacos to fine dining are all available.",
        "community": "Large LGBTQ community and growing nomad presence. Established expat community. Coworking options are developing.",
        "english": "Widely spoken in tourist areas. The American and Canadian presence ensures English accessibility. Spanish helps for deeper connection.",
        "visa": "Standard Mexican 180-day FMM. Popular for winter escapes and longer stays. Easy process for extended visits.",
        "culture": "Beach culture meets Mexican traditions. The malecon public art creates walkable culture. Less historic than interior cities but charming.",
        "cleanliness": "Tourist areas are well-maintained. Beach cleaning is regular. The city takes tourism seriously.",
        "airquality": "Excellent air quality with ocean breezes. The mountain-ocean location ensures fresh air. One of Mexico's best coastal air quality spots."
    },
    "manila": {
        "climate": "Manila has a tropical monsoon climate with hot weather year-round (26-34°C). The wet season from June to November brings heavy rains. The dry season is hot and humid.",
        "cost": "Very affordable with apartments from $300-700/month in good areas. The cost of living is low by global standards. Services and labor are inexpensive.",
        "wifi": "Variable infrastructure with speeds of 15-50 Mbps depending on location. BGC and Makati have better connectivity. Fiber is expanding but coverage is uneven.",
        "nightlife": "Vibrant scene in Makati and BGC with bars, clubs, and KTV. Filipino hospitality creates welcoming environments. The party scene runs late.",
        "nature": "Urban environment but day trips to beaches and mountains are possible. Nearby Tagaytay offers cooler mountain escape. The city itself has limited green space.",
        "safety": "Mixed safety with some areas requiring caution. Stick to established business districts. Traffic accidents are common.",
        "food": "Filipino cuisine features adobo, sinigang, and lechon. The food scene is diverse with excellent Asian cuisines. Mall food courts offer variety.",
        "community": "Large English-speaking professional community. BPO industry brings international exposure. Coworking spaces serve the growing freelancer population.",
        "english": "Widely spoken as an official language. The Philippines has one of Asia's highest English proficiency rates. Business operates seamlessly in English.",
        "visa": "30-day visa-free with easy extensions up to 36 months. The most generous visa policy in Southeast Asia. Extensions are bureaucratic but doable.",
        "culture": "Spanish colonial heritage meets Asian and American influences. Mall culture is central to social life. The people are notably warm and hospitable.",
        "cleanliness": "Varies significantly by area. Business districts are maintained while others are challenging. Flooding during rainy season affects cleanliness.",
        "airquality": "Often poor due to traffic and industrial pollution. Manila ranks among Asia's more polluted capitals. Air purifiers are recommended."
    },
    "cebu": {
        "climate": "Cebu has a tropical climate with warm weather year-round (26-33°C). Less seasonal variation than Luzon. The islands offer slightly more breeze.",
        "cost": "Very affordable with apartments from $250-500/month. The cost of living is lower than Manila. Island living is budget-friendly.",
        "wifi": "Improving infrastructure with speeds of 15-40 Mbps in urban areas. IT Park has good connectivity. Island areas have variable connections.",
        "nightlife": "Active scene in IT Park and Mango Square areas. The expat and call center crowd creates social options. Beach bars on nearby islands offer alternatives.",
        "nature": "Island setting with beautiful beaches accessible by boat. Whale shark encounters in Oslob. Mountain hiking and waterfalls inland.",
        "safety": "Generally safe with friendly locals. Tourist areas are secure. Normal urban awareness in city areas.",
        "food": "Cebuano specialties like lechon are famous. Fresh seafood from the islands is excellent. The food scene is simpler than Manila but satisfying.",
        "community": "Growing nomad community in IT Park area. Cheaper alternative to Manila for remote workers. Community is smaller but friendly.",
        "english": "Widely spoken with high proficiency. Cebuano is local language but English works everywhere. The call center industry ensures excellent English.",
        "visa": "Same generous Philippine visa rules. Easy extensions available. Popular for long-term affordable living.",
        "culture": "Island culture with Spanish colonial heritage. More relaxed pace than Manila. The Sinulog festival is a highlight.",
        "cleanliness": "Urban areas can be challenging. Beach islands are better maintained. Development has outpaced infrastructure.",
        "airquality": "Better than Manila with island breezes. Urban areas still have pollution. Island escapes offer clean air."
    }
}

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'category-descriptions.json')

    # Load existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new cities
    for city_id, descriptions in BATCH_CITIES.items():
        data[city_id] = descriptions
        print(f"Added descriptions for {city_id}")

    # Save updated data
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nTotal cities with descriptions: {len(data)}")

if __name__ == "__main__":
    main()

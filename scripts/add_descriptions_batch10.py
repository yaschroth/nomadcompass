#!/usr/bin/env python3
"""Batch 10: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "palma": {
        "climate": "Palma has a Mediterranean climate with hot summers (28-32°C) and mild winters (10-16°C). Over 300 sunny days per year. The sea moderates temperature extremes.",
        "cost": "Moderate to expensive with apartments from €900-1600/month. The island has become popular driving up prices. Off-season offers better value.",
        "wifi": "Good infrastructure with speeds of 40-100 Mbps. Cafés and coworking spaces are well-equipped. The digital nomad influx has improved connectivity.",
        "nightlife": "Sophisticated scene from old town tapas to beach clubs. The Santa Catalina district has craft cocktail bars. Megaclubs exist but aren't the focus.",
        "nature": "Stunning Mediterranean coastline with mountains in the Serra de Tramuntana. Cycling and hiking are popular. The beaches are beautiful.",
        "safety": "Very safe with low crime rates. The island atmosphere is relaxed. Tourist areas are well-maintained and secure.",
        "food": "Mediterranean cuisine with Mallorcan specialties like sobrassada and ensaimada. Fresh seafood is excellent. The food scene has become increasingly sophisticated.",
        "community": "Strong digital nomad community with Palma becoming a European hub. Coworking spaces are abundant. The community is active and well-established.",
        "english": "Good English proficiency in tourism and business. Spanish and Catalan are local languages. Many international residents.",
        "visa": "Schengen rules apply with Spanish digital nomad visa available. Palma is popular for nomad visa applications. The process is well-documented.",
        "culture": "Gothic cathedral and medieval old town blend with modern beach culture. Mallorcan identity is distinct. The island has attracted artists and creatives for decades.",
        "cleanliness": "Very clean with well-maintained beaches and public spaces. The tourism industry ensures high standards. The old town is beautifully preserved.",
        "airquality": "Excellent air quality with Mediterranean breezes. The island location ensures clean air. One of Europe's best air quality destinations."
    },
    "tenerife": {
        "climate": "Tenerife has an eternal spring climate with temperatures of 20-28°C year-round. The north is greener while the south is drier. Mount Teide creates microclimate zones.",
        "cost": "Affordable with apartments from €600-1100/month. The cost of living is lower than mainland Spain. Excellent value for the climate.",
        "wifi": "Good Canary Islands infrastructure with speeds of 30-80 Mbps. Coworking spaces have reliable connections. Fiber is available in developed areas.",
        "nightlife": "Varied scene from Costa Adeje resorts to Santa Cruz local bars. Las Américas has tourist nightlife. The scene caters to different tastes.",
        "nature": "Mount Teide National Park is a UNESCO site. Whale watching is world-class. The volcanic landscape creates dramatic scenery.",
        "safety": "Very safe with low crime rates. The island has a relaxed, welcoming atmosphere. Tourist areas are well-policed.",
        "food": "Canarian cuisine with papas arrugadas and mojo sauces. Fresh fish is excellent. The food scene blends Spanish and African influences.",
        "community": "Growing digital nomad community attracted by year-round good weather. Coworking spaces are developing. The nomad scene is active.",
        "english": "Tourism has created good English proficiency. Spanish enriches the experience. Many international residents.",
        "visa": "Schengen rules apply. The Canary Islands are popular for extended stays due to weather. Spanish digital nomad visa is an option.",
        "culture": "Canarian culture has unique identity within Spain. The indigenous Guanche heritage is celebrated. The relaxed island lifestyle prevails.",
        "cleanliness": "Well-maintained tourist areas and beaches. Development has been managed reasonably. Natural areas are protected.",
        "airquality": "Excellent air quality with Atlantic breezes. The isolated location ensures clean air. Calima dust from Sahara occasionally affects visibility."
    },
    "laspalmas": {
        "climate": "Las Palmas has one of the world's best climates with temperatures of 18-26°C year-round. Rain is rare. The Atlantic moderates any extremes.",
        "cost": "Affordable with apartments from €600-1000/month. Excellent value for European living. The cost of living is reasonable.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. The digital nomad popularity has improved connectivity. Coworking spaces are well-established.",
        "nightlife": "Las Canteras beach area has bars and restaurants. The old town Vegueta has atmospheric options. The scene is relaxed rather than wild.",
        "nature": "Las Canteras beach is stunning urban beach. The interior has volcanic landscapes and villages. Day trips around the island reveal diverse nature.",
        "safety": "Very safe with low crime rates. The beach atmosphere is relaxed. The island is welcoming to visitors.",
        "food": "Canarian cuisine with excellent fresh fish. Tapas culture is present. The variety satisfies different tastes.",
        "community": "One of Europe's largest digital nomad communities. The climate attracts remote workers year-round. Coworking spaces and events are abundant.",
        "english": "Good English due to large international community. Spanish helps for deeper connection. Many nomads create English-speaking pockets.",
        "visa": "Schengen rules apply. Extremely popular for digital nomad visa applications. Well-established nomad infrastructure.",
        "culture": "Canarian culture with cosmopolitan beach city vibe. The old town Vegueta preserves history. The relaxed lifestyle attracts long-term visitors.",
        "cleanliness": "Well-maintained beach and tourist areas. The city takes pride in Las Canteras. Overall standards are good.",
        "airquality": "Excellent air quality with consistent Atlantic breezes. The isolated location ensures clean air. One of Europe's best air quality cities."
    },
    "split": {
        "climate": "Split has a Mediterranean climate with hot summers (28-33°C) and mild winters (8-14°C). Over 2,700 sunshine hours per year. The Adriatic moderates temperatures.",
        "cost": "Moderate with apartments from €700-1200/month. Summer prices spike significantly. Off-season offers much better value.",
        "wifi": "Good Croatian infrastructure with speeds of 30-70 Mbps. Cafés in the old town have wifi. Coworking options are developing.",
        "nightlife": "Vibrant scene especially in summer. The Riva waterfront comes alive. Beach clubs and old town bars offer options.",
        "nature": "Stunning Adriatic coast with islands accessible by ferry. Krka and Plitvice waterfalls are day trips. The surrounding mountains add drama.",
        "safety": "Very safe with low crime rates. Croatian hospitality is welcoming. Tourist areas are well-maintained.",
        "food": "Croatian cuisine with Italian influences. Fresh seafood from the Adriatic is excellent. Konoba restaurants serve traditional dishes.",
        "community": "Growing digital nomad community especially in shoulder seasons. Croatia's nomad visa has increased interest. The expat community is developing.",
        "english": "Good English proficiency especially among younger Croatians. Tourism industry functions in English. Croatian adds local flavor.",
        "visa": "Croatia's Schengen entry and digital nomad visa have opened access. Up to 1 year stays possible for remote workers. The visa process is straightforward.",
        "culture": "Diocletian's Palace is a living Roman monument. Dalmatian culture blends history with Mediterranean lifestyle. Game of Thrones filming added modern fame.",
        "cleanliness": "Old town and waterfront are well-maintained. The Adriatic is crystal clear. Tourism ensures good standards.",
        "airquality": "Excellent air quality with Adriatic breezes. The coastal location ensures fresh air. One of Europe's cleanest coastal cities."
    },
    "zadar": {
        "climate": "Zadar has a Mediterranean climate with hot summers (28-32°C) and mild winters (8-13°C). Abundant sunshine year-round. The sea moderates temperatures.",
        "cost": "More affordable than Split or Dubrovnik with apartments from €500-900/month. Off-season prices are very reasonable. Good value for Adriatic living.",
        "wifi": "Good infrastructure with speeds of 30-60 Mbps. The old town has decent coverage. Cafés and coworking spaces are equipped.",
        "nightlife": "Relaxed scene with old town bars and waterfront options. Less tourist-party focused than Split. The Sea Organ provides unique evening entertainment.",
        "nature": "Beautiful Adriatic coast with national parks like Paklenica nearby. Islands accessible by ferry. The surrounding karst landscape is dramatic.",
        "safety": "Very safe with low crime rates. The smaller size creates intimate, secure atmosphere. Friendly local community.",
        "food": "Dalmatian cuisine with excellent seafood. Less touristy restaurant scene than Split. Fresh local ingredients are emphasized.",
        "community": "Smaller but growing digital nomad presence. The affordability attracts those seeking quieter alternatives. Community is developing.",
        "english": "Good English proficiency. Tourism has expanded English usage. Learning Croatian is appreciated.",
        "visa": "Croatian digital nomad visa applies. The smaller city offers authentic experience. Up to 1 year stays possible.",
        "culture": "3000 years of history from Roman to Venetian influences. The Sea Organ and Sun Salutation installations add modern art. Authentic Dalmatian atmosphere.",
        "cleanliness": "Well-maintained old town and waterfront. The smaller size allows good upkeep. Crystal clear Adriatic waters.",
        "airquality": "Excellent air quality with coastal breezes. The location ensures fresh, clean air. One of Croatia's best air quality cities."
    },
    "bucharest": {
        "climate": "Bucharest has a humid continental climate with hot summers (28-35°C) and cold winters (-5 to 5°C). Four distinct seasons. Summer can be intensely hot.",
        "cost": "Very affordable with apartments from €400-700/month. One of Europe's best value capitals. The cost of living is low.",
        "wifi": "Excellent infrastructure with Romania having some of Europe's fastest internet (100+ Mbps common). Fiber is widespread. Tech sector ensures good connectivity.",
        "nightlife": "Vibrant scene in the Old Town and Lipscani area. Electronic music scene is growing. The party culture is energetic.",
        "nature": "Urban environment but parks like Herastrau provide green space. Day trips to Carpathian Mountains are possible. The countryside is accessible.",
        "safety": "Generally safe with some petty crime in tourist areas. The city has improved significantly. Standard urban awareness applies.",
        "food": "Romanian cuisine features hearty dishes like sarmale and mici. International options are excellent. The food scene is increasingly sophisticated.",
        "community": "Growing tech and startup community. The low costs attract digital nomads. Coworking spaces are modern and affordable.",
        "english": "Good English proficiency especially among younger Romanians. Business operates in English easily. Romanian adds local connection.",
        "visa": "EU rules allow 90-day stays for many nationalities. Romania is not yet Schengen. The digital nomad scene is growing.",
        "culture": "Eclectic architecture from communist blocks to Belle Époque palaces. The Ceausescu era left its mark. Contemporary culture is vibrant and growing.",
        "cleanliness": "Improving with modern development. Some areas show communist-era wear. New areas are well-maintained.",
        "airquality": "Moderate air quality with some traffic pollution. The city has improved over years. Green spaces help with air circulation."
    },
    "sofia": {
        "climate": "Sofia has a humid continental climate with hot summers (28-35°C) and cold, snowy winters (-5 to 5°C). Four distinct seasons. The mountain proximity affects weather.",
        "cost": "One of Europe's most affordable capitals with apartments from €350-600/month. Excellent value for quality of life. The cost of living is very low.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Bulgaria has invested in connectivity. Coworking spaces are modern and affordable.",
        "nightlife": "Vibrant scene with clubs, bars, and live music. Vitosha Boulevard has upscale options. The scene is energetic and affordable.",
        "nature": "Vitosha Mountain is visible from the city with skiing and hiking accessible. The surrounding nature is beautiful. Day trips to monasteries are rewarding.",
        "safety": "Generally safe with low violent crime. Some petty crime in tourist areas. The city is increasingly cosmopolitan.",
        "food": "Bulgarian cuisine features shopska salad, banitsa, and grilled meats. The food is hearty and affordable. International options are growing.",
        "community": "Growing digital nomad community attracted by costs and internet speed. Tech sector is developing. Coworking spaces have active communities.",
        "english": "Good English proficiency among younger Bulgarians. Business operates in English. Bulgarian adds authenticity to the experience.",
        "visa": "EU rules allow 90-day stays. Bulgaria is approaching Schengen entry. The digital nomad scene is expanding.",
        "culture": "Mix of Orthodox heritage, Ottoman history, and Soviet legacy. The transformation since EU entry is remarkable. Contemporary culture is emerging.",
        "cleanliness": "Improving with some areas showing communist-era infrastructure. Central areas are better maintained. Development is ongoing.",
        "airquality": "Can be challenging in winter due to heating. Summer is generally good. Mountain breezes help with circulation."
    },
    "tbilisi": {
        "climate": "Tbilisi has a humid subtropical climate with hot summers (30-35°C) and mild winters (2-8°C). Four seasons with pleasant spring and autumn. The valley location affects temperatures.",
        "cost": "Very affordable with apartments from $300-600/month. One of the best value cities globally. The cost of living is remarkably low.",
        "wifi": "Improving infrastructure with speeds of 20-60 Mbps. The tech scene has improved connectivity. Cafés and coworking spaces have reliable wifi.",
        "nightlife": "Legendary club scene especially at Bassiani and Khidi. Wine culture creates convivial bar atmosphere. The nightlife has gained international recognition.",
        "nature": "Surrounded by mountains with dramatic scenery. Day trips to Kazbegi offer stunning landscapes. The city integrates nature beautifully.",
        "safety": "Very safe with low crime rates. Georgian hospitality is legendary. The country is welcoming to visitors.",
        "food": "Georgian cuisine is a revelation with khinkali, khachapuri, and remarkable wines. The food culture is generous and delicious. One of the world's underrated cuisines.",
        "community": "Rapidly growing digital nomad community. The visa-free policy attracts remote workers. Coworking spaces and community are flourishing.",
        "english": "Growing English proficiency especially among younger Georgians. Russian is still useful. Learning basic Georgian delights locals.",
        "visa": "One year visa-free for most nationalities - incredibly generous. No visa runs needed. Georgia actively welcomes digital nomads.",
        "culture": "Ancient wine culture, Orthodox heritage, and unique alphabet create distinctive identity. The hospitality is genuine and overwhelming. The culture is rich and welcoming.",
        "cleanliness": "Old Town has character which includes some wear. New developments are modern. The city is improving rapidly.",
        "airquality": "Moderate with some traffic pollution. The valley can trap air. Mountain proximity generally helps with freshness."
    },
    "batumi": {
        "climate": "Batumi has a humid subtropical climate with mild winters (5-10°C) and warm summers (25-30°C). The Black Sea moderates temperatures. Rain is common year-round.",
        "cost": "Even more affordable than Tbilisi with apartments from $250-450/month. Beach living at rock-bottom prices. Excellent value.",
        "wifi": "Good infrastructure with speeds of 20-50 Mbps. The casino and tourism development has improved connectivity. Coworking options exist.",
        "nightlife": "Casino culture brings energy. Beach bars and clubs operate in summer. The scene is developing with the city.",
        "nature": "Black Sea beaches and nearby botanical gardens. Mountains rise behind the coast. Day trips to mountain villages are possible.",
        "safety": "Very safe with low crime. The beach town atmosphere is relaxed. Georgian hospitality extends here.",
        "food": "Georgian and Adjarian cuisine with local specialties like Adjarian khachapuri. Fresh seafood from the Black Sea. The food is excellent and cheap.",
        "community": "Growing nomad community as an alternative to Tbilisi. The beach lifestyle attracts remote workers. Community is smaller but friendly.",
        "english": "Less English than Tbilisi but improving. Russian is useful. Tourism is building English proficiency.",
        "visa": "Same generous Georgian visa policy - one year visa-free. No restrictions or runs needed. Easy for extended stays.",
        "culture": "Blend of Georgian, Turkish, and Russian influences. The city has transformed dramatically with modern architecture. Beach culture dominates summer life.",
        "cleanliness": "Modern areas are well-maintained. Development has been rapid. Beach cleanliness is prioritized.",
        "airquality": "Good air quality with Black Sea breezes. The coastal location ensures fresh air. Better than many beach destinations."
    },
    "yerevan": {
        "climate": "Yerevan has a semi-arid climate with hot summers (35-40°C) and cold winters (-5 to 5°C). Four distinct seasons. The highland location creates dry conditions.",
        "cost": "Very affordable with apartments from $300-600/month. One of the region's best values. The cost of living is low.",
        "wifi": "Improving infrastructure with speeds of 20-50 Mbps. The tech sector has boosted connectivity. Cafés and coworking spaces have decent wifi.",
        "nightlife": "Growing scene with craft cocktail bars and clubs. Wine and cognac culture creates social atmosphere. The scene is developing rapidly.",
        "nature": "Mount Ararat dominates the horizon. Lake Sevan is a popular escape. The surrounding mountains and gorges are dramatic.",
        "safety": "Very safe with low crime rates. Armenian hospitality is warm. The country is welcoming to visitors.",
        "food": "Armenian cuisine features kebabs, dolma, and lavash bread. The food is flavorful and generous. Coffee culture is developing.",
        "community": "Growing digital nomad community. The tech scene attracts entrepreneurs. Coworking spaces are emerging.",
        "english": "Growing English proficiency especially among younger Armenians. Russian is common. Learning basic Armenian is appreciated.",
        "visa": "180 days visa-free for most nationalities. Very generous policy. Easy for extended stays.",
        "culture": "One of the world's oldest civilizations with Christian heritage. The genocide history is solemnly remembered. The culture is proud and resilient.",
        "cleanliness": "City center is well-maintained with pink tufa stone buildings. Some areas show Soviet-era wear. Cascade complex is beautifully kept.",
        "airquality": "Can be challenging with dust and traffic pollution. The highland location helps with some ventilation. Quality varies with weather."
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

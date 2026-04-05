#!/usr/bin/env python3
"""Batch 31: Add comprehensive category descriptions for 10 more cities."""

import json
import os

BATCH_CITIES = {
    "marrakesh": {
        "climate": "Marrakech has a semi-arid climate with hot summers (35-45°C) and mild winters (10-20°C). The Atlas Mountains are visible. Dry heat in summer.",
        "cost": "Affordable with apartments from $300-700/month. Morocco offers value. Riad living is unique.",
        "wifi": "Decent infrastructure with speeds of 15-50 Mbps. Tourist areas covered. Developing.",
        "nightlife": "Growing scene with bars in Gueliz. Rooftop terraces with medina views. Cultural restrictions apply.",
        "nature": "Atlas Mountains nearby. Desert excursions possible. Palmeraie and gardens.",
        "safety": "Generally safe with standard awareness. Hassle in medina can be intense. Comfortable in Gueliz.",
        "food": "Moroccan cuisine with tagines and couscous. The food is excellent. Street food culture.",
        "community": "Growing nomad and creative community. Riads attract visitors. Developing.",
        "english": "French more useful than English. Tourism has some English. Arabic or French helps.",
        "visa": "90 days visa-free for most. Morocco is accessible. Easy extended stays.",
        "culture": "Imperial city with medina and souks. Jemaa el-Fnaa is legendary. Sensory overload.",
        "cleanliness": "Medina is atmospheric rather than clean. New town maintained. Variable.",
        "airquality": "Can be dusty especially in summer. Dry climate. Variable quality."
    },
    "marbella": {
        "climate": "Marbella has a Mediterranean climate with hot summers (28-33°C) and mild winters (12-18°C). Costa del Sol sunshine. Beach weather most of year.",
        "cost": "Expensive as resort town. Apartments from €800-1500/month. Luxury pricing.",
        "wifi": "Good Spanish infrastructure with speeds of 50-100 Mbps. Resort connectivity. Reliable.",
        "nightlife": "Famous party scene at Puerto Banús. Beach clubs and bars. Very active in season.",
        "nature": "Beautiful beaches and La Concha mountain. Sierra de las Nieves nearby. Nature accessible.",
        "safety": "Safe tourist area. Standard resort awareness. Comfortable.",
        "food": "Andalusian and international cuisine. Beach restaurants and quality dining. Range of options.",
        "community": "International resort community. British and Scandinavian presence. Established.",
        "english": "Good in tourism. International community. Communication easy.",
        "visa": "Schengen rules apply. Spanish digital nomad visa. Standard access.",
        "culture": "Andalusian heritage meets jet-set glamour. Old town has character. Beach culture.",
        "cleanliness": "Tourist areas well-maintained. Resort standards. Good.",
        "airquality": "Excellent air quality with sea breezes. Mediterranean freshness. Clean."
    },
    "marseille": {
        "climate": "Marseille has a Mediterranean climate with hot summers (28-32°C) and mild winters (8-14°C). Mistral wind affects weather. Sunny most of year.",
        "cost": "Moderate for France. Apartments from €600-1000/month. More affordable than Paris or Nice.",
        "wifi": "Good French infrastructure with speeds of 50-100 Mbps. Port city connectivity. Reliable.",
        "nightlife": "Vibrant scene with Cours Julien and Vieux Port. Diverse character. Very active.",
        "nature": "Calanques National Park is stunning. Mediterranean coastline. Nature spectacular.",
        "safety": "Requires awareness with some areas to avoid. Tourist areas comfortable. Research neighborhoods.",
        "food": "Bouillabaisse and Mediterranean seafood. Diverse influences. Outstanding when you find the right spots.",
        "community": "Diverse and multicultural. Growing creative scene. Authentic France.",
        "english": "Limited with French essential. North African languages common. French helps.",
        "visa": "Schengen rules apply. French options. Standard access.",
        "culture": "France's oldest city with port heritage. Multicultural and gritty. Real Mediterranean character.",
        "cleanliness": "Varies significantly by area. Some zones well-maintained. Urban challenges.",
        "airquality": "Good with Mistral clearing air. Sea breezes help. Generally fresh."
    },
    "maui": {
        "climate": "Maui has a tropical climate with warm temperatures year-round (23-29°C). Trade winds moderate heat. Microclimates from coast to summit.",
        "cost": "Very expensive as Hawaiian island. Apartments from $2000-3500/month. Island premium significant.",
        "wifi": "Good infrastructure with speeds of 50-100 Mbps. Hawaiian standards. Reliable.",
        "nightlife": "Limited compared to mainland. Beach bars and restaurants. Relaxed island pace.",
        "nature": "Haleakalā volcano and Road to Hana. Beaches and whale watching. Nature spectacular.",
        "safety": "Very safe with low crime. Hawaiian aloha. Very comfortable.",
        "food": "Hawaiian and Pacific Rim cuisine. Fresh fish and local produce. Quality.",
        "community": "Local and tourism community. Respecting Hawaiian culture important. Island character.",
        "english": "Native American English with Hawaiian influences. No barriers.",
        "visa": "US visa rules apply. Hawaii is a US state. Standard access.",
        "culture": "Hawaiian heritage with aloha spirit. Surf culture and nature reverence. Paradise identity.",
        "cleanliness": "Very clean with environmental consciousness. Natural beauty preserved. Pristine.",
        "airquality": "Excellent air quality with ocean and trade winds. Among cleanest. Pristine."
    },
    "mauritius": {
        "climate": "Mauritius has a tropical maritime climate with warm temperatures year-round (20-30°C). Cyclone season December to April. Pleasant most of year.",
        "cost": "Moderate with apartments from $500-1000/month. Island costs but reasonable. Nomad visa attractive.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Indian Ocean standards. Improving.",
        "nightlife": "Resort and Grand Baie scene. Bars and restaurants. Relaxed island atmosphere.",
        "nature": "Beautiful beaches and lagoons. Black River Gorges. Nature is stunning.",
        "safety": "Very safe with low crime. Mauritius hospitality. Very comfortable.",
        "food": "Creole cuisine with Indian and Chinese influences. Fresh seafood. Diverse and delicious.",
        "community": "Growing digital nomad community. Premium visa program. International.",
        "english": "Good alongside French and Creole. Communication easy.",
        "visa": "Premium visa for nomads up to 1 year. Tourist visa available. Attractive options.",
        "culture": "Multicultural island with diverse heritage. The blend is unique. Tropical sophistication.",
        "cleanliness": "Resort and tourist areas maintained. Pride in island. Good.",
        "airquality": "Excellent air quality with ocean breezes. Island freshness. Clean."
    },
    "mazunte": {
        "climate": "Mazunte has a tropical climate with hot temperatures (25-33°C). Dry season November to April. Pacific coast weather.",
        "cost": "Very affordable with basic apartments from $250-500/month. Remote beach village pricing.",
        "wifi": "Basic infrastructure with speeds of 5-20 Mbps. Improving but limited. Beach village challenges.",
        "nightlife": "Very limited. Beach bonfires and small bars. Quiet nights.",
        "nature": "Pacific beaches and turtle sanctuary. Punta Cometa viewpoint. Nature is the draw.",
        "safety": "Safe beach community. Remote village atmosphere. Comfortable.",
        "food": "Mexican cuisine with fresh seafood. Simple but good. Affordable.",
        "community": "Yoga and alternative community. Small nomad presence. Intimate.",
        "english": "Limited with Spanish helpful. Tourism has basic English.",
        "visa": "180 days visa-free for most. Mexico accessible.",
        "culture": "Hippie beach culture with turtle conservation. The vibe is alternative. Back-to-basics.",
        "cleanliness": "Beach areas maintained. Small village standards. Variable.",
        "airquality": "Excellent air quality with ocean breezes. Remote coastal freshness. Pristine."
    },
    "medellin": {
        "climate": "Medellín has a subtropical highland climate with eternal spring (18-28°C). Perfect weather year-round. The valley creates consistent climate.",
        "cost": "Affordable with apartments from $500-1000/month. Colombia offers value. El Poblado more expensive.",
        "wifi": "Good infrastructure with speeds of 30-80 Mbps. Colombia has invested. Reliable.",
        "nightlife": "Famous scene in El Poblado and Laureles. Clubs and bars. Very active.",
        "nature": "Valley surrounded by mountains. Day trips to coffee region. Nature accessible.",
        "safety": "Transformed but requires awareness. El Poblado and Laureles are safer. Research neighborhoods.",
        "food": "Colombian cuisine with bandeja paisa. Growing international scene. Excellent value.",
        "community": "Large digital nomad community. Startup scene growing. Established networks.",
        "english": "Growing but Spanish essential. Nomad areas have more English. Learning Spanish important.",
        "visa": "90 days visa-free with extension possible. Colombia has nomad visa. Accessible.",
        "culture": "Transformation story from Pablo Escobar era. Innovation and resilience. Dynamic energy.",
        "cleanliness": "Modern areas well-maintained. Metro is pride of city. Good standards.",
        "airquality": "Can be affected by valley inversion. Generally good. Check conditions."
    },
    "mendoza": {
        "climate": "Mendoza has a semi-arid climate with hot summers (25-35°C) and mild winters (5-15°C). Andes visible. Wine country weather.",
        "cost": "Affordable with apartments from $300-600/month. Argentina offers value. Wine region.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Argentine standards. Reliable.",
        "nightlife": "Wine bars and restaurants. Arístides Villanueva has scene. Relaxed.",
        "nature": "Andes mountains and wine valleys. Aconcagua nearby. Nature spectacular.",
        "safety": "Safe with low crime. Argentine hospitality. Comfortable.",
        "food": "Argentine cuisine with world-class wine. Asado and Malbec. Outstanding.",
        "community": "Wine and outdoor community. Growing international interest. Welcoming.",
        "english": "Limited with Spanish essential. Wine tourism has some English.",
        "visa": "90 days visa-free. Argentina accessible. Extensions possible.",
        "culture": "Wine capital of Argentina. Andes define the city. Quality of life focus.",
        "cleanliness": "Well-maintained city. Pride in appearance. Good.",
        "airquality": "Excellent air quality with Andes freshness. Dry climate helps. Clean."
    },
    "merida": {
        "climate": "Mérida (Mexico) has a tropical climate with hot temperatures year-round (25-38°C). Very humid. Dry season November to April.",
        "cost": "Affordable with apartments from $400-800/month. Yucatan offers value. Growing nomad destination.",
        "wifi": "Good infrastructure with speeds of 30-70 Mbps. Yucatan has invested. Reliable.",
        "nightlife": "Growing scene in centro and northern areas. Bars and cultural venues. Developing.",
        "nature": "Cenotes and Maya ruins nearby. Gulf coast accessible. Nature extraordinary.",
        "safety": "Very safe for Mexico. Yucatan is peaceful. Comfortable throughout.",
        "food": "Yucatecan cuisine with cochinita pibil. Maya and Lebanese influences. Outstanding.",
        "community": "Growing digital nomad community. Expat presence established. Welcoming.",
        "english": "Growing with nomad presence. Spanish helpful. Communication possible.",
        "visa": "180 days visa-free for most. Mexico accessible.",
        "culture": "Colonial city with Maya heritage. Safest in Mexico. White city character.",
        "cleanliness": "Well-maintained colonial center. Pride in appearance. Good.",
        "airquality": "Good air quality despite humidity. Less industrial. Clean."
    },
    "milan": {
        "climate": "Milan has a humid subtropical climate with hot summers (28-33°C) and cold winters (0-6°C). Po Valley humidity. Four seasons.",
        "cost": "Expensive as Italian business hub. Apartments from €900-1600/month. Fashion capital pricing.",
        "wifi": "Good Italian infrastructure with speeds of 40-80 Mbps. Business connectivity. Reliable.",
        "nightlife": "Sophisticated scene with aperitivo culture. Navigli district. Very active.",
        "nature": "Lakes nearby including Como. Alps accessible. Day trips easy.",
        "safety": "Safe with standard urban awareness. Italian hospitality. Comfortable.",
        "food": "Milanese cuisine with risotto and cotoletta. International quality. Outstanding.",
        "community": "Fashion, business, and design community. International. Established.",
        "english": "Good in business. Italian helps locally. Communication possible.",
        "visa": "Schengen rules apply. Italian options. Standard access.",
        "culture": "Fashion and design capital. Last Supper and Duomo. Sophisticated Italy.",
        "cleanliness": "Modern areas maintained. Italian standards apply. Good.",
        "airquality": "Can be poor due to Po Valley. Winter smog possible. Check conditions."
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

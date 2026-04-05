"""
Add costPerMonth and coordinates to cities-data.js
"""

import re

# City coordinates and monthly costs (based on research)
CITY_DATA = {
    "lisbon": {"lat": 38.7223, "lng": -9.1393, "cost": 2200},
    "medellin": {"lat": 6.2442, "lng": -75.5812, "cost": 1400},
    "chiangmai": {"lat": 18.7883, "lng": 98.9853, "cost": 1100},
    "tbilisi": {"lat": 41.7151, "lng": 44.8271, "cost": 1200},
    "budapest": {"lat": 47.4979, "lng": 19.0402, "cost": 1600},
    "bali": {"lat": -8.4095, "lng": 115.1889, "cost": 1500},
    "bangkok": {"lat": 13.7563, "lng": 100.5018, "cost": 1400},
    "mexicocity": {"lat": 19.4326, "lng": -99.1332, "cost": 1500},
    "barcelona": {"lat": 41.3874, "lng": 2.1686, "cost": 2400},
    "berlin": {"lat": 52.5200, "lng": 13.4050, "cost": 2200},
    "prague": {"lat": 50.0755, "lng": 14.4378, "cost": 1800},
    "buenosaires": {"lat": -34.6037, "lng": -58.3816, "cost": 1300},
    "tokyo": {"lat": 35.6762, "lng": 139.6503, "cost": 2500},
    "seoul": {"lat": 37.5665, "lng": 126.9780, "cost": 2000},
    "singapore": {"lat": 1.3521, "lng": 103.8198, "cost": 3200},
    "amsterdam": {"lat": 52.3676, "lng": 4.9041, "cost": 2800},
    "porto": {"lat": 41.1579, "lng": -8.6291, "cost": 1800},
    "tallinn": {"lat": 59.4370, "lng": 24.7536, "cost": 1700},
    "split": {"lat": 43.5081, "lng": 16.4402, "cost": 1600},
    "belgrade": {"lat": 44.7866, "lng": 20.4489, "cost": 1200},
    "laspalmas": {"lat": 28.1235, "lng": -15.4363, "cost": 1900},
    "vienna": {"lat": 48.2082, "lng": 16.3738, "cost": 2400},
    "zurich": {"lat": 47.3769, "lng": 8.5417, "cost": 4500},
    "geneva": {"lat": 46.2044, "lng": 6.1432, "cost": 4200},
    "dublin": {"lat": 53.3498, "lng": -6.2603, "cost": 2800},
    "london": {"lat": 51.5074, "lng": -0.1278, "cost": 3500},
    "manchester": {"lat": 53.4808, "lng": -2.2426, "cost": 2200},
    "edinburgh": {"lat": 55.9533, "lng": -3.1883, "cost": 2300},
    "paris": {"lat": 48.8566, "lng": 2.3522, "cost": 3000},
    "lyon": {"lat": 45.7640, "lng": 4.8357, "cost": 2200},
    "nice": {"lat": 43.7102, "lng": 7.2620, "cost": 2600},
    "milan": {"lat": 45.4642, "lng": 9.1900, "cost": 2500},
    "rome": {"lat": 41.9028, "lng": 12.4964, "cost": 2200},
    "florence": {"lat": 43.7696, "lng": 11.2558, "cost": 2100},
    "palermo": {"lat": 38.1157, "lng": 13.3615, "cost": 1500},
    "madrid": {"lat": 40.4168, "lng": -3.7038, "cost": 2200},
    "valencia": {"lat": 39.4699, "lng": -0.3763, "cost": 1800},
    "seville": {"lat": 37.3891, "lng": -5.9845, "cost": 1700},
    "malaga": {"lat": 36.7213, "lng": -4.4214, "cost": 1800},
    "tenerife": {"lat": 28.2916, "lng": -16.6291, "cost": 1700},
    "athens": {"lat": 37.9838, "lng": 23.7275, "cost": 1600},
    "thessaloniki": {"lat": 40.6401, "lng": 22.9444, "cost": 1400},
    "crete": {"lat": 35.2401, "lng": 24.8093, "cost": 1500},
    "malta": {"lat": 35.8989, "lng": 14.5146, "cost": 2000},
    "cyprus": {"lat": 35.1264, "lng": 33.4299, "cost": 1800},
    "warsaw": {"lat": 52.2297, "lng": 21.0122, "cost": 1600},
    "krakow": {"lat": 50.0647, "lng": 19.9450, "cost": 1400},
    "bucharest": {"lat": 44.4268, "lng": 26.1025, "cost": 1300},
    "clujnapoca": {"lat": 46.7712, "lng": 23.6236, "cost": 1200},
    "sofia": {"lat": 42.6977, "lng": 23.3219, "cost": 1200},
    "riga": {"lat": 56.9496, "lng": 24.1052, "cost": 1500},
    "vilnius": {"lat": 54.6872, "lng": 25.2797, "cost": 1400},
    "podgorica": {"lat": 42.4304, "lng": 19.2594, "cost": 1100},
    "tirana": {"lat": 41.3275, "lng": 19.8187, "cost": 1000},
    "sarajevo": {"lat": 43.8563, "lng": 18.4131, "cost": 1100},
    "skopje": {"lat": 41.9981, "lng": 21.4254, "cost": 1000},
    "kualalumpur": {"lat": 3.1390, "lng": 101.6869, "cost": 1400},
    "hochiminhcity": {"lat": 10.8231, "lng": 106.6297, "cost": 1200},
    "penang": {"lat": 5.4164, "lng": 100.3327, "cost": 1300},
    "hanoi": {"lat": 21.0285, "lng": 105.8542, "cost": 1100},
    "danang": {"lat": 16.0544, "lng": 108.2022, "cost": 1000},
    "taipei": {"lat": 25.0330, "lng": 121.5654, "cost": 1800},
    "manila": {"lat": 14.5995, "lng": 120.9842, "cost": 1300},
    "cebu": {"lat": 10.3157, "lng": 123.8854, "cost": 1100},
    "siemreap": {"lat": 13.3671, "lng": 103.8448, "cost": 900},
    "phnompenh": {"lat": 11.5564, "lng": 104.9282, "cost": 1000},
    "kathmandu": {"lat": 27.7172, "lng": 85.3240, "cost": 800},
    "pokhara": {"lat": 28.2096, "lng": 83.9856, "cost": 700},
    "mumbai": {"lat": 19.0760, "lng": 72.8777, "cost": 1200},
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "cost": 1100},
    "goa": {"lat": 15.2993, "lng": 74.1240, "cost": 1000},
    "colombo": {"lat": 6.9271, "lng": 79.8612, "cost": 1100},
    "phuket": {"lat": 7.8804, "lng": 98.3923, "cost": 1600},
    "kohphangan": {"lat": 9.7479, "lng": 100.0120, "cost": 1200},
    "ubud": {"lat": -8.5069, "lng": 115.2625, "cost": 1400},
    "hongkong": {"lat": 22.3193, "lng": 114.1694, "cost": 3000},
    "yerevan": {"lat": 40.1792, "lng": 44.4991, "cost": 1100},
    "baku": {"lat": 40.4093, "lng": 49.8671, "cost": 1300},
    "batumi": {"lat": 41.6168, "lng": 41.6367, "cost": 1000},
    "playadelcarmen": {"lat": 20.6296, "lng": -87.0739, "cost": 1800},
    "oaxaca": {"lat": 17.0732, "lng": -96.7266, "cost": 1200},
    "montevideo": {"lat": -34.9011, "lng": -56.1645, "cost": 1600},
    "lima": {"lat": -12.0464, "lng": -77.0428, "cost": 1400},
    "cusco": {"lat": -13.5319, "lng": -71.9675, "cost": 1100},
    "bogota": {"lat": 4.7110, "lng": -74.0721, "cost": 1300},
    "cartagena": {"lat": 10.3910, "lng": -75.4794, "cost": 1500},
    "santiago": {"lat": -33.4489, "lng": -70.6693, "cost": 1600},
    "valparaiso": {"lat": -33.0472, "lng": -71.6127, "cost": 1300},
    "quito": {"lat": -0.1807, "lng": -78.4678, "cost": 1200},
    "sanjuan": {"lat": 18.4655, "lng": -66.1057, "cost": 2200},
    "santacruz": {"lat": -17.7833, "lng": -63.1822, "cost": 900},
    "lapaz": {"lat": -16.4897, "lng": -68.1193, "cost": 800},
    "asuncion": {"lat": -25.2637, "lng": -57.5759, "cost": 900},
    "guadalajara": {"lat": 20.6597, "lng": -103.3496, "cost": 1300},
    "puertovallarta": {"lat": 20.6534, "lng": -105.2253, "cost": 1600},
    "sanjosecr": {"lat": 9.9281, "lng": -84.0907, "cost": 1700},
    "tamarindo": {"lat": 10.2997, "lng": -85.8375, "cost": 1900},
    "panama": {"lat": 8.9824, "lng": -79.5199, "cost": 1800},
    "antigua": {"lat": 14.5586, "lng": -90.7295, "cost": 1300},
    "sanmigueldeallende": {"lat": 20.9144, "lng": -100.7452, "cost": 1500},
    "merida": {"lat": 20.9674, "lng": -89.5926, "cost": 1400},
    "austin": {"lat": 30.2672, "lng": -97.7431, "cost": 2800},
    "miami": {"lat": 25.7617, "lng": -80.1918, "cost": 3200},
    "vancouver": {"lat": 49.2827, "lng": -123.1207, "cost": 2800},
    "capetown": {"lat": -33.9249, "lng": 18.4241, "cost": 1500},
    "cairo": {"lat": 30.0444, "lng": 31.2357, "cost": 1000},
    "marrakech": {"lat": 31.6295, "lng": -7.9811, "cost": 1200},
    "casablanca": {"lat": 33.5731, "lng": -7.5898, "cost": 1300},
    "accra": {"lat": 5.6037, "lng": -0.1870, "cost": 1400},
    "nairobi": {"lat": -1.2921, "lng": 36.8219, "cost": 1300},
    "kigali": {"lat": -1.9403, "lng": 29.8739, "cost": 1200},
    "lagos": {"lat": 6.5244, "lng": 3.3792, "cost": 1500},
    "dubai": {"lat": 25.2048, "lng": 55.2708, "cost": 3000},
    "telaviv": {"lat": 32.0853, "lng": 34.7818, "cost": 3200},
    "antalya": {"lat": 36.8969, "lng": 30.7133, "cost": 1400},
    "istanbul": {"lat": 41.0082, "lng": 28.9784, "cost": 1500},
    "sydney": {"lat": -33.8688, "lng": 151.2093, "cost": 3000},
    "melbourne": {"lat": -37.8136, "lng": 144.9631, "cost": 2800},
    "auckland": {"lat": -36.8509, "lng": 174.7645, "cost": 2600},
}

def update_cities_data():
    with open('cities-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # For each city in our data, add the new fields after the scores block
    for city_id, data in CITY_DATA.items():
        # Pattern to find the city and its scores block
        pattern = rf'(id: "{city_id}".*?scores: \{{[^}}]+\}})'

        def replacer(match):
            original = match.group(1)
            # Add the new fields after scores
            new_fields = f''',
    costPerMonth: {data['cost']},
    lat: {data['lat']},
    lng: {data['lng']}'''
            return original + new_fields

        content = re.sub(pattern, replacer, content, flags=re.DOTALL)

    with open('cities-data.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated {len(CITY_DATA)} cities with cost and coordinate data")

if __name__ == '__main__':
    update_cities_data()

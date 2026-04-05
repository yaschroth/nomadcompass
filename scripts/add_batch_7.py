#!/usr/bin/env python3
"""Add restaurant data for batch 7 (60 cities) - More Europe."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RESTAURANTS_FILE = BASE_DIR / "data" / "restaurants.json"

BATCH_7_DATA = {
    "dresden": [
        {"name": "Sophienkeller", "type": "German Traditional", "rating": 4.4, "reviews": 2500, "description": "Medieval-themed cellar restaurant. Traditional Saxon dishes served by costumed staff.", "booking_url": "https://www.google.com/maps/search/Sophienkeller+Dresden", "price": "$$"},
        {"name": "Bean & Beluga", "type": "German Fine Dining", "rating": 4.7, "reviews": 800, "description": "Michelin-starred contemporary cuisine. One of eastern Germany's finest.", "booking_url": "https://www.google.com/maps/search/Bean+and+Beluga+Dresden", "price": "$$$$"},
        {"name": "Schützengarten", "type": "German", "rating": 4.3, "reviews": 1500, "description": "Traditional beer garden with Saxon specialties. Great outdoor dining.", "booking_url": "https://www.google.com/maps/search/Schuetzengarten+Dresden", "price": "$$"}
    ],
    "leipzig": [
        {"name": "Auerbachs Keller", "type": "German", "rating": 4.3, "reviews": 5500, "description": "Historic cellar restaurant from Goethe's Faust. Classic Saxon dishes.", "booking_url": "https://www.google.com/maps/search/Auerbachs+Keller+Leipzig", "price": "$$"},
        {"name": "Falco", "type": "Fine Dining", "rating": 4.7, "reviews": 600, "description": "Two Michelin stars atop the Westin. Panoramic views and exquisite cuisine.", "booking_url": "https://www.google.com/maps/search/Falco+Restaurant+Leipzig", "price": "$$$$"},
        {"name": "Zill's Tunnel", "type": "German Traditional", "rating": 4.4, "reviews": 1200, "description": "Historic restaurant since 1841. Traditional Saxon fare in vaulted cellar.", "booking_url": "https://www.google.com/maps/search/Zills+Tunnel+Leipzig", "price": "$$"}
    ],
    "heidelberg": [
        {"name": "Zum Roten Ochsen", "type": "German", "rating": 4.3, "reviews": 2200, "description": "Student tavern since 1703. Traditional German food with historic atmosphere.", "booking_url": "https://www.google.com/maps/search/Zum+Roten+Ochsen+Heidelberg", "price": "$$"},
        {"name": "Schnitzelbank", "type": "German", "rating": 4.4, "reviews": 1800, "description": "Cozy restaurant known for excellent schnitzels. Old town favorite.", "booking_url": "https://www.google.com/maps/search/Schnitzelbank+Heidelberg", "price": "$$"},
        {"name": "Kulturbrauerei", "type": "German Brewpub", "rating": 4.3, "reviews": 1500, "description": "Brewery restaurant with house beers. Great bratwurst and beer garden.", "booking_url": "https://www.google.com/maps/search/Kulturbrauerei+Heidelberg", "price": "$$"}
    ],
    "salzburg": [
        {"name": "St. Peter Stiftskulinarium", "type": "Austrian", "rating": 4.5, "reviews": 3200, "description": "Europe's oldest restaurant dating to 803 AD. Austrian cuisine in historic abbey.", "booking_url": "https://www.google.com/maps/search/St+Peter+Stiftskulinarium+Salzburg", "price": "$$$"},
        {"name": "Stiftskeller St. Peter", "type": "Austrian", "rating": 4.4, "reviews": 2500, "description": "Historic cellar restaurant. Mozart dined here. Traditional Austrian fare.", "booking_url": "https://www.google.com/maps/search/Stiftskeller+St+Peter+Salzburg", "price": "$$"},
        {"name": "Augustiner Braustubl", "type": "Austrian Beer Hall", "rating": 4.5, "reviews": 5500, "description": "Huge brewery beer hall since 1621. Bring your own food or buy from stalls.", "booking_url": "https://www.google.com/maps/search/Augustiner+Braustubl+Salzburg", "price": "$"}
    ],
    "innsbruck": [
        {"name": "Stiftskeller", "type": "Austrian", "rating": 4.4, "reviews": 1200, "description": "Traditional Tyrolean cuisine in historic setting. Excellent schnitzel and dumplings.", "booking_url": "https://www.google.com/maps/search/Stiftskeller+Innsbruck", "price": "$$"},
        {"name": "Ottoburg", "type": "Austrian", "rating": 4.3, "reviews": 1500, "description": "Historic restaurant in 15th century building. Traditional Tyrolean dishes.", "booking_url": "https://www.google.com/maps/search/Ottoburg+Innsbruck", "price": "$$"},
        {"name": "Die Wilderin", "type": "Modern Austrian", "rating": 4.5, "reviews": 800, "description": "Contemporary Alpine cuisine. Local ingredients, modern techniques.", "booking_url": "https://www.google.com/maps/search/Die+Wilderin+Innsbruck", "price": "$$$"}
    ],
    "graz": [
        {"name": "Aiola Upstairs", "type": "Modern Austrian", "rating": 4.5, "reviews": 1200, "description": "Rooftop restaurant on Schlossberg. Stunning views and creative cuisine.", "booking_url": "https://www.google.com/maps/search/Aiola+Upstairs+Graz", "price": "$$$"},
        {"name": "Der Steirer", "type": "Styrian", "rating": 4.4, "reviews": 1800, "description": "Traditional Styrian cuisine and wines. Excellent pumpkin seed oil dishes.", "booking_url": "https://www.google.com/maps/search/Der+Steirer+Graz", "price": "$$"},
        {"name": "Landhauskeller", "type": "Austrian", "rating": 4.3, "reviews": 1500, "description": "Historic cellar in Renaissance Landhaus. Traditional dishes in stunning vaults.", "booking_url": "https://www.google.com/maps/search/Landhauskeller+Graz", "price": "$$"}
    ],
    "basel": [
        {"name": "Cheval Blanc", "type": "French Fine Dining", "rating": 4.8, "reviews": 800, "description": "Three Michelin stars at Grand Hotel Les Trois Rois. Peter Knogl's masterful cuisine.", "booking_url": "https://www.google.com/maps/search/Cheval+Blanc+Basel", "price": "$$$$"},
        {"name": "Kunsthalle", "type": "Swiss", "rating": 4.4, "reviews": 1500, "description": "Art world hangout with Swiss and international dishes. Historic brasserie vibe.", "booking_url": "https://www.google.com/maps/search/Kunsthalle+Basel+Restaurant", "price": "$$"},
        {"name": "Markthalle", "type": "Food Hall", "rating": 4.3, "reviews": 2200, "description": "Indoor market with diverse food stalls. Great for casual international eats.", "booking_url": "https://www.google.com/maps/search/Markthalle+Basel", "price": "$$"}
    ],
    "lausanne": [
        {"name": "Anne-Sophie Pic", "type": "French Fine Dining", "rating": 4.8, "reviews": 600, "description": "Two Michelin stars from legendary chef. Elegant dining at Beau-Rivage Palace.", "booking_url": "https://www.google.com/maps/search/Anne+Sophie+Pic+Lausanne", "price": "$$$$"},
        {"name": "Eat Me", "type": "Asian Fusion", "rating": 4.4, "reviews": 1200, "description": "Popular spot for Thai and Asian dishes. Trendy atmosphere in Flon district.", "booking_url": "https://www.google.com/maps/search/Eat+Me+Lausanne", "price": "$$"},
        {"name": "Cafe de Grancy", "type": "Swiss Cafe", "rating": 4.3, "reviews": 1500, "description": "Neighborhood favorite with excellent brunch. Great terrace and local vibe.", "booking_url": "https://www.google.com/maps/search/Cafe+de+Grancy+Lausanne", "price": "$$"}
    ],
    "lucerne": [
        {"name": "Old Swiss House", "type": "Swiss", "rating": 4.5, "reviews": 2200, "description": "Famous for schnitzel cooked tableside. Swiss tradition since 1931.", "booking_url": "https://www.google.com/maps/search/Old+Swiss+House+Lucerne", "price": "$$$"},
        {"name": "Wirtshaus Galliker", "type": "Swiss Traditional", "rating": 4.4, "reviews": 1500, "description": "Family-run since 1856. Authentic Swiss dishes and cozy atmosphere.", "booking_url": "https://www.google.com/maps/search/Wirtshaus+Galliker+Lucerne", "price": "$$"},
        {"name": "Mill'Feuille", "type": "Modern European", "rating": 4.5, "reviews": 800, "description": "Creative cuisine near the lake. Excellent tasting menus and wine pairing.", "booking_url": "https://www.google.com/maps/search/Mill+Feuille+Lucerne", "price": "$$$"}
    ],
    "bologna": [
        {"name": "Osteria Francescana", "type": "Italian Fine Dining", "rating": 4.9, "reviews": 2500, "description": "Three Michelin stars, former World's Best. Massimo Bottura's legendary Modena restaurant.", "booking_url": "https://www.google.com/maps/search/Osteria+Francescana+Modena", "price": "$$$$"},
        {"name": "Trattoria Anna Maria", "type": "Bolognese", "rating": 4.5, "reviews": 4500, "description": "Classic tortellini and ragu. Photos of celebrity diners line the walls.", "booking_url": "https://www.google.com/maps/search/Trattoria+Anna+Maria+Bologna", "price": "$$"},
        {"name": "Mercato di Mezzo", "type": "Food Hall", "rating": 4.4, "reviews": 3200, "description": "Historic market turned food hall. Great for mortadella and Bolognese specialties.", "booking_url": "https://www.google.com/maps/search/Mercato+di+Mezzo+Bologna", "price": "$$"}
    ],
    "turin": [
        {"name": "Del Cambio", "type": "Piedmontese", "rating": 4.6, "reviews": 2200, "description": "Historic restaurant since 1757. Michelin-starred Piedmontese cuisine.", "booking_url": "https://www.google.com/maps/search/Del+Cambio+Turin", "price": "$$$$"},
        {"name": "Eataly Torino", "type": "Italian Food Hall", "rating": 4.4, "reviews": 8500, "description": "The original Eataly. Multiple restaurants and incredible Italian products.", "booking_url": "https://www.google.com/maps/search/Eataly+Torino", "price": "$$"},
        {"name": "Porta Palazzo", "type": "Market", "rating": 4.3, "reviews": 3500, "description": "Europe's largest open-air market. Incredible produce and street food.", "booking_url": "https://www.google.com/maps/search/Porta+Palazzo+Market+Turin", "price": "$"}
    ],
    "verona": [
        {"name": "Bottega Vini", "type": "Veronese", "rating": 4.5, "reviews": 2800, "description": "Historic wine bar since 1890. Traditional dishes with excellent Veneto wines.", "booking_url": "https://www.google.com/maps/search/Bottega+Vini+Verona", "price": "$$"},
        {"name": "Trattoria al Pompiere", "type": "Italian", "rating": 4.4, "reviews": 1800, "description": "Family-run for generations. Classic Veronese cuisine in historic center.", "booking_url": "https://www.google.com/maps/search/Trattoria+al+Pompiere+Verona", "price": "$$"},
        {"name": "Osteria Sottoriva", "type": "Italian", "rating": 4.3, "reviews": 2200, "description": "Cozy spot along the river. Great pasta and romantic atmosphere.", "booking_url": "https://www.google.com/maps/search/Osteria+Sottoriva+Verona", "price": "$$"}
    ],
    "naples": [
        {"name": "Da Michele", "type": "Pizza", "rating": 4.5, "reviews": 25000, "description": "World's most famous pizzeria since 1870. Only margherita and marinara. Worth the queue.", "booking_url": "https://www.google.com/maps/search/Da+Michele+Naples", "price": "$"},
        {"name": "Pizzeria Starita", "type": "Pizza", "rating": 4.6, "reviews": 8500, "description": "Classic Neapolitan pizza since 1901. Try the fried pizza montanara.", "booking_url": "https://www.google.com/maps/search/Pizzeria+Starita+Naples", "price": "$"},
        {"name": "Tandem", "type": "Neapolitan", "rating": 4.5, "reviews": 3200, "description": "Famous for ragu napoletano. Traditional Sunday sauce any day of the week.", "booking_url": "https://www.google.com/maps/search/Tandem+Naples", "price": "$$"}
    ],
    "bari": [
        {"name": "Terranima", "type": "Pugliese", "rating": 4.5, "reviews": 1800, "description": "Traditional Pugliese cuisine. Excellent orecchiette and local dishes.", "booking_url": "https://www.google.com/maps/search/Terranima+Bari", "price": "$$"},
        {"name": "Al Pescatore", "type": "Seafood", "rating": 4.4, "reviews": 2200, "description": "Fresh Adriatic seafood in old town. Excellent raw fish and pasta.", "booking_url": "https://www.google.com/maps/search/Al+Pescatore+Bari", "price": "$$"},
        {"name": "Il Buco", "type": "Pugliese", "rating": 4.3, "reviews": 1500, "description": "Cozy spot in historic center. Great focaccia and traditional dishes.", "booking_url": "https://www.google.com/maps/search/Il+Buco+Bari", "price": "$$"}
    ],
    "catania": [
        {"name": "Osteria Antica Marina", "type": "Sicilian Seafood", "rating": 4.6, "reviews": 3500, "description": "In the fish market. Ultra-fresh seafood in atmospheric setting.", "booking_url": "https://www.google.com/maps/search/Osteria+Antica+Marina+Catania", "price": "$$"},
        {"name": "Trattoria Catania Ruffiana", "type": "Sicilian", "rating": 4.4, "reviews": 1200, "description": "Traditional dishes near the Duomo. Excellent pasta alla norma.", "booking_url": "https://www.google.com/maps/search/Trattoria+Catania+Ruffiana", "price": "$$"},
        {"name": "Mercato del Pesce", "type": "Fish Market", "rating": 4.5, "reviews": 2800, "description": "Catania's legendary fish market. Buy fresh or eat at market stalls.", "booking_url": "https://www.google.com/maps/search/Mercato+del+Pesce+Catania", "price": "$"}
    ],
    "palma": [
        {"name": "Simply Fosh", "type": "Modern Mediterranean", "rating": 4.6, "reviews": 1500, "description": "Marc Fosh's Michelin-starred cuisine. Creative Mediterranean in historic hotel.", "booking_url": "https://www.google.com/maps/search/Simply+Fosh+Palma", "price": "$$$"},
        {"name": "Ca'n Eduardo", "type": "Seafood", "rating": 4.5, "reviews": 2200, "description": "Waterfront institution since 1943. Fresh fish with port views.", "booking_url": "https://www.google.com/maps/search/Can+Eduardo+Palma", "price": "$$$"},
        {"name": "Mercat de l'Olivar", "type": "Market", "rating": 4.4, "reviews": 3500, "description": "Palma's main market. Fresh produce and tapas bars inside.", "booking_url": "https://www.google.com/maps/search/Mercat+de+Olivar+Palma", "price": "$$"}
    ],
    "ibiza": [
        {"name": "Es Torrent", "type": "Seafood", "rating": 4.6, "reviews": 1800, "description": "Beach restaurant with fresh-off-the-boat fish. Worth the drive south.", "booking_url": "https://www.google.com/maps/search/Es+Torrent+Ibiza", "price": "$$$"},
        {"name": "La Paloma", "type": "Italian", "rating": 4.5, "reviews": 1500, "description": "Garden restaurant in San Lorenzo. Farm-to-table Italian in rural setting.", "booking_url": "https://www.google.com/maps/search/La+Paloma+Ibiza", "price": "$$$"},
        {"name": "Croissant Show", "type": "Cafe", "rating": 4.4, "reviews": 2200, "description": "Ibiza Town institution for breakfast. Great croissants and people watching.", "booking_url": "https://www.google.com/maps/search/Croissant+Show+Ibiza", "price": "$$"}
    ],
    "marbella": [
        {"name": "Skina", "type": "Spanish Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Two Michelin stars in tiny space. Exceptional Andalusian tasting menus.", "booking_url": "https://www.google.com/maps/search/Skina+Restaurant+Marbella", "price": "$$$$"},
        {"name": "Ta-Kumi", "type": "Japanese", "rating": 4.6, "reviews": 1500, "description": "Outstanding Japanese with Spanish influences. Fresh fish prepared masterfully.", "booking_url": "https://www.google.com/maps/search/Ta+Kumi+Marbella", "price": "$$$"},
        {"name": "La Pesquera de Plaza", "type": "Seafood", "rating": 4.4, "reviews": 2200, "description": "Fresh seafood in old town. Classic chiringuito experience.", "booking_url": "https://www.google.com/maps/search/La+Pesquera+de+Plaza+Marbella", "price": "$$$"}
    ],
    "cadiz": [
        {"name": "El Faro de Cadiz", "type": "Seafood", "rating": 4.6, "reviews": 3500, "description": "Legendary seafood institution. The tortillitas de camarones are essential.", "booking_url": "https://www.google.com/maps/search/El+Faro+de+Cadiz", "price": "$$$"},
        {"name": "Freiduria Las Flores", "type": "Fried Fish", "rating": 4.5, "reviews": 2200, "description": "The best fried fish in Cadiz. Paper cones of perfectly fried seafood.", "booking_url": "https://www.google.com/maps/search/Freiduria+Las+Flores+Cadiz", "price": "$"},
        {"name": "Mercado Central", "type": "Market", "rating": 4.4, "reviews": 1800, "description": "Fresh seafood market with tapas bars. Local Cadiz experience.", "booking_url": "https://www.google.com/maps/search/Mercado+Central+Cadiz", "price": "$$"}
    ],
    "granadaspain": [
        {"name": "Cunini", "type": "Seafood", "rating": 4.5, "reviews": 2800, "description": "Granada's best seafood despite being inland. Excellent fried fish and tapas.", "booking_url": "https://www.google.com/maps/search/Cunini+Granada", "price": "$$"},
        {"name": "Bodegas Castaneda", "type": "Spanish Tapas", "rating": 4.4, "reviews": 5500, "description": "Classic Granada tapas bar. Great ham, cheese, and free tapas tradition.", "booking_url": "https://www.google.com/maps/search/Bodegas+Castaneda+Granada", "price": "$$"},
        {"name": "La Fabula", "type": "Modern Spanish", "rating": 4.6, "reviews": 1200, "description": "Michelin-starred creative cuisine in Hotel Villa Oniria. Granada's finest.", "booking_url": "https://www.google.com/maps/search/La+Fabula+Granada", "price": "$$$$"}
    ],
    "girona": [
        {"name": "El Celler de Can Roca", "type": "Spanish Fine Dining", "rating": 4.9, "reviews": 3200, "description": "Three Michelin stars, twice World's Best. Roca brothers' extraordinary cuisine.", "booking_url": "https://www.google.com/maps/search/El+Celler+de+Can+Roca+Girona", "price": "$$$$"},
        {"name": "Rocambolesc", "type": "Ice Cream", "rating": 4.5, "reviews": 2500, "description": "Jordi Roca's playful ice cream shop. Creative flavors from pastry genius.", "booking_url": "https://www.google.com/maps/search/Rocambolesc+Girona", "price": "$"},
        {"name": "La Poma", "type": "Catalan", "rating": 4.4, "reviews": 1200, "description": "Traditional Catalan dishes in old town. Excellent value and quality.", "booking_url": "https://www.google.com/maps/search/La+Poma+Girona", "price": "$$"}
    ],
    "cascais": [
        {"name": "House of Wonders", "type": "Modern Portuguese", "rating": 4.5, "reviews": 1500, "description": "Creative Portuguese cuisine in beautiful setting. Great seafood dishes.", "booking_url": "https://www.google.com/maps/search/House+of+Wonders+Cascais", "price": "$$"},
        {"name": "Restaurante Mar do Inferno", "type": "Seafood", "rating": 4.4, "reviews": 1800, "description": "Clifftop restaurant with dramatic ocean views. Fresh grilled fish.", "booking_url": "https://www.google.com/maps/search/Mar+do+Inferno+Cascais", "price": "$$$"},
        {"name": "Moules & Gin", "type": "Belgian-Portuguese", "rating": 4.3, "reviews": 1200, "description": "Excellent mussels and Portuguese seafood. Great gin selection too.", "booking_url": "https://www.google.com/maps/search/Moules+and+Gin+Cascais", "price": "$$"}
    ],
    "coimbra": [
        {"name": "Zé Manel dos Ossos", "type": "Portuguese", "rating": 4.5, "reviews": 2200, "description": "Tiny spot famous for hearty Portuguese food. Students and locals pack in.", "booking_url": "https://www.google.com/maps/search/Ze+Manel+dos+Ossos+Coimbra", "price": "$"},
        {"name": "Arcadas da Capela", "type": "Portuguese Fine Dining", "rating": 4.6, "reviews": 800, "description": "Elegant dining in historic chapel. Refined Portuguese cuisine.", "booking_url": "https://www.google.com/maps/search/Arcadas+da+Capela+Coimbra", "price": "$$$"},
        {"name": "Fangas Mercearia Bar", "type": "Wine Bar", "rating": 4.4, "reviews": 1500, "description": "Wine bar with excellent petiscos. Great selection of Portuguese wines.", "booking_url": "https://www.google.com/maps/search/Fangas+Mercearia+Bar+Coimbra", "price": "$$"}
    ],
    "funchal": [
        {"name": "Il Gallo d'Oro", "type": "Portuguese Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Two Michelin stars at Cliff Bay Hotel. Benoît Sinthon's exceptional cuisine.", "booking_url": "https://www.google.com/maps/search/Il+Gallo+d+Oro+Funchal", "price": "$$$$"},
        {"name": "Mercado dos Lavradores", "type": "Market", "rating": 4.5, "reviews": 5500, "description": "Colorful market with exotic fruits and fish. Essential Funchal experience.", "booking_url": "https://www.google.com/maps/search/Mercado+dos+Lavradores+Funchal", "price": "$"},
        {"name": "Gaviao Novo", "type": "Portuguese", "rating": 4.4, "reviews": 1800, "description": "Traditional Madeiran dishes. Try the espetada (beef skewers) and bolo do caco.", "booking_url": "https://www.google.com/maps/search/Gaviao+Novo+Funchal", "price": "$$"}
    ],
    "pontadelgada": [
        {"name": "A Tasca", "type": "Azorean", "rating": 4.5, "reviews": 1500, "description": "Traditional Azorean cuisine. Excellent lapas (limpets) and local fish.", "booking_url": "https://www.google.com/maps/search/A+Tasca+Ponta+Delgada", "price": "$$"},
        {"name": "Rotas da Ilha Verde", "type": "Azorean", "rating": 4.4, "reviews": 1200, "description": "Regional dishes with volcanic influence. Try the cozido das Furnas.", "booking_url": "https://www.google.com/maps/search/Rotas+da+Ilha+Verde+Ponta+Delgada", "price": "$$"},
        {"name": "Mercado da Graca", "type": "Food Hall", "rating": 4.3, "reviews": 800, "description": "Renovated market with local food stalls. Great for sampling Azorean products.", "booking_url": "https://www.google.com/maps/search/Mercado+da+Graca+Ponta+Delgada", "price": "$$"}
    ],
    "brighton": [
        {"name": "64 Degrees", "type": "Modern British", "rating": 4.6, "reviews": 1500, "description": "Innovative small plates from open kitchen. One of Brighton's best.", "booking_url": "https://www.google.com/maps/search/64+Degrees+Brighton", "price": "$$$"},
        {"name": "Riddle & Finns", "type": "Seafood", "rating": 4.5, "reviews": 2200, "description": "Champagne and oyster bar on the beach. Fresh seafood and great wines.", "booking_url": "https://www.google.com/maps/search/Riddle+and+Finns+Brighton", "price": "$$$"},
        {"name": "The Lanes", "type": "Street Food", "rating": 4.4, "reviews": 3500, "description": "Historic quarter with diverse eateries. Excellent casual dining options.", "booking_url": "https://www.google.com/maps/search/The+Lanes+Brighton+Food", "price": "$$"}
    ],
    "bristol": [
        {"name": "Paco Tapas", "type": "Spanish", "rating": 4.6, "reviews": 1800, "description": "Michelin-starred tapas from Peter Sanchez-Iglesias. Outstanding Spanish flavors.", "booking_url": "https://www.google.com/maps/search/Paco+Tapas+Bristol", "price": "$$$"},
        {"name": "St Nicholas Market", "type": "Food Market", "rating": 4.5, "reviews": 4500, "description": "Historic covered market with diverse food stalls. Great for lunch.", "booking_url": "https://www.google.com/maps/search/St+Nicholas+Market+Bristol", "price": "$"},
        {"name": "Bulrush", "type": "Modern British", "rating": 4.5, "reviews": 800, "description": "Tasting menus celebrating British ingredients. One of Bristol's finest.", "booking_url": "https://www.google.com/maps/search/Bulrush+Bristol", "price": "$$$"}
    ],
    "glasgow": [
        {"name": "Cail Bruich", "type": "Scottish Fine Dining", "rating": 4.7, "reviews": 1200, "description": "Michelin-starred modern Scottish. Lorna McNee's exceptional cuisine.", "booking_url": "https://www.google.com/maps/search/Cail+Bruich+Glasgow", "price": "$$$$"},
        {"name": "The Gannet", "type": "Scottish", "rating": 4.5, "reviews": 1800, "description": "Scottish produce in relaxed setting. Excellent whisky selection.", "booking_url": "https://www.google.com/maps/search/The+Gannet+Glasgow", "price": "$$$"},
        {"name": "Topolabamba", "type": "Mexican", "rating": 4.4, "reviews": 2500, "description": "Vibrant Mexican cantina. Great tacos and margaritas.", "booking_url": "https://www.google.com/maps/search/Topolabamba+Glasgow", "price": "$$"}
    ],
    "galway": [
        {"name": "Aniar", "type": "Modern Irish", "rating": 4.7, "reviews": 800, "description": "Michelin-starred wild Atlantic cuisine. Foraging-focused tasting menus.", "booking_url": "https://www.google.com/maps/search/Aniar+Restaurant+Galway", "price": "$$$$"},
        {"name": "Kai", "type": "Irish", "rating": 4.5, "reviews": 1500, "description": "Farm-to-table Irish cooking. Local ingredients beautifully prepared.", "booking_url": "https://www.google.com/maps/search/Kai+Restaurant+Galway", "price": "$$$"},
        {"name": "McDonagh's", "type": "Fish & Chips", "rating": 4.4, "reviews": 3200, "description": "Family-run since 1902. Best fish and chips in the west of Ireland.", "booking_url": "https://www.google.com/maps/search/McDonaghs+Galway", "price": "$$"}
    ],
    "bruges": [
        {"name": "De Karmeliet", "type": "Belgian Fine Dining", "rating": 4.6, "reviews": 800, "description": "Three Michelin stars from Geert Van Hecke. Exceptional Belgian haute cuisine.", "booking_url": "https://www.google.com/maps/search/De+Karmeliet+Bruges", "price": "$$$$"},
        {"name": "De Halve Maan", "type": "Belgian Beer", "rating": 4.5, "reviews": 5500, "description": "Historic brewery with restaurant. Great beer and Belgian dishes.", "booking_url": "https://www.google.com/maps/search/De+Halve+Maan+Bruges", "price": "$$"},
        {"name": "That's Toast", "type": "Cafe", "rating": 4.4, "reviews": 1200, "description": "Popular brunch spot with creative toasts. Great coffee and casual vibe.", "booking_url": "https://www.google.com/maps/search/Thats+Toast+Bruges", "price": "$$"}
    ],
    "maastricht": [
        {"name": "Beluga Loves You", "type": "Fine Dining", "rating": 4.6, "reviews": 800, "description": "Michelin-starred modern cuisine. Creative dishes in stylish setting.", "booking_url": "https://www.google.com/maps/search/Beluga+Loves+You+Maastricht", "price": "$$$$"},
        {"name": "Cafe Sjiek", "type": "Dutch", "rating": 4.4, "reviews": 1500, "description": "Traditional brown cafe with Limburgian dishes. Cozy and authentic.", "booking_url": "https://www.google.com/maps/search/Cafe+Sjiek+Maastricht", "price": "$$"},
        {"name": "Witloof", "type": "Belgian-Dutch", "rating": 4.3, "reviews": 1200, "description": "Good mussels and Belgian classics. Popular with locals.", "booking_url": "https://www.google.com/maps/search/Witloof+Maastricht", "price": "$$"}
    ],
    "eindhoven": [
        {"name": "De Karpendonkse Hoeve", "type": "Dutch Fine Dining", "rating": 4.6, "reviews": 800, "description": "Two Michelin stars in scenic location. Exceptional modern cuisine.", "booking_url": "https://www.google.com/maps/search/De+Karpendonkse+Hoeve+Eindhoven", "price": "$$$$"},
        {"name": "Kazerne", "type": "Modern European", "rating": 4.4, "reviews": 1200, "description": "Design hotel restaurant with creative menu. Industrial chic setting.", "booking_url": "https://www.google.com/maps/search/Kazerne+Restaurant+Eindhoven", "price": "$$$"},
        {"name": "Down Town Gourmet Market", "type": "Food Hall", "rating": 4.3, "reviews": 1800, "description": "Modern food hall with diverse options. Great for casual dining.", "booking_url": "https://www.google.com/maps/search/Down+Town+Gourmet+Market+Eindhoven", "price": "$$"}
    ],
    "bergen": [
        {"name": "Lysverket", "type": "Nordic", "rating": 4.6, "reviews": 1200, "description": "Modern Nordic in art museum. Christopher Haatuft's creative cuisine.", "booking_url": "https://www.google.com/maps/search/Lysverket+Bergen", "price": "$$$"},
        {"name": "Fish Market (Fisketorget)", "type": "Seafood", "rating": 4.4, "reviews": 5500, "description": "Famous fish market since 1200s. Fresh seafood and local specialties.", "booking_url": "https://www.google.com/maps/search/Fish+Market+Bergen", "price": "$$"},
        {"name": "Pingvinen", "type": "Norwegian", "rating": 4.4, "reviews": 1800, "description": "Traditional Norwegian comfort food. Great for local dishes.", "booking_url": "https://www.google.com/maps/search/Pingvinen+Bergen", "price": "$$"}
    ],
    "gothenburg": [
        {"name": "Koka", "type": "Nordic", "rating": 4.7, "reviews": 1200, "description": "Two Michelin stars of modern Nordic cuisine. Excellent tasting menus.", "booking_url": "https://www.google.com/maps/search/Koka+Restaurant+Gothenburg", "price": "$$$$"},
        {"name": "Feskekörka", "type": "Fish Market", "rating": 4.5, "reviews": 3500, "description": "Fish church market hall. Fresh seafood and restaurants inside.", "booking_url": "https://www.google.com/maps/search/Feskekorka+Gothenburg", "price": "$$"},
        {"name": "Sjöbaren", "type": "Seafood", "rating": 4.4, "reviews": 1500, "description": "Casual seafood spot in Haga. Excellent fish and chips and shellfish.", "booking_url": "https://www.google.com/maps/search/Sjobaren+Gothenburg", "price": "$$"}
    ],
    "malmo": [
        {"name": "Vollmers", "type": "Nordic Fine Dining", "rating": 4.7, "reviews": 800, "description": "Two Michelin stars in converted pharmacy. Exceptional Scandinavian cuisine.", "booking_url": "https://www.google.com/maps/search/Vollmers+Malmo", "price": "$$$$"},
        {"name": "Bastard", "type": "European", "rating": 4.4, "reviews": 1800, "description": "Relaxed fine dining from nose to tail. Great wine list.", "booking_url": "https://www.google.com/maps/search/Bastard+Restaurant+Malmo", "price": "$$$"},
        {"name": "Malmö Saluhall", "type": "Food Hall", "rating": 4.3, "reviews": 2200, "description": "Modern food hall with diverse vendors. Great for casual meals.", "booking_url": "https://www.google.com/maps/search/Malmo+Saluhall", "price": "$$"}
    ],
    "aarhus": [
        {"name": "Gastrome", "type": "Nordic Fine Dining", "rating": 4.7, "reviews": 600, "description": "Michelin-starred Nordic cuisine. Wassim Hallal's exceptional tasting menus.", "booking_url": "https://www.google.com/maps/search/Gastrome+Aarhus", "price": "$$$$"},
        {"name": "Aarhus Street Food", "type": "Food Hall", "rating": 4.4, "reviews": 2500, "description": "Diverse street food under one roof. Great casual dining option.", "booking_url": "https://www.google.com/maps/search/Aarhus+Street+Food", "price": "$"},
        {"name": "Domestic", "type": "Nordic", "rating": 4.5, "reviews": 800, "description": "Michelin-starred restaurant with sustainable focus. Local ingredients elevated.", "booking_url": "https://www.google.com/maps/search/Domestic+Restaurant+Aarhus", "price": "$$$"}
    ],
    "tampere": [
        {"name": "Bertha", "type": "Modern Finnish", "rating": 4.5, "reviews": 800, "description": "Innovative Finnish cuisine in old customs house. Great tasting menus.", "booking_url": "https://www.google.com/maps/search/Bertha+Tampere", "price": "$$$"},
        {"name": "Plevna", "type": "Finnish Brewpub", "rating": 4.4, "reviews": 2200, "description": "Brewery restaurant in old textile factory. House beers and Finnish food.", "booking_url": "https://www.google.com/maps/search/Plevna+Tampere", "price": "$$"},
        {"name": "Kauppahalli", "type": "Market Hall", "rating": 4.3, "reviews": 1500, "description": "Historic market hall with local vendors. Great for Finnish specialties.", "booking_url": "https://www.google.com/maps/search/Kauppahalli+Tampere", "price": "$$"}
    ],
    "tartu": [
        {"name": "Holm", "type": "Modern Estonian", "rating": 4.5, "reviews": 600, "description": "Creative Estonian cuisine using local ingredients. Tartu's finest dining.", "booking_url": "https://www.google.com/maps/search/Holm+Restaurant+Tartu", "price": "$$$"},
        {"name": "Polpo", "type": "Italian", "rating": 4.4, "reviews": 800, "description": "Quality Italian food in university town. Great pasta and pizzas.", "booking_url": "https://www.google.com/maps/search/Polpo+Restaurant+Tartu", "price": "$$"},
        {"name": "Werner", "type": "Estonian Cafe", "rating": 4.3, "reviews": 1200, "description": "Historic cafe since 1895. Estonian pastries and coffee culture.", "booking_url": "https://www.google.com/maps/search/Werner+Cafe+Tartu", "price": "$"}
    ],
    "kaunas": [
        {"name": "Uoksas", "type": "Modern Lithuanian", "rating": 4.5, "reviews": 800, "description": "Creative Lithuanian cuisine. One of the best restaurants in Kaunas.", "booking_url": "https://www.google.com/maps/search/Uoksas+Kaunas", "price": "$$$"},
        {"name": "Berneliu Uzeiga", "type": "Lithuanian", "rating": 4.3, "reviews": 1200, "description": "Traditional Lithuanian dishes. Cozy atmosphere in old town.", "booking_url": "https://www.google.com/maps/search/Berneliu+Uzeiga+Kaunas", "price": "$$"},
        {"name": "Avocado", "type": "Vegetarian", "rating": 4.4, "reviews": 600, "description": "Popular vegetarian spot. Creative meat-free dishes in hip setting.", "booking_url": "https://www.google.com/maps/search/Avocado+Kaunas", "price": "$$"}
    ],
    "klaipeda": [
        {"name": "Stora Antis", "type": "Lithuanian", "rating": 4.4, "reviews": 800, "description": "Traditional Lithuanian cuisine in old town. Great cepelinai and local dishes.", "booking_url": "https://www.google.com/maps/search/Stora+Antis+Klaipeda", "price": "$$"},
        {"name": "Momo Grill", "type": "Grill", "rating": 4.3, "reviews": 600, "description": "Popular spot for grilled meats and fish. Casual atmosphere.", "booking_url": "https://www.google.com/maps/search/Momo+Grill+Klaipeda", "price": "$$"},
        {"name": "Friedricho Pasaza", "type": "European", "rating": 4.3, "reviews": 500, "description": "Passage with cafes and restaurants. Good for casual dining.", "booking_url": "https://www.google.com/maps/search/Friedricho+Pasaza+Klaipeda", "price": "$$"}
    ],
    "kosice": [
        {"name": "Med Malina", "type": "Slovak", "rating": 4.5, "reviews": 1200, "description": "Modern Slovak cuisine in historic center. Creative dishes with local ingredients.", "booking_url": "https://www.google.com/maps/search/Med+Malina+Kosice", "price": "$$"},
        {"name": "12 Apoštolov", "type": "Slovak Traditional", "rating": 4.4, "reviews": 800, "description": "Traditional dishes in medieval cellar. Great bryndzové halušky.", "booking_url": "https://www.google.com/maps/search/12+Apostolov+Kosice", "price": "$$"},
        {"name": "Karczma Mlyn", "type": "Polish-Slovak", "rating": 4.3, "reviews": 600, "description": "Rustic spot with hearty dishes. Good for meat and dumplings.", "booking_url": "https://www.google.com/maps/search/Karczma+Mlyn+Kosice", "price": "$$"}
    ],
    "bratislava": [
        {"name": "Albrecht", "type": "Modern European", "rating": 4.6, "reviews": 800, "description": "Michelin-starred castle restaurant. Outstanding views and cuisine.", "booking_url": "https://www.google.com/maps/search/Albrecht+Restaurant+Bratislava", "price": "$$$$"},
        {"name": "Slovak Pub", "type": "Slovak", "rating": 4.3, "reviews": 5500, "description": "Huge portions of Slovak classics. Touristy but fun atmosphere.", "booking_url": "https://www.google.com/maps/search/Slovak+Pub+Bratislava", "price": "$$"},
        {"name": "UFO", "type": "International", "rating": 4.4, "reviews": 3200, "description": "Restaurant atop the UFO bridge tower. Panoramic city views.", "booking_url": "https://www.google.com/maps/search/UFO+Restaurant+Bratislava", "price": "$$$"}
    ],
    "sibiu": [
        {"name": "Crama Sibiul Vechi", "type": "Romanian", "rating": 4.5, "reviews": 1800, "description": "Traditional Transylvanian cuisine in historic cellar. Excellent local dishes.", "booking_url": "https://www.google.com/maps/search/Crama+Sibiul+Vechi+Sibiu", "price": "$$"},
        {"name": "Kulinarium", "type": "Romanian Fine Dining", "rating": 4.6, "reviews": 600, "description": "Upscale Romanian cuisine in elegant setting. Creative local dishes.", "booking_url": "https://www.google.com/maps/search/Kulinarium+Sibiu", "price": "$$$"},
        {"name": "La Turn", "type": "Romanian", "rating": 4.4, "reviews": 1200, "description": "Great views from old tower. Traditional dishes with modern touch.", "booking_url": "https://www.google.com/maps/search/La+Turn+Sibiu", "price": "$$"}
    ],
    "brasov": [
        {"name": "Sergiana", "type": "Romanian Traditional", "rating": 4.4, "reviews": 3500, "description": "Traditional Romanian in atmospheric setting. Great sarmale and mici.", "booking_url": "https://www.google.com/maps/search/Sergiana+Brasov", "price": "$$"},
        {"name": "Casa Romaneasca", "type": "Romanian", "rating": 4.3, "reviews": 1800, "description": "Authentic Romanian dishes in old town. Good value traditional food.", "booking_url": "https://www.google.com/maps/search/Casa+Romaneasca+Brasov", "price": "$$"},
        {"name": "Bistro de l'Arte", "type": "European", "rating": 4.5, "reviews": 1200, "description": "Eclectic menu in artistic space. Popular brunch spot.", "booking_url": "https://www.google.com/maps/search/Bistro+de+l+Arte+Brasov", "price": "$$"}
    ],
    "timisoara": [
        {"name": "Casa Bunicii 2", "type": "Romanian", "rating": 4.5, "reviews": 2200, "description": "Traditional Romanian grandma cooking. Enormous portions of comfort food.", "booking_url": "https://www.google.com/maps/search/Casa+Bunicii+2+Timisoara", "price": "$$"},
        {"name": "Sabres", "type": "Modern European", "rating": 4.4, "reviews": 800, "description": "Contemporary cuisine in stylish setting. One of Timisoara's best.", "booking_url": "https://www.google.com/maps/search/Sabres+Restaurant+Timisoara", "price": "$$$"},
        {"name": "La Capite", "type": "Romanian", "rating": 4.3, "reviews": 1500, "description": "Cozy spot with great Romanian dishes. Excellent soups and grills.", "booking_url": "https://www.google.com/maps/search/La+Capite+Timisoara", "price": "$$"}
    ],
    "varna": [
        {"name": "Staria Chinar", "type": "Bulgarian", "rating": 4.4, "reviews": 1500, "description": "Traditional Bulgarian under ancient tree. Great seafood and grills.", "booking_url": "https://www.google.com/maps/search/Staria+Chinar+Varna", "price": "$$"},
        {"name": "Morsko Oko", "type": "Seafood", "rating": 4.3, "reviews": 1200, "description": "Beachfront seafood restaurant. Fresh Black Sea fish and views.", "booking_url": "https://www.google.com/maps/search/Morsko+Oko+Varna", "price": "$$"},
        {"name": "Mr. Baba", "type": "Bulgarian", "rating": 4.4, "reviews": 800, "description": "Traditional dishes with garden seating. Excellent shopska salad.", "booking_url": "https://www.google.com/maps/search/Mr+Baba+Varna", "price": "$$"}
    ],
    "novisad": [
        {"name": "Fish i Zelenish", "type": "Seafood", "rating": 4.5, "reviews": 1200, "description": "Fresh fish beautifully prepared. One of Serbia's best seafood spots.", "booking_url": "https://www.google.com/maps/search/Fish+i+Zelenish+Novi+Sad", "price": "$$$"},
        {"name": "Veliki", "type": "Serbian", "rating": 4.4, "reviews": 800, "description": "Modern Serbian cuisine in lovely setting. Creative local dishes.", "booking_url": "https://www.google.com/maps/search/Veliki+Novi+Sad", "price": "$$"},
        {"name": "Lazin Salas", "type": "Serbian Traditional", "rating": 4.3, "reviews": 1500, "description": "Traditional farmhouse restaurant. Great for Serbian countryside experience.", "booking_url": "https://www.google.com/maps/search/Lazin+Salas+Novi+Sad", "price": "$$"}
    ],
    "mostar": [
        {"name": "Hindin Han", "type": "Bosnian", "rating": 4.5, "reviews": 2200, "description": "Traditional dishes with bridge views. One of Mostar's best spots.", "booking_url": "https://www.google.com/maps/search/Hindin+Han+Mostar", "price": "$$"},
        {"name": "Tima-Irma", "type": "Bosnian", "rating": 4.4, "reviews": 1500, "description": "Excellent local cuisine. Great dolma and Bosnian specialties.", "booking_url": "https://www.google.com/maps/search/Tima+Irma+Mostar", "price": "$$"},
        {"name": "Sadrvan", "type": "Bosnian Traditional", "rating": 4.3, "reviews": 1800, "description": "Old town restaurant with classic dishes. Good cevapi and river views.", "booking_url": "https://www.google.com/maps/search/Sadrvan+Mostar", "price": "$$"}
    ],
    "kotor": [
        {"name": "Galion", "type": "Seafood", "rating": 4.6, "reviews": 1800, "description": "Waterfront fine dining. Exceptional Adriatic seafood with bay views.", "booking_url": "https://www.google.com/maps/search/Galion+Restaurant+Kotor", "price": "$$$"},
        {"name": "Scala Santa", "type": "Mediterranean", "rating": 4.4, "reviews": 1200, "description": "Charming restaurant on old town steps. Great pasta and grilled fish.", "booking_url": "https://www.google.com/maps/search/Scala+Santa+Kotor", "price": "$$"},
        {"name": "Conte", "type": "Montenegrin", "rating": 4.3, "reviews": 800, "description": "Traditional dishes inside the walls. Good local wine selection.", "booking_url": "https://www.google.com/maps/search/Conte+Kotor", "price": "$$"}
    ],
    "ohrid": [
        {"name": "Restaurant Letna Bavca", "type": "Macedonian", "rating": 4.5, "reviews": 1200, "description": "Lake views and traditional cuisine. Famous for Ohrid trout.", "booking_url": "https://www.google.com/maps/search/Restaurant+Letna+Bavca+Ohrid", "price": "$$"},
        {"name": "Gladiator", "type": "Macedonian", "rating": 4.4, "reviews": 800, "description": "Traditional dishes with great lake views. Excellent grilled meats.", "booking_url": "https://www.google.com/maps/search/Gladiator+Ohrid", "price": "$$"},
        {"name": "Restaurant Kaneo", "type": "Seafood", "rating": 4.3, "reviews": 600, "description": "Iconic location by St. John church. Fresh trout and stunning views.", "booking_url": "https://www.google.com/maps/search/Restaurant+Kaneo+Ohrid", "price": "$$"}
    ],
    "sarande": [
        {"name": "Mare Nostrum", "type": "Seafood", "rating": 4.5, "reviews": 800, "description": "Excellent seafood on the promenade. Fresh catches daily.", "booking_url": "https://www.google.com/maps/search/Mare+Nostrum+Sarande", "price": "$$"},
        {"name": "Limani", "type": "Albanian", "rating": 4.4, "reviews": 600, "description": "Fresh fish and Albanian dishes. Waterfront dining with views.", "booking_url": "https://www.google.com/maps/search/Limani+Sarande", "price": "$$"},
        {"name": "Haxhi", "type": "Mediterranean", "rating": 4.3, "reviews": 500, "description": "Good mix of seafood and meat. Popular with locals.", "booking_url": "https://www.google.com/maps/search/Haxhi+Restaurant+Sarande", "price": "$$"}
    ],
    "prizren": [
        {"name": "Tiffany", "type": "Kosovan", "rating": 4.4, "reviews": 600, "description": "Traditional dishes in charming setting. Great river views.", "booking_url": "https://www.google.com/maps/search/Tiffany+Restaurant+Prizren", "price": "$$"},
        {"name": "Marashi", "type": "Kosovan", "rating": 4.3, "reviews": 500, "description": "Local favorite with traditional cuisine. Good value and quality.", "booking_url": "https://www.google.com/maps/search/Marashi+Prizren", "price": "$$"},
        {"name": "Shadervani Square", "type": "Cafes", "rating": 4.3, "reviews": 1200, "description": "Main square with multiple cafes. Great for coffee and people watching.", "booking_url": "https://www.google.com/maps/search/Shadervani+Square+Prizren", "price": "$"}
    ],
    "pula": [
        {"name": "Vodnjanka", "type": "Croatian", "rating": 4.5, "reviews": 1500, "description": "Traditional Istrian cuisine. Excellent truffles and seafood.", "booking_url": "https://www.google.com/maps/search/Vodnjanka+Pula", "price": "$$"},
        {"name": "Batelina", "type": "Seafood", "rating": 4.6, "reviews": 1200, "description": "Fresh fish in Banjole bay. Worth the short trip from Pula.", "booking_url": "https://www.google.com/maps/search/Batelina+Pula", "price": "$$"},
        {"name": "Jupiter", "type": "Pizza", "rating": 4.3, "reviews": 2200, "description": "Local favorite for pizza. Great value near the arena.", "booking_url": "https://www.google.com/maps/search/Pizzeria+Jupiter+Pula", "price": "$"}
    ],
    "zadar": [
        {"name": "Foša", "type": "Seafood", "rating": 4.6, "reviews": 2200, "description": "Mediterranean cuisine in stunning harbor setting. Exceptional fish.", "booking_url": "https://www.google.com/maps/search/Fosa+Restaurant+Zadar", "price": "$$$"},
        {"name": "Pet Bunara", "type": "Croatian", "rating": 4.4, "reviews": 1500, "description": "Old town restaurant with creative Dalmatian dishes. Great atmosphere.", "booking_url": "https://www.google.com/maps/search/Pet+Bunara+Zadar", "price": "$$"},
        {"name": "Na Po Ure", "type": "Seafood Bar", "rating": 4.5, "reviews": 800, "description": "Tiny seafood bar with daily catches. Standing room only but worth it.", "booking_url": "https://www.google.com/maps/search/Na+Po+Ure+Zadar", "price": "$$"}
    ],
    "bled": [
        {"name": "Vila Preseren", "type": "Slovenian Fine Dining", "rating": 4.6, "reviews": 800, "description": "Fine dining with lake views. One of Slovenia's most romantic settings.", "booking_url": "https://www.google.com/maps/search/Vila+Preseren+Bled", "price": "$$$"},
        {"name": "Gostilna Pri Planincu", "type": "Slovenian", "rating": 4.4, "reviews": 1500, "description": "Traditional Slovenian food. Excellent struklji and local dishes.", "booking_url": "https://www.google.com/maps/search/Gostilna+Pri+Planincu+Bled", "price": "$$"},
        {"name": "Bled Cream Cake (Cremeschnitte)", "type": "Dessert", "rating": 4.5, "reviews": 3200, "description": "The famous Bled cream cake at Hotel Park. A must-try local specialty.", "booking_url": "https://www.google.com/maps/search/Bled+Cream+Cake+Hotel+Park", "price": "$"}
    ],
    "piran": [
        {"name": "Hiša Bogataj", "type": "Slovenian Fine Dining", "rating": 4.6, "reviews": 600, "description": "Michelin-recommended near Piran. Outstanding Istrian cuisine.", "booking_url": "https://www.google.com/maps/search/Hisa+Bogataj+Piran", "price": "$$$"},
        {"name": "Pri Mari", "type": "Seafood", "rating": 4.5, "reviews": 1200, "description": "Fresh Adriatic seafood in old town. Charming terrace dining.", "booking_url": "https://www.google.com/maps/search/Pri+Mari+Piran", "price": "$$"},
        {"name": "Pavel 2", "type": "Seafood", "rating": 4.4, "reviews": 800, "description": "Waterfront restaurant with fresh fish. Great location and views.", "booking_url": "https://www.google.com/maps/search/Pavel+2+Piran", "price": "$$"}
    ],
    "paphos": [
        {"name": "7 St. Georges Tavern", "type": "Cypriot", "rating": 4.5, "reviews": 2200, "description": "Excellent traditional meze. Legendary for halloumi and grilled meats.", "booking_url": "https://www.google.com/maps/search/7+St+Georges+Tavern+Paphos", "price": "$$"},
        {"name": "Theo's", "type": "Seafood", "rating": 4.4, "reviews": 1800, "description": "Fresh fish on the harbor. Simple preparation, excellent quality.", "booking_url": "https://www.google.com/maps/search/Theos+Restaurant+Paphos", "price": "$$"},
        {"name": "Hondros", "type": "Cypriot Meze", "rating": 4.3, "reviews": 1200, "description": "Traditional village tavern outside town. Authentic meze experience.", "booking_url": "https://www.google.com/maps/search/Hondros+Tavern+Paphos", "price": "$$"}
    ],
    "chania": [
        {"name": "Tamam", "type": "Greek-Turkish", "rating": 4.5, "reviews": 3500, "description": "Ottoman-era building with creative Greek cuisine. One of Crete's best.", "booking_url": "https://www.google.com/maps/search/Tamam+Restaurant+Chania", "price": "$$"},
        {"name": "To Steno", "type": "Cretan", "rating": 4.4, "reviews": 1200, "description": "Traditional Cretan dishes in narrow alley. Excellent local food.", "booking_url": "https://www.google.com/maps/search/To+Steno+Chania", "price": "$$"},
        {"name": "Apostolis Taverna", "type": "Seafood", "rating": 4.3, "reviews": 1800, "description": "Waterfront seafood by the harbor. Fresh fish and great views.", "booking_url": "https://www.google.com/maps/search/Apostolis+Taverna+Chania", "price": "$$"}
    ],
    "rhodes": [
        {"name": "Mavrikos", "type": "Greek Fine Dining", "rating": 4.6, "reviews": 1500, "description": "Two generations of excellent cuisine in Lindos. One of Rhodes' best.", "booking_url": "https://www.google.com/maps/search/Mavrikos+Restaurant+Rhodes", "price": "$$$"},
        {"name": "Nireas", "type": "Seafood", "rating": 4.4, "reviews": 2200, "description": "Old town seafood institution. Fresh fish in atmospheric setting.", "booking_url": "https://www.google.com/maps/search/Nireas+Restaurant+Rhodes", "price": "$$"},
        {"name": "Ta Kardasia", "type": "Greek", "rating": 4.3, "reviews": 800, "description": "Traditional meze away from tourists. Excellent value and quality.", "booking_url": "https://www.google.com/maps/search/Ta+Kardasia+Rhodes", "price": "$$"}
    ],
    "santorini": [
        {"name": "Selene", "type": "Greek Fine Dining", "rating": 4.7, "reviews": 1500, "description": "Michelin-starred Greek cuisine. Exceptional food with caldera views.", "booking_url": "https://www.google.com/maps/search/Selene+Restaurant+Santorini", "price": "$$$$"},
        {"name": "Kapari Wine Restaurant", "type": "Greek", "rating": 4.5, "reviews": 1200, "description": "Wine-focused with outstanding food. Perfect sunset dining.", "booking_url": "https://www.google.com/maps/search/Kapari+Wine+Restaurant+Santorini", "price": "$$$"},
        {"name": "Lucky's Souvlakis", "type": "Greek Fast Food", "rating": 4.4, "reviews": 2500, "description": "Best souvlaki on the island. Quick, cheap, and delicious.", "booking_url": "https://www.google.com/maps/search/Luckys+Souvlakis+Santorini", "price": "$"}
    ]
}

def main():
    with open(RESTAURANTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    for city_id, restaurants in BATCH_7_DATA.items():
        if city_id not in data or data[city_id] == []:
            data[city_id] = restaurants
            added += 1
            print(f"Added {city_id}: {len(restaurants)} restaurants")

    with open(RESTAURANTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} cities to restaurants.json")

if __name__ == "__main__":
    main()

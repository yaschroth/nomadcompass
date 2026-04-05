# City Image Verification Checklist

This checklist tracks which city images have been verified to show the actual city (via Unsplash metadata, title, or recognizable landmarks).

**Legend:**
- ✅ Verified - Image confirmed to show the city
- ⚠️ Needs verification - Image may not show the city
- ❌ Placeholder - Using generic placeholder image

---

## Summary
- Total cities: 322 (Malta removed - was not a city)
- Placeholder images fixed: 130+ cities
- Verified images: 130+ cities
- Automatic image fetching system created
- Last updated: Current session

## Auto-fetch System

Scripts created for automatic cityscape image fetching:
- `scripts/auto_fetch_city_images.js` - Fetches images from Unsplash using download endpoint
- `scripts/apply_auto_fetched_images.js` - Applies fetched images to cities-data.js
- `scripts/auto_fetched_images.json` - Stores verified photo IDs

### How to add more cities:
1. Search for city on Unsplash (e.g., "site:unsplash.com [city] cityscape skyline")
2. Get the short ID from the URL (last part after the slug)
3. Verify the ID works: `curl -s -L -I "https://unsplash.com/photos/[shortId]/download"`
4. Extract the full photo ID from the Location header
5. Add to auto_fetched_images.json and run apply script

---

## COMPLETED TASKS

### Removed Entries
- [x] ~~Malta~~ - Removed (not a city, Valletta is the capital)

### Fixed User-Reported Issues
- [x] ✅ Bordeaux - Fixed with Place de la Bourse photo
- [x] ✅ Busan - Fixed with Haeundae Beach aerial
- [x] ✅ Seoul - Fixed with Seoul skyline at night

---

## VERIFIED CITIES (confirmed correct images)

### Europe - France
- [x] ✅ Bordeaux - Place de la Bourse
- [x] ✅ Toulouse - Place du Capitole
- [x] ✅ Montpellier - Place de la Comédie
- [x] ✅ Marseille - Vieux-Port
- [x] ✅ Nantes - Cityscape
- [x] ✅ Annecy - Lake view

### Europe - Germany
- [x] ✅ Munich - New Town Hall at dusk
- [x] ✅ Cologne - Cathedral skyline at dusk
- [x] ✅ Frankfurt - Skyline with Main river
- [x] ✅ Dresden - Skyline
- [x] ✅ Leipzig - City view
- [x] ✅ Heidelberg - Castle

### Europe - Austria & Switzerland
- [x] ✅ Salzburg - Hohensalzburg Fortress
- [x] ✅ Innsbruck - Alps view
- [x] ✅ Graz - Schlossberg
- [x] ✅ Basel - Rhine view
- [x] ✅ Lausanne - Lake view
- [x] ✅ Lucerne - Lake/mountains

### Europe - Italy
- [x] ✅ Bologna - Skyline and towers
- [x] ✅ Turin - Mole Antonelliana
- [x] ✅ Verona - Arena
- [x] ✅ Naples - Gulf of Naples with Vesuvius
- [x] ✅ Bari - Old town
- [x] ✅ Catania - Etna view

### Europe - Spain
- [x] ✅ Barcelona - Sagrada Familia
- [x] ✅ Madrid - City view
- [x] ✅ Valencia - City of Arts and Sciences
- [x] ✅ Málaga - View from Gibralfaro
- [x] ✅ Bilbao - Guggenheim Museum
- [x] ✅ Granada - Alhambra aerial
- [x] ✅ Ibiza - Old town
- [x] ✅ Marbella - Beach
- [x] ✅ Cádiz - Cathedral
- [x] ✅ Girona - River view
- [x] ✅ Palma de Mallorca - Palma Cathedral

### Europe - Portugal
- [x] ✅ Lisbon - Verified Lisbon photo
- [x] ✅ Cascais - Waterfront & beach
- [x] ✅ Ericeira - Ribeira d'Ilhas beach
- [x] ✅ Coimbra - University
- [x] ✅ Ponta Delgada - Azores view
- [x] ✅ Faro - Old town

### Europe - United Kingdom & Ireland
- [x] ✅ Brighton - Brighton Pier
- [x] ✅ Bristol - Bridge view
- [x] ✅ Glasgow - Cityscape
- [x] ✅ Galway - Streets

### Europe - Benelux
- [x] ✅ Bruges - Canals
- [x] ✅ Maastricht - Vrijthof
- [x] ✅ Eindhoven - City view

### Europe - Scandinavia
- [x] ✅ Bergen - Bryggen
- [x] ✅ Gothenburg - Harbor
- [x] ✅ Malmö - Turning Torso
- [x] ✅ Aarhus - Harbor
- [x] ✅ Tampere - Lake view

### Europe - Baltics
- [x] ✅ Tallinn - Old Town skyline
- [x] ✅ Tartu - Cityscape
- [x] ✅ Kaunas - Kaunas Castle
- [x] ✅ Klaipėda - Harbor

### Europe - Central/Eastern Europe
- [x] ✅ Split - Aerial view
- [x] ✅ Kotor - Bay of Kotor aerial view
- [x] ✅ Valletta - Grand Harbour
- [x] ✅ Bratislava - Castle view
- [x] ✅ Košice - Cathedral
- [x] ✅ Sibiu - Old town
- [x] ✅ Brașov - Black Church
- [x] ✅ Timișoara - Center
- [x] ✅ Varna - Beach
- [x] ✅ Novi Sad - Fortress
- [x] ✅ Wrocław - Market square
- [x] ✅ Thessaloniki - Waterfront

### Europe - Greece
- [x] ✅ Santorini - Oia blue domes
- [x] ✅ Rhodes - Old town

### Europe - Turkey
- [x] ✅ Istanbul - Blue Mosque with Bosphorus
- [x] ✅ Izmir - Clock tower
- [x] ✅ Cappadocia - Hot air balloons
- [x] ✅ Bodrum - Castle
- [x] ✅ Fethiye - Oludeniz beach

### Asia - Southeast Asia
- [x] ✅ Chiang Mai - Doi Suthep temple
- [x] ✅ Da Nang - Beach view
- [x] ✅ Da Lat - Highlands
- [x] ✅ Luang Prabang - Temples
- [x] ✅ Siem Reap - Angkor Wat
- [x] ✅ Kampot - River view
- [x] ✅ Malacca - Church
- [x] ✅ Kota Kinabalu - Sunset

### Asia - Philippines
- [x] ✅ Siargao - Palm trees
- [x] ✅ Palawan - Lagoons
- [x] ✅ Boracay - Beach
- [x] ✅ El Nido - Lagoons

### Asia - Indonesia
- [x] ✅ Lombok - Beaches
- [x] ✅ Bandung - City view
- [x] ✅ Nusa Penida - Cliffs

### Asia - East Asia
- [x] ✅ Tokyo - Tokyo Tower at night
- [x] ✅ Seoul - Seoul skyline at night
- [x] ✅ Busan - Haeundae Beach aerial
- [x] ✅ Osaka - Castle area
- [x] ✅ Fukuoka - Skyline

### Americas
- [x] ✅ Medellín - Skyline
- [x] ✅ Buenos Aires - Obelisco
- [x] ✅ Bogotá - Cityscape
- [x] ✅ Cartagena - Old town
- [x] ✅ Lima - Coast
- [x] ✅ Santiago - Skyline
- [x] ✅ Quito - Historic center
- [x] ✅ Cusco - Plaza de Armas
- [x] ✅ Mexico City - CDMX skyline
- [x] ✅ San Juan - Puerto Rico
- [x] ✅ Miami - Beach skyline
- [x] ✅ Seattle - Skyline with Space Needle
- [x] ✅ Portland - Skyline with Mt. Hood
- [x] ✅ Vancouver - Skyline with mountains

### Africa
- [x] ✅ Cape Town - Table Mountain
- [x] ✅ Johannesburg - Cityscape
- [x] ✅ Marrakech - Medina
- [x] ✅ Casablanca - Hassan II Mosque
- [x] ✅ Nairobi - Skyline

### Middle East
- [x] ✅ Tel Aviv - Beach & skyline
- [x] ✅ Dubai - Skyline
- [x] ✅ Abu Dhabi - Mosque
- [x] ✅ Haifa - Bahai gardens
- [x] ✅ Beirut - Cityscape
- [x] ✅ Amman - Citadel

### Oceania
- [x] ✅ Brisbane - River skyline
- [x] ✅ Gold Coast - Skyline at sunrise
- [x] ✅ Adelaide - City from hill
- [x] ✅ Byron Bay - Lighthouse

---

## REMAINING ITEMS NEEDING ATTENTION

### Cities potentially still using placeholder or shared images
Some cities may still need individual verification:
- [ ] Mostar, Ohrid, Sarandë, Prizren (Balkans)
- [ ] Pula, Zadar, Bled, Piran (Croatia/Slovenia)
- [ ] Kutaisi, Gyumri (Caucasus)
- [ ] Eilat, Aqaba, Manama (Middle East)
- [ ] Pai, Krabi (Thailand)
- [ ] Quy Nhon, Sapa (Vietnam)
- [ ] Dumaguete (Philippines)
- [ ] Surabaya, Malang, Semarang (Indonesia)
- [ ] Sucre, Cochabamba, Vilcabamba, Máncora, Huanchaco (South America)

### Known duplicate images that may still exist
Some cities may be sharing images that should be unique:
- Penang & Ho Chi Minh City
- Oaxaca & San Miguel de Allende
- Kuala Lumpur & Ipoh

---

## SCRIPT INFORMATION

The fix script is located at: `scripts/fix_placeholder_cities.js`

Contains 105+ verified city photo IDs from Unsplash with location metadata confirmation.

---

*Last updated: Current session - Fixed 105+ cities, removed Malta entry, regenerated all 322 city pages*

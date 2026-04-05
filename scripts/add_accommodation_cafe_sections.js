/**
 * Add Accommodation and Cafe sections to all city pages
 * Sections styled similar to the eat-card format
 */

const fs = require('fs');
const path = require('path');

// City-specific data for accommodations and cafes
// Format: { cityId: { name, accommodations: [...], cafes: [...] } }
const CITY_DATA = {
  tokyo: {
    accommodations: [
      { name: "Sakura House", type: "Share House", desc: "Popular share houses across Tokyo. Monthly contracts, furnished rooms, and easy setup for foreigners. Great for longer stays.", price: "From ¥70,000/month" },
      { name: "Airbnb Shibuya", type: "Apartment", desc: "Private apartments in the heart of Shibuya. Walking distance to cafes, restaurants, and the famous crossing.", price: "From ¥8,000/night" },
      { name: "Nui. Hostel", type: "Hostel", desc: "Stylish hostel in Kuramae with a trendy cafe-bar downstairs. Perfect for meeting other travelers and nomads.", price: "From ¥3,500/night" }
    ],
    cafes: [
      { name: "Starbucks Reserve Roastery", type: "Coffee Roastery", desc: "4-floor coffee experience in Nakameguro. Fast WiFi, plenty of seating, and amazing coffee. Gets busy on weekends." },
      { name: "FabCafe Tokyo", type: "Creative Cafe", desc: "Digital fabrication cafe with laser cutters and 3D printers. Great WiFi, creative crowd, and decent coffee." },
      { name: "Brooklyn Roasting Company", type: "Specialty Coffee", desc: "Spacious warehouse-style cafe near Shinagawa. Reliable WiFi, power outlets, and excellent cold brew." }
    ]
  },
  lisbon: {
    accommodations: [
      { name: "Selina Secret Garden", type: "Coliving", desc: "Popular coliving space in Alfama with coworking included. Rooftop terrace, community events, and great location.", price: "From €800/month" },
      { name: "Airbnb Baixa", type: "Apartment", desc: "Central apartments in the heart of Lisbon. Walking distance to everything. Many with traditional Portuguese tiles.", price: "From €60/night" },
      { name: "Home Lisbon Hostel", type: "Hostel", desc: "Award-winning hostel near Rossio. Family dinner every night, great atmosphere, and helpful staff.", price: "From €25/night" }
    ],
    cafes: [
      { name: "Copenhagen Coffee Lab", type: "Specialty Coffee", desc: "Scandinavian-style cafe in LX Factory. Excellent coffee, fast WiFi, and creative atmosphere. Nomad favorite." },
      { name: "Fabrica Coffee Roasters", type: "Roastery", desc: "Best specialty coffee in Lisbon. Multiple locations, laptop-friendly, and serious about their beans." },
      { name: "Dear Breakfast", type: "Brunch Cafe", desc: "All-day breakfast spot with good WiFi. Try the açaí bowls. Can get crowded but worth the wait." }
    ]
  },
  bali: {
    accommodations: [
      { name: "Outpost Coliving", type: "Coliving", desc: "Premium coliving in Ubud and Canggu. Pool, coworking, and community events. Popular with remote workers.", price: "From $800/month" },
      { name: "Airbnb Villa", type: "Villa", desc: "Private villas with pools across Bali. Best value in Canggu and Ubud. Monthly discounts available.", price: "From $30/night" },
      { name: "Kos-kosan", type: "Local Room", desc: "Budget local accommodation. Basic but cheap. Great for longer stays if you want to live like a local.", price: "From $150/month" }
    ],
    cafes: [
      { name: "Zin Cafe", type: "Nomad Hub", desc: "Purpose-built for remote workers in Canggu. Fast WiFi, AC rooms, and unlimited coffee included. Day passes available." },
      { name: "Seniman Coffee", type: "Specialty Coffee", desc: "Ubud's best coffee roaster. Beautiful space, good WiFi, and they take coffee seriously. Local beans." },
      { name: "Revolver Espresso", type: "Hidden Cafe", desc: "Hidden down an alley in Seminyak. Strong coffee, good vibes, and decent WiFi. Cash only." }
    ]
  },
  barcelona: {
    accommodations: [
      { name: "Ukio Apartments", type: "Serviced Apartment", desc: "Modern furnished apartments with flexible stays. All bills included, fast WiFi, and great locations.", price: "From €1,500/month" },
      { name: "Airbnb Eixample", type: "Apartment", desc: "Stay in the elegant Eixample district. Beautiful modernist buildings, central location, and great food nearby.", price: "From €70/night" },
      { name: "Casa Gracia", type: "Hostel", desc: "Boutique hostel near Passeig de Gràcia. Rooftop bar, social events, and stylish design.", price: "From €30/night" }
    ],
    cafes: [
      { name: "Nomad Coffee", type: "Specialty Coffee", desc: "Specialty coffee pioneers in Barcelona. Great WiFi, laptop-friendly, and serious baristas. Try the filter coffee." },
      { name: "Federal Cafe", type: "Brunch Spot", desc: "Australian-style brunch cafe in Gòtic. Good WiFi, healthy food, and friendly to laptop workers." },
      { name: "Satan's Coffee Corner", type: "Hipster Cafe", desc: "Tiny but mighty coffee spot. Excellent espresso, limited seating, but worth the visit." }
    ]
  },
  chiangmai: {
    accommodations: [
      { name: "Punspace Coliving", type: "Coliving", desc: "The original nomad coliving in Chiang Mai. Coworking included, swimming pool, and great community.", price: "From ฿15,000/month" },
      { name: "Airbnb Nimman", type: "Condo", desc: "Modern condos in the Nimman area. Walking distance to cafes, restaurants, and malls.", price: "From ฿800/night" },
      { name: "Stamps Backpackers", type: "Hostel", desc: "Social hostel in the Old City. Rooftop bar, pool, and lots of activities. Great for meeting people.", price: "From ฿300/night" }
    ],
    cafes: [
      { name: "CAMP", type: "24/7 Workspace", desc: "Free coworking at Maya Mall. 24/7 access, fast WiFi, and you only pay for food. Nomad institution." },
      { name: "Ristr8to", type: "Award-Winning", desc: "World Latte Art champion's cafe. Serious coffee, good WiFi, and nice atmosphere in Nimman." },
      { name: "Graph Cafe", type: "Hipster Cafe", desc: "Minimalist cafe with great coffee. Popular with creatives, good WiFi, and interesting space." }
    ]
  },
  medellin: {
    accommodations: [
      { name: "Selina Medellin", type: "Coliving", desc: "Coliving in El Poblado with coworking, pool, and events. Great for meeting other nomads.", price: "From $600/month" },
      { name: "Airbnb Laureles", type: "Apartment", desc: "Local neighborhood with great value. Safer than you think, excellent food scene, and authentic vibes.", price: "From $40/night" },
      { name: "Los Patios Hostel", type: "Hostel", desc: "Beautiful colonial hostel in El Poblado. Pool, bar, and social atmosphere.", price: "From $15/night" }
    ],
    cafes: [
      { name: "Pergamino", type: "Specialty Coffee", desc: "Best coffee in Medellin, arguably Colombia. Multiple locations, laptop-friendly, and serious about their craft." },
      { name: "Al Alma Cafe", type: "Work Cafe", desc: "Purpose-built for remote work. Fast WiFi, quiet zones, and good coffee. Day passes available." },
      { name: "Cafe Velvet", type: "Local Roaster", desc: "Local specialty roaster with multiple locations. Good WiFi, nice atmosphere, and great Colombian beans." }
    ]
  },
  berlin: {
    accommodations: [
      { name: "The Social Hub", type: "Coliving", desc: "Modern coliving near Alexanderplatz. Coworking included, gym, and regular community events.", price: "From €1,200/month" },
      { name: "Airbnb Kreuzberg", type: "Apartment", desc: "Stay in Berlin's coolest neighborhood. Street art, amazing food, and alternative culture.", price: "From €60/night" },
      { name: "Circus Hostel", type: "Hostel", desc: "Popular hostel in Mitte. Great breakfast, helpful staff, and central location.", price: "From €25/night" }
    ],
    cafes: [
      { name: "St. Oberholz", type: "Nomad Institution", desc: "The original Berlin nomad cafe since 2005. Two floors, fast WiFi, and you'll meet half the startup scene." },
      { name: "The Barn", type: "Specialty Coffee", desc: "Berlin's most famous specialty roaster. Multiple locations, excellent coffee, and laptop-friendly." },
      { name: "Bonanza Coffee", type: "Pioneer Roaster", desc: "Third-wave coffee pioneers. Great beans, good WiFi, and industrial-chic atmosphere." }
    ]
  },
  bangkok: {
    accommodations: [
      { name: "Hubba-To Coliving", type: "Coliving", desc: "Coworking and coliving combo in Ekkamai. Modern space, fast internet, and community events.", price: "From ฿20,000/month" },
      { name: "Airbnb Sukhumvit", type: "Condo", desc: "Modern condos along the BTS line. Gyms, pools, and easy access to everything.", price: "From ฿1,200/night" },
      { name: "Yard Hostel", type: "Hostel", desc: "Design hostel in Ari neighborhood. Quiet area, good vibes, and great local food nearby.", price: "From ฿500/night" }
    ],
    cafes: [
      { name: "Too Fast To Sleep", type: "24/7 Cafe", desc: "Open 24/7 near Siam. Fast WiFi, plenty of seating, and good for late-night work sessions." },
      { name: "Roots Coffee", type: "Specialty Coffee", desc: "Thai specialty coffee pioneers. Multiple locations, excellent beans, and laptop-friendly." },
      { name: "The Coffee Club", type: "Chain Cafe", desc: "Reliable chain with fast WiFi and AC. Not exciting but consistent and everywhere." }
    ]
  },
  mexicocity: {
    accommodations: [
      { name: "Selina Mexico City", type: "Coliving", desc: "Coliving in Roma Norte with coworking and pool. Regular events and great for meeting other nomads.", price: "From $700/month" },
      { name: "Airbnb Condesa", type: "Apartment", desc: "Tree-lined streets, amazing restaurants, and beautiful Art Deco buildings. Nomad central.", price: "From $50/night" },
      { name: "Casa Pepe", type: "Hostel", desc: "Colorful hostel in Roma with rooftop bar. Great for meeting people and central location.", price: "From $20/night" }
    ],
    cafes: [
      { name: "Blend Station", type: "Work Cafe", desc: "Designed for remote work. Fast WiFi, good coffee, and quiet atmosphere. Multiple locations." },
      { name: "Chiquitito Cafe", type: "Third Wave", desc: "Tiny specialty coffee shop in Roma. Excellent coffee, limited seating, but worth it." },
      { name: "Cafe Nin", type: "Elegant Cafe", desc: "Beautiful Art Deco cafe in Juarez. Good WiFi, great food, and stunning interior." }
    ]
  },
  prague: {
    accommodations: [
      { name: "K+K Hotel Central", type: "Hotel", desc: "Art Nouveau hotel in Old Town. Work desk in room, good WiFi, and beautiful building.", price: "From €80/night" },
      { name: "Airbnb Vinohrady", type: "Apartment", desc: "Leafy residential neighborhood. Great cafes, parks, and a more local experience.", price: "From €50/night" },
      { name: "Mosaic House", type: "Design Hostel", desc: "Eco-friendly design hostel near the river. Rooftop bar, good breakfast, and social atmosphere.", price: "From €20/night" }
    ],
    cafes: [
      { name: "Cafe Savoy", type: "Grand Cafe", desc: "Stunning Neo-Renaissance interior. Good WiFi, excellent pastries, and a step back in time." },
      { name: "EMA Espresso Bar", type: "Specialty Coffee", desc: "Small but excellent specialty coffee. Fast WiFi, friendly staff, and great espresso." },
      { name: "Cafe Lounge", type: "Work Cafe", desc: "Designed with remote workers in mind. Fast WiFi, power everywhere, and good coffee." }
    ]
  }
};

// Default data for cities not in the list
const DEFAULT_DATA = {
  accommodations: [
    { name: "Local Coliving Space", type: "Coliving", desc: "Coliving spaces are increasingly popular for digital nomads. Coworking included, community events, and flexible stays.", price: "Prices vary" },
    { name: "Airbnb Apartments", type: "Apartment", desc: "Private apartments offer flexibility and comfort. Look for places with good WiFi reviews and monthly discounts.", price: "From $40/night" },
    { name: "Hostels & Guesthouses", type: "Budget", desc: "Great for meeting other travelers and keeping costs low. Many have common areas perfect for working.", price: "From $15/night" }
  ],
  cafes: [
    { name: "Local Specialty Coffee", type: "Specialty Coffee", desc: "Every city has its specialty coffee scene. Ask locals or check NomadList for current favorites with good WiFi." },
    { name: "Hotel Lobbies", type: "Hidden Gem", desc: "Many hotel lobbies welcome non-guests. Usually have reliable WiFi, comfortable seating, and coffee service." },
    { name: "Co-working Day Passes", type: "Workspace", desc: "When cafes don't cut it, most coworking spaces offer day passes. Reliable internet and professional environment." }
  ]
};

// Get all city HTML files
const citiesDir = path.join(__dirname, '..', 'cities');
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
let skippedCount = 0;

cityFiles.forEach(filename => {
  const cityId = filename.replace('.html', '');
  const filepath = path.join(citiesDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Skip if already has cafe section
  if (content.includes('Laptop-Friendly Cafes') || content.includes('cafe-section')) {
    skippedCount++;
    return;
  }

  // Get city-specific data or use default
  const cityInfo = CITY_DATA[cityId] || DEFAULT_DATA;
  const accommodations = cityInfo.accommodations || DEFAULT_DATA.accommodations;
  const cafes = cityInfo.cafes || DEFAULT_DATA.cafes;

  // Get city name from the page
  const cityNameMatch = content.match(/<h1 class="city-hero-title">([^<]+)<\/h1>/);
  const cityName = cityNameMatch ? cityNameMatch[1] : 'this city';

  // Create accommodation section HTML
  const accommodationSection = `
    <!-- Accommodation -->
    <section class="affiliate-section accommodation-section">
      <div class="container">
        <div class="section-header">
          <h2>Where to Stay</h2>
          <p>Best accommodation options for nomads in ${cityName}</p>
        </div>
        <div class="affiliate-grid">
          ${accommodations.map(acc => `
          <article class="eat-card">
            <h3 class="eat-card-name">${acc.name}</h3>
            <div class="eat-card-type">${acc.type}${acc.price ? ` • ${acc.price}` : ''}</div>
            <p class="eat-card-description">${acc.desc}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>
          </article>`).join('')}
        </div>
      </div>
    </section>
`;

  // Create cafe section HTML
  const cafeSection = `
    <!-- Laptop-Friendly Cafes -->
    <section class="affiliate-section cafe-section">
      <div class="container">
        <div class="section-header">
          <h2>Laptop-Friendly Cafes</h2>
          <p>Best cafes to work from in ${cityName}</p>
        </div>
        <div class="affiliate-grid">
          ${cafes.map(cafe => `
          <article class="eat-card">
            <h3 class="eat-card-name">${cafe.name}</h3>
            <div class="eat-card-type">${cafe.type}</div>
            <p class="eat-card-description">${cafe.desc}</p>
            <a href="#" class="btn btn-secondary" style="width: 100%;">View on Map →</a>
          </article>`).join('')}
        </div>
      </div>
    </section>
`;

  // Find insertion point - after Categories Section
  const insertPattern = /(<!-- Categories Section -->[\s\S]*?<\/section>)\n/;

  if (insertPattern.test(content)) {
    content = content.replace(insertPattern, `$1\n${accommodationSection}${cafeSection}\n`);
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
  } else {
    console.log(`Could not find insertion point in: ${cityId}`);
    skippedCount++;
  }
});

console.log(`Updated ${updatedCount} city pages`);
console.log(`Skipped ${skippedCount} city pages`);

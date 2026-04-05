/**
 * Create individual accommodation detail pages and update city page links
 */

const fs = require('fs');
const path = require('path');

const citiesDir = path.join(__dirname, '..', 'cities');
const accommodationsDir = path.join(__dirname, '..', 'accommodations');

// Ensure accommodations directory exists
if (!fs.existsSync(accommodationsDir)) {
  fs.mkdirSync(accommodationsDir, { recursive: true });
}

// Dummy amenities and descriptions for each type
const AMENITIES = {
  coliving: ['High-Speed WiFi (100+ Mbps)', 'Dedicated Coworking Space', 'Weekly Community Events', 'Fully Equipped Kitchen', 'Laundry Facilities', 'Rooftop Terrace', '24/7 Access', 'Meeting Rooms'],
  apartment: ['High-Speed WiFi', 'Fully Equipped Kitchen', 'Washing Machine', 'Air Conditioning', 'Smart TV', 'Dedicated Workspace', 'Building Gym', 'Balcony'],
  hostel: ['Free WiFi', 'Shared Kitchen', 'Common Lounge', 'Lockers', 'Free Breakfast', 'Social Events', 'Bar/Cafe', 'Tour Desk']
};

const DESCRIPTIONS = {
  coliving: [
    'A vibrant coliving space designed specifically for digital nomads and remote workers. Our community-focused environment combines comfortable private rooms with inspiring shared spaces where you can work, connect, and thrive.',
    'More than just a place to stay – it\'s a launchpad for your remote work journey. Join a diverse community of entrepreneurs, freelancers, and remote professionals from around the world.',
    'Experience the perfect blend of productivity and community. Our thoughtfully designed spaces encourage collaboration while respecting your need for focus and privacy.'
  ],
  apartment: [
    'A stylish, fully-furnished apartment perfect for digital nomads seeking comfort and convenience. Located in a prime neighborhood with easy access to cafes, restaurants, and coworking spaces.',
    'Your home away from home with everything you need for a productive stay. Modern amenities, fast WiFi, and a dedicated workspace make this the ideal base for remote work.',
    'Thoughtfully designed living space combining local charm with modern comfort. Whether you\'re staying for a week or a month, you\'ll find everything you need right here.'
  ],
  hostel: [
    'A social hub for travelers and digital nomads alike. Our modern hostel offers comfortable accommodations, fast WiFi, and an energetic atmosphere perfect for making connections.',
    'More than just a bed – it\'s an experience. Join our vibrant community of travelers, attend our events, and discover the city with new friends from around the world.',
    'Budget-friendly without compromising on quality. Clean, comfortable, and conveniently located with all the amenities a modern traveler needs.'
  ]
};

const HIGHLIGHTS = {
  coliving: ['Perfect for stays of 1 week to 3 months', 'All-inclusive pricing with no hidden fees', 'Vetted community of remote professionals', 'Regular networking and skill-sharing events'],
  apartment: ['Ideal for both short and extended stays', 'Self-check-in available 24/7', 'Local host available for tips and recommendations', 'Monthly discounts available'],
  hostel: ['Great for solo travelers and social butterflies', 'Central location near public transport', 'Daily social activities and city tours', 'Flexible booking with free cancellation']
};

const NEARBY = [
  'Specialty Coffee Shop (2 min walk)',
  'Coworking Space (5 min walk)',
  'Supermarket (3 min walk)',
  'Public Transport (1 min walk)',
  'Restaurants & Bars (2 min walk)',
  'Park/Green Space (10 min walk)',
  'Gym/Fitness Center (5 min walk)',
  'Laundromat (4 min walk)'
];

// Generate a slug from accommodation name
function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get random items from array
function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Hash for consistent random selection
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Create accommodation detail page HTML
function createAccommodationPage(acc, cityName, cityId) {
  const hash = hashString(acc.name);
  const type = acc.type.toLowerCase();
  const amenities = AMENITIES[type] || AMENITIES.apartment;
  const description = DESCRIPTIONS[type][hash % DESCRIPTIONS[type].length];
  const highlights = HIGHLIGHTS[type] || HIGHLIGHTS.apartment;
  const nearby = getRandomItems(NEARBY, 5);

  // Generate rating
  const rating = (4.2 + (hash % 8) / 10).toFixed(1);
  const reviews = 50 + (hash % 450);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${acc.name} - ${acc.type} accommodation in ${cityName}. ${acc.desc}">

  <title>${acc.name} — ${cityName} | NomadCompass</title>

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <link rel="apple-touch-icon" href="../assets/logo-128.svg">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="../styles/base.css">
  <link rel="stylesheet" href="../styles/nav.css">
  <link rel="stylesheet" href="../styles/footer.css">

  <!-- Auth state check (prevents button flash on page load) -->
  <script>
    (function() {
      try {
        var auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
        if (auth && auth.loggedIn) {
          document.documentElement.classList.add('auth-logged-in');
        }
      } catch (e) {}
    })();
  </script>

  <style>
    body { animation: pageIn 0.4s ease-out; }
    @keyframes pageIn { from { opacity: 0; } to { opacity: 1; } }

    .acc-hero {
      position: relative;
      height: 400px;
      background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=800&fit=crop');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: var(--space-8);
    }

    .acc-hero-content {
      color: white;
      max-width: 800px;
    }

    .acc-hero-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      text-transform: uppercase;
      margin-bottom: var(--space-3);
    }

    .acc-hero-badge.coliving { background: #8e44ad; }
    .acc-hero-badge.apartment { background: #2980b9; }
    .acc-hero-badge.hostel { background: #e67e22; }

    .acc-hero h1 {
      font-size: var(--text-4xl);
      margin-bottom: var(--space-2);
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .acc-hero-location {
      font-size: var(--text-lg);
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .acc-main {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-8);
      padding: var(--space-8) 0;
    }

    @media (max-width: 900px) {
      .acc-main { grid-template-columns: 1fr; }
    }

    .acc-section {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--space-6);
    }

    .acc-section h2 {
      font-size: var(--text-xl);
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-sand);
    }

    .acc-description {
      line-height: 1.8;
      color: var(--color-charcoal);
    }

    .acc-amenities-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .acc-amenity {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--color-sand);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .acc-amenity-icon {
      width: 20px;
      height: 20px;
      color: var(--color-amber);
    }

    .acc-highlights {
      list-style: none;
      padding: 0;
    }

    .acc-highlights li {
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-sand);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .acc-highlights li:last-child { border-bottom: none; }

    .acc-highlights-icon {
      color: #27ae60;
      flex-shrink: 0;
    }

    .acc-nearby-list {
      list-style: none;
      padding: 0;
    }

    .acc-nearby-list li {
      padding: var(--space-2) 0;
      color: var(--color-charcoal);
      font-size: var(--text-sm);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .acc-sidebar {
      position: sticky;
      top: calc(var(--nav-height) + var(--space-4));
    }

    .acc-booking-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      box-shadow: var(--shadow-lg);
      border: 2px solid var(--color-sand);
    }

    .acc-price-display {
      text-align: center;
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-sand);
    }

    .acc-price-value {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--color-ink);
    }

    .acc-price-period {
      color: var(--color-stone);
      font-size: var(--text-sm);
    }

    .acc-rating-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .acc-rating-stars { color: #f59e0b; }
    .acc-rating-score { font-weight: var(--font-bold); }
    .acc-rating-count { color: var(--color-stone); font-size: var(--text-sm); }

    .acc-book-btn {
      width: 100%;
      padding: var(--space-4);
      background: var(--color-amber);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      cursor: pointer;
      transition: background var(--transition-fast);
      margin-bottom: var(--space-3);
    }

    .acc-book-btn:hover { background: var(--color-amber-dark); }

    .acc-contact-btn {
      width: 100%;
      padding: var(--space-3);
      background: transparent;
      color: var(--color-amber);
      border: 2px solid var(--color-amber);
      border-radius: var(--radius-lg);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .acc-contact-btn:hover {
      background: var(--color-amber);
      color: white;
    }

    .acc-host-info {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-sand);
      text-align: center;
    }

    .acc-host-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #fef3e2;
      color: #d68910;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
    }

    .acc-back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-amber);
      text-decoration: none;
      font-weight: var(--font-medium);
      margin-bottom: var(--space-4);
    }

    .acc-back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="../index.html" class="nav-logo">
        <img src="../assets/logo.svg" alt="" class="nav-logo-icon">
        <span class="nav-logo-nomad">Nomad</span><span class="nav-logo-accent">Compass</span>
      </a>
      <ul class="nav-links">
        <li><a href="../index.html" class="nav-link">Home</a></li>
        <li><a href="../wheel.html" class="nav-link">Wheel</a></li>
        <li><a href="../index.html#cities" class="nav-link">Cities</a></li>
        <li><a href="../rentals.html" class="nav-link">Rentals</a></li>
        <li><a href="../blog.html" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions">
        <a href="../login.html" class="nav-login">Login</a>
        <a href="../signup.html" class="btn btn-primary nav-signup">Sign Up</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu">
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="../index.html" class="nav-mobile-link">Home</a></li>
        <li><a href="../wheel.html" class="nav-mobile-link">Wheel</a></li>
        <li><a href="../index.html#cities" class="nav-mobile-link">Cities</a></li>
        <li><a href="../rentals.html" class="nav-mobile-link">Rentals</a></li>
        <li><a href="../blog.html" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions">
        <a href="../login.html" class="btn btn-secondary">Login</a>
        <a href="../signup.html" class="btn btn-primary">Sign Up</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="acc-hero">
    <div class="acc-hero-content">
      <span class="acc-hero-badge ${type}">${acc.type}</span>
      <h1>${acc.name}</h1>
      <div class="acc-hero-location">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${cityName}
      </div>
    </div>
  </section>

  <main class="container">
    <a href="../cities/${cityId}.html" class="acc-back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to ${cityName}
    </a>

    <div class="acc-main">
      <div class="acc-content">
        <!-- About -->
        <section class="acc-section">
          <h2>About This ${acc.type}</h2>
          <p class="acc-description">${description}</p>
          <p class="acc-description" style="margin-top: var(--space-4);">${acc.desc}</p>
        </section>

        <!-- Amenities -->
        <section class="acc-section">
          <h2>Amenities</h2>
          <div class="acc-amenities-grid">
            ${amenities.map(a => `
            <div class="acc-amenity">
              <svg class="acc-amenity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ${a}
            </div>`).join('')}
          </div>
        </section>

        <!-- Highlights -->
        <section class="acc-section">
          <h2>Why Nomads Love It</h2>
          <ul class="acc-highlights">
            ${highlights.map(h => `
            <li>
              <svg class="acc-highlights-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              ${h}
            </li>`).join('')}
          </ul>
        </section>

        <!-- Nearby -->
        <section class="acc-section">
          <h2>What's Nearby</h2>
          <ul class="acc-nearby-list">
            ${nearby.map(n => `
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${n}
            </li>`).join('')}
          </ul>
        </section>
      </div>

      <aside class="acc-sidebar">
        <div class="acc-booking-card">
          <div class="acc-price-display">
            <div class="acc-price-value">${acc.price}</div>
            <div class="acc-price-period">Prices may vary by season</div>
          </div>

          <div class="acc-rating-display">
            <span class="acc-rating-stars">★★★★★</span>
            <span class="acc-rating-score">${rating}</span>
            <span class="acc-rating-count">(${reviews} reviews)</span>
          </div>

          <button class="acc-book-btn">Check Availability</button>
          <button class="acc-contact-btn">Contact Host</button>

          <div class="acc-host-info">
            <span class="acc-host-badge">✓ Verified Host</span>
            <p style="margin-top: var(--space-2); font-size: var(--text-sm); color: var(--color-stone);">
              Usually responds within 2 hours
            </p>
          </div>
        </div>
      </aside>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="../index.html" class="footer-logo">NomadCompass</a>
          <p class="footer-tagline">Find your perfect destination for remote work and adventure.</p>
        </div>
        <div class="footer-links">
          <h4>Explore</h4>
          <ul>
            <li><a href="../index.html#cities">All Cities</a></li>
            <li><a href="../wheel.html">City Finder</a></li>
            <li><a href="../blog.html">Blog</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 NomadCompass. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    // Nav toggle
    document.getElementById('navToggle').addEventListener('click', function() {
      this.classList.toggle('active');
      document.getElementById('navMobile').classList.toggle('active');
    });
  </script>
</body>
</html>`;
}

// Extract accommodations from city page and create detail pages
function processCity(cityFile) {
  const cityId = cityFile.replace('.html', '');
  const cityPath = path.join(citiesDir, cityFile);
  let content = fs.readFileSync(cityPath, 'utf-8');

  // Extract city name
  const cityNameMatch = content.match(/<h1 class="city-hero-title">([^<]+)<\/h1>/);
  const cityName = cityNameMatch ? cityNameMatch[1].split(',')[0].trim() : cityId;

  // Extract accommodations from the page
  const accPattern = /<article class="eat-card">\s*<h3 class="eat-card-name">([^<]+)<\/h3>\s*<div class="eat-card-type">([^<]+)<\/div>\s*<p class="eat-card-description">([^<]+)<\/p>\s*<a href="#"/g;

  const accommodations = [];
  let match;
  let sectionStart = content.indexOf('<!-- Accommodation -->');
  let sectionEnd = content.indexOf('<!-- Laptop-Friendly Cafes -->');

  if (sectionStart === -1 || sectionEnd === -1) {
    return { cityId, created: 0 };
  }

  const accSection = content.substring(sectionStart, sectionEnd);

  while ((match = accPattern.exec(accSection)) !== null) {
    const [, name, typePrice, desc] = match;
    const [type, price] = typePrice.split(' • ');
    accommodations.push({ name, type: type.trim(), price: price ? price.trim() : '', desc });
  }

  // Create detail pages and update links
  accommodations.forEach(acc => {
    const slug = `${cityId}-${slugify(acc.name)}`;
    const filename = `${slug}.html`;
    const filepath = path.join(accommodationsDir, filename);

    // Create the detail page
    const pageHtml = createAccommodationPage(acc, cityName, cityId);
    fs.writeFileSync(filepath, pageHtml, 'utf-8');

    // Update link in city page
    const oldLink = `<a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>`;
    const newLink = `<a href="../accommodations/${filename}" class="btn btn-secondary" style="width: 100%;">View Details →</a>`;

    // Find and replace the specific link for this accommodation
    const accCardPattern = new RegExp(
      `(<article class="eat-card">\\s*<h3 class="eat-card-name">${acc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h3>[\\s\\S]*?)<a href="#" class="btn btn-secondary" style="width: 100%;">Find Options →</a>`,
      'g'
    );
    content = content.replace(accCardPattern, `$1<a href="../accommodations/${filename}" class="btn btn-secondary" style="width: 100%;">View Details →</a>`);
  });

  // Save updated city page
  fs.writeFileSync(cityPath, content, 'utf-8');

  return { cityId, created: accommodations.length };
}

// Process all cities
const cityFiles = fs.readdirSync(citiesDir).filter(f => f.endsWith('.html'));
let totalCreated = 0;

console.log('Creating accommodation detail pages...\n');

cityFiles.forEach(cityFile => {
  const result = processCity(cityFile);
  if (result.created > 0) {
    totalCreated += result.created;
  }
});

console.log(`\nCreated ${totalCreated} accommodation detail pages`);
console.log(`Updated ${cityFiles.length} city pages with links`);

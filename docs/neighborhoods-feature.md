# Neighborhoods Feature Implementation

This document explains how the neighborhoods guide section was implemented on city pages.

## Overview

The neighborhoods feature adds an interactive map and detailed neighborhood cards to city pages, helping nomads choose the best area to live.

## Data Structure

Neighborhood data is stored in `scripts/generate_city_pages.js` within each city's `CITY_CONTENT` object:

```javascript
"lisbon": {
  // ... other city data ...
  "neighborhoods": [
    {
      "name": "Príncipe Real",
      "tagline": "Where Lisbon's creative class comes to play",
      "description": "The undisputed king of nomad neighborhoods...",
      "vibe": "Creative & Upscale",
      "bestFor": "Creatives, entrepreneurs, and those who want to be in the center...",
      "pros": ["Best cafe density", "Beautiful garden", "Walkable", "Strong community"],
      "cons": ["Highest rents", "Touristy weekends", "Hilly terrain"],
      "lat": 38.7167,
      "lng": -9.1500,
      "priceLevel": "$$$"  // $, $$, or $$$
    },
    // ... more neighborhoods
  ]
}
```

## Files Modified

### 1. `scripts/generate_city_pages.js`

**Added Leaflet.js CSS in `<head>`:**
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
```

**Added HTML template for neighborhoods section** (before "Where to Stay"):
```html
${content.neighborhoods && content.neighborhoods.length > 0 ? `
<section class="neighborhoods-section" id="neighborhoods">
  <div class="container">
    <div class="section-header">
      <h2>Best Neighborhoods in ${escapeHtml(city.name)}</h2>
      <p>Where to base yourself for the perfect nomad experience</p>
    </div>
    <div class="neighborhoods-layout">
      <div class="neighborhoods-map-container">
        <div id="neighborhoodsMap" class="neighborhoods-map"></div>
      </div>
      <div class="neighborhoods-list">
        ${content.neighborhoods.map((n, i) => `
        <article class="neighborhood-card" data-index="${i}" data-lat="${n.lat}" data-lng="${n.lng}">
          <!-- Card content -->
        </article>`).join('')}
      </div>
    </div>
  </div>
</section>
` : ''}
```

**Added Leaflet.js and map initialization script** (before `</body>`):
```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
  (function() {
    const mapEl = document.getElementById('neighborhoodsMap');
    if (!mapEl) return;

    const neighborhoods = ${JSON.stringify(content.neighborhoods || [])};
    if (neighborhoods.length === 0) return;

    // Calculate center from all neighborhoods
    const avgLat = neighborhoods.reduce((s, n) => s + n.lat, 0) / neighborhoods.length;
    const avgLng = neighborhoods.reduce((s, n) => s + n.lng, 0) / neighborhoods.length;

    // Initialize map with CartoDB Voyager tiles
    const map = L.map('neighborhoodsMap', { scrollWheelZoom: false })
      .setView([avgLat, avgLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Custom markers and interactivity...
  })();
</script>
```

### 2. `styles/city-page.css`

Added CSS for the neighborhoods section (~150 lines):

```css
/* Main section */
.neighborhoods-section {
  padding: var(--space-16) var(--space-6);
  background: linear-gradient(180deg, var(--color-sand) 0%, var(--color-cream) 100%);
}

/* Layout - map on left, cards on right (desktop) */
.neighborhoods-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 1024px) {
  .neighborhoods-layout {
    grid-template-columns: 400px 1fr;
  }
}

/* Sticky map container */
.neighborhoods-map-container {
  position: sticky;
  top: calc(var(--nav-height) + var(--space-4));
  height: 400px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

/* Custom map markers */
.neighborhood-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-charcoal);
  border: 3px solid var(--color-white);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.neighborhood-marker.active {
  background: var(--color-terracotta);
  transform: rotate(-45deg) scale(1.2);
}

/* Neighborhood cards */
.neighborhood-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--transition-base);
}

.neighborhood-card.active {
  border-color: var(--color-terracotta);
  box-shadow: var(--shadow-lg), 0 0 0 4px rgba(192, 86, 45, 0.1);
}

/* Price level badge */
.neighborhood-price {
  font-weight: var(--font-bold);
  color: var(--color-white);
  background: var(--color-forest);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  letter-spacing: 1px;
}
```

## Adding Neighborhoods to More Cities

### Option 1: Manual Addition

Add a `neighborhoods` array to any city in `CITY_CONTENT`:

```javascript
"berlin": {
  // existing data...
  "neighborhoods": [
    {
      "name": "Kreuzberg",
      "tagline": "Berlin's rebellious heart",
      "description": "Description here...",
      "vibe": "Alternative & Creative",
      "bestFor": "Artists, night owls, budget nomads",
      "pros": ["Vibrant nightlife", "Diverse food scene", "Affordable"],
      "cons": ["Can be gritty", "Noisy at night"],
      "lat": 52.4990,
      "lng": 13.4030,
      "priceLevel": "$$"
    }
  ]
}
```

### Option 2: Python Script

Use `scripts/add_neighborhoods.py` as a template:

1. Add city data to the `NEIGHBORHOODS` dict
2. Run: `py scripts/add_neighborhoods.py`
3. Regenerate pages: `node scripts/generate_city_pages.js`

## Cities with Neighborhoods (as of implementation)

1. Lisbon (5 neighborhoods)
2. Bangkok (5 neighborhoods)
3. Bali (5 neighborhoods)
4. Medellin (5 neighborhoods)
5. Chiang Mai (5 neighborhoods)
6. Mexico City (5 neighborhoods)
7. Tokyo (5 neighborhoods)
8. Barcelona (5 neighborhoods)
9. Hanoi (5 neighborhoods)

## Interactive Features

- **Click card** → Map pans to neighborhood, marker highlights
- **Click marker** → Card highlights, popup shows name/tagline
- **Scroll wheel** disabled on map to prevent accidental zooming
- **Auto-fit bounds** shows all neighborhoods on load
- **First neighborhood** highlighted by default after 500ms

## Dependencies

- **Leaflet.js 1.9.4** - Open source mapping library
- **CartoDB Voyager** - Clean, modern map tile style (free)

No API keys required.

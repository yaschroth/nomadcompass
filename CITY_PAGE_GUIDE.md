# The Nomad HQ City Page Creation Guide

This guide documents the process for creating high-quality city detail pages for The Nomad HQ, following the pattern established with Hanoi.

---

## Quick Start Checklist

1. [ ] Copy `cities/hanoi.html` as template
2. [ ] Update `CITY_ID` constant to match city ID in `cities-data.js`
3. [ ] Update meta tags (title, description, Open Graph)
4. [ ] Find a quality hero image from Unsplash
5. [ ] Write city-specific tagline
6. [ ] Update Quick Stats (budget, WiFi, safety, nomad count, weather lat/lng, timezone)
7. [ ] Write Score Description paragraph
8. [ ] Write 10 category descriptions
9. [ ] Add 3 accommodation recommendations with images
10. [ ] Add 3 coworking space recommendations with images
11. [ ] Add 3 food/drink recommendations with images
12. [ ] Add 3 laptop-friendly cafe recommendations (if applicable)
13. [ ] Test page loads correctly with data from `cities-data.js`

---

## Page Structure (10 Sections)

### Section 1: Hero
Full-width city image with gradient overlay.

**Required elements:**
- Hero image (Unsplash, 1600x900 minimum)
- Country flag emoji
- City name (h1)
- Country name
- Tagline (1-2 sentences, evocative, specific to city)

**Example tagline:**
```
"Ancient temples, legendary street food, and Old Quarter chaos — where $800/month buys you an extraordinary life."
```

**Image guidelines:**
- Use Unsplash for high-quality, free images
- Search for iconic city landmarks, street scenes, or atmosphere
- URL format: `https://images.unsplash.com/photo-[ID]?w=1600&h=900&fit=crop`
- Alt text should describe the scene specifically

### Section 2: Quick Stats Bar
7 key metrics at a glance in a dark green bar.

**Required stats:**
1. **Monthly Budget** - Realistic nomad budget (rent + food + lifestyle)
2. **Current Weather** - Live weather fetched via API (auto-populated)
3. **Climate Type** - From city data (e.g., "Mediterranean", "Tropical")
4. **Avg. WiFi Speed** - Typical coworking/cafe speed
5. **Safety Score** - From city data (X/10)
6. **Active Nomads** - Estimated nomad population
7. **Time Difference** - Hours from user's home timezone (requires sign-in)

**Format examples:**
- `$800` / `€1,800` (use local-appropriate currency)
- `24°C ☀️` (auto-fetched)
- `Mediterranean` / `Tropical` / `Continental`
- `50 Mbps` / `100 Mbps`
- `8/10`
- `2,500+` / `5,000+`
- `+5 hrs` / `-3 hrs` / `Same time`

**HTML for Quick Stats:**
```html
<section class="quick-stats">
  <div class="container">
    <div class="quick-stats-grid">
      <div class="quick-stat">
        <div class="quick-stat-value">€1,800</div>
        <div class="quick-stat-label">Monthly Budget</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value" id="currentWeather" data-lat="38.7223" data-lng="-9.1393">--</div>
        <div class="quick-stat-label">Current Weather</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">Mediterranean</div>
        <div class="quick-stat-label">Climate Type</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">100 Mbps</div>
        <div class="quick-stat-label">Avg. WiFi Speed</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">8/10</div>
        <div class="quick-stat-label">Safety Score</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">5,000+</div>
        <div class="quick-stat-label">Active Nomads</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value" id="timeDifference" data-timezone="0">--</div>
        <div class="quick-stat-label">Time Difference</div>
      </div>
    </div>
  </div>
</section>
```

**Important attributes:**
- `id="currentWeather"` with `data-lat` and `data-lng` for weather API
- `id="timeDifference"` with `data-timezone` (city's UTC offset from `cities-data.js`)

### Section 3: Nomad Score Gauge
Animated circular gauge showing overall score with description.

**Required elements:**
- Score value (calculated automatically from category average)
- Score description headline (e.g., "A Budget Nomad's Paradise")
- Score description paragraph (2-3 sentences explaining the city's trade-offs)

**Description guidelines:**
- Lead with the city's main strengths
- Acknowledge trade-offs honestly
- End with who this city is ideal for

### Section 4: Category Breakdown
All 10 categories with progress bars and descriptions.

**This is the most important section for city-specific content.**

Each category needs a custom description (2-3 sentences) explaining:
- What the score means in this city's context
- Specific examples, neighborhoods, or tips
- Honest assessment of pros/cons

**Categories to write:**
```javascript
const CATEGORY_DESCRIPTIONS = {
  climate: "",    // Weather patterns, best months, seasonal considerations
  cost: "",       // Realistic budget breakdown, value comparison
  wifi: "",       // Speed expectations, reliable spots, infrastructure
  nightlife: "",  // Scene vibe, key areas, comparison to other cities
  nature: "",     // Nearby nature, day trips, green spaces
  safety: "",     // Main concerns, how safe it feels, tips
  food: "",       // Must-try dishes, food culture, price range
  community: "",  // Nomad scene size, meetups, where to connect
  english: "",    // Proficiency levels, where it's spoken, tips
  visa: ""        // Visa options, costs, border run info
};
```

**Example (Hanoi Climate):**
```
"Hot, humid summers (35°C+) and mild winters. The best months are October-December and March-April. Monsoon season brings heavy rains from May-September."
```

### Section 5: Where to Stay (Accommodation)
3 accommodation recommendations with images, linking to individual detail pages.

**Card structure (uses `eat-card` class):**
- Image (400x200, Unsplash image of accommodation type)
- Name
- Type + Price (e.g., "Coliving • €800-1500/month")
- Description (2-3 sentences)
- CTA button linking to detail page

**HTML Example:**
```html
<article class="eat-card">
  <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop" alt="Lisbon Nest Coliving" class="eat-card-image">
  <h3 class="eat-card-name">Lisbon Nest Coliving</h3>
  <div class="eat-card-type">Coliving • €800-1500/month</div>
  <p class="eat-card-description">Popular coliving spot with rooftop terrace and 24/7 workspace. Monthly rates available with all utilities included.</p>
  <a href="../accommodations/lisbon-lisbon-nest-coliving.html" class="btn btn-secondary" style="width: 100%;">View Details →</a>
</article>
```

**Accommodation types:**
- Coliving (community-focused, monthly rates)
- Apartment (private, flexible terms)
- Hostel (budget-friendly, social)

**Image URLs by type:**
```
Coliving:  https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop
Apartment: https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop
Hostel:    https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=200&fit=crop
```

**Guidelines:**
- Include variety: coliving, apartment, hostel
- Create corresponding detail page in `accommodations/[cityid]-[slugified-name].html`
- Use region-appropriate pricing (€ for Europe, $ for Americas, etc.)

### Section 6: Coworking Spaces
3 coworking recommendations with images.

**Card structure (uses `cowork-card` class):**
- Image (400x200, Unsplash coworking/office image)
- Name
- Day rate and monthly rate
- WiFi speed badge
- CTA button

**HTML Example:**
```html
<article class="cowork-card">
  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop" alt="WeWork Chiado" class="cowork-card-image">
  <h3 class="cowork-card-name">WeWork Chiado</h3>
  <div class="cowork-card-pricing">
    <span class="cowork-card-price">€25/day</span>
    <span class="cowork-card-monthly">€350/month</span>
  </div>
  <div class="cowork-card-wifi">
    <svg>...</svg>
    <span>200 Mbps</span>
  </div>
  <a href="#" class="btn btn-secondary" style="width: 100%;">Book a Day Pass →</a>
</article>
```

**Coworking Image URLs (use variety):**
```
https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400&h=200&fit=crop
```

**Guidelines:**
- Include variety: premium, budget, cafe-style
- Feature spaces popular with nomads
- Include realistic pricing
- WiFi speed should be accurate if known
- Each card must have an image

### Section 7: Eat & Drink
3 food/drink recommendations with images.

**Card structure (uses `eat-card` class):**
- Image (400x200, Unsplash food/restaurant image)
- Name
- Type label (Street Food / Restaurant / Cafe / Bar)
- Description (2-3 sentences with personality)
- CTA button

**HTML Example:**
```html
<article class="eat-card">
  <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop" alt="Time Out Market" class="eat-card-image">
  <h3 class="eat-card-name">Time Out Market</h3>
  <div class="eat-card-type">Food Hall</div>
  <p class="eat-card-description">Lisbon's legendary food hall brings together the city's best chefs under one roof. Perfect for indecisive eaters.</p>
  <a href="#" class="btn btn-secondary" style="width: 100%;">View on Google Maps →</a>
</article>
```

**Food/Restaurant Image URLs:**
```
https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=200&fit=crop
```

**Bar/Nightlife Image URLs:**
```
https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&h=200&fit=crop
```

**Food Hall/Market Image URLs:**
```
https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=200&fit=crop
```

**Guidelines:**
- Lead with the most iconic/unmissable spot
- Include local specialties
- Mix of cheap eats and nicer options
- Add personality — these should make people hungry
- Choose image type based on venue (bar images for bars, food hall images for markets, etc.)

**Example (Hanoi):**
```
"Pho 10 Ly Quoc Su" — Street Food Legend
"The definitive Hanoi pho experience. Rich beef broth, fresh herbs, and perfectly chewy noodles for under $2. Arrive before 8am to beat the crowds."
```

### Section 8: Laptop-Friendly Cafes
3 cafe recommendations for working remotely with images.

**Card structure (uses `eat-card` class):**
- Image (400x200, Unsplash cafe image)
- Name
- Type label (Specialty Coffee / Roastery / Brunch Spot)
- Description (2-3 sentences focusing on work-friendliness)
- CTA button

**HTML Example:**
```html
<section class="affiliate-section cafe-section">
  <div class="container">
    <div class="section-header">
      <h2>Laptop-Friendly Cafes</h2>
      <p>Best cafes to work from in [City]</p>
    </div>
    <div class="affiliate-grid">
      <article class="eat-card">
        <img src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=200&fit=crop" alt="Copenhagen Coffee Lab" class="eat-card-image">
        <h3 class="eat-card-name">Copenhagen Coffee Lab</h3>
        <div class="eat-card-type">Specialty Coffee</div>
        <p class="eat-card-description">Scandinavian-style cafe with excellent coffee, fast WiFi, and creative atmosphere. Nomad favorite.</p>
        <a href="#" class="btn btn-secondary" style="width: 100%;">View on Map →</a>
      </article>
    </div>
  </div>
</section>
```

**Cafe Image URLs:**
```
https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop
https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=200&fit=crop
```

**Guidelines:**
- Focus on work-friendly cafes (WiFi, power outlets, laptop-welcoming)
- Mention WiFi speed if known
- Note any time limits or purchase requirements
- Include a mix of quiet spots and social cafes

### Section 9: Community Voting
Interactive voting on category accuracy.

**No customization needed** — this section is entirely JavaScript-driven and uses localStorage for votes.

### Section 10: Related Cities
Shows 3 similar cities automatically.

**No customization needed** — calculated using Euclidean distance between score vectors.

---

## File Structure

```
cities/
├── hanoi.html      ← Template/reference
├── lisbon.html
├── [cityid].html   ← New city pages

accommodations/
├── lisbon-lisbon-nest-coliving.html  ← Detail pages
├── [cityid]-[slugified-name].html    ← Format: cityid-name-with-dashes.html

styles/
├── city-page.css   ← Shared city page styles (cowork-card-image, eat-card-image)

scripts/
├── auth.js                      ← Authentication handling
├── generate_city_pages.js       ← Automated page generator (creates all city pages)
├── add_cowork_food_images.js    ← Batch script to add images to existing pages

cities-data.js                   ← Central data file for all cities
```

### Automated Page Generation

The `scripts/generate_city_pages.js` script automatically generates city pages from `cities-data.js`:

```bash
node scripts/generate_city_pages.py
```

This script:
- Reads all cities from `cities-data.js`
- Generates HTML pages with Quick Stats (7 stats including weather/time)
- Creates accommodation/coworking/food sections with placeholders
- Includes weather fetching and time difference JavaScript
- Outputs to `cities/[cityid].html`

**After running the generator:**
1. Run `node scripts/add_cowork_food_images.js` to add Unsplash images
2. Customize category descriptions for each city
3. Create accommodation detail pages as needed

### City Data Structure (cities-data.js)

Each city in `cities-data.js` must have:

```javascript
{
  id: "lisbon",           // URL-safe ID (lowercase, no spaces)
  climateType: "Mediterranean",  // Climate classification
  name: "Lisbon",         // Display name
  country: "Portugal",    // Country name
  flag: "🇵🇹",            // Country flag emoji
  tagline: "...",         // 1-2 sentence evocative description
  image: "https://images.unsplash.com/photo-...",  // Hero image URL
  scores: {
    climate: 9,           // 1-10 score
    cost: 6,
    wifi: 8,
    nightlife: 8,
    nature: 7,
    safety: 8,
    food: 9,
    community: 9,
    english: 8,
    visa: 7
  },
  costPerMonth: 1800,     // Estimated monthly budget in USD
  lat: 38.7223,           // Latitude (for weather API)
  lng: -9.1393,           // Longitude (for weather API)
  timezone: 0             // UTC offset (e.g., 0 for UTC, 9 for Japan)
}
```

**Required fields for weather/time features:**
- `lat` and `lng` — Required for weather fetching
- `timezone` — Required for time difference calculation
- `climateType` — Displayed in Quick Stats

Each city page is self-contained with:
- Inline page-specific CSS (consistent across all pages)
- External stylesheets: `base.css`, `nav.css`, `footer.css`, `city-page.css`
- External data: `cities-data.js`
- External auth: `scripts/auth.js`

---

## JavaScript Configuration

The only JavaScript changes needed per city:

```javascript
// 1. City ID (must match cities-data.js)
const CITY_ID = 'hanoi';

// 2. Category descriptions (custom for each city)
const CATEGORY_DESCRIPTIONS = {
  climate: "...",
  cost: "...",
  wifi: "...",
  nightlife: "...",
  nature: "...",
  safety: "...",
  food: "...",
  community: "...",
  english: "...",
  visa: "..."
};
```

Everything else (gauge animation, voting, related cities) works automatically.

### Weather Fetching (Auto-included)

The city page template includes JavaScript to fetch live weather from the Open-Meteo API:

```javascript
// Weather fetching - uses data-lat and data-lng attributes
async function fetchWeather() {
  const el = document.getElementById('currentWeather');
  if (!el) return;
  const lat = el.dataset.lat;
  const lng = el.dataset.lng;
  if (!lat || !lng) { el.textContent = 'N/A'; return; }
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
    const data = await res.json();
    if (data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode;
      // Weather icons based on WMO codes
      const icon = code === 0 ? '☀️' : code <= 3 ? '⛅' : code <= 49 ? '☁️' : code <= 69 ? '🌧️' : code <= 79 ? '❄️' : '⛈️';
      el.textContent = `${temp}°C ${icon}`;
    }
  } catch (e) { el.textContent = 'N/A'; }
}
fetchWeather();
```

### Time Difference Calculation (Auto-included)

Calculates time difference between user's home timezone and city timezone:

```javascript
// Time difference - uses data-timezone attribute (city's UTC offset)
function calculateTimeDiff() {
  const el = document.getElementById('timeDifference');
  if (!el) return;
  const cityTz = parseInt(el.dataset.timezone);
  if (isNaN(cityTz)) { el.textContent = 'N/A'; return; }
  try {
    // Get user's timezone from localStorage (set during sign-in)
    const auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
    if (auth && auth.loggedIn && auth.timezone !== undefined) {
      const diff = cityTz - auth.timezone;
      if (diff === 0) el.textContent = 'Same time';
      else if (diff > 0) el.textContent = `+${diff} hrs`;
      else el.textContent = `${diff} hrs`;
    } else {
      el.textContent = 'Sign in';
    }
  } catch (e) { el.textContent = 'Sign in'; }
}
calculateTimeDiff();
```

**Note:** Time difference requires the user to be signed in with their timezone stored in localStorage.

---

## Meta Tags Template

```html
<meta name="description" content="[City] digital nomad guide: [key points], and where to stay in [Country]'s [descriptor].">

<title>[City], [Country] — The Nomad HQ City Guide</title>

<meta property="og:title" content="[City] Digital Nomad Guide | The Nomad HQ">
<meta property="og:description" content="Everything you need to know about living and working remotely in [City]. Cost of living, coworking spaces, neighborhoods, and visa info.">
<meta property="og:type" content="article">
<meta property="og:image" content="[Unsplash image URL with w=1200&h=630]">
```

---

## Finding Good Unsplash Images

1. Go to [unsplash.com](https://unsplash.com)
2. Search for: `[city name]`, `[city name] street`, `[city name] aerial`
3. Look for images that:
   - Show recognizable landmarks or city character
   - Have good composition with space at bottom for text overlay
   - Aren't too busy or cluttered
   - Work well with the dark gradient overlay

4. Get the image ID from the URL:
   ```
   https://unsplash.com/photos/dd1a26dda07a
                              ↑ this part
   ```

5. Build the optimized URL:
   ```
   Hero:    https://images.unsplash.com/photo-[ID]?w=1600&h=900&fit=crop
   OG:      https://images.unsplash.com/photo-[ID]?w=1200&h=630&fit=crop
   Card:    https://images.unsplash.com/photo-[ID]?w=400&h=200&fit=crop
   ```

---

## Research Tips

When writing city content, research:

1. **NomadList** — For community size, costs, scores
2. **Reddit r/digitalnomad** — For real nomad experiences
3. **Local expat blogs** — For neighborhood insights
4. **Google "digital nomad [city]"** — For coworking and community info
5. **Numbeo** — For cost of living data
6. **Speedtest** — For WiFi speed benchmarks

---

## Quality Checklist

Before publishing, verify:

- [ ] All placeholder images replaced with Unsplash
- [ ] Hero image is high quality and city-specific
- [ ] All accommodation cards have images
- [ ] All coworking cards have images
- [ ] All eat/drink cards have images (correct type: restaurant/bar/food hall)
- [ ] All `href="#"` links have `[AFFILIATE]` comments
- [ ] Category descriptions are specific, not generic
- [ ] Price ranges are realistic and current
- [ ] Tagline is evocative and memorable
- [ ] Score description matches actual scores
- [ ] Weather data attributes (data-lat, data-lng) are correct
- [ ] Timezone attribute (data-timezone) matches cities-data.js
- [ ] Page loads without JavaScript errors
- [ ] Mobile layout looks good
- [ ] All 10 categories render correctly

---

## Common Mistakes to Avoid

1. **Generic descriptions** — "Good food scene" vs "Street food heaven with $1 pho and egg coffee you can't find anywhere else"

2. **Wrong currency** — Use USD for Southeast Asia, EUR for Europe, local currency when it makes sense

3. **Outdated info** — Visa rules change frequently, verify before publishing

4. **Missing context** — Don't just say "8/10 safety", explain what that means practically

5. **Placeholder images** — Never ship with picsum.photos or placeholder.com

6. **Copy-paste errors** — Check CITY_ID matches filename and data

---

## Example: Creating Tokyo Page

1. Copy `hanoi.html` → `tokyo.html`

2. Update CITY_ID:
   ```javascript
   const CITY_ID = 'tokyo';
   ```

3. Find Unsplash image (search "tokyo shibuya" or "tokyo street"):
   ```
   https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=900&fit=crop
   ```

4. Write tagline:
   ```
   "Ultra-efficient trains, 24-hour convenience, and the world's best ramen — where ancient tradition meets relentless innovation."
   ```

5. Update Quick Stats:
   - $2,500 Monthly Budget
   - 200 Mbps Avg. WiFi
   - 10/10 Safety Score
   - 3,000+ Active Nomads
   - `data-lat="35.6762"` `data-lng="139.6503"` for weather
   - `data-timezone="9"` (UTC+9)

6. Write category descriptions (research required)...

7. Add recommendations with images:
   - **Accommodations**: 3 options with eat-card images (coliving, apartment, hostel)
   - **Coworking**: 3 spaces with cowork-card-image (WeWork, local spaces)
   - **Eat & Drink**: 3 spots with eat-card-image (ramen shop, izakaya, cafe)

8. Create accommodation detail pages in `accommodations/tokyo-[name].html`

9. Test and verify!

---

*Last updated: March 2025*
*Template version: 1.2 — Added weather fetching and time difference JavaScript code, automated page generation documentation, city data structure requirements*

# NomadCompass

NomadCompass is a decision-making tool for digital nomads that helps you find the perfect city based on your personal priorities. Use the interactive Taste Wheel to set what matters most to you, and get instant recommendations from 120+ curated destinations worldwide.

## File Structure

```
nomadcompass/
├── index.html                          # Homepage with hero and city explorer (filters, sorting)
├── wheel.html                          # Interactive Nomad Taste Wheel for city matching
├── blog.html                           # Blog index with category filtering
├── login.html                          # User login page
├── signup.html                         # User registration page
├── cities-data.js                      # Data for 120 cities with scores across 10 categories
│
├── cities/
│   └── lisbon.html                     # City detail page template (use as reference for new cities)
│
├── blog/
│   └── digital-nomad-guide-lisbon.html # Full blog article template
│
├── styles/
│   ├── base.css                        # Design system: colors, typography, spacing, utilities
│   ├── nav.css                         # Navigation component styles
│   ├── footer.css                      # Footer component styles
│   ├── blog.css                        # Blog-specific styles
│   └── auth.css                        # Login/signup page styles
│
├── scripts/
│   └── auth.js                         # Site-wide authentication state management
│
├── components/
│   ├── nav.html                        # Navigation HTML reference
│   └── footer.html                     # Footer HTML reference
│
└── design-system.md                    # Design documentation (fonts, colors, spacing)
```

## Running the Site Locally

1. Clone or download the repository
2. Open `index.html` in any modern web browser
3. Navigate using the top navigation bar

No build step or server required — it's pure HTML, CSS, and JavaScript.

## How to Add a New City

1. **Add city data** to `cities-data.js`:
   ```javascript
   {
     id: "cityname",           // lowercase, no spaces (used for URL)
     name: "City Name",        // Display name
     country: "Country",       // Country name
     flag: "🇽🇽",              // Country flag emoji
     tagline: "Short catchy description of the city.",
     image: "https://picsum.photos/seed/cityname/800/500",
     scores: {
       climate: 7,             // 0-10 scale
       cost: 8,                // Higher = more affordable
       wifi: 8,                // Internet reliability
       nightlife: 6,           // Social scene
       nature: 7,              // Access to outdoors
       safety: 8,              // Personal safety
       food: 9,                // Food quality/variety
       community: 7,           // Nomad community size
       english: 6,             // English proficiency
       visa: 8                 // Visa accessibility
     }
   }
   ```

2. **Create city detail page**:
   - Copy `cities/lisbon.html` to `cities/[cityid].html`
   - Update the `CITY_ID` constant at the top of the script section
   - Update meta tags (`<title>`, `<meta name="description">`, OG tags)
   - Update the `CITY_DATA` object with city-specific information:
     - Quick stats (monthly cost, internet speed, safety rating, nomad count)
     - Category descriptions for the breakdown section
     - Neighborhood recommendations
     - Accommodation, coworking, and restaurant recommendations

3. **Add region mapping** (if new region):
   - In `index.html`, add the city to `CITY_REGIONS` object

## How to Replace Affiliate Links

All affiliate link placeholders are marked with `/* [AFFILIATE] */` comments.

1. **Search for affiliate placeholders**:
   ```bash
   grep -r "AFFILIATE" *.html cities/*.html blog/*.html
   ```

2. **Replace each placeholder** with your actual affiliate links:
   - Hotels: Booking.com, Hotels.com, Airbnb partner links
   - Coworking: Individual space affiliate programs
   - Travel Insurance: SafetyWing, World Nomads
   - Generic tools: VPN providers, bank accounts, etc.

3. **Affiliate locations by page**:
   - `index.html` — "Book a Stay" buttons on city cards in the explorer
   - `wheel.html` — "Book a Stay" buttons on result cards
   - `cities/lisbon.html` — Stay, coworking, and restaurant sections
   - `blog.html` — Sidebar travel insurance banner
   - `blog/digital-nomad-guide-lisbon.html` — Mid-article hotel box, sidebar insurance

## How to Add a New Blog Post

1. **Copy the template**:
   ```bash
   cp blog/digital-nomad-guide-lisbon.html blog/your-new-post.html
   ```

2. **Update the content**:
   - Change all meta tags (title, description, OG tags, Twitter cards)
   - Update the JSON-LD structured data
   - Replace the article content (H1, H2, H3 hierarchy is important for SEO)
   - Update author information
   - Update related articles section
   - Replace affiliate placeholders

3. **Add to blog index**:
   - Add a new article card to `blog.html` in either the featured section or article grid
   - Include: image, category tag, title, excerpt, author, date, read time

4. **SEO checklist**:
   - [ ] Unique, keyword-rich `<title>` (50-60 characters)
   - [ ] Compelling `<meta description>` (150-160 characters)
   - [ ] OG image (1200x630px)
   - [ ] Proper heading hierarchy (one H1, multiple H2s, H3s as needed)
   - [ ] Internal links to other pages
   - [ ] Meaningful image alt attributes

## Design System

The site uses a warm, editorial travel magazine aesthetic.

**Colors** (see `styles/base.css`):
- Terracotta: `#C4704B` (primary CTA)
- Forest: `#2D4739` (headlines, nav)
- Cream: `#FDF8F3` (backgrounds)
- Sand: `#F5EDE4` (cards, sections)

**Typography**:
- Display: DM Serif Display (headlines)
- Body: Source Sans 3 (paragraphs, UI)

**Spacing**: 4px grid system (see `--space-*` variables)

## Authentication

The site uses localStorage for demo authentication:

- Login saves `{ loggedIn: true, name: "user@email.com" }`
- `scripts/auth.js` manages state across all pages
- Logged-in users see "Hi, [name] · Log Out" in the nav
- Voting on city pages is enabled only for logged-in users
- Wheel page shows "Save My Results" button when logged in

To check auth state programmatically:
```javascript
if (window.NomadAuth.isLoggedIn()) {
  console.log('User:', window.NomadAuth.getUserName());
}
```

## Browser Support

Tested on modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses standard ES6+ JavaScript (no transpilation needed).

## License

All rights reserved. This project is for demonstration purposes.

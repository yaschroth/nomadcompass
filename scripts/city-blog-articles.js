/**
 * City Blog Articles Section
 * Dynamically adds a "From the Blog" section to city pages
 * showing relevant articles based on city/country name.
 */
(function() {
  'use strict';

  // All blog articles with their associated cities and countries
  var articles = [
    {
      title: "The Ultimate Digital Nomad Guide to Lisbon in 2025",
      url: "../blog/digital-nomad-guide-lisbon.html",
      image: "https://images.pexels.com/photos/26898096/pexels-photo-26898096.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Sofia Andrade",
      readTime: "8 min read",
      cities: ["lisbon"],
      countries: ["portugal"]
    },
    {
      title: "How to Get a Portugal Digital Nomad Visa (Step by Step)",
      url: "../blog/portugal-digital-nomad-visa.html",
      image: "https://images.pexels.com/photos/31194122/pexels-photo-31194122.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Visa & Legal",
      author: "Elena Vasquez",
      readTime: "12 min read",
      cities: [],
      countries: ["portugal"]
    },
    {
      title: "Medellín vs Chiang Mai: Which City Wins for Nomads in 2025?",
      url: "../blog/medellin-vs-chiang-mai.html",
      image: "https://images.pexels.com/photos/15293179/pexels-photo-15293179.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Marcus Chen",
      readTime: "10 min read",
      cities: ["medellin", "medellín", "chiang mai"],
      countries: ["colombia", "thailand"]
    },
    {
      title: "The 10 Best Coworking Spaces in Bali for Remote Workers",
      url: "../blog/best-coworking-spaces-bali.html",
      image: "https://images.pexels.com/photos/32191652/pexels-photo-32191652.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Remote Work",
      author: "Jake Morrison",
      readTime: "9 min read",
      cities: ["bali", "canggu", "ubud", "seminyak"],
      countries: ["indonesia"]
    },
    {
      title: "Why Digital Nomads Are Flocking to Tbilisi, Georgia",
      url: "../blog/digital-nomads-tbilisi-georgia.html",
      image: "https://images.pexels.com/photos/17426635/pexels-photo-17426635.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Nina Kowalski",
      readTime: "7 min read",
      cities: ["tbilisi"],
      countries: ["georgia"]
    },
    {
      title: "Bangkok on a Budget: The Digital Nomad's Complete Guide",
      url: "../blog/bangkok-budget-guide.html",
      image: "https://images.pexels.com/photos/32105270/pexels-photo-32105270.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Priya Sharma",
      readTime: "9 min read",
      cities: ["bangkok"],
      countries: ["thailand"]
    },
    {
      title: "Mexico City: The New Nomad Capital of Latin America",
      url: "../blog/mexico-city-nomad-guide.html",
      image: "https://images.pexels.com/photos/20849711/pexels-photo-20849711.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Carlos Rivera",
      readTime: "10 min read",
      cities: ["mexico city"],
      countries: ["mexico"]
    },
    {
      title: "Cape Town: Sun, Surf, and Startups for Remote Workers",
      url: "../blog/cape-town-nomad-guide.html",
      image: "https://images.pexels.com/photos/32495850/pexels-photo-32495850.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Thabo Molefe",
      readTime: "8 min read",
      cities: ["cape town"],
      countries: ["south africa"]
    },
    {
      title: "Budapest: Europe's Most Underrated Nomad Destination",
      url: "../blog/budapest-nomad-guide.html",
      image: "https://images.pexels.com/photos/34431040/pexels-photo-34431040.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Anna Horvath",
      readTime: "8 min read",
      cities: ["budapest"],
      countries: ["hungary"]
    },
    {
      title: "Dubai for Digital Nomads: Luxury Meets Remote Work",
      url: "../blog/dubai-digital-nomad-guide.html",
      image: "https://images.pexels.com/photos/33953639/pexels-photo-33953639.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "City Guides",
      author: "Aisha Al-Mansouri",
      readTime: "9 min read",
      cities: ["dubai"],
      countries: ["united arab emirates", "uae"]
    },
    {
      title: "The Best European Cities for Digital Nomads in 2025",
      url: "../blog/best-european-cities-nomads.html",
      image: "https://images.pexels.com/photos/33736635/pexels-photo-33736635.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Lifestyle",
      author: "Sofia Andrade",
      readTime: "11 min read",
      cities: ["lisbon", "budapest", "tallinn", "split", "berlin", "tbilisi"],
      countries: ["portugal", "hungary", "estonia", "croatia", "germany", "georgia"]
    },
    {
      title: "How to Stay Productive While Working Remotely Abroad",
      url: "../blog/stay-productive-working-abroad.html",
      image: "https://images.pexels.com/photos/29119987/pexels-photo-29119987.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Remote Work",
      author: "Marcus Chen",
      readTime: "7 min read",
      cities: [],
      countries: [],
      general: true
    },
    {
      title: "The Rise of Coliving: Best Spaces for Digital Nomads in 2025",
      url: "../blog/rise-of-coliving-spaces.html",
      image: "https://images.pexels.com/photos/33145553/pexels-photo-33145553.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Lifestyle",
      author: "Jake Morrison",
      readTime: "10 min read",
      cities: [],
      countries: [],
      general: true
    },
    {
      title: "Digital Nomad Tax Guide: What You Need to Know in 2025",
      url: "../blog/digital-nomad-tax-guide.html",
      image: "https://images.pexels.com/photos/4386469/pexels-photo-4386469.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Visa & Legal",
      author: "Elena Vasquez",
      readTime: "12 min read",
      cities: [],
      countries: [],
      general: true
    },
    {
      title: "How to Build a Remote Work Routine That Actually Works",
      url: "../blog/remote-work-routine-guide.html",
      image: "https://images.pexels.com/photos/19935029/pexels-photo-19935029.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop",
      category: "Remote Work",
      author: "Priya Sharma",
      readTime: "8 min read",
      cities: [],
      countries: [],
      general: true
    }
  ];

  // Read city and country from the page
  var titleEl = document.querySelector('.city-hero-title');
  var countryEl = document.querySelector('.city-hero-country');
  if (!titleEl || !countryEl) return;

  var cityName = titleEl.textContent.trim().toLowerCase();
  var countryName = countryEl.textContent.trim().toLowerCase();

  // Find matching articles (city match first, then country, then general)
  var cityMatches = [];
  var countryMatches = [];
  var generalArticles = [];

  articles.forEach(function(article) {
    var isCityMatch = article.cities.some(function(c) {
      return cityName.indexOf(c) !== -1 || c.indexOf(cityName) !== -1;
    });
    var isCountryMatch = article.countries.some(function(c) {
      return countryName.indexOf(c) !== -1 || c.indexOf(countryName) !== -1;
    });

    if (isCityMatch) {
      cityMatches.push(article);
    } else if (isCountryMatch) {
      countryMatches.push(article);
    } else if (article.general) {
      generalArticles.push(article);
    }
  });

  // Build final list: city matches + country matches + general, max 3
  var selected = cityMatches.concat(countryMatches);
  if (selected.length < 3) {
    // Fill with general articles
    for (var i = 0; i < generalArticles.length && selected.length < 3; i++) {
      selected.push(generalArticles[i]);
    }
  }
  selected = selected.slice(0, 3);

  if (selected.length === 0) return;

  // Determine subtitle
  var subtitle = selected.some(function(a) {
    return a.cities.some(function(c) {
      return cityName.indexOf(c) !== -1 || c.indexOf(cityName) !== -1;
    });
  })
    ? 'Guides and tips for living in ' + titleEl.textContent.trim()
    : 'Helpful reads for digital nomads';

  // Build HTML
  var cardsHtml = selected.map(function(article) {
    return '' +
      '<article class="blog-rec-card">' +
        '<a href="' + article.url + '" class="blog-rec-card-link">' +
          '<img src="' + article.image + '" alt="" class="blog-rec-card-image">' +
          '<div class="blog-rec-card-body">' +
            '<span class="blog-rec-card-category">' + article.category + '</span>' +
            '<h3 class="blog-rec-card-title">' + article.title + '</h3>' +
            '<div class="blog-rec-card-meta">' +
              '<span>' + article.author + '</span>' +
              '<span>' + article.readTime + '</span>' +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>';
  }).join('');

  var sectionHtml = '' +
    '<section class="blog-rec-section">' +
      '<div class="container">' +
        '<div class="section-header">' +
          '<h2>From the Blog</h2>' +
          '<p>' + subtitle + '</p>' +
        '</div>' +
        '<div class="blog-rec-grid">' + cardsHtml + '</div>' +
        '<div style="text-align: center; margin-top: var(--space-6);">' +
          '<a href="../blog.html" class="btn btn-secondary">View All Articles &rarr;</a>' +
        '</div>' +
      '</div>' +
    '</section>';

  // Insert before Related Cities section
  var relatedSection = document.querySelector('.related-section');
  if (relatedSection) {
    relatedSection.insertAdjacentHTML('beforebegin', sectionHtml);
  }
})();

/**
 * The labels the services directory shows, in one place.
 *
 * build_services.cjs and build_service_city_pages.cjs each kept their own copy and they had already
 * drifted: a physiotherapist was a bone on the hub and a pulse on the city page, an estate agent a
 * key on one and a building on the other. Same directory, same row, two different glyphs.
 */

// A hospital and a barber looked identical at a glance, so each category carries its own Lucide
// glyph. 'tooth' is drawn in scripts/build_icons.cjs because Lucide has none, and 'smile' read as
// a mood rather than a molar. A pharmacy is a bottle rather than Lucide's 'pill', because the pill
// is a rounded bar drawn on the diagonal and so is the physio bone that sits beside it.
const CAT_ICON = {
  doctor: 'stethoscope', dentist: 'tooth', vet: 'paw-print', therapy: 'brain',
  physio: 'bone', optician: 'glasses', hair: 'scissors', legal: 'scale',
  tax: 'calculator', realestate: 'key', mechanic: 'wrench', fitness: 'dumbbell',
  translator: 'languages', pharmacy: 'pill-bottle',
};

// Plain plurals for a heading or a title. The labels in the data ("Doctors & clinics") read as
// column headings, which is right for a filter menu and wrong in a sentence.
const CAT_PLURAL = {
  doctor: 'doctors', dentist: 'dentists', vet: 'vets', therapy: 'therapists',
  physio: 'physiotherapists', optician: 'opticians', hair: 'hairdressers', legal: 'lawyers',
  tax: 'tax advisers', realestate: 'estate agents', mechanic: 'mechanics', fitness: 'gyms',
  translator: 'translators', pharmacy: 'pharmacies',
};

// Strongest evidence first, so the best-sourced row in a city leads.
// Checked ranks above an official list on purpose. An embassy roster is a real source and it
// is also months old and about a roster; a practice that answered a question about its own
// entry answered it this year. Listings sort on this, so the order is the tier.
const EV_RANK = { visited: 0, official: 1, 'self-declared': 2, directory: 3 };
const EV_LABEL = {
  official: 'Official list', visited: 'Checked with them',
  'self-declared': 'Says so itself', directory: 'Directory only',
};

module.exports = { CAT_ICON, CAT_PLURAL, EV_RANK, EV_LABEL };

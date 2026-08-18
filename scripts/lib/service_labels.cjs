/**
 * The labels the services directory shows, in one place.
 *
 * build_services.cjs and build_service_city_pages.cjs each kept their own copy and they had already
 * drifted: a physiotherapist was a bone on the hub and a pulse on the city page, an estate agent a
 * key on one and a building on the other. Same directory, same row, two different glyphs.
 */

// A hospital and a barber looked identical at a glance, so each category carries its own Lucide
// glyph. 'tooth' is drawn in scripts/build_icons.cjs because Lucide has none, and 'smile' read as
// a mood rather than a molar.
const CAT_ICON = {
  doctor: 'stethoscope', dentist: 'tooth', vet: 'paw-print', therapy: 'brain',
  physio: 'bone', optician: 'glasses', hair: 'scissors', legal: 'scale',
  tax: 'calculator', realestate: 'key', mechanic: 'wrench', fitness: 'dumbbell',
  translator: 'languages',
};

// Plain plurals for a heading or a title. The labels in the data ("Doctors & clinics") read as
// column headings, which is right for a filter menu and wrong in a sentence.
const CAT_PLURAL = {
  doctor: 'doctors', dentist: 'dentists', vet: 'vets', therapy: 'therapists',
  physio: 'physiotherapists', optician: 'opticians', hair: 'hairdressers', legal: 'lawyers',
  tax: 'tax advisers', realestate: 'estate agents', mechanic: 'mechanics', fitness: 'gyms',
  translator: 'translators',
};

// Strongest evidence first, so the best-sourced row in a city leads.
const EV_RANK = { official: 0, visited: 1, 'self-declared': 2, directory: 3 };
const EV_LABEL = {
  official: 'Official list', visited: 'We confirmed',
  'self-declared': 'Says so itself', directory: 'Directory only',
};

module.exports = { CAT_ICON, CAT_PLURAL, EV_RANK, EV_LABEL };

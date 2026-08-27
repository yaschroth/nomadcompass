/**
 * The intros, FAQs and closings on the ranking pages, brought back into line with the rankings.
 *
 * fix_best_blurb_costs.cjs corrected the per-city cards. The narrative fields around them were a
 * second, worse problem: 49 more cost figures, most with no currency mark, and in several cases the
 * sentence describes cities the ranking no longer contains at all. rank_best.cjs recomputes the top
 * fifteen from current city data; this prose is hand-written and never regenerates, so when the
 * Numbeo pipeline reset costPerMonth the membership moved out from under it.
 *
 * The /best/cheapest, /best/best-value and /best/broke FAQs were the extreme: their answers were
 * about Ninh Binh, Hue, Yazd, Prizren, Davao, Timisoara, Cluj-Napoca and Tartu, and not one of
 * those cities is on its page any more. Those answers are rewritten from the current lists. The
 * rest are figure corrections, each checked against the page it sits on.
 *
 * Every replacement below was written from the ranked list printed by rank_best, not adjusted by
 * eye. Where a claim could not survive the correct number ("the cheapest base here"), the claim
 * changed rather than the number.
 *
 * Idempotent by construction: a replacement that no longer matches is reported, not silently
 * skipped, so a second run after an edit tells you what moved.
 *
 * Usage: node scripts/fix_best_narrative.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const EDITS = [
  // --- beginner: Wellington $2,140 ... New York $5,720
  ['beginner',
    'Singapore, Zurich, and New York clear 4,500 to 6,500 a month, and even the cheaper English-speaking picks like Wellington and Brisbane sit around 3,200 to 3,500.',
    'Singapore, Zurich, and New York clear $3,800 to $5,700 a month, and even the cheaper English-speaking picks like Wellington and Brisbane sit around $2,100 to $2,800.'],
  ['beginner',
    'The catch is the price at 4,500 a month and constant humidity.',
    'The catch is the price at $3,840 a month and constant humidity.'],
  ['beginner',
    'Wellington delivers a safe, English-speaking landing at 3,200 a month.',
    'Wellington delivers a safe, English-speaking landing at $2,140 a month.'],
  ['beginner',
    'The range here runs from 3,200 a month in Wellington up to 6,500 in New York and Zurich, with most easy bases clustering around 4,000 to 4,500.',
    'The range here runs from $2,140 a month in Wellington up to $5,720 in New York, with most easy bases clustering around $2,500 to $3,500.'],

  // --- broke: Kuching $690 (wifi 7, English 7) ... Turku $1,660 (wifi 9, English 9)
  ['broke',
    'Live on $700 to $1,900 a month without sacrificing the essentials.',
    'Live on $690 to $1,660 a month without sacrificing the essentials.'],
  ['broke',
    'The cheapest bases here, like Ninh Binh at around $700 and Hue, Can Tho, and Solo near $800 a month, cover rent, food, and daily life comfortably in-country. What they do not cover is a big social scene or fiber-grade internet, so budget a coworking membership or a backup SIM for work-critical days. The mid-list European picks at $1,300 to $1,900 cost more but bundle in reliability, English, and easier visas, which can be worth the difference if your income depends on staying connected.',
    'The cheapest bases here, Kuching at $690 and Jeonju and Da Nang near $780 a month, cover rent, food, and daily life comfortably in-country. What they do not cover is a big social scene: community scores 3 in Kuching and 2 in Jeonju, so the saving is a social one as much as a financial one. The Finnish picks, Oulu at $1,550 and Turku at $1,660, cost roughly twice as much but bundle in 9/10 wifi, 9/10 English and a safety 10, which can be worth the difference if your income depends on staying connected.'],
  ['broke',
    'Among the true budget bases, Timisoara stands out with WiFi 8/10 and strong English at roughly $1,300 a month, followed by Cluj-Napoca and Tartu, also 8/10. If you can stretch to about $1,700 to $1,900, the Korean cities Daegu and Gwangju hit WiFi 9/10, the highest here. The sub-$900 Vietnamese and Indonesian picks sit at 5 or 6 out of 10, which is fine for calls and normal work but not built for constant heavy uploads without a coworking backup.',
    'Among the true budget bases, Jeonju stands out with WiFi 9/10 at roughly $770 a month, and Tainan and Kaohsiung follow at 8/10 for $830 and $860. If you can stretch to $1,550 or $1,660, Oulu and Turku pair the same 9/10 wifi with 9/10 English, the easiest combination here. Kuching at $690 is the outright cheapest and sits at 7/10, which is fine for calls and normal work but not built for constant heavy uploads without a coworking backup.'],
  ['broke',
    'Second, visas and flights: the Southeast Asian bargains often run on short tourist stamps that force border runs, while the European picks sit inside 90-day caps. Airfare and visa admin can quietly erase the gap between a $700 city and a $1,400 one you can settle into for months.',
    'Second, visas and flights: the Southeast Asian bargains often run on short tourist stamps that force border runs, while the Finnish picks sit inside 90-day Schengen caps. Airfare and visa admin can quietly erase the gap between a $690 city and a $1,400 one you can settle into for months.'],
  ['broke',
    'Sibiu, Tartu, Tainan, Daegu, and Gwangju all score 9/10 for safety, and even the lowest-cost picks like Hue and Can Tho sit at 8/10.',
    'Oulu and Turku score 10/10 for safety and Jeonju 9/10, and even the lowest-cost pick, Kuching, sits at 8/10.'],

  // --- climate: Agadir $900 and Koh Tao $1,000 are the floor; Barranquilla and Recife are not on it
  ['climate',
    'Barranquilla and Recife sit near the bottom on cost at roughly 1,300 to 1,400 a month while still scoring a 9 for climate, and Mazatlán offers similar value with a gentler learning curve.',
    'Agadir and Koh Tao sit at the bottom on cost at roughly $900 to $1,000 a month while still scoring a 9 for climate, and Mazatlán offers similar value at $1,380 with a gentler learning curve.'],

  // --- cost: the floor is Jodhpur $280, not Ninh Binh $700
  ['cost',
    'Fifteen bases where a modest remote salary covers rent, food, and a genuinely comfortable life for well under $1,000 a month.',
    'Fifteen bases where a modest remote salary covers rent, food, and a genuinely comfortable life for under $500 a month.'],
  ['cost',
    'Ninh Binh, Vietnam, and Yazd, Iran, top this ranking at an estimated $700 a month, the floor of our cost index. Both cover rent, food, and daily life on a modest income, though each asks you to accept a small nomad community, limited English, and slower internet in exchange for that rock-bottom budget.',
    'Jodhpur and Mysore, both in India, top this ranking at an estimated $280 and $290 a month, the floor of our cost index. Both cover rent, food, and daily life on a modest income, though each asks you to accept a small nomad community, weak air quality and slower internet in exchange for that rock-bottom budget.'],
  ['cost',
    'Can you really live on $800 a month as a nomad?',
    'Can you really live on $400 a month as a nomad?'],
  ['cost',
    'Yes, in the cities on this list an $800 budget covers a private apartment, daily local meals, transport, and modest leisure, assuming you live like a resident rather than an expat.',
    'Yes, in the cities on this list a $400 budget covers a private apartment, daily local meals, transport, and modest leisure, assuming you live like a resident rather than an expat.'],
  ['cost',
    'Low wages, inexpensive food, and cheap housing combine there, and Vietnam, Indonesia, Laos, and Cambodia all feature heavily on this list.',
    'Low wages, inexpensive food, and cheap housing combine there, and Indonesia features heavily on this list alongside India, which supplies eight of the fifteen.'],
  ['cost',
    'Several cities here score just four to six on wifi, adequate for calls but strained by heavy uploads. Hue and the Indonesian cities fare better than the mountain and rural bases like Sapa or Vang Vieng.',
    'Several cities here score just four to six on wifi, adequate for calls but strained by heavy uploads. Mysore and Jaipur fare better than the Bolivian and Nepali bases, where Cochabamba and Pokhara sit at 4.'],
  ['cost',
    'Hue offers the strongest all-round livability in this ranking, combining an $800 budget with excellent food, workable wifi, and a walkable historic core. For nature, Sapa is unmatched, and for deep culture, Yazd stands alone.',
    'Goa offers the strongest all-round livability in this ranking at a 7.2 Nomad Score on $350 a month. For nature, Pokhara is unmatched at a 10, and for deep culture, Jodhpur and Mysore both score 9.'],

  // --- country_mexico
  ['country_mexico',
    'For better value, Mazatlan delivers an 8.0 score at just 1,400 a month, and highland cities like Guanajuato (1,500) and Oaxaca (1,600) combine low cost with strong culture.',
    'For better value, Mazatlan delivers an 8.0 score at just $1,380 a month, and highland cities like Guanajuato ($1,060) and Oaxaca ($1,600) combine low cost with strong culture.'],

  // --- country_vietnam: Da Lat $490 is the floor, not Ninh Binh $700
  ['country_vietnam',
    'Compare costs from $700 a month, wifi, food, visa, and beach bases like Da Nang.',
    'Compare costs from $490 a month, wifi, food, visa, and beach bases like Da Nang.'],
  ['country_vietnam',
    'Several cities here run from $700 to $900 a month all in, and the food and coffee culture is a daily reason to stay.',
    'Several cities here run from $490 to $870 a month all in, and the food and coffee culture is a daily reason to stay.'],
  ['country_vietnam',
    'Ninh Binh is the cheapest base we rate at around $700 a month, with a perfect 10 for cost.',
    'Da Lat is the cheapest base we rate at around $490 a month, with a 9 for cost.'],

  // --- english: Cape Town $1,630 is the floor; the bulk sit $2,100 to $2,900
  ['english',
    'Cape Town, at roughly $2,000 a month, is by far the most affordable base on this ranking.',
    'Cape Town, at roughly $1,630 a month, is by far the most affordable base on this ranking.'],
  ['english',
    'Most cities here run $3,500 to $5,000 a month. The clearest exception is Cape Town near $2,000, with Wellington the best value in the pricier Australasian and Pacific tier.',
    'Most cities here run $2,100 to $2,900 a month, with San Diego at $4,400 the ceiling. The clearest exception is Cape Town near $1,630, with Wellington the best value in the pricier Australasian and Pacific tier.'],

  // --- families: Sapporo $1,230 is the floor, Lucerne $5,200 the ceiling
  ['families',
    'Ericeira is the most affordable at about 2,200 a month, followed by Sapporo, Oulu, Turku and Freiburg all under 2,900. At the other end, Zurich runs around 6,500 and Lucerne, Reykjavik and Tromso all exceed 5,000.',
    'Sapporo is the most affordable at about $1,230 a month, followed by Wanaka, Oulu, Turku and San Sebastian all under $2,200. At the other end, Lucerne runs around $5,200 and Zurich $4,500.'],

  // --- female: Tartu $1,480 to Singapore $3,840; Ericeira, Tallinn, Groningen and Valletta are not on it
  ['female',
    "the cities here run from Estonia's frugal Tartu at $1,900 a month to Singapore at $4,500.",
    "the cities here run from Estonia's frugal Tartu at $1,480 a month to Singapore at $3,840."],
  ['female',
    'Tartu at $1,900 a month is the cheapest, with Ericeira ($2,200), Tallinn, Groningen and Valletta ($2,400) also on the reasonable end. The top-ranked comfort leaders tend to cost more, from Wellington at $3,200 up to Singapore at $4,500, so you often trade budget for the highest safety and cleanliness scores.',
    'Tartu at $1,480 a month is the cheapest, with Wanaka ($1,500), Oulu ($1,550) and Turku ($1,660) also on the reasonable end. The top-ranked comfort leaders tend to cost more, from Wellington at $2,140 up to Singapore at $3,840, so you often trade budget for the highest safety and cleanliness scores.'],
  ['female',
    'Is Ericeira a good base for a solo woman?',
    'Is Wellington a good base for a solo woman?'],
  ['female',
    "It is one of the more social options here, with the list's highest community score (8), a warm climate (8) and safety 9, all for $2,200 a month near Lisbon. The main thing to check first is connectivity, since wifi scores a middling 6, so verify the internet at your specific accommodation if your work depends on video calls.",
    'It is one of the more social options here, pairing a community 6 with universal English at 10 and safety 9, all for $2,140 a month. Wifi is a strong 8 and air quality a 9. The tradeoff is the climate score of 5, so expect a wet and famously windy winter rather than the mild one the Nordic entries above it also lack.'],

  // --- food: Penang $740, Oaxaca $1,600, New York $5,720
  ['food',
    'Penang and Oaxaca lead on value, both around 1,600 a month with perfect food scores.',
    'Penang at $740 and Oaxaca at $1,600 lead on value, both with perfect food scores.'],
  ['food',
    'New York has unmatched culinary range, but at 6,500 a month it carries the worst cost score on this list.',
    'New York has unmatched culinary range, but at $5,720 a month it carries the worst cost score on this list.'],

  // --- nightlife: Cali $1,090, Cancun $1,340, Mexico City $1,680
  ['nightlife',
    'Cali, Colombia, at roughly 1,500 a month, is dramatically cheaper than anywhere else while still scoring a perfect ten for nightlife thanks to its salsa culture.',
    'Cali, Colombia, at roughly $1,090 a month, is dramatically cheaper than anywhere else while still scoring a perfect ten for nightlife thanks to its salsa culture.'],
  ['nightlife',
    'Mexico City and Cancún, both around 2,200 a month, offer rich scenes at a fraction of the cost of the American cities.',
    'Cancún at $1,340 and Mexico City at $1,680 offer rich scenes at a fraction of the cost of the American cities.'],

  // --- overall: Cancun $1,340 and Split $1,820
  ['overall',
    'Cancun and Split rank well while costing under 2,500 a month, proving affordability and balance can coexist.',
    'Cancun and Split rank well while costing under $2,000 a month, proving affordability and balance can coexist.'],

  // --- party: Berlin $2,520, Mexico City $1,680
  ['party',
    'and at 3,400 a month it is far more affordable than New York or London.',
    'and at $2,520 a month it is far more affordable than New York or London.'],
  ['party',
    'Mexico City, at 2,200 a month with a nightlife 9 and a community 9, offers world-class going out for a fraction of what the big US or UK cities cost.',
    'Mexico City, at $1,680 a month with a nightlife 9 and a community 9, offers world-class going out for a fraction of what the big US or UK cities cost.'],

  // --- region_africa: Alexandria $320 and Zanzibar $500; Chefchaouen and Luxor are not on it
  ['region_africa',
    'It costs around $2,000 a month.',
    'It costs around $1,630 a month.'],
  ['region_africa',
    'Chefchaouen and Luxor are the cheapest bases we rate in Africa, both around $1,000 a month with a cost score of 9.',
    'Alexandria and Zanzibar are the cheapest bases we rate in Africa, at $320 and $500 a month with cost scores of 9 and 8.'],

  // --- region_asia: Kuching $690 is the floor, Singapore $3,840 the ceiling
  ['region_asia',
    'On one side sit cheap tropical bases in Thailand, Vietnam, Indonesia and Malaysia where $1,300 to $2,000 a month buys a comfortable life near beaches and street food.',
    'On one side sit cheap tropical bases in Vietnam, Indonesia and Malaysia where $690 to $1,700 a month buys a comfortable life near beaches and street food.'],
  ['region_asia',
    'It is expensive at around $4,000 a month, so value-focused nomads often prefer Tbilisi (8.2 at $1,600) or Taipei (8.2 at $2,400).',
    'It is expensive at around $3,840 a month, so value-focused nomads often prefer Tbilisi (8.2 at $1,180) or Taipei (8.2 at $1,350).'],
  ['region_asia',
    'Kuching in Malaysian Borneo is the cheapest base we rate in Asia at about $1,300 a month, and it still scores 8.2 overall.',
    'Kuching in Malaysian Borneo is the cheapest base we rate in Asia at about $690 a month, and it still scores 8.2 overall.'],

  // --- region_northamerica: Montego Bay $1,300 to San Francisco $5,200; Toronto, Miami, Mazatlan and Oaxaca are not on it
  ['region_northamerica',
    'cities like San Diego, Vancouver and Toronto, but you pay for it: budgets here run $3,500 to $5,000 a month, and long-term visas are hard for non-citizens.',
    'cities like San Diego, Vancouver and Calgary, but you pay for it: budgets here run $2,250 to $5,200 a month, and long-term visas are hard for non-citizens.'],
  ['region_northamerica',
    'Mexican cities such as Cancún, Mexico City, Mazatlán and Oaxaca run $1,400 to $2,200 a month, welcome you on a generous entry stamp of up to 180 days',
    'Mexican cities such as Cancún, Mexico City and San Miguel de Allende run $1,340 to $1,680 a month, welcome you on a generous entry stamp of up to 180 days'],
  ['region_northamerica',
    'The US and Canadian cities cluster between $3,500 and $5,000 a month, with cost scores of 2 or 3, so Los Angeles and Miami at $5,000 sit at the top end.',
    'The US and Canadian cities cluster between $2,250 and $5,200 a month, with low cost scores throughout, so San Francisco at $5,200 and Honolulu at $4,600 sit at the top end.'],
  ['region_northamerica',
    'the US and Canadian cities from San Diego to Toronto deliver polish, at $3,500 to $5,000 a month.',
    'the US and Canadian cities from Calgary to San Francisco deliver polish, at $2,250 to $5,200 a month.'],
  ['region_northamerica',
    'San Diego runs about $4,500 a month, while Cancún delivers a similar score at roughly $2,200.',
    'San Diego runs about $4,400 a month, while Cancún delivers a similar score at roughly $1,340.'],
  ['region_northamerica',
    'Mazatlán is the cheapest base on the list at about $1,400 a month, followed by Oaxaca at $1,600, with Cancún, Mexico City and San Miguel de Allende all around $2,200.',
    'Montego Bay is the cheapest base on the list at about $1,300 a month, followed by Cancún at $1,340, with San Miguel de Allende and Mexico City both under $1,700.'],

  // --- region_oceania: Wanaka $1,500 to Byron Bay $3,500; Cairns and Christchurch are not on it
  ['region_oceania',
    'Even the more affordable Australian and New Zealand bases sit near $3,000 to $3,500 a month, and the marquee cities push $4,000 to $4,500. Mauritius is the standout exception at $2,200',
    'Even the more affordable Australian and New Zealand bases sit near $1,500 to $2,400 a month, and the marquee cities push $3,400 to $3,500. Mauritius sits in the middle at $2,200'],
  ['region_oceania',
    'though at around $4,500 a month it is also the most expensive base here.',
    'though at around $3,490 a month only Byron Bay costs more.'],
  ['region_oceania',
    'Mauritius is by far the cheapest at roughly $2,200 a month, well below every Australian and New Zealand city we rate. Within Australia and New Zealand, Hobart and Cairns are among the more affordable options at around $3,000 a month, with Wellington and Christchurch close behind at about $3,200.',
    'Wanaka in New Zealand is the cheapest at roughly $1,500 a month, followed by Dunedin at $1,900 and Wellington at $2,140. Mauritius at $2,200 undercuts every Australian city we rate, where Adelaide at $2,690 and Melbourne and Canberra at $2,740 are the more affordable options.'],

  // --- value: the whole FAQ was about Hue, Ninh Binh, Yazd, Prizren, Davao and Baguio, none of
  // which the ranking now contains. India supplies eight of the fifteen.
  ['value',
    'Santa Cruz and Cochabamba in Bolivia are the only others outside Asia and Africa.',
    'Santa Cruz in Bolivia is the only other entry outside Asia and Africa.'],
  ['value',
    'Davao and Baguio both cost 1,000 rather than 700, but the extra couple hundred dollars buys stronger English, better infrastructure, and a more complete daily experience.',
    'Iloilo and Yogyakarta cost $550 and $490 rather than $280, but the extra couple of hundred dollars buys stronger English, better infrastructure, and a more complete daily experience.'],
  ['value',
    "A digital nomad who lives on video calls will weigh Hue's 6 wifi very differently from someone who mostly writes offline, and a foodie will read Can Tho's 9 food score as the whole point.",
    "A digital nomad who lives on video calls will weigh Pokhara's 4 wifi very differently from someone who mostly writes offline, and a foodie will read Mysore's 8 food score as the whole point."],
  ['value',
    'A city charging 800 a month that feels like a 1,500 city scores well here.',
    'A city charging $800 a month that feels like a $1,500 city scores well here.'],
  ['value',
    'Cheapest ranks purely on price, so it would put the 700-a-month cities on top regardless of what living there is actually like. Value factors in quality too. Ninh Binh and Yazd are the cheapest here at 700, but Hue leads the value ranking at 800 because its 7.2 Nomad Score returns more livability per dollar.',
    'Cheapest ranks purely on price, so it would put the $280-a-month cities on top regardless of what living there is actually like. Value factors in quality too. Jodhpur is the cheapest here at $280, but Mysore leads the value ranking at $290 because its 6.3 Nomad Score returns more livability per dollar than Jodhpur’s 4.5.'],
  ['value',
    'What is the best value city in Europe?',
    'What is the best value city outside Asia?'],
  ['value',
    'Prizren in Kosovo is the only European city to make this ranking. It scores a 5.4 Nomad Score at 800 a month, which is genuinely cheap for the continent, with an easy visa at 8 and strong Ottoman-era character. English at 5 beats most Asian options here. The main tradeoffs are real winters, reflected in a climate score of 5, and a modest food scene, so it suits someone who values low-cost European living with authenticity over year-round warmth.',
    'Alexandria in Egypt is the highest non-Asian entry, third overall on a 6.1 Nomad Score at $320 a month. It pairs a culture 9 and a food 8 with a Mediterranean climate of 8, and the visa at 7 is straightforward. The tradeoffs are a cleanliness 4, a community 2 and wifi at 5, so it suits someone who wants a cheap coastal base with real history rather than a nomad scene. Santa Cruz in Bolivia is the only other entry outside Asia and Africa.'],
  ['value',
    'Asia dominates this ranking, and Hue in Vietnam leads it outright with a 7.2 Nomad Score at 800 a month. If you want the highest overall livability, Davao in the Philippines posts the top Nomad Score on the list at 7.6 for 1,000 a month, with the bonus of strong English. Iloilo is another standout, pairing a 7.4 score with English at 8. Between Vietnam, the Philippines, Indonesia, and beyond, this is where the value index concentrates.',
    'Asia dominates this ranking, and India supplies eight of the fifteen. Mysore leads outright on a 6.3 Nomad Score at $290 a month, with Goa close behind at $350 and the highest score of any Indian entry at 7.2. If you want the best overall livability rather than the best ratio, Iloilo in the Philippines posts the top Nomad Score on the list at 7.4 for $550 a month, with the bonus of English at 8. Between India, Indonesia, Vietnam and the Philippines, this is where the value index concentrates.'],
  ['value',
    'Hue delivers a 9-rated food scene and deep culture at 800 a month, and Davao posts the best Nomad Score on the whole list. What these cities do tend to lack is a large nomad community and, outside the Philippines, widespread English, so the compromise is social rather than a drop in overall quality.',
    'Mysore delivers an 8-rated food scene and a culture 9 at $290 a month, and Iloilo posts the best Nomad Score on the whole list at 7.4. What these cities do tend to lack is a nomad community, scoring 3 or below in nine of the fifteen, and clean air, so the compromise is social and environmental rather than a drop in overall quality.'],
];

const cache = new Map();
const read = (key) => {
  if (!cache.has(key)) {
    cache.set(key, JSON.parse(fs.readFileSync(path.join(ROOT, 'content-' + key + '.json'), 'utf8').replace(/^﻿/, '')));
  }
  return cache.get(key);
};

let done = 0;
let already = 0;
const missed = [];
const dirty = new Set();

const walk = (node, fn) => {
  if (Array.isArray(node)) { node.forEach((v, i) => { if (typeof v === 'string') node[i] = fn(v); else walk(v, fn); }); return; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (typeof node[k] === 'string') node[k] = fn(node[k]);
      else walk(node[k], fn);
    }
  }
};

for (const [key, from, to] of EDITS) {
  const json = read(key);
  let hit = 0;
  walk(json, (s) => {
    if (!s.includes(from)) return s;
    hit += 1;
    return s.split(from).join(to);
  });
  if (!hit) {
    // Re-running is normal. A passage that already reads like the replacement was done on an
    // earlier pass; one that matches neither means the source moved and the edit needs rewriting.
    if (JSON.stringify(json).includes(JSON.stringify(to).slice(1, -1))) { already += 1; continue; }
    missed.push(key + ': ' + from.slice(0, 72));
    continue;
  }
  done += hit;
  dirty.add(key);
}

if (missed.length) {
  console.error(missed.length + ' replacements match neither the old text nor the new, so the source moved:');
  missed.forEach((m) => console.error('  ' + m));
  process.exit(1);
}

if (APPLY) for (const key of dirty) fs.writeFileSync(path.join(ROOT, 'content-' + key + '.json'), JSON.stringify(read(key), null, 2) + '\n');
console.log(done + ' narrative passages corrected across ' + dirty.size + ' ranking pages'
  + (already ? ', ' + already + ' were already applied' : '') + (APPLY ? '' : '  (dry run)'));

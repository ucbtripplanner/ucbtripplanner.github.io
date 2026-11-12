# Research notes — 2026 Sonoma Coast (snapshot 2026-11-10 → 11-11)

Source material behind `../data.js` (Bodega Bay · Sonoma Coast · Russian River, optionally Point Reyes on the way;
Thu 11/26 – Sat 11/28/2026, 2 nights, 3 people (+ maybe 1), own 2WD car from Berkeley).
Each fact has a source URL; unconfirmed items are marked UNVERIFIED.
These are **notes, not the site**: where they disagree with `data.js` or `OPEN_QUESTIONS.md`, those two are newer.
In particular, the cross-check on 11/11 changed several values in these notes (Thursday start time, Saturday departure,
Hotel Dega check-in wording, the Rocker's Wharf fallback). The list of those changes is in `OPEN_QUESTIONS.md`.

How this trip was built (multi-agent, 2026-11-10 → 11-11):
1. 4 parallel researchers → `sights.md`, `lodging.md`, `dining.md`, `logistics.md`
2. 2 itinerary candidates ("근본 보데가 클래식" and "저스트레스"). A judge grafted them into **itinerary.md**
   and spot-checked the facts the plan depends on (§9 there).
3. 6 section writers drafted `../_build/*.js` (head + course, places, stays, food, prep) with Commons photos and checked pins.
   `tools/assemble_build.py` assembled those drafts into `../data.js`. Since then, `data.js` is the source of truth;
   `_build/` is only the bootstrap draft, so don't re-assemble over it.
4. Adversarial cross-check (fact areas + design/readability), then a fixer pass on 11/11 that applied the findings
   (see "Corrections from the cross-check" in `OPEN_QUESTIONS.md`).

| File | What |
|---|---|
| [itinerary.md](itinerary.md) | the judged plan: day-by-day table, lodging funnel, food/places shortlist, book-now list, budget, variants V1–V6, risks, spot-check log (11/11) |
| [sights.md](sights.md) | Point Reyes, Sonoma Coast SP beaches, Russian River, Occidental/Sebastopol sights; Thu/Fri/Sat hours, fees, parking, tides, sunset, wildlife, safety |
| [lodging.md](lodging.md) | Bodega Bay / river / Santa Rosa–Petaluma / Airbnb options with live Booking.com + official-engine prices (11/10–11), taxes and fees, cancellation and age rules, flood exposure |
| [dining.md](dining.md) | Thanksgiving dinners (2026 menus where posted), day-by-day eats, Thanksgiving closures, groceries, sales tax |
| [logistics.md](logistics.md) | routes and OSRM leg times, R-SR bridge toll, Caltrans road status (SR-1, SR-116 one-way signals), holiday traffic, gas, break-ins, ocean safety, weather normals, tides, emergency contacts |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | book-now items, deadlines, what to re-check before departure, corrections from the cross-check (don't reintroduce) |

Source conventions used in the notes: **[Official]** = the agency's or venue's own page or data feed;
**[Data]** = computed from open data (OSRM drive times, OSM); **[Secondary]** = third-party page;
**[BKG]** = Booking.com snapshot (it blocks automated re-checks, so treat those values as UNVERIFIED until re-read by a person).

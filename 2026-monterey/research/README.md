# Research notes — 2026 Monterey · Carmel (snapshot 2026-11-10/11)

These are the source notes behind `../data.js`. Each fact has a source URL, and anything unconfirmed is marked UNVERIFIED.
They are **notes, not the site**. Where a note disagrees with `data.js` or `OPEN_QUESTIONS.md`, the newer file wins. The
cross-check corrections are listed at the bottom of `OPEN_QUESTIONS.md`. Example: `itinerary.md` still shows the old Thursday
timings (07:45 start, tide pools until 17:15) and route keys (`go-101`, `bigsur-day`). The site now uses 07:30, 16:00–16:50 and
`go-bigsur`.

## How this trip was built (multi-agent, 2026-11-10/11)

1. **4 parallel researchers** wrote the four topic files: sights, lodging, dining, logistics.
2. **2 candidate itineraries** were drafted: (A) classic, Asilomar 2 nights, full Big Sur Friday; (B) relaxed, Ramada, Bixby-only
   Friday. A **judge** combined them into **itinerary.md**, using A's skeleton plus B's safety and verification fixes, and
   re-fetched the key facts on 11/11.
3. **Section writers** drafted `../_build/{head,course,places,stays,food,prep}.js` and the `images-*.json` files. Photos are
   Commons first, with official-site link previews for restaurants and hotels. Pins came from OSM or Wikipedia and were checked.
   `tools/assemble_build.py` merged the drafts into `data.js` and `images.json`.
4. **Adversarial cross-check** (fact areas, design, and desktop/mobile layout) → a fixer pass applied the confirmed findings
   on 11/11. Main fixes: tide-pool timing vs the beach's sunset closing, Thursday buffer times, Grotto's $15 minimum, Point Sur
   signal extent, Bixby wording, cheapest-option badges, rain-plan merge, shorter course notes, map route for Big Sur, and photos.

`_build/` is bootstrap-only. **Edit `data.js` directly from now on** and don't re-assemble over it.

**5. Group-taste pass (11/11, later):** the group dislikes seafood, redwoods/big trees, wineries, history/museums/missions and
galleries/architecture, and loves the aquarium, wildlife, scenery and golden-hour views. Default meals became Grotto's turkey
course (kept, verified seafood-free) → Ttobongee Chicken (Fri) → Crema ocean-view breakfast + Toribashi ramen (Sat); Sat 10:00
Carmel Mission became Carmel River State Beach (pinned at the Carmelo St lot); Fri 15:00 Carmel village became Carmel Beach +
Scenic Pathway. Sources and the full list are in
`dining.md` / `sights.md` (section "11/11 taste update") and `OPEN_QUESTIONS.md`. **Where these notes still recommend seafood
or the Mission, `data.js` wins.**

| File | What |
|---|---|
| [itinerary.md](itinerary.md) | The judged final plan: verdict, day-by-day, shortlists, map routes, decisions, book-now list, variants, budget, risks, and the 11/11 spot-check log |
| [sights.md](sights.md) | 47 candidate sights with Thu/Fri/Sat status, sun/moon/tides (USNO, NOAA 9413450), weather normals, wildlife, holiday events, road and closure status |
| [lodging.md](lodging.md) | Taxes/fees by city, an area comparison with OSRM drive times, live price snapshots (Booking + Asilomar engine, 11/10 night and 11/11 09:27–09:38), 21 candidates, booking strategy |
| [dining.md](dining.md) | Thanksgiving closures and dinners with posted 2026 menus, ~45 local classics (chowder, cioppino, Carmel bakeries, Big Sur, Korean), en-route food, groceries, sales tax |
| [logistics.md](logistics.md) | Routes (US-101/SR-156 vs SR-17 vs CA-1), holiday traffic, Big Sur Hwy 1 signals, tolls/Express Lanes, parking by stop, break-ins, ocean safety, gas, connectivity, emergencies, packing |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | What to book now, deadlines, what to re-check before departure, and the cross-check corrections (don't reintroduce) |

# Research notes — 2026 Mendocino · Fort Bragg (snapshot 2026-11-10/11)

Source material behind `../data.js`. Each fact has a source URL; unconfirmed items are marked UNVERIFIED.
These are **notes, not the site**. Where they disagree with `data.js` or OPEN_QUESTIONS.md, those two are newer.

How this trip was built (multi-agent, 2026-11-10/11):
1. 4 parallel researchers wrote the four topic files below (sights, lodging, dining, logistics).
2. Itinerary designers proposed candidate plans, and a judge merged them into **itinerary.md**. The judge re-fetched the key facts and re-ran OSRM for every leg (§13–14).
3. Section writers drafted `data.js` in parts (`../_build/*.js` + `images-*.json`: head/home, course, places, stays, food, prep), with Commons photos and checked pins. `tools/assemble_build.py` merged the parts.
4. An adversarial cross-check (facts per area + design on desktop and mobile) found ~40 issues, and the fix pass on 11/11 applied them. The corrections are listed in OPEN_QUESTIONS.md under "don't reintroduce".

| File | What |
|---|---|
| [itinerary.md](itinerary.md) | the judged final plan: Thu Hwy 128 → Headlands low tide → HarborView dinner; Fri Fort Bragg day; Sat Boonville → home. Also shortlists, variants, the spot-check log (§14) and the old open-question list |
| [sights.md](sights.md) | ~40 sights with Thu/Fri/Sat hours, Thanksgiving closures, fees, tides/sunset, Skunk Train availability, coordinates |
| [lodging.md](lodging.md) | neighborhoods, ~25 properties with live 11/11 prices (Booking, Airbnb, inns' own engines), taxes, cancellation deadlines, age rules |
| [dining.md](dining.md) | Thanksgiving dinners (menus, prices, hours), en-route food on CA-128, Fort Bragg / village eats, groceries, sales tax |
| [logistics.md](logistics.md) | routes (CA-128 / CA-20 / CA-1), OSRM times, holiday traffic, tolls, gas, parking, NVRC1 flooding, King Tides, weather, safety, emergency |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | book-now items, deadlines, what to re-check before the trip, and corrections from the cross-check |

Notes on method:
- Search engines were rate-limited during research, so facts come from direct fetches of official pages, booking-platform data (FareHarbor, Resy, Toast, webrez), OpenStreetMap and NOAA/NWS APIs.
- Drive times are OSRM free-flow. Holiday traffic, rain and photo stops add 20–30%.
- Prices are snapshots (mostly 11/11 morning PST). Several booking sites block bots (Booking.com, webrez, OpenTable, Tock, VRBO), so some prices couldn't be re-checked. OPEN_QUESTIONS.md lists them.

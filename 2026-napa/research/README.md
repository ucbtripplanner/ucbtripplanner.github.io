# Research notes — 2026 Napa Valley · Calistoga (snapshot 2026-11-10 → 11-11)

These notes are the sources behind `../data.js`. Each fact has a source URL, and anything not confirmed is marked UNVERIFIED.
They are **notes, not the site**. Where they disagree with `data.js` or OPEN_QUESTIONS.md, those two are newer. In particular, the
adversarial cross-check on 11/11 corrected several items in `itinerary.md`; the list is in OPEN_QUESTIONS.md under "Corrections".

How this trip was built (multi-agent, 2026-11-10 → 11-11):
1. Four parallel researchers wrote the four topic files below: sights, lodging, dining, logistics.
2. Candidate itineraries were drafted, and a judge combined them into **itinerary.md**:
   - (A) "근본 나파 클래식": Calistoga for 2 nights, walk to dinner, Silverado Trail home.
   - (B) "저스트레스": Napa base, early turkey dinner, home by 13:00. This became variant V1.
3. Section writers drafted `data.js` (home + course, places, stays, food, prep) in `../_build/`. They added Commons or official
   photos and checked pins (`tools/geocode.py`, OSM).
4. `tools/assemble_build.py` merged the drafts once. From that point `data.js` is the source of truth, so `_build/` must not be
   re-assembled.
5. Adversarial cross-check: a fact check of every area plus a desktop/mobile design review. A fixer then applied the findings on 11/11:
   - Golden Haven 72-hour cancellation
   - V1 sunset timing
   - shuttle and Bee wording
   - age-rule wording
   - budget recalculation
   - photos
   - shorter, de-duplicated callouts

| File | What |
|---|---|
| [itinerary.md](itinerary.md) | The judged final plan: shortlists (stays · food · places), book-now list, variants V1–V8, map routes, open questions. Some of it is superseded; see OPEN_QUESTIONS.md. |
| [sights.md](sights.md) | Wineries, geysers, spas, state parks, towns (Yountville · St. Helena · Calistoga · Sonoma/Glen Ellen). Covers Thu/Fri/Sat hours, Thanksgiving closures, prices, age rules, parking, sunset. |
| [lodging.md](lodging.md) | 18 hotels in detail plus more that were checked but not shortlisted, across Calistoga, Napa, American Canyon, Sonoma and Santa Rosa. Also Airbnb rules. Live Booking.com rates (11/10 23:54 – 11/11 10:50), local taxes (TOT + NVTID), cancellation deadlines, age and ID rules. |
| [dining.md](dining.md) | Thanksgiving dinners with menus and prices (Resy live checks 11/11), en-route lunches, bakeries, Oxbow, Korean food (none found in the valley), groceries and holiday hours. |
| [logistics.md](logistics.md) | Routes (SR-29 vs Silverado Trail, SR-12 detour), Carquinez toll, AAA/INRIX 2025 traffic pattern, Vine buses and shuttles, parking, DUI and ID rules, sunset (USNO), weather and fire, emergency contacts, packing list. |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | What to book now, deadlines, what to re-check before departure, and corrections from the cross-check. |

Method notes:
- Drive times are free-flow OSRM estimates, so holiday traffic will be slower.
- Prices are 11/10–11 snapshots.
- Booking.com, Choice, Best Western and Hilton pages often block automated reads. Hotel facts that rest only on Booking are labelled "(Booking)" on the site.
